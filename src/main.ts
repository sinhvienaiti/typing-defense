/**
 * Lời Gọi (index.html), step 1A "Cổng vui" (docs/td/BUILD_NOW.md) with
 * 1A.6 "Lời Gọi" (docs/td/BUILD_1A6.md) in the Văn Điền theme (SPLIT_PLAN D7):
 * the title screen first (a link with ?sandbox= skips it, ?title=1 / 0 forces
 * it), while the vocabulary loads; then the world steps at 60 Hz in a session,
 * the 2D view draws it, the calls' word cards float over it, the keys, the
 * mouse and the HUD act through the selection, sound and music follow its
 * events, Esc's pause card and the results card sit over it, and window.__td
 * lets the browser scenarios drive it through commands.
 */
import "./ui/td.css";
import { runFrameLoop } from "./kit/platform";
import { installDevHandle } from "./app/dev-handle";
import { installKeys, installPointer } from "./app/input";
import { learningBridge } from "./app/learning";
import { sandboxHtml } from "./app/sandbox";
import { Selection } from "./app/selection";
import { Session } from "./app/session";
import { loadDeck } from "./app/vocab";
import type { CommandBody } from "./sim/commands";
import type { RareEvent } from "./sim/events";
import { hashHex } from "./sim/hash";
import { canPlace } from "./sim/placement";
import { statsObject } from "./sim/stats";
import { PATH_MAX } from "./sim/stores/agents";
import { wordText } from "./typing/decks";
import { dockHtml } from "./ui/build-menu";
import { actionsHtml, Hud, REASON, statusHtml, stripHtml } from "./ui/hud";
import { loadSettings, SettingsCard } from "./ui/settings";
import { Sheet, type SheetAction } from "./ui/sheets";
import { teamHtml } from "./ui/team-bar";
import { TitleScreen, type TitleChoice } from "./ui/title";
import { TypingAudio } from "./view/audio-min";
import { DebugView } from "./view/debug-2d";
import { WordCards } from "./view/words/cards";

function byId<T extends HTMLElement = HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (element === null) throw new Error("typing defense: missing #" + id);
  return element as T;
}

const params = new URLSearchParams(window.location.search);
// 1A is the sandbox build: on unless ?sandbox=0.
const sandbox = params.get("sandbox") !== "0";
const seed = Number(params.get("seed") ?? "1") >>> 0 || 1;
const canvas = byId<HTMLCanvasElement>("tdCanvas");
const view = new DebugView(canvas);
let painted = false;
const settings = loadSettings();
const audio = new TypingAudio(settings);

// The title, made on first use (a run opened by a scenario's link never loads its painting); its choice waits for the run.
let title: TitleScreen | null = null;
let choose: (choice: TitleChoice) => void = () => {};
function showTitle(canContinue: boolean): void {
  const card = (): SettingsCard => new SettingsCard(settings, (changed) => audio.apply(changed), () => title?.settingsDone());
  title ??= new TitleScreen(document.body, { choose: (choice) => choose(choice), sound: (sound) => audio.ui(sound), wake: () => audio.resume() }, card(), sandbox);
  title.show(canContinue);
}
const asked = params.get("title");
if (asked === "1" || (asked !== "0" && !params.has("sandbox"))) showTitle(false);
/** A fresh run of the same link, past the title (`learn`: in the learn mode). */
const freshRun = (learn: boolean): string => {
  const next = new URLSearchParams(params);
  next.set("title", "0");
  if (learn) next.set("learn", "1");
  else next.delete("learn");
  return "?" + next.toString();
};

const { deck, source } = await loadDeck();
byId("tdHud").replaceChildren(); // the loading note
learningBridge().requestFocus(); // inside the portal only
const session = new Session({ seed, sandbox, deck });
const world = session.world;
const selection = new Selection(world, (command) => session.send(command));
const cards = new WordCards(byId("tdWords"), (x, z) => view.project(x, z));
let imeWarning = false;
const learnMode = (): void => session.send({ t: "sandbox", op: { op: "mode", value: "learn" } });
if (params.get("learn") === "1") learnMode();
/** A run has begun: the title was passed (or never shown); a new choice then opens a fresh page. */
let begun = title === null;
choose = (choice) => {
  if (choice === "continue") selection.paused = false;
  else if (begun) return void (window.location.search = freshRun(choice === "learn"));
  else if (choice === "learn") learnMode();
  begun = true;
  title?.hide();
};

/** Buttons and keys: the camera's and the sound's own, the rest the selection's. */
function act(action: string): void {
  const [name, dx, dy] = action.split(":");
  if (name === "pan") view.panBy(Number(dx) * 60, Number(dy) * 60);
  else if (name === "mute") audio.muted = !audio.muted;
  else selection.act(action);
}

const hud = new Hud(byId("tdHud"), act);
for (const type of ["pointerdown", "keydown"]) window.addEventListener(type, () => audio.resume());
/** Esc's pause card and the results card; "Xem bản đồ" puts the results away. */
let mapOnly = false;
const sheet = new Sheet(document.body, new SettingsCard(settings, (changed) => audio.apply(changed), () => sheet.settingsDone()), (action: SheetAction) => {
  if (action === "resume") selection.act("pause");
  else if (action === "map") mapOnly = true;
  else if (action === "again") window.location.search = freshRun(false);
  else if (action === "title") showTitle(world.phase !== "defeat");
});
// The title takes every key while it is up; a card takes its own (arrows, Enter, Esc) and lets the rest through.
window.addEventListener("keydown", (event) => {
  const open = title?.open === true ? title : sheet.open ? sheet : null;
  if (open === null) return;
  const taken = open.key(event);
  if (taken) event.preventDefault();
  if (taken || open === title) event.stopImmediatePropagation();
}, true);
installKeys(window, {
  // Paused (Esc, or Space's tactical pause), nothing is typed: words wait.
  send: (command) => !selection.halted && (session.send(command), true),
  act,
  onVietnamese: () => (imeWarning = true),
  allowUntrusted: params.get("untrusted") === "1",
});
installPointer(canvas, view, {
  pointer: (p) => selection.pointer(p),
  // A call's bubble (a word card, or a dim one on the map) sends the agent there (BUILD_1A6 §8).
  click: (p, right, at) => {
    const call = right || selection.building ? -1 : Math.max(cards.callAt(at.x, at.y), view.callAt(at.x, at.y));
    if (call >= 0) selection.toCall(call);
    else selection.click(p, right);
  },
});

function showHud(): void {
  const refused = [...recent].reverse().find((event) => event.t === "rejected" && world.tick - event.tick < 150);
  const notices = [
    selection.tactical ? "Tạm dừng chiến thuật · Space để chạy tiếp" : "", imeWarning ? "Tắt bộ gõ tiếng Việt để gõ" : "", source === "fallback" ? "Từ dự phòng (máy chủ không có từ vựng)" : "",
  ];
  hud.update([
    statusHtml(world, sandbox, selection.halted, audio.muted, notices.filter((notice) => notice !== "")),
    sandbox && selection.panel ? sandboxHtml(world) : "",
    teamHtml(world, selection.agent),
    stripHtml(world, refused?.t === "rejected" ? (REASON[refused.reason] ?? refused.reason) : "", selection.tactical),
    dockHtml(world, selection),
    actionsHtml(world, selection.tactical),
  ]);
  document.body.classList.toggle("is-paused", selection.paused);
  sheet.show(title?.open === true ? "" : world.phase === "defeat" ? (mapOnly ? "" : "results") : selection.paused ? "pause" : "", world);
}

const resize = (): void => {
  const ui = Math.max(0.8, Math.min(1.2, Math.min(window.innerWidth / 1600, window.innerHeight / 900)));
  document.documentElement.style.setProperty("--ui", ui.toFixed(3));
  document.documentElement.style.setProperty("--hud", Math.max(1, ui).toFixed(3));
  view.resize(window.innerWidth, window.innerHeight, Math.min(2, window.devicePixelRatio || 1), world.map.halfM, 60 * Math.max(1, ui));
  view.draw(world, selection);
  painted = true;
};
window.addEventListener("resize", resize);
const recent: RareEvent[] = [];
resize();
showHud();

/** The last 600 frames' costs in ms (BUILD_NOW §7 gate 5): the steps with the HUD and sound, then the 2D view with the cards. */
const costs = { update: [] as number[], draw: [] as number[] };
function timed(list: number[], run: () => void): void {
  const start = performance.now();
  run();
  list.push(performance.now() - start);
  if (list.length > 600) list.shift();
}

runFrameLoop({
  update(now) {
    timed(costs.update, () => {
      selection.update();
      session.paused = selection.halted || title?.open === true;
      session.orders = selection.tactical; // the hand's orders act at once, typing waits
      session.frame(now);
      const fresh = world.events.rare.splice(0);
      cards.read(fresh, world, now);
      audio.read(fresh, world, now);
      audio.frame(title?.open === true ? null : world, now);
      recent.push(...fresh);
      if (recent.length > 400) recent.splice(0, recent.length - 400);
      showHud();
    });
  },
  draw(now) {
    timed(costs.draw, () => {
      view.draw(world, selection);
      cards.draw(world, now, window.innerWidth, window.innerHeight, hud.boxes(window.innerWidth, window.innerHeight));
    });
    painted = true;
  },
  onError() {
    selection.paused = true;
  },
});

installDevHandle({
  ready: () => painted,
  // What a Node replay of log() needs besides the log (scripts/td/replay.ts).
  flags: () => ({ sandbox, seed: world.seed, content: world.c.hash, deck: deck.hash, vocabulary: source }),
  send: (command: CommandBody) => session.send(command),
  // TK 25.12's load test: n enemies on the routes, through the sandbox's logged command.
  flood: (n: number) => session.send({ t: "sandbox", op: { op: "flood", value: n } }),
  costs: () => ({ update: costs.update.slice(), draw: costs.draw.slice() }),
  stats: () => statsObject(world.stats),
  hash: () => hashHex(world),
  defs: () => world.c.buildings.map((building) => building.id),
  canPlace: (id: string, x: number, z: number) => canPlace(world, world.c.buildingIndex(id), Math.round(x * 4), Math.round(z * 4)),
  events: () => recent.slice(),
  log: () => session.log.slice(),
  // Ages in ticks; the call is its id.
  liveWords: () => {
    const W = world.words;
    return W.live().map((s) => ({
      id: W.id(s), text: wordText(deck, W.word[s]!), typed: W.typed[s]!, errors: W.errors[s]!, tier: W.tier[s]!, call: world.calls.id(W.call[s]!),
      age: world.tick - W.born[s]!, locked: world.typing.router.lock === s,
    }));
  },
  typing: () => ({ chain: world.typing.chain, lock: world.typing.router.lock, typedTicks: world.typing.typedSum }),
  ui: () => ({ agent: selection.agent, focus: selection.focus, call: selection.call, building: selection.building, kind: selection.kind, paused: selection.paused, tactical: selection.tactical, panel: selection.panel }),
  // Agents: hero first; mode as MODE in sim/stores/walkers.ts; goal a building id (−1 none); path: x, z, x, z… ahead. Calls: kind as CALL_KIND.
  state: () => {
    const { buildings: B, units: U, agents: A, npcs: N, calls: C } = world;
    return {
      tick: world.tick, phase: world.phase, day: world.day, phaseEnd: world.phaseEnd, wave: world.wave, lives: world.lives, mode: world.mode,
      gold: world.gold / 1000, wood: world.wood, food: world.food, seeds: world.seeds, knowledge: world.knowledge,
      enemies: world.enemies.count, projectiles: world.projectiles.count,
      buildings: B.live().map((b) => ({
        id: B.id(b), def: world.c.buildings[B.def[b]!]!.id, level: B.level[b]!, x: B.x[b]!, z: B.z[b]!, ready: B.ready[b] === 1, upTo: B.upTo[b]!, progress: B.progress[b]!,
        charges: B.charges[b]!, pile: B.pile[b]! / 1000,
      })),
      soldiers: U.live().map((s) => ({ alive: U.hp[s]! > 0, contact: U.contact[s] === 1, x: U.x[s]!, z: U.z[s]! })),
      agents: A.live().map((a) => ({
        x: A.x[a]!, z: A.z[a]!, mode: A.mode[a]!, goal: A.goal[a]! < 0 ? -1 : B.id(A.goal[a]!),
        path: Array.from(A.path.subarray((a * PATH_MAX + A.next[a]!) * 2, (a * PATH_MAX + A.pathN[a]!) * 2)),
      })),
      npcs: N.live().map((n) => ({ kind: N.kind[n]!, task: N.task[n]!, job: N.job[n]!, x: N.x[n]!, z: N.z[n]! })),
      calls: C.live().map((c) => ({ id: C.id(c), kind: C.kind[c]!, open: C.state[c] === 1, bright: C.bright[c] === 1, words: C.words[c]!, done: C.done[c]!, x: C.x[c]!, z: C.z[c]!, agent: C.agent[c]! })),
      review: Array.from(world.typing.review.subarray(0, world.typing.reviewN), (word) => wordText(deck, word)),
      trees: world.map.trees.map(([x, z], t) => ({ x, z, standing: world.trees.standing[t] === 1, marked: world.trees.marked[t] === 1 })),
    };
  },
});

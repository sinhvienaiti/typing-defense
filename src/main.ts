/**
 * Lời Gọi (index.html), step 1A "Cổng vui" (docs/td/BUILD_NOW.md) with
 * 1A.6 "Lời Gọi" (docs/td/BUILD_1A6.md) and 1B's map 1 with Mộc Tinh
 * (docs/td/BUILD_1B.md) in the Văn Điền theme (SPLIT_PLAN D7): the title screen
 * first (a link with ?sandbox= skips it, ?title=1 / 0 forces it), while the
 * vocabulary loads; the story stage, or the sandbox with ?sandbox=1. A lost run
 * may be played again from the day of the night it was lost ("Chơi lại Ngày n":
 * the page reloads, replays the log to that day's start and checks its hash).
 * Then the world steps at 60 Hz in a session,
 * the 2D view draws it, the calls' word cards float over it, the keys, the
 * mouse and the HUD act through the selection, sound and music follow its
 * events, Esc's pause card and the results card sit over it, and window.__td
 * lets the browser scenarios drive it through commands. The typing profile
 * (app/skill.ts, BALANCE.md §2) gives the run its header (E, pace k, the pace
 * director by the settings) and takes each day and night's typing after it.
 */
import "./ui/td.css";
import { runFrameLoop } from "./kit/platform";
import { installDevHandle } from "./app/dev-handle";
import { installKeys, installPointer } from "./app/input";
import { learningBridge } from "./app/learning";
import { loadSkill, paceHeader, saveSkill, SkillTally } from "./app/skill";
import { updateSkill } from "./kit/balance";
import { sandboxHtml } from "./app/sandbox";
import { Selection } from "./app/selection";
import { Session } from "./app/session";
import { loadDeck } from "./app/vocab";
import type { Command, CommandBody } from "./sim/commands";
import type { Mode } from "./content/types";
import type { PaceHeader } from "./sim/systems/pace";
import type { RareEvent } from "./sim/events";
import { hashHex } from "./sim/hash";
import { canPlace } from "./sim/placement";
import { setMode, setPace } from "./sim/systems/pace";
import { runLog } from "./sim/world";
import { statsObject } from "./sim/stats";
import { PATH_MAX } from "./sim/stores/agents";
import { wordText } from "./typing/decks";
import { dockHtml } from "./ui/build-menu";
import { actionsHtml, BossBanner, Hud, REASON, statusHtml, stripHtml } from "./ui/hud";
import { ProfileCard } from "./ui/profile";
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
// The story stage of map 1 (BUILD_1B §4.1); the sandbox with ?sandbox=1.
const sandbox = params.get("sandbox") === "1";
const seed = Number(params.get("seed") ?? "1") >>> 0 || 1;
const canvas = byId<HTMLCanvasElement>("tdCanvas");
const view = new DebugView(canvas);
let painted = false;
const settings = loadSettings();
const audio = new TypingAudio(settings);
let profile = loadSkill(params.get("learn") === "1" ? "learn" : "balanced");
/** The run header from the profile and the "Nhịp tự điều" setting. */
const header = () => paceHeader(profile, settings.pace);

// The title, made on first use (a run opened by a scenario's link never loads its painting); its choice waits for the run.
let title: TitleScreen | null = null;
let choose: (choice: TitleChoice) => void = () => {};
function showTitle(canContinue: boolean): void {
  const card = (): SettingsCard => new SettingsCard(settings, (changed) => audio.apply(changed), () => title?.settingsDone());
  const hooks = { choose: (choice: TitleChoice) => choose(choice), sound: audio.ui.bind(audio), wake: () => audio.resume(), profile: (shown: ProfileCard) => shown.open(profile, settings.pace ? header().k : null) };
  title ??= new TitleScreen(document.body, hooks, card(), new ProfileCard(() => title?.settingsDone()), true);
  title.show(canContinue);
}
/** "Chơi lại Ngày n" (BUILD_1B §4.3): the run's header, its log up to day n's start, the hash there; one page load reads it. */
type Retry = { seed: number; sandbox: boolean; deck: string; content: string; mode: Mode; header: PaceHeader & { expected: number }; day: number; tick: number; hashes: string[]; log: Command[] };
function takeRetry(): Retry | null {
  try {
    const raw = sessionStorage.getItem("td.retry");
    sessionStorage.removeItem("td.retry");
    const retry = raw === null ? null : (JSON.parse(raw) as Retry);
    return retry !== null && retry.seed === seed && retry.sandbox === sandbox ? retry : null;
  } catch {
    return null;
  }
}
const retry = takeRetry();
const asked = params.get("title");
if (retry === null && (asked === "1" || (asked !== "0" && !params.has("sandbox")))) showTitle(false);
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
let runHeader = retry?.header ?? header();
/** The run's mode at its start (the replay's header): Học with ?learn=1 or the title's choice. */
let startMode: Mode = retry?.mode ?? (params.get("learn") === "1" ? "learn" : "balanced");
const session = new Session({ seed, sandbox, deck, expected: runHeader.expected, pace: runHeader, mode: startMode });
const world = session.world;
/** The replay's end, hashed before the first live step (review R1: the scenarios check this, not the kept hashes). */
let replayed: { day: number; tick: number; hash: string; matched: boolean } | null = null;
if (retry !== null) {
  runLog(world, retry.log, retry.tick);
  replayed = { day: retry.day, tick: world.tick, hash: hashHex(world), matched: false };
  replayed.matched = world.c.hash === retry.content && deck.hash === retry.deck && replayed.hash === retry.hashes[retry.day];
  // Another rule or vocabulary since: the run starts over (the replay would not be the run that was lost).
  if (!replayed.matched) window.location.search = "?" + new URLSearchParams({ ...Object.fromEntries(params), title: "0" }).toString();
  session.log.push(...retry.log);
  session.dayHashes.push(...retry.hashes);
  world.events.rare.length = 0;
}
const tally = new SkillTally(world);
// A run left mid-cycle counts as a quit (the trend keeps it; the measures do not); the title alone is no run.
window.addEventListener("pagehide", () => world.tick > 0 && saveSkill(updateSkill(profile, tally.sample(world, "quit")).profile));
const selection = new Selection(world, (command) => session.send(command));
const cards = new WordCards(byId("tdWords"), (x, z) => view.project(x, z));
let imeWarning = false;
const learnMode = (): void => setMode(world, (startMode = "learn"));
/** A run has begun: the title was passed (or never shown); a new choice then opens a fresh page. */
let begun = title === null;
choose = (choice) => {
  if (choice === "continue") selection.paused = false;
  else if (begun) return void (window.location.search = freshRun(choice === "learn"));
  else if (choice === "learn") learnMode();
  // Settings changed on the title apply to this run while it has not stepped (BALANCE.md §4.1: set before the run).
  if (world.tick === 0) setPace(world, (runHeader = header()));
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
const banner = new BossBanner();
for (const type of ["pointerdown", "keydown"]) window.addEventListener(type, () => audio.resume());
/** Esc's pause card and the results card; "Xem bản đồ" puts the results away. */
let mapOnly = false;
const sheet = new Sheet(document.body, new SettingsCard(settings, (changed) => audio.apply(changed), () => sheet.settingsDone()), (action: SheetAction) => {
  if (action === "resume") selection.act("pause");
  else if (action === "map") mapOnly = true;
  else if (action === "again") window.location.search = freshRun(false);
  else if (action === "retry") retryDay();
  else if (action === "copy") copyNumbers();
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
    selection.tactical ? "Tạm dừng chiến thuật · Space để chạy tiếp" : "", imeWarning ? "Tắt bộ gõ tiếng Việt để gõ" : "",
    world.phase === "day" && world.wood >= 150 && world.gold < 50000 ? "Gỗ thừa: bán gỗ ở thẻ Lũy" : "", source === "fallback" ? "Từ dự phòng (máy chủ không có từ vựng)" : "",
  ];
  const now = performance.now();
  hud.update([
    statusHtml(world, sandbox, selection.halted, audio.muted, notices.filter((notice) => notice !== ""), banner.hit(now)),
    sandbox && selection.panel ? sandboxHtml(world) : "",
    teamHtml(world, selection.agent),
    stripHtml(world, refused?.t === "rejected" ? (REASON[refused.reason] ?? refused.reason) : "", selection.tactical),
    dockHtml(world, selection),
    actionsHtml(world, selection.tactical),
    banner.html(world, now),
  ]);
  document.body.classList.toggle("is-paused", selection.paused);
  const over = world.phase === "defeat" || world.phase === "victory";
  sheet.show(title?.open === true ? "" : over ? (mapOnly ? "" : "results") : selection.paused ? "pause" : "", world, { story: !sandbox, retried: retry?.day ?? 0 });
}

/** The boss bar takes the top of the screen from its warning on: the field moves down under it (BUILD_1B §13.1). */
let bossTop = 0;
const resize = (): void => {
  const ui = Math.max(0.8, Math.min(1.2, Math.min(window.innerWidth / 1600, window.innerHeight / 900)));
  document.documentElement.style.setProperty("--ui", ui.toFixed(3));
  document.documentElement.style.setProperty("--hud", Math.max(1, ui).toFixed(3));
  bossTop = world.boss.stage > 0 ? 64 * Math.max(1, ui) : 0;
  view.resize(window.innerWidth, window.innerHeight, Math.min(2, window.devicePixelRatio || 1), world.map.halfM, 60 * Math.max(1, ui), bossTop);
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
      const sample = tally.read(fresh, world);
      if (sample !== null) saveSkill((profile = updateSkill(profile, sample).profile));
      cards.read(fresh, world, now);
      if ((world.boss.stage > 0) !== bossTop > 0) resize();
      view.boss.read(fresh, world, now);
      view.fx.read(fresh, world, now);
      banner.read(fresh, world, now);
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

/** A play-test's numbers for BALANCE.md §7 B9: the run's flow (night meter) and the profile the game keeps. */
function balanceOf() {
  const outcome = world.phase === "defeat" ? "lost" : world.phase === "victory" ? "won" : "quit";
  return { flow: world.pace.meter.summary(outcome), night: world.pace.night.summary(), day: world.pace.day.summary(), profile, stats: statsObject(world.stats), lives: world.lives, dayNumber: world.day };
}

/** "Chép số chơi thử" (BUILD_1B §14): the numbers to the clipboard, else a .json file to save. */
function copyNumbers(): void {
  const text = JSON.stringify(balanceOf());
  const save = (): void => {
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([text], { type: "application/json" })), download: "loi-goi-choi-thu.json" });
    a.click();
    URL.revokeObjectURL(a.href);
  };
  if (navigator.clipboard === undefined) save();
  else navigator.clipboard.writeText(text).catch(save);
}

/** "Chơi lại Ngày n": the log up to the start of the lost night's day, and the hashes kept, for the next page load. */
function retryDay(): void {
  const day = world.day;
  const at = world.dayStarts[day];
  if (at === undefined || session.dayHashes[day] === undefined) return void (window.location.search = freshRun(false));
  const kept: Retry = { seed, sandbox, deck: deck.hash, content: world.c.hash, mode: startMode, header: runHeader, day, tick: at, hashes: session.dayHashes.slice(0, day + 1), log: session.log.filter((command) => command.tick < at) };
  try {
    sessionStorage.setItem("td.retry", JSON.stringify(kept));
  } catch {
    return void (window.location.search = freshRun(false));
  }
  window.location.search = freshRun(startMode === "learn");
}

installDevHandle({
  ready: () => painted,
  // What a Node replay of log() needs besides the log (scripts/td/replay.ts).
  flags: () => ({ sandbox, seed: world.seed, content: world.c.hash, deck: deck.hash, vocabulary: source, expected: runHeader.expected, pace: { k: runHeader.k, director: runHeader.director }, mode: startMode }),
  send: (command: CommandBody) => session.send(command),
  // TK 25.12's load test: n enemies on the routes, through the sandbox's logged command.
  flood: (n: number) => session.send({ t: "sandbox", op: { op: "flood", value: n } }),
  costs: () => ({ update: costs.update.slice(), draw: costs.draw.slice() }),
  stats: () => statsObject(world.stats),
  // A play-test's numbers for BALANCE.md §7 B9: the run's flow (night meter) and the profile the game keeps.
  balance: () => balanceOf(),
  dayHashes: () => session.dayHashes.slice(),
  retry: () => replayed,
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
        charges: B.charges[b]!, pile: B.pile[b]! / 1000, stunned: B.stunUntil[b]! > world.tick,
      })),
      boss: (() => {
        const S = world.boss;
        const e = world.enemies.slotOf(S.e);
        return { ...S, targets: Array.from(S.targets.subarray(0, S.targetN)), hp: e < 0 ? 0 : world.enemies.hp[e]!, dist: e < 0 ? -1 : world.enemies.dist[e]!, x: e < 0 ? 0 : world.enemies.x[e]!, z: e < 0 ? 0 : world.enemies.z[e]! };
      })(),
      soldiers: U.live().map((s) => ({ alive: U.hp[s]! > 0, contact: U.contact[s] === 1, x: U.x[s]!, z: U.z[s]! })),
      // R2: Tối Thượng; the enemies with a mechanic (drumming until castEnd, stunned until stunUntil).
      ult: { ...world.ult, aimed: undefined },
      foes: world.enemies.live().filter((e) => world.c.enemies[world.enemies.def[e]!]!.ability !== null || world.c.enemies[world.enemies.def[e]!]!.def.split !== undefined).map((e) => ({
        id: world.enemies.id(e), def: world.c.enemies[world.enemies.def[e]!]!.id, x: world.enemies.x[e]!, z: world.enemies.z[e]!, hp: world.enemies.hp[e]!, castEnd: world.enemies.castEnd[e]!, stunUntil: world.enemies.stunUntil[e]!,
      })),
      agents: A.live().map((a) => ({
        x: A.x[a]!, z: A.z[a]!, mode: A.mode[a]!, goal: A.goal[a]! < 0 ? -1 : B.id(A.goal[a]!), panic: A.panic[a]!,
        path: Array.from(A.path.subarray((a * PATH_MAX + A.next[a]!) * 2, (a * PATH_MAX + A.pathN[a]!) * 2)),
      })),
      npcs: N.live().map((n) => ({ kind: N.kind[n]!, task: N.task[n]!, job: N.job[n]!, x: N.x[n]!, z: N.z[n]! })),
      calls: C.live().map((c) => ({ id: C.id(c), kind: C.kind[c]!, open: C.state[c] === 1, bright: C.bright[c] === 1, words: C.words[c]!, done: C.done[c]!, x: C.x[c]!, z: C.z[c]!, agent: C.agent[c]!, burst: C.burst[c] === 1, foe: C.foe[c]!, expire: C.expire[c]! })),
      review: Array.from(world.typing.review.subarray(0, world.typing.reviewN), (word) => wordText(deck, word)),
      trees: world.map.trees.map(([x, z], t) => ({ x, z, standing: world.trees.standing[t] === 1, marked: world.trees.marked[t] === 1 })),
    };
  },
});

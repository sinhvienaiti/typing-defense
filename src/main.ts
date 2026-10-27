/**
 * Lời Gọi (index.html), step 1A "Cổng vui" (docs/td/BUILD_NOW.md) with 1A.6 "Lời Gọi" (docs/td/BUILD_1A6.md) and 1B's
 * map 1 with Mộc Tinh (docs/td/BUILD_1B.md) in the Văn Điền theme (SPLIT_PLAN D7): the title screen first (a link with
 * ?sandbox= skips it, ?title=1 / 0 forces it), while the vocabulary loads; the story stage, or the sandbox with
 * ?sandbox=1. A lost run may be played again from the day of the night it was lost ("Chơi lại Ngày n": the page
 * reloads, replays the log to that day's start and checks its hash). Then the world steps at 60 Hz in a session, the 2D
 * view draws it, the calls' word cards float over it, the keys, the mouse and the HUD act through the selection, sound
 * and music follow its events, Esc's pause card and the results card sit over it, and window.__td lets the browser
 * scenarios drive it through commands. The typing profile (app/skill.ts, BALANCE.md §2) gives the run its header (E,
 * pace k, the pace director by the settings) and takes each day and night's typing after it. The title, its settings
 * and Hồ sơ gõ cards, the pause and results cards, sound and the sandbox panel are chunks of their own (BUILD_1B §20):
 * at "/" the page starts with this entry and the title only (scripts/bundle-budget.mjs counts that start set), the rest
 * comes once the page is usable or when picked; each is retried, then the page falls back (src/app/chunks.ts, R2 review
 * fix 2) and asks again when it is wanted (R2 review fix 3). R3 step 1 (docs/td/R3_PLAN.md §3.1) took window.__td
 * (app/dev-tools.ts) and "Chơi lại Ngày n" with "Chép số chơi thử" (app/retry.ts) out of this entry too. Học (R3,
 * BUILD_1B §11; app/learn.ts, a chunk asked for at once, with the portal bridge) plans the run's study lists before its
 * first step, counts the words seen, sends the learning events and keeps the review book across runs; one that cannot
 * load plays with no lists. The teaching table (ui/tips.ts) is a chunk too: Bà Cú Mực's rows in the frame at the top,
 * what a building does on its card.
 */
import "./ui/td.css";
import { runFrameLoop } from "./kit/platform";
import { Chunk } from "./app/chunks";
import type { Learner } from "./app/learn";
import { installKeys, installPointer } from "./app/input";
import { bestStars, keepStars, loadSettings, storyMode } from "./app/prefs";
import { loadSkill, paceHeader, saveSkill, SkillTally } from "./app/skill";
import { updateSkill } from "./kit/balance";
import { Selection } from "./app/selection";
import { Session } from "./app/session";
import { loadDeck } from "./app/vocab";
import { SLICE_1A } from "./content/slice-1a";
import type { Mode } from "./content/types";
import type { RareEvent } from "./sim/events";
import { NO_LEARN, setLearn } from "./sim/systems/learn";
import { setMode, setPace } from "./sim/systems/pace";
import type { World } from "./sim/world";
import { dockHtml } from "./ui/build-menu";
import { actionsHtml, BossBanner, Hud, REASON, statusHtml, stripHtml } from "./ui/hud";
import type { ProfileCard } from "./ui/profile";
import type { Sheet, SheetAction } from "./ui/sheets";
import { teamHtml } from "./ui/team-bar";
import type { TitleChoice, TitleScreen } from "./ui/title";
import type { TypingAudio, UiSound } from "./view/audio-min";
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
/** Sound and music, a chunk fetched once the page is usable (prefetch): nothing sounds before a key or a click anyway (TypingAudio.resume). */
const sound = new Chunk("sound", async () => new (await import("./view/audio-min")).TypingAudio(settings));
let audio: TypingAudio | null = null;
/** Asks for sound while it is not in: once the page is usable, then on each key or click until it loads (the chunk keeps its 15 s cool-down after a failure; R2 review fix 3). */
const wantSound = (wake: boolean): void => void sound.get().then((m) => ((audio = m), wake && m?.resume()));
/** A key or a click (the title's too): sound starts, or is asked for again while it is not in. */
const wakeSound = (): void => (audio === null ? wantSound(true) : audio.resume());
let profile = loadSkill(params.get("learn") === "1" ? "learn" : sandbox ? "balanced" : (settings.mode ?? "balanced"));
/** A fresh run's mode: Học with ?learn=1, the sandbox Cân bằng (its panel switches), the story the settings' (R3, BUILD_1B §14). */
const freshMode = (): Mode => (params.get("learn") === "1" ? "learn" : sandbox ? "balanced" : storyMode(settings, profile.audience === "child"));
/** The run header from the profile and the "Nhịp tự điều" setting. */
const header = () => paceHeader(profile, settings.pace);
/** Học (app/learn.ts): the run waits for it at tick 0 (its study lists go in the header); one that cannot load plays with none. */
const learnChunk = new Chunk("learn", () => import("./app/learn"));
void learnChunk.get();
let learner: Learner | null = null;
/** A chunk the page could not load, told in the HUD for a while (`until`, ms of performance.now()). */
let lost = { text: "", until: 0 };
const tellLost = (text: string): void => void (lost = { text, until: performance.now() + 10_000 });

// The title, its chunk loaded on first use (a run opened by a scenario's link never loads it, nor its painting), its
// Hồ sơ gõ card when picked, its settings card when picked or with the pause card's chunk, which holds one, once the page
// is usable (R2 review fix 3: no fetch of either at the title's start); its choice waits for the run. `titleUp`: the
// title is up or on its way, so the world waits and keys wait too. A title that cannot load is skipped: the run goes on.
let title: TitleScreen | null = null;
let titleUp = false;
let choose: (choice: TitleChoice) => void = () => {};
const cardChunks = { settings: new Chunk("settings", () => import("./ui/settings")), profile: new Chunk("profile", () => import("./ui/profile")) };
const titleCards = {
  settings: async () => {
    const s = await cardChunks.settings.get();
    return s && new s.SettingsCard(settings, (changed) => audio?.apply(changed), () => title?.settingsDone());
  },
  profile: async () => {
    const p = await cardChunks.profile.get();
    return p && new p.ProfileCard(() => title?.settingsDone());
  },
};
const titleChunk = new Chunk("title", async () => {
  const hooks = { choose: (choice: TitleChoice) => choose(choice), sound: (ui: UiSound) => audio?.ui(ui), wake: wakeSound, profile: (shown: ProfileCard) => shown.open(profile, settings.pace ? header().k : null) };
  return new (await import("./ui/title")).TitleScreen(document.body, hooks, titleCards, true);
});
function showTitle(canContinue: boolean): void {
  titleUp = true;
  void titleChunk.get().then((shown) => {
    title = shown;
    if (shown === null) return void ((titleUp = false), tellLost("Màn đầu chưa tải được: vào thẳng ván · F5 để thử lại"));
    if (titleUp) shown.show(canContinue, bestStars()[SLICE_1A.id] ?? 0);
  });
}
/**
 * "Chơi lại Ngày n" (BUILD_1B §4.3) kept by the last page under td.retry (app/retry.ts RETRY_KEY), read once. Its chunk
 * (app/retry.ts, with "Chép số chơi thử") loads at once when there is one, else once the page is usable for the results
 * card's buttons; one that cannot load starts the run over, told in the HUD.
 */
const kept = (() => {
  try {
    const raw = sessionStorage.getItem("td.retry");
    sessionStorage.removeItem("td.retry");
    return raw;
  } catch {
    return null;
  }
})();
const retryChunk = new Chunk("retry", () => import("./app/retry"));
const retryLoad = kept === null ? null : retryChunk.get();
const asked = params.get("title");
if (kept === null && (asked === "1" || (asked !== "0" && !params.has("sandbox")))) showTitle(false);
/** A fresh run of the same link, past the title (`learn`: in the learn mode; `story`: the title's map 1, never the sandbox). */
const freshRun = (learn: boolean, story = false): string => {
  const next = new URLSearchParams(params);
  next.set("title", "0");
  if (story) next.delete("sandbox"); // test pass 27/10: "Bắt đầu · Bản đồ 1" from the sandbox's title opened the sandbox
  if (learn) next.set("learn", "1");
  else next.delete("learn");
  return "?" + next.toString();
};

const { deck, source } = await loadDeck();
byId("tdHud").replaceChildren(); // the loading note
const replay = retryLoad === null ? null : await retryLoad;
if (kept !== null && replay === null) tellLost("Chơi lại Ngày n chưa tải được: ván mới từ đầu · F5 để thử lại");
const retry = kept === null || replay === null ? null : replay.readRetry(kept, seed, sandbox);
let runHeader = retry?.header ?? header();
/** The run's mode at its start (the replay's header): Học with ?learn=1 or the title's choice, else the settings' (freshMode). */
let startMode: Mode = retry?.mode ?? freshMode();
const session = new Session({ seed, sandbox, deck, expected: runHeader.expected, pace: runHeader, mode: startMode });
const world = session.world;
/** The replay's end (__td.retry()); another rule or vocabulary since the run was kept: the run starts over. */
const replayed = retry === null ? null : replay!.replayRetry(world, session, deck, retry, () => (window.location.search = freshRun(params.get("learn") === "1")));
const tally = new SkillTally(world);
// A run left mid-cycle counts as a quit (the trend keeps it; the measures do not); the title alone is no run. Học keeps its book.
window.addEventListener("pagehide", () => {
  if (world.tick > 0) saveSkill(updateSkill(profile, tally.sample(world, "quit")).profile);
  if (world.tick > 0) learner?.save(world);
  learner?.flush(performance.now());
});
const selection = new Selection(world, (command) => session.send(command));
const cards = new WordCards(byId("tdWords"), (x, z) => view.project(x, z));
cards.child = profile.audience === "child";
/** The study lists the run plays (flags(), "Chơi lại Ngày n"): a replayed day's, else planned once app/learn.ts is in. */
let runLearn = retry?.learn ?? NO_LEARN;
void learnChunk.get().then((m) => {
  if (m === null) return;
  m.learningBridge().requestFocus(); // inside the portal only
  learner = new m.Learner(deck, world.vocab, seed, (event) => m.learningBridge().sendAttempt(event), retry?.learn);
  cards.seen = (item) => learner!.seen(item);
  if (retry === null && world.tick === 0) setLearn(world, (runLearn = learner.header));
});
/** Until when (ms) the input-method note shows: 8 s after the last sign of one, so it goes once the player turns it off (test pass 27/10). */
let imeUntil = 0;
const learnMode = (): void => setMode(world, (startMode = "learn"));
/** A run has begun: the title was passed (or never shown); a new choice then opens a fresh page. */
let begun = !titleUp;
choose = (choice) => {
  if (choice === "continue") selection.paused = false;
  else if (begun) return void (window.location.search = freshRun(choice === "learn", true));
  else if (choice === "learn") learnMode();
  else if (world.tick === 0 && retry === null) setMode(world, (startMode = freshMode()));
  // Settings changed on the title apply to this run while it has not stepped (BALANCE.md §4.1: set before the run; R3: the mode too).
  if (world.tick === 0) setPace(world, (runHeader = header()));
  begun = true;
  titleUp = false;
  title?.hide();
};
/** The sandbox panel's markup (?sandbox=1), its own chunk (fetched with the others once the page is usable). */
const panel = new Chunk("sandbox", async () => (await import("./app/sandbox")).sandboxHtml as (w: World) => string);

/** Buttons and keys: the camera's and the sound's own, the rest the selection's. */
function act(action: string): void {
  const [name, dx, dy] = action.split(":");
  if (name === "pan") view.panBy(Number(dx) * 60, Number(dy) * 60);
  else if (name === "mute" && audio !== null) audio.muted = !audio.muted;
  else if (name === "pause" && mapOnly) mapOnly = false; // the HUD's Ⅱ brings the results back too
  else selection.act(action);
}

const hud = new Hud(byId("tdHud"), act);
const banner = new BossBanner();
/** The teaching table (ui/tips.ts, BUILD_1B §12, R3): a chunk fetched once the page is usable, asked again at the next phase while missing; nothing is taught before it is in. */
const tips = new Chunk("tips", () => import("./ui/tips"));
const wantTips = (): void => void tips.get().then((m) => m !== null && (banner.tips = m.TIPS));
for (const type of ["pointerdown", "keydown"]) window.addEventListener(type, wakeSound);
/**
 * Esc's pause card and the results card, with their settings card: a chunk fetched once the page is usable, asked again
 * when a card is wanted; without it the HUD says the pause or the end (R2 review fix 2). "Xem bản đồ" puts the results away.
 */
let mapOnly = false;
let sheet: Sheet | null = null;
const sheets = new Chunk("sheets", async () => {
  const [m, s] = await Promise.all([import("./ui/sheets"), cardChunks.settings.get()]);
  if (s === null) throw new Error("no settings card");
  return new m.Sheet(document.body, new s.SettingsCard(settings, (changed) => audio?.apply(changed), () => sheet?.settingsDone()), (action: SheetAction) => {
    if (action === "resume") selection.act("pause");
    else if (action === "map") mapOnly = true;
    else if (action === "again") window.location.search = freshRun(false);
    else if (action === "retry" || action === "copy") void retryChunk.get().then((m) => {
      if (m === null) return tellLost((action === "copy" ? "Chép số chơi thử" : "Chơi lại Ngày n") + " chưa tải được · F5 để thử lại");
      const run = { world, session, seed, sandbox, deck, mode: startMode, header: runHeader, learn: runLearn, fresh: freshRun };
      if (action === "copy") (m.copyNumbers(run, profile, source), tellLost("Đã lưu file chơi thử và chép số")); // test pass 27/10: it said nothing
      else m.retryDay(run);
    });
    else if (action === "title") showTitle(world.phase !== "defeat");
  });
});
const wantSheet = (): void => void sheets.get().then((m) => (sheet = m));
/** window.__td (app/dev-tools.ts), the scenarios' handle: once the page is usable, like the other chunks below. */
const dev = new Chunk("dev", () => import("./app/dev-tools"));
/** Once the page is usable: sound, the cards' chunk, the results card's buttons, the sandbox panel and __td, so none of them holds up the start. */
function prefetch(): void {
  wantSound(false);
  wantSheet();
  wantTips();
  void retryChunk.get();
  if (sandbox) void panel.get();
  void dev.get().then((m) => m?.installDevTools({
    world, session, deck, source, sandbox, selection, recent, costs,
    // Painted, and the chunks this page wants are in or given up (sound, the cards and their buttons, the title when it is up, the sandbox panel).
    ready: () => painted && sound.settled && sheets.settled && retryChunk.settled && learnChunk.settled && tips.settled && (!titleUp || title !== null) && (!sandbox || panel.settled),
    chunks: () => ({ sound: audio !== null, sheets: sheet !== null, panel: panel.value !== null, title: title !== null, retry: retryChunk.value !== null, learn: learner !== null, tips: banner.tips !== null }),
    header: () => runHeader, mode: () => startMode, replayed: () => replayed, learn: () => runLearn,
    learning: () => ({ store: learner?.store ?? null, sent: learner?.sent.slice() ?? [], queued: learnChunk.value?.learningBridge().queued().length ?? 0 }), balance: () => retryChunk.get().then((m) => m?.balanceOf(world, profile) ?? null),
  }));
}
// The title takes every key while it is up (and while its chunk loads); a card takes its own (arrows, Enter, Esc) and lets the rest through.
window.addEventListener("keydown", (event) => {
  if (titleUp && title === null) return void (event.preventDefault(), event.stopImmediatePropagation());
  // "Xem bản đồ" put the results away: Esc or Enter brings them back (test pass 27/10: it was one way, F5 only).
  if (mapOnly && !titleUp && (event.code === "Escape" || event.code === "Enter")) return void ((mapOnly = false), event.preventDefault(), event.stopImmediatePropagation());
  const open = titleUp ? title : sheet?.open === true ? sheet : null;
  if (open === null) return;
  const taken = open.key(event);
  if (taken) event.preventDefault();
  if (taken || open === title) event.stopImmediatePropagation();
}, true);
installKeys(window, {
  // Paused (Esc, or Space's tactical pause), nothing is typed: words wait.
  send: (command) => !selection.halted && (session.send(command), true),
  act,
  onVietnamese: () => (imeUntil = performance.now() + 8000),
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

/** The story won: its stars kept in td.campaign, once (BUILD_1B §4.3, R3; a replayed day's win too). */
let won: ReturnType<typeof keepStars> | null = null;
let sheetAsked = -Infinity;
let panelAsked = -Infinity;
function showHud(): void {
  const refused = [...recent].reverse().find((event) => event.t === "rejected" && world.tick - event.tick < 150);
  const now = performance.now();
  const over = world.phase === "defeat" || world.phase === "victory";
  const card = titleUp ? "" : over ? (mapOnly ? "" : "results") : selection.paused ? "pause" : "";
  // A card or the sandbox panel wanted before its chunk is in: asked again (at most once a second); a chunk given up is
  // told here instead (R2 review fix 3: the panel too, not only the cards).
  if (card !== "" && (sheet === null || retryChunk.value === null) && now - sheetAsked > 1000) {
    sheetAsked = now;
    wantSheet();
    void retryChunk.get();
  }
  if (sandbox && selection.panel && panel.value === null && now - panelAsked > 1000) {
    panelAsked = now;
    void panel.get();
  }
  const noCard = card !== "" && sheet === null && sheets.failed;
  const notices = [
    selection.tactical ? "Tạm dừng chiến thuật · Space để chạy tiếp" : "", now < imeUntil ? "Tắt bộ gõ tiếng Việt để gõ" : "", over && mapOnly ? "Esc hoặc Enter: xem lại thẻ kết" : "",
    world.phase === "day" && world.wood >= 150 && world.gold < 50000 ? "Gỗ thừa: bán gỗ ở thẻ Lũy" : "", source === "fallback" ? "Từ dự phòng (máy chủ không có từ vựng)" : "",
    now < lost.until ? lost.text : "",
    noCard ? (card === "pause" ? "Tạm dừng · Esc để chạy tiếp (thẻ tạm dừng chưa tải được) · F5 để thử lại" : "Hết ải · F5 để chơi lại (thẻ kết chưa tải được)") : "",
    card === "results" && retryChunk.failed ? "Chơi lại Ngày n chưa tải được · F5 để thử lại" : "",
    sandbox && selection.panel && panel.failed ? "Bảng hộp cát chưa tải được · F5 để thử lại" : "",
  ];
  hud.update([
    statusHtml(world, sandbox, selection.halted, audio?.muted === true, notices.filter((notice) => notice !== ""), banner.hit(now)),
    sandbox && selection.panel && panel.value !== null ? panel.value(world) : "",
    teamHtml(world, selection.agent),
    stripHtml(world, refused?.t === "rejected" ? (REASON[refused.reason] ?? refused.reason) : "", selection.tactical),
    dockHtml(world, selection, tips.value?.doesLine),
    actionsHtml(world, selection.tactical),
    banner.html(world, now),
    banner.teachHtml(world),
  ]);
  document.body.classList.toggle("is-paused", selection.paused);
  sheet?.show(card, world, { story: !sandbox, retried: retry?.day ?? 0, canRetry: retryChunk.value !== null, best: won?.best ?? 0, record: won?.record === true, blows: banner.blows });
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
prefetch();

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
      session.paused = selection.halted || titleUp || (world.tick === 0 && !learnChunk.settled);
      session.orders = selection.tactical; // the hand's orders act at once, typing waits
      session.frame(now);
      if (!sandbox && won === null && world.phase === "victory") won = keepStars(world.c.content.id, world.lives);
      const fresh = world.events.rare.splice(0);
      if (banner.tips === null && fresh.some((event) => event.t === "phase")) wantTips();
      learner?.read(fresh, world, now);
      const sample = tally.read(fresh, world);
      if (sample !== null) saveSkill((profile = updateSkill(profile, sample).profile));
      cards.read(fresh, world, now);
      if ((world.boss.stage > 0) !== bossTop > 0) resize();
      view.boss.read(fresh, world, now);
      view.fx.read(fresh, world, now);
      banner.read(fresh, world, now);
      audio?.read(fresh, world, now);
      audio?.frame(titleUp ? null : world, now);
      recent.push(...fresh);
      if (recent.length > 400) recent.splice(0, recent.length - 400);
      showHud();
    });
  },
  draw(now) {
    timed(costs.draw, () => {
      view.draw(world, selection);
      cards.draw(world, now, window.innerWidth, window.innerHeight, hud.boxes(window.innerWidth, window.innerHeight), view.keepOut(world));
    });
    painted = true;
  },
  onError() {
    selection.paused = true;
  },
});

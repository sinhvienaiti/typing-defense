/**
 * The HUD (docs/td/BUILD_NOW.md §5.3, BUILD_1A6 §9, TK 23.5): paper panels, each written only
 * when its HTML changes. A button runs its action on press, so a re-render
 * cannot swallow the click, and never takes focus: Enter and Space stay the game's.
 */
import { MODES, TICK_HZ, ULT } from "../content/rules";
import type { RareEvent } from "../sim/events";
import { BOSS } from "../sim/stores/boss";
import { CALL_KIND } from "../sim/stores/calls";
import { bossSlot, heavyNear } from "../sim/systems/boss";
import { chainTier } from "../sim/systems/chain";
import { ultShut } from "../sim/systems/ult";
import { dayTicks, earlyCallBonus, opensOn } from "../sim/systems/waves";
import type { World } from "../sim/world";
import { gloss, wordText } from "../typing/decks";
import type { Rect } from "../view/words/lanes";
import type { Tip } from "./tips";

/** Mộc Tinh's own lines (TK 22.7); Bà Cú Mực's teaching table is ui/tips.ts, a chunk of its own (R3). */
export const BOSS_LINES = { rise: "Where is my name?", roots: "Roots, rise!", drain: "This village's life... so sweet.", stagger: "That name... I know it...", retreat: "Ah... I remember." } as const;

/** In update() order; td-chip is the status panel the scenarios look for; td-boss the boss bar (BUILD_1B §13.1); td-tip the teaching frame (R3). */
export const PANELS = ["chip", "sandbox", "team", "strip", "dock", "actions", "boss", "tip"] as const;

export const REASON: Readonly<Record<string, string>> = {
  phase: "Run ended", capTotal: "Building limit (16)", capType: "Building type at cap", bounds: "Off map", node: "Gold Mine needs a free ore site",
  water: "Cannot build on water", road: "Too close to the road", keep: "Within 11 m of Fort", overlap: "Overlaps a building", tree: "A tree is in the way", rally: "Barracks must be near a road",
  path: "Path blocked", gold: "Need Gold", wood: "Need Wood", food: "Need Rice", noSlot: "Slot locked", notDay: "Night can only be called by day",
  undoWindow: "Undo expired (5 s)", finished: "Already built; cannot undo", blocked: "Cannot stand there", rallyFar: "Barracks too far", rallyOffRoad: "Rally point needs a road",
  noBuilding: "Building missing", noBarracks: "Not a Barracks", badValue: "Invalid value", noSandbox: "Sandbox only", badKey: "Invalid key",
  noUpgrade: "Cannot upgrade", notReady: "Still building", noTree: "No such tree", villagerCap: "Villager limit reached", notRipe: "Not ripe yet",
  locked: "Not unlocked yet", keepMax: "Fort at this map's max level", bossBusy: "Mộc Tinh is awake",
  ultEmpty: "Ultimate not ready", ultBusy: "Fire Feather Rain is active", ultFar: "Too far from Draconis (20 m)", ultNone: "No foes near Draconis (14 m)",
};

export const button = (act: string, label: string, key = "", attrs = ""): string => `<button data-act="${act}"${attrs}>${label}${key === "" ? "" : `<kbd>${key}</kbd>`}</button>`;

/** A row of choices; `wide` puts the label over them (long names: the mode). */
export const seg = (label: string, act: string, values: readonly string[], labels: readonly string[], current: string, wide = false): string =>
  `<div class="td-row${wide ? " td-wide" : ""}"><small>${label}</small>${values.map((value, k) => button(act + ":" + value, labels[k]!, "", value === current ? ' class="is-on"' : "")).join("")}</div>`;

const stat = (label: string, value: string): string => `<span class="td-stat"><small>${label}</small><b>${value}</b></span>`;

/**
 * Pause and sound; the resources and lives (BUILD_1A6 §9; a blow on the Bastion flashes "−3" there); "Ngày 2 · 0:41",
 * "Đêm 2 · còn 12 quái" or dawn; knowledge and the review book once there are any (§7); the early night call (§2).
 */
export function statusHtml(w: World, sandbox: boolean, paused: boolean, muted: boolean, notices: readonly string[], hit = 0): string {
  const left = Math.max(0, Math.ceil((w.phaseEnd - w.tick) / TICK_HZ));
  const clock = Math.floor(left / 60) + ":" + String(left % 60).padStart(2, "0");
  const enemies = w.enemies.count + w.spawnQueue.length;
  const phase = w.phase === "day" ? `Day ${w.day} · ${clock}` : w.phase === "night" ? `Night ${w.day} · ${enemies} ${enemies === 1 ? "foe" : "foes"} left` : w.phase === "dawn" ? `Dawn ${w.day}` : w.phase === "victory" ? "Village saved" : "Defeat";
  const lives = hit > 0 ? `${w.lives}<i class="td-hit">−${hit}</i>` : String(w.lives);
  return (
    `<div class="td-row"><span class="td-title"><b>Wordwoven</b><small>${sandbox ? "Sandbox · 1B demo" : "Map 1 · Silverfall Meadow"}</small></span>` +
    button("pause", paused ? "▶" : "Ⅱ", "", " class=\"td-x\" title=\"Pause\"") + button("mute", muted ? "<s>Sound</s>" : "Sound", "", ' class="td-x"') + (sandbox ? button("sandbox", "F9", "", " class=\"td-x\" title=\"Sandbox\"") : "") + "</div>" +
    `<div class="td-row">${stat("Gold", String(Math.floor(w.gold / 1000)))}${stat("Wood", String(w.wood))}${stat("Rice", String(w.food))}${stat("Seeds", String(w.seeds))}${stat("Lives", lives)}</div>` +
    `<p class="td-phase"><b>${phase}</b></p>` +
    (w.knowledge > 0 || w.typing.reviewN > 0 ? `<p class="td-learn">Knowledge <b>${w.knowledge}</b> · Review <b>${w.typing.reviewN}</b></p>` : "") +
    (w.phase === "defeat" ? `<p class="td-warn">Fort has no lives left</p>` : w.phase === "day" ? earlyHtml(w, left, clock, paused) : "") +
    notices.map((notice) => `<p class="td-warn">${notice}</p>`).join("")
  );
}

/**
 * The early night call (the owner's play-test, 26/10/2026): its gold and the day's time left on the button, a bar that
 * empties with them, a pulse in the last 10 s; paused, "Đã dừng" where the time was.
 */
const earlyHtml = (w: World, left: number, clock: string, paused: boolean): string =>
  button("night", `<b>Early night · +${earlyCallBonus(w)} Gold</b><i><s style="width:${Math.round((100 * Math.max(0, w.phaseEnd - w.tick)) / dayTicks(w.mode, w.pace.k))}%"></s></i><b>${paused ? "Paused" : clock}</b>`,
    "⇧ Enter", ` class="td-call${left <= 10 && !paused ? " is-last" : ""}"`);

/**
 * The compact word strip (TK 23.4): the locked word, its typed part in jade, or a note; the chain and its tier. A
 * quiz's word stays hidden past what is typed (its first letter shown) under its meaning; the learn mode adds the
 * meaning and the IPA (BUILD_1A6 §7), each unless `show` (the settings) turns it off. In the tactical pause it says so where the eyes are: keys wait (review R2).
 */
export function stripHtml(w: World, note: string, tactical = false, show: { readonly meaning: boolean; readonly ipa: boolean } = { meaning: true, ipa: true }): string {
  const { router, deck, chain } = w.typing;
  const word = router.lock >= 0 ? wordText(deck, w.words.word[router.lock]!) : "";
  const typed = router.lock >= 0 ? w.words.typed[router.lock]! : 0;
  const quiz = router.lock >= 0 && w.calls.kind[w.words.call[router.lock]!] === CALL_KIND.quiz;
  const shown = quiz ? word.slice(0, Math.max(1, typed)) + "_".repeat(word.length - Math.max(1, typed)) : word;
  const item = router.lock >= 0 ? w.words.word[router.lock]! : -1;
  // Settings' learning switches hide the meaning and the IPA; a quiz keeps its meaning (the prompt).
  const mean = item < 0 || !(quiz || w.mode === "learn") ? "" : quiz ? gloss(deck, item) : ((show.meaning ? gloss(deck, item) : "") + (show.ipa && deck.ipa[item] !== "" ? " " + deck.ipa[item] : "")).trim();
  const locked = `<b class="td-word"><span>${shown.slice(0, typed)}</span>${shown.slice(typed)}</b>`;
  let main = `<em>Type a card's first letter to lock on</em>`;
  if (tactical) main = (router.lock >= 0 ? locked : "") + `<em class="td-warn td-halt">Paused · Space</em>`; // the card keeps the meaning
  else if (note !== "") main = `<em class="td-warn">${note}</em>`;
  else if (router.lock >= 0) main = locked + (mean === "" ? "" : `<small class="td-mean">${mean}</small>`);
  else if (router.group >= 0) main = `<b class="td-word">${String.fromCharCode(97 + router.group)}…</b>`;
  const pips = [1, 2, 3, 4].map((tier) => `<i${tier <= chainTier(chain) ? ' class="on"' : ""}></i>`).join("");
  return main + `<span class="td-chain" title="Chain tier ${chainTier(chain)}">Chain <b>${chain}</b>${pips}</span>`;
}

/** Build and hire; Tối Thượng with its charge (BUILD_1B §8.2, R2); the tactical pause where the mode has it (§8). */
export function actionsHtml(w: World, tactical: boolean): string {
  const shut = ultShut(w);
  const charge = Math.floor(w.ult.charge);
  const ult = shut ? "Ultimate · Night " + opensOn(w, "ult") : w.ult.on === 1 ? "Fire Feather Rain" : charge >= ULT.max ? "Ultimate" : "Ultimate " + Math.floor(charge / 5) * 5 + "%";
  return button("build", "Build", "Insert / \\") + button("hire", "Hire Villager", "⇧ \\") + button("ult", ult, "=", shut || charge < ULT.max || w.ult.on === 1 ? " disabled" : "") +
    (MODES[w.mode].pause ? button("space", tactical ? "Resume" : "Pause", "Space") : "");
}

/**
 * Bà Cú Mực's teaching rows and the boss bar (BUILD_1B §13.1: never in the middle of the screen, one line at a time): at
 * the start of each story day and night her row of the table (§12, R3; ui/tips.ts once its chunk is in), one sentence a
 * line, and its chip till the phase ends, in the teaching frame at the top right, off the field (teachHtml: at the top
 * middle it hid the rift the enemies come from, R3 pictures); from day 5's warning in the boss bar at the top middle, with
 * Mộc Tinh's lines and the stagger's call; a blow on the Bastion (R3: and each drain); the "ghost" health that follows a hit down 0.4 s late.
 * The sandbox skips the table but the boss's rows.
 */
export class BossBanner {
  private lines: [string, number][] = [];
  private line = "";
  private until = 0;
  chip = "";
  /** The table (ui/tips.ts), set when its chunk is in; the phase whose row was last shown ("": none). */
  tips: Readonly<Record<string, Tip>> | null = null;
  private taught = "";
  private readonly said = new Set<string>(); // the moves whose line it has said (Rễ Trồi; R3: Rễ hút sinh khí)
  private hitAt = -1e9;
  private hitLives = 0;
  /** Lives the boss's blows and drains took this page (the loss card tells them from enemies that got in). */
  blows = 0;
  private ghost = 1;
  private hp = 1;
  private hpAt = 0;
  private bigAt = -1e9;

  private say(now: number, ...lines: [string, number][]): void {
    this.lines = lines;
    this.until = 0;
    this.next(now);
  }

  private next(now: number): void {
    const [line, ms] = this.lines.shift() ?? ["", 0];
    [this.line, this.until] = [line, now + ms];
  }

  read(events: readonly RareEvent[], w: World, now: number): void {
    // The row of each story day and night from its first step (the title up at tick 0: not yet), read off the world, so a
    // replayed day (Chơi lại Ngày n drops its events) gets its row too (review R1); dawn and the end clear the chip. The
    // sandbox keeps only the boss's two rows (R1), once its `boss` or `skipTo` has warned it.
    const quiet = w.tick === 0 || (w.phase !== "day" && w.phase !== "night") || (w.sandbox && w.boss.stage < BOSS.warned);
    const key = quiet ? "" : w.phase + (w.sandbox ? w.c.content.stage!.boss.night : w.day);
    if (key !== this.taught && (this.tips !== null || key === "")) {
      this.taught = key;
      const row = this.tips?.[key];
      this.chip = row?.chip ?? "";
      if (row !== undefined) this.tip(row, now);
    }
    for (const e of events) {
      if (e.t === "bossEmerge") this.say(now, ["Mộc Tinh: " + BOSS_LINES.rise, 3000]);
      else if (e.t === "bossStrike" && (e.move === "roots" || e.move === "drain") && !e.hit && !this.said.has(e.move)) {
        this.said.add(e.move); // a move's lines wait for the other's to end, never cut them (test pass 27/10: the drain's was lost 43–58 %)
        const lines: [string, number][] = [["Mộc Tinh: " + BOSS_LINES[e.move], 2500], ...(e.move === "drain" ? [[`Roots drain ${e.count} life every ${w.c.content.boss!.drain.everyS} s: defeat him fast!`, 3000] as [string, number]] : [])];
        if (this.said.size > 1 && this.line !== "") this.lines.push(...lines);
        else this.say(now, ...lines);
      } else if (e.t === "bossPhase") this.say(now, ["Mộc Tinh stunned! Type Power!", 1200], ["Mộc Tinh: " + BOSS_LINES.stagger, 2500]);
      else if (e.t === "bossRetreat") this.say(now, ["Mộc Tinh: " + BOSS_LINES.retreat, 5000]);
      else if (e.t === "bossStrike" && (e.move === "keep" || e.move === "drain") && e.hit) [this.hitAt, this.hitLives, this.blows] = [now, e.count, this.blows + e.count];
    }
    if (now >= this.until) this.next(now);
  }

  /** Bà Cú Mực's line, one sentence a line so it stays one line at 1280 × 720 (review R1); two at most (tests/td-tips.test.ts). */
  private tip(tip: Tip, now: number): void {
    this.say(now, ...tip.line.split(/(?<=[.!?])\s+/).map((part): [string, number] => ["Bà Cú Mực: " + part, 3800]));
  }

  /** Lives a blow on the Bastion took, for 0.9 s after it (0: none). */
  hit(now: number): number {
    return now - this.hitAt < 900 ? this.hitLives : 0;
  }

  /** The ghost health (0–1): it waits 0.4 s after a hit, then follows the health down. */
  private ghostOf(hp: number, now: number): number {
    if (hp < this.hp) [this.hp, this.hpAt, this.bigAt] = [hp, now, this.hp - hp >= 0.01 ? now : this.bigAt]; // R2: a big hit jolts the bar
    if (hp > this.hp || this.ghost < hp) [this.hp, this.ghost] = [hp, hp];
    if (now - this.hpAt > 400) this.ghost = Math.max(hp, this.ghost - 0.004);
    return this.ghost;
  }

  /** The teaching frame while there is no boss (R3): the chip, then Bà Cú Mực's line. */
  teachHtml(w: World): string {
    if (w.boss.stage !== BOSS.idle && w.c.content.stage !== undefined) return "";
    // A chip wraps between its parts ("Gõ chữ đầu để chọn · Esc để thôi"), never inside one.
    const chip = this.chip.split(" · ").map((part) => `<span>${part}</span>`).join(" · ");
    return (this.chip === "" ? "" : `<div class="td-tip-chip"><small>Tip</small> <b>${chip}</b></div>`) + (this.line === "" ? "" : `<p class="td-say">${this.line}</p>`);
  }

  /** The boss panel: day 5's warning, the sleeping bar, the lull's countdown, the bar (health, 70 % and 50 % marks, phase, metres to the Bastion). */
  html(w: World, now: number): string {
    const S = w.boss;
    const stage = w.c.content.stage;
    const say = this.line === "" ? "" : `<p class="td-say">${this.line}</p>`;
    const chip = this.chip === "" ? "" : " · Tip: " + this.chip; // a tip, not the boss's state (test pass 27/10)
    if (S.stage === BOSS.idle || stage === undefined) return "";
    const e = bossSlot(w);
    let main: string;
    if (S.stage === BOSS.warned) main = w.phase === "night" ? `<b>Mộc Tinh</b> <small>asleep${chip}</small>` : `<b>Night ${stage.boss.night} · Boss</b> <small>Mộc Tinh awakens${chip}</small>`;
    else if (S.stage === BOSS.lull) main = `<b>Mộc Tinh in ${Math.max(0, Math.ceil((S.lullEnd - w.tick) / TICK_HZ))} s</b>${heavyNear(w) ? " · waiting: foes near Fort" : ""}`;
    else if (S.stage === BOSS.emerge) main = `<b>Mộc Tinh is rising</b>`;
    else if (e < 0) main = `<b>Mộc Tinh retreats</b> <small>+${w.c.content.boss!.chestGold} Gold</small>`;
    else {
      const hp = w.enemies.hp[e]! / S.hpMax;
      const left = Math.max(0, Math.round(w.lanes[w.enemies.route[e]!]!.length - w.enemies.dist[e]!));
      const phase = S.stage === BOSS.retreat ? "retreat" : w.tick < S.staggerUntil ? `stunned · Vulnerable ${Math.ceil((S.staggerUntil - w.tick) / TICK_HZ)} s` : "phase " + S.phase;
      const pct = (share: number): string => (100 * share).toFixed(1) + "%";
      const ghost = this.ghostOf(hp, now);
      main = `<div class="td-row"><b>Mộc Tinh</b><small>${phase} · ${left} m to Fort</small></div>` +
        `<div class="td-bar${now - this.bigAt < 160 ? " is-hit" : ""}"><i class="td-ghost" style="width:${pct(ghost)}"></i><i class="td-hp" style="width:${pct(hp)}"></i>` +
        `<s style="left:${w.c.content.boss!.stagger.atPct}%"></s><s class="td-retreat" style="left:${w.c.content.boss!.retreatPct}%"><small>retreat</small></s></div>`;
    }
    return `<div class="td-boss-main${S.stage === BOSS.warned && w.phase === "night" ? " is-dim" : ""}">${main}</div>` + say;
  }
}

export class Hud {
  private readonly panels: HTMLElement[];
  private readonly html: string[] = [];
  private rects: Rect[] = [];
  private changed = 0;
  private seen = "";

  constructor(root: HTMLElement, act: (action: string) => void) {
    this.panels = PANELS.map((name) => root.appendChild(Object.assign(document.createElement("div"), { className: "td-panel td-" + name })));
    root.addEventListener("pointerdown", (event) => {
      const target = (event.target as Element).closest<HTMLButtonElement>("button[data-act]");
      if (target === null || target.disabled || event.button !== 0) return;
      event.preventDefault();
      act(target.dataset.act!);
    });
  }

  update(html: readonly string[]): void {
    html.forEach((text, k) => {
      if (text === this.html[k]) return;
      this.html[k] = text;
      this.panels[k]!.innerHTML = text;
      this.changed += 1;
    });
  }

  /** The panels on screen (CSS px), measured again only when one changed or the window did: the word cards keep off them. */
  boxes(width: number, height: number): readonly Rect[] {
    const key = this.changed + ":" + width + "x" + height;
    if (key === this.seen) return this.rects;
    this.seen = key;
    this.rects = this.panels.map((el) => el.getBoundingClientRect()).filter((r) => r.width > 0).map((r) => ({ left: r.left, top: r.top, right: r.right, bottom: r.bottom }));
    return this.rects;
  }
}

/**
 * Word cards (docs/td/BUILD_NOW.md §5.2, TK 23.4; BUILD_1A6 §7, §9): a pool of 20 DOM cards over the canvas. A frame
 * changes only transform and opacity; text and classes change when a word's state does. A bright call's word is its
 * bubble over its NPC (or building): the kind's icon and colour, the word, dots for the words the call still asks
 * (●●○), the meaning under it by the rule of BUILD_1B §11.1 (R3: meaningShown); a Từ Ôn is jade with its "Ôn" tag, its
 * meaning always, "Chuộc lại" stamped when redeemed; a quiz shows the meaning and the first letter with blanks ("tốt;
 * hay · g _ _ _"). It grows when locked with the typed part in jade, shakes on a wrong key; typed, it shows its meaning
 * for 1 s (the grade's own name, TK 0.6, stamped over it) or, with none, flies home; it folds when its call dims or
 * closes. A power call's bar is its 6 s. Columns part at once and ease back on the spring, so no frame shows two cards
 * overlapping. A card on its way out has the class is-gone (is-mean while it shows a meaning), so the browser checks
 * can tell it from a live one.
 */
import { LEARN } from "../../content/rules";
import type { Grade, Mode } from "../../content/types";
import type { RareEvent } from "../../sim/events";
import { CALL_KIND } from "../../sim/stores/calls";
import { verbOf } from "../../sim/systems/direct";
import type { World } from "../../sim/world";
import { gloss, wordText } from "../../typing/decks";
import { KIND } from "../../typing/letters";
import { KEY } from "../../typing/router";
import "./feel.css";
import { fitElement } from "./dom";
import type { SafeFrame } from "./safe";
import type { keyStamps } from "./stamps";
import { rimAt, typedShown } from "./steps";
import { besidePanels, columnBox, lanesTouch, spreadLanes, type LaneBox, type Rect } from "./lanes";

export const GRADE_NAME: Readonly<Record<Grade, string>> = { flash: "Flash", perfect: "Perfect", good: "Good", ok: "OK", sloppy: "Sloppy" };
/** By call kind (CALL_KIND): power, build, harvest, chop, mine, quiz; R2: Chữ Chiêu, a direct call (Ngắt). */
export const CALL_COLOR = ["#D9479B", "#8B5A2B", "#E0B33A", "#2F7D32", "#C98A2E", "#3B7DDD", "#F2994A", "#C23B22"] as const;
export const CALL_ICON = ["🏹", "🔨", "🌾", "🪓", "⛏️", "📖", "🔥", "✋"] as const;
export const CALL_NAME = ["Power", "Build", "Reap", "Chop", "Dig", "Quiz", "Spell", "Stop"] as const;
/** Call c's icon and name; a direct call's by its enemy's verb (R3: Ngắt, Neo, Phá Khiên). */
export function callLabel(w: World, c: number): [string, string] {
  const kind = w.calls.kind[c]!;
  const verb = kind === CALL_KIND.direct ? verbOf(w, c) : 0;
  return verb > 0 ? [["", "⚓", "🛡️"][verb]!, ["", "Pin", "Shatter"][verb]!] : [CALL_ICON[kind]!, CALL_NAME[kind]!];
}
/**
 * BUILD_1B §11.1 (R3): the meaning under a word before it is typed: always in Học and Thư giãn and for a child, else
 * while the word was seen at most twice (Cân bằng) or once (Thử thách), this sighting counted; `seen` null (Học's chunk
 * not in) shows it. A quiz and a Từ Ôn always show it; 3 errors on a word show it again (the cards).
 */
export const meaningShown = (mode: Mode, child: boolean, seen: number | null): boolean =>
  child || mode === "learn" || mode === "relax" || seen === null || seen <= LEARN.seen[mode];

/** Cards hang 1.6 m over the one who calls (a building's call over its middle). */
export const ROOF_M = 1.6;

/** Dots for the words call c still asks, the current one included, then the typed ones (BUILD_1A6 §9); none for a one-word call. */
export const pips = (w: World, c: number): string => (w.calls.words[c]! > 1 ? "●".repeat(w.calls.words[c]! - w.calls.done[c]!) + "○".repeat(w.calls.done[c]!) : "");

const POOL = 20;
const STAMPS = 10;
const MS = { hit: 220, fold: 200, mean: 1000, stamp: 900, spring: 150 } as const;
const SAFE = { side: 8, top: 64, bottom: 8 } as const;

/** "mean": typed, the card shows the word's meaning for 1 s in its call's column, then folds. */
type Leave = "" | "hit" | "fold" | "mean";
type Card = {
  el: HTMLElement; text: HTMLElement; bar: HTMLElement; pips: HTMLElement; sub: HTMLElement; id: number; slot: number; b: number; call: number;
  word: string; mean: string; quiz: boolean; learn: boolean; dots: string; tier: number; ax: number; ay: number;
  typed: number; pink: boolean; late: boolean; lockedAt: number; half: number; height: number; x: number; y: number; seen: number;
  leave: Leave; leaveAt: number; tx: number; ty: number; pinkUntil: number;
  /** C10 pose (ms): the last right key, the lock, the last slip; `scale` eased to its lock size. */
  keyAt?: number; lockAt?: number; slipAt?: number; scale?: number;
  /** C10: when a typed card's meaning takes the place of its word (after the burst and the squeeze), and when its word was typed. */
  meanAt?: number; hitAt?: number;
  stamp?: { el: HTMLElement; at: number; source: HTMLElement };
};
/** C10: a card as the 3D view's typing feel sees it (src/view/3d/words.ts). */
export type CardView = Readonly<Pick<Card, "el" | "text" | "word" | "x" | "y" | "half" | "height" | "call" | "leave" | "slot">>;
/** C10 (BUILD_1C_MAP1 §8): the 3D view hears each key on a card (`typed` letters after it), each word typed, and the cards after layout. */
export interface CardFeel {
  key(card: CardView, result: number, typed: number, now: number): void;
  done(card: CardView, now: number): void;
  frame(cards: readonly CardView[], now: number, safe?: SafeFrame): void;
  /** Whether call `call`'s typed word keeps its meaning back (a Word Shot of its house still in flight: the strip waits for the impact). */
  hold?(call: number): boolean;
}
/** The screen point (CSS px) a call's cards stand on (`core`: where its letters go), null to keep the 2D roof. */
export type Anchor = (w: World, c: number, core: boolean) => { x: number; y: number; edge?: number } | null;
/** A grade's stamp; over a meaning card it rides above it as the card takes its place (`card`, else null). */
type Stamp = { el: HTMLElement; at: number; x: number; y: number; half: number; card: Card | null };

function element(root: HTMLElement, className: string, html = ""): HTMLElement {
  const el = root.appendChild(Object.assign(document.createElement("div"), { className, innerHTML: html }));
  el.style.opacity = "0";
  return el;
}

const place = (el: HTMLElement, x: number, y: number, scale: string, opacity: number, turn = 0): void => {
  el.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px) scale(" + scale + ")" + (Math.abs(turn) > 0.05 ? " rotate(" + turn.toFixed(2) + "deg)" : "");
  el.style.opacity = opacity.toFixed(2);
};

/**
 * A typed card `t` ms after its word (TYPING_BREAK_STUDY T3, T7; judge C10 r3): it bursts where it stands, opaque, 1.1× with a
 * warm white rim 4 px beyond it and +36 % light, held two frames; then it is squeezed sideways to a line in 100 ms (faster at
 * the end) as the light dies, empty 60 ms; only then does the call's next word show in its place.
 */
const SWAP_MS = 194;
const squeeze = (t: number): string => (t < 34 ? "1.1" : t < 134 ? (1.1 * Math.max(0.001, 1 - ((t - 34) / 100) ** 2)).toFixed(3) + ",1.1" : t < SWAP_MS ? "0.001,1" : "1");
const burst = (el: HTMLElement, t: number): void => {
  const r = rimAt(t, el.offsetHeight || 58, Math.max(0.8, Math.min(1.2, (el.offsetHeight || 58) / 60)));
  const stroke = `0 0 0 ${r.width}px ${r.color}`;
  el.style.outline = r.light && !r.blur ? `${r.width}px solid ${r.color}` : "";
  el.style.outlineOffset = r.out - r.width + "px";
  el.style.boxShadow = r.light > 0.05 && r.blur ? `${stroke}, 0 0 ${r.blur}px 12px rgba(255,214,120,${r.light.toFixed(3)})` : "";
  el.style.filter = r.light > 0.05 ? `brightness(${(1 + 0.36 * r.light).toFixed(3)})` : "";
};
const decay = (t: number, tau: number): number => (t >= 0 && t < 6 * tau ? Math.exp(-t / tau) : 0);

export class WordCards {
  private readonly cards: Card[];
  private readonly stamps: Stamp[];
  private readonly byId = new Map<number, Card>();
  private readonly offsets = new Map<number, number>();
  /** Calls (by id) whose next word waits until a typed card's burst and squeeze are over (T7). */
  private readonly wait = new Map<number, number>();
  private chainTier = 0;
  private last = 0;
  private frame = 0;
  /** Học (R3): a child's profile, and the times a deck word was seen (app/learn.ts; null until it is in). */
  child = false;
  seen: ((item: number) => number) | null = null;
  /** Settings' "Show Vietnamese meaning": off, no meaning under a card or after it is typed (a quiz keeps its prompt). */
  meanings: { readonly meaning: boolean } = { meaning: true };
  /** C10: the 3D view's typing feel while it draws. */
  feel: CardFeel | null = null;
  /** C10's key stamps (stamps.ts), a chunk main.ts asks for with the page: none are drawn until it is in. */
  stamper: typeof keyStamps | null = null;

  constructor(private readonly root: HTMLElement, private readonly project: (x: number, z: number) => { x: number; y: number }, private readonly anchor?: Anchor) {
    this.cards = Array.from({ length: POOL }, () => {
      const el = element(root, "td-card", '<i class="td-card-dot"></i><span></span><span class="td-card-bar"></span><b class="td-card-pips"></b><small class="td-card-mean"></small>');
      const [text, bar, dots, sub] = [1, 2, 3, 4].map((k) => el.children[k] as HTMLElement);
      return { el, text, bar, pips: dots, sub, id: -1, leave: "" } as Card;
    });
    this.stamps = Array.from({ length: STAMPS }, () => ({ el: element(root, "td-stamp"), at: -1e9, x: 0, y: 0, half: 0, card: null }));
  }

  /** This frame's events: a wrong key shakes its card; a typed word sends the card off and stamps its grade. */
  read(events: readonly RareEvent[], w: World, now: number): void {
    // A Từ Ôn redeemed (its review event comes just before its wordHit) is stamped "Chuộc lại" in place of its grade (R3).
    const redeemed = events.filter((e) => e.t === "review" && e.redeemed).map((e) => (e.t === "review" ? e.item : -1));
    for (const event of events) {
      if (event.t === "chain") this.root.style.setProperty("--tier", String((this.chainTier = event.tier))); // the stamps grow and turn gold (feel.css)
      const card = "word" in event ? this.byId.get(event.word) : undefined;
      if (card === undefined) continue;
      // A wrong key shakes the card and the letter wanted stays pink until it comes (test pass 27/10: 0.15 s was missed).
      if (event.t === "wordKey") {
        const wrong = event.result === KEY.wrong;
        card.pinkUntil = wrong ? Infinity : 0;
        if (wrong) card.slipAt = now;
        else card.keyAt = now;
        if (event.result === KEY.lock || event.result === KEY.switch) card.lockAt = now;
        const s = w.words.slotOf(event.word);
        this.feel?.key(card, event.result, s >= 0 ? w.words.typed[s]! : card.word.length, now);
      } else if (event.t === "wordHit") {
        this.feel?.done(card, now);
        this.byId.delete(event.word);
        const c = w.calls.slotOf(event.call);
        const to = c >= 0 ? (this.anchor?.(w, c, true) ?? this.project(w.calls.x[c]!, w.calls.z[c]!)) : card;
        // The word shows whole in jade while it bursts and squeezes; its meaning takes its place after (SWAP_MS).
        Object.assign(card, { leave: card.mean === "" ? "hit" : "mean", leaveAt: now + (card.mean === "" ? 0 : SWAP_MS), meanAt: now + SWAP_MS, hitAt: now, tx: to.x, ty: to.y, slot: -1, ax: NaN, ay: NaN });
        // The last letter is stamped like every other key (no blank frames), and the call's next word waits for the squeeze (T7).
        card.text.innerHTML = '<span class="t">' + card.word.slice(0, -1) + '<span class="k">' + card.word.slice(-1) + "</span></span>";
        this.wait.set(card.call, now + SWAP_MS);
        for (const flash of card.el.getAnimations?.() ?? []) flash.cancel(); // a lock's or a slip's frame flash would hide the burst
        burst(card.el, 0);
        card.el.className = "td-card is-gone";
        const stamp = this.stamps.reduce((oldest, next) => (next.at < oldest.at ? next : oldest));
        stamp.el.textContent = redeemed.includes(event.item) ? "Redeemed" : GRADE_NAME[event.grade];
        stamp.el.className = "td-stamp is-" + (redeemed.includes(event.item) ? "redeem" : event.grade);
        Object.assign(stamp, { at: now + SWAP_MS, x: card.x, y: card.y - 30, half: stamp.el.offsetWidth / 2, card: card.leave === "mean" ? card : null });
      }
    }
  }

  private bind(card: Card, w: World, s: number, id: number): void {
    const c = w.words.call[s]!;
    const kind = w.calls.kind[c]!;
    const word = w.words.word[s]!;
    const back = w.words.kind[s] === KIND.review;
    const shows = this.meanings.meaning || kind === CALL_KIND.quiz;
    Object.assign(card, {
      id, b: c, call: w.calls.id(c), word: wordText(w.typing.deck, word), mean: shows ? gloss(w.typing.deck, word) : "", quiz: kind === CALL_KIND.quiz,
      learn: shows && (back || meaningShown(w.mode, this.child, this.seen === null ? null : this.seen(word))), dots: "", typed: -1, late: false, lockedAt: -1, leave: "", pinkUntil: 0,
    });
    card.el.style.setProperty("--fam", CALL_COLOR[kind]!);
    burst(card.el, SWAP_MS);
    card.el.style.setProperty("--agent", "transparent");
    card.el.dataset.icon = callLabel(w, c)[0];
    // A "Dồn lửa" call: amber (BUILD_1B §13.1); R2 (§13.3): Chữ Chiêu glows orange, a direct call is a scroll with its window's clock.
    card.el.className = "td-card" + (card.quiz ? " is-quiz" : "") + (back ? " is-review" : "") + (w.calls.burst[c] === 1 ? " is-burst" : "") + (kind === CALL_KIND.ult ? " is-ult" : kind === CALL_KIND.direct ? " is-direct" : "");
    card.sub.textContent = card.learn && !card.quiz ? card.mean : "";
    this.byId.set(id, card);
  }

  /** Letters as spans: typed (t), the first one or two by tier (l), the next after a wrong key (p); a quiz hides what is not typed past its first letter. */
  private render(card: Card, typed: number, pink: boolean, tier: number, dots: string): void {
    const at = typed > card.typed ? typed - 1 : -1; // Backspace never starts another stamp.
    const fresh = at >= 0;
    card.tier = tier;
    const letters = [...card.word].map((ch, k) => {
      const kind = (k < typed ? " t" : "") + (fresh && k === at ? " k" : "") + (k < card.tier ? " l" : "") + (pink && k === typed ? " p" : ""); // k: the key just typed pops
      const shown = card.quiz && k >= Math.max(1, typed) ? "_" : ch;
      return kind === "" ? shown : '<span class="' + kind + '">' + shown + "</span>";
    });
    card.text.innerHTML = card.quiz ? '<span class="m">' + (card.mean || "Quiz") + "</span> · " + letters.join(" ") : letters.join("");
    card.pips.textContent = dots;
    Object.assign(card, { typed, pink, dots, half: card.el.offsetWidth / 2, height: card.el.offsetHeight });
    card.el.style.setProperty("--drop", card.height - card.text.offsetTop + "px"); // the press ring stands under the card (feel.css)
  }

  /** The call (id) whose word card is under the screen point, −1 none (a click sends the agent there). */
  callAt(x: number, y: number): number {
    const card = this.cards.find((k) => k.id >= 0 && k.leave === "" && Math.abs(x - k.x) <= k.half && y >= k.y && y <= k.y + k.height);
    return card === undefined ? -1 : card.call;
  }

  /** `panels`: the HUD's panels on screen, which columns keep off when there is room; `keep`: the action on the field (the view's keepOut), the same. */
  draw(w: World, now: number, width: number, height: number, panels: readonly Rect[] = [], keep: readonly Rect[] = []): void {
    const W = w.words;
    const lock = w.typing.router.lock;
    const dt = Math.min(100, now - this.last);
    this.last = now;
    this.frame += 1;
    const lanes = new Map<number, Card[]>();
    for (let s = 0; s < W.top; s += 1) {
      if (W.used[s] === 0) continue;
      let card = this.byId.get(W.id(s));
      if (card === undefined) {
        card = this.cards.find((free) => free.id < 0);
        if (card === undefined) continue;
        this.bind(card, w, s, W.id(s));
      }
      card.slot = s;
      card.seen = this.frame;
      const pink = now < card.pinkUntil;
      // Two keys tell either word of a tier-2 pair (TK 6.5): the older one, dealt at tier 1, underlines two letters too.
      const tier = w.typing.letters.partner[w.typing.deck.letters[w.typing.deck.start[W.word[s]!]!]!]! >= 0 ? 2 : W.tier[s]!;
      const c = W.call[s]!;
      const dots = pips(w, c);
      const again = !card.learn && W.errors[s]! >= LEARN.meaningErrors; // 3 slips: the meaning shows again (§11.1)
      if (again) [card.learn, card.sub.textContent] = [true, card.quiz ? "" : card.mean];
      const typed = typedShown(card.word, W.typed[s]!, w.typing.router.group);
      if (again || typed !== card.typed || pink !== card.pink || tier !== card.tier || dots !== card.dots) this.render(card, typed, pink, tier, dots);
      card.lockedAt = lock !== s ? -1 : card.lockedAt < 0 ? w.tick : card.lockedAt;
      const late = w.calls.expire[c]! >= 0 && w.calls.expire[c]! - w.tick < 1.5 * 60;
      if (late !== card.late) card.el.classList.toggle("is-late", (card.late = late));
      card.el.classList.toggle("is-locked", lock === s);
      if (W.typed[s] === 0 && (this.wait.get(card.call) ?? 0) > now) {
        card.el.style.opacity = "0";
        continue;
      }
      (lanes.get(c) ?? lanes.set(c, []).get(c)!).push(card);
    }
    // A meaning stays in its call's column, over the call's next word, newest lowest; its call ended, in a column of
    // its own (key −1 − its pool index) where it last stood, so other columns still part around it.
    for (const card of this.cards.filter((k) => k.leave === "mean" && k.meanAt !== undefined && now >= k.meanAt)) {
      if (now - (card.hitAt ?? now) < 900 && this.feel?.hold?.(card.call)) {
        // A Word Shot in flight: the strip and its grade wait, empty, until the impact (judge C10 r2: they hid it).
        [card.meanAt, card.leaveAt] = [now + 1, now + 40]; // squeeze() reads 154 ms: still empty next frame
        for (const stamp of this.stamps) if (stamp.card === card) stamp.at = card.leaveAt;
        continue;
      }
      card.meanAt = undefined;
      card.text.innerHTML = '<span class="t">' + card.word + "</span> · " + card.mean;
      card.pips.textContent = card.sub.textContent = "";
      card.el.className = "td-card is-mean";
      Object.assign(card, { half: card.el.offsetWidth / 2, height: card.el.offsetHeight });
    }
    for (const card of this.cards.filter((k) => k.leave === "mean" && now - k.leaveAt < MS.mean).sort((a, b) => b.leaveAt - a.leaveAt)) {
      let c = w.calls.slotOf(card.call);
      if (c < 0) [c, card.ax, card.ay] = [-1 - this.cards.indexOf(card), Number.isNaN(card.ax) ? card.x : card.ax, Number.isNaN(card.ax) ? card.y + card.height : card.ay];
      (lanes.get(c) ?? lanes.set(c, []).get(c)!).push(card);
    }
    this.layout(w, lanes, lock, now, dt, width, height, panels, keep);
    const safe = { width, height, panels };
    for (const card of this.cards) {
      // A word gone with no result read (the run was reset, its call closed) folds away; one never shown (its call's next word
      // waiting out a squeeze, a tray card over the cap) has nowhere to fold from: it is let go (C10 r4: a fresh card had no x, y).
      if (card.id >= 0 && card.leave === "" && card.seen !== this.frame) {
        this.byId.delete(card.id);
        if (card.y === undefined || card.el.style.opacity === "0") Object.assign(card, { id: -1 }).el.style.opacity = "0";
        else Object.assign(card, { leave: "fold", leaveAt: now }).el.classList.add("is-gone");
      }
      if (card.id >= 0 && card.leave !== "") this.leaving(card, now);
      if (card.id >= 0) {
        // Include the rim, review label and agent dot outside the border. Clamp after slide, scale, tilt and squeeze.
        const [dx, dy] = fitElement(card.el, safe, card.height * 0.12 + 12);
        card.x += dx; card.y += dy;
      }
    }
    this.stamper?.(this.cards, this.root, this.chainTier, now, safe);
    this.feel?.frame(this.cards.filter((k) => k.id >= 0), now, safe);
    for (const stamp of this.stamps) {
      if (now < stamp.at && stamp.at - now <= SWAP_MS) { stamp.el.style.opacity = "0"; continue; } // its grade comes with the meaning
      const p = Math.min(1, (now - stamp.at) / MS.stamp);
      // A meaning card moves up its column over the call's next word: the stamp stays over it, never on its words (review R2).
      if (stamp.card !== null && stamp.card.leave === "mean" && stamp.card.leaveAt === stamp.at) [stamp.x, stamp.y] = [stamp.card.x, stamp.card.y - 30];
      if (p < 1 || stamp.el.style.opacity !== "0.00") {
        place(stamp.el, stamp.x - stamp.half, stamp.y - 28 * p, "1", 1 - p * p);
        fitElement(stamp.el, safe, 2);
      }
    }
  }

  private layout(w: World, lanes: Map<number, Card[]>, lock: number, now: number, dt: number, width: number, height: number, panels: readonly Rect[], keep: readonly Rect[]): void {
    const W = w.words;
    const C = w.calls;
    const boxes: LaneBox[] = [];
    const columns: { b: number; cards: Card[]; heights: number[]; roofY: number }[] = [];
    for (const [c, cards] of lanes) {
      // A call's word does not run out: it sits on the roof, never rises with a clock.
      const { heights, tallest, half } = columnBox(cards, lock);
      const roof: { x: number; y: number; edge?: number } = c >= 0 ? (this.anchor?.(w, c, false) ?? this.project(C.x[c]!, C.z[c]! - ROOF_M)) : { x: cards[0]!.ax, y: cards[0]!.ay };
      // C10's edge tray (3D, words.ts): a call off screen stands at the edge towards it (data-edge, feel.css); one over the tray's cap waits unseen.
      if (roof.edge === -2) {
        for (const card of cards) card.el.style.opacity = "0";
        continue;
      }
      const e = roof.edge ?? -1;
      const edge = String(roof.edge ?? "");
      for (const card of cards) if (card.el.dataset.edge !== edge) card.el.dataset.edge = edge;
      // A tray column's room for its pointer towards the caller comes with its anchor (3d/words.ts), so its slide eases into it.
      const x = roof.x;
      // Clear of the HUD's bars across the middle at every zoom: a column over one stands under the top bar, over the bottom one.
      let [lo, hi]: [number, number] = [SAFE.top, height - SAFE.bottom];
      for (const p of panels) if (p.left < x + half && p.right > x - half && p.left < width / 2 && p.right > width / 2) [lo, hi] = p.top > height / 2 ? [lo, Math.min(hi, p.top - 4)] : [Math.max(lo, p.bottom + 4), hi];
      [lo, hi] = [lo + (e === 2 ? 40 : 0), hi - (e === 3 ? 40 : 0)];
      let roofY = Math.min(hi, Math.max(roof.y, lo + tallest));
      // An edge tray column stays at its edge: over a side panel there it stands under it (a top one) or over it (a bottom one),
      // tested where it was drawn (its parting offset in): a card sliding in beside the panel is not snapped under it (judge C10 r5).
      const at = x + (this.offsets.get(c) ?? 0);
      if (e >= 0) for (const p of panels) if (p.left < at + half && p.right > at - half && p.top < roofY && roofY - tallest < p.bottom) roofY = p.top > height / 2 ? p.top - 6 : p.bottom + 6 + tallest;
      boxes.push({ x, top: roofY - tallest, bottom: roofY, half, at });
      columns.push({ b: c, cards, heights, roofY });
    }
    // Off the side panels and the action when the columns still part there (review R2: a fourth bubble pushed over the
    // dock); else off the action alone, else over both and further than 240 px, as 1A: a word is never hidden under another.
    const spread = (out: LaneBox[], push?: number): number[] => spreadLanes(out, SAFE.side, width - SAFE.side, [], push);
    let target = spread(boxes.map((box) => besidePanels(box, panels, width / 2, keep)));
    if (lanesTouch(boxes, target)) target = spread(boxes.map((box) => besidePanels(box, [], width / 2, keep)));
    if (lanesTouch(boxes, target)) target = spread(boxes, width);
    let eased = columns.map((column, index) => {
      const was = this.offsets.get(column.b) ?? target[index]!;
      return Math.abs(target[index]!) >= Math.abs(was) ? target[index]! : was + (target[index]! - was) * (1 - Math.exp(-dt / MS.spring));
    });
    // Easing back never lets two columns touch (two that swap sides would cross): then they all take their places at once.
    const touch = (i: number, j: number): boolean => boxes[i]!.top < boxes[j]!.bottom && boxes[j]!.top < boxes[i]!.bottom && Math.abs(boxes[i]!.x + eased[i]! - boxes[j]!.x - eased[j]!) < boxes[i]!.half + boxes[j]!.half;
    if (boxes.some((_, i) => boxes.some((__, j) => j > i && touch(i, j)))) eased = target;
    columns.forEach((column, index) => {
      const offset = eased[index]!;
      this.offsets.set(column.b, offset);
      column.cards.forEach((card, k) => {
        const s = card.slot;
        const locked = s >= 0 && lock === s;
        const typing = locked && W.typed[s]! >= 2;
        const expire = column.b >= 0 ? C.expire[column.b]! : -1;
        // C10 pose: the lock size eased (30 ms) with a burst over it (TYPING_BREAK_STUDY T3), a 3 px tick per right key, a slip's
        // shake and tilt dying in 90 ms (ART_DIRECTION §8.2: readable, not a red flash), a typed card's squeeze and pop while it shows its meaning.
        const size = typing ? 1.2 : locked ? 1.1 : 1;
        card.scale = size + ((card.scale ?? size) - size) * Math.exp(-dt / 30);
        const slip = decay(now - (card.slipAt ?? -1e9), 90);
        const wave = Math.sin((now - (card.slipAt ?? 0)) * 0.14);
        card.y = column.roofY - column.heights[k]! - card.height - 3 * decay(now - (card.keyAt ?? -1e9), 40);
        card.x = boxes[index]!.x + offset + 18 * Math.max(0, (card.scale - 1.1) / 0.1) + slip * 12 * wave;
        const left = expire < 0 || s < 0 ? 0 : Math.max(0, (expire - w.tick) / Math.max(1, expire - C.born[column.b]!));
        card.bar.style.transform = "scaleX(" + left.toFixed(3) + ")";
        if (C.kind[column.b] === CALL_KIND.direct) card.el.style.setProperty("--t", (100 * left).toFixed(0) + "%"); // the window's clock ring
        if (card.leave === "mean") burst(card.el, now - card.leaveAt + SWAP_MS);
        const scale = card.leave === "mean" ? squeeze(now - card.leaveAt + SWAP_MS) : (card.scale + 0.06 * decay(now - (card.lockAt ?? -1e9), 35)).toFixed(3);
        place(card.el, card.x - card.half, card.y, scale, lock >= 0 && !locked && card.leave === "" ? 0.7 : 1, slip * 3.5 * wave); // a typed card bursts opaque (judge C10 r3)
      });
    });
  }

  private leaving(card: Card, now: number): void {
    if (card.leave === "mean") {
      if (now - card.leaveAt >= MS.mean) Object.assign(card, { leave: "fold", leaveAt: now }).el.classList.add("is-gone");
      return;
    }
    const p = Math.min(1, (now - card.leaveAt) / MS[card.leave as "hit" | "fold"]);
    if (p >= 1) {
      Object.assign(card, { id: -1, leave: "" });
      card.el.style.opacity = "0";
    } else if (card.leave === "hit") [burst(card.el, now - card.leaveAt), place(card.el, card.x - card.half, card.y, squeeze(now - card.leaveAt), 1)]; // its letters fly home on the 3D view
    else place(card.el, card.x - card.half, card.y, (1 - p * p).toFixed(3) + ",1", 1 - p * p); // squeezed sideways, faster at the end (TYPING_BREAK_STUDY T7)
  }
}

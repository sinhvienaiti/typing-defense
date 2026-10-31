/**
 * C10's key stamps (Codex 203 A5, recheck 232 F3): the letter just typed is stamped over itself at 2.4×, then 1.8, 1.3 and
 * 1 in 50 ms, gone before 67 ms. A chunk main.ts asks for with the page (out of the start set, BUILD_1B §20): WordCards
 * draws them once it is in. The first pose is written in the draw, never scheduled by CSS.
 */
import { fitElement } from "./dom";
import type { SafeFrame } from "./safe";

/**
 * Synchronous frame steps; the tier adds the same 0.25 as the original stamp. `done`: the word's last key, whose card bursts
 * at once: from 1.8×, so the word stays readable as it completes (judge C10 r5: 2.4× and the flying letters hid it 2 frames).
 */
export function stampStep(t: number, tier: number, done = false) {
  const k = t < 17 ? 0 : t < 33 ? 1 : t < 50 ? 2 : 3;
  return { scale: (done ? [1.8, 1.45, 1.15, 1] : [2.4, 1.8, 1.3, 1])[k]! + (k < 3 ? (done ? 0.1 : 0.25) * tier : 0), tilt: [-8, -6, -3, 0][k]!, opacity: t >= 0 && t < 66 ? 1 : 0 };
}

/** What a word card (cards.ts) shares with its key stamp. */
export type StampCard = { el: HTMLElement; text: HTMLElement; stamp?: { el: HTMLElement; at: number; source: HTMLElement } };

/** Each card's stamp over its `.k` letter, measured, at chain tier `tier`; a new stamp's element goes into `root`. */
export function keyStamps(cards: readonly StampCard[], root: HTMLElement, tier: number, now: number, safe: SafeFrame): void {
  for (const card of cards) {
    const source = card.text?.querySelector<HTMLElement>(".k");
    let key = card.stamp;
    if (source && source !== key?.source) {
      const el = key?.el ?? root.appendChild(Object.assign(document.createElement("div"), { className: "td-key-stamp" }));
      el.textContent = source.textContent;
      card.stamp = key = { el, at: now, source };
    }
    if (!key) continue;
    if (!source || Number(card.el.style.opacity) <= 0) { key.el.style.opacity = "0"; continue; }
    const done = card.el.classList?.contains("is-gone") === true;
    const step = stampStep(now - key.at, tier, done);
    key.el.style.opacity = String(step.opacity);
    if (!step.opacity) continue;
    const soft = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const r = key.source.getBoundingClientRect();
    const x = (r.left + r.right) / 2, y = (r.top + r.bottom) / 2;
    // The stamp's font is the letter's (feel.css); the card's own scale on screen (lock, typing, burst) is the letter's rect over its
    // layout height, so the stamp settles at exactly the letter's size (recheck 232 F3: it was 1.11-1.44x).
    const fit = (r.bottom - r.top) / (key.source.offsetHeight || r.bottom - r.top) || 1;
    const max = stampStep(0, tier, done).scale;
    const pose = (scale: number, tilt: number): string => {
      const drop = soft ? 0 : (scale - 1) / (max - 1);
      return `translate(${x - 10 * drop}px,${y - 28 * drop}px) translate(-50%,-50%) rotate(${soft ? 0 : tilt}deg) scale(${+((soft ? 1 : scale) * fit).toFixed(3)})`;
    };
    // Measure the largest pose, with room for its complete settling path and glow, in this same draw.
    key.el.style.transform = pose(max, -8);
    fitElement(key.el, safe, 28);
    key.el.style.transform = pose(step.scale, step.tilt);
  }
}

import { keepIn, type SafeFrame } from "./safe";

/** Clamp after interpolation and CSS transforms. Return the translation for the card's screen anchor too. */
export function fitElement(el: HTMLElement, frame: SafeFrame, extra = 0): [number, number] {
  el.style.translate = "";
  const r = el.getBoundingClientRect?.();
  if (!r || r.width === 0 || Number(el.style.opacity) <= 0) return [0, 0];
  const box = { left: r.left - extra, top: r.top - extra, right: r.right + extra, bottom: r.bottom + extra };
  const safe = keepIn(box, frame, frame.panels);
  const dx = safe.left - box.left, dy = safe.top - box.top;
  if (dx || dy) el.style.translate = `${dx}px ${dy}px`;
  return [dx, dy];
}

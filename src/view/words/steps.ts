/** Display-only prefix for an open tier-2 pair; never mutate the router or the words. */
export const typedShown = (word: string, typed: number, group: number): number => typed === 0 && group >= 0 && word.charCodeAt(0) - 97 === group ? 1 : typed;

/** First two frames are a hard warm-white stroke, then the existing exponential fade through the swap gap. */
export function rimAt(t: number, cardH: number, ui: number) {
  const light = t < 0 || t >= 194 ? 0 : t < 34 ? 1 : Math.exp(-(t - 34) / 45);
  return { color: "#FFF0D8", width: Math.max(4, 5 * ui), out: cardH * 0.11, blur: t < 34 ? 0 : 28 * ui, light };
}

/** Synchronous frame steps; the tier adds the same 0.25 as the original stamp. */
export function stampStep(t: number, tier: number) {
  const k = t < 17 ? 0 : t < 33 ? 1 : t < 50 ? 2 : 3;
  return { scale: [2.4, 1.8, 1.3, 1][k]! + (k < 3 ? 0.25 * tier : 0), tilt: [-8, -6, -3, 0][k]!, opacity: t >= 0 && t < 66 ? 1 : 0 };
}

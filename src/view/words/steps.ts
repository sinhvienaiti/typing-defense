/** Display-only prefix for an open tier-2 pair; never mutate the router or the words. */
export const typedShown = (word: string, typed: number, group: number): number => typed === 0 && group >= 0 && word.charCodeAt(0) - 97 === group ? 1 : typed;

/** First two frames are a hard warm-white stroke, then the existing exponential fade through the swap gap. */
export function rimAt(t: number, cardH: number, ui: number) {
  const light = t < 0 || t >= 194 ? 0 : t < 34 ? 1 : Math.exp(-(t - 34) / 45);
  return { color: "#FFF0D8", width: Math.max(4, 5 * ui), out: cardH * 0.11, blur: t < 34 ? 0 : 28 * ui, light };
}

/**
 * The map's trees (BUILD_1A6 §4.2), by map index: standing until felled (a stump after, which blocks nothing), marked
 * for the villagers, chopped by at most one villager (`worker`, −1 none, −2 no way there); `progress` 0–1 of the chop;
 * `left` the wood it still holds (the owner's rule, 26/10/2026: it falls at 0, full again each day).
 */
export class TreeStore {
  readonly standing: Uint8Array;
  readonly marked: Uint8Array;
  readonly worker: Int16Array;
  readonly progress: Float64Array;
  readonly left: Uint16Array;

  constructor(readonly count: number, reserve: number) {
    this.standing = new Uint8Array(count).fill(1);
    this.marked = new Uint8Array(count);
    this.worker = new Int16Array(count).fill(-1);
    this.progress = new Float64Array(count);
    this.left = new Uint16Array(count).fill(reserve);
  }
}

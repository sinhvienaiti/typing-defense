/**
 * Tối Thượng (BUILD_1B §8), hashed like every store: the charge (0–100), the last cast's tick, the rain (on: 1) at
 * (x, z) with its feathers left to drop, the next drop and the last one, feathers due at dueAt (Chữ Chiêu), its call's
 * id, and the enemies its feathers aimed at this round.
 */
export class UltStore {
  charge = 0;
  castAt = -0x40000000;
  on = 0;
  x = 0;
  z = 0;
  left = 0;
  nextAt = 0;
  lastAt = 0;
  due = 0;
  dueAt = 0;
  call = -1;
  readonly aimed = new Int32Array(32);
  aimedN = 0;
}

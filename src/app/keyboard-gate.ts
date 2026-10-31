/** The run's first step waits at most this long for the saved keyboard set's first decoded batch (parent TYPING_FEEL_SERVICE.md §5.1 step 6). */
export const KEYBOARD_GATE_MS = 1500;

/**
 * Started with the page (main.ts; entry chunk, so no kit audio here). Opens at the first of: app/quick.ts says the saved
 * set's first batch is in ("batch") or its load ended without one ("ended"), or KEYBOARD_GATE_MS passed ("time"). Clock ms.
 */
export class KeyboardGate {
  isOpen = false;
  openedAt = -1;
  by: "batch" | "ended" | "time" | "" = "";
  readonly startedAt: number;
  private readonly timer: ReturnType<typeof setTimeout>;

  constructor(ms = KEYBOARD_GATE_MS, private readonly clock = (): number => performance.now()) {
    this.startedAt = clock();
    this.timer = setTimeout(() => this.open("time"), ms);
  }

  open(by: "batch" | "ended" | "time"): void {
    if (this.isOpen) return;
    clearTimeout(this.timer);
    [this.isOpen, this.openedAt, this.by] = [true, this.clock(), by];
  }
}

/**
 * The chunks main.ts loads with import() (BUILD_1B §20; R2 review fix 2): each is asked once and retried with a growing
 * pause (a dropped connection), then given up with one console error, so the page falls back instead of waiting for
 * good (a stale chunk after a redeploy cannot load until the page reloads). A failed chunk may be asked again, not
 * sooner than `coolMs` after the last failure.
 */
export async function loadChunk<T>(name: string, load: () => Promise<T>, tries = 3, waitMs = 400): Promise<T | null> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await load();
    } catch (error) {
      if (attempt >= tries) {
        console.error(`typing defense: the ${name} chunk did not load (${tries} tries)`, error);
        return null;
      }
      await new Promise((resolve) => setTimeout(resolve, waitMs * attempt));
    }
  }
}

/** A chunk the page wants: `value` once in; `settled` once in or given up; `failed` while its last try failed. */
export class Chunk<T> {
  value: T | null = null;
  settled = false;
  failed = false;
  private loading: Promise<T | null> | null = null;
  private failedAt = -Infinity;

  constructor(private readonly name: string, private readonly load: () => Promise<T>, private readonly tries = 3, private readonly waitMs = 400, private readonly coolMs = 15_000) {}

  /** Starts the load or joins it; null at once while a failure is fresh. */
  get(): Promise<T | null> {
    if (this.value !== null) return Promise.resolve(this.value);
    if (this.loading === null && this.failed && Date.now() - this.failedAt < this.coolMs) return Promise.resolve(null);
    this.loading ??= loadChunk(this.name, this.load, this.tries, this.waitMs).then((value) => {
      [this.value, this.settled, this.failed, this.loading] = [value, true, value === null, null];
      if (value === null) this.failedAt = Date.now();
      return value;
    });
    return this.loading;
  }
}

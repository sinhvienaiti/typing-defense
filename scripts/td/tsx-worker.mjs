// A worker thread's entry for scripts run with `node --import tsx`: on Node 24.11 (Linux) tsx's hooks do not reach
// worker threads, so register them here, then load the TypeScript module named by workerData.entry.
import { workerData } from "node:worker_threads";
import { register } from "tsx/esm/api";

register();
await import(workerData.entry);

/** A worker of `pnpm td:balance`: plays its share of the stage matrix (tests/td/flow.ts) and posts the cells back; tuning overrides first. */
import { parentPort, workerData } from "node:worker_threads";
import { playCell, type CellSpec } from "../../tests/td/flow";
import { realDeck } from "../../tests/td/typing";
import { applySets } from "./overrides";

const { cells, seeds, from, sets } = workerData as { cells: CellSpec[]; seeds: number; from: number; sets: string[] };
applySets(sets ?? []);
const deck = realDeck();
parentPort!.postMessage(cells.map((cell) => playCell(cell, seeds, deck, undefined, from)));

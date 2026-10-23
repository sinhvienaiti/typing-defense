/** A worker of `pnpm td:balance`: plays its share of the stage matrix (tests/td/flow.ts) and posts the cells back. */
import { parentPort, workerData } from "node:worker_threads";
import { playCell, type CellSpec } from "../../tests/td/flow";
import { realDeck } from "../../tests/td/typing";

const { cells, seeds } = workerData as { cells: CellSpec[]; seeds: number };
const deck = realDeck();
parentPort!.postMessage(cells.map((cell) => playCell(cell, seeds, deck)));

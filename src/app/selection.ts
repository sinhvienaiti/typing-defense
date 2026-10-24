/**
 * What the player has in hand (docs/td/TYPING_DEFENSE_DESIGN.md 25.7: app
 * state, never in the sim). Keys and buttons name the same actions, so every
 * task has a keyboard path (BUILD_NOW §5.4, BUILD_1A6 §8). Tab goes through
 * the buildings, then the dim calls, nearest the agent first; Enter sends the
 * agent there. A click on a tree marks it, on a ripe plot asks its farmer to
 * harvest it first, on an NPC or a call's bubble sends the agent to it. Space
 * is the tactical pause of the relax and learn modes: the world stops, the
 * hand keeps working, typing waits.
 */
import { ticks } from "../content/compile";
import { ECONOMY, FARM, MODES, SELL, TREE } from "../content/rules";
import type { CommandBody, SandboxOp } from "../sim/commands";
import { canPlace, nextSpot, spotCandidates, type Point } from "../sim/placement";
import { PLOT } from "../sim/stores/buildings";
import { CALL_STATE } from "../sim/stores/calls";
import { slotsOpen } from "../sim/systems/agents";
import { plotAt } from "../sim/systems/economy";
import { ultSpot } from "../sim/systems/ult";
import type { World } from "../sim/world";
import { REASON } from "../ui/hud";

const q = (metres: number): number => Math.round(metres * 4);

/** A sandbox button's `sb:<op>:<value>` as its command (app/sandbox.ts draws the panel): the level row sets the building in focus; gold and wood are added; the mode's value is a word. */
export function sandboxOp(op: string, value: string, w: World, focus: number): SandboxOp {
  if (op === "level") return { op, building: focus, value: Number(value) };
  if (op === "gold") return { op, value: Math.floor(w.gold / 1000) + Number(value) };
  if (op === "wood") return { op, value: w.wood + Number(value) };
  if (op === "spawn") return { op, enemy: value, value: value === "tanuki" ? 1 : 3 };
  if (op === "ult") return { op };
  return { op, value: op === "mode" ? value : Number(value) } as SandboxOp;
}
const dist2 = (x: number, z: number, p: Point): number => (x - p.x) * (x - p.x) + (z - p.z) * (z - p.z);

export class Selection {
  agent = 0;
  /** The building whose card is open, by id (−1 none); or the dim call Tab is on, by id (−1 none). */
  focus = -1;
  call = -1;
  building = false;
  kind = 1;
  /** The build ghost stands at the mouse once it moves over the field, else at `spots[spot]` (−1: none free). */
  mouse: Point | null = null;
  spots: Point[] = [];
  spot = -1;
  paused = false;
  /** Space in relax and learn (§8). */
  tactical = false;
  panel = true;
  /** A sale asks twice within 3 s (BUILD_1B §7): the building's id and when the first press lapses. */
  sellArm = { id: -1, until: 0 };
  /** The field point under the pointer (null: off the map): where `=` casts Tối Thượng when within reach (BUILD_1B §8.2). */
  hover: Point | null = null;

  constructor(private readonly w: World, private readonly send: (command: CommandBody) => void) {}

  private readonly actions: Record<string, (n: number) => unknown> = {
    pick: (n) => (this.building ? this.choose(n, this.mouse) : this.actions.agent!(n - 1)), // Digit1–5; a build menu row
    agent: (n) => n >= 0 && n < slotsOpen(this.w) && (this.agent = n),
    cycle: () => (this.agent = (this.agent + 1) % slotsOpen(this.w)),
    recall: () => this.send({ t: "recall", agent: this.agent }),
    next: () => this.next(1),
    prev: () => this.next(-1),
    send: () => (this.building ? this.build(null) : this.call >= 0 ? this.toCall(this.call) : this.focus >= 0 && this.send({ t: "assignUnit", agent: this.agent, building: this.focus })),
    night: () => this.send({ t: "callNight" }),
    hire: () => this.send({ t: "hire" }),
    seeds: () => this.send({ t: "buySeeds" }),
    autoSeeds: () => this.send({ t: "autoSeeds", on: !this.w.autoSeeds }),
    sellFood: () => this.send({ t: "sellFood" }),
    sellWood: () => this.send({ t: "sellWood" }),
    upgrade: () => this.focus >= 0 && this.send({ t: "upgrade", building: this.focus }),
    build: () => this.choose(this.kind, null),
    undo: () => this.undoable() && this.send({ t: "sell", building: this.focus }), // the card's button; Delete
    sell: () => this.sell(),
    close: () => this.close(),
    escape: () => this.escape(),
    pause: () => (this.tactical ? (this.tactical = false) : (this.paused = !this.paused)), // the HUD's ▶ ends either pause
    space: () => MODES[this.w.mode].pause && (this.tactical = !this.tactical),
    sandbox: () => (this.panel = !this.panel),
    ult: () => {
      const at = ultSpot(this.w, this.hover);
      this.send({ t: "ult", qx: q(at.x), qz: q(at.z) });
    },
  };

  /** `name`, `name:value`, or `sb:<op>:<value>` for the sandbox. */
  act(action: string): void {
    const [name = "", arg = "", value = ""] = action.split(":");
    if (name === "sb") this.send({ t: "sandbox", op: sandboxOp(arg, value, this.w, this.focus) });
    else this.actions[name]?.(Number(arg));
    this.update();
  }

  /** The building in focus has a site or an upgrade within its 5 s undo (BUILD_1A6 §4.3). */
  undoable(): boolean {
    const B = this.w.buildings;
    const b = B.slotOf(this.focus);
    return b > 0 && (B.ready[b] === 0 || B.upTo[b]! > 0) && this.w.tick - B.builtTick[b]! <= ticks(ECONOMY.undoWindowS);
  }

  /** The first press arms the sale, a second within 3 s sends it. */
  private sell(): void {
    const now = performance.now();
    if (this.w.buildings.slotOf(this.focus) <= 0) return;
    if (this.sellArm.id === this.focus && now < this.sellArm.until) {
      this.send({ t: "sell", building: this.focus });
      this.sellArm.id = -1;
    } else this.sellArm = { id: this.focus, until: now + SELL.confirmS * 1000 };
  }

  /** A sale armed for building `id`. */
  armed(id: number): boolean {
    return this.sellArm.id === id && performance.now() < this.sellArm.until;
  }

  /** Paused either way: the session does not step and typing keys are not taken. */
  get halted(): boolean {
    return this.paused || this.tactical;
  }

  /** After each action and frame: a card whose building or call is gone closes, an agent whose slot closed gives way to the hero, the tactical pause ends with its mode. */
  update(): void {
    if (this.w.buildings.slotOf(this.focus) < 0) this.focus = -1;
    if (this.w.calls.slotOf(this.call) < 0) this.call = -1;
    if (this.agent >= slotsOpen(this.w)) this.agent = 0;
    if (!MODES[this.w.mode].pause) this.tactical = false;
  }

  /** Tab: the build menu's next suggested spot, else the next building, then the next dim call, each by distance from the agent (TK 8.3, §8). */
  private next(dir: 1 | -1): void {
    if (this.building) {
      this.mouse = null;
      this.spot = nextSpot(this.w, this.kind, this.spots, (this.spot + dir + this.spots.length) % this.spots.length, dir);
      return;
    }
    const { buildings: B, calls: C } = this.w;
    const from = { x: this.w.agents.x[this.agent]!, z: this.w.agents.z[this.agent]! };
    const near = (S: typeof B | typeof C, list: number[]) => list.sort((p, r) => dist2(S.x[p]!, S.z[p]!, from) - dist2(S.x[r]!, S.z[r]!, from) || p - r).map((k) => S.id(k));
    const dim = C.live().filter((c) => C.state[c] === CALL_STATE.open && C.bright[c] === 0);
    const order = [...near(B, B.live()).map((id): [number, number] => [id, -1]), ...near(C, dim).map((id): [number, number] => [-1, id])];
    const at = order.findIndex(([b, c]) => b === this.focus && c === this.call);
    [this.focus, this.call] = order[at < 0 ? (dir > 0 ? 0 : order.length - 1) : (at + dir + order.length) % order.length]!;
  }

  /** Sends the agent to call `id`: by the building it is about, else where its caller stands (§8). */
  toCall(id: number): void {
    const C = this.w.calls;
    const c = C.slotOf(id);
    if (c < 0) return;
    const b = C.b[c]!;
    this.send(b >= 0 ? { t: "assignUnit", agent: this.agent, building: this.w.buildings.id(b) } : { t: "move", agent: this.agent, qx: q(C.x[c]!), qz: q(C.z[c]!) });
  }

  /** The ghost starts at `at` (a click on open ground), else at the kind's first suggested spot. */
  private choose(kind: number, at: Point | null): void {
    if (!(kind >= 1 && kind < this.w.c.buildings.length)) return;
    this.focus = this.call = -1;
    this.building = true;
    this.kind = kind;
    this.mouse = at;
    this.spots = spotCandidates(this.w, kind);
    this.spot = nextSpot(this.w, kind, this.spots, 0, 1);
  }

  /** Where the build ghost stands (a mine on the node it would take) and, in words, why it may not ("" when it may). */
  ghost(): { x: number; z: number; reason: string } | null {
    const at = this.mouse ?? this.spots[this.spot];
    if (!this.building || at === undefined) return null;
    const placed = canPlace(this.w, this.kind, q(at.x), q(at.z));
    return placed.ok ? { x: placed.x, z: placed.z, reason: "" } : { x: at.x, z: at.z, reason: REASON[placed.reason]! };
  }

  private build(at: Point | null): void {
    if (at !== null) this.mouse = at;
    const ghost = this.ghost();
    if (ghost === null || ghost.reason !== "") return;
    this.send({ t: "build", def: this.kind, qx: q(ghost.x), qz: q(ghost.z) });
    this.close();
  }

  pointer(p: Point | null): void {
    this.hover = p;
    if (this.building && p !== null) this.mouse = p;
  }

  /** The ripe plot of farm b under p, −1 none. */
  private ripePlot(b: number, p: Point): number {
    for (let k = 0; k < FARM.plots; k += 1) if (this.w.buildings.plot[b * FARM.plots + k] === PLOT.ripe && dist2(p.x, p.z, plotAt(this.w, b, k)) <= 1) return k;
    return -1;
  }

  /**
   * TK 8.3: right sends the agent to a building or to stand at the point; left builds, harvests a ripe plot, sends
   * the agent to an NPC (by its call, its farm, or where it stands), marks a tree, opens a card or the build menu.
   */
  click(p: Point, right: boolean): void {
    const { buildings: B, npcs: N } = this.w;
    const hit = B.live().find((b) => dist2(B.x[b]!, B.z[b]!, p) <= (this.w.c.buildings[B.def[b]!]!.radius + 0.3) ** 2);
    const b = hit === undefined ? -1 : B.id(hit);
    const plot = hit === undefined ? -1 : this.ripePlot(hit, p);
    const npc = N.live().find((n) => dist2(N.x[n]!, N.z[n]!, p) <= 0.7 * 0.7) ?? -1; // its dot
    const tree = this.w.map.trees.findIndex(([x, z], t) => this.w.trees.standing[t] === 1 && dist2(x, z, p) <= (TREE.radiusM + 0.3) ** 2);
    const field = Math.abs(p.x) <= this.w.map.halfM && Math.abs(p.z) <= this.w.map.halfM;
    this.call = -1;
    if (right && this.building) this.close();
    else if (right) this.send(b >= 0 ? { t: "assignUnit", agent: this.agent, building: b } : { t: "move", agent: this.agent, qx: q(p.x), qz: q(p.z) });
    else if (this.building) this.build(p);
    else if (plot >= 0) this.send({ t: "harvestPlot", building: b, plot });
    else if (npc >= 0 && N.call[npc]! >= 0) this.toCall(this.w.calls.id(N.call[npc]!));
    else if (npc >= 0) this.send(N.home[npc]! >= 0 ? { t: "assignUnit", agent: this.agent, building: B.id(N.home[npc]!) } : { t: "move", agent: this.agent, qx: q(N.x[npc]!), qz: q(N.z[npc]!) });
    else if (tree >= 0 && b < 0) this.send({ t: "markTree", tree });
    else if (b >= 0 || this.focus >= 0 || !field) this.focus = b;
    else this.choose(this.kind, p);
    this.update();
  }

  /** Esc (TK 6.15): lets go of the locked word, else closes the menu, else goes back to the hero, else pauses. */
  private escape(): void {
    const router = this.w.typing.router;
    if (router.lock >= 0 || router.group >= 0) this.send({ t: "unlock" });
    else if (this.building || this.focus >= 0 || this.call >= 0) this.close();
    else if (this.agent !== 0) this.agent = 0;
    else this.paused = !this.paused;
  }

  private close(): void {
    this.focus = this.call = -1;
    this.building = false;
  }
}

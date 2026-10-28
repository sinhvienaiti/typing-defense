/**
 * Map 1's houses in 3D (1C step C6, docs/td/BUILD_1C_MAP1.md §8): each building of the sim drawn from its Tripo model
 * (buildings/<id>) with the level kits src/view/3d/kits.json lists, facing the default camera; a site under the bamboo
 * scaffold (props/scaffold-bamboo, scaled to the footprint) until it is ready, then the house grows in over 1.2 s; a new
 * level's kits drop in with a bounce; level pennants on FX_banner; the Cannon Tower's barrel on FX_turret (the L3 kit
 * swaps it); the Gold Mine's pile by its gold. The build ghost: the house see-through on a green or red ring at
 * heightAt. The two landmarks (the Thác Bạc cliff at the stream's head, the watch hut on Đồi Cầu Vồng) stand outside the
 * field. It reads the world and never changes it; a model that is not in yet leaves its slot empty until it is.
 */
import * as THREE from "three";
import type { MapDef } from "../../content/types";
import { loadModel, ModelLibrary } from "../../kit/three/model-loader";
import type { World } from "../../sim/world";
import type { Hand } from "../view";
import { heightAt } from "./ground";
import KITS from "./kits.json";
import type { Tier3D } from "./stage";

/** The kinds of this game's manifest beyond the kit's own (Codex 107). */
const KINDS = ["buildings", "kits", "landmarks", "projectiles"];
type Kit = { kit: string; at: number[]; yaw?: number; replaces?: string };
const TABLE = KITS as unknown as Record<string, Record<string, Kit[]>>;
const GROW_MS = 1200;
const DROP_MS = 500;
/** The scaffold model is sized to an M ring (Ø 4.8 m); scaled to each footprint. */
const SCAFFOLD_M = 4.8;
const GREEN = new THREE.Color("#38d39f");
const RED = new THREE.Color("#ff4a4a");

type House = { group: THREE.Group; def: string; level: number; ready: boolean; complete: boolean; body: THREE.Object3D | null; kits: THREE.Object3D[]; extras: THREE.Object3D[]; scaffold: THREE.Object3D | null; grownAt: number; droppedAt: number; pile: number; seen: boolean };

const ease = (t: number): number => {
  const c = 1.70158; // easeOutBack: a little overshoot
  const u = Math.min(1, Math.max(0, t)) - 1;
  return 1 + (c + 1) * u * u * u + c * u * u;
};

export class Houses {
  private readonly library = new ModelLibrary({ manifests: "/assets/typing-defense/models/manifest.json", kinds: KINDS });
  private readonly models = new Map<string, THREE.Object3D | null>();
  private readonly asked = new Set<string>();
  private readonly houses = new Map<number, House>();
  private readonly ring = new THREE.Mesh(new THREE.RingGeometry(0.86, 1, 64).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.75, depthWrite: false }));
  private ghost: { def: string; body: THREE.Object3D } | null = null;
  private readonly root = new THREE.Group();

  constructor(layer: THREE.Group, private readonly map: MapDef, private readonly tier: Tier3D) {
    this.ring.visible = false;
    this.ring.renderOrder = 2;
    layer.add(this.root, this.ring);
    this.landmarks(layer);
  }

  /** A model by its manifest key, cloned; null until it is loaded (asked for once). */
  private model(key: string): THREE.Object3D | null {
    const loaded = this.models.get(key);
    if (loaded) return loaded.clone(true);
    if (!this.asked.has(key)) {
      this.asked.add(key);
      const [kind, id] = key.split("/") as [string, string];
      void this.library.url(kind, id, this.tier).then((url) => (url === null ? null : loadModel(url))).then((gltf) => {
        if (!gltf) return void this.models.set(key, null);
        gltf.scene.traverse((o) => void ((o as THREE.Mesh).isMesh && ((o.castShadow = true), (o.receiveShadow = true))));
        this.models.set(key, gltf.scene);
      }, () => void this.models.set(key, null));
    }
    return null;
  }

  /** A socket of the house's model in the model's own space (the house's, as the model sits at its origin unscaled when grown). */
  private socket(body: THREE.Object3D | null, name: string): THREE.Vector3 | null {
    const s = body?.getObjectByName(name);
    if (!s || !body) return null;
    body.updateMatrixWorld(true);
    return body.worldToLocal(s.getWorldPosition(new THREE.Vector3()));
  }

  update(w: World, hand: Hand, now: number): void {
    const B = w.buildings;
    for (const house of this.houses.values()) house.seen = false;
    for (const b of B.live()) {
      const id = B.id(b);
      const spec = w.c.buildings[B.def[b]!]!;
      let house = this.houses.get(id);
      if (house === undefined) {
        const group = new THREE.Group();
        group.position.set(B.x[b]!, heightAt(this.map, B.x[b]!, B.z[b]!), B.z[b]!);
        group.rotation.y = Math.PI; // the model's front (−Z) faces the default camera in the south
        this.root.add(group);
        house = { group, def: spec.id, level: 0, ready: false, complete: false, body: null, kits: [], extras: [], scaffold: null, grownAt: -1, droppedAt: -1, pile: -1, seen: true };
        this.houses.set(id, house);
      }
      house.seen = true;
      const ready = B.ready[b] === 1;
      const level = Math.max(1, B.level[b]!);
      this.dress(house, spec.radius, level, ready, now);
      if (spec.id === "gold-mine") this.pile(house, B.pile[b]! / 1000);
      // The grow-in and the kits' drop.
      if (house.body) {
        const g = house.grownAt < 0 ? 1 : ease((now - house.grownAt) / GROW_MS);
        house.body.scale.set(0.8 + 0.2 * g, g, 0.8 + 0.2 * g);
      }
      const d = house.droppedAt < 0 ? 1 : Math.min(1, (now - house.droppedAt) / DROP_MS);
      const drop = 2.5 * (1 - ease(d));
      for (const kit of house.kits) kit.userData["dy"] !== undefined && (kit.position.y = (kit.userData["y"] as number) + drop);
    }
    for (const [id, house] of this.houses) if (!house.seen) (this.root.remove(house.group), this.houses.delete(id));
    this.placeGhost(w, hand);
  }

  /** Builds or refreshes a house's parts for its level and state; parts whose model is not in yet are tried next frame. */
  private dress(house: House, radius: number, level: number, ready: boolean, now: number): void {
    if (house.body === null) {
      house.body = this.model("buildings/" + house.def);
      if (house.body) house.group.add(house.body);
    }
    if (house.body) house.body.visible = ready;
    if (ready && !house.ready) house.grownAt = house.level === 0 && house.scaffold === null ? -1 : now; // no grow-in for what stands at load
    if (!ready && house.scaffold === null) {
      house.scaffold = this.model("props/scaffold-bamboo");
      if (house.scaffold) (house.scaffold.scale.setScalar((radius * 2.1) / SCAFFOLD_M), house.group.add(house.scaffold));
    }
    if (house.scaffold) house.scaffold.visible = !ready;
    if (house.body && (house.level !== level || !house.complete)) {
      const kits = level > 1 ? (TABLE[house.def]?.[String(level)] ?? []) : [];
      const parts = kits.map((k) => [k, this.model(k.kit)] as const);
      const barrel = house.def === "cannon" ? (kits.some((k) => k.replaces === "props/cannon-barrel") ? null : this.model("props/cannon-barrel")) : null;
      const flagCount = Math.max(0, level - 1);
      const flags = Array.from({ length: flagCount }, () => this.model("props/level-pennant"));
      const missing = parts.some(([, m]) => m === null) || (house.def === "cannon" && barrel === null && !kits.some((k) => k.replaces)) || flags.some((f) => f === null);
      {
        for (const o of [...house.kits, ...house.extras]) house.group.remove(o);
        house.kits = [];
        house.extras = [];
        for (const [k, m] of parts) {
          if (m === null) continue;
          m.position.set(k.at[0]!, k.at[1]!, k.at[2]!);
          m.rotation.y = ((k.yaw ?? 0) * Math.PI) / 180;
          m.userData["y"] = k.at[1]!;
          m.userData["dy"] = 0;
          house.group.add(m);
          house.kits.push(m);
        }
        const turret = this.socket(house.body, "FX_turret");
        if (barrel && turret) (barrel.position.copy(turret), house.group.add(barrel), house.extras.push(barrel));
        const banner = this.socket(house.body, "FX_banner");
        flags.forEach((flag, i) => {
          if (!flag || !banner) return;
          flag.position.copy(banner).add(new THREE.Vector3(i * 0.45, 0, 0));
          house.group.add(flag);
          house.extras.push(flag);
        });
        if (house.level > 0 && level > house.level) house.droppedAt = now;
        house.level = level;
        house.complete = !missing; // a part not in yet: dressed again next frame
      }
    }
    house.ready = ready;
  }

  /** The Gold Mine's pile: one of four sizes by the gold waiting in it (none when empty). */
  private pile(house: House, gold: number): void {
    const size = gold <= 0 ? 0 : gold < 15 ? 1 : gold < 40 ? 2 : gold < 80 ? 3 : 4;
    if (size === house.pile || house.body === null) return;
    const old = house.group.getObjectByName("td-pile");
    if (old) house.group.remove(old);
    const at = this.socket(house.body, "FX_pile");
    const model = size === 0 ? null : this.model("props/gold-pile-" + size);
    if (size > 0 && model === null) return; // not in yet
    if (model && at) (model.name = "td-pile", model.position.copy(at), house.group.add(model));
    house.pile = size;
  }

  /** The build ghost (TK 12.5): the house see-through on its ring, green where it may stand, red where it may not. */
  private placeGhost(w: World, hand: Hand): void {
    const at = hand.kind >= 0 ? hand.ghost() : null;
    const spec = at === null ? undefined : w.c.buildings[hand.kind];
    this.ring.visible = at !== null && spec !== undefined;
    if (this.ghost && (at === null || this.ghost.def !== spec?.id)) (this.root.remove(this.ghost.body), (this.ghost = null));
    if (at === null || spec === undefined) return;
    const y = heightAt(this.map, at.x, at.z);
    this.ring.position.set(at.x, y + 0.06, at.z);
    this.ring.scale.setScalar(spec.radius);
    (this.ring.material as THREE.MeshBasicMaterial).color.copy(at.reason === "" ? GREEN : RED);
    if (this.ghost === null) {
      const body = this.model("buildings/" + spec.id);
      if (body === null) return;
      body.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.castShadow = false;
        mesh.material = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).map((m) => Object.assign(m.clone(), { transparent: true, opacity: 0.45, depthWrite: false }))[0]!;
      });
      body.rotation.y = Math.PI;
      this.root.add(body);
      this.ghost = { def: spec.id, body };
    }
    this.ghost.body.position.set(at.x, y, at.z);
    const tint = at.reason === "" ? 0xffffff : 0xff8a80;
    this.ghost.body.traverse((o) => void ((o as THREE.Mesh).isMesh && ((o as THREE.Mesh).material as THREE.MeshStandardMaterial).color?.set(tint)));
  }

  /** TK 23.10's landmarks of map 1, outside the field: the falls' cliff at the stream's head, the hill's watch hut. */
  private landmarks(layer: THREE.Group): void {
    const h = this.map.halfM;
    const stream = this.map.water[0];
    const spots: [string, number, number, number][] = [
      ...(stream ? [["landmarks/vach-thac-bac", (stream.x0 + stream.x1) / 2, -h - 16, Math.PI] as [string, number, number, number]] : []),
      ["landmarks/choi-canh-doi", h + 20, -6, Math.PI / 2],
    ];
    const tries = { n: 0 };
    const place = (): void => {
      let left = 0;
      for (const spot of spots) {
        const [key, x, z, yaw] = spot;
        if (layer.getObjectByName(key)) continue;
        const model = this.model(key);
        if (model === null) {
          left += this.models.has(key) ? 0 : 1;
          continue;
        }
        model.name = key;
        model.position.set(x, key.endsWith("vach-thac-bac") ? 0 : heightAt(this.map, x, z) - 0.3, z);
        model.rotation.y = yaw;
        layer.add(model);
      }
      if (left > 0 && (tries.n += 1) < 200) setTimeout(place, 150);
    };
    place();
  }

  /** Live houses and the parts each shows (scenarios, tests): def, level, ready, kits in, extras in. */
  report(): { id: number; def: string; level: number; ready: boolean; kits: number; extras: number }[] {
    return [...this.houses].map(([id, h]) => ({ id, def: h.def, level: h.level, ready: h.ready, kits: h.kits.length, extras: h.extras.length }));
  }
}

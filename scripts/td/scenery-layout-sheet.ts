/** Internal top-down data review, not game art. Run with node --import tsx. */
import { existsSync, readFileSync, writeFileSync, mkdirSync, unlinkSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { performance } from "node:perf_hooks";
import { SLICE_1A } from "../../src/content/slice-1a";
import { BUILD, TREE } from "../../src/content/rules";
import { groundLanes } from "../../src/sim/lanes";
import { canPlace } from "../../src/sim/placement";
import { BORDER_M, heightAt } from "../../src/view/3d/ground";
import { roadField } from "../../src/view/3d/road";
import { buildableAt, sceneryLayout, SCENERY_BUDGET, SCENERY_TUNING as T, FOOT, SCENERY_TYPES, SCENERY_MIX, type SceneryEntry, type SceneryInput, type SceneryLayout, type SceneryItem, type SceneryTier } from "../../src/view/3d/scenery-layout";
import { world, built, def } from "../../tests/td/fixtures";

const sq = (v: number) => v * v;
const d2 = (a: { x: number; z: number }, b: { x: number; z: number }) => sq(a.x - b.x) + sq(a.z - b.z);
const rectDistance = (r: { x0: number; x1: number; z0: number; z1: number }, x: number, z: number) => Math.hypot(Math.max(r.x0 - x, x - r.x1, 0), Math.max(r.z0 - z, z - r.z1, 0));
const within = (r: { x0: number; x1: number; z0: number; z1: number }, x: number, z: number) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;
function waters(i: SceneryInput) {
  const h = i.map.halfM, e = h + BORDER_M;
  return i.map.water.map((r) => ({ x0: r.x0 <= -h ? -e : r.x0, x1: r.x1 >= h ? e : r.x1, z0: r.z0 <= -h ? -e : r.z0, z1: r.z1 >= h ? e : r.z1 }));
}
function slope(i: SceneryInput, x: number, z: number): boolean {
  if (!i.heightAt) return false;
  return [[1, 0], [0, 1], [Math.SQRT1_2, Math.SQRT1_2], [Math.SQRT1_2, -Math.SQRT1_2]].some(([dx, dz]) => Math.abs(i.heightAt!(x - dx!, z - dz!) - i.heightAt!(x + dx!, z + dz!)) > 1.4);
}
/** Independent geometric/sim oracle; does not call the layout's placement helpers. */
export function inspectLayout(i: SceneryInput, layout: SceneryLayout) {
  const m = i.map, lanes = groundLanes(m.routes), water = waters(i);
  const forbidden = { road: 0, dressing: 0, water: 0, bridge: 0, yard: 0, house: 0, ore: 0, ruleTree: 0, bounds: 0, keepLarge: 0, gateLarge: 0, slope: 0 };
  const roadDistance = (p: { x: number; z: number; r: number }) => {
    let centre = Infinity, hit = false;
    lanes.forEach((l, n) => {
      for (let k = 0; k + 1 < l.xs.length; k++) {
        const ax = l.xs[k]!, az = l.zs[k]!, dx = l.xs[k + 1]! - ax, dz = l.zs[k + 1]! - az;
        const u = Math.max(0, Math.min(1, ((p.x - ax) * dx + (p.z - az) * dz) / (dx * dx + dz * dz || 1)));
        const distance = Math.hypot(p.x - ax - u * dx, p.z - az - u * dz);
        const widths = i.roadHalf?.[n];
        const half = widths ? widths[k]! + u * (widths[k + 1]! - widths[k]!) : m.roadHalfM * 1.5;
        centre = Math.min(centre, distance);
        if (distance < half + 0.8 + p.r - 1e-9) hit = true;
      }
    });
    return { centre, hit };
  };
  const exclusion = (p: SceneryItem) => {
    const k = Math.hypot(p.x - m.keep[0], p.z - m.keep[1]);
    const wet = water.find((r) => within(r, p.x, p.z));
    let badWater = false;
    if (wet) {
      const bank = wet.z1 - wet.z0 >= wet.x1 - wet.x0 ? Math.min(p.x - wet.x0, wet.x1 - p.x) : Math.min(p.z - wet.z0, wet.z1 - p.z);
      badWater = (p.type !== "reed-clump" && p.kind !== "rock") || bank > 0.6 + 1e-9;
    } else badWater = water.some((r) => rectDistance(r, p.x, p.z) < p.r - 1e-9);
    return {
      road: roadDistance(p).hit,
      dressing: (i.dressing ?? []).some((d) => Math.sqrt(d2(d, p)) < d.r + p.r - 1e-9),
      water: badWater,
      bridge: m.bridges.some((r) => rectDistance(r, p.x, p.z) < p.r - 1e-9),
      yard: k < 8.5 + p.r - 1e-9,
      house: i.houses.some((h) => Math.sqrt(d2(h, p)) < h.r + BUILD.gapM + p.r - 1e-9),
      ore: m.nodes.some((n) => Math.sqrt(d2(n, p)) < Math.max(3.7, 2.2 + 0.5 * n.richness + 1.5) + p.r - 1e-9),
      ruleTree: m.trees.some(([x, z]) => Math.hypot(x - p.x, z - p.z) < TREE.radiusM + p.r - 1e-9),
      bounds: Math.max(Math.abs(p.x), Math.abs(p.z)) + p.r > m.halfM + BORDER_M + 1e-9,
      keepLarge: !p.cross && k <= BUILD.keepClearM,
      gateLarge: !p.cross && Math.abs(p.x - m.gate[0]) <= 6 && p.z <= -m.buildHalfM,
      slope: p.kind !== "rock" && slope(i, p.x, p.z),
    };
  };
  let treeDistance = Infinity, fixedOnBuildable = 0, badScale = 0, badTint = 0, tall = 0, fieldLarge = 0, tallRoad = Infinity;
  const flips: Record<string, { count: number; ratio: number }> = {};
  const typePoints = new Map<string, SceneryItem[]>();
  const forestPoints = layout.items.filter((p) => p.row >= 0);
  for (const p of layout.items) {
    const bad = exclusion(p);
    for (const key of Object.keys(forbidden) as (keyof typeof forbidden)[]) if (bad[key]) forbidden[key]++;
    const f = flips[p.type] ?? { count: 0, ratio: 0 }; f.count++; f.ratio += Number(p.flip); flips[p.type] = f;
    if (p.row < 0 && (p.scale < 0.85 || p.scale > 1.15)) badScale++;
    if (p.tint < 0.96 || p.tint > 1.04) badTint++;
    if (["tree", "bamboo", "canopy"].includes(p.kind)) for (const [x, z] of m.trees) treeDistance = Math.min(treeDistance, Math.hypot(x - p.x, z - p.z));
    if (!p.clearOnBuild) {
      // A disc wholly outside the build square, inside water, or inside the keep
      // disc cannot touch buildable terrain. This is an exact sufficient proof.
      const squareGap = Math.hypot(Math.max(Math.abs(p.x) - m.buildHalfM, 0), Math.max(Math.abs(p.z) - m.buildHalfM, 0));
      const inWater = water.some((r) => p.x - p.r >= r.x0 && p.x + p.r <= r.x1 && p.z - p.r >= r.z0 && p.z + p.r <= r.z1);
      const inKeep = Math.hypot(p.x - m.keep[0], p.z - m.keep[1]) + p.r <= BUILD.keepClearM;
      if (squareGap < p.r - 1e-9 && !inWater && !inKeep) fixedOnBuildable++;
      if (squareGap < p.r) {
        const probes = [{ x: p.x, z: p.z }, ...Array.from({ length: 16 }, (_, k) => ({ x: p.x + p.r * Math.cos(k * Math.PI / 8), z: p.z + p.r * Math.sin(k * Math.PI / 8) }))];
        if (probes.some((q) => buildableAt(i, q.x, q.z))) fixedOnBuildable++;
      }
    }
    const points = typePoints.get(p.type) ?? []; points.push(p); typePoints.set(p.type, points);
    if (p.zone === "field" && !p.cross) {
      fieldLarge++;
      if (i.set.find((s) => s.id === p.sprite)!.heightM >= 8) { tall++; tallRoad = Math.min(tallRoad, roadDistance(p).centre); }
    }
  }
  for (const f of Object.values(flips)) f.ratio /= f.count;
  let sameVariant = 0, touchingSameSprite = 0;
  for (const [type, points] of typePoints) {
    const variants = new Set(i.set.filter((s) => s.type === type).map((s) => s.variant));
    for (const p of points) {
      let nearest: SceneryItem | undefined, best = Infinity;
      for (const q of points) if (p !== q) {
        const d = d2(p, q);
        if (d < best || (d === best && nearest && (q.x < nearest.x || (q.x === nearest.x && q.z < nearest.z)))) { best = d; nearest = q; }
      }
      if (variants.size >= 2 && nearest?.variant === p.variant) sameVariant++;
    }
    for (let a = 0; a < points.length; a++) for (let b = a + 1; b < points.length; b++) {
      const p = points[a]!, q = points[b]!;
      if (p.sprite === q.sprite && !p.cross && Math.sqrt(d2(p, q)) < p.r + q.r) touchingSameSprite++;
    }
  }
  const ordinary = layout.items.filter((p) => !p.cross && p.row < 0);
  let spacingRatio = Infinity;
  for (let a = 0; a < ordinary.length; a++) for (let b = a + 1; b < ordinary.length; b++) {
    const p = ordinary[a]!, q = ordinary[b]!; spacingRatio = Math.min(spacingRatio, Math.sqrt(d2(p, q)) / (p.r + q.r));
  }
  // Include every 8 m square intersecting the 92 m build field, including zeros.
  const cells = new Array<number>(12 * 12).fill(0);
  for (const p of ordinary.filter((p) => p.zone === "field")) {
    const x = Math.min(11, Math.floor((p.x + 48) / 8)), z = Math.min(11, Math.floor((p.z + 48) / 8));
    cells[z * 12 + x]!++;
  }
  const mean = cells.reduce((a, b) => a + b, 0) / cells.length;
  const vmr = mean ? cells.reduce((s, n) => s + sq(n - mean), 0) / cells.length / mean : 0;
  const fixed = layout.items.filter((p) => !p.clearOnBuild);
  const w = world();
  for (const [id, x, z] of m.preset ?? []) built(w, id, x, z);
  let simPoints = 0, simAccepted = 0;
  const archer = def(w, "archer");
  for (let x = -46; x <= 46; x++) for (let z = -46; z <= 46; z++) {
    if (!fixed.some((p) => sq(x - p.x) + sq(z - p.z) < sq(2 + p.r))) continue;
    simPoints++;
    if (canPlace(w, archer, x / BUILD.snapM, z / BUILD.snapM, true).ok) simAccepted++;
  }
  const rowsPerEdge = [0, 1, 2, 3].map((edge) => new Set(forestPoints.filter((p) => p.edge === edge).map((p) => p.row)).size);
  const means = Array.from({ length: 4 }, (_, row) => {
    const points = forestPoints.filter((p) => p.row === row);
    return points.length ? points.reduce((s, p) => s + p.scale, 0) / points.length : 0;
  });
  const scaleRatios = means.slice(1).flatMap((v, n) => means[n] && v ? [v / means[n]!] : []);
  const shadeMeans = Array.from({ length: 4 }, (_, row) => {
    const ps = forestPoints.filter((p) => p.row === row); return ps.length ? ps.reduce((s, p) => s + p.shade, 0) / ps.length : 0;
  });
  const core = m.halfM + T.forestFrontM - T.forestCornerM;
  const rowRadii = Array.from({ length: 4 }, (_, row) => {
    const ps = forestPoints.filter((p) => p.row === row);
    return ps.length ? ps.reduce((sum, p) => sum + Math.hypot(Math.max(Math.abs(p.x) - core, 0), Math.max(Math.abs(p.z) - core, 0)), 0) / ps.length : 0;
  });
  const rowSpacingM = rowRadii.slice(1).map((r, n) => r - rowRadii[n]!);
  const frontDistances = forestPoints.filter((p) => p.row === 0).map((p) => Math.hypot(Math.max(Math.abs(p.x) - m.halfM, 0), Math.max(Math.abs(p.z) - m.halfM, 0)));
  const frontDistanceRangeM = [Math.min(...frontDistances), Math.max(...frontDistances)];
  const front = forestPoints.filter((p) => p.row === 0).sort((a, b) => a.slot - b.slot);
  const half = m.halfM + T.forestFrontM, slots = Math.floor(8 * half / 6), step = 8 * half / slots;
  let maxGap = 0, maxUnexplainedGap = 0, unexplainedGaps = 0, exemptSlots = 0;
  const rounded = (slot: number) => {
    const along = (slot + 0.25) * step, edge = Math.floor(along / (2 * half)), t = along - edge * 2 * half - half;
    const x = edge === 0 ? t : edge === 1 ? half : edge === 2 ? -t : -half;
    const z = edge === 0 ? -half : edge === 1 ? t : edge === 2 ? half : -t;
    const cx = Math.max(-half + 10, Math.min(half - 10, x)), cz = Math.max(-half + 10, Math.min(half - 10, z));
    const norm = Math.hypot(x - cx, z - cz);
    return { x: cx + (x - cx) * 10 / norm, z: cz + (z - cz) * 10 / norm };
  };
  for (let n = 0; n < front.length; n++) {
    const a = front[n]!, b = front[(n + 1) % front.length]!, gap = (b.slot - a.slot + slots) % slots;
    maxGap = Math.max(maxGap, gap * step);
    let exempt = false;
    for (let k = 1; k < gap; k++) {
      const spot = rounded((a.slot + k) % slots);
      const probe: SceneryItem = { ...a, ...spot, r: 14 * FOOT.canopy! * 1.03, kind: "canopy", type: "canopy-block" };
      if (Object.values(exclusion(probe)).some(Boolean)) { exempt = true; exemptSlots++; }
    }
    if (!exempt) { maxUnexplainedGap = Math.max(maxUnexplainedGap, gap * step); if (gap * step > 1.5 * step + 1e-9) unexplainedGaps++; }
  }
  return {
    fixedOnBuildable, simAccepted, simPoints, simControl: canPlace(w, archer, 35 / BUILD.snapM, 15 / BUILD.snapM, true).ok, forbidden,
    treeDistance, sameVariant, touchingSameSprite, badScale, badTint, flips,
    vmr, spacingRatio, fieldTall: { count: tall, large: fieldLarge, ratio: fieldLarge ? tall / fieldLarge : 0, roadMinM: tallRoad },
    forest: { rowsPerEdge, frontDistanceRangeM, rowSpacingM, rowMeanScale: means, scaleRatios, rowMeanShade: shadeMeans,
      shadeRatios: shadeMeans.slice(1).map((s, n) => shadeMeans[n] ? s / shadeMeans[n]! : 0),
      badZone: forestPoints.filter((p) => p.zone !== "ring").length,
      badShade: forestPoints.filter((p) => Math.abs(p.shade - 0.92 ** p.row) > 0.001).length,
      stepM: step, maxGapM: maxGap, maxUnexplainedGapM: maxUnexplainedGap, unexplainedGaps, exemptSlots },
  };
}

const COLORS: Record<string, string> = { tree: "#267c47", bamboo: "#659634", canopy: "#184e3a", bush: "#78a65f", grass: "#9aae4a", flower: "#d78ca8", rock: "#7a8590", log: "#99683d", stump: "#bb8b54" };
// Shade is brightness, not opacity: rear rows must get darker on the sheet too.
function shadedColor(color: string, shade: number): string {
  return "#" + [1, 3, 5].map((at) => Math.round(Number.parseInt(color.slice(at, at + 2), 16) * shade).toString(16).padStart(2, "0")).join("");
}
function panel(input: SceneryInput, layout: SceneryLayout, half: number, px: number, label: string): string {
  const scale = px / (2 * half), at = (v: number) => (v + half) * scale;
  const circle = (x: number, z: number, r: number, fill: string, extra = "") => `<circle cx="${at(x)}" cy="${at(z)}" r="${r * scale}" ${extra.includes("stroke=") ? "" : 'stroke="none"'} ${extra} fill="${fill}" ${extra.includes("stroke-opacity") ? "" : 'stroke-opacity="1"'}/>`;
  const rect = (r: { x0: number; x1: number; z0: number; z1: number }, fill: string, extra = "") => `<rect x="${at(r.x0)}" y="${at(r.z0)}" width="${(r.x1-r.x0)*scale}" height="${(r.z1-r.z0)*scale}" ${extra.includes("stroke=") ? "" : 'stroke="none"'} ${extra} fill="${fill}" ${extra.includes("stroke-opacity") ? "" : 'stroke-opacity="1"'}/>`;
  const m = input.map, lanes = groundLanes(m.routes);
  let svg = `<g stroke-opacity="1"><rect width="${px}" height="${px}" fill="#edf0dc"/>`;
  svg += rect({ x0:m.gate[0]-6,x1:m.gate[0]+6,z0:-88,z1:-46 }, "#f5dbae");
  for (const r of waters(input)) svg += rect(r, "#a1d0df");
  for (const r of m.bridges) svg += rect(r, "#aa8c70");
  svg += circle(m.keep[0], m.keep[1], 11, "none", 'stroke="#cfad7b" stroke-width="1"');
  svg += circle(m.keep[0], m.keep[1], 8.5, "#c7c4b6");
  for (const n of m.nodes) svg += circle(n.x,n.z,Math.max(3.7,2.2+0.5*n.richness+1.5),"#c7c4b6");
  for (const h of input.houses) svg += circle(h.x,h.z,h.r+BUILD.gapM,"#c89c7c",'stroke="#795b45"');
  for (const [l,lane] of lanes.entries()) for(let k=0;k+1<lane.xs.length;k++) {
    const width=input.roadHalf?.[l]?.[k] ?? m.roadHalfM*1.5;
    svg += `<path d="M${at(lane.xs[k]!)} ${at(lane.zs[k]!)}L${at(lane.xs[k+1]!)} ${at(lane.zs[k+1]!)}" fill="none" stroke-linecap="round" stroke="#c9bc9f" stroke-width="${2*(width+0.8)*scale}" stroke-opacity="1"/>`;
  }
  for (const d of input.dressing ?? []) svg += circle(d.x,d.z,d.r,"#918478");
  for (const p of layout.items) {
    const color = shadedColor(COLORS[p.kind]!, p.shade);
    svg += circle(p.x,p.z,p.r,color,`fill-opacity="0.65" stroke="${color}" stroke-opacity="1" stroke-width="${p.cross?0.5:1}" ${p.clearOnBuild?'stroke-dasharray="3 2"':''}`);
  }
  for (const [x,z] of m.trees) { svg += circle(x,z,4,"none",'stroke="#d02f3c" stroke-dasharray="5 4"'); svg += circle(x,z,1.5,"#dd5460",'fill-opacity="0.5"'); }
  for (const h of [46,48,88]) svg += rect({x0:-h,x1:h,z0:-h,z1:h},"none",`stroke="${h===46?'#bf7750':'#575f67'}" stroke-width="1.3" stroke-dasharray="${h===46?'8 4':'none'}"`);
  svg += `<rect x="8" y="8" width="${Math.min(px-16,620)}" height="58" rx="4" fill="#ffffff" fill-opacity="0.92"/><text x="18" y="31" font-size="${px<1000?16:22}" font-family="Arial" fill="#26352c">${label}</text><text x="18" y="54" font-size="${px<1000?12:16}" font-family="Arial" fill="#26352c">${layout.counts.large} vật lớn · ${layout.counts.cross} chữ thập · seed ${layout.seed}</text>`;
  let y=px-18;
  svg += `<rect x="8" y="${y-40}" width="${px-16}" height="52" fill="white" fill-opacity="0.92"/><text x="18" y="${y-20}" font-family="Arial" font-size="${px<1000?10:16}">46: đất xây · 48: sân · 88: vòng ngoài | đỏ: cây luật 1,5 m / vòng 4 m | viền liền: cố định; đứt: đổ khi xây</text>`;
  let x=18;
  for(const [kind,color] of Object.entries(COLORS)) { svg+=`<circle cx="${x+5}" cy="${y-3}" r="5" fill="${color}"/><text x="${x+16}" y="${y+2}" font-family="Arial" font-size="${px<1000?10:15}">${kind}</text>`; x+=px/9.2; }
  return svg+"</g>";
}
function jpg(name: string, body: string, width: number, height: number): number {
  const path=resolve("tmp/202",name), svg=path.replace(/\.jpg$/, ".svg");
  writeFileSync(svg,`<svg xmlns="http://www.w3.org/2000/svg" stroke-opacity="1" width="${width}" height="${height}">${body}</svg>`);
  try {
    execFileSync(process.env.ART_MAGICK ?? "/opt/homebrew/bin/magick",["-background","white","-font","/System/Library/Fonts/Supplemental/Arial.ttf",svg,"-strip","-sampling-factor","4:2:0","-quality","82",path]);
    if(statSync(path).size>=1_000_000) throw new Error(`JPG over 1 MB: ${name}`);
  } finally { unlinkSync(svg); }
  return statSync(path).size;
}
function main() {
  mkdirSync("tmp/202",{recursive:true});
  const setPath="scripts/td/scenery-set.json";
  if(!existsSync(setPath)) throw new Error("Ticket 199 scenery-set.json is absent; use the test sample, no real-set sheets can be produced.");
  const set=JSON.parse(readFileSync(setPath,"utf8")) as (SceneryEntry & {accepted:boolean})[];
  const map=SLICE_1A.map,lanes=groundLanes(map.routes),road=roadField(map,lanes,map.halfM+BORDER_M);
  const input:SceneryInput={map,set,houses:(map.preset??[]).map(([id,x,z])=>({x,z,r:BUILD.footprintR[SLICE_1A.buildings.find((b)=>b.id===id)!.footprint]})),roadHalf:road.widths,
    dressing:road.dressing.map((d)=>({x:d.x,z:d.z,r:(d.kind==="stones"?1:3)*d.scale})),heightAt:(x,z)=>heightAt(map,x,z)};
  const report=process.argv.includes("--report-dir")?resolve(process.argv[process.argv.indexOf("--report-dir")+1]!):undefined;
  if(report)mkdirSync(report,{recursive:true});
  const counts:Record<string,unknown>={},rules:Record<string,unknown>={},files:Record<string,number>={};
  for(const [label,subset]of [["all",set],["accepted",set.filter((s)=>s.accepted)]] as const) {
    const i={...input,set:subset};
    for(const tier of ["low","medium","high"] as const) {
      const layout=sceneryLayout(i,tier);counts[`${label}.${tier}`]={budget:SCENERY_BUDGET[tier],...layout.counts};
      rules[`${label}.${tier}`]=inspectLayout(i,layout);
      if(label==="all") {
        writeFileSync(`tmp/202/layout-${tier}-default.json`,JSON.stringify(layout,null,2)+"\n");
        files[`layout-${tier}.jpg`]=jpg(`layout-${tier}.jpg`,panel(i,layout,88,1760,`Wordwoven · ${tier} · tập đủ`),1760,1760);
        if(tier==="high")files["field-high.jpg"]=jpg("field-high.jpg",panel(i,layout,48,1920,"Wordwoven · High · đất trong sân"),1920,1920);
      }else if(tier==="high")files["layout-accepted-high.jpg"]=jpg("layout-accepted-high.jpg",panel(i,layout,88,1760,"Wordwoven · High · chỉ mục đã nhận"),1760,1760);
    }
  }
  const seeds=[undefined,1,20261030],panels=seeds.map((seed,n)=>`<g transform="translate(${n*880},0)">${panel(input,sceneryLayout({...input,seed},"high"),88,880,`High · seed ${seed??"mặc định"}`)}</g>`).join("");
  files["seeds.jpg"]=jpg("seeds.jpg",panels,2640,880);
  sceneryLayout(input,"high");
  const samples=Array.from({length:5},()=>{const start=performance.now();sceneryLayout(input,"high");return performance.now()-start;});
  const timing={samplesMs:samples,medianMs:[...samples].sort((a,b)=>a-b)[2],targetMs:50};
  const write=(name:string,data:unknown)=>{if(report)writeFileSync(resolve(report,name),JSON.stringify(data,null,2)+"\n");};
  write("counts.json",counts);write("rules.json",rules);write("timing.json",timing);write("sheets.json",files);
  write("tuning.json",{FOOT,SCENERY_TUNING:T,SCENERY_TYPES,SCENERY_MIX,SCENERY_BUDGET});
  process.stdout.write(JSON.stringify({counts,timing,files},null,2)+"\n");
}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main();

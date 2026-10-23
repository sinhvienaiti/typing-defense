/**
 * The title screen (SPLIT_PLAN §1.2, D7; TK 22.1, 22.9): Văn Điền at dusk. The scene is painted in code as
 * flat SVG shapes (sky, limestone towers, terraced paddies, a bamboo village on stilts, bamboo clumps); one
 * painted backdrop (/assets/typing-defense/ui/title-dusk.webp, not in Git) replaces it when the file is there.
 * A string of paper lanterns lights up one by one, villagers call across the fields (audio-min.ts), the name
 * "Lời Gọi" is brushed in Baloo 2 by a vermilion seal. Keyboard first: ↑ ↓ pick, Enter or 1–5 choose, Esc
 * goes back to the run left open; while the title is up it takes every key and the world does not step.
 * "Hồ sơ gõ" opens the typing profile (BALANCE.md §2) in the menu's place, as "Cài đặt" opens the settings.
 */
import type { UiSound } from "../view/audio-min";
import type { ProfileCard } from "./profile";
import type { SettingsCard } from "./settings";

export type TitleChoice = "start" | "continue" | "learn";
type EntryId = TitleChoice | "settings" | "profile";

const ART = "/assets/typing-defense/ui/title-dusk.webp";
const ENTRIES: readonly (readonly [EntryId, string, string])[] = [
  ["start", "Bắt đầu", "Bản đồ 1 · Đồng Cỏ Thác Bạc"],
  ["continue", "Chơi tiếp", "Về lại ván đang dở · Esc"],
  ["settings", "Cài đặt", "Âm lượng nhạc và tiếng"],
  ["learn", "Học", "Chế độ Học: hiện nghĩa, Space để dừng"],
  ["profile", "Hồ sơ gõ", "Tốc độ, độ chính xác, một lời khuyên"],
];
const LAMP_MS = 380;

/** A seeded wobble for the painted scene: the same shapes every load. */
const wob = (k: number): number => {
  const x = Math.sin(k * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};
const f = (n: number): string => n.toFixed(1);

/** A lantern: string, bamboo caps, ribbed paper body, a red tassel; `.is-lit` warms it. */
const lamp = (x: number, y: number, r: number, drop: number): string =>
  `<g class="tt-lamp"><path d="M${f(x)} ${f(y)}v${f(drop)}" stroke="#2b2118" stroke-width="1.5"/>` +
  `<rect x="${f(x - r * 0.45)}" y="${f(y + drop)}" width="${f(r * 0.9)}" height="${f(r * 0.28)}" rx="2" fill="#5b3a1c"/>` +
  `<ellipse class="tt-body" cx="${f(x)}" cy="${f(y + drop + r * 1.3)}" rx="${f(r)}" ry="${f(r * 1.12)}"/>` +
  `<path d="M${f(x - r * 0.5)} ${f(y + drop + r * 0.35)}q${f(-r * 0.25)} ${f(r * 0.95)} 0 ${f(r * 1.9)}M${f(x + r * 0.5)} ${f(y + drop + r * 0.35)}q${f(r * 0.25)} ${f(r * 0.95)} 0 ${f(r * 1.9)}M${f(x)} ${f(y + drop + r * 0.2)}v${f(r * 2.2)}" class="tt-rib"/>` +
  `<rect x="${f(x - r * 0.45)}" y="${f(y + drop + r * 2.3)}" width="${f(r * 0.9)}" height="${f(r * 0.24)}" rx="2" fill="#5b3a1c"/>` +
  `<path d="M${f(x)} ${f(y + drop + r * 2.55)}v${f(r * 0.8)}" stroke="#c23b22" stroke-width="${f(r * 0.22)}" stroke-linecap="round"/></g>`;

/** Limestone towers along a baseline: [x, width, height]. */
function karst(y0: number, towers: readonly (readonly number[])[], fill: string): string {
  const d = towers.map(([x, w, h]) => `L${f(x! - w! / 2)} ${y0}C${f(x! - w! / 2)} ${f(y0 - h! * 0.7)} ${f(x! - w! * 0.3)} ${f(y0 - h!)} ${f(x!)} ${f(y0 - h!)}C${f(x! + w! * 0.3)} ${f(y0 - h!)} ${f(x! + w! / 2)} ${f(y0 - h! * 0.7)} ${f(x! + w! / 2)} ${y0}`).join("");
  return `<path d="M-20 ${y0}${d}L1620 ${y0}V900H-20Z" fill="${fill}"/>`;
}

/** Terraced paddies from the horizon down: each band's dike follows a slow wave; some hold the sky. */
function terraces(): string {
  const fills = ["#6f9c3e", "#c9a050", "#e3a27c", "#86b24a", "#d9ab45", "#7aa844", "#c99a3c", "#94bf55", "#e0a07a", "#8cba50"];
  let out = "";
  for (let i = 0; i < 10; i += 1) {
    const top = 612 + i * 22 + i * i * 2.4;
    const pts: string[] = [];
    for (let x = -40; x <= 1640; x += 40) pts.push(f(x) + " " + f(top + (10 + i * 2) * Math.sin(x / 230 + i * 0.85) + 6 * Math.sin(x / 90 + i)));
    const edge = "M" + pts.join("L");
    const water = i === 2 || i === 8;
    out += `<path d="${edge}L1640 900L-40 900Z" fill="${fills[i]}"/>` + (water ? `<path d="${edge}L1640 900L-40 900Z" fill="url(#tt-shine)"/>` : `<path d="${edge}L1640 900L-40 900Z" fill="url(#tt-rice)" opacity="${f(0.15 + i * 0.04)}"/>`);
    out += `<path d="${edge}" fill="none" stroke="#3d5f25" stroke-width="${f(1.5 + i * 0.35)}" opacity="0.55"/><path d="${edge}" fill="none" stroke="#f7e3a6" stroke-width="1" opacity="0.35" transform="translate(0 2)"/>`;
  }
  return out;
}

/** A house on stilts with a thatched roof, glowing windows and two lanterns under the eaves. */
function house(x: number, y: number, s: number): string {
  const w = 120 * s;
  const h = 46 * s;
  return `<g><path d="M${f(x - w * 0.42)} ${f(y + h)}v${f(26 * s)}M${f(x - w * 0.14)} ${f(y + h)}v${f(26 * s)}M${f(x + w * 0.14)} ${f(y + h)}v${f(26 * s)}M${f(x + w * 0.42)} ${f(y + h)}v${f(26 * s)}" stroke="#3b2614" stroke-width="${f(5 * s)}"/>` +
    `<rect x="${f(x - w / 2)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="#6b4423"/><rect class="tt-window" x="${f(x - w * 0.3)}" y="${f(y + h * 0.3)}" width="${f(w * 0.18)}" height="${f(h * 0.4)}"/><rect class="tt-window" x="${f(x + w * 0.1)}" y="${f(y + h * 0.3)}" width="${f(w * 0.18)}" height="${f(h * 0.4)}"/>` +
    `<path d="M${f(x - w * 0.72)} ${f(y + 6 * s)}L${f(x - w * 0.18)} ${f(y - 58 * s)}H${f(x + w * 0.18)}L${f(x + w * 0.72)} ${f(y + 6 * s)}Z" fill="#9a7440" stroke="#5b3a1c" stroke-width="${f(3 * s)}"/>` +
    `<path d="M${f(x - w * 0.55)} ${f(y - 8 * s)}L${f(x + w * 0.55)} ${f(y - 8 * s)}M${f(x - w * 0.38)} ${f(y - 30 * s)}L${f(x + w * 0.38)} ${f(y - 30 * s)}" stroke="#7a5a2e" stroke-width="${f(2 * s)}" opacity="0.7"/></g>` +
    lamp(x - w * 0.55, y + 6 * s, 7 * s, 4 * s) + lamp(x + w * 0.55, y + 6 * s, 7 * s, 4 * s);
}

/** A clump of bamboo rising from (x, 900): leaning culms with nodes, leaf sprays at the top. */
function bamboo(x: number, lean: number, seed: number): string {
  let culms = "";
  let leaves = "";
  for (let k = 0; k < 7; k += 1) {
    const bx = x + (k - 3) * 18 + wob(seed + k) * 10;
    const tx = bx + lean * (0.6 + wob(seed + k * 3) * 0.8);
    const ty = 40 + wob(seed + k * 7) * 260;
    const color = ["#2c5226", "#3b6b30", "#4a7d36"][k % 3]!;
    culms += `<path d="M${f(bx)} 910Q${f(bx + (tx - bx) * 0.2)} ${f((ty + 910) / 2)} ${f(tx)} ${f(ty)}" stroke="${color}" stroke-width="${f(9 + wob(seed + k) * 6)}" fill="none" stroke-linecap="round"/>`;
    for (let n = 1; n < 7; n += 1) {
      const p = n / 7;
      const nx = bx + (tx - bx) * (0.2 * 2 * p * (1 - p) + p * p);
      culms += `<path d="M${f(nx - 7)} ${f(910 + (ty - 910) * p)}h14" stroke="#1f3a1a" stroke-width="2.5"/>`;
    }
    for (let l = 0; l < 7; l += 1) {
      const p = 0.55 + wob(seed + k * 11 + l) * 0.45;
      const lx = bx + (tx - bx) * (0.4 * p * (1 - p) + p * p);
      const angle = (wob(seed + l * 5 + k) - 0.5) * 160 + (lean > 0 ? 25 : -25);
      leaves += `<path d="M0 0Q24 -7 54 0Q24 7 0 0Z" fill="${["#2e5a26", "#3f6f2e", "#55863a"][l % 3]}" transform="translate(${f(lx)} ${f(910 + (ty - 910) * p)}) rotate(${f(angle)}) scale(${f(0.8 + wob(l + seed) * 0.6)})"/>`;
    }
  }
  return culms + leaves;
}

/** The painted fallback scene, 1600 × 900, cut to the window. */
function scene(): string {
  const stars = Array.from({ length: 16 }, (_, k) => `<circle class="tt-star" cx="${f(wob(k) * 1600)}" cy="${f(wob(k + 40) * 230)}" r="${f(1 + wob(k + 9) * 1.4)}" style="animation-delay:${f(wob(k + 3) * 4)}s"/>`).join("");
  return (
    `<svg class="tt-scene" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>` +
    `<linearGradient id="tt-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b2654"/><stop offset="0.2" stop-color="#6a4785"/><stop offset="0.36" stop-color="#c4607a"/><stop offset="0.5" stop-color="#f08a4b"/><stop offset="0.64" stop-color="#ffc56c"/></linearGradient>` +
    `<radialGradient id="tt-sun"><stop offset="0" stop-color="#fff1c4"/><stop offset="0.35" stop-color="#ffd27a" stop-opacity="0.8"/><stop offset="1" stop-color="#ffb060" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="tt-mist" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd9b0" stop-opacity="0"/><stop offset="0.5" stop-color="#ffd9b0" stop-opacity="0.55"/><stop offset="1" stop-color="#ffd9b0" stop-opacity="0"/></linearGradient>` +
    `<linearGradient id="tt-shine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff0c8" stop-opacity="0"/><stop offset="0.6" stop-color="#ffe2a0" stop-opacity="0.55"/><stop offset="1" stop-color="#fff0c8" stop-opacity="0.1"/></linearGradient>` +
    `<pattern id="tt-rice" width="16" height="11" patternUnits="userSpaceOnUse"><path d="M3 9v-6M8 10v-7M13 9v-5" stroke="#2f5a22" stroke-width="1.6"/></pattern>` +
    `</defs><rect width="1600" height="900" fill="url(#tt-sky)"/>${stars}<circle cx="1010" cy="560" r="150" fill="url(#tt-sun)"/><circle cx="1010" cy="566" r="42" fill="#ffe7a8"/>` +
    karst(600, [[60, 90, 170], [150, 70, 120], [240, 100, 210], [330, 80, 150], [430, 110, 190], [540, 70, 130], [650, 90, 175], [1120, 80, 150], [1210, 100, 205], [1320, 70, 140], [1410, 110, 215], [1520, 90, 160]], "#9a7aa8") +
    karst(614, [[110, 110, 120], [300, 120, 140], [480, 90, 100], [820, 80, 70], [1180, 100, 115], [1380, 130, 150], [1560, 100, 120]], "#6a5384") +
    `<rect y="540" width="1600" height="110" fill="url(#tt-mist)"/>` + terraces() +
    `<path d="M1080 900C1120 820 1200 800 1210 760S1250 690 1300 662" stroke="#b98a55" stroke-width="30" fill="none" stroke-linecap="round" opacity="0.9"/>` +
    house(1210, 585, 0.8) + house(1340, 560, 0.95) + house(1480, 600, 0.75) +
    `<g class="tt-storks"><path d="M1040 360q8-8 16 0q8-8 16 0M1110 338q6-6 12 0q6-6 12 0M990 382q7-7 14 0q7-7 14 0" stroke="#fff7e8" stroke-width="2.6" fill="none" stroke-linecap="round"/></g>` +
    bamboo(90, 120, 1) + bamboo(250, 60, 5) + bamboo(1530, -130, 9) + bamboo(1400, -70, 13) + `</svg>`
  );
}

/** The lantern string across the top, in front of the scene or the painting. */
function garland(): string {
  const curve = (x: number): number => (x < 800 ? 18 + 4 * 52 * (x / 800) * (1 - x / 800) : 18 + 4 * 52 * ((x - 800) / 800) * (1 - (x - 800) / 800));
  const lamps = [110, 290, 470, 650, 950, 1130, 1310, 1490].map((x, k) => lamp(x, curve(x), 21, 16 + wob(k + 2) * 26)).join("");
  return (
    `<svg class="tt-garland" viewBox="0 0 1600 190" preserveAspectRatio="xMidYMin slice" aria-hidden="true"><defs>` +
    `<radialGradient id="tt-lamp-on" cx="0.45" cy="0.4"><stop offset="0" stop-color="#fff4c2"/><stop offset="0.55" stop-color="#ffb84d"/><stop offset="1" stop-color="#e0662b"/></radialGradient>` +
    `<filter id="tt-glow" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` +
    `<filter id="tt-brush" x="-0.1" y="-0.2" width="1.2" height="1.4"><feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="5"/></filter>` +
    `</defs><path d="M-10 18Q400 122 800 18Q1200 122 1610 18" stroke="#2b2118" stroke-width="2.2" fill="none"/>${lamps}</svg>`
  );
}

export class TitleScreen {
  readonly el: HTMLElement;
  private readonly entries: HTMLElement[];
  private readonly menu: HTMLElement;
  private focus = 0;
  private readonly off = new Set<EntryId>();
  private timers: number[] = [];

  constructor(
    root: HTMLElement,
    private readonly hooks: { choose(choice: TitleChoice): void; sound(sound: UiSound): void; wake(): void; profile(card: ProfileCard): void },
    private readonly settings: SettingsCard,
    private readonly profile: ProfileCard,
    learn: boolean,
  ) {
    this.el = Object.assign(document.createElement("div"), { className: "tt-screen", hidden: true });
    this.el.innerHTML =
      `<div class="tt-art"></div>${scene()}${garland()}` +
      Array.from({ length: 14 }, (_, k) => `<i class="tt-fly" style="left:${f(8 + wob(k + 70) * 84)}%;top:${f(66 + wob(k + 90) * 30)}%;animation-delay:${f(wob(k + 5) * 5)}s"></i>`).join("") +
      `<header class="tt-head"><h1 class="tt-name">Lời Gọi</h1><span class="tt-seal" aria-hidden="true">Văn<br>Điền</span>` +
      `<p class="tt-sub">Giữ làng tre bằng những lời gọi · <i>Wordwoven</i></p></header>` +
      `<nav class="tt-menu vd-sheet" aria-label="Màn đầu">${ENTRIES.map(([id, label, sub], k) => `<div class="tt-entry" role="button" data-entry="${id}"><kbd>${k + 1}</kbd><b>${label}</b><small>${sub}</small></div>`).join("")}</nav>` +
      `<p class="tt-keys">↑ ↓ chọn · Enter vào · 1–5 chọn nhanh</p>`;
    this.menu = this.el.querySelector(".tt-menu")!;
    this.menu.append(settings.el, profile.el);
    this.entries = [...this.el.querySelectorAll<HTMLElement>(".tt-entry")];
    if (!learn) this.off.add("learn");
    root.appendChild(this.el);
    this.el.addEventListener("pointerdown", (event) => {
      this.hooks.wake();
      const entry = (event.target as Element).closest<HTMLElement>(".tt-entry");
      if (entry === null || this.settings.shown || this.profile.shown) return;
      event.preventDefault();
      this.pick(this.entries.indexOf(entry));
    });
    this.el.addEventListener("pointermove", (event) => {
      const at = this.entries.indexOf((event.target as Element).closest<HTMLElement>(".tt-entry")!);
      if (at >= 0 && at !== this.focus && !this.off.has(ENTRIES[at]![0])) this.move(at);
    });
    const art = new Image();
    art.onload = () => {
      this.el.querySelector<HTMLElement>(".tt-art")!.style.backgroundImage = `url("${ART}")`;
      this.el.classList.add("has-art");
    };
    art.src = ART;
  }

  get open(): boolean {
    return !this.el.hidden;
  }

  /** Shows the title; "Chơi tiếp" is open only with a run left to go back to. Lanterns light one by one. */
  show(canContinue: boolean): void {
    this.el.hidden = false;
    if (canContinue) this.off.delete("continue");
    else this.off.add("continue");
    this.settings.close();
    this.profile.close();
    this.entries.forEach((entry) => (entry.hidden = false));
    this.entries.forEach((entry, k) => entry.classList.toggle("is-off", this.off.has(ENTRIES[k]![0])));
    this.move(canContinue ? 1 : 0, false);
    this.timers.forEach(clearTimeout);
    const lamps = [...this.el.querySelectorAll(".tt-garland .tt-lamp"), ...this.el.querySelectorAll(".tt-scene .tt-lamp")];
    lamps.forEach((el) => el.classList.remove("is-lit"));
    this.el.classList.remove("is-dusk");
    this.timers = lamps.map((el, k) => window.setTimeout(() => {
      el.classList.add("is-lit");
      if (k < 8) this.hooks.sound("lamp");
    }, 400 + k * LAMP_MS));
    this.timers.push(window.setTimeout(() => this.el.classList.add("is-dusk"), 1600));
  }

  hide(): void {
    this.el.hidden = true;
    this.settings.close();
    this.profile.close();
    this.timers.forEach(clearTimeout);
  }

  private move(to: number, sound = true): void {
    this.focus = to;
    this.entries.forEach((entry, k) => entry.classList.toggle("is-focus", k === to));
    if (sound) this.hooks.sound("move");
  }

  private pick(at: number): void {
    const id = ENTRIES[at]?.[0];
    if (id === undefined) return;
    if (this.off.has(id)) return this.hooks.sound("off");
    this.hooks.sound("pick");
    if (id !== "settings" && id !== "profile") return this.hooks.choose(id);
    this.entries.forEach((entry) => (entry.hidden = true));
    if (id === "settings") this.settings.open();
    else this.hooks.profile(this.profile);
  }

  /** Settings or the profile closed: the entries come back, the focus on the entry that opened it. */
  settingsDone(): void {
    const at = this.profile.shown ? ENTRIES.findIndex(([id]) => id === "profile") : 2;
    this.settings.close();
    this.profile.close();
    this.entries.forEach((entry) => (entry.hidden = false));
    this.move(at, false);
  }

  /** Every key while the title is up; true when the page should not act on it (its default). */
  key(event: KeyboardEvent): boolean {
    this.hooks.wake();
    if (event.repeat && !event.code.startsWith("Arrow")) return true;
    if (this.settings.shown) return this.settings.key(event);
    if (this.profile.shown) return this.profile.key(event);
    const step = event.code === "ArrowDown" || (event.code === "Tab" && !event.shiftKey) ? 1 : event.code === "ArrowUp" || event.code === "Tab" ? -1 : 0;
    if (step !== 0) {
      let to = this.focus;
      do to = (to + step + ENTRIES.length) % ENTRIES.length;
      while (this.off.has(ENTRIES[to]![0]));
      this.move(to);
    } else if (event.code === "Enter" || event.code === "NumpadEnter" || event.code === "Space") this.pick(this.focus);
    else if (/^Digit[1-5]$/.test(event.code)) this.pick(Number(event.code.slice(5)) - 1);
    else if (event.code === "Escape" && !this.off.has("continue")) this.pick(1);
    else return false;
    return true;
  }
}

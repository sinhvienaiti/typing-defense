import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { keepIn, type View } from "../src/view/words/safe";
import { comboSide, trayPointer } from "../src/view/words/tray";
import { rimAt, stampStep, typedShown } from "../src/view/words/steps";
import type { Rect } from "../src/view/words/lanes";
import { WordCards } from "../src/view/words/cards";
import { Hud, PANELS } from "../src/ui/hud";
import { send, world } from "./td/fixtures";
import { callWord, live, smallDeck, type, wordOf } from "./td/typing";

const touch = (a: Rect, b: Rect) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
const box = (left: number, top: number, w: number, h: number): Rect => ({ left, top, right: left + w, bottom: top + h });
// td.css: chip/dock 284 * --hud, offsets 12; strip 360 * --hud by 44 * --hud, bottom 8.
// Heights vary with content. Reserve a full 180/216 chip and 330/396 Build dock in these fixtures.
const layouts = [{ width: 1280, height: 720, hud: 1, ui: 0.8 }, { width: 1920, height: 1080, hud: 1.2, ui: 1.2 }];
const panels = (v: typeof layouts[number]) => [box(12, 12, 284 * v.hud, 180 * v.hud), box(v.width - 12 - 284 * v.hud, v.height - 24 - 40 * v.hud - 330 * v.hud, 284 * v.hud, 330 * v.hud), box(v.width <= 1500 ? 308 : (v.width - 360 * v.hud) / 2, v.height - 8 - 44 * v.hud, 360 * v.hud, 44 * v.hud)];
const safe = (r: Rect, v: View, ps: readonly Rect[]) => {
  expect(r.left).toBeGreaterThanOrEqual(8 - 1e-6); expect(r.top).toBeGreaterThanOrEqual(8 - 1e-6);
  expect(r.right).toBeLessThanOrEqual(v.width - 8 + 1e-6); expect(r.bottom).toBeLessThanOrEqual(v.height - 8 + 1e-6);
  expect(ps.some(p => touch(r, p))).toBe(false);
};

describe("203 A1: nearest safe boxes, including every moving frame", () => {
  it.each(layouts)("grid stays in $width x $height, unchanged if already valid", v => {
    const ps = panels(v);
    for (let x = -100; x <= v.width + 100; x += 71) for (let y = -100; y <= v.height + 100; y += 53) {
      const b = box(x, y, 180, 78), r = keepIn(b, v, ps, 8);
      expect(r.ok).toBe(true); safe(r, v, ps);
      const padded = ps.map(p => box(p.left - 8, p.top - 8, p.right - p.left + 16, p.bottom - p.top + 16));
      if (x >= 8 && y >= 8 && b.right <= v.width - 8 && b.bottom <= v.height - 8 && !padded.some(p => touch(b, p))) expect(r).toMatchObject(b);
    }
    // Simulate the full tray-in interpolation, then stamp the first letter below the chip at its largest pose.
    for (let frame = 0; frame <= 18; frame++) safe(keepIn(box(50 + 100 * frame / 18, 40 + 200 * frame / 18, 210, 90), v, ps, 8), v, ps);
    safe(keepIn(box(15, ps[0]!.bottom - 60, 110, 140), v, ps, 8), v, ps);
  });
  it("chooses the minimum translation, and flags an impossible layout", () => {
    expect(keepIn(box(95, 110, 20, 20), { width: 500, height: 500 }, [box(100, 100, 100, 100)], 8)).toMatchObject(box(72, 110, 20, 20));
    expect(keepIn(box(100, 100, 20, 20), { width: 500, height: 500 }, [box(0, 0, 500, 500)], 8).ok).toBe(false);
    expect(keepIn(box(0, 0, 600, 30), { width: 500, height: 500 }, [], 8).ok).toBe(false);
  });
  it.each(layouts)("combo keeps its side if valid, flips, goes above, then clamps at $height", v => {
    const ps = panels(v);
    const cards = [box(52, 300, 190, 72), box(v.width - 242, 300, 190, 72), box(v.width / 2, 74, 190, 72), box(v.width / 2, v.height - 160, 190, 72)];
    for (const card of cards) for (const side of [-1, 1]) {
      const result = comboSide(card, 200, 114, side, v, ps); safe(result.box, v, ps);
    }
    const card = box(500, 300, 180, 60);
    expect(comboSide(card, 80, 40, 1, v, []).side).toBe(1);
    expect(comboSide(box(8, 300, 180, 60), 80, 40, -1, v, []).side).toBe(1);
    expect(comboSide(card, 80, 40, 1, v, [box(680, 280, 100, 110), box(400, 280, 100, 110)]).side).toBe(0);
  });
});

describe("203 A2: one symmetric 90 degree V at all four edges", () => {
  it.each(layouts)("4 edges x 3 headings at $height", v => {
    const ps = panels(v);
    const cards = [box(52, 300, 190, 72), box(v.width - 242, 300, 190, 72), box(v.width / 2 - 95, 90, 190, 72), box(v.width / 2 - 95, v.height - 170, 190, 72)];
    for (let edge = 0; edge < 4; edge++) for (const d of [-40, 0, 40]) {
      const a = [Math.PI, 0, -Math.PI / 2, Math.PI / 2][edge]! + d * Math.PI / 180;
      const p = trayPointer(edge, [Math.cos(a), Math.sin(a)], cards[edge]!, v, ps);
      expect(p.size).toBeGreaterThanOrEqual(v.height === 720 ? 16 : 24); safe(p.box, v, ps);
      expect(touch(p.box, cards[edge]!)).toBe(false);
      const [tip, a1, a2] = p.points;
      const u = [Math.cos(p.angle), Math.sin(p.angle)];
      const wings = [a1, a2].map(e => [e[0] - tip[0], e[1] - tip[1]]);
      wings.forEach(e => expect(e[0]! * u[0]! + e[1]! * u[1]!).toBeLessThan(0));
      const dot = wings[0]![0]! * wings[1]![0]! + wings[0]![1]! * wings[1]![1]!;
      expect(dot).toBeCloseTo(0, 5);
      expect(Math.hypot(...wings[0]!)).toBeCloseTo(Math.hypot(...wings[1]!), 5);
      expect(Math.abs(Math.atan2(Math.sin(p.angle - a), Math.cos(p.angle - a)))).toBeLessThan(1e-6);
      if (edge === 0) expect(tip[1]).toBeGreaterThan(cards[edge]!.bottom + 4);
      for (const bar of ps) expect(touch(p.box, box(bar.left - 8, bar.top - 8, bar.right - bar.left + 16, bar.bottom - bar.top + 16))).toBe(false);
      // Undo rotation: the left V and bottom V have exactly the same local geometry (subpixel bound 0.5).
      for (const [i, point] of p.points.entries()) {
        const dx = point[0] - p.x, dy = point[1] - p.y;
        expect(Math.abs(dx * u[0]! + dy * u[1]! - [p.size / 2, -p.size / 2, -p.size / 2][i]!)).toBeLessThan(0.5);
        expect(Math.abs(-dx * u[1]! + dy * u[0]! - [0, -p.size, p.size][i]!)).toBeLessThan(0.5);
      }
    }
  });
  it("limits a tangential direction to 60 degrees from the edge normal", () => {
    const p = trayPointer(0, [0, -1], box(80, 300, 180, 60), layouts[0]!, []);
    expect(Math.abs(Math.atan2(Math.sin(p.angle - Math.PI), Math.cos(p.angle - Math.PI)))).toBeCloseTo(Math.PI / 3);
  });
});

describe("203 A3: all matching cards retain typed colour until group closes", () => {
  it("t, 50 held frames, e in the same frame, Backspace, unrelated eye", () => {
    const show = (typed: number[], group: number) => ["team", "thanks", "eye"].map((w, i) => typedShown(w, typed[i]!, group));
    expect(show([0, 0, 0], 19)).toEqual([1, 1, 0]);
    for (let f = 0; f < 50; f++) expect(show([0, 0, 0], 19)).toEqual([1, 1, 0]);
    expect(show([2, 0, 0], -1)).toEqual([2, 0, 0]);
    expect(show([0, 0, 0], -1)).toEqual([0, 0, 0]);
  });
});

describe("203 A4: hard first two rim frames, then exponential glow", () => {
  it.each(layouts)("0, 17, 34, 100, 194 ms at $height", v => {
    const h = v.height === 720 ? 58 : 72;
    const rs = [0, 17, 34, 100, 194].map(t => rimAt(t, h, v.ui));
    for (const r of rs.slice(0, 2)) {
      expect(r.color).toBe("#FFF0D8"); expect(r.blur).toBe(0); expect(r.width).toBeGreaterThanOrEqual(4);
      expect(r.out / h).toBeGreaterThanOrEqual(0.1); expect(r.out / h).toBeLessThanOrEqual(0.12);
    }
    expect(rs[2]!.blur).toBeGreaterThan(0);
    rs.slice(1).forEach((r, i) => expect(r.light).toBeLessThanOrEqual(rs[i]!.light));
    expect(rs[4]!.light).toBe(0);
    expect(rs[3]!.light).toBeCloseTo(Math.exp(-66 / 45));
  });
});

describe("203 A5: synchronous stamp without a hole in the original word", () => {
  it("steps 2.4, 1.8, 1.3, 1 in 50 ms and disappears before 67 ms", () => {
    expect(stampStep(0, 0)).toEqual({ scale: 2.4, tilt: -8, opacity: 1 });
    expect(stampStep(17, 0).scale).toBe(1.8); expect(stampStep(33, 0).scale).toBe(1.3);
    expect(stampStep(50, 0)).toEqual({ scale: 1, tilt: 0, opacity: 1 });
    expect(stampStep(66, 0).opacity).toBe(0); expect(stampStep(0, 3).scale).toBe(3.15);
  });
  it("has no transparent .k rule, CSS stamp animation or delay", () => {
    const css = readFileSync("src/view/words/feel.css", "utf8") + readFileSync("src/ui/td.css", "utf8");
    expect(css).not.toContain("td-key-hold"); expect(css).not.toContain("td-key-stamp 67ms");
    expect(css).not.toMatch(/\.k[^{}]*\{[^}]*color:\s*transparent/);
    const cards = readFileSync("src/view/words/cards.ts", "utf8");
    expect(cards).toContain("stampStep("); expect(cards).toContain('"td-key-stamp"');
  });
});


describe("203 runtime wiring without a DOM library", () => {
  it("Hud.boxes includes the real chip, input strip and Build dock", () => {
    expect(PANELS).toContain("chip"); expect(PANELS).toContain("strip"); expect(PANELS).toContain("dock");
    const rs = panels(layouts[0]!);
    const hud = Object.assign(Object.create(Hud.prototype), { panels: rs.map(r => ({ getBoundingClientRect: () => ({ ...r, width: r.right - r.left }) })), changed: 1, seen: "" }) as Hud;
    expect(hud.boxes(1280, 720)).toEqual(rs);
  });
  it("draw keeps both t prefixes for 50 frames and clears the excluded card on the e frame", () => {
    const deck = smallDeck(["team", "thanks", "eye"]), w = world({ deck });
    for (const [i, text] of ["team", "thanks", "eye"].entries()) callWord(w, wordOf(deck, text), i === 1 ? 2 : 1);
    const node = () => ({ style: { setProperty() {}, opacity: "1" }, classList: { toggle() {} }, dataset: {} });
    const cards = live(w).map(word => ({ id: w.words.id(word.s), word: word.text, el: node(), slot: word.s, leave: "", typed: 0, pink: false, tier: 2, dots: "", learn: true, pinkUntil: 0, call: w.calls.id(w.words.call[word.s]!), x: 600, y: 300, half: 80, height: 60 }));
    const view = Object.assign(Object.create(WordCards.prototype), { cards, stamps: [], byId: new Map(cards.map(c => [c.id, c])), wait: new Map(), last: 0, frame: 0, layout() {}, render(card: typeof cards[number], typed: number) { card.typed = typed; } }) as WordCards;
    const shown = () => ["team", "thanks", "eye"].map(text => cards.find(c => c.word === text)!.typed);
    type(w, "t");
    for (let f = 0; f < 50; f++) { view.draw(w, f * 1000 / 60, 1280, 720); expect(shown()).toEqual([1, 1, 0]); }
    type(w, "e"); view.draw(w, 834, 1280, 720); expect(shown()).toEqual([2, 0, 0]);
    send(w, { t: "unlock" }); type(w, "t"); send(w, { t: "backspace", atMs: 0 });
    view.draw(w, 850, 1280, 720); expect(shown()).toEqual([0, 0, 0]);
  });
  it.each([false, true])("draw writes the first stamp pose immediately, including the final letter (reduced motion %s)", soft => {
    vi.stubGlobal("matchMedia", () => ({ matches: soft }));
    try {
      const style = { opacity: "1", transform: "", translate: "" }, stamp = { style: { ...style }, dataset: {}, offsetWidth: 17, offsetHeight: 28, textContent: "", getBoundingClientRect: () => ({ ...box(0, 130, 60, 90), width: 60 }) };
      const source = { dataset: { c: "m" }, textContent: "m", getBoundingClientRect: () => box(30, 195, 17, 28) };
      const card = { id: 1, slot: -1, word: "team", leave: "hit", el: { style, dataset: {}, getBoundingClientRect: () => ({ ...box(24, 195, 160, 70), width: 160 }) }, text: { innerHTML: '<span class="t">tea<span class="k">m</span></span>', querySelector: () => source }, x: 104, y: 195, half: 80, height: 70 };
      Object.assign(card, { stamp: { el: stamp, source: {}, at: -1000 } });
      const frame = vi.fn();
      const view = Object.assign(Object.create(WordCards.prototype), { cards: [card], stamps: [], chainTier: 0, last: 0, frame: 0, layout() {}, leaving() {}, feel: { frame } }) as WordCards;
      const w = world();
      for (const t of [0, 17, 33, 50, 66]) {
        view.draw(w, t, 1280, 720, panels(layouts[0]!));
        expect(stamp.style.opacity).toBe(t < 66 ? "1" : "0");
        if (t < 66) expect(stamp.style.transform).toContain(`scale(${soft ? 1 : stampStep(t, 0).scale})`);
        expect(card.text.innerHTML).toContain('class="t"'); expect(card.text.innerHTML).toContain('>m</span>');
      }
      expect(frame.mock.calls[0]![2]).toMatchObject({ width: 1280, height: 720 });
      expect(stamp.style.translate).not.toBe("");
    } finally { vi.unstubAllGlobals(); }
  });
  it("the capture scenario audits every frame with real stamps, named violations and offScreen", () => {
    const src = readFileSync("scripts/visual/scenarios/td-1c-words.mjs", "utf8");
    expect(src).toContain('requestAnimationFrame(keep)'); expect(src).toContain('.td-key-stamp');
    expect(src).toContain('boxAudit.offScreen.frames === 0'); expect(src).toContain('boxAudit.overHud.frames === 0');
    expect(src).not.toContain('n++ % 10');
  });
});

describe("232 F3-F5: stamp size and tier, the card clamp and the hard rim in the runtime", () => {
  const stampView = (sourceRect: Rect, layoutHeight: number | undefined, tier = 0) => {
    const style = { opacity: "1", transform: "", translate: "" };
    const stamp = { style: { ...style }, dataset: {}, textContent: "", getBoundingClientRect: () => ({ ...box(600, 300, 20, 20), width: 20 }) };
    const source = { textContent: "m", offsetHeight: layoutHeight, getBoundingClientRect: () => sourceRect };
    const card = { id: 1, slot: -1, word: "team", leave: "hit", el: { style, dataset: {}, getBoundingClientRect: () => ({ ...box(560, 300, 160, 70), width: 160 }) }, text: { querySelector: () => source }, x: 640, y: 300, half: 80, height: 70, stamp: { el: stamp, source: {}, at: -1000 } };
    const view = Object.assign(Object.create(WordCards.prototype), { cards: [card], stamps: [], chainTier: tier, last: 0, frame: 0, layout() {}, leaving() {} }) as WordCards;
    return { view, stamp };
  };
  const scaleOf = (transform: string) => Number(/scale\(([\d.]+)\)/.exec(transform)![1]);
  // Recheck of the 232 F3 fix: the letter a stamp covers is set by feel.css `.td-words .td-card` (it wins over td.css `.td-card`,
  // 18-24 px), so the stamp takes its size from the same --td-letter, never a copy of another rule.
  describe("the stamp's font is the size of the letter it covers, at 720p and 1080p", () => {
    const feel = readFileSync("src/view/words/feel.css", "utf8");
    const decl = (sel: string, prop: string) => {
      const body = new RegExp("(?:^|\\n|\\}\\s*)" + sel.replace(/[.]/g, "\\.") + " \\{([^}]*)\\}").exec(feel)?.[1] ?? "";
      return new RegExp("(?:^|[;{\\s])" + prop + ":\\s*([^;]+)").exec(body)?.[1]?.trim() ?? "";
    };
    /** px of a font size: var(--td-letter) as .td-words defines it, then clamp(Apx, calc(Bpx * var(--ui, 1)), Cpx). */
    const px = (value: string, ui: number): number => {
      const v = value.replace(/var\(--td-letter\)/, decl(".td-words", "--td-letter"));
      const m = /^clamp\((\d+)px, calc\((\d+)px \* var\(--ui, 1\)\), (\d+)px\)$/.exec(v.trim());
      if (!m) throw new Error("not a card letter size: " + value);
      return Math.min(+m[3]!, Math.max(+m[1]!, +m[2]! * ui));
    };
    const stampSize = () => /^\d+ (.+)\/1\.05 var\(--vd-font\)$/.exec(decl(".td-key-stamp", "font"))?.[1] ?? "none";
    // main.ts resize(): --ui = clamp(0.8, min(width / 1600, height / 900), 1.2).
    const ui = (width: number, height: number) => Math.max(0.8, Math.min(1.2, Math.min(width / 1600, height / 900)));
    it.each([[1280, 720, 26], [1920, 1080, 32]])("%s x %s: letter %s px, stamp the same, so it settles at 1x and starts at 2.4x", (width, height, letter) => {
      expect(px(decl(".td-words .td-card", "font-size"), ui(width, height))).toBe(letter);
      expect(px(stampSize(), ui(width, height))).toBe(letter);
      expect(stampStep(50, 0).scale * px(stampSize(), ui(width, height)) / letter).toBe(1);
      expect(stampStep(0, 0).scale * px(stampSize(), ui(width, height)) / letter).toBe(2.4);
    });
    it("both read one --td-letter on the cards' root, never td.css's 18-24 px card size", () => {
      expect(decl(".td-words .td-card", "font-size")).toBe("var(--td-letter)");
      expect(stampSize()).toBe("var(--td-letter)");
      expect(stampSize()).not.toContain("18px");
    });
  });
  it.each([[18, 18], [18, 21.6], [24, 28.8]])("a %s px letter shown %s px tall: the stamp settles at 1x the letter on screen", (layout, shown) => {
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    try {
      const { view, stamp } = stampView(box(630, 320, 12, shown), layout);
      const w = world();
      for (const t of [0, 17, 33, 50]) {
        view.draw(w, t, 1280, 720);
        expect(scaleOf(stamp.style.transform)).toBeCloseTo(stampStep(t, 0).scale * (shown / layout), 3);
      }
    } finally { vi.unstubAllGlobals(); }
  });
  it("a chain event sets --tier on the cards' root, and the stamp's glow reads it", () => {
    const setProperty = vi.fn();
    const view = Object.assign(Object.create(WordCards.prototype), { root: { style: { setProperty } }, byId: new Map(), stamps: [], wait: new Map(), chainTier: 0 }) as WordCards;
    view.read([{ tick: 0, t: "chain", chain: 9, tier: 3, callout: false }], world(), 0);
    expect(setProperty).toHaveBeenCalledWith("--tier", "3");
    const css = readFileSync("src/view/words/feel.css", "utf8");
    const rule = /\.td-key-stamp \{[^}]*\}/.exec(css)![0];
    expect(rule).toMatch(/--glow: color-mix\([^;]*var\(--tier\)/);
    expect(rule).toMatch(/text-shadow:[^;]*var\(--glow\)/);
    expect(rule).not.toContain("#7ff5e0, 0 0 12px #7ff5e0");
  });
  it("draw clamps a card crossing the chip: translate written and the card's anchor moved with it", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    try {
      const ps = panels(layouts[0]!);
      const style = { opacity: "1", transform: "", translate: "" };
      const card = { id: 1, slot: -1, word: "team", leave: "hit", el: { style, dataset: {}, getBoundingClientRect: () => { const [dx, dy] = (style.translate || "0px 0px").split(" ").map(parseFloat); return { ...box(100 + dx!, 150 + dy!, 160, 40), width: 160 }; } }, text: { querySelector: () => null }, x: 180, y: 150, half: 80, height: 40 };
      const view = Object.assign(Object.create(WordCards.prototype), { cards: [card], stamps: [], chainTier: 0, last: 0, frame: 0, layout() {}, leaving() {} }) as WordCards;
      expect(touch(box(100, 150, 160, 40), ps[0]!)).toBe(true);
      view.draw(world(), 0, 1280, 720, ps);
      expect(style.translate).not.toBe("");
      const [dx, dy] = style.translate.split(" ").map(parseFloat);
      expect([card.x, card.y]).toEqual([180 + dx!, 150 + dy!]);
      const extra = 40 * 0.12 + 12, moved = card.el.getBoundingClientRect();
      safe(box(moved.left - extra, moved.top - extra, 160 + 2 * extra, 40 + 2 * extra), layouts[0]!, ps);
    } finally { vi.unstubAllGlobals(); }
  });
  it("read of a wordHit draws the hard warm-white outline beyond the card", () => {
    const style: Record<string, string> = {};
    const card = { id: 7, call: 99, word: "team", mean: "", x: 600, y: 300, text: { innerHTML: "" }, el: { style, offsetHeight: 58, className: "", getAnimations: () => [] } };
    const stamp = { el: { textContent: "", className: "", offsetWidth: 40 }, at: -1e9, x: 0, y: 0, half: 0, card: null };
    const view = Object.assign(Object.create(WordCards.prototype), { root: { style: { setProperty() {} } }, byId: new Map([[7, card]]), stamps: [stamp], wait: new Map(), chainTier: 0 }) as WordCards;
    view.read([{ tick: 0, t: "wordHit", word: 7, call: 99, grade: "perfect", errors: 0, quality: 1, len: 4, ms: 900, wait: 0, fam: 0, item: 0, kind: 0 }], world(), 1000);
    const r = rimAt(0, 58, 58 / 60);
    expect(style.outline).toContain("#FFF0D8");
    expect(style.outline).toContain(`${r.width}px solid`);
    expect(parseFloat(style.outlineOffset!)).toBeCloseTo(r.out - r.width, 5);
    expect(card.el.className).toBe("td-card is-gone");
  });
});

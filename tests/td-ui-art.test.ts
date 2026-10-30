import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import picks from "../scripts/td/ui-picks.json";
// @ts-expect-error The media tool is plain Node ESM.
import { plan } from "../scripts/td/prepare-ui.mjs";
import { bindArt, UI_ART } from "../src/ui/art";
import { Sheet } from "../src/ui/sheets";
import { TitleScreen } from "../src/ui/title";
import { world } from "./td/fixtures";

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const read = (file: string) => readFileSync(new URL("../" + file, import.meta.url), "utf8");

describe("200: accepted UI media plan", () => {
  it("matches the runtime catalog in both directions, including dimensions and verdicts", () => {
    expect(Object.keys(UI_ART).sort()).toEqual(picks.map((p) => p.name).sort());
    for (const pick of picks) {
      expect(pick.accepted).toBe(true);
      expect(pick.verdict.file).toMatch(/verdict\.md$/);
      expect(pick.verdict.M).toBeGreaterThanOrEqual(8);
      expect(pick.verdict.Q).toBeGreaterThanOrEqual(8);
      const art = UI_ART[pick.name as keyof typeof UI_ART];
      expect(art.files).toEqual(pick.outputs.map((o) => ({ src: "/assets/typing-defense/ui/" + o.file, width: o.width, height: o.height })));
      expect(art.srcset).toBe(art.files.map((f) => `${f.src} ${f.width}w`).join(", "));
      expect(art.sizes.length).toBeGreaterThan(0);
    }
    expect(picks.find((p) => p.name === "favicon")).toHaveProperty("until", "177");
  });
  it("plans the exact 16:9 crop, every required size, and never enlarges", () => {
    const jobs = plan(picks);
    expect(jobs).toHaveLength(16);
    expect(jobs.filter((j: any) => j.name === "title-backdrop").map((j: any) => [j.crop.geometry, j.width, j.height]))
      .toEqual([["1536x864+0+80", 1280, 720], ["1536x864+0+80", 1536, 864]]);
    const widths: Record<string, number[]> = { logo: [180, 360, 576, 864, 1296, 1728], favicon: [32, 64], crest: [128, 256], banner: [400, 800], divider: [320, 640] };
    for (const [name, sizes] of Object.entries(widths)) expect(jobs.filter((j: any) => j.name === name).map((j: any) => j.width)).toEqual(sizes);
    for (const job of jobs) {
      expect(job.width).toBeLessThanOrEqual(job.inputWidth);
      expect(job.height).toBeLessThanOrEqual(job.inputHeight);
    }
    expect(() => plan([{ ...picks[1], outputs: [{ file: "logo.huge.webp", width: 3000, height: 1000 }] }])).toThrow(/enlarg/i);
  });
  it("skips rejected art and rejects paths outside the named output directory", () => {
    expect(plan(picks.map((p) => ({ ...p, accepted: false })))).toEqual([]);
    expect(() => plan([{ ...picks[1], outputs: [{ file: "../else.webp", width: 180, height: 60 }] }])).toThrow();
  });
});

describe("200: rendered HTML without a DOM library", () => {
  it("puts the logo in the title heading, with a responsive painted backdrop and one accessible name", () => {
    const img = () => ({ complete: false, addEventListener() {} });
    const logo = img(), backdrop = img();
    const el = { innerHTML: "", addEventListener() {}, querySelector: (s: string) => s === ".tt-art" ? backdrop : s === ".tt-logo" ? logo : {}, querySelectorAll: () => [], classList: { add() {}, remove() {} } };
    vi.stubGlobal("document", { createElement: () => el });
    new TitleScreen({ appendChild() {} } as any, {} as any, {} as any, false);
    expect(el.innerHTML).toMatch(/<h1 class="tt-name">[\s\S]*?<img[^>]+alt="Wordwoven"/);
    expect(el.innerHTML).toContain('class="tt-logo-fallback" hidden aria-hidden="true">Wordwoven</span>');
    expect(el.innerHTML).toContain(UI_ART["title-backdrop"].srcset);
    expect(el.innerHTML).not.toMatch(/svg|title-dusk/);
    expect(read("src/ui/title.ts")).not.toContain("title-dusk");
  });
  it.each(["victory", "defeat", "pause"])("%s: only results create decorative images, inside the card", (phase) => {
    const w = world();
    if (phase !== "pause") w.phase = phase as "victory" | "defeat";
    const el = { innerHTML: "", className: "", appendChild() {}, querySelectorAll: () => [] };
    const sheet = Object.assign(Object.create(Sheet.prototype), { el, settings: { close() {}, el: {} } }) as Sheet;
    sheet.show(phase === "pause" ? "pause" : "results", w);
    for (const name of ["crest", "banner", "divider"] as const) {
      expect(el.innerHTML.includes(UI_ART[name].src)).toBe(phase !== "pause");
      if (phase !== "pause") expect(el.innerHTML).toMatch(new RegExp(`<img[^>]+class="td-result-${name}"[^>]+alt=""[^>]+aria-hidden="true"`));
    }
    if (phase === "defeat") expect(el.className).toContain("is-lost");
    if (phase !== "pause") {
      expect(el.innerHTML.indexOf('class="td-result-crest"')).toBeLessThan(el.innerHTML.indexOf("<h2"));
      expect(el.innerHTML.indexOf('class="td-result-divider"')).toBeGreaterThan(el.innerHTML.indexOf("</dl>"));
      expect(el.innerHTML.indexOf('class="td-result-divider"')).toBeLessThan(el.innerHTML.indexOf("<button"));
    }
  });
  it("uses the same favicon and loading logo URLs in the initial document", () => {
    const html = read("index.html");
    for (const f of UI_ART.favicon.files) expect(html).toContain(`<link rel="icon" type="image/png" sizes="${f.width}x${f.height}" href="${f.src}"`);
    expect(html).not.toContain("data:,");
    expect(html).toMatch(/<img[^>]+id="tdLoadingLogo"/);
    expect(html).toContain(UI_ART.logo.srcset);
    expect(html).toContain("loading words…");
    expect(read("src/main.ts")).toContain('bindArt(byId<HTMLImageElement>("tdLoadingLogo"), "logo"');
  });
  it("places the divider immediately before a nonempty review list", () => {
    const w = world();
    w.phase = "victory";
    w.typing.review[0] = 0;
    w.typing.reviewN = 1;
    const el = { innerHTML: "", appendChild() {}, querySelectorAll: () => [] };
    const sheet = Object.assign(Object.create(Sheet.prototype), { el, settings: { close() {}, el: {} } }) as Sheet;
    sheet.show("results", w);
    expect(el.innerHTML).toMatch(/class="td-result-divider"[^>]+><div class="td-review"><small>To review/);
  });
});

describe("200: failed and cached images", () => {
  function image(complete = false, naturalWidth = 0) {
    const events: Record<string, () => void> = {};
    return { complete, naturalWidth, hidden: false, currentSrc: "https://example.test/broken.webp", src: "other.webp", events,
      addEventListener: (type: string, callback: () => void) => { events[type] = callback; } };
  }
  it.each([false, true])("warns with name and selected URL, hides failures and reveals fallback (already complete: %s)", (cached) => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const img = image(cached);
    const fallback = { hidden: true, removeAttribute: vi.fn(), setAttribute: vi.fn() };
    bindArt(img as any, "logo", { fallback: fallback as any });
    if (!cached) img.events.error!();
    expect(img.hidden).toBe(true);
    expect(fallback.hidden).toBe(false);
    expect(fallback.removeAttribute).toHaveBeenCalledWith("aria-hidden");
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("logo"), img.currentSrc);
    img.events.error!();
    expect(warn).toHaveBeenCalledTimes(1);
  });
  it("accepts an image loaded before the handler is attached", () => {
    const img = image(true, 180), loaded = vi.fn();
    bindArt(img as any, "logo", { loaded });
    expect(loaded).toHaveBeenCalledOnce();
    expect(img.hidden).toBe(false);
  });
  it("hides a decorative image on error and tells its owner to use a flat backdrop", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const img = image(), failed = vi.fn();
    bindArt(img as any, "title-backdrop", { failed });
    img.events.error!();
    expect(img.hidden).toBe(true);
    expect(failed).toHaveBeenCalledOnce();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("title-backdrop"), img.currentSrc);
    expect(read("src/ui/title.css")).toContain(".tt-screen.no-art { background: #1c1824; }");
  });
});

describe("232 F1, F2: the results heading fits its banner and reads on paper", () => {
  const css = () => read("src/ui/td.css");
  it("has no fixed height and no inherited seal bar, base and short screens alike", () => {
    const rules = [...css().matchAll(/\.td-sheet \.td-result-heading(?:::after|\.has-banner)? \{[^}]*\}/g)].map((m) => m[0]);
    expect(rules.length).toBeGreaterThanOrEqual(4);
    for (const rule of rules) expect(rule).not.toMatch(/(?:^|[\s;{])(?:height|max-height):/);
    expect(css()).toContain(".td-sheet .td-result-heading::after { content: none; }");
  });
  it("keeps the words ink unless its banner loaded (cream only under has-banner)", () => {
    const base = css().match(/\.td-sheet \.td-result-heading \{[^}]*\}/)![0];
    expect(base).not.toMatch(/color:|text-shadow:/);
    expect(css()).toMatch(/\.td-sheet \.td-result-heading\.has-banner \{[^}]*color: #fff3d6/);
  });
  function results(banner: { complete: boolean; naturalWidth: number }) {
    const events: Record<string, () => void> = {}, classes = new Set<string>();
    const heading = { classList: { toggle: (name: string, on: boolean) => (on ? classes.add(name) : classes.delete(name)) } };
    const img = { ...banner, hidden: false, dataset: { uiArt: "banner" }, parentElement: heading, currentSrc: "", src: "", addEventListener: (type: string, fn: () => void) => { events[type] = fn; } };
    const crest = { ...banner, hidden: false, dataset: { uiArt: "crest" }, parentElement: { classList: { toggle: vi.fn() } }, addEventListener() {} };
    const el = { innerHTML: "", className: "", appendChild() {}, querySelectorAll: (s: string) => (s === "img[data-ui-art]" ? [img, crest] : []) };
    const sheet = Object.assign(Object.create(Sheet.prototype), { el, settings: { close() {}, el: {} } }) as Sheet;
    const w = world();
    w.phase = "defeat";
    sheet.show("results", w);
    return { events, classes, crest };
  }
  it("a failed banner leaves no has-banner class; a loaded one adds it", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(results({ complete: true, naturalWidth: 0 }).classes.has("has-banner")).toBe(false);
    expect(results({ complete: true, naturalWidth: 800 }).classes.has("has-banner")).toBe(true);
    const later = results({ complete: false, naturalWidth: 0 });
    expect(later.classes.has("has-banner")).toBe(false);
    later.events.load!();
    expect(later.classes.has("has-banner")).toBe(true);
    later.events.error!();
    expect(later.classes.has("has-banner")).toBe(false);
    expect(later.crest.parentElement.classList.toggle).not.toHaveBeenCalled();
  });
});

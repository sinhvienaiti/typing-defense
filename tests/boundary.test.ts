import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { GAME_ID } from "../src/app/learning";
import { blank, storageKeys } from "./td/source-scan";

/**
 * Lời Gọi's boundary (docs/td/TYPING_DEFENSE_DESIGN.md 25.3; the parent repo's
 * docs/games/SPLIT_PLAN.md §3). The game's own code (src/**, src/kit aside)
 * loads itself, the shared kit copied into src/kit, three and @fontsource;
 * nothing reaches Space Typing or the parent repo; src/kit is byte for byte
 * what kit-manifest.json lists. The rules (sim/, typing/, content/) are
 * deterministic TypeScript that a replay on Node and in Chrome steps to the
 * same hash.
 */
const ROOT = join(__dirname, "..");
const KIT = "src/kit/";
const KIT_TOOLS = "src/kit/tools/";
/** Node-only kit files (vite.config.ts, scripts, `pnpm check`): never loaded by the page. */
const nodeOnly = (path: string) => path.startsWith(KIT_TOOLS) || path === "src/kit/verify-kit.mjs";

type Source = { path: string; text: string };

function sources(dir: string, pattern = /\.(ts|tsx|js|mjs|css)$/): Source[] {
  const absolute = join(ROOT, dir);
  if (!existsSync(absolute)) return [];
  return readdirSync(absolute).flatMap((name) => {
    const path = dir + "/" + name;
    if (statSync(join(ROOT, path)).isDirectory()) return sources(path, pattern);
    return pattern.test(name) ? [{ path, text: readFileSync(join(ROOT, path), "utf8") }] : [];
  });
}

const PACKAGES = /^(three|three\/examples\/jsm\/.+|@fontsource\/.+|a11y-dialog)$/;
const PURE_ROOTS = ["src/sim/", "src/typing/", "src/content/"];
/** Kit files the rules load: the seeded streams, and the balance module's flow meter and pace director (BALANCE.md §8: pure, deterministic TS). */
const PURE_KIT = ["src/kit/platform/rng", ...["bands", "director", "flow", "math", "profile"].map((file) => "src/kit/balance/" + file)];
const ALLOWED_MATH = ["sqrt", "floor", "ceil", "round", "trunc", "abs", "min", "max", "sign", "imul", "clz32"];
/**
 * Globals the rules may not name. After a dot a name is a property
 * (`point.window`), so `self.Date` is caught by `self`. The ES library's
 * clock, random, locale, code-from-strings and garbage-collector hooks, plus
 * host names that are rarely a local's. Every other host global (top,
 * parent, frames, name, console…) is caught by compiling the rules without
 * the DOM and Node libraries (hostProblems).
 */
const FORBIDDEN_GLOBALS = [
  "window", "self", "document", "performance", "Date", "localStorage", "sessionStorage", "requestAnimationFrame",
  "setTimeout", "setInterval", "setImmediate", "queueMicrotask", "structuredClone", "globalThis", "navigator", "crypto",
  "process", "require", "Intl", "eval", "Function", "WeakRef", "FinalizationRegistry",
];
/** ICU- and locale-dependent: Node and Chrome may sort or print differently. Banned on any object. */
const FORBIDDEN_METHODS = ["localeCompare", "toLocaleString", "toLocaleUpperCase", "toLocaleLowerCase", "toLocaleDateString", "toLocaleTimeString"];

type Import = { spec: string; names: string[] };

function namesOf(clause: string): string[] {
  const names: string[] = [];
  const braces = /\{([^}]*)\}/.exec(clause);
  for (const part of braces?.[1]?.split(",") ?? []) {
    const name = part.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0]!.trim();
    if (name !== "") names.push(name);
  }
  const outside = clause.replace(/\{[^}]*\}/, "").replace(/^\s*type\s+/, "");
  if (outside.includes("*")) names.push("*");
  if (/^\s*[\w$]+\s*(,|$)/.test(outside)) names.push("default");
  return names;
}

function importsOf(source: Source): Import[] {
  if (source.path.endsWith(".css")) {
    const code = source.text.replace(/\/\*[\s\S]*?\*\//g, "");
    return [...code.matchAll(/@import\s+(?:url\(\s*)?["']([^"']+)["']/g)].map((match) => ({ spec: match[1]!, names: [] }));
  }
  const code = blank(source.text, false);
  const found: Import[] = [];
  // An import clause holds no quote, semicolon, parenthesis or "=": the match cannot run on from an `export const`.
  for (const match of code.matchAll(/\b(?:import|export)\s+(?!["'(])([^"';()=]*?)\s*from\s*["']([^"']+)["']/g)) found.push({ spec: match[2]!, names: namesOf(match[1]!) });
  for (const match of code.matchAll(/\bimport\s*["']([^"']+)["']/g)) found.push({ spec: match[1]!, names: [] });
  for (const match of code.matchAll(/\bimport\(\s*["']([^"']+)["']\s*\)/g)) found.push({ spec: match[1]!, names: ["*"] });
  return found;
}

/** A relative import as a repo path without its extension ("src/kit/input"); a package as written. */
function target(file: string, spec: string): string {
  const bare = spec.split("?")[0]!;
  if (!bare.startsWith(".")) return bare;
  return relative(ROOT, resolve(ROOT, dirname(file), bare)).split(sep).join("/").replace(/\.(ts|tsx|js|mjs)$/, "");
}

function purityProblems(text: string): string[] {
  const code = blank(text, true);
  const problems: string[] = [];
  const globals = new RegExp("(?<![\\w$.])(" + FORBIDDEN_GLOBALS.join("|") + ")(?![\\w$])|(?<![\\w$])(" + FORBIDDEN_METHODS.join("|") + ")(?![\\w$])", "g");
  for (const match of code.matchAll(globals)) problems.push(match[1] ?? match[2]!);
  const math = new RegExp("\\bMath\\b(?!\\s*\\.\\s*(?:" + ALLOWED_MATH.join("|") + ")\\b)(\\s*\\.\\s*\\w+)?", "g");
  for (const match of code.matchAll(math)) problems.push(match[0].replace(/\s/g, ""));
  if (code.includes("**")) problems.push("**");
  return problems;
}

const configured = ts.parseJsonConfigFileContent(ts.readConfigFile(join(ROOT, "tsconfig.json"), ts.sys.readFile).config, ts.sys, ROOT).options;
/** tsconfig.json without the DOM libraries and with no @types: what a browser or Node supplies is undeclared. */
const HOSTLESS: ts.CompilerOptions = { ...configured, lib: (configured.lib ?? []).filter((lib) => !/dom|webworker|scripthost/i.test(lib)), types: [], noEmit: true };
const libraries = new Map<string, ts.SourceFile | undefined>();

/**
 * Compiles the given files with HOSTLESS. A host global (window, self, top,
 * parent, frames, name, performance, process, structuredClone, console…)
 * then fails as an undeclared name, while a local of the same name (an A*
 * `parent` array) still compiles. Reports the name, or the message of any
 * other error.
 */
function hostProblems(files: readonly Source[]): { path: string; problem: string }[] {
  const own = new Map(files.map((file) => [join(ROOT, file.path), file]));
  const host = ts.createCompilerHost(HOSTLESS);
  const read = host.getSourceFile.bind(host);
  const exists = host.fileExists.bind(host);
  host.fileExists = (name) => own.has(name) || exists(name);
  host.getSourceFile = (name, language, ...rest) => {
    const file = own.get(name);
    if (file !== undefined) return ts.createSourceFile(name, file.text, language);
    if (!libraries.has(name)) libraries.set(name, read(name, language, ...rest));
    return libraries.get(name);
  };
  const program = ts.createProgram({ rootNames: [...own.keys()], options: HOSTLESS, host });
  return [...own].flatMap(([name, file]) => {
    const source = program.getSourceFile(name)!;
    return [...program.getSyntacticDiagnostics(source), ...program.getSemanticDiagnostics(source)].map((diagnostic) => {
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, " ");
      const start = diagnostic.start ?? 0;
      return { path: file.path, problem: message.startsWith("Cannot find name") ? source.text.slice(start, start + (diagnostic.length ?? 0)) : message };
    });
  });
}

const isPure = (path: string) => PURE_ROOTS.some((root) => path.startsWith(root)) || PURE_KIT.some((module) => path.replace(/\.ts$/, "") === module);

const all = sources("src");
/** The game's own code: src without the kit copy. */
const game = all.filter((source) => !source.path.startsWith(KIT));
/** What the browser loads: the game and the kit, the kit's Node-only files aside. */
const browser = all.filter((source) => !nodeOnly(source.path));
const tools = all.filter((source) => nodeOnly(source.path));
const pure = all.filter((source) => isPure(source.path));

describe("Lời Gọi boundary (TK 25.3, SPLIT_PLAN §3)", () => {
  it("index.html boots src/main.ts; the package is typing-defense on port 3006", () => {
    expect(readFileSync(join(ROOT, "index.html"), "utf8")).toMatch(/<script type="module" src="\/src\/main\.ts"><\/script>/);
    expect(game.map((source) => source.path)).toContain("src/main.ts");
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as { name: string; scripts: Record<string, string>; dependencies: Record<string, string> };
    expect(pkg.name).toBe("typing-defense");
    expect(pkg.scripts["dev"]).toMatch(/--port 3006 --strictPort/);
    expect(pkg.dependencies["three"]).toBe("0.170.0");
    expect(readFileSync(join(ROOT, "vite.config.ts"), "utf8")).toMatch(/\bport: 3006\b/);
  });

  it("src loads only src/**, three, three/examples/jsm/*, @fontsource/* and a11y-dialog (MIT, the kit's quick-settings panels)", () => {
    const crossing = browser.flatMap((source) =>
      importsOf(source)
        .filter(({ spec }) => {
          const path = target(source.path, spec);
          return !(path.startsWith("src/") && !nodeOnly(path) && !nodeOnly(path + ".mjs")) && !PACKAGES.test(path);
        })
        .map(({ spec }) => source.path + " → " + spec),
    );
    expect(crossing).toEqual([]);
  });

  it("the kit's Node-only files load only the kit's tools, node:* and vite", () => {
    expect(tools.length).toBeGreaterThan(0);
    const crossing = tools.flatMap((source) =>
      importsOf(source)
        .filter(({ spec }) => !target(source.path, spec).startsWith(KIT_TOOLS) && !/^node:/.test(spec) && spec !== "vite")
        .map(({ spec }) => source.path + " → " + spec),
    );
    expect(crossing).toEqual([]);
  });

  it("no source, test or script reaches Space Typing or out of this repository", () => {
    const configs = ["vite.config.ts", "vitest.config.ts"].map((path) => ({ path, text: readFileSync(join(ROOT, path), "utf8") }));
    // This file aside: its self-checks hold sample imports.
    const code = [...sources("src"), ...sources("tests").filter((source) => source.path !== "tests/boundary.test.ts"), ...sources("scripts"), ...configs];
    expect(code.length).toBeGreaterThan(game.length);
    const crossing = code.flatMap((source) =>
      importsOf(source)
        .filter(({ spec }) => /space-typing/.test(spec) || target(source.path, spec).startsWith("../"))
        .map(({ spec }) => source.path + " → " + spec),
    );
    expect(crossing).toEqual([]);
    const named = game.filter((source) => /space-typing|scene3d\/|src\/defense\//.test(blank(source.text, false))).map((source) => source.path);
    expect(named).toEqual([]);
  });

  it("src/kit is what kit-manifest.json lists, byte for byte, with kit.config.json's modules", () => {
    const manifest = JSON.parse(readFileSync(join(ROOT, KIT, "kit-manifest.json"), "utf8")) as { modules: string[]; files: Record<string, string> };
    const config = JSON.parse(readFileSync(join(ROOT, "kit.config.json"), "utf8")) as { modules: string[] };
    expect(manifest.modules).toEqual(config.modules);
    const listed = Object.keys(manifest.files).sort();
    const present = sources("src/kit", /./).map((source) => source.path.slice(KIT.length)).filter((path) => path !== "kit-manifest.json" && !/(^|\/)(\.DS_Store|Thumbs\.db)$/.test(path)).sort();
    expect(present).toEqual(listed);
    const changed = listed.filter((path) => createHash("sha256").update(readFileSync(join(ROOT, KIT, path))).digest("hex") !== manifest.files[path]);
    expect(changed).toEqual([]);
  });

  it("the rules (sim/, typing/, content/) load only the rules, src/kit/platform/rng and the balance module's pure files", () => {
    expect(pure.map((source) => source.path)).toContain("src/kit/platform/rng.ts");
    const crossing = pure.flatMap((source) =>
      importsOf(source)
        .filter(({ spec }) => {
          const path = target(source.path, spec);
          return !PURE_ROOTS.some((root) => path.startsWith(root)) && !PURE_KIT.includes(path);
        })
        .map(({ spec }) => source.path + " → " + spec),
    );
    expect(crossing).toEqual([]);
  });

  it("the rules use no clock, host global, storage, locale, Math.random, trigonometry, powers or logarithms", { timeout: 20_000 }, () => {
    // The balance kit names its 20 s FlowWindow `window`: a local there, which the hostless compile below tells from the global.
    const local = (source: Source, problem: string) => problem === "window" && source.path.startsWith("src/kit/balance/");
    const found = pure.flatMap((source) => purityProblems(source.text).filter((problem) => !local(source, problem)).map((problem) => source.path + ": " + problem));
    expect(found).toEqual([]);
    const typescript = pure.filter((source) => source.path.endsWith(".ts"));
    expect(hostProblems(typescript).map(({ path, problem }) => path + ": " + problem)).toEqual([]);
  });

  it("asset URLs stay under /assets/typing-defense/ or /assets/shared/", () => {
    const found = game.flatMap((source) => [...blank(source.text, false).matchAll(/\/assets\/(?!typing-defense\/|shared\/)[^\s"'`)]*/g)].map((match) => source.path + ": " + match[0]));
    expect(found).toEqual([]);
  });

  it("the game's own storage keys start with td. or typing-defense:, or are the kit's skill profile key typing-defense.skill (BALANCE.md §2) or Học's typing-defense.learn (BUILD_1B §11.1)", () => {
    const keys = game.flatMap((source) => storageKeys(source.text).map(({ method, key }) => ({ at: source.path + " " + method, key })));
    expect(keys.filter(({ key }) => key === null || !/^(td\.|typing-defense:|typing-defense\.(skill|learn)$)/.test(key))).toEqual([]);
  });

  it("learning events and the portal know this game as typing-defense", () => {
    expect(GAME_ID).toBe("typing-defense");
    const bridges = game.filter((source) => /\bcreateLearningBridge\s*\(/.test(blank(source.text, false))).map((source) => source.path);
    expect(bridges).toEqual(["src/app/learning.ts"]);
  });

  /** Lines of the TD code as BUILD_1A6 §0 counts them: the game's TypeScript (src/kit aside), as `wc -l` does. */
  const codeLines = (): number => game.filter((source) => source.path.endsWith(".ts")).reduce((sum, source) => sum + (source.text.match(/\n/g) ?? []).length, 0);

  /** The milestone being built (BUILD_NOTES §1.2): 1A.n, 1B.Rn, 1B.V4, and from 1C (map 1 in 3D) 1C.Cn. */
  const milestone = (): string | undefined => /Mốc đang làm: \*\*(1[ABC]\.\w+)\*\*/.exec(readFileSync(join(ROOT, "docs/td/BUILD_NOTES.md"), "utf8"))?.[1];

  it("the TD code stays under the hard ceiling of its step (BUILD_1B §16; from 1C, BUILD_1C_MAP1 §3)", () => {
    const [step, doc] = milestone()?.startsWith("1C") === true ? ["1C", "docs/td/BUILD_1C_MAP1.md"] : ["1B", "docs/td/BUILD_1B.md"];
    const ceiling = new RegExp("Trần cứng " + step + ": \\*\\*(\\d+)\\.(\\d{3})\\*\\*").exec(readFileSync(join(ROOT, doc), "utf8"));
    expect(ceiling, doc + " names the hard ceiling of step " + step).not.toBeNull();
    expect(codeLines()).toBeLessThanOrEqual(Number(ceiling![1]! + ceiling![2]!));
  });

  it("the TD code stays inside the running total its milestone may reach (docs/td/BUILD_NOTES.md §1.2)", () => {
    const notes = readFileSync(join(ROOT, "docs/td/BUILD_NOTES.md"), "utf8");
    const step = milestone();
    expect(step, "BUILD_NOTES §1.2 names the milestone being built").toBeDefined();
    // Its row: | 1A.n … | new lines | share | running total |
    const row = new RegExp("^\\| " + step!.replace(".", "\\.") + " [^|]*\\|[^|]*\\|[^|]*\\| (\\d+)\\.(\\d{3}) \\|", "m").exec(notes);
    expect(row, "BUILD_NOTES §1.2 has a row for " + step).not.toBeNull();
    expect(codeLines(), step + " may reach " + row![1] + row![2] + " lines in all").toBeLessThanOrEqual(Number(row![1]! + row![2]!));
  });
});

describe("the boundary checks themselves", () => {
  it("find banned calls in code, not in comments or strings", () => {
    expect(purityProblems("const a = Math.random();")).toEqual(["Math.random"]);
    expect(purityProblems("const a = Math.hypot(x, y) + Math.sin(t);")).toEqual(["Math.hypot", "Math.sin"]);
    expect(purityProblems("const { cos } = Math;")).toEqual(["Math"]);
    expect(purityProblems("let a = b ** 2; a **= 2;")).toEqual(["**"]);
    expect(purityProblems("const now = Date.now(); window.x = performance.now();")).toEqual(["Date", "window", "performance"]);
    expect(purityProblems("const label = `${Math.cos(a)}`;")).toEqual(["Math.cos"]);
    expect(purityProblems("const r = Math.sqrt(x * x + y * y) + Math.imul(a, b) + Math.floor(c);")).toEqual([]);
    expect(purityProblems("// Math.random() and a ** b\n/** Date.now() */\nconst s = \"window Math.sin\" + `Date ${x}`;\nconst t = point.window;")).toEqual([]);
  });

  it("find the ways around a banned name", () => {
    expect(purityProblems("const t = self.performance.now() + self.Date.now();")).toEqual(["self", "self"]);
    expect(purityProblems('const r = Reflect.get(self, "Math").random();')).toEqual(["self"]);
    expect(purityProblems("globalThis.Math.random();")).toEqual(["globalThis", "Math.random"]);
    expect(purityProblems("queueMicrotask(step); setImmediate(step); const c = structuredClone(state);")).toEqual(["queueMicrotask", "setImmediate", "structuredClone"]);
    expect(purityProblems('const f = new Function("return Math.random()"); eval("Date.now()"); require("perf_hooks");')).toEqual(["Function", "eval", "require"]);
    expect(purityProblems("const t = process.hrtime(); const n = new Intl.NumberFormat(); const w = new WeakRef(o); new FinalizationRegistry(f);")).toEqual(["process", "Intl", "WeakRef", "FinalizationRegistry"]);
    expect(purityProblems("words.sort((a, b) => a.localeCompare(b)); const { localeCompare } = String.prototype;")).toEqual(["localeCompare", "localeCompare"]);
    expect(purityProblems("n.toLocaleString(); s?.toLocaleUpperCase(); s.toLocaleLowerCase(); d.toLocaleDateString(); d.toLocaleTimeString();")).toEqual([
      "toLocaleString", "toLocaleUpperCase", "toLocaleLowerCase", "toLocaleDateString", "toLocaleTimeString",
    ]);
    expect(purityProblems("words.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)); const s = word.normalize(\"NFC\").toLowerCase();")).toEqual([]);
  });

  it("find every host global by compiling without the DOM and Node libraries", () => {
    const names = (text: string) => hostProblems([{ path: "src/sim/probe.ts", text }]).map(({ problem }) => problem);
    expect(names("export const t = top.length + parent.x + frames + name + status + origin;")).toEqual(["top", "parent", "frames", "name", "status", "origin"]);
    expect(names("export const t = self.Date.now() + performance.now() + structuredClone(1) + process.hrtime()[0]; console.log(t);")).toEqual([
      "self", "performance", "structuredClone", "process", "console",
    ]);
    expect(names("const parent = new Int32Array(4);\nconst top = parent[0]!;\nexport const step = (frames: number) => frames + top;")).toEqual([]);
    expect(names('import { createRng } from "../kit/platform/rng";\nexport const draw = createRng(1).spawn.next();')).toEqual([]);
    expect(names("export const n: number = \"x\";")).toEqual(["Type 'string' is not assignable to type 'number'."]);
  });

  it("read every kind of import", () => {
    const source = (text: string, path = "src/app/a.ts") => importsOf({ path, text });
    expect(source('import { a, type B as C } from "../x";')).toEqual([{ spec: "../x", names: ["a", "B"] }]);
    expect(source('import D, * as E from "y";\nexport * from "./z";\nimport F from "w";')).toEqual([
      { spec: "y", names: ["*", "default"] },
      { spec: "./z", names: ["*"] },
      { spec: "w", names: ["default"] },
    ]);
    expect(source('export function f() { return a }\nexport const g = { b: 1 }\nimport { h } from "../v";')).toEqual([{ spec: "../v", names: ["h"] }]);
    expect(source('import "./td.css";\nconst m = await import("../../space-typing/src/main");\n// import { x } from "../../scene3d/hero";')).toEqual([
      { spec: "./td.css", names: [] },
      { spec: "../../space-typing/src/main", names: ["*"] },
    ]);
    expect(source('@import "@fontsource/be-vietnam-pro/700.css";\n/* @import "x.css"; */', "src/ui/td.css")).toEqual([{ spec: "@fontsource/be-vietnam-pro/700.css", names: [] }]);
    expect(target("src/app/input.ts", "../kit/input")).toBe("src/kit/input");
    expect(target("src/sim/world.ts", "../kit/platform/rng.ts")).toBe("src/kit/platform/rng");
    expect(target("src/app/vocab.ts", "../../../space-typing/src/logic")).toBe("../space-typing/src/logic");
  });

  it("read storage keys", () => {
    expect(storageKeys('safeLocalStorage.writeJson("typing-defense:x", 1); s.getItem(key);')).toEqual([
      { method: "writeJson", key: "typing-defense:x" },
      { method: "getItem", key: null },
    ]);
  });
});

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import { expect, it } from "vitest";

const ROOT = join(__dirname, "..");
const VIETNAMESE = /[ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝàáâãèéêìíòóôõùúýĂăĐđĨĩŨũƠơƯư\u1ea0-\u1ef9]/u;
// Proper names of unique characters keep their Vietnamese spelling (AGENTS.md, "Language, names and art
// level"; NAMES_EN.md, Wordwoven): exactly these, nothing else. The rest of each literal is still checked.
const PROPER_NAMES = ["Draconis", "Mộc Tinh", "Bà Cú Mực", "Chấm", "Phẩy", "Gạch"];
const withoutNames = (text: string): string => PROPER_NAMES.reduce((rest, name) => rest.split(name).join(""), text.normalize("NFC"));
const isVietnamese = (_file: string, text: string): boolean => VIETNAMESE.test(withoutNames(text));

function files(dir: string): string[] {
  return readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((entry) => {
    const path = dir + "/" + entry.name;
    if (path === "src/kit") return [];
    return entry.isDirectory() ? files(path) : /\.(?:[cm]?[jt]sx?|css|html)$/.test(path) ? [path] : [];
  });
}

it("keeps source literals and generated labels in English, preserving vocabulary meanings and proper names", () => {
  const problems: string[] = [];
  const check = (file: string, line: number, text: string): void => {
    if (isVietnamese(file, text)) problems.push(`${file}:${line}: ${text}`);
  };
  // No whole-file vocabulary exemptions: vi is read dynamically in app/{vocab,learn}.ts,
  // typing/decks.ts, view/words/cards.ts and ui/{hud,sheets}.ts. Their UI labels are checked.
  for (const file of [...files("src"), "index.html"]) {
    const text = readFileSync(join(ROOT, file), "utf8");
    if (/\.[cm]?[jt]sx?$/.test(file)) {
      const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
      const visit = (node: ts.Node): void => {
        if (ts.isStringLiteralLike(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) {
          check(file, source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1, node.text);
        }
        ts.forEachChild(node, visit);
      };
      visit(source);
    } else {
      const code = text.replace(file.endsWith(".css") ? /\/\*[\s\S]*?\*\//g : /<!--[\s\S]*?-->/g, (comment) => comment.replace(/[^\n]/g, " "));
      if (file.endsWith(".css")) {
        for (const match of code.matchAll(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g)) {
          const decoded = match[0].replace(/\\([\da-f]{1,6})\s?/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)));
          check(file, code.slice(0, match.index).split("\n").length, decoded);
        }
      } else code.split("\n").forEach((line, index) => check(file, index + 1, line));
    }
  }
  expect(problems, "Vietnamese UI literals (vocabulary vi and proper names remain allowed)").toEqual([]);
});

it("lets only the listed proper names through", () => {
  for (const ok of ["Mộc Tinh is awake", "Upgrade Fort to free Chấm", "Bà Cú Mực, Phẩy and Gạch", "Draconis"]) expect(isVietnamese("src/ui/hud.ts", ok), ok).toBe(false);
  for (const bad of ["Mộc Tinh choáng", "Chậm", "Mộc", "Bà Cú", "Gạch đá", "Bắt đầu"]) expect(isVietnamese("src/ui/hud.ts", bad), bad).toBe(true);
  expect(isVietnamese("src/ui/title.ts", '<span class="tt-seal" aria-hidden="true">Văn<br>Điền</span>')).toBe(true);
});


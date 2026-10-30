import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const walk = (p: string): string[] => readdirSync(p, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(p + "/" + e.name) : [p + "/" + e.name]);
// Only the explicitly deferred art replacements. Comments count too; a removed entry must fail.
export const pending = [
  { file: "src/view/words/cards.ts", chars: ["🏹", "🔨", "🌾", "🪓", "⛏️", "📖", "🔥", "✋", "⚓", "🛡️"], ticket: 133 },
  { file: "src/view/words/cards.ts", chars: ["●", "○"], ticket: 172 },
  { file: "src/view/debug-2d.ts", chars: ["⛏️", "🌾", "🪓", "🔨", "✋", "⚓", "🛡️"], ticket: 133 },
];
describe("203 emoji audit including comments", () => {
  it("finds only pending 133/172 symbols, with no stale allowlist entries", () => {
    const files = [...walk("src/view/words"), ...walk("src/ui"), "src/view/debug-2d.ts"].filter(p => /\.(ts|css)$/.test(p));
    const found = files.flatMap(file => [...readFileSync(file, "utf8").matchAll(/\p{Emoji_Presentation}|\p{Extended_Pictographic}️|[●○]/gu)].map(m => ({ file, char: m[0] })));
    for (const hit of found) expect(pending.some(p => p.file === hit.file && p.chars.includes(hit.char)), JSON.stringify(hit)).toBe(true);
    for (const p of pending) for (const char of p.chars) expect(found.some(h => h.file === p.file && h.char === char), `stale ${p.file} ${char} #${p.ticket}`).toBe(true);
    expect(found.length).toBe(23);
  });
});

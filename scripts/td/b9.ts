/**
 * B9 for the owner's play-test (docs/td/BUILD_1B.md §22, docs/td/PLAYTEST_1B.md; BALANCE.md §7): each file "Chép số chơi
 * thử" saved is replayed on Node to the page's hash, then graded against the bot with the same measured profile over
 * --seeds seeds (tests/td/b9.ts). Prints Markdown; exits 1 when a replay differs or B9 fails.
 *   node --import tsx scripts/td/b9.ts ~/Downloads/loi-goi-choi-thu-*.json [--seeds=40]
 */
import { basename } from "node:path";
import { b9Report, b9Row, readFile } from "../../tests/td/b9";

const files = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const seeds = Number(process.argv.find((a) => a.startsWith("--seeds="))?.split("=")[1] ?? 40);
if (files.length === 0) {
  console.error("usage: node --import tsx scripts/td/b9.ts <loi-goi-choi-thu-….json>… [--seeds=40]");
  process.exit(2);
}
console.log(`## B9: chơi thử của chủ dự án so với bot cùng hồ sơ (${seeds} seed mỗi ván, ải truyện bản đồ 1)\n`);
const rows = files.map((file) => b9Row(basename(file), readFile(file), seeds));
const gate = b9Report(rows, (text) => console.log(text));
if (gate.status !== "pass" || rows.some((r) => r.replay !== null && !r.replay.match)) process.exitCode = 1;

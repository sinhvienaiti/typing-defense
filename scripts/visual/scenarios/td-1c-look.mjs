// 1C look check (docs/games/ART_DIRECTION_2026-10-28.md §2.3–§2.7): the sandbox's preset houses at level 2 under the
// day light, HUD hidden, from the default camera (F1: 55° at 58 m) and from F2 (40° at 30 m), at ?q=high. TAG names the
// pictures (before/after a light change). Prints the grass and road colour of fixed screen boxes for §2.3's numbers.
//   TAG=after URL=http://127.0.0.1:4150/ OUT_DIR=tmp/lane-l/look node src/kit/tools/cdp-run.mjs scripts/visual/scenarios/td-1c-look.mjs --width=1920 --height=1080
import { DEV_URL, gesture, out } from "./common.mjs";

const td = (code) => "(() => { const t = window.__td; if (!t) return null; " + code + " })()";
export default async function (page) {
  const tag = process.env.TAG ?? "now";
  const size = page.width + "x" + page.height;
  const send = (body) => page.eval(td(`return t.send(${JSON.stringify(body)});`));
  const key = async (code, wait = 1300) => {
    await page.send("Input.dispatchKeyEvent", { type: "keyDown", key: code, code });
    await page.send("Input.dispatchKeyEvent", { type: "keyUp", key: code, code });
    await page.sleep(wait);
  };
  await page.goto(DEV_URL.replace(/\/$/, "") + "/?sandbox=1&title=0&q=high", { settle: 300 });
  await gesture(page);
  for (let i = 0; i < 80 && (await page.eval(td("return t.ready();"))) !== true; i += 1) await page.sleep(250);
  await key("Escape", 300);
  await send({ t: "sandbox", op: { op: "preset" } });
  for (let i = 0; i < 120; i += 1) {
    const b = (await page.eval(td("return t.state().buildings;"))) ?? [];
    if (b.length >= 6 && b.every((x) => x.ready)) {
      for (const x of b) if (x.def !== "keep") await send({ t: "sandbox", op: { op: "level", building: x.id, value: 2 } });
      await send({ t: "sandbox", op: { op: "keepLevel", value: 2 } });
      break;
    }
    await page.sleep(250);
  }
  await page.sleep(3500);
  await page.eval(`document.querySelectorAll("#tdHud, #tdWords").forEach((e) => (e.style.visibility = "hidden"))`);
  const shots = [];
  await key("F1");
  shots.push(await page.shot(out(`td-1c-look-${size}-${tag}-default.png`)));
  await key("F2");
  shots.push(await page.shot(out(`td-1c-look-${size}-${tag}-near.png`)));
  const pass = page.exceptions.length === 0 && page.logs.filter((l) => l.startsWith("error")).length === 0;
  if (!pass) process.exitCode = 1;
  return { pass, shots, logs: page.logs.slice(0, 4), exceptions: page.exceptions.slice(0, 2) };
}

// Lời Gọi, balance step 4 (docs/games/BALANCE.md §2, §4, §9.2): the typing profile, the pace setting and a night
// at Thư giãn and at Thử thách, pictured (td-balance-<name>-<size>.png):
//   profile        the title's "Hồ sơ gõ": a profile measured at 45 WPM, 91 %, CV 0.30 (stored under typing-defense.skill)
//   profile-new    the same card with nothing measured yet (the defaults, said so)
//   settings-on    the settings card on "Nhịp tự điều theo cách bạn gõ: Bật"   settings-off  the same row switched off
//   night-relax    a night at Thư giãn (the preset village, the hero at the merge, power words typed)
//   night-challenge  the same night at Thử thách
// Checks: the card shows the profile's numbers and its advice line; ← → switch the pace row and td.settings keeps it;
// the run started from the title takes the profile's header (E 45, k from it, the director on; the card's k is the run's)
// and the sandbox panel shows it; both nights run with the director on, their logs replay on Node to the page's hash; no console error.
// R2 review fix 3 (F4): the card's chunk is fetched only when "Hồ sơ gõ" is picked, not with the title.
//   OUT_DIR=… node src/kit/tools/cdp-run.mjs scripts/visual/scenarios/td-balance.mjs --width=1280 --height=720
import { DEV_URL } from "./common.mjs";
import { KIND, boot, consoleChecks, finish, out, replayOnNode, sandbox, send, sizeOf, state, td, typeFor } from "./td-1a6-common.mjs";

const NAV = { ArrowUp: ["ArrowUp", 38], ArrowDown: ["ArrowDown", 40], ArrowLeft: ["ArrowLeft", 37], ArrowRight: ["ArrowRight", 39], Enter: ["Enter", 13], Escape: ["Escape", 27], Digit5: ["5", 53], Digit1: ["1", 49] };

async function nav(page, code, pause = 150) {
  const [name, vk] = NAV[code];
  await page.send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: name, code, windowsVirtualKeyCode: vk });
  await page.send("Input.dispatchKeyEvent", { type: "keyUp", key: name, code, windowsVirtualKeyCode: vk });
  await page.sleep(pause);
}

/** A profile measured at 45 WPM, 91 %, CV 0.30, new words seen in 1.4 s, six days and nights: made by the kit in the page. */
const SEED_PROFILE = `(async () => {
  const kit = await import("/src/kit/balance/index.ts");
  let p = kit.newSkillProfile("adult", "balanced");
  for (let k = 0; k < 6; k += 1) p = kit.updateSkill(p, { outcome: "won", words: 40, wpm: 45, keys: 220, correctKeys: 200, cv: 0.3, byFamiliarity: { new: { words: 30, recognize: 1.4 } }, safety: 0.6, idle: 0.05 }).profile;
  localStorage.setItem("typing-defense.skill", kit.serializeSkill(p));
  return true;
})()`;

/** The page has fetched the Hồ sơ gõ card's module (the dev server's /src path, or a built chunk). */
const PROFILE_FETCHED = `performance.getEntriesByType("resource").some((e) => /\\/src\\/ui\\/profile\\.ts|\\/assets\\/profile-/.test(e.name))`;
const CARD = `(() => { const c = document.querySelector(".td-profile"); return c && !c.hidden ? { text: c.textContent, advice: c.querySelector(".td-profile-advice")?.textContent ?? "" } : null; })()`;
const PACE_ROW = `(() => { const r = document.querySelector('.td-set-row[data-key="pace"]'); return r ? { text: r.textContent, focus: r.classList.contains("is-focus"), on: r.querySelector(".td-set-switch")?.classList.contains("is-on") === true } : null; })()`;

export default async function (page) {
  const size = sizeOf(page);
  const base = DEV_URL.replace(/\/$/, "");
  const shots = [];
  const shot = async (name) => shots.push(await page.shot(out("td-balance-" + name + "-" + size + ".png")));
  const shown = {};

  // A fresh profile first: the card says nothing is measured yet.
  await page.send("Page.addScriptToEvaluateOnNewDocument", { source: "try { if (!sessionStorage.getItem('td-balance')) { localStorage.removeItem('typing-defense.skill'); localStorage.removeItem('td.settings'); sessionStorage.setItem('td-balance', '1'); } } catch {}" });
  await page.goto(base + "/", { settle: 300 });
  await page.eval("document.fonts.ready.then(() => true)");
  await page.sleep(2500);
  const fetchedBefore = await page.eval(PROFILE_FETCHED);
  await nav(page, "Digit5", 400);
  const fresh = await page.eval(CARD);
  shown.profileLoadsWhenPicked = fetchedBefore === false && (await page.eval(PROFILE_FETCHED)) === true && fresh !== null;
  await shot("profile-new");
  shown.profileNew = fresh !== null && /Chưa đo/.test(fresh.text) && /35 WPM/.test(fresh.text) && /×1,00/.test(fresh.text);
  await nav(page, "Escape", 300);

  // A measured profile, then the title again.
  await page.eval(SEED_PROFILE);
  await page.goto(base + "/", { settle: 300 });
  await page.eval("document.fonts.ready.then(() => true)");
  await page.sleep(2500);
  await nav(page, "Digit5", 400);
  const card = await page.eval(CARD);
  await shot("profile");
  // The card's pace k, checked against the run header below (R3: E 45–64 deal 4–8 letter words, so this profile's k
  // is 0.958, under 1; a fixed "×1,0x" broke with the length table).
  const cardK = card?.text.match(/×(\d,\d\d)/)?.[1] ?? null;
  shown.profile = card !== null && /Hồ sơ gõ/.test(card.text) && /45 WPM/.test(card.text) && /91 %/.test(card.text) && /1,4 s/.test(card.text) && cardK !== null;
  shown.advice = card !== null && /chậm lại một nhịp/.test(card.advice);
  await nav(page, "Escape", 300);
  shown.profileCloses = (await page.eval(CARD)) === null;

  // Settings: the pace row, on by default; ← switches it off and td.settings keeps it; → back on.
  const focusOf = () => page.eval(`document.querySelector(".tt-entry.is-focus")?.dataset.entry ?? null`);
  for (let k = 0; k < 6 && (await focusOf()) !== "settings"; k += 1) await nav(page, "ArrowDown");
  await nav(page, "Enter", 300);
  for (let k = 0; k < 3; k += 1) await nav(page, "ArrowDown");
  const on = await page.eval(PACE_ROW);
  await shot("settings-on");
  await nav(page, "ArrowLeft", 250);
  const off = await page.eval(PACE_ROW);
  const stored = await page.eval(`(() => { try { return JSON.parse(localStorage.getItem("td.settings")); } catch { return null; } })()`);
  await shot("settings-off");
  await nav(page, "ArrowRight", 250);
  const back = await page.eval(PACE_ROW);
  shown.paceRow = on?.focus === true && on.on === true && /Nhịp tự điều theo cách bạn gõ/.test(on.text) && /Bật/.test(on.text) && off?.on === false && /Tắt/.test(off.text) && stored?.pace === false && back?.on === true;
  await nav(page, "Escape", 300);

  // Bắt đầu: the run takes the profile's header.
  await nav(page, "Digit1", 800);
  const flags = await page.eval(td("return t.flags();"));
  const runK = typeof flags?.pace?.k === "number" ? flags.pace.k.toFixed(2).replace(".", ",") : null;
  shown.header = flags?.expected === 45 && flags?.pace?.director === true && flags.pace.k > 0.9 && flags.pace.k < 1.1;
  shown.profileKIsTheRunK = runK !== null && cardK === runK;

  // A night at Thư giãn, then at Thử thách: the preset village, the hero by the merge, power words typed.
  const nights = {};
  for (const mode of ["relax", "challenge"]) {
    const ready = await boot(page);
    await sandbox(page, "preset");
    await sandbox(page, "mode", mode);
    await send(page, { t: "move", agent: 0, qx: 0, qz: 52 });
    await page.sleep(1500);
    await sandbox(page, "night");
    await sandbox(page, "night"); // two waves at once: a busy night for the picture
    // The foes walk in from the gate (~20 s), then power calls light at the merge: type them; the picture mid-night.
    let typed = 0;
    let pictured = false;
    for (const t0 = Date.now(); Date.now() - t0 < 60000 && !(pictured && typed >= 20); ) {
      typed += (await typeFor(page, 1000, { wpm: 45, kinds: Date.now() - t0 < 40000 ? [KIND.power] : null })).keys;
      const now = await state(page);
      if (!pictured && now.phase === "night" && Date.now() - t0 > 20000 && now.enemies >= 4) {
        await shot("night-" + mode);
        pictured = true;
      }
    }
    if (!pictured) await shot("night-" + mode);
    const s = await state(page);
    const panel = (await page.eval(`document.querySelector(".td-sandbox")?.textContent ?? ""`)) ?? "";
    const replay = await replayOnNode(page, "td-balance-" + mode);
    nights[mode] = { ready, phase: s.phase, mode: s.mode, enemies: s.enemies, lives: s.lives, typed, panel: panel.replace(/^.*Nhịp/, "Nhịp"), replay: replay.match };
    shown["night" + mode[0].toUpperCase() + mode.slice(1)] = ready && s.mode === mode && typed > 0 && panel.includes(`k ×${runK} · tự điều Bật`) && replay.match === true;
  }

  const checks = { ...Object.fromEntries(Object.entries(shown).map(([name, value]) => [name, value === true])), ...consoleChecks(page) };
  return finish(page, checks, { fresh, card, on, off, stored, flags, nights, shots });
}

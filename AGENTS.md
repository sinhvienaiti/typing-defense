# Agent guidance: Lời Gọi (Typing Defense)

Lời Gọi (EN "Wordwoven", id `typing-defense`) is a village defense helped by
typing: villagers and towers call for help, the player types the words on
their cards, and the village holds the night. It is a top-down 2D game
(Canvas 2D, WebAudio; no media in Git, one optional title painting). Since 1B
R1 the title's "Bắt đầu" plays the story of map 1 "Đồng Cỏ Thác Bạc" (5 days,
5 nights, unlock days, Mộc Tinh at the end of night 5); `?sandbox=1` opens
the sandbox. It was split out of Space Typing (`src/td`) on 23/10/2026 at tag
`td-1a6-final`; history before the split is kept.

It runs at `http://127.0.0.1:3006` (`pnpm dev`) and, through the parent repo's
nginx, at `https://td.typing-game.local`. It is a submodule of the
`typing-game` parent repo.

## Design docs

- `docs/td/TYPING_DEFENSE_DESIGN.md` (TK): the full design.
- `docs/td/BUILD_NOW.md` (1A), `docs/td/BUILD_1A6.md` (1A.6), `docs/td/BUILD_NOTES.md`
  (milestone, line budget), `docs/td/CALLS_V3_1_PLAN.md`.
- `docs/td/BUILD_1B.md` (1B, written after the split, so its paths are current):
  map 1 as a 5-night stage, the Mộc Tinh boss peak, rounds R1/R2/R3, line
  ceiling 10,500, balance targets and gates.
- **State (25/10/2026):** 1B R1 built, reviewed and fixed (`BUILD_NOTES.md` §7.1,
  §7.2); 1B R2 built (§7.3: Tối Thượng, Chữ Chiêu, Mảnh Chữ, Ngắt on Lửng Tanuki,
  Nuppeppō, Thư Đồng's panic, R2's 2D layers, design call (b) applied) and **reviewed
  and fixed** (§7.4): G5 graded for every bot (Tối Thượng 25 → 21), G6 counted by
  the direct calls made (Tanuki needs 4 others), the balance lever chosen and
  measured (`PACE.speedK` 0.2 → 0.3 and the boss cap 1.46: đề xuất của vòng này,
  chờ chủ dự án xác nhận; option (a) of §7.2 measured, no effect on Ẩu; the tight
  Biên S read on the standard bot: đã chọn theo đề xuất), the start chunk 77.2 kB
  gzip (≤ 85 kB, `pnpm build` checks it). After the fix B3 passes both sets, the
  pooled tight targets pass for 4/6 bots (as R1); still missing: B1 (Ẩu both sets,
  Chậm chắc set 2) and G3 on set 2 (44.7 s); the numbers and the next levers are in §7.4. Next: R3 "Học và dạy"; the owner's playtest of map 1 at
  1280 × 720 (`BUILD_1B.md` §22, B9 numbers) stays open.
- `docs/art-requests/td/`: asset prompt pack (text only).
- `docs/changelog/`: one Vietnamese entry per update.

The docs predate the split. Read their paths as: `src/td/` → `src/`,
`td.html` → `index.html`, `src/platform/*`, `src/scene3d/keys`, `src/logic`,
`src/vocabulary` → `src/kit/`, `/assets/td/` → `/assets/typing-defense/`,
`scripts/visual/cdp-run.mjs` → `src/kit/tools/cdp-run.mjs`.

## Layout

- `src/sim`, `src/typing`, `src/content`: deterministic rules (no clock, no
  host globals, seeded RNG from `src/kit/platform/rng`).
- `src/app`, `src/view`, `src/ui`: page, input, 2D view, HUD.
- Theme Miền Văn Điền (SPLIT_PLAN D7): every UI colour, font and paper
  texture is a token in `src/ui/theme.css`; the 2D map's palette mirrors it
  (`src/view/debug-2d.ts` COLOR). Title screen `src/ui/title.ts` (painted in
  SVG; the optional backdrop `/assets/typing-defense/ui/title-dusk.webp` is
  not in Git), settings `src/ui/settings.ts` (`td.settings`), pause and
  results cards `src/ui/sheets.ts`. Sound and music are synthesized:
  `src/view/folk.ts`, `audio-min.ts`, `music.ts`; the list of real files to
  make is `docs/audio/THEME_SOUND_LIST.md`.
- The title shows at `/`; a link with `?sandbox=` (the scenarios) skips it,
  `?title=1` / `?title=0` force it. `?learn=1` starts in Học (the mode is set at
  tick 0 and travels in `flags().mode` and the replay files).
- 1B (`docs/td/BUILD_1B.md`): the boss peak is `src/sim/systems/boss.ts` (state
  in `src/sim/stores/boss.ts`, hashed), stage data (`stage`, `boss`) in
  `src/content/slice-1a.ts`; its 2D layers `src/view/boss-2d.ts` (particles from the
  fixed pool in `src/view/fx-2d.ts`), the boss bar
  and banner `BossBanner` in `src/ui/hud.ts`, the tutorial rows `src/ui/tips.ts`,
  the results card with stars, hint and "Chơi lại Ngày n" in `src/ui/sheets.ts`
  (the page reloads and replays its log to that day, checking the hash kept by
  `src/app/session.ts`; `__td.retry()` gives the replay's end: day, tick, hash,
  matched). Bots play the story (`sandbox: false`); boss-peak
  policies `tests/td/policies/boss.ts`, the probe `tests/td/boss-probe.ts`.
- 1B R1 review: Dồn lửa calls light outside help rings, round(E / 20) words;
  a power word typed soon after it showed brings the tower's next call sooner
  (`POWER.quick`, `quickS`); wood sells 10 for 4 gold (`sellWood`, the Bastion's
  card); the boss's hit points take a two-way k factor with a square term and a
  factor per mode (`boss.kHp`, `kHp2`, `modeHp`).
- 1B R2 (`BUILD_1B.md` §8–§10): Tối Thượng `src/sim/systems/ult.ts` (store
  `src/sim/stores/ult.ts`, the `ult` command, key `=`, the app's spot `ultSpot`;
  Chữ Chiêu is call kind `ult`), direct calls and Ngắt `src/sim/systems/direct.ts`
  (call kind `direct`, its enemy in the call's `foe`; a Tanuki drums only within
  `ability.reachM` of an attack building's rim), Nuppeppō's split in
  `deaths.ts`, Thư Đồng's panic `panicNear` in `agents.ts`; numbers `ULT`,
  `SHARDS`, `DIRECT`, `PANIC` in `rules.ts`, Tanuki and Nuppeppō in
  `slice-1a.ts`. Their 2D layers: `FxView` in `src/view/fx-2d.ts` (portrait,
  feather shadows, embers, heal ring; the particle pool's stones and rootlets of the
  boss's rise); the charge ring on Draconis' lantern
  (`team-bar.ts`), the action button (`hud.ts`). Sandbox ops `spawn`, `ult`.
  Bot habits `tests/td/policies/ult.ts` (`ultRule`, `dodgeRoots`).
- Chunks (BUILD_1B §20, R2 review): `vite.config.ts` keeps what the game needs to
  start as one chunk; the title (`ui/title.ts`), the settings card (`ui/settings.ts`,
  the stored settings in `app/prefs.ts`), Hồ sơ gõ (`ui/profile.ts`), the pause and
  results cards (`ui/sheets.ts`), the sandbox panel (`app/sandbox.ts`) and sound
  (`view/audio-min.ts`, `folk.ts`, `music.ts`) load by `import()` in `main.ts`;
  `__td.ready()` waits for the ones the page wants. `scripts/bundle-budget.mjs`
  (run by `pnpm build`) fails the build when the start chunk passes 85 kB gzip.
- Balance (parent `docs/games/BALANCE.md` §9.2; `docs/td/BUILD_NOTES.md` §6): the typing profile
  `src/app/skill.ts` (kit key `typing-defense.skill`, folded after each day and night) gives the run header
  (E, pace k, the director on by "Nhịp tự điều" in `td.settings`); `src/sim/systems/pace.ts` runs the flow
  meters and the pace directors inside the sim (hashed, `pace` events); "Hồ sơ gõ" is `src/ui/profile.ts`.
  A replay needs the header: `flags()` and the replay files carry `expected` and `pace`.
- `src/kit/`: shared kit copied from the parent repo's `shared/game-kit` (modules in `kit.config.json`, `balance` included).
- `tests/`: Vitest; `tests/td/` helpers, bots, golden; `tests/golden/td-1a.json`
  (the sandbox bot, 3 nights) and `tests/golden/td-1b-boss.json` (the sandbox
  preset, Mộc Tinh called on day 1, until it retreats).
- `scripts/td/`: balance report (its worker threads start through `tsx-worker.mjs`:
  tsx's hooks do not reach workers on Node 24.11), golden update, Node replay.
- `scripts/visual/scenarios/td-*.mjs`: browser scenarios (CDP).

## Commands

```bash
pnpm install
pnpm dev                 # 127.0.0.1:3006
pnpm test                # vitest run
pnpm build               # tsc --noEmit && vite build && the start chunk's gzip ≤ 85 kB (scripts/bundle-budget.mjs)
pnpm check               # kit sha256 check, tests, build
pnpm td:balance          # bot balance report (Markdown): BALANCE §3 matrix + B1–B9 per seed set, the boss table,
                         #   the split table, R2's table (Tối Thượng, direct words and calls, typing by night; G2, G5 for
                         #   every bot, G6 by the direct calls made), the pooled tight targets (BUILD_1B §6.4, §18.2) with
                         #   B1–B9 pooled (win 78–88 % every bot, Biên S 40–60 % the standard bot, the others BALANCE §3's;
                         #   the BALANCE §3 verdict after), then the BUILD_1A6 §12 table
                         #   options: --stage-seeds=120 --stage-sets=2 --threads=6 --seeds=5 --nights=4 (§12 runs)
                         #   probes: --modes=balanced --bots=standard,fast --quick (no profiles, no §12 report)
                         #   --set=slice.enemies.3.hp=4300 --set=POWER.quick=0.8 … (numbers overridden in every worker, printed on top)
node --import tsx scripts/td/boss-tune.ts --hp=2900 --seeds=40 --bots=standard,fast  # quick boss probe (numbers overridable: --khp2, --modehp, --quick, --woodgold, --tl, …)
node --import tsx scripts/td/retry-log.ts --seed=7 --day=5 --mode=relax --out=tmp/retry.json  # a long bot run kept as "Chơi lại Ngày n" keeps it (td-1b-night5 uses it)
pnpm td:golden:check     # golden runs must match tests/golden/td-1a.json and td-1b-boss.json
pnpm td:golden:update    # remake both goldens after an intended change
OUT_DIR=tmp/visual node src/kit/tools/cdp-run.mjs scripts/visual/scenarios/td-1a6-day.mjs --width=1280 --height=720
OUT_DIR=tmp/visual node src/kit/tools/cdp-run.mjs scripts/visual/scenarios/td-theme.mjs --width=1280 --height=720  # title, settings, pause, results
OUT_DIR=tmp/visual node src/kit/tools/cdp-run.mjs scripts/visual/scenarios/td-balance.mjs --width=1280 --height=720  # Hồ sơ gõ, pace setting, nights
# 1B R1 (dev server: pnpm exec vite --host 127.0.0.1 --port 3046 --strictPort; URL=http://127.0.0.1:3046/):
URL=http://127.0.0.1:3046/ OUT_DIR=tmp/visual node src/kit/tools/cdp-run.mjs scripts/visual/scenarios/td-1b-boss.mjs --width=1280 --height=720    # boss peak, frame sets
URL=http://127.0.0.1:3046/ OUT_DIR=tmp/visual node src/kit/tools/cdp-run.mjs scripts/visual/scenarios/td-1b-night5.mjs --width=1280 --height=720  # day 5 warning, blows, Chơi lại Ngày 5
URL=http://127.0.0.1:3046/ OUT_DIR=tmp/visual node src/kit/tools/cdp-run.mjs scripts/visual/scenarios/td-1b-build.mjs --width=1280 --height=720   # story locks and a story card, sell, Bastion
URL=http://127.0.0.1:3046/ OUT_DIR=tmp/visual node src/kit/tools/cdp-run.mjs scripts/visual/scenarios/td-1b-perf.mjs --width=1280 --height=720    # boss + flood(300, topped up) + Tối Thượng ×2
# 1B R2:
URL=http://127.0.0.1:3046/ OUT_DIR=tmp/visual node src/kit/tools/cdp-run.mjs scripts/visual/scenarios/td-1b-ult.mjs --width=1280 --height=720     # =, feathers, Chữ Chiêu typed / left alone
URL=http://127.0.0.1:3046/ OUT_DIR=tmp/visual node src/kit/tools/cdp-run.mjs scripts/visual/scenarios/td-1b-direct.mjs --width=1280 --height=720  # Tanuki: Ngắt typed, let run (heal), ≤ 2 cards
# Perf numbers need a Chrome with a GPU (Chrome in WSL draws in software): on the Dell, Windows node + Windows Chrome,
# then the pages' logs replayed in WSL (scripts/td/replay.ts), as in BUILD_NOTES §7.2.
```

The dev server serves `/vocabulary/` and `/typing-texts/` read-only from the
parent repo's `shared/` (kit plugin in `vite.config.ts`).

## Hard rules

- **No media in Git**: no images, audio, video, `.glb`, `.bin` or other
  binaries. Media lives under `public/assets/typing-defense/` (ignored) and
  goes through the parent repo's `pnpm media:push`.
- **Never edit `src/kit/` by hand.** Change `shared/game-kit` in the parent repo,
  then run `node scripts/sync-game-kit.mjs --target games/typing-defense` there.
  `node src/kit/verify-kit.mjs` (part of `pnpm check`) fails on any hand edit.
- `tests/boundary.test.ts` must stay green: `src` imports only `src/**`,
  `three`, `three/examples/jsm/*`, `@fontsource/*`; nothing from Space Typing.
- Learning events use `gameId` `typing-defense` (`src/app/learning.ts`).
- Golden hashes change only on purpose (`pnpm td:golden:update`, noted in the changelog).
- Code comments in English, short. Docs and changelog in Vietnamese.

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
- **State (24/10/2026):** 1B R1 built, reviewed and fixed (`BUILD_NOTES.md` §7.1,
  §7.2, with the fix's own minor review at its end). R1's done-line (`BUILD_1B.md`
  §17) is not met yet: B1 set 1 (Chậm chắc 92 %, Ẩu 73 %), B7 set 1 (91 %), and
  on the pooled sets the tight band of §18.3 for B1 (Chậm chắc 90 %, S 65 %;
  Ẩu 76 %) and B7 (89 %) miss; §7.2 says why. Design call: đã chọn theo đề xuất
  (b), làm ở R2 (raise Bắn mạnh nối while making Nights 1–4 harder, then measure
  again). Next: the owner plays map 1 at 1280 × 720 (`BUILD_1B.md` §17
  done-line, §22, B9 numbers), then R2 starting with (b).
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
pnpm build               # tsc --noEmit && vite build
pnpm check               # kit sha256 check, tests, build
pnpm td:balance          # bot balance report (Markdown): BALANCE §3 matrix + B1–B9 per seed set, the boss table,
                         #   the split table, the pooled tight targets (BUILD_1B §6.4, §18.2) with B1–B9 pooled
                         #   (B1, B7 on the tight band of §18.3, the BALANCE §3 verdict after), then the BUILD_1A6 §12 table
                         #   options: --stage-seeds=120 --stage-sets=2 --threads=6 --seeds=5 --nights=4 (§12 runs)
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
URL=http://127.0.0.1:3046/ OUT_DIR=tmp/visual node src/kit/tools/cdp-run.mjs scripts/visual/scenarios/td-1b-build.mjs --width=1280 --height=720   # story locks, sell, Bastion
URL=http://127.0.0.1:3046/ OUT_DIR=tmp/visual node src/kit/tools/cdp-run.mjs scripts/visual/scenarios/td-1b-perf.mjs --width=1280 --height=720    # boss + flood(300)
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

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
- `docs/td/R3_PLAN.md`: the plan of 1B R3 "Học và dạy" (work items by file, order with the
  bundle budget first, data shapes, the spec points chosen as proposed, tests, scenarios, the
  balance plan, line budget and cut order) and the pre-R3 baseline on the Apple M4.
- **State (27/10/2026):** 1B R1 built, reviewed and fixed (`BUILD_NOTES.md` §7.1,
  §7.2); 1B R2 built (§7.3: Tối Thượng, Chữ Chiêu, Mảnh Chữ, Ngắt on Lửng Tanuki,
  Nuppeppō, Thư Đồng's panic, R2's 2D layers, design call (b) applied) and **reviewed
  and fixed** (§7.4): G5 graded for every bot (Tối Thượng 25 → 21), G6 counted by
  the direct calls made (Tanuki needs 4 others), the balance lever chosen and
  measured (`PACE.speedK` 0.2 → 0.3 and the boss cap 1.46: đề xuất của vòng này,
  chờ chủ dự án xác nhận; option (a) of §7.2 measured, no effect on Ẩu; the tight
  Biên S read on the standard bot: đã chọn theo đề xuất). **Second review fix**
  (§7.5): every lever of `BUILD_1B.md` §6.5 measured on both seed sets (boss speed
  0.78, 5 Thuồng Luồng, more Mầm Gỗ with `kHp` 0.15, Thuồng Luồng 385 hp, burn 62/s,
  and `LENGTH_BY_E`); none beat the current numbers on B1 and the pooled tight
  targets, so the numbers stay (đề xuất của vòng này, chờ chủ dự án xác nhận). B1
  still fails (Ẩu both sets, Chậm chắc set 2) and G3 on set 2 (44.7 s); the next
  levers for R3's balance pass are in §7.5. `td:balance` grades G3 and G8 per set and
  pooled; lazy chunks retry and fall back (`app/chunks.ts`, `td-1b-chunks`); at `/` the
  start set is the entry and the title, 82.56 kB gzip (2.44 kB headroom; "start set"
  in place of "whole bundle" is đề xuất của vòng này); `td-1b-perf` is paced to 60 Hz
  and the main thread is at the 4 ms line there (3.9–4.6 ms at 50–57 fps on the Dell).
  **Third review fix** (§7.6, on the Mac mini M4): a failed sound or sandbox-panel chunk is
  asked again when wanted (Chrome 155 keeps a failed `import()` until the page reloads, so
  there only F5 brings it back; `td-1b-chunks` probes the browser and grades by it), the
  title's two cards load when picked (start set 82.04 kB gzip on the Mac, 2.96 kB headroom),
  `td-1b-perf` grades each rise frame by its total, an A/B on the Mac shows fix 2 did not slow
  a frame (1.027 against 1.042 ms, Apple M4), and `td-1b-build` reads every building card at
  level 3 with its real sale label. On the Apple M4 `td-1b-perf` runs at 1.0 ms a frame.
  B3 passes, the pooled tight targets 4/6. **R3 "Học và dạy" planned** (§7.7,
  `docs/td/R3_PLAN.md`): first the entry chunk (`__td`, "Chơi lại Ngày n" and "Chép số chơi
  thử" out of it frees 1.86 kB, measured on Mac builds), then Học, the teaching table, the mode
  setting and stars, the sandbox's R3 enemies, the balance pass (a boss-peak life drain, then
  `LENGTH_BY_E` with `kHp2`). Baseline on the Apple M4 (Chrome tracing at 60 Hz): the main thread
  1.32 ms a frame (game frame 0.91, commit 0.21). **R3 part A built** (steps 1–6, §7.7,
  `docs/changelog/2026-10-26-td-r3-part-a.md`): `__td` and "Chơi lại Ngày n" out of the entry chunk; Học in the sim
  (Từ Ôn, the saved book at tick 0, the study plan) and at the page (`app/learn.ts`: planned before tick 0, words seen,
  learning events every 5 s, the book kept in `typing-defense.learn`); the meaning rule and the jade Từ Ôn card; the
  teaching table (`ui/tips.ts`: Bà Cú Mực's rows top right, off the field; "làm gì" lines on building cards); the
  "Chế độ (truyện)" setting and the stars in `td.campaign`. "/" 81.25 kB gzip (3.75 kB headroom, Apple M4 build),
  10,255 lines, 322 tests. **R3 part B built** (26/10/2026, §7.7, `docs/changelog/2026-10-26-td-r3-part-b.md`): step 7 the
  sandbox's Cương Thi Đầu Đàn (Neo; its aura leads the pack) and Quỷ Núi Troll (Phá Khiên; a dome riding on it), no cut;
  step 8 the bots play Học (cold start, a 20-word book row, B8 R3 in `td:balance`); step 11 the owner's play-test pack
  (`docs/td/PLAYTEST_1B.md`: "Chép số chơi thử" saves the numbers and the whole run, `scripts/td/b9.ts` replays and grades
  B9; a sandbox run is replayed and listed, never graded); `td-1b-tour` (19 pictures). Checked again on the Mac after
  the cut-off run: the tour now presses "Chép số chơi thử" for real (the card answers `pointerdown`), `td-1b-direct`
  types Neo and Phá Khiên again on the next mechanic when a loaded machine misses the window. "/" 82.62 kB gzip
  (2.38 kB headroom, Apple M4 build), 10,413 lines (87 under the ceiling), 332 tests. With Học the standard bot wins
  75 / 78 % in Cân bằng (90 / 88 % on the same seeds without; 40 seeds a set, §7.7 part B). **The owner's wood rule**
  (26/10/2026, §7.8, `docs/changelog/2026-10-26-td-wood.md`): a tree holds 1000 wood (`TREE.reserve`, `trees.left`, hashed),
  paid a wood at a time as the chop goes (`chopTree`), falls only when empty and stands again full at each day's start
  (`regrow`, not under a building); villagers chop on by night without a call (`CALL.slipS` 1.35 keeps the 20 s window);
  the chopped tree shows "988/1000", a regrown one grows in. "Gọi đêm sớm" counts down (gold by the day's share left,
  cap 30; time left, a draining bar, a pulse and a knock in the last 10 s, "Đã dừng" while paused). The "two dragons"
  were the villagers' "D" discs read as Draconis' "D" lantern: NPC discs show their call's icon now (`td-1b-wood` counts
  one dragon and no "D" on the field every frame). "/" 83.31 kB gzip (1.69 kB headroom), 10,486 lines (14 under the
  ceiling), 337 tests. **R3 balance and gates** (26/10/2026, §7.9, `docs/changelog/2026-10-26-td-r3-balance.md`):
  27 lines back by rewrapping nine 80-column headers (no rule cut); Rễ hút sinh khí, the boss's roots take a life every
  30 s from its rise (`boss.drain`; the stagger restarts the clock; an ink-edged root to the Bastion, "−1 mạng", an amber
  pulse back to the canopy), E 45–64 words 4–8 letters, this game's pace floor 0.70 (`PACE.k`, passed to the kit's
  `paceK`), the boss's k factor 0.4 / 5.5, cap 1.42. Six measured rounds on seeds 1–240 (the gate set) and 241–480 (a
  probe set); round 6 kept nothing. Pooled tight targets 5/6: Ẩu 77 % (needs 78 %) and B4 on set 1 (Chậm chắc's Biên
  S ties Ẩu's at 60 %) still fail; G1–G8 pass (G3 47.5 s); next lever the kit's accuracy weight in `effectiveE`
  (coordinator's, three games). Thử thách is easier than Cân bằng (boss ×0.93: `modeHp.challenge` 0.78). §21 on the
  Apple M4 (27/10): gates 1–4 and 6–11 pass: 44/44 scenario runs at both sizes (`td-balance` read a fixed "×1,0x" that
  the 4–8 letter band made 0.96: fixed in `5c3b939`), §20 at 60 Hz (`td-1b-perf` main thread 1.7–2.0 ms a frame against 1.7–2.2 for `89e2494` interleaved, the
  boss layer p95 0.3 ms, the Node step at the boss peak p95 0.39 ms of 0.5: each enemy scans every Đầu Đàn aura in
  `move.ts`); gate 5 fails as above, gate 12 waits for the owner.
  "/" 83.75 kB gzip (1.25 kB headroom), 10,492 lines, 338 tests. The owner's playtest (B9 numbers) stays open.
  **Test pass of 27/10** (§7.10, `docs/changelog/2026-10-27-test-pass.md`): three testers' 43 findings merged and checked;
  fixed: word cards keep off the action (`keepOut` in `view/debug-2d.ts`, the `keep` boxes of `besidePanels`), the last
  push of crowded columns unbounded, word shots, hits, kills and keys that read, towers drawn 🏹 🧨, the results card inside
  1280 × 720, the pause card's settings, "Xem bản đồ" both ways, the loss hint read off the run, night 3's line and `=`
  refused with no enemy near (`ultNone`), Neo and Phá Khiên only inside a help ring, Tối Thượng from night 3 (`ultShut`),
  the sandbox's day and boss buttons; open: night 4 is a lull (six variants measured, each moves the stage's win rates:
  for the next balance pass), night 3's idle, the night-5 Thuồng Luồng spike, phase 2 often skipped. "/" 84.81 kB gzip
  (**0.19 kB headroom**), 10,500 lines (the ceiling; 54 got back by rewrapping comments), 346 tests.
  **Lane A1, nights and the boss** (27/10, `docs/changelog/2026-10-27-open-items.md`, §7.10): a hit on Mộc Tinh stops at the
  70 % line, and above 50 % until phase 2's first Mầm Gỗ sprout has landed (phase 2 always plays); night 5's lull clock holds
  while a heavy foe walks the roads' shared end (`heavyNear` in `sim/systems/boss.ts`; the boss bar adds "chờ quái gần Lũy");
  night 4 adds Ma Trơi 2, Cương Thi 4, Ma Trơi 2 (P 15–24 %; the decision's variant H broke gate 4), the boss's `kHp2` 7.5 and
  cap 1.49, Thử thách's boss ×0.9. Tight band 6/6 (80–86 %), B1–B8 and §12 on 5 seeds pass; on 20 seeds 5a and 5b fail as
  before. Night 3's idle (the approach: the first foe in reach 18.6 s after dusk) is not fixed: for the owner. "/" 84.99 kB
  gzip (**13 bytes headroom**), 10,500 lines, 347 tests.
  Play-tests use a build (`pnpm build && pnpm preview`), never the dev server of a tree being edited (it reloads the page).
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
- 1B R3 part A (`R3_PLAN.md`): Học in the sim `src/sim/systems/learn.ts` (store `w.learn`, the book's due ticks and
  returns in `w.typing`, hashed; the run header's `learn` lists), at the page `src/app/learn.ts` (`planFor`, `Learner`;
  key `typing-defense.learn`; the portal bridge `app/learning.ts` rides in this chunk), the meaning rule `meaningShown`
  in `view/words/cards.ts`; the teaching table `src/ui/tips.ts` (`TIPS`, `DOES`, `doesLine`) shown by `BossBanner`
  (`teachHtml`: panel `td-tip`, top right) in `ui/hud.ts`; the mode setting and the stars in `app/prefs.ts`
  (`storyMode`, `keepStars`, key `td.campaign`), `ui/settings.ts`, `ui/title.ts`, `ui/sheets.ts`.
- 1B R3 part B: the three verbs in `sim/systems/direct.ts` (`AbilitySpec` a union in `content/types.ts`, compiled with
  a `verb` index; `verbOf`, `domesUp`, `domeMul`), the leader's aura and lead (`DIRECT.leadM`) in `move.ts`, the dome on
  shots in `projectile.ts` (shots keep their launch point `ox`, `oz`), ×1.3 in `combat.ts` (`takenUntil`); their marks in
  `view/debug-2d.ts` (`lead`, the dome), outcomes in `view/fx-2d.ts`, sounds in `view/audio-min.ts`, the call's icon and name
  by verb (`callLabel` in `view/words/cards.ts`). Bots' Học: `learnStore`, `learnHeader`, `StageRun` (`timedFresh`) and the
  `standard@book20` row in `tests/td/flow.ts`. Play-test file: `playtestFile` in `app/retry.ts`; B9: `tests/td/b9.ts`.
- 1B R3 balance: Rễ hút sinh khí is `keepBlow(w, "drain")` in `sim/systems/boss.ts` (numbers `boss.drain` in `slice-1a.ts`;
  `drainAt`, `drainEnd` in the boss store, hashed), drawn in `view/boss-2d.ts`, said by `BossBanner` (`BOSS_LINES.drain`), heard in
  `view/audio-min.ts`; the pace floor is `PACE.k` in `rules.ts`.
- Chunks (BUILD_1B §20, R2 review and its second fix): `vite.config.ts` keeps what the
  game needs to start as one chunk; the title (`ui/title.ts`), the settings card
  (`ui/settings.ts`, the stored settings in `app/prefs.ts`), Hồ sơ gõ (`ui/profile.ts`),
  the pause and results cards (`ui/sheets.ts`), the sandbox panel (`app/sandbox.ts`) and
  sound (`view/audio-min.ts`, `folk.ts`, `music.ts`), and since R3 `__td` (`app/dev-tools.ts`), "Chơi lại Ngày n"
  (`app/retry.ts`), Học (`app/learn.ts`, which the run waits for at tick 0) and the teaching table (`ui/tips.ts`)
  load by `import()` in `main.ts`
  through `Chunk` (`app/chunks.ts`: 3 tries, then one console error and a fallback: the
  title is skipped, a missing pause or results card is told in the HUD; asked again after
  15 s). At `/` the page waits for the title only; Hồ sơ gõ loads when picked, the settings
  card when picked or with the cards' chunk (the pause card holds one), whichever comes
  first; sound, the cards' chunk and the sandbox panel load once the page is usable, and a
  failed one is asked again when wanted (a card shown, the panel open, the next key for
  sound; R2 review fix 3). `__td.ready()` waits for the ones the page wants (loaded or given
  up); `__td.chunks()` says which are in. `scripts/bundle-budget.mjs` (run by
  `pnpm build`) reads Vite's manifest and fails the build when a start page's set (`/`:
  the entry chunk and the title; `?title=0`: the entry and Học) passes 85 kB gzip; it prints the headroom.
  `vite.config.ts` `chunkOf` keeps in the entry chunk only what main.ts imports statically without passing a lazy module.
  `td-1b-chunks` blocks a chunk in the browser and checks the fallbacks.
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
pnpm build               # tsc --noEmit && vite build && each start page's set ≤ 85 kB gzip (scripts/bundle-budget.mjs, "/": entry + title)
pnpm check               # kit sha256 check, tests, build
pnpm td:balance          # bot balance report (Markdown): BALANCE §3 matrix + B1–B9 per seed set, the boss table with
                         #   G3 and G8, the split table, R2's table (Tối Thượng, direct words and calls, typing by night; G2,
                         #   G5 for every bot, G6 by the direct calls made), the pooled tight targets (BUILD_1B §6.4, §18.2)
                         #   with B1–B9 pooled (win 78–88 % every bot, Biên S 40–60 % the standard bot, the others BALANCE
                         #   §3's; the BALANCE §3 verdict after), the pooled boss table with G3, G8 on each set and the
                         #   pool, then the BUILD_1A6 §12 table
                         #   options: --stage-seeds=120 --stage-sets=2 --threads=6 --seeds=5 --nights=4 (§12 runs)
                         #   probes: --modes=balanced --bots=standard,fast --quick (no profiles, no §12 report)
                         #   --set=slice.enemies.3.hp=4300 --set=POWER.quick=0.8 … (numbers overridden in every worker, printed on top)
node --import tsx scripts/td/boss-tune.ts --hp=2900 --seeds=40 --bots=standard,fast  # quick boss probe (numbers overridable: --khp2, --modehp, --quick, --woodgold, --tl, …)
node --import tsx scripts/td/retry-log.ts --seed=7 --day=5 --mode=relax --out=tmp/retry.json  # a long bot run kept as "Chơi lại Ngày n" keeps it (td-1b-night5 uses it)
node --import tsx scripts/td/retry-log.ts --seed=7 --end --out=tmp/won.json  # R3: the bot's whole story kept at its end (td-1b-story: the won card, td.campaign); runs carry the bot's study lists (--book20: its 20-word book)
node --import tsx scripts/td/b9.ts ~/Downloads/loi-goi-choi-thu-*.json --seeds=40  # B9: each play-test file replayed on Node, then graded against the bot with the owner's profile (docs/td/PLAYTEST_1B.md)
pnpm td:golden:check     # golden runs must match tests/golden/td-1a.json and td-1b-boss.json
pnpm td:golden:update    # remake both goldens after an intended change
OUT_DIR=tmp/visual node src/kit/tools/cdp-run.mjs scripts/visual/scenarios/td-1a6-day.mjs --width=1280 --height=720
OUT_DIR=tmp/visual node src/kit/tools/cdp-run.mjs scripts/visual/scenarios/td-theme.mjs --width=1280 --height=720  # title, settings, pause, results
OUT_DIR=tmp/visual node src/kit/tools/cdp-run.mjs scripts/visual/scenarios/td-balance.mjs --width=1280 --height=720  # Hồ sơ gõ, pace setting, nights
# 1B R1 (dev server: pnpm exec vite --host 127.0.0.1 --port 3046 --strictPort; URL=http://127.0.0.1:3046/):
URL=http://127.0.0.1:3046/ OUT_DIR=tmp/visual node src/kit/tools/cdp-run.mjs scripts/visual/scenarios/td-1b-boss.mjs --width=1280 --height=720    # boss peak, frame sets
URL=http://127.0.0.1:3046/ OUT_DIR=tmp/visual node src/kit/tools/cdp-run.mjs scripts/visual/scenarios/td-1b-night5.mjs --width=1280 --height=720  # day 5 warning, blows, Chơi lại Ngày 5
URL=http://127.0.0.1:3046/ OUT_DIR=tmp/visual node src/kit/tools/cdp-run.mjs scripts/visual/scenarios/td-1b-build.mjs --width=1280 --height=720   # story locks and a story card, sell, Bastion, every card at level 3 (real sale labels)
URL=http://127.0.0.1:3046/ OUT_DIR=tmp/visual node src/kit/tools/cdp-run.mjs scripts/visual/scenarios/td-1b-perf.mjs --width=1280 --height=720    # boss + flood(300, topped up) + Tối Thượng ×2, frames paced to 60 Hz (PERF_HZ=0: the browser's own rate)
# 1B R2:
URL=http://127.0.0.1:3046/ OUT_DIR=tmp/visual node src/kit/tools/cdp-run.mjs scripts/visual/scenarios/td-1b-ult.mjs --width=1280 --height=720     # =, feathers, Chữ Chiêu typed / left alone
URL=http://127.0.0.1:3046/ OUT_DIR=tmp/visual node src/kit/tools/cdp-run.mjs scripts/visual/scenarios/td-1b-direct.mjs --width=1280 --height=720  # Tanuki: Ngắt typed, let run (heal), ≤ 2 cards; R3: Neo and Phá Khiên typed, a dome let run
URL=http://127.0.0.1:3046/ OUT_DIR=tmp/visual node src/kit/tools/cdp-run.mjs scripts/visual/scenarios/td-1b-chunks.mjs --width=1280 --height=720  # a chunk blocked: title skipped, pause told in the HUD; card, sandbox panel and sound asked again after the cool-down (back where the browser fetches a failed import again)
# 1B R3 (dev server on 3006, as the lane's strict port on the Mac):
URL=http://127.0.0.1:3006/ OUT_DIR=tmp/visual node src/kit/tools/cdp-run.mjs scripts/visual/scenarios/td-1b-learn.mjs --width=1280 --height=720  # meanings by the rule, Từ Ôn back and redeemed, the book across a reload, learning events
URL=http://127.0.0.1:3006/ OUT_DIR=tmp/visual node src/kit/tools/cdp-run.mjs scripts/visual/scenarios/td-1b-story.mjs --width=1280 --height=720  # the teaching table (day 1, night 1, day 3 replayed), the mode setting, the stars of a won run
URL=http://127.0.0.1:3006/ OUT_DIR=tmp/visual node src/kit/tools/cdp-run.mjs scripts/visual/scenarios/td-1b-tour.mjs --width=1280 --height=720   # the owner's 19 pictures (day 5 to the won card, the play-test file replayed, Ngắt, Neo, Phá Khiên, Từ Ôn, Bà Cú Mực); ~5 min a size
# Perf numbers need a Chrome with a GPU (Chrome in WSL draws in software): on the Dell, Windows node + Windows Chrome,
# then the pages' logs replayed in WSL (scripts/td/replay.ts), as in BUILD_NOTES §7.2. On the Mac mini M4 the macOS
# Chrome draws with the GPU: run cdp-run as above, under the parent's .local/bin/heavy.sh --gpu (BUILD_NOTES §7.6).
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

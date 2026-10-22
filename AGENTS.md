# Agent guidance: Lời Gọi (Typing Defense)

Lời Gọi (EN "Wordwoven", id `typing-defense`) is a village defense helped by
typing: villagers and towers call for help, the player types the words on
their cards, and the village holds the night. Step 1A is a top-down 2D
sandbox (Canvas 2D, WebAudio; no media in Git, one optional title painting). It was split out of Space Typing
(`src/td`) on 23/10/2026 at tag `td-1a6-final`; history before the split is
kept.

It runs at `http://127.0.0.1:3006` (`pnpm dev`) and, through the parent repo's
nginx, at `https://td.typing-game.local`. It is a submodule of the
`typing-game` parent repo.

## Design docs

- `docs/td/TYPING_DEFENSE_DESIGN.md` (TK): the full design.
- `docs/td/BUILD_NOW.md` (1A), `docs/td/BUILD_1A6.md` (1A.6), `docs/td/BUILD_NOTES.md`
  (milestone, line budget), `docs/td/CALLS_V3_1_PLAN.md`.
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
  `?title=1` / `?title=0` force it.
- `src/kit/`: shared kit copied from the parent repo's `shared/game-kit`.
- `tests/`: Vitest; `tests/td/` helpers, bots, golden; `tests/golden/td-1a.json`.
- `scripts/td/`: balance report, golden update, Node replay.
- `scripts/visual/scenarios/td-*.mjs`: browser scenarios (CDP).

## Commands

```bash
pnpm install
pnpm dev                 # 127.0.0.1:3006
pnpm test                # vitest run
pnpm build               # tsc --noEmit && vite build
pnpm check               # kit sha256 check, tests, build
pnpm td:balance          # bot balance report (Markdown)
pnpm td:golden:check     # golden run must match tests/golden/td-1a.json
pnpm td:golden:update    # remake the golden after an intended change
OUT_DIR=tmp/visual node src/kit/tools/cdp-run.mjs scripts/visual/scenarios/td-1a6-day.mjs --width=1280 --height=720
OUT_DIR=tmp/visual node src/kit/tools/cdp-run.mjs scripts/visual/scenarios/td-theme.mjs --width=1280 --height=720  # title, settings, pause, results
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

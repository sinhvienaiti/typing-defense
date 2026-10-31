# 31/10/2026 · Wordwoven · Gộp 1C (td-ui, td-scenery) vào nhánh tích hợp

Worktree `games/.wt-td-integrate`, nhánh `td-integrate`, cắt từ `a2-days` `2937654` (đã có `td-codex`). Nhánh này chỉ để gộp thử: điều phối viên gộp nó vào `a2-days` sau. Kế hoạch đọc trước: danh sách xung đột và năm quyết định của bản phân tích chỉ đọc (mục Wordwoven, khuyến nghị `td-ui`).

| Commit | Việc |
|---|---|
| `04fb94f` | Gộp `td-ui`: toàn bộ 22 commit của `td-1c` (C0–C6, StylePack Epic, C10 vòng 2–4, đường và đá viền), phiếu 200 (ảnh màn tựa và thẻ kết) và phiếu 203 phần A (năm sửa thẻ chữ), cả các sửa 232 F1–F5 của Claude. Quyết định 1–4 nằm trong lần gộp này |
| `1704313` | Gộp `td-scenery`: phiếu 199 (atlas cảnh C9, `td:scenery`, manifest) và 202 (bố cục cảnh theo seed, hàm thuần, chưa nối renderer) |
| `7144b3c` | Quyết định 5: gói khởi động về dưới 85 kB gzip |
| (commit này) | Changelog, `td-1b-chunks` đọc câu báo tiếng Anh |

Xung đột tay của `td-ui`: `AGENTS.md`, `art-src/3d/SOURCES.json`, `docs/changelog/README.md`, `index.html`, `kit.config.json`, `src/kit/kit-manifest.json`, `src/main.ts`, `src/view/audio-min.ts`. Của `td-scenery`: chỉ `package.json` (giữ `deploy:pack`, `deploy:pack:local` của `a2-days` cạnh `td:scenery`).

## 1. Âm phím: mỗi phím kêu đúng một lần

- `td-1c` (C10) đưa mọi sự kiện qua một id âm (`src/view/sound-map.ts`): mỗi `wordKey` phát `key-right` hay `key-wrong` (có tiếng tổng hợp dự phòng), cộng `key-lock`, `key-group` (chưa có tiếng). `a2-days` phát phím chỉ qua bộ Typing Feel đã chọn (`app/quick.ts`) hoặc Bamboo (`TypingAudio.key`, bus `keys`). Giữ cả hai thì nghe hai tiếng mỗi phím và Off không tắt được tiếng tổng hợp.
- Nay `eventSounds` không cho phím id nào: bỏ `key-right`, `key-wrong`, `key-lock`, `key-group` khỏi đường sự kiện, khỏi `SOUND_IDS` và khỏi `SYNTH`. `audio-min.ts` đọc `wordKey` riêng: chỉ Bamboo (khi người chơi chọn, hoặc khi Bamboo đứng thay cho bộ không phát được), như `a2-days`.
- Giữ mọi âm khác của C10 (lời gọi, chữ xong, chuỗi, Word Shot, boss, giao diện, `FileBank` cho file thật sau này). Giữ các bus của `a2-days`: `ui` theo thanh Interface, `keys` theo Master × Keyboard volume; `muted` đọc `settings.muted`.
- `docs/audio/THEME_SOUND_LIST.md`: tiếng phím không còn id trong `sound-map.ts`, không làm file. `tests/td-sound-map.test.ts`: phím không có id, không id nào bắt đầu bằng `key-`.

## 2. Phím camera 3D: Home, PageDown, PageUp

- `td-1c` gắn F1–F3 cho ba góc camera (`cam:home`, `cam:near`, `cam:overview`). Ở `a2-days`, F1 mở Settings, F2 mở Sound (pha capture, `docs/games/IN_GAME_SETTINGS.md`), nên hai góc đầu không bao giờ tới.
- Chọn: **Home** góc mặc định (55° ở 58 m), **PageDown** góc gần thấp (40° ở 30 m), **PageUp** toàn cảnh (85° ở 100 m). Lý do:
  - không phím nào gõ ra chữ, không trùng phím lệnh đang có (số, `` ` ``, Tab, Enter, Insert, `\`, Delete, Esc, Pause, F9, Space, `=`, mũi tên);
  - trình duyệt không giữ chúng: game chặn mặc định (cuộn trang). F3 là "tìm tiếp" trên Windows/Linux và Mission Control trên Mac; F4–F12 đều có việc của trình duyệt hay của máy; F5 tải lại; Tab đã là "next";
  - trên laptop Mac là fn + ←, fn + ↓, fn + ↑, ngay cạnh mũi tên dùng để kéo camera.
- Trong game chưa có dòng hướng dẫn nào nói phím camera, nên không có chữ nào phải sửa. Đổi chú thích ở `app/input.ts`, `view/view.ts`, `view/3d/camera.ts`, `view/3d/view-3d.ts`; năm kịch bản 1C (`td-1c-ground`, `-houses`, `-look`, `-road`, `-words`) bấm phím mới; `td-input` kiểm ba phím và F1, F2, F3, F5, Tab không phải phím camera.

## 3. `main.ts`: sẵn sàng và bước đầu

- `__td.ready()` chờ cả cổng âm phím (`keyboardGate`) và chunk view 3D khi trang xin 3D.
- Bước đầu của trận (`tick 0`) chờ danh sách Học, cổng âm phím và view 3D (khi xin).
- `mute` đổi `settings.muted`, báo các bảng và lưu (như `a2-days`), không đổi `audio.muted` riêng như `td-1c`.
- Bấm chuột lên bản đồ: thoát ngay khi màn tựa hay bảng Settings/Sound đang chặn, rồi mới thử khay mép 3D (`view.tray`), rồi tới lời gọi.
- Lệnh của tay (`session.orders`) vẫn chờ sau lớp phủ như `a2-days`.

## 4. Kit

- `kit.config.json` thêm `three` vào các module của `a2-days` (`audio`, `ui`, `feedback`). Đồng bộ ở repo cha (`node scripts/sync-game-kit.mjs --target games/.wt-td-integrate`, cha `fdb8bc14`): 82 file, ghi 4. `--check --target` báo OK; `verify-kit` 82/82; test `boundary` xanh.
- `index.html` giữ favicon đã nhận của phiếu 200 (không còn `data:,`) và ghi chú preconnect Typing Feel. `SOURCES.json` lấy `usedBy` của `td-ui` (model 1C dùng các bộ kit), dòng `rule` trỏ lại `games/typing-defense`.

## 5. Gói khởi động

Sau khi gộp, `/?title=0` là 85,76 kB gzip (trần 85 kB): `td-1c` thêm chừng 3,5 kB vào chunk đầu (thẻ chữ C10, bảng ảnh UI, MapView). Cắt mà không bỏ tính năng nào:

- `ui/art.ts` (bảng ảnh UI của phiếu 200) thành chunk: `main.ts` gắn logo màn nạp khi chunk về (`bindArt` đọc cả ảnh đã nạp hay đã hỏng trước đó); màn tựa và thẻ kết vẫn import nó. Bớt 0,59 kB.
- Dấu chữ từng phím của C10 (`keyStamps`, `stampStep`) sang `src/view/words/stamps.ts`, chunk xin cùng trang; `WordCards.stamper` vẽ khi chunk về; `__td.ready()` chờ nó; tải hỏng thì xin lại ở phím sau. Bớt 0,32 kB. Test `td-c10-r5` đưa `stamper` cho view của mình và đọc mã dấu ở `stamps.ts`.
- Bỏ polyfill modulepreload của Vite (`build.modulePreload.polyfill: false`): mọi trình duyệt game chạy đều tự preload module (Chrome 66, Firefox 115, Safari 17); trình duyệt cũ hơn vẫn tải chunk, chỉ không tải sớm. Bớt 0,22 kB.
- `vite.config.ts` `LAZY` có thêm `ui/art` và `view/words/stamps` (test `td-chunks`).

| Đo trên Mac | `/` | `/?title=0` | View 3D |
|---|---:|---:|---:|
| Sau khi gộp, không biến | 84,23 kB | 85,76 kB | 172,37 / 260 kB |
| Nay, không biến (`pnpm check`) | 83,96 kB | 84,63 kB (chừa 0,37) | 172,37 kB |
| Nay, biến của host chơi (`VITE_TYPING_FEEL_ORIGIN`, `VITE_PORTAL_URL`) | 83,96 kB | 84,78 kB (chừa 0,21) | 172,37 kB |

Bản build của host chơi (`build:td` của cha) nặng hơn 0,15 kB vì `VITE_PORTAL_URL` làm cầu portal trong chunk Học sống lại: chỉ với hai chunk mới (bớt 0,91 kB) nó vẫn là 85,01 kB, nên mới bỏ thêm polyfill.

## Kiểm tra

- `pnpm check`: kit 82/82, 55 file test, 638 qua và 1 bỏ qua (`td-scenery-prep` cần atlas thật, không có trong worktree), `tsc`, build, gói như bảng trên.
- `pnpm td:golden:check`: hai ván vàng `same: true` (nội dung `f2a21037`). Ván vàng không đổi, không cập nhật.
- Trần dòng: 14.001 dòng TypeScript trong `src` (trừ `src/kit`), dưới trần cứng 1C 16.500 và mốc `1C.C10` 14.500 (test `boundary`).

## Trình duyệt

Vite dev trên `127.0.0.1:3191` với `VITE_TYPING_FEEL_ORIGIN=https://feel.typing-game.local` và `VITE_PORTAL_URL=https://typing-game.local/`; Chrome headless qua `src/kit/tools/cdp-run.mjs` dưới `heavy.sh --gpu`. Ảnh `public/assets` của worktree là liên kết tới checkout chính (Git bỏ qua). Ảnh chụp ở `tmp/integrate/`; ảnh thô đã dọn (`tools/capture-prune`), giữ 14 ảnh so sánh ở `tmp/integrate/compare/` và số liệu JSON.

- **2D mặc định** (1280 × 720 và 1920 × 1080, kịch bản tạm): màn tựa có ảnh và logo; F1, F2 mở Settings, Sound ở màn tựa và trong trận, trận đứng khi bảng mở, Esc đóng; danh mục `r1` về từ host feel (34 bộ, 7 họ), bộ `bright-clack` tải OGG từ host.
  - Bộ Typing Feel: mỗi chữ (đúng, cả phím lạc) phát đúng một lần (`stats.played` +1), không tiếng Bamboo, không id `key-*` nào qua `sound-map`.
  - Bamboo: mỗi chữ đúng một tiếng tre, Typing Feel không phát.
  - Off: không tiếng nào; `td.settings` lưu `off`, tải lại vẫn im.
  - Hai chunk mới về cùng trang (`ui/art.ts`, `view/words/stamps.ts`); dấu chữ hiện 4 khung (66 ms) mỗi phím.
- **`?view=3d`** (Medium, hai cỡ): PageDown 40° ở 30 m, PageUp 85° ở 100 m, Home 55° ở 58 m; F1, F2 mở bảng mà camera đứng yên; F3 không làm gì; Shift + ← quay 15°.
- **`td-1c-words`** (`?q=high`, 1920 × 1080 và 1280 × 720): mọi cổng qua (td-words, td-hud-budget, td-scale, draw call hiệu ứng ≤ 2, một khung từ phím tới hiệu ứng, Word Shot, zoomHud ở PageDown/PageUp, khay mép: trần, lướt 0,4 s, sạch HUD).
- **Thẻ kết (203A)** qua `td-theme` ở 1280 × 720 và 1920 × 1080: mọi kiểm tra qua, có crest, banner, divider; tiêu đề trong băng (tràn 0, không thanh dấu), chữ kem trên băng, thẻ nằm trong màn hình.
- `td-1b-chunks`: chặn từng chunk vẫn lùi đúng. Kịch bản còn đọc câu báo tiếng Việt cũ (trước đợt tiếng Anh của phiếu 132) nên năm kiểm tra hỏng; nay đọc câu tiếng Anh và qua hết.

## Còn mở

- `td-1c-view`: ô `deepOpens` hỏng vì điểm giữa màn ở 3D nay là đường đất (C3, C10 đường), không còn màu cỏ mà kịch bản C1 chờ. View 3D vẫn mở đúng cỡ, chạy bước, lùi về 2D khi mất ngữ cảnh hay chặn chunk. Có từ `td-1c`, không do lần gộp này.
- 203A vẫn chờ hai giám khảo C10 chấm 8.
- Chừa 0,21 kB ở bản build của host chơi. Nếu cần thêm: phần khay mép chỉ 3D trong `cards.ts` có thể sang chunk 3D qua `CardFeel` (đo chừng 0,1 kB).
- Phím camera mới cần chủ dự án duyệt.

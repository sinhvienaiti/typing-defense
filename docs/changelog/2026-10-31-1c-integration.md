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

## 2. Phím camera 3D: Home, PageDown, End (lúc gộp là PageUp, đổi sau giám khảo, xem mục Sửa sau giám khảo)

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
- Lần đồng bộ này đổi module `three` mà view 3D chạy trên đó, so với bản của `td-1c`/`td-ui`: `src/kit/three/model-contracts.ts` (`MODEL_TIERS` = ultra, high, medium; `PackagedTier` cho hai bậc bộ đóng gói viết), `model-loader.ts` (`pickModelTier` thử bậc của chất lượng rồi bậc nhẹ hơn rồi nặng hơn: medium → high → ultra ở Medium, high → medium → ultra ở High; KTX2 bật bằng `enableKtx2`, mặc định tắt), `index.ts` (xuất các tên mới). Game chưa có model `.ultra` nào và chưa gọi `enableKtx2`, nên các lượt 3D vẫn qua; nếu sau này view 3D khác đi, xem ba file này trước.
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

## Sửa sau hai giám khảo C10 (8 và 8,5)

Hai giám khảo chấm lần gộp ở cổng 3191–3194 (`tmp/integrate/judge-c10-a`, `-b`): 22 phát hiện. Kiểm lại từng cái trên mã và ảnh, sửa mọi P1–P2 đúng và các P3 rẻ, trong commit sau changelog gộp.

### P1

- **Thẻ kết** (`ui/sheets.ts`, `ui/td.css`):
  - Lớp tối dưới thẻ: `body.has-sheet::after`, mực 55–68 % (đo ở 1280: cỏ 106 → 47, giấy HUD 245 → 92; giấy thẻ giữ 244). Có cả ở thẻ tạm dừng.
  - Lúc thẻ kết lên, lớp thẻ chữ ngoài sân ẩn (`body.has-results .td-words`), không còn "area", "view" thò ra hai bên.
  - Ba nút (Retry/Retry Day n, View map, Title screen) mặc tấm nút 160 của bảng Settings (`button.v2.alpha.png`, viền 11 × 17 px giữ tỉ lệ cắt 170 : 260), chữ kem; nút đang chọn mặc `button-active.v2.alpha.png`, chữ vàng. Không thêm ảnh mới, chỉ dùng ảnh đã có ở `public/assets/typing-defense/ui/quick-settings/`.
  - "Copy playtest data" (gói chơi thử của chủ dự án) thành link nhỏ dưới các nút, vẫn `button[data-sheet="copy"]`, vẫn tới được bằng ↑ ↓ (cuối danh sách).
  - Crest thua không còn bị làm tối (`brightness(0.75)` làm nó đục trên giấy), chỉ bớt màu.
  - Bộ bánh răng và loa (F1/F2) nằm trên lớp tối.
  - Không làm: icon cho từng dòng số (WW-58: `lives`, `gold`, `knowledge` của 166, `stat-*` của 142 chưa được nhận) và crest riêng cho thua (chưa có ảnh). Hai việc này chờ lô ảnh 204 được nhận.
- **Mũi tên khay mép** (`view/3d/words.ts` `pointers`, `view/words/tray.ts`): hai thanh đặc (tấm `SHAPE.plate`), lõi ngọc 4 px trong viền mực 8 px ở 720p (6 và 12 px ở 1080p), đục hoàn toàn, sát mép thẻ phía người gọi, ở giữa chiều cao thẻ (trước đây nằm dưới thẻ, tách rời). Cột khay mép dọc chừa 52 px mỗi bậc 720p tới mép màn để mũi tên quay 60° vẫn vừa ở 1080p. `td-1c-words` thêm ô `trayPointerReads`: đo điểm ảnh trong hộp mũi tên ở ảnh khay, phần mực (độ sáng < 0,12) và phần ngọc mỗi phần ≥ 6 %. Đo ở các lượt: 1280 mực 0,095–0,107, ngọc 0,186–0,205; 1920 mực 0,156–0,351, ngọc 0,226–0,232 (vệt 1 px trước đây dưới 0,02). Ảnh khay chụp khi hộp mũi tên đọc trước và sau khi chụp trùng nhau. Ảnh `tray-arrow` của phiếu 165 vẫn chờ nhận; khi nhận thì thay hai thanh này.

### P2

- **×N đè thẻ của nó ở 1920**: phía của ×N chọn một lần cho hộp lớn nhất của nhịp đóng dấu (×3) và giữ suốt nhịp (`comboSide(..., only)`); khi không phía nào vừa, hộp dời vẫn tránh chính thẻ của nó. `td-1c-words` ghi hộp thẻ của ×N mỗi khung (`data-own`) và thêm ô `comboClearOfCard`: 0 khung đè ở cả hai cỡ. Ở 1920 ×11 đứng bên phải thẻ "act" từ khung đầu.
- **Khay trượt nhảy một khung và bỏ bóng lại**: nguyên nhân là hai luật riêng của cột khay trong `cards.ts` áp lên điểm neo ngay khung đầu: kẹp chừa chỗ cho mũi tên (`max(x, half + 52)`) kéo cột sang phải, và luật đứng dưới bảng HUD bên cạnh thử theo x của neo (dưới bảng) chứ không theo chỗ thẻ đang đứng (cạnh bảng, nhờ độ dời tách cột) nên giật cột xuống. Nay:
  - phần chừa cho mũi tên thuộc đích của neo khay (view 3D, `anchor`), không áp lên điểm đang trượt; `cards.ts` bỏ kẹp đó;
  - luật bảng bên cạnh trong `cards.ts` thử ở chỗ cột được vẽ (x cộng độ dời tách cột của khung trước);
  - đích của cột khay dọc đã tránh bảng HUD; vào khay dọc thì xuống (lên) trong 105 ms đầu rồi mới ngang, cả hai chặng tăng tốc và giảm tốc êm, độ dời tách cột lò xo về dần;
  - không vẽ tấm tối dưới thẻ đang trượt (tấm vẽ trễ một khung nên đuôi theo như một hộp tối);
  - một lời gọi đang ở khay chỉ về sân khi neo vào trong màn 24 px (ở sát mép nó ra vào khay liên tục, thẻ nhảy lên xuống 40 px).
  - Đo trên lượt cuối (hộp DOM mỗi khung): 1920 bước lớn nhất 9–16 px; 1280 xuống êm (8–21 px một khung) rồi còn **một bước 33 px** lúc cột ngang qua mép bảng HUD trái (độ dời tách cột lò xo về trước khi chặng xuống xong, luật bảng của `cards.ts` đẩy cột xuống nốt). Trước đây là 120 px ngang và 65 px dọc trong một khung. Phần còn lại cần làm luật bảng của cột khay êm dần (làn 1C).
  - Đã thử một cách khác (bắt đầu trượt từ chỗ thẻ vẽ và bỏ độ dời cột) rồi bỏ: hai cột cùng độ cao đổi chỗ nhau 195 px ở khung đầu.
- **Chữ hoa bay ngang trước chữ của thẻ khay**: chữ của thẻ khay (từng phím và cả từ) bay ra từ ngoài mép thẻ phía người gọi, đường cong thấp, không cắt qua dòng chữ.
- **Emoji, chấm `●●○`, nhãn hạng nhỏ**: tạm thời nhãn hạng (`.td-stamp`) lên 19–24 px (chữ hoa ≥ 13 px ở 720p). Icon gọi, chấm và huy hiệu hạng vẫn chờ phiếu 133, 165, 172 được nhận rồi chạy phần B của 203. Chưa làm.
- **`trayGlide` lúc qua lúc hỏng ở 1920**: bấm khay nay thử hộp sống của thẻ khay vẽ khung trước (`WordFeel.trayHit`, chừa 6 px), kể cả lúc thẻ đang trượt; `td-1c-words` đọc lại hộp thẻ khi nó đứng yên ngay trước khi bấm và ghi hộp cùng phần tử dưới điểm bấm. Ở 1920 đúng cấu hình đã hỏng (hai thẻ mép dưới, camera ở (0, −9,9)): lướt 23,3 m trong 430 ms, dưới điểm bấm là canvas 3D; các lượt sau đều lướt (lượt cuối 1920: 49,9 m trong 407 ms, 1280: 41,8 m trong 429 ms).
- **Word Shot**: vệt chữ là chính từ đó theo thứ tự đọc trên màn (chữ cuối sát đầu đạn khi bay sang phải, chữ đầu khi bay sang trái), mỗi chữ cách một ô, hiện khi đầu đạn đi đủ xa; một loạt bắn chỉ một viên mang chữ (ba viên cùng chữ chồng thành "EAMMM" sát tháp). Chớp R hạ thấp hơn khi thẻ che (thân dưới mép thẻ: 0,8 bán kính, tối đa 1,6), không còn mất một phần ba trên. Không làm: thời gian bay 350 ms là tốc độ đạn của sim; đổi thì đổi ván vàng và cân bằng, để chủ dự án và làn 1C quyết.
- **PageUp trùng nâng cấp ở TK §8.3**: góc toàn cảnh sang **End** (Home, PageDown, End; fn + ←, ↓, → trên laptop Mac). PageUp để dành cho "Nâng cấp nhà đang tô" như thiết kế. Sửa TK §8.3, TK 23.6, `BUILD_1C_MAP1.md` C2, `AGENTS.md`, chú thích mã, `td-1c-ground`, `td-1c-words`, test `td-input` (PageUp không phải phím camera) và `td-3d-camera`. Bộ phím vẫn chờ chủ dự án duyệt.
- **`td-1c-view` đỏ**: `deepOpens` đọc lưới 3 × 3 trên sân, cần ít nhất 3 điểm cỏ (giữa màn nay là đường đất). Qua ở 1280 và 1920.
- **Resume khó đọc trong bảng Settings** (`ui/quick.css`): chữ vàng `--vd-quick-accent` trên tấm nút tối (cùng cách của nhánh slider `4703bcc`, để gộp không vướng). Đo: `rgb(240, 196, 109)` ở 2D và 3D.

### P3

- Phím sai: chữ son đóng dấu lệch nửa ô lên trên và sang phải chữ cần gõ, chữ cần gõ (nền hồng) vẫn đọc được.
- ×N lúc nghỉ có tấm mực mềm phía sau như thẻ, mờ theo ×N.
- Hai thẻ khay cùng mép cách nhau ít nhất 18 px dọc theo mép.
- Gõ xong từ: các chữ bay bắt đầu trên mép trên của thẻ; dấu phím cuối bắt đầu ở 1,8× (không 2,4×). Từ vẫn đọc được ở khung xong.
- `vite.config.ts`: `server.watch.ignored: ["**/tmp/**"]`, ảnh chụp và test của làn khác trong `tmp/` không còn tải lại trang đang chấm.
- Bamboo: phím đầu của cặp bậc 2 (`KEY.group`) kêu một lần như các phím đúng khác (trước đây im). Test mới trong `td-sound-map`: Bamboo kêu mỗi phím một lần, Typing Feel phát `key` cho phím đầu cặp.
- F1/F2 khi chunk Settings/Sound hỏng: HUD báo "Settings and Sound failed to load · F5 to retry" (thử bằng cách chặn `app/quick.ts`).
- `AGENTS.md`: bỏ ghi chú cũ "C1: `view-3d.ts`, still empty".
- Changelog §4 ghi rõ ba file `src/kit/three` đổi khi đồng bộ.
- Chấm sáng trắng xanh dưới thẻ "see": đó là quả cầu nạp của lời gọi đang khóa ở `FX_core` của ruộng lúa (C10 §3.3, cố ý). Nó trông như vệt vì `FX_core` của ruộng nằm sát góc ruộng; ghi cho làn 1C (điểm `FX_core` của nhà), không sửa ở đây.
- Không làm ở đây: sao của thẻ thắng vẫn là chữ "★" (ảnh `star-lit`, `star-unlit` của 135 chưa nhận); đêm 3D sáng như ngày và chưa vẽ quái (làn 1C, C11 trở đi).
- Polyfill modulepreload: điều phối viên cần nhận việc bỏ nó. Lượt này không làm gói khởi động nặng thêm: phần kẹp khay mép rời `cards.ts` sang chunk 3D (đúng lần cắt kế tiếp đã ghi), bù cho phần mới ở chunk đầu (luật bảng của cột khay thử ở chỗ vẽ, câu báo F1/F2); bản build của host chơi chừa 0,24 kB (bảng dưới). Lần cắt kế tiếp nếu cần: phần còn lại của khay mép trong `cards.ts` (`data-edge`, hai dòng tránh bảng của cột khay) qua `CardFeel`.

### Đo và kiểm sau khi sửa

| Đo trên Mac | `/` | `/?title=0` | View 3D |
|---|---:|---:|---:|
| Không biến (`pnpm check`) | 83,93 kB | 84,60 kB (chừa 0,40) | 173,62 / 260 kB |
| Biến của host chơi | 83,94 kB | 84,76 kB (chừa 0,24) | 173,62 / 260 kB |

- `pnpm check`: kit 82/82, 55 file test, 640 test qua, `tsc`, build.
- `pnpm td:golden:check`: hai ván vàng `same: true`, không cập nhật.
- Trần dòng: 14.122 dòng TypeScript trong `src` (trừ `src/kit`), dưới mốc `1C.C10` 14.500.
- Trình duyệt: Vite dev `127.0.0.1:3195` với hai biến của host chơi, Chrome headless dưới `heavy.sh --gpu`.
  - `td-theme` 1280 và 1920: mọi kiểm tra qua; thẻ kết có lớp tối, ba nút tấm 160, link "Copy playtest data".
  - `td-1c-view` 1280 và 1920: mọi ô qua, kể cả `deepOpens`.
  - `td-1c-words` 1280 và 1920 (`FRAMES=1`): mọi ô qua, kể cả ba ô mới `comboClearOfCard`, `trayPointerReads` và `trayGlide`.
  - Kịch bản tạm: F1 ở 2D và 3D (Resume vàng), chặn `app/quick.ts` rồi bấm F1 (HUD báo lỗi).
  - `td-1b-chunks` 1280: 24/24 kiểm tra qua; thẻ kết khi thiếu "Chơi lại Ngày n" có nút `again`, `map`, `title`, `copy` theo thứ tự mới.
- Ảnh thô đã dọn bằng `tools/capture-prune`; giữ tờ so ở `tmp/integrate/fix/compare/` và JSON.

## Còn mở

- 203A chờ hai giám khảo C10 chấm lại sau các sửa ở mục trên.
- Icon gọi, chấm `●●○`, huy hiệu hạng, icon dòng số và sao thẻ thắng chờ các phiếu ảnh 133, 135, 142, 165, 166, 172 được nhận (lô 204, phần B của 203); crest thua chưa có ảnh.
- Thời gian bay của Word Shot (khoảng 350 ms) là tốc độ đạn của sim: chủ dự án và làn 1C quyết (đổi ván vàng và cân bằng).
- Bộ phím camera Home, PageDown, End chờ chủ dự án duyệt.
- Đêm 3D sáng như ngày, chưa có quái: làn 1C (C11 trở đi). Điểm `FX_core` của ruộng lúa sát góc ruộng.
- Bỏ polyfill modulepreload chờ điều phối viên nhận; chừa 0,24 kB ở bản build của host chơi.

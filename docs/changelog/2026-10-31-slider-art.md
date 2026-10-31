# 31/10/2026 · Wordwoven · Thanh trượt bảng Sound mang ảnh thật

Worktree `games/.wt-td-sliders`, nhánh `td-sliders`. Gắn ảnh rãnh ngọc bích và núm đá vôi đã nhận vào bảng Sound, theo phiếu 225 (`docs/codex-queue/225-settings-slider-art.md` ở repo cha). Không sửa `src/kit`, không đổi luật, ván vàng giữ nguyên.

## Ảnh

- Chép sáu bản thu của phiếu từ `art-src/ui/quick-settings/sliders/` sang `public/assets/typing-defense/ui/quick-settings/` (cạnh khung `panel-large.v2.alpha.png`, nút `button.v2.alpha.png` và tám icon của phiếu 180), giữ nguyên byte (md5 khớp nguồn):
  - rãnh `slider-track.png` (1024 × 64) và `slider-track.512.png` (512 × 32);
  - núm `slider-thumb.png` (1024²), `.256.png`, `.128.png`, `.64.png`.
- Ảnh là media, không vào Git. `media.md5` **chưa** có sáu dòng này: lúc gắn đang chạy `media:push`, nên không sửa file đó; điều phối thêm dòng và đẩy Drive sau. `public/assets/typing-defense/README.md` ghi điều này.

## Mã

- `src/app/quick.ts`: `QUICK_SKIN` gom ảnh của bảng: khung, nút, rãnh `slider-track.png`, núm `slider-thumb.128.png`. `mountQuick` truyền `skin: QUICK_SKIN`.
  - Ở 1080p rãnh rộng tới khoảng 414 × 15 px CSS (sau lượt căn cột nhãn), hộp núm 42 px. Dùng bản rãnh 1024 và núm 128; bản 512 và 64 để dành.
- `src/ui/quick.css`: dưới hộp rãnh kit tô `--kit-qs-line` (ở game này là màu tre `--vd-bamboo`), dưới ô vuông của núm tô `--kit-qs-text` (`css.ts:73–76`). Núm tròn và rãnh có đầu mây cuộn, nên hai màu đó lộ thành ô vuông quanh núm và góc tre ở hai đầu. Luật `.td-quick.kit-qs--skin-slider` bỏ hai màu đó (WebKit và Gecko tách luật riêng), chỉ còn ảnh. Lượt sửa sau duyệt (dưới) đổi thêm cách vẽ rãnh và cỡ núm.
- Vòng focus của kit (`--kit-qs-focus` = `--vd-lantern`) giữ nguyên quanh cả ô range.

## Sửa sau duyệt (31/10)

Người duyệt độc lập báo 7 mục (4 P2, 3 P3). Wordwoven sửa:

- **Đầu mây cuộn của rãnh bị kéo bè ngang 1,8–2,2 lần (P2).** Kit kéo cả ảnh 1024 × 64 phủ rãnh (`100% 100%`); rãnh ở đây dài tới 36:1 nên hai đầu đồng thành bầu dục. Nay rãnh vẽ ba lát bằng `border-image: var(--kit-qs-skin-track) 0 64 fill / 0 calc(10px * s) stretch` (đo ảnh: mây vàng hết ở cột 56 bên trái, từ cột 967 bên phải; lát 64 px cho đầu đúng tỉ lệ 10 × 10 px ở cỡ 1, cao bằng rãnh), chỉ phần ngọc bích ở giữa giãn. `background: none` thay cho nền trong suốt cũ. Bấm và kéo vẫn đúng giá trị (xem Kiểm).
- **Rãnh bắt đầu ở ba vị trí x khác nhau (P2, có từ trước).** Mỗi hàng là một lưới riêng với cột nhãn `minmax(90px, auto)`, nhãn dài đẩy rãnh sang phải (1920: 730, 745, 837). Nay các hàng của bảng Sound (`.kit-qs__dialog[data-panel="sound"] .kit-qs__row`, trừ hàng slot) dùng chung cột nhãn `9em`, đủ cho "Keyboard volume" (131 px ở 1280, 8,73em). Mọi rãnh và danh sách âm phím bắt đầu cùng một x: 585 ở 1280, 855 ở 1920. Cột icon nay nhân `--kit-qs-s` như icon (trước 24 px cố định, icon 36 px ở 1920 lấn sang nhãn). Đổi lại, rãnh Music/Effects ngắn hơn (414 thay 538 px ở 1920). Bảng Settings giữ cột cũ để "Pace adapts to your typing" không xuống dòng.
- **Chữ Resume tối trên nền nút tối, không đọc được (P2, có từ trước).** Kit cho `.kit-qs__btn--primary` màu `--kit-qs-accent-text` (= `--vd-ink`, `rgb(43, 33, 24)`); luật màu chữ của game chỉ phủ hover, `aria-pressed`, `aria-checked`. Nay `.td-quick .kit-qs__btn--primary` chữ vàng `--vd-quick-accent` (`rgb(240, 196, 109)` đo trong trình duyệt), vừa đọc được vừa đánh dấu nút chính; rê chuột thành màu kem như các nút khác.
- **Núm nhỏ: chỉ khoảng 15 px ở 720p (P3).** Hộp núm 22 thành 28 px (`margin-top: -9px`, nhân `s`), ô range cao 28 px theo, nên vòng focus vẫn ôm núm. Núm thấy được khoảng 20 px ở 720p, gấp đôi rãnh; ảnh 128 vẫn nét tới 42 px CSS trên màn 2×.
- Mục "Dragonhold: số chạm khung" thuộc game kia. Mục "hộp CSS và ảnh còn thiếu" và "sáu cỡ ảnh, chưa thử Firefox" để lượt ảnh UI và điều phối (xem Còn mở).

## Kiểm

- `pnpm check` xanh (mã thoát 0): `verify-kit`, 43 file test, 491 test, `tsc --noEmit`, build và ngân sách gói.
  - Ngân sách gói giữ: "/" 80,73 kB gzip (dư 4,27 kB), "/?title=0" 82,28 kB (dư 2,71 kB). `app/quick.ts` là chunk lười (13,09 kB), không nằm trong phần khởi động.
- Test trong `tests/td-quick.test.ts` ("the panels' art", đọc `quick.css` thành bảng luật theo selector, vì DOM giả không có cascade):
  - gốc bảng có lớp `kit-qs--skin-slider`, `--kit-qs-skin-track` trỏ `slider-track.png`, `--kit-qs-skin-thumb` trỏ `slider-thumb.128.png`, khung vẫn `panel-large.v2.alpha.png`;
  - rãnh WebKit và Gecko: `background: none` và đúng `border-image` ba lát; núm: nền trong suốt, 28 × 28, `margin-top` −9 (WebKit); ô range cao 28; không luật nào gộp `::-webkit-` với `::-moz-`;
  - luật cột nhãn chung khớp mọi hàng có rãnh và hàng `keyboard` của bảng Sound thật (trong DOM), không khớp hàng nào của Settings;
  - Resume mang lớp `kit-qs__btn--primary` và luật cho nó chữ `--vd-quick-accent`.
  - Thử đột biến: trả cột nhãn về `minmax(90px, auto)`, bỏ luật Resume, bỏ `background: none` của rãnh: mỗi lần test đỏ (mã thoát 1), rồi trả file.
- Trình duyệt thật (Chrome headless qua `src/kit/tools/cdp-run.mjs`, Vite cổng 3182 cho lượt gắn, 3186 cho lượt sửa, `?title=0`), 1280 × 720 và 1920 × 1080:
  - F1 mở Settings, F2 mở Sound, Esc đóng;
  - mọi thanh ở 0, 50, 100 %, số bên cạnh khớp;
  - bàn phím: Tab tới Master, có `:focus-visible` và viền đèn lồng; Home 0, → 1, → 2, PageUp 12, End 100, ← 99, Home 0;
  - chuột: bấm vào rãnh ở 30, 0, 100, 73 % (tính theo núm 28 px) ra đúng 30, 0, 100, 73, nên tâm núm nằm dưới con trỏ; kéo núm Music xuống 20, quá mép phải thành 100, quá mép trái thành 0, thả ở 64;
  - đầu rãnh phóng 4×: mây cuộn tròn đúng tỉ lệ; Resume chữ vàng; hai ảnh tải mã 200; không lỗi trang.
  - Tờ xem lượt sửa: `tmp/ui-wire/fix/1280/contact-sheet.jpg`, `tmp/ui-wire/fix/1920/contact-sheet.jpg`, số trong `result.json` cạnh mỗi tờ. Tờ của lượt gắn ở `tmp/ui-wire/1280|1920/` đã cũ. Ảnh thô đã xoá bằng `tools/capture-prune/prune.mjs`.
- Worktree nối `ui`, `ground`, `scenery` và các thư mục con của `models` trong `public/assets/typing-defense` tới media của bản chính (symlink, ngoài Git); `README.md` và `models/manifest.json` vẫn là file của nhánh.

## Còn mở

- `media.md5` thiếu sáu dòng ảnh thanh trượt (chờ `media:push` đang chạy xong). Game chỉ dùng `slider-track.png` và `slider-thumb.128.png`; điều phối quyết có giữ bản núm 1024 (892 KB), `.256`, `.64` và rãnh `.512` trong `public/` (chúng vào `dist` và gói deploy mà không ai tải) trước khi thêm dòng `media.md5`.
- Chưa thử trên Firefox (máy không có): các luật `::-moz-range-*` mới chỉ được kiểm bằng đọc CSS.
- Danh sách âm phím (Off/Bamboo) vẫn là khối CSS phẳng xanh/vàng; nền bảng lộ đường nối ô lát sau các hàng (khung `border-image ... round`); hàng Keyboard volume chưa có icon. Cần ảnh và một lượt ảnh UI riêng.
- Kit nên tự vẽ rãnh ba lát và bỏ màu nền dưới ảnh rãnh và núm khi có `skin` (sửa `shared/game-kit/ui/quick-settings/css.ts`, có thể nhận độ rộng lát đầu rãnh qua `QuickSkin`), để game không phải tự viết luật như trên và Last Line cũng được.

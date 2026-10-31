# 31/10/2026 · Wordwoven · Bảng Settings/Sound: kit da mới, phần đầy thanh trượt, danh sách âm phím trên tấm ảnh

Nhánh `a2-days`. Đồng bộ kit từ repo cha `18722b41` (đợt da mới của `ui/quick-settings`, xem
`docs/changelog/2026-10-31-kit-quick-panels.md` ở repo cha) rồi đổi da hai bảng của Wordwoven chỉ bằng ảnh đã nhận và
đã gắn trong game (115/160 khung và nút, 225 rãnh ngọc và núm đá vôi, 180 icon). Không tạo ảnh mới, không gắn ảnh
Codex đang làm (244 phần đầy và rãnh rỗng, 245 tấm hàng danh sách và Close): khi có, chỉ đổi `QUICK_SKIN` trong
`src/app/quick.ts`.

## Kit

`node scripts/sync-game-kit.mjs --target games/typing-defense`: 7 file trong `src/kit/ui/quick-settings/` và manifest.
Mã game không phải sửa vì kiểu. `verify-kit` và `kit:sync --check` báo OK.

## Đã làm

- **Phần đầy của thanh trượt.** `sliderEmpty` là rãnh ngọc 225 nên lớp phần đầy của kit bật; phần đầy dùng lại chính
  rãnh đó (chưa có ảnh 244). Phần rỗng xám và tối (`grayscale(0.85) brightness(0.45)`), nên ở 0 rãnh ngọc không còn
  trông như đầy; phần đầy sáng lên (`brightness(1.2) saturate(1.3)`) với quầng đèn lồng. Rãnh cắt `0 64`, đầu mây cuộn
  10 px, núm 32 px (`--kit-qs-knob`), nên phần đầy dừng đúng tâm núm. Focus bàn phím làm ấm cả hai lớp rãnh. Hàng
  Master khi tắt tiếng làm tối cả `.kit-qs__slider` (trước là `.kit-qs__range`, nay chỉ còn làm tối núm). Bỏ hai luật
  `border-image` cũ trên track (lớp phần đầy vẽ rãnh) và cỡ núm riêng (kit tính từ `--kit-qs-knob`).
- **Mọi rãnh dài bằng nhau.** Mute ở cột riêng rộng bằng "Unmute" (`--kit-qs-aside-w: calc(38px + 60px * s)`). Bảng
  Sound rộng 640 px (theo tỉ lệ), không phải 560: rãnh từ 139 px lên 219 px ở 720p.
- **Danh sách âm phím trên tấm ảnh.** `listRow` dùng ảnh nút 160 với cùng cách cắt như nút (`170 260`), mép 12 px, hai
  bên 18 px ở 720p; dòng đang chọn dùng `button-active` (kit lấy từ `buttonActive`), chữ vàng. Khung bo tròn và nền
  phẳng của listbox web không còn. Danh sách lớn theo bảng: dòng, tiêu đề họ, icon nghe thử và mép tấm đều nhân
  `--kit-qs-s` (`LIST_ROW_VARS`; kit vẽ 34 px ở mọi cỡ, nên ở 1080p chữ 22 px lấp kín tấm). Màn cảm ứng giữ tối thiểu
  44 px như kit.
- **Tấm đang bật qua kit.** Chip đang chọn, Mute đang nhấn, công tắc đang bật dùng `QuickSkin.buttonActive` (thay biến
  riêng `--td-qs-button-active`), như cũ: tấm 160 có quầng hổ phách, chữ vàng.
- **Focus là quầng đèn lồng** (`--kit-qs-glow: var(--vd-lantern)`) ôm theo ảnh: nút, chip, dòng danh sách, núm, nút
  nghe thử.
- **Tựa bảng** bằng font tựa của game, Baloo 2 (`--vd-title`), 26 px, vàng.
- **Icon mọi hàng có ảnh đã nhận:** sáu hàng bảng Sound; Keyboard volume dùng tạm icon `vol-keyboard` tới khi icon
  riêng (244) được nhận. Hai hàng bảng Settings (Pace, Story mode) chưa có icon nào được nhận: ô trống giữ chỗ, cột
  icon theo `--kit-qs-icon-size`.

Tệp: `src/app/quick.ts`, `src/ui/quick.css`, `tests/td-quick.test.ts`.

## Kiểm

- `pnpm check` xanh: `verify-kit` 82 file khớp manifest, 55 file test, 649 test qua (trước 647), `tsc`, build và ngân
  sách gói: "/" 83,93 kB, "/?title=0" 84,76 kB gzip với biến của host chơi (không đổi).
- Test viết lại hoặc mới trong `tests/td-quick.test.ts`: lớp phần đầy và ảnh của hai lớp, mọi hàng trượt có rãnh,
  phần đầy, cột Mute; `--kit-qs-v` theo giá trị 0/50/100; biến của lớp; trạng thái núm và quầng; tấm đang bật qua
  `buttonActive`; hàng tắt tiếng làm tối `.kit-qs__slider`; bảng Sound 640 px; tấm danh sách (ảnh, cắt bằng cắt của
  nút, `LIST_ROW_VARS`), danh sách theo tỉ lệ; icon từng hàng, mọi URL icon là file có thật; font tựa. Thử đột biến (bỏ
  `sliderEmpty`, `buttonActive`, `LIST_ROW_VARS`): 3 test đỏ, đã trả lại.
- Host chơi (`pnpm build:td` ở repo cha, https://td.typing-game.local/), Chrome không giao diện, 1280 × 720 và
  1920 × 1080, ở màn tựa và trong trận (`?title=0`), mở F1 và F2:
  - không ảnh hỏng, 0 yêu cầu lỗi (354 yêu cầu), 0 ngoại lệ, 0 cảnh báo;
  - phần đầy đo bằng điểm ảnh, núm ẩn: 720p 16 / 110 / 203 px, tính ra 16 / 109,5 / 203; 1080p 24 / 174 / 324, tính ra
    24 / 173,8 / 323,5;
  - năm rãnh dài bằng nhau: 219 px ở 720p, 347,5 px ở 1080p, cả màn tựa và trong trận;
  - 36 dòng danh sách trên `button.v2.alpha.png`, dòng chọn trên `button-active.v2.alpha.png`, chữ vàng; dòng 34 px
    (51 px ở 1080p); bảng Sound vừa khung ở 720, 900, 1080 (`scrollHeight` bằng `clientHeight`: 621, 764, 907 px);
  - bàn phím: Tab đi Close, Master, Mute, Music, Effects, dòng đang chọn, các nút nghe thử, không ra khỏi bảng; mũi tên
    phải trên Music 60 → 61 và phần đầy theo; focus trên Mute và dòng danh sách là quầng đèn lồng; Esc đóng bảng ở màn
    tựa và trong trận; bảng mở trong trận thì tick đứng (189 → 189), đóng thì đếm ngược rồi chạy tiếp;
  - âm phím: chọn bộ Deep Amber trong bảng, đóng, chờ đếm ngược, gõ một chữ: `stats.played` 0 → 1, đúng một tiếng.
- Tờ ghép `wordwoven-1280x720.jpg` và `wordwoven-1920x1080.jpg` ở thư mục kiểm của lượt (ngoài repo); số đo trong
  `tmp/kit-qs-games/numbers.json`. Ảnh thô đã xoá bằng `tools/capture-prune/prune.mjs`.

## Còn mở

- Close vẫn là nút chữ trên tấm nút: chưa có ảnh Close được nhận (245).
- Phần đầy và rãnh rỗng chờ ảnh 244 (đã gắn ở lượt sửa bên dưới); tấm hàng danh sách chờ 245.
- Hàng Pace và Story mode chưa có icon.
- Chưa thử Firefox; `:has()` cần Firefox 121 trở lên (chỉ để làm ấm rãnh khi focus).
- Con trỏ submodule ở repo cha chưa cập nhật.

## Lượt sửa (giám khảo 31/10, tối)

Giám khảo chấm lượt da ở trên và ghi 11 mục cho hai game; kit sửa ở repo cha `b8a224d0` (xem changelog kit ở repo cha),
đồng bộ lại vào `src/kit` (`verify-kit` OK, 82 file). Mục và cách sửa ở Wordwoven:

| # | Giám khảo thấy | Đã sửa |
|---|---|---|
| 1 | Núm bị rãnh và phần đầy vẽ đè lên khi không rê chuột, không focus | Kit: núm `z-index` 1 trên hai lớp ảnh (0). Đo ở tâm núm tại 0/50/100: ảnh giống hệt khi ẩn hai lớp, khác hẳn khi ẩn núm |
| 3 | Dải ngọc tối có bậc lặp dọc mép phải và mép trên (rõ nhất ở 1080p) | `::before` của bảng phủ một bản ngọc giữa duy nhất (cùng cỡ với nền giữa) lên 20 px ngọc trong của các cạnh, chừa bốn góc giữ mặt trời và cuộn đỏ. Không cắt lại ở mép dải như gợi ý: cắt ở đó thì mặt trời và cuộn góc rơi vào cạnh lặp. Mép vàng trong của khung ở 99/91 px của ảnh, nằm ngoài hộp đệm, nên không bị phủ |
| 4 | Settings ở màn tựa có Resume và Quit to title | `QuickHooks.context`, `main.ts` truyền `() => (titleUp ? "title" : "play")`: màn tựa ẩn hai nút, trong trận hiện |
| 5–6 | Danh sách cắt cứng (có vệt chữ ở mép trên), dòng chọn ở mép dưới; Tab đi qua 34 nút nghe thử | Kit: mép mờ, bám dòng, dòng chọn ra giữa khi mở; chỉ một nút Listen trong thứ tự Tab. Đo: Tab từ dòng chọn tới Keyboard volume sau 2 lần |
| 7 | Rê chuột trên nút, chip, dòng danh sách gần như không thấy | Nút và chip: sáng 1,25 kèm quầng đèn lồng 5 px; dòng danh sách: biến mặc định của kit (sáng 1,3, quầng màu `--kit-qs-glow`) |
| 8 | Hàng Master 50 px, các hàng trượt khác 38 px | Mọi hàng trượt của bảng Sound cao bằng Master (tấm Mute, cộng 3 px đệm trên dưới vì `border-box`): 51,6 px ở 720p, 65,4 px ở 1080p. Danh sách âm phím còn 8 dòng (272 px ở 720p) để bảng vẫn không cuộn |
| 9 | Phần rỗng là một thanh đen phẳng, phần đầy giả bằng lọc màu | `sliderEmpty` và `sliderFill` là cặp 244 (nhận 31/10), rãnh 225 chỉ còn là dự phòng của kit; bỏ hai bộ lọc giả. Cặp 244 lùi 8 px khỏi hai đầu khung 1024 px, nên cắt `0 72` với đầu rãnh 11,25 px (72 × 10 / 64) |
| 10 | Năm chip Story mode xuống dòng 3 + 2 dưới một nhãn nằm giữa hai dòng | Bảng Settings rộng 640 px như Sound; nhãn ở dòng riêng, năm tấm trên một dòng bên dưới, thẳng mép nhãn. Chip đệm 5 px trong viền ảnh 12 px (nút 7 px): năm tấm dùng 494 trên 514 px ở 720p, 656 trên 771 px ở 1080p. Không làm nút `< Balanced >`: một dòng đã đủ và giữ năm lựa chọn nhìn thấy cùng lúc |
| 11 | Chữ thân là sans web | `--kit-qs-button-font` và `--kit-qs-label-font` là Baloo 2 600 (font tựa, game chỉ tải một độ đậm); số và ghi chú giữ Be Vietnam Pro |

Mục 2 là của Dragonhold.

Kiểm:

- `pnpm check`: kit OK, 55 file test, **653 test qua** (trước 649), build OK, ngân sách gói "/" 83,94 kB gzip (≤ 85).
  Test mới: Settings ở màn tựa ẩn Resume và Quit to title, trong trận hiện (và `main.ts` truyền móc); font; Story mode
  một dòng trong bảng 640 px; hàng trượt cao đều. Đổi: thanh trượt dùng cặp 244 (cắt `0 72`), khung có `::before`, rê
  chuột có quầng, danh sách 272 px.
- Host chơi (`pnpm build:td` ở repo cha), Chrome không giao diện, 1280 × 720 và 1920 × 1080, màn tựa và trong trận
  (`?title=0`):
  - 0 ảnh hỏng, 0 yêu cầu lỗi, 0 ngoại lệ, 0 cảnh báo;
  - núm trên lớp ảnh ở 0/50/100, cả màn tựa và trong trận;
  - phần đầy 244 dừng ở tâm núm: 720p 16 / 110 / 203 px (tính ra 16 / 109,5 / 203), 1080p 24 / 174 / 324
    (24 / 173,8 / 323,5);
  - Settings ở màn tựa: Resume và Quit to title ẩn; trong trận: hiện; tick đứng khi bảng mở (183 → 183), đóng thì đếm
    ngược rồi chạy tiếp;
  - năm hàng trượt cao bằng nhau (51,6 px ở 720p, 65,4 px ở 1080p); bảng Sound không cuộn (644 / 644 px ở 720p);
  - Story mode: năm chip trên một dòng ở cả hai cỡ;
  - danh sách: mép mờ, bám dòng, dòng chọn cách tâm 13 px (720p), 19,5 px (1080p); Tab từ dòng chọn tới Keyboard volume
    sau 2 lần; 12 lần Tab vẫn trong bảng; Esc đóng ở màn tựa và trong trận;
  - chọn Deep Amber, đóng, gõ một chữ: đúng một tiếng (`stats.played` 0 → 1);
  - khung ở 1:1: mép trên và mép phải không còn dải ngọc tối có bậc.
- Tờ ghép `fix-wordwoven-1280x720.jpg`, `fix-wordwoven-1920x1080.jpg` (thư mục kiểm của lượt, ngoài repo); số đo trong
  `tmp/kit-qs-fix/numbers.json`. Ảnh thô đã xoá bằng `tools/capture-prune/prune.mjs`.

Còn mở sau lượt sửa:

- Close vẫn là nút chữ; tấm hàng danh sách vẫn là tấm nút 160: chờ ảnh 245.
- Hàng Pace và Story mode chưa có icon; icon 244 của bảng Sound đã nhận nhưng chưa gắn (không nằm trong mục giám khảo).
- Ngọc giữa bảng Settings vẫn bị ép theo trục dọc (cách vẽ nền giữa có từ UI pass 2); không thấy vệt, chưa sửa.

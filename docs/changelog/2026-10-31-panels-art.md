# 31/10/2026 · Wordwoven · Bảng Settings/Sound: gắn ảnh 244 đã nhận (icon r2, icon Keyboard volume, cặp rãnh)

Nhánh `a2-days`, từ `47a1698`. Gắn đúng phần ảnh của phiếu Codex 244 mà điều phối đã nhận ngày 31/10. Không sửa kit
(`src/kit` khớp `shared/game-kit`, `verify-kit` OK), không gắn ảnh các phiếu 245–249 đang làm (tấm hàng danh sách,
Close, bóng quái, phần HUD, icon r3, súng).

## Thanh trượt: cặp 244 (đã gắn ở `47a1698`, nay đặt đủ biến)

- `sliderEmpty` = `slider-empty.png` (đá xám chưa mài, tối) và `sliderFill` = `slider-fill.png` (ngọc bích mài bóng,
  sáng) đã nằm trong `QUICK_SKIN` từ lượt sửa của giám khảo; bản trong `public/` giống nguồn
  `art-src/ui/quick-settings/sliders/` từng byte (md5 `06fedd63…`, `289b9c7f…`).
- Đo lại ảnh: cả hai rộng 1024 × 64, phần vẽ từ cột 8 tới cột 1015 (lùi 8 px mỗi đầu so với rãnh cũ
  `slider-track.png`, phủ kín 1024). Nên cắt `0 72` (8 + 64) với đầu rãnh 11,25 px (72 × 10 / 64), cho cả hai lớp.
- Mới ở lượt này: `quick.css` đặt thêm `--kit-qs-fill-slice: 0 72` và `--kit-qs-fill-cap` cho lớp phần đầy, không để
  nó dựa vào giá trị dự phòng của rãnh (`--kit-qs-groove-*`). Rãnh 225 cũ chỉ còn là `sliderTrack` dự phòng của kit.
- Không còn lọc màu giả: lớp đặt không có `--kit-qs-empty-filter` hay `--kit-qs-fill-filter` lúc đứng yên (kit chỉ
  làm sáng phần đầy khi không có ảnh phần đầy); hai lớp chỉ được làm ấm bằng quầng đèn lồng khi focus bàn phím.

## Icon (ảnh 244 trong `art-src/ui/quick-settings/selected/`)

| Tên trong kit | Trước | Nay |
|---|---|---|
| `hud-settings` (nút bánh răng ở góc) | `hud-settings.128.png` | `hud-settings.r2.128.png`: bánh răng vàng đặc trên tấm ngọc |
| `vol-keyboard` (hàng Keyboard sound) | `vol-keyboard.128.png` | `vol-keyboard.r2.128.png`: phím ngọc phát sóng âm |
| `vol-interface` (hàng Interface) | `vol-interface.128.png` | `vol-interface.r2.128.png`: con trỏ bấm trên ấn ngọc |
| `vol-keyboard-volume` (hàng Keyboard volume) | mượn `vol-keyboard.128.png` | `vol-keyboard-volume.128.png` (mới): phím và ba cột âm lượng |

- `src/app/quick.ts`: bảng `QUICK_ICON_FILES` ghi tên file cho từng tên icon (thay cách ghép `<tên>.128.png`), rồi
  `QUICK_ICONS` = `QUICK_ART` + file. Sáu hàng bảng Sound nay là sáu ảnh khác nhau.
- Nút góc giữ đúng trạng thái kit đang vẽ cho nút góc có icon: rê chuột sáng 1,15 kèm quầng đèn lồng (đo
  `brightness(1.15) drop-shadow(rgb(255, 184, 77) 0 0 4px)` ở 720p, 6 px ở 1080p), focus là quầng `--kit-qs-glow`,
  `aria-expanded` đổi khi mở bảng. Không thêm luật CSS nào cho nút góc.
- Bản 128 đủ nét: icon hàng vẽ 24 px CSS ở 720p, 36 px ở 1080p; nút góc 32 / 48 px.

## Ảnh vào `public/`

Theo cách game vẫn làm (chép tay, giữ nguyên byte, xem `public/assets/typing-defense/README.md`): bốn file
`hud-settings.r2.128.png`, `vol-keyboard.r2.128.png`, `vol-interface.r2.128.png`, `vol-keyboard-volume.128.png` chép từ
`art-src/ui/quick-settings/selected/` sang `public/assets/typing-defense/ui/quick-settings/` (md5 khớp nguồn). Ảnh là
media, không vào Git. **`media.md5` chưa có dòng** cho bốn file này (cũng như hai ảnh rãnh 244, `button-active`, các bản
thu thanh trượt 225): `media.md5` chỉ đổi qua `pnpm media:push` của điều phối. Ba icon cũ
(`hud-settings.128.png`, `vol-keyboard.128.png`, `vol-interface.128.png`) vẫn nằm trong `public/` và `media.md5` nhưng
game không còn tải.

Tệp: `src/app/quick.ts`, `src/ui/quick.css`, `tests/td-quick.test.ts`, `public/assets/typing-defense/README.md`, changelog.

## Kiểm

- `pnpm check` xanh: `verify-kit` 82 file khớp manifest, 55 file test, **653 test** qua, `tsc`, build, ngân sách gói
  "/" 83,94 kB gzip (dư 1,05 kB), "/?title=0" 84,61 kB (dư 0,39 kB). `app/quick.ts` là chunk lười (16,44 kB), không
  nằm trong phần khởi động.
- Test đổi trong `tests/td-quick.test.ts`: biến cắt có cả `--kit-qs-fill-slice: 0 72` và `--kit-qs-fill-cap`; mỗi hàng
  Sound đúng file (r2 cho Keyboard sound và Interface, file riêng cho Keyboard volume), sáu ảnh khác nhau; nút góc
  Settings là `hud-settings.r2.128.png`, nút Sound giữ `hud-sound.128.png`; mọi tên icon của kit (trừ Voice) có file;
  trên máy có ảnh, file trong `public/` giống nguồn `selected/` từng byte. Thử đột biến (trả bánh răng cũ, Keyboard
  volume mượn lại icon phím, bỏ dòng biến phần đầy): 2 test đỏ, đã trả lại.
- Host chơi (`pnpm build:td` ở repo cha: "/" 83,94 kB, "/?title=0" 84,77 kB gzip với biến của host chơi, dư 0,23 kB),
  https://td.typing-game.local/, Chrome không giao diện, 1280 × 720 và 1920 × 1080, màn tựa và trong trận (`?title=0`),
  mở F1 và F2:
  - 0 ảnh hỏng, 0 yêu cầu lỗi (357 yêu cầu), 0 ngoại lệ, 0 cảnh báo;
  - sáu icon hàng Sound có và tải xong (`naturalWidth` 128), 24 px ở 720p, 36 px ở 1080p; nút góc bánh răng r2 tải xong,
    32 / 48 px; hai hàng Settings (Pace, Story mode) vẫn là ô trống giữ chỗ (chưa có icon được nhận);
  - năm rãnh dài bằng nhau và cùng x: 219 px ở 720p, 347,5 px ở 1080p, cả màn tựa và trong trận;
  - phần đầy đo bằng điểm ảnh (núm ẩn) ở 0/50/100: 720p 16 / 110 / 203 px, tính ra 16 / 109,5 / 203; 1080p
    24 / 174 / 324, tính ra 24 / 173,8 / 323,5; độ sáng trung bình rãnh rỗng 52,5 so với đầy 142,6 (720p);
  - bàn phím: 14 lần Tab vẫn trong bảng; mũi tên phải trên Music 60 → 61 và `--kit-qs-v` theo (0,61); Esc đóng ở màn tựa
    và trong trận; bảng mở trong trận thì tick đứng (235 → 235), đóng thì đếm ngược rồi chạy tiếp;
  - âm phím: chọn Deep Amber, đóng, gõ một chữ: `stats.played` 0 → 1, đúng một tiếng.
- Tờ ghép `wordwoven-1280x720.jpg`, `wordwoven-1920x1080.jpg` (thư mục kiểm của lượt, ngoài repo); số đo ở
  `tmp/panels-art/numbers.json`. Ảnh thô đã xoá bằng `tools/capture-prune/prune.mjs`.

## Còn mở

- `media.md5` thiếu dòng cho bốn icon mới (và các ảnh nêu trên): chờ `media:push` của điều phối.
- Close vẫn là nút chữ, dòng danh sách âm phím vẫn trên tấm nút 160: chờ ảnh 245 được nhận.
- Hàng Pace và Story mode chưa có icon.
- Con trỏ submodule ở repo cha chưa cập nhật.

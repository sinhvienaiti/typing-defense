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

## Lượt sửa theo giám khảo sau khi gắn ảnh (tối 31/10)

Chín mục của giám khảo cho hai bảng. Kit đổi ở repo cha `ba2b4d65` (của lượt này: Tab đi vòng trong bảng) và
`fc7f4a11` (của lượt Last Line: hàng Master khi tắt tiếng, phản hồi nút Listen, thanh cuộn mảnh); game đồng bộ kit
tại `fc7f4a11` (83 file, `verify-kit` OK).

| Mục của giám khảo | Đã làm |
|---|---|
| Tab rời bảng Settings ở màn tựa (hai mục, kit) | Kit tự lo phím Tab khi bảng mở (`ui/quick-settings/focus.ts`): điểm dừng là các nút đang hiện và bật, thanh trượt, dòng danh sách, và mỗi nhóm radio chỉ lấy chip đang chọn; Tab ở điểm cuối về Close, Shift+Tab ở Close về điểm cuối. Đo trên host chơi: 1 Shift+Tab từ khung bảng + 10 Tab + 10 Shift+Tab, Settings ở màn tựa, Sound, Settings trong trận, cả hai cỡ: mọi lần focus đều ở trong bảng. 10 test kit mới |
| Shift+Tab từ khung bảng không làm gì (kit) | Cùng bản sửa trên: từ khung bảng Shift+Tab tới điểm cuối (chip đang chọn của Story mode ở màn tựa, Quit to title trong trận), Tab tới Close |
| Icon hàng 24 px, dưới quy tắc 28–32 px (kit) | Kit có sẵn biến nên không phải đổi kit: `quick.css` đặt `--kit-qs-icon-size` = 32 px × tỉ lệ (32 px ở 720p, 48 px ở 1080p), cột icon rộng theo. Mặc định của kit vẫn 24 px |
| Settings thiếu Graphics, Learning; Pace là một tấm "On" khó đọc | Thêm nhóm **Graphics**: Reduced motion; nhóm **Learning**: Show Vietnamese meaning, Show pronunciation. Mỗi công tắc (cả Pace) là cặp chip On/Off như Story mode. Lưu trong `td.settings` (`motion`, `meaning`, `ipa`). Reduced motion gắn lớp `td-still` lên trang (cùng việc với thiết lập hệ thống: `td.css`, `feel.css`, lớp boss 2D, dấu phím, thẻ chữ 3D) và tắt hoạt ảnh 3-2-1 của kit. Tắt nghĩa thì thẻ chữ và dải chữ không hiện nghĩa (thẻ đố giữ nghĩa vì đó là đề), tắt phiên âm thì dải chữ ở chế độ Học bỏ IPA. Đo trên host chơi: tắt nghĩa ở màn tựa rồi vào trận, 0/20 thẻ có nghĩa |
| Thiếu hàng Quality nối với bậc `?q` | **Chưa làm, có lý do:** `docs/td/BUILD_1C_MAP1.md` §2 (chủ dự án duyệt) giữ bản 3D dở khỏi tay người chơi tới hết C13, và chính C13 thêm hàng "Chất lượng hình". Hàng này để tới C13 |
| Thiếu hàng hiệu ứng gõ (kiểu chữ, cường độ, cỡ, xem thử) | **Chưa làm, có lý do:** Wordwoven vẽ dấu phím C10 của riêng game, chưa dùng chữ hiệu ứng của kit (FocusStrip); thêm hàng lúc này là công tắc không làm gì |
| Đếm ngược 3-2-1 là chữ hệ thống, mờ trên sân (kit) | Không cần đổi kit: số vàng font Baloo 2 có viền mực, đặt trên huy hiệu của game (`crest.256.webp`, ảnh đã dùng ở thẻ kết quả, qua `--td-qs-medallion`), dưới là lớp tối mờ dần; số hiện từ 60 % độ đậm thay vì từ 0. Huy hiệu vẽ tối đa ở cỡ gốc 256 px (220 px ở 720p) |
| Hàng Keyboard sound để trống một khối dưới nhãn (kit) | Không cần đổi kit: nhãn đứng một dòng riêng, danh sách chạy dưới nhãn từ mép nhãn tới mép bảng (506 px ở 720p, 759 px ở 1080p), icon trải hai dòng. Danh sách còn 7 dòng (238 px ở 720p) để bảng Sound vẫn không cuộn ở 720p (cao 666 px) |
| Nút Listen không có phản hồi, thanh cuộn xám của hệ điều hành (kit) | Lượt Last Line đã sửa trong kit (`fc7f4a11`): icon theo tỉ lệ bảng, rê chuột sáng có quầng, bấm thì thu nhỏ, sáng suốt lúc mẫu đang phát; danh sách có thanh cuộn mảnh. Wordwoven đặt màu thanh cuộn vàng của khung (`--kit-qs-scroll-thumb`) và bỏ luật cỡ icon Listen của riêng game |

Dọn theo kit mới: hàng Master khi tắt tiếng nay do kit vẽ (`Unmute`, icon loa tắt, làm mờ rãnh, gạch số), nên bỏ
`watchMute`, `UNMUTE_LABEL`, `QUICK_ART_VARS` và các luật `td-quick__row--muted/silent` của game.

Tệp: `src/app/prefs.ts`, `src/app/quick.ts`, `src/main.ts`, `src/ui/hud.ts`, `src/ui/quick.css`, `src/ui/td.css`,
`src/view/boss-2d.ts`, `src/view/3d/words.ts`, `src/view/words/cards.ts`, `src/view/words/feel.css`,
`src/view/words/stamps.ts`, `src/kit/` (đồng bộ), `tests/td-quick.test.ts`, `tests/td-hud.test.ts`,
`tests/td-settings.test.ts`, changelog.

### Kiểm

- `pnpm check` xanh: `verify-kit` 83 file, 55 file test, **655 test** (thêm 2: công tắc Settings lưu và có tác dụng;
  công tắc nghĩa và IPA trên dải chữ), `tsc`, build. Ngân sách gói ở host chơi (`pnpm build:td` ở repo cha): "/"
  84,14 kB gzip (dư 0,86 kB), "/?title=0" **84,96 kB (dư 0,04 kB)**: phần thêm vào lối vào là đọc ba công tắc, nghĩa
  trên thẻ, dải chữ và lớp boss.
- Host chơi https://td.typing-game.local/, Chrome không giao diện, 1280 × 720 và 1920 × 1080, màn tựa và trong trận:
  0 ảnh hỏng, 0 yêu cầu lỗi (358), 0 ngoại lệ, 0 cảnh báo; bốn bảng không cuộn; sáu icon hàng Sound tải xong, 32 px /
  48 px; năm rãnh bằng nhau và cùng x (211 px ở 720p, 335,5 px ở 1080p); phần đầy đo bằng điểm ảnh ở 0/50/100:
  16/106/195 so với 16/105,5/195 (720p), 24/168/312 so với 24/167,8/311,5 (1080p); chip On/Off của bốn công tắc cùng
  x; Tab như trên; mũi tên trên Music 60 → 61; Esc đóng ở màn tựa và trong trận; bảng mở thì tick đứng, đóng thì đếm
  ngược (số "2" Baloo 2 vàng, độ đậm 1, trên huy hiệu) rồi chạy tiếp; chọn Deep Amber, gõ một chữ: đúng một tiếng.
- Tờ ghép `wordwoven-1280x720.jpg`, `wordwoven-1920x1080.jpg` (thư mục kiểm của lượt, ngoài repo); số đo ở
  `tmp/panels-fix/run-*.json`. Ảnh thô đã xoá bằng `tools/capture-prune/prune.mjs`.

### Còn mở

- Icon cho Reduced motion, hai hàng Learning, Pace và Story mode: chưa có ảnh được nhận (ô giữ chỗ trống, tên icon
  của kit đã gắn sẵn: `gfx-motion`, `learn-meaning`, `learn-ipa`).
- Hàng Quality: tới C13. Hàng hiệu ứng gõ: khi game dùng chữ hiệu ứng của kit.
- Ngân sách "/?title=0" chỉ còn 40 byte.
- Close vẫn là nút chữ, dòng danh sách vẫn trên tấm nút 160 (ảnh 245 chưa được nhận); `media.md5` và con trỏ submodule
  ở repo cha như trên.

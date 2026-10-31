# Media của Wordwoven

## Tiếng phím: đọc từ Typing Feel, không chép vào game

Từ 31/10/2026 (bước B5 của `docs/games/TYPING_FEEL_SERVICE.md` ở repo cha) game **không giữ bộ âm phím nào**. Thư mục `audio/keys/` cũ (34 bộ, 2.744 OGG, 35 manifest) đã xoá, cùng 2.744 dòng `audio/keys` của `media.md5`; các file nằm nguyên byte ở `typing-feel/public/v1/keys/sets/` của repo cha (so trước khi xoá: cả 1.032 md5 khác nhau của 2.744 OGG đều có ở đó).

- Danh mục và các bộ tải lúc chạy từ `<VITE_TYPING_FEEL_ORIGIN>/v1/keys/` (`src/app/keyboard.ts`). Script `build:td` và `dev:td:app` của repo cha đặt biến này; `pnpm dev`, `pnpm build`, `pnpm check` chạy riêng trong repo game thì không có biến: Typing Feel tắt, bảng Sound chỉ còn Off và **Bamboo (original)** (tiếng gõ tổng hợp, nằm trong mã).
- Bảng Sound nhóm bộ theo `family` của danh mục; mặc định lấy từ `default` của danh mục (bản `r1`: Bright Clack).
- Thêm hay đổi bộ âm: làm ở Typing Feel (Admin, `typing-feel/` của repo cha), không sửa game, không đụng `media.md5` của game.

## Nút Settings và Sound (`ui/quick-settings/`)

Tám icon của phiếu 180 và hai ảnh khung/nút `frames-epic` đã có. Mỗi PNG có prompt chính xác cạnh ảnh; JSON khung giữ thông số cắt và tương phản của nguồn. Phiếu 193 không sinh hoặc sửa ảnh.

Phiếu 244 (nhận 31/10, gắn ở `47a1698` và lượt `2026-10-31-panels-art`): cặp rãnh `slider-empty.png` và `slider-fill.png` (1024 × 64) chép từ `art-src/ui/quick-settings/sliders/`; bốn icon `hud-settings.r2.128.png`, `vol-keyboard.r2.128.png`, `vol-interface.r2.128.png`, `vol-keyboard-volume.128.png` chép từ `art-src/ui/quick-settings/selected/`, nguyên byte (md5 khớp nguồn). Game dùng các bản này thay `hud-settings.128.png`, `vol-keyboard.128.png`, `vol-interface.128.png` (ba file cũ vẫn ở đây và trong `media.md5`, không còn được tải). Sáu file 244 chưa có dòng trong `media.md5`; điều phối thêm khi `media:push`.

Thanh trượt (phiếu 225, gắn 31/10): `slider-track.png` (1024 × 64), `slider-track.512.png`, `slider-thumb.png` (1024²), `slider-thumb.256.png`, `.128.png`, `.64.png`, chép nguyên byte từ `art-src/ui/quick-settings/sliders/`; prompt nằm cạnh bản nguồn ở đó. Game dùng `slider-track.png` và `slider-thumb.128.png` (`src/app/quick.ts`). Sáu file này chưa có dòng trong `media.md5` (lúc gắn đang chạy `media:push`); cần thêm rồi `media:push`.

## Git và Drive

PNG và prompt nằm ngoài Git; chỉ README này và các `manifest.json` được cho qua `.gitignore`. Mỗi PNG có một dòng trong `media.md5` của game (cách phiếu 191 làm cho Last Line). `pnpm media:push` ở repo cha kiểm từng dòng trên Drive và đẩy lại file Drive còn thiếu khi máy này có đúng byte, nên máy đang giữ các file này cần chạy `media:push` một lần. Prompt `.prompt.txt` và JSON khung `*.v2.json` cạnh ảnh không phải đuôi media, nên chỉ nằm trên máy và ở nguồn phiếu 180.

# Media của Wordwoven

## Tiếng phím Firefly (`audio/keys/`)

**33 bộ thuộc 7 họ** (Deep 3, Warm 6, Rounded 1, Solid 2, Crisp 7, Clear 4, Bright Clack 10): 32 bộ v2 của phiếu 218 và **Raindrop Tile** (`raindrop-tile`, chủ dự án chọn 30/10/2026, họ Crisp, ngay sau Crisp Silk, `order` 18). Mỗi bộ v2 là thư mục `<id>/` gồm 70–80 `key-NN.ogg`, 8 `space-NN.ogg`, `preview.ogg` (nghe thử 1 giây) và `keys-manifest.json` giữ nguồn, giấy phép và số đo; OGG mono. Raindrop Tile có 17 `key-NN.ogg` (đuôi tự nhiên, dài tới 450 ms), 8 `space-NN.ogg` (tới 535 ms) và `preview.ogg` 1 giây, OGG Vorbis **stereo** 48 kHz; manifest dạng `typing-keys-firefly/2` với `files: [{file, set, durationMs}]` và `preview`. Danh mục gốc `keys-manifest.json` liệt kê `id`, `name`, `family`, `score`, `manifest`, `preview`, `order`; Raindrop Tile có `score: null` và `ownerPick: true` (thước đo 218 trừ điểm phần đuôi dài mà chủ dự án muốn giữ; kit bỏ qua `score` không phải số, không bịa điểm). Tổng **2.710 OGG, 34 manifest JSON, khoảng 27 MB trên đĩa**; không có WAV. File của từng bộ nguyên byte từ `~/AudioLab/review/staging/keys-firefly/` (không chép `.firefly-builder.json`); danh mục gốc cùng nội dung JSON với staging, giữ thụt 2 dấu cách như bản 32 bộ.

- Bảng Sound đọc danh mục qua kit (`loadKeyboardCatalog`) và nhóm theo `family`: tiêu đề họ, PageUp/PageDown nhảy họ, mở bảng thì cuộn tới bộ đang chọn. Thứ tự: Off, **Bamboo (original)** (tiếng gõ tổng hợp cũ, nằm trong mã), rồi các họ theo `order`.
- Mặc định **Bright Clack** (`bright-clack`, tên hiện "Bright Clack Velvet"), theo chủ dự án 30/10/2026. Bảy id cũ (`deep`, `warm`, `rounded`, `solid`, `crisp`, `clear`, `bright-clack`) vẫn còn, nên bản lưu cũ giữ nguyên lựa chọn.
- Kit phát không lặp lại trong 8 lần gõ, giải mã dần từng lô 16 file và nhả bộ cũ khi đổi bộ.

**Làm thêm bộ sau này:** nguồn, lệnh dựng lại từ âm gốc và cách chấm điểm ở `docs/games/audio/KEYS_FIREFLY_HANDOFF.md` của repo cha. Khi staging có bộ mới: thay cả thư mục `audio/keys/` bằng staging (bỏ `.firefly-builder.json` và mọi `.wav`), cập nhật các dòng `public/assets/typing-defense/audio/keys/` trong `media.md5` (bỏ dòng cũ, thêm md5 mỗi OGG), commit manifest JSON cùng `media.md5`, rồi chạy `pnpm media:push` ở repo cha. Không cần sửa mã nếu danh mục giữ đúng dạng trên và còn id `bright-clack`; chỉ sửa số bộ, số theo họ và bộ mới trong khối "33 Firefly sets" của `tests/td-quick.test.ts` (khối này kiểm mỗi file manifest nêu có đúng một dòng `media.md5`).

## Nút Settings và Sound (`ui/quick-settings/`)

Tám icon của phiếu 180 và hai ảnh khung/nút `frames-epic` đã có. Mỗi PNG có prompt chính xác cạnh ảnh; JSON khung giữ thông số cắt và tương phản của nguồn. Phiếu 193 không sinh hoặc sửa ảnh.

## Git và Drive

OGG, PNG và prompt nằm ngoài Git; chỉ README này, `manifest.json` và các `keys-manifest.json` được cho qua `.gitignore`. Mỗi PNG và OGG có một dòng trong `media.md5` của game (cách phiếu 191 làm cho Last Line). `pnpm media:push` ở repo cha kiểm từng dòng trên Drive và đẩy lại file Drive còn thiếu khi máy này có đúng byte, nên máy đang giữ các file này cần chạy `media:push` một lần. Prompt `.prompt.txt` và JSON khung `*.v2.json` cạnh ảnh không phải đuôi media, nên chỉ nằm trên máy và ở nguồn phiếu 180.

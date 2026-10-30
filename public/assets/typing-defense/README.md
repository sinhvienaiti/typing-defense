# Media của Wordwoven · Phiếu 193

`audio/keys/keys-manifest.json` là danh mục gốc Firefly của phiếu 189; bảy thư mục con giữ manifest riêng, mỗi bộ có 10 `key-*.ogg`, 3 `space-*.ogg` và `preview.ogg` dài 1 giây. Tổng cộng **98 OGG và 8 manifest JSON**; không chép WAV. Giữ nguyên byte từ `~/AudioLab/review/staging/keys-firefly/` và thông tin nguồn/giấy phép trong manifest.

Mặc định mới: **Bright Clack** (`bright-clack`), theo quyết định chủ dự án ngày 30/10/2026. Bản lưu đã chọn bộ khác hoặc Off được giữ. Tiếng gõ tổng hợp cũ nằm trong mã, tên chọn **Bamboo (original)**.

`ui/quick-settings/` dùng tám icon của phiếu 180 và hai ảnh khung/nút `frames-epic` đã có. Mỗi PNG có prompt chính xác cạnh ảnh. Phiếu 193 không sinh hoặc sửa ảnh/âm thanh; JSON khung giữ thông số cắt và tương phản của nguồn.

OGG, PNG và prompt nằm ngoài Git; các manifest tiếng phím được cho qua `.gitignore`. Mỗi PNG và OGG có một dòng trong `media.md5` của game (cách phiếu 191 làm cho Last Line). `pnpm media:push` ở repo cha kiểm từng dòng trên Drive và đẩy lại file Drive còn thiếu khi máy này có đúng byte, nên máy đang giữ các file này cần chạy `media:push` một lần. Prompt `.prompt.txt` và JSON khung `*.v2.json` cạnh ảnh không phải đuôi media, nên chỉ nằm trên máy và ở nguồn phiếu 180.

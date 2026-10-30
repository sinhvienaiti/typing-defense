# 2026-10-30 — Wordwoven: 32 bộ tiếng phím Firefly, nhóm theo họ

Chủ dự án giữ 32 bộ trước; làm thêm thì triển khai sau (cách lấy nguồn và dựng lại ghi ở `docs/games/audio/KEYS_FIREFLY_HANDOFF.md` của repo cha và ở `public/assets/typing-defense/README.md`).

- **Kit:** đồng bộ từ bản xuất sạch của repo cha ở `4ae665b2` (`parentDirty: false`), gồm phiếu 219 (danh sách bàn phím nhóm theo họ, tiêu đề, PageUp/PageDown, cuộn tới bộ đang chọn; không lặp lại trong 8 lần gõ; giải mã dần; nhả bộ cũ khi đổi) và phiếu 198 (kho file âm từ manifest v2). Không sửa tay `src/kit/`.
- **Media:** `public/assets/typing-defense/audio/keys/` thay bảy bộ của phiếu 193 bằng 32 bộ thuộc 7 họ từ `~/AudioLab/review/staging/keys-firefly/`: mỗi bộ 70–80 phím, 8 phím cách, `preview.ogg` 1 giây; 2.684 OGG, 33 manifest, khoảng 26 MB, không WAV. 33 manifest JSON vào Git; 2.684 dòng OGG vào `media.md5`.
- **Bảng Sound:** Off, Bamboo (original), rồi bảy họ theo thứ tự danh mục. Mặc định vẫn `bright-clack` ("Bright Clack Velvet"); bảy id cũ còn nguyên nên bản lưu cũ không đổi.
- **Không đổi mã game.** Kiểm bằng parser của kit: 34 lựa chọn, 32 bộ đủ phím, phím cách và preview, không thiếu file.

Kiểm: `pnpm check` xanh (kit 72/72, 370 test, build; gói "/" 80,28 kB gzip ≤ 85 kB, chunk `quick` 16,30 kB), hai ván vàng giữ nguyên. Chưa nghe và chưa xem trong trình duyệt: điều phối kiểm sau. Media chưa đẩy lên Drive: máy này chạy `pnpm media:push` ở repo cha.

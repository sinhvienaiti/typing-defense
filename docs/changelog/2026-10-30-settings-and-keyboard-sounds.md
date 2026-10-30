# 2026-10-30 — Wordwoven: Settings, Sound và tiếng phím trong trận

Phiếu 193, tiếp tục phần dở trên nhánh `td-keys`. Gắn hai nút ảnh phiếu 180 ở góc phải trên màn tựa và trận; bảng dùng kit quick-settings, mở bằng chuột/F1/F2, Esc đóng. Bảng và đếm 3–2–1 dừng session, chặn chữ/lệnh chiến thuật, giữ trạng thái dừng cũ. Thẻ chữ tránh vùng nút; bảng dạy và sandbox nằm thấp hơn.

Sound nối Master/Mute, Music, Effects, Interface và tiếng phím vào luồng thật. Interface và tiếng gõ cũ tách khỏi Effects. Firefly có bảy bộ phiếu 189, danh mục/nghe thử kit 190; mặc định **Bright Clack** theo quyết định chủ dự án ngày 30/10. Hover/focus nghe 1 giây; `key-*`/`space-*` phát ở thẻ gọi và ô nhập chữ, theo Master × Keyboard volume. Có Off và **Bamboo (original)** để giữ âm cũ. Mọi thay đổi lưu trong `td.settings`.

Settings giữ nhịp tự điều và chế độ truyện, áp dụng ván mới; không thêm công tắc giả. Ẩn Voice vì chưa có kênh giọng. Media có 98 OGG và 8 manifest, không WAV; icon/khung/nút dùng ảnh và prompt sẵn có. Track/thumb slider còn dùng range native vì chưa có ảnh riêng; chờ Claude duyệt phần hình.

Kiểm cục bộ: kit 69/69 file khớp, typecheck sạch, 175 assertion bằng DOM/WebAudio giả qua; media khớp nguồn, 108 binary bị Git bỏ qua. Hai golden giữ nguyên byte; cùng lệnh/tick cho cùng hash trong đối chứng dừng trình bày. Không chạy build, bộ test game/golden hoặc trình duyệt theo house rules; chưa nhận bố cục, âm thực và ngân sách gzip. Chi tiết và media chờ tải ở `docs/codex-queue/193-report.md`; Claude chạy `media:push`, công cụ mới cập nhật `media.md5` sau khi tải thành công. Không sửa sim hoặc kit.

**Claude nhận (30/10):** đọc diff, `pnpm check` xanh (kit 69/69, 370 test, build, ngân sách gói "/" 80,27 kB gzip ≤ 85 kB, chunk `quick` 15,26 kB), hai ván vàng giữ nguyên (`td:golden:check` same). Thêm 10 dòng PNG `ui/quick-settings/` vào `media.md5` theo cách phiếu 191; `media:push` tự đẩy lại file Drive còn thiếu. Bảy bộ tiếng phím của phiếu này được thay bằng 32 bộ ở commit sau (`2026-10-30-keyboard-sets-32.md`), nên manifest bảy bộ không vào Git. Chưa nghe và chưa xem trong trình duyệt: điều phối kiểm sau.

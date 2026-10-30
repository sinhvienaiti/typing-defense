# 2026-10-30 — Wordwoven: sửa theo phản biện tiếng phím (32 bộ Firefly)

Nhánh `td-keys`, sau hai commit `0a63df2` (phiếu 193) và `023b995` (32 bộ). Chỉ sửa hành vi mã của game. Danh sách bộ, file âm thanh, manifest từng bộ và `src/kit/**` giữ nguyên.

Các mục phản biện đã sửa:

1. **Trung bình, chữ sai và chữ lạc mất tiếng riêng khi chọn bộ Firefly.** Trước đây phím chữ phát `key` ngay lúc nhấn, nên chữ sai nghe giống chữ đúng. Bây giờ tiếng của chữ đi theo kết quả bộ định tuyến (`wordKey`): `GameQuick.read` phát `key`, `wrong` hoặc `stray` của kit (`TYPING_SOUND_MAP`, mức 0,55 / 0,42 / 0,32). Cả ba lấy từ file của bộ đang chọn, không dùng âm tổng hợp. `installKeys` thôi gọi `typed` cho chữ. `typed` vẫn lo dấu cách giữa hai từ, Backspace và ô nhập chữ. Bamboo vẫn do `audio-min` phát như cũ.
2. **Trung bình, thiếu test cho Settings/Sound (phiếu 192/193).** Thêm `tests/td-quick.test.ts`, 17 test chạy trên Happy DOM với WebAudio giả: `applyQuick` và giá trị lưu, F1/F2/Esc, nút góc và nút đóng, Quit không đếm ngược, chặn chữ khi bảng mở, session đứng yên trong lúc mở và cả lúc đếm 3–2–1 (hash, tick, log không đổi), định tuyến phím như `main.ts`, ô nhập chữ, Bamboo và Off. Thêm `happy-dom` 21.0.4 vào devDependencies, cùng bản Dragonhold đang dùng.
3. **Thấp, id bàn phím đã lưu nhưng không có trong danh mục.** Game sửa id trước khi kit đọc: danh mục tải được thì về **Bright Clack** (`DEFAULT_KEYBOARD_SOUND`) và lưu lại, không về Bamboo. Danh mục không tải được thì giữ id đã lưu, hiện "Saved sound · unavailable" (bị khóa) và không ghi đè. Như vậy một lần tải hỏng không làm mất lựa chọn của người chơi.
4. **Thấp, bộ đã lưu chỉ kêu khi giải mã xong cả bộ.** Lúc khởi động, bộ đã lưu kêu ngay từ lô giải mã đầu tiên (16 file, như Dragonhold). Nếu người chơi chọn bộ khác trước khi bộ cũ tải xong, lần tải đó bị hủy và bộ đệm của nó được giải phóng, không giữ đến khi tải lại trang.
5. **Thấp, chú thích bị cắt.** Khôi phục chú thích đầu file của `main.ts`, `view/audio-min.ts`, `app/input.ts`, `app/prefs.ts` theo bản trước `0a63df2`, có thêm một câu về hai bảng mới. Bốn khối JSDoc từng bị gộp thành một dòng hơn 250 ký tự được tách lại thành nhiều dòng.

Kiểm: `pnpm check` xanh (kit 72/72, 387 test gồm 17 test mới, tsc, build). Gói "/" 80,27 kB gzip ≤ 85 kB, chunk `quick` 16,56 kB. `td:golden:check` cho kết quả same cho cả hai ván. Test mới fail trước khi sửa (thiếu `read`, id lạ về `bamboo`, bộ cũ vẫn giải mã sau khi đổi bộ) và qua sau khi sửa.

Còn mở: số dòng `src` ngoài kit lên **10.620**, vượt trần 10.500 (`BUILD_1B`) vì khôi phục chú thích theo phản biện. Trần này cần chủ dự án nâng, hoặc chọn chỗ cắt khác. Chưa nghe thử và chưa mở trình duyệt; điều phối sẽ kiểm sau.

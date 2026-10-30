# Wordwoven · Gắn ảnh màn tựa và thẻ kết (phiếu 200)

Ngày 30/10/2026, nhánh `td-ui`, nền `2a1f61d`.

Đã gắn WW-01 (logo dòng nạp), WW-02 (favicon PNG 32/64 từ huy hiệu 113, dùng tạm tới phiếu 177), WW-03 (nền 158 bản `title-backdrop.v2`, cắt `1536x864+0+80`), WW-08 (logo 113 rộng 45% cửa sổ) và WW-56 (crest, banner, divider 115 trên thẻ kết). Menu giữ vị trí cũ, góc trên phải dành cho phiếu 193. Không đổi tranh nguồn, màu ruộng hay luật chơi.

`scripts/td/ui-picks.json` ghi nguồn, điểm nhận và kích thước; `prepare-ui.mjs` chỉ cắt, đệm alpha, thu nhỏ và nén, không ghi đè media có sẵn. Đã xuất 16 file vào thư mục UI dùng chung. `src/ui/art.ts` tập trung URL, srcset và xử lý lỗi: cảnh báo có tên/URL, ẩn ảnh; logo hiện chữ Wordwoven khi lỗi. Ảnh thẻ kết chỉ được tạo khi mở kết quả, trang trí không đọc bởi trình đọc màn hình. Crest thua dùng bộ lọc CSS trên toàn ảnh. Thẻ tạm dừng giữ nguyên.

Lượt chạy lại 30/10 theo chỉ thị điều phối 12:58: **`pnpm check` exit 0**, kit 42/42 file khớp, **43 file test / 405 test qua**, TypeScript và build qua. Gói khởi động `/` trước/sau **81.583 → 82.314 byte gzip**, tăng 731 byte, còn dư 2.686 byte dưới trần 85.000. Mốc trước lấy từ mã `2a1f61d` giải nén bằng `git archive` trong `tmp/`, build cùng dependency hiện có. Golden **2/2 không đổi**, `prepare-ui --check` exit 0, lượt xuất lại ghi **0 file / 16 fresh**, md5 sáu nguồn và 16 media không đổi. Hai nền lần lượt 256.422 và 332.700 byte. Đã xem lại đủ bốn nhóm mock tĩnh; kịch bản `td-theme` chỉ sửa, chưa chạy theo phạm vi phiếu.

Phần kiểm bắt buộc của Codex đã đạt. Claude cần kiểm trình duyệt ở 1280 × 720 và 1920 × 1080, nhất là thẻ thắng có đủ năm từ ôn và không cuộn, cùng nhận diện crest thua; duyệt diff, `media:push`, rồi commit. Favicon tạm chờ 177; icon sao WW-57, bảng 115, tranh 183 và nút Settings/loa 193 thuộc phiếu khác. Báo cáo và danh sách md5 nằm ở `docs/codex-queue/200-report.md` và `docs/codex-queue/200/` trong repo cha.

## Sửa sau kiểm lại 232 (Claude, 30/10)

- **F1 (P1):** tiêu đề thẻ kết bỏ chiều cao cố định 84/56 px và gạch son `h2::after` kế thừa; hộp cao theo banner (84,15 px, hay 74,25 px khi cao ≤ 800 px), không còn tràn ~26 px đè lên sao hay dòng gợi ý. Thẻ thắng 720p ước tính còn khoảng 100 px dưới trần cao, chưa đo trình duyệt.
- **F2:** chữ tiêu đề mặc định màu mực; chỉ chuyển kem khi banner tải xong (lớp `has-banner` từ `bindArt`), banner lỗi thì gỡ lớp.
- Test mới trong `tests/td-ui-art.test.ts`; `td-theme` kiểm thêm `resultHeading` (không tràn, không gạch son, đáy banner ≤ đỉnh dòng sau, `has-banner` khớp banner đã tải).

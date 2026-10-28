# 2026-10-29 — Wordwoven: chuyển chữ hiển thị sang tiếng Anh (phiếu 132)

Theo quyết định của chủ dự án tối 28/10, đổi màn tựa, cài đặt, hồ sơ gõ, HUD, tạm dừng, kết quả, thẻ lời gọi, bảng dạy và hộp cát sang tiếng Anh. Tên game là **Wordwoven** trên màn tựa, HUD và `<title>`; trang khai báo `lang="en"`. Dịch cả lời Mộc Tinh và lời dạy của Bà Cú Mực. Danh từ thực thể theo `docs/games/NAMES_EN.md` ở repo cha; các tên riêng Mộc Tinh, Bà Cú Mực, Chấm, Phẩy, Gạch giữ nguyên. Nghĩa từ `vi` và chỗ hiện nghĩa không đổi.

Chỉ đổi chuỗi hiển thị và viết tắt `view.short`. Bảy lời khuyên tiếng Việt từng lấy từ kit được thay bằng bảng tiếng Anh ở `ui/profile.ts`, vẫn dùng cùng `AdviceId` và `skillAdvice`. Không sửa kit, sim, quy tắc, số, id, khóa lưu, event hay golden. Năm test cũ đổi kỳ vọng chuỗi; thêm `tests/english-ui.test.ts` quét literal/template TypeScript bằng AST, chuỗi CSS và nhãn HTML. Không loại cả file hiện nghĩa từ khỏi test.

**Chưa đóng phiếu:** còn 16 literal UI tiếng Việt trong `src/main.ts`, nằm ngoài phạm vi được phép ghi. Test quét giữ nguyên việc bắt chúng; đã hỏi chủ dự án mở phạm vi. Một số từ ngắn và mảnh template vẫn dài quá 20%, có cờ trong bảng duyệt. Không chạy lại build/test khi house rules còn cấm; chưa kiểm tràn chữ bằng trình duyệt (phiếu cấm trình duyệt). Báo cáo, ba bảng và các log kế thừa nằm tại repo cha `docs/codex-queue/132-report.md` và `docs/codex-queue/132/`; Claude tiếp tục duyệt câu chữ và hai cỡ 1280/1920 sau khi xử lý các vướng mắc.

## Claude duyệt (29/10)

Đóng các mục Codex để ngỏ và duyệt lại chữ:

- **`src/main.ts`:** dịch đủ 16 literal (thông báo tải lỗi, tạm dừng chiến thuật, cảnh báo bộ gõ, Wood thừa, từ dự phòng). Phép so `startsWith("Đã lưu")` đổi theo câu mới `Saved the playtest file; numbers copied` (`startsWith("Saved")`), không đổi luồng.
- **Tên riêng:** test quét có danh sách `PROPER_NAMES` có chú thích, đúng sáu tên Draconis, Mộc Tinh, Bà Cú Mực, Chấm, Phẩy, Gạch; chỉ đúng chuỗi tên được bỏ qua. Test thêm ca phải đỏ (`Mộc Tinh choáng`, `Chậm`, `Mộc`, `Bà Cú`, `Gạch đá`). Đột biến trong `src/ui/hud.ts`: `"Bắt đầu"`, `"Mộc Tinh choáng"`, `"Văn Điền"` đều làm test đỏ; khôi phục thì xanh.
- **Con dấu màn tựa:** Codex đổi chữ con dấu vẽ bằng mã thành `Word Ward`. Theo điều phối viên, các trang trí vẽ bằng mã (cảnh SVG, cò, dây đèn lồng, đom đóm, con dấu) không nhận chữ tiếng Anh mới và sẽ bỏ khi tranh màn tựa của phiếu 113 về: trả lại `Văn Điền`. Test chỉ miễn đúng chuỗi markup con dấu đó trong `src/ui/title.ts` (`TITLE_SEAL`), ở file khác vẫn đỏ.
- **Mã viết tắt:** `view.short` của Gold Mine (`G`) trùng `G` của Gạch trên thanh đội (Gạch đi tới mỏ hiện `G` + huy hiệu `G`); đổi Gold Mine thành `GM`. Các mã khác không trùng nhau. Chỉ đổi mã hiển thị: golden `td:golden:check` cả hai cảnh `same: true`, nội dung `f2a21037`, deck `9c9b91d8`.
- **Câu chữ:** `Boost Fort` → `Upgrade Fort` (cùng nút Upgrade), `Day 3` → `opens Day 3`, `New Chấm` → `Unlocks Chấm`, `Grow` → `Growing`, `Tap again: sell` → `Click again to sell`, lời Mộc Tinh `What's my name?` → `Where is my name?` (đúng truyện: nó mất tên), các toast từ chối viết đủ câu (`Too close to the road`, `A tree is in the way`, `Night can only be called by day`…), `Title` → `Title screen`, `Best new` → `New best`, `Save playtest` → `Copy playtest data`, `Poor` → `Sloppy`, `Broken!` → `Shield broken!`, `−1 lives` → `−1 life`, nhãn hồ sơ thống nhất với Last Line (`New-word read`, `Steadiness`). Bỏ chú thích tên trong ngoặc ở mô tả nhà (`(Archer Tower) Hits…`) vì tên đã có ngay trên dòng. Thẻ ôn `R` → `Review`. Hộp cát: `Add` → `Stock`/`Spawn`.
- **Kiểu Mỹ:** số thập phân dấu chấm (`×1.00`, `1.2 s`, `0.75×`), phần trăm liền số (`95%`, `Ultimate 45%`).
- **Trình duyệt (bản build, 1280×720 và 1920×1080):** màn tựa, cài đặt, hồ sơ, HUD ngày 1, thẻ Xây, thẻ Fort, thẻ chữ ban đêm, tạm dừng, hộp cát, thẻ boss và lời dạy Ngày 5, kết quả thua. Không có chữ tràn hay bị cắt.
- `pnpm check` xanh: 36 file, 370 test; kit 31 file khớp; gói khởi động 82,43/85 kB gzip. Test thời gian `td-lanes` (≤ 0,3 ms) đỏ một lần khi máy tải nặng (0,303 ms), chạy riêng ba lần đều xanh.
- Còn lại, không sửa: tên file tải về của nút chép số chơi thử vẫn là `loi-goi-choi-thu-…json` (`src/app/retry.ts`), là tên file dữ liệu chơi thử chứ không phải chữ trên màn hình.


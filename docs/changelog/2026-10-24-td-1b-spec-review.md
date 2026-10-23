# 2026-10-24 — Lời Gọi 1B: phản biện đặc tả "Mộc Tinh tới làng"

Commit: nhánh `main` của repo `games/typing-defense`, xem `git log`. Chưa đẩy lên. Chỉ sửa tài liệu: không đổi mã, không đổi luật đang chạy, file vàng giữ nguyên, nên không chạy lại `pnpm td:balance` (số cân bằng hiện tại vẫn là của `2026-10-23-balance.md`).

## Yêu cầu

- Phản biện `docs/td/BUILD_1B.md` (commit `61ee44d`) như một trưởng thiết kế khó tính. So với các nguồn spec dẫn (TK, BUILD_NOTES §6, `docs/games/BALANCE.md` ở repo cha), với mã hiện tại, và với các yêu cầu của chủ dự án: vui, không chán; chiến thuật có nghĩa; học luôn rõ; chuyển động và hiệu ứng đẹp do AI làm; không quá tải chú ý.
- Sửa ngay trong spec mọi vấn đề mức cao và vừa.

## Đã làm

- `docs/td/BUILD_1B.md`: tìm ra 21 vấn đề (4 cao, 10 vừa, 7 thấp), sửa cả 21. Bảng đủ ở §25 mới. Chính:
  - **Không gõ vẫn hạ được boss:** chỉ cần thả Draconis đuổi theo boss (~1.900 sát thương, quá 1.600 máu phải gỡ). Thêm luật Vỏ dày: Draconis tự đánh boss chỉ gây ×0,5. Thêm bot `heroKite` vào B5.
  - **Cổng chặt không đạt được về thống kê:** 12 ô, mỗi ô 120 seed, chỉ cùng đạt ~16 % dù số thật đúng tâm. Đích chặt giờ đo trên hai bộ seed gộp lại (240 ván mỗi bot); từng bộ giữ dải BALANCE §3.
  - **Chơi lại Ngày n** ở R1: chạy lại nhật ký lệnh tới đầu Ngày n rồi so mã băm. Thua ở boss không còn phải chơi lại 10 phút đầu.
  - **Số Tối Thượng (R2) gấp ~3 lần cổng:** sửa còn lông 25 sát thương, boss nhận ×0,25, Cháy của Tối Thượng không lên boss. G5 tính ≤ 15 % cả ải, theo BALANCE §9.1.
  - **Nhánh boss đi báo từ đầu Ngày 5** bằng mạch rễ vẽ trên nhánh đó. Boss trồi ở ngã ba sau 12 s vết nứt bò, bỏ ~22 s đi không. Thêm cổng G8 chống đoạn chờ không ở đỉnh boss.
  - **Rễ Trồi:** chỉ làm tê, không trừ máu nhà. Lời gọi của nhà đang tê vẫn bắn. Cú choáng xóa mọi tê. Có cách đáp bằng chỗ đặt tháp, kèm test dữ liệu giữ cách đó. Thêm bảng "Đòn nào, làm gì".
  - **Dồn lửa** theo trần SÁNG, vòng giúp và ngân sách. Dải chữ đặt dưới thanh boss. Luật thứ tự lớp: thẻ chữ luôn trên cùng.
  - **Lúc lặng** chỉ chặn lời gọi kinh tế và Hỏi bài, Bắn mạnh vẫn chạy.
  - **Đưa sang R1:** lịch mở theo ngày, hai hàng boss của bảng dạy, đà và nảy của boss.
  - **G3** có núm là tốc boss.
  - **Trần dòng:** R1 8.850, R2 10.000; cả 1B vẫn 10.500.
  - **Món nhỏ:**
    - Nút "Chép số chơi thử" cho B9.
    - Gợi ý thua chọn theo số của ván.
    - "Từ cần ôn" ở màn kết.
    - Bỏ Mảnh Chữ lúc rút.
    - Ngày 3: tối đa 2 câu tự hiện.
    - Hộp cát giữ đợt 6.
    - Ghi rõ `upgrade` id 0 và `sell`.

## Mục review đã xử lý

- Phản biện spec 1B, 24/10/2026: mục 1–21 ở `BUILD_1B.md` §25.

## Kiểm tra

- Kiểm cột của mọi bảng trong spec bằng script: không lệch.
- Không đổi mã nên không có test hay số cân bằng mới.

## Còn lại

- R1 phải đo lại máu boss khi đã có Vỏ dày, Rễ Trồi, choáng và chỗ trồi mới (§6.5 bước 0).
- Biên S còn lệch giữa bot Mới và Chậm chắc.
- Chưa biết `heroKite` có thật thua ở Cân bằng không.
- G8 với bố cục của bot Kém chưa đo.

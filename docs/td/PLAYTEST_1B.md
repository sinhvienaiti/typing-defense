# Gói chơi thử bản đồ 1 cho chủ dự án (BUILD_1B §22, cổng B9)

> **Dành cho:** chủ dự án (người chơi), điều phối viên (người chấm B9).
> **Viết:** 26/10/2026, R3 phần B. **Nguồn:** `BUILD_1B.md` §22 (11 câu hỏi), §18.3 (B9), `docs/games/BALANCE.md` §7 (repo cha).
> **Thời gian:** khoảng 30 phút chơi, 5 phút điền phiếu.

## 1. Vì sao có buổi này

- B9 "Khớp người thật" là cổng duy nhất bot không tự đo được. Bot gõ theo E, a, CV của một người; B9 hỏi: người thật có số giống bot cùng hồ sơ không (lệch ≤ 15 % ở S, P, I, O, N, Q).
- Nếu lệch, mọi số cân bằng của bot (B1–B8) đang đo sai người chơi thật. Đây là lý do buổi chơi thử phải có số, không chỉ có cảm nhận.
- Câu hỏi §22 đo điều số không đo được: có thấy lời báo không, thua có công bằng không, câu dạy có dễ hiểu không.

## 2. Chuẩn bị (5 phút)

| Bước | Làm gì | Vì sao |
|---|---|---|
| 1 | Mở game từ **bản dựng**: trong bản chơi thử `games/.wt-play-typing-defense` (worktree ở commit đã push, không agent nào sửa; điều phối viên đưa nó lên commit mới nhất) chạy `pnpm install --frozen-lockfile && pnpm build && pnpm preview` rồi vào `http://127.0.0.1:3006/` (cổng 3006 phải trống). Không dùng `pnpm dev` của cây đang sửa | Máy chủ dev tải lại trang mỗi lần agent lưu file, ván đang chơi mất (chủ dự án gặp ngày 26/10) |
| 2 | Cửa sổ 1280 × 720: Chrome → `⌥⌘I` → nút thiết bị (`⇧⌘M`) → Responsive, gõ 1280 và 720; đóng bảng DevTools sang bên | §22 chấm chữ và thẻ ở 1280 × 720 |
| 3 | Màn đầu → **Cài đặt** → "Nhịp tự điều" **Bật**, "Chế độ (truyện)" **Cân bằng** → Esc | Bot của B9 chạy đúng hai thiết lập này |
| 4 | Không cần mở bảng điều khiển trình duyệt, không cần xoá dữ liệu cũ | Hồ sơ gõ cũ giúp game đo đúng hơn |

## 3. Chơi (khoảng 30 phút)

1. **Một ván đủ bản đồ 1** (khoảng 12 phút): màn đầu → "Bắt đầu". Chơi như bình thường tới khi thắng hay thua.
2. Thua thì bấm **"Chơi lại Ngày 5"** (hay Ngày n) và chơi tiếp một lần.
3. **Chơi lại Ngày 5, cố ý để boss tới Lũy** (bán bớt tháp ở khúc nhập) để biết cảm giác Lũy bị đập (câu 7).
4. Trong lúc chơi: nâng một tháp, bán một nhà (bấm hai lần), nâng Lũy lên 2 rồi 3 (câu 8); bấm `=` lúc đông quái (câu 9).
5. Tùy chọn (5 phút): `http://127.0.0.1:3006/?sandbox=1` → bảng Hộp cát → "Đặt sẵn", rồi hàng "Gọi": **Đầu Đàn** (đi cùng 5 Cương Thi, chữ ⚓ Neo trên đầu: gõ được thì cả bầy đứng sững 3 s) và **Troll** (vòm đá xám quanh nó, chữ 🛡️ Phá Khiên: gõ được thì vòm vỡ). Hai quái này chỉ có ở hộp cát (R3). Từ đợt test 27/10 hai chiêu này chỉ bật khi quái vào vòng giúp (Draconis 14 m), nên chữ sáng ngay: để Draconis đứng giữa hai tháp, hoặc chờ bầy tới gần Lũy. Nút **Tanuki** gọi thêm 8 Cương Thi đi sau 6 s: ở chỗ tháp chúng đuổi kịp nó và nó đánh trống (chữ ✋ Ngắt). Hàng "Ngày" nhảy sang Ngày 2–5 hay gọi Boss.

**Sau mỗi ván** (thắng, thua, cả ván "Chơi lại Ngày n"): ở thẻ kết bấm **"Chép số chơi thử"**.

- Trình duyệt lưu một file `wordwoven-playtest-s<seed>-n<ngày>-<tick>.json` vào thư mục Tải về (Downloads); cùng nội dung được chép vào bộ nhớ tạm. File cũ `loi-goi-choi-thu-*.json` vẫn được `scripts/td/b9.ts` đọc khi truyền đường dẫn như trước.
- Không cần mở hay dán file. Gửi lại các file đó cùng phiếu ở §4.
- File có: số đo của ván (`numbers`: FlowMeter, hồ sơ gõ game giữ, thống kê, mạng còn) và nhật ký ván (`run`: đầu ván, mọi phím và lệnh). Nhật ký để điều phối viên chạy lại ván trên Node ra đúng mã băm, chứng minh số đo là của chính ván đó. Không có dữ liệu nào ngoài cách gõ trong ván.

## 4. Phiếu trả lời (chép phần này vào tin nhắn hay file gửi lại)

```
Ván 1: thắng / thua · còn ___ mạng · ___ sao
2. Ngày 5: thấy báo Mộc Tinh và mạch rễ trên nhánh nó đi? ___ Có làm gì khác vì lời báo? ___
3. Đêm 5: thấy 12 s lặng, đếm ngược, vết nứt bò tới ngã ba? ___ Lúc boss đi tới tháp đầu có thấy chờ lâu? ___
4. Rễ Trồi: vòng đỏ có hiểu là "nhà này sắp bị tê"? ___ Đủ thời gian nhận ra? ___
   (R3) Rễ hút sinh khí: thấy rễ bò về Lũy và "−1 mạng" mỗi 30 s? ___ Có hiểu là phải hạ boss nhanh? ___ Thấy bị phạt oan? ___
5. Boss choáng (70 %): thấy dải chữ và lời gọi Dồn lửa? ___ Gõ kịp? ___ Hiệu ứng nào che chữ? ___
6. Nếu thua: hiểu vì sao thua (dòng gợi ý đúng?) ___ Thua công bằng? ___ "Chơi lại Ngày 5" có muốn chơi tiếp? ___
7. Để boss tới Lũy: cảm giác lúc Lũy bị đập? ___
8. Nâng tháp, bán nhà, nâng Lũy: giá rõ? ___ Chấm, Phẩy ra có thấy? ___
9. `=` lúc đông quái và gõ Chữ Chiêu: thấy mưa to hơn? ___ Ngắt Tanuki: thấy chữ trên đầu nó kịp? ___
10. (R3) Nhớ được từ nào? ___ Thấy từ Ôn (thẻ viền xanh ngọc) quay lại? ___ Câu Bà Cú Mực ngắn, dễ hiểu? ___
11. Lúc nào căng nhất? ___ Lúc nào chán? ___ Có lúc bị giữ chặt ở thẻ chữ? ___
(Tùy chọn) Đầu Đàn, Troll ở hộp cát: đọc được vòm và cờ không? Gõ Neo, Phá Khiên có đáng không? ___
```

## 5. Điều phối viên chấm B9

```bash
cd games/typing-defense
node --import tsx scripts/td/b9.ts ~/Downloads/wordwoven-playtest-*.json --seeds=40
```

- Mỗi file: chạy lại nhật ký trên Node (cột "Chạy lại trên Node" phải là "khớp" kèm mã băm), rồi một bot gõ đúng E, a, CV game đo được của chủ dự án (thói quen còn lại của bot Chuẩn, chiến thuật Vừa, Học khởi động lạnh) chơi cùng ải, cùng chế độ, cùng thiết lập nhịp trên 40 seed. Mã nguồn: `tests/td/b9.ts`.
- Bảng in: kết quả, mạng, S, P, I, O, N, Q của người; thắng, S, P, I, O, N, Q của bot; rồi cổng B9 của kit (lệch ≤ 15 % của max(|người|, sàn); sàn 20 % cho tỉ lệ, 1 cho N). File không chạy lại khớp thì không vào B9 và lệnh trả mã 1.
- Ghi số vào `BUILD_NOTES.md` (mục R3 hay mục kế) cùng câu trả lời của phiếu; câu nào chỉ ra lỗi thì thành việc của vòng sau.
- File cũ (trước R3 phần B, chỉ có số) vẫn đọc được: không có nhật ký thì cột chạy lại ghi "không có nhật ký", vẫn chấm.
- File của ván hộp cát (bước 5 ở §3, hay bấm nút ở hộp cát) vẫn được chạy lại, nhưng cột bot ghi "hộp cát: không chấm B9" và file không vào cổng. Lý do: ván hộp cát có "Đặt sẵn", gọi quái, đổi tốc, nên không có ải nào để bot chơi cùng; đem so thì B9 trượt oan (thử trên Mac với file `td-1b-tour` bắt được: Biên S 100 % / 78 %, P 5,4 % / 18 %).

## 6. Ảnh tham khảo (không cần chụp lại)

`scripts/visual/scenarios/td-1b-tour.mjs` chụp 19 ảnh theo thứ tự người chơi gặp: Ngày 5 có báo boss, lặng trước bão, trồi, Rễ Trồi báo và trúng, Tối Thượng, choáng, Mầm Gỗ, rút, thẻ thắng; Ngắt, Neo, bầy đứng sững, Phá Khiên, vòm vỡ; Từ Ôn, "Chuộc lại"; câu Bà Cú Mực và chip. Ảnh ở `tmp/mac-2026-10-25/r3b2/td-1b-tour-*` của game (ngoài Git).

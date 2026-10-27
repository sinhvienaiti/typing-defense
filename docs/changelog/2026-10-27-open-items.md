# 2026-10-27 — Lời Gọi: các việc còn mở sau đợt test

Chủ dự án, 27/10/2026: điều phối viên (Claude) quyết các việc còn mở của Lời Gọi, làn này làm; chỉ việc nào chặn mới trả về chủ dự án. Đổi nào làm hỏng một cổng thì không giữ, ghi số lại cho chủ dự án. Nguồn: `docs/changelog/2026-10-27-test-pass.md` (dòng 1, 4, 8, 10, 14, 15, 18–21, 26, 27, 30, 32; "Đêm 4: các biến thể đã đo"; "Còn mở"; "Kiểm lại trên trình duyệt (phiếu 019)"), `docs/td/BUILD_NOTES.md` §7.9–7.10, `docs/td/BUILD_1A6.md` §12, `docs/td/R3_PLAN.md`, `docs/td/TYPING_DEFENSE_DESIGN.md`, `docs/games/BALANCE.md` §3, §7 ở repo cha.

Luật của làn: mỗi bước một nhánh từ `main`, giữ thì `git merge --ff-only`; gói "/" ≤ 85 kB gzip và trần 10.500 dòng `.ts` ở mọi commit; việc nặng qua `heavy.sh`; báo đủ chỉ số từng bot (Thắng / S / P / I / O / N / Q, B1–B9, cổng §12 4, 5a, 5b, 5c, 6, 7, dải chặt 78–88 %), trước → sau; một đổi chỉ giữ khi đạt mục tiêu và không cổng nào đang đạt bị trượt, tối đa hai biến thể trong hướng đã định. Mỗi bước thêm một mục dưới đây.

## Bước A1: các đêm và boss

Làm trên **Mac mini M4** (Node v24.22, Chrome macOS có GPU), máy dùng chung với các làn khác. Bằng chứng ngoài Git: `games/typing-defense/tmp/mac-2026-10-27/open/a1-nights/` (đầu dò `*.ts`, kịch bản đo `measure.sh`, `sweep.sh`, `n3grid.sh`, `n4grid.sh`, số ở `runs/`, ảnh ở `browser/`). Lần chạy đầu của bước này bị cắt (hết lượt dùng) trước khi báo, để lại trên nhánh `a1-boss-phase` phần kẹp pha 2 chưa commit; lượt này đọc lại, giữ phần đúng (đo lại từ đầu, không tin số cũ), sửa một chỗ hở của nó (dưới) và làm nốt.

Cách đo, trước và sau mỗi việc: bảng từng pha Ngày/Đêm 1–5 (bot chuẩn BALANCE §6, seed 25–48, ba chế độ, như đợt test làm, `pernight.ts`), `td:balance` 40 × 2 seed (seed 1–80, đủ ba chế độ, hồ sơ và §12 trên 5 seed), cổng §12 trên 20 seed (`--stage-seeds=12 --stage-sets=1 --seeds=20 --nights=4`). Dò nhanh giữa chừng: `td:balance --quick` Cân bằng 40 × 2 cùng bảng từng đêm Cân bằng. "Trước" là `e3c2d7f` (đo lại lúc 15:54, giống từng ô bảng của đợt test).

### Quyết định và kết quả

| Việc | Quyết định (điều phối viên) | Đã làm | Giữ? |
|---|---|---|---|
| 4. Pha 2 (Mầm Gỗ) bị bỏ qua (dòng 26) | Dồn lửa lúc choáng không được đưa boss qua một mốc pha trong một lần: sát thương dừng ở mốc, pha 2 luôn diễn ra | Ở pha 1 một đòn chỉ đưa máu tới đúng vạch 70 % (rồi choáng); ở pha 2 máu dừng ngay trên 50 % tới hết tick lứa Mầm Gỗ đầu tiên mọc (3 s + 0,8 s báo sau choáng). Đòn bị chặn hết không hiện số 0 | **Giữ** (`b0e10d7`, sửa chỗ hở `84d0ac1`) |
| 2. Thuồng Luồng lọt Lũy lúc lặng Đêm 5 (dòng 8) | Đồng hồ lặng đứng yên khi còn quái nặng trong tầm của Lũy; tầm lấy từ bản đồ | Tầm là **đoạn đường chung từ khúc nhập (0, 12) tới Lũy, 37,3 m** ở bản đồ 1 (`mergeM` của boss đã có): qua khúc nhập hai nhánh là một, chỉ còn nhà ở khúc nhập và Lũy chắn; Thuồng Luồng (1,9 m/s) đi hết đoạn này ~20 s, dài hơn lặng 12 s cộng 6 s trồi, nên con nào đã qua khúc nhập lúc lặng bắt đầu là con tới Lũy cùng boss. Quái nặng = lọt > 1 mạng, không phải boss. Thanh boss ghi "Mộc Tinh tới sau N s · chờ quái gần Lũy", N đứng yên | **Giữ** (`b14fa42`) |
| 1. Đêm 4 quá nhàn (dòng 4, 14) | Lấy đợt H (T3, TL1, CT9, TL1, CT10, MT2), cùng lúc bù Đêm 5 cho Ẩu, giữ dải chặt cho cả sáu bot gõ; trống Tanuki phải có cái để chống | H làm **hỏng cổng 4** (bot không gõ thua Đêm 4 ở 6/20 seed): không giữ. Biến thể thứ hai trong cùng hướng: T3, TL1, CT9, **MT2, CT4, MT2** (Thuồng Luồng thứ hai là thứ giết bot không gõ; Ma Trơi bay thẳng tới gần Lũy cho áp lực mà ít mạng). P Đêm 4 của bot gõ 0,3–4,7 % → 14,9–23,5 %, cổng 4 đạt trên 20 seed. Đêm 5: `kHp2` 5,5 → 7,5, trần 1,42 → 1,49 (bot Khá, Nhanh) | **Giữ** biến thể 2 (`10ce627`) |
| 5. Đêm 5 theo chế độ (dòng 32) | Thử thách quá dễ, N dưới dải, Q của Thư giãn cao: chỉnh về phía dải | Thử thách: hệ số máu boss riêng 0,78 → 0,9 (thắng 69–95 % → 51–89 %, 4/6 bot vào 50–75 %). N và Q: số không đổi được bằng số Đêm 5 (lý do ở dưới), ghi lại | **Giữ** phần Thử thách (`10ce627`); N, Q **mở** |
| 3. Đêm 3 nhàn (dòng 15) | Đợt test đã bác "khoảng trống giữa các nhóm"; tìm nguyên nhân thật trong số theo tick và sửa | Nguyên nhân thật tìm được (dưới). Hai biến thể sửa đều không đạt mục tiêu (Nhàn I ≤ 10 % mọi bot) và biến thể 1 làm trượt B4, B8 | **Không giữ**, số ở dưới; về chủ dự án (một quyết định thiết kế) |

### Việc 4: pha 2 luôn diễn ra

Đầu dò boss (`boss-phase-probe.ts`, Cân bằng, seed 1–40, trước → sau):

| Bot | Thắng | Rút lui khi còn choáng | Rút lui mà không lứa Mầm Gỗ nào mọc | Choáng → rút p50 | Mạng mất ở đỉnh p50 |
|---|---|---|---|---|---|
| Mới | 88 → 85 % | 6/38 → 0/39 | 8/35 → 0/34 | 18,9 → 18,7 s | 8 → 2 |
| Chậm chắc | 78 → 88 % | 6/39 → 0/40 | 8/31 → 0/35 | 15,9 → 12,4 s | 3 → 2 |
| Chuẩn | 83 → 78 % | 12/39 → 0/40 | 14/33 → 0/31 | 11,8 → 11,8 s | 2 → 2 |
| Khá | 90 → 85 % | 15/40 → 0/39 | 21/36 → 0/34 | 5,6 → 10,1 s | 2 → 2 |
| Ẩu | 78 → 80 % | 7/38 → 0/39 | 19/31 → 0/32 | 6,5 → 13,2 s | 2 → 2 |
| Nhanh | 80 → 80 % | 9/40 → 0/40 | 15/32 → 0/32 | 9,8 → 9,3 s | 2 → 2 |

Cột "sau" là mã cuối của bước (cả năm việc). Phần kẹp do lần chạy trước để lại có một chỗ hở: đạn rơi trước khi boss bước trong cùng một tick (`step`: `projectilesStep` trước `bossStep`), nên một đòn đúng tick lứa mầm mọc vẫn cho boss rút trước lứa mầm: trên mã đó 0–6 trong 31–35 lần rút mỗi bot (tổng 18/198) không có mầm. Sửa ở `84d0ac1`: sàn giữ hết tick đó (`<=`); test mới đánh boss mọi tick tới hết tick mầm mọc và thấy mầm trước khi rút (với `<` cũ test trượt). File vàng `td-1b-boss.json` làm lại ở `b0e10d7` (đổi luật có chủ ý: trận dài 5.306 → 5.695 tick); `td-1a.json` không đổi.

### Việc 2: lặng chờ Thuồng Luồng

Đầu dò lặng (`lull-probe.ts`, Cân bằng, seed 1–40, trước → sau): lúc toán hộ tống rời Khe Nứt không còn quái nặng nào sống ở mọi bot (trước: Mới 22, Chậm chắc 10, Chuẩn 4, Khá 2, Ẩu 9, Nhanh 7 ván trên 40); lặng p50 12 s (Mới 18 s), dài nhất 29–40 s; mạng Thuồng Luồng lọt từ lúc lặng bắt đầu, trung bình: Mới 4,50 → 2,77, Chậm chắc 1,80 → 0,53, Chuẩn 0,53 → 0,45, Khá 0,15 → 0,38, Ẩu 1,43 → 1,43, Nhanh 1,13 → 0,07. Mạng mất ở đỉnh boss p50 của bot Mới 9 → 5 (bảng boss của `td:balance`). Chỉ riêng việc 4 và việc 2 (chưa đổi số đợt): thắng Mới 76 → 84 %, Chậm chắc 80 → 86 %, Ẩu 76 → 78 % (77,5 %, vẫn dưới 78).

### Việc 1 và 5: Đêm 4, Đêm 5 theo chế độ

Biến thể Đêm 4 (Cân bằng; P và mạng mất Đêm 4 trên seed 25–48 cho bot gõ; bot không gõ trên seed 1–20, đúng các seed của cổng 4 ở §12 20 seed):

| Biến thể | Đợt Đêm 4 | P Đêm 4 bot gõ | Bot không gõ ở Đêm 4: mạng mất TB, thua | Ghi chú |
|---|---|---|---|---|
| trước | T3, TL1, CT9 | 0,3–4,7 % | 1,79 (seed 25–48), 0 | |
| **H** (biến thể 1, quyết định) | T3, TL1, CT9, TL1, CT10, MT2 | 12,8–19,4 % | 9,55, **5/20** | ải: Mới 81, Chậm chắc **91**, Chuẩn **70**, Khá 85, Ẩu **75**, Nhanh 81 % (cùng việc 4 và 2); §12 20 seed: cổng 4 **trượt** (6/20 thua) |
| **f1** (biến thể 2, giữ) | T3, TL1, CT9, MT2, CT4, MT2 | 14,9–23,5 % | 5,45, 0/20 | |

Dò thêm để chọn biến thể 2 (chỉ Đêm 4, không phải biến thể giữ): bỏ Thuồng Luồng thứ hai nhưng giữ 19 Cương Thi (T3, TL1, CT9, CT10, MT4: P 14,8–20,9 %, bot không gõ thua 5/20; T3, TL1, CT9, MT2, CT10, MT2: 16,5–28,3 %, thua 8/20; T3, TL1, CT9, CT14, MT3: thua 8/20); nhẹ hơn (T3, TL1, CT9, CT6, MT2: P 9,1–15,6 %; T3, TL1, CT14, MT2: 8,8–15,3 %; T3, TL1, CT9, MT2, CT5, MT1: 11,2–21,4 %; T3, CT9, TL1, MT2, CT5, MT2: 12,2–19,3 %); T3, TL1, CT9, MT2, CT5, MT2: 14,9–25 % nhưng thua 1/20. Cho Tanuki đi chung toán (CT5 đi trước rồi T3; hay T3 một toán) làm ít ván có trống hơn, không lấy.

**Trống Tanuki** (dòng 14, `drums.ts`, seed 25–48): f1 giữ Tanuki đi đầu với Thuồng Luồng và 9 Cương Thi đuổi kịp, nên trống như cũ: 75–100 % ván có trống (Mới 20/24, Chậm chắc 19, Chuẩn 22, Khá 24, Ẩu 20, Nhanh 18), 1,3–2,1 trống mỗi ván, mỗi lần trống có trung bình 4,0–4,7 quái trong 6 m (cái trống hồi máu cho): trống có cái để chống, và nay Đêm 4 có áp lực (P 15–24 %) nên Ngắt đáng gõ. 8–25 % ván không có trống vẫn còn (dòng 14 phần tần suất): **mở**.

**Đêm 5 cho Ẩu và cả dải.** Với f1, Ẩu không mất mạng ở Đêm 4 như với H (mạng mất Đêm 4 0,04), nên không cần "+10 điểm cho Ẩu"; ngược lại bot nhanh được thêm vàng và thắng quá dải (Khá 89 %, Nhanh 94 %). Núm là hệ số k của máu boss (chỉ đổi boss của bot k > 1): `kHpMax` 1,6 cùng `kHp2` 7,5 đưa Nhanh xuống 68 % (quá tay); thêm `kHp` 0,3 làm Mới xuống 75 %; giữ `kHp` 0,4, `kHp2` 7,5, trần **1,49**: Khá ×1,15 → ×1,19, Nhanh ×1,42 → ×1,49, thắng 84 % và 83 %.

**Thử thách** (`modeHp.challenge`, cùng mã cuối, 40 × 2 seed): 0,78: Mới 88, Chậm chắc 96, Chuẩn 90, Khá 83, Ẩu 86, Nhanh 73 %; 0,86: 80 / 93 / 86 / 66 / 68 / 60 %; **0,9**: 76 / 89 / 70 / 61 / 63 / 51 %; 1,0 (đo trên cây chỉ có việc 4 và 2): 54 / 58 / 49 / 58 / 40 / 46 % (Biên S 0–35 %); 1,2: 13–35 %. Lấy 0,9: 4/6 bot vào dải 50–75 %, Biên S 15–50 % (dải 15–45 %). Chậm chắc vẫn 89 % (boss của bot k 0,79 nhẹ ×0,916), Mới 76 %.

**N dưới dải** (Cân bằng 0,3–1; nay 0,04–0,15): ở Lời Gọi mạng không hồi (chỉ một lần +2 của bộ điều nhịp khi gần thua, và bộ này đứng yên từ lúc lặng), nên N chỉ đếm được ván thắng sau khi xuống dưới 6 mạng. Lặng chờ Thuồng Luồng tách mạng lọt khỏi đỉnh boss nhưng không làm có thêm ván thắng sát nút (gộp: 0,05–0,17 trước, 0,04–0,15 sau). Muốn N vào dải phải có cách hồi mạng ở Đêm 5 hoặc chấp nhận Biên S thấp hơn: **mở**, chủ dự án quyết.

**Q của Thư giãn cao** (dải ≤ 45 %; nay 59–63 %, trước 60–64 %): quái chết ở tháp khúc nhập, ~56–63 % đường, ở mọi chế độ; Thư giãn chỉ làm quái yếu hơn nên chết ngay khi tới tháp. Số Đêm 5 không dời được chỗ quái chết: **mở** (bố cục, hoặc đọc Q của Thư giãn theo cách khác).

### Việc 3: Đêm 3 nhàn, nguyên nhân thật

Đếm theo tick (`approach.ts`, `idle.ts`, bot Chuẩn, Cân bằng, seed 25–48), Đêm 3 dài 57 s, Nhàn I 20,1 %:

| Giây của đêm | 0–5 | 5–10 | 10–15 | 15–20 | 20–25 | 25–30 | 30–35 | 35–40 | 40+ |
|---|---|---|---|---|---|---|---|---|---|
| Nhàn I (tick) | 0 % | 15 % | **87 %** | **52 %** | 1 % | 20 % | **41 %** | 8 % | 0–4 % |
| Lời gọi mở, trung bình | Chặt 1,8 | Chặt 1,1 | ~0 | Bắn mạnh 0,2, Gặt 0,15 | Bắn mạnh 0,8, Gặt 0,4 | | | | |

- **Đoạn đi tới (2/3 số tick nhàn).** Quái đầu tiên vào tầm một nhà đánh ở giây 18,6 sau khi tối, ở **mọi** đêm 1–4 (18,4–19,8 s, bot Chuẩn và Chậm chắc): Khe Nứt cách tháp khúc nhập 65–73 m đường, Cương Thi đi 3,8 m/s. Lời gọi Chặt còn mở lúc tối sống 9 s (luật gỗ của chủ dự án), nên từ giây 9 tới 18,6 không có chữ nào và không lời gọi nào.
- **Vì sao chỉ Đêm 3 lộ ra.** Đồng hồ Nhàn coi "kho đủ tiền mua nhà rẻ nhất" là một quyết định. Đêm 1–2 bot giữ 100–130 vàng (đợi Mỏ mở ở Ngày 3), nên cùng đoạn đi tới đó là "bận" (41 % tick Đêm 2 chỉ bận vì kho); Đêm 4 có lời gọi Mỏ chờ suốt đêm (88 % tick). Đêm 3 đến ngay sau Ngày 3 tiêu hết vàng cho Mỏ và Lũy cấp 2 (còn 9 vàng lúc tối), Mỏ mới xây chưa có lời gọi, và vẫn chỉ hai nhà đánh (tháp khúc nhập và Lũy) như Đêm 2.
- **Phần còn lại (1/3)**: hai toán Cương Thi chết ở khúc nhập lúc ~25 s, Nuppeppō (2,6 m/s, ra sau) tới lúc ~34 s.
- Bot Khá, Nhanh nhàn ít hơn (9,9 %, 6,0 %) vì ngày ngắn hơn (k > 1) nên việc mua Ngày 3 tràn sang đêm (lời gọi Xây, Tướng đang đi).

Hai biến thể sửa (Cân bằng, bảng Đêm 3 seed 25–48):

| Biến thể | Mới | Chậm chắc | Chuẩn | Khá | Ẩu | Nhanh | Cổng |
|---|---|---|---|---|---|---|---|
| trước | 12,1 % | 14,2 % | 20,1 % | 9,9 % | 20,1 % | 6,0 % | |
| 1: lời gọi Bắn mạnh mở khi quái còn cách tầm nhà 15 m (lấp đoạn đi tới bằng chính lời gọi đêm) | 2,6 | 2,9 | 18,8 | 6,5 | 18,6 | 5,6 | 5c 23,3 → 24,8 % (trần 25); **B4 trượt** (S Chậm chắc 35 % < Ẩu 48 %), **B8 trượt** (Chuẩn@Kém) |
| 2: Đêm 3 thành CT5, CT5, NP2, CT5, NP2, MT2, cùng lời gọi Bắn mạnh mở khi quái còn cách 40 m | 1,9 | 6,6 | 14,0 | 9,1 | 9,5 | 2,8 | dừng ở bảng đêm: Chuẩn vẫn 14 % |

Dò thêm (không phải biến thể giữ): chỉ đổi đợt (CT5, NP4, CT5, MT2: Chuẩn 17,3 %, Ẩu 20,5 %; như biến thể 2 mà không Bắn mạnh sớm: 14,9 %, 16,0 %), biến thể 2 với 25 m: 15,4 %, 11,6 %.

Vì sao không sửa được trong luật hiện có: bot gõ nhanh gõ xong lời gọi Bắn mạnh trong ~1 s nên lời gọi sớm chỉ lấp được ít giây; lấp đoạn đi tới bằng chữ thì tỉ lệ gõ ban Đêm (cổng 5c, trần 25 %, nay 23,0 % trên 20 seed) vượt trần; rút ngắn đoạn đi tới (quái ra gần hơn, đêm bắt đầu muộn hơn) thì đêm ngắn lại với cùng số chữ, 5c cũng tăng. Ba hướng cho chủ dự án: (a) đọc Nhàn I của Đêm từ lúc quái "vào trận" như bộ điều nhịp đã làm (`pace.ts`: "the approach from the gate is no lull to fill"), (b) nới trần 5c, (c) cho đoạn đi tới một quyết định không phải gõ (thiết kế mới). Không đổi mã nào cho việc 3.

### Số trước → sau (mã cuối của bước)

Cân bằng, `td:balance` 40 × 2 seed (seed 1–80), gộp 80 ván mỗi ô; P, I, O là số gộp B1 in ra, Q từng bộ:

| Bot | Thắng | Biên S | Áp lực P | Nhàn I | Ngộp O | Gần thua N | Quãng Q |
|---|---|---|---|---|---|---|---|
| Mới (k 0,70) | 80 → 86 % | 40 → 60 % | 22 → 23 % | 2,2 → 3,1 % | 0 → 0,1 % | 0,13 → 0,14 | 67 → 67 % |
| Chậm chắc (k 0,79) | 84 → 86 % | 60 → 65 % | 22 → 23 % | 2,8 → 2,8 % | 0 → 0 % | 0,17 → 0,06 | 67 → 67 % |
| Chuẩn (k 1,00) | 83 → 80 % | 55 → 55 % | 22 → 24 % | 4,7 → 3,7 % | 0,1 → 0,1 % | 0,06 → 0,11 | 66–67 → 67 % |
| Khá (k 1,133) | 85 → 84 % | 50 → 45 % | 22 → 26 % | 3,8 → 2,4 % | 0,1 → 0,1 % | 0,05 → 0,07 | 67 → 67 % |
| Ẩu (k 0,982) | 79 → 83 % | 55 → 55 % | 22 → 26 % | 5,1 → 4,2 % | 0,2 → 0,1 % | 0,10 → 0,15 | 67 → 67 % |
| Nhanh (k 1,30) | 84 → 83 % | 55 → 60 % | 22 → 25 % | 2,9 → 1,8 % | 0,1 → 0,1 % | 0,06 → 0,04 | 67 → 67 % |

Thử thách (gộp): Thắng Mới 90 → 76 %, Chậm chắc 95 → 89 %, Chuẩn 89 → 70 %, Khá 90 → 61 %, Ẩu 69 → 63 %, Nhanh 91 → 51 %; Biên S 50 / 55 / 45 / 48 / 30 / 50 → 40 / 50 / 30 / 28 / 15 / 15 %; P 20–26 → 25–31 % (dải 30–50); N 0,11–0,23 → 0,11–0,29 (dải 1–2). Thư giãn: mọi bot gõ vẫn 100 %, Biên S 85–95 %, P 9–12 → 10–14 %, Q 60–64 → 59–63 %; Trẻ em 98 → 94 % (B3 ≥ 85 %).

Bảng từng đêm, Cân bằng, seed 25–48 (P / I trước → sau):

| Bot | Đêm 3 | Đêm 4 | Đêm 5 (phần đầu, lặng, đỉnh boss) |
|---|---|---|---|
| Mới | 16,5 / 12,1 (không đổi) | 0,3 / 0 → 15,8 / 0 % | 33,3 / 0,3 → 29,2 / 3,4 %; mạng mất 9,7 → 10,1 |
| Chậm chắc | 12,4 / 14,2 | 0,4 / 0 → 14,9 / 0 % | 31,8 / 0,2 → 28,2 / 1,0 %; 7,6 → 6,9 |
| Chuẩn | 23,7 / 20,1 | 1,7 / 1,8 → 19,1 / 1,5 % | 28,7 / 2,9 → 26,4 / 0,4 %; 6,1 → 6,3 |
| Khá | 24,5 / 9,9 | 4,7 / 0,2 → 23,5 / 0,1 % | 21,8 / 3,9 → 23,2 / 0,6 %; 3,7 → 4,0 |
| Ẩu | 25,3 / 20,1 | 1,3 / 3,0 → 22,1 / 2,4 % | 28,7 / 3,8 → 28,5 / 2,2 %; 6,7 → 7,1 |
| Nhanh | 27,1 / 6,0 | 1,7 / 1,3 → 19,7 / 1,5 % | 26,7 / 3,6 → 21,6 / 0,5 %; 5,1 → 3,9 |

Đêm 4 dài thêm 9–17 s (46–57 → 55–74 s). Thử thách, P Đêm 4 1,9–9,1 → 19,7–31,4 % (dải 30–50); Thư giãn chỉ báo cáo.

### Cổng

- **B1–B9** (gộp 80 ván): B1–B8 **đạt** trước và sau; B9 thiếu số người thật như trước. Dải chặt 78–88 %: trước 6/6 (79–85 %), sau **6/6** (80–86 %); Biên S bot Chuẩn 55 % (40–60 %).
- **§12 trên 5 seed** (trong `td:balance`): 4 đạt (bot không gõ còn 6 / 9 / 9 / 7 / 7 mạng, trước 7 / 13 / 9 / 10 / 8), 5a 7,90 s, 5b 30,2 %, 5c 21,8 → 22,2 %, 6 = 0, 7 +38,2 %: đạt cả, như trước.
- **§12 trên 20 seed**: 4 **đạt** (thấp nhất 3 mạng, seed 15–16; trước 5), 5c 23,0 → 23,0 %, 6, 7 (+38,0 %) đạt; 5a 8,48 s và 5b 29,5 % **trượt như trước** (không đổi: việc của bước khác). Bảng từng đêm còn thấy bot không gõ thua Đêm 4 ở 1/24 ván seed 25–48 (mạng mất TB 5,04): biên của cổng 4 mỏng, ghi lại.
- **G2–G8**: G2 gõ Đêm 1–4 22,4 → 22,6 %, Đêm 5 24,4 → 24,0 %; G3 giao chiến 48,3 → 50,2 s; G5 đạt mọi bot (cả ải ≤ 13,7 %); G6 một lời gọi trực tiếp mỗi 31,8 → 37,1 s ở Đêm 4 (25–40 s: đạt, vì Đêm 4 dài hơn); G8 trồi → trúng đầu p50 24,1 → **32,1 s** (≤ 35 s, đạt nhưng sát; bộ 1 24,1 s, bộ 2 32,1 s), Nhàn I đỉnh boss 3,0 → 0,4 %.
- `pnpm check` trước mỗi commit: 346 → 347 test (32 file), kit 31 file khớp; `pnpm td:golden:check` cùng.
- **Dò thêm trên seed 81–160** (không phải bộ cổng; `--quick` Cân bằng 40 × 4, seed 1–160, `runs/*-q160.md`): gộp 160 ván, trước → sau: thắng Mới 79 → 87 %, Chậm chắc 84 → 87 %, Chuẩn 82 → 84 %, Khá 83 → 85 %, Ẩu 78 → 78 %, Nhanh 84 → 84 % (dải chặt vẫn 6/6); nhưng **Biên S bot Mới 55 → 70 %** (seed 81–160: 70 và 73 %; dải 35–65 %) và **bot Chuẩn tắt nhịp 88 %** (B7), nên trên 160 seed B1 và B7 trượt, trước bước thì đạt. Thử `kHp` 0,35: Mới S 65 %, nhưng Ẩu 78 % "thấp", tắt nhịp vẫn 88 %; `kHp` 0,3: Mới S 65 % mà bộ cổng (seed 1–80) Mới còn 75,6 %, trượt B1. Không lấy; hai mép này **mở** (dưới).
- Lặng chờ và pha 2 ở chế độ khác: Thử thách, lúc toán hộ tống rời Khe Nứt còn quái nặng 8–23 ván trên 40 → 0 ở mọi bot; rút lui mà không lứa mầm nào 9–30 trên 30–38 lần rút → 0. Thư giãn: 0 quái nặng lúc hộ tống rời (`runs/*-ch-*`, `fin2-rx-lull-probe.md`).

### Trên trình duyệt

Chrome macOS có GPU, mỗi lượt dưới `heavy.sh --gpu`, Vite riêng ở `127.0.0.1:4161 --strictPort` (tắt khi xong), mã `10ce627`; ảnh ở `a1-nights/browser/`, đã xem từng ảnh nêu dưới.

| Kịch bản | 1280 × 720 | 1920 × 1080 | Nhìn thấy |
|---|---|---|---|
| `zz-a1-hold` (dùng một lần, `a1-nights/zz-a1-hold.mjs`: hộp cát, Đặt sẵn, 6 Thuồng Luồng từ Khe Nứt, gọi boss khi toán gần khúc nhập) | **đạt 7/7** (`heldShown`, `heldStill`, `countsAfter`, `risesAfter`, `replaysOnNode`, không lỗi console) | **đạt 7/7** ở lượt 2; lượt 1 trượt vì chính kịch bản đọc trạng thái trước khi lệnh `boss` vào khung kế (sửa: chờ lặng bắt đầu) | Đếm ngược chạy 12 → 4 s, rồi đứng ở "Mộc Tinh tới sau 3 s · chờ quái gần Lũy" 16 s khi toán Thuồng Luồng ở giữa hai tháp khúc nhập, chạy lại khi toán hết, boss trồi sau đó; nhật ký trang chạy lại trên Node khớp mã băm (ảnh `zz-a1-hold-held-*`, `zz-a1-hold-counting-*`: câu một dòng, không đè gì) |
| `td-1b-boss` | **đạt 20/20** (thắng, còn 1 mạng) | **đạt 20/20** (còn 14 mạng) | Pha 2 có lứa Mầm Gỗ: thanh boss "pha 2 · còn 33–35 m tới Lũy", máu dừng giữa vạch 70 % và vạch rút lui, bốn mầm trong vòng sáng quanh boss ở khúc nhập (ảnh `td-1b-boss-sprouts-*-02`); rồi rút lui, thẻ thắng có rương; nhật ký chạy lại trên Node khớp |

### Ngân sách

| Commit | Việc | "/" gzip (chừa) | `?title=0` | Dòng `.ts` | Test |
|---|---|---|---|---|---|
| `e3c2d7f` | trước | 84,88 (0,12) | 83,42 | 10.500 | 346 |
| `b0e10d7` | việc 4: kẹp ở mốc pha; gộp hai chú thích của `combat.ts` | 84,94 (0,06) | 83,48 | 10.497 | 346 |
| `b14fa42` | việc 2: lặng chờ quái nặng, câu trên thanh boss; `strike()` cho sự kiện đòn boss, `rootTargets` hai dòng, đầu file `boss.ts` ngắn lại | 84,97 (0,03) | 83,52 | 10.500 | 347 |
| `84d0ac1` | việc 4: giữ cả tick lứa mầm mọc | 84,97 (0,03) | 83,53 | 10.500 | 347 |
| `10ce627` | việc 1, 5: Đêm 4 f1, hệ số k boss, Thử thách 0,9 | 84,99 (0,01; 84.987 byte) | 83,54 | 10.500 | 347 |

Chỗ lấy lại: `strike()` thay tám chỗ đẩy sự kiện `bossStrike` (−40 byte gzip), `bossHp` và `warnDay` gọn hơn, câu chờ ngắn ("· chờ quái gần Lũy", 24 → 15 byte). Thử `bossWarning` bằng `Math.max` và kẹp viết gọn đều làm gói lớn thêm 6–9 byte (gzip), nên bỏ. **"/" chỉ còn 13 byte**: bước sau thêm mã vào phần khởi động phải lấy chỗ trước.

### Commit

Trên nhánh `a1-nights`, gộp vào `main` bằng `--ff-only`; chưa đẩy (điều phối viên đẩy):

- `b0e10d7` việc 4 (file vàng `td-1b-boss.json` làm lại: trận 5.306 → 5.695 tick).
- `b14fa42` việc 2 (file vàng không đổi).
- `84d0ac1` việc 4, chỗ hở tick lứa mầm (file vàng không đổi).
- `10ce627` việc 1 và 5 (hai file vàng chỉ đổi mã nội dung `cd59313e` → `c39e3fea`, các lượt chạy giữ nguyên; thân commit ghi nhầm chiều mã băm, số đúng là đây).
- `c83b2ea` giấy tờ (changelog, `BUILD_1B` §4.2, §4.4, §5.1, §5.2, §5.6, `BUILD_NOTES` §7.10, `R3_PLAN`, `AGENTS.md`); commit sau đó thêm phần trình duyệt và lượt dò seed 81–160.

### Còn mở

- **Đêm 3 nhàn** (việc 3): ba hướng ở trên, chủ dự án chọn.
- **Gần thua N** dưới dải ở Cân bằng (0,04–0,15) và Thử thách (0,11–0,29): cần cách hồi mạng ở Đêm 5 hoặc Biên S thấp hơn; **Q của Thư giãn** 59–63 % (≤ 45 %): bố cục.
- **Thử thách**: Chậm chắc 89 %, Mới 76 % (boss nhẹ hơn cho k < 1); P 25–31 % dưới dải 30–50 %.
- **Trống Tanuki**: 0–25 % ván Đêm 4 không có trống (theo bot).
- **Biên cổng 4** mỏng (3 mạng ở seed xấu nhất; 1/24 ván seed 25–48 thua Đêm 4); **G8** 32,1 s, sát trần 35 s.
- Cổng 5a (8,48 s) và 5b (29,5 %) trên 20 seed vẫn trượt như trước bước này.
- **Mép của dải trên seed 81–160**: Biên S bot Mới 70 % (dải 35–65 %), bot Chuẩn tắt nhịp 88 %; bộ cổng 1–80 đạt. Lượt cân bằng sau nên đo trên cả hai bộ.
- Gói "/" còn 13 byte.

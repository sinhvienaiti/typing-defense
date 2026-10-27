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

## Bước A2: các ngày và cổng §12

Làm trên **Mac mini M4** (Node v24.22, Chrome macOS có GPU), máy dùng chung với các làn khác. Bằng chứng ngoài Git: `games/typing-defense/tmp/mac-2026-10-27/open/a2-days/` (đầu dò `probes/*.ts`, kịch bản đo `measure.sh`, `g5grid.sh`, `g5all.sh`, `qbal.sh`, cây thử `trees/`, số ở `runs/`, ảnh ở `browser/`, gói không giữ `a2-package-v2.patch`). Hai lần chạy trước của bước này bị cắt (hết lượt dùng) trước khi báo, để lại trên nhánh `a2-days` phần sửa chưa commit ở `rules.ts`, `attention.ts` và hai file test (việc 3). Lượt này đọc lại, đo lại phần đó (giống từng ô số của lượt trước), giữ nó, rồi làm các việc còn lại.

Cách đo như bước A1: `td:balance` 40 × 2 seed (seed 1–80, đủ ba chế độ, §12 trên 5 seed), cổng §12 trên 20 seed (`--stage-seeds=12 --stage-sets=1 --seeds=20 --nights=4`; báo cáo §12 nay chấm cả 5a của Thư giãn, Thử thách, Học), bảng từng pha (seed 25–48). Thêm cho bước này: đầu dò cổng 5 (`g5.ts`, bot §12 mỗi chế độ, seed 1–20 và 21–40, vài lượt trên 100–200 seed), đầu dò Ngày (`daymix.ts`: mỗi tick Ngày là gõ, có chữ chưa khóa, lời gọi bị ngân sách giữ, lời gọi ngoài vòng, không lời gọi; `dawn.ts`: đầu Ngày), đầu dò Đêm 1 (`night1.ts`, seed 1–40, từng bot với k của nó; `--k=1`, `--e=35` để tách nguyên nhân). Dò nhanh: `td:balance --quick` Cân bằng 40 × 2. "Trước" là `86b7258` (cuối bước A1).

### Quyết định và kết quả

| Việc | Quyết định (điều phối viên) | Đã làm | Giữ? |
|---|---|---|---|
| 3. Thư giãn, Học vượt trần gõ 20 s của chính chúng (dòng 20) | Sửa, và báo cáo §12 chấm cả hai chế độ đó | Lề trượt của bộ điều phối theo chế độ (`MODES.*.slipS`): Thư giãn, Học 2,2 s; Cân bằng, Thử thách 1,35 s như cũ. Báo cáo §12 và test cổng chấm 5a ở mọi chế độ theo trần của chế độ đó | **Giữ** (`e49189a`) |
| 1. Cổng 5b (Ngày 30–45 %) trượt 29,5 % trên 20 seed; gỗ thừa, vàng thiếu, gõ Chặt thành việc vặt (dòng 18, 19) | Chỉnh số Ngày trong luật gỗ của chủ dự án (không đổi hình luật) để gõ ban Ngày có ý nghĩa và 5b đạt trên 20 seed | Số Ngày không dời được 5b (dưới). Chỗ hở thật nằm trong luật gỗ: chặt bắt đầu ban Đêm không có lời gọi, nên sáng ra dân đang chặt mà không gọi. Sửa: **chặt bắt đầu ban Đêm gọi lúc rạng sáng** (m1). Cùng lề trượt Cân bằng 1,8 s thì 5b 29,5 → 30,1 % | **Không giữ** (gói việc 1, 2, 4 trượt dải chặt và B1, B4 theo bộ; số ở dưới) |
| 2. Cổng 5a (cửa sổ 20 s ≤ 8 s) 8,48 s | Đưa dưới 8 s | Lề trượt Cân bằng 1,35 → 1,8 s: 8,48 → 7,95 s trên 20 seed (8,00 s trên seed 21–40) | **Không giữ** (cùng gói) |
| 4. Biên S giảm khi bot gõ nhanh hơn (dòng 21; Đêm 1: Khá mất 4,1 mạng, Mới 0,6) | Bot gõ nhanh không được bị phạt; tìm nguyên nhân và sửa | Nguyên nhân là lời gọi Gặt ban Đêm và nhịp k, không phải tốc gõ (dưới). Sửa: **gặt ban Đêm không lời gọi**, như Chặt (h0): Đêm 1 Khá mất 4,22 → 2,00 mạng, Biên S Khá 45 → 60 %. Nhưng mọi bot gõ thắng thêm 6–14 điểm nên phải chỉnh lại boss; hai biến thể đều trượt dải chặt ở bot Chậm chắc **đúng một ván** (71/80 = 88,75 %) | **Không giữ**; về chủ dự án |

### Việc 3: Thư giãn và Học giữ trần gõ của chính chúng

Cửa sổ 20 s đầy nhất của bot §12 (35 WPM, 95 %) quá trần vì một từ nhiều lỗi giữa chuỗi từ Chặt: seed 5 Thư giãn, từ Chặt 5 chữ gõ 11 phím, 4 lỗi, giữ khóa 4,50 s so với 1,71 s dự tính (`window.ts`). Lề trượt 1,35 s đủ cho trần 8 s, không đủ cho trần 6 s. Trần nhỏ cần lề lớn hơn so với trần, nên lề nay theo chế độ: Thư giãn, Học 2,2 s (đầu dò, seed 1–20 / 21–40: 1,5 s 6,00 / 5,98 s; 1,6 s 5,98 / 6,05 s; 1,7 s 6,47 / 6,03 s; 1,8 s 6,47 / 5,98 s; 2,0 s 6,02 / 5,85 s; 2,2 s 5,67 s ở seed 1–20 và 5,93 s trên seed 1–100, không seed nào quá trần). `CALL.paceK` (= 1, không ai đổi) bỏ; `CALL.slipS` vào `MODES`.

| Đo (seed 1–20, bot §12) | Trước | Sau |
|---|---|---|
| 5a Thư giãn (trần 6 s) | **6,82 s** (seed 5; 16: 6,38; 17: 6,10) | 5,67 s |
| 5a Học (trần 6 s) | **6,82 s** | 5,67 s |
| 5a Thử thách (trần 10 s), Cân bằng (8 s) | 10,00 s; 8,48 s | không đổi (cùng tick) |
| Tỉ lệ gõ Ngày / Đêm, Thư giãn | 19,7 / 13,2 % | 15,4 / 11,8 % (không có dải chấm) |

Cân bằng và Thử thách chạy đúng từng tick như trước (bảng Cân bằng của `td:balance` giống hệt ô nào cũng vậy). Thư giãn, gộp 80 ván: mọi bot gõ vẫn thắng 100 %, Biên S 85–95 → 90–95 %, P 10–14 → 11–14 %, Q 59–63 → 60–65 % (vẫn ngoài dải ≤ 45 %, như trước); Trẻ em 94 → 91 % (B3 ≥ 85 %: đạt), Chuẩn chiến thuật Kém Biên S 78 → 48 %. B1–B8 đạt như trước. File vàng: chỉ mã nội dung `c39e3fea` → `f2a21037` (mọi tick giữ nguyên; đổi luật có chủ ý: lề vào `MODES`).

### Việc 1 và 2: vì sao 5a, 5b trượt

- **5b do ngân sách gõ, không do số Ngày.** Mỗi tick Ngày của bot §12 (seed 1–20, Ngày 1–4): gõ 29,5 %, có chữ chưa khóa (mắt, tay) 5,3 %, **có lời gọi trong vòng nhưng bộ điều phối giữ (ngân sách 8 s/20 s) 54,7 %**, lời gọi ngoài vòng 3,8 %, không lời gọi 6,7 % (`daymix.ts`). Các số Ngày của luật gỗ không dời 5b quá 0,3 điểm ở cùng lề (đầu dò, seed 1–20 và 21–40): `TREE.wood` 16, 20; `ECONOMY.woodShare` 0,4, 0,45; `ECONOMY.sale.woodGold` 6, 8; `MINE.wordGold` 3; `CALL.words.chop` 3, 6; dải dài từ ở E 45 thêm 1 chữ. Lề lớn hơn thì 5a đạt nhưng 5b xuống: 1,35 s 8,48 s / 29,5 %; 1,6 s 7,95 s / 28,9 %; 1,8 s 7,95 s / 28,2 %; 2,0 s 7,97 s / 27,7 %.
- **Chỗ hở trong luật gỗ.** Sáng Ngày 2–4, 192/200 dân đang chặt dở mà không có lời gọi (chặt bắt đầu ban Đêm không gọi, một lần chặt dài 45 s), nên 5 s đầu Ngày 53 % số tick không có lời gọi nào, 5–15 s còn 24–25 % (`dawn.ts`); Ngày 3–4 chỉ gõ 28,8 / 28,7 %. Cho chặt bắt đầu ban Đêm gọi ngay tick đầu Ngày (m1, một dòng ở `economy.ts`): không còn tick nào thiếu lời gọi, Ngày 3–4 lên 31–32 %, 5b +1,1 đến +1,7 điểm ở mọi lề. Hình luật gỗ không đổi (cây 1.000 gỗ, mọc lại đầu Ngày, Đêm chặt không gọi).
- **5a do một từ nhiều lỗi**, không do chuỗi: seed 17 Ngày 1 giây 49, từ Chặt 4 chữ gõ 10 phím, 3 lỗi, giữ 3,93 s so với 1,03 s dự tính, đẩy cửa sổ lên 8,48 s. Lề phải phủ được đuôi đó.
- m1 với lề Cân bằng 1,6 s: 5a 7,98 / 8,00 s, 5b 30,6 / 30,6 %, 5c 21,1 / 22,2 % (seed 1–20 / 21–40; 100 seed 8,00 s, 30,5 %). Với lề 1,8 s: 7,98 / 8,00 s, 30,3 / 30,3 %, 20,1 / 19,9 %.
- Dải chặt với m1 riêng (không h0): lề 1,35 s (lượt trước) thắng 84 / 91 / 88 / 75 / 78 / 91 % (Mới / Chậm chắc / Chuẩn / Khá / Ẩu / Nhanh); lề 1,6 s 84 / **91** / 88 / **74** / 78 / 79 %, Biên S Mới **68 %**: B1 trượt. Lệch hai phía (Chậm chắc lên, Khá xuống), nên không một số boss nào kéo về được; Khá thấp vì đúng việc 4.

### Việc 4: vì sao bot gõ nhanh bị phạt ở Đêm 1

Đầu dò Đêm 1 (seed 1–40, Cân bằng, mỗi bot với đầu ván của nó):

| Bot (k) | Mạng mất Đêm 1 | Ván mất ≥ 3 | Sát thương Phát Chữ Đêm 1 | Mạng mất, k ép 1 | Mạng mất, E ép 35 | Mạng mất, gói m1 + h0, lề 1,8 s |
|---|---|---|---|---|---|---|
| Mới (0,70) | 0,47 | 0 | 382 | 2,77 | 0,55 | 0,55 |
| Chậm chắc (0,79) | 1,82 | 17 | 217 | 2,40 | 0,97 | 0,72 |
| Chuẩn (1,00) | 1,77 | 18 | 331 | 1,77 | 1,77 | 1,27 |
| Khá (1,133) | **4,22** | 36 | **82** | 1,32 | 4,13 | 2,00 |
| Ẩu (0,982) | 1,55 | 14 | 407 | 2,02 | 1,45 | 1,48 |
| Nhanh (1,30) | 2,60 | 20 | 390 | 1,15 | 2,15 | 2,17 |

- **Không do tốc gõ**: ép k = 1 thì Khá, Nhanh mất ít mạng nhất (1,32, 1,15); ép E = 35 (giữ k) thì Khá vẫn mất 4,13. **Do nhịp k**: k > 1 chia ngắn Ngày (Khá 66 s, Nhanh 58 s), Ruộng xong sát tối, lúa chín 13–20 s sau khi tối, đúng lúc toán đầu tới tháp (~18 s). Lời gọi Gặt 3 từ lấy chỗ kinh tế duy nhất của Đêm và ngân sách gõ, nên lời gọi Bắn mạnh tắt: Khá chỉ gõ 1,6 từ Bắn mạnh, Phát Chữ 82 sát thương so với 331 của Chuẩn.
- Gặt ban Đêm không lời gọi (h0: nông dân gặt tiếp một mình, lời gọi Gặt còn mở lúc tối sống thêm 9 s như Chặt; hai dòng ở `economy.ts`, `waves.ts`): Khá 4,22 → 2,00, Nhanh 2,60 → 2,17, Chậm chắc 1,82 → 0,72 mạng; Biên S Khá 45 → 60 %. Thử thêm cho lúa lớn theo k (`growS` ÷ k, như các đồng hồ Ngày khác): không đỡ Khá (4,47) mà làm Mới, Chậm chắc mất nhiều hơn (1,00, 2,23), bỏ.
- Cái giá: h0 trả lời gọi Bắn mạnh ban Đêm cho **mọi** bot gõ (cả lúc đỉnh boss), nên thắng lên 91–100 % (h0 riêng, lượt trước: 99 / 100 / 96 / 96 / 94 / 91 %; m1 + h0 lề 1,8 s: 96 / 98 / 93 / 96 / 91 / 89 %). Muốn giữ dải chặt phải làm boss khó hơn.

### Gói việc 1, 2, 4 và chỉnh boss: hai biến thể, không giữ

Gói: m1 + h0 + lề Cân bằng 1,8 s (cổng 5 trên 20 seed đạt cả ba: 5a 7,95 s, 5b 30,1 %, 5c 15,5 %; seed 21–40: 8,00 s, 30,1 %, 15,8 %; lề 1,6 s thì seed 12 lên 9,12 s, lề 2,0 s thì 5b 29,5 %). Đầu dò boss (`--quick` Cân bằng 40 × 2, thắng gộp Mới / Chậm chắc / Chuẩn / Khá / Ẩu / Nhanh, Biên S cùng thứ tự):

| Thử | Máu boss, kHp / kHp2, trần, Rễ hút | Thắng | Biên S |
|---|---|---|---|
| gói, boss cũ | 4.200, 0,4 / 7,5, 1,49, 30 s | 96 / 98 / 93 / 96 / 91 / 89 | 75 / 75 / 60 / 65 / 60 / 63 |
| K-a | 4.600, trần 1,40 | 88 / 93 / 80 / 90 / 79 / 85 | 63 / 70 / 58 / 65 / 58 / 60 |
| K-b | Rễ hút 15 s | 91 / 96 / 88 / 96 / 88 / 86 | 65 / 60 / 50 / 55 / 50 / 53 |
| K-c | 4.500, kHp 0,2 | 74 / 86 / 83 / 96 / 84 / 76 | 50 / 70 / 58 / 65 / 60 / 60 |
| K-e | 4.600, 0,3 / 12, 1,40 | 76 / 88 / 80 / 81 / 79 / 85 | 55 / 70 / 58 / 65 / 58 / 60 |
| K-f | 4.600, 0,35 / 12, 1,40, 20 s | 79 / 86 / 77,5 / 83 / 77,5 / 83 | 50 / 65 / 53 / 60 / 50 / 55 |
| K-g | như K-f, 25 s | 79 / 89 / 79 / 83 / 79 / 84 | 55 / 70 / 55 / 60 / 55 / 60 |
| **Biến thể 1** (đo đủ) | 4.550, 0,35 / 12, 1,40, 20 s | 83 / **89** / 81 / 83 / 79 / 85 | 50 / 65 / 55 / 60 / 55 / 55 |
| **Biến thể 2** (đo đủ) | như 1, kHp 0,32 | 80 / **89** / 81 / 85 / 79 / 85 | 50 / 65 / 55 / 60 / 55 / 55 |

- Chỉnh boss chỉ đổi trận boss (Đêm 1–4 giữ từng tick), nên thắng dời theo một chiều: từ K-f sang biến thể 1 (máu −1,1 %) Mới +3 ván, Chuẩn +3, Chậm chắc +2, Ẩu +1. Nhưng hệ số k chỉ tách được bot theo k: Mới (k 0,70) và Chậm chắc (0,79) cùng phía, trong khi Chậm chắc cần boss to hơn còn Mới cần nhỏ hơn. Chậm chắc đứng ở 71/80 ván (88,75 %, trần 88 %) ở cả hai biến thể.
- **Biến thể 1** trượt: B1 gộp (Chậm chắc 88,75 %), B1 bộ 1 (Biên S Mới 70 %, dải 35–65 %), B4 bộ 2 (sát thương/s lên boss p50 Chuẩn 32,6 < Ẩu 39,3). **Biến thể 2** trượt: B1 gộp (Chậm chắc 88,75 %), B1 bộ 1 (Mới S 70 %), B1 bộ 2 (Mới thắng 73 %, S 33 %), B4 bộ 2 (32,6 < 39,9). Trước bước này mọi ô đó đạt, nên theo luật của làn không giữ biến thể nào; mã đã sửa ngược lại tay, gói lưu ở `a2-days/a2-package-v2.patch` (có hai test mới của m1 và h0, đạt).
- Các cổng khác của gói (biến thể 1; biến thể 2 giống ở Đêm 1–4): §12 trên 20 seed 4 đạt (thấp nhất **1 mạng**, seed 1 và 12; trước 3), 5a 7,95 s, 5b 30,1 %, 5c 15,5 %, 6 = 0, 7 +39,2 %, 5a Thư giãn / Thử thách / Học 5,67 / 9,98 / 5,67 s; trên 5 seed 7,93 s, 30,5 %, 15,4 %, 4 (1 / 7 / 4 / 8 / 7 mạng); G2 Đêm 1–4 22,6 → 16,9 %, Đêm 5 24,0 → 18,6 %; G3 50,2 → 51,9 s; G6 37,1 → 37,6 s; G8 32,1 s; G5 đạt; B2, B3, B5–B8 đạt. Thử thách thắng 76 / 89 / 70 / 61 / 63 / 51 → 83 / 88 / 70 / 63 / 70 / 68 %.
- Gói còn làm **Đêm 3 nhàn hơn**: Nhàn I Đêm 3 (seed 25–48) Chuẩn 20,1 → 31,1 %, Ẩu 20,1 → 34,6 %, Chậm chắc 14,2 → 24,5 %: lời gọi Gặt ban Đêm vốn lấp đoạn quái đi tới (việc 3 của bước A1).
- Gói "/" của gói: 84.996 byte (còn 4), 10.499 dòng.

Đọc: dải chặt 78–88 % trên 80 ván có sai số chuẩn ~4,2 điểm mỗi bot (nhị thức ở 83 %), gần bằng nửa bề rộng dải; đổi bất kỳ luật nào trước Đêm 5 là gieo lại cả sáu bot. Trước bước này 6/6 trong dải; sau một đổi luật, xác suất cả sáu bot cùng trong dải ước chỉ khoảng một phần tư dù trung bình đặt đúng giữa (0,79 mũ 6).

### Số trước → sau (mã cuối của bước, `e49189a`)

Cân bằng: không đổi một ô nào (bảng của bước A1, cột "sau"): Mới 86 % / 60 % / 23 % / 3,1 % / 0,1 % / 0,14 / 67 %; Chậm chắc 86 / 65 / 23 / 2,8 / 0 / 0,06 / 67; Chuẩn 80 / 55 / 24 / 3,7 / 0,1 / 0,11 / 67; Khá 84 / 45 / 26 / 2,4 / 0,1 / 0,07 / 67; Ẩu 83 / 55 / 26 / 4,2 / 0,1 / 0,15 / 67; Nhanh 83 / 60 / 25 / 1,8 / 0,1 / 0,04 / 67 % (Thắng / S / P / I / O / N / Q). Thử thách không đổi. Thư giãn: như ở việc 3.

### Cổng

- **B1–B9** (từng bộ và gộp): B1–B8 đạt trước và sau; B9 thiếu số người thật. Dải chặt 6/6 (80–86 %) trước và sau.
- **§12 trên 5 seed**: 4 (6 / 9 / 9 / 7 / 7 mạng), 5a 7,90 s, 5b 30,2 %, 5c 22,2 %, 6 = 0, 7 +38,2 %: đạt như trước; mới chấm: 5a Thư giãn 5,67 s (≤ 6), Thử thách 9,88 s (≤ 10), Học 5,67 s (≤ 6): đạt.
- **§12 trên 20 seed**: 4 đạt (thấp nhất 3 mạng), 5c 23,0 %, 6, 7 (+38,0 %) đạt; 5a Thư giãn 6,82 → **5,67 s**, Học 6,82 → **5,67 s**, Thử thách 10,00 s: đạt; **5a Cân bằng 8,48 s và 5b 29,5 % vẫn trượt** (việc 1, 2 không giữ).
- G2–G8 không đổi. `pnpm check` 350 test (32 file), kit 31 file khớp; `pnpm td:golden:check` khớp sau khi làm lại mã nội dung.

### Trên trình duyệt

Chrome macOS có GPU, mỗi lượt dưới `heavy.sh --gpu`, Vite riêng ở `127.0.0.1:4161 --strictPort` (tắt khi xong), mã `e49189a`; ảnh ở `a2-days/browser/`.

| Kịch bản | 1280 × 720 | 1920 × 1080 | Nhìn thấy |
|---|---|---|---|
| `td-1a6-learn` (Học: nghĩa trước, Hỏi bài, tạm dừng chiến thuật) | **đạt 18/18** | **đạt 18/18** | Ảnh `td-1a6-learn-meaning-1280x720`: hai thẻ Chặt sáng có nghĩa ("see · thấy; nhìn thấy", "head · đầu"), không chồng nhau, HUD "Đang gọi 2/2" (trần Học 2); ảnh `td-1a6-learn-quiz-1920x1080`: thẻ Hỏi bài "khuôn mặt; mặt · f _ _ _" sáng, các lời gọi khác chờ ("Đang gọi 1/2"); nhật ký trang chạy lại trên Node khớp mã băm, 0 lỗi console |
| `td-1b-learn` (Từ Ôn, sổ qua lần tải lại, nghĩa theo luật) | **đạt 14/14** | **đạt 14/14** | Ảnh `td-1b-learn-review-1280x720`: thẻ ngọc "Ôn · good · tốt; hay" cạnh hai thẻ Chặt, "Đang gọi 3/3" ở Cân bằng; chạy lại khớp |

Gói không giữ (m1, h0) không chạy trên trình duyệt; kịch bản dùng một lần đã viết sẵn cho nó (`a2-days/zz-a2-days.mjs`: lời gọi Chặt, Gặt hết sau 9 s lúc tối, không lời gọi mới ban Đêm mà lúa vẫn gặt, rạng sáng mỗi dân đang chặt có lời gọi) để chạy khi chủ dự án chọn giữ gói. Các nhãn kho "…/1000" vẫn chồng nhau quanh cụm cây (dòng 17, đã mở từ trước).

### Ngân sách

| Commit | Việc | "/" gzip (chừa) | `?title=0` | Dòng `.ts` | Test |
|---|---|---|---|---|---|
| `86b7258` | trước | 84,99 (84.987 byte; 13 byte) | 83,54 | 10.500 | 347 |
| `e49189a` | việc 3: lề trượt theo chế độ, 5a mọi chế độ | 84,97 (84.975 byte; 25 byte) | 83,53 | 10.499 | 350 |

Gói không giữ cần thêm 21 byte (84.996, còn 4); bước sau đổi mã ở phần khởi động vẫn phải lấy chỗ trước.

### Commit

Trên nhánh `a2-days`, gộp vào `main` bằng `--ff-only`; chưa đẩy (điều phối viên đẩy):

- `e49189a` việc 3 (file vàng chỉ đổi mã nội dung `c39e3fea` → `f2a21037`, mọi tick giữ nguyên).
- Commit giấy tờ của bước này (changelog, `BUILD_NOTES` §7.10, `AGENTS.md`).

### Còn mở (về chủ dự án; chặn việc 1, 2, 4)

- **Gói việc 1, 2, 4** (`a2-package-v2.patch`): đạt mọi cổng §12 trên 20 seed và sửa Đêm 1 cho bot gõ nhanh, nhưng dải chặt trượt ở Chậm chắc đúng một ván (88,75 %) và B1, B4 theo bộ trượt. Chủ dự án chọn: (a) chấm dải chặt trên 160 seed (hai bộ hiện có cộng seed 81–160) hoặc nới trần 88 % để sai số 80 ván không quyết; (b) hay giữ luật cũ và nhận 5a, 5b trượt.
- **Gặt ban Đêm không lời gọi** là mở rộng luật gỗ của chủ dự án ("Đêm là lúc của tháp") sang nông dân: cần chủ dự án đồng ý trước khi vào luật; nó cũng làm Đêm 3 nhàn hơn (Nhàn I 20 → 31–35 % ở Chuẩn, Ẩu) và 5c sát sàn (15,5 %).
- **Gỗ thừa, vàng thiếu (dòng 18)**: số Ngày không dời 5b; muốn mỗi từ Chặt đáng hơn thì giá bán gỗ (`woodGold` 4 → 6) hay phần gỗ của giá nhà (`woodShare` 0,3 → 0,4) là núm, chưa đo cân bằng đủ.
- Cổng 5a (8,48 s), 5b (29,5 %) trên 20 seed vẫn trượt.
- Biên cổng 4 trong gói còn 1 mạng ở seed xấu nhất.

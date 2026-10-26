# 2026-10-26 — Lời Gọi 1B R3: cân bằng cuối (bước 9) và cổng cứng §21 (bước 10)

Commit trên nhánh `main` của repo `games/typing-defense`: `1f77e48` (gói lại đầu file, lấy lại 27 dòng), `b655de2` (bước 9: Rễ hút sinh khí và số cân bằng), `106db85` (Rễ hút đọc được trên đường, kịch bản `td-1b-boss` quay đòn này), `a23c910` và `5c3b939` (hai kịch bản sửa ở lượt kiểm), cùng commit giấy tờ của đợt này (`docs(td): R3 balance and gates`, 27/10). Làm trên **Mac mini M4**; mọi số đo là số **Apple M4** (Chrome 155 macOS có GPU, Node v24.22.0). Tu Tiên đang tạm dừng, không đụng tới. Bảng đủ ở `BUILD_NOTES` §7.9 (§7.6 đã là sửa phản biện R2 lần 3).

## Ba lượt làm bị ngắt, lượt thứ tư làm nốt

**Lượt 1** bị ngắt khoảng 12:00 (hết hạn mức), để lại `1f77e48`, `b655de2` chưa push và hai file sửa chưa commit (`src/view/boss-2d.ts`, `scripts/visual/scenarios/td-1b-boss.mjs`). **Lượt 2** (15:10–17:00) kiểm lại trên mã đã commit, không làm lại phần đã commit:

- `pnpm check` 338 test / 31 file đạt; `pnpm td:golden:check` `same: true` cả hai file. Bảng `td:balance` của lượt trước (`tmp/mac-2026-10-25/r3gate/balance-full.md`, mã `b655de2`) khớp từng số với lượt dò cuối của nó (`r3bal/r2-gate.md`): số ghi đè và mã cho cùng kết quả.
- Hai file chưa commit là phần hình của Rễ hút sinh khí sau khi xem ảnh: **rễ màu rễ chìm vào đường đất** ở ảnh R3, nên rễ có viền mực 11 px dưới nét 6 px; lúc hút có một đốm hổ phách (sinh khí) chạy ngược rễ về tán trong 0,7 s; than hồng thay lá xanh. `td-1b-boss` quay 8 khung của đòn này và kiểm báo 72 tick, −1 mạng mỗi lần, câu trên thanh boss. Đã chạy ở 1280 × 720 trên mã này (20/20 kiểm đạt) rồi commit (`106db85`).
- Hai chú thích của `src/sim/systems/boss.ts` còn ghi "mỗi 20 s" (số dò), mã là 30 s: sửa trong `106db85`.

Lượt 2 chạy lượt đo 6, bảng `td:balance` chốt và 34 lượt kịch bản, viết giấy tờ, rồi bị ngắt lần nữa (khoảng 17:00) trước khi commit giấy tờ và đo §20. **Lượt 3** (20:14–22:00, Apple M4; bị ngắt lần ba sau các kịch bản, trước khi đo §20 và commit giấy tờ) không làm lại phần đã commit:

- Kiểm lại trên mã đã commit: `pnpm check` 338 test / 31 file đạt, kit sha256 khớp 31 file, "/" 83,75 kB; `pnpm td:golden:check` `same: true` cả hai file (`tmp/mac-2026-10-25/r3close/check.log`, `golden.log`). Mã `src` không đổi từ `106db85` (`1b90fed` của điều phối viên chỉ đổi `media.md5` và `art-src/3d/SOURCES.json`), nên bảng `td:balance` chốt của lượt 2 (`r3final/balance-full.md`, mã `106db85`) vẫn là bảng của mã cuối; đã đối từng ô với bảng ở dưới.
- **`td-1b-learn` trượt ở lượt 2** (1920 × 1080: 10/14 kiểm; 1280 × 720 bị ngắt). Chạy lại nhật ký trang trên Node (`r3close/dim-probe.ts`): lời gọi Chặt mang Từ Ôn "good" sáng khi Draconis cách nó 13,22 m (1280 × 720, tick 2254; 1920 × 1080: 13,02 m, tick 2260) và đang đi xa, rồi tắt 8 (10) tick sau khi Draconis ra quá 14 m (vòng giúp `AGENT.heroRingM`): đúng luật "lời gọi rời mọi vòng giúp thì tắt" của `sim/systems/attention.ts`, không phải lỗi kịch bản hay lỗi Học. Phím của kịch bản tới sau đó, không còn thẻ nào nhận. Kịch bản giờ ghi lần đó vào `dimmed` (không tính là một lần gõ) và chờ Từ Ôn kế; chạy lại hai cỡ: 14/14 kiểm đạt. Thẻ sáng chỉ 8–10 tick (0,13–0,17 s) là một chỗ người chơi cũng thấy: ghi ở "Còn trượt và núm kế".
- Chạy nốt các kịch bản lượt 2 chưa chạy hay bị ngắt: `td-1b-learn`, `td-1b-night5` (1920 × 1080), `td-1b-wood`, `td-theme` đạt ở hai cỡ.

**Lượt 4** (27/10 01:17–01:45, Apple M4) chỉ làm phần lượt 3 để lại, không chạy lại lượt cân bằng nào:

- Kiểm trên mã đã commit (`7f54641`, `src` như `106db85`): `pnpm check` 338 test / 31 file, kit sha256 khớp, "/" 83,75 kB (chừa 1,25 kB), `?title=0` 82,36 kB; `pnpm td:golden:check` `same: true` cả hai file; 10.492 dòng (`tmp/mac-2026-10-25/r3done/`).
- Đối mọi số của giấy tờ với file bằng chứng (bảng chốt, sáu lượt đo, hai đầu dò Thử thách, đầu dò không Học): mọi số tìm được nguồn.
- **`td-balance` trượt ở hai cỡ** (`profile`, `nightRelax`, `nightChallenge`): kịch bản chờ "×1,0x" cho hồ sơ 45 WPM, 91 %; từ `b655de2` E 45–64 nhận từ 4–8 chữ, nên k của hồ sơ đó là 0,958 (thẻ Hồ sơ gõ: "×0,96 chậm hơn chuẩn", đã xem ảnh). Số cứng cũ của kịch bản, không phải lỗi game. `5c3b939`: k trên thẻ phải bằng k của đầu ván và bảng hộp cát (kiểm mới `profileKIsTheRunK`). Chạy lại: 12/12 ở hai cỡ.
- Đo §20 trên Mac xen kẽ với mốc §1.2, vết Chrome A/B, `td-1a6-perf`, lớp boss, bước sim trên Node A/B và hồ sơ CPU của nó (dưới).

## Mục phản biện và việc mở đã xử lý

| Mục (nguồn) | Đã làm |
|---|---|
| Bước 9 phải cắt dòng trước khi viết (còn 14 dòng, `R3_PLAN.md` §8; changelog luật gỗ) | Không cắt luật: `1f77e48` gói lại chín đầu file viết ở 80 cột về 120 cột như các file khác (chỉ chú thích, không đổi chữ nào), lấy lại 27 dòng. Cuối đợt 10.492 dòng (trần 10.500) |
| B1, B3, B4 bộ 2, B7 gộp trượt trên luật gỗ; đích chặt gộp 1/6 (`BUILD_NOTES` §7.8) | Sáu lượt đo; B3, B7 đạt; đích chặt gộp 5/6; B4 đạt ở bộ 2 và gộp, **bộ 1 hòa** (xem "Còn trượt") |
| G3 trượt bộ 2 (R2 lần 2) | Đạt mọi bộ: 47,5 / 47,7 / 47,5 s |
| Núm 1 "khoản mạng ở đỉnh boss mà bot mạnh không dọn được" (`R3_PLAN.md` §7.1, A14) | Rễ hút sinh khí, 1 mạng mỗi 30 s (A27, **đã chọn theo đề xuất**) |
| Núm 2 `LENGTH_BY_E` (§7.2) | E 45–64: 4–7 → 4–8 chữ (Khá, Ẩu +13 điểm thắng cùng seed) |
| Núm 3 trọng số độ chính xác của kit (§7.3) | Chỉ đo bằng đầu dò (kit không sửa): kéo Ẩu lên 87 % nhưng làm trượt Chậm chắc, Khá và B4; đề xuất cho điều phối viên ở "Núm kế" |
| Ảnh R3: rễ của Rễ hút khó thấy trên đường đất | Rễ viền mực, đốm hổ phách (`106db85`) |
| §20 đo trên Mac, xen kẽ với mốc §1.2 | Đạt trên Apple M4 (dưới): A/B ABBA với `89e2494`, vết Chrome A/B, `td-1a6-perf`, lớp boss, bước sim trên Node; R3 thêm 0–0,26 ms mỗi khung, phần tăng ở bước sim (hào quang của Đầu Đàn) |
| Chạy lại mọi kịch bản cũ trên mã R3 | 22 kịch bản × 2 cỡ, 44/44 đạt; hai lỗi kịch bản tìm được và sửa (`td-1b-learn` ở `a23c910`, `td-balance` ở `5c3b939`) |

## Luật mới và số đổi (`b655de2`)

| Thứ | Trước | Sau | Vì sao (số đo ở `BUILD_NOTES` §7.9) |
|---|---|---|---|
| **Rễ hút sinh khí** (đòn mới của Mộc Tinh) | — | Từ lúc trồi, mỗi 30 s, boss ở đâu cũng vậy: rễ bò từ chân boss tới Lũy trong 1,2 s × `warnK` (vòng son khép quanh Lũy, "−1 mạng", tiếng rền và kẽo kẹt), rồi −1 mạng (chip Mạng nháy, đốm hổ phách về tán, tiếng gõ gỗ và chuông trầm); cú choáng 70 % tính lại đồng hồ; lần đầu boss nói "Sinh khí làng này... ngọt quá." và thanh boss dạy "Rễ hút 1 mạng mỗi 30 s: hạ nó nhanh!" | Bot mạnh dọn được toán đi trước và Mầm Gỗ bằng Tối Thượng, nên mạng mất ở đỉnh boss chỉ còn theo quái lọt và Biên S của họ là 65–70 %. Đòn theo thời gian boss sống: ai cũng trả, hạ nhanh trả ít. 30 s đưa Biên S của Chuẩn 65 → 55 %; 20 s lấy thêm 5 điểm thắng của bot chậm mà không cần |
| `LENGTH_BY_E` E 45–64 | 4–7 chữ | 4–8 chữ | Ẩu, Khá (E 50) thắng 65 → 78 %, 69 → 82 % cùng seed; bot khác không đổi; cổng 5a 7,90 s vẫn ≤ 8 s |
| Sàn nhịp k (`PACE.k`) | 0,75 (BALANCE §4.1) | 0,70, chỉ ở Lời Gọi (A28, **đã chọn theo đề xuất**) | k của chính bot Mới là 0,698; sàn 0,75 bắt nó chơi nhịp nhanh hơn sức 7 %: Mới 65 → 84 % cùng seed, bot khác không đổi |
| Hệ số k của máu boss | 0,3 / 6,5, trần 1,46 | 0,4 / 5,5, trần 1,42 | k 0,70: ×0,88; Khá gần như cũ (×1,150); Nhanh −2,7 % máu (bộ dò 75 → 80 %) |

File vàng làm lại có chủ đích ở `b655de2`: `td-1a` đổi mã nội dung và hai cột mới của Rễ hút trong kho boss (ván không đổi, 19.660 tick); `td-1b-boss` có hai lần Rễ hút, mạng cuối 20 → 18 (5.306 tick). `1f77e48`, `106db85` không đổi file vàng.

## Sáu lượt đo (tối đa của họ cổng "B1 + đích chặt")

Mỗi lượt đo trên hai bộ seed: **bộ cổng** 1–240 (seed của `pnpm td:balance`) và **bộ dò** 241–480 (để không chỉnh khớp seed). Cân bằng, sáu bot gõ, thắng / Biên S gộp 240 ván; in đậm: ngoài đích chặt (thắng 78–88 % mọi bot; Biên S 40–60 % bot Chuẩn, 35–65 % bot khác).

| Lượt | Nhánh (số ghi đè) | Seed | Mới | Chậm chắc | Chuẩn | Khá | Ẩu | Nhanh | G3 gộp |
|---|---|---|---|---|---|---|---|---|---|
| 0 | `b58bd54` luật gỗ, chưa núm (§7.8, `wood/balance-full.md`) | 1–240 | **62** / **25** | 84 / **70** | 87 / **65** | **71** / 60 | **74** / 55 | 82 / 65 | 48,1 s |
| 1 (40 seed × 2) | không Rễ hút | 241–320 | **56** / **15** | 88 / **70** | 88 / **65** | **73** / 60 | **64** / 40 | **78**† / 65 | 56,4 s |
| 1 | Rễ hút 20 s | 241–320 | **43** / **0** | **76** / 50 | 84 / 50 | **71** / 45 | **54** / **18** | **76** / 50 | 56,2 s |
| 1 | Rễ hút 20 s, Chặt 3 từ | 241–320 | **55** / **13** | 81 / 55 | 81 / 50 | **70** / 50 | **59** / **10** | 80 / 50 | 47,9 s |
| 2 (sàng một núm) | không Rễ hút (gốc của lượt) | 241–480 | **62** / **30** | 83 / **70** | 85 / **65** | **69** / 55 | **65** / **30** | **77** / 65 | 54,2 s |
| 2 | Rễ hút 20 s | 241–480 | **50** / **2,5** | **73** / 50 | **78**† / 50 | **67** / 40 | **55** / **15** | **73** / 50 | 51,4 s |
| 2 | Rễ hút 30 s | 241–480 | **55** / **15** | **78**† / 60 | 81 / 55 | **68** / 50 | **60** / **20** | **75** / 55 | 52,9 s |
| 2 | Chặt 3 từ (`CALL.words.chop`) | 241–480 | **68** / 40 | 86 / **75** | **88**† / **65** | **73** / 60 | **75** / 50 | 84 / 65 | 50,6 s |
| 2 | Mầm Gỗ 2 mỗi lần | 241–480 | **66** / 35 | 87 / **70** | **88**† / **65** | **71** / 60 | **70** / 45 | 79 / 65 | 54,7 s |
| 2 | `kHp` 0,6, `kHp2` 4,5 | 241–480 | 80 / 45 | **94** / **75** | 85 / **65** | **75** / 60 | **61** / **30** | **77** / 65 | 54,2 s |
| 2 | `LENGTH_BY_E` E 45–64: 4–8 chữ | 241–480 | **62** / **30** | 83 / **70** | 85 / **65** | 82 / 55 | **78**† / 65 | **77** / 65 | 54,2 s |
| 2 | Mỏ 3, Ruộng 2 mỗi từ Hoàn hảo | 241–480 | **56** / **18** | 84 / **70** | 82 / **65** | **71** / 60 | **67** / 40 | 79 / 65 | 54,4 s |
| 2 | `POWER.quick` 0,9 | 241–480 | **66** / **28** | 84 / **70** | 87 / **65** | **74** / 60 | **74** / 50 | 83 / 65 | 54,1 s |
| 3 | Rễ hút 30 s + 4–8 chữ + `kHp` 0,5, `kHp2` 5,5 | 1–240 | **65** / **30** | **90** / 65 | 83 / 55 | 82 / 50 | **77** / 55 | 80 / 60 | 47,5 s |
| 3 | như trên | 241–480 | **65** / **33** | 88 / 65 | 81 / 55 | **75** / 45 | **75** / 55 | **75** / 55 | 52,9 s |
| 4 | lượt 3 + sàn k 0,70 | 241–480 | 84 / 55 | 88 / 65 | 81 / 55 | **75** / 45 | **75** / 55 | **75** / 55 | 52,9 s |
| 4 | + bản lề `kLow` 0,8 (mã thử trong cây dò, không vào mã) | 241–480 | **94** / **70** | **90** / 65 | 81 / 55 | **75** / 45 | **75** / 55 | **75** / 55 | 52,9 s |
| 4 | + `kHp` 0,4, `kHp2` 6, `kLow` 1,0 (như trên) | 241–480 | **94** / **70** | 85 / 60 | 81 / 55 | **76** / 45 | **73** / 55 | **75** / 55 | 52,9 s |
| 5 | Rễ hút 30 s + 4–8 chữ + sàn k 0,70 + `kHp` 0,4, `kHp2` 5,5, `kHpMax` 1,42 → **`b655de2`** | 1–240 | 78 / 55 | 86 / 65 | 83 / 55 | 84 / 50 | **77** / 55 | 83 / 60 | 47,5 s |
| 5 | như trên | 241–480 | 79 / 50 | 84 / 60 | 81 / 55 | **77** / 45 | **73** / 55 | 80 / 55 | 52,9 s |
| 6 | lượt 5 + máu boss 4.200 → 4.100 (§6.5 bước 1) | 1–240 | 81 / 55 | **90** / 65 | 86 / 60 | 84 / 50 | 81 / 55 | 86 / 60 | 48,4 s |
| 6 | như trên | 241–480 | 82 / 60 | 87 / 65 | 84 / 55 | 80 / 45 | **78**† / 55 | 84 / 55 | 51,8 s |
| 6 | lượt 5 + `POWER.quick` 0,8 → 0,85 | 1–240 | 80 / 50 | **88**† / 65 | **88**† / 60 | 84 / 50 | **73** / 55 | 86 / 55 | 48,5 s |
| 6 | như trên | 241–480 | **78**† / 55 | 84 / 60 | 82 / 60 | 80 / 45 | **75** / 55 | **78**† / 60 | 51,5 s |
| 6 | lượt 5 + E 45–64 từ 5–8 chữ, `kHp2` 7 (núm 2 tiếp) | 1–240 | 78 / 55 | 86 / 65 | 83 / 55 | 87 / 50 | **68** / 40 | 83 / 60 | 47,5 s |
| 6 | như trên | 241–480 | 79 / 50 | 84 / 60 | 81 / 55 | 83 / 50 | **71** / 45 | 80 / 55 | 52,9 s |
| 6 | lượt 5 + núm 3 (đầu dò, kit không sửa: E_eff = E·(0,2 + 0,8·a²)·(1 − 0,5·CV), sàn 0,6·E) | 1–240 | 78 / 55 | 82 / 55 | 83 / 55 | **77** / 45 | 87 / 55 | 83 / 60 | 47,5 s |
| 6 | như trên | 241–480 | 79 / 50 | **75** / 45 | 81 / 55 | **76** / 45 | 87 / 55 | 80 / 55 | 52,9 s |


† Báo cáo in thắng làm tròn tới 1 %; ô này là 77,5–77,9 % (hay 88,1–88,4 %) nên trượt đích 78–88 %.

**Không lấy số nào của lượt 6**: `b655de2` (lượt 5) giữ nguyên. Máu boss 4.100 đưa Ẩu lên 81 % nhưng Chậm chắc lên 90 % (bộ 2: 91 %, B1 của bộ trượt) và hàng tắt nhịp lên 91 % (B7 trượt); `POWER.quick` 0,85 hạ Ẩu xuống 73 %; từ 5–8 chữ cho E 45–64 hạ Ẩu xuống 68 % (từ ngắn nhất dài hơn, sai nhiều hơn mỗi từ); núm 3 (đầu dò, không phải số của làn này) đưa Ẩu tới 87 % nhưng Khá xuống 77 %, Chậm chắc 75 % ở bộ dò, và B4 trượt. Chậm chắc (86 %, Biên S 65 %) đã ở sát mép trên, nên mọi núm làm ván dễ đều tay đều chạm nó trước khi Ẩu tới 78 %. Bảng nhánh ở `BUILD_NOTES` §7.9.

## Kết quả cuối (`td:balance --threads=4`, đủ mọi chế độ, mã `106db85`)

Cân bằng, bộ 1 / bộ 2:

| Bot | k | Thắng | Biên S | Áp lực P | Nhàn I | Ngộp O | Gần thua N | Quãng Q |
|---|---|---|---|---|---|---|---|---|
| Trẻ em | 0,700 | **0 %** / **1,7 %** | **0 %** / **0 %** | 27 / 27 % | 2,8 / 3 % | 0 / 0 % | 0,00 / 0,02 | 68 / 68 % |
| Mới | 0,700 | 79 / 78 % | 55 / 50 % | 22 / 22 % | 2,1 / 2 % | 0 / 0,1 % | 0,08 / 0,13 | 67 / 67 % |
| Chậm chắc | 0,790 | 83 / 88 % | 60 / 65 % | 21 / 22 % | 2,8 / 2,8 % | 0 / 0 % | 0,13 / 0,10 | 67 / 67 % |
| Chuẩn | 1,000 | 82 / 84 % | 60 / 55 % | 21 / 22 % | 4,7 / 5 % | 0,1 / 0,1 % | 0,08 / 0,10 | 66 / 67 % |
| Khá | 1,133 | 85 / 83 % | 50 / 45 % | 22 / 22 % | 3,9 / 3,8 % | 0,1 / 0,1 % | 0,05 / 0,07 | 67 / 67 % |
| Ẩu | 0,982 | 78 / 76 % | 60 / 55 % | 22 / 23 % | 5,1 / 5,3 % | 0,2 / 0,2 % | 0,09 / 0,13 | 67 / 67 % |
| Nhanh | 1,300 | 86 / 81 % | 55 / 60 % | 21 / 21 % | 3 / 3,5 % | 0,1 / 0,1 % | 0,06 / 0,03 | 67 / 67 % |
| Không gõ | 1,000 | **0 %** / **0 %** | **0 %** / **0 %** | 32 / 32 % | 1 / 1,1 % | 0,1 / 0,1 % | 0,00 / 0,00 | 68 / 68 % |
| Chỉ gõ | 1,000 | **0 %** / **0 %** | **0 %** / **0 %** | **49 %** / **50 %** | 0 / 0 % | 0 / 0 % | 0,00 / 0,00 | **97 %** / **97 %** |
| Chuẩn, chiến thuật Tốt | 1,000 | **92 %** / 87 % | 65 / 65 % | 20 / 20 % | 4,3 / 4,7 % | 0,1 / 0,1 % | 0,07 / 0,04 | 66 / 67 % |
| Chuẩn, chiến thuật Kém | 1,000 | **21 %** / **26 %** | **0 %** / **0 %** | 28 / 28 % | 1,7 / 2,1 % | 0 / 0 % | 0,06 / 0,06 | 67 / 67 % |
| Không gõ, Tướng đuổi boss | 1,000 | **0 %** / **0 %** | **0 %** / **0 %** | 32 / 32 % | 1 / 1,1 % | 0,1 / 0,1 % | 0,00 / 0,00 | 68 / 68 % |
| Chuẩn, sổ 20 từ | 1,000 | 79 / 84 % | 60 / 60 % | 22 / 21 % | 5,1 / 5 % | 0 / 0 % | 0,04 / 0,06 | 67 / 67 % |
| Chuẩn, tắt nhịp | 1,000 | 85 / 87 % | 55 / 55 % | 22 / 22 % | 4,9 / 4,9 % | 0,1 / 0,1 % | 0,09 / 0,10 | 67 / 67 % |

**Gộp hai bộ (240 ván mỗi ô), đích chặt §6.4, Cân bằng:**

| Bot | Thắng bộ 1 / 2 / gộp | Biên S bộ 1 / 2 / gộp | Gần thua N gộp | Đích chặt gộp |
|---|---|---|---|---|
| Mới | 79 / 78 / 78 % | 55 / 50 / 55 % | 0,10 | đạt |
| Chậm chắc | 83 / 88 / 86 % | 60 / 65 / 65 % | 0,11 | đạt |
| Chuẩn | 82 / 84 / 83 % | 60 / 55 / 55 % (40–60 %) | 0,09 | đạt |
| Khá | 85 / 83 / 84 % | 50 / 45 / 50 % | 0,06 | đạt |
| Ẩu | 78 / 76 / **77 %** | 60 / 55 / 55 % | 0,11 | **trượt** (thắng) |
| Nhanh | 86 / 81 / 83 % | 55 / 60 / 60 % | 0,04 | đạt |
| Chuẩn, sổ 20 từ | 79 / 84 / 82 % | 60 / 60 / 60 % | 0,05 | (báo cáo) |
| Chuẩn, tắt nhịp | 85 / 87 / 86 % | 55 / 55 / 55 % | — | đạt (B7) |

Đích chặt gộp: **5/6** (luật gỗ chưa núm: 1/6; R2 lần 3: 4/6). Chuẩn chiến thuật Tốt 89 %, Kém 23 % (B6: 66 điểm). Không gõ 0 %, Không gõ thả Tướng đuổi boss 0 % và boss rút 0/240 (B5).

**Cổng B1–B9** (bộ 1 / bộ 2 / gộp; gộp chấm B1 và hàng tắt nhịp của B7 theo đích chặt):

| # | Bộ 1 | Bộ 2 | Gộp | Số đo |
|---|---|---|---|---|
| B1 | đạt | đạt | **trượt** | Mỗi bộ trong dải BALANCE §3 (thắng 75–90 %, Biên S 35–65 %, P, I, O); gộp: Ẩu 77 % < 78 % |
| B2 | đạt | đạt | đạt | Không bot nào S ≥ 90 % kèm I ≥ 20 % (I cao nhất 5,3 %, Ẩu) |
| B3 | đạt | đạt | đạt | Mới ở Cân bằng 79 / 78 / 78 % (≥ 70 %); Trẻ em ở Thư giãn 94 / 96 / 95 % (≥ 85 %) |
| B4 | **trượt** | đạt | đạt | Biên S Chậm chắc so với Ẩu: 60 = 60 % (cần lớn hơn) / 65 > 55 % / 65 > 55 %; hạ quái (bộ 1 / 2 / gộp) Chuẩn 2,91 / 2,85 / 2,88 s, Ẩu 3,08 / 3,11 / 3,10 s; sát thương lên boss p50 Chuẩn 39,5 / 40,6 / 40,0 mỗi giây, Ẩu 37,2 / 36,6 / 36,8 |
| B5 | đạt | đạt | đạt | Không gõ thua ở Cân bằng và Thử thách; `heroKite` 0 lần boss rút |
| B6 | đạt | đạt | đạt | Tốt hơn Kém ≥ 10 điểm: Cân bằng 89 so với 23 %, Thử thách 91 so với 14 % (gộp) |
| B7 | đạt | đạt | đạt | ≤ 3 bậc mỗi đợt (cao nhất 2,50, Mới), khoảng sinh 86–114 %; tắt nhịp: Chuẩn 85 / 87 / 86 %, Biên S 55 % |
| B8 | đạt | đạt | đạt | Cổng học của game mọi ô; B8 R3: 8,0 từ mới mỗi ván (tối đa 8), 0 ở lời gọi có hạn và Đêm 5 |
| B9 | thiếu số | thiếu số | thiếu số | Chờ file chơi thử của chủ dự án (`PLAYTEST_1B.md`) |

- G1–G8 đạt (G1 cổng 5a 7,90 s; G2 Đêm 1–4 22,6 %, Đêm 5 24,5 %; G3 47,5 / 47,7 / 47,5 s; G5 Tối Thượng ≤ 1,9 % lên boss, ≤ 14,4 % cả ải; G6 một lời gọi trực tiếp mỗi 30,2 s ở Đêm 4; G8 24,1 s, Nhàn I 3,0 %; G4, G7 là test). B8 R3: 8 từ mới mỗi ván, 0 ở lời gọi có hạn và Đêm 5.

Bảng đủ BALANCE §3 của hai chế độ còn lại (báo cáo, không là cổng của §21; cùng mã `106db85`, cùng lượt chạy):

Thư giãn, bộ 1 / bộ 2:

| Bot | k | Thắng | Biên S | Áp lực P | Nhàn I | Ngộp O | Gần thua N | Quãng Q |
|---|---|---|---|---|---|---|---|---|
| Trẻ em | 0,700 | 94 / 96 % | **45 %** / **48 %** | **20 %** / **20 %** | 3,6 / 4 % | 0 / 0 % | 0,19 / 0,23 | **65 %** / **65 %** |
| Mới | 0,700 | 100 / 100 % | 95 / 95 % | 11 / 11 % | 0,8 / 1,1 % | 0,2 / 0,2 % | 0,00 / 0,00 | **61 %** / **61 %** |
| Chậm chắc | 0,790 | 100 / 100 % | 95 / 95 % | 10 / 10 % | 1,7 / 2,1 % | 0,2 / 0,2 % | 0,00 / 0,00 | **61 %** / **61 %** |
| Chuẩn | 1,000 | 100 / 100 % | 95 / 95 % | 9,1 / 9,5 % | 1 / 1 % | 0,2 / 0,2 % | 0,00 / 0,00 | **63 %** / **62 %** |
| Khá | 1,133 | 100 / 100 % | 95 / 90 % | 11 / 11 % | 1,6 / 1,9 % | 0,3 / 0,3 % | 0,00 / 0,00 | **64 %** / **64 %** |
| Ẩu | 0,982 | 100 / 100 % | 95 / 95 % | 9,6 / 9,9 % | 1,1 / 1,3 % | 0,3 / 0,3 % | 0,00 / 0,00 | **62 %** / **63 %** |
| Nhanh | 1,300 | 100 / 100 % | 85 / 85 % | 12 / 12 % | 1,5 / 1,4 % | 0,3 / 0,3 % | 0,00 / 0,00 | **63 %** / **63 %** |
| Không gõ | 0,750 | 100 / 100 % | **60 %** / **45 %** | **16 %** / **15 %** | 1 / 1 % | **4,4 %** / **4,5 %** | 0,06 / 0,04 | **66 %** / **66 %** |
| Chỉ gõ | 1,000 | **0 %** / **0 %** | **0 %** / **0 %** | **49 %** / **49 %** | 0 / 0 % | 0 / 0 % | 0,00 / 0,00 | **97 %** / **97 %** |
| Chuẩn, chiến thuật Tốt | 1,000 | 100 / 100 % | 95 / 95 % | 9,3 / 9,2 % | 0,8 / 0,7 % | 0,2 / 0,2 % | 0,00 / 0,00 | **63 %** / **63 %** |
| Chuẩn, chiến thuật Kém | 1,000 | 97 / 98 % | 70 / 80 % | **17 %** / **16 %** | 3,8 / 3,8 % | 0,1 / 0,2 % | 0,13 / 0,14 | **64 %** / **64 %** |

Thử thách, bộ 1 / bộ 2:

| Bot | k | Thắng | Biên S | Áp lực P | Nhàn I | Ngộp O | Gần thua N | Quãng Q |
|---|---|---|---|---|---|---|---|---|
| Trẻ em | 0,700 | **6,7 %** / **2,5 %** | **0 %** / **0 %** | 32 / 32 % | 2,4 / 2,6 % | 0 / 0 % | 0,03 / 0,01 | 68 / 68 % |
| Mới | 0,700 | **90 %** / **94 %** | **50 %** / **55 %** | **23 %** / **22 %** | 4,6 / 4,6 % | 0 / 0 % | 0,19 / 0,20 | 67 / 67 % |
| Chậm chắc | 0,790 | **94 %** / **95 %** | **55 %** / **50 %** | **22 %** / **22 %** | 2,9 / 3,1 % | 0 / 0 % | 0,10 / 0,13 | 67 / 67 % |
| Chuẩn | 1,000 | **88 %** / **88 %** | 45 / 45 % | **23 %** / **23 %** | 3,8 / 3,6 % | 0 / 0 % | 0,12 / 0,17 | 67 / 67 % |
| Khá | 1,133 | **91 %** / **91 %** | **50 %** / 45 % | **21 %** / **22 %** | 3 / 3,1 % | 0 / 0 % | 0,14 / 0,14 | 67 / 67 % |
| Ẩu | 0,982 | 67 / 60 % | 30 / 20 % | **26 %** / **26 %** | 3 / 3 % | 0,1 / 0,2 % | 0,16 / 0,20 | 67 / 67 % |
| Nhanh | 1,300 | **93 %** / **88 %** | **50 %** / 45 % | **21 %** / **21 %** | 4,5 / 4,4 % | 0 / 0 % | 0,17 / 0,16 | 67 / 67 % |
| Không gõ | 1,008 | **0 %** / **0 %** | **0 %** / **0 %** | 37 / 37 % | 1,6 / 1,3 % | 0 / 0 % | 0,00 / 0,00 | 68 / 68 % |
| Chỉ gõ | 1,000 | **0 %** / **0 %** | **0 %** / **0 %** | 48 / 48 % | 0 / 0 % | 0 / 0 % | 0,00 / 0,00 | **97 %** / **97 %** |
| Chuẩn, chiến thuật Tốt | 1,000 | **90 %** / **92 %** | 45 / 45 % | **22 %** / **22 %** | 3,2 / 3,1 % | 0 / 0 % | 0,13 / 0,13 | 67 / 67 % |
| Chuẩn, chiến thuật Kém | 1,000 | **13 %** / **15 %** | **0 %** / **0 %** | 31 / 33 % | 2,3 / 2,8 % | 0 / 0 % | 0,07 / 0,07 | 68 / 68 % |
| Không gõ, Tướng đuổi boss | 1,008 | **0 %** / **0 %** | **0 %** / **0 %** | 37 / 37 % | 1,6 / 1,3 % | 0 / 0 % | 0,00 / 0,00 | 68 / 68 % |

- Thư giãn: Mới tới Nhanh thắng 100 %, Trẻ em 95 % (B3), Biên S Trẻ em 45 % (đích ≥ 70 % chỉ báo cáo), Quãng Q 61–66 % (ngoài ≤ 45 %, như mọi lượt từ 1A.7).
- **Thử thách dễ hơn Cân bằng** (báo cáo, không là cổng): Mới 92 %, Chậm chắc 95 %, Chuẩn 88 %, Khá 91 %, Nhanh 90 % gộp, dải 50–75 %; chỉ Ẩu 63 % trong dải. Vì sao: mọi ván thua là thua ở boss, mà boss ở Thử thách có máu ×1,19 × `modeHp` 0,78 = ×0,93 của Cân bằng. Hai đầu dò ở lượt 3 (chỉ Thử thách, số ghi đè, mã không đổi, seed 1–240): `modeHp.challenge` 0,9 cho Mới 75, Chậm chắc 86, Chuẩn 69, Khá 79, Ẩu 50, Nhanh 75 % (4/6 trong dải; Tốt 85 % so với Kém 10 %, Không gõ 0 %); 1,0 quá tay (Chuẩn 48 %, Biên S 0 %, Ẩu 39 %). Áp lực P 21–28 % ở cả ba số, dưới dải 30–50 %. Núm kế (lượt riêng, không phải cổng của §21): `modeHp.challenge` 0,9, rồi một núm Đêm riêng của Thử thách cho P. Bảng ở `BUILD_NOTES` §7.9.
- Học lấy của Ẩu 3 điểm (đầu dò cùng 240 seed không danh sách học: 80 %), của Chuẩn 0 (83 %); Chậm chắc có Học thắng hơn (83 → 86 %).

## Cổng cứng §21

| # | Cổng | Kết quả | Số đo (Apple M4) |
|---|---|---|---|
| 1 | `pnpm check`, `tests/boundary.test.ts` | đạt | kit sha256 khớp 31 file, 338 test / 31 file, `tsc`, `vite build`; "/" 83,75 kB ≤ 85 kB (chừa 1,25 kB), `?title=0` 82,36 kB, tổng 100,20 kB |
| 2 | Tất định | đạt | `td:golden:check` `same: true` (`td-1a` 19.660 tick, `td-1b-boss` 5.306 tick, nội dung `cd59313e`); 15 kịch bản × 2 cỡ chạy lại nhật ký trang trên Node ra cùng mã băm; `td-1a6-perf`: Chrome bước nhật ký vàng ra cùng 327 mã băm |
| 3 | Bất biến | đạt | test thuộc tính trong `pnpm check`; `td:balance`: "Bất biến vỡ và lệnh bị từ chối (mọi chế độ): không có" |
| 4 | Ngân sách chú ý | đạt | cổng 5a 7,90 s ≤ 8 s; bot Chuẩn kiểu người: cửa sổ đầy nhất p50 7,67 s, lớn nhất 9,08 / 9,45 s, ván quá 8 s 10 / 16 trong 120 (≤ 20 %); G2 đạt |
| 5 | B1–B8 hai bộ × 120, đích chặt gộp | **trượt** | B4 bộ 1 (Biên S Chậm chắc 60 % = Ẩu 60 %); đích chặt gộp 5/6 (Ẩu 77 %, cần 78 %); mọi cổng khác của B1–B8 đạt ở hai bộ và gộp |
| 6 | G1, G3, G4, G8; G5, G6; B8 R3 | đạt | G3 47,5 / 47,7 / 47,5 s; G8 24,1 s, Nhàn I 3,0 %; G5 ≤ 1,9 % lên boss, ≤ 14,4 % cả ải; G6 30,2 s; B8 R3 8 từ mới mỗi ván, 0 ở lời gọi có hạn và Đêm 5 |
| 7 | Boss đọc được | đạt | `td-1b-boss` 20/20, `td-1b-night5` 12/12 ở hai cỡ; ảnh chậm thấy mọi báo đòn, cả Rễ hút (rễ viền mực, vòng son, "−1 mạng"); điểm yếu: 4 mầm báo Mầm Gỗ chỉ ~7 px |
| 8 | Hiệu năng §20 | đạt | bảng dưới |
| 9 | Mọi kịch bản, hai cỡ, 0 lỗi console | đạt | 44/44 lượt; lỗi console chỉ có lỗi cố ý của `td-1b-chunks`; 0 ngoại lệ |
| 10 | Số dòng ≤ 10.500 | đạt | 10.492 |
| 11 | Changelog, `BUILD_NOTES` §7, `AGENTS.md` | đạt | file này, `BUILD_NOTES` §7.9, dòng trạng thái `AGENTS.md`, mục lục `docs/changelog/README.md` |
| 12 | Chủ dự án chơi thử, số cho B9 | **chờ** | gói sẵn (`PLAYTEST_1B.md`, thêm câu hỏi về Rễ hút sinh khí) |

**R3 chưa qua hết §21:** cổng 5 trượt, cổng 12 chờ chủ dự án; mười cổng còn lại đạt.

**§20 trên Mac** (27/10 01:22–01:33, Chrome 155 macOS, ANGLE Metal, 60 Hz; cả lượt giữ ba chỗ trình duyệt của `heavy.sh --perf`; tải 1,8–4,7). Mốc là `89e2494` (trước R3, như `R3_PLAN.md` §1.2), R3 là mã cuối; cảnh lũ của R3 có 10 loại quái, của mốc 8 (A23).

| Thứ | Ngân sách | Mốc `89e2494` | R3 cuối | Kết quả |
|---|---|---|---|---|
| `td-1b-perf` luồng chính, 1280 × 720 (ABBA, 2 lượt mỗi bên) | ≤ 4 ms | 2,191 / 1,744 ms | 2,040 / 1,846 ms | đạt; chênh ABBA −0,025 ms |
| `td-1b-perf` luồng chính, 1920 × 1080 | ≤ 4 ms | 1,648 / 1,674 ms | 1,727 / 1,754 ms | đạt; chênh +0,080 ms |
| Khung/s (giữ 60 Hz) | | 59,9–60,0 | 59,9 | |
| Vẽ 2D + thẻ p95 | ≤ 8 ms | 1,3–1,7 ms | 1,3–1,5 ms | đạt |
| Khung dài nhất lúc trồi (bước + vẽ) | ≤ 16,7 ms | 3,3–5,2 ms | 2,7–4,5 ms | đạt |
| Vết Chrome, bận cả khung ("đều" / "mưa"), 1280 × 720 | | 1,768 / 1,700 ms | 1,969 / 1,946 ms | +0,20 / +0,25 ms |
| Vết Chrome, 1920 × 1080 | | 1,813 / 1,793 ms | 1,962 / 2,054 ms | +0,15 / +0,26 ms |
| `td-1a6-perf` luồng chính (1280 / 1920) | ≤ 8 ms | — | 1,83 / 1,87 ms, 60,1 khung/s | đạt |
| Bước sim trong Chrome, trung vị | ≤ 0,05 ms | — | 0,02 / 0,03 ms (p95 0,06) | đạt |
| Lớp boss p95 (trồi / giao chiến) | ≤ 0,6 ms | — | 0,3 / 0,2 ms (1280), 0,2 / 0,2 ms (1920) | đạt |
| Bước sim trên Node, boss + lũ 300 + Tối Thượng, p95 | ≤ 0,5 ms | 0,135–0,157 ms | 0,360–0,391 ms | đạt, sát mép |

- Theo vết, phần tăng của R3 là hàm khung của game (+0,10–0,16 ms, gần hết ở bước sim và HUD) và GC (+0,04–0,07 ms); Chrome tự làm không đổi. Cùng mã mốc, vết hôm nay ra 1,77 ms so với 1,32 ms của §1.2 (khác phiên, làn khác chạy việc CPU), nên chỉ so trong cùng phiên.
- **Bước sim trên Node tăng ×2,5 ở cảnh boss** (trung vị 0,045 → 0,115 ms). Hồ sơ CPU: `moveEnemies` chiếm 57 % bước; từ bước 7 mỗi quái duyệt mọi hào quang (`sim/systems/move.ts:29–40`), mà lũ 300 có 33 Đầu Đàn và 33 Troll. Ải truyện bản đồ 1 không có Đầu Đàn, nên ván thật không trả phần này. Núm nếu cần chỗ: gom hào quang theo đường.
- Số Dell (Chrome Windows, RTX 3050 Ti: 3,9–4,6 ms ở 60 Hz, `BUILD_NOTES` §7.5) vẫn là máy yếu nhất phải đạt; chưa đo lại R3 trên Dell.

**Kịch bản:** 22 kịch bản × 2 cỡ, 44/44 lượt đạt trên mã R3 cuối (bảng từng kịch bản ở `BUILD_NOTES` §7.9). Lượt làm 2 chạy 15 kịch bản ở hai cỡ cùng `td-1b-night5` 1280 × 720; lượt 3 chạy `td-1b-learn`, `td-1b-night5` 1920 × 1080, `td-1b-wood`, `td-theme`; lượt 4 chạy `td-balance`, `td-1b-perf`, `td-1a6-perf`. Ghi lại từ ảnh, chưa sửa: ở hộp cát "Đặt sẵn", nhãn kho của ba cụm cây sát nhau còn chồng một phần và bị biểu tượng 🪓 của dân che.

## Còn trượt và núm kế

1. **Đích chặt của Ẩu: 77 % gộp** (cần 78–88 %; mỗi bộ 78 / 76 % vẫn trong dải BALANCE §3). Mọi ván thua của Ẩu là thua ở boss (23–24 %); sát thương lên boss của nó 36,8/s so với Chuẩn 40,0/s, mà nhịp k của nó 0,982 gần bằng Chuẩn: E_eff của kit (trọng số độ chính xác 0,4, sàn 0,7·E) gần như không tính 15 % phím sai, và từ dài của dải E 45–64 làm sức chứa của nó thấp đi chút. Học chỉ lấy 3 điểm (đầu dò ở trên). Núm theo nhịp chung (máu boss, `POWER.quick`) đều đẩy Chậm chắc lên quá 88 % trước khi Ẩu tới 78 % (lượt 6). **Núm kế: núm 3 nhẹ hơn đầu dò** (trọng số độ chính xác 0,6, sàn 0,7: Ẩu k 0,961, Chậm chắc 0,801, Khá 1,137; đầu dò 0,8 / 0,6 kéo Ẩu tới 87 % là quá tay), đi cùng máu boss 4.100 nếu Chậm chắc còn chỗ. Núm 3 ở `src/kit/balance/pace.ts` (`effectiveE`) là kit dùng chung ba game và BALANCE §4.1: **việc của điều phối viên** (sửa `shared/game-kit` có test, đồng bộ ba game); làn này không tự sửa (`R3_PLAN.md` §7.3).
2. **B4 ở bộ 1: Biên S Chậm chắc 60 % bằng Ẩu 60 %** (cần lớn hơn). Bộ 2 và gộp đạt (65 so với 55 %). Biên S là trung vị số mạng (bước 5 %), nên đây là hòa một mạng ở trung vị của 120 ván, không phải Ẩu giữ mạng tốt hơn: hạ quái và sát thương lên boss của Chuẩn vẫn hơn Ẩu ở cả hai bộ. Núm 3 ở trên làm hòa nặng hơn (đầu dò: 55 = 55 % gộp), nên khi đo núm 3 phải đọc B4 cùng lúc; nếu B4 trượt thì cần một núm làm Ẩu mất mạng ở các Đêm (BUILD_1B §6.5 bước 5: máu Thuồng Luồng 385, giáp 60 % là chỗ Phát Chữ của từ chuẩn quyết).
3. Báo cáo, không là cổng: Thử thách quá dễ (núm `boss.modeHp.challenge` 0,9 đã dò, ở trên), Quãng Q của Thư giãn, Gần thua N của Cân bằng (ở trên).
4. Đạt nhưng sát mép: bước sim trên Node ở cảnh boss + lũ 300, p95 0,39 ms (§20 ≤ 0,5 ms; núm: gom hào quang theo đường). Ảnh: 4 mầm báo Mầm Gỗ chỉ ~7 px; nhãn kho chồng nhau ở hộp cát.
5. Chờ chủ dự án: số B9 (chơi theo `PLAYTEST_1B.md`), ba quyết định R2 (`PACE.speedK` 0,3 và trần boss; giữ số sau §7.5; "phần khởi động" ở §20). A27 (Rễ hút mỗi 30 s) và A28 (sàn k 0,70) **đã chọn theo đề xuất**; điều phối viên xem có đưa sàn 0,70 vào BALANCE §4.1 cho cả ba game không.

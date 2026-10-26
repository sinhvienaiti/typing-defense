# Bước 1B "Mộc Tinh tới làng": đặc tả thực thi (24/10/2026)

> **Dành cho:** AI làm code, AI phản biện, chủ dự án.
> **Nguồn:** `TYPING_DEFENSE_DESIGN.md` (TK) §26.1 (hàng 1B) và các mục nó trỏ tới: §7.6, §8.6, §9, §11.12, §12, §17.4, §18.6–18.9, §19.7, §20.2, §20.4, §21, §22.6–22.10, §23.8; `BUILD_NOW.md` §9; `CALLS_V3_1_PLAN.md`; `BUILD_1A6.md`; `BUILD_NOTES.md` §5–§6; `docs/games/BALANCE.md` (repo cha) §3, §7, §9.2.
> **Thứ tự tin:** mã hiện tại > file này > `BUILD_1A6.md` > `CALLS_V3_1_PLAN.md` > TK. Chỗ nào file này khác TK, lý do ở §2.
> **Nền:** repo `games/typing-defense`, nhánh `main`, HEAD `33b9905` (cân bằng vòng 2). Đường dẫn tính từ gốc repo này.
> **Số là số khởi điểm.** Bot chỉnh số trong `src/content/rules.ts` và `src/content/slice-1a.ts`, không sửa luật trong mã.
> **Phản biện:** 24/10/2026, đã sửa trong file; danh sách vấn đề và cách sửa ở §25.

---

## 0. Mục tiêu

**Một câu:** biến hộp cát 1A.6 thành **bản đồ 1 chơi trọn vẹn** (5 Ngày, 5 Đêm), kết bằng **Mộc Tinh nhỏ** có báo trước ở cuối Đêm 5, để người giữ làng tốt thắng mà còn nhiều mạng, người giữ làng yếu thua rõ ràng; cùng lúc đưa vào các món 1B còn hợp với mô hình lời gọi.

**Chủ dự án làm được ở cuối 1B:**

- Từ màn đầu bấm "Bắt đầu" là vào bản đồ 1 Đồng Cỏ Thác Bạc, chơi từ Ngày 1 tới khi Mộc Tinh rút lui (thắng) hoặc Lũy mất hết mạng (thua). Màn kết có sao. Thua thì bấm **"Chơi lại Ngày n"** (thua ở Đêm 5 thì chơi lại từ Ngày 5), không phải chơi lại 10 phút đầu.
- Thấy Mộc Tinh được báo từ đầu Ngày 5 **cùng nhánh đường nó sẽ đi**, có cả Ngày 5 để dời tháp; đếm ngược ở Đêm 5, rồi thấy rõ từng đòn: vòng báo Rễ Trồi dưới nhà, nhà bị tê, cú choáng ở 70 % máu, Mầm Gỗ mọc, rút lui ở 50 %. Mỗi đòn có một việc làm được (§5.5), và câu dạy của boss có ngay từ R1.
- Nâng Lũy bằng tiền thật để mở Chấm, Phẩy; nâng nhà và **bán nhà** (60 %). Nhà mở dần theo ngày (lịch mở §12, có từ R1).
- Dùng **Tối Thượng** của Draconis bằng phím `=` và gõ **Chữ Chiêu** để thêm lông lửa.
- **Ngắt** trống của Lửng Tanuki bằng một từ trên đầu nó.
- Thấy nghĩa tiếng Việt ở hai lần đầu gặp một từ; thấy từ gõ sai quay lại thành **Từ Ôn**; sổ ôn còn giữ sang ván sau.
- Mỗi Ngày, Đêm mới có tối đa hai ý mới, mỗi ý một câu của Bà Cú Mực và một chip mẹo.

**Câu hỏi 1B phải trả lời:**

1. Một đỉnh boss có báo trước có tách được **tỉ lệ thắng** khỏi **Biên an toàn S** không (BUILD_NOTES §6.10)?
2. Boss có đọc được trên bản vẽ 2D không: người chơi có biết đòn nào sắp tới, ở đâu, và làm gì được không?
3. Gõ vẫn là **giúp theo lời gọi**, trong ngân sách chú ý (≤ 8 s gõ mỗi 20 s ở Cân bằng), kể cả ở đêm boss?
4. Người chơi có học được từ (nghĩa, ôn) mà không bị giữ chặt ở thẻ chữ?

---

## 1. Mã hiện tại (đọc trước khi tin kế hoạch cũ)

| Phần | Mã đang có (HEAD `33b9905`) | Ảnh hưởng tới 1B |
|---|---|---|
| Vòng chơi | Ngày (75 s ở Cân bằng), Đêm (hết khi đợt sinh xong và hết quái), Bình minh 3 s; pha `defeat`. **Không có pha thắng.** Hết danh sách 6 đợt thì lặp đợt cuối, tăng 15 % mỗi đợt | Thêm pha `victory` và một **ải** 5 đêm |
| Ải của bot | `tests/td/flow.ts`: thắng = giữ được Đêm 5 trên hộp cát (`sandbox: true`). Lũy lên cấp bằng lệnh hộp cát `keepLevel`, bot tự trừ giá 105 + 45, 182 + 78, 280 + 120 | Bot chơi ải truyện (`sandbox: false`), nâng Lũy bằng lệnh thật |
| Đợt | Đêm 1: 8 Cương Thi. Đêm 2: 10 Cương Thi, 1 Ma Trơi. Đêm 3: 12, 2. Đêm 4: 1 Thuồng Luồng, 10 Cương Thi. Đêm 5: 7 Thuồng Luồng (toán 6), 7 Cương Thi, 3 Ma Trơi | Đêm 5 đổi (§4.2) |
| Quái | Cương Thi 35 máu; Ma Trơi 60 máu, KP 60 %, lọt 1; Thuồng Luồng 365 máu, giáp 60 %, lọt 3, toán 6 | Thêm Mộc Tinh, Mầm Gỗ (R1), Tanuki, Nuppeppō (R2), Troll, Đầu Đàn (R3). Sửa review R1: Thuồng Luồng 385 máu (§4.2, §6.5 bước 5); R2: 420 máu (BUILD_NOTES §7.3) |
| Nhà | Máu có trong dữ liệu nhưng **không gì gây hại nhà**. Nâng cấp có giá (Vàng + 30 % Gỗ, giá cộng dồn TK 12.2). "Bán" chỉ là hoàn tác 5 s | Boss làm tê nhà (không trừ máu, §2); bán 60 % |
| Lũy | Cấp 1–4 chỉ qua hộp cát; cấp Lũy mở người (1 + số Thư Đồng) và thợ xây. Lệnh `upgrade` từ chối id 0 | Nâng Lũy bằng lệnh thật, qua thợ xây; mở theo ngày |
| Lời gọi | `calls.ts`, `attention.ts`: 6 loại (Bắn mạnh, Xây, Gặt, Chặt, Đào, Hỏi bài); trần SÁNG theo chế độ; ngân sách gõ giữ **từng từ**, nhìn trước (BUILD_NOTES §5.4) | Thêm loại `ult`, `direct` (R2); boss dùng Bắn mạnh có sẵn |
| Gõ | Chấm Chớp / Hoàn hảo / Tốt / Vừa / Ẩu; từ Ẩu ×0,6 việc; Chuỗi; Phát Chữ ×9 (vòng 1 cân bằng); Cháy của Draconis 55/s khi Phát Chữ của Pháo trong vòng Tướng | Cháy ×1,25 lên Mộc Tinh |
| Tướng | Draconis: cầu lửa 22–34 phép mỗi 1,6 s (17,5/s), tầm 9 m, chỉ bắn khi đứng; bay 6 m/s | Mạnh nhất trong các nguồn tự đánh lên boss: Vỏ dày ×0,5 (§5.1) |
| Chạy lại | `runLog`, `replayTo` (world.ts); phiên ghi nhật ký lệnh; `__td.log()`, `flags()` | Đủ cho "Chơi lại Ngày n" (§4.3) |
| Nhiệt, hào quang, nhịp phát, Bùng Nổ | **Đã bỏ** ở 1A.6 | Cụm chốt, Bùng Nổ không còn chỗ (§2) |
| Học | Nghĩa `vi` hiện 1 s sau khi gõ xong; chế độ Học hiện nghĩa trước; sổ ôn 20 từ (từ Ẩu hoặc ≥ 2 lỗi); Thư Đồng hỏi bài ban Ngày. **Không gửi sự kiện học**, sổ ôn mất khi đóng trang | R3: luật nghĩa, Từ Ôn, sổ ôn lưu, kế hoạch học, sự kiện học |
| Cân bằng | Kit `balance` (hồ sơ, nhịp k, FlowMeter, PaceDirector, `HumanTypist`, B1–B9); `pnpm td:balance` 2 bộ seed × 120. Cân bằng: thắng 83–89 %, Biên S 35–40 % (Chậm chắc 50–58 %) | Mục tiêu chặt của 1B ở §6, §18 |
| Số dòng | **7.499 / 7.500** (`.ts` trong `src`, trừ `src/kit`) | Trần mới ở §16 |
| Tất định | File vàng `tests/golden/td-1a.json`: nội dung `bf0c4da8`, 18.136 tick, 302 mã băm; Node và Chrome cùng mã băm | Làm lại mỗi đợt có đổi luật |
| Luồng ngẫu nhiên | Kit có sẵn `spawn`, `combat`, `crit`, `words`, `rare`, `loot`, `ai`, `props` | 1B không cần luồng mới, không sửa kit |

---

## 2. Từng món 1B sau mô hình lời gọi

TK §26.1 và BUILD_NOW §9 viết danh sách 1B **trước** khi có Lời Gọi (1A.6). Bảng này chốt món nào còn hợp.

| Món (TK 26.1) | Quyết định | Đợt | Lý do |
|---|---|---|---|
| Boss Mộc Tinh nhỏ | **Vào**, là trọng tâm | R1 | Đỉnh có báo trước ở cuối Đêm 5 để tách thắng và Biên S (§6) |
| Bản đồ 1 theo bảng dạy | **Vào**, đổi thành 5 Ngày, 5 Đêm | R1 (ải), R3 (bảng dạy) | TK 22.9 có 8 đợt; mô hình Ngày và Đêm làm mỗi chu kỳ dài hơn một đợt cũ. Đo bot Chuẩn: ải 5 đêm hiện dài ~10,5 phút (Ngày 375 s, Đêm 30 / 48 / 53 / 45 / 67 s); thêm đỉnh boss ~1,5–2 phút thành ~12 phút, đúng mức của TK §4.3 |
| Nâng cấp và bán có giá | **Vào** | R1 | Giá nâng đã có. Thêm bán 60 % và nâng Lũy bằng tiền |
| Lũy mở ô trong chế độ truyện | **Vào**, Lũy tối đa cấp 3 ở bản đồ 1 | R1 | Bot cân bằng vòng 2 đã chơi với Lũy 3 (Chấm, Phẩy). Lệch TK 12.4 ("1B: Lũy 1–2"); Gạch (Lũy 4) chỉ ở hộp cát |
| Tối Thượng và Chữ Chiêu | **Vào**, Chữ Chiêu là một lời gọi | R2 | Hợp mô hình: bấm `=` là ra đòn đủ sức gốc; gõ chỉ thêm sức, bỏ qua không mất gì |
| Mảnh Chữ (ghi sổ) | **Vào**, chỉ để nạp Tối Thượng | R2 | Cho Tướng một lý do đứng gần chỗ đánh nhau ban Đêm. Chữ bay về Tướng để 1C |
| Gõ trực tiếp Ngắt, Neo, Phá Khiên | **Vào** dạng lời gọi `direct` nếu vừa ngân sách chú ý | R2 (Ngắt), R3 (Neo, Phá Khiên, chỉ hộp cát) | Đo: Đêm hiện chỉ gõ 20–23 % thời gian, ngân sách 40 %; một từ trực tiếp ~1,7 s ở 35 WPM (§9.6) |
| Từ Ôn, nghĩa tiếng Việt | **Vào** | R3 | Sổ ôn và Hỏi bài đã có; 1B thêm luật nghĩa TK 21.2, Từ Ôn trong lời gọi, sổ ôn lưu qua ván |
| Kế hoạch học, khởi động lạnh | **Vào** | R3 | TK 21.1, có đầu ván để chạy lại tất định |
| Quái bản đồ 1 + Troll | **Vào một phần**: Mầm Gỗ (R1), Tanuki, Nuppeppō (R2), Troll, Đầu Đàn (R3, hộp cát) | R1–R3 | Alicanto **để VS**: cần trộm đống vàng, túi và Bắt (bản đồ 3) |
| Túi, Từ Nhặt, bùa | **Để 1C / VS** | — | Cần ô vật phẩm, túi bay về người nhặt (hình 1C); ngân sách chú ý ban Đêm dành cho Bắn mạnh, gõ trực tiếp, Chữ Chiêu |
| Đài Ấn (cụm, nghe rồi gõ) | **Để VS** (bản đồ 2) | — | Bản đồ 1 không có cửa sổ ấn (TK 18.7, 22.7); cần giọng đọc và một nhà mới |
| Từ Vàng | **Để VS** (cùng Từ Sao, Từ Lá) | — | Thưởng ngẫu nhiên ×3 thêm phương sai đúng lúc 1B cần thu hẹp phân bố mạng cuối |
| Cụm chốt và Bùng Nổ | **Bỏ** | — | Dựa trên Nhiệt, đã bỏ ở 1A.6. Lời gọi đã là "mỗi lần bùng" (CALLS_V3_1_PLAN §8 câu 1) |
| Lam dạng khối | **Để bước 3** (Tướng bộ) | — | Cần chọn Tướng trước trận; không giúp câu hỏi của 1B |
| Thử thách Bốn Ô | **Để VS** | — | Hộp cát đã cho Lũy 4 và đủ Thư Đồng |
| Đổ Nát, lời gọi Sửa | **Để VS** | — | Máu nhà chưa có hậu quả nào ở 1B, nên boss không trừ máu nhà, chỉ làm tê (§5.5). Lệch TK 22.7 ("nhà −30 máu"): một con số không có hậu quả dạy sai |
| Chơi lại từ Ngày n (TK 20.5 "ván dở") | **Vào** | R1 | Thua ở boss mà phải chơi lại 10 phút đầu thì chán. Sim tất định nên chạy lại nhật ký lệnh tới đầu Ngày n là đủ (§4.3) |
| Lịch mở theo ngày | **Vào**, sớm hơn bảng dạy | R1 | Lịch mở đổi kinh tế. Có từ R1 thì bot cân bằng một lần với nó, không phải chỉnh lại ở R3 |

---

## 3. Luật không đổi

- Sim tất định: 60 Hz, chỉ luồng ngẫu nhiên có tên của kit, không đồng hồ, không DOM. Cùng seed, cùng lệnh, cùng đầu ván cho cùng mã băm trên Node và Chrome. Mọi trạng thái mới (boss, tê, bán, Tối Thượng, kế hoạch học) vào mã băm.
- Chữ cái chỉ để gõ. Phím lệnh không phải chữ cái.
- **Không sửa tay `src/kit`.** 1B không cần đổi kit: luồng ngẫu nhiên, `balance`, `learning` có đủ. Một quy trình khác đang sửa `shared/game-kit/typing`: không đụng module đó. Nếu thật cần đổi kit thì sửa ở `shared/game-kit` có test, giữ tương thích ngược, rồi `node scripts/sync-game-kit.mjs --target games/typing-defense` ở repo cha.
- Không media trong Git. **Không dựng model nhân vật, quái, nhà, đạo cụ bằng mã.** Ở bản vẽ 2D, Mộc Tinh và Mầm Gỗ là **hình giữ chỗ** (đường cong, vòng tròn, nét mực) như mọi thứ khác trên bản đồ 2D; model Tripo `art-src/3d/bosses/moc-tinh.glb` dùng ở 1C.
- Ngân sách chú ý là luật cao nhất của gõ: mọi lời gọi mới (Chữ Chiêu, gõ trực tiếp, Dồn lửa) đều qua `attention.ts`, không lời gọi nào được vượt.
- Bỏ qua một lời gọi không mất gì ngoài phần thưởng của chính nó. Chuỗi chỉ ÷2 khi Ẩu.
- Comment trong mã bằng tiếng Anh, ngắn. Tài liệu và changelog bằng tiếng Việt có dấu. Mỗi đợt một file `docs/changelog/<ngày>-<chủ đề>.md`.
- Máy 16 GB, có agent khác: một máy chủ dev và một Chrome một lúc, cổng **3046** (`--strictPort`), tắt mọi tiến trình đã mở.
- Mỗi lần đổi luật hay số: chạy `pnpm td:balance`, in bảng BALANCE §3 và B1–B9.

---

## 4. Ải bản đồ 1: Đồng Cỏ Thác Bạc

### 4.1 Truyện và hộp cát

| | Truyện (mặc định từ 1B) | Hộp cát |
|---|---|---|
| Mở bằng | Màn đầu "Bắt đầu", hoặc `?sandbox=0` | `?sandbox=1`, F9 |
| Bản đồ | Sân `td-sandbox` hiện có (đã là bố cục TK 22.9 rút gọn: Khe Nứt (−10, −46), đường chữ S tách đôi, Suối Bạc hai cầu, quặng ★★★ (26, −30), ★ (−12, 32)). Id nội dung đổi thành `w1-silverfall` | Như truyện |
| Đêm | 5, Mộc Tinh ở cuối Đêm 5 | Như truyện; thêm lệnh hộp cát `boss` gọi Mộc Tinh ngay |
| Lũy | Cấp 1 → 3 bằng tiền (§7) | Nút cấp 1–4 miễn phí |
| Lịch mở, câu dạy boss (§12) | Có (R1) | Bỏ qua, mọi thứ mở |
| Bảng dạy đủ (§12) | Có (R3) | Bỏ qua |
| Hết ải | Thắng hoặc thua: sim dừng, màn kết | Như truyện |

- Danh sách đợt của ải có 5 đợt. Truyện không có đêm vô tận. Hộp cát giữ đợt 6 hiện có (4 Thuồng Luồng, 20 Cương Thi, 4 Ma Trơi) và luật lặp đợt cuối tăng 15 % cho "Sinh đêm" thêm và thử tải; không boss ở đợt thêm.
- Chế độ (Thư giãn, Cân bằng, Thử thách, Học) chọn ở Cài đặt (R3); trước R3 truyện chạy Cân bằng, `?learn=1` chạy Học. Đã làm (R3 phần A): dòng "Chế độ (truyện)" mặc định "Theo hồ sơ" (trẻ em Thư giãn, người lớn Cân bằng); hộp cát vẫn bắt đầu ở Cân bằng, đổi bằng bảng hộp cát.

### 4.2 Thành phần các Đêm

| Đêm | R1 (chỉ đổi Đêm 5) | R2 (thêm quái mới, cân bằng lại; theo mã, BUILD_NOTES §7.3) | Ý mới (bảng dạy §12) |
|---|---|---|---|
| 1 | 8 Cương Thi | 10 Cương Thi (quyết định (b): Đêm 1–4 khó hơn) | Lời gọi Bắn mạnh |
| 2 | 10 Cương Thi, 1 Ma Trơi | 12 Cương Thi, 2 Ma Trơi | Quái bay |
| 3 | 12 Cương Thi, 2 Ma Trơi | 10 Cương Thi, 4 Nuppeppō, 2 Ma Trơi (bản đầu của đặc tả: 8, 3, 2) | Pháo khắc Nuppeppō; Tối Thượng |
| 4 | 1 Thuồng Luồng, 10 Cương Thi | 3 Tanuki đi trước, 1 Thuồng Luồng, 9 Cương Thi (bản đầu: 2 Tanuki, 1, 7; 3 Tanuki cho một trống mỗi ~29 s, §9.1) | Ngắt |
| 5, phần đầu | **5 Thuồng Luồng (một toán 5)**, 7 Cương Thi, 3 Ma Trơi. R1 vòng 1 hạ còn 4; sửa review R1 trả về 5, Thuồng Luồng 385 máu (BUILD_NOTES §7.2) | **6 Thuồng Luồng (một toán 6), 420 máu**, 7 Cương Thi, 3 Ma Trơi | — |
| 5, đỉnh boss | Lặng 12 s → 2 toán × 4 Cương Thi ra ở Khe Nứt (mỗi nhánh một toán); **Mộc Tinh trồi lên ở ngã ba** (6, −34) 6 s sau, đi nhánh đã báo từ Ngày 5; pha 2 gọi Mầm Gỗ | như R1 | Mộc Tinh |

- Đêm 5 phần đầu nhẹ hơn hiện nay (7 Thuồng Luồng, toán 6). Lý do và số đo ở §6.3: Thuồng Luồng toán lớn giờ là việc của **Biên S**, còn việc quyết thắng thua chuyển sang boss.
- **Vì sao trồi ở ngã ba, không đi từ Khe Nứt.** Đường dài 116 m (nhánh Tây; nhánh Đông 113 m); ngã ba ở mét 20, khúc nhập ở mét 79. Đầu dò §6.3 cho thấy đòn đầu trúng boss ở ~41 % đường: đi từ Khe Nứt thì có ~50 s boss đi trên đoạn không tháp nào với tới, chỉ có đếm khoảng cách (Nhàn). Trồi ở ngã ba bỏ ~22 s đi không, mà không đổi sát thương boss nhận (đoạn bỏ đi không có tháp): còn ~30 s tới đòn đầu (p50), có toán đi trước tới khúc nhập trong lúc đó. Bố cục chưa có tháp trên nhánh boss thì đòn đầu tới ở khúc nhập (~65 s): đó là cái giá của việc bỏ qua lời báo Ngày 5. Vết nứt bò từ Khe Nứt tới ngã ba trong 12 s lặng là báo trước chỗ trồi.

### 4.3 Thắng, thua, sao

- **Thắng:** Mộc Tinh rút lui (§5.4). Mọi quái còn trên sân tan thành mực (không vàng, không lọt). Pha `victory`, sim dừng.
- **Thua:** mạng Lũy về 0 (như nay), pha `defeat`.
- **Sao** (TK 20.2): thắng với 18–20 mạng: 3 sao; 6–17: 2 sao; 1–5: 1 sao. Màn kết in sao, mạng, quái hạ, từ gõ, lời gọi Hoàn hảo, Tri thức, và **"Từ cần ôn"**: tối đa 5 từ mới nhất trong sổ ôn, kèm nghĩa (chỉ view, đọc sổ ôn đã có). Lưu sao tốt nhất ở `td.campaign` (R3; R1 chỉ hiện). Đã làm (R3 phần A): ghi khi truyện thắng, cả khi thắng sau "Chơi lại Ngày n"; "Bắt đầu" ở màn đầu hiện ★★☆, thẻ thắng hiện "Kỷ lục ★★" ("Kỷ lục mới" khi vừa lập).
- Bot và FlowMeter: thắng là `won`, S = mạng còn / 20 lúc kết ải (thua tính 0), như BALANCE §3.
- **Chơi lại từ Ngày n** (R1, TK 20.5 "ván dở"): màn thua có hai nút, "Chơi lại Ngày n" (n là ngày của đêm vừa thua; nút chính khi n ≥ 2) và "Chơi lại từ đầu".
  - App ghi tick bắt đầu và mã băm của mỗi Ngày. Chơi lại Ngày n: tạo thế giới mới cùng seed, cùng đầu ván (E, k, bộ điều nhịp, chế độ), chạy nhật ký lệnh tới tick đầu Ngày n (bỏ lệnh sau đó), so mã băm đã ghi. Khác thì báo lỗi và chơi lại từ đầu. Chạy ~27.000 tick mất < 1 s (bước sim p95 0,03 ms).
  - Phần chạy lại không gửi sự kiện học và không gộp vào hồ sơ gõ lần nữa. FlowMeter và bot chỉ tính lần chơi đầu. Thắng sau khi chơi lại vẫn được sao, màn kết ghi "(chơi lại Ngày n)".
  - Hộp cát: thẻ kết như nay (một nút "Chơi lại").

### 4.4 Báo trước đỉnh boss (dòng thời gian)

| Lúc | Sim | Người chơi thấy, nghe |
|---|---|---|
| Đầu Ngày 5 | Sự kiện `bossWarn` (`day`, `route`). **Nhánh boss** (Tây hay Đông) chọn lúc này bằng luồng `spawn`, vào mã băm | Dải mực trên HUD: "Đêm nay Mộc Tinh thức dậy". Chip "Đêm 5 · Boss". Một tiếng gỗ trầm. **Mạch rễ mờ dọc nhánh boss sẽ đi** (từ ngã ba tới khúc nhập), giữ tới hết ải: người chơi có cả Ngày 5 để xây, bán, dời tháp và Tướng theo nhánh đó |
| Đầu Đêm 5 | Phần đầu Đêm 5 sinh như mọi đợt | Thanh boss mờ trên HUD, chưa có máu: "Mộc Tinh · đang ngủ" |
| Phần đầu sinh xong và còn ≤ 2 quái của nó sống, hoặc 30 s sau lần sinh cuối | **Lặng trước bão 12 s:** không lời gọi kinh tế hay Hỏi bài mới nào SÁNG; Bắn mạnh vẫn sáng như thường cho quái phần đầu còn sống (không bao giờ tắt phòng thủ khi còn quái đang tới). Bộ điều nhịp Đêm đứng yên từ đây tới hết ải | Đếm ngược "Mộc Tinh tới sau 12 s"; đất rung nhẹ (rung màn hình ≤ 2 px, tắt khi giảm chuyển động); **vết nứt bò dọc đường từ Khe Nứt tới ngã ba** đúng 12 s; nhạc lùi, trống trầm |
| Hết lặng | 2 toán Cương Thi ra ở Khe Nứt; 6 s sau Mộc Tinh trồi lên ở ngã ba, đi nhánh đã báo | Đất vỡ, gầm; thanh boss đầy máu, vạch 70 % và 50 % ("rút lui"); "còn 96 m tới Lũy" |
| Mộc Tinh đi | Đòn, pha theo §5.2 | Mỗi đòn có báo trước (§13.1) |

---

## 5. Mộc Tinh nhỏ (`moc-tinh`)

### 5.1 Chỉ số

| Thứ | Số khởi điểm | Ghi chú |
|---|---|---|
| Máu | **4.200** × máu chế độ × hệ số riêng của chế độ × hệ số k (§5.6) | TK 22.7 ghi 4.000; số đo §6.3 cho thấy khoảng 3.000–3.400 mới cho bot Chuẩn thắng ~85 %. R1 chỉnh theo §6.5: 3.200 → 3.400 (vòng 1) → 3.800 (sửa review R1, sau khi bán gỗ, Bắn mạnh nối và Dồn lửa làm mọi bot mạnh lên) → 4.200 (R2, sau Tối Thượng và quyết định (b), BUILD_NOTES §7.3). Hệ số riêng: Thư giãn, Học và Thử thách ×0,78 (R2; sửa review R1: Thư giãn, Học ×0,85) |
| Rút lui | Ở 50 % máu | Lượng máu phải gỡ: 2.100 ở Cân bằng, k = 1 (khởi điểm 3.200: 1.600) |
| Giáp / KP | 30 % / 0 % | |
| Tốc | **0,8 m/s** × tốc quái của ải (`foeSpeed` = 1 + `PACE.speedK` × (k − 1); sửa phản biện R2: `speedK` 0,2 → 0,3, BUILD_NOTES §7.4) | Khởi điểm 0,9 m/s, trồi ở mét 20; R1 vòng 1 (G3, G8): 0,8 m/s, trồi ở mét 25 (`emergeM`, BUILD_NOTES §7.1): còn ~88–91 m, đi hết ~110–115 s. Sửa phản biện R2 lần 2 đo 0,78 m/s (§6.5 bước 1, BUILD_NOTES §7.5), không giữ |
| Chặn | **Không bị chặn.** Lính vẫn đánh được, bị Quật cành đẩy lùi | Lệch luật chặn chung: cờ `unblockable` |
| Bán kính | 2,5 m | Vẽ ~5 m bề ngang ở bản 2D |
| Điểm yếu | Cháy gây ×1,25 | Phát Chữ của Pháo khi Draconis trong vòng: gõ là cách trị chính |
| **Vỏ dày** | Cầu lửa tự đánh của Draconis gây **×0,5** (`BOSS.heroMul`; R1 vòng 1: ×0,35 cho B5, BUILD_NOTES §7.1) | Mới, lệch TK. Draconis gây 17,5 sát thương/s phép (tháp Cung cấp 1 chỉ ~5,8/s lên giáp 30 %). Không có luật này, người chơi không gõ chỉ cần thả Draconis đuổi theo boss (~80 % thời gian đứng bắn) là gây ~1.400 trong ~100 s, cộng tháp ~500: boss rút mà không gõ chữ nào (vỡ B5, §6.3 điểm 7). Thoại: "Lửa thường chỉ xém vỏ. Lửa của chữ mới cháy." |
| Chống chịu | Làm chậm tối đa 30 %; không bị choáng ngoài cú choáng của chính nó; không bao giờ là tinh anh | TK 18.9 |
| Lọt | Không lọt: tới Lũy thì đập Lũy (§5.3) | |
| Thưởng | Rương 150 Vàng (ghi ngay lúc rút, hiện ở màn kết; vào kho để dùng khi có tiền ngoài trận ở 1C/VS) | TK 22.7. Mảnh Chữ của boss chỉ ở cú choáng (R2): ải đã hết lúc rút |

### 5.2 Pha và đòn

| Pha | Máu | Đòn (theo thứ tự ưu tiên trong một tick) |
|---|---|---|
| Pha 1 | 100 → 70 % | **Rễ Trồi** mỗi 12 s (lần đầu 6 s sau khi có nhà trong tầm): mọi nhà (trừ Lũy) có mép trong 8 m quanh tâm boss bị nhắm (vị trí khóa lúc bắt đầu báo); báo **1,5 s** (Thư giãn, Học 2,0 s; Thử thách 1,2 s); hết báo: nhà **tê 3 s**, không mất máu (§2). Không có nhà trong 8 m thì bỏ lượt, đồng hồ vẫn chạy. **Quật cành** mỗi 2,5 s khi có lính trong 3 m quanh mép boss: báo 1,2 s (Thư giãn, Học 1,6 s; Thử thách 1,0 s), 40–60 sát thương vật lý lên mọi lính trong vùng (giáp lính tính), đẩy lùi 1,5 m; không chạm nhà |
| Chuyển pha | 70 % | **Choáng 5 s:** boss đứng yên, không đòn, không Rễ Trồi; **rễ rút về**: mọi nhà đang tê hết tê ngay. **Dễ Tổn Thương:** nhận ×1,25 sát thương trong 5 s (đếm lùi trên thanh boss). **Dồn lửa** (sửa review R1): nhà đánh (tháp, Lũy) có boss trong tầm + 2 m, gần boss nhất trước, tối đa bằng trần SÁNG của chế độ (Cân bằng 3), có ngay một lời gọi Bắn mạnh **round(E / 20) từ (1–3)**, bỏ qua thời gian hồi và mức nạp đầy, sống 5 s, **sáng dù ngoài vòng giúp**. Nhà đã có lời gọi Bắn mạnh thì lời gọi đó thành lời gọi Dồn lửa (thêm từ, hạn mới 5 s, nhắm boss). Lời gọi này đi qua trần và ngân sách như mọi lời gọi (không vượt), nhưng ngân sách thường còn trống nhờ lặng và hàng ưu tiên (Bắn mạnh bậc 0). Không cửa sổ ấn ở bản đồ 1 (TK 18.7) |
| Pha 2 | 70 → 50 % | Như pha 1, thêm **Gọi Mầm Gỗ:** mỗi 15 s (lần đầu 3 s sau choáng) 4 Mầm Gỗ mọc ở chân boss, báo 0,8 s (4 mầm xanh nhú), rồi đi tiếp đường của boss từ chỗ đó |
| Rút lui | ≤ 50 % | Boss ngừng mọi thứ, không nhận đòn, chìm xuống đất trong 2 s. Rương 150 Vàng ghi ngay. Hết 2 s: quái còn lại tan, pha `victory` |

- Sát thương dồn qua mốc: một đòn đưa máu qua 70 % thì choáng ngay; qua cả 50 % thì rút lui ngay (không choáng).
- Mọi đòn của boss dùng luồng `combat` cho số sát thương, `spawn` cho chỗ Mầm Gỗ mọc lệch ngang. Thứ tự nhà bị nhắm: theo id tăng dần.

### 5.3 Tới Lũy

- Khi boss tới cách cuối đường 1,5 m: dừng lại, **Quật Lũy** mỗi 2,5 s, báo 1,2 s, **−3 mạng** mỗi đòn, tới khi boss rút hoặc Lũy hết mạng.
- Ở đó chỉ nỏ Lũy, tháp gần Lũy và Tướng còn đánh được, nên thường là thua: 10 mạng chịu được 4 đòn, khoảng 10 s. Đây là "thua rõ ràng" có báo trước, không phải mất mạng âm thầm; vẫn có khoảnh khắc gần thua (N) khi boss chỉ còn thiếu một chút. Việc còn làm được: gõ Bắn mạnh của Lũy và tháp gần Lũy (vẫn gọi như thường).

### 5.4 Rút lui và rương

- Rút lui đếm là một lần hạ boss (`STAT.bossRetreats`), sự kiện `bossRetreat`, rồi `victory`.
- Rương: +150 Vàng vào kho ngay tick rút (TK 17.4: ghi sổ ngay, đồng bay chỉ là hình). Mảnh Chữ: +10 nếu Draconis trong 12 m (R2).
- Thoại (hiện chữ, chưa có giọng): vào trận "Tên ta ở đâu?"; Rễ Trồi lần đầu "Rễ ơi, mọc lên!"; choáng "Cái tên đó... quen quá..."; rút "À... ta nhớ rồi." (TK 22.7).

### 5.5 Đòn nào, làm gì; gắn với luật cũ

Mỗi đòn có báo trước **và** một việc người chơi làm được. Đòn nào không có việc làm được thì phải bỏ hoặc đổi.

| Đòn | Báo | Việc làm được (trước, trong lúc báo, sau) |
|---|---|---|
| Cả trận | Ngày 5: dải báo, mạch rễ trên nhánh boss | Xây hay bán (60 %) để dồn tháp lên nhánh boss và khúc nhập; nâng Pháo; đưa Draconis tới Pháo trên đường boss (Cháy ×1,25) |
| Rễ Trồi | Vòng son 1,5 s dưới nhà | **Đặt tháp xa đường:** mép nhà ngoài 8 m quanh boss thì không bị nhắm. Tháp Cung cấp 2–3 (tầm 11–12 m) đặt cách tim đường 10–11 m vẫn bắn được boss mà không bị tê (chân nhà cỡ S bán kính 2,0 m: tâm nhà cách tim đường > 10 m thì mép ngoài 8 m). Đổi lại, tháp bắn được ít đoạn đường hơn. **Gõ thắng tê:** lời gọi Bắn mạnh đang có của nhà tê vẫn gõ được và Phát Chữ vẫn bắn (TK 22.7: "từ đang bay vẫn gõ được"); tê chỉ dừng tự bắn, lời gọi mới, sản xuất |
| Quật cành | Cung đỏ 1,2 s | Dời điểm tập hợp của Trại Lính ra khỏi đường boss (lính không chặn được boss, chỉ để giữ Cương Thi đi trước và Mầm Gỗ) |
| Choáng 70 % | Vạch 70 % trên thanh boss, cả trận | Đưa Draconis tới Pháo gần boss trước mốc 70 % (Dồn lửa của Pháo có Cháy); gõ lời gọi Dồn lửa trong 5 s (Dễ Tổn Thương ×1,25) |
| Mầm Gỗ | 4 mầm nhú 0,8 s | Pháo, lính ở khúc nhập; Bắn mạnh của Pháo |
| Quật Lũy | Cung đỏ 1,2 s trên Lũy; "còn N m tới Lũy" cả trận | Gõ Bắn mạnh của Lũy và tháp gần Lũy. Đây là thua có báo trước; bài học ghi ở màn thua |

- **Kiểm dữ liệu** (test nội dung): `roots.radiusM` + bán kính chân nhà S < tầm Tháp Cung cấp 2, để cách "đặt xa đường" luôn còn khi bot chỉnh số.

| Luật cũ | Với boss |
|---|---|
| Nhà có máu | Boss không trừ máu nhà ở 1B (§2). Máu nhà giữ như 1A.6 |
| Nhà **tê** | Không tự bắn, không tạo lời gọi Bắn mạnh mới, không sản xuất (Mỏ, Ruộng ngừng tiến độ). Lời gọi đang có giữ nguyên (sáng theo luật thường), gõ được, Phát Chữ bắn ngay. Cú choáng 70 % xóa mọi tê |
| Bộ điều nhịp (BALANCE §4.2) | Đứng yên từ lúc lặng trước bão tới hết ải (đỉnh boss là kịch bản, không cao su). FlowMeter vẫn đo |
| Tinh anh | Không bao giờ gắn vào boss, Mầm Gỗ, toán đi trước |
| Rơi hỗ trợ +2 mạng | Không ở đỉnh boss (bộ điều nhịp đã dừng) |
| FlowMeter: nguy hiểm | Thêm: đang có một vòng báo Rễ Trồi, Quật cành hay Quật Lũy ("đòn lớn đang báo", BALANCE §3 P) |
| Ngân sách chú ý | Lặng 12 s: không lời gọi kinh tế, Hỏi bài mới nào SÁNG; Bắn mạnh như thường. Dồn lửa và Bắn mạnh vẫn qua trần SÁNG và kiểm "vừa ngân sách" từng từ |
| Phát Chữ, Cháy, Tướng | Cháy lên boss ×1,25. Cầu lửa tự đánh của Draconis ×0,5. Dễ Tổn Thương nhân mọi sát thương (cả Phát Chữ và Cháy) |
| Thư Đồng | R2: Thư Đồng đứng trong 6 m quanh một nhà trúng Rễ Trồi thì **hoảng**: chạy về Lũy, đứng 5 s, rồi làm tiếp lệnh cũ; khi hoảng vòng giúp không thắp lời gọi |

### 5.6 Máu boss theo nhịp k

```
d = k − 1
máu = round(4200 × hpMul(chế độ) × modeHp(chế độ) × min(kHpMax; 1 + kHp × d + kHp2 × max(0; d)²))
kHp = 0,3 · kHp2 = 6,5 · kHpMax = 1,46 · modeHp: Thư giãn, Học, Thử thách 0,78
```

- Số đo §6.3: bot Nhanh (k 1,3) gây lên boss nhiều hơn bot Chuẩn ~15 %; bot Mới (k 0,75) gây gần bằng bot Chuẩn vì boss của nó đi chậm hơn. Vì vậy R1 vòng 1 chỉ nâng máu khi k > 1 (0,4, trần ×1,12).
- **Sửa review R1:** Bắn mạnh nối và Dồn lửa theo E cho tốc gõ đòn bẩy trong ván, nên bot Nhanh (k bị kit chặn ở 1,30) gây gấp ~1,4 lần bot Chuẩn, còn bot Mới, Chậm chắc (k < 1) gây ít hơn. Vì vậy hệ số k đi hai chiều (−5 % máu ở k 0,75) và có số hạng bậc hai ở trên 1 (k 1,2: ×1,21; k 1,3: ×1,45). Vẫn không có luật riêng cho từng bot.
- **R2** (BUILD_NOTES §7.3): 3.800 → 4.200, `kHp` 0,2 → 0,3, `kHp2` 4,3 → 6,5 (k 0,75: ×0,925; k 1,2: ×1,33; k 1,3: chạm trần). **Sửa phản biện R2** (§7.4): trần 1,5 → 1,46, vì `PACE.speedK` 0,3 cho boss của bot Nhanh đi nhanh ×1,09 (trước ×1,06).
- Máu tính **một lần lúc sinh** từ đầu ván (BALANCE §4.1: tham số đầu ải), không đổi khi boss đang sống.

---

## 6. Tách tỉ lệ thắng và Biên S

### 6.1 Vấn đề

BUILD_NOTES §6.10: ở cân bằng vòng 2, thắng và Biên S đi cùng nhau vì cả hai do số Thuồng Luồng lọt ở Đêm 5 quyết (3 mạng mỗi con). Muốn thắng ~83 % mà S ~50 % thì phân bố mạng cuối phải có **hai đỉnh**: ván giữa còn ~10 mạng, còn ~15 % ván sập hẳn. Đổi số lọt hay số mạng không làm được việc đó.

### 6.2 Cách tách

- **Biên S** do các đêm trước boss quyết: lọt rải rác từ các toán, nhất là toán Thuồng Luồng ở phần đầu Đêm 5. Núm: cỡ toán, máu Thuồng Luồng, số Cương Thi đi trước boss, số Mầm Gỗ.
- **Thắng** do boss quyết: boss là **bài kiểm sát thương lên một mục tiêu** trong một khoảng thời gian (đường đi). Đủ sức gõ và bố trí đúng thì boss rút ở khúc nhập, ván giữ gần nguyên số mạng đang có. Thiếu thì boss qua khúc nhập, ở đoạn sau gần như không còn tháp nào đánh tới (§6.3), boss tới Lũy và đập: thua rõ.
- Hai việc này dựa trên hai sức khác nhau (chặn bầy với dồn một mục tiêu), nên tách được, dù người giỏi vẫn giỏi ở cả hai.

### 6.3 Số đo đầu dò (24/10/2026, mã HEAD `33b9905`)

Một kịch bản tạm ngoài repo thêm vào Đêm 5 một **đầu dò giống boss** (giáp 30 %, KP 0, 0,9 m/s, không bị chặn, máu rất lớn, không lọt), sinh sau phần đầu Đêm 5 (5 Thuồng Luồng một toán, 7 Cương Thi, 3 Ma Trơi) và 12 s lặng, đúng như §4.4. Cân bằng, bộ điều nhịp bật, đầu ván như `td:balance`, seed 1–80. Đầu dò chưa có Rễ Trồi, choáng, Cháy ×1,25.

| Bot | k | Ván tới boss | Mạng cuối Đêm 5 p10 / p50 / p90 | Sát thương lên đầu dò tới 99 % đường p10 / p50 / p90 | Gỡ đủ 1.800 trước Lũy | Giao chiến tới 1.800, p50 | % đường lúc đủ, p50 |
|---|---|---|---|---|---|---|---|
| Mới | 0,75 | 77/80 | 4 / 7 / 20 | 1.565 / 1.964 / 2.390 | 73 % | 51 s | 77 % |
| Chậm chắc | 0,79 | 79/80 | 5 / 16 / 20 | 1.618 / 2.057 / 2.511 | 84 % | 49 s | 77 % |
| Chuẩn | 1,00 | 79/80 | 4 / 13 / 19 | 1.395 / 1.986 / 2.338 | 75 % | 46 s | 77 % |
| Khá | 1,20 | 80/80 | 6 / 13 / 17 | 1.481 / 2.160 / 2.572 | 78 % | 41 s | 73 % |
| Ẩu | 1,05 | 78/80 | 4 / 10 / 19 | 1.443 / 1.930 / 2.318 | 69 % | 47 s | 77 % |
| Nhanh | 1,30 | 80/80 | 6 / 13 / 18 | 1.781 / 2.303 / 2.626 | 93 % | 38 s | 72 % |
| Chuẩn, chiến thuật Tốt | 1,00 | 78/80 | 4 / 14 / 19 | 1.585 / 2.122 / 2.347 | 79 % | 45 s | 75 % |
| Chuẩn, chiến thuật Kém | 1,00 | 73/80 | 1 / 9 / 16 | 962 / 1.469 / 2.018 | 30 % | 49 s | 77 % |
| Không gõ | 1,00 | 66/80 | 0 / 2 / 3 | 652 / 836 / 896 | 0 % | — | — |
| Trẻ em (ở Cân bằng) | 0,75 | 61/80 | 0 / 3 / 9 | 923 / 1.238 / 1.696 | 8 % | 73 s | 93 % |

Phần đầu Đêm 5, bot Chuẩn, cùng cách đo (mạng cuối Đêm 5 p10 / p50 / p90): 7 Thuồng Luồng toán 6 (hiện nay): 0 / 6 / 18; **5 trong một toán: 4 / 13 / 19**; 3 trong một toán: 10 / 15 / 19. Bot Không gõ: 0 / 0 / 0; 0 / 2 / 3; 6 / 8 / 9.

**Điều số đo nói:**

1. **Hai đỉnh có thật.** Sát thương tập trung ở khúc nhập: bot Chuẩn gỡ ~680 máu trong đoạn 67 → 80 % đường, nhưng chỉ ~190 trong đoạn 80 → 99 % (chỉ còn nỏ Lũy và Tướng). Boss không rút ở khúc nhập thì gần như chắc thua.
2. **Gõ là sức chính với boss:** bot Không gõ chỉ gây ~840 (≈ 40 % bot Chuẩn); phần sát thương do gõ trong lúc boss đi là 39 % (Chuẩn) đến 47 % (Nhanh). B5 đạt nhờ boss mà không cần làm khó các đêm trước.
3. **Chiến thuật có nghĩa:** Kém gỡ đủ 1.800 ở 30 % ván, Tốt 79 % (B6).
4. **Nhịp k gần như đã san bằng:** tỉ lệ gỡ đủ ở 1.800 là 69–84 % cho Mới tới Khá; chỉ Nhanh lệch (93 %), nên có §5.6.
5. **Giao chiến 38–51 s** (từ đòn trúng đầu tới khi đủ): khớp "boss nhỏ 45–75 s" của TK 18.8 sau khi thêm Rễ Trồi làm tê tháp.
6. **Biên S:** với 5 Thuồng Luồng một toán, mạng cuối Đêm 5 trung vị 7–16 tùy bot (S 35–80 %). Trừ thêm phần mất ở đỉnh boss (toán đi trước, Mầm Gỗ, đập Lũy ở ván sát nút) thì S trung vị dự kiến 45–60 % cho Chuẩn; bot Mới và Chậm chắc lệch hai phía, phải chỉnh ở R1 (§6.5).
7. **Đầu dò chưa thử cách không gõ mạnh nhất** (phản biện 24/10). Bot Không gõ để Draconis đứng theo luật Đêm (gần khúc nhập), nên chỉ gây ~840. Người không gõ mà thả Draconis đuổi boss: cầu lửa 22–34 mỗi 1,6 s (17,5/s, phép, boss KP 0), bay 6 m/s, cất và hạ cánh 0,6 s, tầm 9 m: đứng bắn ~80 % thời gian, ~1.400 trong ~100 s boss đi, cộng tháp ~500 = ~1.900 > 1.600. Vì vậy có **Vỏ dày** (§5.1: Draconis tự đánh ×0,5, còn ~700 + 500) và bot **Không gõ, Tướng đuổi boss** (`heroKite`, §18.1) cho B5. Luật này cũng bớt sát thương của mọi bot (phần của Draconis đứng ở khúc nhập, ước ~150–200), nên máu khởi điểm có thể phải hạ về ~2.900: đo ở R1, §6.5 bước 1.

### 6.4 Đích

| Chế độ | Bot | Thắng | Biên S |
|---|---|---|---|
| Cân bằng | Mới, Chậm chắc, Chuẩn, Khá, Ẩu, Nhanh, **từng bot, cả hai bộ seed** | **78–88 %** | **40–60 % bot Chuẩn**; bot khác 35–65 % như BALANCE §3 (sửa phản biện R2) |
| Cân bằng | Không gõ | 0 % (B5) | — |
| Cân bằng | Chuẩn Tốt − Chuẩn Kém | ≥ 10 điểm % (B6) | — |
| Thư giãn | Mới tới Nhanh | ≥ 92 % | ≥ 70 % |
| Thư giãn | Trẻ em | ≥ 85 % (B3) | báo cáo (≥ 70 % là đích, hiện 50 %) |
| Thử thách | Mới tới Nhanh | 50–75 % | 15–45 % |

- Cùng lúc giữ các dải còn lại của BALANCE §3 (P, I, O, N, Q) ở từng chế độ (bảng §18.3).
- B4: S của Chậm chắc > S của Ẩu; bot Chuẩn hạ quái nhanh hơn bot Ẩu (hạ boss cũng vậy).
- **Biên S chặt chỉ đọc ở bot Chuẩn** (sửa phản biện R2, đã chọn theo đề xuất của BUILD_NOTES §7.3): các bot khác giữ dải BALANCE §3 (35–65 %), không bao giờ rộng hơn dải chung; thắng 78–88 % vẫn cho mọi bot. Lý do: mạng còn khác nhau theo sức gõ là điều game muốn người chơi thấy, miễn vẫn trong dải chung (số đo ở BUILD_NOTES §7.3, §7.4).
- **Đo đích thế nào (cổng).** Đích chặt 1B (78–88 %, 40–60 %) tính trên **hai bộ seed gộp (240 ván) của từng bot**. Mỗi bộ 120 seed riêng chỉ phải nằm trong dải BALANCE §3 (75–90 %, 35–65 %), như B1. Lý do: 120 ván cho sai số chuẩn ~3,4 điểm ở tỉ lệ thắng 83 %; dải rộng 10 điểm thì một ô đạt ~86 % số lần dù đúng tâm, 12 ô (6 bot × 2 bộ) cùng đạt chỉ ~16 %: cổng sẽ hỏng vì nhiễu và đẩy người chỉnh tới số khớp seed. Gộp 240 ván: sai số ~2,4 điểm, 6 bot cùng đạt ~79 %. Biên S (trung vị, bước 5 % vì mạng nguyên) đo cùng cách. Báo cáo in cả ba cột: bộ 1, bộ 2, gộp.

### 6.5 Thứ tự chỉnh ở R1 (chỉ dữ liệu)

0. **Trước khi chỉnh:** đo lại với Rễ Trồi, choáng, Cháy ×1,25, Vỏ dày, trồi ở ngã ba (đầu dò thiếu các luật này); chạy `heroKite` (B5) một lần.
1. **Máu boss** (`BOSS.hp`): chia đôi khoảng cho tới khi bot Chuẩn hạ được boss ở 86–90 % số ván tới boss (ván chết trước boss ~1–3 %), tức thắng ~85 %. Nếu giao chiến p50 của bot Chuẩn ra ngoài 45–75 s (G3) thì chỉnh **tốc boss** (0,75–1,0 m/s) trước, rồi máu theo: máu đi cùng thời gian boss trong tầm, chỉnh máu một mình không sửa được G3.
2. **Phần đầu Đêm 5** (số Thuồng Luồng 4–6, cỡ toán): tới khi S trung vị bot Chuẩn ≈ 50 %.
3. **Đỉnh boss** (toán đi trước 0–2 × 4, Mầm Gỗ 3–5 mỗi lần, khoảng 12–18 s): kéo đuôi S của ván yếu xuống, không chạm trung vị.
4. **Nhịp k của boss** (`BOSS.kHp` 0–0,6): chỉ khi Khá, Nhanh lệch dải thắng.
5. **Máu Thuồng Luồng** (325–385) hoặc Cháy của Draconis (45–65/s): khi Mới, Ẩu (S thấp) và Chậm chắc (S cao) cách nhau quá dải, vì Thuồng Luồng giáp 60 % là chỗ độ chính xác và Phát Chữ quyết. R2 ra ngoài khoảng này: 420 máu × 6 con (BUILD_NOTES §7.3); sửa phản biện R2 lần 2 đo lại cả hai núm (385 máu; Cháy 62/s) và số con 6 → 5 (bước 2): không núm nào kéo Ẩu về số R1 mà không đẩy Biên S của bot mạnh ra khỏi dải (BUILD_NOTES §7.5).
6. Sau mỗi lần đổi: `pnpm td:balance` đủ hai bộ seed × 120. Không đạt sau 6 vòng chỉnh thì ghi lại bảng và quyết định thiết kế cần có vào `BUILD_NOTES.md` §7, không ép bằng một số toàn cục.
7. **Sửa phản biện R2** (BUILD_NOTES §7.4): Biên S tách theo sức gõ, không theo E riêng: Thuồng Luồng lọt sau khi lặng bắt đầu (trung bình mỗi ván, 60 seed, số R2 sửa, BUILD_NOTES §7.5) là Mới 4,8, Ẩu 4,3, Chậm chắc 3,5, Chuẩn 3,0 mạng, còn Nhanh 1,7, Khá 1,2 (sửa phản biện R2 lần 2: câu cũ "bot E ≥ 35 không" sai với Ẩu E 50). Núm là phần của nhịp k trong tốc quái (`PACE.speedK` 0,2 → 0,3: quái của bot k 0,75 đi ×0,925, của bot k 1,3 ×1,09), rồi trần hệ số máu boss (`kHpMax`) cho bot Nhanh. Núm độ chính xác (`CALL.sloppy`, `SCORE.qA`) đã đo, không nâng được bot Ẩu. Tanuki cần ≥ 4 quái quanh nó (G6) cũng hạ Biên S của bot Chuẩn (ít trống được Ngắt hơn: ít vàng, ít nạp Tối Thượng).
8. **Sửa phản biện R2 lần 2** (BUILD_NOTES §7.5): đã đo bước 1 (tốc boss 0,78 m/s), bước 2 (phần đầu Đêm 5 có 5 Thuồng Luồng), bước 3 cùng bước 4 (5 Mầm Gỗ mỗi 12 s, `kHp` 0,15), bước 5 (Thuồng Luồng 385 máu; Cháy 62/s), mỗi lượt hai bộ × 120. Không lượt nào giữ B1 và đích chặt gộp bằng hay tốt hơn số hiện tại, nên số không đổi. Lý do đo được: từ R2 bot mạnh mất 0–3 mạng ở đỉnh boss (R1: 6–8 cho mọi bot; Thuồng Luồng lọt ở bot mạnh 1–3 mạng, ở Mới, Ẩu 4–5), bot yếu mất 6–9; Mầm Gỗ thêm rơi vào ván dài của bot yếu. Núm nào nâng Ẩu cũng nâng Biên S của Chuẩn, Chậm chắc, Nhanh quá 60–65 %. Núm kế cho lượt cân bằng của R3: một khoản mạng ở đỉnh boss mà bot mạnh không dọn được (thiết kế), và bảng độ dài từ theo E (`LENGTH_BY_E`, núm theo tốc gõ mạnh nhất đã đo); trọng số độ chính xác của kit (BALANCE §4.1) chỉ sau hai núm đó.

---

## 7. Nâng cấp, bán, Lũy (R1)

| Việc | Luật | Số |
|---|---|---|
| Nâng nhà | Như 1A.6: giá bậc = giá cộng dồn cấp sau − cấp này, cắt 30 % sang Gỗ; thợ xây làm trong 0,75 × thời gian xây khuôn; lời gọi Xây 3 từ; nhà vẫn chạy ở cấp cũ | Tháp Cung 63 + 27, 91 + 39; Pháo 84 + 36, 112 + 48 … (bảng `costs` hiện có) |
| **Nâng Lũy** | Lệnh `upgrade` cho Lũy (id 0) ở truyện; qua thợ xây như nâng nhà (khuôn XL: 0,75 × 18 s = 13,5 s; ban Đêm ×1,5), lời gọi Xây 3 từ; Lũy vẫn bắn. Xong thì mở thêm một người và một thợ xây (như nút hộp cát) | Cấp 2: 105 Vàng + 45 Gỗ; cấp 3: 182 + 78 (TK 0.3: 150 / 260 + 40 Gỗ cắt theo 1A.6). Truyện tối đa cấp 3 (`STAGE.keepMax`); cấp 2 từ Ngày 3, cấp 3 từ Ngày 5 (lịch mở §12, R1). Lệnh `upgrade` hiện từ chối id 0 (`noBuilding`): bỏ chặn đó cho Lũy ở truyện |
| **Bán** | Nhà đã xong, quá 5 s hoàn tác: hoàn **60 %** số Vàng và Gỗ đã chi cho nhà đó (cả các lần nâng; lần nâng đang làm cũng tính), làm tròn xuống. Bấm hai lần (lần một hiện "Bán · +N vàng, +M gỗ", lần hai trong 3 s mới gửi lệnh). Lũy không bán được | 60 % (TK 11.12) |
| Hoàn tác | Giữ như 1A.6: trong 5 s hoàn đủ | — |
| Bán khi tê | Được (không khác) | — |
| **Bán gỗ** (sửa review R1) | Lệnh `sellWood` (nút ở thẻ Lũy, cạnh Bán Lúa): 10 Gỗ thành 4 Vàng. HUD nhắc "Gỗ thừa: bán gỗ ở thẻ Lũy" ban Ngày khi Gỗ ≥ 150 và Vàng < 50. Bot (bố cục Chuẩn, Tốt, Vừa) bán phần Gỗ trên 100 | 10 → 4 |
| **Gỗ không cạn** (theo quyết định của chủ dự án 26/10/2026) | Mỗi cây giữ một kho gỗ. Một lần chặt (một lời gọi Chặt 4 từ) vẫn 45 s, 12 Gỗ, nhưng **trả dần từng gỗ theo tiến độ** (dân tự chặt hay từ gõ đều trả ngay), lấy từ kho của cây; thưởng cả lời gọi Hoàn hảo +2 Gỗ cộng thêm, không lấy từ kho. Cây chỉ đổ khi kho về 0. **Đầu mỗi Ngày mới** (cả `skipTo` của hộp cát): mọi cây đang đứng nạp đầy kho, mọi gốc mọc lại đầy kho, trừ gốc có nhà đè lên (nhà xây trên gốc được, gốc không chặn). Xong một lần chặt, dân chọn cây lại (cây đánh dấu kéo đi được), thường là cây cũ. Ban Đêm dân vẫn chặt nhưng **không tạo lời gọi Chặt mới**; lời gọi Chặt còn mở lúc Đêm xuống sống thêm 9 s (bằng lời gọi Bắn mạnh) rồi tắt. Lệnh hộp cát `fell` (một cây đứng đổ ngay) cho kịch bản | `TREE.reserve` 1.000; `TREE.wood` 12, `chopS` 45 (0,27 Gỗ/s một dân, khoảng một giờ mới hết một cây); `CALL.slipS` 1,15 → 1,35 s |
| **Gọi đêm sớm** (chủ dự án chơi thử 26/10/2026) | Vàng thưởng = trần (30) × phần Ngày còn lại, làm tròn lên (**đã chọn theo đề xuất**: chia theo độ dài Ngày thay vì bỏ trần, để tổng vàng không tăng): Ngày 75 s đầy 30 chỉ ở 2,5 s đầu, còn 1:05 thì +26, còn 0:24 thì +10 (trước: 1 vàng mỗi giây còn lại, trần 30, nên đứng 30 tới 30 s cuối). Không hơn luật cũ, trừ giây cuối (1 vàng thay 0). Nút hiện vàng, thời gian còn lại và thanh cạn dần; 10 s cuối nút nhấp nháy, mỗi giây một tiếng mõ gỗ (3 s cuối cao hơn); đang dừng (Esc, Tạm dừng chiến thuật) nút ghi "Đã dừng" thay giờ. Để yên thì hết giờ Đêm tự xuống, không cần lệnh | `ECONOMY.earlyCall.goldCap` 30 (bỏ `goldPerS`) |

- Nhà giữ tổng đã chi (`spentGold`, `spentWood`) thay cho số của lần cuối. Hoàn tác một lần nâng trừ đúng phần đã hoàn khỏi tổng.
- Lệnh `sell` giữ một tên cho cả hai việc: trong 5 s từ lúc xây hay nâng là hoàn tác (hoàn đủ phần đó), sau đó với nhà đã xong là bán 60 %. Công trường chưa xong quá 5 s vẫn bị từ chối như nay (`undoWindow`).
- **Test thuộc tính:** không chuỗi xây, nâng, bán, hoàn tác nào làm Vàng hoặc Gỗ cao hơn lúc chưa làm gì (TK 11.12).
- HUD: thẻ nhà có nút Bán với số tiền; thẻ Lũy có nút "Nâng Lũy · 105 vàng, 45 gỗ" và dòng "Mở: Chấm".
- **Vì sao luật gỗ như vậy** (26/10/2026): trước đây 36 cây giữ 432 Gỗ, hết vào khoảng Ngày 4, nên Gỗ là ngân sách cố định. Chủ dự án muốn Gỗ không cạn và cây không dễ đổ: giờ Gỗ là **tốc độ** do số dân và việc gõ quyết. Kinh tế giàu hơn (bot gõ ở cổng 1A.6: Gỗ làm ra mỗi Ngày 88 / 128 / 157 / 90 → 117 / 151 / 168 / 198, BUILD_NOTES §7.8). Tốc chặt (Gỗ/giây) và giá nhà là núm cho lượt cân bằng R3, không chỉnh ở bước này.
- **Vì sao Đêm không có lời gọi Chặt mới:** cây không cạn thì dân không bao giờ hết việc, mỗi 45 s lại có lời gọi 4 từ. Đo trên bot 1A.6 (mã `b58bd54` tắt riêng luật này, BUILD_NOTES §7.8): ban Đêm bot gõ Chặt 21,6 % thời gian, Bắn mạnh 4,4 %, bỏ 24 lời gọi Bắn mạnh (trước luật gỗ 8); tỉ lệ gõ ban Đêm 27,6 % (dải 15–25 %). Có luật: Chặt 6,1 %, Bắn mạnh 5,7 %, 21,8 %. Đêm là lúc của tháp: dân chặt lặng lẽ, lời gọi Chặt còn mở tắt sau 9 s.
- **Vì sao `CALL.slipS` 1,35 s:** chuỗi từ Chặt không dứt ban Ngày đẩy cửa sổ 20 s của bot 35 WPM lên 8,60 s với 1,15 s (cổng 5a ≤ 8 s); 1,35 s đưa về 7,90 s. Cái giá: lời gọi Bắn mạnh sáng mà bỏ qua 11 → 20 (5 seed). Núm cho bước 9.
- **Vì sao thưởng gọi Đêm sớm tụt từ đầu:** chủ dự án đứng chờ mà nút vẫn "+30 vàng", nên tưởng chờ không mất gì. Thưởng theo phần Ngày còn lại làm mỗi giây chờ hiện ra trên nút; trần giữ 30 nên tổng vàng không tăng (bot vàng file `td-1a` gọi Đêm ở giây 60 của Ngày 75 s: 15 → 6 vàng).

---

## 8. Tối Thượng, Mảnh Chữ, Chữ Chiêu (R2)

### 8.1 Nạp (0–100, TK 8.6 đổi theo lời gọi)

| Nguồn | Điểm |
|---|---|
| Mỗi từ của lời gọi gõ xong (mọi loại) | +1,2 × (0,5 + 0,5 × Q) |
| Gõ trực tiếp thành công | +3 |
| Mảnh Chữ: quái chết trong 12 m quanh Draconis | +0,6 mỗi mảnh (bầy 0,5 mảnh, nhỏ 1, vừa 2, nặng 3; boss choáng 6) |
| Ban Đêm, mỗi giây | +0,3 |

- Không nạp khi đã đầy. Đầu ải 0. Hồi tối thiểu 45 s giữa hai lần dùng. Giữ điểm qua Ngày.
- Đích (báo cáo, không là cổng): bot Chuẩn dùng 2–3 lần mỗi ải; bot Không gõ ≤ 1. Đo ở R2 và sửa phản biện R2: bot Chuẩn ~1,9–2,0 lần (sát mép dưới), số ở BUILD_NOTES §7.4.

### 8.2 Dùng

- Phím **`=`** (Equal; không bị Telex, VNI dùng) hoặc nút trên HUD. Lệnh `ult` mang điểm đặt (`qx`, `qz`): chuột đang trên bản đồ và trong 20 m quanh Draconis thì lấy điểm chuột; không thì app chọn điểm có nhiều máu quái nhất trong 6 m, trong vòng 14 m quanh Draconis (tính từ trạng thái thế giới, ghi vào lệnh nên vẫn tất định). Ngoài 20 m: lệnh bị từ chối (`ultFar`).
- **Mưa Lông Lửa** (TK 22.2): vùng bán kính 6 m, 12 lông trong 2 s (mỗi 10 tick một lông). Mỗi lông nhắm quái còn nhiều máu nhất trong vùng chưa bị lông này nhắm (xoay vòng; không còn quái thì rơi vào điểm đặt), nổ 1,5 m, **21** sát thương phép (sửa phản biện R2, trước 25; 2 lông vẫn hạ một Cương Thi 35 máu, cả ở Thử thách 41,7: 12 lông xóa một toán 5 con). Hết mưa: quái còn trong vùng bị Cháy 3 s (luật Cháy hiện có), **trừ boss**.
- Boss nhận **×0,25** sát thương Tối Thượng. Một lần dùng tối đa lên boss: (12 + 10 lông Chữ Chiêu) × 21 × 0,25 ≈ 115 = ~5,5 % lượng máu phải gỡ (2.100); trong ~2 phút đỉnh boss chỉ nạp được ~60 điểm, nên tối đa một lần. Cổng G5: Tối Thượng ≤ 15 % sát thương lên boss và ≤ 15 % sát thương cả ải (mức BALANCE §9.1 cho một kỹ năng vùng), **cho mọi bot gõ** (sửa phản biện R2: lông 25 cho bot Khá 15–17 % cả ải).
- Số trước phản biện (60 sát thương, boss ×0,5, Cháy cả boss) cho một lần dùng ~660 lên boss, tức ~40 % lượng máu phải gỡ, gần gấp ba cổng.

### 8.3 Chữ Chiêu là một lời gọi

| | Luật |
|---|---|
| Loại | `ult`, bậc 0 trong hàng ưu tiên (cùng Bắn mạnh, gõ trực tiếp) |
| Từ | 3 từ, mỗi lần một từ; từ ngắn (nửa dưới dải độ dài như Bắn mạnh), chỉ từ đã thuộc (cấp ≤ cấp ván − 1; cấp 1 thì cấp 1); không bao giờ là từ mới |
| Đời | Cả lời gọi sống 4 s từ lúc dùng Tối Thượng; từ kế hiện ngay khi từ trước xong. Quá đời thì từ đang gõ vẫn gõ xong được (có lông), nhưng không có từ kế (R2, `finishWord` trong `calls.ts`; luật này cũng giữ lời gọi Dồn lửa trong 5 s của nó, BUILD_NOTES §7.4) |
| Sáng | Luôn sáng (điểm đặt trong vòng Tướng) nhưng vẫn phải vừa ngân sách chú ý; không vừa thì chờ, hết 4 s thì tắt, không mất gì |
| Mỗi từ xong | +3 lông lửa rơi vào vùng sau 0,3 s |
| Cả lời gọi Hoàn hảo | +1 lông nữa |

---

## 9. Gõ trực tiếp (R2: Ngắt; R3: Neo, Phá Khiên)

### 9.1 Lời gọi `direct`

- Một cơ chế của quái **bắt đầu** thì quái đó có một lời gọi `direct`, 1 từ (nửa dưới dải độ dài, chỉ từ đã thuộc), đi theo quái.
- **Sáng** khi quái trong một vòng giúp (Tướng 14 m, Thư Đồng 6 m) và vừa ngân sách chú ý. Ngoài vòng thì mờ, có mũi tên ở mép như mọi lời gọi.
- **Cửa sổ** (TK 9.3): `T = clamp(0,8 + k_d × (len + 1) × 12 / E; 3; 7)` giây, k_d: Thư giãn, Học 2,8; Cân bằng 2,2; Thử thách 1,6. Cơ chế kéo dài đúng T. Ví dụ 5 chữ, E 35, Cân bằng: 5,3 s.
- Bậc 0 trong hàng ưu tiên. Tối đa **2** lời gọi `direct` mở cùng lúc (3 khi có boss); cái thứ ba không mở, cơ chế của nó chạy như bỏ qua.
- **Thành công:** hủy cơ chế, hiệu ứng riêng (§9.2), +2 Vàng, Tối Thượng +3, Chuỗi +1.
- **Bỏ qua hoặc hết giờ:** cơ chế xảy ra. Không mất gì khác, Chuỗi giữ.
- Đích (báo cáo): 5–10 % số từ của ải là từ trực tiếp (TK 9.1); trung bình một lời gọi mỗi 25–40 s ở đêm có quái đó. Bản đồ 1 ở R2 chỉ có Ngắt ở Đêm 4, nên G6 đọc theo tần suất (đã chọn theo đề xuất, BUILD_NOTES §7.3; §18.3).

### 9.2 Ba động từ

| Động từ | Quái | Bắt đầu khi | Thành công | Bỏ qua | Ở đâu |
|---|---|---|---|---|---|
| **Ngắt** | Lửng Tanuki | Có ≥ 3 quái khác trong 6 m (theo mã: ≥ 4, sửa phản biện R2 cho G6, BUILD_NOTES §7.4; và mép một nhà đánh trong 9 m, §7.3), hồi 12 s đã qua: đứng lại đánh Trống Bụng Lớn trong T | Hủy trống, Tanuki choáng 2 s, +5 Vàng (Lá Tanuki) | Hết T: quái trong 6 m (cả nó) hồi 25 % máu tối đa | Bản đồ 1 Đêm 4 (R2) |
| **Neo** | Cương Thi Đầu Đàn | Bầy ≥ 4 trong 6 m và cách một nhà < 20 m (hồi 15 s; theo mã: nhà đánh, như Ngắt, `R3_PLAN.md` §5 A20) | Bầy trong 6 m đứng sững 3 s; Đầu Đàn nhận +30 % sát thương 6 s | Bầy đi tiếp (hào quang +20 % tốc trong 6 m luôn có; bầy không vượt Đầu Đàn quá 1,5 m, A21) | Hộp cát (R3) |
| **Phá Khiên** | Quỷ Núi Troll | Cách một nhà đánh < 25 m (hồi 6 s sau khi vòm tắt): dựng Vòm Đá 4 m trong T (vòm đi theo Troll, Troll vẫn đi, A22) | Vòm vỡ, Troll choáng 1,5 s, không dựng lại 10 s | Vòm giữ T giây: đạn từ ngoài vòm vào quái trong vòm −70 % (lông Tối Thượng, cận chiến không đổi, A12) | Hộp cát (R3) |

### 9.3 Ngân sách chú ý

- Đêm hiện chỉ gõ 20–23 % thời gian (bot Chuẩn, BUILD_NOTES §6.10), ngân sách là 8 s mỗi 20 s (40 %). Một từ trực tiếp ~1,7 s ở 35 WPM: vừa.
- Đích tỉ lệ gõ (báo cáo): Đêm 1–4: 15–25 % (giữ cổng 5c của BUILD_1A6 §12); **Đêm 5 (boss): ≤ 35 %**. Đêm 1–4 vượt 25 % thì hạ tần suất (hồi của cơ chế) trước khi nới cổng.
- **Ngân sách là ngân sách dự tính** (sửa review R1). Bộ điều phối chỉ cho một từ bắt đầu khi thời gian gõ dự tính (theo E, `CALL.paceK`, cộng `CALL.slipS`) giữ mọi cửa sổ 20 s ≤ 8 s ở Cân bằng: đây là cổng cứng, đo bằng bot gõ đều theo E (cổng 5a của §12). Người thật (và bot Chuẩn kiểu người `HumanTypist`) có từ chậm bất chợt (hai lỗi trong một từ tốn thêm 2–3 s) mà không ai đoán trước được, nên cửa sổ thật có thể vượt 8 s một chút. Báo cáo in cửa sổ thật của bot Chuẩn kiểu người mỗi ván; đích mềm: ≤ 20 % số ván quá 8 s, không ván nào quá 10 s. Đã thử cho biên trượt tự học theo lần trễ nặng nhất gần đây: tỉ lệ ván quá 8 s chỉ từ 9/40 xuống 7/40, còn tỉ lệ gõ ban Ngày của bot gõ đều tụt từ 30,7 % xuống 26,3 % (hỏng cổng 5b), nên bỏ.

---

## 10. Quái mới

| id | Tên | Đợt | Bậc | Máu | Giáp / KP | Tốc | Lọt | Vàng | Chặn | Toán | Khác |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `moc-tinh` | Mộc Tinh | R1 | `boss` (mới) | 4.200 (§5.1, §5.6; khởi điểm 3.200; R1 sửa review 3.800) | 30 / 0 | 0,8 (khởi điểm 0,9) | 0 | 0 (rương 150) | không bị chặn | 1 | §5 |
| `mam-go` | Mầm Gỗ | R1 | bầy | 40 | 0 / 0 | 3,0 | 1 | 1 | 1 | 4 | Chỉ do boss gọi |
| `tanuki` | Lửng Tanuki | R2 | nhỏ | 110 | 0 / 30 | 2,4 | 1 | 12 | 1 | 1 | Ngắt; chỉ trống khi mép một nhà đánh (Lũy, tháp) trong 9 m (`reachM`, BUILD_NOTES §7.3) và ≥ 4 quái khác trong 6 m (`need`, sửa phản biện R2) |
| `nuppeppo` | Nuppeppō | R2 | nhỏ | 90 | 0 / 0 | 2,6 | 1 | 6 | 1 | 3 | Chết vì sát thương không nổ thì tách 2 con |
| `nuppeppo-con` | Nuppeppō con | R2 | bầy | 30 | 0 / 0 | 4,0 | 1 | 2 | 1 | 2 | — |
| `cuong-thi-lead` | Cương Thi Đầu Đàn | R3 | vừa | 160 | 30 / 0 | 3,4 | 2 | 25 | 1 | 1 | Neo; dẫn bầy (A21); hộp cát |
| `troll` | Quỷ Núi Troll | R3 | nặng | 600 | 30 / 30 | 2,0 | 3 | 30 | 2 | 1 | Phá Khiên; hộp cát |

- Số từ TK 22.6; Ma Trơi giữ số đã chỉnh (60 máu, lọt 1). Bảng `TIERS` thêm bậc `boss` (vàng 0, lọt 0).
- Lệnh hộp cát mới `spawn` (`enemy`, `count`) để kịch bản và chủ dự án gọi quái R2, R3 vào bất kỳ lúc nào (§14).

---

## 11. Học (R3)

### 11.1 Nghĩa tiếng Việt (TK 21.2 theo lời gọi)

| Khi | Nghĩa dưới từ, trước khi gõ |
|---|---|
| Chế độ Học, Thư giãn; hồ sơ trẻ em | Luôn |
| Cân bằng | Hai lần đầu người chơi gặp từ đó (đếm qua mọi ván) |
| Thử thách | Lần đầu |
| Hỏi bài, Từ Ôn | Luôn (Hỏi bài hiện nghĩa thay cho từ, như nay) |
| Gõ sai 3 phím trong một từ | Hiện lại |

- Gõ xong: nghĩa hiện 1 s như nay, mọi chế độ.
- Số lần gặp lưu ở `typing-defense.learn` (`safe-storage` của kit), chỉ view đọc: không vào sim, không vào mã băm.

### 11.2 Từ Ôn trong lời gọi

- Từ vào sổ ôn (Ẩu, hoặc ≥ 2 lỗi) quay lại sau **25–45 s** làm **từ kế tiếp** của một lời gọi kinh tế đang sáng (Gặt, Chặt, Xây, Đào), không phải Bắn mạnh, gõ trực tiếp, Chữ Chiêu.
- Tối đa 1 Từ Ôn sống; ≤ 25 % số từ của lời gọi; mỗi từ quay lại tối đa 2 lần mỗi ván. Thẻ viền xanh ngọc, nhãn "Ôn", luôn có nghĩa.
- Gõ không lỗi hoặc Tốt: "Chuộc lại", +1 Tri thức, rời sổ. Ẩu: ở lại sổ. Hỏi bài của Thư Đồng giữ như 1A.6.

### 11.3 Sổ ôn lưu qua ván

- Hết ván (thắng, thua, rời trang), sổ ôn ghi vào `typing-defense.learn` (tối đa 40 từ, bỏ cũ nhất).
- Đầu ván, sổ đã lưu vào **đầu ván** (danh sách id từ) và nạp vào sổ ôn của sim: chạy lại tất định vì file chạy lại mang đầu ván.

### 11.4 Kế hoạch học và khởi động lạnh (TK 21.1)

| Phần | Tỉ lệ từ của lời gọi kinh tế, Hỏi bài | Khởi động lạnh (chưa có lịch sử) |
|---|---|---|
| Từ đến hạn ôn (sổ đã lưu; nếu có cổng cha thì `lookup` độ thuộc) | 60 % | Rỗng: phần này lấy từ cấp hiện tại |
| Từ ở cấp hiện tại | 25 % | 85 % |
| Từ mới (cấp cao nhất của ván, chưa gặp) | 15 %, **tối đa 8 mỗi ván** | 15 %, tối đa 8 |

- Kế hoạch tính **trước ván** (app, `src/app/learn.ts`) từ hồ sơ học, rồi ghi vào đầu ván: ba danh sách id từ. Sim chọn phần bằng luồng `words`, rồi rút từ trong dải độ dài của E như nay. Phần rỗng trong dải thì rơi về từ cấp hiện tại.
- **Từ mới không ra ở lời gọi có hạn** (Bắn mạnh, gõ trực tiếp, Chữ Chiêu) và không ra ở đêm boss. Lần đầu gặp: nghĩa hiện trước (§11.1).
- Độ dài theo E luôn thắng chủ đề và kế hoạch (TK 21.1).

### 11.5 Sự kiện học

- Một sự kiện mỗi từ gõ xong, gộp gửi mỗi 5 s qua `learningBridge()` (kit `learning`, `gameId` `typing-defense`): `buildCombatLearningEvent` cho từ lời gọi (đúng khi không Ẩu), `buildRecallLearningEvent` cho Hỏi bài. `activityType` theo kit (`typing`, `recall`); tên `defense-*` của TK §0.6 chỉ dùng khi cổng cha nhận (kiểm ở cổng cha, không sửa kit).
- Gửi từ app, không từ sim; chạy lại không gửi.
- **Đã làm (R3 bước 2–4, 25–26/10/2026; `R3_PLAN.md` §3.2–§3.4, `BUILD_NOTES.md` §7.7):** sim (`sim/systems/learn.ts`) và app (`app/learn.ts`, chunk riêng đi cùng cổng portal `app/learning.ts`) như §11.1–§11.5. Ván chờ chunk này ở tick 0 để đặt đầu ván; chunk không tải được thì ván chạy không có danh sách nào (túi cấp hiện tại như R2), không lưu sổ, không gửi sự kiện. Kịch bản `td-1b-learn`.

---

## 12. Bảng dạy bản đồ 1 (lịch mở và hai hàng boss: R1; còn lại: R3)

Một bảng duy nhất (TK 20.4 đổi theo Lời Gọi). Mỗi ý mới một câu của Bà Cú Mực (≤ 14 từ) và một chip mẹo (≤ 8 từ). Mỗi Ngày, Đêm tối đa **2 câu tự hiện**; nhà mở thêm mà chưa tới lượt dạy chỉ có dòng "làm gì" trên thẻ nhà (đọc khi cần, không tự hiện). Ví dụ Ngày 3 mở Mỏ, Tháp Pháo, Lũy cấp 2 nhưng chỉ nói 2 câu; Tháp Pháo có câu ở Đêm 3, lúc nó có việc. Hộp cát bỏ qua bảng.

| Khi | Mở | Câu Bà Cú Mực | Chip |
|---|---|---|---|
| Ngày 1 | Ruộng, lời gọi Gặt; vòng giúp của Tướng | "Lúa chín thì bác nông dân gọi. Đưa Draconis tới, gõ chữ trên bong bóng." | "Gõ chữ đầu để bắt đầu · Esc để thôi" |
| Đêm 1 | Tháp Cung; lời gọi Bắn mạnh | "Đêm xuống, tháp gọi khi quái tới gần. Gõ là bắn Phát Chữ." | "Bỏ qua lời gọi không mất gì" |
| Ngày 2 | Chặt cây, dân, Gỗ; Trại Lính | "Gỗ để xây nhà; cây mọc lại mỗi sáng. Bấm cây để chặt." (luật gỗ 26/10/2026) | "Shift + \\ thuê dân" |
| Đêm 2 | Ma Trơi bay | "Ma Trơi bay qua đầu lính. Tháp Cung và Draconis bắn được." | — |
| Ngày 3 | Mỏ Vàng, lời gọi Đào; Lũy cấp 2 mở Chấm | "Nâng Lũy thì Chấm ra giúp. Thư Đồng làm việc nhanh hơn." | "1–4 chọn người · Enter gửi đi" |
| Đêm 3 | Tháp Pháo và Nuppeppō; Tối Thượng, Chữ Chiêu | "Lông lửa đầy rồi! Bấm = rồi gõ thêm chữ cho mưa to hơn." | "= Tối Thượng" |
| Ngày 4 | Nâng cấp nhà; bán nhà | "Nhà cấp 2 mạnh hơn. Bán lại được sáu phần mười." | "Bán: bấm hai lần" |
| Đêm 4 | Tanuki và Ngắt | "Tanuki đánh trống hồi máu. Gõ chữ trên đầu nó để Ngắt." | "Chữ trên quái: gõ để phá chiêu" |
| Ngày 5 (R1) | Lũy cấp 3 mở Phẩy; báo Mộc Tinh và nhánh nó đi | "Đêm nay Mộc Tinh thức dậy. Dồn tháp lên nhánh rễ sáng." | "Boss rút ở 50 % máu" |
| Đêm 5 (R1) | Mộc Tinh: Rễ Trồi, choáng, rút lui | "Rễ trồi làm nhà tê. Lửa của chữ mới làm nó cháy." | "Choáng: gõ Bắn mạnh ngay" |

- **Mở theo ngày** (R1; dữ liệu `STAGE.unlock`, vào mã băm; lệnh `build`, `upgrade` từ chối với lý do `locked`): Trại Lính từ Ngày 2; Mỏ, Tháp Pháo, Lũy cấp 2 từ Ngày 3; nâng cấp nhà từ Ngày 4; Lũy cấp 3 từ Ngày 5. Nút còn khóa hiện lý do ("Mở ở Ngày 3"). Tối Thượng (R2) nạp từ đầu nhưng chỉ dùng được từ Đêm 3.
- Bot theo cùng lịch mở **từ R1** (§18.1): R1 cân bằng một lần với nó; R3 chỉ thêm câu chữ, không đổi luật, nên không phải chỉnh lại.
- Hai hàng boss (Ngày 5, Đêm 5) làm ở R1 bằng dải mực HUD có sẵn: boss là ý mới khó nhất, chủ dự án chơi R1 phải được dạy. Mọi câu còn lại ở R3.
- Câu chữ ở `src/ui/tips.ts` (chỉ view; R1 tạo file với hai hàng boss); lịch mở ở dữ liệu luật.
- **Đã làm (R3 phần A, 26/10/2026; `R3_PLAN.md` §3.5, `BUILD_NOTES.md` §7.7):** `ui/tips.ts` là chunk riêng, có đủ 10 hàng và dòng "làm gì" của 5 nhà. Đầu mỗi Ngày, Đêm của truyện, từ bước đầu (màn đầu còn mở thì chưa), Bà Cú Mực nói hai câu, mỗi câu 3,8 s; chip ở lại tới hết pha. Khung câu nằm **góc phải trên, ngoài sân** khi chưa có boss: ở giữa đỉnh màn nó che Khe Nứt, chỗ quái ra (ảnh `td-1b-story`). Từ lời báo Ngày 5, hai hàng boss vẫn ở thanh boss như R1. Hộp cát vẫn hiện hai hàng boss khi lệnh `boss` hay `skipTo` báo Mộc Tinh (như R1; `td-1b-night5` kiểm), không hiện hàng nào khác. Câu và chip Ngày 1 rút còn 14 và 8 âm tiết ("Lúa chín, bác nông dân gọi.", "Gõ chữ đầu để chọn · Esc để thôi"). Dòng "làm gì" hiện trên thẻ nhà và dưới bảng Xây cho loại đang chọn, chỉ ở truyện, khi nhà đã mở và hàng dạy nó chưa tới.

---

## 13. Hình và tiếng ở bản vẽ 2D

Bản vẽ 2D Văn Điền giữ nguyên (thế giới 3D chờ model Tripo). Chuyển động và hiệu ứng là việc của AI. Mọi màu là token của `src/ui/theme.css`, bảng màu bản đồ ở `COLOR` của `src/view/debug-2d.ts`; thêm token `--vd-boss` (hổ phách mắt boss), `--vd-root` (nâu rễ), `--vd-warn` (đỏ son báo đòn).

### 13.1 Mộc Tinh (R1: rõ và có đà; R2: đẹp)

Chủ dự án chơi bản R1 (§17), và đã từng loại một bản vì hiệu ứng không thấy được. Vì vậy R1 có đủ **đà trước đòn và nảy sau đòn** (biến đổi 2D rẻ: nghiêng, co giãn, lệch, nhịp chậm dần); R2 thêm hạt, mảnh vụn, ánh sáng.

**Thứ tự lớp và chú ý** (luật, kiểm ở kịch bản): thẻ chữ luôn trên cùng, không hiệu ứng nào che thẻ chữ hay vùng 1,5 m quanh thẻ; báo đòn trên thân boss; hạt dưới cùng. Dải chữ sự kiện (báo boss, choáng) nằm ngay dưới thanh boss ở đỉnh màn, không bao giờ giữa màn. Mỗi lúc tối đa một dải chữ. Hiệu ứng toàn màn (ngả màu, rung) ≤ 1 lần mỗi giây, độ mờ ≤ 0,2 (TK 20.6).

| Thứ | R1 (phải có để chơi được) | R2 (đánh bóng) |
|---|---|---|
| Nhánh boss (Ngày 5) | Mạch rễ nâu mờ (nét đứt, độ mờ 0,35) dọc nhánh từ ngã ba tới khúc nhập, chảy chậm về phía Lũy | Mạch đập nhẹ theo tiếng trống lặng |
| Lặng, trồi lên | Vết nứt bò từ Khe Nứt tới ngã ba đúng 12 s (đầu nứt có bụi); hết lặng 6 s: đất phồng 0,4 s, vỡ, boss nhô lên 0,8 s (ease-out, nảy 6 %) | Đá văng, rễ con quất ra |
| Thân | Hình giữ chỗ: tán tròn nhiều lớp nét mực, hai mắt hổ phách, rễ chân (đường cong) đung đưa theo bước; to ~5 m; vòng hổ phách mờ dưới chân. Bước đi có lún và nhún (squash 4 %), tán lắc trễ nửa nhịp | Lá rơi khi đi |
| Báo Rễ Trồi | Dưới mỗi nhà bị nhắm: vòng son đỏ có sọc, vạch quét theo chiều kim đồng hồ đúng thời gian báo; vết nứt chạy từ chân boss tới nhà; boss cắm rễ (thân hạ 5 %); đất phồng nhẹ ở 0,3 s cuối | |
| Rễ Trồi trúng | 5–7 gai rễ bật lên (nét nâu, mọc 120 ms, tan 400 ms), bụi, nhà rung 150 ms; biểu tượng **tê** (vòng xám + chữ "Tê 3 s" đếm lùi), vòng tầm của tháp chuyển xám. Không hiện số máu | Mảnh gỗ, khói ngắn; tiếng gỗ gãy |
| Báo Quật cành | Cung đỏ 120° trước boss, đậm dần 1,2 s; boss ngả ra sau (đà), tán kéo căng | |
| Quật cành trúng | Vệt cung quét, boss vượt quá đà rồi về (follow-through 150 ms), lính bị hất (lùi 1,5 m có vệt bụi) | Lóe trắng 60 ms ở lính |
| Choáng 70 % | Boss nghiêng, sao quay, vòng "Dễ Tổn Thương 5 s" đếm lùi quanh boss; rễ rút về (gai rễ dưới nhà tê chìm xuống); dải chữ "Mộc Tinh choáng! Gõ Bắn mạnh!" dưới thanh boss 1,2 s; trời ngả hổ phách ≤ 0,2; lời gọi Dồn lửa sáng theo trần (§5.2) với viền hổ phách | Sóng vỡ vỏ cây bung ra |
| Gọi Mầm Gỗ | 4 mầm xanh nhú 0,8 s rồi bật thành Mầm Gỗ | Đất tơi bắn lên |
| Trúng đòn | Lóe trắng 60 ms; vụn gỗ (4–6 hạt); thanh máu có phần "máu ma" trắng tụt theo sau 0,4 s; Phát Chữ hiện số lớn xanh ngọc; đang Cháy thì lửa nhỏ trên tán và nhãn "Cháy ×1,25"; cầu lửa tự đánh của Draconis hiện số nhỏ xám với vệt xém (đọc ra "Vỏ dày" mà không cần chữ) | Lóe theo cỡ đòn; rung boss 1–2 px |
| Quật Lũy | Cung đỏ trên Lũy 1,2 s; trúng: Lũy rung, chip Mạng nháy đỏ "−3" | Mảnh đá Lũy văng |
| Rút lui | Chìm dần 2 s, vòng bụi, lá rơi, câu "À... ta nhớ rồi."; rương bật, đồng bay về ô Vàng "+150" | Ánh sáng tán tắt từ ngoài vào |
| HUD | Thanh boss ở đỉnh giữa: máu, vạch 70 % và 50 % ("rút lui"), pha hiện tại, "còn N m tới Lũy"; khi lặng: đếm ngược | Thanh máu rung khi trúng đòn lớn |

- Mầm Gỗ: chấm xanh lá có hai lá, đi lắc. Chết: héo rũ (thu nhỏ, ngả nâu, 300 ms).
- Giảm chuyển động (`prefers-reduced-motion`): bỏ rung màn hình, rung nhà, rung thanh máu; giữ mọi vòng báo.
- Thắng: màn kết giấy dó "Giữ được làng" + sao đóng dấu son lần lượt; thua: "Lũy đã vỡ" + một dòng gợi ý chọn theo số của ván (BALANCE §4.3), ví dụ: boss qua khúc nhập với < 50 % máu cần gỡ → "Thêm tháp trên nhánh rễ sáng"; ít Bắn mạnh lúc choáng → "Lúc nó choáng, gõ Bắn mạnh ngay"; nhiều tháp bị tê → "Đặt Tháp Cung xa đường hơn: rễ không với tới". Nút "Chơi lại Ngày 5" là nút chính.

### 13.2 Tiếng (tổng hợp bằng mã, `src/view/audio-min.ts`, `folk.ts`)

| Lúc | Tiếng |
|---|---|
| Báo Ngày 5 | Gỗ trầm hai nhịp |
| Lặng trước bão | Nhạc nền lùi xuống; tiếng ù thấp lớn dần 12 s, trống trầm mỗi 3 s, nhanh dần ở 3 s cuối |
| Boss trồi lên, chuyển pha | Đất vỡ (ồn ngắn lọc thấp) rồi gầm (ồn lọc thấp + quét tần số xuống) |
| Đỉnh boss | Nhạc nền (`music.ts`) thêm lớp trống nhịp đều tới khi rút; tắt hẳn ở màn kết |
| Báo Rễ Trồi | Tiếng rễ kéo lạo xạo đúng thời gian báo; trúng: "cộp" gỗ + bụi |
| Quật cành, Quật Lũy | Vút gió + "rầm" |
| Choáng | Chuông ngân và "boong" |
| Rút lui | Hợp âm thả xuống, lá xào xạc |
| Rương | Chuỗi tick đồng theo thang nốt |

### 13.3 Món R2

- **Tối Thượng:** chân dung Draconis trượt từ mép trái 0,6 s (vẽ giữ chỗ: khung giấy, hình đầu rồng nét mực, chưa có ảnh); bóng tròn báo 0,8 s dưới mỗi lông; lông rơi chéo có vệt lửa; vũng than đỏ khi Cháy; mỗi Chữ Chiêu một nhịp trống to dần. Thanh nạp tròn quanh chân dung Tướng trên thanh đội.
- **Gõ trực tiếp:** thẻ chữ trên đầu quái có cuộn giấy, vòng đồng hồ T; thành công: chiêu vỡ thành chữ, Tanuki choáng sao; bỏ qua: vòng hồi máu xanh lá loang 6 m.
- **Hoảng:** Thư Đồng chạy lạch bạch về Lũy, dấu "!" đỏ.

---

## 14. Điều khiển mới

| Phím / chuột | Việc | Đợt |
|---|---|---|
| Thẻ nhà: Bán (bấm hai lần) | Bán 60 % | R1 |
| Thẻ Lũy: Nâng Lũy | Nâng Lũy bằng tiền | R1 |
| Thẻ kết (`src/ui/sheets.ts`, ↑ ↓ chọn, Enter): thêm "Chơi lại Ngày n" đứng đầu, là nút Enter khi n ≥ 2; "Chơi lại" cũ đổi thành "Chơi lại từ đầu" | §4.3 | R1 |
| Màn kết: "Chép số chơi thử" | Chép `__td.balance()` (JSON) vào bộ nhớ tạm; không được thì tải file `.json`. Cho B9, chủ dự án không phải mở bảng điều khiển trình duyệt. R3 phần B (`R3_PLAN.md` §5 A24): luôn lưu file `loi-goi-choi-thu-s<seed>-n<ngày>-<tick>.json` có số và cả nhật ký ván (đầu ván, mọi lệnh), chép cùng nội dung; `scripts/td/b9.ts` chạy lại nhật ký trên Node rồi chấm B9 | R1, R3 |
| `=` hoặc nút | Tối Thượng ở điểm chuột hay chỗ đông quái | R2 |
| Cài đặt: Chế độ | Thư giãn, Cân bằng, Thử thách, Học (lưu ở `td.settings`, áp dụng ván sau) | R3 |
| Hộp cát | `boss` (gọi Mộc Tinh ngay), `skipTo` (sang Ngày n của ải, đợt đã qua tính là xong), `spawn` (quái, số con), `ult` (nạp đầy); R3: nút "Đầu Đàn" (cùng 5 Cương Thi, một tick, A25), "Troll" | R1 (`boss`, `skipTo`), R2 (`spawn`, `ult`), R3 (nút) |

- Phím `-` vẫn trống (để dành cho 1C). Không phím chữ cái nào là lệnh.

---

## 15. Dữ liệu

```ts
// src/content/types.ts (thêm)
export type EnemyTier = "swarm" | "small" | "medium" | "heavy" | "boss";
export type EnemyDef = { /* … */ unblockable?: true; burnTakenMul?: number; ability?: AbilitySpec; split?: { enemy: string; count: number } };
/** R2, R3 (theo mã sau R3 bước 7): the three verbs a direct call can break (TK 9.2), each started by an attack building's rim within reachM. */
export type AbilitySpec =
  | { verb: "interrupt"; cooldownS: number; radiusM: number; need: number; reachM?: number; healPct: number; stunS: number; gold: number }
  | { verb: "anchor"; cooldownS: number; radiusM: number; need: number; reachM: number; freezeS: number; takenMul: number; takenS: number; auraSpeed: number }
  | { verb: "shield"; cooldownS: number; reachM: number; domeM: number; outsideMul: number; stunS: number; lockS: number };
export type BossDef = {
  enemy: string; retreatPct: number; retreatS: number; chestGold: number; // hit points: the enemy's `hp` (one source)
  kHp: number; kHp2: number; kHpMax: number; modeHp: Partial<Record<Mode, number>>; // §5.6, two-way k, ×modeHp of the run's mode
  heroMul: number; // Draconis's own fireballs on the boss (§5.1 "Vỏ dày")
  roots: { everyS: number; firstS: number; warnS: number; radiusM: number; stunS: number };
  slam: { damage: Range; reachM: number; everyS: number; warnS: number; knockM: number };
  stagger: { atPct: number; stunS: number; vulnerable: number; burstLifeS: number; burstReachM: number; burstWords: number; burstPerE: number }; // Dồn lửa: round(E / burstPerE) words, 1–burstWords
  summon: { enemy: string; count: number; everyS: number; firstS: number; warnS: number };
  keep: { lives: number; everyS: number; warnS: number; stopM: number };
};
export type StageDef = {
  nights: number; keepMax: number;
  boss: { night: number; lullS: number; lullAlive: number; lullWaitS: number; escort: readonly WaveEntry[]; emergeM: number; emergeAfterS: number };
  unlock: Readonly<Record<string, number>>; // R1: building id or "keep2"/"keep3"/"upgrade"/"ult" → day
};
export type KeepLevel = { slots: number; gold: number; wood: number }; // a step's price (level 1: 0)
export type Content = { /* … */ boss?: BossDef; stage?: StageDef };
```

```ts
// src/content/rules.ts (thêm)
export const MODES = { /* … mỗi chế độ thêm */ warnK: 1 /* relax, learn 1.33; challenge 0.8 */, directK: 2.2 /* 2.8; 1.6 */ };
export const SELL = { refund: 0.6, confirmS: 3 } as const;
// theo mã sau sửa phản biện R2 (damage 25 → 21; trực tiếp +3 nằm ở DIRECT.ult)
export const ULT = { max: 100, perWord: 1.2, shard: 0.6, nightPerS: 0.3, minGapS: 45, castM: 20, autoM: 14, areaM: 6, radiusM: 6, feathers: 12, everyTicks: 10, fallS: 0.8, damage: 21, blastM: 1.5, burnS: 3, bossMul: 0.25, ringM: 12, words: 3, lifeS: 4, perWordFeathers: 3, perfectFeathers: 1, delayS: 0.3 } as const;
export const SHARDS = { swarm: 0.5, small: 1, medium: 2, heavy: 3, boss: 0, stagger: 6 } as const;
export const DIRECT = { open: 2, openBoss: 3, gold: 2, ult: 3, minS: 3, maxS: 7, base: 0.8, leadM: 1.5 } as const; // R3: leadM, a pack within the leader's aura walks at most this far ahead of it (A21)
export const PANIC = { m: 6, s: 5 } as const; // a helper within m of a rooted building's rim runs home for s seconds
// PACE.speedK (sẵn có từ bước cân bằng): 0,2 → 0,3 ở sửa phản biện R2 (§6.5 bước 7)
export const LEARN = { returnS: [25, 45], reviewShare: 0.25, returns: 2, plan: { due: 0.6, current: 0.25, fresh: 0.15 }, freshMax: 8, bookSaved: 40 } as const;
```

- Bản phác `BossDef` theo mã sau sửa review R1 (`src/content/types.ts`): không có `hp` (máu gốc là `hp` của quái `moc-tinh`, BUILD_NOTES §7.1); thêm `kHp2`, `modeHp` (§5.6) và `burstWords`, `burstPerE` (Dồn lửa, §5.2); `shards` (Mảnh Chữ ở cú choáng) để R2.
- Mộc Tinh, Mầm Gỗ và `boss`, `stage` nằm trong `src/content/slice-1a.ts` (đổi id nội dung thành `w1-silverfall`, giữ tên file để đỡ đổi import).
- Trạng thái boss là một store nhỏ (`src/sim/stores/boss.ts`: nhánh, tick các đòn kế, tick hết báo, nhà bị nhắm, pha, choáng, Dễ Tổn Thương, máu gốc), băm như mọi store. Nhà thêm `stunUntil`, `spentGold`, `spentWood`. Thế giới thêm `dayStarts` (tick đầu mỗi Ngày, cho "Chơi lại Ngày n"; app giữ mã băm lúc đó). Thống kê thêm ở cuối mảng `STATS` (R1: `bossDamage`, `bossTyped`, `bossHero`, `bossRetreats`, `livesBoss`, `rootsHits`, `goldChest`, `burstTyped`, `burstWords`; R2 theo mã: `ultCasts`, `ultFeathers`, `bossUlt`, `shards`, `directOk`, `directMissed`, `panics`, cùng `damageUlt` trong nhóm sát thương; R3: `reviewRedeemed`).
- Sự kiện hiếm mới: `bossWarn`, `bossLull`, `bossEmerge`, `bossPhase`, `bossStrike`, `bossRetreat`, `victory`, `stun`, `ult`, `direct`, `review`. Vòng hiệu ứng thêm `FX.root`, `FX.slam`, `FX.sprout`, `FX.feather`. Lý do từ chối mới: `locked` (lịch mở), `keepMax`, `ultFar`.

---

## 16. File và ngân sách dòng

Cách đếm như BUILD_1A6 §0: `.ts` trong `src`, trừ `src/kit`; test, bot, kịch bản không tính. Hiện **7.499** (trước 1B). Trần cứng 1B: **10.500**; mỗi đợt có trần riêng. Cột là mức tối đa từng file; trần cộng dồn mới là cổng. Phản biện 24/10 đưa lịch mở, hai hàng boss của bảng dạy, Chơi lại Ngày n, đà của boss vào R1 (R1 +100 dòng, R3 bớt tương ứng); trần 1B giữ 10.500.

| File | R1 | R2 | R3 | Ghi chú |
|---|---|---|---|---|
| `src/sim/systems/boss.ts` (mới) | ≤ 300 | +20 | — | Nhánh, lặng, trồi, pha, đòn, choáng, gọi, Lũy, rút (không trừ máu nhà: bớt mã) |
| `src/sim/stores/boss.ts` (mới) | ≤ 40 | — | — | |
| `src/content/types.ts`, `rules.ts`, `slice-1a.ts`, `compile.ts` | +175 | +110 | +25 | Dữ liệu §15; lịch mở ở R1 |
| `src/sim/world.ts`, `commands.ts`, `waves.ts`, `spawn.ts`, `move.ts`, `deaths.ts` | +150 | +50 | +30 | `victory`, nâng Lũy, bán, ải, lịch mở, `dayStarts`, sinh giữa đường, không bị chặn |
| `src/sim/systems/combat.ts`, `economy.ts`, `attention.ts`, `pace.ts`, `calls.ts` | +60 | +80 | +45 | Tê, Dồn lửa, lặng, đứng yên bộ điều nhịp; loại lời gọi mới; Từ Ôn |
| `src/sim/stores/*`, `events.ts`, `stats.ts`, `hash.ts` | +35 | +25 | +5 | |
| `src/sim/systems/ult.ts` (mới) | — | ≤ 170 | — | Nạp, dùng, lông, Chữ Chiêu |
| `src/sim/systems/direct.ts` (mới) | — | ≤ 180 | +30 | Lời gọi trực tiếp, Ngắt; Neo, Phá Khiên ở R3 |
| `src/sim/systems/abilities.ts` (mới) | — | ≤ 110 | +45 | Trống Tanuki, tách Nuppeppō; vòm Troll, hào quang Đầu Đàn |
| `src/sim/systems/agents.ts` | — | +30 | — | Hoảng |
| `src/view/boss-2d.ts` (mới) | ≤ 320 | +30 | — | §13.1; đà và nảy ở R1 |
| `src/view/fx-2d.ts` (mới) | — | ≤ 230 | — | Hạt có pool, Tối Thượng, gõ trực tiếp, hoảng |
| `src/view/debug-2d.ts`, `words/cards.ts` | +20 | +30 | +25 | Gọi lớp mới; thẻ trực tiếp, "Ôn", luật nghĩa |
| `src/view/audio-min.ts`, `folk.ts` | +45 | +35 | — | §13.2 |
| `src/ui/hud.ts`, `sheets.ts`, `build-menu.ts`, `title.ts`, `settings.ts` | +125 | +35 | +45 | Thanh boss, màn thắng và sao, Từ cần ôn, gợi ý thua, Chơi lại Ngày n, Bán, Nâng Lũy, nút khóa; thanh Tối Thượng; Chế độ |
| `src/ui/tips.ts` (mới) | ≤ 25 | — | +60 | Hai hàng boss ở R1; mọi câu Bà Cú Mực, chip ở R3 |
| `src/app/learn.ts` (mới) | — | — | ≤ 200 | Kế hoạch, khởi động lạnh, sổ ôn lưu, sự kiện học |
| `src/app/*`, `src/main.ts`, `input.ts` | +80 | +25 | +40 | Ải truyện, màn kết, Chơi lại Ngày n (chạy lại nhật ký, so mã băm), Chép số chơi thử; `=`; đầu ván học |
| **Cộng dồn (trần)** | **≤ 8.900** | **≤ 10.000** | **≤ 10.500** | Sửa review R1: R1 8.850 → 8.900 (lấy 50 dòng từ phần R2, R2 giữ 10.000) |

**Thứ tự cắt khi vượt trần** (ghi vào BUILD_NOTES khi cắt): 1) Troll, Đầu Đàn, Neo, Phá Khiên (−85); 2) Từ Ôn quay lại trong lời gọi, giữ Hỏi bài (−40); 3) Thư Đồng hoảng (−30); 4) Nuppeppō tách đôi (−35).

---

## 17. Thứ tự làm

Mỗi đợt: làm → phản biện độc lập → sửa, như 1A.6. Ghi số thật vào `BUILD_NOTES.md` mục mới **§7 "1B"** (§7.1 R1, §7.2 sửa review R1, §7.3 R2, §7.4 sửa phản biện R2, §7.5 sửa phản biện R2 lần 2, §7.6 sửa phản biện R2 lần 3, §7.7 R3) và một changelog mỗi đợt.

### R1 "Mộc Tinh tới" (chơi được một mình)

1. Dữ liệu và ải: `stage`, Đêm 5 mới, pha `victory`, sao, **lịch mở** (§12); truyện là mặc định từ màn đầu ("Bắt đầu: Bản đồ 1 · Đồng Cỏ Thác Bạc"), hộp cát qua `?sandbox=1`.
2. Mộc Tinh đủ §5 (trừ hoảng và Mảnh Chữ): nhánh báo từ Ngày 5, lặng, trồi ở ngã ba, Vỏ dày; Mầm Gỗ; lệnh hộp cát `boss`, `skipTo`; test nội dung cho cách "đặt xa đường" (§5.5).
3. Nâng Lũy bằng tiền, bán 60 %, test thuộc tính tiền.
4. Bản vẽ 2D và tiếng phần R1 của §13 (có đà và nảy, thứ tự lớp); thanh boss; hai hàng boss của bảng dạy; màn thắng, thua có sao, Từ cần ôn, gợi ý thua; **Chơi lại Ngày n**; Chép số chơi thử.
5. Bot: chơi ải truyện theo lịch mở, nâng Lũy bằng lệnh, luật Tướng ở đỉnh boss, `heroKite` cho B5 (§18.1); báo cáo thêm bảng boss (§18.2).
6. Cân bằng theo §6.5 tới đích §6.4 (Cân bằng là cổng; Thư giãn, Thử thách báo cáo và chỉnh nếu được bằng cùng núm).
7. File vàng làm lại; thêm file vàng `tests/golden/td-1b-boss.json` (hộp cát, Đặt sẵn, gọi boss Ngày 1, tới khi rút).
8. Kịch bản `td-1b-boss`, `td-1b-night5`, `td-1b-build`, `td-1b-perf` (§19).

**Xong R1 khi:** chủ dự án chơi hết bản đồ 1 tới boss ở 1280 × 720 được; §21 cổng 1–4 và 7–10 đạt cho phần R1, cổng G1, G3, G4, G7, G8; B1–B8 đạt ở cả hai bộ seed và đích chặt §6.4 ở Cân bằng đạt trên hai bộ gộp (cách đo ở §6.4). R2, R3 phải giữ các số này.

### R2 "Gõ giúp trận"

1. Tối Thượng, Mảnh Chữ, Chữ Chiêu (§8); lệnh `ult`, phím `=`, thanh nạp.
2. Lời gọi `direct` và Ngắt (§9); Tanuki, Nuppeppō (§10); Đêm 3, 4 mới (§4.2).
3. Thư Đồng hoảng; hình R2 của §13 (Tối Thượng, gõ trực tiếp, đánh bóng boss).
4. Bot: dùng Tối Thượng, phản xạ gõ trực tiếp; báo cáo thêm cột Tối Thượng, gõ trực tiếp, tỉ lệ gõ Đêm 5.
5. Cân bằng lại tới đích §6.4; file vàng làm lại; kịch bản `td-1b-ult`, `td-1b-direct`.

### R3 "Học và dạy"

Kế hoạch làm (file, thứ tự, dạng dữ liệu, chỗ chưa rõ đã chọn theo đề xuất, cân bằng): `R3_PLAN.md` (25/10/2026).

1. Luật nghĩa, Từ Ôn, sổ ôn lưu, kế hoạch học, khởi động lạnh, sự kiện học (§11).
2. Bảng dạy, lịch mở, câu Bà Cú Mực và chip (§12); dòng Chế độ trong Cài đặt; lưu sao.
3. Troll, Đầu Đàn, Neo, Phá Khiên ở hộp cát (cắt đầu tiên nếu vượt trần). **Xong** (R3 phần B, `b8d78d3`; không cắt: 10.413 dòng).
4. Bot theo lịch mở; cân bằng lần cuối; file vàng; kịch bản `td-1b-learn`, `td-1b-story`, `td-1b-tour`. **Bot Học và ba kịch bản xong** (phần A, phần B); quyết định gỗ của chủ dự án (26/10/2026) đã làm (BUILD_NOTES §7.8); cân bằng lần cuối là bước kế, đo trên luật gỗ mới.
5. Gói chơi thử cho chủ dự án (§22), xuất nhật ký cho B9. **Gói xong** (`docs/td/PLAYTEST_1B.md`, `scripts/td/b9.ts`); số B9 chờ chủ dự án chơi.

---

## 18. Bot và cân bằng

### 18.1 Bot

| Việc | R1 | R2 | R3 |
|---|---|---|---|
| Thế giới | Ải truyện (`sandbox: false`), `nights: 5`, thắng khi `victory`, **theo lịch mở** (bước chưa mở thì chờ, không bỏ) | | |
| Lũy | Bước `{ keep: n }` gửi `upgrade` cho Lũy khi đủ tiền và đã mở (thay lệnh hộp cát) | | |
| Ngày 5 (Tốt) | Đặt thêm Tháp Cung bên nhánh boss (`ARCHER_WEST` hay `ARCHER_EAST`) nếu chưa có và đủ tiền; Vừa, Kém không đổi | | |
| Không gõ, Tướng đuổi boss (`heroKite`) | Bot Không gõ, bố cục Tốt; từ lúc boss trồi: Draconis hạ cánh trước boss 6 m trên đường, đứng bắn tới khi boss cách ≤ 3 m hay đi qua, rồi bay lên trước. Chạy ở Cân bằng, Thử thách cho B5 (cách không gõ mạnh nhất đã biết, §6.3 điểm 7) | | |
| Tướng ở đỉnh boss (`heroBoss`) | Từ lúc lặng: tới nhà đánh mà boss **sắp vào tầm** (gần nhất phía trước trên đường boss); chiến thuật Tốt ưu tiên Tháp Pháo (Cháy); đứng đó tới khi boss qua; lúc choáng, mắt ưu tiên lời gọi Dồn lửa (`reflex`) | | |
| Thư Đồng | Như cũ | Tránh nhà đang bị nhắm Rễ Trồi (Tốt), không tránh (Vừa, Kém) | |
| Tối Thượng | — | Dùng khi đầy và (boss trong 12 m, hoặc ≥ 5 quái trong 6 m quanh một điểm của vòng Tướng); Kém dùng ngay khi đầy | |
| Gõ trực tiếp, Chữ Chiêu | — | Là lời gọi: `HumanTypist` gõ như mọi lời gọi; phản xạ báo trước như Bắn mạnh | |
| Học | — | — | Hồ sơ học rỗng (khởi động lạnh) và hồ sơ đã có sổ ôn 20 từ |

### 18.2 Báo cáo `pnpm td:balance` thêm

- Bảng BALANCE §3 như nay (thắng, S, P, I, O, N, Q, phe ta, hạ quái, bậc mỗi đợt, khoảng sinh, học) cho Thư giãn, Cân bằng, Thử thách; B1–B9; hai bộ seed × 120 (`--threads=6`, máy 16 GB).
- **Bảng boss** mỗi ô: ván tới boss; hạ boss (rút) %; trồi → trúng đầu p50; giao chiến (trúng đầu → rút) p50; % đường lúc rút p50; mạng mất ở đỉnh boss p50 (toán đi trước, Mầm Gỗ, Quật Lũy); phần sát thương do gõ lên boss; phần của Draconis tự đánh; số lần nhà tê, phần tháp bị tê lúc boss trong tầm; Nhàn I ở đỉnh boss; Tối Thượng % lên boss (R2). Thêm một dòng `heroKite` (Cân bằng, Thử thách).
- Thắng và Biên S in ba cột: bộ 1, bộ 2, gộp 240 (§6.4).
- **Tách hai số:** mạng trước đỉnh boss p50, S của ván thắng p50, phần ván thua do boss / do các đêm trước.
- **Cổng G3, G8** (sửa phản biện R2 lần 2): báo cáo chấm hai cổng này cho bot Chuẩn ở Cân bằng, ở từng bộ seed và trên hai bộ gộp (mỗi bộ và phần gộp đều phải đạt), và in bảng boss của hai bộ gộp.
- Cột R2: số lần dùng Tối Thượng, từ trực tiếp % số từ, tỉ lệ gõ Đêm 1–4 và Đêm 5.
- Bảng cổng của BUILD_1A6 §12 (5 seed, 4 đêm) giữ ở cuối báo cáo, chạy trên ải truyện.

### 18.3 Dải đích theo chế độ (BALANCE §3) và cổng

| Chỉ số | Thư giãn | Cân bằng | Thử thách |
|---|---|---|---|
| Thắng | ≥ 92 % | 75–90 % (**1B: 78–88 % từng bot, hai bộ gộp**) | 50–75 % |
| Biên S (trung vị) | ≥ 70 % | 35–65 % (**1B: 40–60 % bot Chuẩn, hai bộ gộp**; bot khác giữ 35–65 %, sửa phản biện R2) | 15–45 % |
| Áp lực P | 5–15 % | 15–35 % | 30–50 % |
| Nhàn I | ≤ 20 % | ≤ 10 % | ≤ 5 % |
| Ngộp O | ≤ 3 % | ≤ 8 % | ≤ 15 % |
| Gần thua N (mỗi ải) | ~0 | 0,3–1 | 1–2 |
| Quãng Q (trung vị) | ≤ 45 % | 50–70 % | 60–80 % |

| Cổng | Ngưỡng ở 1B |
|---|---|
| B1 | Cân bằng: Mới tới Nhanh trong dải BALANCE §3 (thắng, S, P, I, O) ở từng bộ seed (cổng chung, luôn in); đích chặt 1B trên hai bộ gộp (§6.4): thắng 78–88 % mọi bot, Biên S 40–60 % bot Chuẩn, bot khác 35–65 % (sửa phản biện R2, đã chọn theo đề xuất của BUILD_NOTES §7.3) |
| B2 | Không bot nào có S ≥ 90 % kèm I ≥ 20 % ở Cân bằng |
| B3 | Mới ≥ 70 % ở Cân bằng; Trẻ em ≥ 85 % ở Thư giãn |
| B4 | S Chậm chắc > S Ẩu; Chuẩn hạ quái và hạ boss nhanh hơn Ẩu. Sửa review R1: "hạ quái" đo từ đòn trúng đầu tới khi chết (thời gian chịu đòn, cột "Hạ quái (s)"), không còn từ lúc sinh; "hạ boss" là sát thương mỗi giây lên boss từ đòn trúng đầu tới lúc rút (hoặc hết ván), trung vị, ở Cân bằng |
| B5 | Không gõ thua ở Cân bằng và Thử thách (Thư giãn miễn); Không gõ không bao giờ làm boss rút ở hai chế độ đó, **cả `heroKite`** |
| B6 | Chuẩn Tốt − Chuẩn Kém ≥ 10 điểm % thắng ở Cân bằng và Thử thách |
| B7 | ≤ 3 bậc mỗi đợt, khoảng sinh ±15 %; tắt bộ điều nhịp thì Chuẩn vẫn trong dải BALANCE §3 ở từng bộ, dải chặt 1B trên hai bộ gộp |
| B8 | Cổng học của game (`learnOk`) đạt mọi ô; R3 thêm: ≤ 8 từ mới mỗi ván, từ mới không ở lời gọi có hạn |
| B9 | Sau buổi chơi thử của chủ dự án: bot cùng hồ sơ lệch ≤ 15 % (§22) |

**Cổng riêng của game** (thêm vào `tests/td-balance-gates.test.ts` khi đo được trên seed cố định):

| # | Cổng | Ngưỡng |
|---|---|---|
| G1 | Cổng 4–7 của BUILD_1A6 §12 trên ải truyện | Như cũ (Không gõ qua Đêm 1–4; cửa sổ ≤ 8 s; Ngày ≥ 30 %; gõ +25 % so với không gõ) |
| G2 | Tỉ lệ gõ Đêm | Đêm 1–4: 15–25 %; Đêm 5: ≤ 35 % (bot Chuẩn) |
| G3 | Giao chiến boss | Bot Chuẩn p50 45–75 s (TK 18.8), ở mỗi bộ seed và gộp (báo cáo chấm từ sửa phản biện R2 lần 2); núm là tốc boss (§6.5 bước 1) |
| G4 | Báo trước | Mọi đòn boss có sự kiện báo ≥ thời gian báo của chế độ trước đòn; mọi ván thua do boss có báo Ngày 5 và đếm ngược Đêm 5 |
| G5 | Tối Thượng | ≤ 15 % sát thương lên boss, ≤ 15 % cả ải, **mọi bot gõ** ở Cân bằng trên hai bộ gộp; Thử thách in báo cáo (R2; BALANCE §9.1 qua §8.2; sửa phản biện R2: trước chỉ chấm bot Chuẩn) |
| G6 | Gõ trực tiếp | Bot Chuẩn: một lời gọi `direct` được tạo mỗi 25–40 s ở đêm có quái đó (Đêm 4); ≤ 2 mở cùng lúc khi không có boss, ≤ 3 khi có boss (R2). Đọc theo tần suất của §9.1 vì bản đồ 1 chỉ có một động từ ở một đêm (đã chọn theo đề xuất, BUILD_NOTES §7.3); "5–10 % số từ của ải" (TK 9.1) in báo cáo, thành cổng khi đủ ba động từ. Báo cáo in tần suất của mọi bot |
| G7 | Tiền | Không chuỗi xây, nâng, bán, hoàn tác nào sinh Vàng hay Gỗ; rương boss ghi đúng một lần |
| G8 | Không chờ không ở đỉnh boss | Bot Chuẩn: boss trồi → trúng đầu p50 ≤ 35 s; Nhàn I từ lúc hết lặng tới kết ải trong dải I của chế độ (Cân bằng ≤ 10 %); ở mỗi bộ seed và gộp như G3. Núm: chỗ trồi `emergeM` 20–35 m (luôn cách khúc nhập ≥ 40 m) |

---

## 19. Kịch bản trình duyệt

Chạy với máy chủ dev cổng 3046: `pnpm exec vite --host 127.0.0.1 --port 3046 --strictPort`, rồi `OUT_DIR=tmp/visual node src/kit/tools/cdp-run.mjs scripts/visual/scenarios/<tên>.mjs --width=… --height=…`. Mỗi kịch bản ở **1280 × 720 và 1920 × 1080**; kiểm không lỗi console, không ngoại lệ trang, thẻ chữ không chồng, không đè HUD, chữ ≥ 18 px; nhật ký trang chạy lại trên Node ra cùng mã băm. Kịch bản cũ (`td-1a-*`, `td-1a6-*`, `td-theme`, `td-balance`) vẫn phải đạt. Một Chrome một lúc; tắt máy chủ và Chrome khi xong.

| Kịch bản | Đợt | Kiểm |
|---|---|---|
| `td-1b-boss` | R1 | Hộp cát, Đặt sẵn, `boss`: vết nứt bò, boss trồi ở ngã ba trên nhánh đã báo; vòng báo Rễ Trồi hiện trước đòn đúng 1,5 s (đọc sự kiện và ảnh), nhà tê có biểu tượng, không số máu; gõ lời gọi của nhà tê thì Phát Chữ bắn; Quật cành có cung báo và boss ngả ra sau; choáng ở 70 %: dải chữ dưới thanh boss (không giữa màn), mọi tê hết, lời gọi Dồn lửa sáng ≤ trần; Mầm Gỗ mọc, rút ở 50 % → màn thắng có sao và Từ cần ôn; **không hiệu ứng nào che thẻ chữ** (đo hộp thẻ với vùng vẽ dải chữ, vòng báo); **bộ ảnh chậm** (6 khung trong 1,5 s quanh mỗi đòn) trên nền sáng và tối (đêm) |
| `td-1b-night5` | R1 | Hộp cát, lệnh `skipTo` (Đặt sẵn, đã qua 4 đêm, vào Ngày 5): báo Ngày 5 và mạch rễ trên nhánh boss, Đêm 5, đếm ngược lặng 12 s (không lời gọi kinh tế mới sáng; Bắn mạnh của quái còn sống vẫn sáng), boss trồi; nhánh thua: bỏ tháp khúc nhập, boss tới Lũy, Quật Lũy trừ 3 mạng mỗi đòn, màn thua có gợi ý; bấm **Chơi lại Ngày 5**: mã băm ở đầu Ngày 5 bằng mã đã ghi, chơi tiếp được, nhật ký mới chạy lại trên Node ra cùng mã băm |
| `td-1b-build` | R1 | Màn đầu → "Bắt đầu" vào truyện: không bảng hộp cát, lệnh hộp cát bị từ chối (`noSandbox`), nút khóa hiện "Mở ở Ngày 3". Chỉ bàn phím: xây, nâng (giá đúng), nâng Lũy (Chấm ra), bán bấm hai lần (hoàn 60 %), hoàn tác 5 s; lý do từ chối hiện đúng |
| `td-1b-perf` | R1 | Boss + `flood(300)` + Mầm Gỗ (R2: + Tối Thượng): ngân sách §20 |
| `td-1b-ult` | R2 | Nạp đầy bằng hộp cát, `=`: lông rơi có bóng báo, Chữ Chiêu 3 từ gõ thật, +3 lông mỗi từ; bỏ qua Chữ Chiêu không mất gì; cửa sổ 20 s ≤ 8 s |
| `td-1b-direct` | R2 | `spawn` Tanuki trong bầy: thẻ trên đầu có vòng T; gõ được → choáng, +5 Vàng; bỏ qua → vòng hồi máu; tối đa 2 thẻ trực tiếp. R3: Đầu Đàn và bầy (thẻ ⚓ Neo gõ được: bầy đứng sững 3 s, ×1,3 trong 6 s), Troll (thẻ 🛡️ Phá Khiên gõ được: vòm vỡ, choáng 1,5 s; một vòm để chạy giữ T) |
| `td-1b-learn` | R3 | Nghĩa hiện 2 lần đầu rồi ẩn (Cân bằng); Từ Ôn quay lại có nhãn "Ôn"; sổ ôn còn sau khi tải lại trang; hàng đợi sự kiện học có sự kiện đúng `gameId` |
| `td-1b-story` | R3 | Màn đầu → Bản đồ 1: câu Bà Cú Mực và chip ở Ngày 1, Đêm 1, Ngày 3 (≤ 2 câu tự hiện mỗi Ngày, Đêm); Cài đặt đổi chế độ |
| `td-1b-tour` | R3 | Bộ ảnh cho chủ dự án: làng Ngày 5 có báo boss, lặng trước bão, Rễ Trồi báo và trúng, choáng, Mầm Gỗ, rút, màn thắng, Tối Thượng, Ngắt, Từ Ôn, chip bảng dạy (theo mã: 19 ảnh đánh số, thêm Neo, bầy đứng sững, Phá Khiên, vòm vỡ, "Chuộc lại"; file "Chép số chơi thử" bắt được và chạy lại trên Node ra cùng mã băm) |

- Ảnh ở `OUT_DIR` ngoài repo (không media trong Git). Mỗi hiệu ứng phải nhìn thấy trong ảnh chậm (hạn chót: AI tự xem ảnh trước khi báo xong).

---

## 20. Hiệu năng

| Thứ | Ngân sách |
|---|---|
| Bước sim (Node, Apple Silicon) | ≤ 0,5 ms p95 với 300 quái + boss + 8 Mầm Gỗ + Tối Thượng đang rơi (hiện 0,03 ms p95 với 300 quái) |
| Bước sim trong Chrome | trung vị ≤ 0,05 ms |
| Vẽ 2D + thẻ chữ | p95 ≤ 8 ms ở 1280 × 720 và 1920 × 1080 (hiện ~1,0 ms) |
| Lớp boss (`boss-2d.ts`) | p95 ≤ 0,6 ms |
| Hạt 2D | ≤ 300 sống, ≤ 40 mới mỗi khung, pool (không cấp phát mỗi khung); gai rễ ≤ 7 mỗi nhà |
| Luồng chính Chrome | ≤ 4 ms mỗi khung trung bình **ở 60 khung/s** (sửa phản biện R2 lần 2: `td-1b-perf` giữ nhịp khung 60 Hz, vì Chrome không đầu chạy 50–156 khung/s tùy máy và số mỗi khung đổi theo; kết quả in thêm phần thời gian bận và khung/s); không khung > 16,7 ms lúc boss vào, chuyển pha, rút (chỉ đọc các khung của lúc đó; mỗi khung chấm bằng tổng bước + HUD và vẽ 2D + thẻ của chính khung đó, sửa phản biện R2 lần 3, BUILD_NOTES §7.6) |
| Gói JS | **Phần khởi động của mỗi trang** gzip ≤ 85 kB: những gì trang phải tải xong mới dùng được (vẽ khung đầu, nhận phím, chạy vòng chơi). Ở "/" là chunk vào và màn đầu; link `?title=0`, `?sandbox=` chỉ chunk vào. `pnpm build` kiểm từ manifest của Vite (`scripts/bundle-budget.mjs`), in phần còn trống, các chunk nạp sau và tổng. Thẻ Hồ sơ gõ của màn đầu tải khi được chọn. Thẻ Cài đặt tải khi được chọn, hoặc cùng chunk thẻ tạm dừng và kết (thẻ đó chứa một thẻ Cài đặt) khi trang đã dùng được, cái nào tới trước; lúc màn đầu hiện không tải thẻ nào (sửa phản biện R2 lần 3). Tiếng, thẻ tạm dừng và kết, bảng hộp cát tải khi trang đã dùng được. Mỗi chunk thử 3 lần rồi có đường dự phòng (`app/chunks.ts`); chunk hỏng được hỏi lại khi trang cần nó, sau 15 s nghỉ: thẻ khi cần hiện, bảng hộp cát khi đang mở, tiếng ở phím hay cú bấm kế (sửa phản biện R2 lần 3). Chrome 155 giữ lỗi của một `import()` hỏng tới khi tải lại trang, nên ở đó lần hỏi lại cũng hỏng và chỉ F5 gỡ được; Chrome for Testing 156 tải lại được. Số: trước 1B 68,9 kB cả gói; R2 một chunk 87,2 kB; sửa phản biện R2: chunk vào 77,2 kB, nhưng "/" thật cần 83,7 kB; sửa phản biện R2 lần 2: "/" 82,6 kB (chừa 2,4 kB), `?title=0` 78,0 kB, cả gói 91,6 kB; sửa phản biện R2 lần 3, dựng trên Mac: "/" 82,0 kB (chừa 3,0 kB), `?title=0` 77,5 kB, cả gói 91,0 kB (cùng mã lần 2 dựng trên Mac ra 81,95 kB: hai máy lệch 0,6 kB, BUILD_NOTES §7.6). Đổi nghĩa từ "cả gói" sang "phần khởi động": **đề xuất của vòng này, chờ chủ dự án xác nhận** (BUILD_NOTES §7.5) |
| Âm | ≤ 12 nốt tổng hợp cùng lúc; tiếng báo đòn không bị tiếng khác nuốt (ưu tiên cao nhất) |

---

## 21. Cổng cứng cuối 1B (hết R3)

1. `pnpm check` xanh (kit sha256, test, build); `tests/boundary.test.ts` xanh.
2. Tất định: file vàng `td-1a.json` (làm lại) và `td-1b-boss.json` khớp; Node và Chrome cùng mã băm; nhật ký trang của mọi kịch bản chạy lại trên Node ra cùng mã băm.
3. Bất biến (test thuộc tính): lời gọi SÁNG ≤ trần; tối đa 1 khóa; chữ đầu không trùng, không cặp cách một phím; bỏ qua mọi lời gọi (kể cả `ult`, `direct`) thì Chuỗi không giảm, không mất tài nguyên; G7 tiền.
4. Ngân sách chú ý: mọi cửa sổ 20 s mà bộ điều phối dự tính ≤ 8 s ở Cân bằng (bot gõ đều, cổng 5a); cửa sổ thật của bot Chuẩn kiểu người theo đích mềm §9.3; G2.
5. B1–B8 đạt ở cả hai bộ seed × 120; đích chặt §6.4 ở Cân bằng đạt cho từng bot trên hai bộ gộp (§6.4).
6. G1, G3, G4, G8 (R1); G5, G6 (R2); B8 phần học (R3).
7. Boss đọc được: `td-1b-boss` và `td-1b-night5` đạt; bộ ảnh chậm cho thấy mọi báo đòn.
8. Hiệu năng §20.
9. Mọi kịch bản §19 và kịch bản cũ đạt ở hai cỡ, 0 lỗi console.
10. Số dòng ≤ 10.500 (R1 ≤ 8.900 sau sửa review, R2 ≤ 10.000).
11. Changelog mỗi đợt; BUILD_NOTES §7 có số thật; AGENTS.md cập nhật lệnh và kịch bản mới.
12. Chủ dự án chơi thử (§22) và có số cho B9.

---

## 22. Chủ dự án chơi thử (1280 × 720, khoảng 30 phút)

Trước khi chơi: Cài đặt → Nhịp tự điều **Bật**, chế độ Cân bằng. Sau mỗi ván: ở màn kết bấm **"Chép số chơi thử"** và dán vào một file gửi lại (hồ sơ và chỉ số cho B9; không cần mở bảng điều khiển trình duyệt). R3 phần B: nút này lưu luôn file `.json` vào Tải về, có cả nhật ký ván; gửi các file đó. Gói chơi thử đủ (chuẩn bị ở 1280 × 720, phiếu 11 câu, cách điều phối viên chấm B9 bằng `node --import tsx scripts/td/b9.ts <file>… --seeds=40`): `docs/td/PLAYTEST_1B.md`.

1. **Một ván đủ bản đồ 1** (khoảng 12 phút). Cuối ván ghi: thắng hay thua, còn bao nhiêu mạng, mấy sao.
2. Ngày 5: có thấy báo Mộc Tinh và mạch rễ trên nhánh nó đi không? Có làm gì khác đi vì lời báo không (thêm tháp trên nhánh đó, bán tháp bên kia, nâng nhà, dời Tướng)?
3. Đêm 5: có thấy 12 s lặng, đếm ngược và vết nứt bò tới ngã ba không? Lúc boss đi tới tháp đầu tiên có thấy chờ lâu không?
4. Rễ Trồi: nhìn vòng đỏ có hiểu "nhà này sắp bị tê" không? Đủ thời gian để nhận ra không?
5. Lúc boss choáng (70 %): có thấy dải chữ và các lời gọi Dồn lửa không? Có gõ kịp không? Có hiệu ứng nào che chữ không?
6. Nếu thua: có hiểu vì sao thua không (dòng gợi ý có đúng không)? Thua có công bằng không? Bấm "Chơi lại Ngày 5" có muốn chơi tiếp không?
7. **Chơi lại Ngày 5, cố ý để boss tới Lũy** (bán bớt tháp ở khúc nhập): cảm giác lúc Lũy bị đập thế nào?
8. Nâng một tháp, bán một nhà (bấm hai lần), nâng Lũy lên 2 rồi 3: giá có rõ không? Chấm, Phẩy ra có thấy không?
9. (R2) Bấm `=` lúc đông quái và gõ Chữ Chiêu: có thấy mưa to hơn không? Ngắt một Tanuki: có thấy chữ trên đầu nó kịp không?
10. (R3) Có nhớ được từ nào không? Có thấy từ Ôn quay lại không? Câu Bà Cú Mực có ngắn, dễ hiểu không?
11. Câu hỏi chung: lúc nào thấy căng nhất? Lúc nào thấy chán? Có lúc nào bị giữ chặt ở thẻ chữ không?

---

## 23. Rủi ro

| Rủi ro | Cách chặn |
|---|---|
| Boss quyết hết, thua thấy "xui" | Báo từ Ngày 5 kèm nhánh boss đi; đếm ngược; thanh boss có vạch rút lui và khoảng cách tới Lũy; Quật Lũy có báo; màn thua có gợi ý theo ván; Chơi lại Ngày 5; cổng G4; B9 hỏi người thật |
| Không gõ mà vẫn hạ boss (Draconis đuổi boss) | Vỏ dày ×0,5; bot `heroKite` trong B5; nếu vẫn hạ được thì hạ `heroMul` trước khi đụng núm khác |
| Hai đỉnh quá gắt (Biên S tụt vì ván sát nút) | Quật Lũy trừ 3 mạng mỗi 2,5 s, không thua ngay; báo cáo "S của ván thắng" và N |
| Biên S lệch giữa các bot (đo: 7–16 mạng sau Đêm 5 phần đầu) | Thứ tự chỉnh §6.5 bước 5 (Thuồng Luồng giáp 60 % là chỗ chính xác và Phát Chữ quyết); không thêm luật theo bot |
| Boss tê nhà làm người gõ chậm thua nhiều hơn dự kiến | Số đầu dò chưa có Rễ Trồi; R1 đo lại và chỉnh máu boss trước mọi núm khác (§6.5 bước 0); lời gọi của nhà tê vẫn bắn |
| Đỉnh boss thành chờ không (boss đi lâu chưa tới tháp) | Trồi ở ngã ba; G8 (trồi → trúng đầu ≤ 35 s, I đỉnh boss trong dải) |
| Nhịp k làm người gõ nhanh thấy boss "trâu" | Chỉ nâng máu khi k > 1, trần ×1,12; báo cáo hạ boss của Khá, Nhanh |
| Lời gọi mới làm tràn ngân sách chú ý ở Đêm 5 | Mọi từ qua kiểm "vừa ngân sách"; G2; hạ tần suất trước khi nới cổng |
| Lịch mở làm lệch cân bằng | Lịch mở có từ R1, bot theo cùng lịch từ R1; R3 chỉ thêm câu chữ |
| Phương sai theo seed (đo: Chuẩn S 17,5 % ở seed 1–24, 40 % ở 1–120) | Luôn hai bộ × 120 seed; không kết luận từ ít seed; đích chặt đo trên hai bộ gộp (§6.4) |
| Phình mã | Trần từng đợt §16 và thứ tự cắt |
| Đụng kit đang có người sửa | 1B không cần đổi kit; nếu cần thì chỉ ngoài `shared/game-kit/typing`, có test, tương thích ngược |
| Hình giữ chỗ bị coi là "dựng model bằng mã" | Mộc Tinh 2D là nét mực, vòng tròn như mọi hình 2D hiện có; model thật là file Tripo ở 1C |
| Tốn RAM khi chạy bot và trình duyệt cùng lúc | `--threads=6`; không chạy `td:balance` cùng lúc với Chrome; một máy chủ dev cổng 3046 |

---

## 24. Mặc định đã chọn (chủ dự án đổi được)

1. Bản đồ 1 có 5 Ngày, 5 Đêm (không 8 đợt); Mộc Tinh ở cuối Đêm 5.
2. Máu Mộc Tinh khởi điểm 3.200 (có thể về ~2.900 sau khi đo với Vỏ dày), rút ở 50 %, nâng theo k khi k > 1. Sau R1 (sửa review): 3.800, hệ số k hai chiều có số hạng bậc hai và hệ số riêng theo chế độ (§5.6). Sau R2: 4.200, hệ số k 0,3 / 6,5, trần 1,46 (sửa phản biện R2).
3. Boss tới Lũy thì đập 3 mạng mỗi 2,5 s (không thua ngay).
4. Thắng thì quái còn lại tan; truyện không có đêm vô tận.
5. Lũy tối đa cấp 3 ở bản đồ 1 truyện.
6. Bán hoàn 60 %, bấm hai lần; không Đổ Nát ở 1B; boss không trừ máu nhà, chỉ làm tê.
7. Tối Thượng ở phím `=`; lông 21 sát thương (sửa phản biện R2, trước 25); boss nhận ×0,25 sát thương Tối Thượng, không bị Cháy của nó.
8. Neo, Phá Khiên chỉ ở hộp cát; Ngắt ở Đêm 4 bản đồ 1.
9. Không túi, bùa, Từ Vàng, Đài Ấn, Bùng Nổ, Lam ở 1B.
10. Nghĩa tiếng Việt: hai lần đầu ở Cân bằng, lần đầu ở Thử thách, luôn ở Thư giãn, Học, trẻ em.
11. Draconis tự đánh Mộc Tinh ×0,5 (Vỏ dày; R1 vòng 1: ×0,35); Cháy từ Phát Chữ ×1,25.
12. Nhánh boss biết từ đầu Ngày 5; boss trồi lên ở ngã ba, không đi từ Khe Nứt.
13. Thua thì chơi lại được từ đầu Ngày của đêm vừa thua.

---

## 25. Phản biện 24/10/2026 (đã sửa trong file)

Người phản biện đóng vai trưởng thiết kế khó tính, đọc spec so với TK, BALANCE.md, BUILD_NOTES §6, mã ở HEAD `61ee44d`, và các yêu cầu của chủ dự án: vui, không chán; chiến thuật có nghĩa; học luôn rõ; chuyển động và hiệu ứng đẹp do AI làm; không quá tải chú ý. Mọi mục cao và vừa đã sửa trong file này; mục thấp sửa luôn vì rẻ.

| # | Mức | Vấn đề | Sửa (mục) |
|---|---|---|---|
| 1 | Cao | **Không gõ vẫn hạ được boss.** Draconis tự đánh 17,5/s phép, boss KP 0. Thả Draconis đuổi boss thì ~1.400 trong ~100 s, cộng tháp ~500, quá 1.600. Đầu dò không thấy vì bot Không gõ để Tướng ở khúc nhập. Vỡ B5 và "gõ là sức chính" với người thật | Vỏ dày: Draconis tự đánh ×0,5 (`BOSS.heroMul`); bot `heroKite` trong B5; đo lại máu (§5.1, §6.3 điểm 7, §6.5 bước 0, §18.1, §18.3) |
| 2 | Cao | **Cổng chặt không đạt được về thống kê.** 78–88 % cho từng bot ở từng bộ 120 seed: sai số ~3,4 điểm, 12 ô cùng đạt ~16 % dù đúng tâm. R1 không xong được, hoặc bị chỉnh cho khớp seed | Đích chặt đo trên hai bộ gộp (240 ván); từng bộ giữ dải BALANCE §3; báo cáo in ba cột (§6.4, §17, §18.2, §18.3, §21) |
| 3 | Cao | **Thua ở boss phải chơi lại 10 phút đầu.** Trái với "vui, không chán". TK 20.5 đã có lưu ván bằng chạy lại lệnh | "Chơi lại Ngày n" ở R1: chạy lại nhật ký tới đầu Ngày n, so mã băm (§2, §4.3, §14, §19, §22) |
| 4 | Cao | **Số Tối Thượng (R2) gấp ~3 lần cổng.** 22 lông × 60 × 0,5 + Cháy: một lần ~660 lên boss, tức ~40 % lượng máu phải gỡ, trong khi G5 ≤ 15 % | Lông 25, boss ×0,25, Cháy của Tối Thượng không lên boss (~9 % một lần); G5 cả ải ≤ 15 % theo BALANCE §9.1 (§8.2, §15, §18.3, §24) |
| 5 | Vừa | **Nhánh boss ngẫu nhiên, chỉ lộ khi boss vào.** Tháp bên nhánh kia vô dụng, Ngày 5 không chuẩn bị theo được: thua "xui", mất chiến thuật | Chọn nhánh lúc báo Ngày 5, vẽ mạch rễ trên nhánh; bot Tốt thêm tháp bên nhánh boss; câu Bà Cú Mực "Dồn tháp lên nhánh rễ sáng" (§4.4, §12, §13.1, §18.1) |
| 6 | Vừa | **Khoảng chờ không.** Đòn đầu trúng boss ở ~41 % đường: ~50 s boss đi mà không gì với tới (Nhàn) ngay đoạn cao trào | Boss trồi ở ngã ba sau vết nứt bò 12 s; cổng G8 (trồi → trúng đầu ≤ 35 s, I đỉnh boss trong dải) (§4.2, §4.4, §5.1, §18.3) |
| 7 | Vừa | **Rễ Trồi không có cách đáp, và dạy sai.** "−30 máu" không có hậu quả (sàn 1, không Đổ Nát); Phát Chữ của nhà tê "chờ hết tê" là gõ xong mà không thấy gì tới 3 s | Chỉ tê, không trừ máu; lời gọi của nhà tê vẫn bắn (TK 22.7); cách đặt tháp xa đường có test dữ liệu giữ nó; choáng xóa tê; bảng "Đòn nào, làm gì" (§2, §5.2, §5.5, §13.1) |
| 8 | Vừa | **Dồn lửa vượt luật chú ý.** "Mọi tháp có lời gọi, sáng cùng lúc" trái trần SÁNG, vòng giúp, ngân sách; cùng lúc dải chữ lớn giữa màn che thẻ chữ | Dồn lửa ≤ trần, trong vòng giúp, gần boss trước; dải chữ dưới thanh boss; luật thứ tự lớp (thẻ chữ trên cùng) và kiểm ở `td-1b-boss` (§5.2, §13.1, §19) |
| 9 | Vừa | **Lặng tắt cả Bắn mạnh** khi quái phần đầu (Thuồng Luồng, 3 mạng mỗi con) còn sống theo nhánh 30 s: mất mạng mà không được gõ | Lặng chỉ chặn lời gọi kinh tế, Hỏi bài (§4.4, §5.5) |
| 10 | Vừa | **Lịch mở ở R3** đổi kinh tế sau khi R1, R2 đã cân bằng: phải chỉnh lại hết | Lịch mở ở R1, bot theo từ R1 (§2, §12, §17, §18.1, §23) |
| 11 | Vừa | **Boss không được dạy ở R1** mà chủ dự án chơi R1 | Hai hàng boss của bảng dạy làm ở R1 (§12, §16) |
| 12 | Vừa | **Đà và nảy của boss để R2**, trong khi chủ dự án chơi R1 và đã từng loại bản không thấy hiệu ứng | Đà trước đòn, nảy sau đòn, nhún bước, trồi lên ở R1 (§13.1, §16) |
| 13 | Vừa | **G3 không có núm.** Máu chỉnh theo tỉ lệ thắng; ở 1.600 giao chiến dự kiến < 45 s | Chỉnh tốc boss trước, máu theo sau (§6.5 bước 1, §18.3) |
| 14 | Vừa | **Trần dòng R1 không chứa các món trên** | R1 ≤ 8.850, R2 ≤ 10.000, 1B giữ 10.500 (§16, §21) |
| 15 | Thấp | Chơi thử phải mở bảng điều khiển gõ `copy(...)` | Nút "Chép số chơi thử" ở màn kết (§14, §22) |
| 16 | Thấp | Gợi ý thua là một câu cố định | Chọn theo số của ván (BALANCE §4.3) (§13.1) |
| 17 | Thấp | Học ít thấy ở R1 | Màn kết có "Từ cần ôn" (5 từ, kèm nghĩa) (§4.3) |
| 18 | Thấp | Thưởng lúc rút (Mảnh Chữ) vô dụng vì ải đã hết | Bỏ Mảnh Chữ lúc rút; rương chỉ hiện ở màn kết (§5.1, §8.1, §15) |
| 19 | Thấp | Ngày 3 mở ba thứ trong khi "tối đa 2 ý" | ≤ 2 câu tự hiện; nhà khác chỉ có dòng "làm gì" trên thẻ (§12) |
| 20 | Thấp | Hộp cát "lặp Đêm 4" là luật mới không cần | Giữ đợt 6 và luật lặp hiện có (§4.1) |
| 21 | Thấp | Mã hiện từ chối `upgrade` cho id 0; `sell` vừa là hoàn tác vừa là bán | Ghi rõ ở §7 |

**Còn mở cho R1** (cần số đo, không sửa được trên giấy): máu boss sau Vỏ dày và Rễ Trồi; Biên S lệch giữa Mới (7 mạng sau phần đầu Đêm 5) và Chậm chắc (16); `heroKite` có thật thua ở Cân bằng không; G8 với vị trí tháp của bot Kém.

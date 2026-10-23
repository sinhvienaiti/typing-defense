# Bước 1B "Mộc Tinh tới làng": đặc tả thực thi (24/10/2026)

> **Dành cho:** AI làm code, AI phản biện, chủ dự án.
> **Nguồn:** `TYPING_DEFENSE_DESIGN.md` (TK) §26.1 (hàng 1B) và các mục nó trỏ tới: §7.6, §8.6, §9, §11.12, §12, §17.4, §18.6–18.9, §19.7, §20.2, §20.4, §21, §22.6–22.10, §23.8; `BUILD_NOW.md` §9; `CALLS_V3_1_PLAN.md`; `BUILD_1A6.md`; `BUILD_NOTES.md` §5–§6; `docs/games/BALANCE.md` (repo cha) §3, §7, §9.2.
> **Thứ tự tin:** mã hiện tại > file này > `BUILD_1A6.md` > `CALLS_V3_1_PLAN.md` > TK. Chỗ nào file này khác TK, lý do ở §2.
> **Nền:** repo `games/typing-defense`, nhánh `main`, HEAD `33b9905` (cân bằng vòng 2). Đường dẫn tính từ gốc repo này.
> **Số là số khởi điểm.** Bot chỉnh số trong `src/content/rules.ts` và `src/content/slice-1a.ts`, không sửa luật trong mã.

---

## 0. Mục tiêu

**Một câu:** biến hộp cát 1A.6 thành **bản đồ 1 chơi trọn vẹn** (5 Ngày, 5 Đêm), kết bằng **Mộc Tinh nhỏ** có báo trước ở cuối Đêm 5, để người giữ làng tốt thắng mà còn nhiều mạng, người giữ làng yếu thua rõ ràng; cùng lúc đưa vào các món 1B còn hợp với mô hình lời gọi.

**Chủ dự án làm được ở cuối 1B:**

- Từ màn đầu bấm "Bắt đầu" là vào bản đồ 1 Đồng Cỏ Thác Bạc, chơi từ Ngày 1 tới khi Mộc Tinh rút lui (thắng) hoặc Lũy mất hết mạng (thua). Màn kết có sao.
- Thấy Mộc Tinh được báo từ đầu Ngày 5, đếm ngược ở Đêm 5, rồi thấy rõ từng đòn: vòng báo Rễ Trồi dưới nhà, nhà bị tê, cú choáng ở 70 % máu, Mầm Gỗ mọc, rút lui ở 50 %.
- Nâng Lũy bằng tiền thật để mở Chấm, Phẩy; nâng nhà và **bán nhà** (60 %).
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
| Quái | Cương Thi 35 máu; Ma Trơi 60 máu, KP 60 %, lọt 1; Thuồng Luồng 365 máu, giáp 60 %, lọt 3, toán 6 | Thêm Mộc Tinh, Mầm Gỗ (R1), Tanuki, Nuppeppō (R2), Troll, Đầu Đàn (R3) |
| Nhà | Máu có trong dữ liệu nhưng **không gì gây hại nhà**. Nâng cấp có giá (Vàng + 30 % Gỗ, giá cộng dồn TK 12.2). "Bán" chỉ là hoàn tác 5 s | Boss gây hại và làm tê nhà; bán 60 % |
| Lũy | Cấp 1–4 chỉ qua hộp cát; cấp Lũy mở người (1 + số Thư Đồng) và thợ xây | Nâng Lũy bằng lệnh thật, qua thợ xây |
| Lời gọi | `calls.ts`, `attention.ts`: 6 loại (Bắn mạnh, Xây, Gặt, Chặt, Đào, Hỏi bài); trần SÁNG theo chế độ; ngân sách gõ giữ **từng từ**, nhìn trước (BUILD_NOTES §5.4) | Thêm loại `ult`, `direct` (R2); boss dùng Bắn mạnh có sẵn |
| Gõ | Chấm Chớp / Hoàn hảo / Tốt / Vừa / Ẩu; từ Ẩu ×0,6 việc; Chuỗi; Phát Chữ ×9 (vòng 1 cân bằng); Cháy của Draconis 55/s khi Phát Chữ của Pháo trong vòng Tướng | Cháy ×1,25 lên Mộc Tinh |
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
| Đổ Nát, lời gọi Sửa | **Để VS** | — | Ở 1B chỉ Mộc Tinh làm hại nhà, mỗi lần 30 máu, nhà 200–540 máu; máu sàn 1 (§5.5) |

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
| Bảng dạy (§12) | Có (R3) | Bỏ qua, mọi thứ mở |
| Hết ải | Thắng hoặc thua: sim dừng, màn kết | Như truyện |

- Danh sách đợt của ải có 5 đợt. Đợt 6 trở đi chỉ có khi hộp cát bấm "Sinh đêm" thêm trong lúc Đêm 5 chưa xong: lặp Đêm 4, tăng 15 % mỗi đợt, không boss. Truyện không có đêm vô tận.
- Chế độ (Thư giãn, Cân bằng, Thử thách, Học) chọn ở Cài đặt (R3); trước R3 truyện chạy Cân bằng, `?learn=1` chạy Học.

### 4.2 Thành phần các Đêm

| Đêm | R1 (chỉ đổi Đêm 5) | R2 (thêm quái mới, cân bằng lại) | Ý mới (bảng dạy §12) |
|---|---|---|---|
| 1 | 8 Cương Thi | như R1 | Lời gọi Bắn mạnh |
| 2 | 10 Cương Thi, 1 Ma Trơi | như R1 | Quái bay |
| 3 | 12 Cương Thi, 2 Ma Trơi | 8 Cương Thi, 3 Nuppeppō, 2 Ma Trơi | Pháo khắc Nuppeppō; Tối Thượng |
| 4 | 1 Thuồng Luồng, 10 Cương Thi | 1 Thuồng Luồng, 7 Cương Thi, 2 Tanuki | Ngắt |
| 5, phần đầu | **5 Thuồng Luồng (một toán 5)**, 7 Cương Thi, 3 Ma Trơi | như R1, chỉnh theo bot | — |
| 5, đỉnh boss | Lặng 12 s → Mộc Tinh + 2 toán × 4 Cương Thi đi trước 3 s; pha 2 gọi Mầm Gỗ | như R1 | Mộc Tinh |

- Đêm 5 phần đầu nhẹ hơn hiện nay (7 Thuồng Luồng, toán 6). Lý do và số đo ở §6.3: Thuồng Luồng toán lớn giờ là việc của **Biên S**, còn việc quyết thắng thua chuyển sang boss.

### 4.3 Thắng, thua, sao

- **Thắng:** Mộc Tinh rút lui (§5.4). Mọi quái còn trên sân tan thành mực (không vàng, không lọt). Pha `victory`, sim dừng.
- **Thua:** mạng Lũy về 0 (như nay), pha `defeat`.
- **Sao** (TK 20.2): thắng với 18–20 mạng: 3 sao; 6–17: 2 sao; 1–5: 1 sao. Màn kết in sao, mạng, quái hạ, từ gõ, lời gọi Hoàn hảo, Tri thức. Lưu sao tốt nhất ở `td.campaign` (R3; R1 chỉ hiện).
- Bot và FlowMeter: thắng là `won`, S = mạng còn / 20 lúc kết ải (thua tính 0), như BALANCE §3.

### 4.4 Báo trước đỉnh boss (dòng thời gian)

| Lúc | Sim | Người chơi thấy, nghe |
|---|---|---|
| Đầu Ngày 5 | Sự kiện `bossWarn` (`day`) | Dải mực trên HUD: "Đêm nay Mộc Tinh thức dậy". Chip "Đêm 5 · Boss". Một tiếng gỗ trầm |
| Đầu Đêm 5 | Phần đầu Đêm 5 sinh như mọi đợt | Thanh boss mờ trên HUD, chưa có máu: "Mộc Tinh · đang ngủ" |
| Phần đầu sinh xong và còn ≤ 2 quái của nó sống, hoặc 30 s sau lần sinh cuối | **Lặng trước bão 12 s:** không lời gọi mới nào SÁNG (lời gọi đang sáng giữ nguyên); bộ điều nhịp Đêm đứng yên từ đây tới hết ải | Đếm ngược "Mộc Tinh tới sau 12 s"; đất rung nhẹ (rung màn hình ≤ 2 px, tắt khi giảm chuyển động); vết nứt chạy dọc đường từ Khe Nứt |
| Hết lặng | 2 toán Cương Thi rồi Mộc Tinh vào ở Khe Nứt, đường do luồng `spawn` chọn | Gầm; thanh boss đầy máu, vạch 70 % và 50 % ("rút lui"); đường boss sẽ đi sáng mạch rễ mờ; "còn 116 m tới Lũy" |
| Mộc Tinh đi | Đòn, pha theo §5.2 | Mỗi đòn có báo trước (§13.1) |

---

## 5. Mộc Tinh nhỏ (`moc-tinh`)

### 5.1 Chỉ số

| Thứ | Số khởi điểm | Ghi chú |
|---|---|---|
| Máu | **3.200** × máu chế độ × hệ số k (§5.6) | TK 22.7 ghi 4.000; số đo §6.3 cho thấy khoảng 3.000–3.400 mới cho bot Chuẩn thắng ~85 %. R1 chỉnh theo §6.5 |
| Rút lui | Ở 50 % máu | Lượng máu phải gỡ: 1.600 ở Cân bằng, k = 1 |
| Giáp / KP | 30 % / 0 % | |
| Tốc | 0,9 m/s × tốc quái của ải (`foeSpeed`) | Đi hết đường ~130 s; tới khúc nhập (≈ 67 % đường) sau ~85 s |
| Chặn | **Không bị chặn.** Lính vẫn đánh được, bị Quật cành đẩy lùi | Lệch luật chặn chung: cờ `unblockable` |
| Bán kính | 2,5 m | Vẽ ~5 m bề ngang ở bản 2D |
| Điểm yếu | Cháy gây ×1,25 | Phát Chữ của Pháo khi Draconis trong vòng: gõ là cách trị chính |
| Chống chịu | Làm chậm tối đa 30 %; không bị choáng ngoài cú choáng của chính nó; không bao giờ là tinh anh | TK 18.9 |
| Lọt | Không lọt: tới Lũy thì đập Lũy (§5.3) | |
| Thưởng | Rương 150 Vàng (ghi ngay lúc rút), 10 Mảnh Chữ (R2) | TK 22.7 |

### 5.2 Pha và đòn

| Pha | Máu | Đòn (theo thứ tự ưu tiên trong một tick) |
|---|---|---|
| Pha 1 | 100 → 70 % | **Rễ Trồi** mỗi 12 s (lần đầu 6 s sau khi có nhà trong tầm): mọi nhà (trừ Lũy) có mép trong 8 m quanh tâm boss bị nhắm; báo **1,5 s** (Thư giãn, Học 2,0 s; Thử thách 1,2 s); hết báo: nhà −30 máu (sàn 1) và **tê 3 s**. Không có nhà trong 8 m thì bỏ lượt, đồng hồ vẫn chạy. **Quật cành** mỗi 2,5 s khi có lính trong 3 m quanh mép boss: báo 1,2 s (Thư giãn, Học 1,6 s; Thử thách 1,0 s), 40–60 sát thương vật lý lên mọi lính trong vùng (giáp lính tính), đẩy lùi 1,5 m; nhà trong vùng nhận ×0,5 |
| Chuyển pha | 70 % | **Choáng 5 s:** boss đứng yên, không đòn, không Rễ Trồi. **Dễ Tổn Thương:** nhận ×1,25 sát thương trong 5 s. **Dồn lửa:** mọi nhà đánh (tháp, Lũy) có boss trong tầm + 2 m mà chưa có lời gọi thì có ngay một lời gọi Bắn mạnh, bỏ qua thời gian hồi, sống 5 s. Không cửa sổ ấn ở bản đồ 1 (TK 18.7) |
| Pha 2 | 70 → 50 % | Như pha 1, thêm **Gọi Mầm Gỗ:** mỗi 15 s (lần đầu 3 s sau choáng) 4 Mầm Gỗ mọc ở chân boss, báo 0,8 s (4 mầm xanh nhú), rồi đi tiếp đường của boss từ chỗ đó |
| Rút lui | ≤ 50 % | Boss ngừng mọi thứ, không nhận đòn, chìm xuống đất trong 2 s. Rương 150 Vàng ghi ngay. Hết 2 s: quái còn lại tan, pha `victory` |

- Sát thương dồn qua mốc: một đòn đưa máu qua 70 % thì choáng ngay; qua cả 50 % thì rút lui ngay (không choáng).
- Mọi đòn của boss dùng luồng `combat` cho số sát thương, `spawn` cho chỗ Mầm Gỗ mọc lệch ngang. Thứ tự nhà bị nhắm: theo id tăng dần.

### 5.3 Tới Lũy

- Khi boss tới cách cuối đường 1,5 m: dừng lại, **Quật Lũy** mỗi 2,5 s, báo 1,2 s, **−3 mạng** mỗi đòn, tới khi boss rút hoặc Lũy hết mạng.
- Ở đó chỉ nỏ Lũy, tháp gần Lũy và Tướng còn đánh được, nên thường là thua: 10 mạng chịu được 4 đòn, khoảng 10 s. Đây là "thua rõ ràng" có báo trước, không phải mất mạng âm thầm; vẫn có khoảnh khắc gần thua (N) khi boss chỉ còn thiếu một chút.

### 5.4 Rút lui và rương

- Rút lui đếm là một lần hạ boss (`STAT.bossRetreats`), sự kiện `bossRetreat`, rồi `victory`.
- Rương: +150 Vàng vào kho ngay tick rút (TK 17.4: ghi sổ ngay, đồng bay chỉ là hình). Mảnh Chữ: +10 nếu Draconis trong 12 m (R2).
- Thoại (hiện chữ, chưa có giọng): vào trận "Tên ta ở đâu?"; Rễ Trồi lần đầu "Rễ ơi, mọc lên!"; choáng "Cái tên đó... quen quá..."; rút "À... ta nhớ rồi." (TK 22.7).

### 5.5 Gắn với luật cũ

| Luật cũ | Với boss |
|---|---|
| Nhà có máu | Chỉ Rễ Trồi và Quật cành làm mất máu. **Máu sàn 1**, không Đổ Nát ở 1B. Bình minh hồi đầy (chỉ có ý nghĩa ở hộp cát) |
| Nhà **tê** | Không bắn, không tạo lời gọi Bắn mạnh, không sản xuất (Mỏ, Ruộng ngừng tiến độ). Lời gọi đang có vẫn gõ được, nhưng Phát Chữ của nhà đang tê **chờ tới hết tê** mới bắn |
| Bộ điều nhịp (BALANCE §4.2) | Đứng yên từ lúc lặng trước bão tới hết ải (đỉnh boss là kịch bản, không cao su). FlowMeter vẫn đo |
| Tinh anh | Không bao giờ gắn vào boss, Mầm Gỗ, toán đi trước |
| Rơi hỗ trợ +2 mạng | Không ở đỉnh boss (bộ điều nhịp đã dừng) |
| FlowMeter: nguy hiểm | Thêm: đang có một vòng báo Rễ Trồi, Quật cành hay Quật Lũy ("đòn lớn đang báo", BALANCE §3 P) |
| Ngân sách chú ý | Lặng 12 s: không lời gọi mới nào SÁNG. Dồn lửa và Bắn mạnh vẫn qua kiểm "vừa ngân sách" từng từ |
| Phát Chữ, Cháy | Cháy lên boss ×1,25. Dễ Tổn Thương nhân cả Phát Chữ và Cháy |
| Thư Đồng | R2: Thư Đồng đứng trong 6 m quanh một nhà trúng Rễ Trồi thì **hoảng**: chạy về Lũy, đứng 5 s, rồi làm tiếp lệnh cũ; khi hoảng vòng giúp không thắp lời gọi |

### 5.6 Máu boss theo nhịp k

```
máu = round(3200 × hpMul(chế độ) × (1 + 0,4 × max(0; k − 1)))
```

- Số đo §6.3: bot Nhanh (k 1,3) gây lên boss nhiều hơn bot Chuẩn ~15 %; bot Mới (k 0,75) gây gần bằng bot Chuẩn vì boss của nó đi chậm hơn. Vì vậy chỉ nâng máu khi k > 1. Hệ số 0,4 và mức trần ×1,12 là số khởi điểm; nếu một phía k lệch dải sau R1 thì chỉnh `BOSS.kHp`, không thêm luật riêng cho từng bot.
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

### 6.4 Đích

| Chế độ | Bot | Thắng | Biên S |
|---|---|---|---|
| Cân bằng | Mới, Chậm chắc, Chuẩn, Khá, Ẩu, Nhanh, **từng bot, cả hai bộ seed** | **78–88 %** | **40–60 %** |
| Cân bằng | Không gõ | 0 % (B5) | — |
| Cân bằng | Chuẩn Tốt − Chuẩn Kém | ≥ 10 điểm % (B6) | — |
| Thư giãn | Mới tới Nhanh | ≥ 92 % | ≥ 70 % |
| Thư giãn | Trẻ em | ≥ 85 % (B3) | báo cáo (≥ 70 % là đích, hiện 50 %) |
| Thử thách | Mới tới Nhanh | 50–75 % | 15–45 % |

- Cùng lúc giữ các dải còn lại của BALANCE §3 (P, I, O, N, Q) ở từng chế độ (bảng §18.3).
- B4: S của Chậm chắc > S của Ẩu; bot Chuẩn hạ quái nhanh hơn bot Ẩu (hạ boss cũng vậy).

### 6.5 Thứ tự chỉnh ở R1 (chỉ dữ liệu)

1. **Máu boss** (`BOSS.hp`): chia đôi khoảng cho tới khi bot Chuẩn hạ được boss ở 86–90 % số ván tới boss (ván chết trước boss ~1–3 %), tức thắng ~85 %.
2. **Phần đầu Đêm 5** (số Thuồng Luồng 4–6, cỡ toán): tới khi S trung vị bot Chuẩn ≈ 50 %.
3. **Đỉnh boss** (toán đi trước 0–2 × 4, Mầm Gỗ 3–5 mỗi lần, khoảng 12–18 s): kéo đuôi S của ván yếu xuống, không chạm trung vị.
4. **Nhịp k của boss** (`BOSS.kHp` 0–0,6): chỉ khi Khá, Nhanh lệch dải thắng.
5. **Máu Thuồng Luồng** (325–385) hoặc Cháy của Draconis (45–65/s): khi Mới, Ẩu (S thấp) và Chậm chắc (S cao) cách nhau quá dải, vì Thuồng Luồng giáp 60 % là chỗ độ chính xác và Phát Chữ quyết.
6. Sau mỗi lần đổi: `pnpm td:balance` đủ hai bộ seed × 120. Không đạt sau 6 vòng chỉnh thì ghi lại bảng và quyết định thiết kế cần có vào `BUILD_NOTES.md` §7, không ép bằng một số toàn cục.

---

## 7. Nâng cấp, bán, Lũy (R1)

| Việc | Luật | Số |
|---|---|---|
| Nâng nhà | Như 1A.6: giá bậc = giá cộng dồn cấp sau − cấp này, cắt 30 % sang Gỗ; thợ xây làm trong 0,75 × thời gian xây khuôn; lời gọi Xây 3 từ; nhà vẫn chạy ở cấp cũ | Tháp Cung 63 + 27, 91 + 39; Pháo 84 + 36, 112 + 48 … (bảng `costs` hiện có) |
| **Nâng Lũy** | Lệnh `upgrade` cho Lũy (id 0) ở truyện; qua thợ xây như nâng nhà (khuôn XL: 0,75 × 18 s = 13,5 s; ban Đêm ×1,5), lời gọi Xây 3 từ; Lũy vẫn bắn. Xong thì mở thêm một người và một thợ xây (như nút hộp cát) | Cấp 2: 105 Vàng + 45 Gỗ; cấp 3: 182 + 78 (TK 0.3: 150 / 260 + 40 Gỗ cắt theo 1A.6). Truyện tối đa cấp 3 (`STAGE.keepMax`) |
| **Bán** | Nhà đã xong, quá 5 s hoàn tác: hoàn **60 %** số Vàng và Gỗ đã chi cho nhà đó (cả các lần nâng; lần nâng đang làm cũng tính), làm tròn xuống. Bấm hai lần (lần một hiện "Bán · +N vàng, +M gỗ", lần hai trong 3 s mới gửi lệnh). Lũy không bán được | 60 % (TK 11.12) |
| Hoàn tác | Giữ như 1A.6: trong 5 s hoàn đủ | — |
| Bán khi tê | Được (không khác) | — |

- Nhà giữ tổng đã chi (`spentGold`, `spentWood`) thay cho số của lần cuối.
- **Test thuộc tính:** không chuỗi xây, nâng, bán, hoàn tác nào làm Vàng hoặc Gỗ cao hơn lúc chưa làm gì (TK 11.12).
- HUD: thẻ nhà có nút Bán với số tiền; thẻ Lũy có nút "Nâng Lũy · 105 vàng, 45 gỗ" và dòng "Mở: Chấm".

---

## 8. Tối Thượng, Mảnh Chữ, Chữ Chiêu (R2)

### 8.1 Nạp (0–100, TK 8.6 đổi theo lời gọi)

| Nguồn | Điểm |
|---|---|
| Mỗi từ của lời gọi gõ xong (mọi loại) | +1,2 × (0,5 + 0,5 × Q) |
| Gõ trực tiếp thành công | +3 |
| Mảnh Chữ: quái chết trong 12 m quanh Draconis | +0,6 mỗi mảnh (bầy 0,5 mảnh, nhỏ 1, vừa 2, nặng 3; boss choáng 6, rút 10) |
| Ban Đêm, mỗi giây | +0,3 |

- Không nạp khi đã đầy. Đầu ải 0. Hồi tối thiểu 45 s giữa hai lần dùng. Giữ điểm qua Ngày.
- Đích (báo cáo, không là cổng): bot Chuẩn dùng 2–3 lần mỗi ải; bot Không gõ ≤ 1.

### 8.2 Dùng

- Phím **`=`** (Equal; không bị Telex, VNI dùng) hoặc nút trên HUD. Lệnh `ult` mang điểm đặt (`qx`, `qz`): chuột đang trên bản đồ và trong 20 m quanh Draconis thì lấy điểm chuột; không thì app chọn điểm có nhiều máu quái nhất trong 6 m, trong vòng 14 m quanh Draconis (tính từ trạng thái thế giới, ghi vào lệnh nên vẫn tất định). Ngoài 20 m: lệnh bị từ chối (`ultFar`).
- **Mưa Lông Lửa** (TK 22.2): vùng bán kính 6 m, 12 lông trong 2 s (mỗi 10 tick một lông). Mỗi lông nhắm quái còn nhiều máu nhất trong vùng chưa bị lông này nhắm (xoay vòng; không còn quái thì rơi vào điểm đặt), nổ 1,5 m, 60 sát thương phép. Hết mưa: quái còn trong vùng bị Cháy 3 s (luật Cháy hiện có).
- Boss nhận **×0,5** sát thương Tối Thượng. Cổng: Tối Thượng ≤ 15 % sát thương lên boss và ≤ 10 % sát thương cả ải (theo BALANCE §9.1 cho kỹ năng vùng).

### 8.3 Chữ Chiêu là một lời gọi

| | Luật |
|---|---|
| Loại | `ult`, bậc 0 trong hàng ưu tiên (cùng Bắn mạnh, gõ trực tiếp) |
| Từ | 3 từ, mỗi lần một từ; từ ngắn (nửa dưới dải độ dài như Bắn mạnh), chỉ từ đã thuộc (cấp ≤ cấp ván − 1; cấp 1 thì cấp 1); không bao giờ là từ mới |
| Đời | Cả lời gọi sống 4 s từ lúc dùng Tối Thượng; từ kế hiện ngay khi từ trước xong |
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
- Đích (báo cáo): 5–10 % số từ của ải là từ trực tiếp (TK 9.1); trung bình một lời gọi mỗi 25–40 s ở đêm có quái đó.

### 9.2 Ba động từ

| Động từ | Quái | Bắt đầu khi | Thành công | Bỏ qua | Ở đâu |
|---|---|---|---|---|---|
| **Ngắt** | Lửng Tanuki | Có ≥ 3 quái khác trong 6 m, hồi 12 s đã qua: đứng lại đánh Trống Bụng Lớn trong T | Hủy trống, Tanuki choáng 2 s, +5 Vàng (Lá Tanuki) | Hết T: quái trong 6 m (cả nó) hồi 25 % máu tối đa | Bản đồ 1 Đêm 4 (R2) |
| **Neo** | Cương Thi Đầu Đàn | Bầy ≥ 4 trong 6 m và cách một nhà < 20 m (hồi 15 s) | Bầy trong 6 m đứng sững 3 s; Đầu Đàn nhận +30 % sát thương 6 s | Bầy đi tiếp (hào quang +20 % tốc trong 6 m luôn có) | Hộp cát (R3) |
| **Phá Khiên** | Quỷ Núi Troll | Cách một nhà đánh < 25 m (hồi 6 s sau khi vòm tắt): dựng Vòm Đá 4 m trong T | Vòm vỡ, Troll choáng 1,5 s, không dựng lại 10 s | Vòm giữ T giây: đạn từ ngoài vòm vào quái trong vòm −70 % | Hộp cát (R3) |

### 9.3 Ngân sách chú ý

- Đêm hiện chỉ gõ 20–23 % thời gian (bot Chuẩn, BUILD_NOTES §6.10), ngân sách là 8 s mỗi 20 s (40 %). Một từ trực tiếp ~1,7 s ở 35 WPM: vừa.
- Đích tỉ lệ gõ (báo cáo): Đêm 1–4: 15–25 % (giữ cổng 5c của BUILD_1A6 §12); **Đêm 5 (boss): ≤ 35 %**. Mọi cửa sổ 20 s ≤ 8 s ở Cân bằng là cổng cứng như cũ. Đêm 1–4 vượt 25 % thì hạ tần suất (hồi của cơ chế) trước khi nới cổng.

---

## 10. Quái mới

| id | Tên | Đợt | Bậc | Máu | Giáp / KP | Tốc | Lọt | Vàng | Chặn | Toán | Khác |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `moc-tinh` | Mộc Tinh | R1 | `boss` (mới) | 3.200 (§5.6) | 30 / 0 | 0,9 | 0 | 0 (rương 150) | không bị chặn | 1 | §5 |
| `mam-go` | Mầm Gỗ | R1 | bầy | 40 | 0 / 0 | 3,0 | 1 | 1 | 1 | 4 | Chỉ do boss gọi |
| `tanuki` | Lửng Tanuki | R2 | nhỏ | 110 | 0 / 30 | 2,4 | 1 | 12 | 1 | 1 | Ngắt |
| `nuppeppo` | Nuppeppō | R2 | nhỏ | 90 | 0 / 0 | 2,6 | 1 | 6 | 1 | 3 | Chết vì sát thương không nổ thì tách 2 con |
| `nuppeppo-con` | Nuppeppō con | R2 | bầy | 30 | 0 / 0 | 4,0 | 1 | 2 | 1 | 2 | — |
| `cuong-thi-lead` | Cương Thi Đầu Đàn | R3 | vừa | 160 | 30 / 0 | 3,4 | 2 | 25 | 1 | 1 | Neo; hộp cát |
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

---

## 12. Bảng dạy bản đồ 1 (R3)

Một bảng duy nhất (TK 20.4 đổi theo Lời Gọi). Mỗi ý mới một câu của Bà Cú Mực (≤ 14 từ) và một chip mẹo (≤ 8 từ). Mỗi Ngày, Đêm tối đa 2 ý. Hộp cát bỏ qua bảng.

| Khi | Mở | Câu Bà Cú Mực | Chip |
|---|---|---|---|
| Ngày 1 | Ruộng, lời gọi Gặt; vòng giúp của Tướng | "Lúa chín thì bác nông dân gọi. Đưa Draconis tới, gõ chữ trên bong bóng." | "Gõ chữ đầu để bắt đầu · Esc để thôi" |
| Đêm 1 | Tháp Cung; lời gọi Bắn mạnh | "Đêm xuống, tháp gọi khi quái tới gần. Gõ là bắn Phát Chữ." | "Bỏ qua lời gọi không mất gì" |
| Ngày 2 | Chặt cây, dân, Gỗ; Trại Lính | "Gỗ để xây nhà. Bấm cây để đánh dấu chặt." | "Shift + \\ thuê dân" |
| Đêm 2 | Ma Trơi bay | "Ma Trơi bay qua đầu lính. Tháp Cung và Draconis bắn được." | — |
| Ngày 3 | Mỏ Vàng, lời gọi Đào; Lũy cấp 2 mở Chấm | "Nâng Lũy thì Chấm ra giúp. Thư Đồng làm việc nhanh hơn." | "1–4 chọn người · Enter gửi đi" |
| Đêm 3 | Tháp Pháo và Nuppeppō; Tối Thượng, Chữ Chiêu | "Lông lửa đầy rồi! Bấm = rồi gõ thêm chữ cho mưa to hơn." | "= Tối Thượng" |
| Ngày 4 | Nâng cấp nhà; bán nhà | "Nhà cấp 2 mạnh hơn. Bán lại được sáu phần mười." | "Bán: bấm hai lần" |
| Đêm 4 | Tanuki và Ngắt | "Tanuki đánh trống hồi máu. Gõ chữ trên đầu nó để Ngắt." | "Chữ trên quái: gõ để phá chiêu" |
| Ngày 5 | Lũy cấp 3 mở Phẩy; báo Mộc Tinh | "Đêm nay Mộc Tinh thức dậy. Dồn tháp ở khúc nhập." | "Boss rút ở 50 % máu" |
| Đêm 5 | Mộc Tinh: Rễ Trồi, choáng, rút lui | "Rễ trồi dưới nhà! Nhà bị tê 3 giây. Lúc nó choáng, gõ thật nhanh!" | "Choáng: Bắn mạnh không cần chờ" |

- **Mở theo ngày** (dữ liệu `STAGE.unlock`, vào mã băm): Trại Lính từ Ngày 2; Mỏ, Tháp Pháo, Lũy cấp 2 từ Ngày 3; nâng cấp nhà từ Ngày 4; Lũy cấp 3 từ Ngày 5. Nút còn khóa hiện lý do ("Mở ở Ngày 3"). Tối Thượng nạp từ đầu nhưng chỉ dùng được từ Đêm 3.
- Kế hoạch bot theo cùng lịch mở (§18.1), nên R3 phải cân bằng lại.
- Câu chữ ở `src/ui/tips.ts` (chỉ view); lịch mở ở dữ liệu luật.

---

## 13. Hình và tiếng ở bản vẽ 2D

Bản vẽ 2D Văn Điền giữ nguyên (thế giới 3D chờ model Tripo). Chuyển động và hiệu ứng là việc của AI. Mọi màu là token của `src/ui/theme.css`, bảng màu bản đồ ở `COLOR` của `src/view/debug-2d.ts`; thêm token `--vd-boss` (hổ phách mắt boss), `--vd-root` (nâu rễ), `--vd-warn` (đỏ son báo đòn).

### 13.1 Mộc Tinh (R1: rõ; R2: đẹp)

| Thứ | R1 (phải có để chơi được) | R2 (đánh bóng) |
|---|---|---|
| Thân | Hình giữ chỗ: tán tròn nhiều lớp nét mực, hai mắt hổ phách, rễ chân (đường cong) đung đưa theo bước; to ~5 m; vòng hổ phách mờ dưới chân | Bước đi có lún và nhún (squash 4 %), tán lắc trễ nhịp, lá rơi khi đi |
| Báo Rễ Trồi | Dưới mỗi nhà bị nhắm: vòng son đỏ có sọc, vạch quét theo chiều kim đồng hồ đúng thời gian báo; vết nứt chạy từ chân boss tới nhà | Đất phồng nhẹ ở 0,3 s cuối |
| Rễ Trồi trúng | 5–7 gai rễ bật lên (nét nâu, mọc 120 ms, tan 400 ms), bụi, nhà rung 150 ms, số "−30"; biểu tượng **tê** (vòng xám + chữ "Tê 3 s" đếm lùi), vòng tầm của tháp chuyển xám | Mảnh gỗ, khói ngắn; tiếng gỗ gãy |
| Báo Quật cành | Cung đỏ 120° trước boss, đậm dần 1,2 s | Boss ngả ra sau (đà) |
| Quật cành trúng | Vệt cung quét, lính bị hất (lùi 1,5 m có vệt bụi) | Lóe trắng 60 ms ở lính |
| Choáng 70 % | Boss nghiêng, sao quay, vòng "Dễ Tổn Thương 5 s" đếm lùi quanh boss; dải chữ lớn giữa màn "Mộc Tinh choáng!" 1,2 s; trời ngả hổ phách 20 %; lời gọi Dồn lửa sáng cùng lúc | Sóng vỡ vỏ cây bung ra |
| Gọi Mầm Gỗ | 4 mầm xanh nhú 0,8 s rồi bật thành Mầm Gỗ | Đất tơi bắn lên |
| Trúng đòn | Lóe trắng 60 ms; vụn gỗ (4–6 hạt); thanh máu có phần "máu ma" trắng tụt theo sau 0,4 s; Phát Chữ hiện số lớn xanh ngọc; đang Cháy thì lửa nhỏ trên tán và nhãn "Cháy ×1,25" | Lóe theo cỡ đòn; rung boss 1–2 px |
| Quật Lũy | Cung đỏ trên Lũy 1,2 s; trúng: Lũy rung, chip Mạng nháy đỏ "−3" | Mảnh đá Lũy văng |
| Rút lui | Chìm dần 2 s, vòng bụi, lá rơi, câu "À... ta nhớ rồi."; rương bật, đồng bay về ô Vàng "+150" | Ánh sáng tán tắt từ ngoài vào |
| HUD | Thanh boss ở đỉnh giữa: máu, vạch 70 % và 50 % ("rút lui"), pha hiện tại, "còn N m tới Lũy"; khi lặng: đếm ngược | Thanh máu rung khi trúng đòn lớn |

- Mầm Gỗ: chấm xanh lá có hai lá, đi lắc. Chết: héo rũ (thu nhỏ, ngả nâu, 300 ms).
- Giảm chuyển động (`prefers-reduced-motion`): bỏ rung màn hình, rung nhà, rung thanh máu; giữ mọi vòng báo.
- Thắng: màn kết giấy dó "Giữ được làng" + sao đóng dấu son lần lượt; thua: "Lũy đã vỡ" + dòng gợi ý ngắn ("Mộc Tinh qua khúc nhập: thêm tháp gần Lũy, hoặc gõ Bắn mạnh lúc nó choáng").

### 13.2 Tiếng (tổng hợp bằng mã, `src/view/audio-min.ts`, `folk.ts`)

| Lúc | Tiếng |
|---|---|
| Báo Ngày 5 | Gỗ trầm hai nhịp |
| Lặng trước bão | Tiếng ù thấp lớn dần 12 s, trống trầm mỗi 3 s |
| Boss vào, chuyển pha | Gầm (ồn lọc thấp + quét tần số xuống) |
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
| `=` hoặc nút | Tối Thượng ở điểm chuột hay chỗ đông quái | R2 |
| Cài đặt: Chế độ | Thư giãn, Cân bằng, Thử thách, Học (lưu ở `td.settings`, áp dụng ván sau) | R3 |
| Hộp cát | `boss` (gọi Mộc Tinh ngay), `skipTo` (sang Ngày n của ải, đợt đã qua tính là xong), `spawn` (quái, số con), `ult` (nạp đầy) | R1 (`boss`, `skipTo`), R2 (`spawn`, `ult`) |

- Phím `-` vẫn trống (để dành cho 1C). Không phím chữ cái nào là lệnh.

---

## 15. Dữ liệu

```ts
// src/content/types.ts (thêm)
export type EnemyTier = "swarm" | "small" | "medium" | "heavy" | "boss";
export type EnemyDef = { /* … */ unblockable?: true; burnTakenMul?: number; ability?: AbilitySpec };
/** R2/R3: a mechanic a direct call can break (TK 9.2). */
export type AbilitySpec = { verb: "interrupt" | "anchor" | "shield"; cooldownS: number; radiusM: number; need?: number; reachM?: number };
export type BossDef = {
  enemy: string; hp: number; retreatPct: number; kHp: number; kHpMax: number; retreatS: number; chestGold: number; shards: number;
  roots: { everyS: number; firstS: number; warnS: number; radiusM: number; damage: number; stunS: number };
  slam: { damage: Range; reachM: number; everyS: number; warnS: number; knockM: number; buildingMul: number };
  stagger: { atPct: number; stunS: number; vulnerable: number; burstLifeS: number; burstReachM: number };
  summon: { enemy: string; count: number; everyS: number; firstS: number; warnS: number };
  keep: { lives: number; everyS: number; warnS: number; stopM: number };
};
export type StageDef = {
  nights: number; keepMax: number;
  boss: { night: number; lullS: number; lullAlive: number; lullWaitS: number; escort: readonly WaveEntry[]; escortLeadS: number };
  unlock: Readonly<Record<string, number>>; // R3: building id or "keep2"/"keep3"/"upgrade"/"ult" → day
};
export type KeepLevel = { slots: number; gold: number; wood: number }; // a step's price (level 1: 0)
export type Content = { /* … */ boss?: BossDef; stage?: StageDef };
```

```ts
// src/content/rules.ts (thêm)
export const MODES = { /* … mỗi chế độ thêm */ warnK: 1 /* relax, learn 1.33; challenge 0.8 */, directK: 2.2 /* 2.8; 1.6 */ };
export const SELL = { refund: 0.6, confirmS: 3 } as const;
export const ULT = { max: 100, perWord: 1.2, direct: 3, shard: 0.6, nightPerS: 0.3, minGapS: 45, castM: 20, radiusM: 6, feathers: 12, everyTicks: 10, damage: 60, blastM: 1.5, burnS: 3, bossMul: 0.5, ringM: 12, words: 3, lifeS: 4, perWordFeathers: 3 } as const;
export const SHARDS = { swarm: 0.5, small: 1, medium: 2, heavy: 3, stagger: 6, retreat: 10 } as const;
export const DIRECT = { open: 2, openBoss: 3, gold: 2, ult: 3, minS: 3, maxS: 7, base: 0.8 } as const;
export const LEARN = { returnS: [25, 45], reviewShare: 0.25, returns: 2, plan: { due: 0.6, current: 0.25, fresh: 0.15 }, freshMax: 8, bookSaved: 40 } as const;
```

- Mộc Tinh, Mầm Gỗ và `boss`, `stage` nằm trong `src/content/slice-1a.ts` (đổi id nội dung thành `w1-silverfall`, giữ tên file để đỡ đổi import).
- Trạng thái boss là một store nhỏ (`src/sim/stores/boss.ts`: tick các đòn kế, tick hết báo, pha, choáng, Dễ Tổn Thương, máu gốc), băm như mọi store. Nhà thêm `stunUntil`, `spentGold`, `spentWood`. Thống kê thêm ở cuối mảng `STATS` (`bossDamage`, `bossTyped`, `bossRetreats`, `livesBoss`, `rootsHits`, `ultCasts`, `ultDamage`, `directOk`, `directMissed`, `reviewRedeemed`).
- Sự kiện hiếm mới: `bossWarn`, `bossPhase`, `bossStrike`, `bossRetreat`, `victory`, `stun`, `ult`, `direct`, `review`. Vòng hiệu ứng thêm `FX.root`, `FX.slam`, `FX.sprout`, `FX.feather`.

---

## 16. File và ngân sách dòng

Cách đếm như BUILD_1A6 §0: `.ts` trong `src`, trừ `src/kit`; test, bot, kịch bản không tính. Hiện **7.499**. Trần cứng 1B: **10.500**; mỗi đợt có trần riêng. Cột là mức tối đa từng file; trần cộng dồn mới là cổng.

| File | R1 | R2 | R3 | Ghi chú |
|---|---|---|---|---|
| `src/sim/systems/boss.ts` (mới) | ≤ 300 | +20 | — | Lặng, pha, đòn, choáng, gọi, Lũy, rút |
| `src/sim/stores/boss.ts` (mới) | ≤ 40 | — | — | |
| `src/content/types.ts`, `rules.ts`, `slice-1a.ts`, `compile.ts` | +160 | +110 | +40 | Dữ liệu §15 |
| `src/sim/world.ts`, `commands.ts`, `waves.ts`, `spawn.ts`, `move.ts`, `deaths.ts` | +140 | +50 | +30 | `victory`, nâng Lũy, bán, ải, không bị chặn |
| `src/sim/systems/combat.ts`, `economy.ts`, `attention.ts`, `pace.ts`, `calls.ts` | +60 | +80 | +45 | Tê, Dồn lửa, lặng, đứng yên bộ điều nhịp; loại lời gọi mới; Từ Ôn |
| `src/sim/stores/*`, `events.ts`, `stats.ts`, `hash.ts` | +35 | +25 | +5 | |
| `src/sim/systems/ult.ts` (mới) | — | ≤ 170 | — | Nạp, dùng, lông, Chữ Chiêu |
| `src/sim/systems/direct.ts` (mới) | — | ≤ 180 | +30 | Lời gọi trực tiếp, Ngắt; Neo, Phá Khiên ở R3 |
| `src/sim/systems/abilities.ts` (mới) | — | ≤ 110 | +45 | Trống Tanuki, tách Nuppeppō; vòm Troll, hào quang Đầu Đàn |
| `src/sim/systems/agents.ts` | — | +30 | — | Hoảng |
| `src/view/boss-2d.ts` (mới) | ≤ 280 | +60 | — | §13.1 |
| `src/view/fx-2d.ts` (mới) | — | ≤ 230 | — | Hạt có pool, Tối Thượng, gõ trực tiếp, hoảng |
| `src/view/debug-2d.ts`, `words/cards.ts` | +20 | +30 | +25 | Gọi lớp mới; thẻ trực tiếp, "Ôn", luật nghĩa |
| `src/view/audio-min.ts`, `folk.ts` | +45 | +35 | — | §13.2 |
| `src/ui/hud.ts`, `sheets.ts`, `build-menu.ts`, `title.ts`, `settings.ts` | +100 | +35 | +45 | Thanh boss, màn thắng và sao, Bán, Nâng Lũy; thanh Tối Thượng; Chế độ |
| `src/ui/tips.ts` (mới) | — | — | ≤ 110 | Câu Bà Cú Mực, chip |
| `src/app/learn.ts` (mới) | — | — | ≤ 200 | Kế hoạch, khởi động lạnh, sổ ôn lưu, sự kiện học |
| `src/app/*`, `src/main.ts`, `input.ts` | +40 | +25 | +40 | Ải truyện, màn kết, `=`, đầu ván học |
| **Cộng dồn (trần)** | **≤ 8.750** | **≤ 9.900** | **≤ 10.500** | |

**Thứ tự cắt khi vượt trần** (ghi vào BUILD_NOTES khi cắt): 1) Troll, Đầu Đàn, Neo, Phá Khiên (−85); 2) Từ Ôn quay lại trong lời gọi, giữ Hỏi bài (−40); 3) Thư Đồng hoảng (−30); 4) Nuppeppō tách đôi (−35).

---

## 17. Thứ tự làm

Mỗi đợt: làm → phản biện độc lập → sửa, như 1A.6. Ghi số thật vào `BUILD_NOTES.md` mục mới **§7 "1B"** (§7.1 R1, §7.2 R2, §7.3 R3) và một changelog mỗi đợt.

### R1 "Mộc Tinh tới" (chơi được một mình)

1. Dữ liệu và ải: `stage`, Đêm 5 mới, pha `victory`, sao; truyện là mặc định từ màn đầu ("Bắt đầu: Bản đồ 1 · Đồng Cỏ Thác Bạc"), hộp cát qua `?sandbox=1`.
2. Mộc Tinh đủ §5 (trừ hoảng và Mảnh Chữ), Mầm Gỗ, lệnh hộp cát `boss`, `skipTo`.
3. Nâng Lũy bằng tiền, bán 60 %, test thuộc tính tiền.
4. Bản vẽ 2D và tiếng phần R1 của §13; thanh boss; màn thắng, thua có sao.
5. Bot: chơi ải truyện, nâng Lũy bằng lệnh, luật Tướng ở đỉnh boss (§18.1); báo cáo thêm bảng boss (§18.2).
6. Cân bằng theo §6.5 tới đích §6.4 (Cân bằng là cổng; Thư giãn, Thử thách báo cáo và chỉnh nếu được bằng cùng núm).
7. File vàng làm lại; thêm file vàng `tests/golden/td-1b-boss.json` (hộp cát, Đặt sẵn, gọi boss Ngày 1, tới khi rút).
8. Kịch bản `td-1b-boss`, `td-1b-night5`, `td-1b-build`, `td-1b-perf` (§19).

**Xong R1 khi:** chủ dự án chơi hết bản đồ 1 tới boss ở 1280 × 720 được; §21 cổng 1–4 và 7–10 đạt cho phần R1, cổng G1, G3, G4, G7; B1–B8 và đích §6.4 ở Cân bằng đạt ở cả hai bộ seed. R2, R3 phải giữ các số này.

### R2 "Gõ giúp trận"

1. Tối Thượng, Mảnh Chữ, Chữ Chiêu (§8); lệnh `ult`, phím `=`, thanh nạp.
2. Lời gọi `direct` và Ngắt (§9); Tanuki, Nuppeppō (§10); Đêm 3, 4 mới (§4.2).
3. Thư Đồng hoảng; hình R2 của §13 (Tối Thượng, gõ trực tiếp, đánh bóng boss).
4. Bot: dùng Tối Thượng, phản xạ gõ trực tiếp; báo cáo thêm cột Tối Thượng, gõ trực tiếp, tỉ lệ gõ Đêm 5.
5. Cân bằng lại tới đích §6.4; file vàng làm lại; kịch bản `td-1b-ult`, `td-1b-direct`.

### R3 "Học và dạy"

1. Luật nghĩa, Từ Ôn, sổ ôn lưu, kế hoạch học, khởi động lạnh, sự kiện học (§11).
2. Bảng dạy, lịch mở, câu Bà Cú Mực và chip (§12); dòng Chế độ trong Cài đặt; lưu sao.
3. Troll, Đầu Đàn, Neo, Phá Khiên ở hộp cát (cắt đầu tiên nếu vượt trần).
4. Bot theo lịch mở; cân bằng lần cuối; file vàng; kịch bản `td-1b-learn`, `td-1b-story`, `td-1b-tour`.
5. Gói chơi thử cho chủ dự án (§22), xuất nhật ký cho B9.

---

## 18. Bot và cân bằng

### 18.1 Bot

| Việc | R1 | R2 | R3 |
|---|---|---|---|
| Thế giới | Ải truyện (`sandbox: false`), `nights: 5`, thắng khi `victory` | | Theo lịch mở |
| Lũy | Bước `{ keep: n }` gửi `upgrade` cho Lũy khi đủ tiền (thay lệnh hộp cát) | | Chờ ngày mở |
| Tướng ở đỉnh boss (`heroBoss`) | Từ lúc lặng: tới nhà đánh mà boss **sắp vào tầm** (gần nhất phía trước trên đường boss); chiến thuật Tốt ưu tiên Tháp Pháo (Cháy); đứng đó tới khi boss qua; lúc choáng, mắt ưu tiên lời gọi Dồn lửa (`reflex`) | | |
| Thư Đồng | Như cũ | Tránh nhà đang bị nhắm Rễ Trồi (Tốt), không tránh (Vừa, Kém) | |
| Tối Thượng | — | Dùng khi đầy và (boss trong 12 m, hoặc ≥ 5 quái trong 6 m quanh một điểm của vòng Tướng); Kém dùng ngay khi đầy | |
| Gõ trực tiếp, Chữ Chiêu | — | Là lời gọi: `HumanTypist` gõ như mọi lời gọi; phản xạ báo trước như Bắn mạnh | |
| Học | — | — | Hồ sơ học rỗng (khởi động lạnh) và hồ sơ đã có sổ ôn 20 từ |

### 18.2 Báo cáo `pnpm td:balance` thêm

- Bảng BALANCE §3 như nay (thắng, S, P, I, O, N, Q, phe ta, hạ quái, bậc mỗi đợt, khoảng sinh, học) cho Thư giãn, Cân bằng, Thử thách; B1–B9; hai bộ seed × 120 (`--threads=6`, máy 16 GB).
- **Bảng boss** mỗi ô: ván tới boss; hạ boss (rút) %; giao chiến (trúng đầu → rút) p50; % đường lúc rút p50; mạng mất ở đỉnh boss p50 (toán đi trước, Mầm Gỗ, Quật Lũy); phần sát thương do gõ lên boss; Tối Thượng % lên boss (R2).
- **Tách hai số:** mạng trước đỉnh boss p50, S của ván thắng p50, phần ván thua do boss / do các đêm trước.
- Cột R2: số lần dùng Tối Thượng, từ trực tiếp % số từ, tỉ lệ gõ Đêm 1–4 và Đêm 5.
- Bảng cổng của BUILD_1A6 §12 (5 seed, 4 đêm) giữ ở cuối báo cáo, chạy trên ải truyện.

### 18.3 Dải đích theo chế độ (BALANCE §3) và cổng

| Chỉ số | Thư giãn | Cân bằng | Thử thách |
|---|---|---|---|
| Thắng | ≥ 92 % | 75–90 % (**1B: 78–88 % từng bot**) | 50–75 % |
| Biên S (trung vị) | ≥ 70 % | 35–65 % (**1B: 40–60 % từng bot**) | 15–45 % |
| Áp lực P | 5–15 % | 15–35 % | 30–50 % |
| Nhàn I | ≤ 20 % | ≤ 10 % | ≤ 5 % |
| Ngộp O | ≤ 3 % | ≤ 8 % | ≤ 15 % |
| Gần thua N (mỗi ải) | ~0 | 0,3–1 | 1–2 |
| Quãng Q (trung vị) | ≤ 45 % | 50–70 % | 60–80 % |

| Cổng | Ngưỡng ở 1B |
|---|---|
| B1 | Cân bằng: Mới tới Nhanh trong dải (thắng, S, P, I, O), cả hai bộ seed; đích chặt 1B ở dòng trên |
| B2 | Không bot nào có S ≥ 90 % kèm I ≥ 20 % ở Cân bằng |
| B3 | Mới ≥ 70 % ở Cân bằng; Trẻ em ≥ 85 % ở Thư giãn |
| B4 | S Chậm chắc > S Ẩu; Chuẩn hạ quái và hạ boss nhanh hơn Ẩu |
| B5 | Không gõ thua ở Cân bằng và Thử thách (Thư giãn miễn); Không gõ không bao giờ làm boss rút ở hai chế độ đó |
| B6 | Chuẩn Tốt − Chuẩn Kém ≥ 10 điểm % thắng ở Cân bằng và Thử thách |
| B7 | ≤ 3 bậc mỗi đợt, khoảng sinh ±15 %; tắt bộ điều nhịp thì Chuẩn vẫn trong dải 1B |
| B8 | Cổng học của game (`learnOk`) đạt mọi ô; R3 thêm: ≤ 8 từ mới mỗi ván, từ mới không ở lời gọi có hạn |
| B9 | Sau buổi chơi thử của chủ dự án: bot cùng hồ sơ lệch ≤ 15 % (§22) |

**Cổng riêng của game** (thêm vào `tests/td-balance-gates.test.ts` khi đo được trên seed cố định):

| # | Cổng | Ngưỡng |
|---|---|---|
| G1 | Cổng 4–7 của BUILD_1A6 §12 trên ải truyện | Như cũ (Không gõ qua Đêm 1–4; cửa sổ ≤ 8 s; Ngày ≥ 30 %; gõ +25 % so với không gõ) |
| G2 | Tỉ lệ gõ Đêm | Đêm 1–4: 15–25 %; Đêm 5: ≤ 35 % (bot Chuẩn) |
| G3 | Giao chiến boss | Bot Chuẩn p50 45–75 s (TK 18.8) |
| G4 | Báo trước | Mọi đòn boss có sự kiện báo ≥ thời gian báo của chế độ trước đòn; mọi ván thua do boss có báo Ngày 5 và đếm ngược Đêm 5 |
| G5 | Tối Thượng | ≤ 15 % sát thương lên boss, ≤ 10 % cả ải (R2) |
| G6 | Gõ trực tiếp | 5–10 % số từ của ải (Chuẩn); ≤ 2 lời gọi `direct` mở cùng lúc (≤ 3 khi có boss) (R2) |
| G7 | Tiền | Không chuỗi xây, nâng, bán, hoàn tác nào sinh Vàng hay Gỗ; rương boss ghi đúng một lần |

---

## 19. Kịch bản trình duyệt

Chạy với máy chủ dev cổng 3046: `pnpm exec vite --host 127.0.0.1 --port 3046 --strictPort`, rồi `OUT_DIR=tmp/visual node src/kit/tools/cdp-run.mjs scripts/visual/scenarios/<tên>.mjs --width=… --height=…`. Mỗi kịch bản ở **1280 × 720 và 1920 × 1080**; kiểm không lỗi console, không ngoại lệ trang, thẻ chữ không chồng, không đè HUD, chữ ≥ 18 px; nhật ký trang chạy lại trên Node ra cùng mã băm. Kịch bản cũ (`td-1a-*`, `td-1a6-*`, `td-theme`, `td-balance`) vẫn phải đạt. Một Chrome một lúc; tắt máy chủ và Chrome khi xong.

| Kịch bản | Đợt | Kiểm |
|---|---|---|
| `td-1b-boss` | R1 | Hộp cát, Đặt sẵn, `boss`: vòng báo Rễ Trồi hiện trước đòn đúng 1,5 s (đọc sự kiện và ảnh), nhà tê có biểu tượng, Quật cành có cung báo, choáng ở 70 % có dải chữ và lời gọi Dồn lửa sáng, Mầm Gỗ mọc, rút ở 50 % → màn thắng có sao; **bộ ảnh chậm** (6 khung trong 1,5 s quanh mỗi đòn) trên nền sáng và tối (đêm) |
| `td-1b-night5` | R1 | Hộp cát, lệnh `skipTo` (Đặt sẵn, đã qua 4 đêm, vào Ngày 5): báo Ngày 5, Đêm 5, đếm ngược lặng 12 s (không lời gọi mới sáng), boss vào; nhánh thua: bỏ tháp khúc nhập, boss tới Lũy, Quật Lũy trừ 3 mạng mỗi đòn, màn thua có gợi ý |
| `td-1b-build` | R1 | Chỉ bàn phím: xây, nâng (giá đúng), nâng Lũy (Chấm ra), bán bấm hai lần (hoàn 60 %), hoàn tác 5 s; lý do từ chối hiện đúng |
| `td-1b-perf` | R1 | Boss + `flood(300)` + Mầm Gỗ (R2: + Tối Thượng): ngân sách §20 |
| `td-1b-ult` | R2 | Nạp đầy bằng hộp cát, `=`: lông rơi có bóng báo, Chữ Chiêu 3 từ gõ thật, +3 lông mỗi từ; bỏ qua Chữ Chiêu không mất gì; cửa sổ 20 s ≤ 8 s |
| `td-1b-direct` | R2 | `spawn` Tanuki trong bầy: thẻ trên đầu có vòng T; gõ được → choáng, +5 Vàng; bỏ qua → vòng hồi máu; tối đa 2 thẻ trực tiếp |
| `td-1b-learn` | R3 | Nghĩa hiện 2 lần đầu rồi ẩn (Cân bằng); Từ Ôn quay lại có nhãn "Ôn"; sổ ôn còn sau khi tải lại trang; hàng đợi sự kiện học có sự kiện đúng `gameId` |
| `td-1b-story` | R3 | Màn đầu → Bản đồ 1: câu Bà Cú Mực và chip ở Ngày 1, Đêm 1, Ngày 3; nút khóa có lý do "Mở ở Ngày 3"; Cài đặt đổi chế độ |
| `td-1b-tour` | R3 | Bộ ảnh cho chủ dự án: làng Ngày 5 có báo boss, lặng trước bão, Rễ Trồi báo và trúng, choáng, Mầm Gỗ, rút, màn thắng, Tối Thượng, Ngắt, Từ Ôn, chip bảng dạy |

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
| Luồng chính Chrome | ≤ 4 ms mỗi khung trung bình; không khung > 16,7 ms lúc boss vào, chuyển pha, rút |
| Gói JS | gzip ≤ 85 kB (hiện 68,9 kB) |
| Âm | ≤ 12 nốt tổng hợp cùng lúc; tiếng báo đòn không bị tiếng khác nuốt (ưu tiên cao nhất) |

---

## 21. Cổng cứng cuối 1B (hết R3)

1. `pnpm check` xanh (kit sha256, test, build); `tests/boundary.test.ts` xanh.
2. Tất định: file vàng `td-1a.json` (làm lại) và `td-1b-boss.json` khớp; Node và Chrome cùng mã băm; nhật ký trang của mọi kịch bản chạy lại trên Node ra cùng mã băm.
3. Bất biến (test thuộc tính): lời gọi SÁNG ≤ trần; tối đa 1 khóa; chữ đầu không trùng, không cặp cách một phím; bỏ qua mọi lời gọi (kể cả `ult`, `direct`) thì Chuỗi không giảm, không mất tài nguyên; G7 tiền.
4. Ngân sách chú ý: mọi cửa sổ 20 s ≤ 8 s ở Cân bằng (bot Chuẩn); G2.
5. B1–B8 đạt ở cả hai bộ seed × 120; đích chặt §6.4 ở Cân bằng đạt cho từng bot.
6. G1, G3, G4 (R1); G5, G6 (R2); B8 phần học (R3).
7. Boss đọc được: `td-1b-boss` và `td-1b-night5` đạt; bộ ảnh chậm cho thấy mọi báo đòn.
8. Hiệu năng §20.
9. Mọi kịch bản §19 và kịch bản cũ đạt ở hai cỡ, 0 lỗi console.
10. Số dòng ≤ 10.500 (R1 ≤ 8.750, R2 ≤ 9.900).
11. Changelog mỗi đợt; BUILD_NOTES §7 có số thật; AGENTS.md cập nhật lệnh và kịch bản mới.
12. Chủ dự án chơi thử (§22) và có số cho B9.

---

## 22. Chủ dự án chơi thử (1280 × 720, khoảng 30 phút)

Trước khi chơi: Cài đặt → Nhịp tự điều **Bật**, chế độ Cân bằng. Sau mỗi ván: mở bảng điều khiển trình duyệt, chạy `copy(JSON.stringify(__td.balance()))` và dán vào một file gửi lại (hồ sơ và chỉ số cho B9).

1. **Một ván đủ bản đồ 1** (khoảng 12 phút). Cuối ván ghi: thắng hay thua, còn bao nhiêu mạng, mấy sao.
2. Ngày 5: có thấy báo Mộc Tinh không? Có làm gì khác đi vì lời báo không (thêm tháp, nâng nhà, dời Tướng)?
3. Đêm 5: có thấy 12 s lặng và đếm ngược không? Có thấy boss đi đường nào không?
4. Rễ Trồi: nhìn vòng đỏ có hiểu "nhà này sắp bị tê" không? Đủ thời gian để nhận ra không?
5. Lúc boss choáng (70 %): có thấy dải chữ và các lời gọi sáng cùng lúc không? Có gõ không?
6. Nếu thua: có hiểu vì sao thua không (boss qua khúc nhập)? Thua có công bằng không?
7. **Ván thứ hai, cố ý để boss tới Lũy** (đặt ít tháp ở khúc nhập): cảm giác lúc Lũy bị đập thế nào?
8. Nâng một tháp, bán một nhà (bấm hai lần), nâng Lũy lên 2 rồi 3: giá có rõ không? Chấm, Phẩy ra có thấy không?
9. (R2) Bấm `=` lúc đông quái và gõ Chữ Chiêu: có thấy mưa to hơn không? Ngắt một Tanuki: có thấy chữ trên đầu nó kịp không?
10. (R3) Có nhớ được từ nào không? Có thấy từ Ôn quay lại không? Câu Bà Cú Mực có ngắn, dễ hiểu không?
11. Câu hỏi chung: lúc nào thấy căng nhất? Lúc nào thấy chán? Có lúc nào bị giữ chặt ở thẻ chữ không?

---

## 23. Rủi ro

| Rủi ro | Cách chặn |
|---|---|
| Boss quyết hết, thua thấy "xui" | Báo từ Ngày 5; đếm ngược; thanh boss có vạch rút lui và khoảng cách tới Lũy; Quật Lũy có báo; màn thua có gợi ý; cổng G4; B9 hỏi người thật |
| Hai đỉnh quá gắt (Biên S tụt vì ván sát nút) | Quật Lũy trừ 3 mạng mỗi 2,5 s, không thua ngay; báo cáo "S của ván thắng" và N |
| Biên S lệch giữa các bot (đo: 7–16 mạng sau Đêm 5 phần đầu) | Thứ tự chỉnh §6.5 bước 5 (Thuồng Luồng giáp 60 % là chỗ chính xác và Phát Chữ quyết); không thêm luật theo bot |
| Boss tê nhà làm người gõ chậm thua nhiều hơn dự kiến | Số đầu dò chưa có Rễ Trồi; R1 đo lại và chỉnh máu boss trước mọi núm khác |
| Nhịp k làm người gõ nhanh thấy boss "trâu" | Chỉ nâng máu khi k > 1, trần ×1,12; báo cáo hạ boss của Khá, Nhanh |
| Lời gọi mới làm tràn ngân sách chú ý ở Đêm 5 | Mọi từ qua kiểm "vừa ngân sách"; G2; hạ tần suất trước khi nới cổng |
| Lịch mở bảng dạy (R3) làm lệch cân bằng R1, R2 | Bot theo cùng lịch; R3 cân bằng lại đủ hai bộ seed |
| Phương sai theo seed (đo: Chuẩn S 17,5 % ở seed 1–24, 40 % ở 1–120) | Luôn hai bộ × 120 seed; không kết luận từ ít seed |
| Phình mã | Trần từng đợt §16 và thứ tự cắt |
| Đụng kit đang có người sửa | 1B không cần đổi kit; nếu cần thì chỉ ngoài `shared/game-kit/typing`, có test, tương thích ngược |
| Hình giữ chỗ bị coi là "dựng model bằng mã" | Mộc Tinh 2D là nét mực, vòng tròn như mọi hình 2D hiện có; model thật là file Tripo ở 1C |
| Tốn RAM khi chạy bot và trình duyệt cùng lúc | `--threads=6`; không chạy `td:balance` cùng lúc với Chrome; một máy chủ dev cổng 3046 |

---

## 24. Mặc định đã chọn (chủ dự án đổi được)

1. Bản đồ 1 có 5 Ngày, 5 Đêm (không 8 đợt); Mộc Tinh ở cuối Đêm 5.
2. Máu Mộc Tinh khởi điểm 3.200, rút ở 50 %, nâng theo k khi k > 1.
3. Boss tới Lũy thì đập 3 mạng mỗi 2,5 s (không thua ngay).
4. Thắng thì quái còn lại tan; truyện không có đêm vô tận.
5. Lũy tối đa cấp 3 ở bản đồ 1 truyện.
6. Bán hoàn 60 %, bấm hai lần; không Đổ Nát ở 1B (máu nhà sàn 1).
7. Tối Thượng ở phím `=`; boss nhận ×0,5 sát thương Tối Thượng.
8. Neo, Phá Khiên chỉ ở hộp cát; Ngắt ở Đêm 4 bản đồ 1.
9. Không túi, bùa, Từ Vàng, Đài Ấn, Bùng Nổ, Lam ở 1B.
10. Nghĩa tiếng Việt: hai lần đầu ở Cân bằng, lần đầu ở Thử thách, luôn ở Thư giãn, Học, trẻ em.

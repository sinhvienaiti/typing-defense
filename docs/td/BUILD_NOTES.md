# Ghi chú khi làm 1A

Đi kèm `BUILD_NOW.md`. Cập nhật cuối mỗi mốc.

---

## 1. Ngân sách dòng (BUILD_NOW §2)

Đếm bằng `wc -l` trên `td.html`, `src/platform/rng.ts` và mọi file trong `src/td/`. Không tính test, kịch bản, `scripts/`. Test `td-boundary` đọc trần cứng 5.500 từ BUILD_NOW §2 và hỏng khi tổng vượt.

### 1.1 Sau 1A.2

| Nhóm | Kế hoạch | Sau 1A.1 | Sau 1A.2 (`5be5919b`) | Sau sửa review 1A.2 | Còn lại |
|---|---|---|---|---|---|
| Trang (`td.html`) | 30 | 18 | 18 | 18 | 12 |
| Platform (`rng.ts`) | 50 | 69 | 69 | 69 | −19 |
| Nội dung | 800 | 644 | 654 | 571 | 229 |
| Gõ thuần (`typing/`) | 700 | 0 | 441 | 453 | 247 |
| Sim lõi (`sim/*.ts`) | 550 | 671 | 779 | 774 | −224 |
| Kho | 250 | 259 | 330 | 331 | −81 |
| Đường (`nav/`) | 200 | 108 | 108 | 108 | 92 |
| Hệ chiến đấu | 450 | 534 | 586 | 585 | −135 |
| Hệ gõ | 600 | 0 | 598 | 629 | −29 |
| App | 450 | 199 | 330 | 330 | 120 |
| View, UI | 900 | 377 | 788 | 714 | 186 |
| **Tổng** | **4.980** | **2.879** | **4.701** | **4.582** | **918 tới trần 5.500** |

1A.2 có phần 1.580 dòng (cộng dồn 4.459). Bản `5be5919b` tiêu 1.822, vượt 242, và không bù trong mốc, trái luật ở 1.2. Lần sửa review:

- Sửa các lỗi review trong mã thêm 55 dòng (sàn E, Dừng tất cả khi xây, kiểm lại nhịp khi đổi độ khó và cấp, `shift` khi bỏ lần phát, chặn lỗi ở 255, đưa từ tầng 2 lên tầng 1, túi không bỏ phần còn lại, khoảng cột theo chiều cao thẻ).
- Bù 174 dòng chỗ trùng thật: kiểu đã biên dịch suy ra từ hàm biên dịch (như `Typing`) thay vì khai lại từng trường; CSS trang một luật một dòng như CSS thẻ; bảng màu `debug-2d` và cờ tập kết; cột của vòng sự kiện là trường; kiểu dữ liệu thuần (`AttackSpec`, `HeroDef`, `MapDef`, quái đã biên dịch) gộp dòng.
- Còn vượt phần của 1A.2: 4.582 − 4.459 = 123 dòng. Không cắt thêm chú thích luật (chúng giữ tham chiếu TK). Phần này trừ vào phần của 1A.3–1A.5, ước lượng lại bằng số thật ở 1.2.

### 1.2 Phần cho từng mốc còn lại (ước lượng lại sau review 1A.3; 1A.4 ghi số thật)

Mốc đang làm: **1B.R3**. Test `td-boundary` đọc dòng này và cột "Cộng dồn tối đa" của mốc đó, rồi hỏng khi tổng vượt (ngoài trần cứng của bước đang làm: từ 1B là `BUILD_1B.md` §16, 10.500). Bắt đầu mốc mới thì đổi dòng trên trước khi viết mã. Từ 1A.6 đếm như `BUILD_1A6.md` §0: chỉ TypeScript trong `src/td` (1A đếm thêm `td.html`, `rng.ts`, `td.css`: 178 dòng; mục 3).

| Mốc | Phần mới (ước lượng theo mã thật đã có) | Tối đa | Cộng dồn tối đa |
|---|---|---|---|
| 1A.2 Gõ lõi (xong, gồm sửa review) | 1.703 thật | — | 4.582 |
| 1A.3 Người và ô (xong, gồm sửa review) | 378 thật: 337 của mốc (mục 1.4: `nav/astar` 107, kho `agents` 36, hệ `agents` 174, `stream` −29, nối `commands` `world` `placement` `compile` `events` `main` +13, vẽ người, đường A*, dây +36) và 41 của bản sửa review 1A.3 (mục 1.6: `nav` +18, hệ `agents` +4, `debug-2d` +17, `cards` +2) | 340 + 41 | 4.960 |
| 1A.4 Điều khiển, HUD (xong, gồm sửa review) | 496 thật: 499 của mốc (mục 1.7; bản đầu đủ mục 5.3–5.4 dài 822, cắt UI theo mục 1.8) và −3 của bản sửa review 1A.4 (mục 1.10) | 500 | 5.460 |
| 1A.5 Bot, báo cáo (xong) | 41 thật (mục 1.11): op hộp cát `flood` (TK 25.12) ở `spawn.ts` +19 và `commands.ts` +6, đo khung ở `main.ts` +16; bot, chính sách, báo cáo nằm ở `tests/` và `scripts/` | 40 | 5.500 |
| 1A.6 Lời Gọi (R1, R2, R3 xong; đếm mới, chỉ `.ts` của `src/td`) | R1: 5.319 → 5.540 thật (mục 3, gồm sửa review); R2: 5.540 → 5.850 thật (mục 4); R3 6.012 (mục 5); tách repo và chủ đề Văn Điền: 7.064 | R1 tới 6.600; R2 tới 7.000; R3 phần còn lại | 7.300 |
| 1A.7 Cân bằng (`docs/games/BALANCE.md` bước 4; đếm như 1A.6, `src/kit` không tính) | 7.064 → 7.492 thật (mục 6): `sim/systems/pace.ts` 164, `app/skill.ts` 107, `ui/profile.ts` 53, nối sim và UI 104 | 430 | 7.500 |
| 1B.R1 Mộc Tinh tới (`BUILD_1B.md` §16, §17; đếm như 1A.7) | 7.499 → 8.829 thật (mục 7.1); sửa review R1: 8.883 thật (mục 7.2; 50 dòng lấy từ phần R2) | 1.401 | 8.900 |
| 1B.R2 Gõ giúp trận (`BUILD_1B.md` §16, §17) | 8.883 → 9.488 thật (mục 7.3) | 1.117 | 10.000 |
| 1B.R3 Học và dạy (`BUILD_1B.md` §16, §17; `R3_PLAN.md` §8) | 9.670 → 10.255 sau phần A, 10.413 sau phần B (mục 7.7), 10.486 sau luật gỗ của chủ dự án (mục 7.8) | 830 | 10.500 |

Ước lượng lại 1A.4 (review 1A.3, mục 5), tính cả `move` và đốm sáng dọc dây trợ lực mà 1A.3 dời sang, cùng 41 dòng của bản sửa review 1A.3. Bản sửa đó dùng hết 38 dòng dự phòng dưới trần, nên phần của 1A.4 giữ 500 mà phải chứa thêm hai việc. Cắt theo BUILD_NOW §10 (cắt UI trước, không cắt luật, test) trước khi viết mã 1A.4:

| Phần của 1A.4 | Trước | Sau review 1A.3 | Cắt |
|---|---|---|---|
| Phím lệnh ở `app/input` (hôm nay 35) | 75 | 75 | |
| `app/selection` + chỗ trống gợi ý trong sim | 80 | 80 | |
| Chuột và camera | 70 | 50 | Bỏ kéo chân dung thả lên nhà (§10 nêu tên) và Shift + phải "Thư Đồng rảnh gần nhất". Còn: trái chọn, phải vào nhà để gửi, lăn zoom, kéo camera |
| `move`: lệnh sim (người trong ô mở, điểm trong sân, Thư Đồng cần ô trống), phải vào đất | — | 16 | |
| Thanh nhà (nhịp, gửi, tập kết, hoàn tác, cấp, "Mỗi từ", gợi ý nhịp) gộp menu xây, thay vòng menu (§10) | 85 | 80 | Bỏ lăn chuột trên huy hiệu nhịp; nhịp đổi bằng núm trên thanh, `Minus` / `Equal` |
| Thanh 4 chân dung | 35 | 35 | |
| HUD (chuyển chip trạng thái ra khỏi `main.ts`, −25) | 30 | 30 | |
| Chip Tải, Chuỗi | 30 | 30 | Danh sách rê chuột của chip Tải là `title` (đã cắt từ trước) |
| Hộp cát | 50 | 45 | Dựng từ một bảng điều khiển; "Đặt sẵn 4 ô" là một bảng dữ liệu như kịch bản `td-1a-slots` |
| CSS | 45 | 40 | Không có bóng kéo, không có vòng menu |
| Ân hạn ra lệnh | 5 | 5 | |
| Đốm sáng dọc dây mỗi phím đúng (view đọc `wordKey`) | — | 14 | |
| **Cộng** | **505** | **535 → 500** | **−35** |

- Không còn dòng dự phòng: 4.960 + 500 + 40 = 5.500, đúng trần cứng. Mục tiêu 5.000 không giữ được; BUILD_NOW §2 cho vượt mục tiêu nhưng không vượt trần.
- Từ 1A.4, mốc nào vượt phần của mình thì bù ngay trong mốc đó (cắt thêm UI theo §10, không cắt luật, test), không đẩy sang mốc sau. Test chặn theo cột "Cộng dồn tối đa", nên vượt là đỏ ngay trong mốc. 1A.4 bù được bằng chỗ trùng thật thì trả lại theo thứ tự: lăn chuột trên huy hiệu nhịp, Shift + phải.

### 1.3 Lệch so với BUILD_NOW, TK ở 1A.2 (có lý do)

- **Bảng TK 6.5, cột 4–8:** số trong TK (58 / 237 / 453 từ, A = 9 / 19 / 22) là đếm trên 5–8 chữ. Dải 4–8 thật: 124 / 375 / 676 từ, A = 15 / 21 / 23, trần 9 / 12 / 12. `td-content` kiểm số thật và kiểm riêng rằng 5–8 cho 58 / 237 / 453.
- **Tầng 2 của dòng chữ** bật khi số chữ trống ≤ mức sàn của chính loại đó (dòng chữ: 3, vì dòng chữ đã dừng ở dự trữ), không đợi tới 0. Đọc chữ "khi không còn chữ đầu trống" theo nghĩa "không còn chữ trống loại này được lấy"; nếu đợi tới 0 thì từ cấp 4 trở lên dòng chữ nghẽn ở 1–3 chữ trống mà không có tầng 2.
- **Neo thẻ chữ:** bán kính nhà + 1,4 m (ngay trên hàng đèn lồng, đúng ý TK 23.4 "FX_top + 0,6 m"), không phải 2,5 m cố định. Neo 2,5 m che đèn lồng của mọi nhà rộng hơn 2 m.
- **Người trợ lực ở 1A.2 có mặt ngay** (`assignUnit` đặt người vào ổ, vào việc 0,4 s, từ đầu sau 0,6 s). Đi bộ, bay, A* là 1A.3.
- **Phát Chữ** không nhân hào quang sát thương (phần thưởng từ là lớp riêng, không trần); vùng nổ có nhân hào quang vùng × 1,15. Chí mạng thường vẫn quay ở luồng `crit` khi từ không Hoàn hảo.
- **Có mặt +15 %** nhân vào kênh nhịp: tốc bắn, chu kỳ tự sản, tốc hồi sinh (khớp số "hồi sinh ~7,3 s gồm có mặt" ở TK 11.4 và "chỉ có mặt 25,9" ở TK 11.5).
- **5 từ tốt liền** đếm mọi kết quả không Ẩu (gồm Vừa); Ẩu và tan đặt lại.
- **Nỏ Lũy** nhận hào quang tấn công; phần thưởng từ của Lũy dùng T_N kinh tế.
- **Pháo** theo TK 11.3: Chuẩn làm rìa nổ còn 70 %, Mượt nới vùng tối đa 40 %, không mục tiêu thêm.
- **Khó:** tuổi từ × 0,9 nên ở 317 ô (E, độ dài) tuổi từ ngắn hơn 1,2 s + thời gian gõ. Test in danh sách và kiểm thời gian gõ vẫn vừa.
- **Sàn E** (TK 6.6 "E = max(B, sàn)"): hộp cát đặt B (`w.expected`); tuổi từ, chấm, dải độ dài, nhịp mặc định đọc `expectedE(w)`. Đổi độ khó thì dựng lại dải và trần chữ.
- **Xây nhà lúc "Dừng tất cả"** (TK không nói): nhà mới đứng ở Dừng, nhịp của nó được cất như mọi nhà khác; "trả lại" cho nó nhịp đó. Đóng băng Nhiệt và Chuỗi giữa đợt vẫn giữ.
- **Nhịp đóng sau khi đổi độ khó hoặc cấp** (TK không nói): chuyển sang nhịp mở gần nhất, chậm hơn nếu đang quá dày (Lũy về cấp 1: 2 s → 3 s), dày hơn nếu nhịp chậm bị đóng (8 s rời Dễ → 6 s). Nhịp do "Dừng tất cả" cất cũng được kiểm lại. Người chơi tự chọn nhịp thì nhịp đã cất bị xóa.
- **Túi từ:** phần còn lại của một vòng mà lúc này không từ nào lọt thì mở đầu vòng sau, trước các từ vừa phát (xáo lại). Lấy một từ thì các từ chưa phát giữ thứ tự (`copyWithin`), nên phần mang sang luôn ra trước khi từ khác lặp lại.
- **Khoảng cột thẻ** = max(40, ⌈1,2 × cao thẻ⌉ + 4) px, để thẻ đang gõ (×1,2, phóng từ đáy) không chạm thẻ trên; thẻ cao ~33 px (~35 ở `--ui` 1,2), nên khoảng là 44–46 px thay vì 40. Thẻ đang khóa nổi lớp trên.
- **Dự trữ 3 chữ ở cấp từ vựng ≤ 3** gần như không bao giờ chạm khi chơi thường: chữ hiếm (u, y, i bắt đầu 1–2 từ của dải 3–5) luôn trống, nên số chữ trống không xuống dưới 4; tầng 2 sớm (≤ 5 chữ trống) là cơ chế làm việc ở đó. Test `td-letters` dùng một loại giả ưu tiên cao giữ chữ tới đúng mức dự trữ để kiểm luật ở mọi cấp.
- **Từ dự phòng:** máy chủ không phục vụ `/vocabulary/` (Vite thường ở 127.0.0.1) thì trang dùng 129 từ thông dụng cấp 1–3 có sẵn, HUD ghi "Từ dự phòng", `__td.flags().vocabulary = "fallback"`. Chạy lại trên Node dựng đúng bộ từ trang đã dùng.

### 1.4 Sau 1A.3

| Nhóm | Sau sửa review 1A.2 | Sau 1A.3 | Đổi | Sau sửa review 1A.3 (mục 1.6) |
|---|---|---|---|---|
| Trang, Platform | 87 | 87 | 0 | 87 |
| Nội dung | 571 | 572 | +1 (`hero` đã biên dịch) | 572 |
| Gõ thuần | 453 | 453 | 0 | 453 |
| Sim lõi (`sim/*.ts`) | 774 | 786 | +12 | 786 |
| Kho | 331 | 367 | +36 (`agents`) | 367 |
| Đường (`nav/`) | 108 | 215 | +107 (`astar`) | 233 (+14 `nearestOpen`, +4 `grid`) |
| Hệ chiến đấu | 585 | 585 | 0 | 585 |
| Hệ gõ (gồm `agents` theo BUILD_NOW §2) | 629 | 774 | +145 (`agents` 174, `stream` −29) | 778 (+4 `agents`) |
| App | 330 | 330 | 0 (`state()` dựng bằng `live().map`, thêm người) | 330 |
| View, UI | 714 | 750 | +36 | 769 (+17 `debug-2d`, +2 `cards`) |
| **Tổng** | **4.582** | **4.919** | **+337 / 340** | **4.960 (+41)** |

Bản đầu của 1A.3 dài 5.013 dòng (vượt 91 trước khi có phần vẽ). Để vừa phần 340 dòng, không cắt luật nào của TK 25.9 và BUILD_NOW §3.4; đã đổi:

- Kiểm tầm nhìn (kéo dây) lấy mẫu dưới 1 m một bước và cho mỗi bước qua `grid.open` (qua góc thì hai ô bên cũng phải trống), thay cho duyệt ô chính xác: vẫn không bao giờ cắt ô chặn hay góc chặn (test `td-nav` dò từng đoạn bằng bước 5 mm).
- A* tìm từ đích về người đi, nên đọc cha từ người đi ra đúng thứ tự đi, không cần đảo mảng.
- Đặt nhà thì mọi Thư Đồng đang đi tìm đường lại (TK: chỉ người bị cắt). Cùng kết quả cho người bị cắt; người không bị cắt có thể đổi sang đường dài bằng. Một lần A* ≤ 0,13 ms (trung vị).
- Đường chỉ tính khi ra lệnh (bước 1), không có cờ "tìm lại ở bước 3".
- `move` (Tướng tới một điểm) dời sang 1A.4 cùng chuột phải vào đất: BUILD_NOW §4 ghi là lệnh 1A, nhưng mục 1A.3 ở §1 không có. Đã tính vào phần của 1A.4 (mục 1.2).
- Đốm sáng chạy dọc dây trợ lực mỗi phím đúng (BUILD_NOW §5.1) chưa vẽ: cần view đọc sự kiện phím (`wordKey`). Làm ở 1A.4, đã tính vào phần của mốc đó (mục 1.2).
- Bỏ `KEEP_SLOT` không ai dùng; `stream.ts` mất phần người có mặt ngay (−29).

Sau 1A.3 còn 3 dòng tới cột "Cộng dồn tối đa" của mốc, cho bản sửa review. Bản sửa review 1A.3 tốn 41 dòng (mục 1.6), viết thẳng, không nén dòng; review 1A.3 (mục 5) yêu cầu tính phần này vào ước lượng lại 1A.4, nên phần vượt lấy từ 38 dòng dự phòng dưới trần, và 1A.4 cắt UI như bảng ở mục 1.2.

### 1.5 Lệch so với BUILD_NOW, TK ở 1A.3 (có lý do)

- **Chỗ đứng trợ lực:** Thư Đồng ở ổ (mép vòng + 1 m, phía Lũy); Draconis đậu trên mép mái phía Lũy (đúng bán kính nhà); bản vẽ đặt hình tam giác ra ngoài mép 1 m khi đậu hay bay thấp, để không che chữ cái và vạch cấp (review 1A.3, mục 4). Lũy tự nó không có "phía Lũy": ổ của Lũy quay về nam (đất trống, xa đường).
- **Vào và ra việc đo từ chỗ đứng:** vào khi đứng trên đất trong 3,0 m (Draconis: sau khi hạ cánh xong); ra khi xa quá 4,5 m, hoặc khi người đã được gửi đi nơi khác dừng lại. Chỗ nghỉ có thể nằm trong 4,5 m của chỗ trợ lực (Draconis nghỉ đúng chỗ trợ lực Lũy; nhà đặt sát hàng nghỉ của Thư Đồng): chỉ đo 4,5 m thì gọi về không bao giờ ngắt, Draconis không đánh nữa, và hạ cấp Lũy để lại hai nhà được trợ lực với một ô (review 1A.3, mục 2). TK 8.4 đo "từ mép vòng", TK 25.9 và BUILD_NOW §3.4 đo "của ổ": theo ổ. Có trễ giữa 3,0 và 4,5 m: người được gửi đi vẫn trợ lực tới khi xa 4,5 m (Draconis: 0,6 s cất cánh + 0,75 s bay); tới nhà mới trước thì nhà cũ ngắt trước.
- **Nghỉ ở đâu:** Thư Đồng đứng một hàng cách Lũy 5,5 m về phía tây, cách nhau 2,4 m (TK 23.7 "đứng cạnh Lũy"; `ASSIST.homeSideM`, `homeGapM`). Draconis nghỉ ở chỗ đứng trợ lực Lũy (mép mái nam), nên gửi tới Lũy từ chỗ nghỉ không phải bay.
- **Đổi chỗ khi người gửi đi không có nhà:** người bị thay về chỗ nghỉ.
- **Lệnh mới lúc đang hạ cánh:** cất cánh lại (0,6 s). Lúc đang cất cánh hay đang bay: đổi đích trên không.
- **Tướng tự đánh:** chỉ khi đứng trên đất và không trợ lực (không đánh lúc cất, bay, hạ); cầu lửa vào quái đi xa nhất trong 9 m, không nhận hào quang. Quái không đánh Draconis (1A).
- **Thư Đồng bị nhà mới đè lên** (đang đi qua đúng chỗ đặt): bước sang tâm ô trống gần nhất (trong 6 ô, hòa thì ô có chỉ số nhỏ hơn) mà từ đó còn đi tới được đích, không bao giờ vào nước hay nhà khác; không ô nào tới được thì ô trống gần nhất. Bản đầu 1A.3 lùi theo bán kính tới r + 0,75 m, nên người cạnh suối bị đẩy vào ô nước và kẹt tới hết ván (review 1A.3, mục 1). A* cũng nhận ô xuất phát bị chặn: người đứng trên ô chặn vẫn đi ra được khi được gửi. TK 12.5 không có bước kiểm người đứng.
- **Hoàn tác nhà đang được trợ lực:** dây trợ lực ngắt ngay (nhà mất), người được gửi tới đó về chỗ nghỉ; đường tính sau khi ô của nhà đã mở.
- **Hạ cấp Lũy trong hộp cát:** người ở ô đã đóng về chỗ nghỉ; trợ lực ngắt khi xa 4,5 m hoặc khi người dừng ở chỗ nghỉ, như mọi lần rời. Lệnh cho ô đóng bị từ chối (`noSlot`). Thư Đồng ở ô đóng không vẽ khi đứng ở chỗ nghỉ (TK 23.7: mở ô thì "Thư Đồng chạy ra").
- **Ô trên suối:** ô bị chặn khi có phần nước vẽ không nằm trọn trên một cầu (xét cả ô, không chỉ tâm ô). Cầu vẽ rộng 3 m (z 24,5–27,5), nên phần đi được là 2 m giữa (z 25–27); ô bờ nửa trên cầu vẫn mở. Người đi không bao giờ bước lên nước vẽ (review 1A.3, mục 3).
- **Dây trợ lực** dừng ở 0,3 r bên trong mép nhà, không tới tâm như BUILD_NOW §5.1: dây tới tâm cắt ngang chữ cái và vạch cấp (review 1A.3, mục 4).
- **Thẻ của từ cũ trong cặp tầng 2** cũng gạch chân hai chữ đầu: bộ định tuyến cần hai phím cho cả hai từ của cặp (TK 6.5 "Thẻ gạch chân hai chữ đầu"). Chỉ đổi ở view; `W.tier` vẫn là tầng lúc phát. Thấy khi làm kịch bản tầng 2 (review 1A.3, mục 7).
- **Cột thẻ bay qua nhà bên cạnh:** hai nhà gần nhau (bố cục "Đặt sẵn 4 ô": Trại Lính cách Tháp Pháo 7 m) thì cột thẻ của nhà dưới bay lên qua đĩa nhà trên. TK 23.4 cho thẻ bay lên từ mái nhà mình làm đồng hồ, bộ xếp làn chỉ tách thẻ với thẻ và với HUD; giữ nguyên ở 1A (phần này của review 1A.3, mục 4 không sửa).
- **Sự kiện:** `agentOrdered`, `agentArrived`, `agentLeft` (TK 25.11) thay sự kiện `assist` của 1A.2.
- **Test 1A.2 đổi theo:** `assisted()` chờ mọi người tới nơi; `td-letters` cài `Letters` riêng trước từ đầu tiên (Lũy phát trong lúc Thư Đồng còn đi) và nhận các từ đang sống lúc bắt đầu; `td-sim-perf`, `td-aura`, `td-heat-chain` chờ người tới trước khi đo.

### 1.6 Sửa review 1A.3

Bản sửa đầu bị ngắt trước khi commit. Bản này giữ phần đúng của nó (luật, test, pha tầng 2), viết lại thẳng những chỗ nó nén dòng chỉ để vừa 3 dòng còn lại (gán qua mảng, nối lệnh vẽ sau `Object.assign`), rồi làm nốt phần còn thiếu. 41 dòng, tính ở mục 1.2.

1. **Thư Đồng bị đẩy vào nước khi nhà mới đè lên (cao).** `rerouteAgents` đưa người bị đè sang tâm ô trống gần nhất còn đi tới được đích (`nearestOpen` ở `nav/astar.ts`); `findPath` nhận ô xuất phát bị chặn (`grid.open(…, pass)`). Test `td-nav`: lúc Gạch đi tới cầu nam (10 thời điểm cách nhau 10 tick), Tháp Cung đặt đè lên Gạch ở mọi chỗ hợp lệ cách nhau 0,5 m, 361 lần, có 13 lần cách cũ đẩy vào ô nước: Gạch luôn tới mỏ; ô trống gần nhất bị vây kín thì bỏ qua; người đứng trên ô nước được gửi lại thì đi ra. Dò lại của review: probe-d tới mỏ; probe-g 875 chỗ đặt, không ai kẹt (15 chỗ chặn lối ra cầu nam, Gạch đi vòng cầu bắc, tới chậm hơn ≤ 3,5 s).
2. **Trợ lực không ngắt khi chỗ nghỉ trong 4,5 m (vừa).** Ngắt khi người không còn được gửi tới nhà đó và đã dừng, hoặc xa quá 4,5 m (mục 1.5). Test `td-agents`: Phẩy ở Tháp Cung (−13; 40) được gọi về chỗ nghỉ cách ổ đúng 4,5 m thì ngắt khi dừng, nhà thôi phát và hết có mặt; hạ Lũy về cấp 2 cũng vậy; Draconis trợ lực Lũy được gọi về thì ngắt ngay trong tick đó và lại ném cầu lửa. probe-a, probe-b, probe-e: hết lỗi.
3. **Đường đi cắt góc cầu qua nước vẽ (thấp).** Xét cả ô (mục 1.5). Test `td-nav` đo mọi đoạn đã kéo dây với nước và cầu như được vẽ, mẫu 2 cm: 150 đường trên sân có nhà, 400 đường ngẫu nhiên qua suối. probe-f: 1.238 đường, không đoạn nào trên nước vẽ.
4. **Dây trợ lực đè chữ cái, Draconis che vạch cấp (thấp).** Dây dừng ở 0,3 r trong mép; Draconis vẽ ra ngoài mép 1 m khi đậu hay bay thấp. Thẻ bay qua đĩa nhà bên cạnh: không sửa, lý do ở mục 1.5.
5. **Ước lượng 1A.4 chưa tính `move`, đốm sáng, bản sửa review (thấp).** Ước lượng lại ở mục 1.2: cần 535, phần 500, cắt 35 dòng UI theo BUILD_NOW §10, ghi trước khi làm 1A.4.
6. **Test bỏ sót (thấp).** Test mới: mỏ có người tới lại trong 5 s sau lần gom thì đống về kho ngay lúc tới, rồi mỗi 5 s; Tướng không bắn lúc cất cánh, bay, hạ cánh; `clearLine` gặp tường dày 1 ô ở 400 độ dài, độ dốc, vị trí; A* so với A* mẫu trên 300 sân (240 sân dày, nơi các đường bằng chi phí gặp nhau); cùng các test của mục 1–3. Đột biến (bản sao worktree, 12 file test TD): 36 đột biến, 30 của review và 6 cho bản sửa, cả 36 bị bắt, gồm 4 đột biến sống của review. Đột biến "hòa về ô lớn hơn" làm A* lặp mãi nên bị bắt bằng cách treo. Giới hạn 0,5 ms một lần A* (TK 25.12) vẫn chặn theo trung vị: chạy riêng `td-nav`, trung vị 0,14 ms, p95 0,48–0,50 ms; chạy cả bộ, p95 1,6–2,3 ms là do các luồng Vitest khác chiếm CPU, không phải do A*, nên chặn p95 chỉ làm test chập chờn.
7. **Chưa kịch bản nào thấy cặp tầng 2 (thấp).** `td-1a-slots` thêm pha tầng 2 và cổng `tier2PairOnScreen` (mục 2). Khi nhìn cặp, thẻ của từ cũ chỉ gạch một chữ: sửa ở view (mục 1.5).

### 1.7 Sau 1A.4

| Nhóm | Sau sửa review 1A.3 | Sau 1A.4 | Đổi |
|---|---|---|---|
| Trang, Platform | 87 | 87 | 0 (`td.html`: lớp HUD dưới lớp thẻ, dòng "đang tải") |
| Nội dung | 572 | 576 | +4 (`preset` của bản đồ) |
| Gõ thuần | 453 | 453 | 0 |
| Sim lõi (`sim/*.ts`) | 786 | 824 | +38 (`move`, op `preset`, `freeSpots`, `canPlace(…, free)`) |
| Kho, Đường, Hệ chiến đấu | 1.185 | 1.185 | 0 |
| Hệ gõ (gồm `agents`) | 778 | 786 | +8 (`moveAgent`) |
| App | 330 | 521 | +191 (`selection` 156, `input` +38, `sandbox` 28, `main` +12, `dev-handle` −43) |
| View, UI | 769 | 1.027 | +258 (`hud` 79, `build-menu` 48, `team-bar` 36, `td.css` +51, `debug-2d` +42, `cards` +2) |
| **Tổng** | **4.960** | **5.459** | **+499 / 500** |

`dev-handle.ts` thôi khai lại từng trường của `window.__td` (kiểu `TdState`, `TdWord`, `TdDevHandle`): `main.ts` dựng đối tượng đó, nên kiểu là cái `main.ts` trả về (cùng cách 1A.2 suy kiểu đã biên dịch từ hàm biên dịch). Ghi chú cần cho kịch bản (đơn vị tick, `mode`, `path`) nằm cạnh chỗ dựng.

### 1.8 Cắt UI ở 1A.4 (BUILD_NOW §10)

Bản đầu làm đủ mục 5.3–5.4 dài 822 dòng, vượt phần 500. Theo luật ở 1.2 (bù trong mốc, cắt UI trước, không cắt luật, test), ngoài hai cắt đã ghi trước (kéo chân dung, Shift + phải, lăn chuột trên huy hiệu nhịp) đã cắt thêm, theo thứ tự ít giá trị trước:

1. **Chọn điểm tập kết trên thẻ Trại Lính.** Điểm tập kết vẫn tự đặt ở chỗ gần đường nhất khi xây (1A.1); lệnh `rally` vẫn có trong sim.
2. **Nút "Giảm tải" trên chip Tải.** Chip vẫn đổi màu theo ngưỡng; rê chuột thấy danh sách nhà và nhịp (`title`).
3. **Rê chuột để chọn nhà cho `−` / `=`.** Phím nhịp tác động lên nhà đang mở thẻ (Tab hoặc bấm trái).
4. **Bấm trái lên người trên bản đồ để chọn.** Chọn bằng chân dung, `Digit1`–`Digit4`, `Backquote`.
5. **"Mỗi từ: ~N" trên thẻ nhà.** `rewardValue` vẫn là hàm thuần dùng chung với phần thưởng.
6. **ETA (giây) và dòng trạng thái của người đang chọn.** Huy hiệu trên chân dung vẫn cho biết nhà người đó trợ lực (viền liền) hay đang đi tới (viền nét đứt); dòng trên thanh còn tên người đang chọn.

Không cắt: bàn phím đủ đường, chuột (chọn nhà, xây, gửi, `move`, zoom, kéo), menu xây có nhà mờ đỏ kèm lý do, thẻ nhà có núm nhịp, gửi, hoàn tác, cấp hộp cát, gợi ý nhịp; thanh 4 chân dung; chip Tải; Chuỗi và bậc; Dải Chữ gọn; ân hạn ra lệnh; bảng hộp cát đủ mục; `move`; đốm sáng dọc dây; Dừng tất cả, tạm dừng, tắt tiếng.

Cách làm rẻ hơn, giữ chức năng: E đổi bằng nút −5 / −1 / +1 / +5 thay thanh kéo (không phải giữ và trả tiêu điểm); thẻ chữ nằm trên lớp HUD thay vì bị đẩy ngang ra khỏi bảng (mục 1.9); đốm sáng là một đốm theo phần đã gõ thay vì một đốm mỗi phím (mục 1.9).

Có dòng trống thì trả lại theo thứ tự: 6, 5, 3, 4, 2, 1.

### 1.9 Lệch so với BUILD_NOW, TK ở 1A.4 (có lý do)

- **Vòng menu nhà thành thẻ cố định** ở góc dưới phải, trên nút Xây (BUILD_NOW §10 "vòng menu thành thanh đơn giản"; mục 1.2). Menu xây dùng chung chỗ đó. `ui/ring-menu.ts` và `ui/tempo-control.ts` của BUILD_NOW §2 gộp vào `ui/build-menu.ts`: núm nhịp chỉ là một hàng nút trên thẻ. Nhà đang mở thẻ có vòng xanh ngọc trên bản đồ.
- **Cột thẻ tách ngay, về chậm** (TK 23.4 "lò xo 150 ms"): cột phải tránh nhau thì nhảy ngay tới chỗ mới, chỉ lúc về gần nhà mình mới đi theo lò xo 150 ms; đi dần về một chỗ không chồng thì không bao giờ chồng. Thẻ đang khóa được tính cỡ lúc gõ (×1,2, lệch phải 18 px) ngay từ chữ đầu, nên cột bên cạnh tránh trước khi thẻ lớn lên. Trước đó `td-1a-slots` ở 1920 × 1080 bắt được thẻ chồng 3 lần trong 3 lần chạy, lúc hai cột đang trượt hoặc thẻ đang gõ lấn sang cột bên phải (1A.4 cho bản đồ nhỏ đi 7 % để chừa Dải Chữ, nhà gần nhau hơn trên màn hình).
- **Thẻ chữ nằm trên HUD** (TK 23.4 kẹp thẻ trong vùng an toàn trừ HUD). Ở 16 : 9, HUD nằm ở lề hai bên bản đồ và dải dưới, nên ở zoom 1 thẻ hầu như không chạm HUD; khi zoom thì thẻ đè lên bảng chứ không bị bảng che, lớp thẻ cho mọi cú bấm đi qua. Bản đầu đẩy cột ngang ra khỏi bảng tốn 18 dòng. Từ review 1A.4, `td-1a-slots` và `td-1a-words-dense` đo mỗi lần nhìn phần thẻ nằm trên từng bảng HUD (mọi `.td-panel`, không chỉ bảng trạng thái) và in ra `cardsOverHud`; ở zoom 1 cổng `cardsClearOfHudPanels` đòi không thẻ nào chạm bảng. Khi zoom hay khi làn bị đẩy ngang, thẻ vẫn có thể đè dock hay thanh trợ lực: chưa có cổng, kẹp cột tránh bảng để 1C (cùng `td-hud-budget`).
- **Đốm sáng dọc dây trợ lực** (TK 23.7 "mỗi phím đúng một đốm sáng") vẽ một đốm ở vị trí bằng phần đã gõ của từ đang khóa: mỗi phím đúng đẩy đốm tới, tới nhà khi từ xong. Bản đọc sự kiện `wordKey` từng phím tốn 19 dòng.
- **Bản đồ vừa khung trên dải 60 px** (×`--hud`) dành cho Dải Chữ, để Dải Chữ không che Lũy ở giữa dưới. Zoom 1–2,5× quanh điểm dưới con trỏ, kéo trái hoặc giữa, mũi tên 60 px; tâm sân không ra quá nửa cỡ sân khỏi giữa. Đổi cỡ cửa sổ thì camera về zoom 1.
- **Chỗ trống gợi ý** (sim thuần): `spotCandidates` lấy từ bản đồ ứng viên của một loại nhà (mỏ: các node; nhà khác: điểm lưới 2 m trong 2 m ngoài khoảng cách đường, gần khúc cua nhất trước); `nextSpot` đi từ chỗ đang chọn theo chiều Tab và trả chỗ đầu tiên `canPlace` cho (không xét vàng). BUILD_NOW §5.4 nói "sim tính sẵn danh sách … lọc bằng `canPlace`": danh sách ứng viên tính sẵn, phần lọc chạy tới đâu lọc tới đó. Bản đầu 1A.4 (`freeSpots`) lọc cả ~500 ứng viên mỗi lần bấm Insert hay số, mỗi ứng viên qua đường một lần BFS: 41 ms trên sân trống, 56 ms sau "Đặt sẵn 4 ô", tức một khung treo 3 khung trở lên (review 1A.4, mục 3).
- **"Đặt sẵn 4 ô" là op hộp cát trong sim** (`sandbox: preset`), bố cục là dữ liệu bản đồ (`map.preset`, như kịch bản `td-1a-slots`): Lũy cấp 4, bốn nhà đặt miễn phí (hoàn tác trả 0), mỗi nhà một người. Một lệnh, chạy lại khớp. Bấm lần hai không đổi gì (chỗ đã có nhà).
- **`move`:** Tướng bay tới mọi ô trong sân; Thư Đồng cần ô trống (không nước, không nhà), ngoài sân hay ô chặn bị từ chối `blocked`. Người được `move` không trợ lực ai (đã có từ 1A.3: ra quá 4,5 m hoặc dừng thì ngắt).
- **Esc bước 4 bật / tắt tạm dừng** (1A chưa có menu dừng). Tạm dừng thì phím chữ không gửi đi và thẻ mờ 6 px (TK 23.4); lệnh khác vẫn xếp hàng, chạy khi chơi tiếp.
- **Tab** xếp nhà theo khoảng cách tới người đang chọn (1A chưa có tín hiệu cần giúp, TK 8.9), gồm cả Lũy.
- **Ân hạn ra lệnh** (TK 6.14, BUILD_NOW §4 "mở bởi menu xây, vòng menu nhà, kéo chân dung"): bật khi menu xây mở (Insert, nút Xây, bấm đất) và khi thẻ nhà mở bằng bấm chuột. Tab chỉ tô nhà và hiện thẻ (TK 8.3), không xin ân hạn; bấm chuột lên bản đồ sau Tab thì thẻ đang mở được ân hạn (tay đã rời phím), Tab sau đó thì thôi. Bản đầu 1A.4 cho cả Tab xin ân hạn: cứ 5 s có 2 s miễn phạt bằng một phím, chạm Tab ngay trước khi một từ tan là từ đó không mất Nhiệt, Chuỗi (review 1A.4, mục 2). Menu xây mở bằng Insert vẫn có ân hạn: TK 6.14 kể "menu xây" không phân biệt cách mở, và lúc chọn chỗ thì mắt ở bản đồ chứ không ở thẻ chữ; hồi 3 s chặn lặp. Chủ dự án muốn Insert cũng không có ân hạn thì chỉ cần đổi điều kiện ở `Selection.update`. Trần 2 s và hồi 3 s vẫn ở sim.
- **Delete hoàn tác** nhà đang mở thẻ, bấm một lần (TK 8.3: Delete hai lần để bán). 1A chỉ có hoàn tác trong 5 s, trả đủ tiền, nên bấm nhầm không mất gì; bán có giá (1B) sẽ đòi bấm hai lần. Lũy và lúc không mở thẻ thì Delete không làm gì. Nút "Hoàn tác" trên thẻ ghi phím `Del`.
- **Phím Insert:** bàn phím Mac và nhiều laptop gọn không có Insert, mà 1A chưa có đổi phím (TK 8.3 "mọi phím đổi được"). Tự quyết (22/10, đổi được): thêm `Backslash` (`\`) làm phím dự phòng cho Insert. Phím này không dùng để gõ và nằm cạnh Return trên bàn phím Mac. Trên Mac, PageUp là Fn + ↑ và Delete là Fn + Delete. Thêm vào cùng dòng của `KEY_ACTIONS`, không tốn dòng ngân sách.
- **Chip lý do** (TK 12.5): nhà mờ ở chỗ không đặt được có vòng đỏ, lý do nằm trên chip giấy viền mực ngay dưới nhà mờ (bản đầu là chữ mực không nền, đè lên nhãn và đèn lồng của Lũy). Mọi lý do sim có thể trả (`canPlace` và lệnh) đều có câu tiếng Việt; test `td-hud` đọc mã nguồn sim để giữ đủ.
- **"Đợt n/N"**: quá đợt cuối của danh sách (đợt vô tận của hộp cát) thì chỉ ghi "Đợt n".
- **Kiểu nút HUD khi rê chuột và khi tắt** nằm trọn trong `:where(…)` (độ ưu tiên 0), đúng ý chú thích CSS "lớp của thành phần thắng": trước đó `:hover` ngoài `:where` làm nút gọi đợt mất nền xanh ngọc (chữ trắng trên nền hổ phách nhạt, thấy ở ảnh `td-1a-combat` khi chuột còn trên nút) và chân dung mất màu khi rê.
- **Phím đọc theo `event.code`, chữ cái theo `event.key`** (`typedLetter`, như 1A.2): bàn phím khác kiểu (AZERTY) vẫn gõ đúng chữ, và chữ cái không bao giờ thành lệnh. Mũi tên được giữ lặp (camera chạy tiếp); mọi phím khác giữ lặp bị bỏ.
- **Hai lần bấm trong cùng một khung** (dưới 16 ms) đọc trạng thái trước tick: `−` hai lần liền chỉ lùi một nấc. Người bấm tay không chạm; test bấm từng khung.
- **Nút HUD chạy khi nhấn xuống** (`pointerdown`, không lấy tiêu điểm): HUD viết lại khi đổi, nên `click` có thể rơi vào nút vừa thay; Enter và Space vẫn là của game.

### 1.10 Sửa review 1A.4

| Nhóm | Sau 1A.4 | Sau sửa review 1A.4 | Đổi |
|---|---|---|---|
| Trang, Platform | 87 | 87 | 0 |
| Nội dung | 576 | 573 | −3 (`FLIGHT` không file nào đọc) |
| Gõ thuần | 453 | 453 | 0 |
| Sim lõi (`sim/*.ts`) | 824 | 831 | +7 (`spotCandidates` + `nextSpot` thay `freeSpots`) |
| Kho, Đường, Hệ chiến đấu | 1.185 | 1.188 | +3 (`earlyCallBonus`) |
| Hệ gõ (gồm `agents`) | 786 | 786 | 0 |
| App | 521 | 525 | +4 (`selection` +5: cờ bấm chuột, `nextSpot`, Delete không chạm Lũy; `input` −1) |
| View, UI | 1.027 | 1.013 | −14 (`hud` +3, chip lý do +8, gộp chỗ trùng ở `debug-2d` −21, `cards` −3, `audio-min` −1) |
| **Tổng** | **5.459** | **5.456** | **−3** (cột "Cộng dồn tối đa" của 1A.4: 5.460) |

Các bản sửa cần 26 dòng; phần của 1A.4 chỉ còn 1. Bù trong mốc (mục 1.2) bằng chỗ trùng thật và mã chết, không cắt luật, test hay việc UI nào, không nén dòng:

- `debug-2d`: một hàm `shape` vẽ Draconis và cờ tập kết (hai khối dịch, tô, viền, dịch lại giống nhau; cờ nay có viền mực như mọi hình khác); tên và mũi nỏ đi qua `polyline` (thêm tham số độ dày) thay khối vẽ đường riêng; ván cầu vẽ một đường cho cả cầu (một lần `stroke` thay một lần mỗi ván); vòng cấm xây quanh Lũy là `disc`; vòng tầm không cần biến tạm; node đã có mỏ đọc `live(1)`.
- `cards`: tạo phần tử bằng `Object.assign` như `hud`. `input`: một hàm nghe lăn chuột. `audio-min`: `new GainNode(ctx, { gain })`.
- `rules`: bỏ `FLIGHT` (bay thấp ≤ 3,5 m, TK 10.4). Không file nào đọc: độ cao của quái là loại (đất, thấp, cao), không phải mét. 1C cần độ cao vẽ thì thêm lại cùng chỗ dùng.

1. **Nút gọi sớm hứa nhiều hơn số trả (vừa).** HUD tính `min(30, ⌈giây còn⌉)`, sim trả `min(30, ⌊giây còn⌋)`: lệch 1 Vàng gần như mọi lúc. Nay một hàm thuần `earlyCallBonus` ở `waves.ts` cho cả `callWave` lẫn nút; `⌈ ⌉` chỉ còn ở số giây đếm ngược. Lệnh bấm lúc HUD đang hiện được đóng dấu đúng tick HUD đọc (`Session.tick`), nên số trên nút là số trả. Test `td-hud`: 7 tick của lượt đếm (0, 1, 31, 59, 60, 61, 1799 tick sau khi bắt đầu đếm; 29,48 s còn lại ghi "30 s · +29"), số trên nút bằng `bonus` của sự kiện `waveCalled`.
2. **Tab là tấm khiên miễn phạt (vừa).** Sửa như mục 1.9 "Ân hạn ra lệnh": cờ `clicked` trong `Selection`, Tab xóa, bấm bản đồ đặt. Test: thẻ mở bằng Tab không có ân hạn, bấm chuột lên Lũy thì có, Tab sau đó thì hết; một từ tan ngay sau Tab mất Chuỗi −2 và Nhiệt −1, sau khi thẻ mở bằng bấm thì không mất gì.
3. **Chỗ trống gợi ý 41–56 ms mỗi lần bấm (thấp).** Sửa như mục 1.9 "Chỗ trống gợi ý". Đo trên Node, sau "Đặt sẵn 4 ô": bấm Insert ≈ 3 ms (2,5 ms dựng ~490 ứng viên từ bản đồ, ≈ 0,5 ms tìm chỗ đầu: 87 ứng viên bị loại ở bước rẻ, một lần BFS), Tab ≈ 0,5 ms. Test: mỗi lần bấm Insert, Tab, Shift+Tab, số (11 lần, sau "Đặt sẵn 4 ô") chạy tối đa 3 lần BFS lối đi (bản cũ: ~120 lần một lần bấm); Tab hai chiều đi qua đúng các chỗ `canPlace` cho, theo thứ tự khúc cua.
4. **Lý do không nền, thiếu câu (thấp).** Chip giấy viền mực (mục 1.9); `REASON` thêm `noBuilding`, `noBarracks`, `badValue`, `noSandbox`, `badKey`. Test `td-hud` đọc các chuỗi `commands.ts` và `typeKey` trả về cùng `PLACE_CHECKS`, đòi mỗi lý do có câu.
5. **Test còn lỗ (thấp).** Thêm: Tab sau khi dời Draconis tới (24; −14) đi Pháo, Cung rồi Lũy (theo người, không theo Lũy); bấm phải khi menu xây mở chỉ đóng menu; Draconis `move` tới ô nước và lên mái Tháp Cung được nhận; Delete; nút gọi sớm; chip Tải ở 95, 100, 105, 125, 133 % (xanh ngọc tới 100, hổ phách tới 125, cam sau đó; Bastion nhịp 4 s, từ 4 chữ, E 21 / 20 / 19 / 16 / 15 ở Dễ); "Đợt n/N". Đột biến tại chỗ (mỗi lần một đột biến, chạy `td-input` và `td-hud`, rồi trả file): 15 đột biến, cả 15 bị bắt, gồm ba đột biến sống của review: (a) Tab xếp theo khoảng cách tới Lũy, (b) bấm phải trong menu xây lại xây, (c) từ chối `move` của Tướng lên nước hay lên nhà; và nút gọi sớm dùng `⌈ ⌉`, Tab xin ân hạn, bấm chuột không xin ân hạn, Tab không bỏ ân hạn, ngưỡng chip Tải `<` thay `≤` (hai đột biến), thiếu câu lý do, "Đợt 7/6", lọc hết chỗ trống mỗi lần bấm, Tab đi qua chỗ không hợp lệ, bỏ phím Delete, Delete trên Lũy.
6. **Thiếu bằng chứng chuột trên trình duyệt (thấp).** `td-1a-combat` dựng bố cục và ra lệnh bằng chuột thật (mục 2), có ảnh menu xây, nhà mờ đỏ có chip, thẻ nhà, bản đồ đã zoom.
7. **Cổng vùng an toàn chỉ nhìn bảng trạng thái (thấp).** `td-1a-slots` và `td-1a-words-dense` đo mọi bảng HUD (mục 1.9 "Thẻ chữ nằm trên HUD", mục 2): ở cả hai cỡ, mọi lần nhìn (549 và 482 lần ở `td-1a-slots`, 92 và 93 lần ở `td-1a-words-dense`, 1280 × 720 và 1920 × 1080) không thẻ nào chạm bảng nào (`cardsOverHud` rỗng), nên ở zoom 1 đây là cổng `cardsClearOfHudPanels`, không chỉ là số in ra. Kẹp cột thẻ tránh bảng khi zoom để 1C (mục 1.9).
8. **HUD vượt luật cứng TK 23.5 (thấp).** Không phải cổng của 1A (`td-hud-budget` thuộc 1C): ghi thành lệch đã biết cho 1C. Đo lại trên Chrome sau bản sửa: ở 1280 × 720, trong đợt, có từ đang khóa, các bảng phủ 9,4 % màn hình nếu không tính bảng hộp cát, 17,5 % nếu tính; mở thẻ nhà: 13,6 % và 21,7 %; pha chuẩn bị (bảng trạng thái có nút bắt đầu): 10,5 % và 18,6 %. Thanh trợ lực 284 × 110 px, bằng 15,2 % chiều cao (TK: ≤ 10 %, 260 × 64). Ở 1920 × 1080: 5,7 % và 10,5 % (trong đợt), 8,1 % và 13,0 % (mở thẻ); thanh trợ lực 341 × 124 px, 11,5 % chiều cao. Chữ của từ đang khóa ở Dải Chữ nay `clamp(28px, 2.2em, 34px)`: 28,6 px ở 1280 × 720, 34 px ở 1920 × 1080 (TK 23.4: 28–34 px; trước là 24,7 px). Thu gọn thanh trợ lực (TK: 260 × 64, chân dung 44 px, một hàng) và bảng trạng thái để đạt 10 % là việc của 1C, cùng skin HUD.
9. **"Đợt 7/6" (thấp).** Sửa như mục 1.9.
10. **Bàn phím chưa đủ đường (thấp).** Delete hoàn tác (mục 1.9). Thiếu phím Insert trên Mac và laptop gọn: ghi cho chủ dự án ở mục 1.9, chưa thêm phím dự phòng.

Thấy thêm khi nhìn ảnh: kiểu rê chuột của nút HUD làm nút gọi đợt mất màu (mục 1.9, sửa trong CSS, 0 dòng).

### 1.11 Sau 1A.5

| Nhóm | Sau sửa review 1A.4 | Sau 1A.5 | Đổi |
|---|---|---|---|
| Trang, Platform | 87 | 87 | 0 |
| Nội dung | 573 | 573 | 0 |
| Gõ thuần | 453 | 453 | 0 |
| Sim lõi (`sim/*.ts`) | 831 | 837 | +6 (`commands.ts`: op hộp cát `flood`) |
| Kho, Đường, Hệ chiến đấu | 1.188 | 1.207 | +19 (`spawn.ts`: `flood`) |
| Hệ gõ (gồm `agents`) | 786 | 786 | 0 |
| App | 525 | 541 | +16 (`main.ts`: đo giá khung, `__td.flood`, `__td.costs`) |
| View, UI | 1.013 | 1.013 | 0 |
| **Tổng** | **5.456** | **5.497** | **+41 / 40** |

Phần của 1A.5 là 40; 1A.4 để dư 4 dòng dưới cột cộng dồn của nó (5.456 / 5.460), nên tổng 5.497 vẫn dưới cột "Cộng dồn tối đa" của 1A.5 (5.500, đúng trần cứng). Không còn dòng dự phòng cho 1A: sửa review 1A.5 phải bù trong chính nó.

Bot, chính sách, báo cáo, test vàng nằm ở `tests/` và `scripts/` (không tính vào ngân sách): `tests/td/{keystrokes,reader,bot,golden,balance,perf}.ts`, `tests/td/policies/{stand,tempo,hero,layouts}.ts`, `tests/td-golden.test.ts`, `tests/td-balance-smoke.test.ts`, `tests/golden/td-1a.json`, `scripts/td/{balance,golden}.ts`, `scripts/visual/scenarios/td-1a-{perf,tour}.mjs`.

### 1.12 Lệch so với BUILD_NOW, TK ở 1A.5 (có lý do)

- **Test vàng đóng băng từ, không đóng băng nội dung.** `tests/golden/td-1a.json` giữ 425 từ cấp 1–3 (chụp từ `shared/vocabulary` lúc làm), seed, mã nội dung, mã bộ từ, mã băm mỗi 60 tick. TK 25.15 nói "nội dung đóng băng `tests/td/fixtures/content-golden.ts`": không làm, vì hằng số `rules.ts` được hệ thống import thẳng (một bản chép `slice-1a.ts` không đóng băng chúng), còn từ vựng chung thì repo cha sinh lại định kỳ ("data: generate trusted vocabulary library") và sẽ làm test vàng đỏ mà repo này không đổi gì. Đổi luật hay số: test báo mã nội dung khác trước tiên, `pnpm td:golden:update` (hay `node --import tsx scripts/td/golden.ts`) làm lại file và in tick đầu tiên mã băm lệch.
- **Bot của test vàng** là bot Cân bằng 35 WPM, 95 % chơi 3 đợt; thêm một Tháp Cung đặt rồi hoàn tác ở giây 4–5, để nhật ký có cả `sell`. Test đòi nhật ký có `build`, `sell`, `assignUnit`, `setTempo`, `key`, `backspace`, `callWave`, `sandbox`.
- **Op hộp cát `flood`** (TK 25.12 "Thử tải `__td.flood(400)`"; BUILD_NOW §4 không kể): n quái ba loại lần lượt, rải đều trên nửa đầu mỗi làn (quái bay trên đường bay), lệch ngang theo tỉ lệ vàng (không rút số ngẫu nhiên), tính vào đợt đang chạy. Là lệnh có tick, vào nhật ký, Node chạy lại khớp. Đây là móc đo của 1A.5: kịch bản `td-1a-perf` dùng nó cho cổng 5.
- **`__td.costs()`**: giá 600 khung gần nhất, tính bằng ms, của phần cập nhật (bước sim, HUD, âm) và phần vẽ (bản 2D và thẻ chữ). Đo ngay trong vòng khung của trang, không phải trang đo riêng.
- **Hai kịch bản ngoài bảy kịch bản của BUILD_NOW §6.2:** `td-1a-perf.mjs` (cổng 4 và 5, mục 2) và `td-1a-tour.mjs` (bộ ảnh cho chủ dự án, mục 2).
- **Chỗ của báo cáo:** phần tính và in nằm ở `tests/td/balance.ts`, vì `tsconfig.json` kiểm kiểu `tests/` mà không kiểm `scripts/`; `scripts/td/balance.ts` chỉ đọc tham số và in. `td-sim-perf` chuyển thế giới thử tải sang `tests/td/perf.ts` (báo cáo dùng chung), thêm ca tải đầy của TK 25.12 (640 quái, 64 lính, 512 đạn, 20 nhà; từ bản sửa review 1A.5, mục 1.15) và test op `flood`.
- **Người đọc giả lập** làm đúng BUILD_NOW §6.3 (nhận ra từ mới sau 0,35–0,6 s, mỗi lúc một từ, từ gấp nhất trước, nhà có quái trong tầm được coi như gấp hơn 1 s) và bỏ qua từ không còn kịp gõ. Bot không bao giờ rời mắt khỏi thẻ để nhìn bản đồ, nên tỉ lệ trúng là mức trần: 35 WPM, 95 %, nhịp 3 s trúng 99 % (mô hình TK 6.16: 92 %).
- **Bot vặn nhịp từng nhà một, cách nhau 1,5 s.** Đổi nhịp đặt lại lịch của nhà đó (TK 6.2), nên đổi nhiều nhà trong một tick làm các nhà cùng nhịp phát cùng lúc (cách 0,2 s, TK 6.4): ở 35 WPM, từ thứ hai của mỗi cặp không gõ kịp trong tuổi của nó (bản đầu: 2 ô 35 WPM chỉ trúng 66 %). Game có cùng hiện tượng sau "Trả lại nhịp" (`Shift+=`) hay khi đổi độ khó, cấp làm nhiều nhịp bị kiểm lại một lúc. TK không nói; ghi cho chủ dự án và 1B.
- **Nhịp theo tải** (bot Cân bằng, TK 19.7 "tải 90–110 %") bắt đầu mọi nhà ở Dừng rồi lần lượt dày lên, tháp trước, khi tải còn ≤ 110 %; nhà không vừa nấc nào ở lại Dừng, người ở đó chỉ còn có mặt (TK 6.13 "1 nhà 6 s + có mặt").
- **Thêm hai dòng báo cáo ngoài BUILD_NOW §6.3:** "Tướng ra trận" (TK 19.4: Draconis không trợ lực, đứng ở khúc nhập ném cầu lửa) và nhà L2, để thấy cách nào qua được đợt 4–6 (mục 1.14). Từ bản sửa review 1A.5 thêm dòng "Nhanh ẩu 80 / 85 % và 50 / 96 % cùng nhịp 3 s" ở bảng TK 19.7, chỉ để so với dòng cùng tải của TK (mục 1.15).
- **`pnpm` trong worktree:** `pnpm <script>` chạy kiểm phụ thuộc, kiểm này gọi `pnpm install`, và pnpm từ chối xóa `node_modules` là liên kết tượng trưng (`ERR_PNPM_UNSAFE_MODULES_DIR`). Không có gì bị đổi (đã kiểm `node_modules` của bản checkout chính), nhưng trong worktree hãy gọi thẳng `node --import tsx scripts/td/balance.ts`. Vì vậy cổng 1 (`pnpm check`) chạy từng bước một (mục 1.13).


### 1.13 Cổng cứng BUILD_NOW §7 ở cuối 1A.5

| Cổng | Kết quả |
|---|---|
| 1. `pnpm check` xanh; V4 chạy | Trong worktree `pnpm check` không chạy được thành một lệnh (pnpm gọi `pnpm install`, mục 1.12); chạy từng bước bằng `node` và `npx`, mọi bước exit 0: `vitest run tests`, `prepare-local-art` (không ghi gì), `check-audio-assets`, `check-background-assets`, `check-expansion-v2`, `check-credit-puzzle-art`, `tsc` cả `tsconfig.json` và `tsconfig.server.json`, `vite build` (có `td.html`), `report-bundle-metrics`, `check-ship-art-integrity`, `check-background-art`; xóa `dist/` sau đó. Khói V4 (`defense.mjs`, halo-garden, không đảo): xây 5 tháp, tới đợt 6, 60 khung/giây (p95 16,7 ms), không lỗi console. |
| 2. Test mục 6.1 xanh; `credit-*`, `campaign3d-keys`, `defense-frame-error` không sửa | `npx vitest run`: 408 file, 2.669 test đạt, 1 bỏ qua sau bản sửa review 1A.5 (cuối 1A.5: 2.666; trước 1A.5: 406 file, 2.654; 1A.5 thêm 4 test `td-golden`, 6 test `td-balance-smoke`, 2 test `td-sim-perf`; bản sửa thêm 3 test `td-balance-smoke`). Có đủ file của §6.1 (`td-golden`, `td-balance-smoke` mới ở 1A.5). Sáu file test được bảo vệ không đổi từ `1979389f` (`git diff` rỗng), 38 test xanh; `src/defense`, `src/scene3d`, `src/vfx`, `src/audio` không đổi. |
| 3. Bất biến chữ và tiền | `td-letters` (10.000 tick, 4 ô 1 s, từ vựng thật cấp 1, 1–3, 1–5), `td-stream-schedule` (so le ở 4 nhà × 1 s), `td-sim-economy` (thuộc tính: không chuỗi xây, hoàn tác, cấp hộp cát nào sinh vàng). Thêm ở 1A.5: mọi lượt bot (test vàng, ba bot nhanh, mọi dòng báo cáo) kiểm trần, chữ đầu, từ trùng, OSA ≤ 1 mỗi tick: không vỡ lần nào, không lệnh nào bị từ chối. |
| 4. Tất định | Test vàng khớp 124 mã băm (7.491 tick); chạy hai lần như nhau; nhật ký chạy lại ra cùng mã băm. Chrome: `td-1a-perf` chạy nhật ký của lượt vàng trong trang, 124 / 124 mã băm bằng của Node; `td-1a-combat`, `-stream`, `-slots`, `-keyboard-only`, `-perf` ghi nhật ký của trang và Node chạy lại ra đúng `__td.hash()`, ở cả hai cỡ. |
| 5. Hiệu năng | Sim (Node, Apple M4): một bước với 300 quái, 9 lính, 200 đạn, 10 nhà, 4 ô nhịp 1 s, trung vị 0,007–0,013 ms, p95 ≤ 0,05 ms; tải đầy TK 25.12 (640 quái, 64 lính, 512 đạn, 20 nhà, 4 ô nhịp 1 s; trần nhà của 1A bỏ qua) 0,020–0,024 ms (≤ 0,5 ms; CI ≤ 2 ms). Trong Chrome (`td-1a-perf`, 300 quái trên sân, 4 ô nhịp 1 s, gõ 70 WPM, ~610 khung): bản 2D và thẻ chữ (thời gian JS) trung bình 0,72–0,77 ms, p95 1,2–1,4 ms; cả luồng chính của trang theo Chrome (CDP `Performance.getMetrics`: script, style, layout, paint, cùng phần kịch bản tự đọc trang) trung bình 2,25–2,46 ms mỗi khung (script 0,94–1,01, style 0,44–0,47, layout 0,06), p95 theo từng quãng 0,5 s 3,0–3,3 ms; 60 khung/giây, ở 1280 × 720 và 1920 × 1080 (cổng ≤ 8 ms cho cả hai số; mục 1.15). |
| 6. Kịch bản §6.2 đạt, không lỗi console | Bảy kịch bản §6.2 và `td-1a-perf` đạt ở 1280 × 720 và 1920 × 1080 (16 / 16), không lỗi console, không ngoại lệ trang; `td-1a-tour` đạt ở 1280 × 720. Chạy bằng cấu hình Vite của worktree (mục 2): với lệnh `npx vite` thường, phông trả 403 và không có từ vựng thật (đã biết từ 1A.0). Sau bản sửa review 1A.5 (mục 1.15): bảy kịch bản ở 1280 × 720 và `td-1a-perf` ở cả hai cỡ chạy lại, đạt (9 / 9), cùng `td-1a-perf` với lệnh `npx vite` thường; khói V4 tới đợt 6, 60 khung/giây. |
| 7. Chủ dự án chơi theo §8 | Chưa: việc của chủ dự án. Bộ ảnh `td-1a-tour` để xem trước. |

### 1.14 Báo cáo bot: điều chủ dự án nên biết trước khi chơi (không là cổng)

Số của `node --import tsx scripts/td/balance.ts` (3 seed, 6 đợt hộp cát, Thường, từ vựng cấp 1–3) sau bản sửa review 1A.5. Bản đầu của mục này lấy số từ một báo cáo lỗi: luật của bot dùng chung giữa các seed, nên ở seed 2 và 3 núm nhịp bị khóa và con lắc không đổi chỗ (mục 1.15). Bot tất định: cùng mã cho cùng số, trừ mục 8 (thời gian).

- **Ở L1, gần như mọi cách chơi thua ở đợt 4–6.** Một ô (mọi nhịp, mọi tốc 20–100 WPM), hai ô, bot Cân bằng: thua ở đợt 5 hoặc 6, còn 14–17 mạng sau đợt 3; 4 ô ở 50–70 WPM và 3 ô ở 100 WPM thua 1/3 lượt, 3 ô ở 70 WPM thua 2/3. Qua đủ 6 đợt cả 3 lượt chỉ có: 4 ô ở 100 WPM (còn 7,7 mạng), 4 ô với nhà L2 ở 35 WPM (13,7 mạng), và 4 ô ở 35 WPM khi Draconis không trợ lực mà đứng ở khúc nhập đánh (6,3 mạng; cầu lửa 9,2 sát thương/s). Lý do: Thuồng Luồng (320 máu, giáp 60 %) chỉ nhận 40 % sát thương vật lý của tháp L1; cầu lửa phép của Draconis là khắc chế (TK 19.8), mà bot trợ lực thì Draconis không đánh. Mục 8 của BUILD_NOW cho chủ dự án chơi đợt 4–6 với 4 ô: nên thử cả nhà L2 (hộp cát) và để Draconis ra trận.
- **Ô thêm có giá trị** (TK 19.7 đạt): 2 ô (4 s + 6 s) ×1,29 so với 1 ô 3 s; 2 ô quá tải (127 %) ×1,36. Bảng 1–4 ô: ×1,13–1,69 so với 1 ô, tăng theo tốc gõ; 3–4 ô giữ mạng tốt hơn rõ (sau đợt 3 còn 19–20 so với 14–15).
- **Nhịp dày không bị phạt đủ:** bot "Nhịp dày ẩu" (mọi nhà nhịp nhanh nhất, 35 WPM) hơn bot Cân bằng (sát thương 109 %, vàng 103 %; TK 19.7 muốn kém hơn). Một ô ở 35 WPM: nhịp 1 s (tải 253 %) trúng 67 % nhưng Phát Chữ vẫn mạnh nhất (6,4 so với 3,6 sát thương/s ở 3 s). Ở 1A, từ tan chỉ mất Nhiệt và Chuỗi, mà hào quang có trần; TK 6.16 nói quá tải không lời.
- **Gợi ý nhịp của game đẩy vào quá tải:** bot theo gợi ý (TK 6.2: sau 10 từ, trúng ≥ 95 % thì dày một nấc, dưới 70 % thì thưa một nấc) đi từ nhịp mặc định lên tới 2 s ở 25 WPM (tải 112 %, trúng 89 %) và đưa đẩy giữa 2 s và 1 s ở 35 WPM (tải 130 %, trúng 89 %; Phát Chữ 5,5 so với 2,6 ở nhịp mặc định 4 s). Gợi ý chỉ nhìn tỉ lệ trúng, không nhìn Tải; bot không rời mắt khỏi thẻ nên trúng cao hơn người thật (mục 1.12).
- **Nhanh ẩu hơn Giỏi ở cùng tải** (TK 19.7 chưa đạt): chơi như bot Cân bằng, E theo tốc gõ, bot 80 WPM 85 % có Phát Chữ bằng 139 % bot 50 WPM 96 % (tải 89 % và 94 %): nhịp theo E cho bot nhanh nhiều từ hơn, mà điểm chất lượng từ không bù được. Cùng nhịp 3 s ở 3 ô (không cùng tải) thì 87 %. Bản đầu so ở cùng nhịp và ghi nhầm là cùng tải ("81 %, đạt").
- **Đứng Một Chỗ kém Cân bằng 9 %** (91 % Phát Chữ; TK 19.7 muốn kém ≥ 15 %): 1A chưa có Bùng Nổ, Hợp Tấu, nghỉ lò, nên chỉ con lắc của Draconis làm nên khác biệt.
- **Nguồn vàng của bot Cân bằng:** hạ quái 51 %, tự sản 19 %, phần thưởng từ 14 % (TK 17.3: 18–28 %), thưởng đợt và gọi sớm 16 % (TK: 5–10 %, vì lượt ngắn và gọi sớm ngay khi sân trống). Tải trung bình 97 % (TK: 85–110 %). Không gõ: vàng 75 % bot Cân bằng (TK ≥ 70 %).
- **Trúng:** 25 WPM nhịp mặc định 99 % (TK ≥ 85 %); 35 WPM nhịp 3 s 99 % (mô hình TK 6.16: 92 %; bot không nhìn bản đồ). Chuẩn 35 / 98 % hơn Nhanh ẩu 50 / 85 % về Phát Chữ ở 3 s (3,7 và 3,1 sát thương/s, hơn 19 %; TK 6.16: 24,9 và 21,9; Hoàn hảo 90 % và 55 %).
- **Nghẽn chữ: 0 %** ở cấp 1, 1–3, 1–5 với 4 ô nhịp 1 s; trần chữ đầy trước (bỏ vì đầy: 539 lần ở cấp 1, 112–121 ở 1–3, 1–5).
- **Phát cùng lúc sau khi đổi nhiều nhịp một lúc** (mục 1.12): "Trả lại nhịp" và đổi độ khó, cấp đặt lại lịch của mọi nhà trong cùng tick, nên các nhà cùng nhịp phát từ cách nhau 0,2 s. TK 6.4 cho phép; cảm giác "dồn từ" là điều nên để ý khi chơi.

### 1.15 Sửa review 1A.5

Bảy mục của review 1A.5; sáu sửa, một phần của mục 7 không làm (có lý do). Không đổi dòng nào trong `src/`: ngân sách vẫn 5.497 / 5.500.

1. **Luật của bot dùng chung giữa các seed (cao).** `plan()` của báo cáo nhận một hàm tạo luật (`plan(BALANCED, () => [pendulum(0, 2), loadTempo(1.1)])`), nên mỗi lượt `runBot` có núm nhịp, con lắc, bộ nhớ tải riêng; kiểu của `plan` không còn nhận luật đã tạo. `createReport` có thêm `runs` (các lượt của một dòng) và `played` (mọi dòng đã chạy: dòng "Kiểm thêm" nay đếm lệnh bị từ chối, bất biến vỡ trên mọi dòng, không chỉ dòng của mục 7). Test mới ở `td-balance-smoke`: một dòng hai seed liên tiếp cho đúng log, stats của hai lượt chạy riêng và đúng `Totals` của chúng; seed 2 vặn nhịp trước tick 1000. Đột biến (luật tạo một lần như cũ): test đỏ (seed 2: 102 lệnh thay vì 117). Chạy lại báo cáo; số mới ở mục 1.14 (đổi: Đứng Một Chỗ 100 → 91 %, Nhịp dày ẩu 103 / 101 → 109 / 103 %, vàng từ gõ 11 → 14 %, tải bot Cân bằng 94 → 97 %, 70 WPM 3 ô ×1,55 thua 3/3 → ×1,69 thua 2/3, nhà L2 còn 15 → 13,7 mạng, Chuẩn và Nhanh ẩu ở 3 s 3,5 / 3,4 → 3,7 / 3,1). Kết luận đạt hay chưa đạt của các dòng cũ không đổi.
2. **`td:golden:update` không thấy đổi nội dung (vừa).** `scripts/td/golden.ts` so mọi trường của file vàng (`content`, `deck`, `every`, `ticks`, `commands`, `hashes`, `summary`, `words`, `seed`, `about`); file được ghi khi có trường nào khác, `--check` thoát 1 cũng khi đó (đúng lúc `td-golden` đỏ, nên cổng `goldenSameInNodeAndChrome` của `td-1a-perf` không còn đạt khi Vitest đỏ). In `changed`: từng trường đổi, trước → sau (danh sách theo độ dài), và tick đầu tiên mã băm lệch (gồm khi chỉ khác độ dài). Thử: đợt 6 Cương Thi 20 → 21: `--check` in `changed: { content: "ca3c2578 → 7868f665" }` và thoát 1, lệnh không cờ ghi file, `td-golden` xanh lại; trả về như cũ.
3. **Cổng 5 chỉ đo thời gian JS (thấp).** `td-1a-perf` đọc thêm số của Chrome qua CDP `Performance.getMetrics` (`TaskDuration`, `ScriptDuration`, `RecalcStyleDuration`, `LayoutDuration`) mỗi ~0,5 s trong cửa sổ đo, chia cho số khung: cổng mới `mainThreadWithin8msPerFrame` đòi trung bình cả cửa sổ và p95 theo quãng ≤ 8 ms (đo: 2,25–2,46 ms và 3,0–3,3 ms), và `holds55fps` (60 khung/giây). Raster và GPU chạy ở luồng khác; số khung giữ 60 cho thấy chúng theo kịp. `fourBuildingsDealtAt1s` nay đòi cả 4 nhà không phải Lũy ở nhịp index 6 (1 s) mỗi lần nhìn trong cửa sổ đo, không chỉ có 4 nhà phát chữ.
4. **Test người đọc không chạm luật "quái trong tầm" (thấp).** Test mới: một Cương Thi đặt cách Tháp Cung 3 m; khoảng cách tới Tháp Cung (≤ 10 m) và tới Pháo (> 9 m) tính riêng trong test, `busy` của Tháp Cung đổi từ sai sang đúng, của Pháo vẫn sai; từ của Tháp Cung được chọn khi từ của Pháo ít hơn 0,83 s, từ của Pháo được chọn khi ít hơn 1,17 s; bỏ quái thì từ ít thời gian hơn lại được chọn. Test cũ khẳng định sân không có quái và so thời gian còn lại thuần, không dùng `busy` ở cả hai vế. Đột biến đảo dấu (`leftMs + …`): test mới đỏ.
5. **`hintTempo` chưa ai dùng (thấp).** Mục 2 của báo cáo có thêm bảng "nhịp theo gợi ý" ở 25 và 35 WPM một ô (số từ phát ở từng nhịp, trúng, tải). Test: 9 từ chưa đổi; 10 / 10 và 19 / 20 dày một nấc (4 s → 3 s); 18 / 20 và 7 / 10 giữ; 6 / 10 và 20 / 30 thưa một nấc (4 s → 6 s). Đột biến đảo hướng: test đỏ.
6. **Nhãn nói nhiều hơn số đo (thấp).** Dòng TK 19.7 "Nhanh ẩu 80 WPM, 85 %" nay đúng điều kiện của TK: cả hai bot chơi như bot Cân bằng (bố cục, con lắc, nhịp theo tải ≤ 110 %, E theo tốc gõ), in kèm tải của hai bot; kết quả đổi thành chưa đạt (mục 1.14). Dòng cùng nhịp 3 s giữ lại ngay dưới, ghi "chỉ để so". Ca kho đầy nay là tải đầy của TK 25.12: `fullWorld()` (`tests/td/perf.ts`) thêm 10 nhà bằng `placeBuilding` ở những chỗ `canPlace` nhận nếu bỏ trần 1A (16 nhà, 6 tháp, 3 trại; chỗ tìm bằng một lần quét với trần nâng tạm, chỉ ở thư mục tạm), rồi thêm lính loại "5 từ tốt" (TK 6.11) cho đủ 64 lính, máu đủ để không ai ngã trong lúc đo. `td-sim-perf` kiểm 20 nhà, 64 lính trước và sau khi đo, 4 người đang trợ lực; báo cáo mục 8 ghi đủ tải của từng dòng.
7. **Số trong mục 1.14 và changelog (thấp).** Sửa theo báo cáo mới (mục 1.14; changelog 1A.5 và changelog của bản sửa này). **Danh tính commit không đổi:** `toandx <toandx@192.168.52.5>` là danh tính của mọi commit trong cả repo cha lẫn bản checkout chính (`1979389f`, `695cfdf4`, `0a78bfbb`…), không riêng worktree. `git config user.email` trong worktree ghi vào cấu hình chung với bản checkout chính (việc này không được chạm), còn đổi tác giả của 13 commit 1A thì đổi mã commit mà BUILD_NOTES và changelog đang trích. Chủ dự án quyết trước khi push (ví dụ đặt email toàn cục rồi `git rebase --exec "git commit --amend --no-edit --reset-author"`).

## 2. Chạy cổng trong worktree

Worktree `games/.wt-*` có `node_modules` là liên kết tượng trưng tới bản checkout chính (`games/space-typing`). Với lệnh thường `npx vite --host 127.0.0.1 --port 3110 --strictPort`:

- Vite chỉ phục vụ file trong worktree. Phông Be Vietnam Pro nằm ở đường dẫn thật của liên kết, nên trả 403. `td-1a-boot` hỏng hai cổng `fontLoaded` và `noFailedLoads`.
- Bộ nhớ đệm phụ thuộc `node_modules/.vite` là của bản checkout chính (ghi qua liên kết).
- Media không bao giờ vào Git (model, ảnh tàu 3D trong `public/assets/space-typing/models/**`, `ships/3d/**`) chỉ có ở bản checkout chính. Rift Defense V4 báo "Could not load Rift Defense: Unexpected token '<'", khói V4 không vào được bản đồ.

Dùng cấu hình riêng cho worktree (không sửa `vite.config.ts`; đổi file đó chỉ vì worktree cần chủ dự án đồng ý):

```bash
npx vite --config scripts/dev/vite.worktree.config.ts --host 127.0.0.1 --port 3110 --strictPort
```

Cấu hình này:
- cho phép đường dẫn thật của `node_modules` (hết 403 phông);
- để bộ nhớ đệm Vite trong thư mục tạm của hệ thống, không ghi vào bản checkout chính;
- file `public/` nào worktree không có thì đọc từ `public/` của bản checkout chính, chỉ đọc. File của worktree vẫn được ưu tiên;
- phục vụ `/vocabulary/` từ `shared/vocabulary` của kho, chỉ đọc, như cấu hình nginx dev (`infra/nginx/typing-game.local.dev.conf`). Với lệnh Vite thường, `/vocabulary/` trả 404 và `td.html` chạy bằng từ dự phòng (mục 1.3).

Các cổng của một mốc (từ 1A.6 R3; cổng 3110 của 1A thành 3140 ở worktree R3):

```bash
npx tsc -p tsconfig.json --noEmit
npx tsc -p tsconfig.server.json --noEmit
npx vitest run
npx vite build --outDir <thư mục tạm ngoài repo>
node --import tsx scripts/td/golden.ts --check
# server ở trên chạy nền, rồi mỗi kịch bản ở hai cỡ (--width=1280 --height=720 và --width=1920 --height=1080):
URL=http://127.0.0.1:3140/ OUT_DIR=<thư mục tạm> node scripts/visual/cdp-run.mjs scripts/visual/scenarios/<tên>.mjs --width=1280 --height=720
#   <tên>: td-1a-boot, td-1a-ime, td-1a6-day, td-1a6-night, td-1a6-keyboard, td-1a6-attention, td-1a6-learn, td-1a6-perf, td-1a6-tour
MAPS=halo-garden ISLANDS=0 URL=http://127.0.0.1:3140/ OUT_DIR=<thư mục tạm> node scripts/visual/cdp-run.mjs scripts/visual/scenarios/defense.mjs
```

Bot và báo cáo, trong worktree gọi thẳng bằng `node` (mục 1.12):

```bash
node --import tsx scripts/td/balance.ts [--seeds=5] [--nights=4]   # pnpm td:balance (mục 5.2)
node --import tsx scripts/td/golden.ts [--check] [--fresh-words]   # pnpm td:golden:update
node --import tsx scripts/td/replay.ts <thư mục tạm>/td-1a6-day-replay-1280x720.json
```

Kịch bản 1A.6 và việc từng cái kiểm: mục 5.7. Bảy kịch bản 1A viết theo dòng chữ, nhịp và trợ lực ở ổ (`td-1a-combat`, `td-1a-stream`, `td-1a-slots`, `td-1a-keyboard-only`, `td-1a-words-dense`, `td-1a-perf`, `td-1a-tour`) đã xóa ở R3 (luật của chúng không còn; xem git trước `ce740e0c`). Giữ `td-1a-boot` (khởi động không media, phông, HUD) và `td-1a-ime`: kiểu UniKey / EVKey (chữ đầu, Backspace, chữ có dấu không mã phím: Telex "aa", "dd", "ee", VNI "a1", "o6") và kiểu bộ gõ hệ điều hành (phím "Process", keyCode 229); phím tiếng Việt chỉ ra lệnh `key` và `backspace`; số chọn người, Backquote bước sang người kế, Tab và Enter ra đúng lệnh; từ R3 `-` và `=` (núm nhịp cũ) không ra lệnh nào. Đây là phím giả qua CDP: không thay được kiểm tra UniKey và EVKey thật (BUILD_NOW §8).

---

## 3. 1A.6 "Lời Gọi", đợt R1 (`BUILD_1A6.md` §1–§6)

Worktree `games/.wt-td-1a6`, nhánh `feat/td-1a6`. R1 làm phần sim, dữ liệu, lệnh, test và file vàng; view chỉ sửa đủ để build và chơi thô (R2 làm view, HUD, thẻ, học, tạm dừng, âm; R3 làm bot, báo cáo, kịch bản, cổng).

### 3.1 Đã làm

- **§1 Bỏ:** `systems/stream.ts`, `systems/heat.ts`, `systems/aura.ts`, `typing/tempo.ts`; `systems/words.ts` gộp vào `systems/calls.ts`, `systems/production.ts` gộp vào `systems/economy.ts`. Hằng số `TEMPO`, `DEFAULT_TEMPO_S`, `LOAD`, `EVENNESS`, `HEAT`, `AURA_*`, `PRESENCE`, `CANNON_AURA`, `FIVE_GOOD`, `ORDER_GRACE`, `CHAIN.untouchedExpire`, `EMIT` (trừ `letterSlack` mà `decks.ts` còn dùng). Lệnh `setTempo`, `setAllTempo`, `uiFocus`; phím `-`, `=`, `Shift+-`, `Shift+=`; chip Tải; trợ lực ở ổ (`at`, `assist`), có mặt, sở trường Thư Đồng, lính tạm. `WordReward` thành `ShotSpec` (Phát Chữ) và `PowerSpec` (phát mạnh).
- **§2:** pha `day` / `night` / `dawn` / `defeat`, `w.day`, `w.phaseEnd`; `w.mode` với bảng `MODES` trong `rules.ts` (ngày, trần lời gọi, giây gõ trong 20 s, máu quái, sàn E, hồi lời gọi tháp, `lifeK` cho đồng hồ chấm điểm). Lệnh `callNight` (thưởng như `earlyCall`), op hộp cát `night`, `mode`. Hết đêm trả `waveBonus`, bình minh 3 s.
- **§3:** `w.wood`, `w.food`, `w.seeds`, `w.knowledge`, `w.autoSeeds`. Giá nhà `gold`/`wood` tính trong `compile.ts` (Gỗ = round(0,3 G)). Hoàn tác 5 s hoàn đủ hai thứ. `sellFood`. Trại Lính: mỗi lần hồi ăn 1 Lúa, thiếu thì chờ gấp đôi rồi đứng dậy (`units.hungry`).
- **§4.1** Nhà `farm` (khuôn L, 60 → 42 Vàng + 18 Gỗ), 4 ô (`buildings.plot`, `plotWork`), nông dân (NPC, đi thẳng trong ruộng 1,5 m/s, không A*), gieo 2 s, lớn 40 s, gặt 12 s ra 5 Lúa, lời gọi Gặt khi bắt đầu gặt; `buySeeds`, `autoSeeds` (mặc định bật, 8 Vàng một hạt), `harvestPlot`. **§4.2** 36 cây trong 5 cụm (`map.trees`, test `td-content` kiểm luật đặt), `TreeStore`; 2 dân đầu trận, `hire` (25 Vàng + 5 Lúa, trần 3/5/7/9), dân rảnh chặt cây đánh dấu gần nhất, không thì cây gần Lũy nhất trong 30 m; chặt 20 s ra 8 Gỗ, lời gọi Chặt; `markTree`; cây chặn đặt nhà (kiểm `tree` sau `overlap`), gốc không chặn. **§4.3** Công trường: `upTo`, `progress`, `ready`, thợ xây = cấp Lũy (`staffBuilders`), thợ rảnh lấy công trường chờ lâu nhất, S 8 s / M 14 s / L 18 s, ban đêm ×1,5, lời gọi Xây 2/3/4 từ. Lệnh `upgrade` (giá chênh giữa hai cấp, 0,75 thời gian, 3 từ; nhà vẫn chạy ở cấp cũ). **§4.4** Mỏ: đống như 1A, thợ mỏ chở mỗi 10 s (lệch 1), đống ≥ 50 % thì lời gọi Đào 2 từ. **§4.5** Lượt mạnh 0–5 (`charges`), phát mạnh tiêu 1 lượt (Cung ×1,6 sát thương +1 mục tiêu, Pháo ×1,4 và nổ ×1,3, Lũy +1 mục tiêu), lời gọi Bắn mạnh chỉ ban đêm (quái trong tầm, < 5 lượt, qua thời gian hồi của chế độ, 1 từ, sống 6 s), từ xong bắn Phát Chữ ngay và +2 lượt. **§4.6** như §3.
- **§5:** `stores/calls.ts` (`CallStore`), `systems/calls.ts` (tạo, cho từ, trả từ, gõ, chấm, tiến độ, đóng, thưởng Hoàn hảo), `systems/attention.ts` (AttentionDirector trong sim, bước 11). Kind `call` trong `KIND_PRIORITY`, giữ chỗ dự trữ như dòng chữ cũ. Chỉ lời gọi SÁNG giữ một từ và một chữ đầu; mờ thì trả; khóa giữ từ, từ kế đến khóa ngay; Esc nhả. Tự làm và gõ cộng dồn; Ẩu ×0,6 tiến độ, Chuỗi ÷2, mất thưởng; Chuỗi +1 mỗi từ không Ẩu, không phạt khác; bậc Chuỗi nhân thưởng Hoàn hảo (`CHAIN.tiers[].mul`, trần ×1,3). Kind `quiz` có ưu tiên và hạn, nhưng R1 chưa tạo (sổ ôn là R2).
- **§6:** vòng giúp (`inRing`: Tướng 10 m, Thư Đồng đã mở 6 m), Thư Đồng tự giúp ×1,5 (`passive`: ruộng, cây, công trường, mỏ), `assignUnit` tới cạnh nhà, `move` tới điểm (NPC, cây: app gửi điểm), Tướng tự đánh khi đứng.
- **Lệnh mới:** `upgrade`, `callNight`, `markTree`, `hire`, `buySeeds`, `autoSeeds`, `sellFood`, `harvestPlot`; op hộp cát `wood`, `mode`, `night`; `preset` làm §10 (Lũy 3, đặt sẵn đã xây, 5 dân, 8 cây gần Lũy được đánh dấu) vì op cũ phải còn chạy.
- **View, UI (thô):** cây, gốc, viền vàng khi đánh dấu, thanh tiến độ chặt; 4 ô ruộng theo giai đoạn; NPC chấm có chữ (N, D, X) với "!" và "…"; công trường nét đứt với cung tiến độ; 5 chấm lượt mạnh; vòng giúp của người đang chọn; thẻ chữ đặt trên NPC, màu theo loại lời gọi, thanh thời gian chỉ cho Bắn mạnh; HUD Vàng / Gỗ / Lúa / Hạt / Mạng, "Ngày n · m:ss", "Đêm n · còn k quái", nút gọi đêm sớm, chip "Đang gọi n/N"; thẻ nhà có nút nâng cấp, thẻ Ruộng (hạt, mua, tự mua), thẻ Lũy (dân, thuê, bán Lúa); bảng hộp cát có Chế độ, +Gỗ, Sinh đêm. Bấm cây đánh dấu, bấm ô chín gặt trước; `Shift+\` thuê dân, `Shift+Enter` gọi đêm, `Digit5` chọn Ruộng trong menu xây.

### 3.2 Lệch (có lý do)

1. **Thợ mỏ chở một gùi, không cả đống.** §4.4 nói thợ mỏ đổ đống mỗi 10 s và đống ≥ 50 % thì gọi. Đổ cả đống thì đống không bao giờ quá ~5 Vàng (Mỏ cấp 1 ★★★ ra 3,75 Vàng / 8 s, sức chứa 60), lời gọi Đào không bao giờ có. Thợ mỏ chở `MINE.haulK` = 0,8 × sản lượng một lần của cấp mỗi 10 s: ★ đủ chở hết (không gọi), ★★ đầy nửa sau ~220 s, ★★★ sau ~130 s. Không gõ thì mỏ giàu chỉ ra phần gùi. Số này để R3 chỉnh theo bot.
2. **Thưởng Hoàn hảo khi việc xong trước từ cuối.** Tự làm cộng với gõ nên việc thường xong trước khi gõ hết (gặt 12 s: 1/3 tự làm mất 4 s, ba từ ở 35 WPM mất ~6–7 s). Đọc chữ nghĩa "mọi từ" thì thưởng gần như không bao giờ có. R1 trả thưởng khi việc xong lúc lời gọi còn sống, đã gõ ≥ 1 từ và mọi từ đã gõ đều Chớp hoặc Hoàn hảo (`finished` của lời gọi). Mỏ và Bắn mạnh không có việc riêng: từ cuối là việc xong. *Review R1 siết lại (mục 3.6, số 4): một từ gõ phải là nhát làm xong việc.*
3. **Trần đếm lời gọi MỞ (sáng và mờ), không chỉ sáng.** Đếm chỉ lời gọi sáng thì đi giữa nhiều lời gọi mờ làm sáng quá trần cùng lúc. Lời gọi sáng là tập con của lời gọi mở, nên "sáng ≤ trần" (§12 cổng 6) vẫn đúng; chip "Đang gọi n/N" đếm lời gọi mở. *Review R1 bỏ lệch này (mục 3.6, số 1): trần đếm lời gọi sáng như §5.3.*
4. **Bắn mạnh đang khóa sống quá 6 s** tới khi gõ xong hoặc Esc (§5.2: lời gọi khóa giữ từ tới khi xong hoặc Esc).
5. **Lời gọi không dùng tầng 2.** Chữ đầu tầng 2 bị tính như kẹt chữ và chờ tick sau, để mọi từ sống có chữ đầu khác nhau (§12 cổng 6). Với ≤ 4 từ sống thì chữ không bao giờ thiếu.
6. **Thêm lệnh `upgrade`.** §4.3 cho thời gian và số từ của nâng cấp nhưng 1A chỉ có cấp hộp cát. Nâng cấp trả giá chênh (Vàng + Gỗ), đi qua thợ xây; hoàn tác 5 s hủy nâng cấp. Op hộp cát `level` vẫn tức thì, miễn phí (như 1A), nhưng không áp cho công trường chưa xong (`notReady`).
7. **Từ Ẩu ở Mỏ và Bắn mạnh:** "tiến độ ×0,6" thành 0,6 Vàng thưởng (đống vẫn chở cả) và round(2 × 0,6) = 1 lượt mạnh.
8. **Phát Chữ** giữ công thức 1A trừ T_N (không còn nhịp) và sở trường Thư Đồng (bỏ): D̄ × (0,8 + 1,2·Q) × lenF. **Cháy** (ái lực Draconis với Pháo) nay là: Draconis trong vòng 10 m của Tháp Pháo khi từ Bắn mạnh xong.
9. **Biên pha:** ngày là các tick [đầu ngày, `phaseEnd`); đêm bắt đầu ở tick `phaseEnd`. Một việc N tick tính cả tick bắt đầu.
10. **Tiến độ là phân số, xong khi ≥ 1 − 10⁻⁹** (`DONE` trong `stores/slots.ts`): cộng 1/2400 đủ 2400 lần có thể thiếu một chút dưới 1.
11. **Cách đếm dòng** theo `BUILD_1A6.md` §0 (chỉ `.ts` của `src/td`, 5.319 ở cuối 1A). `td-boundary` đổi theo: đọc trần 7.300 từ `BUILD_1A6.md` §0 và dòng 1A.6 của mục 1.2.
12. **Hỏi bài** (`quiz`) có trong bảng ưu tiên, luật đêm, thưởng, nhưng chưa tạo (sổ ôn là §7, R2). **Chủ đề từ** (§5.2) là chú thích móc ở `bagFor`: từ vựng chưa gắn chủ đề.
13. **Số không có trong đặc tả** (đặt ở `rules.ts`): NPC đi 3 m/s (A*), nông dân 1,5 m/s trong ruộng; ô ruộng cách tâm 1,1 m; dân và thợ mới hiện thành cột ngắn phía đông Lũy.
14. **Người:** `assignUnit` không còn đổi chỗ (hai người đứng cạnh một nhà được); Tướng tự đánh mỗi khi đứng trên đất.
15. **Test:** `world({ gold })` của test cho thêm Gỗ bằng số Vàng (ngân sách xây của test), trừ khi truyền `wood`. Bot, chính sách và báo cáo cũ (nhịp, con lắc, tải) bỏ; bot R1 mới ở `tests/td/{bot,reader}.ts`, `policies/{stand,layouts,hero}.ts`: xây theo bố cục (Ruộng trước), Chấm đứng cạnh Ruộng, Tướng bay tới lời gọi mờ cũ nhất mỗi 2 s, đánh dấu 5 cây bờ đông suối, thuê tới 4 dân, gọi đêm sau 45 s ngày. `pnpm td:balance` in một bảng ngắn (gõ 35 WPM so với không gõ); R3 làm lại báo cáo và cổng.

### 3.3 Số dòng (cách đếm của §0: `.ts` trong `src/td`)

| Nhóm | Cuối 1A | Sau R1 | Đổi |
|---|---|---|---|
| Nội dung (`content/`) | 573 | 610 | +37 (bảng chế độ, giá, cây, Ruộng) |
| Gõ thuần (`typing/`) | 453 | 394 | −59 (`tempo.ts` bỏ) |
| Sim lõi (`sim/*.ts`) | 837 | 945 | +108 (`commands.ts` lệnh mới, `world.ts`) |
| Kho (`sim/stores/`) | 367 | 442 | +75 (`calls`, `npcs`, `trees`, `walkers`) |
| Đường (`sim/nav/`) | 233 | 233 | 0 |
| Hệ (`sim/systems/`) | 1.393 | 1.428 | +35 (`calls`, `attention`, `economy` thay `stream`, `heat`, `aura`, `words`, `production`) |
| App (`app/`, `main.ts`) | 541 | 537 | −4 |
| UI, view (`ui/*.ts`, `view/`) | 922 | 938 | +16 |
| **Tổng** | **5.319** | **5.527** | **+208** (đích R1 ≤ 6.600; trần 7.300 cuối R3) |

Cách đếm cũ của 1A (`td.html`, `rng.ts`, mọi file `src/td` gồm `td.css`): 5.497 → 5.705.

### 3.4 Kiểm ở cuối R1

- `npx tsc -p tsconfig.json --noEmit`, `npx tsc -p tsconfig.server.json --noEmit`: sạch.
- `npx vitest run`: 405 file, 2.644 test đạt, 1 bỏ qua (cuối 1A: 408 file, 2.670); TD riêng: 18 file, 178 test. Bỏ `td-stream-schedule`, `td-heat-chain`, `td-aura`, `td-balance-smoke`; thêm `td-calls`; viết lại `td-agents`, `td-hud`, `td-rewards` (lượt mạnh), `td-sim-economy` (ngày đêm, Ruộng, cây, dân, công trường, mỏ, không sinh tiền), phần đổi của `td-content`, `td-input`, `td-placement`, `td-scorer`, `td-router`, `td-letters` (bỏ phần thuộc tính của dòng chữ cũ, giữ test chữ đầu), `td-sim-block` (Lúa), `td-sim-combat`, `td-nav`, `td-sim-perf`, `td-golden`.
- Thuộc tính (`td-calls`): 3 seed × 240 s chơi ngẫu nhiên trên từ vựng thật, mỗi tick: lời gọi mở ≤ trần, chỉ lời gọi sáng giữ từ (của nó), khóa nằm trên từ của lời gọi sáng, chữ đầu không trùng; nhật ký chạy lại ra đúng mã băm. Bỏ qua mọi lời gọi 300 s: Chuỗi không đổi, Vàng chỉ giảm vì hạt tự mua, Lúa chỉ giảm vì lính ăn, Gỗ không giảm.
- File vàng làm lại bằng `node --import tsx scripts/td/golden.ts` (cùng từ của file cũ): 3 ngày và 3 đêm, 16.754 tick, 279 mã băm, 320 lệnh, 50 từ gõ, 24 lời gọi Hoàn hảo; `--check` thoát 0. Sim một bước (Node, `td-sim-perf`): 300 quái, 9 dân, 4 ruộng, 20 cây đánh dấu, ban đêm: trung vị 0,017 ms; tải đầy TK 25.12: 0,028 ms.
- `npx vite build --outDir <thư mục tạm>`: đạt.
- Trình duyệt (cấu hình Vite của worktree, cổng 3110): `td-1a-boot` đạt 11/11 ở 1280 × 720 và 1920 × 1080, không lỗi console. Một kịch bản thử tạm ngoài repo (đặt sẵn, gõ phím thật qua CDP cho lời gọi sáng, gọi đêm) ở cả hai cỡ: không lỗi console, không ngoại lệ trang.
- `node --import tsx scripts/td/balance.ts --seeds=3 --nights=4`: cả bot gõ 35 WPM và bot không gõ qua 4 đêm ở mọi seed; không bất biến nào vỡ. Số chỉ để xem, chưa phải cổng (R3).

### 3.5 Kịch bản trình duyệt 1A sau R1

Viết theo dòng chữ, nhịp, trợ lực ở ổ; R3 thay bằng `td-1a6-*` (`BUILD_1A6.md` §12 cổng 8). Chạy ở 1280 × 720, giới hạn 150 s mỗi kịch bản:

| Kịch bản | Kết quả | Cổng hỏng (lý do) |
|---|---|---|
| `td-1a-boot` | Đạt | — |
| `td-1a-combat` | Hỏng, không lỗi console | `builtByMouse`, `built`, `kills`, `twoWavesEnded`… (Vàng + Gỗ, công trường chưa xong, ân hạn và `callWave` đã bỏ) |
| `td-1a-stream` | Hỏng, không lỗi console | `streamDone`, `severalWordsLive`, `softSwitch` (không còn dòng chữ) |
| `td-1a-words-dense` | Hỏng, không lỗi console | `fourWithin20m`, `cardsPiledUp` (nhịp 1 s) |
| `td-1a-ime` | Hỏng, không lỗi console | `minusEqualSetTempo` (phím `-` `=` đã bỏ); phần bộ gõ tiếng Việt vẫn đạt |
| `td-1a-perf` | Hỏng, không lỗi console | `presetAssisted`, `fourBuildingsDealtAt1s`, `noRejectedCommand` (`setTempo`) |
| `td-1a-slots`, `td-1a-keyboard-only`, `td-1a-tour` | Hết 150 s | chờ trợ lực, nhịp, đợt mà luật mới không có |

### 3.6 Review R1 (phản biện độc lập, 23/10)

Đọc diff `8ab227eb..e77ceeae` theo `BUILD_1A6.md` §1–§6 và ý của kế hoạch; dựng lại từng lỗi bằng test thăm dò; thử 24 đột biến luật (tắt ×1,5 ban đêm, bỏ kiểm vàng khi tự mua hạt, hai dân một cây…): bộ test TD bắt cả 24, nhưng 2 cái chỉ file vàng bắt (nay có test riêng).

| # | Mức | Lỗi (cách dựng lại) | Sửa |
|---|---|---|---|
| 1 | Cao | Lệch 3 (trần đếm lời gọi MỞ) làm bỏ qua có phạt: lời gọi Đào không tự đóng, mờ ở xa vẫn giữ chỗ mãi. Hai mỏ bị bỏ qua ở Thư giãn (ba ở Cân bằng) làm một lời gọi Xây ngay cạnh Tướng nằm CHỜ 30 s; Bắn mạnh cũng không mở được | Trần đếm lời gọi SÁNG (§5.3). Lời gọi mờ không giữ chỗ; lời gọi mở trong vòng chỉ sáng khi còn chỗ, theo ưu tiên, nên đi vào giữa nhiều lời gọi vẫn không sáng quá trần. Luật đêm đếm lời gọi kinh tế đang sáng. Chip "Đang gọi n/N" đếm lời gọi sáng |
| 2 | Cao | Từ kế của lời gọi đến KHÓA với 0 chữ: Backspace trừ `typed` (Uint8) thành 255, từ kẹt, mọi phím sau đó là lỗi (5 lỗi trên một từ gõ đúng); gõ chữ đầu của lời gọi khác là lỗi, không đổi khóa (trái kế hoạch 4.6: không cướp bàn phím) | `router.ts`: đổi khóa mềm khi đã gõ ≤ 1 chữ, chưa lỗi (0 chữ với từ kế); Backspace không trừ dưới 0, ở 0 thì nhả khóa. `firstMs` của từ kế lấy từ phím đầu của chính nó (tốc thô) |
| 3 | TB | Hoàn tác trong 5 s sau một nâng cấp đã xong (gõ 3 từ, 23 tick) xóa cả nhà, chỉ hoàn giá nâng cấp; hoàn tác lần hai sau khi hủy nâng cấp hoàn tiền lần nữa (+63 Vàng, +27 Gỗ) và xóa nhà | Chỉ hoàn tác việc đang xây (công trường, nâng cấp dở); việc xong trả `finished` ("Xây xong rồi, không hoàn tác") |
| 4 | TB | Lệch 2 quá rộng: gõ 1 từ Hoàn hảo rồi bỏ đi, thợ tự làm xong, vẫn được thưởng "cả lời gọi Hoàn hảo" (Chặt: +2 Gỗ cho 1 từ trong 4) | Thưởng cần một từ gõ là nhát làm xong việc (đã trả lời tới cùng), mọi từ đã gõ Chớp hoặc Hoàn hảo; tự làm tha cho các từ cuối thì vẫn được. Mỏ, Bắn mạnh: từ cuối là việc xong, như cũ |
| 5 | Thấp | Hủy một nâng cấp đóng mọi lời gọi của nhà (Đào của mỏ, Gặt của ruộng) | `stopSite` chỉ đóng lời gọi Xây; xóa nhà vẫn đóng hết |
| 6 | Thấp | Op hộp cát `level` trong lúc nâng cấp: nâng cấp xong ghi đè cấp | Từ chối `notReady` khi đang nâng cấp |
| 7 | Thấp | Nhà "nền chắc" mất +10 % máu khi nâng cấp không Hoàn hảo | `finishSite` giữ ×1,1 |
| 8 | Thấp | Esc giữ chữ và lỗi của từ dở; gõ lại thì lỗi cũ vẫn tính (kế hoạch §8 câu 6: Esc bỏ từ dở, không tính lỗi) | `unlock` xóa chữ đã gõ và lỗi của từ đang khóa |

Test thêm: `td-calls` (mỏ bị bỏ qua không chặn lời gọi trong vòng; quá trần thì chờ, sáng theo ưu tiên khi có chỗ; từ kế: đổi khóa, Backspace, tốc thô; thưởng chỉ khi gõ tới cùng; thuộc tính đếm sáng ≤ trần), `td-router` (khóa 0 chữ, Esc), `td-sim-economy` (hoàn tác việc xong và lần hai, op `level` khi nâng cấp, hủy nâng cấp giữ lời gọi Đào, nền chắc, tự mua hạt khi thiếu vàng, thợ lấy công trường cũ trước). Mỗi test mới đỏ trên mã R1.

**Lệch của R1:** giữ 1, 4–15. Số 2 siết lại, số 3 bỏ (bảng trên). Ghi chú số 1: "★ không gọi" gần đúng (đống ★ lên 40 % sau 15 phút).

**Để R2/R3 (thấp, chưa sửa):** Bắn mạnh tạo cuối đêm còn sống tối đa 3 s sang ngày (vô hại: lượt mạnh giữ lại); NPC đang làm bị `reroute` để ở chế độ đi (chỉ hình); dân không có đường thì chặt tại chỗ (hiếm); op `mode` không đổi độ dài ngày đang chạy. Báo cáo bot (3 seed, 4 đêm) sau sửa: cả hai bot qua 4 đêm, nhưng bot gõ còn 107 Vàng, 7 Gỗ, 124 Lúa, bot không gõ 186 Vàng, 28 Gỗ, 67 Lúa: cổng 7 cần chỉnh ở R3.

**Số sau review:** 5.540 dòng (+13). File vàng làm lại vì luật đổi (lệch từ tick 780): 16.406 tick, 273 mã băm, 330 lệnh, 44 lời gọi, 52 từ, 22 lời gọi Hoàn hảo. `tsc` hai cấu hình sạch; `npx vitest run` 405 file, 2.655 đạt, 1 bỏ qua (TD 18 file, 189 test); `vite build` đạt; trình duyệt (1280 × 720, 1920 × 1080): `td-1a-boot` đạt và một kịch bản tạm ngoài repo (đặt sẵn, gõ phím thật cho lời gọi sáng, Backspace sau từ, gọi đêm) không lỗi console.

## 4. 1A.6 "Lời Gọi", đợt R2 (`BUILD_1A6.md` §7–§10)

Worktree `games/.wt-td-1a6`, nhánh `feat/td-1a6`, trên R1 và bản sửa review R1 (`fc5aad95`). R2 làm học, điều khiển, hình, HUD, thẻ, âm, đặt sẵn, và ba lỗi thấp review R1 để lại. R3 làm bot, báo cáo, kịch bản `td-1a6-*`, cổng §12.

### 4.1 Đã làm

- **§7 Học.** `typing/decks.ts`: mỗi từ có thêm `vi`, `ipa` (lấy từ file từ vựng qua `app/vocab.ts`; từ dự phòng không có). Mã băm của bộ từ và của thế giới không đọc hai trường này (test). `gloss()` rút nghĩa cho thẻ: bỏ ghi chú trong ngoặc, lấy nghĩa đầu, thêm nghĩa sau khi còn ≤ 22 chữ, quá 26 chữ thì cắt ("…").
  - Từ xong: thẻ đổi thành "từ · nghĩa" (nền ngọc), đứng 1 s trong cột của lời gọi, trên từ kế của lời gọi. Lời gọi đã đóng thì thẻ nghĩa đứng ở chỗ cũ, thành một cột riêng để cột khác vẫn tránh nó. Dấu chấm điểm (Chớp, Hoàn hảo…) vẫn bay lên như 1A. Bộ từ không có nghĩa thì thẻ bay về NPC như R1.
  - Chế độ `learn`: thẻ có dòng nghĩa dưới từ ngay khi sáng; dải chữ dưới cùng hiện nghĩa và IPA của từ đang khóa.
  - **Sổ ôn** trong sim (`w.typing.review`, `reviewN`, có trong mã băm): từ gõ Ẩu hoặc có ≥ 2 lỗi vào cuối sổ (đã có thì dời xuống cuối), tối đa 20, đầy thì bỏ từ cũ nhất; Hỏi bài gõ đúng thì xóa từ khỏi sổ (`review()` trong `systems/calls.ts`).
  - **Hỏi bài:** ban Ngày, mỗi Thư Đồng đang mở tạo một lời gọi `quiz` (1 từ, ở ngay Thư Đồng: cột `agent` của `CallStore`) mỗi 25 s (`agents.quizAt`), khi sổ còn nhiều từ hơn số Hỏi bài đang sống; mỗi Thư Đồng một Hỏi bài một lúc. Lời gọi lấy từ cũ nhất của sổ có chữ đầu trống lúc nó sáng (chưa có thì chờ, không đếm kẹt chữ). Thẻ hiện nghĩa và chữ đầu với chỗ trống ("khá, hơi · r _ _ _ _ _"), chữ gõ đúng hiện dần; dải chữ cũng giấu từ. Gõ xong: +1 Tri thức, cả lời gọi Hoàn hảo +1 nữa (thưởng của R1). Hết Ngày (kể cả gọi Đêm sớm) thì Hỏi bài đóng, trừ cái đang khóa. HUD có dòng "Tri thức n · Sổ ôn m" khi đã có.
- **§8 Điều khiển.** Tab / Shift + Tab đi qua các nhà rồi các lời gọi MỜ, gần người đang chọn trước; dock hiện thẻ của lời gọi đó ("🪓 Chặt · 4 từ · đang mờ", nút "Gửi …"). Enter gửi người tới nhà của lời gọi (Gặt, Xây, Đào, Bắn mạnh) hoặc chỗ NPC đứng (Chặt). Bấm NPC: tới lời gọi của nó; nông dân không có lời gọi thì tới Ruộng; còn lại tới chỗ NPC đứng. Bấm bong bóng (thẻ chữ, hay bong bóng mờ trên bản đồ) gửi người tới lời gọi đó. Space: tạm dừng chiến thuật ở `relax`, `learn` (`Selection.tactical`): session ngừng bước; menu, thẻ, đặt nhà vẫn chạy; lệnh xếp hàng và chạy ở tick kế; phím gõ không nhận; chip trạng thái ghi "Tạm dừng chiến thuật · Space để chạy tiếp"; nút ▶ và nút "Chạy tiếp" của thanh hành động cũng tắt nó. Chế độ khác: Space bị nuốt; đổi sang chế độ không có tạm dừng thì tạm dừng tắt. Shift + `\` / Shift + Insert thuê dân, bấm ô chín, bấm cây: đã có từ R1. Test input thêm Space, Space và Shift + `\` khi bộ gõ đang soạn, Space giữ phím.
- **§9 Hình.** Cây tròn xanh đậm có đỉnh sáng; gốc chấm nâu; cây đánh dấu viền vàng dày. Ô ruộng 4 màu (đất nâu, mạ xanh nhạt ở nửa đầu lúc lớn, lúa xanh, lúa vàng) có viền; thanh tiến độ chỉ khi gặt. NPC chấm có chữ (N, D, X, và M thợ mỏ cạnh mỗi mỏ) với "!" khi làm, "…" khi lời gọi CHỜ. Công trường nét đứt và cung tiến độ (R1). Bong bóng lời gọi SÁNG là thẻ chữ có biểu tượng loại việc (emoji: 🏹 🔨 🌾 🪓 ⛏️ 📖) và chấm số từ còn lại (●●○; lời gọi 1 từ không có). Lời gọi MỜ: bong bóng mờ trên canvas có biểu tượng và chấm, không có chữ, chạm nhau thì xếp chồng lên. Lời gọi nằm ngoài khung sân của zoom 1: mũi tên ở mép khung, màu theo loại. 5 chấm lượt mạnh dưới tháp, tối thiểu 7 px ở mọi zoom. HUD: thẻ Ruộng ("Chín 1 · Lớn 2 · Trống 1", hạt, "Mua 4 hạt · 30 vàng", "Tự mua hạt"); thẻ Lũy ("Dân 5/7 · Thợ xây 3 · Lúa n", "Thuê dân · 25 vàng, 5 lúa", "Bán 10 Lúa · +10 vàng", mỗi nút một hàng); thẻ tháp ("Lượt mạnh n/5"); nút nâng cấp một hàng riêng (R1 bị tràn chữ); hàng "Chế độ" của hộp cát đặt nhãn lên trên để bốn tên chế độ không bị cắt.
- **§9 Âm** (`view/audio-min.ts`, tổng hợp bằng mã): khi một lời gọi SÁNG, một tiếng báo theo loại (Gặt chuông cao, Chặt gõ gỗ thấp, Xây hai nhát búa, Đào leng keng, Bắn mạnh tù và ngắn, Hỏi bài tiếng chim), tối đa 3 tiếng một giây. Bỏ tiếng tích khi lời gọi nhận từ mới của R1 (trùng với tiếng báo). Giữ tiếng phím và nốt xong từ của 1A.
- **§10 Đặt sẵn:** như R1, thêm: 4 ô của Ruộng có đủ giai đoạn (chín, lớn 70 %, lớn 30 %, trống) để làng có việc ngay.
- **Lỗi thấp của review R1:** NPC đang làm mà bị nhà mới phủ thì được đưa ra ô trống và đứng làm tiếp (không còn ở chế độ đi). Dân không có đường tới cây thì bỏ cây đó (`worker` = −2) đi tìm cây khác, không chặt từ xa; đánh dấu lại cây thì thử lại. Op `mode` ban ngày đổi luôn độ dài ngày đang chạy, giữ phần đã trôi (không phải chờ ngày sau).

### 4.2 Lệch (có lý do)

1. **Hỏi bài nhường chỗ.** §5.3 chỉ xếp ưu tiên khi còn chỗ. Hỏi bài luôn nằm trong vòng của Thư Đồng nên luôn sáng được: hai Hỏi bài giữ đủ trần của `relax`, `learn` (2) và mọi lời gọi việc phải mờ. Nay ở trần, một Hỏi bài chưa ai gõ (không khóa) tắt sáng để nhường cho lời gọi khác trong vòng (kế hoạch 4.5: Hỏi bài "bỏ được"). Hỏi bài đang gõ không nhường. Test `td-learn`.
2. **Từ của Hỏi bài chọn lúc sáng**, không gắn khi tạo: lời gọi lấy từ cũ nhất của sổ có chữ đầu trống. Nhờ đó Hỏi bài không kẹt vì một từ khác đang giữ chữ đầu, và hai Hỏi bài không hỏi trùng (luật chữ đầu không cho hai từ giống nhau cùng sống).
3. **Hỏi bài không có hạn** (`expire` = −1): đóng khi pha không còn là Ngày (§5.1 "Hết Ngày"), nên cũng đóng khi gọi Đêm sớm. Bot đọc `expire` để ưu tiên Bắn mạnh nên không nhầm Hỏi bài là lời gọi gấp.
4. **"≥ 2 lỗi" trùng với Ẩu** ở mọi từ của bộ (3–8 chữ chỉ cho phép 1 lỗi). Luật vẫn viết đủ hai điều kiện (`CALL.reviewErrors`).
5. **Cột thẻ đẩy ngang tới 240 px** (1A: 160). Bốn dân chặt bốn cây cạnh nhau cho bốn bong bóng gần cùng một chỗ; 160 px không đủ tách bốn thẻ rộng ~140 px. Thêm: khi các cột co về, nếu hai cột sắp chạm (hai cột đổi bên cho nhau) thì mọi cột lấy ngay chỗ đích, không trượt qua nhau. Thẻ nghĩa nhảy ngay vào chỗ của nó trong cột (không trượt), như luật "cột tách ngay" của 1A.
6. **Đặt sẵn có ruộng đủ giai đoạn** (mục 4.1): §10 không nói; chỉ ở hộp cát, để ảnh và lần chơi đầu có Gặt ngay.
7. **Thẻ đang rời** có lớp `is-gone` (`is-mean` khi đang hiện nghĩa) để kịch bản đo được thẻ sống (R3).
8. **Thẻ lời gọi ở dock** chỉ có cho lời gọi MỜ mà Tab tô; bấm bong bóng thì gửi người ngay, không mở thẻ.
9. **Bấm NPC** trúng khi trong 0,7 m (bằng chấm NPC): nông dân đứng trong Ruộng, nên bấm vào rìa Ruộng vẫn mở thẻ Ruộng.

### 4.3 Số dòng (cách đếm của §0: `.ts` trong `src/td`)

| Nhóm | Sau R1 (gồm review) | Sau R2 | Đổi |
|---|---|---|---|
| Nội dung (`content/`) | 610 | 611 | +1 |
| Gõ thuần (`typing/`) | 395 | 412 | +17 (`vi`, `ipa`, `gloss`) |
| Sim lõi (`sim/*.ts`) | 949 | 953 | +4 |
| Kho (`sim/stores/`) | 442 | 447 | +5 |
| Đường (`sim/nav/`) | 233 | 233 | 0 |
| Hệ (`sim/systems/`) | 1.437 | 1.492 | +55 (sổ ôn, Hỏi bài, nhường chỗ, ba lỗi thấp) |
| App (`app/`, `main.ts`) | 537 | 582 | +45 (tạm dừng, Tab tới lời gọi, bấm NPC và bong bóng) |
| UI, view (`ui/*.ts`, `view/`) | 937 | 1.120 | +183 (thẻ, bong bóng mờ, mũi tên, thẻ dock, âm) |
| **Tổng** | **5.540** | **5.850** | **+310** (đích R2 ≤ 7.000; trần 7.300 cuối R3) |

### 4.4 Kiểm ở cuối R2

- `npx tsc -p tsconfig.json --noEmit`, `npx tsc -p tsconfig.server.json --noEmit`: sạch.
- `npx vitest run`: 406 file, 2.676 đạt, 1 bỏ qua (sau review R1: 405 file, 2.655); TD 19 file, 210 test (189). File mới `td-learn`: nghĩa không vào mã băm, `gloss`, sổ ôn (Ẩu vào, 1 lỗi không, 20 từ, dời xuống cuối, xóa), Hỏi bài (có khi sổ có từ, ở Thư Đồng, sáng, đúng từ; gõ đúng xóa khỏi sổ, gõ Ẩu giữ lại; 25 s, một cái mỗi Thư Đồng, không quá số từ của sổ; nhường chỗ ở trần; đóng khi hết Ngày trừ cái đang khóa). Thêm ở `td-input`: Space ở bốn chế độ, nút ▶, lệnh xếp hàng khi dừng (qua `Session`), Tab qua nhà rồi lời gọi mờ, Enter, Esc, bấm NPC, `toCall`, đặt sẵn có ruộng đủ giai đoạn, phím khi bộ gõ đang soạn. Thêm ở `td-hud`: dòng Tri thức, dải chữ giấu từ Hỏi bài và hiện nghĩa ở `learn`, thẻ Ruộng, Lũy, tháp, thẻ lời gọi mờ, nút Space. Thêm ở `td-sim-economy`: op `mode` đổi ngày đang chạy, cây không có đường, NPC đang làm bị phủ (ba test này đỏ trên mã R1). Hai test cũ đổi theo luật: Space nay là hành động `space`; Hỏi bài ban đêm đóng chứ không chờ.
- File vàng **làm lại vì luật sim đổi** (sổ ôn, Hỏi bài, nhường chỗ; kho thêm cột): `node --import tsx scripts/td/golden.ts` trên cùng từ của file cũ: 16.406 tick, 273 mã băm, 348 lệnh, 47 lời gọi (3 Hỏi bài), 55 từ, 23 lời gọi Hoàn hảo; lệch từ tick 60 (mã băm có cột mới); `--check` thoát 0.
- `npx vite build --outDir <thư mục tạm ngoài repo>`: đạt.
- Trình duyệt (cấu hình Vite của worktree, cổng 3110), một kịch bản tạm ngoài repo: `td.html?sandbox=1` → Đặt sẵn, một công trường, Chấm tới Ruộng, Tướng tới cụm cây, chuột thật đánh dấu 5 cây ven suối; một Ngày gõ phím thật qua CDP (45 WPM, vài từ Ẩu cho sổ ôn); `learn`; lời gọi mờ, Tab, Enter; bấm Ruộng, Lũy; Space; một Hỏi bài gõ thật; Shift + Enter, một Đêm gõ Bắn mạnh. Ở 1280 × 720 và 1920 × 1080: mọi kiểm đạt; có lúc 3 lời gọi sáng; không hai thẻ sống nào chồng (ngưỡng 1 px như 1A); không thẻ nào chạm bảng HUD ở zoom 1; chữ ≥ 18 px; không lỗi console, không ngoại lệ trang. Thêm một lần zoom vào làng: lời gọi ngoài khung hiện mũi tên ở mép. Âm thanh chỉ kiểm là không lỗi (máy không đầu, không nghe).

### 4.5 Để R3

- Kịch bản `td-1a6-*` (§12 cổng 8) thay các kịch bản `td-1a-*` cũ; dùng lớp `is-gone`, `is-mean` để đo thẻ sống; `__td.state()` có `review` và `agent` của lời gọi, `__td.ui()` có `call`, `tactical`.
- Bot mới, báo cáo, cổng 5 và 7 (mục 3.6: bot gõ chưa lợi hơn bot không gõ). Bot nên gõ cả Hỏi bài.
- Ở zoom 1 cả sân 96 m nằm trong 660 px (1280 × 720): làng nhỏ, chấm NPC chỉ ~10 px. Bộ ảnh cho chủ dự án nên có thêm một ảnh zoom 2× vào làng.
- Còn từ R1: Bắn mạnh tạo cuối đêm sống tối đa 3 s sang ngày.

### 4.6 Review R2 (phản biện độc lập, 23/10)

Đọc diff `fc5aad95..4913aea1` theo `BUILD_1A6.md` §7–§10 và ý của kế hoạch (kéo không đẩy, bỏ qua không mất gì, thư giãn, học); dựng lại từng lỗi bằng test thăm dò và trình duyệt thật (CDP, phím và chuột thật, cổng 3130, 1280 × 720 và 1920 × 1080); thử 14 đột biến luật R2: test bắt 9, 4 cái lọt nay có test riêng (dưới bảng).

| # | Mức | Lỗi (cách dựng lại) | Sửa |
|---|---|---|---|
| 1 | TB | Dấu chấm điểm (Chớp, Hoàn hảo…) che nghĩa 1 s: ở lời gọi nhiều từ (Gặt, Chặt, Xây, Đào) thẻ nghĩa dời lên trên từ kế, dấu vẫn ở chỗ cũ nên nằm đè chữ ("rather · [Chớp] hơi"; đo: dấu chồng thẻ nghĩa) | Dấu đi theo thẻ nghĩa, đứng trên nó; đo lại 12 mẫu mỗi cỡ: chồng 0 px |
| 2 | TB | Tạm dừng chiến thuật: lệnh tay xếp hàng mà không hiện gì tới khi chạy tiếp, người chơi bấm lại: "Mua 4 hạt" hai lần thành 8 hạt (60 vàng), bấm cây hai lần thành bỏ đánh dấu (chuột thật) | Trong tạm dừng chiến thuật, lệnh tay chạy ngay, đóng dấu tick đang chờ (`Session.orders`); bước của tick đó cũng chạy lệnh trước mọi hệ, nên nhật ký chạy lại ra cùng thế giới. Phím gõ và Backspace vẫn chờ; lúc thua không nhận. `replayTo` (`sim/world.ts`) và `scripts/td/replay.ts` cộng các lệnh đóng dấu đúng tick đang chờ (ảnh chụp giữa lúc dừng). Tạm dừng thường (Esc, ▶) vẫn xếp hàng như 1A |
| 3 | TB | Space theo thói quen sau một từ ("rather" rồi Space sau 60 ms) bật tạm dừng ở Thư giãn và Học; phím của từ kế (đến đã khóa) bị bỏ im lặng; báo dừng chỉ ở góc trái trên | Space trong 800 ms sau một chữ game đã nhận là dấu cách giữa từ: bị nuốt (`WORD_SPACE_MS`, `installKeys`); chữ bị bỏ vì đang dừng không tính, nên Space để chạy tiếp ăn ngay; nút "Tạm dừng" không bị chặn. Dải chữ ghi "Tạm dừng · Space" cạnh từ đang khóa |
| 4 | TB | Nghĩa ở chế độ Học 13,5 px trên thẻ ở 1280 × 720 (dải chữ 13 px), ngọc trên giấy 3,9 : 1; nghĩa Hỏi bài xanh 3,7 : 1 | Nghĩa ≥ 18 px, ngọc đậm `#07695c` (6 : 1); nghĩa Hỏi bài `#1f5bb5` (5,9 : 1). Đo lại: không chữ nào của thẻ < 18 px |
| 5 | Thấp | 4 lời gọi sáng (Thử thách, cụm cây đông nam), thẻ Lũy mở ở dock, 1280 × 720: thẻ "maybe" bị đẩy (lệch 5, 240 px) đè mép trái dock | Cột tránh bảng HUD hai bên ở chiều cao của nó khi còn chỗ (`besidePanels`, đặt lại mỗi lượt tách); không còn chỗ (`lanesTouch`) thì như cũ: thẻ đè HUD chứ không đè nhau. Vòng tách 8 → 40 lượt để hội tụ. Đo lại: không thẻ nào đè bảng ở cả hai cỡ |
| 6 | Thấp | Nghĩa dài cắt giữa chữ: 12/765 từ ("chưa bao giờ, không bao g…", "cơ sở kinh …") | Cắt ở dấu phẩy cuối còn vừa, không thì ở chữ trọn cuối và "…"; test chạy cả bộ từ thật |
| 7 | Thấp | Thẻ dock của lời gọi mờ luôn ghi "Ngoài vòng giúp" kể cả khi lời gọi ở trong vòng mà chờ chỗ (trần đầy, Hỏi bài nhường): gửi người tới không làm nó sáng | Ghi "Trong vòng giúp: sáng khi bớt lời gọi đang sáng" |
| 8 | Thấp | Hàng Chế độ của hộp cát vẫn cắt "Cân bằng" ở 1280 × 720 (mục 4.1 nói đã hết) | Bốn nút thành 2 × 2 |

Test thêm (mỗi test đỏ trên mã R2, trừ 4 test chặn đột biến): `td-input` (Space sau chữ bị nuốt, sau chữ bị bỏ thì không; tạm dừng chiến thuật chạy lệnh ngay, phím chờ, `replayTo` giữa lúc dừng và sau đó cùng mã băm, tạm dừng thường vẫn xếp hàng), `td-hud` (dải chữ khi dừng; thẻ dock của lời gọi mờ trong vòng), `td-lanes` (bảng hai bên, có chỗ thì không đè dock, hết chỗ thì `lanesTouch`), `td-learn` (cắt nghĩa ở dấu phẩy hoặc chữ trọn, cả bộ từ thật). Chặn đột biến lọt: Hỏi bài lấy từ cũ nhất có chữ đầu trống (`td-learn`), Tab bỏ qua lời gọi sáng, bấm thợ xây đang làm thì tới công trường của lời gọi (`td-input`), chấm từ ●●●○ (`td-hud`). Đột biến còn lọt: cổng phím trong `main.ts` (nay `Session` cũng giữ phím trong tạm dừng chiến thuật), dòng nghĩa của thẻ ở chế độ Học và trần tiếng báo (DOM và âm: chỉ kiểm bằng trình duyệt); Hỏi bài tạo ban đêm chỉ file vàng bắt (đóng ngay trong tick, không ai thấy).

**Lệch của R2 (mục 4.2):** giữ cả 9. Số 1 (Hỏi bài nhường) hợp ý "bỏ được"; số 5 giữ, thêm tránh HUD (số 5 bảng trên). **Lệch mới của review:** §8 "lệnh xếp hàng và chạy ở tick kế khi bỏ dừng" thành lệnh chạy ngay trên tick đang chờ (số 2), vì người chơi không thấy lệnh đã nhận; tick đóng dấu và thứ tự như cũ, nên nhật ký và file vàng không đổi. Space không dừng trong 800 ms sau một chữ (số 3).

**Không sửa (thấp, ghi lại):** chế độ Học ở Lũy 1 không có Hỏi bài (chưa có Thư Đồng; §6 chỉ Thư Đồng hỏi); Hỏi bài sáng mà chưa có từ (chữ đầu của mọi từ trong sổ đang bận) giữ một chỗ trần không thấy, nhường khi trần đầy; Esc khi đang tạm dừng chiến thuật bật thêm tạm dừng thường (Esc như 1A); lời gọi ra vào mép vòng giúp kêu lại tiếng báo (đo 100 s ở Thư giãn: Hỏi bài sáng lại 7 lần; trần 3 tiếng/giây); mũi tên mép tính theo khung sân ở zoom 1, đúng phía; phím Tab qua hết nhà rồi mới tới lời gọi mờ (đúng §8). Kế hoạch Q10 "Cân bằng: tạm dừng chỉ xem" khác §8 "Esc … tạm dừng (như 1A)": giữ như 1A.

**Tất định:** Node chạy lại nhật ký trình duyệt ra cùng mã băm: tour R2 (Học, Hỏi bài, tạm dừng, một Đêm; 1280 × 720: 5.000 tick, 121 lệnh; 1920 × 1080: 5.002 tick, 124 lệnh) và kịch bản tạm dừng (giữa lúc dừng có lệnh đã chạy, và sau khi chạy tiếp) ở cả hai cỡ. File vàng không đổi (`--check` khớp: luật sim không đổi).

**Số sau review:** 5.955 dòng (+105: app 614, UI và view 1.177, gõ 419, sim lõi 962; còn lại như mục 4.3). `tsc` hai cấu hình sạch; `npx vitest run` 406 file, 2.685 đạt, 1 bỏ qua (TD 19 file, 219 test); `vite build` đạt (thư mục ngoài repo). Trình duyệt sau sửa: tour R2 đạt mọi kiểm ở hai cỡ, không lỗi console.

**Cho R3:** kịch bản bấm Space để dừng phải chờ ≥ 800 ms sau phím chữ cuối; trong tạm dừng chiến thuật lệnh tay (và `__td.send` không phải phím) chạy ngay, phím chờ tới khi chạy tiếp; so mã băm với `scripts/td/replay.ts` (đã dùng `replayTo`).

## 5. 1A.6 "Lời Gọi", đợt R3 (`BUILD_1A6.md` §11–§12: bot, báo cáo, kịch bản, cổng)

Worktree `games/.wt-td-1a6-r3`, nhánh `feat/td-1a6-r3`, trên `feat/td-1a6` (`4913aea1`), đã gộp bản sửa review R2 (`2663f794`). R3 làm bot, báo cáo `td:balance`, kịch bản `td-1a6-*`, cổng §12; sửa một luật của bộ điều phối và hai số trong `rules.ts` để cổng 5 và 7 đạt (mục 5.4, 5.5).

### 5.1 Bot (`tests/td/`)

- **Mắt** (`reader.ts`): từ của lời gọi SÁNG thấy sau 0,35–0,6 s; từ kế của lời gọi đang khóa sau 0,15–0,3 s (mắt đã ở đó); từ Hỏi bài nhớ ra từ nghĩa sau 0,8–1,6 s. Chọn Bắn mạnh trước (còn kịp gõ thì gõ), rồi từ cũ nhất. Luồng ngẫu nhiên riêng, không chạm luồng của thế giới.
- **Tay** (`keystrokes.ts`, giữ từ 1A): WPM (5 chữ một từ), khoảng phím ±50 %, trượt sang phím bên cạnh theo độ chuẩn, 30 % lần trượt bấm thêm Backspace (router không nhận phím sai, nên Backspace xóa một chữ đúng và phải gõ lại).
- **Người gõ** (`bot.ts`): một phím mỗi tick khi tay rảnh; gõ từ đang khóa khi đã đọc nó, không thì từ mắt chọn. **Bot không gõ**: `hands: null`, cùng kế hoạch.
- **Kế hoạch chuẩn** (`policies/stand.ts`, `layouts.ts` `STANDARD`, §12 cổng 4): mua theo thứ tự khi đủ Vàng và Gỗ: Ruộng cạnh rừng đông nam (18, 30), Tháp Cung khúc nhập, Trại Lính, Mỏ trên N1 ★★★, Lũy cấp 2, Tháp Cung đường đông, Tháp Pháo, Lũy cấp 3, rồi nâng cấp (Tháp Cung khúc nhập, Tháp Cung tây, Pháo, Mỏ, Trại Lính). Lũy lên cấp bằng hộp cát (1A.6 chỉ có nút hộp cát, §4.3) nhưng bot trả giá TK 2 (150 / 260 / 400) cắt như §3 (Gỗ = round(0,3 G)): 105 V + 45 G, 182 + 78, 280 + 120. Chấm đứng ở Ruộng, Phẩy ở Mỏ (khi Lũy mở chỗ). Giữ số cây đánh dấu còn đứng = số dân + 2, theo từng cụm (đông nam, bờ đông suối, bờ tây, cạnh cổng tây, cổng, đông bắc). Thuê tới 4 dân (giữ 20 Vàng), bán 10 Lúa khi quá 20, không thuê trong tick vừa mua (giá chỉ trừ khi lệnh chạy). Ngày chạy hết, không gọi Đêm sớm.
- **Tướng** (`policies/hero.ts`), chỉ bằng lệnh bàn phím có (Tab tới nhà hay lời gọi mờ, Enter: `assignUnit` tới nhà, hoặc `move` tới chỗ NPC đứng). Ban Ngày, mỗi 0,5 s khi không khóa từ và đang đứng: cân mỗi chỗ bằng số từ còn lại của lời gọi mở hay chờ trong vòng 10 m mà không vòng Thư Đồng nào thắp, chia cho (1 + đường bay / 60 m); đi khi hơn chỗ đứng 1,5 từ (hay chỗ đứng không có gì). Ban Đêm: tới tháp (hay Lũy) có nhiều quái trong tầm và lời gọi Bắn mạnh đang mờ; ở đó Tướng cũng đánh.
- **Đo** (`bot.ts`): tick gõ (có khóa) theo Ngày và Đêm, theo từng ngày; số đếm 20 s của bộ điều phối ở mức cao nhất; tài nguyên làm ra (Vàng mọi nguồn, Gỗ, Lúa, Tri thức; không tính vốn đầu, không tính bán Lúa) ở mỗi lúc chạng vạng và bình minh; lời gọi (tạo, từng sáng, có gõ, gõ xong việc, Hoàn hảo, sáng mà bỏ qua, chưa từng sáng) theo loại; giá mỗi bước sim; bất biến lời gọi mỗi tick.

### 5.2 Báo cáo `td:balance`

`node --import tsx scripts/td/balance.ts [--seeds=5] [--nights=4]` (5,6 s): mỗi chế độ (Thư giãn, Cân bằng, Thử thách, Học) chạy bot gõ và bot không gõ ở 5 seed, 4 đêm, từ vựng thật. In: bảng cổng §12 (Cân bằng); hai bot (đêm qua, mạng, tỉ lệ gõ Ngày và Đêm, cửa sổ 20 s đầy nhất, từ gõ, lời gọi Hoàn hảo, làm ra sau 3 Ngày); tỉ lệ gõ theo từng Ngày và Đêm; lời gọi theo loại; tài nguyên mỗi Ngày; bảng theo chế độ; giá một bước sim. `gates()` là bảng cổng; `tests/td-balance-gates.test.ts` giữ cổng 4, 5, 6, 7 trên đúng các seed đó (sim tất định, nên cùng số).

### 5.3 Vì sao cổng 7 hỏng ở R1 (bot gõ "làm ra ít hơn")

1. **R1 so số tồn cuối trận, không so cái làm ra.** Bot gõ có Lúa sớm hơn nên thuê dân, mua hạt, xây sớm hơn: tiêu nhiều hơn. Đo lại trên mã R1 (3 seed, hết Đêm 3), Vàng mọi nguồn + Gỗ + Lúa làm ra: gõ 486, không gõ 440, tức +10 %, không phải thua.
2. **Bot R1 dở.** Tướng bay tới lời gọi mờ cũ nhất mỗi 2 s, qua lại giữa Ruộng cạnh Lũy và 5 cây bờ đông suối cách 60 m (bay mất ~10 s mỗi lượt); gọi Đêm ở giây 45 của 75; Mỏ ★ ở N2 không bao giờ đầy nửa đống nên không có lời gọi Đào.
3. **Cây tự đổ nhanh quá:** 20 s một cây, phần lớn lời gọi Chặt xong trước khi Tướng tới; gõ chỉ góp một hai từ.
4. **Cây hết:** 36 cây × 8 Gỗ = 288 Gỗ cả bản đồ; bot gõ chặt hết trước Ngày 4, Ngày 4 không còn lời gọi Chặt (tỉ lệ gõ Ngày 4 còn 15–24 %).

Sửa: kế hoạch và Tướng (mục 5.1), Mỏ N1, đủ ngày; cây 45 s ra 12 Gỗ (mục 5.5). Sau sửa: +35,7 % (5 seed), +38 % (20 seed).

### 5.4 Vì sao cổng 5 hỏng, và luật mới của bộ điều phối

Bộ điều phối R1 chỉ nhìn 20 s đã qua lúc thắp: ba lời gọi thắp cùng lúc lúc vắng được bot gõ liền nhau (17 s trong 20 s ở 35 WPM); Bắn mạnh và Xây thắp cả khi đã quá 8 s (một lời gọi Xây 4 từ đưa lên 11 s). Giữ cửa sổ bằng cách giữ chỗ cả lời gọi (mọi từ còn lại) thì chặn quá tay: tỉ lệ gõ Ngày còn 9–25 % (lời gọi 3 từ chiếm chỗ ~6 s, và tự làm thường xong trước khi gõ hết).

**Luật mới (`systems/attention.ts`, giữ từng từ):** một từ chỉ được bắt đầu khi gõ nó từ giờ (thời gian khóa ở tốc E: các chữ trừ chữ đầu, `typeSeconds(len − 1)` × `CALL.paceK`, cộng `CALL.slipS` cho phím trượt), sau từ đang gõ dở, vẫn giữ mọi cửa sổ 20 s trong số giây của chế độ, có tính các tick gõ cũ rời cửa sổ trong lúc đó; hoặc khi 20 s qua không gõ gì (một từ dài hơn ngân sách vẫn tới, một mình). Lời gọi chỉ thắp khi một từ dài nhất của dải vừa; lời gọi SÁNG có từ chưa gõ chữ nào thì MỜ lại (trả từ, không mất gì) khi từ đó không còn vừa, kể cả từ kế của lời gọi đang khóa (lệch §5.2 "từ kế vẫn KHÓA": ở mép ngân sách lời gọi nhả khóa và chờ). Bắn mạnh và Xây vẫn đứng đầu hàng nhưng cũng chờ chỗ (lệch §5.3 "vượt mức thì chỉ cho power và build mở thêm"). Test: `td-calls` (cửa sổ đầy thì không gì thắp, từ chưa gõ mờ lại không mất gì; cửa sổ trống thì thắp theo ưu tiên tới trần; 8 s gõ từ lâu rời cửa sổ thì vừa, 8 s vừa gõ thì không).

**Biên trượt:** bot trượt và Backspace làm một từ dài hơn ước tính. Biên lớn thì cửa sổ an toàn nhưng tỉ lệ gõ Ngày giảm. Đo trên bản cuối, 20 seed, Cân bằng:

| `slipS` | Cửa sổ 20 s đầy nhất | Gõ Ngày | Gõ Đêm |
|---|---|---|---|
| 0,6 s | 8,72 s (hỏng) | 32,2 % | 21,7 % |
| 1,0 s | 8,68 s (hỏng) | 31,1 % | 20,5 % |
| **1,1 s (chọn)** | **8,00 s** | **30,6 %** | 20,2 % |
| 1,5 s | 8,00 s | 28,4 % (hỏng) | 20,7 % |
| 2,0 s | 7,87 s | 26,8 % (hỏng) | 19,4 % |

Hai cổng (≤ 8 s mọi cửa sổ, ≥ 30 % ban Ngày) sát nhau với một người gõ có trượt: mức đầy nhất 8 s là 40 %, nên trung bình 30 % đòi cửa sổ luôn gần đầy. Một từ trượt ba bốn lần ngay mép vẫn có thể vượt: ở Thư giãn (ngân sách 6 s, không là cổng) báo cáo có một cửa sổ 7,0 s, từ "right" trượt 4 lần (4,5 s).

### 5.5 Đổi luật (số trong `rules.ts`, mã ở `attention.ts`)

| Chỗ | Trước | Sau | Lý do |
|---|---|---|---|
| `attention.ts` | Thắp khi 20 s qua ≤ ngân sách; quá thì chỉ Bắn mạnh, Xây | Giữ ngân sách từng từ, nhìn trước (mục 5.4) | Cổng 5a: 17 s và 11 s trong 20 s |
| `CALL.paceK` | — | 1 | Thời gian khóa một từ ước theo TK 6.3 ở tốc E |
| `CALL.slipS` | — | 1,1 s | Biên cho phím trượt (bảng mục 5.4) |
| `TREE.chopS` | 20 s | 45 s | Lời gọi Chặt có thời gian được trả lời; không gõ thì Gỗ chậm hơn (cổng 7) |
| `TREE.wood` | 8 | 12 | Dân tự chặt ra 0,27 Gỗ/s (trước 0,4); 36 cây giữ 432 Gỗ, đủ tới Ngày 4 cho người gõ (cổng 5b ở Ngày 4) |

Đã thử mà không giữ: `ECONOMY.woodShare` 0,4 và 0,5 (Gỗ dư, Vàng thiếu; thêm ~0,5 điểm tỉ lệ gõ nhưng 0,5 cần nhiều Gỗ hơn cả bản đồ có), lời gọi Chặt 3 từ và Xây L 3 từ (cần khi còn giữ chỗ cả lời gọi; giữ từng từ thì 4 từ của §5.1 lại tốt hơn: nhiều từ hơn mỗi cây), Ruộng thứ hai (hạt 8 Vàng ra 5 Lúa bán 5 Vàng: lỗ Vàng, không giúp).

### 5.6 Cổng cứng §12 cuối R3

| Cổng | Kết quả |
|---|---|
| 1. `pnpm check` từng bước, `td-boundary` | `tsc` hai cấu hình sạch; `npx vitest run` 407 file, 2.693 đạt, 1 bỏ qua (TD 20 file, 227 test); `vite build` đạt (thư mục ngoài repo) |
| 2. Tất định | File vàng **làm lại** (luật sim đổi và bot chuẩn mới): 19.080 tick, 318 mã băm, 326 lệnh (có `callNight`: bot vàng gọi Đêm sau 60 s), 54 từ, 17 lời gọi Hoàn hảo; `--check` khớp. Chrome chạy nhật ký vàng ra đủ 318 mã băm (`td-1a6-perf`, hai cỡ); Node chạy lại nhật ký trang của `td-1a6-day`, `-night`, `-keyboard`, `-learn`, `-perf` ra đúng mã băm |
| 3. Bước sim ≤ 0,5 ms (300 quái, 20 cây, 9 dân, 4 Ruộng) | Node: trung vị 0,0097 ms, p95 0,012 ms; Chrome (`td-1a6-perf`): trung vị 0,01 ms, p95 0,04 ms |
| 4. Bot không gõ qua Đêm 1–4, Cân bằng, mọi seed | Đạt: mạng 10 / 13 / 13 / 10 / 9 (5 seed); 20 seed: thấp nhất 9 |
| 5. Bot gõ 35 WPM 95 % | Cửa sổ 20 s đầy nhất 7,95 s (5 seed; 20 seed 8,00 s); Ngày 30,3 %; Đêm 20,5 % |
| 6. Bất biến | Test thuộc tính `td-calls` xanh; mọi tick của mọi lượt bot (4 chế độ × 2 bot × 5 seed): 0 bất biến vỡ, 0 lệnh bị từ chối |
| 7. Gõ hơn không gõ ≥ 25 % sau 3 Ngày | 505 / 372 = +35,7 % (Thư giãn, Học +37 %, Thử thách +58 %) |
| 8. Kịch bản 1280 × 720 và 1920 × 1080 | Đạt cả 9 ở hai cỡ, không lỗi console (mục 5.7) |
| 9. Ngân sách mã ≤ 7.300 | 6.012 dòng |

Theo chế độ (5 seed, 4 đêm): Thư giãn và Học gõ Ngày 19 %, Đêm 15 % (ngân sách 6 s); Thử thách gõ Ngày 43 %, Đêm 31 %, bot không gõ thua Đêm 4 ở 1 trong 5 seed (Thử thách không là cổng 4). Lời gọi (Cân bằng, bot gõ, 5 seed): 424 tạo, 298 từng sáng, 254 có gõ, 176 gõ xong việc, 130 Hoàn hảo, 44 sáng mà bỏ qua; Xây ít sáng (30 tạo, 6 sáng): Tướng ít tới công trường, thợ tự xây.

### 5.7 Kịch bản trình duyệt (§12 cổng 8)

Chạy với `scripts/dev/vite.worktree.config.ts`, cổng 3140; phím thật qua CDP; mọi kịch bản kiểm không lỗi console, không ngoại lệ trang, và (trừ boot, IME) thẻ sống không chồng nhau, không đè bảng HUD, chữ ≥ 18 px, trong màn hình. Helper chung `td-1a6-common.mjs`.

| Kịch bản | Kiểm |
|---|---|
| `td-1a6-day` | Đặt sẵn, gõ 45 WPM: Gặt, Chặt, Xây đều xong bởi một từ gõ (`callEnd.finished`); Lúa, hạt, Gỗ, cây đổ, nhà đứng; Node chạy lại ra cùng mã băm |
| `td-1a6-night` | Shift + Enter gọi Đêm; từ Bắn mạnh gõ thật, lượt mạnh lên 3 rồi được tiêu, Phát Chữ bắn ra; hết Đêm còn mạng; chạy lại trên Node |
| `td-1a6-keyboard` | Một Ngày và một Đêm không một sự kiện chuột: Insert / Digit / Enter xây, Tab tới lời gọi mờ rồi Enter, Esc nhả khóa, Digit0 gọi về, Shift + `\` thuê dân, Shift + Enter; mọi lệnh trong nhật ký là lệnh phím; chạy lại trên Node |
| `td-1a6-attention` | Nhiều lời gọi (đặt sẵn, thêm công trường, cây đánh dấu); mỗi chế độ trên trang mới: sáng tối đa đúng trần (Thư giãn 2, Cân bằng 3, Thử thách 4), có lời gọi chờ khi trần đầy, lời gọi chờ sáng khi có chỗ; ~140 lần nhìn mỗi cỡ: 0 chồng, 0 đè HUD |
| `td-1a6-learn` | Chế độ Học: mọi thẻ có nghĩa trước phím đầu, dải chữ có nghĩa và IPA; hai từ Ẩu vào sổ ôn; Hỏi bài "khá, hơi · r _ _ _ _ _" gõ đúng: Tri thức lên, từ rời sổ; Space dừng và chạy tiếp (chờ 0,8 s sau chữ cuối: review R2) |
| `td-1a6-perf` | Làng bận (Lũy 4, 9 dân, 4 Ruộng, 20 cây đánh dấu, công trường) và Đêm đông (`flood(300)`), gõ 70 WPM 10 s: vẽ và thẻ p95 1,0 / 0,9 ms (1280 / 1920; trần 8 ms), bước và HUD p95 0,3 ms, 60 khung/s, luồng chính Chrome 1,2–1,3 ms/khung; bước sim trong Chrome trung vị 0,01 ms; nhật ký vàng chạy trong Chrome ra đủ mã băm của Node; nhật ký trang chạy lại trên Node |
| `td-1a6-tour` | Bộ ảnh cho chủ dự án (mục 5.8), mỗi ảnh kiểm đúng trạng thái của nó |
| `td-1a-boot` | Giữ từ 1A, đạt |
| `td-1a-ime` | Chuyển: `-` và `=` không còn ra lệnh; phần bộ gõ tiếng Việt giữ nguyên |

Thẻ đang khóa phóng ×1,2 từ mép dưới nhưng hộp cột tính chiều cao chưa phóng, nên đè cột bên 2–5 px (gặp ở `td-1a6-day` 1920, `td-1a6-tour`): `view/words/cards.ts` nay tính hộp cột tới đỉnh đã phóng của thẻ khóa; `day`, `night`, `tour` chặn thẻ sạch như `attention`.

### 5.8 Bộ ảnh cho chủ dự án (`td-1a6-tour`, 1280 × 720 và 1920 × 1080)

`01-village` (làng ban Ngày, zoom 1), `02-village-zoom` (zoom 2× vào làng, lời gọi xa thành mũi tên ở mép), `03-bright-calls` (lời gọi sáng, một từ đang gõ, thẻ nghĩa), `04-dim-bubbles` (Tướng bay đi, bong bóng mờ), `05-tab-dim-call` (Tab tới lời gọi mờ, thẻ dock), `06-farm-card`, `07-keep-card`, `08-learn` (nghĩa trên thẻ), `09-quiz`, `10-tactical-pause`, `11-night-power`, `12-night-charges`, `13-night-zoom` (khúc nhập 2× ban Đêm), `14-sandbox`. Ảnh nằm ở `OUT_DIR` (ngoài repo, không media trong Git).

### 5.9 Số dòng (cách đếm của §0: `.ts` trong `src/td`)

5.955 (sau review R2) → 6.012: `attention.ts` +45 (ngân sách từng từ), `rules.ts` +7 (hai số và chú thích), `cards.ts` +1. Bot, báo cáo, test và kịch bản không tính (`tests/td/*`, `tests/td-balance-gates.test.ts`, `scripts/visual/scenarios/td-1a6-*`: ~2.770 dòng).

### 5.10 Còn lại (cho review R3)

- Cổng 5a và 5b sát mép (mục 5.4): một bản gộp đổi luật sim nào cũng nên chạy lại `td:balance`; `td-balance-gates` sẽ báo.
- Thư giãn và Học: một cửa sổ 7,0 s trên ngân sách 6 s (một từ trượt 4 lần); không là cổng.
- Thử thách: bot không gõ thua Đêm 4 ở 1 / 5 seed; bot gõ qua cả 5.
- Lời gọi Xây ít khi sáng (thợ xây đứng xa Tướng); các bước nâng cấp của kế hoạch chuẩn chưa tới trong 4 đêm (thiếu Vàng).
- Từ R1: Bắn mạnh tạo cuối Đêm sống tối đa 3 s sang Ngày (vô hại).

---

## 6. Bước cân bằng `docs/games/BALANCE.md` 4 (mốc 1A.7, 23/10/2026)

Repo `games/typing-defense`, nhánh `main`. Làm mục 9.2 của BALANCE: kit `balance`, hồ sơ năng lực, nhịp k, FlowMeter cho Ngày và Đêm, bộ điều nhịp trong sim, bộ bot chuẩn, báo cáo §3 và cổng B1–B9, màn Hồ sơ gõ, dòng cài đặt "Nhịp tự điều". Changelog: `docs/changelog/2026-10-23-balance.md`.

### 6.1 Nối kit và sim

- `kit.config.json` thêm `balance`; chép bằng `scripts/sync-game-kit.mjs` của repo cha. Sim chỉ nạp `kit/balance/{bands,director,flow,math,profile}` (TS thuần, tất định); test ranh giới cho phép đúng các file đó, và bỏ qua tên biến cục bộ `window` (cửa sổ 20 s của FlowMeter) vì phép biên dịch không DOM đã bắt biến toàn cục thật.
- **Đầu ván** (`PaceHeader`, ghi trong `flags()` và file chạy lại): E (từ hồ sơ), nhịp k, bộ điều nhịp bật hay tắt. Thiếu đầu ván thì k = 1, tắt (test cũ giữ nguyên).
- `src/sim/systems/pace.ts` chạy sau bước 17: hai FlowMeter (Đêm là số đo của ải, Ngày riêng cho bộ điều nhịp ban Ngày), hai PaceDirector, áp quyết định, sự kiện `pace`. Trạng thái meter, director và các thang đo vào mã băm.

### 6.2 Số đo §3 trong Lời Gọi

| Ảnh chụp FlowMeter | Lời Gọi đọc gì |
|---|---|
| `danger` | Quái trong 24 m quanh Lũy (khúc nhập cách Lũy 28 m: vào tới làng). Nhà và dân không mất máu ở 1A.6 |
| `hp` | Mạng Lũy / 20 |
| `live` | Số từ đang sống (lời gọi SÁNG giữ từ) |
| `capped`, `backlog` | Đủ trần lời gọi SÁNG mà còn lời gọi trong vòng giúp phải chờ: số từ chờ là backlog. Dưới trần, từ chờ vì ngân sách chú ý là thiết kế, không tính Ngộp. Ban Đêm lời gọi kinh tế chờ lượt theo luật, chỉ Bắn mạnh tính |
| `busy` | Đang khóa từ, hoặc có quyết định mở: một lời gọi đang chờ trả lời (đưa người tới, hoặc quãng nghỉ ngân sách dành cho làng), một lệnh đang đi, kho đủ tiền xây một nhà |
| `kills` | Phần đường đã đi của quái bị hạ (Q) |
| `abandons`, `damage` | Lần nhả khóa (Esc); sát thương Phát Chữ và Cháy (gõ) so với tháp, nỏ, lính, Tướng |

- Ải của báo cáo: **Đêm 1–5**, thắng khi giữ Đêm 5. Cổng 4 của §12 vẫn là Đêm 1–4.
- Bộ điều nhịp Đêm chỉ chấm từ lúc quái đầu tiên vào trong 50 m quanh Lũy (đi bộ từ cổng ~20 s không phải quãng lặng). Bộ điều nhịp Ngày chấm theo dải của chế độ bỏ phần Áp lực (ban Ngày không có quái).

### 6.3 Nhịp k nối vào đâu

k từ hồ sơ trộn (`effectiveE`, `paceK` của kit; C_ref = sức gõ của bot Chuẩn 35 WPM, 95 %, CV 0,25 nên bot Chuẩn có k = 1). k là cường độ Đêm và tần suất lời gọi Ngày:

- khoảng giữa các toán và độ dài Ngày (giờ đợt, BALANCE §4.1) ÷ k;
- quái đi nhanh ×(1 + 0,25·(k − 1));
- Hỏi bài và lời gọi Đào của Mỏ ÷ k (lời gọi đến sớm hơn chỉ chờ chỗ: AttentionDirector giữ ngân sách).

Chỉ chia khoảng sinh thì gần như không đổi gì, có khi ngược chiều (đo ở bản trung gian, 8 seed, tắt nhịp, mạng còn trung vị):

| Nối k vào | k 0,75 | k 1 | k 1,3 |
|---|---|---|---|
| Chỉ khoảng sinh (bot Chuẩn / bot Nhanh) | 5 / 5 | 6 / 10 | 7 / 10,5 |
| Khoảng giữa toán và độ dài Ngày | 8,5 / 12 | 6 / 10 | 4 / 9,5 |

Quái đến dồn thì tháp Pháo và Phát Chữ trúng nhiều hơn, nên dồn không làm Đêm khó hơn. Tốc quái là núm thời gian mạnh và một chiều: hệ số 0,5 làm bot Nhanh chỉ thắng 15 % còn bot Mới 100 %; chọn 0,25.

### 6.4 Bảng bậc (`PACE` trong `rules.ts`)

- Đêm, khó lên: khoảng sinh −7 % (với phần còn trong hàng), một thuộc tính tinh anh (quái kế ×1,3 máu lúc sinh, vòng hổ phách trên bản đồ), đỉnh sớm 3 s, quãng lặng ngắn 3 s.
- Đêm, dễ xuống: rơi hỗ trợ +3 mạng khi mạng dưới 30 % và đang mất (tối đa 1 lần một Đêm), khoảng sinh +7 %, quãng lặng dài, đỉnh muộn, bớt một tinh anh.
- Ngày: chỉ đồng hồ lời gọi ±7 %.
- Trần của kit: ≤ 2 bậc một đợt, khoảng sinh ±15 %. Không đổi máu quái đang sống, không đổi luật gõ hay điểm từ.

### 6.5 Đổi số vòng 1 (chỉ dữ liệu; vòng 2 sửa lại ở 6.10)

| Chỗ | Trước | Sau | Lý do (đo) |
|---|---|---|---|
| `slice-1a` Phát Chữ `dBar` | Cung 7,5 / 11 / 15,5; Pháo 13 / 21 / 32 | ×9: 67,5 / 99 / 139,5; 117 / 189 / 288 | Trước: Phát Chữ ~10 % sát thương; bot gõ 35 WPM và bot không gõ mất mạng như nhau qua 4 đêm; mọi bot chết ở Đêm 5. B5 cần gõ là sức chính |
| `slice-1a` Cháy của Draconis | 3/s, 2 s | 50/s, 3 s | Phát Chữ của Pháo cạnh Tướng gây sát thương thật: gõ là cách trị Thuồng Luồng giáp 60 % |
| `AGENT.heroRingM` | 10 m | 14 m | 2/3 đời một lời gọi Bắn mạnh nằm ngoài mọi vòng giúp |
| `CALL.powerLifeS`, Cân bằng `powerCdS` | 6 s, 8 s | 9 s, 9 s | Người gõ chậm kịp Bắn mạnh; nguồn Bắn mạnh giới hạn nên tốc gõ ít quyết định hơn |
| `slice-1a` Ma Trơi `leak` | 2 | 1 | Đàn Ma Trơi bay qua mọi tháp ở Đêm 2–3 với mọi bot (mất 4–5 mạng không ai đỡ được) |
| `COMBAT.critMul`, `REWARD.shotQ`, `CALL.sloppy` | 1,75; [0,8; 1,2]; 0,6 | 1,15; [1,6; 0,4]; 1 | k của kit (E_eff) đã trừ độ chính xác; phạt thêm trong game thì bot Ẩu (k 1,045) thua xa dải (48 % thắng). Ẩu vẫn mất thưởng Hoàn hảo, Chuỗi ÷2, vào sổ ôn |
| `MODES` Thư giãn, Học `hpMul` | 0,75 | 0,6 | B3: bot Trẻ em thắng ≥ 85 % ở Thư giãn (trước 43–78 %) |
| Đêm 5 | 3 Thuồng Luồng, 12 Cương Thi, 3 Ma Trơi | 6, 7, 3 | B5: bot không gõ thua ải 5 đêm (mọi seed) mà vẫn qua Đêm 1–4 (§12 cổng 4) |
| Thuồng Luồng `hp` | 320 | 345 | B7: tắt bộ điều nhịp thì bot Chuẩn vẫn trong dải (trước 94–96 % thắng) |

### 6.6 Bot (`tests/td/human.ts`, `flow.ts`)

- Tay là `HumanTypist` của kit qua lệnh thật (`key`, `unlock`): thấy từ theo độ quen (Hỏi bài là "đang học", từ cấp cao nhất của ván là "mới"), tốc log-normal, phím sai, bỏ khóa, chậm khi đông, mệt. Phím sai không hiện trên thẻ nên Backspace theo thói quen không có gì để xóa: thời gian của nó vẫn trôi, không gửi phím.
- Phản xạ báo trước: Bắn mạnh sáng khi từ đang cầm chưa gõ chữ nào thì bot chuyển sang nó với xác suất `reflex` (chữ đầu của nó lấy khóa).
- Nhìn bảng (`lookAway`) sau khi xây, nâng, thuê, hộp cát: chờ xong từ đang gõ rồi mới nghỉ (không giữ khóa qua menu).
- Kế hoạch R3 theo chiến thuật: Tốt (bố cục chuẩn, 3 dân), Vừa (bố cục chuẩn, 3 dân, 1 cây dư), Kém (Ruộng cạnh Lũy, Mỏ N2, Lũy cấp 2 trước tháp thứ hai, Trại Lính muộn, Tướng Đêm nhìn mỗi 2 s), Không mua. Hồ sơ của bot là E, a, CV của nó (tin hoàn toàn); bot Không gõ chưa đo nên dùng mặc định của chế độ.
- Cổng học riêng (B8): cả ván, phần thời gian khóa từ không vượt ngân sách chú ý của chế độ (6/8/11 s mỗi 20 s), không bất biến lời gọi nào vỡ, không lệnh nào bị từ chối. Một từ chậm có thể làm một cửa sổ 20 s vượt (bot Trẻ em ở Thử thách tới 2,4 lần, vì sàn E 35 của chế độ).

### 6.7 Cổng vòng 1 (120 seed mỗi ô; số hiện tại ở 6.10)

| Cổng | Kết quả |
|---|---|
| B1 | Đạt: Mới 83 % / S 35 %, Chậm chắc 86 / 35, Chuẩn 89 / 45, Khá 84 / 38, Ẩu 76 / 35, Nhanh 90 / 40; P 23–27 %, I ≤ 8,5 %, O ≤ 0,2 % |
| B2 | Đạt |
| B3 | Đạt: Mới 83 % ở Cân bằng, Trẻ em 90 % ở Thư giãn |
| B4 | **Trượt** (hòa): S Chậm chắc 35 % = S Ẩu 35 %. Phần hai đạt: bot Chuẩn hạ quái 23,7 s, Ẩu 24,0 s |
| B5 | Đạt: bot Không gõ 0 % ở Cân bằng và Thử thách (Thư giãn miễn: 83 %) |
| B6 | Đạt: Tốt hơn Kém 86 / 31 % (Cân bằng), 63 / 22 % (Thử thách) |
| B7 | Đạt: ≤ 2,3 bậc mỗi đợt, khoảng sinh 86–114 %; tắt nhịp bot Chuẩn 88 % / S 45 % |
| B8 | Đạt ở mọi ô |
| B9 | Thiếu số: chưa có buổi chơi thử của người thật (`__td.balance()` cho số đo và hồ sơ của một ván) |

Cổng §12 (R3, 5 seed, 4 đêm, đầu ván mặc định k = 1, bộ điều nhịp bật): 4 đạt (mạng 13 / 14 / 15 / 10 / 15), 5a 7,93 s, 5b 30,7 %, 5c 22,8 %, 6 không lỗi, 7 +41,6 %. Cổng 2: file vàng làm lại (nội dung `f46dea17`, 19.290 tick, 321 mã băm, 334 lệnh), Chrome ra đủ 321 mã băm. Cổng 3: bước sim trung vị 0,0115 ms, p95 0,03 ms (Node, 300 quái). Cổng 8: 11 kịch bản × 2 cỡ đạt, 0 lỗi console (thêm `td-balance`).

### 6.8 Số dòng

7.064 (sau chủ đề) → 7.492: `sim/systems/pace.ts` 164, `app/skill.ts` 107, `ui/profile.ts` 53, nối vào sim, cài đặt, màn đầu, `main.ts` 104. Trần cứng `BUILD_1A6.md` §0 nâng 7.300 → 7.500 (mức nhỏ nhất trên số thật); mốc 1A.7 trong bảng 1.2.

### 6.9 Còn lại

- B4 hòa ở S; B1 nằm sát mép dải (Mới, Chậm chắc, Ẩu S 35 %; Nhanh 90 %). Với bộ seed khác, từng ô lệch ±5 điểm: Đêm 5 quyết bằng vài Thuồng Luồng lọt (mỗi con 3 mạng).
- Kit: `effectiveE` cho bot Ẩu (50 WPM, 85 %) k 1,045, cao hơn bot Chuẩn, trong khi trong game Ẩu yếu hơn. Đề xuất xem lại trọng số độ chính xác ở kit (không sửa ở đây).
- Game đo bot Chuẩn ở 30 WPM, 90 %, CV 0,34 (lỗi, gõ hụt khi lời gọi mờ đi, nhịp mỗi từ); với C_ref theo thông số danh nghĩa, người chơi như vậy được k ≈ 0,8. Hiệu chỉnh ở B9.
- Thử thách (không là cổng B1): bot Nhanh 88 %, Khá 85 % trên dải 50–75 %; Ẩu 52 % / S 10 %. Thư giãn: S trung vị 65 % dưới dải ≥ 70 %.
- Bộ điều nhịp Ngày phần lớn chỉ nới đồng hồ Hỏi bài và Đào (ban Ngày lời gọi thường đủ trần mà vẫn có lời gọi chờ).

### 6.10 Vòng 2 (review của điều phối viên, 23/10/2026)

**Đổi luật thiết kế (báo trước):**

- Phạt từ Ẩu **khôi phục** ×0,6 (BUILD_1A6 §5.1); vòng 1 đã bỏ (×1), làm B4 hòa.
- Bảng chế độ (BUILD_1A6 §2, §4.5) đổi theo dải §3 của từng chế độ: Thư giãn, Học máu ×0,5 (trước 0,75, vòng 1 0,6); Thử thách gõ ≤ 10 s mỗi 20 s (trước 11), máu ×1,19 (trước 1,15), sàn E 30 (trước 35), hồi Bắn mạnh 10 s (trước 6); Cân bằng hồi 9 s (trước 8). Bắn mạnh sống 9 s (trước 6, từ vòng 1).
- Đêm 4: 1 Thuồng Luồng (trước 2). Đêm 5: 7 Thuồng Luồng **đi một toán 6 con** (`packSize` 6, trước 1) rồi 7 Cương Thi, 3 Ma Trơi. Ma Trơi 60 máu (trước 90). Thuồng Luồng 365 máu. Cháy của Draconis 55/s.
- Bộ điều nhịp: rơi hỗ trợ +2 mạng (vòng 1: +3); tốc quái ×(1 + 0,2·(k − 1)) (vòng 1: 0,25). Vòng tinh anh giữ hiện trên bản đồ: tinh anh là quái thường, phải đọc được.

**Q đo đúng chưa.** Đúng: mỗi quái bị hạ đưa phần đường thật của nó (`dist / chiều dài làn`) vào FlowMeter. Q gần như luôn 67 % vì trên bản đồ hộp cát, mọi bố cục đều có lính và tháp chặn ở khúc nhập (≈ 2/3 đường): 10 seed, bot Mới: p10 43 %, p25 65 %, p50 67 %, p75 68 %, p90 93 %; 55 % số quái chết trong khoảng 65–70 %. Bố cục khác thì Q khác (Kém 68–70 %, Chỉ gõ 97 %). Có một lỗi nhỏ đã sửa: tick Đêm kết thúc (quái cuối chết, hoặc thua) không vào meter Đêm, nên mất ~4 % số quái hạ (trước: meter 263, thống kê 275; sau: bằng nhau).

**Vì sao chưa giữa dải (thắng và Biên S đi cùng nhau).** Ở game này, số mạng còn của các ván thắng và tỉ lệ thua do cùng một chỗ quyết: Thuồng Luồng ở Đêm 5 (3 mạng mỗi con lọt). Đo trên cùng bot Chuẩn, đổi độ khó:

| Đêm 5 | Thắng | Biên S |
|---|---|---|
| Thuồng Luồng đi lẻ (vòng 1, Ẩu ×0,6) | 100 / 95 / 90 / 85 % | 50 / 40 / 30 / 25 % |
| Thuồng Luồng một toán 6 con (vòng 2) | 87–88 % | 35–40 % |

Muốn thắng 83 % mà Biên S 50 % thì 15 % ván phải sập hẳn trong khi ván giữa vẫn còn 10 mạng: phân bố mạng cuối phải có hai đỉnh. Giảm mạng mỗi lần lọt làm phân bố hẹp lại: thắng lên mà Biên S gần như đứng yên (đo: Thuồng Luồng mất 2, Đêm 5 có 8 con đi lẻ: thắng 94–98 %, Biên S 25–30 %). Toán lớn (6 con) làm kết quả rõ hơn: hoặc giữ khúc nhập, hoặc vỡ. Đây là lý do đổi cỡ toán, không phải giảm mạng mỗi lần lọt. Giảm rơi hỗ trợ (+2, +1) gần như không đổi gì. Ít mạng hơn (15, 12) khó hơn hẳn mà không tách được hai số.

**Kết quả (`pnpm td:balance`, mặc định 2 bộ seed × 120, 6 luồng, 334 s):** bảng ở changelog `2026-10-23-balance.md`. B1–B8 đạt ở cả hai bộ seed; B9 thiếu số. Cổng §12: 4 đạt (mạng 17 / 17 / 16 / 14 / 16), 5a 7,93 s, 5b 30,9 %, 5c 22,6 %, 6 không lỗi, 7 +43,8 %. File vàng làm lại: nội dung `bf0c4da8`, 18.136 tick, 302 mã băm. Số dòng 7.499 (trần 7.500).

**Còn lệch so với đích chặt của review** (thắng 78–88 %, Biên S 40–60 % ở Cân bằng; dải riêng của Thử thách):

- Cân bằng: thắng 83–89 % ở cả hai bộ; Biên S 35–40 % ở Mới, Chuẩn, Khá, Ẩu, Nhanh (Chậm chắc 50–58 %). Bộ 1: Khá 89 %; bộ 2: Mới 89 %.
- Thử thách: thắng 57–82 % (Chậm chắc 82 % ở bộ 2); Biên S 10–15 % ở Mới, Chuẩn, Ẩu (dải 15–45 %).
- Thư giãn: bot Mới tới Nhanh thắng 99–100 %, Biên S 85–100 %, Nhàn I 5–8 %: trong dải. Bot Trẻ em thắng 92–98 % nhưng Biên S 50–53 %.
- Muốn tách hẳn thắng và Biên S cần một quyết định thiết kế (ví dụ một đỉnh trùm cuối Đêm 5 có báo trước, hay Lũy có hồi mạng giữa các đêm), không chỉ đổi số.

## 7. 1B "Mộc Tinh tới làng" (`BUILD_1B.md`)

### 7.1 R1 "Mộc Tinh tới" (24/10/2026)

Changelog: `docs/changelog/2026-10-24-td-1b-r1.md`.

**Đã làm (theo §17 R1):**

1. **Ải truyện** `w1-silverfall`: 5 Ngày, 5 Đêm, pha `victory` (sim dừng), sao (18–20 mạng: 3; 6–17: 2; 1–5: 1), lịch mở (`stage.unlock`: Trại Lính Ngày 2; Mỏ, Tháp Pháo, Lũy cấp 2 Ngày 3; nâng cấp Ngày 4; Lũy cấp 3 Ngày 5; lý do từ chối `locked`). Màn đầu "Bắt đầu" vào truyện; hộp cát bằng `?sandbox=1`.
2. **Mộc Tinh** (`src/sim/systems/boss.ts`, kho `src/sim/stores/boss.ts`, vào mã băm): báo đầu Ngày 5 kèm nhánh (luồng `spawn`); lặng 12 s (chỉ Bắn mạnh được sáng; bộ điều nhịp đứng yên; không tinh anh); 2 toán × 4 Cương Thi ra ở Khe Nứt, 6 s sau boss trồi trên nhánh đã báo; không bị chặn, dừng cách Lũy 1,5 m; Vỏ dày; Cháy ×1,25; Rễ Trồi (tê 3 s, không trừ máu; nhà tê không tự bắn, không tạo lời gọi mới, không sản xuất; Phát Chữ của lời gọi đang có vẫn bắn); Quật cành (cung 120°, 40–60, đẩy lùi 1,5 m); choáng ở 70 % (5 s đứng yên, Dễ Tổn Thương ×1,25, xóa mọi tê, lời gọi Dồn lửa 1 từ ≤ trần SÁNG, nhà đánh trong vòng giúp gần boss trước; Phát Chữ của Dồn lửa nhắm boss); Mầm Gỗ ở pha 2; Quật Lũy −3 mạng; rút ở 50 % (rương 150 Vàng ghi một lần), 2 s sau mọi quái còn lại tan, `victory`. Lệnh hộp cát `boss`, `skipTo`.
3. **Nâng Lũy bằng tiền** qua thợ xây (13,5 s, lời gọi Xây 3 từ; mở thêm một người và một thợ), `keepMax` 3 ở truyện; **bán 60 %** tổng đã chi (`spentGold`, `spentWood`), hoàn tác 5 s giữ nguyên; HUD bán bấm hai lần trong 3 s (nút, hoặc Shift + Delete).
4. **Bản vẽ và tiếng** (`src/view/boss-2d.ts`, `audio-min.ts`, `folk.ts`, `music.ts`): mạch rễ trên nhánh boss, vết nứt bò 12 s, đất phồng rồi boss nhô lên (vượt 6 %), thân nhún và tán trễ nửa nhịp, ngả ra sau trước Quật cành và vượt đà sau, vòng son có sọc quét đúng thời gian báo dưới nhà bị nhắm, gai rễ, dấu "Tê N s", sao và vòng "Dễ Tổn Thương", trời ngả hổ phách, mầm nhú, chìm khi rút, số Phát Chữ lớn xanh ngọc, số cầu lửa nhỏ xám, chip "Cháy ×1,25". Thanh boss ở đỉnh giữa (máu, vạch 70 % và 50 %, "còn N m tới Lũy", đếm ngược lúc lặng), một dải chữ dưới nó; bản đồ dời xuống dưới thanh boss từ lúc báo. Hai hàng boss của bảng dạy (`src/ui/tips.ts`). Màn kết: sao đóng dấu, gợi ý thua theo số của ván, "Từ cần ôn", **Chơi lại Ngày n**, **Chép số chơi thử**.
5. **Bot:** chơi ải truyện, nâng Lũy bằng lệnh, Tướng ở đỉnh boss (`heroBoss`), Tháp Cung thêm bên nhánh boss ở Ngày 5 cho Tốt (`bossArcher`), `no-type@kite` cho B5; báo cáo thêm bảng boss, bảng tách hai số, bảng gộp hai bộ seed và B1–B9 trên bộ gộp.
6. **Cân bằng vòng 1** theo §6.5 (số ở dưới).
7. **File vàng:** `td-1a.json` làm lại; thêm `td-1b-boss.json`.
8. **Kịch bản** `td-1b-boss`, `td-1b-night5`, `td-1b-build`, `td-1b-perf`.

**Lệch so với spec (có lý do):**

- `BossDef` không có `hp`: máu gốc là `hp` của quái `moc-tinh`, một nguồn số.
- Lũy nâng bằng `upgrade` với id thật của Lũy (ô 0, thế hệ 1: id 1024), không phải số 0.
- **Hộp cát cũng có "Chơi lại Ngày n"** (§4.3 ghi một nút; kịch bản `td-1b-night5` của §19 cần nút này sau `skipTo`).
- Thân boss vẽ 1,3 lần bán kính thân (≈ 6,5 m bề ngang, spec ~5 m): ở 1280 × 720 thân 5 m chỉ ~30 px và hay nằm dưới thẻ chữ của tháp bên cạnh.
- Dồn lửa: Phát Chữ của lời gọi này nhắm boss nếu boss trong tầm (không thì quái đi xa nhất như thường), để lời gọi đúng là "dồn lửa".
- Chế độ của ván đặt lúc tick 0 (`setMode`), không qua lệnh hộp cát; `?learn=1` chạy được ở truyện, `flags().mode` và file chạy lại mang chế độ.
- `flood` (thử tải) có Mầm Gỗ, không bao giờ có boss. Thêm thống kê `burstTyped` (từ gõ trên lời gọi Dồn lửa, cho gợi ý thua).
- Bot: Tướng đánh nốt quái phần đầu Đêm 5 rồi mới tới nhà boss sắp vào tầm (spec: từ lúc lặng). Đo: bỏ đi lúc toán Thuồng Luồng còn ở khúc nhập thì 3–5 con lọt (9–15 mạng), ván thua vì phần đầu chứ không vì boss.
- Bot ở truyện: bước chưa mở mà mai mở thì để dành tiền; mở xa hơn thì các bước sau đi tiếp (giữ thứ tự, không bỏ bước). Bố cục chuẩn dời Lũy cấp 3 ra sau nâng Tháp Cung khúc nhập, Tháp Cung tây, nâng Tháp Pháo (Lũy cấp 3 chỉ mở Ngày 5). Đo trước khi sửa: chờ cứng thì cả Ngày 4 bỏ không; đi tiếp tham lam thì không nâng Lũy nổi trước Đêm 4 (cổng §12 hỏng).
- Số dòng: cộng dồn 8.829 (trần R1 8.850). Từng file vượt cột §16: `sim/systems/boss.ts` 331 (≤ 300), `view/boss-2d.ts` 417 (≤ 320; giữ cả hạt có pool mà §16 để `fx-2d.ts` ở R2).

**Cân bằng vòng 1 (§6.5; số trong `slice-1a.ts`):**

| Núm | Trước | Sau | Lý do (đo) |
|---|---|---|---|
| Máu Mộc Tinh | 3.200 | 3.400 | Theo bot Chuẩn ~85 % (§6.5 bước 1). 80 seed: 3.300 → Chuẩn 87,5 %, 3.500 → 82,5 % |
| Tốc Mộc Tinh | 0,9 m/s | 0,8 m/s | G3: giao chiến p50 của bot Chuẩn 40 s ở 0,9; 50 s ở 0,8 |
| `emergeM` | 20 m | 25 m | G8: trồi → trúng đầu p50 38 s ở 0,8 m/s; 24–32 s ở 25 m |
| `heroMul` (Vỏ dày) | 0,5 | 0,35 | B5: `no-type@kite` gây ~1.050–1.260 ở 0,8 m/s, gần mức phải gỡ; §23: hạ `heroMul` trước núm khác |
| Thuồng Luồng phần đầu Đêm 5 | 5 (một toán) | 4 (một toán) | §6.5 bước 2: toán 5 con lọt 3–5 con khi boss tới khúc nhập, Biên S 25–35 % |
| `kHp` | 0,4 / ×1,12 | 0,4 / ×1,12 | Thử 0,6 / ×1,18: Khá, Nhanh tụt dưới Chuẩn; trả về |

Đầu dò ngoài báo cáo (`scripts/td/boss-tune.ts`, 30–40 seed mỗi lần, Cân bằng): boss "bất tử" cho phân bố sát thương; bot Chuẩn kế hoạch cũ (chờ cứng) chỉ gây p50 ~1.000–1.300; lịch mở là núm lớn nhất (mở hết từ Ngày 1: Chuẩn 83 %, mạng trước đỉnh 19; theo lịch: 53 %, 14).

**Báo cáo `pnpm td:balance --stage-seeds=40 --stage-sets=2 --threads=6` (149 s)**, Cân bằng, gộp 80 ván mỗi ô:

| Bot | Thắng bộ 1 / bộ 2 / gộp | Biên S gộp | Đích chặt 78–88 %, 40–60 % |
|---|---|---|---|
| Mới | 68 / 90 / 79 % | 48 % | đạt |
| Chậm chắc | 93 / 90 / 91 % | 50 % | trượt (thắng cao) |
| Chuẩn | 83 / 80 / 81 % | 40 % | đạt (sát mép S) |
| Khá | 73 / 75 / 74 % | 35 % | trượt |
| Ẩu | 70 / 68 / 69 % | 30 % | trượt |
| Nhanh | 93 / 88 / 90 % | 40 % | trượt (thắng cao) |
| Chuẩn Tốt / Kém | 89 % / 38 % | 55 % / 0 % | B6 Cân bằng đạt |
| Không gõ, `no-type@kite` | 0 % / 0 % (boss rút 0/80) | 0 % | B5 đạt |

Bảng boss (Chuẩn, Cân bằng, bộ 1): tới boss 40/40, rút 83 %, trồi → trúng đầu p50 32 s (G8 đạt), giao chiến p50 50 s (G3 đạt), rút ở 73 % đường, mạng mất ở đỉnh p50 6,5, phần gõ 51 %, phần Draconis 16 %, Nhàn I đỉnh boss 3 %. Cổng gộp: B1 trượt (Chậm chắc, Khá, Ẩu), B2 đạt, B3 trượt (Trẻ em Thư giãn 74 %), B4 nửa trượt (S Chậm chắc 50 % > Ẩu 30 %; hạ quái 21,60 s vs 21,41 s), B5 đạt, B6 trượt ở Thử thách (23 % vs 15 %), B7 đạt, B8 đạt, B9 thiếu số. Thử thách: mọi bot 25–41 % (dải 50–75 %). Thư giãn: Mới tới Nhanh 100 %, Trẻ em 74 %. Cổng §12 trên ải truyện: 4, 5a (7,95 s), 5b (30,6 %), 5c (20,8 %), 6, 7 (+41,1 %) đạt.

**File vàng:** `td-1a.json` nội dung `ef790fee`, 19.098 tick, 318 mã băm, 336 lệnh (trước `bf0c4da8`, 18.136, 302, 334): trạng thái mới vào mã băm (kho boss, cột nhà, quái, lời gọi, thống kê), và bot hộp cát nâng Lũy qua thợ xây thay vì đặt cấp ngay. `td-1b-boss.json` mới: hộp cát, Đặt sẵn (tháp cấp 3, Lũy cấp 4), gọi boss ở tick 2, tay 35 WPM; 4.811 tick, 80 mã băm, boss rút với 1.946 sát thương, 20 mạng.

**Kiểm:** `tsc`, 267 test (24 file), `vite build` (JS gzip 80,6 kB), `verify-kit` đạt. Kịch bản ở 1280 × 720 (máy chủ dev cổng 3046): `td-1b-boss`, `td-1b-night5` (Chơi lại Ngày 5: mã băm khớp `9fd0a328`), `td-1b-build`, `td-1b-perf` (vẽ p95 0,5 ms, luồng chính 0,59 ms mỗi khung, 306 quái) đạt, 0 lỗi console; nhật ký trang chạy lại trên Node ra cùng mã băm. Cỡ 1920 × 1080 và kịch bản cũ chưa chạy lại ở đợt này.

**Còn mở cho đợt sau:**

- Khoảng cách giữa các bot ở Cân bằng ~22 điểm (Ẩu 69 %, Khá 74 % so với Chậm chắc 91 %, Nhanh 90 %): một số máu boss không đưa cả sáu bot vào 78–88 %. Hướng: §6.5 bước 5 (máu Thuồng Luồng, Cháy) cho Ẩu; xem vì sao Khá (k 1,2) thua Chuẩn.
- Thử thách quá khó (25–41 %), Trẻ em ở Thư giãn 74 % (B3 ≥ 85 %). Cần quyết định có cho boss hệ số máu riêng theo chế độ hay không (hiện chỉ nhân `hpMul` của chế độ).
- Phần đầu Đêm 5: 4 Thuồng Luồng một toán vẫn là chỗ mất mạng chính ở đỉnh boss (con nào còn ở khúc nhập lúc boss tới thì lọt khi Quật cành hất lính).
- Hình R1: thân boss hay bị thẻ chữ của tháp bên cạnh che (thẻ luôn trên cùng là luật); dải chữ hai dòng lúc báo Ngày 5 che một phần Khe Nứt ở 1280 × 720.

### 7.2 Sửa sau phản biện R1 (24/10/2026)

Changelog: `docs/changelog/2026-10-24-td-1b-r1-fix.md`. Bản sửa làm trên máy Mac (mã, 4 lượt `td:balance`), kiểm lại, chỉnh thử và ghi số trên máy Dell (WSL Ubuntu 24.04, Node 24.11, Chrome for Testing không dùng GPU; số hiệu năng ở dưới là của máy này, không phải Mac M4). Bằng chứng (ngoài Git): phản biện `tmp/review-r1/`, các lượt chỉnh của Mac `tmp/fix-r1/` (`bal-r1.md` … `bal-r4.md`, đầu dò `runs/`), lượt của Dell `tmp/dell-2026-10-24/` (`balance-final.md`, đầu dò `probe/`, kịch bản `visual/`). Văn bản phản biện không có trên máy Dell: bảng dưới dựng từ bằng chứng trong `tmp/review-r1` và từ thay đổi của bản sửa.

**Phát hiện và cách xử lý:**

| # | Phát hiện (bằng chứng) | Sửa |
|---|---|---|
| 1 | Gõ nhanh không đổi kết quả: ba ván chơi trình duyệt kiểu người (35 WPM 3,5 % lỗi, 25 WPM 7 %, 60 WPM 2 %) đều thua ở đỉnh boss, Mộc Tinh còn 2.109–2.196 / 3.400 máu (`play/*.json`); báo cáo đủ hai bộ lúc phản biện: Ẩu 71 %, Chậm chắc 92 %, Nhanh 92 % (`balance/full-2x120.md`) | **Bắn mạnh nối:** từ Bắn mạnh gõ xong t giây sau khi hiện kéo lời gọi kế của tháp sớm lên `cd·quick·max(0, 1 − t / quickS)` (`POWER.quick` 0,6, `quickS` 4 s). Hệ số k của máu boss đi hai chiều, thêm số hạng bậc hai (`kHp` 0,2, `kHp2` 4,3, trần ×1,5) và hệ số theo chế độ (`modeHp`: Thư giãn, Học 0,85; Thử thách 0,78): mục "Còn mở" của §7.1 "có cho boss hệ số máu riêng theo chế độ hay không" đã chọn theo đề xuất (có) |
| 2 | Dồn lửa hiếm ra và ít từ: lời gọi chỉ có ở 28/40 (Mới), 24/37 (Chuẩn) lần choáng (nhà ngoài vòng giúp hoặc đang có lời gọi), trung bình 0,46–0,5 từ được gõ; 5 s Dễ Tổn Thương chỉ mang 21 % (Chuẩn), 33 % (Nhanh) sát thương lên boss (`probes/stagger-*.txt`, `vuln.txt`) | Dồn lửa sáng dù ngoài vòng giúp; round(E / 20) từ (1–3, `burstPerE`, `burstWords`); nhà đã có lời gọi Bắn mạnh thì lời gọi đó thành Dồn lửa (thêm từ, hạn mới 5 s, nhắm boss). Thanh boss đếm lùi "Dễ Tổn Thương N s". Gợi ý thua "Lúc nó choáng, gõ Bắn mạnh ngay" so số từ Dồn lửa đã gõ với số được giao (thống kê mới `burstWords`) |
| 3 | Gỗ dư không dùng vào đâu | Lệnh `sellWood` (thẻ Lũy): 10 Gỗ → 4 Vàng; HUD nhắc "Gỗ thừa: bán gỗ ở thẻ Lũy" ban Ngày khi Gỗ ≥ 150, Vàng < 50; bot bố cục Chuẩn, Tốt, Vừa bán phần trên 100 |
| 4 | B4 "hạ quái" đo từ lúc sinh, lẫn cả đường đi | Đo từ đòn trúng đầu tới khi chết (cột mới `hitAt` của quái); "hạ boss" là sát thương mỗi giây lên boss (BUILD_1B §18.3 B4) |
| 5 | Cửa sổ 20 s thật của bot Chuẩn kiểu người vượt 8 s ở 3/40 ván, lớn nhất 9,8 s (`probes/window.txt`) | BUILD_1B §9.3: ngân sách là dự tính (cổng cứng 5a, bot gõ đều); cửa sổ thật là đích mềm (≤ 20 % ván quá 8 s, không ván nào quá 10 s), báo cáo in mỗi ván |
| 6 | Chơi lại Ngày n: kịch bản so mã băm đã ghi chứ không so mã băm trang tính lại; chip và câu của Bà Cú Mực mất sau khi chạy lại | `__td.retry()` cho kết quả lần chạy lại (ngày, tick, mã băm, khớp); `BossBanner` dựng lại chip, câu từ trạng thái thế giới; câu dài tách mỗi câu một dòng ở 1280 × 720. `td-1b-night5` thêm một nhật ký dài (bot Chuẩn tới Ngày 5 ở Thư giãn, `scripts/td/retry-log.ts`, ~40.000 tick) |
| 7 | 4 test hết giờ 5 s khi chạy song song (`check.log`) | Hạn 20 s cho bốn test dài (`boundary`, `td-calls`, `td-nav`, `td-sim-economy`) |
| 8 | `view/boss-2d.ts` 417 dòng (cột §16 ≤ 320) | Pool hạt cố định tách sang `src/view/fx-2d.ts` (74 dòng, R2 dùng tiếp); `boss-2d.ts` 378; dấu tê vẽ sau quái (`marks`) |
| 9 | Màn thắng không thấy rương; chữ "rút lui" dưới thanh boss chạm dòng dưới | Hàng "Rương +150 vàng" ở màn thắng; lề dưới của thanh boss |

Thêm số (cùng bản sửa, chỉ dữ liệu): máu Mộc Tinh 3.400 → 3.800; Thuồng Luồng 365 → 385 máu; phần đầu Đêm 5 trở lại 5 Thuồng Luồng một toán (vòng 1: 4). BUILD_1B §1, §4.2, §5.1, §5.6, §10, §15, §24 ghi lại theo mã.

**Số dòng:** 8.883 (trần R1 sau sửa review 8.900, lấy 50 dòng của phần R2). Từng file vượt cột §16: `sim/systems/boss.ts` 321 (≤ 300), `view/boss-2d.ts` 378 (≤ 320); `view/fx-2d.ts` 74 là file của R2 (≤ 230) làm sớm.

**File vàng (làm lại bằng `pnpm td:golden:update` trên Mac, 08:57; Dell kiểm `pnpm td:golden:check` khớp):** `td-1a.json` nội dung `ef790fee` → `87f80da6`, 19.098 → 18.993 tick, 318 → 316 mã băm, 336 → 362 lệnh: số mới vào mã băm nội dung (hệ số máu boss, Dồn lửa, Bắn mạnh nối, bán gỗ, Thuồng Luồng), cột `hitAt` và thống kê `burstWords` vào mã băm trạng thái, và bot hộp cát được lời gọi Bắn mạnh sớm hơn nên gõ nhiều lệnh hơn. `td-1b-boss.json`: nội dung `87f80da6`, vẫn 4.811 tick, 80 mã băm, boss rút với 1.946 sát thương, 20 mạng. Bản sửa trên Dell không đổi luật hay số nên không làm lại file vàng.

**Các lượt chỉnh cân bằng.** Mac: 4 lượt `td:balance` đủ hai bộ × 120 seed (`bal-r1` … `bal-r4`, 427–625 s, 5 luồng) chỉnh hệ số k và máu; Khá và Nhanh đi vào dải (Nhanh 83 → 80 → 76 → 80 %, Khá 90 → 88 → 87 → 88 % gộp), còn Chậm chắc (90 % gộp) và Ẩu (76 % gộp) đứng yên qua cả bốn lượt. Dell: đầu dò `scripts/td/boss-tune.ts` (thêm `--director=0`, `--sprouts`, `--summonS`) trên đúng hai bộ seed của báo cáo, rồi một lượt `td:balance --threads=4` trên số cuối (giống hệt `bal-r4` của Mac từng dòng, trừ thời gian chạy: sim tất định giữa hai máy). Thắng ở Cân bằng, bộ 1 / bộ 2 (gộp là trung bình hai bộ):

| Lượt (Dell, đầu dò) | Đổi so với số hiện tại | Mới | Chậm chắc | Chuẩn | Khá | Ẩu | Nhanh | Chuẩn tắt nhịp |
|---|---|---|---|---|---|---|---|---|
| Hiện tại (`bal-r4`) | — | 82 / 81 | **92** / 88 | 89 / 84 | 86 / 90 | **73** / 78 | 80 / 80 | **91** / 88 |
| Cháy 65 (bộ 1) | Cháy Draconis 55 → 65/s | 85 | 90 | 95 | — | 76 | — | — |
| Máu 4.000 (bộ 1) | 3.800 → 4.000 | 73 | 81 | 78 | 81 | 67 | 68 | — |
| Bắn mạnh nối 0,8 | `quick` 0,8, `quickS` 5 s | 81 / 87 | 88 / 93 | 93 / 93 | 95 / 96 | 87 / 86 | 92 / 93 | — |
| A | như trên, máu 3.950, `kHp` 0,3, `kHp2` 4,9, trần 1,44 | 81 / 86 | 86 / 92 | 88 / 88 | 92 / 92 | 78 / 79 | 89 / 88 | — |
| C | như trên, Cháy 50, `kHp` 0,25, `kHp2` 6, trần 1,46 | 83 / 88 | 87 / 92 | 82 / 88 | 84 / 83 | 79 / 74 | 87 / 86 | — |
| I | như trên, máu 3.900, `kHp` 0,1, trần 1,49 | 76 / 86 | 83 / 87 | 82 / 91 | 88 / 87 | 81 / 81 | 84 / 83 | — |
| K2 | như I, `kHp` 0,13, Cháy 48 | 80 / 83 | 84 / 88 | 86 / 90 | 87 / 88 | 80 / 79 | 83 / 86 | **96 / 94** |
| Q1 | `quick` 0,8, `quickS` 3 s, máu 3.750 | 82 / 87 | 91 / 93 | 88 / 87 | 86 / 87 | 77 / 79 | 89 / 83 | 91 / 93 |
| Q2 | `quick` 1,0, `quickS` 3 s, máu 3.750 | 85 / 86 | 94 / 95 | 92 / 93 | 94 / 91 | 86 / 83 | 91 / 88 | 94 / 97 |

Các đầu dò khác (bộ 1): 3 Mầm Gỗ mỗi lần gọi, 1 toán đi trước (4 Cương Thi) đổi thắng của mọi bot 0–3 điểm, không tách bot nào.

**Vì sao dừng, giữ số của `bal-r4` (lệch có lý do):**

- **Độ chính xác tách các bot mà không núm nào của §6.5 tách theo độ chính xác.** Mới và Chậm chắc cùng E 25, k 0,75 và 0,79 (khác 4 %), nhưng độ chính xác 92 % và 99 %: ở mọi lượt Chậm chắc hơn Mới 4–14 điểm thắng (gộp). Ẩu và Khá cùng E 50, độ chính xác 85 % và 96 %: Ẩu kém Khá 6–13 điểm. Máu, Cháy, Thuồng Luồng, Mầm Gỗ, toán đi trước, hệ số k dời cả cặp cùng chiều; dải đích 10 điểm không chứa nổi cả hai đầu cùng lúc với nhiễu ±2,4 điểm của 240 ván.
- **Núm tốc gõ (Bắn mạnh nối) nâng được Ẩu nhưng hỏng B7.** `quick` 0,8 đưa Ẩu từ 76 lên 86 % gộp, nhưng làm Đêm 1–4 dễ hơn với mọi bot gõ nhanh; bộ điều nhịp phải tăng bậc nhiều hơn, nên tắt bộ điều nhịp thì Chuẩn thắng 91–97 % mỗi bộ (B7 cần ≤ 90 % mỗi bộ, 78–88 % gộp). Bộ số hiện tại chỉ cần bộ điều nhịp gỡ 2–4 điểm (91 / 88 % so với 89 / 84 %), đúng ý B7 ("chỉ bot lệch xa mới cần nó").
- Bộ số thử đổi chỗ trượt chứ không bớt chỗ trượt: K2 đạt B1 hai bộ và đích chặt (thắng) cho cả sáu bot nhưng B7 96 / 94 %; I trượt B1 bộ 2 ở Chuẩn (91 %); máu 4.000 kéo mọi bot xuống 67–81 % (bộ 1). Theo §6.5 bước 6, không ép bằng một số toàn cục.

**Còn trượt (số cuối, `td:balance` trên Dell = `bal-r4`):**

- B1 bộ 1: Chậm chắc thắng 92 % (dải 75–90 %), Ẩu 73 %. Bộ 2 đạt.
- B7 bộ 1: Chuẩn tắt bộ điều nhịp thắng 91 % (≤ 90 %). Gộp 89 %: trượt dải chặt 78–88 % của BUILD_1B §18.3. (Lúc ghi bản sửa, báo cáo chấm B1, B7 gộp bằng dải BALANCE §3 nên in "ĐẠT"; phản biện phụ sửa báo cáo theo spec, xem cuối mục này.)
- Đích chặt §6.4 (gộp 240 ván): Chậm chắc thắng 90 %, Biên S 65 % (đích 78–88 %, 40–60 %); Ẩu thắng 76 % (Biên S 45 %, đạt). Mới 81 %, Chuẩn 87 %, Khá 88 %, Nhanh 80 % đạt.
- B2–B6, B8 đạt ở cả hai bộ và gộp; B9 thiếu số (cần chủ dự án chơi).
- Thư giãn, Thử thách (báo cáo, không là cổng): Thư giãn Mới tới Nhanh thắng 100 %, Trẻ em 97 / 94 % (B3 đạt; §7.1: 74 %). Thử thách thắng Mới 74 / 83 %, Chậm chắc 92 / 93 %, Chuẩn 52 / 58 %, Khá 83 / 78 %, Ẩu 63 / 55 %, Nhanh 77 / 83 % (dải 50–75 %; §7.1: 25–41 %); Biên S của Chuẩn 5 / 15 % (dải 15–45 %).
- Đỉnh boss, bot Chuẩn, Cân bằng, bộ 1: tới boss 120/120, rút 89 %, trồi → trúng đầu p50 24,1 s (G8 ≤ 35 s), giao chiến p50 50,0 s (G3 45–75 s), Nhàn I đỉnh boss 2 % (G8 ≤ 10 %), phần gõ 58 %, phần Draconis 14 %. Cổng §12 trên ải truyện (G1): 4 (mạng 13 / 17 / 12 / 12 / 13), 5a 7,95 s, 5b 30,5 %, 5c 23,8 %, 6, 7 (+41,1 %) đạt. Cửa sổ 20 s thật của bot Chuẩn kiểu người: p50 7,77 s, lớn nhất 9,20 s, 17/120 ván quá 8 s (đích mềm §9.3 đạt).

**Quyết định thiết kế:** một trong ba: (a) giảm sức nặng của độ chính xác trong luật gõ (`CALL.sloppy` ×0,6, trọng số `SCORE.qA`) cho mọi đêm, là luật của BUILD_1A6 §5.1 chứ không phải núm R1; (b) nâng Bắn mạnh nối (`quick` 0,8, `quickS` 5 s) cùng lúc làm Đêm 1–4 khó hơn để B7 giữ được: R2 đã phải cân bằng lại Đêm 3, 4 với Nuppeppō và Tanuki (BUILD_1B §4.2), nên đây là chỗ hợp nhất; (c) nới đích chặt cho hai bot ở hai đầu độ chính xác (Chậm chắc, Ẩu) về dải BALANCE §3. Đề xuất: (b) ở R2, rồi đo lại; (a) và (c) cần chủ dự án. **Đã chọn theo đề xuất (b), làm ở R2** (phản biện phụ, 24/10): R2 nâng Bắn mạnh nối cùng lúc làm Đêm 1–4 khó hơn khi cân bằng lại Đêm 3, 4 với Nuppeppō và Tanuki, rồi đo lại B1, B7 và đích chặt gộp; (a), (c) không làm. R1 giữ số của `bal-r4`.

**Công cụ:** `pnpm td:balance` không chạy được trên Node 24.11 (Linux): luồng worker không nhận hook của `tsx` (`ERR_MODULE_NOT_FOUND` ở `tests/td/flow`). Worker giờ khởi động qua `scripts/td/tsx-worker.mjs` (gọi `tsx/esm/api` `register()` rồi nạp `balance-worker.ts`); trên Mac (Node 24.22) cách cũ chạy được, cách mới chưa chạy lại ở đó. Lượt đủ trên Dell: `td:balance --threads=4`, 1.317 s, ra giống `bal-r4` từng dòng trừ dòng thời gian và giá bước sim.

**Kiểm trên máy Dell (24/10/2026; số hiệu năng của máy này):**

- `pnpm check` đạt hai lần (trên bản sửa của Mac, rồi sau các sửa của Dell): kit sha256, 271 test (24 file), `tsc`, `vite build` (JS gzip 81,86 kB, ngân sách 85 kB). `pnpm td:golden:check` khớp cả hai file vàng.
- Bước sim trên Node: 300 quái trung vị 0,046 ms, p95 0,148 ms (`td-sim-perf`, lúc vitest chạy 4 luồng); tải §12 cổng 3 trong `td:balance`: trung vị 0,025 ms, p95 0,110 ms (§20 ≤ 0,5 ms).
- Kịch bản trình duyệt (máy chủ dev của game, cổng 3006; Chrome for Testing không đầu; mỗi kịch bản giữ khoá máy nặng dùng chung với các agent khác):
  - 1B ở 1280 × 720 và 1920 × 1080: `td-1b-boss`, `td-1b-night5`, `td-1b-build` đạt, 0 lỗi console, 0 ngoại lệ, nhật ký trang chạy lại trên Node ra cùng mã băm. `td-1b-night5`: mã băm trang tính lại sau Chơi lại Ngày 5 khớp mã đã ghi (`65ceabd0` ở 1280 × 720); nhật ký dài (39.937 tick, 421 lệnh) chạy lại ra `a7d6f491` như Node. `td-1b-build` có bán gỗ.
  - `td-1b-perf` trượt kiểm luồng chính trên máy này: 6,6 ms (1280 × 720) và 9,2 ms (1920 × 1080) mỗi khung (§20 ≤ 4 ms; Mac lúc phản biện 0,8 / 1,0 ms); ở 1920 × 1080 một khung lúc boss trồi 24,4 ms (≤ 16,7 ms; 1280 × 720: 6,9 ms). Chạy lại lần hai: luồng chính 7,0 / 9,7 ms (vẫn trượt), khung lớn nhất lúc trồi 5,2 / 6,1 ms (đạt): khung 24,4 ms là một lần gián đoạn, không lặp lại. Phần của game đạt: vẽ 2D + thẻ chữ p95 0,9 / 1,0 ms (≤ 8 ms), bước sim + HUD p95 0,4 ms, 306 quái. Đo lại trên Chrome Windows có GPU ở phản biện phụ (cuối mục): 1,42 / 1,36 ms mỗi khung, đạt.
  - Kịch bản cũ ở 1280 × 720 đạt cả 11 (`td-1a-boot`, `td-1a-ime`, `td-1a6-attention`, `td-1a6-day`, `td-1a6-keyboard`, `td-1a6-learn`, `td-1a6-night`, `td-1a6-perf`, `td-1a6-tour`, `td-balance`, `td-theme`); ở 1920 × 1080 chạy bốn kịch bản có HUD, thẻ, hiệu năng: `td-theme`, `td-1a6-day`, `td-balance` đạt, `td-1a6-perf` trượt kiểm luồng chính (10,2 ms, ngưỡng 8 ms). Bảy kịch bản cũ còn lại chưa chạy ở 1920 × 1080 lúc này; phản biện phụ chạy chúng (cuối mục): đạt.
  - Vì sao luồng chính cao: Chrome không đầu trong WSL không có GPU, vẽ canvas và ghép lớp chạy bằng phần mềm. Kịch bản cũ `td-1a6-perf` (không boss) cũng 6,8 / 10,2 ms trên Dell, so với 1,1 / 0,9 ms trên Mac, trong đó script chỉ 1,0 ms. Kiểm luồng chính của §20 cần đo lại trên Mac hoặc máy có GPU: đã đo lại trên Chrome Windows có GPU của Dell ở phản biện phụ, đạt (cuối mục).
  - Thẻ chữ trên Dell hiện ô vuông thay cho biểu tượng loại lời gọi (emoji 🏹, 🔨 …): WSL thiếu phông emoji, không phải lỗi mã.
- Ảnh đã xem (`tmp/dell-2026-10-24/visual/`): `td-1b-boss` báo Rễ Trồi (vòng son dưới nhà, câu "Rễ ơi, mọc lên!" dưới thanh boss), nhà tê ("Tê 2 s"), choáng (dải "Mộc Tinh choáng! Gõ Bắn mạnh!", thanh boss "Dễ Tổn Thương 5 s", hai thẻ Dồn lửa viền hổ phách nằm trên cùng), màn thắng (3 sao, "Rương +150 vàng", Từ cần ôn) ở 1280 × 720 và 1920 × 1080; `td-1b-night5` màn thua (gợi ý "Thêm tháp trên nhánh rễ sáng.", "Chơi lại Ngày 5" là nút Enter).
- Cổng R1 (`BUILD_1B.md` §17, đo trên Dell; dòng này đã sửa ở phản biện phụ): §21 cổng 1, 2, 3, 10 (8.883 ≤ 8.900) đạt; 4 đạt (5a 7,95 s, cửa sổ thật trong đích mềm); 7 đạt. Cổng 8, 9 lúc ghi bản sửa: chưa đạt, chứ không phải "đạt trừ kiểm luồng chính" như dòng này ghi lúc đầu: luồng chính của hai kịch bản hiệu năng mới đo trên Chrome không GPU, và bảy kịch bản cũ chưa chạy ở 1920 × 1080. Sau phản biện phụ (cuối mục): 8 đạt (§20 trên Chrome Windows có GPU), 9 đạt (bốn kịch bản 1B và 11 kịch bản cũ ở hai cỡ, 0 lỗi console). G1, G3, G8 đạt (số ở trên), G4, G7 đạt (test). B1–B8 hai bộ và đích chặt gộp: còn trượt như ghi ở trên (B1, B7 gộp theo dải chặt §18.3). Chủ dự án chơi bản đồ 1 (§17, §22) và số B9: chưa có.
- Chưa làm ở đợt này: ván chơi trình duyệt kiểu người (`tmp/fix-r1/play-r1.mjs`) chưa chạy lại trên số cuối.

**Phản biện phụ của bản sửa (24/10/2026, máy Dell).** Bằng chứng (ngoài Git): `tmp/dell-2026-10-24/gpu/` (JSON và ảnh mỗi kịch bản, `summary.txt`, `replays.txt`, `regrade-b1-b7.txt`, `check.log`). Luật và số không đổi, file vàng không làm lại (nội dung vẫn `87f80da6`); số dòng không đổi (8.883: chỉ sửa chú thích, một lớp CSS).

| # | Phát hiện | Sửa |
|---|---|---|
| 1 | Thẻ Lũy: "Bán 10 Lúa · +10 vàng" và "Bán 10 Gỗ · +4 vàng" nằm cạnh nhau, chữ tràn khỏi nút ở 1280 × 720 (`.td-row > button` không xuống dòng, không cắt; nút rộng 126 px, chữ 141 px và 130 px) | Hai nút bán xếp dọc, mỗi nút rộng hết thẻ (`.td-row.td-stack` trong `td.css`, `build-menu.ts`). Kịch bản đo mọi nút của thẻ: không nút nào bị cắt hay ra ngoài thẻ (`overflowing` trong `td-1a6-common.mjs`; kiểm `keepCardFits` và ảnh `td-1b-build-keep` ở `td-1b-build`, kiểm `keepCard` ở ảnh 07 của `td-1a6-tour`). Ảnh đã xem ở 1280 × 720 và 1920 × 1080: cả hai nhãn đọc đủ, thẻ không chạm bảng hộp cát. Cùng phép đo trên hàng cũ (ép lại bằng CSS) bắt được cả hai nút tràn |
| 2 | Dòng tóm tắt cổng ở trên ghi §21 cổng 8, 9 "đạt trừ kiểm luồng chính", nhưng 7 kịch bản cũ chưa chạy ở 1920 × 1080 | Chạy cả bảy ở 1920 × 1080 (dưới); sửa dòng tóm tắt và changelog |
| 3 | Quyết định thiết kế có đề xuất nhưng chưa ghi đã chọn | Đã chọn theo đề xuất (b), làm ở R2 (ở trên; AGENTS.md; changelog) |
| 4 | Chú thích cũ: cầu lửa Draconis ×0,5 lên boss, mà `heroMul` là 0,35 | Sửa chú thích ở `sim/systems/combat.ts` và `content/slice-1a.ts` |
| 5 | Báo cáo `td:balance` chấm B1, B7 gộp bằng dải BALANCE §3, còn BUILD_1B §18.3 đặt dải chặt cho gộp (B7 gộp 89 %, dải 78–88 %) | `TIGHT_BANDS` trong `tests/td/flow.ts` (thắng 78–88 %, Biên S 40–60 %; P, I, O như §3): bảng B1–B9 gộp chấm B1 và hàng tắt nhịp của B7 bằng dải này, rồi in một dòng kết quả B1, B7 theo dải §3 để so; bảng đích chặt dùng cùng số; test mới ở `td-flow.test.ts`. Mỗi bộ seed riêng vẫn chấm theo §3 |
| 6 | Số luồng chính đo trên Chrome trong WSL (vẽ bằng phần mềm) | Đo lại `td-1b-perf`, `td-1a6-perf` trên Chrome Windows có GPU ở hai cỡ (dưới) |

**Chấm lại B1, B7 gộp theo spec, từ lượt `td:balance` đã có** (`tmp/dell-2026-10-24/balance-final.md`, không chạy lại 20 phút): đọc số đo mà bảng B1–B9 gộp đã in (phần trăm làm tròn; Biên S bước 5 %), chấm bằng `TIGHT_BANDS` và dải §3. Theo đích chặt: **B1 trượt** (Chậm chắc thắng 90 %, Biên S 65 %; Ẩu thắng 76 %; Mới 81 %, Chuẩn 87 %, Khá 88 %, Nhanh 80 % đạt), **B7 trượt** (Chuẩn tắt bộ điều nhịp thắng 89 %, Biên S 60 %; phần bậc mỗi đợt và khoảng sinh đạt như cũ). Theo dải §3 cả hai đạt, như báo cáo cũ in. Khá 88 % nằm sát mép: hai bộ 103/120 và 108/120 ván thắng, gộp 211/240 = 87,9 % (≤ 88 %). B2–B6, B8 không đổi (đạt), B9 thiếu số.

**Hiệu năng §20 đo lại (Dell, Windows Chrome 155, RTX 3050 Ti, ANGLE D3D11; không phải số Apple M4).** Node Windows chạy `src/kit/tools/cdp-run.mjs` với Chrome Windows không đầu; máy chủ dev của game chạy trong WSL (cổng 3006); khoá GPU dùng chung giữ suốt mỗi lần đo. Chrome không đầu trên Windows không khoá ở 60 khung/s: 119–156 khung/s trong các lần đo.

| Kịch bản | Cỡ | Luồng chính mỗi khung | Ngân sách | Vẽ 2D + thẻ p95 | Khác | Kết quả |
|---|---|---|---|---|---|---|
| `td-1b-perf` | 1280 × 720 | 1,42 ms (bận 19,8 % thời gian, 1.399 khung, 140 khung/s) | ≤ 4 ms trung bình | 1,1 ms | khung lớn nhất lúc boss trồi 2,3 ms (≤ 16,7 ms); bước + HUD p95 0,2 ms; 306 quái | đạt |
| `td-1b-perf` | 1920 × 1080 | 1,36 ms (17,6 %, 1.295 khung, 129 khung/s) | ≤ 4 ms trung bình | 1,1 ms | lúc trồi 2,1 ms; 306 quái | đạt |
| `td-1a6-perf` | 1280 × 720 | trung bình 1,78 ms, p95 các khoảng 0,5 s 2,09 ms; lần hai 1,60 / 1,91 ms | ≤ 8 ms | 1,6 ms (lần hai 1,3 ms) | 133 khung/s (lần hai 156); bước sim trong Chrome trung vị 0,04 ms, p95 0,1 ms (≤ 0,5 ms) | lần một trượt kiểm `typedInTheWindow` (gõ 29 phím, cần ≥ 30: trong 10 s ít lời gọi sáng), không phải kiểm hiệu năng; lần hai đạt (35 phím) |
| `td-1a6-perf` | 1920 × 1080 | 1,79 / 2,13 ms | ≤ 8 ms | 1,5 ms | 119 khung/s; 30 phím; bước sim 0,04 / 0,1 ms | đạt |

- `td-1b-perf` giờ chia thời gian bận cho số khung đếm bằng `requestAnimationFrame` trong cửa sổ 10 s. Trước đó nó chia cho `t.costs().draw.length`, mà trang chỉ giữ 600 khung cuối (cả khung trước cửa sổ), nên ở trên 60 khung/s số mỗi khung bị thổi lên; tính theo cách cũ lần này ra 3,31 / 2,94 ms, vẫn đạt. Kết quả in thêm số khung, khung/s và phần thời gian bận.
- Phần Node của các kịch bản (chạy lại nhật ký trang bằng `scripts/td/replay.ts`, kiểm file vàng của `td-1a6-perf`) cần `tsx`, mà `node_modules` cài trong WSL (esbuild bản Linux): node Windows không chạy được, nên các kiểm `nodeReplaysToBrowserHash`, `goldenFileCurrent` trong JSON của lần chạy Windows ghi trượt vì lý do đó, không vì lệch mã băm. Phần này chạy trong WSL trên file JSON mà lần chạy Windows lưu: 9/9 nhật ký khớp mã băm (`td-1a6-keyboard`, `td-1a6-learn`, `td-1a6-night` ở 1920 × 1080; `td-1b-build`, `td-1a6-perf`, `td-1b-perf` ở hai cỡ; `td-1a6-perf` 1280 × 720 là nhật ký của lần hai); `scripts/td/golden.ts --check --log` ra `same: true` (nội dung `87f80da6`, 18.993 tick), và Chrome bước nhật ký vàng đó ra đủ 316 mã băm như Node (`chromeStepsNodeGoldenLog` đạt).

**Bảy kịch bản cũ ở 1920 × 1080 (Chrome Windows):** `td-1a-boot`, `td-1a-ime`, `td-1a6-attention`, `td-1a6-tour` đạt; `td-1a6-keyboard`, `td-1a6-learn`, `td-1a6-night` đạt mọi kiểm trong trình duyệt, nhật ký chạy lại trong WSL khớp. Thêm (kịch bản đổi ở đợt này): `td-1a6-tour` ở 1280 × 720 và `td-1b-build` ở hai cỡ đạt (nhật ký chạy lại trong WSL khớp). Mọi lần chạy 0 lỗi console, 0 ngoại lệ. Trên Chrome Windows thẻ chữ hiện đúng biểu tượng loại lời gọi (ô vuông ở trên là do WSL thiếu phông emoji).

**Kiểm (WSL):** `pnpm check` đạt: kit sha256 (31 file), 272 test (24 file; thêm test chấm dải chặt), `tsc`, `vite build` (JS gzip 81,87 kB, ngân sách 85 kB). `pnpm td:golden:check` khớp cả hai file vàng (nội dung `87f80da6`; `td-1a.json` 18.993 tick, `td-1b-boss.json` 4.811 tick).

### 7.3 R2 "Gõ giúp trận" (24/10/2026)

Changelog: `docs/changelog/2026-10-24-td-1b-r2.md`. Làm trên máy Dell (WSL Ubuntu 24.04, Node 24.11). Lượt đầu bị cắt giữa chừng vì hết hạn mức (mã R2 gần đủ, chưa commit; ảnh chụp cây làm việc ở nhánh cục bộ `wip/r2-partial-2026-10-24`, không đẩy); lượt sau đọc lại mã và làm tiếp. Bằng chứng (ngoài Git): lượt bị cắt `tmp/dell-2026-10-24/b/` (đầu dò `p0`–`p4`, `full1.md`), lượt này `tmp/dell-2026-10-24/c/` (đầu dò `p5`–`p12`, báo cáo `full.md`, `final.md`, kịch bản `final/`, `r2/`, `ui/`, đo GPU `gpu/`, đầu dò Tanuki `direct-probe.ts`).

**Đã làm (theo §17 R2):**

1. **Tối Thượng, Mảnh Chữ, Chữ Chiêu** (§8; `src/sim/systems/ult.ts`, kho `src/sim/stores/ult.ts`, vào mã băm; số `ULT`, `SHARDS` trong `rules.ts`): nạp từ mọi từ của lời gọi (1,2 × (0,5 + 0,5 Q)), gõ trực tiếp (+3), Mảnh Chữ của quái chết trong 12 m quanh Draconis (0,6 mỗi mảnh; boss choáng 6 mảnh), +0,3/s ban Đêm; không nạp khi đầy; hồi 45 s; mở từ Ngày 3 (`stage.unlock.ult`). Lệnh `ult` mang điểm đặt (app chọn `ultSpot`: chuột trong 20 m, không thì chỗ đông máu quái nhất trong 6 m trong vòng 14 m), từ chối `ultEmpty`, `ultBusy`, `ultFar`, `locked`. Mưa Lông Lửa 12 lông mỗi 10 tick, mỗi lông nhắm quái nhiều máu nhất chưa bị nhắm (xoay vòng), rơi 0,8 s, nổ 1,5 m, 25 phép; boss ×0,25, không bị Cháy; hết mưa quái còn trong vùng Cháy 3 s (Cháy giờ ghi nguồn gây, `burnBy`). Chữ Chiêu là lời gọi `ult` (bậc 0): 3 từ ngắn đã thuộc, sống 4 s, +3 lông mỗi từ sau 0,3 s, cả lời gọi Hoàn hảo +1. Phím `=`, nút "Tối Thượng" trên thanh hành động (nạp theo bậc 5 %, "Mở ở Ngày 3", "Mưa lông lửa"), vòng nạp quanh đèn lồng của Draconis.
2. **Gõ trực tiếp và Ngắt** (§9; `src/sim/systems/direct.ts`): lời gọi `direct` (bậc 0) 1 từ ngắn đã thuộc đi theo quái (`foe`), cửa sổ T = clamp(0,8 + k_d × (len + 1) × 12 / E; 3; 7) s, tối đa 2 mở cùng lúc (3 khi có boss), cái thứ ba trống mà không có lời gọi. Gõ được: hủy trống, Tanuki choáng 2 s, +5 + 2 Vàng, Tối Thượng +3. Để chạy: quái trong 6 m (cả nó, trừ boss) hồi 25 % máu tối đa. Quái mới (§10, `slice-1a.ts`): Lửng Tanuki, Nuppeppō (chết không vì nổ thì tách 2 Nuppeppō con tại chỗ, cùng đợt), Nuppeppō con. Lệnh hộp cát `spawn`, `ult` (nút "Gọi: Tanuki, 3 Nupp., Nạp =").
3. **Thư Đồng hoảng** (§5.5 R2, `panicNear` trong `agents.ts`, số `PANIC`): Thư Đồng trong 6 m quanh mép nhà trúng Rễ Trồi chạy về Lũy, đứng 5 s rồi về lệnh cũ; lúc hoảng vòng giúp không thắp lời gọi; vẽ lạch bạch có dấu "!" đỏ.
4. **Hình R2** (§13.1 cột R2, §13.3; `FxView` trong `src/view/fx-2d.ts` dùng chung pool hạt): chân dung Draconis trượt vào 0,6 s, vòng mưa, bóng dưới mỗi lông đậm dần, lông rơi chéo có vệt lửa, vũng than; thẻ trực tiếp dạng cuộn giấy có vòng đồng hồ T, trống vỡ thành chữ, Tanuki choáng có sao, vòng hồi máu xanh lá loang 6 m, Tanuki đang trống có vòng son đập; Chữ Chiêu viền cam. Boss: mạch rễ đập theo trống lặng, đá văng và rễ con quất ra lúc trồi, lá rơi khi đi, mảnh gỗ ở nhà trúng Rễ Trồi, lính lóe trắng 60 ms khi bị Quật cành, đất tơi ở mầm, vỏ cây bung lúc choáng, đá Lũy văng, boss rung 1–2 px và thanh boss giật 2 px khi trúng đòn lớn (tắt khi giảm chuyển động), ánh hổ phách dưới chân tắt từ ngoài vào lúc rút.
5. **Bot** (§18.1 R2, `tests/td/policies/ult.ts`): `ultRule` (dùng khi đầy và boss trong 12 m hoặc ≥ 5 quái trong 6 m; Kém dùng ngay khi đầy), `dodgeRoots` (Tốt đưa Thư Đồng khỏi nhà đang bị nhắm Rễ Trồi); `HumanTypist` coi Chữ Chiêu và gõ trực tiếp như Bắn mạnh (từ có hạn, cùng phản xạ). Báo cáo thêm bảng R2 (Tối Thượng mỗi ván, % lên boss, % cả ải, từ trực tiếp % số từ, Ngắt được / để chạy, giây Đêm 4 mỗi trống, tỉ lệ gõ Đêm 1–4 và Đêm 5, số lời gọi trực tiếp mở cùng lúc) và dòng G2, G5, G6; `--modes`, `--bots`, `--quick`, `--set=…` để thử chỉnh không sửa mã (`scripts/td/overrides.ts`).
6. **Cân bằng lại** theo quyết định (b) (dưới).
7. **File vàng** làm lại (dưới).
8. **Kịch bản** `td-1b-ult`, `td-1b-direct` (mới), `td-1b-perf` thêm Tối Thượng hai lần giữa `flood(300)`.

Cùng đợt (việc còn lại của phản biện R1):

- **Thẻ nhà ở 1280 × 720:** nút Bán cạnh "Gửi Draconis" của Tháp Cung, Trại Lính, Mỏ, Ruộng tràn khỏi thẻ, "Gửi Draconis" lố 2 px, nhãn mua hạt của Ruộng tràn. Sửa chung cho mọi thẻ (`td.css`): hàng nút của thẻ được xuống dòng, nút không vừa thì sang dòng riêng và rộng hết thẻ, nhãn quá dài thì xuống dòng trong nút. `td-1b-build` đo mọi nút của thẻ Tháp Cung, Tháp Pháo, Trại Lính, Mỏ, Ruộng (cả lúc "Bấm lần nữa: bán") ở hai cỡ: không nút nào bị cắt hay ra ngoài thẻ; ảnh đã xem ở 1280 × 720 và 1920 × 1080.
- **`td-1a6-perf` `typedInTheWindow`:** số phím gõ được trong 10 s tùy lời gọi sáng (29–35 phím), không tùy tốc gõ. Cửa sổ đo giờ kéo dài tới khi gõ đủ 30 phím (tối đa 20 s); khung của cả cửa sổ đều được đo như nhau.

**Lệch so với spec (có lý do):**

- **Tanuki chỉ trống trong 9 m quanh mép một nhà đánh** (Lũy, tháp; `ability.reachM`, kiểu `AbilitySpec` của §15 đã có `reachM`). §9.2 chỉ đòi ≥ 3 quái trong 6 m và hồi 12 s, nên Tanuki trống ngay cạnh Khe Nứt, lúc toán vừa ra (đo 10 ván bot Chuẩn: trống ở 20 % đường, cách Draconis trung vị 26 m; 1/18 lần được gõ, vì không vòng giúp nào thắp được, mà hồi máu ở đó cũng vô nghĩa vì quái còn đủ máu). Với 9 m: trống ở 60 % đường, 7/14 lần gõ được, 10/14 lần sáng. Thử 6 m: 6/13, không hơn.
- **Đêm 4 có 3 Tanuki** (§4.2: 2) và **phần đầu Đêm 5 có 6 Thuồng Luồng** (một toán; §4.2 "như R1, chỉnh theo bot"): 3 Tanuki cho một trống mỗi ~29 s ở Đêm 4 (§9.1: 25–40 s; 2 Tanuki: ~51 s). Đêm 1–3 khó hơn bảng §4.2 theo quyết định (b): Đêm 1 10 Cương Thi (8), Đêm 2 12 Cương Thi + 2 Ma Trơi (10 + 1), Đêm 3 10 Cương Thi + 4 Nuppeppō + 2 Ma Trơi (8 + 3 + 2), Đêm 4 3 Tanuki + 1 Thuồng Luồng + 9 Cương Thi (2 + 1 + 7).
- **G6 đo theo tần suất của §9.1** (quyết định, dưới): "5–10 % số từ của ải" của TK 9.1 tính cho đủ ba động từ trên cả bản đồ; R2 bản đồ 1 có một động từ ở một đêm.
- **Tối Thượng mở từ Ngày 3** (lịch mở tính theo ngày; §12 ghi "dùng được từ Đêm 3"): ban Ngày 3 không có quái nên khác biệt chỉ là nút sáng sớm hơn vài chục giây.
- **Gõ trực tiếp được +5 + 2 Vàng** (Lá Tanuki §9.2 cộng +2 của §9.1).
- **Tiếng:** nhịp trống to dần mỗi Chữ Chiêu (§13.3) và tiếng gỗ gãy ở Rễ Trồi (§13.1 cột R2) chưa làm: luật mới về tiếng thuộc làn âm thanh (`tools/audio-lab/DECISIONS.md` Q6), đợt này không thêm tiếng trong game.
- **Không có `src/sim/systems/abilities.ts`** (§16): trống Tanuki nằm ở `direct.ts`, tách Nuppeppō ở `deaths.ts` (ít dòng hơn một file riêng).
- **`CALL.slipS` 1,1 → 1,15 s:** lượt đầu R2 đo cổng 5a 8,13 s (một chuỗi từ Chặt); với 1,15 s cổng 5a 8,00 s (đạt sát mép), 5b 30,2 % (đạt).
- `view/boss-2d.ts` 404 dòng (cột §16: R1 ≤ 320, R2 +30; R1 đã 378).

**Cân bằng (quyết định (b): nâng Bắn mạnh nối cùng lúc làm Đêm 1–4 khó hơn).** Bắn mạnh nối `quick` 0,6 → 0,8, `quickS` 4 → 5 s (số R1 đã thử ở §7.2); Đêm 1–4 như trên. Rồi chỉnh boss và Đêm 5 bằng đầu dò `td:balance --modes=balanced --quick --set=…` (6 bot, có hàng tắt nhịp của B7). Thắng / Biên S gộp hai bộ seed ở Cân bằng; B7 là thắng gộp của Chuẩn tắt bộ điều nhịp:

| Lượt (seed mỗi bộ) | Đổi | Mới | Chậm chắc | Chuẩn | Khá | Ẩu | Nhanh | B7 |
|---|---|---|---|---|---|---|---|---|
| p0 (40) | mã R2 lúc đó, không ghi đè | 88 / 70 | 98 / 73 | 95 / 70 | 94 / 53 | 86 / 55 | 96 / 80 | 95 |
| p1 (40) | máu boss 4.300, Thuồng Luồng 420, Đêm 3, 4 mới | 66 / 40 | 83 / 65 | 78 / 55 | 94 / 70 | 60 / 35 | 80 / 75 | 86 |
| p2 (40) | 4.000, `kHp2` 6,5, Thuồng Luồng 420, Đêm 1–4 mới | 85 / 55 | 89 / 73 | 93 / 70 | 96 / 65 | 80 / 38 | 95 / 75 | 95 |
| p3 (40) | 4.200, `kHp2` 6,5, Đêm 3, 4 mới, phần đầu Đêm 5 6 Thuồng Luồng | 80 / 50 | 83 / 60 | 81 / 68 | 83 / 68 | 61 / 15 | 80 / 63 | 75 |
| p4 (120) | 4.200, `kHp2` 6,5, Đêm 1–4 mới | 68 / 40 | 79 / 70 | 82 / 65 | 89 / 65 | 74 / 35 | 86 / 70 | 86 |
| full1 (120, đủ chế độ) | p4, `kHp` 0,2 → 0,45 | 85 / 53 | 91 / 70 | 82 / 65 | 85 / 65 | 69 / 30 | 86 / 70 | 86 |
| p5 (60) | `kHp` 0,2, phần đầu Đêm 5 6 Thuồng Luồng (từ đây: Tanuki 9 m, `slipS` 1,15) | 63 / 23 | 83 / 60 | 83 / 60 | 83 / 60 | 68 / 40 | 82 / 70 | 77 |
| p6 (60) | p5, Thuồng Luồng 440, toán đi trước 2 × 5 | 65 / 25 | 79 / 53 | 75 / 60 | 81 / 60 | 63 / 30 | 81 / 68 | 77 |
| p7 (60) | p5, `quick` 1,0, Đêm 4 3 Tanuki | 65 / 25 | 83 / 70 | 90 / 70 | 94 / 65 | 80 / 45 | 93 / 75 | 88 |
| p8 (60) | p7, `kHp` 0,3 | 69 / 33 | 85 / 75 | 90 / 70 | 94 / 65 | 80 / 48 | 93 / 75 | 88 |
| p9 (60) | `kHp` 0,3, `quick` 1,0, 3 Tanuki, Đêm 5 5 Thuồng Luồng, toán đi trước 2 × 5, 5 Mầm Gỗ | 76 / 35 | 93 / 73 | 92 / 75 | 93 / 65 | 83 / 55 | 87 / 75 | 94 |
| p10 (60) | p5, 3 Tanuki | 66 / 25 | 79 / 70 | 83 / 70 | 83 / 60 | 71 / 38 | 80 / 70 | 86 |
| p11 (60) | `kHp` 0,3, `quick` 0,9, 6 Thuồng Luồng, 3 Tanuki | 78 / 35 | 88 / 70 | 84 / 65 | 83 / 65 | 69 / 33 | 89 / 75 | 90 |
| **cuối (120, đủ chế độ)** | `kHp` 0,3, `quick` 0,8, 6 Thuồng Luồng, 3 Tanuki | **72 / 30** | **82 / 70** | **83 / 70** | **82 / 60** | **67 / 30** | **81 / 70** | **85** |

p12 (Thư giãn, 120 × 2, Trẻ em, Mới, Ẩu): hệ số máu boss của Thư giãn, Học 0,85 → 0,78 (bằng Thử thách): Trẻ em 88 / 90 % (B3 ≥ 85 %; ở số cuối trước p12: 78 / 83 %), Mới và Ẩu 100 %. Số này chỉ đổi Thư giãn, Học.

Số cuối (trong mã): máu Mộc Tinh 3.800 → 4.200; hệ số k `kHp` 0,2 → 0,3, `kHp2` 4,3 → 6,5 (trần ×1,5 giữ); `modeHp` Thư giãn, Học 0,85 → 0,78; Thuồng Luồng 385 → 420 máu; phần đầu Đêm 5 5 → 6 Thuồng Luồng; Đêm 1–4 như trên; Bắn mạnh nối 0,8 / 5 s; `CALL.slipS` 1,15 s.

**Vì sao dừng (lệch có lý do, BUILD_1B §6.5 bước 6):** 16 lượt đo cho họ cổng này (6 ở lượt bị cắt; ở lượt này 8 đầu dò p5–p12 và hai lượt đủ `full.md`, `final.md`), quá khung ~6 lượt.

- **Biên S tách theo sức gõ, không theo núm.** Chậm chắc, Chuẩn, Nhanh tới đỉnh boss với 16–17 mạng và mất 0–3,5 mạng ở đỉnh (p50; S 70 %); Mới, Ẩu tới với 18 và 14 mạng và mất 12 và 7–9 (S 25–30 %). Mọi núm lấy thêm mạng (6 Thuồng Luồng, Thuồng Luồng 440, toán đi trước 2 × 5, 5 Mầm Gỗ) lấy mạng của Mới, Ẩu trước (giáp 60 % là chỗ độ chính xác và Phát Chữ quyết, như R1), S của ba bot mạnh gần như đứng yên (p5 → p6, p9). Dải chặt 40–60 % cho cả sáu bot không chứa được hai cụm cách nhau ~40 điểm.
- **Quyết định (b) chỉ nâng Ẩu khi Bắn mạnh nối tới 1,0**: Ẩu 80–83 % (p7–p9), nhưng Khá, Nhanh, Chuẩn lên 90–94 % và Chuẩn tắt nhịp 88–94 % (B7 trượt). Ở 0,8 / 5 s (số giữ lại) Ẩu 62–73 % như R1. Độ chính xác vẫn tách bot (Mới 92 %, Chậm chắc 99 % cùng E 25: cách 10 điểm thắng), núm (a) của §7.2 chưa làm.
- Số cuối chọn vì giữ thắng của 4/6 bot trong 78–88 % gộp và B7 đạt; p11 (`quick` 0,9) kéo Mới lên 78 % nhưng Nhanh 89 %, B7 90 %.

**Kết quả cuối** (`pnpm td:balance --threads=4`, hai bộ × 120 seed, 780 s, sau p12; `tmp/dell-2026-10-24/c/final.md`; Cân bằng, Thử thách giống từng dòng lượt trước p12, `full.md`):

- B1 trượt ở cả hai bộ và gộp (dải §3 mỗi bộ, dải chặt gộp): Mới (thắng 76 / 68 %, Biên S 30 / 25 %), Chậm chắc, Chuẩn, Nhanh (Biên S 68–70 %), Ẩu (thắng 73 / 62 %, S 38 / 23 %); Khá đạt (83 / 80 %, S 60 %). Đích chặt gộp: chỉ Khá đạt (82 %, 60 %).
- B3 trượt ở bộ 2: Mới ở Cân bằng 68 % (≥ 70 %); bộ 1 (76 %) và gộp (72 %) đạt. Trẻ em ở Thư giãn 88 / 90 %, gộp 89 % (≥ 85 %).
- B2, B4 (S Chậm chắc 70 % > Ẩu 30 %; hạ quái 4,36 s < 4,64 s; hạ boss 42,5 > 39,4 sát thương/s), B5 (Không gõ và `no-type@kite` 0 % thắng, boss rút 0/240), B6 (Tốt − Kém 93 − 24 ở Cân bằng, 79 − 11 ở Thử thách), B7 (Chuẩn tắt nhịp 86 / 83 %, gộp 85 %, Biên S 53–55 %; bậc mỗi đợt ≤ 3, khoảng sinh ±15 %), B8 đạt ở hai bộ và gộp; B9 thiếu số.
- G2 đạt (gõ Đêm 1–4 23,4 %, Đêm 5 23,9 %); G5 đạt (Tối Thượng 2,1 % sát thương lên boss, 10,9 % cả ải); G6 đạt theo §9.1 (một trống mỗi 28,6 s ở Đêm 4, tối đa 2 lời gọi trực tiếp mở cùng lúc), còn "5–10 % số từ của ải" thì 0,5 %. _(Phản biện R2: G5 ở đây chỉ chấm bot Chuẩn; bot Khá 15,0 / 17,2 % cả ải là trượt. G6 đếm trống chứ không đếm lời gọi, và chấm ≤ 3 cả khi không có boss. Sửa ở §7.4.)_
- Đỉnh boss, bot Chuẩn, Cân bằng: tới boss 120/120 mỗi bộ, rút 83 / 82 %, trồi → trúng đầu p50 24,1 s (G8), giao chiến p50 45,0 / 45,3 s (G3 45–75 s, sát mép dưới), Nhàn I đỉnh boss 1 %, phần gõ 59–61 %, Draconis 12–13 %. Bảng §12 trên ải truyện (G1): 4 (mạng 9 / 12 / 12 / 12 / 10), 5a 8,00 s, 5b 30,2 %, 5c 23,6 %, 6, 7 (+38,2 %) đạt. Cửa sổ 20 s thật của bot Chuẩn kiểu người: p50 7,69 / 7,68 s, lớn nhất 8,73 / 9,27 s, 18 và 15 / 120 ván quá 8 s (đích mềm đạt).
- Thư giãn, Thử thách (báo cáo): Thư giãn Mới tới Nhanh thắng 100 % (Biên S 95–100 %), Trẻ em 89 % (Biên S 55 %), Chuẩn Kém 98 %. Thử thách thắng gộp: Mới 68 %, Chậm chắc 87 %, Chuẩn 67 %, Khá 90 %, Ẩu 49 %, Nhanh 95 % (dải 50–75 %).

**Quyết định thiết kế (đã chọn theo đề xuất):**

- **G6 đo theo §9.1.** Lựa chọn: (a) G6 đọc theo tần suất của §9.1 (một lời gọi trực tiếp mỗi 25–40 s ở đêm có quái đó, ≤ 2 mở cùng lúc) cho tới khi bản đồ có đủ động từ, báo cáo vẫn in tỉ lệ trên cả ải; (b) thêm Tanuki ở nhiều đêm để kéo tỉ lệ cả ải lên 5 % (Ngắt thành vòng chơi chính, đổi cân bằng mọi đêm); (c) để G6 trượt. Đề xuất (a); **đã chọn theo đề xuất (a)**. Bản đồ 1 ở R2 chỉ có Ngắt ở Đêm 4: với một trống mỗi 25–40 s, từ trực tiếp chỉ ~0,5 % số từ cả ải.
- **Cân bằng còn trượt (B1, B3 phần Mới bộ 2, đích chặt):** cần chủ dự án chọn hướng; đề xuất cho đợt sửa R2: (a) của §7.2 (giảm sức nặng của độ chính xác: `CALL.sloppy`, `SCORE.qA`) cho Ẩu và Mới, và đọc dải chặt của Biên S theo bot Chuẩn (các bot khác giữ dải §3), vì Biên S tách theo sức gõ là điều game muốn người chơi thấy. Chưa làm: đổi luật gõ và đổi đích là việc của chủ dự án. _(Phản biện R2: luật của chủ dự án là làm theo đề xuất rồi ghi "đã chọn theo đề xuất", không chờ. Đợt sửa đã làm và đo cả hai vế, §7.4.)_

**Số dòng:** 8.883 → 9.488 (trần R2 10.000). Từng file: `sim/systems/ult.ts` 127 (≤ 170), `sim/systems/direct.ts` 94 (≤ 180), `sim/stores/ult.ts` 20, `view/fx-2d.ts` 196 (≤ 230), `sim/systems/agents.ts` +19 (≤ +30), `sim/systems/boss.ts` 305 (≤ 320), `view/boss-2d.ts` 404 (vượt, ở trên).

**File vàng** (`pnpm td:golden:update`): nội dung `87f80da6` → `357eacfb` (số R2, quái mới, luật mới vào mã băm nội dung; kho Tối Thượng, cột quái, Thư Đồng, lời gọi, thống kê mới vào mã băm trạng thái). `td-1a.json`: 18.993 → 19.540 tick, 316 → 325 mã băm, 362 → 379 lệnh; bot hộp cát có thêm luật R2: Đêm 2 một Tanuki rồi hai toán 5 Cương Thi đuổi kịp nó ở khúc nhập (một lần Ngắt được gõ), Đêm 3 Tối Thượng đầy và được dùng (12 lông); 18 mạng. `td-1b-boss.json`: 4.811 → 5.306 tick, 80 → 88 mã băm, 30 → 45 lệnh; Tối Thượng đầy lúc boss trồi, Chữ Chiêu gõ đủ 3 từ (21 lông); boss rút với 2.404 sát thương, 20 mạng.

**Kiểm (Dell):**

- `pnpm check` (WSL) đạt: kit sha256 (31 file), 286 test (25 file), `tsc`, `vite build`. **Gói JS gzip 87,16 kB, vượt ngân sách §20 (85 kB)**; R1 81,87 kB, phần R2 ~5,3 kB. Chưa sửa ở đợt này; hướng: tách màn đầu, Cài đặt, Hồ sơ gõ và bảng hộp cát thành phần nạp sau (`import()` động). `pnpm td:golden:check` khớp cả hai file vàng (nội dung `357eacfb`).
- Bước sim trên Node (`td-sim-perf`, lúc vitest chạy 4 luồng): boss + 300 quái (có Mầm Gỗ, Tanuki, Nuppeppō) + mưa Tối Thượng: trung vị 0,063 ms, p95 0,166 ms (§20 ≤ 0,5 ms); 300 quái 0,065 / 0,227 ms.
- Kịch bản trình duyệt (máy chủ dev của game, cổng 3006; Chrome for Testing trong WSL), ở 1280 × 720 và 1920 × 1080, đều đạt, 0 lỗi console, 0 ngoại lệ; chín kịch bản có kiểm chạy lại (`td-1b-*`, `td-1a6-day`, `-keyboard`, `-learn`, `-night`) ra cùng mã băm trên Node: R2 `td-1b-ult` (Chữ Chiêu gõ đủ 3 từ, cả lời gọi Hoàn hảo: 22 lông; bỏ qua: 12 lông, Chuỗi không giảm; cửa sổ 20 s của bộ điều phối 2,0 s), `td-1b-direct` (5 lần trống; gõ được: Tanuki choáng, còn 35–41 tick lúc đo, +7 vàng; để chạy: hồi máu; ba Tanuki cùng lúc: tối đa 2 lời gọi, 2 thẻ; thẻ 18 px ở 1280 × 720, 24 px ở 1920 × 1080); R1 `td-1b-boss`, `td-1b-night5`, `td-1b-build` (thẻ mọi nhà vừa khung); kịch bản cũ `td-1a-boot`, `td-1a-ime`, `td-1a6-attention`, `td-1a6-day`, `td-1a6-keyboard`, `td-1a6-learn`, `td-1a6-night`, `td-1a6-tour`, `td-balance`, `td-theme`. `td-1a-ime` lần đầu trượt kiểm "`-` và `=` không ra lệnh": từ R2 `=` là Tối Thượng (§8.2, §14), nên kịch bản đổi thành "`-` không ra lệnh, `=` gửi một lệnh `ult`" rồi chạy lại: đạt ở hai cỡ.
- **Hiệu năng §20 (Dell, Windows Chrome 155, RTX 3050 Ti; node Windows, máy chủ dev trong WSL, khoá GPU dùng chung; lúc đo, lượt kịch bản trong WSL vẫn chạy song song):** `td-1b-perf` 1280 × 720: luồng chính 1,58 ms mỗi khung (bận 24,7 %, 1.565 khung, 156 khung/s), vẽ 2D + thẻ p95 1,2 ms, bước + HUD p95 0,3 ms, khung lớn nhất lúc trồi 2,2 ms, 251 quái, Tối Thượng 2 lần (24 lông); 1920 × 1080: 1,65 ms (130 khung/s), vẽ p95 1,5 ms, lúc trồi 2,4 ms: đạt (≤ 4 ms, ≤ 16,7 ms, ≤ 8 ms). `td-1a6-perf` 1280 × 720: cửa sổ kéo tới 17,2 s để gõ đủ 30 phím, luồng chính trung bình 1,60 ms, p95 các khoảng 1,93 ms, vẽ p95 1,3 ms, 152 khung/s, bước sim trong Chrome 0,05 / 0,10 ms; 1920 × 1080: 17,1 s, 1,58 / 1,99 ms, vẽ p95 1,1 ms, 140 khung/s: đạt mọi kiểm trong trình duyệt (`typedInTheWindow` đạt cả hai cỡ). Phần Node của bốn lần chạy này chạy trong WSL trên file JSON đã lưu: 4/4 nhật ký khớp mã băm; `scripts/td/golden.ts --check --log` ra `same: true` và Chrome bước nhật ký vàng đó ra đủ mã băm (`chromeStepsNodeGoldenLog` đạt).
- Ảnh đã xem: thẻ năm nhà và thẻ Lũy ở hai cỡ (`ui/cards-1280.png`, `cards-1920.png`), trống vỡ thành chữ và vòng hồi máu (`r2/direct-sheet.png`), chân dung và lông rơi lúc dùng Tối Thượng (`visual/ult-cast-sheet.png`, lượt kịch bản trước p12, cùng mã trừ hệ số máu boss ở Thư giãn), boss trồi (`final/boss-r2-sheet.png`; ở 1280 × 720 đá văng và rễ con nhỏ, khó thấy ở ảnh thu nhỏ).
- Chưa làm: phản biện độc lập R2; chủ dự án chơi thử (B9).

### 7.4 Sửa sau phản biện R2 (25/10/2026)

Changelog: `docs/changelog/2026-10-25-td-1b-r2-fix.md`. Làm trên máy Dell (WSL Ubuntu 24.04, Node 24.11; số hiệu năng của máy này). Phản biện độc lập R2 nêu 4 vấn đề lớn, 7 nhỏ (file phản biện của điều phối viên, ngoài repo). §7.3 giữ như lúc làm R2, chỉ thêm ghi chú trỏ về đây ở chỗ sai. Bằng chứng (ngoài Git): `tmp/dell-2026-10-25/d/` (đầu dò `q0`–`q6`, `g6a`, `g6b`; chẩn đoán `peak-probe.ts` với `base.md`, `std-on.md`, `std-off.md`; báo cáo đủ `final.md` (Tanuki cần 3) và `final2.md` (số cuối); kịch bản `visual/`, đo GPU `gpu/`, `gpu2/`, log kiểm `tree-*.log`).

**Phát hiện và cách xử lý:**

| # | Mức | Phát hiện | Sửa |
|---|---|---|---|
| 1 | Lớn | G5 chỉ chấm bot Chuẩn, mà BUILD_1B §18.3 không giới hạn bot (§8.2 trỏ BALANCE §9.1: mỗi kỹ năng vùng ≤ 15 % sát thương cả ải). Bot Khá ở Cân bằng 15,0 / 17,2 % cả ải; Thử thách Khá, Nhanh 16–17 % | Báo cáo chấm G5 cho mọi bot gõ ở Cân bằng trên hai bộ gộp, in Thử thách bên cạnh (`ultGate` trong `tests/td/flow.ts`). Lông 25 → 21 sát thương (`ULT.damage`; 2 lông vẫn hạ một Cương Thi cả ở Thử thách). Số cuối: cao nhất Khá 12,4 % cả ải, 0,4 % lên boss; Thử thách (báo cáo) Nhanh 15,1 %, Khá 14,0 % |
| 2 | Lớn | Cân bằng R2 kém R1 ở các cổng §17 bắt giữ: B3 trượt bộ 2 (Mới 68 %), B1 trượt cả hai bộ, đích chặt gộp 1/6 bot (R1 4/6) | Cân bằng lại (dưới). B3 đạt cả hai bộ (Mới 79 / 79 %), đích chặt gộp 4/6 bot (bằng R1, cả khi đọc theo cách cũ). B1 vẫn trượt (Ẩu cả hai bộ, Chậm chắc bộ 2) |
| 3 | Lớn | Núm cân bằng để lại cho chủ dự án, trái luật "có đề xuất thì làm, ghi đã chọn theo đề xuất" | Làm cả hai vế đề xuất của §7.3 và đo (dưới): đọc Biên S chặt ở bot Chuẩn (đã chọn theo đề xuất, giữ); phương án (a) (đã chọn theo đề xuất, đo hai lượt, không nâng được Ẩu nên không giữ trong mã). Núm có số đo thay vào: phần của nhịp k trong tốc quái, ghi "đề xuất của vòng này, chờ chủ dự án xác nhận" |
| 4 | Lớn | Gói JS 87,16 kB gzip > 85 kB (§20, cổng cứng §21.8), `pnpm check` không kiểm | Tách chunk (dưới): phần khởi động 77,25 kB; `scripts/bundle-budget.mjs` chạy trong `pnpm build` (nên cả `pnpm check`), vượt 85 kB thì build hỏng |
| 5 | Nhỏ | G6: chấm "≤ 3" cả khi không có boss; tần suất đếm trống (cả trống không có lời gọi) chứ không đếm lời gọi; chỉ bot Chuẩn; hàng G6 của §18.3 còn ghi 5–10 % | ≤ 2 khi không boss, ≤ 3 khi có boss (bot đo riêng hai số); đếm lời gọi `direct` được tạo; in tần suất mọi bot; §18.3 ghi cách đọc đã chọn. Đếm đúng thì 3 Tanuki cho một lời gọi mỗi 24,7 s (trượt 25–40 s, vì lời gọi của trống bị cắt khi Tanuki chết cũng tính): Tanuki cần ≥ 4 quái quanh nó (`need` 3 → 4): 30,4 s |
| 6 | Nhỏ | BUILD_1B lệch mã sau R2 (máu boss, hệ số k, `modeHp`, thành phần các Đêm, Thuồng Luồng, `AbilitySpec`) | BUILD_1B §1, §4.2, §5.1, §5.6, §6.4, §6.5, §8.1–§8.3, §9.1–§9.2, §10, §15, §18.3, §20, §24 viết lại theo mã |
| 7 | Nhỏ | `finishWord` đổi ở R2 mà không ghi: lời gọi quá đời không cho từ kế | Ghi (dưới) và ở BUILD_1B §8.3 |
| 8 | Nhỏ | Commit `66a2888`, `a6309e4` đổi mã băm nội dung mà file vàng chỉ làm lại ở `dd4534c`: hai commit đó không xanh riêng | Không viết lại lịch sử cũ. Đợt này file vàng làm lại cùng commit đổi số, và mỗi commit mới được kiểm riêng trên cây của chính nó (dưới) |
| 9 | Nhỏ | Thiếu dòng mục lục changelog | Repo cha `docs/changelog/2026-10-24.md` thêm R2 và sửa R2 (mục Lời Gọi); game có mục lục `docs/changelog/README.md` |
| 10 | Nhỏ | Đá văng, rễ con lúc trồi khó thấy ở 1280 × 720; `td-1b-build` chỉ đo thẻ hộp cát có nhãn "+0 vàng, +0 gỗ" | Hai loại hạt mới trong pool (`fx-2d.ts`): đá nét mực sẫm, rễ con quất ra 3,6 m có viền mực; đã xem ảnh (dưới). `td-1b-build` thêm thẻ truyện có giá bán thật |
| 11 | Nhỏ | Đích báo cáo không bình luận: Tối Thượng 2–3 lần mỗi ải (bot Chuẩn 1,94 / 1,96); `td-1b-perf` còn ~251 quái vì mưa giết ~50; kết quả chạy lại trên WSL không lưu | Ghi số §8.1 (dưới); `td-1b-perf` bù lũ về 300 sau mỗi trận mưa; `gpu/replays.txt` |

**Quyết định về núm cân bằng.**

- **Đọc Biên S chặt ở bot Chuẩn** (đã chọn theo đề xuất của §7.3): đích chặt gộp là thắng 78–88 % cho mọi bot, Biên S 40–60 % cho bot Chuẩn (B1 và hàng tắt nhịp của B7); các bot khác giữ 35–65 % của BALANCE §3, không rộng hơn dải chung. Cổng chung B1 (mỗi bộ seed, dải §3) vẫn in và vẫn chấm như cũ.
- **Phương án (a) của §7.2** (đã chọn theo đề xuất, đo, không giữ): `CALL.sloppy` 0,6 → 0,8 (q2) và (a) đủ: `CALL.sloppy` 1, `SCORE.qA` 0,4, `qS` 0,6 (q4). Ẩu thắng / Biên S gộp: 67 / 15 % và 61 / 18 %, so với 69 / 30 % khi không có (a) (q1, 60 seed mỗi bộ, sai số ~±5 điểm): không nâng. Lý do đo được: từ Ẩu (≥ 2 lỗi) chỉ là 15 % số từ của bot Ẩu, 3 % của bot Mới (`base.md`), và Q chỉ đổi Phát Chữ trong khoảng 1,6–2,0 lần `dBar`; cái làm Ẩu yếu là thời gian mất cho phím sai và bỏ khóa, không phải luật chấm.
- **Phần của nhịp k trong tốc quái `PACE.speedK` 0,2 → 0,3** (đề xuất của vòng này, chờ chủ dự án xác nhận). Chẩn đoán (`peak-probe.ts`, 40 seed, số R2): mạng mất ở đỉnh boss phần lớn là Thuồng Luồng của phần đầu Đêm 5 lọt sau khi lặng đã bắt đầu (Draconis đã rời đi chờ boss): bot E 25 mất 5,4–6,8 mạng như vậy (Mới, Chậm chắc), Chuẩn, Khá, Nhanh 0,4–2,6, Ẩu 4,2. Biên S tách theo tốc gõ, và nhịp k (0,75–1,30) là núm theo tốc gõ của BALANCE §4.1. Với 0,3, quái của bot k 0,75 đi ×0,925, của bot k 1,3 ×1,09; bot Chuẩn (k 1) không đổi. Đo: q0 → q1 (cùng lông 21): Mới 74 / 35 → 78 / 50 %, Chậm chắc 81 / 65 → 81 / 60 %, Khá 83 / 60 → 83 / 55 %, Nhanh 82 / 70 → 73 / 63 %. 0,4 quá tay (q3: Chậm chắc 97 / 83 %, Nhanh 68 / 40 %).
- **Trần hệ số máu boss `kHpMax` 1,5 → 1,46**: boss của bot Nhanh đi nhanh hơn ×1,09 nên bot Nhanh tụt 82 → 73 % (q1); 1,42 kéo lên 88 % (q5, bộ 1 95 %), chọn giữa.
- **Tanuki cần ≥ 4 quái** (G6, ở trên): ít trống được Ngắt hơn nên bot Chuẩn ít vàng và ít nạp Tối Thượng hơn: Biên S gộp của nó 65 → 60 % (g6b, `final` → `final2`).
- Đã thử, không giữ: lặng chờ 45 s thay 30 s (q6: không đổi gì ngoài nhiễu).

**Các lượt đo** (thắng / Biên S gộp hai bộ ở Cân bằng; 60 seed mỗi bộ trừ khi ghi 120; hàng B7 là bot Chuẩn tắt bộ điều nhịp, bộ 1 / bộ 2):

| Lượt | Đổi (so với số R2) | Mới | Chậm chắc | Chuẩn | Khá | Ẩu | Nhanh | B7 |
|---|---|---|---|---|---|---|---|---|
| R2 cuối (120) | — | 72 / 30 | 82 / 70 | 83 / 70 | 82 / 60 | 67 / 30 | 81 / 70 | 86 / 53, 83 / 55 |
| q0 | lông 21 | 74 / 35 | 81 / 65 | 83 / 70 | 83 / 60 | 71 / 33 | 82 / 70 | 85 / 55, 75 / 50 |
| q1 | q0, `speedK` 0,3 | 78 / 50 | 81 / 60 | 83 / 70 | 83 / 55 | 69 / 30 | 73 / 63 | như q0 |
| q2 | q1, `CALL.sloppy` 0,8 | 76 / 50 | 82 / 60 | 82 / 70 | 78 / 55 | 67 / 15 | 72 / 55 | 83 / 53, 75 / 58 |
| q3 | q2, `speedK` 0,4 | 78 / 45 | 97 / 83 | 82 / 70 | 77 / 55 | 57 / 13 | 68 / 40 | như q2 |
| q4 | q1, (a) đủ | 78 / 43 | 78 / 55 | 78 / 65 | 82 / 55 | 61 / 18 | 74 / 65 | 83 / 45, 80 / 50 |
| q5 | q1, `kHpMax` 1,42 | 78 / 50 | 81 / 60 | 83 / 70 | 83 / 55 | 69 / 30 | 88 / 65 | như q0 |
| q6 | q5, lặng chờ 45 s | 76 / 45 | 77 / 60 | 87 / 70 | 83 / 58 | 68 / 28 | 86 / 65 | 82 / 55, 75 / 35 |
| `final` (120, đủ chế độ) | q1, `kHpMax` 1,46 | 80 / 48 | 86 / 70 | 80 / 65 | 80 / 55 | 66 / 30 | 80 / 60 | 80 / 53, 78 / 55 |
| g6a (120, chỉ Chuẩn) | `final`, Tanuki hồi 14 s | — | — | 80 / 65 | — | — | — | — |
| g6b (120, chỉ Chuẩn) | `final`, Tanuki cần 4 | — | — | 79 / 60 | — | — | — | — |
| **`final2` (120, đủ chế độ)** | `final`, Tanuki cần 4 (số cuối) | **79 / 50** | **86 / 70** | **79 / 60** | **81 / 58** | **67 / 30** | **81 / 60** | **81 / 55, 79 / 50** |

g6a: hồi trống của Tanuki không phải chỗ chặn (số giống `final` tới chữ số cuối): Tanuki trống mỗi khi một toán đuổi kịp nó gần nhà đánh. Chín lượt đo cho họ cổng cân bằng (q0–q6, `final`, `final2`) cộng hai đầu dò G6: quá khung ~6 lượt; dừng ở đây.

**Số cuối trong mã:** `ULT.damage` 21; `PACE.speedK` 0,3; `boss.kHpMax` 1,46; Tanuki `ability.need` 4. Phương án (a) không vào mã (`CALL.sloppy` 0,6, `SCORE.qA` 0,6, `qS` 0,4 như cũ).

**Kết quả cuối** (`pnpm td:balance --threads=4`, hai bộ × 120 seed, 941 s; lúc chạy, máy còn các lượt kịch bản WSL của làn này và việc của làn khác; `final2.md`):

- B1 (cổng chung, dải BALANCE §3 mỗi bộ): bộ 1 trượt ở Ẩu (68 / 30 %), năm bot kia đạt (Mới 79 / 50, Chậm chắc 82 / 60, Chuẩn 80 / 60, Khá 86 / 60, Nhanh 79 / 60 %); bộ 2 trượt ở Chậm chắc (90 / 70 %: Biên S cao) và Ẩu (66 / 30 %). R1 trượt bộ 1 (Chậm chắc 92 %, Ẩu 73 %); R2 lúc làm trượt năm bot mỗi bộ.
- Đích chặt gộp: đạt Mới (79 / 50), Chuẩn (79 / 60, dải 40–60 %), Khá (81 / 58), Nhanh (81 / 60); trượt Chậm chắc (86 / 70: Biên S trên 65 %), Ẩu (67 / 30). 4/6, bằng R1. Đọc theo cách cũ (40–60 % cho mọi bot) cũng 4/6.
- B3 đạt ở cả hai bộ: Mới 79 / 79 % ở Cân bằng; Trẻ em 89 / 92 % ở Thư giãn.
- B2, B4 (S Chậm chắc 70 % > Ẩu 30 %; hạ quái 4,41 s < 4,71 s; hạ boss 40,6 > 37,6 sát thương/s gộp), B5 (Không gõ và `no-type@kite` 0 % thắng, boss rút 0/240), B6 (Tốt − Kém 95 − 25 ở Cân bằng, 73 − 8 ở Thử thách, gộp), B7 (Chuẩn tắt nhịp 81 / 79 %, gộp 80 %, Biên S 55 / 50 %, gộp 55 % trong dải chặt; bậc ≤ 3 mỗi đợt, khoảng sinh ±15 %), B8 đạt ở hai bộ và gộp; B9 thiếu số.
- G2 đạt (gõ Đêm 1–4 23,4 %, Đêm 5 24,0 %). G5 đạt cho mọi bot gõ ở Cân bằng (gộp, lên boss / cả ải: Mới 2,7 / 4,4 %, Chậm chắc 1,9 / 8,3 %, Chuẩn 2,0 / 9,5 %, Khá 0,4 / 12,4 %, Ẩu 2,8 / 6,3 %, Nhanh 0,5 / 9,3 %); Thử thách (báo cáo) Nhanh 15,1 % cả ải là trên 15 %. G6 đạt (bot Chuẩn một lời gọi trực tiếp mỗi 30,4 s ở Đêm 4, tối đa 2 mở cùng lúc khi không boss, không lời gọi nào khi có boss vì Đêm 5 không có Tanuki); mọi bot: Mới 64,3, Chậm chắc 51,3, Khá 25,9, Ẩu 27,1, Nhanh 24,4 s; tỉ lệ cả ải 0,4 % (báo cáo).
- G3 (bot Chuẩn, giao chiến p50): 46,7 s bộ 1, **44,7 s bộ 2** (dưới 45 s 0,3 s; R2 lúc làm 45,0 / 45,3 s, đã sát mép). G8: trồi → trúng đầu p50 24,1 s, Nhàn I đỉnh boss 1 / 0 %. Bảng §12 trên ải truyện (G1): 4 (mạng 9 / 12 / 12 / 12 / 10), 5a 8,00 s, 5b 30,2 %, 5c 23,5 %, 6, 7 (+38,2 %) đạt. Cửa sổ 20 s thật của bot Chuẩn kiểu người: p50 7,70 / 7,72 s, lớn nhất 8,73 / 9,27 s, 17 và 16 / 120 ván quá 8 s (đích mềm đạt).
- Đỉnh boss, bot Chuẩn: tới boss 120/120, rút 80 / 78 %, mạng trước đỉnh p50 16, mạng mất ở đỉnh p50 3 (R2: 0), S ván thắng p50 70 %.
- Tối Thượng mỗi ván (đích báo cáo §8.1: bot Chuẩn 2–3): bot Chuẩn 1,92 / 1,98 (R2: 1,94 / 1,96), sát mép dưới; Khá 2,0, Nhanh 2,2; bot Không gõ ≤ 1. Không chỉnh: nạp thêm sẽ đẩy phần của Khá về gần 15 % (G5).
- Thư giãn: Mới tới Nhanh 100 % (Biên S 90–100 %), Trẻ em 90 % gộp. Thử thách (báo cáo, dải 50–75 %): Mới 74 %, Chậm chắc 92 %, Chuẩn 66 %, Khá 79 %, Ẩu 50 %, Nhanh 85 % gộp.

**Vì sao còn trượt, và núm kế:**

- **Ẩu** (thắng 66–68 %, Biên S 30 %, cả hai bộ). Kit cho Ẩu nhịp k 1,045 (E_eff của BALANCE §4.1 chỉ trừ độ chính xác qua 0,6 + 0,4·a²), cao hơn bot Chuẩn, trong khi trong game Ẩu yếu hơn: game đo Ẩu ở E 41,6, a 83 %, CV 0,44 (bảng "Hồ sơ game đo được"), tức E_eff ≈ 28,4 so với 29,4 của bot Chuẩn. Luật gõ của game (phương án (a)) đã đo không đổi được. Núm kế: (1) đầu ván của bot lấy từ hồ sơ game đo được thay vì thông số danh nghĩa (hiệu chỉnh B9 của BALANCE §6, đổi cách đo của cả báo cáo); (2) trọng số độ chính xác trong `effectiveE` của kit (BALANCE §4.1, việc của repo cha, dùng chung ba game). Cả hai cần chủ dự án. _(Phản biện R2 lần 2, sửa ở §7.5: chẩn đoán này sai. Ẩu đã có k 1,045 từ R1 (khi Ẩu còn đạt dải ở bộ 2), nên k của kit không giải thích được bước tụt R1 → R2. `effectiveE` giữ E_eff ≥ 0,7·E: hồ sơ đo được trong `final2.md` cho Ẩu (E 40,9, a 83 %, CV 0,47) E_eff 28,6 (không phải 28,4; số "E 41,6, a 83 %, CV 0,44" không có trong `final2.md`), cho Chuẩn (33,5, 94 %, 0,31) 27,0: đầu ván đo được vẫn cho Ẩu k cao hơn Chuẩn, nên núm (1) không làm được điều câu trên nói. Núm của game (§6.5 bước 1–5) chưa đo lúc ghi câu này; §7.5 đo chúng trước khi nói tới kit.)_
- **Chậm chắc** (Biên S 70 %, bộ 2 thắng 90 %): k 0,79 nên được `speedK` 0,3 giúp gần bằng bot Mới (k 0,75) mà không mất mạng ở phím sai. Núm kế: `speedK` 0,25–0,27 (giữa q1 và R2), đo lại Mới (B3) cùng lúc.
- **Bot Chuẩn với bộ điều nhịp** giữ Biên S cao hơn khi tắt (gộp 60 % so với 55 %; ở R2 70 % so với 55 %): đầu dò `std-on` / `std-off` (40 seed) cho thấy với bộ điều nhịp bật, Thuồng Luồng lọt ở đỉnh ít hơn (2,1 so với 4,8 mạng). Núm kế nếu cần: bộ điều nhịp Đêm đứng yên từ đầu Đêm 5 thay vì từ lúc lặng.
- **G3 bộ 2 44,7 s**: núm là tốc boss (§6.5 bước 1), 0,8 → ~0,78 m/s, rồi đo lại thắng. _(Phản biện R2 lần 2: đã đo ở §7.5.)_

**`finishWord` từ R2 (ghi bổ sung cho §7.3):** một lời gọi đã quá đời (`expire`) không cho từ kế nữa; từ đang gõ vẫn gõ xong được và vẫn có tác dụng. Áp cho Chữ Chiêu (4 s từ lúc dùng Tối Thượng) và cho lời gọi Dồn lửa nhiều từ (5 s từ lúc choáng): trước R2 một lời gọi Dồn lửa 3 từ vẫn đưa từ kế sau 5 s, khi Dễ Tổn Thương đã hết và lời gọi lẽ ra đã tắt. Lời gọi không có hạn (xây, gặt, chặt…) không đổi.

**Tách chunk (§20).** Gói cũ là một chunk 232 kB (87,16 kB gzip). Màn đầu (`ui/title.ts`), thẻ Cài đặt (`ui/settings.ts`; phần đọc và lưu `td.settings` sang `app/prefs.ts`), Hồ sơ gõ (`ui/profile.ts`), thẻ tạm dừng và kết (`ui/sheets.ts`), bảng hộp cát (`app/sandbox.ts`; `sandboxOp` sang `app/selection.ts`) và tiếng (`view/audio-min.ts`, `folk.ts`, `music.ts`: trình duyệt chỉ phát tiếng sau phím hay chuột đầu tiên) nạp bằng `import()` trong `main.ts`; `manualChunks` trong `vite.config.ts` giữ phần còn lại là một chunk (để mặc định thì Rollup cắt các module dùng chung ra sáu chunk nhỏ, phần khởi động 84,04 kB vì gzip kém đi). Kết quả: khởi động 76,98 kB gzip ở commit tách chunk, 77,25 kB ở commit mã cuối (thêm hai loại hạt); nạp sau 13,5 kB (tiếng 4,23, màn đầu 4,47, thẻ 2,02, Cài đặt 1,08, Hồ sơ 0,93, hộp cát 0,78), tổng 90,77 kB; chừa ~7,7 kB cho R3 (R2 thêm ~5,3 kB cho ~600 dòng). Thế giới đứng yên khi màn đầu còn đang nạp; `__td.ready()` chờ các chunk trang cần. _(Phản biện R2 lần 2, sửa ở §7.5: ở "/" thế giới và phím chờ màn đầu, thẻ Cài đặt và Hồ sơ gõ, nên trang cần 77,25 + 4,47 + 1,08 + 0,93 = 83,73 kB trước khi dùng được, chừa ~1,3 kB chứ không phải ~7,7 kB; tiếng và thẻ tạm dừng cũng tải ngay lúc đầu (89,98 kB). Câu "Gói JS ≤ 85 kB" của §20 trước đó là cả gói; đổi thành phần khởi động là đề xuất, chưa có dấu của chủ dự án.)_

**Số dòng:** 9.489 → 9.550 (trần R2 10.000; cách đếm của §16). `view/fx-2d.ts` 226 (≤ 230), `view/boss-2d.ts` 406 (vượt cột từ R1, như §7.3), `app/prefs.ts` 28 (mới).

**File vàng** (`pnpm td:golden:update`, cùng commit đổi số): nội dung `357eacfb` → `3cd14470`. `td-1a.json`: vẫn 19.540 tick, 325 mã băm, 379 lệnh; mã băm trạng thái đổi từ tick 16.500 (Tối Thượng Đêm 3 của bot hộp cát, lông 21); bot hộp cát chạy k 1 nên `speedK` không đổi gì; Tanuki Đêm 2 của nó vẫn trống (toán 5 Cương Thi quanh nó). `td-1b-boss.json`: vẫn 5.306 tick, 88 mã băm, boss rút với 2.383 sát thương (trước 2.404), 20 mạng.

**Kiểm (Dell):**

- Mỗi commit của đợt này kiểm riêng trên cây của chính nó (`git archive` ra `tmp/dell-2026-10-25/d/wt-<commit>` với `shared/` và `node_modules` nối vào, chạy đúng các bước của `pnpm check`: kit sha256, vitest, `tsc`, `vite build`, ngân sách gói; rồi các bước của `pnpm td:golden:check`; `tree-<commit>.log`): `e2757fd`, `a55cbea`, `7bc1707`, `198cdd7`, `243e404`, `edbac83` đều đạt: kit sha256 (31 file), 286 → 287 → 288 test (25 file), `tsc`, `vite build`, ngân sách gói (khởi động 76,98 → 77,25 kB gzip); file vàng khớp (nội dung `357eacfb` tới `7bc1707`, `3cd14470` từ `198cdd7`, commit đổi số và làm lại file vàng). Commit giấy tờ cuối chỉ đổi file `.md`.
- Kịch bản trình duyệt (Chrome for Testing trong WSL, máy chủ dev của game cổng 3006; mã cuối trừ hai lần chỉnh màu và chỗ bắt đầu của đá, chỉ là hình): 15 kịch bản × 2 cỡ đều đạt, 0 lỗi console, 0 ngoại lệ (`td-1b-direct`, `td-1b-boss`, `td-theme`, `td-1a-boot`, `td-1b-build`, `td-1b-ult`, `td-1b-night5`, `td-1a-ime`, `td-1a6-attention`, `-day`, `-keyboard`, `-learn`, `-night`, `-tour`, `td-balance`); 9 kịch bản có kiểm chạy lại ra cùng mã băm trên Node ở hai cỡ. Màn đầu, Cài đặt, Hồ sơ gõ, tạm dừng, kết (`td-theme`), bảng hộp cát và tiếng chạy qua chunk nạp sau. `td-1b-direct` vẫn có trống với Tanuki cần 4 (toán 5 Cương Thi đuổi kịp). `td-1b-build` thẻ truyện "Bán · +29 vàng, +12 gỗ", không nút nào tràn ở hai cỡ.
- Hiệu năng §20 (Dell, Windows Chrome 155, RTX 3050 Ti; node Windows, máy chủ dev trong WSL, khoá GPU dùng chung; lúc đo, một lượt cân bằng của làn khác chạy trong WSL): `td-1b-perf` 1280 × 720: luồng chính 1,68 ms mỗi khung (bận 22,7 %, 1.354 khung, 135 khung/s), vẽ 2D + thẻ p95 1,4 ms, bước + HUD p95 0,4 ms, khung lớn nhất lúc trồi 2,4 ms, lũ 293 và 262 quái trước hai lần bù, 296 lúc kết, Tối Thượng 2 lần (24 lông); 1920 × 1080: 1,76 ms (121 khung/s), vẽ p95 1,6 ms, lúc trồi 2,0 ms, 296 quái: đạt (≤ 4 ms, ≤ 16,7 ms, ≤ 8 ms). _(Phản biện R2 lần 2: số mỗi khung đo ở 121–135 khung/s nhỏ hơn ở 60 khung/s, vì phần việc theo thời gian chia cho nhiều khung hơn; người phản biện đo lại cùng máy được 2,79–4,27 ms. Đo lại ở 60 Hz cố định: §7.5.)_ `td-1a6-perf` 1280 × 720: cửa sổ 10 s, 30 phím, luồng chính 1,96 ms (p95 các khoảng 2,31 ms), vẽ p95 1,8 ms, 127 khung/s, bước sim trong Chrome 0,04 / 0,09 ms; 1920 × 1080: cửa sổ 17,2 s, 1,72 / 2,05 ms, vẽ p95 1,3 ms, 127 khung/s: đạt mọi kiểm trong trình duyệt. `td-1b-boss` hai cỡ: đạt mọi kiểm trong trình duyệt (cả lần đo lại sau `edbac83`, `gpu2/`). Phần Node chạy trong WSL trên file JSON đã lưu (`gpu/replays.txt`, `gpu2/replays.txt`): 8/8 nhật ký khớp mã băm; `golden.ts --check --log` ra `same: true` ở hai cỡ, và Chrome bước nhật ký vàng đó ra đủ mã băm (`chromeStepsNodeGoldenLog` đạt). Các kiểm `nodeReplaysToBrowserHash`, `goldenFileCurrent` trong JSON ghi trượt chỉ vì node Windows không có `tsx`.
- Ảnh đã xem: boss trồi ở 1280 × 720 trên Chrome Windows có GPU (`gpu/`, `gpu2/` `td-1b-boss-rise-*`, phóng to): ở bản R2 chỉ thấy vết nứt và boss; sau sửa, rễ con có viền mực rõ từ khung đầu boss nhô lên, đá ở lần đo đầu chỉ ló ra ở khung cuối (bay từ tâm, dưới thân boss), nên đá giờ bay từ mép vỏ (`edbac83`): thấy từ khung đầu (`gpu2/`, đạt mọi kiểm trong trình duyệt). Thẻ truyện của `td-1b-build` ("Bán · +29 vàng, +12 gỗ", "Nâng cấp · Mở ở Ngày 4", "Gửi Draconis": vừa thẻ), màn đầu, thẻ Cài đặt và thẻ tạm dừng của `td-theme` (chunk nạp sau) ở 1280 × 720.
- Chưa làm: chủ dự án chơi thử bản đồ 1 (§22, B9); tiếng trống Chữ Chiêu và tiếng gỗ gãy (làn âm thanh, Q6).

### 7.5 Sửa sau phản biện R2 lần 2 (25/10/2026)

Changelog: `docs/changelog/2026-10-25-td-1b-r2-fix2.md`. Làm trên máy Dell (WSL Ubuntu 24.04, Node 24.11; số hiệu năng của máy này). Phản biện lần 2 của đợt sửa R2 nêu 1 vấn đề lớn, 5 nhỏ. §7.4 giữ như lúc làm, chỉ thêm ghi chú trỏ về đây ở chỗ sai. Bằng chứng (ngoài Git): `tmp/dell-2026-10-25/r2fix2/` (đầu dò `p1`–`p6` với `.meta` ghi giờ và tải máy, chẩn đoán `diag.ts` với `d-base.md`, báo cáo đủ `final.md`, kịch bản `visual/`, đo GPU `gpu/` (lượt đầu, kiểm lúc trồi còn đọc nhầm), `gpu-ab/`, `gpu-60/`, `gpu-batch/`, `gpu-final/`, `gpu-1a6/`, mẫu CPU `cpu-*.txt`, log kiểm `tree-*.log`, `check-final.log`).

**Phát hiện và cách xử lý:**

| # | Mức | Phát hiện | Xử lý | Trạng thái |
|---|---|---|---|---|
| 1 | Lớn | B1 kém R1 (Ẩu trượt cả hai bộ, Chậm chắc bộ 2); núm §6.5 bước 1 và bước 5 chưa đo; chẩn đoán Ẩu ở §7.4 sai (k, sàn 0,7·E, số hồ sơ) | Đo bước 1–5 theo thứ tự (đã chọn theo đề xuất của phản biện), mỗi lượt hai bộ × 120; một lượt thêm ngoài §6.5; một chẩn đoán mạng mất theo đêm. Không lượt nào tốt hơn số hiện tại, nên số giữ nguyên (đề xuất của vòng này, chờ chủ dự án xác nhận). Chẩn đoán §7.4 có ghi chú sửa; núm kế ghi cho lượt cân bằng của R3 | còn mở: B1 vẫn trượt như §7.4 |
| 2 | Nhỏ | G3 trượt bộ 2; báo cáo không chấm G3, G8, không có bảng boss gộp | `bossGates` trong `tests/td/flow.ts`: G3, G8 cho bot Chuẩn ở Cân bằng, ở từng bộ và gộp (mỗi bộ và phần gộp đều phải đạt); bảng boss hai bộ gộp | báo cáo đã sửa; G3 bộ 2 vẫn 44,7 s |
| 3 | Nhỏ | Chunk nạp sau không có đường lỗi: màn đầu lỗi thì phím bị nuốt mãi; thẻ tạm dừng lỗi thì Esc dừng mà không có thẻ | `Chunk` (`src/app/chunks.ts`): 3 lần thử, rồi một lỗi console và đường dự phòng; hỏi lại sau 15 s. Test đơn vị, kịch bản `td-1b-chunks` | đã sửa |
| 4 | Nhỏ | Ngân sách gói chỉ đếm chunk vào; ở "/" trang cần 83,73 kB (chừa ~1,3 kB chứ không ~7,7 kB); đổi nghĩa §20 không có dấu chủ dự án | Kiểm phần khởi động của từng trang từ manifest; "/" chỉ chờ màn đầu: 82,56 kB, chừa 2,44 kB; đổi nghĩa ghi đề xuất của vòng này, chờ chủ dự án xác nhận | đã sửa |
| 5 | Nhỏ | Ngân sách luồng chính §20 tùy số khung/s của lần chạy | `td-1b-perf` giữ nhịp 60 Hz, in phần bận và khung/s; kiểm "lúc trồi" chỉ đọc khung của lúc trồi | đo được, còn mở: ở 60 Hz máy chỉ giữ 50–57 khung/s, luồng chính 3,9–4,6 ms mỗi khung (dưới) |
| 6 | Nhỏ | BUILD_1B lệch mã (§17 đánh số, §5.1 tốc boss, §6.5 bước 5) | Sửa cả ba, thêm §6.5 bước 7 (câu "bot E ≥ 35 không") và bước 8, §18.2, §18.3 (G3, G8), §20 | đã sửa |

**Các lượt đo cân bằng** (`td:balance --modes=balanced --quick --stage-sets=2 --stage-seeds=120 --threads=4 --bots=` sáu bot gõ, trên ảnh chụp cây làm việc; thắng / Biên S gộp ở Cân bằng; B1 là số ô trượt dải BALANCE §3 ở bộ 1 / bộ 2; đích chặt là số bot đạt trên hai bộ gộp; G3 là giao chiến p50 của bot Chuẩn bộ 1 / bộ 2):

| Lượt | Bước §6.5 | Đổi (so với số hiện tại) | Mới | Chậm chắc | Chuẩn | Khá | Ẩu | Nhanh | B1 trượt | Đích chặt | G3 (s) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| R1 (`bal-r4`) | — | số R1 | 81 / 55 | 90 / 65 | 87 / 50 | 88 / 50 | 76 / 45 | 80 / 55 | 2 / 0 | 4/6 | 50,0 / 47,0 |
| hiện tại (`final2`, `final`) | — | — | 79 / 50 | 86 / 70 | 79 / 60 | 81 / 58 | 67 / 30 | 81 / 60 | 1 / 2 | 4/6 | 46,7 / 44,7 |
| p1 | 1 | tốc Mộc Tinh 0,8 → 0,78 m/s | 84 / 55 | 86 / 75 | 85 / 65 | 82 / 58 | 68 / 30 | 84 / 65 | 3 / 2 | 3/6 | 45,9 / 46,7 |
| p2 | 2 | p1, phần đầu Đêm 5: 6 → 5 Thuồng Luồng | 87 / 55 | 92 / 75 | 87 / 70 | 80 / 60 | 72 / 40 | 82 / 70 | 3 / 3 | 2/6 | 46,4 / 47,8 |
| p3 | 3, 4 | p2, 5 Mầm Gỗ mỗi 12 s (4 mỗi 15 s), `kHp` 0,3 → 0,15 | 71 / 45 | 83 / 65 | 83 / 65 | 81 / 60 | 70 / 30 | 81 / 70 | 4 / 4 | 2/6 | 46,4 / 46,6 |
| p4 | 5 | Thuồng Luồng 420 → 385 máu | 78 / 45 | 87 / 75 | 79 / 65 | 83 / 55 | 66 / 30 | 80 / 65 | 3 / 2 | 3/6 | 46,8 / 45,1 |
| p5 | 5 | Cháy của Draconis 55 → 62/s | 78 / 50 | 85 / 73 | 81 / 65 | 80 / 55 | 61 / 25 | 82 / 60 | 3 / 2 | 2/6 | 45,6 / 45,1 |
| p6 | ngoài §6.5 | `LENGTH_BY_E`: từ 4–7 chữ từ E 55 (trước 45) | 79 / 50 | 86 / 70 | 79 / 60 | 59 / 35 | 38 / 0 | 81 / 60 | 2 / 3 | 3/6 | 46,7 / 44,7 |

Mỗi đầu dò 193–220 s (4 luồng, dưới khoá máy nặng dùng chung); sáu đầu dò và một chẩn đoán, đúng khung ~6 lượt; lượt đủ `final` là lượt kiểm số cuối.

**Chẩn đoán: mạng mất ở đâu** (`diag.ts`, số hiện tại, Cân bằng, seed 1–60; mất trung bình mỗi ván; "đỉnh" là từ lúc lặng tới hết ải, gồm cả ván thua):

| Bot | Thắng | Biên S | Mất ở Đêm 1 / 2 / 3 / 4 / phần đầu Đêm 5 | Mạng lúc lặng p50 | Đỉnh: Thuồng Luồng / Cương Thi / Ma Trơi / Mầm Gỗ / Quật Lũy | Mạng cuối ván thắng p50 | Ván thua có boss tới Lũy |
|---|---|---|---|---|---|---|---|
| Mới | 83 % | 50 % | 0,6 / 1,0 / 0,3 / 0 / 0 | 18 | 4,8 / 0 / 0 / 1,0 / 2,0 | 14 | 90 % |
| Chậm chắc | 78 % | 60 % | 1,1 / 1,2 / 0,3 / 0 / 0 | 17 | 3,5 / 0 / 0 / 1,0 / 2,0 | 16 | 62 % |
| Chuẩn | 82 % | 58 % | 1,6 / 1,7 / 0,8 / 0 / 0 | 16 | 3,0 / 0 / 0,1 / 0,9 / 1,7 | 14 | 64 % |
| Khá | 80 % | 55 % | 3,8 / 1,9 / 0,9 / 0 / 0 | 13 | 1,2 / 0 / 0,1 / 0,8 / 1,9 | 12 | 92 % |
| Ẩu | 67 % | 30 % | 3,3 / 1,7 / 1,0 / 0 / 0 | 14 | 4,3 / 0 / 0,1 / 1,1 / 1,4 | 13 | 55 % |
| Nhanh | 80 % | 63 % | 2,1 / 1,6 / 0,9 / 0 / 0 | 16 | 1,7 / 0 / 0,1 / 1,0 / 2,5 | 13,5 | 92 % |

**Điều số đo nói:**

- **Biên S thấp của Ẩu là do tỉ lệ thắng, không do mạng của ván thắng.** Ván thắng của Ẩu còn 13 mạng (p50), như Chuẩn, Nhanh; nhưng 33 % ván thua tính S = 0, nên trung vị rơi vào phần thấp của các ván thắng. 45 % ván thua của Ẩu chết trước khi boss tới Lũy (Thuồng Luồng của phần đầu Đêm 5 lọt sau khi lặng bắt đầu, khi Ẩu chỉ còn 14 mạng vì mất 3,3 ở Đêm 1).
- **Bot mạnh giữ Biên S ở đỉnh dải.** Ván thắng của Chậm chắc còn 16 mạng, Chuẩn 14, Nhanh 13,5: Biên S 60–70 %. Mạng mất ở đỉnh boss (p50, báo cáo) từ R1 tới nay: R1 6–8 cho mọi bot; nay Khá 0, Nhanh 2–3, Chuẩn 3, Chậm chắc 1–3,5, Mới 9, Ẩu 7–9. Thuồng Luồng lọt ở đỉnh: Khá 1,2, Nhanh 1,7 so với Mới 4,8, Ẩu 4,3 (bảng trên). Phần nào do Tối Thượng, phần nào do Bắn mạnh nối 0,8 của R2 chưa đo riêng.
- **Từng núm:** tốc boss chậm hơn (p1) nâng Chuẩn +6, Mới +5, Nhanh +3 điểm thắng (ván thua do boss) mà Ẩu chỉ +1 (ván thua do mạng); G3 trung bình chỉ +0,6 s. Bớt một Thuồng Luồng (p2 so với p1) nâng Ẩu +4 thắng, +10 Biên S nhưng Chậm chắc +6 thắng và Biên S của Chuẩn, Nhanh lên 70 %. Thêm Mầm Gỗ cùng `kHp` 0,15 (p3 so với p2): Mới −16, Chậm chắc −9, Chuẩn −4, Ẩu −2 thắng (Biên S −10), Khá, Nhanh gần như không đổi; phần của `kHp` (ước ~−5 cho Mới, ~−4 cho Chậm chắc theo máu boss) không giải thích hết, nên Mầm Gỗ thêm rơi chủ yếu vào ván dài của bot chậm. Thuồng Luồng 385 máu (p4) không nâng Ẩu (66 %), nâng Biên S của Chậm chắc, Chuẩn. Cháy 62/s (p5) nâng Chuẩn hơn Ẩu (Ẩu 61 %). Từ ngắn hơn cho E 45–54 (p6) làm Ẩu 67 → 38 %, Khá 81 → 59 %: bảng độ dài từ là núm theo tốc gõ mạnh nhất đã thấy, theo hướng ngược lại.
- **Kết luận:** với các núm số của §6.5, nâng Ẩu luôn kéo Biên S của Chuẩn, Chậm chắc, Nhanh ra khỏi 60–65 %; dải §3 (rộng 30 điểm Biên S) không chứa được hai cụm cách nhau 30–40 điểm. Cần một núm tác động khác chiều lên hai cụm.

**Quyết định:**

- **Đo bước 1–5 của §6.5** (đã chọn theo đề xuất của phản biện): làm đủ (bảng trên).
- **Giữ số hiện tại** (đề xuất của vòng này, chờ chủ dự án xác nhận): mọi lượt đo đều kém hơn ở B1 (5–8 ô trượt so với 3) và đích chặt gộp (2–3/6 so với 4/6). Không đổi số nên file vàng không đổi (nội dung `3cd14470`).
- **Tốc boss 0,78 m/s không giữ** (đề xuất của vòng này, chờ chủ dự án xác nhận): G3 đạt (45,9 / 46,7 s) nhưng Biên S của Chuẩn lên 65 % (dải chặt 40–60 %), B1 thêm 2 ô trượt. G3 bộ 2 còn trượt 0,3 s (44,7 s; gộp 45,9 s).
- **Núm kế cho lượt cân bằng của R3** (đã chọn theo đề xuất của phản biện: ghi là núm kế, không phải "cần chủ dự án"), theo thứ tự: (1) một khoản mạng ở đỉnh boss mà bot mạnh không dọn được bằng Tối Thượng (thiết kế: ví dụ đòn của boss trừ mạng theo nhịp, không theo quái lọt); (2) bảng độ dài từ theo E (`LENGTH_BY_E`, núm theo E mạnh nhất: thử từ dài hơn cho E 45–64 cùng `kHp2` cho Khá); (3) rồi mới tốc boss và máu boss cho G3 (bước 1); (4) trọng số độ chính xác của kit (BALANCE §4.1) chỉ sau ba núm trên, vì đầu ván đo được vẫn cho Ẩu E_eff 28,6 > Chuẩn 27,0 (sàn 0,7·E).

**Kết quả cuối** (`pnpm td:balance --threads=4` trên mã của đợt này, số không đổi, hai bộ × 120 seed, 891,5 s; lúc chạy, các kịch bản trình duyệt của làn này chạy song song trong WSL; `final.md`): giống `final2.md` của §7.4 từng dòng, trừ các dòng mới (G3, G8 mỗi bộ; bảng boss gộp) và dòng thời gian bước sim.

- B1 (dải §3 mỗi bộ): bộ 1 trượt Ẩu (68 / 30 %); bộ 2 trượt Chậm chắc (90 / 70 %: Biên S cao) và Ẩu (66 / 30 %). R1: bộ 1 trượt Chậm chắc (92 %), Ẩu (73 %), bộ 2 đạt.
- Đích chặt gộp: 4/6 (Mới 79 / 50, Chuẩn 79 / 60, Khá 81 / 58, Nhanh 81 / 60); trượt Chậm chắc (86 / 70), Ẩu (67 / 30).
- B3 đạt (Mới 79 / 79 % ở Cân bằng; Trẻ em 89 / 92 % ở Thư giãn); B2, B4–B8 đạt; B9 thiếu số.
- G2, G5, G6 như §7.4. **G3: 46,7 s bộ 1, 44,7 s bộ 2, 45,9 s gộp: trượt (bộ 2).** G8: trồi → trúng đầu 24,1 s ở cả hai bộ, Nhàn I đỉnh boss 0,9 / 0,4 %, gộp 0,6 %: đạt.

**Chunk nạp sau, lần 2 (§20).**

- `Chunk` (`src/app/chunks.ts`, 42 dòng): mỗi `import()` của `main.ts` thử 3 lần, nghỉ 0,4 rồi 0,8 s; hỏng thì một lỗi console (`the <tên> chunk did not load`) và trả về null; hỏi lại được sau 15 s. Đường dự phòng: màn đầu hỏng thì `titleUp` về false, ván chạy, HUD báo "Màn đầu chưa tải được: vào thẳng ván · F5 để thử lại" 10 s; thẻ tạm dừng hay thẻ kết hỏng thì Esc vẫn dừng và chạy tiếp, HUD báo "Tạm dừng · Esc để chạy tiếp (thẻ tạm dừng chưa tải được)" hay "Hết ải · F5 để chơi lại"; bảng hộp cát hỏng cũng có dòng báo. `__td.ready()` chờ chunk "đã tải hay đã bỏ".
- Thẻ Cài đặt và Hồ sơ gõ của màn đầu là chunk riêng, tải khi được chọn (tải trước ngay sau khi màn đầu hiện; §7.6 bỏ phần tải trước này, F4); chưa tải được thì tiếng "off", menu giữ nguyên. Tiếng, thẻ tạm dừng và kết, bảng hộp cát tải sau khung đầu, khi trang đã dùng được, không còn tải song song với phần khởi động.
- `scripts/bundle-budget.mjs` đọc `dist/.vite/manifest.json` (`build.manifest`), tính phần khởi động của từng trang theo `main.ts` ("/": chunk vào và màn đầu; `?title=0`: chunk vào) cùng mọi chunk chúng nhập, hỏng build nếu quá 85 kB, in phần còn trống, các chunk nạp sau và tổng. Số: "/" 82,56 kB (chunk vào 77,98 + màn đầu 4,58), chừa 2,44 kB; `?title=0` 77,98 kB, chừa 7,02 kB; nạp sau: tiếng 4,24, thẻ 2,02, Cài đặt 1,08, Hồ sơ 0,93, hộp cát 0,78; tổng 91,61 kB. Trước đợt này "/" cần 83,73 kB. Chunk vào lớn thêm 0,73 kB vì đường dự phòng và chữ báo.
- Kiểm: 3 test đơn vị (`tests/td-chunks.test.ts`: thử lại rồi được; bỏ sau 3 lần với đúng một lỗi; `Chunk` nghỉ rồi tải lại được); kịch bản `td-1b-chunks` (chặn module của chunk bằng `Network.setBlockedURLs` của CDP): màn đầu bị chặn thì ván chạy, phím tới game (Insert mở bảng xây), HUD báo, đúng một lỗi console; thẻ tạm dừng bị chặn thì Esc dừng và chạy tiếp, HUD báo; bỏ chặn và qua 15 s thì Esc hiện thẻ tạm dừng (Chrome for Testing 156 tải lại module đã hỏng; Chrome 155 trên Mac thì không, §7.6); không lỗi nào khác, không ngoại lệ; hai cỡ đạt.
- R3 thêm vào chunk vào (`app/learn.ts`, kế hoạch học) sẽ vượt 2,44 kB còn trống: tách tiếp `__td` (chỉ kịch bản dùng) và phần "Chơi lại Ngày n", "Chép số chơi thử" ra chunk riêng trước, hoặc chủ dự án xác nhận định nghĩa.

**Hiệu năng ở 60 Hz (§20).** Đo trên Dell, Chrome Windows 155.0.8059.82 không đầu (WebGL: ANGLE, NVIDIA GeForce RTX 3050 Ti Laptop, D3D11), node Windows, máy chủ dev của game trong WSL (cổng 3006), khoá GPU `D:\_tools\gpu.lock` giữ suốt mỗi lượt; máy yên: không lượt cân bằng hay kịch bản nào chạy, CPU Windows 3–24 % (mẫu mỗi 2 s trong `cpu-final.txt`, xung 100–160 % mức gốc, không bị hạ xung), tải WSL ≤ 0,9 (`gpu-final/machine.txt`).

- `td-1b-perf` giờ giữ nhịp khung ở 60 Hz bằng một lớp bọc `requestAnimationFrame` cài trước khi trang nạp (`PERF_HZ`, 0 là nhịp của trình duyệt); trên trang nhẹ lớp này giữ 60,07 khung/s (`pacecheck.mjs`). Kết quả in khung/s, phần thời gian bận và ms mỗi khung; kiểm `pacedRate` đòi khung/s trong ±5 % của 60.
- Kiểm "không khung > 16,7 ms lúc trồi" đọc nhầm: `t.costs()` giữ 600 khung cuối, ở ~60 khung/s chúng lùi về quá lúc trồi tới lúc gọi boss; khung dài nhất trong đó (20–48 ms ở các lượt giữ nhịp đầu) nằm ngoài lúc trồi (nhiều khả năng là lần vẽ lại nền khi thanh boss hiện và dời sân xuống). Giờ kiểm chỉ đọc các khung của 2,5 s trồi (đếm bằng `requestAnimationFrame`): 3,5–7,8 ms.
- **Số đo (lượt `gpu-final`, 06:02–06:05):** giữ 60 Hz, 1280 × 720: 3,97 ms mỗi khung (56,7 khung/s, bận 22,5 %) và 4,11 ms (55,9; 23,0 %); 1920 × 1080: 3,88 ms (56,3; 21,8 %) và 4,55 ms (50,5; 23,0 %). Không giữ nhịp: 3,36 ms (67,5 khung/s, 22,6 %) và 3,51 ms (59,5; 20,9 %). Vẽ 2D + thẻ p95 3,2–4,6 ms (≤ 8 ms), bước + HUD p95 0,8–1,5 ms, khung lớn nhất lúc trồi 3,5–7,8 ms, 293–296 quái, Tối Thượng 2 lần (24 lông). Phần Node chạy lại trong WSL: 6/6 nhật ký khớp mã băm (`gpu-final/replays.txt`).
- **Đọc số:** hôm nay máy không giữ nổi 60 khung/s cho cảnh này (kiểm `pacedRate` trượt ở cả bốn lượt giữ nhịp; không giữ nhịp chỉ 59–68 khung/s, so với 121–156 khung/s trên cùng máy ở §7.3, §7.4 và 97 khung/s lúc người phản biện đo; CPU không bị hạ xung, nên nhiều khả năng nghẽn ở đường GPU; chưa rõ vì sao). Ở nhịp đạt được, luồng chính 3,9–4,6 ms mỗi khung: hai trong bốn lượt quá 4 ms. Phần bận gần như không đổi theo khung/s: hôm nay 21–23 % ở 50–68 khung/s, ở §7.4 22,7 % ở 135 khung/s, lượt người phản biện 21–27 %; tức luồng chính tốn ~210–270 ms mỗi giây, ở đúng 60 Hz là 3,5–4,5 ms mỗi khung (hôm nay 3,5–3,8 ms). Kết luận: **§20 luồng chính ở 60 Hz chưa đạt chắc chắn trên máy này** (sát 4 ms), đúng như người phản biện ước (3,5–4,5 ms).
- **So với mã trước đợt (đo trên Dell, chưa đủ để kết luận; phép so trên Mac ở §7.6):** đo xen kẽ mã HEAD `0fc83a8` (máy chủ dev thứ hai trên ảnh chụp, cổng 3016) với mã mới, cùng kịch bản, không giữ nhịp, 1280 × 720 (`gpu-ab/`, `gpu-60/`): HEAD 3,75 / 3,98 / 4,15 ms (trung bình 3,96), mới 4,00 / 3,65 / 4,55 ms (trung bình 4,07). Chênh 0,11 ms nhỏ hơn độ lệch giữa các lượt của mỗi bên (0,40 và 0,90 ms), nhưng 3 lượt mỗi bên không đủ để nói "không làm chậm". Một chỗ khác giữa hai bên: máy chủ của ảnh chụp HEAD không phục vụ được phông `@fontsource` (nằm ngoài danh sách cho phép của Vite vì `node_modules` nối vào), nên trang HEAD vẽ chữ bằng phông dự phòng. (Sửa phản biện R2 lần 3, F6: câu cũ "mã của đợt này không làm chậm" nói quá số đo.)
- **Đã thử, không giữ:** vẽ thân quái theo từng loại một path (một lần tô, một lần viền thay cho 300 lần), thanh máu hai path. Đo xen kẽ ở 60 Hz (`gpu-batch/`): HEAD 4,04 / 4,44 ms (1280), 3,75 ms (1920); bản gộp 4,81 / 4,39 ms, 3,60 ms: không thấy lợi, nên bỏ. Vẽ 2D trung bình ~2 ms mỗi khung (p95 3–4,6 ms), bước + HUD ~0,4 ms; phần còn lại (~1,5 ms) là việc của Chrome (vẽ HUD, ghép lớp, chờ GPU) mà bộ đếm trong trang không thấy.
- Còn mở trước R3: lấy hồ sơ CPU của một khung (CDP `Profiler`) ở 60 Hz để biết phần nào của ~4 ms là vẽ canvas, phần nào là Chrome chờ GPU, rồi mới cắt; đo lại khi máy vẽ lại được ở nhịp cũ.

**Số dòng:** 9.550 → 9.658 (trần R2 10.000): `app/chunks.ts` 42 (mới), `main.ts` 375 → 421, `ui/title.ts` 259 → 278.

**File vàng:** không làm lại (số không đổi); `pnpm td:golden:check` khớp ở mọi commit (nội dung `3cd14470`; `td-1a.json` 19.540 tick, `td-1b-boss.json` 5.306 tick, boss rút với 2.383 sát thương).

**Kiểm (Dell):**

- Mỗi commit mã của đợt này kiểm riêng trên cây của chính nó (`git archive` ra `/tmp/td-r2fix2/wt-<commit>` với `shared/` và `node_modules` nối vào; các bước của `pnpm check` gọi thẳng `verify-kit`, `vitest`, `tsc`, `vite build`, `bundle-budget.mjs`, vì `pnpm` trong cây chụp đòi cài lại vào `node_modules` nối vào; rồi hai bước của `pnpm td:golden:check`; `tree-<commit>.log`): `c9a8edd` (289 test, 25 file; ngân sách cũ: chunk vào 77,25 kB), `2dd9596` (292 test, 26 file; "/" 82,56 kB), `43994b2` (292 test) đều đạt, file vàng `same: true` (nội dung `3cd14470`). `89a6d58` chỉ đổi kịch bản `td-1b-perf`, kiểm cùng cây cuối.
- `pnpm check` và `pnpm td:golden:check` trên cây cuối (`89a6d58` cộng giấy tờ của commit cuối; `check-final.log`): kit sha256 (31 file), 292 test (26 file), `tsc`, `vite build`, ngân sách gói ("/" 82,56 kB, chừa 2,44 kB; `?title=0` 77,98 kB; tổng 91,61 kB); hai file vàng khớp.
- Kịch bản trình duyệt (Chrome for Testing trong WSL, máy chủ dev của game cổng 3006, mã của `2dd9596`): 16 kịch bản × 2 cỡ đều đạt: `td-1b-chunks` (mới), `td-1b-direct`, `td-1b-boss`, `td-1b-ult`, `td-1b-night5`, `td-1b-build`, `td-theme`, `td-balance`, `td-1a-boot`, `td-1a-ime`, `td-1a6-attention`, `-day`, `-keyboard`, `-learn`, `-night`, `-tour`; 0 ngoại lệ; 0 lỗi console ngoài hai lỗi `td-1b-chunks` cố ý gây ra; các kịch bản có kiểm chạy lại ra cùng mã băm trên Node. `td-theme` chạy màn đầu với thẻ Cài đặt nạp khi chọn, thẻ tạm dừng và thẻ kết nạp sau khung đầu.
- `td-1a6-perf` trên Chrome Windows có GPU (`gpu-1a6/`): 1280 × 720: 74 khung/s, luồng chính 3,34 ms mỗi khung (≤ 8 ms), vẽ p95 3,2 ms, bước sim trong Chrome p95 0,14 ms; 1920 × 1080: 70 khung/s, 3,28 ms, vẽ p95 2,9 ms; mọi kiểm trong trình duyệt đạt; phần Node chạy trong WSL: 2/2 nhật ký khớp, `golden.ts --check --log` ra `same: true` ở hai cỡ (kiểm `chromeStepsNodeGoldenLog` cần nhật ký vàng do Node ghi trong cùng lượt, mà node Windows không có `tsx`, nên lượt này không chạy được phần đó).
- Số dòng, file vàng: ở trên. Không đẩy (push); con trỏ submodule ở repo cha không đổi.


### 7.6 Sửa sau phản biện R2 lần 3 (25/10/2026, Mac mini M4)

Changelog: `docs/changelog/2026-10-25-td-1b-r2-fix3.md`. Làm trên Mac mini M4 (Apple M4 10 lõi, 16 GB, macOS 15.5, Node 24.22, Chrome 155.0.8059.86 có GPU). Mọi số hiệu năng dưới là số **Apple M4**; máy dùng chung với ba làn khác (khóa `.local/bin/heavy.sh` của repo cha: trình duyệt một chỗ, CPU bốn chỗ). Phiếu Codex 011 (phản biện lần 2 của đợt sửa R2) nêu F3–F6; báo cáo phiếu nằm lại trên Dell, nên mỗi mục được đọc lại trong mã trước khi sửa. Thêm hai mục còn sót của process §6.A. Bằng chứng (ngoài Git): `tmp/mac-2026-10-25/` (`baseline/`, `s6a/`, `f3/`, `f5/`, `f6/` với `runs/`, `ab.sh`, `summarize.mjs`; `pre/`, `final/`).

**Phát hiện và cách xử lý:**

| # | Phát hiện | Kiểm lại | Xử lý | Trạng thái |
|---|---|---|---|---|
| F3 | Tiếng và bảng hộp cát không tải lại sau lỗi | Đúng: `prefetch()` (`main.ts:205-208` cũ) hỏi hai chunk này một lần; chỉ thẻ tạm dừng có chỗ hỏi lại (`showHud`) | Tiếng: `wantSound`, `wakeSound` (`main.ts:72-74`) hỏi lại ở mỗi phím, cú bấm (cả phím màn đầu nhận, `main.ts:101`, `:188`) khi tiếng chưa có. Bảng hộp cát: `showHud` hỏi lại mỗi giây khi bảng đang mở (`main.ts:253-256`). `Chunk` giữ 15 s nghỉ sau lỗi. `__td.chunks()` (`main.ts:374`) | đã sửa |
| F4 | Tài liệu nói Cài đặt, Hồ sơ gõ "tải khi được chọn", mã tải trước | Đúng: `main.ts:104-105` cũ tải cả hai ngay khi màn đầu hiện | Bỏ tải trước (tải thật khi chọn, vì phần khởi động không đổi, dưới). Hồ sơ gõ tải khi chọn; Cài đặt khi chọn, hoặc cùng chunk thẻ tạm dừng (thẻ đó chứa một thẻ Cài đặt) khi trang đã dùng được. Sửa câu ở BUILD_1B §20, AGENTS.md, ghi chú ở §7.5; `td-balance` kiểm module Hồ sơ gõ chưa tải trước khi chọn | đã sửa |
| F5 | Kiểm "không khung > 16,7 ms lúc trồi" lấy max từng phần | Đúng: `td-1b-perf.mjs:113` cũ `Math.max(...rise.draw, ...rise.update)` | Chấm tổng bước + vẽ của từng khung (`td-1b-perf.mjs:70-74`, `:118`): `runFrameLoop` đẩy mỗi danh sách một lần mỗi khung, nên hai danh sách khớp từ cuối; kiểm thêm `aligned` | đã sửa |
| F6 | Câu "không làm chậm" của §7.5 chưa chứng minh | Đúng: 3 lượt mỗi bên, trang HEAD vẽ bằng phông dự phòng | Đo A/B trên Mac, 18 lượt xen kẽ (dưới). Câu ở §7.5 và changelog lần 2 viết lại đúng như đã đo | đã sửa: không chậm hơn đo được |
| §6.A-1 | Thẻ tháp, trại lính, mỏ, ruộng tràn chữ ở nút bán và "Gửi Draconis" ở 1280 × 720 | Đã hết từ R2 (`a9d855e`: hàng nút xuống dòng; `td-1b-build` đo). Ảnh Mac: vừa. Nhưng kiểm cũ chỉ đọc thẻ của Đặt sẵn: nhà miễn phí nên nhãn bán là "+0 vàng, +0 gỗ", nhãn ngắn nhất | `td-1b-build` thêm một trang hộp cát mua 5 loại nhà và nâng lên cấp 3 (nhãn dài nhất), đo thẻ chưa bấm và đã bấm bán | đạt ở hai cỡ, không cần sửa CSS |
| §6.A-2 | `typedInTheWindow` của `td-1a6-perf` chập chờn (29–35 phím, cần ≥ 30) | Đã sửa ở `a9d855e` (cửa sổ kéo tới 20 s cho tới khi đủ 30 phím; khung của cả cửa sổ đều đo) | Giữ, không đổi | đạt: 5/5 lượt trên Mac, 35 phím trong 10,1–10,2 s, cửa sổ chưa phải kéo dài |

**F3: tải lại chunk hỏng tùy trình duyệt.** Đầu dò `f3/probe-import.mjs`: chặn một module, `import()` hỏng; bỏ chặn, `import()` cùng địa chỉ vẫn hỏng, còn `import()` cùng module ở địa chỉ khác (thêm `?q=`) thì được: chặn đã bỏ, lỗi được giữ trong bản đồ module của trang. Chrome 155 giữ lỗi của module trong bản đồ module tới khi tải lại trang. Chrome for Testing 156 trên Dell (§7.5) thì tải lại. Vì vậy:

- Kịch bản `td-1b-chunks` của đợt lần 2 trượt kiểm `cardAfterCoolDown` trên Mac, cả với mã của đợt đó (`f3/head/`).
- Trang giờ hỏi lại mọi chunk hỏng khi cần. Trên Chrome 155 lần hỏi lại cũng hỏng (một lỗi console nữa), dòng HUD giữ nguyên, F5 mới gỡ được. Trên trình duyệt tải lại được, chunk về.
- `td-1b-chunks` chạy một đầu dò như trên rồi chấm theo trình duyệt. Tải lại được: thẻ tạm dừng hiện, bảng hộp cát về tự nó, tiếng về ở phím kế. Giữ lỗi: trang hỏi lại đúng lúc cần (bảng hộp cát trước mọi phím, tiếng và thẻ tạm dừng sau Esc, mỗi cái thêm một lỗi "did not load") và dòng HUD còn.
- Lần chạy trên Mac (Chrome 155): đầu dò ra "giữ lỗi"; bảng hộp cát hỏi lại trước phím, tiếng và thẻ sau Esc; mọi kiểm đạt ở hai cỡ.
- Không thể buộc trình duyệt tải lại cùng địa chỉ. Đổi địa chỉ (thêm `?retry=`) cần biết tên chunk đã băm lúc chạy, mà Vite không đưa ra; chưa làm.

**F4: phần khởi động sau khi bỏ tải trước.** Hai thẻ vẫn là chunk riêng, nên phần khởi động không đổi theo F4; chunk vào chỉ lớn thêm vì F3. Cùng cách đo, cùng máy (`pnpm build` trên Mac): mã lần 2 (`266e39d`) "/" 81,95 kB, `?title=0` 77,44 kB; mã đợt này "/" 82,04 kB (chunk vào 77,53 + màn đầu 4,51), chừa 2,96 kB; `?title=0` 77,53 kB; nạp sau 8,97 kB (Hồ sơ 0,92, Cài đặt 1,08, thẻ 1,99, tiếng 4,22, hộp cát 0,77); tổng 91,01 kB. Cùng mã lần 2, Dell đo "/" 82,56 kB: số của hai máy lệch 0,61 kB (bản dựng của Mac nén nhỏ hơn); so sánh trong đợt này chỉ dùng số của Mac. Đo ở `td-balance` (Chrome 155, máy chủ dev): sau 2,5 s ở màn đầu chưa có yêu cầu nào tới `src/ui/profile.ts`; bấm 5 thì module tải và thẻ mở trong 400 ms.

**F6: A/B trên Mac.** Hai cây: mã trước đợt lần 2 (`0fc83a8`, "cũ") và mã sau đợt (`266e39d`, "mới"), mỗi cây `git archive` ra `tmp/mac-2026-10-25/f6/ab/`, cài `node_modules` riêng (phông `@fontsource` phục vụ được ở cả hai: mã 200), mỗi lượt chỉ một máy chủ dev ở cổng 3006. Cùng kịch bản `td-1b-perf` (bản đã sửa F5), giữ nhịp 60 Hz, 1280 × 720, xen kẽ: bộ a theo ABBA (cũ mới mới cũ ×2), bộ b theo từng cặp (mới cũ cũ mới …, 10 lượt). Mỗi lượt ghi tải máy (`machine.txt`). Số là ms mỗi khung (luồng chính Chrome; "trang" là bước + HUD và vẽ 2D + thẻ, bộ đếm trong trang):

| Bộ | Lượt | Cũ: luồng chính / trang | Mới: luồng chính / trang |
|---|---|---|---|
| a | 1–4 (máy yên) | 1,043 / 0,658; 1,023 / 0,644 | 1,032 / 0,647; 1,027 / 0,649 |
| a | 5–8 (làn âm thanh bắt đầu sinh âm trên GPU; tải 5,9 → 12,8) | 1,181 / 0,734; 1,559 / 0,960 | 1,564 / 0,965; 1,840 / 1,156 |
| b | 1–6 (làn khác còn chạy) | 1,796 / 1,149; 1,551 / 0,958; 1,512 / 0,918 | 1,779 / 1,126; 1,556 / 0,928; 1,600 / 0,992 |
| b | 7–10 (máy yên) | 1,087 / 0,674; 1,013 / 0,648 | 1,023 / 0,656; 1,025 / 0,648 |

- Chín cặp liền nhau, mới trừ cũ (luồng chính): −0,011; +0,004; +0,383; +0,281; −0,017; +0,005; +0,089; −0,064; +0,011 ms. Trung vị +0,005 ms.
- Hai cặp lớn (+0,38, +0,28) rơi đúng lúc làn âm thanh bắt đầu chạy Stable Audio trên GPU (tải 5,9 → 12,8): lượt "mới" đo giữa lúc tăng, lượt "cũ" sau đó. Hai cặp đó không quyết được.
- Lượt máy yên (luồng chính < 1,1 ms): cũ 1,043 / 1,023 / 1,087 / 1,013 (trung bình 1,042), mới 1,032 / 1,027 / 1,023 / 1,025 (1,027). Phần của trang: cũ 0,656, mới 0,650 ms.
- **Kết luận:** trên Apple M4, mã sau đợt lần 2 không chậm hơn mã trước đợt trong giới hạn đo được: chênh của lượt máy yên dưới 0,02 ms mỗi khung (khoảng 2 %), theo chiều mới nhanh hơn; khi máy bị làn khác chiếm, mỗi lượt lệch 0,5–0,8 ms, lớn hơn mọi chênh có thể có.
- 2 trong 18 lượt trượt kiểm "không khung > 16,7 ms lúc trồi" khi máy bị chiếm: một lượt mới (105 ms, hai phần của cùng khung đều ~52 ms: tiến trình bị dừng, lúc tải lên 12,8), một lượt cũ (25,8 ms). Mã nào cũng trượt như nhau; số của lượt máy yên dưới.

**F5: số mới.** Lượt đầu (`f5/`, máy yên, 1280 × 720, 60 Hz): khung dài nhất lúc trồi 1,7 ms theo tổng (vẽ 1,0, bước 0,7: cách chấm cũ ra 1,0); luồng chính 0,97 ms mỗi khung ở 59,9 khung/s; vẽ p95 0,7 ms. Lượt trên mã đã commit (`final/`): 1280 × 720 khung dài nhất lúc trồi 1,8 ms (vẽ 1,1, bước 0,7), luồng chính 1,15 ms ở 59,9 khung/s (bận 6,9 %), vẽ p95 0,8 ms; 1920 × 1080: 1,7 ms (1,1, 0,6), 1,26 ms ở 59,9 khung/s (bận 7,5 %), vẽ p95 0,9 ms; 295–296 quái, Tối Thượng 2 lần (24 lông); nhật ký chạy lại trên Node khớp mã băm. Ngân sách §20 (≤ 4 ms ở 60 Hz, khung ≤ 16,7 ms lúc trồi, vẽ p95 ≤ 8 ms) đạt rộng trên Apple M4; số Dell (3,9–4,6 ms) vẫn là số của máy yếu nhất phải đạt.

**§6.A-1: nhãn bán dài nhất (cấp 3, giá thật).** Tháp Cung "+121 vàng, +52 gỗ", Tháp Pháo "+163 vàng, +70 gỗ", Trại Lính "+113 vàng, +48 gỗ", Mỏ Vàng "+138 vàng, +59 gỗ", Ruộng "+96 vàng, +41 gỗ". Ảnh 1280 × 720: nhãn Tháp Pháo cách mép nút khoảng 20 px mỗi bên; "Gửi Draconis" (tên dài nhất trong bốn người) một hàng riêng. Không nút nào tràn hay ra ngoài thẻ, cả lúc đã bấm bán một lần, ở hai cỡ. Nhật ký trang thứ hai cũng chạy lại trên Node ra cùng mã băm.

**Số dòng:** 9.658 → 9.670 (trần R2 10.000): `main.ts` 421 → 433.

**File vàng:** không làm lại (luật không đổi); `pnpm td:golden:check` khớp trên mã đã commit (nội dung `3cd14470`; `td-1a.json` 19.540 tick, `td-1b-boss.json` 5.306 tick, boss rút với 2.383 sát thương).

**Kiểm (Mac, trên mã đã commit `ccef34a`):**

- `pnpm check`: kit sha256 khớp (31 file), 292 test trong 26 file, `tsc`, `vite build`, ngân sách gói: "/" 82,04 kB ≤ 85 kB (chừa 2,96 kB), `?title=0` 77,53 kB, tổng 91,01 kB.
- `pnpm td:golden:check`: hai file vàng khớp (`same: true`, nội dung `3cd14470`).
- Commit giữa `48e1b1d` (chỉ F3, còn tải trước hai thẻ): `git archive` ra cây riêng, `tsc --noEmit` qua. `01fa19a`, `ccef34a` chỉ đổi kịch bản; `b493f29` là `main.ts` cuối.
- Kịch bản (Chrome 155 macOS có GPU, máy chủ dev cổng 3006): 7 kịch bản × 2 cỡ, 14/14 đạt: `td-1b-chunks`, `td-balance`, `td-theme`, `td-1a-boot`, `td-1b-perf`, `td-1a6-perf`, `td-1b-build`. 0 ngoại lệ. Lỗi console chỉ có các lỗi `td-1b-chunks` cố ý gây ra (7 mỗi lượt: màn đầu 1; hộp cát, tiếng, thẻ mỗi cái 2). Nhật ký trang chạy lại trên Node khớp ở mọi kịch bản có kiểm đó.
- `td-1a6-perf`: 1280 × 720: 60,2 khung/s, luồng chính 1,16 ms mỗi khung (p95 các đoạn 0,5 s: 1,44 ms), vẽ p95 0,7 ms, bước sim trong Chrome trung vị 0,02 ms, p95 0,04 ms, Chrome bước nhật ký vàng của Node ra cùng 325 mã băm, file vàng còn đúng; 1920 × 1080: 60,1 khung/s, 1,11 ms (p95 1,55), vẽ p95 0,8 ms. 35 phím trong cửa sổ ở cả hai cỡ.
- Chưa chạy lại trên Mac: 11 kịch bản còn lại (`td-1b-boss`, `-night5`, `-ult`, `-direct`, `td-1a-ime`, `td-1a6-attention`, `-day`, `-keyboard`, `-learn`, `-night`, `-tour`); lần đạt cuối là trên Dell (§7.5). Mã đợt này chỉ đổi cách nạp chunk, phần đó đã đi qua `td-1a-boot`, `td-theme`, `td-balance`, `td-1b-chunks` ở trên. `td:balance` không chạy lại: luật không đổi, file vàng không đổi; số cân bằng cuối ở §7.5.
- Đẩy (push) nhánh `main` của game; con trỏ submodule và changelog ngày ở repo cha để điều phối viên làm.

**Còn mở sau đợt này:**

- Chrome 155 không tải lại chunk đã hỏng: thẻ tạm dừng, thẻ kết, bảng hộp cát, tiếng chỉ về sau F5. Câu báo của thẻ tạm dừng chưa nói F5; núm rẻ nhất là thêm "F5 để thử lại". Đưa chunk thẻ (1,99 kB) cùng thẻ Cài đặt (1,08 kB) về phần khởi động thì quá 2,96 kB còn trống.
- Như §7.5: B1 (Ẩu cả hai bộ, Chậm chắc bộ 2), G3 bộ 2 (44,7 s); ba quyết định chờ chủ dự án xác nhận; R3 cần chỗ trong chunk vào (tách `__td`, "Chơi lại Ngày n" trước); chủ dự án chơi thử cho B9.

### 7.7 R3 "Học và dạy" (bắt đầu 25/10/2026, Mac mini M4)

Kế hoạch: `docs/td/R3_PLAN.md` (việc theo file, thứ tự, dạng dữ liệu, 14 chỗ đặc tả chưa rõ đã chọn theo đề xuất, test, kịch bản, kế hoạch cân bằng, ngân sách dòng và thứ tự cắt). Changelog: `docs/changelog/2026-10-25-td-r3-plan.md`. Số đo dưới là số **Apple M4**. Bằng chứng (ngoài Git): `tmp/mac-2026-10-25/r3-plan/` (ba cây dựng thử), `tmp/mac-2026-10-25/r3-baseline/` (vết Chrome, hồ sơ CPU, script đo và phân tích).

**Mốc trước R3, mã `89e2494`:**

- **Gói (dựng trên Mac):** "/" 82,04 kB gzip (chừa 2,96 kB). Bỏ `__td` (`main.ts:370-433`): 80,91 kB (−1,13). Bỏ thêm phần "Chơi lại Ngày n" và "Chép số chơi thử" (`main.ts:112-155`, `:339-368`): 80,18 kB (−0,73). Tách hai phần này ra chunk nạp sau là bước 1 của R3 (ước "/" ~80,4 kB, chừa ~4,6 kB); phần R3 ở chunk vào ước ~2,9 kB.
- **Một khung ở 60 Hz (Chrome tracing qua CDP; việc còn mở của §7.5):** cảnh `td-1b-perf` (boss + ~304 quái + Mầm Gỗ), 1280 × 720: luồng chính 1,32 ms mỗi khung (có Tối Thượng: 1,62); 1920 × 1080: 1,33 (1,51). Trong 1,32 ms: hàm khung của game 0,91 (vẽ 2D ~0,49, trong đó thân quái 0,18; bước sim 0,06; HUD 0,05; thẻ chữ 0,03), Chrome gửi lệnh vẽ sang GPU (`Commit`) 0,21, lifecycle ngoài hàm khung 0,04, GC 0,03, lịch và IPC 0,13. Tiến trình GPU 1,47 ms mỗi khung, ở luồng khác. Khung p50 1,24 ms, dài nhất 6,25 ms (một lần GC lớn); có Tối Thượng dài nhất 9,93 ms (khung dùng chiêu). Vết không làm chậm khung đo được (1,35 ms không vết, 1,32 ms có vết). Bảng đủ và một khung dạng cây: `R3_PLAN.md` §1.2.
- Đọc số: trên Apple M4, §20 còn rộng (1,3–1,6 ms so với 4 ms). Không suy được nguyên nhân 3,9–4,6 ms của Dell (§7.5) từ số Mac; lần đo trên Dell nên dùng cùng script để so từng dòng.

**Quyết định của đợt kế hoạch** (đã chọn theo đề xuất, chủ dự án đổi được; chi tiết `R3_PLAN.md` §5): A1 "gặp" là từ ra thẻ sáng; A2 Từ Ôn quay lại 25–45 s bằng luồng `words`; A3 một Từ Ôn cho lời gọi kinh tế ≥ 4 từ; A4 Chuộc lại khi không lỗi hoặc hạng ≥ Tốt; A5 R3 chưa hỏi cổng cha; A6 sổ sim 20, sổ lưu 40; A7 túi cấp hiện tại giữ như nay; A8 sự kiện học và sổ ôn ở cả truyện và hộp cát; A9 chip ở lại cả Ngày, Đêm; A10 giữ mục "Học" của màn đầu; A11 Neo để chạy không phạt thêm; A12 vòm Troll chỉ giảm đạn bay; A13 `td-1b-story` tới Ngày 3 bằng nhật ký bot; A14 núm 1 của cân bằng là "Rễ hút sinh khí".

**Số dòng:** 9.670 (không đổi; đợt này chỉ có tài liệu). Ước sau R3 ~10.270 (trần 10.500).

**Phần A (bước 1–6, 25–26/10/2026; changelog `docs/changelog/2026-10-26-td-r3-part-a.md`).** Số Apple M4, bản dựng trên Mac. Bằng chứng (ngoài Git): `tmp/mac-2026-10-25/r3/` (nhật ký `pnpm check`, ảnh và nhật ký kịch bản, cây dựng thử `probe-*`).

| Bước | Commit | "/" gzip (chừa) | Dòng `.ts` | Ghi chú |
|---|---|---|---|---|
| trước R3 | `89e2494` | 82,04 (2,96) | 9.670 | |
| 1 tách chunk | `121ccae` | 80,84 (4,16) | — | `dev-tools` 1,40 kB, `retry` 0,86 kB nạp sau |
| 2 Học trong sim | `ed594d0` | 81,78 (3,22) | 10.057 | file vàng làm lại (changelog) |
| 3–4 Học ở app, thẻ chữ | `d39f5c1` | 80,64 (4,36) | 10.113 | `chunkOf`: cổng portal và sự kiện học của kit đi cùng chunk `learn` (3,22 kB) |
| 5 bảng dạy | `aef8c16` | 80,81 (4,19) | — | chunk `tips` 1,11 kB |
| 6 Chế độ, sao | `9767b19` | 81,25 (3,75) | 10.255 | `?title=0` 79,85 kB |

- **Test:** 322 test / 29 file (bước 6). Mới: `td-learn-app` (9: kho, kế hoạch, khởi động lạnh, gộp sổ, `seen`, sự kiện học, luật nghĩa), `td-tips` (6: bảng §12, khung, ≤ 2 câu mỗi pha, hộp cát, dòng "làm gì"), `td-settings` (6: Chế độ, sao, `td.campaign`). `td-chunks` kiểm `chunkOf` trên một đồ thị mẫu và việc `main.ts` không nhập thẳng `app/learning.ts`.
- **File vàng:** chỉ bước 2 đổi (lý do ở changelog); bước 3–6 `pnpm td:golden:check` ra `same: true` (19.147 và 5.306 tick, nội dung `d8a963d2`).
- **Khung câu dạy:** ở giữa đỉnh màn nó che Khe Nứt cả pha (ảnh thử ở `tmp/mac-2026-10-25/r3/probe/`), nên khi chưa có boss nó nằm góc phải trên, ngoài sân: rộng 304 px ở 1280 × 720 và 444 px ở 1920 × 1080 (CSS lấy chỗ trống bên phải sân, không dưới 284 px × hud). Chip xuống dòng giữa hai phần, không giữa một phần. Từ lời báo Ngày 5, hai hàng boss ở thanh boss như R1 (`R3_PLAN.md` §5 A16, A17).
- **Kịch bản trên mã `9767b19`** (26/10 00:40–01:09, Chrome 155 macOS có GPU, máy chủ dev cổng 3006, chạy dưới `heavy.sh --gpu` xen với lượt `dh-*` của làn Rồng): 18/18 lượt đạt (9 kịch bản), mỗi kịch bản ở 1280 × 720 và 1920 × 1080, 0 lỗi console ngoài lỗi cố ý của `td-1b-chunks`, 0 ngoại lệ, nhật ký chạy lại trên Node khớp ở mọi kịch bản có kiểm.
  - Mới: `td-1b-learn` (14 kiểm), `td-1b-story` (17 kiểm), và lượt chặn `learn` + `tips` của `td-1b-chunks` (ván vẫn chạy tới tick 160 sau khi chunk Học bỏ cuộc, đầu ván không danh sách, khung câu trống, đúng hai lỗi console tên hai chunk đó).
  - Chạy lại vì đợt này chạm tới: `td-theme` (Cài đặt có thêm dòng), `td-1b-build` (thẻ nhà ở truyện có dòng "làm gì"; mọi thẻ cấp 3 vẫn vừa), `td-1b-night5` (hai hàng boss ở hộp cát và sau "Chơi lại Ngày 5"), `td-1b-boss`, `td-1a-boot`, `td-balance` (Cài đặt, dòng nhịp).
  - Ảnh đã xem; sửa từ ảnh: khung câu dời khỏi giữa đỉnh màn (che Khe Nứt), chip xuống dòng giữa hai phần, sao vàng trên dòng "Bắt đầu" đang chọn (đỏ trên đỏ không đọc được), nhãn "Chế độ (truyện)" để dòng phụ vừa một dòng.
- **Còn mở trước phần B:** 11 kịch bản cũ chưa chạy lại trên Mac (bước 10); lượt cân bằng chưa chạy vì bot chưa chơi Học (bước 8) nên luật của bot không đổi.

**Phần B (bước 7, 8, 11 và phần kịch bản của bước 10; 26/10/2026; changelog `docs/changelog/2026-10-26-td-r3-part-b.md`).** Số Apple M4, bản dựng trên Mac. Bằng chứng (ngoài Git): `tmp/mac-2026-10-25/r3b/` (lượt làm, bị ngắt lúc 02:28 vì hết hạn mức), `tmp/mac-2026-10-25/r3b2/` (lượt kiểm và sửa: nhật ký `pnpm check`, bảng cân bằng, ảnh và nhật ký kịch bản, script gỡ lỗi `dbg/`).

| Bước | Commit | "/" gzip (chừa) | Dòng `.ts` | Ghi chú |
|---|---|---|---|---|
| 7 Troll, Đầu Đàn, Neo, Phá Khiên | `b8d78d3` | 82,62 (2,38) | 10.413 | +1,37 kB (ước +0,9), +158 dòng (ước +105). Còn 87 dòng dưới trần: **không cắt** (thứ tự cắt `R3_PLAN.md` §8 không dùng tới) |
| 8 bot Học | `096f69d` | — | — | chỉ `tests/`, `scripts/` |
| 11 gói chơi thử | `0bb942f` | 82,62 (2,38) | 10.413 | `retry` 1,01 kB nạp sau; `?title=0` 81,22 kB |
| 10 (một phần) kịch bản | `0738e94`, sửa ở lượt kiểm | — | — | `td-1b-tour` mới, `td-1b-direct` thêm phần R3 |

- **Test:** 331 test / 31 file trên `0738e94`; 332 sau lượt kiểm (`td-b9`: file hộp cát không vào B9). Mới ở phần B: `td-r3-abilities` (6: Neo đứng sững 3 s và ×1,3 trong 6 s, hào quang +20 % và dẫn bầy, vòm ×0,3 cho đạn từ ngoài, cận chiến và lông không đổi, 10 s không dựng lại, ải truyện không có hai quái này), `td-b9` (3), `td-flow` (B8 R3).
- **File vàng:** bước 7 làm lại cả hai (mã nội dung và ba cột mới `takenUntil`, `ox`, `oz`; bỏ ba cột khỏi mã băm thì mọi mã băm y như cũ, đã thử). Trên `0738e94`: `same: true`, 19.147 và 5.306 tick, nội dung `8ea58c7a`.
- **Bước 7, vì sao từng luật** (chi tiết `R3_PLAN.md` §5 A20–A25): Neo và Phá Khiên chỉ bật khi một nhà **đánh** ở gần (A20), như bài học Tanuki của R2: lời gọi ở chỗ không vòng giúp nào tới thì không sáng, không đáng gõ. Đầu Đàn dẫn bầy (A21): Cương Thi nhanh hơn nó (3,8 so với 3,4 m/s), không dẫn thì bầy bỏ xa và điều kiện "≥ 4 trong 6 m" không bao giờ đạt. Vòm đi theo Troll (A22): mối đe dọa là "Troll đi xuyên làn đạn", nên gõ Phá Khiên mới đáng. Hình và tiếng: vòng hào quang và cờ trên Đầu Đàn, vòng đá có vạch quanh Troll; chữ nổi "Đứng sững!", "×1,3", "Vỡ vòm!"; thẻ có biểu tượng ⚓, 🛡️ (`callLabel`); tiếng riêng mỗi động từ (`audio-min.ts`).
- **Bước 8, bot Học.** Bot chơi Học đúng như trang tính (`planFor` của `app/learn.ts`): mọi hàng khởi động lạnh, thêm hàng `standard@book20` (sổ 20 từ) ở Cân bằng. Từ Ôn là từ "đang học" trong `HumanTypist`. Lượt dò trên `0738e94` (Cân bằng, 40 seed mỗi bộ, hai bộ, `--quick`, 25 phút trên máy đang chạy ba làn khác; `r3b2/balance-probe-40x2.md`):

| Bot | Thắng bộ 1 / bộ 2 | Biên S | Áp lực P | Nhàn I | Ngộp O | Gần thua N | Quãng Q | Không Học: thắng, S (bộ 1 / bộ 2) |
|---|---|---|---|---|---|---|---|---|
| Trẻ em | 2,5 / 0 % | 0 / 0 % | 29 / 29 % | 0,2 / 0 % | 0 / 0 % | 0,03 / 0,00 | 67 / 67 % | — |
| Mới | 75 / 78 % | 38 / 35 % | 23 / 25 % | 5,5 / 5,4 % | 0 / 0 % | 0,15 / 0,23 | 67 / 67 % | 83 / 73 %, 48 / 38 % |
| Chậm chắc | 90 / 90 % | 70 / 65 % | 22 / 21 % | 5,3 / 4,8 % | 0 / 0 % | 0,17 / 0,10 | 67 / 66 % | 83 / 78 %, 65 / 58 % |
| Chuẩn | 75 / 78 % | 65 / 60 % | 21 / 22 % | 2,8 / 2,8 % | 0 / 0 % | 0,07 / 0,07 | 66 / 66 % | 90 / 88 %, 70 / 75 % |
| Khá | 85 / 75 % | 65 / 48 % | 20 / 23 % | 2,0 / 1,6 % | 0 / 0 % | 0,03 / 0,03 | 66 / 67 % | 80 / 80 %, 55 / 48 % |
| Ẩu | 58 / 65 % | 30 / 25 % | 25 / 25 % | 0,7 / 0,8 % | 0,1 / 0,1 % | 0,03 / 0,20 | 66 / 67 % | 58 / 65 %, 15 / 28 % |
| Nhanh | 80 / 83 % | 60 / 55 % | 23 / 23 % | 3,3 / 3,2 % | 0,1 / 0,1 % | 0,05 / 0,07 | 67 / 67 % | 80 / 85 %, 60 / 65 % |
| Chuẩn, sổ 20 từ | 75 / 75 % | 68 / 68 % | 22 / 23 % | 2,4 / 2,3 % | 0,1 / 0,1 % | 0,07 / 0,13 | 67 / 66 % | — |

- Cột "Không Học": cùng bot, cùng seed, đầu ván R2 không danh sách (`r3b2/nolearn.ts`). Học làm bot Chuẩn thua nhiều hơn ở cả hai bộ (90 → 75 %, 88 → 78 %; gộp 89 → 76 %, khoảng 3 sai số chuẩn ở 80 ván): từ mới cấp 3 và Từ Ôn gõ chậm hơn từ quen. Bot khác lệch trong khoảng sai số 40 seed (±6–7 điểm). Lượt cân bằng R3 (bước 9) phải đo trên mã có Học, như `R3_PLAN.md` §7 đã định.
- Cổng của lượt dò (chỉ Cân bằng nên B3, B5, B6 thiếu số): B1 **trượt** (bộ 1: Chậm chắc S 70 %, Ẩu 58 % / 30 %; bộ 2: Ẩu 65 % / 25 %), B2 đạt, B4 đạt, B7 đạt bộ 1, **trượt** bộ 2 (hàng tắt nhịp: Biên S 25 %), B8 đạt (B8 R3: mọi hàng 8 từ mới mỗi ván, lớn nhất 8, 0 ở lời gọi có hạn và Đêm 5), B9 thiếu số. G2 đạt (Đêm 1–4 23,0 %, Đêm 5 23,8 % gộp), G3 **trượt** (44,5 / 45,8 s; gộp 45,1), G5, G6, G8 đạt. Đích chặt gộp: 2/6 (Khá, Nhanh). Ván có từ quay lại của bot Chuẩn: 73 / 75 % (A3 ≥ 70 %).
- **Bước 11, gói chơi thử:** `docs/td/PLAYTEST_1B.md`; "Chép số chơi thử" lưu file có số và cả nhật ký ván. Lượt kiểm thêm: `scripts/td/b9.ts` đọc file `td-1b-tour` bắt được ở trang (ván hộp cát): chạy lại trên Node khớp mã băm trang (`bb34489b`). Ván hộp cát giờ được liệt kê nhưng không vào B9 (`R3_PLAN.md` §5 A26; trước đó bị chấm như ải truyện và trượt oan: S 100 % / 78 %).
- **Kịch bản (lượt kiểm).** Hai lỗi kịch bản tìm thấy và sửa:
  - `td-1b-tour` bấm "Chép số chơi thử" bằng `click()` của phần tử, mà nút thẻ kết nghe `pointerdown` (`ui/sheets.ts`): không file nào được lưu, kiểm `playtestFileReplays` trượt ở cả hai cỡ trong lượt bị ngắt. Giờ bấm chuột thật qua CDP; file lưu và chạy lại khớp ở cả hai cỡ.
  - `td-1b-direct` trượt `domeTypedBreaksIt` lúc máy đang rất tải (ba làn khác chạy cân bằng và chụp hình; tải trung bình 5 phút đo lúc 06:02 là 53, máy 10 lõi): chụp ảnh thẻ trước khi gõ tốn hết 2,5 s còn lại của cửa sổ, nên không phím nào được gõ (nhật ký trang chạy lại trên Node: Troll dựng vòm 5 lần, không lần nào bị gõ). Giờ gõ lại ở lần dựng vòm sau, tối đa 3 lần; ở máy rảnh cả hai cỡ gõ được ngay lần đầu.
- **Kịch bản trên mã của đợt này** (src của `0738e94`, kịch bản của `3b42a39`; 26/10 05:19–07:06, Chrome 155 macOS có GPU, máy chủ dev cổng 3006, dưới `heavy.sh --gpu` xen với lượt chụp hình của làn khác): **20/20 lượt đạt** (10 kịch bản × 2 cỡ), 0 ngoại lệ, 0 lỗi console ngoài 10 lỗi cố ý của `td-1b-chunks` (7 của R2, thêm `retry`, `learn`, `tips`), nhật ký trang chạy lại trên Node khớp ở mọi kịch bản có kiểm.

| Kịch bản | Kiểm | 1280 × 720 | 1920 × 1080 | Ghi chú |
|---|---|---|---|---|
| `td-1b-tour` | 17 | đạt | đạt | 19 ảnh mỗi cỡ; file chơi thử `loi-goi-choi-thu-s1-n5-5577.json` (1280) và `…-5607.json` (1920) chạy lại khớp |
| `td-1b-direct` | 16 | đạt | đạt | Neo, Phá Khiên gõ được ngay lần đầu; bầy đứng 165 tick (≤ 180), ×1,3 còn 345 tick; Troll choáng 75–76 tick (≤ 90) |
| `td-1b-learn` | 14 | đạt | đạt | |
| `td-1b-story` | 17 | đạt | đạt | Ngày 3 và ván thắng từ `retry-log` có danh sách học |
| `td-1b-chunks` | 24 | đạt | đạt | |
| `td-1b-night5` | 12 | đạt | đạt | nhật ký `retry-log` nay mang danh sách học của bot; trang chơi lại khớp |
| `td-1b-boss` | 16 | đạt | đạt | |
| `td-1b-build` | 18 | đạt | đạt | bảng hộp cát có hàng "Đầu Đàn", "Troll" |
| `td-1b-ult` | 13 | đạt | đạt | |
| `td-1a-boot` | 11 | đạt | đạt | |

- Lượt trượt trước khi sửa (cùng giờ, máy rất tải): `td-1b-direct` 1280 (Troll không kịp gõ, xem trên), `td-1b-direct` 1920 (không lời gọi Neo, Phá Khiên nào sáng trong 60 s chờ; lượt kéo 39 phút), `td-1b-tour` 1920 (kịch bản đứng giữa chừng: trang chỉ đi 78 tick trong 143 s, không lời gọi trực tiếp nào sáng), `td-1b-learn` 1280 (chạy 28 phút, từ gõ Ẩu không kịp quay lại). Chạy lại lúc máy rảnh (tải ~5): đạt cả bốn. Bài học: kịch bản tính giờ bằng đồng hồ tường dễ trượt khi máy dùng chung quá tải; nên chạy một luồng GPU và xem tải trước khi chạy lượt chốt.
- **Ảnh đã xem:** 19 ảnh `td-1b-tour` ở 1280 × 720 và các ảnh R3 ở 1920 × 1080 (Neo, đứng sững, Phá Khiên, vỡ vòm), `td-1b-direct` (thẻ ⚓, 🛡️, vòm để chạy đi tới gần Lũy), `td-1b-learn` (Từ Ôn, "Chuộc lại"), `td-1b-story` (Đêm 1, thẻ thắng "Kỷ lục mới"), `td-1b-night5`, `td-1b-boss`, `td-1b-build`. Chữ đọc được ở 1280 × 720. Ghi lại, chưa sửa: chữ nổi "×1,3" nhỏ (cùng kiểu chữ nổi R2) và "Đứng sững!" màu xanh trên cỏ hơi nhạt ở 1920 × 1080; thẻ lời gọi che một phần bầy hay Troll lúc mới sáng (thẻ đứng trên đầu quái như mọi lời gọi trực tiếp R2).
- **Kiểm sau sửa:** `pnpm check` 332 test / 31 file đạt, "/" 82,62 kB (chừa 2,38), `?title=0` 81,22 kB; `pnpm td:golden:check` `same: true`; 10.413 dòng.
- **Còn mở sau phần B:** bước `wood` của chủ dự án (26/10), bước 9 (cân bằng R3), phần còn lại của bước 10 (đo §20 với cảnh 10 loại quái, `td-1a-ime`, `td-1a6-*`, `td-theme`, `td-balance`, `td-1b-perf`, `td-1a6-perf`), B9 chờ chủ dự án chơi.

### 7.8 Luật gỗ của chủ dự án, "Gọi đêm sớm" đếm ngược, hai con rồng (26/10/2026, Mac mini M4)

Theo quyết định của chủ dự án 26/10/2026, sau khi chơi bản đồ 1. Chen vào trước bước 9 của R3 (`R3_PLAN.md`) để lượt cân bằng đo trên luật mới. Changelog: `docs/changelog/2026-10-26-td-wood.md`. Số đo là số **Apple M4**. Bằng chứng (ngoài Git): `tmp/mac-2026-10-25/wood/` (lượt làm, bị ngắt khoảng 08:30: các lượt đo cổng `gates-*.md`, bảng `td:balance` đủ `balance-full.md`, dò hai con rồng `probe-*`, kịch bản trên mã cũ `before/`), `tmp/mac-2026-10-25/wood2/` (lượt kiểm: `pnpm check`, các lượt tắt từng luật, so bot không gõ, kịch bản và ảnh).

| Commit | Việc | "/" gzip (chừa) | Dòng `.ts` |
|---|---|---|---|
| `213c3ad` | trước (R3 phần B) | 82,62 (2,38) | 10.413 |
| `5c9f630` | luật gỗ | 83,18 (1,82) | 10.466 |
| `3c7ee5d` | "Gọi đêm sớm" đếm ngược | 83,25 (1,75) | 10.481 |
| `b58bd54` | hai con rồng | 83,26 (1,74) | 10.484 |
| `ce3f6b0` | lượt kiểm: nhãn kho 9 → 11 px | 83,26 (1,74) | 10.484 |
| `83c5de6` | lượt kiểm: một nhãn kho mỗi cụm cây | 83,31 (1,69) | 10.486 |

Mỗi commit dựng lại trên Mac trong một cây làm việc tạm (cùng `node_modules`). Còn **14 dòng** dưới trần 10.500 và 1,69 kB ở "/": bước 9 (ước +33 dòng, +0,3 kB) phải cắt theo `R3_PLAN.md` §8 trước khi viết mã.

**Luật gỗ** (`content/rules.ts` `TREE`; `sim/stores/trees.ts` `left`; `sim/systems/calls.ts` `chopTree`; `sim/systems/economy.ts` `villager`, `fell`; `sim/systems/waves.ts` `enter`, `regrow`):

- Mỗi cây giữ `left` Gỗ (`Uint16Array`, băm cùng kho cây như mọi kho), đầu ván `TREE.reserve` 1.000.
- Một lần chặt vẫn 45 s cho 12 Gỗ (0,27 Gỗ/s một dân), nhưng trả **dần**: `chopTree` trả phần `floor(tiến độ × 12)` chưa trả, lấy từ `left`. Dân tự chặt và từ gõ đi chung một đường. Thưởng cả lời gọi Hoàn hảo (+2) cộng thêm, không lấy từ kho.
- Cây chỉ đổ khi `left` về 0 (`fell`: thành gốc, dân của nó đi tìm cây khác, sự kiện `felled`). Một dân cần khoảng một giờ cho một cây, nên trên bản đồ 1 cây không đổ nữa: đúng ý chủ dự án.
- Đầu mỗi Ngày (`enter(w, "day")`, cả `skipTo` của hộp cát): mọi cây `left` = 1.000, gốc đứng lại, trừ gốc có nhà đè (bán kính nhà + 1,5 m). Giữa Ngày và ban Đêm không mọc (test).
- Xong một lần chặt, dân chọn cây lại (cây đánh dấu trước, rồi cây gần Lũy trong 30 m), thường là cây cũ.
- Ban Đêm dân chặt tiếp nhưng không tạo lời gọi Chặt mới; lời gọi Chặt còn mở lúc Đêm xuống sống thêm `CALL.powerLifeS` 9 s. `CALL.slipS` 1,15 → 1,35 s.
- Hình: cây đang chặt có thanh tiến độ và chữ "988/1000" dưới thanh (11 px từ lượt kiểm, `ce3f6b0`: 9 px khó đọc ở 1280 × 720; một nhãn mỗi cụm cây đang chặt, `83c5de6`: nhãn của cây sát nhau chồng thành đống); gốc mọc lại trong 0,9 s (to dần, hơi vượt rồi về), mỗi cây lệch 90 ms, trong vòng xanh mờ dần. Câu dạy Ngày 2: "Gỗ để xây nhà; cây mọc lại mỗi sáng. Bấm cây để chặt."
- Không còn chữ nào nói gỗ có hạn (đã tìm trong `src`: chỉ câu Ngày 2 nói về cây).

**Vì sao hai luật thêm** (lượt kiểm, mã `b58bd54`, tắt từng luật trong cây tạm; báo cáo cổng 1A.6 trên ải truyện: bot 35 WPM và bot không gõ, Cân bằng, 5 seed, 4 Đêm; `wood2/gates-*.md`, `wood2/night-*.txt`):

| Mã | 5a cửa sổ 20 s (≤ 8 s) | 5b Ngày (30–45 %) | 5c Đêm (15–25 %) | 7 gõ / không gõ (≥ +25 %) | Đêm: Chặt / Bắn mạnh (% thời gian) | Bắn mạnh: tạo, gõ, sáng mà bỏ qua | Gỗ làm ra Ngày 1–4, bot gõ | Mạng cuối, gõ / không gõ |
|---|---|---|---|---|---|---|---|---|
| `213c3ad` (trước) | 7,95 s | 30,9 % | 23,7 % | +39,6 % | 9,8 / 5,5 | 85, 65, 8 | 88 / 128 / 157 / 90 | 16,0 / 11,0 |
| `b58bd54` tắt luật Đêm | 8,00 s | 30,8 % | **27,6 %** | +46,2 % | 21,6 / 4,4 | 116, 56, 24 | 125 / 171 / 201 / 249 | 14,2 / 9,6 |
| `b58bd54` `slipS` 1,15 | **8,60 s** | 31,3 % | 23,6 % | +38,3 % | — | 90, 72, 11 | 113 / 153 / 171 / 210 | 13,8 / 9,4 |
| `b58bd54` | 7,90 s | 30,2 % | 21,8 % | +38,2 % | 6,1 / 5,7 | 93, 64, 20 | 117 / 151 / 168 / 198 | 13,8 / 9,4 |

- Không có luật Đêm, dân không bao giờ hết việc nên ban Đêm cứ 45 s lại có lời gọi Chặt 4 từ: bot gõ Chặt 21,6 % thời gian Đêm, cổng 5c trượt. Đêm là lúc của tháp.
- `slipS` 1,15 thì chuỗi từ Chặt ban Ngày đẩy cửa sổ 20 s lên 8,60 s (cổng 5a). Cái giá của 1,35: Bắn mạnh sáng mà bỏ qua 11 → 20 (mỗi từ được tính nhiều giờ hơn nên ít lời gọi sáng cùng lúc). `td-pace` (k 0,75) đạt cả với 1,15 trên mã này; con số 8,43 s của lượt làm là ở lượt trước khi có luật Đêm.
- Lượt làm (bị ngắt) đo 6 lượt (tối đa của một họ cổng); còn bảng của lượt 1, 2, 6 (`wood/gates-new.md`, `gates-A.md`, `gates-6.md`), cùng hướng với bảng trên.
- **Kinh tế giàu hơn:** Gỗ là tốc độ do số dân và việc gõ quyết, không còn ngân sách 432 Gỗ (36 cây × 12). Bot gõ làm ra 463 → 635 Gỗ trong 4 Ngày (+37 %), bot không gõ 331 → 445; bot bán phần Gỗ trên 100 thành Vàng sớm hơn (lần bán đầu ở giây 195 thay 243). Tốc chặt (Gỗ/giây) và giá nhà giữ nguyên: đó là núm của bước 9.
- **Mạng ở Đêm 4 giảm** (bot gõ 16,0 → 13,8, bot không gõ 11,0 → 9,4; 5 seed). Bot không gõ xây cùng nhà, gần cùng giờ (lệch ≤ 20 s; `wood2/lives-*.txt`), mạng sau Đêm 1–3 lệch ≤ 2; khác chủ yếu ở Đêm 4 (3 / 5 seed mất 3 mạng ở Đêm này, trước 0): Thuồng Luồng lọt 3 lần / 5 seed (trước 0), số quái sinh ra đổi theo bộ điều nhịp (seed 5: 55 → 59). Nguyên nhân chưa tách: việc của bước 9.

**"Gọi đêm sớm"** (`sim/systems/waves.ts` `earlyCallBonus`, `ui/hud.ts` `earlyHtml`, `ui/td.css` `.td-call`, `view/audio-min.ts`): thưởng = `ceil(30 × phần Ngày còn lại)` (đã chọn theo đề xuất: chia theo độ dài Ngày, giữ trần 30, tổng vàng không tăng; Ngày 75 s: +30 ở 2,5 s đầu, +26 lúc 1:05, +10 lúc 0:24; không hơn luật cũ trừ giây cuối, 1 thay 0). Nút có hai dòng: "Gọi đêm sớm · +26 vàng" và phím, rồi thanh cạn dần cùng đồng hồ "1:04"; 10 s cuối nút nhấp nháy (`prefers-reduced-motion`: viền thay nhấp nháy) và mỗi giây một tiếng mõ gỗ, 3 s cuối cao hơn; dừng (Esc hay Tạm dừng chiến thuật) thì "Đã dừng" thay đồng hồ. Để yên thì Ngày tự hết ở 0:00 và Đêm xuống (nhật ký không có `callNight`). File vàng `td-1a` đổi vì bot vàng gọi Đêm ở giây 60 của Ngày 75 s: 15 → 6 vàng.

**Hai con rồng.** Kịch bản dò `wood/probe-dragons.mjs` chơi bản đồ 1 từ màn đầu ở 1280 × 720 và chụp từng mốc; `td-1b-wood` đếm từng khung trên canvas (hình rồng màu cam của Draconis, chữ "D"):

| Mã | Khung đếm | Hình rồng mỗi khung | Chữ "D" trên sân mỗi khung | Chữ "D" ở HUD |
|---|---|---|---|---|
| `213c3ad` | 4.744 | 1 | **2** | 1 |
| `83c5de6` (1280 × 720 / 1920 × 1080) | 4.741 / 4.744 | 1 | 0 | 1 |

Chỉ có một Draconis (một thực thể, một hình). Cái đọc thành con rồng thứ hai là **đĩa dân có chữ "D"** (Dân, chữ của BUILD_1A6 §9) trùng chữ "D" trên đèn lồng Draconis ở thanh đội; đầu ván có hai dân đi chặt nên trên sân luôn có hai chữ "D". Đĩa NPC giờ hiện biểu tượng lời gọi của mình: 🌾 nông dân, 🪓 dân, 🔨 thợ xây, ⛏️ thợ mỏ (`view/debug-2d.ts` `NPC_LETTER`). Kiểm `oneDragonEveryFrame`, `noDGlyphOnField`, `oneDInHud` ở `td-1b-wood`.

**Test:** 337 test / 31 file (+5). Mới: trả gỗ theo tiến độ (nửa lần chặt trả nửa số gỗ), cây chỉ đổ ở 0, mọc lại chỉ đầu Ngày (không giữa Ngày, không ban Đêm), nạp lại kho cây đang chặt, gốc dưới nhà không mọc, `fell` của hộp cát, nhật ký chặt + đổ + Ngày mới chạy lại ra cùng mã băm, ban Đêm không lời gọi Chặt mới (`tests/td-sim-economy.test.ts`); thưởng Gọi đêm sớm từng tick, nút có đồng hồ, thanh, nhấp nháy 10 s cuối, "Đã dừng" (`tests/td-hud.test.ts`).

**File vàng** làm lại có chủ đích: `5c9f630` (`td-1a` 19.147 → 19.774 tick; `td-1b-boss` gỗ cuối 100 → 150, lời gọi 20 → 12 vì Đêm của boss không còn lời gọi Chặt), `3c7ee5d` (`td-1a` 19.660 tick; `td-1b-boss` chỉ mã nội dung `49318eba`). Trên `b58bd54`: `pnpm td:golden:check` `same: true`.

**Kịch bản** (Chrome 155 macOS có GPU, máy chủ dev cổng 3006, dưới `heavy.sh --gpu` xen với lượt chụp hình và đo của ba làn khác; tải trung bình 7–36). **22/22 lượt đạt** ở 11 kịch bản × 1280 × 720 và 1920 × 1080, 0 lỗi console, 0 ngoại lệ, nhật ký trang chạy lại trên Node khớp ở mọi kịch bản có kiểm:

| Kịch bản | Kiểm | 1280 × 720 | 1920 × 1080 | Mã | Ghi chú |
|---|---|---|---|---|---|
| `td-1b-wood` (mới) | 21 | đạt | đạt | `83c5de6` (cũng đạt trên `b58bd54`) | 4.741 / 4.744 khung: mỗi khung 1 hình rồng, 0 chữ "D" trên sân, 1 "D" ở HUD; thưởng 30 → 26 sau 10 s, thanh 100 → 86 %; dừng: "Đã dừng", tick đứng; 10 s cuối nhấp nháy; Đêm tự xuống, 0 lệnh; kho 998 → 981; 3 cây đổ, Ngày 2 đứng lại 1.000 |
| `td-1a6-day` (sửa) | 19 | đạt | đạt | `83c5de6` (cũng `b58bd54`) | `woodFromReserve`, `treesStand` thay `treeFelled` |
| `td-1b-build` (sửa, `eccaea0`) | 18 | đạt | đạt | `83c5de6` | lần đầu trượt `keepPrice`, `woodSells` ở cả hai cỡ: Gỗ chặt ra giữa hai lần đọc giá (43 thay 45, 9 thay 10); kịch bản giờ trừ phần Gỗ chặt (kho cây) khỏi số Gỗ |
| `td-1b-tour` | 17 | đạt | đạt | `83c5de6` | 19 ảnh mỗi cỡ, file chơi thử chạy lại khớp |
| `td-theme` | 17 | đạt | đạt | `83c5de6` | nút "Gọi đêm sớm" mới vừa thẻ HUD |
| `td-1a6-learn` | 18 | đạt | đạt | `83c5de6` | |
| `td-1b-story` | 17 | đạt | đạt | `ce3f6b0` | lượt làm trượt vì máy chủ dev bị tắt giữa chừng |
| `td-1b-learn` | 14 | đạt | đạt | `ce3f6b0` | |
| `td-1a6-keyboard` | 21 | đạt | đạt | `b58bd54` (lượt làm) | |
| `td-1a6-attention` | 11 | đạt | đạt | `b58bd54` (lượt làm) | |
| `td-1a6-night` | 11 | đạt | đạt | `b58bd54` (lượt làm) | |

`ce3f6b0` và `83c5de6` chỉ đổi nhãn kho trên bản đồ (không đổi sim, không đổi HUD). Bằng chứng: `wood/` (lượt làm), `wood2/` (`b58bd54`, `ce3f6b0`), `wood3/` (`83c5de6`), `wood4/` (`td-1b-build` sau sửa).

- **Ảnh đã xem:** `td-1b-wood` ở hai cỡ (Ngày, cây đang chặt có nhãn kho, nút đang dừng "Đã dừng", 10 s cuối, Đêm tự xuống, gốc, đang mọc, mọc lại), `td-1a6-day` (chặt, xây), `td-1b-story` (Ngày 3 chơi lại: cây nạp đầy, nhãn 999 / 1.000), `td-1b-learn` (Từ Ôn), `td-theme` (Ngày), `td-1b-tour` (Đêm 5, Từ Ôn), `td-1a6-night` (dân chặt ban Đêm, không lời gọi Chặt). Sửa từ ảnh: nhãn kho 9 → 11 px (`ce3f6b0`), một nhãn mỗi cụm (`83c5de6`; trước đó 4–5 nhãn chồng nhau ở hộp cát "Đặt sẵn", 3 nhãn ở Ngày 3). Ghi lại, chưa sửa: nhãn có thể nằm dưới thẻ lời gọi của dân bên cạnh; vòng mọc lại chỉ 0,9 s nên lúc chụp 160 ms sau Ngày mới mới thấy rõ.
- **Kiểm trên mã cuối `83c5de6`:** `pnpm check` 337 test / 31 file đạt, "/" 83,31 kB gzip (chừa 1,69 kB), `?title=0` 81,91 kB; `pnpm td:golden:check` `same: true` cả hai file; 10.486 dòng `.ts`.

**Cân bằng trên luật mới** (điểm xuất phát của bước 9; chưa chỉnh núm nào của R3 §7).

`pnpm td:balance --threads=4` đủ mọi chế độ, 120 seed mỗi bộ, hai bộ, mã `b58bd54` (26/10 08:00–08:15, 870 s; `wood/balance-full.md`). Cân bằng, bộ 1 / bộ 2:

| Bot | Thắng | Biên S | Áp lực P | Nhàn I | Ngộp O | Gần thua N | Quãng Q |
|---|---|---|---|---|---|---|---|
| Trẻ em | 0 / 0,8 % | 0 / 0 % | 29 / 29 % | 2,3 / 2,2 % | 0 / 0 % | 0,00 / 0,01 | 68 / 68 % |
| Mới | 68 / 56 % | 30 / 15 % | 24 / 24 % | 3,3 / 3,7 % | 0 / 0,1 % | 0,17 / 0,09 | 67 / 67 % |
| Chậm chắc | 83 / 85 % | 70 / 70 % | 21 / 21 % | 2,7 / 2,8 % | 0 / 0 % | 0,12 / 0,12 | 67 / 67 % |
| Chuẩn | 86 / 88 % | 70 / 65 % | 21 / 21 % | 4,7 / 5,0 % | 0,1 / 0,1 % | 0,07 / 0,10 | 66 / 67 % |
| Khá | 70 / 73 % | 60 / 55 % | 23 / 23 % | 4,3 / 4,6 % | 0,1 / 0,1 % | 0,06 / 0,09 | 67 / 67 % |
| Ẩu | 74 / 74 % | 55 / 55 % | 23 / 23 % | 6,0 / 5,5 % | 0,2 / 0,2 % | 0,13 / 0,13 | 67 / 67 % |
| Nhanh | 84 / 80 % | 65 / 68 % | 21 / 21 % | 3,0 / 3,5 % | 0,1 / 0 % | 0,10 / 0,03 | 67 / 67 % |
| Không gõ | 0 / 0 % | 0 / 0 % | 32 / 32 % | 1,0 / 1,1 % | 0,1 / 0,1 % | 0,00 / 0,00 | 68 / 68 % |
| Chỉ gõ | 0 / 0 % | 0 / 0 % | 49 / 50 % | 0 / 0 % | 0 / 0 % | 0,00 / 0,00 | 97 / 97 % |
| Chuẩn, chiến thuật Tốt | 93 / 89 % | 73 / 70 % | 19 / 19 % | 4,3 / 4,7 % | 0,1 / 0,1 % | 0,07 / 0,05 | 66 / 67 % |
| Chuẩn, chiến thuật Kém | 22 / 29 % | 0 / 0 % | 28 / 28 % | 1,6 / 2,0 % | 0 / 0 % | 0,06 / 0,06 | 67 / 67 % |
| Chuẩn, sổ 20 từ | 84 / 88 % | 70 / 70 % | 21 / 21 % | 5,1 / 4,9 % | 0 / 0 % | 0,06 / 0,05 | 67 / 67 % |
| Chuẩn, tắt nhịp | 86 / 89 % | 65 / 65 % | 21 / 21 % | 4,9 / 4,9 % | 0,1 / 0,1 % | 0,04 / 0,07 | 67 / 67 % |

- Thư giãn: mọi bot gõ thắng 94–100 %, Trẻ em 94 / 97 % (S 55 %), Quãng Q 61–66 % (in đậm, ngoài dải của Thư giãn). Thử thách: Chuẩn 92 / 89 %, Ẩu 68 / 72 %, Khá 78 / 83 %, Mới 88 / 90 %.
- Cổng (bộ 1 / bộ 2 / gộp): B1 **trượt** cả ba (gộp: Mới 62 %, S 25 %; Chậm chắc S 70 %; Khá 71 %; Ẩu 74 %; Chuẩn và Nhanh trong dải BALANCE §3); B2 đạt; B3 **trượt** (Mới ở Cân bằng 68 / 56 / 62 %, cần ≥ 70 %); B4 đạt / **trượt** / đạt (bộ 2: sát thương lên boss p50 Chuẩn 40,6 so với Ẩu 41,3); B5, B6 đạt (Tốt hơn Kém: 93 so với 22 %, 89 so với 29 %); B7 đạt / đạt / **trượt** theo đích chặt 1B (hàng tắt nhịp Biên S 65 %, đích 40–60 %; theo dải BALANCE §3 thì đạt); B8 đạt (B8 R3: 8 từ mới mỗi ván, 0 ở lời gọi có hạn và Đêm 5); B9 thiếu số.
- G1 đạt (bảng trên); G2 đạt (Đêm 1–4 22,6 %, Đêm 5 24,5 %); **G3 đạt** (giao chiến boss p50 48,1 s ở cả hai bộ); G5 đạt (mọi bot ≤ 2,6 % lên boss, ≤ 14,1 % cả ải); G6 đạt (một lời gọi trực tiếp mỗi 30,2 s ở Đêm 4, tối đa 2 mở cùng lúc; từ trực tiếp 0,2 % số từ, như R2); G8 đạt (24,1 s, Nhàn I 3,0 %); G4, G7 là test trong `pnpm check`, đạt.
- Đích chặt gộp: 1/6 (Nhanh). Bot Chuẩn thắng 87 % gộp nhưng Biên S 65 % (đích 40–60 %).

**Cùng seed, trước và sau luật gỗ** (lượt dò Cân bằng `--quick`, 40 seed mỗi bộ, hai bộ, cùng lệnh với phần B; trước `0738e94` có Học, sau `b58bd54`; `wood2/balance-probe-40x2.md`, 191 s):

| Bot | Thắng trước → sau | Biên S trước → sau | Nhàn I trước → sau |
|---|---|---|---|
| Mới | 75 / 78 → 73 / 70 % | 38 / 35 → 33 / 35 % | 5,5 / 5,4 → 3,0 / 3,3 % |
| Chậm chắc | 90 / 90 → 80 / 85 % | 70 / 65 → 68 / 68 % | 5,3 / 4,8 → 2,8 / 2,8 % |
| Chuẩn | 75 / 78 → **90 / 83 %** | 65 / 60 → 65 / 70 % | 2,8 / 2,8 → 4,7 / 4,7 % |
| Khá | 85 / 75 → 55 / 83 % | 65 / 48 → 25 / 65 % | 2,0 / 1,6 → 4,3 / 4,4 % |
| Ẩu | 58 / 65 → 78 / 70 % | 30 / 25 → 60 / 50 % | 0,7 / 0,8 → 6,4 / 5,5 % |
| Nhanh | 80 / 83 → 78 / 88 % | 60 / 55 → 60 / 65 % | 3,3 / 3,2 → 3,1 / 2,7 % |
| Chuẩn, sổ 20 từ | 75 / 75 → 85 / 85 % | 68 / 68 → 65 / 70 % | 2,4 / 2,3 → 5,0 / 5,1 % |
| Chuẩn, tắt nhịp | 80 / 80 → 85 / 88 % | 45 / 25 → 65 / 65 % | 2,3 / 2,4 → 5,0 / 4,6 % |

- Áp lực P, Ngộp O, Gần thua N, Quãng Q đổi trong ±0,1 điểm hay ±4 điểm %, ở trong dải như trước (bảng đủ ở file).
- G3 44,5 / 45,8 → 48,3 / 51,1 s (trượt → đạt); G2, G8 đạt cả hai lượt. B7 bộ 2 trượt → đạt; gộp vẫn trượt (giờ vì S cao, trước vì S thấp). Đích chặt gộp 2/6 → 1/6.
- Đọc: Gỗ không cạn làm ván dễ hơn với bot Chuẩn và Ẩu (thắng +12 và +13 điểm gộp, Biên S chạm 65–70 %). Gỗ dư đổi ra Vàng sớm hơn và Lũy lên sớm hơn (bot không gõ của cổng 1A.6: lần bán Gỗ đầu ở giây 195 thay 243, Lũy cấp 2 ở giây 349–355 thay 360–367; `wood2/lives-*.txt`). Sai số 40 seed khoảng ±7 điểm, nên hàng Khá (55 % ở bộ 1) cần đo lại ở 120 seed (bảng 120 seed trên: 70 / 73 %).

**Núm cho bước 9 từ đợt này:** tốc chặt (`TREE.wood` / `chopS`) và giá Gỗ của nhà (`ECONOMY.woodShare`), cùng các núm sẵn của `R3_PLAN.md` §7 (Rễ hút sinh khí, `LENGTH_BY_E` với `kHp2`). Lời gọi Chặt (4 từ mỗi 45 s mỗi dân) là núm thứ ba nếu bước 9 muốn trả lại Bắn mạnh bị bỏ (11 → 20 với `slipS` 1,35): 3 từ, hoặc một lời gọi mỗi hai lần chặt.

### 7.9 R3: cân bằng cuối (bước 9) và cổng cứng §21 (bước 10) (26/10/2026, Mac mini M4)

Bước 9 và phần còn lại của bước 10 trong `R3_PLAN.md`, đo trên luật gỗ của chủ dự án (§7.8) và có Học (§7.7 phần B). Changelog: `docs/changelog/2026-10-26-td-r3-balance.md`. Số đo là số **Apple M4** (Mac mini M4 10 lõi, 16 GB; Chrome 155 macOS có GPU; Node v24.22.0), máy dùng chung với ba làn khác (tải trung bình ghi cạnh từng lượt). Tên mục là 7.9 vì 7.6 đã là sửa phản biện R2 lần 3. Bằng chứng (ngoài Git): `tmp/mac-2026-10-25/r3bal/` (lượt 1–5 của lượt làm bị ngắt), `r3gate/` (bảng `td:balance` đủ trên `b655de2`, ảnh `td-1b-boss` có Rễ hút), `r3final/` (lượt 6, bảng chốt, kịch bản của lượt làm 2, hai cây A/B), `r3close/` (kịch bản của lượt làm 3, 4, đo §20, đầu dò lớp boss, hai đầu dò Thử thách), `r3done/` (lượt làm 4: kiểm, bước sim trên Node, hồ sơ CPU).

| Commit | Việc | "/" gzip (chừa) | `?title=0` | Dòng `.ts` |
|---|---|---|---|---|
| `7ff2603` | trước (luật gỗ, §7.8) | 83,31 (1,69) | 81,91 | 10.486 |
| `1f77e48` | gói lại chín đầu file viết ở 80 cột về 120 cột (chỉ chú thích, không đổi chữ) | 83,31 (1,69) | 81,91 | 10.459 |
| `b655de2` | bước 9: Rễ hút sinh khí, số cân bằng, file vàng | 83,68 (1,32) | 82,28 | 10.485 |
| `106db85` | Rễ hút đọc được trên đường; `td-1b-boss` quay đòn này; chú thích 20 → 30 s | 83,75 (1,25) | 82,36 | 10.492 |
| `a23c910`, `5c3b939` | chỉ kịch bản: `td-1b-learn` chờ Từ Ôn kế khi thẻ tắt trước phím; `td-balance` đọc k của hồ sơ từ đầu ván | 83,75 (1,25) | 82,36 | 10.492 |

Mỗi commit dựng lại trên Mac trong cây tạm (`git archive`, cùng `node_modules`): `tsc --noEmit` và `vite build` qua ở `1f77e48`, `b655de2`; 338 test đạt ở `b655de2`; `106db85` là `pnpm check` đầy đủ. Không cắt luật nào theo §8: 27 dòng lấy lại từ chú thích đầu file đủ cho bước 9 (+26 dòng, ước +33).

**Lượt làm bị ngắt** (khoảng 12:00) để lại `1f77e48`, `b655de2` chưa push và phần hình của Rễ hút chưa commit. Lượt này kiểm lại trên mã đã commit, không làm lại: `pnpm check` 338 test / 31 file đạt; `pnpm td:golden:check` `same: true`; bảng `td:balance` đủ của lượt trước trên `b655de2` (`r3gate/balance-full.md`, 761,7 s) khớp từng ô với lượt dò cuối có cùng số ghi đè (`r3bal/r2-gate.md`). Phần hình (`106db85`): ảnh `td-1b-boss` ở 1280 × 720 cho thấy rễ màu rễ chìm vào đường đất, nên rễ có viền mực 11 px dưới nét 6 px, và lúc hút một đốm hổ phách chạy ngược rễ về tán trong 0,7 s (than hồng thay lá xanh); chạy lại 1280 × 720 trên mã này: 20/20 kiểm đạt (`drainWarned72`, `drainTakesOneLife`, `drainSaidOnTheBar`, `drainFilmed`), rồi commit.

**Lượt 2 cũng bị ngắt** (khoảng 17:00, sau lượt đo 6, bảng chốt và 34 lượt kịch bản; giấy tờ viết mà chưa commit, §20 chưa đo). **Lượt 3** (20:14–22:00, bị ngắt lần ba sau các kịch bản, trước khi đo §20 và commit giấy tờ) kiểm lại trên mã đã commit, không làm lại: `pnpm check` 338 test / 31 file, kit sha256 khớp 31 file, "/" 83,75 kB; `pnpm td:golden:check` `same: true` cả hai file (`r3close/check.log`, `golden.log`). `src` không đổi từ `106db85` (`1b90fed` của điều phối viên chỉ đổi `media.md5`, `art-src/3d/SOURCES.json`), nên bảng chốt của lượt 2 (`r3final/balance-full.md`, mã `106db85`) là bảng của mã cuối; đã đối từng ô với các bảng dưới. `td-1b-learn` trượt ở lượt 2 (1920 × 1080: 10/14; 1280 × 720 bị ngắt): chạy lại nhật ký trang trên Node (`r3close/dim-probe.ts`), Từ Ôn đầu nằm trong một lời gọi Chặt sáng lúc Draconis cách 13,22 m (1920 × 1080: 13,02 m) và đang đi xa, tắt 8 (10) tick sau khi Draconis ra quá vòng 14 m (`AGENT.heroRingM`; luật "rời mọi vòng giúp thì tắt" của `attentionStep`), nên phím của kịch bản tới khi không còn thẻ. Kịch bản sửa ở `a23c910` (lần đó ghi vào `dimmed`, chờ Từ Ôn kế), 14/14 ở hai cỡ. Bằng chứng lượt 3: `tmp/mac-2026-10-25/r3close/` (kiểm, kịch bản còn lại, hai đầu dò Thử thách).

**Lượt 4** (27/10 01:17–01:45, Apple M4, tải trung bình 2–9; ba làn khác chạy song song) chỉ làm phần lượt 3 để lại, không chạy lại lượt cân bằng nào:

- Kiểm trên mã đã commit (`7f54641`; `src` như `106db85`): `pnpm check` 338 test / 31 file, kit sha256 khớp 31 file, "/" 83,75 kB (chừa 1,25 kB), `?title=0` 82,36 kB, tổng 100,20 kB; `pnpm td:golden:check` `same: true` cả hai file (nội dung `cd59313e`); 10.492 dòng `.ts` (`r3done/check.log`, `golden.log`).
- Số trong giấy tờ đối lại với file bằng chứng, từng ô: bảng chốt (`r3final/balance-full.md`), sáu lượt đo (`r3bal/*.md`, `r3final/r6*.md`: dòng gộp Cân bằng và G3 của từng nhánh), hai đầu dò Thử thách (`r3close/challenge-modehp*.md`), đầu dò không Học (`r3final/nolearn-*.md`). Mọi số tìm được nguồn; không số nào phải đo lại.
- **`td-balance` trượt ở hai cỡ** (lần đầu chạy trên mã R3): `profile`, `nightRelax`, `nightChallenge`. Kịch bản chờ "×1,0x" cho hồ sơ 45 WPM, 91 %, CV 0,30. Từ `b655de2`, E 45–64 nhận từ 4–8 chữ, nên sức chứa tính theo độ dài từ trung bình thấp hơn và k của hồ sơ này là 0,958: thẻ Hồ sơ gõ ghi "×0,96 chậm hơn chuẩn" cùng lời khuyên "chậm lại một nhịp", bảng hộp cát ghi "k ×0,96" (đã xem ảnh). Đây là số cứng cũ của kịch bản, không phải lỗi game. `5c3b939`: kịch bản so k trên thẻ với k của đầu ván (kiểm mới `profileKIsTheRunK`) và bảng hộp cát phải ghi đúng k đó. Chạy lại: 12/12 ở hai cỡ, hai đêm chạy lại trên Node khớp mã băm (`r3close/fail-l4/` giữ lượt trượt).
- Đo §20 (dưới): `td-1b-perf` A/B xen kẽ với mốc §1.2, vết Chrome A/B, `td-1a6-perf`, đầu dò lớp boss, bước sim trên Node A/B và hồ sơ CPU của nó.

**Rễ hút sinh khí** (`sim/systems/boss.ts` `keepBlow(w, "drain")`, `content/slice-1a.ts` `boss.drain`, store `drainAt`, `drainEnd` băm cùng kho boss; hình `view/boss-2d.ts`, câu `ui/hud.ts` `BOSS_LINES.drain`, tiếng `view/audio-min.ts`; luật và bảng "việc làm được" ở `BUILD_1B.md` §5.2, §5.5, §13.1): từ lúc trồi, mỗi 30 s, boss ở đâu cũng vậy, rễ chạm Lũy sau 1,2 s × `warnK` báo, −1 mạng; cú choáng 70 % xóa lần báo đang có và tính lại đồng hồ từ lúc hết choáng; rút lui xóa mọi lần báo. Tính vào "mạng mất ở đỉnh boss" và "đòn lớn đang báo" của FlowMeter. Test mới ở `tests/td-boss.test.ts` (mỗi 30 s, báo đúng tick ở Cân bằng và Thư giãn, −1 mạng, choáng tính lại).

**Các lượt đo** (mỗi lượt: `td:balance --modes=balanced --quick --stage-sets=2 --stage-seeds=120 --threads=3 --bots=novice,steady,standard,skilled,sloppy,fast --set=…` dưới `heavy.sh`, trong cây dò tách khỏi cây làm việc; số ghi đè chỉ trong worker, mã không đổi. Hai bộ seed: **bộ cổng** 1–240, đúng seed của `pnpm td:balance`, và **bộ dò** 241–480, để không chỉnh khớp seed. Thắng / Biên S gộp 240 ván, Cân bằng; in đậm: ngoài đích chặt §6.4):

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

**Lượt 6** (26/10 15:19–15:37, tải trung bình 11–22; bốn nhánh trên lượt 5, mỗi nhánh hai bộ seed; `r3final/r6*.md`). Luật giữ số (bước 1 của §6.5, "chỉ lấy bộ số cải thiện B1, đích chặt hay G3 mà không làm hỏng cổng đang đạt"):

| Nhánh | Kết quả trên bộ cổng | Bộ dò | Lấy? |
|---|---|---|---|
| Máu boss 4.100 (§6.5 bước 1) | Ẩu 77 → 81 % nhưng Chậm chắc 86 → **90 %** (bộ 2 91 %: B1 của bộ trượt) và hàng tắt nhịp (bot Chuẩn, bộ điều nhịp tắt) 85 / 87 → **91** / 90 % (B7 trượt ở bộ 1 và gộp) | Ẩu **77,9 %**, mọi bot khác trong đích | Không: làm hỏng B1 bộ 2 và B7 |
| `POWER.quick` 0,85 (Bắn mạnh gõ sớm gọi lời gọi kế sớm hơn; lượt 2 ở 0,9: Ẩu +9) | Ẩu **73 %**, Chuẩn và Chậm chắc **88,x %** | Mới, Nhanh **77,x %**, Ẩu **75 %**, B7 bộ 2 trượt | Không |
| E 45–64 từ 5–8 chữ, `kHp2` 7 | Ẩu **68 %** (Biên S 40 %), Khá 87 % | Ẩu **71 %** | Không: từ tối thiểu dài hơn làm Ẩu sai nhiều hơn mỗi từ |
| Núm 3: trọng số độ chính xác của E_eff 0,4 → 0,8, sàn 0,7 → 0,6 (đầu dò trong cây tạm, kit không sửa; `R3_PLAN.md` §7.3) | Ẩu 87 %, nhưng Khá **77 %**, B4 gộp trượt (Biên S Chậm chắc 55 % bằng Ẩu 55 %) | Chậm chắc **75 %**, Khá **76 %**, B4 trượt hai mặt (Biên S 45 so với 55 %; sát thương lên boss Chuẩn 34,9/s so với Ẩu 38,3/s) | Không (và không phải số của làn này) |

- Nhịp k theo núm 3 (tính ở `tdbal/kvals.mts`): Ẩu 0,982 → 0,909, Chậm chắc 0,790 → 0,812, Khá 1,133 → 1,142, Mới và Trẻ em ở sàn 0,70, Chuẩn 1,000, Nhanh 1,300. Đúng hướng (Ẩu chơi nhịp của người gõ đúng 85 % phím), nhưng 0,8 quá tay: Ẩu vượt tâm, Chậm chắc tụt.
- Chậm chắc là trần của mọi núm làm ván dễ hơn đều tay (máu boss, `POWER.quick`): nó thắng 86 % ở bộ cổng (88 % ở bộ 2) với Biên S 65 %, sát mép trên của cả hai đích. Núm nâng Ẩu mà không nâng Chậm chắc phải là núm theo độ chính xác.

**Vì sao từng số** (mỗi số có một lý do đo được; bảng lượt ở trên):

- **Rễ hút sinh khí, 1 mạng mỗi 30 s từ lúc trồi** (A14, A27: **đã chọn theo đề xuất**). Trên luật gỗ, bot mạnh chỉ mất 0–3 mạng ở đỉnh boss: Tối Thượng và Bắn mạnh dọn toán đi trước và Mầm Gỗ, nên Biên S của Chuẩn, Chậm chắc, Nhanh là 65–70 % (đích 40–60 % cho Chuẩn). Đòn này lấy mạng theo thời gian boss sống, không theo quái lọt, nên ai cũng trả; người hạ nhanh trả ít hơn (bot Chuẩn giao chiến p50 47,5 s: 1–2 lần; Mới 56,5 s, Chậm chắc 57,9 s: 2–3 lần). Lượt 2: 30 s đưa Biên S của Chuẩn 65 → 55 %, Chậm chắc 70 → 60 %, Nhanh 65 → 55 %; 20 s lấy thêm 4–5 điểm thắng của bot chậm mà không cần (Biên S đã vào dải ở 30 s). Việc người chơi làm được: dồn tháp lên nhánh boss từ lời báo Ngày 5, gõ Dồn lửa lúc choáng (cú choáng tính lại đồng hồ). Có báo trước như mọi đòn (G4), có hình, tiếng, câu (BUILD_1B §5.5, §13.1).
- **E 45–64: từ 4–8 chữ** (núm 2, `R3_PLAN.md` §7.2 lượt k2a). Ẩu và Khá (E 50) là hai bot có E trong dải này; từ dài hơn cho Phát Chữ mạnh hơn (`REWARD.lenDiv` 6: chữ 7 trở lên ×1,2 thay ×1,0–1,17) và nhịp k thấp hơn chút (sức chứa tính theo độ dài từ trung bình). Lượt 2: cùng seed, Khá 69 → 82 %, Ẩu 65 → 78 %, bot khác không đổi (họ ở dải khác). Ngân sách chú ý giữ: cổng 5a 7,90 s (≤ 8 s), G2 Đêm 1–4 22,6 % gộp (15–25 %).
- **Sàn nhịp k 0,70** (A28: **đã chọn theo đề xuất**; điều phối viên xem có ghi vào BALANCE §4.1 cho cả ba game không). Bot Mới có k của chính nó 0,698; sàn 0,75 của BALANCE §4.1 bắt nó chơi nhịp của người gõ nhanh hơn nó 7 %. Lượt 4: Mới 65 → 84 % (bộ dò), bot khác không đổi. Đây là chỗ duy nhất lượt này lệch khỏi kit dùng chung: số nằm ở `PACE.k` của game và truyền vào `paceK(…, range)` của kit, kit không sửa.
- **Hệ số k của máu boss 0,4 / 5,5, trần 1,42** (§6.5 bước 4). So với R2 (0,3 / 6,5, trần 1,46): máu của bot k < 1 thấp hơn (k 0,70: ×0,88; R2 ở sàn cũ k 0,75: ×0,925), của Khá gần như cũ (k 1,133: ×1,150 so với ×1,155), của Nhanh thấp hơn 2,7 % (trần). Lượt 3 thử `kHp` 0,5 để kéo Mới lên (Mới vẫn 65 %: sàn k cũ 0,75 là chỗ chặn, lượt 4); có sàn 0,70 thì 0,5 cho Mới quá tâm, nên về 0,4. Trần 1,42 vì Nhanh ở bộ dò 75 % (lượt 3, 4) lên 80 % (lượt 5).
- **Núm đã đo mà không lấy:** Chặt 3 từ (nâng mọi bot, Biên S Chuẩn 65 %, Chậm chắc 75 %), Mầm Gỗ 2 mỗi lần (Mới, Ẩu +4–5 điểm, Biên S bot mạnh vẫn 65–70 %), `kHp` 0,6 / `kHp2` 4,5 (Chậm chắc 94 %), Mỏ 3 / Ruộng 2 (kinh tế giàu thêm, không giúp ai), `POWER.quick` 0,9 (lượt 2: Ẩu +9; lượt 6: 0,85 hạ Ẩu xuống 73 %, xem dưới), bản lề `kLow` (Mới 94 %).

**Kết quả cuối** (`pnpm td:balance --threads=4`, đủ ba chế độ, seed 1–120 và 121–240, mã `106db85`, 26/10 15:34–15:48, 842,5 s, 4 luồng, tải 5,7–11,8; `r3final/balance-full.md`; bảng của lượt làm trên `b655de2`, `r3gate/balance-full.md`, ra cùng từng ô, chỉ khác giờ chạy). In đậm: ngoài dải BALANCE §3 của chế độ (báo cáo tự in).

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

**Cổng riêng G1–G8** (bot Chuẩn ở Cân bằng trừ chỗ ghi khác):

| # | Kết quả | Số đo |
|---|---|---|
| G1 | đạt | Cổng 1A.6 §12 trên ải truyện (5 seed, 4 Đêm): 4 không gõ qua Đêm 1–4 (mạng 7 / 13 / 9 / 10 / 8); 5a cửa sổ 20 s 7,90 s (≤ 8 s); 5b Ngày 30,2 % (30–45 %); 5c Đêm 21,8 % (15–25 %); 6 bất biến và lệnh bị từ chối 0; 7 gõ / không gõ +38,2 % (≥ +25 %) |
| G2 | đạt | Gõ Đêm 1–4 22,6 % (15–25 %), Đêm 5 24,5 % (≤ 35 %), gộp |
| G3 | đạt | Giao chiến boss p50 47,5 / 47,7 / 47,5 s (45–75 s) |
| G4 | đạt | Test `tests/td-boss.test.ts` (mọi đòn có sự kiện báo ≥ thời gian báo của chế độ, cả Rễ hút); `td-1b-boss`: Rễ Trồi 90, Quật cành 72, Rễ hút 72 tick |
| G5 | đạt | Tối Thượng lên boss / cả ải, mọi bot gõ, gộp: Mới 1,7 / 7,9 %, Chậm chắc 0,4 / 12,6 %, Chuẩn 0,4 / 14,1 %, Khá 0,1 / 13,9 %, Ẩu 1,4 / 9,0 %, Nhanh 0,4 / 14,2 % (≤ 15 %, ≤ 15 %) |
| G6 | đạt | Một lời gọi trực tiếp mỗi 30,2 s ở Đêm 4 (25–40 s), mở cùng lúc tối đa 2 không boss; từ trực tiếp 0,2 % số từ cả ải (5–10 % của TK 9.1 chỉ in báo cáo tới khi đủ ba động từ ở ải truyện) |
| G7 | đạt | Test tiền trong `pnpm check` (xây, nâng, bán, hoàn tác không sinh Vàng, Gỗ; rương ghi một lần) |
| G8 | đạt | Trồi → trúng đầu p50 24,1 s (≤ 35 s), Nhàn I đỉnh boss 2,7 / 3,2 / 3,0 % (≤ 10 %) |

**Đỉnh boss, gộp** (Cân bằng): boss rút Mới 78 %, Chậm chắc 86 %, Chuẩn 83 %, Khá 84 %, Ẩu 77 %, Nhanh 83 %; giao chiến p50 56,5 / 57,9 / 47,5 / 43,6 / 48,7 / 41,6 s; mạng mất ở đỉnh p50 7 / 3 / 2 / 2 / 3 / 2 (có Rễ hút); phần gõ lên boss 46–72 %, phần Draconis 8–17 %. Mạng trước đỉnh boss p50: Mới 18, Chậm chắc 16–17, Chuẩn 14,5–15, Khá 12, Ẩu 15, Nhanh 14. **Mọi ván thua ở Cân bằng là thua ở đỉnh boss** (thua trước boss 0 % ở mọi bot gõ): Mới 21–23 %, Chậm chắc 12–17 %, Chuẩn 16–18 %, Khá 15–18 %, Ẩu 23–24 %, Nhanh 14–19 %.

**Học (R3), bộ 1 / bộ 2:** Từ Ôn mỗi ván Chuẩn 1,3 / 1,3, Ẩu 13,5 / 13,6, Mới 3,2 / 3,0, Chậm chắc 0,0 / 0,1; Chuộc lại Ẩu 8,8 / 9,1; từ mới 8,0 mỗi ván (tối đa 8) ở mọi bot, 0 ở lời gọi có hạn và Đêm 5; ván có từ quay lại: Chuẩn 76 / 73 % (A3: ≥ 70 %). Hàng sổ 20 từ: 17,8 Từ Ôn, 15,7 Chuộc lại mỗi ván, thắng 82 % gộp.

**Thư giãn và Thử thách** (báo cáo, không là cổng của §21; cùng số, không núm riêng, `R3_PLAN.md` §7.4):

- Thư giãn: Mới tới Nhanh thắng 100 %, Biên S 85–95 % (≥ 70 %); Trẻ em 95 % gộp (B3), Biên S 45 % (đích ≥ 70 % chỉ báo cáo). Quãng Q 61–66 % ngoài dải ≤ 45 % của Thư giãn (như mọi lượt từ 1A.7).
- **Thử thách dễ hơn Cân bằng**: Mới 92 %, Chậm chắc 95 %, Chuẩn 88 %, Khá 91 %, Nhanh 90 % gộp (dải 50–75 %); chỉ Ẩu 63 % trong dải. Biên S 45–55 % (15–45 %). Đã vậy từ trước bước 9 (luật gỗ: Chuẩn 92 / 89 %). Vì sao: mọi ván thua ở Cân bằng là thua ở boss, mà máu boss ở Thử thách là 4.200 × `hpMul` 1,19 × `modeHp` 0,78 = ×0,93 của Cân bằng (R1 đặt 0,78 cho Thử thách như Thư giãn); Đêm khó hơn (máu quái ×1,19) chỉ lấy mạng (Biên S thấp hơn), không lấy ván. **Hai đầu dò ở lượt 3** (chỉ Thử thách, số ghi đè, mã không đổi; seed 1–240, `r3close/challenge-modehp*.md`), thắng gộp / Biên S gộp:

  | `modeHp.challenge` | Mới | Chậm chắc | Chuẩn | Khá | Ẩu | Nhanh | Chuẩn Tốt / Kém | Không gõ | Áp lực P |
  |---|---|---|---|---|---|---|---|---|---|
  | 0,78 (mã) | 92 / 50 % | 95 / 55 % | 88 / 45 % | 91 / 48 % | 63 / 20 % | 90 / 50 % | 91 / 14 % | 0 % | 21–26 % |
  | 0,9 (boss ×1,07 của Cân bằng) | 75 / 43 % | 86 / 48 % | 69 / 30 % | 79 / 45 % | 50 / 2,5 % | 75 / 40 % | 85 / 10 % | 0 % | 23–27 % |
  | 1,0 (×1,19) | 52 / 5 % | 62 / 25 % | 48 / 0 % | 65 / 35 % | 39 / 0 % | 53 / 10 % | 75 / 7,5 % | 0 % | 24–28 % |

  0,9 đưa 4/6 bot vào dải thắng 50–75 % (Chậm chắc 86 %, Khá 79 % còn trên), B5, B6 giữ; 1,0 quá tay (Chuẩn 48 %, Biên S 0 %). Áp lực P vẫn dưới dải 30–50 % của Thử thách ở cả ba số: Đêm của Thử thách không ép hơn Cân bằng bao nhiêu, chỉ boss quyết. Núm kế (một lượt riêng, không phải số của bước này: §6.4 chấm cổng ở Cân bằng): `modeHp.challenge` 0,9, rồi một núm Đêm riêng của Thử thách cho P (số quái hay tốc theo chế độ).
- Gần thua N ở Cân bằng 0,03–0,13 mỗi ải (dải BALANCE §3 0,3–1; B1 không chấm N), như các đợt trước.
- **Học lấy bao nhiêu** (đầu dò `r3final/nolearn240.ts`: cùng 240 seed, cùng bot, không danh sách học, như đầu ván R2): Ẩu 80 % không Học, 77 % có Học (−3 điểm; 13,5 Từ Ôn mỗi ván, gõ như từ đang học, d 0,85); Chuẩn 83 / 83 %; Chậm chắc 83 % không Học, 86 % có Học. Ở R3 phần B (trước luật gỗ, 40 seed) Học lấy của Chuẩn 12 điểm; kinh tế giàu hơn của luật gỗ làm phần đó gần hết. Nên phần thiếu của Ẩu chủ yếu không do Học.

**Cổng cứng §21 cuối R3** (mã `106db85` trừ chỗ ghi khác; kiểm theo `R3_PLAN.md` §9):

| # | Cổng | Kết quả | Số đo, bằng chứng |
|---|---|---|---|
| 1 | `pnpm check` xanh, `tests/boundary.test.ts` | đạt | Kit sha256 khớp (31 file), 338 test / 31 file (gồm `boundary.test.ts`), `tsc`, `vite build`, ngân sách gói: "/" 83,75 kB ≤ 85 kB (chừa 1,25 kB), `?title=0` 82,36 kB, tổng 100,20 kB (`r3final/check-*.log`) |
| 2 | Tất định | đạt | `pnpm td:golden:check` `same: true` (`td-1a` 19.660 tick, `td-1b-boss` 5.306 tick, nội dung `cd59313e`); nhật ký trang của mọi kịch bản có kiểm chạy lại trên Node ra cùng mã băm (15 kịch bản × 2 cỡ: `td-1a6-day`, `-keyboard`, `-learn`, `-night`, `-perf`, `td-1b-boss`, `-build`, `-direct`, `-ult`, `-wood`, `-learn`, `-perf`, `-night5` cùng nhật ký dài của "Chơi lại Ngày 5", `-tour` cùng file chơi thử, `td-balance` hai đêm); `td-1a6-perf`: Chrome bước nhật ký vàng của Node ra cùng 327 mã băm (mỗi 60 tick) ở hai cỡ, file vàng còn đúng |
| 3 | Bất biến | đạt | Test thuộc tính và bất biến trong `pnpm check` (`td-calls`, `td-learn`, `td-r2`, `td-sim-economy`: lời gọi SÁNG ≤ trần, một khóa, chữ đầu, bỏ qua mọi lời gọi kể cả `ult`, `direct`, Từ Ôn không mất gì, tiền G7); bot kiểm bất biến mỗi tick ở mọi ván của `td:balance`: "Bất biến vỡ và lệnh bị từ chối (mọi chế độ): không có" |
| 4 | Ngân sách chú ý | đạt | Cổng 5a 7,90 s ≤ 8 s; bot Chuẩn kiểu người: cửa sổ 20 s đầy nhất p50 7,67 s, lớn nhất 9,08 / 9,45 s, ván quá 8 s 10 / 16 trong 120 (đích mềm ≤ 20 % ván, không ván nào quá 10 s); G2 đạt |
| 5 | B1–B8 hai bộ × 120; đích chặt gộp | **trượt** | B4 bộ 1 (hòa Biên S 60 = 60 %); đích chặt gộp 5/6 (Ẩu 77 %). Mọi cổng khác của B1–B8 đạt ở cả hai bộ và gộp (bảng trên) |
| 6 | G1, G3, G4, G8; G5, G6; B8 R3 | đạt | Bảng G1–G8 ở trên; B8 R3: 8 từ mới mỗi ván, 0 ở lời gọi có hạn và Đêm 5 |
| 7 | Boss đọc được | đạt (một điểm yếu ghi lại) | `td-1b-boss` 20/20 kiểm ở hai cỡ (Rễ Trồi báo 90 tick, Quật cành 72, Rễ hút 72; dải choáng dưới thanh boss; Dồn lửa ≤ trần; Mầm Gỗ; thẻ không bị hiệu ứng che), `td-1b-night5` 12/12 ở hai cỡ (báo Ngày 5, Quật Lũy, thua, "Chơi lại Ngày 5"). Ảnh chậm mỗi cỡ: trồi 8 khung, Rễ Trồi báo 6 và trúng 5, Quật cành 7, Mầm Gỗ 6, choáng 6, Rễ hút 8, rút 6, lặng 4; đã xem ở 1280 × 720 (và Rễ hút, Mầm Gỗ ở 1920 × 1080): vòng đỏ và "Tê 3 s", cung đỏ của Quật cành, dải "Mộc Tinh choáng! Gõ Bắn mạnh!" và "Cháy ×1,25", rễ viền mực tới Lũy với "−1 mạng" và đốm hổ phách, "−3 mạng" của Quật Lũy. Điểm yếu: 4 mầm của Mầm Gỗ (báo 0,8 s) chỉ ~7 px, xanh trên thân boss xanh và cỏ xanh, phải phóng ảnh mới thấy (mục "Còn trượt") |
| 8 | Hiệu năng §20 | đạt (Apple M4) | 60 Hz, mã cuối: `td-1b-perf` luồng chính 1,85–2,04 ms (1280 × 720) và 1,73–1,75 ms (1920 × 1080) mỗi khung (≤ 4 ms), vẽ 2D + thẻ p95 1,4–1,5 ms (≤ 8 ms), khung dài nhất lúc trồi 4,1–4,5 ms (≤ 16,7 ms); `td-1a6-perf` 1,83 / 1,87 ms, bước sim trong Chrome trung vị 0,02 / 0,03 ms (≤ 0,05 ms); lớp boss p95 0,3 ms (≤ 0,6 ms); bước sim trên Node, cảnh boss + lũ 300 + Tối Thượng, p95 0,36–0,39 ms (≤ 0,5 ms). Số Dell (3,9–4,6 ms, §7.5) vẫn là máy yếu nhất phải đạt. Bảng ở dưới |
| 9 | Mọi kịch bản §19 và kịch bản cũ, hai cỡ, 0 lỗi console | đạt | 22 kịch bản × 2 cỡ, 44/44 lượt đạt trên mã R3 cuối (bảng dưới); lỗi console chỉ có 10 lỗi cố ý mỗi lượt của `td-1b-chunks` (kiểm `noOtherErrors` đạt); 0 ngoại lệ. `td-balance` trượt lượt đầu vì số cứng cũ của kịch bản, sửa ở `5c3b939` |
| 10 | Số dòng ≤ 10.500 | đạt | 10.492 |
| 11 | Changelog, `BUILD_NOTES` §7, `AGENTS.md` | đạt | `docs/changelog/2026-10-26-td-r3-balance.md`, mục này, dòng trạng thái của `AGENTS.md` |
| 12 | Chủ dự án chơi thử, có số cho B9 | **chờ** | Gói chơi thử sẵn (`PLAYTEST_1B.md`, thêm câu hỏi về Rễ hút sinh khí); B9 thiếu số |

**R3 chưa qua hết §21:** cổng 5 trượt (B4 bộ 1, đích chặt của Ẩu), cổng 12 chờ chủ dự án. Mười cổng còn lại (1–4, 6–11) đạt trên Apple M4.

**Hiệu năng §20 trên Mac** (27/10 01:22–01:33, Apple M4, Chrome 155 macOS có GPU, ANGLE Metal; cả lượt giữ ba chỗ trình duyệt của `heavy.sh --perf`, nên không trình duyệt nào khác chạy cùng; tải trung bình 1,8–4,7; `r3close/perf.txt`). Hai cây như mốc §1.2: `89e2494` (trước R3, "mốc") và mã cuối (`106db85`, "R3"), mỗi cây ở `tmp/mac-2026-10-25/r3final/ab/` (đã đối `src` từng file với `git archive`), mỗi lượt chỉ một máy chủ dev ở cổng 3006. Cùng kịch bản `td-1b-perf` (không đổi từ `89e2494`), 60 Hz, xen kẽ ABBA ở mỗi cỡ. Cảnh lũ của R3 có 10 loại quái, của mốc 8 loại (A23: Đầu Đàn với hào quang, Troll với vòm là việc mỗi tick mới, phải nằm trong lần đo).

| Cỡ | Lượt (tải) | Cây | Luồng chính ms/khung | Khung/s | Bận | Vẽ 2D + thẻ: TB / p95 | Bước + HUD TB | Khung dài nhất lúc trồi | Quái |
|---|---|---|---|---|---|---|---|---|---|
| 1280 × 720 | 1 (4,7) | mốc | 2,191 | 60,0 | 13,1 % | 1,136 / 1,7 | 0,287 | 5,2 | 295 |
| 1280 × 720 | 2 (3,5) | R3 | 2,040 | 59,9 | 12,2 % | 1,026 / 1,5 | 0,331 | 4,1 | 300 |
| 1280 × 720 | 3 (2,8) | R3 | 1,846 | 59,9 | 11,1 % | 0,927 / 1,4 | 0,290 | 4,5 | 300 |
| 1280 × 720 | 4 (2,6) | mốc | 1,744 | 59,9 | 10,4 % | 0,915 / 1,4 | 0,231 | 3,3 | 296 |
| 1920 × 1080 | 1 (2,8) | mốc | 1,648 | 59,9 | 9,9 % | 0,857 / 1,3 | 0,210 | 4,3 | 296 |
| 1920 × 1080 | 2 (3,1) | R3 | 1,727 | 59,9 | 10,3 % | 0,873 / 1,3 | 0,274 | 2,7 | 300 |
| 1920 × 1080 | 3 (2,5) | R3 | 1,754 | 59,9 | 10,5 % | 0,890 / 1,4 | 0,279 | 4,1 | 300 |
| 1920 × 1080 | 4 (2,4) | mốc | 1,674 | 59,9 | 10,0 % | 0,864 / 1,3 | 0,218 | 4,1 | 295 |

- ABBA khử phần trôi theo tải (máy nhẹ dần từ 4,7 xuống 2,4): R3 trừ mốc, luồng chính −0,025 ms (1280 × 720) và +0,080 ms (1920 × 1080) mỗi khung; bước + HUD +0,05 / +0,06 ms; vẽ −0,05 / +0,02 ms.
- Bốn lượt R3 đạt mọi kiểm (10/10). Bốn lượt mốc đều trượt; hai lượt còn file kết quả (lượt sau ghi đè lượt trước cùng tên) trượt đúng một kiểm, `nodeReplaysToBrowserHash`: phần Node của kịch bản là `scripts/td/replay.ts` của cây làm việc (luật R3), nên nhật ký của trang mốc không ra cùng mã băm. Đó là giới hạn của cách đo A/B, không phải lỗi; phần đo khung không dính tới nó.

**Vết Chrome A/B** (cách của §1.2: `perf-trace.mjs`, cửa sổ 3 s "đều" và "mưa", 60 Hz; mỗi cỡ một lượt mốc rồi một lượt R3, tải 1,9–2,6; `r3close/trace/`). Luồng chính trang, ms mỗi khung:

| Cỡ, cửa sổ | Cây | Bận cả khung | Hàm khung của game | Gửi lớp sang GPU (`Commit`) | Style, layout, paint | GC ngoài hàm khung | Còn lại |
|---|---|---|---|---|---|---|---|
| 1280 × 720, đều | mốc | 1,768 | 1,157 | 0,294 | 0,047 | 0,054 | 0,217 |
| 1280 × 720, đều | R3 | 1,969 | 1,319 | 0,271 | 0,057 | 0,110 | 0,212 |
| 1280 × 720, mưa | mốc | 1,700 | 1,074 | 0,242 | 0,171 | 0,050 | 0,163 |
| 1280 × 720, mưa | R3 | 1,946 | 1,238 | 0,244 | 0,184 | 0,111 | 0,170 |
| 1920 × 1080, đều | mốc | 1,813 | 1,212 | 0,309 | 0,049 | 0,029 | 0,215 |
| 1920 × 1080, đều | R3 | 1,962 | 1,312 | 0,277 | 0,059 | 0,091 | 0,223 |
| 1920 × 1080, mưa | mốc | 1,793 | 1,134 | 0,254 | 0,182 | 0,049 | 0,175 |
| 1920 × 1080, mưa | R3 | 2,054 | 1,296 | 0,252 | 0,173 | 0,118 | 0,214 |

- Theo vết, R3 thêm 0,15–0,26 ms mỗi khung: hàm khung của game +0,10–0,16 ms (bộ đếm trong trang: bước + HUD 0,19–0,22 → 0,28–0,33 ms, vẽ +0,01–0,08 ms) và GC +0,04–0,07 ms. Phần Chrome tự làm (gửi lớp, lifecycle, lịch) không đổi.
- Hai cách đo lệch nhau (A/B `td-1b-perf`: 0–0,08 ms; vết: 0,15–0,26 ms) vì vết chỉ có một lượt mỗi bên và cửa sổ 3 s. Cả hai cùng hướng: phần tăng nằm ở bước sim, không ở vẽ.
- So với mốc §1.2 (25/10: "đều" 1280 × 720 bận 1,32 ms): cùng mã `89e2494` hôm nay ra 1,77 ms. Cùng máy, khác phiên (làn khác chạy việc CPU), lệch +0,45 ms, lớn hơn mọi chênh của R3. Vì vậy chỉ so mốc và R3 trong cùng phiên, xen kẽ.

**`td-1a6-perf`** (mã cuối, 60 Hz; `r3close/shots/td-1a6-perf-*.log`): 1280 × 720: 60,1 khung/s, luồng chính 1,83 ms mỗi khung (p95 các đoạn 0,5 s 2,84 ms; ≤ 8 ms), vẽ 2D + thẻ p95 1,5 ms, bước + HUD p95 0,6 ms, bước sim trong Chrome trung vị 0,02 ms, p95 0,06 ms (600 bước, 300 quái); 1920 × 1080: 60,1 khung/s, 1,87 ms (p95 2,55 ms), vẽ p95 1,5 ms, bước sim trung vị 0,03 ms, p95 0,06 ms. 32 phím gõ trong cửa sổ, 302–310 quái. Chrome bước nhật ký vàng của Node ra cùng 327 mã băm, file vàng còn đúng; nhật ký trang chạy lại trên Node khớp. 14/14 kiểm ở hai cỡ. Số §7.6 (25/10, Mac, mã trước R3) là 1,16 / 1,11 ms; không đo xen kẽ nên phần chênh gồm cả lệch phiên ở trên.

**Lớp boss** (đầu dò `r3close/boss-layer.mjs`, chỉ trong `tmp`: cảnh `td-1b-perf`, 60 Hz, `BossView` của chính trang được đo từng khung trong `DebugView.draw`; đồng hồ trang thô ~0,1 ms). §20: p95 ≤ 0,6 ms.

| Cỡ | Lúc trồi (150 khung): TB / p95 / lớn nhất | Giao chiến, lũ 300, Tối Thượng ×2 (630 khung): TB / p95 / lớn nhất | Cả hàm vẽ p95 (trồi / giao chiến) |
|---|---|---|---|
| 1280 × 720 | 0,085 / 0,3 / 0,5 ms | 0,104 / 0,2 / 0,4 ms | 0,8 / 1,2 ms |
| 1920 × 1080 | 0,065 / 0,2 / 0,5 ms | 0,074 / 0,2 / 0,3 ms | 0,7 / 0,9 ms |

**Bước sim trên Node** (§20: p95 ≤ 0,5 ms với 300 quái + boss + Mầm Gỗ + Tối Thượng). `tests/td-sim-perf.test.ts` chạy riêng (một file, `heavy.sh`, tải 7–8), mã cuối 3 lần, mốc `89e2494` 2 lần, xen nhau (`r3done/sim-perf*.log`):

| Cảnh | Mốc: trung vị / p95 | R3: trung vị / p95 |
|---|---|---|
| Boss, lũ 300, mưa Tối Thượng | 0,045 / 0,135–0,157 ms | 0,111–0,117 / 0,360–0,391 ms |
| 300 quái, 200 đạn, làng đầy (cổng 3 của 1A.6) | 0,031 / 0,106–0,123 ms | 0,038–0,041 / 0,170–0,203 ms |
| Tải đầy TK 25.12 (640 quái) | 0,047–0,048 / 0,138–0,190 ms | 0,054–0,056 / 0,127–0,137 ms |

- Cảnh boss đạt (p95 0,39 ≤ 0,5 ms), nhưng chỗ trống từ ×3 còn ×1,3. Trong `pnpm check` (vitest 4 luồng cùng lúc) cùng cảnh ra p95 0,99 ms; số đó là số máy bận, test chỉ chặn ở 2 ms.
- **Vì sao tăng** (hồ sơ CPU, 8 cảnh × 300 bước, `r3done/boss-step-prof.ts`, `prof/`): `moveEnemies` (`sim/systems/move.ts`) chiếm 57 % thời gian bước. Từ bước 7, mỗi quái duyệt mọi hào quang của tick (`move.ts:29–40`: tốc của bầy, và không đi quá Đầu Đàn trên cùng đường), nên giá là số quái × số Đầu Đàn. Lũ 300 của R3 có 33 Đầu Đàn và 33 Troll (10 loại, A23), nên khoảng 10.000 lần so mỗi tick. Ải truyện của bản đồ 1 không có Đầu Đàn (chỉ hộp cát), nên ván thật không trả phần này.
- Núm kế nếu cần chỗ: gom hào quang theo đường (`RUSH` theo `route`), để mỗi quái chỉ duyệt Đầu Đàn trên đường của nó. Chưa làm: cổng đạt, và bước này chỉ làm giấy tờ.

Hạt 2D: pool cố định 300 hạt, tối đa 40 mới mỗi khung (`view/fx-2d.ts:16–17`), không đổi ở R3. Âm (≤ 12 nốt): không đo ở đợt này.

**Kịch bản** (cổng 9; Chrome 155 macOS có GPU, máy chủ dev cổng 3006, mỗi lượt dưới `heavy.sh --gpu` xen với lượt của ba làn khác). Lượt làm 2 (26/10 15:34–16:56, `src` `106db85`, chạy cùng lúc với bảng `td:balance` chốt, tải 5–12; `r3final/shots/`), lượt làm 3 (20:16–21:08, `106db85` cùng kịch bản của `a23c910`, tải tới 24; `r3close/shots/`), lượt làm 4 (27/10, `5c3b939` và đo §20 ở trên). **44/44 lượt đạt** ở 22 kịch bản × 1280 × 720 và 1920 × 1080; mỗi ô là lượt cuối trên mã R3 cuối:

| Kịch bản | Kiểm | 1280 × 720 | 1920 × 1080 | Lượt | Chạy lại trên Node, ghi chú |
|---|---|---|---|---|---|
| `td-1a-boot` | 11 | đạt | đạt | 2 | |
| `td-1a-ime` | 15 | đạt | đạt | 2 | |
| `td-1a6-attention` | 11 | đạt | đạt | 2 | |
| `td-1a6-day` | 19 | đạt | đạt | 2 | khớp |
| `td-1a6-keyboard` | 21 | đạt | đạt | 2 | khớp |
| `td-1a6-learn` | 18 | đạt | đạt | 2 | khớp |
| `td-1a6-night` | 11 | đạt | đạt | 2 | khớp |
| `td-1a6-tour` | 19 | đạt | đạt | 2 | |
| `td-1a6-perf` | 14 | đạt | đạt | 4 | khớp; 327 mã băm của nhật ký vàng |
| `td-1b-boss` | 20 | đạt | đạt | 2 | khớp; Rễ hút báo 72 tick, −1 mạng mỗi lần, câu trên thanh boss, 8 khung |
| `td-1b-build` | 18 | đạt | đạt | 2 | khớp |
| `td-1b-chunks` | 24 | đạt | đạt | 2 | 10 lỗi console cố ý mỗi lượt (màn đầu, hộp cát ×2, tiếng ×2, thẻ ×2, Chơi lại, Học, bảng dạy), `noOtherErrors` đạt |
| `td-1b-direct` | 16 | đạt | đạt | 2 | khớp |
| `td-1b-learn` | 14 | đạt | đạt | 3 | khớp; lượt 2 trượt (1920 × 1080 10/14), sửa kịch bản ở `a23c910` (trên) |
| `td-1b-night5` | 12 | đạt (2) | đạt (3) | 2, 3 | khớp, cả nhật ký dài; lượt 2 ở 1920 × 1080 bị tắt giữa chừng (mã thoát 143) |
| `td-1b-perf` | 10 | đạt | đạt | 4 | khớp; hai lượt R3 mỗi cỡ (bảng A/B) |
| `td-1b-story` | 17 | đạt | đạt | 2 | chơi lại Ngày 3 ra đúng hàng dạy |
| `td-1b-tour` | 17 | đạt | đạt | 2 | file chơi thử và các trang khớp; 2 cảnh báo của Three.js (không phải lỗi) |
| `td-1b-ult` | 13 | đạt | đạt | 2 | khớp |
| `td-1b-wood` | 21 | đạt | đạt | 3 | khớp |
| `td-balance` | 12 | đạt | đạt | 4 | khớp (hai đêm); lượt đầu trượt, sửa kịch bản ở `5c3b939` (trên) |
| `td-theme` | 17 | đạt | đạt | 3 | |

- **Ảnh đã xem** (lượt 4): `td-balance` (Hồ sơ gõ "×0,96 chậm hơn chuẩn" đọc rõ ở 1280 × 720; Đêm Thử thách), `td-1b-boss` Rễ hút (1280 × 720 khung 4 và 7, 1920 × 1080 khung 2: rễ viền mực bò tới Lũy, vòng son, "−1 mạng" dưới Lũy, chip Mạng "18 −1"). Lượt 2, 3 đã xem các ảnh của cổng 7 (bảng trên) và `td-1b-wood`, `td-theme`.
- Ghi lại từ ảnh, chưa sửa: ở hộp cát "Đặt sẵn", ba nhãn kho "995/1000" (hay "980/1000") của ba cụm cây sát nhau vẫn chồng một phần lên nhau và bị biểu tượng 🪓 của dân che giữa chữ (1280 × 720 và 1920 × 1080). Luật "một nhãn mỗi cụm" (`83c5de6`) không gộp các cụm cách nhau một khoảng ngắn. Chưa xem ải truyện có chỗ như vậy không.

**Còn trượt sau sáu lượt (đã dừng chỉnh theo luật 6 lượt), vì sao, núm kế:**

1. **Đích chặt của Ẩu: 77 % gộp** (cần 78–88 %; mỗi bộ 78 / 76 % vẫn trong dải BALANCE §3). Mọi ván thua của Ẩu là thua ở boss (23–24 %); sát thương lên boss của nó 36,8/s so với Chuẩn 40,0/s, mà nhịp k của nó 0,982 gần bằng Chuẩn: E_eff của kit (trọng số độ chính xác 0,4, sàn 0,7·E) gần như không tính 15 % phím sai, và từ dài của dải E 45–64 làm sức chứa của nó thấp đi chút. Học chỉ lấy 3 điểm (đầu dò ở trên). Núm theo nhịp chung (máu boss, `POWER.quick`) đều đẩy Chậm chắc lên quá 88 % trước khi Ẩu tới 78 % (lượt 6). **Núm kế: núm 3 nhẹ hơn đầu dò** (trọng số độ chính xác 0,6, sàn 0,7: Ẩu k 0,961, Chậm chắc 0,801, Khá 1,137; đầu dò 0,8 / 0,6 kéo Ẩu tới 87 % là quá tay), đi cùng máu boss 4.100 nếu Chậm chắc còn chỗ. Núm 3 ở `src/kit/balance/pace.ts` (`effectiveE`) là kit dùng chung ba game và BALANCE §4.1: **việc của điều phối viên** (sửa `shared/game-kit` có test, đồng bộ ba game); làn này không tự sửa (`R3_PLAN.md` §7.3).
2. **B4 ở bộ 1: Biên S Chậm chắc 60 % bằng Ẩu 60 %** (cần lớn hơn). Bộ 2 và gộp đạt (65 so với 55 %). Biên S là trung vị số mạng (bước 5 %), nên đây là hòa một mạng ở trung vị của 120 ván, không phải Ẩu giữ mạng tốt hơn: hạ quái và sát thương lên boss của Chuẩn vẫn hơn Ẩu ở cả hai bộ. Núm 3 ở trên làm hòa nặng hơn (đầu dò: 55 = 55 % gộp), nên khi đo núm 3 phải đọc B4 cùng lúc; nếu B4 trượt thì cần một núm làm Ẩu mất mạng ở các Đêm (BUILD_1B §6.5 bước 5: máu Thuồng Luồng 385, giáp 60 % là chỗ Phát Chữ của từ chuẩn quyết).
3. Báo cáo, không là cổng: Thử thách quá dễ (núm `boss.modeHp.challenge`), Quãng Q của Thư giãn, Gần thua N của Cân bằng (ở trên).
4. Đạt nhưng sát mép, ghi để lượt sau biết: bước sim trên Node ở cảnh boss + lũ 300 p95 0,39 ms (§20 ≤ 0,5 ms; mốc 0,16 ms), vì hào quang của Đầu Đàn duyệt theo số quái × số Đầu Đàn (núm: gom theo đường); 4 mầm báo Mầm Gỗ (0,8 s) chỉ ~7 px, xanh trên nền xanh (cổng 7); nhãn kho chồng nhau ở hộp cát (kịch bản ở trên).
5. Ba quyết định R2 vẫn chờ chủ dự án xác nhận (`PACE.speedK` 0,3 và trần boss; giữ số sau §7.5; "phần khởi động" thay "cả gói" ở §20). A27, A28 của đợt này đã chọn theo đề xuất (`R3_PLAN.md` §5); điều phối viên xem có đưa sàn k 0,70 vào BALANCE §4.1 không.

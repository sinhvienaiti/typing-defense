# 1C cho map 1 "Đồng Cỏ Thác Bạc" (`w1-silverfall`): kế hoạch và ngân sách (C0, 28/10/2026)

**Trạng thái:** chủ dự án **đã duyệt** ngày 28/10/2026 (câu 5 của `docs/games/MAP1_PRODUCTION.md` §4.4 ở repo cha; điều phối viên báo lúc 19:50): trần dòng +~6.000, chunk 3D nạp lười, media High ~12 MB và Medium ~6 MB, lần chơi đầu nạp Medium. Cùng lúc chủ dự án nhận đề xuất 6 (A2): giữ khoảng chờ ban ngày, lấp bằng hành động nhìn thấy của 1C, đo lại sau 1C (§8, C14).

Làn L (Claude) làm trên nhánh `td-1c`, worktree `games/.wt-td-1c`, tách từ `a2-days` @ `df63008`. `td-1c` gộp dần vào `a2-days`, từng bước, sau khi bước đó qua phản biện.

Nguồn: bản kiểm kê map 1 (`docs/games/map1/audit-2026-10-28.json`, mục C0–C15), `MAP1_PRODUCTION.md` §2, §4; TK §23.2, §23.6, §23.8, §23.10, §25.12, §26.1; `docs/games/VFX_STANDARD.md` §3.7; `docs/games/DEPLOY_INDEPENDENCE.md` §4; `docs/HOSTING_PLAN_2026-10-25.md` §7.

## 0. Tóm tắt

| Mục | Số |
|---|---|
| Phạm vi | Chỉ map 1. 2D (`view/debug-2d.ts`) là bậc Low và đường lùi. Sim, gõ, nội dung không đổi: hai ván vàng giữ `f2a21037` |
| Trần dòng | Trần cứng 1C **16.500** (10.500 của R3 + 6.000; 400 dòng V4a trả lại vì làn V4a dừng ở bước 1). Hôm nay 10.555 |
| Gói "/" | Vẫn ≤ 85 kB gzip (lối vào + màn đầu). Trước 1C 83,78 kB (chừa 1,22 kB sau khi gộp 036; trên `a5cc147` chỉ chừa 0,09 kB). C1 thêm ≤ 0,5 kB (đo: +0,42 kB, còn chừa 0,79 kB) |
| Chunk 3D | `view/3d/view-3d.ts` cùng three.js, nạp lười, không bao giờ trong bộ khởi động; ≤ 260 kB gzip (C1: 117 kB) |
| Media map 1 | High ≤ 16 MB (chủ dự án 28/10, thay ≤ 12 MB; bậc người chơi tự chọn), Medium ≤ 9 MB (chủ dự án 28/10, thay ≤ 6 MB), Low 0 byte model. Lần chơi đầu nạp Medium; trang chỉ chờ bộ khởi động ≤ 3,5 MB; tới Đêm 1 ≤ 6 MB |
| Khung (Mac mini M4, 1920 × 1080) | High: trung bình ≤ 5,5 ms, p95 ≤ 8,5 ms, ≤ 150 draw call. Medium: ≤ 4,5 ms, p95 ≤ 7 ms, ≤ 100 draw call. Không khung nào quá 50 ms |
| Thứ tự làn L | C1 → C2 → C4 → C3 → C6 → (mốc giữa 06/11) → C10 → C13 → C14 |

## 1. Phạm vi

- **Chỉ map 1** (`SLICE_1A`, sân `td-sandbox`, nửa cạnh 48 m), cả truyện lẫn hộp cát. Bản đồ khác (chưa có) chạy 2D.
- **2D giữ lại** làm bậc Low và đường lùi khi WebGL lỗi, chunk 3D không tải được, hoặc mất context giữa ván. 2D chỉ nhận sửa lỗi; phần vẽ V4a ở 2D không làm (làn V4a dừng ở bước 1, `BUILD_NOTES.md` §7.11).
- **Không đổi luật.** `src/sim`, `src/typing`, `src/content` không đổi trong 1C. Ván vàng (`pnpm td:golden:check`) phải giữ nguyên ở mọi bước. Việc nào cần đổi luật thì ra khỏi 1C và hỏi chủ dự án.
- **Không dựng model bằng mã.** Nhân vật, quái, nhà, đạo cụ là GLB Tripo đã có (đợt 1 và đợt 2). Mã chỉ dựng địa hình, đường, nước, decal, billboard cảnh và VFX.
- **Không media trong Git.** GLB, ảnh, âm ở `public/assets/typing-defense/` (Git bỏ qua). `media:push` do điều phối viên chạy, không phải làn L.
- **Để sau (C15, không thuộc map 1):** Credit Crystal sang kit, impostor, cảnh v3–v4, StylePack Neon, rig Draconis P18; giẫm cỏ, gió giật, VAT (TK §26.1).

## 2. Bậc chất lượng và chọn view

| Bậc | View | Khi nào |
|---|---|---|
| Low | 2D (`DebugView`) | `?q=low` hay `?view=2d`; WebGL lỗi; chunk 3D lỗi; mất context; bản đồ không phải map 1 |
| Medium | 3D | `?q=medium` hay `?view=3d`; **mặc định từ C13** (lần chơi đầu) |
| High | 3D | `?q=high`; chọn trong Cài đặt (C13) |

- **Tới hết C13, mặc định vẫn là Low (2D).** Bản 3D dở không tới tay người chơi. Kịch bản và người kiểm mở 3D bằng `?q=` hay `?view=3d`.
- **C13 đổi mặc định sang Medium** khi bản 3D qua ngân sách ở §6, và thêm hàng "Chất lượng hình" (Thấp, Vừa, Cao) vào thẻ Cài đặt (`td.settings`).
- **Lùi về 2D không làm dừng ván:** HUD báo một dòng ("Bản 3D chưa mở được: chơi bản 2D"), không có lỗi console ngoài lỗi của chunk bị chặn (`td-1b-chunks` thêm trường hợp `view3d`).
- Khi trang muốn 3D, ván chờ chunk 3D ở tick 0, như chờ Học. `__td.ready()` chờ nó; `__td.chunks().view3d` cho biết bản 3D đang vẽ.

## 3. Trần dòng

Cách đếm như `BUILD_1A6.md` §0: `.ts` trong `src`, trừ `src/kit`; test, bot, kịch bản, script không tính. Hôm nay **10.555** (sau khi gộp phiếu 036).

- Trần cứng 1C: **16.500**. Test `boundary` đọc dòng này khi mốc đang làm (`BUILD_NOTES.md` §1.2) là `1C.*`.
- Phần từng bước dưới đây là trần cộng dồn theo thứ tự gộp dự kiến. Làn gộp sớm hơn dự kiến thì vẫn chỉ dùng phần của mình. Cổng thật là trần cứng.
- **Rủi ro:** view 3D của Rồng dài 11.369 dòng. Lời Gọi chỉ chép phần map 1 cần; mã chép cũng tính vào trần. Ở mốc giữa 06/11, điều phối viên đếm lại theo số thật. Nếu dự báo vượt 16.500, cắt theo thứ tự dưới trước khi xin nâng trần.

| Bước | Làn | Phần | Cộng dồn tối đa |
|---|---|---:|---:|
| C1 giao diện view, view 3D rỗng | L | 200 | 10.800 |
| C2 sân khấu, camera RTS, bậc | L | 650 | 11.450 |
| C4 nạp model map 1 | L | 200 | 11.650 |
| C3 đất, đường, suối, cầu, sân Fort | L | 800 | 12.450 |
| C6 nhà và trạng thái | L | 700 | 13.150 |
| C5 rig và clip (Mộc Tinh, Draconis, dân) | L2 | 350 | 13.500 |
| C8 Draconis và Mộc Tinh trên sân | L2 | 400 | 13.900 |
| C12 đồ bay về HUD, skin HUD | L4 | 250 | 14.150 |
| C10 thẻ chữ trên 3D | L | 350 | 14.500 |
| C7 quái, lính, dân, Helper, cây luật | L3 | 800 | 15.300 |
| C9 cảnh: cây, bụi, đá, mép rừng, phông | L3 | 450 | 15.750 |
| C11 VFX năm pha | L4 | 550 | 16.300 |
| A1, A13 (việc đầu có hướng dẫn, nối âm thật) | L3, L2 | 50 | 16.350 |
| C13 hiệu năng, bậc, mặc định Medium | L | 50 | 16.400 |
| C14 sửa sau kiểm cổng | L | 100 | 16.500 |

**Thứ tự cắt khi vượt** (cắt hình trước, không cắt luật, không cắt test):
1. C9: bỏ cỏ chữ thập ở Medium, gộp biến thể ít dùng.
2. C12: giữ đồng và Rice bay về HUD, bỏ Wood và Mảnh Chữ bay.
3. C11: các đòn phụ (trống Raccoon Dog, vòng nước River Serpent) dùng chung công thức với đòn chính gần nhất.
4. C6: trạng thái bán và tê vì rễ dùng chung một hiệu ứng.
5. C7: cây luật chỉ đổi màu khi đặt nhà, không hoạt ảnh.

## 4. Gói "/" và chunk 3D

- **Gói "/" giữ trần 85 kB gzip** (`scripts/bundle-budget.mjs`, BUILD_1B §20): lối vào và màn đầu. Hôm nay 83,78 kB (83.784 byte). `?title=0`: 82,33 kB.
- **Phần của 1C trong lối vào ≤ 0,5 kB gzip:** chỉ giao diện `MapView`, hàm chọn view và đoạn đổi view trong `main.ts`. Mọi thứ khác của 3D nằm trong chunk riêng.
- **Chunk 3D** (`src/view/3d/view-3d.ts` và mọi thứ nó import, kể cả three.js): nạp bằng `import()` ở `src/view/view.ts` (`load3d`), chỉ khi bậc muốn 3D. Không bao giờ nằm trong bộ khởi động của trang nào.
- **Trần chunk 3D: ≤ 260 kB gzip** (three khoảng 142 kB như ở Rồng, GLTFLoader 14 kB, meshopt 6 kB, mã view 3D của map 1 khoảng 90 kB). `bundle-budget.mjs` in cỡ chunk và hỏng build khi vượt, hay khi chunk 3D lọt vào bộ khởi động.
- **Ranh giới** (`tests/td-view.test.ts`): `three` chỉ được import trong `src/view/3d/**` và `src/kit/three/**`; `src/view/3d/**` chỉ được với tới qua `import()` của `src/view/view.ts`.
- Nếu C11 hay C9 đẩy chunk 3D quá trần: tách phần chỉ High cần (hậu kỳ, bóng theo dáng tranh) thành chunk con.

## 5. Ngân sách media

**Hôm nay:** manifest model có 34 mục: High 13,68 MB, Medium 6,07 MB. Trong đó có mục không thuộc truyện map 1 (`heroes/lam` 1,30 / 0,83 MB; `enemies/troll` 0,59 / 0,36 MB, chỉ hộp cát), và còn thiếu bộ cấp L2/L3, River Serpent, Split Blob, Sapling, Helper, Mộc Tinh, Draconis, giàn tre, xe goòng, lông lửa, ba mốc cảnh (C4). Vì vậy C4 phải hạ texture trước khi thêm model.

**Quyết định của chủ dự án (28/10/2026, khoảng 23:20, qua điều phối viên), thay trần Medium cũ (≤ 6 MB):** C4 phần A đo được phần model Medium đã 3,98 MB khi mới có 32/57 model, dự báo 7–8 MB khi đủ, vì ở Medium phần nặng là lưới có xương và clip của nhân vật. Nay:

- **Medium tổng ≤ 9 MB.**
- **Bộ khởi động ≤ 3,5 MB:** trang chỉ chờ chừng này trước khi vào ván.
- **Tải theo ngày:** phần còn lại nạp ngầm theo thứ tự mở khóa của truyện (Barracks Ngày 2; Cannon Tower, Gold Mine, Fort cấp 2 Ngày 3; nâng cấp Ngày 4; Fort cấp 3 Ngày 5); bộ boss nạp cuối.
- **Byte tới Đêm 1 ≤ 6 MB** (HOSTING_PLAN §7): bộ khởi động, phần Ngày 1 cần và JS, CSS, từ vựng.

**Quyết định của chủ dự án (28/10/2026, khoảng 23:55, qua điều phối viên), thay trần High cũ (≤ 12 MB):** **High tổng ≤ 16 MB.** High là bậc người chơi tự chọn trong Cài đặt (từ C13); lần chơi đầu vẫn là Medium. C4 phần B đo phần model High 10,08 MB khi có 53/57 model; dự báo khi đủ cảnh và VFX khoảng 15–16 MB. Các dòng High theo phần nay chỉ theo dõi.

| Phần | High | Medium | Low |
|---|---:|---:|---:|
| Model GLB của map 1 | theo dõi | theo dõi | 0 |
| Ô đất, decal, ô Rice Field (phiếu 095, 097, 098) | theo dõi | theo dõi | 0 |
| Atlas cảnh (màu + pháp tuyến), ba lớp phông, trời | theo dõi | theo dõi | 0 |
| Tờ VFX (043, 099, 100) | theo dõi | theo dõi | 0 |
| **Cộng** | **≤ 16 MB** | **≤ 9 MB** | ảnh màn đầu 0,34 MB như nay |
| **Bộ khởi động** | — | **≤ 3,5 MB** | — |
| **Tới Đêm 1** (thêm JS, CSS, từ vựng) | — | **≤ 6 MB** | — |

- **Bộ khởi động** (danh sách ở `scripts/td/media-budget.mjs`, `STARTER`): đất, cảnh, Fort, Rice Field, Archer Tower, giàn tre, cờ cấp, hai Wooden Bridge, hai mốc cảnh, Draconis, Helper và đồ gắn, dân, Hopping Zombie, mũi tên và nỏ của Fort.
- **Thêm tới Đêm 1** (`NIGHT_1`): bộ cấp 2 của Fort, Archer Tower, Rice Field, lông lửa, tờ VFX; cộng JS, CSS (gzip của `dist`) và từ vựng.
- **Cách hạ:** texture Medium ≤ 1024² cho nhà, ≤ 512² cho đạo cụ nhỏ và đồ gắn; nén meshopt (không dùng Draco); gộp texture trùng. Ảnh 2D là WebP.
- **Chỉ model map 1 vào gói deploy** (C13; phần `deploy.config` là của làn T, A9). Model hộp cát (Troll) nạp khi hộp cát gọi.
- **Đo:** `scripts/td/media-budget.mjs` cộng `bytes` của bậc trong `models/manifest.json` cho các mục map 1, cộng các thư mục `ground`, `scenery`, `vfx`; hỏng khi vượt High tổng (16 MB), Medium tổng (9 MB), bộ khởi động (3,5 MB) hay mức tới Đêm 1 (6 MB). Chạy trước mỗi lần xin `media:push`.

## 6. Draw call và khung theo bậc

Đo trên Mac mini M4, Chrome có GPU, 1920 × 1080, cảnh của `td-1b-perf` (boss, flood 300, Tối Thượng ×2), nhịp 60 Hz, dưới `.local/bin/heavy.sh --gpu`. Khung = phần việc của trang trong một khung (sim, view, thẻ, HUD).

| Mục | High | Medium | Low (2D) |
|---|---|---|---|
| Tỉ lệ điểm ảnh | ≤ 1,5 | 1 | ≤ 2 (như nay) |
| Khung trung bình | ≤ 5,5 ms (TK §25.12) | ≤ 4,5 ms | như nay (`td-1b-perf` 1,7–2,0 ms) |
| Khung p95 | ≤ 8,5 ms | ≤ 7 ms | như nay |
| Khung dài nhất sau khi vào trận | ≤ 50 ms | ≤ 50 ms | ≤ 50 ms |
| Draw call (cả bóng và hậu kỳ) | ≤ 150 | ≤ 100 | — |
| Tam giác | ≤ 1,5 triệu | ≤ 0,7 triệu | — |
| Bóng | 2048 | 1024 | — |
| Bloom | 0,25 (Sách tranh), chỉ khi đo vừa | tắt | — |
| Hạt chiến đấu sống / sinh mới mỗi khung | 2.400 / 260 (TK §23.8) | 1.200 / 160 | pool 2D như nay |
| Nhân vật có xương cập nhật mỗi khung | ≤ 8 (ngoài màn hình 15 Hz) | ≤ 6 | — |
| Đồng bay cùng lúc | 120 | 60 | 28 |
| Thẻ chữ DOM | ≤ 20, chỉ đổi `transform`, `opacity` | như High | như nay |
| Bộ xếp làn thẻ | ≤ 0,3 ms | ≤ 0,3 ms | như nay |
| Texture VFX trong GPU | ≤ 32 MB | ≤ 16 MB | — |

**Chia draw call theo module** (High / Medium):

| Module | High | Medium |
|---|---:|---:|
| Sân khấu và hậu kỳ | 2 | 1 |
| Đất, đường, suối, cầu, sân Fort, decal | 8 | 6 |
| Cảnh 2D (TK §23.10: ≤ 6) và phông (2–3 trụ) | 9 | 6 |
| Nhà, bộ cấp, đèn lồng, huy hiệu (instanced theo model và cấp) | 40 | 28 |
| Quái, lính, dân, Helper, Draconis, Mộc Tinh | 30 | 22 |
| Thanh máu, huy hiệu, số nổi (mỗi loại 1) | 4 | 4 |
| Đồ bay, Rương | 3 | 2 |
| VFX (VFX_STANDARD §3.7) | 32 | 20 |
| Lượt bóng (phần còn lại) | ≤ 22 | ≤ 11 |

## 7. Chia module

Mã 3D nằm trong `src/view/3d/` (chunk lười). Mỗi file một làn, để hai làn không sửa cùng file. File chép từ Rồng ghi nguồn ở đầu file (`Adapted from games/dragon-hold@<sha> src/view/<file>.ts`); không import chéo giữa game.

| File | Việc | Bước | Làn |
|---|---|---|---|
| `src/view/view.ts` (lối vào) | `MapView`, `Hand`, `pickView` (bậc theo URL, sau này theo Cài đặt), `load3d` | C1 | L |
| `src/view/debug-2d.ts`, `boss-2d.ts`, `fx-2d.ts`, `fx-pipe.ts` | Bậc Low (2D); chỉ sửa lỗi | — | L |
| `src/view/3d/view-3d.ts` | `View3D`: ráp các phần, đổi qua lại với 2D, lùi khi mất context | C1, rồi mỗi bước | L |
| `src/view/3d/stage.ts` | Renderer, ánh sáng, hậu kỳ theo StylePack Sách tranh, ba bậc | C2 | L |
| `src/view/3d/camera.ts` | Camera RTS TK §23.6, `project`, `unproject`, rung ≤ 6 px trên canvas | C2 | L |
| `src/view/3d/models.ts` | Danh sách model map 1, nạp theo bậc và theo ngày mở khóa (kit `ModelLibrary`, `pickModelTier`) | C4 | L |
| `src/view/3d/ground.ts` | Địa hình, đường, suối, cầu, sân Fort, quặng, decal | C3 | L |
| `src/view/3d/houses.ts` | Nhà theo loại và cấp, socket, xây, nâng cấp, bán, tê vì rễ, bóng ma đặt nhà, ô Rice Field, đống vàng | C6 | L |
| `src/view/3d/units.ts` | Đám đông instanced: quái, lính, dân, Helper, cây luật | C7 | L3 |
| `src/view/3d/heroes.ts` | Draconis (bay, đậu, Fire Feather Rain), Mộc Tinh (trồi, pha 2, rút) | C5, C8 | L2 |
| `src/view/3d/scenery.ts` | Billboard cây, bụi, đá; mép rừng; phông 140/220/320 m; đung đưa | C9 | L3 |
| `src/view/3d/words.ts` | Điểm neo 3D cho thẻ chữ DOM (`FX_top` + 0,6 m), khay mép, mặt nạ vùng yên, chữ bay vào `FX_core` | C10 | L |
| `src/view/3d/vfx.ts` | Năm pha của mọi đòn chính (VFX_STANDARD), kit `three/particles` | C11 | L4 |
| `src/view/3d/loot.ts` | Đồng, Rice, Wood, Mảnh Chữ bay về ô HUD; Rương | C12 | L4 |
| HUD: `src/ui/hud.ts`, `team-bar.ts`, `td.css` | Vẫn là DOM; skin TK §23.5, ≤ 10 % ở 1280 | C12 | L4 |
| Thẻ chữ: `src/view/words/*` | Vẫn là DOM; C10 chỉ đổi điểm neo, sau khi phiếu Codex 103 đã gộp | C10 | L |
| `scripts/td/prepare-scenery.mjs`, `scripts/td/media-budget.mjs` | Atlas cảnh; kiểm ngân sách media (không tính dòng) | C9, C4 | L3, L |

## 8. Thứ tự làn L và điều kiện xong

Ngày theo `MAP1_PRODUCTION.md` §4.3. Mỗi bước: `pnpm check` xanh, `pnpm td:golden:check` bằng, gói "/" ≤ 85 kB, chunk 3D ≤ 260 kB, số dòng dưới trần của bước. Có changelog tiếng Việt. Xong bước thì gửi phản biện, rồi điều phối viên gộp `td-1c` vào `a2-days`.

| Bước | Ngày | Xong khi |
|---|---|---|
| **C1** giao diện view | 29–30/10 | `main.ts` vẽ qua `MapView`, không gọi thành viên riêng của `DebugView` ngoài phần 2D (`flat`); `?view=3d` và `?q=medium|high` mở view 3D rỗng trong chunk riêng; mặc định và `?q=low` vẫn 2D; WebGL lỗi hay chunk lỗi thì lùi về 2D; gói "/" tăng ≤ 0,5 kB; chunk 3D không trong bộ khởi động; trình duyệt ở 1280 × 720 và 1920 × 1080: 2D chơi được, 3D mở, 0 lỗi console |
| **C2** sân khấu, camera | 30–31/10 | Chép `stage.ts`, `camera.ts` của Rồng (ghi nguồn). Camera TK §23.6: 55° ở 58 m, zoom 22–120 m, kéo trái pan, kéo phải xoay và nghiêng, lăn zoom vào con trỏ, Home, PageDown, End (31/10: thay F1–F3, vì F1, F2 mở Settings, Sound và PageUp là nâng cấp ở TK §8.3; chờ chủ dự án duyệt), không bao giờ tự chạy, rung chỉ trên canvas. Ánh sáng Sách tranh (bão hòa ×1,15, tone Neutral). `unproject` rồi `project` lệch < 0,5 px ở 3 góc nghiêng × 4 hướng; bấm chọn đúng điểm sân như 2D; sân trống trong ngân sách ở High và Medium |
| **C4** model map 1 | 01/11 | Mọi model map 1 có bậc High và Medium trong manifest, qua preset và ghi chú sửa của `3D_IMPORT_2026-10-28.md`; Barracks dựng lại cao 4,5–5 m; `usedBy` trong `SOURCES.json` điền đủ; `media-budget.mjs` đạt bảng §5; điều phối viên chạy `media:push` |
| **C3** mặt đất | 02–03/11 | Sân 96 m cộng viền 40 m; dấu cao (Đồi Cầu Vồng, vách Thác Bạc ngoài sân); đường lấy từ `groundLanes` có mép mòn; suối trong rect nước, có bờ và lau sậy; 2 Wooden Bridge đúng rect; sân đá quanh Fort và quặng. Mọi rect của sim khớp hình 3D trong 0,25 m (test so mẫu lưới với bản đồ sim). Thiếu ảnh 095, 097 thì bắt đầu bằng màu phẳng |
| **C6** nhà | 04–05/11 | Nhà theo loại và cấp, bộ cấp chồng lên, socket `FX_top`, `word`, `perch`, `lantern_0..4`; xây (giàn tre, model mọc 1,2 s), nâng cấp (bộ cấp rơi nảy, vòng tầm quét ra), bán (ván bay đi), tê vì rễ; đèn lồng Nhiệt, huy hiệu nhịp, cờ cấp; bóng ma đặt nhà (vòng xanh hoặc đỏ, cây luật đỏ, cảnh mờ); ô Rice Field theo trạng thái (098); đống vàng Gold Mine. `td-1b-build` đạt trên 3D; `td-scale` lệch ≤ 20 % |
| **Mốc giữa** | 06/11 | Một giám khảo độc lập (agent không làm làn nào của Lời Gọi) chấm sân khấu, đất và nhà trên tờ khung: 3 góc nghiêng × 4 hướng, High và Medium, Ngày và Đêm. ≥ 8: đi tiếp. 7–7,9: đi tiếp, ghi việc sửa vào C14. < 7: dừng trước C10, sửa hướng hình cùng chủ dự án. Điều phối viên đếm lại dòng (§3) |
| **C10** thẻ chữ trên 3D | 06–08/11 | Neo thẻ ở `FX_top` + 0,6 m qua phép chiếu 3D, giữ bộ xếp làn `lanes.ts`; khay mép ≤ 6, bấm khay thì camera lướt 0,45 s; mặt nạ vùng yên cho hạt cộng sáng; kẹp cột tránh HUD khi zoom; chữ bay vào `FX_core` thành hạt chữ cái; mỗi phím đúng có một nhịp nhìn thấy. Cổng `td-words`, `td-scale`, `td-hud-budget` |
| **C13** hiệu năng, mặc định | 09–10/11 | `td-1b-perf` trên 3D ở High và Medium đạt bảng §6; model theo bậc, chỉ map 1; Low hay WebGL lỗi dùng 2D; đổi mặc định sang Medium và thêm hàng "Chất lượng hình"; byte tới Đêm 1 ≤ 6 MB |
| **C14** kiểm cổng cuối | 11/11 | Mọi `td-*` ở hai cỡ, thêm `td-words`, `td-scale`, `td-hud-budget`, `td-loot`, `td-scenery`, `map1-play`, `map1-newplayer`; giám khảo độc lập ≥ 8/10 ở 3 góc nghiêng × 4 hướng; ván vàng không đổi. **Đo lại khoảng chờ ban ngày (A2, đề xuất 6 đã duyệt):** phần mẫu 1 s không có chữ; nếu vẫn quá 50 % thì đề xuất áp cách tự tua của Rồng. Chủ dự án chơi B9 ngày 12/11 |

Các làn khác của Lời Gọi chạy song song theo §4.2 của MAP1_PRODUCTION: L2 (C5, C8, A13, A3) từ 03/11, L4 (C12, C11) từ 05/11, L3 (C7, C9, A1) từ 06/11. Mỗi làn một nhánh tách từ `td-1c` sau C2, chỉ sửa file của mình ở §7.

## 9. Luật chạy làn

- Dev server Vite cổng 4150 (`--strictPort`), DevTools trong dải 4150–4159 tới khi phiếu 102 vào kit. Mọi lượt trình duyệt chạy qua `.local/bin/heavy.sh` (lượt đo hiệu năng: `--gpu`, mỗi lúc chỉ một lượt `--perf`). Tắt mọi thứ mình bật.
- Ảnh chụp vào `tmp/lane-l/` của worktree; xong thì xóa khung thô của mình bằng `tools/capture-prune/prune.mjs` (chạy thử trước, rồi `--apply`), giữ tờ khung.
- `public/assets` của worktree là các liên kết tới `games/typing-defense/public/assets/typing-defense/{ui,models/*}`, để Git sạch (thư mục `models/manifest.json` được Git theo dõi).
- `src/kit` chỉ đổi qua `node scripts/sync-game-kit.mjs --target games/.wt-td-1c` ở repo cha. Cần sửa kit thì dừng và báo điều phối viên.
- Không sửa trên `td-1c` các file Codex đang làm cho tới khi phiếu đó gộp: 091 (`tests/td/typing.ts`, `scripts/td/replay.ts`, `vite.config.ts`, `public/vocabulary`), 103 (`src/ui/sheets.ts`, `src/view/words/*`).
- Tên trong game theo `docs/games/NAMES_EN.md`; câu, gợi ý, menu tiếng Việt.

## 10. Ảnh cần thêm

Đã có phiếu: 095 ô đất meadow, 097 decal đất, 098 ô Rice Field, 099 tờ khung Ghost Flame, 100 decal nứt rễ và dải bọt thác. Tranh cảnh meadow (`art-src/scenery/meadow/`) có 13 loại, mỗi loại 2 biến thể (v1, v2), trong khi TK §23.10 đòi ≥ 4. Đề xuất phiếu ảnh 106 cho Codex, xong trước khi C9 bắt đầu (07/11):

- **Việc:** v3 và v4 cho 13 loại (`almond-tree`, `bamboo-clump`, `canopy-block`, `fern`, `mountain-pine`, `raspberry-bush`, `reed-clump`, `rock-medium`, `rock-small`, `rotten-log`, `tall-grass`, `wildflowers`, và `tree-stump` ở `scenery/shared/`): 26 ảnh, ghi vào đúng thư mục đang có, không ghi đè.
- **Luật prompt** TK §23.10: một vật, toàn thân, chân ở giữa đáy, nhìn ngang cao hơn mắt ~10°, ánh sáng phẳng từ trước, tán gom khối tròn, viền mực đều, nền `#00FF00` (vật xanh lá: `#FF00FF`), cạnh dài ≥ 1024 px. Dáng khác rõ v1, v2 (cao, rộng, nghiêng), cùng bảng màu.
- **Kiểm buộc:** md5 trước và sau (chỉ thêm file); nền khóa màu tách sạch (≤ 0,5 % điểm ảnh viền còn màu khóa); chân chạm đáy trong 2 % chiều cao; tờ so v1–v4 cạnh nhau ở cỡ 1/4; tự chấm ART_ACCEPTANCE §2.2 ≥ 8, tối đa 3 lượt sinh mỗi ảnh. Claude chấm lại trước khi `prepare-scenery.mjs` dùng.

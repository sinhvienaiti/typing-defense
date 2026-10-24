# Model tĩnh của Lời Gọi (24/10/2026)

29 model Tripo không rig (nhà, nòng pháo, đống vàng, cờ cấp, đạn, đồ rơi, đồ gắn của Thư Đồng, mũ Đầu Đàn, giáo) đi qua Blender rồi đóng gói vào manifest của game. Xe goòng (`props/gold-mine-cart`) chưa có GLB.

## Tệp

| Tệp | Là gì |
|---|---|
| `presets/typing-defense-static.json` | Preset cho `pnpm models:blender`: mỗi khoá `<loại>/<id>` có `source` (GLB gốc trong `art-src/3d`), `triangles` (= face limit Tripo), `static` (hướng, cỡ, gốc, màu, vật liệu, socket, kiểm cỡ). `reviewed: false` tới khi chủ dự án duyệt. |
| `model-contracts.ts` | Hợp đồng model cho công cụ (loại `buildings`, `props`, `projectiles`, `loot`, `attachments`; socket bắt buộc của nhà theo TK 23.9). Game chưa có 3D; ở 1C chuyển file này vào `src/render3d/`. |
| Repo cha `scripts/models/blender/static_model_tools.py` | Bộ Blender cho model không rig (dùng chung mọi game). |

## Lệnh (ở thư mục `typing-game`)

```bash
pnpm models:blender --root games/typing-defense --preset games/typing-defense/scripts/models/presets/typing-defense-static.json [--preview <thư mục ảnh>] [--only <khoá>]
pnpm models:index --root games/typing-defense --preset games/typing-defense/scripts/models/presets/typing-defense-static.json
```

- Ra: `art-src/models/<loại>/<id>.glb` (bản Blender, không vào Git), báo cáo `art-src/models/.reports/<loại>__<id>.json`, bản High/Medium ở `public/assets/typing-defense/models/<loại>/<id>/`, manifest `public/assets/typing-defense/models/manifest.json` (manifest vào Git, GLB không).
- Bản gốc `art-src/3d/**` không bị sửa. Texture mới được ghi thành ảnh mới trong GLB đã xử lý.

## Blender làm gì với mỗi model

1. Nhập GLB với `merge_vertices` (nhập thường thì lưới bị cắt ở đường nối UV, giảm mặt sẽ nứt).
2. Xoay: mặt trước về −Z, +Y lên. Tripo đặt mặt trước ảnh ở +X nên nhà, đồ rơi, mũ, kính, khăn quay 90°. Mũi tên, mũi nỏ đã nằm mũi về −Z. Nòng pháo và đuôi Phẩy quay 180°. Bút, búa, giáo dựng đứng (đầu lên +Y), trống con cán xuống −Y.
3. Cỡ: nhà theo vòng chiếm chỗ (bề ngang chân = 2r, không tính bục trợ lực), không quá trần chiều cao (`maxHeight`). Đồ khác theo dòng "Cỡ" của file 01, 02.
4. Gốc: nhà ở tâm vòng trên mặt đất; đồ đứng ở tâm đáy; đạn, nòng pháo ở tâm; đồ cầm ở chỗ nắm; kính ở giữa mặt trước; đuôi ở đầu núm cắm; mũ ở tâm vành dưới; cờ ở chân cán.
5. Giảm mặt về face limit, khoá đường nối UV và mép hở, giữ pháp tuyến cũ.
6. Màu: so màu trung bình của texture (không ánh sáng) với ảnh 2D. Texture Tripo vốn đã gần ảnh 2D (lệch dưới 10 %); chỉ chỉnh nhẹ, không làm tối, không vượt màu ảnh.
7. Vật liệu: Tripo gắn kim loại cho vàng, đồng (đống vàng 0,41–0,96, rương 0,56, nòng 0,66, kính 0,68). Trong ánh sáng PBR chỗ đó thành nâu tối; đây là lý do "vàng ngả nâu". Mọi model đặt kim loại 0, độ nhám tối thiểu 0,5 (đồ chơi sơn tay, TK 23.1).
8. Socket `FX_*` (Empty). Nhà: `FX_core`, `FX_top`, `FX_word` (= top + 0,25 m), `FX_perch` (= top + 0,6 m; Pháo, Đài Ấn ở mép sau), `FX_assist`, `FX_crew`, `FX_banner`, `FX_lantern_0..4`; thêm `FX_muzzle` (Lũy, Tháp Cung), `FX_turret` (tâm mâm xoay Pháo, chỗ gắn nòng), `FX_spawn` (cổng Trại Lính), `FX_pile`, `FX_rail_0/1` (Mỏ). Nòng: `FX_muzzle`. Rương: `FX_hinge`. Giáo: `FX_TOOL` (mũi).

## Cần chủ dự án quyết

| Việc | Chi tiết |
|---|---|
| Chiều cao nhà (đã quyết 24/10/2026) | Lũy: ngoại lệ phóng đều ×1,2 (`size.metres` 8,4), cao 8,01 m, vòng Ø 8,4 m (r 4,2), mốc cao nhất; socket dạng tia nhân ×1,2. Tháp Cung: trần 7,0 m (cao 7,00 m, chân thật Ø 3,32 m); socket nhân 7,0/7,5. Mỏ Vàng 3,83 m và Đài Ấn 2,25 m: chấp nhận như model. Trại Lính 1,8 m: model tạm, chủ dự án làm lại từ `~/Downloads/td-tripo-2d/buildings/barracks-v2.png`. Bảng ở TK 23.2. Ảnh kiểm: `/Users/toandx/AudioLab/work/_td-models/prep/heights/`. |
| Mũ Đầu Đàn | Thân mũ rộng 0,86 m (mũ thường 0,78 m, +10 %) thì mũ cao 0,76 m, gấp khoảng 2,5 lần mũ thường (thiết kế ghi gấp đôi). |
| Xe goòng | Chưa có `art-src/3d/props/gold-mine-cart.glb`: tạo bằng Tripo (Image to 3D, face limit 2000, không rig), rồi chạy lại hai lệnh trên. |
| Duyệt | Ảnh so sánh: `/Users/toandx/AudioLab/work/_td-models/prep/contact-*.png`. Duyệt xong thì đổi `reviewed` thành `true`. |
| Chưa làm | Clip nhà (`Building_Idle`, `Building_Fire`…), tách nắp rương, tách cánh cổng Lũy: thuộc bước rig/clip. |

# Rig thử: Lam và Cương Thi (24/10/2026)

Hai model Tripo không rig được gắn xương, trọng lượng và clip bằng Blender, không cần tài khoản nào. AI không nặn hay dựng lại lưới: chỉ xoay, phóng, giảm mặt, chỉnh vật liệu, thêm xương, socket và clip.

## Tệp

| Tệp | Là gì |
|---|---|
| `presets/td-rigs/lam.json`, `presets/td-rigs/cuong-thi.json` | Preset rig: nguồn, hướng, cao, face limit, vị trí xương (mét; Z lên; mặt nhìn −Y; +X là tay trái nhân vật; gốc giữa hai chân), vùng trọng lượng, lò xo, socket, danh sách clip. `reviewed: false` tới khi chủ dự án duyệt. |
| `blender/td_rig_tools.py` | Dựng: nhập GLB (gộp đỉnh đường nối UV), xoay, phóng, giảm mặt, vật liệu mờ, xương, trọng lượng, socket, clip, xuất `art-src/models/<loại>/<id>.glb` (mặt trước −Z). |
| `blender/td_rig_clips.py` | Clip: chuyển clip CC0 sang xương của model (theo hướng xương, biết tư thế nghỉ, tại chỗ), clip viết bằng tư thế khoá (`"script": "keys"`), clip Cương Thi (`jiangshi_*`), lò xo nướng sẵn cho đuôi, tai, túi, vạt áo, bùa. |
| `blender/td_rig_review.py` | Kiểm: ảnh từng clip (trước, cạnh, camera game 55°), sheet, bản đồ giãn lưới, số đo (giãn cạnh, tam giác sập, đầu cứng, trượt chân, xuyên đất, mối nối vòng lặp). |
| `blender/td_rig_compare.py` | Thử tư thế khó (tay qua đầu, khuỷu 90°/120°, ngồi xổm, nhấc chân, vặn lưng 35°, quay đầu 45°) và so với một rig khác (Tripo Auto Rig) cùng clip, cùng camera. |
| `blender/td_rig_survey.py` | Ảnh chiếu thẳng có kích thước, để đặt xương theo mốc của lưới. |
| `art-src/anim/mesh2motion/*.glb` (không vào Git) | Xương người và clip CC0 của Mesh2Motion (Quaternius Universal Animation Library). Tải lại: `github.com/mesh2motion/mesh2motion-app`, thư mục `static/rigs` và `static/animations`. |

## Lệnh (ở thư mục `games/typing-defense`)

```bash
B=/Applications/Blender.app/Contents/MacOS/Blender
$B --background --factory-startup --python-exit-code 1 --python scripts/models/blender/td_rig_tools.py -- \
  --spec scripts/models/presets/td-rigs/lam.json --root . --work <thư mục làm việc>
$B --background --factory-startup --python scripts/models/blender/td_rig_review.py -- \
  --blend <thư mục làm việc>/lam.blend --out <thư mục ảnh> --mode clips     # hoặc --mode bones
# ở thư mục typing-game:
pnpm models:prepare --root games/typing-defense --contracts games/typing-defense/scripts/models/model-contracts.ts --only heroes/lam,enemies/cuong-thi
```

Mỗi lần chỉ chạy một Blender (máy 16 GB). Dựng Lam mất khoảng 10 giây, Cương Thi 4 giây; kiểm một model 20–60 giây.

## Kết quả

| Model | Xương | Clip | Ghi chú |
|---|---|---|---|
| `heroes/lam` (2,7 m, 20.000 tam giác) | 31: người Mesh2Motion không ngón (23) + đuôi 5 + tai 2 + túi thư 1 | 13: `Hero_Idle`, `Hero_Run`, `Hero_Attack`, `Hero_Skill1`, `Hero_Skill2`, `Hero_Ult`, `Hero_Assist`, `Hero_Hit`, `Hero_Death`, `Hero_Respawn`, `Hero_Victory`, `Hero_Idle_Fidget`, `Hero_Dash` | Đầu và mũ trùm cứng; ống thư cứng theo lưng. Socket `FX_HAND_R/L`, `FX_HEAD`, `FX_CORE`, `FX_FEET`, `FX_TOOL` (miệng túi thư). `Hero_Run` cần phát nhanh ×1,25 ở 6,5 m/s (chân trụ lùi 5,2 m/s). |
| `enemies/cuong-thi` (1,7 m, 5.813 tam giác) | 28: người không ngón + vạt áo 4 + bùa 1 | 5: `Enemy_Idle`, `Enemy_Move` (nhảy hai chân, tay duỗi trước), `Enemy_Attack`, `Enemy_Hit`, `Enemy_Death` (đổ ngửa cứng như tấm ván) | Đầu, mũ cứng; bùa đung đưa ra phía trước, không đập vào mặt. Socket `FX_HEAD` ở tâm vành dưới mũ (chỗ đội mũ Đầu Đàn). |

## Cần chủ dự án quyết

| Việc | Chi tiết |
|---|---|
| Duyệt clip | Sheet ở `/Users/toandx/AudioLab/work/_td-models/rig/<id>/<clip>/sheet.png`, thử tư thế khó ở `.../rig/<id>/stress/stress_sheet.png`, so với Tripo ở `.../rig/compare-lam/<clip>/compare.png`. Duyệt xong thì đổi `reviewed` thành `true`. |
| Tay áo Cương Thi | Lưới Tripo dính mặt trong tay áo vào thân áo từ nách xuống cổ tay (khoảng 24 cạnh mỗi bên). Khi tay giơ ngang, phần dính căng thành dải vải mỏng dưới tay; giơ qua đầu thì thành màng rõ. Không xoá mặt nào (luật không sửa lưới). Chọn: giữ (ở camera game gần như không thấy), cho phép tách khoảng 25 mặt mỗi bên, hoặc làm lại ảnh 2D có khe rõ giữa tay áo và thân rồi tạo lại bằng Tripo. |
| Rig Tripo của Lam | `Lam_skeleton_3d.glb` không dùng được: 14.071/14.132 đỉnh gắn cứng vào `Hips` (mỗi đỉnh 1 xương), nên tay, chân, đầu, đuôi không bao giờ cong; khung xương lúc gắn lệch 90° và thấp hơn lưới; trong three.js lưới hiện ra bị xoay và lún 0,41 đơn vị. Không cần tốn thêm credit Tripo cho rig nhân vật. |

## Sửa theo bản duyệt 24/10/2026 (Lam, Cương Thi)

| Việc | Đã làm | Số đo (trước → sau, `td_rig_review.py`) |
|---|---|---|
| `FX_HAND_L` gắn nhầm `hand_r` | `mirror_name` đổi cả hai chiều (`_l`↔`_r`, `_L`↔`_R`); chỉ mục `_l` mới sinh bản đối xứng (`left_twin`, nên `bag_r` của Lam vẫn một mình); `load_spec` dừng nếu socket `_L` nằm trên xương `_r` hoặc ngược lại | Lam, Cương Thi: `FX_HAND_L` trên `hand_l` |
| Mặt bị che khi thân cúi | `headLevel` (preset): mặt không cúi quá −5°; cổ, đầu (Lam thêm `spine_03`) xoay bù | Lam Run: mặt −39,7° → −5°, góc mặt–camera 55° lớn nhất 102,7° → 71,6° (Dash 97,5° → 64,5°, Fidget 88,9° → 66,2°); Cương Thi Hit −31,7° → 0° |
| Run chúi như mổ thóc | `lean` (clip): độ chúi giữ đều; `td_rig_post.steady_lean` lặp tới khi khớp | Lam Run 24,2–26,6° → 14,4–14,7° |
| Cú vuốt thấp, sát thân | Attack và Skill1 viết lại: vung ngang rộng ở tầm vai (giương sau phải → đâm thẳng trước → kết thúc trước trái), xoay hông và lưng ±30° | Góc quét của tay ở xa trục thân ≥ 0,6 m (nhìn từ trên): Attack 107° → 154°, Skill1 111° → 169° |
| Trượt chân | Clip khoá (`feetLock` + `feet` mỗi khoá): IK hai xương giữ chân trụ, bước đổi chỗ thành bước nhấc ngắn có vòng cung; clip CC0 (`lockFeet`): chân gần đất kéo về thế đứng Idle | m/s khi chân chạm đất: Attack 0,72 → 0, Skill1 0,72 → 0, Skill2 1,9 → 0,01, Victory 1,65 → 0,2, Respawn 0,8 → 0, Ult 0,6 → 0,35; Cương Thi Attack 0,15 → 0, Hit 0,6 → 0 |
| Cương Thi Move chạm đất lâu | `jiangshi_hop`: 3/14 khung chạm đất (đáp, nén, bật), còn lại bay theo đường parabol; `airborne` ghi cửa sổ bay vào metadata | Khung chạm đất 6 → 2 (cặp khung liền); bay 0,125–0,583 s của 0,583 s: game chỉ di chuyển thân trong cửa sổ này (tốc độ ÷ 0,79) |
| Đuôi, tai lệch cuối clip | `settle` 6 khung (preset): xích lò xo về tư thế Idle ở cuối clip một lần | Lệch cuối so với Idle: Attack 36°, Skill1 42,5°, Hit 48,3°, Victory 40,1° … → 0°. Metadata `crossfade_s`: 0,1 s khi đã về Idle, 0,15 s cho clip lặp (đuôi đang đung đưa) và Death |
| Nhìn theo mục tiêu | `lookAt` (preset) → extras GLB `td_lookAt`: ±20° | — |
| Bảng Death cắt thân | Camera từng clip tự nới khi lưới ra khỏi khung | Thấy trọn tư thế nằm cuối |
| Cương Thi Hit | `recoil: "back"`: bật ngửa cứng, mặt hướng camera, không cần xoay cổ bù | Cạnh giãn > 1,6: 82 → 94 (không thấy ở 22–32 px) |

Còn lại: Dash giãn lưng và mũ trùm nhiều hơn (585 → 652 cạnh) vì đầu xoay bù tới 31° để thấy mặt; ở 45 px không thấy. Ult còn trượt 0,35 m/s ở hai khung nhấc gót.

Metadata clip trong GLB (extras của nút xương, `td_rig_attach.extras`): `td_clips` = `{clip: {loop, seconds, crossfade_s, notes, airborne_s?, groundFrames?, groundSpeed_mps?}}`, `td_lookAt` = `{bone, yawDeg, pitchDeg}`.

Kiểm thêm trong `td_rig_review.py`: `facePitchMinDeg`, `faceToGameCamMaxDeg` (0 = mặt nhìn thẳng camera game; lúc đứng khoảng 60–65), `torsoLeanDeg`, `handArcTop` (`sweepDeg`, `wideSweepDeg`, `reachMax_m`), `chainStartOffsetDeg` / `chainEndOffsetDeg` (so với khung đầu Idle), `_sockets` (xương cha và xương gần nhất của từng `FX_`), và `contact.png` (mỗi clip một hàng ảnh camera game). Không đổi `pose_position` sang REST trong lúc kiểm: Blender 5.2 ngừng tính lại khung sau đó.

Ảnh: `/Users/toandx/AudioLab/work/_td-models/rig/<id>/<clip>/sheet.png`, `/Users/toandx/AudioLab/work/_td-models/rig/<id>/contact.png`, trước/sau ở `/Users/toandx/AudioLab/work/_td-models/rig/lam/_evidence/` và `/Users/toandx/AudioLab/work/_td-models/rig/<id>/_before-fix/`; số đo `checks-after-review-fixes.json`.

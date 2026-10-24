# 2026-10-24 — Model Lời Gọi: rig người lô 1 và lô quái, Thư Đồng (công cụ Blender)

Commit: nhánh `main` của repo `games/typing-defense`, xem `git log`. Gồm commit `fc10c32` (rig Lính Giáo, Tanuki, Troll; changelog chưa có lúc đó) và commit rig sau nó (lô quái, Thư Đồng, đồng màu texture). Chỉ sửa công cụ model (`scripts/models/**`) và preset. Không sửa `src/`. GLB, ảnh không vào Git.

## Đã làm

- **Lô người 1** (`fc10c32`, chi tiết ở `scripts/models/README.md` mục "Rig người lô 1"):
  - Lính Giáo (24 xương, 8 clip, giáo là lưới thứ hai trên xương `spear`), Tanuki (28 xương, đuôi và lá, 6 clip), Troll (25 xương, váy da theo đùi, khiên cứng, 6 clip).
  - Bước sau clip `td_rig_post.py`: IK chân và tay, xoay bù đầu, độ chúi đều, lắc cộng thêm, xích về Idle, tốc độ mặt đất.
  - `td_rig_attach.py`: đồ cầm thành lưới skinned thứ hai, metadata GLB `td_clips`, `td_lookAt`, `td_attachments`.
- **Lô quái và Thư Đồng** (commit sau `fc10c32`):

  | Model | Xương | Clip | Ghi chú |
  |---|---|---|---|
  | `enemies/nuppeppo` (2,0 m, 6.000 tam giác) | 7: khối mềm `belly` → `body` → `head`, hai tay, hai chân | `Enemy_Idle`, `Enemy_Move`, `Enemy_Attack`, `Enemy_Hit`, `Enemy_Death` (chảy thành vũng khi chết vì nổ), `Enemy_Death.split` (chết thường: sự kiện tách, game ẩn lưới và sinh hai Nuppeppō con) | Clip viết bằng mã (`td_rig_creatures.py`): bóp giãn giữ thể tích, thân và đầu trễ nhịp như thạch |
  | `enemies/thuong-luong` (đầu ngóc 2,4 m, thân 5,3 m) | 27: xương rắn Mesh2Motion CC0, 22 đốt đều dọc đường giữa thân (`fitChain`), túi cổ, hàm dưới, râu | `Enemy_Idle`, `Enemy_Move` (trườn), `Enemy_Attack` (cắn), `Enemy_Hit`, `Enemy_Skill` (phun vòng nước, sự kiện ở 0,75 s), `Enemy_Death` (đổ nghiêng) | Thiết kế ghi thân khoảng 6 m; `td-scale` đo đầu ngóc |
  | `enemies/mam-go` (1,6 m, 6.000 tam giác) | 18: thân gỗ, cuống và hai lá lò xo, tay cành | `Enemy_Idle`, `Enemy_Move` (nhảy hai chân), `Enemy_Attack`, `Enemy_Hit`, `Enemy_Death` (héo, giữ khung cuối) | Texture Tripo mặt trước nâu đỏ sẫm, mặt sau xám nhạt: `td_rig_colour.py` (`colourUnify`) đưa cả hai về gỗ sáng và lá vàng chanh của ảnh 2D, chỉ đổi màu texture |
  | `helpers/helper-owlet` (1,2 m, 8.000 tam giác) | 17: cú non chung cho Chấm, Phẩy, Gạch; cánh trên xương tay, bảng đá cứng | 13: `Helper_Idle`, `Helper_Walk` (nhảy chim), `.carry`, `Helper_Assist` và bốn biến thể theo nhóm nhà (`.tower`, `.drum`, `.craft`, `.support`), `Helper_Cheer`, `Helper_Catch`, `Helper_Scared` (hoảng, BUILD_1B §5.5 R2), `Helper_Hit`, `Helper_Intro` | Socket đồ gắn: `FX_GLASSES`, `FX_SCARF`, `FX_TAIL`, `FX_WINGBAND_L/R`, `FX_HAND_R/L`, `FX_CARRY`. Đồ của Thư Đồng chỉ vẽ trong bảng duyệt (`previewItems`), không xuất vào GLB |
  | `bosses/moc-tinh` (7 m, 29.177 tam giác, không giảm) | 21: người không ngón + hai ngón rễ, tán lá 9 khối lò xo | Mới có `Boss_Idle` | **Đang làm:** bố cục xương và vùng; chưa có clip đòn, chưa xuất GLB |

  - Công cụ: `td_rig_creatures.py` (clip viết bằng mã cho khối mềm và rắn, khoá scale), `td_rig_colour.py` (đồng màu texture theo vùng), `td_rig_clips.py` (xương không phải người ghép theo tên, tư thế tham chiếu của rắn), `td_rig_tools.py` (`fitChain`, khoá scale trong FK và kẹp mặt đất), `td_rig_review.py` (góc nhìn `top` cho rắn và chim, đồ gắn theo clip).

## Kiểm trên máy Dell (WSL, Blender 5.2.3 Linux, 24/10/2026)

Chạy với `--no-export` hoặc `--mode bones`, nên `art-src/models/**` (trong khoá media) không bị ghi đè. File `.blend`, báo cáo và ảnh ở `tmp/dell-2026-10-24/rig/` (ngoài Git).

| Model | Lệnh | Kết quả |
|---|---|---|
| `enemies/nuppeppo` | `td_rig_tools.py` dựng đủ, `--no-export` | Đạt, 11 s: 5.910 tam giác, 6 clip (sự kiện `land`, `takeOff`, `impact`, `split` có trong báo cáo) |
| `enemies/mam-go` | như trên | Đạt, 97 s: 5.840 tam giác, 5 clip, `colourUnify` chạy (vùng `bark`, `leaf`) |
| `enemies/thuong-luong`, `helpers/helper-owlet`, `bosses/moc-tinh` | `--mode bones` (xương, trọng lượng, socket, đồ gắn) | Đạt: 5.652, 8.000, 29.177 tam giác |
| `enemies/nuppeppo` | `td_rig_review.py --mode clips` | Dựng ảnh được (bản đồ giãn lưới của `Enemy_Idle`, đã xem: không có cạnh giãn); dừng ở bước ghép bảng vì máy chưa có ImageMagick 7 (`magick`). Ghép bảng trên máy này cần cài `magick` |

- Lệnh trong `scripts/models/README.md` ghi đường Blender của Mac; trên máy Dell dùng `$BLENDER_BIN` (đặt bởi `scripts/local-env.sh` của repo cha), chạy từ `games/typing-defense`.

## Việc của chủ dự án (còn mở)

- Duyệt bảng ảnh của từng model (`contact.png`, `<clip>/sheet.png`), rồi đổi `reviewed` thành `true` trong preset. Bảng ảnh của lô này nằm trên máy Mac (`~/AudioLab/work/_td-models/rig/<id>/`), không có trên máy Dell; dựng lại được bằng `td_rig_review.py` (lệnh ở `scripts/models/README.md`).
- Các mục "Cần chủ dự án quyết" của lô người 1 trong `scripts/models/README.md` (lá Tanuki, Troll hóa đá, Lính Giáo ngửa đầu 18°, tư thế nghỉ của giáo) vẫn để chủ dự án duyệt bằng mắt.
- Mộc Tinh: chưa có clip đòn (Rễ Trồi, Quật cành, choáng, rút lui); làm tiếp ở bước rig sau, trước 1C.

## Thiếu trên máy này

- Ảnh duyệt và ảnh 2D làm lại ở thư mục riêng của máy Mac (`~/AudioLab/work/_td-models/**`, `~/Downloads/td-tripo-2d/**`).
- `art-src/models/bosses/moc-tinh.glb` (chưa dựng ở đâu cả).
- Có đủ: GLB gốc Tripo của cả năm model ở `art-src/3d/**`, ảnh 2D ở `art-src/**`, clip CC0 ở `art-src/anim/mesh2motion/`, bản đã dựng của bốn model ở `art-src/models/**` (trong khoá media `media.md5`).

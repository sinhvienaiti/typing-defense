# 2026-10-24 — Model Lời Gọi: sửa rig Lam và Cương Thi theo bản duyệt, chốt chiều cao nhà

Commit: nhánh `main` của repo `games/typing-defense`, xem `git log`; đã đẩy lên `origin/main`. Chỉ sửa công cụ model (`scripts/models/**`), preset, tài liệu và manifest. Không sửa `src/`. GLB, ảnh không vào Git.

## Yêu cầu

- Sửa lỗi bắt buộc của bản duyệt rig: `FX_HAND_L` gắn nhầm xương tay phải. Sửa các điểm nên sửa ở Lam và Cương Thi: mặt bị che khi thân cúi, Run chúi như mổ thóc, cú vuốt hẹp, trượt chân, Cương Thi chạm đất lâu khi nhảy, đuôi và tai lệch cuối clip, bảng Death cắt thân. Dựng lại, chụp lại, xem ảnh.
- Chốt chiều cao nhà theo quyết định của chủ dự án.
- Tạo ảnh 2D Trại Lính cao hơn bằng Codex trên máy để chủ dự án dựng lại trong Tripo.

## Đã làm

- **Socket:** `mirror_name` đổi tên cả hai chiều. Chỉ mục bên trái mới sinh bản đối xứng. `load_spec` dừng nếu socket nằm sai bên. Kiểm bằng `scripts/models/blender/td_rig_check.py`.
- **Mặt:** nếu thân cúi, cổ và đầu xoay bù để mặt không cúi quá −5°.
  - Lam Run: mặt cúi −39,7° → −5°.
  - Góc giữa mặt và camera game: 102,7° (mặt khuất hẳn) → 71,6°.
- **Run:** độ chúi giữ đều 14,4–14,7°, trước là 24,2–26,6°.
- **Cú vuốt Attack và Skill1:** vung ngang ở tầm vai, tay duỗi thẳng. Góc quét ở xa thân (nhìn từ trên):
  - Attack: 107° → 154°.
  - Skill1: 111° → 169°.
- **Trượt chân:** chân trụ được giữ yên bằng IK. Bước đổi chỗ thành bước nhấc ngắn. Tốc độ trượt khi chân chạm đất, m/s:

  | Model | Clip | Trước | Sau |
  |---|---|---|---|
  | Lam | Attack | 0,72 | 0 |
  | Lam | Skill1 | 0,72 | 0 |
  | Lam | Skill2 | 1,9 | 0,01 |
  | Lam | Victory | 1,65 | 0,2 |
  | Lam | Respawn | 0,8 | 0 |
  | Lam | Ult | 0,6 | 0,35 |
  | Cương Thi | Attack | 0,15 | 0 |
  | Cương Thi | Hit | 0,6 | 0 |

- **Cương Thi Move:** mỗi cú nhảy chỉ chạm đất 3/14 khung, còn lại bay.
  - Metadata ghi cửa sổ bay 0,125–0,583 s. Game chỉ đẩy thân đi trong cửa sổ này, nên chân chạm đất không trượt.
  - Hit đổi thành bật ngửa cứng, mặt hướng lên camera.
- **Đuôi, tai, vạt áo, bùa:** về đúng tư thế Idle ở 6 khung cuối mỗi clip một lần.
  - Lệch cuối clip: 36–48° → 0°.
  - Metadata `crossfade_s` trong GLB: 0,1 s khi đã về Idle; 0,15 s cho clip lặp và Death.
  - Nhìn theo mục tiêu giới hạn ±20° (`td_lookAt`).
- **Bảng ảnh:** camera tự nới khi lưới ra khỏi khung, nên bảng Death thấy trọn tư thế nằm. `contact.png` là trang tổng của mỗi model.
  - Số đo mới: hướng mặt, độ chúi, cung tay, độ lệch xích so với Idle, socket.
  - Bỏ lần đổi tư thế sang REST trong lúc kiểm: trên Blender 5.2, đổi xong thì các khung sau không được tính lại.
- **Chiều cao nhà** (TK 23.2, file 02 mục 3.2 và P1, P2, P5, P6, P16):

  | Nhà | Quyết định | Kết quả |
  |---|---|---|
  | Lũy | Phóng đều ×1,2 | Cao 8,01 m, vòng Ø 8,40 m (r 4,2). Là nhà cao nhất. |
  | Tháp Cung | Trần 7,0 m | Cao 7,00 m, chân thật Ø 3,32 m |
  | Mỏ Vàng | Chấp nhận như model | 3,83 m |
  | Đài Ấn | Chấp nhận như model | 2,25 m |
  | Trại Lính | Giữ làm model tạm | 1,8 m |

  - `td-scale` đo nhà cấp 1 theo chiều cao model và báo lỗi nếu nhà nào cao hơn Lũy. Với Trại Lính tạm thì chỉ cảnh báo.
- **Ảnh Trại Lính mới:** `~/Downloads/td-tripo-2d/buildings/barracks-v2.png` (kèm `.prompt.txt`), lấy lần thử 2 trong 3.
  - Nhà trại hai tầng có sàn canh, rào ôm sát, nền sáng trơn.
  - Đo trên ảnh: cao khoảng 1,1 lần bề ngang, tức khoảng 4,5 m trên vòng 4 m.
  - Đã thay khoảng 175 điểm ảnh màu xanh ở khe dưới giá trống và bục bằng màu nền.

## Việc của chủ dự án

- Tripo: dựng `barracks-v2.png` (Image to 3D, face limit 10000, không rig). Lưu đè `art-src/3d/buildings/barracks.glb` sau khi giữ bản cũ, hoặc báo AI tên file mới.
- Duyệt bảng ảnh `/Users/toandx/AudioLab/work/_td-models/rig/<id>/contact.png`, rồi đổi `reviewed` thành `true`.
- Bước 1C: đổi cỡ Lũy trong luật đặt nhà sang vòng Ø 8,4 m (`src/content/slice-1a.ts` đang ghi XL).

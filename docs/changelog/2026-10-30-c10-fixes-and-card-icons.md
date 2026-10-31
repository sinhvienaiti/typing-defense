# C10 vòng 5 · Năm sửa trên thẻ chữ; icon chờ nhận

Ngày 30/10/2026, phiếu Codex 203, worktree `td-ui` trên `2a1f61d`, sau phiếu 200. Hai giám khảo vòng 4 cùng chấm C10 8,0 nhưng khay chỉ 7,0–7,5: thẻ đang trượt và chữ đóng dấu đè HUD, ×N bị cắt ở mép trái, chữ đầu chung mất màu, viền xong từ mềm và chữ đóng dấu đến chậm.

- `keepIn` tìm phép dời ít nhất trong vùng an toàn 8 px và ngoài các hộp HUD; hết chỗ thì trả vị trí kẹp gần nhất cùng `ok: false`. Áp sau nội suy, scale, nghiêng và bóp của thẻ ở mỗi khung; cả chữ đóng dấu lớn nhất, nhãn hạng đang nâng, điểm cuối và đường bay của chữ. ×N thử phía hiện tại, phía đối diện, trên thẻ rồi kẹp. Dùng hộp HUD hiện có, không đổi bố cục hay luật chơi.
- `trayPointer` dùng một chữ V 90°, cùng hình học ở bốn mép, cỡ cơ sở 16/24 px, giới hạn hướng ±60° quanh pháp tuyến, tránh thanh nhập 8 px. Bên trái đặt dưới dòng từ. Kho hiệu ứng vẫn vẽ V bằng hai cánh mảnh trên lớp mực; chưa thay bằng ảnh 165.
- `typedShown` giữ chữ đầu màu ngọc trên mọi thẻ của nhóm đang mở, trả thẻ bị loại về 0 ngay khung nhóm đóng. Không sửa router/sim.
- `rimAt` cho hai khung đầu một nét trắng ấm `#FFF0D8`, blur 0, ngoài thẻ 11% chiều cao; sau 34 ms mới sang quầng mềm và tắt theo hàm mũ. Giữ bóp ngang 100 ms và khoảng trống 60 ms, tổng `SWAP_MS = 194`.
- `stampStep` cho chữ đóng dấu thật, đặt bằng JS ngay trong `draw()`: 2,4 → 1,8 → 1,3 → 1,0 trong 50 ms, −8° → 0°, cộng bậc như trước; 66 ms tắt. Chữ gốc luôn hiện màu đã gõ, kể cả chữ cuối. Giảm chuyển động: không rơi. Bỏ `td-key-hold` và pseudo-element bản sao chữ; giữ vòng ấn VFX cũ.
- `td-1c-words` đo `overHud` và `offScreen` mọi khung rAF, gồm thẻ, chữ đóng dấu thật, nhãn hạng, chữ bay, ×N và mũi tên DOM khi có; ghi số khung/tên phần tử và vi phạm theo cửa sổ chụp. Chỉ sửa và `node --check`, chưa chạy trình duyệt.

## Kiểm Codex

| Mục | Trước | Sau |
|---|---:|---:|
| `pnpm check` | 405 test / 43 file | 426 test / 46 file, exit 0 |
| `/`, gzip | 82.314 B | 83.233 B, dư 1.767 B |
| `/?title=0`, gzip | 83.754 B | 84.677 B, dư 323 B |
| Phần 3D, gzip | 171,83 kB | 172,347 kB ≤ 260 kB |
| Dòng `.ts` ngoài kit | 13.101 | 13.231 ≤ 16.500 |

Kit 42/42 file khớp. Hai ván vàng `same: true`, `changed: {}`, không ghi lại golden. 1.128 hộp lưới qua test an toàn, thêm 24 tổ hợp hình học mũi chỉ. Quét 20 file `.ts`/`.css`: còn 23 lần khớp mẫu, 19 cặp file/ký tự, đều ở danh sách chờ 133 hoặc 172; danh sách cũ thừa mục sẽ làm test đỏ. Không có test thời gian đỏ. Tách các hàm chỉ dùng cho combo/khay vào `words/tray.ts` để chúng tải cùng phần 3D; gói vào thẳng còn rất ít chỗ.

## Ảnh và phần còn lại

Đã đọc đủ hai `accept-*/verdict.md`: không có mục chấm nhận 133, 165 hoặc 172. **Bỏ toàn bộ Phần B đúng cổng B0**. Chưa gắn icon lời gọi, hạt, huy hiệu hay ảnh khay; không chép/sửa/sinh media, không sửa danh sách chọn và `art.ts` của 200. `pip-gold` chưa có trạng thái, không thêm luật mới.

Báo cáo và số kiểm: `docs/codex-queue/203-report.md`, `docs/codex-queue/203/` ở repo cha. File 200 chưa commit giữ nguyên. Không sửa kit, sim, typing, content, Build Notes hay README changelog.

Claude cần duyệt diff, chạy `td-1c-words` High ở 1280 × 720 và 1920 × 1080, xem `key-dark`, `key-multi`, `word-dark`, `combo`, `tray-in`, `tray-type`, `tray`; đo lại `keyFrames`, viền khung đầu và tránh HUD/mép màn, rồi gửi hai giám khảo C10 ở mức 8. Codex chưa có nghiệm thu thị giác. Không có media mới cần `media:push` từ phiếu 203. Các việc tương phản ×N, lệch chữ sai, Word Shot, thẻ khay trên nhà khác và TF2 giữ cho phiếu sau.

## Sửa sau kiểm lại 232 (Claude, 30/10)

- **F3:** chữ đóng dấu nhân thêm tỉ lệ phóng của thẻ trên màn (chiều cao rect / chiều cao layout của `.k`). Cỡ chữ của dấu: bản sửa đầu chép nhầm cỡ `.td-card` của td.css (18–24 px), nên dấu nhỏ hơn chữ nó che (18 so với 26 px ở 720p, 24 so với 32 px ở 1080p). Nay chữ trên thẻ (`.td-words .td-card`) và dấu cùng đọc một biến `--td-letter` đặt trên `.td-words` (`clamp(26px, 30px*--ui, 32px)`). Đo trong Chrome headless: chữ và dấu cùng 26 px ở 1280 × 720 và 32 px ở 1920 × 1080, nên ở bậc 1,0 dấu bằng đúng chữ bên dưới, khung đầu 2,4×.
- **F4:** sự kiện `chain` lại đặt `--tier` trên `.td-words`; quầng của dấu trộn `#7ff5e0` → `#ffc75c` theo bậc như bản cũ.
- **F5:** thêm test `draw()` kẹp thẻ cắt hộp chip (có `translate`, `card.x/y` dời theo) và `read()` một `wordHit` (outline `#FFF0D8`, `outlineOffset = out − width`). Chín đột biến trên F1–F5 (gồm M2, M7 của 232) đều làm test đỏ.
- `pnpm check` exit 0, 46 file / 436 test. Gói `/` 83.233 → 83.273 B, `/?title=0` 84.677 → 84.717 B (dư 283 B dưới 85.000). Golden 2/2 `same: true`. Chưa chạy `td-1c-words` trên trình duyệt.

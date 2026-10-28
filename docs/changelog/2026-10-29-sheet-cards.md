# 2026-10-29 — Lời Gọi: thẻ kết và hộp dải nghĩa

Phiếu 103, A6 và A8 của kiểm kê map 1; thực hiện ngày 28/10 trên Mac mini M4,
sau phiếu 091 (`034e86f`).

## Đã làm

- Thẻ kết chỉ ghi Knowledge khi `w.mode === "learn"` hoặc `w.knowledge > 0`.
  Đọc `World.mode` có kiểu `Mode` từ ván đang được truyền vào `Sheet.show`,
  không đọc lại thiết lập hay thêm tham số tại nơi gọi.
- Tách `columnBox` thuần trong `src/view/words/lanes.ts`: tính vị trí dọc,
  chiều cao và nửa bề rộng của toàn bộ thẻ, gồm dải nghĩa `mean`, theo kích
  thước đã đo. `WordCards.layout` dùng cùng hộp này để tách cột và đặt thẻ.
  Thẻ có slot −1 giữ kích thước thật, không bị coi là thẻ đang khóa.
- Mã hiện tại đã đưa `mean` vào cột; lỗi tái hiện được bằng test là chặn vị
  trí dọc ở 240 px khiến nhiều dải nghĩa chung cột đè nhau. Bỏ chặn này ở
  phép xếp thẻ đã đo; giữ nguyên hàm tính độ trôi theo thời gian
  `columnHeights`, thời gian `MS.mean = 1000`, màu và chữ của thẻ.
- Thêm tám ca trong `tests/td-sheet-cards.test.ts`: ba trường hợp Knowledge
  trên cả thắng/thua; cặp thẻ cùng cột, cột đông, hộp tách cột lân cận; vòng
  `draw` ở hai chiều rộng 1280/1920 với các mốc 0/500/999/1000 ms. Các node
  DOM giả chỉ phục vụ kiểm logic; chưa thay cho kiểm giao diện thật.

## Số đo và kiểm

| Mục | Trước | Sau |
|---|---:|---:|
| Test đạt | 355 / 33 file | 363 / 34 file |
| Gói `/` gzip | 84.906 byte | 84.857 byte |
| Còn dưới trần 85.000 byte | 94 byte | 143 byte |
| Dòng TypeScript game, trừ kit | 10.499 | 10.498 |

`pnpm test`, `pnpm exec tsc --noEmit`, `pnpm td:golden:check`, `pnpm build`
đều exit 0; hai golden giống hệt trước. Bốn đột biến đều exit 1: bỏ nhánh
Học, hiện Knowledge vô điều kiện, bỏ `mean` khỏi layout, phục hồi chặn
240 px. Mã được phục hồi đúng byte sau từng đột biến.

Rút gọn chú thích đầu `lanes.ts` để giữ trần dòng. Các file của 091 giữ
nguyên. Báo cáo và log ở repo cha: `docs/codex-queue/103-report.md` và
`docs/codex-queue/103/`.

## Chờ nghiệm thu

Theo phiếu, không mở server hay trình duyệt. Claude cần chạy lại các kiểm,
đọc diff, chạy `td-1b-story`, `td-theme` và cảnh Đêm 3 ở 1280 và 1920; đặc
biệt đối chiếu lại dải “kind · loại, hạng, kiểu” với thẻ “walk”. Test cặp
thẻ thông thường không chứng minh được lỗi ảnh kiểm kê; test cột đông
chứng minh được lỗi chặn 240 px và bản sửa.

# 29/10/2026 · Theo kit tiếng Anh, kiểm gói và tên file chơi thử

- Test báo cáo cân bằng theo nhãn kit mới: `Balanced`, `Standard`, tên cổng tiếng Anh, `MISSING DATA` và `PASS`; giữ các kiểm tra số và trạng thái thiếu dữ liệu.
- Thêm `pnpm deploy:pack` và `pnpm deploy:pack:local`: dựng game trước, kiểm `dist` bằng kit với `--game typing-defense`; bản local thêm `--allow-local-host`. README ghi cách dùng.
- Nút **Copy playtest data** tải `wordwoven-playtest-s<seed>-n<ngày>-<tick>.json`. Nội dung JSON giữ nguyên; `scripts/td/b9.ts` tiếp tục đọc cả tên mới và tên cũ `loi-goi-choi-thu-*.json` khi nhận đường dẫn. Cập nhật riêng dòng tên file trong tài liệu chơi thử.
- Test trước sửa: test luồng đỏ ở nhãn cũ; 8 test lệnh deploy và 1 test tên tải xuống đỏ, test CLI đọc cả hai tên đã xanh. Sau sửa: `pnpm check` xanh **380/380**, kit **33/33**, TypeScript, build và hai ván vàng qua. Test CLI mới chạy riêng ba lần xanh; đặt timeout tích hợp 20 giây để chứa việc chạy tiến trình và bot, giữ nguyên ngưỡng hiệu năng gameplay.
- Chạy thật `pnpm deploy:pack`: build qua, kiểm gói mã **1**, **69 lỗi thật**: 1 nguồn portal local và 68 URL GLB thiếu của 34 model trong manifest được chép vào gói. Bản kiểm local vẫn còn 68 lỗi. Mã runtime hiện tại không tham chiếu manifest model này; cần lọc manifest thừa khỏi gói theo quy định deploy và cấu hình nguồn portal production ở làn sau. Không sửa kit, model, luật hay golden trong phiếu này.

Báo cáo và JSON: `docs/codex-queue/170-report.md`, `docs/codex-queue/170/` ở repo cha. Chưa chứng nhận G7; không chạy server, trình duyệt hay mạng.

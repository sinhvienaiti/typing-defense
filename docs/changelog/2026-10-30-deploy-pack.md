# 30/10/2026 · Gói Wordwoven độc lập, phiếu 208

- Dùng `VITE_PORTAL_URL` chung với Dragonhold và Last Line. Mặc định trống ở bản phát hành; URL HTTP(S) tuyệt đối không có thông tin đăng nhập mới được build. Cầu học dùng phần nguồn, giữ hàng đợi khi không cấu hình portal kể cả khi bị nhúng; không gửi tin, xả hàng đợi hay yêu cầu focus.
- Plugin Vite thay đúng một khai báo `PARENT_ORIGIN` trong bộ nhớ biên dịch. Kit trên đĩa không đổi; cầu học vẫn thuộc chunk Học.
- Thêm `deploy-models.json`, danh sách trống cho `a2-days`, và `scripts/deploy/prune.mjs`. Hai lệnh `deploy:pack`/`deploy:pack:local` lọc sau build, trước kiểm gói: bỏ model không được chọn, thu gọn manifest trong `dist` nếu có chọn model, bỏ `.vite/`. Cấu hình sai dừng trước khi xóa; `public/` giữ nguyên. `pnpm build` vẫn giữ model và `.vite/`.
- Gói production: **69 lỗi → 0** (1 `local-host`, 68 `missing-model`); **55 → 53 file**, **1.205.337 → 1.167.750 byte**. Quét HTML/JS/CSS/JSON: **0** chuỗi `typing-game.local`. Demo nhà có biến qua kiểm local; kiểm production trên cùng demo vẫn báo đúng 1 `local-host`.
- `pnpm check`: **40 file, 414/414 test**, kit **33/33**; hai ván golden đều `same: true`. Ngân sách `/`: **79,60 → 79,60 kB gzip**; `/?title=0`: **81,07 → 81,30 kB**, dưới 85 kB.

Làn L (`td-1c`) điền danh sách model từ `STARTER` và `NIGHT_1` trong `scripts/td/media-budget.mjs` ở mốc C13. Phiếu này không mở hoặc sửa worktree của làn L.

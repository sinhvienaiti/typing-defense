# Wordwoven

## Dựng và kiểm gói

Chạy `pnpm deploy:pack` để dựng game, lọc model và dữ liệu build nội bộ, rồi kiểm thư mục `dist` bằng bộ kiểm gói của kit, với mã game `typing-defense`. Lệnh dừng nếu build, lọc hoặc kiểm gói lỗi. Đây là bước dựng và kiểm `dist`, chưa chép sang `.deploy/` hay đưa lên máy chủ; gói production phải qua kiểm trước khi triển khai.

`VITE_PORTAL_URL` là URL HTTP(S) tuyệt đối của portal, không có thông tin đăng nhập. URL sai làm build dừng. Cầu học chỉ gửi và nhận tin với phần nguồn của URL; đường dẫn, query và fragment không tham gia nguồn.

Bản phát hành mặc định **để trống** biến này. Khi không có portal được cấu hình, game giữ hàng đợi học cục bộ kể cả khi bị nhúng, không gửi tin, không xả hàng đợi và không yêu cầu focus. Nếu môi trường đã đặt biến, có thể tắt rõ:

```sh
VITE_PORTAL_URL= pnpm deploy:pack
```

Demo ở nhà dùng:

```sh
VITE_PORTAL_URL=https://typing-game.local/ pnpm deploy:pack:local
```

`--allow-local-host` của chế độ local chỉ miễn lỗi nguồn `typing-game.local`, không tự đặt URL; các kiểm tra khác giữ nguyên. Biến dùng chung giữa ba game là `VITE_PORTAL_URL`.

## Model trong gói triển khai

`deploy-models.json` ghi danh sách khóa model được đóng gói, dạng `{ "models": [] }`. Mỗi khóa phải có trong `public/assets/typing-defense/models/manifest.json`, ví dụ `buildings/keep`. Nhánh `a2-days` là canvas 2D, không nạp model, nên danh sách hiện tại trống.

Hai lệnh `deploy:pack` và `deploy:pack:local` chạy `scripts/deploy/prune.mjs dist` sau build và trước bộ kiểm. Danh sách trống bỏ cả `dist/assets/typing-defense/models/`; có khóa thì giữ file mọi bậc được manifest tham chiếu và ghi manifest trong `dist` chỉ còn các khóa đó. Khóa lạ hoặc URL ra ngoài `models/` khiến bước lọc dừng trước khi xóa. Bước lọc cũng bỏ `dist/.vite/`. Script chỉ ghi trong thư mục gói có `index.html`, không sửa `public/`.

`pnpm build` một mình giữ nguyên model và `.vite/` để `scripts/bundle-budget.mjs`, `pnpm check`, `build:local` của repo cha và nhánh 3D tiếp tục dùng.

**Ghi chú cho làn L (Claude, `td-1c`):** ở mốc **C13**, điền `deploy-models.json` từ `STARTER` và `NIGHT_1` trong `scripts/td/media-budget.mjs` của làn đó, trước khi đóng gói bản có model.

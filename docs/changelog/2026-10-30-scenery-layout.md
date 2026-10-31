# 30/10/2026 · C9: dữ liệu bố cục cảnh map 1 theo seed

Thêm `src/view/3d/scenery-layout.ts`, module thuần theo MAP_FACTORY §6.4 và TK §23.10. Đầu vào là bản đồ, nền nhà đặt sẵn, tập sprite, nửa bề rộng đường, đồ trang trí đường và hàm độ cao; đầu ra có tọa độ, bán kính chân, cỡ, lật, sắc độ, hàng rừng và quyền đổ khi xây. Chưa gắn vào renderer.

- Rải Poisson có cụm từ nhiễu băm số nguyên, seed mặc định FNV-1a của `map.id`; mọi vật `field` có `clearOnBuild:true`.
- Giữ nguyên danh sách theo bậc bằng các thành phần láng giềng gần nhất; hai màu biến thể và cân bằng lật được giữ khi hạ bậc. Không thay phần loại còn thiếu bằng loại khác.
- Mép rừng bốn hàng bo góc song song, cách nhau 7 m, tăng cỡ ×1,12 và tối ×0,92 mỗi hàng; có khe cửa, nước và dốc. Low giữ cả bốn hàng.
- Seed mặc định, tập đủ: Low **598 + 0**, Medium **1.000 + 1.599**, High **1.500 + 4.000** vật lớn/chữ thập; tập tám cây đã nhận: **318 + 0** ở cả ba bậc.
- Lượt kiểm sau 199: `pnpm check` xanh **475/475 test, 44/44 file**, không lỗi/skip; **73/73 test 202 qua**, chín mã băm vàng giữ nguyên. Build (TypeScript, Vite, ngân sách gói) qua; golden gameplay thường/boss đều `same:true`.
- Thêm test đối chiếu `id/type/variant/kind/heightM` của tám sprite đã nhận với manifest thật 199 và mọi sprite bố cục accepted ở cả ba bậc. Module thuần và thuật toán giữ nguyên. Năm atlas đã có; không chỉnh file 199.
- Tờ kiểm nhân RGB với `shade`, giữ độ đục để hàng sau tối hơn đúng dữ liệu. Xuất và xem lại đủ sáu JPG, cùng byte như lượt trước.
- Sáu JPG kiểm dữ liệu và ba JSON thô nằm tại `tmp/202/`. Báo cáo và số đo nằm ở repo cha: `docs/codex-queue/202-report.md`, `docs/codex-queue/202/`. Trung vị năm lần High trên Mac mini M4 **39,955 ms** (đo lại năm lần).

L3 giữ phần dựng `scenery.ts`: đọc manifest 199 hiện có, đặt y, billboard, đung đưa, bóng và cây đổ. Cần xem trong 3D để chốt mật độ, bán kính chân, tán lặp và dither hàng rừng phía nam. Low là dữ liệu theo TK, chưa thêm bậc vào `Tier3D`. Không sửa nội dung, sim, ván vàng hoặc file của phiếu 199.

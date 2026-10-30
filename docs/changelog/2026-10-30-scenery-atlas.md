# 30/10/2026 · C9 · Atlas cảnh Wordwoven

- Hoàn tất `prepare-scenery.mjs`, tập 26 ảnh, test và lệnh `td:scenery`; xuất manifest runtime tám cây 116 và năm WebP qua liên kết meadow vào checkout chính. 117/118 vẫn chưa nhận, chỉ có trong bộ thử `tmp/199/pending/`.
- Giữ alpha bàn giao, mật độ chung 72 px/m, không phóng to nguồn thiếu mật độ; cắt sát, lề/nở màu 8 px, khử khóa trong dải mép, không vẽ viền hoặc sửa phần trong tranh. Tọa độ xếp bội 4; High 4096², Medium 2048² chung UV, normal dựng riêng từng cấp, bóng High 1024².
- Áp dụng cả quyết định 12:58 và 13:28: miễn vùng gần đen V <0,25 ở mọi alpha; giữ diện miễn alpha 0 xa vật và tối. Bộ kiểm in riêng số còn bị bắt, miễn tối và miễn alpha 0 theo sprite/cấp.
- Thử q90, q92, q95 theo thứ tự; q95 còn 12 điểm High và 2 Medium. Vẫn xuất theo quyết định 13:28, ghi đủ tọa độ/RGBA trong manifest và số liệu; ảnh ×4 ở tờ mép để Claude chấm. Test yêu cầu không có điểm chưa khai báo, kiểm chính xác mọi điểm còn lại, không tự coi là đạt thị giác.
- Có ba tờ JPG dưới 1 MB tại `tmp/199/`: atlas ca rô/pháp tuyến/bóng; ảnh giao cạnh atlas/pháp tuyến/chiếu sáng thử có vạch chân; hai mép mỗi cây và toàn bộ điểm q95 còn lại ×4.
- `pnpm check` xanh 474/474 test (44 file), gồm ảnh WebP thật; build và đo gói xanh, hai golden bằng. Dựng lặp và `--check` exit 0, lượt hai không đổi nội dung hoặc mtime.
- Tổng media High 15,247852 MB, Medium 7,253820 MB, khởi động 3,422868 MB đạt trần chung. Scenery riêng 4,032026/1,332774 MB vượt đích 2,5/0,8 MB; pending 26 ảnh vừa ở 72 px/m nhưng khởi động dự phóng 3,558650 MB, vượt 58.650 byte. Giữ nguyên để Claude quyết tối ưu; chưa giảm mật độ hoặc sửa tranh để ép số.
- Tre v3 có chân lệch phải 19,030505%, cần Claude xem. Năm file phiếu 202 cùng worktree giữ nguyên hash; không sửa mã runtime hoặc nguồn ảnh. Chưa commit, push hoặc media:push.

Báo cáo và đặc tả manifest cho L3: `docs/codex-queue/199-report.md` ở repo cha. Claude còn duyệt thị giác và đích byte riêng.

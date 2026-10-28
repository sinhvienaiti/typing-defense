# 28/10/2026 · Tên danh từ tiếng Anh · Phiếu 050

Đổi đủ 28 tên theo bảng Lời Gọi trong `docs/games/NAMES_EN.md` của repo cha và quyết định Claude ngày 27/10; câu, gợi ý, menu và nhãn cơ chế vẫn tiếng Việt. Tên riêng giữ nguyên.

- Công trình: Lũy Chữ → Fort; Tháp Cung → Archer Tower; Tháp Pháo → Cannon Tower; Trại Lính → Barracks; Mỏ Vàng → Gold Mine; Ruộng → Rice Field.
- Quái: Cương Thi → Hopping Zombie; Đàn Ma Trơi → Ghost Flame; Thuồng Luồng → River Serpent; Mầm Gỗ → Sapling; Lửng Tanuki → Raccoon Dog; Nuppeppō → Split Blob; Nuppeppō con → Little Blob; Cương Thi Đầu Đàn → Zombie Leader; Quỷ Núi Troll → Troll.
- Đơn vị: Dân → Villager; Thợ xây → Builder; nông dân → Farmer; Lính → Soldier; Thư Đồng → Helper.
- Tài nguyên, vật phẩm và chiêu: Vàng → Gold; Gỗ → Wood; Lúa → Rice; Hạt giống → Seeds; Tri thức → Knowledge; Rương → Chest; Mưa lông lửa → Fire Feather Rain; Phát Chữ → Word Shot.

Đồng bộ biến thể ngắn trong `src/content/slice-1a.ts`, `src/app/sandbox.ts`, `src/main.ts` và `src/ui/{build-menu,hud,sheets,team-bar,tips}.ts`: tên dữ liệu, nút, giá/thưởng, thông báo, thanh đội, lời dạy và kết quả. Năm mô tả ô xây đang có mở đầu bằng nghĩa Việt trong ngoặc. Dòng giá tự mua hạt dùng `Gold/Seeds` để tránh cụm “một Seeds”; không thêm thành phần giao diện.

Sửa assert/regex hiển thị trong `tests/{td-hud,td-input,td-r2,td-test-pass}.test.ts` và `scripts/visual/scenarios/{td-1a6-tour,td-1b-boss,td-1b-build,td-1b-story,td-theme}.mjs`. Không đổi logic kiểm hoặc fixture dữ liệu.

Kiểm: `pnpm check` đạt 350/350 test trong 32 file, gồm 6 test golden; kit, typecheck, build và budget đạt. Hai golden giữ nguyên SHA-256 và content hash `f2a21037`. Quét 28 tên trong 8 file nguồn: còn sót 0; so id/khóa object trong 5 file content: khác 0. Diff chỉ đổi literal chuỗi/regex. Năm script đạt `node --check`.

Không đổi id, từ gõ, đường dẫn asset hoặc golden; không mở trình duyệt. Bảng vị trí tên tăng hơn 4 ký tự và kết quả sáu kiểm nằm trong `docs/codex-queue/050-report.md` của repo cha; Claude kiểm bố cục trước commit.

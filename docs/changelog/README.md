# Lời Gọi: mục lục changelog

Mỗi lần cập nhật một file tiếng Việt trong thư mục này (`AGENTS.md`). Bảng dưới là mục lục, mới nhất ở trên; ngày theo tên file. Repo cha ghi một dòng mỗi ngày ở `docs/changelog/` của nó, mục "Lời Gọi".

| Ngày | Việc | File |
|---|---|---|
| 31/10/2026 | Âm phím đọc từ Typing Feel (bước B5): `VITE_TYPING_FEEL_ORIGIN`, danh mục tải song song không chờ, bảng Sound dựng ngay rồi thay danh sách, giữ bộ đã lưu khi host hỏng, Bamboo thay khi bộ không phát được, cổng vào trận 1,5 s; xoá 2.744 OGG, 35 manifest và 2.744 dòng `media.md5`; test trên host mẫu | [2026-10-31-typing-feel-keys](./2026-10-31-typing-feel-keys.md) |
| 31/10/2026 | Kit: bảng Sound nhận hàm tải của game (`keyboardFetch`, `onKeyboardFail`, `timedBytes`); `setChoiceOptions` không phát preview, không dời focus; đợt giải mã đầu không có file nào thì dừng; dòng "Saved sound · unavailable" đọc được | [2026-10-31-kit-keyboard-panel-fetch](./2026-10-31-kit-keyboard-panel-fetch.md) |
| 31/10/2026 | Kit cho bước dữ liệu Typing Feel (G2, cha `590864fb`): danh mục có `revision`, `default`, `effects`; `timedJson`, `settleKeyboardChoice`, `pendingKeyboardChoices`, `typingFeelKeysBase`, `setChoiceOptions`; đợt giải mã đầu trộn tối đa 4 space; sửa kit TF2 | [2026-10-31-kit-typing-feel-data-step](./2026-10-31-kit-typing-feel-data-step.md) |
| 30/10/2026 | Bộ phím thứ 34 **Hail Stone** (chủ dự án chọn, họ Solid sau Solid Amber, `order` 12, không điểm): 34 OGG stereo trong `media.md5` (tổng 2.744), danh mục 34 bộ; không đổi mã; test 34 bộ | [2026-10-30-keyboard-set-hail-stone](./2026-10-30-keyboard-set-hail-stone.md) |
| 30/10/2026 | Bộ phím thứ 33 **Raindrop Tile** (chủ dự án chọn, họ Crisp sau Crisp Silk, không điểm): 26 OGG stereo trong `media.md5` (tổng 2.710), danh mục 33 bộ; không đổi mã; test 33 bộ | [2026-10-30-keyboard-set-raindrop-tile](./2026-10-30-keyboard-set-raindrop-tile.md) |
| 30/10/2026 | Sửa theo phản biện tiếng phím: chữ sai và chữ lạc giữ tiếng riêng trên bộ Firefly (theo kết quả bộ định tuyến), bộ đã lưu kêu từ lô giải mã đầu và được giải phóng khi đổi bộ, id lạ về Bright Clack, 17 test Settings/Sound (Happy DOM), khôi phục chú thích đầu file | [2026-10-30-keyboard-review-fixes](./2026-10-30-keyboard-review-fixes.md) |
| 30/10/2026 | 32 bộ tiếng phím Firefly thuộc 7 họ (phiếu 218) thay bảy bộ, nhóm theo họ qua kit (phiếu 219, đồng bộ ở `4ae665b2`); mặc định vẫn Bright Clack; 2.684 OGG trong `media.md5`, 33 manifest trong Git | [2026-10-30-keyboard-sets-32](./2026-10-30-keyboard-sets-32.md) |
| 30/10/2026 | Nút Settings và Sound trong trận (phiếu Codex 193): bảng kit quick-settings, F1/F2/Esc, đếm 3–2–1, Master/Mute, Music, Effects, Interface, tiếng phím Firefly (mặc định Bright Clack) và Bamboo (original); Claude nhận, `pnpm check` xanh, ván vàng giữ nguyên | [2026-10-30-settings-and-keyboard-sounds](./2026-10-30-settings-and-keyboard-sounds.md) |
| 30/10/2026 | Phiếu 200: gắn ảnh cho dòng nạp, favicon, màn tựa và thẻ kết (WW-01/02/03/08/56); 16 media, `pnpm check` 405 test qua, golden giữ nguyên; gói `/` 81.583 → 82.314 B gzip, chờ Claude kiểm trình duyệt | [2026-10-30-title-results-art](./2026-10-30-title-results-art.md) |
| 28/10/2026 | 1C cho map 1 (nhánh `td-1c`): C0 kế hoạch và ngân sách đã duyệt (trần 16.500 dòng, chunk 3D lười, media High ≤ 12 MB và Medium ≤ 6 MB, khung theo bậc, chia module, thứ tự C1–C14); C1 giao diện `MapView`, view 3D rỗng trong chunk riêng 117 kB, lùi về 2D; gói "/" 84,21 kB, 10.767 dòng | [2026-10-28-td-1c-map1](./2026-10-28-td-1c-map1.md) |
| 28/10/2026 | 1B.V4 bước 1 (VFX 2D, phiếu Codex 036): ống `FX.fire`/`FX.hit` cho view 2D (`FxPipe`, `FxDraw`), `FxView` vào chunk lười `fx`; gói "/" 83,85 kB gzip, 10.555 dòng; gộp vào `a2-days` (83,78 kB) và dừng làn V4a: 2D chỉ còn bậc Low và đường lùi, năm pha của V4a sang C11 | [2026-10-28-td-fx-pipe](./2026-10-28-td-fx-pipe.md) |
| 28/10/2026 | Tên danh từ tiếng Anh (phiếu Codex 050): 28 tên công trình, quái, đơn vị, tài nguyên theo `NAMES_EN.md`; câu và menu vẫn tiếng Việt; Claude kiểm bố cục ở 1280 × 720 và 1920 × 1080 | [2026-10-28-english-names](./2026-10-28-english-names.md) |
| 27/10/2026 | Các việc còn mở sau đợt test, bước A1 (các đêm và boss): pha 2 luôn diễn ra, lặng Đêm 5 chờ Thuồng Luồng, Đêm 4 có áp lực, hệ số k boss và Thử thách; Đêm 3 nhàn: nguyên nhân thật, chưa sửa (chủ dự án) | [2026-10-27-open-items](./2026-10-27-open-items.md) |
| 27/10/2026 | Đợt test 27/10: gộp 43 lỗi của ba người test, sửa mọi lỗi nặng trừ Đêm 4 nhàn (đo 6 biến thể, để lượt cân bằng) và phần áp lực Thuồng Luồng; thẻ chữ tránh chỗ hành động, Phát Chữ và lúc hạ quái, thẻ kết, Xem bản đồ, Neo và Phá Khiên trong vòng giúp, Tối Thượng từ Đêm 3 | [2026-10-27-test-pass](./2026-10-27-test-pass.md) |
| 26–27/10/2026 | 1B R3 cân bằng cuối (bước 9) và cổng cứng §21 (bước 10): Rễ hút sinh khí, từ 4–8 chữ cho E 45–64, sàn k 0,70, hệ số k máu boss; sáu lượt đo; §20 trên Mac xen kẽ với mốc; 44/44 lượt kịch bản; còn trượt Ẩu 77 % và B4 bộ 1 | [2026-10-26-td-r3-balance](./2026-10-26-td-r3-balance.md) |
| 26/10/2026 | Luật gỗ của chủ dự án (cây 1.000 Gỗ, mọc lại mỗi Ngày), "Gọi đêm sớm" đếm ngược, hai con rồng; `td-1b-wood` | [2026-10-26-td-wood](./2026-10-26-td-wood.md) |
| 26/10/2026 | 1B R3 phần B (bước 7, 8, 11, kịch bản bước 10): Troll, Đầu Đàn, Neo, Phá Khiên ở hộp cát; bot chơi Học; gói chơi thử và B9 từ file; `td-1b-tour`; sửa sau lượt kiểm (file chơi thử bấm thật, gõ lại khi máy tải, hộp cát không vào B9) | [2026-10-26-td-r3-part-b](./2026-10-26-td-r3-part-b.md) |
| 26/10/2026 | 1B R3 phần A (bước 1–6): tách chunk, Học (Từ Ôn, sổ ôn lưu, kế hoạch học, sự kiện học, luật nghĩa), bảng dạy bản đồ 1, dòng Chế độ, sao lưu; kịch bản `td-1b-learn`, `td-1b-story` | [2026-10-26-td-r3-part-a](./2026-10-26-td-r3-part-a.md) |
| 25/10/2026 | 1B R3 "Học và dạy": kế hoạch (`docs/td/R3_PLAN.md`), mốc gói và hồ sơ một khung ở 60 Hz trên Mac | [2026-10-25-td-r3-plan](./2026-10-25-td-r3-plan.md) |
| 25/10/2026 | 1B R2: sửa sau phản biện lần 3 trên Mac (F3 chunk hỏng được hỏi lại, F4 thẻ màn đầu tải khi chọn, F5 chấm tổng mỗi khung, F6 A/B trên Mac; thẻ nhà cấp 3 vừa ở 1280 × 720) | [2026-10-25-td-1b-r2-fix3](./2026-10-25-td-1b-r2-fix3.md) |
| 25/10/2026 | 1B R2: sửa sau phản biện lần 2 (đo mọi núm §6.5, G3 và G8 trong báo cáo, chunk có đường lỗi, phần khởi động của "/", luồng chính ở 60 Hz) | [2026-10-25-td-1b-r2-fix2](./2026-10-25-td-1b-r2-fix2.md) |
| 25/10/2026 | 1B R2: sửa sau phản biện (G5 mọi bot, cân bằng lại, gói JS dưới 85 kB) | [2026-10-25-td-1b-r2-fix](./2026-10-25-td-1b-r2-fix.md) |
| 25/10/2026 | Âm hành động Q6: sửa sau review lần 2 (gói prompt) | [2026-10-25-audio-q6-fix2](./2026-10-25-audio-q6-fix2.md) |
| 24/10/2026 | 1B R2 "Gõ giúp trận" | [2026-10-24-td-1b-r2](./2026-10-24-td-1b-r2.md) |
| 24/10/2026 | Âm hành động Q6: sửa sau review | [2026-10-24-audio-q6-fix](./2026-10-24-audio-q6-fix.md) |
| 24/10/2026 | Âm hành động theo hình dạng hành động (Q6) | [2026-10-24-audio-q6](./2026-10-24-audio-q6.md) |
| 24/10/2026 | Model: sửa rig Lam, Cương Thi; chiều cao nhà | [2026-10-24-models-rig-fixes](./2026-10-24-models-rig-fixes.md) |
| 24/10/2026 | Model: rig người, rig quái, Thư Đồng | [2026-10-24-models-creature-rigs](./2026-10-24-models-creature-rigs.md) |
| 24/10/2026 | 1B R1: sửa sau phản biện | [2026-10-24-td-1b-r1-fix](./2026-10-24-td-1b-r1-fix.md) |
| 24/10/2026 | 1B R1 "Mộc Tinh tới" | [2026-10-24-td-1b-r1](./2026-10-24-td-1b-r1.md) |
| 24/10/2026 | 1B: phản biện đặc tả | [2026-10-24-td-1b-spec-review](./2026-10-24-td-1b-spec-review.md) |
| 24/10/2026 | 1B: đặc tả "Mộc Tinh tới làng" | [2026-10-24-td-1b-spec](./2026-10-24-td-1b-spec.md) |
| 23/10/2026 | Chủ đề Miền Văn Điền (D7) | [2026-10-23-theme](./2026-10-23-theme.md) |
| 23/10/2026 | Tách khỏi Space Typing | [2026-10-23-split](./2026-10-23-split.md) |
| 23/10/2026 | Cân bằng theo cách người chơi gõ (BALANCE.md bước 4) | [2026-10-23-balance](./2026-10-23-balance.md) |
| 23/10/2026 | 1A.6 R3: bot, báo cáo, kịch bản, cổng | [2026-10-23-td-1a6-r3](./2026-10-23-td-1a6-r3.md) |
| 23/10/2026 | 1A.6 R2: học, điều khiển, hình, HUD, âm | [2026-10-23-td-1a6-r2](./2026-10-23-td-1a6-r2.md) |
| 22/10/2026 | 1A.6 R1: sim, dữ liệu, lệnh, test, file vàng | [2026-10-22-td-1a6-r1](./2026-10-22-td-1a6-r1.md) |
| 22/10/2026 | 1A.5: sửa sau review | [2026-10-22-td-1a5-review](./2026-10-22-td-1a5-review.md) |
| 22/10/2026 | 1A.5: bot, báo cáo, test vàng, hiệu năng | [2026-10-22-td-1a5-bot](./2026-10-22-td-1a5-bot.md) |
| 22/10/2026 | 1A.4: sửa sau review | [2026-10-22-td-1a4-review](./2026-10-22-td-1a4-review.md) |
| 22/10/2026 | 1A.4: điều khiển, HUD, hộp cát | [2026-10-22-td-1a4-controls](./2026-10-22-td-1a4-controls.md) |
| 22/10/2026 | 1A.3: sửa sau review | [2026-10-22-td-1a3-review](./2026-10-22-td-1a3-review.md) |
| 22/10/2026 | 1A.3: người và ô | [2026-10-22-td-1a3-agents](./2026-10-22-td-1a3-agents.md) |
| 22/10/2026 | Bộ prompt asset | [2026-10-22-td-asset-prompts](./2026-10-22-td-asset-prompts.md) |
| 22/10/2026 | 1A "Cổng vui": bản chơi được đầu tiên | [2026-10-22-td-1a](./2026-10-22-td-1a.md) |
| 22/10/2026 | Thiết kế Typing Defense | [2026-10-22-td-design](./2026-10-22-td-design.md) |

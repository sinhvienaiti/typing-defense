# Phiếu 015b · Lời Gọi · mức cần của 248 đích ảnh 2D

Ngày 26/10/2026. Luật duyệt: [ART_ACCEPTANCE.md](../../../../../docs/games/ART_ACCEPTANCE.md) (`docs/games/ART_ACCEPTANCE.md`, repo cha). Phiếu: [015b-td-2d-rest.md](../../../../../docs/codex-queue/015b-td-2d-rest.md). Đích: §6.2 (48 bậc P) và §6.3 (200 VS, từng dòng ở §3.4) của [IMAGE_AUDIT_2026-10-25.md](../../../../../docs/games/IMAGE_AUDIT_2026-10-25.md).

Viết tắt: TK là `docs/td/TYPING_DEFENSE_DESIGN.md`; 03 và 03-vs là hai file `03-2d-scenery-ui-vfx*.md` cùng thư mục; tên file mã nằm trong `src/`.

## Cách dùng (cho Codex)

- Làm P1 rồi P2, theo thứ tự bảng. P3 chờ kinh phí (ART_ACCEPTANCE §3).
- Thứ tự này dùng chung cho §6.2 và §6.3, thay bước 1 của phiếu ("§6.2 theo thứ tự bảng, rồi §6.3"). Vì vậy hai đích P1 của §6.3 (C23, C21) làm trước các đích P2 của §6.2 (U14–U16, U21–U28).
- Theo luật đó, 7 đích P3 của §6.2 (U8–U13, X12) cũng chờ, dù phiếu ghi làm §6.2 theo thứ tự bảng. Câu "Xong khi" của phiếu chỉ tính 56 đích P1, P2 ở mục Tổng; 7 đích này không tính.
- Bỏ qua dòng "đã có". Lúc kiểm (26/10 16:32) có 22 PNG; README-015b mới ghi 5. U4–U7 làm ở lượt 2 và đã chấm lại 26/10 (U4 Tạm chấp nhận 8,5; U5, U6 Đạt 9,5; U7 Đạt 9), nên bảng này ghi 26 "đã có".
- Chấm ảnh mới theo thang 10 điểm. Từ 7 điểm là nhận, không tạo lại.
- Mã và đường dẫn giữ đúng như IMAGE_AUDIT.

## Mức ở file này

| Mức | Ở Lời Gọi nghĩa là |
|---|---|
| P1 | Mã 1B đang hiện thứ đó bằng chữ hoặc bằng hình giữ chỗ. |
| P2 | Mốc kế: 1C (cảnh 3D bản đồ 1, đồ bay, bùa) và phần tối thiểu của VS (Lam, Tre, nhà VS, bản đồ 2 và 3). |
| P3 | Biến thể thêm, ô điểm nhấn, trang trí, tham khảo, thứ mã đã bỏ, bước 6 trở đi. |

- Mốc đang làm: 1B R3, bản vẽ vẫn 2D (BUILD_1B §13; R3_PLAN "Tiến độ"). Mốc kế: 1C hình 3D (TK §26.1).
- Bằng chứng, mạnh trước: mã (`src/`; `public/` mới có `ui/title-dusk.webp` và model, chưa có ảnh nào của 248 đích); mốc đang làm (BUILD_1B, R3_PLAN, BUILD_NOTES); bậc TK §27.2 và lộ trình §26; bộ prompt.
- Cảnh bản đồ 2, 3: biến thể đầu mỗi loại là P2. Cây, khối tán, đá thêm v2 (03-vs §2). v3, v4 là P3.
- Phông bản đồ 2, 3: 4 ô trơn mỗi bản đồ là P2. Ô điểm nhấn (`sky-a`, `layer-140-a`) là P3.

## Phong cách: viền mực của bộ prompt hay lối tô dày của 005b

Câu hỏi (phiếu bước 2): bộ prompt (03 §3.1, §3.5) đòi viền mực đậm, màu phẳng. Ảnh công trình 005b (`art-src/buildings/`) tô dày, không viền.

Tài liệu đã có đề xuất:
- TK §23.1: viền mực "fresnel cho 3D, vẽ sẵn cho 2D". Model nhà trong game có viền mực bằng shader.
- 005b là ảnh nguồn gửi Tripo, cố ý không viền (`README.md` bộ prompt: "không viền đen vẽ sẵn"). Không phải ảnh dùng thẳng.
- `015b-delivery.md` (đầu file) và README-015b ("Chủ dự án cần xem"): giữ nét viền mực của file 03.
- IMAGE_AUDIT §6.4 và README-015 không bàn câu này.

**Đã chọn theo đề xuất:** giữ viền mực của bộ prompt, không đổi STYLE.
- Icon nhà đính kèm ảnh 005b cùng id, thêm dòng BUILDREF. U1–U3 đã làm vậy: dáng, màu khớp 005b, chỉ thêm viền. Có đủ ảnh 005b cho U4–U7, U29–U31.
- Chân dung đính kèm ảnh mẫu, thêm dòng REF: `heroes/lam.png`, `heroes/tre.png`, `bosses/moc-tinh.png`, `bosses/dai-bang-tinh.png`.
- Cũng là cách rẻ hơn: đổi phong cách thì phải làm lại phần lớn 57 ảnh dùng thẳng đã có (cảnh, phông, chân dung, đèn, icon, VFX).
- Ảnh lệch nhẹ (ví dụ viền khối tán S12 dày hơn hẳn phông F4): chấm "Hợp bộ" 1 điểm, không tạo lại.

## Bảng

| Mã | Đích (path) | Mức | Lý do |
|---|---|---|---|
| U17 | `games/typing-defense/art-src/ui/resources/lives.png` | P1 | HUD hiện Mạng mỗi ván (`hud.ts:56`), nháy "−3" khi boss đánh Lũy. |
| U18 | `games/typing-defense/art-src/ui/resources/gold.png` | P1 | HUD hiện Vàng (`hud.ts:56`); rương boss +150 về ô Vàng (BUILD_1B §13.1). |
| U19 | `games/typing-defense/art-src/ui/resources/food.png` | P1 | HUD hiện Lúa (`hud.ts:56`); 1B có Ruộng và Lúa. |
| U20 | `games/typing-defense/art-src/ui/resources/wood.png` | P1 | HUD hiện Gỗ (`hud.ts:56`); luật gỗ mới 26/10 (BUILD_NOTES §7.8). |
| C23 | `games/typing-defense/art-src/portraits/draconis-ult.png` | P1 | Mã vẽ hình giữ chỗ khi dùng Tối Thượng (`fx-2d.ts:195`; BUILD_1B §13.3: "chưa có ảnh"). |
| C21 | `games/typing-defense/art-src/portraits/moc-tinh.png` | P1 | Boss bản đồ 1. Thanh boss hiện câu "Mộc Tinh: …" (`hud.ts:152–157`). REF: `bosses/moc-tinh.png`. |
| U14 | `games/typing-defense/art-src/ui/charms/charm-mend.png` | P2 | Bùa để 1C / VS (BUILD_1B §2); mã chưa có bùa. |
| U15 | `games/typing-defense/art-src/ui/charms/charm-frost.png` | P2 | Bùa để 1C / VS (BUILD_1B §2); mã chưa có bùa. |
| U16 | `games/typing-defense/art-src/ui/charms/charm-gale.png` | P2 | Bùa để 1C / VS (BUILD_1B §2); mã chưa có bùa. |
| U21 | `games/typing-defense/art-src/ui/resources/knowledge.png` | P2 | Mã chỉ ghi chữ "Tri thức" ở dòng học (`hud.ts:58`). Icon chủ yếu dùng ngoài trận (03 §9.4). |
| U22 | `games/typing-defense/art-src/ui/resources/wave.png` | P2 | Đợt thành Đêm ở 1A.6; HUD ghi "Đêm n · còn k quái" (`hud.ts:57`). Dùng ở HUD 1C. |
| U23 | `games/typing-defense/art-src/ui/loot/coin-common.png` | P2 | Đồng bay về ô Vàng ở 1C (TK §26.1); 1B ghi vàng ngay, chưa có đồng bay. Bậc của bầy, quái nhỏ (TK §17.4). |
| U24 | `games/typing-defense/art-src/ui/loot/coin-refined.png` | P2 | Đồng bay về ô Vàng ở 1C (TK §26.1); 1B ghi vàng ngay, chưa có đồng bay. Bậc quái vừa. |
| U25 | `games/typing-defense/art-src/ui/loot/coin-high.png` | P2 | Đồng bay về ô Vàng ở 1C (TK §26.1); 1B ghi vàng ngay, chưa có đồng bay. Bậc quái nặng. |
| U26 | `games/typing-defense/art-src/ui/loot/coin-elite.png` | P2 | Đồng bay về ô Vàng ở 1C (TK §26.1); 1B ghi vàng ngay, chưa có đồng bay. Bậc tinh nhuệ. |
| U27 | `games/typing-defense/art-src/ui/loot/coin-mini-boss.png` | P2 | Đồng bay về ô Vàng ở 1C (TK §26.1); 1B ghi vàng ngay, chưa có đồng bay. Bậc boss phụ. |
| U28 | `games/typing-defense/art-src/ui/loot/coin-major-boss.png` | P2 | Đồng bay về ô Vàng ở 1C (TK §26.1); 1B ghi vàng ngay, chưa có đồng bay. Bậc boss (Mộc Tinh). |
| C9 | `games/typing-defense/art-src/portraits/lam.png` | P2 | Lam là Tướng ở bước 3 (TK §26.2), thanh đội cần chân dung. REF: `heroes/lam.png`. |
| C24 | `games/typing-defense/art-src/portraits/lam-ult.png` | P2 | Ảnh trượt Tối Thượng của Lam; chỗ trượt đã có trong mã (`fx-2d.ts:195`). |
| C10 | `games/typing-defense/art-src/portraits/tre.png` | P2 | Tre là Tướng VS (TK §27.2), thanh đội cần chân dung. REF: `heroes/tre.png`. |
| C25 | `games/typing-defense/art-src/portraits/tre-ult.png` | P2 | Ảnh trượt Tối Thượng của Tre; cùng chỗ trượt trong mã. |
| C22 | `games/typing-defense/art-src/portraits/dai-bang-tinh.png` | P2 | Boss bản đồ 2 (VS); câu boss hiện trên thanh boss như Mộc Tinh. REF: `bosses/dai-bang-tinh.png`. |
| U29 | `games/typing-defense/art-src/ui/buildings/scribe.png` | P2 | Tháp Thư Pháp vào ở VS (TK §26.2 bước 5); menu xây cần icon. BUILDREF: `buildings/scribe.png`. |
| U30 | `games/typing-defense/art-src/ui/buildings/lumber.png` | P2 | Trại Gỗ vào ở VS; menu xây cần icon. BUILDREF: `buildings/lumber.png`. |
| U31 | `games/typing-defense/art-src/ui/buildings/infirmary.png` | P2 | Nhà Thuốc vào ở VS; menu xây cần icon. BUILDREF: `buildings/infirmary.png`. |
| S15-v1 | `games/typing-defense/art-src/scenery/coast/olive-tree-v1.png` | P2 | Biến thể đầu của loại cảnh bản đồ 2 (VS). Cây. |
| S16-v1 | `games/typing-defense/art-src/scenery/coast/casuarina-v1.png` | P2 | Biến thể đầu của loại cảnh bản đồ 2 (VS). Cây. |
| S19-v1 | `games/typing-defense/art-src/scenery/coast/limestone-small-v1.png` | P2 | Biến thể đầu của loại cảnh bản đồ 2 (VS). Đá. |
| S20-v1 | `games/typing-defense/art-src/scenery/coast/limestone-medium-v1.png` | P2 | Biến thể đầu của loại cảnh bản đồ 2 (VS). Đá. |
| S17-v1 | `games/typing-defense/art-src/scenery/coast/sea-grass-v1.png` | P2 | Biến thể đầu của loại cảnh bản đồ 2 (VS). |
| S18-v1 | `games/typing-defense/art-src/scenery/coast/morning-glory-v1.png` | P2 | Biến thể đầu của loại cảnh bản đồ 2 (VS). |
| S21-v1 | `games/typing-defense/art-src/scenery/coast/net-rack-v1.png` | P2 | Biến thể đầu của loại cảnh bản đồ 2 (VS). Đạo cụ làng chài, nét riêng của bản đồ. |
| S22-v1 | `games/typing-defense/art-src/scenery/coast/basket-boat-v1.png` | P2 | Biến thể đầu của loại cảnh bản đồ 2 (VS). Đạo cụ làng chài, nét riêng của bản đồ. |
| S15-v2 | `games/typing-defense/art-src/scenery/coast/olive-tree-v2.png` | P2 | Cây, khối tán, đá làm trước (03-vs §2; IMAGE_AUDIT §6.3): làm hai biến thể như bản đồ 1 ở bậc P. |
| S16-v2 | `games/typing-defense/art-src/scenery/coast/casuarina-v2.png` | P2 | Cây, khối tán, đá làm trước (03-vs §2; IMAGE_AUDIT §6.3): làm hai biến thể như bản đồ 1 ở bậc P. |
| S19-v2 | `games/typing-defense/art-src/scenery/coast/limestone-small-v2.png` | P2 | Cây, khối tán, đá làm trước (03-vs §2; IMAGE_AUDIT §6.3): làm hai biến thể như bản đồ 1 ở bậc P. |
| S20-v2 | `games/typing-defense/art-src/scenery/coast/limestone-medium-v2.png` | P2 | Cây, khối tán, đá làm trước (03-vs §2; IMAGE_AUDIT §6.3): làm hai biến thể như bản đồ 1 ở bậc P. |
| F8 | `games/typing-defense/art-src/backdrops/w1-whitestone/sky-b.png` | P2 | Ô trơn, đặt 3 lần quanh vòng: vòng kín cần ô này (03-vs §6). Ô a là P3: làm ô này không đính kèm, không dòng MATCH. |
| F9 | `games/typing-defense/art-src/backdrops/w1-whitestone/layer-320.png` | P2 | Ô trơn, đặt 4 lần quanh vòng (03-vs §6). |
| F10 | `games/typing-defense/art-src/backdrops/w1-whitestone/layer-220.png` | P2 | Ô trơn, đặt 4 lần quanh vòng (03-vs §6). |
| F12 | `games/typing-defense/art-src/backdrops/w1-whitestone/layer-140-b.png` | P2 | Ô trơn, đặt 3 lần quanh vòng: vòng kín cần ô này (03-vs §6). Ô a là P3: làm ô này không đính kèm, không dòng MATCH. |
| S23-v1 | `games/typing-defense/art-src/scenery/rainforest/jungle-tree-v1.png` | P2 | Biến thể đầu của loại cảnh bản đồ 3 (VS). Cây. |
| S31-v1 | `games/typing-defense/art-src/scenery/rainforest/jungle-canopy-block-v1.png` | P2 | Biến thể đầu của loại cảnh bản đồ 3 (VS). Khối tán; bản đồ 3 có luật Tán Che (03-vs §5). |
| S29-v1 | `games/typing-defense/art-src/scenery/rainforest/mossy-boulder-v1.png` | P2 | Biến thể đầu của loại cảnh bản đồ 3 (VS). Đá. |
| S24-v1 | `games/typing-defense/art-src/scenery/rainforest/vine-stump-v1.png` | P2 | Biến thể đầu của loại cảnh bản đồ 3 (VS). |
| S25-v1 | `games/typing-defense/art-src/scenery/rainforest/tree-fern-v1.png` | P2 | Biến thể đầu của loại cảnh bản đồ 3 (VS). |
| S26-v1 | `games/typing-defense/art-src/scenery/rainforest/mushroom-cluster-v1.png` | P2 | Biến thể đầu của loại cảnh bản đồ 3 (VS). |
| S27-v1 | `games/typing-defense/art-src/scenery/rainforest/root-tangle-v1.png` | P2 | Biến thể đầu của loại cảnh bản đồ 3 (VS). |
| S28-v1 | `games/typing-defense/art-src/scenery/rainforest/orchid-clump-v1.png` | P2 | Biến thể đầu của loại cảnh bản đồ 3 (VS). |
| S23-v2 | `games/typing-defense/art-src/scenery/rainforest/jungle-tree-v2.png` | P2 | Cây, khối tán, đá làm trước (03-vs §2; IMAGE_AUDIT §6.3): làm hai biến thể như bản đồ 1 ở bậc P. |
| S31-v2 | `games/typing-defense/art-src/scenery/rainforest/jungle-canopy-block-v2.png` | P2 | Cây, khối tán, đá làm trước (03-vs §2; IMAGE_AUDIT §6.3): làm hai biến thể như bản đồ 1 ở bậc P. |
| S29-v2 | `games/typing-defense/art-src/scenery/rainforest/mossy-boulder-v2.png` | P2 | Cây, khối tán, đá làm trước (03-vs §2; IMAGE_AUDIT §6.3): làm hai biến thể như bản đồ 1 ở bậc P. |
| F14 | `games/typing-defense/art-src/backdrops/w1-rootwood/sky-b.png` | P2 | Ô trơn, đặt 3 lần quanh vòng: vòng kín cần ô này (03-vs §6). Ô a là P3: làm ô này không đính kèm, không dòng MATCH. |
| F15 | `games/typing-defense/art-src/backdrops/w1-rootwood/layer-320.png` | P2 | Ô trơn, đặt 4 lần quanh vòng (03-vs §6). |
| F16 | `games/typing-defense/art-src/backdrops/w1-rootwood/layer-220.png` | P2 | Ô trơn, đặt 4 lần quanh vòng (03-vs §6). |
| F18 | `games/typing-defense/art-src/backdrops/w1-rootwood/layer-140-b.png` | P2 | Ô trơn, đặt 3 lần quanh vòng: vòng kín cần ô này (03-vs §6). Ô a là P3: làm ô này không đính kèm, không dòng MATCH. |
| U8 | `games/typing-defense/art-src/ui/tempo/tempo-0.png` | P3 | Núm nhịp đã bỏ ở 1A.6 (BUILD_1A6 §1; `app/input.ts:12`). Chỉ làm nếu nhịp quay lại. |
| U9 | `games/typing-defense/art-src/ui/tempo/tempo-6.png` | P3 | Núm nhịp đã bỏ ở 1A.6 (BUILD_1A6 §1; `app/input.ts:12`). Chỉ làm nếu nhịp quay lại. |
| U10 | `games/typing-defense/art-src/ui/tempo/tempo-4.png` | P3 | Núm nhịp đã bỏ ở 1A.6 (BUILD_1A6 §1; `app/input.ts:12`). Chỉ làm nếu nhịp quay lại. |
| U11 | `games/typing-defense/art-src/ui/tempo/tempo-3.png` | P3 | Núm nhịp đã bỏ ở 1A.6 (BUILD_1A6 §1; `app/input.ts:12`). Chỉ làm nếu nhịp quay lại. |
| U12 | `games/typing-defense/art-src/ui/tempo/tempo-2.png` | P3 | Núm nhịp đã bỏ ở 1A.6 (BUILD_1A6 §1; `app/input.ts:12`). Chỉ làm nếu nhịp quay lại. |
| U13 | `games/typing-defense/art-src/ui/tempo/tempo-1.png` | P3 | Núm nhịp đã bỏ ở 1A.6 (BUILD_1A6 §1; `app/input.ts:12`). Chỉ làm nếu nhịp quay lại. |
| X12 | `games/typing-defense/art-src/vfx/ma-troi-sheet.png` | P3 | Tờ tham khảo, không vào game, không bắt buộc (03 §10). X11 đã có. |
| S14-v1 | `games/typing-defense/art-src/scenery/meadow/field-marker-v1.png` | P3 | Trang trí thêm của bản đồ 1. Model Ruộng Lúa đã có cọc mốc đá vôi (03-vs §3). |
| S14-v2 | `games/typing-defense/art-src/scenery/meadow/field-marker-v2.png` | P3 | Trang trí thêm của bản đồ 1. Model Ruộng Lúa đã có cọc mốc đá vôi (03-vs §3). |
| S14-v3 | `games/typing-defense/art-src/scenery/meadow/field-marker-v3.png` | P3 | Trang trí thêm của bản đồ 1. Model Ruộng Lúa đã có cọc mốc đá vôi (03-vs §3). |
| S14-v4 | `games/typing-defense/art-src/scenery/meadow/field-marker-v4.png` | P3 | Trang trí thêm của bản đồ 1. Model Ruộng Lúa đã có cọc mốc đá vôi (03-vs §3). |
| S15-v3 | `games/typing-defense/art-src/scenery/coast/olive-tree-v3.png` | P3 | Biến thể thêm (v3, v4; luật ≥ 4 biến thể của TK §23.10 để sau). |
| S15-v4 | `games/typing-defense/art-src/scenery/coast/olive-tree-v4.png` | P3 | Biến thể thêm (v3, v4; luật ≥ 4 biến thể của TK §23.10 để sau). |
| S16-v3 | `games/typing-defense/art-src/scenery/coast/casuarina-v3.png` | P3 | Biến thể thêm (v3, v4; luật ≥ 4 biến thể của TK §23.10 để sau). |
| S16-v4 | `games/typing-defense/art-src/scenery/coast/casuarina-v4.png` | P3 | Biến thể thêm (v3, v4; luật ≥ 4 biến thể của TK §23.10 để sau). |
| S17-v2 | `games/typing-defense/art-src/scenery/coast/sea-grass-v2.png` | P3 | Cỏ, hoa, nấm, đạo cụ nhỏ: một biến thể đủ trước; v2 để sau. |
| S17-v3 | `games/typing-defense/art-src/scenery/coast/sea-grass-v3.png` | P3 | Biến thể thêm (v3, v4; luật ≥ 4 biến thể của TK §23.10 để sau). |
| S17-v4 | `games/typing-defense/art-src/scenery/coast/sea-grass-v4.png` | P3 | Biến thể thêm (v3, v4; luật ≥ 4 biến thể của TK §23.10 để sau). |
| S18-v2 | `games/typing-defense/art-src/scenery/coast/morning-glory-v2.png` | P3 | Cỏ, hoa, nấm, đạo cụ nhỏ: một biến thể đủ trước; v2 để sau. |
| S18-v3 | `games/typing-defense/art-src/scenery/coast/morning-glory-v3.png` | P3 | Biến thể thêm (v3, v4; luật ≥ 4 biến thể của TK §23.10 để sau). |
| S18-v4 | `games/typing-defense/art-src/scenery/coast/morning-glory-v4.png` | P3 | Biến thể thêm (v3, v4; luật ≥ 4 biến thể của TK §23.10 để sau). |
| S19-v3 | `games/typing-defense/art-src/scenery/coast/limestone-small-v3.png` | P3 | Biến thể thêm (v3, v4; luật ≥ 4 biến thể của TK §23.10 để sau). |
| S19-v4 | `games/typing-defense/art-src/scenery/coast/limestone-small-v4.png` | P3 | Biến thể thêm (v3, v4; luật ≥ 4 biến thể của TK §23.10 để sau). |
| S20-v3 | `games/typing-defense/art-src/scenery/coast/limestone-medium-v3.png` | P3 | Biến thể thêm (v3, v4; luật ≥ 4 biến thể của TK §23.10 để sau). |
| S20-v4 | `games/typing-defense/art-src/scenery/coast/limestone-medium-v4.png` | P3 | Biến thể thêm (v3, v4; luật ≥ 4 biến thể của TK §23.10 để sau). |
| S21-v2 | `games/typing-defense/art-src/scenery/coast/net-rack-v2.png` | P3 | Cỏ, hoa, nấm, đạo cụ nhỏ: một biến thể đủ trước; v2 để sau. |
| S21-v3 | `games/typing-defense/art-src/scenery/coast/net-rack-v3.png` | P3 | Biến thể thêm (v3, v4; luật ≥ 4 biến thể của TK §23.10 để sau). |
| S21-v4 | `games/typing-defense/art-src/scenery/coast/net-rack-v4.png` | P3 | Biến thể thêm (v3, v4; luật ≥ 4 biến thể của TK §23.10 để sau). |
| S22-v2 | `games/typing-defense/art-src/scenery/coast/basket-boat-v2.png` | P3 | Cỏ, hoa, nấm, đạo cụ nhỏ: một biến thể đủ trước; v2 để sau. |
| S22-v3 | `games/typing-defense/art-src/scenery/coast/basket-boat-v3.png` | P3 | Biến thể thêm (v3, v4; luật ≥ 4 biến thể của TK §23.10 để sau). |
| S22-v4 | `games/typing-defense/art-src/scenery/coast/basket-boat-v4.png` | P3 | Biến thể thêm (v3, v4; luật ≥ 4 biến thể của TK §23.10 để sau). |
| S23-v3 | `games/typing-defense/art-src/scenery/rainforest/jungle-tree-v3.png` | P3 | Biến thể thêm (v3, v4; luật ≥ 4 biến thể của TK §23.10 để sau). |
| S23-v4 | `games/typing-defense/art-src/scenery/rainforest/jungle-tree-v4.png` | P3 | Biến thể thêm (v3, v4; luật ≥ 4 biến thể của TK §23.10 để sau). |
| S24-v2 | `games/typing-defense/art-src/scenery/rainforest/vine-stump-v2.png` | P3 | Cỏ, hoa, nấm, đạo cụ nhỏ: một biến thể đủ trước; v2 để sau. |
| S24-v3 | `games/typing-defense/art-src/scenery/rainforest/vine-stump-v3.png` | P3 | Biến thể thêm (v3, v4; luật ≥ 4 biến thể của TK §23.10 để sau). |
| S24-v4 | `games/typing-defense/art-src/scenery/rainforest/vine-stump-v4.png` | P3 | Biến thể thêm (v3, v4; luật ≥ 4 biến thể của TK §23.10 để sau). |
| S25-v2 | `games/typing-defense/art-src/scenery/rainforest/tree-fern-v2.png` | P3 | Cỏ, hoa, nấm, đạo cụ nhỏ: một biến thể đủ trước; v2 để sau. |
| S25-v3 | `games/typing-defense/art-src/scenery/rainforest/tree-fern-v3.png` | P3 | Biến thể thêm (v3, v4; luật ≥ 4 biến thể của TK §23.10 để sau). |
| S25-v4 | `games/typing-defense/art-src/scenery/rainforest/tree-fern-v4.png` | P3 | Biến thể thêm (v3, v4; luật ≥ 4 biến thể của TK §23.10 để sau). |
| S26-v2 | `games/typing-defense/art-src/scenery/rainforest/mushroom-cluster-v2.png` | P3 | Cỏ, hoa, nấm, đạo cụ nhỏ: một biến thể đủ trước; v2 để sau. |
| S26-v3 | `games/typing-defense/art-src/scenery/rainforest/mushroom-cluster-v3.png` | P3 | Biến thể thêm (v3, v4; luật ≥ 4 biến thể của TK §23.10 để sau). |
| S26-v4 | `games/typing-defense/art-src/scenery/rainforest/mushroom-cluster-v4.png` | P3 | Biến thể thêm (v3, v4; luật ≥ 4 biến thể của TK §23.10 để sau). |
| S27-v2 | `games/typing-defense/art-src/scenery/rainforest/root-tangle-v2.png` | P3 | Cỏ, hoa, nấm, đạo cụ nhỏ: một biến thể đủ trước; v2 để sau. |
| S27-v3 | `games/typing-defense/art-src/scenery/rainforest/root-tangle-v3.png` | P3 | Biến thể thêm (v3, v4; luật ≥ 4 biến thể của TK §23.10 để sau). |
| S27-v4 | `games/typing-defense/art-src/scenery/rainforest/root-tangle-v4.png` | P3 | Biến thể thêm (v3, v4; luật ≥ 4 biến thể của TK §23.10 để sau). |
| S28-v2 | `games/typing-defense/art-src/scenery/rainforest/orchid-clump-v2.png` | P3 | Cỏ, hoa, nấm, đạo cụ nhỏ: một biến thể đủ trước; v2 để sau. |
| S28-v3 | `games/typing-defense/art-src/scenery/rainforest/orchid-clump-v3.png` | P3 | Biến thể thêm (v3, v4; luật ≥ 4 biến thể của TK §23.10 để sau). |
| S28-v4 | `games/typing-defense/art-src/scenery/rainforest/orchid-clump-v4.png` | P3 | Biến thể thêm (v3, v4; luật ≥ 4 biến thể của TK §23.10 để sau). |
| S29-v3 | `games/typing-defense/art-src/scenery/rainforest/mossy-boulder-v3.png` | P3 | Biến thể thêm (v3, v4; luật ≥ 4 biến thể của TK §23.10 để sau). |
| S29-v4 | `games/typing-defense/art-src/scenery/rainforest/mossy-boulder-v4.png` | P3 | Biến thể thêm (v3, v4; luật ≥ 4 biến thể của TK §23.10 để sau). |
| S30-v1-d0 | `games/typing-defense/art-src/scenery/rainforest/stilt-house-ruin-v1-d0.png` | P3 | Trang trí xa ở mép bản đồ, 8 ảnh một biến thể; 03 §14.7: có thể phải chuyển sang Tripo. |
| S30-v1-d1 | `games/typing-defense/art-src/scenery/rainforest/stilt-house-ruin-v1-d1.png` | P3 | Trang trí xa ở mép bản đồ, 8 ảnh một biến thể; 03 §14.7: có thể phải chuyển sang Tripo. |
| S30-v1-d2 | `games/typing-defense/art-src/scenery/rainforest/stilt-house-ruin-v1-d2.png` | P3 | Trang trí xa ở mép bản đồ, 8 ảnh một biến thể; 03 §14.7: có thể phải chuyển sang Tripo. |
| S30-v1-d3 | `games/typing-defense/art-src/scenery/rainforest/stilt-house-ruin-v1-d3.png` | P3 | Trang trí xa ở mép bản đồ, 8 ảnh một biến thể; 03 §14.7: có thể phải chuyển sang Tripo. |
| S30-v1-d4 | `games/typing-defense/art-src/scenery/rainforest/stilt-house-ruin-v1-d4.png` | P3 | Trang trí xa ở mép bản đồ, 8 ảnh một biến thể; 03 §14.7: có thể phải chuyển sang Tripo. |
| S30-v1-d5 | `games/typing-defense/art-src/scenery/rainforest/stilt-house-ruin-v1-d5.png` | P3 | Trang trí xa ở mép bản đồ, 8 ảnh một biến thể; 03 §14.7: có thể phải chuyển sang Tripo. |
| S30-v1-d6 | `games/typing-defense/art-src/scenery/rainforest/stilt-house-ruin-v1-d6.png` | P3 | Trang trí xa ở mép bản đồ, 8 ảnh một biến thể; 03 §14.7: có thể phải chuyển sang Tripo. |
| S30-v1-d7 | `games/typing-defense/art-src/scenery/rainforest/stilt-house-ruin-v1-d7.png` | P3 | Trang trí xa ở mép bản đồ, 8 ảnh một biến thể; 03 §14.7: có thể phải chuyển sang Tripo. |
| S30-v2-d0 | `games/typing-defense/art-src/scenery/rainforest/stilt-house-ruin-v2-d0.png` | P3 | Biến thể thêm của nhà sàn bỏ hoang (8 ảnh). |
| S30-v2-d1 | `games/typing-defense/art-src/scenery/rainforest/stilt-house-ruin-v2-d1.png` | P3 | Biến thể thêm của nhà sàn bỏ hoang (8 ảnh). |
| S30-v2-d2 | `games/typing-defense/art-src/scenery/rainforest/stilt-house-ruin-v2-d2.png` | P3 | Biến thể thêm của nhà sàn bỏ hoang (8 ảnh). |
| S30-v2-d3 | `games/typing-defense/art-src/scenery/rainforest/stilt-house-ruin-v2-d3.png` | P3 | Biến thể thêm của nhà sàn bỏ hoang (8 ảnh). |
| S30-v2-d4 | `games/typing-defense/art-src/scenery/rainforest/stilt-house-ruin-v2-d4.png` | P3 | Biến thể thêm của nhà sàn bỏ hoang (8 ảnh). |
| S30-v2-d5 | `games/typing-defense/art-src/scenery/rainforest/stilt-house-ruin-v2-d5.png` | P3 | Biến thể thêm của nhà sàn bỏ hoang (8 ảnh). |
| S30-v2-d6 | `games/typing-defense/art-src/scenery/rainforest/stilt-house-ruin-v2-d6.png` | P3 | Biến thể thêm của nhà sàn bỏ hoang (8 ảnh). |
| S30-v2-d7 | `games/typing-defense/art-src/scenery/rainforest/stilt-house-ruin-v2-d7.png` | P3 | Biến thể thêm của nhà sàn bỏ hoang (8 ảnh). |
| S31-v3 | `games/typing-defense/art-src/scenery/rainforest/jungle-canopy-block-v3.png` | P3 | Biến thể thêm (v3, v4; luật ≥ 4 biến thể của TK §23.10 để sau). |
| S31-v4 | `games/typing-defense/art-src/scenery/rainforest/jungle-canopy-block-v4.png` | P3 | Biến thể thêm (v3, v4; luật ≥ 4 biến thể của TK §23.10 để sau). |
| F7 | `games/typing-defense/art-src/backdrops/w1-whitestone/sky-a.png` | P3 | Ô điểm nhấn đặt 1 lần; vòng vẫn kín bằng ô trơn. Mặt trời, tia nắng mã vẽ được. |
| F11 | `games/typing-defense/art-src/backdrops/w1-whitestone/layer-140-a.png` | P3 | Ô điểm nhấn đặt 1 lần; vòng vẫn kín bằng ô trơn. |
| F13 | `games/typing-defense/art-src/backdrops/w1-rootwood/sky-a.png` | P3 | Ô điểm nhấn đặt 1 lần; vòng vẫn kín bằng ô trơn. Mặt trời, tia nắng mã vẽ được. |
| F17 | `games/typing-defense/art-src/backdrops/w1-rootwood/layer-140-a.png` | P3 | Ô điểm nhấn đặt 1 lần; vòng vẫn kín bằng ô trơn. |
| C11 | `games/typing-defense/art-src/portraits/crew-keep.png` | P3 | Mã chưa có tổ thợ. Thoại tổ thợ là tiếng và phụ đề; HUD chưa có chỗ cho chân dung (TK §22.4). |
| C12 | `games/typing-defense/art-src/portraits/crew-archer.png` | P3 | Mã chưa có tổ thợ. Thoại tổ thợ là tiếng và phụ đề; HUD chưa có chỗ cho chân dung (TK §22.4). |
| C13 | `games/typing-defense/art-src/portraits/crew-cannon.png` | P3 | Mã chưa có tổ thợ. Thoại tổ thợ là tiếng và phụ đề; HUD chưa có chỗ cho chân dung (TK §22.4). |
| C14 | `games/typing-defense/art-src/portraits/crew-scribe.png` | P3 | Mã chưa có tổ thợ. Thoại tổ thợ là tiếng và phụ đề; HUD chưa có chỗ cho chân dung (TK §22.4). |
| C15 | `games/typing-defense/art-src/portraits/crew-barracks.png` | P3 | Mã chưa có tổ thợ. Thoại tổ thợ là tiếng và phụ đề; HUD chưa có chỗ cho chân dung (TK §22.4). |
| C16 | `games/typing-defense/art-src/portraits/crew-gold-mine.png` | P3 | Mã chưa có tổ thợ. Thoại tổ thợ là tiếng và phụ đề; HUD chưa có chỗ cho chân dung (TK §22.4). |
| C17 | `games/typing-defense/art-src/portraits/crew-farm.png` | P3 | Mã chưa có tổ thợ. Thoại tổ thợ là tiếng và phụ đề; HUD chưa có chỗ cho chân dung (TK §22.4). |
| C18 | `games/typing-defense/art-src/portraits/crew-lumber.png` | P3 | Mã chưa có tổ thợ. Thoại tổ thợ là tiếng và phụ đề; HUD chưa có chỗ cho chân dung (TK §22.4). |
| C19 | `games/typing-defense/art-src/portraits/crew-seal-dais.png` | P3 | Mã chưa có tổ thợ. Thoại tổ thợ là tiếng và phụ đề; HUD chưa có chỗ cho chân dung (TK §22.4). |
| C20 | `games/typing-defense/art-src/portraits/crew-infirmary.png` | P3 | Mã chưa có tổ thợ. Thoại tổ thợ là tiếng và phụ đề; HUD chưa có chỗ cho chân dung (TK §22.4). |
| T1 | `games/typing-defense/art-src/story/draconis/1.png` | P3 | Tranh truyện thuộc bước 6 (TK §26.2), mốc xa. |
| T2 | `games/typing-defense/art-src/story/draconis/2.png` | P3 | Tranh truyện thuộc bước 6 (TK §26.2), mốc xa. |
| T3 | `games/typing-defense/art-src/story/lam/1.png` | P3 | Tranh truyện thuộc bước 6 (TK §26.2), mốc xa. |
| T4 | `games/typing-defense/art-src/story/lam/2.png` | P3 | Tranh truyện thuộc bước 6 (TK §26.2), mốc xa. |
| T5 | `games/typing-defense/art-src/story/tre/1.png` | P3 | Tranh truyện thuộc bước 6 (TK §26.2), mốc xa. |
| T6 | `games/typing-defense/art-src/story/tre/2.png` | P3 | Tranh truyện thuộc bước 6 (TK §26.2), mốc xa. |
| N1-v1 | `games/typing-defense/art-src/scenery/meadow-neon/almond-tree-v1.png` | P3 | Atlas Neon chỉ để kiểm đổi bộ ở bước 5 (TK §26.2); mã chưa có StylePack. |
| N1-v2 | `games/typing-defense/art-src/scenery/meadow-neon/almond-tree-v2.png` | P3 | Atlas Neon chỉ để kiểm đổi bộ ở bước 5 (TK §26.2); mã chưa có StylePack. |
| N1-v3 | `games/typing-defense/art-src/scenery/meadow-neon/almond-tree-v3.png` | P3 | Atlas Neon chỉ để kiểm đổi bộ ở bước 5 (TK §26.2); mã chưa có StylePack. |
| N1-v4 | `games/typing-defense/art-src/scenery/meadow-neon/almond-tree-v4.png` | P3 | Atlas Neon chỉ để kiểm đổi bộ ở bước 5 (TK §26.2); mã chưa có StylePack. |
| N2-v1 | `games/typing-defense/art-src/scenery/meadow-neon/mountain-pine-v1.png` | P3 | Atlas Neon chỉ để kiểm đổi bộ ở bước 5 (TK §26.2); mã chưa có StylePack. |
| N2-v2 | `games/typing-defense/art-src/scenery/meadow-neon/mountain-pine-v2.png` | P3 | Atlas Neon chỉ để kiểm đổi bộ ở bước 5 (TK §26.2); mã chưa có StylePack. |
| N2-v3 | `games/typing-defense/art-src/scenery/meadow-neon/mountain-pine-v3.png` | P3 | Atlas Neon chỉ để kiểm đổi bộ ở bước 5 (TK §26.2); mã chưa có StylePack. |
| N2-v4 | `games/typing-defense/art-src/scenery/meadow-neon/mountain-pine-v4.png` | P3 | Atlas Neon chỉ để kiểm đổi bộ ở bước 5 (TK §26.2); mã chưa có StylePack. |
| N3-v1 | `games/typing-defense/art-src/scenery/meadow-neon/bamboo-clump-v1.png` | P3 | Atlas Neon chỉ để kiểm đổi bộ ở bước 5 (TK §26.2); mã chưa có StylePack. |
| N3-v2 | `games/typing-defense/art-src/scenery/meadow-neon/bamboo-clump-v2.png` | P3 | Atlas Neon chỉ để kiểm đổi bộ ở bước 5 (TK §26.2); mã chưa có StylePack. |
| N3-v3 | `games/typing-defense/art-src/scenery/meadow-neon/bamboo-clump-v3.png` | P3 | Atlas Neon chỉ để kiểm đổi bộ ở bước 5 (TK §26.2); mã chưa có StylePack. |
| N3-v4 | `games/typing-defense/art-src/scenery/meadow-neon/bamboo-clump-v4.png` | P3 | Atlas Neon chỉ để kiểm đổi bộ ở bước 5 (TK §26.2); mã chưa có StylePack. |
| N4-v1 | `games/typing-defense/art-src/scenery/meadow-neon/raspberry-bush-v1.png` | P3 | Atlas Neon chỉ để kiểm đổi bộ ở bước 5 (TK §26.2); mã chưa có StylePack. |
| N4-v2 | `games/typing-defense/art-src/scenery/meadow-neon/raspberry-bush-v2.png` | P3 | Atlas Neon chỉ để kiểm đổi bộ ở bước 5 (TK §26.2); mã chưa có StylePack. |
| N4-v3 | `games/typing-defense/art-src/scenery/meadow-neon/raspberry-bush-v3.png` | P3 | Atlas Neon chỉ để kiểm đổi bộ ở bước 5 (TK §26.2); mã chưa có StylePack. |
| N4-v4 | `games/typing-defense/art-src/scenery/meadow-neon/raspberry-bush-v4.png` | P3 | Atlas Neon chỉ để kiểm đổi bộ ở bước 5 (TK §26.2); mã chưa có StylePack. |
| N5-v1 | `games/typing-defense/art-src/scenery/meadow-neon/tall-grass-v1.png` | P3 | Atlas Neon chỉ để kiểm đổi bộ ở bước 5 (TK §26.2); mã chưa có StylePack. |
| N5-v2 | `games/typing-defense/art-src/scenery/meadow-neon/tall-grass-v2.png` | P3 | Atlas Neon chỉ để kiểm đổi bộ ở bước 5 (TK §26.2); mã chưa có StylePack. |
| N5-v3 | `games/typing-defense/art-src/scenery/meadow-neon/tall-grass-v3.png` | P3 | Atlas Neon chỉ để kiểm đổi bộ ở bước 5 (TK §26.2); mã chưa có StylePack. |
| N5-v4 | `games/typing-defense/art-src/scenery/meadow-neon/tall-grass-v4.png` | P3 | Atlas Neon chỉ để kiểm đổi bộ ở bước 5 (TK §26.2); mã chưa có StylePack. |
| N6-v1 | `games/typing-defense/art-src/scenery/meadow-neon/reed-clump-v1.png` | P3 | Atlas Neon chỉ để kiểm đổi bộ ở bước 5 (TK §26.2); mã chưa có StylePack. |
| N6-v2 | `games/typing-defense/art-src/scenery/meadow-neon/reed-clump-v2.png` | P3 | Atlas Neon chỉ để kiểm đổi bộ ở bước 5 (TK §26.2); mã chưa có StylePack. |
| N6-v3 | `games/typing-defense/art-src/scenery/meadow-neon/reed-clump-v3.png` | P3 | Atlas Neon chỉ để kiểm đổi bộ ở bước 5 (TK §26.2); mã chưa có StylePack. |
| N6-v4 | `games/typing-defense/art-src/scenery/meadow-neon/reed-clump-v4.png` | P3 | Atlas Neon chỉ để kiểm đổi bộ ở bước 5 (TK §26.2); mã chưa có StylePack. |
| N7-v1 | `games/typing-defense/art-src/scenery/meadow-neon/wildflowers-v1.png` | P3 | Atlas Neon chỉ để kiểm đổi bộ ở bước 5 (TK §26.2); mã chưa có StylePack. |
| N7-v2 | `games/typing-defense/art-src/scenery/meadow-neon/wildflowers-v2.png` | P3 | Atlas Neon chỉ để kiểm đổi bộ ở bước 5 (TK §26.2); mã chưa có StylePack. |
| N7-v3 | `games/typing-defense/art-src/scenery/meadow-neon/wildflowers-v3.png` | P3 | Atlas Neon chỉ để kiểm đổi bộ ở bước 5 (TK §26.2); mã chưa có StylePack. |
| N7-v4 | `games/typing-defense/art-src/scenery/meadow-neon/wildflowers-v4.png` | P3 | Atlas Neon chỉ để kiểm đổi bộ ở bước 5 (TK §26.2); mã chưa có StylePack. |
| N8-v1 | `games/typing-defense/art-src/scenery/meadow-neon/fern-v1.png` | P3 | Atlas Neon chỉ để kiểm đổi bộ ở bước 5 (TK §26.2); mã chưa có StylePack. |
| N8-v2 | `games/typing-defense/art-src/scenery/meadow-neon/fern-v2.png` | P3 | Atlas Neon chỉ để kiểm đổi bộ ở bước 5 (TK §26.2); mã chưa có StylePack. |
| N8-v3 | `games/typing-defense/art-src/scenery/meadow-neon/fern-v3.png` | P3 | Atlas Neon chỉ để kiểm đổi bộ ở bước 5 (TK §26.2); mã chưa có StylePack. |
| N8-v4 | `games/typing-defense/art-src/scenery/meadow-neon/fern-v4.png` | P3 | Atlas Neon chỉ để kiểm đổi bộ ở bước 5 (TK §26.2); mã chưa có StylePack. |
| N9-v1 | `games/typing-defense/art-src/scenery/meadow-neon/rock-small-v1.png` | P3 | Atlas Neon chỉ để kiểm đổi bộ ở bước 5 (TK §26.2); mã chưa có StylePack. |
| N9-v2 | `games/typing-defense/art-src/scenery/meadow-neon/rock-small-v2.png` | P3 | Atlas Neon chỉ để kiểm đổi bộ ở bước 5 (TK §26.2); mã chưa có StylePack. |
| N9-v3 | `games/typing-defense/art-src/scenery/meadow-neon/rock-small-v3.png` | P3 | Atlas Neon chỉ để kiểm đổi bộ ở bước 5 (TK §26.2); mã chưa có StylePack. |
| N9-v4 | `games/typing-defense/art-src/scenery/meadow-neon/rock-small-v4.png` | P3 | Atlas Neon chỉ để kiểm đổi bộ ở bước 5 (TK §26.2); mã chưa có StylePack. |
| N10-v1 | `games/typing-defense/art-src/scenery/meadow-neon/rock-medium-v1.png` | P3 | Atlas Neon chỉ để kiểm đổi bộ ở bước 5 (TK §26.2); mã chưa có StylePack. |
| N10-v2 | `games/typing-defense/art-src/scenery/meadow-neon/rock-medium-v2.png` | P3 | Atlas Neon chỉ để kiểm đổi bộ ở bước 5 (TK §26.2); mã chưa có StylePack. |
| N10-v3 | `games/typing-defense/art-src/scenery/meadow-neon/rock-medium-v3.png` | P3 | Atlas Neon chỉ để kiểm đổi bộ ở bước 5 (TK §26.2); mã chưa có StylePack. |
| N10-v4 | `games/typing-defense/art-src/scenery/meadow-neon/rock-medium-v4.png` | P3 | Atlas Neon chỉ để kiểm đổi bộ ở bước 5 (TK §26.2); mã chưa có StylePack. |
| N11-v1 | `games/typing-defense/art-src/scenery/meadow-neon/rotten-log-v1.png` | P3 | Atlas Neon chỉ để kiểm đổi bộ ở bước 5 (TK §26.2); mã chưa có StylePack. |
| N11-v2 | `games/typing-defense/art-src/scenery/meadow-neon/rotten-log-v2.png` | P3 | Atlas Neon chỉ để kiểm đổi bộ ở bước 5 (TK §26.2); mã chưa có StylePack. |
| N11-v3 | `games/typing-defense/art-src/scenery/meadow-neon/rotten-log-v3.png` | P3 | Atlas Neon chỉ để kiểm đổi bộ ở bước 5 (TK §26.2); mã chưa có StylePack. |
| N11-v4 | `games/typing-defense/art-src/scenery/meadow-neon/rotten-log-v4.png` | P3 | Atlas Neon chỉ để kiểm đổi bộ ở bước 5 (TK §26.2); mã chưa có StylePack. |
| N12-v1 | `games/typing-defense/art-src/scenery/meadow-neon/canopy-block-v1.png` | P3 | Atlas Neon chỉ để kiểm đổi bộ ở bước 5 (TK §26.2); mã chưa có StylePack. |
| N12-v2 | `games/typing-defense/art-src/scenery/meadow-neon/canopy-block-v2.png` | P3 | Atlas Neon chỉ để kiểm đổi bộ ở bước 5 (TK §26.2); mã chưa có StylePack. |
| N12-v3 | `games/typing-defense/art-src/scenery/meadow-neon/canopy-block-v3.png` | P3 | Atlas Neon chỉ để kiểm đổi bộ ở bước 5 (TK §26.2); mã chưa có StylePack. |
| N12-v4 | `games/typing-defense/art-src/scenery/meadow-neon/canopy-block-v4.png` | P3 | Atlas Neon chỉ để kiểm đổi bộ ở bước 5 (TK §26.2); mã chưa có StylePack. |
| A1 | `games/typing-defense/art-src/fauna/egret.png` | P3 | Thú nền trang trí (03-vs §11). |
| A2 | `games/typing-defense/art-src/fauna/gull.png` | P3 | Thú nền trang trí (03-vs §11). |
| A3 | `games/typing-defense/art-src/fauna/firefly.png` | P3 | Thú nền trang trí (03-vs §11). |
| A4 | `games/typing-defense/art-src/fauna/butterfly.png` | P3 | Thú nền trang trí (03-vs §11). |
| S1-v3 | `games/typing-defense/art-src/scenery/meadow/almond-tree-v3.png` | P3 | Biến thể thêm. Bản đồ 1 đã có v1, v2 đủ cho 1C (TK §26.1). |
| S1-v4 | `games/typing-defense/art-src/scenery/meadow/almond-tree-v4.png` | P3 | Biến thể thêm. Bản đồ 1 đã có v1, v2 đủ cho 1C (TK §26.1). |
| S2-v3 | `games/typing-defense/art-src/scenery/meadow/mountain-pine-v3.png` | P3 | Biến thể thêm. Bản đồ 1 đã có v1, v2 đủ cho 1C (TK §26.1). |
| S2-v4 | `games/typing-defense/art-src/scenery/meadow/mountain-pine-v4.png` | P3 | Biến thể thêm. Bản đồ 1 đã có v1, v2 đủ cho 1C (TK §26.1). |
| S3-v3 | `games/typing-defense/art-src/scenery/meadow/bamboo-clump-v3.png` | P3 | Biến thể thêm. Bản đồ 1 đã có v1, v2 đủ cho 1C (TK §26.1). |
| S3-v4 | `games/typing-defense/art-src/scenery/meadow/bamboo-clump-v4.png` | P3 | Biến thể thêm. Bản đồ 1 đã có v1, v2 đủ cho 1C (TK §26.1). |
| S4-v3 | `games/typing-defense/art-src/scenery/meadow/raspberry-bush-v3.png` | P3 | Biến thể thêm. Bản đồ 1 đã có v1, v2 đủ cho 1C (TK §26.1). |
| S4-v4 | `games/typing-defense/art-src/scenery/meadow/raspberry-bush-v4.png` | P3 | Biến thể thêm. Bản đồ 1 đã có v1, v2 đủ cho 1C (TK §26.1). |
| S5-v3 | `games/typing-defense/art-src/scenery/meadow/tall-grass-v3.png` | P3 | Biến thể thêm. Bản đồ 1 đã có v1, v2 đủ cho 1C (TK §26.1). |
| S5-v4 | `games/typing-defense/art-src/scenery/meadow/tall-grass-v4.png` | P3 | Biến thể thêm. Bản đồ 1 đã có v1, v2 đủ cho 1C (TK §26.1). |
| S6-v3 | `games/typing-defense/art-src/scenery/meadow/reed-clump-v3.png` | P3 | Biến thể thêm. Bản đồ 1 đã có v1, v2 đủ cho 1C (TK §26.1). |
| S6-v4 | `games/typing-defense/art-src/scenery/meadow/reed-clump-v4.png` | P3 | Biến thể thêm. Bản đồ 1 đã có v1, v2 đủ cho 1C (TK §26.1). |
| S7-v3 | `games/typing-defense/art-src/scenery/meadow/wildflowers-v3.png` | P3 | Biến thể thêm. Bản đồ 1 đã có v1, v2 đủ cho 1C (TK §26.1). |
| S7-v4 | `games/typing-defense/art-src/scenery/meadow/wildflowers-v4.png` | P3 | Biến thể thêm. Bản đồ 1 đã có v1, v2 đủ cho 1C (TK §26.1). |
| S8-v3 | `games/typing-defense/art-src/scenery/meadow/fern-v3.png` | P3 | Biến thể thêm. Bản đồ 1 đã có v1, v2 đủ cho 1C (TK §26.1). |
| S8-v4 | `games/typing-defense/art-src/scenery/meadow/fern-v4.png` | P3 | Biến thể thêm. Bản đồ 1 đã có v1, v2 đủ cho 1C (TK §26.1). |
| S9-v3 | `games/typing-defense/art-src/scenery/meadow/rock-small-v3.png` | P3 | Biến thể thêm. Bản đồ 1 đã có v1, v2 đủ cho 1C (TK §26.1). |
| S9-v4 | `games/typing-defense/art-src/scenery/meadow/rock-small-v4.png` | P3 | Biến thể thêm. Bản đồ 1 đã có v1, v2 đủ cho 1C (TK §26.1). |
| S10-v3 | `games/typing-defense/art-src/scenery/meadow/rock-medium-v3.png` | P3 | Biến thể thêm. Bản đồ 1 đã có v1, v2 đủ cho 1C (TK §26.1). |
| S10-v4 | `games/typing-defense/art-src/scenery/meadow/rock-medium-v4.png` | P3 | Biến thể thêm. Bản đồ 1 đã có v1, v2 đủ cho 1C (TK §26.1). |
| S11-v3 | `games/typing-defense/art-src/scenery/meadow/rotten-log-v3.png` | P3 | Biến thể thêm. Bản đồ 1 đã có v1, v2 đủ cho 1C (TK §26.1). |
| S11-v4 | `games/typing-defense/art-src/scenery/meadow/rotten-log-v4.png` | P3 | Biến thể thêm. Bản đồ 1 đã có v1, v2 đủ cho 1C (TK §26.1). |
| S12-v3 | `games/typing-defense/art-src/scenery/meadow/canopy-block-v3.png` | P3 | Biến thể thêm. Bản đồ 1 đã có v1, v2 đủ cho 1C (TK §26.1). |
| S12-v4 | `games/typing-defense/art-src/scenery/meadow/canopy-block-v4.png` | P3 | Biến thể thêm. Bản đồ 1 đã có v1, v2 đủ cho 1C (TK §26.1). |
| S13-v3 | `games/typing-defense/art-src/scenery/shared/tree-stump-v3.png` | P3 | Biến thể thêm. Bản đồ 1 đã có v1, v2 đủ cho 1C (TK §26.1). |
| S13-v4 | `games/typing-defense/art-src/scenery/shared/tree-stump-v4.png` | P3 | Biến thể thêm. Bản đồ 1 đã có v1, v2 đủ cho 1C (TK §26.1). |
| S3-v2 | `games/typing-defense/art-src/scenery/meadow/bamboo-clump-v2.png` | đã có | Lượt 1, có trong README-015b. Mức cần khi thay: P2 (cảnh bản đồ 1 cho 1C). |
| S6-v2 | `games/typing-defense/art-src/scenery/meadow/reed-clump-v2.png` | đã có | Lượt 1, có trong README-015b. Mức cần khi thay: P2 (cảnh bản đồ 1 cho 1C). |
| S12-v2 | `games/typing-defense/art-src/scenery/meadow/canopy-block-v2.png` | đã có | Lượt 1, có trong README-015b. Mức cần khi thay: P2 (cảnh bản đồ 1 cho 1C). |
| S13-v1 | `games/typing-defense/art-src/scenery/shared/tree-stump-v1.png` | đã có | Lượt 1, có trong README-015b. Mức cần khi thay: P2 (gốc cây khi đặt nhà, 1C). |
| S13-v2 | `games/typing-defense/art-src/scenery/shared/tree-stump-v2.png` | đã có | Lượt 1, có trong README-015b. Mức cần khi thay: P2 (gốc cây khi đặt nhà, 1C). |
| F1 | `games/typing-defense/art-src/backdrops/w1-silverfall/sky-a.png` | đã có | Có PNG lúc kiểm (26/10 16:32); README-015b chưa ghi. Mức cần khi thay: P2 (phông bản đồ 1 cho 1C). |
| F2 | `games/typing-defense/art-src/backdrops/w1-silverfall/sky-b.png` | đã có | Có PNG lúc kiểm (26/10 16:32); README-015b chưa ghi. Mức cần khi thay: P2 (phông bản đồ 1 cho 1C). |
| F3 | `games/typing-defense/art-src/backdrops/w1-silverfall/layer-320.png` | đã có | Có PNG lúc kiểm (26/10 16:32); README-015b chưa ghi. Mức cần khi thay: P2 (phông bản đồ 1 cho 1C). |
| F4 | `games/typing-defense/art-src/backdrops/w1-silverfall/layer-220.png` | đã có | Có PNG lúc kiểm (26/10 16:32); README-015b chưa ghi. Mức cần khi thay: P2 (phông bản đồ 1 cho 1C). |
| F5 | `games/typing-defense/art-src/backdrops/w1-silverfall/layer-140-a.png` | đã có | Có PNG lúc kiểm (26/10 16:32); README-015b chưa ghi. Mức cần khi thay: P2 (phông bản đồ 1 cho 1C). |
| F6 | `games/typing-defense/art-src/backdrops/w1-silverfall/layer-140-b.png` | đã có | Có PNG lúc kiểm (26/10 16:32); README-015b chưa ghi. Mức cần khi thay: P2 (phông bản đồ 1 cho 1C). |
| C3 | `games/typing-defense/art-src/portraits/helper-cham-scared.png` | đã có | Có PNG lúc kiểm (26/10 16:32); README-015b chưa ghi. Mức cần khi thay: P1 (thanh đội hiện Thư Đồng, `team-bar.ts`; chế độ hoảng R2). |
| C4 | `games/typing-defense/art-src/portraits/helper-phay-happy.png` | đã có | Có PNG lúc kiểm (26/10 16:32); README-015b chưa ghi. Mức cần khi thay: P1 (thanh đội hiện Thư Đồng, `team-bar.ts`; chế độ hoảng R2). |
| C5 | `games/typing-defense/art-src/portraits/helper-phay-scared.png` | đã có | Có PNG lúc kiểm (26/10 16:32); README-015b chưa ghi. Mức cần khi thay: P1 (thanh đội hiện Thư Đồng, `team-bar.ts`; chế độ hoảng R2). |
| C6 | `games/typing-defense/art-src/portraits/helper-gach-happy.png` | đã có | Có PNG lúc kiểm (26/10 16:32); README-015b chưa ghi. Mức cần khi thay: P1 (thanh đội hiện Thư Đồng, `team-bar.ts`; chế độ hoảng R2). |
| C7 | `games/typing-defense/art-src/portraits/helper-gach-scared.png` | đã có | Có PNG lúc kiểm (26/10 16:32); README-015b chưa ghi. Mức cần khi thay: P1 (thanh đội hiện Thư Đồng, `team-bar.ts`; chế độ hoảng R2). |
| L1 | `games/typing-defense/art-src/ui/lanterns/lantern-unlit.png` | đã có | Có PNG lúc kiểm (26/10 16:32); README-015b chưa ghi. Mức cần khi thay: P3 (Nhiệt đã bỏ ở 1A.6; đèn chỉ còn là khung CSS, `td.css:83`). |
| L2 | `games/typing-defense/art-src/ui/lanterns/lantern-lit.png` | đã có | Có PNG lúc kiểm (26/10 16:32); README-015b chưa ghi. Mức cần khi thay: P3 (Nhiệt đã bỏ ở 1A.6; đèn chỉ còn là khung CSS, `td.css:83`). |
| L3 | `games/typing-defense/art-src/ui/lanterns/lantern-blazing.png` | đã có | Có PNG lúc kiểm (26/10 16:32); README-015b chưa ghi. Mức cần khi thay: P3 (Nhiệt đã bỏ ở 1A.6; đèn chỉ còn là khung CSS, `td.css:83`). |
| U1 | `games/typing-defense/art-src/ui/buildings/keep.png` | đã có | Có PNG lúc kiểm (26/10 16:32); README-015b chưa ghi. Mức cần khi thay: P1 (nhà có trong mã, `slice-1a.ts`). |
| U2 | `games/typing-defense/art-src/ui/buildings/archer.png` | đã có | Có PNG lúc kiểm (26/10 16:32); README-015b chưa ghi. Mức cần khi thay: P1 (nhà có trong mã, `slice-1a.ts`). |
| U3 | `games/typing-defense/art-src/ui/buildings/cannon.png` | đã có | Có PNG lúc kiểm (26/10 16:32); README-015b chưa ghi. Mức cần khi thay: P1 (nhà có trong mã, `slice-1a.ts`). |
| U4 | `games/typing-defense/art-src/ui/buildings/barracks.png` | đã có | Làm ở lượt 2, Claude chấm lại 26/10: **Tạm chấp nhận 8,5**, ghi ART_REPLACE_LATER.md (nhà dài thấp cũ, khác tháp `barracks-v2`; khổ 3:2). Mức cần khi thay: P1 (Trại Lính có trong mã, `slice-1a.ts:76`; menu xây chỉ có tên, bản đồ hiện chữ "L"). |
| U5 | `games/typing-defense/art-src/ui/buildings/gold-mine.png` | đã có | Làm ở lượt 2, Claude chấm lại 26/10: **Đạt 9,5**. Mức cần: P1 (Mỏ Vàng có trong mã, `slice-1a.ts:81`). |
| U6 | `games/typing-defense/art-src/ui/buildings/farm.png` | đã có | Làm ở lượt 2, Claude chấm lại 26/10: **Đạt 9,5**. Mức cần: P1 (Ruộng có trong mã, `slice-1a.ts:83`). |
| U7 | `games/typing-defense/art-src/ui/buildings/seal-dais.png` | đã có | Làm ở lượt 2, Claude chấm lại 26/10: **Đạt 9**. Mức cần: P2 (Đài Ấn để VS, bản đồ 2; BUILD_1B §2). |

## Tổng

| Mức | §6.2 (P) | §6.3 (VS) | Cộng |
|---|---:|---:|---:|
| P1 | 4 | 2 | 6 |
| P2 | 11 | 39 | 50 |
| P3 | 7 | 159 | 166 |
| đã có | 26 | 0 | 26 |
| Cộng | 48 | 200 | 248 |

- Còn phải làm: 56 đích (P1 6, P2 50), khoảng hai lượt 45 lần tạo.
- Bảng này chuyển sang "đã có" đến U4–U7 (chấm lại 26/10). Các ảnh khác của lượt 2–3 (U8–U28 và 30 đích VS) ghi ở IMAGE_AUDIT §6.2, §6.3 và README-015b, chưa chuyển ở đây.
- P3 (166 đích) chờ kinh phí. Có thêm tiền thì làm v2 của cỏ, hoa, đạo cụ bản đồ 2 và 3 trước, rồi v3 của cây, khối tán, đá.
- Ngoài 248 đích: HUD hiện "Hạt" (`hud.ts:56`) nhưng chưa có đích ảnh. Chủ dự án quyết có cần icon không.

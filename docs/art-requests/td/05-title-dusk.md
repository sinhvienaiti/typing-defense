# Ảnh nền màn đầu Lời Gọi: làng tre lúc hoàng hôn (23/10/2026)

> **Dành cho:** chủ dự án (tạo lại hoặc thay ảnh), AI ghép file về sau.
>
> **Lấy từ:** `docs/games/SPLIT_PLAN.md` §1.2 (màn tiêu đề), `docs/td/TYPING_DEFENSE_DESIGN.md` §22.1 (Miền Văn Điền, luật văn hóa), §22.9 (bản đồ).
>
> **Trạng thái:** bản đầu tạo bằng Codex CLI của chủ dự án (đăng nhập ChatGPT, không dùng khóa API), lần thử 1 trên 2. Ảnh gốc ở `art-src/ui/title-dusk.png` (1536 × 1024), bản trong game `public/assets/typing-defense/ui/title-dusk.webp` (cwebp q82, ~330 kB). Cả hai không vào Git. Không có ảnh thì màn đầu vẽ cảnh bằng SVG trong `src/ui/title.ts`.

## Bố cục game cần

- Khung ngang 3 : 2, cắt theo cửa sổ (`cover`, tâm dọc 62 %).
- Giữa phía trên là trời trống: tên "Lời Gọi" và con dấu nằm ở đó.
- Một phần ba dưới bên trái yên, ít chi tiết: bảng chọn giấy dó nằm ở đó.
- Dải đèn lồng của game treo trước ảnh ở mép trên; ảnh không cần đèn lồng ở mép trên.

## Prompt đã dùng (khung ngang)

```text
Hand-painted children's picture-book illustration, gouache with soft ink outlines on warm cream paper texture, wide landscape scene, flat soft lighting.
A Vietnamese bamboo village at dusk seen from a gentle hillside. Terraced rice paddies curve down the slopes in many layered bands: young rice-seedling green terraces and ripe golden paddy terraces, with thin water mirrors in some terraces reflecting the orange and rose sky. Tall clumps of green bamboo frame the left and right edges. In the middle distance, a few small thatched stilt houses made of bamboo and dark wood, with round cream paper lanterns hanging under their eaves, some lanterns already glowing warm amber. A narrow dirt path winds between the paddies toward the village. Far away on the horizon, soft limestone karst mountains in hazy violet and blue layers. A low setting sun, a few white storks flying in the distance, faint first stars in the deep blue upper sky.
Mood: calm, warm, cosy, gentle evening, inviting. Palette limited to rice-seedling green, ripe-paddy gold, bamboo brown, vermilion red accents, ink black, cream paper, dusk orange and indigo.
Composition: the upper middle of the image is open sky with very little detail, and the lower left third is calm terraces with little detail, to leave room for a game title and a menu.
No text, no letters, no writing, no signature, no watermark, no people, no animals except the distant storks, no temples, no pagodas, no shrines, no altars, no incense, no religious buildings, no torii gates, no Chinese or Japanese architecture, no modern objects, no power lines, no vehicles.
```

## Đã kiểm

- Không chữ, không người, không đình, chùa, miếu (TK 22.1). Nhà sàn mái tranh, đèn lồng giấy, tre, ruộng bậc thang, núi đá vôi, cò trắng.
- Tên và bảng chọn đọc rõ trên ảnh ở 1280 × 720 và 1920 × 1080 (ảnh `td-theme-title-*`).

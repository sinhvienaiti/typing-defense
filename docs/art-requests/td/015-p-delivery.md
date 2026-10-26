# Phiếu 015 · Lô ảnh 2D bậc P

Ngày 26/10/2026. Prompt ghép nguyên văn theo file `03-2d-scenery-ui-vfx.md`: STYLE + SCENERY (trừ S13) + phần riêng + một biến thể + MATCH nếu v2 + nền. F1 dùng STYLE + phần riêng; F3 thêm BACKDROP và nền M. Bỏ tiền tố `td/` cũ theo game đã tách. Không đụng 119 ảnh VS của 005a/005b2.

Mỗi ảnh có prompt nguyên văn cạnh PNG trong `games/typing-defense/art-src/`; bảng bàn giao trong `README-015.md`. Danh sách dưới là hàng chờ đã soạn prompt, chỉ README bàn giao xác nhận ảnh sinh thành công.

| Mã | Đích | Tham chiếu duy nhất |
|---|---|---|
| S1-v1 | `games/typing-defense/art-src/scenery/meadow/almond-tree-v1.png` | — |
| S1-v2 | `games/typing-defense/art-src/scenery/meadow/almond-tree-v2.png` | `/Users/toandx/htdocs/typing-game/games/typing-defense/art-src/scenery/meadow/almond-tree-v1.png` |
| S2-v1 | `games/typing-defense/art-src/scenery/meadow/mountain-pine-v1.png` | — |
| S2-v2 | `games/typing-defense/art-src/scenery/meadow/mountain-pine-v2.png` | `/Users/toandx/htdocs/typing-game/games/typing-defense/art-src/scenery/meadow/mountain-pine-v1.png` |
| S3-v1 | `games/typing-defense/art-src/scenery/meadow/bamboo-clump-v1.png` | — |
| S3-v2 | `games/typing-defense/art-src/scenery/meadow/bamboo-clump-v2.png` | `/Users/toandx/htdocs/typing-game/games/typing-defense/art-src/scenery/meadow/bamboo-clump-v1.png` |
| S4-v1 | `games/typing-defense/art-src/scenery/meadow/raspberry-bush-v1.png` | — |
| S4-v2 | `games/typing-defense/art-src/scenery/meadow/raspberry-bush-v2.png` | `/Users/toandx/htdocs/typing-game/games/typing-defense/art-src/scenery/meadow/raspberry-bush-v1.png` |
| S5-v1 | `games/typing-defense/art-src/scenery/meadow/tall-grass-v1.png` | — |
| S5-v2 | `games/typing-defense/art-src/scenery/meadow/tall-grass-v2.png` | `/Users/toandx/htdocs/typing-game/games/typing-defense/art-src/scenery/meadow/tall-grass-v1.png` |
| S6-v1 | `games/typing-defense/art-src/scenery/meadow/reed-clump-v1.png` | — |
| S6-v2 | `games/typing-defense/art-src/scenery/meadow/reed-clump-v2.png` | `/Users/toandx/htdocs/typing-game/games/typing-defense/art-src/scenery/meadow/reed-clump-v1.png` |
| S7-v1 | `games/typing-defense/art-src/scenery/meadow/wildflowers-v1.png` | — |
| S7-v2 | `games/typing-defense/art-src/scenery/meadow/wildflowers-v2.png` | `/Users/toandx/htdocs/typing-game/games/typing-defense/art-src/scenery/meadow/wildflowers-v1.png` |
| S8-v1 | `games/typing-defense/art-src/scenery/meadow/fern-v1.png` | — |
| S8-v2 | `games/typing-defense/art-src/scenery/meadow/fern-v2.png` | `/Users/toandx/htdocs/typing-game/games/typing-defense/art-src/scenery/meadow/fern-v1.png` |
| S9-v1 | `games/typing-defense/art-src/scenery/meadow/rock-small-v1.png` | — |
| S9-v2 | `games/typing-defense/art-src/scenery/meadow/rock-small-v2.png` | `/Users/toandx/htdocs/typing-game/games/typing-defense/art-src/scenery/meadow/rock-small-v1.png` |
| S10-v1 | `games/typing-defense/art-src/scenery/meadow/rock-medium-v1.png` | — |
| S10-v2 | `games/typing-defense/art-src/scenery/meadow/rock-medium-v2.png` | `/Users/toandx/htdocs/typing-game/games/typing-defense/art-src/scenery/meadow/rock-medium-v1.png` |
| S11-v1 | `games/typing-defense/art-src/scenery/meadow/rotten-log-v1.png` | — |
| S11-v2 | `games/typing-defense/art-src/scenery/meadow/rotten-log-v2.png` | `/Users/toandx/htdocs/typing-game/games/typing-defense/art-src/scenery/meadow/rotten-log-v1.png` |
| S12-v1 | `games/typing-defense/art-src/scenery/meadow/canopy-block-v1.png` | — |
| S12-v2 | `games/typing-defense/art-src/scenery/meadow/canopy-block-v2.png` | `/Users/toandx/htdocs/typing-game/games/typing-defense/art-src/scenery/meadow/canopy-block-v1.png` |
| S13-v1 | `games/typing-defense/art-src/scenery/shared/tree-stump-v1.png` | — |
| S13-v2 | `games/typing-defense/art-src/scenery/shared/tree-stump-v2.png` | `/Users/toandx/htdocs/typing-game/games/typing-defense/art-src/scenery/shared/tree-stump-v1.png` |
| F1 | `games/typing-defense/art-src/backdrops/w1-silverfall/sky-a.png` | — |
| F3 | `games/typing-defense/art-src/backdrops/w1-silverfall/layer-320.png` | — |

## Sửa số lượng rõ ở lượt hai

Mỗi ảnh dưới chỉ thử lại một lần. Lượt đầu được giữ cạnh ảnh mới dưới tên `.v1.png`, là tham chiếu phong cách duy nhất. Bổ sung câu rõ số lượng, giữ toàn bộ recipe gốc. Biến thể v2 của ba loại này lùi sang 015b vì trần tổng 45 lượt.

### S3-v1

```text
Bright hand-painted storybook fantasy art for a cozy tower-defense game set in a Vietnamese-inspired folk valley of rice terraces, bamboo villages, silver waterfalls and white limestone hills. Chunky rounded shapes, strong simple silhouettes, fresh warm colours (young-rice green, ripe-rice gold, river silver, bamboo brown, limestone white, small cinnabar accents), clean even dark ink outlines, flat colour fills with soft painted texture, charming, lively and warm like a classic illustrated picture book. No text, letters, numbers, signature, watermark, logo, frame or border.
Single scenery cut-out for a 3D game that shows plants and rocks as flat painted billboards: exactly one object, whole and complete, centred, its base at the bottom centre of the image, a small empty margin on every side. Seen from the front, a little above eye level (about 10 degrees down), almost a side view, never from above. Flat, even, shadowless light from the front: no cast shadow, no strong highlight, no rim light, no sun direction. Foliage grouped into a few big rounded masses, each mass slightly darker on its underside. An even dark ink outline around the object and around each big mass. No ground, no soil, no grass, no pebbles and no flowers around the base: the base ends cleanly. No blur, no soft or see-through parts, no glow, no thin strands, no single hairs or needles, no tiny scattered leaves, no floating bits.
A clump of village bamboo about 7 metres tall: nine thick culms in green and pale yellow with clear joint rings, growing from one tight base and fanning gently outward, the tops arching over; the leaves grouped into four or five big solid rounded masses near the top, the culms visible between them.
v1: upright and full.
Flat pure #FF00FF magenta background, perfectly uniform, no gradient, no shadow, no glow on it; the subject contains no pink, magenta or bright purple at all.
Use the attached image only for the paint and outline style. Repaint one complete bamboo clump with exactly nine distinct thick culms rooted together. Keep all nine culms separately readable between the base and the top foliage; give each culm one clearly visible base. Group the foliage into exactly five broad rounded masses. Fit the complete clump within a portrait 1024 x 1536 canvas with clear magenta margins.
```

### S6-v1

```text
Bright hand-painted storybook fantasy art for a cozy tower-defense game set in a Vietnamese-inspired folk valley of rice terraces, bamboo villages, silver waterfalls and white limestone hills. Chunky rounded shapes, strong simple silhouettes, fresh warm colours (young-rice green, ripe-rice gold, river silver, bamboo brown, limestone white, small cinnabar accents), clean even dark ink outlines, flat colour fills with soft painted texture, charming, lively and warm like a classic illustrated picture book. No text, letters, numbers, signature, watermark, logo, frame or border.
Single scenery cut-out for a 3D game that shows plants and rocks as flat painted billboards: exactly one object, whole and complete, centred, its base at the bottom centre of the image, a small empty margin on every side. Seen from the front, a little above eye level (about 10 degrees down), almost a side view, never from above. Flat, even, shadowless light from the front: no cast shadow, no strong highlight, no rim light, no sun direction. Foliage grouped into a few big rounded masses, each mass slightly darker on its underside. An even dark ink outline around the object and around each big mass. No ground, no soil, no grass, no pebbles and no flowers around the base: the base ends cleanly. No blur, no soft or see-through parts, no glow, no thin strands, no single hairs or needles, no tiny scattered leaves, no floating bits.
A clump of riverside silver-grass about 1.6 metres tall: long arching grey-green leaves grouped into a few thick sweeping clumps, crowned by seven or eight big plumes in silvery cream-white, each plume one solid chunky teardrop shape with a gently scalloped edge (not wispy, not see-through), lighter toward its tip.
v1: upright.
Flat pure #FF00FF magenta background, perfectly uniform, no gradient, no shadow, no glow on it; the subject contains no pink, magenta or bright purple at all.
Use the attached image only for the paint and outline style. Repaint one upright silver-grass clump topped with exactly eight cream-white plumes. Make all eight plume tips distinct and separated, arranged at different heights. Each plume is a single thick solid teardrop with a gently scalloped edge. Fit the whole clump within a portrait 1024 x 1536 canvas with clear magenta margins.
```

### S12-v1

```text
Bright hand-painted storybook fantasy art for a cozy tower-defense game set in a Vietnamese-inspired folk valley of rice terraces, bamboo villages, silver waterfalls and white limestone hills. Chunky rounded shapes, strong simple silhouettes, fresh warm colours (young-rice green, ripe-rice gold, river silver, bamboo brown, limestone white, small cinnabar accents), clean even dark ink outlines, flat colour fills with soft painted texture, charming, lively and warm like a classic illustrated picture book. No text, letters, numbers, signature, watermark, logo, frame or border.
Single scenery cut-out for a 3D game that shows plants and rocks as flat painted billboards: exactly one object, whole and complete, centred, its base at the bottom centre of the image, a small empty margin on every side. Seen from the front, a little above eye level (about 10 degrees down), almost a side view, never from above. Flat, even, shadowless light from the front: no cast shadow, no strong highlight, no rim light, no sun direction. Foliage grouped into a few big rounded masses, each mass slightly darker on its underside. An even dark ink outline around the object and around each big mass. No ground, no soil, no grass, no pebbles and no flowers around the base: the base ends cleanly. No blur, no soft or see-through parts, no glow, no thin strands, no single hairs or needles, no tiny scattered leaves, no floating bits.
A forest-edge canopy block for the border of the map: a dense wall of broadleaf tree crowns in fresh spring green, made of round crowns stuck together side by side in offset rows; each row behind is taller and about 8% darker than the row in front; short trunks show only at the very bottom and end cleanly; the whole block reads as one solid connected shape.
v1: three crowns in two rows.
Flat pure #FF00FF magenta background, perfectly uniform, no gradient, no shadow, no glow on it; the subject contains no pink, magenta or bright purple at all.
Use the attached image only for the paint and outline style. Repaint a single connected forest-edge canopy block made of exactly three round crowns total: two crowns in the front row and one taller darker crown centred behind them. Keep the three crowns large, simple and unmistakable as three major masses, with short trunks only at the base. Landscape 1536 x 1024 with clear magenta margins.
```

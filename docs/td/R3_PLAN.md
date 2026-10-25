# R3 "Học và dạy": kế hoạch làm (25/10/2026, Mac mini M4)

> **Dành cho:** AI làm code R3, AI phản biện, chủ dự án.
> **Nguồn:** `BUILD_1B.md` §17 R3 (mục 1–5) và các mục nó trỏ tới: §9 (Neo, Phá Khiên), §10, §11, §12, §14, §15, §16, §18, §19, §20, §21, §22; `BUILD_NOTES.md` §7.5, §7.6; changelog `2026-10-25-td-1b-r2-fix2.md`, `2026-10-25-td-1b-r2-fix3.md`; `docs/games/BALANCE.md` (repo cha) §3, §4.1, §7.
> **Nền:** nhánh `main`, HEAD `89e2494` (sửa phản biện R2 lần 3). Đọc lại mã ở HEAD này trước khi viết; số dòng `file:dòng` là của HEAD này.
> **Thứ tự tin:** mã hiện tại > `BUILD_1B.md` > file này. File này không đổi luật của `BUILD_1B.md`; chỗ nó chọn một cách đọc, lý do ở §5.
> **Số đo ở đây là số Apple M4** (Mac mini M4 10 lõi, 16 GB, macOS 15.5, Chrome 155.0.8059.86 có GPU), trừ chỗ ghi Dell.

---

## 0. Tóm tắt

| # | Việc | File chính | Dòng `.ts` ước | Chunk vào ước (gzip) | Kiểm khi xong |
|---|---|---|---|---|---|
| 1 | Tách `__td`, "Chơi lại Ngày n", "Chép số chơi thử" ra chunk riêng; thêm "F5 để thử lại" | `main.ts`, `app/dev-tools.ts` (mới), `app/retry.ts` (mới), `vite.config.ts` | +40 | −1,6 kB | `pnpm check`; mọi kịch bản tìm thấy `__td`; `td-1b-night5`, `td-1b-chunks` |
| 2 | Học trong sim: Từ Ôn quay lại, sổ ôn nạp từ đầu ván, kế hoạch học | `sim/systems/learn.ts` (mới), `calls.ts`, `world.ts`, `rules.ts`, `hash.ts`, `stats.ts`, `events.ts` | +95 | +0,9 kB | test Học, file vàng làm lại |
| 3 | Học ở app: lưu sổ ôn, số lần gặp, kế hoạch trước ván, sự kiện học | `app/learn.ts` (mới, chunk riêng), `main.ts`, `scripts/td/replay.ts`, `scripts/td/retry-log.ts` | +165 | +0,2 kB | test app, `td-1b-learn` |
| 4 | Thẻ chữ: luật nghĩa, thẻ "Ôn" | `view/words/cards.ts`, `td.css` | +20 | +0,2 kB | `td-1b-learn` |
| 5 | Bảng dạy: câu Bà Cú Mực, chip, dòng "làm gì" trên thẻ nhà | `ui/tips.ts` (chunk riêng), `ui/hud.ts`, `ui/build-menu.ts` | +95 | +0,3 kB | `td-1b-story` |
| 6 | Dòng Chế độ trong Cài đặt; lưu sao | `ui/settings.ts`, `app/prefs.ts`, `ui/title.ts`, `ui/sheets.ts`, `main.ts` | +48 | +0,1 kB | `td-theme`, `td-1b-story` |
| 7 | Troll, Đầu Đàn, Neo, Phá Khiên (hộp cát) | `slice-1a.ts`, `types.ts`, `direct.ts`, `projectile.ts`, `move.ts`, `fx-2d.ts` | +105 | +0,9 kB | test, kịch bản `td-1b-direct` thêm phần R3 |
| 8 | Bot Học (sổ trống, sổ 20 từ), báo cáo B8 R3 | `tests/td/flow.ts`, `bot.ts`, `human.ts`, `scripts/td/balance*.ts` | (không tính) | — | `pnpm td:balance` |
| 9 | Lượt cân bằng R3: núm 1 (khoản mạng ở đỉnh boss), núm 2 (`LENGTH_BY_E` cùng `kHp2`), núm 3 chỉ sau đó | `sim/systems/boss.ts`, `slice-1a.ts`, `rules.ts` | +33 | +0,3 kB | đủ bảng BALANCE §3, B1–B9, G1–G8 |
| 10 | File vàng, kịch bản `td-1b-learn`, `td-1b-story`, `td-1b-tour`, chạy lại mọi kịch bản trên Mac, đo §20 so với mốc ở §1.2 | `tests/golden/*`, `scripts/visual/scenarios/*` | (không tính) | — | §21 |
| 11 | Giấy tờ, gói chơi thử cho chủ dự án (§22) | `BUILD_NOTES.md` §7.7, `BUILD_1B.md`, changelog, `AGENTS.md` | — | — | — |

- Cộng dồn: 9.670 → khoảng 10.270 dòng, trần R3 **10.500** (§8).
- Chunk vào ở "/": 82,04 kB → khoảng 80,4 kB sau bước 1 → khoảng 83,3 kB sau R3 (trần 85 kB; §1.1, §8).
- Bước 1 làm **trước mọi thứ**: không tách thì 2,96 kB còn trống chỉ vừa ~2,9 kB phần R3 ở chunk vào, chưa tính `app/learn.ts` (~1,3 kB nếu không tách), tức không còn chỗ nào.

### Tiến độ (cập nhật theo từng commit)

| Bước | Trạng thái | Commit | Số đo (Apple M4) |
|---|---|---|---|
| 1 | xong | (bước 1) | "/" 80,84 kB gzip, chừa 4,16 kB (ước 80,4); `dev-tools` 1,40 kB, `retry` 0,86 kB nạp sau; `td-1a-boot`, `td-1b-chunks` (thêm lượt chặn `retry`), `td-1b-night5` đạt ở 1280 × 720 |
| 2 | xong | (bước 2) | "/" 81,78 kB (+0,94; ước +0,9). Dòng `.ts` 10.057 (trần 10.500). File vàng làm lại: `td-1b-boss` chỉ đổi mã băm (hai cột sổ ôn, kho `learn`, cột `review` của lời gọi; số liệu ván y hệt), `td-1a` chơi sổ 6 từ (§6): Từ Ôn gõ lại 7, Chuộc lại 5, từ đến hạn 6, từ mới 8 |
| 3–6 | đang làm | | |
| 7–11 | chưa | | |

---

## 1. Mốc đo trước R3 (Apple M4)

### 1.1 Ngân sách gói: số dựng thật

`BUILD_NOTES` §7.5 ghi "chừa 2,44 kB": số Dell, mã sửa lần 2. Mã sửa lần 3 dựng trên Mac chừa **2,96 kB** (§7.6; bản dựng của Mac nhỏ hơn Dell 0,6 kB). Để biết tách thì được bao nhiêu, ba cây `git archive` của `89e2494` được dựng (`vite build` rồi `scripts/bundle-budget.mjs`; bằng chứng `tmp/mac-2026-10-25/r3-plan/`):

| Cây | "/" (chunk vào + màn đầu) | `?title=0` | Cả gói |
|---|---|---|---|
| HEAD | 82,04 kB (chừa 2,96) | 77,53 | 91,01 |
| bỏ khối `installDevHandle({…})` (`main.ts:370-433`) | 80,91 (−1,13) | 76,39 | 89,88 |
| bỏ thêm phần chạy lại lúc vào trang (`main.ts:146-155`), `takeRetry` (`:114-123`), `balanceOf`, `copyNumbers`, `retryDay` (`:339-368`) | 80,18 (−0,73) | 75,66 | 89,15 |

- Hai phần này chỉ kịch bản dùng (`__td`), hoặc chỉ dùng ở thẻ kết ("Chơi lại Ngày n", "Chép số chơi thử"), hoặc chỉ ở trang chơi lại. Chuyển vào chunk nạp sau thì chunk vào còn giữ chỗ gọi `import()` (~0,1–0,2 kB mỗi chỗ). Ước "/" **~80,4 kB, chừa ~4,6 kB** trên Mac (Dell ~4,0 kB).
- Phần R3 ở lại chunk vào (sim Học, thẻ chữ, khung câu dạy, quái R3, núm cân bằng: ~330 dòng) theo tỉ lệ của R2 (5,3 kB cho ~600 dòng) là **~2,9 kB**. Phần nạp sau: `app/learn.ts`, bảng câu dạy, thẻ Cài đặt, thẻ kết.
- Còn ~1,7 kB trên Mac sau R3. Núm dự trữ nếu thiếu: lớp boss `view/boss-2d.ts` (406 dòng) và `view/fx-2d.ts` (226) nạp sau khi trang dùng được (boss chỉ có từ Ngày 5 hay lệnh `boss` của hộp cát), ước −3 đến −4 kB; `__td.ready()` phải chờ chunk đó.

### 1.2 Hồ sơ một khung ở 60 Hz (Chrome tracing qua CDP)

`BUILD_NOTES` §7.5 để mở trước R3: "lấy hồ sơ CPU của một khung ở 60 Hz để biết phần nào của ~4 ms là vẽ canvas, phần nào là Chrome chờ GPU". Đã đo trên Mac (25/10 20:23–20:24, tải máy 2,8–3,8, chỗ trình duyệt của `heavy.sh` giữ suốt lượt; bằng chứng `tmp/mac-2026-10-25/r3-baseline/`: `perf-trace.mjs`, `analyze.mjs`, `partition.mjs`, `analysis-*.txt`, `partition.txt`, vết `trace-*.json`, `cpu-*.cpuprofile`).

- **Cách đo.** Cảnh của `td-1b-perf` (hộp cát, Đặt sẵn, tháp cấp 3, Draconis ở ngã ba, boss đã trồi, `flood(300)`), nhịp khung giữ 60 Hz như `td-1b-perf`. Ba cửa sổ 3 s: "trơn" (không vết, đọc `TaskDuration` như `td-1b-perf`), "đều" (có vết, boss + ~304 quái + Mầm Gỗ), "mưa" (có vết, Tối Thượng dùng ở đầu cửa sổ). Lũ bù về 300 giữa các cửa sổ, không bù trong cửa sổ. Vết: `Tracing.start` qua CDP (nhóm `devtools.timeline`, `toplevel`, `v8.execute`, `disabled-by-default-v8.gc`, `gpu`, `cc`, `viz`); một bản sao của `cdp-run.mjs` trong `tmp` có thêm `page.on()` để nhận `Tracing.tracingComplete` (kit không sửa). Rồi 3 s bộ lấy mẫu V8 (`Profiler`, 100 µs) để chia phần JS theo hàm.
- Vết không làm chậm khung đo được: "trơn" 1,35 ms mỗi khung, "đều" có vết 1,32 ms (1280 × 720).

**Luồng chính trang (CrRendererMain), ms mỗi khung, 60,0 khung/s:**

| | 1280 × 720 đều | 1280 × 720 mưa | 1920 × 1080 đều | 1920 × 1080 mưa |
|---|---|---|---|---|
| Bận cả khung (việc cấp cao) | **1,32** | **1,62** | **1,33** | **1,51** |
| Hàm khung của game (`FireAnimationFrame`, cả cây: bước sim, HUD, tiếng, vẽ 2D, thẻ chữ, GC xảy ra trong đó) | 0,91 | 1,01 | 0,88 | 0,92 |
| Chrome gửi lớp và lệnh vẽ sang GPU (`Commit`, cả cây; trong đó `RasterCHROMIUM` 0,11–0,13) | 0,21 | 0,22 | 0,22 | 0,22 |
| Style, layout, prepaint, paint, layerize ngoài hàm khung | 0,04 | 0,17 | 0,04 | 0,18 |
| GC ngoài hàm khung (trung bình) | 0,03 | 0,04 | 0,05 | 0,03 |
| Còn lại: lịch, IPC, hẹn giờ của lớp giữ nhịp, phần riêng của `BeginMainFrame` | 0,13 | 0,17 | 0,15 | 0,16 |
| Khung p10 / p50 / p90 | 0,99 / 1,24 / 1,65 | 1,18 / 1,44 / 2,01 | 1,03 / 1,22 / 1,63 | 1,13 / 1,37 / 2,01 |
| Khung dài nhất | 6,25 (GC lớn 1,77 + đánh dấu từng phần) | 9,93 (khung dùng Tối Thượng: hàm khung 6,9) | 5,95 | 9,85 |
| Ngoài luồng chính: tiến trình GPU (`CrGpuMain`) / Viz / Compositor của trang | 1,47 / 0,20 / 0,31 | 1,66 / 0,21 / 0,42 | 1,59 / 0,23 / 0,35 | 1,71 / 0,25 / 0,46 |

**Một khung (khung trung vị của cửa sổ "đều", 1280 × 720, #114, bận 1,243 ms trong 16,8 ms):**

```
RunTask 1,168
  ProxyMain::BeginMainFrame 1,158
    FireAnimationFrame 0,873
      FunctionCall 0,855          ← runFrameLoop: update (bước, HUD, tiếng) rồi draw (2D, thẻ chữ)
    PrePaint 0,030
    Commit 0,195
      LayerTreeHost::DoUpdateLayers 0,158
        RasterImplementation::RasterCHROMIUM 0,112   ← lệnh vẽ canvas chuyển sang tiến trình GPU
7 việc nhỏ khác (lịch, hẹn giờ của lớp giữ nhịp) 0,075
```

**JS theo hàm** (bộ lấy mẫu, cửa sổ "đều", 182 khung, 1280 × 720; số của máy chủ dev, mã chưa nén): hàm khung 0,75 ms mỗi khung. Trong đó vẽ 2D `DebugView.draw` (`view/debug-2d.ts:135`) 0,49 ms: thân quái `enemies` (`:627`) 0,18, mỗi quái một `disc` (`:176`, `arc` + `fill`) 0,15, chữ trên bản đồ `text` (`:192`) 0,06, lớp boss `over` (`view/boss-2d.ts:192`) 0,05, cây 0,04; bước sim `step` 0,06 (một bước mỗi khung); `showHud` 0,05; thẻ chữ `WordCards.draw` 0,03; `Hud.boxes` (`ui/hud.ts:211`) 0,02 vì thanh boss đổi HTML gần mỗi khung nên hộp HUD được đo lại (`getBoundingClientRect`) mỗi khung. Phần "(program)" của V8 thêm 0,47 ms mỗi khung (việc gốc của Chrome khi ghi lệnh canvas, ngoài JS).

**Đọc số:**

- Trên Apple M4, §20 (luồng chính ≤ 4 ms mỗi khung ở 60 Hz, không khung > 16,7 ms) còn rộng: 1,3–1,6 ms; khung dài nhất 9,9 ms là khung dùng Tối Thượng, 6,3 ms là một lần GC lớn.
- Hai phần ba luồng chính là chính hàm khung của game; trong đó vẽ 2D là phần lớn nhất, và thân 300 quái (mỗi quái một path) là mục lớn nhất của vẽ 2D. Phần Chrome tự làm ngoài hàm khung (gửi lệnh sang GPU, lifecycle, lịch) ~0,4 ms (đều) đến ~0,6 ms (mưa). Tiến trình GPU tốn 1,5–1,7 ms mỗi khung nhưng ở luồng khác, không cộng vào luồng chính.
- Không suy được nguyên nhân 3,9–4,6 ms của Dell từ số Mac (máy khác, GPU khác). Lần đo lại trên Dell nên dùng cùng `perf-trace.mjs` để so từng dòng của bảng trên.
- R3 gần như không thêm việc mỗi khung (khung câu dạy và luật nghĩa chỉ đổi khi có sự kiện). Núm rẻ nếu cần chỗ: chỉ đo lại hộp HUD khi cỡ panel đổi, không khi chữ thanh boss đổi (~0,02 ms và một lần layout ép buộc mỗi khung).
- Mốc so sánh cho R3 (§9, cổng 8): cùng kịch bản, cùng máy, đo xen kẽ với mã `89e2494`.

---

## 2. Thứ tự làm (ngân sách trước)

Mỗi bước: làm → test, `pnpm check` → commit nhỏ. Hết bước 11: phản biện độc lập R3, rồi sửa (`BUILD_1B` §17: làm → phản biện → sửa). Lệnh nặng chạy dưới `.local/bin/heavy.sh` của repo cha (trình duyệt: `--gpu`).

1. **Tách chunk** (§3.1). Không đổi luật, file vàng không đổi. Đo lại "/" và ghi vào `BUILD_NOTES` §7.7.
2. **Học trong sim** (§3.2). Đổi luật nên file vàng làm lại cùng commit (`pnpm td:golden:update`, ghi lý do ở changelog).
3. **Học ở app** (§3.3). Đầu ván mang thêm `learn`; `flags()`, file chạy lại, "Chơi lại Ngày n" mang theo.
4. **Thẻ chữ** (§3.4).
5. **Bảng dạy** (§3.5).
6. **Chế độ, sao** (§3.6).
7. **Quái R3 ở hộp cát** (§3.7). Chỉ làm khi sau bước 6 còn ≥ 150 dòng dưới trần và ≥ 1,2 kB trống ở "/" (thứ tự cắt §8).
8. **Bot Học, báo cáo B8 R3** (§3.8).
9. **Cân bằng R3** (§7).
10. **File vàng cuối, kịch bản, hiệu năng** (§6, §9).
11. **Giấy tờ, gói chơi thử** (§9).

---

## 3. Việc và file

### 3.1 Tách chunk (bước 1)

| Phần | Bây giờ | Sau |
|---|---|---|
| `window.__td` | `installDevHandle({…})` trong `main.ts:370-433` (64 dòng; `state()` đọc mọi store) | `app/dev-tools.ts` xuất `devHandle(ctx)`; `main.ts` truyền một `ctx` nhỏ (thế giới, phiên, lựa chọn, bộ từ, các getter `painted`, `runHeader`, `startMode`, `replayed`, chunk) và nạp chunk này **khi trang dùng được** (cùng `prefetch()`, `main.ts:209-213`). `__td.ready()` giữ nguyên nghĩa |
| Chạy lại khi vào trang | `takeRetry`, khối chạy lại (`main.ts:112-155`) | `main.ts` chỉ đọc `sessionStorage` có `td.retry` không (vài dòng); có thì `await import("./app/retry")` rồi chạy lại trước bước đầu. Trang không có lượt chơi lại không tải chunk này |
| `retryDay`, `copyNumbers`, `balanceOf` | `main.ts:339-368` | `app/retry.ts`; chunk thẻ (`sheets`, `main.ts:195-206`) nhập nó, vì chỉ nút ở thẻ kết gọi hai việc đầu. `__td.balance` nhập cùng chunk |
| Câu báo khi thẻ không tải được | "Tạm dừng · Esc để chạy tiếp (thẻ tạm dừng chưa tải được)" (`main.ts:262`) | thêm "· F5 để thử lại" (việc mở của §7.6; Chrome 155 chỉ gỡ được bằng F5) |

- `vite.config.ts:43` (`manualChunks`): mọi module nạp sau phải có trong biểu thức, không thì Rollup gộp nó vào chunk `game` (chunk vào) và việc tách mất tác dụng. Thêm `app/(sandbox|dev-tools|retry|learn)` và `ui/tips`. Test mới đọc `main.ts` và `vite.config.ts`: mỗi `import("./…")` trong `main.ts` có trong biểu thức.
- Kịch bản đã chờ `window.__td` có mặt rồi mới gọi (`td-1a6-common.mjs:21-27`, `td-1a-boot.mjs:18-21`), nên `__td` đến muộn không làm hỏng chúng. Kiểm trên Mac: chạy lại đủ 18 kịch bản ở bước 10.
- `td-1b-chunks` thêm một lượt chặn chunk `retry`: thẻ kết vẫn hiện, nút "Chơi lại Ngày n" chuyển thành "Chơi lại từ đầu" kèm dòng HUD báo; một lỗi console.

### 3.2 Học trong sim (bước 2; §11.2–§11.4)

Sim giữ mọi thứ quyết định từ nào ra (tất định, vào mã băm). App chỉ đưa vào **đầu ván** ba danh sách id từ (§4).

| Việc | Ở đâu | Luật |
|---|---|---|
| Sổ ôn của ván | `world.ts:61-66` (`review`, `reviewN`, 20 từ) | thêm hai cột song song: `reviewAt` (tick đến hạn quay lại), `reviewBack` (đã quay lại mấy lần). `review()` (`calls.ts:246-253`) dời ba cột cùng nhau |
| Nạp sổ đã lưu | `createWorld` | `learn.book` của đầu ván (≤ 20 id mới nhất) vào sổ ôn lúc tick 0, theo thứ tự cũ → mới; id không có trong bộ từ thì bỏ (bộ từ có mã băm riêng, nên vẫn tất định) |
| Hẹn quay lại | `review()` khi thêm từ | `reviewAt = tick + rand(25; 45) s` (luồng `words`); từ nạp từ đầu ván cũng hẹn như vậy từ tick 0 |
| Từ Ôn | `giveWord` (`calls.ts:91-109`) cho lời gọi Gặt, Chặt, Xây, Đào (cả nâng cấp) | nếu: chưa có Từ Ôn nào sống; lời gọi có ≥ 4 từ và chưa có Từ Ôn (≤ 25 % số từ, §5 A3); có từ trong sổ đã đến hạn, `reviewBack < 2`, chữ đầu còn trống (như `quizWord`, `calls.ts:80-85`): từ đó là từ kế, loại `KIND.review`, `reviewBack + 1`. Không thì rút như cũ |
| Gõ xong Từ Ôn | `finishWord` (`calls.ts:256-266`) | không lỗi hoặc hạng ≥ Tốt: "Chuộc lại", +1 Tri thức, rời sổ, sự kiện `review` (`redeemed: true`), thống kê `reviewRedeemed`. Còn lại: ở sổ, hẹn lại 25–45 s; từ dời về cuối sổ (Ẩu) vẫn giữ `reviewBack` |
| Kế hoạch học | `sim/systems/learn.ts` (mới, ~60 dòng), gọi từ `giveWord` cho lời gọi kinh tế | chọn phần bằng luồng `words`: đến hạn 60 % (`learn.due`), cấp hiện tại 25 % (túi như nay), mới 15 % (`learn.fresh`); sổ trống (khởi động lạnh): 85 % / 15 %. Trong phần đã chọn, rút từ hợp dải độ dài của E và chữ đầu còn trống; không có thì về túi cấp hiện tại. **Đầu ván không có danh sách nào thì không rút phần nào** (không tốn số ngẫu nhiên), nên chạy lại cũ không đổi vì phần này |
| Từ mới | cùng chỗ | ≤ 8 mỗi ván (`freshWords`); không bao giờ ở Bắn mạnh, gõ trực tiếp, Chữ Chiêu, Dồn lửa (những lời gọi đó không đi qua kế hoạch); không ở Đêm 5 của ải (đêm boss) |
| Hỏi bài | `economy.ts:276-283`, `quizWord` | giữ như 1A.6 (hỏi từ cũ nhất trong sổ) |

- Mã băm: hai cột mới nằm trong `w.typing` nên `mixStore` băm chúng; danh sách kế hoạch và bộ đếm nằm trong kho `w.learn` (mới), thêm vào `hash.ts:56`. Đổi này đổi mọi mã băm, nên file vàng làm lại ở bước 2 dù luật cũ không đổi.
- Thống kê thêm ở **cuối** `STATS` (`stats.ts:6-17`): `reviewBack`, `reviewRedeemed`, `freshWords` (bước 9 thêm `livesDrain`). Sự kiện hiếm `review` (`events.ts`).

### 3.3 Học ở app (bước 3; §11.1, §11.3–§11.5): `app/learn.ts`

Một chunk riêng (~150 dòng, trần §16 là 200). Ở "/" nó tải cùng lúc với màn đầu; "Bắt đầu" chờ nó (thường đã xong) rồi đặt đầu ván ở tick 0 bằng `setLearn`, như `setPace`, `setMode` (`main.ts:165-174`, `pace.ts:52-66`); ở `?title=0`, `?sandbox=` trang chờ nó trước bước đầu, nên `scripts/bundle-budget.mjs` tính nó vào phần khởi động của `?title=0` (chỗ trống ở đó 7,47 kB). Chunk không tải được: ván chạy khởi động lạnh, không lưu sổ, một lỗi console.

| Việc | Luật |
|---|---|
| Kho `typing-defense.learn` (`safe-storage` của kit) | `{ v: 1, book: id[] (≤ 40, cũ trước), seen: { id: số lần gặp } }`; chỉ app và view đọc, không vào sim, không vào mã băm (§11.1) |
| Kế hoạch trước ván (hàm thuần `planFor(deck, store, vocab, seed)`, không DOM, để bot trên Node gọi được) | `due` = sổ đã lưu (≤ 40; sau này có cổng cha thì thêm từ `lookup` đến hạn, §5 A5); `fresh` = tối đa 24 từ ở cấp cao nhất của ván chưa từng gặp (`seen` không có), theo thứ tự bộ từ xoay theo seed (sim chỉ lấy ≤ 8); `book` = 20 id mới nhất của sổ đã lưu. Khởi động lạnh khi `book` và `seen` trống |
| Hết ván (thắng, thua, `pagehide`) | sổ mới = sổ đã lưu trừ từ đã "Chuộc lại" (đọc sự kiện `review`), cộng sổ của ván, bỏ trùng, giữ 40 từ mới nhất |
| Số lần gặp | +1 mỗi lần một từ ra thẻ sáng (`wordSpawn`); chỉ đếm tới 3; tối đa 3.000 id, bỏ id cũ nhất |
| Sự kiện học (§11.5) | mỗi từ gõ xong một sự kiện, gửi gộp mỗi 5 s qua `learningBridge()` (`app/learning.ts`): `buildCombatLearningEvent` cho từ lời gọi (`perfect` = không Ẩu, nghĩa là "đúng" theo §11.5), `buildRecallLearningEvent` cho Hỏi bài. `entry` dựng từ bộ từ (`id`, chữ, `vi`, `ipa`). Phần chạy lại của "Chơi lại Ngày n" không gửi (sự kiện của nó bị bỏ, `main.ts:154`) |
| Đầu ván mang `learn` | `Session` → `createWorld({ learn })`; `flags()` thêm `learn`; `scripts/td/replay.ts` đọc `learn`; kiểu `Retry` và `scripts/td/retry-log.ts` mang `learn` |

### 3.4 Thẻ chữ (bước 4; §11.1, §11.2)

- `cards.ts:120` hiện nghĩa chỉ ở chế độ Học. Đổi thành một luật (đặt ở chunk vào, ~15 dòng, đọc `seen` mà `app/learn.ts` đưa vào; chunk chưa về thì hiện nghĩa):

| Khi | Nghĩa dưới từ, trước khi gõ |
|---|---|
| Học, Thư giãn; hồ sơ trẻ em (`profile.audience === "child"`) | luôn |
| Cân bằng | khi `seen` < 2 |
| Thử thách | khi `seen` < 1 |
| Hỏi bài, Từ Ôn | luôn |
| Từ đang khóa có ≥ 3 lỗi | hiện lại từ lúc đó |

- Thẻ Từ Ôn: viền xanh ngọc (`--vd-jade`), nhãn "Ôn" ở góc, luôn có nghĩa. Gõ "Chuộc lại": dấu "Chuộc lại" thay dấu hạng.
- Gõ xong: nghĩa hiện 1 s như nay, mọi chế độ (không đổi).

### 3.5 Bảng dạy (bước 5; §12)

- `ui/tips.ts` (`ui/tips.ts:1-10`, hai hàng boss của R1) thêm 8 hàng Ngày 1–4, Đêm 1–4 của §12 và dòng "làm gì" của từng nhà. Thành chunk riêng, tải khi trang dùng được; chưa về thì chưa hiện câu (không chặn ván).
- `BossBanner` (`ui/hud.ts:98-180`) hiện trả "" khi chưa có boss (`hud.ts:162`). Đổi thành một khung câu dạy dùng chung: lúc boss chưa thức, đầu mỗi Ngày, Đêm của truyện hiện câu Bà Cú Mực (mỗi câu một dòng, 3,8 s như nay, `hud.ts:140-142`) và chip của hàng đó; chip ở lại tới hết Ngày, Đêm đó. Mỗi Ngày, Đêm tối đa 2 câu tự hiện. Hộp cát không hiện.
- Thẻ nhà (`ui/build-menu.ts`): nhà đã mở mà chưa tới lượt dạy có một dòng "làm gì" ngắn trên thẻ (đọc khi cần, không tự hiện).
- Thứ tự lớp §13.1 giữ: khung câu ở đỉnh màn, thẻ chữ tránh hộp HUD như nay (`hud.boxes`).

### 3.6 Chế độ, sao (bước 6; §14, §4.3)

- `app/prefs.ts:8`: `Settings` thêm `mode: Mode | null` (null: theo hồ sơ, trẻ em Thư giãn, người lớn Cân bằng; BALANCE §3 "hồ sơ trẻ em dùng dải Thư giãn"). `ui/settings.ts`: dòng "Chế độ" (← → đổi), ghi "áp dụng ván sau".
- Đổi ở màn đầu trước khi ván chạy thì áp dụng ngay (như "Nhịp tự điều", `main.ts:169-170`, `setMode` chỉ nhận ở tick 0).
- Lưu sao: `td.campaign` `{ v: 1, best: { "w1-silverfall": 0–3 } }`, ghi khi thắng (cả khi thắng sau "Chơi lại Ngày n", §4.3). Hiện ở dòng "Bắt đầu" của màn đầu (`title.ts:20`) và thẻ thắng ("Kỷ lục ★★").

### 3.7 Troll, Đầu Đàn, Neo, Phá Khiên (bước 7; §9.2, §10; chỉ hộp cát)

- Dữ liệu (`slice-1a.ts`): `cuong-thi-lead` (160 máu, giáp 30 %, 3,4 m/s, lọt 2, 25 vàng), `troll` (600, 30 / 30, 2,0 m/s, lọt 3, 30 vàng, chặn 2). `AbilitySpec` (`types.ts:94`) thành hợp ba dạng theo `verb`: `interrupt` (như nay), `anchor` (`need` 4, `radiusM` 6, `reachM` 20, `cooldownS` 15, `freezeS` 3, `takenMul` 1,3, `takenS` 6, `auraSpeed` 1,2), `shield` (`reachM` 25, `cooldownS` 6, `domeM` 4, `outsideMul` 0,3, `stunS` 1,5, `lockS` 10).
- Luật (`direct.ts`, cùng khung lời gọi `direct`, cửa sổ T, tối đa 2 mở): Neo gõ được: quái trong 6 m đứng sững 3 s, Đầu Đàn nhận ×1,3 sát thương 6 s; hào quang +20 % tốc trong 6 m luôn có (`move.ts`). Phá Khiên gõ được: vòm vỡ, Troll choáng 1,5 s, 10 s không dựng lại; để chạy: vòm 4 m giữ T giây, đạn bắn từ ngoài vòm vào quái trong vòm ×0,3 (`projectile.ts`; cận chiến, lông Tối Thượng không đổi).
- Không vào ải truyện: Đêm 1–5 không đổi, cân bằng truyện không đổi vì phần này. Lệnh hộp cát `spawn` nhận hai id mới; bảng hộp cát thêm nút.
- Hình: vòng đá xám đậm có vạch quanh Troll lúc dựng vòm, cờ hiệu nhỏ trên Đầu Đàn và vòng hào quang mờ (`fx-2d.ts`); thẻ trực tiếp dùng chung kiểu cuộn giấy của R2.

### 3.8 Bot Học, báo cáo (bước 8; §18.1 R3, §18.3 B8)

- Hai hồ sơ học cho bot, đầu ván do cùng hàm `planFor` của `app/learn.ts` tính: **sổ trống** (khởi động lạnh: `due` rỗng, có `fresh`, nên bot gặp từ mới như người mới) và **sổ 20 từ** (20 từ cố định của cấp 1–3, ghi trong `tests/td/flow.ts`, `seen` đủ cho mọi từ cấp ≤ 2). Ma trận BALANCE §3 chạy sổ trống như cũ; thêm hàng "sổ 20 từ" cho bot Chuẩn ở Cân bằng (cổng chặt vẫn đọc sổ trống, sổ 20 từ in để so).
- `HumanTypist` (`tests/td/human.ts:23-26`): Từ Ôn là từ "đang học" (d 0,85), từ mới là "mới" (như từ cấp cao nhất nay).
- Báo cáo thêm (bảng R3): Từ Ôn mỗi ván, Chuộc lại mỗi ván, từ mới mỗi ván (lớn nhất), từ mới ở lời gọi có hạn (phải 0), tỉ lệ gõ Đêm 1–4, Đêm 5 (G2, vì Từ Ôn thêm chữ ban Ngày), cửa sổ 20 s (G1 cổng 5a, 5b).
- B8 R3: `learnOk` (`tests/td/flow.ts:72-75`) thêm: ≤ 8 từ mới mỗi ván và 0 từ mới ở lời gọi có hạn.

---

## 4. Dạng dữ liệu

```ts
// src/content/rules.ts (thêm; BUILD_1B §15 đã có bản phác)
export const LEARN = {
  returnS: [25, 45], perCall: 1, minCallWords: 4, returns: 2,          // §11.2
  plan: { due: 0.6, current: 0.25, fresh: 0.15 }, cold: { current: 0.85, fresh: 0.15 }, freshMax: 8, // §11.4
  bookRun: 20, bookSaved: 40, seenCap: 3, meaningErrors: 3,            // §11.1, §11.3
} as const;

// src/sim/systems/learn.ts (mới): đầu ván, vào file chạy lại và "Chơi lại Ngày n"
export type LearnHeader = { book: readonly string[]; due: readonly string[]; fresh: readonly string[] }; // id của bộ từ; cả ba rỗng = không kế hoạch; khởi động lạnh = book, due rỗng, fresh có từ
// World thêm (băm): learn: { due: Int32Array; fresh: Int32Array; freshDealt: number; reviewLive: number /* ô từ, −1 */ }
// Typing thêm (băm qua mixStore): reviewAt: Int32Array(20), reviewBack: Uint8Array(20)
// WorldOptions thêm: learn?: LearnHeader

// src/sim/events.ts (thêm)
| { t: "review"; tick: number; word: number; redeemed: boolean }  // word: chỉ số bộ từ

// src/app/learn.ts: kho typing-defense.learn (chỉ app, view)
type LearnStore = { v: 1; book: string[]; seen: Record<string, number> };
// src/app/prefs.ts: Settings thêm mode: Mode | null
// td.campaign
type Campaign = { v: 1; best: Record<string, number> };

// src/content/types.ts: AbilitySpec thành hợp (bước 7)
type AbilitySpec =
  | { verb: "interrupt"; cooldownS: number; radiusM: number; need: number; reachM?: number; healPct: number; stunS: number; gold: number }
  | { verb: "anchor"; cooldownS: number; radiusM: number; need: number; reachM: number; freezeS: number; takenMul: number; takenS: number; auraSpeed: number }
  | { verb: "shield"; cooldownS: number; reachM: number; domeM: number; outsideMul: number; stunS: number; lockS: number };

// BossDef thêm (bước 9, núm 1; everyS 0 = tắt, để `--set` thử được)
drain: { everyS: number; lives: number; warnS: number };
```

- `flags()` (`main.ts:376`) và file chạy lại thêm `learn`; file cũ không có `learn` thì đọc là đầu ván rỗng (không danh sách nào, không rút phần nào), chạy lại như trước.
- Thống kê mới chỉ thêm ở cuối `STATS`, nên chỉ số cũ không dời.

---

## 5. Chỗ đặc tả chưa rõ: phương án đã chọn

Luật của chủ dự án (process §2): chỗ cần chọn thì làm theo đề xuất và ghi "đã chọn theo đề xuất".

| # | Chỗ | Lựa chọn | Đã chọn | Lý do |
|---|---|---|---|---|
| A1 | §11.1 "gặp từ đó" là gì | (a) từ ra thẻ sáng; (b) đã gõ; (c) ra thẻ cả khi mờ | (a), **đã chọn theo đề xuất** | Nghĩa để đọc trước khi gõ; thẻ mờ thì không ai đọc. Đếm ở `wordSpawn` (từ chỉ ra khi lời gọi sáng) |
| A2 | §11.2 thời điểm quay lại | (a) 25–45 s rút bằng luồng `words`; (b) cố định 35 s | (a), **đã chọn theo đề xuất** | Đúng chữ của đặc tả; §3 nói 1B không cần luồng mới |
| A3 | §11.2 "≤ 25 % số từ của lời gọi" | (a) theo từng lời gọi: một Từ Ôn khi lời gọi có ≥ 4 từ (Chặt 4, Xây L, XL); (b) tối đa 1 mỗi lời gọi và ≤ 25 % số từ kinh tế cả ván; (c) làm tròn lên: mọi lời gọi được 1 | (a), **đã chọn theo đề xuất** | Đọc đúng chữ (1/4 = 25 %), không cần bộ đếm cả ván. Chặt (4 từ) và Xây nhà cỡ L, XL có chỗ; Gặt (3), Đào (2), nâng cấp (3) thì không (`rules.ts:63`). Nếu `td-1b-learn` hay báo cáo cho thấy quá ít từ quay lại (đích: từ vào sổ quay lại ít nhất một lần ở ≥ 70 % ván bot Chuẩn), đổi sang (b) |
| A4 | §11.2 "Gõ không lỗi hoặc Tốt" | (a) không lỗi, hoặc hạng Chớp, Hoàn hảo, Tốt; còn lại (Vừa có lỗi, Ẩu) ở sổ; (b) chỉ Ẩu ở sổ | (a), **đã chọn theo đề xuất** | Câu gốc chỉ nói Ẩu ở lại; Vừa có lỗi chưa phải "nhớ được", nên quay lại lần nữa (tối đa 2 lần) |
| A5 | §11.4 "nếu có cổng cha thì `lookup` độ thuộc" | (a) R3 chỉ dùng sổ đã lưu trên máy; (b) hỏi cổng cha trước ván, chờ có hạn | (a), **đã chọn theo đề xuất** | Kế hoạch phải xong trước tick 0; một vòng hỏi cổng cha thêm chờ ở đầu ván và một đường lỗi. Từ đến hạn của cổng cha vào cùng danh sách `due` sau, không đổi sim |
| A6 | §11.3 sổ 40 từ, sổ của sim 20 từ | (a) đầu ván nạp 20 từ mới nhất vào sổ của sim, cả 40 vào `due`; (b) sổ sim 40 | (a), **đã chọn theo đề xuất** | Giữ `CALL.review` 20 (Hỏi bài, HUD "Sổ ôn", thẻ kết đã theo 20); sổ 40 chỉ là bộ nhớ dài |
| A7 | §11.4 "cấp hiện tại", "từ mới" | (a) cấp hiện tại = túi cấp 1..`vocab` như nay; mới = cấp `vocab` (cao nhất của ván) chưa gặp; (b) chỉ cấp `vocab` | (a), **đã chọn theo đề xuất** | Không đổi túi đang có (cân bằng R1, R2 đo trên nó) |
| A8 | §11.5 gửi sự kiện cả ở hộp cát? | (a) cả truyện và hộp cát; (b) chỉ truyện | (a), **đã chọn theo đề xuất**; sổ ôn và số lần gặp cũng lưu ở cả hai | Gõ ở đâu cũng là học; `td-1b-learn` đọc hàng đợi ở hộp cát |
| A9 | §12 chip ở đâu, bao lâu | (a) trong khung câu dạy ở đỉnh màn, tới hết Ngày, Đêm đó; (b) chỉ 3,8 s cùng câu | (a), **đã chọn theo đề xuất** | Chip ≤ 8 chữ là mẹo để tra; câu tự hiện mới phải ngắn và ít |
| A10 | §14 Chế độ trong Cài đặt, còn mục "Học" của màn đầu | (a) giữ mục "Học" (ván Học ngay, không đổi Cài đặt), thêm dòng Chế độ; (b) bỏ mục "Học" | (a), **đã chọn theo đề xuất** | Không phá `td-theme`, `td-1a6-learn` và cách chủ dự án đã quen |
| A11 | §9.2 Neo: để chạy thì sao | (a) không phạt thêm (hào quang +20 % luôn có), gõ được mới có thưởng; (b) để chạy thì hào quang ×2 trong T | (a), **đã chọn theo đề xuất** | Đúng chữ của bảng §9.2 và luật §3 "bỏ qua không mất gì ngoài phần thưởng" |
| A12 | §9.2 Phá Khiên: "đạn" gồm gì | (a) mọi đạn bay (tháp, Phát Chữ, cầu lửa) bắn từ ngoài vòm; lông Tối Thượng và cận chiến không đổi; (b) cả lông | (a), **đã chọn theo đề xuất** | Lông rơi từ trên trời là vùng nổ, không là đạn; lính vào vòm là cách đáp có sẵn |
| A13 | `td-1b-story` tới Ngày 3 thế nào (truyện từ chối lệnh hộp cát) | (a) "Chơi lại Ngày n" với nhật ký bot (`scripts/td/retry-log.ts --day=3`), như `td-1b-night5`; (b) cờ thử riêng | (a), **đã chọn theo đề xuất** | Không thêm đường tắt nào vào game |
| A15 | §11.4 từ "đến hạn" ra mấy lần một ván | (a) mỗi từ đến hạn một lần mỗi ván, hết danh sách thì phần đó về cấp hiện tại; (b) quay vòng cả ván | (a), **đã chọn theo đề xuất** (thêm lúc làm bước 2) | Ôn xong một lần là hết hạn tới lần sau; (b) với sổ 6 từ ra mỗi từ 9 lần trong 3 ngày của file vàng (đã đo), lặp quá nhiều. Từ gõ Ẩu lại vào sổ của ván và quay lại bằng Từ Ôn |
| A14 | Núm 1 của cân bằng (thiết kế) | (a) "Rễ hút sinh khí": từ lúc trồi, mỗi `everyS` rễ chạm Lũy, −1 mạng, báo 1,2 s, cú choáng 70 % tính lại đồng hồ; (b) một đòn cố định lúc trồi; (c) đòn chỉ khi boss qua khúc nhập | (a), **đã chọn theo đề xuất** | §7 |

---

## 6. Test và kịch bản thêm

**Test (Vitest):**

| File | Kiểm |
|---|---|
| `tests/td-learn.test.ts` (thêm) | Từ Ôn quay lại trong 25–45 s, chỉ ở lời gọi kinh tế ≥ 4 từ, ≤ 1 sống, ≤ 2 lần mỗi từ; Chuộc lại (không lỗi, hay ≥ Tốt) +1 Tri thức, rời sổ, sự kiện `review`; Vừa có lỗi, Ẩu ở lại; sổ nạp từ đầu ván, id lạ bị bỏ; kế hoạch: trên 400 từ kinh tế của một seed, phần đến hạn 60 ± 8 %, mới ≤ 8; không từ mới ở Bắn mạnh, trực tiếp, Chữ Chiêu, Dồn lửa, Đêm 5; đầu ván rỗng và đầu ván không có `learn` ra cùng mã băm |
| `tests/td-learn-app.test.ts` (mới) | khởi động lạnh; gộp sổ khi hết ván (bỏ từ đã chuộc, giữ 40 mới nhất); `seen` dừng ở 3, ≤ 3.000 id; luật nghĩa theo chế độ, hồ sơ trẻ em, ≥ 3 lỗi, Hỏi bài, Từ Ôn; gửi gộp mỗi 5 s, đúng `gameId`, đúng/sai theo Ẩu; phần chạy lại không gửi |
| `tests/td-content.test.ts` (thêm) | mỗi hàng §12: câu ≤ 14 chữ, ≤ 2 câu, chip ≤ 8 chữ; mỗi nhà mở theo ngày có hàng dạy hay dòng "làm gì" |
| `tests/td-chunks.test.ts` (thêm) | mỗi `import()` của `main.ts` có trong `manualChunks` |
| `tests/td-r3-abilities.test.ts` (mới, bước 7) | Neo: đứng sững 3 s, ×1,3 trong 6 s, hào quang +20 %; vòm: đạn từ ngoài ×0,3, cận chiến không đổi, 10 s không dựng lại; ải truyện không có hai quái này |
| `tests/td-boss.test.ts` (thêm, bước 9) | "Rễ hút sinh khí": báo ≥ thời gian báo của chế độ (G4), cú choáng tính lại đồng hồ, `everyS` 0 là tắt |
| `tests/td-balance-gates.test.ts` | B8 R3 trên seed cố định |
| `tests/boundary.test.ts` | giữ xanh |
| File vàng | `td-1a.json` chạy với kho có 6 từ trong sổ (6 từ đầu cấp 1, chưa gặp từ nào) để phủ sổ nạp lúc tick 0, Từ Ôn, phần đến hạn và phần mới (bước 2: khởi động lạnh không ra Từ Ôn nào vì từ Ẩu duy nhất bị Hỏi bài lấy mất; khởi động lạnh có test riêng); `td-1b-boss.json` giữ đầu ván rỗng |

**Kịch bản (CDP, 1280 × 720 và 1920 × 1080, dưới `heavy.sh --gpu`):**

| Kịch bản | Kiểm |
|---|---|
| `td-1b-learn` (mới) | Cân bằng: nghĩa hiện hai lần gặp đầu rồi ẩn; một từ gõ Ẩu quay lại sau 25–45 s trong một lời gọi Chặt, thẻ có nhãn "Ôn" và nghĩa; gõ sạch: "Chuộc lại", Tri thức +1; tải lại trang: sổ còn (HUD "Sổ ôn"); hàng đợi sự kiện học có sự kiện `gameId` `typing-defense`; ảnh đã xem |
| `td-1b-story` (mới) | Màn đầu → Bản đồ 1: câu Bà Cú Mực và chip ở Ngày 1, Đêm 1 (`callNight`), Ngày 3 (chơi lại từ nhật ký bot), ≤ 2 câu tự hiện mỗi Ngày, Đêm; khung câu không che thẻ chữ; Cài đặt đổi Chế độ, ván sau chạy chế độ đó; sao lưu sau một lần thắng (nhật ký bot) |
| `td-1b-tour` (mới) | Bộ ảnh cho chủ dự án: làng Ngày 5 có báo boss, lặng, Rễ Trồi báo và trúng, choáng, Mầm Gỗ, rút, thẻ thắng, Tối Thượng, Ngắt, Từ Ôn, chip bảng dạy |
| `td-1b-chunks` (thêm) | chặn chunk `retry`, `learn`, `tips`: ván vẫn chạy, đường dự phòng đúng §3.1, §3.3 |
| `td-1b-direct` (thêm, bước 7) | `spawn` Troll và Đầu Đàn trong bầy: thẻ có vòng T, gõ được thì vòm vỡ / bầy đứng sững |
| 18 kịch bản cũ | chạy lại trên Mac (11 kịch bản chưa chạy lại từ Dell, §7.6) |

Ảnh ở `tmp/mac-2026-10-25/r3/` (ngoài Git). Mỗi ảnh xem trước khi báo xong.

---

## 7. Kế hoạch cân bằng R3

**Vì sao còn trượt** (`BUILD_NOTES` §7.5, số Dell, mã hiện tại): Ẩu thua 33 % ván, 45 % trong đó chết trước khi boss tới Lũy; bot mạnh giữ Biên S 60–70 % vì từ R2 họ chỉ mất 0–3 mạng ở đỉnh boss (Tối Thượng và Bắn mạnh dọn toán đi trước, Mầm Gỗ). Núm nào nâng Ẩu cũng nâng Biên S của Chuẩn, Chậm chắc, Nhanh quá 60–65 %. Cần một núm tác động khác chiều lên hai cụm.

**Chạy sau bước 8** (Học đổi chữ ban Ngày và tốc gõ từ ôn của bot, nên đo trên mã có Học). Mỗi lượt: `pnpm td:balance --modes=balanced --quick --stage-sets=2 --stage-seeds=120 --threads=4 --bots=novice,steady,standard,skilled,sloppy,fast --set=…` dưới `heavy.sh`, chạy nền, ghi giờ và tải máy. Lượt chốt: `pnpm td:balance --threads=4` đủ chế độ. Mỗi lượt in đủ: thắng, S, P, I, O, N, Q từng bot, B1–B9, đích chặt gộp, G2, G3, G5, G6, G8.

**Khung:** tối đa 6 lượt đo cho họ cổng "B1 + đích chặt", 6 lượt cho họ "G3, G8". Hết khung mà chưa đạt thì dừng, ghi bảng và núm kế vào `BUILD_NOTES` §7.7.

### 7.1 Núm 1: khoản mạng ở đỉnh boss mà bot mạnh không dọn được

- **Thiết kế (A14): "Rễ hút sinh khí".** Từ lúc boss trồi tới lúc rút, mỗi `drain.everyS` giây rễ của nó chạm Lũy: báo 1,2 s × `warnK` của chế độ (như mọi đòn boss, G4) (vạch rễ từ chân boss về Lũy, vòng son quanh Lũy, "−1" trên ô Mạng; dùng lại cách vẽ báo Quật Lũy, `boss-2d.ts:266`), rồi −1 mạng. Cú choáng 70 % (rễ rút về, §5.2) tính lại đồng hồ.
- **Vì sao có luật này:** mạng mất ở đỉnh boss hiện đi theo quái lọt, mà bot mạnh dọn được bằng Tối Thượng, nên Biên S của họ chỉ đo Đêm 5 phần đầu. Một khoản theo thời gian boss sống thì ai cũng trả. Người hạ boss nhanh trả ít hơn một chút (giao chiến 38 s so với 51 s ở §6.3), không phải bằng 0.
- **Việc làm được (§5.5):** dồn tháp lên nhánh rễ sáng từ Ngày 5, gõ Dồn lửa lúc choáng: boss rút sớm thì ít lần hút. Có báo trước nên không là "mất mạng âm thầm" (G4).
- **Số ước:** bot Chuẩn từ lúc trồi tới lúc rút ~70 s (trồi → trúng đầu 24 s, giao chiến ~46 s). `everyS` 20 → ~3 lần (−3 mạng, −15 điểm Biên S): Chuẩn 60 → ~45 %, Chậm chắc 70 → ~55 %, Nhanh 60 → ~48 %. Ván thắng của bot yếu còn 13–14 mạng nên không đổi thắng; ván thua của họ phần lớn là boss tới Lũy (Mới 90 %), đã thua sẵn. Rủi ro: Ẩu chết trước boss nhiều hơn.
- **Lượt đo:** k1a `everyS` 20; k1b `everyS` 15 hoặc 25 theo k1a (đích: Biên S gộp bot Chuẩn ~50 %); k1c k1a cùng 5 Thuồng Luồng ở Đêm 5 phần đầu (p2 của §7.5: Ẩu +4 thắng, +10 Biên S; phần Biên S thừa của bot mạnh giờ bị núm 1 lấy lại); nếu G3 vẫn trượt: k1d thêm tốc boss 0,78 m/s (p1: G3 45,9 / 46,7 s).

### 7.2 Núm 2: `LENGTH_BY_E` theo hướng ngược lại, cùng `kHp2` cho Khá

- p6 của §7.5 dời dải 4–7 chữ từ E 45 lên E 55 (từ ngắn hơn cho E 45–54): Ẩu 67 → 38 %, Khá 81 → 59 %. Đây là núm theo tốc gõ mạnh nhất đã đo. Từ ngắn làm Phát Chữ yếu đi (`REWARD.lenDiv`, `shotPower`) và thêm chữ đầu phải nhắm.
- **Thử ngược lại:** từ dài hơn cho E 45–64: `--set=LENGTH_BY_E.2.len=[4,8]` (k2a), hoặc dời dải 4–7 xuống E 40 (k2b, `LENGTH_BY_E.2.minE=40`). Đích: Ẩu ≥ 75 % thắng ở từng bộ.
- Khá (k 1,2; như Ẩu, E đầu ván nằm trong dải mà p6 đổi, vì p6 chỉ đổi dải đó mà hai bot này tụt) sẽ lên theo; kéo về bằng `kHp2` (`--set=slice.boss.kHp2=…`, 6,5 → 7–9): số hạng bậc hai chỉ đáng kể ở k > 1,1 (Ẩu k 1,045 gần như không đổi). Nhanh chạm trần `kHpMax` 1,46 nên `kHp2` không đổi Nhanh; nếu Nhanh lên quá 88 % thì thêm `kHpMax`.
- Kiểm thêm: từ dài hơn nặng ngân sách chú ý. Cổng 5a (cửa sổ dự tính ≤ 8 s), 5b, 5c của BUILD_1A6 §12 (G1) và G2 phải giữ.

### 7.3 Núm 3: trọng số độ chính xác của `effectiveE` (kit) chỉ sau hai núm trên

- `effectiveE` (`src/kit/balance/pace.ts:22-27`): E·(0,6 + 0,4·a²)·(1 − 0,5·CV), sàn 0,7·E. Sàn làm Ẩu (E 40,9, a 83 %) có E_eff 28,6 > Chuẩn 27,0, nên nhịp k của Ẩu cao hơn Chuẩn.
- Kit dùng chung ba game và là việc của repo cha. Làn này chỉ **đo bằng đầu dò** (một lớp bọc `paceHeader` trong `scripts/td/`, không đụng `src/kit`); có lợi thì ghi đề xuất cho điều phối viên (sửa `shared/game-kit` có test, đồng bộ ba game), không tự sửa.

### 7.4 Thư giãn, Thử thách, B3, B5–B7

- Cùng núm, không núm riêng: in Thư giãn (B3: Trẻ em ≥ 85 %), Thử thách (dải 50–75 %) ở lượt chốt.
- Núm 1 dùng một số cho mọi chế độ (Thư giãn, Học đã có máu boss ×0,78). Đo trước; chỉ thêm hệ số theo chế độ nếu B3 trượt.
- B5 (`heroKite`), B6, B7 (tắt bộ điều nhịp) đọc ở lượt chốt; núm 1 không được làm Không gõ thắng (boss vẫn phải không rút).

---

## 8. Ngân sách dòng và thứ tự cắt

Cách đếm `BUILD_1B` §16 (`.ts` trong `src`, trừ `src/kit`). Hiện **9.670**; trần R3 **10.500**.

| Bước | File (cột §16 R3) | Dòng ước |
|---|---|---|
| 1 | `main.ts` −95; `app/dev-tools.ts` +75; `app/retry.ts` +60 | +40 |
| 2 | `sim/systems/learn.ts` +60; `calls.ts` +15; `world.ts`, `rules.ts`, `hash.ts`, `stats.ts`, `events.ts` +20 | +95 |
| 3 | `app/learn.ts` +150 (≤ 200); `main.ts` +15 | +165 |
| 4 | `view/words/cards.ts` +20 (§16: +25) | +20 |
| 5 | `ui/tips.ts` +60 (§16: +60); `ui/hud.ts` +25; `ui/build-menu.ts` +10 | +95 |
| 6 | `ui/settings.ts` +20; `app/prefs.ts` +6; `ui/title.ts` +6; `ui/sheets.ts` +6; `main.ts` +10 | +48 |
| 7 | `slice-1a.ts`, `types.ts` +30; `direct.ts` +45; `projectile.ts`, `move.ts` +10; `fx-2d.ts` +20 | +105 |
| 9 | `boss.ts` +20; `slice-1a.ts`, `types.ts` +3; `boss-2d.ts` +8; `hud.ts` +2 | +33 |
| **Cộng** | | **+601 → ~10.271** |

- `view/fx-2d.ts` đang 226 dòng, cột §16 R2 ≤ 230: phần vẽ của bước 7 có thể đẩy nó quá cột. Cột từng file không là cổng (trần cộng dồn mới là cổng), nhưng ghi lại như `boss-2d.ts` (406) ở §7.3.
- **Thứ tự cắt khi vượt trần dòng hay ngân sách gói** (§16, ghi vào `BUILD_NOTES` khi cắt): 1) Troll, Đầu Đàn, Neo, Phá Khiên (bước 7, ~−105); 2) Từ Ôn quay lại trong lời gọi, giữ Hỏi bài (~−40); 3) Thư Đồng hoảng (~−30); 4) Nuppeppō tách đôi (~−35). Với gói: trước khi cắt luật, dùng núm dự trữ §1.1 (lớp boss nạp sau).

---

## 9. Cổng cuối R3 (§21) và cách kiểm trên Mac

| Cổng §21 | Kiểm |
|---|---|
| 1 | `pnpm check` (kit sha256, test, `tsc`, `vite build`, ngân sách gói), `tests/boundary.test.ts` |
| 2 | `pnpm td:golden:check`; mọi kịch bản có kiểm chạy lại ra cùng mã băm trên Node |
| 3–4 | test thuộc tính (thêm `ult`, `direct`, Từ Ôn vào "bỏ qua không mất gì"); G1 cổng 5a, G2 |
| 5–6 | `pnpm td:balance` lượt chốt: B1–B8 hai bộ × 120, đích chặt gộp, G1–G8, B8 R3 |
| 7 | `td-1b-boss`, `td-1b-night5` đạt; ảnh chậm thấy mọi báo đòn (cả "Rễ hút sinh khí") |
| 8 | `td-1b-perf`, `td-1a6-perf` ở 60 Hz; so với mốc §1.2 (cùng máy, xen kẽ, ghi tải máy) |
| 9 | 21 kịch bản × 2 cỡ, 0 lỗi console ngoài lỗi cố ý của `td-1b-chunks` |
| 10 | số dòng ≤ 10.500 |
| 11 | changelog, `BUILD_NOTES` §7.7 có số thật, `AGENTS.md` có lệnh và kịch bản mới |
| 12 | gói chơi thử §22 (mục 10 "R3" của danh sách câu hỏi), chủ dự án gửi "Chép số chơi thử" cho B9 |

- Số hiệu năng R3 đo trên Mac là số Apple M4; số Dell (Chrome Windows, RTX 3050 Ti: 3,9–4,6 ms ở 60 Hz, §7.5) vẫn là máy yếu nhất phải đạt, nên ghi rõ máy nào.
- Máy dùng chung với ba làn: số khung lệch 0,5–0,8 ms khi làn âm thanh sinh âm trên GPU (§7.6). Đo xen kẽ, ghi tải máy, dùng lại `tmp/mac-2026-10-25/f6/ab.sh` và `summarize.mjs`.

---

## 10. Rủi ro

| Rủi ro | Cách chặn |
|---|---|
| Phần R3 trong chunk vào lớn hơn ước | Đo "/" sau mỗi bước (in ở `pnpm build`); núm dự trữ §1.1; thứ tự cắt §8 |
| Từ Ôn, từ mới đổi cân bằng (từ ôn chậm hơn với bot, d 0,85) | Cân bằng chạy sau bước 8; báo cáo in Từ Ôn, từ mới mỗi ván; khởi động lạnh là đường đo chính |
| Kế hoạch học làm chạy lại cũ hỏng | Đầu ván rỗng không rút số ngẫu nhiên; file cũ không có `learn` là đầu ván rỗng; test giữ hai điều này |
| "Rễ hút sinh khí" làm Ẩu thua nhiều hơn | Lượt k1c (5 Thuồng Luồng) đi cùng; Ẩu là bot được theo dõi ở mọi lượt |
| Câu dạy che thẻ chữ hay đè thanh boss | Một khung câu ở đỉnh màn, thẻ chữ tránh hộp HUD; `td-1b-story` đo hộp thẻ với khung câu |
| `td-1b-story` cần chạy thật nhiều phút | Chơi lại từ nhật ký bot (A13); chỉ chạy thật Ngày 1 → Đêm 1 bằng `callNight` |
| Làn khác giữ chỗ trình duyệt lâu (`dh-crowd`) | Kịch bản chạy nền dưới `heavy.sh --gpu`, gom theo lô |

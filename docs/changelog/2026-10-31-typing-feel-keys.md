# 31/10/2026 · Wordwoven · Âm phím đọc từ Typing Feel, bỏ bản chép

Worktree `games/.wt-td-keys`, nhánh `td-keys`. Bước B5 (giai đoạn G3) của [`docs/games/TYPING_FEEL_SERVICE.md`](../../../../docs/games/TYPING_FEEL_SERVICE.md) ở repo cha, theo mẫu B3 của Last Line (`07895db`). Kit giữ nguyên bản vừa đồng bộ (bảng Sound nhận hàm tải, [`2026-10-31-kit-keyboard-panel-fetch.md`](./2026-10-31-kit-keyboard-panel-fetch.md)); không sửa `src/kit`.

## Đọc từ host Typing Feel

- `KEYS_BASE` chuyển từ `src/app/quick.ts` sang `src/app/keyboard.ts` và nay là `typingFeelKeysBase(import.meta.env.VITE_TYPING_FEEL_ORIGIN)`. Kiểu của biến khai ở `src/env.d.ts`. Mã không có giá trị mặc định, không có `.env.production`.
  - Không đặt biến (clone riêng, CI, `pnpm dev`/`build`/`check` của repo game): `KEYS_BASE` là `null`, không gọi mạng, chỉ Off và Bamboo, không báo lỗi.
- `src/app/keyboard.ts` là một chunk riêng. `main.ts` xin nó ngay khi đọc save, nên danh mục tải song song với từ vựng và màn đầu, và không chỗ nào chờ nó.
  - Danh mục tải bằng `timedJson(3000)` (`no-cache`). Manifest bộ tải bằng `timedJson(3000, { cache: "default" })`. File mẫu và preview tải bằng `timedBytes()` (8 s một file).
  - Bảng Sound dùng cùng các hàm này qua tuỳ chọn mới của kit: `keyboardFetch: { fetchJson, fetchBytes }`. Không cần lớp con `TypingSounds` như Last Line.
- Bộ mặc định lấy từ `default` của danh mục (`bright-clack` ở bản `r1`). `DEFAULT_KEYBOARD_SOUND` chỉ dùng khi danh mục không ghi `default`.
- `index.html` có `<link rel="preconnect" href="<origin>" crossorigin>`, chỉ khi build có biến. Plugin `typing-feel-preconnect` trong `vite.config.ts` chèn thẻ này; không có biến thì không có thẻ nào.

## Hai lỗi của mục 5.2

1. **`mountQuick` chờ danh mục không hạn giờ rồi mới dựng bảng** (`quick.ts:58`, chunk lười `main.ts:169`). Nay `mountQuick` dựng cả hai bảng ngay, không `await` gì:
   - hàng âm phím mở với `pendingKeyboardChoices`: Off, Bamboo, và bộ đang chọn hiện "Loading…";
   - khi danh mục về, `quick.setChoiceOptions("keyboard", …)` thay danh sách, kể cả lúc bảng đang mở (không phát preview, giữ dòng đang chọn);
   - F1/F2 mở bảng ngay cả khi host feel treo.
2. **Luật giữ bộ khi danh mục hỏng** chuyển từ `keyboardChoices` của game sang `settleKeyboardChoice` của kit (kit chép đúng luật này của Wordwoven, nên người chơi thấy như cũ).
   - `savedKeyboard()` (`src/app/prefs.ts`) đọc trường thô `keyboard` của `td.settings` trước khi `loadSettings` điền mặc định cứng.
   - `startKeyboard` gọi `settleKeyboard` (Bamboo là âm gốc, `bright-clack` là mặc định dự phòng). Game chỉ lưu khi `repaired`.
   - Người chơi chọn Off hoặc Bamboo trong lúc chờ thì lựa chọn đó giữ nguyên, không bị danh mục ghi đè.
- Có biến mà danh mục không về (404, HTML mã 200, thân không phải JSON, CORS, quá 3 s, không bộ nào dùng được): bảng hiện "Saved sound · unavailable", id trong save giữ nguyên, HUD báo "Keyboard sounds unavailable" (10 s, như các báo khác). Không có biến thì không báo.
  - Câu cũ "Keyboard catalogue unavailable · Bamboo and Off remain available" và "Keyboard samples unavailable or incomplete…" bỏ.

## Bamboo thay khi bộ không phát được

- Bộ đã lưu không phát được trong phiên này thì **Bamboo phát thay**, không lưu: Typing Feel tắt hay hỏng (bộ thành "Saved sound · unavailable"), manifest hỏng hay quá 3 s, hoặc đợt giải mã đầu không có file nào (kit dừng sau đợt đó).
- Bộ chọn trong bảng Sound mà không phát được (`onKeyboardFail` của kit) cũng vậy.
- `bambooKeys(settings, standIn)` (`prefs.ts`) quyết định tiếng Bamboo ở cả `quick.ts` (space, Backspace, ô nhập) và `view/audio-min.ts` (chữ, bus phím, nghe thử thanh Keyboard volume). `main.ts` giữ `keyboardStandIn` chỉ trong phiên và đưa cho chunk âm thanh.
- Người chơi chọn bất kỳ âm phím nào thì Bamboo thôi thay. Bộ hỏng chỉ tải lại khi người chơi chọn lại nó.
- Có biến, danh mục về mà bộ không phát được: HUD báo "Keyboard set unavailable · Bamboo plays instead" một lần.

## Cổng vào trận 1,5 s

- `KeyboardGate` (`src/app/keyboard-gate.ts`, trong chunk đầu) bắt đầu cùng trang. Bước đầu của trận (`world.tick === 0`) chờ nó cùng với Học, mở ở lúc sớm nhất trong ba lúc:
  - đợt giải mã đầu của bộ đã lưu về (12 phím + 4 space), hay cả bộ khi bộ không lớn hơn một đợt: `by: "batch"`;
  - lượt nạp kết thúc mà không có bộ nào (Off, Bamboo, không có origin, host hỏng, bộ không phát được): `by: "ended"`;
  - 1,5 s sau khi trang bắt đầu, kể cả khi chunk bảng Sound không tải được: `by: "time"`.
- `__td.ready()` chờ cổng mở. `__td.keyboard()` mới cho các mốc của cổng và lý do mở (`gate.by`), bước đầu của trận, Bamboo thay cho bộ nào, và cái bảng Sound thấy (base, trạng thái danh mục, `revision`, số bộ, số họ, id đang chọn và id đã lưu, save có giữ âm phím không, bộ đang phát, số lần phát).

## Save chỉ giữ âm phím khi đã "có"

- `saveSettings` ghi `storedSettings(settings)`: trường `keyboard` chỉ vào save khi save "có" âm phím (save cũ đã có trường này, danh mục sửa, hoặc người chơi tự chọn; `ownKeyboard`). Ba chỗ ghi save (`main.ts` nút tắt tiếng, thẻ Settings `ui/settings.ts`, bảng Sound) đều qua hàm này.
- Vì vậy lúc danh mục chưa về hay host hỏng, đổi một mục khác không lưu mặc định cứng hay Bamboo vào save. Lần sau host chạy lại, save không có trường thì theo `default` của danh mục.

## Bỏ bản chép

- Xoá `public/assets/typing-defense/audio/keys/**`: 2.744 OGG (Git bỏ qua) và 35 `keys-manifest.json` đang theo dõi. Xoá dòng `!public/assets/typing-defense/audio/keys/**/keys-manifest.json` trong `.gitignore` (chỉ để giữ các manifest này).
  - Trước khi xoá đã so md5: cả 1.032 md5 khác nhau của 2.744 OGG (và của 2.744 dòng trong `media.md5`) đều có trong `typing-feel/public/v1/keys/sets/` (0 thiếu).
- `media.md5`: bỏ 2.744 dòng `audio/keys`, còn 1.836 dòng, giữ nguyên thứ tự (diff chỉ có dòng xoá).
- `public/assets/typing-defense/README.md` và `AGENTS.md` nay ghi cách mới. Ngoài changelog cũ, game không còn chỗ nào trỏ tới `/assets/typing-defense/audio/keys`; một test chặn bản chép quay lại (`media.md5` không có dòng `audio/keys`).

## Script build (repo cha, điều phối sửa)

`package.json` của cha không sửa ở bước này (làn khác đang sửa). Hai dòng cần thay:

```json
"dev:td:app": "bash scripts/game-dir.sh require typing-defense && cd games/typing-defense && DEV_HOST=127.0.0.1 DEV_ALLOWED_HOSTS=td.typing-game.local DEV_HMR_HOST=td.typing-game.local DEV_HMR_PROTOCOL=wss DEV_HMR_CLIENT_PORT=443 VITE_TYPING_FEEL_ORIGIN=https://feel.typing-game.local pnpm dev",
"build:td": "bash scripts/game-dir.sh require typing-defense && VITE_TYPING_FEEL_ORIGIN=https://feel.typing-game.local pnpm --dir games/typing-defense build",
```

Script `dev` của game không đổi, nên repo game không mang nguồn nhà.

## Test

- `tests/feel-fixture.ts` là host mẫu (chép từ Last Line): danh mục `catalogue-3` (7 bộ, 4 họ, `default` không phải bộ đầu, hai bộ không điểm), manifest `set-1`, byte giả. Test không đọc danh mục thật, không gọi mạng, chạy được trên clone riêng.
- `tests/td-quick.test.ts` viết lại trên host mẫu (34 test, trước 26):
  - không có origin: không gọi `fetch`; Off, Bamboo và "Saved sound unavailable"; save giữ id; Bamboo thay; không báo; save không có âm phím thì Bamboo và không ghi trường;
  - danh mục hỏng (404, HTML 200, không phải JSON, CORS): giữ id, báo đúng một lần, không xin bộ nào, Bamboo thay, đổi Mute vẫn giữ id;
  - danh mục thiếu id đã lưu: chuyển sang `default` của danh mục, ghi save đúng một lần, bảng không tự sửa thêm;
  - danh mục về muộn khi bảng đang mở: danh sách tạm "Loading…", thay tại chỗ, bộ đã lưu được chọn và nạp, không preview; Bamboo người chơi chọn lúc chờ thì giữ;
  - bộ đã lưu không nạp được (manifest 404, mọi OGG 404): Bamboo thay, một báo, save giữ id, OGG hỏng dừng sau 16 file; bộ chọn trong bảng hỏng: Bamboo thay tới lần chọn sau;
  - đợt đầu 12 phím + 4 space: chữ và space đầu tiên phát từ đợt đó, cổng được báo một lần với `batch`; mỗi test khác kiểm lý do cổng được báo (`ended` khi không có bộ nào, không báo khi danh mục chưa về);
  - danh mục `no-cache`, manifest `default` ở cả lúc khởi động và trong bảng; mọi yêu cầu tới host feel.
  - Bỏ các test kiểm nội dung media thật (34 bộ, thứ tự Hail Stone và Raindrop Tile, dòng `media.md5` của từng file). Những thứ đó nay thuộc `typing-feel/`. Test "đuôi phát trọn" giữ lại với độ dài giả 450 ms và 535 ms.
- `tests/td-keyboard.test.ts` mới (15 test, đồng hồ giả, không DOM): cổng mở ở 1.500 ms (`time`) hay sớm hơn khi bộ về (`batch`) hoặc lượt nạp hết mà không có bộ (`ended`: không origin, host tắt); bộ chỉ một đợt (10 file) vẫn mở bằng `batch`; danh mục treo (cổng 1,5 s, bỏ ở 3 s, báo, giữ id, không còn timer); OGG treo (cổng 1,5 s, sau 8 s chỉ 16 yêu cầu, Bamboo thay); manifest treo (bỏ sau 3 s, không xin OGG); không origin; chunk `keyboard` hỏng; `savedKeyboard`, `storedSettings`, `bambooKeys`, `settleKeyboard`; thẻ preconnect của `vite.config.ts`.
- Kiểm đột biến (chạy hai file test trên): bỏ hạn 1,5 s làm 3 test hỏng; bỏ qua lựa chọn lúc chờ, 1; manifest `no-cache`, 1; báo lỗi khi không có origin, 2; luôn lưu âm phím, 3; bỏ Bamboo thay lúc khởi động, 7; bỏ Bamboo thay trong bảng, 1; không thay danh sách khi danh mục về, 17; không lưu khi `repaired`, 1; không báo cổng ở đợt đầu, 2. Sau phản biện: bỏ `tell("batch")` khi bộ nạp xong, 1; báo `batch` ở `finally`, 11; báo `ended` ở đợt đầu, 3.

## Kiểm

- `pnpm check` mã 0: kit 72 file khớp; 38 file test, **419/419 test** (trước 396); tsc và build xanh.
- Gói (bundle budget): "/" **80,73 kB** gzip (trước 80,28; còn 4,27 kB), "?title=0" 82,19 kB (còn 2,81 kB). Chunk `keyboard` (6,78 kB, mang phần âm phím của kit) tải song song, không tính vào phần khởi động.
- Số dòng mã TD (`.ts` trong `src`, trừ `src/kit`): 10.620 → **10.815** (+195; trần 1B.V4 10.900, còn 85).
- `node scripts/sync-game-kit.mjs --check --target games/.wt-td-keys` ở cha: OK.
- Build không có biến: `dist/index.html` không có thẻ preconnect. Build có biến: đúng một thẻ, origin chỉ nằm trong chunk `keyboard`.

## Trình duyệt

Chrome headless (`src/kit/tools/cdp-run.mjs`, qua `.local/bin/heavy.sh --gpu`), 1280×720, hồ sơ trình duyệt mới, `?sandbox=1`. Lượt chạy lại sau phản biện, trên mã hiện tại: server Node tạm ở cổng 18550 phục vụ `typing-feel/public` (CORS `*`, CORP `cross-origin`, `nosniff`, `audio/ogg`, 404 khi thiếu file), đổi chế độ (chạy, tắt, HTML 200, treo) qua một file điều khiển; `vite preview` ở cổng 18551, bản build có `VITE_TYPING_FEEL_ORIGIN=http://127.0.0.1:18550` cho bốn lượt đầu, rồi bản build không có biến cho lượt cuối. Lượt đầu của bước này (cổng 18530/18531/18535/18536) cho cùng kết quả, chỉ khác `gate.by` khi đó luôn là `set`. Nginx `feel.typing-game.local` chưa chạy. Đã tắt hết.

- **Host chạy, save trống:**
  - danh mục `r1` `ready` (1 lần, `no-cache`), 34 bộ, 7 họ, mặc định `bright-clack`; save không ghi `keyboard`;
  - mạng: 1 manifest bộ (`default`), 88 OGG từ host feel; đợt đầu 12 phím + 4 space, xong hết trước khi đợt sau bắt đầu; 0 yêu cầu tới `/assets/typing-defense/audio/keys`; thẻ preconnect `http://127.0.0.1:18550/`;
  - cổng mở sau 192 ms, `by: "batch"` (đợt đầu về), bước đầu của trận ở 219 ms;
  - bảng Sound 36 lựa chọn (Off, Bamboo, 34 bộ) với 7 tiêu đề họ, không còn "Loading…";
  - gõ "see" rồi Space: 3 `key-NN` của Bright Clack (8–18 ms sau mỗi phím), Space phát `space-02` ngay khi bấm;
  - rê chuột lên Hail Stone: preview (stereo); chọn: lưu `hail-stone`, 1 manifest (`default`), 25 phím, 8 space; gõ "head" + Space: 4 `key-NN` và `space-03` của Hail Stone;
  - tải lại: cổng 52 ms (`batch`), gõ "see" + Space: 3 `key-NN` và `space-07` của Hail Stone. Host nhận 160 yêu cầu, đều đúng đường.
- **Host tắt** (save `hail-stone`): danh mục `missing`, có báo "Keyboard sounds unavailable"; cổng 24 ms, `by: "ended"`, bước đầu 48 ms; bảng Off, Bamboo, "Saved sound unavailable" (tắt, đang chọn); save giữ `hail-stone`; gõ: 0 sample, Bamboo phát (sine 620 Hz ở Space).
- **HTML mã 200:** như trên (cổng 18 ms, `ended`; báo, save giữ, Bamboo).
- **Host không trả lời:** cổng mở bằng hạn giờ sau **1.501 ms** (`time`), bước đầu 1.502 ms; báo lỗi khoảng 3 s sau khi trang bắt đầu; save giữ `hail-stone`; Bamboo phát.
- **Không có origin** (build không có biến, save `hail-stone`): 0 yêu cầu tới host feel, 0 thẻ preconnect, không báo; cổng 18 ms (`ended`); bảng Off, Bamboo, "Saved sound unavailable"; save giữ id; Bamboo phát.
- 0 lỗi chưa bắt, 0 cảnh báo hay lỗi console trong cả năm lượt.
- Bằng chứng: `tmp/feel-keys/results-fix.json` và `tmp/feel-keys/feel-keys-fix-contact-sheet.jpg` (kịch bản `tmp/feel-keys/feel-keys-fix.mjs`); lượt đầu: `results.json`, `feel-keys-contact-sheet.jpg`. Ảnh thô của mỗi lượt đã xoá bằng `tools/capture-prune/prune.mjs` (7 file, 3,96 MB).

## Sửa sau phản biện

- `__td.keyboard().gate.by` nói đúng lý do cổng mở: `batch` (đợt đầu của bộ về, hay cả bộ khi bộ không lớn hơn một đợt), `ended` (lượt nạp hết mà không có bộ), `time` (1,5 s). Trước đó host tắt, HTML 200 hay không origin đều ghi `set`, đọc như thể bộ đã nạp. Hành vi không đổi; `startKeyboard` báo lý do qua `playable(by)`.
- Mục "Còn mở" sửa câu về `./play.sh`: nó không báo bản build thiếu Typing Feel khi `build:td` của cha chưa đặt biến.
- Mục lục changelog thêm hai mục kit ngày 31/10.

## Còn mở

- Hai dòng script ở cha (`build:td`, `dev:td:app`, xem trên): điều phối sửa, trong **cùng commit** cha nâng con trỏ submodule `games/typing-defense` lên commit B5. Trước khi sửa, bản build từ cha không có Typing Feel và `./play.sh` **không** báo: vòng kiểm `dist` của nó lấy origin từ script `build:td` của cha, script chưa có `VITE_TYPING_FEEL_ORIGIN` thì bỏ qua game (`continue`). Host play khi đó lặng lẽ phục vụ bản tắt Typing Feel: mọi bộ Firefly đã lưu hiện "Saved sound unavailable" và Bamboo phát thay.
- Chưa kiểm trên host play thật (`feel.typing-game.local`, HTTP/2): cần chủ dự án chạy `pnpm setup:play`. Chưa nghe bằng tai.
- `typing-feel/media.md5` của cha vẫn chưa có (Last Line đã ghi): nên có lock đó trước khi merge, để md5 các OGG không rời lock này mà chưa vào lock kia.
- `effects` của danh mục không dùng: Wordwoven không có hiệu ứng chữ.
- Số dòng mã còn 85 dòng dưới trần 1B.V4 (10.900); bước này dùng 195.
- Dòng 3 trỏ tới `2026-10-31-kit-keyboard-panel-fetch.md`. File đó chưa vào Git (thuộc lượt đồng bộ kit): điều phối commit nó cùng lượt đồng bộ kit, trước hoặc cùng commit B5, không thì liên kết gãy. Mục lục nay có dòng cho cả hai mục kit ngày 31/10.

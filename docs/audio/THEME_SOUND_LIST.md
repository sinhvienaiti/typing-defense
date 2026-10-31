# Danh sách âm chủ đề Lời Gọi: Miền Văn Điền (23/10/2026)

> **Dành cho:** chủ dự án (tạo file âm thật), ChatGPT (viết lại prompt), AI ghép file về sau (manifest, engine).
>
> **Lấy từ:** `docs/games/SPLIT_PLAN.md` §1.1–1.2 (bước D7), `docs/td/TYPING_DEFENSE_DESIGN.md` §22.1, §24. Bộ prompt đầy đủ của bậc P và VS vẫn ở `docs/art-requests/td/04-audio.md` và `04-audio-vs.md`; danh sách này là các tiếng **đang chạy trong game** (tổng hợp bằng mã, chưa có file) và prompt để thay bằng file thật.
>
> **Trạng thái:** mọi tiếng dưới đây là tiếng tổng hợp WebAudio trong `src/view/folk.ts`, `src/view/audio-min.ts`, `src/view/music.ts`. Không có file âm nào trong Git. File thật đặt ở `art-src/audio/` (gốc WAV) và `public/assets/typing-defense/audio/` (OGG trong game), cả hai không vào Git, sao lưu bằng `pnpm media:push` ở repo cha.

## 1. Luật chung

- **Chất liệu:** tre, gỗ, chuông đồng, cồng, giấy, trống cơm, sáo trúc, đàn tranh. Không laser, không tiếng máy, không synth điện tử.
- **Thang:** ngũ cung Hò, Xự, Xang, Xê, Cống (gần C D F G A). Nốt của chữ và nhạc cùng một thang (TK 24.8).
- **Không tôn giáo** (TK 22.1): không chuông chùa, không mõ chùa, không tụng, không tiếng đình đám. Cồng là cồng hội làng; phách tre thay cho mõ.
- **Bus** (TK 24.2): `music` (nhường khi phát âm từ: −9 dB trong 0,12 s, lên lại trong 0,5 s), `typing` (có nén nhẹ riêng), `world`, `ui`; vang chung 0,8 s; `master` qua bộ giới hạn −3 dB. Cài đặt có ba thanh: Âm lượng chung, Nhạc, Tiếng trận và gõ (lưu ở `td.settings`).
- **Định dạng file thật** (TK 24.9): gốc WAV 48 kHz 24-bit; trong game OGG Vorbis, mono cho tiếng ngắn, stereo cho nhạc và âm nền. Tiếng ngắn đỉnh −1 dBTP; nhạc −18 LUFS; âm nền −26 LUFS.
- **Tiếng phím** không có id trong `sound-map.ts` (gộp 1C ngày 31/10/2026): mỗi phím kêu đúng một lần, từ bộ Typing Feel đã chọn (`app/quick.ts`, `docs/games/TYPING_FEEL_SERVICE.md` của repo cha) hoặc phím Bamboo tổng hợp bằng mã (`key()` trong `view/audio-min.ts`); Off thì im. Phải bắt đầu dưới 20 ms và dài dưới 60 ms (TK 24.6).
- Prompt viết bằng tiếng Anh vì công cụ tạo âm hiểu tiếng Anh tốt hơn. Mỗi prompt tiếng lẻ (không phải nhạc, âm nền hay giọng người) ghép thêm đuôi chung: *"Single isolated sound effect, close and dry, starts instantly, clean natural end, 48 kHz."* Đuôi chỉ ghi điều muốn có, không có chữ phủ định ("no music", "no reverb"): công cụ tạo âm dễ làm ra đúng thứ bị nhắc tên (quyết định Q6, 24/10/2026).
- **Âm hành động** (`wordshot-fire`, `arrow-fire`, `blast`, `ink-puff`; quyết định Q6 của chủ dự án ngày 24/10/2026, ghi ở `tools/audio-lab/DECISIONS.md` của repo cha) không ghép đuôi chung trên, vì đuôi chung ghi "dry", còn đuôi vang ngoài làng là một phần của âm hành động. Prompt của các id này tự ghi đủ phần chuẩn bị (nếu hành động có), đầu tiếng, thân và đuôi ngắn, không có chữ phủ định. Cỡ âm theo nguồn: cung tre nhỏ thì tiếng nhỏ. Không dùng hướng "bụp", "puff", "pop", tiếng trầm ngắn đứng riêng.

## 2. Tiếng gõ và lời gọi (bus `typing`)

| Id | Khi nào | Không khí | Hiện tại (mã) | Prompt cho file thật |
|---|---|---|---|---|
| `call-power` | Lời gọi Bắn mạnh sáng lên (ban đêm, tháp) | Gấp, có lực, không hoảng | Hai tiếng trống cơm "tùng tùng" | Two quick hits on a small Vietnamese rice-paste drum (trống cơm), tuned mid-low, the second softer, 0.4 s total, warm wooden shell resonance. |
| `call-build` | Lời gọi Xây sáng lên | Bận rộn, vui | Hai tiếng gõ ống tre | Two light hammer taps on a thick bamboo post, hollow "cộc cộc", 0.13 s apart, 0.3 s total. |
| `call-harvest` | Lời gọi Gặt sáng lên | Sáng, nhẹ | Chuông đồng nhỏ cao | One small bright bronze hand bell, single strike, clear high pitch, short ring 0.9 s, no temple bell character. |
| `call-chop` | Lời gọi Chặt sáng lên | Chắc, trầm | Gõ gỗ trầm và vụn tre | One low knock of a wooden axe handle on a bamboo trunk, with a few tiny splinters, 0.25 s. |
| `call-mine` | Lời gọi Đào sáng lên | Nhỏ, sạch | Hai tiếng "keng" li ti | Two tiny clinks of an iron hoe tip on stone, high and dry, 0.06 s apart, 0.3 s total. |
| `call-quiz` | Lời gọi Hỏi bài sáng lên | Tò mò | Sáo trúc hai nốt đi lên | A two-note rising call on a Vietnamese bamboo flute (sáo trúc), breathy, playful, like a question, 0.35 s. |
| (phím đúng, Bamboo) | Mỗi phím đúng, khi chọn Bamboo | Gọn, giòn | Tiếng tre "tách", cao lên một bán cung mỗi chữ (tối đa 12) | Không làm file: bộ phím đến từ Typing Feel; Bamboo giữ tổng hợp bằng mã. |
| (phím sai, Bamboo) | Phím sai, phím lạc, khi chọn Bamboo | Không phạt, chỉ báo | "Tóc" đục, nhỏ hơn 12 dB | Như trên. |
| `word-hit` | Gõ xong một từ | Thưởng, có nhạc tính | Một nốt đàn tranh theo bậc Chuỗi (C5 D5 F5 G5 A5 C6); Chớp có vuốt lên; Ẩu thấp một bậc | Single plucked note on a Vietnamese đàn tranh zither, bright attack, short warm ring 0.8 s; record one file per pitch C5, D5, F5, G5, A5, C6 and a version with an upward slide into the note. |
| `word-hit-bell` | Thêm khi Hoàn hảo hoặc Chớp | Lấp lánh | Chuông đồng cao C7 | One tiny high bronze bell "ting", 0.5 s, pure and light. |
| `chain-callout` | Mốc Chuỗi | Mừng | Câu sáo ba nốt đi lên | Three quick rising notes on a sáo trúc bamboo flute (A5, C6, D6), cheerful, 0.45 s. |

## 3. Trận và làng (bus `world`)

| Id | Khi nào | Không khí | Hiện tại (mã) | Prompt cho file thật |
|---|---|---|---|---|
| `wordshot-fire` | Phát Chữ bay ra | Nhanh, có chữ trong đó: vung tay tre, chữ giấy phóng vút đi, giấy phần phật bay xa; vang làng ngắn | Tiếng "vút" giấy và một cú gõ tre | A word shot launched: a quick bamboo whip, a sharp release, a fast arrow whoosh with paper fluttering as it travels away, short village echo, 0.35 s. |
| `arrow-fire` | Tháp Cung bắn (tối đa 4 lần mỗi giây) | Nhẹ, nền: cung tre kẽo kẹt, dây bật, mũi tên vút đi xa; vang làng ngắn | Giấy "phựt" rất ngắn | A small bamboo bow shot: a soft creak, a quick string snap, the arrow hissing away over the fields, short village echo, 0.2 s. |
| `blast` | Vụ nổ (Tháp Pháo, cụm Phát Chữ), tối đa 2 mỗi khung | Đầm, không ồn: trống lớn nện có thân, giấy và bụi bung tung, mảnh giấy rơi lả tả; vang làng (không có lớp nổ lách tách) | Trống trầm và giấy bung | A village blast: a deep heavy hit of a large wooden drum bursting a cloud of paper scraps and dust, paper drifting down, echo across the fields, 0.8 s. |
| `ink-puff` | Quái Mực Câm tan (tối đa 8 mỗi giây) | Mềm, không máu: túi giấy thấm mực rách, mực bắn tóe nhỏ, giấy lả tả; vang ngắn | Giấy "bụp" | An ink-soaked paper creature tearing apart: a soft wet paper rip, a small splash of ink spattering, paper scraps fluttering down, short village echo, 0.2 s. |
| `coin` | Rơi đồng sau khi hạ quái (tối đa 3 mỗi giây) | Tiền, sáng | Chuông li ti rất nhỏ | One small bronze coin dropped on a wooden tray, tiny high ring, 0.3 s. |
| `leak` | Quái lọt vào Lũy (cách nhau ít nhất 0,8 s) | Cảnh báo, không còi | Cồng đồng trầm | One low strike on a medium bronze village gong (cồng), warning, 1.2 s ring, not a temple gong. |
| `night-fall` | Trời tối, đêm bắt đầu | Trang nghiêm, sắp đánh | Ba tiếng trống và cồng trầm | Three village drum beats (slow, slow-quick) followed by one deep bronze gong, evening alarm in a bamboo village, 3 s. |
| `dawn` | Bình minh sau đêm | Nhẹ nhõm | Sáo đi lên ba nốt | A gentle rising three-note phrase on a sáo trúc bamboo flute at dawn, airy, 1 s. |
| `defeat` | Lũy mất hết mạng | Buồn, không bi | Cồng rất trầm và sáo đi xuống | One very low gong stroke, then a slow falling three-note bamboo flute phrase, sad but gentle, 3 s. |

## 4. Màn đầu và giao diện (bus `ui`)

| Id | Khi nào | Không khí | Hiện tại (mã) | Prompt cho file thật |
|---|---|---|---|---|
| `ui-move` | Chuyển mục trên màn đầu, thẻ tạm dừng | Rất nhẹ | Gõ thanh tre nhỏ | A very light tap on a thin bamboo slat, 40 ms. |
| `ui-pick` | Chọn một mục | Chắc, dễ chịu | Gõ gỗ và chuông nhỏ | A wooden clapper tap followed by a small bronze bell, 0.6 s. |
| `ui-off` | Chọn mục đang khóa | Không trách | "Tóc" trầm | A dull soft knock on wood, 60 ms. |
| `ui-lamp` | Một ngọn đèn lồng sáng lên ở màn đầu | Ấm, kỳ diệu nhỏ | Giấy sột soạt và chuông li ti | A paper lantern being lit: soft paper rustle, a tiny match-like breath, a very faint high chime, 0.5 s. |

## 5. Âm nền màn đầu

| Id | Khi nào | Không khí | Hiện tại (mã) | Prompt cho file thật |
|---|---|---|---|---|
| `amb-villager-call` | Màn đầu, mỗi 3–7 s, trái hoặc phải | Làng xa, chiều tà | Giọng tổng hợp qua hai formant "Ơ… ơi!", lọc xa, vang | A villager calling across rice fields at dusk, far away, a long drawn "Ơ… ơi!" in Vietnamese, no other words, heavy distance and soft valley echo, 1.5 s. Make 4 variants (two men, two women). |
| `amb-dusk` | Màn đầu (chưa có) | Yên, ấm | Chưa có | Evening in a Vietnamese bamboo village: crickets, wind through ripe rice, a distant stream, bamboo creaking softly, a far dog bark once, seamless loop 60 s, stereo. |

## 6. Nhạc (bus `music`)

Một nhịp 84 BPM, một thang ngũ cung, hai lớp bắt đầu cùng lúc, chuyển 2 s (TK 24.8). Ban đêm phát cả hai, lớp êm nhỏ đi 6 dB. Nhạc nhường phát âm từ (−9 dB).

| Id | Khi nào | Không khí | Hiện tại (mã) | Prompt cho file thật |
|---|---|---|---|---|
| `music-calm` | Màn đầu, ban ngày, bình minh | Êm, vui, làng tre buổi chiều | Đàn tranh rải hình 8 phách mỗi ô nhịp, dây trầm đầu ô nhịp, câu sáo trúc mỗi 4 ô nhịp | Calm Vietnamese folk loop: đàn tranh zither arpeggios and a soft low string, a sáo trúc bamboo flute phrase every four bars, pentatonic C D F G A, 84 BPM, 16 bars, seamless loop, warm and light, no drums, no synth pads. |
| `music-tension` | Ban đêm (cùng `music-calm`) | Căng, thúc giục, không sợ | Trống cơm theo mẫu 8 phách, đàn tranh trầm lặp quanh D, phách tre ở phách lẻ, cồng mỗi 4 ô nhịp | Tension layer for the same loop: trống cơm drum pattern, low đàn tranh ostinato around D, bamboo clapper on the off-beats, one bronze gong every four bars, same key and 84 BPM, 16 bars, must sit under the calm layer without clashing. |
| `music-boss` | Boss (chưa có, bước 1B) | Lớn, có lễ | Chưa có | Boss theme in the same pentatonic and tempo family: big trống cơm and large drum ensemble, đàn tranh tremolo, sáo trúc lead, gongs, 32 bars. |
| `music-stingers` | Đầu đêm, hết đêm, mở nhà mới, mốc Chuỗi 20 và 40 (chưa có) | Ngắn, rõ | Chưa có (đang dùng `night-fall`, `dawn`, `chain-callout`) | Five short stingers 2–5 s in the same key: night start, night cleared, new building, chain 20, chain 40, on đàn tranh, sáo trúc and small drums. |

## 7. Ghép file thật vào game

1. Đặt file gốc ở `art-src/audio/<id>-v<n>.wav`, bản trong game ở `public/assets/typing-defense/audio/<id>.ogg`.
2. Manifest âm (chưa có) ghi mỗi id: bus, file, độ lệch cao độ, trần, ưu tiên (TK 24.2). Thiếu file thì giữ tiếng tổng hợp hiện tại.
3. Tiếng phím không qua manifest này (Typing Feel hoặc Bamboo).
4. Mỗi file ghi công cụ, gói, ngày, prompt (TK 24.9).

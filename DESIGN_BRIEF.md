# Bonia — Design Brief: Install & Onboarding Guide (+ takeover copy)

Prepared for the Claude Design connection. Two jobs:
1. **NEW**: a step-by-step install + onboarding guide (data shows many users stall mid-onboarding), with the "call your carrier" step handled delicately.
2. **UPDATE**: reframe copy that the new "Nghe trực tiếp" (takeover) feature has made outdated, and add the direct-call policy.

---

## 1. Design system (what "sync current code with design" should capture)

### Landing page tokens (`src/App.jsx`) — keep the guide in THIS aesthetic
- **Palette:** clay `#7B4A2D` (primary/ACC) · warm amber `#9C6D4E` · cream bg `#F2EEE6` · white · ink `#1F1B16` · ink-2 `#4A4239` · muted `#7A6F62` · hairlines `#D9D0BF` / `#EFE9DD`
- **Type:** `ff-serif` for headings (editorial, weight 380–500, some italic accents) · `ff-mono` for numbers/eyebrows/labels (UPPERCASE, tracking 0.18–0.22em) · `font-sans` body
- **Idiom:** numbered sections (№ 02–07); eyebrow (mono, uppercase) + serif headline + body; hairline dividers; custom store badges (never Apple/Google plastic); restrained, editorial, cream paper.
- **Existing components:** `TopNav`, `SectionHead`, `TranscriptCard` (chat bubbles), `CallListPhone` (iPhone mockup), `StoreBadges` (light/dark), `FAQList` (accordion), concern cards, `FinalCTA` (navy gradient), `PageFooter`.

### In-app tokens (for screenshots / harmony — the APP is navy+green, NOT clay)
- Navy `#191970` (primary) · navy tint `#ECEEF8` · green `#00A76F` (success/takeover) · green tint `#E5F6EE` · amber `#D97706` · red `#D63C3C` · text `#1B2236`/`#5A6378` · bg `#F5F7FB`.
- ⚠️ The website is clay/cream; the app is navy/green. The guide should stay clay/cream (web brand), but any app screenshots will read navy/green — design should keep them harmonious (e.g. framed in a cream device mockup), not clashing.

---

## 2. Current site inventory
Hero → Problem (№02) → Solution (№03) → **How it works (№04 — only 3 high-level steps)** → Examples (№05) → FAQ/Concerns (№06) → Final CTA (№07) → Footer.
Static pages: `privacy.html`, `terms.html`, `support.html`, `delete-account.html`.
**Gap:** no detailed install/onboarding walkthrough anywhere.

---

## 3. THE MAIN ASK — Install & Onboarding guide

A new page (suggested route `/huong-dan`, nav label **"Hướng dẫn cài đặt"**) OR a big expansion of №04. Goal: get a non-technical first-timer all the way through, and **defuse the two real drop-off points** (the carrier-forwarding setup, and the verification test).

### Full step sequence (mirrors the app exactly)
1. **Tải app & mở** — App Store / Google Play.
2. **Nhập số điện thoại** (và cách xưng hô, ví dụ "anh Duy").
3. **Chọn nhà mạng** (Viettel / MobiFone / VinaPhone / Vietnamobile).
4. **Bật chuyển hướng cuộc gọi** — two flavours:
   - **USSD** (most carriers): bấm gọi `**61*<số Bonia>#` (khi nhỡ) và `**67*<số Bonia>#` (khi từ chối).
   - **SMS 1322** (Viettel gateway users): gửi `CHUYEN N …` / `CHUYEN B …` tới 1322.
   - **iOS 26+ / 27 note:** on newer iPhones the app copies the code and you paste it into the Phone keypad (Apple blocks auto-dial of these codes). Show this so users aren't confused.
5. **Kiểm tra chuyển hướng** (Bonia gọi thử đến số của bạn). ⚠️ two caveats to surface here — both are real failure causes:
   - Tạm bỏ chặn số gọi thử nếu đang dùng app chặn cuộc gọi (Truecaller…).
   - **Đảm bảo thuê bao còn tiền và không bị khoá chiều gọi đi** — nếu không, máy không chuyển hướng được. *(A real user failed onboarding because his account had no balance.)*
6. **Thành công** → tuỳ chỉnh giọng nói & lời chào (gợi ý để **"Alo"**) **hoặc** dùng mặc định, bắt đầu ngay.
7. **(Nếu kiểm tra thất bại)** → **Gọi tổng đài nhà mạng** — the delicate step below.

### 3a. The carrier-call step — MUST be reassuring (this is the emphasis)
Users freeze at "call your carrier." De-stress it hard: it's fast, the operator does the work, here's the exact script.

- **Heading:** "Chưa bật được? Gọi tổng đài — chỉ mất 1–2 phút."
- **Reassurance line:** "Tổng đài viên sẽ bật giúp bạn ngay trong cuộc gọi. Bạn không cần biết gì về kỹ thuật — chỉ cần đọc đúng một câu."
- **3 micro-steps:**
  1. **Gọi tổng đài** — Viettel **198** · MobiFone **18001090** · VinaPhone **18001091** · Vietnamobile **789** (miễn phí).
  2. **Đọc câu này cho tổng đài viên:** *"SIM của tôi không bật được chức năng chuyển hướng cuộc gọi, vui lòng hỗ trợ bật giúp tôi."* (verbatim — same script as in-app)
  3. **Quay lại app và bấm "Thử lại".** Xong!
- **Safety net:** "Nếu vẫn chưa được, nhắn Zalo/gọi hỗ trợ Bonia — chúng tôi bật giúp bạn." (support phone/Zalo + email `duynguyen@bonia.net`)
- **Tone:** warm, plain Vietnamese, zero jargon, "1–2 phút", "ngay lập tức", "chúng tôi ở đây".

---

## 4. REQUIRED COPY UPDATES — the takeover feature changed the story

The site currently promises Bonia **doesn't** take calls for you. That's now wrong. New feature: **"Nghe trực tiếp" / "Nhận cuộc gọi"** — while Bonia is screening a live call, the user can tap once to take it over and talk to the caller directly (their phone rings; they answer natively).

- **Solution section:** the 4th feature currently reads *"Bạn vẫn là người quyết định … Bonia không thay bạn xử lý — chỉ thu thập thông tin…"*. Reframe to keep "you're in control" but ADD takeover:
  - New feature bullet: **"Nghe trực tiếp khi cần"** — *"Khi Bonia đang xử lý một cuộc gọi quan trọng, bạn có thể theo dõi trực tiếp và nhận máy chỉ với một chạm — nói chuyện ngay với người gọi."*
- **FAQ "Bonia có thay tôi nghe máy hoàn toàn không?"** — currently "Không." Update to: *"Bonia nhận khi bạn không bắt máy. Và bất cứ lúc nào bạn muốn, bạn có thể nhận máy trực tiếp để tự nói chuyện — bạn luôn là người quyết định."*
- Optionally a small **live-call mockup** (transcript streaming + a green "Nhận cuộc gọi" button) mirroring the app's live view — reuses the existing `TranscriptCard` bubble style.

---

## 5. Direct-call / takeover POLICY (approved wording — put on site + link from Privacy)

Founder-approved framing (the "no training" claim stands — we use third-party models we can't train; transcripts only tailor responses, they don't train a model):

> **Khi bạn nhận máy trực tiếp:** Bonia nối máy để bạn nói chuyện trực tiếp với người gọi và **ngừng xử lý** cuộc gọi đó.
> - Bonia **KHÔNG ghi âm** cuộc trò chuyện trực tiếp của bạn.
> - Bonia có thể lưu **bản chuyển ngữ (transcript)** của đoạn này để nâng cao chất lượng dịch vụ.
> - Bonia **KHÔNG dùng nội dung cuộc gọi để huấn luyện AI** — Bonia dùng mô hình của bên thứ ba (không thể huấn luyện); bản chuyển ngữ chỉ giúp phản hồi thông minh hơn, không dùng để huấn luyện bất kỳ mô hình nào.

(This same clause should also be added to the in-app Privacy screen for consistency — separate task, not the landing page.)

---

## 6. Notes for whoever builds it
- Stack: Vite + React + Tailwind (`src/App.jsx` is the whole SPA; static legal pages in `public/*.html`).
- Keep VN copy verbatim where quoted above (curly quotes, "dạ/ạ" tone).
- Carrier numbers + the forwarding codes come from backend config in the app; on the site they can be shown as the well-known defaults above.
- The install-time is marketed as "2 phút" elsewhere — keep that promise consistent.

# Bonia — Design Brief: `bonia.vn/business` (partner acquisition landing page)
> **⚠️ HISTORICAL — DO NOT BUILD FROM THIS FILE.**
> Written before the 2026-08-31 collateral change. Its economics are obsolete:
> it describes a 50% hold and "ba khách đầu tiên hoàn toàn miễn phí", neither of
> which is true. The system now holds **the full bid** on every lead beyond an
> employee's three trial leads, those three are **không cần tạm giữ (not free)** —
> the success fee still applies — and the customer's reward is a per-lead
> snapshot, not a fixed 50%. The authoritative copy lives in
> `public/terms-business.html`, `public/huong-dan-business.html` and
> `src/business/frames/`. Kept only as a record of the original design intent.


Prepared for the Claude Design connection. **One job:** a public landing page that turns a bank
relationship manager who has heard of Bonia into a registered partner.

Today the only partner-facing surface is **bonia.vn/app**, which is a bare login box. Reps are
recruited over Zalo, so there is nowhere to send someone who asks *"what is this, and what does it
cost me?"* This page is that answer.

---

## 1. Who is reading this page

A **Vietnamese bank relationship manager / credit-card sales staffer**. Concretely: the person whose
monthly target is card applications, who currently finds customers by cold-calling purchased lists,
posting in Facebook groups, and working their own contacts.

What they are thinking, in this order:

1. *Will this actually bring me customers, or is it another lead-list scam?*
2. *What does it cost me, and when do I pay?*
3. *Is this a real company, or two people with a website?*
4. *Is this allowed — am I going to get in trouble with compliance?*

The page has to answer all four **above the point where they decide to leave**. Question 2 is the one
that decides it. Be explicit about money — vagueness reads as concealment when the whole pitch is
*you only pay for results*.

**Tone:** peer-to-peer and commercially plain. Not startup-breathless, not corporate-stiff. This
person is paid on commission and is sceptical by trade. Respect that: short sentences, real numbers,
no adjectives doing the work of facts.

---

## 2. Design system — reuse the existing site aesthetic

This page lives in the **same visual world as the consumer site**, not the app.

### Landing tokens (`src/App.jsx`, and the static pages)
- **Palette:** clay `#7B4A2D` (accent) · cream bg `#F2EEE6` · white · ink `#1F1B16` · ink-2 `#4A4239`
  · muted `#7A6F62` · hairlines `#D9D0BF` / `#EFE9DD`
- **Type:** `ff-serif` (Source Serif 4) for headings, weight 380–500, occasional italic ·
  `ff-mono` (JetBrains Mono) for numbers, eyebrows, labels — UPPERCASE, tracking 0.18–0.22em ·
  Inter for body
- **Idiom:** numbered sections (`§ 01`…), eyebrow + serif headline + body, hairline dividers,
  editorial cream paper, generous whitespace. Restrained. No gradients-and-glow SaaS look.

### Closest existing references — please open these first
- `public/terms-business.html` and `public/privacy-business.html` — I wrote these today, same
  audience, same voice. The nav pattern there (Bonia **business** wordmark, links to partner terms
  + consumer policy, "Đăng nhập →" CTA) should carry onto this page.
- `public/privacy.html` — the section/eyebrow/hairline rhythm.
- `src/App.jsx` — hero scale, `FinalCTA` navy block, footer.

### The one deliberate tension
The **website is clay/cream; the partner portal at `/app` is navy `#191970` + green `#00A76F`.**
If you show portal screenshots, frame them (device/browser chrome in cream) so navy reads as *a
product inside the page*, not a palette clash. Same rule the previous guide brief set.

---

## 3. Page structure and content

Suggested route `/business`. Below is the content and the actual Vietnamese copy — treat the copy as
accurate-but-rewritable: the **facts are fixed**, the phrasing is yours to improve.

### Hero
- Eyebrow (mono): `BONIA BUSINESS`
- Headline: **"Khách hàng chủ động tìm bạn."**
- Sub: *"Người dùng Bonia bấm quan tâm thẻ họ muốn mở. Bạn nhận khách đã có nhu cầu — không mua data,
  không gọi lạnh."*
- Two CTAs: **"Đăng ký đối tác"** (primary) and **"Đăng nhập"** (ghost) — both → `/app`
- A quiet line under the buttons: *"Miễn phí 3 khách đầu tiên. Chỉ trả phí khi thẻ được mở thành công."*

### § 01 — How it works (4 steps)
1. **Khách chọn thẻ** — người dùng xem các ưu đãi trong app và bấm quan tâm thẻ họ muốn.
2. **Bonia kết nối** — khách được chuyển tới tư vấn viên đang chào giá cao nhất cho loại thẻ đó.
3. **Bạn tư vấn** — gọi và nhắn tin ngay trong hệ thống Bonia, qua số bảo mật.
4. **Thẻ được mở → bạn trả phí** — hai bên cùng xác nhận, phí được trừ vào số dư của bạn.

### § 02 — The masking guarantee (do not bury this)
Headline idea: **"Bạn không bao giờ nhận được số điện thoại của khách."**

Copy: *"Mọi cuộc gọi đi qua số bảo mật của Bonia. Khách hàng yên tâm để lại nhu cầu vì họ biết số của
mình không bị chuyển cho ai. Đó cũng là lý do họ chủ động bấm quan tâm — thay vì né cuộc gọi lạ."*

Frame this as **why the supply exists**, not as a restriction on the rep. It is also the honest
compliance answer to question 4: no list-buying, no number sharing, the customer initiated contact.

### § 03 — THE MONEY (be fully explicit — this is the section that converts)
Give this its own visual weight. Suggest a small table or a set of mono-numbered cards.

| | |
|---|---|
| **Phí trả cho Bonia** | Bằng đúng mức bạn tự đặt cho loại thẻ đó |
| **Khi nào trả** | Chỉ khi thẻ được mở thành công và hai bên cùng xác nhận |
| **3 khách đầu tiên** | Miễn phí hoàn toàn — không cần nạp tiền trước |
| **Phí cố định hàng tháng** | Không có |
| **Phí trên mỗi khách** | Không có |

Then the wallet, in plain language:

- *"Số dư hoạt động như một ví. Khi một thẻ được mở thành công, phí được **trừ thẳng vào số dư**."*
- *"Từ khách thứ 4, khi nhận một khách Bonia tạm giữ **50% mức phí** trong số dư — phần tạm giữ được
  hoàn lại nếu khách không mở thẻ."*
- *"Nếu số dư về 0, bạn tạm dừng nhận khách mới cho đến khi nạp thêm."*

And the bidding mechanic, which is the competitive hook:

- *"Bạn tự đặt mức phí cho từng loại thẻ. Với mỗi loại thẻ, khách hàng **chỉ thấy tư vấn viên đang đặt
  mức cao nhất**. Đặt cao hơn để nhận nhiều khách hơn, hoặc thấp hơn để giữ biên lợi nhuận."*

**Include this too — it is the answer to "why would a customer bother?":**
*"Một nửa mức phí bạn trả được Bonia chuyển lại cho khách hàng như phần thưởng tiền mặt khi họ mở thẻ
thành công. Đó là lý do khách chủ động tìm đến."*

Worked example, in mono, because a concrete number lands harder than a paragraph:
> Bạn đặt phí **520.000đ** cho thẻ Diamond World.
> Khách bấm quan tâm → bạn tư vấn → thẻ được duyệt.
> Bonia trừ **520.000đ** từ số dư của bạn và chuyển **260.000đ** cho khách hàng.

### § 04 — What you get in the portal
Short, concrete, ideally with one framed screenshot of the Pipeline view:
- Danh sách khách đang chờ tư vấn, theo thứ tự
- Gọi trực tiếp từ trình duyệt qua số bảo mật
- Nhắn tin với khách ngay trong hệ thống
- Bản ghi và nội dung cuộc gọi tư vấn để đối chiếu khi cần
- Số dư, lịch sử phí và hoá đơn

### § 05 — Trust / legitimacy
This section is doing the "are you a real company" job. Keep it factual and unadorned:
- Công ty TNHH Duy Nhiên Investment · MST 0319376631 · 120 N2 Mega Village, Đường Võ Chí Công,
  phường Long Trường, TP.HCM
- Links: **Điều khoản đối tác** (`/terms-business.html`) · **Chính sách bảo mật Bonia Business**
  (`/privacy-business.html`)
- Contact: Duy Nguyen · 0909 291 268 · duynguyen@bonia.net
- One line on review: *"Hồ sơ đăng ký được Bonia duyệt trước khi kích hoạt."* — set the expectation
  that registration is not instant.

### § 06 — FAQ (accordion, matching `FAQList` on the main site)
Draft questions, in the order a sceptic asks them:
- *Tôi có phải trả tiền để nhận khách không?* → Không. Chỉ trả khi thẻ được mở thành công.
- *Tôi có nhận được số điện thoại của khách không?* → Không, và sẽ không bao giờ.
- *Nếu khách nói đã mở thẻ nhưng thực tế chưa?* → Hai bên phải cùng xác nhận; khác biệt sẽ được Bonia
  đối soát.
- *Tôi có thể tạm dừng nhận khách không?* → Có, bất cứ lúc nào trong cổng đối tác.
- *Bonia có bán data khách hàng không?* → Không.
- *Tôi làm ở ngân hàng khác, có tham gia được không?* → Có — đăng ký và chọn ngân hàng của bạn.

### Final CTA
Reuse the navy `FinalCTA` block idiom from the main site. **"Đăng ký đối tác"** → `/app`, with the
free-3-leads line repeated underneath.

### Footer
Match the static pages: company block + email. Link back to the consumer site (`/`).

---

## 4. Technical constraints

- **Deliverable: a single self-contained static page**, `public/business.html`, in the same shape as
  `public/privacy.html` / `public/terms-business.html` — plain HTML, Tailwind via CDN, the `:root`
  token block inlined, Google Fonts link. **Not** a React route; the landing app in `src/` is a
  separate build and this page must not depend on it.
- **`<meta name="robots" content="noindex, nofollow">`.** Deliberate: the pricing on this page is
  competitively sensitive while the pilot is unproven, and we do not want a "banks pay to reach you"
  page ranking against the consumer brand. This will be flipped on later — design as if public.
- Route `/business` will be served by a targeted Vercel rewrite to `business.html`. Do **not**
  assume clean URLs elsewhere — every existing page is linked with its `.html` extension, and those
  URLs are baked into both mobile apps and the store listings.
- Every CTA points at **`/app`** (the partner portal). Registration and login both live there.
- Favicon links as per the other static pages (`/favicon-32.png`, `/favicon-180.png`).
- Must read well at 375px — reps will open this on a phone, from a Zalo message.

---

## 5. What NOT to do

- **Do not put this in the consumer site's top nav.** A consumer landing on this page undermines the
  trust story the consumer product depends on. Footer link only (already added).
- **Do not use stock photography of bankers shaking hands.** The existing brand is editorial and
  restrained; the moment this page looks like a generic fintech template it loses the credibility it
  exists to build.
- **Do not soften the money section.** No "liên hệ để biết thêm chi tiết" in place of a number.
- **Do not imply Bonia sells leads or data**, or that reps get customer contact details. Both are
  false and both are load-bearing promises to consumers.
- **Do not promise volume.** We cannot yet say how many customers a rep will receive, and a rep who
  feels misled on that is a rep who churns and tells the others.

---

## 6. Facts, verified against the running system (do not paraphrase these loosely)

- First **3** routed leads per rep are free, lifetime (`FREE_LEADS = 3`).
- From lead 4, routing reserves **50% of the bid** in the wallet; released if the deal does not close.
- On a confirmed deal the **full fee is debited from the balance**; the reservation is released.
- A balance **below zero blocks new leads** until topped up.
- The consumer's reward is currently **50%** of the fee — admin-settable, snapshotted per deal.
- Per card type, only the **highest bidder** is shown to customers.
- Reps **never** receive the customer's phone number; all calls route through Bonia's masked number.
- Consult calls are **recorded and transcribed**, visible to both the rep and the customer.
- Registration is **reviewed and approved** by Bonia before activation.

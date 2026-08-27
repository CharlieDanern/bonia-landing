# Bonia — Business landing page brief

**Route:** `bonia.vn/business`  
**Audience:** Nhân viên quan hệ khách hàng / tư vấn thẻ tín dụng tại Việt Nam  
**Primary action:** Đăng ký Bonia Business tại `/app`

## 1. Mục tiêu của trang

Bonia hiện tuyển đối tác chủ yếu qua Zalo, nhưng chưa có một trang công khai để giải thích sản phẩm.
`bonia.vn/app` mới chỉ là màn hình đăng nhập. Trang `/business` cần trả lời rõ bốn câu hỏi trước khi
người đọc quyết định đăng ký:

1. Khách hàng đến từ đâu?
2. Tôi phải trả khoản nào, vào lúc nào?
3. Tôi có nhận được số điện thoại hoặc data khách hàng không?
4. Ai vận hành Bonia và điều khoản hợp tác ở đâu?

Đây là trang giới thiệu và đăng ký, không phải bài quảng cáo thương hiệu. Người đọc quen với chỉ
tiêu doanh số, phí giới thiệu và chất lượng lead. Họ sẽ kiểm tra con số trước khi tin lời hứa.

### Giá trị trang phải bán

Bonia không bán cho đối tác một danh sách số điện thoại. Bonia tạo ra một cuộc trao đổi mà cả hai
phía đều có lý do để tham gia:

> Khách không phải đổi số điện thoại lấy một cuộc tư vấn. Đối tác không phải mua một danh sách chưa
> biết ai có nhu cầu.

**Với khách hàng:** họ tự chọn thẻ, chủ động yêu cầu tư vấn và vẫn ở sau lớp bảo vệ sẵn có của Bonia.
Số điện thoại không được chuyển cho đối tác; cuộc gọi và tin nhắn ở trong Bonia; khách có thể dừng
liên lạc. Nếu mở thẻ thành công, khách nhận khoản thưởng bằng 50% mức phí.

**Với đối tác:** họ nhận yêu cầu từ một người đã chọn thẻ cụ thể. Không có phí đăng ký, phí cố định
hàng tháng hay phí mua danh sách. Đối tác tự đặt mức phí thành công cho từng loại thẻ; phí đầy đủ chỉ
phát sinh khi thẻ được mở và hai bên cùng xác nhận.

**Vai trò của Bonia:** che số điện thoại, kết nối hai bên, lưu cuộc tư vấn, xác nhận kết quả và chuyển
phần thưởng cho khách. Lớp bảo vệ này không phải một tính năng phụ: nó làm cho việc bày tỏ nhu cầu
trở nên ít rủi ro hơn với người dùng.

Mạch của trang phải đi theo thứ tự: **vì sao khách chủ động → vì sao đối tác nên tham gia → cách giao
dịch diễn ra → cách tính phí**. Tính năng cổng đối tác chỉ dùng để chứng minh Bonia vận hành được lời
hứa đó.

### Nguyên tắc viết

- Câu ngắn, chủ ngữ rõ, ưu tiên động từ cụ thể.
- Dùng `khách hàng`, `mức phí`, `số dư`, `tạm giữ`, `hoàn lại`, `mở thẻ thành công` đúng nghĩa.
- Có số thì ghi số. Có điều kiện thì nói ngay cạnh lời hứa.
- Không dùng các cụm như `giải pháp toàn diện`, `tối ưu hiệu quả`, `nâng tầm`, `đột phá`,
  `hệ sinh thái`, `khách hàng tiềm năng chất lượng cao`.
- Không gọi Bonia là nơi bán lead hoặc bán data.
- Không hứa số lượng khách, tỷ lệ mở thẻ hoặc thu nhập.
- Không khẳng định thay ngân hàng rằng một quy trình là “đúng compliance”. Chỉ mô tả đúng cách hệ
  thống bảo vệ số điện thoại, ghi nhận sự chủ động của khách và lưu dữ liệu đối soát.
- Viết như một người đang giải thích cách hợp tác cho đồng nghiệp, không như một bài pitch startup.
- **Lập luận, không liệt kê.** Mỗi section phải nói tiếp một ý, không phải thêm một mục vào danh sách
  tính năng. Nếu đảo thứ tự các section mà trang vẫn đọc như cũ thì trang đang liệt kê chứ chưa lập
  luận.

---

## 2. Hệ thống hình ảnh

Trang Business dùng cùng ngôn ngữ thiết kế với website Bonia dành cho người dùng, không dùng giao
diện của cổng đối tác làm nền cho cả trang.

### Design tokens

- **Màu:** clay `#7B4A2D` · cream `#F2EEE6` · white · ink `#1F1B16` · ink-2 `#4A4239` ·
  muted `#7A6F62` · hairline `#D9D0BF` / `#EFE9DD`
- **Heading:** Source Serif 4, weight 380–500, có thể dùng italic tiết chế
- **Label và số:** JetBrains Mono, uppercase, tracking 0.18–0.22em
- **Body:** Inter
- **Bố cục:** section đánh số (`§ 01`, `§ 02`...), eyebrow nhỏ, heading serif, đường kẻ mảnh,
  khoảng trắng rộng
- **Không dùng:** gradient, glow, card dày đặc hoặc hình ảnh fintech có sẵn

### Trang tham chiếu

Mở các file này trước khi thiết kế:

- `public/terms-business.html`
- `public/privacy-business.html`
- `public/privacy.html`
- `src/App.jsx`

Giữ nav của các trang Business: wordmark Bonia **business**, liên kết điều khoản/chính sách và CTA
`Đăng nhập →`.

Cổng đối tác dùng navy `#191970` và green `#00A76F`. Nếu đưa screenshot vào trang, đặt screenshot
trong khung trình duyệt hoặc thiết bị màu cream để phân biệt giao diện sản phẩm với giao diện website.

---

## 3. Cấu trúc trang và copy đề xuất

Copy dưới đây đã được viết theo đúng cơ chế đang chạy. Có thể chỉnh nhịp câu cho phù hợp layout,
nhưng không được làm thay đổi ý nghĩa về phí, số dư, dữ liệu khách hàng hoặc cách kết nối.

### Hero

**Eyebrow**

`BONIA BUSINESS`

**Headline — dùng phương án này**

> Khách chủ động chọn thẻ. Bạn chỉ trả khi thẻ được mở.

**Subheadline**

> Người dùng Bonia yêu cầu tư vấn mà vẫn giữ kín số điện thoại. Nếu mở thẻ thành công, họ nhận
> thưởng; lúc đó bạn mới trả mức phí mình đã đặt.

**CTA**

- Primary: `Đăng ký đối tác` → `/app`
- Secondary: `Đăng nhập` → `/app`

**Dòng dưới CTA**

> 3 khách đầu: 0đ, không cần nạp trước · Không phí hàng tháng

**Hero visual — không dùng screenshot dashboard ở đây**

Thể hiện một giao dịch cụ thể trên một trục nối hai phía:

- Phía khách: `Diamond World` · `Ẩn số điện thoại` · `Nhận 260.000đ khi mở thành công`
- Ở giữa: `Tư vấn qua Bonia` · `Hai bên xác nhận`
- Phía đối tác: `Phí thành công 520.000đ` · `Chỉ trừ sau khi thẻ được mở`

Visual này phải cho người đọc thấy ngay mỗi bên đưa gì vào và nhận gì lại. Screenshot cổng đối tác
để xuống § 05, sau khi đề nghị hợp tác đã được hiểu.

Không thêm các badge như `uy tín`, `bảo mật tuyệt đối`, `đối tác tin cậy` nếu không có bằng chứng đi
kèm.

### § 01 — Muốn được tư vấn, không muốn để lại số

Đây là lý do nguồn khách của Bonia khác với một form thu số điện thoại.

**Headline**

> Khách giữ số điện thoại. Bạn vẫn có một cuộc tư vấn.

**Copy**

> Người dùng vốn đã có trợ lý Bonia nghe máy thay với những số lạ. Khi chọn một thẻ, lớp bảo vệ đó
> vẫn còn nguyên: số điện thoại không được chuyển cho tư vấn viên, cuộc gọi và tin nhắn ở trong
> Bonia, và khách có thể dừng liên lạc.

> Yêu cầu tư vấn không trao cho tư vấn viên số điện thoại để gọi trực tiếp về sau. Vì vậy, khách có
> thể nói rõ thẻ nào họ quan tâm mà không phải mở thông tin liên hệ cho một bên mới.

> Nếu mở thẻ thành công, khách còn nhận khoản thưởng bằng 50% mức phí. Quyền kiểm soát khiến họ an
> tâm bắt đầu; phần thưởng cho họ thêm lý do để hoàn tất việc mở thẻ.

Gợi ý thể hiện: một hình ảnh hai chiều — phía khách được che số và nhận thưởng, phía đối tác nhận
yêu cầu và chỉ trả phí khi thành công — thay vì hai khối văn bản rời nhau. Luận điểm là **sự trao
đổi**, nên hình ảnh nên là một trục nối, không phải hai danh sách.

Tránh biến nội dung này thành một lời hứa pháp lý. Chỉ mô tả đúng cơ chế của sản phẩm.

### § 02 — Không mua danh sách. Chỉ trả cho kết quả

Đây là phần bán đề nghị hợp tác cho đối tác. Nói về cách họ kiểm soát chi phí, không nói về dashboard.

**Headline**

> Data cho bạn một số điện thoại. Bonia cho bạn một yêu cầu tư vấn.

**Copy**

> Không có phí đăng ký, phí cố định hàng tháng hay phí mua từng khách. Bạn đặt mức phí thành công
> riêng cho mỗi loại thẻ và chỉ trả đầy đủ khi cả bạn lẫn khách xác nhận thẻ đã được mở.

> Ba khách đầu tiên hoàn toàn miễn phí. Từ khách thứ 4, Bonia tạm giữ 50% mức phí khi kết nối khách;
> nếu khách không mở thẻ, số tiền này được hoàn lại.

> Bạn không trả tiền để biết một người có nhu cầu hay không. Khách đã chọn thẻ trước khi cuộc tư vấn
> bắt đầu.

Không dùng `khách hàng chất lượng`, `lead nóng` hoặc `tỷ lệ chuyển đổi cao`. Bonia chưa cần gắn nhãn
cho khách; cơ chế khách tự chọn thẻ đã đủ để nói lên sự khác biệt.

### § 03 — Một giao dịch bắt đầu từ phía khách

Đến đây mới mô tả thao tác. Dùng một flow ngang trên desktop và dọc trên mobile.

#### 1. Khách chọn thẻ

Khách xem thẻ trên Bonia, thấy khoản thưởng và bấm yêu cầu tư vấn.

#### 2. Bonia kết nối

Với mỗi loại thẻ, Bonia chuyển yêu cầu tới tư vấn viên đang đặt mức phí cao nhất.

#### 3. Hai bên trao đổi trên Bonia

Bạn gọi hoặc nhắn tin trong hệ thống. Bonia giữ kín số điện thoại và lưu lại nội dung trao đổi.

#### 4. Hai bên xác nhận kết quả

Nếu thẻ được mở, phí được trừ từ số dư của bạn và 50% được chuyển cho khách như phần thưởng. Nếu
không thành công, bạn không mất phí thành công.

**Dòng kết section**

> Khách chọn trước. Hai bên xác nhận sau. Bonia chỉ thu phí khi giao dịch thành công.

### § 04 — Mức phí do bạn đặt

Phần này giải thích đầy đủ cơ chế tiền. Không giấu điều kiện trong tooltip hoặc FAQ.

| Nội dung | Cách tính |
|---|---|
| **Mức phí thành công** | Bạn tự đặt cho từng loại thẻ |
| **Khi phát sinh phí** | Khi thẻ mở thành công và hai bên cùng xác nhận |
| **3 khách đầu tiên** | 0đ, không cần nạp tiền trước |
| **Phí cố định hàng tháng** | 0đ |
| **Khách không mở thẻ** | Không mất phí thành công |

#### Số dư hoạt động thế nào?

> Số dư dùng để thanh toán phí thành công. Khi một giao dịch hoàn tất, mức phí bạn đã đặt được trừ
> khỏi số dư.

> Từ khách thứ 4, Bonia tạm giữ 50% mức phí khi khách được chuyển cho bạn. Nếu khách không mở thẻ,
> số tiền tạm giữ được hoàn lại.

> Nếu số dư âm, bạn tạm dừng nhận khách mới cho đến khi nạp thêm.

#### Mức phí quyết định lượt hiển thị

> Bạn đặt mức phí riêng cho từng loại thẻ. Khách chỉ thấy tư vấn viên đang đặt mức cao nhất cho thẻ
> đó. Nếu một tư vấn viên khác đặt cao hơn, hồ sơ của họ sẽ được hiển thị thay cho hồ sơ của bạn.

#### Ví dụ

> Bạn đặt mức phí **520.000đ** cho thẻ Diamond World.  
> Khách yêu cầu tư vấn và mở thẻ thành công.  
> Bonia trừ **520.000đ** từ số dư của bạn. Khách nhận **260.000đ** qua Bonia.

Không dùng các câu như `đầu tư để nhận lead chất lượng` hoặc `đấu giá để tối đa hoá cơ hội`. Hai cụm
này làm cơ chế nghe giống mua bán data.

### § 05 — Bonia giữ giao dịch trong một kênh

Cổng đối tác là bằng chứng cho lời hứa về quyền riêng tư và phí theo kết quả. Dùng một screenshot
Pipeline thật, đặt trong khung trình duyệt.

**Headline**

> Từ yêu cầu tư vấn đến lúc xác nhận kết quả, mọi thứ ở trên Bonia.

**Copy**

> Bạn không cần lấy số điện thoại để theo sát một khách. Cuộc gọi, tin nhắn, bản ghi nội dung, kết
> quả giao dịch và phí đều nằm trong cùng một luồng để hai bên có thể đối chiếu khi cần.

Các chi tiết có thể chú thích quanh screenshot:

- Xem khách đang chờ tư vấn
- Gọi trên trình duyệt qua số bảo mật của Bonia
- Nhắn tin với khách trong cổng đối tác
- Nghe lại cuộc gọi và đọc bản ghi nội dung
- Theo dõi số dư, phí đã phát sinh và hoá đơn

Không dùng `quản lý pipeline thông minh`, `theo dõi hiệu suất toàn diện` hoặc `vận hành liền mạch`.

### § 06 — Thông tin đơn vị vận hành

**Heading**

> Bonia được vận hành bởi ai?

**Thông tin hiển thị nguyên văn**

- Công ty TNHH Duy Nhiên Investment
- MST 0319376631
- 120 N2 Mega Village, Đường Võ Chí Công, phường Long Trường, TP.HCM
- Duy Nguyen · 0909 291 268 · duynguyen@bonia.net

**Liên kết**

- `Điều khoản đối tác` → `/terms-business.html`
- `Chính sách bảo mật Bonia Business` → `/privacy-business.html`

**Dòng duyệt hồ sơ**

> Bonia xem xét hồ sơ trước khi kích hoạt tài khoản đối tác.

Không dùng logo ngân hàng để tạo cảm giác được ngân hàng bảo trợ nếu chưa có quyền sử dụng hoặc xác
nhận hợp tác tương ứng.

### § 07 — Câu hỏi thường gặp

#### Tôi có phải trả tiền trước để bắt đầu không?

Không. Bonia không thu phí đăng ký hoặc phí cố định hàng tháng; ba khách đầu tiên được miễn phí. Từ
khách thứ 4, Bonia tạm giữ 50% mức phí bạn đã đặt khi kết nối khách. Số tiền này được hoàn lại nếu
khách không mở thẻ. Phí đầy đủ chỉ được tính khi thẻ mở thành công.

#### Tôi có nhận được số điện thoại của khách không?

Không. Bạn gọi và nhắn tin với khách trên Bonia; hệ thống không hiển thị số điện thoại cho hai bên.

#### Nếu hai bên xác nhận kết quả khác nhau thì sao?

Giao dịch được chuyển sang đối soát. Bonia kiểm tra thông tin hai bên và lịch sử trao đổi trước khi
chốt kết quả.

#### Tôi có thể tạm dừng nhận khách không?

Có. Bạn có thể tạm dừng và bật lại trong cổng đối tác.

#### Bonia có bán data khách hàng không?

Không. Bonia không bán danh sách số điện thoại. Khách tự chọn thẻ và yêu cầu được tư vấn trên ứng
dụng Bonia.

#### Vì sao khách lại chủ động yêu cầu tư vấn?

Khách không phải để lộ số điện thoại và có thể dừng liên lạc trên Bonia. Nếu mở thẻ thành công, khách
còn nhận khoản thưởng bằng 50% mức phí. Họ có cả quyền kiểm soát lẫn một lợi ích rõ ràng khi tham gia.

#### Tôi làm ở ngân hàng khác thì có đăng ký được không?

Có. Chọn ngân hàng của bạn khi đăng ký. Bonia xem xét hồ sơ trước khi kích hoạt tài khoản.

### Final CTA

Giữ navy `FinalCTA` như website hiện tại.

**Headline**

> Thử Bonia với 3 khách đầu tiên miễn phí.

**Supporting copy**

> Không phí đăng ký. Không phí hàng tháng. Bonia xem xét hồ sơ trước khi kích hoạt tài khoản.

**CTA**

`Đăng ký đối tác` → `/app`

### Footer

Giữ company block và email như các trang tĩnh hiện tại. Có link về website người dùng tại `/`.

---

## 4. Yêu cầu kỹ thuật

- Tạo một trang tĩnh tự chứa tại `public/business.html`.
- Dùng cùng cấu trúc với `public/privacy.html` và `public/terms-business.html`: HTML thuần, Tailwind
  qua CDN, token trong `:root`, Google Fonts.
- Không tạo React route. Trang không phụ thuộc vào build trong `src/`.
- Thêm `<meta name="robots" content="noindex, nofollow">` trong giai đoạn pilot.
- `/business` sẽ rewrite tới `business.html` trên Vercel.
- Các đường dẫn tới trang tĩnh khác vẫn giữ hậu tố `.html`.
- Mọi CTA đăng ký và đăng nhập đều trỏ tới `/app`.
- Dùng favicon `/favicon-32.png` và `/favicon-180.png` như các trang hiện tại.
- Kiểm tra kỹ ở chiều rộng 375px; phần lớn đối tác sẽ mở link từ Zalo trên điện thoại.

---

## 5. Những điều không được làm

- Không thêm trang Business vào top nav của website người dùng. Chỉ liên kết từ footer hoặc gửi
  trực tiếp cho đối tác.
- Không dùng ảnh stock nhân viên ngân hàng bắt tay, họp nhóm hoặc nhìn laptop.
- Không thay con số bằng `liên hệ để biết thêm`.
- Không nói Bonia bán lead, bán data hoặc chuyển số điện thoại khách hàng.
- Không hứa số lượng khách, doanh thu, tỷ lệ mở thẻ hoặc thời gian hoàn vốn.
- Không dùng logo ngân hàng như bằng chứng hợp tác khi chưa được phép.
- Không dùng testimonial, số liệu hoặc badge chưa được xác minh.
- Không biến trang thành danh sách tính năng. "Gọi trên trình duyệt", "ghi âm cuộc gọi", "theo dõi
  số dư" là công cụ, không phải lý do đăng ký. Lý do đăng ký là nguồn khách chủ động và việc không
  phải trả trước.
- Không mô tả lớp bảo vệ của Bonia như một tính năng bảo mật phụ. Đó là cơ chế tạo ra nguồn khách —
  nếu section § 01 đọc như một dòng cam kết quyền riêng tư, trang đã hỏng phần quan trọng nhất.

---

## 6. Các dữ kiện phải giữ nguyên

- 3 lượt kết nối đầu tiên của mỗi đối tác được miễn phí trọn đời (`FREE_LEADS = 3`).
- Từ lượt thứ 4, hệ thống tạm giữ 50% mức phí khi khách được chuyển cho đối tác.
- Nếu giao dịch không thành công, phần tạm giữ được hoàn lại.
- Nếu giao dịch thành công, toàn bộ mức phí được trừ khỏi số dư; phần tạm giữ được cấn trừ.
- Số dư dưới 0 sẽ chặn lượt kết nối mới cho đến khi đối tác nạp thêm.
- Khách hiện nhận khoản thưởng bằng 50% mức phí. Tỷ lệ được lưu theo từng giao dịch.
- Với mỗi loại thẻ, chỉ tư vấn viên đặt mức phí cao nhất được hiển thị cho khách.
- Đối tác không nhận số điện thoại của khách. Cuộc gọi đi qua số bảo mật của Bonia.
- Cuộc gọi tư vấn được ghi âm và chuyển thành văn bản; cả đối tác và khách đều xem được.
- Bonia xem xét và duyệt hồ sơ trước khi kích hoạt tài khoản đối tác.

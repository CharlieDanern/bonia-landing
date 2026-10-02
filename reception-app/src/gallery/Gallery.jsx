import React, { useState } from "react";
import {
  ActivityList,
  AiReviewRow,
  Banner,
  BoniaSays,
  Button,
  CalendarCell,
  CalendarDayHeader,
  ChatBubble,
  Chip,
  ConflictRow,
  Dialog,
  EmergencyRow,
  InviteCard,
  LockedOption,
  MessageFlag,
  NeedFill,
  OtpInput,
  PermissionChips,
  PriceConfirmRow,
  RadioCard,
  RecordingPlayer,
  SaveBar,
  Segmented,
  SettingsCard,
  SideSheet,
  SkeletonRow,
  SourceChip,
  StatusBlock,
  StatusPill,
  StepPills,
  Tag,
  TextInput,
  Toggle,
  TypingBubble,
  VietQrBlock,
} from "../components/ui/index.js";
import { CallList, OnboardingBar, RequestList, SettingsNav, Sidebar } from "../components/shell/index.js";
import { useStore, select } from "../store/index.jsx";
import { CALLS } from "../data/calls.js";
import { S05 } from "../data/settings.js";
import { BANK, INVOICE } from "../data/billing.js";
import { REVIEW_01, REVIEW_02_PRICES } from "../data/onboarding.js";
import { DAYS } from "../data/calendar.js";

// Dev-only gallery (/reception/app/_gallery): every shared component in
// every state, on sample data. Not routed in production builds.

function Section({ id, title, spec, children }) {
  return (
    <section id={id} style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 28, borderTop: "1px solid var(--bn-hairline)" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
        <h3 style={{ fontFamily: "var(--bn-serif)", fontWeight: 400, fontSize: 26 }}>{title}</h3>
        {spec && <span style={{ fontSize: 12.5, color: "var(--bn-muted)" }}>{spec}</span>}
      </div>
      {children}
    </section>
  );
}

function Row({ children, gap = 12, align = "center", wrap = true, style }) {
  return <div style={{ display: "flex", gap, alignItems: align, flexWrap: wrap ? "wrap" : "nowrap", ...style }}>{children}</div>;
}

function Caption({ children }) {
  return <div style={{ fontFamily: "var(--bn-mono)", fontSize: 10, letterSpacing: "0.14em", color: "var(--bn-muted)", textTransform: "uppercase" }}>{children}</div>;
}

const SECTIONS = [
  ["buttons", "Button"],
  ["inputs", "Text input"],
  ["otp", "OTP"],
  ["pills", "Status pill · flag · chips"],
  ["review", "AI review · conflict · cần bạn điền · giá"],
  ["says", "Bonia sẽ nói…"],
  ["toggles", "Toggle · permission chips · locked"],
  ["settings", "Settings card · save bar"],
  ["overlays", "Side sheet · dialog · invite"],
  ["status", "Status block"],
  ["calendar", "Calendar cell"],
  ["chat", "Chat bubbles · recording"],
  ["emergency", "Emergency · activity · step pills"],
  ["vietqr", "VietQR"],
  ["shell", "Shell pieces"],
];

export default function Gallery() {
  const state = useStore();
  const [otp, setOtp] = useState("482");
  const [toggles, setToggles] = useState({ a: true, b: false, c: true });
  const [perm, setPerm] = useState({ answer: true, record: true, notify: false, check: false });
  const [conflict, setConflict] = useState(0);
  const [need, setNeed] = useState(0);
  const [prices, setPrices] = useState(REVIEW_02_PRICES);
  const [sheet, setSheet] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [invite, setInvite] = useState(false);
  const [seg, setSeg] = useState("all");
  const [radio, setRadio] = useState("record");
  const [reviewOk, setReviewOk] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <div style={{ display: "flex", minHeight: "100%", background: "var(--bn-cream)" }}>
      <nav
        style={{
          position: "sticky",
          top: 0,
          alignSelf: "flex-start",
          height: "100vh",
          width: 240,
          flex: "none",
          padding: "28px 20px",
          borderRight: "1px solid var(--bn-hairline)",
          background: "var(--bn-cream-2)",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          overflowY: "auto",
        }}
      >
        <Caption>Bonia Tiếp tân · gallery</Caption>
        {SECTIONS.map(([id, t]) => (
          <a key={id} href={`#${id}`} style={{ fontSize: 13.5, color: "var(--bn-ink)", padding: "4px 0" }}>
            {t}
          </a>
        ))}
      </nav>

      <div style={{ flex: 1, minWidth: 0, padding: "32px 40px 120px", display: "flex", flexDirection: "column", gap: 28 }}>
        <h1 className="tt-page-title">Thành phần dùng chung</h1>

        <Section id="buttons" title="Button" spec="primary · secondary · disabled · loading · sizes">
          <Row>
            <Button size="lg">Gửi mã</Button>
            <Button size="lg" disabled>
              Vào
            </Button>
            <Button size="lg" loading>
              Đang gửi mã…
            </Button>
            <Button variant="secondary" size="lg">
              Không thấy mã?
            </Button>
          </Row>
          <Row>
            <Button>Xác nhận và nhắn khách</Button>
            <Button variant="secondary">Gọi lại</Button>
            <Button size="sm">Kiểm tra ngay</Button>
            <Button size="sm" variant="secondary">
              Xem mã chuyển cuộc gọi
            </Button>
            <Button size="xs" variant="secondary">
              Tìm lại trên mạng
            </Button>
            <Button size="mini">Đúng</Button>
            <Button size="sm" variant="danger">
              Thử lưu lại
            </Button>
            <Button variant="link">Xem tất cả</Button>
            <Button
              size="sm"
              loading={loading}
              onClick={() => {
                setLoading(true);
                setTimeout(() => setLoading(false), 1500);
              }}
            >
              Bấm thử
            </Button>
          </Row>
        </Section>

        <Section id="inputs" title="Text input" spec="normal · focus · error · unconfirmed · disabled · suffix">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 460px))", gap: 24 }}>
            <TextInput label="Số điện thoại đăng nhập" mono value="0900 000 300" helper="Điện thoại quầy có ứng dụng Bonia, thường chính là số hotline." onChange={() => {}} />
            <TextInput label="Có ô đang chọn" mono value="0900 000 300" focused onChange={() => {}} />
            <TextInput
              label="Lỗi"
              mono
              value="0900 000 311"
              error="Số này chưa có ứng dụng Bonia. Cài ứng dụng Bonia trên điện thoại quầy rồi thử lại, hoặc nhập đúng số đã đăng ký."
              onChange={() => {}}
            />
            <TextInput label="Đang gửi" mono value="0900 000 300" disabled onChange={() => {}} />
            <TextInput label="Bonia tìm được, chưa xác nhận" mono value="720.000" suffix="đ" unconfirmed height={44} fontSize={15} onChange={() => {}} />
            <TextInput label="Gõ thử" placeholder="Tìm theo số hoặc tên" onChange={() => {}} />
          </div>
        </Section>

        <Section id="otp" title="OTP" spec="6 ô · tự nhảy ô · dán được cả chuỗi · lỗi · hết hạn">
          <Caption>Bình thường (ô 4 đang chọn)</Caption>
          <OtpInput value={otp} onChange={setOtp} activeIndex={otp.length < 6 ? otp.length : undefined} />
          <Caption>Sai mã</Caption>
          <OtpInput value="482917" state="error" />
          <Banner tag="LỖI">Mã chưa đúng. Còn 3 lần thử.</Banner>
          <Caption>Hết hạn</Caption>
          <OtpInput value="" state="expired" />
          <Banner tag="HẾT HẠN">Mã đã hết hạn. Gửi lại mã?</Banner>
          <Banner tone="info" tag="MẠNG">
            Nếu máy đang mất mạng: Không gửi được mã. Kiểm tra kết nối rồi bấm Gửi mã lại.
          </Banner>
        </Section>

        <Section id="pills" title="Status pill · flag · source chip · chips">
          <Row gap={6}>
            {["new:MỚI", "processing:CHỜ CỌC", "processing:ĐÃ GIAO", "processing:ĐANG TÌM", "processing:TÌM THẤY", "done:✓ ĐÃ XÁC NHẬN", "done:✓ XONG", "done:KHÔNG THẤY", "done:✓ ĐÃ TRẢ KHÁCH", "done:ĐÃ TỪ CHỐI", "urgent:GẤP", "overdue:QUÁ HẠN", "conflict:⚠", "type:ĐẶT PHÒNG", "type:KHÁCH ĐANG Ở", "reported:ĐÃ BÁO"].map((k) => {
              const [kind, text] = k.split(":");
              return (
                <StatusPill key={k} kind={kind}>
                  {text}
                </StatusPill>
              );
            })}
          </Row>
          <Row gap={4}>
            <Caption>Cỡ danh sách</Caption>
            {select.requestPills(state, state.requests[0]).map((p) => (
              <StatusPill key={p.text} kind={p.kind} size="sm">
                {p.text}
              </StatusPill>
            ))}
          </Row>
          <Row gap={6}>
            <MessageFlag messagedAt="11:20" />
            <MessageFlag />
          </Row>
          <Row gap={6}>
            {["BOOKING.COM", "TRANG WEB", "GOOGLE MAPS", "FACEBOOK", "AGODA", "TRAVELOKA"].map((s) => (
              <SourceChip key={s}>{s}</SourceChip>
            ))}
          </Row>
          <Row gap={6}>
            <Chip selected>Mọi loại</Chip>
            <Chip>Đặt phòng</Chip>
            <Chip>Đổi/hủy</Chip>
            <Chip style={{ background: "var(--bn-urgent-wash)" }}>Chưa nhắn khách · 2</Chip>
            <Chip variant="answer" selected>
              Bấm chuông hoặc gọi lễ tân
            </Chip>
            <Chip variant="answer">Lễ tân mở cửa cả đêm</Chip>
            <Chip variant="custom">Tự viết…</Chip>
            <Chip variant="choice" selected>
              Tên
            </Chip>
            <Chip variant="choice">Email</Chip>
          </Row>
          <Segmented
            value={seg}
            onChange={setSeg}
            style={{ width: 408 }}
            options={[
              { value: "moi", label: "Mới", count: "6" },
              { value: "dang-xu-ly", label: "Đang xử lý", count: "3" },
              { value: "xong", label: "Xong" },
              { value: "all", label: "Tất cả" },
            ]}
          />
          <Row gap={6}>
            <Tag>KHÓA</Tag>
            <Tag tone="locked">KHÓA</Tag>
            <Tag tone="urgent">LỖI</Tag>
            <Tag tone="urgent-fill" shape="pill" size={10}>
              CẦN KIỂM TRA
            </Tag>
            <Tag tone="clay" dashed>
              CHỜ KHÁCH SẠN XÁC NHẬN
            </Tag>
          </Row>
        </Section>

        <Section id="review" title="AI review · conflict · cần bạn điền · giá" spec="viền nét đứt = Bonia tìm được, chưa xác nhận">
          <div style={{ maxWidth: 852, display: "flex", flexDirection: "column", gap: 8 }}>
            <AiReviewRow {...REVIEW_01.rows[0]} />
            <AiReviewRow {...REVIEW_01.rows[1]} confirmed={reviewOk} onConfirm={() => setReviewOk(true)} onRemove={() => setReviewOk(false)} />
            <ConflictRow label="Giờ nhận phòng" options={REVIEW_01.rows[2].conflict} selected={conflict} onSelect={setConflict} />
            <AiReviewRow {...REVIEW_01.rows[3]} />
            <NeedFill question={REVIEW_01.question.text} options={REVIEW_01.question.options} selected={need} onSelect={setNeed} />
            <NeedFill
              question="Bạn có nhận khách theo giờ không?"
              tag="CẦN BẠN ĐIỀN · 1/4"
              options={["Có · 2 giờ đầu + mỗi giờ sau", "Không nhận theo giờ"]}
              selected={0}
              allowCustom={false}
              note="Còn: giá qua đêm · ngày lễ · giường phụ"
              gap={10}
            />
            <div style={{ borderTop: "1px solid var(--bn-hairline)" }}>
              {prices.map((p, i) => (
                <PriceConfirmRow
                  key={p.id}
                  name={p.name}
                  meta={p.meta}
                  otaPrice={p.ota}
                  value={p.mine}
                  confirmed={p.confirmed}
                  onChange={(v) => setPrices((ps) => ps.map((x, j) => (j === i ? { ...x, mine: v } : x)))}
                  onConfirm={() => setPrices((ps) => ps.map((x, j) => (j === i ? { ...x, confirmed: true } : x)))}
                />
              ))}
            </div>
          </div>
        </Section>

        <Section id="says" title="Bonia sẽ nói…">
          <Row align="flex-start">
            <BoniaSays quote={REVIEW_01.say} size={19} padding="20px 22px" style={{ width: 380 }} />
            <BoniaSays context="Khách hỏi thuê 3 giờ chiều nay" quote="“Dạ phòng Superior theo giờ, 2 giờ đầu 240 nghìn, giờ thứ ba thêm 50 nghìn, tổng 290 nghìn ạ.”" style={{ width: 280 }} />
            <BoniaSays variant="inline" quote={state.tempNotice.say} style={{ width: 356 }} />
          </Row>
        </Section>

        <Section id="toggles" title="Toggle · permission chips · locked option · radio">
          <Row gap={16}>
            <Toggle on={toggles.a} onChange={(v) => setToggles({ ...toggles, a: v })} label="Bật" />
            <Toggle on={toggles.b} onChange={(v) => setToggles({ ...toggles, b: v })} label="Tắt" />
            <Toggle size="lg" on={toggles.c} onChange={(v) => setToggles({ ...toggles, c: v })} label="Lớn" />
            <Toggle size="lg" on={false} disabled label="Không bấm được" />
          </Row>
          <PermissionChips value={perm} onChange={setPerm} />
          <PermissionChips value={perm} onChange={setPerm} size="matrix" only={["answer", "record", "notify"]} />
          <div style={{ maxWidth: 576, display: "flex", flexDirection: "column", gap: 6 }}>
            {state.settings["03"].modes.map((m) =>
              m.locked ? (
                <LockedOption key={m.id} title={m.title} sub={m.sub} />
              ) : (
                <RadioCard key={m.id} title={m.title} sub={m.sub} selected={radio === m.id} onSelect={() => setRadio(m.id)} />
              )
            )}
            <div style={{ background: "#fff", border: "1px solid var(--bn-hairline)", borderRadius: 12, overflow: "hidden" }}>
              <LockedOption variant="row" title="Tự hứa nhận sớm, trả trễ" />
            </div>
            <LockedOption variant="note" title="Bonia chỉ ghi lại; Bonia không bao giờ nói với khách là đã tìm thấy." />
          </div>
        </Section>

        <Section id="settings" title="Settings card · save bar" spec="✓ · Cần cài · Cần xem lại; thanh Lưu chỉ hiện khi có thay đổi">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, maxWidth: 1000 }}>
            {state.sections.slice(0, 6).map((s) => (
              <SettingsCard key={s.n} n={s.n} title={s.title} summary={s.summary} mark={s.mark} to={`/cai-dat/${s.n}`} />
            ))}
          </div>
          <div style={{ border: "1px solid var(--bn-hairline)", borderRadius: 12, overflow: "hidden", maxWidth: 928 }}>
            <SaveBar sticky={false} message="1 thay đổi chưa lưu · giá theo giờ 220.000 → 240.000" onDiscard={() => {}} onSave={() => {}} />
          </div>
          <div style={{ border: "1px solid var(--bn-hairline)", borderRadius: 12, overflow: "hidden", maxWidth: 928 }}>
            <SaveBar sticky={false} error="Chưa lưu được. Máy đang mất mạng; thay đổi vẫn còn trên máy này." onSave={() => {}} />
          </div>
        </Section>

        <Section id="overlays" title="Side sheet · dialog · invite card">
          <Row>
            <Button variant="secondary" onClick={() => setSheet(true)}>
              Mở side sheet
            </Button>
            <Button variant="secondary" onClick={() => setDialog(true)}>
              Mở dialog
            </Button>
            <Button variant="secondary" onClick={() => setInvite(true)}>
              Mời anh Tư
            </Button>
          </Row>
          <SideSheet
            open={sheet}
            onClose={() => setSheet(false)}
            title="Giao cho …"
            footer={
              <>
                <div style={{ fontSize: 13, color: "var(--bn-ink-2)", lineHeight: 1.5 }}>
                  Cô Hai nhận thông báo: <span style={{ fontFamily: "var(--bn-mono)", fontSize: 12 }}>Phòng 205 · Xin thêm 2 khăn tắm</span>. Không có tên hay số của
                  khách.
                </div>
                <Button block onClick={() => setSheet(false)}>
                  Giao cho cô Hai
                </Button>
              </>
            }
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {state.staff.map((s, i) => (
                <RadioCard key={s.id} title={s.name} selected={i === 0} radius={10} padding="0 12px" minHeight={50} />
              ))}
            </div>
          </SideSheet>
          <Dialog open={dialog} onClose={() => setDialog(false)} eyebrow="Chị Ngân · 13:47" title="Cuộc gọi này có vấn đề gì?" width={560}>
            <div style={{ fontSize: 14, color: "var(--bn-ink-2)" }}>Đội Bonia tự thấy ghi âm, lời thoại và mọi việc Bonia đã làm.</div>
            <Row style={{ justifyContent: "flex-end" }}>
              <Button size="sm" onClick={() => setDialog(false)}>
                Gửi cho Bonia
              </Button>
            </Row>
          </Dialog>
          <InviteCard open={invite} onClose={() => setInvite(false)} phone="0900 000 307" />
        </Section>

        <Section id="status" title="Status block" spec="bình thường · cần kiểm tra · lịch cũ">
          <Row align="flex-start">
            <StatusBlock facts={["Chuyển cuộc gọi ✓", "Cuộc gọi gần nhất 14:05", "Lịch phòng cập nhật 08:10"]} style={{ width: 392 }} />
            <StatusBlock
              kind="warn"
              tag="CẦN KIỂM TRA"
              context="Số điện thoại"
              title="Bonia chưa nhận cuộc gọi nào từ 18:00 hôm qua, lâu hơn bình thường. Kiểm tra lại chuyển cuộc gọi."
              body="Ngày thường khách sạn có khoảng 20 cuộc gọi tới Bonia. Kiểm tra ngay sẽ gọi thử tự động; máy quầy có thể đổ chuông."
              actions={
                <>
                  <Button size="sm">Kiểm tra ngay</Button>
                  <Button size="sm" variant="secondary">
                    Xem mã chuyển cuộc gọi
                  </Button>
                </>
              }
              style={{ width: 560 }}
            />
          </Row>
          <Banner tone="conflict">
            <span style={{ color: "var(--bn-urgent)", fontWeight: 600 }}>⚠ 2 yêu cầu đang chờ cho 1 phòng Deluxe còn lại (T6 9/10)</span>
          </Banner>
        </Section>

        <Section id="calendar" title="Calendar cell" spec="trống · hết · chờ · xung đột · đóng · chỉnh tay">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 69px)", borderTop: "1px solid var(--bn-hairline)", borderLeft: "1px solid var(--bn-hairline)", background: "#fff", width: "max-content" }}>
            {DAYS.slice(0, 7).map((d) => (
              <CalendarDayHeader key={d.date} {...d} />
            ))}
            <CalendarCell remaining={2} total={4} />
            <CalendarCell remaining={0} total={4} />
            <CalendarCell remaining={2} total={4} pending={1} />
            <CalendarCell remaining={1} total={2} pending={2} conflict />
            <CalendarCell closed closedReason="SỬA PHÒNG" />
            <CalendarCell remaining={4} total={4} manual />
            <CalendarCell {...select.cellView(state, "2026-10-09", "deluxe")} />
          </div>
        </Section>

        <Section id="chat" title="Chat bubbles · recording player">
          <div style={{ maxWidth: 728, background: "#fff", padding: 24, borderRadius: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            <RecordingPlayer duration="2:36" position="0:52" />
            {CALLS.find((c) => c.id === "ngan").transcript.slice(0, 3).map((l, i) => (
              <ChatBubble key={i} who={l.who} text={l.text} />
            ))}
          </div>
          <div style={{ maxWidth: 728, display: "flex", flexDirection: "column", gap: 12 }}>
            <ChatBubble size="lg" who="guest" text="Hai người lớn thôi. Giữ cho chị một phòng nha." />
            <ChatBubble size="lg" who="bonia" text="Dạ vâng, cho em xin tên người đặt ạ?" />
            <TypingBubble />
          </div>
        </Section>

        <Section id="emergency" title="Emergency row · activity · step pills">
          <div style={{ background: "#fff", border: "1px solid var(--bn-hairline)", borderRadius: 12, maxWidth: 888 }}>
            {S05.emergencies.slice(0, 5).map((e, i) => (
              <EmergencyRow key={e.id} {...e} first={i === 0} onSayChange={() => {}} />
            ))}
          </div>
          <div style={{ background: "#fff", border: "1px solid var(--bn-hairline)", borderRadius: 12, padding: "6px 16px", maxWidth: 474 }}>
            <ActivityList rows={state.activity.slice(0, 5)} />
          </div>
          <StepPills
            steps={[
              { label: "Mới", state: "done" },
              { label: "Đang tìm", state: "current" },
              { label: "Tìm thấy / Không thấy", state: "future" },
              { label: "Đã trả khách", state: "future" },
            ]}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 8, width: 408 }}>
            <SkeletonRow titleWidth="48%" />
            <SkeletonRow titleWidth="62%" />
          </div>
        </Section>

        <Section id="vietqr" title="VietQR">
          <div style={{ width: 398, background: "#fff", border: "1px solid var(--bn-hairline)", borderRadius: 14, padding: 24 }}>
            <VietQrBlock amount={INVOICE.total} bank={BANK} />
          </div>
        </Section>

        <Section id="shell" title="Shell pieces" spec="TT Sidebar · TT Settings Nav · TT Onboarding Bar · TT Request List · TT Call List">
          <div style={{ width: 1440, maxWidth: "100%", overflow: "hidden", borderRadius: 6 }}>
            <OnboardingBar step={2} />
          </div>
          <div style={{ overflowX: "auto", maxWidth: "100%" }}>
          <div style={{ display: "flex", height: 900, borderRadius: 6, overflow: "hidden", width: "max-content", background: "var(--bn-cream)" }}>
            <Sidebar active="hom-nay" />
            <Sidebar active="yeu-cau" status="warn" />
            <Sidebar active="none" status="paused" counts={{}} />
            <SettingsNav active="05" />
          </div>
          </div>
          <div style={{ overflowX: "auto", maxWidth: "100%" }}>
          <div style={{ display: "flex", height: 900, borderRadius: 6, overflow: "hidden", width: "max-content", background: "var(--bn-cream)" }}>
            <RequestList selectedId="kevin" />
            <RequestList mode="empty" />
            <CallList selectedId="ngan" />
            <CallList mode="loading" />
          </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

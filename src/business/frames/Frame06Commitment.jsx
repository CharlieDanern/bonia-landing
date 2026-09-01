// Ported from the Bonia scroll-narrative handoff (Bonia Frames Light.dc.html).
// Markup serialized from the prototype DOM rather than retyped, so the
// measured clamp()/gradient values are exactly the designed ones. Reveal
// behaviour is driven by the data-in / data-fd / data-fl / data-cta
// attributes, which deck.js reads — do not rename them.
// data-fit="scroll": six commitments plus citations overflow 100dvh on a 640px-tall Android by ~13px.
// deck.js enables internal scrolling only when it actually overflows.
export default function Frame06Commitment() {
  return (
    <section data-fit="scroll" data-f="5" data-screen-label="06 Commitment" style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always', position: 'relative', height: '100dvh', overflow: 'hidden', containerType: 'inline-size', display: 'flex', alignItems: 'center', padding: 'clamp(24px, 5vw, 72px)', background: '#F2EEE6', color: '#1F1B16' }}>
      <div style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
        <div data-in="fade" style={{ fontFamily: '\'JetBrains Mono\', monospace', fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#7A6F62' }}>
          Cam kết của Bonia · dành cho Banker
        </div>
        <div style={{ marginTop: 'clamp(10px, 2vh, 24px)' }}>
          <div data-in="up" data-delay="170" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '3px clamp(14px, 2vw, 32px)', alignItems: 'baseline', padding: 'clamp(7px, 1.2vh, 14px) 0', borderBottom: '1px solid #D9D0BF' }}>
            <div style={{ minWidth: '0' }}>
              <div style={{ fontFamily: '\'Source Serif 4\', Georgia, serif', fontSize: 'clamp(14px, min(1.85cqw, 3vh), 25px)', lineHeight: '1.22', letterSpacing: '-0.018em' }}>
                Bạn không nhìn thấy số điện thoại của khách hàng.
              </div>
              <div style={{ fontSize: 'clamp(11px, min(1.1cqw, 1.9vh), 13.5px)', lineHeight: '1.45', color: '#6E6255', marginTop: '2px', maxWidth: '64ch', textWrap: 'pretty' }}>
                Mọi cuộc gọi đi qua số bảo mật của Bonia. Đây là cơ chế mặc định của hệ thống, không phải tuỳ chọn.
              </div>
            </div>
            <a href="/privacy-business.html" style={{ fontFamily: '\'JetBrains Mono\', monospace', fontSize: 'clamp(10.5px, min(1.05cqw, 1.8vh), 12px)', letterSpacing: '0.08em', color: '#8A6A3E', whiteSpace: 'nowrap' }}>
              Bảo mật § 04
            </a>
          </div>
          <div data-in="up" data-delay="280" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '3px clamp(14px, 2vw, 32px)', alignItems: 'baseline', padding: 'clamp(7px, 1.2vh, 14px) 0', borderBottom: '1px solid #D9D0BF' }}>
            <div style={{ minWidth: '0' }}>
              <div style={{ fontFamily: '\'Source Serif 4\', Georgia, serif', fontSize: 'clamp(14px, min(1.85cqw, 3vh), 25px)', lineHeight: '1.22', letterSpacing: '-0.018em' }}>
                Cuộc gọi được ghi âm và bản ghi nội dung được hiển thị cho cả hai bên.
              </div>
              <div style={{ fontSize: 'clamp(11px, min(1.1cqw, 1.9vh), 13.5px)', lineHeight: '1.45', color: '#6E6255', marginTop: '2px', maxWidth: '64ch', textWrap: 'pretty' }}>
                Không có bản ghi riêng cho một phía. Dùng để xử lý khiếu nại và đối soát.
              </div>
            </div>
            <a href="/privacy-business.html" style={{ fontFamily: '\'JetBrains Mono\', monospace', fontSize: 'clamp(10.5px, min(1.05cqw, 1.8vh), 12px)', letterSpacing: '0.08em', color: '#8A6A3E', whiteSpace: 'nowrap' }}>
              Bảo mật § 06
            </a>
          </div>
          <div data-in="up" data-delay="390" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '3px clamp(14px, 2vw, 32px)', alignItems: 'baseline', padding: 'clamp(7px, 1.2vh, 14px) 0', borderBottom: '1px solid #D9D0BF' }}>
            <div style={{ minWidth: '0' }}>
              <div style={{ fontFamily: '\'Source Serif 4\', Georgia, serif', fontSize: 'clamp(14px, min(1.85cqw, 3vh), 25px)', lineHeight: '1.22', letterSpacing: '-0.018em' }}>
                Bonia không bán dữ liệu của Banker hoặc khách hàng và không chia sẻ dữ liệu cho mục đích tiếp thị.
              </div>
              <div style={{ fontSize: 'clamp(11px, min(1.1cqw, 1.9vh), 13.5px)', lineHeight: '1.45', color: '#6E6255', marginTop: '2px', maxWidth: '64ch', textWrap: 'pretty' }}>
                Dữ liệu chỉ dùng để vận hành cổng, định tuyến lead, đối soát và phát hiện gian lận.
              </div>
            </div>
            <a href="/privacy-business.html" style={{ fontFamily: '\'JetBrains Mono\', monospace', fontSize: 'clamp(10.5px, min(1.05cqw, 1.8vh), 12px)', letterSpacing: '0.08em', color: '#8A6A3E', whiteSpace: 'nowrap' }}>
              Bảo mật § 07
            </a>
          </div>
          <div data-in="up" data-delay="500" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '3px clamp(14px, 2vw, 32px)', alignItems: 'baseline', padding: 'clamp(7px, 1.2vh, 14px) 0', borderBottom: '1px solid #D9D0BF' }}>
            <div style={{ minWidth: '0' }}>
              <div style={{ fontFamily: '\'Source Serif 4\', Georgia, serif', fontSize: 'clamp(14px, min(1.85cqw, 3vh), 25px)', lineHeight: '1.22', letterSpacing: '-0.018em' }}>
                Tỷ lệ thưởng được ghi nhận khi lead được chuyển.
              </div>
              <div style={{ fontSize: 'clamp(11px, min(1.1cqw, 1.9vh), 13.5px)', lineHeight: '1.45', color: '#6E6255', marginTop: '2px', maxWidth: '64ch', textWrap: 'pretty' }}>
                Những thay đổi sau đó không ảnh hưởng đến lead đã nhận.
              </div>
            </div>
            <a href="/terms-business.html" style={{ fontFamily: '\'JetBrains Mono\', monospace', fontSize: 'clamp(10.5px, min(1.05cqw, 1.8vh), 12px)', letterSpacing: '0.08em', color: '#8A6A3E', whiteSpace: 'nowrap' }}>
              Điều 3.1
            </a>
          </div>
          <div data-in="up" data-delay="610" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '3px clamp(14px, 2vw, 32px)', alignItems: 'baseline', padding: 'clamp(7px, 1.2vh, 14px) 0', borderBottom: '1px solid #D9D0BF' }}>
            <div style={{ minWidth: '0' }}>
              <div style={{ fontFamily: '\'Source Serif 4\', Georgia, serif', fontSize: 'clamp(14px, min(1.85cqw, 3vh), 25px)', lineHeight: '1.22', letterSpacing: '-0.018em' }}>
                Giao dịch chỉ được xác nhận khi hai bên thống nhất về kết quả và sản phẩm thẻ.
              </div>
              <div style={{ fontSize: 'clamp(11px, min(1.1cqw, 1.9vh), 13.5px)', lineHeight: '1.45', color: '#6E6255', marginTop: '2px', maxWidth: '64ch', textWrap: 'pretty' }}>
                Cùng một kết quả và cùng một sản phẩm thẻ — Banker trên cổng, khách hàng trên app.
              </div>
            </div>
            <a href="/terms-business.html" style={{ fontFamily: '\'JetBrains Mono\', monospace', fontSize: 'clamp(10.5px, min(1.05cqw, 1.8vh), 12px)', letterSpacing: '0.08em', color: '#8A6A3E', whiteSpace: 'nowrap' }}>
              Điều 4.1
            </a>
          </div>
          <div data-in="up" data-delay="720" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '3px clamp(14px, 2vw, 32px)', alignItems: 'baseline', padding: 'clamp(7px, 1.2vh, 14px) 0', borderBottom: '1px solid #D9D0BF' }}>
            <div style={{ minWidth: '0' }}>
              <div style={{ fontFamily: '\'Source Serif 4\', Georgia, serif', fontSize: 'clamp(14px, min(1.85cqw, 3vh), 25px)', lineHeight: '1.22', letterSpacing: '-0.018em' }}>
                Nhân viên ngân hàng có ba lead đầu không cần tạm giữ.
              </div>
              <div style={{ fontSize: 'clamp(11px, min(1.1cqw, 1.9vh), 13.5px)', lineHeight: '1.45', color: '#6E6255', marginTop: '2px', maxWidth: '64ch', textWrap: 'pretty' }}>
                Cộng tác viên cần tạm giữ toàn bộ mức bid ngay từ lead đầu tiên.
              </div>
            </div>
            <a href="/terms-business.html" style={{ fontFamily: '\'JetBrains Mono\', monospace', fontSize: 'clamp(10.5px, min(1.05cqw, 1.8vh), 12px)', letterSpacing: '0.08em', color: '#8A6A3E', whiteSpace: 'nowrap' }}>
              Điều 3.2
            </a>
          </div>
        </div>
        <div data-in="fade" data-delay="900" style={{ marginTop: 'clamp(9px, 1.6vh, 18px)', fontFamily: '\'JetBrains Mono\', monospace', fontSize: 'clamp(10.5px, min(1.05cqw, 1.8vh), 12px)', letterSpacing: '0.05em', color: '#6E6255' }}>
          Trích Điều khoản đối tác 31/08/2026 · Chính sách bảo mật Bonia Business 31/08/2026
        </div>
      </div>
    </section>
  );
}

// Ported from the Bonia scroll-narrative handoff (Bonia Frames Light.dc.html).
// Markup serialized from the prototype DOM rather than retyped, so the
// measured clamp()/gradient values are exactly the designed ones. Reveal
// behaviour is driven by the data-in / data-fd / data-fl / data-cta
// attributes, which deck.js reads — do not rename them.
// data-fit="scroll": deck.js raises this frame's top padding to clear the
// fixed nav on short screens; the opt-in lets it scroll if that pushes the
// content over 100dvh rather than clipping it.
export default function Frame04Fee() {
  return (
    <section data-fit="scroll" data-f="3" data-screen-label="04 The fee" style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always', position: 'relative', height: '100dvh', overflow: 'hidden', containerType: 'inline-size', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(48px, 8vh, 96px) clamp(18px, 4vw, 56px) clamp(20px, 4vh, 48px)', background: 'radial-gradient(125% 95% at 50% 48%, #FCEBD1 0%, #F5E4C9 52%, #EFE2CB 100%)', color: '#1F1B16' }}>
      <div style={{ position: 'relative', width: '100%', maxWidth: '1000px', textAlign: 'center' }}>
        <div data-x="fee" style={{ fontFamily: '\'JetBrains Mono\', monospace', fontSize: 'clamp(52px, min(12cqw, 21vh), 168px)', lineHeight: '.92', letterSpacing: '-0.045em', marginTop: '0', background: 'linear-gradient(180deg, #7E4A1B 0%, #C08A4E 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', transformOrigin: 'center top', transition: 'transform .9s cubic-bezier(.4,0,.2,1), opacity .6s ease' }}>
          500.000đ
          <span style={{ fontSize: '0.34em', verticalAlign: 'super', letterSpacing: '0', marginLeft: '0.16em' }}>
            *
          </span>
        </div>
        <div data-in="fade" data-delay="1600" style={{ opacity: '1', transform: 'none', transition: 'opacity .7s ease', fontFamily: '\'JetBrains Mono\', monospace', fontSize: 'clamp(10.5px, min(1.2cqw, 2.1vh), 13px)', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#8A6A3E', marginTop: 'calc(-1 * clamp(4px, min(1.5cqw, 2.6vh), 22px))' }}>
          * Mức phí thành công do Banker tự đặt
        </div>
        <div data-x="pts" style={{ opacity: '1', transition: 'opacity .8s ease', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 'clamp(14px, 2.2vw, 34px)', marginTop: 'clamp(20px, 3.4vh, 44px)' }}>
          <div data-pt="" data-delay="0" style={{ opacity: '1', transform: 'none', transition: 'opacity .7s ease, transform .8s ease', textAlign: 'center', borderTop: '1px solid rgba(123,74,45,0.28)', paddingTop: 'clamp(14px, 2.2vh, 26px)' }}>
            <div style={{ fontFamily: '\'JetBrains Mono\', monospace', fontSize: 'clamp(26px, min(3.4cqw, 6vh), 48px)', lineHeight: '1', letterSpacing: '-0.02em', color: '#7B4A2D' }}>
              01
            </div>
            <div style={{ fontSize: 'clamp(13px, min(1.45cqw, 2.5vh), 18px)', lineHeight: '1.45', color: '#3A2E1E', textWrap: 'pretty', marginTop: 'clamp(8px, 1.3vh, 14px)' }}>
              Bạn chỉ trả phí khi hai bên xác nhận khách hàng đã mở thẻ thành công.
            </div>
          </div>
          <div data-pt="" data-delay="160" style={{ opacity: '1', transform: 'none', transition: 'opacity .7s ease, transform .8s ease', textAlign: 'center', borderTop: '1px solid rgba(123,74,45,0.28)', paddingTop: 'clamp(14px, 2.2vh, 26px)' }}>
            <div style={{ fontFamily: '\'JetBrains Mono\', monospace', fontSize: 'clamp(26px, min(3.4cqw, 6vh), 48px)', lineHeight: '1', letterSpacing: '-0.02em', color: '#7B4A2D' }}>
              02
            </div>
            <div style={{ fontSize: 'clamp(13px, min(1.45cqw, 2.5vh), 18px)', lineHeight: '1.45', color: '#3A2E1E', textWrap: 'pretty', marginTop: 'clamp(8px, 1.3vh, 14px)' }}>
              Trong cùng một sản phẩm, thẻ có mức thưởng cao hơn được ưu tiên hiển thị.
            </div>
          </div>
          <div data-pt="" data-delay="320" style={{ opacity: '1', transform: 'none', transition: 'opacity .7s ease, transform .8s ease', textAlign: 'center', borderTop: '1px solid rgba(123,74,45,0.28)', paddingTop: 'clamp(14px, 2.2vh, 26px)' }}>
            <div style={{ fontFamily: '\'JetBrains Mono\', monospace', fontSize: 'clamp(26px, min(3.4cqw, 6vh), 48px)', lineHeight: '1', letterSpacing: '-0.02em', color: '#7B4A2D' }}>
              03
            </div>
            <div style={{ fontSize: 'clamp(13px, min(1.45cqw, 2.5vh), 18px)', lineHeight: '1.45', color: '#3A2E1E', textWrap: 'pretty', marginTop: 'clamp(8px, 1.3vh, 14px)' }}>
              Khách hàng luôn thấy rõ khoản thưởng trước khi bày tỏ sự quan tâm.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

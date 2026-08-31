// Ported from the Bonia scroll-narrative handoff (Bonia Frames Light.dc.html).
// Markup serialized from the prototype DOM rather than retyped, so the
// measured clamp()/gradient values are exactly the designed ones. Reveal
// behaviour is driven by the data-in / data-fd / data-fl / data-cta
// attributes, which deck.js reads — do not rename them.
// data-fit="scroll": deck.js raises this frame's top padding to clear the
// fixed nav on short screens; the opt-in lets it scroll if that pushes the
// content over 100dvh rather than clipping it.
export default function Frame05NoFees() {
  return (
    <section data-fit="scroll" data-f="4" data-screen-label="05 No fees" style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always', position: 'relative', height: '100dvh', overflow: 'hidden', containerType: 'inline-size', display: 'flex', alignItems: 'center', padding: 'clamp(48px, 8vh, 96px) clamp(18px, 4vw, 56px) clamp(20px, 4vh, 48px)', background: 'radial-gradient(125% 95% at 50% 108%, #FBEACF 0%, #F5F0E6 46%, #EFEADF 100%)', color: '#1F1B16' }}>
      <div style={{ width: '100%', maxWidth: '1320px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 'clamp(18px, 3vw, 64px)' }}>
        <div style={{ flex: '1 1 330px', minWidth: '0', position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <div data-fd="" data-delay="80" style={{ opacity: '1', transform: 'none', transition: 'opacity .8s ease, transform .9s cubic-bezier(.2,.6,.2,1)', fontFamily: '\'Source Serif 4\', Georgia, serif', fontWeight: '400', fontSize: 'clamp(32px, min(6.4cqw, 11.5vh), 104px)', lineHeight: '1.08', letterSpacing: '-0.034em', paddingBottom: '0.06em', background: 'linear-gradient(180deg, #C4813C 0%, #7B4A2D 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
              Không phí trả trước.
            </div>
            <div data-fd="" data-delay="280" style={{ opacity: '1', transform: 'none', transition: 'opacity .8s ease, transform .9s cubic-bezier(.2,.6,.2,1)', fontFamily: '\'Source Serif 4\', Georgia, serif', fontWeight: '400', fontSize: 'clamp(32px, min(6.4cqw, 11.5vh), 104px)', lineHeight: '1.08', letterSpacing: '-0.034em', paddingBottom: '0.06em', color: '#1F1B16' }}>
              {"Không "}
              <span data-blur="" style={{ display: 'inline-block', willChange: 'filter' }}>
                phí ẩn
              </span>
              .
            </div>
          </div>
        </div>
        <div style={{ flex: '0 1 clamp(260px, 32%, 420px)', minWidth: '0' }}>
          <div data-fl="" data-delay="520" style={{ opacity: '1', transform: 'none', transition: 'opacity .8s ease, transform .9s ease', fontFamily: '\'JetBrains Mono\', monospace', fontSize: 'clamp(10.5px, min(1.15cqw, 2vh), 13px)', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7A6F62', marginBottom: 'clamp(8px, 1.4vh, 16px)' }}>
            Dành cho Banker
          </div>
          <div data-fl="" data-delay="600" style={{ opacity: '1', transform: 'none', transition: 'opacity .8s ease, transform .9s cubic-bezier(.2,.6,.2,1)', fontSize: 'clamp(13.5px, min(1.5cqw, 2.6vh), 19px)', lineHeight: '1.5', color: '#4A4239', borderTop: '1px solid #D9D0BF', padding: 'clamp(11px, 1.7vh, 20px) 0', textWrap: 'pretty' }}>
            Không thu phí đăng ký.
          </div>
          <div data-fl="" data-delay="720" style={{ opacity: '1', transform: 'none', transition: 'opacity .8s ease, transform .9s cubic-bezier(.2,.6,.2,1)', fontSize: 'clamp(13.5px, min(1.5cqw, 2.6vh), 19px)', lineHeight: '1.5', color: '#4A4239', borderTop: '1px solid #D9D0BF', padding: 'clamp(11px, 1.7vh, 20px) 0', textWrap: 'pretty' }}>
            Không thu phí đăng hoặc cập nhật thẻ.
          </div>
          <div data-fl="" data-delay="840" style={{ opacity: '1', transform: 'none', transition: 'opacity .8s ease, transform .9s cubic-bezier(.2,.6,.2,1)', fontSize: 'clamp(13.5px, min(1.5cqw, 2.6vh), 19px)', lineHeight: '1.5', color: '#4A4239', borderTop: '1px solid #D9D0BF', padding: 'clamp(11px, 1.7vh, 20px) 0', textWrap: 'pretty' }}>
            Chỉ phát sinh phí khi khách hàng mở thẻ thành công.
          </div>
        </div>
      </div>
    </section>
  );
}

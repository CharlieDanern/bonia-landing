// Ported from the Bonia scroll-narrative handoff (Bonia Frames Light.dc.html).
// Markup serialized from the prototype DOM rather than retyped, so the
// measured clamp()/gradient values are exactly the designed ones. Reveal
// behaviour is driven by the data-in / data-fd / data-fl / data-cta
// attributes, which deck.js reads — do not rename them.
export default function Frame01Question() {
  return (
    <section data-f="0" data-screen-label="01 Question" style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always', position: 'relative', height: '100dvh', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(72px, 12vh, 120px) clamp(18px, 4vw, 40px)', background: 'radial-gradient(125% 95% at 50% 112%, #FBEACF 0%, #F5F0E6 46%, #EFEADF 100%)' }}>
      <div data-cardsrc="" style={{ display: 'none' }}>
        <div style={{ position: 'absolute', inset: '0', borderRadius: '17px', overflow: 'hidden', background: 'linear-gradient(138deg, #F7F4ED 0%, #D6CEBE 44%, #F2EDE3 72%, #C8BFAD 100%)', boxShadow: '0 24px 42px -24px rgba(52,38,20,0.5), inset 0 0 0 0.5px rgba(255,255,255,0.3)' }}>
          <div style={{ position: 'absolute', inset: '0', opacity: '1', pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(255,255,255,0.10)', clipPath: 'polygon(0% 0%, 42% 0%, 14% 46%)' }} />
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(0,0,0,0.07)', clipPath: 'polygon(42% 0%, 78% 0%, 46% 38%)' }} />
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(255,255,255,0.07)', clipPath: 'polygon(78% 0%, 100% 0%, 100% 34%, 62% 22%)' }} />
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(0,0,0,0.06)', clipPath: 'polygon(0% 46%, 14% 46%, 30% 100%, 0% 100%)' }} />
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(255,255,255,0.06)', clipPath: 'polygon(14% 46%, 46% 38%, 58% 78%, 30% 100%)' }} />
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(0,0,0,0.05)', clipPath: 'polygon(46% 38%, 100% 34%, 84% 74%, 58% 78%)' }} />
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(255,255,255,0.05)', clipPath: 'polygon(58% 78%, 84% 74%, 100% 100%, 42% 100%)' }} />
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(0,0,0,0.06)', clipPath: 'polygon(84% 74%, 100% 34%, 100% 100%)' }} />
          </div>
          <div style={{ position: 'absolute', inset: '0', background: 'repeating-linear-gradient(114deg, rgba(31,27,22,0.055) 0 1px, transparent 1px 5px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: '-60%', background: 'linear-gradient(105deg, transparent 42%, rgba(255,255,255,0.8) 50%, transparent 58%)', animation: 'bnSheen 7s ease-in-out infinite 0s' }} />
          <div style={{ position: 'relative', height: '100%', padding: 'clamp(14px, 1.7vw, 21px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: '#1F1B16' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <div style={{ fontFamily: '\'Source Serif 4\', Georgia, serif', fontSize: 'clamp(14px, 1.55vw, 19px)', lineHeight: '1', letterSpacing: '0.01em' }}>
                  Harborlight
                </div>
                <div style={{ fontFamily: '\'JetBrains Mono\', monospace', fontSize: 'clamp(8px, 0.82vw, 10px)', letterSpacing: '0.17em', textTransform: 'uppercase', color: '#6E6255', marginTop: '5px' }}>
                  Hạng chuẩn
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ opacity: '.62', flexShrink: '0' }}>
                <path d="M5.5 8.5a9 9 0 0 1 0 7" />
                <path d="M10 5.5a14 14 0 0 1 0 13" />
                <path d="M14.5 2.8a19 19 0 0 1 0 18.4" />
              </svg>
            </div>
            <div>
              <div style={{ marginBottom: 'clamp(9px, 1.1vw, 14px)' }}>
                <div style={{ position: 'relative', width: 'clamp(32px, 3.2vw, 44px)', height: 'clamp(25px, 2.4vw, 33px)', borderRadius: '5px', background: 'linear-gradient(135deg, #E4D6AE 0%, #B49B5C 55%, #D8C48E 100%)', boxShadow: '0 1px 2px rgba(0,0,0,0.3), inset 0 0 0 0.5px rgba(255,255,255,0.4)', overflow: 'hidden', flexShrink: '0' }}>
                  <div style={{ position: 'absolute', left: '26%', top: '0', bottom: '0', width: '1px', background: 'rgba(90,70,25,0.5)' }} />
                  <div style={{ position: 'absolute', left: '68%', top: '0', bottom: '0', width: '1px', background: 'rgba(90,70,25,0.5)' }} />
                  <div style={{ position: 'absolute', left: '26%', right: '0', top: '33%', height: '1px', background: 'rgba(90,70,25,0.5)' }} />
                  <div style={{ position: 'absolute', left: '26%', right: '0', top: '66%', height: '1px', background: 'rgba(90,70,25,0.5)' }} />
                  <div style={{ position: 'absolute', left: '6%', top: '34%', width: '14%', height: '32%', borderRadius: '1px', background: 'rgba(90,70,25,0.5)', opacity: '.55' }} />
                </div>
              </div>
              <div style={{ fontFamily: '\'JetBrains Mono\', monospace', fontSize: 'clamp(13px, 1.42vw, 18px)', letterSpacing: '0.06em', display: 'flex', gap: 'clamp(8px, 0.95vw, 13px)', color: '#F6F2E8', textShadow: '0 1px 0 rgba(60,48,28,0.55), 0 -0.5px 0 rgba(255,255,255,0.9)' }}>
                <span>
                  4•2•
                </span>
                <span>
                  ••••
                </span>
                <span>
                  ••••
                </span>
                <span>
                  4•2•
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'clamp(12px, 1.6vw, 22px)', marginTop: 'clamp(6px, 0.8vw, 11px)', fontFamily: '\'JetBrains Mono\', monospace', fontSize: 'clamp(8px, 0.82vw, 10px)', letterSpacing: '0.13em', textTransform: 'uppercase', color: '#6E6255' }}>
                <span style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                  <span style={{ opacity: '.72' }}>
                    Valid thru
                  </span>
                  <span style={{ fontSize: '7px' }}>
                    ▶
                  </span>
                  <span>
                    09/31
                  </span>
                </span>
                <span>
                  Nguyen Van A
                </span>
              </div>
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', inset: '0', borderRadius: '17px', overflow: 'hidden', background: 'linear-gradient(138deg, #2C2620 0%, #14110D 46%, #201B15 74%, #0E0C09 100%)', boxShadow: '0 24px 42px -24px rgba(52,38,20,0.5), inset 0 0 0 0.5px rgba(255,255,255,0.3)' }}>
          <div style={{ position: 'absolute', inset: '0', opacity: '0.5', pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(255,255,255,0.10)', clipPath: 'polygon(0% 0%, 42% 0%, 14% 46%)' }} />
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(0,0,0,0.07)', clipPath: 'polygon(42% 0%, 78% 0%, 46% 38%)' }} />
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(255,255,255,0.07)', clipPath: 'polygon(78% 0%, 100% 0%, 100% 34%, 62% 22%)' }} />
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(0,0,0,0.06)', clipPath: 'polygon(0% 46%, 14% 46%, 30% 100%, 0% 100%)' }} />
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(255,255,255,0.06)', clipPath: 'polygon(14% 46%, 46% 38%, 58% 78%, 30% 100%)' }} />
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(0,0,0,0.05)', clipPath: 'polygon(46% 38%, 100% 34%, 84% 74%, 58% 78%)' }} />
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(255,255,255,0.05)', clipPath: 'polygon(58% 78%, 84% 74%, 100% 100%, 42% 100%)' }} />
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(0,0,0,0.06)', clipPath: 'polygon(84% 74%, 100% 34%, 100% 100%)' }} />
          </div>
          <div style={{ position: 'absolute', inset: '0', background: 'repeating-linear-gradient(114deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 5px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: '-60%', background: 'linear-gradient(105deg, transparent 42%, rgba(255,236,205,0.3) 50%, transparent 58%)', animation: 'bnSheen 7s ease-in-out infinite -2.4s' }} />
          <div style={{ position: 'relative', height: '100%', padding: 'clamp(14px, 1.7vw, 21px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: '#F2EEE6' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <div style={{ fontFamily: '\'Source Serif 4\', Georgia, serif', fontSize: 'clamp(14px, 1.55vw, 19px)', lineHeight: '1', letterSpacing: '0.01em' }}>
                  Newfield
                </div>
                <div style={{ fontFamily: '\'JetBrains Mono\', monospace', fontSize: 'clamp(8px, 0.82vw, 10px)', letterSpacing: '0.17em', textTransform: 'uppercase', color: '#8F857A', marginTop: '5px' }}>
                  Hạng vàng
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ opacity: '.62', flexShrink: '0' }}>
                <path d="M5.5 8.5a9 9 0 0 1 0 7" />
                <path d="M10 5.5a14 14 0 0 1 0 13" />
                <path d="M14.5 2.8a19 19 0 0 1 0 18.4" />
              </svg>
            </div>
            <div>
              <div style={{ marginBottom: 'clamp(9px, 1.1vw, 14px)' }}>
                <div style={{ position: 'relative', width: 'clamp(32px, 3.2vw, 44px)', height: 'clamp(25px, 2.4vw, 33px)', borderRadius: '5px', background: 'linear-gradient(135deg, #DCDCDC 0%, #9A9A9A 52%, #C9C9C9 100%)', boxShadow: '0 1px 2px rgba(0,0,0,0.3), inset 0 0 0 0.5px rgba(255,255,255,0.4)', overflow: 'hidden', flexShrink: '0' }}>
                  <div style={{ position: 'absolute', left: '26%', top: '0', bottom: '0', width: '1px', background: 'rgba(0,0,0,0.45)' }} />
                  <div style={{ position: 'absolute', left: '68%', top: '0', bottom: '0', width: '1px', background: 'rgba(0,0,0,0.45)' }} />
                  <div style={{ position: 'absolute', left: '26%', right: '0', top: '33%', height: '1px', background: 'rgba(0,0,0,0.45)' }} />
                  <div style={{ position: 'absolute', left: '26%', right: '0', top: '66%', height: '1px', background: 'rgba(0,0,0,0.45)' }} />
                  <div style={{ position: 'absolute', left: '6%', top: '34%', width: '14%', height: '32%', borderRadius: '1px', background: 'rgba(0,0,0,0.45)', opacity: '.55' }} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(11px, 1.4vw, 18px)' }}>
                <div style={{ position: 'relative', width: 'clamp(34px, 3.6vw, 48px)', height: 'clamp(34px, 3.6vw, 48px)', flexShrink: '0' }}>
                  <div style={{ position: 'absolute', inset: '0', background: 'linear-gradient(150deg, #FBF4E2, #C9B27C)', clipPath: 'polygon(50% 0%, 82% 30%, 50% 100%, 18% 30%)' }} />
                  <div style={{ position: 'absolute', inset: '0', background: 'linear-gradient(150deg, #FFFDF6, #E4D3A6)', clipPath: 'polygon(50% 0%, 82% 30%, 50% 42%)' }} />
                  <div style={{ position: 'absolute', inset: '0', background: 'linear-gradient(150deg, #A88F55, #6E5B32)', clipPath: 'polygon(18% 30%, 50% 42%, 50% 100%)' }} />
                </div>
                <div style={{ fontFamily: '\'JetBrains Mono\', monospace', fontSize: 'clamp(13px, 1.4vw, 17px)', letterSpacing: '0.2em', color: '#F2EEE6' }}>
                  •••• 9181
                </div>
              </div>
              <div style={{ fontFamily: '\'JetBrains Mono\', monospace', fontSize: 'clamp(8px, 0.82vw, 10px)', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8F857A', marginTop: '7px', display: 'flex', gap: '12px' }}>
                <span>
                  Nguyen Van A
                </span>
              </div>
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', inset: '0', borderRadius: '17px', overflow: 'hidden', background: 'linear-gradient(138deg, #D89B4E 0%, #8A5320 42%, #C4823C 70%, #7A4718 100%)', boxShadow: '0 24px 42px -24px rgba(52,38,20,0.5), inset 0 0 0 0.5px rgba(255,255,255,0.3)' }}>
          <div style={{ position: 'absolute', inset: '0', opacity: '0.75', pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(255,255,255,0.10)', clipPath: 'polygon(0% 0%, 42% 0%, 14% 46%)' }} />
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(0,0,0,0.07)', clipPath: 'polygon(42% 0%, 78% 0%, 46% 38%)' }} />
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(255,255,255,0.07)', clipPath: 'polygon(78% 0%, 100% 0%, 100% 34%, 62% 22%)' }} />
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(0,0,0,0.06)', clipPath: 'polygon(0% 46%, 14% 46%, 30% 100%, 0% 100%)' }} />
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(255,255,255,0.06)', clipPath: 'polygon(14% 46%, 46% 38%, 58% 78%, 30% 100%)' }} />
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(0,0,0,0.05)', clipPath: 'polygon(46% 38%, 100% 34%, 84% 74%, 58% 78%)' }} />
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(255,255,255,0.05)', clipPath: 'polygon(58% 78%, 84% 74%, 100% 100%, 42% 100%)' }} />
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(0,0,0,0.06)', clipPath: 'polygon(84% 74%, 100% 34%, 100% 100%)' }} />
          </div>
          <div style={{ position: 'absolute', inset: '0', background: 'repeating-linear-gradient(114deg, rgba(255,255,255,0.09) 0 1px, transparent 1px 5px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: '-60%', background: 'linear-gradient(105deg, transparent 42%, rgba(255,245,225,0.45) 50%, transparent 58%)', animation: 'bnSheen 7s ease-in-out infinite -4.8s' }} />
          <div style={{ position: 'relative', height: '100%', padding: 'clamp(14px, 1.7vw, 21px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: '#FFF7E9' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <div style={{ fontFamily: '\'Source Serif 4\', Georgia, serif', fontSize: 'clamp(14px, 1.55vw, 19px)', lineHeight: '1', letterSpacing: '0.01em' }}>
                  Brightpeak
                </div>
                <div style={{ fontFamily: '\'JetBrains Mono\', monospace', fontSize: 'clamp(8px, 0.82vw, 10px)', letterSpacing: '0.17em', textTransform: 'uppercase', color: 'rgba(255,247,233,0.66)', marginTop: '5px' }}>
                  Hoàn tiền
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ opacity: '.62', flexShrink: '0' }}>
                <path d="M5.5 8.5a9 9 0 0 1 0 7" />
                <path d="M10 5.5a14 14 0 0 1 0 13" />
                <path d="M14.5 2.8a19 19 0 0 1 0 18.4" />
              </svg>
            </div>
            <div>
              <div style={{ marginBottom: 'clamp(9px, 1.1vw, 14px)' }}>
                <div style={{ position: 'relative', width: 'clamp(32px, 3.2vw, 44px)', height: 'clamp(25px, 2.4vw, 33px)', borderRadius: '5px', background: 'linear-gradient(135deg, #FBEBC6 0%, #CFA55E 54%, #EBD49C 100%)', boxShadow: '0 1px 2px rgba(0,0,0,0.3), inset 0 0 0 0.5px rgba(255,255,255,0.4)', overflow: 'hidden', flexShrink: '0' }}>
                  <div style={{ position: 'absolute', left: '26%', top: '0', bottom: '0', width: '1px', background: 'rgba(95,60,15,0.5)' }} />
                  <div style={{ position: 'absolute', left: '68%', top: '0', bottom: '0', width: '1px', background: 'rgba(95,60,15,0.5)' }} />
                  <div style={{ position: 'absolute', left: '26%', right: '0', top: '33%', height: '1px', background: 'rgba(95,60,15,0.5)' }} />
                  <div style={{ position: 'absolute', left: '26%', right: '0', top: '66%', height: '1px', background: 'rgba(95,60,15,0.5)' }} />
                  <div style={{ position: 'absolute', left: '6%', top: '34%', width: '14%', height: '32%', borderRadius: '1px', background: 'rgba(95,60,15,0.5)', opacity: '.55' }} />
                </div>
              </div>
              <div style={{ fontFamily: '\'Source Serif 4\', Georgia, serif', fontSize: 'clamp(18px, 2.1vw, 27px)', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,247,233,0.92)', textShadow: '0 1px 0 rgba(88,45,10,0.6), 0 -0.5px 0 rgba(255,255,255,0.5)' }}>
                Brightpeak
              </div>
              <div style={{ fontFamily: '\'JetBrains Mono\', monospace', fontSize: 'clamp(8px, 0.82vw, 10px)', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,247,233,0.66)', marginTop: '7px', display: 'flex', gap: '12px' }}>
                <span>
                  Nguyen Van A
                </span>
              </div>
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', inset: '0', borderRadius: '17px', overflow: 'hidden', background: 'linear-gradient(138deg, #FDF2DE 0%, #E6CDA3 46%, #F9E8CC 72%, #DCC094 100%)', boxShadow: '0 24px 42px -24px rgba(52,38,20,0.5), inset 0 0 0 0.5px rgba(255,255,255,0.3)' }}>
          <div style={{ position: 'absolute', inset: '0', opacity: '0.9', pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(255,255,255,0.10)', clipPath: 'polygon(0% 0%, 42% 0%, 14% 46%)' }} />
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(0,0,0,0.07)', clipPath: 'polygon(42% 0%, 78% 0%, 46% 38%)' }} />
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(255,255,255,0.07)', clipPath: 'polygon(78% 0%, 100% 0%, 100% 34%, 62% 22%)' }} />
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(0,0,0,0.06)', clipPath: 'polygon(0% 46%, 14% 46%, 30% 100%, 0% 100%)' }} />
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(255,255,255,0.06)', clipPath: 'polygon(14% 46%, 46% 38%, 58% 78%, 30% 100%)' }} />
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(0,0,0,0.05)', clipPath: 'polygon(46% 38%, 100% 34%, 84% 74%, 58% 78%)' }} />
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(255,255,255,0.05)', clipPath: 'polygon(58% 78%, 84% 74%, 100% 100%, 42% 100%)' }} />
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(0,0,0,0.06)', clipPath: 'polygon(84% 74%, 100% 34%, 100% 100%)' }} />
          </div>
          <div style={{ position: 'absolute', inset: '0', background: 'repeating-linear-gradient(114deg, rgba(58,46,30,0.05) 0 1px, transparent 1px 5px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: '-60%', background: 'linear-gradient(105deg, transparent 42%, rgba(255,255,255,0.85) 50%, transparent 58%)', animation: 'bnSheen 7s ease-in-out infinite -1.2s' }} />
          <div style={{ position: 'relative', height: '100%', padding: 'clamp(14px, 1.7vw, 21px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: '#3A2E1E' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <div style={{ fontFamily: '\'Source Serif 4\', Georgia, serif', fontSize: 'clamp(14px, 1.55vw, 19px)', lineHeight: '1', letterSpacing: '0.01em' }}>
                  Richwood
                </div>
                <div style={{ fontFamily: '\'JetBrains Mono\', monospace', fontSize: 'clamp(8px, 0.82vw, 10px)', letterSpacing: '0.17em', textTransform: 'uppercase', color: '#8A7355', marginTop: '5px' }}>
                  Tích dặm
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ opacity: '.62', flexShrink: '0' }}>
                <path d="M5.5 8.5a9 9 0 0 1 0 7" />
                <path d="M10 5.5a14 14 0 0 1 0 13" />
                <path d="M14.5 2.8a19 19 0 0 1 0 18.4" />
              </svg>
            </div>
            <div>
              <div style={{ marginBottom: 'clamp(9px, 1.1vw, 14px)' }}>
                <div style={{ position: 'relative', width: 'clamp(32px, 3.2vw, 44px)', height: 'clamp(25px, 2.4vw, 33px)', borderRadius: '5px', background: 'linear-gradient(135deg, #EFD9A6 0%, #BE9C58 55%, #E0C68C 100%)', boxShadow: '0 1px 2px rgba(0,0,0,0.3), inset 0 0 0 0.5px rgba(255,255,255,0.4)', overflow: 'hidden', flexShrink: '0' }}>
                  <div style={{ position: 'absolute', left: '26%', top: '0', bottom: '0', width: '1px', background: 'rgba(90,70,25,0.45)' }} />
                  <div style={{ position: 'absolute', left: '68%', top: '0', bottom: '0', width: '1px', background: 'rgba(90,70,25,0.45)' }} />
                  <div style={{ position: 'absolute', left: '26%', right: '0', top: '33%', height: '1px', background: 'rgba(90,70,25,0.45)' }} />
                  <div style={{ position: 'absolute', left: '26%', right: '0', top: '66%', height: '1px', background: 'rgba(90,70,25,0.45)' }} />
                  <div style={{ position: 'absolute', left: '6%', top: '34%', width: '14%', height: '32%', borderRadius: '1px', background: 'rgba(90,70,25,0.45)', opacity: '.55' }} />
                </div>
              </div>
              <div style={{ fontFamily: '\'JetBrains Mono\', monospace', fontSize: 'clamp(13px, 1.42vw, 18px)', letterSpacing: '0.06em', display: 'flex', gap: 'clamp(8px, 0.95vw, 13px)', color: '#FFFBF2', textShadow: '0 1px 0 rgba(96,72,40,0.5), 0 -0.5px 0 rgba(255,255,255,0.85)' }}>
                <span>
                  6•3•
                </span>
                <span>
                  ••••
                </span>
                <span>
                  ••••
                </span>
                <span>
                  6•3•
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'clamp(12px, 1.6vw, 22px)', marginTop: 'clamp(6px, 0.8vw, 11px)', fontFamily: '\'JetBrains Mono\', monospace', fontSize: 'clamp(8px, 0.82vw, 10px)', letterSpacing: '0.13em', textTransform: 'uppercase', color: '#8A7355' }}>
                <span style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                  <span style={{ opacity: '.72' }}>
                    Valid thru
                  </span>
                  <span style={{ fontSize: '7px' }}>
                    ▶
                  </span>
                  <span>
                    04/32
                  </span>
                </span>
                <span>
                  Nguyen Van A
                </span>
              </div>
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', inset: '0', borderRadius: '17px', overflow: 'hidden', background: 'linear-gradient(138deg, #4E3A26 0%, #2A1D11 48%, #3F2D1B 76%, #1C1309 100%)', boxShadow: '0 24px 42px -24px rgba(52,38,20,0.5), inset 0 0 0 0.5px rgba(255,255,255,0.3)' }}>
          <div style={{ position: 'absolute', inset: '0', opacity: '0.55', pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(255,255,255,0.10)', clipPath: 'polygon(0% 0%, 42% 0%, 14% 46%)' }} />
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(0,0,0,0.07)', clipPath: 'polygon(42% 0%, 78% 0%, 46% 38%)' }} />
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(255,255,255,0.07)', clipPath: 'polygon(78% 0%, 100% 0%, 100% 34%, 62% 22%)' }} />
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(0,0,0,0.06)', clipPath: 'polygon(0% 46%, 14% 46%, 30% 100%, 0% 100%)' }} />
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(255,255,255,0.06)', clipPath: 'polygon(14% 46%, 46% 38%, 58% 78%, 30% 100%)' }} />
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(0,0,0,0.05)', clipPath: 'polygon(46% 38%, 100% 34%, 84% 74%, 58% 78%)' }} />
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(255,255,255,0.05)', clipPath: 'polygon(58% 78%, 84% 74%, 100% 100%, 42% 100%)' }} />
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(0,0,0,0.06)', clipPath: 'polygon(84% 74%, 100% 34%, 100% 100%)' }} />
          </div>
          <div style={{ position: 'absolute', inset: '0', background: 'repeating-linear-gradient(114deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 5px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: '-60%', background: 'linear-gradient(105deg, transparent 42%, rgba(255,240,214,0.3) 50%, transparent 58%)', animation: 'bnSheen 7s ease-in-out infinite -3.6s' }} />
          <div style={{ position: 'relative', height: '100%', padding: 'clamp(14px, 1.7vw, 21px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: '#F4E9D8' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <div style={{ fontFamily: '\'Source Serif 4\', Georgia, serif', fontSize: 'clamp(14px, 1.55vw, 19px)', lineHeight: '1', letterSpacing: '0.01em' }}>
                  Stonehaven
                </div>
                <div style={{ fontFamily: '\'JetBrains Mono\', monospace', fontSize: 'clamp(8px, 0.82vw, 10px)', letterSpacing: '0.17em', textTransform: 'uppercase', color: 'rgba(244,233,216,0.6)', marginTop: '5px' }}>
                  Du lịch
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ opacity: '.62', flexShrink: '0' }}>
                <path d="M5.5 8.5a9 9 0 0 1 0 7" />
                <path d="M10 5.5a14 14 0 0 1 0 13" />
                <path d="M14.5 2.8a19 19 0 0 1 0 18.4" />
              </svg>
            </div>
            <div>
              <div style={{ marginBottom: 'clamp(9px, 1.1vw, 14px)' }}>
                <div style={{ position: 'relative', width: 'clamp(32px, 3.2vw, 44px)', height: 'clamp(25px, 2.4vw, 33px)', borderRadius: '5px', background: 'linear-gradient(135deg, #F0E2B8 0%, #C0A05C 54%, #E2CE9A 100%)', boxShadow: '0 1px 2px rgba(0,0,0,0.3), inset 0 0 0 0.5px rgba(255,255,255,0.4)', overflow: 'hidden', flexShrink: '0' }}>
                  <div style={{ position: 'absolute', left: '26%', top: '0', bottom: '0', width: '1px', background: 'rgba(48,32,14,0.5)' }} />
                  <div style={{ position: 'absolute', left: '68%', top: '0', bottom: '0', width: '1px', background: 'rgba(48,32,14,0.5)' }} />
                  <div style={{ position: 'absolute', left: '26%', right: '0', top: '33%', height: '1px', background: 'rgba(48,32,14,0.5)' }} />
                  <div style={{ position: 'absolute', left: '26%', right: '0', top: '66%', height: '1px', background: 'rgba(48,32,14,0.5)' }} />
                  <div style={{ position: 'absolute', left: '6%', top: '34%', width: '14%', height: '32%', borderRadius: '1px', background: 'rgba(48,32,14,0.5)', opacity: '.55' }} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(11px, 1.4vw, 18px)' }}>
                <div style={{ position: 'relative', width: 'clamp(34px, 3.6vw, 48px)', height: 'clamp(34px, 3.6vw, 48px)', flexShrink: '0' }}>
                  <div style={{ position: 'absolute', inset: '0', background: 'linear-gradient(150deg, #FBEFD8, #D3B584)', clipPath: 'polygon(50% 0%, 82% 30%, 50% 100%, 18% 30%)' }} />
                  <div style={{ position: 'absolute', inset: '0', background: 'linear-gradient(150deg, #FFFDF6, #EBD9B4)', clipPath: 'polygon(50% 0%, 82% 30%, 50% 42%)' }} />
                  <div style={{ position: 'absolute', inset: '0', background: 'linear-gradient(150deg, #9C7F4E, #63492A)', clipPath: 'polygon(18% 30%, 50% 42%, 50% 100%)' }} />
                </div>
                <div style={{ fontFamily: '\'JetBrains Mono\', monospace', fontSize: 'clamp(13px, 1.4vw, 17px)', letterSpacing: '0.2em', color: '#F4E9D8' }}>
                  •••• 4470
                </div>
              </div>
              <div style={{ fontFamily: '\'JetBrains Mono\', monospace', fontSize: 'clamp(8px, 0.82vw, 10px)', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(244,233,216,0.6)', marginTop: '7px', display: 'flex', gap: '12px' }}>
                <span>
                  Nguyen Van A
                </span>
              </div>
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', inset: '0', borderRadius: '17px', overflow: 'hidden', background: 'linear-gradient(138deg, #8F8474 0%, #5C5348 46%, #7A7062 74%, #443D34 100%)', boxShadow: '0 24px 42px -24px rgba(52,38,20,0.5), inset 0 0 0 0.5px rgba(255,255,255,0.3)' }}>
          <div style={{ position: 'absolute', inset: '0', opacity: '0.45', pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(255,255,255,0.10)', clipPath: 'polygon(0% 0%, 42% 0%, 14% 46%)' }} />
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(0,0,0,0.07)', clipPath: 'polygon(42% 0%, 78% 0%, 46% 38%)' }} />
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(255,255,255,0.07)', clipPath: 'polygon(78% 0%, 100% 0%, 100% 34%, 62% 22%)' }} />
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(0,0,0,0.06)', clipPath: 'polygon(0% 46%, 14% 46%, 30% 100%, 0% 100%)' }} />
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(255,255,255,0.06)', clipPath: 'polygon(14% 46%, 46% 38%, 58% 78%, 30% 100%)' }} />
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(0,0,0,0.05)', clipPath: 'polygon(46% 38%, 100% 34%, 84% 74%, 58% 78%)' }} />
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(255,255,255,0.05)', clipPath: 'polygon(58% 78%, 84% 74%, 100% 100%, 42% 100%)' }} />
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(0,0,0,0.06)', clipPath: 'polygon(84% 74%, 100% 34%, 100% 100%)' }} />
          </div>
          <div style={{ position: 'absolute', inset: '0', background: 'repeating-linear-gradient(114deg, rgba(255,255,255,0.07) 0 1px, transparent 1px 5px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: '-60%', background: 'linear-gradient(105deg, transparent 42%, rgba(255,250,240,0.34) 50%, transparent 58%)', animation: 'bnSheen 7s ease-in-out infinite -6s' }} />
          <div style={{ position: 'relative', height: '100%', padding: 'clamp(14px, 1.7vw, 21px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: '#F5F1E8' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <div style={{ fontFamily: '\'Source Serif 4\', Georgia, serif', fontSize: 'clamp(14px, 1.55vw, 19px)', lineHeight: '1', letterSpacing: '0.01em' }}>
                  Longridge
                </div>
                <div style={{ fontFamily: '\'JetBrains Mono\', monospace', fontSize: 'clamp(8px, 0.82vw, 10px)', letterSpacing: '0.17em', textTransform: 'uppercase', color: 'rgba(245,241,232,0.62)', marginTop: '5px' }}>
                  Trực tuyến
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ opacity: '.62', flexShrink: '0' }}>
                <path d="M5.5 8.5a9 9 0 0 1 0 7" />
                <path d="M10 5.5a14 14 0 0 1 0 13" />
                <path d="M14.5 2.8a19 19 0 0 1 0 18.4" />
              </svg>
            </div>
            <div>
              <div style={{ marginBottom: 'clamp(9px, 1.1vw, 14px)' }}>
                <div style={{ position: 'relative', width: 'clamp(32px, 3.2vw, 44px)', height: 'clamp(25px, 2.4vw, 33px)', borderRadius: '5px', background: 'linear-gradient(135deg, #E8E2D2 0%, #A79C86 52%, #D2CAB6 100%)', boxShadow: '0 1px 2px rgba(0,0,0,0.3), inset 0 0 0 0.5px rgba(255,255,255,0.4)', overflow: 'hidden', flexShrink: '0' }}>
                  <div style={{ position: 'absolute', left: '26%', top: '0', bottom: '0', width: '1px', background: 'rgba(30,26,20,0.45)' }} />
                  <div style={{ position: 'absolute', left: '68%', top: '0', bottom: '0', width: '1px', background: 'rgba(30,26,20,0.45)' }} />
                  <div style={{ position: 'absolute', left: '26%', right: '0', top: '33%', height: '1px', background: 'rgba(30,26,20,0.45)' }} />
                  <div style={{ position: 'absolute', left: '26%', right: '0', top: '66%', height: '1px', background: 'rgba(30,26,20,0.45)' }} />
                  <div style={{ position: 'absolute', left: '6%', top: '34%', width: '14%', height: '32%', borderRadius: '1px', background: 'rgba(30,26,20,0.45)', opacity: '.55' }} />
                </div>
              </div>
              <div style={{ fontFamily: '\'JetBrains Mono\', monospace', fontSize: 'clamp(13px, 1.42vw, 18px)', letterSpacing: '0.06em', display: 'flex', gap: 'clamp(8px, 0.95vw, 13px)', color: '#FBF7EE', textShadow: '0 1px 0 rgba(38,32,24,0.55), 0 -0.5px 0 rgba(255,255,255,0.42)' }}>
                <span>
                  2•7•
                </span>
                <span>
                  ••••
                </span>
                <span>
                  ••••
                </span>
                <span>
                  2•7•
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'clamp(12px, 1.6vw, 22px)', marginTop: 'clamp(6px, 0.8vw, 11px)', fontFamily: '\'JetBrains Mono\', monospace', fontSize: 'clamp(8px, 0.82vw, 10px)', letterSpacing: '0.13em', textTransform: 'uppercase', color: 'rgba(245,241,232,0.62)' }}>
                <span style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                  <span style={{ opacity: '.72' }}>
                    Valid thru
                  </span>
                  <span style={{ fontSize: '7px' }}>
                    ▶
                  </span>
                  <span>
                    11/30
                  </span>
                </span>
                <span>
                  Nguyen Van A
                </span>
              </div>
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', inset: '0', borderRadius: '17px', overflow: 'hidden', background: 'linear-gradient(138deg, #C96A48 0%, #8E3A22 44%, #B8553A 72%, #7A2E18 100%)', boxShadow: '0 24px 42px -24px rgba(52,38,20,0.5), inset 0 0 0 0.5px rgba(255,255,255,0.3)' }}>
          <div style={{ position: 'absolute', inset: '0', opacity: '0.8', pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(255,255,255,0.10)', clipPath: 'polygon(0% 0%, 42% 0%, 14% 46%)' }} />
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(0,0,0,0.07)', clipPath: 'polygon(42% 0%, 78% 0%, 46% 38%)' }} />
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(255,255,255,0.07)', clipPath: 'polygon(78% 0%, 100% 0%, 100% 34%, 62% 22%)' }} />
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(0,0,0,0.06)', clipPath: 'polygon(0% 46%, 14% 46%, 30% 100%, 0% 100%)' }} />
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(255,255,255,0.06)', clipPath: 'polygon(14% 46%, 46% 38%, 58% 78%, 30% 100%)' }} />
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(0,0,0,0.05)', clipPath: 'polygon(46% 38%, 100% 34%, 84% 74%, 58% 78%)' }} />
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(255,255,255,0.05)', clipPath: 'polygon(58% 78%, 84% 74%, 100% 100%, 42% 100%)' }} />
            <div style={{ position: 'absolute', inset: '0', background: 'rgba(0,0,0,0.06)', clipPath: 'polygon(84% 74%, 100% 34%, 100% 100%)' }} />
          </div>
          <div style={{ position: 'absolute', inset: '0', background: 'repeating-linear-gradient(114deg, rgba(255,255,255,0.08) 0 1px, transparent 1px 5px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: '-60%', background: 'linear-gradient(105deg, transparent 42%, rgba(255,236,224,0.4) 50%, transparent 58%)', animation: 'bnSheen 7s ease-in-out infinite -1.8s' }} />
          <div style={{ position: 'relative', height: '100%', padding: 'clamp(14px, 1.7vw, 21px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: '#FFF1EA' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <div style={{ fontFamily: '\'Source Serif 4\', Georgia, serif', fontSize: 'clamp(14px, 1.55vw, 19px)', lineHeight: '1', letterSpacing: '0.01em' }}>
                  Eastwind
                </div>
                <div style={{ fontFamily: '\'JetBrains Mono\', monospace', fontSize: 'clamp(8px, 0.82vw, 10px)', letterSpacing: '0.17em', textTransform: 'uppercase', color: 'rgba(255,241,234,0.66)', marginTop: '5px' }}>
                  Siêu thị
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ opacity: '.62', flexShrink: '0' }}>
                <path d="M5.5 8.5a9 9 0 0 1 0 7" />
                <path d="M10 5.5a14 14 0 0 1 0 13" />
                <path d="M14.5 2.8a19 19 0 0 1 0 18.4" />
              </svg>
            </div>
            <div>
              <div style={{ marginBottom: 'clamp(9px, 1.1vw, 14px)' }}>
                <div style={{ position: 'relative', width: 'clamp(32px, 3.2vw, 44px)', height: 'clamp(25px, 2.4vw, 33px)', borderRadius: '5px', background: 'linear-gradient(135deg, #F7DFC2 0%, #C99A66 54%, #E8C9A4 100%)', boxShadow: '0 1px 2px rgba(0,0,0,0.3), inset 0 0 0 0.5px rgba(255,255,255,0.4)', overflow: 'hidden', flexShrink: '0' }}>
                  <div style={{ position: 'absolute', left: '26%', top: '0', bottom: '0', width: '1px', background: 'rgba(90,30,10,0.5)' }} />
                  <div style={{ position: 'absolute', left: '68%', top: '0', bottom: '0', width: '1px', background: 'rgba(90,30,10,0.5)' }} />
                  <div style={{ position: 'absolute', left: '26%', right: '0', top: '33%', height: '1px', background: 'rgba(90,30,10,0.5)' }} />
                  <div style={{ position: 'absolute', left: '26%', right: '0', top: '66%', height: '1px', background: 'rgba(90,30,10,0.5)' }} />
                  <div style={{ position: 'absolute', left: '6%', top: '34%', width: '14%', height: '32%', borderRadius: '1px', background: 'rgba(90,30,10,0.5)', opacity: '.55' }} />
                </div>
              </div>
              <div style={{ fontFamily: '\'Source Serif 4\', Georgia, serif', fontSize: 'clamp(18px, 2.1vw, 27px)', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,241,234,0.92)', textShadow: '0 1px 0 rgba(90,28,12,0.6), 0 -0.5px 0 rgba(255,255,255,0.45)' }}>
                Eastwind
              </div>
              <div style={{ fontFamily: '\'JetBrains Mono\', monospace', fontSize: 'clamp(8px, 0.82vw, 10px)', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,241,234,0.66)', marginTop: '7px', display: 'flex', gap: '12px' }}>
                <span>
                  Nguyen Van A
                </span>
              </div>
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', inset: '0', borderRadius: '17px', overflow: 'hidden', background: 'linear-gradient(138deg, #FCFAF5 0%, #E7E1D6 48%, #F7F3EA 76%, #DAD2C4 100%)', boxShadow: '0 24px 42px -24px rgba(52,38,20,0.5), inset 0 0 0 0.5px rgba(255,255,255,0.3)' }}>
          <div style={{ position: 'absolute', inset: '0', background: 'repeating-linear-gradient(114deg, rgba(35,31,26,0.045) 0 1px, transparent 1px 5px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: '-60%', background: 'linear-gradient(105deg, transparent 42%, rgba(255,255,255,0.75) 50%, transparent 58%)', animation: 'bnSheen 7s ease-in-out infinite -5.4s' }} />
          <div style={{ position: 'relative', height: '100%', padding: 'clamp(14px, 1.7vw, 21px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: '#231F1A' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <div style={{ fontFamily: '\'Source Serif 4\', Georgia, serif', fontSize: 'clamp(14px, 1.55vw, 19px)', lineHeight: '1', letterSpacing: '0.01em' }}>
                  Anchorline
                </div>
                <div style={{ fontFamily: '\'JetBrains Mono\', monospace', fontSize: 'clamp(8px, 0.82vw, 10px)', letterSpacing: '0.17em', textTransform: 'uppercase', color: '#7A7168', marginTop: '5px' }}>
                  Doanh nghiệp
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ opacity: '.62', flexShrink: '0' }}>
                <path d="M5.5 8.5a9 9 0 0 1 0 7" />
                <path d="M10 5.5a14 14 0 0 1 0 13" />
                <path d="M14.5 2.8a19 19 0 0 1 0 18.4" />
              </svg>
            </div>
            <div>
              <div style={{ marginBottom: 'clamp(9px, 1.1vw, 14px)' }}>
                <div style={{ position: 'relative', width: 'clamp(32px, 3.2vw, 44px)', height: 'clamp(25px, 2.4vw, 33px)', borderRadius: '5px', background: 'linear-gradient(135deg, #E6DFCC 0%, #AEA48C 52%, #D5CDB8 100%)', boxShadow: '0 1px 2px rgba(0,0,0,0.3), inset 0 0 0 0.5px rgba(255,255,255,0.4)', overflow: 'hidden', flexShrink: '0' }}>
                  <div style={{ position: 'absolute', left: '26%', top: '0', bottom: '0', width: '1px', background: 'rgba(0,0,0,0.32)' }} />
                  <div style={{ position: 'absolute', left: '68%', top: '0', bottom: '0', width: '1px', background: 'rgba(0,0,0,0.32)' }} />
                  <div style={{ position: 'absolute', left: '26%', right: '0', top: '33%', height: '1px', background: 'rgba(0,0,0,0.32)' }} />
                  <div style={{ position: 'absolute', left: '26%', right: '0', top: '66%', height: '1px', background: 'rgba(0,0,0,0.32)' }} />
                  <div style={{ position: 'absolute', left: '6%', top: '34%', width: '14%', height: '32%', borderRadius: '1px', background: 'rgba(0,0,0,0.32)', opacity: '.55' }} />
                </div>
              </div>
              <div style={{ fontFamily: '\'JetBrains Mono\', monospace', fontSize: 'clamp(11px, 1.2vw, 14px)', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#231F1A' }}>
                Doanh nghiệp
              </div>
              <div style={{ fontFamily: '\'JetBrains Mono\', monospace', fontSize: 'clamp(8px, 0.82vw, 10px)', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#7A7168', marginTop: '7px', display: 'flex', gap: '12px' }}>
                <span>
                  Nguyen Van A
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', inset: '-22%', animation: 'bnField 52s ease-in-out infinite', WebkitMaskImage: 'radial-gradient(closest-side at 50% 47%, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.16) 30%, rgba(0,0,0,0.62) 56%, #000 84%)', maskImage: 'radial-gradient(closest-side at 50% 47%, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.16) 30%, rgba(0,0,0,0.62) 56%, #000 84%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 'clamp(46px, 7.2vh, 104px)', pointerEvents: 'none' }}>
        <div data-lane="0,1,2" data-accent="1" style={{ display: 'flex', width: 'max-content', marginLeft: '-4%', animation: 'bnDrift 54s linear infinite' }} />
        <div data-lane="3,4,5" data-accent="-1" style={{ display: 'flex', width: 'max-content', marginLeft: '-19%', animation: 'bnDriftBack 46s linear infinite' }} />
        <div data-lane="6,7,0" data-accent="0" style={{ display: 'flex', width: 'max-content', marginLeft: '-11%', animation: 'bnDrift 62s linear infinite' }} />
      </div>
      <div style={{ position: 'absolute', inset: '0', background: 'radial-gradient(125% 95% at 50% 112%, rgba(251,234,207,0.74) 0%, rgba(245,240,230,0.46) 46%, rgba(239,234,223,0.38) 100%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: '0', background: 'radial-gradient(closest-side at 50% 47%, rgba(250,243,230,0.62) 20%, rgba(250,243,230,0.26) 46%, rgba(244,236,222,0) 78%)', pointerEvents: 'none' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: '1040px', textAlign: 'center' }}>
        <div data-in="fade" data-delay="80" style={{ opacity: '1', transform: 'none', transition: 'opacity .8s ease, transform .8s ease', fontFamily: '\'JetBrains Mono\', monospace', fontSize: '11px', letterSpacing: '0.26em', textTransform: 'uppercase', color: '#7A6F62' }}>
          Bonia
        </div>
        <h1 style={{ fontFamily: '\'Source Serif 4\', Georgia, serif', fontWeight: '400', fontSize: 'clamp(30px, 5.6vw, 74px)', lineHeight: '1.04', letterSpacing: '-0.03em', margin: 'clamp(14px, 2.6vh, 28px) 0 0' }}>
          <span data-in="up" data-delay="220" style={{ opacity: '1', transform: 'none', transition: 'opacity .8s ease, transform .8s ease', display: 'block', paddingBottom: '0.14em', marginBottom: '-0.14em', background: 'linear-gradient(180deg, #2B2419 0%, #70614D 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
            Một chiếc thẻ tín dụng
          </span>
          <span data-in="up" data-delay="420" style={{ opacity: '1', transform: 'none', transition: 'opacity .8s ease, transform .8s ease', display: 'block', fontStyle: 'italic', paddingBottom: '0.14em', marginBottom: '-0.14em', background: 'linear-gradient(180deg, #B8753A 0%, #7B4A2D 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
            nên được mở thế nào?
          </span>
        </h1>
        <div data-in="fade" data-delay="900" style={{ opacity: '1', transform: 'none', transition: 'opacity .8s ease, transform .8s ease', marginTop: 'clamp(22px, 4vh, 46px)', fontFamily: '\'JetBrains Mono\', monospace', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6E6255', animation: 'bnNudge 2.6s ease-in-out infinite' }}>
          Cuộn xuống
        </div>
      </div>
    </section>
  );
}

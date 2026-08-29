// Ported from the Bonia scroll-narrative handoff (Bonia Frames Light.dc.html).
// Markup serialized from the prototype DOM rather than retyped, so the
// measured clamp()/gradient values are exactly the designed ones. Reveal
// behaviour is driven by the data-in / data-fd / data-fl / data-cta
// attributes, which deck.js reads — do not rename them.
// data-fit="scroll": both CTA columns, the store badges and the full site footer do not fit a short phone.
// deck.js enables internal scrolling only when it actually overflows.
export default function Frame07GetStarted() {
  return (
    <section data-fit="scroll" data-f="6" data-screen-label="07 Get started" style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always', position: 'relative', height: '100dvh', overflow: 'hidden', containerType: 'inline-size', display: 'flex', flexDirection: 'column', padding: 'clamp(44px, 7vh, 88px) clamp(18px, 4vw, 56px) clamp(14px, 2.4vh, 28px)', background: 'radial-gradient(125% 95% at 50% -5%, #F9ECD9 0%, #F4EFE4 55%, #ECE6D9 100%)', color: '#1F1B16' }}>
      <div className="bn-audiences" style={{ flex: '1', minHeight: '0', width: '100%', maxWidth: '1240px', margin: '0 auto' }}>
        <div style={{ flex: '1 1 300px', minWidth: '0', display: 'flex', flexDirection: 'column' }}>
          <div data-cta="" data-delay="60" style={{ opacity: '1', transform: 'none', transition: 'opacity .7s ease, transform .8s ease', fontFamily: '\'JetBrains Mono\', monospace', fontSize: 'clamp(10.5px, min(1.15cqw, 2vh), 13px)', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7A6F62' }}>
            Dành cho Banker
          </div>
          <h2 data-cta="" data-delay="200" style={{ opacity: '1', transform: 'none', transition: 'opacity .7s ease, transform .8s ease', fontFamily: '\'Source Serif 4\', Georgia, serif', fontWeight: '400', fontSize: 'clamp(19px, min(2.95cqw, 5.2vh), 44px)', lineHeight: '1.14', letterSpacing: '-0.024em', margin: 'clamp(10px, 1.8vh, 22px) 0 0' }}>
            <span style={{ display: 'block' }}>
              Kết nối khách hàng tiềm năng.
            </span>
            <span style={{ display: 'block', color: '#1E7A52' }}>
              Chỉ thanh toán khi thành công.
            </span>
          </h2>
          <div data-cta="" data-delay="380" style={{ opacity: '1', transform: 'none', transition: 'opacity .7s ease, transform .8s ease', display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: 'clamp(18px, 3vh, 34px)' }}>
            <a href="/app" style={{ fontSize: 'clamp(13.5px, min(1.5cqw, 2.6vh), 16px)', fontWeight: '500', background: '#1F1B16', color: '#F7F4EE', padding: 'clamp(13px, 1.9vh, 17px) clamp(20px, 2.4cqw, 28px)', borderRadius: '999px', whiteSpace: 'nowrap' }}>
              Đăng ký
            </a>
            <a href="/app" style={{ fontSize: 'clamp(13.5px, min(1.5cqw, 2.6vh), 16px)', fontWeight: '500', color: '#1F1B16', border: '1px solid #C4B9A5', padding: 'clamp(13px, 1.9vh, 17px) clamp(20px, 2.4cqw, 28px)', borderRadius: '999px', whiteSpace: 'nowrap' }}>
              Đăng nhập
            </a>
          </div>
          <div data-cta="" data-delay="520" style={{ opacity: '1', transform: 'none', transition: 'opacity .7s ease, transform .8s ease', fontFamily: '\'JetBrains Mono\', monospace', fontSize: 'clamp(10.5px, min(1.15cqw, 2vh), 13px)', letterSpacing: '0.06em', color: '#6E6255', marginTop: 'clamp(12px, 2vh, 22px)' }}>
            3 lượt kết nối đầu không cần Deposit.
          </div>
        </div>
        <div className="bn-rule" style={{ background: '#D9D0BF' }} />
        <div className="bn-aud-user" style={{ flex: '1 1 300px', minWidth: '0', display: 'flex', flexDirection: 'column' }}>
          <div data-cta="" data-delay="140" style={{ opacity: '1', transform: 'none', transition: 'opacity .7s ease, transform .8s ease', fontFamily: '\'JetBrains Mono\', monospace', fontSize: 'clamp(10.5px, min(1.15cqw, 2vh), 13px)', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7A6F62' }}>
            Dành cho người dùng
          </div>
          <h2 data-cta="" data-delay="280" style={{ opacity: '1', transform: 'none', transition: 'opacity .7s ease, transform .8s ease', fontFamily: '\'Source Serif 4\', Georgia, serif', fontWeight: '400', fontSize: 'clamp(19px, min(2.95cqw, 5.2vh), 44px)', lineHeight: '1.14', letterSpacing: '-0.024em', margin: 'clamp(10px, 1.8vh, 22px) 0 0' }}>
            <span style={{ display: 'block' }}>
              Xem thẻ. Chọn khi bạn muốn.
            </span>
            <em style={{ display: 'block', fontStyle: 'italic', color: '#7B4A2D' }}>
              Nhận thưởng khi mở thành công.
            </em>
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: 'clamp(18px, 3vh, 34px)' }}>
            <a data-cta="" data-delay="460" href="https://apps.apple.com/vn/app/bonia/id6761518423" style={{ opacity: '1', transform: 'none', transition: 'opacity .7s ease, transform .8s ease', display: 'flex', alignItems: 'center', gap: '12px', padding: 'clamp(9px, 1.25vh, 12px) clamp(13px, 1.3cqw, 18px)', background: 'transparent', border: '1px solid #C4B9A5', color: '#1F1B16' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style={{ flex: 'none' }}>
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              <span style={{ display: 'flex', alignItems: 'baseline', gap: '8px', minWidth: '0' }}>
                <span style={{ fontFamily: '\'JetBrains Mono\', monospace', fontSize: 'clamp(10.5px, min(1.15cqw, 2vh), 12px)', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#7A6F62' }}>
                  Tải trên
                </span>
                <span style={{ fontFamily: '\'Source Serif 4\', Georgia, serif', fontSize: 'clamp(14px, min(1.55cqw, 2.7vh), 18px)', fontWeight: '500', whiteSpace: 'nowrap' }}>
                  App Store
                </span>
              </span>
            </a>
            <a data-cta="" data-delay="580" href="https://play.google.com/store/apps/details?id=net.bonia.app&pcampaignid=web_share" style={{ opacity: '1', transform: 'none', transition: 'opacity .7s ease, transform .8s ease', display: 'flex', alignItems: 'center', gap: '12px', padding: 'clamp(9px, 1.25vh, 12px) clamp(13px, 1.3cqw, 18px)', background: 'transparent', border: '1px solid #C4B9A5', color: '#1F1B16' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style={{ flex: 'none' }}>
                <path d="M3.6 2.3c-.4.3-.6.7-.6 1.3v17c0 .5.2 1 .6 1.3l9.6-9.9-9.6-9.7zM14.4 13.2l2.6 2.7-11.5 6.5 8.9-9.2zM14.4 11l-8.9-9.2 11.5 6.6-2.6 2.6zM18.5 9.7l3.1 1.8c.7.4.7 1.4 0 1.8l-3.1 1.8-2.9-3 2.9-2.4z" />
              </svg>
              <span style={{ display: 'flex', alignItems: 'baseline', gap: '8px', minWidth: '0' }}>
                <span style={{ fontFamily: '\'JetBrains Mono\', monospace', fontSize: 'clamp(10.5px, min(1.15cqw, 2vh), 12px)', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#7A6F62' }}>
                  Tải trên
                </span>
                <span style={{ fontFamily: '\'Source Serif 4\', Georgia, serif', fontSize: 'clamp(14px, min(1.55cqw, 2.7vh), 18px)', fontWeight: '500', whiteSpace: 'nowrap' }}>
                  Google Play
                </span>
              </span>
            </a>
          </div>
        </div>
      </div>
      <div data-cta="" data-delay="700" style={{ opacity: '1', transform: 'none', transition: 'opacity .7s ease, transform .8s ease', width: '100%', maxWidth: '1240px', margin: 'clamp(12px, 2vh, 26px) auto 0', borderTop: '1px solid #D9D0BF', paddingTop: 'clamp(12px, 1.9vh, 22px)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(14px, 2.2vw, 44px)', alignItems: 'flex-start' }}>
          <div style={{ flex: '1 1 260px', minWidth: '0', fontSize: 'clamp(11.5px, min(1.2cqw, 2.1vh), 13px)', lineHeight: '1.6', color: '#6E6255', maxWidth: '42ch' }}>
            <div>
              Công ty TNHH Duy Nhiên Investment
            </div>
            <div>
              120 N2 Mega Village, Đường Võ Chí Công, phường Long Trường, TP.HCM
            </div>
            <div style={{ fontFamily: '\'JetBrains Mono\', monospace', fontSize: 'clamp(10.5px, min(1.1cqw, 1.9vh), 12px)', marginTop: '4px' }}>
              MST: 0319376631
            </div>
          </div>
          <div style={{ flex: '1 1 300px', minWidth: '0' }}>
            <div style={{ fontFamily: '\'JetBrains Mono\', monospace', fontSize: 'clamp(10.5px, min(1.1cqw, 1.9vh), 11px)', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#6E6255', marginBottom: 'clamp(6px, 1vh, 12px)' }}>
              Liên kết
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0 clamp(16px, 2vw, 32px)', fontSize: 'clamp(12px, min(1.6cqw, 2.6vh), 13px)', lineHeight: '1.9' }}>
              <div>
                <a href="/privacy.html" style={{ display: 'block', color: '#4A4239' }}>
                  Chính sách bảo mật
                </a>
                <a href="/terms.html" style={{ display: 'block', color: '#4A4239' }}>
                  Điều khoản sử dụng
                </a>
                <a href="/so-chinh-thuc.html" style={{ display: 'block', color: '#4A4239' }}>
                  Số chính thức
                </a>
                <a href="/support.html" style={{ display: 'block', color: '#4A4239' }}>
                  Hỗ trợ
                </a>
                <a href="/delete-account.html" style={{ display: 'block', color: '#4A4239' }}>
                  Xóa tài khoản
                </a>
              </div>
              <div>
                <a href="/app" style={{ display: 'block', color: '#4A4239', fontWeight: '500' }}>
                  Bonia Business
                </a>
                <a href="/privacy-business.html" style={{ display: 'block', color: '#4A4239' }}>
                  Bảo mật — Bonia Business
                </a>
                <a href="/terms-business.html" style={{ display: 'block', color: '#4A4239' }}>
                  Điều khoản đối tác
                </a>
              </div>
            </div>
          </div>
        </div>
        <div data-cta="" data-delay="820" style={{ opacity: '1', transform: 'none', transition: 'opacity .7s ease, transform .8s ease', marginTop: 'auto', width: '100%', maxWidth: '1240px', marginLeft: 'auto', marginRight: 'auto', paddingTop: 'clamp(8px, 1.3vh, 16px)', borderTop: '1px solid #D9D0BF', fontSize: 'clamp(10.5px, min(1.1cqw, 1.9vh), 12px)', color: '#6E6255' }}>
          © 2026 Bonia. Mọi quyền được bảo lưu.
        </div>
      </div>
    </section>
  );
}

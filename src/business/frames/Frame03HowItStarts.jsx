// Ported from the Bonia scroll-narrative handoff (Bonia Frames Light.dc.html).
// Markup serialized from the prototype DOM rather than retyped, so the
// measured clamp()/gradient values are exactly the designed ones. Reveal
// behaviour is driven by the data-in / data-fd / data-fl / data-cta
// attributes, which deck.js reads — do not rename them.
// data-fit="scroll": deck.js raises this frame's top padding to clear the
// fixed nav on short screens; the opt-in lets it scroll if that pushes the
// content over 100dvh rather than clipping it.
export default function Frame03HowItStarts() {
  return (
    <section data-fit="scroll" data-f="2" data-screen-label="03 How it starts" style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always', position: 'relative', height: '100dvh', overflow: 'hidden', containerType: 'inline-size', padding: 'clamp(48px, 8vh, 96px) clamp(18px, 4vw, 56px) clamp(16px, 3vh, 40px)', background: 'radial-gradient(125% 95% at 50% 108%, #FBEACF 0%, #F5F0E6 46%, #EFEADF 100%)', color: '#1F1B16', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: '1', minHeight: '0', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 'clamp(12px, 2.4vw, 48px)', maxWidth: '1320px', width: '100%', margin: '0 auto' }}>
        <div style={{ flex: '1 1 210px', minWidth: '0' }}>
          <div data-in="up" data-delay="120" style={{ opacity: '1', transform: 'none', transition: 'opacity .7s ease, transform .8s ease', fontFamily: '\'JetBrains Mono\', monospace', fontSize: '10.5px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7A6F62' }}>
            Bonia
          </div>
          <h2 data-in="up" data-delay="220" style={{ opacity: '1', transform: 'none', transition: 'opacity .7s ease, transform .8s ease', fontFamily: '\'Source Serif 4\', Georgia, serif', fontWeight: '400', fontSize: 'clamp(21px, min(3.5cqw, 6vh), 52px)', lineHeight: '1.06', letterSpacing: '-0.028em', margin: 'clamp(8px, 1.4vh, 18px) 0 0' }}>
            Mọi thứ bắt đầu từ
            <br />
            <em style={{ fontStyle: 'italic', color: '#7B4A2D' }}>
              nhu cầu của khách hàng.
            </em>
          </h2>
        </div>
        <div data-in="fade" data-delay="520" style={{ opacity: '1', transform: 'none', transition: 'opacity .8s ease', flex: '0 0 auto', minWidth: '0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(8px, 1.4vh, 18px)' }}>
          <div data-phonebox="" style={{ position: 'relative', width: 'calc(300px * var(--ph-scale, 1))', height: 'calc(568px * var(--ph-scale, 1))' }}>
            <div data-phone="" style={{ width: '300px', transform: 'scale(var(--ph-scale, 1))', transformOrigin: 'top left', borderRadius: '46px', background: '#0E0F13', padding: '10px', boxShadow: '0 34px 64px -26px rgba(15,20,40,.5), 0 12px 28px -16px rgba(15,20,40,.32), 0 2px 6px rgba(15,20,40,.14)' }}>
              <div style={{ position: 'relative', background: '#F5F7FB', borderRadius: '38px', height: '548px', overflow: 'hidden', color: '#1B2236', fontFamily: 'Inter, system-ui, sans-serif' }}>
                <div style={{ position: 'absolute', top: '9px', left: '50%', transform: 'translateX(-50%)', width: '90px', height: '26px', borderRadius: '13px', background: '#000', zIndex: '5' }} />
                <div data-scr="0" style={{ position: 'absolute', inset: '0', opacity: '1', transition: 'opacity .45s ease, transform .5s ease', display: 'flex', flexDirection: 'column', padding: '0 12px 6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 8px 12px' }}>
                    <span style={{ fontSize: '13.5px', fontWeight: '600', letterSpacing: '.01em' }}>
                      9:41
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#1B2236' }}>
                      <svg width="17" height="11" viewBox="0 0 18 12" fill="currentColor">
                        <rect x="0" y="7.5" width="3.1" height="4.5" rx="1" />
                        <rect x="4.9" y="5" width="3.1" height="7" rx="1" />
                        <rect x="9.8" y="2.5" width="3.1" height="9.5" rx="1" />
                        <rect x="14.7" y="0" width="3.1" height="12" rx="1" />
                      </svg>
                      <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
                        <path d="M8 9.4c.94 0 1.79.4 2.39 1.04L8 12 5.61 10.44A3.3 3.3 0 0 1 8 9.4Z" />
                        <path d="M8 5.6c1.98 0 3.78.79 5.1 2.07l-1.42 1.5A5.2 5.2 0 0 0 8 7.7a5.2 5.2 0 0 0-3.68 1.47L2.9 7.67A7.2 7.2 0 0 1 8 5.6Z" />
                        <path d="M8 1.8c3.03 0 5.78 1.21 7.8 3.18l-1.42 1.5A9.16 9.16 0 0 0 8 3.9a9.16 9.16 0 0 0-6.38 2.58L.2 4.98A11.16 11.16 0 0 1 8 1.8Z" />
                      </svg>
                      <svg width="25" height="12" viewBox="0 0 25 12">
                        <rect x="0.5" y="0.5" width="21" height="11" rx="3.2" fill="none" stroke="currentColor" />
                        <rect x="2" y="2" width="14.5" height="8" rx="1.8" fill="currentColor" />
                        <path d="M22.8 4v4c1-.35 1.7-1.05 1.7-2s-.7-1.65-1.7-2Z" fill="currentColor" />
                      </svg>
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '14px', fontSize: '12px', fontWeight: '700', color: '#8B93A7', padding: '0 4px 10px' }}>
                    <span style={{ color: '#191970', boxShadow: 'inset 0 -2.5px 0 #191970', paddingBottom: '4px' }}>
                      Sản phẩm
                    </span>
                    <span>
                      Giao dịch
                    </span>
                    <span>
                      Phần thưởng
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '10.5px', color: '#8B93A7', padding: '0 2px 10px' }}>
                    <span style={{ background: '#191970', color: '#fff', fontWeight: '600', padding: '5px 11px', borderRadius: '99px' }}>
                      Thẻ tín dụng
                    </span>
                    <span>
                      Ưu đãi khác sắp ra mắt
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ aspectRatio: '361/168', borderRadius: '18px', overflow: 'hidden', position: 'relative', background: 'linear-gradient(135deg, #191970 0%, #0D0D3F 100%)', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'left' }}>
                      <div style={{ position: 'absolute', inset: '0', background: 'linear-gradient(90deg, rgba(8,10,26,.74) 0%, rgba(8,10,26,.44) 58%, rgba(8,10,26,.22) 100%)' }} />
                      <div style={{ position: 'absolute', right: '-7%', bottom: '11%', width: '47%', height: '72%', background: 'rgba(255,255,255,.10)', border: '1px solid rgba(255,255,255,.14)', borderRadius: '12px', transform: 'rotate(-14deg)' }} />
                      <div style={{ position: 'absolute', right: '5%', bottom: '25%', width: '29%', height: '42%', background: 'rgba(255,255,255,.07)', borderRadius: '9px', transform: 'rotate(-14deg)' }} />
                      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', padding: '9px 10.5px 0' }}>
                        <div style={{ minWidth: '0', fontSize: '10px', lineHeight: '1.3', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <span style={{ fontSize: '9.5px', fontWeight: '500', color: 'rgba(255,255,255,.92)' }}>
                            Newfield
                          </span>
                          <span style={{ display: 'inline-block', width: '0.55em' }} />
                          <span style={{ fontWeight: '700' }}>
                            Tích dặm hạng vàng
                          </span>
                        </div>
                        <span style={{ flex: 'none', fontSize: '8px', fontWeight: '500', color: '#fff', padding: '4px 8px', borderRadius: '20px', background: 'rgba(255,255,255,.16)', border: '1px solid rgba(255,255,255,.22)', whiteSpace: 'nowrap' }}>
                          Chi tiết
                        </span>
                      </div>
                      <div style={{ position: 'relative', padding: '0 10.5px 9px' }}>
                        <div style={{ fontSize: '8.5px', lineHeight: '1.4', color: 'rgba(255,255,255,.86)', marginBottom: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          1300 phòng chờ sân bay hạng Thương gia
                        </div>
                        <div style={{ fontFamily: '\'JetBrains Mono\', monospace', fontSize: '18px', fontWeight: '700', color: '#fff', lineHeight: '1.2' }}>
                          400.000đ
                        </div>
                        <div style={{ fontSize: '8px', lineHeight: '1.35', color: 'rgba(255,255,255,.62)', marginTop: '2px' }}>
                          Phần thưởng tiền mặt khi mở thẻ thành công
                        </div>
                        <div style={{ marginTop: '8px', height: '28px', borderRadius: '11px', background: '#00A76F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10.5px', fontWeight: '700', color: '#fff' }}>
                          ✓ Đã quan tâm
                        </div>
                      </div>
                    </div>
                    <div style={{ aspectRatio: '361/168', borderRadius: '18px', overflow: 'hidden', position: 'relative', background: 'linear-gradient(135deg, #191970 0%, #0D0D3F 100%)', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'left' }}>
                      <div style={{ position: 'absolute', inset: '0', background: 'linear-gradient(90deg, rgba(8,10,26,.74) 0%, rgba(8,10,26,.44) 58%, rgba(8,10,26,.22) 100%)' }} />
                      <div style={{ position: 'absolute', right: '-7%', bottom: '11%', width: '47%', height: '72%', background: 'rgba(255,255,255,.10)', border: '1px solid rgba(255,255,255,.14)', borderRadius: '12px', transform: 'rotate(-14deg)' }} />
                      <div style={{ position: 'absolute', right: '5%', bottom: '25%', width: '29%', height: '42%', background: 'rgba(255,255,255,.07)', borderRadius: '9px', transform: 'rotate(-14deg)' }} />
                      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', padding: '9px 10.5px 0' }}>
                        <div style={{ minWidth: '0', fontSize: '10px', lineHeight: '1.3', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <span style={{ fontSize: '9.5px', fontWeight: '500', color: 'rgba(255,255,255,.92)' }}>
                            Brightpeak
                          </span>
                          <span style={{ display: 'inline-block', width: '0.55em' }} />
                          <span style={{ fontWeight: '700' }}>
                            Hoàn tiền
                          </span>
                        </div>
                        <span style={{ flex: 'none', fontSize: '8px', fontWeight: '500', color: '#fff', padding: '4px 8px', borderRadius: '20px', background: 'rgba(255,255,255,.16)', border: '1px solid rgba(255,255,255,.22)', whiteSpace: 'nowrap' }}>
                          Chi tiết
                        </span>
                      </div>
                      <div style={{ position: 'relative', padding: '0 10.5px 9px' }}>
                        <div style={{ fontSize: '8.5px', lineHeight: '1.4', color: 'rgba(255,255,255,.86)', marginBottom: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          Hoàn tiền 10% giao dịch trực tuyến
                        </div>
                        <div style={{ fontFamily: '\'JetBrains Mono\', monospace', fontSize: '18px', fontWeight: '700', color: '#fff', lineHeight: '1.2' }}>
                          150.000đ
                        </div>
                        <div style={{ fontSize: '8px', lineHeight: '1.35', color: 'rgba(255,255,255,.62)', marginTop: '2px' }}>
                          Phần thưởng tiền mặt khi mở thẻ thành công
                        </div>
                        <div data-tapwrap="" style={{ position: 'relative', marginTop: '8px' }}>
                          <div data-ring="" style={{ position: 'absolute', left: '50%', top: '50%', width: '44px', height: '44px', margin: '-22px 0 0 -22px', borderRadius: '999px', background: 'rgba(0,167,111,0.35)', opacity: '0', transform: 'scale(.6)', transition: 'opacity .35s ease, transform .5s ease', pointerEvents: 'none' }} />
                          <div data-tap="" style={{ height: '28px', borderRadius: '11px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10.5px', fontWeight: '700', color: '#111436', transition: 'background .35s ease, color .35s ease' }}>
                            Quan tâm
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: '10px', textAlign: 'center', fontSize: '11px', lineHeight: '1.5', color: '#6B7385' }}>
                    Bonia không hiển thị tên nhân viên tư vấn. Số điện thoại của bạn được bảo mật.
                  </div>
                  <div style={{ flex: '1' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '10px', color: '#8B93A7', borderTop: '1px solid #E6E9F1', paddingTop: '8px' }}>
                    <span>
                      Cuộc gọi
                    </span>
                    <span style={{ color: '#191970', fontWeight: '700' }}>
                      Ưu đãi
                    </span>
                    <span>
                      Cài đặt
                    </span>
                  </div>
                  <div style={{ width: '34%', height: '5px', borderRadius: '3px', background: 'rgba(0,0,0,.25)', margin: '7px auto 3px' }} />
                </div>
                <div data-scr="1" style={{ position: 'absolute', inset: '0', opacity: '0', transform: 'translateX(6%)', transition: 'opacity .45s ease, transform .5s ease', display: 'flex', flexDirection: 'column', padding: '0 12px 6px', background: '#F5F7FB' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 8px 12px' }}>
                    <span style={{ fontSize: '13.5px', fontWeight: '600' }}>
                      9:41
                    </span>
                    <span style={{ fontSize: '11px', color: '#8B93A7' }}>
                      ●●●●
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 2px 10px' }}>
                    <span style={{ fontSize: '15px', color: '#41485C' }}>
                      ‹
                    </span>
                    <span style={{ width: '22px', height: '22px', borderRadius: '6px', background: '#191970', color: '#fff', fontSize: '9px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      NF
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#1B2236' }}>
                      Newfield · Nhiên
                    </span>
                    <span style={{ flex: '1' }} />
                    <span style={{ fontFamily: '\'JetBrains Mono\', monospace', fontSize: '11.5px', color: '#00A76F' }}>
                      400.000đ
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '10px', fontWeight: '700', color: '#8B93A7', padding: '0 4px 12px' }}>
                    <span style={{ color: '#191970', boxShadow: 'inset 0 -2.5px 0 #191970', paddingBottom: '4px' }}>
                      Chờ tư vấn
                    </span>
                    <span>
                      Đã tư vấn
                    </span>
                    <span>
                      Đã nhận thẻ
                    </span>
                  </div>
                  <div style={{ fontSize: '10px', lineHeight: '1.55', color: '#6B7385', textAlign: 'center', padding: '0 10px', marginTop: '28px' }}>
                    Số của bạn được bảo mật · Chỉ trao đổi qua Bonia để tránh lộ thông tin · Cuộc gọi có thể được ghi âm
                  </div>
                  <div style={{ fontSize: '9px', letterSpacing: '.14em', color: '#A2AABC', textAlign: 'center', marginTop: '18px' }}>
                    6 NGÀY TRƯỚC
                  </div>
                  <div data-typing="" style={{ opacity: '0', transition: 'opacity .3s ease', marginTop: '12px', alignSelf: 'flex-start', display: 'inline-flex', gap: '4px', background: '#fff', borderRadius: '14px', padding: '9px 11px' }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '999px', background: '#A2AABC' }} />
                    <span style={{ width: '5px', height: '5px', borderRadius: '999px', background: '#A2AABC' }} />
                    <span style={{ width: '5px', height: '5px', borderRadius: '999px', background: '#A2AABC' }} />
                  </div>
                  <div data-bubble="" style={{ opacity: '0', transition: 'opacity .4s ease', marginTop: '8px' }}>
                    <div style={{ fontSize: '9px', color: '#8B93A7', marginBottom: '4px' }}>
                      Newfield · Nhiên
                    </div>
                    <div style={{ background: '#fff', border: '1px solid #E9EDF4', borderRadius: '14px 14px 14px 4px', padding: '9px 12px', fontSize: '12.5px', lineHeight: '1.55', color: '#1B2236', maxWidth: '82%' }}>
                      chào anh Duy, em xin phép gọi cho mình tư vấn nhé?
                    </div>
                  </div>
                  <div data-reply="" style={{ opacity: '0', transition: 'opacity .4s ease', display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <div style={{ background: '#191970', color: '#fff', border: '0', borderRadius: '14px 14px 4px 14px', padding: '9px 12px', fontSize: '12.5px', lineHeight: '1.55', maxWidth: '82%' }}>
                      Ok
                    </div>
                  </div>
                  <div style={{ flex: '1' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', borderRadius: '999px', padding: '9px 14px', fontSize: '11px', color: '#A2AABC', border: '1px solid #E6E9F1' }}>
                    Nhắn tin cho Nhiên…
                    <span style={{ flex: '1' }} />
                    <span style={{ color: '#191970' }}>
                      ➤
                    </span>
                  </div>
                  <div style={{ width: '34%', height: '5px', borderRadius: '3px', background: 'rgba(0,0,0,.25)', margin: '7px auto 3px' }} />
                </div>
                <div data-scr="2" style={{ position: 'absolute', inset: '0', opacity: '0', transform: 'translateX(6%)', transition: 'opacity .45s ease, transform .5s ease', background: 'linear-gradient(180deg, #1B1B3A 0%, #0E0F13 62%, #08080C 100%)', color: '#F5F7FB', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '44px 20px 22px' }}>
                  <div style={{ fontFamily: '\'JetBrains Mono\', monospace', fontSize: '10px', letterSpacing: '.22em', color: 'rgba(245,247,251,.6)' }}>
                    CUỘC GỌI ĐẾN
                  </div>
                  <div style={{ position: 'relative', width: '76px', height: '76px', marginTop: '26px' }}>
                    <div style={{ position: 'absolute', inset: '0', borderRadius: '999px', border: '1px solid rgba(0,167,111,.5)', animation: 'bnPulse 2s ease-in-out infinite' }} />
                    <div style={{ position: 'absolute', inset: '9px', borderRadius: '999px', background: '#191970', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '\'Source Serif 4\', Georgia, serif', fontSize: '17px', color: '#fff' }}>
                      bonia
                    </div>
                  </div>
                  <div style={{ fontFamily: '\'JetBrains Mono\', monospace', fontSize: '19px', letterSpacing: '.02em', marginTop: '22px' }}>
                    028 7301 7200
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'rgba(245,247,251,.72)', marginTop: '8px', textAlign: 'center', lineHeight: '1.5' }}>
                    BONIA · Ngân hàng gọi qua Bonia
                    <br />
                    Số hai bên đều được giữ kín
                  </div>
                  <div style={{ flex: '1' }} />
                  <div style={{ display: 'flex', gap: '44px', alignItems: 'center' }}>
                    <span style={{ width: '52px', height: '52px', borderRadius: '999px', background: '#B8553A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '19px' }}>
                      ✕
                    </span>
                    <span style={{ width: '52px', height: '52px', borderRadius: '999px', background: '#00A76F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '19px' }}>
                      ☎
                    </span>
                  </div>
                  <div style={{ width: '34%', height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,.3)', margin: '16px auto 0' }} />
                </div>
              </div>
            </div>
          </div>
          <div style={{ fontFamily: '\'JetBrains Mono\', monospace', fontSize: 'clamp(10.5px, min(1.15cqw, 2vh), 13px)', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6E6255', textAlign: 'center', maxWidth: '30ch', lineHeight: '1.6' }}>
            Cuộc gọi giữa Ngân hàng và người dùng được bảo mật số điện thoại
          </div>
        </div>
        <div style={{ flex: '1 1 210px', minWidth: '0' }}>
          <div data-in="up" data-delay="180" style={{ opacity: '1', transform: 'none', transition: 'opacity .7s ease, transform .8s ease', fontFamily: '\'JetBrains Mono\', monospace', fontSize: '10.5px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7A6F62' }}>
            Trên Bonia
          </div>
          <p data-in="up" data-delay="300" style={{ opacity: '1', transform: 'none', transition: 'opacity .7s ease, transform .8s ease', fontSize: 'clamp(13px, min(1.55cqw, 2.7vh), 21px)', lineHeight: '1.55', color: '#4A4239', margin: 'clamp(8px, 1.4vh, 18px) 0 0', maxWidth: '32ch', textWrap: 'pretty' }}>
            {"Khách hàng để lại quan tâm, Ngân hàng tư vấn. Tất cả diễn ra trên nền tảng bảo mật số điện thoại của "}
            <strong style={{ fontWeight: '600', color: '#1F1B16' }}>
              Bonia Business
            </strong>
            .
          </p>
        </div>
      </div>
    </section>
  );
}

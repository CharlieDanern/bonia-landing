// Ported from the Bonia scroll-narrative handoff (Bonia Frames Light.dc.html).
// Markup serialized from the prototype DOM rather than retyped, so the
// measured clamp()/gradient values are exactly the designed ones. Reveal
// behaviour is driven by the data-in / data-fd / data-fl / data-cta
// attributes, which deck.js reads — do not rename them.
import BoniaVoid from "../BoniaVoid.jsx";

export default function Frame02Today() {
  return (
    <section data-f="1" data-screen-label="02 Today" style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always', position: 'relative', height: '100dvh', overflow: 'hidden', background: 'radial-gradient(120% 90% at 50% 108%, #F7F2E8 0%, #F2EEE6 52%, #ECE7DC 100%)', color: '#1F1B16' }}>
      <BoniaVoid />
    </section>
  );
}

/* Bonia · "Khoảng trống" — the problem, as a self-building web component.
   Adapted from the supplied GSAP piece. Two content changes the deck asked for:
   Chị Hà arrives at ~2.7s (was 4.9s) and the 99/100 counter never fades.

   Structural difference from the original: the SVG viewBox tracks the host box
   so ONE UNIT IS ONE CSS PIXEL. The original's fixed 1500×900 canvas scaled all
   type by min(w/1500, h/900) — 0.6× at desktop, 0.25× at phone — which put the
   labels under 10px and the statement copy at 6px. Geometry is derived from the
   measured box instead, and every font size is real px with a floor. */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var C = {
    ink: '#1F1B16', accent: '#B8553A', muted: '#6E6255',
    light: '#A2988A', pill: '#FBF8F2', rule: 'rgba(110,98,85,0.32)',
    den: '#8A7C6C', core: '#F5F0E6'
  };
  var SERIF = "'Source Serif 4', Georgia, serif";
  var MONO = "'JetBrains Mono', ui-monospace, monospace";
  var clamp = function (lo, v, hi) { return Math.max(lo, Math.min(v, hi)); };

  function waitForGsap() {
    return new Promise(function (res) {
      if (window.gsap) return res(window.gsap);
      var n = 0;
      var iv = setInterval(function () {
        if (window.gsap) { clearInterval(iv); res(window.gsap); }
        else if (++n > 120) { clearInterval(iv); res(null); }
      }, 50);
    });
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function el(tag, attrs) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  class BoniaVoid extends HTMLElement {
    connectedCallback() {
      if (this._init) return;
      this._init = true;
      this.style.cssText = 'position:absolute;inset:0;display:block;overflow:hidden;line-height:1';
      var self = this;
      var ro = new ResizeObserver(function () { self.plan(); });
      ro.observe(this);
      this.plan();
    }
    disconnectedCallback() { if (this._tl) this._tl.kill(); }

    plan() {
      var w = Math.round(this.clientWidth), h = Math.round(this.clientHeight);
      if (w < 80 || h < 80) return;
      if (this._w && Math.abs(w - this._w) < 14 && Math.abs(h - this._h) < 14) return;
      this._w = w; this._h = h;
      clearTimeout(this._t);
      var self = this;
      this._t = setTimeout(function () { self.build(w, h); }, 60);
    }

    build(W, H) {
      if (this._tl) { this._tl.kill(); this._tl = null; }
      this.textContent = '';

      var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, 'aria-hidden': 'true' });
      svg.style.cssText = 'display:block;width:100%;height:100%';
      var g = {};
      ['defs', 'lines', 'dots', 'labels', 'core', 'hud', 'miss', 'user', 'stmt'].forEach(function (k) {
        g[k] = el(k === 'defs' ? 'defs' : 'g', k === 'lines' ? { fill: 'none' } : {});
        svg.appendChild(g[k]);
      });
      this.appendChild(svg);

      /* ---- geometry from the real box, so nothing is scaled behind our back --- */
      var narrow = W < 620;
      var CX = W * (narrow ? 0.5 : 0.375), CY = H * (narrow ? 0.36 : 0.44);
      var R_MAX = Math.min(W * 0.26, H * 0.30);
      var R_MIN = R_MAX * 0.48;
      var R_VOID = Math.max(16, R_MAX * 0.10);
      var N = 100, TAU = Math.PI * 2;

      /* ---- type in real px, with floors ------------------------------------- */
      var F_MONO = clamp(11, W * 0.0135, 16);
      var F_SERIF = clamp(15, W * 0.019, 22);
      var F_STMT = clamp(16, W * 0.0215, 27);
      var F_NUM = clamp(42, W * 0.075, 112);
      var F_CAP = clamp(11, W * 0.0125, 14);

      var SPOTS = {
        31: { a: 1.98, text: 'không nghe' },
        40: { a: 2.52, text: 'chặn' },
        48: { a: 3.05, text: 'sai người' },
        57: { a: 3.60, text: 'chưa có nhu cầu' },
        73: { a: 4.60, text: 'đã có thẻ' }
      };
      var rnd = mulberry32(20260829);
      var nodes = [];
      for (var i = 0; i < N; i++) {
        var spot = SPOTS[i];
        var a = spot ? spot.a : (i + 0.15 + rnd() * 0.7) / N * TAU;
        var r = spot ? R_MAX * 0.97 : R_MIN + rnd() * (R_MAX - R_MIN);
        if (spot) { rnd(); rnd(); }
        nodes.push({
          i: i, a: a, x: CX + Math.cos(a) * r, y: CY + Math.sin(a) * r,
          x0: CX + Math.cos(a) * R_VOID, y0: CY + Math.sin(a) * R_VOID,
          r: r, label: spot ? spot.text : null
        });
      }

      var pills = [];
      function pill(x, y, txt, o) {
        o = o || {};
        var serif = !!o.serif;
        var fs = serif ? F_SERIF : F_MONO;
        var hh = fs * 1.95;
        var pad = o.marker ? fs * 2.6 : fs * 1.75;
        var grp = el('g', {});
        var rect = el('rect', {
          y: y - hh / 2, height: hh, rx: 2, fill: C.pill,
          stroke: o.stroke || C.rule, 'stroke-width': o.strokeWidth || 1,
          'stroke-dasharray': o.dashed ? '3 3' : 'none'
        });
        grp.appendChild(rect);
        var dot = null;
        if (o.marker) { dot = el('circle', { cy: y, r: fs * 0.2, fill: o.marker }); grp.appendChild(dot); }
        var t = el('text', { y: y + fs * 0.34, fill: o.fill || C.ink });
        t.style.cssText = 'font-family:' + (serif ? SERIF : MONO) + ';font-size:' + fs + 'px;font-weight:400';
        t.textContent = txt;
        grp.appendChild(t);
        grp._fit = function () {
          var tw = 0;
          try { tw = t.getComputedTextLength(); } catch (e) { tw = 0; }
          if (!tw) tw = txt.length * fs * 0.58;
          var bw = Math.round(tw) + pad;
          var left = o.side === 'left';
          var px = left ? x - fs * 0.9 - bw : x + fs * 0.9;
          // Keep the pill inside the canvas. On a phone the field is narrow
          // enough that the spot labels ("chưa có nhu cầu", "sai người") ran
          // off the left edge and were cut in half. Skipped for the mid-line
          // label, which lives in its own rotated/translated group where these
          // coordinates are local rather than on-screen.
          if (!o.noClamp) px = Math.max(8, Math.min(px, W - 8 - bw));
          rect.setAttribute('x', px);
          rect.setAttribute('width', bw);
          if (dot) dot.setAttribute('cx', px + fs * 0.95);
          t.setAttribute('x', px + (o.marker ? fs * 1.75 : pad / 2));
          grp._w = bw;
        };
        grp._fit();
        grp._dir = o.side === 'left' ? 6 : -6;
        pills.push(grp);
        return grp;
      }

      var lineEls = [], dotEls = [], labelEls = [];
      nodes.forEach(function (n) {
        var len = n.r - R_VOID;
        var ln = el('line', {
          x1: n.x0, y1: n.y0, x2: n.x, y2: n.y, stroke: C.muted, 'stroke-width': 1,
          'stroke-dasharray': len, 'stroke-dashoffset': len
        });
        ln._len = len;
        g.lines.appendChild(ln); lineEls.push(ln);
        var d = el('circle', { cx: n.x, cy: n.y, r: Math.max(2.4, R_MAX * 0.011), fill: C.muted });
        g.dots.appendChild(d); dotEls.push(d);
        if (n.label) {
          var p = pill(n.x, n.y, n.label, { side: Math.cos(n.a) < 0 ? 'left' : 'right', fill: C.muted, marker: C.light });
          p._i = n.i;
          g.labels.appendChild(p); labelEls.push(p);
        }
      });

      g.core.appendChild(el('circle', { cx: CX, cy: CY, r: R_VOID, fill: C.core }));
      var coreRing = el('circle', { cx: CX, cy: CY, r: R_VOID * 0.56, fill: 'none', stroke: C.muted, 'stroke-width': 1, 'stroke-dasharray': '2 4' });
      var coreDot = el('circle', { cx: CX, cy: CY, r: Math.max(4, R_VOID * 0.19), fill: C.ink });
      var coreLabel = pill(CX - F_MONO * 3.6, CY + R_VOID + F_MONO * 1.9, 'BANKER', { fill: C.muted });
      g.core.appendChild(coreRing); g.core.appendChild(coreDot); g.core.appendChild(coreLabel);

      /* HUD: counter only. The deck's fixed nav band owns the top-left corner,
         so the original eyebrow there collided with the logo. */
      var padX = Math.max(20, W * 0.028);
      var padY = Math.max(26, H * 0.055);
      var countWrap = el('g', {});
      var baseY = H - padY - F_CAP * 3.1;
      var countNum = el('text', { x: padX, y: baseY, fill: C.accent });
      var countDen = el('text', { x: padX + F_NUM, y: baseY, fill: C.den });
      [countNum, countDen].forEach(function (t) {
        t.style.cssText = 'font-family:' + SERIF + ';font-size:' + F_NUM + 'px;font-weight:400;letter-spacing:-0.02em';
      });
      countNum.textContent = '0';
      countDen.textContent = '/ 100';
      // Unit, set noticeably smaller than the figure so it reads as a caption
      // to it rather than part of the number. Baseline-aligned with 99 / 100.
      var F_UNIT = Math.max(F_CAP * 1.2, F_NUM * 0.3);
      var countUnit = el('text', { x: padX, y: baseY, fill: C.den });
      countUnit.style.cssText = 'font-family:' + SERIF + ';font-size:' + F_UNIT + 'px;font-weight:400;letter-spacing:-0.01em';
      countUnit.textContent = 'cuộc gọi';
      var countSub = el('text', { x: padX + 2, y: H - padY * 0.75, fill: C.muted });
      countSub.style.cssText = 'font-family:' + MONO + ';font-size:' + F_CAP + 'px;font-weight:500;letter-spacing:0.2em;text-transform:uppercase';
      countSub.textContent = 'Rơi vào khoảng trống';
      countWrap.appendChild(countNum); countWrap.appendChild(countDen);
      countWrap.appendChild(countUnit); countWrap.appendChild(countSub);
      g.hud.appendChild(countWrap);

      var lastLen = -1;
      function layoutCount() {
        var s = countNum.textContent;
        if (s.length === lastLen) return;
        lastLen = s.length;
        var cw = countNum.getComputedTextLength ? countNum.getComputedTextLength() : s.length * F_NUM * 0.56;
        var dx = padX + cw + F_NUM * 0.24;
        countDen.setAttribute('x', dx);
        // The unit trails the denominator, so it has to be re-placed whenever
        // the figure changes width (0 → 99 during the count-up).
        var dw = countDen.getComputedTextLength
          ? countDen.getComputedTextLength()
          : countDen.textContent.length * F_NUM * 0.56;
        countUnit.setAttribute('x', dx + dw + F_UNIT * 0.6);
      }

      /* Chị Hà sits outside the field; her side flips if there is no room right */
      var uA = -0.28;
      var haWpre = (25 * F_SERIF * 0.56 + F_SERIF * 1.75 + 10) * 1.04;
      var uRfit = (W - haWpre - 30 - CX) / Math.cos(uA);
      var uR = Math.max(R_MAX * 1.12, Math.min(R_MAX * 1.62, uRfit));
      var ux = CX + Math.cos(uA) * uR, uy = CY + Math.sin(uA) * uR;
      uy = clamp(F_SERIF * 3, uy, H * 0.62);
      /* The clamp above moves the dot off the uA ray, but the connector and the
         mid-line label were still built from the original angle and radius — so
         the dashes ran to a point beside the dot instead of meeting it, and the
         label sat at an angle the visible line no longer had. Re-derive both
         from where the dot actually ended up. */
      uA = Math.atan2(uy - CY, ux - CX);
      var uDist = Math.hypot(ux - CX, uy - CY);
      var haW = haWpre;
      var uSide = (ux + F_SERIF * 0.9 + haW + 12 <= W) ? 'right' : 'left';
      var STMT_LINES = ['Khách hàng chỉ nhận được', 'cuộc gọi khi không cần.', 'Đến lúc cần, khách hàng', 'phải tự đi tìm.'];
      var lead = F_STMT * 1.62;
      var stmtXPre = narrow ? padX : Math.min(W - padX - F_STMT * 12.5, ux + F_SERIF * 0.9);
      // On a phone the statement and the 99/100 counter are both pinned to the
      // bottom-left (stmtX collapses to padX when narrow), and their baselines
      // sat about 1.1x F_CAP apart — so the counter was drawn straight through
      // "phải tự đi tìm.". When narrow, stack the statement clear above the
      // counter instead of sharing the same band.
      var stmtYPre = narrow
        ? baseY - F_NUM - F_CAP * 1.8 - lead * (STMT_LINES.length - 1)
        : H - padY - F_CAP * 4.2 - lead * (STMT_LINES.length - 1);
      var uDotR = Math.max(4, R_VOID * 0.19);
      var sx0 = CX + Math.cos(uA) * R_VOID, sy0 = CY + Math.sin(uA) * R_VOID;
      var sx1 = CX + Math.cos(uA) * (uDist - uDotR), sy1 = CY + Math.sin(uA) * (uDist - uDotR);

      var gid = 'bv-fade-' + Math.random().toString(36).slice(2, 8);
      var grad = el('linearGradient', { id: gid, gradientUnits: 'userSpaceOnUse', x1: sx0, y1: sy0, x2: sx1, y2: sy1 });
      grad.appendChild(el('stop', { offset: '0', 'stop-color': C.muted, 'stop-opacity': '0.9' }));
      grad.appendChild(el('stop', { offset: '1', 'stop-color': C.accent, 'stop-opacity': '0.9' }));
      g.defs.appendChild(grad);

      var stubLen = Math.hypot(sx1 - sx0, sy1 - sy0);
      var dashK = Math.max(4, Math.round(stubLen / 11));
      var dashP = stubLen / (dashK + 0.58);
      var stub = el('line', {
        x1: sx0, y1: sy0, x2: sx1, y2: sy1, stroke: 'url(#' + gid + ')', 'stroke-width': 1.5,
        'stroke-dasharray': (dashP * 0.58).toFixed(2) + ' ' + (dashP * 0.42).toFixed(2),
        'stroke-dashoffset': stubLen
      });
      g.miss.appendChild(stub);

      var pulseR = Math.max(7, R_VOID * 0.4);
      var uPulse1 = el('circle', { cx: ux, cy: uy, r: pulseR, fill: 'none', stroke: C.accent, 'stroke-width': 1 });
      var uPulse2 = el('circle', { cx: ux, cy: uy, r: pulseR, fill: 'none', stroke: C.accent, 'stroke-width': 1 });
      var uDot = el('circle', { cx: ux, cy: uy, r: uDotR, fill: C.accent });
      g.user.appendChild(uPulse1); g.user.appendChild(uPulse2); g.user.appendChild(uDot);
      var uLabel = pill(ux, uy, 'Chị Hà cần mở thẻ hôm nay', { serif: true, side: uSide, fill: C.ink, stroke: C.accent, strokeWidth: 1.2 });
      g.user.appendChild(uLabel);

      var seekEls = [];
      ['hỏi bạn bè', 'ra chi nhánh', 'tự tra Google'].forEach(function (s, k) {
        var p = pill(ux, uy + F_SERIF * (2.5 + k * 2.15), s, { serif: true, side: uSide, fill: C.muted, dashed: true });
        g.user.appendChild(p); seekEls.push(p);
      });

      /* standing copy — on screen from the first frame, never animated */
      var stmtLines = STMT_LINES;
      var stmtX = stmtXPre, stmtY = stmtYPre;
      stmtLines.forEach(function (row, k) {
        var t = el('text', { x: stmtX, y: stmtY + k * lead, fill: C.muted });
        t.style.cssText = 'font-family:' + SERIF + ';font-size:' + F_STMT + 'px;font-weight:400';
        t.textContent = row;
        g.stmt.appendChild(t);
      });

      /* The mid-line label has to clear BOTH her pill and the seek stack, which
         sit on the same side — no single fixed offset can do that. Walk the line
         from 0.5 toward the core and take the first slot whose rect clears their
         union on either side of the line. */
      var nx = -Math.sin(uA), ny = Math.cos(uA);
      var msSide = (uSide === 'left') ? 'right' : 'left';
      var msTxt = 'Không tiếp cận được';
      var msW = msTxt.length * F_MONO * 0.6 + F_MONO * 1.75 + 10;
      var msH = F_MONO * 1.95;
      // getBBox() is not reliable before layout settles — a zeroed box made every
      // candidate "clear". Derive the occupied rects from the same geometry pill()
      // uses, so the test is exact at build time.
      function boxFor(x, y, txt, serif) {
        var fs = serif ? F_SERIF : F_MONO;
        var bw = (txt.length * fs * (serif ? 0.56 : 0.62) + fs * 1.75 + 10) * 1.04;
        var bh = fs * 1.95;
        var rx = (uSide === 'left') ? x - fs * 0.9 - bw : x + fs * 0.9;
        return { x: rx, y: y - bh / 2, width: bw, height: bh };
      }
      var occupied = [boxFor(ux, uy, 'Chị Hà cần mở thẻ hôm nay', true)];
      ['hỏi bạn bè', 'ra chi nhánh', 'tự tra Google'].forEach(function (t, k) {
        occupied.push(boxFor(ux, uy + F_SERIF * (2.5 + k * 2.15), t, true));
      });
      occupied.push({ x: padX - 8, y: H - padY - F_NUM - F_CAP * 3, width: W * 0.42, height: F_NUM + F_CAP * 5 });
      occupied.push({ x: stmtXPre - 10, y: stmtYPre - lead, width: F_STMT * 14, height: lead * 4.4 });
      function msClearsRot(x, y, dx, dy) {
        var px = -dy, py = dx;
        var xs = [], ys = [];
        [[F_MONO * 0.9, -msH / 2], [F_MONO * 0.9 + msW, -msH / 2],
         [F_MONO * 0.9, msH / 2], [F_MONO * 0.9 + msW, msH / 2]].forEach(function (c) {
          xs.push(x + dx * c[0] + px * c[1]);
          ys.push(y + dy * c[0] + py * c[1]);
        });
        var rx = Math.min.apply(null, xs), rw = Math.max.apply(null, xs) - rx;
        var ry = Math.min.apply(null, ys), rh = Math.max.apply(null, ys) - ry;
        if (rx < 8 || rx + rw > W - 8 || ry < 8 || ry + rh > H - 8) return false;
        return occupied.every(function (b) {
          return rx > b.x + b.width + 8 || rx + rw < b.x - 8 || ry > b.y + b.height + 8 || ry + rh < b.y - 8;
        });
      }
      var dirX = Math.cos(uA), dirY = Math.sin(uA);
      var offs = [0, F_MONO * 2.3, -F_MONO * 2.3, F_MONO * 4.4, -F_MONO * 4.4];
      var mox = 0, moy = 0, msFound = false;
      // Offset-major, not position-major: exhaust every slot ALONG the line at
      // zero perpendicular offset before allowing a sideways nudge, so the
      // label reads as part of the connector instead of floating beside it.
      // Searching position-major took the first clear slot at any offset, which
      // pushed the label off the line even when a point further along it was
      // free.
      // Search the whole usable length of the connector, not just 0.44→0.08.
      // On narrow viewports the short line plus the crowded pills left no clear
      // slot in that window, so the label fell through to a perpendicular
      // offset and floated beside the line — measured 40px off at 1000x900.
      for (var oi = 0; oi < offs.length && !msFound; oi++) {
        for (var fi = 0; fi < 16 && !msFound; fi++) {
          var f2 = 0.62 - fi * 0.04;
          var ax = sx0 + (sx1 - sx0) * f2 + nx * offs[oi];
          var ay = sy0 + (sy1 - sy0) * f2 + ny * offs[oi];
          if (msClearsRot(ax, ay, dirX, dirY)) { mox = ax; moy = ay; msFound = true; }
        }
      }
      if (!msFound) { mox = sx0 + (sx1 - sx0) * 0.06; moy = sy0 + (sy1 - sy0) * 0.06 + ny * F_MONO * 3.2; }
      var missLabel = pill(0, 0, msTxt, { fill: '#A0442C', side: 'right', noClamp: true });
      var msWrap = el('g', {
        transform: 'translate(' + mox.toFixed(1) + ' ' + moy.toFixed(1) + ') rotate(' + (uA * 180 / Math.PI).toFixed(2) + ')'
      });
      msWrap.appendChild(missLabel);
      g.miss.appendChild(msWrap);

      function fitPills() { pills.forEach(function (p) { p._fit(); }); }
      fitPills();

      /* On a phone there is no room to Chị Hà's right, so her pill flips to the
         LEFT of her dot and lands on top of the ambient spot labels ("chưa có
         nhu cầu", "sai người") — three boxes of text stacked on each other.
         Those labels are decoration; her line is the whole point of the frame.
         Hide the ones she or the seek stack now covers. Run after fitPills()
         because the widths are only final once the text has been measured, and
         geometric rather than width-gated so it self-corrects at any size. */
      (function cullCoveredLabels() {
        function boxOf(grp) {
          var r = grp.querySelector('rect');
          if (!r) return null;
          return {
            x: +r.getAttribute('x'), y: +r.getAttribute('y'),
            w: +r.getAttribute('width'), h: +r.getAttribute('height')
          };
        }
        var over = [uLabel].concat(seekEls).map(boxOf).filter(Boolean);
        labelEls.forEach(function (p) {
          var b = boxOf(p);
          if (!b) return;
          var hit = over.some(function (o) {
            return !(b.x > o.x + o.w + 4 || b.x + b.w < o.x - 4 ||
                     b.y > o.y + o.h + 4 || b.y + b.h < o.y - 4);
          });
          if (hit) p.style.display = 'none';
        });
      })();
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () { fitPills(); lastLen = -1; layoutCount(); });
      }

      var self = this;
      waitForGsap().then(function (gsap) {
        if (!gsap) {
          lineEls.forEach(function (ln) { ln.setAttribute('stroke-dashoffset', 0); ln.style.opacity = 0.16; });
          dotEls.forEach(function (d) { d.setAttribute('fill', C.light); });
          stub.setAttribute('stroke-dashoffset', 0);
          countNum.textContent = '99'; layoutCount();
          return;
        }
        if (!window.__bvTicker) {
          window.__bvTicker = true;
          var frame0 = gsap.ticker.frame;
          setTimeout(function () {
            if (gsap.ticker.frame - frame0 < 2) {
              gsap.ticker.remove(gsap.updateRoot);
              var t = gsap.ticker.time;
              setInterval(function () { t += 1 / 30; gsap.updateRoot(t); }, 33);
            }
          }, 320);
        }
        var tl = gsap.timeline({ paused: true });
        var counter = { v: 0 };
        var SCENE = [g.lines, g.dots, g.labels, g.core, g.miss, g.user];

        tl.set(SCENE.concat([g.hud]), { opacity: 1 })
          .set(lineEls, { attr: { 'stroke-dashoffset': function (i, t) { return t._len; } }, stroke: C.muted, opacity: 0.55 })
          .set(dotEls, { opacity: 0, scale: 0.4, fill: C.muted, transformOrigin: 'center' })
          .set(labelEls, { opacity: 0, x: function (i, t) { return t._dir; } })
          .set(countWrap, { opacity: 0 })
          .set([coreRing, coreDot, coreLabel], { opacity: 0 })
          .set(stub, { attr: { 'stroke-dashoffset': stubLen }, opacity: 0 })
          .set(missLabel, { opacity: 0, x: 6 })
          .set([uDot, uLabel], { opacity: 0 })
          .set(seekEls, { opacity: 0, y: 8 })
          .set([uPulse1, uPulse2], { opacity: 0, scale: 1, transformOrigin: 'center' })
          .call(function () { counter.v = 0; countNum.textContent = '0'; lastLen = -1; layoutCount(); });

        tl.to([coreDot, coreRing, coreLabel], { opacity: 1, duration: 0.35, stagger: 0.04 }, 0.12)
          .to(countWrap, { opacity: 1, duration: 0.3 }, 0.4);

        var T0 = 0.55, STEP = 0.012;
        lineEls.forEach(function (ln, i) {
          var t = T0 + i * STEP;
          tl.to(ln, { attr: { 'stroke-dashoffset': 0 }, duration: 0.2, ease: 'power2.out' }, t)
            .to(dotEls[i], { opacity: 1, scale: 1, duration: 0.1, ease: 'back.out(2.2)' }, t + 0.18)
            .to(dotEls[i], { fill: C.light, scale: 0.85, duration: 0.3 }, t + 0.38)
            .to(ln, { opacity: 0.16, duration: 0.35 }, t + 0.38);
        });
        labelEls.forEach(function (p) {
          var t = T0 + p._i * STEP + 0.22;
          tl.to(p, { opacity: 1, x: 0, duration: 0.24, ease: 'power2.out' }, t)
            .to(p, { opacity: 0.42, duration: 0.5 }, t + 0.7);
        });
        tl.to(counter, {
          v: 99, duration: 1.5, ease: 'power1.inOut',
          onUpdate: function () { countNum.textContent = String(Math.round(counter.v)); layoutCount(); }
        }, T0 + 0.25);

        var T_ASH = 2.3;
        tl.to(lineEls, { opacity: 0.08, duration: 0.7, ease: 'power1.inOut' }, T_ASH)
          .to(dotEls, { opacity: 0.30, duration: 0.7, ease: 'power1.inOut' }, T_ASH)
          .to(labelEls, { opacity: 0.14, duration: 0.7 }, T_ASH)
          .to([coreDot, coreRing, coreLabel], { opacity: 0.20, duration: 0.7 }, T_ASH);

        var T_USER = 2.7;
        tl.fromTo(uDot, { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(2.6)', transformOrigin: 'center' }, T_USER)
          .to(uLabel, { opacity: 1, x: 0, duration: 0.35, ease: 'power2.out' }, T_USER + 0.12);

        var T_STUB = 3.3;
        tl.to(stub, { opacity: 1, duration: 0.22 }, T_STUB)
          .to(stub, { attr: { 'stroke-dashoffset': 0 }, duration: 0.7, ease: 'power2.out' }, T_STUB)
          .to(missLabel, { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' }, T_STUB + 0.5);

        [uPulse1, uPulse2].forEach(function (ring, k) {
          tl.fromTo(ring, { scale: 1, opacity: 0.7 },
            { scale: 7, opacity: 0, duration: 1.4, ease: 'power2.out', transformOrigin: 'center' }, 4.0 + k * 0.9);
        });

        var T_SEEK = 4.4;
        tl.to(seekEls, { opacity: 1, y: 0, duration: 0.3, stagger: 0.26, ease: 'power2.out' }, T_SEEK);

        self._tl = tl;
        self.restart = function () { tl.restart(); };

        var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduced) { tl.pause(); tl.seek(T_SEEK + 1.6, false); return; }
        if ('IntersectionObserver' in window) {
          if (self._io) self._io.disconnect();
          self._io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) { if (e.isIntersecting) tl.play(); });
          }, { threshold: 0.15 });
          self._io.observe(self);
        } else tl.play();
      });
    }
  }

  if (!window.customElements.get('bonia-void')) window.customElements.define('bonia-void', BoniaVoid);
})();

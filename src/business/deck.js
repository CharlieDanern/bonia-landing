/* Deck engine for the /business scroll narrative.
 *
 * Ported from the handoff prototype. Two constraints from that prototype are
 * load-bearing and must survive any refactor:
 *
 *  1. Scroll-snap containers cancel scrollTo({behavior:"smooth"}), so
 *     programmatic navigation tweens scrollTop on a timer with snapping
 *     temporarily suspended. requestAnimationFrame does not fire in every
 *     embedding context, hence the interval rather than rAF.
 *  2. Only the settled-scroll handler may start a frame's animation. If
 *     animations fired on navigation intent instead, a frame scrolled past
 *     would burn its timeline off-screen and look already-finished on arrival.
 *
 * Reveal is attribute-driven: [data-in="fade|up|left|right"] with an optional
 * [data-delay] in ms, plus the per-frame sets [data-fd], [data-fl], [data-cta]
 * and [data-pt]. The frame components carry those attributes; renaming them
 * there silently disables the animation here.
 */

const REDUCED = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export class Deck {
  constructor(root) {
    this.deck = root;
    this.ctl = new AbortController();
    this.timers = [];
    this.i = -1;
    this.reduced = REDUCED();
    this.frames = Array.from(root.querySelectorAll("[data-f]"));
    this.boot();
  }

  boot() {
    const deck = this.deck;
    const sig = this.ctl.signal;

    const stepTo = (dir) =>
      this.goTo(
        Math.max(0, Math.min(this.frames.length - 1, this.index() + dir)),
      );

    // Discrete inputs (keys, touch swipes) fire once per intent, so a short
    // time lock is the right guard — it only stops key auto-repeat running
    // away.
    let lock = 0;
    const step = (dir) => {
      const now = Date.now();
      if (now < lock) return;
      lock = now + 720;
      stepTo(dir);
    };

    // A wheel gesture is continuous, not discrete: one trackpad flick keeps
    // emitting events for as long as its momentum lasts, routinely more than
    // a second. A time lock therefore re-fires mid-gesture and skips frames —
    // measured at 2 frames for a 30-notch flick and 6 for a 120-notch one.
    // So arm on the first event of a gesture and re-arm only once the wheel
    // has been quiet, which makes one gesture mean exactly one frame however
    // hard it is thrown.
    //
    // The quiet window has to be longer than the largest gap *within* a
    // gesture, not just a fast flick's. A slow deliberate two-finger crawl
    // emits events ~300ms apart; at a 220ms window every one of those looked
    // like a fresh gesture and it ran through 6 frames. 400ms covers the
    // crawl while still feeling immediate. MIN_STEP_MS is a second floor so
    // that even an input pattern slower than the window cannot double-step.
    const GESTURE_END_MS = 400;
    const MIN_STEP_MS = 600;
    let armed = true;
    let lastStep = 0;
    const wheelStep = (dir) => {
      clearTimeout(this._quiet);
      this._quiet = setTimeout(() => {
        armed = true;
      }, GESTURE_END_MS);
      if (!armed) return;
      if (Date.now() - lastStep < MIN_STEP_MS) return;
      armed = false;
      lastStep = Date.now();
      stepTo(dir);
    };

    // A cancelable wheel event becomes exactly one frame step, so a trackpad's
    // inertia cannot skip frames.
    deck.addEventListener(
      "wheel",
      (e) => {
        // A frame that scrolls internally (see fitTall) owns its own wheel
        // until it reaches an edge.
        if (this.scrollingInside(e.target, e.deltaY)) return;
        // Cancel EVERY event, including the sub-pixel ones a trackpad emits as
        // the fingers start moving. Letting even one through hands the gesture
        // to the compositor, and Chrome then refuses to cancel the rest of it —
        // which is how a single flick used to run through several frames no
        // matter what this handler did afterwards.
        if (e.cancelable) e.preventDefault();
        if (Math.abs(e.deltaY) < 6) return;
        wheelStep(e.deltaY > 0 ? 1 : -1);
      },
      { passive: false, signal: sig },
    );

    const keys = (e) => {
      const k = e.key;
      if (k === "ArrowDown" || k === "PageDown" || k === " ") {
        e.preventDefault();
        step(1);
      } else if (k === "ArrowUp" || k === "PageUp") {
        e.preventDefault();
        step(-1);
      } else if (k === "Home") this.goTo(0);
      else if (k === "End") this.goTo(this.frames.length - 1);
    };
    deck.addEventListener("keydown", keys, { signal: sig });
    window.addEventListener("keydown", keys, { signal: sig });
    deck.setAttribute("tabindex", "-1");

    let y0 = null;
    deck.addEventListener(
      "touchstart",
      (e) => {
        y0 = e.touches[0].clientY;
      },
      { passive: true, signal: sig },
    );
    deck.addEventListener(
      "touchend",
      (e) => {
        if (y0 == null) return;
        const dy = y0 - e.changedTouches[0].clientY;
        if (Math.abs(dy) > 42 && !this.scrollingInside(e.target, dy))
          step(dy > 0 ? 1 : -1);
        y0 = null;
      },
      { passive: true, signal: sig },
    );

    deck.addEventListener(
      "scroll",
      () => {
        clearTimeout(this._st);
        this._st = setTimeout(() => {
          const n = this.index();
          if (Math.abs(deck.scrollTop - n * deck.clientHeight) < 8)
            this.activate(n);
        }, 130);
      },
      { passive: true, signal: sig },
    );

    const onResize = () => {
      this.fitNav();
      this.fitPhone();
      this.fitTall();
    };
    window.addEventListener("resize", onResize, { passive: true, signal: sig });

    // Belt and braces for the same problem: with the container not natively
    // scrollable, no gesture can move it at all and every transition goes
    // through goTo(), so one gesture can only ever produce one frame step.
    // scrollTop still works programmatically on an overflow:hidden element.
    //
    // Deliberately done here rather than in the JSX: if this script fails to
    // boot, the markup is left natively scrollable and snapped, so the page
    // degrades to a plain scroller instead of freezing.
    deck.style.overflowY = "hidden";
    deck.style.scrollSnapType = "none";

    this.buildRail();
    this.buildHero();
    this.fitNav();
    this.fitPhone();
    this.fitTall();
    this.watchTall();
    setTimeout(() => {
      this.fitNav();
      this.fitPhone();
      this.fitTall();
    }, 80);
    this.frames.forEach((f) => this.arm(f));

    // Hiding happens only after handlers and the rail are live, so a failure
    // above can never leave the deck blank and unnavigable.
    const start = Math.max(
      0,
      Math.min(
        this.frames.length - 1,
        Math.round(deck.scrollTop / (deck.clientHeight || 1)) || 0,
      ),
    );
    this.frames.forEach((f, k) => {
      if (k !== start) this.reset(f);
    });
    this.activate(start);
  }

  destroy() {
    this.ctl.abort();
    this.timers.forEach(clearTimeout);
    this.timers = [];
    clearInterval(this._iv);
    clearTimeout(this._fin);
    clearTimeout(this._st);
    clearTimeout(this._quiet);
    this.frames.forEach((f) => clearInterval(f.__cy));
  }

  index() {
    const h = this.deck.clientHeight || 1;
    return Math.round(this.deck.scrollTop / h);
  }

  /* A frame marked [data-fit="scroll"] is taller than the viewport on short
   * screens and scrolls internally. While it is mid-scroll the deck must not
   * steal the gesture, or the user can never reach its lower half. */
  scrollingInside(target, dir) {
    const host = target?.closest?.('[data-fit="scroll"]');
    if (!host || host.scrollHeight <= host.clientHeight + 2) return false;
    const atTop = host.scrollTop <= 0;
    const atEnd = host.scrollTop + host.clientHeight >= host.scrollHeight - 1;
    return dir > 0 ? !atEnd : !atTop;
  }

  /* The prototype clipped every frame at 100dvh. Frame 07 carries both CTA
   * columns, the store badges and the whole site footer, and genuinely does
   * not fit on a short phone — measured at 375x667 the footer rule cut
   * through the Google Play badge. Frames that opt in with data-fit="scroll"
   * get internal scrolling only when their content actually overflows, so
   * tall screens are untouched.
   *
   * Measuring once at boot is not enough: the webfonts (Source Serif 4 /
   * Inter / JetBrains Mono) land well after first paint, and the text grows
   * when they do. Measured with fallback metrics the footer frame fits, so a
   * boot-time-only check concluded "no overflow" and clipped it anyway. Hence
   * the fonts.ready hook and the ResizeObserver below. */
  fitTall() {
    this.deck.querySelectorAll('[data-fit="scroll"]').forEach((f) => {
      // Remember the authored layout once, so "fits" can restore it exactly.
      if (!f.__fit) {
        f.__fit = {
          alignItems: f.style.alignItems,
          kids: Array.from(f.children).map((c) => ({ el: c, flex: c.style.flex })),
        };
      }

      // Measure in "natural" mode. A child authored `flex: 1; min-height: 0`
      // is squeezed to the section height and overflows *inside itself* —
      // which the section's scrollHeight cannot see, so measuring as-authored
      // reports "fits" while the footer visibly cuts through the badge above
      // it. Releasing the flex and top-aligning first makes scrollHeight the
      // true content height.
      f.style.overflowY = "auto";
      f.style.alignItems = "flex-start";
      f.__fit.kids.forEach(({ el }) => {
        el.style.flex = "0 0 auto";
      });

      if (f.scrollHeight <= f.clientHeight + 2) {
        // It fits after all — put the authored layout back untouched.
        f.style.overflowY = "hidden";
        f.style.alignItems = f.__fit.alignItems;
        f.__fit.kids.forEach(({ el, flex }) => {
          el.style.flex = flex;
        });
      }
    });
  }

  /* The nav is fixed and overlays every frame. Its height is driven by the
   * logo (min 34px) plus padding, so on a phone it is ~62px tall while the
   * frames' authored top padding bottoms out around 24-53px — which put
   * "Cam kết của Bonia", "Dành cho Banker" and frame 03's eyebrow underneath
   * the logo. Raise the top padding to clear it, never lower it.
   *
   * Frames 0 and 1 are skipped: the hero centres its own content well below
   * the nav, and frame 1 is a full-bleed SVG canvas that padding would shrink. */
  fitNav() {
    const nav = this.deck.querySelector("nav");
    if (!nav) return;
    const clear = Math.ceil(nav.getBoundingClientRect().bottom) + 10;
    this.frames.forEach((f) => {
      const n = f.getAttribute("data-f");
      if (n === "0" || n === "1") return;
      // Re-read the authored value each time rather than caching it: it is a
      // clamp() and changes with the viewport.
      f.style.paddingTop = "";
      const authored = parseFloat(getComputedStyle(f).paddingTop) || 0;
      if (clear > authored) f.style.paddingTop = clear + "px";
    });
  }

  /* Re-measure whenever anything that changes content height happens. */
  watchTall() {
    const targets = Array.from(
      this.deck.querySelectorAll('[data-fit="scroll"]'),
    );
    if (!targets.length) return;

    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!this.ctl.signal.aborted) this.fitTall();
      });
    }

    if (typeof ResizeObserver === "function") {
      // The frames are a fixed 100dvh so they never resize themselves; it is
      // their content that grows. Observe the children.
      this.ro = new ResizeObserver(() => this.fitTall());
      targets.forEach((f) =>
        Array.from(f.children).forEach((c) => this.ro.observe(c)),
      );
      this.ctl.signal.addEventListener("abort", () => this.ro?.disconnect());
    }
  }

  goTo(n) {
    const deck = this.deck;
    if (!deck || !deck.isConnected) return;
    clearInterval(this._iv);
    clearTimeout(this._fin);
    const h = deck.clientHeight;
    const target = Math.max(0, Math.min((this.frames.length - 1) * h, n * h));
    const from = deck.scrollTop;
    const land = () => {
      clearInterval(this._iv);
      deck.scrollTop = target;
      this.activate(n);
    };
    if (this.reduced || Math.abs(target - from) < 2) {
      land();
      return;
    }
    const t0 = Date.now();
    const dur = 430;
    this._iv = setInterval(() => {
      const p = Math.min(1, (Date.now() - t0) / dur);
      const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      deck.scrollTop = from + (target - from) * e;
      if (p >= 1) land();
    }, 16);
    this._fin = setTimeout(land, dur + 140);
  }

  /* The hero field needs ~24 card faces; clone them from the one hidden set
   * rather than inlining every copy. */
  buildHero() {
    const src = this.deck.querySelector("[data-cardsrc]");
    const lanes = this.deck.querySelectorAll("[data-lane]");
    if (!src || !lanes.length) return;
    const protos = Array.from(src.children);
    if (!protos.length) return;
    lanes.forEach((lane) => {
      lane.textContent = "";
      const order = (lane.getAttribute("data-lane") || "")
        .split(",")
        .map(Number);
      const accent = parseInt(lane.getAttribute("data-accent") || "-1", 10);
      for (let pass = 0; pass < 3; pass++) {
        order.forEach((idx, k) => {
          const cell = document.createElement("div");
          cell.style.cssText =
            "position:relative;flex:none;margin-right:clamp(24px,3.2vw,62px);width:clamp(266px,44vh,520px);height:clamp(168px,27.7vh,328px);opacity:" +
            (k === accent ? "1" : "0.82") +
            ";animation:bnCell " +
            (9 + ((idx * 3 + k) % 5) * 1.6) +
            "s ease-in-out infinite " +
            (-(idx * 1.7 + k * 0.9)).toFixed(1) +
            "s";
          cell.appendChild(protos[idx % protos.length].cloneNode(true));
          lane.appendChild(cell);
        });
      }
    });
  }

  /* The phone mock is authored at the canonical 300x568 from the portal's
   * Mirror.jsx (PhonePreview), so every inner value is the app's literal
   * figure. It is scaled as a whole to fit rather than re-sizing its parts. */
  fitPhone() {
    const box = this.deck.querySelector("[data-phonebox]");
    if (!box) return;
    const sec = box.closest("[data-f]");
    if (!sec || !sec.clientHeight) return;
    const cs = getComputedStyle(sec);
    const avail =
      sec.clientHeight -
      parseFloat(cs.paddingTop) -
      parseFloat(cs.paddingBottom) -
      58;
    const s = Math.max(
      0.4,
      Math.min(1, avail / 568, (sec.clientWidth * 0.34) / 300),
    );
    document.documentElement.style.setProperty("--ph-scale", s.toFixed(3));
  }

  buildRail() {
    const rail = this.deck.querySelector("[data-rail]");
    if (!rail) return;
    rail.textContent = "";
    const box = document.createElement("div");
    box.style.cssText = "display:flex;flex-direction:column;gap:10px";
    rail.appendChild(box);
    this.dots = this.frames.map((f, n) => {
      const d = document.createElement("button");
      d.type = "button";
      d.setAttribute("aria-label", "Khung " + (n + 1));
      d.style.cssText =
        "width:7px;height:7px;padding:0;border:0;border-radius:50%;cursor:pointer;background:currentColor;opacity:.28;transition:opacity .4s ease,transform .4s ease";
      d.addEventListener("click", () => this.goTo(n), { signal: this.ctl.signal });
      box.appendChild(d);
      return d;
    });
    this.rail = rail;
  }

  arm(frame) {
    frame.querySelectorAll("[data-in]").forEach((el) => {
      if (!el.dataset.t0) {
        el.dataset.t0 = el.getAttribute("data-in");
        el.style.transition =
          "opacity .75s cubic-bezier(.2,.6,.2,1), transform .85s cubic-bezier(.2,.6,.2,1)";
      }
    });
  }

  hidden(kind) {
    if (kind === "left") return "translate3d(-26px,0,0)";
    if (kind === "right") return "translate3d(26px,0,0)";
    if (kind === "up") return "translate3d(0,26px,0)";
    return "none";
  }

  reset(frame) {
    if (this.reduced) return this.play(frame);
    frame.querySelectorAll("[data-in]").forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = this.hidden(el.dataset.t0);
    });
    const f = frame.getAttribute("data-f");
    if (f === "2") frame.__t0 = Date.now();

    if (f === "3") {
      const fee = frame.querySelector("[data-x=fee]");
      if (fee) {
        fee.style.opacity = "0";
        fee.style.transform = "scale(1.04)";
      }
      const pts = frame.querySelector("[data-x=pts]");
      if (pts) pts.style.opacity = "0";
      frame.querySelectorAll("[data-pt]").forEach((el) => {
        el.style.opacity = "0";
        el.style.transform = "translate3d(0,14px,0)";
      });
    }

    if (f === "4") {
      const b0 = frame.querySelector("[data-blur]");
      if (b0) {
        b0.style.transition = "none";
        b0.style.filter = "blur(0px)";
      }
      frame.querySelectorAll("[data-fd]").forEach((el) => {
        el.style.opacity = "0";
        el.style.transform = "translate3d(0,26px,0)";
      });
      frame.querySelectorAll("[data-fl]").forEach((el) => {
        el.style.opacity = "0";
        el.style.transform = "translate3d(0,14px,0)";
      });
    }

    if (f === "6") {
      frame.querySelectorAll("[data-cta]").forEach((el) => {
        el.style.opacity = "0";
        el.style.transform = "translate3d(0,16px,0)";
      });
    }
  }

  play(frame) {
    const t = (ms, fn) => {
      this.timers.push(setTimeout(fn, this.reduced ? 0 : ms));
    };
    frame.querySelectorAll("[data-in]").forEach((el) => {
      const d = parseInt(el.getAttribute("data-delay") || "0", 10);
      t(d, () => {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
    });

    const f = frame.getAttribute("data-f");

    if (f === "1") {
      const v = frame.querySelector("bonia-void");
      if (v && v.restart) v.restart();
    }

    if (f === "2") {
      // Phase-driven and idempotent: state is derived from one counter on the
      // frame element, so a cleared timer bag or a re-entry can never strand
      // it mid-cycle the way a chain of setTimeouts did.
      const scr = frame.querySelectorAll("[data-scr]");
      const tap = frame.querySelector("[data-tap]");
      const ring = frame.querySelector("[data-ring]");
      const bub = frame.querySelector("[data-bubble]");
      const rep = frame.querySelector("[data-reply]");
      const typ = frame.querySelector("[data-typing]");
      const at = (el, on) => {
        if (el) el.style.opacity = on ? "1" : "0";
      };
      const render = (ph) => {
        const n = ph < 2300 ? 0 : ph < 5800 ? 1 : 2;
        scr.forEach((el, k) => {
          el.style.opacity = k === n ? "1" : "0";
          el.style.transform =
            k === n ? "none" : "translateX(" + (k < n ? -6 : 6) + "%)";
        });
        const tapped = ph >= 1000;
        if (tap) {
          tap.style.background = tapped ? "#00A76F" : "#FFFFFF";
          tap.style.color = tapped ? "#FFFFFF" : "#1B2236";
          const want = tapped ? "✓ Đã quan tâm" : "Quan tâm";
          if (tap.textContent !== want) tap.textContent = want;
        }
        if (ring) {
          const live = ph >= 500 && ph < 1000;
          ring.style.opacity = live ? "1" : "0";
          ring.style.transform = live ? "scale(2)" : "scale(.6)";
        }
        at(typ, ph >= 2800 && ph < 3800);
        at(bub, ph >= 3800);
        at(rep, ph >= 4600);
      };
      clearInterval(frame.__cy);
      frame.__t0 = Date.now();
      render(0);
      if (!this.reduced) {
        frame.__cy = setInterval(() => {
          frame.__ph = (Date.now() - frame.__t0) % 10200;
          render(frame.__ph);
        }, 100);
      } else render(6000);
    }

    if (f === "3") {
      const fee = frame.querySelector("[data-x=fee]");
      const pts = frame.querySelector("[data-x=pts]");
      const rows = frame.querySelectorAll("[data-pt]");
      if (fee) {
        fee.style.opacity = "0";
        fee.style.transform = "scale(1.04)";
      }
      if (pts) pts.style.opacity = "0";
      rows.forEach((el) => {
        el.style.opacity = "0";
        el.style.transform = "translate3d(0,14px,0)";
      });
      t(120, () => {
        if (fee) {
          fee.style.opacity = "1";
          fee.style.transform = "scale(1)";
        }
      });
      t(1500, () => {
        if (fee) fee.style.transform = "scale(0.62)";
      });
      t(1850, () => {
        if (pts) pts.style.opacity = "1";
      });
      rows.forEach((el) => {
        const d = parseInt(el.getAttribute("data-delay") || "0", 10);
        t(1900 + d, () => {
          el.style.opacity = "1";
          el.style.transform = "none";
        });
      });
    }

    if (f === "4") {
      const blur = frame.querySelector("[data-blur]");
      if (blur) {
        blur.style.transition = "none";
        blur.style.filter = "blur(0px)";
        t(1400, () => {
          blur.style.transition = "filter 1.4s cubic-bezier(.35,0,.6,1)";
          blur.style.filter = "blur(0.055em)";
        });
      }
      const disp = frame.querySelectorAll("[data-fd]");
      const lines = frame.querySelectorAll("[data-fl]");
      disp.forEach((el) => {
        el.style.opacity = "0";
        el.style.transform = "translate3d(0,26px,0)";
      });
      lines.forEach((el) => {
        el.style.opacity = "0";
        el.style.transform = "translate3d(0,14px,0)";
      });
      const go = (el) => {
        const d = parseInt(el.getAttribute("data-delay") || "0", 10);
        t(d + 120, () => {
          el.style.opacity = "1";
          el.style.transform = "none";
        });
      };
      disp.forEach(go);
      lines.forEach(go);
    }

    if (f === "6") {
      frame.querySelectorAll("[data-cta]").forEach((el) => {
        el.style.opacity = "0";
        el.style.transform = "translate3d(0,16px,0)";
        const d = parseInt(el.getAttribute("data-delay") || "0", 10);
        t(d + 120, () => {
          el.style.opacity = "1";
          el.style.transform = "none";
        });
      });
    }
  }

  activate(n) {
    if (n === this.i || !this.frames[n]) return;
    this.timers.forEach(clearTimeout);
    this.timers = [];
    if (this.frames[this.i]) this.reset(this.frames[this.i]);
    this.i = n;
    this.play(this.frames[n]);

    if (this.rail) this.rail.style.color = "#1F1B16";
    (this.dots || []).forEach((d, k) => {
      d.style.opacity = k === n ? "1" : ".28";
      d.style.transform = k === n ? "scale(1.6)" : "scale(1)";
    });
  }
}

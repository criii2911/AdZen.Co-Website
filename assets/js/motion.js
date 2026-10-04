/* =============================================================
   AdZen.co — Scroll & motion system
   -------------------------------------------------------------
   One small engine that owns every scroll-linked effect on the page.

   WHAT IT DOES
   - Smooth scrolling (Lenis, self-hosted, ~5KB gz) on fine-pointer
     devices only. Touch devices keep native momentum scrolling —
     faking it there is always worse than the OS.
   - ONE requestAnimationFrame loop for everything, which sleeps
     when scrolling stops (no idle cost).
   - Scrubbed (position-linked, fully reversible) motion:
       hero exit        pinned hero recedes as the next section slides over
       data-m="card"    3D tilt/rise/fade entrance, + column parallax
       data-m="parallax" decorative depth layers
       process rail     pinned on desktop, step-by-step fill
   - One-shot choreographed reveals (IntersectionObserver, batch-staggered)
   - Scroll progress hairline + scroll-spy for the nav.

   PERFORMANCE RULES (all enforced here)
   - Geometry is measured ONCE (and on resize), never per frame.
     Per-frame work is arithmetic + transform/opacity writes only —
     zero layout reads, zero layout thrash.
   - Writes are skipped when the computed value didn't change.
   - will-change is applied only while an element is near the viewport.
   - Blur is limited to the hero exit, on fine-pointer desktops only.
   - Everything is skipped under prefers-reduced-motion.
   - Nothing here reacts to the cursor.
   ============================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mqFine = window.matchMedia('(hover:hover) and (pointer:fine)');
  var mqDesk = window.matchMedia('(min-width:1024px)');
  var mqPin = window.matchMedia('(min-width:1024px) and (min-height:560px)');
  var reduce = mqReduce.matches;

  var api = window.AdZenMotion = { heroProgress: 0, handlesSpy: true, lenis: null };

  var clamp = function (v, a, b) { return v < a ? a : (v > b ? b : v); };
  var easeOut = function (t) { var u = 1 - t; return 1 - u * u * u; };
  var smooth = function (t) { return t * t * (3 - 2 * t); };
  var expo = function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); };

  /* ---------- state ---------- */
  var lenis = null;
  var vh = window.innerHeight, docH = 0;
  var lastY = -1, dirty = true, rafId = 0, idle = 0;
  var K = 1;                       // amplitude scale: 1 desktop, .6 smaller screens
  var blurOK = false;              // blur only on fine-pointer desktops
  var pinned = false;

  var heroEl, heroCopy, heroVisual, heroAurora, heroGrid, heroH = 0, heroS0 = 0;
  var heroKey = '', heroCovered = false;
  var bar, spy = [], spyActive = -1;
  var cards = [], decor = [], steps = [], pinEl = null, pinInner = null, pinTop = 0, pinH = 0, pinInnerH = 0, pinStick = 0;
  var masonry = null, mTop = 0, mH = 0;
  var countEl = null, countIdx = -1;

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  /* ============================================================
     1. ONE-SHOT REVEALS (batch-staggered)
     ============================================================ */
  function initReveals() {
    var groups = $$('[data-reveal-stagger]');
    groups.forEach(function (g) {
      Array.prototype.forEach.call(g.children, function (c, i) { c.style.setProperty('--i', i); });
    });
    var els = $$('[data-reveal], [data-reveal-stagger]');
    if (reduce || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      var vis = entries.filter(function (e) { return e.isIntersecting; });
      vis.sort(function (a, b) {
        var ra = a.boundingClientRect, rb = b.boundingClientRect;
        return (ra.top - rb.top) || (ra.left - rb.left);
      });
      vis.forEach(function (en, k) {
        // entries that appear in the same frame cascade instead of popping together
        en.target.style.setProperty('--d', Math.min(k, 4) * 80 + 'ms');
        en.target.classList.add('is-visible');
        io.unobserve(en.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ============================================================
     2. MEASURE (once + on resize) — the only place layout is read
     ============================================================ */
  function docTop(el) { var r = el.getBoundingClientRect(); return r.top + window.pageYOffset; }

  function measure() {
    var y = window.pageYOffset;
    vh = window.innerHeight;
    var desk = mqDesk.matches;
    K = desk ? 1 : 0.6;
    blurOK = desk && mqFine.matches;
    pinned = mqPin.matches && !!pinEl && !reduce;
    docH = Math.max(document.body.scrollHeight, root.scrollHeight);

    /* pass 1 — write: neutralise our own transforms so rects are clean */
    cards.forEach(function (c) { c.saved = c.el.style.transform; if (c.saved) c.el.style.transform = ''; });
    decor.forEach(function (d) { d.saved = d.el.style.transform; if (d.saved) d.el.style.transform = ''; });

    /* pass 2 — read (single layout) */
    cards.forEach(function (c) {
      var r = c.el.getBoundingClientRect();
      c.hidden = r.width === 0 && r.height === 0;
      c.top = r.top + y; c.h = r.height; c.left = Math.round(r.left);
    });
    decor.forEach(function (d) {
      var r = d.el.getBoundingClientRect(); d.top = r.top + y; d.h = r.height;
    });
    steps.forEach(function (s) { s.top = docTop(s.el); });
    spy.forEach(function (s) { s.top = docTop(s.section); });
    if (masonry) { mTop = docTop(masonry); mH = masonry.offsetHeight; }
    if (pinEl) {
      pinTop = docTop(pinEl); pinH = pinEl.offsetHeight;
      pinInnerH = pinInner ? pinInner.offsetHeight : 0;
      // resolved sticky offset in px (e.g. max(header+3rem, 32vh))
      pinStick = pinInner ? (parseFloat(getComputedStyle(pinInner).top) || 0) : 0;
    }
    if (heroEl) {
      heroH = heroEl.offsetHeight;
      heroS0 = Math.max(0, heroH - vh);
      // If the hero is taller than the viewport it sticks by its BOTTOM edge,
      // so none of its content is ever unreachable.
      heroEl.style.setProperty('--hero-top', Math.min(0, vh - heroH) + 'px');
    }

    /* pass 3 — write: restore */
    cards.forEach(function (c) { if (c.saved) c.el.style.transform = c.saved; });
    decor.forEach(function (d) { if (d.saved) d.el.style.transform = d.saved; });

    /* column index per card, grouped by parent (grid / masonry) */
    var byParent = [];
    cards.forEach(function (c) {
      if (c.hidden) return;
      var g = null;
      for (var i = 0; i < byParent.length; i++) if (byParent[i].p === c.el.parentElement) { g = byParent[i]; break; }
      if (!g) { g = { p: c.el.parentElement, lefts: [] }; byParent.push(g); }
      if (g.lefts.indexOf(c.left) === -1) g.lefts.push(c.left);
    });
    cards.forEach(function (c) {
      if (c.hidden) return;
      var g = byParent.filter(function (b) { return b.p === c.el.parentElement; })[0];
      var lefts = g.lefts.slice().sort(function (a, b) { return a - b; });
      c.col = lefts.indexOf(c.left);
      c.cols = lefts.length;
      // staggered column parallax only on the masonry (uniform per column,
      // so neighbouring items in a column can never overlap)
      var amps = c.cols >= 3 ? [0, 64, 30] : (c.cols === 2 ? [0, 42] : [0]);
      c.amp = c.shift ? (amps[c.col] || 0) : 0;
    });

    lastY = -1; dirty = true;
    return y;
  }

  /* ============================================================
     3. RENDER — arithmetic + transform/opacity writes only
     ============================================================ */
  function render(y) {
    /* progress hairline */
    if (bar) {
      var max = docH - vh;
      bar.style.transform = 'scaleX(' + (max > 0 ? clamp(y / max, 0, 1).toFixed(4) : 0) + ')';
    }

    /* scroll-spy (deterministic: last section whose top passed the 40% line) */
    if (spy.length) {
      var idx = 0, line = y + vh * 0.4;
      for (var i = 0; i < spy.length; i++) if (spy[i].top <= line + 1) idx = i;
      if (y + vh >= docH - 4) idx = spy.length - 1;
      if (idx !== spyActive) {
        spy.forEach(function (s, j) { s.link.classList.toggle('is-active', j === idx); });
        spyActive = idx;
      }
    }

    if (reduce) return;

    /* hero — pinned; recedes while the next section slides over it */
    if (heroEl) {
      api.heroProgress = clamp(y / (heroH || 1), 0, 1);
      var covered = y > heroH + 24;
      if (covered !== heroCovered) {
        heroCovered = covered;
        heroEl.classList.toggle('is-covered', covered);
        if (window.__hero3d && window.__hero3d.suspend) window.__hero3d.suspend(covered);
      }
      var hp = clamp((y - heroS0) / (vh * 0.95), 0, 1);
      var q = smooth(hp);
      var key = q.toFixed(3) + (blurOK ? 'b' : '');
      if (key !== heroKey) {
        heroKey = key;
        if (heroCopy) {
          if (q === 0) { heroCopy.style.transform = ''; heroCopy.style.opacity = ''; heroCopy.style.filter = ''; }
          else {
            heroCopy.style.transform = 'translate3d(0,' + (-q * 64).toFixed(1) + 'px,0) scale(' + (1 - q * 0.07).toFixed(4) + ')';
            heroCopy.style.opacity = clamp(1 - q * 1.35, 0, 1).toFixed(3);
            heroCopy.style.filter = (blurOK && q > 0.02) ? 'blur(' + (q * 9).toFixed(1) + 'px)' : '';
          }
        }
        if (heroVisual) {
          if (q === 0) { heroVisual.style.transform = ''; heroVisual.style.opacity = ''; }
          else {
            heroVisual.style.transform = 'perspective(1400px) translate3d(0,' + (-q * 90).toFixed(1) + 'px,0) rotateX(' + (q * 9).toFixed(2) + 'deg) scale(' + (1 - q * 0.12).toFixed(4) + ')';
            heroVisual.style.opacity = clamp(1 - q * 1.2, 0, 1).toFixed(3);
          }
        }
        if (heroAurora) heroAurora.style.transform = q === 0 ? '' : 'translate3d(0,' + (q * 90).toFixed(1) + 'px,0) scale(' + (1 + q * 0.1).toFixed(4) + ')';
        if (heroGrid) heroGrid.style.transform = q === 0 ? '' : 'translate3d(0,' + (q * 36).toFixed(1) + 'px,0)';
      }
    }

    /* masonry-wide progress (for uniform column drift) */
    var P = masonry ? clamp((y + vh * 0.5 - mTop) / (mH || 1), 0, 1) : 0;

    /* cards — 3D entrance, scrubbed, reversible */
    for (var n = 0; n < cards.length; n++) {
      var c = cards[n];
      if (c.hidden) continue;
      var near = c.top - vh - 160 < y && c.top + c.h + 160 > y;
      if (near !== c.near) { c.near = near; c.el.style.willChange = near ? 'transform, opacity' : ''; }

      var start = c.top - vh * 0.95 + (c.col || 0) * 36;
      var e = easeOut(clamp((y - start) / (vh * 0.5), 0, 1));
      var sh = c.amp ? -P * c.amp : 0;
      var ck = e.toFixed(3) + '|' + sh.toFixed(1);
      if (ck === c.key) continue;
      c.key = ck;
      if (e >= 1) {
        c.el.style.opacity = '';
        c.el.style.transform = sh ? 'translate3d(0,' + sh.toFixed(1) + 'px,0)' : '';
      } else {
        var u = 1 - e;
        c.el.style.opacity = clamp(e * 1.7, 0, 1).toFixed(3);
        c.el.style.transform = 'perspective(1200px) translate3d(0,' + (u * 84 * K + sh).toFixed(1) + 'px,0) rotateX(' + (u * 16 * K).toFixed(2) + 'deg) scale(' + (1 - u * 0.06).toFixed(4) + ')';
      }
    }

    /* decorative depth layers */
    for (var m = 0; m < decor.length; m++) {
      var d = decor[m];
      var pp = clamp((y + vh - d.top) / (vh + d.h), 0, 1);
      var ty = ((0.5 - pp) * d.speed * vh).toFixed(1);
      if (ty !== d.key) { d.key = ty; d.el.style.transform = 'translate3d(0,' + ty + 'px,0)'; }
    }

    /* process rail */
    if (steps.length) {
      var pq = 0;
      if (pinned) {
        // the rail sticks when its top reaches pinStick and releases after (container - pinned block) px
        var p = clamp((y - (pinTop - pinStick)) / Math.max(1, pinH - pinInnerH), 0, 1);
        pq = clamp(p * 1.12, 0, 1) * steps.length;
      }
      for (var s = 0; s < steps.length; s++) {
        var st = steps[s];
        var f = pinned ? clamp(pq - s, 0, 1) : clamp((y + vh * 0.88 - st.top) / (vh * 0.3), 0, 1);
        var fk = f.toFixed(2);
        if (fk !== st.key) { st.key = fk; st.el.style.setProperty('--f', fk); }
      }
      if (countEl) {
        var ci = pinned ? Math.min(steps.length - 1, Math.floor(pq)) : 0;
        if (ci !== countIdx) { countIdx = ci; countEl.textContent = '0' + (ci + 1); }
      }
    }
  }

  /* ============================================================
     4. LOOP — sleeps when nothing is moving
     ============================================================ */
  function frame(t) {
    rafId = 0;
    if (lenis) lenis.raf(t);
    var y = lenis ? lenis.scroll : window.pageYOffset;
    if (y !== lastY || dirty) { lastY = y; dirty = false; render(y); idle = 0; }
    else idle++;
    if (idle < 20 || (lenis && lenis.isScrolling)) rafId = requestAnimationFrame(frame);
  }
  function wake() { if (!rafId) { idle = 0; rafId = requestAnimationFrame(frame); } }
  api.wake = wake;
  api.render = function () { render(window.pageYOffset); };   // exposed for profiling

  /* ============================================================
     5. SMOOTH SCROLL (Lenis) — fine-pointer devices only
     ============================================================ */
  function startLenis() {
    if (!window.Lenis) return;
    try {
      lenis = new window.Lenis({ lerp: 0.09, wheelMultiplier: 0.95, smoothWheel: true, syncTouch: false, anchors: false });
    } catch (err) { lenis = null; return; }
    api.lenis = lenis;

    // Body scroll-lock (modal / lightbox / mobile menu) also pauses Lenis.
    if ('MutationObserver' in window) {
      new MutationObserver(function () {
        if (!lenis) return;
        if (document.body.style.overflow === 'hidden') lenis.stop(); else lenis.start();
        wake();
      }).observe(document.body, { attributes: true, attributeFilter: ['style'] });
    }
    wake();
  }

  function loadLenis() {
    if (window.Lenis) { startLenis(); return; }
    var s = document.createElement('script');
    s.src = 'assets/js/lenis.min.js';
    s.async = true;
    s.onload = startLenis;
    s.onerror = function () { /* native scrolling stays — nothing breaks */ };
    document.head.appendChild(s);
  }

  api.scrollTo = function (target, opts) {
    if (lenis) lenis.scrollTo(target, opts || { duration: 1.5, easing: expo });
    else if (typeof target === 'number') window.scrollTo({ top: target, behavior: 'smooth' });
    else if (target && target.scrollIntoView) target.scrollIntoView({ behavior: 'smooth' });
    wake();
  };
  window.AdZenScrollTo = function (t) { api.scrollTo(t); };

  function initAnchors() {
    document.addEventListener('click', function (e) {
      if (!lenis || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute('href');
      if (!id || id.length < 2) return;
      var target = document.getElementById(decodeURIComponent(id.slice(1)));
      if (!target) return;
      e.preventDefault();
      var off = -(parseFloat(getComputedStyle(target).scrollMarginTop) || 0);
      api.scrollTo(id === '#home' ? 0 : target, { duration: 1.5, easing: expo, offset: id === '#home' ? 0 : off });
      try { history.pushState(null, '', id); } catch (err) { /* file:// */ }
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  }

  /* ============================================================
     6. INIT
     ============================================================ */
  function init() {
    initReveals();

    /* nav scroll-spy targets */
    $$('.nav__list a').forEach(function (a) {
      var h = a.getAttribute('href');
      if (h && h.charAt(0) === '#') {
        var sec = $(h);
        if (sec) spy.push({ link: a, section: sec, top: 0 });
      }
    });
    bar = document.getElementById('scrollProgress');
    heroEl = document.getElementById('home');

    if (!reduce) {
      root.classList.add('motion');
      if (heroEl) {
        heroCopy = $('[data-hero-copy]', heroEl);
        heroVisual = $('[data-hero-visual]', heroEl);
        heroAurora = $('.hero-aurora', heroEl);
        heroGrid = $('.grid-texture', heroEl);
      }
      masonry = $('.work-masonry');
      $$('[data-m="card"]').forEach(function (el) {
        cards.push({ el: el, top: 0, h: 0, left: 0, col: 0, cols: 1, amp: 0, key: '', near: false, hidden: false,
          shift: !!(masonry && masonry.contains(el)) });
      });
      $$('[data-m="parallax"]').forEach(function (el) {
        decor.push({ el: el, top: 0, h: 0, speed: parseFloat(el.getAttribute('data-speed')) || 0.2, key: '' });
      });
      pinEl = $('.process-rail[data-pin]');
      if (pinEl) {
        pinInner = $('.process-rail__pin', pinEl);
        $$('[data-step]', pinEl).forEach(function (el) { steps.push({ el: el, top: 0, key: '' }); });
        countEl = document.getElementById('processCount');
      }
    }

    measure();
    render(window.pageYOffset);

    /* smooth scroll: fine-pointer desktops only, never with reduced motion */
    if (!reduce && mqFine.matches) { loadLenis(); initAnchors(); }

    /* wake the loop on anything that can move the page */
    window.addEventListener('scroll', wake, { passive: true });
    window.addEventListener('wheel', wake, { passive: true });
    window.addEventListener('touchmove', wake, { passive: true });

    /* re-measure when layout can have changed */
    var rt = 0;
    function remeasure() { clearTimeout(rt); rt = setTimeout(function () { measure(); wake(); }, 140); }
    window.addEventListener('resize', remeasure, { passive: true });
    window.addEventListener('orientationchange', remeasure);
    window.addEventListener('load', remeasure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
    var mainEl = document.getElementById('main');
    if (mainEl && 'ResizeObserver' in window) new ResizeObserver(remeasure).observe(mainEl);

    wake();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

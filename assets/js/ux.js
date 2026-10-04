/* =============================================================
   AdZen.co — Portfolio + interface interactions
   -------------------------------------------------------------
   - Project index (scroll-spy) + filter sync for the case studies
   - Cursor-following "View / Play" label over work tiles
   - Tile depth: pointer-driven tilt + light sheen (CSS variables only)
   - Magnetic primary buttons
   Everything is fine-pointer-only and skipped for reduced motion.
   No work happens while the pointer is idle.
   ============================================================= */
(function () {
  'use strict';

  var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  /* ---------- project index: scroll-spy ---------- */
  var cases = $$('.case');
  var links = $$('.work-index a');
  var bar = document.querySelector('.work-bar');

  function setActive(id) {
    links.forEach(function (a) {
      var on = a.getAttribute('data-case') === id;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      if (on && bar && bar.scrollWidth > bar.clientWidth + 2) { /* chips scroller on small screens */ }
    });
    var idx = links.map(function (a) { return a.getAttribute('data-case'); }).indexOf(id);
    if (bar) bar.style.setProperty('--ai', Math.max(0, idx));
  }
  if (cases.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) setActive(e.target.getAttribute('data-case')); });
    }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });
    cases.forEach(function (c) { spy.observe(c); });
  }

  /* ---------- filter sync (called by the inline filter handler) ---------- */
  window.AdZenWork = {
    sync: function () {
      var firstVisible = null;
      cases.forEach(function (c) {
        var any = !!c.querySelector('.work-item:not(.is-filtered-out)');
        var was = !c.classList.contains('is-empty');
        c.classList.toggle('is-empty', !any);
        var link = document.querySelector('.work-index a[data-case="' + c.getAttribute('data-case') + '"]');
        if (link) link.parentNode.hidden = !any;
        if (any && !was) {
          c.classList.add('is-entering');
          setTimeout(function () { c.classList.remove('is-entering'); }, 800);
        }
        if (any && !firstVisible) firstVisible = c;
      });
      if (firstVisible) setActive(firstVisible.getAttribute('data-case'));
      if (window.AdZenMotion && window.AdZenMotion.wake) window.AdZenMotion.wake();
    }
  };

  /* ---------- "open project" buttons ---------- */
  $$('[data-open-case]').forEach(function (b) {
    b.addEventListener('click', function () {
      var first = b.closest('.case').querySelector('.work-item:not(.is-filtered-out)');
      if (first) first.click();
    });
  });

  if (!fine || reduce) return;

  /* ---------- cursor label ---------- */
  var cur = document.getElementById('workCursor');
  var label = cur && cur.querySelector('span');
  var cx = 0, cy = 0, tx = 0, ty = 0, curOn = false, curRaf = 0;

  function curLoop() {
    cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
    cur.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0) translate(-50%,-50%)';
    if (curOn || Math.abs(tx - cx) > 0.3 || Math.abs(ty - cy) > 0.3) curRaf = requestAnimationFrame(curLoop);
    else curRaf = 0;
  }
  function curShow(txt) {
    if (!cur) return;
    label.textContent = txt; curOn = true; cur.classList.add('is-on');
    if (!curRaf) curRaf = requestAnimationFrame(curLoop);
  }
  function curHide() { if (!cur) return; curOn = false; cur.classList.remove('is-on'); }

  /* ---------- tile depth ---------- */
  var tiles = $$('.work-item');
  var raf = 0, pend = null, rect = null, active = null;

  function paint() {
    raf = 0;
    if (!pend || !active) return;
    var px = pend.x, py = pend.y;
    var nx = (px - rect.left) / rect.width, ny = (py - rect.top) / rect.height;
    var media = active.querySelector('.work-item__media');
    if (media) {
      media.style.setProperty('--ry', ((nx - 0.5) * 7).toFixed(2) + 'deg');
      media.style.setProperty('--rx', ((0.5 - ny) * 7).toFixed(2) + 'deg');
      media.style.setProperty('--mx', (nx * 100).toFixed(1) + '%');
      media.style.setProperty('--my', (ny * 100).toFixed(1) + '%');
    }
  }
  tiles.forEach(function (t) {
    t.addEventListener('pointerenter', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      active = t;
      var m = t.querySelector('.work-item__media');
      rect = (m || t).getBoundingClientRect();
      tx = cx = e.clientX; ty = cy = e.clientY;
      curShow(t.getAttribute('data-media-type') === 'video' ? 'Play' : 'View');
    });
    t.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      tx = e.clientX; ty = e.clientY;
      pend = { x: e.clientX, y: e.clientY };
      if (!raf) raf = requestAnimationFrame(paint);
    });
    t.addEventListener('pointerleave', function () {
      curHide();
      var m = t.querySelector('.work-item__media');
      if (m) { m.style.setProperty('--rx', '0deg'); m.style.setProperty('--ry', '0deg'); }
      if (active === t) active = null;
    });
    t.addEventListener('click', curHide);
  });
  // the media box moves with the page; re-measure on scroll only while hovering
  window.addEventListener('scroll', function () {
    if (active) { var m = active.querySelector('.work-item__media'); rect = (m || active).getBoundingClientRect(); }
  }, { passive: true });

  /* ---------- magnetic primary buttons ---------- */
  $$('.btn--lime').forEach(function (b) {
    var r = null, f = 0, px = 0, py = 0;
    function apply() { f = 0; b.style.translate = px.toFixed(1) + 'px ' + py.toFixed(1) + 'px'; }
    b.addEventListener('pointerenter', function () { r = b.getBoundingClientRect(); });
    b.addEventListener('pointermove', function (e) {
      if (!r) r = b.getBoundingClientRect();
      px = ((e.clientX - (r.left + r.width / 2)) / r.width) * 10;
      py = ((e.clientY - (r.top + r.height / 2)) / r.height) * 8;
      if (!f) f = requestAnimationFrame(apply);
    });
    b.addEventListener('pointerleave', function () { r = null; px = 0; py = 0; b.style.translate = ''; });
  });
})();

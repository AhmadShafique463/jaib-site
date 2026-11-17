// JAIB site: scroll reveal, the header on scroll, and the pocket logo animation as the app plays it
// (ui/designsystem/.../LogoAnimation.kt: the opening tile, 256 units across, at twice the drawing's speed).
// No tracking; the only fetch is the bank help file from this site.
// Bank help: a name in "Works with" opens its helpline, card blocking and fraud lines. The data is the app's own
// (assets/bank-help.json, from the app's bank-help.json), fetched from this site only when a name is first tapped.
(function () {
  var dlg = document.getElementById('help');
  var list = document.querySelector('.works .names');
  if (!dlg || !list || typeof dlg.showModal !== 'function') return;
  var LABELS = { helpline: 'Helpline', abroad: 'From abroad', block: 'Block a card', fraud: 'Report fraud',
    whatsapp: 'WhatsApp', complaints: 'Complaints', website: 'Official website' };
  var ORDER = ['block', 'fraud', 'helpline', 'whatsapp', 'abroad', 'complaints', 'website'];
  var data = null, opener = null;
  function el(tag, text) { var e = document.createElement(tag); if (text) e.textContent = text; return e; }
  function render(key) {
    var bank = null;
    data.banks.forEach(function (b) { if (b.names.indexOf(key) >= 0) bank = b; });
    if (!bank) return false;
    dlg.querySelector('#help-title').textContent = bank.name;
    var body = dlg.querySelector('.help-body'); body.textContent = '';
    ORDER.forEach(function (kind) {
      var lines = bank.lines.filter(function (l) { return l.kind === kind; });
      if (!lines.length) return;
      body.appendChild(el('h4', LABELS[kind] || kind));
      var ul = el('ul');
      lines.forEach(function (l) {
        var li = el('li'), v;
        if (/^(tel:|mailto:|https:)/.test(l.href)) {
          v = el('a', l.value); v.href = l.href;
          if (l.href.indexOf('https:') === 0) { v.target = '_blank'; v.rel = 'noopener noreferrer'; }
        } else {
          v = el('span', l.value); v.className = 'val';
        }
        li.appendChild(v);
        if (l.detail) li.appendChild(el('small', l.detail));
        ul.appendChild(li);
      });
      body.appendChild(ul);
    });
    dlg.querySelector('.help-src').textContent = 'Taken from the bank\u2019s own website, app listing or documents, and checked on ' +
      data.checked + '. Numbers can change: if in doubt, use the bank\u2019s website. In the JAIB app, open the bank or wallet in Accounts for the same help.';
    return true;
  }
  function open(key) {
    if (render(key)) { dlg.showModal(); dlg.scrollTop = 0; }
  }
  list.addEventListener('click', function (e) {
    var b = e.target.closest('.help'); if (!b) return;
    opener = b;
    var key = b.getAttribute('data-help');
    if (data) { open(key); return; }
    fetch('/assets/bank-help.json?v=1').then(function (r) { return r.json(); })
      .then(function (d) { data = d; open(key); })
      .catch(function () { /* offline: the name stays a name */ });
  });
  dlg.addEventListener('click', function (e) {   // a tap on the backdrop (outside the box) closes it
    if (e.target !== dlg) return;
    var r = dlg.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dlg.close();
  });
  dlg.addEventListener('close', function () { if (opener) opener.focus(); });
})();

// Themes, light or dark, and moving pictures: the visitor's choices, kept in this browser only (the head script applies
// them before the page draws). Theme names and colours are the app's (ui/designsystem/theme/Themes.kt).
(function () {
  var root = document.documentElement;
  function save(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  // <picture> sources follow the system's light or dark, so a chosen mode rewrites their media
  var sources = [].slice.call(document.querySelectorAll('source[media*="prefers-color-scheme"]'));
  sources.forEach(function (s) { s.dataset.media = s.getAttribute('media'); });
  var metas = [].slice.call(document.querySelectorAll('meta[name="theme-color"]'));
  metas.forEach(function (m) { m.dataset.content = m.getAttribute('content'); });
  function paintBars() {
    var bar = document.querySelector('.top');
    var custom = root.hasAttribute('data-theme') || root.hasAttribute('data-mode');
    var c = bar ? getComputedStyle(bar).backgroundColor : null;
    metas.forEach(function (m) { m.setAttribute('content', custom && c ? c : m.dataset.content); });
  }
  function applyMode(mode) {
    if (mode === 'light' || mode === 'dark') root.setAttribute('data-mode', mode); else root.removeAttribute('data-mode');
    sources.forEach(function (s) {
      s.setAttribute('media', mode === 'dark' ? 'all' : mode === 'light' ? 'not all' : s.dataset.media);
    });
  }
  function applyTheme(id) {
    if (id && id !== 'josh') root.setAttribute('data-theme', id); else root.removeAttribute('data-theme');
  }
  applyMode(root.getAttribute('data-mode') || 'system');
  paintBars();

  function check(group, attr, value) {
    [].forEach.call(group.querySelectorAll('[' + attr + ']'), function (b) {
      b.setAttribute('aria-checked', b.getAttribute(attr) === value ? 'true' : 'false');
    });
  }
  var grid = document.querySelector('.theme-grid');
  if (grid) {
    check(grid, 'data-theme-id', root.getAttribute('data-theme') || 'josh');
    grid.addEventListener('click', function (e) {
      var b = e.target.closest('[data-theme-id]'); if (!b) return;
      var id = b.getAttribute('data-theme-id');
      applyTheme(id); save('jaib-theme', id === 'josh' ? null : id); check(grid, 'data-theme-id', id); paintBars();
    });
  }
  var seg = document.querySelector('.seg');
  if (seg) {
    check(seg, 'data-mode-id', root.getAttribute('data-mode') || 'system');
    seg.addEventListener('click', function (e) {
      var b = e.target.closest('[data-mode-id]'); if (!b) return;
      var mode = b.getAttribute('data-mode-id');
      applyMode(mode); save('jaib-mode', mode === 'system' ? null : mode); check(seg, 'data-mode-id', mode); paintBars();
    });
  }
  var flow = document.querySelector('.flow-toggle');
  if (flow) {
    var show = function () {
      var on = root.classList.contains('flow');
      flow.setAttribute('aria-pressed', on ? 'true' : 'false');
      flow.textContent = 'Moving pictures: ' + (on ? 'on' : 'off');
    };
    show();
    flow.addEventListener('click', function () {
      var on = !root.classList.contains('flow');
      root.classList.toggle('flow', on); save('jaib-flow', on ? null : 'off'); show();
    });
  }
})();

(function () {
  var root = document.documentElement;
  var full = root.classList.contains('motion');   // false when the system asks for reduced motion

  // Header: a shadow once the page scrolls
  var top = document.querySelector('.top');
  if (top) {
    var onScroll = function () { top.classList.toggle('scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Scroll reveal, staggered among siblings
  var items = [].slice.call(document.querySelectorAll('.reveal'));
  items.forEach(function (el) {
    var sibs = [].filter.call(el.parentNode.children, function (c) { return c.classList.contains('reveal'); });
    var i = sibs.indexOf(el);
    if (i > 0) el.style.transitionDelay = Math.min(i, 7) * 70 + 'ms';
  });
  function settle(el) {
    // once revealed, clear the stagger so hover effects respond at once
    el.addEventListener('transitionend', function done(e) {
      if (e.target !== el || e.propertyName !== 'opacity') return;
      el.removeEventListener('transitionend', done);
      el.style.transitionDelay = '';
    });
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { settle(e.target); e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  // The pocket logo
  var svg = document.querySelector('svg.pocket');
  if (!svg) return;
  var pocket = svg.querySelector('.pocket-line');
  var coin = svg.querySelector('.pocket-coin');
  var swoop = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  swoop.setAttribute('d', 'M 200 -50 C 200 20, 235 70, 275 115 C 305 145, 312 190, 296 235 C 282 272, 245 302, 200 302 C 155 302, 118 272, 102 235 C 90 195, 92 170, 114 161 C 138 154, 172 161, 200 185');
  swoop.setAttribute('fill', 'none');
  swoop.setAttribute('stroke', 'none');
  svg.appendChild(swoop);
  var len = swoop.getTotalLength();

  // the app's numbers (LogoFrames)
  var LOOP = 4.2, SWOOP_END = 1.9, SETTLE_END = 2.1, FALL_END = 2.8, ABSORB_END = 3.25, HOLD_END = 3.55;
  var BASE = 20, BOLD = 34, COIN = 13.5, CX = 200, CY = 185, START_Y = -50, APEX_Y = 254, SUNK_Y = 262;
  var SPEED = 2;      // JaibMotion.LOGO_OPEN_SPEED
  var REST = 1.4;     // seconds of the logo at rest (coin in the pocket) between rounds, for a page that stays open

  function droplet(r, m) {
    if (m <= 0.001) return 'M 0 ' + (-r) + ' A ' + r + ' ' + r + ' 0 1 1 0 ' + r + ' A ' + r + ' ' + r + ' 0 1 1 0 ' + (-r) + ' Z';
    var tip = -r * (1 + m * 1.55), bottom = r * (1 + m * 0.12), wide = r * (1 - m * 0.15), k = 0.55228;
    return 'M 0 ' + tip +
      ' C ' + (wide * 0.35 * m) + ' ' + (tip * 0.45) + ', ' + wide + ' ' + (-r * 0.2) + ', ' + wide + ' ' + (r * 0.2) +
      ' C ' + wide + ' ' + (r * (0.2 + 0.8 * k)) + ', ' + (wide * k) + ' ' + bottom + ', 0 ' + bottom +
      ' C ' + (-wide * k) + ' ' + bottom + ', ' + (-wide) + ' ' + (r * (0.2 + 0.8 * k)) + ', ' + (-wide) + ' ' + (r * 0.2) +
      ' C ' + (-wide) + ' ' + (-r * 0.2) + ', ' + (-wide * 0.35 * m) + ' ' + (tip * 0.45) + ', 0 ' + tip + ' Z';
  }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeIn(t) { return t * t; }
  function easeOut(t) { return 1 - (1 - t) * (1 - t); }
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function frame(t) {   // LogoFrames.at
    if (t < SWOOP_END) {
      var pt = swoop.getPointAtLength(easeInOut(t / SWOOP_END) * len);
      return [pt.x, pt.y, COIN, 0, 1, BASE];
    }
    if (t < SETTLE_END) return [CX, CY, COIN, 0, 1, BASE];
    if (t < FALL_END) {
      var p = easeIn((t - SETTLE_END) / (FALL_END - SETTLE_END));
      return [CX, lerp(CY, APEX_Y, p), lerp(COIN, COIN * 1.25, p), p, 1, BASE];
    }
    if (t < ABSORB_END) {
      var q = (t - FALL_END) / (ABSORB_END - FALL_END), o = easeOut(q);
      return [CX, lerp(APEX_Y, SUNK_Y, o), lerp(COIN * 1.25, COIN * 1.45, o), 1, 1 - easeIn(q), lerp(BASE, BOLD, o)];
    }
    if (t < HOLD_END) return [CX, SUNK_Y, COIN, 1, 0, BOLD];
    var s = (t - HOLD_END) / (LOOP - HOLD_END);
    return [CX, START_Y, COIN, 0, s > 0.4 ? easeOut((s - 0.4) / 0.6) : 0, lerp(BOLD, BASE, easeOut(s))];
  }
  function draw(f) {
    coin.setAttribute('transform', 'translate(' + f[0] + ' ' + f[1] + ')');
    coin.setAttribute('opacity', f[4]);
    coin.setAttribute('d', droplet(f[2], f[3]));
    pocket.setAttribute('stroke-width', f[5]);
  }

  // One round in page seconds: the swoop at app speed, a rest on the logo, then the drop, the swell and the reset.
  var SWOOP_S = SETTLE_END / SPEED, REST_END = SWOOP_S + REST, ROUND = REST_END + (LOOP - SETTLE_END) / SPEED;
  function at(sec) {
    if (sec < SWOOP_S) return frame(sec * SPEED);
    if (sec < REST_END) return frame(2.0);
    return frame(SETTLE_END + (sec - REST_END) * SPEED);
  }

  var rounds = full ? Infinity : 2;   // with reduced motion: two rounds, then the logo stays still
  var visible = true, start = null, raf = null, delay = 0.5;
  function loop(now) {
    raf = null;
    if (!visible) return;
    if (start === null) start = now + delay * 1000;
    var sec = (now - start) / 1000;
    if (sec < 0) { draw(frame(2.0)); raf = requestAnimationFrame(loop); return; }
    if (sec >= rounds * ROUND) { draw(frame(2.0)); return; }
    draw(at(sec % ROUND));
    raf = requestAnimationFrame(loop);
  }
  draw(frame(2.0));   // still frame first: the coin resting in the pocket, as in the logo
  function kick() { if (visible && raf === null) raf = requestAnimationFrame(loop); }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; kick(); }).observe(svg);
  } else {
    kick();
  }
})();

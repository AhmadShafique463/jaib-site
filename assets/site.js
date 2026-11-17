// JAIB site: scroll reveal, the header on scroll, and the pocket logo animation as the app plays it
// (ui/designsystem/.../LogoAnimation.kt: the opening tile, 256 units across, at twice the drawing's speed).
// No tracking, no network calls.
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

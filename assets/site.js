// JAIB site: the pocket logo animation (from docs/branding/logo-animation.html) and scroll reveal.
// No tracking, no network calls.
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Scroll reveal
  var items = document.querySelectorAll('.reveal');
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.15 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  // Pocket logo: a coin swoops in, settles, drops into the pocket as a droplet, the line swells, and it loops.
  var svg = document.querySelector('svg.pocket');
  if (!svg) return;
  var pocket = svg.querySelector('.pocket-line');
  var coin = svg.querySelector('.pocket-coin');
  var NS = 'http://www.w3.org/2000/svg';
  var swoop = document.createElementNS(NS, 'path');
  swoop.setAttribute('d', 'M 200 -50 C 200 20, 235 70, 275 115 C 305 145, 312 190, 296 235 C 282 272, 245 302, 200 302 C 155 302, 118 272, 102 235 C 90 195, 92 170, 114 161 C 138 154, 172 161, 200 185');
  swoop.setAttribute('fill', 'none');
  swoop.setAttribute('stroke', 'none');
  svg.appendChild(swoop);
  var len = swoop.getTotalLength();

  var BASE = 20, BOLD = 34, R = 13.5, CX = 200, CY = 185, LOOP = 4.2, REST = 1.6;

  function droplet(r, m) {
    if (m <= 0.001) return 'M 0 ' + (-r) + ' A ' + r + ' ' + r + ' 0 1 1 0 ' + r + ' A ' + r + ' ' + r + ' 0 1 1 0 ' + (-r) + ' Z';
    var tipY = -r * (1 + m * 1.55), botY = r * (1 + m * 0.12), w = r * (1 - m * 0.15), k = 0.55228;
    return 'M 0 ' + tipY +
      ' C ' + (w * 0.35 * m) + ' ' + (tipY * 0.45) + ', ' + w + ' ' + (-r * 0.2) + ', ' + w + ' ' + (r * 0.2) +
      ' C ' + w + ' ' + (r * (0.2 + 0.8 * k)) + ', ' + (w * k) + ' ' + botY + ', 0 ' + botY +
      ' C ' + (-w * k) + ' ' + botY + ', ' + (-w) + ' ' + (r * (0.2 + 0.8 * k)) + ', ' + (-w) + ' ' + (r * 0.2) +
      ' C ' + (-w) + ' ' + (-r * 0.2) + ', ' + (-w * 0.35 * m) + ' ' + (tipY * 0.45) + ', 0 ' + tipY + ' Z';
  }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function outQ(t) { return 1 - (1 - t) * (1 - t); }
  function inQ(t) { return t * t; }
  function inOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function render(t) {
    var x = 200, y = -50, r = R, m = 0, op = 1, sw = BASE;
    if (t < 1.9) {
      var pt = swoop.getPointAtLength(inOut(t / 1.9) * len); x = pt.x; y = pt.y;
    } else if (t < 2.1) {
      x = CX; y = CY;
    } else if (t < 2.8) {
      var p = inQ((t - 2.1) / 0.7); x = CX; y = lerp(CY, 254, p); m = p; r = lerp(R, R * 1.25, p);
    } else if (t < 3.25) {
      var q = (t - 2.8) / 0.45; x = CX; y = lerp(254, 262, outQ(q)); m = 1; r = lerp(R * 1.25, R * 1.45, outQ(q));
      sw = lerp(BASE, BOLD, outQ(q)); op = 1 - inQ(q);
    } else if (t < 3.55) {
      op = 0; sw = BOLD;
    } else {
      var s = (t - 3.55) / 0.65; op = 0; sw = lerp(BOLD, BASE, outQ(s));
      if (s > 0.4) { x = 200; y = -50; op = outQ((s - 0.4) / 0.6); }
    }
    coin.setAttribute('transform', 'translate(' + x + ' ' + y + ')');
    coin.setAttribute('opacity', op);
    coin.setAttribute('d', droplet(r, m));
    pocket.setAttribute('stroke-width', sw);
  }

  if (reduce) { render(2.0); return; }   // still frame: the coin resting in the pocket, as in the logo

  var visible = true, start = null, frame = null;
  function loop(now) {
    if (start === null) start = now;
    // play the 4.2 s logo loop, then rest a moment on the coin-in-pocket frame
    var t = ((now - start) / 1000) % (LOOP + REST);
    render(t < 2.1 ? t : t < 2.1 + REST ? 2.0 : t - REST);
    frame = visible ? requestAnimationFrame(loop) : null;
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) {
      visible = e[0].isIntersecting;
      if (visible && frame === null) frame = requestAnimationFrame(loop);
    }).observe(svg);
  } else {
    frame = requestAnimationFrame(loop);
  }
})();

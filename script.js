(function () {
  var root = document.documentElement;
  var savedY = null;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- case studies open from the URL hash (#p-name) */
  function openCase() { return /^#p-[\w-]+$/.test(location.hash) ? document.getElementById(location.hash.slice(1)) : null; }
  function sync() {
    var c = openCase();
    if (c) {
      if (savedY === null) savedY = window.scrollY;
      root.classList.add('case-open');
      c.scrollTop = 0;
      c.focus({ preventScroll: true });
    } else {
      root.classList.remove('case-open');
      if (savedY !== null) {
        var y = savedY; savedY = null;
        requestAnimationFrame(function () { window.scrollTo(0, y); });
      }
    }
  }
  window.addEventListener('hashchange', sync);
  sync();
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && openCase()) { location.hash = '#work'; }
  });

  /* ---- header sits clear over the hero, turns solid after you scroll */
  var header = document.getElementById('site-header');
  function head() { if (header) header.classList.toggle('over-hero', window.scrollY < 40); }
  head();
  window.addEventListener('scroll', head, { passive: true });

  /* ---- case videos play while on screen */
  var vids = document.querySelectorAll('video[data-autoplay]');
  if (vids.length && 'IntersectionObserver' in window && !reduce) {
    var vo = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting) { var p = en.target.play(); if (p && p.catch) p.catch(function () {}); } else en.target.pause();
      });
    }, { threshold: 0.35 });
    for (var v = 0; v < vids.length; v++) vo.observe(vids[v]);
  }

  /* ---- copy email */
  var btn = document.getElementById('copy');
  if (btn) {
    btn.addEventListener('click', function () {
      var email = btn.getAttribute('data-email');
      function done() { btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = 'Copy email'; }, 1800); }
      function fallback() {
        var r = document.createRange(); r.selectNodeContents(document.getElementById('mail'));
        var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
        btn.textContent = 'Press Ctrl+C or Cmd+C';
      }
      try { navigator.clipboard.writeText(email).then(done, fallback); } catch (e) { fallback(); }
    });
  }

  /* ---- dot sphere: a Fibonacci point cloud that turns slowly and leans toward the pointer */
  var pointer = { x: 0, y: 0 };
  window.addEventListener('pointermove', function (e) {
    pointer.x = e.clientX / window.innerWidth - 0.5;
    pointer.y = e.clientY / window.innerHeight - 0.5;
  }, { passive: true });

  function orb(canvas) {
    var ctx = canvas.getContext && canvas.getContext('2d');
    if (!ctx) return;
    var N = parseInt(canvas.getAttribute('data-count'), 10) || 1400, pts = [], i;
    var golden = Math.PI * (3 - Math.sqrt(5));
    for (i = 0; i < N; i++) {
      var y = 1 - 2 * (i + 0.5) / N, r = Math.sqrt(1 - y * y), th = golden * i;
      pts.push([Math.cos(th) * r, y, Math.sin(th) * r]);
    }
    var w = 0, h = 0, dpr = 1, rot = Math.random() * 6, tilt = 0.35, yaw = 0, running = false;
    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(w * dpr)); canvas.height = Math.max(1, Math.round(h * dpr));
    }
    function draw() {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      var R = Math.min(canvas.width, canvas.height) * 0.46, cx = canvas.width / 2, cy = canvas.height / 2;
      var a = rot + yaw, ca = Math.cos(a), sa = Math.sin(a), ct = Math.cos(tilt), st = Math.sin(tilt);
      ctx.fillStyle = 'rgb(240,182,196)';
      for (var k = 0; k < N; k++) {
        var p = pts[k];
        var x = p[0] * ca + p[2] * sa, z = -p[0] * sa + p[2] * ca;
        var yy = p[1] * ct - z * st, zz = p[1] * st + z * ct;
        var d = (zz + 1) / 2;
        ctx.globalAlpha = 0.08 + 0.8 * d * d;
        ctx.beginPath();
        ctx.arc(cx + x * R, cy + yy * R, (0.4 + 1.15 * d) * dpr, 0, 6.2832);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    function frame() {
      if (!running) return;
      rot += 0.0022;
      tilt += (0.35 + pointer.y * 0.5 - tilt) * 0.04;
      yaw += (pointer.x * 0.9 - yaw) * 0.04;
      draw();
      requestAnimationFrame(frame);
    }
    size(); draw();
    window.addEventListener('resize', function () { size(); draw(); });
    if (reduce || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (entries) {
      var vis = entries[0].isIntersecting;
      if (vis && !running) { running = true; requestAnimationFrame(frame); }
      if (!vis) running = false;
    }).observe(canvas);
  }
  var orbs = document.querySelectorAll('canvas.orb');
  for (var n = 0; n < orbs.length; n++) orb(orbs[n]);
})();

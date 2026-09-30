/* PhishGuard AI — Cyber interaction layer (no dependencies) */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || '#00f0ff';

  /* ---------- Boot screen ---------- */
  const boot = document.createElement('div');
  boot.id = 'cy-boot';
  boot.innerHTML = '<div style="font-size:1.6rem;font-weight:900;letter-spacing:4px">PHISHGUARD <span style="color:#ff2d95">AI</span></div><div class="bar"><i></i></div><small>INITIALIZING THREAT ENGINE...</small>';
  document.body.appendChild(boot);
  setTimeout(() => boot.classList.add('done'), reduce ? 100 : 1700);
  setTimeout(() => boot.remove(), 2600);

  /* ---------- Glitch title on login ---------- */
  const h1 = $('.auth-logo h1');
  if (h1) { h1.classList.add('glitch'); h1.setAttribute('data-text', h1.textContent.trim()); }

  /* ---------- Hero + gallery + terminal injected into dashboard ---------- */
  const dash = $('#page-dashboard');
  if (dash) {
    const header = $('.page-header', dash);
    const hero = document.createElement('section');
    hero.className = 'cy-hero';
    hero.innerHTML = `
      <div>
        <span class="cy-tag">● SYSTEM ONLINE // v2.6</span>
        <h1>Stop phishing <span>before</span> it hits you</h1>
        <div class="cy-typed" id="cy-typed"></div>
        <div class="cy-hero-btns">
          <button class="btn-primary" id="cy-h-scan">⚡ Start Scan</button>
          <button class="btn-ghost" id="cy-h-graph">🕸 Threat Graph</button>
        </div>
        <div class="cy-mini-stats">
          <div><b data-count="99.2" data-dec="1">0</b><small>% Detection</small></div>
          <div><b data-count="240" data-pre="&lt;" data-suf="ms">0</b><small>Scan time</small></div>
          <div><b data-count="4">0</b><small>Channels</small></div>
        </div>
      </div>
      <div class="cy-globe-wrap"><canvas id="cy-globe"></canvas><span class="cy-globe-hint">⟲ Drag to rotate</span></div>`;
    header.after(hero);

    const gal = document.createElement('div');
    gal.innerHTML = `
      <div class="cy-section-title">Threat Intelligence Gallery // 3D Live Telemetry</div>
      <div class="cy-gallery">
        <div class="cy-tele-card" data-tilt id="tele-net">
          <div class="cy-tele-tag">● LIVE SENSORS // 01</div>
          <div class="cy-tele-canvas-wrap"><canvas id="canvas-tele-net"></canvas></div>
          <div class="cy-tele-info">
            <div><b>Neon Net Grid</b><small>Global Traffic Mesh</small></div>
            <span class="cy-tele-action">99.4% ONLINE</span>
          </div>
        </div>
        <div class="cy-tele-card" data-tilt id="tele-vault">
          <div class="cy-tele-tag">● NEURAL CORE // 02</div>
          <div class="cy-tele-canvas-wrap"><canvas id="canvas-tele-vault"></canvas></div>
          <div class="cy-tele-info">
            <div><b>Node Core</b><small>3D Cryptographic Vault</small></div>
            <span class="cy-tele-action">SECURE</span>
          </div>
        </div>
        <div class="cy-tele-card" data-tilt id="tele-freq">
          <div class="cy-tele-tag">● AI HEURISTICS // 03</div>
          <div class="cy-tele-canvas-wrap"><canvas id="canvas-tele-freq"></canvas></div>
          <div class="cy-tele-info">
            <div><b>Shield Matrix</b><small>Entropy Spectrum Analysis</small></div>
            <span class="cy-tele-action">0.18ms LAT</span>
          </div>
        </div>
        <div class="cy-tele-card" data-tilt id="tele-radar">
          <div class="cy-tele-tag">● PERIMETER // 04</div>
          <div class="cy-tele-canvas-wrap"><canvas id="canvas-tele-radar"></canvas></div>
          <div class="cy-tele-info">
            <div><b>Hook Blocked</b><small>Intercept Radar Sonar</small></div>
            <span class="cy-tele-action" style="color:var(--fraud);border-color:rgba(255,45,85,.4);background:rgba(255,45,85,.1);">14 THREATS</span>
          </div>
        </div>
      </div>
      <div class="cy-section-title">Live Threat Feed</div>
      <div class="glass-card"><div class="cy-terminal" id="cy-terminal"></div></div>`;
    const qs = $('.dashboard-quick-scan', dash);
    qs ? qs.before(gal) : dash.appendChild(gal);

    $('#cy-h-scan').onclick = () => { window.switchPage && switchPage('scan'); };
    $('#cy-h-graph').onclick = () => { window.switchPage && switchPage('threats'); };

    /* typed text */
    const phrases = ['> scanning links, emails, WhatsApp & SMS...', '> AI + NLP + brand-spoof detection active', '> 0 threats reached your inbox today', '> paste any link. get a verdict in milliseconds.'];
    const typed = $('#cy-typed'); let pi = 0, ci = 0, del = false;
    (function tick() {
      const p = phrases[pi];
      if (typed) {
        typed.textContent = p.slice(0, ci);
        if (!del && ci++ === p.length) { del = true; return setTimeout(tick, 1600); }
        if (del && --ci < 0) { del = false; ci = 0; pi = (pi + 1) % phrases.length; }
      }
      setTimeout(tick, del ? 18 : 42);
    })();

    /* count-up */
    hero.querySelectorAll('[data-count]').forEach(el => {
      const end = +el.dataset.count, dec = +(el.dataset.dec || 0), t0 = performance.now();
      (function step(t) {
        const k = Math.min(1, (t - t0) / 1800), v = end * (1 - Math.pow(1 - k, 3));
        el.innerHTML = (el.dataset.pre || '') + v.toFixed(dec) + (el.dataset.suf || '');
        if (k < 1) requestAnimationFrame(step);
      })(t0);
    });

    /* live terminal */
    const term = $('#cy-terminal');
    const doms = ['paypa1-secure.xyz', 'hdfc-kyc-update.top', 'amazon-prize.win', 'sbi-netbank.co', 'google.com', 'github.com', 'irctc-refund.click', 'uidai-verify.info', 'microsoft.com', 'dhl-track-parcel.ru'];
    const pick = a => a[Math.floor(Math.random() * a.length)];
    function feed() {
      if (document.hidden || !dash.classList.contains('active')) return;
      const d = pick(doms), safe = /^(google|github|microsoft)\./.test(d);
      const score = safe ? Math.floor(Math.random() * 12) : 45 + Math.floor(Math.random() * 55);
      const cls = score < 30 ? 't-ok' : score < 70 ? 't-warn' : 't-bad';
      const tag = score < 30 ? 'SAFE ' : score < 70 ? 'SUSP ' : 'BLOCK';
      const el = document.createElement('div');
      el.innerHTML = `<span class="t-dim">[${new Date().toLocaleTimeString()}]</span> <span class="${cls}">${tag}</span> ${pick(['EMAIL','WHATSAPP','SMS','URL'])} → ${d} <span class="t-dim">risk=${score}</span>`;
      if (term) {
        term.appendChild(el);
        while (term.children.length > 11) term.firstChild.remove();
      }
    }
    setInterval(feed, 1300);

    /* ----------------------------------------------------
       4 Live 3D Canvas Visualizers for Telemetry Cards
       ---------------------------------------------------- */
    // Helper to resize canvas to display pixels
    function fitCanvas(cv) {
      if (!cv) return { w: 0, h: 0 };
      const r = cv.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.floor(r.width * dpr);
      const h = Math.floor(r.height * dpr);
      if (cv.width !== w || cv.height !== h) {
        cv.width = w; cv.height = h;
      }
      return { w, h, dpr };
    }

    // 1. NEON NET GRID (3D perspective floating node mesh with data flow)
    (function initNetMesh() {
      const cv = $('#canvas-tele-net');
      if (!cv) return;
      const ctx = cv.getContext('2d');
      const nodes = [];
      const cols = 7, rows = 5;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          nodes.push({
            gx: x - cols / 2 + 0.5,
            gy: y - rows / 2 + 0.5,
            gz: 0,
            phase: Math.random() * Math.PI * 2
          });
        }
      }
      const packets = Array.from({ length: 6 }, () => ({
        from: Math.floor(Math.random() * nodes.length),
        to: Math.floor(Math.random() * nodes.length),
        p: Math.random(),
        speed: 0.008 + Math.random() * 0.012
      }));

      function render(t) {
        if (document.hidden || !dash.classList.contains('active')) { requestAnimationFrame(render); return; }
        const { w, h } = fitCanvas(cv);
        if (!w || !h) { requestAnimationFrame(render); return; }
        ctx.clearRect(0, 0, w, h);

        const time = t * 0.0015;
        const cx = w / 2, cy = h / 2;
        const scale = Math.min(w, h) * 0.22;

        // Project 3D to 2D with camera tilt
        const proj = (gx, gy, gz) => {
          const waveZ = gz + Math.sin(time + gx * 0.8 + gy * 0.9) * 0.35;
          // rotate in X and Y slightly
          const rotY = Math.sin(time * 0.5) * 0.25;
          const x1 = gx * Math.cos(rotY) - waveZ * Math.sin(rotY);
          const z1 = gx * Math.sin(rotY) + waveZ * Math.cos(rotY);
          const camZ = 3.5 + z1;
          const px = cx + (x1 * scale * 2.8) / camZ;
          const py = cy + (gy * scale * 2.4) / camZ + Math.sin(time * 0.8) * 4;
          return { px, py, z: camZ };
        };

        const projected = nodes.map(n => ({ ...proj(n.gx, n.gy, n.gz) }));

        // Draw connections
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.22)';
        ctx.lineWidth = 1;
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            const idx = y * cols + x;
            if (x < cols - 1) {
              const right = idx + 1;
              ctx.beginPath();
              ctx.moveTo(projected[idx].px, projected[idx].py);
              ctx.lineTo(projected[right].px, projected[right].py);
              ctx.stroke();
            }
            if (y < rows - 1) {
              const down = idx + cols;
              ctx.beginPath();
              ctx.moveTo(projected[idx].px, projected[idx].py);
              ctx.lineTo(projected[down].px, projected[down].py);
              ctx.stroke();
            }
          }
        }

        // Draw nodes
        projected.forEach((p, i) => {
          const sz = Math.max(1.5, (4 / p.z) * 2.2);
          ctx.fillStyle = i % 3 === 0 ? '#00f0ff' : 'rgba(0,240,255,0.7)';
          ctx.beginPath();
          ctx.arc(p.px, p.py, sz, 0, Math.PI * 2);
          ctx.fill();
        });

        // Draw packets
        packets.forEach(pkt => {
          pkt.p += pkt.speed;
          if (pkt.p >= 1) {
            pkt.p = 0;
            pkt.from = Math.floor(Math.random() * nodes.length);
            pkt.to = Math.floor(Math.random() * nodes.length);
          }
          const p1 = projected[pkt.from];
          const p2 = projected[pkt.to];
          if (p1 && p2) {
            const x = p1.px + (p2.px - p1.px) * pkt.p;
            const y = p1.py + (p2.py - p1.py) * pkt.p;
            ctx.fillStyle = '#ff2d95';
            ctx.shadowColor = '#ff2d95';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        });

        requestAnimationFrame(render);
      }
      requestAnimationFrame(render);
    })();

    // 2. NODE CORE SHIELD (3D rotating isometric cyber wireframe cube + energy core)
    (function initVault() {
      const cv = $('#canvas-tele-vault');
      if (!cv) return;
      const ctx = cv.getContext('2d');

      // Vertices of a cube
      const verts = [
        [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
        [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
      ];
      const edges = [
        [0,1],[1,2],[2,3],[3,0],
        [4,5],[5,6],[6,7],[7,4],
        [0,4],[1,5],[2,6],[3,7]
      ];

      function render(t) {
        if (document.hidden || !dash.classList.contains('active')) { requestAnimationFrame(render); return; }
        const { w, h } = fitCanvas(cv);
        if (!w || !h) { requestAnimationFrame(render); return; }
        ctx.clearRect(0, 0, w, h);

        const time = t * 0.0012;
        const cx = w / 2, cy = h / 2;
        const R = Math.min(w, h) * 0.28;

        const cosA = Math.cos(time), sinA = Math.sin(time);
        const cosB = Math.cos(time * 0.7), sinB = Math.sin(time * 0.7);

        // Project cube vertices
        const pts = verts.map(([x, y, z]) => {
          // Rot around Y
          let x1 = x * cosA - z * sinA;
          let z1 = x * sinA + z * cosA;
          // Rot around X
          let y2 = y * cosB - z1 * sinB;
          let z2 = y * sinB + z1 * cosB;
          const fov = 3.2;
          const k = fov / (fov + z2);
          return { x: cx + x1 * R * k, y: cy + y2 * R * k, z: z2 };
        });

        // Draw inner glowing core
        const pulse = (Math.sin(time * 3) + 1) * 0.5;
        const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, R * 0.65);
        grad.addColorStop(0, 'rgba(0, 255, 156, 0.9)');
        grad.addColorStop(0.4, 'rgba(0, 240, 255, 0.35)');
        grad.addColorStop(1, 'rgba(0, 240, 255, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, R * 0.65, 0, Math.PI * 2);
        ctx.fill();

        // Core icon
        ctx.strokeStyle = '#00ff9c';
        ctx.lineWidth = 1.8;
        ctx.strokeRect(cx - 10, cy - 10, 20, 20);

        // Rotating outer rings
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(-time * 1.5);
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.arc(0, 0, R * 1.08, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Draw cube edges with depth alpha
        edges.forEach(([i, j]) => {
          const p1 = pts[i], p2 = pts[j];
          const avgZ = (p1.z + p2.z) / 2;
          ctx.strokeStyle = avgZ > 0 ? 'rgba(0, 240, 255, 0.9)' : 'rgba(0, 140, 255, 0.35)';
          ctx.lineWidth = avgZ > 0 ? 1.8 : 1.0;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        });

        // Corner vertices
        pts.forEach(p => {
          ctx.fillStyle = p.z > 0 ? '#00f0ff' : 'rgba(0, 240, 255, 0.5)';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.z > 0 ? 3.5 : 2, 0, Math.PI * 2);
          ctx.fill();
        });

        requestAnimationFrame(render);
      }
      requestAnimationFrame(render);
    })();

    // 3. SHIELD MATRIX // AI HEURISTICS SPECTRUM (3D animated frequency equalizer & laser scan)
    (function initSpectrum() {
      const cv = $('#canvas-tele-freq');
      if (!cv) return;
      const ctx = cv.getContext('2d');
      const bars = 22;

      function render(t) {
        if (document.hidden || !dash.classList.contains('active')) { requestAnimationFrame(render); return; }
        const { w, h } = fitCanvas(cv);
        if (!w || !h) { requestAnimationFrame(render); return; }
        ctx.clearRect(0, 0, w, h);

        const time = t * 0.003;
        const cx = w / 2, cy = h * 0.55;
        const totalW = w * 0.8;
        const barW = totalW / bars - 4;
        const startX = (w - totalW) / 2;

        // Background perspective grid floor
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 6; i++) {
          const y = cy + i * 14;
          ctx.beginPath();
          ctx.moveTo(w * 0.1 - i * 10, y);
          ctx.lineTo(w * 0.9 + i * 10, y);
          ctx.stroke();
        }

        // Draw animated 3D frequency bars
        for (let i = 0; i < bars; i++) {
          const freq = Math.sin(time * 1.5 + i * 0.45) * 0.5 + 0.5;
          const freq2 = Math.cos(time * 2.2 + i * 0.28) * 0.3 + 0.3;
          const barH = (freq + freq2) * (h * 0.38) + 10;
          const x = startX + i * (barW + 4);
          const y = cy - barH;

          // Bar gradient
          const grad = ctx.createLinearGradient(x, y, x, cy);
          grad.addColorStop(0, '#00f0ff');
          grad.addColorStop(0.7, 'rgba(0, 100, 255, 0.8)');
          grad.addColorStop(1, 'rgba(0, 40, 120, 0.2)');
          ctx.fillStyle = grad;
          ctx.fillRect(x, y, barW, barH);

          // Top cap glowing neon
          ctx.fillStyle = '#00ff9c';
          ctx.fillRect(x, y - 2, barW, 2.5);

          // 3D side facet
          ctx.fillStyle = 'rgba(0, 180, 255, 0.25)';
          ctx.beginPath();
          ctx.moveTo(x + barW, y);
          ctx.lineTo(x + barW + 3, y - 3);
          ctx.lineTo(x + barW + 3, cy - 3);
          ctx.lineTo(x + barW, cy);
          ctx.closePath();
          ctx.fill();
        }

        // Horizontal laser scanning line
        const scanY = cy - ((Math.sin(time) + 1) * 0.5) * (h * 0.55);
        ctx.strokeStyle = 'rgba(255, 45, 149, 0.85)';
        ctx.shadowColor = '#ff2d95';
        ctx.shadowBlur = 10;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(startX - 10, scanY);
        ctx.lineTo(startX + totalW + 10, scanY);
        ctx.stroke();
        ctx.shadowBlur = 0;

        requestAnimationFrame(render);
      }
      requestAnimationFrame(render);
    })();

    // 4. HOOK BLOCKED // 360 TACTICAL INTERCEPT RADAR
    (function initRadar() {
      const cv = $('#canvas-tele-radar');
      if (!cv) return;
      const ctx = cv.getContext('2d');

      const blips = [
        { angle: 0.8, dist: 0.65, type: 'fraud', ping: 0 },
        { angle: 2.1, dist: 0.42, type: 'suspicious', ping: 0 },
        { angle: 3.9, dist: 0.78, type: 'fraud', ping: 0 },
        { angle: 5.2, dist: 0.55, type: 'safe', ping: 0 },
      ];

      function render(t) {
        if (document.hidden || !dash.classList.contains('active')) { requestAnimationFrame(render); return; }
        const { w, h } = fitCanvas(cv);
        if (!w || !h) { requestAnimationFrame(render); return; }
        ctx.clearRect(0, 0, w, h);

        const cx = w / 2, cy = h / 2;
        const R = Math.min(w, h) * 0.42;
        const sweepAngle = (t * 0.0022) % (Math.PI * 2);

        // Concentric radar rings
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
        ctx.lineWidth = 1;
        for (let r = 0.25; r <= 1.0; r += 0.25) {
          ctx.beginPath();
          ctx.arc(cx, cy, R * r, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Crosshairs
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
        ctx.beginPath();
        ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy);
        ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R);
        ctx.stroke();

        // Rotating radar beam slice
        const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, R);
        grad.addColorStop(0, 'rgba(0, 255, 156, 0.5)');
        grad.addColorStop(1, 'rgba(0, 240, 255, 0)');

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, R, sweepAngle - 0.55, sweepAngle);
        ctx.closePath();
        ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
        ctx.fill();
        ctx.restore();

        // Leading sweep line
        ctx.strokeStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 6;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(sweepAngle) * R, cy + Math.sin(sweepAngle) * R);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Render threat blips
        blips.forEach(b => {
          const bx = cx + Math.cos(b.angle) * (R * b.dist);
          const by = cy + Math.sin(b.angle) * (R * b.dist);

          // Check if sweep passed this blip
          const diff = (sweepAngle - b.angle + Math.PI * 2) % (Math.PI * 2);
          if (diff < 0.15) b.ping = 1.0;
          b.ping = Math.max(0, b.ping - 0.015);

          const col = b.type === 'fraud' ? '#ff2d95' : b.type === 'suspicious' ? '#ffe600' : '#00ff9c';

          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(bx, by, 3.5, 0, Math.PI * 2);
          ctx.fill();

          if (b.ping > 0) {
            ctx.strokeStyle = col;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(bx, by, 4 + (1 - b.ping) * 16, 0, Math.PI * 2);
            ctx.globalAlpha = b.ping;
            ctx.stroke();
            ctx.globalAlpha = 1;

            // Target lock box
            if (b.type === 'fraud') {
              ctx.strokeStyle = 'rgba(255, 45, 149, 0.7)';
              ctx.strokeRect(bx - 8, by - 8, 16, 16);
            }
          }
        });

        requestAnimationFrame(render);
      }
      requestAnimationFrame(render);
    })();
  }

  /* ---------- 3D tilt (delegated) ---------- */
  const TILT = '.glass-card, .stat-card, [data-tilt]';
  let cur = null;
  document.addEventListener('mousemove', e => {
    if (reduce) return;
    const el = e.target.closest && e.target.closest(TILT);
    if (cur && cur !== el) reset(cur);
    if (!el || el.matches('.cy-globe-wrap')) { cur = null; return; }
    cur = el;
    if (!el.querySelector(':scope > .tilt-glare')) { const g = document.createElement('i'); g.className = 'tilt-glare'; el.appendChild(g); }
    const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    const big = r.width > 600 ? 2.5 : 9;
    el.style.transform = `perspective(900px) rotateX(${(0.5 - y) * big}deg) rotateY(${(x - 0.5) * big * 1.4}deg) translateZ(6px)`;
    el.style.setProperty('--gx', x * 100 + '%'); el.style.setProperty('--gy', y * 100 + '%');
    el.classList.add('tilting');
  });
  function reset(el) { el.style.transform = ''; el.classList.remove('tilting'); }
  document.addEventListener('mouseleave', () => cur && reset(cur));

  /* ---------- Click burst ---------- */
  document.addEventListener('click', e => {
    if (reduce) return;
    const b = document.createElement('div'); b.className = 'cy-burst';
    b.style.left = e.clientX + 'px'; b.style.top = e.clientY + 'px';
    document.body.appendChild(b); setTimeout(() => b.remove(), 650);
  });

  /* ---------- 3D high-fidelity cyber threat globe with inertia drag & tactical HUD ---------- */
  const cv = $('#cy-globe');
  if (cv) {
    const ctx = cv.getContext('2d');
    let W, H, R, rotY = 0.5, rotX = -0.28, vy = 0.0035, vx = 0, drag = false, lx = 0, ly = 0;
    
    // Generate uniform Fibonacci sphere points
    const pts = [];
    const numPts = 320;
    const phi = (1 + Math.sqrt(5)) / 2;
    for (let i = 0; i < numPts; i++) {
      const theta = 2 * Math.PI * i / phi;
      const s = 1 - (2 * i) / (numPts - 1);
      const la = Math.asin(Math.max(-1, Math.min(1, s)));
      const lo = theta % (Math.PI * 2);
      // Determine if node is a bright junction
      const isJunction = i % 7 === 0;
      pts.push({ la, lo, isJunction });
    }

    // Active threats and safe intercept nodes
    const nodes = [
      { la: 0.45, lo: 1.2, bad: true, label: 'PHISH_HOOK_91', ping: 0 },
      { la: -0.3, lo: 2.8, bad: true, label: 'CREDENTIAL_HARVEST', ping: 0 },
      { la: 0.65, lo: 4.1, bad: false, label: 'SECURE_GATEWAY_NY', ping: 0 },
      { la: -0.5, lo: 5.4, bad: true, label: 'SMS_SPOOF_IN', ping: 0 },
      { la: 0.1,  lo: 0.3, bad: false, label: 'DNS_SHIELD_EU', ping: 0 },
      { la: -0.7, lo: 1.9, bad: true, label: 'BANK_CLONE_RO', ping: 0 }
    ];

    const arcs = [];
    const rings = [
      { tilt: 0.25, rot: 0, speed: 0.008, rScale: 1.15, col: 'rgba(0, 240, 255, 0.3)' },
      { tilt: -0.4, rot: 1.5, speed: -0.006, rScale: 1.28, col: 'rgba(0, 255, 156, 0.25)' }
    ];

    function size() {
      const r = cv.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
      const rw = r.width > 20 ? r.width : 340;
      const rh = r.height > 20 ? r.height : 340;
      W = cv.width = Math.floor(rw * d);
      H = cv.height = Math.floor(rh * d);
      R = Math.min(W, H) * 0.38;
    }
    addEventListener('resize', size);
    size();

    const P = (la, lo, r = R) => {
      const x = Math.cos(la) * Math.sin(lo + rotY);
      const y = Math.sin(la);
      const z = Math.cos(la) * Math.cos(lo + rotY);
      const y2 = y * Math.cos(rotX) - z * Math.sin(rotX);
      const z2 = y * Math.sin(rotX) + z * Math.cos(rotX);
      return { x: W / 2 + x * r, y: H / 2 - y2 * r, z: z2 };
    };

    const wrap = cv.parentElement;
    wrap.addEventListener('pointerdown', e => {
      drag = true;
      lx = e.clientX;
      ly = e.clientY;
      vy = 0;
      vx = 0;
      wrap.setPointerCapture(e.pointerId);
    });
    wrap.addEventListener('pointerup', () => { drag = false; });
    wrap.addEventListener('pointercancel', () => { drag = false; });
    wrap.addEventListener('pointermove', e => {
      if (!drag) return;
      const dx = e.clientX - lx;
      const dy = e.clientY - ly;
      rotY += dx * 0.008;
      rotX = Math.max(-1.2, Math.min(1.2, rotX + dy * 0.006));
      vy = dx * 0.0008;
      vx = dy * 0.0006;
      lx = e.clientX;
      ly = e.clientY;
    });

    wrap.addEventListener('click', e => {
      // Click spawns a new threat intercept ping
      const bad = Math.random() < 0.7;
      nodes.push({
        la: (Math.random() - 0.5) * 2.2,
        lo: Math.random() * 6.28,
        bad,
        label: bad ? 'SUSPICIOUS_PAYLOAD' : 'RESOLVED_HASH',
        ping: 1.0
      });
      if (nodes.length > 12) nodes.shift();
    });

    function frame(t) {
      requestAnimationFrame(frame);
      if (document.hidden || !$('#page-dashboard').classList.contains('active')) return;
      const rc = cv.getBoundingClientRect(), dd = Math.min(window.devicePixelRatio || 1, 2);
      if (Math.abs(cv.width - rc.width * dd) > 2 || Math.abs(cv.height - rc.height * dd) > 2) size();

      const acc = '#00f0ff';
      const red = '#ff2d95';
      const grn = '#00ff9c';

      ctx.clearRect(0, 0, W, H);

      // Inertia rotation
      if (!drag) {
        rotY += vy;
        rotX += vx;
        vy += (0.0035 - vy) * 0.03;
        vx *= 0.95;
      }

      const cx = W / 2, cy = H / 2;

      // 1. Atmosphere Glow & Star Halo
      const bgHalo = ctx.createRadialGradient(cx, cy, R * 0.4, cx, cy, R * 1.5);
      bgHalo.addColorStop(0, 'rgba(0, 240, 255, 0.09)');
      bgHalo.addColorStop(0.6, 'rgba(0, 120, 255, 0.04)');
      bgHalo.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = bgHalo;
      ctx.fillRect(0, 0, W, H);

      // 2. Equatorial Wireframe Rim
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.28)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();

      // 3. Orbiting Gyro Rings
      rings.forEach(ring => {
        ring.rot += ring.speed;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(ring.tilt);
        ctx.scale(1, 0.32);
        ctx.rotate(ring.rot);
        ctx.strokeStyle = ring.col;
        ctx.lineWidth = 1;
        ctx.setLineDash([8, 12]);
        ctx.beginPath();
        ctx.arc(0, 0, R * ring.rScale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      });

      // 4. Project sphere points
      const projectedPts = [];
      for (let i = 0; i < pts.length; i++) {
        const pt = pts[i];
        const q = P(pt.la, pt.lo);
        projectedPts.push({ ...q, isJunction: pt.isJunction });
      }

      // Draw geodesic mesh lines between close points on front face
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.16)';
      ctx.lineWidth = 0.8;
      for (let i = 0; i < projectedPts.length; i += 2) {
        const p1 = projectedPts[i];
        if (p1.z <= 0.1) continue;
        for (let j = i + 1; j < Math.min(projectedPts.length, i + 8); j++) {
          const p2 = projectedPts[j];
          if (p2.z <= 0.1) continue;
          const distSq = (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2;
          if (distSq < (R * 0.32) ** 2) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // Draw all sphere points
      for (const p of projectedPts) {
        if (p.z < -0.1) {
          // Back hemisphere: subtle dim dots
          ctx.fillStyle = 'rgba(0, 160, 255, 0.15)';
          ctx.fillRect(p.x - 0.7, p.y - 0.7, 1.4, 1.4);
        } else {
          // Front hemisphere: glowing dots with flare
          const alpha = 0.25 + p.z * 0.75;
          ctx.globalAlpha = alpha;
          if (p.isJunction && p.z > 0.4) {
            // Bright white junction node with diamond flare
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 8;
            ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
            // 4-point subtle flare
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x - 5, p.y); ctx.lineTo(p.x + 5, p.y);
            ctx.moveTo(p.x, p.y - 5); ctx.lineTo(p.x, p.y + 5);
            ctx.stroke();
            ctx.shadowBlur = 0;
          } else {
            ctx.fillStyle = acc;
            ctx.fillRect(p.x - 1.1, p.y - 1.1, 2.2, 2.2);
          }
          ctx.globalAlpha = 1;
        }
      }

      // 5. Threat Intercept Arcs
      if (Math.random() < 0.04 && arcs.length < 5) {
        const a = nodes[Math.floor(Math.random() * nodes.length)];
        const b = nodes[Math.floor(Math.random() * nodes.length)];
        if (a !== b) arcs.push({ a, b, k: 0 });
      }

      for (let i = arcs.length - 1; i >= 0; i--) {
        const A = arcs[i];
        A.k += 0.014;
        if (A.k > 1.4) { arcs.splice(i, 1); continue; }
        const isBad = A.a.bad || A.b.bad;
        ctx.strokeStyle = isBad ? red : grn;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        const N = 26, end = Math.min(1, A.k), start = Math.max(0, A.k - 0.45);
        let headPt = null;
        for (let s = 0; s <= N; s++) {
          const u = start + (end - start) * (s / N);
          const la = A.a.la + (A.b.la - A.a.la) * u;
          const lo = A.a.lo + (A.b.lo - A.a.lo) * u;
          const q = P(la, lo, R * (1 + Math.sin(u * Math.PI) * 0.32));
          ctx.globalAlpha = q.z > -0.1 ? 0.95 : 0.2;
          s ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y);
          if (s === N) headPt = q;
        }
        ctx.stroke();

        // Traveling spark head
        if (headPt && headPt.z > -0.1) {
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = isBad ? red : grn;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(headPt.x, headPt.y, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // 6. Threat and Defense Nodes
      for (const n of nodes) {
        const q = P(n.la, n.lo);
        if (q.z < -0.1) continue;
        const pulse = (Math.sin(t / 260 + n.lo * 5) + 1) / 2;
        const c = n.bad ? red : grn;

        // Expanding alert ring
        ctx.globalAlpha = 0.5 * (1 - pulse);
        ctx.strokeStyle = c;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(q.x, q.y, 5 + pulse * 18, 0, Math.PI * 2);
        ctx.stroke();

        // Solid node core
        ctx.globalAlpha = 1;
        ctx.fillStyle = c;
        ctx.shadowColor = c;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(q.x, q.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Label for threat node if high visibility
        if (q.z > 0.4) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.font = '9px "JetBrains Mono", monospace';
          ctx.fillText(n.label, q.x + 8, q.y + 3);
        }
      }

      // 7. Tactical HUD Overlay Info on Globe
      ctx.fillStyle = 'rgba(0, 240, 255, 0.75)';
      ctx.font = '10px "JetBrains Mono", monospace';
      const degY = Math.round(((rotY * 180 / Math.PI) % 360 + 360) % 360);
      const degX = Math.round(rotX * 180 / Math.PI);
      ctx.fillText(`AZIMUTH: ${degY}°  |  PITCH: ${degX}°`, 16, 24);
      ctx.fillText(`DEFENSE NODES: ${nodes.length} ONLINE`, 16, 40);

      ctx.fillStyle = 'rgba(0, 255, 156, 0.9)';
      ctx.fillText(`● 3D INTERCEPT ENGINE ACTIVE`, 16, H - 18);
    }
    requestAnimationFrame(frame);
  }

  /* =====================================================
     3D Interactive Scroll Dynamics on All Pages
     ===================================================== */
  let scrollVel = 0;
  let targetScrollVel = 0;
  let lastScrollY = window.scrollY;
  let scrollTicking = false;

  const scanBar = document.createElement('div');
  scanBar.id = 'cy-scroll-scanline';
  document.body.appendChild(scanBar);

  const depthHud = document.createElement('div');
  depthHud.id = 'cy-depth-hud';
  depthHud.innerHTML = `<span class="depth-dot">●</span> <span id="cy-depth-val">DEPTH 000m</span> // <span>Z-FLIGHT ACTIVE</span>`;
  document.body.appendChild(depthHud);
  const depthVal = document.getElementById('cy-depth-val');

  window.addEventListener('scroll', () => {
    if (reduce) return;
    const curY = window.scrollY;
    const dy = curY - lastScrollY;
    lastScrollY = curY;
    targetScrollVel = dy;
    if (!scrollTicking) {
      scrollTicking = true;
      requestAnimationFrame(updateScrollPhysics);
    }
  }, { passive: true });

  function updateScrollPhysics() {
    scrollVel += (targetScrollVel - scrollVel) * 0.22;
    targetScrollVel *= 0.88;

    const cards = document.querySelectorAll('.page.active .glass-card, .page.active .stat-card, .page.active .cy-hero, .page.active .cy-tele-card');
    const clampedTilt = Math.max(-12, Math.min(12, -scrollVel * 0.25));
    const clampedZ = Math.min(22, Math.abs(scrollVel) * 0.55);

    cards.forEach((card, i) => {
      const delayTilt = clampedTilt * (1 - (i % 3) * 0.1);
      if (Math.abs(scrollVel) > 0.12) {
        card.style.transform = `perspective(1000px) rotateX(${delayTilt}deg) translateZ(${clampedZ}px)`;
        card.style.boxShadow = `0 ${8 + Math.abs(clampedTilt) * 2}px ${26 + clampedZ}px rgba(0, 240, 255, ${0.1 + Math.abs(scrollVel) * 0.008})`;
      } else {
        card.style.transform = '';
        card.style.boxShadow = '';
      }
    });

    // Update scanline position
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const scrollRatio = window.scrollY / maxScroll;
    scanBar.style.transform = `translateY(${scrollRatio * window.innerHeight}px)`;
    scanBar.style.opacity = Math.abs(scrollVel) > 0.4 ? '0.85' : '0.2';

    // Update depth HUD
    if (depthVal) {
      const depthMeters = Math.floor(window.scrollY * 1.5 + Math.abs(scrollVel) * 2);
      depthVal.textContent = `DEPTH ${depthMeters.toString().padStart(4, '0')}m`;
    }

    if (Math.abs(scrollVel) > 0.05 || Math.abs(targetScrollVel) > 0.05) {
      requestAnimationFrame(updateScrollPhysics);
    } else {
      scrollVel = 0;
      targetScrollVel = 0;
      scrollTicking = false;
      cards.forEach(c => { c.style.transform = ''; c.style.boxShadow = ''; });
    }
  }
})();

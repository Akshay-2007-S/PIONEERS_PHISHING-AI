/**
 * PhishGuard AI — Next-Gen 3D Interactive Cyber Background Engine
 * Multi-Scene Volumetric 3D Environment with Real-Time Cursor Parallax,
 * True Perspective Math, 10 Dedicated Cyber Dimensions, & Smooth Morphing.
 * Zero external dependencies. Silky-smooth 60 FPS performance.
 */

(function () {
  'use strict';

  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cursorOrb = document.getElementById('cursor-orb');

  /* =====================================================
     GLOBAL DIMENSIONS & MOUSE PARALLAX PHYSICS
     ===================================================== */
  let W = window.innerWidth;
  let H = window.innerHeight;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  // Mouse coordinates and smooth camera inertia
  const mouse = {
    x: W * 0.5,
    y: H * 0.5,
    targetX: W * 0.5,
    targetY: H * 0.5,
    normX: 0,
    normY: 0,
    vx: 0,
    vy: 0,
    lastX: W * 0.5,
    lastY: H * 0.5,
    down: false
  };

  // 3D Camera with spring inertia & scroll flight
  const camera = {
    rotX: 0,
    rotY: 0,
    targetRotX: 0,
    targetRotY: 0,
    panX: 0,
    panY: 0,
    targetPanX: 0,
    targetPanY: 0,
    fov: 650,
    scrollZ: 0,
    targetScrollZ: 0,
    scrollPitch: 0
  };

  // Scroll dynamics & 3D Flight Physics
  const scrollState = {
    y: 0,
    targetY: 0,
    velocity: 0,
    targetVelocity: 0,
    lastScrollY: 0,
    warpIntensity: 0
  };

  window.addEventListener('scroll', () => {
    scrollState.targetY = window.scrollY;
    const dy = window.scrollY - scrollState.lastScrollY;
    scrollState.targetVelocity = dy;
    scrollState.lastScrollY = window.scrollY;
    scrollState.warpIntensity = Math.min(1.5, scrollState.warpIntensity + Math.abs(dy) * 0.04);
  }, { passive: true });

  // 3D Warp Streaks (activated during scrolling)
  const warpStreaks = Array.from({ length: 42 }, () => ({
    x: (Math.random() - 0.5) * 1600,
    y: (Math.random() - 0.5) * 1100,
    z: Math.random() * 1200 + 100,
    len: 25 + Math.random() * 55,
    speed: 16 + Math.random() * 22
  }));

  let enabled = true;
  let frameCount = 0;
  let shockwaves = [];

  /* =====================================================
     SCENE DEFINITIONS & STATE
     ===================================================== */
  const SCENE_NAMES = {
    dashboard: 'GLOBAL PLANETARY CYBER-SPHERE',
    scan: 'TACTICAL QUANTUM SCANNER & RADAR TUNNEL',
    email: 'CRYPTOGRAPHIC SHIELD VAULT',
    whatsapp: 'NEURAL COMMS MESH & WAVEFORM',
    trustnetwork: 'DECENTRALIZED CONSENSUS CONSTELLATION',
    browser: 'HEXAGONAL GEODESIC DEFENSE DOME',
    threats: 'DEEP CYBER THREAT TOPOLOGY',
    defenselab: 'QUANTUM PARTICLE COLLIDER & TESSERACT',
    history: 'TEMPORAL CHRONO-STACK & DATA CYLINDERS',
    settings: 'PRECISION SYSTEM GYROSCOPE & HUD MATRIX'
  };

  // Color palettes tailored for each cyber dimension
  const SCENE_THEMES = {
    dashboard: { primary: '#00f0ff', secondary: '#0077ff', accent: '#00ff9c', orb: 'rgba(0,240,255,0.7)' },
    scan: { primary: '#00ff9c', secondary: '#00f0ff', accent: '#ffea00', orb: 'rgba(0,255,156,0.7)' },
    email: { primary: '#bd00ff', secondary: '#00f0ff', accent: '#ff2d95', orb: 'rgba(189,0,255,0.7)' },
    whatsapp: { primary: '#00ff9c', secondary: '#25d366', accent: '#00f0ff', orb: 'rgba(37,211,102,0.7)' },
    trustnetwork: { primary: '#00e5ff', secondary: '#7000ff', accent: '#00ff9c', orb: 'rgba(0,229,255,0.7)' },
    browser: { primary: '#00c8ff', secondary: '#0055ff', accent: '#ff2d55', orb: 'rgba(0,200,255,0.7)' },
    threats: { primary: '#ff2d55', secondary: '#ff8800', accent: '#00f0ff', orb: 'rgba(255,45,85,0.7)' },
    defenselab: { primary: '#00ffff', secondary: '#ff00aa', accent: '#7000ff', orb: 'rgba(255,0,170,0.7)' },
    history: { primary: '#00b4d8', secondary: '#90e0ef', accent: '#48cae4', orb: 'rgba(0,180,216,0.7)' },
    settings: { primary: '#00f0ff', secondary: '#4cc9f0', accent: '#7209b7', orb: 'rgba(76,201,240,0.7)' }
  };

  let activeSceneKey = 'dashboard';
  let prevSceneKey = null;
  let transitionProgress = 1.0; // 1 = fully transitioned
  const TRANSITION_SPEED = 0.05;

  /* =====================================================
     RESIZE HANDLER
     ===================================================== */
  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    camera.fov = Math.max(500, Math.min(W, H) * 0.9);
  }
  window.addEventListener('resize', resize);
  resize();

  /* =====================================================
     CURSOR TRACKING & PARALLAX PHYSICS
     ===================================================== */
  window.addEventListener('mousemove', (e) => {
    mouse.targetX = e.clientX;
    mouse.targetY = e.clientY;

    // Move cursor orb
    if (cursorOrb) {
      cursorOrb.style.left = e.clientX + 'px';
      cursorOrb.style.top = e.clientY + 'px';
    }
  });

  window.addEventListener('mousedown', (e) => {
    mouse.down = true;
    createShockwave(e.clientX, e.clientY);
  });
  window.addEventListener('mouseup', () => { mouse.down = false; });

  window.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches[0]) {
      mouse.targetX = e.touches[0].clientX;
      mouse.targetY = e.touches[0].clientY;
      if (cursorOrb) {
        cursorOrb.style.left = mouse.targetX + 'px';
        cursorOrb.style.top = mouse.targetY + 'px';
      }
    }
  }, { passive: true });

  window.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches[0]) {
      createShockwave(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  function createShockwave(x, y) {
    shockwaves.push({
      x,
      y,
      r: 10,
      maxR: Math.max(W, H) * 0.45,
      alpha: 0.85,
      speed: 12
    });
    if (shockwaves.length > 6) shockwaves.shift();
  }

  /* =====================================================
     3D PROJECTION & TRANSFORMATION ENGINE
     ===================================================== */
  function project3D(x, y, z, cx = W * 0.5, cy = H * 0.5, customFov = camera.fov) {
    // Apply camera rotation (including dynamic scroll pitch tilt)
    const effectiveRotX = camera.rotX + camera.scrollPitch;
    const cosY = Math.cos(camera.rotY), sinY = Math.sin(camera.rotY);
    const cosX = Math.cos(effectiveRotX), sinX = Math.sin(effectiveRotX);

    // Rotate around Y
    const x1 = x * cosY - z * sinY;
    const z1 = x * sinY + z * cosY;

    // Rotate around X
    const y2 = y * cosX - z1 * sinX;
    const z2 = y * sinX + z1 * cosX;

    // Pan offset and dynamic scroll Z-flight depth travel
    const finalX = x1 + camera.panX;
    const finalY = y2 + camera.panY;
    const finalZ = z2 + 800 - (camera.scrollZ % 500); // Continuous 3D flight in Z

    if (finalZ <= 20) {
      return { px: 0, py: 0, scale: 0, visible: false, z: finalZ };
    }

    const scale = customFov / finalZ;
    const px = cx + finalX * scale;
    const py = cy + finalY * scale;

    return {
      px,
      py,
      scale,
      z: finalZ,
      visible: px >= -150 && px <= W + 150 && py >= -150 && py <= H + 150
    };
  }

  /* =====================================================
     SCENE 1: DASHBOARD
     Holographic Planetary Cyber-Sphere with Orbital Satellite Rings
     ===================================================== */
  const dashGlobe = {
    rot: 0,
    pts: [],
    arcs: [],
    satellites: [
      { ring: 0, angle: 0.2, speed: 0.015, label: 'SAT_NODE_01' },
      { ring: 1, angle: 2.1, speed: -0.012, label: 'GEO_SHIELD_04' },
      { ring: 2, angle: 4.3, speed: 0.018, label: 'QUANTUM_RELAY' }
    ]
  };

  // Generate uniform Fibonacci sphere
  (function initDashGlobe() {
    const count = 280;
    const phi = (1 + Math.sqrt(5)) / 2;
    for (let i = 0; i < count; i++) {
      const theta = 2 * Math.PI * i / phi;
      const s = 1 - (2 * i) / (count - 1);
      const lat = Math.asin(Math.max(-1, Math.min(1, s)));
      const lon = theta;
      const isHub = i % 14 === 0;
      dashGlobe.pts.push({ lat, lon, isHub, pulse: Math.random() });
    }
    // Great circle arcs
    for (let i = 0; i < 5; i++) {
      dashGlobe.arcs.push({
        p1: Math.floor(Math.random() * count),
        p2: Math.floor(Math.random() * count),
        prog: Math.random(),
        speed: 0.006 + Math.random() * 0.008
      });
    }
  })();

  function drawDashboardScene(alpha) {
    if (alpha <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = alpha;

    dashGlobe.rot += 0.004 + (mouse.vx * 0.0001) + (scrollState.velocity * 0.0008);
    const R = Math.min(W, H) * 0.35;
    const cx = W * 0.58; // Positioned slightly to the right for gorgeous layout
    const cy = H * 0.5;

    // 1. Atmosphere Glow & Outer Grid Field
    const glow = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 1.55);
    glow.addColorStop(0, 'rgba(0, 240, 255, 0.12)');
    glow.addColorStop(0.5, 'rgba(0, 119, 255, 0.05)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // 2. 3D Planetary Sphere Nodes
    const projected = [];
    dashGlobe.pts.forEach((p, idx) => {
      const lon = p.lon + dashGlobe.rot;
      const x = R * Math.cos(p.lat) * Math.sin(lon);
      const y = R * Math.sin(p.lat);
      const z = R * Math.cos(p.lat) * Math.cos(lon);

      const proj = project3D(x, y, z, cx, cy);
      projected.push(proj);

      if (proj.visible && proj.scale > 0) {
        const depthFade = Math.max(0.15, Math.min(1, (1200 - proj.z) / 800));
        ctx.fillStyle = p.isHub ? '#00ff9c' : '#00f0ff';
        ctx.globalAlpha = alpha * (p.isHub ? 0.95 : 0.55) * depthFade;

        const sz = (p.isHub ? 3.5 : 1.6) * proj.scale;
        ctx.beginPath();
        ctx.arc(proj.px, proj.py, sz, 0, Math.PI * 2);
        ctx.fill();

        if (p.isHub) {
          ctx.strokeStyle = 'rgba(0, 255, 156, 0.35)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(proj.px, proj.py, sz * 2.5, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    });

    // 3. Great Circle Dynamic Cyber Arcs
    dashGlobe.arcs.forEach(arc => {
      arc.prog += arc.speed;
      if (arc.prog > 1) {
        arc.prog = 0;
        arc.p1 = Math.floor(Math.random() * dashGlobe.pts.length);
        arc.p2 = Math.floor(Math.random() * dashGlobe.pts.length);
      }
      const a = projected[arc.p1];
      const b = projected[arc.p2];
      if (a && b && a.visible && b.visible) {
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.px, a.py);
        const midX = (a.px + b.px) * 0.5 + (a.px - b.px) * 0.15;
        const midY = (a.py + b.py) * 0.5 - 25;
        ctx.quadraticCurveTo(midX, midY, b.px, b.py);
        ctx.stroke();

        // Traveling data packet
        const t = arc.prog;
        const px = (1 - t) * (1 - t) * a.px + 2 * (1 - t) * t * midX + t * t * b.px;
        const py = (1 - t) * (1 - t) * a.py + 2 * (1 - t) * t * midY + t * t * b.py;
        ctx.fillStyle = '#ff2d95';
        ctx.shadowColor = '#ff2d95';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });

    // 4. Orbital Gyro Rings
    const rings = [
      { rScale: 1.25, tiltX: 0.35, tiltY: 0.15, col: 'rgba(0, 240, 255, 0.35)' },
      { rScale: 1.45, tiltX: -0.45, tiltY: 0.6, col: 'rgba(0, 255, 156, 0.28)' },
      { rScale: 1.68, tiltX: 0.75, tiltY: -0.3, col: 'rgba(255, 45, 149, 0.22)' }
    ];

    rings.forEach((ring, idx) => {
      ctx.strokeStyle = ring.col;
      ctx.lineWidth = 1;
      ctx.setLineDash([8, 12]);
      ctx.beginPath();
      const steps = 48;
      for (let i = 0; i <= steps; i++) {
        const ang = (i / steps) * Math.PI * 2;
        const rx = R * ring.rScale * Math.cos(ang);
        const rz = R * ring.rScale * Math.sin(ang);
        // Tilt ring
        const y = rx * Math.sin(ring.tiltX) + rz * Math.sin(ring.tiltY);
        const x = rx * Math.cos(ring.tiltX);
        const z = rz * Math.cos(ring.tiltY);
        const p = project3D(x, y, z, cx, cy);
        if (i === 0) ctx.moveTo(p.px, p.py);
        else ctx.lineTo(p.px, p.py);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Satellites orbiting
      const sat = dashGlobe.satellites[idx];
      sat.angle += sat.speed;
      const sx = R * ring.rScale * Math.cos(sat.angle);
      const sz = R * ring.rScale * Math.sin(sat.angle);
      const sy = sx * Math.sin(ring.tiltX) + sz * Math.sin(ring.tiltY);
      const sp = project3D(sx * Math.cos(ring.tiltX), sy, sz * Math.cos(ring.tiltY), cx, cy);
      if (sp.visible) {
        ctx.fillStyle = idx === 2 ? '#ff2d95' : idx === 1 ? '#00ff9c' : '#00f0ff';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(sp.px, sp.py, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });

    ctx.restore();
  }

  /* =====================================================
     SCENE 2: SCAN & ANALYZE
     3D Tactical Quantum Scanner & Volumetric Radar Tunnel
     ===================================================== */
  const scanData = {
    beamAngle: 0,
    pulseR: 0,
    rings: 8,
    targets: [
      { angle: 0.6, dist: 220, label: 'MALICIOUS_HASH_09', ping: 0 },
      { angle: 2.4, dist: 340, label: 'ZERO_DAY_PAYLOAD', ping: 0 },
      { angle: 4.1, dist: 180, label: 'CLEAN_VERIFIED_URL', ping: 0 }
    ]
  };

  function drawScanScene(alpha) {
    if (alpha <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = alpha;

    scanData.beamAngle += 0.022;
    scanData.pulseR += 4;
    if (scanData.pulseR > 500) scanData.pulseR = 0;

    const cx = W * 0.55;
    const cy = H * 0.5;

    // 1. Perspective Depth Radar Tunnel (Concentric rings receding in Z)
    for (let i = 0; i < scanData.rings; i++) {
      const z = i * 140 - (((frameCount * 3) + scrollState.y * 1.5) % 140);
      const pCenter = project3D(0, 0, z, cx, cy);
      const pEdge = project3D(420, 0, z, cx, cy);
      const r = Math.abs(pEdge.px - pCenter.px);

      if (pCenter.visible && r > 2) {
        const ringAlpha = (1 - z / 1120) * 0.45;
        ctx.strokeStyle = `rgba(0, 255, 156, ${ringAlpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(pCenter.px, pCenter.py, r, 0, Math.PI * 2);
        ctx.stroke();

        // Crosshairs inside tunnel
        ctx.strokeStyle = `rgba(0, 240, 255, ${ringAlpha * 0.4})`;
        ctx.beginPath();
        ctx.moveTo(pCenter.px - r, pCenter.py); ctx.lineTo(pCenter.px + r, pCenter.py);
        ctx.moveTo(pCenter.px, pCenter.py - r); ctx.lineTo(pCenter.px, pCenter.py + r);
        ctx.stroke();
      }
    }

    // 2. Revolving 3D Radar Sweep Cone
    const sweepR = Math.min(W, H) * 0.46;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(scanData.beamAngle);

    const sweepGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, sweepR);
    sweepGrad.addColorStop(0, 'rgba(0, 255, 156, 0.4)');
    sweepGrad.addColorStop(0.8, 'rgba(0, 255, 156, 0.05)');
    sweepGrad.addColorStop(1, 'transparent');

    ctx.fillStyle = sweepGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, sweepR, 0, Math.PI * 0.35);
    ctx.closePath();
    ctx.fill();

    // Leading laser beam
    ctx.strokeStyle = '#00ff9c';
    ctx.shadowColor = '#00ff9c';
    ctx.shadowBlur = 12;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(sweepR * Math.cos(Math.PI * 0.35), sweepR * Math.sin(Math.PI * 0.35));
    ctx.stroke();
    ctx.restore();

    // 3. Dynamic Cursor 3D Target Lock Reticle
    const tx = mouse.x, ty = mouse.y;
    const lockSize = 28 + Math.sin(frameCount * 0.1) * 3;
    ctx.strokeStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 8;
    ctx.lineWidth = 1.8;

    // Corner brackets
    const bLen = 10;
    // Top-left
    ctx.beginPath(); ctx.moveTo(tx - lockSize, ty - lockSize + bLen); ctx.lineTo(tx - lockSize, ty - lockSize); ctx.lineTo(tx - lockSize + bLen, ty - lockSize); ctx.stroke();
    // Top-right
    ctx.beginPath(); ctx.moveTo(tx + lockSize - bLen, ty - lockSize); ctx.lineTo(tx + lockSize, ty - lockSize); ctx.lineTo(tx + lockSize, ty - lockSize + bLen); ctx.stroke();
    // Bottom-left
    ctx.beginPath(); ctx.moveTo(tx - lockSize, ty + lockSize - bLen); ctx.lineTo(tx - lockSize, ty + lockSize); ctx.lineTo(tx - lockSize + bLen, ty + lockSize); ctx.stroke();
    // Bottom-right
    ctx.beginPath(); ctx.moveTo(tx + lockSize - bLen, ty + lockSize); ctx.lineTo(tx + lockSize, ty + lockSize); ctx.lineTo(tx + lockSize, ty + lockSize - bLen); ctx.stroke();

    // Crosshair dot & target lock text
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath(); ctx.arc(tx, ty, 2.5, 0, Math.PI * 2); ctx.fill();

    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillStyle = '#00ff9c';
    ctx.fillText(`LOCK: [X:${Math.floor(tx)} Y:${Math.floor(ty)}] FREQ: 98.4GHz`, tx + lockSize + 10, ty - 6);
    ctx.fillStyle = 'rgba(0, 240, 255, 0.7)';
    ctx.fillText(`STATUS: DEEP_HEURISTIC_ACTIVE`, tx + lockSize + 10, ty + 10);
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  /* =====================================================
     SCENE 3: EMAIL PROTECTION
     Cryptographic Shield Vault & Rotating 3D Polyhedron Core
     ===================================================== */
  const emailVault = {
    rotX: 0,
    rotY: 0,
    rotZ: 0,
    // Icosahedron vertices (12 vertices)
    vertices: [],
    edges: [],
    dataPackets: []
  };

  (function initEmailVault() {
    const t = (1 + Math.sqrt(5)) / 2;
    const v = [
      [-1,  t,  0], [ 1,  t,  0], [-1, -t,  0], [ 1, -t,  0],
      [ 0, -1,  t], [ 0,  1,  t], [ 0, -1, -t], [ 0,  1, -t],
      [ t,  0, -1], [ t,  0,  1], [-t,  0, -1], [-t,  0,  1]
    ];
    emailVault.vertices = v.map(p => {
      const len = Math.sqrt(p[0]*p[0] + p[1]*p[1] + p[2]*p[2]);
      return [p[0] / len, p[1] / len, p[2] / len];
    });

    // Generate edges
    for (let i = 0; i < emailVault.vertices.length; i++) {
      for (let j = i + 1; j < emailVault.vertices.length; j++) {
        const a = emailVault.vertices[i], b = emailVault.vertices[j];
        const dist = Math.hypot(a[0]-b[0], a[1]-b[1], a[2]-b[2]);
        if (Math.abs(dist - 1.05) < 0.2) {
          emailVault.edges.push([i, j]);
        }
      }
    }

    // Encrypted byte tokens
    const codes = ['AES-GCM', 'SHA-256', '0x7F', '0xAA', 'LOCK_OK', 'DKIM_PASS', 'SPF_VAL', 'TLS_1.3'];
    for (let i = 0; i < 24; i++) {
      emailVault.dataPackets.push({
        text: codes[i % codes.length],
        dist: 200 + Math.random() * 260,
        angle: Math.random() * Math.PI * 2,
        speed: 0.008 + Math.random() * 0.012,
        yOffset: (Math.random() - 0.5) * 180
      });
    }
  })();

  function drawEmailScene(alpha) {
    if (alpha <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = alpha;

    emailVault.rotX += 0.009;
    emailVault.rotY += 0.014;
    emailVault.rotZ += 0.005;

    const cx = W * 0.58;
    const cy = H * 0.5;
    const R = Math.min(W, H) * 0.28;

    // 1. Outer Concentric Shield Plates (Hexagonal rings)
    for (let s = 1; s <= 3; s++) {
      const shieldR = R * (1 + s * 0.35);
      const shieldRot = frameCount * 0.008 * (s % 2 === 0 ? 1 : -1);
      ctx.strokeStyle = s === 1 ? 'rgba(189, 0, 255, 0.4)' : 'rgba(0, 240, 255, 0.22)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const ang = (Math.PI / 3) * i + shieldRot;
        const x = shieldR * Math.cos(ang);
        const z = shieldR * Math.sin(ang);
        const p = project3D(x, 0, z, cx, cy);
        if (i === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // 2. Rotating 3D Cryptographic Icosahedron Core
    const projectedV = emailVault.vertices.map(v => {
      // 3D rotations
      let x = v[0] * R, y = v[1] * R, z = v[2] * R;

      // Rotate X
      let y1 = y * Math.cos(emailVault.rotX) - z * Math.sin(emailVault.rotX);
      let z1 = y * Math.sin(emailVault.rotX) + z * Math.cos(emailVault.rotX);
      // Rotate Y
      let x2 = x * Math.cos(emailVault.rotY) + z1 * Math.sin(emailVault.rotY);
      let z2 = -x * Math.sin(emailVault.rotY) + z1 * Math.cos(emailVault.rotY);
      // Rotate Z
      let x3 = x2 * Math.cos(emailVault.rotZ) - y1 * Math.sin(emailVault.rotZ);
      let y3 = x2 * Math.sin(emailVault.rotZ) + y1 * Math.cos(emailVault.rotZ);

      return project3D(x3, y3, z2, cx, cy);
    });

    // Draw Edges
    ctx.strokeStyle = '#bd00ff';
    ctx.shadowColor = '#bd00ff';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 1.5;

    emailVault.edges.forEach(([i, j]) => {
      const a = projectedV[i], b = projectedV[j];
      if (a.visible && b.visible) {
        ctx.beginPath();
        ctx.moveTo(a.px, a.py);
        ctx.lineTo(b.px, b.py);
        ctx.stroke();
      }
    });
    ctx.shadowBlur = 0;

    // Draw Vertex Nodes
    projectedV.forEach(p => {
      if (p.visible) {
        ctx.fillStyle = '#00f0ff';
        ctx.beginPath();
        ctx.arc(p.px, p.py, 3.5 * p.scale, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // 3. Encrypted Data Shards Orbiting Core
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillStyle = 'rgba(0, 240, 255, 0.75)';
    emailVault.dataPackets.forEach(pkt => {
      pkt.angle += pkt.speed;
      const x = Math.cos(pkt.angle) * pkt.dist;
      const z = Math.sin(pkt.angle) * pkt.dist;
      const p = project3D(x, pkt.yOffset, z, cx, cy);
      if (p.visible) {
        ctx.fillText(pkt.text, p.px, p.py);
      }
    });

    ctx.restore();
  }

  /* =====================================================
     SCENE 4: WHATSAPP / SMS
     Neural Comms Mesh & 3D Floating Waveform Ribbon
     ===================================================== */
  function drawWhatsAppScene(alpha) {
    if (alpha <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = alpha;

    const cx = W * 0.5;
    const cy = H * 0.55;
    const cols = 28, rows = 14;
    const spacingX = 55, spacingZ = 50;

    // Dynamic wave mesh with cursor repulsion & scroll modulation
    const meshPoints = [];
    const time = frameCount * 0.035 + scrollState.y * 0.015;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = (c - cols * 0.5) * spacingX;
        const z = (r - rows * 0.5) * spacingZ;

        // Base harmonic wave
        let y = Math.sin(time + c * 0.35 + r * 0.25) * 45 + Math.cos(time * 0.8 + c * 0.2) * 25;

        // Mouse proximity ripple
        const p2d = project3D(x, y, z, cx, cy);
        const distToMouse = Math.hypot(p2d.px - mouse.x, p2d.py - mouse.y);
        if (distToMouse < 220) {
          y -= (1 - distToMouse / 220) * 80;
        }

        meshPoints.push(project3D(x, y, z, cx, cy));
      }
    }

    // Draw mesh lines
    ctx.lineWidth = 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const p = meshPoints[idx];

        if (c < cols - 1) {
          const right = meshPoints[idx + 1];
          if (p.visible && right.visible) {
            ctx.strokeStyle = r % 2 === 0 ? 'rgba(37, 211, 102, 0.4)' : 'rgba(0, 240, 255, 0.35)';
            ctx.beginPath();
            ctx.moveTo(p.px, p.py);
            ctx.lineTo(right.px, right.py);
            ctx.stroke();
          }
        }

        if (r < rows - 1) {
          const down = meshPoints[idx + cols];
          if (p.visible && down.visible) {
            ctx.strokeStyle = 'rgba(0, 255, 156, 0.22)';
            ctx.beginPath();
            ctx.moveTo(p.px, p.py);
            ctx.lineTo(down.px, down.py);
            ctx.stroke();
          }
        }
      }
    }

    // Floating Holographic SMS / WhatsApp Communication Packets
    for (let i = 0; i < 6; i++) {
      const floatX = Math.sin(time * 0.6 + i * 1.2) * 350;
      const floatY = -120 + Math.sin(time + i) * 30;
      const floatZ = Math.cos(time * 0.5 + i * 0.8) * 200;
      const fp = project3D(floatX, floatY, floatZ, cx, cy);

      if (fp.visible) {
        ctx.fillStyle = 'rgba(6, 24, 18, 0.85)';
        ctx.strokeStyle = '#25d366';
        ctx.shadowColor = '#25d366';
        ctx.shadowBlur = 8;
        ctx.lineWidth = 1.2;

        const bw = 90, bh = 32;
        ctx.fillRect(fp.px - bw * 0.5, fp.py - bh * 0.5, bw, bh);
        ctx.strokeRect(fp.px - bw * 0.5, fp.py - bh * 0.5, bw, bh);

        ctx.font = '9px Orbitron, sans-serif';
        ctx.fillStyle = '#00ff9c';
        ctx.fillText(`● SMS_E2EE`, fp.px - bw * 0.5 + 8, fp.py - bh * 0.5 + 14);
        ctx.font = '8px JetBrains Mono, monospace';
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.fillText(`SECURE PACKET`, fp.px - bw * 0.5 + 8, fp.py - bh * 0.5 + 24);
        ctx.shadowBlur = 0;
      }
    }

    ctx.restore();
  }

  /* =====================================================
     SCENE 5: TRUST NETWORK
     Decentralized Consensus Mesh & 3D P2P Constellation
     ===================================================== */
  const trustNet = {
    nodes: [],
    rotX: 0,
    rotY: 0
  };

  (function initTrustNet() {
    for (let i = 0; i < 42; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = Math.cbrt(Math.random()) * 380;
      const sinPhi = Math.sin(phi);
      trustNet.nodes.push({
        x: r * sinPhi * Math.cos(theta),
        y: r * sinPhi * Math.sin(theta),
        z: r * Math.cos(phi),
        isMaster: i < 5,
        pulse: Math.random()
      });
    }
  })();

  function drawTrustNetworkScene(alpha) {
    if (alpha <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = alpha;

    trustNet.rotY += 0.005;
    trustNet.rotX += 0.002;

    const cx = W * 0.58;
    const cy = H * 0.5;

    // Rotate and project nodes
    const projected = trustNet.nodes.map(n => {
      // Rotation
      const cosY = Math.cos(trustNet.rotY), sinY = Math.sin(trustNet.rotY);
      const x1 = n.x * cosY - n.z * sinY;
      const z1 = n.x * sinY + n.z * cosY;
      return {
        ...project3D(x1, n.y, z1, cx, cy),
        isMaster: n.isMaster
      };
    });

    // P2P Energy Arcs between adjacent nodes
    ctx.lineWidth = 0.8;
    for (let i = 0; i < projected.length; i++) {
      for (let j = i + 1; j < projected.length; j++) {
        const a = projected[i], b = projected[j];
        if (a.visible && b.visible) {
          const d = Math.hypot(a.px - b.px, a.py - b.py);
          if (d < 140) {
            ctx.strokeStyle = `rgba(0, 229, 255, ${(1 - d / 140) * 0.35})`;
            ctx.beginPath();
            ctx.moveTo(a.px, a.py);
            ctx.lineTo(b.px, b.py);
            ctx.stroke();
          }
        }
      }
    }

    // Draw Peer Nodes
    projected.forEach(p => {
      if (p.visible) {
        ctx.fillStyle = p.isMaster ? '#00ff9c' : '#00e5ff';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = p.isMaster ? 12 : 6;
        ctx.beginPath();
        ctx.arc(p.px, p.py, (p.isMaster ? 4.5 : 2.5) * p.scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });

    // Interactive connection to Cursor ("YOU" Validator Node)
    ctx.strokeStyle = 'rgba(0, 255, 156, 0.6)';
    ctx.setLineDash([4, 4]);
    projected.slice(0, 4).forEach(p => {
      if (p.visible) {
        ctx.beginPath();
        ctx.moveTo(mouse.x, mouse.y);
        ctx.lineTo(p.px, p.py);
        ctx.stroke();
      }
    });
    ctx.setLineDash([]);

    ctx.restore();
  }

  /* =====================================================
     SCENE 6: BROWSER GUARD
     Hexagonal Geodesic Defense Dome & Cyber Grid Barrier
     ===================================================== */
  function drawBrowserGuardScene(alpha) {
    if (alpha <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = alpha;

    const R = 44;
    const cols = Math.ceil(W / (R * 1.5)) + 4;
    const rows = Math.ceil(H / (R * Math.sqrt(3))) + 4;
    const offset = frameCount * 0.3;

    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const cx = col * R * 1.5 + (row % 2 === 0 ? 0 : R * 0.75) + (offset % (R * 1.5));
        const cy = row * R * Math.sqrt(3) * 0.5;

        // Proximity to mouse creates reactive shield barrier illumination
        const dist = Math.hypot(cx - mouse.x, cy - mouse.y);
        const prox = Math.max(0, 1 - dist / 260);

        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 6;
          const hx = cx + (R * 0.92) * Math.cos(angle);
          const hy = cy + (R * 0.92) * Math.sin(angle);
          if (i === 0) ctx.moveTo(hx, hy); else ctx.lineTo(hx, hy);
        }
        ctx.closePath();

        if (prox > 0) {
          ctx.fillStyle = `rgba(0, 200, 255, ${prox * 0.18})`;
          ctx.fill();
          ctx.strokeStyle = `rgba(0, 240, 255, ${0.1 + prox * 0.7})`;
          ctx.lineWidth = 1 + prox * 1.5;
        } else {
          ctx.strokeStyle = 'rgba(0, 200, 255, 0.05)';
          ctx.lineWidth = 0.5;
        }
        ctx.stroke();
      }
    }

    // Defense Dome Threat Deflection Beam
    if (frameCount % 90 < 45) {
      const laserX = W * 0.85;
      const laserY = H * 0.3;
      ctx.strokeStyle = 'rgba(255, 45, 85, 0.6)';
      ctx.shadowColor = '#ff2d55';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W + 50, laserY - 100);
      ctx.lineTo(laserX, laserY);
      ctx.stroke();

      // Shield deflection ripple
      ctx.strokeStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.beginPath();
      ctx.arc(laserX, laserY, (frameCount % 45) * 1.8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }

  /* =====================================================
     SCENE 7: THREAT GRAPH
     Deep Cyber Threat Topology & Gravitational Anomaly Vectors
     ===================================================== */
  const threatGraph = {
    clusters: [
      { name: 'BOTNET_MIRAI_C2', col: '#ff2d55', nodes: [] },
      { name: 'PHISH_REDIRECT_PROXY', col: '#ffea00', nodes: [] },
      { name: 'CLEAN_VERIFIED_RELAY', col: '#00f0ff', nodes: [] }
    ]
  };

  (function initThreatGraph() {
    threatGraph.clusters.forEach((c, cIdx) => {
      const baseAngle = (cIdx / 3) * Math.PI * 2;
      const centerDist = 260;
      const ccX = Math.cos(baseAngle) * centerDist;
      const ccY = Math.sin(baseAngle) * centerDist;

      for (let i = 0; i < 14; i++) {
        c.nodes.push({
          x: ccX + (Math.random() - 0.5) * 160,
          y: ccY + (Math.random() - 0.5) * 160,
          z: (Math.random() - 0.5) * 200,
          vx: 0,
          vy: 0,
          risk: cIdx === 0 ? 95 : cIdx === 1 ? 55 : 5
        });
      }
    });
  })();

  function drawThreatScene(alpha) {
    if (alpha <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = alpha;

    const cx = W * 0.58;
    const cy = H * 0.5;

    threatGraph.clusters.forEach((c) => {
      const projected = c.nodes.map(n => {
        // Gravitational pull toward mouse cursor
        const p2d = project3D(n.x, n.y, n.z, cx, cy);
        const dx = mouse.x - p2d.px;
        const dy = mouse.y - p2d.py;
        const d = Math.hypot(dx, dy);
        if (d < 180 && d > 1) {
          n.x += (dx / d) * 0.8;
          n.y += (dy / d) * 0.8;
        }
        return project3D(n.x, n.y, n.z, cx, cy);
      });

      // Internal Cluster Connections
      ctx.lineWidth = 1;
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const a = projected[i], b = projected[j];
          if (a.visible && b.visible) {
            const d = Math.hypot(a.px - b.px, a.py - b.py);
            if (d < 90) {
              ctx.strokeStyle = c.col + '33';
              ctx.beginPath();
              ctx.moveTo(a.px, a.py);
              ctx.lineTo(b.px, b.py);
              ctx.stroke();
            }
          }
        }
      }

      // Nodes
      projected.forEach(p => {
        if (p.visible) {
          ctx.fillStyle = c.col;
          ctx.shadowColor = c.col;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(p.px, p.py, 3.5 * p.scale, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });
    });

    ctx.restore();
  }

  /* =====================================================
     SCENE 8: DEFENSE LAB
     Quantum Particle Collider & 4D Tesseract Hypercube
     ===================================================== */
  const tesseract = {
    // 16 vertices of a 4D hypercube
    vertices: [],
    edges: [],
    rotXW: 0,
    rotYZ: 0
  };

  (function initTesseract() {
    for (let i = 0; i < 16; i++) {
      const x = (i & 1) ? 1 : -1;
      const y = (i & 2) ? 1 : -1;
      const z = (i & 4) ? 1 : -1;
      const w = (i & 8) ? 1 : -1;
      tesseract.vertices.push([x, y, z, w]);
    }

    // Connect vertices differing by exactly 1 bit
    for (let i = 0; i < 16; i++) {
      for (let j = i + 1; j < 16; j++) {
        let diff = 0;
        for (let k = 0; k < 4; k++) {
          if (tesseract.vertices[i][k] !== tesseract.vertices[j][k]) diff++;
        }
        if (diff === 1) tesseract.edges.push([i, j]);
      }
    }
  })();

  function drawDefenseLabScene(alpha) {
    if (alpha <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = alpha;

    tesseract.rotXW += 0.012;
    tesseract.rotYZ += 0.015;

    const cx = W * 0.58;
    const cy = H * 0.5;
    const size = Math.min(W, H) * 0.22;

    // 4D Rotation and Stereographic Projection to 3D
    const projected3D = tesseract.vertices.map(v => {
      let x = v[0], y = v[1], z = v[2], w = v[3];

      // Rotate in X-W plane
      const cosXW = Math.cos(tesseract.rotXW), sinXW = Math.sin(tesseract.rotXW);
      const x1 = x * cosXW - w * sinXW;
      const w1 = x * sinXW + w * cosXW;

      // Rotate in Y-Z plane
      const cosYZ = Math.cos(tesseract.rotYZ), sinYZ = Math.sin(tesseract.rotYZ);
      const y1 = y * cosYZ - z * sinYZ;
      const z1 = y * sinYZ + z * cosYZ;

      // Project 4D to 3D
      const distance4D = 2.2;
      const wScale = 1 / (distance4D - w1);
      return project3D(x1 * wScale * size, y1 * wScale * size, z1 * wScale * size, cx, cy);
    });

    // Draw Tesseract Edges
    ctx.strokeStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 1.4;

    tesseract.edges.forEach(([i, j]) => {
      const a = projected3D[i], b = projected3D[j];
      if (a.visible && b.visible) {
        ctx.beginPath();
        ctx.moveTo(a.px, a.py);
        ctx.lineTo(b.px, b.py);
        ctx.stroke();
      }
    });
    ctx.shadowBlur = 0;

    // 3 Particle Collider Accelerator Rings
    for (let r = 0; r < 3; r++) {
      const ringAngle = frameCount * 0.02 * (r % 2 === 0 ? 1 : -1) + r * 1.2;
      ctx.strokeStyle = r === 0 ? 'rgba(255, 0, 170, 0.4)' : r === 1 ? 'rgba(0, 255, 255, 0.35)' : 'rgba(112, 0, 255, 0.3)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, size * (1.3 + r * 0.3), ringAngle, ringAngle + Math.PI * 1.5);
      ctx.stroke();
    }

    ctx.restore();
  }

  /* =====================================================
     SCENE 9: SCAN HISTORY
     Temporal Chrono-Stack & Holographic Translucent Records
     ===================================================== */
  function drawHistoryScene(alpha) {
    if (alpha <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = alpha;

    const cx = W * 0.58;
    const cy = H * 0.52;
    const layers = 7;
    const R = Math.min(W, H) * 0.32;

    // Vertical Timeline laser axis
    const topP = project3D(0, -280, 0, cx, cy);
    const btmP = project3D(0, 280, 0, cx, cy);
    if (topP.visible && btmP.visible) {
      ctx.strokeStyle = '#00b4d8';
      ctx.shadowColor = '#00b4d8';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(topP.px, topP.py);
      ctx.lineTo(btmP.px, btmP.py);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Chrono-Stack Discs floating in perspective with scroll fanning
    for (let i = 0; i < layers; i++) {
      const y = (i - layers * 0.5) * (65 + Math.sin(scrollState.y * 0.008 + i) * 18);
      const rot = frameCount * 0.008 + i * 0.4 + scrollState.y * 0.004;
      const discR = R * (0.9 - Math.abs(i - layers * 0.5) * 0.08);

      ctx.strokeStyle = i === 3 ? 'rgba(0, 240, 255, 0.7)' : 'rgba(0, 180, 216, 0.3)';
      ctx.lineWidth = i === 3 ? 1.8 : 1;

      ctx.beginPath();
      for (let a = 0; a <= 36; a++) {
        const ang = (a / 36) * Math.PI * 2;
        const px = discR * Math.cos(ang + rot);
        const pz = discR * Math.sin(ang + rot);
        const p = project3D(px, y, pz, cx, cy);
        if (a === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  /* =====================================================
     SCENE 10: SETTINGS
     Precision System Gyroscope & Holographic HUD Matrix
     ===================================================== */
  function drawSettingsScene(alpha) {
    if (alpha <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = alpha;

    const cx = W * 0.58;
    const cy = H * 0.5;
    const R = Math.min(W, H) * 0.32;

    // 3 Concentric Gimbal Gyroscope Rings rotating on 3 axes
    const gimbals = [
      { r: R, speed: 0.008, axis: 'X', col: '#00f0ff' },
      { r: R * 0.78, speed: -0.012, axis: 'Y', col: '#4cc9f0' },
      { r: R * 0.56, speed: 0.015, axis: 'Z', col: '#7209b7' }
    ];

    gimbals.forEach((g) => {
      ctx.strokeStyle = g.col;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let a = 0; a <= 48; a++) {
        const ang = (a / 48) * Math.PI * 2;
        const scrollMod = scrollState.y * 0.003;
        let x = 0, y = 0, z = 0;
        if (g.axis === 'X') {
          x = g.r * Math.cos(ang + frameCount * g.speed + scrollMod);
          y = g.r * Math.sin(ang + frameCount * g.speed + scrollMod);
        } else if (g.axis === 'Y') {
          x = g.r * Math.cos(ang + frameCount * g.speed - scrollMod);
          z = g.r * Math.sin(ang + frameCount * g.speed - scrollMod);
        } else {
          y = g.r * Math.cos(ang + frameCount * g.speed + scrollMod);
          z = g.r * Math.sin(ang + frameCount * g.speed + scrollMod);
        }
        const p = project3D(x, y, z, cx, cy);
        if (a === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
      }
      ctx.stroke();
    });

    // Precision Compass Degree Ticks (360 degrees)
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = 1;
    for (let deg = 0; deg < 360; deg += 15) {
      const rad = (deg * Math.PI) / 180;
      const isMajor = deg % 45 === 0;
      const r1 = R * 1.15;
      const r2 = R * (isMajor ? 1.25 : 1.2);
      const p1 = project3D(r1 * Math.cos(rad), 0, r1 * Math.sin(rad), cx, cy);
      const p2 = project3D(r2 * Math.cos(rad), 0, r2 * Math.sin(rad), cx, cy);
      if (p1.visible && p2.visible) {
        ctx.beginPath();
        ctx.moveTo(p1.px, p1.py);
        ctx.lineTo(p2.px, p2.py);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  /* =====================================================
     HUD CORNER BADGE & SHOCKWAVES
     ===================================================== */
  /* =====================================================
     3D WARP STREAKS (ACTIVE ON SCROLL VELOCITY)
     ===================================================== */
  function drawWarpStreaks() {
    if (scrollState.warpIntensity <= 0.03) return;
    ctx.save();
    ctx.globalAlpha = Math.min(0.75, scrollState.warpIntensity * 0.7);
    ctx.strokeStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 8;
    ctx.lineWidth = 1.4;

    const cx = W * 0.5, cy = H * 0.5;
    warpStreaks.forEach(s => {
      s.z -= s.speed * (1 + scrollState.warpIntensity * 2);
      if (s.z <= 40) {
        s.z = 1200;
        s.x = (Math.random() - 0.5) * 1600;
        s.y = (Math.random() - 0.5) * 1100;
      }
      const p1 = project3D(s.x, s.y, s.z, cx, cy);
      const p2 = project3D(s.x, s.y, s.z + s.len * (1 + scrollState.warpIntensity), cx, cy);
      if (p1.visible && p2.visible) {
        ctx.beginPath();
        ctx.moveTo(p1.px, p1.py);
        ctx.lineTo(p2.px, p2.py);
        ctx.stroke();
      }
    });
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  /* =====================================================
     HUD CORNER BADGE & SHOCKWAVES
     ===================================================== */
  function drawHUDOverlay() {
    // Shockwave ripples
    shockwaves.forEach((sw, idx) => {
      sw.r += sw.speed;
      sw.alpha *= 0.94;
      if (sw.alpha <= 0.02 || sw.r >= sw.maxR) {
        shockwaves.splice(idx, 1);
        return;
      }
      ctx.save();
      ctx.globalAlpha = sw.alpha;
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });

    // Sleek Corner Holographic Scene Indicator
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    if (!isDark) return;

    ctx.save();
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillStyle = 'rgba(0, 240, 255, 0.5)';
    ctx.textAlign = 'right';
    const tag = SCENE_NAMES[activeSceneKey] || 'GLOBAL CYBER GRID';
    ctx.fillText(`[ 3D VOLUMETRIC SCENE // ${tag} ]`, W - 28, H - 50);
    ctx.fillStyle = 'rgba(0, 255, 156, 0.45)';
    ctx.fillText(`[ ELEVATION: ${Math.floor(scrollState.y)}m // WARP SPEED: ${(Math.min(1, scrollState.warpIntensity) * 100).toFixed(0)}% ]`, W - 28, H - 36);
    ctx.fillStyle = 'rgba(0, 240, 255, 0.35)';
    ctx.fillText(`[ CAM TILT: ${(camera.rotX + camera.scrollPitch).toFixed(2)}, ${(camera.rotY).toFixed(2)} // 60 FPS ]`, W - 28, H - 22);
    ctx.restore();
  }

  /* =====================================================
     MAIN ANIMATION & MORPH LOOP
     ===================================================== */
  function loop() {
    if (!enabled) {
      requestAnimationFrame(loop);
      return;
    }

    // 1. Mouse physics & spring inertia
    mouse.vx = (mouse.targetX - mouse.x) * 0.08;
    mouse.vy = (mouse.targetY - mouse.y) * 0.08;
    mouse.x += mouse.vx;
    mouse.y += mouse.vy;

    mouse.normX = (mouse.x / W) - 0.5; // -0.5 to 0.5
    mouse.normY = (mouse.y / H) - 0.5;

    // 2. Scroll physics & 3D Flight updates
    scrollState.velocity += (scrollState.targetVelocity - scrollState.velocity) * 0.22;
    scrollState.targetVelocity *= 0.86;
    scrollState.y += (scrollState.targetY - scrollState.y) * 0.14;
    scrollState.warpIntensity *= 0.94;

    // Continuous smooth camera Z-flight depth travel
    camera.targetScrollZ = scrollState.y * 0.45;
    camera.scrollZ += (camera.targetScrollZ - camera.scrollZ) * 0.1;

    // Dynamic scroll pitch tilt
    const targetPitch = Math.max(-0.25, Math.min(0.25, -scrollState.velocity * 0.0035));
    camera.scrollPitch += (targetPitch - camera.scrollPitch) * 0.16;

    // Camera parallax tilt
    camera.targetRotY = mouse.normX * 0.55;
    camera.targetRotX = -mouse.normY * 0.45;
    camera.rotY += (camera.targetRotY - camera.rotY) * 0.06;
    camera.rotX += (camera.targetRotX - camera.rotX) * 0.06;

    // 3. Clear canvas & render base cyber backdrop
    ctx.clearRect(0, 0, W, H);
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

    const bgGrad = ctx.createRadialGradient(
      W * 0.5 + mouse.normX * 120,
      H * 0.5 + mouse.normY * 120,
      0,
      W * 0.5,
      H * 0.5,
      Math.max(W, H) * 0.95
    );

    if (isDark) {
      bgGrad.addColorStop(0, '#06101f');
      bgGrad.addColorStop(0.5, '#030812');
      bgGrad.addColorStop(1, '#010409');
    } else {
      bgGrad.addColorStop(0, '#eaf4ff');
      bgGrad.addColorStop(0.5, '#dbeafe');
      bgGrad.addColorStop(1, '#eff6ff');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // 4. Update scene transition
    if (transitionProgress < 1.0) {
      transitionProgress += TRANSITION_SPEED;
      if (transitionProgress > 1.0) transitionProgress = 1.0;
    }

    // 5. Render Scene(s) with smooth cross-fade
    const renderScene = (key, alpha) => {
      switch (key) {
        case 'dashboard': drawDashboardScene(alpha); break;
        case 'scan': drawScanScene(alpha); break;
        case 'email': drawEmailScene(alpha); break;
        case 'whatsapp': drawWhatsAppScene(alpha); break;
        case 'trustnetwork': drawTrustNetworkScene(alpha); break;
        case 'browser': drawBrowserGuardScene(alpha); break;
        case 'threats': drawThreatScene(alpha); break;
        case 'defenselab': drawDefenseLabScene(alpha); break;
        case 'history': drawHistoryScene(alpha); break;
        case 'settings': drawSettingsScene(alpha); break;
        default: drawDashboardScene(alpha); break;
      }
    };

    if (prevSceneKey && transitionProgress < 1.0) {
      renderScene(prevSceneKey, (1 - transitionProgress));
    }
    renderScene(activeSceneKey, transitionProgress);

    // 6. Draw 3D Warp Streaks & HUD Shockwaves
    drawWarpStreaks();
    drawHUDOverlay();

    frameCount++;
    requestAnimationFrame(loop);
  }

  /* =====================================================
     PUBLIC API & AUTOMATIC PAGE SWITCHING HOOKS
     ===================================================== */
  window.set3DScene = function (sceneKey) {
    if (!SCENE_NAMES[sceneKey] && sceneKey !== 'dashboard') {
      // Map aliases
      if (sceneKey.includes('scan')) sceneKey = 'scan';
      else if (sceneKey.includes('email')) sceneKey = 'email';
      else if (sceneKey.includes('whatsapp') || sceneKey.includes('sms')) sceneKey = 'whatsapp';
      else if (sceneKey.includes('trust')) sceneKey = 'trustnetwork';
      else if (sceneKey.includes('browser')) sceneKey = 'browser';
      else if (sceneKey.includes('threat')) sceneKey = 'threats';
      else if (sceneKey.includes('defense') || sceneKey.includes('lab')) sceneKey = 'defenselab';
      else if (sceneKey.includes('history')) sceneKey = 'history';
      else if (sceneKey.includes('setting')) sceneKey = 'settings';
      else sceneKey = 'dashboard';
    }

    if (sceneKey === activeSceneKey) return;

    prevSceneKey = activeSceneKey;
    activeSceneKey = sceneKey;
    transitionProgress = 0.0;

    // Update cursor orb aura color to match scene
    if (cursorOrb && SCENE_THEMES[sceneKey]) {
      cursorOrb.style.background = `radial-gradient(circle, ${SCENE_THEMES[sceneKey].orb} 0%, transparent 70%)`;
    }
  };

  window.toggle3DBgEnabled = function (val) {
    enabled = val;
    if (!enabled) ctx.clearRect(0, 0, W, H);
  };

  // Auto-detect page switch from DOM click events or active page mutation
  document.addEventListener('click', (e) => {
    const navItem = e.target.closest && e.target.closest('.nav-item');
    if (navItem && navItem.id) {
      const pageKey = navItem.id.replace('nav-', '');
      window.set3DScene(pageKey);
    }
  });

  // MutationObserver on #app to watch active page class changes
  const observer = new MutationObserver(() => {
    const activePage = document.querySelector('.page.active');
    if (activePage && activePage.id) {
      const pageKey = activePage.id.replace('page-', '');
      if (pageKey !== activeSceneKey) {
        window.set3DScene(pageKey);
      }
    }
  });

  const appEl = document.getElementById('app');
  if (appEl) {
    observer.observe(appEl, { attributes: true, subtree: true, attributeFilter: ['class'] });
  }

  // Detect initial active page
  const initialPage = document.querySelector('.page.active');
  if (initialPage && initialPage.id) {
    activeSceneKey = initialPage.id.replace('page-', '');
  }

  loop();
})();

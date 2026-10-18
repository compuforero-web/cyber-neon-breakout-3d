// Standalone Self-Contained Single-File HTML5 Generator for "Cyber-Neon Breakout 3D"
// Generates a 100% complete, single-file .html containing HTML, CSS, Three.js 3D Engine,
// 10 Levels, Boss Fights (Levels 5 & 10), Particle Physics, Web Audio API Synthesizer,
// 2 Tactical Assists (-15% score penalty), Star Rating, and Top 10 localStorage Leaderboard.

export function buildStandaloneHtmlCode(): string {
  return `<!DOCTYPE html>
<html lang="es" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Cyber-Neon Breakout 3D — Edición Arcade Autocontenida</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&family=Orbitron:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    :root {
      --bg: #070913;
      --surface: rgba(15, 23, 42, 0.92);
      --border: rgba(148, 163, 184, 0.2);
      --cyan: #06b6d4;
      --magenta: #ec4899;
      --amber: #f59e0b;
      --emerald: #10b981;
      --text: #f8fafc;
      --muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; -webkit-user-select: none; }
    body, html {
      width: 100%; height: 100%; overflow: hidden;
      background: var(--bg); color: var(--text);
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      touch-action: none;
    }
    #canvas-container { position: fixed; inset: 0; width: 100%; height: 100%; z-index: 1; cursor: ew-resize; }
    .font-display { font-family: 'Orbitron', sans-serif; }
    .font-mono { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; }

    /* Top Bar HUD */
    .top-hud {
      position: fixed; top: 0; left: 0; right: 0; z-index: 10;
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 24px; background: rgba(7, 9, 19, 0.88);
      border-bottom: 1px solid var(--border); gap: 16px;
    }
    .brand { font-family: 'Orbitron', sans-serif; font-weight: 800; font-size: 16px; color: var(--text); letter-spacing: 0.04em; white-space: nowrap; }
    .hud-stats { display: flex; align-items: center; gap: 20px; font-size: 13px; color: var(--muted); white-space: nowrap; }
    .hud-stats strong { color: var(--text); font-family: 'JetBrains Mono', monospace; font-size: 15px; margin-left: 6px; }
    .boss-bar-wrap {
      position: fixed; top: 60px; left: 50%; transform: translateX(-50%);
      z-index: 10; width: min(520px, 90vw); background: var(--surface);
      border: 1px solid rgba(245, 158, 11, 0.45); border-radius: 8px; padding: 8px 14px;
      display: none;
    }
    .boss-bar-header { display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; color: var(--amber); margin-bottom: 6px; font-family: 'Orbitron', sans-serif; }
    .boss-bar-track { width: 100%; height: 8px; background: #1e293b; border-radius: 4px; overflow: hidden; }
    .boss-bar-fill { height: 100%; background: linear-gradient(90deg, #f59e0b, #ef4444); width: 100%; transition: width 0.15s ease; }

    /* Collapsible Bottom Dock */
    .bottom-dock-wrapper {
      position: fixed; bottom: 18px; left: 50%; transform: translateX(-50%);
      z-index: 10; display: flex; flex-direction: column; align-items: center;
      max-width: min(920px, 95vw); width: 100%; pointer-events: none;
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .bottom-dock-wrapper.collapsed { transform: translate(-50%, calc(100% - 28px)); }
    .dock-toggle {
      pointer-events: auto; background: var(--surface); color: var(--muted);
      border: 1px solid var(--border); border-bottom: none;
      padding: 4px 14px; border-radius: 8px 8px 0 0; font-size: 11px; font-weight: 600;
      cursor: pointer;
    }
    .dock-panel {
      pointer-events: auto; background: var(--surface); border: 1px solid var(--border);
      border-radius: 12px; padding: 10px 16px; display: flex; flex-wrap: wrap;
      align-items: center; justify-content: space-between; gap: 12px; width: 100%;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.65);
    }
    .btn {
      background: #1e293b; color: var(--text); border: 1px solid var(--border);
      padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 600;
      cursor: pointer; white-space: nowrap; transition: background 0.15s, transform 0.1s;
      font-family: inherit;
    }
    .btn:hover:not(:disabled) { background: #334155; }
    .btn:active:not(:disabled) { transform: scale(0.98); }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-cyan { background: #0891b2; border-color: #06b6d4; color: #fff; }
    .btn-cyan:hover:not(:disabled) { background: #06b6d4; }
    .btn-amber { background: rgba(245, 158, 11, 0.16); border-color: rgba(245, 158, 11, 0.5); color: #fcd34d; }
    .btn-amber:hover:not(:disabled) { background: rgba(245, 158, 11, 0.28); }

    /* Modal Overlays */
    .modal-backdrop {
      position: fixed; inset: 0; z-index: 30; background: rgba(7, 9, 19, 0.84);
      display: flex; align-items: center; justify-content: center; padding: 20px;
    }
    .modal-card {
      background: #0f172a; border: 1px solid var(--border); border-radius: 16px;
      padding: 28px; width: 100%; max-width: 540px; box-shadow: 0 24px 60px rgba(0,0,0,0.8);
    }
    .modal-title { font-family: 'Orbitron', sans-serif; font-size: 24px; font-weight: 800; margin-bottom: 8px; color: var(--text); }
    .modal-sub { font-size: 14px; color: var(--muted); line-height: 1.5; margin-bottom: 20px; }
    .input-field {
      width: 100%; padding: 12px 14px; background: #070913; border: 1px solid rgba(6, 182, 212, 0.5);
      border-radius: 8px; color: var(--text); font-size: 15px; font-weight: 600; margin-bottom: 16px;
      outline: none;
    }
    .table-top10 { width: 100%; border-collapse: collapse; margin: 14px 0 20px; font-size: 13px; }
    .table-top10 th { text-align: left; padding: 8px; color: var(--muted); border-bottom: 1px solid var(--border); font-weight: 600; }
    .table-top10 td { padding: 8px; border-bottom: 1px solid rgba(148,163,184,0.08); }
  </style>
  <script type="importmap">
    {
      "imports": {
        "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js",
        "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"
      }
    }
  </script>
</head>
<body>
  <div id="canvas-container"></div>

  <!-- Top Bar HUD -->
  <header class="top-hud">
    <div class="brand">CYBER-NEON BREAKOUT</div>
    <div class="hud-stats">
      <span>Piloto <strong id="hud-pilot">---</strong></span>
      <span>·</span>
      <span>Sector <strong id="hud-level">1 / 10</strong></span>
      <span>·</span>
      <span>Estrellas <strong id="hud-stars">0</strong></span>
      <span>·</span>
      <span>Vidas <strong id="hud-lives">3</strong></span>
      <span>·</span>
      <span>Puntos <strong id="hud-score">0</strong></span>
    </div>
    <div>
      <button id="btn-open-top10" class="btn">Top 10 Récords</button>
    </div>
  </header>

  <!-- Boss Health Bar -->
  <div id="boss-bar" class="boss-bar-wrap">
    <div class="boss-bar-header">
      <span id="boss-name">CRUCERO GUARDIÁN</span>
      <span id="boss-hp-text" class="font-mono">22 / 22</span>
    </div>
    <div class="boss-bar-track"><div id="boss-bar-fill" class="boss-bar-fill"></div></div>
  </div>

  <!-- Collapsible Bottom Tactical Dock -->
  <div id="bottom-dock" class="bottom-dock-wrapper">
    <button id="btn-toggle-dock" class="dock-toggle">▾ Ocultar Controles (H)</button>
    <div class="dock-panel">
      <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
        <button id="btn-assist-row" class="btn btn-amber">Ayuda 1: Pulso Destructor (-15% pts)</button>
        <button id="btn-assist-shield" class="btn btn-amber">Ayuda 2: Escudo Emergencia (-15% pts)</button>
        <span id="hud-assists-left" style="font-size:12px; color:var(--muted);">Ayudas: 2 / 2</span>
      </div>
      <div style="display:flex; gap:8px; align-items:center;">
        <button id="btn-camera" class="btn">Cámara: Perspectiva</button>
        <button id="btn-mute" class="btn">Audio: Activo</button>
        <button id="btn-pause" class="btn">Pausar</button>
      </div>
    </div>
  </div>

  <!-- Start / End / Leaderboard Modal -->
  <div id="modal-overlay" class="modal-backdrop">
    <div id="modal-content" class="modal-card"></div>
  </div>

  <script type="module">
    import * as THREE from 'three';
    import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

    const STORAGE_KEY = 'cyber_neon_breakout_top10_v1';
    const DEFAULT_TOP10 = [
      { playerName: 'VALKYRIE_X', score: 48200, maxLevel: 10, totalStars: 29 },
      { playerName: 'KAITO_99', score: 41500, maxLevel: 10, totalStars: 26 },
      { playerName: 'NOVA_CORE', score: 36800, maxLevel: 9, totalStars: 23 },
      { playerName: 'ZERO_PULSE', score: 31400, maxLevel: 8, totalStars: 20 },
      { playerName: 'AETHER_7', score: 27900, maxLevel: 7, totalStars: 18 },
      { playerName: 'CYBER_LYNX', score: 23100, maxLevel: 6, totalStars: 15 },
      { playerName: 'ORION_DRIFT', score: 19400, maxLevel: 5, totalStars: 13 },
      { playerName: 'VORTEX_MK2', score: 15200, maxLevel: 5, totalStars: 11 },
      { playerName: 'SOLARIS_UI', score: 11800, maxLevel: 4, totalStars: 9 },
      { playerName: 'ECHO_PILOT', score: 8400, maxLevel: 3, totalStars: 6 }
    ];

    function loadTop10() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [...DEFAULT_TOP10];
        return JSON.parse(raw).sort((a,b) => b.score - a.score).slice(0, 10);
      } catch { return [...DEFAULT_TOP10]; }
    }

    function saveScoreTop10(playerName, score, maxLevel, totalStars) {
      const list = loadTop10();
      list.push({ playerName, score, maxLevel, totalStars });
      list.sort((a,b) => b.score - a.score);
      const top10 = list.slice(0, 10);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(top10)); } catch {}
      return top10;
    }

    // Procedural Web Audio API Engine
    let audioCtx = null;
    let isMuted = false;
    function playTone(freq, endFreq, dur, type = 'triangle', vol = 0.25) {
      if (isMuted) return;
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), now + dur);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + dur);
    }

    // Scene Setup
    const container = document.getElementById('canvas-container');
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070913);
    scene.fog = new THREE.FogExp2(0x070913, 0.018);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const perspCam = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.5, 120);
    perspCam.position.set(0, 23.5, 22.5);
    perspCam.lookAt(0, 0, 0.5);

    const frustum = 29;
    const orthoCam = new THREE.OrthographicCamera(-frustum, frustum, frustum/2, -frustum/2, 0.1, 120);
    orthoCam.position.set(0, 26, 18);
    orthoCam.lookAt(0, 0, 0);
    let useOrtho = false;

    scene.add(new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.7));
    const dirLight = new THREE.DirectionalLight(0xfffbeb, 1.8);
    dirLight.position.set(12, 26, 14);
    scene.add(dirLight);

    // Arena Floor & Walls
    const ARENA_W = 11.2, TOP_Z = -15.5, BOT_Z = 13.5, PADDLE_Z = 11.2;
    const gridHelper = new THREE.GridHelper(30, 30, 0x06b6d4, 0x1e293b);
    gridHelper.position.y = -0.02;
    scene.add(gridHelper);

    const wallMat = new THREE.MeshPhysicalMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.2 });
    const leftW = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.1, 30), wallMat);
    leftW.position.set(-ARENA_W - 0.3, 0.55, -1);
    scene.add(leftW);
    const rightW = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.1, 30), wallMat);
    rightW.position.set(ARENA_W + 0.3, 0.55, -1);
    scene.add(rightW);
    const topW = new THREE.Mesh(new THREE.BoxGeometry(ARENA_W*2 + 1.2, 1.1, 0.6), wallMat);
    topW.position.set(0, 0.55, TOP_Z - 0.3);
    scene.add(topW);

    const shieldBar = new THREE.Mesh(
      new THREE.BoxGeometry(ARENA_W*2, 0.4, 0.35),
      new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 2 })
    );
    shieldBar.position.set(0, 0.35, PADDLE_Z + 1.3);
    shieldBar.visible = false;
    scene.add(shieldBar);

    // Player Paddle Group
    const paddleGroup = new THREE.Group();
    const pHull = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.5, 0.85),
      new THREE.MeshPhysicalMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 })
    );
    pHull.position.y = 0.25;
    paddleGroup.add(pHull);
    const pCore = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 0.26, 0.92),
      new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x06b6d4, emissiveIntensity: 1.8 })
    );
    pCore.position.y = 0.28;
    paddleGroup.add(pCore);
    paddleGroup.position.set(0, 0, PADDLE_Z);
    scene.add(paddleGroup);

    // Game State
    let playerName = '';
    let phase = 'START';
    let level = 1, score = 0, lives = 3, totalStars = 0, assistsLeft = 2;
    let paddleX = 0, targetX = 0;
    let shieldTimer = 0, laserTimer = 0, slowTimer = 0, laserShotCd = 0;
    const balls = [], blocks = [], powerUps = [], lasers = [], particles = [];
    let boss = { active: false, group: null, shields: [], hp: 0, maxHp: 1, cd: 2.5 };

    function spawnParticles(pos, colorHex, count = 16) {
      for (let i = 0; i < count; i++) {
        const m = new THREE.Mesh(
          new THREE.BoxGeometry(0.22, 0.22, 0.22),
          new THREE.MeshBasicMaterial({ color: colorHex })
        );
        m.position.copy(pos);
        const a = Math.random() * Math.PI * 2, s = 3 + Math.random() * 8;
        scene.add(m);
        particles.push({ mesh: m, vel: new THREE.Vector3(Math.cos(a)*s, 3+Math.random()*5, Math.sin(a)*s), life: 0.6 });
      }
    }

    function addBall(pos, dx, dz) {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(0.34, 20, 20),
        new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x22d3ee, emissiveIntensity: 2.2 })
      );
      m.position.copy(pos);
      scene.add(m);
      const speed = 15 + level * 1.1;
      const v = new THREE.Vector3(dx, 0, dz).normalize().multiplyScalar(speed);
      balls.push({ mesh: m, pos: pos.clone(), vel: v, active: true });
    }

    function setupLevel(lvl) {
      balls.forEach(b => scene.remove(b.mesh)); balls.length = 0;
      blocks.forEach(b => scene.remove(b.mesh)); blocks.length = 0;
      powerUps.forEach(p => scene.remove(p.mesh)); powerUps.length = 0;
      lasers.forEach(l => scene.remove(l.mesh)); lasers.length = 0;
      if (boss.group) { scene.remove(boss.group); boss.group = null; }
      boss.active = false;

      level = lvl;
      addBall(new THREE.Vector3(paddleX, 0.35, PADDLE_Z - 1.1), (Math.random()-0.5)*0.5, -1);

      const isBoss = (level === 5 || level === 10);
      const rows = isBoss ? 3 : Math.min(7, 3 + Math.floor(level / 2));
      const cols = 7;
      const colors = [0x06b6d4, 0x3b82f6, 0xec4899, 0xa855f7, 0x10b981, 0xf59e0b];
      const startZ = isBoss ? -5.5 : -12.5;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const bx = (c - (cols - 1)/2) * 2.5;
          const bz = startZ + r * 1.35;
          const col = colors[(r + level) % colors.length];
          const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(2.15, 0.75, 1.0),
            new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.75, metalness: 0.6, roughness: 0.25 })
          );
          mesh.position.set(bx, 0.38, bz);
          scene.add(mesh);
          blocks.push({ mesh, pos: mesh.position, hp: r === 0 && level > 2 ? 2 : 1, color: col, active: true });
        }
      }

      if (isBoss) {
        const bg = new THREE.Group();
        const core = new THREE.Mesh(
          new THREE.OctahedronGeometry(level === 10 ? 1.5 : 1.2, 1),
          new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 1.8 })
        );
        core.position.y = 1.0;
        bg.add(core);
        const shCount = level === 10 ? 4 : 2;
        const shArr = [];
        for (let i = 0; i < shCount; i++) {
          const sh = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 0.8, 0.35),
            new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x06b6d4, emissiveIntensity: 1.4 })
          );
          bg.add(sh);
          shArr.push(sh);
        }
        bg.position.set(0, 0, -11.0);
        scene.add(bg);
        boss = { active: true, group: bg, shields: shArr, hp: level === 10 ? 35 : 20, maxHp: level === 10 ? 35 : 20, cd: 2.5 };
      }
      updateHud();
    }

    function updateHud() {
      document.getElementById('hud-pilot').textContent = playerName || '---';
      document.getElementById('hud-level').textContent = level + ' / 10';
      document.getElementById('hud-stars').textContent = totalStars;
      document.getElementById('hud-lives').textContent = lives;
      document.getElementById('hud-score').textContent = score.toLocaleString();
      document.getElementById('hud-assists-left').textContent = 'Ayudas: ' + assistsLeft + ' / 2';
      document.getElementById('btn-assist-row').disabled = assistsLeft <= 0 || phase !== 'PLAYING';
      document.getElementById('btn-assist-shield').disabled = assistsLeft <= 0 || phase !== 'PLAYING';

      const bossBar = document.getElementById('boss-bar');
      if (boss.active && boss.hp > 0) {
        bossBar.style.display = 'block';
        document.getElementById('boss-name').textContent = level === 10 ? 'NÚCLEO OVERLORD OMEGA' : 'CRUCERO GUARDIÁN AEGIS';
        document.getElementById('boss-hp-text').textContent = boss.hp + ' / ' + boss.maxHp;
        document.getElementById('boss-bar-fill').style.width = ((boss.hp / boss.maxHp) * 100) + '%';
      } else {
        bossBar.style.display = 'none';
      }
    }

    // Modal Renders
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');

    function showStartModal() {
      phase = 'START';
      modalOverlay.style.display = 'flex';
      modalContent.innerHTML = \`
        <h1 class="modal-title">CYBER-NEON BREAKOUT 3D</h1>
        <p class="modal-sub">Ingresa tu identificador de piloto para iniciar la secuencia de 10 sectores cuánticos.</p>
        <input id="pilot-input" class="input-field" type="text" maxlength="16" placeholder="Ej. VALKYRIE_01" value="\${playerName}" />
        <div style="display:flex; gap:10px; justify-content:flex-end;">
          <button id="modal-start-btn" class="btn btn-cyan">Iniciar Partida</button>
        </div>
      \`;
      const input = document.getElementById('pilot-input');
      input.focus();
      document.getElementById('modal-start-btn').onclick = () => {
        const val = input.value.trim();
        if (!val) { input.style.borderColor = '#ef4444'; return; }
        playerName = val.toUpperCase();
        score = 0; lives = 3; totalStars = 0; assistsLeft = 2;
        modalOverlay.style.display = 'none';
        phase = 'PLAYING';
        setupLevel(1);
      };
    }

    function showTop10Modal(endTitle = null) {
      const wasPlaying = phase === 'PLAYING';
      if (wasPlaying) phase = 'PAUSED';
      const list = loadTop10();
      modalOverlay.style.display = 'flex';
      modalContent.innerHTML = \`
        <h2 class="modal-title">\${endTitle || 'CLASIFICACIÓN TOP 10 GLOBAL'}</h2>
        <p class="modal-sub">Los 10 mejores registros históricos almacenados localmente.</p>
        <table class="table-top10 font-mono">
          <thead><tr><th>#</th><th>Piloto</th><th>Nivel</th><th>Estrellas</th><th>Puntaje</th></tr></thead>
          <tbody>
            \${list.map((e, i) => \`<tr><td>\${i+1}</td><td>\${e.playerName}</td><td>\${e.maxLevel}</td><td>\${e.totalStars} ★</td><td>\${e.score.toLocaleString()}</td></tr>\`).join('')}
          </tbody>
        </table>
        <div style="display:flex; gap:10px; justify-content:flex-end;">
          <button id="modal-close-btn" class="btn btn-cyan">\${endTitle ? 'Jugar de Nuevo' : 'Continuar'}</button>
        </div>
      \`;
      document.getElementById('modal-close-btn').onclick = () => {
        if (endTitle) {
          showStartModal();
        } else {
          modalOverlay.style.display = 'none';
          if (wasPlaying) phase = 'PLAYING';
        }
      };
    }

    // Controls & UI Events
    document.getElementById('btn-open-top10').onclick = () => showTop10Modal();
    document.getElementById('btn-toggle-dock').onclick = () => {
      document.getElementById('bottom-dock').classList.toggle('collapsed');
    };
    document.getElementById('btn-camera').onclick = (e) => {
      useOrtho = !useOrtho;
      e.target.textContent = useOrtho ? 'Cámara: Isométrica' : 'Cámara: Perspectiva';
    };
    document.getElementById('btn-mute').onclick = (e) => {
      isMuted = !isMuted;
      e.target.textContent = isMuted ? 'Audio: Silenciado' : 'Audio: Activo';
    };
    document.getElementById('btn-pause').onclick = (e) => {
      if (phase === 'PLAYING') { phase = 'PAUSED'; e.target.textContent = 'Reanudar'; }
      else if (phase === 'PAUSED') { phase = 'PLAYING'; e.target.textContent = 'Pausar'; }
    };

    document.getElementById('btn-assist-row').onclick = () => {
      if (assistsLeft <= 0 || phase !== 'PLAYING') return;
      assistsLeft--;
      score = Math.round(score * 0.85);
      playTone(180, 620, 0.3, 'sawtooth');
      const activeB = blocks.filter(b => b.active);
      if (activeB.length > 0) {
        const maxZ = Math.max(...activeB.map(b => b.pos.z));
        activeB.forEach(b => {
          if (Math.abs(b.pos.z - maxZ) < 0.9) {
            b.active = false; scene.remove(b.mesh); spawnParticles(b.pos, b.color, 15);
          }
        });
      }
      updateHud();
    };

    document.getElementById('btn-assist-shield').onclick = () => {
      if (assistsLeft <= 0 || phase !== 'PLAYING') return;
      assistsLeft--;
      score = Math.round(score * 0.85);
      shieldTimer = 15.0;
      playTone(220, 740, 0.3, 'triangle');
      updateHud();
    };

    const raycaster = new THREE.Raycaster();
    const playPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const hitVec = new THREE.Vector3();

    window.addEventListener('pointermove', (e) => {
      if (phase !== 'PLAYING') return;
      const ndc = new THREE.Vector2((e.clientX / window.innerWidth)*2 - 1, -(e.clientY / window.innerHeight)*2 + 1);
      raycaster.setFromCamera(ndc, useOrtho ? orthoCam : perspCam);
      if (raycaster.ray.intersectPlane(playPlane, hitVec)) {
        targetX = THREE.MathUtils.clamp(hitVec.x, -ARENA_W + 2.1, ARENA_W - 2.1);
      }
    });

    window.addEventListener('resize', () => {
      perspCam.aspect = window.innerWidth / window.innerHeight;
      perspCam.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    showStartModal();
    const clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.getElapsedTime();

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt;
        p.vel.y -= 14 * dt;
        p.mesh.position.addScaledVector(p.vel, dt);
        p.mesh.scale.setScalar(Math.max(0, p.life));
        if (p.life <= 0) { scene.remove(p.mesh); particles.splice(i, 1); }
      }

      if (phase === 'PLAYING') {
        paddleX = THREE.MathUtils.damp(paddleX, targetX, 18, dt);
        paddleGroup.position.x = paddleX;

        if (shieldTimer > 0) { shieldTimer -= dt; shieldBar.visible = true; }
        else { shieldBar.visible = false; }

        if (boss.active && boss.group) {
          boss.group.position.x = Math.sin(elapsed * 1.2) * 5.0;
          boss.shields.forEach((sh, idx) => {
            const ang = elapsed * 2.0 + (idx / boss.shields.length) * Math.PI * 2;
            sh.position.set(Math.cos(ang) * 2.8, 0.7, Math.sin(ang) * 2.8);
            sh.rotation.y = -ang + Math.PI / 2;
          });
        }

        balls.forEach(b => {
          if (!b.active) return;
          b.pos.addScaledVector(b.vel, dt);
          if (b.pos.x < -ARENA_W + 0.4 || b.pos.x > ARENA_W - 0.4) {
            b.vel.x *= -1; b.pos.x = THREE.MathUtils.clamp(b.pos.x, -ARENA_W+0.4, ARENA_W-0.4);
            playTone(190, 120, 0.06, 'sine');
          }
          if (b.pos.z < TOP_Z + 0.4) { b.vel.z = Math.abs(b.vel.z); playTone(190, 120, 0.06, 'sine'); }
          if (shieldTimer > 0 && b.vel.z > 0 && b.pos.z > PADDLE_Z + 1.0) {
            b.vel.z = -Math.abs(b.vel.z); playTone(320, 480, 0.09);
          }
          if (b.vel.z > 0 && Math.abs(b.pos.z - PADDLE_Z) < 0.65 && Math.abs(b.pos.x - paddleX) < 2.25) {
            const off = (b.pos.x - paddleX) / 2.2;
            const spd = b.vel.length();
            const ang = off * 1.1;
            b.vel.set(Math.sin(ang)*spd, 0, -Math.cos(ang)*spd);
            playTone(280, 440, 0.1);
          }

          blocks.forEach(blk => {
            if (!blk.active) return;
            if (Math.abs(b.pos.x - blk.pos.x) < 1.35 && Math.abs(b.pos.z - blk.pos.z) < 0.75) {
              b.vel.z *= -1;
              blk.hp--;
              if (blk.hp <= 0) {
                blk.active = false; scene.remove(blk.mesh);
                score += 150; spawnParticles(blk.pos, blk.color, 16);
                playTone(440, 660, 0.15);
              } else { playTone(520, 300, 0.08, 'square'); }
              updateHud();
            }
          });

          if (boss.active && b.pos.distanceTo(boss.group.position) < 2.1) {
            b.vel.z = Math.abs(b.vel.z);
            boss.hp--; score += 300;
            spawnParticles(boss.group.position, 0xf59e0b, 20);
            playTone(300, 580, 0.16, 'sawtooth');
            if (boss.hp <= 0) { boss.active = false; scene.remove(boss.group); score += 2500; }
            updateHud();
          }

          b.mesh.position.copy(b.pos);
          if (b.pos.z > BOT_Z) { b.active = false; scene.remove(b.mesh); }
        });

        if (balls.filter(b => b.active).length === 0) {
          lives--; updateHud();
          playTone(220, 65, 0.4, 'sawtooth');
          if (lives <= 0) {
            saveScoreTop10(playerName, score, level, totalStars);
            showTop10Modal('FIN DE PARTIDA — PUNTAJE: ' + score.toLocaleString());
          } else {
            addBall(new THREE.Vector3(paddleX, 0.35, PADDLE_Z - 1.1), 0.2, -1);
          }
        }

        if (blocks.filter(b => b.active).length === 0 && !boss.active) {
          totalStars += lives >= 2 ? 3 : 2;
          if (level >= 10) {
            saveScoreTop10(playerName, score, 10, totalStars);
            showTop10Modal('¡VICTORIA SUPREMA! 10 SECTORES SUPERADOS');
          } else {
            setupLevel(level + 1);
          }
        }
      }

      renderer.render(scene, useOrtho ? orthoCam : perspCam);
    }
    animate();
  </script>
</body>
</html>`;
}

export function downloadStandaloneHtmlFile() {
  const htmlSource = buildStandaloneHtmlCode();
  const blob = new Blob([htmlSource], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'cyber-neon-breakout-3d.html';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

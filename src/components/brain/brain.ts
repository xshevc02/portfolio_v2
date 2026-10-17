/**
 * /brain: three.js neural-network brain + overlay interaction.
 * Algorithm and interaction values are ported 1:1 from design/Brain.dc.html (init() / loop()).
 */
import {
  AdditiveBlending, BufferAttribute, BufferGeometry, CanvasTexture, Color, ColorManagement, FogExp2, Group,
  LineBasicMaterial, LineSegments, LinearSRGBColorSpace, PerspectiveCamera, Points, PointsMaterial, Raycaster,
  Scene, Sprite, SpriteMaterial, Vector2, Vector3, WebGLRenderer,
} from 'three';
import data from '../../data/brain.json';

type Vec = [number, number, number];
const REGIONS = data.regions;
const SUBS = data.workCases;
const MEM_SLOTS = data.memorySlots;

// Match the reference (three r128): no colour management, linear output.
ColorManagement.enabled = false;

const root = document.querySelector<HTMLElement>('[data-brain]');
if (root) {
  try {
    start(root);
  } catch (err) {
    // WebGL or three failed mid-setup: fall back to the static panels.
    console.error(err);
    showFallback(root);
  }
}

/** No WebGL: hide the canvas and show the four region panels as a plain list. */
function showFallback(root: HTMLElement) {
  root.classList.add('no-gl');
  root.querySelector<HTMLElement>('[data-host]')?.replaceChildren();
  const panel = root.querySelector<HTMLElement>('[data-panel]')!;
  panel.hidden = false;
  panel.querySelectorAll<HTMLElement>('[data-view]').forEach((el) => (el.hidden = !el.dataset.view!.startsWith('r')));
}

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}

function start(root: HTMLElement) {
  const host = root.querySelector<HTMLElement>('[data-host]')!;
  const panel = root.querySelector<HTMLElement>('[data-panel]')!;
  const views = new Map(Array.from(panel.querySelectorAll<HTMLElement>('[data-view]')).map((el) => [el.dataset.view!, el]));
  const labels = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-hub]'));
  const subLabels = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-sub]'));
  const bigName = root.querySelector<HTMLElement>('[data-bigname]')!;
  const intro = root.querySelector<HTMLElement>('[data-intro]')!;
  const allCards = Array.from(root.querySelectorAll<HTMLElement>('[data-mem]'));
  const allLines = Array.from(root.querySelectorAll<SVGLineElement>('[data-memline]'));

  const fallback = () => showFallback(root);
  if (!webglAvailable()) return fallback();

  // ---- state (was React state in the reference) ----
  const st = { sel: -1, sub: -1, mobile: window.innerWidth < 720 };
  let opener: HTMLElement | null = null;
  let memW = 230, memCount = 4;

  const W = () => host.clientWidth, H = () => host.clientHeight;
  const areaW = () => (st.mobile ? W() : W() - Math.min(440, W() * 0.38));

  const sizeMemories = () => {
    const vw = window.innerWidth, vh = window.innerHeight, aw = vw - Math.min(440, vw * 0.38);
    memW = Math.round(Math.max(130, Math.min(230, aw * 0.2, vh * 0.26)));
    memCount = vh < 640 || aw * vh < 420000 ? 2 : vh < 820 ? 3 : 4;
    allCards.forEach((c) => (c.style.width = memW + 'px'));
  };

  /** Reflect st.sel / st.sub in the DOM. */
  const render = (focusPanel: boolean) => {
    const { sel, sub } = st;
    const key = sel === 0 && sub >= 0 ? `c${sub}` : sel >= 0 ? `r${sel}` : '';
    panel.hidden = sel < 0;
    views.forEach((el, k) => (el.hidden = k !== key));
    if (key) panel.setAttribute('aria-labelledby', `brain-${key}`);
    intro.classList.toggle('off', sel >= 0);
    const region = sel > 0 ? REGIONS[sel] : null;
    if (region) bigName.textContent = region.name;
    bigName.classList.toggle('on', !!region);
    allCards.forEach((c) => c.classList.toggle('on', !!region && c.dataset.region === region.id && Number(c.dataset.k) < memCount));
    allLines.forEach((l) => l.setAttribute('opacity', '0'));
    subLabels.forEach((l, k) => l.classList.toggle('on', k === sub));
    subLabels.forEach((l) => (l.tabIndex = sel === 0 ? 0 : -1));
    if (focusPanel && key) views.get(key)!.querySelector<HTMLElement>('h2')!.focus({ preventScroll: true });
  };

  // ---- three.js scene (port of init()) ----
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: true });
  } catch {
    return fallback();
  }
  const mobile = W() < 720;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  renderer.outputColorSpace = LinearSRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(W(), H());
  host.appendChild(renderer.domElement);
  const scene = new Scene();
  scene.fog = new FogExp2(0x060b1f, 0.085);
  const cam = new PerspectiveCamera(38, W() / H(), 0.1, 100);
  const camZ = mobile ? 11 : 9;
  cam.position.set(0, 0, reduce ? camZ : camZ + 5);
  const g = new Group(); scene.add(g);

  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const dir = (): Vec => { let a, b, c, d; do { a = rnd() * 2 - 1; b = rnd() * 2 - 1; c = rnd() * 2 - 1; d = a * a + b * b + c * c; } while (d > 1 || d < 0.01); d = Math.sqrt(d); return [a / d, b / d, c / d]; };
  const pt = (): Vec => {
    const u = rnd();
    if (u < 0.12) { const v = dir(), s = 0.75 + rnd() * 0.25; return [v[0] * 0.95 * s, -0.75 + v[1] * 0.36 * s, -1.05 + v[2] * 0.55 * s]; }
    if (u < 0.15) { const t = rnd(); return [(rnd() - 0.5) * 0.28, -0.75 - t * 0.85, -0.5 + t * 0.12 + (rnd() - 0.5) * 0.2]; }
    const side = rnd() < 0.5 ? -1 : 1, v = dir(), s = rnd() < 0.82 ? 0.92 + rnd() * 0.08 : 0.35 + rnd() * 0.55;
    const f = 1 + 0.07 * Math.sin(v[0] * 9 + v[1] * 7) * Math.sin(v[2] * 6 + v[1] * 5);
    let x = side * 0.55 + v[0] * 0.78 * s * f, y = v[1] * 1.0 * s * f + 0.12;
    const z = v[2] * 1.6 * s * f;
    if (side * x < 0.06) x = side * (0.06 + rnd() * 0.05);
    if (y < -0.4) y = -0.4 + (y + 0.4) * 0.45;
    if (z > 0.6) y -= (z - 0.6) * 0.12;
    return [x, y, z];
  };
  const N = mobile ? 750 : 1150;
  const P: Vec[] = [], S: Vec[] = [], D: number[] = [];
  for (let i = 0; i < N; i++) { P.push(pt()); const d = dir(), r = 5 + rnd() * 7; S.push([d[0] * r, d[1] * r, d[2] * r]); D.push(rnd() * 1.1); }

  const edges: [number, number][] = [], adj: number[][] = P.map(() => []), seen = new Set<string>();
  for (let i = 0; i < N; i++) {
    const best: [number, number][] = [];
    for (let j = 0; j < N; j++) {
      if (i === j) continue;
      const dx = P[i][0] - P[j][0], dy = P[i][1] - P[j][1], dz = P[i][2] - P[j][2], d = dx * dx + dy * dy + dz * dz;
      if (d <= 0.17) best.push([d, j]);
    }
    best.sort((a, b) => a[0] - b[0]);
    for (const [, j] of best.slice(0, 3)) {
      const k = i < j ? i + '-' + j : j + '-' + i;
      if (seen.has(k)) continue; seen.add(k);
      adj[i].push(edges.length); adj[j].push(edges.length); edges.push([i, j]);
    }
  }

  const hubs = REGIONS.map((r) => new Vector3(...(r.pos as Vec)));
  const reg = new Int8Array(N), w = new Float32Array(N);
  P.forEach((p, i) => {
    let bi = -1, bd = 1e9;
    hubs.forEach((h, k) => { const d = Math.hypot(p[0] - h.x, p[1] - h.y, p[2] - h.z); if (d < bd) { bd = d; bi = k; } });
    reg[i] = bd < 1.1 ? bi : -1; w[i] = bd < 1.1 ? 1 - bd / 1.1 : 0;
  });

  const cv = document.createElement('canvas'); cv.width = cv.height = 64;
  const cx = cv.getContext('2d')!, gr = cx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  cx.fillStyle = gr; cx.fillRect(0, 0, 64, 64);
  const tex = new CanvasTexture(cv);
  const add = { transparent: true, depthWrite: false, blending: AdditiveBlending };

  const pPos = new Float32Array(N * 3), pCol = new Float32Array(N * 3);
  (reduce ? P : S).forEach((p, i) => pPos.set(p, i * 3));
  const pGeo = new BufferGeometry();
  pGeo.setAttribute('position', new BufferAttribute(pPos, 3));
  pGeo.setAttribute('color', new BufferAttribute(pCol, 3));
  const points = new Points(pGeo, new PointsMaterial({ size: 0.065, map: tex, vertexColors: true, ...add }));
  g.add(points);

  const E = edges.length, lPos = new Float32Array(E * 6), lCol = new Float32Array(E * 6);
  const fillLines = (src: Float32Array) => edges.forEach(([a, b], k) => { lPos[k * 6] = src[a * 3]; lPos[k * 6 + 1] = src[a * 3 + 1]; lPos[k * 6 + 2] = src[a * 3 + 2]; lPos[k * 6 + 3] = src[b * 3]; lPos[k * 6 + 4] = src[b * 3 + 1]; lPos[k * 6 + 5] = src[b * 3 + 2]; });
  fillLines(pPos);
  const lGeo = new BufferGeometry();
  lGeo.setAttribute('position', new BufferAttribute(lPos, 3));
  lGeo.setAttribute('color', new BufferAttribute(lCol, 3));
  const lineMat = new LineBasicMaterial({ vertexColors: true, opacity: reduce ? 0.55 : 0, ...add });
  g.add(new LineSegments(lGeo, lineMat));

  const hubSprites = hubs.map((h, k) => {
    const s = new Sprite(new SpriteMaterial({ map: tex, color: new Color(...(REGIONS[k].col as Vec)), ...add }));
    s.position.copy(h); s.scale.set(0.001, 0.001, 1); g.add(s); return s;
  });

  // Sub-nodes: ring of case studies around the Work hub
  const wh = hubs[0], n0 = wh.clone().normalize();
  const u0 = new Vector3().crossVectors(n0, new Vector3(0, 1, 0)).normalize();
  const w0 = new Vector3().crossVectors(u0, n0).normalize();
  const subPos = SUBS.map((_, k) => {
    const a = Math.PI / 2 + (k / SUBS.length) * Math.PI * 2;
    return wh.clone().addScaledVector(n0, 0.35).addScaledVector(u0, Math.cos(a) * 0.5).addScaledVector(w0, Math.sin(a) * 0.5);
  });
  const subSprites = subPos.map((p) => { const s = new Sprite(new SpriteMaterial({ map: tex, color: 0xdfe7ff, opacity: 0, ...add })); s.position.copy(p); s.scale.set(0.2, 0.2, 1); g.add(s); return s; });
  const sPos = new Float32Array(SUBS.length * 6);
  subPos.forEach((p, k) => { sPos.set([wh.x, wh.y, wh.z], k * 6); sPos.set([p.x, p.y, p.z], k * 6 + 3); });
  const sGeo = new BufferGeometry(); sGeo.setAttribute('position', new BufferAttribute(sPos, 3));
  const subLineMat = new LineBasicMaterial({ color: 0x8ea4ff, opacity: 0, ...add });
  g.add(new LineSegments(sGeo, subLineMat));

  const M = mobile ? 140 : 260;
  type Pulse = { e: number; from: number; t: number; sp: number; hops: number };
  const pulses: Pulse[] = [], uPos = new Float32Array(M * 3);
  const uGeo = new BufferGeometry(); uGeo.setAttribute('position', new BufferAttribute(uPos, 3));
  const pulseMat = new PointsMaterial({ size: 0.09, map: tex, color: 0xdfe7ff, opacity: reduce ? 1 : 0, ...add });
  g.add(new Points(uGeo, pulseMat));
  const regEdges = REGIONS.map((_, k) => edges.map((e, i) => (reg[e[0]] === k ? i : -1)).filter((i) => i >= 0));
  const v = { tRotY: 0.6, tRotX: 0.12, rotY: reduce ? 0.6 : -0.9, rotX: 0.12, camZ, camT: [0, 0, camZ] as Vec, hover: -1, sel: -1, glow: [0, 0, 0, 0], subVis: 0, lastSel: -1, memT: 0 };
  const spawn = (p: Pulse) => {
    const a = v.hover >= 0 ? v.hover : v.sel;
    const pool = a >= 0 && rnd() < 0.6 ? regEdges[a] : null;
    p.e = pool && pool.length ? pool[(rnd() * pool.length) | 0] : (rnd() * E) | 0;
    p.from = rnd() < 0.5 ? 0 : 1; p.t = 0; p.sp = 0.012 + rnd() * 0.02; p.hops = 2 + ((rnd() * 6) | 0);
  };
  for (let i = 0; i < M; i++) { const p = {} as Pulse; spawn(p); p.t = rnd(); pulses.push(p); }

  // ---- selection (was select() / selectSub() / setHover()) ----
  const select = (i: number, focusPanel = true) => {
    const wasOpen = st.sel >= 0, prev = st.sel;
    if (i >= 0 && !wasOpen && !opener) opener = labels[i];
    st.sel = i; st.sub = -1;
    if (i < 0) v.camT = [0, 0, v.camZ];
    else {
      const [x, y, z] = REGIONS[i].pos;
      let th = Math.atan2(-x, z);
      th += Math.PI * 2 * Math.round((v.tRotY - th) / (Math.PI * 2));
      const zp = -x * Math.sin(th) + z * Math.cos(th);
      v.tRotY = th; v.tRotX = Math.atan2(y, zp);
      v.camT = st.mobile ? [0, -0.95, i === 0 ? 6.2 : 5.4] : [1.05, 0, i === 0 ? 5.4 : 4.5];
    }
    render(i >= 0 && focusPanel);
    if (i < 0 && wasOpen) { (opener ?? labels[prev])?.focus({ preventScroll: true }); opener = null; }
  };
  const selectSub = (k: number) => {
    if (st.sel !== 0) select(0, false);
    st.sub = k;
    render(true);
  };
  const setHover = (i: number) => { v.hover = i; };

  labels.forEach((l, i) => {
    l.addEventListener('click', () => { opener = l; select(i); });
    l.addEventListener('mouseenter', () => setHover(i));
    l.addEventListener('mouseleave', () => setHover(-1));
  });
  subLabels.forEach((l, k) => l.addEventListener('click', () => selectSub(k)));
  panel.addEventListener('click', (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>('[data-close],[data-go]');
    if (!t) return;
    if (t.hasAttribute('data-close')) return select(-1);
    const go = t.dataset.go!, n = Number(go.slice(1));
    if (go[0] === 'c') selectSub(n);
    else if (st.sel === 0 && st.sub >= 0 && n === 0) { st.sub = -1; render(true); }
    else select(n);
  });
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (st.sub >= 0) { st.sub = -1; render(true); } else select(-1);
  });

  // ---- pointer ----
  const ray = new Raycaster(); ray.params.Points!.threshold = 0.07;
  const mouse = new Vector2(), tmp = new Vector3();
  let drag = false, lx = 0, ly = 0, moved = 0, mx = -1, my = -1, introDone = reduce;
  const proj = (p: Vector3): Vec => { tmp.copy(p).applyMatrix4(g.matrixWorld); const z = tmp.z; tmp.project(cam); return [(tmp.x + 1) / 2 * W(), (1 - tmp.y) / 2 * H(), z]; };
  const pick = () => {
    if (mx < 0 || !introDone) return { h: -1, s: -1 };
    const r = host.getBoundingClientRect(), px = mx - r.left, py = my - r.top;
    if (v.sel === 0) for (let k = 0; k < subPos.length; k++) { const [sx, sy] = proj(subPos[k]); if (Math.hypot(sx - px, sy - py) < 22) return { h: -1, s: k }; }
    for (let k = 0; k < hubs.length; k++) { const [sx, sy] = proj(hubs[k]); if (Math.hypot(sx - px, sy - py) < 26) return { h: k, s: -1 }; }
    mouse.set(px / W() * 2 - 1, -(py / H()) * 2 + 1);
    ray.setFromCamera(mouse, cam);
    const hit = ray.intersectObject(points)[0];
    return { h: hit && hit.index !== undefined && reg[hit.index] >= 0 && w[hit.index] > 0.25 ? reg[hit.index] : -1, s: -1 };
  };

  host.addEventListener('pointerdown', (e) => { drag = true; lx = e.clientX; ly = e.clientY; moved = 0; host.setPointerCapture(e.pointerId); });
  host.addEventListener('pointermove', (e) => {
    mx = e.clientX; my = e.clientY;
    if (!drag) return;
    const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
    v.tRotY += dx * 0.006; v.tRotX = Math.max(-0.9, Math.min(0.9, v.tRotX + dy * 0.004));
  });
  host.addEventListener('pointerup', (e) => {
    drag = false;
    if (moved >= 6) return;
    mx = e.clientX; my = e.clientY;
    const { h, s } = pick();
    if (s >= 0) selectSub(s);
    else if (h >= 0) { opener = labels[h]; select(h); }
    else if (v.sel >= 0) select(-1);
  });
  host.addEventListener('pointerleave', () => { mx = -1; if (!drag) setHover(-1); });

  const onResize = () => {
    renderer.setSize(W(), H()); cam.aspect = W() / H(); cam.updateProjectionMatrix();
    st.mobile = W() < 720;
    sizeMemories();
    render(false);
  };
  window.addEventListener('resize', onResize);
  sizeMemories();

  // ---- loop (port of loop()) ----
  let frame = 0, raf = 0;
  const t0 = performance.now(), base = [0.16, 0.24, 0.62];
  const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
  const cardsFor = () => {
    const region = REGIONS[v.sel];
    return region.memories.slice(0, memCount).map((_, k) => ({
      card: allCards.find((c) => c.dataset.region === region.id && Number(c.dataset.k) === k) ?? null,
      line: allLines.find((l) => l.dataset.region === region.id && Number(l.dataset.k) === k) ?? null,
    }));
  };

  const loop = () => {
    raf = requestAnimationFrame(loop);
    frame++;
    const time = (performance.now() - t0) / 1000;
    const it = reduce ? 10 : time;
    v.sel = st.sel;

    if (!introDone) {
      for (let i = 0; i < N; i++) {
        const k = ease((it - 0.2 - D[i]) / 1.7), a = S[i], b = P[i];
        pPos[i * 3] = a[0] + (b[0] - a[0]) * k; pPos[i * 3 + 1] = a[1] + (b[1] - a[1]) * k; pPos[i * 3 + 2] = a[2] + (b[2] - a[2]) * k;
      }
      fillLines(pPos);
      pGeo.attributes.position.needsUpdate = true; lGeo.attributes.position.needsUpdate = true;
      if (it > 3.1) introDone = true;
    }
    lineMat.opacity = 0.55 * ease((it - 1.6) / 1.2);
    pulseMat.opacity = ease((it - 2.4) / 0.8);
    const hubIn = ease((it - 2.2) / 0.8), labelIn = ease((it - 2.7) / 0.7);

    if (!drag && frame % 3 === 0) {
      const overLabel = mx >= 0 && (() => { const el = document.elementFromPoint(mx, my); return el && el.closest('[data-hub],[data-sub]'); })();
      if (!overLabel) { const { h } = pick(); if (h !== v.hover) setHover(h); }
    }
    host.style.cursor = drag ? 'grabbing' : v.hover >= 0 ? 'pointer' : 'grab';
    if (!drag && !reduce && v.sel < 0 && v.hover < 0) v.tRotY += 0.0012;
    v.rotY += (v.tRotY - v.rotY) * (introDone ? 0.07 : 0.025); v.rotX += (v.tRotX - v.rotX) * 0.07;
    g.rotation.set(v.rotX, v.rotY, 0);
    g.position.y = reduce ? 0 : Math.sin(time * 0.6) * 0.04;
    const ck = introDone ? 0.045 : 0.02;
    for (let i = 0; i < 3; i++) cam.position.setComponent(i, cam.position.getComponent(i) + (v.camT[i] - cam.position.getComponent(i)) * ck);
    for (let k = 0; k < 4; k++) { const on = k === v.sel ? 1 : k === v.hover ? 0.75 : 0; v.glow[k] += (on - v.glow[k]) * 0.08; }
    v.subVis += ((v.sel === 0 ? 1 : 0) - v.subVis) * 0.06;

    for (let i = 0; i < N; i++) {
      const b = 0.55 + 0.12 * Math.sin(time * 1.3 + i);
      let r = base[0] * b, gg = base[1] * b, bb = base[2] * b;
      if (reg[i] >= 0) { const gl = v.glow[reg[i]] * w[i] * 1.1, c = REGIONS[reg[i]].col; r += c[0] * gl; gg += c[1] * gl; bb += c[2] * gl; }
      if (v.sel >= 0 && reg[i] !== v.sel) { r *= 0.6; gg *= 0.6; bb *= 0.6; }
      pCol[i * 3] = r; pCol[i * 3 + 1] = gg; pCol[i * 3 + 2] = bb;
    }
    for (let k = 0; k < E; k++) { const [a, b] = edges[k]; lCol.set(pCol.subarray(a * 3, a * 3 + 3), k * 6); lCol.set(pCol.subarray(b * 3, b * 3 + 3), k * 6 + 3); }
    pGeo.attributes.color.needsUpdate = true; lGeo.attributes.color.needsUpdate = true;

    for (let i = 0; i < M; i++) {
      const p = pulses[i]; p.t += p.sp;
      if (p.t >= 1) {
        const end = edges[p.e][p.from ? 0 : 1];
        if (--p.hops > 0 && adj[end].length) { p.e = adj[end][(rnd() * adj[end].length) | 0]; p.from = edges[p.e][0] === end ? 0 : 1; p.t = 0; } else spawn(p);
      }
      const [a, b] = edges[p.e], A = P[p.from ? b : a], B = P[p.from ? a : b];
      uPos[i * 3] = A[0] + (B[0] - A[0]) * p.t; uPos[i * 3 + 1] = A[1] + (B[1] - A[1]) * p.t; uPos[i * 3 + 2] = A[2] + (B[2] - A[2]) * p.t;
    }
    uGeo.attributes.position.needsUpdate = true;
    hubSprites.forEach((s, k) => { const sc = (0.36 + 0.06 * Math.sin(time * 2 + k) + (k === v.sel ? 0 : v.glow[k] * 0.3)) * (k === v.sel ? 0.45 : v.sel >= 0 ? 0.35 : 1) * hubIn + 0.001; s.scale.set(sc, sc, 1); });
    subLineMat.opacity = v.subVis * 0.5;
    subSprites.forEach((s, k) => { s.material.opacity = v.subVis; const sc = (k === st.sub ? 0.32 : 0.2) + 0.03 * Math.sin(time * 2.4 + k); s.scale.set(sc, sc, 1); });

    renderer.render(scene, cam);

    labels.forEach((l, k) => {
      const [sx, sy, z] = proj(hubs[k]);
      l.style.transform = `translate(${Math.round(sx + 16)}px, ${Math.round(sy - 16)}px)`;
      l.style.opacity = String(labelIn * (v.sel >= 0 ? 0 : z > -0.4 ? 1 : 0.35));
      l.style.pointerEvents = labelIn > 0.5 && v.sel < 0 ? 'auto' : 'none';
    });
    if (v.lastSel !== v.sel) { v.lastSel = v.sel; v.memT = time; }
    if (v.sel > 0 && !st.mobile) {
      const aw = areaW();
      const R = Math.min(aw, H()) * 0.5;
      const [hsx, hsy] = proj(hubs[v.sel]);
      const hostTop = host.getBoundingClientRect().top;
      const floor = bigName.offsetHeight ? bigName.getBoundingClientRect().top - hostTop - 16 : H() - 56;
      cardsFor().forEach(({ card, line }, k) => {
        const sl = MEM_SLOTS[k % MEM_SLOTS.length];
        // KISK has no photos yet: no card, but the line still points at the slot
        const cw = card ? card.offsetWidth : memW, ch = card ? card.offsetHeight : memW * 0.75 + 40;
        const op = ease((time - v.memT - 0.7 - k * 0.15) / 0.7);
        let x = hsx + sl.x * R, y = hsy + sl.y * R + Math.sin(time * 0.8 + k * 1.7) * 6 + (1 - op) * 24;
        x = Math.max(12, Math.min(aw - cw - 16, x));
        y = Math.max(96, Math.min(floor - ch, y));
        if (card) {
          card.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px) rotate(${sl.rot + Math.sin(time * 0.5 + k) * 0.6}deg)`;
          card.style.opacity = String(op);
        }
        if (line) {
          line.setAttribute('x1', String(hsx)); line.setAttribute('y1', String(hsy));
          line.setAttribute('x2', String(x + cw / 2)); line.setAttribute('y2', String(y + ch / 2));
          line.setAttribute('opacity', String(op * 0.55));
        }
      });
    }
    const hx = proj(wh)[0];
    subLabels.forEach((l, k) => {
      const [sx, sy] = proj(subPos[k]);
      const lw = l.offsetWidth, lh = l.offsetHeight;
      const maxX = areaW() - lw - 12;
      const maxY = (st.mobile ? H() * 0.45 : H()) - lh - 12;
      let x = sx < hx - 4 ? sx - 12 - lw : sx + 12;
      x = Math.max(12, Math.min(maxX, x));
      const y = Math.max(12, Math.min(maxY, sy - 13));
      l.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
      l.style.opacity = String(v.subVis * (st.sub < 0 || st.sub === k ? 1 : 0.55));
      l.style.pointerEvents = v.subVis > 0.5 ? 'auto' : 'none';
    });
  };
  loop();

  // ---- lifecycle ----
  document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(raf);
    if (!document.hidden) loop();
  });
  window.addEventListener('pagehide', () => {
    cancelAnimationFrame(raf);
    scene.traverse((o) => {
      const obj = o as Partial<Points>;
      obj.geometry?.dispose();
      const mat = obj.material;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose()); else mat?.dispose();
    });
    tex.dispose();
    renderer.dispose();
  });
}

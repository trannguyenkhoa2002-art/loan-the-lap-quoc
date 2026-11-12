'use strict';
// ============================================================================
// VẼ THEO VÙNG (chunk 8×8 ô) — giai đoạn 1 tối ưu hiệu năng.
//  - Mỗi vùng có hai ảnh đệm: lớp mặt đất (ô, trang trí, đường, bóng đổ) và lớp vật thể (cây, đá, công trình tĩnh).
//  - Chỉ vẽ lại vùng nào thay đổi (đặt/phá/xong thi công/đêm-ngày/đổi chế độ), và chỉ các vùng giao khung nhìn.
//  - Lúc đang zoom: co giãn ảnh đã có; ngừng zoom một nhịp mới vẽ lại sắc nét ở tỉ lệ mới, mỗi khung có ngân sách thời gian.
//  - Người, xe, công trình đang thi công vẽ riêng mỗi khung (chỉ trong vùng nhìn thấy), xen kẽ đúng thứ tự với ảnh đệm.
//  - Tổng bộ nhớ ảnh đệm có trần; vùng lâu không thấy bị loại.
// ============================================================================
const CHK = LT.CH, CGW = LT.chunkGrid(N), NCH = CGW * CGW;
const GFX_MODES = {
  high: { n: 'Cao', pr: 2, res: 1, anim: 1, decor: 1, atmos: 1, clouds: 1, actors: 1, budget: 9, steps: 30, capMB: 220, animMs: 2600 },
  med:  { n: 'Trung bình', pr: 1.25, res: 1, anim: 0, decor: 1, atmos: 0, clouds: 1, actors: .6, budget: 7, steps: 24, capMB: 140, animMs: 0 },
  low:  { n: 'Thấp', pr: 1, res: .8, anim: 0, decor: 0, atmos: 0, clouds: 0, actors: .3, budget: 5, steps: 18, capMB: 90, animMs: 0 },
};
const GFX = { mode: 'high', auto: true };
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { } }
function autoGfxMode() {
  const cores = navigator.hardwareConcurrency || 4, mem = navigator.deviceMemory || 4, px = screen.width * screen.height * Math.pow(window.devicePixelRatio || 1, 2);
  if (cores <= 2 || mem <= 2) return 'low'; if (cores <= 4 || mem <= 4 || px > 8e6) return 'med'; return 'high';
}
// đổi chế độ đồ họa: chỉ ảnh hưởng cách vẽ, không đụng trạng thái ván; lưu vào localStorage (không nằm trong bản lưu)
function setGfxMode(m, user) {
  if (!GFX_MODES[m]) m = 'high'; GFX.mode = m; Object.assign(GFX, GFX_MODES[m], { mode: m, auto: !user && GFX.auto });
  if (user) { GFX.auto = false; lsSet('lt-gfx', m); lsSet('lt-gfx-user', '1'); }
  window.__gfx = m; if (typeof chunkReset === 'function') chunkReset();
}

// ---- kho ảnh đệm ----
const CK = { G: null, map: null, st: LT.newChunkState(N), L: new Array(NCH).fill(null), bytes: 0, vis: [], pre: [], isVis: new Uint8Array(NCH), isPre: new Uint8Array(NCH), q: [], bakeMs: 0, bakesFrame: 0, bakesTotal: 0, evicted: 0, dyn: [] };
for (let i = 0; i < NCH; i++) CK.dyn.push([]);
function freeLayer(l) { if (!l || !l.c) return; CK.bytes -= l.bytes; l.c.width = 0; l.c.height = 0; l.c = null; }
function chunkReset() { if (typeof abortJob === 'function') abortJob(); while (typeof POOL !== 'undefined' && POOL.length) { const c = POOL.pop(); CK.bytes -= c.width * c.height * 4; c.width = 0; c.height = 0; } for (let i = 0; i < NCH; i++) { const c = CK.L[i]; if (c) { freeLayer(c.g); freeLayer(c.o); } CK.L[i] = null; } CK.bytes = 0; }
const QL = [.3, .4, .5, .65, .8, 1, 1.3, 1.7, 2.2, 2.6];
const quantS = v => { let b = QL[0], bd = 1e9; for (const l of QL) { const d = Math.abs(Math.log(v / l)); if (d < bd) { bd = d; b = l; } } return b; };
const bakePr = () => Math.min(DPR, GFX.pr) * GFX.res;
function geom(kind, S) {
  const M = LT.CHK_MARGIN, half = CHK * 32 * S;
  if (kind === 'g') { const mx = 8, mt = 8 * S + 8, mb = 16 * S + 8; return { w: Math.ceil(2 * half + 2 * mx), h: Math.ceil(half + mt + mb), oX: mx + half, oY: mt }; }
  const mx = M.x * S, mt = M.top * S, mb = M.bot * S; return { w: Math.ceil(2 * half + 2 * mx), h: Math.ceil(half + mt + mb), oX: mx + half, oY: mt };
}
const ANIM_KINDS = { house: 1, forge: 1, kiln: 1, hall: 1, beacon: 1, barracks: 1, temple: 1, winery: 1, cloth: 1, silk: 1 };
const gatherNeighbors = (list, cx, cy) => { const out = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const x = cx + dx, y = cy + dy; if (x < 0 || y < 0 || x >= CGW || y >= CGW) continue; const a = list[y * CGW + x]; for (let i = 0; i < a.length; i++) out.push(a[i]); } return out; };

function drawStaticB(b) { if (s < .45) return lowBuilding(b); if (b.k === 'hall') return drawHall(); return drawB(b); }
function groundItems(cx, cy) {
  const x0 = cx * CHK, y0 = cy * CHK, x1 = Math.min(N, x0 + CHK), y1 = Math.min(N, y0 + CHK), st = CK.st, items = [];
  const ex0 = Math.max(0, x0 - 1), ey0 = Math.max(0, y0 - 1), ex1 = Math.min(N, x1 + 1), ey1 = Math.min(N, y1 + 1);
  items.push(() => { ctx.save(); const a = P(x0, y0), b = P(x1, y0), c = P(x1, y1), d = P(x0, y1); ctx.beginPath(); ctx.moveTo(a.x, a.y - 3); ctx.lineTo(b.x + 6, b.y); ctx.lineTo(c.x, c.y + 3); ctx.lineTo(d.x - 6, d.y); ctx.closePath(); ctx.clip(); });
  for (let y = ey0; y < ey1; y++) items.push(() => drawGroundTiles(ex0, y, ex1, y + 1));
  for (let y = ey0; y < ey1; y++) items.push(() => drawGroundExtras(ex0, y, ex1, y + 1));
  const roads = gatherNeighbors(st.road, cx, cy).filter(r => r.x >= ex0 && r.x < ex1 && r.y >= ey0 && r.y < ey1), casters = gatherNeighbors(st.stat, cx, cy);
  items.push(() => drawRoadList(roads)); items.push(() => drawShadowList(casters));
  items.push(() => { ctx.restore(); if (x1 >= N || y1 >= N) drawGroundEdge(); });
  return items;
}
const EXT = { default: [70, 150, 34], tall: [84, 218, 34], mid: [80, 178, 34], wall: [62, 112, 34], flat: [60, 40, 34], tree: [38, 80, 34], rock: [34, 48, 34], mound: [34, 42, 34] };
const EXTK = { tower: 'tall', temple: 'tall', gate: 'tall', beacon: 'tall', mansion: 'mid', terrace: 'mid', school: 'mid', market: 'mid', barracks: 'mid', farm: 'flat', tea: 'flat', mulberry: 'flat', salt: 'flat', canal: 'flat', wall: 'wall' };
function objectItems(cx, cy) {
  const x0 = cx * CHK, y0 = cy * CHK, x1 = Math.min(N, x0 + CHK), y1 = Math.min(N, y0 + CHK), st = CK.st, L = [];
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const q = G.map[y * N + x]; if (q.t === 'g' || q.t === 'w') continue;
    if (q.t === 'f') L.push({ x, y, e: EXT.tree, k: x + y + 1, f: () => { if (s < .5) { const p = P(x + .5, y + .5); dot({ x: p.x, y: p.y - 6 * s }, 9 * s * (.8 + q.v * .4), q.v > .5 ? '#4f8a4a' : '#3c6a45'); } else tree(x, y, q.v); } });
    else if (q.t === 'r') L.push({ x, y, e: EXT.rock, k: x + y + 1, f: () => { if (s < .5) { const p = P(x + .5, y + .5); dot({ x: p.x, y: p.y - 3 * s }, 8 * s, '#9a9d9a'); } else rock(x, y, q.v); } });
    else if (q.t === 'm') L.push({ x, y, e: EXT.rock, k: x + y + 1, f: () => ore(x, y, q.v) });
    else if (q.t === 'h' && !q.b) L.push({ x, y, e: EXT.mound, k: x + y + .6, f: () => mound(x, y, q.v) });
  }
  for (const b of st.stat[cy * CGW + cx]) if (b.k !== 'hall') L.push({ x: b.x, y: b.y, e: EXT[EXTK[b.k] || 'default'], k: b.x + b.y + 1, f: () => drawStaticB(b) });
  L.sort((p, q) => p.k - q.k); return L;
}
// ---- việc vẽ lại chia nhỏ qua nhiều khung (mỗi khung một ngân sách thời gian), ảnh cũ vẫn hiển thị tới khi xong ----
const POOL = []; let JOB = null;
function takeCanvas(pw, ph) {
  for (let i = 0; i < POOL.length; i++) { const c = POOL[i]; if (c.width >= pw && c.height >= ph && c.width <= pw * 1.8 && c.height <= ph * 1.8) { POOL.splice(i, 1); return c; } }
  const c = document.createElement('canvas'); c.width = pw; c.height = ph; CK.bytes += pw * ph * 4; return c;
}
function recycle(c) { if (!c) return; if (POOL.length < 3) POOL.push(c); else { CK.bytes -= c.width * c.height * 4; c.width = 0; c.height = 0; } }
function startJob(idx, kind, S, sig) {
  const cx = idx % CGW, cy = (idx / CGW) | 0, gm = geom(kind, S), pr = bakePr(), x0 = cx * CHK, y0 = cy * CHK;
  let items, gm2 = gm;
  if (kind === 'g') items = groundItems(cx, cy);
  else {
    const Lo = objectItems(cx, cy); items = Lo.map(o => o.f);
    if (Lo.length) {
      let mnx = 1e9, mxx = -1e9, mny = 1e9, mxy = -1e9;
      for (const o of Lo) { const ax = ((o.x - x0) - (o.y - y0)) * 32 * S, ay = ((o.x - x0) + (o.y - y0)) * 16 * S, e = o.e; mnx = Math.min(mnx, ax - e[0] * S); mxx = Math.max(mxx, ax + e[0] * S); mny = Math.min(mny, ay - e[1] * S); mxy = Math.max(mxy, ay + e[2] * S + 8 * S); }
      mnx = Math.floor(mnx - 2); mny = Math.floor(mny - 2); gm2 = { w: Math.ceil(mxx - mnx + 2), h: Math.ceil(mxy - mny + 2), oX: -mnx, oY: -mny };
    }
  }
  const j0 = gm2; const j = { idx, kind, S, sig, gm: gm2, pr, pw: 0, ph: 0, items, i: 0, gl: [], ox: gm2.oX - (x0 - y0) * 32 * S, oy: gm2.oY - (x0 + y0) * 16 * S, c: null, o: null, empty: !items.length };
  j.pw = Math.ceil(gm2.w * pr); j.ph = Math.ceil(gm2.h * pr);
  if (!j.empty) { j.c = takeCanvas(j.pw, j.ph); j.o = j.c.getContext('2d'); j.o.setTransform(1, 0, 0, 1, 0, 0); j.o.clearRect(0, 0, j.c.width, j.c.height); j.o.setTransform(pr, 0, 0, pr, 0, 0); }
  JOB = j; return j;
}
function abortJob() { if (JOB) { recycle(JOB.c); JOB = null; } }
function finishJob() {
  const j = JOB, ch = CK.L[j.idx]; JOB = null;
  if (!ch) { recycle(j.c); return; }
  const old = ch[j.kind]; if (old && old.c) { CK.bytes -= 0; recycle(old.c); }
  ch[j.kind] = { c: j.c, bytes: j.c ? j.c.width * j.c.height * 4 : 0, w: j.gm.w, h: j.gm.h, oX: j.gm.oX, oY: j.gm.oY, s: j.S, pr: j.pr, pw: j.pw, ph: j.ph, sig: j.sig, t: performance.now(), kind: j.kind, gl: j.gl, empty: j.empty };
  CK.bakesTotal++;
}
function runJob(tEnd) {
  const j = JOB; if (!j) return;
  if (!j.empty) {
    const sox = ox, soy = oy, ss = s, sW = W, sH = H, sGL = GLOW, sctx = ctx, sZM = ZM;
    s = j.S; ox = j.ox; oy = j.oy; W = j.gm.w; H = j.gm.h; ZM = false; GLOW = j.gl; ctx = j.o;
    try { do { j.items[j.i++](); CK.stepsFrame++; } while (j.i < j.items.length && performance.now() < tEnd && CK.stepsFrame < CK.stepCap); }
    finally { ctx = sctx; ox = sox; oy = soy; s = ss; W = sW; H = sH; GLOW = sGL; ZM = sZM; }
    if (j.i < j.items.length) return;
  }
  finishJob();
}

// ---- chữ ký toàn cục + theo vùng ----
let gkGlob = 0;
function globalKey() { return (Math.round(NIGHT * 6) * 7 + G.era * 131 + (G.raid ? 977 : 0) + GFX.mode.charCodeAt(0) * 4001 + Math.round(bakePr() * 100) * 13) | 0; }
function groundKey() { return (GFX.mode.charCodeAt(0) * 4001 + Math.round(bakePr() * 100) * 13 + (GFX.decor ? 1 : 0)) | 0; }
function chunkFrame() {
  if (CK.G !== G || CK.map !== G.map) { chunkReset(); CK.G = G; CK.map = G.map; }
  LT.chunkScan(G.bl, N, T, CK.st);
  LT.visibleChunks(ox, oy, s, W, H, N, CK.vis);
  CK.isVis.fill(0); for (let i = 0; i < CK.vis.length; i++) CK.isVis[CK.vis[i]] = 1;
  CK.isPre.fill(0); if (!ZM) { LT.visibleChunks(ox, oy, s, W, H, N, CK.pre, 360); for (let i = 0; i < CK.pre.length; i++) if (!CK.isVis[CK.pre[i]]) CK.isPre[CK.pre[i]] = 1; }
}
function layerSig(idx, kind, gk, gkG) {
  const st = CK.st;
  return kind === 'g' ? LT.chunkSigG(st, idx, gkG) : LT.chunkSigO(st, idx, gk ^ (st.farm[idx] ? (G.tick / 6 | 0) * 7919 : 0));
}
let stillFrames = 0;
function planBakes() {
  const st = CK.st, now = performance.now(), gk = globalKey(), gkG = groundKey(), q = CK.q; q.length = 0; CK.bakesFrame = 0; CK.stepsFrame = 0; CK.bakeMs = 0;
  stillFrames = (PERF.moving || ZM) ? 0 : stillFrames + 1;
  // ngân sách vẽ lại mỗi khung (thời gian + số bước): ít khi đang zoom/kéo, nhiều khi đứng yên; tự giảm nếu khung thực tế đang chậm
  const slow = PERF.ema > 30 ? .3 : PERF.ema > 22 ? .55 : 1, mult = (ZM ? .45 : stillFrames > 18 ? 2.2 : PERF.moving ? .75 : 1) * slow;
  const budget = GFX.budget * mult, t0 = now, tEnd = t0 + budget; CK.stepCap = Math.max(4, Math.round(GFX.steps * mult));
  const cxs = (W / 2 - ox) / (TW / 2 * s), cys = (H / 2 - oy) / (TH / 2 * s), ctx0 = (cys + cxs) / 2, cty0 = (cys - cxs) / 2;
  if (JOB && (!CK.L[JOB.idx] || !(CK.isVis[JOB.idx] || CK.isPre[JOB.idx]) || JOB.sig !== layerSig(JOB.idx, JOB.kind, gk, gkG))) abortJob();
  for (let i = 0; i < CK.vis.length; i++) {
    const idx = CK.vis[i], cx = idx % CGW, cy = (idx / CGW) | 0; let ch = CK.L[idx] || (CK.L[idx] = { g: null, o: null, seen: 0, hasW: -1, anim: -1 }); ch.seen = frameNo;
    const dist = Math.hypot(cx * CHK + 4 - ctx0, cy * CHK + 4 - cty0);
    for (const kind of ['g', 'o']) {
      if (JOB && JOB.idx === idx && JOB.kind === kind) continue;
      const l = ch[kind], sigNow = layerSig(idx, kind, gk, gkG); let pr = -1, far = false;
      if (!l) pr = 0;
      else {
        const kk = s / l.s;
        if (kk < .4 || kk > 2.6) { pr = 0; far = true; }       // ảnh cũ lệch tỉ lệ quá xa: coi như thiếu, vẽ nhanh ở tỉ lệ gần đúng
        else if (l.sig !== sigNow) pr = ZM ? -1 : 1;
        else if (!ZM && Math.abs(kk - 1) > .012) pr = 2;
        else if (!ZM && GFX.anim && !PERF.moving) {
          if (ch.anim < 0) { ch.anim = 0; for (const b of st.stat[idx]) if (ANIM_KINDS[b.k]) { ch.anim = 1; break; } }
          if (ch.hasW < 0) { ch.hasW = 0; for (let y = cy * CHK; y < Math.min(N, cy * CHK + CHK) && !ch.hasW; y++) for (let x = cx * CHK; x < Math.min(N, cx * CHK + CHK); x++) if (G.map[y * N + x].t === 'w') { ch.hasW = 1; break; } }
          if ((kind === 'o' ? ch.anim : ch.hasW) && now - l.t > GFX.animMs + (idx % 7) * 170) pr = 3;
        }
      }
      if (pr >= 0) q.push({ idx, kind, pr, sig: sigNow, d: dist, quant: ZM && (pr === 0) || far });
    }
  }
  // vùng ngay sát khung nhìn: vẽ sẵn bằng thời gian còn dư để kéo bản đồ không bị khựng
  for (let i = 0; i < CK.pre.length; i++) {
    const idx = CK.pre[i]; if (!CK.isPre[idx]) continue; const cx = idx % CGW, cy = (idx / CGW) | 0;
    const ch = CK.L[idx] || (CK.L[idx] = { g: null, o: null, seen: 0, hasW: -1, anim: -1 }); ch.seen = frameNo;
    const dist = Math.hypot(cx * CHK + 4 - ctx0, cy * CHK + 4 - cty0);
    for (const kind of ['g', 'o']) { if (JOB && JOB.idx === idx && JOB.kind === kind) continue; if (!ch[kind]) q.push({ idx, kind, pr: 4, sig: layerSig(idx, kind, gk, gkG), d: dist, quant: false }); }
  }
  q.sort((a, b) => a.pr - b.pr || a.d - b.d);
  if (JOB) runJob(tEnd);
  let n = 0;
  while (!JOB && n < q.length && performance.now() < tEnd) { const it = q[n++]; startJob(it.idx, it.kind, it.quant ? quantS(s) : s, it.sig); runJob(tEnd); }
  CK.bakeMs = performance.now() - t0; CK.queued = Math.max(0, q.length - n) + (JOB ? 1 : 0); CK.bakesFrame = n;
  // trần bộ nhớ ảnh đệm: loại vùng lâu không thấy
  if (CK.bytes > GFX.capMB * 1048576) {
    const all = []; for (let i = 0; i < NCH; i++) { const c = CK.L[i]; if (c && c.seen < frameNo - 12) all.push(i); }
    all.sort((a, b) => CK.L[a].seen - CK.L[b].seen);
    for (const i of all) { if (CK.bytes < GFX.capMB * 1048576 * .75) break; const c = CK.L[i]; if (JOB && JOB.idx === i) abortJob(); freeLayer(c.g); freeLayer(c.o); CK.L[i] = null; CK.evicted++; }
    while (POOL.length && CK.bytes > GFX.capMB * 1048576 * .75) { const c = POOL.pop(); CK.bytes -= c.width * c.height * 4; c.width = 0; c.height = 0; }
  }
}
let smoothOff = false;
function putLayer(l, x0, y0) {
  if (l.empty) return { k: 1, dx: 0, dy: 0 };
  const k = s / l.s, p = P(x0, y0); let dx = p.x - l.oX * k, dy = p.y - l.oY * k;
  if (!ZM && Math.abs(k - 1) < .002) { dx = Math.round(dx * DPR) / DPR; dy = Math.round(dy * DPR) / DPR; }
  const nearest = (!ZM && Math.abs(k - 1) < .002) || (ZM && GFX.mode !== 'high'); if (nearest !== smoothOff) { ctx.imageSmoothingEnabled = !nearest; smoothOff = nearest; }
  ctx.drawImage(l.c, 0, 0, l.pw, l.ph, dx, dy, l.w * k, l.h * k);
  return { k, dx, dy };
}
function drawChunksGround() {
  chunkFrame(); planBakes();
  for (let i = 0; i < CK.vis.length; i++) {
    const idx = CK.vis[i], ch = CK.L[idx], cx = idx % CGW, cy = (idx / CGW) | 0;
    if (ch && ch.g) putLayer(ch.g, cx * CHK, cy * CHK);
    else { const x1 = Math.min(N, cx * CHK + CHK), y1 = Math.min(N, cy * CHK + CHK); for (let y = cy * CHK; y < y1; y++) for (let x = cx * CHK; x < x1; x++) { const q = G.map[y * N + x]; quad(x, y, 1, 1, 0, q.c, q.c, .8); } }
  }
}
function drawClouds() {
  if (!GFX.clouds || s < .45) return;
  for (let i = 0; i < 3; i++) { const cx = ((T * .35 + i * 13) % 44) - 9, cy = 4 + i * 8 + Math.sin(i * 3) * 3, p = P(cx, cy); ctx.fillStyle = 'rgba(30,50,40,.055)'; ctx.beginPath(); ctx.ellipse(p.x, p.y, 170 * s, 62 * s, 0, 0, 7); ctx.fill(); }
}
// lưới ô: vẽ bằng các đường dài (một lần), thay cho từng ô như trước
function drawGridOverlay() {
  if (!(showGrid || G.tool) || s < .5) return;
  ctx.beginPath();
  let minx = N, maxx = 0, miny = N, maxy = 0;
  for (let i = 0; i < CK.vis.length; i++) { const idx = CK.vis[i], cx = idx % CGW, cy = (idx / CGW) | 0; minx = Math.min(minx, cx * CHK); maxx = Math.max(maxx, Math.min(N, cx * CHK + CHK)); miny = Math.min(miny, cy * CHK); maxy = Math.max(maxy, Math.min(N, cy * CHK + CHK)); }
  for (let x = minx; x <= maxx; x++) { const a = P(x, miny), b = P(x, maxy); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); }
  for (let y = miny; y <= maxy; y++) { const a = P(minx, y), b = P(maxx, y); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); }
  ctx.strokeStyle = showGrid ? '#e5e5bc40' : '#e5e5bc1c'; ctx.lineWidth = .55; ctx.stroke();
}
// ---- vật thể + đối tượng động, xen kẽ theo vùng từ sau ra trước ----
const frontOccluded = (x, y) => { x |= 0; y |= 0; for (let j = 0; j < 3; j++) { const q = tile(x + (j !== 1 ? 1 : 0), y + (j !== 0 ? 1 : 0)); if (q && ((q.b && !isRoad(q.b)) || q.t === 'f' || q.t === 'r' || q.t === 'm')) return true; } return false; };
const dynItems = [[], []];
function pushDyn(x, y, k, f) { const idx = LT.chunkOf(x | 0, y | 0, N); if (!CK.isVis[idx]) return; CK.dyn[idx].push({ k, f, b: frontOccluded(x, y) }); }
function drawChunksObjects() {
  for (let i = 0; i < CK.vis.length; i++) CK.dyn[CK.vis[i]].length = 0;
  const st = CK.st, nowN = NIGHT > .05;
  // công trình đang thi công / vừa xong (vẽ trực tiếp mỗi khung)
  for (let i = 0; i < CK.vis.length; i++) { const idx = CK.vis[i], a = st.dyn[idx]; for (let j = 0; j < a.length; j++) { const b = a[j]; CK.dyn[idx].push({ k: b.x + b.y + (b.k === 'hall' ? 2.6 : 1), f: () => (s < .45 ? lowBuilding(b) : b.k === 'hall' ? drawHall() : drawB(b)), b: b.k === 'hall' ? false : frontOccluded(b.x, b.y) }); } }
  if (!ZM) {
    const nW = Math.ceil(WALK.length * GFX.actors);
    for (let i = 0; i < nW; i++) { const w = WALK[i], stt = ST[w.cls] || ST.luu; pushDyn(w.x, w.y, w.x + w.y, () => person(w.x, w.y, w.cls === 'quan' && i % 2 ? '#6a3a8a' : stt[0], w.ph, '#f1c9a5', stt[1], (w.cls === 'nong' || w.cls === 'thuong') && i % 2 === 0, w.cls === 'binh')); }
    const nT = Math.ceil(traffic.length * Math.max(.5, GFX.actors));
    for (let i = 0; i < nT; i++) { const a = traffic[i]; pushDyn(a.x, a.y, a.x + a.y, () => a.kind === 0 ? drawRider(a) : drawWagon(a));
      if (a.kind === 2 && a.trail) for (const n of [9, 18, 27]) { const q = a.trail[n]; if (!q || !roadAt(Math.floor(q.x), Math.floor(q.y))) continue; pushDyn(q.x, q.y, q.x + q.y, () => { if (n === 27) { person(q.x, q.y, '#81617d', a.phase, '#e5c3a0', 'non', 1); return; } horseBody(q.x, q.y, a.phase + n, q.dirX ?? 1, q.dirY ?? 0, '#78634d'); box(q.x - .08, q.y - .15, .17, .19, 10, 5, n === 9 ? '#a58e63' : '#907254'); }); } }
  }
  if (G.raid) {
    const r = G.raid, k = Math.max(0, Math.min(.92, 1 - r.t / (r.t0 || 3))), n = Math.min(10, Math.ceil(r.total / 25));
    for (let i = 0; i < n; i++) {
      const u = 8 + rnd(i * 7 + r.side) * 30, sx = r.side === 0 ? u : r.side === 1 ? N - .5 : r.side === 2 ? u : .5, sy = r.side === 0 ? .5 : r.side === 1 ? u : r.side === 2 ? N - .5 : u;
      const rx = sx + (G.hx + 1 - sx) * k + Math.sin(T * 2 + i) * .15, ry = sy + (G.hy + 1 - sy) * k + Math.cos(T * 2 + i) * .15;
      pushDyn(rx, ry, rx + ry, () => { person(rx, ry, i % 2 ? '#3a2a2a' : '#4a2f2a', i * 3, '#c9a184'); const p = P(rx, ry, 16); line({ x: p.x + 4 * s, y: p.y + 9 * s }, { x: p.x + 7 * s, y: p.y - 6 * s }, '#6b4a2e', 1.2); poly([{ x: p.x + 5.8 * s, y: p.y - 5 * s }, { x: p.x + 8.2 * s, y: p.y - 5.5 * s }, { x: p.x + 7.6 * s, y: p.y - 10 * s }], '#d0d4d8', OUT, .4); if (i === 0) flag(rx + .25, ry, 0, 30, '#2f2a2a'); });
    }
  }
  for (let i = 0; i < CK.vis.length; i++) {
    const idx = CK.vis[i], ch = CK.L[idx], cx = idx % CGW, cy = (idx / CGW) | 0, dl = CK.dyn[idx];
    if (dl.length > 1) dl.sort((a, b) => a.k - b.k);
    for (let j = 0; j < dl.length; j++) if (dl[j].b) dl[j].f();
    if (ch && ch.o) { const r = putLayer(ch.o, cx * CHK, cy * CHK); if (nowN) for (const g2 of ch.o.gl) GLOW.push([g2[0] * r.k + r.dx, g2[1] * r.k + r.dy, g2[2] * r.k, g2[3]]); }
    for (let j = 0; j < dl.length; j++) if (!dl[j].b) dl[j].f();
  }
}
// ---- bộ đếm hiệu năng (F3) ----
const PERF = { ema: 16.7, on: lsGet('lt-perf') === '1', ft: new Float32Array(240), dtv: new Float32Array(240), n: 0, last: 0, moving: false, el: null, acc: 0, lastDraw: 0, draws: 0, fps: 0, fpsT: 0, fpsN: 0, worst: 0, avg: 0, p95: 0, autoN: 0, autoSum: 0 };
function perfSet(on) { PERF.on = !!on; lsSet('lt-perf', on ? '1' : '0'); if (PERF.el) PERF.el.style.display = on ? 'block' : 'none'; }
function perfFrame(rafTs, cpuMs, drawMs) {
  const i = PERF.n++ % 240; PERF.ft[i] = cpuMs; if (PERF.last) PERF.dtv[i] = rafTs - PERF.last; if (PERF.last) PERF.ema = PERF.ema * .92 + Math.min(120, rafTs - PERF.last) * .08; PERF.last = rafTs; PERF.lastDraw = drawMs;
  PERF.fpsN++; if (rafTs - PERF.fpsT >= 500) { PERF.fps = PERF.fpsN * 1000 / (rafTs - PERF.fpsT); PERF.fpsN = 0; PERF.fpsT = rafTs; if (PERF.on) perfRender(); }
  // chọn chế độ tự động: nếu máy chậm ngay từ đầu thì hạ một bậc (một lần, chỉ khi người chơi chưa tự chọn)
  if (GFX.auto && PERF.autoN < 150 && PERF.dtv[i] > 0) { PERF.autoN++; PERF.autoSum += Math.min(200, PERF.dtv[i]); if (PERF.autoN === 150) { const avg = PERF.autoSum / 150; if (avg > 42 && GFX.mode !== 'low') { const nm = GFX.mode === 'high' ? 'med' : 'low'; setGfxMode(nm, false); GFX.auto = false; if (typeof toast === 'function') toast('Máy hơi chậm: đã chuyển đồ họa sang "' + GFX_MODES[nm].n + '" (đổi lại ở ☰ Trình đơn)', ''); } } }
}
function perfStats() {
  const n = Math.min(240, PERF.n), a = Array.prototype.slice.call(PERF.ft, 0, n).sort((x, y) => x - y); let sum = 0; for (const v of a) sum += v;
  PERF.avg = n ? sum / n : 0; PERF.p95 = n ? a[Math.floor(n * .95)] : 0; PERF.worst = n ? a[n - 1] : 0;
  let baked = 0; for (let i = 0; i < NCH; i++) { const c = CK.L[i]; if (c && (c.g || c.o)) baked++; }
  return { baked };
}
function perfRender() {
  if (!PERF.el) { const d = document.createElement('div'); d.id = 'perf'; d.style.cssText = 'position:fixed;left:285px;top:76px;z-index:9;background:#000b;color:#cfe8c8;font:11px/1.45 Consolas,monospace;padding:6px 9px;border:1px solid #6a8a60;border-radius:4px;pointer-events:none;white-space:pre'; document.body.appendChild(d); PERF.el = d; }
  PERF.el.style.display = PERF.on ? 'block' : 'none'; if (!PERF.on) return;
  const st = perfStats();
  PERF.el.textContent = 'FPS ' + PERF.fps.toFixed(0) + '  (rAF thật)\nKhung CPU: tb ' + PERF.avg.toFixed(1) + ' · p95 ' + PERF.p95.toFixed(1) + ' · xấu nhất ' + PERF.worst.toFixed(1) + ' ms\nVẽ: ' + PERF.lastDraw.toFixed(1) + ' ms · vẽ lại vùng: ' + CK.bakesFrame + ' (' + CK.bakeMs.toFixed(1) + ' ms), chờ ' + (CK.queued || 0) + '\nVùng: thấy ' + CK.vis.length + ' · đã có ảnh ' + st.baked + '/' + NCH + ' · bộ nhớ ' + (CK.bytes / 1048576).toFixed(0) + '/' + GFX.capMB + ' MB\nCông trình: ' + (G && G.bl ? G.bl.length : 0) + ' · đồ họa: ' + GFX_MODES[GFX.mode].n + ' · zoom ' + s.toFixed(2) + (ZM ? ' (đang zoom)' : '');
}
window.addEventListener('keydown', e => { if (e.key === 'F3') { e.preventDefault(); perfSet(!PERF.on); if (PERF.on) perfRender(); } });
(function initGfx() { const saved = lsGet('lt-gfx'), user = lsGet('lt-gfx-user') === '1'; setGfxMode(GFX_MODES[saved] ? saved : autoGfxMode(), false); GFX.auto = !user; GFX.chosen = !!(GFX_MODES[saved] && user); })();

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
  if (typeof layoutResize === 'function') layoutResize();
}

// ---- kho ảnh đệm ----
const CK = { G: null, map: null, st: LT.newChunkState(N), L: new Array(NCH).fill(null), bytes: 0, vis: [], pre: [], isVis: new Uint8Array(NCH), isPre: new Uint8Array(NCH), q: [], bakeMs: 0, bakesFrame: 0, bakesTotal: 0, evicted: 0, dyn: [] };
for (let i = 0; i < NCH; i++) CK.dyn.push([]);
function freeLayer(l) { if (l && l.objs) freeObjs(l); if (!l || !l.c) return; CK.bytes -= l.bytes; l.c.width = 0; l.c.height = 0; l.c = null; }
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
    if (q.t === 'f') L.push({ x, y, w: 1, d: 1, e: EXT.tree, k: x + y + 1, f: () => { if (s < .5) { const p = P(x + .5, y + .5); dot({ x: p.x, y: p.y - 6 * s }, 9 * s * (.8 + q.v * .4), q.v > .5 ? '#4f8a4a' : '#3c6a45'); } else tree(x, y, q.v); } });
    else if (q.t === 'r') L.push({ x, y, w: 1, d: 1, e: EXT.rock, k: x + y + 1, f: () => { if (s < .5) { const p = P(x + .5, y + .5); dot({ x: p.x, y: p.y - 3 * s }, 8 * s, '#9a9d9a'); } else rock(x, y, q.v); } });
    else if (q.t === 'm') L.push({ x, y, w: 1, d: 1, e: EXT.rock, k: x + y + 1, f: () => ore(x, y, q.v) });
    else if (q.t === 'h' && !q.b) L.push({ x, y, w: 1, d: 1, e: EXT.mound, k: x + y + .6, f: () => mound(x, y, q.v) });
  }
  for (const b of st.stat[cy * CGW + cx]) if (b.k !== 'hall') L.push({ x: b.x, y: b.y, w: b.w || 1, d: b.h || 1, e: EXT[EXTK[b.k] || 'default'], k: b.x + b.y + 1, f: () => drawStaticB(b) });
  L.sort((p, q) => p.k - q.k); return L;
}
// ---- việc vẽ lại chia nhỏ qua nhiều khung (mỗi khung một ngân sách thời gian), ảnh cũ vẫn hiển thị tới khi xong ----
const POOL = []; let JOB = null;
function takeCanvas(pw, ph) {
  for (let i = 0; i < POOL.length; i++) { const c = POOL[i]; if (c.width >= pw && c.height >= ph && c.width <= pw * 1.8 && c.height <= ph * 1.8) {
    POOL.splice(i, 1);
    // A cancelled ground job can leave save()/clip() on this context. Reset the
    // entire state, including the stack, before giving the canvas to another job.
    const g = c.getContext('2d'); if (g.reset) g.reset(); else c.width = c.width;
    return c;
  } }
  const c = document.createElement('canvas'); c.width = pw; c.height = ph; CK.bytes += pw * ph * 4; return c;
}
function recycle(c) { if (!c) return; if (POOL.length < 3) POOL.push(c); else { CK.bytes -= c.width * c.height * 4; c.width = 0; c.height = 0; } }
function startJob(idx, kind, S, sig) {
  const cx = idx % CGW, cy = (idx / CGW) | 0, gm = geom(kind, S), pr = bakePr(), x0 = cx * CHK, y0 = cy * CHK;
  let items, gm2 = gm, objsOut = null;
  if (kind === 'g') items = groundItems(cx, cy);
  else {
    const Lo = objectItems(cx, cy); items = Lo.map(o => o.f); objsOut = Lo;
    if (Lo.length) {
      let mnx = 1e9, mxx = -1e9, mny = 1e9, mxy = -1e9;
      for (const o of Lo) { const ax = ((o.x - x0) - (o.y - y0)) * 32 * S, ay = ((o.x - x0) + (o.y - y0)) * 16 * S, e = o.e; mnx = Math.min(mnx, ax - e[0] * S); mxx = Math.max(mxx, ax + e[0] * S); mny = Math.min(mny, ay - e[1] * S); mxy = Math.max(mxy, ay + e[2] * S + 8 * S); }
      mnx = Math.floor(mnx - 2); mny = Math.floor(mny - 2); gm2 = { w: Math.ceil(mxx - mnx + 2), h: Math.ceil(mxy - mny + 2), oX: -mnx, oY: -mny };
    }
  }
  const j0 = gm2; const j = { idx, kind, S, sig, gm: gm2, pr, pw: 0, ph: 0, items, i: 0, gl: [], ox: gm2.oX - (x0 - y0) * 32 * S, oy: gm2.oY - (x0 + y0) * 16 * S, c: null, o: null, empty: !items.length, objs: objsOut };
  j.pw = Math.ceil(gm2.w * pr); j.ph = Math.ceil(gm2.h * pr);
  if (!j.empty) { j.c = takeCanvas(j.pw, j.ph); j.o = j.c.getContext('2d'); j.o.setTransform(1, 0, 0, 1, 0, 0); j.o.clearRect(0, 0, j.c.width, j.c.height); j.o.setTransform(pr, 0, 0, pr, 0, 0); }
  JOB = j; return j;
}
function abortJob() { if (JOB) { recycle(JOB.c); JOB = null; } }
function finishJob() {
  const j = JOB, ch = CK.L[j.idx]; JOB = null;
  if (!ch) { recycle(j.c); return; }
  const old = ch[j.kind]; if (old && old.objs && j.objs && old.s === j.S && old.pr === j.pr && old.sig === j.sig) { const m = new Map(); for (const o of old.objs) if (o.spr) m.set(o.x + ',' + o.y, o); for (const o of j.objs) { const p = m.get(o.x + ',' + o.y); if (p && p.e === o.e) { o.spr = p.spr; p.spr = null; SPQ.delete(p); SPQ.add(o); } } } if (old && old.objs) freeObjs(old); if (old && old.c) { CK.bytes -= 0; recycle(old.c); }
  ch[j.kind] = { c: j.c, bytes: j.c ? j.c.width * j.c.height * 4 : 0, w: j.gm.w, h: j.gm.h, oX: j.gm.oX, oY: j.gm.oY, s: j.S, pr: j.pr, pw: j.pw, ph: j.ph, sig: j.sig, t: performance.now(), kind: j.kind, gl: j.gl, empty: j.empty, objs: j.objs || null };
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
  return kind === 'g' ? LT.chunkSigG(st, idx, gkG) : LT.chunkSigO(st, idx, gk ^ (st.farm[idx] ? LT.month(G.week) * 7919 : 0));
}
let stillFrames = 0;
function planBakes() {
  const st = CK.st, now = performance.now(), gk = globalKey(), gkG = groundKey(), q = CK.q; q.length = 0; CK.bakesFrame = 0; CK.stepsFrame = 0; CK.bakeMs = 0;
  stillFrames = (PERF.moving || ZM) ? 0 : stillFrames + 1;
  // ngân sách vẽ lại mỗi khung (thời gian + số bước): ít khi đang zoom/kéo, nhiều khi đứng yên; tự giảm nếu khung thực tế đang chậm
  const slow = PERF.ema > 30 ? .3 : PERF.ema > 22 ? .55 : 1, mult = (ZM ? .45 : stillFrames > 18 ? 2.2 : PERF.moving ? .75 : 1) * slow;
  const budget = Math.min(6, GFX.budget * mult), t0 = now, tEnd = t0 + budget; CK.stepCap = Math.max(4, Math.round(GFX.steps * mult));
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
          // Water motion is a small live overlay; do not rebake whole terrain
          // chunks just to animate a handful of ripples.
          if (kind === 'o' && ch.anim && now - l.t > GFX.animMs + (idx % 7) * 170) pr = 3;
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
  while (!JOB && n < q.length && CK.stepsFrame < CK.stepCap && performance.now() < tEnd) { const it = q[n++]; startJob(it.idx, it.kind, it.quant ? quantS(s) : s, it.sig); runJob(tEnd); }
  CK.bakeMs = performance.now() - t0; CK.queued = Math.max(0, q.length - n) + (JOB ? 1 : 0); CK.bakesFrame = n;
  // trần bộ nhớ ảnh đệm: loại vùng lâu không thấy
  if (CK.bytes > GFX.capMB * 1048576) {
    const all = []; for (let i = 0; i < NCH; i++) { const c = CK.L[i]; if (c && c.seen < frameNo - 12) all.push(i); }
    all.sort((a, b) => CK.L[a].seen - CK.L[b].seen);
    for (const i of all) { if (CK.bytes < GFX.capMB * 1048576 * .75) break; const c = CK.L[i]; if (JOB && JOB.idx === i) abortJob(); freeLayer(c.g); freeLayer(c.o); CK.L[i] = null; CK.evicted++; }
    while (POOL.length && CK.bytes > GFX.capMB * 1048576 * .75) { const c = POOL.pop(); CK.bytes -= c.width * c.height * 4; c.width = 0; c.height = 0; }
  }
}
function putLayer(l, x0, y0) {
  if (l.empty) return { k: 1, dx: 0, dy: 0 };
  const k = s / l.s, p = P(x0, y0); let dx = p.x - l.oX * k, dy = p.y - l.oY * k;
  if (!ZM && Math.abs(k - 1) < .002) { dx = Math.round(dx * DPR) / DPR; dy = Math.round(dy * DPR) / DPR; }
  // Apply to this context every time: actor masks can switch contexts between
  // layers. Avoid expensive filtering when the cached scale already matches.
  ctx.imageSmoothingEnabled = !((!ZM && Math.abs(k - 1) < .002) || (ZM && GFX.mode !== 'high'));
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
// ---- người / ngựa / xe / giặc: vẽ SAU mọi ảnh vùng, rồi vẽ lại đúng các vật đứng trước người (che theo từng ô, không theo vùng) ----
let DA = [], DB = [];
function pushDyn(x, y, k, f, hw, up) {
  const idx = LT.chunkOf(x | 0, y | 0, N); if (!CK.isVis[idx]) return;
  const p = P(x, y); if (p.x + (hw || 26) * s < 0 || p.x - (hw || 26) * s > W || p.y + 8 * s < 0 || p.y - (up || 66) * s > H) return;
  DA.push({ k, f, x, y, hw, up });
}
const SPQ = new Set(); let SPB = 0;
const sprCap = () => (GFX.mode === 'high' ? 32 : GFX.mode === 'med' ? 16 : 8) * 1048576;
function freeSpr(o) { SPQ.delete(o); if (o.spr) { SPB -= o.spr.bytes; CK.bytes -= o.spr.bytes; o.spr.c.width = 0; o.spr.c.height = 0; o.spr = null; } }
function freeObjs(l) { if (l && l.objs) for (let i = 0; i < l.objs.length; i++) freeSpr(l.objs[i]); }
// ảnh riêng của một vật thể tĩnh (vẽ đúng như khi dựng vùng, cùng tỉ lệ), dựng lười khi có người đứng sau nó
function objSprite(l, o) {
  if (o.spr) return o.spr;
  const S = l.s, pr = Math.min(l.pr, Math.max(.5, 2.2 / S)), e = o.e, cw = Math.ceil(2 * e[0] * S * pr), chh = Math.ceil((e[1] + e[2]) * S * pr);
  if (cw < 2 || chh < 2 || cw * chh > 6e6) return null;
  const c = document.createElement('canvas'); c.width = cw; c.height = chh; const c2 = c.getContext('2d'); c2.setTransform(pr, 0, 0, pr, 0, 0);
  const sox = ox, soy = oy, ss = s, sW = W, sH = H, sGL = GLOW, sctx = ctx, sZM = ZM;
  s = S; ox = e[0] * S - (o.x - o.y) * 32 * S; oy = e[1] * S - (o.x + o.y) * 16 * S; W = cw / pr; H = chh / pr; ZM = false; GLOW = []; ctx = c2;
  try { o.f(); } finally { ctx = sctx; ox = sox; oy = soy; s = ss; W = sW; H = sH; GLOW = sGL; ZM = sZM; }
  o.spr = { c, bytes: cw * chh * 4, cw, chh }; SPB += o.spr.bytes; CK.bytes += o.spr.bytes; SPQ.add(o);
  while (SPB > sprCap() && SPQ.size > 1) freeSpr(SPQ.values().next().value);
  return o.spr;
}
const ORG = new Array(NCH).fill(null);
// vật tĩnh o có đứng trước người ở (fx,fy) không? (người ở sau vật theo trục x hoặc y và nằm trong dải của vật)
const inFront = (fx, fy, o) => fx < o.x + o.w && fy < o.y + o.d && (fx < o.x || fy < o.y);
// vẽ một người: nếu có vật đứng trước thì vẽ người vào ảnh tạm rồi XOÁ phần bị che bằng chính hình của vật đó (destination-out), cuối cùng chép lên màn hình.
// Cách này pha trộn đúng ở mép mờ và không vẽ đè hai lần; người không bị che thì vẽ thẳng.
// ảnh đệm của công trình động (phủ, đang xây): dựng lại khi đổi tỉ lệ hoặc sau ~0,3 giây, dùng chung cho mọi người đứng sau nó
const LIVE = new WeakMap();
function liveSprite(o, bx0, by0, bx1, by1) {
  const key = o.b || o, p0 = P(o.x, o.y); let e = LIVE.get(key);
  if (e && e.s === s && e.dpr === DPR && T - e.t < .3 && T >= e.t) return e;
  const w = Math.ceil((bx1 - bx0) * DPR) + 2, h = Math.ceil((by1 - by0) * DPR) + 2; if (w < 2 || h < 2 || w * h > 6e6) return null;
  const c = (e && e.c) || document.createElement('canvas'); if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  const c2 = c.getContext('2d'); c2.setTransform(1, 0, 0, 1, 0, 0); c2.clearRect(0, 0, w, h); c2.setTransform(DPR, 0, 0, DPR, -bx0 * DPR, -by0 * DPR);
  const main = ctx, sGL = GLOW; ctx = c2; GLOW = [];
  try { o.f(); } finally { ctx = main; GLOW = sGL; }
  e = { c, s, dpr: DPR, t: T, offx: bx0 - p0.x, offy: by0 - p0.y, w, h }; LIVE.set(key, e); return e;
}
// vẽ một người rồi vẽ đè lại (chỉ trong khung bao của người) các vật đứng trước người: không dùng ảnh tạm, không đổi canvas giữa chừng.
function drawActor(a) {
  const pa = P(a.x, a.y), hw = (a.hw || 26) * s, up = (a.up || 66) * s, dn = (a.dn || 6) * s;
  const Rx = Math.floor((pa.x - hw) * DPR) / DPR, Ry = Math.floor((pa.y - up) * DPR) / DPR, Rw = Math.ceil((2 * hw + 2) * DPR) / DPR, Rh = Math.ceil((up + dn + 2) * DPR) / DPR;
  a.f();
  const tx = a.x | 0, ty = a.y | 0, cx0 = (tx / CHK) | 0, cy0 = (ty / CHK) | 0;
  for (let dj = 0; dj <= 1; dj++) for (let di = 0; di <= 1; di++) {
    const cx = cx0 + di, cy = cy0 + dj; if (cx >= CGW || cy >= CGW) continue; const idx = cy * CGW + cx, ch = CK.L[idx], l = ch && ch.o, r = ORG[idx]; if (!l || !l.objs || !r) continue;
    const objs = l.objs, x0c = cx * CHK, y0c = cy * CHK;
    for (let k = 0; k < objs.length; k++) {
      const o = objs[k]; if (!inFront(a.x, a.y, o)) continue;
      const e = o.e, ax = l.oX + ((o.x - x0c) - (o.y - y0c)) * 32 * l.s, ay = l.oY + ((o.x - x0c) + (o.y - y0c)) * 16 * l.s;
      const dx = r.dx + (ax - e[0] * l.s) * r.k, dy = r.dy + (ay - e[1] * l.s) * r.k, dw = 2 * e[0] * l.s * r.k, dh = (e[1] + e[2]) * l.s * r.k;
      const ix0 = Math.max(dx, Rx), iy0 = Math.max(dy, Ry), ix1 = Math.min(dx + dw, Rx + Rw), iy1 = Math.min(dy + dh, Ry + Rh);
      if (ix1 - ix0 < .5 || iy1 - iy0 < .5) continue;
      const sp = objSprite(l, o); if (!sp) continue; const fx = sp.cw / dw, fy = sp.chh / dh;
      ctx.drawImage(sp.c, (ix0 - dx) * fx, (iy0 - dy) * fy, (ix1 - ix0) * fx, (iy1 - iy0) * fy, ix0, iy0, ix1 - ix0, iy1 - iy0);
    }
  }
  for (let k = 0; k < DB.length; k++) {
    const o = DB[k]; if (!inFront(a.x, a.y, o)) continue;
    const pp = P(o.x, o.y), p0 = P(o.x, o.y + o.d), p1 = P(o.x + o.w, o.y), p2 = P(o.x + o.w, o.y + o.d), bx0 = Math.min(p0.x - 6 * s, pp.x - o.EW * s), bx1 = Math.max(p1.x + 6 * s, pp.x + o.EW * s), by0 = pp.y - o.H * s, by1 = p2.y + 4 * s;
    const ix0 = Math.max(bx0, Rx), iy0 = Math.max(by0, Ry), ix1 = Math.min(bx1, Rx + Rw), iy1 = Math.min(by1, Ry + Rh);
    if (ix1 - ix0 < .5 || iy1 - iy0 < .5) continue;
    const sp = liveSprite(o, bx0, by0, bx1, by1); if (!sp) continue; const X = pp.x + sp.offx, Y = pp.y + sp.offy;
    ctx.drawImage(sp.c, (ix0 - X) * DPR, (iy0 - Y) * DPR, (ix1 - ix0) * DPR, (iy1 - iy0) * DPR, ix0, iy0, ix1 - ix0, iy1 - iy0);
  }
}
let RPN = 0;
function drawChunksObjects() {
  DA = []; DB = [];
  const st = CK.st, nowN = NIGHT > .05; RPN = 0;
  // công trình đang thi công / vừa xong (vẽ trực tiếp mỗi khung)
  for (let i = 0; i < CK.vis.length; i++) { const idx = CK.vis[i], a = st.dyn[idx]; for (let j = 0; j < a.length; j++) { const b = a[j], hall = b.k === 'hall'; DB.push({ b, k: b.x + b.y + (hall ? 2.6 : 1), x: b.x, y: b.y, w: hall ? 2 : (b.w || 1), d: hall ? 2 : (b.h || 1), H: hall ? 130 : (EXT[EXTK[b.k] || 'default'] || EXT.default)[1], EW: hall ? 110 : (EXT[EXTK[b.k] || 'default'] || EXT.default)[0], f: () => (s < .45 ? lowBuilding(b) : hall ? drawHall() : drawB(b)) }); } }
  {
    const nW = Math.ceil(WALK.length * GFX.actors);
    for (let i = 0; i < nW; i++) { const w = WALK[i]; if (w._c !== w.cls) { w._c = w.cls; w.fk = figKindOf(w.cls, i); w.fv = figVarOf(w.fk, i); } pushDyn(w.x, w.y, w.x + w.y, () => FIGS.draw(w.fk, w.fv, w.x, w.y, w.dx == null ? 1 : w.dx, w.dy == null ? 0 : w.dy, T * 8.5 + w.ph, !!w.mv)); }
    const nT = Math.ceil(traffic.length * Math.max(.5, GFX.actors));
    for (let i = 0; i < nT; i++) { const a = traffic[i]; pushDyn(a.x, a.y, a.x + a.y, () => a.kind === 0 ? drawRider(a) : drawWagon(a), a.kind === 0 ? 30 : 76, a.kind === 0 ? 70 : 64);
      if (a.kind === 2 && a.trail) for (const n of [9, 18, 27]) { const q = a.trail[n]; if (!q || !roadAt(Math.floor(q.x), Math.floor(q.y))) continue; pushDyn(q.x, q.y, q.x + q.y, () => { if (n === 27) { FIGS.draw('phu', 1, q.x, q.y, q.dirX ?? 1, q.dirY ?? 0, a.phase, true); return; } horseBody(q.x, q.y, a.phase + n, q.dirX ?? 1, q.dirY ?? 0, '#78634d'); box(q.x - .08, q.y - .15, .17, .19, 10, 5, n === 9 ? '#a58e63' : '#907254'); }, 40, 62); } }
  }
  if (G.raid) {
    const r = G.raid, k = Math.max(0, Math.min(.92, 1 - r.t / (r.t0 || 3))), n = Math.min(10, Math.ceil(r.total / 25));
    for (let i = 0; i < n; i++) {
      const u = 8 + rnd(i * 7 + r.side) * 30, sx = r.side === 0 ? u : r.side === 1 ? N - .5 : r.side === 2 ? u : .5, sy = r.side === 0 ? .5 : r.side === 1 ? u : r.side === 2 ? N - .5 : u;
      const pp = raidPos(r, i, sx, sy, k); if (!pp) continue;
      pushDyn(pp.x, pp.y, pp.x + pp.y, () => { FIGS.draw('giac', i % 3, pp.x, pp.y, pp.dx, pp.dy, T * 9 + i * 1.3, true); if (i === 0) flag(pp.x + .25, pp.y, 0, 38, '#2f2a2a'); });
    }
  }
  // 1) ảnh vùng (nền + công trình tĩnh), 2) công trình động, 3) người từ sau ra trước: vẽ người xong thì vẽ lại các vật đứng trước người
  for (let i = 0; i < CK.vis.length; i++) {
    const idx = CK.vis[i], ch = CK.L[idx], cx = idx % CGW, cy = (idx / CGW) | 0; ORG[idx] = null;
    if (ch && ch.o) { const r = putLayer(ch.o, cx * CHK, cy * CHK); ORG[idx] = r; if (nowN) for (const g2 of ch.o.gl) GLOW.push([g2[0] * r.k + r.dx, g2[1] * r.k + r.dy, g2[2] * r.k, g2[3]]); }
  }
  DB.sort((p, q) => p.k - q.k); for (let i = 0; i < DB.length; i++) DB[i].f();
  DA.sort((p, q) => p.k - q.k);
  for (let i = 0; i < DA.length; i++) drawActor(DA[i]);
}
// đường đi của giặc theo từng đợt: tìm một lần bằng đường ngắn nhất qua ô trống (không xuyên công trình); không lưu vào bản lưu
const RP = new WeakMap();
function raidPos(r, i, sx, sy, k) {
  let rp = RP.get(r); if (!rp) { rp = { F: undefined }; RP.set(r, rp); }
  if (rp.F === undefined) { if (RPN >= 1) return null; RPN++; const gl = LT.walkNearest(G, G.hx + 1.5, G.hy + 3, 8, false); rp.F = gl ? LT.walkField(G, gl[0], gl[1], true) : null; }
  let path = rp[i]; if (path === undefined) path = rp[i] = LT.walkFieldPath(rp.F, sx, sy) || false;
  if (!path) return { x: sx + (G.hx + 1 - sx) * k, y: sy + (G.hy + 1 - sy) * k, dx: G.hx + 1 - sx, dy: G.hy + 1 - sy };   // không có đường: đi thẳng như cũ
  const len = path.length - 1, f = Math.max(0, Math.min(len, k * len - (i % 3) * .7)), a = Math.floor(f), b = Math.min(len, a + 1), u = f - a, lx = (rnd(i * 5.3 + 1) - .5) * .4, ly = (rnd(i * 3.1 + 2) - .5) * .4;
  const x0 = path[a][0] + .5 + lx, y0 = path[a][1] + .5 + ly, x1 = path[b][0] + .5 + lx, y1 = path[b][1] + .5 + ly;
  return { x: x0 + (x1 - x0) * u, y: y0 + (y1 - y0) * u, dx: x1 - x0 || 1, dy: y1 - y0 };
}
// ---- bộ đếm hiệu năng (F3) ----
const PERF = { ema: 16.7, on: lsGet('lt-perf') === '1', ft: new Float32Array(240), dtv: new Float32Array(240), n: 0, last: 0, moving: false, el: null, acc: 0, lastDraw: 0, draws: 0, fps: 0, fpsT: 0, fpsN: 0, worst: 0, avg: 0, p95: 0, autoN: 0, autoSum: 0 };
function perfSet(on) { PERF.on = !!on; lsSet('lt-perf', on ? '1' : '0'); if (PERF.el) PERF.el.style.display = on ? 'block' : 'none'; }
function perfFrame(rafTs, cpuMs, drawMs) {
  const i = PERF.n++ % 240; PERF.ft[i] = cpuMs; if (PERF.last) PERF.dtv[i] = rafTs - PERF.last; if (PERF.last) PERF.ema = PERF.ema * .92 + Math.min(120, rafTs - PERF.last) * .08; PERF.last = rafTs; PERF.lastDraw = drawMs;
  PERF.fpsN++; if (rafTs - PERF.fpsT >= 500) { PERF.fps = PERF.fpsN * 1000 / (rafTs - PERF.fpsT); PERF.fpsN = 0; PERF.fpsT = rafTs; if (PERF.on) perfRender(); }
  // Measure gameplay continuously: the title screen says nothing about a busy
  // city. Ignore hidden tabs, dialogs and resume stalls; manual choices always win.
  const elapsed = PERF.dtv[i];
  if (!G || document.hidden || (typeof modalOpen === 'function' && modalOpen()) || elapsed <= 0 || elapsed > 250) { PERF.autoN = 0; PERF.autoSum = 0; return; }
  if (GFX.auto && GFX.mode !== 'low' && rafTs >= (PERF.autoAfter || 0)) {
    PERF.autoN++; PERF.autoSum += elapsed;
    if (PERF.autoN >= 180) {
      const avg = PERF.autoSum / PERF.autoN; PERF.autoN = 0; PERF.autoSum = 0;
      if (avg > 30) {
        const nm = GFX.mode === 'high' ? 'med' : 'low'; setGfxMode(nm, false); PERF.autoAfter = rafTs + 8000;
        if (typeof toast === 'function') toast('Đã giảm đồ họa sang "' + GFX_MODES[nm].n + '" để chơi mượt hơn (đổi ở ☰ Trình đơn)', '');
      }
    }
  }
}
function perfStats() {
  const n = Math.min(240, PERF.n), a = Array.prototype.slice.call(PERF.ft, 0, n).sort((x, y) => x - y); let sum = 0; for (const v of a) sum += v;
  PERF.avg = n ? sum / n : 0; PERF.p95 = n ? a[Math.floor(n * .95)] : 0; PERF.worst = n ? a[n - 1] : 0;
  let baked = 0; for (let i = 0; i < NCH; i++) { const c = CK.L[i]; if (c && (c.g || c.o)) baked++; }
  return { baked };
}
function perfRender() {
  if (!PERF.el) { const d = document.createElement('div'); d.id = 'perf'; d.style.cssText = 'position:fixed;left:285px;top:76px;z-index:9;background:#000b;color:#cfe8c8;font:11px/1.45 Consolas,monospace;padding:6px 9px;border:1px solid #6a8a60;border-radius:4px;pointer-events:none;white-space:pre'; document.body.appendChild(d); PERF.el = d; }
  PERF.el.style.display = (PERF.on && !(typeof modalOpen === 'function' && modalOpen())) ? 'block' : 'none'; if (!PERF.on) return;
  const st = perfStats();
  PERF.el.textContent = 'FPS ' + PERF.fps.toFixed(0) + '  (rAF thật)\nKhung CPU: tb ' + PERF.avg.toFixed(1) + ' · p95 ' + PERF.p95.toFixed(1) + ' · xấu nhất ' + PERF.worst.toFixed(1) + ' ms\nVẽ: ' + PERF.lastDraw.toFixed(1) + ' ms · vẽ lại vùng: ' + CK.bakesFrame + ' (' + CK.bakeMs.toFixed(1) + ' ms), chờ ' + (CK.queued || 0) + '\nVùng: thấy ' + CK.vis.length + ' · đã có ảnh ' + st.baked + '/' + NCH + ' · bộ nhớ ' + (CK.bytes / 1048576).toFixed(0) + '/' + GFX.capMB + ' MB\nCông trình: ' + (G && G.bl ? G.bl.length : 0) + ' · đồ họa: ' + GFX_MODES[GFX.mode].n + ' · zoom ' + s.toFixed(2) + (ZM ? ' (đang zoom)' : '');
}
window.addEventListener('keydown', e => { if (e.key === 'F3') { e.preventDefault(); perfSet(!PERF.on); if (PERF.on) perfRender(); } });
(function initGfx() { const saved = lsGet('lt-gfx'), user = lsGet('lt-gfx-user') === '1'; setGfxMode(GFX_MODES[saved] ? saved : autoGfxMode(), false); GFX.auto = !user; GFX.chosen = !!(GFX_MODES[saved] && user); })();

// ---- lớp hiển thị theo ô (dân tâm / trị an / vệ sinh): bản đồ giá trị lưu đệm, chỉ tính lại khi công trình đổi; vẽ gộp theo ba nhóm màu ----
const LAYERMAP = { key: '', v: null, ref: null, kind: '' };
function layerValues(kind) {
  const key = kind + ':' + G.bl.length + ':' + (G.tick / 9 | 0) + ':' + G.rank; if (LAYERMAP.key === key && LAYERMAP.v) return LAYERMAP.v;
  const v = new Float32Array(N * N), svc = { well: [], watch: [], clinic: [], market: [] };
  for (const b of G.bl) { if (b.building) continue; if (b.k === 'well') svc.well.push(b); if ((b.k === 'watch' && b.sr > 0) || b.k === 'barracks') svc.watch.push(b); if (b.k === 'clinic' && b.sr > 0) svc.clinic.push(b); if (b.k === 'market') svc.market.push(b); }
  const R = { well: 6, watch: 7, clinic: 9, market: 10 };
  const near = (k, x, y) => { let best = 99; for (const s of svc[k]) { const d = Math.max(Math.abs(s.x - x), Math.abs(s.y - y)); if (d < best) best = d; } return best >= 99 ? 0 : Math.max(0, 1 - Math.max(0, best - R[k] * .5) / (R[k] * .75 + 1)); };
  const dt = G.stat.dantam / 100;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const a = near('watch', x, y), b = Math.max(near('well', x, y), near('clinic', x, y)), c = near('market', x, y);
    v[y * N + x] = kind === 'trian' ? a : kind === 'vesinh' ? b : Math.min(1, (a + b + c) / 3 * .6 + dt * .4);
  }
  LAYERMAP.key = key; LAYERMAP.ref = G.city; LAYERMAP.kind = kind; LAYERMAP.v = v; return v;
}
// vùng cấm quan xây: tô đỏ trên bản đồ (và viền nhấp nháy khi đang chọn ô)
function drawNogoZones() {
  const D = G.off && G.off.dg; if (!D || !D.nogo || !D.nogo.length || s < .35) return;
  ctx.beginPath(); for (const z of D.nogo) { const x0 = Math.max(0, z.x - z.r), y0 = Math.max(0, z.y - z.r), x1 = Math.min(N, z.x + z.r + 1), y1 = Math.min(N, z.y + z.r + 1), a = P(x0, y0), b = P(x1, y0), c = P(x1, y1), d = P(x0, y1); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.closePath(); }
  ctx.fillStyle = 'rgba(220,50,40,.20)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,110,90,.8)'; ctx.lineWidth = 1.6; ctx.setLineDash([6, 4]); ctx.stroke(); ctx.setLineDash([]);
}
const OVL = { c: null, key: '', x0: 0, y0: 0, off: 0 };
// ảnh lớp phủ dựng một lần theo toạ độ thế giới (affine) rồi chép lên màn hình mỗi khung; chỉ dựng lại khi dữ liệu hoặc công trình đổi
function drawLayerOverlay() {
  drawNogoZones();
  const kind = UI.layer; if (!kind || kind === 'none' || s < .3) return;
  const v = layerValues(kind), x0 = Math.max(0, G.hx + 1 - 19), x1 = Math.min(N - 1, G.hx + 1 + 19), y0 = Math.max(0, G.hy + 1 - 19), y1 = Math.min(N - 1, G.hy + 1 + 19);
  const key = kind + '|' + LAYERMAP.key + '|' + x0 + ',' + y0;
  if (!OVL.c) OVL.c = document.createElement('canvas');
  if (OVL.key !== key) {
    const off = (y1 + 1 - x0) * 32, w = ((x1 + 1 - y0) + (y1 + 1 - x0)) * 32, h = ((x1 + 1 - x0) + (y1 + 1 - y0)) * 16;
    OVL.c.width = Math.ceil(w); OVL.c.height = Math.ceil(h); OVL.x0 = x0; OVL.y0 = y0; OVL.off = off;
    const c2 = OVL.c.getContext('2d'), cols = ['rgba(214,70,60,.34)', 'rgba(232,196,70,.30)', 'rgba(110,200,100,.30)'], B = [[], [], []];
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const q = v[y * N + x]; B[q < .34 ? 0 : q < .67 ? 1 : 2].push(x, y); }
    const T2 = (X, Y) => [(X - Y) * 32 + off, (X + Y - x0 - y0) * 16];
    for (let b = 0; b < 3; b++) { const a = B[b]; if (!a.length) continue; c2.beginPath(); for (let k = 0; k < a.length; k += 2) { const x = a[k], y = a[k + 1], p0 = T2(x, y), p1 = T2(x + 1, y), p2 = T2(x + 1, y + 1), p3 = T2(x, y + 1); c2.moveTo(p0[0], p0[1]); c2.lineTo(p1[0], p1[1]); c2.lineTo(p2[0], p2[1]); c2.lineTo(p3[0], p3[1]); c2.closePath(); } c2.fillStyle = cols[b]; c2.fill(); }
    OVL.key = key;
  }
  ctx.drawImage(OVL.c, ox - OVL.off * s, oy + (OVL.x0 + OVL.y0) * 16 * s, OVL.c.width * s, OVL.c.height * s);
}

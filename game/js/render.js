'use strict';
// ============================================================================
// VẼ CẢNH: ghép các lớp đồ họa của demo (render-base, render-gfx, render-build)
// + công trình mới (giếng, trạm tuần, y quán, mỏ sắt, vườn trà, mương…) + vòng vẽ chính.
// ============================================================================
const B = LT.B;
const isBuilt = b => !!b && !b.building;
const isRoad = b => !!b && !b.building && (b.k === 'road' || b.k === 'pave' || b.k === 'bridge');
const tile = (x, y) => x >= 0 && y >= 0 && x < N && y < N ? G.map[y * N + x] : null;
const isW = (x, y) => { const q = tile(x, y); return !!(q && q.b && isBuilt(q.b) && (q.b.k === 'wall' || q.b.k === 'tower' || q.b.k === 'gate')); };
let hover = null, sceneActors = [], ZM = false;
let WALK = [], FL = [];
const float = (x, y, txt) => FL.push({ x, y, txt, t: 0 });

// ---- công trình mới ---------------------------------------------------------------
const NEWKIND = { port: 1, terrace: 1, mansion: 1, well: 1, watch: 1, clinic: 1, mine: 1, mulberry: 1, tea: 1, canal: 1, cloth: 1, forge: 1, winery: 1 };
function drawNew(b) {
  const x = b.x, y = b.y, v = rnd(x * 17 + y * 31), k = b.k, pop = Math.max(0, Math.min(1, (T - (b.born || -9)) * 4));
  if (k === 'mine') { oldBuilding({ ...b, k: 'quarry', born: -9 }); boulder(x + .82, y + .78, .16, 7, v * 9, '#a8643f'); boulder(x + .66, y + .86, .12, 5, v * 13, '#7c4a35'); return; }
  if (k === 'port') { oldBuilding({ ...b, k: 'inn', born: -9 }); boulder(x + .85, y + .85, .13, 6, v * 11, '#6b7f8a'); return; }
  if (k === 'cloth') { oldBuilding({ ...b, k: 'silk', born: -9 }); return; }
  if (k === 'forge') { oldBuilding({ ...b, k: 'armory', born: -9 }); return; }
  if (pop < 1) { const c = P(x + .5, y + .5); ctx.save(); ctx.translate(c.x, c.y); ctx.scale(1, .4 + .6 * pop); ctx.translate(-c.x, -c.y); }
  if (k === 'terrace') {
    box(x + .06, y + .1, .88, .8, 0, 3, '#a9a498'); box(x + .1, y + .14, .8, .72, 3, 18, '#e8dcc2'); winF(x + .16, y + .86, 9, .14, 6); winF(x + .66, y + .86, 9, .14, 6); door(x + .44, y + .86, 3, .14, 9, '#6b3a2a');
    box(x + .12, y + .16, .76, .68, 21, 16, '#efe4cc'); winF(x + .2, y + .84, 27, .14, 6); winF(x + .6, y + .84, 27, .14, 6); line(P(x + .1, y + .88, 21), P(x + .9, y + .88, 21), '#7a4a34', 1.6);
    hip(x + .08, y + .12, .84, .76, 37, 15, '#4f5f68', .1); lantern(x + .84, y + .9, 20, .8);
  } else if (k === 'mansion') {
    box(x + .03, y + .06, .94, .88, 0, 3, '#a9a498'); box(x + .07, y + .1, .86, .8, 3, 18, '#e6d9bd'); pillars(x + .07, y + .1, .86, .8, 3, 18, '#a63a2a'); winF(x + .15, y + .9, 8, .14, 6); winF(x + .7, y + .9, 8, .14, 6); door(x + .43, y + .9, 3, .16, 9, '#5c3d24');
    box(x + .1, y + .13, .8, .74, 21, 16, '#eee3c8'); winF(x + .18, y + .87, 27, .14, 6); winF(x + .62, y + .87, 27, .14, 6);
    box(x + .14, y + .17, .72, .66, 37, 14, '#e4d4b2'); winF(x + .3, y + .83, 41, .16, 6); hip(x + .1, y + .13, .8, .74, 51, 16, '#3f5a50', .13); lantern(x + .1, y + .93, 24, .9); lantern(x + .88, y + .93, 24, .9); flag(x + .9, y + .12, 51, 16, '#a63a2a');
  } else if (k === 'well') {
    box(x + .28, y + .28, .44, .44, 0, 7, '#b2ae9f'); quad(x + .34, y + .34, .32, .32, 7.2, '#3f7f95', OUT, .6);
    line(P(x + .3, y + .3, 7), P(x + .3, y + .3, 22), '#6b4a2e', 1.6); line(P(x + .7, y + .3, 7), P(x + .7, y + .3, 22), '#6b4a2e', 1.6);
    gable(x + .24, y + .26, .52, .34, 22, 7, '#8a7a4a', '#b98a55');
    const r = P(x + .5, y + .45, 21); line(r, { x: r.x, y: r.y + 9 * s + Math.sin(T * 2 + x) * s }, '#6b4a2e', .6); dot({ x: r.x, y: r.y + 11 * s + Math.sin(T * 2 + x) * s }, 1.8 * s, '#9c7a52', OUT);
  } else if (k === 'watch') {
    box(x + .3, y + .3, .4, .4, 0, 22, '#cdbf9f'); bricks(x + .3, y + .3, .4, .4, 0, 22); door(x + .42, y + .7, 0, .16, 9, '#4a3a2e');
    box(x + .26, y + .26, .48, .48, 22, 8, '#a63a2a'); winF(x + .4, y + .74, 24, .2, 4); hip(x + .22, y + .22, .56, .56, 30, 9, '#57626b', .13);
    flag(x + .74, y + .74, 22, 24, '#d9a82e'); lantern(x + .72, y + .76, 20, .7);
    if (b.on) person(x + .2, y + .85, '#7a2f2a', v * 9, '#f1c9a5', 'helm', 0, 1);
  } else if (k === 'clinic') {
    box(x + .1, y + .16, .8, .7, 0, 3, '#a9a498'); box(x + .14, y + .2, .72, .62, 3, 12, '#f2ede0'); pillars(x + .14, y + .2, .72, .62, 3, 12, '#4f7a5a');
    door(x + .42, y + .82, 3, .16, 9, '#6b3a2a'); winF(x + .2, y + .82, 7, .14, 5); winF(x + .66, y + .82, 7, .14, 5);
    hip(x + .1, y + .16, .8, .7, 15, 12, '#4f7a5a', .1);
    const c = P(x + .5, y + .83, 20); line({ x: c.x, y: c.y - 4 * s }, { x: c.x, y: c.y + 4 * s }, '#c0392b', 2); line({ x: c.x - 4 * s, y: c.y }, { x: c.x + 4 * s, y: c.y }, '#c0392b', 2);
    if (b.on) person(x + .25, y + .95, '#dfe6ea', v * 7, '#f1c9a5', 'futou');
  } else if (k === 'mulberry') {
    quad(x + .03, y + .03, .94, .94, 0, '#9fb36c', null);
    for (const [a, c] of [[.25, .28], [.72, .3], [.28, .74], [.72, .74]]) { const p = P(x + a, y + c); broad(p, .5 + rnd(a * 9 + c) * .1, '#6aa24f', '#8ac365'); }
    if (b.on) person(x + .5, y + .52, '#8a6a4a', v * 9, '#f1c9a5', 'non', 1);
  } else if (k === 'tea') {
    quad(x + .03, y + .03, .94, .94, 0, '#a9b27a', OUT, .5);
    for (let i = 0; i < 5; i++) { const yy = y + .12 + i * .18; line(P(x + .1, yy), P(x + .9, yy), '#33603f', 4.2); line(P(x + .1, yy - .02), P(x + .9, yy - .02), '#6aa24f', 2.4); for (let j = 0; j < 6; j++) dot(P(x + .14 + j * .14, yy - .03, 2), .9 * s, '#9bd16f'); }
    if (b.on) { const u = (T * .06 + v) % 1; person(x + .1 + u * .8, y + .5, '#c9a36a', v * 9, '#f1c9a5', 'non', 1); }
  } else if (k === 'canal') {
    const nb = (i, j) => { const o = tile(x + i, y + j); return !!(o && o.b && o.b.k === 'canal' && !o.b.building) || (o && o.t === 'w' && false); };
    const W2 = nb(-1, 0), E = nb(1, 0), N2 = nb(0, -1), S = nb(0, 1);
    quad(x + .1, y + .1, .8, .8, 0, '#b9a273', null);
    const arm = (a, c, w, d) => quad(x + a, y + c, w, d, 0, '#5aa0b8', null);
    arm(.3, .3, .4, .4); if (W2) arm(0, .3, .3, .4); if (E) arm(.7, .3, .3, .4); if (N2) arm(.3, 0, .4, .3); if (S) arm(.3, .7, .4, .3);
    const p = P(x + .5, y + .5); line({ x: p.x - 6 * s + Math.sin(T * 2 + x) * 2 * s, y: p.y - 1 * s }, { x: p.x + 2 * s, y: p.y - 1 * s }, '#ffffff88', .8);
  } else if (k === 'winery') {
    box(x + .08, y + .14, .62, .62, 0, 2, '#a9a498'); box(x + .12, y + .18, .54, .54, 2, 11, '#e6d8b8'); door(x + .34, y + .72, 2, .18, 8, '#4a3a2e'); winF(x + .16, y + .72, 6, .12, 4.5);
    hip(x + .08, y + .14, .62, .62, 13, 10, '#7a5a3a', .1); box(x + .52, y + .24, .1, .1, 20, 10, '#8a5a44');
    for (const [a, c] of [[.82, .35], [.88, .55], [.8, .72]]) { const q = P(x + a, y + c); ctx.fillStyle = '#9c6a3a'; ctx.strokeStyle = OUT; ctx.lineWidth = lw() * .6; ctx.beginPath(); ctx.ellipse(q.x, q.y - 4 * s, 3.4 * s, 4.4 * s, 0, 0, 7); ctx.fill(); ctx.stroke(); line({ x: q.x - 3 * s, y: q.y - 4 * s }, { x: q.x + 3 * s, y: q.y - 4 * s }, '#4a3a2e', .6); }
    const sp = P(x + .57, y + .29, 32); ctx.fillStyle = '#ffffff55'; for (let i = 0; i < 3; i++) { const u = (T * .35 + i * .33 + v) % 1; ctx.beginPath(); ctx.arc(sp.x + Math.sin(u * 5) * 3 * s, sp.y - u * 18 * s, (1.8 + u * 3) * s, 0, 7); ctx.fill(); }
  }
  if (pop < 1) ctx.restore();
  if (B[k] && B[k].job && !b.on && !b.building) { const p = P(x + .5, y + .5, 34 + Math.sin(T * 4) * 2); ctx.font = `${13 * s}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('💤', p.x, p.y); }
}

// ---- địa hình: đồi, mạch quặng ------------------------------------------------------
function mound(x, y, v) {
  const p = P(x + .5, y + .5);
  ctx.fillStyle = 'rgba(30,50,25,.14)'; ctx.beginPath(); ctx.ellipse(p.x + 4 * s, p.y + 1 * s, 28 * s, 11 * s, 0, 0, 7); ctx.fill();
  const g = ctx.createRadialGradient(p.x - 8 * s, p.y - 16 * s, 2 * s, p.x, p.y - 6 * s, 30 * s); g.addColorStop(0, '#b8ca8a'); g.addColorStop(.6, '#8fa56d'); g.addColorStop(1, '#617f56');
  ctx.beginPath(); ctx.moveTo(p.x - 30 * s, p.y); ctx.bezierCurveTo(p.x - 22 * s, p.y - (18 + v * 8) * s, p.x + 22 * s, p.y - (20 + v * 6) * s, p.x + 30 * s, p.y); ctx.quadraticCurveTo(p.x, p.y + 10 * s, p.x - 30 * s, p.y); ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = '#4f6d44'; ctx.lineWidth = lw() * .6; ctx.stroke();
  for (let i = 0; i < 6; i++) line({ x: p.x - 14 * s + i * 5.5 * s, y: p.y - (7 + (i % 3) * 3) * s }, { x: p.x - 13 * s + i * 5.5 * s, y: p.y - (10 + (i % 3) * 3) * s }, '#5f8a48', .8);
}
function ore(x, y, v) {
  quad(x+.04, y+.04, .92, .92, 0, '#74817866', null);
  boulder(x + .4, y + .42, .42, 15 + v * 14, v * 50, '#65747a'); boulder(x + .72, y + .7, .26, 8 + v * 6, v * 70, '#4d5c66'); if (v > .4) boulder(x + .2, y + .76, .18, 6, v * 90, '#82908a');
  const p = P(x + .5, y + .55, 8);
  for (let i = 0; i < 4; i++) { const q={x:p.x+(i-2)*4.5*s,y:p.y+(i%2)*3*s-(i%3)*2*s}; line(q,{x:q.x+2*s,y:q.y-3*s},i%2?'#c29c73':'#a7c4c7',1.5); }
}
// các ô đặt được của công trình cần địa hình riêng (mỏ sắt, mỏ đá, trại gỗ, ruộng muối, vườn trà): tính một lần mỗi khi đổi công cụ/số công trình
let hlKey = '', hlList = [];
function placeableTiles() {
  const d = G.tool && B[G.tool]; if (!d || !d.need || d.need === 'road' || d.need === 'h' && false) return [];
  const key = G.tool + '|' + G.bl.length + '|' + G.seatNo + '|' + G.seatId; if (key === hlKey) return hlList;
  hlKey = key; hlList = LT.placeableTiles(G, G.tool); return hlList;
}

// ---- vòng vẽ chính ------------------------------------------------------------
function draw() {
  if (!G) return;
  const tD0 = performance.now(); frameNo++;
  if (s !== lastS) { lastS = s; zoomT = performance.now(); }
  ZM = performance.now() - zoomT < 240; PERF.moving = Math.abs(ox - lastOx) + Math.abs(oy - lastOy) > .5; lastOx = ox; lastOy = oy;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.globalCompositeOperation = 'source-over'; GLOW = [];
  { const ph = (T / 150 + .1) % 1, sm = (a, b, v) => { const u = Math.max(0, Math.min(1, (v - a) / (b - a))); return u * u * (3 - 2 * u); };
    NIGHT = ph < .8 ? sm(.58, .68, ph) : 1 - sm(.92, 1, ph); DUSK = Math.max(0, 1 - Math.abs(NIGHT - .5) * 2); }
  ctx.clearRect(0, 0, W, H);
  drawChunksGround(); drawWaterHighlights(); drawClouds(); drawGridOverlay(); drawLayerOverlay(); drawBuildingFocus();
  if (G.tool && !ZM) { const pl = placeableTiles(), tp = .22 + .12 * Math.sin(performance.now() / 300); for (const t of pl) { const p = P(t.x + .5, t.y + .5); if (p.x < -60 || p.y < -60 || p.x > W + 60 || p.y > H + 60) continue; quad(t.x, t.y, 1, 1, 0, 'rgba(255,230,120,' + tp.toFixed(2) + ')', 'rgba(255,240,170,.55)', 1); } }
  if (hover && G.tool) {
    const err = LT.canPlace(G, G.tool, hover.x, hover.y), ok = !err;
    quad(hover.x, hover.y, 1, 1, 0, ok ? '#ffffff77' : '#d9534a77', ok ? '#fff' : '#8e2f2a', 1.6);
    const d = B[G.tool];
    if (d && d.need && d.need.length === 1) for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) { const q = tile(hover.x + i, hover.y + j); if (q && q.t === d.need) quad(hover.x + i, hover.y + j, 1, 1, 0, '#ffe08a44', null); }
    if (d && d.need === 'w3') for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) { const q = tile(hover.x + i, hover.y + j); if (q && q.t === 'w') quad(hover.x + i, hover.y + j, 1, 1, 0, '#8fd4ffaa', null); }
    if (G.tool === 'canal') for (const o of G.bl) if (o.k === 'farm') quad(o.x, o.y, 1, 1, 0, Math.hypot(o.x - hover.x, o.y - hover.y) <= 3.2 ? '#8fd4ff66' : null, null);
    if (G.tool === 'well' || G.tool === 'watch' || G.tool === 'clinic' || G.tool === 'market') { const r = { well: 6, watch: 7, clinic: 9, market: 10 }[G.tool]; for (const b of G.bl) if (b.k === 'house') quad(b.x, b.y, 1, 1, 0, Math.max(Math.abs(b.x - hover.x), Math.abs(b.y - hover.y)) <= r ? '#9be08a77' : null, null); }
    if (G.tool === 'granary' && G.roadDist) { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (G.roadDist[y * N + x] >= 0 && G.roadDist[y * N + x] <= LT.KHO_BAN_KINH) quad(x, y, 1, 1, 0, '#ffe08a33', null); }
  }
  if (UI.area && G.tool) { const A = UI.area, x0 = Math.min(A.x0, A.x1), x1 = Math.max(A.x0, A.x1), y0 = Math.min(A.y0, A.y1), y1 = Math.max(A.y0, A.y1); let cnt = 0, okN = 0; for (let yy = y0; yy <= y1 && cnt < 900; yy++) for (let xx = x0; xx <= x1 && cnt < 900; xx++) { cnt++; const e = LT.canPlace(G, G.tool, xx, yy); if (!e) okN++; quad(xx, yy, 1, 1, 0, e ? '#d9534a55' : '#9be08a88', null); } A.cnt = cnt; A.ok = okN; }
  if (G.fireFlash) { const f = G.fireFlash; FL.push({ x: f.x + .5, y: f.y + .5, txt: '🔥', t: 0 }); G.fireFlash = null; }
  drawChunksObjects();
  for (let i = 0; GFX.atmos && i < 5; i++) { const u = ((T * .05 + i * .21) % 1), p = P(-4 + u * 34 + i * 2, i * 6 - 2 + Math.sin(u * 9 + i) * 2, 95 + i * 8), f = Math.sin(T * 8 + i * 2) * 3 * s; if (NIGHT > .7) break; ctx.strokeStyle = '#3a3f44'; ctx.lineWidth = lw() * 1.1; ctx.beginPath(); ctx.moveTo(p.x - 5 * s, p.y + f); ctx.quadraticCurveTo(p.x - 2 * s, p.y - 2 * s, p.x, p.y); ctx.quadraticCurveTo(p.x + 2 * s, p.y - 2 * s, p.x + 5 * s, p.y + f); ctx.stroke(); }
  if (NIGHT > .01) {
    ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = lerpC(lerpC('#ffffff', '#ffc48a', DUSK * .8), '#6a78ae', NIGHT * .66); ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter'; for (const g2 of GLOW) { const gr = ctx.createRadialGradient(g2[0], g2[1], 0, g2[0], g2[1], g2[2]); gr.addColorStop(0, `rgba(${g2[3]},${.42 * NIGHT})`); gr.addColorStop(1, `rgba(${g2[3]},0)`); ctx.fillStyle = gr; ctx.fillRect(g2[0] - g2[2], g2[1] - g2[2], g2[2] * 2, g2[2] * 2); }
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.textAlign = 'center';
  for (const f of FL) { if (f.dust) { const p = P(f.x + Math.cos(f.a) * f.t * .7, f.y + Math.sin(f.a) * f.t * .7, f.t * 10); ctx.globalAlpha = Math.max(0, .5 - f.t * .6); dot(p, (3 + f.t * 8) * s, '#d9cba8'); continue; } const p = P(f.x, f.y, 20 + f.t * 40); ctx.globalAlpha = Math.max(0, 1 - f.t / 1.4); ctx.font = `${18 * s}px sans-serif`; ctx.fillText(f.txt, p.x, p.y); }
  ctx.globalAlpha = 1;
  if (G.raid) { ctx.fillStyle = `rgba(142,47,42,${.05 + .035 * Math.sin(T * 5)})`; ctx.fillRect(0, 0, W, H); }
  drawAtmosphere();
  LASTDRAW = performance.now() - tD0;
}

// ---- bản đồ nhỏ (lớp địa hình vẽ một lần, công trình vẽ lại mỗi 0,3 giây) ----
const mini = document.getElementById('minimap'), mc = mini.getContext('2d');
const MPX = 1.45 * 96 / LT.N, MPY = .87 * 96 / LT.N;
const MP = (x, y) => ({ x: 154 + (x - y) * MPX, y: 8 + (x + y) * MPY });
let miniBase = null, miniKey = '';
function miniPoly(c, p, w) { c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x + w, p.y + w * .6); c.lineTo(p.x, p.y + w * 1.2); c.lineTo(p.x - w, p.y + w * .6); c.fill(); }
function drawMini() {
  if (!G) return;
  const key = G.nation + ':' + (G.seatNo || 0) + ':' + G.hx;
  if (!miniBase || miniKey !== key) {
    miniBase = document.createElement('canvas'); miniBase.width = 308; miniBase.height = 208; const c = miniBase.getContext('2d'); miniKey = key;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const q = tile(x, y); c.fillStyle = q.t === 'w' ? '#5aa0ac' : q.t === 'f' ? '#3d6250' : q.t === 'r' ? '#8e9380' : q.t === 'h' ? '#98ad6d' : q.t === 'm' ? '#9a6f58' : '#7c9367'; miniPoly(c, MP(x, y), 1.6); }
  }
  mc.clearRect(0, 0, 308, 208); mc.drawImage(miniBase, 0, 0);
  for (const b of G.bl) { mc.fillStyle = b.k === 'hall' ? '#f3d98e' : isRoad(b) ? '#d6c48f' : b.k === 'farm' ? '#e0cc6a' : (b.k === 'wall' || b.k === 'tower' || b.k === 'gate') ? '#c7c7ba' : '#e2a46c'; miniPoly(mc, MP(b.x, b.y), b.k === 'hall' ? 3 : isRoad(b) ? 1.2 : 1.7); }
  if (G.raid) { const hp = MP(G.hx, G.hy); mc.fillStyle = '#ff5a4a'; mc.beginPath(); mc.arc(hp.x, hp.y + 4, 4 + 2 * Math.sin(T * 6), 0, 7); mc.fill(); }
  mc.strokeStyle = '#fae3ad'; mc.lineWidth = 1.4; mc.beginPath();
  [[0, 0], [W, 0], [W, H], [0, H]].forEach(([x, y], i) => { const a = (x - ox) / (TW / 2 * s), b = (y - oy) / (TH / 2 * s), p = MP((a + b) / 2, (b - a) / 2); i ? mc.lineTo(p.x, p.y) : mc.moveTo(p.x, p.y); }); mc.closePath(); mc.stroke();
}
let lastS = 0, zoomT = 0, frameNo = 0, lastOx = 0, lastOy = 0, LASTDRAW = 0;
const LOWC = { house: '#e2d2ae', terrace: '#e8dcc2', mansion: '#e6d9bd', farm: '#b9c76a', wall: '#9d998e', tower: '#9d998e', gate: '#a63a2a', temple: '#a63a2a', school: '#f2ede0', market: '#c9a36a', barracks: '#a9a498', granary: '#c9a36a' };
function lowBuilding(b) {
  const h = { hall: 40, tower: 40, temple: 34, mansion: 30, terrace: 22, wall: 14, house: 14 }[b.k] || 14, w = b.w || 1;
  if (b.k === 'farm' || b.k === 'tea' || b.k === 'mulberry' || b.k === 'salt' || b.k === 'canal') { quad(b.x + .06, b.y + .06, .88, .88, 0, LOWC.farm, null); return; }
  box(b.x + .14, b.y + .14, w - .28, w - .28, 0, h, LOWC[b.k] || '#d6a46c');
}

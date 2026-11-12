'use strict';
// ============================================================================
// VÒNG LẶP CHÍNH, ĐIỀU KHIỂN, KHỞI ĐỘNG VÁN
// ============================================================================
let lastT = performance.now(), hudClock = 0, miniClock = 0, toastClock = 0;
const blocking = () => !G || G.pendingEvent || G.pendingBattle || G.over || (modalOpen() && !UI.dismiss);

function pump() {
  if (!G) return;
  if (modalOpen() && !UI.dismiss) return;
  if (G.over) { showOver(); return; }
  if (G.pendingKhao) { const r = G.pendingKhao; G.pendingKhao = null; showKhao(r); return; }
  if (G.pendingNotice) { showNotice(); return; }
  if (G.pendingPromo) { showPromo(); return; }
  if (G.pendingEvent) { showEvent(); return; }
  if (G.pendingBattle) { showBattlePrep(); return; }
  if (G.victory && !G.victoryShown) { G.victoryShown = true; showVictory(); return; }
}

// ---- dân đi lại trong thành ------------------------------------------------------
function syncWalkers() {
  const tot = LT.totalHo(G), want = Math.max(4, Math.min(34, Math.floor(tot / 7))), soldiers = Math.min(8, Math.floor(LT.armyCount(G) / 25));
  const order = ['nong', 'cong', 'thuong', 'si', 'tang', 'quan', 'luu'], total = Math.max(1, order.reduce((a, c) => a + (G.H[c] || 0), 0));
  const cls = []; for (const c of order) { const n = Math.round((G.H[c] || 0) / total * want); for (let i = 0; i < n; i++) cls.push(c); }
  while (cls.length < want) cls.push('luu'); cls.length = want; for (let i = 0; i < soldiers; i++) cls.push('binh');
  while (WALK.length < cls.length) WALK.push(newWalker(WALK.length));
  WALK.length = cls.length; WALK.forEach((w, i) => { w.cls = cls[i]; });
}
function newWalker(i) { return { cls: 'luu', x: G.hx + 2.5 + (i % 3) * .3, y: G.hy + .5 + i * .2, tx: G.hx + 2.5, ty: G.hy + 1.5, ph: i * 1.7 }; }
function stepWalkers(dt) {
  const run = G.speed > 0 && !blocking();
  for (const w of WALK) {
    const dx = w.tx - w.x, dy = w.ty - w.y, d = Math.hypot(dx, dy);
    if (d < .05) {
      let alt = null;
      for (let n = 0; n < 8; n++) {
        const a = Math.random() * 6.28, r = 1 + Math.random() * 3, nx = w.x + Math.cos(a) * r, ny = w.y + Math.sin(a) * r, q = tile(nx | 0, ny | 0);
        if (!q || (q.t !== 'g' && q.t !== 'h') || Math.hypot(nx - G.hx - 1, ny - G.hy - 1) > 15) continue;
        if (q.b && !isRoad(q.b)) continue;
        if (isRoad(q.b)) { alt = [(nx | 0) + .5, (ny | 0) + .5]; break; } if (!alt) alt = [nx, ny];
      }
      if (alt) { w.tx = alt[0]; w.ty = alt[1]; }
    } else { const v = Math.min(d, dt * .8 * (run ? Math.max(1, Math.min(G.speed, 2)) : 0)); w.x += dx / d * v; w.y += dy / d * v; }
  }
}

// ---- một tuần trôi qua -----------------------------------------------------------
function doWeek() {
  const y0 = G.year;
  LT.tickWeek(G);
  syncWalkers();
  if (G.alertFlash) { toast(G.alertFlash.text, 'bad'); G.alertFlash = null; }
  if (G.pendingNews) { toast(G.pendingNews); G.pendingNews = null; }
  if (G.tick % 6 === 0 || G.year !== y0) LT.saveSlot(G, 'auto');
  if (G.year !== y0) toast('Năm ' + G.year + ' bắt đầu.', '');
  ui(); pump();
}
function advanceBuilding(dt) {
  let done = false;
  for (const b of G.bl) {
    if (!b.building) continue;
    b.progress = Math.min(1, b.progress + dt / (b.duration || 12));
    if (b.progress >= 1) { b.building = false; b.born = T; done = true; float(b.x + .5, b.y + .5, '✓'); for (let i = 0; i < 5; i++) FL.push({ x: b.x + .5, y: b.y + .5, t: 0, dust: 1, a: i * 1.3 }); }
  }
  if (done) { LT.recalcCity(G); paintTiles(); ui(); }
}
function step(dt) {
  T += dt;
  if (!G) return;
  if (!(modalOpen() && !UI.dismiss)) pump();
  if (!(modalOpen() && !UI.dismiss) && !G.pendingEvent && !G.pendingBattle) UI.lastSpeed = G.speed;
  stepWalkers(dt);
  for (const f of FL) f.t += dt; FL = FL.filter(f => f.t < 1.4);
  const run = G.speed > 0 && !blocking();
  if (run) {
    advanceBuilding(dt * G.speed);
    updateTraffic(dt * G.speed);
    G.acc += dt * G.speed; let n = 0;
    while (G.acc >= LT.WEEK_SECONDS && n++ < 4) { G.acc -= LT.WEEK_SECONDS; doWeek(); if (blocking()) { G.acc = 0; break; } }
  }
  hudClock += dt; if (hudClock > .35) { hudClock = 0; if (!document.hidden) { updateTop(); updateResbar(); updateStats(); updateGoal(); updateAlerts(); refreshBuild(); } }
  miniClock += dt; if (miniClock > .3) { miniClock = 0; drawMini(); }
}
function frame(now) {
  const dt = Math.min(.1, (now - lastT) / 1000); lastT = now; requestAnimationFrame(frame);
  const t0 = performance.now();
  step(dt); keyPan(dt); zoomStep(dt); draw();
  perfFrame(now, performance.now() - t0, LASTDRAW);
}
function layoutResize() {
  DPR = Math.min(2, window.devicePixelRatio || 1);
  if (W) { ox += (innerWidth - W) / 2; oy += (innerHeight - H) / 2; }
  W = innerWidth; H = innerHeight; cv.width = W * DPR; cv.height = H * DPR;
}
addEventListener('resize', layoutResize);
function centerHall() { if (!G) return; const p = P(G.hx + 1, G.hy + 1); ox += W / 2 + 40 - p.x; oy += H * .44 - p.y; }
function goNearest() {
  if (!G || !G.tool) return; const list = LT.placeableTiles(G, G.tool);
  if (!list.length) { toast('Bản đồ này không còn ô nào đặt được ' + B[G.tool].n + (G.tool === 'mine' ? ' — hãy mua quặng ở chợ hoặc dời trị sở' : ''), 'bad'); return; }
  const c = toTile(W / 2, H / 2); let best = list[0], bd = 1e9; for (const t of list) { const d = Math.hypot(t.x - c.x, t.y - c.y); if (d < bd) { bd = d; best = t; } }
  if (bd < 4) { const o = list.filter(t => Math.hypot(t.x - c.x, t.y - c.y) >= 4); if (o.length) best = o.reduce((a, t) => Math.hypot(t.x - c.x, t.y - c.y) < Math.hypot(a.x - c.x, a.y - c.y) ? t : a, o[0]); }
  const p = P(best.x + .5, best.y + .5); ox += W / 2 - p.x; oy += H * .44 - p.y; hover = null; toast('Đã đưa khung nhìn tới ô đặt được gần nhất (' + list.length + ' ô trên bản đồ)', 'good');
}
// zoom mượt: lệnh zoom chỉ đặt mức đích; mỗi khung tiến dần tới đích quanh vị trí con trỏ
let zT = null;
function zoom(f, cx, cy) { const base = zT ? zT.s : s; zT = { s: Math.max(.28, Math.min(2.6, base * f)), cx, cy }; }
function zoomStep(dt) {
  if (!zT) return; const d = zT.s - s;
  const ns = Math.abs(d) < .0008 * s ? zT.s : s + d * (1 - Math.exp(-dt * 13)), cx = zT.cx, cy = zT.cy; if (ns === zT.s) zT = null;
  const f = ns / s; ox = cx - (cx - ox) * f; oy = cy - (cy - oy) * f; s = ns; $('zoom-label').textContent = Math.round(s * 100) + '%';
}
function zoomNow(f, cx, cy) { const ns = Math.max(.28, Math.min(2.6, s * f)); f = ns / s; ox = cx - (cx - ox) * f; oy = cy - (cy - oy) * f; s = ns; $('zoom-label').textContent = Math.round(s * 100) + '%'; }

// ---- điều khiển ----------------------------------------------------------------------
const toTile = (sx, sy) => { const a = (sx - ox) / (TW / 2 * s), b = (sy - oy) / (TH / 2 * s); return { x: Math.floor((a + b) / 2), y: Math.floor((b - a) / 2) }; };
const pts = new Map(); let moved = 0, pinch = 0, paint = null;
function tryPlace(k, x, y, quiet) {
  const r = LT.place(G, k, x, y);
  if (!r.ok) { if (!quiet) toast(r.err, 'bad'); return false; }
  if (r.del) { float(x + .5, y + .5, '🔨'); hideInspect(); } else { r.b.born = T; }
  paintTiles(); ui(); return true;
}
function finishArea() {
  const A = UI.area; UI.area = null; if (!A || !G || !G.tool) return;
  const x0 = Math.min(A.x0, A.x1), x1 = Math.max(A.x0, A.x1), y0 = Math.min(A.y0, A.y1), y1 = Math.max(A.y0, A.y1), k = G.tool;
  if (x0 === x1 && y0 === y1) { tryPlace(k, x0, y0); return; }
  let okN = 0, bad = 0, first = '';
  for (let y = y0; y <= y1 && okN + bad < 900; y++) for (let x = x0; x <= x1; x++) { const r = LT.place(G, k, x, y); if (r.ok) { r.b.born = T; okN++; } else { bad++; if (!first && r.err.indexOf('Thiếu') === 0) first = r.err; } }
  paintTiles(); ui();
  toast(okN ? 'Đã đặt ' + okN + ' ' + B[k].n.toLowerCase() + (bad ? ' (bỏ qua ' + bad + ' ô không hợp lệ' + (first ? ': ' + first : '') + ')' : '') : (first || 'Không ô nào đặt được trong vùng chọn'), okN ? 'good' : 'bad');
}
function tileInfo(x, y) {
  const q = tile(x, y); if (!q) return '';
  if (q.b) { const d = B[q.b.k] || { n: 'Phủ', i: '🏯' }; return d.i + ' ' + d.n + (q.b.building ? ' — đang thi công ' + Math.floor(q.b.progress * 100) + '%' : B[q.b.k] && B[q.b.k].job ? ' — nhân công ' + q.b.staff + '/' + B[q.b.k].job.n + (q.b.conn ? '' : ' · CHƯA NỐI ĐƯỜNG') : '') + ' (bấm để xem chi tiết)'; }
  const nm = { g: 'Đất bằng', f: 'Rừng (trại gỗ)', r: 'Núi đá (mỏ đá)', w: 'Nước (ruộng muối, mương)', h: 'Đồi (vườn trà)', m: 'Mạch quặng sắt (mỏ sắt)' }[q.t];
  return nm + (q.t === 'g' || q.t === 'h' ? ' · độ phì ×' + f1(q.fert) + (G.roadDist && G.roadDist[y * N + x] >= 0 ? ' · đường cách kho ' + G.roadDist[y * N + x] + ' ô' : '') : '');
}
cv.addEventListener('pointerdown', e => {
  cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pts.size === 1) { moved = 0; if (G && LT.AREA[G.tool]) { const t = toTile(e.clientX, e.clientY); UI.area = { x0: t.x, y0: t.y, x1: t.x, y1: t.y }; paint = 'area'; } else if (G && LT.DRAG[G.tool]) { const t = toTile(e.clientX, e.clientY); paint = t.x + ',' + t.y; tryPlace(G.tool, t.x, t.y); } } else { moved = 99; paint = null; }
  cv.style.cursor = 'grabbing';
});
cv.addEventListener('pointermove', e => {
  hover = toTile(e.clientX, e.clientY);
  if (G && !pts.size) $('tip').textContent = G.tool ? UI.toolTip() + ' — ô này: ' + tileInfo(hover.x, hover.y) : tileInfo(hover.x, hover.y);
  const p = pts.get(e.pointerId); if (!p) return;
  if (pts.size === 1) {
    if (paint === 'area' && UI.area) { UI.area.x1 = hover.x; UI.area.y1 = hover.y; return; }
    if (paint !== null && G && LT.DRAG[G.tool]) { const key = hover.x + ',' + hover.y; if (key !== paint) { paint = key; tryPlace(G.tool, hover.x, hover.y, true); } return; }
    const dx = e.clientX - p.x, dy = e.clientY - p.y; moved += Math.abs(dx) + Math.abs(dy); if (moved > 8) { ox += dx; oy += dy; } p.x = e.clientX; p.y = e.clientY;
  } else { p.x = e.clientX; p.y = e.clientY; const [a, b] = [...pts.values()], d = Math.hypot(a.x - b.x, a.y - b.y); if (pinch) zoom(d / pinch, (a.x + b.x) / 2, (a.y + b.y) / 2); pinch = d; }
});
const upF = e => {
  if (!pts.has(e.pointerId)) return; pts.delete(e.pointerId); pinch = 0; cv.style.cursor = 'grab';
  if (paint === 'area') { finishArea(); paint = null; }
  else if (paint !== null) paint = null;
  else if (moved <= 8 && e.type === 'pointerup' && G) {
    const t = toTile(e.clientX, e.clientY);
    if (G.tool) tryPlace(G.tool, t.x, t.y);
    else { const q = tile(t.x, t.y); if (q && q.b) showInspect(q.b); else hideInspect(); }
  }
  if (e.pointerType !== 'mouse') hover = null;
};
cv.addEventListener('pointerup', upF); cv.addEventListener('pointercancel', upF);
cv.addEventListener('pointerleave', () => { if (!pts.size) { hover = null; if (G && !G.tool) ui(); } });
cv.addEventListener('wheel', e => { e.preventDefault(); const dy = e.deltaY * (e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? 400 : 1); zoom(Math.max(.7, Math.min(1.4, Math.exp(-dy * .0012))), e.clientX, e.clientY); }, { passive: false });
$('zoom-in').onclick = () => zoom(1.18, W / 2, H / 2);
$('zoom-out').onclick = () => zoom(1 / 1.18, W / 2, H / 2);
$('recenter').onclick = centerHall;
$('grid-toggle').onclick = () => { showGrid = !showGrid; $('grid-toggle').classList.toggle('active', showGrid); };
function miniGo(e) { const r = mini.getBoundingClientRect(), mx = (e.clientX - r.left) * 308 / r.width - 154, my = (e.clientY - r.top) * 208 / r.height - 8, x = (mx / MPX + my / MPY) / 2, y = (my / MPY - mx / MPX) / 2; if (x < 0 || y < 0 || x > N || y > N) return; const p = P(x, y); ox += W / 2 - p.x; oy += H / 2 - p.y; }
mini.addEventListener('pointerdown', e => { mini.setPointerCapture(e.pointerId); miniGo(e); });
mini.addEventListener('pointermove', e => { if (e.buttons) miniGo(e); });

$('m-court').onclick = () => G && openCourt();
$('m-army').onclick = () => G && openArmy();
$('m-world').onclick = () => G && openWorld();
$('m-ledger').onclick = () => G && openLedger();
$('m-trade').onclick = () => G && openTrade();
$('m-off').onclick = () => G && openOfficials();
$('m-menu').onclick = () => G && openMenu();
document.querySelectorAll('.spd').forEach(b => { b.onclick = () => { if (!G) return; G.speed = +b.dataset.spd; ui(); }; });
$('b-pause').onclick = () => { if (!G) return; G.speed = G.speed === 0 ? 1 : 0; ui(); };
$('b-step').onclick = () => { if (!G || blocking()) return; G.speed = 0; advanceBuilding(LT.WEEK_SECONDS); updateTraffic(LT.WEEK_SECONDS * .3); doWeek(); };

// ---- WASD / mũi tên: trượt khung nhìn (Shift nhanh hơn); không chạy khi đang gõ chữ; thả phím hoặc mất tiêu điểm thì dừng ----
const KEYS = new Set(), PANK = { KeyW: 'u', ArrowUp: 'u', KeyS: 'd', ArrowDown: 'd', KeyA: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r' };
const typing = t => !!(t && t.matches && t.matches('input,textarea,select,[contenteditable]'));
addEventListener('keydown', e => { if (typing(e.target) || e.ctrlKey || e.metaKey || e.altKey) return; const d = PANK[e.code]; if (d) { KEYS.add(d); if (e.shiftKey) KEYS.add('fast'); else KEYS.delete('fast'); if (G && (!modalOpen() || document.querySelector('#mBox svg.mapsvg'))) e.preventDefault(); } });
addEventListener('keyup', e => { const d = PANK[e.code]; if (d) KEYS.delete(d); if (!e.shiftKey) KEYS.delete('fast'); });
addEventListener('blur', () => KEYS.clear()); document.addEventListener('visibilitychange', () => KEYS.clear());
function keyPan(dt) {
  if (!KEYS.size || !G) return; const dx = (KEYS.has('r') ? 1 : 0) - (KEYS.has('l') ? 1 : 0), dy = (KEYS.has('d') ? 1 : 0) - (KEYS.has('u') ? 1 : 0); if (!dx && !dy) return;
  const n = Math.hypot(dx, dy), fast = KEYS.has('fast') ? 2.4 : 1;
  if (modalOpen()) { const sv = document.querySelector('#mBox svg.mapsvg'); const m = sv && MAPS[sv.id]; if (m && m.pan) { const v = UI.mv[sv.id], sp = .45 * fast / Math.max(1, v.z); m.pan(dx / n * sp * dt, dy / n * sp * dt); } return; }
  const sp = 520 * Math.max(.5, s) * fast; ox -= dx / n * sp * dt; oy -= dy / n * sp * dt; hover = null;
}
addEventListener('keydown', e => {
  if (typing(e.target)) return;
  if (e.key === 'Escape') { if (modalOpen() && UI.dismiss) closeModal(); else if (G) { G.tool = null; hideInspect(); ui(); } return; }
  if (!G || modalOpen()) return;
  const k = e.key.toLowerCase();
  if (k === ' ') { e.preventDefault(); G.speed = G.speed === 0 ? 1 : 0; ui(); }
  else if (k === '1') { G.speed = 1; ui(); } else if (k === '2') { G.speed = 2; ui(); } else if (k === '3') { G.speed = 4; ui(); }
  else if (k === 'h') centerHall(); else if (k === 'g') $('grid-toggle').onclick();
  else if (k === '+' || k === '=') zoom(1.12, W / 2, H / 2); else if (k === '-') zoom(1 / 1.12, W / 2, H / 2);
  else if (k === 't') openCourt(); else if (k === 'q') openArmy(); else if (k === 'e') openWorld(); else if (k === 'l') openLedger(); else if (k === 'b') openTrade(); else if (k === 'v') openOfficials();
});
addEventListener('beforeunload', () => { try { if (G && !G.over) LT.saveSlot(G, 'auto'); } catch (e) { } });

// ---- khởi động ván ---------------------------------------------------------------------
LT.onLog = (t, c) => { if ((c === 'bad' || c === 'good') && performance.now() - toastClock > 900) { toastClock = performance.now(); toast(t, c); } };
function startGame(g, isNew) {
  G = g; G.tool = null; G.cat = G.cat || 0; UI.overShown = false; UI.selB = null; hideInspect();
  traffic.splice(0); WALK.length = 0; FL = []; hover = null;
  G.era = Math.min(3, G.rank);
  paintTiles(); buildBar(); syncWalkers();
  ox = 0; oy = 0; s = 1.05; layoutResize(); ox = 0; oy = 0; centerHall();
  for (let i = 0; i < 6; i++) updateTraffic(3.1); for (let i = 0; i < 160; i++) updateTraffic(.1);
  G.speed = 0; ui(); drawMini();
  $('start').style.display = 'none';
  if (isNew) showIntro(); else pump();
}
function afterRelocate() {
  chunkReset(); hideInspect(); traffic.splice(0); WALK.length = 0; FL = [];
  G.tool = null; G.era = Math.min(3, G.rank); paintTiles(); buildBar(); syncWalkers(); ox = 0; oy = 0; s = 1.05; layoutResize(); ox = 0; oy = 0; centerHall();
  for (let i = 0; i < 6; i++) updateTraffic(3.1); for (let i = 0; i < 120; i++) updateTraffic(.1);
  ui(); drawMini();
}
function showIntro() {
  const n = LT.NATIONS[G.nation];
  openModal('<div style="text-align:center"><div class="kick">NĂM 917 · ' + n.n.toUpperCase() + '</div><h2>Nhậm chức tri huyện</h2></div><p>Thiên hạ chia mười hai nước. Triều đình ' + n.n + ' giao cho <b>' + esc(G.name) + '</b> một huyện thành nhỏ với <b>' + LT.totalHo(G) + ' hộ</b>, mười dãy nhà, bốn khu ruộng và một đô hương binh. ' + LT.NATION_PERKS[G.nation] + '</p>' +
    '<h3>Ba việc đầu tiên</h3><ol style="line-height:1.8;color:#c4d0bd;font-size:13px;margin:4px 0 8px;padding-left:20px"><li>Dựng <b>Trại gỗ</b> (gần rừng) và <b>Mỏ đá</b> (gần núi) rồi <b>đắp đường</b> nối về phủ — gỗ và đá là vốn xây dựng.</li><li>Xây thêm <b>Nhà dân</b> để lưu dân có chỗ ở, rồi <b>Kho lương, Phường thị, Giếng, Trạm tuần</b>.</li><li>Mở <b>📜 Triều chính</b>: chỉnh mức thuế. Cuối năm có <b>khảo khóa</b>; đủ điểm và đỗ Tỉnh thí thì được thăng <b>Thứ sử</b>.</li></ol>' +
    '<p class="hint">Mục tiêu luôn hiện ở khung bên trái. Rê chuột lên mọi con số để biết vì sao nó đổi. Game đang tạm dừng — bấm nút để bắt đầu.</p><div style="text-align:center"><button class="btn" data-act="introGo" style="padding:11px 26px">▶ Bắt đầu (x1)</button> <button class="btn2" data-act="showHelp">📖 Hướng dẫn đầy đủ</button></div>', '', false);
}
ACT.introGo = () => { closeModal(); G.speed = 1; ui(); };

layoutResize();
requestAnimationFrame(frame);
showStart();
window.__LT = { get G() { return G; }, doWeek, openCourt, openArmy, openWorld, openLedger, openMenu, startGame, showStart };

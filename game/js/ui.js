'use strict';
// ============================================================================
// GIAO DIỆN LÕI: cửa sổ, chú giải, thanh tài nguyên, năm chỉ số, mục tiêu, thanh xây dựng, bảng công trình.
// Mọi nút gán .onclick (không có nút chết).
// ============================================================================
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fm = LT.fmtN, f1 = LT.fmt1;
const ACT = {};            // bảng hành động: data-act="tên"
const UI = { dismiss: true, panel: null, tab: {}, selB: null, lastHud: 0 };
const pct = v => Math.round(v * 100) + '%';
const sgn = v => (v >= 0 ? '+' : '−') + f1(Math.abs(v));

function toast(m, c) {
  const e = document.createElement('div'); e.className = 't ' + (c || ''); e.textContent = m;
  const h = $('toast'); h.appendChild(e); while (h.children.length > 3) h.firstChild.remove(); setTimeout(() => e.remove(), 4300);
}
function bindActs(root) {
  root.querySelectorAll('[data-act]').forEach(el => { el.onclick = ev => { const fn = ACT[el.dataset.act]; if (fn) fn(el, ev); else console.warn('Thiếu ACT.' + el.dataset.act); }; });
  root.querySelectorAll('[data-chg]').forEach(el => { el.onchange = ev => { const fn = ACT[el.dataset.chg]; if (fn) fn(el, ev); }; });
  root.querySelectorAll('[data-inp]').forEach(el => { el.oninput = ev => { const fn = ACT[el.dataset.inp]; if (fn) fn(el, ev); }; });
}
function openModal(html, cls, dismiss) {
  const b = $('mBox'); b.className = 'card ' + (cls || ''); b.innerHTML = html; $('modal').style.display = 'flex'; UI.dismiss = dismiss !== false; bindActs(b); b.scrollTop = 0;
}
function setModal(html) { const b = $('mBox'), st = b.scrollTop; b.innerHTML = html; bindActs(b); b.scrollTop = st; }
function modalOpen() { return $('modal').style.display === 'flex'; }
function closeModal() {
  $('modal').style.display = 'none'; UI.panel = null; UI.dismiss = true;
  if (typeof pump === 'function') pump();
  // sau biến cố / trận / khảo khóa: trả lại tốc độ cũ để ván không đứng im
  if (G && !G.over && !modalOpen() && !G.pendingEvent && !G.pendingBattle && G.speed === 0 && UI.lastSpeed > 0) { G.speed = UI.lastSpeed; if (typeof ui === 'function') ui(); }
}
ACT.close = () => closeModal();
$('modal').onclick = e => { if (e.target === $('modal') && UI.dismiss) closeModal(); };

// ---- chú giải rê chuột ----------------------------------------------------------
{
  const tip = $('tooltip');
  document.addEventListener('mouseover', e => {
    const t = e.target.closest && e.target.closest('[data-tip]');
    if (!t) { tip.style.display = 'none'; return; }
    tip.innerHTML = t.dataset.tip; tip.style.display = 'block';
  });
  document.addEventListener('mousemove', e => {
    if (tip.style.display !== 'block') return;
    const w = tip.offsetWidth, h = tip.offsetHeight; let x = e.clientX + 14, y = e.clientY + 16;
    if (x + w > innerWidth - 6) x = e.clientX - w - 12; if (y + h > innerHeight - 6) y = e.clientY - h - 12;
    tip.style.left = Math.max(4, x) + 'px'; tip.style.top = Math.max(4, y) + 'px';
  });
  document.addEventListener('mouseleave', () => { tip.style.display = 'none'; });
  document.addEventListener('click', () => { /* giữ chú giải khi bấm nút */ });
}

// ---- sổ dòng chảy: chú giải "vì sao con số này đổi" -------------------------------------
function flowRows(res, src) {
  const f = (src || G.flow.last)[res] || {}; return Object.keys(f).map(k => [k, f[k]]).filter(r => Math.abs(r[1]) > .005).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
}
function flowNet(res, src) { return flowRows(res, src).reduce((a, r) => a + r[1], 0); }
function flowTip(res, title, extra) {
  const rows = flowRows(res).slice(0, 7);
  let h = '<b>' + title + '</b>' + (extra ? '<br>' + extra : '') + '<br><span class="mut">Tuần vừa rồi:</span>';
  if (!rows.length) h += '<br>(chưa có biến động)';
  for (const r of rows) h += '<div class="tl"><span>' + esc(r[0]) + '</span><b class="' + (r[1] >= 0 ? 'pos' : 'neg') + '">' + sgn(r[1]) + '</b></div>';
  return h + '<span class="mut">Chi tiết đầy đủ: nút 📒 Sổ sách</span>';
}

// ---- thanh tài nguyên -------------------------------------------------------------
function chip(icon, val, extra, tip, cls) { return '<div class="chip ' + (cls || '') + '" data-tip="' + esc(tip) + '"><span>' + icon + '</span><b>' + val + '</b>' + (extra || '') + '</div>'; }
function dlt(v, unit) { if (Math.abs(v) < .05) return ''; return '<span class="d ' + (v > 0 ? 'up' : 'dn') + '">' + (v > 0 ? '▲' : '▼') + f1(Math.abs(v)) + '</span>'; }
function updateResbar() {
  const r = G.res, tot = LT.totalHo(G), army = LT.armyCount(G), cap = LT.armyCap(G);
  const dTien = flowNet('tien'), dL = flowNet('luong'), dD = flowNet('dluong');
  const fw = LT.foodWeeks(G);
  let h = '';
  h += chip('🪙', fm(r.tien), dlt(dTien), flowTip('tien', 'Ngân khố (quan)', 'Phải nộp kỳ tới (thượng cung + lưu sứ): ≈ ' + fm(G.pend.tien * (LT.SPLIT[G.rank][0] + LT.SPLIT[G.rank][1])) + ' quan.'), r.tien < 25 ? 'warn' : '');
  h += chip('🌾', fm(r.luong) + '<small>+' + fm(G.dan.luong) + ' dân</small>', dlt(dL + dD), '<b>Lương</b><br>Kho quan: ' + fm(r.luong) + ' thạch · Kho dân: ' + fm(G.dan.luong) + ' thạch.<br>Đủ ăn khoảng <b>' + (fw > 90 ? '90+' : Math.round(fw)) + ' tuần</b> (nên giữ ≥ ' + LT.KHO_NEN + ').<br><span class="mut">Dân ăn từ kho dân; quân và thuộc lại ăn từ kho quan.</span>' + flowTip('luong', 'Kho quan').replace('<b>Kho quan</b>', '<br><b>Kho quan</b>'), fw < 10 ? 'warn' : '');
  h += chip('🪵', fm(r.go), dlt(flowNet('go')), flowTip('go', 'Gỗ'));
  h += chip('🪨', fm(r.da), dlt(flowNet('da')), flowTip('da', 'Đá'));
  h += chip('⛏️', fm(r.quang), dlt(flowNet('quang')), flowTip('quang', 'Quặng sắt') + '<br>Lò rèn: quặng + gỗ → nông cụ hoặc binh khí');
  h += chip('👥', tot + '<small>/' + G.city.cap + ' hộ</small>', '', '<b>Hộ khẩu</b> (1 hộ ≈ 5 khẩu)<br>Chỗ ở: ' + G.city.houses + ' khu nhà → ' + LT.fmtN(G.city.capRaw) + ' hộ; trần theo cấp thành ' + LT.CITY_LEVELS[G.seatLvl].n + ' = ' + LT.fmtN(LT.CITY_LEVELS[G.seatLvl].cap) + '<br>' + LT.CLASS_IDS.filter(c => G.H[c] > 0).map(c => LT.CLASSES[c].i + ' ' + LT.CLASSES[c].n + ': ' + G.H[c]).join('<br>'), tot >= G.city.cap ? 'warn' : '');
  if (G.rank >= 2) h += chip('🏯', LT.mineCount(G) + '<small> thành</small>', '', '<b>Thành dưới quyền bạn</b><br>' + LT.mineCount(G) + ' / 120 thành (thống nhất cần 90)<br>' + G.world.cities.filter(c => c.mine).slice(0, 12).map(c => esc(c.n) + ' · ' + LT.fmtN(c.id === G.seatId ? LT.totalHo(G) : c.ho) + ' hộ').join('<br>'));
  h += chip('⚔️', LT.fmtN(army) + '<small>/' + LT.fmtN(cap) + '</small>', '', '<b>Quân</b>: ' + army + ' lính / tối đa ' + cap + ' (' + LT.RANKS[G.rank].n + ')<br>Mỗi lính ăn ' + LT.LINH_AN + ' thạch + lĩnh ' + LT.LINH_LUONG + ' quan mỗi tuần (hương binh chỉ phụ cấp 30%).');
  h += chip('📦', 'Kho', '', goodsTip());
  $('resbar').innerHTML = h;
}
function goodsTip() {
  let h = '<b>Hàng hóa trong kho thành</b>';
  for (const k of LT.GOOD_IDS) { if (k === 'luong' || k === 'go' || k === 'da' || k === 'quang') continue; const g2 = LT.GOODS[k]; h += '<div class="tl"><span>' + g2.i + ' ' + g2.n + '</span><b>' + fm(G.res[k] || 0) + '</b></div>'; }
  h += '<div class="tl"><span>💰 Tiền trong dân</span><b>' + fm(G.wealth) + '</b></div><span class="mut">Sức chứa mỗi loại: ' + LT.capOf(G, 'go') + '</span>';
  return h;
}

// ---- năm chỉ số --------------------------------------------------------------------
function statTip(k) {
  const st = G.stat, tg = st.targets || {}, d = LT.STATS[k];
  let h = '<b>' + d.n + ' · ' + Math.round(st[k]) + '/100</b><br>' + d.d;
  if (tg[k] != null) h += '<br><span class="mut">Đang hướng tới:</span> <b>' + Math.round(tg[k]) + '</b>';
  const c = G.city;
  if (k === 'dantam') h += '<br>Thuế: <b>' + LT.TAX_LEVELS[G.pol.tax].n + '</b> · No đủ: ' + pct(G.sat.luong == null ? 1 : G.sat.luong) + ' · Chùa: ' + LT.count(G, 'temple') + '<br>Dưới 30: dân bỏ trốn · dưới 15: nổi loạn.';
  if (k === 'trian') h += '<br>Trạm tuần/quân doanh phủ ' + pct(c.watchCover) + ' nhà · lính ' + LT.armyCount(G) + '<br>Dưới 35: trộm cướp · dưới 22: cháy lớn.';
  if (k === 'vesinh') h += '<br>Giếng phủ ' + pct(c.wellCover) + ' nhà · y quán phủ ' + pct(c.clinicCover) + '<br>Dưới 40 vào tháng 7–8: dịch bệnh.';
  if (k === 'phonvinh') h += '<br>Chợ phủ ' + pct(c.marketCover) + ' nhà · quan đạo ' + c.paves + ' ô · tiền lưu thông ' + pct(G.moneyRatio || 1) + '<br>Dưới 25: thương nhân bỏ đi.';
  if (k === 'thanhphong') h += '<br>Điểm công trình: ' + Math.round(c.wallPts) + ' → <b>cấp tường ' + Math.floor(st.thanhphong / 25) + '</b> (Thủ quân thủ × ' + f1(1 + .5 * Math.floor(st.thanhphong / 25)) + ').';
  return h;
}
function updateStats() {
  let h = '<div class="kick">Năm chỉ số của thành</div>';
  for (const k of ['dantam', 'trian', 'vesinh', 'phonvinh', 'thanhphong']) {
    const v = Math.round(G.stat[k]), d = LT.STATS[k], cls = v < 30 ? 'low' : v < 50 ? 'mid' : '';
    const tg = G.stat.targets && G.stat.targets[k] != null ? G.stat.targets[k] : v, tr = tg - G.stat[k] > 1.5 ? ' <span class="pos">▲</span>' : tg - G.stat[k] < -1.5 ? ' <span class="neg">▼</span>' : '';
    h += '<div class="srow" data-tip="' + esc(statTip(k)) + '"><span>' + d.i + '</span><span>' + d.n + '</span><span class="bar"><i class="' + cls + '" style="width:' + v + '%"></i></span><b>' + v + tr + '</b></div>';
  }
  $('stats').innerHTML = h;
}

// ---- mục tiêu và hướng dẫn nhập môn ---------------------------------------------------
function tutorialSteps() {
  const c = k => LT.count(G, k), conn = k => G.bl.some(b => b.k === k && !b.building && b.conn);
  return [
    { ok: c('lumber') >= 1 && c('quarry') >= 1 && conn('lumber') && conn('quarry'), t: 'Dựng Trại gỗ (gần rừng) + Mỏ đá (gần núi), đắp đường nối về phủ.' },
    { ok: c('house') >= 13, t: 'Dựng thêm Nhà dân (hộ mới cần chỗ ở, 15 hộ/nhà).' },
    { ok: c('granary') >= 1 && c('market') >= 1, t: 'Dựng Kho lương và Phường thị (kho phục vụ 8 ô theo đường).' },
    { ok: c('well') >= 1 && c('watch') >= 1, t: 'Dựng Giếng và Trạm tuần (vệ sinh, trị an).' },
    { ok: !!G.flags.seenCourt, t: 'Mở 📜 Triều chính: chỉnh thuế, chính sách.' },
    { ok: G.khao.history.length >= 1, t: 'Tháng 12: xem điểm khảo khóa.' },
  ];
}
function nextDeadline() {
  const w = G.week, ev = [[LT.TAX_WEEK_HA, 'Hạ thuế (thu tiền)'], [25, 'Gặt lúa'], [LT.TAX_WEEK_THU, 'Thu thuế thóc'], [LT.KHAO_WEEK, 'Khảo khóa']];
  for (const [wk, n] of ev) if (wk >= w) return n + ' sau ' + (wk - w) + ' tuần';
  return 'Xuân canh sau ' + (LT.WEEKS_YEAR + 1 - w) + ' tuần';
}
function updateGoal() {
  const pr = LT.promotion(G); let h = '<div class="kick">Mục tiêu</div>';
  if (G.over) h += '<h3>Ván đã kết thúc</h3>';
  else if (pr) {
    h += '<h3>🎯 Thăng ' + pr.name + (G.rank >= 4 ? ' · ' + LT.mineCount(G) + '/90 thành để thống nhất' : '') + '</h3><ul>';
    for (const c of pr.conds) h += '<li class="' + (c.ok ? 'ok' : '') + '">' + (c.ok ? '✅' : '⬜') + ' ' + esc(c.t) + '</li>';
    h += '</ul>';
    if (pr.ready) h += '<button class="btn" data-act="goPromo">Đủ điều kiện — ' + (G.rank >= 4 ? 'chọn con đường' : 'xin thăng chức') + '</button>';
    else if (pr.needExam) h += '<button class="btn" data-act="goExam">Dự kỳ Tỉnh thí</button>';
    else h += '<button class="btn2" style="width:100%;margin-top:6px" data-act="openCourtQuanlo">Xem chi tiết quan lộ</button>';
  } else h += '<h3>👑 Hoàng đế — thống nhất thiên hạ</h3><ul><li class="' + (LT.mineCount(G) >= 90 ? 'ok' : '') + '">' + (LT.mineCount(G) >= 90 ? '✅' : '⬜') + ' Giữ 90 / 120 thành (hiện ' + LT.mineCount(G) + ')</li><li class="' + (G.world.cities[G.world.capIds[0]].mine ? 'ok' : '') + '">' + (G.world.cities[G.world.capIds[0]].mine ? '✅' : '⬜') + ' Có kinh đô Trung Nguyên ' + esc(G.world.cities[G.world.capIds[0]].n) + '</li><li>Năm ' + G.year + '/979</li></ul>';
  h += '<div class="kick" style="margin:6px 0 0">⏳ Sắp tới: ' + nextDeadline() + '</div>';
  $('goal').innerHTML = h; bindActs($('goal'));
}
function updateAlerts() {
  const a = LT.alerts(G); let h = '<div class="kick">Việc cần chú ý</div>';
  const todo = tutorialSteps().filter(x => !x.ok);
  if (todo.length) for (const x of todo.slice(0, 2)) h += '<div class="alert l0"><span>💡</span><span>' + esc(x.t) + '</span></div>';
  if (G.raid) h += '<div class="alert l2">⚔️ ' + esc(G.raid.name) + ' (~' + G.raid.total + ' quân) đến sau ' + G.raid.t + ' tuần! Chuẩn bị ở Quân vụ.</div>';
  if (!a.length && !G.raid) h += '<div class="alert ok">✔ Thành đang yên ổn.</div>';
  a.sort((x, y) => y.l - x.l); for (const x of a.slice(0, 3)) h += '<div class="alert l' + x.l + '"><span>' + (x.l === 2 ? '🔴' : x.l === 1 ? '🟡' : '⚪') + '</span><span>' + esc(x.t) + '</span></div>';
  $('alerts').innerHTML = h;
}

function seasonName() {
  const m = LT.month(G.week);
  return m <= 2 ? 'Xuân canh — cấy lúa' : m <= 5 ? 'Mùa xây dựng' : m === 6 ? 'Hạ thuế (thu tiền)' : m <= 8 ? 'Mùa lũ, dịch bệnh' : m === 9 ? 'Thu hoạch' : m === 10 ? 'Mùa khô' : m === 11 ? 'Thu thuế (thóc)' : 'Khảo khóa';
}
function updateTop() {
  $('rankline').textContent = LT.natName(G, G.nation) + ' · ' + LT.RANKS[G.rank].n + ' ' + G.name;
  $('dateline').textContent = 'Năm ' + G.year + ' · Tháng ' + LT.month(G.week);
  $('seasonline').textContent = LT.TUAN[(G.week - 1) % 3] + ' · ' + seasonName();
  document.querySelectorAll('.spd').forEach(b => b.classList.toggle('on', G.speed === +b.dataset.spd));
  $('b-pause').classList.toggle('on', G.speed === 0); $('b-pause').textContent = G.speed === 0 ? '▶' : '⏸';
  $('zoom-label').textContent = Math.round(s * 100) + '%';
}
function ui() {
  if (!G) return;
  updateTop(); updateResbar(); updateStats(); updateGoal(); updateAlerts(); refreshBuild();
  UI.toolTip = () => G.tool ? B[G.tool].n + ': ' + B[G.tool].d + (LT.DRAG[G.tool] ? ' (kéo chuột để làm liền)' : '') + (B[G.tool].need && B[G.tool].need !== 'road' ? ' · Các ô vàng sáng là chỗ đặt được' : '') + ' · Esc để bỏ chọn' : '';
  { let gb = $('goNear'); if (!gb) { gb = document.createElement('button'); gb.id = 'goNear'; gb.className = 'tab'; gb.textContent = '📍 Tới chỗ đặt gần nhất'; gb.onclick = () => goNearest(); $('tabs').appendChild(gb); } const need = G.tool && B[G.tool].need && B[G.tool].need !== 'road'; gb.style.display = need ? '' : 'none'; }
  $('tip').textContent = G.tool ? UI.toolTip() : 'Chọn công trình bên dưới rồi bấm lên bản đồ để xây · Kéo chuột hoặc WASD để di chuyển · Lăn chuột để phóng to · Bấm vào công trình để xem chi tiết';
  if (UI.selB) showInspect(UI.selB, true);
}

// ---- thanh xây dựng ----------------------------------------------------------------
function buildTip(k) {
  const d = B[k]; let h = '<b>' + d.i + ' ' + d.n + '</b><br>' + d.d;
  if (d.c && Object.keys(d.c).length) h += '<br><span class="mut">Giá:</span> ' + LT.costTxt(d.c);
  if (d.job) h += '<br><span class="mut">Nhân công:</span> ' + d.job.n + ' hộ ' + LT.CLASSES[d.job.c].n;
  if (d.in) h += '<br><span class="mut">Đầu vào/tuần:</span> ' + LT.costTxt(d.in);
  if (d.out) h += '<br><span class="mut">Đầu ra/tuần:</span> ' + Object.keys(d.out).map(g2 => LT.GOODS[g2].i + d.out[g2]).join(' ');
  if (d.rank && d.rank > G.rank) h += '<br><span class="neg">Cần chức ' + LT.RANKS[d.rank].n + '</span>';
  if (d.job || d.out) h += '<br><span class="mut">Cần nối đường tới kho/chợ trong 8 ô để đủ công suất.</span>';
  return h;
}
function buildBar() {
  const tb = $('tabs'); tb.innerHTML = '';
  LT.CATS.forEach((n, i) => { const e = document.createElement('button'); e.textContent = n; e.className = 'tab' + (G.cat === i ? ' on' : ''); e.onclick = () => { G.cat = i; buildBar(); }; tb.appendChild(e); });
  const h = $('build'); h.innerHTML = '';
  for (const k in B) {
    const d = B[k]; if (k !== 'del' && d.cat !== G.cat) continue; if (k === 'del' && G.cat !== 0 && G.cat !== 4) { }
    const e = document.createElement('button'); e.className = 'b'; e.dataset.k = k; e.dataset.tip = buildTip(k);
    e.innerHTML = '<span class="ic">' + d.i + '</span>' + d.n + '<span class="co">' + LT.costTxt(d.c) + '</span>';
    e.onclick = () => { if (d.rank && d.rank > G.rank) { toast('Cần chức ' + LT.RANKS[d.rank].n + ' để mở ' + d.n, 'bad'); return; } G.tool = G.tool === k ? null : k; hideInspect(); ui(); };
    h.appendChild(e);
  }
  refreshBuild();
}
function refreshBuild() {
  document.querySelectorAll('#build .b').forEach(e => { const k = e.dataset.k, d = B[k]; e.className = 'b' + (G.tool === k ? ' on' : '') + (d.rank && d.rank > G.rank ? ' lock' : (d.c && !LT.afford(G, d.c)) ? ' no' : ''); });
}

// ---- bảng công trình (bấm vào công trình) ----------------------------------------------
function estOut(b) {
  const d = B[b.k], m = LT.month(G.week), boss = 1 + G.player.chinh / 400;
  const eff = b.sr * (b.conn ? 1 : LT.NGOAI_BAN_KINH) * b.roadMul * boss; const o = [];
  if (b.k === 'farm') { const y = LT.farmYield(G, b, {}) * (natYieldBase()); o.push('≈ ' + fm(y) + ' thạch/năm'); return o; }
  if (d.out) for (const k in d.out) { let v = d.out[k] * eff; if (k === 'muoi') v *= (m >= 5 && m <= 8) ? .5 : (m >= 10 || m <= 3) ? 1.5 : 1; if (k === 'tra' && (m === 3 || m === 4)) v *= 1.5; o.push(LT.GOODS[k].i + ' ' + f1(v) + '/tuần'); }
  if (b.k === 'forge') o.push(b.mode === 'nongcu' ? '🔧 ' + f1(3 * eff) + ' nông cụ/tuần' : '🗡️ ' + f1(eff) + ' binh khí/tuần');
  if (b.k === 'armory') o.push(b.mode === 'binhkhi' ? '🗡️ ' + f1(2 * eff) + ' binh khí/tuần' : '🛡️ ' + f1(eff) + ' giáp/tuần');
  if (b.k === 'stable') o.push('🐴 ' + f1(.2 * eff * 36) + ' ngựa/năm');
  return o;
}
const natYieldBase = () => { const nm = LT.NATIONS[G.nation].mod; return nm.nam ? 440 : 360; };
function showInspect(b, quiet) {
  UI.selB = b; const d = B[b.k] || { n: 'Phủ', i: '🏯', d: '' }; const el = $('inspect');
  if (b.k === 'hall') { el.innerHTML = '<h4>🏯 Phủ ' + LT.RANKS[G.rank].n + '</h4><div class="mut" style="font-size:11.5px">Trị sở của bạn: kho gốc, nơi các đường nối về. Nhà ở của phủ chứa 20 hộ.</div><div class="acts"><button class="btn2" data-act="inspClose">Đóng</button></div>'; }
  else {
    let h = '<h4>' + d.i + ' ' + d.n + '</h4><div class="mut" style="font-size:11px;margin-bottom:4px">' + d.d + '</div>';
    if (b.building) h += '<div class="row"><span>Đang thi công</span><b>' + Math.floor(b.progress * 100) + '%</b></div>';
    else {
      if (d.job) h += '<div class="row"><span>Nhân công (' + LT.CLASSES[d.job.c].n + ')</span><b class="' + (b.sr >= .99 ? 'pos' : b.sr > 0 ? 'warnc' : 'neg') + '">' + b.staff + '/' + d.job.n + ' hộ</b></div>';
      if (d.job || d.out) {
        h += '<div class="row"><span>Nối đường tới kho/chợ</span><b class="' + (b.conn ? 'pos' : 'neg') + '">' + (b.conn ? 'có (' + (b.roadD >= 0 ? b.roadD + ' ô' : '') + ')' : 'KHÔNG — chỉ 60% công suất') + '</b></div>';
        h += '<div class="row"><span>Sát đường</span><b>' + (b.roadMul > 1.3 ? '×1,35 (quan đạo)' : b.roadMul > 1 ? '×1,2 (đường đất)' : 'không') + '</b></div>';
      }
      if (b.k === 'farm') {
        const q = tile(b.x, b.y);
        h += '<div class="row"><span>Độ phì đất</span><b>×' + f1(q.fert) + '</b></div><div class="row"><span>Thủy lợi (mương ≤3 ô)</span><b class="' + (LT.irrigated(G, b) ? 'pos' : '') + '">' + (LT.irrigated(G, b) ? '×1,3' : 'chưa') + '</b></div>';
        h += '<div class="row"><span>Nông cụ sắt</span><b class="' + (G.toolRatio >= .99 ? 'pos' : 'warnc') + '">' + (G.toolRatio >= .99 ? '×1,2' : '×' + f1(1 + .2 * G.toolRatio) + ' (thiếu)') + '</b></div>';
        h += '<div class="row"><span>Trâu cày</span><b>' + (b.trau ? '×1,15' : 'chưa có') + '</b></div>';
        const ph = (LT.month(G.week) <= 8); h += '<div class="row"><span>Lúa đang tích</span><b>' + fm(b.acc || 0) + ' thạch</b></div>';
      }
      if (d.job) { const o = estOut(b); if (o.length) h += '<div class="row"><span>Sản lượng ước tính</span><b>' + o.join(' · ') + '</b></div>'; }
      if (b.idle) h += '<div class="row"><span>Tình trạng</span><b class="neg">thiếu nguyên liệu</b></div>';
    }
    h += '<div class="acts">';
    if (d.job && !b.building) h += ['Thấp', 'Thường', 'Cao'].map((n, i) => '<button class="btn2 ' + (b.prio === i ? 'on' : '') + '" data-act="prio" data-v="' + i + '" data-tip="Ưu tiên nhân công: khi thiếu hộ, công trình ưu tiên cao được đủ người trước.">' + n + '</button>').join('');
    if (b.k === 'forge' && !b.building) h += '<button class="btn2" data-act="mode" data-tip="Đổi sản phẩm: 3 nông cụ hoặc 1 binh khí mỗi tuần">⚙ ' + (b.mode === 'nongcu' ? 'Đang rèn nông cụ → đổi' : 'Đang rèn binh khí → đổi') + '</button>';
    if (b.k === 'armory' && !b.building) h += '<button class="btn2" data-act="mode" data-tip="Đổi sản phẩm: 2 binh khí hoặc 1 giáp mỗi tuần">⚙ ' + (b.mode === 'binhkhi' ? 'Đang làm binh khí → đổi' : 'Đang làm giáp → đổi') + '</button>';
    if (b.k === 'farm' && !b.building && !b.trau) h += '<button class="btn2" data-act="trau" data-tip="Mua trâu cày: sản lượng ruộng ×1,15 vĩnh viễn">🐂 Mua trâu (25 quan)</button>';
    h += '<button class="btn2" data-act="del" data-tip="Phá dỡ, hoàn lại 50% vật liệu">🔨 Phá dỡ</button><button class="btn2" data-act="inspClose">Đóng</button></div>';
    el.innerHTML = h;
  }
  el.style.display = 'block'; bindActs(el);
}
function hideInspect() { UI.selB = null; $('inspect').style.display = 'none'; }
ACT.inspClose = hideInspect;
ACT.prio = el => { const b = UI.selB; if (!b) return; b.prio = +el.dataset.v; LT.recalcCity(G); ui(); };
ACT.mode = () => { const b = UI.selB; if (!b) return; if (b.k === 'forge') b.mode = b.mode === 'nongcu' ? 'binhkhi' : 'nongcu'; else b.mode = b.mode === 'binhkhi' ? 'giap' : 'binhkhi'; ui(); };
ACT.trau = () => { const b = UI.selB; if (!b) return; if (G.res.tien < 25) { toast('Cần 25 quan để mua trâu', 'bad'); return; } LT.pay(G, { tien: 25 }, 1, 'Mua trâu cày'); G.wealth += 15; b.trau = true; toast('Đã mua trâu cho khu ruộng: sản lượng ×1,15', 'good'); ui(); };
ACT.del = () => { const b = UI.selB; if (!b) return; if (b.k === 'hall') return; const x = b.x, y = b.y, nm = B[b.k].n; LT.place(G, 'del', x, y); float(x + .5, y + .5, '🔨'); hideInspect(); toast('Đã phá ' + nm + ', hoàn 50% vật liệu'); ui(); };

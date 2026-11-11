'use strict';
// ============================================================================
// VÒNG 2 — GIAO DIỆN: bản đồ 120 thành, thành của bạn (bảng số liệu), chiến dịch / vây thành.
// ============================================================================
const NATC = LT.NATIONS;
function cityCol(c) { return c.mine ? '#f2d86a' : (NATC[c.own] ? NATC[c.own].col : '#aaa'); }
// ================= BẢN ĐỒ THU PHÓNG (dùng chung cho bản đồ 120 thành và bản đồ 12 nước) =================
UI.mv = UI.mv || {};
const mvGet = id => UI.mv[id] || (UI.mv[id] = { cx: .5, cy: .5, z: 1 });
function mvBox(id, W0, H0) { const v = mvGet(id), w = W0 / v.z, h = H0 / v.z; return [v.cx * W0 - w / 2, v.cy * H0 - h / 2, w, h]; }
function zoomMapHTML(id, W0, H0, inner, height) {
  return '<div class="zmap" style="position:relative;height:' + height + 'px"><svg id="' + id + '" class="mapsvg" style="width:100%;height:100%;touch-action:none;cursor:grab" viewBox="' + mvBox(id, W0, H0).map(x => x.toFixed(2)).join(' ') + '" preserveAspectRatio="xMidYMid meet">' + inner + '</svg>' +
    '<div class="zbtns"><button class="btn2" data-act="mapZ" data-id="' + id + '" data-d="1" data-tip="Phóng to (hoặc lăn chuột)">＋</button><button class="btn2" data-act="mapZ" data-id="' + id + '" data-d="-1" data-tip="Thu nhỏ">−</button><button class="btn2" data-act="mapZ" data-id="' + id + '" data-d="0" data-tip="Về toàn cảnh">⌂</button></div><div class="zhint">Lăn chuột: phóng/thu quanh con trỏ · Kéo: di chuyển · Phóng to để thấy tên, cấp, quân đồn trú · ' + Math.round(mvGet(id).z * 100) + '%</div></div>';
}
const MAPS = {};   // id -> {W0,H0,rebuild,pick}
function bindZoomMap(id, W0, H0, rebuild, pick) {
  const svg = document.getElementById(id); if (!svg) return; MAPS[id] = { W0, H0, rebuild, pick };
  const v = mvGet(id); let drag = null, timer = 0;
  const toUser = (cx, cy) => { const p = svg.createSVGPoint(); p.x = cx; p.y = cy; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  const apply = () => { v.z = Math.max(1, Math.min(10, v.z)); v.cx = Math.max(0, Math.min(1, v.cx)); v.cy = Math.max(0, Math.min(1, v.cy)); svg.setAttribute('viewBox', mvBox(id, W0, H0).map(x => x.toFixed(2)).join(' ')); clearTimeout(timer); timer = setTimeout(() => { svg.innerHTML = rebuild(v.z); const h = svg.parentNode.querySelector('.zhint'); if (h) h.textContent = h.textContent.replace(/\d+%$/, Math.round(v.z * 100) + '%'); }, 90); };
  svg.addEventListener('wheel', e => { e.preventDefault(); const f = e.deltaY < 0 ? 1.25 : .8, nz = Math.max(1, Math.min(10, v.z * f)), r = nz / v.z; const [bx, by, bw, bh] = mvBox(id, W0, H0), p = toUser(e.clientX, e.clientY); const nw = bw / r, nh = bh / r, nx = p.x - (p.x - bx) / r, ny = p.y - (p.y - by) / r; v.z = nz; v.cx = (nx + nw / 2) / W0; v.cy = (ny + nh / 2) / H0; apply(); }, { passive: false });
  svg.addEventListener('pointerdown', e => { svg.setPointerCapture(e.pointerId); drag = { x: e.clientX, y: e.clientY, moved: 0, tgt: e.target }; svg.style.cursor = 'grabbing'; });
  svg.addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.moved += Math.abs(dx) + Math.abs(dy); if (drag.moved > 5) { const k = svg.getScreenCTM().a; v.cx -= dx / k / W0; v.cy -= dy / k / H0; drag.x = e.clientX; drag.y = e.clientY; apply(); } });
  const up = e => { if (!drag) return; svg.style.cursor = 'grab'; const was = drag; drag = null; if (was.moved <= 5) { const el = (was.tgt && was.tgt.closest) ? was.tgt.closest('[data-pick]') : null; if (el && pick) pick(+el.dataset.pick); } };
  svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', () => { drag = null; });
}
ACT.mapZ = el => { const id = el.dataset.id, m = MAPS[id], v = mvGet(id), d = +el.dataset.d; if (d === 0) { v.z = 1; v.cx = .5; v.cy = .5; } else v.z = Math.max(1, Math.min(10, v.z * (d > 0 ? 1.4 : .72))); const svg = document.getElementById(id); if (!svg || !m) return; svg.setAttribute('viewBox', mvBox(id, m.W0, m.H0).map(x => x.toFixed(2)).join(' ')); svg.innerHTML = m.rebuild(v.z); const h = svg.parentNode.querySelector('.zhint'); if (h) h.textContent = h.textContent.replace(/\d+%$/, Math.round(v.z * 100) + '%'); };
function bindWorldMaps() {
  if (UI.tab.world === 'thanh') bindZoomMap('cmap', 1000, 640, cityMapInner, id => { UI.citySel = id; renderWorld(); });
  if ((UI.tab.world || 'nuoc') === 'nuoc') bindZoomMap('nmap', 520, 480, natMapInner, id => { UI.natSel = id; renderWorld(); });
}
function cityMapInner(z) {
  const w = G.world, cs = w.cities, sel = UI.citySel != null ? UI.citySel : G.seatId, W0 = 1000, H0 = 640, k = Math.pow(z, .55), fs = 10.5 / Math.pow(z, .62);
  let svg = '';
  for (const c of cs) for (const di of c.adj) if (c.id < di) { const d = cs[di], same = c.own === d.own, line = c.mine && d.mine; svg += '<line x1="' + (c.x * W0).toFixed(1) + '" y1="' + (c.y * H0).toFixed(1) + '" x2="' + (d.x * W0).toFixed(1) + '" y2="' + (d.y * H0).toFixed(1) + '" stroke="' + (line ? '#f2d86acc' : same ? '#7d9a7a77' : '#e0705f' + (z >= 2 ? 'cc' : '88')) + '" stroke-width="' + ((line ? 2.6 : same ? 1.3 : 1.9) / k).toFixed(2) + '"' + (!same && z >= 2 ? ' stroke-dasharray="' + (6 / k).toFixed(1) + ' ' + (3 / k).toFixed(1) + '"' : '') + '/>'; }
  if (z >= 1.6) for (const n of NATC) { const cap = cs.find(c => c.own === n.id && c.capital); if (cap && w.ns[n.id].alive) svg += '<text x="' + (cap.x * W0).toFixed(1) + '" y="' + (cap.y * H0 - 16 / k).toFixed(1) + '" text-anchor="middle" font-size="' + (fs * 1.5).toFixed(1) + '" fill="' + n.col + '" opacity=".55" font-weight="700" style="font-family:Segoe UI,sans-serif;pointer-events:none">' + esc(LT.natName(G, n.id)) + '</text>'; }
  for (const c of cs) {
    const r = [0, 4, 5.8, 8, 11][c.lvl] / k, x = c.x * W0, y = c.y * H0, tgt = G.camp && G.camp.target === c.id, big = c.lvl >= 3 || c.mine || c.id === sel || (z >= 2 && c.lvl >= 2) || z >= 3.5;
    svg += '<g data-pick="' + c.id + '" style="cursor:pointer"><circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (r + 5 / k).toFixed(1) + '" fill="transparent"/><circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + r.toFixed(1) + '" fill="' + cityCol(c) + '" stroke="' + (c.id === sel ? '#fff' : tgt ? '#ff6a4a' : c.mine ? '#fff7c8' : '#10201c') + '" stroke-width="' + ((c.id === sel || tgt ? 3 : c.mine ? 2 : 1) / k).toFixed(2) + '"/>' + (c.id === G.seatId ? '<text x="' + x.toFixed(1) + '" y="' + (y + 4 / k).toFixed(1) + '" text-anchor="middle" font-size="' + (11 / k).toFixed(1) + '" fill="#5a3a00" style="pointer-events:none">★</text>' : '');
    if (big) { svg += '<text x="' + x.toFixed(1) + '" y="' + (y + r + fs * 1.1).toFixed(1) + '" text-anchor="middle" font-size="' + fs.toFixed(1) + '" fill="#eadcb7" style="font-family:Segoe UI,sans-serif;pointer-events:none">' + esc(c.n) + '</text>'; if (z >= 3) svg += '<text x="' + x.toFixed(1) + '" y="' + (y + r + fs * 2.2).toFixed(1) + '" text-anchor="middle" font-size="' + (fs * .85).toFixed(1) + '" fill="#b8c9b5" style="font-family:Segoe UI,sans-serif;pointer-events:none">' + ['', 'huyện', 'châu', 'phủ', 'kinh đô'][c.lvl] + ' · đồn ' + LT.fmtN(c.gar) + ' · ' + LT.fmtN(c.id === G.seatId ? LT.totalHo(G) : c.ho) + ' hộ</text>'; }
    svg += '</g>';
  }
  if (G.camp) { // vị trí đạo quân đang hành quân
    const c = cs[G.camp.target], f0 = cs[G.camp.from], fr = G.camp.phase === 'march' ? clamp01((G.camp.weeks - G.camp.left) / Math.max(1, G.camp.weeks)) : .96;
    const x = (f0.x + (c.x - f0.x) * fr) * W0, y = (f0.y + (c.y - f0.y) * fr) * H0, a = 9 / k;
    svg += '<line x1="' + (f0.x * W0).toFixed(1) + '" y1="' + (f0.y * H0).toFixed(1) + '" x2="' + (c.x * W0).toFixed(1) + '" y2="' + (c.y * H0).toFixed(1) + '" stroke="#ff6a4a" stroke-width="' + (2.6 / k).toFixed(2) + '" stroke-dasharray="' + (8 / k).toFixed(1) + ' ' + (5 / k).toFixed(1) + '" style="pointer-events:none"/><polygon points="' + x.toFixed(1) + ',' + (y - a).toFixed(1) + ' ' + (x - a * .9).toFixed(1) + ',' + (y + a * .8).toFixed(1) + ' ' + (x + a * .9).toFixed(1) + ',' + (y + a * .8).toFixed(1) + '" fill="#ff6a4a" stroke="#fff" stroke-width="' + (1.4 / k).toFixed(2) + '" style="pointer-events:none"/><text x="' + x.toFixed(1) + '" y="' + (y - a - 3 / k).toFixed(1) + '" text-anchor="middle" font-size="' + (fs * 1.1).toFixed(1) + '" fill="#ffd0c0" font-weight="700" style="font-family:Segoe UI,sans-serif;pointer-events:none">Đạo quân ' + LT.fmtN(LT.campArmy(G)) + ' (' + (G.camp.phase === 'march' ? 'hành quân' : 'vây thành') + ')</text>';
  }
  return svg;
}
const clamp01 = v => Math.max(0, Math.min(1, v));
function natMapInner(z) {
  const w = G.world, NT = LT.NATIONS, sel = UI.natSel, k = Math.pow(z, .5), fs = 12 / Math.pow(z, .6); let svg = '';
  for (const a of NT) for (const j of a.adj) if (a.id < j) { const b = NT[j]; svg += '<line x1="' + (a.x * 520).toFixed(1) + '" y1="' + (a.y * 480).toFixed(1) + '" x2="' + (b.x * 520).toFixed(1) + '" y2="' + (b.y * 480).toFixed(1) + '" stroke="#7d9a7a77" stroke-width="' + (2 / k).toFixed(2) + '"/>'; }
  for (const a of NT) {
    const ns = w.ns[a.id], x = a.x * 520, y = a.y * 480, r = (9 + Math.sqrt(ns.cities) * 3.3) / k, rel = w.rel[a.id], ring = a.id === G.nation ? '#f2e08a' : rel >= 30 ? '#8fd47a' : rel >= -10 ? '#e3c25e' : '#e0705f';
    svg += '<g data-pick="' + a.id + '" style="cursor:pointer;opacity:' + (ns.alive ? 1 : .35) + '"><circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + r.toFixed(1) + '" fill="' + a.col + '" stroke="' + ring + '" stroke-width="' + ((a.id === sel ? 5 : 3) / k).toFixed(2) + '"/>' + (a.id === G.nation ? '<text x="' + x.toFixed(1) + '" y="' + (y + 5 / k).toFixed(1) + '" text-anchor="middle" font-size="' + (15 / k).toFixed(1) + '" fill="#fff6c8" style="pointer-events:none">★</text>' : '<text x="' + x.toFixed(1) + '" y="' + (y + 4 / k).toFixed(1) + '" text-anchor="middle" font-size="' + (11 / k).toFixed(1) + '" fill="#fff" font-weight="700" style="pointer-events:none">' + ns.cities + '</text>') + '<text x="' + x.toFixed(1) + '" y="' + (y + r + fs * 1.05).toFixed(1) + '" text-anchor="middle" font-size="' + fs.toFixed(1) + '" fill="#eadcb7" style="font-family:Segoe UI,sans-serif;pointer-events:none">' + esc(LT.natName(G, a.id)) + '</text>' + (z >= 2 ? '<text x="' + x.toFixed(1) + '" y="' + (y + r + fs * 2.1).toFixed(1) + '" text-anchor="middle" font-size="' + (fs * .85).toFixed(1) + '" fill="#b8c9b5" style="font-family:Segoe UI,sans-serif;pointer-events:none">' + ns.cities + ' thành · quân ' + LT.fmtN(ns.troops) + ' · ' + a.chr + '</text>' : '') + '</g>';
  }
  return svg;
}
function worldCityMap() {
  const w = G.world, cs = w.cities, sel = UI.citySel != null ? UI.citySel : G.seatId;
  const svg = zoomMapHTML('cmap', 1000, 640, cityMapInner(mvGet('cmap').z), 560);
  const c = cs[sel], isSeat = c.id === G.seatId, ns = w.ns[c.own];
  let d = '<h3 style="margin-top:0">' + esc(c.n) + ' <span class="tag">' + LT.CITY_LEVELS[isSeat ? G.seatLvl : c.lvl].n + '</span>' + (c.capital ? '<span class="tag y">kinh đô nước</span>' : '') + (c.mine ? '<span class="tag g">của bạn</span>' : '') + '</h3>';
  d += '<div class="hint">Thuộc ' + esc(c.mine ? 'bạn' : LT.natName(G, c.own)) + (isSeat ? ' (trị sở)' : '') + ' · ' + LT.fmtN(isSeat ? LT.totalHo(G) : c.ho) + ' hộ (trần ' + LT.fmtN(LT.CITY_LEVELS[isSeat ? G.seatLvl : c.lvl].cap) + ')</div>';
  d += '<div class="flowrow"><span>Quân đồn trú</span><b>' + LT.fmtN(c.gar) + '</b></div><div class="flowrow"><span>Thành phòng</span><b>' + Math.round(isSeat ? G.stat.thanhphong : c.wall) + ' (cấp tường ' + Math.floor((isSeat ? G.stat.thanhphong : c.wall) / 25) + ')</b></div><div class="flowrow"><span>Dân tâm</span><b>' + Math.round(isSeat ? G.stat.dantam : c.dt) + '</b></div>';
  if (!c.mine) {
    const reason = LT.campAvail(G, c.id), field = LT.natField(G, c.own);
    d += '<div class="flowrow"><span>Tồn lương thành</span><b>' + LT.fmtN(c.grain) + ' thạch</b></div><div class="flowrow"><span>Quân dã chiến nước này / sẽ ra đón</span><b>' + LT.fmtN(field) + ' / ' + LT.fmtN(LT.muster(G, c)) + '</b></div><div class="flowrow"><span>Quân dã chiến của bạn (đã luyện)</span><b>' + LT.fmtN(LT.campArmy(G)) + '</b></div>';
    d += '<div class="hint" style="margin-top:6px">Quan hệ với ' + esc(LT.natName(G, c.own)) + ': <b>' + Math.round(w.rel[c.own] || 0) + '</b></div>';
    d += '<button class="btn ' + (reason ? 'dis' : '') + '" style="margin-top:8px" data-act="campGo" data-id="' + c.id + '">⚔ Xuất quân đánh thành này</button>' + (reason ? '<div class="hint neg">' + esc(reason) + '</div>' : '<div class="hint">Hành quân, tiếp tế, dã chiến rồi vây / công thành / dụ hàng (GP §10.5).</div>');
  } else if (!isSeat) d += '<div class="hint" style="margin-top:6px">Quản lý chi tiết ở tab "Thành của bạn".</div>';
  return '<div class="grid2" style="grid-template-columns:2.1fr 1fr"><div>' + svg + '<div class="hint" style="margin-top:4px">Chấm vàng = thành của bạn · màu khác = các nước · đường đỏ = biên giới · to nhỏ theo cấp thành. Bạn có <b>' + LT.mineCount(G) + '</b> / 120 thành (thống nhất cần 90 gồm kinh đô Trung Nguyên).</div></div><div>' + d + '</div></div>';
}
ACT.selCity = el => { UI.citySel = +el.dataset.id; renderWorld(); };
ACT.campGo = el => { const r = LT.startCampaign(G, +el.dataset.id); toast(r.ok ? 'Đại quân xuất phát (' + r.weeks + ' tuần hành quân)' : r.err, r.ok ? 'good' : 'bad'); if (r.ok) { UI.tab.world = 'chien'; ui(); } renderWorld(); };

function worldMine() {
  const list = LT.ownedCities(G);
  let h = '<p class="hint">Các thành của bạn (ngoài trị sở) chạy bằng bảng số liệu (KT §13): sản lượng = hộ × năng suất × phương châm × (0,6 + Chính quan ÷ 250) × dân tâm ÷ 70. Nộp về = (thu − chi) × tỉ lệ nộp × (1 − 3% mỗi chặng) − tham ô. Quan trấn nhậm ở xa lâu không luân chuyển thì <b>tự chủ</b> tăng: trên 70 nộp thiếu, trên 85 mà trung thành thấp thì ly khai.' + (G.rank >= 4 ? ' Chính lệnh còn <b>' + G.orders.left + '/' + G.orders.max + '</b> tuần này (đổi phương châm, luân chuyển… mỗi việc 1 chính lệnh).' : '') + '</p>';
  if (!list.length) return h + '<p class="mut">Bạn chưa có thành nào ngoài trị sở. Thăng Thứ sử để nhận huyện thuộc quyền, hoặc đánh chiếm thành (tab Chiến dịch).</p>';
  h += '<table class="t2"><tr><th>Thành</th><th class="r">Hộ</th><th class="r">Hộ binh</th><th class="r">Dân tâm</th><th>Quan trấn nhậm</th><th class="r">Tự chủ</th><th>Phương châm</th><th>Nộp</th><th class="r">Nộp gần nhất</th><th>Việc</th></tr>';
  for (const c of list) {
    const m = c.binh / Math.max(1, c.ho + c.binh);
    h += '<tr' + (c.auto > 70 ? ' style="background:#5a2a2433"' : '') + '><td><b>' + esc(c.n) + '</b><span class="tag">' + LT.CITY_LEVELS[c.lvl].n + '</span>' + (c.tan > 0 ? '<span class="tag y">vừa chiếm</span>' : '') + '<div class="hint">' + c.dist + ' chặng · quân đồn ' + LT.fmtN(c.gar) + ' · thành phòng ' + Math.round(c.wall) + '</div></td><td class="r">' + LT.fmtN(c.ho) + '</td><td class="r ' + (m > .1 ? 'warnc' : '') + '" data-tip="' + esc('Hộ có lính tại ngũ: ' + LT.fmtN(c.binh) + ' (' + Math.round(m * 100) + '% dân). Quá nhiều thì sản lượng và dân tâm của thành tụt.') + '">' + LT.fmtN(c.binh) + '</td><td class="r ' + (c.dt < 35 ? 'neg' : '') + '">' + Math.round(c.dt) + '</td><td>Chính ' + c.chinh + ' · Trung ' + c.trung + '<div class="hint">tham ô ' + Math.round(c.tamo * 100) + '%</div></td><td class="r ' + (c.auto > 70 ? 'neg' : c.auto > 50 ? 'warnc' : '') + '">' + Math.round(c.auto) + '</td>';
    h += '<td><select class="sel" data-chg="cityPc" data-id="' + c.id + '">' + Object.keys(LT.PHUONG_CHAM).map(k => '<option value="' + k + '"' + (c.pc === k ? ' selected' : '') + '>' + LT.PHUONG_CHAM[k].n + '</option>').join('') + '</select></td><td><select class="sel" data-chg="cityNop" data-id="' + c.id + '">' + [.4, .6, .8].map(v => '<option value="' + v + '"' + (Math.abs(c.nop - v) < .01 ? ' selected' : '') + '>' + Math.round(v * 100) + '%</option>').join('') + '</select></td><td class="r pos">+' + fm(c.last) + '</td>';
    h += '<td style="white-space:nowrap"><button class="btn2 ' + (c.ship ? 'on' : '') + '" data-act="cityShip" data-id="' + c.id + '" data-tip="Điều lương về trị sở khi kho dân sắp cạn (hao 8% mỗi chặng)">🌾</button> <button class="btn2 ' + (c.giam ? 'on' : '') + '" data-act="cityGiam" data-id="' + c.id + '" data-tip="Giám quân (8 quan/năm): tự chủ tăng chậm hơn một nửa">🕵️</button> <button class="btn2" data-act="cityRot" data-id="' + c.id + '" data-tip="Luân chuyển quan (20 quan): tự chủ −30, đổi người trấn nhậm">🔄</button> <button class="btn2" data-act="cityIns" data-id="' + c.id + '" data-tip="Ngự sử thanh tra (30 quan): giảm tham ô, dân tâm −2">🔍</button> <button class="btn2" data-act="cityRec" data-id="' + c.id + '" data-tip="Mộ lính từ thành này">⚔</button></td></tr>';
  }
  return h + '</table>';
}
ACT.cityPc = el => { const r = LT.cityPolicy(G, +el.dataset.id, 'pc', el.value); if (!r.ok) toast(r.err, 'bad'); renderWorld(); };
ACT.cityNop = el => { const r = LT.cityPolicy(G, +el.dataset.id, 'nop', +el.value); if (!r.ok) toast(r.err, 'bad'); renderWorld(); };
ACT.cityShip = el => { const c = G.world.cities[+el.dataset.id]; c.ship = !c.ship; renderWorld(); };
ACT.cityGiam = el => { const c = G.world.cities[+el.dataset.id]; c.giam = !c.giam; renderWorld(); };
ACT.cityRot = el => { const r = LT.rotateOfficial(G, +el.dataset.id); toast(r.ok ? 'Đã luân chuyển quan, tự chủ −30' : r.err, r.ok ? 'good' : 'bad'); renderWorld(); ui(); };
ACT.cityIns = el => { const r = LT.inspectCity(G, +el.dataset.id); toast(r.ok ? r.text : r.err, r.ok ? 'good' : 'bad'); renderWorld(); ui(); };
ACT.cityRec = el => { UI.recFrom = +el.dataset.id; UI.tab.army = 'quan'; openArmy('quan'); };

function worldCamp() {
  const camp = G.camp; let h = '';
  if (G.rank < 3) return '<p class="hint">Chức ' + LT.RANKS[G.rank].n + ' chưa được xuất quân. Thăng <b>Phòng ngự sứ</b> để đánh chiếm thành của các nước khác. Chọn thành mục tiêu ở tab "Bản đồ thành".</p>';
  const n = LT.campArmy(G);
  h += '<div class="grid3"><div class="box"><b>Quân dã chiến</b><br>' + LT.fmtN(n) + ' lính đã luyện' + (LT.trainingCount(G) ? ' (+ ' + LT.fmtN(LT.trainingCount(G)) + ' tân binh đang luyện)' : '') + '<div class="hint">ăn ' + fm(LT.armyDemandWeek(G)) + ' thạch/tuần; đường dài hao thêm 6% mỗi chặng</div></div><div class="box"><b>Khí giới công thành</b><br>' + LT.fmtN(LT.engines(G)) + ' người<div class="hint">Cần ≥ 30 để phá Thành phòng; mộ "Công thành" ở Quân vụ</div></div><div class="box"><b>Lương</b><br>kho quan ' + fm(G.res.luong) + ' + dân ' + fm(G.dan.luong) + '<div class="hint">Thiếu lương: sĩ khí −15/tuần, lính bỏ trốn</div></div></div>';
  if (!camp) {
    const t = LT.campTargets(G);
    if (t.length) { const lg = LT.logistics(G, t[0].id); h += '<h3>Hậu cần (nếu xuất quân ngay)</h3><div class="box">Quân ăn <b>' + fm(lg.weekly) + '</b> thạch/tuần (đã tính hao đường 6%/chặng). Lương nuôi được: <b class="' + (lg.ok ? 'pos' : lg.okMarch ? 'warnc' : 'neg') + '">' + (lg.weeks > 99 ? '99+' : Math.round(lg.weeks)) + ' tuần</b> — cần ≥ ' + lg.need + ' (hành quân ~' + lg.march + ' + vây thành ~12). ' + (lg.ok ? '✅ Đủ.' : lg.okMarch ? '⚠ Đủ đi tới nơi nhưng thiếu cho cuộc vây — bật 🌾 điều lương ở các thành, hoặc mua thêm lương.' : '⛔ Thiếu cả cho hành quân.') + '<div class="hint">Nguồn: ' + lg.sources.map(x => esc(x.n) + ' ' + LT.fmtN(x.v)).join(' · ') + '</div></div>'; }
    h += '<h3>Thành có thể đánh (giáp thành của bạn)</h3>';
    if (!t.length) h += '<p class="mut">Không có thành địch giáp thành của bạn.</p>';
    else { h += '<table class="t2"><tr><th>Thành</th><th>Nước</th><th class="r">Hộ</th><th class="r">Quân thủ</th><th class="r">Thành phòng</th><th class="r">Quân địch ra đón</th><th class="r">Lương nuôi (tuần)</th><th></th></tr>'; for (const c of t.sort((a, b) => a.gar - b.gar)) { const r = LT.campAvail(G, c.id); h += '<tr><td><b>' + esc(c.n) + '</b><span class="tag">' + LT.CITY_LEVELS[c.lvl].n + '</span></td><td>' + esc(LT.natName(G, c.own)) + '</td><td class="r">' + LT.fmtN(c.ho) + '</td><td class="r">' + LT.fmtN(c.gar) + '</td><td class="r">' + Math.round(c.wall) + '</td><td class="r">' + LT.fmtN(LT.muster(G, c)) + '</td><td class="r">' + (() => { const l = LT.logistics(G, c.id); return '<span class="' + (l.ok ? 'pos' : l.okMarch ? 'warnc' : 'neg') + '">' + (l.weeks > 99 ? '99+' : Math.round(l.weeks)) + '/' + l.need + '</span>'; })() + '</td><td class="r"><button class="btn sm ' + (r ? 'dis' : '') + '" data-act="campGo" data-id="' + c.id + '" ' + (r ? 'data-tip="' + esc(r) + '"' : '') + '>Xuất quân</button></td></tr>'; } h += '</table>'; }
    return h;
  }
  const c = G.world.cities[camp.target];
  h += '<h3>Chiến dịch đánh ' + esc(c.n) + ' (' + esc(LT.natName(G, c.own)) + ')</h3>';
  if (camp.phase === 'march') h += '<div class="box">🚩 Đang hành quân: còn <b>' + Math.ceil(camp.left) + '</b> / ' + camp.weeks + ' tuần.' + bar(camp.weeks - camp.left, camp.weeks, 'y') + '<div class="hint">Quân thiếu lương liền 4 tuần thì chiến dịch tan.</div></div>';
  else if (camp.phase === 'siege') {
    const sg = camp.siege, n2 = LT.campArmy(G);
    h += '<div class="box">🏯 Đang vây tuần thứ <b>' + sg.w + '</b> · lương trong thành còn <b>' + LT.fmtN(Math.max(0, c.grain)) + '</b> thạch (quân thủ ' + LT.fmtN(c.gar) + ') · thành phòng <b>' + Math.round(c.wall) + '</b> · dân tâm trong thành ' + Math.round(c.dt) + '</div>';
    h += '<div class="radio" style="margin-top:8px">' + [['vay', '🔒 Vây (cần quân ≥ 1,8 × quân thủ: ' + LT.fmtN(Math.round(c.gar * 1.8)) + ')'], ['congthanh', '🪜 Phá tường bằng khí giới']].map(m => '<button class="btn2 ' + (sg.mode === m[0] ? 'on' : '') + '" data-act="sgMode" data-v="' + m[0] + '">' + m[1] + '</button>').join('') + '</div>';
    h += '<div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-red" data-act="sgAssault">⚔ Tổng công thành ngay</button><button class="btn2" data-act="sgSurrender" data-tip="Mua chuộc nội ứng: tốn ' + Math.max(60, Math.round(c.ho * .03)) + ' quan, cách 3 tuần mới thử lại; càng dễ nếu dân tâm trong thành thấp">💰 Dụ hàng</button></div>';
    h += '<p class="hint">Vây: thành hết lương thì hàng, nhưng quân bạn cũng tốn lương và có dịch. Công thành: tường thấp thì quân thủ nhân Thủ ít hơn (Thủ × (1 + cấp tường × 0,5)). Dụ hàng: không đổ máu.</p>';
  }
  h += '<div style="margin-top:8px"><button class="btn2" data-act="campRetreat">🏳 Rút quân về</button></div>';
  return h;
}
ACT.sgMode = el => { const r = LT.setSiege(G, el.dataset.v); toast(r.ok ? 'Đã đổi cách đánh' : r.err, r.ok ? '' : 'bad'); renderWorld(); };
ACT.sgAssault = () => { const r = LT.startAssault(G); if (!r.ok) toast(r.err, 'bad'); else { closeModal(); pump(); } };
ACT.sgSurrender = () => { const r = LT.dohang(G); toast(!r.ok ? r.err : r.win ? 'Thành mở cửa hàng!' : 'Dụ hàng thất bại (xác suất ' + Math.round(r.p * 100) + '%)', r.ok && r.win ? 'good' : 'bad'); renderWorld(); ui(); };
ACT.campRetreat = () => { LT.retreatCampaign(G); toast('Đã rút quân'); renderWorld(); ui(); };

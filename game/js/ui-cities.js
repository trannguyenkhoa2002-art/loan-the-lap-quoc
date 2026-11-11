'use strict';
// ============================================================================
// VÒNG 2 — GIAO DIỆN: bản đồ 120 thành, thành của bạn (bảng số liệu), chiến dịch / vây thành.
// ============================================================================
const NATC = LT.NATIONS;
function cityCol(c) { return c.mine ? '#f2d86a' : (NATC[c.own] ? NATC[c.own].col : '#aaa'); }
function worldCityMap() {
  const w = G.world, cs = w.cities, sel = UI.citySel != null ? UI.citySel : G.seatId, W0 = 760, H0 = 540;
  let svg = '<svg class="mapsvg" viewBox="0 0 ' + W0 + ' ' + H0 + '">';
  for (const c of cs) for (const di of c.adj) if (c.id < di) { const d = cs[di], same = c.own === d.own, line = c.mine && d.mine; svg += '<line x1="' + c.x * W0 + '" y1="' + c.y * H0 + '" x2="' + d.x * W0 + '" y2="' + d.y * H0 + '" stroke="' + (line ? '#f2d86a99' : same ? '#7d9a7a66' : '#e0705f66') + '" stroke-width="' + (line ? 2.4 : 1.3) + '"/>'; }
  for (const c of cs) {
    const r = [0, 4, 5.8, 8, 11][c.lvl], x = c.x * W0, y = c.y * H0, tgt = G.camp && G.camp.target === c.id;
    svg += '<g data-act="selCity" data-id="' + c.id + '" style="cursor:pointer"><circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + cityCol(c) + '" stroke="' + (c.id === sel ? '#fff' : tgt ? '#ff6a4a' : c.mine ? '#fff7c8' : '#10201c') + '" stroke-width="' + (c.id === sel || tgt ? 3 : c.mine ? 2 : 1) + '"/>' + (c.id === G.seatId ? '<text x="' + x + '" y="' + (y + 4) + '" text-anchor="middle" font-size="11" fill="#5a3a00">★</text>' : '') + ((c.lvl >= 3 || c.mine || c.id === sel) ? '<text x="' + x + '" y="' + (y + r + 11) + '" text-anchor="middle" font-size="9.5" fill="#eadcb7" style="font-family:Segoe UI,sans-serif">' + esc(c.n) + '</text>' : '') + '</g>';
  }
  svg += '</svg>';
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
  return '<div class="grid2" style="grid-template-columns:1.5fr 1fr"><div>' + svg + '<div class="hint" style="margin-top:4px">Chấm vàng = thành của bạn · màu khác = các nước · đường đỏ = biên giới · to nhỏ theo cấp thành. Bạn có <b>' + LT.mineCount(G) + '</b> / 120 thành (thống nhất cần 90 gồm kinh đô Trung Nguyên).</div></div><div>' + d + '</div></div>';
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
    h += '<h3>Thành có thể đánh (giáp thành của bạn)</h3>';
    if (!t.length) h += '<p class="mut">Không có thành địch giáp thành của bạn.</p>';
    else { h += '<table class="t2"><tr><th>Thành</th><th>Nước</th><th class="r">Hộ</th><th class="r">Quân thủ</th><th class="r">Thành phòng</th><th class="r">Quân địch ra đón</th><th></th></tr>'; for (const c of t.sort((a, b) => a.gar - b.gar)) { const r = LT.campAvail(G, c.id); h += '<tr><td><b>' + esc(c.n) + '</b><span class="tag">' + LT.CITY_LEVELS[c.lvl].n + '</span></td><td>' + esc(LT.natName(G, c.own)) + '</td><td class="r">' + LT.fmtN(c.ho) + '</td><td class="r">' + LT.fmtN(c.gar) + '</td><td class="r">' + Math.round(c.wall) + '</td><td class="r">' + LT.fmtN(LT.muster(G, c)) + '</td><td class="r"><button class="btn sm ' + (r ? 'dis' : '') + '" data-act="campGo" data-id="' + c.id + '" ' + (r ? 'data-tip="' + esc(r) + '"' : '') + '>Xuất quân</button></td></tr>'; } h += '</table>'; }
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

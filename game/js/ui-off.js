// Màn hình Quan viên (phím V): bổ nhiệm vào thành, chức ở trị sở, tuyển người, khảo khóa và kiểm soát.
UI.offSel = UI.offSel != null ? UI.offSel : null;
function openOfficials(tab, cityId) { if (!G) return; UI.panel = 'officials'; if (tab) UI.tab.off = tab; UI.tab.off = UI.tab.off || 'thanh'; if (cityId != null) UI.offSel = cityId; renderOfficials(true); }
ACT.offTab = el => { UI.tab.off = el.dataset.t; renderOfficials(); };
ACT.offGo = el => { openOfficials('thanh', +el.dataset.id); };
const offStats = o => '<span style="white-space:nowrap">' + [['Thống', o.tong], ['Võ', o.vo], ['Trí', o.tri], ['Chính', o.chinh], ['Đức', o.duc]].map(x => '<span class="tag" data-tip="' + x[0] + ' ' + Math.round(x[1]) + '">' + x[0].slice(0, 3) + ' ' + Math.round(x[1]) + '</span>').join('') + '</span>';
const offLiem = o => o.known ? '<span class="' + (o.liem < 40 ? 'neg' : o.liem > 70 ? 'pos' : '') + '">liêm ' + Math.round(o.liem) + '</span>' : '<span class="mut" data-tip="Mức liêm–tham là ẩn: dùng ngự sử thanh tra để lộ ra">liêm ?</span>';
const trK = o => '<span class="' + (o.trung < 40 ? 'neg' : o.trung < 60 ? 'warnc' : 'pos') + '">trung ' + Math.round(o.trung) + '</span> · dã tâm <span class="' + (o.da > 65 ? 'neg' : '') + '">' + Math.round(o.da) + '</span>';
const traitTxt = o => o.trait ? '<span class="tag y" data-tip="' + esc(LT.OFF_TRAITS[o.trait].d) + '">' + LT.OFF_TRAITS[o.trait].n + '</span>' : '';
const postTxt = o => !o.post ? '<span class="mut">chưa có việc</span>' : o.post.t === 'seat' ? LT.SEAT_ROLES[o.post.role].n + ' (trị sở)' : esc(G.world.cities[o.post.id].n);
function trend(c) { const h = c.hist || []; if (h.length < 2) return '<span class="mut">—</span>'; const a = h[h.length - 2], b = h[h.length - 1], ar = (x, y, t) => '<span class="' + (y > x ? 'pos' : y < x ? 'neg' : '') + '" data-tip="' + t + '">' + (y > x ? '▲' : y < x ? '▼' : '■') + '</span>'; return 'dân ' + ar(a.ho, b.ho, 'Hộ ' + a.ho + ' → ' + b.ho) + ' lương ' + ar(a.grain, b.grain, 'Lương ' + a.grain + ' → ' + b.grain) + ' nộp ' + ar(a.last, b.last, 'Nộp ' + a.last + ' → ' + b.last) + ' tâm ' + ar(a.dt, b.dt, 'Dân tâm ' + a.dt + ' → ' + b.dt); }
// ---- tab Giao việc: bốn thẻ chức phụ trách (xây dựng, kinh tế, quân sự, tổng quản) ----
const DGN = (role, path, v, w) => '<input class="inp" type="number" min="0" value="' + v + '" data-chg="dgIn" data-r="' + role + '" data-p="' + path + '" data-t="n" style="width:' + (w || 70) + 'px">';
const DGS = (role, path, cur, opts) => '<select class="sel" data-chg="dgIn" data-r="' + role + '" data-p="' + path + '" data-t="s">' + Object.keys(opts).map(k => '<option value="' + k + '"' + (String(cur) === k ? ' selected' : '') + '>' + esc(opts[k]) + '</option>').join('') + '</select>';
const DGC = (role, path, cur, label) => '<label class="hint" style="margin-right:10px"><input type="checkbox" data-chg="dgIn" data-r="' + role + '" data-p="' + path + '" data-t="b"' + (cur ? ' checked' : '') + '> ' + label + '</label>';
function dgBar(spent, bud) { const p = bud > 0 ? Math.min(100, spent / bud * 100) : 0; return '<div class="bar2 ' + (p > 90 ? 'r' : p > 60 ? 'y' : 'g') + '"><i style="width:' + p + '%"></i></div>'; }
function dgCard(role) {
  const O = LT.off(G), D = LT.dg(G), d = D[role], R = LT.DG_ROLES[role], seat = R.seat, cur = LT.offById(G, O.seat[seat]), eff = LT.dgEff(G, role);
  const idle = O.list.filter(o => !o.post);
  let h = '<div class="box" style="margin:8px 0;' + (d.on ? 'border-color:#8fb86a' : '') + '"><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><b style="font-size:15px">' + R.i + ' ' + LT.SEAT_ROLES[seat].n + '</b>';
  h += '<button class="btn2 ' + (d.on ? 'on' : '') + '" data-act="dgOn" data-r="' + role + '" style="min-width:86px">' + (d.on ? '✅ Đang giao' : '⏸ Đang tắt') + '</button>';
  h += '<span class="hint">' + esc(LT.SEAT_ROLES[seat].d) + '</span></div>';
  h += '<div style="margin:6px 0">Quan: ' + (cur ? '<b>' + esc(cur.name) + '</b> ' + offStats(cur) + ' ' + trK(cur) + ' · năng lực <b>' + Math.round(eff * 100) + '%</b> ' : '<span class="neg">chưa bổ nhiệm</span> ') +
    '<select class="sel" data-chg="dgAppoint" data-r="' + role + '"><option value="">— chọn quan —</option>' + idle.concat(cur ? [cur] : []).map(o => '<option value="' + o.id + '"' + (cur && cur.id === o.id ? ' selected' : '') + '>' + esc(o.name) + ' (chính ' + Math.round(o.chinh) + ', trí ' + Math.round(o.tri) + ', thống ' + Math.round(o.tong) + ')</option>').join('') + '</select>' + (cur ? ' <button class="btn2" data-act="dgFire" data-r="' + role + '">Bỏ chức</button>' : '') + (G.rank < 2 ? ' <span class="neg">(từ chức Thứ sử)</span>' : '') + '</div>';
  const per = d.per === 'nam' ? 'năm' : 'quý';
  h += '<div style="display:flex;gap:14px;flex-wrap:wrap;align-items:flex-start"><div style="min-width:250px"><div class="hint"><b>Ngân sách</b> mỗi ' + DGS(role, 'per', d.per, { quy: 'quý', nam: 'năm' }) + '</div>';
  for (const k in d.budget) h += '<div class="flowrow"><span>' + ({ tien: '🪙 Tiền', go: '🪵 Gỗ', da: '🪨 Đá' })[k] + '</span>' + DGN(role, 'budget.' + k, d.budget[k]) + '<span class="hint">đã chi ' + Math.round(d.spent[k]) + '</span></div>' + dgBar(d.spent[k], d.budget[k]);
  h += '<div class="flowrow"><span class="hint">Quỹ dự phòng: quan không động vào dưới</span>' + DGN(role, 'reserve', d.reserve, 60) + '</div></div><div style="min-width:280px;flex:1">';
  if (role === 'xd') {
    h += '<div class="flowrow"><span>Chính sách</span>' + DGS(role, 'pol', d.pol, LT.DG_POL.xd) + '</div>';
    h += '<div class="flowrow"><span>Chỉ tiêu dân số (hộ, 0 = không)</span>' + DGN(role, 'tg.ho', d.tg.ho) + '</div><div class="flowrow"><span>Chỉ tiêu lương dự trữ (thạch)</span>' + DGN(role, 'tg.luong', d.tg.luong, 80) + '</div>';
    h += '<div class="hint">Đã đặt ' + d.stat.placed + ' công trình, ' + d.stat.roads + ' ô đường' + (d.stat.skim > 0.5 ? ', bị xén ' + Math.round(d.stat.skim) + ' quan' : '') + '. Quan không bao giờ phá công trình của bạn.</div>';
    h += '<div class="hint" style="margin-top:6px"><b>Vùng cấm quan xây</b>: ' + (D.nogo.length ? D.nogo.map((z, i) => '(' + z.x + ',' + z.y + ') ±' + z.r + ' <a href="#" data-act="dgNogoDel" data-i="' + i + '">bỏ</a>').join(' · ') : 'chưa có') + '</div>';
    const sel = UI.selB ? { x: UI.selB.x, y: UI.selB.y } : { x: G.hx + 1, y: G.hy + 1 };
    h += '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap" class="hint">Ô ' + '<input class="inp" id="ngx" type="number" value="' + sel.x + '" style="width:58px"> , <input class="inp" id="ngy" type="number" value="' + sel.y + '" style="width:58px"> bán kính <input class="inp" id="ngr" type="number" value="4" style="width:50px"> <button class="btn2" data-act="dgNogoAdd">🚫 Cấm</button> <button class="btn" data-act="dgNogoPick" data-tip="Đóng bảng, bấm một ô trên bản đồ để cấm quan xây quanh ô đó; vùng cấm được tô đỏ trên bản đồ">🖱 Chọn trên bản đồ</button>' + '</div>';
  } else if (role === 'kt') {
    h += '<div class="flowrow"><span>Chính sách</span>' + DGS(role, 'pol', d.pol, LT.DG_POL.kt) + '</div>';
    const tl = {}; LT.TAX_LEVELS.forEach((t, i) => { tl[i] = t.n; });
    h += '<div class="flowrow"><span>Thuế thấp nhất / cao nhất cho phép</span><span>' + DGS(role, 'taxMin', d.taxMin, tl) + ' ' + DGS(role, 'taxMax', d.taxMax, tl) + '</span></div>';
    h += '<div class="flowrow"><span>Dân tâm muốn giữ từ — đến</span><span>' + DGN(role, 'dtLo', d.dtLo, 56) + ' — ' + DGN(role, 'dtHi', d.dtHi, 56) + '</span></div><div>' + DGC(role, 'buyGrain', d.buyGrain, 'Mua lương ở chợ khi thiếu') + DGC(role, 'sell', d.sell, 'Bán hàng dư khi cần tiền') + '</div>';
    h += '<div class="hint">Đã chỉnh thuế ' + d.stat.taxMoves + ' lần, mua ' + Math.round(d.stat.bought) + ' thạch, bán ' + Math.round(d.stat.sold) + ' hàng. Hiện thuế: <b>' + LT.TAX_LEVELS[G.pol.tax].n + '</b>' + (LT.marketTier(G) ? '' : ' · chưa có Phường thị nên không mua bán được') + '.</div>';
  } else if (role === 'qs') {
    h += '<div class="flowrow"><span>Mục tiêu quân số (hiện ' + LT.armyCount(G) + '/' + LT.armyCap(G) + ')</span>' + DGN(role, 'tg.quan', d.tg.quan, 80) + '</div><div class="hint"><b>Cơ cấu binh chủng</b> (tỉ lệ tương đối):</div><div style="display:flex;gap:8px;flex-wrap:wrap">';
    for (const k of ['truongthuong', 'cung', 'daothuan', 'khinhky', 'trongky', 'no']) h += '<label class="hint">' + LT.UNITS[k].n + ' ' + DGN(role, 'mix.' + k, d.mix[k] || 0, 50) + '</label>';
    h += '</div><div class="hint">Cần Quân doanh; mộ theo luật mộ quân hiện có (hộ binh, tân binh luyện nhiều tuần). Đã mộ ' + d.stat.recruited + ' lính.</div>';
  } else {
    h += '<div class="flowrow"><span>Chính sách</span>' + DGS(role, 'pol', d.pol, LT.DG_POL.tt) + '</div><div>' + DGC(role, 'fill', d.fill, 'Tự điền thành khuyết quan') + DGC(role, 'rotate', d.rotate, 'Luân chuyển quan quá 3 năm (20 quan)') + DGC(role, 'inspect', d.inspect, 'Cho ngự sử tra thành đáng ngờ (30 quan)') + DGC(role, 'garrison', d.garrison, 'Tự đồn trú thành mới chiếm (rút quân dã chiến, 0,12 quan/lính)') + '</div>';
    h += '<div class="hint">Đã điền ' + d.stat.filled + ' chức, luân chuyển ' + d.stat.rotated + ', thanh tra ' + d.stat.inspected + ' lần, đồn trú ' + (d.stat.garrisoned || 0) + ' quân. Ngân sách này gồm cả lương chiêu mộ người mới.</div>';
  }
  h += '</div></div><div class="hint" style="margin-top:6px"><b>Nhật ký</b>' + (d.log.length ? '' : ' — chưa có') + '</div>';
  const okL = d.log.filter(e => e.k !== 'no').slice(0, 5), noL = d.log.filter(e => e.k === 'no').slice(0, 2), shown = d.log.filter(e => okL.indexOf(e) >= 0 || noL.indexOf(e) >= 0);
  h += shown.map(e => '<div class="hint" style="padding:1px 0;color:' + (e.k === 'ok' ? '#b4e08e' : e.k === 'no' ? '#f0b8a0' : '#9fb3c8') + '">' + (e.k === 'ok' ? '✔ ' : e.k === 'no' ? '✖ ' : '• ') + e.y + ' T' + e.w + ': ' + esc(e.t) + '</div>').join('');
  return h + '</div>';
}
function dgTab() {
  let h = '<p class="hint">Giao việc cho quan viên ở trị sở. <b>Mặc định tắt hết</b>; bật chức nào thì quan làm theo ngân sách, chính sách và chỉ tiêu bạn đặt, mỗi tuần một nhịp, qua đúng các hàm xây/mua/mộ của người chơi (đúng luật, đúng chi phí). Bạn tắt ngay lập tức được, và vẫn xây/phá tay bình thường. Quan giỏi làm sáng suốt hơn; quan tham xén bớt tiền (tính vào ngân sách).</p>';
  for (const role of ['xd', 'kt', 'qs', 'tt']) h += dgCard(role);
  return h;
}
const DGPATH = (patch, p, v) => { const ps = p.split('.'); if (ps.length === 1) patch[ps[0]] = v; else (patch[ps[0]] = patch[ps[0]] || {})[ps[1]] = v; return patch; };
ACT.dgIn = el => { const t = el.dataset.t, v = t === 'n' ? Math.max(0, Math.floor(+el.value || 0)) : t === 'b' ? el.checked : el.value; const r = LT.dgSet(G, el.dataset.r, DGPATH({}, el.dataset.p, t === 's' && /^\d+$/.test(v) && /tax/.test(el.dataset.p) ? +v : v)); if (!r.ok) toast(r.err, 'bad'); renderOfficials(); };
ACT.dgOn = el => { const D = LT.dg(G), r = LT.dgSet(G, el.dataset.r, { on: !D[el.dataset.r].on }); if (!r.ok) toast(r.err, 'bad'); renderOfficials(); ui(); };
ACT.dgAppoint = el => { if (!el.value) return; const role = el.dataset.r; offDone(LT.offAppoint(G, +el.value, { t: 'seat', role: LT.DG_ROLES[role].seat }), 'Đã bổ nhiệm'); };
ACT.dgFire = el => { const O = LT.off(G), o = LT.offById(G, O.seat[LT.DG_ROLES[el.dataset.r].seat]); if (o) LT.offUnpost(G, o); renderOfficials(); };
ACT.dgNogoPick = () => { const r = Math.max(1, Math.min(20, +((document.getElementById('ngr') || {}).value) || 4)); UI.nogoPick = r; closeModal(); toast('Bấm một ô trên bản đồ để cấm quan xây quanh ô (bán kính ' + r + ')', ''); };
ACT.dgNogoAdd = () => { const g = id => +document.getElementById(id).value; LT.dgNogo(G, g('ngx'), g('ngy'), g('ngr'), true); renderOfficials(); };
ACT.dgNogoDel = el => { const z = LT.dg(G).nogo[+el.dataset.i]; if (z) LT.dgNogo(G, z.x, z.y, 0, false); renderOfficials(); };
function renderOfficials(first) {
  const O = LT.off(G), t = UI.tab.off; let body = '';
  const cities = LT.ownedCities(G), idle = O.list.filter(o => !o.post), vac = cities.filter(c => !c.quan);
  body += '<div class="hint">Quan viên: <b>' + O.list.length + '</b>/' + Math.floor(LT.offMax(G)) + ' · chưa có việc <b>' + idle.length + '</b> · thành khuyết quan <b class="' + (vac.length ? 'neg' : '') + '">' + vac.length + '</b> (chạy 60% hiệu suất). Bổng lộc trả mỗi tháng; thiếu tiền thì nợ bổng, trung thành tụt, tham ô tăng.</div>';
  if (t === 'gv') { body += dgTab(); }
  else if (t === 'thanh') {
    if (!cities.length) body += '<p class="mut">Bạn chưa có thành nào ngoài trị sở. Thăng Thứ sử để nhận huyện, hoặc đánh chiếm thành.</p>';
    else {
      body += '<div style="margin:8px 0;display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-act="offFill" data-tip="Điền các thành đang khuyết bằng người hợp nhất: dùng quan chưa có việc trước, rồi mới chiêu thêm ứng viên đang có trong bảng tuyển">⚡ Bổ nhiệm nhanh các thành khuyết (' + vac.length + ')</button></div>';
      body += '<table class="t2"><tr><th>Thành</th><th>Quan trấn nhậm</th><th>Thuộc tính</th><th>Lòng trung / dã tâm</th><th class="r">Tự chủ</th><th>Xu hướng</th><th>Việc</th></tr>';
      for (const c of cities.sort((a, b) => b.lvl - a.lvl || b.ho - a.ho)) {
        const o = LT.offById(G, c.quan), ten = o ? LT.offTenure(G, o) : 0, sg = !o ? LT.offSuggest(G, c.id, true) : null;
        const opts = '<option value="">— chọn —</option>' + idle.map(x => '<option value="' + x.id + '">' + esc(x.name) + ' (chính ' + Math.round(x.chinh) + ', trung ' + Math.round(x.trung) + ')</option>').join('') + O.list.filter(x => x.post && x.post.t === 'city' && x.post.id !== c.id).map(x => '<option value="' + x.id + '">↔ ' + esc(x.name) + ' (đang ở ' + esc(G.world.cities[x.post.id].n) + ')</option>').join('');
        body += '<tr' + (UI.offSel === c.id ? ' style="background:#ffffff10"' : '') + '><td><b>' + esc(c.n) + '</b><span class="tag">' + LT.CITY_LEVELS[c.lvl].n + '</span><div class="hint">' + fm(c.ho) + ' hộ · ' + c.dist + ' chặng · pc ' + LT.PHUONG_CHAM[c.pc].n + '</div></td>';
        if (o) body += '<td><b>' + esc(o.name) + '</b> ' + traitTxt(o) + '<div class="hint">' + (ten >= 3 ? '<span class="warnc">đã ' + f1(ten) + ' năm — quá nhiệm kỳ, nên luân chuyển</span>' : f1(ten) + ' năm tại chức') + (o.home === c.id ? ' · <span class="neg">quê quán (trái hồi tỵ)</span>' : '') + (o.debt > 1 ? ' · <span class="neg">nợ bổng ' + Math.round(o.debt) + '</span>' : '') + '</div></td><td>' + offStats(o) + ' ' + offLiem(o) + '</td><td>' + trK(o) + '</td>';
        else body += '<td colspan="3"><span class="neg">Khuyết quan.</span> ' + (sg ? 'Gợi ý: <b>' + esc(sg.o.name) + '</b>' + (sg.o.id < 0 ? ' (ứng viên bảng tuyển)' : '') + ' — chính ' + Math.round(sg.o.chinh) + ', trung ' + Math.round(sg.o.trung) : 'Chưa có ai: sang tab Tuyển người') + '</td>';
        body += '<td class="r ' + (c.auto > 70 ? 'neg' : c.auto > 50 ? 'warnc' : '') + '">' + Math.round(c.auto) + '</td><td>' + trend(c) + '</td><td style="white-space:nowrap"><select class="sel" data-chg="offAssign" data-id="' + c.id + '" style="max-width:150px">' + opts + '</select> ' + (sg ? '<button class="btn2" data-act="offSug" data-id="' + c.id + '">⚡</button> ' : '') + (o ? '<button class="btn2" data-act="offIns" data-id="' + c.id + '" data-tip="Ngự sử thanh tra (30 quan): lộ mức liêm–tham, thu hồi một phần tiền ăn bớt">🕵</button> <button class="btn2 ' + (c.automo ? 'on' : '') + '" data-act="offAutoMo" data-id="' + c.id + '" data-tip="Cho quan tự mộ lính đóng thành (người Thống, Võ cao mộ nhanh; dã tâm cao hay mộ quá tay, tự chủ tăng)">⚔</button> <button class="btn2" data-act="offRot" data-id="' + c.id + '" data-tip="Luân chuyển (20 quan): đổi bằng quan mới của triều đình, tự chủ −30">🔄</button>' : '') + '</td></tr>';
        const lg = (c.olog || []).filter(e => !e.hid || (c.insp && G.tick - c.insp < 54)).slice(0, UI.offSel === c.id ? 8 : 2);
        if (lg.length) body += '<tr><td></td><td colspan="6" class="hint">' + lg.map(e => (e.hid ? '🕵 ' : '') + e.y + ' T' + e.w + ': ' + esc(e.t)).join('<br>') + '</td></tr>';
      }
      body += '</table><div class="hint">Mỗi quý, quan tự quyết theo phương châm của thành và theo tính cách của họ: khai khẩn ruộng, mở chợ, đắp thành, dẹp giặc, chống lũ… Người Chính cao làm thành giàu lên; người tham ăn bớt thuế (ẩn cho tới khi thanh tra); người dã tâm cao cầm quân ở xa lâu năm thì bám rễ, nộp thiếu rồi ly khai. Bấm vào tên thành ở bảng "Thành của bạn" để xem nhật ký đầy đủ.</div>';
    }
  } else if (t === 'ds') {
    const fl = UI.offF || 'all', so = UI.offS || 'post';
    body += '<div class="radio" style="margin:6px 0">' + [['all', 'Tất cả'], ['post', 'Đang giữ chức'], ['idle', 'Rảnh'], ['bad', 'Đáng ngờ']].map(x => '<button class="btn2 ' + (fl === x[0] ? 'on' : '') + '" data-act="offFilter" data-v="' + x[0] + '">' + x[1] + '</button>').join('') + ' <span class="hint">Xếp theo</span> ' + [['post', 'chức'], ['name', 'tên'], ['chinh', 'chính'], ['trung', 'trung'], ['da', 'dã tâm']].map(x => '<button class="btn2 ' + (so === x[0] ? 'on' : '') + '" data-act="offSort" data-v="' + x[0] + '">' + x[1] + '</button>').join('') + '</div>';
    body += '<table class="t2"><tr><th>Quan</th><th>Nguồn</th><th>Thuộc tính</th><th>Trung / dã tâm</th><th>Chức & giao việc</th><th class="r">Bổng/tháng</th><th>Khảo khóa cuối năm</th><th></th></tr>';
    const lst = O.list.filter(o => fl === 'all' || (fl === 'post' && o.post) || (fl === 'idle' && !o.post) || (fl === 'bad' && (o.trung < 45 || o.da > 65 || o.debt > 1))).sort((a, b) => so === 'name' ? a.name.localeCompare(b.name) : so === 'chinh' ? b.chinh - a.chinh : so === 'trung' ? b.trung - a.trung : so === 'da' ? b.da - a.da : (b.post ? 1 : 0) - (a.post ? 1 : 0) || b.chinh - a.chinh);
    if (!lst.length) body += '<tr><td colspan="8" class="mut">Không có quan nào khớp bộ lọc.</td></tr>';
    for (const o of lst) {
      const sc = LT.offScore(G, o), rev = o.revY === G.year, src = LT.OFF_SRC[o.src];
      body += '<tr><td><b>' + esc(o.name) + '</b> ' + traitTxt(o) + '<div class="hint">' + o.age + ' tuổi · quê ' + (o.home != null ? esc(G.world.cities[o.home].n) : '—') + '</div></td><td class="hint">' + (src ? src.n : o.src === 'hang' ? 'Hàng quan' : 'Triều đình bổ') + '</td><td>' + offStats(o) + ' ' + offLiem(o) + '</td><td>' + trK(o) + (o.debt > 1 ? '<div class="neg">nợ bổng ' + Math.round(o.debt) + '</div>' : '') + '</td><td>' + postTxt(o) + '<div>' + quickAssign(o) + '</div></td><td class="r">' + f1(o.sal * 3) + '</td><td>' + (o.post ? 'điểm <b class="' + (sc >= 60 ? 'pos' : sc < 40 ? 'neg' : '') + '">' + sc + '</b> ' + (rev ? '<span class="mut">đã chấm năm ' + G.year + '</span>' : '<button class="btn2" data-act="offRev" data-id="' + o.id + '" data-a="thuong" data-tip="Thưởng 15 quan: trung thành tăng (thưởng người kém thì người giỏi bất mãn)">🎖</button><button class="btn2" data-act="offRev" data-id="' + o.id + '" data-a="phat" data-tip="Phạt: trung thành giảm (phạt người có công là bất công)">⚖</button><button class="btn2" data-act="offRev" data-id="' + o.id + '" data-a="giu">＝</button>') : '<span class="mut">—</span>') + '</td><td><button class="btn2" data-act="offDis" data-id="' + o.id + '">' + (UI.offDisId === o.id ? 'Chắc chứ? Bấm lại' : 'Bãi miễn') + '</button></td></tr>';
    }
    body += '</table><div class="hint">Khảo khóa cuối năm: chấm điểm theo kết quả thật của thành (dân số, dân tâm, thuế nộp, tham ô, tự chủ). Thưởng phạt công bằng thì trung thành tăng; thiên vị thì người khác bất mãn (CT §4). Nhiệm kỳ 3 năm: ở lâu quá một nơi, quan bám rễ, tự chủ thành tăng nhanh. Hồi tỵ: đừng bổ quan về chính quê.</div>';
  } else if (t === 'nguon') {
    body += '<p class="hint">Mỗi nguồn cho một kiểu người khác nhau (CT §4). "Tìm người" cho 3 ứng viên trong bảng tuyển (30 tuần); chọn người rồi chiêu mộ.</p><div class="grid3">';
    for (const k in LT.OFF_SRC) { const S = LT.OFF_SRC[k], e = S.req(G), cd = (O.cool[k] || 0) - G.tick; body += '<div class="box"><b>' + S.n + '</b><div class="hint">' + S.d + '</div><button class="btn2" data-act="offSeek" data-src="' + k + '" ' + (e || cd > 0 ? 'disabled' : '') + '>Tìm người' + (S.cost ? ' (' + S.cost + ' quan)' : '') + '</button>' + (e ? '<div class="hint neg">' + e + '</div>' : cd > 0 ? '<div class="hint">chờ ' + cd + ' tuần</div>' : '') + '</div>'; }
    body += '</div><h3>Bảng tuyển (' + O.pool.length + ')</h3>';
    if (!O.pool.length) body += '<div class="mut">Chưa có ứng viên: bấm "Tìm người".</div>';
    else body += '<table class="t2"><tr><th>Ứng viên</th><th>Nguồn</th><th>Thuộc tính</th><th>Trung / dã tâm</th><th class="r">Phí</th><th></th></tr>' + O.pool.map(o => '<tr><td><b>' + esc(o.name) + '</b> ' + traitTxt(o) + '<div class="hint">' + o.age + ' tuổi</div></td><td class="hint">' + LT.OFF_SRC[o.src].n + '</td><td>' + offStats(o) + ' <span class="mut">liêm ?</span></td><td>' + trK(o) + '</td><td class="r">' + (o.src === 'ban' ? '<span class="pos">+' + o.price + '</span>' : LT.offHireCost(o)) + '</td><td><button class="btn2" data-act="offHire" data-id="' + o.id + '">' + (o.src === 'ban' ? 'Bán chức' : 'Chiêu mộ') + '</button></td></tr>').join('') + '</table>';
  } else {
    body += '<p class="hint">Giúp việc ở trị sở (từ Thứ sử). Mỗi chức một người; quan tham thì bớt xén.</p>';
    for (const role in LT.SEAT_ROLES) {
      if (LT.SEAT_ROLES[role].dg) continue;      // các chức giao việc có thẻ riêng ở tab Giao việc
      const R = LT.SEAT_ROLES[role], cur = LT.offById(G, O.seat[role]);
      body += '<div class="box" style="margin:6px 0"><b>' + R.n + '</b> — ' + R.d + '<div style="margin-top:6px">' + (cur ? '<b>' + esc(cur.name) + '</b> ' + offStats(cur) + ' ' + trK(cur) + ' · ' : '<span class="mut">để trống · </span>') + '<select class="sel" data-chg="offSeat" data-role="' + role + '"><option value="">— chọn —</option>' + O.list.filter(o => !o.post || (o.post.t === 'seat' && o.post.role === role)).map(o => '<option value="' + o.id + '"' + (cur && cur.id === o.id ? ' selected' : '') + '>' + esc(o.name) + ' (chính ' + Math.round(o.chinh) + ', trí ' + Math.round(o.tri) + ', thống ' + Math.round(o.tong) + ')</option>').join('') + '</select>' + (cur ? ' <button class="btn2" data-act="offSeatClear" data-role="' + role + '">Bỏ chức</button>' : '') + '</div></div>';
    }
    if (G.rank < 2) body += '<div class="hint neg">Chức ở trị sở mở từ Thứ sử.</div>';
  }
  const html = shell('👥 Quan viên', [['gv', 'Giao việc'], ['thanh', 'Theo thành'], ['ds', 'Danh sách & khảo khóa'], ['nguon', 'Tuyển người'], ['chuc', 'Chức ở trị sở']], t, 'offTab', body);
  if (first || !modalOpen() || UI.panel !== 'officials') openModal(html, 'wide xw'); else setModal(html);
}
function quickAssign(o) {
  const vac = LT.ownedCities(G).filter(c => !c.quan), seats = Object.keys(LT.SEAT_ROLES).filter(r => !LT.off(G).seat[r] && !LT.SEAT_ROLES[r].dg), dgs = Object.keys(LT.SEAT_ROLES).filter(r => !LT.off(G).seat[r] && LT.SEAT_ROLES[r].dg);
  let h = '<select class="sel" data-chg="offQuick" data-id="' + o.id + '" style="max-width:170px"><option value="">— giao việc —</option>';
  if (vac.length) h += '<optgroup label="Thành khuyết quan">' + vac.map(c => '<option value="c:' + c.id + '">' + esc(c.n) + '</option>').join('') + '</optgroup>';
  if (seats.length || dgs.length) h += '<optgroup label="Chức ở trị sở">' + seats.concat(dgs).map(r => '<option value="s:' + r + '">' + esc(LT.SEAT_ROLES[r].n) + '</option>').join('') + '</optgroup>';
  if (o.post) h += '<option value="u">⏏ Cho nghỉ việc (rảnh)</option>';
  return h + '</select>';
}
ACT.offFilter = el => { UI.offF = el.dataset.v; renderOfficials(); };
ACT.offSort = el => { UI.offS = el.dataset.v; renderOfficials(); };
ACT.offQuick = el => { const v = el.value; if (!v) return; const o = LT.offById(G, +el.dataset.id); if (v === 'u') { LT.offUnpost(G, o); renderOfficials(); return; } const [k, id] = v.split(':'); offDone(LT.offAppoint(G, o.id, k === 'c' ? { t: 'city', id: +id } : { t: 'seat', role: id }), 'Đã giao việc cho ' + o.name); };
const offDone = (r, okTxt) => { toast(r.ok ? okTxt : r.err, r.ok ? 'good' : 'bad'); renderOfficials(); ui(); };
ACT.offAssign = el => { if (!el.value) return; offDone(LT.offAppoint(G, +el.value, { t: 'city', id: +el.dataset.id }), 'Đã bổ nhiệm'); };
ACT.offSug = el => { const sg = LT.offSuggest(G, +el.dataset.id, true); if (!sg) return; let o = sg.o; if (o.id < 0) { const r = LT.offHire(G, o.id); if (!r.ok) { toast(r.err, 'bad'); return; } o = r.o; } offDone(LT.offAppoint(G, o.id, { t: 'city', id: +el.dataset.id }), 'Đã bổ nhiệm ' + o.name); };
ACT.offFill = () => { const r = LT.offFillAll(G); toast(r.n ? 'Đã bổ nhiệm ' + r.n + ' thành' + (r.hired ? ' (chiêu thêm ' + r.hired + ' người)' : '') + (r.vacant ? ' — còn ' + r.vacant + ' khuyết: ' + r.fail : '') : (r.fail || 'Không có thành khuyết'), r.n ? 'good' : 'bad'); renderOfficials(); ui(); };
ACT.offSeek = el => offDone(LT.offSeek(G, el.dataset.src), 'Đã có ứng viên trong bảng tuyển');
ACT.offHire = el => offDone(LT.offHire(G, +el.dataset.id), 'Đã chiêu mộ');
ACT.offDis = el => { const id = +el.dataset.id; if (UI.offDisId !== id) { UI.offDisId = id; toast('Bấm Bãi miễn lần nữa để xác nhận', ''); renderOfficials(); return; } UI.offDisId = null; offDone(LT.offDismiss(G, id), 'Đã bãi miễn'); };
ACT.offRev = el => { const r = LT.offReview(G, +el.dataset.id, el.dataset.a); toast(r.ok ? r.text : r.err, r.ok ? 'good' : 'bad'); renderOfficials(); ui(); };
ACT.offIns = el => { const r = LT.inspectCity(G, +el.dataset.id); toast(r.ok ? r.text : r.err, r.ok ? 'good' : 'bad'); renderOfficials(); ui(); };
ACT.offAutoMo = el => { const c = G.world.cities[+el.dataset.id]; c.automo = !c.automo; renderOfficials(); };
ACT.offRot = el => { const r = LT.rotateOfficial(G, +el.dataset.id); toast(r.ok ? 'Đã luân chuyển quan' : r.err, r.ok ? 'good' : 'bad'); renderOfficials(); ui(); };
ACT.offSeat = el => { if (!el.value) return; offDone(LT.offAppoint(G, +el.value, { t: 'seat', role: el.dataset.role }), 'Đã giao chức'); };
ACT.offSeatClear = el => { const O = LT.off(G), o = LT.offById(G, O.seat[el.dataset.role]); if (o) LT.offUnpost(G, o); renderOfficials(); };
function openTradeBtn() { openTrade(); }

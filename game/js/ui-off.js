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
function renderOfficials(first) {
  const O = LT.off(G), t = UI.tab.off; let body = '';
  const cities = LT.ownedCities(G), idle = O.list.filter(o => !o.post), vac = cities.filter(c => !c.quan);
  body += '<div class="hint">Quan viên: <b>' + O.list.length + '</b>/' + Math.floor(LT.offMax(G)) + ' · chưa có việc <b>' + idle.length + '</b> · thành khuyết quan <b class="' + (vac.length ? 'neg' : '') + '">' + vac.length + '</b> (chạy 60% hiệu suất). Bổng lộc trả mỗi tháng; thiếu tiền thì nợ bổng, trung thành tụt, tham ô tăng.</div>';
  if (t === 'thanh') {
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
    body += '<table class="t2"><tr><th>Quan</th><th>Nguồn</th><th>Thuộc tính</th><th>Trung / dã tâm</th><th>Chức</th><th class="r">Bổng/tháng</th><th>Khảo khóa cuối năm</th><th></th></tr>';
    if (!O.list.length) body += '<tr><td colspan="8" class="mut">Chưa có quan nào.</td></tr>';
    for (const o of O.list) {
      const sc = LT.offScore(G, o), rev = o.revY === G.year, src = LT.OFF_SRC[o.src];
      body += '<tr><td><b>' + esc(o.name) + '</b> ' + traitTxt(o) + '<div class="hint">' + o.age + ' tuổi · quê ' + (o.home != null ? esc(G.world.cities[o.home].n) : '—') + '</div></td><td class="hint">' + (src ? src.n : o.src === 'hang' ? 'Hàng quan' : 'Triều đình bổ') + '</td><td>' + offStats(o) + ' ' + offLiem(o) + '</td><td>' + trK(o) + (o.debt > 1 ? '<div class="neg">nợ bổng ' + Math.round(o.debt) + '</div>' : '') + '</td><td>' + postTxt(o) + '</td><td class="r">' + f1(o.sal * 3) + '</td><td>' + (o.post ? 'điểm <b class="' + (sc >= 60 ? 'pos' : sc < 40 ? 'neg' : '') + '">' + sc + '</b> ' + (rev ? '<span class="mut">đã chấm năm ' + G.year + '</span>' : '<button class="btn2" data-act="offRev" data-id="' + o.id + '" data-a="thuong" data-tip="Thưởng 15 quan: trung thành tăng (thưởng người kém thì người giỏi bất mãn)">🎖</button><button class="btn2" data-act="offRev" data-id="' + o.id + '" data-a="phat" data-tip="Phạt: trung thành giảm (phạt người có công là bất công)">⚖</button><button class="btn2" data-act="offRev" data-id="' + o.id + '" data-a="giu">＝</button>') : '<span class="mut">—</span>') + '</td><td><button class="btn2" data-act="offDis" data-id="' + o.id + '">Bãi miễn</button></td></tr>';
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
      const R = LT.SEAT_ROLES[role], cur = LT.offById(G, O.seat[role]);
      body += '<div class="box" style="margin:6px 0"><b>' + R.n + '</b> — ' + R.d + '<div style="margin-top:6px">' + (cur ? '<b>' + esc(cur.name) + '</b> ' + offStats(cur) + ' ' + trK(cur) + ' · ' : '<span class="mut">để trống · </span>') + '<select class="sel" data-chg="offSeat" data-role="' + role + '"><option value="">— chọn —</option>' + O.list.filter(o => !o.post || (o.post.t === 'seat' && o.post.role === role)).map(o => '<option value="' + o.id + '"' + (cur && cur.id === o.id ? ' selected' : '') + '>' + esc(o.name) + ' (chính ' + Math.round(o.chinh) + ', trí ' + Math.round(o.tri) + ', thống ' + Math.round(o.tong) + ')</option>').join('') + '</select>' + (cur ? ' <button class="btn2" data-act="offSeatClear" data-role="' + role + '">Bỏ chức</button>' : '') + '</div></div>';
    }
    if (G.rank < 2) body += '<div class="hint neg">Chức ở trị sở mở từ Thứ sử.</div>';
  }
  const html = shell('👥 Quan viên', [['thanh', 'Theo thành'], ['ds', 'Danh sách & khảo khóa'], ['nguon', 'Tuyển người'], ['chuc', 'Chức ở trị sở']], t, 'offTab', body);
  if (first || !modalOpen() || UI.panel !== 'officials') openModal(html, 'wide xw'); else setModal(html);
}
const offDone = (r, okTxt) => { toast(r.ok ? okTxt : r.err, r.ok ? 'good' : 'bad'); renderOfficials(); ui(); };
ACT.offAssign = el => { if (!el.value) return; offDone(LT.offAppoint(G, +el.value, { t: 'city', id: +el.dataset.id }), 'Đã bổ nhiệm'); };
ACT.offSug = el => { const sg = LT.offSuggest(G, +el.dataset.id, true); if (!sg) return; let o = sg.o; if (o.id < 0) { const r = LT.offHire(G, o.id); if (!r.ok) { toast(r.err, 'bad'); return; } o = r.o; } offDone(LT.offAppoint(G, o.id, { t: 'city', id: +el.dataset.id }), 'Đã bổ nhiệm ' + o.name); };
ACT.offFill = () => { const r = LT.offFillAll(G); toast(r.n ? 'Đã bổ nhiệm ' + r.n + ' thành' + (r.hired ? ' (chiêu thêm ' + r.hired + ' người)' : '') + (r.vacant ? ' — còn ' + r.vacant + ' khuyết: ' + r.fail : '') : (r.fail || 'Không có thành khuyết'), r.n ? 'good' : 'bad'); renderOfficials(); ui(); };
ACT.offSeek = el => offDone(LT.offSeek(G, el.dataset.src), 'Đã có ứng viên trong bảng tuyển');
ACT.offHire = el => offDone(LT.offHire(G, +el.dataset.id), 'Đã chiêu mộ');
ACT.offDis = el => { if (!confirm('Bãi miễn quan này?')) return; offDone(LT.offDismiss(G, +el.dataset.id), 'Đã bãi miễn'); };
ACT.offRev = el => { const r = LT.offReview(G, +el.dataset.id, el.dataset.a); toast(r.ok ? r.text : r.err, r.ok ? 'good' : 'bad'); renderOfficials(); ui(); };
ACT.offIns = el => { const r = LT.inspectCity(G, +el.dataset.id); toast(r.ok ? r.text : r.err, r.ok ? 'good' : 'bad'); renderOfficials(); ui(); };
ACT.offAutoMo = el => { const c = G.world.cities[+el.dataset.id]; c.automo = !c.automo; renderOfficials(); };
ACT.offRot = el => { const r = LT.rotateOfficial(G, +el.dataset.id); toast(r.ok ? 'Đã luân chuyển quan' : r.err, r.ok ? 'good' : 'bad'); renderOfficials(); ui(); };
ACT.offSeat = el => { if (!el.value) return; offDone(LT.offAppoint(G, +el.value, { t: 'seat', role: el.dataset.role }), 'Đã giao chức'); };
ACT.offSeatClear = el => { const O = LT.off(G), o = LT.offById(G, O.seat[el.dataset.role]); if (o) LT.offUnpost(G, o); renderOfficials(); };
function openTradeBtn() { openTrade(); }

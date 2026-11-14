'use strict';
// ============================================================================
// CÁC BẢNG: Triều chính, Sổ sách, Thiên hạ, Menu, màn mở đầu, khảo khóa, biến cố, thi cử, kết thúc.
// ============================================================================
function shell(title, tabs, cur, tabAct, body, extra) {
  let h = '<div class="head"><h2>' + title + '</h2><button class="x" data-act="close" aria-label="Đóng">✕</button></div>' + hubRow() + hubSummary();
  if (tabs && !(UI.panel === 'court' || UI.panel === 'world')) h += '<div class="ptabs">' + tabs.map(t => '<button class="ptab ' + (t[0] === cur ? 'on' : '') + '" data-act="' + tabAct + '" data-t="' + t[0] + '">' + t[1] + '</button>').join('') + '</div>';
  return h + body + (extra || '');
}
const bar = (v, mx, cls) => '<div class="bar2 ' + (cls || '') + '"><i style="width:' + Math.max(0, Math.min(100, v / mx * 100)) + '%"></i></div>';
const colorOf = (v, mx) => v / mx >= .6 ? 'g' : v / mx >= .35 ? 'y' : 'r';
const radioRow = (act, items, cur) => '<div class="radio">' + items.map(it => '<button class="btn2 ' + (it.id === cur ? 'on' : '') + '" data-act="' + act + '" data-v="' + it.id + '"' + (it.tip ? ' data-tip="' + esc(it.tip) + '"' : '') + '>' + it.n + '</button>').join('') + '</div>';
function showToggle(act, on, label, tip, dis) { return '<button class="btn2 ' + (on ? 'on' : '') + (dis ? ' dis' : '') + '" data-act="' + act + '" data-tip="' + esc(tip) + '">' + (on ? '✔ ' : '☐ ') + label + '</button>'; }

// ============================== TRIỀU CHÍNH ===================================================
function openCourt(tab) { G.flags.seenCourt = true; UI.panel = 'court'; UI.tab.court = tab || UI.tab.court || 'dan'; renderCourt(true); }
ACT.openCourtQuanlo = () => openCourt('quanlo');
ACT.courtTab = el => { UI.tab.court = el.dataset.t; renderCourt(); };
function renderCourt(first) {
  const t = UI.tab.court, tabs = [['dan', '👥 Dân & tầng lớp'], ['thue', '💰 Thuế & chính sách'], ['quanlo', '🎖️ Quan lộ'], ['luc', '⚖️ Thế lực'], ['phe', '🏛️ Phe phái'], ['tuu', '🏅 Thành tựu'], ['bocao', '📜 Bố cáo']];
  let body = '';
  if (t === 'dan') body = courtDan(); else if (t === 'thue') body = courtThue(); else if (t === 'quanlo') body = courtQuanlo(); else if (t === 'luc') body = courtLuc(); else if (t === 'phe') body = courtPhe(); else if (t === 'tuu') body = courtTuu(); else body = courtBocao();
  const html = shell('📜 Triều đình — ' + LT.RANKS[G.rank].n, tabs, t, 'courtTab', body);
  if (first || !modalOpen() || UI.panel !== 'court') openModal(html, 'wide'); else setModal(html);
}
function courtDan() {
  const tot = LT.totalHo(G); let h = '<p class="hint">Dân tính theo <b>hộ</b> (1 hộ ≈ 5 khẩu): ' + tot + ' hộ ≈ ' + tot * 5 + ' khẩu · chỗ ở ' + G.city.cap + ' hộ. Hộ nhận việc từ công trình; đủ nhu cầu lâu dài thì <b>lên tầng</b> vào cuối năm (nông → công → thương, sĩ, hào tộc), thiếu thốn thì <b>tụt</b> thành lưu dân hoặc bỏ đi.</p>';
  h += '<table class="t2"><tr><th>Tầng lớp</th><th class="r">Hộ</th><th class="r">Việc làm</th><th>Ấm no</th><th class="r">Đáp ứng nhu cầu</th><th>Nhu cầu mỗi hộ mỗi năm</th></tr>';
  const nm = { luong: 'lương', muoi: 'muối', vai: 'vải', ruou: 'rượu', tra: 'trà', gom: 'gốm', lua: 'lụa' };
  for (const c of LT.CLASS_IDS) {
    const d = LT.CLASSES[c], n = G.H[c] || 0, slots = ['nong', 'cong', 'thuong', 'si', 'tang'].includes(c) ? LT.slotsOf(G, c) : null;
    const sat = G.satc[c] == null ? 1 : G.satc[c], p = G.prosper[c];
    const needs = Object.keys(LT.NEEDS[c]).map(k => nm[k] + ' ' + f1(LT.NEEDS[c][k])).join(' · ');
    const taxN = LT.HA_THUE[c] != null ? 'Hạ thuế ' + LT.HA_THUE[c] + ' quan/năm' : 'Miễn hạ thuế';
    h += '<tr data-tip="' + esc('<b>' + d.i + ' ' + d.n + '</b><br>' + d.d + '<br>' + taxN) + '"><td><b>' + d.i + ' ' + d.n + '</b></td><td class="r">' + n + '</td><td class="r">' + (slots == null ? '—' : (n > slots ? '<span class="warnc">' : '') + slots + (n > slots ? '</span>' : '')) + '</td><td style="width:120px">' + (n ? bar(p, 100, colorOf(p, 100)) : '—') + '</td><td class="r"><span class="' + (sat >= .97 ? 'pos' : sat >= .8 ? 'warnc' : 'neg') + '">' + (n ? Math.round(sat * 100) + '%' : '—') + '</span></td><td class="mut" style="font-size:11px">' + needs + '</td></tr>';
  }
  h += '</table>';
  let jobsFree = 0; for (const c of ['nong', 'cong', 'thuong', 'si', 'tang']) jobsFree += Math.max(0, LT.slotsOf(G, c) - G.H[c]);
  h += '<div class="grid3" style="margin-top:12px"><div class="box"><b>Chỗ ở</b><br>' + G.city.houses + ' nhà × 15 + 20 = ' + G.city.cap + ' hộ.<br>' + (tot >= G.city.cap ? '<span class="warnc">Đã đầy — hộ mới không đến được.</span>' : 'Còn ' + (G.city.cap - tot) + ' chỗ trống.') + '</div>';
  h += '<div class="box"><b>Việc làm</b><br>' + jobsFree + ' chỗ làm đang trống.<br>' + (jobsFree > G.H.luu + 3 ? '<span class="warnc">Thiếu hộ — dựng thêm nhà để có dân.</span>' : G.H.luu > jobsFree + 8 ? '<span class="warnc">Lưu dân nhàn rỗi — dựng thêm công trình.</span>' : 'Cân đối.') + '</div>';
  h += '<div class="box"><b>Thuộc lại</b><br>' + G.H.quan + ' quan hộ, bổng 10 quan/năm mỗi người.<br>Mỗi 2 sĩ nhân (châu học, y quán) thêm 1 thuộc lại.</div></div>';
  return h;
}
function courtThue() {
  const lv = LT.TAX_LEVELS[G.pol.tax], sp = LT.SPLIT[G.rank];
  const yieldYr = G.yr.yield > 0 ? G.yr.yield : (G.lastYr ? G.lastYr.yield : G.city.farms * 480);
  let h = '<div class="grid2"><div>';
  h += '<h3>Mức thuế (lưỡng thuế)</h3>' + radioRow('setTax', LT.TAX_LEVELS.map(l => ({ id: l.id, n: l.n + ' ×' + String(l.mult).replace('.', ','), tip: l.d })), G.pol.tax);
  h += '<p class="hint">' + lv.d + '. Hạ thuế (tháng 6, thu tiền) dự kiến <b>' + fm(LT.expectedHaThue(G, lv.mult)) + ' quan</b> (định mức nông 0,3 · công 0,5 · thương 1,2 · hào tộc 4 quan/hộ). Thu thuế (tháng 11, thóc) dự kiến <b>' + fm(LT.THUE_THOC * yieldYr * lv.mult) + ' thạch</b> (10% sản lượng × ' + lv.mult + ').</p>';
  h += '<h3>Thuế chợ</h3>' + radioRow('setCho', LT.THUE_CHO.map((c, i) => ({ id: i, n: c.n, tip: 'Thuế quá cảnh + trú thuế trên hàng đi qua và bán tại chợ. Đặt cao thì thương đội né sang nơi khác (phồn vinh giảm).' })), G.pol.cho);
  h += '<h3>Nộp cho bề trên</h3><p class="hint">Chia thuế ba phần ở chức ' + LT.RANKS[G.rank].n + ': thượng cung <b>' + Math.round(sp[0] * 100) + '%</b> · lưu sứ <b>' + Math.round(sp[1] * 100) + '%</b> · giữ lại <b>' + Math.round(sp[2] * 100) + '%</b> của mọi khoản thu. Nộp vào tháng 6 và tháng 11.</p>';
  h += radioRow('setNop', [{ id: 'du', n: 'Nộp đủ', tip: 'An toàn, điểm khảo khóa mục "thuế nộp đủ" cao.' }, { id: 'thieu', n: 'Nộp thiếu (một nửa)', tip: 'Giữ thêm tiền ngay nhưng mất điểm khảo khóa và triều đình nghi kỵ.' }], G.pol.nop);
  const paid = G.yr.remitT + G.yr.remitL * LT.GOODS.luong.p;
  h += '<div class="box" style="margin-top:8px">Định mức năm ' + G.year + ': <b>' + fm(G.yr.quota) + '</b> quan · đã nộp: <b>' + fm(paid) + '</b> · phải nộp kỳ tới: ≈ ' + fm(G.pend.tien * (sp[0] + sp[1])) + ' quan<br><div style="margin-top:4px">' + bar(paid, Math.max(1, G.yr.quota), paid >= G.yr.quota ? 'g' : 'y') + '</div>' + (paid < G.yr.quota ? '<button class="btn sm" style="margin-top:7px" data-act="payQuota">Nộp bù cho đủ định mức (' + fm(Math.min(G.res.tien, G.yr.quota - paid)) + ' quan)</button>' : '<span class="pos">Đã đủ định mức năm nay.</span>') + '<div class="hint">Nghi kỵ của triều đình: <b class="' + (G.nghiky >= 50 ? 'neg' : '') + '">' + Math.round(G.nghiky) + '/100</b> (≥ 85: bị triệu về).</div></div>';
  h += '</div><div>';
  if (G.rank >= 5) h += '<h3>Đúc tiền (Vương trở lên)</h3>' + radioRow('setCoin', [{ id: 'none', n: 'Không đúc' }, { id: 'tot', n: 'Tiền đồng tốt (+0,02 quan/hộ/năm)', tip: 'Ổn định, được nước khác nhận.' }, { id: 'sat', n: 'Tiền sắt, chì (+0,06/hộ/năm)', tip: 'Có tiền ngay nhưng giá cả tăng, dân tâm −3, Chính danh −2 mỗi năm.' }], G.pol.coin || 'none');
  h += '<h3>Chuyên bán, thường bình</h3><div style="display:flex;gap:6px;flex-wrap:wrap">';
  for (const k of ['muoi', 'tra', 'ruou']) { const need = LT.GOODS_MONO_RANK[k], dis = G.rank < need; h += showToggle('mono', G.pol.mono[k], LT.GOODS[k].i + ' Chuyên bán ' + LT.GOODS[k].n.toLowerCase(), dis ? 'Cần chức ' + LT.RANKS[need].n : 'Quan phủ độc quyền bán: lãi = lượng dân mua × giá gốc × ' + String(LT.CHUYEN_BAN[k] - 1).replace('.', ',') + '. Dân tâm −2 mỗi loại; trị an thấp thì buôn lậu ăn mất lãi.', dis).replace('data-act="mono"', 'data-act="mono" data-k="' + k + '"'); }
  h += '</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">';
  h += showToggle('thuongbinh', G.pol.thuongbinh, '🛖 Thường bình thương', LT.count(G, 'granary') ? 'Quan mua thóc khi rẻ (≤0,8 giá gốc), bán khi đắt (≥1,25): ghìm giá giáp hạt, có lời, dân tâm +2.' : 'Cần xây Kho lương trước', !LT.count(G, 'granary'));
  h += showToggle('camruou', G.pol.camruou, '🚫 Cấm nấu rượu', 'Lò rượu ngừng dùng lương — nên bật khi đói kém.') + '</div>';
  const mono = ['muoi', 'tra', 'ruou'].filter(k => G.pol.mono[k]);
  h += '<p class="hint">Giá lương hiện tại: <b>' + f1(G.price.luong || .4) + '</b> (gốc 0,4) — ' + ((G.price.luong || .4) < .32 ? 'rẻ, nên mua vào' : (G.price.luong || .4) > .5 ? 'đắt (giáp hạt)' : 'bình thường') + '.</p>';
  h += '<h3>Lao dịch</h3><div class="hint">Mỗi hộ nợ 2 tuần-hộ công mỗi năm. Dùng năm nay: <b>' + Math.round(G.lab.used) + '</b> / ' + G.lab.budget + '</div>' + bar(G.lab.used, Math.max(1, G.lab.budget), G.lab.used > G.lab.budget ? 'r' : 'g');
  h += '<div style="margin-top:6px">' + radioRow('setLao', [{ id: 'phu', n: 'Thuê phu (0,03 quan/tuần-hộ)', tip: 'Quá hạn mức thì trả tiền thuê phu, không mất dân tâm.' }, { id: 'dich', n: 'Gọi lao dịch quá hạn', tip: 'Miễn phí nhưng mất dân tâm; trong mùa bận (tháng 1–2, 9) sản lượng ruộng ×0,8.' }], G.pol.laodich) + '</div>';
  h += '<h3>Thu chi năm nay (tiền)</h3><table class="t2"><tr><td>Thu (thuế, chợ, chuyên bán…)</td><td class="r pos">+' + fm(G.yr.rev) + '</td></tr><tr><td>Hạ thuế đã thu</td><td class="r">' + fm(G.yr.thueTien) + '</td></tr><tr><td>Thuế thóc đã thu</td><td class="r">' + fm(G.yr.thueThoc) + ' thạch</td></tr><tr><td>Thuế chợ</td><td class="r">' + fm(G.yr.cho) + '</td></tr><tr><td>Chuyên bán</td><td class="r">' + fm(G.yr.mono) + '</td></tr><tr><td>Chi bổng, bảo trì, quân</td><td class="r neg">−' + fm(G.yr.exp) + '</td></tr><tr><td>Đã nộp bề trên</td><td class="r neg">−' + fm(G.yr.remitT) + '</td></tr></table>';
  return h + '</div></div>';
}
function courtQuanlo() {
  const P = G.player, K = G.khao, pr = LT.promotion(G); let h = '<div class="grid3"><div class="box"><b>' + LT.RANKS[G.rank].n + ' ' + esc(G.name) + '</b><br>';
  for (const [k, n] of [['tong', 'Thống'], ['vo', 'Võ'], ['tri', 'Trí'], ['chinh', 'Chính'], ['duc', 'Đức']]) h += '<div class="flowrow"><span>' + n + '</span><b>' + P[k] + '</b></div>';
  h += '<div class="hint">Chính ÷ 400 cộng vào sản lượng (×' + f1(1 + P.chinh / 400) + '); Thống áp cho toàn quân khi bày trận.</div></div>';
  h += '<div class="box"><b>Thanh danh</b> (dân & sĩ nhìn bạn) <b class="gold">' + Math.round(P.thanhdanh) + '</b>' + bar(P.thanhdanh, 100) + '<br><b>Uy vọng</b> (tướng sĩ theo bạn) <b class="gold">' + Math.round(P.uyvong) + '</b>' + bar(P.uyvong, 100) + '<br><b>Tín</b> (giữ lời) <b class="gold">' + Math.round(P.tin) + '</b>' + bar(P.tin, 100) + '<br><b>Nghi kỵ</b> <b class="' + (G.nghiky >= 50 ? 'neg' : '') + '">' + Math.round(G.nghiky) + '</b>' + bar(G.nghiky, 100, 'r') + '</div>';
  h += '<div class="box"><b>Thành tích</b><br>Hạng thượng: <b>' + K.thuong + '</b><br>Quân công: <b>' + G.quanCong + '</b> (thắng ' + G.wins + ' trận)<br>Dẹp loạn: <b>' + G.loan + '</b><br>Khảo khóa dưới 40 liền nhau: <b class="' + (K.low ? 'neg' : '') + '">' + K.low + '/2</b></div></div>';
  h += '<h3>Khảo khóa tháng 12 — dự kiến nếu chấm hôm nay</h3>';
  const r = LT.khaoScores(G);
  h += '<table class="t2">' + LT.KHAO_MUC.map(m => '<tr data-tip="' + esc(m.d) + '"><td style="width:150px"><b>' + m.n + '</b></td><td>' + bar(r.s[m.id], 20, colorOf(r.s[m.id], 20)) + '</td><td class="r" style="width:50px"><b>' + f1(r.s[m.id]) + '</b>/20</td></tr>').join('') + '<tr><td><b>Tổng</b></td><td></td><td class="r"><b class="gold">' + f1(r.total) + '</b>/100</td></tr></table>';
  h += '<p class="hint">≥ 80 hạng Thượng (thưởng, thanh danh +3) · 60–79 Trung · 40–59 Hạ (quở trách) · &lt; 40 bị giáng: phạt bổng, thanh danh −10; hai năm liền thì bị bãi chức.</p>';
  if (K.history.length) h += '<div class="hint">Các năm trước: ' + K.history.slice(-6).map(x => x.year + ': <b>' + x.total + '</b>').join(' · ') + '</div>';
  h += '<h3>Điều kiện thăng chức</h3>';
  if (pr) {
    h += '<ul style="margin:4px 0;padding-left:18px">' + pr.conds.map(c => '<li class="' + (c.ok ? 'pos' : '') + '">' + (c.ok ? '✅' : '⬜') + ' ' + esc(c.t) + '</li>').join('') + '</ul>';
    if (G.rank === 4) {
      h += '<div class="grid2">' + [['phong', '🏅 Xin phong vương (thuận)', pr.paths.phong], ['lap', '🔥 Tự lập xưng vương (nghịch)', pr.paths.lap]].map(x => '<div class="box"><b>' + x[1] + '</b><div class="hint">' + esc(x[2].t) + '</div><button class="btn sm ' + (x[2].ok ? '' : 'dis') + '" data-act="goPath" data-p="' + x[0] + '" style="margin-top:6px">Chọn con đường này</button></div>').join('') + '</div>';
    } else if (G.rank === 5) {
      h += pr.ready ? '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><label class="hint">Niên hiệu: <input id="inEra" class="inp" maxlength="12" value="Thiên Hựu" style="width:140px"></label><button class="btn" data-act="goEmperor">👑 Xưng Hoàng đế</button></div>' : '<div class="hint">Chưa đủ điều kiện xưng đế.</div>';
    } else if (pr.ready) h += '<button class="btn" data-act="goPromo">Xin thăng ' + pr.name + '</button>';
    else if (pr.needExam) h += '<button class="btn" data-act="goExam">Dự kỳ Tỉnh thí</button> <span class="hint">Trượt thì thi lại ngay, đề mới mỗi lần.</span>';
  } else h += '<p class="pos">Bạn đã là Hoàng đế — đích cuối là thống nhất thiên hạ: giữ 90 trên 120 thành, gồm cả kinh đô Trung Nguyên (hiện ' + LT.mineCount(G) + ').</p>';
  if (G.rank >= 2) { const ro = LT.relocateOptions(G); h += '<h3>Dời trị sở</h3><div class="hint">Trị sở hiện tại: <b>' + esc(G.world.cities[G.seatId].n) + '</b> (' + LT.CITY_LEVELS[G.seatLvl].n + '). Dời sang thành lớn hơn để xây tay ở đó trên bản đồ mới; thành cũ chuyển thành bảng số liệu và giữ nguyên dân số, quân đồn trú, lương (GP §8).</div>' + (ro.length ? ro.map(c => '<button class="btn2" style="margin:4px 6px 0 0" data-act="relocate" data-id="' + c.id + '" data-tip="' + esc('Dời sang ' + c.n + ': ' + LT.CITY_LEVS_TXT(c)) + '">🏯 Dời sang ' + esc(c.n) + ' (' + LT.CITY_LEVELS[c.lvl].n + ', ' + LT.fmtN(c.ho) + ' hộ)</button>').join('') : '<div class="hint">Chưa có thành nào của bạn lớn hơn trị sở' + (G.camp ? ' (đang có chiến dịch)' : '') + '.</div>'); }
  if (G.rank >= 2) h += '<h3>Lãnh thổ</h3><div class="hint">Trị sở: ' + LT.CITY_LEVELS[G.seatLvl].n + ' (tối đa ' + LT.fmtN(LT.CITY_LEVELS[G.seatLvl].cap) + ' hộ) · ' + (LT.mineCount(G) - 1) + ' thành thuộc quyền (xem 🗺️ Thiên hạ → Thành của bạn) · Chính danh <b>' + Math.round(G.chinhdanh) + '</b> (trần dân tâm của Vương trở lên = 50 + Chính danh ÷ 2 = ' + Math.round(50 + G.chinhdanh / 2) + ')' + (G.eraName ? ' · niên hiệu "' + esc(G.eraName) + '"' : '') + '.</div>';
  return h;
}
function courtBocao() {
  let h = '<p class="hint">Bố cáo, lệnh và thánh chỉ theo chức: tối đa <b>' + LT.bocaoSlots(G) + ' văn bản cùng lúc</b> (đang dùng ' + G.bocaoList.length + '). Mỗi bố cáo cộng dân tâm từ từ theo quý, nhân với <b>Tín</b> (' + Math.round(G.player.tin) + '/100). Hứa mà không giữ lời thì Tín −15.</p>';
  h += '<div class="grid2">';
  for (const id in LT.BOCAO) {
    const d = LT.BOCAO[id], act = G.bocaoList.find(b => b.id === id); if ((d.rank || 1) > G.rank) continue;
    h += '<div class="box"><b>' + d.n + '</b><div class="hint">' + d.d + '</div>' + (Object.keys(d.cost).length ? '<div class="hint">Giá: ' + LT.costTxt(d.cost) + '</div>' : '') + (act ? '<div class="hint pos">Đang hiệu lực — còn ' + act.left + ' tuần</div>' + bar(act.total - act.left, act.total, 'g') : '<button class="btn sm" data-act="bocao" data-id="' + id + '" style="margin-top:6px">Ban bố</button>') + '</div>';
  }
  return h + '</div>';
}
ACT.setTax = el => { const v = +el.dataset.v; if (v === G.pol.tax) return; G.pol.tax = v; toast('Mức thuế: ' + LT.TAX_LEVELS[v].n); renderCourt(); ui(); };
ACT.setCho = el => { G.pol.cho = +el.dataset.v; renderCourt(); };
ACT.setCoin = el => { G.pol.coin = el.dataset.v; renderCourt(); };
ACT.setNop = el => { G.pol.nop = el.dataset.v; renderCourt(); };
ACT.setLao = el => { G.pol.laodich = el.dataset.v; renderCourt(); };
ACT.mono = el => { const k = el.dataset.k; if (G.rank < LT.GOODS_MONO_RANK[k]) { toast('Cần chức ' + LT.RANKS[LT.GOODS_MONO_RANK[k]].n + ' để chuyên bán ' + LT.GOODS[k].n.toLowerCase(), 'bad'); return; } G.pol.mono[k] = !G.pol.mono[k]; renderCourt(); };
ACT.thuongbinh = () => { if (!LT.count(G, 'granary')) { toast('Cần xây Kho lương trước', 'bad'); return; } G.pol.thuongbinh = !G.pol.thuongbinh; renderCourt(); };
ACT.camruou = () => { G.pol.camruou = !G.pol.camruou; renderCourt(); };
ACT.payQuota = () => { const p = LT.payQuota(G); toast(p > 0 ? 'Đã nộp bù ' + fm(p) + ' quan cho đủ định mức' : 'Không có tiền để nộp bù', p > 0 ? 'good' : 'bad'); renderCourt(); ui(); };
ACT.bocao = el => { const r = LT.issueBocao(G, el.dataset.id); toast(r.ok ? 'Đã ban bố cáo' : r.err, r.ok ? 'good' : 'bad'); renderCourt(); ui(); };
ACT.subPc = el => { G.subs[+el.dataset.i].pc = el.value; renderCourt(); };
ACT.subNop = el => { G.subs[+el.dataset.i].nop = +el.value; renderCourt(); };
ACT.relocate = el => { const id = +el.dataset.id, c = G.world.cities[id]; ask('Dời trị sở sang ' + c.n + '? Bản đồ xây tay sẽ chuyển sang thành đó; thành cũ thành bảng số liệu.', () => doRelocate(id), 'Dời trị sở'); };
function doRelocate(id) { const r = LT.relocate(G, id); if (!r.ok) { toast(r.err, 'bad'); return; } closeModal(); afterRelocate(); toast('Đã dời trị sở sang ' + r.to + ' (' + LT.fmtN(r.ho) + ' hộ)', 'good'); };
ACT.goPromo = () => { const p = LT.promotion(G); if (!p || !p.ready) { toast('Chưa đủ điều kiện', 'bad'); return; } if (G.rank >= 4) { openCourt('quanlo'); return; } LT.promote(G); buildBar(); closeModal(); ui(); };
ACT.goPath = el => { const ok = LT.promote(G, { path: el.dataset.p }); if (!ok) { toast('Chưa đủ điều kiện cho con đường này', 'bad'); return; } buildBar(); closeModal(); ui(); };
ACT.goEmperor = () => { const nm = ($('inEra') && $('inEra').value) || 'Thiên Hựu'; if (!LT.proclaim(G, nm)) { toast('Chưa đủ điều kiện xưng đế', 'bad'); return; } buildBar(); closeModal(); ui(); };
ACT.goExam = () => { G.khao.examTried = G.khao.examTried || false; UI.exam = LT.newExam(G); showExam(); };

// ============================== SỔ SÁCH ========================================================
function openLedger(res, tab) { UI.panel = 'ledger'; UI.tab.ledger = tab || UI.tab.ledger || 'dong'; UI.ledRes = res || UI.ledRes || 'tien'; renderLedger(true); }
ACT.ledTab = el => { UI.tab.ledger = el.dataset.t; renderLedger(); };
ACT.ledRes = el => { UI.ledRes = el.dataset.v; renderLedger(); };
function renderLedger(first) {
  const t = UI.tab.ledger; let body = '';
  const resList = [['tien', '🪙 Tiền'], ['luong', '🌾 Lương quan'], ['dluong', '🌾 Lương dân'], ['go', '🪵 Gỗ'], ['da', '🪨 Đá'], ['quang', '⛏️ Quặng'], ['nongcu', '🔧 Nông cụ'], ['muoi', '🧂 Muối'], ['vai', '🧶 Vải'], ['ken', '🐛 Kén'], ['lua', '🧵 Lụa'], ['tra', '🍵 Trà'], ['gom', '🏺 Gốm'], ['ruou', '🍶 Rượu'], ['binhkhi', '🗡️ Binh khí'], ['ngua', '🐴 Ngựa'], ['ho', '👥 Hộ']];
  if (t === 'dong') {
    const cur = UI.ledRes, name = resList.find(r => r[0] === cur)[1];
    body += '<div class="radio" style="margin-bottom:10px">' + resList.map(r => '<button class="btn2 ' + (r[0] === cur ? 'on' : '') + '" data-act="ledRes" data-v="' + r[0] + '" style="flex:0 0 auto;padding:5px 8px">' + r[1] + '</button>').join('') + '</div>';
    const stock = cur === 'dluong' ? G.dan.luong : cur === 'ho' ? LT.totalHo(G) : G.res[cur];
    body += '<div class="grid2"><div><h3>' + name + ' · hiện có ' + fm(stock) + '</h3><div class="hint">Tuần vừa rồi — vì sao con số lên xuống:</div>';
    const rows = flowRows(cur), net = flowNet(cur);
    body += rows.length ? rows.map(r => '<div class="flowrow"><span>' + esc(r[0]) + '</span><b class="' + (r[1] >= 0 ? 'pos' : 'neg') + '">' + sgn(r[1]) + '</b></div>').join('') : '<div class="mut">Chưa có biến động.</div>';
    body += '<div class="flowrow" style="border-top:1px solid var(--line)"><b>Ròng/tuần</b><b class="' + (net >= 0 ? 'pos' : 'neg') + '">' + sgn(net) + '</b></div></div>';
    body += '<div><h3>Cả năm ' + G.year + ' (tính đến nay)</h3>';
    const yrows = flowRows(cur, G.flow.year);
    body += yrows.length ? yrows.map(r => '<div class="flowrow"><span>' + esc(r[0]) + '</span><b class="' + (r[1] >= 0 ? 'pos' : 'neg') + '">' + sgn(r[1]) + '</b></div>').join('') : '<div class="mut">Chưa có số liệu.</div>';
    body += '<div class="flowrow" style="border-top:1px solid var(--line)"><b>Ròng năm nay</b><b class="' + (flowNet(cur, G.flow.year) >= 0 ? 'pos' : 'neg') + '">' + sgn(flowNet(cur, G.flow.year)) + '</b></div></div></div>';
  } else if (t === 'gia') {
    const dem = LT.demandWeek(G);
    body += '<p class="hint">Giá thật ở thành = giá gốc × √(cầu 12 tuần ÷ cung), kẹp trong 0,4–2,5 lần giá gốc (KT §6). Thương nhân nhập hàng thiếu (giá ×1,3) và bán hàng dư ra ngoài (giá ×0,85) trong giới hạn sức buôn <b>' + f1(G.trade.cap) + '</b> quan-giá trị/tuần (đã dùng ' + f1(G.trade.used) + ').</p>';
    body += '<table class="t2"><tr><th>Hàng</th><th class="r">Tồn kho</th><th class="r">Cầu/tuần</th><th class="r">Giá hiện tại</th><th class="r">Giá gốc</th><th class="r">Đáp ứng</th></tr>';
    for (const k of LT.GOOD_IDS) { const g2 = LT.GOODS[k], st = k === 'luong' ? G.dan.luong + G.res.luong : G.res[k], p = G.price[k] || g2.p, sat = G.sat[k]; body += '<tr><td>' + g2.i + ' ' + g2.n + '</td><td class="r">' + fm(st) + '</td><td class="r">' + f1(dem[k] || 0) + '</td><td class="r ' + (p > g2.p * 1.25 ? 'neg' : p < g2.p * .8 ? 'pos' : '') + '">' + f1(p) + '</td><td class="r mut">' + f1(g2.p) + '</td><td class="r">' + (sat == null ? '—' : Math.round(sat * 100) + '%') + '</td></tr>'; }
    body += '</table>';
  } else {
    body += '<p class="hint">Mỗi công trình: nhân công, nối đường, sản lượng ước tính tuần này.</p><table class="t2"><tr><th>Công trình</th><th class="r">Số lượng</th><th class="r">Nhân công TB</th><th class="r">Chưa nối đường</th></tr>';
    const by = {}; for (const b of G.bl) if (!b.building && B[b.k] && (B[b.k].job || B[b.k].out)) { const e = by[b.k] || (by[b.k] = { n: 0, sr: 0, nc: 0 }); e.n++; e.sr += b.sr; if (!b.conn) e.nc++; }
    for (const k in by) body += '<tr><td>' + B[k].i + ' ' + B[k].n + '</td><td class="r">' + by[k].n + '</td><td class="r ' + (by[k].sr / by[k].n < .8 ? 'warnc' : '') + '">' + Math.round(by[k].sr / by[k].n * 100) + '%</td><td class="r ' + (by[k].nc ? 'neg' : '') + '">' + by[k].nc + '</td></tr>';
    body += '</table>';
  }
  const html = shell('📒 Sổ sách', [['dong', 'Dòng chảy'], ['gia', 'Giá & cung cầu'], ['cong', 'Công trình']], t, 'ledTab', body);
  if (first || !modalOpen() || UI.panel !== 'ledger') openModal(html, 'wide'); else setModal(html);
}

// ============================== THIÊN HẠ ========================================================
function openWorld(sel, tab) { UI.panel = 'world'; UI.mv = UI.mv || {}; if (tab) UI.tab.world = tab; UI.tab.world = UI.tab.world || 'nuoc'; UI.natSel = sel != null ? sel : (UI.natSel != null ? UI.natSel : LT.NATIONS[G.nation].adj[0]); UI.gift = UI.gift || 0; renderWorld(true); }
ACT.worldTab = el => { UI.tab.world = el.dataset.t; renderWorld(); };
ACT.selNat = el => { UI.natSel = +el.dataset.id; renderWorld(); };
ACT.setGift = el => { UI.gift = +el.dataset.v; renderWorld(); };
function renderWorld(first) {
  const w = G.world, NT = LT.NATIONS, sel = UI.natSel, n = NT[sel];
  const svg = zoomMapHTML('nmap', 520, 480, natMapInner(mvGet('nmap').z), 440);
  const ns = w.ns[sel], self = sel === G.nation;
  let det = '<h3 style="margin-top:0">' + esc(LT.natName(G, sel)) + (self ? ' <span class="tag y">nước của bạn</span>' : '') + (ns.alive ? '' : ' <span class="tag r">đã bị diệt</span>') + '</h3>';
  det += '<div class="hint">Kinh đô ' + n.cap + ' · <b>' + ns.cities + '</b> thành (lúc đầu ' + n.cities + ') · độ khó <b>' + n.diff + '</b> · tính cách <b>' + n.chr + '</b> (' + LT.NATION_CHR[n.chr] + ')</div>';
  det += '<div class="hint">👍 ' + n.str + '<br>👎 ' + n.weak + '</div>' + aiNatInfo(sel);
  det += '<div class="flowrow"><span>Ổn định triều đình</span><b>' + Math.round(ns.stab) + '</b></div><div class="flowrow"><span>Sức quân (thang 100)</span><b>' + Math.round(ns.army) + '</b></div>';
  if (!self && ns.alive) {
    const rel = w.rel[sel];
    det += '<div class="flowrow"><span>Quan hệ với bạn</span><b class="' + (rel >= 30 ? 'pos' : rel < -10 ? 'neg' : 'warnc') + '">' + Math.round(rel) + ' / ±100</b></div>' + bar(rel + 100, 200, rel >= 30 ? 'g' : rel < -10 ? 'r' : 'y');
    const have = Object.keys(G.treaties).filter(k => G.treaties[k].indexOf(sel) >= 0).map(k => LT.TREATIES[k].n);
    det += '<div class="hint">Giao ước hiện có: ' + (have.length ? '<b>' + have.join(', ') + '</b>' : 'chưa có') + '</div>';
    det += '<h3>Lễ vật kèm theo (' + (UI.gift ? LT.GIFT_COST[UI.gift] + ' quan' : 'không') + ')</h3>' + radioRow('setGift', [{ id: 0, n: 'Không' }, { id: 1, n: '30 quan' }, { id: 2, n: '100 quan' }, { id: 3, n: '300 quan' }], UI.gift);
    det += '<div style="margin-top:6px"><button class="btn2" data-act="giftOnly" data-tip="Chỉ biếu lễ vật để tăng quan hệ (không đề nghị giao ước)">🎁 Chỉ biếu lễ vật</button> <button class="btn2" data-act="cutRel" data-tip="Quan hệ −30, Tín −6, hủy mọi giao ước">✂ Tuyệt giao</button></div>';
    const p = LT.persuasion(G, sel, LT.GIFT_COST[UI.gift]);
    det += '<h3>Điểm thuyết phục: <span class="gold">' + f1(p.total) + '</span></h3><div class="hint">' + p.parts.map(x => x.n + ': <b class="' + (x.v >= 0 ? 'pos' : 'neg') + '">' + sgn(x.v) + '</b>').join('<br>') + '</div>';
    det += '<h3>Đề nghị giao ước</h3>';
    for (const a of LT.diploActions(G, sel)) det += '<div class="box" style="margin:5px 0;display:flex;justify-content:space-between;gap:8px;align-items:center"><div><b>' + a.n + '</b><span class="tag ' + (p.total >= a.th ? 'g' : 'y') + '">ngưỡng ' + a.th + '</span><div class="hint">' + a.d + '</div>' + (a.err ? '<div class="hint neg">' + esc(a.err) + '</div>' : '') + '</div><button class="btn sm ' + (a.err ? 'dis' : '') + '" data-act="treaty" data-k="' + a.id + '">' + (a.have ? 'Đã có' : 'Đề nghị') + '</button></div>';
  } else if (self) det += '<div class="hint">Bạn là một ' + LT.RANKS[G.rank].n + ' dưới quyền triều đình nước này. Nghi kỵ của triều đình: <b>' + Math.round(G.nghiky) + '</b>. ' + LT.NATION_PERKS[G.nation] + '</div>';
  const chron = chronHtml(14);
  const body = '<div class="grid2" style="grid-template-columns:1.05fr 1fr"><div>' + svg + '<div class="hint" style="margin-top:4px">Số trong vòng tròn = số thành · viền xanh/vàng/đỏ = quan hệ với bạn · bấm vào một nước để xem. Tổng còn <b>' + LT.countCities(G) + '</b> thành.</div></div><div>' + det + '</div></div><h3>Biên niên thiên hạ</h3>' + chron;
  const wt = UI.tab.world || 'nuoc', inner = wt === 'nuoc' ? body : wt === 'thanh' ? worldCityMap() : wt === 'cua' ? worldMine() : wt === 'ngg' ? worldDiplo() : worldCamp();
  const html = shell('🗺️ Thiên hạ', [['nuoc', '🌏 12 nước & ngoại giao'], ['ngg', '🕊️ Bảng ngoại giao & biên niên'], ['thanh', '🏯 Bản đồ ' + G.world.cities.length + ' thành'], ['cua', '🏛️ Thành của bạn (' + (LT.mineCount(G) - 1) + ')'], ['chien', '⚔️ Chiến dịch' + (G.camp ? ' ●' : '')]], wt, 'worldTab', inner);
  if (first || !modalOpen() || UI.panel !== 'world') openModal(html, 'wide xw'); else setModal(html);
  bindWorldMaps();
}
ACT.giftOnly = () => { const r = LT.sendGift(G, UI.natSel, UI.gift || 1); toast(r.ok ? r.text : r.err, r.ok ? 'good' : 'bad'); renderWorld(); ui(); };
ACT.cutRel = () => { const r = LT.breakRelations(G, UI.natSel); toast(r.ok ? r.text : r.err, r.ok ? '' : 'bad'); renderWorld(); };
ACT.treaty = el => { const r = LT.proposeTreaty(G, UI.natSel, el.dataset.k, UI.gift); if (!r.ok) toast(r.err, 'bad'); else toast(r.text, r.win ? 'good' : 'bad'); renderWorld(); ui(); };

// ============================== MENU, LƯU/TẢI ====================================================
function openMenu() {
  UI.panel = 'menu';
  let h = '<div class="head"><h2>☰ Trình đơn</h2><button class="x" data-act="close">✕</button></div><h3>Lưu ván</h3><div class="grid3">';
  for (const sl of ['m1', 'm2', 'm3']) { const m = LT.slotMeta(sl); h += '<div class="box"><b>Ô ' + sl.slice(1) + '</b><div class="hint">' + (m ? m.nation + ' · ' + m.rank + '<br>Năm ' + m.year + ' tuần ' + m.week : 'trống') + '</div><button class="btn sm" data-act="saveSlot" data-s="' + sl + '" style="margin-top:6px">Lưu vào đây</button> <button class="btn2" data-act="loadSlot" data-s="' + sl + '" ' + (m ? '' : 'disabled') + '>Tải</button></div>'; }
  const a = LT.slotMeta('auto');
  h += '</div><div class="box" style="margin-top:8px"><b>Tự động lưu</b> — mỗi 6 tuần và mỗi cuối năm: ' + (a ? a.nation + ' · năm ' + a.year + ' tuần ' + a.week : 'chưa có') + ' <button class="btn2" data-act="loadSlot" data-s="auto" ' + (a ? '' : 'disabled') + '>Tải bản tự lưu</button></div>';
  h += '<h3>Đồ họa</h3><div class="radio">' + Object.keys(GFX_MODES).reverse().map(k => '<button class="btn2 ' + (GFX.mode === k ? 'on' : '') + '" data-act="gfxMode" data-m="' + k + '" data-tip="' + ({ high: 'Đầy đủ: ảnh sắc nét theo độ phân giải màn hình, hiệu ứng nước, mây, chim, người và xe đầy đủ, công trình có chuyển động.', med: 'Cân bằng: độ phân giải ảnh vừa phải, bỏ chim và chuyển động trong công trình, bớt người và xe.', low: 'Nhẹ nhất: ảnh độ phân giải thấp, bỏ trang trí cỏ nước mây chim, ít người xe — dành cho máy yếu.' })[k] + '">' + GFX_MODES[k].n + '</button>').join('') + '</div><div class="hint">' + (GFX.auto ? 'Đang tự chọn theo máy. ' : '') + 'Lựa chọn được nhớ trên máy này, không nằm trong bản lưu ván. <button class="btn2" data-act="perfToggle">📊 Bộ đếm hiệu năng (F3): ' + (PERF.on ? 'đang bật' : 'đang tắt') + '</button></div><div class="gfx-actions"><button class="btn2" data-act="gfxAuto">⚙ Tự điều chỉnh</button><button class="btn2" data-act="gfxRecover">↻ Khôi phục hình ảnh</button></div><h3>Khác</h3><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn2" data-act="showHelp">📖 Hướng dẫn chơi</button><button class="btn2" data-act="newGame">🏯 Ván mới (về màn chọn nước)</button><button class="btn2" data-act="close">▶ Tiếp tục chơi</button></div>';
  h += '<p class="hint" style="margin-top:12px">Phím tắt: Cách = tạm dừng · 1/2/3 = tốc độ x1/x2/x4 · T Triều chính · Q Quân vụ · E Thiên hạ · L Sổ sách · B Giao thương · V Quan viên · W A S D hoặc mũi tên = trượt bản đồ (Shift nhanh) · H về phủ · G lưới · Esc bỏ chọn.</p>';
  openModal(h, 'mid');
}
ACT.gfxMode = el => { setGfxMode(el.dataset.m, true); toast('Đồ họa: ' + GFX_MODES[el.dataset.m].n, 'good'); openMenu(); };
ACT.gfxRecover = () => { recoverGraphics(); closeModal(); toast('Đã khôi phục hình ảnh', 'good'); };
ACT.gfxAuto = () => { GFX.auto = true; lsSet('lt-gfx-user', '0'); PERF.autoN = 0; PERF.autoSum = 0; PERF.autoAfter = 0; setGfxMode(autoGfxMode(), false); openMenu(); };
ACT.perfToggle = () => { perfSet(!PERF.on); if (PERF.on) perfRender(); openMenu(); };
ACT.saveSlot = el => { const ok = LT.saveSlot(G, el.dataset.s); toast(ok ? 'Đã lưu ván' : 'Không lưu được (bộ nhớ trình duyệt bị chặn?)', ok ? 'good' : 'bad'); openMenu(); };
ACT.loadSlot = el => { const g2 = LT.loadSlot(el.dataset.s); if (!g2) { toast(LT.lastLoadError || 'Không tải được bản lưu', 'bad'); return; } closeModal(); startGame(g2); toast('Đã tải ván', 'good'); };
ACT.newGame = () => { closeModal(); showStart(); };
function showHelp() {
  openModal('<div class="head"><h2>📖 Cách chơi</h2><button class="x" data-act="close">✕</button></div>' +
    '<p>Bạn là <b>tri huyện</b> vừa nhậm chức năm 917. Mục tiêu: làm tốt để được <b>thăng Thứ sử → Phòng ngự sứ</b> (mốc chiến thắng của bản chơi), đồng thời không bị bãi chức.</p>' +
    '<h3>Vòng chơi</h3><p>1) <b>Xây:</b> chọn công trình ở thanh dưới, bấm lên bản đồ (đường và tường kéo chuột được). Công trình cần <b>nối đường</b> tới kho/chợ trong 8 ô, cần <b>hộ dân</b> làm việc — hộ cần <b>nhà ở</b>.<br>2) <b>Nuôi dân:</b> lương, muối, vải, rượu, trà… cho các tầng lớp; xem 📒 Sổ sách để biết vì sao con số đổi.<br>3) <b>Lịch năm:</b> tháng 6 hạ thuế (tiền) · tháng 9 gặt · tháng 11 thu thuế (thóc) · tháng 12 <b>khảo khóa</b> chấm 5 mục × 20 điểm. Phải nộp thượng cung và lưu sứ.<br>4) <b>Giặc đến:</b> mộ quân ở Quân doanh, bày trận 3×3 trong ⚔️ Quân vụ, chọn trận hình và lệnh ba giai đoạn; xem ước tính tỉ lệ thắng trước khi xuất trận.<br>5) <b>Biến cố</b> hiện ra khi cần quyết: mỗi cách đổi chỉ số này lấy chỉ số kia.</p>' +
    '<h3>Thua khi</h3><p>Hai năm liền khảo khóa dưới 40 · nghi kỵ của triều đình ≥ 85 · thành bị phá khi thành phòng quá yếu · dân bỏ đi hết.</p>' +
    '<button class="btn" data-act="close">Đã hiểu</button>');
}
ACT.showHelp = showHelp;

// ============================== MÀN MỞ ĐẦU ======================================================
function showStart() {
  const el = $('start'); el.style.display = 'block'; UI.pickNat = UI.pickNat != null ? UI.pickNat : 3;
  const saves = ['auto', 'm1', 'm2', 'm3'].map(s => [s, LT.slotMeta(s)]).filter(x => x[1]);
  const oldSaves = LT.hasOldSaves();
  let h = '<div class="inner"><div class="sub">NGŨ ĐẠI · THẬP QUỐC · NĂM 917</div><h1>Loạn Thế Lập Quốc</h1><p class="lead">Nhà Đường đã mất; thiên hạ chia mười hai nước. Bạn là một <b>tri huyện</b> vừa nhậm chức: tự tay đắp đường, dựng nhà, lo lương, thu thuế, giữ trị an, luyện quân đánh giặc. Làm tốt thì được thăng <b>Thứ sử</b>, rồi <b>Phòng ngự sứ</b>. Chọn nước của bạn — cũng là chọn độ khó.</p>';
  h += '<div class="ngrid">' + LT.NATIONS.map(n => '<button class="nation ' + (UI.pickNat === n.id ? 'on' : '') + '" data-act="pickNat" data-id="' + n.id + '"><span class="df" data-d="' + n.diff + '">' + n.diff + '</span><b>' + n.n + '</b><br><span class="mut">' + n.cap + ' · ' + n.cities + ' thành · ' + n.chr + '</span><br>👍 ' + n.str + '<br>👎 ' + n.weak + '</button>').join('') + '</div>';
  const pn = LT.NATIONS[UI.pickNat];
  h += '<div class="box" style="margin-top:12px"><b class="gold">' + pn.n + ' (' + pn.diff + ')</b> — ' + LT.NATION_PERKS[pn.id] + '</div>';
  h += '<div style="display:flex;gap:12px;align-items:center;justify-content:center;margin:16px 0;flex-wrap:wrap"><label>Tên của bạn: <input id="inName" class="inp" maxlength="18" value="' + esc(UI.pname || 'Lý Văn Tín') + '" style="width:190px"></label><button class="btn" id="go" data-act="startGame" style="padding:12px 30px;font-size:14px">Nhậm chức tri huyện →</button></div>';
  if (saves.length) h += '<div style="text-align:center" class="hint">Ván đã lưu: ' + saves.map(s => '<button class="btn2" data-act="loadSlot" data-s="' + s[0] + '">' + (s[0] === 'auto' ? 'Tự lưu' : 'Ô ' + s[0].slice(1)) + ' · ' + s[1].nation + ' · năm ' + s[1].year + '</button>').join(' ') + '</div>';
  if (oldSaves) h += '<div class="hint warnc" style="text-align:center;margin-top:8px">⚠ Có bản lưu của phiên bản trước (lưới nhỏ hơn). Bản lưu đó không tương thích với bản mới (lưới 96×96, 120 thành, quân từ dân) nên không tải được — hãy bắt đầu ván mới.</div>';
  h += '<div class="hint" style="text-align:center;margin-top:12px">Kéo chuột: di chuyển · Cuộn: thu phóng · Cách: tạm dừng · Chú giải hiện khi rê chuột.</div></div>';
  el.innerHTML = h; bindActs(el);
  $('inName').oninput = e => { UI.pname = e.target.value; };
}
ACT.pickNat = el => { UI.pname = $('inName').value; UI.pickNat = +el.dataset.id; showStart(); };
ACT.startGame = () => { const nm = ($('inName').value || 'Vô danh').trim().slice(0, 18) || 'Vô danh'; UI.pname = nm; $('start').style.display = 'none'; startGame(LT.newGame(UI.pickNat, nm, (Date.now() % 100000) + 17), true); };

// ============================== KHẢO KHÓA, THĂNG CHỨC, KẾT THÚC ================================
function showKhao(rec) {
  G.speed = 0; const pr = LT.promotion(G);
  let h = '<div class="head"><div><div class="kick" style="margin:0">KHẢO KHÓA THÁNG 12 · NĂM ' + rec.year + '</div><h2>Bảng điểm triều đình chấm</h2></div></div>';
  h += '<div style="display:flex;gap:22px;align-items:center;flex-wrap:wrap"><div style="text-align:center"><div class="bigscore">' + f1(rec.total) + '</div><div class="hint">/ 100</div><div class="tag ' + (rec.gid === 'thuong' ? 'g' : rec.gid === 'phat' ? 'r' : 'y') + '" style="font-size:12px;margin:6px 0 0">' + rec.grade + '</div></div><div style="flex:1;min-width:300px">';
  for (const m of LT.KHAO_MUC) { const v = rec.scores[m.id]; h += '<div class="score5" data-tip="' + esc(m.d) + '"><b>' + m.n + '</b>' + bar(v, 20, colorOf(v, 20)) + '<b class="r">' + f1(v) + '/20</b></div>'; }
  h += '</div></div>';
  const weak = LT.KHAO_MUC.slice().sort((a, b) => rec.scores[a.id] - rec.scores[b.id])[0];
  const d = rec.details;
  h += '<h3>Chi tiết</h3><p class="hint">Hộ khẩu ' + (d.growth >= 0 ? 'tăng ' : 'giảm ') + Math.abs(Math.round(d.growth * 100)) + '% so với đầu năm · đã nộp ' + fm(d.paid) + '/' + fm(d.quota) + ' quan định mức · kho lương đủ ' + Math.round(d.weeks) + ' tuần · công trình công ' + Math.round(d.pts) + '/' + Math.round(d.scale) + ' điểm. <b>Mục yếu nhất: ' + weak.n + '</b> (' + esc(weak.d) + ')</p>';
  h += '<h3>Hậu quả</h3><ul style="margin:4px 0;padding-left:18px">' + rec.eff.map(e => '<li>' + esc(e) + '</li>').join('') + '</ul>';
  h += '<div style="margin-top:12px;display:flex;gap:8px">';
  if (pr && pr.ready && !G.over) h += '<button class="btn" data-act="goPromo">Xin thăng ' + pr.name + '</button>';
  else if (pr && pr.needExam && !G.over) h += '<button class="btn" data-act="goExam">Dự kỳ Tỉnh thí</button>';
  h += '<button class="btn2" data-act="khaoDone">Đóng</button></div>';
  openModal(h, 'mid', false);
}
ACT.khaoDone = () => { closeModal(); };
function showNotice() {
  const n = G.pendingNotice; G.pendingNotice = null; G.speed = 0;
  openModal('<div style="text-align:center"><div style="font-size:48px">⚠️</div><h2>' + esc(n.title) + '</h2></div><p>' + esc(n.text) + '</p><div style="text-align:center"><button class="btn" data-act="close">Đã rõ</button></div>', '', false);
}
function showPromo() {
  const p = G.pendingPromo; G.pendingPromo = null; G.speed = 0;
  openModal('<div style="text-align:center"><div style="font-size:52px">' + (p.rank === 3 ? '👑' : '🎖️') + '</div><h2>Thăng ' + LT.RANKS[p.rank].n + '!</h2><p>' + esc(p.text) + '</p><button class="btn" data-act="close">Nhận chức</button></div>', '', false);
}
function showOver() {
  const o = G.over; G.speed = 0; if (UI.overShown) return; UI.overShown = true;
  const win = o.win;
  openModal('<div style="text-align:center"><div style="font-size:52px">' + (win ? '🏆' : '💀') + '</div><h2>' + esc(o.title) + '</h2><p>' + esc(o.text) + '</p><p class="hint">Năm ' + G.year + ' · ' + LT.RANKS[G.rank].n + ' · ' + LT.totalHo(G) + ' hộ · khảo khóa tốt nhất ' + (G.khao.history.length ? Math.max(...G.khao.history.map(h => h.total)) : '—') + '</p><div style="display:flex;gap:8px;justify-content:center"><button class="btn" data-act="newGame">Chơi ván mới</button><button class="btn2" data-act="loadAuto">Tải bản tự lưu</button></div></div>', '', false);
}
ACT.loadAuto = () => { const g2 = LT.loadSlot('auto'); if (!g2) { toast('Chưa có bản tự lưu', 'bad'); return; } UI.overShown = false; closeModal(); startGame(g2); };
function showVictory() {
  G.speed = 0; openModal('<div style="text-align:center"><div style="font-size:52px">🏆</div><h2>Hoàn thành sự nghiệp!</h2><p>Từ một viên tri huyện, bạn đã lên <b>Phòng ngự sứ</b> — mốc cao nhất của bản chơi này. Bạn có thể tiếp tục để giữ vững đến năm 979, thử thách chiến trận và ngoại giao.</p><button class="btn" data-act="close">Chơi tiếp</button></div>', '', false);
}

// ============================== BIẾN CỐ ==================================================
function showEvent() {
  const pe = G.pendingEvent; if (!pe) return; G.speed = 0;
  const e = LT.EVENT(pe.id);
  let h = '<div class="kick">BIẾN CỐ · ' + LT.fmtDate(G).toUpperCase() + '</div><div class="head"><h2>' + e.icon + ' ' + e.title + '</h2></div><p>' + esc(e.text(G)) + '</p>';
  e.opts.forEach((o, i) => { const err = o.can ? o.can(G) : ''; h += '<button class="opt" data-act="evChoose" data-i="' + i + '"' + (err ? ' disabled' : '') + '><b>' + (i + 1) + '. ' + esc(o.label) + '</b><small>' + esc(o.desc) + '</small>' + (err ? '<span class="err">' + esc(err) + '</span>' : '') + '</button>'; });
  openModal(h, '', false);
}
ACT.evChoose = el => {
  const r = LT.chooseEvent(G, +el.dataset.i); if (!r) return; if (!r.ok) { toast(r.err, 'bad'); return; }
  openModal('<div class="kick">KẾT QUẢ</div><h2>' + esc(r.title) + '</h2><p><b>' + esc(r.label) + '</b></p><p>' + esc(r.text) + '</p><button class="btn" data-act="close">Tiếp tục</button>', '', false); ui();
};

// ============================== THI TỈNH THÍ (rút gọn) ====================================
function showExam() {
  const ex = UI.exam, st = ex.step; let body = '';
  if (st === 0) {
    body += '<p class="hint">Kinh nghĩa (30 điểm): 6 câu × 5 điểm, lấy từ chính luật chơi — ai hiểu thuế, mùa vụ, khắc chế binh chủng thì làm tốt.</p>';
    ex.kn.forEach((q, i) => { body += '<div class="box" style="margin:6px 0"><b>' + (i + 1) + '. ' + esc(q.q) + '</b><div class="radio" style="margin-top:6px">' + q.o.map((o, j) => '<button class="btn2 ' + (ex.ans[i] === j ? 'on' : '') + '" data-act="exKn" data-i="' + i + '" data-j="' + j + '">' + esc(o) + '</button>').join('') + '</div></div>'; });
    body += '<button class="btn" data-act="exNext" ' + (ex.ans.filter(x => x != null).length < ex.kn.length ? 'disabled' : '') + '>Sang phần Phán →</button>';
  } else if (st === 1) {
    body += '<p class="hint">Phán (30 điểm): chọn phán quyết cho hai vụ án. Chấm theo đúng luật, hợp tình và hậu quả.</p>';
    ex.an.forEach((c, i) => { body += '<div class="box" style="margin:6px 0"><b>Vụ ' + (i + 1) + ':</b> ' + esc(c.t) + '<div style="margin-top:6px">' + c.o.map((o, j) => '<button class="opt ' + (ex.pans[i] === j ? 'on' : '') + '" data-act="exAn" data-i="' + i + '" data-j="' + j + '" style="' + (ex.pans[i] === j ? 'border-color:var(--gold2)' : '') + '"><small>' + esc(o[0]) + '</small></button>').join('') + '</div></div>'; });
    body += '<button class="btn" data-act="exNext" ' + (ex.pans.filter(x => x != null).length < ex.an.length ? 'disabled' : '') + '>Sang phần Sách luận →</button>';
  } else if (st === 2) {
    body += '<p class="hint">Sách luận (40 điểm): ' + esc(LT.EXAM_SL.t) + ' Điểm = số hộ còn lại (40%) + dân tâm (30%) + kho và nợ (30%) sau một năm mô phỏng.</p><div class="grid2">';
    LT.EXAM_SL.p.forEach((p, i) => { const on = ex.picks.includes(i); body += '<button class="opt" data-act="exSl" data-i="' + i + '" style="' + (on ? 'border-color:var(--gold2);background:#3d5a45cc' : '') + '"><b>' + (on ? '✔ ' : '') + esc(p.n) + '</b></button>'; });
    body += '</div><div class="hint">Đã chọn ' + ex.picks.length + '/3</div><button class="btn" data-act="exNext" ' + (ex.picks.length !== 3 ? 'disabled' : '') + '>Nộp bài</button>';
  } else {
    const r = LT.gradeExam(ex); ex.res = r;
    body += '<div style="text-align:center"><div class="bigscore">' + r.total + '</div><div class="hint">/ 100 — cần 65 để đỗ</div><div class="tag ' + (r.pass ? 'g' : 'r') + '" style="font-size:13px;margin-top:8px">' + (r.pass ? 'ĐỖ' : 'TRƯỢT') + '</div></div><table class="t2" style="margin:10px 0"><tr><td>Kinh nghĩa</td><td class="r">' + r.kn + '/30</td></tr><tr><td>Phán</td><td class="r">' + r.an + '/30</td></tr><tr><td>Sách luận</td><td class="r">' + r.sl + '/40</td></tr></table>';
    if (r.pass) { G.khao.passed = true; if (ex.first && !G.khao.examTried) { G.player.thanhdanh = Math.min(100, G.player.thanhdanh + 5); body += '<p class="pos">Đỗ ngay lần đầu: Thanh danh +5.</p>'; } G.khao.examTried = true; body += '<button class="btn" data-act="close">Đóng</button> <button class="btn2" data-act="openCourtQuanlo">Xem điều kiện thăng chức</button>'; }
    else { G.khao.examTried = true; body += '<p class="hint">Trượt thì thi lại ngay, không bị phạt; mỗi lần ra đề mới.</p><button class="btn" data-act="goExam">Thi lại</button> <button class="btn2" data-act="close">Để sau</button>'; }
  }
  openModal('<div class="head"><div><div class="kick" style="margin:0">TỈNH THÍ · KHOA TIẾN SĨ · phần ' + (Math.min(st, 2) + 1) + '/3</div><h2>🎓 Kỳ thi Tỉnh thí</h2></div><button class="x" data-act="close">✕</button></div>' + body, 'mid', true);
}
ACT.exKn = el => { UI.exam.ans[+el.dataset.i] = +el.dataset.j; showExam(); };
ACT.exAn = el => { UI.exam.pans[+el.dataset.i] = +el.dataset.j; showExam(); };
ACT.exSl = el => { const ex = UI.exam, i = +el.dataset.i, k = ex.picks.indexOf(i); if (k >= 0) ex.picks.splice(k, 1); else if (ex.picks.length < 3) ex.picks.push(i); showExam(); };
ACT.exNext = () => { UI.exam.step++; showExam(); };

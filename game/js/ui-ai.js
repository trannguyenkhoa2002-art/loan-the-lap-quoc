'use strict';
// ============================================================================
// GIAI ĐOẠN 4 — GIAO DIỆN: thông tin nước (tham vọng, quan hệ, phe phái, biến cố), bảng ngoại giao, biên niên đọc được,
// viện trợ / cấm vận, đồn trú thành mới chiếm. Gọn, tiếng Việt, không dùng confirm() gốc.
// ============================================================================
const AI_FN = { huancuu: 'Huân cựu võ thần', vanthan: 'Văn thần khoa bảng', ngoaithich: 'Ngoại thích', noithan: 'Nội thần' };
const CHRON_K = { all: 'Tất cả', war: '⚔️ Chiến sự', pact: '🤝 Minh ước', peace: '🕊️ Hòa', betray: '🗡️ Bội ước', coup: '🏴 Binh biến', dyn: '👑 Đổi triều', rebel: '🔥 Nổi loạn', econ: '💰 Kinh tế' };
const AMB_ICON = { 'bành trướng': '⚔', 'giữ đất': '🏯', 'buôn bán': '💰', 'sinh tồn': '🌱' };
const trustTxt = t => t >= .7 ? 'giữ chữ tín' : t >= .45 ? 'tùy lợi' : 'hay bội ước';
const shortN = i => { const n = LT.natName(G, i); return n.length > 9 ? n.slice(0, 8) + '…' : n; };
function aiNatInfo(sel) {
  const w = G.world, ai = w.ai; if (!ai || sel >= 12) return '';
  const A = ai.n[sel], ns = w.ns[sel], B = LT.AI_AMB[A.amb], self = sel === G.nation, t = G.tick;
  let h = '<h3>🧭 Tham vọng & triều đình</h3><div class="box"><b>Tham vọng: <span class="gold">' + AMB_ICON[A.amb] + ' ' + A.amb + '</span></b><div class="hint">' + B.d + '. Chữ tín: <b>' + trustTxt(A.tr) + '</b> (' + Math.round(A.tr * 100) + '%).</div>';
  if (ns.alive) {
    h += '<div class="flowrow"><span>Quân dã chiến + đồn trú</span><b>' + LT.fmtN(ns.troops) + ' / ' + LT.fmtN(LT.natMaxTroops(G, sel)) + '</b></div><div class="flowrow"><span>Quốc khố</span><b class="' + (A.gold < 0 ? 'neg' : '') + '">' + Math.round(A.gold) + ' quan</b></div>';
    if (!self) {
      const C = A.court; h += '<div class="flowrow"><span>Vua ' + esc(C.king.name) + ' (' + C.king.age + ' tuổi)' + (C.king.puppet ? ' <span class="tag y">bù nhìn</span>' : '') + '</span><b>nhà ' + esc(A.sur) + ' đời ' + A.dyn + '</b></div>';
      if (A.crisis && A.crisis.until > t) h += '<div class="hint neg">⚠ Đang ' + esc(A.crisis.kind) + ' (còn khoảng ' + Math.ceil((A.crisis.until - t) / 3) + ' tháng): nước này không đánh ngoài được, là lúc để can thiệp hoặc thừa cơ.</div>';
      h += '<div class="hint" style="margin-top:4px">Phe phái trong triều (thế lực / thái độ với vua):</div>';
      for (const f in C.f) { const x = C.f[f]; h += '<div class="flowrow"><span>' + AI_FN[f] + '</span><b class="' + (x.att >= 10 ? 'pos' : x.att < -5 ? 'neg' : '') + '">' + Math.round(x.power) + ' / ' + (x.att >= 0 ? '+' : '') + Math.round(x.att) + '</b></div>'; }
    } else h += '<div class="hint">Đây là nước bạn đang phục vụ: triều đình của nó xem ở Triều chính → Phe phái.</div>';
  }
  h += '</div>';
  if (ns.alive) {
    const rows = [];
    for (const x of ai.wars) { if (x.a === sel || x.b === sel) { const o = x.a === sel ? x.b : x.a; rows.push('⚔️ Đang đánh <b>' + esc(LT.natName(G, o)) + '</b> (' + ((t - x.since) / 36).toFixed(1).replace('.', ',') + ' năm; ' + esc(x.why) + ')'); } }
    if (ai.wp[sel]) rows.push('⚔️ Đang có chiến sự với <b>bạn</b>: ' + esc(ai.wp[sel].why));
    for (const p of ai.pacts) { if (p.a !== sel && p.b !== sel) continue; const o = p.a === sel ? p.b : p.a, left = Math.max(0, Math.round((p.until - t) / 36 * 10) / 10), nm = esc(LT.natName(G, o)); rows.push(p.k === 'minh' ? '🤝 Đồng minh <b>' + nm + '</b> (còn ' + left + ' năm)' : p.k === 'hoa' ? '🕊️ Đình chiến với <b>' + nm + '</b> (còn ' + left + ' năm)' : p.k === 'cong' ? (p.a === sel ? '💰 Nhận cống của <b>' + nm + '</b>' : '💰 Nộp cống cho <b>' + nm + '</b>') + ' (còn ' + left + ' năm)' : (p.a === sel ? '👑 Chủ của chư hầu <b>' + nm + '</b>' : '👑 Chư hầu của <b>' + nm + '</b>')); }
    for (const e of ai.emb) { if (e.a === sel) rows.push('⛔ Cấm vận ' + (e.b === 12 ? '<b>bạn</b>' : '<b>' + esc(LT.natName(G, e.b)) + '</b>') + ' (' + esc(e.why) + ')'); else if (e.b === sel) rows.push('⛔ Bị ' + (e.a === 12 ? '<b>bạn</b>' : '<b>' + esc(LT.natName(G, e.a)) + '</b>') + ' cấm vận'); }
    if (ai.coal && ai.coal.target === sel) rows.push('🛡️ Là mục tiêu của <b>liên quân</b> ' + ai.coal.members.map(m => esc(LT.natName(G, m))).join(', ')); else if (ai.coal && ai.coal.members.indexOf(sel) >= 0) rows.push('🛡️ Thành viên liên quân chống <b>' + esc(LT.natName(G, ai.coal.target)) + '</b>');
    h += '<h3>Quan hệ & giao ước</h3>' + (rows.length ? rows.map(r => '<div class="hint" style="margin:3px 0">' + r + '</div>').join('') : '<div class="hint">Chưa ràng buộc với ai: đang đứng một mình.</div>');
    if (!self) {
      const m = ai.pm[sel]; h += '<h3>Ký ức về bạn</h3><div class="flowrow"><span>Ơn nghĩa bạn đã làm (viện trợ, lễ vật)</span><b class="pos">' + Math.round(m.fav) + '</b></div><div class="flowrow"><span>Mối hận (đánh, cấm vận, chiếm thành, tuyệt giao)</span><b class="' + (m.gr > 30 ? 'neg' : '') + '">' + Math.round(m.gr) + '</b></div><div class="flowrow"><span>Lần bạn bội giao ước / tuyệt giao</span><b>' + m.br + '</b></div>';
      h += '<h3>Viện trợ & cấm vận</h3><div class="hint">Công cụ ngoại giao không cần đao binh: viện trợ mua quan hệ và ổn định cho họ; cấm vận cắt thương lộ, hàng đặc sản của họ khan hiếm và đắt ở chợ bạn.</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:5px"><button class="btn2" data-act="aidGo" data-k="tien" data-tip="Quan hệ +10, ổn định +3">🎁 Viện trợ 100 quan</button><button class="btn2" data-act="aidGo" data-k="luong" data-tip="Quan hệ +12, ổn định +4">🌾 Viện trợ 200 thạch lương</button>' + (LT.aiEmbargoOn(G, sel) ? '<button class="btn2 on" data-act="embGo" data-on="0">⛔ Đang cấm vận — dỡ bỏ</button>' : '<button class="btn2" data-act="embGo" data-on="1" data-tip="Quan hệ −12; hủy thông thương; 4 năm">⛔ Cấm vận nước này</button>') + '</div>';
      if (LT.aiEmbargoBy(G, sel)) h += '<div class="hint neg">Nước này đang cấm vận bạn: thương lộ qua đây bị chặn. Viện trợ có thể làm họ dịu lại.</div>';
    }
    const sp = (LT.REGION[sel] ? LT.REGION[sel].du : []).map(k => LT.GOODS[k] ? LT.GOODS[k].n : k).join(', ');
    h += '<div class="hint" style="margin-top:6px">Đặc sản: <b>' + (sp || 'không có') + '</b>' + (LT.REGION[sel] && LT.REGION[sel].thieu.length ? ' · thiếu: ' + LT.REGION[sel].thieu.map(k => LT.GOODS[k] ? LT.GOODS[k].n : k).join(', ') : '') + '</div>';
  }
  if (A.nev.length) h += '<h3>Biến cố gần đây ở nước này</h3>' + A.nev.slice(0, 5).map(e => '<div class="hint" style="margin:3px 0"><b class="mut">' + e.y + '</b> ' + esc(e.t) + '</div>').join('');
  return h;
}
ACT.aidGo = el => { const r = LT.aiAid(G, UI.natSel, el.dataset.k); toast(r.ok ? r.text : r.err, r.ok ? 'good' : 'bad'); renderWorld(); ui(); };
ACT.embGo = el => { const r = LT.aiEmbargoPlayer(G, UI.natSel, el.dataset.on === '1'); toast(r.ok ? r.text : r.err, r.ok ? '' : 'bad'); renderWorld(); ui(); };
ACT.chronF = el => { UI.chronF = el.dataset.k; renderWorld(); };
function chronHtml(max) {
  const f = UI.chronF || 'all', sel = UI.natSel;
  const list = G.world.chron.filter(c => f === 'all' || c.k === f).slice(0, max);
  return '<div class="radio" style="margin-bottom:6px">' + Object.keys(CHRON_K).map(k => '<button class="btn2 ' + (f === k ? 'on' : '') + '" data-act="chronF" data-k="' + k + '">' + CHRON_K[k] + '</button>').join('') + '</div>' +
    (list.length ? list.map(c => '<div class="flowrow"><span><b class="mut">' + c.y + '</b> ' + esc(c.t) + '</span></div>').join('') : '<div class="hint">Chưa có việc nào thuộc loại này.</div>');
}
function aiRelCell(i, j) {
  const w = G.world, ai = w.ai;
  if (i === j) return '<td class="mut" style="text-align:center">—</td>';
  if (j === 12) { const sym = ai.wp[i] ? '⚔️' : ''; return '<td style="text-align:center">' + sym + '</td>'; }
  const al = ai.pacts.find(p => p.k === 'minh' && ((p.a === i && p.b === j) || (p.a === j && p.b === i))), ce = ai.pacts.find(p => ((p.k === 'chu' || p.k === 'cong') && ((p.a === i && p.b === j) || (p.a === j && p.b === i)))), tr = ai.pacts.find(p => p.k === 'hoa' && ((p.a === i && p.b === j) || (p.a === j && p.b === i)));
  const war = ai.wars.some(x => (x.a === i && x.b === j) || (x.a === j && x.b === i)), em = ai.emb.some(e => (e.a === i && e.b === j));
  const o = Math.round(ai.o[i * 12 + j]);
  const sym = war ? '⚔️' : al ? '🤝' : ce ? (ce.k === 'chu' ? (ce.a === i ? '👑' : '🙇') : (ce.a === i ? '💰' : '💸')) : tr ? '🕊️' : '', col = o >= 25 ? '#8fd47a' : o <= -25 ? '#e0705f' : '#d6c88a';
  return '<td style="text-align:center;color:' + col + '" data-tip="' + esc(LT.natName(G, i) + ' nghĩ về ' + LT.natName(G, j) + ': ' + o + (war ? ' (đang đánh nhau)' : '') + (em ? ' (đang cấm vận)' : '')) + '">' + (sym || o) + (em ? '⛔' : '') + '</td>';
}
function worldDiplo() {
  const w = G.world, ai = w.ai; if (!ai) return '<p class="mut">Chưa có dữ liệu ngoại giao.</p>';
  const ids = []; for (let i = 0; i < 12; i++) if (w.ns[i].alive) ids.push(i);
  let h = '<p class="hint">Mỗi ô là điều <b>hàng</b> nghĩ về <b>cột</b> (−100…+100): số = quan hệ; ⚔️ đang đánh nhau · 🤝 đồng minh · 🕊️ đình chiến · 👑 chủ / 🙇 chư hầu · 💰 nhận cống / 💸 nộp cống · ⛔ cấm vận. Hàng cuối là các nước nghĩ về <b>bạn</b>' + (LT.aiEntity12(G) ? ' (bạn đã được coi như một nước)' : '') + '. Rê chuột vào ô để đọc chi tiết.</p>';
  h += '<div style="overflow:auto"><table class="t2" style="font-size:11px"><tr><th></th>' + ids.map(j => '<th style="writing-mode:vertical-rl;white-space:nowrap">' + esc(shortN(j)) + '</th>').join('') + '<th>Bạn</th></tr>';
  for (const i of ids) h += '<tr><td><a href="#" data-act="selNat" data-id="' + i + '"><b>' + esc(shortN(i)) + '</b></a> <span class="mut" data-tip="' + esc('Tham vọng: ' + ai.n[i].amb) + '">' + AMB_ICON[ai.n[i].amb] + '</span></td>' + ids.map(j => aiRelCell(i, j)).join('') + '<td style="text-align:center;color:' + (w.rel[i] >= 25 ? '#8fd47a' : w.rel[i] <= -25 ? '#e0705f' : '#d6c88a') + '">' + (ai.wp[i] ? '⚔️' : (G.treaties.lienminh.indexOf(i) >= 0 ? '🤝' : Math.round(w.rel[i]))) + (LT.aiEmbargoBy(G, i) ? '⛔' : '') + '</td></tr>';
  h += '</table></div><div class="hint">Biểu tượng sau tên = tham vọng: ⚔ bành trướng (hay tuyên chiến) · 🏯 giữ đất · 💰 buôn bán (hay cấm vận, viện trợ) · 🌱 sinh tồn (tìm đồng minh). Bấm tên một nước để xem phe phái, ký ức và biến cố.</div>';
  const st = ai.stat;
  h += '<div class="box" style="margin-top:8px"><b>Thế giới đến nay:</b> ' + st.war + ' cuộc chiến · ' + st.peace + ' hòa ước · ' + st.alliance + ' liên minh · ' + st.betray + ' lần bội ước · ' + st.coup + ' binh biến · ' + st.dyn + ' lần đổi triều · ' + st.rebel + ' vụ nổi loạn · ' + st.restore + ' lần phục quốc · ' + st.embargo + ' cấm vận · ' + st.aid + ' viện trợ.' + (ai.coal ? '<br>🛡️ <b>Liên quân đang chống ' + esc(LT.natName(G, ai.coal.target)) + '</b> (' + ai.coal.members.map(m => esc(LT.natName(G, m))).join(', ') + ').' : '') + '</div>';
  const wl = ai.wars.map(x => '<div class="hint">⚔️ <b>' + esc(LT.natName(G, x.a)) + '</b> đánh <b>' + esc(LT.natName(G, x.b)) + '</b> từ năm ' + (G.year - Math.floor((G.tick - x.since) / 36)) + ': ' + esc(x.why) + ' (chiếm thành: ' + x.sa + ' / ' + x.sb + ')</div>').join('');
  h += '<h3>Chiến tranh đang diễn ra (' + (ai.wars.length + Object.keys(ai.wp).length) + ')</h3>' + (wl || '') + Object.keys(ai.wp).map(k => '<div class="hint neg">⚔️ <b>' + esc(LT.natName(G, +k)) + '</b> đang có chiến sự với <b>bạn</b>: ' + esc(ai.wp[k].why) + '</div>').join('') + (!wl && !Object.keys(ai.wp).length ? '<div class="hint">Thiên hạ tạm yên.</div>' : '');
  h += '<h3>Biên niên thiên hạ</h3>' + chronHtml(40);
  return h;
}
// quy thuận và đồn trú của thành mới chiếm
function occCell(c) {
  if (c.qt == null) return '';
  const need = Math.max(20, Math.round(c.ho * .04)), low = c.qt < 40, thin = c.gar < need;
  return '<div class="hint ' + (low && thin ? 'neg' : '') + '" data-tip="' + esc('Quy thuận tăng mỗi tuần khi dân bớt khổ (khoan thuế, nông nghiệp) và có đồn trú đủ ' + need + ' quân. Thấp mà thiếu đồn trú thì dân nổi loạn, quay về chủ cũ.') + '">🏳️ Quy thuận <b>' + Math.round(c.qt) + '</b>/70 · đồn ' + c.gar + '/' + need + (thin ? ' <button class="btn2" data-act="garGo" data-id="' + c.id + '" data-n="' + Math.max(30, need - c.gar) + '">+ đồn trú ' + Math.max(30, need - c.gar) + '</button>' : '') + '</div>';
}
ACT.garGo = el => { const r = LT.garrison(G, +el.dataset.id, +el.dataset.n); toast(r.ok ? r.text : r.err, r.ok ? 'good' : 'bad'); renderWorld(); ui(); };

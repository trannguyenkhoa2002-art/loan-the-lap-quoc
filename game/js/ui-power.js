// Giao diện ba con đường quyền lực: tab Thế lực, Phe phái, Thành tựu (trong Triều chính) + bảng mục tiêu mở.
const PWD = [['van', '📜 Văn trị', 'dân sinh, phồn vinh, thuế nộp đủ, khảo khóa, cải cách'], ['chinh', '🎭 Chính trị', 'quan hệ phe phái, người của bạn trong triều, kiểm soát triều đình'], ['quan', '⚔️ Quân sự – Cát cứ', 'binh lực, binh quyền, đất giữ, tự chủ với triều']];
function pwBar(v) { return bar(v, 100, v >= 60 ? 'g' : v >= 35 ? 'y' : 'r'); }
const signed = v => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(1).replace('.', ',');
function courtLuc() {
  const P = LT.pw(G), sc = LT.pwScores(G); let h = '<p class="hint">Ba thước đo luôn tính song song từ việc bạn thật sự làm; không phải chọn lớp nhân vật và có thể đổi hướng bất cứ lúc nào. Di chuột vào lý do để xem điểm cộng trừ.</p><div class="grid3">';
  for (const [k, n, d] of PWD) { const s = sc[k]; h += '<div class="box"><b>' + n + ' <span class="gold">' + s.v + '</span>/100</b>' + pwBar(s.v) + '<div class="hint">' + d + '</div>' + s.parts.map(p => '<div class="flowrow"><span>' + esc(p.t) + '</span><b class="' + (p.v >= 0 ? 'pos' : 'neg') + '">' + signed(p.v) + '</b></div>').join('') + '</div>'; }
  h += '</div>';
  // văn trị: cải cách + trọng thần
  h += '<h3>📜 Văn trị — cải cách hành chính (có đánh đổi)</h3><div class="grid3">';
  for (const id in LT.REFORMS) { const R = LT.REFORMS[id], on = P.rf[id]; h += '<div class="box"><b>' + R.n + '</b><div class="hint">' + R.d + '</div><div class="hint">Tốn ' + LT.costTxt(R.cost) + ' · ' + Math.round(R.dur / 36 * 10) / 10 + ' năm' + (R.rank > 1 ? ' · từ ' + LT.RANKS[R.rank].n : '') + '</div>' + (on ? '<div class="pos">Đang thi hành, còn ' + Math.ceil(on.left / 9) + ' quý</div><button class="btn2" data-act="pwRevoke" data-id="' + id + '">Bãi bỏ</button>' : '<button class="btn2" data-act="pwReform" data-id="' + id + '">Ban hành</button>') + '</div>'; }
  h += '</div><div class="hint">Mở kho chẩn tế nằm ở tab 📜 Bố cáo.</div>';
  h += '<div class="box" style="margin-top:8px"><b>Chức ở triều (song song với chức trấn nhậm ' + LT.RANKS[G.rank].n + '):</b> ' + (LT.TRONG_THAN[P.tt] ? '<span class="gold">' + LT.TRONG_THAN[P.tt].n + '</span> (bổng ' + LT.TRONG_THAN[P.tt].bong + ' quan/quý)' : 'chưa có');
  if (P.tt < 3) { const e = LT.ttCheck(G, P.tt + 1); h += '<div class="hint">Kế tiếp: <b>' + LT.TRONG_THAN[P.tt + 1].n + '</b> — ' + (e ? esc(e) : 'đủ điều kiện (lễ tạ ơn ' + 100 * (P.tt + 1) + ' quan)') + '</div><button class="btn2" data-act="pwTT">Thỉnh chức ' + LT.TRONG_THAN[P.tt + 1].n + '</button>'; }
  h += '</div>';
  // quân sự – cát cứ
  h += '<h3>⚔️ Quân sự – Cát cứ: danh nghĩa với triều đình</h3><div class="grid3">';
  for (const id in LT.PW_STANCE) { const S = LT.PW_STANCE[id]; h += '<div class="box" style="' + (P.stance === id ? 'border-color:#8fb86a' : '') + '"><b>' + S.n + (P.stance === id ? ' ✔' : '') + '</b><div class="hint">' + S.d + '</div>' + (P.stance === id ? '' : '<button class="btn2" data-act="pwStance" data-id="' + id + '">Chọn</button>') + '</div>'; }
  const ns = G.world.ns[G.nation], R = LT.armyCount(G) / Math.max(800, ns.troops * .6);
  h += '</div><div class="hint">Tự chủ với triều: <b>' + Math.round(P.tuchu) + '</b>/100 · binh lực bằng ' + Math.round(R * 100) + '% quân triều · thuế nộp: ' + ({ du: 'đủ', thieu: 'một nửa' }[G.pol.nop] || 'giữ lại') + (P.lord != null ? ' · đang thần phục ' + esc(LT.natName(G, P.lord)) : '') + '. Triều phản ứng theo tương quan: ≥ 60% ngầm thừa nhận; 22–60% chiêu an; thấp mà đã kháng thì thảo phạt. Xưng vương/xưng đế vẫn ở tab 🎖️ Quan lộ.</div>';
  if (G.rank >= 3) { h += '<div class="hint">Đổi chủ: ' + LT.NATIONS.filter(n => n.id !== G.nation && n.id < 12 && G.world.ns[n.id].alive).slice(0, 12).map(n => '<a href="#" data-act="pwDefect" data-id="' + n.id + '">' + esc(n.n) + '</a>').join(' · ') + ' (150 quan lễ vật, quan hệ nước cũ −35, Chính danh −8)</div>'; }
  if (P.log.length) h += '<h3>Nhật ký thế lực</h3>' + P.log.slice(0, 6).map(e => '<div class="hint" style="color:' + (e.k === 'bad' ? '#f0b8a0' : e.k === 'ach' ? '#f2d58a' : e.k === 'good' ? '#b4e08e' : '#9fb3c8') + '">' + e.y + ' T' + e.w + ': ' + esc(e.t) + '</div>').join('');
  return h;
}
function courtPhe() {
  const P = LT.pw(G), C = P.court, ctl = LT.courtControl(G); let h = '<p class="hint">Triều đình ' + esc(LT.natName(G, G.nation)) + ': vua <b>' + esc(C.king.name) + '</b> (' + C.king.age + ' tuổi' + (C.king.puppet ? ', <b class="neg">bù nhìn của bạn</b>' : '') + '). Bốn phe, mỗi phe có thế lực và thái độ với bạn. Kiểm soát triều đình = thế lực các phe thuận bạn + người của bạn trong triều.</p>';
  h += '<div class="box"><b>Kiểm soát triều đình ' + Math.round(ctl * 100) + '%</b>' + pwBar(ctl * 100) + '<div class="hint">Người của bạn trong triều: <b>' + C.agents + '</b>' + (C.agentNames.length ? ' (' + C.agentNames.slice(-4).map(esc).join(', ') + ')' : '') + ' · tội đút lót chưa lộ: ' + C.graft.toFixed(1).replace('.', ',') + ' · lần bị đàn hặc: ' + C.hit + '</div></div>';
  h += '<div class="grid2" style="margin-top:8px">';
  for (const id in LT.COURT_FACTIONS) {
    const F = LT.COURT_FACTIONS[id], f = C.f[id];
    h += '<div class="box"><b>' + F.i + ' ' + F.n + '</b>' + (C.ally[id] ? ' <span class="tag y">đồng minh</span>' : '') + '<div class="hint">' + F.d + '</div><div class="flowrow"><span>Thế lực</span><b>' + Math.round(f.power) + '</b></div>' + bar(f.power, 100, 'y') + '<div class="flowrow"><span>Thái độ với bạn</span><b class="' + (f.att >= 20 ? 'pos' : f.att < -10 ? 'neg' : 'warnc') + '">' + Math.round(f.att) + '</b></div>' + bar(f.att + 100, 200, f.att >= 20 ? 'g' : f.att < -10 ? 'r' : 'y');
    h += '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:5px">' + ['ketgiao', 'danhac', 'muachuoc', 'tiencu', 'lienhon'].map(a => '<button class="btn2" data-act="pwAct" data-a="' + a + '" data-f="' + id + '" data-tip="' + esc(LT.PW_ACTS[a].d + ' Tốn ' + LT.PW_ACTS[a].cost + ' quan.') + '" style="padding:4px 7px;font-size:11px">' + LT.PW_ACTS[a].n + '</button>').join('') + '</div></div>';
  }
  h += '</div><h3>Thao túng triều đình</h3><div class="hint">' + (ctl >= .55 ? 'Bạn đã khống chế được triều đình: có thể đưa việc ra đình nghị (tổng thế lực tán thành so với phản đối).' : 'Cần kiểm soát ≥ 55% mới thao túng được (hiện ' + Math.round(ctl * 100) + '%). Kết giao, tiến cử, mua chuộc để tăng; làm vụng thì bị đàn hặc, giáng chức, thậm chí thảo phạt.') + '</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:5px">';
  for (const k in LT.PW_MANIP) { const M = LT.PW_MANIP[k], v = LT.dinhNghi(G, k); h += '<button class="btn2" data-act="pwManip" data-id="' + k + '" data-tip="' + esc(M.d + ' Đình nghị hiện tại: ' + v.yes + ' tán thành / ' + v.no + ' phản đối.') + '">' + M.n + '</button>'; }
  h += (C.king.puppet ? '<button class="btn2" data-act="pwRestore">Trả quyền cho vua</button>' : '<button class="btn2" data-act="pwPuppet" data-tip="Cần chức Phòng ngự sứ, ≥ 5 người trong triều, kiểm soát ≥ 65%: vua thành bù nhìn, bạn làm quyền thần (không cần xưng đế). Rủi ro bị phản đòn.">Làm quyền thần (vua bù nhìn)</button>') + '</div>';
  if (C.log.length) h += '<h3>Sổ triều đình</h3>' + C.log.slice(0, 8).map(e => '<div class="hint">' + e.y + ' T' + e.w + ': ' + esc(e.t) + '</div>').join('');
  return h;
}
function courtTuu() {
  const P = LT.pw(G); let h = '<p class="hint">Không có điều kiện thắng bắt buộc: đây là các hướng đi. Đạt thì ghi sổ và báo, ván vẫn chơi tiếp; làm được nhiều hướng cùng lúc cũng được.</p><div class="grid2">';
  for (const id in LT.ACH) { const A = LT.ACH[id], got = P.ach[id], pr = A.prog(G); h += '<div class="box" style="' + (got ? 'border-color:#d9b866' : '') + '"><b>' + A.i + ' ' + A.n + (got ? ' <span class="gold">✔ năm ' + got.y + '</span>' : '') + '</b><div class="hint">' + A.d + '</div>' + (got ? '' : bar(Math.min(1, pr.v) * 100, 100, 'y') + '<div class="hint">' + esc(pr.t) + '</div>') + '</div>'; }
  return h + '</div>';
}
const pwDone = (r, ok) => { toast(r.ok ? (r.text || ok) : r.err, r.ok ? 'good' : 'bad'); renderCourt(); ui(); };
ACT.pwReform = el => pwDone(LT.pwReform(G, el.dataset.id), 'Đã ban hành cải cách');
ACT.pwRevoke = el => pwDone(LT.pwRevoke(G, el.dataset.id), 'Đã bãi bỏ');
ACT.pwTT = () => pwDone(LT.pwTrongThan(G), 'Đã nhận chức ở triều');
ACT.pwStance = el => pwDone(LT.pwStance(G, el.dataset.id), 'Đã đổi danh nghĩa');
ACT.pwDefect = el => pwDone(LT.pwDefect(G, +el.dataset.id), 'Đã đổi chủ');
ACT.pwAct = el => pwDone(LT.pwAct(G, el.dataset.a, el.dataset.f), 'Xong');
ACT.pwManip = el => pwDone(LT.pwManip(G, el.dataset.id), 'Xong');
ACT.pwPuppet = () => pwDone(LT.pwPuppet(G), 'Xong');
ACT.pwRestore = () => pwDone(LT.pwRestoreKing(G), 'Đã trả quyền cho vua');
ACT.openCourtLuc = () => openCourt('luc');
ACT.openCourtTuu = () => openCourt('tuu');

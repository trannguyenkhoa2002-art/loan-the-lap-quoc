// ============================================================================
// BA CON ĐƯỜNG QUYỀN LỰC (giai đoạn 3) — CT §4–§9, kế hoạch mục 2 và 4.
//  Văn trị · Chính trị · Quân sự–Cát cứ: ba thước đo luôn tính song song từ hành động thật, không khóa lựa chọn.
//  Triều đình có phe phái (dữ liệu dùng chung được cho nước khác ở giai đoạn 4: LT.newCourt(nation, seed)).
//  Mục tiêu mở: bảng thành tựu; đạt thì báo và ghi sổ, ván vẫn chơi tiếp.
//  Ván không đụng tới tính năng mới (pw.engaged = false) thì không có tác động nào lên trạng thái, không tiêu bộ ngẫu nhiên.
// Logic thuần để chạy được trong Node.
// ============================================================================
(function (g) {
const LT = g.LT = g.LT || {}, clamp = LT.clamp;
const hash = (a, b) => Math.floor(LT.hash(a * 131.7 + b * 17.3 + 5.1) * 100000) / 1000;   // 0..100, xác định, không động tới bộ ngẫu nhiên của ván

LT.COURT_FACTIONS = {
  huancuu:   { n: 'Huân cựu võ thần', i: '🗡️', d: 'Muốn chiến tranh, quân phí cao, phân quyền cho tướng. Mạnh ở quân đội và các trấn.' },
  vanthan:   { n: 'Văn thần khoa bảng', i: '📚', d: 'Muốn tập quyền, thuế vừa, mở khoa thi. Mạnh ở triều đình và ngôn luận.' },
  ngoaithich:{ n: 'Ngoại thích', i: '👑', d: 'Giữ vua hiện tại, quyền cho họ hàng hoàng hậu. Mạnh ở hậu cung và kinh đô.' },
  noithan:   { n: 'Nội thần', i: '🕯️', d: 'Hoạn quan, cận thần: chuyên quyền nhân danh vua. Mạnh ở cung cấm và tin tức.' },
};
const KING_N = ['Lưu', 'Chu', 'Lý', 'Trần', 'Vương', 'Triệu', 'Mã', 'Cao'], KING_G = ['Nhân Thiện', 'Tông Hiến', 'Văn Hựu', 'Hoằng Tín', 'Quang Nghiệp', 'Thừa Tự', 'Tung Hiếu'];
// triều đình của một nước (dữ liệu thuần; giai đoạn 4 gọi lại cho nước khác)
LT.newCourt = function (nation, seed) {
  const h = i => hash((seed || 7) + nation * 31, i), f = {}; let k = 0;
  for (const id in LT.COURT_FACTIONS) { f[id] = { power: Math.round(18 + h(k) * .42), att: Math.round(h(k + 9) * .3 - 12), bias: 0 }; k++; }
  return { king: { name: KING_N[Math.floor(h(20) / 12.6)] + ' ' + KING_G[Math.floor(h(21) / 14.3)], age: 24 + Math.floor(h(22) * .45), puppet: false }, f, agents: 0, agentNames: [], graft: 0, hit: 0, manip: 0, ally: {}, cool: {}, cutUntil: 0, ctlQ: 0, log: [] };
};
LT.pwDefault = (nation, seed) => ({ court: LT.newCourt(nation, seed), engaged: false, stance: 'trung', tuchu: 12, lord: null, tt: 0, rf: {}, ach: {}, hist: [], q: { vanHold: 0, catQ: 0 }, react: { cool: 0 }, log: [], achSeen: {} });
LT.pw = G => G.pw || (G.pw = LT.pwDefault(G.nation, G.seed || 7));
const pwLog = (G, t, k) => { const P = LT.pw(G); P.log.unshift({ y: G.year, w: G.week, t, k: k || '' }); if (P.log.length > 30) P.log.length = 30; };
const cLog = (G, t) => { const C = LT.pw(G).court; C.log.unshift({ y: G.year, w: G.week, t }); if (C.log.length > 24) C.log.length = 24; };

// ---------- thước đo ----------
const lastGrade = G => { const h = G.khao && G.khao.history; return h && h.length ? h[h.length - 1] : null; };
// kiểm soát triều đình 0..1: thế lực các phe thuận với bạn + người của bạn trong triều
LT.courtControl = function (G) {
  const C = LT.pw(G).court; let tot = 0, yes = 0;
  for (const id in C.f) { const f = C.f[id]; tot += f.power; yes += f.power * clamp((f.att + 15) / 95, 0, 1); }
  return clamp((tot ? yes / tot : 0) * .74 + Math.min(C.agents, 10) * .02 + (C.king.puppet ? .05 : 0), 0, 1);
};
const army = G => LT.armyCount(G);
LT.pwScores = function (G) {
  const P = LT.pw(G), C = P.court, st = G.stat, gr = lastGrade(G), rfn = Object.keys(P.rf).length;
  const part = (t, v) => ({ t, v: Math.round(v * 10) / 10 });
  // Văn trị: dân sinh, phồn vinh, thuế nộp đủ, khảo khóa, cải cách
  const remitOk = G.lastYr && G.lastYr.dueT > 0 ? clamp(G.lastYr.remitT / G.lastYr.dueT, 0, 1) : 1;
  const van = [part('Dân tâm ' + Math.round(st.dantam), st.dantam * .25), part('Phồn vinh ' + Math.round(st.phonvinh), st.phonvinh * .2), part('Khảo khóa gần nhất' + (gr ? ' (' + (gr.grade || gr.n) + ')' : ' (chưa có)'), gr ? ({ thuong: 20, trung: 12, ha: 5 })[gr.gid || gr.id] || 0 : 4), part('Thuế nộp đủ ' + Math.round(remitOk * 100) + '%', remitOk * 15), part('Cải cách đang có hiệu lực: ' + rfn, Math.min(20, rfn * 7)), part('Thanh danh ' + Math.round(G.player.thanhdanh), G.player.thanhdanh * .1)];
  const ctl = LT.courtControl(G), fs = Object.values(C.f), avg = fs.reduce((a, f) => a + f.att, 0) / fs.length;
  const chinh = [part('Quan hệ các phe (trung bình ' + Math.round(avg) + ')', (avg + 100) / 200 * 30), part('Người của bạn trong triều: ' + C.agents, Math.min(C.agents, 10) * 2), part('Kiểm soát triều đình ' + Math.round(ctl * 100) + '%', ctl * 30), part('Chức ở triều: ' + (LT.TRONG_THAN[P.tt] ? LT.TRONG_THAN[P.tt].n : 'chưa có'), P.tt * 5), part('Nghi kỵ của triều ' + Math.round(G.nghiky), -G.nghiky * .25), part('Tội chưa bị lộ (đút lót): ' + C.graft.toFixed(1).replace('.', ','), -C.graft * 3)];
  const ac = army(G), cap = Math.max(1, LT.armyCap(G));
  const quan = [part('Binh lực ' + LT.fmtN(ac) + ' / ' + LT.fmtN(cap), Math.min(1, ac / cap) * 25), part('Binh quyền (uy vọng ' + Math.round(G.player.uyvong) + ')', G.player.uyvong * .2), part('Đất giữ: ' + LT.mineCount(G) + ' thành', Math.min(LT.mineCount(G), 40) / 40 * 25), part('Tự chủ với triều ' + Math.round(P.tuchu), P.tuchu * .2), part('Trận thắng ' + (G.wins || 0), Math.min(G.wins || 0, 20) * .5)];
  const sum = a => clamp(Math.round(a.reduce((x, p) => x + p.v, 0)), 0, 100);
  return { van: { v: sum(van), parts: van }, chinh: { v: sum(chinh), parts: chinh }, quan: { v: sum(quan), parts: quan }, ctl };
};
LT.TRONG_THAN = [null,
  { n: 'Tham tri chính sự', need: { rank: 2, van: 40, thuong: 1 }, bong: 6 },
  { n: 'Thượng thư', need: { rank: 3, van: 58, agents: 2, vanthan: 15 }, bong: 12 },
  { n: 'Tể tướng', need: { rank: 4, van: 72, agents: 4, vanthan: 30, tdanh: 65 }, bong: 20 },
];
LT.ttCheck = function (G, lv) {
  const P = LT.pw(G), n = LT.TRONG_THAN[lv]; if (!n) return 'Không có chức này'; const sc = LT.pwScores(G), need = n.need, errs = [];
  if (G.rank < need.rank) errs.push('cần chức ' + LT.RANKS[need.rank].n); if (sc.van.v < need.van) errs.push('Văn trị ≥ ' + need.van + ' (hiện ' + sc.van.v + ')');
  if (need.thuong && (G.khao.thuong || 0) < need.thuong) errs.push('ít nhất ' + need.thuong + ' lần khảo khóa hạng Thượng'); if (need.agents && P.court.agents < need.agents) errs.push('có ≥ ' + need.agents + ' người của mình trong triều');
  if (need.vanthan && P.court.f.vanthan.att < need.vanthan) errs.push('phe Văn thần mến bạn ≥ ' + need.vanthan); if (need.tdanh && G.player.thanhdanh < need.tdanh) errs.push('Thanh danh ≥ ' + need.tdanh);
  return errs.length ? 'Chưa đủ: ' + errs.join(', ') : '';
};

// ---------- cải cách hành chính (văn trị) ----------
LT.REFORMS = {
  doluong: { n: 'Đo lại ruộng đất', cost: { tien: 120 }, dur: 72, rank: 2, d: 'Thuế thóc +15% trong thời hạn. Đánh đổi: hào tộc oán — dân tâm −3, Ngoại thích −8; Văn thần mến +8.', f: { vanthan: 8, ngoaithich: -8, huancuu: 0, noithan: 0 } },
  giamlao: { n: 'Giảm lao dịch', cost: { tien: 40 }, dur: 72, rank: 1, d: 'Hạn mức lao dịch −30% (xây chậm hơn), đổi lại dân tâm +4, phồn vinh +2. Huân cựu chê mềm yếu (−4).', f: { vanthan: 4, huancuu: -4, ngoaithich: 0, noithan: 0 } },
  chinhdon: { n: 'Chỉnh đốn lại trị', cost: { tien: 80 }, dur: 36, rank: 2, d: 'Mỗi quý tham ô các thành giảm 30%. Đánh đổi: quan lại oán (lòng trung −2/quý), Nội thần ghét (−8); Văn thần mến +10.', f: { vanthan: 10, noithan: -8, huancuu: 0, ngoaithich: 0 } },
};
LT.pwReform = function (G, id) {
  const P = LT.pw(G), R = LT.REFORMS[id]; if (!R) return { ok: false, err: 'Không có cải cách này' };
  if (G.rank < R.rank) return { ok: false, err: 'Cần chức ' + LT.RANKS[R.rank].n }; if (P.rf[id]) return { ok: false, err: 'Đang thi hành' };
  if (!LT.afford(G, R.cost)) return { ok: false, err: 'Thiếu ' + LT.costTxt(R.cost) };
  LT.pay(G, R.cost, 1, 'Cải cách: ' + R.n); P.engaged = true; P.rf[id] = { left: R.dur, total: R.dur };
  if (id === 'doluong') G.mods.push({ k: 'dt', v: -3, w: R.dur }); if (id === 'giamlao') { G.mods.push({ k: 'dt', v: 4, w: R.dur }, { k: 'phonvinh', v: 2, w: R.dur }); G.lab.budget = LT.laoDichBudget(G); }
  for (const f in R.f) bump(G, f, R.f[f]);
  if (id === 'chinhdon') { for (const c of LT.ownedCities(G)) c.tamo = Math.max(.01, c.tamo * .7); }
  pwLog(G, 'Ban cải cách "' + R.n + '" (' + Math.round(R.dur / 36 * 10) / 10 + ' năm).', 'good'); LT.log(G, 'Cải cách: ' + R.n + '.', 'good');
  return { ok: true };
};
LT.pwRevoke = function (G, id) { const P = LT.pw(G); if (!P.rf[id]) return { ok: false, err: 'Không đang thi hành' }; delete P.rf[id]; G.lab.budget = LT.laoDichBudget(G); pwLog(G, 'Bãi bỏ cải cách "' + LT.REFORMS[id].n + '" (hiệu ứng còn lại tự hết).', ''); return { ok: true }; };
// cát cứ đủ mạnh (tự chủ ≥ 50): triều đình không còn chấm khảo khóa
LT.pwNoKhao = G => !!(G.pw && G.pw.engaged && G.pw.stance === 'cat' && G.pw.tuchu >= 50);
LT.pwTaxMul = G => (G.pw && G.pw.rf.doluong) ? 1.15 : 1;
LT.pwLaoMul = G => (G.pw && G.pw.rf.giamlao) ? .7 : 1;
LT.pwRemitMul = function (G) { const P = G.pw; if (!P) return 1; const C = P.court; let m = 1; if (C.cutUntil > G.tick) m *= .5; if (C.king.puppet && LT.courtControl(G) >= .5) m *= .5; return m; };
LT.pwNghiMul = function (G) { const P = G.pw; if (!P || !P.engaged || P.stance === 'trung') return 1; return P.stance === 'cat' ? (P.tuchu >= 50 ? .15 : .5) : .55; };   // cát cứ/thần phục danh nghĩa: nộp thiếu ít bị nghi kỵ hơn khi đủ mạnh

// ---------- phe phái: hành động ----------
function bump(G, f, v) { const C = LT.pw(G).court, x = C.f[f]; if (!x) return; x.att = clamp(x.att + v, -100, 100); x.bias = clamp(x.bias + v * .6, -40, 40); }
const cdOk = (G, key) => { const c = LT.pw(G).court.cool[key]; return !(c && c > G.tick); };
const cdSet = (G, key, n) => { LT.pw(G).court.cool[key] = G.tick + n; };
const spend = (G, tien, label) => { if (G.res.tien < tien) return false; LT.addRes(G, 'tien', -tien, label); return true; };
const FN = id => LT.COURT_FACTIONS[id].n;
LT.PW_ACTS = {
  ketgiao: { n: 'Kết giao', cost: 80, d: 'Thiện cảm +6 đến +10 theo Chính của bạn; mỗi phe cách 18 tuần một lần.' },
  tiencu: { n: 'Tiến cử người của mình', cost: 30, d: 'Đưa một quan rảnh vào triều (người của bạn +1), phe được tiến cử mến +6.' },
  danhac: { n: 'Đàn hặc', cost: 40, d: 'Dâng sớ hặc phe đối thủ: thắng thì thế lực họ −10; thua thì Thanh danh −5, nghi kỵ +6, bị phản đòn.' },
  muachuoc: { n: 'Mua chuộc', cost: 120, d: 'Thiện cảm +18 ngay, nhưng đút lót để lại tội: lộ ra thì bị đàn hặc, giáng chức.' },
  lienhon: { n: 'Liên hôn, kết minh', cost: 200, d: 'Thiện cảm +25, thành đồng minh bền của bạn, Chính danh +4 (mỗi phe một lần). Từ chức Thứ sử.' },
};
LT.pwAct = function (G, id, f) {
  const P = LT.pw(G), C = P.court, A = LT.PW_ACTS[id], F = LT.COURT_FACTIONS[f];
  if (!A || !F) return { ok: false, err: 'Không rõ việc' }; if (G.rank < 2 && id !== 'ketgiao') return { ok: false, err: 'Mở từ chức Thứ sử' };
  if (!cdOk(G, id + ':' + f)) return { ok: false, err: 'Phe ' + FN(f) + ' vừa tiếp xúc, đợi ' + (C.cool[id + ':' + f] - G.tick) + ' tuần' };
  if (G.res.tien < A.cost) return { ok: false, err: 'Cần ' + A.cost + ' quan' };
  let text = '';
  if (id === 'ketgiao') { spend(G, A.cost, 'Kết giao ' + FN(f)); const dv = Math.round(6 + G.player.chinh / 25); bump(G, f, dv); text = 'Kết giao phe ' + FN(f) + ': thiện cảm +' + dv + '.'; cdSet(G, id + ':' + f, 18); }
  else if (id === 'tiencu') {
    const idle = LT.off(G).list.filter(o => !o.post).sort((a, b) => b.chinh - a.chinh)[0]; if (!idle) return { ok: false, err: 'Không có quan rảnh để tiến cử (xem tab Quan viên)' }; if (C.agents >= 10) return { ok: false, err: 'Triều đã đầy người của bạn (tối đa 10)' };
    spend(G, A.cost, 'Tiến cử ' + idle.name); LT.offDismiss(G, idle.id); C.agents++; C.agentNames.push(idle.name); bump(G, f, 4); text = 'Tiến cử ' + idle.name + ' vào triều dưới trướng phe ' + FN(f) + ' (người của bạn: ' + C.agents + ').'; cdSet(G, id + ':' + f, 9);
  } else if (id === 'danhac') {
    spend(G, A.cost, 'Đàn hặc ' + FN(f)); const x = C.f[f], me = LT.courtControl(G) * 40 + C.agents * 4 + G.player.thanhdanh * .3 + G.player.uyvong * .15, them = x.power * .6 + Math.max(0, x.att < 0 ? 10 : 0), p = clamp(.3 + (me - them) / 100, .1, .9), roll = hash(G.tick * 7 + 3, f.length * 11 + C.hit + C.agents);
    C.manip++; cdSet(G, id + ':' + f, 9);
    if (roll / 100 < p) { x.power = Math.max(2, x.power - 10); bump(G, f, -15); text = 'Đàn hặc phe ' + FN(f) + ' thành công: thế lực −10 (cơ hội ' + Math.round(p * 100) + '%).'; }
    else { G.player.thanhdanh = clamp(G.player.thanhdanh - 5, 0, 100); G.nghiky = clamp(G.nghiky + 6, 0, 100); C.hit++; bump(G, f, -10); text = 'Đàn hặc phe ' + FN(f) + ' THẤT BẠI (cơ hội ' + Math.round(p * 100) + '%): Thanh danh −5, nghi kỵ +6, phe ấy ghi hận.'; }
  } else if (id === 'muachuoc') { spend(G, A.cost, 'Mua chuộc ' + FN(f)); bump(G, f, 18); C.graft += 1.5; G.player.thanhdanh = clamp(G.player.thanhdanh - 2, 0, 100); text = 'Mua chuộc phe ' + FN(f) + ': thiện cảm +25, nhưng để lại tội đút lót (' + C.graft.toFixed(1).replace('.', ',') + ').'; cdSet(G, id + ':' + f, 9); }
  else if (id === 'lienhon') { if (G.rank < 2) return { ok: false, err: 'Mở từ chức Thứ sử' }; if (C.ally[f]) return { ok: false, err: 'Đã liên hôn với phe này' }; spend(G, A.cost, 'Liên hôn ' + FN(f)); bump(G, f, 25); C.ally[f] = true; G.chinhdanh = clamp(G.chinhdanh + 4, 0, 100); text = 'Liên hôn với phe ' + FN(f) + ': thiện cảm +25, trở thành đồng minh; Chính danh +4.'; }
  P.engaged = true; cLog(G, text); LT.log(G, text, ''); return { ok: true, text };
};
// đình nghị: tổng thế lực các phe tán thành và phản đối, cộng ý vua (bù nhìn: vua nghe theo bạn)
LT.dinhNghi = function (G, topic) {
  const C = LT.pw(G).court; let yes = 0, no = 0;
  for (const id in C.f) { const f = C.f[id]; let a = f.att; if (topic === 'phongdat' && id === 'huancuu') a += 10; if (topic === 'giamcong' && id === 'noithan') a += 8; if (a >= 0) yes += f.power * Math.min(1, a / 50 + .2); else no += f.power * Math.min(1, -a / 50 + .2); }
  if (C.king.puppet) yes += 40; yes += C.agents * 3; return { yes: Math.round(yes), no: Math.round(no), pass: yes >= no * 1.1 };
};
LT.PW_MANIP = {
  giamcong: { n: 'Ép triều giảm cống nộp', d: 'Một năm nộp thuế lên chỉ còn một nửa.', cd: 36 },
  phongdat: { n: 'Xin phong thêm đất', d: 'Triều phong thêm một thành thuộc quyền (hai năm một lần).', cd: 72 },
  buonhiem: { n: 'Khống chế bổ nhiệm', d: 'Nghi kỵ về 0: triều không còn ngờ vực bạn.', cd: 36 },
};
LT.pwManip = function (G, topic) {
  const P = LT.pw(G), C = P.court, M = LT.PW_MANIP[topic], ctl = LT.courtControl(G); if (!M) return { ok: false, err: 'Không rõ việc' };
  if (ctl < .55) return { ok: false, err: 'Chưa khống chế được triều đình (cần ≥ 55%, hiện ' + Math.round(ctl * 100) + '%)' }; if (!cdOk(G, 'm:' + topic)) return { ok: false, err: 'Vừa làm, đợi ' + (C.cool['m:' + topic] - G.tick) + ' tuần' };
  const v = LT.dinhNghi(G, topic); P.engaged = true; C.manip++; cdSet(G, 'm:' + topic, M.cd);
  if (!v.pass) { for (const id in C.f) if (C.f[id].att < 0) bump(G, id, -6); G.nghiky = clamp(G.nghiky + 5, 0, 100); const t = 'Đình nghị "' + M.n + '" không qua (' + v.yes + ' tán thành, ' + v.no + ' phản đối): các phe ghét bạn thêm ác cảm, nghi kỵ +5.'; cLog(G, t); return { ok: false, err: t }; }
  if (topic === 'giamcong') C.cutUntil = G.tick + 36; else if (topic === 'buonhiem') G.nghiky = 0;
  else if (topic === 'phongdat') { const n = LT.grantCities(G, 1, 1, 2).length; if (!n) { return { ok: false, err: 'Không còn thành nào của nước bạn để xin' }; } }
  const t = 'Đình nghị "' + M.n + '" qua (' + v.yes + ' tán thành, ' + v.no + ' phản đối).'; cLog(G, t); LT.log(G, t, 'good'); return { ok: true, text: t };
};
LT.pwPuppet = function (G) {
  const P = LT.pw(G), C = P.court, ctl = LT.courtControl(G); if (C.king.puppet) return { ok: false, err: 'Vua đã là bù nhìn' };
  if (ctl < .65 || C.agents < 5 || G.rank < 3) return { ok: false, err: 'Cần chức Phòng ngự sứ trở lên, ≥ 5 người trong triều, kiểm soát ≥ 65% (hiện ' + Math.round(ctl * 100) + '%, ' + C.agents + ' người)' };
  C.king.puppet = true; C.manip += 2; P.engaged = true; G.chinhdanh = clamp(G.chinhdanh - 6, 0, 100); bump(G, 'ngoaithich', -20); bump(G, 'vanthan', -10);
  const t = 'Bạn làm quyền thần: vua ' + C.king.name + ' chỉ còn là bù nhìn. Cống nộp lên triều giảm một nửa; Chính danh −6. Bị phản đòn nếu kiểm soát tụt dưới 45%.'; cLog(G, t); pwLog(G, t, 'warn'); LT.log(G, t, ''); return { ok: true, text: t };
};
LT.pwRestoreKing = function (G) { const C = LT.pw(G).court; if (!C.king.puppet) return { ok: false, err: 'Vua không phải bù nhìn' }; C.king.puppet = false; C.manip = Math.max(0, C.manip - 2); cLog(G, 'Bạn trả quyền cho vua ' + C.king.name + '.'); return { ok: true }; };
LT.pwTrongThan = function (G) {
  const P = LT.pw(G), lv = P.tt + 1; if (lv > 3) return { ok: false, err: 'Đã là chức cao nhất trong triều' }; const e = LT.ttCheck(G, lv); if (e) return { ok: false, err: e };
  if (G.res.tien < 100 * lv) return { ok: false, err: 'Cần ' + 100 * lv + ' quan lễ tạ ơn' }; LT.addRes(G, 'tien', -100 * lv, 'Lễ tạ ơn nhận chức triều'); P.tt = lv; P.engaged = true; G.player.thanhdanh = clamp(G.player.thanhdanh + 4, 0, 100); bump(G, 'vanthan', 5);
  const t = 'Triều đình phong bạn kiêm chức ' + LT.TRONG_THAN[lv].n + ' (song song với chức trấn nhậm ' + LT.RANKS[G.rank].n + '): bổng triều ' + LT.TRONG_THAN[lv].bong + ' quan mỗi quý.'; pwLog(G, t, 'good'); LT.log(G, t, 'good'); return { ok: true, text: t };
};

// ---------- tự chủ, danh nghĩa, đổi chủ ----------
LT.PW_STANCE = {
  trung: { n: 'Trung thần', d: 'Nộp đủ, nghe lệnh điều quân. Triều tin dùng; tự chủ về mức thấp.', target: 10, nop: 'du' },
  than: { n: 'Thần phục danh nghĩa', d: 'Nộp một nửa, nghe lệnh khi có lợi. Triều dè chừng nhưng khó trị.', target: 38, nop: 'thieu' },
  cat: { n: 'Cát cứ', d: 'Giữ thuế, kháng lệnh. Chỉ bền khi binh lực đủ mạnh; yếu thì bị thảo phạt.', target: 78, nop: 'giu' },
};
LT.pwStance = function (G, id) {
  const S = LT.PW_STANCE[id], P = LT.pw(G); if (!S) return { ok: false, err: 'Không rõ danh nghĩa' }; if (G.rank < 2) return { ok: false, err: 'Từ chức Thứ sử' }; if (P.stance === id) return { ok: false, err: 'Đang theo danh nghĩa này' };
  P.stance = id; P.engaged = true; G.pol.nop = S.nop; P.q.catQ = 0; bump(G, 'huancuu', id === 'cat' ? 6 : id === 'trung' ? -3 : 1); bump(G, 'ngoaithich', id === 'cat' ? -12 : id === 'trung' ? 6 : -3);
  const t = 'Bạn đổi danh nghĩa: ' + S.n + ' (' + S.d + ')'; pwLog(G, t, ''); LT.log(G, t, ''); return { ok: true, text: t };
};
LT.pwDefect = function (G, nid) {
  const P = LT.pw(G), w = G.world; if (G.rank < 3) return { ok: false, err: 'Từ chức Phòng ngự sứ' }; if (nid === G.nation || nid === 12 || !w.ns[nid] || !w.ns[nid].alive) return { ok: false, err: 'Nước này không nhận' };
  if (P.lord === nid) return { ok: false, err: 'Đã thần phục nước này' }; if (G.res.tien < 150) return { ok: false, err: 'Cần 150 quan lễ vật' };
  LT.addRes(G, 'tien', -150, 'Lễ vật đổi chủ'); P.lord = nid; P.engaged = true; P.stance = 'than'; G.pol.nop = 'thieu'; w.rel[G.nation] = clamp(w.rel[G.nation] - 35, -100, 100); w.rel[nid] = clamp(w.rel[nid] + 30, -100, 100); G.chinhdanh = clamp(G.chinhdanh - 8, 0, 100); P.tuchu = Math.max(P.tuchu, 40);
  for (const id in P.court.f) { P.court.f[id].att = Math.round(P.court.f[id].att * .5); P.court.f[id].bias = 0; } P.court.agents = Math.floor(P.court.agents / 2);
  const t = 'Bạn đổi chủ: thần phục ' + LT.natName(G, nid) + ' trên danh nghĩa (quan hệ với ' + LT.natName(G, G.nation) + ' −35, với ' + LT.natName(G, nid) + ' +30, Chính danh −8, người trong triều cũ rụng một nửa).'; pwLog(G, t, 'warn'); LT.log(G, t, ''); return { ok: true, text: t };
};

// ---------- thành tựu ----------
LT.ACH = {
  thaotung: { n: 'Thao túng triều đình', i: '🎭', d: 'Giữ kiểm soát triều đình ≥ 60% suốt 2 năm (hoặc làm quyền thần với vua bù nhìn), không xưng đế.', prog: G => { const P = LT.pw(G); return { v: Math.min(8, P.court.ctlQ) / 8, t: 'kiểm soát ' + Math.round(LT.courtControl(G) * 100) + '%, giữ ' + Math.floor(P.court.ctlQ / 4 * 10) / 10 + '/2 năm' }; }, ok: G => G.rank < 6 && (LT.pw(G).court.ctlQ >= 8 || (LT.pw(G).court.king.puppet && LT.pw(G).court.ctlQ >= 4)) },
  chinhphuc: { n: 'Chinh phục, kiểm soát các nước', i: '🌏', d: 'Giữ ≥ 40 thành, hoặc nắm ≥ 3 kinh đô.', prog: G => { const caps = G.world.cities.filter(c => c.mine && c.capital).length; return { v: Math.max(LT.mineCount(G) / 40, caps / 3), t: LT.mineCount(G) + '/40 thành, ' + caps + '/3 kinh đô' }; }, ok: G => LT.mineCount(G) >= 40 || G.world.cities.filter(c => c.mine && c.capital).length >= 3 },
  kinhte: { n: 'Bá chủ kinh tế', i: '💰', d: 'Lãi buôn bán và thuế quá cảnh cộng dồn ≥ 3.000 quan, phường thị từ Chợ thường.', prog: G => { const L = G.trade2 && G.trade2.ledger, s = L ? Math.max(0, L.mk) + Math.max(0, L.car) + Math.max(0, L.sea) + Math.max(0, L.transit) : 0; return { v: Math.min(1, s / 3000), t: Math.round(s) + '/3.000 quan' }; }, ok: G => { const L = G.trade2 && G.trade2.ledger; if (!L) return false; return Math.max(0, L.mk) + Math.max(0, L.car) + Math.max(0, L.sea) + Math.max(0, L.transit) >= 3000 && LT.marketTier(G) >= 2; } },
  quansu: { n: 'Thế lực quân sự hùng mạnh', i: '⚔️', d: 'Binh lực ≥ 15.000 và thắng ≥ 10 trận.', prog: G => ({ v: Math.min(army(G) / 15000, (G.wins || 0) / 10), t: LT.fmtN(army(G)) + '/15.000 quân, ' + (G.wins || 0) + '/10 trận thắng' }), ok: G => army(G) >= 15000 && (G.wins || 0) >= 10 },
  trungthan: { n: 'Trung thần, vùng đất thịnh vượng', i: '🏛️', d: 'Làm trọng thần (Thượng thư trở lên), không cát cứ, Văn trị ≥ 58 suốt 2 năm.', prog: G => { const P = LT.pw(G); return { v: Math.min(1, P.tt / 2 * .5 + P.q.vanHold / 8 * .5), t: 'chức ' + (LT.TRONG_THAN[P.tt] ? LT.TRONG_THAN[P.tt].n : 'chưa có') + ', Văn trị ≥ 58 giữ ' + Math.floor(P.q.vanHold / 4 * 10) / 10 + '/2 năm' }; }, ok: G => { const P = LT.pw(G); return P.tt >= 2 && P.stance !== 'cat' && !G.indep && P.q.vanHold >= 8 && G.nghiky < 30; } },
  catcu: { n: 'Cát cứ lâu dài', i: '🏰', d: 'Giữ danh nghĩa cát cứ, tự chủ ≥ 70, không bị diệt suốt 5 năm.', prog: G => { const P = LT.pw(G); return { v: P.stance === 'cat' ? Math.min(1, P.q.catQ / 20) : 0, t: P.stance === 'cat' ? 'tự chủ ' + Math.round(P.tuchu) + ', giữ ' + Math.floor(P.q.catQ / 4 * 10) / 10 + '/5 năm' : 'chưa cát cứ' }; }, ok: G => { const P = LT.pw(G); return P.stance === 'cat' && P.tuchu >= 70 && P.q.catQ >= 20 && LT.mineCount(G) >= 3; } },
  hoangde: { n: 'Xưng đế (nhánh quan lộ)', i: '👑', d: 'Lên bậc Hoàng đế: nhánh cổ điển của quan lộ, không bắt buộc.', prog: G => ({ v: G.rank / 6, t: LT.RANKS[G.rank].n }), ok: G => G.rank >= 6 },
  thongnhat: { n: 'Thống nhất thiên hạ (nhánh)', i: '🌐', d: 'Giữ ≥ 90 thành, gồm kinh đô Trung Nguyên. Ván vẫn chơi tiếp.', prog: G => ({ v: Math.min(1, LT.mineCount(G) / 90), t: LT.mineCount(G) + '/90 thành' }), ok: G => LT.mineCount(G) >= 90 && G.world.cities[G.world.capIds[0]].mine },
};
LT.achCheck = function (G) {
  const P = LT.pw(G), got = [];
  for (const id in LT.ACH) { if (P.ach[id]) continue; const A = LT.ACH[id]; if (A.ok(G)) { P.ach[id] = { y: G.year, w: G.week }; got.push(id); pwLog(G, 'THÀNH TỰU: ' + A.n + ' (năm ' + G.year + ').', 'ach'); LT.log(G, 'Thành tựu: ' + A.n + '!', 'good'); } }
  if (got.length && !G.pendingNotice && !G.pendingEvent) { const A = LT.ACH[got[0]]; G.pendingNotice = { title: '🏅 Thành tựu: ' + A.n, text: A.d + ' Đã ghi vào sổ thành tựu (Triều chính → Thành tựu). Ván vẫn chơi tiếp: đây là một hướng đi, không phải điểm kết.' }; G.speed = 0; }
  return got;
};

// ---------- nhịp quý ----------
LT.pwWeek = function (G) {
  if (G.tick % 9 !== 5) return; const P = LT.pw(G), C = P.court, gr = lastGrade(G), st = G.stat;
  // 1) phe phái trôi về lập trường theo việc bạn làm
  const mil = Math.min(1, army(G) / Math.max(1, LT.armyCap(G))), sc0 = P.stance;
  const tg = { huancuu: 8 + (mil - .3) * 55 + (sc0 === 'cat' ? 18 : sc0 === 'trung' ? -4 : 0) + (P.rf.chinhdon ? -6 : 0), vanthan: 6 + (gr ? ({ thuong: 18, trung: 8, ha: -8 })[gr.gid || gr.id] || 0 : 0) + (P.rf.doluong ? 6 : 0) + (P.rf.chinhdon ? 8 : 0) - (C.king.puppet ? 30 : 0) - (sc0 === 'cat' ? 18 : 0), ngoaithich: (sc0 === 'trung' ? 12 : sc0 === 'cat' ? -22 : -4) + (G.nghiky > 50 ? -15 : 0) - (C.king.puppet ? 25 : 0), noithan: -2 + (P.rf.chinhdon ? -6 : 0) + C.graft * 3 - (C.hit ? C.hit * 2 : 0) };
  for (const id in C.f) { const f = C.f[id]; f.bias *= .95; if (C.ally[id]) f.att = Math.max(f.att, 25); if (P.engaged) { f.att = clamp(f.att + (clamp(tg[id] + f.bias, -100, 100) - f.att) * .3, -100, 100); } f.power = clamp(f.power + (hash(G.tick, id.length * 9) - 50) / 90, 5, 90); }
  // 2) cải cách hết hạn, tham ô giảm dần
  for (const id in P.rf) { const r = P.rf[id]; r.left -= 9; if (id === 'chinhdon') { for (const c of LT.ownedCities(G)) c.tamo = Math.max(.01, c.tamo * .7); for (const o of LT.off(G).list) if (o.post) o.trung = clamp(o.trung - 2, 0, 100); } if (r.left <= 0) { delete P.rf[id]; G.lab.budget = LT.laoDichBudget(G); pwLog(G, 'Cải cách "' + LT.REFORMS[id].n + '" hết hạn.', ''); } }
  // 3) bổng chức triều
  if (P.tt > 0) LT.income(G, LT.TRONG_THAN[P.tt].bong, 'Bổng chức triều: ' + LT.TRONG_THAN[P.tt].n);
  // 4) tự chủ với triều trôi về mức theo danh nghĩa
  if (P.engaged) P.tuchu = clamp(P.tuchu + (LT.PW_STANCE[P.stance].target - P.tuchu) * .14, 0, 100);
  // 5) bộ đếm giữ điều kiện
  const sc = LT.pwScores(G); C.ctlQ = sc.ctl >= .6 ? C.ctlQ + 1 : 0; P.q.vanHold = sc.van.v >= 58 ? P.q.vanHold + 1 : 0; P.q.catQ = P.stance === 'cat' && P.tuchu >= 60 ? P.q.catQ + 1 : (P.stance === 'cat' ? P.q.catQ : 0);
  P.hist.push({ y: G.year, w: G.week, van: sc.van.v, chinh: sc.chinh.v, quan: sc.quan.v }); if (P.hist.length > 40) P.hist.shift();
  // 6) triều đình phản ứng và phản đòn — chỉ khi bạn đã dùng tính năng mới
  if (P.engaged) { reaction(G, P, C, sc); backlash(G, P, C, sc); }
  LT.achCheck(G);
};
function backlash(G, P, C, sc) {
  C.graft = Math.max(0, C.graft - .08); C.hit = Math.max(0, C.hit - .15);
  const ctl = sc.ctl, risk = C.graft * 9 + C.hit * 6 + (C.king.puppet ? 10 : 0) + (C.manip > 0 && ctl < .4 ? 14 : 0) + (C.king.puppet && ctl < .45 ? 25 : 0) + Math.max(0, 40 - ctl * 60) * (C.manip > 1 ? .5 : .1);
  if (risk < 8) return; const roll = hash(G.tick * 3 + 11, Math.round(risk)); if (roll >= risk * 1.6) return;
  if (C.king.puppet && ctl < .45 && P.react.cool <= G.tick) { C.king.puppet = false; C.manip = 0; P.react.cool = G.tick + 36; const t = 'Phản đòn: các phe liên kết lật thế quyền thần; vua lấy lại quyền, triều đình phái quân thảo phạt bạn!'; cLog(G, t); pwLog(G, t, 'bad'); LT.log(G, t, 'bad'); courtBattle(G, 'Quân triều đình thảo phạt quyền thần', .9); return; }
  if (risk >= 18) { const had = P.tt; if (P.tt > 0) P.tt--; else { G.player.thanhdanh = clamp(G.player.thanhdanh - 8, 0, 100); C.agents = Math.floor(C.agents / 2); } G.nghiky = clamp(G.nghiky + 14, 0, 100); C.graft *= .4; C.hit = 0; C.manip = Math.max(0, C.manip - 1); const t = 'Bị giáng chức: ' + (had ? 'mất chức ' + LT.TRONG_THAN[had].n + ' ở triều' : 'mất uy tín, người của bạn trong triều bị đuổi một nửa') + '; nghi kỵ +14. (Nguy cơ ' + Math.round(risk) + ')'; cLog(G, t); pwLog(G, t, 'bad'); LT.log(G, t, 'bad'); return; }
  G.nghiky = clamp(G.nghiky + 8, 0, 100); G.player.thanhdanh = clamp(G.player.thanhdanh - 4, 0, 100); C.graft *= .7; const t = 'Bị đàn hặc: Thanh danh −4, nghi kỵ +8. (Nguy cơ ' + Math.round(risk) + ')'; cLog(G, t); pwLog(G, t, 'bad');
}
function courtBattle(G, name, k) {
  if (G.pendingBattle || G.pendingEvent) { G.pw.react.pending = { name, k }; return; }
  const my = army(G), total = Math.max(300, Math.round((my * k + 200)));
  LT.openBattle(G, 'nation', { name, total, nation: G.nation, title: name + ' kéo đến!', text: 'Triều đình ' + LT.natName(G, G.nation) + ' phái ' + total + ' quân đánh bạn: thua mà thành phòng thấp, thành sẽ thất thủ.' });
}
function reaction(G, P, C, sc) {
  if (P.react.pending && !G.pendingBattle && !G.pendingEvent) { const p = P.react.pending; P.react.pending = null; courtBattle(G, p.name, p.k); return; }
  if (G.pendingBattle || G.pendingEvent || P.react.cool > G.tick || G.rank < 3) return;
  const ns = G.world.ns[G.nation], R = army(G) / Math.max(800, ns.troops * .6);
  if (P.stance !== 'trung' && P.tuchu >= 40) {
    if (R >= .6) { if (G.tick % 36 === 5) { G.nghiky = Math.max(0, G.nghiky - 15); G.chinhdanh = clamp(G.chinhdanh + 2, 0, 100); const t = 'Triều đình ngầm thừa nhận thế lực của bạn (binh lực ' + Math.round(R * 100) + '% quân triều): nghi kỵ −15.'; pwLog(G, t, ''); } return; }
    if (R >= .22) { P.react.cool = G.tick + 54; G.pendingEvent = { id: 'chieuan' }; G.speed = 0; return; }
    if (P.tuchu >= 55) { P.react.cool = G.tick + 45; const t = 'Triều đình thấy bạn yếu mà dám kháng lệnh (binh lực chỉ ' + Math.round(R * 100) + '% quân triều): thảo phạt!'; pwLog(G, t, 'bad'); courtBattle(G, 'Quân triều đình thảo phạt', .8); return; }
  }
  // lệnh điều quân: chỉ khi bạn đã chọn một danh nghĩa với triều
  if (P.stance !== 'cat' && army(G) >= 400 && G.tick % 72 === 41) { P.react.cool = G.tick + 36; G.pendingEvent = { id: 'dieuquan' }; G.speed = 0; }
}
LT.EVENTS.push(
  { id: 'chieuan', icon: '📜', title: 'Triều đình chiêu an', weight: () => 0, text: G => 'Triều đình thấy binh lực của bạn không dễ trị (' + LT.fmtN(army(G)) + ' quân), sai sứ mang sắc phong dụ bạn quy thuận: phong thêm đất và chức, đổi lại bạn phải nộp thuế và nghe lệnh.',
    opts: [
      { label: 'Nhận chiêu an', desc: 'Phong thêm một thành, nghi kỵ −30, Chính danh +4; tự chủ −20, chuyển về danh nghĩa thần phục.', apply: G => { const P = LT.pw(G); LT.grantCities(G, 1, 1, 2); G.nghiky = Math.max(0, G.nghiky - 30); G.chinhdanh = clamp(G.chinhdanh + 4, 0, 100); P.tuchu = Math.max(0, P.tuchu - 20); P.stance = 'than'; G.pol.nop = 'thieu'; return 'Bạn nhận sắc phong, thần phục trên danh nghĩa.'; } },
      { label: 'Từ chối, giữ thế cát cứ', desc: 'Tự chủ +8, nghi kỵ +10; Huân cựu mến (+8), Ngoại thích ghét (−8).', apply: G => { const P = LT.pw(G); P.tuchu = clamp(P.tuchu + 8, 0, 100); G.nghiky = clamp(G.nghiky + 10, 0, 100); bump(G, 'huancuu', 8); bump(G, 'ngoaithich', -8); return 'Sứ giả ra về tay không.'; } },
      { label: 'Nhận lễ vật nhưng không nộp thêm', desc: 'Nhận 60 quan lễ; Thanh danh −3, tự chủ +3 (triều ghi tội lừa dối).', apply: G => { LT.income(G, 60, 'Lễ chiêu an'); G.player.thanhdanh = clamp(G.player.thanhdanh - 3, 0, 100); LT.pw(G).tuchu = clamp(LT.pw(G).tuchu + 3, 0, 100); return 'Bạn nhận lễ, nói lời nước đôi.'; } },
    ] },
  { id: 'dieuquan', icon: '🚩', title: 'Triều đình điều quân', weight: () => 0, text: G => 'Triều đình hạ lệnh điều ' + Math.round(army(G) * .2) + ' quân của bạn đi đánh giặc biên ải.',
    opts: [
      { label: 'Nghe lệnh', desc: 'Mất khoảng 15% quân (tử trận, đào ngũ), Thanh danh +4, nghi kỵ −8, tự chủ −8.', apply: G => { for (const u of G.units) u.n = Math.max(0, Math.round(u.n * .85)); G.units = G.units.filter(u => u.n > 0); G.player.thanhdanh = clamp(G.player.thanhdanh + 4, 0, 100); G.nghiky = Math.max(0, G.nghiky - 8); LT.pw(G).tuchu = clamp(LT.pw(G).tuchu - 8, 0, 100); return 'Quân của bạn lên đường.'; } },
      { label: 'Gửi một nửa, viện cớ', desc: 'Mất 7% quân, tự chủ +2, nghi kỵ +2.', apply: G => { for (const u of G.units) u.n = Math.max(0, Math.round(u.n * .93)); G.units = G.units.filter(u => u.n > 0); G.nghiky = clamp(G.nghiky + 2, 0, 100); LT.pw(G).tuchu = clamp(LT.pw(G).tuchu + 2, 0, 100); return 'Bạn gửi quân ít ỏi và một lá thư xin lỗi.'; } },
      { label: 'Kháng lệnh', desc: 'Không mất quân; tự chủ +10, nghi kỵ +10; Huân cựu mến (+6), Ngoại thích ghét (−8).', apply: G => { LT.pw(G).tuchu = clamp(LT.pw(G).tuchu + 10, 0, 100); G.nghiky = clamp(G.nghiky + 10, 0, 100); bump(G, 'huancuu', 6); bump(G, 'ngoaithich', -8); return 'Bạn xé sắc chỉ trước mặt sứ giả.'; } },
    ] },
);
})(typeof globalThis !== 'undefined' ? globalThis : window);

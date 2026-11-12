// ============================================================================
// QUAN VIÊN TỰ QUẢN (vòng 5) — GP §7–§8, CT §4, §6
//  Danh sách quan có Thống/Võ/Trí/Chính/Đức, Trung thành, Dã tâm, Liêm–tham (ẩn), đặc tính, bổng lộc.
//  Bổ nhiệm vào thành (tự quản lý theo phương châm) và vào chức ở trị sở (thuế, kho, quân).
//  Công cụ kiểm soát: khảo khóa cuối năm, nhiệm kỳ 3 năm + luân chuyển, hồi tỵ, ngự sử thanh tra, bổng lộc.
// Logic thuần để chạy được trong Node.
// ============================================================================
(function (g) {
const LT = g.LT = g.LT || {}, clamp = LT.clamp;

LT.OFF_SRC = {
  khoacu:   { n: 'Khoa cử (Châu học)', cost: 40, d: 'Chất lượng cao, đều; trung thành với bạn; cần Châu học; chậm (mỗi 24 tuần một khoa).', cool: 24, req: G => LT.count(G, 'school') > 0 ? '' : 'Cần dựng Châu học ở trị sở' },
  am:       { n: 'Ấm bổ (con cháu quan)', cost: 0, d: 'Chất lượng trung bình; trung thành với dòng họ (không chắc với bạn); miễn phí; lấy lòng hào tộc.', cool: 12, req: G => G.rank >= 2 ? '' : 'Từ chức Thứ sử' },
  tiencu:   { n: 'Tiến cử', cost: 10, d: 'Tùy người tiến cử: chất lượng dao động mạnh; trung thành với người tiến cử.', cool: 12, req: G => G.player.thanhdanh >= 35 ? '' : 'Cần Thanh danh ≥ 35 để có người tiến cử' },
  quancong: { n: 'Quân công / hàng tướng', cost: 0, d: 'Thống, Võ cao; Chính thấp; dã tâm cao; dễ cát cứ nếu giao nhiều quân ở xa.', cool: 18, req: G => (G.quanCong > 0 || G.wins > 0) ? '' : 'Cần có chiến công' },
  chieuhien:{ n: 'Chiêu hiền', cost: 30, d: 'Dán bảng tìm người tài khắp nơi: chất lượng và lòng trung rộng, tốn chút tiền.', cool: 12, req: G => '' },
  ban:      { n: 'Bán quan tước', cost: 0, d: 'THU tiền ngay (60–100 quan mỗi chức) nhưng người mua quan thường tham, kém; dân tâm −1.', cool: 6, req: G => G.rank >= 2 ? '' : 'Từ chức Thứ sử' },
};
LT.OFF_TRAITS = {
  liem:     { n: 'Liêm khiết', d: 'Ít khi ăn bớt thuế (liêm +20)', f: o => { o.liem = Math.min(100, o.liem + 20); } },
  tham:     { n: 'Tham lam', d: 'Hay ăn bớt thuế (liêm −25)', f: o => { o.liem = Math.max(0, o.liem - 25); } },
  trongnong:{ n: 'Trọng nông', d: 'Làm giỏi phương châm Trọng nông', f: () => { } },
  trongthuong:{ n: 'Trọng thương', d: 'Làm giỏi phương châm Trọng thương', f: () => { } },
  thienchien:{ n: 'Thiện chiến', d: 'Dẹp giặc giỏi, thích mộ quân (dã tâm +8)', f: o => { o.da = Math.min(100, o.da + 8); o.vo = Math.min(100, o.vo + 6); } },
  caithan:  { n: 'Cẩn trọng', d: 'Ít sai lầm, ít liều (dã tâm −8)', f: o => { o.da = Math.max(0, o.da - 8); } },
  khoeo:    { n: 'Khéo ăn nói', d: 'Dân mến, nhưng dễ che giấu việc xấu', f: o => { o.duc = Math.min(100, o.duc + 6); } },
  hamdanh:  { n: 'Ham danh', d: 'Dã tâm cao (+12), trung thành khó giữ', f: o => { o.da = Math.min(100, o.da + 12); } },
};
const SUR = ['Lý', 'Trần', 'Nguyễn', 'Triệu', 'Lưu', 'Vương', 'Trương', 'Đặng', 'Phạm', 'Hoàng', 'Dương', 'Tô', 'Mã', 'Phùng', 'Cao', 'Từ', 'Khúc', 'Ngô', 'Đinh', 'Lê'];
const GIV = ['Văn Tín', 'Đức Minh', 'Quốc Bảo', 'Thế Anh', 'Hữu Nghĩa', 'Công Thành', 'Chí Dũng', 'Nhân Phụ', 'Kính Thiên', 'Bá Ngọc', 'Đình Chương', 'Hiển Đạt', 'Trọng Khang', 'Văn Lễ', 'Thiện Tài', 'Duy Hòa', 'Quang Tông', 'Hoài Ân', 'Thừa Chí', 'Nghĩa Phương', 'Tử Kiệt', 'Hạo Nhiên'];
LT.off = G => G.off || (G.off = { list: [], pool: [], nextId: 1, nextCand: 1, cool: {}, seat: { thue: null, kho: null, quan: null }, bonus: { trian: 0 }, hist: [], defected: 0 });
LT.offById = (G, id) => id == null ? null : LT.off(G).list.find(o => o.id === id) || null;
const rr = (G, a, b) => a + (b - a) * LT.rand(G);
const ri = (G, a, b) => Math.round(rr(G, a, b));

// sinh một ứng viên theo nguồn (chất lượng và lòng trung khác nhau — CT §4)
LT.offGen = function (G, src, base) {
  const O = LT.off(G), P = {
    khoacu:   { q: [58, 82], tr: [68, 92], da: [8, 40], li: [58, 92], vo: [30, 60] },
    am:       { q: [38, 66], tr: [38, 72], da: [25, 58], li: [38, 78], vo: [30, 65] },
    tiencu:   { q: [40, 88], tr: [48, 88], da: [15, 55], li: [40, 90], vo: [30, 70] },
    quancong: { q: [28, 52], tr: [42, 76], da: [48, 88], li: [35, 75], vo: [66, 94] },
    chieuhien:{ q: [42, 82], tr: [48, 82], da: [15, 55], li: [40, 88], vo: [30, 70] },
    ban:      { q: [22, 50], tr: [30, 62], da: [28, 62], li: [8, 45], vo: [25, 55] },
    trieudinh:{ q: [38, 72], tr: [55, 90], da: [15, 50], li: [40, 85], vo: [30, 62] },
    hang:     { q: [35, 70], tr: [30, 62], da: [40, 76], li: [30, 70], vo: [45, 80] },
  }[src] || { q: [40, 70], tr: [50, 80], da: [20, 50], li: [40, 80], vo: [30, 65] };
  const q = ri(G, P.q[0], P.q[1]), wob = () => ri(G, -9, 9);
  const cs = G.world.cities.filter(c => c.own === G.nation && c.id !== G.seatId);
  const o = { id: 0, name: SUR[Math.floor(LT.rand(G) * SUR.length)] + ' ' + GIV[Math.floor(LT.rand(G) * GIV.length)], src, tong: 0, vo: 0, tri: 0, chinh: 0, duc: 0, trung: ri(G, P.tr[0], P.tr[1]), da: ri(G, P.da[0], P.da[1]), liem: ri(G, P.li[0], P.li[1]), trait: null, sal: 0, post: null, since: null, home: cs.length ? cs[Math.floor(LT.rand(G) * cs.length)].id : null, debt: 0, hoard: 0, known: false, revY: -1, log: [], age: ri(G, 26, 54) };
  if (src === 'quancong' || src === 'hang') { o.vo = clamp(ri(G, P.vo[0], P.vo[1]), 0, 100); o.tong = clamp(o.vo + ri(G, -8, 10), 0, 100); o.chinh = clamp(q + wob(), 15, 70); o.tri = clamp(q + wob() + 5, 15, 80); o.duc = clamp(q + wob() - 5, 15, 75); }
  else { o.chinh = clamp(q + wob(), 15, 98); o.tri = clamp(q + wob(), 15, 98); o.duc = clamp(q + wob(), 15, 98); o.tong = clamp(ri(G, 25, 60) + wob(), 10, 90); o.vo = clamp(ri(G, P.vo[0], P.vo[1]) + wob(), 10, 90); }
  const keys = Object.keys(LT.OFF_TRAITS), tk = LT.rand(G) < .7 ? keys[Math.floor(LT.rand(G) * keys.length)] : null;
  if (tk) { o.trait = tk; LT.OFF_TRAITS[tk].f(o); }
  if (src === 'ban') o.price = ri(G, 60, 100);
  return o;
};
LT.offSal = o => { const p = o.post; if (!p) return 0; if (p.t === 'seat') return 1.5; const c = null; return p.lvl != null ? [0, .8, 1.3, 2.0, 3.0][p.lvl] : 1; };

// ---- tìm người: tạo 3 ứng viên trong "bảng tuyển" ----
LT.offSeek = function (G, src) {
  const O = LT.off(G), S = LT.OFF_SRC[src]; if (!S) return { ok: false, err: 'Nguồn lạ' };
  const e = S.req(G); if (e) return { ok: false, err: e };
  if ((O.cool[src] || 0) > G.tick) return { ok: false, err: 'Nguồn này vừa tuyển xong, còn ' + (O.cool[src] - G.tick) + ' tuần nữa' };
  O.pool = O.pool.filter(c => c.src !== src);
  for (let i = 0; i < 3; i++) { const c = LT.offGen(G, src); c.id = -(O.nextCand++); c.exp = G.tick + 30; O.pool.push(c); }
  O.cool[src] = G.tick + S.cool; return { ok: true, n: 3 };
};
LT.offHireCost = c => c.src === 'ban' ? 0 : LT.OFF_SRC[c.src] ? Math.round(LT.OFF_SRC[c.src].cost / 3) + 5 : 0;
LT.offMax = G => 6 + LT.ownedCities(G).length * 1.2 + 3;
LT.offHire = function (G, candId) {
  const O = LT.off(G), c = O.pool.find(x => x.id === candId); if (!c) return { ok: false, err: 'Ứng viên đã đi nơi khác' };
  if (O.list.length >= LT.offMax(G)) return { ok: false, err: 'Quá nhiều quan chưa có việc (tối đa ' + Math.floor(LT.offMax(G)) + '): bãi miễn bớt' };
  const cost = LT.offHireCost(c); if (G.res.tien < cost) return { ok: false, err: 'Cần ' + cost + ' quan lộ phí' };
  if (cost) LT.addRes(G, 'tien', -cost, 'Chiêu mộ quan viên');
  O.pool.splice(O.pool.indexOf(c), 1); c.id = O.nextId++; delete c.exp;
  if (c.src === 'ban') { LT.income(G, c.price, 'Bán quan tước (' + c.name + ')'); G.stat.dantam = clamp(G.stat.dantam - 1, 0, 100); LT.log(G, 'Bán chức cho ' + c.name + ' được ' + c.price + ' quan; dân tâm −1.', ''); }
  O.list.push(c); return { ok: true, o: c };
};
LT.offDismiss = function (G, id) {
  const O = LT.off(G), o = LT.offById(G, id); if (!o) return { ok: false, err: 'Không có người này' };
  LT.offUnpost(G, o);
  O.list.splice(O.list.indexOf(o), 1);
  if (o.da > 60 && o.trung < 55) { G.player.thanhdanh = clamp(G.player.thanhdanh - 1, 0, 100); }
  return { ok: true };
};
LT.offUnpost = function (G, o) {
  const O = LT.off(G), p = o.post; if (!p) return;
  if (p.t === 'city') { const c = G.world.cities[p.id]; if (c && c.quan === o.id) { c.quan = null; c.vacant = true; } } else if (p.t === 'seat') { if (O.seat[p.role] === o.id) O.seat[p.role] = null; }
  o.post = null; o.since = null;
};
LT.SEAT_ROLES = { thue: { n: 'Lo thuế', d: 'Thu thêm tiền thuế mỗi tuần theo Chính; quan tham thì bớt xén.' }, kho: { n: 'Lo kho', d: 'Giữ kho lương: thêm thóc mỗi tuần theo Trí (giảm hao hụt).' }, quan: { n: 'Lo quân', d: 'Chỉnh đốn kỷ luật: trị an tăng theo Thống.' } };
// post: { t:'city', id } | { t:'seat', role }
LT.offAppoint = function (G, offId, post) {
  const O = LT.off(G), o = LT.offById(G, offId); if (!o) return { ok: false, err: 'Không có người này' };
  if (post.t === 'city') {
    const c = G.world.cities[post.id]; if (!c || !c.mine || c.id === G.seatId) return { ok: false, err: 'Không phải thành thuộc quyền' };
    const prev = LT.offById(G, c.quan); if (prev && prev !== o) LT.offUnpost(G, prev);
    LT.offUnpost(G, o); c.quan = o.id; c.vacant = false; o.post = { t: 'city', id: c.id, lvl: c.lvl }; o.since = { y: G.year, w: G.week };
    c.auto = Math.max(0, c.auto - 8); c.chinh = LT.offChinh(o);   // quan mới đến: tự chủ giảm
    LT.offLog(G, c, 'Quan mới ' + o.name + ' nhận chức' + (o.home === c.id ? ' (về chính quê — trái lệ hồi tỵ)' : '') + '.', o);
  } else {
    if (!LT.SEAT_ROLES[post.role]) return { ok: false, err: 'Chức lạ' }; if (G.rank < 2) return { ok: false, err: 'Chức ở trị sở mở từ Thứ sử' };
    const prev = LT.offById(G, O.seat[post.role]); if (prev && prev !== o) LT.offUnpost(G, prev);
    LT.offUnpost(G, o); O.seat[post.role] = o.id; o.post = { t: 'seat', role: post.role }; o.since = { y: G.year, w: G.week };
  }
  return { ok: true };
};
// luân chuyển hai quan (hoặc đổi sang thành khác): tốn 20 quan, tự chủ giảm, hồi tỵ được tôn trọng
LT.offRotate = function (G, offId, cityId) {
  const o = LT.offById(G, offId); if (!o || !o.post || o.post.t !== 'city') return { ok: false, err: 'Chỉ luân chuyển quan đang giữ thành' };
  if (G.res.tien < 20) return { ok: false, err: 'Cần 20 quan lộ phí luân chuyển' };
  const c = G.world.cities[cityId], other = c && LT.offById(G, c.quan), oldC = o.post.id;
  LT.addRes(G, 'tien', -20, 'Luân chuyển quan');
  if (other) { LT.offUnpost(G, other); } LT.offAppoint(G, o.id, { t: 'city', id: cityId });
  if (other) LT.offAppoint(G, other.id, { t: 'city', id: oldC });
  for (const x of [o, other]) if (x) x.trung = clamp(x.trung - 1, 0, 100);
  return { ok: true };
};
// ---- gợi ý và bổ nhiệm nhanh ----
LT.offFit = function (G, o, c) {
  let s = o.chinh * .38 + o.tri * .18 + o.duc * .08 + o.trung * .22 + (o.liem * .1) - o.da * .16;
  if (c.dist >= 3 || c.lvl >= 3) s += o.tong * .08 + o.vo * .06;
  if (o.home === c.id) s -= 22;            // hồi tỵ
  if (o.trait === 'trongnong' && c.pc === 'nong') s += 6; if (o.trait === 'trongthuong' && c.pc === 'thuong') s += 6;
  if (c.lvl >= 3) s += (o.chinh + o.tri) * .04;
  return s;
};
LT.offSuggest = function (G, cityId, pool) {
  const O = LT.off(G), c = G.world.cities[cityId]; let best = null, bs = -1e9;
  for (const o of O.list) { if (o.post) continue; const s = LT.offFit(G, o, c); if (s > bs) { bs = s; best = o; } }
  if (pool) for (const o of O.pool) { const s = LT.offFit(G, o, c) - LT.offHireCost(o) * .05; if (s > bs) { bs = s; best = o; } }
  return best ? { o: best, score: bs } : null;
};
LT.offFillAll = function (G) {
  const O = LT.off(G), vac = LT.ownedCities(G).filter(c => !c.quan).sort((a, b) => b.lvl - a.lvl || b.ho - a.ho); let n = 0, hired = 0, fail = '';
  for (const c of vac) {
    const sg = LT.offSuggest(G, c.id, true); if (!sg) { fail = 'Hết người: dùng "Tìm người" để có thêm ứng viên'; break; }
    let o = sg.o; if (o.id < 0) { const r = LT.offHire(G, o.id); if (!r.ok) { fail = r.err; break; } o = r.o; hired++; }
    const r = LT.offAppoint(G, o.id, { t: 'city', id: c.id }); if (r.ok) n++;
  }
  return { ok: true, n, hired, vacant: vac.length - n, fail };
};

// ---- chấm điểm cuối năm và thưởng phạt (khảo khóa cấp dưới) ----
LT.offScore = function (G, o) {
  if (o.post && o.post.t === 'city') {
    const c = G.world.cities[o.post.id]; if (!c) return 50;
    return clamp(Math.round(34 + (c.dt - 50) * .5 + ((c.ho / Math.max(1, c.base || c.ho)) - 1) * 70 + (c.last > 0 ? 8 : 0) - c.tamo * 70 - Math.max(0, c.auto - 40) * .25 + o.chinh * .14), 5, 99);
  }
  return clamp(Math.round(30 + o.chinh * .3 + o.tri * .3 + o.liem * .15), 5, 99);
};
LT.offReview = function (G, id, act) {
  const O = LT.off(G), o = LT.offById(G, id); if (!o) return { ok: false, err: 'Không có người này' };
  if (o.revY === G.year) return { ok: false, err: 'Năm nay đã khảo khóa người này' };
  const sc = LT.offScore(G, o), good = sc >= 60; o.revY = G.year; let txt;
  if (act === 'thuong') {
    if (G.res.tien < 15) { o.revY = -1; return { ok: false, err: 'Cần 15 quan để thưởng' }; }
    LT.addRes(G, 'tien', -15, 'Thưởng quan viên khảo khóa'); o.trung = clamp(o.trung + (good ? 9 : 4), 0, 100); o.debt = Math.max(0, o.debt - 5);
    if (!good) { for (const x of O.list) if (x !== o && x.post && LT.offScore(G, x) >= 60) x.trung = clamp(x.trung - 2, 0, 100); txt = 'Thưởng người kém (' + sc + ' điểm): người giỏi bất mãn, trung thành −2.'; } else txt = 'Thưởng đúng người (' + sc + ' điểm): trung thành +9.';
  } else if (act === 'phat') {
    o.trung = clamp(o.trung - (good ? 11 : 4), 0, 100); o.liem = clamp(o.liem + (good ? 0 : 5), 0, 100); o.da = clamp(o.da + (good ? 3 : -2), 0, 100);
    txt = good ? 'Phạt người có công (' + sc + ' điểm): bất công, trung thành −11, dã tâm +3.' : 'Phạt người yếu kém (' + sc + ' điểm): trung thành −4, liêm +5.';
  } else { o.trung = clamp(o.trung + (good ? -1 : 0), 0, 100); txt = 'Giữ nguyên (' + sc + ' điểm).'; }
  if (o.post && o.post.t === 'city') LT.offLog(G, G.world.cities[o.post.id], 'Khảo khóa ' + o.name + ': ' + txt, o);
  return { ok: true, text: txt, score: sc };
};
LT.offChinh = o => clamp(Math.round(o.chinh * .7 + o.tri * .3), 5, 100);
LT.offLog = function (G, c, t, o, hidden) { if (!c) return; (c.olog = c.olog || []).unshift({ y: G.year, w: G.week, t, hid: !!hidden }); if (c.olog.length > 14) c.olog.length = 14; };
LT.offTenure = (G, o) => o.since ? (G.year - o.since.y) + (G.week - o.since.w) / LT.WEEKS_YEAR : 0;

// quan vô danh có sẵn → nhân vật thật; thành mới chiếm → quan địa phương hàng
LT.offEnsure = function (G, c, src) {
  if (c.quan || c.vacant) return; const O = LT.off(G), o = LT.offGen(G, src || 'trieudinh');
  if (c.chinh) { o.chinh = clamp(Math.round(c.chinh + (o.chinh - 55) * .25), 15, 98); } if (c.trung) o.trung = clamp(Math.round(c.trung + (o.trung - 70) * .25), 20, 98);
  o.id = O.nextId++; O.list.push(o); c.quan = o.id; o.post = { t: 'city', id: c.id, lvl: c.lvl }; o.since = { y: G.year, w: G.week };
  if (o.home === c.id) o.home = null; c.chinh = LT.offChinh(o); c.trung = o.trung; c.tamo = clamp(.015 + (100 - o.liem) / 100 * .2, .01, .25);
};

// ---- nhịp tuần: ảnh hưởng của quan lên thành (trước khi thành chạy), bổng lộc, quyết định mỗi quý ----
LT.offWeek = function (G) {
  const O = LT.off(G), cs = G.world.cities;
  for (const c of cs) if (c.mine && c.id !== G.seatId && !c.quan && !c.vacant) LT.offEnsure(G, c, c.tan > 0 ? 'hang' : 'trieudinh');
  // bảng tuyển hết hạn
  if (G.tick % 6 === 0) O.pool = O.pool.filter(x => x.exp > G.tick);
  const monthly = G.week % 3 === 0, quarter = G.week % 9 === 0;
  for (const c of cs) {
    if (!c.mine || c.id === G.seatId) continue;
    const o = LT.offById(G, c.quan);
    if (o) {
      const ten = LT.offTenure(G, o);
      c.chinh = LT.offChinh(o) * (o.home === c.id ? 1.08 : 1) * ((o.trait === 'trongnong' && c.pc === 'nong') || (o.trait === 'trongthuong' && c.pc === 'thuong') ? 1.1 : 1);
      c.trung = o.trung;
      const tamoT = clamp(.012 + (100 - o.liem) / 100 * .22 + (o.debt > 0 ? .03 : 0), .01, .25); c.tamo = c.tamo + (tamoT - c.tamo) * .06;
      c._autoAdd = o.da / 1500 + (ten > 3 ? .05 + (ten - 3) * .01 : 0) + (o.home === c.id ? .06 : 0) + (o.trung < 40 ? .05 : 0);
      // lòng trung: ăn lộc đủ thì vững, nợ bổng và bị bỏ rơi thì phai; dã tâm lớn hơn trung thì mòn dần
      o.trung = clamp(o.trung + (o.debt > 0 ? -.14 : .012) + (o.da > o.trung ? -.03 : 0) + (c.auto > 70 ? -.05 : 0) + (G.player.uyvong - 50) / 9000, 0, 100);
      if (o.debt > 0) o.liem = clamp(o.liem - .03, 0, 100);
      o.sal = LT.offSal(o);
    } else { c.chinh = 28; c.trung = 55; c._autoAdd = .12; }
  }
  for (const o of O.list) if (o.post && o.post.t === 'seat') { o.trung = clamp(o.trung + (o.debt > 0 ? -.12 : .01), 0, 100); o.sal = LT.offSal(o); }
  // chức ở trị sở
  const b = O.bonus; b.trian = 0;
  for (const role in LT.SEAT_ROLES) {
    const o = LT.offById(G, O.seat[role]); if (!o) continue;
    if (role === 'thue') { const gain = .4 + o.chinh / 100 * 1.6, theft = (100 - o.liem) / 100 * .9; if (G.week % 1 === 0) { LT.income(G, Math.max(0, gain - theft), 'Quan lo thuế ' + o.name); o.hoard += theft; } }
    if (role === 'kho') LT.addRes(G, 'luong', .5 + o.tri / 100 * 2.5, 'Quan lo kho ' + o.name);
    if (role === 'quan') b.trian = clamp((o.tong - 40) / 10, -2, 5);
  }
  // bổng lộc mỗi tháng; thiếu tiền thì nợ bổng
  if (monthly) {
    for (const o of O.list) {
      if (!o.post) continue; const due = o.sal * 3 + o.debt, pay = Math.min(due, Math.max(0, G.res.tien - 5));
      if (pay > 0) LT.addRes(G, 'tien', -pay, 'Bổng lộc quan viên');
      o.debt = Math.max(0, due - pay); if (o.debt > 0.5 && G.tick % 9 === 0) LT.log(G, 'Nợ bổng quan ' + o.name + ' (' + Math.round(o.debt) + ' quan): trung thành tụt.', 'bad');
    }
  }
  if (quarter) for (const c of cs) if (c.mine && c.id !== G.seatId) quarterDecision(G, c, LT.offById(G, c.quan));
  if (LT.dgWeek) LT.dgWeek(G);      // giai đoạn 2: quan phụ trách tự làm việc (mặc định tắt)
};
function quarterDecision(G, c, o) {
  (c.hist = c.hist || []).push({ y: G.year, w: G.week, ho: c.ho, grain: Math.round(c.grain), last: Math.round(c.last || 0), dt: Math.round(c.dt), gar: c.gar }); if (c.hist.length > 10) c.hist.shift();
  if (!o) { if (G.tick % 18 === 0) LT.offLog(G, c, 'Thành thiếu quan trấn nhậm: việc nước chạy ì ạch (60% hiệu suất).', null); return; }
  const rnd = () => LT.rand(G), nm = o.name;
  // ăn bớt thuế (ẩn cho tới khi thanh tra)
  const stolen = LT.cityYear(c) / 4 * .65 * c.nop * c.tamo; if (stolen > 3) { o.hoard += stolen; LT.offLog(G, c, nm + ' ăn bớt khoảng ' + Math.round(stolen) + ' quan thuế quý này.', o, true); }
  const succ = .25 + o.chinh / 200 * (o.trait === 'trongnong' && c.pc === 'nong' || o.trait === 'trongthuong' && c.pc === 'thuong' ? 1.25 : 1);
  // việc theo phương châm
  if (rnd() < Math.min(.85, succ)) {
    if (c.pc === 'nong') { const dh = Math.round(c.ho * (.008 + o.chinh / 6000)); c.ho = Math.min(LT.CITY_LEVELS[c.lvl].cap, c.ho + dh); c.base = (c.base || c.ho) + Math.round(dh * .5); LT.offLog(G, c, nm + ' khai khẩn thêm ruộng, dân đông thêm ~' + dh + ' hộ.', o); }
    else if (c.pc === 'thuong') { c.mkt = Math.min(6, (c.mkt || 0) + 1); LT.offLog(G, c, nm + ' mở thêm chợ phiên (cấp chợ ' + c.mkt + '): thu nhập thành tăng.', o); }
    else if (c.pc === 'coThu') { c.wall = Math.min(100, c.wall + 4); c.gar = Math.min(Math.round(c.ho * .05), c.gar + Math.round(c.ho * .004)); LT.offLog(G, c, nm + ' đắp thêm thành lũy (phòng ' + Math.round(c.wall) + ').', o); }
    else if (c.pc === 'tanthu') LT.offLog(G, c, nm + ' vơ vét thêm kho dân theo lệnh, dân oán.', o);
    else { c.grain = Math.min(c.ho * 10, c.grain + c.ho * .15); LT.offLog(G, c, nm + ' chăm việc thường nhật, kho đầy thêm.', o); }
  }
  // tự mộ quân (nếu bạn bật): người Thống, Võ cao mộ nhanh, dã tâm cao hay mộ quá tay
  if (c.automo) {
    const room = c.ho - (c.base || c.ho) * .55, want = Math.round(c.ho * (.008 + o.tong / 9000 + o.da / 12000)), n = Math.max(0, Math.min(want, Math.floor(room)));
    if (n > 5) { c.ho -= n; c.binh += n; c.auto = clamp(c.auto + 1 + o.da / 60, 0, 100); LT.offLog(G, c, nm + ' tự mộ ' + n * LT.LINH_PER_HO + ' lính đóng giữ thành (hộ binh +' + n + ').', o); }
  }
  // biến cố nhỏ tự xử
  if (rnd() < .45) {
    const r = rnd();
    if (r < .3) { if ((o.tong + o.vo) / 2 >= 45 || c.gar > c.ho * .04) { c.dt = clamp(c.dt + 1, 0, 100); LT.offLog(G, c, nm + ' dẹp bọn giặc cỏ quanh thành, trị an yên.', o); } else { const l = c.grain * .03; c.grain -= l; c.dt = clamp(c.dt - 2, 0, 100); LT.offLog(G, c, 'Giặc cỏ cướp kho (mất ' + Math.round(l) + ' thạch); ' + nm + ' bất lực.', o); } }
    else if (r < .55) { if (o.tri >= 55) LT.offLog(G, c, 'Nước lên, ' + nm + ' cho đắp đê kịp, ít thiệt hại.', o); else { const l = c.grain * .08; c.grain -= l; c.dt = clamp(c.dt - 3, 0, 100); LT.offLog(G, c, 'Lũ làm mất ' + Math.round(l) + ' thạch; ' + nm + ' xử trí chậm, dân oán.', o); } }
    else if (r < .8) { c.grain = Math.min(c.ho * 10, c.grain + c.grain * .04 + c.ho * .1); LT.offLog(G, c, 'Được mùa; ' + nm + ' cho thu mua thóc vào kho.', o); }
    else { if (o.duc >= 50) { c.dt = clamp(c.dt + 2, 0, 100); LT.offLog(G, c, nm + ' xử vụ kiện ruộng công bằng, dân mến phục.', o); } else { c.dt = clamp(c.dt - 1, 0, 100); LT.offLog(G, c, nm + ' xử án thiên vị, dân bàn tán.', o); } }
  }
  if (c.auto > 60 && G.tick % 18 === 0) LT.offLog(G, c, 'Tự chủ ' + Math.round(c.auto) + ': ' + nm + ' viện cớ nộp chậm.', o);
}
// khi thành ly khai: quan đi theo
LT.offDefect = function (G, c) { const O = LT.off(G), o = LT.offById(G, c.quan); if (o) { O.list.splice(O.list.indexOf(o), 1); O.defected++; } c.quan = null; c.vacant = false; };
// ngự sử thanh tra: lộ tham ô, thu hồi một phần
LT.offInspect = function (G, c) {
  const o = LT.offById(G, c.quan); if (!o) return { text: 'Thành chưa có quan để tra.' };
  const back = o.hoard * .6; o.known = true; c.insp = G.tick;
  if (back > 1) { LT.income(G, back, 'Thu hồi tiền tham ô của ' + o.name); o.trung = clamp(o.trung - 8, 0, 100); LT.offLog(G, c, 'Ngự sử tra ' + o.name + ': thu hồi ' + Math.round(back) + ' quan tham ô.', o); }
  o.hoard -= back; o.liem = clamp(o.liem + 4, 0, 100);
  return { text: ' Quan ' + o.name + ': liêm ' + Math.round(o.liem) + ', đã ăn bớt tổng cộng ' + Math.round(back / .6) + ' quan.' };
};
})(typeof globalThis !== 'undefined' ? globalThis : window);

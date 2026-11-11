'use strict';
// ============================================================================
// QUAN LỘ (GP §6, CT): khảo khóa 5 mục × 20, thanh danh/uy vọng, nghi kỵ, thăng chức,
// bố cáo (CT §11), các huyện thuộc quyền khi làm Thứ sử, thi Tỉnh thí bản rút gọn (CT §3.2).
// ============================================================================
(function (g) {
const LT = g.LT = g.LT || {};
const clamp = LT.clamp;

// ---- khảo khóa ----------------------------------------------------------------
LT.congTrinhPts = function (G) {
  const c = k => LT.count(G, k);
  return .5 * c('road') + 2 * c('pave') + c('wall') + 3 * c('gate') + 3 * c('tower') + 2 * c('well') + 3 * c('clinic') + 2 * c('watch') + 4 * c('school') + 2 * c('granary') + 2 * c('canal') + 2 * c('beacon') + 3 * c('temple');
};
const wkOf = G => { const dem = LT.demandWeek(G).luong + LT.armyDemandWeek(G); return dem > 0 ? (G.res.luong + .5 * G.dan.luong) / dem : 99; };
LT.khaoScores = function (G) {
  const ho = LT.totalHo(G), start = Math.max(1, G.yr.hoStart || ho);
  const growth = (ho - start) / start;
  const s = {};
  s.hokhau = clamp(10 + growth * 40, 0, 20);
  const paid = G.yr.remitT + G.yr.remitL * LT.GOODS.luong.p;
  s.thue = G.yr.quota > 0 ? 20 * clamp(paid / G.yr.quota, 0, 1) : 20;
  const dem = LT.demandWeek(G).luong + LT.armyDemandWeek(G), wk = dem > 0 ? (G.res.luong + .5 * G.dan.luong) / dem : 99;
  s.kho = 20 * clamp(wk / LT.KHO_NEN, 0, 1);
  s.trian = clamp(G.stat.trian / 5, 0, 20);
  const pts = LT.congTrinhPts(G), scale = (60 + ho / 6) * (1 + .04 * (G.year - LT.START_YEAR));
  s.congtrinh = 20 * clamp(pts / scale, 0, 1);
  for (const k in s) s[k] = Math.round(s[k] * 10) / 10;
  const total = Math.round((s.hokhau + s.thue + s.kho + s.trian + s.congtrinh) * 10) / 10;
  return { s, total, growth, paid, pts, scale };
};
LT.gradeOf = t => t >= 80 ? { id: 'thuong', n: 'Hạng Thượng' } : t >= 60 ? { id: 'trung', n: 'Hạng Trung' } : t >= 40 ? { id: 'ha', n: 'Hạng Hạ' } : { id: 'phat', n: 'Dưới 40 — bị giáng' };

LT.khaoKhoa = function (G) {
  const r = LT.khaoScores(G), gr = LT.gradeOf(r.total), eff = [];
  const P = G.player, K = G.khao;
  const rec = { year: G.year, scores: r.s, total: r.total, grade: gr.n, gid: gr.id, eff, details: { growth: r.growth, paid: r.paid, quota: G.yr.quota, weeks: LT.foodWeeks(G), khoWeeks: wkOf(G), pts: r.pts, scale: r.scale }, rank: G.rank };
  if (gr.id === 'thuong') {
    const bonus = Math.round(50 + LT.totalHo(G) / 8); G.res.tien += bonus; LT.flowAdd(G, 'tien', bonus, 'Triều đình thưởng khảo khóa hạng thượng');
    P.thanhdanh = clamp(P.thanhdanh + 3, 0, 100); G.nghiky = Math.max(0, G.nghiky - 6); K.thuong++; K.low = 0;
    eff.push('Thanh danh +3', 'Triều đình ban thưởng ' + bonus + ' quan', 'Nghi kỵ −6', 'Hạng thượng lần thứ ' + K.thuong);
  } else if (gr.id === 'trung') { const bonus = Math.round(25 + LT.totalHo(G) / 16); G.res.tien += bonus; LT.flowAdd(G, 'tien', bonus, 'Triều đình thưởng khảo khóa hạng trung'); P.thanhdanh = clamp(P.thanhdanh + 1, 0, 100); K.low = 0; eff.push('Thanh danh +1', 'Thưởng ' + bonus + ' quan'); }
  else if (gr.id === 'ha') { P.thanhdanh = clamp(P.thanhdanh - 2, 0, 100); G.nghiky = Math.min(100, G.nghiky + 3); K.low = 0; eff.push('Thanh danh −2', 'Bị quở trách, nghi kỵ +3'); }
  else {
    K.low++; P.thanhdanh = clamp(P.thanhdanh - 10, 0, 100); G.nghiky = Math.min(100, G.nghiky + 12);
    const fine = Math.round(G.res.tien * .25); G.res.tien -= fine; LT.flowAdd(G, 'tien', -fine, 'Phạt bổng vì khảo khóa kém');
    eff.push('Thanh danh −10', 'Phạt bổng ' + fine + ' quan', 'Nghi kỵ +12');
    if (K.low >= 2) { G.over = { win: false, title: 'Bị bãi chức', text: 'Hai năm liền khảo khóa dưới 40 điểm. Triều đình bãi chức tri huyện của bạn, tước hết quyền cai trị.' }; eff.push('Hai lần liền dưới 40: BÃI CHỨC'); }
    else eff.push('Cảnh cáo: lần dưới 40 thứ hai sẽ bị bãi chức');
  }
  // các điểm cộng/trừ thường niên
  if (LT.count(G, 'school') > 0) { P.thanhdanh = clamp(P.thanhdanh + 1, 0, 100); eff.push('Châu học: Thanh danh +1'); }
  if (G.stat.dantam >= 70) { P.thanhdanh = clamp(P.thanhdanh + 1, 0, 100); eff.push('Dân tâm cao: Thanh danh +1'); }
  if (G.stat.dantam < 25) { P.thanhdanh = clamp(P.thanhdanh - 3, 0, 100); eff.push('Dân oán: Thanh danh −3'); }
  if (G.nghiky >= 85 && !G.over) { G.over = { win: false, title: 'Bị triệu về kinh', text: 'Triều đình nghi kỵ bạn quá lâu. Một đạo chiếu triệu bạn về kinh rồi tước chức, không bao giờ trở lại.' }; }
  K.history.push(rec); K.last = rec;
  LT.log(G, 'KHẢO KHÓA năm ' + G.year + ': ' + r.total + ' điểm — ' + gr.n + '.', gr.id === 'thuong' ? 'good' : gr.id === 'phat' ? 'bad' : '');
  G.pendingKhao = rec;   // giao diện hiện bảng điểm
  return rec;
};

// ---- thăng chức: sáu bậc (GP §6) ------------------------------------------------------------------------
const SEAT_LVL = [0, 1, 2, 2, 3, 3, 4];
LT.armyFoodYear = G => LT.armyDemandWeek(G) * LT.WEEKS_YEAR;
LT.promotion = function (G) {
  const K = G.khao, P = G.player, yrs = G.year - (G.rankSince || LT.START_YEAR);
  if (G.rank === 1) {
    const c1 = K.thuong >= 3 || G.quanCong >= 2;
    const conds = [
      { ok: K.thuong >= 3 || G.quanCong >= 2, t: '3 lần khảo khóa hạng Thượng (' + K.thuong + '/3) hoặc 2 quân công (' + G.quanCong + '/2)' },
      { ok: P.thanhdanh >= 40, t: 'Thanh danh ≥ 40 để được tiến cử (hiện ' + Math.round(P.thanhdanh) + ')' },
      { ok: !!K.passed, t: 'Đỗ kỳ Tỉnh thí (khoa Tiến sĩ)' },
    ];
    return { to: 2, name: 'Thứ sử', conds, ready: conds.every(c => c.ok), needExam: c1 && P.thanhdanh >= 40 && !K.passed };
  }
  if (G.rank === 2) {
    const conds = [
      { ok: G.loanSince >= 1 || G.winsSince >= 2, t: 'Dẹp 1 cuộc loạn (' + (G.loanSince || 0) + '/1) hoặc thắng 2 trận (' + (G.winsSince || 0) + '/2)' },
      { ok: G.stat.thanhphong >= 50, t: 'Thành phòng ≥ 50 (hiện ' + Math.round(G.stat.thanhphong) + ')' },
      { ok: P.uyvong >= 30, t: 'Uy vọng ≥ 30 (hiện ' + Math.round(P.uyvong) + ')' },
    ];
    return { to: 3, name: 'Phòng ngự sứ', conds, ready: conds.every(c => c.ok) };
  }
  if (G.rank === 3) {
    const ch = LT.mineCountLvl(G, 2), army = LT.armyCount(G);
    const conds = [
      { ok: ch >= 3, t: 'Giữ từ 3 châu (thành cấp châu trở lên): hiện ' + ch + '/3 — phải đánh chiếm thêm trong 🗺️ Thiên hạ' },
      { ok: P.thanhdanh >= 60 || army >= 10000, t: 'Thanh danh ≥ 60 (hiện ' + Math.round(P.thanhdanh) + ') hoặc binh lực ≥ 10.000 (hiện ' + LT.fmtN(army) + ')' },
      { ok: G.nghiky < 60, t: 'Nghi kỵ của triều đình < 60 (hiện ' + Math.round(G.nghiky) + ')' },
      { ok: yrs >= 2, t: 'Giữ chức Phòng ngự sứ ≥ 2 năm (' + yrs + '/2)' },
    ];
    return { to: 4, name: 'Tiết độ sứ', conds, ready: conds.every(c => c.ok) };
  }
  if (G.rank === 4) {
    const n = LT.mineCount(G), army = LT.armyCount(G), nt = G.world.ns[G.nation], nationArmy = Math.max(1, nt.troops);
    const conds = [
      { ok: n >= 6, t: 'Giữ ≥ 6 thành (hiện ' + n + ')' },
      { ok: army >= 15000, t: 'Quân ≥ 15.000 (hiện ' + LT.fmtN(army) + ')' },
      { ok: P.uyvong >= 60, t: 'Uy vọng ≥ 60 (hiện ' + Math.round(P.uyvong) + ')' },
      { ok: G.res.luong + G.dan.luong >= LT.armyFoodYear(G), t: 'Kho đủ nuôi quân một năm' },
      { ok: yrs >= 3, t: 'Giữ chức Tiết độ sứ ≥ 3 năm (' + yrs + '/3)' },
    ];
    const base = conds.every(c => c.ok);
    const phong = { ok: base && G.nghiky < 35 && P.thanhdanh >= 70 && G.res.tien >= 500, t: 'Xin phong: nghi kỵ < 35, Thanh danh ≥ 70, dâng cống 500 quan (không mất Chính danh)' };
    const lap = { ok: base && army >= .4 * nationArmy && G.stat.dantam >= 55 && n >= 6 && LT.mineCountLvl(G, 2) >= 3, t: 'Tự lập: quân ≥ 40% quân nước (' + LT.fmtN(Math.round(.4 * nationArmy)) + '), dân tâm ≥ 55, ≥ 3 châu — triều đình sẽ thảo phạt, Chính danh −15' };
    return { to: 5, name: 'Vương', conds, ready: phong.ok || lap.ok, paths: { phong, lap } };
  }
  if (G.rank === 5) {
    const n = LT.mineCount(G), capTaken = G.world.cities[G.world.capIds[G.nation]].mine || G.world.cities.some(c => c.mine && c.capital);
    const conds = [
      { ok: n >= 10, t: 'Giữ ≥ 10 thành để lập nước mới (hiện ' + n + ') — hoặc đã chiếm một kinh đô' },
      { ok: G.chinhdanh >= 35, t: 'Chính danh ≥ 35 (hiện ' + Math.round(G.chinhdanh) + ')' },
      { ok: yrs >= 3, t: 'Giữ chức Vương ≥ 3 năm (' + yrs + '/3)' },
    ];
    conds[0].ok = conds[0].ok || capTaken;
    return { to: 6, name: 'Hoàng đế', conds, ready: conds.every(c => c.ok) };
  }
  return null;
};
LT.promote = function (G, opt) {
  opt = opt || {};
  const p = LT.promotion(G); if (!p || !p.ready) return false;
  const from = G.rank;
  if (from === 4) { // Vương: xin phong hay tự lập
    const path = opt.path || (p.paths.phong.ok ? 'phong' : 'lap');
    if (!p.paths[path] || !p.paths[path].ok) return false;
    if (path === 'phong') { G.res.tien -= 500; LT.flowAdd(G, 'tien', -500, 'Dâng cống xin phong vương'); G.chinhdanh = clamp(G.chinhdanh + 25, 0, 100); G.vassal = true; }
    else {
      G.chinhdanh = clamp(G.chinhdanh - 15, 0, 100); G.indep = true; G.world.ns[12].alive = true; G.world.ns[12].troops = 0; G.world.ns[12].n = 'Nước ' + G.name;
      for (const c of G.world.cities) if (c.mine) c.own = 12; LT.syncNations(G); G.world.rel[G.nation] = -70; G.nghiky = 0;
      LT.addChron(G, 'Bạn tự lập xưng vương, cắt đứt với triều đình ' + LT.natName(G, G.nation) + '. Nước láng giềng cũ thành kẻ thù.');
    }
  }
  G.rank = p.to; G.era = Math.min(3, G.rank); G.rankSince = G.year; G.seatLvl = SEAT_LVL[G.rank]; G.player.thanhdanh = clamp(G.player.thanhdanh + 5, 0, 100);
  G.nghiky = from === 4 && G.indep ? 0 : Math.max(0, G.nghiky - 15); G.lab.budget = LT.laoDichBudget(G);
  const txt = {
    2: 'Bạn được phong Thứ sử. Chia thuế nay: thượng cung 40% · lưu sứ 25% · giữ 35%. Châu thành (tối đa 12.000 hộ) và nhà phố 50 hộ được mở, quân tối đa 2.500, 3 huyện thuộc quyền, nỏ thủ, trọng kỵ, chuyên bán trà rượu.',
    3: 'Bạn được phong Phòng ngự sứ: binh quyền cả châu, quân tối đa 6.000, nhà lầu 140 hộ, đơn vị công thành. Từ nay bạn được XUẤT QUÂN: đánh chiếm thành các nước khác trong 🗺️ Thiên hạ. Muốn lên Tiết độ sứ phải giữ từ 3 châu.',
    4: 'Bạn là Tiết độ sứ: cai trị một trấn, quân tối đa 20.000 (đơn vị là quân 2.500), phủ thành tối đa 40.000 hộ, thành thuộc quyền do quan trấn nhậm cai (phương châm, luân chuyển, thanh tra). Chia thuế: giữ 70%. Con đường tiếp theo: xưng Vương.',
    5: from === 4 && G.vassal ? 'Triều đình sách phong bạn làm Vương: tự trị, ngoại giao riêng đủ mọi giao ước, đúc tiền, quân tối đa 60.000; Chính danh +25.' : 'Bạn tự lập xưng Vương, không ai phong. Triều đình cũ coi bạn là phản nghịch và sẽ tiến đánh; Chính danh −15. Được đúc tiền, ngoại giao riêng, quân tối đa 60.000.',
    6: 'Bạn xưng Hoàng đế: lập triều đình, đặt niên hiệu, quân tối đa 250.000, kinh đô tối đa 120.000 hộ, thánh chỉ. Đích cuối: giữ 90 trên 120 thành gồm kinh đô Trung Nguyên để thống nhất thiên hạ.',
  }[G.rank];
  G.pendingPromo = { rank: G.rank, text: txt };
  if (G.rank === 2) { const c = LT.grantCities(G, 3, 1, 1); LT.log(G, 'Giao thêm ' + c.length + ' huyện thuộc quyền: ' + c.map(x => x.n).join(', ') + '.', 'good'); G.loanSince = 0; G.winsSince = 0; }
  if (G.rank === 3) { const c = LT.grantCities(G, 1, 2, 2); LT.log(G, c.length ? 'Triều đình giao thêm châu thành ' + c[0].n + ' dưới quyền bạn.' : 'Không còn châu nào để giao.', 'good'); G.winsSince = 0; G.loanSince = 0; }
  if (G.rank >= 4) { G.orders.max = 4 + Math.floor(G.player.chinh / 20); }
  LT.log(G, 'THĂNG CHỨC: bạn trở thành ' + LT.RANKS[G.rank].n + '!', 'good');
  LT.computeQuota(G);
  return true;
};
LT.proclaim = function (G, name) { // xưng đế (bậc 6): đặt niên hiệu
  const p = LT.promotion(G); if (G.rank !== 5 || !p || !p.ready) return false;
  G.eraName = (name || 'Thiên Hựu').slice(0, 14); LT.promote(G); G.chinhdanh = clamp(G.chinhdanh + (G.vassal ? 5 : -5), 0, 100); LT.addChron(G, 'Bạn xưng Hoàng đế, đặt niên hiệu "' + G.eraName + '".'); return true;
};

// ---- bố cáo (CT §11) -------------------------------------------------------------------
LT.BOCAO = {
  giamlaodich: { n: 'Lệnh giảm lao dịch', rank: 4, cost: {}, dur: 36, qdt: 1.5, d: 'Bớt công xây dựng: nông +2, công +1 — dân tâm +1,5 mỗi quý (1 năm). Ngân sách lao dịch ×1,3.' },
  thuongquan: { n: 'Lệnh thưởng quân', rank: 4, cost: { tien: 120 }, dur: 9, d: 'Thưởng tiền, lụa cho lính: sĩ khí +15, uy vọng +3 (1 quý).', once: G => { for (const u of G.units) u.sk = Math.min(100, u.sk + 15); G.player.uyvong = Math.min(100, G.player.uyvong + 3); } },
  caukien: { n: 'Lệnh cầu hiền', rank: 4, cost: { tien: 60 }, dur: 36, qdt: .5, d: 'Bổng lộc cho người đến: sĩ +2, Thanh danh +3 (1 năm).', once: G => { G.player.thanhdanh = Math.min(100, G.player.thanhdanh + 3); } },
  daxa: { n: 'Chiếu đại xá', rank: 6, cost: {}, dur: 9, qdt: 4, d: 'Mọi tầng lớp +2, tội nhân quy phục; trị an −5 tạm thời (1 quý, mỗi 3 năm).', once: G => { G.stat.trian = Math.max(0, G.stat.trian - 5); } },
  giamthue: { n: 'Chiếu giảm thuế', rank: 6, cost: {}, dur: 36, qdt: 2.5, d: 'Thuế thu −25% trong 1 năm; nông +3, thương +2 (dân tâm +2,5 mỗi quý).' },
  tutrach: { n: 'Chiếu tự trách mình', rank: 6, cost: {}, dur: 18, qdt: 3, d: 'Sau thiên tai, bại trận: Uy vọng −5; sĩ +3, nông +2 (2 quý).', once: G => { G.player.uyvong = Math.max(0, G.player.uyvong - 5); } },
  haudai: { n: 'Chiếu hậu đãi dòng vua cũ', rank: 6, cost: { tien: 300 }, dur: 9, d: 'Chính danh +10 (vĩnh viễn nếu giữ), sĩ +2.', once: G => { G.chinhdanh = Math.min(100, G.chinhdanh + 10); } },
  tetroi: { n: 'Tế trời, đổi niên hiệu', rank: 6, cost: { tien: 500 }, dur: 9, d: 'Chính danh +5 (chỉ một lần mỗi triều).', once: G => { G.chinhdanh = Math.min(100, G.chinhdanh + 5); } },
  khuyennong: { n: 'Cáo thị khuyến nông', cost: { luong: 50 }, dur: 36, d: 'Cho vay giống: ruộng +5%, dân tâm +1 mỗi quý. Cho 1 năm.' },
  chieudan: { n: 'Bố cáo chiêu dân khẩn hoang', cost: {}, dur: 108, d: 'Miễn thuế đất mới 3 năm (thu thuế −5%): lưu dân kéo đến nhiều hơn. Cho 3 năm.', needTax: true },
  minhoan: { n: 'Bố cáo minh oan, xét lại án', cost: { tien: 15 }, dur: 18, d: 'Dân tâm +1,5 mỗi quý, Thanh danh +3 khi xong. Cho 2 quý.' },
  chante: { n: 'Mở kho chẩn tế', cost: {}, dur: 9, d: 'Mỗi tuần phát 8% lương trong kho quan cho dân; dân tâm +3. Cho 1 quý.' },
};
LT.bocaoSlots = G => G.rank >= 6 ? 6 : G.rank >= 4 ? 4 : 2;
LT.issueBocao = function (G, id) {
  const d = LT.BOCAO[id]; if (!d) return { ok: false, err: 'Không có bố cáo này' };
  if (G.bocaoList.some(b => b.id === id)) return { ok: false, err: 'Bố cáo này đang có hiệu lực' };
  if ((d.rank || 1) > G.rank) return { ok: false, err: 'Cần chức ' + LT.RANKS[d.rank].n };
  const slots = LT.bocaoSlots(G); if (G.bocaoList.length >= slots) return { ok: false, err: 'Chức này chỉ có ' + slots + ' văn bản hiệu lực cùng lúc' };
  if (!LT.afford(G, d.cost)) return { ok: false, err: 'Thiếu ' + LT.costTxt(d.cost) };
  LT.pay(G, d.cost, 1, 'Bố cáo: ' + d.n);
  G.bocaoList.push({ id, left: d.dur, total: d.dur, kept: true }); G.bocao[id] = true; if (d.once) d.once(G);
  LT.log(G, 'Ban bố cáo: ' + d.n + '.', 'good');
  return { ok: true };
};
function bocaoWeek(G) {
  G.bocao = {};
  for (const b of G.bocaoList) {
    G.bocao[b.id] = true;
    if (b.id === 'chante') { const give = Math.min(G.res.luong * .08, G.res.luong); if (give > 1) { G.res.luong -= give; G.dan.luong += give; LT.flowAdd(G, 'luong', -give, 'Phát chẩn (bố cáo)'); LT.flowAdd(G, 'dluong', give, 'Nhận chẩn tế'); } }
    if (b.id === 'chieudan' && G.pol.tax >= 3 && b.kept) { b.kept = false; G.player.tin = clamp(G.player.tin - 15, 0, 100); LT.log(G, 'Bạn hứa miễn thuế đất mới nhưng lại tăng thuế: Tín −15.', 'bad'); }
    const dd = LT.BOCAO[b.id]; if (dd.qdt && G.week % 9 === 0) G.stat.dantam = clamp(G.stat.dantam + dd.qdt * G.player.tin / 50, 0, 100);
    if (b.id === 'khuyennong' && G.week % 9 === 0) G.stat.dantam = clamp(G.stat.dantam + 1 * G.player.tin / 50, 0, 100);
    if (b.id === 'minhoan' && G.week % 9 === 0) G.stat.dantam = clamp(G.stat.dantam + 1.5 * G.player.tin / 50, 0, 100);
    b.left--;
    if (b.left <= 0) { if (b.kept) G.player.tin = clamp(G.player.tin + 3, 0, 100); if (b.id === 'minhoan') G.player.thanhdanh = clamp(G.player.thanhdanh + 3, 0, 100); LT.log(G, 'Bố cáo "' + LT.BOCAO[b.id].n + '" hết hạn' + (b.kept ? ', giữ trọn lời: Tín +3.' : '.'), ''); }
  }
  G.bocaoList = G.bocaoList.filter(b => b.left > 0);
  G.bocao = {}; for (const b of G.bocaoList) G.bocao[b.id] = true;
}

// ---- nhịp tuần của quan lộ -----------------------------------------------------------------
LT.politicsWeek = function (G) {
  bocaoWeek(G);
  if (G.week === LT.KHAO_WEEK) LT.khaoKhoa(G);
  if (G.week === 1 && G.rank >= 5 && G.pol.coin && G.pol.coin !== 'none') LT.mint(G);
  if (G.week === 1 && G.rank >= 2 && G.stat.dantam > 70) G.chinhdanh = clamp(G.chinhdanh + 1, 0, 100);
  if (G.nghiky > 0 && G.week === 18) G.nghiky = Math.max(0, G.nghiky - 1);
  if (G.rebelRisk > 8 && !G.pendingBattle && !G.pendingEvent) { G.rebelRisk = 0; if (LT.startRebellion) LT.startRebellion(G); }
  // uy vọng giảm dần khi nhàn rỗi
  if (G.week % 12 === 0 && G.player.uyvong > 20) G.player.uyvong -= .5;
};

LT.mint = function (G) { // Vương trở lên được đúc tiền (KT §9)
  const ho = LT.totalHo(G) + LT.ownedCities(G).reduce((a, c) => a + c.ho, 0), sat = G.pol.coin === 'sat';
  const amt = Math.round(ho * (sat ? .06 : .02)); G.res.tien += amt; LT.flowAdd(G, 'tien', amt, sat ? 'Đúc tiền sắt, tiền chì' : 'Đúc tiền đồng tốt');
  if (sat) { G.mods.push({ k: 'phonvinh', v: -6, w: 36 }); G.chinhdanh = clamp(G.chinhdanh - 2, 0, 100); G.stat.dantam = clamp(G.stat.dantam - 3, 0, 100); LT.log(G, 'Đúc tiền sắt thu ' + amt + ' quan nhưng giá cả tăng, dân tâm −3.', 'bad'); } else LT.log(G, 'Đúc tiền đồng thu ' + amt + ' quan.', 'good');
};
// ---- Tỉnh thí bản rút gọn (CT §3.2: kinh nghĩa 30đ + phán 30đ + sách luận 40đ; đỗ ≥ 65) ----
LT.EXAM_KN = [
  { q: 'Lưỡng thuế thu vào những tháng nào?', o: ['Tháng 3 và tháng 9', 'Tháng 6 (tiền) và tháng 11 (thóc)', 'Tháng 1 và tháng 12', 'Chỉ tháng 9'], a: 1 },
  { q: 'Một khu ruộng 20 nông hộ cho khoảng bao nhiêu thạch mỗi năm?', o: ['180', '360', '720', '1.080'], a: 1 },
  { q: 'Phần thuế nộp cho tiết độ sứ gọi là gì?', o: ['Thượng cung', 'Lưu châu', 'Lưu sứ', 'Tuế tệ'], a: 2 },
  { q: 'Một hộ ăn mỗi tuần bao nhiêu thạch lương?', o: ['0,05', '0,15', '0,5', '1'], a: 1 },
  { q: 'Kho lương tối thiểu nên giữ đủ cho bao nhiêu tuần?', o: ['6', '12', '18', '36'], a: 2 },
  { q: 'Một năm trong lịch có bao nhiêu tuần (mỗi tuần 10 ngày)?', o: ['12', '24', '36', '52'], a: 2 },
  { q: 'Tri huyện chia thuế ba phần theo tỉ lệ nào (thượng cung / lưu sứ / giữ lại)?', o: ['40 / 30 / 30', '30 / 30 / 40', '50 / 25 / 25', '20 / 20 / 60'], a: 0 },
  { q: 'Khảo khóa tháng 12 chấm bao nhiêu mục, mỗi mục tối đa bao nhiêu điểm?', o: ['3 mục × 33', '5 mục × 20', '4 mục × 25', '10 mục × 10'], a: 1 },
  { q: 'Hạng Thượng trong khảo khóa là bao nhiêu điểm trở lên?', o: ['60', '70', '80', '90'], a: 2 },
  { q: 'Binh chủng nào khắc kỵ binh ×1,5?', o: ['Cung thủ', 'Đao thuẫn', 'Trường thương', 'Nỏ thủ'], a: 2 },
  { q: 'Mỗi cấp trang bị cộng bao nhiêu Công và Thủ?', o: ['+4%', '+8%', '+15%', '+25%'], a: 1 },
  { q: 'Công trình ngoài bán kính kho (8 ô theo đường) đạt bao nhiêu công suất?', o: ['30%', '60%', '80%', '100%'], a: 1 },
  { q: 'Thóc sau vụ gặt thường có giá khoảng bao nhiêu lần giá gốc?', o: ['0,7', '1,0', '1,4', '2,5'], a: 0 },
  { q: 'Mức thuế nào làm 4% hộ bỏ trốn mỗi kỳ?', o: ['Nặng', 'Tận thu', 'Thường', 'Khoan'], a: 1 },
];
LT.EXAM_AN = [
  { t: 'Hào tộc họ Trương lấn 30 mẫu ruộng của năm nông hộ đang nợ thóc; họ Trương là thông gia của thứ sử.',
    o: [['Trả ruộng cho dân, phạt họ Trương (đúng luật, dân tâm +, thứ sử ghét).', 10], ['Cho dân chuộc dần bằng thóc vay của kho thường bình (hợp tình, không ai mất mặt, tốn kho).', 15], ['Xử cho họ Trương (an toàn cho mình, dân tâm −, năm hộ thành tá điền).', 3]] },
  { t: 'Một lái buôn tố người chủ chợ bắt ép giá. Hai bên đều đưa lễ cho quan. Nhà chủ chợ đóng nhiều thuế chợ nhất huyện.',
    o: [['Nhận lễ của bên trả nhiều hơn, xử theo bên đó.', 2], ['Từ chối cả hai lễ, đo lường lại cân đấu, xử theo luật và phạt nhẹ bên sai.', 15], ['Hòa giải cho xong, không ai bị phạt nhưng không đổi cân đấu.', 9]] },
  { t: 'Lính hương binh bắt một nông hộ trộm thóc giữa lúc đói; hộ đó có ba con nhỏ.',
    o: [['Xử đánh trượng rồi thả, kèm cho vay thóc qua mùa đói.', 15], ['Xử trảm để răn đe.', 2], ['Tha ngay không điều kiện.', 8]] },
  { t: 'Sứ giả triều đình đòi gấp một nửa thuế năm nay trong khi huyện vừa mất mùa.',
    o: [['Nộp đủ ngay, để dân chịu đói.', 5], ['Dâng sớ trình bày mất mùa, xin hoãn một nửa, nộp trước một phần.', 15], ['Nói dối là đã nộp rồi.', 1]] },
];
LT.EXAM_SL = { // huyện 800 hộ, kho 400 thạch, tháng 5 hạn mất nửa vụ; chọn 3/6
  t: 'Huyện 800 hộ, kho còn 400 thạch, tháng 5 gặp hạn, ước mất nửa vụ. Chọn đúng 3 trong 6 cách xử lý.',
  p: [
    { n: 'Mở kho phát chẩn', ho: 9, dt: 9, kho: -4 },
    { n: 'Vay thóc hào tộc lãi 25%', ho: 7, dt: 1, kho: 2 },
    { n: 'Giảm thuế xuống mức Khoan', ho: 8, dt: 10, kho: -5 },
    { n: 'Gọi lao dịch đào mương', ho: 6, dt: -3, kho: 3 },
    { n: 'Cấm nấu rượu', ho: 3, dt: 0, kho: 8 },
    { n: 'Xin triều đình hoãn thượng cung', ho: 5, dt: 3, kho: 6 },
  ],
};
LT.examScoreSL = function (picks) { // điểm = số hộ còn lại (40%) + dân tâm (30%) + kho và nợ (30%), tối đa 40
  const P = LT.EXAM_SL.p; let ho = 10, dt = 8, kho = 6;
  for (const i of picks) { ho += P[i].ho; dt += P[i].dt; kho += P[i].kho; }
  const sc = (v, mx) => clamp(v / mx, 0, 1);
  return Math.round(40 * (.4 * sc(ho, 28) + .3 * sc(dt, 24) + .3 * sc(kho, 20)));
};
LT.newExam = function (G) {
  const kn = LT.EXAM_KN.slice().sort(() => LT.rand(G) - .5).slice(0, 6).map(q => { const idx = q.o.map((x, i) => i).sort(() => LT.rand(G) - .5); return { q: q.q, o: idx.map(i => q.o[i]), a: idx.indexOf(q.a) }; });
  const an = LT.EXAM_AN.slice().sort(() => LT.rand(G) - .5).slice(0, 2).map(c => ({ t: c.t, o: c.o.map((x, i) => [x[0], x[1], i]).sort(() => LT.rand(G) - .5) }));
  return { kn, an, ans: [], pans: [], picks: [], step: 0, first: !G.khao.examTried };
};
LT.gradeExam = function (ex) {
  const kn = ex.ans.reduce((n, a, i) => n + (a === ex.kn[i].a ? 5 : 0), 0);
  const an = ex.pans.reduce((n, a, i) => n + ex.an[i].o[a][1], 0);
  const sl = LT.examScoreSL(ex.picks);
  return { kn, an, sl, total: kn + an + sl, pass: kn + an + sl >= 65 };
};
})(typeof globalThis !== 'undefined' ? globalThis : window);

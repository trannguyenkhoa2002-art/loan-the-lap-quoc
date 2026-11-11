'use strict';
// ============================================================================
// VÒNG 2 — CHIẾN DỊCH: quân thật của các nước, nước láng giềng xâm lấn thành của bạn, bạn xuất quân đánh thành
// (hành quân, tiếp tế, dã chiến, vây / công thành / dụ hàng — GP §10.5), đại chiến hơn 100.000 quân, kết cục (GP §12).
// ============================================================================
(function (g) {
const LT = g.LT = g.LT || {};
const clamp = LT.clamp, NAT = LT.NATIONS, U = LT.UNITS;

// ---- bên máy cỡ lớn: tổng quân chia thành tối đa 9 quân đoàn, binh chủng theo nước --------------------
LT.bigSide = function (G, name, total, natId, opt) {
  opt = opt || {};
  const nU = clamp(Math.ceil(total / Math.max(60, LT.unitCap(G) * 1.2)), 3, 9), per = total / nU, yrs = G.year - LT.START_YEAR;
  const cav = natId === 10 || natId === 1 ? .36 : natId === 3 || natId === 5 ? .06 : .18;
  const comp = [];
  for (let i = 0; i < nU; i++) {
    const r = LT.rand(G); let type;
    if (i < 2 || r < .34) type = r < .6 ? 'truongthuong' : 'daothuan'; else if (r < .34 + cav) type = r < .34 + cav * .45 ? 'trongky' : 'khinhky'; else type = r < .85 ? 'cung' : 'no';
    if (i === 0) type = 'daothuan'; if (i === 1) type = 'truongthuong';
    comp.push({ type, n: Math.max(30, Math.round(per * (.85 + LT.rand(G) * .3))), hl: Math.round(opt.hl || 40 + Math.min(25, yrs * .9) + LT.rand(G) * 14), sk: Math.round(opt.sk || 58 + LT.rand(G) * 12), tb: opt.tb || (yrs > 20 ? 3 : yrs > 8 ? 2 : 1) });
  }
  const chief = { name: 'Đại tướng ' + name, tong: Math.round(55 + LT.rand(G) * 28), tri: Math.round(52 + LT.rand(G) * 30) };
  const s = LT.aiSide(name, comp, chief, { wall: opt.wall || 0, camcu: !!opt.camcu });
  s.form = opt.form || 'phuong'; s.conds = ['sikhi40', 'thuongvong30'];
  return s;
};
LT.sideN = s => LT.sideUnits(s).reduce((a, u) => a + u.n, 0);

function buildPb(G, kind, o) {
  const cfgA = { A: LT.buildPlayerSide(G, LT.ensureFormation(G)) };
  const eSide = o.side; const total = Math.round(LT.sideN(eSide));
  const wallLevel = Math.floor((o.cityId != null && o.cityId !== G.seatId ? G.world.cities[o.cityId].wall : G.stat.thanhphong) / 25);
  const pb = { kind, title: o.title, text: o.text, terrain: o.terrain || 'dongbang', holder: o.holder || null, crosser: o.crosser || null, canFlee: !!o.canFlee, canHold: !!o.canHold, canAuto: !!o.canAuto, ransom: o.ransom || 0, wallLevel, mode: o.canHold && wallLevel > 0 ? 'thu' : 'da', enemy: eSide, enemyName: o.name, nation: o.nation != null ? o.nation : null, total, cityId: o.cityId != null ? o.cityId : null };
  if (!o.keepForm) { // máy chọn trận hình đối phó
    const cfg = { A: cfgA.A, B: eSide, terrain: pb.terrain, holder: pb.holder, crosser: pb.crosser };
    const best = LT.aiPickFormation(cfg, 'B', 5); eSide.form = best.form; eSide.wing = best.wing;
  }
  G.pendingBattle = pb; G.speed = 0; return pb;
}

// ---- nước láng giềng xâm lấn thành của bạn (quân số thật, GP §11) ------------------------------------------
LT.maybeInvade = function (G) {
  const w = G.world, cs = w.cities; if (G.year < 919 && G.tick < 60) return;
  const mine = cs.filter(c => c.mine), seen = new Set();
  const army = LT.armyCount(G);
  for (const c of mine) for (const di of c.adj) {
    const d = cs[di]; if (d.mine || seen.has(d.own) || d.own === 12 || !w.ns[d.own].alive) continue;
    const j = d.own; seen.add(j);
    if (G.treaties.batxam.indexOf(j) >= 0 || G.treaties.xungthan.indexOf(j) >= 0 || G.treaties.hoathan.indexOf(j) >= 0) continue;
    const chr = { 'hiếu chiến': 2.2, 'phản trắc': 1.3, 'thủ thành': .2, 'trọng thương': .45 }[NAT[j].chr];
    const rel = w.rel[j], relF = rel < -20 ? 1 + (-rel - 20) / 30 : rel > 20 ? .15 : .55;
    const kdBoost = (j === 10 && w.hist.khietdan) ? 2.5 : 1, hostile = (G.indep && j === G.nation) ? 5 : 1;
    const p = .045 * chr * relF * kdBoost * hostile * (G.treaties.lienminh.length ? .6 : 1) * (G.rank >= 2 ? 1.2 : 1) * (G.rank >= 4 ? 1.4 : 1);
    if (LT.rand(G) >= p) continue;
    // chọn thành bị đánh: thành giáp biên của nước đó (ưu tiên ngẫu nhiên)
    const targets = mine.filter(m => m.adj.some(x => cs[x].own === j && !cs[x].mine)), tgt = targets[Math.floor(LT.rand(G) * targets.length)] || c;
    const base = G.rank >= 3 ? Math.min(LT.natField(G, j) * (.12 + .06 * (G.rank - 2)), 1.5 * army + tgt.gar + 400) : LT.raidSize(G) * (.9 + w.ns[j].army / 150);
    const total = Math.round(Math.max(80, base * (j === 10 ? 1.25 : 1) * (G.treaties.lienminh.length ? .75 : 1)));
    LT.openInvasion(G, j, tgt, total);
    return;
  }
};
LT.openInvasion = function (G, j, tgt, total) {
  const nm = LT.natName(G, j);
  if (tgt.id === G.seatId && G.rank < 3) { LT.openBattle(G, 'nation', { total, name: nm, nation: j }); LT.addChron(G, nm + ' xuất quân xâm lấn nước ta, đánh vào huyện của bạn.'); return; }
  const side = LT.bigSide(G, nm, total, j, { wall: 0 });
  const tr = LT.pick(G, ['dongbang', 'dongbang', 'doi', 'vuotsong']);
  buildPb(G, 'nation', { title: 'Quân ' + nm + ' đánh ' + tgt.n + '!', text: nm + ' xuất ' + LT.fmtN(total) + ' quân đánh vào ' + tgt.n + ' (' + LT.CITY_LEVELS[tgt.id === G.seatId ? G.seatLvl : tgt.lvl].n + ', ' + LT.fmtN(tgt.id === G.seatId ? LT.totalHo(G) : tgt.ho) + ' hộ). Đem quân cứu viện, hoặc để thành tự thủ bằng quân đồn trú (' + LT.fmtN(tgt.gar) + ' lính, thành phòng ' + Math.round(tgt.id === G.seatId ? G.stat.thanhphong : tgt.wall) + ').', name: nm, nation: j, cityId: tgt.id, side, terrain: tr, holder: tr === 'doi' ? 'A' : null, crosser: tr === 'vuotsong' ? 'B' : null, canHold: true, canAuto: tgt.id !== G.seatId, ransom: Math.round(total * 1.5) });
  LT.addChron(G, nm + ' xuất ' + LT.fmtN(total) + ' quân đánh ' + tgt.n + ' của bạn.');
};
// thành tự thủ bằng quân đồn trú (không cần quân dã chiến của bạn)
LT.autoDefend = function (G) {
  const pb = G.pendingBattle; if (!pb || pb.cityId == null || pb.cityId === G.seatId) return null;
  const c = G.world.cities[pb.cityId], gar = Math.max(30, c.gar + Math.round(c.ho * .015));
  const comp = [{ type: 'daothuan', n: Math.round(gar * .3), hl: 38, sk: 58, tb: 1 }, { type: 'truongthuong', n: Math.round(gar * .3), hl: 38, sk: 58, tb: 1 }, { type: 'cung', n: Math.round(gar * .25), hl: 36, sk: 58, tb: 1 }, { type: 'no', n: Math.round(gar * .15), hl: 36, sk: 58, tb: 1 }];
  const me = LT.aiSide(c.n + ' (đồn trú)', comp, { name: c.quan || 'Quan trấn nhậm', tong: Math.min(80, 30 + c.chinh / 2), tri: c.chinh }, { wall: Math.floor(c.wall / 25) }); me.form = 'vien';
  const cfg = { A: me, B: LT.clone(pb.enemy), terrain: pb.terrain, holder: pb.holder, crosser: pb.crosser, nameA: c.n + ' (đồn trú)', nameB: pb.enemyName };
  const rep = LT.runBattle(cfg, Math.floor(LT.rand(G) * 1e9)); rep.kind = 'auto'; rep.title = 'Thành ' + c.n + ' tự thủ'; rep.outcome = { lines: [] };
  const won = rep.result === 'A', lost = rep.result === 'B';
  LT.afterBigBattle(G, pb, rep, won, lost, true);
  G.pendingBattle = null; G.raid = null; return rep;
};
LT.afterBigBattle = function (G, pb, rep, won, lost, auto) {
  const out = rep.outcome, nid = pb.nation, w = G.world;
  if (nid != null && w.ns[nid]) { w.ns[nid].troops = Math.max(0, w.ns[nid].troops - (rep.sum.B.lost + (rep.pursuit && rep.pursuit.side === 'A' ? rep.pursuit.cas : 0))); }
  if (rep.sum.A.start + rep.sum.B.start > 200000) LT.addChron(G, 'ĐẠI CHIẾN ' + LT.fmtN(rep.sum.A.start) + ' đánh ' + LT.fmtN(rep.sum.B.start) + ' quân: ' + (won ? 'bạn thắng' : lost ? 'bạn thua' : 'bất phân thắng bại') + ', hai bên thương vong ' + LT.fmtN(rep.sum.A.lost) + ' và ' + LT.fmtN(rep.sum.B.lost) + '.');
  G.bigBattles = (G.bigBattles || 0) + (rep.sum.A.start >= 100000 && rep.sum.B.start >= 100000 ? 1 : 0);
  G.maxBattle = Math.max(G.maxBattle || 0, Math.min(rep.sum.A.start, rep.sum.B.start));
  if (pb.kind === 'nation' && pb.cityId != null && pb.cityId !== G.seatId) {
    const c = w.cities[pb.cityId];
    if (lost) { LT.transferCity(G, c.id, pb.nation); c.mine = false; c.ho = Math.round(c.ho * .8); c.dt = 35; c.gar = Math.round(c.ho * .03); out.lines.push('Thành ' + c.n + ' thất thủ, rơi vào tay ' + LT.natName(G, pb.nation) + '.'); LT.addChron(G, 'Thành ' + c.n + ' của bạn thất thủ.'); LT.log(G, 'Mất thành ' + c.n + '!', 'bad'); }
    else if (won) { out.lines.push('Thành ' + c.n + ' giữ được; dân tâm +4.'); c.dt = clamp(c.dt + 4, 0, 100); c.gar = Math.max(30, Math.round(c.gar * .8)); G.chinhdanh = clamp(G.chinhdanh + 2, 0, 100); }
    else { out.lines.push('Thành ' + c.n + ' còn đứng, nhưng bị cướp phá.'); c.ho = Math.round(c.ho * .94); }
    if (auto) { if (won) G.player.uyvong = clamp(G.player.uyvong + 1, 0, 100); }
  }
  if (pb.kind === 'campaign' && G.camp) {
    if (won) { G.camp.phase = 'siege'; G.camp.siege = { w: 0, mode: 'vay' }; out.lines.push('Dã chiến thắng lợi: quân địch ngoài thành đã tan, bắt đầu vây ' + w.cities[G.camp.target].n + '.'); G.chinhdanh = clamp(G.chinhdanh + 2, 0, 100); }
    else { out.lines.push('Chiến dịch thất bại, phải lui quân về.'); LT.endCampaign(G, 'bại trận'); G.player.uyvong = clamp(G.player.uyvong - 3, 0, 100); }
  }
  if (pb.kind === 'siege' && G.camp) {
    if (won) LT.captureCity(G, w.cities[G.camp.target], 'công phá');
    else { out.lines.push('Cuộc tấn công thành bị đẩy lui, quân tổn hại nặng; có thể tiếp tục vây hoặc rút quân.'); G.camp.siege.mode = 'vay'; }
  }
  if (lost && pb.kind !== 'tieuphi') G.chinhdanh = clamp(G.chinhdanh - 1, 0, 100);
};

// ---- chiến dịch của bạn: xuất quân đánh thành ------------------------------------------------------
LT.campTargets = function (G) {
  const w = G.world, cs = w.cities, set = new Map();
  if (G.rank < 3) return [];
  for (const c of cs) if (c.mine) for (const di of c.adj) { const d = cs[di]; if (!d.mine && d.own !== 12 && w.ns[d.own].alive && !set.has(d.id) && (G.indep || d.own !== G.nation)) set.set(d.id, d); }
  return [...set.values()];
};
LT.musterOld = (G, c) => Math.round(Math.min(LT.natField(G, c.own) * (c.capital ? .7 : c.lvl >= 3 ? .4 : c.lvl === 2 ? .2 : .12) * 3, Math.max(300, LT.campArmy(G) * (c.capital ? 1.25 : c.lvl >= 3 ? 1.0 : c.lvl === 2 ? .85 : .7)))); // địch dốc quân tương xứng với đạo quân đang kéo tới, tối đa theo quân dã chiến của họ // quân dã chiến địch sẽ ra đón đánh khi thành bị tấn công
LT.muster = function (G, c) { // quân địch ra đón; thành lớn bị đánh nghiêm trọng thì dốc phần lớn quân dã chiến quyết chiến
  const field = LT.natField(G, c.own), a = LT.campArmy(G), major = c.capital || c.lvl >= 3;
  if (major && a >= .35 * field) return Math.round(field * .9);
  const frac = major ? .5 : c.lvl === 2 ? .22 : .12;
  return Math.round(Math.min(field * frac * 3, Math.max(300, a * (c.capital ? 1.1 : c.lvl >= 3 ? .85 : c.lvl === 2 ? .65 : .5))));
};
LT.campArmy = G => LT.usableUnits(G).reduce((a, u) => a + u.n, 0);
LT.campAvail = function (G, tid) {
  const c = G.world.cities[tid]; if (G.rank < 3) return 'Cần chức Phòng ngự sứ để được xuất quân';
  if (G.camp) return 'Đang có chiến dịch chưa xong';
  if (G.pendingBattle) return 'Đang có trận chưa xong';
  if (!LT.campTargets(G).some(x => x.id === tid)) return 'Thành này không giáp thành của bạn';
  if (LT.campArmy(G) < Math.max(100, c.gar * .5)) return 'Quân dã chiến quá ít (cần ≥ ' + Math.max(100, Math.round(c.gar * .5)) + ')';
  const lg = LT.logistics(G, tid); if (!lg.okMarch) return 'Lương chỉ nuôi được ' + Math.round(lg.weeks) + ' tuần, chưa đủ cho ' + lg.march + ' tuần hành quân (xem mục Hậu cần)';
  return '';
};
LT.startCampaign = function (G, tid) {
  const err = LT.campAvail(G, tid); if (err) return { ok: false, err };
  const c = G.world.cities[tid], w = G.world, from = w.cities.filter(x => x.mine && x.adj.indexOf(tid) >= 0).sort((a, b) => Math.hypot(a.x - c.x, a.y - c.y) - Math.hypot(b.x - c.x, b.y - c.y))[0];
  const d = Math.hypot(from.x - c.x, from.y - c.y); let weeks = clamp(Math.ceil(d * 70), 2, 9);
  const m = LT.month(G.week); if (m === 7 || m === 8) weeks = Math.ceil(weeks * 1.5);
  const units = LT.usableUnits(G), cavN = units.filter(u => U[u.type].kind === 'ky').reduce((a, u) => a + u.n, 0); if (cavN / Math.max(1, LT.campArmy(G)) > .6) weeks = Math.max(2, Math.ceil(weeks / 2));
  const rel = w.rel[c.own], notes = [];
  if (rel > 10 && !(G.indep && c.own === G.nation)) { G.player.tin = clamp(G.player.tin - 10, 0, 100); G.chinhdanh = clamp(G.chinhdanh - 3, 0, 100); G.stat.dantam = clamp(G.stat.dantam - 2, 0, 100); notes.push('Vô cớ xuất binh: Tín −10, Chính danh −3, dân tâm −2.'); }
  else if (rel < -25) notes.push('Báo thù: danh nghĩa bình thường.'); else notes.push('Đòi đất cũ: danh nghĩa bình thường.');
  w.rel[c.own] = clamp(w.rel[c.own] - 12, -100, 100);
  G.camp = { startN: LT.campArmy(G), target: tid, nation: c.own, from: from.id, left: weeks, weeks, phase: 'march', siege: null, started: G.tick, starve: 0, lastDohang: -9, name: c.n };
  LT.log(G, 'Xuất quân đánh ' + c.n + ' của ' + LT.natName(G, c.own) + ' (hành quân ' + weeks + ' tuần). ' + notes.join(' '), '');
  LT.addChron(G, 'Bạn xuất quân (' + LT.fmtN(LT.campArmy(G)) + ' lính) đánh ' + c.n + ' của ' + LT.natName(G, c.own) + '.');
  return { ok: true, weeks };
};
LT.endCampaign = function (G, why) {
  if (!G.camp) return; const camp = G.camp;
  LT.log(G, 'Chiến dịch ' + camp.name + ' kết thúc (' + why + ').', why === 'hạ thành' ? 'good' : '');
  if (why === 'đói' || why === 'bại trận') {
    const lost = Math.max(0, (camp.startN || 0) - LT.campArmy(G));
    G.pendingNotice = { title: why === 'đói' ? 'Chiến dịch tan vì đói' : 'Chiến dịch thất bại', text: why === 'đói' ? 'Đạo quân đánh ' + camp.name + ' thiếu lương quá ' + camp.starve + ' tuần liền: sĩ khí sụp đổ, lính đào ngũ hàng loạt. Quân bạn từ ' + LT.fmtN(camp.startN || 0) + ' còn ' + LT.fmtN(LT.campArmy(G)) + ' (mất ' + LT.fmtN(lost) + '). Lần sau kiểm tra mục Hậu cần trước khi xuất quân: tồn lương các thành dọc đường tiếp tế, và bật 🌾 điều lương.' : 'Đại quân bại trận trước ' + camp.name + ': quân từ ' + LT.fmtN(camp.startN || 0) + ' còn ' + LT.fmtN(LT.campArmy(G)) + ' (mất ' + LT.fmtN(lost) + '), uy vọng tụt. Xem chiến báo để rút kinh nghiệm: trận hình, đơn vị tàn, địa hình.' };
    G.speed = 0;
  }
  G.camp = null;
};
LT.retreatCampaign = function (G) {
  if (!G.camp) return { ok: false, err: 'Không có chiến dịch' };
  for (const u of LT.usableUnits(G)) u.sk = clamp(u.sk - 8, 0, 100); G.player.uyvong = clamp(G.player.uyvong - 2, 0, 100);
  LT.endCampaign(G, 'rút quân'); if (G.pendingBattle && (G.pendingBattle.kind === 'campaign' || G.pendingBattle.kind === 'siege')) G.pendingBattle = null; return { ok: true };
};
LT.setSiege = function (G, mode) {
  if (!G.camp || G.camp.phase !== 'siege') return { ok: false, err: 'Chưa tới giai đoạn vây thành' };
  const c = G.world.cities[G.camp.target], n = LT.campArmy(G);
  if (mode === 'vay' && n < c.gar * 1.8) return { ok: false, err: 'Vây thành cần quân ≥ 1,8 lần quân thủ (' + Math.round(c.gar * 1.8) + ')' };
  if (mode === 'congthanh' && LT.engines(G) < 30) return { ok: false, err: 'Cần đơn vị Công thành (vân thê, xung xa, xe bắn đá) ≥ 30 người' };
  G.camp.siege.mode = mode; return { ok: true };
};
LT.engines = G => LT.usableUnits(G).filter(u => U[u.type].siege).reduce((a, u) => a + u.n, 0);
LT.dohang = function (G) {
  const camp = G.camp; if (!camp || camp.phase !== 'siege') return { ok: false, err: 'Chưa vây thành' };
  const c = G.world.cities[camp.target], cost = Math.max(60, Math.round(c.ho * .03));
  if (G.tick - camp.lastDohang < 3) return { ok: false, err: 'Phải chờ 3 tuần giữa hai lần dụ hàng' };
  if (G.res.tien < cost) return { ok: false, err: 'Cần ' + cost + ' quan để mua chuộc nội ứng' };
  G.res.tien -= cost; LT.flowAdd(G, 'tien', -cost, 'Dụ hàng ' + c.n); camp.lastDohang = G.tick;
  const p = clamp((55 - c.dt) / 70 + .12 + (LT.campArmy(G) / Math.max(1, c.gar)) / 40 + (camp.siege.w * .01), .02, .85);
  if (LT.rand(G) < p) { LT.captureCity(G, c, 'dụ hàng không đổ máu'); return { ok: true, win: true, p }; }
  return { ok: true, win: false, p };
};
LT.startAssault = function (G) {
  const camp = G.camp; if (!camp || camp.phase !== 'siege') return { ok: false, err: 'Chưa vây thành' };
  if (G.pendingBattle) return { ok: false, err: 'Đang có trận' };
  const c = G.world.cities[camp.target], n = LT.campArmy(G); if (n < c.gar * .8) return { ok: false, err: 'Quân quá ít để công thành' };
  const gar = Math.max(40, c.gar + Math.round(c.ho * .01)), side = LT.bigSide(G, LT.natName(G, c.own) + ' (thủ ' + c.n + ')', gar, c.own, { wall: Math.floor(c.wall / 25), camcu: true, hl: 55 });
  side.form = 'vien';
  buildPb(G, 'siege', { title: 'Công thành ' + c.n, text: 'Tổng công ' + c.n + ': ' + LT.fmtN(gar) + ' quân thủ, thành phòng ' + Math.round(c.wall) + ' (cấp tường ' + Math.floor(c.wall / 25) + ': Thủ ×' + (1 + .5 * Math.floor(c.wall / 25)) + '). Khí giới đã hạ thành phòng ' + Math.round(camp.siege.hit || 0) + ' điểm.', name: LT.natName(G, c.own) + ' (thủ thành)', nation: c.own, cityId: c.id, side, terrain: 'dongbang', keepForm: true, canFlee: false });
  return { ok: true };
};
LT.captureCity = function (G, c, how) {
  const w = G.world, old = c.own, oldNs = w.ns[old];
  const loss = c.gar; if (oldNs) oldNs.troops = Math.max(0, oldNs.troops - loss);
  c.own = G.indep ? 12 : G.nation; c.mine = true; c.ho = Math.round(c.ho * .85); c.dt = 35; c.wall = Math.round(c.wall * .6); c.gar = Math.round(c.ho * .03); c.grain = Math.round(c.grain * .3);
  LT.manage(G, c); c.lowtax = 72; c.tan = 18; c.quan = null; c.dist = LT.hopsToSeat(G, c.id);
  LT.syncNations(G);
  G.world.rel[old] = clamp(G.world.rel[old] - 6, -100, 100); G.capturedN = (G.capturedN || 0) + 1; G.quanCong++; G.wins++; G.winsSince = (G.winsSince || 0) + 1;
  G.chinhdanh = clamp(G.chinhdanh + 3, 0, 100); G.player.uyvong = clamp(G.player.uyvong + 4, 0, 100); G.player.thanhdanh = clamp(G.player.thanhdanh + 1, 0, 100);
  const loot = Math.round(c.ho * .4); G.res.tien += loot; LT.flowAdd(G, 'tien', loot, 'Chiếm ' + c.n); G.res.luong += Math.round(loot * 2); LT.flowAdd(G, 'luong', Math.round(loot * 2), 'Chiến lợi phẩm ' + c.n);
  LT.log(G, 'HẠ THÀNH ' + c.n + ' (' + how + '): thành mới có ' + LT.fmtN(c.ho) + ' hộ; hai năm đầu thuế thấp vì dân chưa phục. Thu ' + loot + ' quan.', 'good');
  LT.addChron(G, 'Bạn chiếm ' + c.n + ' của ' + LT.natName(G, old) + ' (' + how + ').');
  if (oldNs && oldNs.cities === 0) { oldNs.alive = false; LT.addChron(G, LT.natName(G, old) + ' bị bạn diệt.'); G.chinhdanh = clamp(G.chinhdanh + 3, 0, 100); }
  LT.endCampaign(G, 'hạ thành');
  if (G.pendingBattle && G.pendingBattle.kind === 'siege') G.pendingBattle = null;
};
LT.campWeek = function (G) {
  const camp = G.camp; if (!camp) return;
  const c = G.world.cities[camp.target];
  if (c.mine) { G.camp = null; return; }
  if (!G.world.ns[c.own].alive || c.own !== camp.nation) camp.nation = c.own;
  const n = LT.campArmy(G), farm = 1 + .06 * LT.hopsToSeat(G, camp.target), need = LT.armyDemandWeek(G) * (farm - 1);
  // tiếp tế: đường dài hao thêm 6% mỗi chặng; thiếu lương thì sĩ khí −15 mỗi tuần và lính đào ngũ (GP §9.3)
  const extra = Math.min(G.res.luong, need); G.res.luong -= extra; LT.flowAdd(G, 'luong', -extra, 'Hao hụt đường tiếp tế chiến dịch');
  if (G.foodShort) { camp.starve++; for (const u of LT.usableUnits(G)) { u.sk = clamp(u.sk - 15, 0, 100); const d = Math.ceil(u.n * .03); u.n = Math.max(1, u.n - d); LT.soldiersDied(G, u, d); } if (camp.starve === 1) LT.log(G, 'Quân chiến dịch thiếu lương: sĩ khí −15 mỗi tuần, lính đào ngũ!', 'bad'); } else camp.starve = 0;
  if (camp.starve >= 4) { LT.log(G, 'Quân đói rã, chiến dịch đành bỏ dở.', 'bad'); LT.endCampaign(G, 'đói'); return; }
  if (camp.phase === 'march') {
    camp.left--;
    if (camp.left <= 0) {
      camp.phase = 'arrive'; const mus = LT.muster(G, c);
      if (mus < .25 * n) { camp.phase = 'siege'; camp.siege = { w: 0, mode: 'vay' }; LT.log(G, 'Quân ' + LT.natName(G, c.own) + ' không dám ra giao chiến; bạn bắt đầu vây ' + c.n + '.', 'good'); }
      else {
        const side = LT.bigSide(G, LT.natName(G, c.own), Math.round(mus), c.own, { camcu: false }); const tr = LT.pick(G, ['dongbang', 'dongbang', 'doi', 'rung', 'vuotsong', 'damlay']);
        buildPb(G, 'campaign', { title: 'Dã chiến trước ' + c.n, text: 'Quân ' + LT.natName(G, c.own) + ' ' + LT.fmtN(Math.round(mus)) + ' kéo ra đón đánh ngoài ' + c.n + '. Thắng thì vây thành; thua thì chiến dịch tan.', name: LT.natName(G, c.own), nation: c.own, cityId: c.id, side, terrain: tr, holder: tr === 'doi' ? 'B' : null, crosser: tr === 'vuotsong' ? 'A' : null, canFlee: true });
        G.alertFlash = { text: 'Đại quân đã tới ' + c.n + ': quân địch ' + LT.fmtN(Math.round(mus)) + ' ra giao chiến.' };
      }
    }
    return;
  }
  if (camp.phase !== 'siege') return;
  const sg = camp.siege; sg.w++;
  const eat = c.gar * LT.LINH_AN + c.ho * .02; c.grain -= eat;
  if (sg.mode === 'congthanh') { const hit = LT.engines(G) * .02; c.wall = Math.max(0, c.wall - hit); sg.hit = (sg.hit || 0) + hit; }
  if (sg.w > 8 && LT.rand(G) < .5) { for (const u of LT.usableUnits(G)) { const d = Math.ceil(u.n * .005); u.n = Math.max(1, u.n - d); LT.soldiersDied(G, u, d); } }
  if (c.grain <= 0 && sg.mode === 'vay') { LT.captureCity(G, c, 'vây hết lương, thành mở cửa hàng'); return; }
  if (c.grain <= 0 && n >= c.gar * 1.8) { LT.captureCity(G, c, 'thành hết lương xin hàng'); return; }
  if (c.dt < 25 && LT.rand(G) < .03 * sg.w / 4) LT.captureCity(G, c, 'nội ứng mở cửa');
};

// ---- kết cục (GP §12) ----------------------------------------------------------------------------------
LT.checkEndings = function (G) {
  if (G.over) return;
  const cs = G.world.cities, mine = LT.mineCount(G);
  if (mine >= 90 && cs[G.world.capIds[0]].mine) {
    G.over = { win: true, title: 'Thống nhất thiên hạ', text: 'Bạn nắm ' + mine + ' trong 120 thành, gồm cả kinh đô Trung Nguyên ' + cs[G.world.capIds[0]].n + '. Mười hai nước chỉ còn là chuyện cũ — năm ' + G.year + ' bạn thống nhất thiên hạ.' };
  } else if (mine === 0) G.over = { win: false, title: 'Mất hết thành', text: 'Không còn thành nào dưới quyền bạn.' };
};
LT.finalEnding = function (G) {
  const mine = LT.mineCount(G);
  if (G.rank >= 5 && mine >= 15) return { win: true, title: 'Bá chủ một phương', text: 'Đến năm 979 bạn vẫn là ' + LT.RANKS[G.rank].n + ' của một nước ' + mine + ' thành. Thiên hạ chưa thống nhất, nhưng không ai dám xem thường bạn.' };
  return { win: G.rank >= 4, title: G.rank >= 4 ? 'Giữ vững một cõi' : 'Hết ván', text: 'Đến năm 979, bạn dừng ở chức ' + LT.RANKS[G.rank].n + ' với ' + mine + ' thành.' };
};
})(typeof globalThis !== 'undefined' ? globalThis : window);

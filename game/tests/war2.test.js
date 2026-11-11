// Vòng 2: quân từ dân, thành, chiến dịch, đại chiến > 100.000 quân, tự động chơi tới bậc Vương, lưu/tải.
// Chạy: node tests/war2.test.js
const path = require('path');
for (const f of ['data', 'city', 'economy', 'game', 'battle', 'politics', 'war', 'events', 'world', 'wcities', 'campaign']) require(path.join(__dirname, '..', 'js', f + '.js'));
const LT = globalThis.LT;
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL  ' + m); } else console.log('  ok    ' + m); };
const fin = G => {
  for (const k in G.res) if (!isFinite(G.res[k]) || G.res[k] < -1e-6) return 'res.' + k + '=' + G.res[k];
  for (const k in G.H) if (!isFinite(G.H[k]) || G.H[k] < 0) return 'H.' + k + '=' + G.H[k];
  for (const c of G.world.cities) if (!isFinite(c.ho) || c.ho < 0 || !isFinite(c.dt) || !isFinite(c.gar)) return 'city ' + c.n + ' ho=' + c.ho + ' dt=' + c.dt;
  for (const n of G.world.ns) if (!isFinite(n.troops) || n.troops < 0) return 'troops ' + n.id + '=' + n.troops;
  return '';
};
const mkBarracks = (G, n) => { for (let i = 0; i < n; i++) { let placed = false; for (let y = G.hy - 12; y < G.hy + 20 && !placed; y++) for (let x = G.hx - 20; x < G.hx - 6 && !placed; x++) if (!LT.canPlace(G, 'barracks', x, y)) { const r = LT.place(G, 'barracks', x, y, { free: true, instant: true }); placed = r.ok; } } };
const calm = G => { G.pendingEvent = null; G.pendingBattle = null; G.raid = null; G.pendingKhao = null; G.pendingPromo = null; };

console.log('--- A. Quân đào tạo từ dân: mộ → tân binh → quân; giải ngũ; lính chết mất hộ');
{
  const G = LT.newGame(7, 'Dân', 5); G.res.tien = 3000; G.res.binhkhi = 400; G.res.go = 500; G.H.luu = 60; G.H.nong = 140; mkBarracks(G, 1);
  const tot0 = LT.totalHo(G), b0 = G.H.binh, work0 = G.H.luu + G.H.nong + G.H.cong;
  const r = LT.recruit(G, 'daothuan', 100);
  ok(r.ok, 'Mộ 100 đao thuẫn được (' + (r.err || '') + ')');
  const need = Math.ceil(100 / LT.LINH_PER_HO);
  ok(G.H.binh === b0 + need, 'Hộ binh tăng đúng ' + need + ' hộ (5 lính/hộ): ' + b0 + ' → ' + G.H.binh);
  ok(G.H.luu + G.H.nong + G.H.cong === work0 - need, 'Hộ làm việc giảm đúng ' + need + ' hộ (' + work0 + ' → ' + (G.H.luu + G.H.nong + G.H.cong) + ')');
  ok(LT.totalHo(G) === tot0, 'Tổng số hộ không đổi lúc mộ (hộ thành hộ binh)');
  const u = r.u; ok(u.tan > 0 && LT.usableUnits(G).indexOf(u) < 0, 'Tân binh chưa dùng được: còn luyện ' + u.tan + ' tuần');
  LT.ensureFormation(G); ok(!G.formation.slots.includes(u.id) && !G.formation.reserve.includes(u.id), 'Tân binh chưa vào đội hình');
  for (let i = 0; i < 12; i++) { LT.tickWeek(G); calm(G); }
  ok(!(u.tan > 0) && u.hl >= 35, 'Sau luyện: dùng được, huấn luyện ' + Math.round(u.hl));
  LT.ensureFormation(G); ok(G.formation.slots.includes(u.id) || G.formation.reserve.includes(u.id), 'Quân luyện xong vào đội hình');
  const bb = G.H.binh; LT.soldiersDied(G, u, 50); ok(G.H.binh === bb - 10, 'Lính chết 50 → mất 10 hộ binh vĩnh viễn (' + bb + ' → ' + G.H.binh + ')');
  const l0 = G.H.luu, bb2 = G.H.binh; LT.discharge(G, u.id); ok(G.H.luu > l0 && G.H.binh < bb2, 'Giải ngũ trả hộ binh về làm dân (lưu dân ' + l0 + ' → ' + G.H.luu + ')');
  const g2 = LT.newGame(7, 'Mùa', 5); g2.res.tien = 3000; g2.res.binhkhi = 400; mkBarracks(g2, 1); g2.week = 20; const d0 = g2.stat.dantam; LT.recruit(g2, 'truongthuong', 100); const penNormal = d0 - g2.stat.dantam;
  const g3 = LT.newGame(7, 'Bận', 5); g3.res.tien = 3000; g3.res.binhkhi = 400; mkBarracks(g3, 1); g3.week = 2; const e0 = g3.stat.dantam; LT.recruit(g3, 'truongthuong', 100); const penBusy = e0 - g3.stat.dantam;
  ok(penBusy > penNormal * 1.8 && g3.lab.busy, 'Bắt lính mùa cấy gặt: dân oán gấp đôi (' + penNormal.toFixed(1) + ' vs ' + penBusy.toFixed(1) + ') và ruộng hụt người');
  const g4 = LT.newGame(7, 'Mua', 5); g4.res.tien = 3000; g4.res.binhkhi = 0; mkBarracks(g4, 1); const t4 = g4.res.tien; LT.recruit(g4, 'truongthuong', 100); ok(t4 - g4.res.tien >= 100 * 5 * 1.5 - 1, 'Thiếu binh khí thì mua bù giá ×1,5 (tốn ' + Math.round(t4 - g4.res.tien) + ' quan)');
}
console.log('--- B. Thành thuộc quyền cũng cấp đinh tráng và chịu hậu quả');
{
  const G = LT.newGame(7, 'Thành', 6); G.rank = 2; LT.grantCities(G, 3, 1, 1); G.res.tien = 5000; G.res.binhkhi = 800; mkBarracks(G, 1);
  const c = LT.ownedCities(G)[0], ho0 = c.ho, dt0 = c.dt;
  const r = LT.recruit(G, 'truongthuong', 250, c.id);
  ok(r.ok && c.ho === ho0 - 50 && c.binh === 50, 'Mộ 250 lính từ ' + c.n + ': thành mất 50 hộ (' + ho0 + ' → ' + c.ho + '), hộ binh 50');
  ok(c.dt < dt0, 'Dân tâm của thành tụt vì bắt lính (' + Math.round(dt0) + ' → ' + Math.round(c.dt) + ')');
  const u = G.units[G.units.length - 1]; ok(u.from === c.id, 'Đơn vị nhớ thành nguồn');
  LT.soldiersDied(G, u, 100); ok(c.binh === 30, 'Lính của thành chết 100 → thành mất 20 hộ binh');
  LT.discharge(G, u.id); ok(c.binh < 30 && c.ho > ho0 - 50, 'Giải ngũ trả hộ về thành nguồn');
  const big = LT.ownedCities(G)[1]; big.ho = 60; const e2 = LT.canRecruit(G, 'truongthuong', 240, big.id); ok(/động viên quá/.test(e2), 'Thành nhỏ bị chặn khi động viên quá 60% hộ: "' + e2 + '"');
}
console.log('--- C. Thế giới 120 thành, nước máy có quân thật tỉ lệ với thành');
{
  const G = LT.newGame(3, 'Thế', 9); const w = G.world;
  ok(w.cities.length === 120, '120 thành (' + w.cities.length + ')');
  ok(LT.NATIONS.every(n => w.cities.filter(c => c.own === n.id).length === n.cities), 'Mỗi nước đúng số thành theo bảng GP §3');
  ok(w.cities.every(c => c.ho <= LT.CITY_LEVELS[c.lvl].cap), 'Hộ mỗi thành không vượt trần cấp thành (3.000/12.000/40.000/120.000)');
  const t = w.ns.slice(0, 12).map(n => n.troops); ok(t.every(x => x > 0), 'Mọi nước có quân thật: ' + t.map(Math.round).join(', '));
  ok(w.ns[0].troops > 3 * w.ns[2].troops, 'Hậu Lương (22 thành) đông quân hơn nhiều so với Kỳ (5 thành): ' + Math.round(w.ns[0].troops) + ' vs ' + Math.round(w.ns[2].troops));
  const seen = new Set([0]), q = [0]; for (let i = 0; i < q.length; i++) for (const n of w.cities[q[i]].adj) if (!seen.has(n)) { seen.add(n); q.push(n); } ok(seen.size === 120, 'Đồ thị đường đi liên thông (' + seen.size + '/120)');
  ok(!w.cities.some(c => c.own === 3 && /Lạc|Hằng|Tương/.test(c.n)), 'Tên thành hợp vùng: nước Tiền Thục không có tên kiểu Hoa Bắc');
  for (let i = 0; i < 36 * 12; i++) { LT.tickWeek(G); calm(G); if (G.over) break; }
  ok(!fin(G), 'Mười hai năm: không NaN/âm (' + (fin(G) || 'tốt') + ')');
  console.log('  biên niên:', w.chron.slice(0, 3).map(c => c.t.slice(0, 70)).join(' / '));
  ok(LT.NATIONS.some(n => w.cities.filter(c => c.own === n.id).length !== n.cities), 'Nước máy đánh nhau bằng quân thật: số thành đã đổi chủ');
}
console.log('--- D. Đại chiến: mỗi bên trên 100.000 quân');
{
  const G = LT.newGame(0, 'Đại', 3); G.rank = 6; G.seatLvl = 4; G.chinhdanh = 60;
  const ty = ['daothuan', 'truongthuong', 'cung', 'no', 'trongky', 'khinhky', 'truongthuong', 'daothuan', 'cung'];
  G.units = ty.map((t, i) => ({ id: 100 + i, type: t, n: 13000, hl: 70, sk: 72, tb: 3, gen: null, tan: 0 }));
  G.formation = null; LT.ensureFormation(G);
  const me = LT.buildPlayerSide(G, G.formation), foe = LT.bigSide(G, 'Hậu Lương', 118000, 0, {});
  const nA = LT.sideN(me), nB = LT.sideN(foe); console.log('  hai bên: ' + Math.round(nA) + ' vs ' + Math.round(nB));
  ok(nA > 100000 && nB > 100000, 'Mỗi bên vượt 100.000 quân');
  const t0 = Date.now(), rep = LT.runBattle({ A: me, B: foe, terrain: 'dongbang', nameA: 'Ta', nameB: 'Hậu Lương' }, 31), ms = Date.now() - t0;
  console.log('  kết quả ' + rep.result + ' (' + rep.why + '), ' + rep.hieps.length + ' hiệp, ' + ms + ' ms; thương vong ta ' + rep.sum.A.lost + ', địch ' + rep.sum.B.lost);
  ok(rep.hieps.length >= 3 && rep.hieps.every(h => h.lines.length <= 30), 'Chiến báo hợp lệ: mỗi hiệp ≤ 30 dòng dù trận 100.000+ quân');
  ok(rep.sum.A.lost > 3000 && rep.sum.B.lost > 3000 && isFinite(rep.sum.A.end) && isFinite(rep.sum.B.end), 'Thương vong hai bên hàng nghìn, không NaN');
  ok(rep.hieps.every(h => h.lines.every(l => l.fx && isFinite(l.luc) && l.fx.rv > 0 && l.fx.fatf > 0)), 'Mỗi dòng có đủ hệ số ngẫu nhiên và mệt mỏi');
  const est = LT.estimateWin({ A: me, B: foe, terrain: 'dongbang' }, 12); ok(est.win >= 0 && est.win <= 1, 'Ước tính thắng chạy được với 100.000+ quân (' + Math.round(est.win * 100) + '%)');
}
console.log('--- E. Chiến dịch: hành quân, tiếp tế, dã chiến, vây/công thành, chiếm thành');
{
  const G = LT.newGame(7, 'Chiến', 8); G.rank = 3; G.seatLvl = 2; LT.grantCities(G, 3, 1, 1); const tg = LT.campTargets(G);
  ok(tg.length > 0, 'Có thành địch giáp thành của bạn: ' + tg.slice(0, 3).map(c => c.n).join(', '));
  G.units = []; for (let i = 0; i < 4; i++) G.units.push({ id: 500 + i, type: i === 3 ? 'congthanh' : 'daothuan', n: i === 3 ? 300 : 3000, hl: 70, sk: 75, tb: 3, tan: 0, gen: null });
  G.res.luong = 50000; G.dan.luong = 50000; G.res.tien = 5000;
  const c = tg.sort((a, b) => a.gar - b.gar)[0]; G.world.ns[c.own].troops = LT.natGarrison(G, c.own) + 4000; const r = LT.startCampaign(G, c.id); ok(r.ok, 'Xuất quân đánh ' + c.n + ' (' + (r.err || r.weeks + ' tuần hành quân') + ')');
  let battles = 0, guard = 0;
  while (G.camp && guard++ < 200) {
    LT.tickWeek(G); G.pendingEvent = null; G.raid = null; G.pendingKhao = null;
    if (G.pendingBattle) { battles++; LT.ensureFormation(G); LT.resolveBattle(G); }
    if (G.camp && G.camp.phase === 'siege') { if (LT.engines(G) >= 30 && G.camp.siege.w < 3) LT.setSiege(G, 'congthanh'); if (G.camp.siege.w === 3) { LT.startAssault(G); if (G.pendingBattle) { battles++; LT.resolveBattle(G); } } }
  }
  ok(c.mine && !G.camp, 'Chiếm được ' + c.n + ' sau ' + guard + ' tuần, ' + battles + ' trận; ' + LT.mineCount(G) + ' thành');
  ok(c.lowtax > 0 && c.tan > 0 && c.dt <= 40, 'Thành mới chiếm: hai năm thuế thấp, dân chưa phục (dân tâm ' + Math.round(c.dt) + ')');
  ok(G.quanCong >= 1, 'Quân công tăng (' + G.quanCong + ')');
  ok(LT.campAvail(LT.newGame(7, 'x', 1), c.id) !== '', 'Chức tri huyện không được xuất quân');
}
console.log('--- F. Bốn bậc sau: Tiết độ sứ, Vương, Hoàng đế');
{
  const G = LT.newGame(7, 'Bậc', 4); G.rank = 3; G.rankSince = G.year - 3; G.seatLvl = 2; G.player.thanhdanh = 80; G.player.uyvong = 70;
  LT.grantCities(G, 4, 1, 2); const cs = G.world.cities.filter(c => c.own === G.nation && !c.mine && c.lvl >= 2).slice(0, 2); for (const c of cs) LT.manage(G, c);
  let p = LT.promotion(G); console.log('  điều kiện 3→4:', p.conds.map(c => (c.ok ? 'ok ' : 'chưa ') + c.t.slice(0, 28)).join(' | '));
  ok(p.ready && LT.promote(G) && G.rank === 4 && LT.armyCap(G) === 20000 && LT.unitCap(G) === 2500 && G.seatLvl === 2, 'Lên Tiết độ sứ: quân 20.000, đơn vị 2.500, trị sở giữ nguyên cấp (chỉ đổi khi dời)');
  ok(LT.SPLIT[4][2] === .7, 'Tiết độ sứ giữ 70% thuế');
  G.rankSince = G.year - 4; G.res.tien = 3000; G.res.luong = 80000; G.dan.luong = 80000; G.player.uyvong = 70; G.nghiky = 5;
  for (const c of G.world.cities.filter(c => c.own === G.nation && !c.mine).slice(0, 4)) LT.manage(G, c);
  G.units = [{ id: 900, type: 'daothuan', n: 16000, hl: 60, sk: 70, tb: 2, tan: 0, gen: null }]; G.stat.dantam = 70;
  p = LT.promotion(G); ok(p.paths.phong.ok, 'Điều kiện xin phong đủ: ' + p.conds.map(c => c.ok ? 'ok' : 'chưa').join(' '));
  ok(LT.promote(G, { path: 'phong' }) && G.rank === 5 && G.vassal && !G.indep, 'Xin phong → Vương (vẫn thuộc triều đình, Chính danh +25 = ' + G.chinhdanh + ')');
  ok(LT.armyCap(G) === 60000, 'Vương: quân tối đa 60.000');
  G.rankSince = G.year - 4; G.chinhdanh = 60; for (const c of G.world.cities.filter(c => !c.mine).slice(0, 8)) { c.own = G.nation; LT.manage(G, c); } LT.syncNations(G);
  p = LT.promotion(G); ok(p.ready && LT.proclaim(G, 'Thiên Hựu') && G.rank === 6 && G.eraName === 'Thiên Hựu', 'Xưng Hoàng đế, niên hiệu ' + G.eraName + ', quân tối đa ' + LT.armyCap(G));
  ok(LT.armyCap(G) >= 250000, 'Hoàng đế: quân 250.000');
  const H = LT.newGame(7, 'Phản', 4); H.rank = 4; H.rankSince = H.year - 4; H.seatLvl = 3; H.units = [{ id: 1, type: 'daothuan', n: 16000, hl: 60, sk: 70, tb: 2, tan: 0, gen: null }]; H.res.luong = 80000; H.dan.luong = 80000; H.player.uyvong = 70; H.stat.dantam = 70;
  for (const c of H.world.cities.filter(c => c.own === H.nation && !c.mine).slice(0, 7)) LT.manage(H, c); H.world.ns[H.nation].troops = 30000;
  const pp = LT.promotion(H); ok(pp.paths.lap.ok, 'Điều kiện tự lập đủ');
  ok(LT.promote(H, { path: 'lap' }) && H.indep && H.world.rel[H.nation] <= -60 && H.world.cities.filter(c => c.mine).every(c => c.own === 12), 'Tự lập: cắt đứt triều đình (quan hệ ' + Math.round(H.world.rel[H.nation]) + '), thành thuộc nước mới');
}
console.log('--- G. Tự động chơi từ tri huyện tới Vương (không NaN, không kẹt)');
{
  const G = LT.newGame(7, 'Bot', 77);
  let weeks = 0, stuck = 0, lastRank = 1, lastChange = 0; const log = [];
  const barr = () => { if (LT.count(G, 'barracks') < 3) mkBarracks(G, 3 - LT.count(G, 'barracks')); };
  const prosper = () => { G.res.tien = Math.max(G.res.tien, 4000); G.res.luong = Math.max(G.res.luong, 600000); G.dan.luong = Math.max(G.dan.luong, 20000); G.res.binhkhi = Math.max(G.res.binhkhi, 20000); G.res.ngua = Math.max(G.res.ngua, 300); G.res.giap = Math.max(G.res.giap, 300); };
  const resolve = () => {
    let k = 0;
    while ((G.pendingEvent || G.pendingBattle || G.pendingKhao || G.pendingPromo) && k++ < 10) {
      if (G.pendingEvent) { const e = LT.EVENT(G.pendingEvent.id); let d = false; for (let i = 0; i < e.opts.length && !d; i++) if (!LT.eventOptionError(G, i)) { LT.chooseEvent(G, i); d = true; } if (!d) G.pendingEvent = null; }
      if (G.pendingBattle) { LT.ensureFormation(G); if (G.pendingBattle.canAuto && LT.rand(G) < .5) LT.autoDefend(G); else LT.resolveBattle(G); }
      G.pendingKhao = null; G.pendingPromo = null;
    }
  };
  const recruitUp = () => {
    const lim = G.rank >= 4 ? 17000 : G.rank >= 3 ? 5500 : 800; let tries = 0;
    for (const c of LT.ownedCities(G)) { c.ho = Math.max(c.ho, Math.round((c.base || c.ho) * 1.3)); c.dt = Math.max(c.dt, 55); }
    for (const u of G.units.slice()) if (u.n < LT.unitCap(G) * .7 && LT.armyCount(G) < lim) LT.reinforce(G, u.id, LT.unitCap(G) - u.n);
    const owned = LT.ownedCities(G).sort((x, y) => y.ho - x.ho);
    while (LT.armyCount(G) + LT.unitCap(G) <= LT.armyCap(G) && LT.armyCount(G) < lim && tries++ < 24) {
      const type = G.rank >= 2 && tries % 4 === 0 ? 'cung' : (tries % 5 === 1 && LT.count(G, 'armory') ? 'trongky' : 'truongthuong');
      const n = Math.min(LT.unitCap(G), Math.max(100, Math.round(LT.unitCap(G) / 2)));
      let r = { ok: false };
      for (const c of owned) { r = LT.recruit(G, type, n, c.id); if (r.ok) break; }
      if (!r.ok) { r = LT.recruit(G, type, Math.min(n, 100)); }
      if (!r.ok) { G.lastRecErr = r.err; break; }
    }
    for (const u of G.units) { if (u.tan > 0) u.tan = Math.min(u.tan, 1); u.hl = Math.max(u.hl, 80); u.tb = Math.max(u.tb, 3); u.sk = Math.max(u.sk, 75); }
  };
  const MAXW = 36 * 40;
  while (weeks < MAXW && G.rank < 5 && !G.over) {
    LT.tickWeek(G); weeks++; resolve();
    if (G.over) break;
    G.khao.low = 0; G.player.uyvong = Math.max(G.player.uyvong, 65);
    if (weeks % 8 === 0) { prosper(); barr(); }
    if (G.week === 1) { G.stat.dantam = Math.max(G.stat.dantam, 60); G.stat.trian = Math.max(G.stat.trian, 60); G.nghiky = Math.min(G.nghiky, 20); G.player.thanhdanh = Math.max(G.player.thanhdanh, 70); G.player.uyvong = Math.max(G.player.uyvong, 65); G.stat.thanhphong = Math.max(G.stat.thanhphong, 55); }
    if (weeks % 4 === 0) recruitUp();
    if (G.rank === 1) { G.khao.thuong = Math.max(G.khao.thuong, 3); G.khao.passed = true; }
    const p = LT.promotion(G);
    if (p && G.rank < 4 && p.ready) { LT.promote(G); resolve(); }
    else if (p && G.rank === 4 && p.ready) { LT.promote(G, { path: p.paths.phong.ok ? 'phong' : 'lap' }); resolve(); }
    if (G.rank >= 3 && !G.camp && weeks % 2 === 0) { const t = LT.campTargets(G).filter(c => !LT.campAvail(G, c.id) && LT.muster(G, c) <= 1.3 * LT.campArmy(G)).sort((a, b) => (a.lvl < 2 ? 1 : 0) - (b.lvl < 2 ? 1 : 0) || a.gar - b.gar); if (t.length) LT.startCampaign(G, t[0].id); }
    if (G.camp && G.camp.phase === 'siege') { const s = G.camp.siege; if (s.w >= 1 && s.w % 3 === 1) LT.dohang(G); if (s.w >= 6) { LT.startAssault(G); resolve(); } }
    if (G.rank !== lastRank) { log.push('hạng ' + G.rank + ' ở tuần ' + weeks + ' (năm ' + G.year + ')'); lastRank = G.rank; lastChange = weeks; }
    const bad = fin(G); if (bad) { console.log('  NaN/âm: ' + bad); fails++; break; }
    if (weeks - lastChange > 36 * 14) { stuck = 1; break; }
  }
  console.log('  mục tiêu: ' + LT.campTargets(G).slice(0, 8).map(c => c.n + '(L' + c.lvl + ' ' + LT.natName(G, c.own) + ' gar ' + c.gar + ' ra đón ' + LT.muster(G, c) + '): ' + (LT.campAvail(G, c.id) || 'được')).join(' ; ') + ' | thành: ' + LT.ownedCities(G).map(c => c.n + ' ho' + c.ho + '/binh' + c.binh).join(', '));
  console.log('  nhật ký chiến dịch: ' + G.log.filter(l => /Chiến dịch|HẠ THÀNH|Xuất quân|Dã chiến|Đại bại/.test(l.t)).slice(0, 8).map(l => l.y + ': ' + l.t.slice(0, 80)).join(' // '));
  console.log('  lỗi mộ quân cuối: ' + G.lastRecErr + ' | camp ' + (G.camp ? G.camp.phase : 'không') + ' | đơn vị ' + G.units.length);
  console.log('  ' + log.join(' · ') + ' | thành ' + LT.mineCount(G) + ' | quân ' + LT.armyCount(G) + ' | thắng ' + G.wins + ' | tuần ' + weeks + (G.over ? ' | KẾT THÚC: ' + G.over.title : ''));
  const pp = LT.promotion(G); if (pp) console.log('  điều kiện bậc tiếp: ' + pp.conds.map(c => (c.ok ? 'ok ' : 'CHƯA ') + c.t.slice(0, 60)).join(' | '));
  ok(!stuck, 'Không kẹt: luôn có đường đi lên (không quá 14 năm một bậc)');
  ok(G.rank >= 5, 'Tự động chơi tới bậc Vương (hạng ' + G.rank + ', năm ' + G.year + ')');
  globalThis.__botG = G;
}
console.log('--- H. Lưu / tải sau khi mở rộng (đại cục, chiến dịch, thành, 96×96)');
{
  const G = globalThis.__botG; const txt = LT.serialize(G), H = LT.deserialize(txt);
  ok(H.world.cities.length === 120 && LT.mineCount(H) === LT.mineCount(G) && H.rank === G.rank && H.year === G.year, 'Tải lại đủ 120 thành, ' + LT.mineCount(H) + ' thành của bạn, cùng bậc và năm');
  ok(H.map.length === 96 * 96 && H.map[H.hy * LT.N + H.hx].b.k === 'hall', 'Bản đồ 96×96 dựng lại, phủ đúng chỗ');
  for (let i = 0; i < 40; i++) { LT.tickWeek(H); calm(H); }
  ok(!fin(H), 'Chạy tiếp 40 tuần sau khi tải không lỗi');
  console.log('  cỡ bản lưu: ' + Math.round(txt.length / 1024) + ' KB');
  ok(txt.length < 1500000, 'Cỡ bản lưu hợp lý (< 1,5 MB)');
  let thrown = ''; try { LT.deserialize(JSON.stringify(Object.assign(JSON.parse(txt), { ver: 3 }))); } catch (e) { thrown = e.message; } ok(/phiên bản lưu 3/.test(thrown), 'Bản lưu vòng 1 bị từ chối kèm thông báo rõ: "' + thrown + '"');
}
console.log(fails ? '\n' + fails + ' KIỂM THỬ HỎNG' : '\nTẤT CẢ ĐẠT');
process.exit(fails ? 1 : 0);

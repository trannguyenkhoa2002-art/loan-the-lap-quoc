// Vòng 3: dời trị sở, hậu cần, tự xếp trận, gộp đơn vị, thông báo tan chiến dịch, diễn tập co giãn, đại chiến >100k.
const path = require('path');
for (const f of ['data', 'city', 'economy', 'game', 'battle', 'politics', 'war', 'events', 'world', 'wcities', 'campaign', 'trade', 'officials', 'automgmt']) require(path.join(__dirname, '..', 'js', f + '.js'));
const LT = globalThis.LT; let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL  ' + m); } else console.log('  ok    ' + m); };
const calm = G => { G.pendingEvent = null; G.pendingBattle = null; G.raid = null; G.pendingKhao = null; G.pendingPromo = null; G.pendingNotice = null; };

console.log('--- 6. Dời trị sở');
{
  const G = LT.newGame(7, 'Dời', 5); G.rank = 3; LT.grantCities(G, 3, 1, 2);
  const opts = LT.relocateOptions(G); ok(opts.length > 0, 'Có thành để dời: ' + opts.length);
  const old = G.seatId, to = opts[0], hoTo = to.ho;
  const r = LT.relocate(G, to.id); ok(r.ok, 'Dời được (' + (r.err || '') + ')');
  ok(G.seatId === to.id && G.seatLvl === to.lvl, 'Trị sở mới đúng cấp ' + G.seatLvl);
  ok(G.world.cities[old].own === 1 || G.world.cities[old].mine, 'Thành cũ còn là của người chơi (bảng số liệu)');
  ok(G.map && G.map.length, 'Bản đồ mới dựng xong');
  for (let i = 0; i < 80; i++) { LT.tickWeek(G); calm(G); }
  let bad = ''; for (const c of G.world.cities) if (!isFinite(c.ho) || !isFinite(c.dt)) bad = c.n;
  ok(!bad, 'Chạy 80 tuần sau khi dời không NaN ' + bad);
}
console.log('--- 2. Hậu cần');
{
  const G = LT.newGame(7, 'Lương', 6); G.rank = 3; LT.grantCities(G, 3, 1, 2);
  const t = LT.campTargets(G)[0]; const lg = LT.logistics(G, t.id);
  ok(lg && isFinite(lg.weekly) && isFinite(lg.weeks) && Array.isArray(lg.sources), 'logistics trả số hợp lệ: ăn ' + Math.round(lg.weekly) + '/tuần, nuôi ' + Math.min(99, Math.round(lg.weeks)) + ' tuần, cần ' + lg.need);
  G.units = [{ id: 1, type: 'truongthuong', n: 2000, hl: 50, sk: 60, tb: 2, tan: 0 }]; G.res.luong = 0; G.dan.luong = 0; for (const c of G.world.cities) if (c.mine) c.grain = 0;
  const l2 = LT.logistics(G, t.id); ok(!l2.ok, 'Hết lương mọi nơi thì không ok xuất quân');
}
console.log('--- 5. Tự xếp trận + gộp đơn vị');
{
  const mk = (id, n) => ({ id, type: 'truongthuong', n, hl: 50, sk: 60, tb: 2, tan: 0, from: null });
  const us = [mk(1, 500), mk(2, 500), mk(3, 500), mk(4, 41), mk(5, 35)];
  const L = LT.autoLineup(us);
  const front = [0, 1, 2].map(i => L.slots[i]).filter(Boolean);
  ok(!front.includes(4) && !front.includes(5), 'Đơn vị tàn (41, 35) không đứng tuyến trước');
  const G = LT.newGame(7, 'Gộp', 7); G.rank = 2; G.units = [mk(1, 40), mk(2, 35), mk(3, 60)]; LT.ensureFormation(G);
  const m = LT.mergeUnits(G); ok(m === 2 && G.units.length === 1 && G.units[0].n === 135, 'Gộp 3 đơn vị tàn thành 1 (135 lính, gộp ' + m + ')');
}
console.log('--- 3. Thông báo tan chiến dịch');
{
  const G = LT.newGame(7, 'Đói', 8); G.rank = 3; LT.grantCities(G, 3, 1, 2); G.units = [{ id: 1, type: 'truongthuong', n: 800, hl: 50, sk: 60, tb: 2, tan: 0 }];
  const t = LT.campTargets(G)[0]; const r = LT.startCampaign(G, t.id);
  if (r && r.ok === false) { console.log('  (bỏ qua: ' + r.err + ')'); G.camp = { startN: 800, name: 'thử', target: t.id, starve: 5, units: [] }; }
  LT.endCampaign(G, 'đói'); ok(G.pendingNotice && /đói/i.test(G.pendingNotice.title) && G.speed === 0, 'Tan vì đói sinh hộp thoại và dừng thời gian');
}
console.log('--- 4. Diễn tập co giãn (bigSide)');
{
  const G = LT.newGame(7, 'Tập', 9); G.rank = 4; const tmp = { rs: 5, year: 930, rank: 4, week: 1, nation: 7 };
  const s = LT.bigSide(tmp, 'Địch', 20000, null, {}); const n = LT.sideN(s);
  ok(n > 15000 && n < 26000, 'Địch diễn tập gần 20.000 quân: ' + n);
}
console.log('--- 1. Đại chiến >= 100.000 quân mỗi bên');
{
  const tmp = { rs: 9, year: 950, rank: 6, week: 1, nation: 7 };
  const a = LT.bigSide(tmp, 'A', 120000, null, {}), b = LT.bigSide(tmp, 'B', 120000, null, {});
  ok(LT.sideN(a) >= 100000 && LT.sideN(b) >= 100000, 'Dựng hai đạo quân ' + LT.sideN(a) + ' vs ' + LT.sideN(b));
  const t0 = Date.now(); const res = LT.runBattle({ A: a, B: b, terrain: 'dongbang', nameA: 'A', nameB: 'B' }, 11);
  ok(res && res.hieps && res.hieps.length >= 6 && res.result, 'Trận 100k+ chạy xong: ' + (res && res.hieps ? res.hieps.length : 0) + ' hiệp, kết quả ' + (res && res.result) + ', ' + (Date.now() - t0) + ' ms');
  const G = LT.newGame(7, 'Mạnh', 10); let mx = 0; for (const n of G.world.ns) mx = Math.max(mx, n.troops || 0);
  console.log('  quân tối đa một nước lúc đầu: ' + mx);
  for (let y = 0; y < 40 * 36; y++) { LT.tickWeek(G); calm(G); if (G.over) break; }
  let m2 = 0; for (const n of G.world.ns) m2 = Math.max(m2, n.troops || 0);
  ok(m2 >= 100000, 'Sau ~40 năm có nước dàn quân >= 100.000: ' + Math.round(m2));
}
console.log(fails ? '\n' + fails + ' KIỂM THỬ HỎNG' : '\nTẤT CẢ ĐẠT');
process.exit(fails ? 1 : 0);

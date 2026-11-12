// Vòng 4: phát lại trận theo thời gian (kế hoạch phát lại khớp tính tức thời) và mạch quặng sắt trên mọi bản đồ.
const path = require('path');
for (const f of ['data', 'city', 'economy', 'game', 'battle', 'politics', 'war', 'events', 'world', 'wcities', 'campaign', 'trade', 'officials', 'automgmt']) require(path.join(__dirname, '..', 'js', f + '.js'));
const LT = globalThis.LT; let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL  ' + m); } else console.log('  ok    ' + m); };
const calm = G => { G.pendingEvent = null; G.pendingBattle = null; G.raid = null; G.pendingKhao = null; G.pendingPromo = null; G.pendingNotice = null; };

console.log('--- 1. Phát lại trận khớp tính tức thời');
{
  const mkCfg = (n, seed, terrain) => { const tmp = { rs: seed, year: 940, rank: 5, week: 1, nation: 7 }; return { A: LT.bigSide(tmp, 'Ta', n, null, {}), B: LT.bigSide(tmp, 'Địch', Math.round(n * .8), null, {}), terrain: terrain || 'dongbang', nameA: 'Ta', nameB: 'Địch' }; };
  for (const [n, seed, ter] of [[800, 3, 'dongbang'], [20000, 7, 'rung'], [124000, 11, 'dongbang']]) {
    const cfg = mkCfg(n, seed, ter), r1 = LT.runBattle(cfg, 4242), r2 = LT.runBattle(cfg, 4242);
    const p1 = LT.replayPlan(r1), p2 = LT.replayPlan(r2);
    ok(JSON.stringify(p1) === JSON.stringify(p2) && r1.result === r2.result, n + ' quân: cùng hạt giống cho cùng kết quả và cùng kế hoạch phát lại (' + r1.result + ', ' + r1.hieps.length + ' hiệp)');
    ok(p1.steps.length === r1.hieps.length && p1.steps.every((s, i) => s.nA === r1.hieps[i].after.A.n && s.nB === r1.hieps[i].after.B.n), n + ' quân: quân còn lại từng hiệp trong phát lại bằng số trong chiến báo');
    const last = p1.steps[p1.steps.length - 1], fin = p1.final;
    ok(r1.result === 'draw' || (r1.result === 'A' ? fin.pos === 1 : fin.pos === 0), n + ' quân: thanh nghiêng hẳn về bên thắng (' + fin.pos + ')');
    if (r1.result === 'A') ok(last.pos >= .5 || r1.why !== 'hiep12', 'thanh hiệp cuối nghiêng về bên thắng khi thắng điểm: ' + last.pos.toFixed(2));
    if (r1.result === 'B') ok(last.pos <= .5 || r1.why !== 'hiep12', 'thanh hiệp cuối nghiêng về bên thắng khi thắng điểm: ' + last.pos.toFixed(2));
    ok(p1.steps.every(s => s.pos >= .04 && s.pos <= .96 && isFinite(s.pos)), 'vị trí thanh mọi hiệp hợp lệ: ' + p1.steps.map(s => Math.round(s.pos * 100)).join(','));
  }
  // bên mạnh gấp 5 lần thì thanh nghiêng về bên đó ngay từ đầu
  const tmp = { rs: 5, year: 940, rank: 5, week: 1, nation: 7 }, cfg = { A: LT.bigSide(tmp, 'Ta', 50000, null, {}), B: LT.bigSide(tmp, 'Địch', 8000, null, {}), terrain: 'dongbang' };
  const pl = LT.replayPlan(LT.runBattle(cfg, 9)); ok(pl.start.pos > .7 && pl.final.pos === 1, 'quân đông gấp 6: thanh ban đầu ' + Math.round(pl.start.pos * 100) + '% nghiêng về bên đông, thắng');
  // thế trận có đảo chiều: tìm một trận nhiều lần đổi bên
  let flips = 0, tries = 0; for (let sd = 1; sd <= 60 && !flips; sd++) { const c = { A: LT.bigSide({ rs: sd, year: 940, rank: 5, week: 1, nation: 7 }, 'A', 6000, null, {}), B: LT.bigSide({ rs: sd + 99, year: 940, rank: 5, week: 1, nation: 7 }, 'B', 6000, null, {}), terrain: 'dongbang' }; const p = LT.replayPlan(LT.runBattle(c, sd * 31)); tries++; const sg = p.steps.map(s => Math.sign(s.pos - .5)); for (let i = 1; i < sg.length; i++) if (sg[i] && sg[i - 1] && sg[i] !== sg[i - 1]) flips++; }
  console.log('  (số trận thử: ' + tries + ', số lần đảo chiều thế trận: ' + flips + ')');
}

console.log('--- 2. Mạch quặng sắt trên mọi bản đồ');
{
  let worst = 0, bad = 0, total = 0;
  for (let n = 0; n < 12; n++) for (let sn = 0; sn < 5; sn++) {
    const G = LT.newGame(n, 'Q', 100 + n); G.seatNo = sn; LT.genMap(G, n); total++;
    let best = 1e9, cnt = 0; for (let i = 0; i < G.map.length; i++) if (G.map[i].t === 'm') { cnt++; best = Math.min(best, Math.hypot(i % LT.N - G.hx, Math.floor(i / LT.N) - G.hy)); }
    const pl = LT.placeableTiles(G, 'mine'); worst = Math.max(worst, best);
    if (!cnt || best > 24 || !pl.length) { bad++; console.log('   nước ' + n + ' trị sở #' + sn + ': mạch ' + cnt + ', gần nhất ' + best + ', ô đặt được ' + pl.length); }
  }
  ok(bad === 0, total + ' bản đồ (12 nước × 5 trị sở): đều có mạch quặng và ô đặt mỏ sắt; mạch gần nhất xa nhất = ' + worst.toFixed(1) + ' ô');
  const G = LT.newGame(7, 'Dời', 5); G.rank = 3; LT.grantCities(G, 3, 1, 2); const o = LT.relocateOptions(G)[0]; const r = LT.relocate(G, o.id);
  let cnt = 0; for (const q of G.map) if (q.t === 'm') cnt++; const pl = LT.placeableTiles(G, 'mine');
  ok(r.ok && cnt > 0 && pl.length > 0, 'bản đồ sinh ra sau khi dời trị sở có mạch quặng (' + cnt + ' ô) và ' + pl.length + ' ô đặt được mỏ sắt');
  const G2 = LT.newGame(7, 'Mỏ', 6); G2.res.go = 500; G2.res.da = 500; G2.res.tien = 500; const t = LT.placeableTiles(G2, 'mine')[0];
  const before = G2.bl.length; const err = LT.canPlace(G2, 'mine', t.x, t.y); let placed = false;
  try { LT.place(G2, 'mine', t.x, t.y, {}); placed = G2.bl.length > before; } catch (e) { }
  ok(!err && placed, 'đặt được một mỏ sắt tại ô gợi ý (' + t.x + ',' + t.y + ') ' + (err || ''));
  ok(LT.B.mine.cat === 2, 'Mỏ sắt nằm ở nhóm Thủ công cạnh Lò rèn');
  const G3 = LT.newGame(7, 'Cảnh', 7); G3.bl.push({ k: 'forge', x: 1, y: 1, building: false }); G3.res.quang = 0; LT.recalcCity && 0;
  ok(LT.alerts(G3).some(a => /Mỏ sắt/.test(a.t)), 'Việc cần chú ý nhắc xây mỏ sắt khi lò rèn thiếu quặng');
}
console.log(fails ? '\n' + fails + ' KIỂM THỬ HỎNG' : '\nTẤT CẢ ĐẠT');
process.exit(fails ? 1 : 0);

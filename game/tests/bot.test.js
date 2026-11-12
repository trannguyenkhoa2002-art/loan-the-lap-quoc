// Bot chơi THEO LUẬT, KHÔNG bơm tài nguyên/chỉ số: xây bằng gỗ đá tiền thật, mộ lính bằng hộ thật, đánh bằng quân thật.
// Chỉ đọc đáp án Tỉnh thí (người chơi cũng học được). In ra bậc đạt được theo năm, và kẹt ở đâu.
// Chạy: node tests/bot.test.js [số năm tối đa=45] [nước=7] [hạt giống=77]
const path = require('path');
for (const f of ['data', 'city', 'economy', 'game', 'battle', 'politics', 'war', 'events', 'world', 'wcities', 'campaign', 'trade', 'officials', 'automgmt', 'power']) require(path.join(__dirname, '..', 'js', f + '.js'));
const LT = globalThis.LT;
const MAXY = +process.argv[2] || 45, NAT = process.argv[3] != null ? +process.argv[3] : 7, SEED = +process.argv[4] || 77;
const G = LT.newGame(NAT, 'Bot', SEED);
const B = LT.B, N = LT.N;
const sq = (a, b) => Math.hypot(a, b);
// ---- xây dựng ---------------------------------------------------------------
const roadAt = (x, y) => { const q = LT.tileAt(G, x, y); return q && q.b && LT.isRoadLike(q.b); };
function ensureRoadTo(x, y) { // nối đường từ ô kề công trình tới đường gần nhất (A* thô theo đất trống)
  const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  if (nb.some(([i, j]) => roadAt(x + i, y + j))) return true;
  const start = nb.map(([i, j]) => [x + i, y + j]).filter(([a, b]) => { const q = LT.tileAt(G, a, b); return q && !q.b && (q.t === 'g' || q.t === 'h'); });
  const seen = new Map(), queue = []; for (const [a, b] of start) { seen.set(a + ',' + b, null); queue.push([a, b]); }
  for (let h = 0; h < queue.length && h < 4000; h++) {
    const [a, b] = queue[h];
    if (nb.some(([i, j]) => roadAt(a + i, b + j))) { // dựng ngược
      let cur = [a, b]; const path = []; while (cur) { path.push(cur); cur = seen.get(cur[0] + ',' + cur[1]); }
      for (const [px, py] of path) if (!roadAt(px, py)) { const r = LT.place(G, 'road', px, py); if (r.ok) r.b.progress = 1, r.b.building = false; else return false; }
      return true;
    }
    for (const [i, j] of nb) { const c = a + i, d = b + j, q = LT.tileAt(G, c, d); if (q && !q.b && (q.t === 'g' || q.t === 'h') && !seen.has(c + ',' + d) && sq(c - G.hx, d - G.hy) < 50) { seen.set(c + ',' + d, [a, b]); queue.push([c, d]); } }
  }
  return false;
}
function build(k, opt) {
  opt = opt || {}; const d = B[k]; if (d.rank && d.rank > G.rank) return false; if (!LT.afford(G, d.c)) return false;
  const resT = 150 + LT.armyCount(G) * (G.rank >= 4 ? .06 : .12) + G.pend.tien * 1.0 + 25 * G.rank, RES = (k === 'lumber' || k === 'quarry' || k === 'house') ? { go: 0, da: 0, tien: 60 } : { go: 70, da: 30, tien: resT }; for (const r in d.c) if ((G.res[r] || 0) - d.c[r] < (RES[r] || 0)) return false;
  const cx = G.hx + 1, cy = G.hy + 1, cand = [];
  const R = opt.R || 42;
  for (let y = Math.max(1, cy - R); y < Math.min(N - 1, cy + R); y++) for (let x = Math.max(1, cx - R); x < Math.min(N - 1, cx + R); x++) {
    if (LT.canPlace(G, k, x, y) !== '') continue;
    const dist = sq(x - cx, y - cy), adj = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([i, j]) => roadAt(x + i, y + j));
    if (!opt.far && !adj && !d.need) continue;
    cand.push([dist + (adj ? 0 : 8) + (opt.prefer ? Math.abs(dist - opt.prefer) : 0), x, y]);
  }
  if (!cand.length) return false; cand.sort((a, b) => a[0] - b[0]);
  for (const [, x, y] of cand.slice(0, 6)) {
    if (!roadAt(x, y) && (d.job || d.out || d.need) && !ensureRoadTo(x, y)) continue;
    const r = LT.place(G, k, x, y); if (r.ok) { if (k === 'forge') r.b.mode = 'binhkhi'; return r.b; }
  }
  return false;
}
const cnt = k => LT.countAll(G, k);
function housesNeeded() { return G.city.cap - LT.totalHo(G) < Math.max(10, LT.totalHo(G) * .06); }
function econPlan() {
  const ho = LT.totalHo(G), houseK = G.rank >= 3 ? 'mansion' : G.rank >= 2 ? 'terrace' : 'house', s = G.stat;
  const builds = () => G.bl.filter(b => b.building).length;
  let made = 0; const tryB = (k, o) => { if (made >= 3 || builds() >= 6 + G.rank * 3) return false; const r = build(k, o); if (r) made++; return r; };
  if (housesNeeded() && G.city.capRaw < LT.CITY_LEVELS[G.seatLvl].cap) { for (let i = 0; i < 4 && housesNeeded(); i++) if (!tryB(houseK)) break; }
  const want = (k, n) => cnt(k) < n;
  const jobsFree = ['nong', 'cong', 'thuong'].reduce((a, c) => a + Math.max(0, LT.slotsOf(G, c) - G.H[c]), 0);
  if (want('lumber', 2 + ho / 500)) tryB('lumber', { far: true }); if (want('quarry', 2 + ho / 600)) tryB('quarry', { far: true });
  if (want('granary', 1 + ho / 450)) tryB('granary');
  if (G.city.disconnected > 0) { /* các công trình ngoài 8 ô: dựng thêm kho/chợ gần chúng */ if (want('granary', 2 + ho / 300)) tryB('granary', { prefer: 14 }); }
  if (want('well', ho / 120)) tryB('well'); if (want('watch', ho / 140)) tryB('watch');
  if (want('market', 1 + ho / 220)) tryB('market');
  if (G.sat.luong != null && (G.sat.luong < .99 || LT.foodWeeks(G) < 22) && want('farm', 3 + ho / 120)) tryB('farm');
  else if (jobsFree < 25 && want('farm', 4 + ho / 90)) tryB('farm');
  if (ho > 200 && want('cloth', ho / 400)) tryB('cloth'); if (ho > 220 && want('salt', 1 + ho / 600)) tryB('salt', { far: true }); if (ho > 260 && want('winery', ho / 700)) tryB('winery');
  if (ho > 220 && want('temple', ho / 600)) tryB('temple'); if (ho > 200 && want('school', 1 + ho / 1500)) tryB('school'); if (ho > 260 && want('clinic', ho / 700)) tryB('clinic');
  if (ho > 220 && want('mine', 1)) tryB('mine', { far: true }); if (ho > 240 && want('forge', 1 + ho / 2500)) tryB('forge');
  if (ho > 300 && want('kiln', 1 + ho / 1500)) tryB('kiln'); if (ho > 340 && want('mulberry', 1)) tryB('mulberry'); if (ho > 340 && want('silk', 1)) tryB('silk');
  if (want('barracks', 1 + Math.floor(LT.armyCap(G) / 1500))) tryB('barracks');
  if (G.rank >= 2 && want('armory', 1)) tryB('armory');
  if (G.rank >= 2 && ho > 400 && want('inn', 1)) tryB('inn');
  if (s.thanhphong < 60 && ho > 250 && G.res.da > 200) { if (want('tower', 5)) tryB('tower', { prefer: 14 }); else if (want('beacon', 2)) tryB('beacon', { prefer: 14 }); else if (want('wall', 24)) tryB('wall', { prefer: 15 }); }
  if (G.rank >= 4 && s.thanhphong < 80 && want('tower', 12)) tryB('tower', { prefer: 15 });
  if (!G.pol.thuongbinh && cnt('granary')) G.pol.thuongbinh = true;
  if (!G.pol.mono.muoi && cnt('salt') && G.rank >= 1) G.pol.mono.muoi = true;
}
// ---- quân đội ------------------------------------------------------------------
function targetArmy() { return { 1: 220, 2: 1200, 3: 4200, 4: 17500, 5: 45000, 6: 130000 }[G.rank]; }
function healthy() { return G.res.tien > 400 + G.pend.tien * 1.0 + LT.armyCount(G) * .05 * 14 && LT.foodWeeks(G) > 14 && G.armyUnpaid === 0; }
function recruitStep() {
  if (LT.count(G, 'barracks') < 1 || !healthy()) return;
  if (G.res.binhkhi < 300 && cnt('forge')) { /* chờ lò rèn */ }
  const cap = LT.armyCap(G), want = Math.min(cap, targetArmy());
  let guard = 0;
  while (LT.armyCount(G) < want && guard++ < 6) {
    for (const u of G.units) if (u.n < LT.unitCap(G) * .6) LT.reinforce(G, u.id, Math.min(LT.unitCap(G) - u.n, want - LT.armyCount(G)));
    if (LT.armyCount(G) >= want) break;
    const owned = LT.ownedCities(G).filter(c => c.binh < c.ho * .08).sort((a, b) => b.ho - a.ho);
    const type = guard % 3 === 0 && G.rank >= 1 ? 'cung' : 'truongthuong', n = Math.min(LT.unitCap(G), want - LT.armyCount(G));
    owned.splice(0, owned.length, ...owned.slice(guard % Math.max(1, owned.length)).concat(owned.slice(0, guard % Math.max(1, owned.length))));
    if (n < 40) break;
    let r = { ok: false };
    for (const c of owned.slice(0, 8)) { r = LT.recruit(G, type, n, c.id); if (r.ok) break; }
    if (!r.ok && G.H.luu + G.H.nong > 80 && G.rank <= 2) r = LT.recruit(G, type, Math.min(n, 100));
    if (!r.ok) break;
  }
  if (LT.armyCount(G) > 0 && G.week % 6 === 0) LT.mergeUnits(G);
}
// ---- thành, chiến dịch ------------------------------------------------------------
function manageCities() {
  for (const c of LT.ownedCities(G)) {
    if (!c.ship && LT.foodWeeks(G) < 40) c.ship = true;
    if (c.auto > 65 && G.res.tien > 100 && G.orders.left > 0) LT.rotateOfficial(G, c.id);
    if (c.nop > .6 && c.dt < 45) LT.cityPolicy(G, c.id, 'nop', .4);
  }
}
let cool = 0;
function upgradeAll() { for (const u of G.units) if (u.tb < 3 && u.tan <= 0 && G.res.tien > 900 + G.pend.tien) LT.upgradeEquip(G, u.id); }
function campaignStep() {
  if (G.rank < 3) return;
  if (cool > 0) { cool--; if (!G.camp) return; }
  if (!G.camp) {
    if (G.week % 3 !== 0 || G.pendingBattle) return;
    const army = LT.campArmy(G); if (army < 600) return;
    const t = LT.campTargets(G).filter(c => !LT.campAvail(G, c.id) && LT.muster(G, c) <= .8 * army && LT.logistics(G, c.id).ok);
    if (!t.length) return;
    const score = c => (c.lvl >= 2 ? -5 : 0) + LT.muster(G, c) / army * 4 + c.gar / army * 3;
    t.sort((a, b) => score(a) - score(b)); LT.startCampaign(G, t[0].id);
  } else if (G.camp.phase === 'siege') {
    const sg = G.camp.siege, c = G.world.cities[G.camp.target], army = LT.campArmy(G);
    if (sg.w >= 1 && sg.w % 3 === 1) LT.dohang(G);
    if (sg.w >= 5 && army >= c.gar * .9) { LT.startAssault(G); }
    if (sg.w >= 14 && !G.pendingBattle) LT.retreatCampaign(G);
  }
}
function resolveAll() {
  let k = 0;
  while ((G.pendingEvent || G.pendingBattle || G.pendingKhao || G.pendingPromo || G.pendingNotice) && k++ < 12) {
    if (G.pendingEvent) { const e = LT.EVENT(G.pendingEvent.id); let d = false; if (G.pendingEvent.id === 'suthanhtra' && !LT.eventOptionError(G, 1)) { LT.chooseEvent(G, 1); d = true; } for (let i = 0; i < e.opts.length && !d; i++) if (!LT.eventOptionError(G, i)) { LT.chooseEvent(G, i); d = true; } if (!d) G.pendingEvent = null; }
    if (G.pendingBattle) {
      const pb = G.pendingBattle; LT.ensureFormation(G); G.formation.auto = true; LT.ensureFormation(G);
      if (pb.canAuto && LT.rand(G) < .3) LT.autoDefend(G);
      else if (pb.kind === 'tieuphi') { const est = LT.battleEstimate(G, 16); if (est.win >= .6) LT.resolveBattle(G); else LT.ignoreRaid(G); }
      else { const est = LT.battleEstimate(G, 16); if (process.env.DBG === '3' && (pb.kind === 'campaign' || pb.kind === 'siege')) console.log('   [' + G.year + '] ' + pb.kind + ' ' + pb.title + ': ta ' + Math.round(LT.sideN(LT.buildPlayerSide(G, G.formation))) + ' vs ' + pb.total + ' ước tính thắng ' + Math.round(est.win * 100) + '% | đơn vị ' + G.units.map(u => u.type[0] + u.n + '/hl' + Math.round(u.hl) + '/sk' + Math.round(u.sk) + '/tb' + u.tb).join(' '));
      if (pb.kind === 'campaign' && est.win < .45 && G.camp) { LT.retreatCampaign(G); G.pendingBattle = null; cool = 24; } else if (pb.ransom && est.win < .15 && G.res.tien > pb.ransom * 1.2) LT.payRansom(G); else LT.resolveBattle(G); }
    }
    G.pendingKhao = null; G.pendingPromo = null; G.pendingNotice = null;
  }
}
const log = [], stuckInfo = { rank: 1, since: 0 };
function exam() {
  const ex = LT.newExam(G); ex.ans = ex.kn.map(q => q.a); ex.pans = ex.an.map(c => c.o.findIndex(o => o[1] === 15)); ex.picks = [0, 2, 3];
  const r = LT.gradeExam(ex); if (r.pass) G.khao.passed = true; G.khao.examTried = true;
}
let weeks = 0, lastRank = 1; const t0 = Date.now();
while (!G.over && weeks < MAXY * 36) {
  // thi công: một tuần = 20 giây thời gian x1 (giống giao diện)
  for (const b of G.bl) if (b.building) { b.progress = Math.min(1, b.progress + LT.WEEK_SECONDS / (b.duration || 12)); if (b.progress >= 1) b.building = false; }
  LT.tickWeek(G); weeks++; resolveAll();
  if (G.over) break;
  G.speed = 0;
  if (weeks % 2 === 0) econPlan();
  if (weeks % 4 === 0) { recruitStep(); manageCities(); }
  if (weeks % 12 === 0) upgradeAll();
  if (weeks % 13 === 6 && G.rank >= 1 && LT.campArmy(G) >= 250 && !G.pendingBattle && !G.camp) LT.startTieuphi(G);
  if (G.week % 12 === 5 && LT.relocateOptions(G).length && !G.camp) { const o = LT.relocateOptions(G).sort((a, b) => b.ho - a.ho)[0]; const r = LT.relocate(G, o.id); if (r.ok) log.push('dời trị sở sang ' + o.n + ' ở năm ' + G.year); }
  const p = LT.promotion(G);
  if (G.rank === 1 && p && p.needExam) exam();
  if (p && p.ready) { if (G.rank === 4) LT.promote(G, { path: p.paths.phong.ok ? 'phong' : 'lap' }); else if (G.rank === 5) LT.proclaim(G, 'Thiên Hựu'); else LT.promote(G); resolveAll(); }
  campaignStep(); resolveAll();
  if (G.rank !== lastRank) { log.push('hạng ' + G.rank + ' (' + LT.RANKS[G.rank].n + ') năm ' + G.year + ' [tuần ' + weeks + ']'); lastRank = G.rank; }
  if (process.env.DBG && G.week === 1) console.log('  Y' + G.year + ' hộ ' + LT.totalHo(G) + ' tiền ' + Math.round(G.res.tien) + ' lương ' + Math.round(G.res.luong) + '+' + Math.round(G.dan.luong) + ' gỗ ' + Math.round(G.res.go) + ' đá ' + Math.round(G.res.da) + ' DT ' + Math.round(G.stat.dantam) + ' TA ' + Math.round(G.stat.trian) + ' VS ' + Math.round(G.stat.vesinh) + ' PV ' + Math.round(G.stat.phonvinh) + ' quân ' + LT.armyCount(G) + ' ctr ' + G.bl.length + ' khảo ' + (G.khao.history.length ? G.khao.history[G.khao.history.length - 1].total : '-') + ' nghi ' + Math.round(G.nghiky) + (process.env.DBG === '2' ? ' | tiền: ' + Object.entries(G.flow.lastYear.tien || {}).sort((a, b) => a[1] - b[1]).slice(0, 6).map(e => e[0].slice(0, 26) + ' ' + Math.round(e[1])).join(' | ') + ' | hộ: ' + Object.entries(G.flow.lastYear.ho || {}).map(e => e[0].slice(0, 26) + ' ' + Math.round(e[1])).join(' | ') + ' | H ' + JSON.stringify(G.H) : ''));
  if (weeks % 36 === 0) { for (const k in G.res) if (!isFinite(G.res[k]) || G.res[k] < -1e-6) { console.log('LỖI số xấu res.' + k); process.exit(1); } }
}
const pr = LT.promotion(G);
console.log('--- Bot không bơm: ' + LT.NATIONS[NAT].n + ', hạt giống ' + SEED + ', ' + (Date.now() - t0) + ' ms');
console.log('Mốc: ' + log.join(' · '));
console.log('Kết thúc năm ' + G.year + ' tuần ' + G.week + (G.over ? ' — ' + G.over.title + ': ' + G.over.text.slice(0, 90) : ' (hết thời gian thử)') + ' | hạng ' + G.rank + ' | hộ ' + LT.totalHo(G) + ' | công trình ' + G.bl.length + ' | thành ' + LT.mineCount(G) + ' | quân ' + LT.armyCount(G) + ' | tiền ' + Math.round(G.res.tien) + ' | trận thắng ' + G.wins + ' | quân công ' + G.quanCong + ' | khảo gần nhất ' + (G.khao.history.length ? G.khao.history[G.khao.history.length - 1].total : '-') + ' | hạng Thượng ' + G.khao.thuong);
if (pr && pr.paths) console.log('Đường lên Vương: nghi kỵ ' + Math.round(G.nghiky) + ', thanh danh ' + Math.round(G.player.thanhdanh) + ', dân tâm ' + Math.round(G.stat.dantam) + ', quân ' + LT.armyCount(G) + ', châu ' + LT.mineCountLvl(G, 2) + ', quân nước ' + Math.round(G.world.ns[G.nation].troops) + ' phong ' + pr.paths.phong.ok + ' lập ' + pr.paths.lap.ok);
if (pr) console.log('Điều kiện bậc tiếp: ' + pr.conds.map(c => (c.ok ? 'ĐẠT ' : 'CHƯA ') + c.t.slice(0, 75)).join(' | '));
if (G.rank >= 3) console.log('Mục tiêu chiến dịch: ' + LT.campTargets(G).slice(0, 8).map(c => c.n + '(L' + c.lvl + ' ' + LT.natName(G, c.own) + ', đồn ' + c.gar + ', ra đón ' + LT.muster(G, c) + ', lương ' + Math.round(LT.logistics(G, c.id).weeks) + 'tuần): ' + (LT.campAvail(G, c.id) || 'đánh được')).join(' ; '));
if (process.env.DBG) console.log('Nhật ký chiến dịch: ' + G.log.filter(l => /Chiến dịch|HẠ THÀNH|Xuất quân|Dã chiến|Công thành|thất thủ|đói|Đại bại/.test(l.t)).slice(0, 14).map(l => l.y + ' ' + l.t.slice(0, 85)).join(' // '));
if (process.env.DBG) console.log('Nghi kỵ: ' + G.log.filter(l => /nghi|Kho không đủ|nộp thiếu|sứ giả|Sứ giả/i.test(l.t)).slice(0, 8).map(l => l.y + ' ' + l.t.slice(0, 90)).join(' // '));
if (process.env.DBG) { const oc = LT.ownedCities(G); console.log('Mộ quân: healthy=' + healthy() + ' (tiền ' + Math.round(G.res.tien) + ' pend ' + Math.round(G.pend.tien) + ' thức ăn ' + Math.round(LT.foodWeeks(G)) + ' tuần, unpaid ' + G.armyUnpaid + ') quân doanh ' + LT.count(G, 'barracks') + ' / đơn vị ' + G.units.map(u => u.type + u.n + (u.tan > 0 ? 't' : '')).join(',') + ' / thử mộ: ' + (oc.length ? LT.canRecruit(G, 'truongthuong', 200, oc[0].id) || 'được' : 'không có thành') + ' | seat: ' + (LT.canRecruit(G, 'truongthuong', 200) || 'được')); }
const yrs = G.year - LT.START_YEAR;
process.exit(0);

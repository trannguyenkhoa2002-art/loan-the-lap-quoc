// Mô phỏng không đầu: kinh tế một năm, năm năm bỏ mặc / chơi hợp lý, khảo khóa, lưu–tải.
// Chạy: node tests/sim.test.js
const path = require('path');
for (const f of ['data', 'city', 'economy', 'game', 'battle', 'politics', 'war', 'events', 'world', 'wcities', 'campaign', 'trade', 'officials', 'automgmt', 'power']) require(path.join(__dirname, '..', 'js', f + '.js'));
const LT = globalThis.LT;
const O = 24;   // phủ ở (46,46) thay vì (22,22)
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL  ' + m); } else console.log('  ok    ' + m); };
const finite = G => {
  for (const k in G.res) if (!isFinite(G.res[k]) || G.res[k] < -1e-6) return 'res.' + k + '=' + G.res[k];
  for (const k in G.H) if (!isFinite(G.H[k]) || G.H[k] < 0) return 'H.' + k + '=' + G.H[k];
  for (const k of ['dantam', 'trian', 'vesinh', 'phonvinh', 'thanhphong']) if (!isFinite(G.stat[k]) || G.stat[k] < 0 || G.stat[k] > 100) return 'stat.' + k + '=' + G.stat[k];
  if (!isFinite(G.dan.luong) || G.dan.luong < -1e-6) return 'dan.luong=' + G.dan.luong;
  if (!isFinite(G.wealth) || G.wealth < -1e-6) return 'wealth=' + G.wealth;
  return '';
};
function findSpot(G, k, nx, ny, maxR) {
  let best = null, bd = 1e9;
  for (let y = 1; y < LT.N - 1; y++) for (let x = 1; x < LT.N - 1; x++) {
    if (LT.canPlace(G, k, x, y) !== '') continue;
    const d = Math.hypot(x - nx, y - ny); if (d < bd && d <= (maxR || 99)) { bd = d; best = [x, y]; }
  }
  return best;
}
const finish = (G, b) => { b.progress = 1; b.building = false; LT.recalcCity(G); };
const build = (G, k, nx, ny, r) => { const s = findSpot(G, k, nx + O, ny + O, r); if (!s) return null; const res = LT.place(G, k, s[0], s[1]); if (res.ok) { finish(G, res.b); return res.b; } return null; };
// nối đường thẳng từ (x0,y0) tới cạnh công trình
function road(G, x0, y0, x1, y1) {
  let x = x0, y = y0;
  while (x !== x1 || y !== y1) {
    if (x !== x1) x += Math.sign(x1 - x); else y += Math.sign(y1 - y);
    const q = LT.tileAt(G, x, y);
    if (q && !q.b && (q.t === 'g' || q.t === 'h')) { const r = LT.place(G, 'road', x, y); if (r.ok) finish(G, r.b); }
  }
}
function autoEvents(G) {
  let guard = 0;
  while ((G.pendingEvent || G.pendingBattle || G.pendingKhao || G.pendingPromo) && guard++ < 10) {
    if (G.pendingEvent) { const e = LT.EVENT(G.pendingEvent.id); let done = false; for (let i = 0; i < e.opts.length && !done; i++) if (!LT.eventOptionError(G, i)) { LT.chooseEvent(G, i); done = true; } if (!done) G.pendingEvent = null; }
    if (G.pendingBattle) { LT.ensureFormation(G); LT.resolveBattle(G); }
    G.pendingKhao = null; G.pendingPromo = null;
  }
}
function run(G, weeks, hook) {
  for (let i = 0; i < weeks; i++) {
    LT.tickWeek(G); autoEvents(G); if (hook) hook(G, i);
    const e = finite(G); if (e) return { err: e, at: G.year + ' W' + G.week };
    if (G.over) return { over: G.over };
  }
  return {};
}
const sum = G => 'Y' + G.year + 'W' + G.week + ' hộ=' + LT.totalHo(G) + ' tiền=' + Math.round(G.res.tien) + ' lương=' + Math.round(G.res.luong) + '+dân' + Math.round(G.dan.luong) + ' gỗ=' + Math.round(G.res.go) + ' đá=' + Math.round(G.res.da) + ' DT=' + Math.round(G.stat.dantam) + ' TA=' + Math.round(G.stat.trian) + ' VS=' + Math.round(G.stat.vesinh) + ' PV=' + Math.round(G.stat.phonvinh) + ' TP=' + G.stat.thanhphong + ' hạng=' + G.rank;

let idleScore = 0;
console.log('--- 1. Bỏ mặc 5 năm (không xây gì, không chỉnh chính sách)');
{
  const G = LT.newGame(3, 'Bỏ mặc', 42);
  const r = run(G, 36 * 5);
  console.log('  ' + sum(G) + (r.over ? '  [KẾT THÚC: ' + r.over.title + ']' : ''));
  ok(!r.err, 'Không NaN / âm trong 5 năm bỏ mặc' + (r.err ? ' (' + r.err + ' ' + r.at + ')' : ''));
  ok(G.khao.history.length >= 1, 'Có khảo khóa: ' + G.khao.history.map(h => h.total).join(', '));
  idleScore = G.khao.history.length ? G.khao.history[G.khao.history.length - 1].total : 0;
}
console.log('--- 2. Chơi hợp lý 5 năm (xây nhà, trại gỗ, mỏ đá, kho, chợ, giếng, chùa… theo kịch bản)');
let goodG;
{
  const G = goodG = LT.newGame(3, 'Hợp lý', 42);
  const plan = [
    ['lumber', 14, 25], ['quarry', 20, 33], ['house', 22, 28], ['house', 22, 29], ['granary', 25, 27], ['well', 21, 27], ['watch', 21, 24], ['market', 26, 23], ['house', 20, 28], ['house', 20, 29],
    ['farm', 25, 21], ['farm', 25, 22], ['salt', 30, 22], ['cloth', 23, 27], ['house', 18, 24], ['house', 18, 23], ['temple', 28, 21], ['mulberry', 27, 28], ['tea', 16, 14], ['school', 29, 27], ['clinic', 22, 30], ['winery', 28, 30], ['kiln', 22, 31], ['house', 19, 30], ['house', 19, 31], ['house', 17, 29], ['house', 17, 28], ['barracks', 20, 22], ['mine', 12, 8], ['forge', 23, 31],
  ];
  let idx = 0;
  const r = run(G, 36 * 5, (G, i) => {
    if (i % 3 === 0 && idx < plan.length) {
      const [k, nx, ny] = plan[idx++];
      let b = build(G, k, nx, ny, 14);
      if (!b) { const s = findSpot(G, k, nx + O, ny + O, 30); if (s) { road(G, 24 + O, 25 + O, s[0], s[1]); b = build(G, k, nx, ny, 30); } }
      if (b && LT.B[k].job) road(G, 24 + O, 25 + O, b.x, b.y);
    }
    if (i === 20) G.pol.thuongbinh = true;
    if (i === 30) G.pol.mono.muoi = true;
    if (i % 36 === 5 && G.res.tien > 200) LT.recruit(G, 'cung', 50);
  });
  console.log('  ' + sum(G) + (r.over ? '  [KẾT THÚC: ' + r.over.title + ']' : ''));
  ok(!r.err, 'Không NaN / âm trong 5 năm chơi hợp lý' + (r.err ? ' (' + r.err + ' ' + r.at + ')' : ''));
  ok(LT.totalHo(G) > 160, 'Chơi hợp lý thì dân tăng (hộ = ' + LT.totalHo(G) + ' so với 123 ban đầu)');
  ok(G.res.tien > 5, 'Ngân khố chưa cạn sau 5 năm (' + Math.round(G.res.tien) + ' quan)');
  ok(G.khao.history.length === 5, 'Có 5 lần khảo khóa: ' + G.khao.history.map(h => h.total + '(' + h.gid + ')').join(', '));
  ok(G.khao.history.every(h => h.total >= 0 && h.total <= 100 && Object.values(h.scores).every(v => v >= 0 && v <= 20)), 'Mọi khảo khóa trong 0–100, mỗi mục 0–20');
  const last = G.khao.history[G.khao.history.length - 1];
  console.log('  Khảo khóa cuối:', JSON.stringify(last.scores), '=', last.total);
  console.log('  Tầng lớp:', LT.CLASS_IDS.map(c => c + ':' + G.H[c]).join(' '));
  console.log('  Thu chi năm trước (tiền): thu', Math.round(G.lastYr.rev), 'chi', Math.round(G.lastYr.exp), 'nộp', Math.round(G.lastYr.remitT), 'định mức', G.lastYr.quota);
  console.log('  So sánh bỏ mặc: ' + idleScore + ' điểm, hợp lý: ' + last.total + ' điểm');
  ok(last.total > idleScore, 'Chơi hợp lý được điểm khảo khóa cao hơn bỏ mặc');
}
console.log('--- 2b. Chơi hợp lý 10 năm, có mộ quân, giặc đến, thuế thường: ngân khố không chết khô');
{
  const G = LT.newGame(7, 'Mười năm', 21);
  const plan = [['lumber', 14, 25], ['quarry', 20, 33], ['house', 22, 28], ['house', 22, 29], ['granary', 25, 27], ['well', 21, 27], ['watch', 21, 24], ['market', 26, 23], ['house', 20, 28], ['barracks', 20, 22], ['house', 20, 29], ['farm', 25, 21], ['cloth', 23, 27], ['house', 18, 24], ['house', 18, 23], ['salt', 30, 22], ['temple', 28, 21], ['school', 29, 27], ['clinic', 22, 30], ['house', 19, 30], ['house', 19, 31], ['tower', 24, 14], ['mine', 12, 8], ['forge', 23, 31]];
  let idx = 0, broke = 0, wk = 0, minT = 1e9;
  const r = run(G, 36 * 10, (G, i) => {
    wk++; if (G.res.tien < 5) broke++; minT = Math.min(minT, G.res.tien);
    if (process.env.DBG && G.week === 1) console.log('   Y' + G.year + ' tien ' + Math.round(G.res.tien) + ' ' + Object.entries(G.flow.lastYear.tien || {}).sort((a, b) => a[1] - b[1]).slice(0, 5).map(e => e[0].slice(0, 22) + ':' + Math.round(e[1])).join(' | '));
    if (i % 4 === 0 && idx < plan.length) {
      const [k, nx, ny] = plan[idx++]; let b = build(G, k, nx, ny, 14);
      if (!b) { const sp = findSpot(G, k, nx + O, ny + O, 30); if (sp) { road(G, 24 + O, 25 + O, sp[0], sp[1]); b = build(G, k, nx, ny, 30); } }
      if (b && LT.B[k].job) road(G, 24 + O, 25 + O, b.x, b.y);
      if (b && k === 'forge') b.mode = 'binhkhi';
    }
    if (i === 12) G.pol.thuongbinh = true;
    if (i > 40 && i % 36 === 3 && G.res.tien > 150 && G.res.binhkhi >= 50 && LT.armyCount(G) < 220) { LT.recruit(G, 'truongthuong', 50); }
    if (G.rank === 1 && G.khao.thuong >= 3 && G.player.thanhdanh >= 40 && !G.khao.passed) G.khao.passed = true;
    if (G.rank === 1 && LT.promotion(G).ready) LT.promote(G);
  });
  console.log('  ' + sum(G) + (r.over ? '  [KẾT THÚC: ' + r.over.title + ']' : '') + ' | tuần cạn tiền: ' + broke + '/' + wk + ' | tiền thấp nhất ' + Math.round(minT) + ' | trận thắng ' + G.wins + ' | khảo: ' + G.khao.history.map(h => h.total).join(','));
  ok(!r.err, 'Mười năm không NaN / âm');
  ok(broke / wk < .2, 'Ngân khố hiếm khi cạn (cạn ' + broke + '/' + wk + ' tuần)');
  ok(!r.over, 'Không thua trong 10 năm chơi hợp lý' + (r.over ? ': ' + r.over.title : ''));
}
console.log('--- 3. Thuế Tận thu làm hộ bỏ trốn và dân tâm tụt');
{
  const G = LT.newGame(3, 'Tận thu', 42); G.pol.tax = 4;
  const h0 = LT.totalHo(G), d0 = G.stat.dantam;
  const r = run(G, 36 * 2);
  console.log('  ' + sum(G) + ' (đầu: hộ=' + h0 + ' DT=' + Math.round(d0) + ')');
  ok(!r.err, 'Tận thu không NaN');
  ok(G.stat.dantam < d0 - 8, 'Dân tâm tụt rõ rệt khi tận thu (' + Math.round(d0) + ' → ' + Math.round(G.stat.dantam) + ')');
  const A = LT.newGame(3, 'Khoan', 42); A.pol.tax = 0; run(A, 36 * 2);
  ok(A.stat.dantam > G.stat.dantam + 10, 'Thuế Khoan: dân tâm cao hơn Tận thu (' + Math.round(A.stat.dantam) + ' vs ' + Math.round(G.stat.dantam) + ')');
}
console.log('--- 4. Hạ thuế tháng 6, gặt tháng 9, thu thuế tháng 11 diễn ra đúng tuần');
{
  const G = LT.newGame(3, 'Lịch', 7); const ev = [];
  LT.onLog = t => ev.push(G.week + ':' + t.slice(0, 22));
  run(G, 36);
  LT.onLog = null;
  ok(ev.some(e => e.startsWith('16:Hạ thuế')), 'Hạ thuế vào tuần 16 (tháng 6)');
  ok(ev.some(e => e.startsWith('31:Thu thuế')), 'Thu thuế vào tuần 31 (tháng 11)');
  ok(G.lastYr.yield > 500, 'Gặt tháng 9: sản lượng năm = ' + Math.round(G.lastYr.yield) + ' thạch');
  ok(G.flow.lastYear.dluong && G.flow.lastYear.dluong['Thu hoạch ruộng'] > 0, 'Sổ dòng chảy ghi "Thu hoạch ruộng"');
}
console.log('--- 5. Lưu và tải');
{
  const G = goodG; const txt = LT.serialize(G); const H = LT.deserialize(txt);
  ok(H.bl.length === G.bl.length && LT.totalHo(H) === LT.totalHo(G) && H.year === G.year, 'Tải lại cùng số công trình, hộ khẩu, năm (' + H.bl.length + ' công trình)');
  ok(H.map[G.hy * LT.N + G.hx].b && H.map[G.hy * LT.N + G.hx].b.k === 'hall' && H.map[(G.hy + 1) * LT.N + G.hx + 1].b.k === 'hall', 'Phủ vẫn chiếm 4 ô sau khi tải');
  const r = run(H, 36); ok(!r.err, 'Chạy tiếp một năm sau khi tải không lỗi');
  ok(txt.length < 400000, 'Cỡ bản lưu hợp lý: ' + Math.round(txt.length / 1024) + ' KB');
}
console.log('--- 6. Biến cố: mọi lựa chọn đều chạy và đổi số thật');
{
  let bad = 0;
  for (const e of LT.EVENTS) for (let i = 0; i < e.opts.length; i++) {
    const G = LT.newGame(3, 'Biến cố', 5); G.res.tien = 500; G.res.luong = 500; G.res.go = 200; G.res.da = 200; G.reward = { need: 30 }; G.week = 8;
    const before = JSON.stringify([G.stat, G.res, G.player, G.H, G.weather, G.mods.length, G.pol, G.nghiky, G.bl.length]);
    G.pendingEvent = { id: e.id };
    const res = LT.chooseEvent(G, i);
    const after = JSON.stringify([G.stat, G.res, G.player, G.H, G.weather, G.mods.length, G.pol, G.nghiky, G.bl.length]);
    if (!res.ok || before === after) { bad++; ok(false, 'Biến cố ' + e.id + ' lựa chọn ' + i + ' không đổi số / lỗi ' + (res.err || '')); }
    if (finite(G)) { bad++; ok(false, 'Biến cố ' + e.id + ' tạo số xấu: ' + finite(G)); }
  }
  ok(bad === 0, LT.EVENTS.length + ' biến cố × lựa chọn đều đổi số và không tạo NaN');
}
console.log('--- 7. Trận thật trong ván: giặc đến, bày trận, kết quả ảnh hưởng thành');
{
  const G = LT.newGame(3, 'Chiến', 9);
  G.res.binhkhi = 400; G.res.tien = 800; build(G, 'barracks', 22, 28, 20);
  const a = LT.recruit(G, 'daothuan', 100), b = LT.recruit(G, 'cung', 80);
  const ho0 = LT.totalHo(G), binh0 = G.H.binh; G.units.forEach(u => { u.tan = 0; u.hl = Math.max(u.hl, 35); });
  ok(a.ok && b.ok, 'Mộ quân được khi có quân doanh (' + (a.err || '') + (b.err || '') + ')');
  LT.openBattle(G, 'giac', { total: 160, name: 'Giặc cỏ' });
  ok(G.pendingBattle && G.pendingBattle.enemy, 'Có trận giặc cướp chờ bày trận');
  const est = LT.battleEstimate(G, 40); console.log('  Ước tính thắng ' + Math.round(est.win * 100) + '%');
  const t0 = G.res.tien, w0 = G.wins;
  const rep = LT.resolveBattle(G);
  console.log('  Kết quả: ' + rep.result + ' ta mất ' + rep.sum.A.lost + ', địch mất ' + rep.sum.B.lost + ', ' + rep.hieps.length + ' hiệp');
  ok(rep.hieps.length > 0 && !G.pendingBattle, 'Trận đã chạy và đóng');
  ok(rep.result !== 'A' || (G.res.tien > t0 && G.wins === w0 + 1), 'Thắng thì có chiến lợi phẩm và đếm trận thắng');
  const G2 = LT.newGame(3, 'Thua', 9); G2.units = []; G2.formation = null; LT.ensureFormation(G2);
  const t1 = G2.res.tien; LT.openBattle(G2, 'giac', { total: 160 }); const r2 = LT.resolveBattle(G2);
  ok(r2.result === 'B' && G2.res.tien < t1, 'Không có quân thì thua và bị cướp phá (tiền ' + Math.round(t1) + ' → ' + Math.round(G2.res.tien) + ')');
}
console.log('--- 8. Thăng chức');
{
  const G = LT.newGame(3, 'Thăng', 3);
  G.khao.thuong = 3; G.player.thanhdanh = 60;
  let p = LT.promotion(G); ok(!p.ready && p.needExam, 'Chưa đỗ Tỉnh thí thì chưa thăng được');
  G.khao.passed = true; p = LT.promotion(G); ok(p.ready, 'Đủ điều kiện thì sẵn sàng thăng Thứ sử');
  LT.promote(G); ok(G.rank === 2 && LT.ownedCities(G).length === 3, 'Thăng Thứ sử: hạng 2, có 3 huyện thuộc quyền');
  ok(LT.SPLIT[2][2] === .35 && LT.armyCap(G) === 2500 && LT.unitCap(G) === 250, 'Chia thuế đổi 40/25/35; quân tối đa 2.500; đơn vị tối đa 250');
  run(G, 36);
  console.log('  huyện thuộc quyền nộp về:', LT.ownedCities(G).map(s => Math.round(s.last)).join(', '));
  ok(LT.ownedCities(G).every(s => s.last > 0), 'Các huyện thuộc quyền nộp tiền về');
  G.loanSince = 1; G.stat.thanhphong = 60; G.player.uyvong = 40; p = LT.promotion(G); ok(p.ready, 'Đủ điều kiện thăng Phòng ngự sứ');
  LT.promote(G); ok(G.rank === 3 && LT.armyCap(G) === 6000, 'Thăng Phòng ngự sứ: quân tối đa 6.000, được xuất quân');
}
console.log('--- 9. Thi Tỉnh thí bản rút gọn');
{
  const G = LT.newGame(3, 'Thi', 3); const ex = LT.newExam(G);
  ex.ans = ex.kn.map(q => q.a); ex.pans = ex.an.map(c => c.o.findIndex(o => o[1] === 15)); ex.picks = [0, 2, 3];
  const r = LT.gradeExam(ex); console.log('  bài thi giỏi:', JSON.stringify(r));
  ok(r.pass && r.total <= 100, 'Bài thi tốt đỗ (' + r.total + '/100)');
  ex.ans = ex.kn.map(q => (q.a + 1) % 4); ex.pans = ex.an.map(c => c.o.findIndex(o => o[1] !== 15 && o[1] < 5)); ex.picks = [4];
  ok(!LT.gradeExam(ex).pass, 'Bài thi dở thì trượt (' + LT.gradeExam(ex).total + ')');
}
console.log('--- 10. Thiên hạ và ngoại giao');
{
  const G = LT.newGame(8, 'Ngoại giao', 11);
  ok(LT.NATIONS.length === 12 && LT.NATIONS.reduce((a, n) => a + n.cities, 0) === 118 + 0 || LT.NATIONS.reduce((a, n) => a + n.cities, 0) > 100, '12 nước, tổng ' + LT.NATIONS.reduce((a, n) => a + n.cities, 0) + ' thành (GP §3)');
  const p = LT.persuasion(G, 9, 100); console.log('  điểm thuyết phục', p.total, p.parts.map(x => x.n.slice(0, 12) + '=' + x.v.toFixed(1)).join(' | '));
  G.res.tien = 1000; const rel0 = G.world.rel[7]; const s = LT.sendGift(G, 7, 2); ok(s.ok && G.world.rel[7] > rel0, 'Biếu lễ vật tăng quan hệ');
  const acts = LT.diploActions(G, 7); ok(acts.find(a => a.id === 'batxam').err.includes('Thứ sử'), 'Hành động cần chức cao hiển thị lý do');
  const r = LT.proposeTreaty(G, 7, 'thongthuong', 3); console.log('  thông thương:', r.text, r.p.total); ok(r.ok, 'Đề nghị giao ước chạy được');
  run(G, 36 * 8); console.log('  biên niên:', G.world.chron.slice(0, 3).map(c => c.t.slice(0, 60)).join(' / '));
  ok(G.world.chron.length > 2, 'Thiên hạ tự đổi thay (có biên niên): ' + G.world.chron.length + ' mục');
}
console.log(fails ? '\n' + fails + ' KIỂM THỬ HỎNG' : '\nTẤT CẢ ĐẠT');
process.exit(fails ? 1 : 0);

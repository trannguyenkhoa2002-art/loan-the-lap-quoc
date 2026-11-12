// Giai đoạn 3: ba con đường quyền lực (văn trị, chính trị, quân sự–cát cứ), thành tựu mở, phản đòn, chuyển bản lưu 8 → 9.
const path = require('path'), fs = require('fs');
for (const f of ['data', 'city', 'chunks', 'economy', 'game', 'battle', 'politics', 'war', 'events', 'world', 'wcities', 'campaign', 'trade', 'officials', 'automgmt', 'power', 'ai']) require(path.join(__dirname, '..', 'js', f + '.js'));
const LT = globalThis.LT; let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL  ' + m); } else console.log('  ok    ' + m); };
const advance = G => { let done = false; for (const b of G.bl) if (b.building) { b.progress += 1 / (b.duration || 12); if (b.progress >= 1) { b.progress = 1; b.building = false; b.born = -9; done = true; } } if (done) LT.recalcCity(G); };
const clearSoft = G => { G.pendingKhao = null; G.pendingPromo = null; G.pendingNotice = null; G.raid = null; };
// tự chơi một tuần như người chơi: giải quyết biến cố/trận (chọn theo hàm pick), không để ván dừng
function step(G, pick, log) {
  LT.tickWeek(G); clearSoft(G); advance(G);
  if (G.pendingEvent) { const id = G.pendingEvent.id, o = pick && pick[id] != null ? pick[id] : 0; if (log) log.push(id); const e = LT.EVENT(id); let i = o; if (LT.eventOptionError(G, i)) i = e.opts.findIndex((x, j) => !LT.eventOptionError(G, j)); if (i >= 0) LT.chooseEvent(G, i); else G.pendingEvent = null; }
  if (G.pendingBattle) { if (log) log.push('battle:' + G.pendingBattle.title); G.pendingBattle = null; }
  G.speed = 0;
}
const mk = (seed, rank, year) => { const G = LT.newGame(7, 'Q', seed); G.rank = rank || 3; if (year) G.year = year; LT.grantCities(G, 3, 1, 2); G.res.tien = 4000; G.res.go = 800; G.res.da = 500; G.res.luong = 2500; G.dan.luong = 2500; G.lab.budget = 5000; G.khao.history = [{ gid: 'thuong', grade: 'Hạng Thượng' }]; G.khao.thuong = 3; G.player.thanhdanh = 70; LT.recalcCity(G); return G; };
const idleOfficial = G => { const o = LT.offGen(G, 'khoacu'); o.id = LT.off(G).nextId++; o.home = null; LT.off(G).list.push(o); return o; };
const bigArmy = G => { G.units = ['truongthuong', 'cung', 'daothuan', 'khinhky', 'truongthuong'].map((t, i) => ({ id: i + 1, type: t, n: 2500, hl: 55, sk: 70, tb: 2, tan: 0 })); G.nextId = 10; G.wins = 12; LT.ensureFormation(G); };
const keepRich = G => { G.khao.history = [{ gid: 'thuong', grade: 'Hạng Thượng' }]; G.res.luong = Math.max(G.res.luong, 1500); G.dan.luong = Math.max(G.dan.luong, 1500); };
const yearsOf = (G, t) => t ? (t.y - 917) + (t.w - 1) / 36 : null;
const FIDS = Object.keys(LT.COURT_FACTIONS);

console.log('--- 1. Ba thước đo và dữ liệu triều đình');
{
  const G = mk(201); const sc = LT.pwScores(G);
  ok(['van', 'chinh', 'quan'].every(k => sc[k].v >= 0 && sc[k].v <= 100 && sc[k].parts.length >= 5), 'Ba thước đo 0–100 kèm lý do cộng trừ: văn trị ' + sc.van.v + ', chính trị ' + sc.chinh.v + ', quân sự–cát cứ ' + sc.quan.v);
  const C1 = LT.newCourt(7, 5), C2 = LT.newCourt(7, 5), C3 = LT.newCourt(3, 5);
  ok(JSON.stringify(C1) === JSON.stringify(C2) && JSON.stringify(C1) !== JSON.stringify(C3), 'Triều đình sinh xác định theo (nước, hạt giống) — dùng lại được cho nước khác ở giai đoạn 4');
  ok(FIDS.length === 4 && FIDS.every(f => C1.f[f].power > 5), 'Bốn phe có thế lực và thái độ: ' + FIDS.map(f => LT.COURT_FACTIONS[f].n + ' ' + C1.f[f].power + '/' + C1.f[f].att).join(', '));
  ok(!G.pw || !G.pw.engaged, 'Ván chưa dùng tính năng mới: engaged = false');
}

console.log('--- 2. Hướng Văn trị: cải cách và làm trọng thần (không xưng đế)');
let vanYear = null;
{
  const G = mk(202, 3, 928); const rfLog = [];
  for (let i = 0; i < 3; i++) idleOfficial(G);
  const r1 = LT.pwReform(G, 'giamlao'), r2 = LT.pwReform(G, 'doluong'), r3 = LT.pwReform(G, 'chinhdon');
  ok(r1.ok && r2.ok && r3.ok && G.mods.some(m => m.k === 'dt' && m.v === -3) && G.mods.some(m => m.k === 'dt' && m.v === 4), 'Ba cải cách ban hành, có đánh đổi thật (dân tâm −3 do đo ruộng, +4 do giảm lao dịch)');
  const lab0 = G.lab.budget; ok(LT.laoDichBudget(G) < lab0 * 1.01 && LT.pwLaoMul(G) === .7, 'Giảm lao dịch hạ hạn mức lao dịch xuống 70%'); ok(LT.pwTaxMul(G) === 1.15, 'Đo lại ruộng đất tăng thuế thóc 15%');
  ok(!LT.pwReform(G, 'giamlao').ok, 'Không ban hành trùng một cải cách đang chạy');
  let ttAt = {}; const act = () => { for (const f of ['vanthan', 'noithan']) LT.pwAct(G, 'ketgiao', f); if (LT.off(G).list.some(o => !o.post)) LT.pwAct(G, 'tiencu', 'vanthan'); else idleOfficial(G); for (let lv = 1; lv <= 3; lv++) if (G.pw.tt < lv && !LT.ttCheck(G, lv)) { const r = LT.pwTrongThan(G); if (r.ok) ttAt[lv] = G.year; } };
  for (let i = 0; i < 36 * 8; i++) { keepRich(G); if (i % 9 === 3) act(); { for (const id of ['doluong', 'giamlao', 'chinhdon']) LT.pwReform(G, id); } step(G, { dieuquan: 0, chieuan: 0 }, rfLog); if (G.pw.ach.trungthan && !vanYear) { vanYear = G.pw.ach.trungthan.y; } }
  const P = G.pw, sc = LT.pwScores(G);
  console.log('   văn trị ' + sc.van.v + ', chính trị ' + sc.chinh.v + ', quân sự ' + sc.quan.v + ', chức triều ' + (LT.TRONG_THAN[P.tt] || { n: 'không' }).n + ', người trong triều ' + P.court.agents + ', mốc chức: ' + JSON.stringify(ttAt));
  ok(P.tt >= 2 && P.stance === 'trung' && G.rank < 6 && !G.indep, 'Bot văn trị làm Thượng thư trở lên ở triều, vẫn là ' + LT.RANKS[G.rank].n + ' (không tự lập, không xưng đế)');
  ok(!!P.ach.trungthan && vanYear >= 930, 'Đạt thành tựu "Trung thần, vùng đất thịnh vượng" năm ' + vanYear + ' (' + ((vanYear || 0) - 917) + ' năm sau khi bắt đầu)');
  ok(!G.over, 'Đạt thành tựu không kết thúc ván: ván vẫn chạy (G.over = ' + G.over + ')');
  ok(G.res.tien > 0 && G.stat.dantam > 30 && !G.over, 'Thành không sụp: dân tâm ' + Math.round(G.stat.dantam));
}

console.log('--- 3. Hướng Chính trị: thành quyền thần khống chế triều đình');
let chinhYear = null, puppetYear = null;
{
  const G = mk(203, 4, 931); bigArmy(G); const evs = [];
  const act = i => { for (const f of FIDS) LT.pwAct(G, 'ketgiao', f); idleOfficial(G); for (const f of ['vanthan', 'huancuu', 'ngoaithich']) LT.pwAct(G, 'tiencu', f); if (i % 54 === 3) LT.pwAct(G, 'lienhon', FIDS[(i / 54 | 0) % 4]); if (i % 72 === 3) { const lo = FIDS.slice().sort((a, b) => G.pw.court.f[a].att - G.pw.court.f[b].att)[0]; LT.pwAct(G, 'muachuoc', lo); } for (let lv = 1; lv <= 3; lv++) if (G.pw.tt < lv && !LT.ttCheck(G, lv)) LT.pwTrongThan(G); };
  for (const id of ['giamlao', 'doluong']) LT.pwReform(G, id);
  let manip = [], ctlMax = 0; for (let i = 0; i < 36 * 9; i++) { keepRich(G); G.res.tien = Math.max(G.res.tien, 6000); if (i % 9 === 3) act(i); if (i % 18 === 10 && LT.courtControl(G) >= .55) { const m = ['giamcong', 'buonhiem', 'phongdat'][(i / 18 | 0) % 3], r = LT.pwManip(G, m); if (r.ok) manip.push(m); } ctlMax = Math.max(ctlMax, LT.courtControl(G)); step(G, { dieuquan: 0, chieuan: 0 }, evs); if (G.pw.ach.thaotung && !chinhYear) chinhYear = G.pw.ach.thaotung.y; }
  const P = G.pw, ctl = LT.courtControl(G);
  console.log('   kiểm soát cuối ' + Math.round(ctl * 100) + '% (cao nhất ' + Math.round(ctlMax * 100) + '%), người trong triều ' + P.court.agents + ', việc đã làm: ' + manip.join(',') + ', sự kiện: ' + evs.slice(0, 4).join(','));
  ok(ctlMax >= .6 && P.court.agents >= 5, 'Bot chính trị khống chế triều đình (cao nhất ' + Math.round(ctlMax * 100) + '%, ' + P.court.agents + ' người của mình)');
  ok(!!P.ach.thaotung && G.rank < 6, 'Đạt thành tựu "Thao túng triều đình" năm ' + chinhYear + ' mà không xưng đế (chức ' + LT.RANKS[G.rank].n + ')');
  ok(manip.length >= 2, 'Ép chính sách qua đình nghị: ' + manip.length + ' lần thành công (' + manip.join(', ') + ')');
  ok(!G.over, 'Ván không kết thúc sau thành tựu');
  const G2 = mk(204, 3, 920); G2.units = [{ id: 1, type: 'truongthuong', n: 100, hl: 55, sk: 70, tb: 2, tan: 0 }]; G2.nextId = 10; LT.ensureFormation(G2); let ctl2 = 0; for (let i = 0; i < 36 * 8; i++) { keepRich(G2); ctl2 = Math.max(ctl2, LT.courtControl(G2)); if (i % 9 === 3) { for (const f of FIDS) { LT.pwAct(G2, 'ketgiao', f); } idleOfficial(G2); for (const f of ['vanthan', 'huancuu', 'noithan']) LT.pwAct(G2, 'tiencu', f); if (i % 54 === 3) LT.pwAct(G2, 'lienhon', FIDS[(i / 54 | 0) % 4]); } step(G2, { dieuquan: 0, chieuan: 0 }); }
  ok(ctl2 < .5 && !G2.pw.ach.thaotung, 'Phòng ngự sứ chỉ 100 quân, 8 năm kết giao: kiểm soát cao nhất ' + Math.round(ctl2 * 100) + '% (trần ' + Math.round(LT.ctlCap(G2) * 100) + '%), KHÔNG đạt thao túng');
  ok(chinhYear >= 935 && G.rank >= 4, 'Bot chính trị tối ưu (Tiết độ sứ, 12.500 quân, 6.000 quan) chỉ đạt thao túng năm ' + chinhYear + ' (≥ 935, sau ' + (chinhYear - 917) + ' năm)');
  const pp = LT.pwPuppet(G2); puppetYear = G2.year; console.log('   thử làm quyền thần: ' + (pp.ok ? 'được (kiểm soát ' + Math.round(LT.courtControl(G2) * 100) + '%)' : pp.err));
}

console.log('--- 4. Hướng Quân sự – Cát cứ: giữ độc lập thực tế nhiều năm');
let catYear = null;
{
  const G = mk(205, 4); const evs = []; G.units = [{ id: 1, type: 'truongthuong', n: 2500, hl: 55, sk: 70, tb: 2, tan: 0 }, { id: 2, type: 'cung', n: 2500, hl: 55, sk: 70, tb: 2, tan: 0 }, { id: 3, type: 'daothuan', n: 2500, hl: 55, sk: 70, tb: 2, tan: 0 }, { id: 4, type: 'khinhky', n: 2500, hl: 55, sk: 70, tb: 2, tan: 0 }, { id: 5, type: 'truongthuong', n: 2500, hl: 55, sk: 70, tb: 2, tan: 0 }]; G.nextId = 10; G.wins = 12; LT.ensureFormation(G);
  const st = LT.pwStance(G, 'cat'); ok(st.ok && G.pol.nop === 'giu', 'Chọn danh nghĩa Cát cứ: giữ thuế (nộp lên = 0)'); let gotBattle = 0, minNghi = 0, nghiMax = 0, tuMax = 0;
  for (let i = 0; i < 36 * 7; i++) { keepRich(G); if (i % 36 === 5) { for (const f of ['huancuu', 'noithan']) LT.pwAct(G, 'ketgiao', f); } step(G, { dieuquan: 2, chieuan: 1 }, evs); nghiMax = Math.max(nghiMax, G.nghiky); tuMax = Math.max(tuMax, G.pw.tuchu); if (G.pw.ach.catcu && !catYear) catYear = G.pw.ach.catcu.y; if (G.over) break; }
  gotBattle = evs.filter(e => /^battle:/.test(e)).length;
  console.log('   tự chủ cao nhất ' + Math.round(tuMax) + ', nghi kỵ cao nhất ' + Math.round(nghiMax) + ', biến cố triều đình: ' + evs.filter(e => !/^battle/.test(e)).join(',') + ', trận thảo phạt: ' + gotBattle);
  ok(tuMax >= 70 && !G.over && G.pw.stance === 'cat' && LT.mineCount(G) >= 3, 'Bot cát cứ giữ độc lập thực tế 7 năm, tự chủ ' + Math.round(G.pw.tuchu) + ', còn ' + LT.mineCount(G) + ' thành, ván chưa kết thúc');
  ok(!!G.pw.ach.catcu, 'Đạt thành tựu "Cát cứ lâu dài" năm ' + catYear + ' (không cần xưng đế: chức ' + LT.RANKS[G.rank].n + ')');
  ok(!G.over, 'Đạt thành tựu không kết thúc ván');
  // triều phản ứng theo tương quan: yếu thì thảo phạt, mạnh thì chiêu an
  const W = mk(206, 4); W.units = [{ id: 1, type: 'truongthuong', n: 200, hl: 40, sk: 50, tb: 1, tan: 0 }]; LT.pwStance(W, 'cat'); W.pw.tuchu = 80; const evW = []; for (let i = 0; i < 36 * 3; i++) { keepRich(W); step(W, {}, evW); } ok(evW.some(e => /thảo phạt/i.test(e)), 'Cát cứ khi quá yếu (200 quân) bị triều đình thảo phạt: ' + evW.filter(e => /battle/.test(e)).slice(0, 2).join('; '));
  const S = mk(207, 4); S.units = [1, 2, 3, 4].map(i => ({ id: i, type: 'truongthuong', n: 5000, hl: 55, sk: 70, tb: 2, tan: 0 })); S.nextId = 10; LT.ensureFormation(S); LT.pwStance(S, 'cat'); S.pw.tuchu = 80; const evS = []; for (let i = 0; i < 36 * 4; i++) { keepRich(S); step(S, { chieuan: 0 }, evS); } ok(evS.includes('chieuan') || S.pw.stance !== 'cat', 'Đủ mạnh thì triều đình chiêu an (biến cố "chiêu an" xuất hiện: ' + (evS.includes('chieuan') ? 'có' : 'không') + ')');
}

console.log('--- 5. Đổi hướng giữa ván (văn trị rồi cát cứ), đổi chủ');
{
  const G = mk(208, 4); G.units = [{ id: 1, type: 'truongthuong', n: 3000, hl: 55, sk: 70, tb: 2, tan: 0 }, { id: 2, type: 'cung', n: 3000, hl: 55, sk: 70, tb: 2, tan: 0 }, { id: 3, type: 'daothuan', n: 3000, hl: 55, sk: 70, tb: 2, tan: 0 }, { id: 4, type: 'khinhky', n: 3000, hl: 55, sk: 70, tb: 2, tan: 0 }, { id: 5, type: 'truongthuong', n: 3000, hl: 55, sk: 70, tb: 2, tan: 0 }]; G.nextId = 10; LT.ensureFormation(G);
  for (let i = 0; i < 3; i++) idleOfficial(G); for (const id of ['giamlao', 'doluong', 'chinhdon']) LT.pwReform(G, id);
  for (let i = 0; i < 36 * 3; i++) { keepRich(G); if (i % 9 === 3) { LT.pwAct(G, 'ketgiao', 'vanthan'); LT.pwAct(G, 'tiencu', 'vanthan') .ok || idleOfficial(G); for (let lv = 1; lv <= 3; lv++) if (G.pw.tt < lv && !LT.ttCheck(G, lv)) LT.pwTrongThan(G); } step(G, { dieuquan: 0 }); }
  const ttBefore = G.pw.tt; ok(ttBefore >= 1 && G.pw.stance === 'trung', 'Giai đoạn 1 đi văn trị: chức ' + (LT.TRONG_THAN[ttBefore] || {}).n + ', danh nghĩa trung thần');
  const sw = LT.pwStance(G, 'cat'); ok(sw.ok, 'Đổi sang cát cứ giữa ván — không bị khóa lựa chọn'); const evs = []; let tuMax = 0; for (let i = 0; i < 36 * 6; i++) { keepRich(G); step(G, { dieuquan: 2, chieuan: 1 }, evs); tuMax = Math.max(tuMax, G.pw.tuchu); if (G.over) break; }
  ok(!G.over && tuMax >= 65 && G.pw.tt >= 0, 'Sau khi đổi hướng: tự chủ lên ' + Math.round(tuMax) + ', ván tiếp tục; vẫn giữ các cải cách/chức cũ nếu còn (chức triều ' + ((LT.TRONG_THAN[G.pw.tt] || {}).n || 'không') + ')');
  ok(LT.pwStance(G, 'trung').ok, 'Quay lại trung thần cũng được');
  const D = mk(209, 4); const r = LT.pwDefect(D, 3); ok(r.ok && D.pw.lord === 3 && D.pw.stance === 'than' && D.pol.nop === 'thieu', 'Đổi chủ: thần phục nước khác trên danh nghĩa, nộp một nửa, quan hệ đổi theo'); for (let i = 0; i < 40; i++) step(D, {});
}

console.log('--- 6. Phản đòn có thật khi thao túng vụng');
{
  // (a) mua chuộc dồn dập: tội đút lót bị lộ
  const G = mk(210); const lg = []; let hit = false, demoted = false, nghi0 = G.nghiky;
  G.pw = G.pw || LT.pw(G); for (let i = 0; i < 36 * 6; i++) { keepRich(G); if (i % 9 === 3) for (const f of FIDS) LT.pwAct(G, 'muachuoc', f); const tt0 = G.pw.tt, th0 = G.player.thanhdanh; step(G, { dieuquan: 0 }, lg); if (G.pw.court.log.some(l => /Bị (giáng|đàn hặc)/.test(l.t)) ) hit = true; if (G.pw.log.some(l => /giáng chức/.test(l.t))) demoted = true; if (G.over) break; }
  console.log('   mua chuộc dồn dập: bị phản đòn ' + (G.pw.log.filter(l => l.k === 'bad').length) + ' lần; nghi kỵ ' + Math.round(G.nghiky) + ', Thanh danh ' + Math.round(G.player.thanhdanh) + ', người trong triều ' + G.pw.court.agents);
  ok(G.pw.log.some(l => l.k === 'bad') || G.over, 'Mua chuộc liên tục bị đàn hặc hoặc giáng chức (nhật ký thế lực có mục phản đòn)');
  // (b) làm quyền thần rồi mất thế: bị thảo phạt
  const H = mk(211, 4, 931); bigArmy(H); H.pw = LT.pw(H); H.pw.tt = 2; for (let i = 0; i < 40; i++) idleOfficial(H); const C = LT.pw(H).court; for (const f of FIDS) { C.f[f].att = 80; C.f[f].power = 40; } C.agents = 8; LT.pw(H).engaged = true; const pp = LT.pwPuppet(H); ok(pp.ok, 'Điều kiện làm quyền thần (kiểm soát ' + Math.round(LT.courtControl(H) * 100) + '%) → ' + (pp.ok ? 'được' : pp.err));
  const evs = []; let reacted = false; for (let i = 0; i < 36 * 6 && !reacted; i++) { keepRich(H); if (i === 60) { for (const f of FIDS) { C.f[f].att = -50; C.f[f].power = 70; C.f[f].bias = -40; } C.agents = 1; } step(H, { dieuquan: 0 }, evs); if (evs.some(e => /thảo phạt/i.test(e)) || H.pw.log.some(l => /giáng|thảo phạt/i.test(l.t))) reacted = true; }
  ok(reacted && !H.pw.court.king.puppet, 'Quyền thần mất thế (các phe quay lưng): vua lấy lại quyền, bị thảo phạt hoặc giáng chức — ' + (evs.filter(e => /battle/.test(e))[0] || (H.pw.log.find(l => /giáng/.test(l.t)) || {}).t));
}

console.log('--- 7. Thành tựu ghi sổ, ván vẫn chơi tiếp');
{
  const G = mk(212); const P = LT.pw(G); const before = Object.keys(P.ach).length;
  G.rank = 6; const got = LT.achCheck(G); ok(got.includes('hoangde') && P.ach.hoangde, 'Đạt hạng Hoàng đế chỉ là một thành tựu "nhánh": ghi sổ năm ' + P.ach.hoangde.y);
  ok(G.pendingNotice && /Thành tựu/.test(G.pendingNotice.title) && !G.over, 'Báo thành tựu bằng hộp thoại, ván không kết thúc');
  const L = LT.finalEnding; G.year = 980; G.week = 36; G.week = 36; LT.rollYear && 0; for (let i = 0; i < 40; i++) { LT.tickWeek(G); clearSoft(G); G.pendingEvent = null; G.pendingBattle = null; if (G.over) break; }
  ok(!G.over, 'Qua năm 979 ván không tự kết thúc (có hộp tổng kết, chơi tiếp được)');
  const A = mk(213); for (const id in LT.ACH) A.pw = A.pw || LT.pw(A); ok(Object.keys(LT.ACH).length === 8 && ['thaotung', 'chinhphuc', 'kinhte', 'quansu', 'trungthan', 'catcu'].every(k => LT.ACH[k]), 'Bảng có đủ sáu hướng của kế hoạch + hai nhánh (xưng đế, thống nhất)');
}

console.log('--- 8. Ván không đụng tính năng mới chạy y như trước');
{
  const A = mk(214), B = mk(214); LT.pw(B);   // chỉ tạo sổ thế lực, không dùng
  const strip = G => { const o = JSON.parse(LT.serialize(G)); delete o.era; delete o.pw; if (o.off) delete o.off.dg; return JSON.stringify(o); };
  for (let i = 0; i < 150; i++) { step(A, {}); step(B, {}); }
  ok(strip(A) === strip(B), 'Hai ván cùng hạt giống, một ván có sổ thế lực nhưng không dùng: sau 150 tuần trạng thái giống hệt (trừ sổ thế lực)');
  ok(!B.pw.engaged && Object.keys(B.pw.rf).length === 0 && B.pw.stance === 'trung', 'Không có cải cách, danh nghĩa vẫn trung thần, không "engaged"');
}

console.log('--- 9. Chuyển bản lưu 8 → 9');
{
  const txt = fs.readFileSync(path.join(__dirname, 'fixtures', 'save-v8.json'), 'utf8'), raw = JSON.parse(txt);
  ok(raw.ver === 8 && !raw.pw, 'Tệp thử là bản lưu v8 thật, chưa có sổ thế lực');
  let G, err = ''; try { G = LT.deserialize(txt); } catch (e) { err = e.message; }
  ok(G && !err && G.ver === LT.SAVE_VER, 'Bản v8 tải được và được nâng lên phiên bản ' + LT.SAVE_VER + (err ? ': ' + err : ''));
  ok(G.rank === raw.rank && G.units.length === raw.units.length && LT.armyCount(G) === raw.units.reduce((a, u) => a + u.n, 0) && LT.mineCount(G) === raw.world.cities.filter(c => c.mine).length && G.year === raw.year, 'Giữ nguyên chức (' + LT.RANKS[G.rank].n + '), quân (' + LT.armyCount(G) + '), đất (' + LT.mineCount(G) + ' thành), năm ' + G.year);
  ok(G.pw && G.pw.court && G.pw.stance === 'trung' && !G.pw.engaged && Object.keys(G.pw.ach).length === 0, 'Sổ thế lực điền mặc định: trung thần, chưa dùng, chưa thành tựu');
  let bad = ''; try { for (let i = 0; i < 90; i++) step(G, {}); } catch (e) { bad = e.message; } ok(!bad && G.res.tien >= 0, 'Chơi tiếp 90 tuần không lỗi (năm ' + G.year + ')');
  let bad2 = ''; try { const r = LT.pwAct(G, 'ketgiao', 'vanthan'); LT.pwStance(G, 'than'); for (let i = 0; i < 90; i++) { keepRich(G); step(G, { dieuquan: 0 }); } } catch (e) { bad2 = e.message; } ok(!bad2, 'Dùng thế lực mới trên bản lưu cũ rồi chơi 90 tuần không lỗi');
  const again = LT.deserialize(LT.serialize(G)); ok(again.ver === LT.SAVE_VER && again.pw.stance === 'than' && again.pw.engaged && again.pw.court.log.length === G.pw.court.log.length, 'Lưu rồi tải lại bản mới giữ nguyên sổ thế lực');
  let thrown = ''; try { LT.deserialize(JSON.stringify(Object.assign(JSON.parse(txt), { ver: 7 }))); } catch (e) { thrown = e.message; } ok(/phiên bản lưu 7/.test(thrown), 'Bản lưu < 8 vẫn bị từ chối rõ ràng');
}

console.log('\nMốc năm của các bot: văn trị ' + vanYear + ', chính trị ' + chinhYear + ', cát cứ ' + catYear + ' (ván bắt đầu 917)');
console.log(fails ? '\n' + fails + ' KIỂM THỬ HỎNG' : '\nTẤT CẢ ĐẠT');
process.exit(fails ? 1 : 0);

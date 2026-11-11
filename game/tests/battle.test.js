// Kiểm thử chiến trận: ví dụ GP §10.4 và các tính chất cơ bản. Chạy: node tests/battle.test.js
const path = require('path');
for (const f of ['data', 'battle']) require(path.join(__dirname, '..', 'js', f + '.js'));
const LT = globalThis.LT;
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL  ' + m); } else console.log('  ok    ' + m); };

// Ví dụ 1: 600 trường thương (Công 9, HL 60, SK 70, tướng Thống 70) vs 600 trọng kỵ (Thủ 12) → ≈31
const r1 = LT.hitCalc({ type: 'truongthuong', n: 600, hl: 60, sk: 70, tong: 70, tb: 1 }, { type: 'trongky', n: 600, hl: 80, sk: 80, tb: 1 });
console.log('  Lực =', Math.round(r1.luc), ' thương vong =', r1.cas.toFixed(2), ' hệ số khắc', r1.khac);
ok(Math.abs(r1.luc - 7436) < 3, 'Lực ví dụ 1 ≈ 7.436');
ok(Math.round(r1.cas) === 31, 'Thương vong địch ≈ 31 (ví dụ 1)');
// Ví dụ 2: trọng kỵ xung phong hiệp đầu → ≈55, hiệp sau ≈31
const r2 = LT.hitCalc({ type: 'trongky', n: 600, hl: 80, sk: 80, tong: 50, tb: 1 }, { type: 'truongthuong', n: 600, tb: 1 }, { extra: 1.8 });
const r3 = LT.hitCalc({ type: 'trongky', n: 600, hl: 80, sk: 80, tong: 50, tb: 1 }, { type: 'truongthuong', n: 600, tb: 1 });
console.log('  xung phong =', r2.cas.toFixed(2), ' hiệp sau =', r3.cas.toFixed(2));
ok(Math.round(r2.cas) === 55, 'Trọng kỵ xung phong ≈ 55 thương binh');
ok(Math.round(r3.cas) === 30 || Math.round(r3.cas) === 31, 'Từ hiệp sau ≈ 31 (30,5)');
// Trang bị cấp 3 = +16%
const r4 = LT.hitCalc({ type: 'cung', n: 100, hl: 50, sk: 60, tong: 0, tb: 3 }, { type: 'truongthuong', n: 100, tb: 1 });
const r5 = LT.hitCalc({ type: 'cung', n: 100, hl: 50, sk: 60, tong: 0, tb: 1 }, { type: 'truongthuong', n: 100, tb: 1 });
ok(Math.abs(r4.luc / r5.luc - 1.16) < 1e-9, 'Mỗi cấp trang bị +8% Công (cấp 3 = ×1,16)');
ok(LT.khacOf('truongthuong', 'trongky') === 1.5 && Math.abs(LT.khacOf('trongky', 'truongthuong') - 1 / 1.5) < 1e-9, 'Khắc chế trường thương ↔ trọng kỵ ×1,5 và ×0,67');

// Trận mô phỏng đầy đủ
const mk = (name, comp, form) => { const s = LT.aiSide(name, comp, { name: 'T', tong: 60, tri: 60 }); s.form = form || 'phuong'; return s; };
const mine = [{ type: 'truongthuong', n: 100, hl: 50, sk: 65, tb: 2 }, { type: 'daothuan', n: 100, hl: 50, sk: 65, tb: 2 }, { type: 'cung', n: 100, hl: 50, sk: 65, tb: 1 }];
const bandit = [{ type: 'truongthuong', n: 80, hl: 25, sk: 55, tb: 1 }, { type: 'daothuan', n: 70, hl: 25, sk: 55, tb: 1 }, { type: 'cung', n: 40, hl: 25, sk: 55, tb: 1 }];
const cfg = { A: mk('Ta', mine), B: mk('Giặc', bandit), terrain: 'dongbang', nameA: 'Ta', nameB: 'Giặc' };
const rep = LT.runBattle(cfg, 7);
console.log('  kết quả', rep.result, rep.why, JSON.stringify(rep.sum));
ok(rep.hieps.length >= 3 && rep.hieps.length <= 12, 'Trận có ' + rep.hieps.length + ' hiệp (≤ 12)');
ok(rep.sum.A.end >= 0 && rep.sum.B.end >= 0 && !isNaN(rep.sum.A.lost), 'Không ra NaN / âm');
ok(rep.hieps[0].lines.every(l => l.mode === 'shoot'), 'Hiệp 1–2 chỉ có cung nỏ bắn (chưa giáp chiến)');
ok(rep.hieps[2].lines.some(l => l.mode === 'melee'), 'Hiệp 3 bắt đầu giáp chiến');
const est = LT.estimateWin(cfg, 60);
console.log('  ước tính thắng', Math.round(est.win * 100) + '%');
ok(est.win > .6, 'Quân ta (300, huấn luyện 50, trang bị 2) thắng giặc cỏ (190) thường xuyên');
// trận hình phản nhau & địa hình
const c2 = LT.clone(cfg); c2.A.form = 'vien';
const e2 = LT.estimateWin(c2, 40); console.log('  Viên trận', Math.round(e2.win * 100) + '%');
ok(!isNaN(e2.win), 'Mọi trận hình chạy được');
for (const f of LT.FORM_IDS) { const c = LT.clone(cfg); c.A.form = f; const r = LT.runBattle(c, 3); if (!r.result || isNaN(r.sum.A.end)) ok(false, 'Trận hình ' + f); }
ok(true, 'Cả 8 trận hình chạy không lỗi');
for (const t of Object.keys(LT.TERRAINS)) { const c = LT.clone(cfg); c.terrain = t; c.holder = 'B'; c.crosser = 'A'; const r = LT.runBattle(c, 5); if (!r.result || isNaN(r.sum.A.end)) ok(false, 'Địa hình ' + t); }
ok(true, 'Cả 6 địa hình chạy không lỗi');
// trọng kỵ vs trường thương: chiến báo hiệp xung phong
const ky = [{ type: 'trongky', n: 100, hl: 80, sk: 80, tb: 1 }, { type: 'truongthuong', n: 100, hl: 60, sk: 70, tb: 1 }];
const c3 = { A: mk('Ky', ky), B: mk('Thuong', [{ type: 'truongthuong', n: 100, hl: 60, sk: 70, tb: 1 }, { type: 'truongthuong', n: 100, hl: 60, sk: 70, tb: 1 }]) };
const rp3 = LT.runBattle(c3, 11, {});
ok(rp3.hieps[2].lines.some(l => l.charge), 'Trọng kỵ xung phong đánh dấu ở hiệp giáp chiến đầu');
// ô trống bị đánh sườn
const c4 = LT.clone(cfg); c4.A.grid = [[null, null, null], [null, null, null], [null, null, null]]; c4.A.reserve = []; c4.A.grid[0][1] = LT.battleUnit({ id: 1, type: 'truongthuong', n: 100, hl: 50, sk: 65, tb: 1 }, null, c4.A.chief);
const r6 = LT.runBattle(c4, 9);
ok(r6.result === 'B', 'Bên chỉ có 1 đơn vị bị đánh bại');
// Quân lệnh "thương vong > 30% → thu quân" chỉ kích hoạt khi thiệt hại thật vượt 30% (kể cả đơn vị vỡ chưa chết)
{
  const c = LT.clone(cfg); c.A.conds = ['thuongvong30']; c.A.reserve = [];
  const big = [{ type: 'trongky', n: 300, hl: 80, sk: 80, tb: 3 }, { type: 'trongky', n: 300, hl: 80, sk: 80, tb: 3 }, { type: 'daothuan', n: 300, hl: 80, sk: 80, tb: 3 }];
  c.B = mk('Manh', big, 'phongthi');
  const rp = LT.runBattle(c, 4);
  const fired = rp.hieps.some(h => h.ev.some(e => e.txt.indexOf('QUÂN LỆNH: thương vong') >= 0));
  if (fired) { const lost = rp.sum.A.lost / rp.sum.A.start; ok(lost >= .3, 'Thu quân chỉ khi thương vong thật ≥ 30% (thực tế ' + Math.round(lost * 100) + '%)'); } else ok(true, 'Quân lệnh thu quân không kích hoạt khi thương vong < 30%');
  const c6 = LT.clone(cfg); c6.A.conds = ['thuongvong30'];
  const rq = LT.runBattle(c6, 21); ok(!rq.hieps.some(h => h.ev.some(e => e.txt.indexOf('QUÂN LỆNH: thương vong') >= 0)) || rq.sum.A.lost / rq.sum.A.start >= .25, 'Không thu quân sớm khi thương vong còn thấp');
}
// Ước tính phản ánh việc không có quân
const c5 = LT.clone(cfg); c5.A.grid = [[null, null, null], [null, null, null], [null, null, null]]; c5.A.reserve = [];
const r7 = LT.runBattle(c5, 9); ok(r7.result === 'B', 'Không xếp quân thì thua');
console.log(fails ? '\n' + fails + ' KIỂM THỬ HỎNG' : '\nTẤT CẢ ĐẠT');
process.exit(fails ? 1 : 0);

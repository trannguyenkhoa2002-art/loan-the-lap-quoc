// Giai đoạn 2: quản lý tự động (quan xây dựng, kinh tế, quân sự, tổng quản) + tương thích bản lưu v8.
const path = require('path'), fs = require('fs');
for (const f of ['data', 'city', 'chunks', 'economy', 'game', 'battle', 'politics', 'war', 'events', 'world', 'wcities', 'campaign', 'trade', 'officials', 'automgmt', 'power']) require(path.join(__dirname, '..', 'js', f + '.js'));
const LT = globalThis.LT; let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL  ' + m); } else console.log('  ok    ' + m); };
const calm = G => { G.pendingEvent = null; G.pendingBattle = null; G.raid = null; G.pendingKhao = null; G.pendingPromo = null; G.pendingNotice = null; };
// giả lập thi công như vòng lặp trò chơi: mỗi tuần mỗi công trình tiến 1/thời gian xây
const advance = G => { let done = false; for (const b of G.bl) if (b.building) { b.progress += 1 / (b.duration || 12); if (b.progress >= 1) { b.progress = 1; b.building = false; b.born = -9; done = true; } } if (done) LT.recalcCity(G); };
const step = G => { LT.tickWeek(G); calm(G); advance(G); };
const mk = (seed, rank) => { const G = LT.newGame(7, 'Q', seed); G.rank = rank || 3; LT.grantCities(G, 3, 1, 2); G.res.tien = 1500; G.res.go = 600; G.res.da = 400; G.res.luong = 1500; G.dan.luong = 1500; G.lab.budget = 5000; LT.recalcCity(G); return G; };
const appoint = (G, role, st) => { const o = LT.offGen(G, 'khoacu'); o.id = LT.off(G).nextId++; Object.assign(o, { chinh: 80, tri: 80, duc: 70, tong: 60, vo: 60, liem: 90, trung: 90, da: 10, home: null }, st || {}); LT.off(G).list.push(o); const r = LT.offAppoint(G, o.id, { t: 'seat', role: LT.DG_ROLES[role].seat }); if (!r.ok) throw new Error(r.err); return o; };
// bắt mọi lần LT.place do quan gọi
const placed = []; const realPlace = LT.place;
LT.place = function (G, k, x, y, opt) { if (!LT.dgPlacing) return realPlace.apply(this, arguments); const before = { tien: G.res.tien, go: G.res.go, da: G.res.da }, err = k === 'del' ? 'DEL' : LT.canPlace(G, k, x, y); const r = realPlace.apply(this, arguments); placed.push({ k, x, y, err, opt: opt || {}, ok: r.ok, tick: G.tick, used: { tien: before.tien - G.res.tien, go: before.go - G.res.go, da: before.da - G.res.da }, per: G.year * 4 + Math.floor((G.week - 1) / 9) }); return r; };

console.log('--- 1. Quan xây dựng: ngân sách, luật đặt, không phá');
{
  const G = mk(101); const ids0 = new Map(G.bl.map(b => [b.id, b.k])); const ho0 = LT.totalHo(G);
  const o = appoint(G, 'xd'); const B0 = { tien: 120, go: 200, da: 100 };
  LT.dgSet(G, 'xd', { on: true, per: 'quy', budget: B0, pol: 'luong', tg: { ho: ho0 + 80, luong: 30000 }, reserve: 0 });
  placed.length = 0; let maxSpent = { tien: 0, go: 0, da: 0 }, over = false; const d = LT.dg(G).xd;
  for (let i = 0; i < 108; i++) { step(G); for (const k in B0) { maxSpent[k] = Math.max(maxSpent[k], d.spent[k]); if (d.spent[k] > B0[k] + 1e-9) over = true; } }
  ok(placed.length > 3, 'Quan xây dựng bật: đã đặt ' + placed.length + ' công trình/ô đường trong 3 năm (nhà ' + placed.filter(p => /house|terrace|mansion/.test(p.k)).length + ', ruộng ' + placed.filter(p => p.k === 'farm').length + ', đường ' + placed.filter(p => p.k === 'road').length + ')');
  ok(!over, 'Ngân sách mỗi quý không bị vượt (chi nhiều nhất trong một quý: ' + Math.round(maxSpent.tien) + '/' + B0.tien + ' quan, ' + Math.round(maxSpent.go) + '/' + B0.go + ' gỗ, ' + Math.round(maxSpent.da) + '/' + B0.da + ' đá)');
  const perSum = {}; for (const p of placed) { const s = perSum[p.per] || (perSum[p.per] = { tien: 0, go: 0, da: 0 }); for (const k in B0) s[k] += p.used[k]; }
  let overReal = false; for (const per in perSum) for (const k in B0) if (perSum[per][k] > B0[k] + 1e-6) overReal = true;
  ok(!overReal, 'Số tài nguyên THẬT bị trừ khi đặt (đo bằng kho) mỗi quý cũng không vượt ngân sách');
  ok(placed.every(p => p.err === '' && !p.opt.free && !p.opt.instant && p.ok), 'Mọi lần đặt đều qua LT.place của người chơi, hợp lệ theo luật đặt (địa hình, chi phí…), không đặt miễn phí/tức thì (' + placed.length + ' lần)');
  ok([...ids0].every(([id, k]) => { const b = G.bl.find(x => x.id === id); return b && b.k === k; }), 'Không công trình có sẵn nào bị quan phá hay đổi');
  ok(placed.every(p => G.bl.some(b => b.x === p.x && b.y === p.y && b.k === p.k)), 'Mọi công trình quan đặt đều có thật trên bản đồ');
  ok(d.log.length > 0 && d.log.some(l => l.k === 'ok' && /Tốn/.test(l.t)) , 'Nhật ký ghi quan làm gì, tốn bao nhiêu, vì sao: "' + (d.log.find(l => l.k === 'ok') || {}).t + '"');
  console.log('   lý do không làm được: ' + (d.log.filter(l => l.k === 'no').slice(0, 2).map(l => l.t).join(' | ') || '—'));
  // vùng cấm
  const G2 = mk(101); appoint(G2, 'xd'); LT.dgSet(G2, 'xd', { on: true, budget: { tien: 500, go: 800, da: 400 }, tg: { ho: LT.totalHo(G2) + 120, luong: 40000 }, reserve: 0 }); LT.dgNogo(G2, G2.hx + 1, G2.hy + 1, 14, true);
  placed.length = 0; for (let i = 0; i < 72; i++) step(G2); ok(placed.every(p => Math.abs(p.x - G2.hx - 1) > 14 || Math.abs(p.y - G2.hy - 1) > 14), 'Vùng cấm quanh phủ (bán kính 14): quan không đặt gì trong vùng (' + placed.length + ' lần đặt, đều ngoài vùng)');
}

console.log('--- 2. Công tắc và quyền can thiệp');
{
  const G = mk(102); appoint(G, 'xd'); LT.dgSet(G, 'xd', { on: true, budget: { tien: 400, go: 600, da: 300 }, tg: { ho: LT.totalHo(G) + 100, luong: 30000 }, reserve: 0 });
  placed.length = 0; for (let i = 0; i < 30; i++) step(G); const n1 = placed.length;
  LT.dgSet(G, 'xd', { on: false }); const n2 = placed.length; for (let i = 0; i < 18; i++) step(G);
  ok(n1 > 0 && placed.length === n2, 'Tắt công tắc: sau đó 18 tuần quan không đặt thêm gì (trước khi tắt đã đặt ' + n1 + ')');
  const mine = LT.place(G, 'house', G.hx + 8, G.hy + 8, { free: true, instant: true, defer: true });
  const before = G.bl.length; LT.dgSet(G, 'xd', { on: true }); for (let i = 0; i < 18; i++) step(G); ok(G.bl.some(b => b.x === G.hx + 8 && b.y === G.hy + 8) || !mine.ok, 'Xây tay song song: công trình người chơi đặt vẫn nguyên khi quan làm việc');
  ok(LT.dg(G).xd.log.some(l => l.k === 'sys' && /thu hồi/.test(l.t)), 'Nhật ký ghi lúc bạn thu hồi việc giao');
  const G3 = mk(103); LT.dgSet(G3, 'xd', { on: true, budget: { tien: 400, go: 600, da: 300 }, tg: { ho: LT.totalHo(G3) + 100 } }); placed.length = 0; for (let i = 0; i < 20; i++) step(G3);
  ok(placed.length === 0 && LT.dg(G3).xd.log.some(l => /chưa bổ nhiệm/.test(l.t)), 'Bật mà chưa bổ nhiệm quan: không làm gì và nhật ký nói rõ lý do');
}

console.log('--- 3. Năng lực quan quyết định chất lượng');
{
  const run = st => { const G = mk(104); appoint(G, 'xd', st); LT.dgSet(G, 'xd', { on: true, budget: { tien: 400, go: 600, da: 300 }, tg: { ho: LT.totalHo(G) + 150, luong: 30000 }, reserve: 0 }); placed.length = 0; for (let i = 0; i < 72; i++) step(G); return { n: placed.length, eff: LT.dgEff(G, 'xd'), skim: LT.dg(G).xd.stat.skim }; };
  const hi = run({ chinh: 95, tri: 90, liem: 95 }), lo = run({ chinh: 25, tri: 25, liem: 8 });
  ok(hi.eff > lo.eff + .4 && hi.n >= lo.n, 'Quan giỏi (hiệu năng ' + hi.eff.toFixed(2) + ') làm không ít việc hơn quan kém (' + lo.eff.toFixed(2) + '): ' + hi.n + ' so với ' + lo.n + ' lần đặt');
  ok(lo.skim > hi.skim, 'Quan tham bớt xén tiền (' + Math.round(lo.skim) + ' quan) nhiều hơn quan liêm (' + Math.round(hi.skim) + ')');
}

console.log('--- 4. Thành để quan lo 5 năm so với bỏ mặc');
{
  const base = mk(105, 2), auto = mk(105, 2);
  for (const G of [base, auto]) { G.res.tien = 900; G.H.luu = Math.max(G.H.luu, 40); }
  appoint(auto, 'xd'); appoint(auto, 'kt'); LT.dgSet(auto, 'xd', { on: true, budget: { tien: 250, go: 400, da: 250 }, per: 'quy', pol: 'dansinh', tg: { ho: 0, luong: 8000 }, reserve: 80 });
  LT.dgSet(auto, 'kt', { on: true, budget: { tien: 150 }, taxMin: 0, taxMax: 2 });
  let minDt = 100, minLuong = 1e9, minTien = 1e9; const homelessBase = [], homelessAuto = [];
  for (let i = 0; i < 180; i++) { step(base); step(auto); minDt = Math.min(minDt, auto.stat.dantam); minLuong = Math.min(minLuong, auto.res.luong, auto.dan.luong); minTien = Math.min(minTien, auto.res.tien); homelessBase.push(base.flags.homeless ? 1 : 0); homelessAuto.push(auto.flags.homeless ? 1 : 0); }
  const hb = LT.totalHo(base), ha = LT.totalHo(auto), nb = base.bl.length, na = auto.bl.length;
  console.log('   bỏ mặc: hộ ' + hb + ', công trình ' + nb + ', dân tâm ' + Math.round(base.stat.dantam) + ', tiền ' + Math.round(base.res.tien) + ', lương ' + Math.round(base.res.luong + base.dan.luong) + ', tuần hết chỗ ở ' + homelessBase.reduce((a, b) => a + b, 0));
  console.log('   có quan: hộ ' + ha + ', công trình ' + na + ', dân tâm ' + Math.round(auto.stat.dantam) + ', tiền ' + Math.round(auto.res.tien) + ', lương ' + Math.round(auto.res.luong + auto.dan.luong) + ', tuần hết chỗ ở ' + homelessAuto.reduce((a, b) => a + b, 0));
  ok(!base.over && !auto.over, 'Cả hai thành không sụp sau 5 năm (không kết thúc ván)');
  ok(minDt > 25 && minLuong >= 0 && minTien >= 0 && isFinite(auto.res.tien), 'Thành có quan: dân tâm thấp nhất ' + Math.round(minDt) + ', lương và tiền không bao giờ âm');
  ok(na > nb + 8 && ha > hb * 1.04, 'Thành có quan tốt hơn hẳn: ' + na + ' so với ' + nb + ' công trình, ' + ha + ' so với ' + hb + ' hộ');
}

console.log('--- 5. Quan kinh tế, quân sự, tổng quản');
{
  const G = mk(106); G.bl.push({ id: G.nextId++, k: 'market', x: G.hx + 6, y: G.hy + 9, building: false, progress: 1 }); LT.recalcCity(G); appoint(G, 'kt');
  G.pol.tax = 3; LT.dgSet(G, 'kt', { on: true, budget: { tien: 300 }, taxMin: 0, taxMax: 1, reserve: 0 }); let tmax = 0; for (let i = 0; i < 36; i++) { step(G); tmax = Math.max(tmax, G.pol.tax); }
  ok(G.pol.tax <= 1 && LT.dg(G).kt.log.some(l => /Chỉnh thuế/.test(l.t)), 'Quan kinh tế kéo thuế về khoảng cho phép (≤ ' + LT.TAX_LEVELS[1].n + '), không vượt trần: thuế hiện ' + LT.TAX_LEVELS[G.pol.tax].n);
  G.dan.luong = 5; G.res.luong = 5; G.res.tien = 800; const kt = LT.dg(G).kt, b0 = kt.stat.bought; let mxK = 0; for (let i = 0; i < 12; i++) { LT.tickWeek(G); calm(G); mxK = Math.max(mxK, kt.spent.tien); }
  ok(kt.stat.bought > b0 && mxK <= 300 + 1e-6, 'Quan kinh tế mua lương khi thiếu nhưng không vượt ngân sách (chi nhiều nhất ' + Math.round(mxK) + '/300 quan, mua thêm ' + (kt.stat.bought - b0) + ' thạch)');
  const H = mk(107); H.bl.push({ id: H.nextId++, k: 'barracks', x: H.hx + 8, y: H.hy + 9, building: false, progress: 1 }); LT.recalcCity(H); H.res.tien = 3000; H.res.binhkhi = 500; H.res.go = 800; H.H.luu = 120; H.H.nong = 200; appoint(H, 'qs');
  LT.dgSet(H, 'qs', { on: true, budget: { tien: 400 }, tg: { quan: 600 }, mix: { truongthuong: 60, cung: 40 }, reserve: 0 }); const a0 = LT.armyCount(H), qs = LT.dg(H).qs; let mxQ = 0; for (let i = 0; i < 54; i++) { step(H); mxQ = Math.max(mxQ, qs.spent.tien); }
   ok(LT.armyCount(H) > a0 && LT.armyCount(H) <= 600 && mxQ <= 400 + 1e-6 && qs.stat.recruited > 0, 'Quan quân sự mộ quân tới mục tiêu trong ngân sách: quân ' + a0 + ' → ' + LT.armyCount(H) + ' (mục tiêu 600), chi nhiều nhất một quý ' + Math.round(mxQ) + '/400 quan');
  ok(H.units.some(u => u.type === 'cung') && H.units.some(u => u.type === 'truongthuong'), 'Theo đúng cơ cấu binh chủng đặt (trường thương và cung)');
  const T = mk(108); LT.tickWeek(T); calm(T); const cs = LT.ownedCities(T); LT.offDismiss(T, cs[0].quan); const idle = LT.offGen(T, 'khoacu'); idle.id = LT.off(T).nextId++; idle.home = null; LT.off(T).list.push(idle); appoint(T, 'tt');
  LT.dgSet(T, 'tt', { on: true, budget: { tien: 200 } }); for (let i = 0; i < 20; i++) { LT.tickWeek(T); calm(T); }
  ok(cs[0].quan === idle.id && LT.dg(T).tt.log.some(l => /Bổ nhiệm/.test(l.t)), 'Tổng quản tự điền chức khuyết bằng người rảnh và ghi nhật ký');
}

console.log('--- 6. Mặc định tắt: ván không bật gì chạy y như trước');
{
  const A = mk(109), Bg = mk(109); LT.dg(Bg); LT.dgSet(Bg, 'xd', { budget: { tien: 300, go: 300, da: 300 }, pol: 'quanbi' }); LT.dgSet(Bg, 'kt', { taxMax: 3 }); LT.dgNogo(Bg, 60, 60, 3, true);
  const strip = G => { const o = JSON.parse(LT.serialize(G)); delete o.era; if (o.off) delete o.off.dg; return JSON.stringify(o); };
  for (let i = 0; i < 120; i++) { step(A); step(Bg); }
  ok(strip(A) === strip(Bg), 'Hai ván cùng hạt giống, một ván có điền sẵn cấu hình ủy quyền nhưng TẮT: sau 120 tuần trạng thái giống hệt (' + Math.round(strip(A).length / 1024) + ' KB)');
  ok(!LT.dgAny(A) && !LT.dgAny(Bg), 'Không ván nào có ủy quyền đang bật');
}

console.log('--- 7. Bản lưu v8 thật (tạo bằng mã commit 8bddbc6) tải và chơi tiếp');
{
  const txt = fs.readFileSync(path.join(__dirname, 'fixtures', 'save-v8.json'), 'utf8'), raw = JSON.parse(txt);
  ok(raw.ver === 8 && !(raw.off && raw.off.dg), 'Tệp thử là bản lưu phiên bản 8, chưa có trường ủy quyền');
  let G, err = ''; try { G = LT.deserialize(txt); } catch (e) { err = e.message; }
  ok(G && !err, 'Bản lưu v8 được tải, không bị từ chối' + (err ? ': ' + err : ''));
  const D = LT.dg(G); ok(['xd', 'kt', 'qs', 'tt'].every(r => D[r].on === false) && Array.isArray(D.nogo), 'Mọi ủy quyền được điền mặc định TẮT');
  const y0 = G.year; let bad = ''; try { for (let i = 0; i < 60; i++) step(G); } catch (e) { bad = e.message; }
  ok(!bad && (G.year > y0 || G.week > 1) && G.res.tien >= 0 && isFinite(G.res.tien), 'Chơi tiếp 60 tuần trên bản lưu v8 không lỗi (năm ' + y0 + ' → ' + G.year + ')');
  appoint(G, 'xd'); LT.dgSet(G, 'xd', { on: true, budget: { tien: 200, go: 300, da: 200 }, tg: { ho: LT.totalHo(G) + 80 } }); placed.length = 0; let bad2 = ''; try { for (let i = 0; i < 40; i++) step(G); } catch (e) { bad2 = e.message; }
  ok(!bad2, 'Bật quan xây dựng trên bản lưu v8 rồi chơi 40 tuần không lỗi (' + placed.length + ' lần đặt)');
  const again = LT.deserialize(LT.serialize(G)); ok(JSON.stringify(again.off.dg.xd.budget) === JSON.stringify(G.off.dg.xd.budget) && again.off.dg.xd.on === true && again.off.dg.xd.log.length === G.off.dg.xd.log.length, 'Lưu rồi tải lại giữ nguyên cấu hình ủy quyền và nhật ký');
  let thrown = ''; try { LT.deserialize(JSON.stringify(Object.assign(JSON.parse(txt), { ver: 7 }))); } catch (e) { thrown = e.message; } ok(/phiên bản lưu 7/.test(thrown), 'Bản lưu cũ hơn 8 vẫn bị từ chối rõ ràng: "' + thrown + '"');
}
console.log(fails ? '\n' + fails + ' KIỂM THỬ HỎNG' : '\nTẤT CẢ ĐẠT');
process.exit(fails ? 1 : 0);

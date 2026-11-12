// Giai đoạn 5: lịch sử biểu đồ, bản lưu v11 (8/9/10 → 11), tự đồn trú, cảnh báo thành sắp nổi loạn, hãm phục quốc, bot nhiều hướng, không còn confirm/alert.
const path = require('path'), fs = require('fs'), cp = require('child_process');
for (const f of ['data', 'city', 'chunks', 'economy', 'game', 'battle', 'politics', 'war', 'events', 'world', 'wcities', 'campaign', 'trade', 'officials', 'automgmt', 'power', 'ai']) require(path.join(__dirname, '..', 'js', f + '.js'));
const LT = globalThis.LT; let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL  ' + m); } else console.log('  ok    ' + m); };
const calm = G => { G.pendingEvent = null; G.pendingBattle = null; G.raid = null; G.pendingKhao = null; G.pendingPromo = null; G.pendingNotice = null; };
const advance = G => { for (const b of G.bl) if (b.building) { b.progress = 1; b.building = false; b.born = -9; } };

console.log('--- 1. Lịch sử biểu đồ: ghi mỗi quý, có trần, nằm trong bản lưu');
{
  const G = LT.newGame(3, 'Sử', 5); G.rank = 2; G.res.tien = 2000;
  ok(G.hist && Array.isArray(G.hist.q) && G.hist.q.length === 0, 'Ván mới có G.hist rỗng');
  for (let i = 0; i < 36 * 3; i++) { LT.tickWeek(G); calm(G); advance(G); }
  const n3 = G.hist.q.length; ok(n3 === 12 || n3 === 13, 'Ba năm ghi ' + n3 + ' điểm (mỗi quý một điểm, kỳ vọng 12)');
  const r = G.hist.q[G.hist.q.length - 1]; ok(r.length === 9 && r.every(x => isFinite(x)) && r[1] > 0 && r[2] >= 0, 'Mỗi điểm đủ 9 số hữu hạn: hộ ' + r[1] + ', tiền ' + r[2] + ', lương ' + r[3] + ', quân ' + r[4] + ', thế lực ' + r[5] + '/' + r[6] + '/' + r[7] + ', thành ' + r[8]);
  const ticks = G.hist.q.map(x => x[0]); ok(ticks.every((t, i) => i === 0 || t - ticks[i - 1] === 9), 'Các điểm cách nhau đúng 9 tuần');
  // trần: chạy rất lâu
  const S = LT.newGame(3, 'Dài', 6); S.rank = 1; for (let k = 0; k < 9 * (LT.HIST_MAX + 60); k++) { S.tick = k; if (k % 9 === 0) LT.histRecord(S); }
  ok(S.hist.q.length === LT.HIST_MAX && S.hist.q[0][0] === 9 * 60, 'Trần ' + LT.HIST_MAX + ' điểm: điểm cũ nhất bị bỏ (' + S.hist.q[0][0] + ')');
  const txt = LT.serialize(S); ok(txt.length < 300000 && JSON.parse(txt).hist.q.length === LT.HIST_MAX, 'Lưu giữ nguyên lịch sử, cỡ bản lưu ' + Math.round(txt.length / 1024) + ' KB (chấp nhận được)');
  const back = LT.deserialize(LT.serialize(G)); ok(back.hist.q.length === G.hist.q.length && back.ver === LT.SAVE_VER && back.ver === 11, 'Lưu rồi tải lại giữ ' + back.hist.q.length + ' điểm, phiên bản ' + back.ver);
}

console.log('--- 2. Chuyển bản lưu 8 → 11, 9 → 11, 10 → 11');
{
  for (const v of [8, 9, 10]) {
    const txt = fs.readFileSync(path.join(__dirname, 'fixtures', 'save-v' + v + '.json'), 'utf8'), raw = JSON.parse(txt);
    let G, err = ''; try { G = LT.deserialize(txt); } catch (e) { err = e.message; }
    ok(raw.ver === v && G && !err && G.ver === 11, 'Bản v' + v + ' thật tải được và lên v11' + (err ? ': ' + err : ''));
    if (!G) continue;
    ok(G.rank === raw.rank && LT.armyCount(G) === raw.units.reduce((a, u) => a + u.n, 0) && LT.mineCount(G) === raw.world.cities.filter(c => c.mine).length && G.year === raw.year, 'v' + v + ' → 11 giữ chức ' + LT.RANKS[G.rank].n + ', quân ' + LT.armyCount(G) + ', ' + LT.mineCount(G) + ' thành');
    if (raw.pw) ok(JSON.stringify(Object.keys(G.pw.ach).sort()) === JSON.stringify(Object.keys(raw.pw.ach).sort()), 'v' + v + ' → 11 giữ thành tựu ' + Object.keys(G.pw.ach).join(','));
    ok(G.hist && Array.isArray(G.hist.q) && G.world.ai && G.world.ai.n.length === 12, 'v' + v + ' → 11 có G.hist và sổ AI');
    let bad = ''; try { for (let i = 0; i < 60; i++) { LT.tickWeek(G); calm(G); advance(G); } } catch (e) { bad = e.message; } ok(!bad && G.hist.q.length >= 6, 'Chơi tiếp 60 tuần không lỗi, lịch sử bắt đầu ghi (' + G.hist.q.length + ' điểm)');
  }
  const v7 = Object.assign(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'save-v8.json'), 'utf8')), { ver: 7 }); let thrown = ''; try { LT.deserialize(JSON.stringify(v7)); } catch (e) { thrown = e.message; } ok(/phiên bản lưu 7/.test(thrown), 'Bản < 8 vẫn bị từ chối rõ ràng');
}

console.log('--- 3. Tự đồn trú thành mới chiếm (công tắc của Tổng quản) và cảnh báo');
{
  const mk = seed => { const G = LT.newGame(3, 'Đồn', seed); G.rank = 3; LT.grantCities(G, 3, 1, 2); G.res.tien = 6000; G.res.luong = 3000; for (const c of G.world.cities) if (c.mine) c.grain = 3000; G.units = [{ id: 1, type: 'truongthuong', n: 3000, hl: 55, sk: 70, tb: 2, tan: 0 }, { id: 2, type: 'cung', n: 3000, hl: 55, sk: 70, tb: 2, tan: 0 }]; G.nextId = 10; LT.ensureFormation(G); return G; };
  const grab = (G, n) => { const out = []; for (const c of G.world.cities) { if (out.length >= n) break; if (!c.mine && c.own !== G.nation && c.own < 12 && c.lvl <= 2 && G.world.ns[c.own].cities > 3 && !c.capital && out.every(p => p[1] !== c.own)) { const old = c.own; LT.captureCity(G, c, 'thử'); out.push([c, old]); } } return out; };
  const run = auto => {
    const G = mk(61), caps = grab(G, 3); const O = LT.off(G), dg = LT.dg(G);
    if (auto) { const o = LT.offGen(G, 'khoacu'); o.id = O.nextId++; O.list.push(o); LT.offAppoint(G, o.id, { t: 'seat', role: LT.DG_ROLES.tt.seat }); const r = LT.dgSet(G, 'tt', { on: true, garrison: true, budget: { tien: 3000 }, reserve: 100, fill: false, rotate: false, inspect: false }); if (!r.ok) console.log('   dgSet:', r.err); }
    for (let i = 0; i < 36 * 3; i++) { for (const [c] of caps) if (c.mine && !auto) { c.gar = Math.min(c.gar, 0); c.nop = .8; } LT.tickWeek(G); calm(G); advance(G); G.res.tien = Math.max(G.res.tien, 2500); }
    return { G, caps, mineLeft: caps.filter(([c]) => c.mine).length, gar: caps.map(([c]) => c.gar), stat: dg.tt.stat.garrisoned };
  };
  const A = run(false), B = run(true);
  ok(A.mineLeft <= 1, 'Không đồn trú, thuế nặng: chỉ còn ' + A.mineLeft + '/3 thành sau 3 năm');
  ok(B.mineLeft === 3 && B.stat > 0, 'Bật "Tự đồn trú": giữ ' + B.mineLeft + '/3 thành, đã đặt ' + B.stat + ' quân; đồn trú ' + B.gar.join('/'));
  const G = mk(62), caps = grab(G, 1); caps[0][0].gar = 0; caps[0][0].qt = 30; const al = LT.alerts(G).filter(a => /sắp nổi loạn/.test(a.t));
  ok(al.length === 1 && al[0].l === 2 && /Đặt đồn trú/.test(al[0].t), 'Cảnh báo "Việc cần chú ý": ' + (al[0] ? al[0].t : 'không có'));
  caps[0][0].gar = Math.round(caps[0][0].ho * .05); ok(!LT.alerts(G).some(a => /sắp nổi loạn/.test(a.t)), 'Đủ đồn trú thì hết cảnh báo');
  const store = { ...LT.dg(G).tt }; ok('garrison' in store && store.garrison === false, 'Mặc định tắt (bản lưu cũ tự điền garrison=false)');
}

console.log('--- 4. Hãm phục quốc');
{
  let total = 0, per = [];
  for (const [nat, seed] of [[3, 11], [7, 22], [1, 33]]) { const G = LT.newGame(nat, 'PQ', seed); G.rank = 1; for (let k = 0; k < 60 * 36; k++) { LT.worldWeek(G); calm(G); G.tick++; G.week++; if (G.week > 36) { G.week = 1; G.year++; } } per.push(G.world.ai.stat.restore); total += G.world.ai.stat.restore; }
  ok(Math.max(...per) <= 12, 'Phục quốc trong 60 năm mỗi thế giới: ' + per.join('/') + ' (≤ 12, trước đây tới 20+)');
}

console.log('--- 5. Bot nhiều hướng chạy trọn 12 năm không lỗi (bot ván dài đến 960: xem báo cáo)');
{
  const t0 = Date.now(); const res = {};
  for (const st of ['climb', 'van', 'chinh', 'cat', 'conquer', 'trade']) {
    const r = cp.spawnSync(process.execPath, [path.join(__dirname, 'bot.test.js'), '12', '7', '78'], { env: Object.assign({}, process.env, { STYLE: st }), encoding: 'utf8', timeout: 240000 });
    const out = (r.stdout || '') + (r.stderr || ''); res[st] = /KẾT QUẢ STYLE=/.test(out) && r.status === 0 && !/LỖI|Error/.test(out);
    ok(res[st], 'Bot "' + st + '" chạy 12 năm: ' + ((out.match(/Kết thúc năm (\d+)[^|]*\| hạng (\d)/) || []).slice(1).join(' / hạng ') || out.slice(0, 120)));
  }
  console.log('   (' + (Date.now() - t0) + ' ms)');
}

console.log('--- 6. Không còn confirm()/alert() gốc, các hộp thoại dùng ask()');
{
  const dir = path.join(__dirname, '..', 'js'); let bad = [];
  for (const f of fs.readdirSync(dir)) { const s = fs.readFileSync(path.join(dir, f), 'utf8').replace(/\/\/.*$/gm, ''); if (/(^|[^.\w])(confirm|alert|prompt)\s*\(/.test(s)) bad.push(f); }
  ok(!bad.length, 'Không file nào gọi confirm/alert/prompt gốc' + (bad.length ? ': ' + bad.join(',') : ''));
  const ui = fs.readFileSync(path.join(dir, 'ui.js'), 'utf8'), pn = fs.readFileSync(path.join(dir, 'ui-panels.js'), 'utf8'); ok(/function ask\(/.test(ui) && /ask\('Dời trị sở/.test(pn), 'Dời trị sở dùng hộp thoại ask() trong game');
}

console.log(fails ? '\n' + fails + ' KIỂM THỬ HỎNG' : '\nTẤT CẢ ĐẠT');
process.exit(fails ? 1 : 0);

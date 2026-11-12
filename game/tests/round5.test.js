// Vòng 5: bản đồ 110×110, giao thương (chợ, thương đội), quan viên tự quản, lưu/tải.
const path = require('path');
for (const f of ['data', 'city', 'economy', 'game', 'battle', 'politics', 'war', 'events', 'world', 'wcities', 'campaign', 'trade', 'officials', 'automgmt']) require(path.join(__dirname, '..', 'js', f + '.js'));
const LT = globalThis.LT; let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL  ' + m); } else console.log('  ok    ' + m); };
const calm = G => { G.pendingEvent = null; G.pendingBattle = null; G.raid = null; G.pendingKhao = null; G.pendingPromo = null; G.pendingNotice = null; };
const peace = G => { for (let i = 0; i < 13; i++) G.world.rel[i] = Math.max(10, G.world.rel[i]); };

console.log('--- 1. Bản đồ 110×110');
{
  ok(LT.N === 110, 'Lưới 110×110 (' + LT.N + ')');
  let bad = 0, total = 0, worst = 0, minF = 1e9;
  for (let n = 0; n < 12; n++) for (let sn = 0; sn < 4; sn++) {
    const G = LT.newGame(n, 'Đ', 50 + n); G.seatNo = sn; LT.genMap(G, n); total++;
    const c = {}; for (const q of G.map) c[q.t] = (c[q.t] || 0) + 1; let best = 1e9; for (let i = 0; i < G.map.length; i++) if (G.map[i].t === 'm') best = Math.min(best, Math.hypot(i % LT.N - G.hx, Math.floor(i / LT.N) - G.hy));
    const pl = LT.placeableTiles(G, 'mine'); worst = Math.max(worst, best); minF = Math.min(minF, c.f || 0);
    if (G.map.length !== 110 * 110 || !c.m || best > 24 || !pl.length || (c.f || 0) < 800 || (c.r || 0) < 60 || (c.h || 0) < 120) { bad++; console.log('   nước ' + n + '#' + sn + ' ' + JSON.stringify(c) + ' quặng gần nhất ' + best); }
  }
  ok(bad === 0, total + ' bản đồ: đủ rừng/đá/đồi/quặng, mỏ sắt đặt được; mạch quặng gần nhất xa nhất ' + worst.toFixed(1) + ' ô; rừng ít nhất ' + minF);
  const G = LT.newGame(7, 'Dời', 5); G.rank = 3; LT.grantCities(G, 3, 1, 2); const o = LT.relocateOptions(G)[0]; const r = LT.relocate(G, o.id);
  const c = {}; for (const q of G.map) c[q.t] = (c[q.t] || 0) + 1; ok(r.ok && c.m > 0 && c.f > 800 && LT.placeableTiles(G, 'mine').length > 0 && G.map.length === 12100, 'Sau khi dời trị sở: lưới 110×110, quặng ' + c.m + ', rừng ' + c.f + ', mỏ sắt đặt được');
  ok(G.hx === 55 && G.hy === 55 && G.map[G.hy * LT.N + G.hx].b && G.map[G.hy * LT.N + G.hx].b.k === 'hall', 'Phủ đặt chính giữa bản đồ mới');
}

console.log('--- 2. Mua bán ở chợ');
{
  const G = LT.newGame(3, 'Chợ', 7); G.rank = 2; G.res.tien = 20000; G.wealth = 5000; G.bl.push({ k: 'market', x: 3, y: 3, building: false, progress: 1 }); LT.updatePrices(G);
  const T = LT.t2(G), k = 'tra', base = LT.localBase(G, k), p0 = LT.localPrice(G, k);
  const buy = LT.marketTrade(G, k, 30, 'buy'); ok(buy.ok && LT.localPrice(G, k) > p0, 'Mua 30 trà: giá chợ nhích lên ' + p0.toFixed(2) + ' → ' + LT.localPrice(G, k).toFixed(2));
  G.tick++; const wl = G.wealth, tien = G.res.tien; const p1 = LT.localPrice(G, k); const sell = LT.marketTrade(G, k, 25, 'sell'); ok(sell.ok && LT.localPrice(G, k) < p1 && G.res.tien > tien && G.wealth < wl, 'Bán 25 trà: giá tụt, tiền vào kho quan, tiền lưu thông trong dân giảm');
  ok(LT.marketQuote(G, k, 'buy') > LT.marketQuote(G, k, 'sell'), 'Giá mua cao hơn giá bán (chênh ' + (LT.marketQuote(G, k, 'buy') - LT.marketQuote(G, k, 'sell')).toFixed(2) + ')');
  let mx = 0, mn = 9, n = 0; G.res.tien = 1e7; G.res.da = 1e6; for (let i = 0; i < 300; i++) { G.tick++; G.res[k] = 0; LT.marketTrade(G, k, 30, 'buy'); mx = Math.max(mx, LT.localPrice(G, k) / base); n++; }
  for (let i = 0; i < 300; i++) { G.tick++; G.wealth = 1e7; G.res[k] = 9999; LT.marketTrade(G, k, 30, 'sell'); mn = Math.min(mn, LT.localPrice(G, k) / base); }
  ok(mx <= 2.5001 && mn >= .3999, 'Mua/bán dồn dập: giá luôn trong 0,4–2,5 lần giá gốc (cao nhất ×' + mx.toFixed(2) + ', thấp nhất ×' + mn.toFixed(2) + ')');
  G.wealth = 20; G.res[k] = 500; G.tick += 50; const hoang = LT.marketTrade(G, k, 50, 'sell'); ok(!hoang.ok && /Tiền hoang/.test(hoang.err), 'Tiền hoang chặn bán: "' + hoang.err + '"');
  const G2 = LT.newGame(3, 'x', 8); const nm = LT.marketTrade(G2, 'tra', 10, 'buy'); ok(!nm.ok, 'Chưa có chợ thì không mua bán trực tiếp được');
}

console.log('--- 3. Thương đội đi trọn vòng, lãi khớp công thức');
{
  const G = LT.newGame(3, 'Đội', 11); G.rank = 3; peace(G); G.res.tien = 5000; G.res.tra = 400; G.res.ngua = 0; LT.updatePrices(G); const T = LT.t2(G); T.noRisk = true;
  const opt = { give: 'tra', qty: 240, destKind: 'nat', dest: 1, back: '', sea: false, escort: false };
  const q = LT.caravanQuote(G, opt); ok(q.ok && q.profit > 0, 'Báo giá tuyến trà → Tấn: lãi dự kiến ' + Math.round(q.profit) + ' quan, ' + q.W + ' tuần đi (' + (q.err || '') + ')');
  const t0 = G.res.tien, r0 = G.res.tra; const r = LT.sendCaravan(G, opt); ok(r.ok && G.res.tra === r0 - q.qty && G.res.tien === t0 - q.upfront, 'Gửi: kho trừ hàng, tiền trừ công phu xe ' + Math.round(q.upfront));
  let wk = 0; while (T.caravans.length && wk < 80) { LT.tradeWeek(G); G.tick++; wk++; }
  const h = T.hist[0]; ok(h && h.status === 'ok' && wk === 2 * q.W, 'Thương đội về sau ' + wk + ' tuần (= 2 × ' + q.W + ')');
  ok(Math.abs(h.profit - q.profit) < .01, 'Lãi thực ' + h.profit.toFixed(2) + ' = lãi báo giá ' + q.profit.toFixed(2) + ' (= bán − thuế − vốn − công phu)');
  const formula = q.qAfter * q.sellEff - q.qAfter * q.sellEff * LT.TRU_THUE - q.toll - q.qty * q.buyP - q.cong - q.escort;
  ok(Math.abs(formula - h.profit) < .01, 'Khớp công thức: (giá bán × số hàng sau hao − trú thuế − thuế quá cảnh) − giá mua × số hàng − công phu xe = ' + formula.toFixed(2));
  ok(Math.abs((G.res.tien - (t0 - q.upfront)) - q.net) < .01, 'Tiền thu về đúng phần bán ròng sau thuế (' + Math.round(q.net) + ')');
  // đổi hàng chiều về: trà đổi ngựa
  const G2 = LT.newGame(3, 'Ngựa', 12); G2.rank = 3; peace(G2); G2.res.tien = 5000; G2.res.tra = 400; LT.updatePrices(G2); LT.t2(G2).noRisk = true;
  const o2 = { give: 'tra', qty: 240, destKind: 'nat', dest: 1, back: 'ngua', sea: false, escort: false }, q2 = LT.caravanQuote(G2, o2);
  LT.sendCaravan(G2, o2); let w2 = 0; while (LT.t2(G2).caravans.length && w2 < 80) { LT.tradeWeek(G2); G2.tick++; w2++; }
  ok(q2.backQty > 0 && G2.res.ngua === q2.backQty, 'Trà đổi ngựa: mang về ' + G2.res.ngua + ' ngựa (báo giá ' + q2.backQty + ')');
  // chiến tranh / cấm vận cắt tuyến
  const G3 = LT.newGame(3, 'Cắt', 13); G3.rank = 3; peace(G3); G3.res.tien = 5000; G3.res.tra = 400; const T3 = LT.t2(G3); T3.noRisk = false; LT.sendCaravan(G3, { give: 'tra', qty: 120, destKind: 'nat', dest: 1, back: '', sea: false, escort: false });
  G3.world.rel[1] = -80; for (let i = 0; i < 40 && T3.caravans.length; i++) { LT.tradeWeek(G3); G3.tick++; }
  ok(T3.hist[0] && T3.hist[0].status === 'cut', 'Cấm vận giữa đường cắt tuyến, thương đội quay về (lãi ' + (T3.hist[0] ? Math.round(T3.hist[0].profit) : '?') + ')');
  const bq = LT.caravanQuote(G3, { give: 'tra', qty: 120, destKind: 'nat', dest: 1 }); ok(!bq.ok && /cấm vận|xấu|cắt/i.test(bq.err), 'Không cho lập tuyến tới nước đang cấm vận: ' + bq.err);
  // hải thương cần cảng; rủi ro
  const G4 = LT.newGame(5, 'Hải', 14); G4.rank = 3; peace(G4); G4.res.tien = 5000; G4.res.gom = 300; LT.updatePrices(G4); const sq = LT.caravanQuote(G4, { give: 'gom', qty: 120, destKind: 'nat', dest: 8, sea: true });
  ok(!sq.ok && /Bến cảng/.test(sq.err), 'Hải thương cần Bến cảng: ' + sq.err);
  G4.bl.push({ k: 'port', x: 2, y: 2, building: false, progress: 1 }); const sq2 = LT.caravanQuote(G4, { give: 'gom', qty: 120, destKind: 'nat', dest: 8, sea: true }); ok(sq2.ok && sq2.sea, 'Có cảng: báo giá hải thương ' + sq2.W + ' tuần, lãi ' + Math.round(sq2.profit) + ' quan');
  let lost = 0, runs = 40; for (let s = 0; s < runs; s++) { const H = LT.newGame(5, 'h', 100 + s); H.rank = 3; peace(H); H.res.tien = 5000; H.res.gom = 300; H.bl.push({ k: 'port', x: 2, y: 2, building: false, progress: 1 }); LT.sendCaravan(H, { give: 'gom', qty: 120, destKind: 'nat', dest: 8, sea: true }); for (let i = 0; i < 40 && LT.t2(H).caravans.length; i++) { LT.tradeWeek(H); H.tick++; } if (LT.t2(H).hist[0] && LT.t2(H).hist[0].lost > 0) lost++; }
  console.log('  (hải thương: ' + lost + '/' + runs + ' chuyến bị bão hoặc hải tặc)'); ok(lost > 0 && lost < runs, 'Hải thương có rủi ro bão/hải tặc nhưng không chuyến nào cũng mất');
  // đặc sản: chênh giá thật giữa các nước
  const dg = LT.priceAt(G, 'nat', 1, 'ngua'), dt = LT.priceAt(G, 'nat', 3, 'ngua'); ok(dg < dt, 'Ngựa rẻ ở nơi dư (Tấn ' + dg.toFixed(1) + ') đắt ở nơi thiếu (Thục ' + dt.toFixed(1) + ')');
  // thuế quá cảnh: đặt cao thì dòng hàng né
  const G5 = LT.newGame(9, 'Thuế', 15); G5.bl.push({ k: 'market', x: 3, y: 3, building: false }, { k: 'market', x: 4, y: 3, building: false }, { k: 'inn', x: 5, y: 3, building: false }); const t5 = LT.t2(G5), inc = r => { t5.transit = r; return LT.transitIncome(G5); };
  const i2 = inc(.02), i4 = inc(.04), i8 = inc(.08), i0 = inc(0); ok(i4 > i2 && i8 < i4 && i0 === 0, 'Thuế quá cảnh: 0% → ' + i0.toFixed(1) + ', 2% → ' + i2.toFixed(1) + ', 4% → ' + i4.toFixed(1) + ', 8% → ' + i8.toFixed(1) + ' quan/tuần (đặt quá cao thì thương đội né)');
  // thương lộ nội bộ
  const G6 = LT.newGame(7, 'Nội', 16); G6.rank = 3; LT.grantCities(G6, 3, 1, 2); const own = LT.ownedCities(G6); own[0].grain = 5000; own[1].grain = 100; G6.res.tien = 500; const g0 = own[0].grain, g1 = own[1].grain, ri = LT.internalShip(G6, own[0].id, own[1].id, 1000);
  ok(ri.ok && own[0].grain === g0 - 1000 && own[1].grain > g1 && own[1].grain - g1 < 1000, 'Điều lương nội bộ: thành đi −1000, thành đến +' + Math.round(own[1].grain - g1) + ' (hao theo ' + ri.hop + ' chặng)');
}

console.log('--- 4. Quan viên tự quản');
{
  const mk = (seed, chinh) => { const G = LT.newGame(7, 'Quan', seed); G.rank = 3; LT.grantCities(G, 3, 1, 2); peace(G); for (let i = 0; i < 2; i++) { LT.offWeek(G); } G.res.tien = 1e6; G.res.luong = 1e6; G.dan.luong = 1e6; for (const c of LT.ownedCities(G)) { const o = LT.offById(G, c.quan); o.chinh = chinh; o.tri = chinh; o.liem = 80; o.trung = 80; o.da = 20; o.home = null; o.tong = 50; o.vo = 50; c.pc = 'nong'; c.automo = false; } return G; };
  const run = G => { for (let i = 0; i < 36 * 5; i++) { G.res.tien = Math.max(G.res.tien, 1e6); G.res.luong = Math.max(G.res.luong, 1e6); G.dan.luong = Math.max(G.dan.luong, 1e6); LT.tickWeek(G); calm(G); G.units = []; if (G.over) break; } const cs = LT.ownedCities(G).filter(c => c.mine); let ho = 0, dt = 0, last = 0; for (const c of cs) { ho += c.ho / (c.base || c.ho); dt += c.dt; last += c.last || 0; } return { ho: ho / Math.max(1, cs.length), dt: dt / Math.max(1, cs.length), last: last / Math.max(1, cs.length), n: cs.length }; };
  let wins = 0, sumHi = 0, sumLo = 0, dtHi = 0, dtLo = 0; const S = 6;
  for (let s = 0; s < S; s++) { const hi = run(mk(200 + s, 90)), lo = run(mk(200 + s, 22)); if (hi.ho + hi.dt / 100 > lo.ho + lo.dt / 100) wins++; sumHi += hi.ho; sumLo += lo.ho; dtHi += hi.dt; dtLo += lo.dt; }
  ok(wins >= 5 && sumHi > sumLo && dtHi > dtLo, 'Quan Chính cao cho thành tốt hơn quan Chính thấp trong cùng điều kiện: thắng ' + wins + '/' + S + ' hạt giống; dân/gốc ' + (sumHi / S).toFixed(2) + ' vs ' + (sumLo / S).toFixed(2) + '; dân tâm ' + (dtHi / S).toFixed(1) + ' vs ' + (dtLo / S).toFixed(1));
  // tham ô: quan tham ăn bớt thuế (nộp về ít hơn), thanh tra thu hồi
  const gc = (lie) => { const G = mk(300, 60); const c = LT.ownedCities(G)[0], o = LT.offById(G, c.quan); o.liem = lie; c.tamo = .02; let tot = 0; for (let i = 0; i < 36 * 3; i++) { G.res.tien = 1e6; LT.tickWeek(G); calm(G); G.units = []; } return { c, o, G }; };
  const clean = gc(95), greedy = gc(5); ok(greedy.c.tamo > clean.c.tamo + .08 && greedy.o.hoard > clean.o.hoard, 'Quan tham ăn bớt thuế: tham ô ' + Math.round(greedy.c.tamo * 100) + '% (quan liêm ' + Math.round(clean.c.tamo * 100) + '%), tiền ăn bớt ' + Math.round(greedy.o.hoard) + ' quan');
  const before = greedy.G.res.tien, ins = LT.inspectCity(greedy.G, greedy.c.id); ok(ins.ok && greedy.o.known && greedy.G.res.tien > before - 30, 'Ngự sử thanh tra lộ mức liêm và thu hồi tiền: ' + ins.text.trim());
  // dã tâm cao, trung thành thấp, ở xa lâu, cầm quân: tự chủ tăng tới ly khai
  const rebel = (da, trung) => { const G = LT.newGame(7, 'Phản', 400); G.rank = 3; LT.grantCities(G, 3, 1, 2); peace(G); LT.offWeek(G); const c = LT.ownedCities(G).sort((a, b) => b.dist - a.dist)[0], o = LT.offById(G, c.quan); o.da = da; o.trung = trung; o.liem = 30; o.home = null; c.binh = 800; c.nop = .8; let wk = 0, maxAuto = 0; while (c.mine && wk < 36 * 40) { G.res.tien = 1e6; G.res.luong = 1e6; G.dan.luong = 1e6; if (wk % 30 === 0) o.trung = Math.min(o.trung, trung); LT.tickWeek(G); calm(G); G.units = []; if (G.over) break; maxAuto = Math.max(maxAuto, c.auto); wk++; } return { left: !c.mine, wk, maxAuto, c, o, G }; };
  const bad = rebel(95, 15), good = rebel(10, 90);
  ok(bad.left && bad.maxAuto > 85, 'Quan dã tâm 95, trung 15, cầm quân ở xa: tự chủ lên ' + Math.round(bad.maxAuto) + ' rồi ly khai sau ' + (bad.wk / 36).toFixed(1) + ' năm');
  ok(!good.left || good.wk > bad.wk, 'Quan dã tâm thấp, trung thành cao ở thành khác: không ly khai sớm (tự chủ cao nhất ' + Math.round(good.maxAuto) + ', ' + (good.left ? 'ly khai sau ' + (good.wk / 36).toFixed(1) + ' năm' : 'giữ trọn ' + (good.wk / 36).toFixed(0) + ' năm') + ')');
  ok(!bad.G.off.list.includes(bad.o), 'Quan ly khai bị loại khỏi danh sách của bạn');
  // bổ nhiệm, gợi ý, bổ nhiệm nhanh, bãi miễn, luân chuyển
  const G = LT.newGame(7, 'Nhân sự', 500); G.rank = 3; LT.grantCities(G, 3, 1, 2); LT.offWeek(G); const cs = LT.ownedCities(G);
  for (const c of cs) { LT.offDismiss(G, c.quan); } ok(cs.every(c => !c.quan && c.vacant), 'Bãi miễn: thành khuyết quan');
  G.res.tien = 1000; LT.offWeek(G); ok(cs.every(c => !c.quan), 'Thành đã khuyết thì không tự có quan mới (không tự điền)');
  const a = LT.offGen(G, 'khoacu'); a.id = LT.off(G).nextId++; LT.off(G).list.push(a); a.home = null;
  const ap = LT.offAppoint(G, a.id, { t: 'city', id: cs[0].id }); ok(ap.ok && cs[0].quan === a.id && a.post.id === cs[0].id, 'Bổ nhiệm một quan vào thành');
  LT.offSeek(G, 'chieuhien'); const f = LT.offFillAll(G); ok(f.n === 2 && cs.every(c => c.quan), 'Bổ nhiệm nhanh điền nốt ' + f.n + ' thành khuyết (chiêu thêm ' + f.hired + ')');
  const rv = LT.offReview(G, a.id, 'thuong'); ok(rv.ok && !LT.offReview(G, a.id, 'thuong').ok, 'Khảo khóa thưởng một lần mỗi năm: ' + rv.text);
  const rotR = LT.offRotate(G, a.id, cs[1].id); ok(rotR.ok && cs[1].quan === a.id, 'Luân chuyển đổi chỗ hai quan');
  // nguồn người khác nhau
  const avg = (src, f) => { let s = 0, n = 200; for (let i = 0; i < n; i++) s += f(LT.offGen(G, src)); return s / n; };
  const kc = avg('khoacu', o => o.chinh), am = avg('am', o => o.chinh), qc = avg('quancong', o => o.chinh), qv = avg('quancong', o => o.vo), bn = avg('ban', o => o.chinh), bl = avg('ban', o => o.liem), kt = avg('khoacu', o => o.trung);
  ok(kc > am && am > bn && qc < kc && qv > 60 && bl < avg('khoacu', o => o.liem), 'Chất lượng theo nguồn: khoa cử Chính ' + kc.toFixed(0) + ' > ấm bổ ' + am.toFixed(0) + ' > mua quan ' + bn.toFixed(0) + '; quân công Chính ' + qc.toFixed(0) + ' nhưng Võ ' + qv.toFixed(0) + '; mua quan liêm ' + bl.toFixed(0));
  // bổng lộc: nợ bổng làm trung thành tụt
  const H = LT.newGame(7, 'Lộc', 501); H.rank = 3; LT.grantCities(H, 3, 1, 2); LT.offWeek(H); const hc = LT.ownedCities(H)[0], ho = LT.offById(H, hc.quan); ho.trung = 80; for (let i = 0; i < 36; i++) { H.res.tien = 0; LT.offWeek(H); H.tick++; H.week = (H.week % 36) + 1; }
  ok(ho.debt > 0 && ho.trung < 80, 'Nợ bổng: quan nợ ' + Math.round(ho.debt) + ' quan, trung thành tụt 80 → ' + Math.round(ho.trung));
}

console.log('--- 5. Lưu rồi tải giữ nguyên quan viên và thương đội');
{
  const G = LT.newGame(3, 'Lưu', 600); G.rank = 3; peace(G); LT.grantCities(G, 3, 1, 2); LT.offWeek(G); G.res.tien = 5000; G.res.tra = 400; LT.offSeek(G, 'chieuhien'); LT.t2(G).shift.tra = 1.3; const c0 = LT.ownedCities(G)[0], o0 = LT.offById(G, c0.quan); o0.hoard = 12.5; o0.known = true;
  const ao = LT.offGen(G, 'khoacu'); ao.id = LT.off(G).nextId++; LT.off(G).list.push(ao); LT.offAppoint(G, ao.id, { t: 'seat', role: 'kho' });
  const sr = LT.sendCaravan(G, { give: 'tra', qty: 120, destKind: 'nat', dest: 1, back: 'ngua', sea: false, escort: true }); ok(sr.ok, 'Gửi thương đội trước khi lưu');
  for (let i = 0; i < 3; i++) { LT.tickWeek(G); calm(G); }
  const H = LT.deserialize(LT.serialize(G));
  ok(JSON.stringify(H.off.list) === JSON.stringify(G.off.list) && H.off.pool.length === G.off.pool.length && H.off.seat.kho === ao.id, 'Quan viên, bảng tuyển và chức ở trị sở giữ nguyên (' + H.off.list.length + ' người)');
  ok(H.trade2.caravans.length === G.trade2.caravans.length && JSON.stringify(H.trade2.caravans) === JSON.stringify(G.trade2.caravans) && H.trade2.shift.tra === G.trade2.shift.tra, 'Thương đội đang đi giữ nguyên (' + H.trade2.caravans.length + ' đoàn, còn ' + (H.trade2.caravans[0] && H.trade2.caravans[0].left) + ' tuần)');
  const c1 = H.world.cities[c0.id]; ok(c1.quan === c0.quan && (c1.olog || []).length === (c0.olog || []).length, 'Thành giữ quan trấn nhậm và nhật ký');
  let wk = 0; while (H.trade2.caravans.length && wk < 60) { LT.tickWeek(H); calm(H); wk++; } ok(H.trade2.hist.length >= 1 && H.trade2.hist[0].status !== undefined, 'Thương đội sau khi tải vẫn đi tiếp và về (' + wk + ' tuần)');
  let thrown = ''; try { LT.deserialize(JSON.stringify(Object.assign(JSON.parse(LT.serialize(G)), { ver: 7 }))); } catch (e) { thrown = e.message; } ok(/phiên bản lưu 7/.test(thrown), 'Bản lưu vòng trước bị từ chối kèm thông báo rõ: "' + thrown + '"');
}
console.log(fails ? '\n' + fails + ' KIỂM THỬ HỎNG' : '\nTẤT CẢ ĐẠT');
process.exit(fails ? 1 : 0);

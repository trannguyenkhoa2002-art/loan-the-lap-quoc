// ============================================================================
// GIAO THƯƠNG (vòng 5) — KT §6, §7, §9, §15
//  - mua bán trực tiếp ở chợ (giá cung cầu × dịch chuyển do chính lệnh của bạn, kẹp 0,4–2,5 lần giá gốc)
//  - thương đội của quan phủ (từ Thứ sử): đường bộ, hải thương; lãi = chênh giá × số hàng − hao hụt − thuế quá cảnh − công phu xe
//  - đặc sản/thiếu hụt theo vùng, thương lộ nội bộ giữa các thành của mình, thuế quá cảnh chỉnh được, cấp phường thị
// Logic thuần (không DOM) để chạy được trong Node.
// ============================================================================
(function (g) {
const LT = g.LT = g.LT || {}, GOODS = LT.GOODS, clamp = LT.clamp, NAT = LT.NATIONS;

// ---- đặc sản (dư: bán rẻ) và thiếu hụt (đắt) theo vùng — KT §7 ----
LT.REGION = {
  0: { du: ['luong', 'vai', 'quang'], thieu: ['tra', 'muoi', 'lua'] },
  1: { du: ['ngua', 'quang'], thieu: ['tra', 'lua', 'luong'] },
  2: { du: ['luong'], thieu: ['muoi', 'gom'] },
  3: { du: ['lua', 'tra', 'muoi'], thieu: ['ngua'] },
  4: { du: ['muoi', 'luong', 'go'], thieu: ['ngua', 'quang', 'gom'] },
  5: { du: ['gom', 'lua'], thieu: ['luong', 'ngua'] },
  6: { du: ['gom', 'lua'], thieu: ['luong', 'ngua'] },
  7: { du: ['tra'], thieu: ['muoi', 'ngua'] },
  8: { du: ['luong', 'ruou'], thieu: ['quang', 'ngua', 'gom'] },
  9: { du: [], thieu: [] },                       // Kinh Nam: không đặc sản, sống bằng thuế quá cảnh
  10: { du: ['ngua', 'quang'], thieu: ['tra', 'lua', 'luong'] },
  11: { du: ['luong', 'ruou'], thieu: ['quang', 'ngua', 'gom'] },
};
LT.COASTAL = { 4: 1, 5: 1, 6: 1, 8: 1, 11: 1 };            // nước có biển (hải thương)
LT.CART_LOAD = 40;           // mỗi xe chở 40 đơn vị hàng
LT.CART_FEE = 1.2;             // công phu xe: quan / xe / tuần đi đường
LT.ESCORT_FEE = 6;           // hộ tống: quan / xe / chuyến
LT.HAO_TUAN = .008;          // hao hụt đường đi mỗi tuần (KT §15)
LT.TRU_THUE = .03;           // trú thuế tại chợ nơi bán
LT.MARKET_TIERS = [
  { n: 'Chưa có chợ', depth: 0, mul: .2, flow: 0 },
  { n: 'Chợ phiên', depth: 500, mul: 1, flow: 1 },
  { n: 'Chợ thường', depth: 1100, mul: 1.5, flow: 1.4 },
  { n: 'Đại thị', depth: 2400, mul: 2.2, flow: 2 },
];
// cấp phường thị: theo số chợ và dịch trạm, và chức tước
LT.marketTier = function (G) {
  const m = LT.count(G, 'market'), inn = LT.count(G, 'inn');
  if (m < 1) return 0; if (m >= 4 && inn >= 1 && G.rank >= 3) return 3; if (m >= 2) return 2; return 1;
};
LT.TRADE_RANK = 2;       // thương đội của quan phủ: từ Thứ sử

LT.t2 = function (G) {
  if (!G.trade2) G.trade2 = { shift: {}, dshift: {}, caravans: [], hist: [], tolls: {}, transit: .02, vol: 0, volWk: -1, nid: 1, block: {}, routes: [], ledger: { mk: 0, car: 0, int: 0, transit: 0, sea: 0 }, noRisk: false };
  return G.trade2;
};
const natToll = (G, nid) => { const t = LT.t2(G).tolls; return t[nid] != null ? t[nid] : (nid === 9 ? .05 : .02); };
LT.natToll = natToll;

// ---- giá ở nơi khác ----
// hệ số vùng cho một mặt hàng ở nước nid, tuần hiện tại (mùa vụ, dao động, dư/thiếu, dịch chuyển do bạn bán/mua)
LT.regionFactor = function (G, nid, k) {
  const R = LT.REGION[nid] || { du: [], thieu: [] };
  let f = R.du.indexOf(k) >= 0 ? .55 : R.thieu.indexOf(k) >= 0 ? 1.9 : 1;
  const m = LT.month(G.week);
  if (k === 'luong') f *= m >= 4 && m <= 8 ? 1.25 : m >= 10 || m <= 1 ? .85 : 1;
  const gi = LT.GOOD_IDS.indexOf(k);
  f *= 1 + .07 * Math.sin(G.tick / 11 + nid * 1.7 + gi * .9);
  const sh = (LT.t2(G).dshift[nid] || {})[k]; if (sh) f *= sh;
  if (LT.aiRegionMul) f *= LT.aiRegionMul(G, nid, k);
  return f;
};
// giá của hàng k ở một nước (nat) hoặc một thành (city); kẹp 0,4–2,5 lần giá gốc
LT.priceAt = function (G, kind, id, k) {
  const base = GOODS[k].p; let nid = id;
  if (kind === 'city') { const c = G.world.cities[id]; nid = c.mine ? G.nation : c.own; }
  let f = LT.regionFactor(G, nid, k);
  if (kind === 'city') f *= 1 + .06 * Math.sin(id * 2.3 + gIdx(k));
  return base * clamp(f, .4, 2.5);
};
const gIdx = k => LT.GOOD_IDS.indexOf(k);
// giá ở chợ trị sở (cung cầu thật của thành bạn) và giá thực khi mua/bán trực tiếp
LT.localBase = (G, k) => GOODS[k].p * ((LT.NATIONS[G.nation].mod.price || {})[k] || 1);
LT.localPrice = function (G, k) {
  const t = LT.t2(G), base = LT.localBase(G, k), p = (G.price[k] || base) * (t.shift[k] || 1) * (LT.aiPriceMul ? LT.aiPriceMul(G, k) : 1);
  return clamp(p, base * .4, base * 2.5);
};
LT.marketQuote = function (G, k, side) { const p = LT.localPrice(G, k); return side === 'buy' ? p * 1.06 : p * .94; };

// ---- 1. mua bán trực tiếp ở chợ ----
LT.marketVolCap = G => 220 * LT.MARKET_TIERS[LT.marketTier(G)].mul;       // quan giao dịch tối đa mỗi tuần
LT.marketTrade = function (G, k, qty, side) {
  const t = LT.t2(G); qty = Math.floor(qty);
  if (!GOODS[k]) return { ok: false, err: 'Mặt hàng lạ' }; if (!(qty > 0)) return { ok: false, err: 'Số lượng phải lớn hơn 0' };
  const tier = LT.marketTier(G); if (tier < 1) return { ok: false, err: 'Cần dựng ít nhất một Phường thị để mua bán trực tiếp' };
  if (t.volWk !== G.tick) { t.volWk = G.tick; t.vol = 0; }
  const p = LT.marketQuote(G, k, side), val = qty * p, left = LT.marketVolCap(G) - t.vol;
  if (val > left + .001) return { ok: false, err: 'Vượt sức chợ tuần này: còn ' + Math.floor(left) + ' quan (chợ ' + LT.MARKET_TIERS[tier].n + ' giao dịch tối đa ' + Math.round(LT.marketVolCap(G)) + ' quan/tuần)' };
  const depth = LT.MARKET_TIERS[tier].depth, name = GOODS[k].n.toLowerCase();
  if (side === 'buy') {
    if (G.res.tien < val) return { ok: false, err: 'Không đủ tiền: cần ' + Math.ceil(val) + ' quan' };
    const room = LT.capOf(G, k) - (G.res[k] || 0); if (room < qty) return { ok: false, err: 'Kho chứa không đủ chỗ (còn ' + Math.floor(room) + ')' };
    LT.addRes(G, 'tien', -val, 'Mua ' + name + ' ở chợ'); LT.addRes(G, k, qty, 'Mua ' + name + ' ở chợ'); G.wealth += val;   // tiền chảy vào dân (lưu thông)
    t.shift[k] = (t.shift[k] || 1) * (1 + val / depth);
  } else {
    const have = G.res[k] || 0; if (have < qty) return { ok: false, err: 'Kho chỉ có ' + Math.floor(have) + ' ' + GOODS[k].u };
    if (G.wealth < val) return { ok: false, err: 'Tiền hoang: dân chỉ còn ' + Math.floor(G.wealth) + ' quan lưu thông, chợ không trả nổi ' + Math.ceil(val) + ' quan' };
    LT.addRes(G, k, -qty, 'Bán ' + name + ' ở chợ'); G.wealth -= val; LT.income(G, val, 'Bán ' + name + ' ở chợ');
    t.shift[k] = (t.shift[k] || 1) / (1 + val / depth);
  }
  t.vol += val; t.ledger.mk += side === 'buy' ? -val : val;
  const base = LT.localBase(G, k); t.shift[k] = clamp(t.shift[k], .4 * base / Math.max(.01, G.price[k] || base), 2.5 * base / Math.max(.01, G.price[k] || base));
  return { ok: true, price: p, value: val };
};

// ---- 2. thuế quá cảnh: dòng hàng ngang qua thành bạn, nhiều chợ/dịch trạm thì nhiều; đặt cao thì thương đội né ----
LT.transitFlow = function (G) {
  const tier = LT.marketTier(G), inn = LT.count(G, 'inn'), tt = G.treaties.thongthuong.length;
  const nat = LT.NATIONS[G.nation].mod; const qc = nat.quaCanh ? 1.8 : 1;
  const pv = clamp(G.stat.phonvinh / 60, .35, 1.2);
  return (30 + 90 * LT.MARKET_TIERS[tier].flow + 90 * inn + 110 * tt) * (nat.trade || 1) * qc * pv * (tier ? 1 : .15);       // quan hàng/tuần đi ngang
};
LT.transitIncome = function (G) {
  const t = LT.t2(G), r = t.transit, avoid = clamp(1 - Math.max(0, r - .02) * 11, .08, 1);       // trên 2% thương đội bắt đầu né
  return LT.transitFlow(G) * avoid * r;
};

// ---- 3. đường đi và báo giá thương đội ----
LT.cityPath = function (G, from, to) {
  const cs = G.world.cities, prev = new Int16Array(cs.length).fill(-2), q = [from]; prev[from] = -1;
  for (let i = 0; i < q.length; i++) { const c = q[i]; if (c === to) break; for (const n of cs[c].adj) if (prev[n] === -2) { prev[n] = c; q.push(n); } }
  if (prev[to] === -2) return null; const path = []; for (let c = to; c !== -1; c = prev[c]) path.push(c); return path.reverse();
};
LT.routeBlocked = function (G, nid) {
  const t = LT.t2(G), w = G.world;
  if (nid === G.nation || nid === 12) return '';
  if (t.block[nid] > 0) return NAT[nid].n + ' đang chặn thương lộ (' + t.block[nid] + ' tuần nữa)';
  if (w.rel[nid] <= -45) return 'Quan hệ với ' + NAT[nid].n + ' quá xấu (' + Math.round(w.rel[nid]) + '): họ cấm vận';
  if (G.camp && G.camp.nation === nid) return 'Đang có chiến dịch đánh ' + NAT[nid].n;
  if (w.ns[nid] && !w.ns[nid].alive) return NAT[nid].n + ' đã diệt vong';
  return '';
};
// opt: { give, qty, back, destKind:'nat'|'city', dest, sea, escort }
LT.caravanQuote = function (G, opt) {
  const k = opt.give, w = G.world, cs = w.cities, seat = cs[G.seatId], r = { ok: false };
  if (!GOODS[k]) { r.err = 'Chọn mặt hàng'; return r; }
  let dcity = opt.destKind === 'city' ? opt.dest : w.capIds[opt.dest]; if (dcity == null || !cs[dcity]) { r.err = 'Chọn nơi đến'; return r; }
  const dc = cs[dcity], dnid = dc.mine ? G.nation : dc.own;
  if (dcity === G.seatId) { r.err = 'Nơi đến trùng trị sở'; return r; }
  const carts = Math.min(12, Math.max(1, Math.ceil(opt.qty / LT.CART_LOAD))), qty = Math.min(opt.qty, carts * LT.CART_LOAD);
  if (!(qty > 0)) { r.err = 'Số hàng phải lớn hơn 0'; return r; }
  let hops, tollCities = [], sea = !!opt.sea;
  if (sea) {
    if (!LT.count(G, 'port')) { r.err = 'Hải thương cần Bến cảng ở trị sở (nhóm Thương & kho, từ Thứ sử)'; return r; }
    if (!LT.COASTAL[dnid]) { r.err = NAT[dnid].n + ' không có bờ biển để cập bến'; return r; }
    hops = clamp(Math.round(Math.hypot(seat.x - dc.x, seat.y - dc.y) * 26), 3, 9);
  } else {
    const path = LT.cityPath(G, G.seatId, dcity); if (!path) { r.err = 'Không có đường bộ tới đó'; return r; }
    hops = path.length - 1;
    for (const id of path.slice(1, -1)) { const c = cs[id], nid = c.mine ? G.nation : c.own; if (nid === G.nation || nid === 12) continue; const b = LT.routeBlocked(G, nid); if (b) { r.err = 'Tuyến bị cắt: ' + b; return r; } tollCities.push({ id, nid, n: c.n }); }
  }
  const b = LT.routeBlocked(G, dnid); if (b && dnid !== G.nation) { r.err = 'Tuyến bị cắt: ' + b; return r; }
  const W = sea ? Math.max(2, Math.ceil(hops * .8)) : clamp(Math.ceil(hops * 1.3) + 1, 2, 14);
  const buyP = LT.localPrice(G, k), sellP = LT.priceAt(G, opt.destKind === 'city' ? 'city' : 'nat', opt.dest, k);
  const keep = Math.pow(1 - LT.HAO_TUAN * (sea ? 1.4 : 1), W), qAfter = qty * keep;
  // bán nhiều thì giá bán tụt (độ sâu chợ nơi đến)
  const depth = 2200 * (dc.lvl >= 3 ? 1.6 : 1), gross0 = qAfter * sellP, slip = clamp(1 - .5 * gross0 / depth, .5, 1), sellEff = sellP * slip;
  const revenue = qAfter * sellEff, truthue = revenue * LT.TRU_THUE;
  let toll = 0; for (const tc of tollCities) toll += revenue * natToll(G, tc.nid) * .5;
  const cong = carts * LT.CART_FEE * W * 2, escort = opt.escort ? carts * LT.ESCORT_FEE : 0;
  const cost = qty * buyP, net = revenue - truthue - toll;
  let backQty = 0, backP = 0, backVal = 0;
  if (opt.back && opt.back !== k && GOODS[opt.back]) {
    backP = LT.priceAt(G, opt.destKind === 'city' ? 'city' : 'nat', opt.dest, opt.back) * 1.05;
    backQty = Math.floor(net / backP * Math.pow(1 - LT.HAO_TUAN * (sea ? 1.4 : 1), W)); backVal = backQty * LT.localPrice(G, opt.back);
  }
  const ret = opt.back && opt.back !== k ? backVal : net;
  const profit = ret - cost - cong - escort;
  return Object.assign(r, { ok: true, qty, carts, hops, W, sea, sellP, sellEff, buyP, keep, qAfter, revenue, truthue, toll, tollCities, cong, escort, cost, net, backQty, backP, backVal, profit, dcity, dnid, upfront: cong + escort, riskTxt: sea ? 'bão ~1%/tuần (mất 70% hàng), hải tặc ~1,2%/tuần (mất 45%)' : 'cướp đường ~' + (LT.roadRisk(G, !!opt.escort) * 100).toFixed(1) + '%/tuần (mất 25–60% hàng)' });
};
LT.roadRisk = (G, escort) => .012 * (1 - Math.min(.6, G.stat.trian / 150)) * (escort ? .3 : 1);
LT.maxCaravans = G => Math.min(4, G.rank - 1);
LT.sendCaravan = function (G, opt) {
  const t = LT.t2(G);
  if (G.rank < LT.TRADE_RANK) return { ok: false, err: 'Thương đội của quan phủ mở từ chức Thứ sử' };
  if (t.caravans.length >= LT.maxCaravans(G)) return { ok: false, err: 'Đang có ' + t.caravans.length + ' thương đội đi đường (tối đa ' + LT.maxCaravans(G) + ' ở chức này)' };
  if (opt.give === 'luong') { /* thóc xuất từ kho quan */ }
  const q = LT.caravanQuote(G, opt); if (!q.ok) return q;
  const have = G.res[opt.give] || 0; if (have < q.qty) return { ok: false, err: 'Kho chỉ có ' + Math.floor(have) + ' ' + GOODS[opt.give].u + ' ' + GOODS[opt.give].n.toLowerCase() };
  if (G.res.tien < q.upfront) return { ok: false, err: 'Không đủ tiền công phu xe và hộ tống: ' + Math.ceil(q.upfront) + ' quan' };
  LT.addRes(G, opt.give, -q.qty, 'Thương đội mang đi ' + GOODS[opt.give].n.toLowerCase());
  if (q.upfront > 0) LT.addRes(G, 'tien', -q.upfront, 'Công phu xe thương đội');
  const car = { id: (t.nid++), give: opt.give, qty: q.qty, back: opt.back && opt.back !== opt.give ? opt.back : null, destKind: opt.destKind, dest: opt.dest, dcity: q.dcity, dnid: q.dnid, destN: G.world.cities[q.dcity].n, sea: q.sea, escort: !!opt.escort, carts: q.carts, W: q.W, left: q.W, state: 'go', q: JSON.parse(JSON.stringify({ buyP: q.buyP, cost: q.cost, cong: q.cong, escort: q.escort, profit: q.profit })), cur: q.qty, tolls: q.tollCities, qSell: q.sellP, qBack: q.backP, log: [], y: G.year, wk: G.week, tollPaid: 0, revenue: 0, backQty: 0, lost: 0 };
  t.caravans.push(car); LT.log(G, 'Thương đội ' + q.qty + ' ' + GOODS[opt.give].n.toLowerCase() + ' lên đường tới ' + car.destN + ' (' + q.W + ' tuần' + (q.sea ? ', đường biển' : '') + ').', '');
  return { ok: true, car, q };
};
function finish(G, car, status) {
  const t = LT.t2(G); t.caravans.splice(t.caravans.indexOf(car), 1);
  const goods = car.back ? GOODS[car.back].n.toLowerCase() : 'bạc';
  let value, label = 'Thương đội ' + car.destN + ' (' + GOODS[car.give].n.toLowerCase() + (car.back ? ' đổi ' + goods : '') + ')';
  if (status === 'ok') {
    if (car.back) { const room = Math.max(0, LT.capOf(G, car.back) - (G.res[car.back] || 0)), put = Math.min(room, Math.floor(car.cur)); LT.addRes(G, car.back, put, label); value = put * LT.localPrice(G, car.back); car.backGot = put; }
    else { LT.income(G, car.cur, label); value = car.cur; }
  } else if (status === 'cut') value = car.cutGoods * car.q.buyP; else value = 0;
  const profit = value - car.q.cost - car.q.cong - car.q.escort; car.profit = profit; car.status = status; car.doneY = G.year; car.doneWk = G.week;
  t.ledger[car.sea ? 'sea' : 'car'] += profit; t.hist.unshift({ id: car.id, y: car.y, wk: car.wk, doneY: G.year, doneWk: G.week, give: car.give, back: car.back, qty: car.qty, dest: car.destN, sea: car.sea, profit, status, lost: car.lost, log: car.log.slice(-4), toll: car.tollPaid, revenue: car.revenue }); if (t.hist.length > 40) t.hist.length = 40;
  LT.log(G, 'Thương đội về từ ' + car.destN + (status === 'ok' ? ': ' + (profit >= 0 ? 'lãi ' : 'lỗ ') + Math.abs(Math.round(profit)) + ' quan.' : status === 'cut' ? ' (bị cắt tuyến): lỗ ' + Math.abs(Math.round(profit)) + ' quan.' : ' (mất hàng): lỗ ' + Math.abs(Math.round(profit)) + ' quan.'), profit >= 0 ? 'good' : 'bad');
}
function stepCaravan(G, car) {
  const t = LT.t2(G); car.left--;
  // rủi ro trên đường
  if (!t.noRisk) {
    if (car.sea) {
      if (LT.rand(G) < .010) { const lose = car.cur * .7; car.cur -= lose; car.lost += lose; car.log.push('Gặp bão, mất ' + Math.round(lose) + ' hàng'); LT.log(G, 'Thương đội đi ' + car.destN + ' gặp bão, mất ' + Math.round(lose) + ' hàng.', 'bad'); }
      else if (LT.rand(G) < (car.escort ? .006 : .012)) { const lose = car.cur * .45; car.cur -= lose; car.lost += lose; car.log.push('Hải tặc cướp ' + Math.round(lose) + ' hàng'); LT.log(G, 'Hải tặc cướp thương đội đi ' + car.destN + ' (mất ' + Math.round(lose) + ' hàng).', 'bad'); }
    } else if (LT.rand(G) < LT.roadRisk(G, car.escort)) { const lose = car.cur * (.25 + LT.rand(G) * .35); car.cur -= lose; car.lost += lose; car.log.push('Bị cướp đường, mất ' + Math.round(lose) + ' hàng'); LT.log(G, 'Thương đội đi ' + car.destN + ' bị cướp đường, mất ' + Math.round(lose) + ' hàng.', 'bad'); }
    // chiến tranh / cấm vận cắt tuyến giữa đường
    if (car.state === 'go' && LT.routeBlocked(G, car.dnid) && car.dnid !== G.nation) { car.log.push('Tuyến bị cắt, quay về'); car.state = 'back'; car.left = Math.max(1, car.W - car.left); car.cutBack = true; car.cur *= .85; car.lost += car.cur * .15; car.revenueNet = 0; car.backQty = 0; car.back = null; car.q.cong += 0; car.cutGoods = car.cur; return; }
  }
  if (car.left > 0) return;
  if (car.state === 'go') {          // đến nơi: bán, trả thuế, đổi hàng chiều về
    const k = car.give, dnk = car.destKind === 'city' ? 'city' : 'nat', keep = Math.pow(1 - LT.HAO_TUAN * (car.sea ? 1.4 : 1), car.W), qAfter = car.cur * keep;
    const sellP = t.noRisk ? car.qSell : LT.priceAt(G, dnk, car.dest, k), depth = 2200 * (G.world.cities[car.dcity].lvl >= 3 ? 1.6 : 1), slip = clamp(1 - .5 * qAfter * sellP / depth, .5, 1);
    const revenue = qAfter * sellP * slip, truthue = revenue * LT.TRU_THUE; let toll = 0; for (const tc of car.tolls) toll += revenue * natToll(G, tc.nid) * .5;
    car.revenue = revenue; car.tollPaid = toll + truthue; car.revenueNet = revenue - toll - truthue;
    if (car.dnid !== G.nation) { const ds = (t.dshift[car.dnid] = t.dshift[car.dnid] || {}); ds[k] = clamp((ds[k] || 1) * (1 - .5 * revenue / depth), .6, 1.4); }
    if (car.back) { const bp = t.noRisk ? car.qBack : LT.priceAt(G, dnk, car.dest, car.back) * 1.05; car.backQty = Math.floor(car.revenueNet / bp * Math.pow(1 - LT.HAO_TUAN * (car.sea ? 1.4 : 1), car.W)); const ds = (t.dshift[car.dnid] = t.dshift[car.dnid] || {}); if (car.dnid !== G.nation) ds[car.back] = clamp((ds[car.back] || 1) * (1 + .5 * car.revenueNet / depth), .6, 1.4); }
    car.cur = car.back ? car.backQty : car.revenueNet; car.state = 'back'; car.left = car.W; car.log.push('Đã bán ở ' + car.destN + ' thu ' + Math.round(car.revenueNet) + ' quan sau thuế'); return;
  }
  if (car.cutBack) { LT.addRes(G, car.give, Math.min(car.cutGoods, Math.max(0, LT.capOf(G, car.give) - (G.res[car.give] || 0))), 'Thương đội cắt tuyến mang hàng về'); finish(G, car, 'cut'); return; }
  finish(G, car, car.cur < 1 ? 'lost' : 'ok');
}

// ---- 4. thương lộ nội bộ giữa thành của mình: lương từ thành dư sang thành thiếu, hao 6% mỗi chặng ----
LT.INT_HAO = .06;
LT.internalShip = function (G, fromId, toId, qty) {
  const cs = G.world.cities; if (G.rank < 2) return { ok: false, err: 'Thương lộ nội bộ mở từ chức Thứ sử' };
  const a = cs[fromId], b = cs[toId]; if (!a || !b || fromId === toId) return { ok: false, err: 'Chọn hai thành khác nhau' };
  if (!((a.mine || fromId === G.seatId) && (b.mine || toId === G.seatId))) return { ok: false, err: 'Chỉ điều hàng giữa các thành của bạn' };
  const have = fromId === G.seatId ? G.res.luong : a.grain; qty = Math.min(qty, have * .9); if (!(qty >= 10)) return { ok: false, err: 'Thành đi không còn đủ lương để điều' };
  const hop = Math.max(1, LT.cityHops(G, fromId, toId)); const got = qty * Math.pow(1 - LT.INT_HAO, hop), fee = Math.ceil(qty / 100 * .5 * hop * 10) / 10;
  if (G.res.tien < fee) return { ok: false, err: 'Cần ' + fee + ' quan công phu xe' };
  LT.addRes(G, 'tien', -fee, 'Công phu thương lộ nội bộ');
  if (fromId === G.seatId) LT.addRes(G, 'luong', -qty, 'Điều lương tới ' + b.n); else a.grain -= qty;
  if (toId === G.seatId) { G.dan.luong += got; LT.flowAdd(G, 'dluong', got, 'Điều lương từ ' + a.n); } else b.grain = Math.min(b.ho * 10, b.grain + got);
  LT.t2(G).ledger.int -= fee; LT.log(G, 'Điều ' + Math.round(qty) + ' thạch lương từ ' + a.n + ' sang ' + b.n + ' (hao ' + Math.round((1 - got / qty) * 100) + '%, ' + hop + ' chặng).', '');
  return { ok: true, qty, got, hop, fee };
};
LT.addRoute = function (G, from, to, qty) {
  if (G.rank < 2) return { ok: false, err: 'Mở từ chức Thứ sử' }; const t = LT.t2(G); if (t.routes.length >= 6) return { ok: false, err: 'Tối đa 6 thương lộ thường trực' };
  if (from === to) return { ok: false, err: 'Hai thành phải khác nhau' }; t.routes.push({ from, to, qty: Math.max(20, Math.floor(qty)) }); return { ok: true };
};
function routesWeek(G) {
  const t = LT.t2(G), cs = G.world.cities;
  if (G.week % 3 !== 0) return;
  for (const r of t.routes.slice()) {
    const a = cs[r.from], b = cs[r.to]; if (!a || !b || !(a.mine || r.from === G.seatId) || !(b.mine || r.to === G.seatId)) { t.routes.splice(t.routes.indexOf(r), 1); continue; }
    const aGr = r.from === G.seatId ? G.res.luong : a.grain, aRes = r.from === G.seatId ? 1500 : a.ho * 4, bGr = r.to === G.seatId ? G.res.luong : b.grain, bNeed = r.to === G.seatId ? 3000 : b.ho * 3;
    if (aGr > aRes + r.qty && bGr < bNeed) LT.internalShip(G, r.from, r.to, r.qty);
  }
}

// ---- nhịp tuần ----
LT.tradeWeek = function (G) {
  const t = LT.t2(G);
  // dịch chuyển giá của bạn trở về 1; hết lệnh chặn
  for (const k in t.shift) { t.shift[k] = 1 + (t.shift[k] - 1) * .88; if (Math.abs(t.shift[k] - 1) < .002) delete t.shift[k]; }
  for (const n in t.dshift) for (const k in t.dshift[n]) { t.dshift[n][k] = 1 + (t.dshift[n][k] - 1) * .94; }
  for (const n in t.block) { if (t.block[n] > 0) t.block[n]--; if (t.block[n] <= 0) delete t.block[n]; }
  // nước giữ đường (Kinh Nam…) thỉnh thoảng chặn thương lộ
  if (!t.noRisk && G.week % 6 === 0 && G.rank >= 2) for (const nid of [9, 0, 4]) if (nid !== G.nation && LT.rand(G) < (nid === 9 ? .06 : .02) && !t.block[nid] && (G.world.rel[nid] < 25)) { t.block[nid] = 8 + Math.floor(LT.rand(G) * 10); LT.log(G, NAT[nid].n + ' chặn thương lộ ' + t.block[nid] + ' tuần.', 'bad'); }
  for (const car of t.caravans.slice()) stepCaravan(G, car);
  routesWeek(G);
};

// ---- gợi ý tuyến tiêu biểu (KT §7) ----
LT.ROUTE_PRESETS = [
  { id: 'tradat', n: 'Trà đổi ngựa', give: 'tra', back: 'ngua', dests: [1, 10, 2], d: 'Trà lên phương bắc đổi ngựa chiến.' },
  { id: 'muoi', n: 'Muối ra – lương vào', give: 'muoi', back: 'luong', dests: [5, 6, 0, 1], d: 'Muối đem bán nơi thiếu, chở lương về.' },
  { id: 'lua', n: 'Lụa ra – lương vào', give: 'lua', back: 'luong', dests: [1, 10, 0], d: 'Lụa đẹp bán cho nước giàu, chở lương về.' },
  { id: 'gom', n: 'Gốm xuất hải', give: 'gom', back: null, dests: [8, 11, 4], sea: true, d: 'Gốm xuất khẩu đường biển; lãi cao, rủi ro bão và hải tặc.' },
];
})(typeof globalThis !== 'undefined' ? globalThis : window);

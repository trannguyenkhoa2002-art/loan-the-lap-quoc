'use strict';
// ============================================================================
// KINH TẾ: sản xuất, tiêu dùng theo tầng lớp, thương lộ, thuế, hộ khẩu, chỉ số.
// Mọi con số lấy từ data.js (đã ghi mục tài liệu). Không đụng DOM.
// ============================================================================
(function (g) {
const LT = g.LT = g.LT || {};
const B = LT.B, GOODS = LT.GOODS, clamp = LT.clamp, WY = LT.WEEKS_YEAR;
const natMod = G => LT.NATIONS[G.nation].mod;

// ---- sổ dòng chảy: vì sao con số lên xuống --------------------------------------
LT.flowAdd = function (G, res, amt, label) {
  if (!amt || !isFinite(amt)) return;
  for (const t of [G.flow.cur, G.flow.year]) { const r = t[res] || (t[res] = {}); r[label] = (r[label] || 0) + amt; }
};
LT.newFlow = () => ({ cur: {}, last: {}, year: {}, lastYear: {} });
// thêm/bớt kho quan, có ghi sổ; không cho âm
const add = LT.addRes = function (G, k, v, label) {
  if (!isFinite(v) || v === 0) return 0;
  const before = G.res[k] || 0, after = Math.max(0, before + v);
  G.res[k] = after; LT.flowAdd(G, k, after - before, label); return after - before;
};
// lấy ra tối đa v; trả về số thực lấy được
const take = LT.takeRes = function (G, k, v, label) { const t = Math.min(G.res[k] || 0, Math.max(0, v)); if (t > 0) { G.res[k] -= t; LT.flowAdd(G, k, -t, label); } return t; };
const addDan = (G, v, label) => { const b = G.dan.luong; G.dan.luong = Math.max(0, b + v); LT.flowAdd(G, 'dluong', G.dan.luong - b, label); };
LT.log = function (G, text, cls) { G.log.unshift({ y: G.year, w: G.week, t: text, c: cls || '' }); if (G.log.length > 120) G.log.length = 120; if (LT.onLog) LT.onLog(text, cls || ''); };
// dòng thu đi vào ngân khố: tính vào khoản phải chia thuế ba phần
const income = (G, v, label) => { add(G, 'tien', v, label); G.yr.rev += v; G.pend.tien += v; };
LT.income = income;

// ---- nhu cầu và giá -----------------------------------------------------------
LT.demandWeek = function (G) {
  const d = {};
  for (const c of LT.CLASS_IDS) { const h = G.H[c] || 0, nd = LT.NEEDS[c]; for (const k in nd) d[k] = (d[k] || 0) + h * nd[k] / WY; }
  let farms = 0; for (const b of G.bl) if (b.k === 'farm' && !b.building && b.sr > 0) farms++;
  d.nongcu = farms / WY;
  return d;
};
LT.armyCount = G => G.units.reduce((n, u) => n + u.n, 0);
LT.armyDemandWeek = G => LT.armyCount(G) * LT.LINH_AN * (G.rank === 1 ? .5 : 1) + (G.units.filter(u => u.type === 'khinhky' || u.type === 'trongky').reduce((n, u) => n + u.n, 0)) * LT.NGUA_AN;
LT.updatePrices = function (G) {
  const dem = LT.demandWeek(G), P = G.price = {}, mod = natMod(G).price || {};
  for (const k of LT.GOOD_IDS) {
    const base = GOODS[k].p * (mod[k] || 1);
    const S = (k === 'luong' ? G.dan.luong + G.res.luong : (G.res[k] || 0));
    const D = Math.max(1, 12 * (dem[k] || 0)) + (k === 'luong' ? LT.armyDemandWeek(G) * 12 : 0);
    P[k] = base * clamp(Math.sqrt(D / Math.max(1, S)), .4, 2.5);   // KT §6
  }
};
LT.foodWeeks = function (G) {
  const dem = LT.demandWeek(G).luong + LT.armyDemandWeek(G);
  return dem > 0 ? (G.dan.luong + G.res.luong) / dem : 99;
};
LT.capOf = (G, k) => (k === 'luong' ? 2500 + 1800 * LT.count(G, 'granary') : 700 + 600 * LT.count(G, 'granary'));

// ---- hộ khẩu ------------------------------------------------------------------
LT.loseHo = function (G, n, label) {
  let lost = 0;
  const ids = ['luu', 'nong', 'cong', 'thuong', 'si', 'tang', 'hao'];
  for (let i = 0; i < n; i++) {
    let tot = 0; for (const c of ids) tot += (G.H[c] || 0) * (c === 'luu' ? 2 : 1);
    if (tot <= 0) break;
    let r = LT.rand(G) * tot, pick = 'luu';
    for (const c of ids) { r -= (G.H[c] || 0) * (c === 'luu' ? 2 : 1); if (r <= 0) { pick = c; break; } }
    if ((G.H[pick] || 0) > 0) { G.H[pick]--; lost++; }
  }
  if (lost) { LT.flowAdd(G, 'ho', -lost, label); G.yr.leave += lost; }
  return lost;
};
LT.addHo = function (G, n, cls, label) { G.H[cls || 'luu'] += n; LT.flowAdd(G, 'ho', n, label); };

function slotsOf(G, c) { let n = 0; for (const b of G.bl) if (!b.building && B[b.k] && B[b.k].job && B[b.k].job.c === c) n += B[b.k].job.n; return n; }
LT.slotsOf = slotsOf;

// ---- sản xuất ---------------------------------------------------------------
function seasonal(k, m) {
  if (k === 'muoi') return (m >= 5 && m <= 8) ? .5 : (m >= 10 || m <= 3) ? 1.5 : 1;  // mùa khô ×1,5, mùa mưa ×0,5
  if (k === 'tra') return (m === 3 || m === 4) ? 1.5 : 1;                              // hái rộ tháng 3–4
  return 1;
}
function farmPhase(G) {
  const w = G.week, nam = natMod(G).nam;
  if (!nam) { if (w <= 24) return { grow: LT.KHU_RUONG_NAM / 24 }; if (w <= 27) return { harvest: true, left: 28 - w, last: w === 27 }; return {}; }
  if (w <= 15) return { grow: LT.VU_NAM / 15 };
  if (w <= 18) return { harvest: true, left: 19 - w, last: w === 18 };
  if (w <= 27) return { grow: LT.VU_NAM / 9 };
  if (w <= 30) return { harvest: true, left: 31 - w, last: w === 30 };
  return {};
}
LT.farmYield = function (G, b, ph) {  // hệ số sản lượng KT §4
  const q = LT.tileAt(G, b.x, b.y), m = natMod(G);
  const toolR = G.toolRatio == null ? 1 : G.toolRatio;
  let f = (q ? q.fert : 1) * (LT.irrigated(G, b) ? 1.3 : 1) * (1 + .2 * toolR) * (b.trau ? 1.15 : 1)
    * b.sr * (b.conn ? 1 : LT.NGOAI_BAN_KINH) * b.roadMul * (1 + G.player.chinh / 400) * (m.yield || 1) * (G.weather.mul || 1) * (G.lab.busy ? .8 : 1)
    * (G.bocao.khuyennong ? 1.05 : 1);
  return f;
};

function produce(G) {
  const m = LT.month(G.week), boss = 1 + G.player.chinh / 400, mod = natMod(G);
  const staffedFarms = G.bl.filter(b => b.k === 'farm' && !b.building && b.sr > 0);
  const toolNeed = staffedFarms.length / WY;
  G.toolRatio = toolNeed > 0 ? Math.min(1, (G.res.nongcu || 0) / toolNeed) : 1;
  if (toolNeed > 0) take(G, 'nongcu', toolNeed, 'Nông cụ hao mòn (1 bộ/khu/năm)');
  const ph = farmPhase(G);
  // --- ruộng ---
  for (const b of staffedFarms) {
    if (ph.grow) b.acc = (b.acc || 0) + ph.grow * LT.farmYield(G, b, ph);
  }
  for (const b of G.bl) {
    if (b.k !== 'farm' || b.building) continue;
    if (ph.harvest && b.acc > 0) {
      const out = b.acc / ph.left; b.acc -= out; addDan(G, out, 'Thu hoạch ruộng'); G.yr.yield += out;
      if (ph.last) b.acc = 0;
    }
  }
  // --- công trình khai thác, lần một: nguyên liệu thô ---
  const eff = b => b.sr * (b.conn ? 1 : LT.NGOAI_BAN_KINH) * b.roadMul * boss;
  const raw = ['lumber', 'quarry', 'mine', 'salt', 'tea', 'mulberry', 'cloth'];
  for (const b of G.bl) {
    if (b.building || b.sr <= 0 || raw.indexOf(b.k) < 0) continue;
    const d = B[b.k];
    for (const k in d.out) add(G, k, d.out[k] * eff(b) * seasonal(k, m), d.n);
  }
  // --- chế biến: cần đầu vào ---
  for (const b of G.bl) {
    if (b.building || b.sr <= 0) continue;
    const k = b.k, d = B[k];
    if (k === 'silk' || k === 'kiln') {
      let f = eff(b); const need = {}; for (const r in d.in) need[r] = d.in[r] * f;
      let cap = 1; for (const r in need) cap = Math.min(cap, need[r] > 0 ? (G.res[r] || 0) / need[r] : 1);
      cap = clamp(cap, 0, 1); f *= cap;
      if (cap > 0) { for (const r in d.in) take(G, r, d.in[r] * f / (eff(b) || 1) * eff(b), d.n + ' (đầu vào)'); for (const r in d.out) add(G, r, d.out[r] * f, d.n); }
      b.idle = cap < .05;
    } else if (k === 'forge' || k === 'armory') {
      let f = eff(b); const need = { quang: d.in.quang * f, go: d.in.go * f };
      let cap = Math.min(1, need.quang > 0 ? (G.res.quang || 0) / need.quang : 1, need.go > 0 ? (G.res.go || 0) / need.go : 1); cap = clamp(cap, 0, 1);
      if (cap > 0) {
        take(G, 'quang', need.quang * cap, d.n + ' (đầu vào)'); take(G, 'go', need.go * cap, d.n + ' (đầu vào)');
        const outk = b.mode, amt = k === 'forge' ? (outk === 'nongcu' ? 3 : 1) : (outk === 'binhkhi' ? 2 : 1);
        add(G, outk, amt * f * cap, d.n);
      }
      b.idle = cap < .05;
    } else if (k === 'winery') {
      if (G.pol.camruou) { b.idle = true; continue; }
      const f = eff(b), need = 4 * f, got = Math.min(need, G.dan.luong * .5);
      if (got > 0) { addDan(G, -got, 'Lò rượu nấu'); add(G, 'ruou', 3 * got / 4, d.n); }
      b.idle = got <= 0;
    } else if (k === 'stable') {
      const f = eff(b), need = 6 * f;
      const got = LT.provideLuong(G, need, 'Mã phường nuôi ngựa');
      b.horseAcc = (b.horseAcc || 0) + .2 * f * (need > 0 ? got / need : 0);
      while (b.horseAcc >= 1) { b.horseAcc -= 1; add(G, 'ngua', 1, 'Mã phường'); }
    }
  }
  // tràn kho
  for (const k of LT.GOOD_IDS) { if (k === 'luong') continue; const cap = LT.capOf(G, k); if (G.res[k] > cap) { LT.flowAdd(G, k, cap - G.res[k], 'Tràn kho (xây thêm kho lương)'); G.res[k] = cap; } }
  if (G.res.luong > LT.capOf(G, 'luong')) { LT.flowAdd(G, 'luong', LT.capOf(G, 'luong') - G.res.luong, 'Tràn kho'); G.res.luong = LT.capOf(G, 'luong'); }
}
// lấy lương từ kho quan, thiếu thì mua của dân theo giá chợ (quân phải có ăn)
LT.provideLuong = function (G, need, label) {
  let got = take(G, 'luong', need, label);
  const lack = need - got;
  if (lack > .001 && G.dan.luong > lack) {
    const p = (G.price.luong || .4) * 1.1, cost = Math.min(G.res.tien, lack * p), qty = cost / p;
    if (qty > 0) { addDan(G, -qty, 'Quan mua lương cho quân'); add(G, 'tien', -cost, 'Mua lương cho quân'); G.wealth += cost; got += qty; }
  }
  if (need - got > .001 && G.world && G.world.cities) got += LT.cityFood(G, need - got);
  return got;
};

// ---- tiêu dùng, thương lộ, thuế chợ -------------------------------------------
function consume(G) {
  const dem = LT.demandWeek(G), sat = G.sat = {}, mod = natMod(G).price || {};
  // 1) thương nhân nhập hàng thiếu (KT §6–7): có chợ mới nhập tốt
  const thuongH = G.H.thuong || 0, mk = LT.count(G, 'market') > 0, inn = LT.count(G, 'inn') > 0;
  let cap = thuongH * 3 * (mk ? 1 : .2) * (inn ? 1.25 : 1) * (natMod(G).trade || 1) * (1 + .15 * G.treaties.thongthuong.length) + (G.treaties.thongthuong.length ? 6 : 0);
  G.trade.cap = cap;
  let capLeft = cap, impVal = 0, expVal = 0;
  for (const k of LT.TRADE_IN) {
    const d = dem[k] || 0; if (d <= 0) continue;
    const have = k === 'luong' ? G.dan.luong : (G.res[k] || 0), gap = Math.max(0, d - have);
    if (gap <= .001) continue;
    const p = (G.price[k] || GOODS[k].p) * 1.3;
    const qty = Math.min(gap, capLeft / p, G.wealth / p);
    if (qty > 0) { if (k === 'luong') addDan(G, qty, 'Thương nhân nhập lương'); else add(G, k, qty, 'Thương nhân nhập hàng'); G.wealth -= qty * p; capLeft -= qty * p; impVal += qty * p; }
  }
  // 2) tiêu dùng
  let retail = 0;
  const classSat = {};
  // lương: lấy từ kho dân
  const dl = dem.luong || 0, haveL = G.dan.luong, satL = dl > 0 ? Math.min(1, haveL / dl) : 1;
  sat.luong = satL; if (dl > 0) { addDan(G, -dl * satL, 'Dân ăn'); retail += dl * satL * (G.price.luong || .4); }
  for (const k of LT.GOOD_IDS) {
    if (k === 'luong' || k === 'nongcu') continue;
    const d = dem[k] || 0; if (d <= 0) continue;
    const have = G.res[k] || 0, s = Math.min(1, have / d);
    sat[k] = s;
    if (s > 0) {
      take(G, k, d * s, 'Dân dùng');
      const p = GOODS[k].p * (mod[k] || 1);
      retail += d * s * (G.price[k] || p);
      // chuyên bán của quan (GP §5.4, KT §8.1): lãi = lượng × (giá bán − giá vốn)
      if (G.pol.mono[k] && G.rank >= (LT.GOODS_MONO_RANK[k] || 1)) {
        const smuggle = G.stat.trian < 40 ? (40 - G.stat.trian) / 40 * .6 : 0;
        const profit = d * s * p * (LT.CHUYEN_BAN[k] - 1) * (1 - smuggle);
        const pay = Math.min(profit, G.wealth);
        if (pay > 0) { G.wealth -= pay; income(G, pay, 'Chuyên bán ' + GOODS[k].n.toLowerCase() + (smuggle > .05 ? ' (hao vì buôn lậu)' : '')); }
        G.yr.mono += pay;
      }
    }
  }
  for (const c of LT.CLASS_IDS) {
    const nd = LT.NEEDS[c], ks = Object.keys(nd).filter(k => k !== 'luong');
    let s = sat.luong * (ks.length ? .6 : 1);
    if (ks.length) s += .4 * ks.reduce((a, k) => a + (sat[k] == null ? 1 : sat[k]), 0) / ks.length;
    classSat[c] = s;
  }
  G.satc = classSat;
  // 3) xuất hàng dư: thương nhân đem bán ra ngoài (nguồn tiền lưu thông)
  const price = k => (G.price[k] || GOODS[k].p);
  for (const k of LT.TRADE_OUT) {
    const d = dem[k] || 0;
    const stock = k === 'luong' ? G.dan.luong : (G.res[k] || 0);
    const reserve = k === 'luong' ? Math.max(60, 40 * d + LT.armyDemandWeek(G) * 8) : Math.max(4, 12 * d);
    let surplus = stock - reserve; if (surplus <= 0 || capLeft <= 0) continue;
    const p = Math.max(GOODS[k].p * .5, price(k)) * .85;
    const qty = Math.min(surplus, capLeft / p); if (qty <= 0) continue;
    if (k === 'luong') addDan(G, -qty, 'Thương nhân bán lương ra ngoài'); else take(G, k, qty, 'Thương nhân bán ra ngoài');
    G.wealth += qty * p; capLeft -= qty * p; expVal += qty * p;
  }
  G.trade.imp = impVal; G.trade.exp = expVal; G.trade.used = cap - capLeft;
  // 4) thuế chợ: 2% quá thuế + 3% trú thuế (KT §6), nhân hệ số phồn vinh
  const vol = retail + impVal + expVal, rate = LT.THUE_CHO[G.pol.cho].r;
  const pv = clamp(G.stat.phonvinh / 60, .35, 1.2);
  const tax = Math.min(vol * rate * (mk ? 1 : .3) * pv, G.wealth);
  if (tax > 0) { G.wealth -= tax; income(G, tax, 'Thuế chợ (' + LT.THUE_CHO[G.pol.cho].n + ')'); G.yr.cho += tax; }
  // thương hộ chuyên chở thuế quá cảnh (Kinh Nam…)
  const qc = natMod(G).quaCanh || 0;
  if (qc && mk) income(G, qc * .5, 'Thuế quá cảnh (ngã tư thương lộ)');
  { const ti = LT.transitIncome ? LT.transitIncome(G) : 0; if (ti > 0) { income(G, ti, 'Thuế quá cảnh (' + Math.round(LT.t2(G).transit * 1000) / 10 + '%)'); LT.t2(G).ledger.transit += ti; } }
  G.wealth = Math.max(0, G.wealth);
}

// ---- chi tiêu của quan phủ ---------------------------------------------------
function spend(G) {
  // bổng lộc thuộc lại: 15 quan/năm mỗi người (KT §8.5: ~60 quan cho vài thuộc lại)
  const sal = (G.H.quan || 0) * 10 / WY;
  if (sal > 0) { const p = take(G, 'tien', sal, 'Bổng lộc thuộc lại'); G.wealth += p * .7; G.yr.exp += p; if (p < sal - .01) { G.yr.unpaid += sal - p; G.flags.unpaid = true; } else G.flags.unpaid = false; }
  // bảo trì: 2% giá xây mỗi năm
  let val = 0; for (const b of G.bl) { const d = B[b.k]; if (!d || b.building || !d.c) continue; for (const r in d.c) val += d.c[r] * (LT.GOOD_PRICE_VAL[r] || 0); }
  const mt = val * .02 / WY; const p = take(G, 'tien', mt, 'Bảo trì công trình'); G.wealth += p * .8; G.yr.exp += p;
  // quân phí (KT §12): lương 0,05 quan + 0,06 thạch mỗi lính mỗi tuần; hương binh chỉ phụ cấp
  const n = LT.armyCount(G);
  if (n > 0) {
    const pay = n * LT.LINH_LUONG * (G.rank === 1 ? .15 : G.rank >= 4 ? .8 : 1), pt = take(G, 'tien', pay, 'Quân lương (' + n + ' lính)');
    G.wealth += pt * .5; G.yr.exp += pt;
    const food = LT.armyDemandWeek(G), got = LT.provideLuong(G, food, 'Quân ăn');
    G.foodShort = got < food - .01;
    if (pt < pay - .01 || got < food - .01) { G.armyUnpaid++; for (const u of G.units) { u.sk = Math.max(0, u.sk - 2); if (LT.rand(G) < .08) { const d = Math.ceil(u.n * .02); u.n = Math.max(0, u.n - d); LT.soldiersDied(G, u, d); } } if (G.armyUnpaid % 6 === 1) LT.log(G, 'Quân thiếu lương thực hoặc quân lương: sĩ khí tụt, lính đào ngũ!', 'bad'); }
    else G.armyUnpaid = 0;
  }
}

// ---- thường bình thương (KT §6) ----------------------------------------------
function thuongBinh(G) {
  if (!G.pol.thuongbinh || LT.count(G, 'granary') < 1) return;
  const p = G.price.luong, base = GOODS.luong.p, dl = LT.demandWeek(G).luong;
  if (p <= base * .8) { // rẻ: quan mua vào
    const target = LT.armyDemandWeek(G) * 30 + LT.demandWeek(G).luong * 6 + 150;   // chỉ trữ đến mức đủ nuôi quân và thuộc lại ~30 tuần
    const qty = Math.min(G.dan.luong * .05, G.res.tien * .15 / p, target - G.res.luong, LT.capOf(G, 'luong') - G.res.luong);
    if (qty > 1) { addDan(G, -qty, 'Thường bình thương mua vào'); add(G, 'luong', qty, 'Thường bình thương mua vào'); add(G, 'tien', -qty * p, 'Thường bình thương mua thóc'); G.wealth += qty * p; G.yr.tbtMua += qty * p; }
  } else if (p >= base * 1.25) { // đắt: quan bán ra, giữ kho cho quân 12 tuần
    const keep = LT.armyDemandWeek(G) * 12 + 60, qty = Math.min(Math.max(0, G.res.luong - keep), dl * 1.5);
    if (qty > 1) { const pay = Math.min(qty * p, G.wealth); const q2 = pay / p; take(G, 'luong', q2, 'Thường bình thương bán ra'); addDan(G, q2, 'Thường bình thương bán ra'); G.wealth -= pay; add(G, 'tien', pay, 'Thường bình thương bán thóc'); G.pend.tien += 0; G.yr.tbtBan += pay; G.yr.dtTBT += 1; }
  }
}

// ---- thuế (GP §5.4, KT §8) -----------------------------------------------------
LT.expectedHaThue = (G, mult) => { let t = 0; for (const c in LT.HA_THUE) t += (G.H[c] || 0) * LT.HA_THUE[c]; return t * (mult == null ? 1 : mult); };
LT.taxLevel = G => LT.TAX_LEVELS[G.pol.tax];
function taxFlee(G, lv, label) {
  if (lv.flee > 0) { const n = Math.max(1, Math.round(LT.totalHo(G) * lv.flee)); const lost = LT.loseHo(G, n, 'Hộ bỏ trốn vì thuế nặng'); if (lost) LT.log(G, lost + ' hộ bỏ trốn vì thuế ' + lv.n.toLowerCase() + '.', 'bad'); }
  G.stat.dantam = clamp(G.stat.dantam + lv.dt, 0, 100);
  if (lv.id === 4 && LT.rand(G) < .25) G.rebelRisk = (G.rebelRisk || 0) + 1;
}
function haThue(G) {
  const lv = LT.taxLevel(G);
  const due = LT.expectedHaThue(G, lv.mult) * (G.bocao.giamthue ? .75 : 1);
  const money = Math.min(due, G.wealth * .75);
  const sc = money < due * .8 ? ' — tiền hoang, dân không đủ tiền nộp' : '';
  G.wealth -= money; income(G, money, 'Hạ thuế (thu tiền, mức ' + lv.n + ')'); G.yr.thueTien += money;
  LT.log(G, 'Hạ thuế tháng 6: thu ' + Math.round(money) + ' quan (mức ' + lv.n + ')' + sc + '.', money < due * .8 ? 'bad' : 'good');
  taxFlee(G, lv);
  remit(G, 'Hạ thuế');
}
function thuThue(G) {
  const lv = LT.taxLevel(G), want = LT.THUE_THOC * G.yr.yield * lv.mult * (LT.pwTaxMul ? LT.pwTaxMul(G) : 1) * (G.bocao.giamthue ? .75 : 1) * (G.bocao.chieudan ? .95 : 1), got = Math.min(want, G.dan.luong * .6);
  addDan(G, -got, 'Dân nộp thóc'); add(G, 'luong', got, 'Thu thuế thóc (mức ' + lv.n + ')'); G.pend.luong += got; G.yr.thueThoc += got;
  LT.log(G, 'Thu thuế tháng 11: ' + Math.round(got) + ' thạch thóc (mức ' + lv.n + ').', 'good');
  taxFlee(G, lv);
  remit(G, 'Thu thuế');
}
// chia thuế ba phần: thượng cung + lưu sứ nộp lên, còn lại giữ
function remit(G, what) {
  const sp = LT.SPLIT[G.rank], rate = (sp[0] + sp[1]) * (LT.pwRemitMul ? LT.pwRemitMul(G) : 1);
  const pol = G.pol.nop, k = pol === 'du' ? 1 : pol === 'thieu' ? .5 : 0;
  const dueT = G.pend.tien * rate, dueL = G.pend.luong * rate;
  const payT = take(G, 'tien', dueT * k, 'Nộp thượng cung + lưu sứ (' + Math.round(rate * 100) + '%)');
  const payL = take(G, 'luong', dueL * k, 'Nộp thượng cung + lưu sứ (thóc)');
  G.yr.remitT += payT; G.yr.remitL += payL; G.yr.dueT += dueT; G.yr.dueL += dueL;
  const short = (dueT * k - payT) + (dueL * k - payL) * .4;
  if (k < 1) { G.nghiky = Math.min(100, G.nghiky + (k === 0 ? 14 : 7) * (LT.pwNghiMul ? LT.pwNghiMul(G) : 1)); LT.log(G, 'Bạn cố ý nộp thiếu cho bề trên: triều đình bắt đầu nghi kỵ.', 'bad'); }
  else if (short > 3) { G.nghiky = Math.min(100, G.nghiky + 5); LT.log(G, 'Kho không đủ để nộp đủ thượng cung và lưu sứ (' + Math.round(short) + ' quan thiếu) — bề trên nghi ngờ.', 'bad'); }
  G.wealth += 0; // tiền nộp lên rời khỏi thành (KT §9)
  LT.log(G, what + ': nộp ' + Math.round(payT) + ' quan + ' + Math.round(payL) + ' thạch (thượng cung ' + Math.round(sp[0] * 100) + '%, lưu sứ ' + Math.round(sp[1] * 100) + '%).', '');
  G.pend.tien = 0; G.pend.luong = 0;
}
LT.payQuota = function (G) { // nộp bù cho đủ định mức trước khảo khóa
  const miss = Math.max(0, G.yr.quota - (G.yr.remitT + G.yr.remitL * GOODS.luong.p));
  const pay = Math.min(miss, G.res.tien); if (pay <= 0) return 0;
  take(G, 'tien', pay, 'Nộp bù cho đủ định mức'); G.yr.remitT += pay; G.nghiky = Math.max(0, G.nghiky - 4); return pay;
};

// ---- quản lý hộ: tầng lớp, nhập cư, sinh đẻ -----------------------------------------
function households(G) {
  // 1) hộ thừa việc quay lại thành lưu dân
  for (const c of ['nong', 'cong', 'thuong', 'si', 'tang']) {
    const surplus = G.H[c] - slotsOf(G, c);
    if (surplus > 0) { const mv = Math.ceil(surplus * .15); G.H[c] -= mv; G.H.luu += mv; }
  }
  // 2) lưu dân vào chỗ trống theo tỉ lệ chỗ trống
  const freeSl = {}, tot = { v: 0 };
  for (const c of ['nong', 'cong', 'thuong', 'si', 'tang']) { freeSl[c] = Math.max(0, slotsOf(G, c) - G.H[c]); tot.v += freeSl[c]; }
  if (tot.v > 0 && G.H.luu > 0) {
    let budget = Math.min(G.H.luu, Math.max(2, Math.ceil(G.H.luu * .35))), left = budget;
    const cs = Object.keys(freeSl).filter(c => freeSl[c] > 0).sort((a, b) => freeSl[b] - freeSl[a]);
    for (const c of cs) { const share = Math.min(freeSl[c], Math.max(1, Math.round(budget * freeSl[c] / tot.v)), left); G.H[c] += share; G.H.luu -= share; left -= share; }
  }
  // 3) ấm no từng tầng lớp
  const lvl = G.pol.tax, tp = lvl > 2 ? .35 * (lvl - 2) : 0;
  for (const c of LT.CLASS_IDS) {
    if (!(G.H[c] > 0)) continue;
    const s = G.satc[c] == null ? 1 : G.satc[c];
    let p = G.prosper[c];
    if (s >= .97) p += .55 - tp + (lvl < 2 ? .15 * (2 - lvl) : 0); else if (s < .85) p -= (.85 - s) * 6 + .3; else p += (50 - p) * .01;
    G.prosper[c] = clamp(p, 0, 100);
    if (c !== 'luu' && c !== 'quan' && c !== 'binh' && G.prosper[c] < 15 && G.H[c] > 0) { const mv = Math.max(1, Math.round(G.H[c] * .03)); G.H[c] -= mv; G.H.luu += mv; if (G.tick % 12 === 0) LT.log(G, 'Hộ ' + LT.CLASSES[c].n + ' túng thiếu, tụt xuống lưu dân.', 'bad'); }
  }
  // 4) sinh đẻ và nhập cư (cần chỗ ở)
  const total = LT.totalHo(G), freeHouse = Math.max(0, G.city.cap - total);
  const st = G.stat, foodW = LT.foodWeeks(G);
  let jobsFree = 0; for (const c of ['nong', 'cong', 'thuong', 'si', 'tang']) jobsFree += Math.max(0, slotsOf(G, c) - G.H[c]);
  const attract = clamp((st.dantam - 28) / 40, 0, 1.5) * (foodW >= 10 ? 1 : .3) * (st.trian >= 30 ? 1 : .5) * (G.bocao.chieudan ? 1.6 : 1);
  G.fr.imm += (.5 + Math.min(4, .05 * jobsFree)) * attract;
  G.fr.birth += total * .0014 * (G.satc.luu > .95 ? 1 : .2) * (st.dantam > 35 ? 1 : .3);
  let arrive = Math.floor(G.fr.imm); G.fr.imm -= arrive;
  let born = Math.floor(G.fr.birth); G.fr.birth -= born;
  arrive = Math.min(arrive, freeHouse); born = Math.min(born, Math.max(0, freeHouse - arrive));
  if (arrive > 0) LT.addHo(G, arrive, 'luu', 'Lưu dân kéo đến'); if (born > 0) LT.addHo(G, born, 'luu', 'Sinh thêm hộ mới');
  G.yr.arrive += arrive + born;
  if (freeHouse <= 0 && attract > .5 && G.tick % 9 === 0) G.flags.homeless = true; else if (freeHouse > 0) G.flags.homeless = false;
  // 5) bỏ đi
  let leave = 0;
  if (st.dantam < 30) leave += total * .005 * (30 - st.dantam) / 30 * 2;
  if (total > G.city.cap) leave += (total - G.city.cap) * .05;
  const sl = G.sat.luong == null ? 1 : G.sat.luong;
  if (sl < .99) leave += total * .03 * (1 - sl);
  G.fr.leave += leave; const out = Math.floor(G.fr.leave); G.fr.leave -= out;
  if (out > 0) { const lost = LT.loseHo(G, out, sl < .99 ? 'Đói kém, dân bỏ đi' : 'Dân bỏ trốn / hết chỗ ở'); if (lost && sl < .99 && G.tick % 3 === 0) LT.log(G, 'Đói kém! ' + lost + ' hộ bỏ đi.', 'bad'); }
  if (st.phonvinh < 25 && G.H.thuong > 0) { G.fr.mer += G.H.thuong * .02; const m = Math.floor(G.fr.mer); if (m > 0) { G.fr.mer -= m; const mv = Math.min(m, G.H.thuong); G.H.thuong -= mv; LT.flowAdd(G, 'ho', -mv, 'Thương nhân bỏ đi (phồn vinh thấp)'); } }
}

// thăng tầng lớp hằng năm (GP §5.2: đủ nhu cầu lâu dài → lên tầng)
LT.yearlyPromotion = function (G) {
  const res = [];
  const tryMove = (from, to, frac, minPros) => {
    if (G.prosper[from] < minPros || !(G.H[from] > 0)) return;
    const freeSl = Math.max(0, slotsOf(G, to) - G.H[to]);
    const n = Math.min(freeSl, Math.max(1, Math.floor(G.H[from] * frac)));
    if (n > 0) { G.H[from] -= n; G.H[to] += n; res.push(n + ' hộ ' + LT.CLASSES[from].n + ' lên ' + LT.CLASSES[to].n); }
  };
  tryMove('nong', 'cong', .08, 60); tryMove('cong', 'thuong', .1, 60); tryMove('nong', 'si', .04, 65); tryMove('cong', 'si', .05, 65); tryMove('luu', 'tang', .1, 0);
  if (G.H.thuong >= 20 && G.stat.phonvinh >= 60 && G.prosper.thuong >= 65 && G.H.hao < 3 + G.H.thuong / 15) {
    const n = 1 + Math.floor(G.H.thuong / 40); G.H.thuong -= n; G.H.hao += n; res.push(n + ' hộ thương trở thành hào tộc');
  }
  if (res.length) LT.log(G, 'Cuối năm, hộ lên tầng: ' + res.join('; ') + '.', 'good');
  return res;
};

// ---- năm chỉ số của thành ---------------------------------------------------
function stats(G) {
  const st = G.stat, c = G.city, tot = LT.totalHo(G);
  const temples = G.bl.filter(b => b.k === 'temple' && !b.building && b.sr > 0).length;
  const mods = G.mods.reduce((a, m) => { a[m.k] = (a[m.k] || 0) + m.v; return a; }, {});
  const sl = G.sat.luong == null ? 1 : G.sat.luong;
  const monoN = Object.keys(G.pol.mono).filter(k => G.pol.mono[k]).length;
  let bocaoDT = 0; if (G.bocao.khuyennong) bocaoDT += 1; if (G.bocao.minhoan) bocaoDT += 1.5; if (G.bocao.chante) bocaoDT += 3;
  const avgP = LT.CLASS_IDS.reduce((a, k) => a + G.H[k] * G.prosper[k], 0) / Math.max(1, tot);
  const tax = [10, 5, 0, -10, -25][G.pol.tax];
  const ndt = (natMod(G).dt || 0);
  let dtT = 52 + Math.min(12, temples * 3) + (sl >= .99 ? 6 : -45 * (1 - sl)) + tax - monoN * 2 + bocaoDT + (G.pol.thuongbinh ? 2 : 0) + (avgP - 50) * .12 + (mods.dt || 0) + ndt - (G.lab.over > 0 ? Math.min(8, G.lab.over * .15) : 0);
  if (st.trian < 30) dtT -= 6;
  if (G.flags.unpaid) dtT -= 4;
  if (G.units.length && G.armyUnpaid > 4) dtT -= 4;
  dtT = clamp(Math.min(dtT, G.rank >= 5 ? 50 + G.chinhdanh / 2 : 100), 0, 100);
  const sold = LT.armyCount(G);
  let tT = 28 + 42 * c.watchCover + Math.min(12, sold / 25) + (st.dantam < 45 ? -(45 - st.dantam) * .4 : 0) + ((G.H.luu / Math.max(1, tot)) > .35 ? -8 : 0) + (mods.trian || 0) + ((G.off && G.off.bonus && G.off.bonus.trian) || 0) + (G.stat.phonvinh > 60 ? 3 : 0);
  if (G.flags.unpaid) tT -= 5;
  tT = clamp(tT, 0, 100);
  const crowd = tot / Math.max(1, c.cap) > .95 ? -8 : 0;
  let vT = 22 + 38 * c.wellCover + 22 * c.clinicCover + crowd + (mods.vesinh || 0) - Math.max(0, (tot - 600) / 200);
  vT = clamp(vT, 0, 100);
  const need = Math.max(1, tot * 1.2), moneyRatio = Math.min(1, G.wealth / need); G.moneyRatio = moneyRatio;
  const lux = ['tra', 'gom', 'lua', 'ruou'].filter(k => (G.res[k] || 0) > 1).length;
  let pT = 18 + 36 * c.marketCover + Math.min(14, c.paves / 6) + Math.min(10, c.roads / 10) + 4 * lux + Math.min(12, (G.H.thuong || 0) / 6) - (1 - moneyRatio) * 15 + (mods.phonvinh || 0);
  pT = clamp(pT, 0, 100);
  st.targets = { dantam: dtT, trian: tT, vesinh: vT, phonvinh: pT };
  st.dantam += (dtT - st.dantam) * .08; st.trian += (tT - st.trian) * .08; st.vesinh += (vT - st.vesinh) * .08; st.phonvinh += (pT - st.phonvinh) * .08;
  for (const k of ['dantam', 'trian', 'vesinh', 'phonvinh']) st[k] = clamp(st[k], 0, 100);
  G.mods = G.mods.filter(m => (m.w -= 1) > 0);
}
// hậu quả khi chỉ số tụt (GP §5.5)
function consequences(G) {
  const st = G.stat, r = () => LT.rand(G);
  if (st.dantam < 15) G.rebelRisk = (G.rebelRisk || 0) + .25; else if (st.dantam > 40 && G.rebelRisk > 0) G.rebelRisk = Math.max(0, G.rebelRisk - .1);
  if (st.trian < 35 && r() < .1) {
    const loss = Math.max(3, G.res.tien * .03); const l = take(G, 'tien', loss, 'Trộm cướp trong thành'); G.wealth = Math.max(0, G.wealth - l * .3);
    for (const k of ['muoi', 'vai', 'tra', 'gom', 'lua']) take(G, k, (G.res[k] || 0) * .04, 'Trộm cướp trong thành');
    LT.log(G, 'Trộm cướp hoành hành vì trị an thấp: mất ' + Math.round(l) + ' quan và ít hàng hóa.', 'bad');
  }
  if (st.trian < 22 && r() < .05) {
    const cand = G.bl.filter(b => b.k !== 'hall' && !b.building && b.k !== 'road' && b.k !== 'pave' && b.k !== 'wall');
    if (cand.length) { const b = cand[Math.floor(r() * cand.length)]; LT.place(G, 'del', b.x, b.y); LT.log(G, 'Cháy lớn! ' + B[b.k].n + ' bị thiêu rụi vì trị an buông lỏng.', 'bad'); G.fireFlash = { x: b.x, y: b.y }; }
  }
  const m = LT.month(G.week);
  if ((m === 7 || m === 8) && st.vesinh < 40 && G.plague > 0) {
    const lost = LT.loseHo(G, Math.max(1, Math.round(LT.totalHo(G) * .012 * G.plague * (1 - G.city.clinicCover * .5))), 'Dịch bệnh');
    G.stat.dantam = Math.max(0, G.stat.dantam - .8);
  }
  if (G.plague > 0 && (m < 7 || m > 9)) G.plague = 0;
}

// ---- tuần kinh tế ---------------------------------------------------------------
LT.econWeek = function (G) {
  G.flow.last = G.flow.cur; G.flow.cur = {};
  LT.recalcCity(G);
  LT.updatePrices(G);
  produce(G);
  consume(G);
  spend(G);
  thuongBinh(G);
  // hao hụt kho lương: 2%/quý, kho gạch 1%
  const hk = LT.HAO_HUT_KHO / 9 * (LT.count(G, 'granary') > 0 ? .5 : 1);
  if (G.res.luong > 0) take(G, 'luong', G.res.luong * hk, 'Hao hụt kho (mốc, chuột)');
  if (G.dan.luong > 0) addDan(G, -G.dan.luong * hk, 'Hao hụt kho dân (mốc, chuột)');
  // thuế
  if (G.week === LT.TAX_WEEK_HA) haThue(G);
  if (G.week === LT.TAX_WEEK_THU) thuThue(G);
  households(G);
  LT.recalcCity(G);
  stats(G);
  consequences(G);
  if (G.week === 35) LT.yearlyPromotion(G);
  G.lab.busy = false;
};

// ---- cảnh báo cho người chơi ----------------------------------------------------
LT.alerts = function (G) {
  const a = [], st = G.stat, fw = LT.foodWeeks(G);
  if (G.sat.luong != null && G.sat.luong < .99) a.push({ l: 2, t: 'Dân đang đói! Lương trong dân cạn — phát chẩn hoặc mở kho.' });
  else if (fw < 10) a.push({ l: 1, t: 'Kho lương chỉ còn đủ ' + Math.round(fw) + ' tuần (cần ' + LT.KHO_NEN + ').' });
  if (G.res.tien < 30) a.push({ l: G.res.tien < 8 ? 2 : 1, t: 'Ngân khố gần cạn (' + Math.round(G.res.tien) + ' quan).' });
  if (st.dantam < 35) a.push({ l: st.dantam < 20 ? 2 : 1, t: 'Dân tâm thấp (' + Math.round(st.dantam) + '): dân bỏ trốn, có thể nổi loạn.' });
  if (st.trian < 35) a.push({ l: 1, t: 'Trị an thấp (' + Math.round(st.trian) + '): trộm cướp, cháy lớn. Dựng trạm tuần.' });
  if (st.vesinh < 40) a.push({ l: 1, t: 'Vệ sinh thấp (' + Math.round(st.vesinh) + '): mùa hè có dịch. Dựng giếng, y quán.' });
  if (st.phonvinh < 28) a.push({ l: 1, t: 'Phồn vinh thấp (' + Math.round(st.phonvinh) + '): thương nhân bỏ đi. Dựng chợ, lát đường.' });
  for (const c of G.world.cities) if (c.mine && c.qt != null && c.id !== G.seatId) { const need = Math.max(20, Math.round(c.ho * .04)); if (c.qt < 45 && c.gar < need) a.push({ l: c.qt < 32 ? 2 : 1, t: 'Thành ' + c.n + ' sắp nổi loạn: quy thuận ' + Math.round(c.qt) + '/70, đồn trú ' + c.gar + '/' + need + '. Đặt đồn trú (Thiên hạ → Thành của bạn).' }); }
  if (G.flags.homeless) a.push({ l: 1, t: 'Hết chỗ ở — dân muốn đến nhưng không có nhà. Dựng thêm nhà dân.' });
  if (G.city.disconnected > 0) a.push({ l: 1, t: G.city.disconnected + ' công trình chưa nối đường tới kho/chợ (chỉ đạt 60%).' });
  if ((LT.count(G, 'forge') || LT.count(G, 'armory')) && G.res.quang < 12 && !LT.count(G, 'mine')) a.push({ l: 1, t: 'Lò rèn thiếu quặng sắt: xây 🪨 Mỏ sắt (nhóm Thủ công, cạnh Lò rèn) ở ô có mạch quặng đỏ gỉ — chọn công trình rồi bấm "Tới chỗ đặt gần nhất".' });
  const un = G.bl.filter(b => !b.building && B[b.k] && B[b.k].job && b.sr < .5).length;
  if (un > 0) a.push({ l: 0, t: un + ' công trình thiếu người làm — dựng thêm nhà cho lưu dân đến.' });
  if (G.nghiky >= 50) a.push({ l: 1, t: 'Triều đình nghi kỵ bạn (' + Math.round(G.nghiky) + '/100).' });
  return a;
};
})(typeof globalThis !== 'undefined' ? globalThis : window);

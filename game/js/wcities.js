'use strict';
// ============================================================================
// VÒNG 2 — 120 THÀNH CỦA THIÊN HẠ: bản đồ thành, quân số thật của các nước, đánh nhau bằng quân đó,
// các thành thuộc quyền (bảng số liệu, KT §13) với phương châm, quan trấn nhậm, tự chủ, tham ô, điều lương.
// Không đụng DOM.
// ============================================================================
(function (g) {
const LT = g.LT = g.LT || {};
const clamp = LT.clamp, NAT = LT.NATIONS;
const SYL = {
  bac: ['Thái', 'Vân', 'Hà', 'Tương', 'Ký', 'Lạc', 'Hằng', 'Nghiệp', 'Dự', 'Tuy', 'Thanh', 'Bình', 'Định', 'Thương', 'Bắc', 'Yển', 'Hứa', 'Tào', 'Vệ', 'Hoài', 'Hàm', 'Phần', 'Lộ', 'Trạch', 'Doanh', 'Uất', 'Hồ', 'Kế', 'Khánh', 'Tín'],
  tay: ['Lương', 'Hán', 'Kiếm', 'Miên', 'Ích', 'Tử', 'Vĩnh', 'Nhã', 'Kỳ', 'Thông', 'Quỳnh', 'Mi', 'Giản', 'Lục', 'Tuấn', 'Vị', 'Phù', 'Ba', 'Cẩm', 'Thục', 'Tây', 'Nam', 'Bảo', 'Đồng', 'Lâm', 'Tư', 'Mậu', 'Xương', 'Gia', 'Hợp'],
  dong: ['Dương', 'Hàng', 'Tô', 'Việt', 'Minh', 'Thai', 'Tín', 'Phúc', 'Tuyền', 'Chương', 'Nhuận', 'Thường', 'Hồ', 'Giang', 'Hải', 'Thạch', 'Vụ', 'Cối', 'Thọ', 'Ninh', 'Đài', 'Tuyên', 'Hấp', 'Dũng', 'Lỗ', 'Từ', 'Dư', 'Cối', 'Cúc', 'Ngân'],
  nam: ['Đàm', 'Hành', 'Quế', 'Ung', 'Quảng', 'Hưng', 'Thiều', 'Liễu', 'Dung', 'Giao', 'Ái', 'Phong', 'Nhai', 'Lạng', 'Cao', 'Tượng', 'Triều', 'Mai', 'Thủy', 'Sâm', 'Tân', 'Cảnh', 'Chu', 'Điền', 'Nghi', 'Ngạc', 'Lũng', 'Bạch', 'Khâm', 'Vũ'],
};
const SUF = ['Châu', 'Thành', 'Khẩu', 'Quan', 'Sơn', 'Lăng', 'Dương', 'Giang', 'Phủ', 'Đô', 'Hà', 'Môn'];
const REGION = ['bac', 'bac', 'bac', 'tay', 'dong', 'dong', 'dong', 'nam', 'nam', 'nam', 'bac', 'nam'];
const HO_BASE = [0, [500, 1300], [2500, 6000], [12000, 25000], [40000, 90000]];   // nằm dưới trần mỗi cấp thành (3.000 / 12.000 / 40.000 / 120.000)
LT.SOLDIER_PER_HO = 1.3;     // quân tối đa của một nước = tổng hộ × 1,0 (tương ứng tổng động viên ~20% hộ thành hộ binh)

LT.initCities = function (G) {
  const w = G.world, cs = w.cities = [], used = new Set();
  let cnt = 0;
  const nm = r => { for (let t = 0; t < 300; t++) { const n = LT.pick(G, SYL[r]) + ' ' + LT.pick(G, SUF); if (!used.has(n)) { used.add(n); return n; } } return SYL[r][0] + ' ' + (++cnt); };
  for (const N of NAT) {
    NAT.forEach(x => used.add(x.cap));
    const c = N.cities, n3 = Math.floor(c / 9), n2 = Math.floor(c / 3);
    for (let k = 0; k < c; k++) {
      const lvl = k === 0 ? (c >= 9 ? 4 : 3) : k <= n3 ? 3 : k <= n3 + n2 ? 2 : 1;
      const ang = k * 2.4 + LT.rand(G), r = k === 0 ? 0 : .03 * Math.sqrt(k) + LT.rand(G) * .015;
      const hb = HO_BASE[lvl], ho = Math.round((hb[0] + LT.rand(G) * (hb[1] - hb[0])) * (N.mod.ho || 1));
      cs.push({ id: cs.length, n: k === 0 ? N.cap : nm(REGION[N.id]), own: N.id, lvl, ho, dt: Math.round(52 + LT.rand(G) * 22), wall: Math.round(lvl * 16 + LT.rand(G) * 12 + (k === 0 ? 14 : 0)), gar: 0, grain: 0,
        x: clamp(N.x + Math.cos(ang) * r * 1.15, .02, .98), y: clamp(N.y + Math.sin(ang) * r, .03, .97), adj: [], mine: false, capital: k === 0, binh: 0 });
    }
  }
  for (const c of cs) { c.gar = Math.round(c.ho * (c.capital ? .1 : .05)); c.grain = Math.round(c.ho * 3); }
  // đồ thị đường đi: chỉ nối thành của hai nước khi hai nước giáp nhau (GP §3, bảng adj)
  const ok = (a, b) => a.own === b.own || NAT[a.own].adj.indexOf(b.own) >= 0;
  const link = (a, b) => { if (a.adj.indexOf(b.id) < 0) { a.adj.push(b.id); b.adj.push(a.id); } };
  for (const a of cs) {
    const near = cs.filter(b => b !== a && ok(a, b)).map(b => [Math.hypot(a.x - b.x, a.y - b.y), b]).sort((p, q) => p[0] - q[0]).slice(0, 3);
    for (const [, b] of near) link(a, b);
  }
  const comp = cs.map(c => c.id), find = i => { while (comp[i] !== i) { comp[i] = comp[comp[i]]; i = comp[i]; } return i; };
  for (const a of cs) for (const b of cs) if (a.adj.indexOf(b.id) >= 0) comp[find(a.id)] = find(b.id);
  const pairs = []; for (const a of cs) for (const b of cs) if (a.id < b.id && ok(a, b)) pairs.push([Math.hypot(a.x - b.x, a.y - b.y), a, b]);
  pairs.sort((p, q) => p[0] - q[0]);
  for (const [, a, b] of pairs) if (find(a.id) !== find(b.id)) { link(a, b); comp[find(a.id)] = find(b.id); }
  // thành trị sở của bạn: một huyện thành nhỏ của nước bạn chọn
  const mine = cs.filter(c => c.own === G.nation && c.lvl === 1);
  const seat = mine[Math.floor(LT.rand(G) * mine.length)] || cs.find(c => c.own === G.nation);
  seat.mine = true; seat.seat = true; seat.ho = LT.totalHo(G); seat.lvl = 1; seat.dt = 58; G.seatId = seat.id;
  w.capIds = NAT.map(n => cs.find(c => c.own === n.id && c.capital).id);
  // quân số thật các nước
  for (const ns of w.ns) { ns.mob = ns.id < 12 ? .55 + LT.rand(G) * .15 + (NAT[ns.id].chr === 'hiếu chiến' ? .12 : 0) : .6; ns.troops = 0; }
  LT.syncNations(G); for (const ns of w.ns) ns.troops = Math.round(LT.natMaxTroops(G, ns.id) * ns.mob);
};
LT.city = (G, id) => G.world.cities[id];
LT.natCityList = (G, nid) => G.world.cities.filter(c => c.own === nid);
LT.natHo = (G, nid) => G.world.cities.reduce((a, c) => a + (c.own === nid ? c.ho : 0), 0);
LT.natMaxTroops = (G, nid) => Math.round(LT.natHo(G, nid) * LT.SOLDIER_PER_HO);
LT.natGarrison = (G, nid) => G.world.cities.reduce((a, c) => a + (c.own === nid ? c.gar : 0), 0);
LT.natField = (G, nid) => Math.max(0, Math.round(G.world.ns[nid].troops - LT.natGarrison(G, nid)));
LT.syncNations = function (G) {
  const w = G.world, cs = w.cities;
  for (const ns of w.ns) { ns.cities = 0; }
  for (const c of cs) { if (c.own < w.ns.length) w.ns[c.own].cities++; }
  for (const ns of w.ns) {
    ns.alive = ns.cities > 0;
    const mx = Math.max(1, LT.natMaxTroops(G, ns.id));
    ns.army = clamp(Math.round(ns.troops / mx * 100 * Math.min(1.5, .5 + mx / 120000)), 5, 99);
    if (!ns.alive) ns.troops = 0; else ns.troops = Math.min(ns.troops || 0, mx * 1.05);
  }
};
LT.ownedCities = G => G.world.cities.filter(c => c.mine && c.id !== G.seatId);
LT.mineCount = G => G.world.cities.reduce((a, c) => a + (c.mine ? 1 : 0), 0);
LT.mineCountLvl = (G, lvl) => G.world.cities.reduce((a, c) => a + (c.mine && (c.id === G.seatId ? (G.seatLvl || 1) : c.lvl) >= lvl ? 1 : 0), 0);
LT.cityHops = function (G, from, to) { // số chặng đường ngắn nhất
  const cs = G.world.cities, d = new Int16Array(cs.length).fill(-1), q = [from]; d[from] = 0;
  for (let i = 0; i < q.length; i++) { const c = cs[q[i]]; for (const n of c.adj) if (d[n] < 0) { d[n] = d[q[i]] + 1; if (n === to) return d[n]; q.push(n); } }
  return d[to];
};
LT.hopsToSeat = (G, id) => { const h = LT.cityHops(G, G.seatId, id); return h < 0 ? 9 : h; };

// ---- biến một thành thành thành thuộc quyền (giữ cả khi thăng chức) ------------------------------------
LT.manage = function (G, c) {
  c.mine = true; c.pc = c.pc || 'nong'; c.nop = c.nop || .6; c.chinh = c.chinh || 45 + Math.floor(LT.rand(G) * 30); c.trung = c.trung || 55 + Math.floor(LT.rand(G) * 35);
  c.tamo = c.tamo != null ? c.tamo : .03 + LT.rand(G) * .09; c.auto = c.auto || 10; c.binh = c.binh || 0; c.last = c.last || 0; c.tan = c.tan || 0; c.giam = !!c.giam; c.ship = !!c.ship; c.lowtax = c.lowtax || 0;
  c.dist = LT.hopsToSeat(G, c.id); c.quan = c.quan || null; c.base = c.base || c.ho;
};
LT.grantCities = function (G, n, minLvl, maxLvl) {
  const out = [], cs = G.world.cities, seat = cs[G.seatId];
  const cand = cs.filter(c => !c.mine && c.own === G.nation && c.lvl >= minLvl && c.lvl <= maxLvl).sort((a, b) => Math.hypot(a.x - seat.x, a.y - seat.y) - Math.hypot(b.x - seat.x, b.y - seat.y));
  for (const c of cand.slice(0, n)) { LT.manage(G, c); out.push(c); }
  return out;
};
LT.transferCity = function (G, id, newOwn) {
  const c = G.world.cities[id], old = c.own; c.own = newOwn;
  if (newOwn === G.nation || newOwn === 12) { /* của bạn hoặc nước bạn */ }
  LT.syncNations(G); return old;
};

// ---- nhịp tuần của thế giới thành ---------------------------------------------------------------------
LT.citiesWeek = function (G) {
  const w = G.world, cs = w.cities, wk = G.week;
  const seat = cs[G.seatId]; seat.ho = LT.totalHo(G) - G.H.binh; seat.binh = G.H.binh; seat.lvl = G.seatLvl; seat.dt = G.stat.dantam; seat.wall = G.stat.thanhphong;
  const monthly = G.week % 3 === 0, quarter = G.week % 9 === 0;
  let foodNeed = LT.foodWeeks(G) < 12 ? Math.max(0, (LT.demandWeek(G).luong * 16) - G.dan.luong) : 0;
  for (const c of cs) {
    if (c.id === G.seatId) continue;
    if (!c.mine) { // thành các nước máy: động viên, dân số, tồn lương
      if (quarter) c.ho = Math.min(LT.CITY_LEVELS[c.lvl].cap, Math.round(c.ho * (1 + .004 * (c.dt - 40) / 20)));
      c.gar = c.qt != null ? c.gar : Math.min(Math.round(c.ho * (c.capital ? .12 : .06)), c.gar + Math.max(1, Math.round(c.ho * .002)));
      c.grain = Math.min(c.ho * 6, c.grain + c.ho * .12);
      continue;
    }
    // ---- thành của bạn (bảng số liệu) ----
    const m = c.binh / Math.max(1, c.ho + c.binh);
    const dtT = 55 + (c.pc === 'nong' ? 3 : c.pc === 'tanthu' ? -18 : c.pc === 'coThu' ? 4 : 0) + (c.nop > .75 ? -9 : c.nop < .5 ? 6 : 0) - m * 90 - c.tamo * 40 + (c.tan > 0 ? -12 : 0) + (c.lowtax > 0 ? 6 : 0) + (c.chinh - 55) * .15;
    c.dt = clamp(c.dt + (dtT - c.dt) * .06, 0, 100);
    if (c.tan > 0) c.tan--;
    c.lowtax = Math.max(0, c.lowtax - 1);
    if (quarter) {
      const grow = c.pc === 'nong' ? .014 : c.pc === 'thuong' ? .008 : c.pc === 'coThu' ? 0 : c.pc === 'tanthu' ? -.012 : .005;
      c.base = c.base || c.ho; const refill = grow > 0 ? (c.base * 1.5 - c.ho) * .035 * (c.dt / 60) : 0;
      c.ho = Math.max(60, Math.min(LT.CITY_LEVELS[c.lvl].cap, Math.round(c.ho * (1 + (grow > 0 ? grow * .5 : grow) + (c.dt - 50) / 3000) * (1 - m * .05) + refill)));
      if (c.pc === 'tanthu') { c.tanN = (c.tanN || 0) + 1; if (c.tanN > 8) c.dt = clamp(c.dt - 3, 0, 100); } else c.tanN = 0;
      if (c.pc === 'coThu') c.wall = Math.min(100, c.wall + 3);
      c.ho += Math.round(c.binh * .0); // lính chết đã trừ ở chiến trận
    }
    c.gar = c.qt != null ? Math.min(Math.max(c.gar, Math.round(c.ho * .02)), c.gar + 1) : Math.min(Math.round(c.ho * .05), c.gar + Math.max(1, Math.round(c.ho * .002)));
    // tự chủ (CT §6.5): xa, lâu không luân chuyển, tướng nhiều quân ⇒ tự chủ cao; giám quân và thăm viếng ⇒ thấp
    c.auto = clamp(c.auto + (.06 + .05 * c.dist + (c.nop > .75 ? .05 : 0) + (c.binh > 0 ? .03 : 0)) * (c.giam ? .45 : 1) - G.player.uyvong / 2500 + (c._autoAdd || 0), 0, 100);
    c.tamo = clamp(c.tamo + (c.auto > 60 ? .0006 : -.0001), .01, .25);
    c.grain = Math.min(c.ho * 10, c.grain + c.ho * ((c.pc === 'nong' ? .38 : c.pc === 'thuong' ? .27 : .31) - .15) * (1 - Math.min(.8, m * 1.2)) - c.gar * LT.LINH_AN * .3);
    if (c.giam && wk === 1) { const p = Math.min(G.res.tien, 8); G.res.tien -= p; LT.flowAdd(G, 'tien', -p, 'Giám quân ở ' + c.n); }
    // điều lương về trị sở
    if (c.ship && foodNeed > 0) { const send = Math.min(c.grain * .15, foodNeed / 2), got = send * (1 - .08 * c.dist); if (got > 0) { c.grain -= send; G.dan.luong += got; foodNeed -= got; LT.flowAdd(G, 'dluong', got, 'Điều lương từ ' + c.n); } }
    // nộp thuế hai kỳ
    if (wk === LT.TAX_WEEK_HA || wk === LT.TAX_WEEK_THU) {
      const gross = LT.cityYear(c) / 2, chi = gross * .35;
      let ship = (gross - chi) * c.nop * Math.max(.3, 1 - .03 * c.dist) * (1 - c.tamo) * (c.lowtax > 0 ? .45 : 1) * (c.auto > 70 ? .6 : 1) * (1 - Math.min(.9, m * 1.2)) * (c.quan ? 1 : .6);
      if (G.pol.nop === 'thieu') ship *= 1;
      c.last = ship; G.res.tien += ship; G.yr.rev += ship; G.pend.tien += ship; LT.flowAdd(G, 'tien', ship, 'Các thành thuộc quyền nộp về');
      if (c.nop > .75) c.dt = clamp(c.dt - 3, 0, 100);
    }
    // ly khai
    if (c.auto > 85 && c.trung < 45 && LT.rand(G) < .02 && G.rank >= 3) {
      LT.log(G, 'Thành ' + c.n + ' ly khai! Quan trấn nhậm ' + ((LT.offById(G, c.quan) || {}).name || '') + ' trở mặt, theo nước khác.', 'bad'); if (LT.offDefect) LT.offDefect(G, c);
      const to = NAT[G.nation].adj.filter(j => w.ns[j].alive)[0]; c.mine = false; c.own = to != null ? to : G.nation; c.auto = 30; LT.syncNations(G); if (LT.addChron) LT.addChron(G, 'Thành ' + c.n + ' ly khai khỏi tay bạn.');
    }
    if (c.dt < 15 && LT.rand(G) < .02) { c.ho = Math.round(c.ho * .96); }
  }
  G.orders.left = G.orders.max = 2 + Math.floor(G.player.chinh / 20) + (G.rank >= 4 ? 2 : 0);
  if (G.week === 1) for (const ns of w.ns) if (ns.alive && ns.id < 12) ns.mob = Math.min(.95, ns.mob + .012);   // các nước dần tăng động viên
  if (quarter) { // quân các nước phục hồi dần về mức động viên
    for (const ns of w.ns) if (ns.alive) { const tg = LT.natMaxTroops(G, ns.id) * ns.mob, atWar = (G.camp && G.camp.nation === ns.id) ? 1.0 : 0; ns.troops += (Math.max(tg, atWar ? LT.natMaxTroops(G, ns.id) * .9 : 0) - ns.troops) * .06; }
  }
  LT.syncNations(G);
};
// ---- hậu cần: đại quân ăn từ tồn lương các thành thuộc quyền, hao 8% mỗi chặng ----
LT.hopsFrom = function (G, id) { const cs = G.world.cities, d = new Int16Array(cs.length).fill(-1), q = [id]; d[id] = 0; for (let i = 0; i < q.length; i++) for (const n of cs[q[i]].adj) if (d[n] < 0) { d[n] = d[q[i]] + 1; q.push(n); } return d; };
LT.cityFood = function (G, need) {
  const ref = G.camp ? G.camp.target : G.seatId, hops = LT.hopsFrom(G, ref); let got = 0;
  const list = G.world.cities.filter(c => c.mine && c.id !== G.seatId && c.grain > 100).map(c => ({ c, h: Math.max(0, hops[c.id]) })).sort((a, b) => a.h - b.h);
  for (const { c, h } of list) { if (got >= need - .01) break; const eff = Math.max(.3, 1 - .08 * h), take = Math.min(c.grain * .6, (need - got) / eff); c.grain -= take; got += take * eff; LT.flowAdd(G, 'luong', take * eff, 'Tồn lương ' + c.n + ' (hao ' + Math.round((1 - eff) * 100) + '%)'); }
  return got;
};
LT.logistics = function (G, tid) {
  const hops = LT.hopsFrom(G, tid), cs = G.world.cities, weekly = LT.armyDemandWeek(G) * 1.06;
  const src = [{ n: 'Kho quan', v: G.res.luong }, { n: 'Kho dân (quan mua theo giá chợ)', v: G.dan.luong * .6 }];
  for (const c of cs) if (c.mine && c.id !== G.seatId) { const h = Math.max(0, hops[c.id]), eff = Math.max(.3, 1 - .08 * h); src.push({ n: c.n + ' (' + h + ' chặng, hao ' + Math.round((1 - eff) * 100) + '%)', v: c.grain * .6 * eff }); }
  const have = src.reduce((a, x) => a + x.v, 0), weeks = weekly > 0 ? have / weekly : 99, c = cs[tid], from = cs.filter(x => x.mine && x.adj.indexOf(tid) >= 0)[0];
  const march = from ? clamp(Math.ceil(Math.hypot(from.x - c.x, from.y - c.y) * 70), 2, 9) : 4, need = march + 12;
  return { weekly, have, weeks, march, need, ok: weeks >= need, okMarch: weeks >= march, sources: src.sort((a, b) => b.v - a.v).slice(0, 6) };
};
LT.cityYear = function (c) { const pc = LT.PHUONG_CHAM[c.pc].mul * (1 + .03 * (c.mkt || 0)); return c.ho * 1.7 * pc * (.6 + c.chinh / 250) * (c.dt / 70); };   // năng suất gốc 1,7 quan/hộ/năm (chợ, muối, trà, thủ công; tài liệu để ngỏ)
LT.cityOrderUse = function (G, n) { if (G.rank < 4) return true; if (G.orders.left < (n || 1)) return false; G.orders.left -= (n || 1); return true; };
LT.cityPolicy = function (G, id, k, v) {
  const c = G.world.cities[id]; if (!c || !c.mine) return { ok: false, err: 'Không phải thành của bạn' };
  if (!LT.cityOrderUse(G, 1)) return { ok: false, err: 'Hết chính lệnh tuần này (' + G.orders.max + ' mỗi tuần)' };
  c[k] = v; return { ok: true };
};
LT.rotateOfficial = function (G, id) {
  const c = G.world.cities[id]; if (!c || !c.mine) return { ok: false, err: 'Không phải thành của bạn' };
  if (G.res.tien < 20) return { ok: false, err: 'Cần 20 quan lộ phí luân chuyển' };
  if (!LT.cityOrderUse(G, 1)) return { ok: false, err: 'Hết chính lệnh tuần này' };
  G.res.tien -= 20; LT.flowAdd(G, 'tien', -20, 'Luân chuyển quan'); c.auto = Math.max(0, c.auto - 30); c.tamo = Math.max(.02, c.tamo * .7);
  if (LT.offDismiss && c.quan) { LT.offDismiss(G, c.quan); c.vacant = false; c.quan = null; c.chinh = 0; c.trung = 0; LT.offEnsure(G, c, 'trieudinh'); if (LT.offLog) LT.offLog(G, c, 'Triều đình luân chuyển quan: ' + (LT.offById(G, c.quan) || {}).name + ' nhận chức.', null); }
  return { ok: true };
};
LT.inspectCity = function (G, id) { // ngự sử thanh tra
  const c = G.world.cities[id]; if (!c || !c.mine) return { ok: false, err: 'Không phải thành của bạn' };
  if (G.res.tien < 30) return { ok: false, err: 'Cần 30 quan' };
  G.res.tien -= 30; LT.flowAdd(G, 'tien', -30, 'Ngự sử thanh tra'); const was = c.tamo; c.tamo = Math.max(.01, c.tamo * .4); c.dt = clamp(c.dt - 2, 0, 100);
  const oi = LT.offInspect ? LT.offInspect(G, c).text : '';
  return { ok: true, text: 'Ngự sử tra ' + c.n + ': tham ô phát hiện ' + Math.round(was * 100) + '% → ' + Math.round(c.tamo * 100) + '%.' + oi };
};

// ---- chiến tranh giữa các nước máy bằng quân thật ------------------------------------------------------
LT.aiWar = function (G) {
  const w = G.world, cs = w.cities;
  for (let k = 0; k < 3; k++) {
    const alive = w.ns.filter(n => n.alive && n.id !== 12 && n.id < 12);
    const agg = { 'hiếu chiến': 1.0, 'phản trắc': .55, 'thủ thành': .12, 'trọng thương': .2 };
    const atk = alive[Math.floor(LT.rand(G) * alive.length)]; if (LT.rand(G) > agg[NAT[atk.id].chr] * .85) continue;
    const pairs = []; for (const a of cs) if (a.own === atk.id && !a.mine) for (const bi of a.adj) { const b = cs[bi]; if (b.own !== atk.id && !b.mine && b.own < 12 && w.ns[b.own].alive) pairs.push([a, b]); }
    if (!pairs.length) continue;
    const [a, b] = pairs[Math.floor(LT.rand(G) * pairs.length)], def = w.ns[b.own];
    if (b.own === G.nation && LT.natCityList(G, G.nation).length <= 3) continue;
    const size = LT.natField(G, atk.id) * (.3 + LT.rand(G) * .3), D = (b.gar + LT.natField(G, b.own) * .35) * (1 + b.wall / 220);
    const pWin = size / (size + D * 1.2);
    const win = LT.rand(G) < pWin;
    const lossA = Math.round(size * (win ? .1 : .28) * (.4 + D / (size + D))), lossD = Math.round((b.gar + LT.natField(G, b.own) * .35) * (win ? .5 : .12));
    atk.troops = Math.max(0, atk.troops - lossA); def.troops = Math.max(0, def.troops - lossD); b.gar = Math.max(0, b.gar - Math.round(lossD * .5));
    if (win) {
      LT.transferCity(G, b.id, atk.id); b.ho = Math.round(b.ho * .85); b.dt = 40; b.wall = Math.round(b.wall * .5); b.gar = Math.round(b.ho * .03);
      if (LT.addChron) LT.addChron(G, LT.natName(G, atk.id) + ' (' + LT.fmtN(size) + ' quân) hạ ' + b.n + ' của ' + LT.natName(G, def.id) + '; hai bên thương vong ' + LT.fmtN(lossA) + ' / ' + LT.fmtN(lossD) + '.');
      if (!def.alive || def.cities === 0) { def.alive = false; def.troops = 0; if (LT.addChron) LT.addChron(G, LT.natName(G, def.id) + ' bị ' + LT.natName(G, atk.id) + ' diệt.'); }
      if (size + lossD > 100000 && LT.addChron) LT.addChron(G, 'Một trận đại chiến hơn 100.000 quân đã diễn ra quanh ' + b.n + '.');
    } else if (LT.addChron) LT.addChron(G, LT.natName(G, atk.id) + ' đánh ' + b.n + ' của ' + LT.natName(G, def.id) + ' nhưng bị đẩy lui (mất ' + LT.fmtN(lossA) + ' quân).');
    w.rel[b.own] = clamp(w.rel[b.own] - 1, -100, 100);
  }
  LT.syncNations(G);
};
// ---- DỜI TRỊ SỞ (GP §8): sang thành lớn hơn, xây tay trên bản đồ mới sinh theo thành đó; thành cũ thành bảng số liệu ----
LT.relocateOptions = G => G.rank < 2 || G.camp || G.pendingBattle ? [] : G.world.cities.filter(c => c.mine && c.id !== G.seatId && c.lvl > G.seatLvl);
LT.autoSettle = function (G, ho, lvl) {
  const hx = G.hx, hy = G.hy, N = LT.N, cx = hx + 1, cy = hy + 1, R = 34;
  const near = [];
  for (let y = Math.max(1, cy - R); y < Math.min(N - 1, cy + R); y++) for (let x = Math.max(1, cx - R); x < Math.min(N - 1, cx + R); x++) { const d = Math.hypot(x - cx, y - cy); if (d <= R) near.push([d, x, y]); }
  near.sort((a, b) => a[0] - b[0]);
  const P = (k, x, y) => { if (LT.canPlace(G, k, x, y, true) !== '') return null; const r = LT.place(G, k, x, y, { free: true, instant: true, defer: true }); return r.ok ? r.b : null; };
  const isRd = (x, y) => (((x - hx) % 6 + 6) % 6 === 2) || (((y - hy) % 6 + 6) % 6 === 3);
  for (const [, x, y] of near) if (isRd(x, y)) P('road', x, y);
  const adjRoad = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([i, j]) => { const q = LT.tileAt(G, x + i, y + j); return q && q.b && q.b.k === 'road'; });
  const spots = near.filter(([, x, y]) => !isRd(x, y) && adjRoad(x, y)).map(a => [a[1], a[2]]);
  const tier = lvl >= 3 ? 'mansion' : lvl === 2 ? 'terrace' : 'house', capK = LT.B[tier].cap, nHouse = Math.ceil(ho * 1.12 / capK);
  const nFarm = Math.min(40, Math.ceil(ho * .5 / 90));
  const plan = [['granary', 2], ['market', 3], ['well', 6], ['watch', 4], ['clinic', 1], ['school', 1], ['temple', 1], ['barracks', 2], [tier, nHouse], ['farm', nFarm]];
  let si = 0, farms = 0, houses = 0, staffSi = 0;
  for (const [k, n] of plan) for (let i = 0; i < n && si < spots.length;) { const [x, y] = spots[si++]; const b = P(k, x, y); if (b) { i++; if (k === 'farm') farms++; if (LT.HOUSEK[k]) houses++; } }
  LT.recalcCity(G);
  const nong = Math.min(farms * 20 + 40, Math.round(ho * .42)), cong = Math.round(ho * .12), thuong = Math.round(ho * .06), si2 = Math.round(ho * .012), tang = Math.round(ho * .006);
  G.H = { luu: Math.max(0, ho - nong - cong - thuong - si2 - tang - 3), nong, cong, thuong, si: si2, tang, binh: 0, quan: 3, hao: 0 };
  G.dan.luong = Math.round(ho * 5.4 * .6); G.wealth = Math.round(ho * 2.2);
  for (const b of G.bl) { if (b.k === 'farm') b.acc = 0; }
  LT.recalcCity(G);
};
LT.relocate = function (G, id) {
  const opt = LT.relocateOptions(G).find(c => c.id === id); if (!opt) return { ok: false, err: 'Không dời được sang thành này (cần thành của bạn, cấp cao hơn trị sở hiện tại, không đang có chiến dịch/trận)' };
  const w = G.world, old = w.cities[G.seatId], nw = opt;
  // thành cũ → bảng số liệu, giữ nguyên dân số, quân đồn trú, thành phòng, lương
  const archive = G.archive || (G.archive = {}); archive[old.id] = { bl: G.bl.map(b => Object.assign({}, b)), seatNo: G.seatNo || 0, hx: G.hx, hy: G.hy };
  old.seat = false; old.ho = Math.max(60, LT.totalHo(G) - G.H.binh); old.binh = G.H.binh; old.lvl = G.seatLvl; old.dt = G.stat.dantam; old.wall = G.stat.thanhphong; old.gar = Math.round(old.ho * .05); old.grain = Math.round(G.dan.luong * .5 + G.res.luong * .1); old.base = old.ho; old.seatNo = G.seatNo || 0;
  LT.manage(G, old); old.chinh = Math.max(old.chinh, G.player.chinh - 10); old.ship = true; old.lowtax = 0; old.tan = 0;
  for (const u of G.units) if (u.from == null) u.from = old.id;
  // thành mới → trị sở
  const ho = Math.min(nw.ho, [0, 1500, 4000, 9000, 16000][nw.lvl]);
  nw.seat = true; nw.ho = Math.max(60, nw.ho - ho); G.seatId = nw.id; G.seatLvl = nw.lvl; G.seatNo = nw.seatNo != null ? nw.seatNo : (G.maxSeatNo = (G.maxSeatNo || 0) + 1);
  nw.seatNo = G.seatNo; nw.binh = 0; nw.tan = 0;
  G.bl = []; G.nextId = 1; G.units.forEach(u => { if (u.from == null) u.from = old.id; });
  G.map = []; LT.genMap(G, G.nation);
  const hall = { id: G.nextId++, k: 'hall', x: G.hx, y: G.hy, w: 2, h: 2, building: false, progress: 1 }; G.bl.push(hall); for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) LT.tileAt(G, G.hx + i, G.hy + j).b = hall;
  const arc = archive[nw.id];
  if (arc && arc.seatNo === G.seatNo) { for (const b0 of arc.bl) { if (b0.k === 'hall') continue; const b = Object.assign({}, b0); b.id = G.nextId++; G.bl.push(b); const q = LT.tileAt(G, b.x, b.y); if (q) q.b = b; } LT.recalcCity(G); const keep = ho; LT.autoSettleHouseholds(G, keep); }
  else LT.autoSettle(G, ho, nw.lvl);
  G.flow = LT.newFlow(); G.lab.used = 0; G.lab.budget = LT.laoDichBudget(G); G.formation = null; LT.ensureFormation(G);
  G.stat.thanhphong = Math.max(0, Math.round(G.city.wallPts)); G.stat.dantam = Math.max(G.stat.dantam, 50);
  LT.recalcCity(G); LT.updatePrices(G); LT.syncNations(G);
  LT.log(G, 'DỜI TRỊ SỞ: từ nay bạn trị ' + nw.n + ' (' + LT.CITY_LEVELS[nw.lvl].n + ', ' + LT.fmtN(ho) + ' hộ). Thành cũ ' + old.n + ' thành bảng số liệu, giữ nguyên ' + LT.fmtN(old.ho) + ' hộ.', 'good');
  LT.addChron(G, 'Bạn dời trị sở sang ' + nw.n + '.');
  return { ok: true, from: old.n, to: nw.n, ho };
};
LT.autoSettleHouseholds = function (G, ho) { const nong = Math.min(G.city.farms * 20 + 40, Math.round(ho * .42)), cong = Math.round(ho * .12), thuong = Math.round(ho * .06), si = Math.round(ho * .012), tang = Math.round(ho * .006); G.H = { luu: Math.max(0, ho - nong - cong - thuong - si - tang - 3), nong, cong, thuong, si, tang, binh: 0, quan: 3, hao: 0 }; G.dan.luong = Math.round(ho * 5.4 * .6); G.wealth = Math.round(ho * 2.2); };
LT.PHUONG_CHAM = {
  nong: { n: 'Khuyến nông', mul: 1.25, d: 'Lương +25%, dân tăng nhanh' },
  thuong: { n: 'Hưng thương', mul: 1.15, d: 'Thuế chợ, hàng hóa +30%, lương −10%' },
  luyen: { n: 'Luyện binh', mul: .85, d: 'Mộ lính nhanh, thuế −15%' },
  coThu: { n: 'Cố thủ', mul: .9, d: 'Xây thành phòng, trữ lương; không tăng trưởng' },
  tanthu: { n: 'Tận thu', mul: 1.4, d: 'Thuế +40% trong 2 năm, sau đó dân bỏ đi' },
};
})(typeof globalThis !== 'undefined' ? globalThis : window);

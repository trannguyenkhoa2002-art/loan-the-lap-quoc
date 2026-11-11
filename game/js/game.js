'use strict';
// ============================================================================
// KHỞI TẠO VÁN, NHỊP TUẦN, LƯU / TẢI. Không đụng DOM (chỉ dùng localStorage khi gọi save/load).
// ============================================================================
(function (g) {
const LT = g.LT = g.LT || {};
const SAVE_KEY = 'loan-the-lap-quoc-v2', SAVE_KEY_OLD = 'loan-the-lap-quoc-v1', SAVE_VER = 8;

LT.newYearLedger = () => ({ rev: 0, exp: 0, yield: 0, leave: 0, arrive: 0, thueTien: 0, thueThoc: 0, cho: 0, mono: 0, remitT: 0, remitL: 0, dueT: 0, dueL: 0, quota: 0, hoStart: 0, tbtMua: 0, tbtBan: 0, dtTBT: 0, unpaid: 0 });

LT.newGame = function (nation, name, seed) {
  const nm = LT.NATIONS[nation], mod = nm.mod, sc = LT.DIFF_START[nm.diff];
  const G = {
    ver: SAVE_VER, nation, name: name || 'Vô danh', seed: seed || 1234 + nation, rs: (seed || 1234) + nation * 977,
    rank: 1, era: 1, year: LT.START_YEAR, week: 1, tick: 0, speed: 0, acc: 0,
    hx: 55, hy: 55, seatLvl: 1, nextId: 1, bl: [], map: [], free: {},
    res: { tien: Math.round(780 * sc * mod.tien), luong: Math.round(260 * sc * mod.luong), go: 240, da: 140, quang: 24, nongcu: 6, vai: 24, ken: 0, lua: 0, tra: 0, gom: 0, ruou: 0, binhkhi: 60, giap: 0, ngua: 0, muoi: 24 },
    dan: { luong: Math.round(620 * sc * mod.luong) },
    H: { luu: 18, nong: 82, cong: 0, thuong: 0, si: 0, tang: 0, binh: 20, quan: 3, hao: 0 },
    prosper: { binh: 50, luu: 50, nong: 55, cong: 50, thuong: 50, si: 50, tang: 50, quan: 50, hao: 50 },
    stat: { dantam: 58 + (mod.dt || 0), trian: 48, vesinh: 46, phonvinh: 34, thanhphong: 0 },
    off: null, trade2: null, pol: { tax: 2, cho: 1, mono: { muoi: false, tra: false, ruou: false }, thuongbinh: false, camruou: false, laodich: 'phu', nop: 'du' },
    lab: { used: 0, budget: 300, hired: 0, over: 0, busy: false },
    flow: LT.newFlow(), yr: LT.newYearLedger(), pend: { tien: 0, luong: 0 }, price: {}, sat: {}, satc: {}, trade: { cap: 0, imp: 0, exp: 0, used: 0 },
    fr: { imm: 0, birth: 0, leave: 0, mer: 0 }, flags: {}, mods: [], bocao: {}, bocaoList: [], treaties: { thongthuong: [], batxam: [], muonduong: [], hoathan: [], lienminh: [], xungthan: [] },
    units: [], gens: [], formation: null, log: [], weather: { mul: 1, kind: '' }, plague: 0, nghiky: 0, armyUnpaid: 0, rebelRisk: 0,
    player: { tong: 45, vo: 35, tri: 62, chinh: 70, duc: 58, thanhdanh: 30, uyvong: 20, tin: 50 },
    khao: { history: [], thuong: 0, low: 0, passed: false, exam: null }, quanCong: 0, wins: 0, loan: 0,
    wealth: 0, wealthStart: 0, toolRatio: 1, moneyRatio: 1,
    orders: { left: 2, max: 2 }, chinhdanh: 30, rankSince: LT.START_YEAR, camp: null, pendingEvent: null, pendingBattle: null, raid: null, nextRaid: 60, nextEventGap: 10, eventCd: {}, cdTieuphi: 0,
    over: null, victory: false, startedAt: 0, history: [], world: null,
  };
  LT.genMap(G, nation);
  G.wealth = Math.round(LT.totalHo(G) * 2.2);
  const hall = { id: G.nextId++, k: 'hall', x: G.hx, y: G.hy, w: 2, h: 2, building: false, progress: 1 };
  G.bl.push(hall); for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) LT.tileAt(G, G.hx + i, G.hy + j).b = hall;
  // khu khởi điểm: đường, 10 nhà, 4 ruộng (quyết định riêng, xem README)
  const P = (k, x, y) => LT.place(G, k, x, y, { free: true, instant: true });
  const hx = G.hx, hy = G.hy;
  for (let x = hx - 8; x <= hx + 10; x++) P('road', x, hy + 3);
  for (let y = hy - 6; y <= hy + 12; y++) P('road', hx + 2, y);
  [[-6, 4], [-5, 4], [-4, 4], [-3, 4], [4, 4], [5, 4], [6, 4], [4, 2], [5, 2], [6, 2]].forEach(([x, y]) => P('house', hx + x, hy + y));
  [[3, -5], [3, -4], [3, -3], [3, -2]].forEach(([x, y]) => P('farm', hx + x, hy + y));
  G.bl.forEach(b => { if (b.k === 'farm') b.acc = 0; });
  // quân ban đầu: 1 đô hương binh trường thương
  G.units.push(LT.makeUnit(G, 'truongthuong', 100, 35));
  if (mod.kyStart) { G.units.push(LT.makeUnit(G, 'khinhky', 60, 40)); G.H.binh += 12; G.H.luu = Math.max(0, G.H.luu - 12); }
  G.lab.budget = LT.laoDichBudget(G);
  LT.recalcCity(G);
  LT.updatePrices(G);
  LT.computeQuota(G);
  G.yr.hoStart = LT.totalHo(G);
  if (LT.initWorld) LT.initWorld(G);
  LT.log(G, 'Năm 917: bạn nhậm chức tri huyện ' + nm.cap.replace(/^.*$/, 'một huyện thành nước ' + nm.n) + '.', 'good');
  return G;
};

LT.computeQuota = function (G) {
  const E = LT.expectedHaThue(G, 1);
  const prevYield = G.yr.yield > 0 ? G.yr.yield : G.city.farms * LT.KHU_RUONG_NAM * 1.3;
  const grainVal = LT.THUE_THOC * prevYield * LT.GOODS.luong.p;
  const sp = LT.SPLIT[G.rank];
  G.yr.quota = Math.round((sp[0] + sp[1]) * (E + grainVal + (G.lastYr ? G.lastYr.cho + G.lastYr.mono : 0)));
};

LT.makeUnit = function (G, type, n, hl) {
  return { id: (G.nextUnit = (G.nextUnit || 1) + 1), type, n, hl: hl || 30, sk: 60, tb: 1, gen: null };
};

// ---- nhịp tuần ------------------------------------------------------------------
LT.tickWeek = function (G) {
  if (G.over) return;
  const w = G.week;
  LT.econWeek(G);
  if (LT.armyWeek) LT.armyWeek(G);
  if (LT.politicsWeek) LT.politicsWeek(G);
  if (LT.eventsWeek) LT.eventsWeek(G);
  if (LT.offWeek) LT.offWeek(G);
  if (LT.worldWeek) LT.worldWeek(G);
  if (LT.tradeWeek) LT.tradeWeek(G);
  if (LT.campWeek) LT.campWeek(G);
  if (LT.checkEndings) LT.checkEndings(G);
  G.tick++; G.week++;
  G.flow.last = G.flow.cur;
  if (G.week > LT.WEEKS_YEAR) { G.week = 1; G.year++; LT.rollYear(G); }
  if (G.res.tien <= 0 && G.res.luong <= 0 && LT.totalHo(G) <= 0) G.over = { win: false, title: 'Thành tan hoang', text: 'Dân đã bỏ đi hết, kho trống rỗng. Bạn không còn gì để cai trị.' };
};
LT.rollYear = function (G) {
  G.lastYr = G.yr;
  G.flow.lastYear = G.flow.year; G.flow.year = {};
  G.yr = LT.newYearLedger(); G.yr.hoStart = LT.totalHo(G);
  G.lab.used = 0; G.lab.hired = 0; G.lab.over = 0; G.lab.budget = LT.laoDichBudget(G);
  G.weather = { mul: 1, kind: '' };
  LT.computeQuota(G);
  if (G.year > 979 && !G.over) G.over = LT.finalEnding(G);
};

// ---- lưu / tải: địa hình sinh lại từ hạt giống; chỉ lưu công trình và trạng thái -------------
LT.serialize = function (G) {
  const o = {}; for (const k in G) { if (k === 'map' || k === 'roadDist' || k === 'bl') continue; o[k] = G[k]; }
  o.bl = G.bl.map(b => Object.assign({}, b));
  o.ver = SAVE_VER;
  return JSON.stringify(o);
};
LT.deserialize = function (txt) {
  const o = JSON.parse(txt);
  if (!o || o.ver !== SAVE_VER) throw new Error('phiên bản lưu ' + (o && o.ver) + ' ≠ ' + SAVE_VER);
  const G = o; G.map = [];
  LT.genMap(G, G.nation);
  G.era = Math.min(3, G.rank);
  for (const b of G.bl) {
    const w = b.w || 1, h = b.h || 1;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const q = LT.tileAt(G, b.x + i, b.y + j); if (q) q.b = b; }
  }
  G.speed = 0; G.acc = 0;
  LT.recalcCity(G); LT.updatePrices(G);
  return G;
};
LT.saveSlot = function (G, slot) {
  try { localStorage.setItem(SAVE_KEY + ':' + slot, LT.serialize(G)); localStorage.setItem(SAVE_KEY + ':' + slot + ':meta', JSON.stringify({ name: G.name, nation: LT.NATIONS[G.nation].n, year: G.year, week: G.week, rank: LT.RANKS[G.rank].n, at: Date.now() })); return true; } catch (e) { return false; }
};
LT.lastLoadError = '';
LT.hasOldSaves = function () { try { return ['auto', 'm1', 'm2', 'm3'].some(s => localStorage.getItem(SAVE_KEY_OLD + ':' + s)); } catch (e) { return false; } };
LT.loadSlot = function (slot) {
  LT.lastLoadError = '';
  try {
    const t = localStorage.getItem(SAVE_KEY + ':' + slot);
    if (!t) { LT.lastLoadError = localStorage.getItem(SAVE_KEY_OLD + ':' + slot) ? 'Bản lưu của phiên bản trước (lưới 48×48) không tương thích với bản này — hãy chơi ván mới.' : 'Ô lưu trống.'; return null; }
    return LT.deserialize(t);
  } catch (e) { LT.lastLoadError = 'Bản lưu hỏng hoặc không tương thích (' + (e && e.message ? e.message : 'lỗi lạ') + ').'; return null; }
};
LT.slotMeta = function (slot) { try { const t = localStorage.getItem(SAVE_KEY + ':' + slot + ':meta'); return t ? JSON.parse(t) : null; } catch (e) { return null; } };
})(typeof globalThis !== 'undefined' ? globalThis : window);

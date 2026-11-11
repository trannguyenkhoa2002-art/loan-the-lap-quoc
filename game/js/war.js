'use strict';
// ============================================================================
// QUÂN VỤ: mộ quân, luyện quân, tướng, và LÝ DO ĐỂ ĐÁNH: giặc cỏ, tiễu phỉ, loạn dân,
// nước láng giềng xâm lấn. Kết quả trận ảnh hưởng thật tới thành (GP §10.6).
// ============================================================================
(function (g) {
const LT = g.LT = g.LT || {};
const U = LT.UNITS, clamp = LT.clamp;

LT.armyCap = G => LT.RANKS[G.rank].army * 1;
LT.unitCap = G => LT.RANKS[G.rank].unit;
LT.maxUnits = G => Math.ceil(LT.armyCap(G) / LT.unitCap(G)) + 1;
LT.unitName = u => U[u.type].n + ' (' + Math.round(u.n) + ')';

// ---- DÒNG DÂN → TÂN BINH → QUÂN CÓ HUẤN LUYỆN (vòng 2) ----
// Mộ lính rút đinh tráng từ hộ (5 lính / hộ): hộ thành "hộ binh" (không làm việc, vẫn ăn ở); tân binh vào quân doanh luyện
// vài tuần mới dùng được; binh khí/giáp/ngựa lấy từ kho (thiếu thì mua bù giá ×1,5); lính chết mất hộ vĩnh viễn; giải ngũ trả hộ về dân.
LT.trainWeeks = type => U[type].siege ? 12 : U[type].kind === 'ky' ? 14 : U[type].ranged ? 10 : 8;
LT.barracksCap = G => ({ 1: 300, 2: 300, 3: 500, 4: 1500, 5: 3000, 6: 6000 })[G.rank];
LT.usableUnits = G => G.units.filter(u => !(u.tan > 0));
LT.trainingCount = G => G.units.reduce((n, u) => n + (u.tan > 0 ? u.n : 0), 0);
LT.recruitCost = (type, n) => { const c = {}, d = U[type].cost; for (const k in d) c[k] = Math.ceil(d[k] * n); return c; };
LT.shortfall = function (G, cost) { let t = 0; for (const k in cost) { if (k === 'tien') t += cost[k]; else { const lack = Math.max(0, cost[k] - (G.res[k] || 0)); t += lack * LT.GOODS[k].p * 1.5; } } return t; };
LT.mobilization = (G, cityId) => { if (cityId == null) return G.H.binh / Math.max(1, LT.totalHo(G)); const c = G.world.cities[cityId]; return c.binh / Math.max(1, c.ho + c.binh); };
LT.canRecruit = function (G, type, n, cityId) {
  const d = U[type]; if (!d) return 'Binh chủng lạ';
  if (d.rank > G.rank) return 'Cần chức ' + LT.RANKS[d.rank].n;
  if (LT.count(G, 'barracks') < 1) return 'Cần xây Quân doanh để mộ và luyện quân';
  if (d.need) { for (const k of d.need.split('+')) if (LT.count(G, k) < 1) return 'Cần ' + LT.B[k].n; }
  if (n < 10) return 'Mộ ít nhất 10 lính';
  if (n > LT.unitCap(G)) return 'Mỗi đơn vị tối đa ' + LT.unitCap(G) + ' lính ở chức này';
  if (LT.armyCount(G) + n > LT.armyCap(G)) return 'Vượt quân số tối đa của chức (' + LT.armyCap(G) + ')';
  if (G.units.length >= LT.maxUnits(G) + 3) return 'Hết chỗ cho đơn vị mới';
  const need = Math.ceil(n / LT.LINH_PER_HO);
  if (cityId != null) {
    const c = G.world.cities[cityId]; if (!c || !c.mine || c.id === G.seatId) return 'Không phải thành thuộc quyền';
    if (c.ho - need < (c.base || c.ho) * .45) return c.n + ' đã động viên quá nhiều (cần giữ ≥ 40% hộ làm ruộng, thợ)';
  } else if (G.H.luu + G.H.nong + G.H.cong < need + 15) return 'Không đủ hộ để mộ lính (cần ' + need + ' hộ, mỗi ' + LT.LINH_PER_HO + ' lính một hộ)';
  const c2 = LT.recruitCost(type, n), t = LT.shortfall(G, c2); if (G.res.tien < t) return 'Thiếu ' + LT.costTxt(c2) + (t > 0 ? ' (mua bù hàng thiếu giá ×1,5 tốn ' + Math.round(t) + ' quan)' : '');
  return '';
};
function payArmy(G, cost, label) {
  for (const k in cost) { if (k === 'tien') { LT.pay(G, { tien: cost[k] }, 1, label); continue; } const have = Math.min(G.res[k] || 0, cost[k]); if (have > 0) LT.pay(G, { [k]: have }, 1, label); const lack = cost[k] - have; if (lack > 0) { const t = lack * LT.GOODS[k].p * 1.5; LT.pay(G, { tien: t }, 1, 'Mua bù ' + LT.GOODS[k].n.toLowerCase() + ' cho quân'); G.wealth += t * .4; } }
}
function takeHo(G, need, cityId) {
  if (cityId != null) { const c = G.world.cities[cityId]; c.ho -= need; c.binh += need; return; }
  for (const k of ['luu', 'nong', 'cong', 'thuong']) { const t = Math.min(G.H[k], need); G.H[k] -= t; need -= t; if (need <= 0) break; }
}
LT.recruit = function (G, type, n, cityId) {
  const e = LT.canRecruit(G, type, n, cityId); if (e) return { ok: false, err: e };
  payArmy(G, LT.recruitCost(type, n), 'Mộ quân');
  const need = Math.ceil(n / LT.LINH_PER_HO); takeHo(G, need, cityId);
  if (cityId == null) G.H.binh += need;
  LT.flowAdd(G, 'ho', -need, 'Mộ lính: ' + need + ' hộ thành hộ binh');
  const m = LT.month(G.week), busy = m <= 2 || m === 9, pen = Math.min(14, need / Math.max(30, cityId != null ? G.world.cities[cityId].ho : LT.totalHo(G)) * 70) * (busy ? 2 : 1);
  if (cityId == null) { G.stat.dantam = clamp(G.stat.dantam - pen, 0, 100); if (busy) G.lab.busy = true; } else { const c = G.world.cities[cityId]; c.dt = clamp(c.dt - pen, 0, 100); }
  const u = LT.makeUnit(G, type, n, 12); u.sk = 50; u.tan = LT.trainWeeks(type); if (cityId != null) u.from = cityId; G.units.push(u);
  LT.log(G, 'Mộ ' + n + ' ' + U[type].n + ' từ ' + (cityId != null ? G.world.cities[cityId].n : 'thành trị sở') + ' (' + need + ' hộ' + (busy ? ', mùa bận nên dân oán gấp đôi' : '') + '); đang luyện ' + u.tan + ' tuần.', busy ? 'bad' : 'good');
  return { ok: true, u, need, busy };
};
LT.reinforce = function (G, id, n) {
  const u = G.units.find(x => x.id === id); if (!u) return { ok: false, err: 'Không có đơn vị' };
  n = Math.min(n, LT.unitCap(G) - u.n, LT.armyCap(G) - LT.armyCount(G)); if (n < 10) return { ok: false, err: 'Đơn vị đã đầy hoặc hết quân số tối đa' };
  const e = LT.canRecruit(G, u.type, Math.max(10, n), u.from); if (e && e.indexOf('Mỗi đơn vị') < 0 && e.indexOf('Hết chỗ') < 0) return { ok: false, err: e };
  payArmy(G, LT.recruitCost(u.type, n), 'Mộ quân'); const need = Math.ceil(n / LT.LINH_PER_HO); takeHo(G, need, u.from); if (u.from == null) G.H.binh += need;
  LT.flowAdd(G, 'ho', -need, 'Mộ lính: ' + need + ' hộ thành hộ binh');
  u.hl = (u.hl * u.n + 12 * n) / (u.n + n); u.sk = (u.sk * u.n + 50 * n) / (u.n + n); u.n += n; u.tan = Math.max(u.tan || 0, Math.ceil(LT.trainWeeks(u.type) * n / (u.n)));
  return { ok: true };
};
LT.discharge = function (G, id) {
  const i = G.units.findIndex(x => x.id === id); if (i < 0) return false;
  const u = G.units[i]; G.units.splice(i, 1); const back = Math.floor(u.n / LT.LINH_PER_HO);
  if (u.from == null) { const t = Math.min(back, G.H.binh); G.H.binh -= t; G.H.luu += t; LT.flowAdd(G, 'ho', t, 'Giải ngũ: hộ binh về làm dân'); }
  else { const c = G.world.cities[u.from]; const t = Math.min(back, c.binh); c.binh -= t; c.ho += t; }
  LT.ensureFormation(G); return true;
};
// gộp các đơn vị tàn cùng binh chủng và cùng nguồn dân (không thêm hộ, không tốn gì)
LT.mergeUnits = function (G) {
  let merged = 0; const cap = LT.unitCap(G);
  const groups = {}; for (const u of G.units) { const k = u.type + ':' + (u.from == null ? 's' : u.from) + ':' + (u.tan > 0 ? 't' : 'r'); (groups[k] = groups[k] || []).push(u); }
  for (const k in groups) {
    const g = groups[k].sort((p, q) => q.n - p.n), tgt = g[0];
    for (const u of g.slice(1)) { if (u.n < cap * .6 && tgt.n + u.n <= cap) { const t = tgt.n + u.n; tgt.hl = (tgt.hl * tgt.n + u.hl * u.n) / t; tgt.sk = (tgt.sk * tgt.n + u.sk * u.n) / t; tgt.tb = Math.round((tgt.tb * tgt.n + u.tb * u.n) / t); tgt.tan = Math.max(tgt.tan || 0, u.tan || 0); tgt.n = t; G.units.splice(G.units.indexOf(u), 1); merged++; } }
  }
  if (merged) { if (G.formation) G.formation.auto = true; LT.ensureFormation(G); }
  return merged;
};
LT.soldiersDied = function (G, u, lost) {
  if (!(lost > 0)) return; const key = u.from == null ? 'seat' : u.from; G.deadAcc = G.deadAcc || {};
  G.deadAcc[key] = (G.deadAcc[key] || 0) + lost / LT.LINH_PER_HO; const k = Math.floor(G.deadAcc[key]); if (k <= 0) return; G.deadAcc[key] -= k;
  if (key === 'seat') { const t = Math.min(k, G.H.binh); G.H.binh -= t; LT.flowAdd(G, 'ho', -t, 'Lính chết trận: hộ mất vĩnh viễn'); }
  else { const c = G.world.cities[key]; c.binh = Math.max(0, c.binh - k); }
};
LT.equipCost = u => ({ binhkhi: Math.ceil(u.n * .6 * u.tb), tien: Math.ceil(u.n * .5 * u.tb) });
LT.upgradeEquip = function (G, id) {
  const u = G.units.find(x => x.id === id); if (!u) return { ok: false, err: 'Không có đơn vị' };
  if (u.tb >= 5) return { ok: false, err: 'Đã tối đa trang bị (cấp 5)' };
  if (u.tb >= 2 && LT.count(G, 'armory') < 1) return { ok: false, err: 'Từ cấp 3 cần Xưởng binh khí (chức Thứ sử)' };
  const c = LT.equipCost(u), t = LT.shortfall(G, c); if (G.res.tien < t) return { ok: false, err: 'Thiếu ' + LT.costTxt(c) };
  payArmy(G, c, 'Trang bị quân'); u.tb++; return { ok: true };
};
LT.maxGens = G => G.rank * 2;
LT.hireGeneral = function (G) {
  if (G.gens.length >= LT.maxGens(G)) return { ok: false, err: 'Đã đủ tướng cho chức này (' + LT.maxGens(G) + ')' };
  if (G.res.tien < 40) return { ok: false, err: 'Cần 40 quan để chiêu mộ tướng' };
  LT.pay(G, { tien: 40 }, 1, 'Chiêu mộ tướng');
  const r = n => 38 + Math.floor(LT.rand(G) * n), name = LT.pick(G, LT.NAME_FIRST) + ' ' + LT.pick(G, LT.NAME_MID) + ' ' + LT.pick(G, LT.NAME_LAST);
  const gen = { id: (G.nextGen = (G.nextGen || 0) + 1), name, tong: r(48), vo: r(48), tri: r(48), chinh: r(40), duc: r(40), sal: 12, trait: LT.pick(G, ['thanh liêm', 'dũng mãnh', 'mưu lược', 'hay nghi kỵ', 'giỏi kỵ xạ']) };
  G.gens.push(gen); LT.log(G, 'Chiêu mộ tướng ' + name + ' (Thống ' + gen.tong + ', Võ ' + gen.vo + ', Trí ' + gen.tri + ').', 'good');
  return { ok: true, gen };
};
LT.ensureFormation = function (G) {
  let f = G.formation;
  const ids = new Set(LT.usableUnits(G).map(u => u.id)), gids = new Set(G.gens.map(x => x.id));
  if (!f) { f = G.formation = { slots: Array(9).fill(null), reserve: [], ambush: null, genOf: {}, chiefGen: null, form: 'phuong', wing: 'left', orders: { p1: 'banphu', p2: 'tongcong', p3: 'thuquan' }, conds: ['thuongvong30', 'sikhi40'] }; f.auto = true; }
  f.slots = f.slots.map(id => ids.has(id) ? id : null); f.reserve = f.reserve.filter(id => ids.has(id)); if (f.ambush && !ids.has(f.ambush)) f.ambush = null;
  for (const u in f.genOf) if (!ids.has(+u) || !gids.has(f.genOf[u])) delete f.genOf[u];
  if (f.chiefGen && !gids.has(f.chiefGen)) f.chiefGen = null;
  const used = new Set([...f.slots, ...f.reserve, f.ambush].filter(Boolean));
  if (f.auto || (!f.slots.some(Boolean) && !f.reserve.length)) { const L = LT.autoLineup(LT.usableUnits(G)); f.slots = L.slots; f.reserve = L.reserve; f.ambush = null; f.auto = true; }
  else { // đơn vị mới mộ chưa xếp thì cho vào dự bị
    for (const u of LT.usableUnits(G)) if (!used.has(u.id)) f.reserve.push(u.id);
  }
  const maxC = 2 + Math.floor(LT.chiefTong(G) / 25); f.conds = f.conds.slice(0, maxC);
  return f;
};
LT.chiefTong = G => { const f = G.formation; const gen = f && f.chiefGen && G.gens.find(x => x.id === f.chiefGen); return gen ? gen.tong : G.player.tong; };

// ---- nhịp tuần: luyện quân, sĩ khí, lương tướng --------------------------------------------
LT.armyWeek = function (G) {
  const n = LT.armyCount(G);
  const barr = LT.count(G, 'barracks');
  const trainN = LT.trainingCount(G), capB = barr * LT.barracksCap(G);
  for (const u of G.units) {
    if (u.tan > 0) { const tr = barr > 0 ? Math.min(1, capB / Math.max(1, trainN)) : 0; u.tan = Math.max(0, u.tan - tr); u.hl = Math.min(35, u.hl + 3 * tr); if (u.tan <= 0) { u.tan = 0; u.hl = Math.max(u.hl, 35); u.sk = Math.max(u.sk, 58); LT.log(G, LT.UNITS[u.type].n + ' (' + Math.round(u.n) + ') luyện xong, đã vào hàng ngũ.', 'good'); } continue; }
    const rate = barr > 0 ? 1.5 * Math.min(1, capB / Math.max(1, n)) : .15, lim = barr > 0 ? 100 : 40;
    if (u.hl < lim) u.hl = Math.min(lim, u.hl + rate);
    const target = 62 + G.player.uyvong / 6 - (G.armyUnpaid > 0 ? 25 : 0) + (u.type === 'nhabinh' ? 8 : 0);
    u.sk = clamp(u.sk + (target - u.sk) * .08, 0, 100);
  }
  for (const gen of G.gens) { const p = Math.min(G.res.tien, gen.sal / LT.WEEKS_YEAR); G.res.tien -= p; LT.flowAdd(G, 'tien', -p, 'Bổng tướng lĩnh'); }
  G.units = G.units.filter(u => u.n >= 1);
  if (G.cdTieuphi > 0) G.cdTieuphi--;
  scheduleThreats(G);
  LT.ensureFormation(G);
};

// ---- các mối đe dọa -----------------------------------------------------------------------
const FOE_NAMES = ['Giặc cỏ', 'Thảo khấu', 'Loạn binh', 'Sơn tặc', 'Phỉ quân'];
LT.raidSize = G => {
  const yrs = G.year - LT.START_YEAR + (G.week / 36), m = LT.NATIONS[G.nation].mod.raid || 1;
  // giặc kéo theo tài sản và lực lượng của bạn: không bao giờ vượt xa quân hiện có (giữ trận đánh còn là bài toán, không là cái chết chắc)
  const base = (55 + 24 * yrs + 9 * (G.raidCount || 0)) * m * (G.rank === 2 ? 1.7 : G.rank >= 3 ? 2.6 : 1);
  return Math.round(Math.max(55, Math.min(base, 1.3 * LT.armyCount(G) + 60, LT.armyCap(G) * 1.1)));
};
LT.makeComp = function (G, total, kind, strong) {
  const units = Math.max(2, Math.min(9, Math.ceil(total / (G.rank >= 2 ? 200 : 60)))), per = Math.round(total / units), comp = [];
  const yrs = G.year - LT.START_YEAR;
  const pool = kind === 'nation' ? ['truongthuong', 'daothuan', 'cung', 'khinhky', 'no', 'trongky'] : kind === 'loan' ? ['truongthuong', 'cung', 'truongthuong', 'daothuan'] : ['truongthuong', 'daothuan', 'cung', 'truongthuong', yrs >= 3 ? 'khinhky' : 'cung'];
  for (let i = 0; i < units; i++) {
    let t = pool[Math.floor(LT.rand(G) * pool.length)]; if (U[t].rank > 1 && kind !== 'nation') t = 'truongthuong';
    comp.push({ type: t, n: Math.max(20, Math.round(per * (.8 + LT.rand(G) * .4))), hl: strong ? 45 + Math.round(LT.rand(G) * 20) : kind === 'loan' ? 14 + Math.round(LT.rand(G) * 6) : 22 + Math.round(LT.rand(G) * 12), sk: strong ? 62 + Math.round(LT.rand(G) * 10) : kind === 'loan' ? 52 : 52 + Math.round(LT.rand(G) * 8), tb: strong ? 2 : 1 + (yrs >= 4 ? 1 : 0) });
  }
  return comp;
};
function scheduleThreats(G) {
  if (G.pendingBattle || G.pendingEvent || G.over) return;
  if (G.raid) {
    G.raid.t--;
    if (G.raid.t <= 0) { const r = G.raid; G.raid = null; LT.openBattle(G, r.kind, r); }
    return;
  }
  if (G.tick >= G.nextRaid) {
    const total = Math.round(LT.raidSize(G) * (.85 + LT.rand(G) * .3)), notice = 3 + (LT.count(G, 'beacon') > 0 ? 2 : 0);
    const comp = LT.makeComp(G, total, 'giac');
    G.raid = { kind: 'giac', t: notice, t0: notice, name: LT.pick(G, FOE_NAMES), total, comp, side: Math.floor(LT.rand(G) * 4) };
    G.raidCount = (G.raidCount || 0) + 1;
    G.nextRaid = G.tick + 22 + Math.floor(LT.rand(G) * 14) - Math.min(8, G.raidCount);
    LT.log(G, G.raid.name + ' (~' + total + ' quân) đang kéo đến, còn ' + notice + ' tuần!', 'bad');
    G.alertFlash = { text: G.raid.name + ' đang kéo đến! Còn ' + notice + ' tuần — chuẩn bị quân và trận hình trong Quân vụ.' };
  }
}

// ---- mở một trận (đưa vào G.pendingBattle) --------------------------------------------------
LT.openBattle = function (G, kind, o) {
  o = o || {};
  const wallLevel = Math.floor(G.stat.thanhphong / 25);
  let enemy, title, text, terrain = 'dongbang', holder = null, crosser = null, canFlee = true, ransom = 0, canHold = true;
  const comp = o.comp || LT.makeComp(G, o.total || LT.raidSize(G), kind === 'nation' ? 'nation' : kind === 'loan' ? 'loan' : 'giac', kind === 'nation');
  const chief = { name: o.chief || 'Thủ lĩnh', tong: kind === 'nation' ? 55 + Math.floor(LT.rand(G) * 25) : kind === 'loan' ? 28 : 38 + Math.floor(LT.rand(G) * 22), tri: kind === 'nation' ? 55 + Math.floor(LT.rand(G) * 25) : 35 + Math.floor(LT.rand(G) * 30) };
  const eName = o.name || (kind === 'loan' ? 'Dân loạn' : 'Giặc cỏ');
  const total = comp.reduce((a, u) => a + u.n, 0);
  if (kind === 'giac') { title = eName + ' đánh đến thành!'; text = 'Bọn cướp ' + total + ' tên kéo đến cổng thành, cướp bóc kho lương. Dẹp chúng để giữ yên dân, hoặc nộp tiền chuộc.'; ransom = Math.round(total * 1.2); }
  if (kind === 'tieuphi') { title = 'Tiễu trừ sơn trại'; text = 'Thám báo phát hiện một sơn trại ~' + total + ' tên. Đánh dẹp được sẽ có quân công và chiến lợi phẩm; thua thì tổn hại uy vọng.'; terrain = LT.pick(G, ['rung', 'doi', 'dongbang']); if (terrain === 'doi') holder = 'B'; canFlee = true; canHold = false; }
  if (kind === 'loan') { title = 'Dân nổi loạn!'; text = 'Dân tâm tụt quá thấp, ' + total + ' hộ nổi dậy cầm gậy gộc kéo vào phủ. Đánh dẹp thì thành yên nhưng dân oán; hoặc ban ơn (giảm thuế, mở kho) để dân tản đi.'; ransom = 0; }
  if (kind === 'nation') { title = 'Quân ' + eName + ' xâm lấn!'; text = 'Nước láng giềng xuất ' + total + ' quân đánh vào huyện thành. Thua trận mà thành phòng thấp, thành sẽ thất thủ.'; ransom = Math.round(total * 2.5); }
  const eSide = LT.aiSide(eName, comp, chief, { wall: 0, camcu: false });
  eSide.form = kind === 'nation' ? 'phuong' : LT.pick(G, ['phuong', 'phongthi', 'hacduc', 'nhanhanh', 'phuong']);
  LT.ensureFormation(G);
  G.pendingBattle = { kind, title, text, terrain, holder, crosser, canFlee, canHold, ransom, wallLevel, mode: kind === 'tieuphi' ? 'da' : (wallLevel > 0 ? 'thu' : 'da'), enemy: eSide, enemyName: eName, nation: o.nation != null ? o.nation : null, total, comp };
  // máy chọn trận hình đối phó cho nước láng giềng (đã biết lực lượng ta)
  if (kind === 'nation') {
    const f = G.formation, mine = LT.buildPlayerSide(G, f), cfg = { A: mine, B: eSide, terrain, holder };
    const best = LT.aiPickFormation(cfg, 'B', 6); eSide.form = best.form; eSide.wing = best.wing;
  }
  G.speed = 0;
  return G.pendingBattle;
};
LT.battleCfg = function (G, pb) {
  pb = pb || G.pendingBattle; const f = LT.ensureFormation(G);
  const mine = LT.buildPlayerSide(G, f);
  if (pb.mode === 'thu' && pb.kind !== 'tieuphi') mine.wall = pb.wallLevel;
  const e = LT.clone(pb.enemy);
  let holder = pb.holder, terrain = pb.terrain;
  return { A: mine, B: e, terrain, holder, crosser: pb.crosser, nameA: G.name, nameB: pb.enemyName, defender: pb.kind !== 'tieuphi' ? 'A' : 'B' };
};
LT.battleEstimate = (G, runs) => LT.estimateWin(LT.battleCfg(G), runs || 50);

// ---- chạy trận và áp dụng hậu quả -----------------------------------------------------------
LT.resolveBattle = function (G) {
  const pb = G.pendingBattle; if (!pb) return null;
  const cfg = LT.battleCfg(G, pb);
  const rep = LT.runBattle(cfg, Math.floor(LT.rand(G) * 1e9));
  rep.kind = pb.kind; rep.title = pb.title; rep.pbMode = pb.mode;
  const out = rep.outcome = { loot: 0, lines: [] };
  // cập nhật quân ta
  const final = rep.final.A, survive = {};
  for (const u of LT.sideUnits(final)) survive[u.id] = u;
  const won = rep.result === 'A', lost = rep.result === 'B';
  for (const u of G.units) {
    const s = survive[u.id];
    if (s) { const lostN = u.n - Math.round(s.n); LT.soldiersDied(G, u, lostN); u.n = Math.max(0, Math.round(s.n)); u.sk = clamp(s.sk + (won ? 10 : lost ? -12 : 0), 5, 100); if (u.n > 0) u.hl = Math.min(100, u.hl + (won ? 4 : 2)); }
  }
  for (const gen of G.gens) { const s = LT.sideUnits(final).find(x => x.genId === gen.id && x.genDead); if (s) { G.gens.splice(G.gens.indexOf(gen), 1); out.lines.push('Tướng ' + gen.name + ' đã tử trận.'); } }
  G.units = G.units.filter(u => u.n >= 1);
  const lostMen = rep.sum.A.lost; out.lostMen = lostMen; out.enemyLost = rep.sum.B.lost;
  const enemyN = pb.total;
  const P = G.player;
  if (won) {
    G.wins++; G.winsSince = (G.winsSince || 0) + 1; P.uyvong = clamp(P.uyvong + (pb.kind === 'nation' ? 6 : 3), 0, 100);
    const loot = Math.round(Math.min(6000, enemyN * (pb.kind === 'campaign' || pb.kind === 'siege' ? .03 : pb.kind === 'tieuphi' ? .8 : pb.kind === 'nation' ? (enemyN > 3000 ? .15 : 1.2) : .5)));
    out.loot = loot; G.res.tien += loot; LT.flowAdd(G, 'tien', loot, 'Chiến lợi phẩm'); G.res.luong += Math.round(loot * 1.2); LT.flowAdd(G, 'luong', Math.round(loot * 1.2), 'Chiến lợi phẩm');
    out.lines.push('Chiến thắng! Thu chiến lợi phẩm ' + loot + ' quan và ' + Math.round(loot * 1.2) + ' thạch. Uy vọng +' + (pb.kind === 'nation' ? 6 : 3) + '.');
    if (pb.kind !== 'loan') { G.quanCong++; out.lines.push('Quân công +1 (tổng ' + G.quanCong + ').'); }
    if (pb.kind === 'tieuphi') { P.thanhdanh = clamp(P.thanhdanh + 2, 0, 100); G.stat.trian = clamp(G.stat.trian + 4, 0, 100); G.cdTieuphi = 12; }
    if (pb.kind === 'giac') { G.stat.trian = clamp(G.stat.trian + 3, 0, 100); G.stat.dantam = clamp(G.stat.dantam + 2, 0, 100); }
    if (pb.kind === 'loan') { G.loan++; G.loanSince = (G.loanSince || 0) + 1; G.stat.dantam = clamp(G.stat.dantam - 6, 0, 100); G.quanCong += 0; out.lines.push('Dẹp xong loạn dân (đếm vào điều kiện thăng chức), nhưng dân oán: dân tâm −6.'); }
    if (pb.kind === 'nation' && pb.nation != null && LT.afterNationBattle) LT.afterNationBattle(G, pb.nation, true);
    if (pb.kind === 'campaign' || pb.kind === 'siege') { G.quanCong += 0; }
    G.lastWinTick = G.tick;
    // lính đòi thưởng sau thắng lớn
    if (rep.sum.B.lost > rep.sum.A.lost * 2 && LT.armyCount(G) > 0) G.reward = { need: Math.round(LT.armyCount(G) * 0.4) };
  } else if (lost) {
    P.uyvong = clamp(P.uyvong - 6, 0, 100);
    if (pb.kind === 'tieuphi') { out.lines.push('Tiễu phỉ thất bại, quân tan rã, uy vọng −6.'); G.cdTieuphi = 8; }
    else if (pb.kind === 'loan') { const l = Math.round(G.res.tien * .4); G.res.tien -= l; LT.flowAdd(G, 'tien', -l, 'Dân loạn cướp phủ'); LT.loseHo(G, Math.round(LT.totalHo(G) * .08), 'Dân loạn bỏ đi'); out.lines.push('Dân loạn cướp phủ: mất ' + l + ' quan, 8% hộ bỏ đi.'); G.stat.dantam = clamp(G.stat.dantam - 10, 0, 100); }
    else if (pb.kind === 'campaign' || pb.kind === 'siege') out.lines.push('Đại bại! Quân tan tác, phải lui về.');
    else if (pb.cityId != null && pb.cityId !== G.seatId) { /* thành thuộc quyền: xử ở afterBigBattle */ }
    else plunder(G, pb, out, .2 + (enemyN > 300 ? .06 : 0));
    if (pb.kind === 'nation' && (pb.cityId == null || pb.cityId === G.seatId)) {
      if (G.stat.thanhphong < 30) { G.over = { win: false, title: 'Thành thất thủ', text: 'Quân ' + pb.enemyName + ' phá cổng, chiếm huyện thành. Thành phòng quá yếu để cầm cự. Bạn mất thành cuối cùng của mình.' }; }
      else { out.lines.push('Nhờ tường thành vững (thành phòng ' + Math.round(G.stat.thanhphong) + '), thành chưa thất thủ, nhưng bạn phải nộp tuế tệ.'); const t = Math.round(G.res.tien * .3); G.res.tien -= t; LT.flowAdd(G, 'tien', -t, 'Tuế tệ nộp nước láng giềng'); }
      if (LT.afterNationBattle) LT.afterNationBattle(G, pb.nation, false);
    }
  } else {
    if (pb.kind === 'giac' || pb.kind === 'nation') { plunder(G, pb, out, .05); out.lines.push('Hai bên bất phân thắng bại, giặc rút lui sau khi cướp ít của.'); }
    if (pb.kind === 'tieuphi') out.lines.push('Bất phân thắng bại — sơn trại vẫn còn.');
    if (pb.kind === 'loan') out.lines.push('Dân loạn tản đi sau trận hòa, nhưng dân tâm vẫn thấp.');
  }
  if (LT.afterBigBattle) LT.afterBigBattle(G, pb, rep, won, lost, false);
  G.stat.trian = clamp(G.stat.trian + (won ? 0 : -3), 0, 100);
  G.lastBattle = rep; G.pendingBattle = null; G.raid = null;
  LT.log(G, pb.title + ' — ' + (won ? 'THẮNG' : lost ? 'THUA' : 'HÒA') + '. Ta mất ' + lostMen + ' lính, địch mất ' + out.enemyLost + '.', won ? 'good' : lost ? 'bad' : '');
  LT.ensureFormation(G);
  return rep;
};
function plunder(G, pb, out, frac) {
  const t = Math.round(G.res.tien * frac), l = Math.round(G.dan.luong * frac * .6), ck = Math.round(G.res.luong * frac);
  G.res.tien -= t; G.dan.luong -= l; G.res.luong -= ck; LT.flowAdd(G, 'tien', -t, 'Bị cướp phá'); LT.flowAdd(G, 'dluong', -l, 'Bị cướp phá'); LT.flowAdd(G, 'luong', -ck, 'Bị cướp phá');
  for (const k of ['muoi', 'vai', 'tra', 'gom', 'lua', 'ruou']) G.res[k] = Math.round((G.res[k] || 0) * (1 - frac * .6));
  const ho = LT.loseHo(G, Math.round(LT.totalHo(G) * frac * .15), 'Dân chết và bỏ đi vì giặc');
  G.stat.dantam = clamp(G.stat.dantam - 5 - frac * 10, 0, 100);
  out.lines.push('Bị cướp phá: mất ' + t + ' quan, ' + (l + ck) + ' thạch, ' + ho + ' hộ chết hoặc bỏ đi, dân tâm giảm.');
}
// chọn không đánh
LT.payRansom = function (G) {
  const pb = G.pendingBattle; if (!pb || !pb.ransom) return { ok: false, err: 'Không thể nộp tiền chuộc' };
  if (G.res.tien < pb.ransom) return { ok: false, err: 'Cần ' + pb.ransom + ' quan để chuộc' };
  G.res.tien -= pb.ransom; LT.flowAdd(G, 'tien', -pb.ransom, 'Nộp tiền chuộc giặc'); G.wealth += pb.ransom * .3;
  G.player.uyvong = clamp(G.player.uyvong - 4, 0, 100); G.player.thanhdanh = clamp(G.player.thanhdanh - 3, 0, 100);
  if (pb.kind === 'nation' && pb.nation != null && G.world) { G.world.rel[pb.nation] = clamp(G.world.rel[pb.nation] + 10, -100, 100); }
  LT.log(G, 'Nộp ' + pb.ransom + ' quan chuộc thành — giặc rút, nhưng uy vọng và thanh danh tổn hại.', 'bad'); G.pendingBattle = null; G.raid = null; return { ok: true };
};
LT.ignoreRaid = function (G) {
  const pb = G.pendingBattle; if (!pb) return { ok: false };
  if (pb.kind === 'nation') return { ok: false, err: 'Không thể mặc kệ quân xâm lấn' };
  const out = { lines: [] }; if (pb.kind === 'giac') plunder(G, pb, out, .3);
  if (pb.kind === 'tieuphi') { G.cdTieuphi = 6; out.lines.push('Bỏ qua sơn trại.'); }
  if (pb.kind === 'loan') { G.stat.dantam = clamp(G.stat.dantam - 8, 0, 100); G.rebelRisk = 0; out.lines.push('Mặc dân loạn, dân tâm tụt thêm.'); }
  G.player.uyvong = clamp(G.player.uyvong - 5, 0, 100);
  LT.log(G, 'Bạn bỏ mặc: ' + out.lines.join(' '), 'bad'); G.pendingBattle = null; G.raid = null; return { ok: true, lines: out.lines };
};
LT.appease = function (G) { // ban ơn dẹp loạn
  const pb = G.pendingBattle; if (!pb || pb.kind !== 'loan') return { ok: false };
  const c = { luong: 100, tien: 50 }; if (!LT.afford(G, c)) return { ok: false, err: 'Cần ' + LT.costTxt(c) + ' để ban ơn' };
  LT.pay(G, c, 1, 'Ban ơn dẹp loạn'); G.stat.dantam = clamp(G.stat.dantam + 15, 0, 100); G.dan.luong += 100; G.player.thanhdanh = clamp(G.player.thanhdanh + 2, 0, 100);
  G.mods.push({ k: 'dt', v: 6, w: 24 }); LT.log(G, 'Ban ơn: mở kho, giảm lao dịch — dân tản đi, dân tâm +15.', 'good'); G.pendingBattle = null; G.rebelRisk = 0; return { ok: true };
};
LT.startRebellion = function (G) {
  const n = Math.min(480, Math.round(LT.totalHo(G) * 1.4));
  LT.openBattle(G, 'loan', { total: Math.max(60, n), name: 'Dân loạn' });
};
LT.startTieuphi = function (G) {
  if (G.cdTieuphi > 0) return { ok: false, err: 'Cần chờ ' + G.cdTieuphi + ' tuần nữa mới có tin sơn trại mới' };
  if (G.pendingBattle) return { ok: false, err: 'Đang có trận chưa xong' };
  if (LT.armyCount(G) < 40) return { ok: false, err: 'Quân quá ít để đi tiễu phỉ' };
  const total = Math.round(LT.raidSize(G) * .6 + 30);
  LT.openBattle(G, 'tieuphi', { total, name: 'Sơn trại' }); return { ok: true };
};
})(typeof globalThis !== 'undefined' ? globalThis : window);

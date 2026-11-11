'use strict';
// ============================================================================
// THIÊN HẠ: 12 nước, quan hệ −100..+100, ngoại giao (CT §7.2), các nước máy đổi thay,
// biến cố lịch sử không cố định ngày, nước láng giềng xâm lấn (bản giản lược).
// ============================================================================
(function (g) {
const LT = g.LT = g.LT || {};
const clamp = LT.clamp, NAT = LT.NATIONS;

LT.initWorld = function (G) {
  const w = G.world = { rel: [], ns: [], wars: [], chron: [], hist: { doichu: 0, khietdan: 0, namxungde: 0, thontinh: 0 }, names: {}, exp: {}, gifts: {}, lastCheck: 0, tribute: [] };
  for (const n of NAT) {
    w.ns.push({ id: n.id, cities: n.cities, army: 40 + Math.floor(LT.rand(G) * 30), stab: 55 + Math.floor(LT.rand(G) * 30), alive: true, n: n.n });
    // quan hệ khởi đầu với bạn: ngẫu nhiên, nước hiếu chiến lạnh hơn, láng giềng hay gây hấn hơn
    let r = Math.round(-10 + LT.rand(G) * 40 - (n.chr === 'hiếu chiến' ? 14 : 0) + (n.chr === 'trọng thương' ? 12 : 0) - (n.chr === 'phản trắc' ? 8 : 0));
    if (NAT[G.nation].adj.indexOf(n.id) >= 0) r -= 6;
    w.rel.push(clamp(r, -80, 80));
  }
  w.ns.push({ id: 12, cities: 0, army: 0, stab: 60, alive: false, n: 'Nước của bạn', troops: 0, mob: .6 });
  w.rel.push(100);
  w.rel[G.nation] = 100;
  // Hậu Lương – Tấn thù nhau
  if (G.nation !== 0 && G.nation !== 1) { /* quan hệ với bạn không đổi */ }
  w.ns[G.nation].stab = 62;
  LT.initCities(G);
  addChron(G, 'Năm 917: thiên hạ chia mười hai nước. Bạn nhậm chức tri huyện ở nước ' + NAT[G.nation].n + '.');
};
const addChron = (G, t) => { G.world.chron.unshift({ y: G.year, w: G.week, t }); if (G.world.chron.length > 60) G.world.chron.length = 60; if (LT.onChron) LT.onChron(t); };
LT.addChron = addChron;
LT.natName = (G, i) => i === 12 ? ((G.world.ns[12] && G.world.ns[12].n) || 'Nước của bạn') : ((G.world && G.world.names[i]) || NAT[i].n);
LT.natAlive = (G, i) => G.world.ns[i].alive;
LT.countCities = G => G.world.ns.reduce((a, n) => a + (n.alive ? n.cities : 0), 0);

// ---- điểm thuyết phục (CT §7.2) — hiển thị từng thành phần -------------------------------
LT.persuasion = function (G, nid, gift) {
  const w = G.world, n = NAT[nid];
  const dacTam = { 'hiếu chiến': 58, 'phản trắc': 52, 'thủ thành': 28, 'trọng thương': 20 }[n.chr] + (w.ns[nid].stab < 40 ? 6 : 0);
  let common = 0; for (let j = 0; j < 12; j++) if (j !== nid && j !== G.nation && w.ns[j].alive && w.rel[j] <= -25 && relNat(G, nid, j) <= -25) common += 6;
  const parts = [
    { n: 'Quan hệ ÷ 2', v: w.rel[nid] / 2 },
    { n: 'Giá trị lễ vật', v: gift / 20 },
    { n: 'Tài của sứ thần (Trí + Đức) ÷ 5', v: (G.player.tri + G.player.duc) / 5 },
    { n: 'Lợi ích chung (chung kẻ thù)', v: common },
    { n: 'Tín nghĩa của bạn ÷ 5', v: G.player.tin / 5 },
    { n: 'Dã tâm của đối phương ÷ 4 (trừ)', v: -dacTam / 4 },
  ];
  return { parts, total: Math.round(parts.reduce((a, p) => a + p.v, 0) * 10) / 10 };
};
// quan hệ giữa hai nước máy (tính từ tính cách và láng giềng)
function relNat(G, i, j) {
  const adj = NAT[i].adj.indexOf(j) >= 0, a = NAT[i].chr, b = NAT[j].chr;
  let r = adj ? -20 : 5; if (a === 'hiếu chiến') r -= 15; if (b === 'hiếu chiến') r -= 10; if (a === 'trọng thương' && b === 'trọng thương') r += 25;
  if ((i === 0 && j === 1) || (i === 1 && j === 0)) r -= 40;
  return r;
}
LT.diploActions = function (G, nid) {
  const n = NAT[nid], w = G.world, out = [];
  const alive = w.ns[nid].alive;
  for (const k in LT.TREATIES) {
    const t = LT.TREATIES[k], have = G.treaties[k].indexOf(nid) >= 0;
    let err = '';
    if (!alive) err = 'Nước này đã bị diệt';
    else if (have) err = 'Đã có giao ước này';
    else if (G.rank < t.rank) err = 'Cần chức ' + LT.RANKS[t.rank].n + ' (hiện ' + LT.RANKS[G.rank].n + ' chỉ giao thiệp biên cảnh)';
    else if (k === 'thongthuong' && NAT[G.nation].adj.indexOf(nid) < 0 && w.rel[nid] < 20) err = 'Nước xa — cần quan hệ ≥ 20 hoặc láng giềng';
    out.push({ id: k, n: t.n, d: t.d, th: t.th, err, have });
  }
  return out;
};
const GIFT_COST = [0, 30, 100, 300];
LT.GIFT_COST = GIFT_COST;
LT.sendGift = function (G, nid, lv) {
  const c = GIFT_COST[lv]; if (!c) return { ok: false, err: 'Chọn mức lễ vật' };
  if (G.res.tien < c) return { ok: false, err: 'Cần ' + c + ' quan' };
  G.res.tien -= c; LT.flowAdd(G, 'tien', -c, 'Lễ vật ngoại giao');
  const g1 = Math.round(Math.min(35, c / 7) * (NAT[nid].chr === 'trọng thương' ? 1.3 : 1) * (NAT[nid].chr === 'hiếu chiến' ? .7 : 1));
  G.world.rel[nid] = clamp(G.world.rel[nid] + g1, -100, 100); G.world.gifts[nid] = (G.world.gifts[nid] || 0) + c;
  addChron(G, 'Bạn biếu ' + LT.natName(G, nid) + ' lễ vật ' + c + ' quan; quan hệ +' + g1 + '.');
  return { ok: true, text: 'Quan hệ với ' + LT.natName(G, nid) + ' +' + g1 + ' (' + Math.round(G.world.rel[nid]) + ').' };
};
LT.proposeTreaty = function (G, nid, key, giftLv) {
  const acts = LT.diploActions(G, nid), a = acts.find(x => x.id === key); if (!a) return { ok: false, err: 'Không có' };
  if (a.err) return { ok: false, err: a.err };
  const c = GIFT_COST[giftLv || 0] || 0; if (G.res.tien < c) return { ok: false, err: 'Cần ' + c + ' quan lễ vật' };
  const p = LT.persuasion(G, nid, c);
  if (c) { G.res.tien -= c; LT.flowAdd(G, 'tien', -c, 'Lễ vật ngoại giao'); }
  if (p.total >= a.th) {
    G.treaties[key].push(nid); const w = G.world;
    if (key === 'batxam') w.exp[key + nid] = G.tick + 5 * LT.WEEKS_YEAR;
    if (key === 'hoathan') { w.rel[nid] = clamp(w.rel[nid] + 20, -100, 100); G.player.thanhdanh = clamp(G.player.thanhdanh + 2, 0, 100); }
    else w.rel[nid] = clamp(w.rel[nid] + 8, -100, 100);
    if (key === 'xungthan') { w.tribute.push(nid); }
    G.player.tin = clamp(G.player.tin + 2, 0, 100);
    addChron(G, 'Giao ước "' + a.n + '" với ' + LT.natName(G, nid) + ' thành công (điểm ' + p.total + ' ≥ ' + a.th + ').');
    return { ok: true, win: true, p, text: LT.natName(G, nid) + ' đồng ý: ' + a.n + '.' };
  }
  w_rel(G, nid, -3);
  return { ok: true, win: false, p, text: LT.natName(G, nid) + ' từ chối (điểm ' + p.total + ' < ngưỡng ' + a.th + ').' };
};
function w_rel(G, nid, d) { G.world.rel[nid] = clamp(G.world.rel[nid] + d, -100, 100); }
LT.breakRelations = function (G, nid) {
  if (!G.world.ns[nid].alive) return { ok: false, err: 'Nước này đã bị diệt' };
  w_rel(G, nid, -30); for (const k in G.treaties) { const i = G.treaties[k].indexOf(nid); if (i >= 0) G.treaties[k].splice(i, 1); }
  G.player.tin = clamp(G.player.tin - 6, 0, 100);
  addChron(G, 'Bạn tuyệt giao với ' + LT.natName(G, nid) + '.');
  return { ok: true, text: 'Tuyệt giao với ' + LT.natName(G, nid) + ': quan hệ −30, Tín −6, mọi giao ước chấm dứt.' };
};

// ---- nhịp tuần của thiên hạ ---------------------------------------------------------------------
LT.worldWeek = function (G) {
  const w = G.world; if (!w) return;
  LT.citiesWeek(G);
  // hết hạn bất xâm phạm; triều cống thường niên
  for (const nid of G.treaties.batxam.slice()) if ((w.exp['batxam' + nid] || 0) <= G.tick) { G.treaties.batxam.splice(G.treaties.batxam.indexOf(nid), 1); addChron(G, 'Giao ước bất xâm phạm với ' + LT.natName(G, nid) + ' hết hạn.'); }
  if (G.week === LT.TAX_WEEK_THU) for (const nid of w.tribute.slice()) {
    if (G.res.tien >= 40) { G.res.tien -= 40; LT.flowAdd(G, 'tien', -40, 'Triều cống ' + LT.natName(G, nid)); w.rel[nid] = clamp(w.rel[nid] + 3, -100, 100); }
    else { w.tribute.splice(w.tribute.indexOf(nid), 1); const i = G.treaties.xungthan.indexOf(nid); if (i >= 0) G.treaties.xungthan.splice(i, 1); w.rel[nid] -= 15; LT.log(G, 'Không đủ tiền triều cống ' + LT.natName(G, nid) + ': giao ước tan vỡ.', 'bad'); }
  }
  if (G.week % 3 !== 0) return;
  // quan hệ trôi về mức nền theo tính cách; ngoại giao thông thương nâng quan hệ
  for (let i = 0; i < 12; i++) {
    if (i === G.nation || !w.ns[i].alive) continue;
    const base = NAT[i].chr === 'hiếu chiến' ? -12 : NAT[i].chr === 'trọng thương' ? 14 : NAT[i].chr === 'phản trắc' ? -4 : 4;
    let d = (base - w.rel[i]) * .012 + (LT.rand(G) - .5) * 1.2;
    if (G.treaties.thongthuong.indexOf(i) >= 0) d += .25; if (G.treaties.hoathan.indexOf(i) >= 0) d += .3;
    w.rel[i] = clamp(w.rel[i] + d, -100, 100);
  }
  // ổn định, quân của các nước dao động
  for (const n of w.ns) { if (!n.alive) continue; n.stab = clamp(n.stab + (LT.rand(G) - .5) * 3, 10, 95); n.army = clamp(n.army + (LT.rand(G) - .5) * 4, 15, 95); }
  // chiến tranh giữa các nước máy: mỗi ~12 tuần
  if (G.tick - w.lastCheck >= 12) { w.lastCheck = G.tick; LT.aiWar(G); }
  histEvents(G);
  // xâm lấn
  if (G.tick % 12 === 0 && !G.pendingBattle && !G.pendingEvent && !G.raid) LT.maybeInvade(G);
};
function aiWarOld(G) {
  const w = G.world, alive = w.ns.filter(n => n.alive);
  if (alive.length < 4) return;
  for (let k = 0; k < 2; k++) {
    const i = alive[Math.floor(LT.rand(G) * alive.length)].id, adj = NAT[i].adj.filter(j => w.ns[j].alive); if (!adj.length) continue;
    const j = adj[Math.floor(LT.rand(G) * adj.length)];
    const chr = { 'hiếu chiến': 1.0, 'phản trắc': .5, 'thủ thành': .1, 'trọng thương': .15 }[NAT[i].chr];
    if (LT.rand(G) > chr * .6) continue;
    const si = w.ns[i].cities * w.ns[i].army * (1 + (NAT[i].chr === 'hiếu chiến' ? .1 : 0)), sj = w.ns[j].cities * w.ns[j].army;
    const pWin = si / (si + sj);
    const a = LT.rand(G) < pWin ? i : j, b = a === i ? j : i;
    if (b === G.nation && w.ns[b].cities <= 2) continue;
    if (a === G.nation && false) continue;
    const take = Math.max(1, Math.round(w.ns[b].cities * .12));
    w.ns[a].cities += take; w.ns[b].cities -= take; w.ns[b].stab = clamp(w.ns[b].stab - 8, 5, 95); w.ns[a].army = clamp(w.ns[a].army - 4, 15, 95);
    addChron(G, LT.natName(G, i) + ' đánh ' + LT.natName(G, j) + ': ' + LT.natName(G, a) + ' thắng, chiếm ' + take + ' thành của ' + LT.natName(G, b) + '.');
    if (w.ns[b].cities <= 0) { w.ns[b].alive = false; w.ns[b].cities = 0; addChron(G, LT.natName(G, b) + ' bị ' + LT.natName(G, a) + ' diệt.'); }
  }
}
function moveCities(G, from, to, frac) {
  const cs = G.world.cities.filter(c => c.own === from && !c.mine && !c.capital || (c.own === from && c.capital && frac >= 1 && !c.mine));
  const n = Math.ceil(cs.length * frac); cs.sort(() => LT.rand(G) - .5);
  for (const c of cs.slice(0, n)) { c.own = to; c.dt = Math.min(c.dt, 45); }
  LT.syncNations(G);
}
function histEvents(G) {
  const w = G.world, h = w.hist, y = G.year, rel = i => w.rel[i];
  const dl = 921 + (rel(1) > 30 ? 3 : 0);
  if (!h.doichu && y >= dl && w.ns[0].alive && w.ns[1].alive && LT.rand(G) < .12) {
    h.doichu = 1;
    if (G.nation === 0) { moveCities(G, 0, 1, .2); w.names[0] = 'Hậu Đường'; w.ns[0].stab = clamp(w.ns[0].stab - 25, 5, 95); addChron(G, 'Triều đình Trung Nguyên đổi chủ: nhà Lương sụp, Tấn lập Hậu Đường. Nước của bạn nay mang quốc hiệu Hậu Đường và mất bớt thành vùng biên; lòng người xao động.'); G.stat.dantam = clamp(G.stat.dantam - 6, 0, 100); G.nghiky = Math.min(100, G.nghiky + 8); }
    else if (G.nation === 1) { moveCities(G, 0, 1, .7); w.names[1] = 'Hậu Đường'; addChron(G, 'Tấn của bạn diệt phần lớn Hậu Lương, lập Hậu Đường! Lãnh thổ nở rộng, quân phiên trấn khắp nơi tranh công.'); G.player.uyvong = clamp(G.player.uyvong + 4, 0, 100); }
    else { moveCities(G, 0, 1, .75); w.names[1] = 'Hậu Đường'; w.ns[1].mob = Math.min(.95, w.ns[1].mob + .15); addChron(G, 'Tấn diệt phần lớn Hậu Lương, lập nhà Hậu Đường — Trung Nguyên đổi chủ. Các nước run sợ.'); G.pendingNews = 'Trung Nguyên đổi chủ: nhà Hậu Đường thay nhà Lương.'; }
  }
  const kd = 923 + (rel(10) > 40 ? 4 : 0) - (rel(10) < -30 ? 1 : 0);
  if (!h.khietdan && y >= kd && w.ns[10].alive && LT.rand(G) < .12) {
    h.khietdan = G.tick; w.ns[10].mob = Math.min(.95, w.ns[10].mob + .2); w.ns[10].troops *= 1.3;
    addChron(G, 'Khiết Đan nam hạ! Kỵ binh du mục tràn qua biên giới phía bắc; các nước láng giềng của Khiết Đan lo sợ.');
    for (const j of NAT[10].adj) w.ns[j].stab = clamp(w.ns[j].stab - 10, 5, 95);
    if (NAT[G.nation].adj.indexOf(10) >= 0 || G.nation === 10) { w.rel[10] = clamp(w.rel[10] - 15, -100, 100); G.pendingNews = 'Khiết Đan nam hạ: biên giới phía bắc bất ổn; nguy cơ xâm lấn tăng.'; }
  }
  if (!h.namxungde && y >= 930 && LT.rand(G) < .1) {
    h.namxungde = 1; const pick = [4, 7, 8, 3].filter(i => w.ns[i].alive); const i = pick[Math.floor(LT.rand(G) * pick.length)];
    if (i != null) { w.ns[i].mob = Math.min(.95, w.ns[i].mob + .1); w.names[i] = LT.natName(G, i) + ' (đế)'; addChron(G, LT.natName(G, i).replace(' (đế)', '') + ' xưng đế ở phương nam; các nước nhìn nhau dò xét.'); w.rel[i] = clamp(w.rel[i] - 5, -100, 100); }
  }
  if (!h.thontinh && y >= 924 && LT.rand(G) < .1) {
    const small = w.ns.filter(n => n.alive && n.id !== G.nation && n.id < 12 && n.cities <= 6 && !G.world.cities.some(c => c.own === n.id && c.mine)).sort((a, b) => a.cities - b.cities)[0];
    if (small) { const nb = NAT[small.id].adj.filter(j => w.ns[j].alive && j !== small.id).sort((a, b) => w.ns[b].cities - w.ns[a].cities)[0]; if (nb != null) { h.thontinh = 1; moveCities(G, small.id, nb, 1); addChron(G, LT.natName(G, small.id) + ' bị ' + LT.natName(G, nb) + ' thôn tính. Một nước nhỏ nữa biến mất khỏi bản đồ.'); } }
  }
}
LT.afterNationBattle = function (G, nid, won) {
  if (nid == null || !G.world) return;
  G.world.rel[nid] = clamp(G.world.rel[nid] + (won ? -8 : 6), -100, 100);
  if (won) { G.world.ns[nid].army = clamp(G.world.ns[nid].army - 6, 15, 95); G.player.thanhdanh = clamp(G.player.thanhdanh + 3, 0, 100); addChron(G, 'Bạn đẩy lui quân ' + LT.natName(G, nid) + '; thanh danh tăng.'); }
  else addChron(G, 'Quân ' + LT.natName(G, nid) + ' thắng ở huyện của bạn và ép nộp tuế tệ.');
};
})(typeof globalThis !== 'undefined' ? globalThis : window);

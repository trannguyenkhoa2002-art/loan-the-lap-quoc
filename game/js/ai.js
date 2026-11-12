'use strict';
// ============================================================================
// GIAI ĐOẠN 4 — AI CÁC NƯỚC VÀ THẾ GIỚI ĐỘNG
//  - mỗi nước có tham vọng (bành trướng / giữ đất / buôn bán / sinh tồn), độ tin cậy, kho tiền, ký ức hai chiều (ơn, thù, bội ước)
//  - ngoại giao: liên minh, hòa ước, triều cống, chư hầu, tuyên chiến, liên quân chống kẻ mạnh nhất, phản bội khi tương quan đổi
//  - triều đình gọn của từng nước (dùng lại LT.newCourt): phe phái, binh biến, bù nhìn, đổi triều, nội chiến, kế vị
//  - kinh tế liên quốc gia: luồng thương mại, cấm vận, viện trợ, giá đặc sản ở chợ của bạn
//  - hậu chiến: thành mới chiếm có mức quy thuận, cần đồn trú, có thể nổi loạn hoặc ngả về chủ cũ (AI và người chơi)
// Dữ liệu ở G.world.ai (JSON thuần). Logic thuần, không DOM. Mỗi tuần chỉ xử lý vài nước để giữ bước tuần dưới ~8 ms.
// ============================================================================
(function (g) {
const LT = g.LT = g.LT || {};
const clamp = LT.clamp, NAT = LT.NATIONS, N = 12, WY = 36;
const AMB = {
  'bành trướng': { war: 1.0, peace: .55, trade: .7, ally: .6, mob: .9, d: 'muốn mở rộng bờ cõi, hễ thấy láng giềng yếu là ra tay' },
  'giữ đất': { war: .22, peace: 1.2, trade: 1.0, ally: 1.0, mob: .75, d: 'chỉ lo giữ vững đất cũ, ít khi gây chiến' },
  'buôn bán': { war: .1, peace: 1.5, trade: 1.9, ally: .9, mob: .55, d: 'sống bằng thương nghiệp, thích hòa, dùng cấm vận và viện trợ thay đao binh' },
  'sinh tồn': { war: .3, peace: 1.5, trade: .8, ally: 1.7, mob: .85, d: 'nhỏ yếu, tìm đồng minh để khỏi bị nuốt' },
};
LT.AI_AMB = AMB;
const FIDS = ['huancuu', 'vanthan', 'ngoaithich', 'noithan'];
const FN = { huancuu: 'Huân cựu võ thần', vanthan: 'Văn thần khoa bảng', ngoaithich: 'Ngoại thích', noithan: 'Nội thần' };
const SURN = ['Lý', 'Trần', 'Lưu', 'Chu', 'Triệu', 'Vương', 'Hoàng', 'Thạch', 'Quách', 'Mã', 'Dương', 'Từ', 'Cao', 'Ngô'];
const owner = c => c.mine ? 12 : c.own;
const nm = (G, i) => LT.natName(G, i);
const KID = (a, b) => a * N + b;
const rr = G => LT.rand(G);
const WN = new WeakMap();

// ---------------------------------------------------------------- khởi tạo
LT.aiEntity12 = function (G) {
  const P = G.pw; return LT.mineCount(G) >= 3 && !!(G.indep || G.rank >= 5 || (P && P.engaged && P.stance === 'cat' && P.tuchu >= 50));
};
LT.aiInit = function (G) {
  const w = G.world; if (w.ai) return w.ai;
  const seed = G.seed || 7, h = (i, k) => LT.hash(seed * 13 + i * 101 + k * 7.3);
  const ai = w.ai = { v: 1, n: [], o: [], gr: [], fv: [], br: new Array(N).fill(0), rep: new Array(N).fill(0), pm: [], pacts: [], wars: [], emb: [], wp: {}, coal: null, occ: [], sup: {}, rm: {}, flow: new Array(N * N).fill(0), offer: null, evt: null, last12: 0, cdWar: 0,
    stat: { war: 0, peace: 0, alliance: 0, betray: 0, coup: 0, rebel: 0, dyn: 0, vassal: 0, embargo: 0, aid: 0, coalition: 0, restore: 0, crisis: 0, tribute: 0 } };
  for (let i = 0; i < N; i++) {
    const chr = NAT[i].chr, r = h(i, 1);
    const amb = chr === 'hiếu chiến' ? (r < .8 ? 'bành trướng' : 'sinh tồn') : chr === 'phản trắc' ? (r < .5 ? 'bành trướng' : 'sinh tồn') : chr === 'thủ thành' ? (r < .8 ? 'giữ đất' : 'sinh tồn') : (r < .85 ? 'buôn bán' : 'giữ đất');
    ai.n.push({ amb, tr: chr === 'phản trắc' ? .1 + h(i, 2) * .25 : chr === 'trọng thương' ? .5 + h(i, 2) * .3 : chr === 'hiếu chiến' ? .25 + h(i, 2) * .25 : .45 + h(i, 2) * .3, gold: Math.round(120 + (w.ns[i] ? w.ns[i].cities : 5) * 30), court: LT.newCourt(i, seed), dyn: 1, sur: SURN[Math.floor(h(i, 3) * SURN.length)], crisis: null, lastCoup: -999, win: 0, warCool: 0, nev: [], dev: 0, ecoIdx: 0 });
    ai.pm.push({ fav: 0, gr: 0, br: 0 });
  }
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { ai.o.push(i === j ? 0 : Math.round(clamp(LT.relNat(G, i, j) * .6 + (h(i * N + j, 5) - .5) * 24, -80, 80))); ai.gr.push(0); ai.fv.push(0); }
  return ai;
};
LT.aiOn = G => !!(G.world && G.world.ai);

// ---------------------------------------------------------------- tiện ích
function nbMap(G) {
  const w = G.world, c0 = WN.get(w); if (c0 && c0.t === G.tick) return c0.nb;
  const nb = []; for (let i = 0; i <= N; i++) nb.push(new Set());
  for (const c of w.cities) { const a = owner(c); for (const bi of c.adj) { const b = owner(w.cities[bi]); if (a !== b) { nb[a].add(b); } } }
  WN.set(w, { t: G.tick, nb }); return nb;
}
LT.aiPower = function (G, i) {
  const w = G.world;
  if (i === 12) return LT.armyCount(G) * 1.1 + LT.mineCount(G) * 320;
  const ns = w.ns[i]; if (!ns || !ns.alive) return 0;
  return ns.troops * (.65 + .35 * ns.stab / 60) + ns.cities * 320;
};
const pwr = LT.aiPower;
const alive = (G, i) => i === 12 ? true : G.world.ns[i].alive;
function atWar(G, i, j) {
  const ai = G.world.ai;
  if (j === 12) return !!ai.wp[i]; if (i === 12) return !!ai.wp[j];
  for (const x of ai.wars) if ((x.a === i && x.b === j) || (x.a === j && x.b === i)) return x; return false;
}
const warsOf = (G, i) => G.world.ai.wars.filter(x => x.a === i || x.b === i);
function pact(G, i, j, k) { for (const p of G.world.ai.pacts) if (p.k === k && ((p.a === i && p.b === j) || (p.a === j && p.b === i))) return p; return null; }
const pactsOf = (G, i, k) => G.world.ai.pacts.filter(p => p.k === k && (p.a === i || p.b === i));
const isVassal = (G, i) => G.world.ai.pacts.some(p => p.k === 'chu' && p.b === i);
const overlordOf = (G, i) => { const p = G.world.ai.pacts.find(p => p.k === 'chu' && p.b === i); return p ? p.a : null; };
function embOf(G, a, b) { return G.world.ai.emb.find(e => (e.a === a && e.b === b) || (e.a === b && e.b === a)); }
const chron = (G, t, k, ids) => { LT.addChron(G, t, k, ids); };
function nev(G, i, t, k) { const A = G.world.ai.n[i]; if (!A) return; A.nev.unshift({ y: G.year, w: G.week, t, k: k || '' }); if (A.nev.length > 8) A.nev.length = 8; }
function note(G, ids, t, k) { chron(G, t, k, ids); for (const i of ids) if (i < N) nev(G, i, t, k); }
function mem(G, i, j, kind, v) { // i ghi nhớ điều j làm với mình
  const ai = G.world.ai; if (j === 12) { const m = ai.pm[i]; if (kind === 'gr') m.gr = clamp(m.gr + v, 0, 200); else if (kind === 'fv') m.fav = clamp(m.fav + v, 0, 200); else if (kind === 'br') m.br += v; return; }
  if (i === 12) return; const k = KID(i, j); if (kind === 'gr') ai.gr[k] = clamp(ai.gr[k] + v, 0, 200); else if (kind === 'fv') ai.fv[k] = clamp(ai.fv[k] + v, 0, 200);
}
const opinion = (G, i, j) => j === 12 ? G.world.rel[i] : G.world.ai.o[KID(i, j)];
const natCities = (G, i) => G.world.cities.filter(c => c.own === i && !c.mine);

// ---------------------------------------------------------------- nhịp tuần
LT.aiWeek = function (G) {
  const w = G.world, ai = LT.aiInit(G), t = G.tick, ns = w.ns;
  for (let i = 0; i < N; i++) if (ns[i].alive && (t + i) % 3 === 0) decide(G, i);
  if (t % 3 === 1) warWeek(G);
  if (t % 3 === 2) { tradeStep(G); LT.aiRefresh(G); }
  for (let i = 0; i < N; i++) if (ns[i].alive && t % 9 === i % 9) courtStep(G, i);
  if (t % 9 === 4) coalition(G);
  if (t % 3 === 0) pactsStep(G);
  if (G.week === 1) yearStep(G);
  LT.occWeek(G);
  playerWars(G);
};

// ---------------------------------------------------------------- kinh tế nước
function econ(G, i) {
  const w = G.world, ai = w.ai, A = ai.n[i], ns = w.ns[i], B = AMB[A.amb];
  const ho = LT.natHo(G, i), nw = warsOf(G, i).length + (ai.wp[i] ? 1 : 0);
  A.gold += ho * .0011 * (.7 + .3 * ns.stab / 60) * (.8 + .5 * B.trade / 2) - ns.troops * .00005 * (1 + nw);
  if (A.gold > 400) { // đầu tư theo tham vọng
    const cs = natCities(G, i); const spend = Math.min(A.gold - 250, 120);
    if (A.amb === 'bành trướng' || A.amb === 'sinh tồn') { ns.mob = Math.min(.95, ns.mob + .006); ns.troops = Math.min(LT.natMaxTroops(G, i) * 1.02, ns.troops + LT.natMaxTroops(G, i) * .012); A.gold -= spend; A.dev++; }
    else if (cs.length) { const c = cs[Math.floor(rr(G) * cs.length)]; c.ho = Math.min(LT.CITY_LEVELS[c.lvl].cap, Math.round(c.ho * (A.amb === 'buôn bán' ? 1.012 : 1.007))); c.wall = Math.min(100, c.wall + 2); A.gold -= spend; A.dev++; }
  }
  if (A.gold < -60) { ns.stab = clamp(ns.stab - 1.5, 5, 95); ns.mob = Math.max(.4, ns.mob - .004); A.gold = -60; }
  // tướng đóng quân ở thành mới chiếm: rút quân dã chiến lập đồn trú
  for (const c of cs0(G, i)) if (c.qt != null && c.gar < c.ho * .04 && ns.troops > 500) { const add = Math.min(Math.round(c.ho * .015), Math.round(ns.troops * .01)); c.gar += add; ns.troops -= add; }
}
const cs0 = (G, i) => (G.world.ai.occ || []).map(id => G.world.cities[id]).filter(c => c && c.own === i && !c.mine);

// ---------------------------------------------------------------- quyết định theo tháng
function updOp(G, i, j, heg, pw) {
  const ai = G.world.ai, k = KID(i, j), A = ai.n[i];
  let tg = LT.relNat(G, i, j) * .55 + ai.fv[k] * .5 - ai.gr[k] * .6 - ai.rep[j] * .35;
  if (pact(G, i, j, 'minh')) tg += 38; if (pact(G, i, j, 'chu')) tg += 12; if (atWar(G, i, j)) tg -= 32; if (embOf(G, i, j)) tg -= 22;
  if (A.amb === 'buôn bán' && ai.n[j].amb === 'buôn bán') tg += 10;
  for (const x of ai.wars) { const o1 = x.a === i ? x.b : x.b === i ? x.a : -1, o2 = x.a === j ? x.b : x.b === j ? x.a : -1; if (o1 >= 0 && o1 === o2) tg += 9; }
  if (heg === j && pw[j] > 1.5 * pw[i] && !pact(G, i, j, 'minh')) tg -= 14;
  ai.o[k] = clamp(ai.o[k] + (tg - ai.o[k]) * .12, -100, 100);
  ai.fv[k] *= .985; ai.gr[k] *= .985;
}
function hegemon(G, pw) { let h = -1, b = 0; for (let i = 0; i <= N; i++) { if (i === 12 && !LT.aiEntity12(G)) continue; if (!pw[i]) continue; if (pw[i] > b) { b = pw[i]; h = i; } } return h; }
function powAll(G) { const out = []; for (let i = 0; i <= N; i++) out.push(i === 12 ? (LT.aiEntity12(G) ? pwr(G, 12) : 0) : pwr(G, i)); return out; }
function decide(G, i) {
  const w = G.world, ai = w.ai, A = ai.n[i], ns = w.ns[i], t = G.tick, B = AMB[A.amb];
  econ(G, i);
  const pw = powAll(G), heg = hegemon(G, pw), nb = nbMap(G)[i];
  for (let j = 0; j < N; j++) if (j !== i && w.ns[j].alive) updOp(G, i, j, heg, pw);
  // sinh tồn khi bị đe dọa: nước yếu bị kẻ mạnh kề bên dần chuyển sang sinh tồn; hồi lại khi yên
  if (A.amb !== 'sinh tồn' && ns.cities <= 4 && A.amb !== 'bành trướng') { let thr = 0; for (const j of nb) if (j < N && pw[j] > 2.2 * pw[i]) thr++; if (thr >= 1 && rr(G) < .3) { A.amb = 'sinh tồn'; nev(G, i, 'Bị nước mạnh kề bên đe dọa, chuyển sang chiến lược sinh tồn: tìm đồng minh, giữ thành.', 'amb'); } }
  if (A.crisis && A.crisis.until > t) return;
  if (isVassal(G, i)) { vassalStep(G, i); return; }
  // 1. đồng minh có thể bị phản bội khi tương quan đổi
  for (const p of pactsOf(G, i, 'minh')) {
    const a = p.a === i ? p.b : p.a; if (!w.ns[a].alive) continue;
    const flip = pw[i] > 1.35 * pw[a] && B.war >= .22 && A.tr < .8, abandon = ai.coal && ai.coal.target === a && ai.coal.members.indexOf(i) >= 0, aCrisis = ai.n[a].crisis && ai.n[a].crisis.until > t;
    if (abandon && rr(G) < .3) { betray(G, i, a, 'đồng minh đã thành kẻ mạnh nhất, cả thiên hạ kết liên quân chống lại; bỏ minh ước để khỏi chết chung'); return; }
    if ((flip || (aCrisis && B.war >= .22 && A.tr < .7)) && rr(G) < .22 * (1 - A.tr) * (.5 + B.war)) { betray(G, i, a, flip ? 'tương quan lực lượng đã đổi (mạnh gấp ' + (pw[i] / Math.max(1, pw[a])).toFixed(1).replace('.', ',') + ' lần), đồng minh thành cái gai và miếng mồi' : 'đồng minh đang rối loạn triều chính, thừa cơ nuốt đất'); return; }
  }
  // 2. hòa / triều cống do chiến tranh xử lý ở warWeek; ở đây chỉ gây chiến, kết minh, cấm vận, viện trợ
  const nwar = warsOf(G, i).length + (ai.wp[i] ? 1 : 0), maxW = pw[i] >= pw.slice(0, N).sort((a, b) => b - a)[2] ? 2 : 1;
  if (nwar < maxW && ai.n[i].warCool <= t && ns.stab >= 30 && ns.troops > LT.natMaxTroops(G, i) * .28) { if (considerWar(G, i, pw, heg, nb)) return; }
  if (rr(G) < .05 * B.ally) allyUp(G, i, pw, heg);
  diploEco(G, i, pw);
  playerDeals(G, i, pw);
}
function considerWar(G, i, pw, heg, nb) {
  const w = G.world, ai = w.ai, A = ai.n[i], B = AMB[A.amb], t = G.tick;
  let best = null; const therm = ai.wars.length < 2 ? 1 + .9 * B.war : ai.wars.length > 5 ? .35 : 1, amul = .5 + .5 * B.war;
  for (const j of nb) {
    if (j === i || !alive(G, j) || isVassal(G, j) || pact(G, i, j, 'minh') || pact(G, i, j, 'chu')) continue;
    if (j === 12 && !LT.aiEntity12(G)) continue; if (atWar(G, i, j)) continue;
    const truce = pact(G, i, j, 'hoa'); if (truce && A.tr > .5 && rr(G) > (1 - A.tr) * .45) continue;
    const gt = (G.treaties && j === 12) ? 0 : 0;
    const r = pw[i] / Math.max(1, pw[j]), gr = j === 12 ? ai.pm[i].gr : ai.gr[KID(i, j)];
    let want = 0, why = '';
    if (B.war * (r - 1.05) * .8 > want) { want = B.war * (r - 1.05) * .8; why = (A.amb === 'bành trướng' ? 'tham vọng bành trướng: thấy ' : 'dù chuộng ' + A.amb + ' nhưng thấy ') + nm(G, j) + ' yếu hơn (mạnh gấp ' + r.toFixed(1).replace('.', ',') + ' lần)'; }
    if (gr / 70 > 0) { want += gr / 70; if (gr / 70 > .4) why = 'báo mối thù cũ với ' + nm(G, j) + (r < .9 ? ' dù thế yếu' : ''); }
    const jc = j < N ? ai.n[j].crisis : null; if (jc && jc.until > t && B.war >= .22) { want += .55 * Math.min(1, B.war + .3); why = 'thừa cơ ' + nm(G, j) + ' rối loạn triều chính (' + jc.kind + ')'; }
    if (ai.coal && ai.coal.target === j && ai.coal.members.indexOf(i) >= 0) { want += 1.0; why = 'tham gia liên quân chống ' + nm(G, j) + ', kẻ mạnh nhất thiên hạ'; }
    for (const p of pactsOf(G, i, 'minh')) { const a = p.a === i ? p.b : p.a; if (a !== j && atWar(G, a, j) && a < N) { want += .7; why = 'theo minh ước, giúp đồng minh ' + nm(G, a) + ' đánh ' + nm(G, j); } }
    if (j === 12) { want *= .8; if (w.rel[i] > 25) want *= .3; if (G.treaties.batxam.indexOf(i) >= 0 || G.treaties.lienminh.indexOf(i) >= 0 || G.treaties.hoathan.indexOf(i) >= 0) continue; }
    if (truce) { want *= .5; why += ' (bội hòa ước)'; }
    if (!best || want > best.want) best = { j, want, why, r, truce };
  }
  if (!best) return false;
  if (rr(G) < clamp(best.want * amul, 0, 1.3) * .038 * therm) { declareWar(G, i, best.j, best.why, best.truce); return true; }
  return false;
}
function declareWar(G, a, b, why, truce) {
  const w = G.world, ai = w.ai, t = G.tick;
  if (truce) { const p = truce; ai.pacts.splice(ai.pacts.indexOf(p), 1); ai.br[a]++; ai.rep[a] = clamp(ai.rep[a] + 8, 0, 100); mem(G, b, a, 'br', 1); mem(G, b, a, 'gr', 25); ai.stat.betray++; }
  mem(G, b, a, 'gr', 28); ai.stat.war++; ai.n[a].decl = (ai.n[a].decl || 0) + 1; ai.n[a].warCool = t + 36 * 2;
  if (b === 12) {
    ai.wp[a] = { since: t, why };
    chron(G, nm(G, a) + ' tuyên chiến với bạn — lý do: ' + why + '.', 'war', [a]); nev(G, a, 'Tuyên chiến với bạn: ' + why, 'war');
    if (!G.pendingNotice && !G.pendingEvent) { G.pendingNotice = { title: '⚔️ ' + nm(G, a) + ' tuyên chiến', text: nm(G, a) + ' tuyên chiến với bạn. Lý do: ' + why + '. Hãy lo thành phòng, đồn trú và quân dã chiến; có thể xin hòa hoặc kết minh với nước khác (tab Thiên hạ).' }; G.speed = 0; }
  } else {
    ai.wars.push({ a, b, since: t, why, sa: 0, sb: 0, last: t });
    note(G, [a, b], nm(G, a) + ' tuyên chiến với ' + nm(G, b) + (truce ? ' (bội hòa ước)' : '') + ' — lý do: ' + why + '.', 'war');
    // đồng minh tham chiến; chư hầu theo chủ
    for (const [x, y] of [[a, b], [b, a]]) for (const p of pactsOf(G, x, 'minh')) { const al = p.a === x ? p.b : p.a; if (al === y || !w.ns[al].alive || atWar(G, al, y) || pact(G, al, y, 'minh')) continue; if (rr(G) < .55) { ai.wars.push({ a: al, b: y, since: t, why: 'theo minh ước giúp ' + nm(G, x), sa: 0, sb: 0, last: t, ally: true }); note(G, [al, y], nm(G, al) + ' tham chiến chống ' + nm(G, y) + ' theo minh ước với ' + nm(G, x) + '.', 'war'); } }
  }
  // quan hệ tụt dốc
  if (b < N) ai.o[KID(b, a)] = clamp(ai.o[KID(b, a)] - 25, -100, 100);
  if (a < N && b < N) ai.o[KID(a, b)] = clamp(ai.o[KID(a, b)] - 12, -100, 100);
}
function betray(G, i, a, why) {
  const ai = G.world.ai, p = pact(G, i, a, 'minh'); if (p) ai.pacts.splice(ai.pacts.indexOf(p), 1);
  ai.br[i]++; ai.rep[i] = clamp(ai.rep[i] + 14, 0, 100); ai.stat.betray++; mem(G, a, i, 'br', 1); mem(G, a, i, 'gr', 55);
  for (let j = 0; j < N; j++) if (j !== i && j !== a) ai.o[KID(j, i)] = clamp(ai.o[KID(j, i)] - 8, -100, 100);
  note(G, [i, a], nm(G, i) + ' BỘI MINH ƯỚC với ' + nm(G, a) + ': ' + why + '.', 'betray');
  declareWar(G, i, a, 'bội ước, ' + why, null);
}
function allyUp(G, i, pw, heg) {
  const w = G.world, ai = w.ai, A = ai.n[i], t = G.tick; if (pactsOf(G, i, 'minh').length >= 2) return;
  let best = null;
  for (let j = 0; j < N; j++) {
    if (j === i || !w.ns[j].alive || pact(G, i, j, 'minh') || atWar(G, i, j) || isVassal(G, j)) continue;
    if (pactsOf(G, j, 'minh').length >= 2) continue;
    let sc = ai.o[KID(i, j)] + ai.o[KID(j, i)] * .5 - ai.rep[j] * .6;
    for (const x of ai.wars) { const o1 = x.a === i ? x.b : x.b === i ? x.a : -1; if (o1 >= 0 && (x.a === j || x.b === j)) { sc -= 40; } else if (o1 >= 0 && atWar(G, j, o1)) sc += 15; }
    if (heg >= 0 && heg !== i && heg !== j && pw[heg] > 1.5 * Math.max(pw[i], pw[j])) sc += 14;
    if (sc > 24 && (!best || sc > best.sc)) best = { j, sc };
  }
  if (!best) return;
  const j = best.j, B2 = ai.n[j];
  if (ai.o[KID(j, i)] < 8 || rr(G) > .5 + (AMB[B2.amb].ally - .8) * .2) return;
  const why = heg >= 0 && heg !== i && heg !== j && pw[heg] > 1.5 * Math.max(pw[i], pw[j]) ? 'cùng lo trước sức mạnh của ' + nm(G, heg) : 'quan hệ tốt (' + Math.round(best.sc) + ') và cùng lợi ích';
  const dur = (5 + Math.floor(rr(G) * 5)) * WY;
  ai.pacts.push({ k: 'minh', a: i, b: j, since: t, until: t + dur }); ai.stat.alliance++;
  ai.o[KID(i, j)] = clamp(ai.o[KID(i, j)] + 12, -100, 100); ai.o[KID(j, i)] = clamp(ai.o[KID(j, i)] + 12, -100, 100);
  note(G, [i, j], nm(G, i) + ' và ' + nm(G, j) + ' kết minh ' + Math.round(dur / WY) + ' năm: ' + why + '.', 'pact');
}
// cấm vận, viện trợ giữa các nước (và thương lộ với bạn)
function diploEco(G, i, pw) {
  const w = G.world, ai = w.ai, A = ai.n[i], B = AMB[A.amb], t = G.tick;
  // dỡ cấm vận khi quan hệ đã dịu hoặc hết hạn
  for (const e of ai.emb.slice()) if (e.a === i && (e.until <= t || (e.b < N && ai.o[KID(i, e.b)] > 5) || (e.b === 12 && w.rel[i] > 5))) { ai.emb.splice(ai.emb.indexOf(e), 1); note(G, [i].concat(e.b < N ? [e.b] : []), nm(G, i) + ' dỡ cấm vận ' + (e.b === 12 ? 'với bạn' : 'với ' + nm(G, e.b)) + '.', 'econ'); }
  if (B.trade >= 1 && rr(G) < .035 * B.trade && ai.emb.filter(e => e.a === i).length < 2) { // cấm vận kẻ ghét mình thay cho đánh nhau
    let tgt = -1, low = -28; for (let j = 0; j < N; j++) if (j !== i && w.ns[j].alive && !atWar(G, i, j) && !embOf(G, i, j) && !pact(G, i, j, 'minh') && ai.o[KID(i, j)] < low) { low = ai.o[KID(i, j)]; tgt = j; }
    if (tgt >= 0) { ai.emb.push({ a: i, b: tgt, since: t, until: t + 4 * WY, why: 'ghét ' + nm(G, tgt) + ' (quan hệ ' + Math.round(low) + ')' }); ai.stat.embargo++; mem(G, tgt, i, 'gr', 12); note(G, [i, tgt], nm(G, i) + ' cấm vận ' + nm(G, tgt) + ' (cắt thương lộ, không bán hàng): quan hệ ' + Math.round(low) + ', ' + nm(G, i) + ' ' + AMB[A.amb].d.split(',')[0] + '.', 'econ'); }
  }
  // viện trợ đồng minh đang đói/khủng hoảng
  if (B.trade >= 1 && A.gold > 300 && rr(G) < .06) {
    for (const p of pactsOf(G, i, 'minh')) { const a = p.a === i ? p.b : p.a; const Aa = ai.n[a]; if (!w.ns[a].alive) continue; if ((Aa.crisis && Aa.crisis.until > t) || w.ns[a].stab < 38 || Aa.gold < 0) { A.gold -= 120; Aa.gold += 100; w.ns[a].stab = clamp(w.ns[a].stab + 5, 5, 95); mem(G, a, i, 'fv', 22); ai.o[KID(a, i)] = clamp(ai.o[KID(a, i)] + 10, -100, 100); ai.stat.aid++; note(G, [i, a], nm(G, i) + ' viện trợ ' + nm(G, a) + ' 100 quan để vượt cơn nguy (ổn định +5).', 'econ'); break; }
    }
  }
}
// tương tác với người chơi: cấm vận thương lộ, đề nghị hòa/kết minh/triều cống
function playerDeals(G, i, pw) {
  const w = G.world, ai = w.ai, A = ai.n[i], B = AMB[A.amb], t = G.tick, t2 = LT.t2 ? LT.t2(G) : null;
  const e12 = ai.emb.find(e => e.a === i && e.b === 12);
  if (!e12 && B.trade >= .8 && w.rel[i] < -38 && ai.pm[i].gr > 20 && rr(G) < .05 * B.trade) { ai.emb.push({ a: i, b: 12, since: t, until: t + 3 * WY, why: 'quan hệ với bạn ' + Math.round(w.rel[i]) + ', còn nhớ mối thù' }); ai.stat.embargo++; note(G, [i], nm(G, i) + ' cấm vận bạn: chặn thương lộ và không bán hàng đặc sản (quan hệ ' + Math.round(w.rel[i]) + ').', 'econ'); LT.log(G, nm(G, i) + ' cấm vận bạn, thương lộ qua nước này bị chặn.', 'bad'); }
  if (ai.offer || G.pendingEvent || G.pendingBattle || G.pendingNotice || G.rank < 2 || t - ai.last12 < 54) return;
  const hostile = ai.wp[i];
  if (hostile && t - hostile.since > 30 && rr(G) < .09 && (A.gold < 100 || ns12lost(G, i))) { ai.offer = { nid: i, kind: 'hoa', why: 'đánh lâu không thắng, quân mệt' }; }
  else if (!hostile && w.rel[i] > 35 && G.treaties.lienminh.indexOf(i) < 0 && ai.n[i].amb !== 'bành trướng' && rr(G) < .04 * AMB[A.amb].ally && nbMap(G)[i].has(12)) { ai.offer = { nid: i, kind: 'minh', why: 'quý trọng tín nghĩa của bạn và cùng lo bị nước mạnh ép' }; }
  else if (!hostile && pw[i] > 2.2 * Math.max(300, pwr(G, 12) || LT.armyCount(G)) && A.amb === 'bành trướng' && w.rel[i] < 10 && G.rank >= 3 && rr(G) < .025 && LT.mineCount(G) >= 3 && nbMap(G)[i].has(12)) { ai.offer = { nid: i, kind: 'cong', why: 'thấy bạn nhỏ yếu hơn nhiều, đòi cống để khỏi động binh' }; }
  if (ai.offer) { ai.last12 = t; G.pendingEvent = { id: 'aioffer' }; G.speed = 0; }
}
const ns12lost = (G, i) => (G.world.ns[i].troops < LT.natMaxTroops(G, i) * .5);
function vassalStep(G, i) {
  const ai = G.world.ai, p = ai.pacts.find(p => p.k === 'chu' && p.b === i); if (!p) return;
  const o = p.a, ow = G.world.ns[o]; if (!ow || !ow.alive) { ai.pacts.splice(ai.pacts.indexOf(p), 1); return; }
  const pi = pwr(G, i), po = pwr(G, o), oc = ai.n[o].crisis && ai.n[o].crisis.until > G.tick;
  if ((pi > .8 * po || oc) && rr(G) < .06) { ai.pacts.splice(ai.pacts.indexOf(p), 1); mem(G, o, i, 'gr', 30); ai.stat.rebel++; ai.n[i].warCool = G.tick + 36; note(G, [i, o], nm(G, i) + ' thoát khỏi ách chư hầu của ' + nm(G, o) + ' (' + (oc ? 'chủ đang rối loạn triều chính' : 'đã đủ mạnh') + ').', 'rebel'); }
}

// ---------------------------------------------------------------- chiến tranh
function warWeek(G) {
  const w = G.world, ai = w.ai, t = G.tick;
  for (const x of ai.wars.slice()) {
    if (!ai.wars.includes(x)) continue; if (!w.ns[x.a].alive || !w.ns[x.b].alive) { endWar(G, x, 'dead'); continue; }
    const age = (t - x.since) / 3;
    // đánh: bên công mạnh tay hơn, bên thủ phản công thưa hơn
    if (rr(G) < .45) strike(G, x.a, x.b, x, 1);
    if (!ai.wars.includes(x)) continue;
    if (rr(G) < .26) strike(G, x.b, x.a, x, 0);
    if (!ai.wars.includes(x)) continue;
    // xin hòa
    const A = ai.n[x.a], B = ai.n[x.b], pa = pwr(G, x.a), pb = pwr(G, x.b);
    const lopsided = Math.max(x.sa, x.sb) - Math.min(x.sa, x.sb);
    const wish = .012 + age * .0035 + (pa < .6 * pb || pb < .6 * pa ? .03 : 0) + lopsided * .015;
    if (age > 5 && rr(G) < wish * AMB[(x.sa >= x.sb ? B : A).amb].peace * .6) tryPeace(G, x);
  }
  // nước bị nuốt hết thì gỡ pact
}
function tryPeace(G, x) {
  const ai = G.world.ai, t = G.tick, win = x.sa > x.sb || (x.sa === x.sb && pwr(G, x.a) >= pwr(G, x.b)) ? x.a : x.b, los = win === x.a ? x.b : x.a;
  const r = pwr(G, win) / Math.max(1, pwr(G, los)), W = ai.n[win];
  // kẻ thắng bành trướng còn muốn đánh nữa thì từ chối khi đang thắng thế
  if (W.amb === 'bành trướng' && r > 1.4 && (t - x.since) < 36 * 4 && rr(G) < .65) return;
  const caps = win === x.a ? x.sa : x.sb;
  endWar(G, x, 'peace');
  if (caps >= 3 && r > 2.6 && !isVassal(G, los) && pactsOf(G, los, 'chu').length === 0) {
    ai.pacts.push({ k: 'chu', a: win, b: los, since: t, until: t + 12 * WY }); ai.stat.vassal++;
    for (const p of ai.pacts.slice()) if (p.k === 'minh' && (p.a === los || p.b === los)) ai.pacts.splice(ai.pacts.indexOf(p), 1);
    note(G, [win, los], nm(G, los) + ' xin hàng, thành chư hầu của ' + nm(G, win) + ' (mỗi năm cống nộp): ' + nm(G, win) + ' đã chiếm ' + caps + ' thành, mạnh gấp ' + r.toFixed(1).replace('.', ',') + ' lần.', 'pact');
  } else if (caps >= 1 && r > 1.5 && !pact(G, win, los, 'cong')) {
    ai.pacts.push({ k: 'cong', a: win, b: los, since: t, until: t + 5 * WY }); ai.stat.tribute++;
    ai.pacts.push({ k: 'hoa', a: win, b: los, since: t, until: t + 4 * WY });
    note(G, [win, los], 'Hòa ước ' + nm(G, win) + ' – ' + nm(G, los) + ': ' + nm(G, los) + ' nộp cống 5 năm, hai bên đình chiến 4 năm.', 'peace');
  } else { ai.pacts.push({ k: 'hoa', a: x.a, b: x.b, since: t, until: t + 4 * WY }); note(G, [x.a, x.b], 'Hòa ước ' + nm(G, x.a) + ' – ' + nm(G, x.b) + ': đình chiến 4 năm, đôi bên đều mệt mỏi.', 'peace'); }
}
function endWar(G, x, how) {
  const ai = G.world.ai; const i = ai.wars.indexOf(x); if (i >= 0) ai.wars.splice(i, 1);
  if (how === 'peace') { ai.stat.peace++; ai.n[x.a].warCool = G.tick + 36 * 2; ai.n[x.b].warCool = G.tick + 36 * 3; ai.n[x.a].win *= .5; for (const j of [x.a, x.b]) { /* chiến tranh phụ thuộc cùng kết thúc */ } for (const y of ai.wars.slice()) if (y.ally && ((y.a === x.a || y.a === x.b) && (y.b === x.a || y.b === x.b))) ai.wars.splice(ai.wars.indexOf(y), 1); }
}
// một đòn đánh: công bằng quân dã chiến thật của nước, kết quả ghi vào biên niên
function strike(G, atkId, defId, war, isAtk) {
  const w = G.world, cs = w.cities, ai = w.ai, atk = w.ns[atkId], def = w.ns[defId];
  const A = ai.n[atkId]; if (A.crisis && A.crisis.until > G.tick) return;
  if (atk.troops < LT.natMaxTroops(G, atkId) * .2 && rr(G) < .75) return;     // quân đã kiệt thì nghỉ dưỡng sức
  const pairs = []; for (const a of cs) if (a.own === atkId && !a.mine) for (const bi of a.adj) { const b = cs[bi]; if (b.own === defId && !b.mine) pairs.push([a, b]); }
  if (!pairs.length) { if (isAtk) war.last = G.tick; return; }
  // ưu tiên thành yếu (ít quân thủ, quy thuận thấp)
  let pick = null, bs = -1; for (let k = 0; k < Math.min(3, pairs.length); k++) { const pr = pairs[Math.floor(rr(G) * pairs.length)], s = 1 / (1 + pr[1].gar) + (pr[1].qt != null ? .002 : 0); if (s > bs) { bs = s; pick = pr; } }
  const [a, b] = pick;
  let sizeMul = 1, defMul = 1;
  for (const p of pactsOf(G, defId, 'minh')) { const al = p.a === defId ? p.b : p.a; if (w.ns[al].alive && !atWar(G, al, atkId)) defMul += .12; }
  for (const p of pactsOf(G, atkId, 'minh')) { const al = p.a === atkId ? p.b : p.a; if (w.ns[al].alive && !atWar(G, al, defId)) sizeMul += .12; }
  const over = Math.max(0, atk.cities - 14) * .035; sizeMul *= 1 - Math.min(.55, over);
  if (ai.coal && ai.coal.target === defId && ai.coal.members.indexOf(atkId) >= 0) sizeMul *= 1.35;
  if (ai.coal && ai.coal.target === atkId && ai.coal.members.indexOf(defId) >= 0) defMul *= 1.3;
  const size = LT.natField(G, atkId) * (.3 + rr(G) * .3) * sizeMul * (1 + (A.amb === 'bành trướng' ? .08 : 0) + (ai.n[atkId].court.king.puppet ? -.1 : 0));
  const D = (b.gar + LT.natField(G, defId) * .35) * (1 + b.wall / 220) * defMul * (ai.n[defId].amb === 'giữ đất' ? 1.1 : 1);
  const win = rr(G) < size / (size + D * 1.2);
  const lossA = Math.round(size * (win ? .1 : .28) * (.4 + D / (size + D))), lossD = Math.round((b.gar + LT.natField(G, defId) * .35) * (win ? .5 : .12));
  atk.troops = Math.max(0, atk.troops - lossA); def.troops = Math.max(0, def.troops - lossD); b.gar = Math.max(0, b.gar - Math.round(lossD * .5));
  if (win) {
    const old = b.own; LT.transferCity(G, b.id, atkId); b.ho = Math.round(b.ho * .85); b.dt = 40; b.wall = Math.round(b.wall * .5); b.gar = Math.round(b.ho * .03);
    LT.occStart(G, b, old);
    if (atkId === war.a) war.sa++; else war.sb++; A.win = clamp(A.win + 1, -4, 6); ai.n[defId].win = clamp(ai.n[defId].win - 1, -4, 6);
    mem(G, defId, atkId, 'gr', 22);
    chron(G, nm(G, atkId) + ' (' + LT.fmtN(size) + ' quân) hạ ' + b.n + ' của ' + nm(G, defId) + '; thương vong ' + LT.fmtN(lossA) + ' / ' + LT.fmtN(lossD) + '. Thành mới quy thuận thấp, cần đồn trú.', 'war', [atkId, defId]);
    if (def.cities === 0 || w.ns[defId].cities === 0) { def.alive = false; def.troops = 0; chron(G, nm(G, defId) + ' bị ' + nm(G, atkId) + ' diệt.', 'war', [atkId, defId]); cleanDead(G, defId); }
    if (size + lossD > 100000) chron(G, 'Một trận đại chiến hơn 100.000 quân đã diễn ra quanh ' + b.n + '.', 'war', [atkId, defId]);
    if (b.capital && w.ns[defId].alive) { w.ns[defId].stab = clamp(w.ns[defId].stab - 18, 5, 95); }
  } else if (rr(G) < .4) chron(G, nm(G, atkId) + ' đánh ' + b.n + ' của ' + nm(G, defId) + ' nhưng bị đẩy lui (mất ' + LT.fmtN(lossA) + ' quân).', 'war', [atkId, defId]);
  LT.syncNations(G);
}
function cleanDead(G, i) {
  const ai = G.world.ai;
  ai.wars = ai.wars.filter(x => x.a !== i && x.b !== i); ai.pacts = ai.pacts.filter(p => p.a !== i && p.b !== i); ai.emb = ai.emb.filter(e => e.a !== i && e.b !== i);
  delete ai.wp[i]; if (ai.coal) { ai.coal.members = ai.coal.members.filter(m => m !== i); if (ai.coal.target === i) ai.coal = null; }
}
// chiến tranh giữa AI và người chơi: bước vào maybeInvade (xâm lấn thật); ở đây chỉ dọn cờ khi hòa/hết lý do
function playerWars(G) {
  const ai = G.world.ai, t = G.tick; if (t % 6 !== 3) return;
  for (const k in ai.wp) { const i = +k; const x = ai.wp[k]; if (!G.world.ns[i].alive || G.treaties.batxam.indexOf(i) >= 0 || G.treaties.hoathan.indexOf(i) >= 0 || (t - x.since > 36 * 4 && rr(G) < .08)) { delete ai.wp[k]; if (G.world.ns[i].alive) { chron(G, 'Chiến tranh giữa ' + nm(G, i) + ' và bạn lắng xuống.', 'peace', [i]); } } }
}
LT.aiInvadeMul = function (G, j) { const ai = G.world.ai; if (!ai) return 1; let m = 1; if (ai.wp[j]) m *= 2.6; if (ai.coal && G.world.ai.coal.target === 12 && ai.coal.members.indexOf(j) >= 0) m *= 1.6; if (G.treaties.batxam.indexOf(j) < 0 && ai.pm[j].gr > 30) m *= 1.25; return m; };
LT.aiNoteInvasion = function (G, j) { // maybeInvade mở trận: ghi rõ lý do để người chơi hiểu
  const ai = G.world.ai; if (!ai || ai.wp[j]) return; const A = ai.n[j];
  const why = ai.pm[j].gr > 25 ? 'còn nhớ mối thù với bạn' : AMB[A.amb].war >= .9 ? 'tham vọng bành trướng, thấy đất bạn giáp biên có thể lấn' : G.world.rel[j] < -20 ? 'quan hệ với bạn tồi tệ (' + Math.round(G.world.rel[j]) + ')' : 'thấy bạn dễ bắt nạt';
  ai.wp[j] = { since: G.tick, why }; ai.stat.war++; mem(G, j, 12, 'gr', 0); chron(G, nm(G, j) + ' xuất quân đánh bạn — lý do: ' + why + '.', 'war', [j]); nev(G, j, 'Đánh bạn: ' + why, 'war');
};
LT.aiNote = function (G, j, what) {
  const ai = G.world.ai; if (!ai || j == null || j >= N) return; const A = ai.n[j];
  if (what === 'lost') { A.win = clamp(A.win - 1, -4, 6); ai.pm[j].gr = clamp(ai.pm[j].gr + 14, 0, 200); }
  if (what === 'won') { A.win = clamp(A.win + 1, -4, 6); ai.pm[j].gr = Math.max(0, ai.pm[j].gr - 6); }
};

// ---------------------------------------------------------------- liên quân, hiệp ước hết hạn, năm
function coalition(G) {
  const w = G.world, ai = w.ai, t = G.tick, pw = powAll(G); if (ai.coal) { const h = ai.coal.target; const tot = w.cities.length, sh = (h === 12 ? LT.mineCount(G) : w.ns[h].cities) / tot; if (t > ai.coal.until || sh < .2 || (h < N && !w.ns[h].alive)) { chron(G, 'Liên quân chống ' + nm(G, h) + ' tan rã' + (sh < .2 ? ' (kẻ mạnh nhất đã yếu đi)' : ' (hết hạn)') + '.', 'pact', h < N ? [h] : []); ai.coal = null; } return; }
  const h = hegemon(G, pw); if (h < 0) return; const tot = w.cities.length, cnt = h === 12 ? LT.mineCount(G) : w.ns[h].cities, sh = cnt / tot;
  let second = 0; for (let i = 0; i <= N; i++) if (i !== h && pw[i] > second) second = pw[i];
  if (sh < .24 || pw[h] < 1.45 * second) return;
  const members = []; for (let i = 0; i < N; i++) if (i !== h && w.ns[i].alive && !pact(G, i, h, 'minh') && !isVassal(G, i) && overlordOf(G, i) !== h && opinion(G, i, h) < 22) members.push(i);
  if (members.length < 2) return;
  ai.coal = { target: h, since: t, until: t + 8 * WY, members }; ai.stat.coalition++;
  chron(G, 'Các nước kết LIÊN QUÂN chống ' + nm(G, h) + ' (' + cnt + '/' + tot + ' thành, mạnh gấp ' + (pw[h] / Math.max(1, second)).toFixed(1).replace('.', ',') + ' lần nước đứng thứ hai): ' + members.map(i => nm(G, i)).join(', ') + ' sợ bị nuốt.', 'war', [h].concat(members.filter(m => m < N)));
  for (const i of members) mem(G, i, h, 'gr', 14);
}
function pactsStep(G) {
  const ai = G.world.ai, t = G.tick;
  for (const p of ai.pacts.slice()) {
    if (p.until <= t) { ai.pacts.splice(ai.pacts.indexOf(p), 1); if (p.k === 'minh') note(G, [p.a, p.b], 'Minh ước ' + nm(G, p.a) + ' – ' + nm(G, p.b) + ' hết hạn.', 'pact'); else if (p.k === 'cong') note(G, [p.a, p.b], nm(G, p.b) + ' hết hạn nộp cống ' + nm(G, p.a) + '.', 'pact'); else if (p.k === 'chu') note(G, [p.a, p.b], nm(G, p.b) + ' không còn là chư hầu của ' + nm(G, p.a) + '.', 'pact'); }
  }
  for (const e of ai.emb.slice()) if (e.until <= t || (e.b < N && !G.world.ns[e.b].alive) || !G.world.ns[e.a].alive) ai.emb.splice(ai.emb.indexOf(e), 1);
  // cống nạp theo năm (tuần 20)
}
function yearStep(G) {
  const w = G.world, ai = w.ai;
  for (const p of ai.pacts) if (p.k === 'cong' || p.k === 'chu') { const pay = Math.max(20, Math.round(Math.max(0, ai.n[p.b].gold) * .12 + LT.natHo(G, p.b) * .002)); ai.n[p.b].gold -= pay; ai.n[p.a].gold += pay; }
  for (let i = 0; i < N; i++) {
    const A = ai.n[i], ns = w.ns[i]; if (!ns.alive) continue;
    const C = A.court; C.king.age++;
    // tham vọng thích nghi theo tình thế
    if (A.amb === 'sinh tồn' && ns.cities >= 7 && rr(G) < .25) { A.amb = NAT[i].chr === 'trọng thương' ? 'buôn bán' : 'giữ đất'; nev(G, i, 'Đã vững lại, bỏ chiến lược sinh tồn, quay về ' + A.amb + '.', 'amb'); }
    if (ns.cities > 14) ns.stab = clamp(ns.stab - (ns.cities - 14) * .5, 5, 95);
    if (i !== G.nation && C.king.age >= 48 && rr(G) < (C.king.age - 47) * .022) succession(G, i);
    ai.n[i].ecoIdx = LT.natHo(G, i);
  }
  restoreStep(G);
}
// phục quốc: nước đã mất có thể được dựng lại khi kẻ mạnh nhất quá lớn
LT.origOwner = function (G, c) { let s = 0; for (const n of NAT) { s += n.cities; if (c.id < s) return n.id; } return -1; };
function restoreStep(G) {
  const w = G.world, ai = w.ai, tot = w.cities.length; let big = 0, bi = -1; for (let i = 0; i < N; i++) if (w.ns[i].alive && w.ns[i].cities > big) { big = w.ns[i].cities; bi = i; }
  const nAlive = w.ns.slice(0, N).filter(n => n.alive).length;
  if (!(big / tot > .2 || nAlive < 8) || rr(G) > .35) return;
  const dead = []; for (let i = 0; i < N; i++) if (!w.ns[i].alive && i !== G.nation) dead.push(i); if (!dead.length) return;
  const d = dead[Math.floor(rr(G) * dead.length)], cand = w.cities.filter(c => !c.mine && !c.seat && c.own !== d && w.ns[c.own].alive && w.ns[c.own].cities > 4 && !c.capital && LT.origOwner(G, c) === d);
  if (!cand.length) return; cand.sort((a, b) => w.ns[b.own].cities - w.ns[a.own].cities); const c = cand[0], old = c.own;
  w.ns[d].alive = true; LT.transferCity(G, c.id, d); w.ns[d].troops = Math.round(c.ho * .8); w.ns[d].mob = .6; w.ns[d].stab = 50; ai.n[d].gold = 100; ai.n[d].crisis = { kind: 'phục quốc', until: G.tick + 24, by: 'huancuu' }; ai.n[d].win = 0; ai.stat.restore++; ai.stat.rebel++;
  c.ho = Math.round(c.ho * .9); c.gar = Math.round(c.ho * .05); c.qt = null; delete c.pv;
  note(G, [d, old], 'PHỤC QUỐC: dân ' + c.n + ' nổi dậy khỏi ách ' + nm(G, old) + ', dựng lại nước ' + nm(G, d) + '.', 'rebel'); LT.syncNations(G);
}
// ---------------------------------------------------------------- triều đình từng nước
function courtStep(G, i) {
  const w = G.world, ai = w.ai, A = ai.n[i], C = A.court, ns = w.ns[i], t = G.tick; if (i === G.nation) return;   // triều đình nước của bạn do sổ thế lực (power.js) lo
  const nw = warsOf(G, i).length + (ai.wp[i] ? 1 : 0), win = A.win; A.win *= .9;
  const tg = { huancuu: 8 + (A.amb === 'bành trướng' ? 10 : 0) + win * 14, vanthan: 8 + (A.amb === 'buôn bán' || A.amb === 'giữ đất' ? 10 : 0) - nw * 11 + (ns.stab - 50) * .15, ngoaithich: 4 + (C.king.puppet ? 18 : C.king.age < 20 ? 6 : -8) + (ns.stab - 55) * .1, noithan: 6 + (win < 0 ? -10 : 0) + (A.gold < 0 ? -14 : 0) - (nw ? 3 : 0) };
  let hostile = 0, tot = 0, worst = null, wv = 0;
  for (const f of FIDS) { const x = C.f[f]; x.att = clamp(x.att + (tg[f] - x.att) * .28 + (rr(G) - .5) * 9, -100, 100); x.power = clamp(x.power + (rr(G) - .5) * 3 + (f === 'huancuu' ? win * 1.2 : 0) - (f === 'huancuu' && win < -1 ? 0 : 0), 6, 80); tot += x.power; if (x.att < 0) { const v = x.power * (-x.att / 40); hostile += v; if (v > wv) { wv = v; worst = f; } } }
  let un = clamp(hostile / Math.max(1, tot), 0, 1.5); if (ns.cities > 16) un += (ns.cities - 16) * .018; if (A.gold < 0) un += .08;
  ns.stab = clamp(ns.stab + (64 - un * 85 - ns.stab) * .09 - (nw ? 1 : 0), 6, 95);
  if (A.crisis) { if (A.crisis.until <= t) { nev(G, i, 'Nội loạn chấm dứt, triều đình tạm ổn.', 'court'); A.crisis = null; } return; }
  let p = clamp((un - .22) * .5 + (44 - ns.stab) / 230, 0, .32); if (t - A.lastCoup < 108) p *= .25;
  if (worst && rr(G) < p) coup(G, i, worst);
}
function coup(G, i, f) {
  const w = G.world, ai = w.ai, A = ai.n[i], C = A.court, ns = w.ns[i], t = G.tick, old = C.king.name;
  A.lastCoup = t; ai.stat.coup++; let kind = '', eff = '';
  const nameK = () => 'Vua ' + C.king.name;
  const newKing = () => { const KN = ['Trang', 'Cảnh', 'Hiếu', 'Minh', 'Thái', 'Hưng', 'Vĩnh', 'Khánh']; C.king.name = KN[Math.floor(rr(G) * KN.length)] + ' ' + ['Tông', 'Đế', 'Vương', 'Chủ'][Math.floor(rr(G) * 4)]; C.king.age = 16 + Math.floor(rr(G) * 20); };
  if (f === 'huancuu') {
    if (rr(G) < .6) { dynasty(G, i, 'tướng soái nắm binh quyền cướp ngôi'); kind = 'đổi triều'; return; }
    kind = 'binh biến'; ns.troops *= .93; ns.mob = Math.min(.95, ns.mob + .05); C.king.puppet = true; newKing(); if (rr(G) < .6) A.amb = 'bành trướng';
    eff = 'tướng võ thần thay vua, siết quân bị (động viên +5%), tham vọng ' + A.amb + '; quân hao 7% trong binh biến';
    C.f.huancuu.att = 30; C.f.vanthan.att -= 12;
  } else if (f === 'ngoaithich') { if (C.king.puppet && rr(G) < .45) { dynasty(G, i, 'ngoại thích nhiếp chính lâu năm soán ngôi vua bù nhìn'); return; } kind = 'ngoại thích chuyên quyền'; C.king.puppet = true; if (rr(G) < .55) A.amb = 'giữ đất'; ns.stab -= 6; eff = 'ngoại thích buông rèm nhiếp chính, vua thành bù nhìn, chính sách chuyển sang ' + A.amb; C.f.ngoaithich.att = 35; }
  else if (f === 'noithan') { if (C.king.puppet && rr(G) < .35) { dynasty(G, i, 'hoạn quan chuyên quyền lâu năm phế vua lập triều mới'); return; } kind = 'nội thần loạn chính'; newKing(); C.king.puppet = true; ns.stab -= 10; ns.mob = Math.max(.4, ns.mob - .04); eff = 'hoạn quan lập vua nhỏ, triều chính rối ren, quân bị sa sút'; C.f.noithan.att = 30; }
  else { kind = 'văn thần cải tổ'; ns.stab += 8; A.gold += 120; if (rr(G) < .6) A.amb = A.amb === 'bành trướng' ? 'giữ đất' : A.amb; eff = 'văn thần ép cải tổ, bớt binh đao, thêm 120 quan quốc khố'; C.f.vanthan.att = 30; }
  ns.stab = clamp(ns.stab, 5, 95); A.crisis = { kind, until: t + 8 + Math.floor(rr(G) * 12), by: f }; ai.stat.crisis++;
  note(G, [i], nm(G, i) + ': ' + FN[f] + ' gây ' + kind + ' (vua cũ ' + old + '): ' + eff + '.', 'coup');
  fallout(G, i, kind, f);
}
function dynasty(G, i, why) {
  const w = G.world, ai = w.ai, A = ai.n[i], C = A.court, ns = w.ns[i], t = G.tick, oldS = A.sur;
  let s; do { s = SURN[Math.floor(rr(G) * SURN.length)]; } while (s === oldS);
  A.sur = s; A.dyn++; ai.stat.dyn++; ai.stat.coup += 0; C.king.puppet = false; C.king.name = s + ' ' + ['Thái Tổ', 'Cao Tổ', 'Thế Tổ', 'Thánh Tổ'][Math.floor(rr(G) * 4)]; C.king.age = 30 + Math.floor(rr(G) * 25);
  A.amb = rr(G) < .6 ? 'bành trướng' : (rr(G) < .5 ? 'giữ đất' : A.amb); A.tr = clamp(A.tr + (rr(G) - .5) * .3, .15, .95);
  ns.stab = clamp(ns.stab - 14, 5, 95); ns.mob = Math.min(.95, ns.mob + .07); ns.troops *= .9; A.crisis = { kind: 'đổi triều', until: t + 12 + Math.floor(rr(G) * 12), by: 'huancuu' }; ai.stat.crisis++; A.lastCoup = t;
  for (const f of FIDS) { C.f[f].att = Math.round((rr(G) - .3) * 30); }
  for (const p of ai.pacts.slice()) if ((p.a === i || p.b === i) && p.k === 'minh' && rr(G) < .5) { ai.pacts.splice(ai.pacts.indexOf(p), 1); }
  for (const j of nbMap(G)[i]) if (j < N) ai.gr[KID(j, i)] += 0;
  note(G, [i], 'ĐỔI TRIỀU ở ' + nm(G, i) + ': ' + why + '. Nhà ' + s + ' lên thay nhà ' + oldS + ' (đời thứ ' + A.dyn + '), tham vọng mới: ' + A.amb + '; nước loạn một thời gian, một nửa minh ước bị hủy.', 'dyn');
  fallout(G, i, 'đổi triều', 'huancuu');
}
function succession(G, i) {
  const w = G.world, ai = w.ai, A = ai.n[i], C = A.court, ns = w.ns[i], t = G.tick, old = C.king.name; if (A.crisis && A.crisis.until > t) return;
  const hostile = Object.keys(C.f).filter(f => C.f[f].att < -8).length;
  C.king.age = 14 + Math.floor(rr(G) * 22); C.king.name = ['Trang', 'Cảnh', 'Hiếu', 'Minh'][Math.floor(rr(G) * 4)] + ' ' + ['Tông', 'Đế'][Math.floor(rr(G) * 2)]; C.king.puppet = C.king.age < 18;
  if (hostile >= 2 && rr(G) < .55) { A.crisis = { kind: 'tranh ngôi', until: t + 10 + Math.floor(rr(G) * 12), by: 'ngoaithich' }; ns.stab = clamp(ns.stab - 14, 5, 95); ai.stat.crisis++; note(G, [i], 'Vua ' + old + ' băng hà: các phe tranh ngôi ở ' + nm(G, i) + ', triều đình rối loạn (ổn định −14).', 'coup'); fallout(G, i, 'tranh ngôi', 'ngoaithich'); }
  else { ns.stab = clamp(ns.stab - 3, 5, 95); note(G, [i], 'Vua ' + old + ' băng hà, ' + C.king.name + ' kế vị êm thấm ở ' + nm(G, i) + '.', 'court'); }
}
// hậu quả của biến cố nội bộ: thành xa tách ra, mở cơ hội cho người chơi
function fallout(G, i, kind, f) {
  const w = G.world, ai = w.ai, ns = w.ns[i], t = G.tick;
  if (ns.cities >= 5 && rr(G) < .5) { // thành xa kinh đô nổi loạn, hàng nước láng giềng
    const cap = w.cities[w.capIds[i]], cs = natCities(G, i).filter(c => !c.capital).map(c => [Math.hypot(c.x - cap.x, c.y - cap.y), c]).sort((a, b) => b[0] - a[0]);
    for (const [, c] of cs.slice(0, 2)) { const nb = []; for (const bi of c.adj) { const d = w.cities[bi]; if (d.own !== i && !d.mine && w.ns[d.own].alive) nb.push(d.own); } if (nb.length && rr(G) < .6) { const to = nb[Math.floor(rr(G) * nb.length)], old = c.own; LT.transferCity(G, c.id, to); LT.occStart(G, c, old); c.qt = 45; ai.stat.rebel++; note(G, [i, to], 'Nhân ' + kind + ' ở ' + nm(G, i) + ', thành ' + c.n + ' nổi dậy đầu hàng ' + nm(G, to) + '.', 'rebel'); break; } }
  }
  if (!ai.evt && !G.pendingEvent && !G.pendingBattle && !G.pendingNotice && G.rank >= 2 && t - (ai.last12 || 0) > 40 && i !== G.nation) {
    const adjMe = G.world.cities.some(c => c.mine && c.adj.some(a => w.cities[a].own === i && !w.cities[a].mine)); const rel = w.rel[i];
    if (adjMe || rel > 30) { ai.evt = { nid: i, kind, f }; ai.last12 = t; G.pendingEvent = { id: 'aicrisis' }; G.speed = 0; }
  }
}

// ---------------------------------------------------------------- thương mại liên quốc gia, giá đặc sản
function tradeStep(G) {
  const w = G.world, ai = w.ai, nb = nbMap(G), t = G.tick;
  ai.flow.fill(0);
  for (let i = 0; i < N; i++) { if (!w.ns[i].alive) continue; for (const j of nb[i]) { if (j >= N || j < i || !w.ns[j].alive) continue; if (atWar(G, i, j) || embOf(G, i, j)) continue;
    const R1 = LT.REGION[i] || { du: [], thieu: [] }, R2 = LT.REGION[j] || { du: [], thieu: [] }; let comp = 1; for (const k of R1.du) if (R2.thieu.indexOf(k) >= 0) comp += .35; for (const k of R2.du) if (R1.thieu.indexOf(k) >= 0) comp += .35;
    const f = Math.sqrt(LT.natHo(G, i) * LT.natHo(G, j)) * .0007 * comp * (.6 + .2 * (AMB[ai.n[i].amb].trade + AMB[ai.n[j].amb].trade)); ai.flow[KID(i, j)] = ai.flow[KID(j, i)] = f; ai.n[i].gold += f; ai.n[j].gold += f; } }
}
// bảng hệ số cung theo mặt hàng cho chợ của bạn và cho các nước khác
LT.aiRefresh = function (G) {
  const w = G.world, ai = w.ai; if (!ai) return; const t = G.tick;
  const goods = LT.GOOD_IDS || Object.keys(LT.GOODS), prod = {};
  for (const k of goods) { prod[k] = []; for (let i = 0; i < N; i++) if ((LT.REGION[i] || { du: [] }).du.indexOf(k) >= 0) prod[k].push(i); }
  const sup = {}, rm = {};
  for (const k of goods) {
    const P = prod[k]; if (!P.length) { sup[k] = 1; continue; }
    let base = 0, eff = 0;
    for (const i of P) { const wt = Math.max(2, w.ns[i].cities), A = ai.n[i]; base += wt; if (!w.ns[i].alive) continue; let av = 1; if (embOf(G, i, 12)) av = 0; else { if (warsOf(G, i).length || ai.wp[i]) av *= .78; if (A.crisis && A.crisis.until > t) av *= .8; if (A.amb === 'buôn bán') av *= 1.08; if (G.treaties.thongthuong.indexOf(i) >= 0) av *= 1.15; if (w.rel[i] < -30) av *= .9; } eff += wt * av; }
    sup[k] = clamp(Math.pow(base / Math.max(.25 * base, eff), .7), .85, 1.8);
  }
  ai.sup = sup;
  for (let n = 0; n < N; n++) { rm[n] = {}; const R = LT.REGION[n] || { du: [], thieu: [] }; for (const k of R.thieu) { const P = prod[k].filter(i => i !== n); let base = 0, eff = 0; for (const i of P) { base += 2 + w.ns[i].cities; if (!w.ns[i].alive || embOf(G, i, n) || atWar(G, i, n)) continue; eff += 2 + w.ns[i].cities; } rm[n][k] = P.length ? clamp(Math.pow(base / Math.max(.3 * base, eff), .6), 1, 1.6) : 1; } }
  ai.rm = rm;
  // thương lộ bị chặn do cấm vận hoặc chiến tranh với bạn
  if (LT.t2) { const t2 = LT.t2(G); for (const e of ai.emb) if (e.b === 12 && !t2.block[e.a]) t2.block[e.a] = 5; for (const k in ai.wp) if (!t2.block[+k] && rr(G) < .3) t2.block[+k] = 4; }
};
LT.aiPriceMul = (G, k) => { const ai = G.world && G.world.ai; return ai && ai.sup && ai.sup[k] ? ai.sup[k] : 1; };
LT.aiRegionMul = (G, nid, k) => { const ai = G.world && G.world.ai; return ai && ai.rm && ai.rm[nid] && ai.rm[nid][k] ? ai.rm[nid][k] : 1; };
// công cụ ngoại giao của người chơi: viện trợ và cấm vận
LT.AID = { tien: { n: 'Viện trợ 100 quan', c: 100, rel: 10, stab: 3 }, luong: { n: 'Viện trợ 200 thạch lương', c: 200, rel: 12, stab: 4 } };
LT.aiAid = function (G, nid, kind) {
  const w = G.world, ai = LT.aiInit(G), A = LT.AID[kind]; if (!A) return { ok: false, err: 'Không rõ loại viện trợ' }; if (nid === G.nation || !w.ns[nid] || !w.ns[nid].alive || nid >= N) return { ok: false, err: 'Nước này không nhận viện trợ' };
  if (kind === 'tien' && G.res.tien < A.c) return { ok: false, err: 'Cần ' + A.c + ' quan' }; if (kind === 'luong' && G.res.luong < A.c) return { ok: false, err: 'Cần ' + A.c + ' thạch lương trong kho quan' };
  if (kind === 'tien') LT.addRes(G, 'tien', -A.c, 'Viện trợ ' + nm(G, nid)); else LT.addRes(G, 'luong', -A.c, 'Viện trợ ' + nm(G, nid));
  const gain = Math.round(A.rel * (NAT[nid].chr === 'trọng thương' ? 1.25 : NAT[nid].chr === 'hiếu chiến' ? .8 : 1)); w.rel[nid] = clamp(w.rel[nid] + gain, -100, 100); mem(G, nid, 12, 'fv', 20); ai.pm[nid].gr = Math.max(0, ai.pm[nid].gr - 8);
  w.ns[nid].stab = clamp(w.ns[nid].stab + A.stab, 5, 95); ai.n[nid].gold += kind === 'tien' ? 80 : 60; ai.stat.aid++;
  for (const e of ai.emb.filter(e => e.a === nid && e.b === 12)) if (rr(G) < .5) ai.emb.splice(ai.emb.indexOf(e), 1);
  chron(G, 'Bạn viện trợ ' + nm(G, nid) + ' (' + A.n.toLowerCase() + '): quan hệ +' + gain + ', ổn định +' + A.stab + '.', 'econ', [nid]); nev(G, nid, 'Nhận viện trợ của bạn: quan hệ +' + gain + '.', 'econ');
  return { ok: true, text: nm(G, nid) + ' nhận viện trợ: quan hệ +' + gain + ' (' + Math.round(w.rel[nid]) + '), ổn định +' + A.stab + '.' };
};
LT.aiEmbargoPlayer = function (G, nid, on) {
  const w = G.world, ai = LT.aiInit(G); if (nid === G.nation || !w.ns[nid] || !w.ns[nid].alive || nid >= N) return { ok: false, err: 'Không cấm vận được nước này' };
  const e = ai.emb.find(e => e.a === 12 && e.b === nid);
  if (!on) { if (!e) return { ok: false, err: 'Không đang cấm vận' }; ai.emb.splice(ai.emb.indexOf(e), 1); chron(G, 'Bạn dỡ cấm vận ' + nm(G, nid) + '.', 'econ', [nid]); LT.aiRefresh(G); return { ok: true, text: 'Đã dỡ cấm vận ' + nm(G, nid) + '.' }; }
  if (e) return { ok: false, err: 'Đang cấm vận nước này' }; if (G.rank < 2) return { ok: false, err: 'Cần chức Thứ sử trở lên' };
  ai.emb.push({ a: 12, b: nid, since: G.tick, until: G.tick + 4 * WY, why: 'bạn ra lệnh' }); ai.stat.embargo++; w.rel[nid] = clamp(w.rel[nid] - 12, -100, 100); mem(G, nid, 12, 'gr', 18);
  for (const k of ['thongthuong', 'hoathan']) { const i = G.treaties[k].indexOf(nid); if (i >= 0) G.treaties[k].splice(i, 1); }
  ai.n[nid].gold -= 60; w.ns[nid].stab = clamp(w.ns[nid].stab - 2, 5, 95);
  chron(G, 'Bạn cấm vận ' + nm(G, nid) + ': cắt thương lộ, không mua hàng đặc sản của họ (quan hệ −12).', 'econ', [nid]); nev(G, nid, 'Bị bạn cấm vận.', 'econ');
  LT.aiRefresh(G); return { ok: true, text: 'Đã cấm vận ' + nm(G, nid) + ' (4 năm): hàng đặc sản của họ khan hiếm ở chợ bạn, quan hệ −12.' };
};
LT.aiEmbargoOn = (G, nid) => !!(G.world.ai && G.world.ai.emb.find(e => e.a === 12 && e.b === nid));
LT.aiEmbargoBy = (G, nid) => !!(G.world.ai && G.world.ai.emb.find(e => e.a === nid && e.b === 12));

// ---------------------------------------------------------------- hậu chiến: quy thuận, đồn trú, nổi loạn
LT.occStart = function (G, c, old) {
  const ai = G.world.ai; c.qt = 28 + Math.round((c.dt || 40) / 10); c.pv = old; if (!ai) return;
  if (ai.occ.indexOf(c.id) < 0) ai.occ.push(c.id);
};
LT.occLenient = function (G, c) { return c.mine ? (c.nop < .55 || c.lowtax > 0 || c.pc === 'nong') : (G.world.ai && G.world.ai.n[c.own] && (G.world.ai.n[c.own].amb === 'giữ đất' || G.world.ai.n[c.own].amb === 'buôn bán')); };
LT.occWeek = function (G) {
  const w = G.world, ai = w.ai; if (!ai || !ai.occ.length) return;
  for (const id of ai.occ.slice()) {
    const c = w.cities[id]; if (!c || c.qt == null) { ai.occ.splice(ai.occ.indexOf(id), 1); continue; }
    const need = Math.max(20, c.ho * .04), gr = clamp(c.gar / need, 0, 2), len = LT.occLenient(G, c);
    const pvWar = c.pv != null && c.pv < N && w.ns[c.pv].alive && (atWar(G, owner(c), c.pv) || (c.mine && ai.wp[c.pv])) ? 1 : 0;
    const dq = .26 + (len ? .42 : 0) + .5 * Math.min(1, gr) - (c.dt < 35 ? .35 : 0) - pvWar * .25 - (c.mine && c.nop > .75 ? .3 : 0);
    c.qt = clamp(c.qt + dq, 0, 100);
    if (c.qt >= 70) { c.qt = null; delete c.pv; ai.occ.splice(ai.occ.indexOf(id), 1); if (c.mine) LT.log(G, 'Dân ' + c.n + ' đã quy thuận hẳn.', 'good'); continue; }
    if (gr >= 1) continue;
    const lack = 1 - gr, p = lack * (.01 + Math.max(0, 45 - c.qt) * .0016) + (gr < .25 ? .02 : 0);
    if (c.qt < 50 && rr(G) < p) occRebel(G, c);
  }
};
function occRebel(G, c) {
  const w = G.world, ai = w.ai, pv = c.pv, id = c.id, wasMine = c.mine, cur = owner(c); ai.stat.rebel++;
  const to = pv; let dest = to;
  if (dest == null) { c.qt = 30; return; }
  if (dest === 12) { // thành từng là của bạn, dân nổi dậy về với bạn
    if (!(LT.mineCount(G) > 0)) { c.qt = 30; return; }
    ai.stat.pBack = (ai.stat.pBack || 0) + 1; c.own = G.indep ? 12 : G.nation; LT.manage(G, c); c.lowtax = 36; c.tan = 6; c.ho = Math.round(c.ho * .94); c.dt = 50; c.gar = Math.round(c.ho * .03); c.qt = 40; c.pv = cur;
    LT.syncNations(G); LT.log(G, 'Dân ' + c.n + ' nổi dậy đuổi quân chiếm đóng và quay về với bạn!', 'good'); chron(G, 'Dân ' + c.n + ' nổi dậy, quay về với bạn.', 'rebel', cur < N ? [cur] : []); return;
  }
  if (!w.ns[dest].alive) { // chủ cũ đã mất nước: phục quốc
    const A = ai.n[dest]; w.ns[dest].alive = true; w.ns[dest].troops = Math.round(c.ho * 1.3 * .5); w.ns[dest].mob = .6; w.ns[dest].stab = 45; A.crisis = { kind: 'phục quốc', until: G.tick + 18, by: 'huancuu' }; A.gold = 80; ai.stat.restore++;
    chron(G, 'PHỤC QUỐC: dân ' + c.n + ' nổi dậy, dựng lại nước ' + nm(G, dest) + ' từ một thành.', 'rebel', [dest]);
  }
  if (wasMine) { ai.stat.pLost = (ai.stat.pLost || 0) + 1; if (c.quan != null && LT.offDefect) LT.offDefect(G, c); c.mine = false; LT.log(G, 'Thành ' + c.n + ' nổi loạn vì quy thuận thấp và thiếu đồn trú, theo về ' + nm(G, dest) + '!', 'bad'); if (!G.pendingNotice && !G.pendingEvent) { G.pendingNotice = { title: '🔥 Thành ' + c.n + ' nổi loạn', text: 'Dân ' + c.n + ' (mới chiếm, quy thuận chỉ ' + Math.round(c.qt) + '/100, đồn trú chỉ ' + c.gar + ' quân) nổi dậy và theo về ' + nm(G, dest) + '. Lần sau hãy đặt đồn trú ≥ 4% số hộ và chính sách khoan thuế (tab Thành của bạn).' }; G.speed = 0; } }
  LT.transferCity(G, c.id, dest); c.ho = Math.round(c.ho * .92); c.dt = 45; c.gar = Math.round(c.ho * .04); c.qt = null; delete c.pv; c.auto = 30; const k = ai.occ.indexOf(id); if (k >= 0) ai.occ.splice(k, 1);
  if (cur < N && dest < N) { mem(G, dest, cur, 'gr', 0); w.ns[cur].stab = clamp(w.ns[cur].stab - 3, 5, 95); }
  chron(G, 'Dân ' + c.n + ' nổi dậy khỏi ách ' + (cur === 12 ? 'của bạn' : nm(G, cur)) + ' (quy thuận thấp, thiếu đồn trú), trở về với ' + nm(G, dest) + '.', 'rebel', [dest].concat(cur < N ? [cur] : []));
  LT.syncNations(G);
}
// người chơi đặt đồn trú: rút quân dã chiến vào thành
LT.garrison = function (G, id, n) {
  const c = G.world.cities[id]; if (!c || !c.mine || id === G.seatId) return { ok: false, err: 'Không phải thành của bạn' };
  n = Math.floor(n); if (!(n > 0)) return { ok: false, err: 'Số quân phải lớn hơn 0' };
  const us = LT.usableUnits ? LT.usableUnits(G) : G.units, have = us.reduce((a, u) => a + u.n, 0); if (have < n + 50) return { ok: false, err: 'Quân dã chiến không đủ (có ' + have + ')' };
  if (G.camp) return { ok: false, err: 'Đang có chiến dịch, không rút quân được' };
  let left = n; for (const u of us.slice().sort((a, b) => b.n - a.n)) { const take = Math.min(left, Math.max(0, u.n - 20)); u.n -= take; left -= take; if (left <= 0) break; }
  G.units = G.units.filter(u => u.n > 0); const put = n - left; c.gar += put; if (LT.ensureFormation) LT.ensureFormation(G);
  return { ok: true, put, text: 'Đã đặt ' + put + ' quân đồn trú ở ' + c.n + ' (đồn trú ' + c.gar + ').' };
};

// ---------------------------------------------------------------- biến cố cho người chơi
LT.EVENTS.push(
  { id: 'aicrisis', icon: '🏴', title: 'Loạn ở nước láng giềng', weight: () => 0,
    text: G => { const e = (G.world.ai && G.world.ai.evt) || { nid: 0 }, i = e.nid; return nm(G, i) + ' đang ' + (e.kind || 'rối loạn') + ' (phe ' + (FN[e.f] || '') + '). Triều đình họ chia rẽ, quân đồn trú ở biên ải xao động. Đây là lúc nước khác có thể can thiệp hoặc thừa cơ.'; },
    opts: [
      { label: 'Ủng hộ phe nắm quyền (gửi 100 quan)', desc: 'Nước ấy mang ơn: quan hệ +20, ổn định +8; chấm dứt loạn sớm.', apply: G => { const ai = LT.aiInit(G), e = ai.evt || { nid: NAT[G.nation].adj[0], kind: 'rối loạn', f: 'huancuu' }, i = e.nid; if (G.res.tien >= 100) { LT.addRes(G, 'tien', -100, 'Ủng hộ ' + nm(G, i)); G.world.rel[i] = clamp(G.world.rel[i] + 20, -100, 100); G.world.ns[i].stab = clamp(G.world.ns[i].stab + 8, 5, 95); mem(G, i, 12, 'fv', 25); if (ai.n[i].crisis) ai.n[i].crisis.until = Math.min(ai.n[i].crisis.until, G.tick + 4); ai.evt = null; chron(G, 'Bạn ủng hộ phe cầm quyền ở ' + nm(G, i) + ' (100 quan); ' + nm(G, i) + ' mang ơn.', 'econ', [i]); return 'Bạn gửi lễ ủng hộ; họ mang ơn.'; } ai.evt = null; return 'Không đủ 100 quan, đành đứng nhìn.'; } },
      { label: 'Thừa cơ đánh biên', desc: 'Quân đồn trú các thành giáp biên của họ −35% trong lúc rối loạn; quan hệ −10, Tín −4. Cần xuất quân nhanh (tab Chiến dịch).', apply: G => { const ai = LT.aiInit(G), e = ai.evt || { nid: NAT[G.nation].adj[0], kind: 'rối loạn', f: 'huancuu' }, i = e.nid, w = G.world; for (const c of w.cities) if (c.own === i && !c.mine && c.adj.some(a => w.cities[a].mine)) c.gar = Math.round(c.gar * .65); w.rel[i] = clamp(w.rel[i] - 10, -100, 100); G.player.tin = clamp(G.player.tin - 4, 0, 100); mem(G, i, 12, 'gr', 20); w.ai.evt = null; chron(G, 'Bạn thừa cơ ' + nm(G, i) + ' rối loạn: quân biên của họ hao hụt.', 'war', [i]); return 'Quân đồn trú giáp biên của ' + nm(G, i) + ' còn 65%; hãy đánh trước khi họ ổn định.'; } },
      { label: 'Đứng ngoài, củng cố biên phòng', desc: 'Tốn 30 quan, quân đồn trú các thành của bạn +10%; không dính vào việc họ.', apply: G => { const ai = LT.aiInit(G); ai.evt = null; if (G.res.tien >= 30) LT.addRes(G, 'tien', -30, 'Củng cố biên phòng'); for (const c of G.world.cities) if (c.mine && c.id !== G.seatId) c.gar = Math.round(c.gar * 1.1); return 'Bạn đứng ngoài, nhưng tăng cường biên phòng (30 quan, đồn trú thành biên +10%).'; } },
    ] },
  { id: 'aioffer', icon: '🕊️', title: 'Sứ giả nước ngoài', weight: () => 0,
    text: G => { const o = (G.world.ai && G.world.ai.offer) || { nid: 0 }; return o.kind === 'hoa' ? nm(G, o.nid) + ' sai sứ xin đình chiến (' + o.why + '). Hòa thì biên cảnh yên, nhưng bạn bỏ lỡ cơ hội trả thù.' : o.kind === 'minh' ? nm(G, o.nid) + ' đề nghị kết minh: ' + o.why + '. Liên minh bảo hộ biên ải nhưng có thể lôi bạn vào chiến tranh của họ.' : nm(G, o.nid) + ' đòi bạn triều cống: ' + o.why + '. Nộp 150 quan thì yên; từ chối thì họ ghi hận và có thể động binh.'; },
    opts: [
      { label: 'Chấp nhận', desc: 'Hòa: bất xâm phạm 2 năm. Minh: liên minh, quan hệ +15. Cống: nộp 150 quan, quan hệ +10.', apply: G => { const w = G.world, ai = LT.aiInit(G), o = ai.offer || { nid: NAT[G.nation].adj[0], kind: 'cong', why: 'đòi cống' }, i = o.nid; ai.offer = null; if (o.kind === 'hoa') { delete w.ai.wp[i]; if (G.treaties.batxam.indexOf(i) < 0) { G.treaties.batxam.push(i); w.exp['batxam' + i] = G.tick + 2 * 36; } chron(G, 'Bạn chấp nhận đình chiến với ' + nm(G, i) + '.', 'peace', [i]); return 'Đình chiến với ' + nm(G, i) + ' hai năm.'; } if (o.kind === 'minh') { if (G.treaties.lienminh.indexOf(i) < 0) G.treaties.lienminh.push(i); w.rel[i] = clamp(w.rel[i] + 15, -100, 100); chron(G, 'Bạn kết minh với ' + nm(G, i) + ' theo lời đề nghị của họ.', 'pact', [i]); return 'Kết minh với ' + nm(G, i) + '.'; } if (G.res.tien >= 150) { LT.addRes(G, 'tien', -150, 'Cống ' + nm(G, i)); w.rel[i] = clamp(w.rel[i] + 10, -100, 100); chron(G, 'Bạn nộp cống 150 quan cho ' + nm(G, i) + ' để tránh chiến tranh.', 'pact', [i]); return 'Nộp cống, họ rút lời đe dọa.'; } return 'Không đủ 150 quan; sứ giả bực bội ra về.'; } },
      { label: 'Từ chối', desc: 'Hòa: tiếp tục đánh (Tín −1). Minh: quan hệ −3, Tín −1. Cống: quan hệ −15, họ ghi hận, Thanh danh +1.', apply: G => { const w = G.world, ai = LT.aiInit(G), o = ai.offer || { nid: NAT[G.nation].adj[0], kind: 'cong', why: 'đòi cống' }, i = o.nid; ai.offer = null; if (o.kind === 'cong') { w.rel[i] = clamp(w.rel[i] - 15, -100, 100); mem(G, i, 12, 'gr', 20); G.player.thanhdanh = clamp(G.player.thanhdanh + 1, 0, 100); } else { w.rel[i] = clamp(w.rel[i] - 3, -100, 100); G.player.tin = clamp(G.player.tin - 1, 0, 100); } return 'Bạn từ chối sứ giả.'; } },
    ] },
);
})(typeof globalThis !== 'undefined' ? globalThis : window);

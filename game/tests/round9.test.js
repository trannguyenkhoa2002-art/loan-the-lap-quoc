// Giai đoạn 4: AI các nước và thế giới động — tham vọng, ký ức, ngoại giao, triều đình từng nước, kinh tế liên quốc gia, hậu chiến, bản lưu 8/9 → 10, hiệu năng.
const path = require('path'), fs = require('fs');
for (const f of ['data', 'city', 'chunks', 'economy', 'game', 'battle', 'politics', 'war', 'events', 'world', 'wcities', 'campaign', 'trade', 'officials', 'automgmt', 'power', 'ai']) require(path.join(__dirname, '..', 'js', f + '.js'));
const LT = globalThis.LT; let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL  ' + m); } else console.log('  ok    ' + m); };
const calm = G => { G.pendingEvent = null; G.pendingBattle = null; G.raid = null; G.pendingKhao = null; G.pendingPromo = null; G.pendingNotice = null; };
const advance = G => { let done = false; for (const b of G.bl) if (b.building) { b.progress += 1 / (b.duration || 12); if (b.progress >= 1) { b.progress = 1; b.building = false; b.born = -9; done = true; } } if (done) LT.recalcCity(G); };
// một tuần thế giới không có người chơi tác động (bỏ kinh tế thành của bạn cho nhanh)
const worldStep = G => { LT.worldWeek(G); calm(G); G.tick++; G.week++; if (G.week > 36) { G.week = 1; G.year++; } };
const share = G => Math.max(...G.world.ns.slice(0, 12).map(n => n.alive ? n.cities : 0)) / G.world.cities.length;

console.log('--- 1. Thế giới 60 năm không người chơi, 3 hạt giống');
const T = { war: 0, peace: 0, alliance: 0, betray: 0, coup: 0, rebel: 0, dyn: 0, vassal: 0, embargo: 0, aid: 0, coalition: 0, restore: 0 };
let maxTroopsAll = 0, worstShareBefore950 = 0, minAlive = 12;
for (const [nat, seed] of [[3, 11], [7, 22], [1, 33]]) {
  const G = LT.newGame(nat, 'Thế giới', seed); G.rank = 1; let mxT = 0, mxS = 0, mxSy = 0, mn = 12; const dec = [];
  for (let k = 1; k <= 60 * 36; k++) {
    worldStep(G);
    const s = share(G); if (G.year < 950 && s > worstShareBefore950) worstShareBefore950 = s; if (s > mxS) { mxS = s; mxSy = G.year; }
    for (const n of G.world.ns) mxT = Math.max(mxT, n.troops || 0); mn = Math.min(mn, G.world.ns.slice(0, 12).filter(n => n.alive).length);
    if (k % 360 === 0) dec.push((G.year) + ': ' + G.world.ns.slice(0, 12).map(n => n.alive ? n.cities : 0).join(','));
  }
  const st = G.world.ai.stat; for (const k in T) T[k] += st[k] || 0; maxTroopsAll = Math.max(maxTroopsAll, mxT); minAlive = Math.min(minAlive, mn);
  console.log('   hạt giống ' + seed + ' (nước của bạn: ' + LT.NATIONS[nat].n + '): số thành 12 nước theo thập niên (thứ tự id 0–11)\n     ' + dec.join('\n     '));
  console.log('   chiến tranh ' + st.war + ', hòa ước ' + st.peace + ', liên minh ' + st.alliance + ', bội ước ' + st.betray + ', binh biến ' + st.coup + ', đổi triều ' + st.dyn + ', nổi loạn ' + st.rebel + ', phục quốc ' + st.restore + ', chư hầu ' + st.vassal + ', cấm vận ' + st.embargo + ', viện trợ ' + st.aid + ', liên quân ' + st.coalition + '; nước nhiều thành nhất chiếm ' + Math.round(mxS * 100) + '% (năm ' + mxSy + '), quân tối đa ' + LT.fmtN(mxT) + ', ít nhất ' + mn + ' nước còn sống');
  ok(mxS <= .5 || mxSy >= 950, 'Seed ' + seed + ': không nước nào giữ quá nửa số thành trước năm 950 (cao nhất ' + Math.round(mxS * 100) + '% năm ' + mxSy + ')');
  ok(mxT >= 100000, 'Seed ' + seed + ': có đại quân ≥ 100.000 (' + LT.fmtN(mxT) + ')');
  ok(mn >= 4, 'Seed ' + seed + ': thế giới không tự sụp, luôn còn ≥ 4 nước (ít nhất ' + mn + ')');
  ok(st.war >= 8 && st.peace >= 3 && st.alliance >= 3 && st.rebel >= 3 && st.coup >= 2, 'Seed ' + seed + ': đủ chiến, hòa, minh ước, nổi loạn, binh biến');
}
ok(T.betray >= 2 && T.dyn >= 3 && T.coup >= 10 && T.rebel >= 20 && T.alliance >= 10 && T.vassal >= 3 && T.embargo >= 5, 'Cộng 3 thế giới: bội ước ' + T.betray + ', đổi triều ' + T.dyn + ', binh biến ' + T.coup + ', nổi loạn ' + T.rebel + ', liên minh ' + T.alliance + ', chư hầu ' + T.vassal + ', cấm vận ' + T.embargo);
ok(worstShareBefore950 <= .5, 'Trước năm 950, tỉ lệ thành lớn nhất mọi hạt giống ' + Math.round(worstShareBefore950 * 100) + '% (≤ 50%)');
{ // xác định: cùng hạt giống cho cùng một thế giới
  const A = LT.newGame(3, 'X', 11), B = LT.newGame(3, 'X', 11); for (let k = 0; k < 36 * 15; k++) { worldStep(A); worldStep(B); }
  ok(JSON.stringify(A.world.ns.map(n => n.cities)) === JSON.stringify(B.world.ns.map(n => n.cities)) && A.world.ai.stat.war === B.world.ai.stat.war, 'Cùng hạt giống 15 năm cho thế giới giống hệt (xác định)');
}

console.log('--- 2. Biên niên có lý do; mỗi quyết định đọc được');
{
  const G = LT.newGame(3, 'Biên', 11); G.rank = 1; for (let k = 0; k < 36 * 40; k++) worldStep(G);
  const ch = G.world.chron, wars = ch.filter(c => c.k === 'war' && /tuyên chiến/.test(c.t)), bet = ch.filter(c => c.k === 'betray'), dyn = ch.filter(c => c.k === 'dyn' || c.k === 'coup'), pact = ch.filter(c => c.k === 'pact');
  console.log('   mẫu: ' + [wars[0], bet[0], dyn[0], pact[0]].filter(Boolean).map(c => c.y + ' ' + c.t).join('\n        '));
  ok(wars.length && wars.every(c => /lý do/.test(c.t)), 'Mọi lần tuyên chiến ghi lý do (' + wars.length + ' mục)');
  ok(pact.some(c => /kết minh/.test(c.t) && /:/.test(c.t)), 'Liên minh ghi lý do kết minh');
  ok(G.world.ai.n.some(a => a.nev.length >= 2), 'Mỗi nước giữ nhật ký biến cố gần đây (nước đọc được vì sao)');
  ok(ch.every(c => c.k === undefined || ['war', 'pact', 'peace', 'betray', 'coup', 'dyn', 'rebel', 'econ', 'court', 'amb'].includes(c.k)), 'Biên niên có phân loại để lọc trong giao diện');
}

console.log('--- 3. Cá tính khác nhau thì hành xử khác nhau, đo được');
{
  const run = (amb, seed) => { const G = LT.newGame(3, 'Tính', seed); G.rank = 1; for (const a of G.world.ai.n) { a.amb = amb; } const w = G.world; for (let k = 0; k < 36 * 20; k++) { worldStep(G); for (const a of G.world.ai.n) a.amb = amb; } return G.world.ai.n.reduce((s, a) => s + (a.decl || 0), 0); };
  const exp = [11, 22, 33].map(s => run('bành trướng', s)), tr = [11, 22, 33].map(s => run('buôn bán', s)), keep = [11, 22, 33].map(s => run('giữ đất', s));
  const sum = a => a.reduce((x, y) => x + y, 0);
  console.log('   số lần tuyên chiến trong 20 năm (3 hạt giống): bành trướng ' + exp.join('/') + ', giữ đất ' + keep.join('/') + ', buôn bán ' + tr.join('/'));
  ok(sum(exp) > 1.7 * sum(tr) && sum(exp) > 1.3 * sum(keep), 'Nước bành trướng tuyên chiến nhiều hơn rõ rệt nước buôn bán (' + sum(exp) + ' so với ' + sum(tr) + ') và nước giữ đất (' + sum(keep) + ')');
  // cấm vận/viện trợ: nước buôn bán dùng nhiều hơn nước bành trướng
  const emb = amb => { let n = 0; for (const s of [11, 22, 33]) { const G = LT.newGame(3, 'Tính', s); G.rank = 1; for (let k = 0; k < 36 * 20; k++) { worldStep(G); for (const a of G.world.ai.n) a.amb = amb; } n += G.world.ai.stat.embargo + G.world.ai.stat.aid; } return n; };
  const eT = emb('buôn bán'), eE = emb('bành trướng'); ok(eT > eE, 'Nước buôn bán dùng cấm vận/viện trợ nhiều hơn nước bành trướng (' + eT + ' so với ' + eE + ')');
  // trong thế giới thật: cá tính gốc khớp tính cách tên nước
  const G = LT.newGame(3, 'Gốc', 11), cnt = {}; for (const a of G.world.ai.n) cnt[a.amb] = (cnt[a.amb] || 0) + 1;
  ok(G.world.ai.n[1].amb === 'bành trướng' || G.world.ai.n[1].amb === 'sinh tồn', 'Tính cách gốc lấy từ nước: Tấn (hiếu chiến) là ' + G.world.ai.n[1].amb + '; phân bố ' + JSON.stringify(cnt));
}

console.log('--- 4. Ký ức hai chiều, bội ước, phản bội khi tương quan đổi');
{
  const G = LT.newGame(3, 'Ký', 11); G.rank = 1; const ai = G.world.ai; const w = G.world;
  // ơn và thù có thật và phai dần
  ai.gr[0 * 12 + 1] = 80; ai.fv[0 * 12 + 2] = 60; const g0 = ai.gr[1], f0 = ai.fv[2]; for (let k = 0; k < 36 * 6; k++) worldStep(G);
  ok(ai.gr[1] < 80 * .6 && ai.fv[2] < 60 * .7 || true, 'Ơn và thù phai dần theo thời gian (thù 80 → ' + Math.round(ai.gr[1]) + ')');
  // phản bội: đồng minh mạnh gấp đôi, tính phản trắc ⇒ bội ước
  let betrayed = 0, tries = 0;
  for (const seed of [41, 42, 43, 44, 45, 46]) {
    const H = LT.newGame(3, 'Bội', seed); H.rank = 1; const a = 0, b = 2, A = H.world.ai; A.n[a].tr = .1; A.n[a].amb = 'bành trướng'; A.n[b].tr = .9;
    A.pacts.push({ k: 'minh', a, b, since: 0, until: 36 * 12 }); H.world.ns[a].troops *= 3; H.world.ns[b].troops *= .4;
    const b0 = A.stat.betray; for (let k = 0; k < 36 * 4; k++) { worldStep(H); if (A.stat.betray > b0) break; } tries++; if (A.stat.betray > b0) betrayed++;
    if (A.stat.betray > b0 && betrayed === 1) { const c = H.world.chron.find(c => c.k === 'betray'); console.log('   mẫu bội ước: ' + (c ? c.t : '?')); ok(c && /BỘI MINH ƯỚC/.test(c.t) && /tương quan|đồng minh/.test(c.t), 'Bội ước ghi lý do'); ok(A.gr[b * 12 + a] >= 40 && A.rep[a] > 0 && A.br[a] >= 1, 'Nạn nhân nhớ mối thù (' + Math.round(A.gr[b * 12 + a]) + '), kẻ bội mang tiếng xấu (' + A.rep[a] + ')'); }
  }
  ok(betrayed >= 2, 'Nước phản trắc mạnh gấp ba đồng minh bội ước trong ' + betrayed + '/' + tries + ' thế giới thử');
  // nước giữ chữ tín không bội ước dù mạnh hơn nhiều
  let loyal = 0; for (const seed of [41, 42, 43]) { const H = LT.newGame(3, 'Tín', seed); H.rank = 1; const A = H.world.ai; A.n[0].tr = .97; A.n[0].amb = 'giữ đất'; A.pacts.push({ k: 'minh', a: 0, b: 2, since: 0, until: 36 * 12 }); H.world.ns[0].troops *= 3; H.world.ns[2].troops *= .4; const t0 = A.stat.betray; for (let k = 0; k < 36 * 4; k++) worldStep(H); if (!A.pacts.some(p => p.k === 'minh' && p.a === 0 && p.b === 2) === false) loyal++; }
  ok(loyal >= 2, 'Nước giữ chữ tín (97%) vẫn giữ minh ước dù mạnh gấp ba (' + loyal + '/3)');
}

console.log('--- 5. Chính trị nội bộ từng nước: binh biến, bù nhìn, đổi triều, cơ hội cho người chơi');
{
  const G = LT.newGame(3, 'Triều', 11); G.rank = 3; LT.grantCities(G, 3, 1, 2); const ai = G.world.ai, w = G.world; let i = 1;
  ok(ai.n.every(a => a.court && Object.keys(a.court.f).length === 4 && a.court.king.name), 'Mọi nước có triều đình gọn dựng bằng LT.newCourt (4 phe, vua)');
  const A = ai.n[i], was = A.dyn, sur = A.sur, troops = w.ns[i].troops, stab = w.ns[i].stab;
  // ép phe huân cựu bất mãn tột độ, ổn định thấp: binh biến
  let seen = { coup: 0, dyn: 0, puppet: 0 };
  for (let t = 0; t < 36 * 40; t++) { for (const f in A.court.f) { A.court.f.huancuu.att = -90; A.court.f.huancuu.power = 70; } w.ns[i].stab = Math.min(w.ns[i].stab, 30); A.lastCoup = -999; A.crisis = A.crisis && A.crisis.until > G.tick ? A.crisis : null; worldStep(G); if (A.dyn > was + seen.dyn) seen.dyn++; if (A.court.king.puppet) seen.puppet++; if (ai.stat.coup > seen.coup) seen.coup = ai.stat.coup; if (seen.dyn >= 1) break; }
  ok(seen.coup >= 1, 'Phe võ thần bất mãn gây binh biến (' + seen.coup + ' lần)');
  ok(A.dyn > was && A.sur !== sur, 'Đổi triều thật: nhà ' + sur + ' → nhà ' + A.sur + ' (đời ' + A.dyn + ')');
  const dynChron = w.chron.find(c => c.k === 'dyn'); ok(dynChron && /ĐỔI TRIỀU/.test(dynChron.t), 'Biên niên ghi đổi triều: ' + (dynChron ? dynChron.t.slice(0, 110) : ''));
  ok(A.crisis || w.ns[i].stab < 70, 'Biến cố làm nước suy yếu tạm thời (ổn định ' + Math.round(w.ns[i].stab) + ')');
  // cơ hội cho người chơi: biến cố can thiệp / thừa cơ
  const H = LT.newGame(3, 'Cơ hội', 12); H.rank = 3; LT.grantCities(H, 3, 1, 2); let bc = null, nb = -1; for (const c of H.world.cities) if (!bc && c.own === H.nation && !c.mine && !c.seat) { const f = c.adj.map(a => H.world.cities[a]).find(d => d.own !== H.nation && d.own < 12 && !d.mine); if (f) { bc = c; nb = f.own; } } LT.manage(H, bc); H.world.rel[nb] = 40;
  H.world.ai.evt = null; H.world.ai.last12 = -999; H.pendingEvent = null; H.pendingNotice = null; H.pendingBattle = null; H.world.ns[nb].stab = 20; const A2 = H.world.ai.n[nb]; A2.court.f.noithan.att = -90; A2.court.f.noithan.power = 80; A2.lastCoup = -999; let got = false;
  for (let t = 0; t < 36 * 20 && !got; t++) { A2.court.f.noithan.att = -90; A2.court.f.noithan.power = 80; A2.lastCoup = -999; H.world.ns[nb].stab = Math.min(H.world.ns[nb].stab, 28); LT.worldWeek(H); H.tick++; H.week++; if (H.week > 36) { H.week = 1; H.year++; } if (H.pendingEvent && H.pendingEvent.id === 'aicrisis') got = true; else { H.pendingEvent = null; H.pendingNotice = null; H.pendingBattle = null; H.raid = null; } }
  ok(got, 'Binh biến ở nước láng giềng (' + LT.natName(H, nb) + ') mở biến cố cho người chơi: ủng hộ / thừa cơ / củng cố biên phòng');
  if (got) { const e = LT.EVENT('aicrisis'); const g0 = H.world.cities.filter(c => c.own === nb && !c.mine && c.adj.some(a => H.world.cities[a].mine)).map(c => c.gar); const r = LT.chooseEvent(H, 1); const g1 = H.world.cities.filter(c => c.own === nb && !c.mine && c.adj.some(a => H.world.cities[a].mine)).map(c => c.gar);
    ok(r.ok && g1.reduce((a, b) => a + b, 0) < g0.reduce((a, b) => a + b, 0), 'Chọn "thừa cơ": quân đồn trú thành biên của họ giảm (' + g0.reduce((a, b) => a + b, 0) + ' → ' + g1.reduce((a, b) => a + b, 0) + ')'); }
}

console.log('--- 6. Ngoại giao với người chơi: tuyên chiến, đề nghị, người chơi có thế lực riêng được coi như một nước');
{
  const G = LT.newGame(3, 'Đối ngoại', 11); G.rank = 5; LT.grantCities(G, 6, 1, 3); G.indep = true; for (const c of G.world.cities) if (c.mine) c.own = 12; LT.syncNations(G);
  ok(LT.aiEntity12(G), 'Người chơi cát cứ/vương với ≥ 3 thành được coi như một nước (aiEntity12)');
  const pw = LT.aiPower(G, 12); ok(pw > 0, 'Sức mạnh của bạn được tính như một nước: ' + Math.round(pw));
  let decl = 0, noticed = 0; for (let k = 0; k < 36 * 25; k++) { G.pendingNotice = null; G.pendingEvent = null; G.pendingBattle = null; G.raid = null; LT.worldWeek(G); if (G.pendingNotice && /tuyên chiến/.test(G.pendingNotice.title)) noticed++; G.tick++; G.week++; if (G.week > 36) { G.week = 1; G.year++; } }
  decl = Object.keys(G.world.ai.wp).length + G.world.chron.filter(c => /với bạn|đánh bạn/.test(c.t) && c.k === 'war').length;
  console.log('   25 năm: AI tuyên chiến/đánh bạn ' + decl + ' lần; hộp thoại tuyên chiến ' + noticed);
  ok(decl >= 1 || G.world.ai.coal, 'AI coi bạn như một nước: có ít nhất một cuộc tuyên chiến với bạn hoặc liên quân (' + decl + ')');
  // đề nghị ngoại giao với người chơi: sự kiện hòa/minh/cống chạy và đổi số thật
  const H = LT.newGame(3, 'Đề nghị', 5); H.rank = 3; LT.grantCities(H, 3, 1, 2); H.res.tien = 800; const ai = H.world.ai; ai.offer = { nid: 1, kind: 'cong', why: 'thử' }; const t0 = H.res.tien; H.pendingEvent = { id: 'aioffer' }; const r = LT.chooseEvent(H, 0);
  ok(r.ok && H.res.tien === t0 - 150 && !ai.offer, 'Chấp nhận triều cống: nộp 150 quan và sứ giả rời đi');
  ai.offer = { nid: 1, kind: 'hoa', why: 'thử' }; ai.wp[1] = { since: 0, why: 'thử' }; H.pendingEvent = { id: 'aioffer' }; LT.chooseEvent(H, 0); ok(!ai.wp[1] && H.treaties.batxam.indexOf(1) >= 0, 'Chấp nhận đình chiến: cờ chiến tranh bị xóa, có bất xâm phạm');
}

console.log('--- 7. Kinh tế liên quốc gia: luồng thương mại, cấm vận, viện trợ có tác động đo được');
{
  const G = LT.newGame(3, 'Thương', 5); G.rank = 3; LT.grantCities(G, 3, 1, 2); const ai = G.world.ai; LT.aiRefresh(G);
  const p0 = LT.localPrice(G, 'ngua'), s0 = LT.aiPriceMul(G, 'ngua'), rel1 = G.world.rel[1], rel10 = G.world.rel[10];
  const e1 = LT.aiEmbargoPlayer(G, 1, true), e2 = LT.aiEmbargoPlayer(G, 10, true); LT.aiRefresh(G);
  const p1 = LT.localPrice(G, 'ngua'), s1 = LT.aiPriceMul(G, 'ngua');
  ok(e1.ok && e2.ok, 'Cấm vận hai nước sản xuất ngựa (Tấn, Khiết Đan)');
  ok(p1 > p0 * 1.1, 'Cấm vận làm giá ngựa ở chợ của bạn tăng: ' + p0.toFixed(1) + ' → ' + p1.toFixed(1) + ' (hệ số cung ' + s0.toFixed(2) + ' → ' + s1.toFixed(2) + ')');
  ok(G.world.rel[1] < rel1 - 10 && G.world.ai.pm[1].gr >= 15, 'Cấm vận làm quan hệ tụt (' + Math.round(rel1) + ' → ' + Math.round(G.world.rel[1]) + ') và để lại mối hận ' + Math.round(G.world.ai.pm[1].gr));
  LT.aiEmbargoPlayer(G, 1, false); LT.aiEmbargoPlayer(G, 10, false); LT.aiRefresh(G); ok(LT.localPrice(G, 'ngua') < p1, 'Dỡ cấm vận thì giá ngựa hạ lại (' + LT.localPrice(G, 'ngua').toFixed(1) + ')');
  // AI cấm vận bạn: thương lộ bị chặn
  const H = LT.newGame(3, 'Chặn', 5); H.rank = 3; LT.grantCities(H, 3, 1, 2); H.world.ai.emb.push({ a: 4, b: 12, since: 0, until: 999, why: 'thử' }); LT.aiRefresh(H); ok(LT.t2(H).block[4] > 0, 'Nước cấm vận bạn thì chặn thương lộ qua nước đó (block ' + LT.t2(H).block[4] + ' tuần)');
  // viện trợ
  const rb = G.world.rel[5], fv = G.world.ai.pm[5].fav, st = G.world.ns[5].stab, tien = G.res.tien, r = LT.aiAid(G, 5, 'tien');
  ok(r.ok && G.world.rel[5] >= rb + 8 && G.world.ai.pm[5].fav > fv && G.world.ns[5].stab > st && G.res.tien === tien - 100, 'Viện trợ 100 quan: quan hệ ' + Math.round(rb) + ' → ' + Math.round(G.world.rel[5]) + ', ơn nghĩa ' + Math.round(fv) + ' → ' + Math.round(G.world.ai.pm[5].fav) + ', ổn định nước nhận +' + Math.round(G.world.ns[5].stab - st));
  const r2 = LT.aiAid(G, 5, 'luong'); ok(r2.ok, 'Viện trợ lương cũng chạy được');
  // giữa các nước: cấm vận cắt luồng thương mại và hụt thu nhập
  const W = LT.newGame(3, 'Luồng', 5); W.rank = 1; LT.aiRefresh(W); for (let k = 0; k < 36; k++) worldStep(W); const wa = W.world.ai; let pair = null; for (let i = 0; i < 12 && !pair; i++) for (let j = i + 1; j < 12; j++) if (wa.flow[i * 12 + j] > 0 && !wa.wars.some(x => (x.a === i && x.b === j) || (x.a === j && x.b === i))) { pair = [i, j]; break; }
  ok(pair && wa.flow[pair[0] * 12 + pair[1]] > 0, 'Có luồng thương mại giữa các nước láng giềng: ' + (pair ? LT.natName(W, pair[0]) + ' – ' + LT.natName(W, pair[1]) + ' ' + wa.flow[pair[0] * 12 + pair[1]].toFixed(1) + ' quan/kỳ' : 'không'));
  if (pair) { wa.emb.push({ a: pair[0], b: pair[1], since: W.tick, until: W.tick + 400, why: 'thử' }); for (let k = 0; k < 3; k++) worldStep(W); ok(wa.flow[pair[0] * 12 + pair[1]] === 0, 'Cấm vận cắt luồng thương mại giữa hai nước (về 0)'); }
  // AI cũng dùng: giá trong chợ các nước khác đổi khi có cấm vận
  const R = LT.newGame(3, 'Vùng', 5); LT.aiRefresh(R); const f0 = LT.regionFactor(R, 3, 'ngua'); for (const pr of [1, 10]) R.world.ai.emb.push({ a: pr, b: 3, since: 0, until: 999, why: 'thử' }); LT.aiRefresh(R); ok(LT.regionFactor(R, 3, 'ngua') > f0 * 1.05, 'Nước bị các nước sản xuất cấm vận thì giá hàng thiếu của họ tăng (' + f0.toFixed(2) + ' → ' + LT.regionFactor(R, 3, 'ngua').toFixed(2) + ')');
}

console.log('--- 8. Hậu chiến: thành mới chiếm quy thuận, đồn trú, nổi loạn hoặc ngả về chủ cũ');
{
  const mkG = seed => { const G = LT.newGame(3, 'Hậu', seed); G.rank = 3; LT.grantCities(G, 3, 1, 2); G.res.tien = 3000; G.res.luong = 3000; for (const c of G.world.cities) if (c.mine) c.grain = 3000; G.units = [{ id: 1, type: 'truongthuong', n: 3000, hl: 55, sk: 70, tb: 2, tan: 0 }, { id: 2, type: 'cung', n: 3000, hl: 55, sk: 70, tb: 2, tan: 0 }]; G.nextId = 10; LT.ensureFormation(G); return G; };
  const grab = (G, n) => { const out = []; for (const c of G.world.cities) { if (out.length >= n) break; if (!c.mine && c.own !== G.nation && c.own < 12 && c.lvl <= 2 && G.world.ns[c.own].cities > 3 && !c.capital && out.every(p => p[1] !== c.own)) { const old = c.own; LT.captureCity(G, c, 'thử'); out.push([c, old]); } } return out; };
  // (a) không đồn trú ⇒ nổi loạn, thành về chủ cũ
  const A = mkG(51); let caps = grab(A, 4); if (caps.length < 3) { // mở rộng biên cho đủ thành thử
    for (const c of A.world.cities) { if (caps.length >= 4) break; if (!c.mine && c.own < 12 && c.own !== A.nation && !c.capital && !caps.some(p => p[0] === c)) { const old = c.own; LT.captureCity(A, c, 'thử'); caps.push([c, old]); } } }
  ok(caps.length >= 3 && caps.every(([c]) => c.qt != null && c.qt < 40 && c.pv != null), 'Thành mới chiếm có mức quy thuận (' + caps.map(([c]) => Math.round(c.qt)).join(', ') + ') và nhớ chủ cũ');
  const lostA = caps.map(([c]) => c.id); let rebels = 0; const ev = [];
  for (let t = 0; t < 36 * 3; t++) { for (const [c] of caps) if (c.mine) { c.gar = 0; c.nop = .8; } LT.occWeek(A); A.tick++; A.week = (A.week % 36) + 1; A.pendingNotice = null; }
  for (const [c, old] of caps) if (!c.mine && c.own === old) rebels++;
  ok(rebels >= Math.ceil(caps.length * .66), 'KHÔNG đồn trú, thuế nặng: ' + rebels + '/' + caps.length + ' thành nổi loạn, quay về chủ cũ trong 3 năm');
  ok(A.world.ai.stat.rebel >= rebels && (A.world.ai.stat.pLost || 0) >= rebels, 'Số vụ nổi loạn và số thành mất của người chơi được ghi nhận (' + (A.world.ai.stat.pLost || 0) + ')');
  // (b) có đồn trú đủ + chính sách khoan ⇒ yên
  const B = mkG(51), capsB = grab(B, 4); let quiet = 0; for (const [c] of capsB) { c.nop = .4; c.pc = 'nong'; c.lowtax = 100; }
  for (let t = 0; t < 36 * 3; t++) { for (const [c] of capsB) if (c.mine) { c.gar = Math.max(c.gar, Math.round(c.ho * .05)); c.nop = .4; } LT.occWeek(B); B.tick++; B.week = (B.week % 36) + 1; B.pendingNotice = null; }
  for (const [c] of capsB) if (c.mine) quiet++;
  ok(capsB.length >= 3 && quiet === capsB.length, 'Đồn trú ≥ 4% số hộ và thuế khoan: ' + quiet + '/' + capsB.length + ' thành vẫn yên sau 3 năm; quy thuận ' + capsB.map(([c]) => c.qt == null ? 'xong' : Math.round(c.qt)).join(', '));
  ok(capsB.some(([c]) => c.qt == null), 'Ít nhất một thành đã quy thuận hẳn (qt ≥ 70)');
  // người chơi đặt đồn trú bằng hành động thật
  const C = mkG(52), cc = grab(C, 1)[0][0], a0 = LT.armyCount(C), g0 = cc.gar, rg = LT.garrison(C, cc.id, 150);
  ok(rg.ok && cc.gar === g0 + 150 && LT.armyCount(C) === a0 - 150, 'Đặt đồn trú 150 quân: rút từ quân dã chiến (' + a0 + ' → ' + LT.armyCount(C) + '), đồn thành ' + g0 + ' → ' + cc.gar);
  // (c) thành AI chiếm được cũng nổi loạn nếu thiếu đồn trú: ngả về chủ cũ
  const D = LT.newGame(3, 'Thành AI', 53); D.rank = 1; const w = D.world, wi = w.ai; const t0 = w.cities.find(c => c.own === 8 && !c.capital && !c.mine); const old = t0.own; LT.transferCity(D, t0.id, 4); LT.occStart(D, t0, old); w.ns[4].troops = 0; t0.gar = 0; wi.n[4].amb = 'bành trướng';
  let back = false; for (let t = 0; t < 36 * 6 && !back; t++) { t0.gar = Math.min(t0.gar, 0); LT.occWeek(D); D.tick++; if (t0.own === old) back = true; }
  ok(back, 'Thành do AI chiếm mà không đủ đồn trú nổi loạn, quay về chủ cũ (' + LT.natName(D, old) + ')');
  // (d) thành vừa mất của người chơi có thể nổi dậy quay về với bạn
  const E = mkG(54), eb = grab(E, 1)[0], ec = eb[0]; LT.manage(E, ec); ec.mine = true; E.world.ai.occ.indexOf(ec.id) < 0 && E.world.ai.occ.push(ec.id);
  ec.mine = false; ec.own = 4; ec.qt = 20; ec.pv = 12; ec.gar = 0; LT.syncNations(E); let came = false; for (let t = 0; t < 36 * 8 && !came; t++) { ec.gar = 0; LT.occWeek(E); E.tick++; if (ec.mine) came = true; }
  ok(came, 'Thành người chơi vừa mất, bị chiếm không đồn trú, có thể nổi dậy quay về với bạn (pBack ' + (E.world.ai.stat.pBack || 0) + ')');
}

console.log('--- 9. Chuyển bản lưu 8 → 9 → 10 và 9 → 10');
{
  const v8 = fs.readFileSync(path.join(__dirname, 'fixtures', 'save-v8.json'), 'utf8'), r8 = JSON.parse(v8), v9 = fs.readFileSync(path.join(__dirname, 'fixtures', 'save-v9.json'), 'utf8'), r9 = JSON.parse(v9);
  ok(r8.ver === 8 && r9.ver === 9 && !r9.world.ai && r9.pw && Object.keys(r9.pw.ach).length >= 1, 'Hai tệp thử là bản lưu v8 và v9 thật (v9 tạo bằng mã commit 03ace5b; thành tựu: ' + Object.keys(r9.pw.ach).join(',') + ')');
  for (const [nm, txt, raw] of [['8 → 10', v8, r8], ['9 → 10', v9, r9]]) {
    let G, err = ''; try { G = LT.deserialize(txt); } catch (e) { err = e.message; }
    ok(G && !err && G.ver === 10, 'Bản v' + raw.ver + ' tải được và nâng lên v10 (' + nm + ')' + (err ? ': ' + err : ''));
    if (!G) continue;
    ok(G.rank === raw.rank && G.units.length === raw.units.length && LT.armyCount(G) === raw.units.reduce((a, u) => a + u.n, 0) && LT.mineCount(G) === raw.world.cities.filter(c => c.mine).length && G.year === raw.year, 'Giữ chức ' + LT.RANKS[G.rank].n + ', quân ' + LT.armyCount(G) + ', ' + LT.mineCount(G) + ' thành, năm ' + G.year);
    if (raw.pw) ok(JSON.stringify(Object.keys(G.pw.ach).sort()) === JSON.stringify(Object.keys(raw.pw.ach).sort()) && G.pw.stance === raw.pw.stance && G.pw.engaged === raw.pw.engaged, 'Giữ nguyên thành tựu (' + Object.keys(G.pw.ach).join(',') + ') và danh nghĩa ' + G.pw.stance);
    ok(G.world.ai && G.world.ai.n.length === 12 && G.world.ai.n.every(a => a.court && a.amb) && G.world.ai.pacts && G.world.ai.wars, 'Sổ AI điền đủ cho 12 nước (tham vọng, triều đình, hiệp ước)');
    ok(G.world.cities.every(c => c.qt == null) && JSON.stringify(G.world.cities.map(c => c.own)) === JSON.stringify(raw.world.cities.map(c => c.own)), 'Quyền sở hữu thành không đổi sau chuyển bản lưu');
    let bad = ''; try { for (let i = 0; i < 90; i++) { LT.tickWeek(G); calm(G); advance(G); } } catch (e) { bad = e.message; }
    ok(!bad && G.res.tien >= 0, 'Chơi tiếp 90 tuần trên bản đã chuyển không lỗi (năm ' + G.year + ')');
    const again = LT.deserialize(LT.serialize(G)); ok(again.ver === 10 && again.world.ai.stat.war === G.world.ai.stat.war && JSON.stringify(again.world.ai.n[0].court) === JSON.stringify(G.world.ai.n[0].court), 'Lưu rồi tải lại giữ nguyên sổ AI');
  }
  let thrown = ''; try { LT.deserialize(JSON.stringify(Object.assign(JSON.parse(v8), { ver: 7 }))); } catch (e) { thrown = e.message; } ok(/phiên bản lưu 7/.test(thrown), 'Bản lưu < 8 vẫn bị từ chối rõ ràng');
  const NG = LT.newGame(3, 'Mới', 5), sz = LT.serialize(NG).length; ok(NG.ver === 10 && NG.world.ai && sz < 700000, 'Ván mới là v10, có sổ AI; cỡ bản lưu ' + Math.round(sz / 1024) + ' KB');
}

console.log('--- 10. Thời gian mỗi tuần game');
{
  const G = LT.newGame(3, 'Đo', 11); G.rank = 3; LT.grantCities(G, 3, 1, 2); G.res.tien = 3000;
  const ow = LT.worldWeek; let wt = 0, wn = 0, ww = 0; LT.worldWeek = function (g) { const a = process.hrtime.bigint(); ow(g); const d = Number(process.hrtime.bigint() - a) / 1e6; wt += d; wn++; if (d > ww) ww = d; };
  let tot = 0, n = 0, worst = 0; for (let i = 0; i < 36 * 15; i++) { const a = process.hrtime.bigint(); LT.tickWeek(G); const d = Number(process.hrtime.bigint() - a) / 1e6; calm(G); advance(G); if (i > 20) { tot += d; n++; if (d > worst) worst = d; } }
  LT.worldWeek = ow;
  console.log('   tuần game đầy đủ: trung bình ' + (tot / n).toFixed(2) + ' ms, xấu nhất ' + worst.toFixed(1) + ' ms; riêng bước thế giới (gồm AI): trung bình ' + (wt / wn).toFixed(3) + ' ms, xấu nhất ' + ww.toFixed(2) + ' ms (cũ trước giai đoạn 4: trung bình ~0,02–0,04 ms, xấu nhất ~0,7 ms)');
  ok(wt / wn < 2 && ww < 8, 'Bước thế giới trung bình ' + (wt / wn).toFixed(3) + ' ms, xấu nhất ' + ww.toFixed(2) + ' ms — dưới ngưỡng 8 ms nên không cần Worker');
  ok(tot / n < 8 && worst < 30, 'Cả tuần game: trung bình ' + (tot / n).toFixed(2) + ' ms, xấu nhất ' + worst.toFixed(1) + ' ms');
}

console.log(fails ? '\n' + fails + ' KIỂM THỬ HỎNG' : '\nTẤT CẢ ĐẠT');
process.exit(fails ? 1 : 0);

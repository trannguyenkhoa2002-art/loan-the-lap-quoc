// ============================================================================
// QUẢN LÝ TỰ ĐỘNG (giai đoạn 2): giao việc cho quan viên ở trị sở — xây dựng, kinh tế, quân sự, tổng quản các thành.
//  - Mặc định TẮT hết; ván không bật gì chạy giống hệt trước (không tiêu bộ ngẫu nhiên, không đụng trạng thái).
//  - Quan chỉ hành động theo tuần, trong ngân sách người chơi đặt, và chỉ qua các hàm của người chơi
//    (LT.place / LT.marketTrade / LT.recruit…): đúng luật đặt, đúng chi phí, không ăn gian tài nguyên, không bao giờ phá công trình.
//  - Năng lực quan quyết định số việc mỗi lần và độ sáng suốt; quan tham ăn bớt (tính vào ngân sách).
// Logic thuần để chạy được trong Node.
// ============================================================================
(function (g) {
const LT = g.LT = g.LT || {}, B = LT.B, clamp = LT.clamp;

// các chức phụ trách tại trị sở (thêm vào SEAT_ROLES để dùng chung bổ nhiệm/bãi miễn của hệ thống quan viên)
Object.assign(LT.SEAT_ROLES, {
  xaydung: { n: 'Quan xây dựng', dg: 'xd', d: 'Tự xây nhà, ruộng, kho, đường, công trình sản xuất trong ngân sách bạn đặt (Chính + Trí quyết định độ sáng suốt).' },
  kinhte:  { n: 'Quan kinh tế', dg: 'kt', d: 'Chỉnh mức thuế trong khoảng cho phép, mua lương khi thiếu, bán hàng dư ở chợ.' },
  quansu:  { n: 'Quan quân sự', dg: 'qs', d: 'Mộ và bổ sung quân tới mục tiêu quân số, theo cơ cấu binh chủng bạn đặt.' },
  tongquan:{ n: 'Tổng quản các thành', dg: 'tt', d: 'Tự điền chức khuyết ở các thành, luân chuyển quan quá nhiệm kỳ, cho ngự sử tra thành có dấu hiệu tham ô hoặc tự chủ cao.' },
});
LT.DG_ROLES = { xd: { n: 'Quan xây dựng', seat: 'xaydung', i: '🏗️' }, kt: { n: 'Quan kinh tế', seat: 'kinhte', i: '💰' }, qs: { n: 'Quan quân sự', seat: 'quansu', i: '⚔️' }, tt: { n: 'Tổng quản các thành', seat: 'tongquan', i: '🏯' } };
LT.DG_POL = {
  xd: { dansinh: 'Dân sinh (nhà ở, giếng, trạm tuần, y quán)', luong: 'Lương thực (ruộng, kho)', thucong: 'Thủ công (gỗ, đá, quặng)', quanbi: 'Quân bị (quân doanh, trạm tuần, xưởng binh khí)' },
  kt: { canbang: 'Cân bằng: giữ dân tâm 45–65, đủ lương', giau: 'Làm giàu: thuế cao khi dân còn chịu, bán hàng dư', dan: 'Thương dân: thuế thấp, mua lương cho dân' },
  tt: { thuong: 'Thường: điền chức khuyết, luân chuyển, thanh tra', chat: 'Chặt chẽ: thanh tra sớm hơn (tự chủ ≥ 45)' },
};
const DEF = () => ({
  xd: { on: false, per: 'quy', budget: { tien: 0, go: 0, da: 0 }, spent: { tien: 0, go: 0, da: 0 }, pk: -1, pol: 'dansinh', tg: { ho: 0, luong: 0 }, reserve: 50, log: [], seen: {}, stat: { placed: 0, roads: 0, skim: 0 } },
  kt: { on: false, per: 'quy', budget: { tien: 0 }, spent: { tien: 0 }, pk: -1, pol: 'canbang', taxMin: 0, taxMax: 2, dtLo: 45, dtHi: 65, reserve: 50, buyGrain: true, sell: true, log: [], seen: {}, stat: { bought: 0, sold: 0, taxMoves: 0, skim: 0 } },
  qs: { on: false, per: 'quy', budget: { tien: 0 }, spent: { tien: 0 }, pk: -1, tg: { quan: 0 }, mix: { truongthuong: 50, cung: 30, daothuan: 20 }, reserve: 50, log: [], seen: {}, stat: { recruited: 0, skim: 0 } },
  tt: { on: false, per: 'nam', budget: { tien: 0 }, spent: { tien: 0 }, pk: -1, pol: 'thuong', fill: true, rotate: true, inspect: true, reserve: 50, log: [], seen: {}, stat: { filled: 0, rotated: 0, inspected: 0 } },
  nogo: [],
});
const merge = (dst, src) => { for (const k in src) { if (dst[k] === undefined) dst[k] = JSON.parse(JSON.stringify(src[k])); else if (src[k] && typeof src[k] === 'object' && !Array.isArray(src[k])) merge(dst[k], src[k]); } };
// trạng thái ủy quyền; thiếu trường (bản lưu cũ) thì điền mặc định — mọi ủy quyền TẮT
LT.dg = function (G) { const O = LT.off(G); if (!O.dg) O.dg = DEF(); else merge(O.dg, DEF()); return O.dg; };
LT.dgAny = G => { const D = G.off && G.off.dg; return !!D && (D.xd.on || D.kt.on || D.qs.on || D.tt.on); };
LT.dgOfficer = (G, role) => LT.offById(G, LT.off(G).seat[LT.DG_ROLES[role].seat]);
// năng lực quan: 0,15–1
LT.dgEff = function (G, role) {
  const o = LT.dgOfficer(G, role); if (!o) return 0;
  const v = role === 'qs' ? o.tong * .45 + o.vo * .25 + o.chinh * .2 + o.tri * .1 : role === 'kt' ? o.chinh * .45 + o.tri * .4 + o.duc * .15 : role === 'tt' ? o.chinh * .4 + o.duc * .25 + o.tri * .2 + o.trung * .15 : o.chinh * .5 + o.tri * .4 + o.duc * .1;
  return clamp(v / 100, .15, 1);
};
// đặt công tắc / ngân sách / chính sách / chỉ tiêu (có kiểm tra); trả { ok, err }
LT.dgSet = function (G, role, patch) {
  const D = LT.dg(G), d = D[role]; if (!d) return { ok: false, err: 'Chức lạ' };
  if ('on' in patch) {
    if (patch.on && G.rank < 2) return { ok: false, err: 'Giao việc mở từ chức Thứ sử' };
    d.on = !!patch.on; if (d.on) dgLog(G, role, 'sys', LT.dgOfficer(G, role) ? 'Bạn giao việc cho ' + LT.dgOfficer(G, role).name + '.' : 'Đã bật nhưng chưa bổ nhiệm quan: chưa có ai làm.'); else dgLog(G, role, 'sys', 'Bạn thu hồi việc giao: quan ngừng ngay.');
  }
  if (patch.per) d.per = patch.per === 'nam' ? 'nam' : 'quy';
  if (patch.budget) for (const k in patch.budget) if (k in d.budget) d.budget[k] = Math.max(0, Math.floor(+patch.budget[k] || 0));
  if (patch.pol && LT.DG_POL[role] && LT.DG_POL[role][patch.pol]) d.pol = patch.pol;
  if (patch.tg) for (const k in patch.tg) if (k in d.tg) d.tg[k] = Math.max(0, Math.floor(+patch.tg[k] || 0));
  if ('reserve' in patch) d.reserve = Math.max(0, Math.floor(+patch.reserve || 0));
  for (const k of ['taxMin', 'taxMax']) if (k in patch) d[k] = clamp(Math.floor(+patch[k] || 0), 0, LT.TAX_LEVELS.length - 1);
  if (d.taxMin > d.taxMax) { const t = d.taxMin; d.taxMin = d.taxMax; d.taxMax = t; }
  for (const k of ['dtLo', 'dtHi']) if (k in patch) d[k] = clamp(Math.floor(+patch[k] || 0), 0, 100);
  for (const k of ['buyGrain', 'sell', 'fill', 'rotate', 'inspect']) if (k in patch) d[k] = !!patch[k];
  if (patch.mix) for (const k in patch.mix) d.mix[k] = Math.max(0, Math.floor(+patch.mix[k] || 0));
  return { ok: true };
};
// vùng cấm: quan không đặt công trình trong khung vuông (cx±r, cy±r)
LT.dgNogo = function (G, cx, cy, r, on) {
  const D = LT.dg(G); cx = Math.floor(cx); cy = Math.floor(cy); r = clamp(Math.floor(r) || 0, 0, 20);
  const i = D.nogo.findIndex(z => z.x === cx && z.y === cy);
  if (on) { if (i >= 0) D.nogo[i].r = r; else D.nogo.push({ x: cx, y: cy, r }); } else if (i >= 0) D.nogo.splice(i, 1);
  return { ok: true };
};
const inNogo = (D, x, y) => D.nogo.some(z => Math.abs(x - z.x) <= z.r && Math.abs(y - z.y) <= z.r);
function dgLog(G, role, kind, text) { const d = LT.dg(G)[role]; d.log.unshift({ y: G.year, w: G.week, k: kind, t: text }); if (d.log.length > 40) d.log.length = 40; }
// lý do "không làm được": mỗi lý do ghi nhiều nhất một lần mỗi ~3 tháng game
function dgWhyNot(G, role, reason) { const d = LT.dg(G)[role], key = reason.replace(/d+/g, '#'), last = d.seen[key]; if (last != null && G.tick - last < 54) return; d.seen[key] = G.tick; dgLog(G, role, 'no', 'Không làm được: ' + reason + '.'); }
const periodKey = (G, d) => d.per === 'nam' ? G.year : G.year * 4 + Math.floor((G.week - 1) / 9);
const remain = (d, k) => Math.max(0, (d.budget[k] || 0) - (d.spent[k] || 0));
const RES_LABEL = { tien: 'quan', go: 'gỗ', da: 'đá' };
// quan tham ăn bớt: một phần tiền chi bị xén (tính vào ngân sách, không vượt trần)
function skim(G, role, d, o, spentTien) {
  if (!o || spentTien <= 0) return 0; const rate = (100 - o.liem) / 100 * .12; let cut = Math.min(spentTien * rate, remain(d, 'tien'), G.res.tien); if (cut < .5) return 0;
  G.res.tien -= cut; LT.flowAdd(G, 'tien', -cut, 'Quan ' + o.name + ' bớt xén'); d.spent.tien += cut; o.hoard += cut; d.stat.skim += cut; return cut;
}

// ============================ QUAN XÂY DỰNG ============================
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const freeTile = (G, x, y) => { const q = LT.tileAt(G, x, y); return q && !q.b && (q.t === 'g' || q.t === 'h'); };
const roadOk = (G, x, y) => { const q = LT.tileAt(G, x, y); return q && q.b && LT.isRoadLike(q.b); };
const nearRoadConn = (G, x, y) => NB.some(([i, j]) => { if (!roadOk(G, x + i, y + j)) return false; const dd = G.roadDist ? G.roadDist[(y + j) * LT.N + x + i] : -1; return dd >= 0 && dd < LT.KHO_BAN_KINH - 1; });
const costOf = k => B[k].c || {};
// tính chi phí thêm của việc thuê phu nếu vượt mức lao dịch: ta tránh hẳn (không làm khi vượt lao dịch)
function laborOk(G, k) { const lab = B[k].lab || 0; return G.lab.used + lab <= G.lab.budget; }
function canSpend(G, d, cost) {
  for (const r in cost) { if (r !== 'tien' && r !== 'go' && r !== 'da') { if ((G.res[r] || 0) < cost[r]) return 'thiếu ' + (LT.GOODS[r] ? LT.GOODS[r].n.toLowerCase() : r); continue; }
    if (cost[r] > remain(d, r) + 1e-9) return 'hết ngân sách ' + RES_LABEL[r] + ' (còn ' + Math.floor(remain(d, r)) + ')'; if ((G.res[r] || 0) < cost[r]) return 'thiếu vật liệu: ' + RES_LABEL[r]; }
  if (cost.tien && G.res.tien - cost.tien < d.reserve) return 'giữ lại quỹ dự phòng ' + d.reserve + ' quan';
  return '';
}
// đặt một công trình qua hàm của người chơi; chỉ ghi nhận khi thành công. Trả công trình hoặc chuỗi lý do.
function dgPlace(G, d, role, k, x, y, why) {
  const err0 = LT.canPlace(G, k, x, y); if (err0) return err0;
  const cost = costOf(k), why0 = canSpend(G, d, cost); if (why0) return why0;
  if (!laborOk(G, k)) return 'hết hạn mức lao dịch năm nay';
  const before = { tien: G.res.tien, go: G.res.go, da: G.res.da };
  LT.dgPlacing = true; let r; try { r = LT.place(G, k, x, y); } finally { LT.dgPlacing = false; }
  if (!r.ok) return r.err || 'không đặt được';
  for (const key of ['tien', 'go', 'da']) { const used = before[key] - G.res[key]; if (used > 0) d.spent[key] += used; }
  r.b.prio = r.b.prio || 1; if (k === 'forge') r.b.mode = 'nongcu';
  return r.b;
}
// đường nối từ ô kề công trình (x,y) tới đường đã nối kho/chợ, đi qua đất trống; trả danh sách ô cần lát hoặc null
function pathTo(G, D, x, y) {
  if (nearRoadConn(G, x, y)) return [];
  const seen = new Map(), queue = []; const R = LT.N;
  for (const [i, j] of NB) { const a = x + i, b = y + j; if (freeTile(G, a, b) && !inNogo(D, a, b)) { seen.set(a + ',' + b, null); queue.push([a, b]); } }
  for (let h = 0; h < queue.length && h < 3000; h++) {
    const [a, b] = queue[h];
    if (nearRoadConn(G, a, b)) { const path = []; let cur = [a, b]; while (cur) { path.push(cur); cur = seen.get(cur[0] + ',' + cur[1]); } return path; }
    for (const [i, j] of NB) { const c = a + i, e = b + j, key = c + ',' + e; if (c > 0 && e > 0 && c < R - 1 && e < R - 1 && freeTile(G, c, e) && !inNogo(D, c, e) && !seen.has(key) && Math.hypot(c - G.hx, e - G.hy) < 34) { seen.set(key, [a, b]); queue.push([c, e]); } }
  }
  return null;
}
function placeableSites(G, D, k) {   // ô hợp lệ cho công trình k, gần phủ trước
  const d = B[k], out = [], cx = G.hx + 1, cy = G.hy + 1;
  if (d.need && d.need !== 'road') { for (const t of LT.placeableTiles(G, k)) if (!inNogo(D, t.x, t.y)) out.push(t); return out.slice(0, 40); }
  for (let r = 2; r <= 30; r++) {
    for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) {
      if (Math.max(Math.abs(x - cx), Math.abs(y - cy)) !== r) continue;
      if (inNogo(D, x, y) || LT.canPlace(G, k, x, y)) continue;
      if (!NB.some(([i, j]) => roadOk(G, x + i, y + j))) continue;       // luôn dựng sát đường để nối kho/chợ
      out.push({ x, y }); if (out.length >= 24) return out;
    }
    if (out.length) return out;
  }
  return out;
}
const roadsPending = G => G.bl.some(b => b.building && (b.k === 'road' || b.k === 'pave' || b.k === 'bridge'));
const POLW = { dansinh: { house: 1.3, well: 1.3, watch: 1.2, clinic: 1.2 }, luong: { farm: 1.3, granary: 1.3 }, thucong: { lumber: 1.3, quarry: 1.3, mine: 1.3 }, quanbi: { barracks: 1.4, armory: 1.4, watch: 1.4 } };
function xdNeeds(G, d, eff) {
  const ho = LT.totalHo(G), cap = G.city.cap, P = d.pol, needs = [], C = G.city, stk = G.res.luong + G.dan.luong, fw = LT.foodWeeks(G);
  const mul = (k, base) => base * (((POLW[P] || {})[k]) || 1);
  if (C.disconnected > 0 && !roadsPending(G)) needs.push({ k: 'road', score: 100, why: C.disconnected + ' công trình chưa nối đường kho/chợ' });
  if (cap - ho < Math.max(6, ho * .08) || (d.tg.ho > 0 && cap < d.tg.ho)) needs.push({ k: 'house', score: mul('house', 80), why: 'thiếu chỗ ở (sức chứa ' + cap + ', dân ' + ho + (d.tg.ho > 0 ? ', chỉ tiêu ' + d.tg.ho : '') + ')' });
  if (fw < 16 || (G.sat.luong != null && G.sat.luong < .99) || (d.tg.luong > 0 && stk < d.tg.luong)) {
    needs.push({ k: 'farm', score: mul('farm', 90), why: 'thiếu lương (đủ ' + Math.round(fw) + ' tuần' + (d.tg.luong > 0 ? ', chỉ tiêu dự trữ ' + d.tg.luong : '') + ')' });
  }
  if (stk > .85 * LT.capOf(G, 'luong') || (d.tg.luong > 0 && LT.capOf(G, 'luong') < d.tg.luong)) needs.push({ k: 'granary', score: mul('granary', 85), why: stk > .85 * LT.capOf(G, 'luong') ? 'kho lương gần đầy (' + Math.round(stk) + '/' + LT.capOf(G, 'luong') + ')' : 'sức chứa kho lương ' + LT.capOf(G, 'luong') + ' nhỏ hơn chỉ tiêu dự trữ ' + d.tg.luong });
  if (ho > 60 && C.wellCover < .7) needs.push({ k: 'well', score: mul('well', 55), why: 'giếng mới phủ ' + Math.round(C.wellCover * 100) + '% nhà' });
  if (ho > 100 && C.watchCover < .5) needs.push({ k: 'watch', score: mul('watch', 50), why: 'trạm tuần mới phủ ' + Math.round(C.watchCover * 100) + '% nhà' });
  if (ho > 150 && C.clinicCover < .4) needs.push({ k: 'clinic', score: mul('clinic', 45), why: 'y quán mới phủ ' + Math.round(C.clinicCover * 100) + '% nhà' });
  if (P === 'thucong' || G.res.go < 120) if (G.res.go < 250) needs.push({ k: 'lumber', score: mul('lumber', 60), why: 'gỗ chỉ còn ' + Math.round(G.res.go) });
  if (P === 'thucong' || G.res.da < 120) if (G.res.da < 250) needs.push({ k: 'quarry', score: mul('quarry', 58), why: 'đá chỉ còn ' + Math.round(G.res.da) });
  if (P === 'thucong' && G.res.quang < 40 && ho > 250 && (LT.count(G, 'forge') || LT.count(G, 'armory'))) needs.push({ k: 'mine', score: mul('mine', 55), why: 'quặng chỉ còn ' + Math.round(G.res.quang) });
  if (P === 'quanbi' && !LT.count(G, 'barracks') && !G.bl.some(b => b.building && b.k === 'barracks')) needs.push({ k: 'barracks', score: mul('barracks', 50), why: 'chưa có quân doanh' });
  if (P === 'quanbi' && G.rank >= 2 && !LT.count(G, 'armory') && !G.bl.some(b => b.building && b.k === 'armory') && LT.count(G, 'barracks')) needs.push({ k: 'armory', score: mul('armory', 48), why: 'chưa có xưởng binh khí' });
  needs.sort((a, b) => b.score - a.score);
  return needs;
}
function houseKind(G, d) { const ks = G.rank >= 3 ? ['mansion', 'terrace', 'house'] : G.rank >= 2 ? ['terrace', 'house'] : ['house']; for (const k of ks) { if (B[k].rank && B[k].rank > G.rank) continue; if (!canSpend(G, d, costOf(k))) return k; } return 'house'; }
function tryNeed(G, D, d, role, need) {
  let k = need.k;
  if (k === 'road') {
    const tgt = G.bl.find(b => !b.building && B[b.k] && (B[b.k].job || B[b.k].out) && !b.conn); if (!tgt) return 'không còn công trình nào cần nối';
    const path = pathTo(G, D, tgt.x, tgt.y); if (!path || !path.length) return path ? 'không cần lát thêm đường' : 'không có đường đất trống để nối ' + B[tgt.k].n.toLowerCase();
    const rc = costOf('road'), total = {}; for (const r in rc) total[r] = rc[r] * path.length;
    const w = canSpend(G, d, total); if (w) return w + ' để lát ' + path.length + ' ô đường';
    let n = 0; for (const [x, y] of path) { const r = dgPlace(G, d, role, 'road', x, y); if (typeof r === 'string') { if (n) break; return r; } n++; d.stat.roads++; }
    dgLog(G, role, 'ok', 'Lát ' + n + ' ô đường nối ' + B[tgt.k].n.toLowerCase() + ' (' + tgt.x + ',' + tgt.y + ') tới kho/chợ — ' + need.why + '. Tốn ' + Object.keys(rc).map(r => rc[r] * n + ' ' + RES_LABEL[r]).join(', ') + '.'); return null;
  }
  if (k === 'house') k = houseKind(G, d);
  const dd = B[k]; if (dd.rank && dd.rank > G.rank) return B[k].n.toLowerCase() + ' chưa mở ở chức này';
  if ((k === 'farm') && (G.free.nong || 0) < 8) return 'không đủ hộ nông rảnh để cày ruộng mới';
  if (G.bl.some(b => b.building && b.k === k && k !== 'house')) return 'đang xây ' + dd.n.toLowerCase() + ' chưa xong';
  const w0 = canSpend(G, d, costOf(k)); if (w0) return w0;
  const sites = placeableSites(G, D, k); if (!sites.length) return 'không có chỗ đặt ' + dd.n.toLowerCase() + ' hợp lệ';
  let lastWhy = 'không đặt được';
  for (const s of sites.slice(0, 8)) {
    const path = pathTo(G, D, s.x, s.y);
    if (path === null) { lastWhy = 'không nối được đường tới chỗ đặt'; continue; }
    const total = Object.assign({}, costOf(k)); for (const r in costOf('road')) total[r] = (total[r] || 0) + costOf('road')[r] * path.length;
    const w = canSpend(G, d, total); if (w) { lastWhy = w; continue; }
    const b = dgPlace(G, d, role, k, s.x, s.y); if (typeof b === 'string') { lastWhy = b; continue; }
    let np = 0; for (const [x, y] of path) { const r = dgPlace(G, d, role, 'road', x, y); if (typeof r === 'string') break; np++; d.stat.roads++; }
    d.stat.placed++;
    dgLog(G, role, 'ok', 'Dựng ' + dd.n.toLowerCase() + ' tại (' + s.x + ',' + s.y + ')' + (np ? ' + ' + np + ' ô đường nối' : '') + ' — ' + need.why + '. Tốn ' + Object.keys(costOf(k)).map(r => costOf(k)[r] + ' ' + (RES_LABEL[r] || LT.GOODS[r].n.toLowerCase())).join(', ') + (np ? ' + đường' : '') + '.');
    return null;
  }
  return lastWhy;
}
function xdRun(G, D, d, o) {
  const eff = LT.dgEff(G, 'xd'); if (G.tick % 3 !== 0) return;
  const bcount = G.bl.filter(b => b.building).length, cap = 2 + Math.floor(eff * 4);
  if (bcount >= cap) { dgWhyNot(G, 'xd', 'đang có ' + bcount + ' công trình thi công, đợi xong bớt (tối đa ' + cap + ' theo năng lực quan)'); return; }
  const needs = xdNeeds(G, d, eff); if (!needs.length) return;
  if (eff < .6 && needs.length > 1 && LT.rand(G) < (.6 - eff)) { const t = needs[0]; needs[0] = needs[1]; needs[1] = t; }   // quan kém đôi khi chọn nhầm việc
  const acts = 1 + Math.floor(eff * 2.2); let done = 0;
  for (const nd of needs) {
    if (done >= acts) break;
    const why = tryNeed(G, D, d, 'xd', nd);
    if (why) { dgWhyNot(G, 'xd', 'muốn làm "' + nd.k + '" (' + nd.why + ') nhưng ' + why); continue; }
    done++;
  }
  if (done) { LT.recalcCity(G); const o2 = LT.dgOfficer(G, 'xd'); skim(G, 'xd', d, o2, d.spent.tien); }
}

// ============================ QUAN KINH TẾ ============================
const SELLK = ['lua', 'tra', 'gom', 'ruou', 'muoi', 'vai'];
function ktRun(G, D, d, o) {
  const eff = LT.dgEff(G, 'kt');
  // 1) thuế: quý một lần, trong khoảng [taxMin, taxMax]; không vượt khoảng bạn cho phép
  if (G.tick % 9 === 4) {
    let t = G.pol.tax, nt = clamp(t, d.taxMin, d.taxMax), dt = G.stat.dantam, hi = d.pol === 'giau' ? d.dtHi - 8 : d.pol === 'dan' ? d.dtHi + 10 : d.dtHi, lo = d.pol === 'giau' ? d.dtLo - 8 : d.pol === 'dan' ? d.dtLo + 10 : d.dtLo;
    if (nt === t && LT.rand(G) < .35 + .65 * eff) { if (dt > hi && t < d.taxMax) nt = t + 1; else if (dt < lo && t > d.taxMin) nt = t - 1; }
    if (nt !== t) { G.pol.tax = nt; d.stat.taxMoves++; dgLog(G, 'kt', 'ok', 'Chỉnh thuế ' + LT.TAX_LEVELS[t].n + ' → ' + LT.TAX_LEVELS[nt].n + ' (dân tâm ' + Math.round(dt) + ', khoảng mong muốn ' + lo + '–' + hi + ', trần ' + LT.TAX_LEVELS[d.taxMax].n + ').'); }
  }
  if (G.tick % 3 !== 1) return;
  // 2) mua lương khi thiếu (dân đói là việc đầu tiên), trong ngân sách
  if (d.buyGrain && LT.marketTier(G) > 0) {
    const dem = LT.demandWeek(G).luong + LT.armyDemandWeek(G), fw = LT.foodWeeks(G);
    if (fw < 10) {
      const want = Math.ceil(dem * 14 - (G.dan.luong + G.res.luong)), p = LT.marketQuote(G, 'luong', 'buy'), maxByBudget = Math.floor(Math.min(remain(d, 'tien'), G.res.tien - d.reserve) / p), room = LT.capOf(G, 'luong') - G.res.luong;
      const qty = Math.min(want, maxByBudget, room, Math.floor(LT.marketVolCap(G) / p));
      if (qty >= 20) { const r = LT.marketTrade(G, 'luong', qty, 'buy'); if (r.ok) { d.spent.tien += r.value; d.stat.bought += qty; dgLog(G, 'kt', 'ok', 'Mua ' + qty + ' thạch lương ở chợ giá ' + p.toFixed(2).replace('.', ',') + ' (tốn ' + Math.round(r.value) + ' quan) vì lương chỉ đủ ' + Math.round(fw) + ' tuần.'); skim(G, 'kt', d, o, r.value); } else dgWhyNot(G, 'kt', 'muốn mua lương nhưng ' + r.err.toLowerCase()); }
      else dgWhyNot(G, 'kt', 'lương chỉ đủ ' + Math.round(fw) + ' tuần nhưng ' + (maxByBudget < 20 ? 'hết ngân sách mua (còn ' + Math.floor(remain(d, 'tien')) + ' quan)' : 'kho không còn chỗ'));
    }
  }
  // 3) bán hàng dư để có tiền
  if (d.sell && LT.marketTier(G) > 0 && (d.pol === 'giau' || G.res.tien < Math.max(300, d.reserve * 4))) {
    const dem = LT.demandWeek(G);
    for (const k of SELLK) {
      const have = G.res[k] || 0, keep = Math.max(30, (dem[k] || 0) * 14), sur = have - keep; if (sur < 15) continue;
      const qty = Math.floor(sur * .6), r = LT.marketTrade(G, k, qty, 'sell');
      if (r.ok) { d.stat.sold += qty; dgLog(G, 'kt', 'ok', 'Bán ' + qty + ' ' + LT.GOODS[k].n.toLowerCase() + ' dư ở chợ được ' + Math.round(r.value) + ' quan (giữ lại ' + Math.round(keep) + ').'); break; }
      else if (!/Vượt sức chợ|Tiền hoang/.test(r.err)) dgWhyNot(G, 'kt', 'muốn bán ' + LT.GOODS[k].n.toLowerCase() + ' nhưng ' + r.err.toLowerCase()); else { dgWhyNot(G, 'kt', 'chợ không nhận thêm hàng: ' + r.err.toLowerCase()); break; }
    }
  }
}

// ============================ QUAN QUÂN SỰ ============================
const MIXK = ['truongthuong', 'cung', 'daothuan', 'khinhky', 'trongky', 'no'];
function qsRun(G, D, d, o) {
  if (G.tick % 9 !== 6) return; const eff = LT.dgEff(G, 'qs');
  const tg = d.tg.quan; if (!(tg > 0)) { dgWhyNot(G, 'qs', 'chưa đặt mục tiêu quân số'); return; }
  const have = LT.armyCount(G); if (have >= tg) return;
  if (LT.rand(G) > .55 + .45 * eff) return;
  const mix = d.mix, sumMix = MIXK.reduce((a, k) => a + (mix[k] || 0), 0) || 1, cnt = {}; for (const u of G.units) cnt[u.type] = (cnt[u.type] || 0) + u.n;
  let type = null, best = -1e9; for (const k of MIXK) { if (!(mix[k] > 0)) continue; const gap = (mix[k] / sumMix) * tg - (cnt[k] || 0); if (gap > best) { best = gap; type = k; } }
  if (!type) { dgWhyNot(G, 'qs', 'cơ cấu binh chủng đang trống'); return; }
  // bổ sung đơn vị còn thiếu quân trước (rẻ nhất), nếu không thì lập đơn vị mới
  let n = Math.min(LT.unitCap(G), tg - have), u0 = G.units.find(u => u.type === type && u.n < LT.unitCap(G) * .8 && !(u.tan > 0));
  // ngân sách quân sự tính theo giá trị quy ra quan (tiền + hàng lấy từ kho theo giá gốc; hàng thiếu phải mua bù giá ×1,5)
  const est = nn => { const c = LT.recruitCost(type, nn); let v = 0; for (const k in c) { if (k === 'tien') v += c[k]; else { const have = Math.min(G.res[k] || 0, c[k]); v += have * LT.GOODS[k].p + (c[k] - have) * LT.GOODS[k].p * 1.5; } } return v; };
  const worth = () => { let v = G.res.tien; for (const k in G.res) if (k !== 'tien' && LT.GOODS[k]) v += (G.res[k] || 0) * LT.GOODS[k].p; return v; };
  const maxT = Math.min(remain(d, 'tien'), G.res.tien - d.reserve);
  while (n >= 10 && est(n) > maxT) n = Math.floor(n * .7);
  if (n < 10) { dgWhyNot(G, 'qs', 'cần thêm quân (' + have + '/' + tg + ') nhưng hết ngân sách quân sự (còn ' + Math.floor(remain(d, 'tien')) + ' quan)'); return; }
  const t0 = worth(); let r;
  if (u0) { n = Math.min(n, LT.unitCap(G) - u0.n); r = n >= 10 ? LT.reinforce(G, u0.id, n) : { ok: false, err: 'đơn vị đã đầy' }; } else r = LT.recruit(G, type, n);
  if (!r.ok) { dgWhyNot(G, 'qs', 'muốn mộ ' + n + ' ' + LT.UNITS[type].n.toLowerCase() + ' nhưng ' + r.err.charAt(0).toLowerCase() + r.err.slice(1)); return; }
  const used = Math.max(0, t0 - worth()); d.spent.tien += used; d.stat.recruited += n;
  dgLog(G, 'qs', 'ok', (u0 ? 'Bổ sung ' : 'Mộ ') + n + ' ' + LT.UNITS[type].n.toLowerCase() + ' (quân ' + have + ' → ' + LT.armyCount(G) + '/' + tg + '), tốn ' + Math.round(used) + ' quan theo cơ cấu ' + MIXK.filter(k => mix[k] > 0).map(k => LT.UNITS[k].n.toLowerCase() + ' ' + Math.round(mix[k] / sumMix * 100) + '%').join(', ') + '.');
  skim(G, 'qs', d, o, used);
}

// ============================ TỔNG QUẢN CÁC THÀNH ============================
function ttRun(G, D, d, o) {
  if (G.tick % 9 !== 2) return; const eff = LT.dgEff(G, 'tt'); const cities = LT.ownedCities(G); if (!cities.length) return;
  const budgetT = () => Math.min(remain(d, 'tien'), G.res.tien - d.reserve);
  if (d.fill) {
    for (const c of cities.filter(c => !c.quan)) {
      let sg = LT.offSuggest(G, c.id, false);
      if (!sg) { const pool = LT.offSuggest(G, c.id, true); if (pool && pool.o.id < 0 && LT.offHireCost(pool.o) <= budgetT()) { const h = LT.offHire(G, pool.o.id); if (h.ok) { d.spent.tien += LT.offHireCost(pool.o); sg = { o: h.o }; } } }
      if (!sg) { dgWhyNot(G, 'tt', 'thành ' + c.n + ' khuyết quan nhưng không còn người rảnh và không đủ ngân sách chiêu mộ'); continue; }
      const r = LT.offAppoint(G, sg.o.id, { t: 'city', id: c.id }); if (r.ok) { d.stat.filled++; dgLog(G, 'tt', 'ok', 'Bổ nhiệm ' + sg.o.name + ' (chính ' + Math.round(sg.o.chinh) + ', trung ' + Math.round(sg.o.trung) + ') giữ ' + c.n + ' vì thành đang khuyết quan.'); }
    }
  }
  if (d.rotate) for (const c of cities) {
    const oo = LT.offById(G, c.quan); if (!oo || LT.offTenure(G, oo) < 3) continue;
    if (budgetT() < 20) { dgWhyNot(G, 'tt', 'quan ' + oo.name + ' ở ' + c.n + ' quá nhiệm kỳ 3 năm nhưng hết ngân sách luân chuyển (20 quan)'); break; }
    if (LT.rand(G) > .5 + .5 * eff) continue;
    const t0 = G.res.tien, r = LT.rotateOfficial(G, c.id); if (r.ok) { d.spent.tien += t0 - G.res.tien; d.stat.rotated++; dgLog(G, 'tt', 'ok', 'Luân chuyển quan ở ' + c.n + ' (' + oo.name + ' đã ' + LT.offTenure(G, oo).toFixed(1).replace('.', ',') + ' năm), tốn 20 quan, tự chủ giảm.'); }
  }
  if (d.inspect) for (const c of cities) {
    const lim = d.pol === 'chat' ? 45 : 60; if (!(c.tamo > .12 || c.auto > lim)) continue;
    if (budgetT() < 30) { dgWhyNot(G, 'tt', c.n + ' có dấu hiệu tham ô/tự chủ (' + Math.round(c.tamo * 100) + '%/' + Math.round(c.auto) + ') nhưng hết ngân sách thanh tra (30 quan)'); break; }
    const t0 = G.res.tien, tm0 = Math.round(c.tamo * 100), au0 = Math.round(c.auto), r = LT.inspectCity(G, c.id); if (r.ok) { d.spent.tien += t0 - G.res.tien; d.stat.inspected++; dgLog(G, 'tt', 'ok', 'Cho ngự sử tra ' + c.n + ' vì tham ô ' + tm0 + '% / tự chủ ' + au0 + ' (sau tra: tham ô ' + Math.round(c.tamo * 100) + '%), tốn 30 quan.'); }
  }
}

// ---- nhịp tuần: chỉ chạy chức nào đang BẬT và có quan; không bật gì thì không làm gì ----
LT.dgWeek = function (G) {
  const D = G.off && G.off.dg; if (!D) return;
  const runners = { xd: xdRun, kt: ktRun, qs: qsRun, tt: ttRun };
  for (const role of ['xd', 'kt', 'qs', 'tt']) {
    const d = D[role]; if (!d.on) continue;
    const pk = periodKey(G, d); if (d.pk !== pk) { d.pk = pk; for (const k in d.spent) d.spent[k] = 0; }
    const o = LT.dgOfficer(G, role); if (!o) { dgWhyNot(G, role, 'chưa bổ nhiệm quan phụ trách'); continue; }
    if (G.rank < 2) continue;
    runners[role](G, D, d, o);
  }
};
})(typeof globalThis !== 'undefined' ? globalThis : window);

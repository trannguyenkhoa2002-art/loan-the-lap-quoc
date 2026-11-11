'use strict';
// ============================================================================
// CHIẾN TRẬN BẰNG SỐ LIỆU (GP §9–10, CT §3.3 phần sa bàn). Thuần túy, chạy được bằng node.
// Công thức (GP §10.4, công khai cho người chơi):
//   Lực = Quân số × Công × Khắc × Trận hình × Địa hình × Lệnh giai đoạn
//         × (0,5 + HL÷200) × (0,5 + SK÷200) × (1 + Thống÷200) × (1 + 0,08 × (Trang bị − 1))
//   Thương vong gây ra = Lực ÷ (Thủ địch × 20)
// ============================================================================
(function (g) {
const LT = g.LT = g.LT || {};
const U = LT.UNITS, clamp = LT.clamp;
const ROWN = ['Tiền quân', 'Trung quân', 'Hậu quân'], COLN = ['Tả dực', 'Trung', 'Hữu dực'];
LT.ROWN = ROWN; LT.COLN = COLN;
const mkRng = seed => { let s = (seed | 0) + 0x9E3779B9; return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), s | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
LT.mkRng = mkRng;

// khắc chế: hệ số khi a đánh b
LT.khacOf = (a, b) => {
  if (LT.KHAC[a] && LT.KHAC[a][b]) return LT.KHAC[a][b];
  if (LT.KHAC[b] && LT.KHAC[b][a]) return 1 / LT.KHAC[b][a];
  return 1;
};

// Một lượt đánh giữa hai đơn vị — đúng công thức tài liệu. o: các hệ số tùy chọn.
LT.hitCalc = function (att, def, o) {
  o = o || {};
  const ua = U[att.type], ud = U[def.type];
  const khac = o.khac != null ? o.khac : LT.khacOf(att.type, def.type);
  const parts = {
    quan: att.n, cong: ua.cong * (o.congMul || 1), khac, form: o.form || 1, terrain: o.terrain || 1, order: o.order || 1,
    hl: .5 + att.hl / 200, sk: .5 + att.sk / 200, tong: 1 + (att.tong || 0) / 200, tb: 1 + .08 * ((att.tb || 1) - 1), extra: o.extra || 1,
  };
  const luc = parts.quan * parts.cong * parts.khac * parts.form * parts.terrain * parts.order * parts.hl * parts.sk * parts.tong * parts.tb * parts.extra;
  const thu = ud.thu * (1 + .08 * ((def.tb || 1) - 1)) * (o.defMul || 1);
  return { luc, thu, cas: luc / (thu * 20), khac, parts };
};

// ---- dựng bên tham chiến ------------------------------------------------------
LT.newSide = function (name) {
  return { name: name || '', grid: [[null, null, null], [null, null, null], [null, null, null]], reserve: [], ambush: null, form: 'phuong', wing: 'left',
    orders: { p1: 'banphu', p2: 'tongcong', p3: 'thuquan' }, conds: [], chief: { name: 'Chủ tướng', tong: 45, tri: 50 }, wall: 0 };
};
LT.battleUnit = function (u, gen, chief) {
  return { id: u.id, type: u.type, n: u.n, n0: u.n, hl: u.hl, sk: u.sk, tb: u.tb || 1, tong: gen ? gen.tong : chief.tong, gen: gen ? gen.name : null, genId: gen ? gen.id : null, genTri: gen ? gen.tri : 0, broken: false, dead: false };
};
// dựng bên của người chơi từ G.formation
LT.buildPlayerSide = function (G, f) {
  const s = LT.newSide(G.name);
  const chiefGen = f.chiefGen ? G.gens.find(x => x.id === f.chiefGen) : null;
  s.chief = chiefGen ? { name: chiefGen.name, tong: chiefGen.tong, tri: chiefGen.tri, id: chiefGen.id } : { name: G.name + ' (' + LT.RANKS[G.rank].n + ')', tong: G.player.tong, tri: G.player.tri };
  const get = id => G.units.find(u => u.id === id);
  const genOf = uid => { const gid = f.genOf && f.genOf[uid]; return gid ? G.gens.find(x => x.id === gid) : null; };
  for (let i = 0; i < 9; i++) { const id = f.slots[i]; if (!id) continue; const u = get(id); if (u && u.n > 0) s.grid[Math.floor(i / 3)][i % 3] = LT.battleUnit(u, genOf(id), s.chief); }
  for (const id of f.reserve || []) { const u = get(id); if (u && u.n > 0) s.reserve.push(LT.battleUnit(u, genOf(id), s.chief)); }
  if (f.ambush) { const u = get(f.ambush); if (u && u.n > 0) s.ambush = LT.battleUnit(u, genOf(f.ambush), s.chief); }
  s.form = f.form || 'phuong'; s.wing = f.wing || 'left'; s.orders = Object.assign({}, f.orders); s.conds = (f.conds || []).slice();
  return s;
};
LT.sideUnits = s => { const a = []; for (const r of s.grid) for (const u of r) if (u) a.push(u); for (const u of s.reserve) a.push(u); if (s.ambush) a.push(s.ambush); return a; };
LT.sideTotal = s => LT.sideUnits(s).reduce((n, u) => n + u.n, 0);
LT.clone = o => JSON.parse(JSON.stringify(o));

// xếp trận tự động: bộ binh chắc ở giữa, cung nỏ hậu quân, kỵ binh hai cánh
LT.autoLineup = function (units) {
  const L = { slots: Array(9).fill(null), reserve: [], ambush: null };
  const list = units.filter(u => u.n > 0);
  const val = u => u.n * (U[u.type].cong + U[u.type].thu) / 2 * (.5 + (u.hl == null ? 40 : u.hl) / 200) * (.5 + (u.sk == null ? 60 : u.sk) / 200) * (1 + .08 * ((u.tb || 1) - 1));
  const maxN = list.reduce((m, u) => Math.max(m, u.n), 1);
  // đơn vị tàn (dưới 30% đơn vị lớn nhất) không được đứng tuyến trước: vào dự bị, còn chỗ thì mới xuống hậu quân
  const small = list.length > 3 ? list.filter(u => u.n < maxN * .3) : [];
  const main = list.filter(u => small.indexOf(u) < 0).sort((p, q) => val(q) - val(p));
  const melee = main.filter(u => U[u.type].kind === 'bo'), ky = main.filter(u => U[u.type].kind === 'ky'), xa = main.filter(u => U[u.type].kind === 'xa');
  const put = (i, u) => { if (u && L.slots[i] == null) { L.slots[i] = u.id; return true; } return false; };
  const pool = melee.slice();
  if (pool.length) put(1, pool.shift());                       // trung quân tiền tuyến: đơn vị mạnh nhất
  for (const i of [0, 2]) { const k = ky.shift(); if (k) put(i, k); else if (pool.length) put(i, pool.shift()); }
  for (const i of [4, 3, 5]) if (pool.length) put(i, pool.shift());
  for (const i of [7, 6, 8, 4, 3, 5]) { const x = xa.shift(); if (x) put(i, x); }
  for (const k of ky.slice()) { for (const i of [3, 5, 6, 8]) if (put(i, k)) { ky.splice(ky.indexOf(k), 1); break; } }
  const left = main.filter(u => L.slots.indexOf(u.id) < 0);
  for (const i of [1, 4, 0, 2, 3, 5, 7, 6, 8]) if (left.length && L.slots[i] == null) put(i, left.shift());
  const rest = left.concat(small.sort((p, q) => val(q) - val(p)));
  for (const u of rest) { if (L.reserve.length < 3) L.reserve.push(u.id); else { const i = [7, 6, 8, 3, 5].find(j => L.slots[j] == null); if (i != null) put(i, u); } }
  return L;
};

// ---- hệ số trận hình ------------------------------------------------------
function formMul(s, u, ut, isShoot, c) {
  let att = 1, def = 1;
  switch (s.form) {
    case 'phuong': def = 1.1; break;
    case 'vien': def = 1.25; att = .85; break;
    case 'phongthi': if (c === 1) att = 1.25; else def = .85; break;
    case 'nhanhanh': if (isShoot) att = 1.2; else if (c !== 1) att = 1.1; if (c === 1) def = .9; break;
    case 'hacduc': if (c === 1) def = .85; break;
    case 'yennguyet': { const w = s.wing === 'left' ? 0 : 2, o = 2 - w; if (c === w) att = 1.3; else if (c === o) att = .8; break; }
    case 'truongxa': if (!isShoot) att = .9; break;
  }
  return { att, def };
}

// ---- trận đánh ------------------------------------------------------------
// cfg: {A, B, terrain, holder:'A'|'B'|null, crosser, wallA, wallB, variance, defender}
LT.runBattle = function (cfg, seed, opt) {
  opt = opt || {};
  const rnd = mkRng(seed || 1), V = cfg.variance == null ? .08 : cfg.variance, TER = cfg.terrain || 'dongbang';
  const S = { A: LT.clone(cfg.A), B: LT.clone(cfg.B) }, EN = { A: 'B', B: 'A' };
  const names = { A: cfg.nameA || S.A.name || 'Ta', B: cfg.nameB || S.B.name || 'Địch' };
  const rep = { terrain: TER, hieps: [], names, result: null, why: '', ctx: { holder: cfg.holder, crosser: cfg.crosser } };
  const tienGap = S.A.orders.p1 === 'tiengap' || S.B.orders.p1 === 'tiengap';
  const contact = tienGap ? 2 : 3, shootHieps = tienGap ? [1] : [1, 2];
  for (const X of ['A', 'B']) {
    const s = S[X]; s.fat = s.orders.p1 === 'tiengap' ? 10 : 0; s.startN = LT.sideTotal(s); s.centerBroke = false; s.antiCav = false; s.camcuFlag = false;
    s.retreat = false; s.orderly = false; s.firedConds = {}; s.counter = 0; s.disorder = 0; s.retreatHiep = 0; s.genDied = 0;
    s.startUnits = LT.sideUnits(s).filter(u => true).length;
    s.hasCenter = !!s.grid[1][1];
    for (const u of LT.sideUnits(s)) { u.boost = 0; u.moved = false; u.nbBroke = false; }
    s.started = LT.sideUnits(s).reduce((n, u) => n + 1, 0);
    s.hadCol = [0, 1, 2].map(c => [0, 1, 2].some(r => s.grid[r][c]));
  }
  const hacduc = X => S[X].form === 'hacduc' && S[X].startN >= 1.3 * S[EN[X]].startN;
  const cols = X => { const s = S[X]; return [0, 1, 2].map(c => { const l = []; for (let r = 0; r < 3; r++) { const u = s.grid[r][c]; if (u && !u.broken && u.n > .5) l.push(u); } return l; }); };
  const compress = (X, h) => {
    const s = S[X];
    for (let c = 0; c < 3; c++) {
      const l = []; for (let r = 0; r < 3; r++) { const u = s.grid[r][c]; if (u && !u.broken && u.n > .5) l.push({ u, r }); }
      const bk = []; for (let r = 0; r < 3; r++) { const u = s.grid[r][c]; if (u && (u.broken || u.n <= .5)) bk.push(u); }
      for (let r = 0; r < 3; r++) s.grid[r][c] = null;
      l.forEach((e, i) => { e.u.moved = e.r !== i; e.u.r = i; e.u.c = c; s.grid[i][c] = e.u; });
      // đơn vị vỡ lùi ra khỏi hàng
      bk.forEach((u, i) => { const r = Math.min(2, l.length + i); if (!s.grid[r][c]) s.grid[r][c] = u; });
    }
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) { const u = s.grid[r][c]; if (u) { u.r = r; u.c = c; } }
  };
  const alive = X => { const a = []; for (const r of S[X].grid) for (const u of r) if (u && !u.broken && u.n > .5) a.push(u); return a; };
  const totalAlive = X => alive(X).reduce((n, u) => n + u.n, 0);
  const strength = X => alive(X).reduce((n, u) => n + u.n * (U[u.type].cong + U[u.type].thu) / 2, 0);
  const posName = u => ROWN[u.r] + '·' + COLN[u.c];
  const label = (X, u) => (X === 'A' ? '' : '') + U[u.type].n + ' [' + posName(u) + ']';
  const enterReserve = (X, c, why, hLog) => { // đưa 1 đơn vị dự bị vào ô trống/ô trung quân
    const s = S[X]; if (!s.reserve.length) return false;
    const u = s.reserve.shift();
    const prefer = c == null ? [[1, 1], [0, 1], [2, 1], [1, 0], [1, 2], [0, 0], [0, 2], [2, 1]] : [[1, c], [0, c], [2, c]];
    for (const [r, cc] of prefer) { const o = s.grid[r][cc]; if (!o || o.broken || o.n <= .5) { s.grid[r][cc] = u; u.r = r; u.c = cc; hLog.push({ t: 'ev', s: X, txt: 'Dự bị ' + U[u.type].n + ' vào ô ' + ROWN[r] + '·' + COLN[cc] + ' (' + why + ')' }); return true; } }
    s.reserve.unshift(u); return false;
  };

  for (let h = 1; h <= 12 && !rep.result; h++) {
    const H = { n: h, phase: h <= 2 ? 1 : h <= 8 ? 2 : 3, lines: [], ev: [], atk: { A: 0, B: 0 }, loss: { A: 0, B: 0 } };
    rep.hieps.push(H);
    const phase = H.phase;
    // --- lệnh giai đoạn: dự bị, quân lệnh điều kiện ---
    for (const X of ['A', 'B']) {
      const s = S[X], ord = phase === 1 ? s.orders.p1 : phase === 2 ? s.orders.p2 : s.orders.p3;
      if (h === 9 && s.orders.p3 === 'dubi') { let k = 0; while (k < 3 && enterReserve(X, null, 'lệnh giai đoạn 3', H.ev)) k++; }
      if (h === 1 && tienGap && s.orders.p1 === 'tiengap') H.ev.push({ t: 'ev', s: X, txt: 'Lệnh Tiến gấp: bỏ qua 1 hiệp bắn của cả hai bên, giáp chiến sớm; quân mệt +10.' });
      if (h === 4 && s.orders.p2 === 'trabai') { // trá bại
        s.retreatHiep = 4; const e = S[EN[X]];
        const mine = (s.chief.tri || 0), theirs = (e.chief.tri || 0);
        if (mine > theirs) { e.disorder = 6; s.counter = 6; H.ev.push({ t: 'ev', s: X, txt: 'TRÁ BẠI thành công (Trí ' + mine + ' > ' + theirs + '): địch đuổi theo, vỡ đội hình — Thủ địch ×0,85, ta phản công Công ×1,2 ở hiệp 5–6.' }); for (const u of alive(EN[X])) u.sk -= 10; }
        else { for (const u of alive(X)) u.sk -= 12; H.ev.push({ t: 'ev', s: X, txt: 'TRÁ BẠI thất bại (Trí ' + mine + ' ≤ ' + theirs + '): bị địch nhìn thấu, sĩ khí ta −12.' }); }
      }
      // quân lệnh điều kiện
      for (const cid of s.conds) {
        if (s.firedConds[cid]) continue;
        const e = S[EN[X]], ec = cols(EN[X]);
        if (cid === 'canhtrai' || cid === 'canhphai') {
          const cc = cid === 'canhtrai' ? 0 : 2;
          if (e.hadCol[cc] && ec[cc].length === 0 && h > 1) { s.firedConds[cid] = 1; for (const u of alive(X)) if (u.type === 'khinhky') u.boost = h + 2; H.ev.push({ t: 'cond', s: X, txt: 'QUÂN LỆNH: cánh ' + (cc === 0 ? 'trái' : 'phải') + ' địch vỡ → khinh kỵ truy kích (Công ×1,3, 2 hiệp).' }); }
        } else if (cid === 'sikhi40') {
          const u = s.grid[1][1];
          if (u && !u.broken && u.sk < 40 && s.reserve.length) { s.firedConds[cid] = 1; const r = s.reserve.shift(); s.grid[1][1] = r; r.r = 1; r.c = 1; s.reserve.push(u); H.ev.push({ t: 'cond', s: X, txt: 'QUÂN LỆNH: sĩ khí trung quân ' + Math.round(u.sk) + ' < 40 → dự bị ' + U[r.type].n + ' vào thay.' }); }
        } else if (cid === 'thuongvong30') {
          const lostR = 1 - LT.sideUnits(s).reduce((q, u) => q + u.n, 0) / Math.max(1, s.startN);
          if (lostR > .3) { s.firedConds[cid] = 1; s.retreat = true; H.ev.push({ t: 'cond', s: X, txt: 'QUÂN LỆNH: thương vong ' + Math.round(lostR * 100) + '% > 30% → thu quân có trật tự.' }); }
        } else if (cid === 'trongky') {
          if (alive(EN[X]).some(u => u.type === 'trongky') && h <= contact) { s.firedConds[cid] = 1; s.antiCav = true; H.ev.push({ t: 'cond', s: X, txt: 'QUÂN LỆNH: địch có trọng kỵ xung phong → tuyến đầu đổi sang trường thương (khắc kỵ ×1,5).' }); }
        } else if (cid === 'sikhi50') {
          const a = alive(X); if (a.length && a.reduce((q, u) => q + u.sk, 0) / a.length < 50) { s.firedConds[cid] = 1; s.camcuFlag = true; H.ev.push({ t: 'cond', s: X, txt: 'QUÂN LỆNH: sĩ khí quân < 50 → chuyển sang Cầm cự.' }); }
        }
      }
    }
    // --- sắp hàng (lên thay chỗ trống) ---
    compress('A', h); compress('B', h);
    // --- hệ số lệnh giai đoạn của mỗi bên ---
    for (const X of ['A', 'B']) {
      const s = S[X]; let oa = 1, od = 1;
      if (h <= 4 && s.orders.p1 === 'giutran') od = 1.15;
      if (phase === 2 || s.camcuFlag) {
        const o2 = s.camcuFlag ? 'camcu' : s.orders.p2;
        if (o2 === 'tongcong') { oa = 1.15; od = .9; } else if (o2 === 'camcu') { oa = .9; od = 1.15; }
      }
      s._ordAtt = oa; s._ordDef = od;
    }
    // --- thiệt hại hiệp này (đồng thời) ---
    const dmg = new Map(), flankedSet = new Set(), events = [];
    const nBefore = new Map(); for (const X of ['A', 'B']) for (const u of alive(X)) nBefore.set(u, u.n);
    for (const X of ['A', 'B']) {
      const s = S[X], E = S[EN[X]], ecols = cols(EN[X]);
      for (const u of alive(X)) {
        const ut = U[u.type]; let mode = null;
        if (s.retreatHiep === h) continue;           // đang lùi (trá bại)
        if (TER === 'ai' && u.c !== 1) continue;      // ải hẹp: chỉ trung quân giao chiến
        if (ut.ranged === 'cung') mode = shootHieps.includes(h) ? 'shoot' : (u.r === 0 && h >= contact ? 'weak' : null);
        else if (ut.ranged === 'no') mode = (h % 2 === 1) ? 'shoot' : (u.r === 0 && h >= contact ? 'weak' : null);
        else mode = (h >= contact && u.r === 0) ? 'melee' : null;
        if (!mode) continue;
        let tcol = TER === 'ai' ? 1 : u.c, tgt = null, flank = false, rear = false;
        const pickFront = c => ecols[c][0] || null;
        if (mode === 'shoot') tgt = pickFront(tcol) || pickFront(1) || pickFront(0) || pickFront(2);
        else {
          if (phase === 3 && s.orders.p3 === 'kybochau' && ut.kind === 'ky' && (u.c === 0 || u.c === 2)) {
            const all = []; for (let c = 0; c < 3; c++) if (ecols[c].length) all.push(ecols[c][ecols[c].length - 1]);
            tgt = all.sort((a, b) => b.r - a.r)[0] || null; flank = true; rear = true;
          }
          if (!tgt && hacduc(X) && h >= 3 && (u.c === 0 || u.c === 2) && ecols[1].length) { tgt = ecols[1][0]; flank = true; }
          if (!tgt) {
            tgt = pickFront(tcol);
            if (!tgt) { // ô đối diện trống: tràn sang đánh sườn
              const alt = tcol === 1 ? (ecols[0].length >= ecols[2].length ? [0, 2] : [2, 0]) : tcol === 0 ? [1, 2] : [1, 0];
              for (const c of alt) if (ecols[c].length) { tgt = ecols[c][0]; flank = true; break; }
            }
          }
        }
        if (!tgt) continue;
        const tut = U[tgt.type];
        const tf = formMul(E, tgt, tut, false, tgt.c), sfm = formMul(s, u, ut, mode === 'shoot', u.c);
        let terrain = 1;
        if (ut.kind === 'ky') { if (TER === 'dongbang') terrain = 1.1; else if (TER === 'rung') terrain = .7; else if (TER === 'damlay' && u.type === 'trongky') terrain = .5; }
        if (TER === 'vuotsong' && cfg.crosser === X && h <= 3) terrain *= .7;
        let defMul = tf.def * E._ordDef;
        if (TER === 'doi' && cfg.holder === EN[X]) defMul *= 1.2;
        if (E.wall > 0) defMul *= 1 + .5 * E.wall;
        if (E.disorder >= h) defMul *= .85;
        let extra = 1, congMul = 1;
        if (mode === 'weak') congMul = ut.ranged === 'no' ? .3 : .4;
        const charge = u.type === 'trongky' && mode === 'melee' && h === contact;
        if (charge) extra *= 1.8;
        if (flank && E.form !== 'vien') extra *= 1.25;
        if (s.counter >= h && h > 4) extra *= 1.2;
        if (u.boost >= h) extra *= 1.3;
        if (u.moved && s.form !== 'ngulan') extra *= .8;
        if (rear) extra *= 1.3;
        let khac = LT.khacOf(u.type, tgt.type);
        if (s.antiCav && u.r === 0 && mode === 'melee' && tut.kind === 'ky') khac = Math.max(khac, 1.5);
        const fatf = 1 - s.fat / 200, rv = 1 + (rnd() - .5) * 2 * V, special = extra;
        extra *= fatf * rv;
        const r = LT.hitCalc(u, tgt, { khac, form: sfm.att, terrain, order: s._ordAtt, extra, congMul, defMul });
        let cas = r.cas;
        if (mode === 'shoot' && tgt.type === 'daothuan') cas *= .7;
        if (E.form === 'truongxa' && flank && !rear) cas *= .5;
        if (E.orderly && h >= 9) cas *= .6;
        if (E.retreat) cas *= .6;
        cas = Math.min(cas, tgt.n);
        dmg.set(tgt, (dmg.get(tgt) || 0) + cas);
        if (flank && E.form !== 'vien') flankedSet.add(tgt);
        events.push({ X, u, tgt, cas, flank, mode, luc: r.luc, thu: r.thu, khac, charge, fx: { rv, fatf, special, form: sfm.att, ord: s._ordAtt, terrain, defMul, cong: r.parts.cong, hl: r.parts.hl, sk: r.parts.sk, tong: r.parts.tong, tb: r.parts.tb } });
      }
    }
    // phục binh: một đòn ở hiệp 3 (rừng, đồi, lau sậy)
    if (h === 3 && (TER === 'rung' || TER === 'doi')) {
      for (const X of ['A', 'B']) {
        const s = S[X], E = S[EN[X]]; if (!s.ambush) continue;
        const ec = cols(EN[X]); const wing = ec[0].length >= ec[2].length ? ec[0] : ec[2]; const tgt = (wing[0]) || ec[1][0]; if (!tgt) continue;
        const u = s.ambush; u.r = 3; u.c = 1;
        const extra = (E.form === 'truongxa' ? .5 : 1) * 1.4 * (1 + (rnd() - .5) * 2 * V);
        const r = LT.hitCalc(u, tgt, { khac: LT.khacOf(u.type, tgt.type), extra, defMul: formMul(E, tgt, U[tgt.type], false, tgt.c).def * E._ordDef });
        const cas = Math.min(r.cas, tgt.n); dmg.set(tgt, (dmg.get(tgt) || 0) + cas); flankedSet.add(tgt);
        events.push({ X, u, tgt, cas, flank: true, mode: 'phuc', luc: r.luc, thu: r.thu, khac: r.khac, charge: false });
        s.reserve.push(u); s.ambush = null;
      }
    }
    // ghi chiến báo và áp dụng
    const lossBy = { A: 0, B: 0 };
    for (const e of events) {
      H.lines.push({ s: e.X, atk: U[e.u.type].n, atkPos: e.u.r === 3 ? 'Phục binh' : posName(e.u), tgt: U[e.tgt.type].n, tgtPos: posName(e.tgt), tcol: e.tgt.c, cas: e.cas, flank: e.flank, mode: e.mode, luc: e.luc, thu: e.thu, khac: e.khac, charge: e.charge, atkN: e.u.n, tgtN: e.tgt.n, fx: e.fx });
      H.atk[e.X] += e.cas; lossBy[EN[e.X]] += e.cas;
    }
    for (const [u, c] of dmg) u.n = Math.max(0, u.n - c);
    H.loss = { A: lossBy.A, B: lossBy.B };
    // sĩ khí
    for (const X of ['A', 'B']) {
      const s = S[X]; let mm = 1; const stance = (phase === 2 || s.camcuFlag) ? (s.camcuFlag ? 'camcu' : s.orders.p2) : null;
      if (stance === 'camcu') mm *= .7; if (s.form === 'ngulan') mm *= .8;
      for (const u of LT.sideUnits(s)) {
        if (u.broken || u.n0 <= 0 || u.r === undefined) continue;
        const before = nBefore.get(u); if (before == null) continue;
        const ratio = before > 0 ? (dmg.get(u) || 0) / before : 0;
        let loss = ratio * 150, um = mm * (u.type === 'nhabinh' ? .6 : 1);
        if (flankedSet.has(u)) loss += 8; if (u.nbBroke) { loss += 10; u.nbBroke = false; }
        if (ratio > .3 && u.gen && !u.genDead && rnd() < .2) { u.genDead = true; u.tong = Math.max(0, u.tong - 20); loss += 20; s.genDied++; H.ev.push({ t: 'ev', s: X, txt: 'Tướng ' + u.gen + ' của ' + U[u.type].n + ' tử trận, sĩ khí −20.' }); }
        u.sk = Math.max(0, u.sk - loss * um);
        if (u.n <= .5) { u.dead = true; u.broken = true; H.ev.push({ t: 'ev', s: X, txt: U[u.type].n + ' [' + posName(u) + '] bị tiêu diệt.' }); markNb(S[X], u); }
        else if (u.sk < 20) { u.broken = true; H.ev.push({ t: 'ev', s: X, txt: U[u.type].n + ' [' + posName(u) + '] VỠ TRẬN (sĩ khí ' + Math.round(u.sk) + ').' }); markNb(S[X], u); }
      }
    }
    function markNb(s, u) { for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const o = s.grid[u.r + dr] && s.grid[u.r + dr][u.c + dc]; if (o && !o.broken) o.nbBroke = true; } }
    // trung quân vỡ / quá nửa vỡ => toàn quân tan
    for (const X of ['A', 'B']) {
      const s = S[X], center = s.grid[1][1] || null;
      const centerGone = s.hasCenter ? (!center || center.broken) : (s.hadCol[1] && cols(X)[1].length === 0);
      const units = LT.sideUnits(s).filter(u => u.r !== undefined), bro = units.filter(u => u.broken).length;
      if (centerGone && !s.centerBroke && (s.hasCenter || s.hadCol[1])) { s.centerBroke = true; for (const u of alive(X)) u.sk = Math.max(0, u.sk - 30); H.ev.push({ t: 'ev', s: X, txt: 'TRUNG QUÂN VỠ — toàn quân ' + names[X] + ' mất 30 sĩ khí.' }); }
      s.routed = (centerGone && (s.hasCenter || s.hadCol[1])) || (units.length && bro > units.length / 2) || alive(X).length === 0;
    }
    // thu quân sau hiệp 12 nếu có lệnh
    for (const X of ['A', 'B']) {
      const s = S[X];
      if (h === 9 && s.orders.p3 === 'thuquan') { const mine = strength(X), their = strength(EN[X]); if (mine < their) { s.orderly = true; H.ev.push({ t: 'ev', s: X, txt: 'Thu quân có trật tự: đang thua nên thiệt hại các hiệp cuối ×0,6.' }); } }
    }
    H.after = { A: { n: Math.round(totalAlive('A')), units: alive('A').length }, B: { n: Math.round(totalAlive('B')), units: alive('B').length } };
    H.units = {}; for (const X of ['A', 'B']) H.units[X] = LT.sideUnits(S[X]).filter(u => u.r !== undefined && u.r < 3).map(u => ({ type: u.type, pos: posName(u), n: Math.round(u.n), sk: Math.round(u.sk), broken: !!u.broken }));
    // kết thúc?
    const a = S.A, b = S.B;
    if (a.routed || b.routed) {
      rep.result = a.routed && b.routed ? 'draw' : a.routed ? 'B' : 'A'; rep.why = 'rout';
      const loser = rep.result === 'A' ? 'B' : 'A';
      if (rep.result !== 'draw') {
        const win = S[rep.result], los = S[loser];
        const cav = alive(rep.result).filter(u => U[u.type].kind === 'ky'), cavShare = cav.length ? cav.reduce((n, u) => n + u.n * (u.type === 'khinhky' ? 2 : 1), 0) / Math.max(1, totalAlive(rep.result)) : 0;
        if (cav.length) { const pct = clamp(.10 + .15 * Math.min(1, cavShare * 1.5), .1, .25); let tot = 0; for (const u of LT.sideUnits(los)) { const c = u.n * pct; u.n = Math.max(0, u.n - c); tot += c; } rep.pursuit = { pct, side: rep.result, cas: tot }; }
        else rep.pursuit = null;
      }
    } else if (a.retreat || b.retreat) { rep.result = a.retreat && b.retreat ? 'draw' : a.retreat ? 'B' : 'A'; rep.why = 'retreat'; }
  }
  if (!rep.result) {
    const sa = strength('A'), sb = strength('B');
    const A0 = S.A.startN, B0 = S.B.startN;
    const la = 1 - totalAlive('A') / Math.max(1, A0), lb = 1 - totalAlive('B') / Math.max(1, B0);
    if (S.A.orders.p3 === 'thuquan' && S.A.orderly) { S.A.endRetreat = true; }
    const ra = sa / Math.max(1, sa + sb);
    rep.result = ra > .55 ? 'A' : ra < .45 ? 'B' : 'draw'; rep.why = 'hiep12';
  }
  const sum = {};
  for (const X of ['A', 'B']) { const s = S[X], u = LT.sideUnits(s); const start = s.startN, end = u.reduce((n, q) => n + q.n, 0); sum[X] = { start, end: Math.round(end), lost: Math.round(start - end), broken: u.filter(q => q.broken && !q.dead).length, dead: u.filter(q => q.dead).length, gensDied: s.genDied }; }
  rep.sum = sum; rep.final = { A: S.A, B: S.B };
  return rep;
};

// ước tính tỉ lệ thắng bằng chạy nhiều lần
LT.estimateWin = function (cfg, runs) {
  runs = runs || 60; let a = 0, d = 0;
  for (let i = 0; i < runs; i++) { const r = LT.runBattle(cfg, 1000 + i * 7919); if (r.result === 'A') a++; else if (r.result === 'draw') d++; }
  return { win: a / runs, draw: d / runs, lose: 1 - (a + d) / runs };
};

// ---- máy đánh: sinh đội hình địch ---------------------------------------------
// comp: [{type,n,hl,sk,tb}], tướng địch {tong,tri}
LT.aiSide = function (name, comp, chief, o) {
  o = o || {};
  const s = LT.newSide(name); s.chief = chief || { name: 'Thủ lĩnh ' + name, tong: 40, tri: 40 };
  const units = comp.map((u, i) => ({ id: 9000 + i, type: u.type, n: u.n, hl: u.hl, sk: u.sk, tb: u.tb || 1 }));
  const L = LT.autoLineup(units);
  for (let i = 0; i < 9; i++) if (L.slots[i]) { const u = units.find(x => x.id === L.slots[i]); s.grid[Math.floor(i / 3)][i % 3] = LT.battleUnit(u, null, s.chief); }
  for (const id of L.reserve) { const u = units.find(x => x.id === id); s.reserve.push(LT.battleUnit(u, null, s.chief)); }
  s.wall = o.wall || 0;
  const hasRanged = units.some(u => U[u.type].kind === 'xa'), hasKy = units.some(u => U[u.type].kind === 'ky');
  s.orders = { p1: hasRanged ? 'banphu' : 'giutran', p2: o.camcu ? 'camcu' : 'tongcong', p3: hasKy ? 'kybochau' : 'thuquan' };
  s.conds = ['sikhi40', 'thuongvong30'];
  s.form = o.form || 'phuong';
  return s;
};
// chọn trận hình đối phó: thử từng trận hình, lấy cái thắng nhiều nhất cho bên máy
LT.aiPickFormation = function (cfg, side, runs) {
  let best = null, bestScore = -1;
  for (const f of LT.FORM_IDS) for (const wing of (f === 'yennguyet' ? ['left', 'right'] : ['left'])) {
    const c = LT.clone(cfg); c[side].form = f; c[side].wing = wing;
    let w = 0; for (let i = 0; i < (runs || 8); i++) { const r = LT.runBattle(c, 55 + i * 131); if (r.result === side) w++; else if (r.result === 'draw') w += .5; }
    if (w > bestScore) { bestScore = w; best = { form: f, wing }; }
  }
  return best;
};
})(typeof globalThis !== 'undefined' ? globalThis : window);

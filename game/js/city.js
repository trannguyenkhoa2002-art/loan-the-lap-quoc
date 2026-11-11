'use strict';
// ============================================================================
// THÀNH TRỊ SỞ: bản đồ, đặt công trình, nối đường, nhân công, chỉ số đầu vào.
// Không đụng DOM. Trạng thái truyền vào là đối tượng G.
// ============================================================================
(function (g) {
const LT = g.LT = g.LT || {};
const N = LT.N = 96;                // vòng 2: lưới 96×96 (gấp 4 diện tích; GP §5.1 ghi 48×48)
const B = LT.B;

// ---- số ngẫu nhiên có hạt giống (lưu được trong G.rs) --------------------------
LT.rand = G => { // mulberry32
  let t = G.rs = (G.rs + 0x6D2B79F5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
LT.randInt = (G, a, b) => a + Math.floor(LT.rand(G) * (b - a + 1));
LT.pick = (G, arr) => arr[Math.floor(LT.rand(G) * arr.length)];
LT.hash = i => { const x = Math.sin(i * 127.1 + 31.7) * 43758.5453; return x - Math.floor(x); };
const nzf = (x, y) => (Math.sin(x * .53 + y * .31 + 1.7) + Math.sin(x * .21 - y * .47 + 4.1) + Math.sin((x + y) * .9)) / 6 + .5;

const tile = LT.tileAt = (G, x, y) => x >= 0 && y >= 0 && x < N && y < N ? G.map[y * N + x] : null;
LT.isBuilt = b => !!b && !b.building;
LT.isRoad = b => !!b && !b.building && (b.k === 'road' || b.k === 'pave' || b.k === 'bridge');
const isRoadLike = b => LT.isRoad(b) || (!!b && !b.building && b.k === 'gate');
LT.HOUSEK = { house: 1, terrace: 1, mansion: 1 };
LT.isRoadLike = isRoadLike;

// ---- tạo bản đồ: nhiều nhánh sông, các vùng rừng, mỏ, đồi tách xa nhau (phải quy hoạch nhiều khu) --------------
LT.genMap = function (G, nation) {
  const seed = 11 + nation * 17 + (G.seatNo || 0) * 101;
  G.map = [];
  for (let i = 0; i < N * N; i++) G.map.push({ t: 'g', b: null, v: LT.hash(i * 3.3), fert: 1 });
  const T = (x, y) => tile(G, x, y);
  const rr = i => LT.hash(seed * 7.13 + i * 1.7);
  const blob = (cx, cy, r, t, sd) => { const R = Math.ceil(r) + 1; for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) { const q = T(Math.round(cx) + x, Math.round(cy) + y); if (q && Math.hypot(x, y) < r * (.6 + .5 * LT.hash(sd + x * 7 + y * 13))) q.t = t; } };
  const hx = G.hx, hy = G.hy, far = (x, y, d) => Math.hypot(x - hx - 1, y - hy - 1) > d;
  // sông chính phía đông, nhánh phía tây, một nhánh nhỏ chảy ngang phía bắc
  for (let y = 0; y < N; y++) {
    const cx = hx + 30 + 6 * Math.sin(y * .09 + .9 + seed * .1) + 2.4 * Math.sin(y * .31 + seed);
    const cw = hx - 31 + 5 * Math.sin(y * .11 + 2.1 + seed * .2) + 2 * Math.sin(y * .37 + seed);
    for (let x = 0; x < N; x++) { const d = Math.abs(x + .5 - cx), d2 = Math.abs(x + .5 - cw); if (d < 1.5 + .6 * Math.sin(y * .31 + seed) || d2 < 1.1 + .5 * Math.sin(y * .23 + seed)) T(x, y).t = 'w'; }
  }
  for (let x = 0; x < N; x++) { const cy = hy - 34 + 4 * Math.sin(x * .13 + seed * .3); if (Math.abs(T(x, 0) && 0) < 1) for (let y = 0; y < N; y++) if (Math.abs(y + .5 - cy) < 1 + .4 * Math.sin(x * .2)) T(x, y).t = 'w'; }
  for (let i = 0; i < 3; i++) { const cx = 8 + rr(i * 3) * (N - 16), cy = 8 + rr(i * 3 + 1) * (N - 16); if (far(cx, cy, 12)) blob(cx, cy, 3 + rr(i) * 2, 'w', seed * 3 + i); }
  // rừng (nhiều vùng), núi đá, đồi, mạch quặng
  const place = (n, kind, rmin, rmax, dmin, off) => { let k = 0; for (let i = 0; i < n * 3 && k < n; i++) { const cx = 4 + rr(off + i * 2) * (N - 8), cy = 4 + rr(off + i * 2 + 1) * (N - 8); if (!far(cx, cy, dmin)) continue; blob(cx, cy, rmin + rr(off + i) * (rmax - rmin), kind, seed * 7 + off + i * 50); k++; } };
  place(42, 'f', 2.5, 5.5, 9, 100);
  place(12, 'r', 1.6, 3, 11, 300);
  place(14, 'h', 2, 4, 8, 500);
  const iron = (LT.NATIONS[nation].mod.iron || 1);
  place(Math.max(3, Math.round(9 * iron)), 'm', 1.8, 3, 12, 700);
  // vùng quanh phủ luôn là đất trống (trừ nước)
  for (let y = -7; y <= 9; y++) for (let x = -7; x <= 9; x++) { const q = T(hx + x, hy + y); if (q && q.t !== 'w') q.t = 'g'; }
  // mạch quặng sắt luôn có trong tầm với: một mạch 13–17 ô và một mạch 18–24 ô quanh trị sở (không nằm trên nước), nước nào cũng vậy
  for (let v = 0; v < 2; v++) { const d0 = v ? 21 : 15, ang0 = rr(900 + v) * 6.283; for (let a = 0; a < 16; a++) { const ang = ang0 + a * .39, cx = Math.round(hx + 1 + Math.cos(ang) * d0), cy = Math.round(hy + 1 + Math.sin(ang) * d0 * .8); if (cx < 5 || cy < 5 || cx > N - 6 || cy > N - 6) continue; const q = T(cx, cy); if (!q || q.t === 'w') continue; blob(cx, cy, 2.2, 'm', seed * 5 + v * 31 + a); break; } }
  // vài tài nguyên gần phủ (bán kính 11–16) để ván đầu có chỗ đặt trại gỗ, mỏ đá, đồi
  blob(hx - 13, hy + 2, 3, 'f', seed + 5); blob(hx + 3, hy - 14, 3, 'f', seed + 9); blob(hx + 12, hy - 8, 2, 'r', seed + 13); blob(hx - 11, hy + 12, 2, 'r', seed + 17); blob(hx + 14, hy + 10, 3, 'h', seed + 21);
  // độ phì của đất 0,7–1,3 (KT §4)
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const q = T(x, y); let f = .72 + .56 * nzf(x * 1.3 + seed, y * 1.3);
    for (let j = -3; j <= 3 && f < 1.3; j++) for (let i = -3; i <= 3; i++) { const o = T(x + i, y + j); if (o && o.t === 'w') { f += .07; j = 9; break; } }
    q.fert = LT.clamp(f, .7, 1.3);
  }
};
// mọi ô đặt được của một công trình cần địa hình riêng; sắp theo khoảng cách tới phủ
LT.placeableTiles = function (G, k) {
  const d = B[k], out = []; if (!d || !d.need || d.need === 'road') return out;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const q = G.map[y * N + x]; if (q.b) continue; if (!LT.canPlace(G, k, x, y, true)) out.push({ x, y }); }
  out.sort((a, b) => Math.hypot(a.x - G.hx, a.y - G.hy) - Math.hypot(b.x - G.hx, b.y - G.hy)); return out;
};
LT.near = (G, x, y, t, r = 2) => { for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) { const q = tile(G, x + i, y + j); if (q && q.t === t) return true; } return false; };

// ---- tài nguyên / chi phí ---------------------------------------------------
LT.afford = (G, c) => Object.keys(c).every(k => (G.res[k] || 0) >= c[k]);
LT.pay = (G, c, k = 1, label) => { for (const r in c) { G.res[r] = Math.max(0, (G.res[r] || 0) - c[r] * k); if (LT.flowAdd) LT.flowAdd(G, r, -c[r] * k, label || 'Xây dựng'); } };
LT.count = (G, k) => { let n = 0; for (const b of G.bl) if (b.k === k && !b.building) n++; return n; };
LT.countAll = (G, k) => { let n = 0; for (const b of G.bl) if (b.k === k) n++; return n; };

LT.canPlace = function (G, k, x, y, free) {
  const q = tile(G, x, y); if (!q) return 'Ngoài bản đồ';
  if (k === 'del') return q.b && q.b.k !== 'hall' ? '' : 'Không có gì để phá';
  const d = B[k]; if (!d) return 'Công trình lạ';
  if (!free && d.rank && d.rank > G.rank) return 'Cần chức ' + LT.RANKS[d.rank].n + ' mới xây được';
  if (q.b) return 'Ô này đã có công trình';
  if (k === 'bridge') { if (q.t !== 'w') return 'Cầu chỉ bắc trên sông'; if (![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([i, j]) => { const o = tile(G, x + i, y + j); return o && isRoadLike(o.b); })) return 'Cầu phải nối với đường'; return free || LT.afford(G, d.c) ? '' : 'Thiếu vật liệu: ' + LT.costTxt(d.c); }
  if (q.t !== 'g' && !(q.t === 'h' && k !== 'farm')) return k === 'farm' ? 'Ruộng chỉ làm trên đất bằng' : 'Chỉ xây được trên đất trống hoặc đồi';
  if (d.need === 'road') { if (![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([i, j]) => { const o = tile(G, x + i, y + j); return o && isRoadLike(o.b); })) return 'Phải đặt sát đường'; }
  else if (d.need === 'h') { if (q.t !== 'h' && !LT.near(G, x, y, 'h', 1)) return 'Phải đặt trên hoặc sát đồi'; }
  else if (d.need === 'w3') { if (!LT.near(G, x, y, 'w', 3)) return 'Phải đặt trong 3 ô quanh nước'; }
  else if (d.need && !LT.near(G, x, y, d.need)) return d.need === 'f' ? 'Phải gần rừng' : d.need === 'r' ? 'Phải gần núi đá' : d.need === 'm' ? 'Phải gần mạch quặng sắt' : 'Phải gần nước';
  if (!free && !LT.afford(G, d.c)) return 'Thiếu vật liệu: ' + LT.costTxt(d.c);
  return '';
};

LT.laoDichBudget = G => Math.round((G.H ? LT.totalHo(G) : 100) * LT.LAO_DICH_TUAN_HO);

LT.place = function (G, k, x, y, opt) {
  opt = opt || {};
  const err = opt.free ? '' : LT.canPlace(G, k, x, y);
  if (err) return { ok: false, err };
  const q = tile(G, x, y);
  if (k === 'del') {
    const b = q.b; const bk = B[b.k];
    if (bk && bk.c) for (const r in bk.c) { const back = Math.floor(bk.c[r] * .5); G.res[r] = (G.res[r] || 0) + back; }
    G.bl.splice(G.bl.indexOf(b), 1); q.b = null; LT.recalcCity(G); return { ok: true, del: true, b };
  }
  const d = B[k];
  if (!opt.free) {
    LT.pay(G, d.c, 1, 'Xây ' + d.n);
    // một phần tiền xây chảy vào dân (mua công, vật liệu địa phương)
    if (d.c.tien) G.wealth += d.c.tien * .6;
    // lao dịch (KT §11)
    const lab = d.lab || 0, over = Math.max(0, G.lab.used + lab - G.lab.budget) - Math.max(0, G.lab.used - G.lab.budget);
    G.lab.used += lab;
    if (over > 0) {
      if (G.pol.laodich === 'phu') { const c = over * LT.THUE_PHU; G.res.tien = Math.max(0, G.res.tien - c); G.lab.hired += over; if (LT.flowAdd) LT.flowAdd(G, 'tien', -c, 'Thuê phu (quá hạn mức lao dịch)'); }
      else { G.lab.over += over; G.stat.dantam = Math.max(0, G.stat.dantam - over * .12); const m = LT.month(G.week); if (m <= 2 || m === 9) G.lab.busy = true; }
    }
  }
  const b = { id: G.nextId++, k, x, y, building: !opt.instant, progress: opt.instant ? 1 : 0, duration: d.dur || 12, prio: 1, staff: 0, sr: 0, conn: true, roadMul: 1, mode: null };
  if (k === 'forge') b.mode = 'nongcu'; if (k === 'armory') b.mode = 'binhkhi';
  if (k === 'farm') b.acc = 0;
  q.b = b; G.bl.push(b);
  if (opt.instant && !opt.defer) LT.recalcCity(G);
  return { ok: true, b };
};

// ---- tổng hộ ----------------------------------------------------------------
LT.totalHo = G => { let n = 0; for (const c of LT.CLASS_IDS) n += G.H[c] || 0; return n; };

// ---- tính lại: nối đường, nhân công, sức chứa, đầu vào chỉ số -------------------
LT.recalcCity = function (G) {
  const cx = G.hx, cy = G.hy;
  // 1) BFS theo đường từ mọi điểm kho (phủ, kho lương, phường thị)
  const dist = new Int16Array(N * N).fill(-1), queue = [];
  const sources = [];
  for (const b of G.bl) {
    if (b.building) continue;
    if (b.k === 'hall') sources.push({ x: b.x, y: b.y, w: 2, h: 2 });
    else if (b.k === 'granary' || b.k === 'market') sources.push({ x: b.x, y: b.y, w: 1, h: 1 });
  }
  for (const s of sources) for (let j = -1; j <= s.h; j++) for (let i = -1; i <= s.w; i++) {
    if ((i >= 0 && i < s.w) && (j >= 0 && j < s.h)) continue;
    if ((i < 0 || i >= s.w) && (j < 0 || j >= s.h)) continue; // bỏ góc chéo
    const q = tile(G, s.x + i, s.y + j);
    if (q && isRoadLike(q.b) && dist[(s.y + j) * N + s.x + i] < 0) { dist[(s.y + j) * N + s.x + i] = 0; queue.push([s.x + i, s.y + j]); }
  }
  for (let h = 0; h < queue.length; h++) {
    const [x, y] = queue[h], d0 = dist[y * N + x];
    for (const [i, j] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + i, ny = y + j, q = tile(G, nx, ny);
      if (q && isRoadLike(q.b) && dist[ny * N + nx] < 0) { dist[ny * N + nx] = d0 + 1; queue.push([nx, ny]); }
    }
  }
  G.roadDist = dist;
  for (const b of G.bl) {
    if (b.k === 'hall') continue;
    let conn = false, rm = 1, bestD = 99;
    for (const [i, j] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const q = tile(G, b.x + i, b.y + j); if (!q || !q.b) continue;
      if (q.b.k === 'pave' && !q.b.building || (q.b.k === 'gate' && !q.b.building)) rm = Math.max(rm, 1.35);
      else if (q.b.k === 'road' && !q.b.building) rm = Math.max(rm, 1.2);
      const dd = dist[(b.y + j) * N + b.x + i];
      if (dd >= 0 && dd < bestD) bestD = dd;
    }
    if (bestD <= LT.KHO_BAN_KINH) conn = true;
    // chính kho và chợ luôn tính là nối
    if (b.k === 'granary' || b.k === 'market') conn = conn || bestD <= LT.KHO_BAN_KINH;
    b.conn = conn; b.roadMul = rm; b.roadD = bestD < 99 ? bestD : -1;
  }
  // 2) nhân công: chia hộ từng tầng lớp cho công trình theo mức ưu tiên
  const order = (a, b) => (b.prio - a.prio) || (a.id - b.id);
  for (const c of ['nong', 'cong', 'thuong', 'si', 'tang']) {
    let avail = G.H[c] || 0;
    const list = G.bl.filter(b => !b.building && B[b.k] && B[b.k].job && B[b.k].job.c === c).sort(order);
    for (const b of list) { const need = B[b.k].job.n, a = Math.min(need, avail); b.staff = a; b.sr = a / need; avail -= a; }
    G.free[c] = avail;
  }
  for (const b of G.bl) if (b.building || !(B[b.k] && B[b.k].job)) { b.staff = 0; b.sr = b.building ? 0 : (B[b.k] && B[b.k].job ? 0 : 1); }
  for (const b of G.bl) b.on = !b.building && (B[b.k] && B[b.k].job ? b.sr > 0 : true);
  // 3) sức chứa nhà, thành phòng, vùng phủ
  let houses = 0, wallPts = 0, houseList = [], capRaw = 0;
  const svc = { well: [], watch: [], clinic: [], market: [] };
  for (const b of G.bl) {
    if (b.building) continue;
    if (LT.HOUSEK[b.k]) { houses++; houseList.push(b); capRaw += B[b.k].cap; }
    else if (b.k === 'wall') wallPts += 1.5; else if (b.k === 'gate') wallPts += 3; else if (b.k === 'tower') wallPts += 6; else if (b.k === 'beacon') wallPts += 3;
    if (b.k === 'well') svc.well.push(b);
    if ((b.k === 'watch' && b.sr > 0) || b.k === 'barracks') svc.watch.push(b);
    if (b.k === 'clinic' && b.sr > 0) svc.clinic.push(b);
    if (b.k === 'market') svc.market.push(b);
  }
  const R = { well: 6, watch: 7, clinic: 9, market: 10 };
  const cover = k => { if (!houseList.length) return 0; let n = 0; for (const h of houseList) if (svc[k].some(s => Math.max(Math.abs(s.x - h.x), Math.abs(s.y - h.y)) <= R[k])) n++; return n / houseList.length; };
  const hall = G.bl.find(b => b.k === 'hall');
  G.city = {
    houses, capRaw: capRaw + 20, cap: Math.min(capRaw + 20, LT.CITY_LEVELS[G.seatLvl || 1].cap),
    wallPts: wallPts + (LT.NATIONS[G.nation].mod.wall || 0),
    wellCover: cover('well'), watchCover: Math.min(1, cover('watch') + .15), clinicCover: cover('clinic'), marketCover: cover('market'),
    roads: LT.count(G, 'road'), paves: LT.count(G, 'pave'),
    farms: G.bl.filter(b => b.k === 'farm' && !b.building).length,
    hallX: hall ? hall.x : G.hx, hallY: hall ? hall.y : G.hy,
  };
  G.city.disconnected = G.bl.filter(b => !b.building && B[b.k] && (B[b.k].job || B[b.k].out) && !b.conn).length;
  // quan viên: 3 thuộc lại + 1 mỗi 2 sĩ làm việc (tối đa theo chức)
  const siW = G.bl.filter(b => b.k === 'school' && !b.building).reduce((n, b) => n + b.staff, 0) + G.bl.filter(b => b.k === 'clinic' && !b.building).reduce((n, b) => n + b.staff, 0);
  G.H.quan = Math.min(3 + Math.floor(siW / 2), 6 + G.rank * 4);
  G.stat.thanhphong = Math.min(100, Math.round(G.city.wallPts));
};

LT.irrigated = function (G, b) { // mương thủy lợi trong 3 ô
  for (const o of G.bl) if (o.k === 'canal' && !o.building && Math.hypot(o.x - b.x, o.y - b.y) <= 3.2) return true;
  return false;
};
})(typeof globalThis !== 'undefined' ? globalThis : window);

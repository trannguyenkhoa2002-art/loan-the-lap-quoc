// ============================================================================
// CHUNK (vùng 8×8 ô): chọn vùng trong khung nhìn và chữ ký thay đổi — LOGIC THUẦN, không DOM, chạy được trong Node.
// ============================================================================
(function (g) {
const LT = g.LT = g.LT || {};
const CH = LT.CH = 8, TW = 64, TH = 32;
LT.chunkGrid = N => Math.ceil(N / CH);
// lề (px ở tỉ lệ 1) quanh vùng diamond của lớp công trình: ngang, trên (công trình cao), dưới
LT.CHK_MARGIN = { x: 80, top: 205, bot: 40 };
const orderCache = {};
// thứ tự vẽ từ sau ra trước: cx+cy tăng dần, rồi cx
function order(N) {
  if (orderCache[N]) return orderCache[N];
  const gw = LT.chunkGrid(N), list = [];
  for (let cy = 0; cy < gw; cy++) for (let cx = 0; cx < gw; cx++) list.push(cy * gw + cx);
  list.sort((a, b) => { const ax = a % gw, ay = (a / gw) | 0, bx = b % gw, by = (b / gw) | 0; return (ax + ay) - (bx + by) || ax - bx; });
  return orderCache[N] = list;
}
// các vùng giao với khung nhìn W×H (có lề cho công trình cao). out: mảng tái dùng; trả về số vùng, thứ tự vẽ sau ra trước.
LT.visibleChunks = function (ox, oy, s, W, H, N, out, pad) {
  const gw = LT.chunkGrid(N), M = LT.CHK_MARGIN, ord = order(N), pd = pad || 0; let n = 0;
  const hw = TW / 2 * s, hh = TH / 2 * s;
  for (let k = 0; k < ord.length; k++) {
    const idx = ord[k], cx = idx % gw, cy = (idx / gw) | 0, x0 = cx * CH, y0 = cy * CH, x1 = Math.min(N, x0 + CH), y1 = Math.min(N, y0 + CH);
    const left = ox + (x0 - y1) * hw - M.x * s, right = ox + (x1 - y0) * hw + M.x * s, top = oy + (x0 + y0) * hh - M.top * s, bottom = oy + (x1 + y1) * hh + M.bot * s;
    if (right < -pd || left > W + pd || bottom < -pd || top > H + pd) continue;
    out[n++] = idx;
  }
  out.length = n; return n;
};
// chữ số loại công trình cho chữ ký
const kc = {}; let kn = 1; const kindCode = k => kc[k] || (kc[k] = kn++);
LT.kindCode = kindCode;
const isRoadK = k => k === 'road' || k === 'pave' || k === 'bridge';
const FARMK = { farm: 1, tea: 1, mulberry: 1, salt: 1, canal: 1 };
// Quét danh sách công trình một lần: dựng danh sách tĩnh/động mỗi vùng và chữ ký lớp mặt đất (sg), lớp vật thể (so).
// st = { sg:Int32Array, so:Int32Array, stat:[[]...], road:[[]...], dyn:[[]...], farm:Uint8Array }
LT.chunkScan = function (bl, N, T, st) {
  const gw = LT.chunkGrid(N), nC = gw * gw;
  st.sg.fill(0); st.so.fill(0); st.farm.fill(0);
  for (let i = 0; i < nC; i++) { st.stat[i].length = 0; st.road[i].length = 0; st.dyn[i].length = 0; }
  const mixG = (i, v) => { st.sg[i] = (Math.imul(st.sg[i] ^ v, 0x01000193) + 0x9e3779b9) | 0; };
  for (let j = 0; j < bl.length; j++) {
    const b = bl[j], x = b.x, y = b.y, cx = x >> 3, cy = y >> 3, i = cy * gw + cx, k = b.k;
    if (cx >= gw || cy >= gw) continue;
    const code = kindCode(k), road = isRoadK(k) || k === 'gate';
    const newborn = !road && b.born != null && T >= b.born && T - b.born < .35, dyn = !!b.building || newborn;
    const vg = b.id * 17 + code * 3 + (b.building ? 1 : 0) + (newborn ? 2 : 0) + (b.on ? 7 : 0);
    mixG(i, vg);
    // lớp mặt đất của vùng vẽ thêm một vòng ô của vùng bên cạnh (bóng đổ về −x,+y, đường): chữ ký cũng ảnh hưởng 8 vùng kề khi công trình nằm sát biên
    const lx = (x & 7) === 0 && cx > 0, rx = (x & 7) === 7 && cx < gw - 1, uy = (y & 7) === 0 && cy > 0, dy = (y & 7) === 7 && cy < gw - 1;
    if (lx) mixG(i - 1, vg); if (rx) mixG(i + 1, vg); if (uy) mixG(i - gw, vg); if (dy) mixG(i + gw, vg);
    if (lx && uy) mixG(i - gw - 1, vg); if (rx && uy) mixG(i - gw + 1, vg); if (lx && dy) mixG(i + gw - 1, vg); if (rx && dy) mixG(i + gw + 1, vg);
    if (k === 'hall') { st.dyn[i].push(b); st.stat[i].push(b); continue; }   // phủ: vẽ trực tiếp mỗi khung (rất rộng), nhưng vẫn đổ bóng ở lớp mặt đất
    if (dyn) { st.dyn[i].push(b); continue; }
    if (road) { st.road[i].push(b); continue; }
    st.stat[i].push(b);
    st.so[i] = (Math.imul(st.so[i] ^ (b.id * 17 + code * 3 + (b.on ? 7 : 0)), 0x01000193) + 0x7f4a7c15) | 0;
    if (FARMK[k]) st.farm[i] = 1;
  }
};
LT.newChunkState = function (N) {
  const gw = LT.chunkGrid(N), nC = gw * gw, mk = () => { const a = []; for (let i = 0; i < nC; i++) a.push([]); return a; };
  return { gw, sg: new Int32Array(nC), so: new Int32Array(nC), farm: new Uint8Array(nC), stat: mk(), road: mk(), dyn: mk() };
};
// tính chữ ký cuối cùng của một lớp (gộp các thành phần toàn cục)
LT.chunkSigG = (st, idx, gk) => (Math.imul(st.sg[idx], 31) ^ gk) | 0;
LT.chunkSigO = (st, idx, gk) => (Math.imul(st.so[idx], 31) ^ gk) | 0;
// chỉ số vùng chứa ô (x, y)
LT.chunkOf = (x, y, N) => { const gw = LT.chunkGrid(N); return Math.max(0, Math.min(gw - 1, y >> 3)) * gw + Math.max(0, Math.min(gw - 1, x >> 3)); };
})(typeof globalThis !== 'undefined' ? globalThis : window);

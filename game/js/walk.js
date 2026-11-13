'use strict';
// ============================================================================
// ĐƯỜNG ĐI HIỂN THỊ của dân đi bộ và giặc: chỉ đi trên đường hoặc ô trống, không bao giờ đi xuyên công trình.
// Logic thuần (không DOM) để kiểm trong Node. Không ảnh hưởng luật chơi hay bản lưu (chỉ vị trí vẽ).
// Di chuyển theo tâm ô (lưới 4 hướng) cộng lệch làn nhỏ (< 0,3 ô) nên luôn nằm trong ô hợp lệ.
// ============================================================================
(function (g) {
const LT = g.LT = g.LT || {};
const N = LT.N, NN = N * N;
const stamp = new Int32Array(NN), dist = new Float32Array(NN), prev = new Int32Array(NN); let cur = 0;
// ô đi được: đường / cầu / cổng đã xong, hoặc đất trống (cỏ, đồi); công trình, rừng, đá, nước thì không
LT.walkOK = (G, x, y, forest) => { const q = LT.tileAt(G, x, y); if (!q) return false; if (q.b) return LT.isRoadLike(q.b); return q.t === 'g' || q.t === 'h' || (!!forest && q.t === 'f'); };
const stepCost = (G, x, y) => { const q = G.map[y * N + x]; return q.b ? 1 : q.t === 'f' ? 3 : 1.8; };
// ô đi được gần nhất (xoắn ốc), bán kính R
LT.walkNearest = function (G, x, y, R, forest) {
  const cx = Math.floor(x), cy = Math.floor(y); let best = null, bd = 1e9;
  for (let r = 0; r <= R; r++) { for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) { if (Math.max(Math.abs(i), Math.abs(j)) !== r) continue; const px = cx + i, py = cy + j; if (!LT.walkOK(G, px, py, forest)) continue; const d = (px + .5 - x) * (px + .5 - x) + (py + .5 - y) * (py + .5 - y); if (d < bd) { bd = d; best = [px, py]; } } if (best && r >= 1) break; }
  return best;
};
// đường ngắn nhất (Dijkstra, 4 hướng, ưu tiên đường); trả mảng [x,y] không gồm ô xuất phát, hoặc null
LT.walkPath = function (G, sx, sy, gx, gy, limit, forest) {
  if (!LT.walkOK(G, sx, sy, forest) || !LT.walkOK(G, gx, gy, forest)) return null; if (sx === gx && sy === gy) return [];
  cur++; const hk = [], hv = []; let n = 0, expanded = 0;
  const push = (k, v) => { let i = n++; hk[i] = k; hv[i] = v; while (i > 0) { const p = (i - 1) >> 1; if (hk[p] <= hk[i]) break; [hk[p], hk[i]] = [hk[i], hk[p]]; [hv[p], hv[i]] = [hv[i], hv[p]]; i = p; } };
  const pop = () => { const v = hv[0], k = hk[0]; n--; if (n > 0) { hk[0] = hk[n]; hv[0] = hv[n]; let i = 0; for (;;) { let l = 2 * i + 1, r = l + 1, m = i; if (l < n && hk[l] < hk[m]) m = l; if (r < n && hk[r] < hk[m]) m = r; if (m === i) break; [hk[m], hk[i]] = [hk[i], hk[m]]; [hv[m], hv[i]] = [hv[i], hv[m]]; i = m; } } return [k, v]; };
  const s0 = sy * N + sx, goal = gy * N + gx; stamp[s0] = cur; dist[s0] = 0; prev[s0] = -1; push(0, s0);
  while (n > 0) {
    const [k, v] = pop(); if (k > dist[v] + 1e-6) continue; if (v === goal) break; if (++expanded > limit) return null;
    const x = v % N, y = (v / N) | 0;
    for (let d = 0; d < 4; d++) { const nx = x + (d === 0 ? 1 : d === 1 ? -1 : 0), ny = y + (d === 2 ? 1 : d === 3 ? -1 : 0); if (!LT.walkOK(G, nx, ny, forest)) continue; const w = ny * N + nx, c = k + stepCost(G, nx, ny); if (stamp[w] !== cur || c < dist[w]) { stamp[w] = cur; dist[w] = c; prev[w] = v; push(c, w); } }
  }
  if (stamp[goal] !== cur) return null; const out = []; for (let v = goal; v !== s0; v = prev[v]) out.push([v % N, (v / N) | 0]); out.reverse(); return out;
};
// trường đường đi từ MỘT đích: Dijkstra một lần cho cả vùng đi được; mỗi kẻ xuất phát chỉ việc theo con trỏ về đích
LT.walkField = function (G, gx, gy, forest) {
  if (!LT.walkOK(G, gx, gy, forest)) return null;
  cur++; const hk = [], hv = []; let n = 0; const reach = [];
  const push = (k, v) => { let i = n++; hk[i] = k; hv[i] = v; while (i > 0) { const p = (i - 1) >> 1; if (hk[p] <= hk[i]) break; [hk[p], hk[i]] = [hk[i], hk[p]]; [hv[p], hv[i]] = [hv[i], hv[p]]; i = p; } };
  const pop = () => { const v = hv[0], k = hk[0]; n--; if (n > 0) { hk[0] = hk[n]; hv[0] = hv[n]; let i = 0; for (;;) { let l = 2 * i + 1, r = l + 1, m = i; if (l < n && hk[l] < hk[m]) m = l; if (r < n && hk[r] < hk[m]) m = r; if (m === i) break; [hk[m], hk[i]] = [hk[i], hk[m]]; [hv[m], hv[i]] = [hv[i], hv[m]]; i = m; } } return [k, v]; };
  const goal = gy * N + gx; stamp[goal] = cur; dist[goal] = 0; prev[goal] = -1; push(0, goal);
  while (n > 0) {
    const [k, v] = pop(); if (k > dist[v] + 1e-6) continue; reach.push(v); const x = v % N, y = (v / N) | 0;
    for (let d = 0; d < 4; d++) { const nx = x + (d === 0 ? 1 : d === 1 ? -1 : 0), ny = y + (d === 2 ? 1 : d === 3 ? -1 : 0); if (!LT.walkOK(G, nx, ny, forest)) continue; const w = ny * N + nx, c = k + stepCost(G, nx, ny); if (stamp[w] !== cur || c < dist[w]) { stamp[w] = cur; dist[w] = c; prev[w] = v; push(c, w); } }
  }
  return { goal, prev: Int32Array.from(prev), reach: Int32Array.from(reach) };
};
// đường từ ô đi được gần (sx,sy) nhất trong vùng của đích, về tới đích: mảng [x,y]
LT.walkFieldPath = function (F, sx, sy) {
  if (!F) return null; let best = -1, bd = 1e18;
  for (let i = 0; i < F.reach.length; i++) { const v = F.reach[i], x = v % N + .5, y = ((v / N) | 0) + .5, d = (x - sx) * (x - sx) + (y - sy) * (y - sy); if (d < bd) { bd = d; best = v; } }
  if (best < 0) return null; const out = []; for (let v = best; v !== -1; v = F.prev[v]) out.push([v % N, (v / N) | 0]); return out;
};
// dân đi bộ: chọn đích quanh mình (ưu tiên đường), đi theo đường tìm được; rời ô không hợp lệ thì đặt lại về ô hợp lệ gần nhất
LT.walkStep = function (G, w, dt, run, rnd) {
  w.mv = false;
  if (w.lx == null) { w.lx = (rnd() - .5) * .46; w.ly = (rnd() - .5) * .46; }
  const tx0 = Math.floor(w.x), ty0 = Math.floor(w.y);
  if (!LT.walkOK(G, tx0, ty0)) { const nb = LT.walkNearest(G, w.x, w.y, 8); if (!nb) return; w.x = nb[0] + .5 + w.lx; w.y = nb[1] + .5 + w.ly; w.path = null; }
  if (!w.path || !w.path.length) {
    if (w.wait > 0) { w.wait -= dt; return; }
    let best = null;
    for (let n = 0; n < 7 && !best; n++) {
      const a = rnd() * 6.2832, r = 1 + rnd() * 4, nx = Math.floor(w.x + Math.cos(a) * r), ny = Math.floor(w.y + Math.sin(a) * r);
      if (Math.hypot(nx - G.hx - 1, ny - G.hy - 1) > 15 || !LT.walkOK(G, nx, ny)) continue;
      const road = !!G.map[ny * N + nx].b; if (!road && n < 4) continue;      // lượt đầu ưu tiên đích là đường
      const p = LT.walkPath(G, Math.floor(w.x), Math.floor(w.y), nx, ny, 500); if (p && p.length) best = p;
    }
    if (!best) { w.wait = 1.5 + rnd(); return; } w.path = best;
  }
  const t = w.path[0], px = t[0] + .5 + w.lx, py = t[1] + .5 + w.ly, dx = px - w.x, dy = py - w.y, d = Math.hypot(dx, dy);
  if (d < .04) { w.path.shift(); return; }
  const v = Math.min(d, dt * .8 * (run ? Math.max(1, Math.min(G.speed, 2)) : 0)); if (v <= 0) return;
  w.x += dx / d * v; w.y += dy / d * v; w.dx = dx / d; w.dy = dy / d; w.mv = true;
};
})(typeof globalThis !== 'undefined' ? globalThis : window);

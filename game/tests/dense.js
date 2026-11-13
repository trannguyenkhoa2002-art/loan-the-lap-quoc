// Dựng thành dày đặc (~1.200 công trình + đường lưới) để kiểm đường đi; dùng chung cho đo và test.
const path = require('path');
for (const f of ['data', 'city', 'chunks', 'economy', 'game', 'battle', 'politics', 'war', 'events', 'world', 'wcities', 'campaign', 'trade', 'officials', 'automgmt', 'power', 'ai', 'walk']) { try { require(path.join(__dirname, '..', 'js', f + '.js')); } catch (e) { if (f !== 'walk') throw e; } }
const LT = globalThis.LT;
function dense(n) {
  const G = LT.newGame(3, 'Dày', 77); G.rank = 4; G.res.go = G.res.da = G.res.tien = 1e7; G.res.luong = 1e6;
  const hx = G.hx, hy = G.hy, kinds = ['house', 'house', 'house', 'market', 'granary', 'well', 'watch', 'temple', 'school', 'terrace', 'clinic', 'barracks', 'tower', 'wall', 'farm', 'house', 'mansion', 'gate'];
  const R = 22; let ki = 0, placed = 0;
  for (let y = hy - R; y <= hy + R; y++) for (let x = hx - R; x <= hx + R; x++) { if (x < 1 || y < 1 || x >= LT.N - 1 || y >= LT.N - 1) continue; if ((x - hx) % 5 === 0 || (y - hy) % 5 === 0) { const r = LT.place(G, 'road', x, y, { free: true, instant: true }); if (r.ok) placed++; } }
  for (let y = hy - R; y <= hy + R && placed < n; y++) for (let x = hx - R; x <= hx + R && placed < n; x++) { if (x < 1 || y < 1) continue; const k = kinds[ki++ % kinds.length]; const r = LT.place(G, k, x, y, { free: true, instant: true }); if (r.ok) placed++; }
  for (const b of G.bl) if (b.building) { b.progress = 1; b.building = false; b.born = -9; }
  LT.recalcCity(G); return G;
}
// ô có công trình không phải đường/cổng/ruộng ("ô cấm" khi người đi bộ)
function bad(G, x, y) { const q = LT.tileAt(G, Math.floor(x), Math.floor(y)); if (!q) return true; if (q.b) return !(LT.isRoadLike(q.b) || q.b.k === 'farm'); return q.t !== 'g' && q.t !== 'h' && q.t !== 'w' && q.t !== undefined && (q.t === 'r' || q.t === 'm' || q.t === 'f'); }
module.exports = { LT, dense, bad };

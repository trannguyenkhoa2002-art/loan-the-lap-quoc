// Sửa lỗi hiển thị: (A) thứ tự che theo từng ô (kiểm bằng điểm ảnh trong trình duyệt: tests/bench-crowd.js __occTest) và
// (B) người/xe/giặc không đi xuyên công trình (kiểm ở đây, trong Node, trên thành ~1.200 công trình).
const fs = require('fs'), path = require('path');
const { LT, dense, bad } = require('./dense.js'); const N = LT.N;
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL  ' + m); } else console.log('  ok    ' + m); };
let seed = 777; const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const G = dense(1200), tile = (x, y) => LT.tileAt(G, x, y);
const bld = G.bl.filter(b => !LT.isRoad(b) && b.k !== 'gate' && b.k !== 'farm').length;

console.log('--- 1. Dân đi bộ không bao giờ đứng trong ô công trình (thành dày ' + G.bl.length + ' công trình, ' + bld + ' không phải đường/ruộng)');
{
  ok(typeof LT.walkStep === 'function' && typeof LT.walkPath === 'function', 'Có js/walk.js (logic thuần)');
  const WALK = []; for (let i = 0; i < 42; i++) WALK.push({ cls: 'luu', x: G.hx + 2.5 + (i % 3) * .3, y: G.hy + .5 + i * .2, ph: i * 1.7 });
  G.speed = 2; let steps = 0, viol = 0, moved = 0, onRoad = 0, offsMax = 0; const last = WALK.map(w => [w.x, w.y]);
  for (let k = 0; k < 6000; k++) {
    for (let i = 0; i < WALK.length; i++) {
      const w = WALK[i]; LT.walkStep(G, w, .1, true, rand); steps++;
      if (bad(G, w.x, w.y)) viol++;
      const q = tile(Math.floor(w.x), Math.floor(w.y)); if (q && q.b && LT.isRoadLike(q.b)) onRoad++;
      const d = Math.hypot(w.x - last[i][0], w.y - last[i][1]); moved += d; offsMax = Math.max(offsMax, d); last[i] = [w.x, w.y];
    }
  }
  console.log('   ' + steps + ' mẫu vị trí; trong ô cấm: ' + viol + '; đi trên đường ' + Math.round(onRoad / steps * 100) + '%; tổng quãng đường ' + Math.round(moved) + ' ô; bước dài nhất ' + offsMax.toFixed(3) + ' ô');
  ok(viol === 0, 'Dân đi bộ: 0 / ' + steps + ' mẫu trong ô công trình (trước khi sửa: 5.006 / 252.000 = 1,99%, 4.762 trong thân nhà)');
  ok(offsMax < .5 && moved > 500, 'Họ thật sự đi (' + Math.round(moved) + ' ô) và bước nhỏ (< 0,5 ô nên không nhảy qua ô nào)');
  ok(onRoad / steps > .4, 'Phần lớn đi trên đường (' + Math.round(onRoad / steps * 100) + '%)');
  // đặt lại khi công trình mới mọc lên đúng chỗ đang đứng
  const w = WALK[0]; const tx = Math.floor(w.x), ty = Math.floor(w.y); const q = tile(tx, ty); const saved = q.b; q.b = { k: 'house', x: tx, y: ty, building: false }; LT.walkStep(G, w, .1, true, rand); q.b = saved;
  ok(!bad(G, w.x, w.y) || (Math.floor(w.x) !== tx || Math.floor(w.y) !== ty), 'Công trình mọc lên dưới chân: người được dời sang ô trống gần nhất');
}

console.log('--- 2. Giặc đi theo đường ngắn nhất qua ô trống, không xuyên công trình');
{
  let total = 0, viol = 0, found = 0, none = 0, F = null, maxStart = 0;
  for (let side = 0; side < 4; side++) for (let i = 0; i < 10; i++) {
    const u = 8 + (i * 3.1 + side) % 30, sx = side === 0 ? u : side === 1 ? N - .5 : side === 2 ? u : .5, sy = side === 0 ? .5 : side === 1 ? u : side === 2 ? N - .5 : u;
    if (!F) F = LT.walkField(G, ...LT.walkNearest(G, G.hx + 1.5, G.hy + 3, 8, false), true); const path = LT.walkFieldPath(F, sx, sy);
    if (!path || path.length < 2) { none++; continue; } found++; const lx = (rand() - .5) * .4, ly = (rand() - .5) * .4;
    for (let a = 0; a < path.length - 1; a++) for (let t = 0; t < 1; t += .05) { const x = path[a][0] + .5 + lx + (path[a + 1][0] - path[a][0]) * t, y = path[a][1] + .5 + ly + (path[a + 1][1] - path[a][1]) * t; total++; const q = tile(Math.floor(x), Math.floor(y)); if (q && q.b && !LT.isRoadLike(q.b)) viol++; }
  }
  console.log('   ' + found + ' đường tìm được, ' + none + ' không có đường (đi thẳng như cũ); ' + total + ' mẫu dọc đường');
  ok(found >= 30 && viol === 0, 'Giặc: 0 / ' + total + ' mẫu trong ô công trình (trước khi sửa: 278 / 3.680 = 7,55%)');
}

console.log('--- 3. Đoàn xe, kỵ sĩ (traffic) chỉ đi trên ô đường');
{
  const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'render-build.js'), 'utf8'), a = src.indexOf('const traffic=[]'), b = src.indexOf('function horseBody');
  const rndf = i => { const x = Math.sin(i * 127.1 + 31.7) * 43758.5453; return x - Math.floor(x); };
  const mod = new Function('G', 'tile', 'isRoad', 'isBuilt', 'rnd', src.slice(a, b) + '\nreturn { traffic, updateTraffic };')(G, tile, LT.isRoad, LT.isBuilt, rndf);
  for (let i = 0; i < 400; i++) mod.updateTraffic(.1);
  let s2 = 0, v2 = 0; for (let k = 0; k < 8000; k++) { mod.updateTraffic(.1); for (const t of mod.traffic) { s2++; const q = tile(Math.floor(t.x), Math.floor(t.y)); if (!q || !q.b || !LT.isRoadLike(q.b)) v2++; for (const tr of (t.trail || [])) { const q2 = tile(Math.floor(tr.x), Math.floor(tr.y)); if (!q2 || !q2.b || !LT.isRoadLike(q2.b)) v2++; } } }
  console.log('   ' + mod.traffic.length + ' xe/ngựa đang chạy, ' + s2 + ' mẫu vị trí');
  ok(s2 > 1000 && v2 === 0, 'Xe, ngựa, kỵ sĩ và vệt đoàn xe: 0 mẫu ngoài ô đường (' + v2 + '); trước và sau như nhau vì logic này vốn đã bám đường');
}

console.log('--- 4. Thứ tự che theo ô: cấu trúc mã');
{
  const rc = fs.readFileSync(path.join(__dirname, '..', 'js', 'render-chunk.js'), 'utf8');
  ok(/function drawActor\(/.test(rc) && /destination-out/.test(rc) && /inFront\(/.test(rc), 'Người vẽ sau ảnh vùng rồi xoá phần bị vật đứng trước che (destination-out), theo luật từng ô');
  ok(!/dl\[j\]\.b\) dl\[j\]\.f\(\)/.test(rc), 'Không còn cách xen người theo vùng 8×8 (cờ "b")');
  console.log('   Kiểm điểm ảnh (trình duyệt): tests/bench-crowd.js → __occTest; số đo ghi trong báo cáo.');
}

console.log(fails ? '\n' + fails + ' KIỂM THỬ HỎNG' : '\nTẤT CẢ ĐẠT');
process.exit(fails ? 1 : 0);

// Kịch bản đo hiệu năng lặp lại được. Nạp bằng <script src="tests/bench-browser.js"> (hoặc dán vào console) SAU KHI ván đã bắt đầu.
//   await __benchSetup({ n: 1200, mode: 'high' });       // dựng một thành có n công trình (không tính đường), đợi vẽ xong
//   for (const op of ['idle','drag','wasd','zoom','settle']) console.log(op, JSON.stringify(await __benchOp(op)));
//   await __benchSig();                                    // chữ ký ảnh khi đứng yên (so trước/sau)
// Mỗi thao tác chạy ở một lệnh riêng, ngắn (khung nhúng bị ẩn sẽ hãm trình duyệt nếu chạy quá lâu một mạch).
// Mỗi khung: gọi draw() rồi ép canvas xả (getImageData 1 điểm) để thời gian gồm cả phần raster, không chỉ phần ghi lệnh.
// rAF của khung nhúng bị ẩn không chạy, nên đây là THỜI GIAN XỬ LÝ MỖI KHUNG (ms), không phải FPS màn hình thật.
(function () {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const flush = () => MAINCTX.getImageData(0, 0, 1, 1);
  const stat = a => { a = a.slice().sort((x, y) => x - y); const m = a.reduce((p, q) => p + q, 0) / a.length; return { avg: +m.toFixed(2), p50: +a[Math.floor(a.length * .5)].toFixed(2), p95: +a[Math.floor(a.length * .95)].toFixed(2), max: +a[a.length - 1].toFixed(2), n: a.length }; };
  const settle = async (maxMs) => { const t0 = performance.now(); if (typeof CK === 'undefined') { for (let i = 0; i < 260; i++) { draw(); flush(); await sleep(4); } return Math.round(performance.now() - t0); } for (let i = 0; i < 2000; i++) { draw(); flush(); if (i > 6 && (typeof CK === 'undefined' || (!CK.q.length && !JOB))) break; if (performance.now() - t0 > (maxMs || 25000)) break; await sleep(2); } return Math.round(performance.now() - t0); };
  const reset = async sc => { s = sc; ox = 0; oy = 0; if (typeof zT !== 'undefined') zT = null; centerHall(); T = 5; await sleep(260); return settle(); };
  let vts = 1e6;
  const run = async (frames, fn, gap) => {
    const t = []; let jf = 0, bm = 0, sp = null;
    for (let i = 0; i < frames; i++) { fn(i); T += .016; const a = performance.now(); draw(); flush(); const dt = performance.now() - a; t.push(dt); if (dt > 25) (sp = sp || []).push([i, +dt.toFixed(0), typeof CK !== 'undefined' ? CK.stepsFrame + '/' + CK.vis.length + '/' + CK.q.length : '']); vts += Math.max(16.7, dt); if (typeof perfFrame === 'function') perfFrame(vts, dt, 0); if (typeof CK !== 'undefined' && CK.stepsFrame > 0) { jf++; bm += CK.bakeMs; } await sleep(gap === undefined ? 16 : gap); }
    const r = stat(t); if (sp) r.over25 = sp.slice(0, 10); if (typeof CK !== 'undefined') { r.bakeFrames = jf; r.bakeMsAvg = jf ? +(bm / jf).toFixed(1) : 0; } return r;
  };
  window.__benchSetup = async function (opt) {
    opt = opt || {}; const n = opt.n || 1200;
    if (opt.mode && typeof setGfxMode === 'function') setGfxMode(opt.mode);
    if (typeof GFX !== 'undefined') GFX.auto = false;
    const kinds = ['house', 'house', 'house', 'house', 'farm', 'farm', 'market', 'granary', 'well', 'lumber', 'watch', 'temple', 'school', 'terrace', 'clinic', 'barracks', 'wall', 'tower'];
    G.rank = 4; G.res.go = G.res.da = G.res.tien = 1e6;
    const cells = []; for (let dy = -54; dy <= 54; dy++) for (let dx = -54; dx <= 54; dx++) cells.push([dx, dy, Math.hypot(dx, dy)]); cells.sort((a, b) => a[2] - b[2]);
    let placed = 0, roads = 0;
    for (const [dx, dy] of cells) {
      if (placed >= n) break; const x = G.hx + dx, y = G.hy + dy;
      if (dx % 4 === 0 || dy % 4 === 0) { if (!LT.canPlace(G, 'road', x, y, true)) { LT.place(G, 'road', x, y, { free: true, instant: true, defer: true }); roads++; } continue; }
      const k = kinds[(Math.abs(dx) * 7 + Math.abs(dy) * 3) % kinds.length];
      if (!LT.canPlace(G, k, x, y, true)) { LT.place(G, k, x, y, { free: true, instant: true, defer: true }); placed++; }
    }
    LT.recalcCity(G); if (typeof paintTiles === 'function') paintTiles();
    G.speed = 0; WALK.length = 0; traffic.splice(0); FL.length = 0; hover = null; G.tool = null; T = 5;
    const primeMs = await reset(1.05);
    return { n: placed, roads, buildings: G.bl.length, mode: window.__gfx || 'cũ', dpr: DPR, W, H, primeMs, chunks: typeof CK !== 'undefined' ? { baked: CK.L.filter(c => c).length, mb: +(CK.bytes / 1048576).toFixed(1) } : null };
  };
  window.__benchOp = async function (op) {
    if (op === 'idle') { await reset(1.05); return run(60, () => { }, 0); }
    if (op === 'drag') { await reset(1.05); return run(90, i => { ox -= 9; oy += 4; }); }
    if (op === 'wasd') { await reset(1.05); return run(90, i => { ox -= 14 * (i % 40 < 20 ? 1 : -1); }); }
    if (op === 'zoom') {   // xa nhất -> gần nhất -> xa nhất, quanh giữa màn hình; mỗi khung nhân 1,06 (có làm mượt nếu có zoomStep)
      await reset(.3); let dir = 1;
      const r = await run(130, i => { if (s >= 2.5) dir = -1; if (s <= .32) dir = 1; zoom(dir > 0 ? 1.06 : 1 / 1.06, W / 2, H / 2); if (typeof zoomStep === 'function') zoomStep(.016); });
      r.zoomEnd = +s.toFixed(2); return r;
    }
    if (op === 'settle') {  // sau khi ngừng zoom: các khung kế tiếp (vẽ lại sắc nét ở tỉ lệ mới)
      await reset(.3); await run(26, i => { zoom(1.06, W / 2, H / 2); if (typeof zoomStep === 'function') zoomStep(.016); });
      for (let i = 0; i < 40; i++) { if (typeof zoomStep === 'function') zoomStep(.05); }
      await sleep(300); const f = [], t0 = performance.now(); let n = 0;
      while (n < 400) { T += .016; const a = performance.now(); draw(); flush(); f.push(+(performance.now() - a).toFixed(1)); n++; if (typeof CK !== 'undefined' && !CK.q.length && !JOB) break; if (typeof CK === 'undefined' && n >= 12) break; await sleep(16); }
      return { frames: f.length, worst: Math.max(...f), first8: f.slice(0, 8), toSharpMs: Math.round(performance.now() - t0), s: +s.toFixed(2) };
    }
    return null;
  };
  // chữ ký ảnh khi đứng yên (lưới 64×36 điểm, RGB) ở vài mức zoom
  window.__benchSig = async function () {
    const sig = {};
    for (const sc of [.45, .7, 1.05, 1.6, 2.4]) { await reset(sc); T = 5; draw(); const gw = 64, gh = 36, d = MAINCTX.getImageData(0, 0, cv.width, cv.height).data, row = cv.width * 4, arr = []; for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) { const px = Math.floor((gx + .5) * cv.width / gw), py = Math.floor((gy + .5) * cv.height / gh), i = py * row + px * 4; arr.push(d[i], d[i + 1], d[i + 2]); } sig[sc] = arr; }
    window.__sig = sig; return Object.keys(sig);
  };
  window.__sigDiff = function (a, b) { const r = {}; for (const k in a) { let s = 0, mx = 0; for (let i = 0; i < a[k].length; i++) { const d = Math.abs(a[k][i] - b[k][i]); s += d; mx = Math.max(mx, d); } r[k] = { mean: +(s / a[k].length).toFixed(2), max: mx }; } return r; };
})();
// lặp một thao tác k lần, trả về trung vị từng chỉ số (đỡ nhiễu của khung nhúng): __benchRep('zoom', 3)
window.__benchRep = async function (op, k) {
  const runs = []; for (let i = 0; i < (k || 3); i++) runs.push(await window.__benchOp(op));
  const med = key => { const a = runs.map(r => r[key]).filter(v => typeof v === 'number').sort((x, y) => x - y); return a.length ? a[Math.floor(a.length / 2)] : null; };
  const o = { op, reps: runs.length }; for (const key of ['avg', 'p50', 'p95', 'max', 'worst', 'toSharpMs', 'frames']) { const v = med(key); if (v != null) o[key] = v; }
  o.maxAll = Math.max(...runs.map(r => r.max || r.worst || 0)); return o;
};

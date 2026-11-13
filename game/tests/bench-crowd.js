// Đo hiệu năng cảnh phố đông nhất (người, ngựa, xe, giặc): nạp bằng <script src="tests/bench-crowd.js"> khi đã vào ván.
//   __crowdSetup();                        // dựng phố, nhà, đường, ~42 dân + lính + xe + giặc, đưa vào khung nhìn
//   await __crowdBench('idle'|'pan'|'zoom') // trả { avg, p50, p95, max } (ms xử lý mỗi khung, gồm cả raster)
//   __lineup(['nong','cong',...], scale)   // xếp hàng các loại người đứng yên để chụp cận cảnh
(function () {
  const flush = () => MAINCTX.getImageData(0, 0, 1, 1);
  const stat = a => { a = a.slice().sort((x, y) => x - y); const m = a.reduce((p, q) => p + q, 0) / a.length; return { avg: +m.toFixed(2), p50: +a[Math.floor(a.length * .5)].toFixed(2), p95: +a[Math.floor(a.length * .95)].toFixed(2), max: +a[a.length - 1].toFixed(2), n: a.length }; };
  const view = (sc, cx, cy) => { s = sc; if (typeof zT !== 'undefined') zT = null; ox = W / 2 - (cx - cy) * 32 * s; oy = H / 2 - (cx + cy) * 16 * s; };
  window.__crowdView = view;
  window.__crowdSetup = function () {
    const g = LT.newGame(3, 'Đông', 77); g.rank = 4; LT.grantCities(g, 4, 1, 2); g.res.tien = 6000; g.res.go = 3000; g.res.da = 3000;
    g.units = [{ id: 1, type: 'truongthuong', n: 900, hl: 55, sk: 70, tb: 2, tan: 0 }, { id: 2, type: 'cung', n: 900, hl: 55, sk: 70, tb: 2, tan: 0 }]; g.nextId = 10;
    startGame(g, true); const st = document.getElementById('start'); if (st) st.style.display = 'none'; closeModal(); UI.overShown = false; perfSet(false);
    const hx = G.hx, hy = G.hy;
    for (let i = -10; i <= 14; i++) for (const [a, b] of [[hx + 2 + i, hy + 3], [hx + 3, hy + 2 + i], [hx + 2 + i, hy + 9], [hx + 9, hy + 2 + i]]) LT.place(G, 'road', a, b, { free: true, instant: true });
    for (let i = 0; i < 9; i++) for (const [a, b] of [[hx + 4 + i, hy + 4], [hx + 4 + i, hy + 7], [hx + 10, hy + 4 + i]]) LT.place(G, 'house', a, b, { free: true, instant: true });
    for (const b of G.bl) if (b.building) { b.progress = 1; b.building = false; b.born = -9; }
    LT.recalcCity(G); G.H.nong = 120; G.H.cong = 50; G.H.thuong = 60; G.H.si = 30; G.H.tang = 20; G.H.quan = 20; G.H.luu = 80; syncWalkers();
    // dân đi quanh phủ trên đường
    WALK.forEach((w, i) => { w.x = hx + 2.5 + (i * 0.7) % 9; w.y = hy + 3.5 + (i % 3) * 3; w.tx = w.x; w.ty = w.y; });
    for (let i = 0; i < 400; i++) updateTraffic(.1);
    G.raid = { side: 0, total: 250, t: 3, t0: 3, name: 'Giặc cỏ' };
    view(1.0, hx + 6, hy + 6); G.speed = 2; return { walkers: WALK.length, traffic: traffic.length };
  };
  window.__lineup = function (list, sc, y0) {
    y0 = y0 == null ? G.hy + 9.5 : y0; WALK.length = 0; G.speed = 0; G.raid = null;
    list.forEach((c, i) => { const x = G.hx + 2.2 + i * 1.15; WALK.push({ cls: c, x, y: y0, tx: x, ty: y0, ph: i * 1.7 }); });
    view(sc || 2.6, G.hx + 2.2 + (list.length - 1) / 2 * 1.15, y0);
  };
  // bảng mẫu: mỗi hàng một loại, các cột = đứng, đi khung 0/2/4 (mặt), đi lưng, đi hướng trái; để xem cận cảnh bằng ảnh chụp
  window.__sheet = function (kinds, v, sc) {
    sc = sc || 2.4; let cv2 = document.getElementById('sheet'); if (!cv2) { cv2 = document.createElement('canvas'); cv2.id = 'sheet'; cv2.style.cssText = 'position:fixed;left:0;top:0;z-index:200;background:#7f9a62'; document.body.appendChild(cv2); }
    cv2.width = innerWidth; cv2.height = innerHeight; cv2.style.width = innerWidth + 'px'; cv2.style.height = innerHeight + 'px'; const c = cv2.getContext('2d'); c.fillStyle = '#86a068'; c.fillRect(0, 0, cv2.width, cv2.height);
    const s0 = s, ox0 = ox, oy0 = oy; s = sc; ox = 0; oy = 0; const cols = [[0, 0, 1, 0, 0], [1, 0, 1, 0, 1], [2, 0, 1, 0, 1], [3, 0, 1, 0, 1], [4, 0, 0, -1, 1], [5, 1, 0, 1, 1]];  // [khung, ?, dx, dy, moving]
    const rowH = Math.floor((cv2.height - 20) / kinds.length), colW = Math.floor(cv2.width / 6);
    kinds.forEach((k, r) => cols.forEach((cc, ci) => { const px = ci * colW + colW / 2, py = r * rowH + rowH - 16; const x = (px / (32 * s) + py / (16 * s)) / 2, y = (py / (16 * s) - px / (32 * s)) / 2; const f = cc[0]; FIGS.draw(k, v == null ? 0 : v, x, y, cc[2], cc[3], cc[4] ? (f + .02) / 6 * 6.2832 : 0, !!cc[4], c); c.fillStyle = '#0006'; c.font = '10px sans-serif'; if (ci === 0) c.fillText(k + ' v' + (v || 0), 4, r * rowH + 12); }));
    s = s0; ox = ox0; oy = oy0; return 'sheet ' + kinds.join(',');
  };
  window.__sheetOff = () => { const c = document.getElementById('sheet'); if (c) c.remove(); };
  window.__crowdBench = async function (op, frames) {
    frames = frames || 90; const t = []; G.speed = 2; const cx = G.hx + 6, cy = G.hy + 6; view(op === 'zoom' ? 1.0 : 1.2, cx, cy);
    for (let i = 0; i < 20; i++) { draw(); flush(); }
    for (let i = 0; i < frames; i++) {
      T += .016; stepWalkers(.016); updateTraffic(.016);
      if (op === 'pan') { ox += (i % 60 < 30 ? 6 : -6); } else if (op === 'zoom') { s = 1.0 + 1.6 * (.5 - .5 * Math.cos(i / frames * Math.PI * 2)); }
      const a = performance.now(); draw(); flush(); t.push(performance.now() - a);
    }
    G.speed = 0; return stat(t);
  };
})();

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
  // thành dày ~n công trình + đường lưới (giống tests/_dense.js)
  window.__denseSetup = function (n) {
    const g = LT.newGame(3, 'Dày', 77); g.rank = 4; g.res.go = g.res.da = g.res.tien = 1e7; g.res.luong = 1e6;
    startGame(g, true); const st = document.getElementById('start'); if (st) st.style.display = 'none'; closeModal(); UI.overShown = false; perfSet(false);
    const hx = G.hx, hy = G.hy, kinds = ['house', 'house', 'house', 'market', 'granary', 'well', 'watch', 'temple', 'school', 'terrace', 'clinic', 'barracks', 'tower', 'wall', 'farm', 'house', 'mansion', 'gate'], R = 22; let ki = 0, placed = 0;
    for (let y = hy - R; y <= hy + R; y++) for (let x = hx - R; x <= hx + R; x++) { if (x < 1 || y < 1 || x >= N - 1 || y >= N - 1) continue; if ((x - hx) % 5 === 0 || (y - hy) % 5 === 0) { if (LT.place(G, 'road', x, y, { free: true, instant: true }).ok) placed++; } }
    for (let y = hy - R; y <= hy + R && placed < n; y++) for (let x = hx - R; x <= hx + R && placed < n; x++) { if (x < 1 || y < 1) continue; if (LT.place(G, kinds[ki++ % kinds.length], x, y, { free: true, instant: true }).ok) placed++; }
    for (const b of G.bl) if (b.building) { b.progress = 1; b.building = false; b.born = -9; }
    LT.recalcCity(G); WALK.length = 0; traffic.length = 0; G.raid = null; G.speed = 0; view(1.7, hx + 3, hy + 3); return G.bl.length;
  };
  // kiểm thứ tự che: mỗi ca đặt MỘT người đứng yên ở ô trống/đường, so điểm ảnh thật với "đáp án" dựng từ mặt nạ riêng của người và từng công trình đứng trước.
  window.__occTest = async function (count, sc, seed, pts, centre) {
    const anim0 = GFX.anim, ms0 = GFX.animMs; GFX.anim = 0; GFX.animMs = 0; T = 5;   // tắt hoạt hoạ để ảnh nền không đổi giữa các lần chụp
    view(sc, centre ? centre[0] : G.hx + 3, centre ? centre[1] : G.hy + 3); WALK.length = 0; traffic.length = 0; G.raid = null; G.speed = 0;
    for (let i = 0, calm = 0; i < 1200 && calm < 12; i++) { draw(); calm = (CK.bakesFrame === 0 && !JOB && CK.q.length === 0 && CK.vis.every(i => { const c = CK.L[i]; return c && (!c.o || c.o.empty || Math.abs(c.o.s - quantS(s)) < 1e-6); })) ? calm + 1 : 0; if (i % 30 === 29) await new Promise(r => setTimeout(r, 0)); }
    draw(); const base = MAINCTX.getImageData(0, 0, cv.width, cv.height), CW = cv.width;
    const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
    const rule = (fx, fy, x, y, w, d) => fx < x + w && fy < y + d && (fx < x || fy < y), cases = [];
    let rs = (seed || 1) * 9301 + 49297; const rn = () => { rs = (rs * 9301 + 49297) % 233280; return rs / 233280; };
    let tries = 0;
    const forced = pts ? pts.slice() : null;
    while ((forced ? forced.length : cases.length < count) && tries++ < count * 40 + 40) {
      const fp = forced ? forced.shift() : null, tx = fp ? Math.floor(fp[0]) : G.hx - 18 + Math.floor(rn() * 40), ty = fp ? Math.floor(fp[1]) : G.hy - 18 + Math.floor(rn() * 40), q = tile(tx, ty); if (!fp && (!q || (q.b && !isRoad(q.b)) || (q.t !== 'g' && !isRoad(q.b)))) continue;
      let ok = true; if (!fp) for (let j = -1; j <= 4 && ok; j++) for (let i = -1; i <= 4; i++) { const u = tile(tx + i, ty + j); if (u && (u.t === 'f' || u.t === 'r' || u.t === 'm' || (u.t === 'h' && !u.b))) { ok = false; break; } } if (!ok) continue;
      const fx = fp ? fp[0] : tx + .3 + rn() * .4, fy = fp ? fp[1] : ty + .3 + rn() * .4, p = P(fx, fy);
      if (!fp && (p.x < 330 || p.x > W - 330 || p.y < 160 || p.y > H - 120)) continue;
      const rx = Math.floor((p.x - 26 * sc) * DPR), ry = Math.floor((p.y - 64 * sc) * DPR), rw = Math.ceil(52 * sc * DPR), rh = Math.ceil(70 * sc * DPR);
      // đáp án
      const ca = mk(rw, rh), xa = ca.getContext('2d'); xa.setTransform(DPR, 0, 0, DPR, -rx, -ry);
      WALK.length = 0; WALK.push({ cls: 'nong', x: fx, y: fy, ph: 0 }); const w0 = WALK[0]; w0.fk = 'nong'; w0.fv = 1; w0._c = 'nong';
      FIGS.draw('nong', 1, fx, fy, 1, 0, 0, false, xa); const ma = xa.getImageData(0, 0, rw, rh).data;
      const mb = new Uint8Array(rw * rh); let nOcc = 0, kinds = null;
      for (const b of G.bl) { if (b.building || isRoad(b) || b.k === 'gate') continue; const bw = b.w || 1, bd = b.h || 1; if (!rule(fx, fy, b.x, b.y, bw, bd)) continue; if (b.x - fx > 9 || b.y - fy > 9) continue;
        const cb = mk(rw, rh), xb = cb.getContext('2d'); xb.setTransform(DPR, 0, 0, DPR, -rx, -ry);
        const sc0 = ctx, sG = GLOW, sZ = ZM; ctx = xb; GLOW = []; ZM = false; try { if (b.k === 'hall') drawHall(); else drawB(b); } finally { ctx = sc0; GLOW = sG; ZM = sZ; }
        const d = xb.getImageData(0, 0, rw, rh).data; let ov = 0; for (let i = 0; i < rw * rh; i++) if (d[i * 4 + 3] > 40) { if (!mb[i]) nOcc++; mb[i] = 1; if (ma[i * 4 + 3] >= 140) ov++; } if (ov > 3) (kinds = kinds || []).push(b.k + '@' + b.x + ',' + b.y + ' ' + bw + 'x' + bd); }
      draw(); const ob = MAINCTX.getImageData(rx, ry, rw, rh).data; let tot = 0, bad = 0, exHide = 0;
      for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) { const k = j * rw + i; if (ma[k * 4 + 3] < 140) continue; tot++; const bi = ((ry + j) * CW + rx + i) * 4, diff = Math.abs(ob[k * 4] - base.data[bi]) + Math.abs(ob[k * 4 + 1] - base.data[bi + 1]) + Math.abs(ob[k * 4 + 2] - base.data[bi + 2]); const shown = diff > 14, expect = !mb[k]; if (!expect) exHide++; if (shown !== expect) bad++; }
      if (tot > 30) cases.push({ tx, ty, tot, bad, exHide, kinds, fx: +fx.toFixed(2), fy: +fy.toFixed(2) });
    }
    GFX.anim = anim0; GFX.animMs = ms0; WALK.length = 0; const n = cases.length, withOcc = cases.filter(c => c.exHide > 4), badc = cases.filter(c => c.bad / c.tot > .06), badOcc = withOcc.filter(c => c.bad / c.tot > .06);
    return { cases: n, mismatchPx: +(cases.reduce((a, c) => a + c.bad, 0) / Math.max(1, cases.reduce((a, c) => a + c.tot, 0)) * 100).toFixed(2), casesWithOcclusion: withOcc.length, casesWrong: badc.length, wrongWhenOccluded: badOcc.length, wrongWhenFree: badc.length - badOcc.length, list: badc.slice(0, 10) };
  };
  // đặt 6 người đứng yên quanh một công trình loại k (sau, trái-sau, trước, phải, chéo trước, chéo sau) để chụp ảnh kiểm thứ tự che
  window.__around = function (k, sc, nth) {
    const list = G.bl.filter(b => b.k === k && !b.building).sort((a, b) => Math.hypot(a.x - G.hx - 6, a.y - G.hy - 6) - Math.hypot(b.x - G.hx - 6, b.y - G.hy - 6)); const b = list[nth || 0]; if (!b) return 'không có ' + k;
    const w = b.w || 1, d = b.h || 1, pts = [[b.x + w / 2, b.y - .45, 'nong'], [b.x - .45, b.y + d / 2, 'quan'], [b.x + w / 2, b.y + d + .45, 'binh'], [b.x + w + .45, b.y + d / 2, 'thuong'], [b.x + w + .45, b.y + d + .45, 'si'], [b.x - .45, b.y - .45, 'tang']];
    WALK.length = 0; traffic.length = 0; G.raid = null; G.speed = 0; pts.forEach(([x, y, c], i) => WALK.push({ cls: c, x, y, ph: i, tx: x, ty: y })); view(sc, b.x + w / 2, b.y + d / 2); return k + ' ở (' + b.x + ',' + b.y + ') ' + w + 'x' + d;
  };
  window.__settle = async function () { for (let i = 0, calm = 0; i < 1200 && calm < 12; i++) { draw(); calm = (CK.bakesFrame === 0 && !JOB && CK.q.length === 0 && CK.vis.every(i => { const c = CK.L[i]; return c && (!c.o || c.o.empty || Math.abs(c.o.s - quantS(s)) < 1e-6); })) ? calm + 1 : 0; if (i % 30 === 29) await new Promise(r => setTimeout(r, 0)); } return 'settled'; };
  // đặt một công trình loại k riêng lẻ trên bãi cỏ trống (9×9) để kiểm thứ tự che quanh công trình cao; trả về [x,y]
  window.__isolated = function (k) {
    for (let r = 14; r < 50; r++) for (let a = 0; a < 40; a++) { const x = Math.round(G.hx + 1 + Math.cos(a / 40 * 6.283 + r) * r), y = Math.round(G.hy + 1 + Math.sin(a / 40 * 6.283 + r) * r); let ok = x > 6 && y > 6 && x < N - 6 && y < N - 6; for (let j = -4; ok && j <= 4; j++) for (let i = -4; i <= 4; i++) { const q = tile(x + i, y + j); if (!q || q.b || q.t !== 'g') { ok = false; break; } }
      if (ok) { const rr = LT.place(G, k, x, y, { free: true, instant: true }); if (rr.ok) { rr.b.building = false; LT.recalcCity(G); return [x, y]; } } }
    return null;
  };
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

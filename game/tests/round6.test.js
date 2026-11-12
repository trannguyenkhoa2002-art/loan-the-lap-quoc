// Giai đoạn 1 (hiệu năng): chọn vùng (chunk) theo khung nhìn, chữ ký thay đổi, và bản lưu không đổi.
const path = require('path');
for (const f of ['data', 'city', 'chunks', 'economy', 'game', 'battle', 'politics', 'war', 'events', 'world', 'wcities', 'campaign', 'trade', 'officials', 'automgmt', 'power']) require(path.join(__dirname, '..', 'js', f + '.js'));
const LT = globalThis.LT; let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL  ' + m); } else console.log('  ok    ' + m); };
const N = LT.N, CH = LT.CH, GW = LT.chunkGrid(N), TW = 64, TH = 32;
const P = (ox, oy, s, x, y) => ({ x: ox + (x - y) * TW / 2 * s, y: oy + (x + y) * TH / 2 * s });

console.log('--- 1. Chọn vùng theo khung nhìn');
{
  ok(CH === 8 && GW === Math.ceil(N / CH), 'Vùng 8×8 ô, lưới ' + GW + '×' + GW + ' vùng cho bản đồ ' + N + '×' + N);
  let bad = 0, cases = 0, maxVis = 0, minVis = 1e9, orderBad = 0;
  const out = [];
  for (const s of [.28, .45, .7, 1.05, 1.6, 2.6]) for (let k = 0; k < 40; k++) {
    const W = 1280, H = 720, ox = -3000 + 6000 * ((k * 0.6180339) % 1), oy = -1500 + 4500 * ((k * 0.7548776) % 1);
    const n = LT.visibleChunks(ox, oy, s, W, H, N, out); cases++; maxVis = Math.max(maxVis, n); minVis = Math.min(minVis, n);
    const set = new Set(out);
    // mọi ô nằm trong khung nhìn phải thuộc một vùng được chọn
    for (let y = 0; y < N; y += 3) for (let x = 0; x < N; x += 3) { const p = P(ox, oy, s, x + .5, y + .5); if (p.x >= 0 && p.x <= W && p.y >= 0 && p.y <= H) { if (!set.has((y >> 3) * GW + (x >> 3))) bad++; } }
    // thứ tự vẽ từ sau ra trước: cx+cy không giảm
    for (let i = 1; i < out.length; i++) { const a = out[i - 1], b = out[i]; if ((a % GW + ((a / GW) | 0)) > (b % GW + ((b / GW) | 0))) orderBad++; }
    // vùng cách xa khung nhìn thì không được chọn (so với mép diamond của vùng + lề)
    for (let idx = 0; idx < GW * GW; idx++) { const cx = idx % GW, cy = (idx / GW) | 0; const p = P(ox, oy, s, cx * CH + CH / 2, cy * CH + CH / 2); if ((p.x < -2500 * s - 400 || p.x > W + 2500 * s + 400 || p.y < -1500 * s - 400 || p.y > H + 1500 * s + 400) && set.has(idx)) bad++; }
  }
  ok(bad === 0, cases + ' khung nhìn × 6 mức zoom: mọi ô thấy được đều có vùng, không chọn vùng xa vô lý');
  ok(orderBad === 0, 'Thứ tự vùng từ sau ra trước (cx+cy tăng dần)');
  ok(maxVis <= GW * GW && minVis >= 0, 'Số vùng chọn trong khoảng ' + minVis + '–' + maxVis + ' / ' + GW * GW);
  const full = []; const nAll = LT.visibleChunks(50000, 0, .28, 100000, 100000, N, full); ok(nAll === GW * GW, 'Khung nhìn khổng lồ chọn đủ ' + nAll + ' vùng');
  const none = []; ok(LT.visibleChunks(1e7, 1e7, 1, 1280, 720, N, none) === 0, 'Khung nhìn ngoài bản đồ không chọn vùng nào');
  const pa = [], pb = []; const a = LT.visibleChunks(-500, -200, 1.05, 1280, 720, N, pa), b = LT.visibleChunks(-500, -200, 1.05, 1280, 720, N, pb, 360); ok(b >= a && pa.every(i => pb.indexOf(i) >= 0), 'Vùng vẽ sẵn (lề 360 px) bao gồm toàn bộ vùng đang thấy (' + a + ' → ' + b + ')');
}

console.log('--- 2. Chữ ký thay đổi theo vùng');
{
  const G = LT.newGame(7, 'Chunk', 21); const st = LT.newChunkState(N); const T = 100;
  const scan = () => { LT.chunkScan(G.bl, N, T, st); return { sg: Array.from(st.sg), so: Array.from(st.so) }; };
  const base = scan();
  const diffIdx = (a, b) => { const r = []; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) r.push(i); return r; };
  const chunkAt = (x, y) => (y >> 3) * GW + (x >> 3);
  // đặt một nhà giữa vùng: chỉ vùng đó đổi chữ ký
  const x = G.hx - 20 + 3, y = G.hy - 20 + 3; ok(!LT.canPlace(G, 'house', x, y, true), 'Ô thử đặt nhà hợp lệ');
  const r1 = LT.place(G, 'house', x, y, { free: true, instant: true, defer: true }); const s1 = scan();
  const dg = diffIdx(base.sg, s1.sg), dobj = diffIdx(base.so, s1.so);
  ok(dg.length === 1 && dg[0] === chunkAt(x, y) && dobj.length === 1 && dobj[0] === chunkAt(x, y), 'Đặt nhà giữa vùng: chỉ vùng ' + chunkAt(x, y) + ' đổi chữ ký (mặt đất và vật thể)');
  // đặt sát biên: vùng kề cũng đổi lớp mặt đất (bóng đổ về −x,+y) nhưng không đổi lớp vật thể
  let bx = -1, by = -1; for (let yy = G.hy - 30; yy < G.hy + 30 && bx < 0; yy++) for (let xx = G.hx - 30; xx < G.hx + 30; xx++) if ((xx & 7) === 0 && (yy & 7) === 7 && !LT.canPlace(G, 'house', xx, yy, true)) { bx = xx; by = yy; break; }
  const s2 = scan(); LT.place(G, 'house', bx, by, { free: true, instant: true, defer: true }); const s3 = scan();
  const dg2 = diffIdx(s2.sg, s3.sg), do2 = diffIdx(s2.so, s3.so);
  ok(dg2.length >= 3 && dg2.indexOf(chunkAt(bx, by)) >= 0 && dg2.indexOf(chunkAt(bx - 1, by)) >= 0 && dg2.indexOf(chunkAt(bx, by + 1)) >= 0 && do2.length === 1, 'Đặt nhà ở góc vùng: ' + dg2.length + ' vùng đổi lớp mặt đất (vùng chứa + các vùng kề chịu bóng), chỉ 1 vùng đổi lớp vật thể');
  // phá: chữ ký trở lại như trước
  LT.place(G, 'del', bx, by, { free: true }); LT.place(G, 'del', x, y, { free: true }); const s4 = scan();
  ok(JSON.stringify(s4.sg) === JSON.stringify(base.sg) && JSON.stringify(s4.so) === JSON.stringify(base.so), 'Phá hai công trình vừa đặt: mọi chữ ký trở về đúng như ban đầu');
  // công trình đang xây là "động": nằm ở danh sách động, không vào lớp tĩnh; xong thì chuyển sang tĩnh
  const r2 = LT.place(G, 'house', x, y, { free: true, defer: true }); scan(); const ci = chunkAt(x, y);
  ok(st.dyn[ci].indexOf(r2.b) >= 0 && st.stat[ci].indexOf(r2.b) < 0, 'Công trình đang thi công ở danh sách động của vùng, chưa vào lớp tĩnh');
  const so0 = st.so[ci]; r2.b.building = false; r2.b.progress = 1; r2.b.born = T - 5; scan(); ok(st.stat[ci].indexOf(r2.b) >= 0 && st.so[ci] !== so0, 'Thi công xong: chuyển sang lớp tĩnh và chữ ký lớp vật thể đổi (vùng được vẽ lại)');
  r2.b.born = T - .1; scan(); ok(st.dyn[ci].indexOf(r2.b) >= 0, 'Vừa xong dưới 0,35 giây: còn vẽ động (hiệu ứng nảy lên)');
  // đường: đi vào danh sách đường của vùng, không vào lớp vật thể
  const ry = G.hy + 12, rx = G.hx + 12; const rr = LT.place(G, 'road', rx, ry, { free: true, instant: true, defer: true }); scan(); const rc = chunkAt(rx, ry);
  ok(st.road[rc].indexOf(rr.b) >= 0 && st.stat[rc].indexOf(rr.b) < 0, 'Đường nằm ở danh sách đường của vùng (lớp mặt đất)');
  const hallC = chunkAt(G.hx, G.hy); ok(st.dyn[hallC].some(b => b.k === 'hall') && st.stat[hallC].some(b => b.k === 'hall'), 'Phủ vẽ động mỗi khung nhưng vẫn là vật đổ bóng ở lớp mặt đất');
}

console.log('--- 3. Bản lưu không đổi, đổi đồ họa không đụng trạng thái ván');
{
  const G = LT.newGame(3, 'Lưu', 33); G.rank = 3; LT.grantCities(G, 3, 1, 2); G.res.tien = 5000;
  for (let i = 0; i < 120; i++) { LT.tickWeek(G); G.pendingEvent = null; G.pendingBattle = null; G.raid = null; G.pendingKhao = null; G.pendingPromo = null; G.pendingNotice = null; }
  const txt = LT.serialize(G), H = LT.deserialize(txt);
  ok(JSON.parse(txt).ver === LT.SAVE_VER && LT.SAVE_VER === 9, 'Phiên bản lưu hiện tại là 9 (có bước chuyển 8 → 9)');
  const noEra = t => { const o = JSON.parse(t); delete o.era; return JSON.stringify(o); };   // era do giao diện đặt khi bắt đầu ván, không lưu
  ok(noEra(LT.serialize(H)) === noEra(txt), 'Lưu → tải → lưu lại cho đúng cùng một văn bản (' + Math.round(txt.length / 1024) + ' KB)');
  ok(!/gfx|perf|chunk|lt-gfx/i.test(txt), 'Bản lưu không chứa chế độ đồ họa/bộ đếm (nằm trong localStorage riêng)');
  for (let i = 0; i < 20; i++) { LT.tickWeek(G); LT.tickWeek(H); G.pendingEvent = H.pendingEvent = null; G.pendingBattle = H.pendingBattle = null; G.raid = H.raid = null; G.pendingKhao = H.pendingKhao = null; G.pendingPromo = H.pendingPromo = null; G.pendingNotice = H.pendingNotice = null; }
  ok(H.year === G.year && H.week === G.week && Math.abs(H.res.tien - G.res.tien) < 1e-6, 'Chạy tiếp 20 tuần trên bản gốc và bản tải lại cho cùng kết quả (tiền ' + Math.round(G.res.tien) + ')');
}
console.log(fails ? '\n' + fails + ' KIỂM THỬ HỎNG' : '\nTẤT CẢ ĐẠT');
process.exit(fails ? 1 : 0);

'use strict';
// ============================================================================
// GIAI ĐOẠN 5 — BIỂU ĐỒ lịch sử theo năm (SVG tự viết, không thư viện) và LỚP HIỂN THỊ trên bản đồ thành / bản đồ 120 thành.
// Biểu đồ chỉ dựng khi mở bảng hoặc khi có điểm mới (bộ nhớ đệm theo số điểm), không vẽ lại mỗi khung.
// ============================================================================
const CH_SETS = {
  dan: { n: 'Dân & thành', series: [{ k: 1, n: 'Hộ khẩu', c: '#8fd47a' }, { k: 8, n: 'Số thành', c: '#e3c25e', alt: true }] },
  tien: { n: 'Tiền & lương', series: [{ k: 2, n: 'Tiền (quan)', c: '#f0d894' }, { k: 3, n: 'Lương (kho + dân)', c: '#d9a45a' }] },
  quan: { n: 'Quân số', series: [{ k: 4, n: 'Quân', c: '#e0705f' }] },
  luc: { n: 'Ba thước đo thế lực', series: [{ k: 5, n: 'Văn trị', c: '#8fd47a' }, { k: 6, n: 'Chính trị', c: '#c9a6e8' }, { k: 7, n: 'Quân sự – Cát cứ', c: '#e0705f' }], max100: true },
};
UI.chartCache = UI.chartCache || {};
function chartSvg(setId, Wd, Ht) {
  const S = CH_SETS[setId], q = (G.hist && G.hist.q) || [], key = setId + ':' + q.length + ':' + (q.length ? q[q.length - 1][0] : 0) + ':' + Wd;
  if (UI.chartCache[key]) return UI.chartCache[key];
  const L = 52, R = 26, T = 12, B = 26, w = Wd - L - R, h = Ht - T - B;
  if (q.length < 2) return '<div class="hint">Chưa đủ số liệu: biểu đồ ghi mỗi quý một điểm (cần ít nhất hai quý).</div>';
  const t0 = q[0][0], t1 = q[q.length - 1][0], X = t => L + (t - t0) / Math.max(1, t1 - t0) * w;
  let svg = '<svg viewBox="0 0 ' + Wd + ' ' + Ht + '" class="chartsvg" role="img" aria-label="' + esc(S.n) + '" style="width:100%;height:auto;max-width:' + Wd + 'px">';
  const main = S.series.filter(s => !s.alt), alt = S.series.filter(s => s.alt);
  let mx = S.max100 ? 100 : Math.max(1, ...main.map(s => Math.max(...q.map(r => r[s.k])))) * 1.08;
  const Y = v => T + h - v / mx * h;
  for (let i = 0; i <= 4; i++) { const v = mx * i / 4, y = Y(v); svg += '<line x1="' + L + '" y1="' + y.toFixed(1) + '" x2="' + (L + w) + '" y2="' + y.toFixed(1) + '" stroke="#ffffff18"/><text x="' + (L - 6) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end" font-size="11" fill="#aab9a8">' + LT.fmtN(v) + '</text>'; }
  const y0 = LT.START_YEAR + Math.floor(t0 / 36), nY = Math.max(1, Math.round((t1 - t0) / 36)), step = Math.max(1, Math.ceil(nY / 8));
  for (let i = 0; i <= nY; i += step) { const t = t0 + i * 36, x = X(t); svg += '<line x1="' + x.toFixed(1) + '" y1="' + T + '" x2="' + x.toFixed(1) + '" y2="' + (T + h) + '" stroke="#ffffff0d"/><text x="' + x.toFixed(1) + '" y="' + (Ht - 8) + '" text-anchor="middle" font-size="11" fill="#aab9a8">' + (y0 + i) + '</text>'; }
  for (const s of main) { const pts = q.map(r => X(r[0]).toFixed(1) + ',' + Y(r[s.k]).toFixed(1)).join(' '); svg += '<polyline points="' + pts + '" fill="none" stroke="' + s.c + '" stroke-width="2.2" stroke-linejoin="round"/>'; }
  if (alt.length) { const am = Math.max(1, ...alt.map(s => Math.max(...q.map(r => r[s.k])))) * 1.1; for (const s of alt) { const pts = q.map(r => X(r[0]).toFixed(1) + ',' + (T + h - r[s.k] / am * h).toFixed(1)).join(' '); svg += '<polyline points="' + pts + '" fill="none" stroke="' + s.c + '" stroke-width="2" stroke-dasharray="5 4"/><text x="' + (L + w) + '" y="' + (T + 12) + '" text-anchor="end" font-size="11" fill="' + s.c + '">' + esc(s.n) + ' (đến ' + Math.round(am / 1.1) + ', nét đứt)</text>'; } }
  svg += '</svg>';
  UI.chartCache = {}; UI.chartCache[key] = svg; return svg;
}
function openCharts(set) { if (!G) return; UI.panel = 'charts'; UI.tab.charts = set || UI.tab.charts || 'dan'; renderCharts(true); }
ACT.chartTab = el => { UI.tab.charts = el.dataset.t; renderCharts(); };
function renderCharts(first) {
  const t = UI.tab.charts || 'dan', S = CH_SETS[t], q = (G.hist && G.hist.q) || [], last = q[q.length - 1];
  const wide = Math.min(760, Math.max(300, (window.innerWidth || 800) - 60));
  let body = '<p class="hint">Mỗi quý ghi một điểm (tối đa ' + LT.HIST_MAX + ' điểm, tức ' + Math.round(LT.HIST_MAX / 4) + ' năm); lịch sử nằm trong bản lưu.</p>' + chartSvg(t, wide, Math.round(wide * .5));
  body += '<div class="legend">' + S.series.map(s => '<span class="lg"><i style="background:' + s.c + '"></i>' + esc(s.n) + (last ? ' <b>' + LT.fmtN(last[s.k]) + '</b>' : '') + '</span>').join('') + '</div>';
  const html = shell('📈 Biểu đồ', Object.keys(CH_SETS).map(k => [k, CH_SETS[k].n]), t, 'chartTab', body);
  if (first || !modalOpen() || UI.panel !== 'charts') openModal(html, 'wide'); else setModal(html);
}

// ---------- lớp hiển thị trên bản đồ ----------
// bản đồ thành (ô): bộ chọn lớp trong thanh điều khiển; bản đồ 120 thành: nút chọn lớp trong bảng Thiên hạ.
UI.layer = UI.layer || 'none';
const CITY_LAYERS = [['none', 'Không'], ['dantam', 'Dân tâm'], ['trian', 'Trị an'], ['vesinh', 'Vệ sinh']];
const WLAYERS = [['nuoc', 'Theo nước'], ['dt', 'Dân tâm / quy thuận'], ['kt', 'Kinh tế (hộ)'], ['qs', 'Quân sự (đồn trú)']];
function layerCol(t) { const v = Math.max(0, Math.min(1, t)); const r = Math.round(210 - 150 * v), g = Math.round(60 + 150 * v); return 'rgb(' + r + ',' + g + ',70)'; }
function cityLayerVal(c, kind) {
  if (kind === 'dt') return c.qt != null ? c.qt / 70 : ((c.id === G.seatId ? G.stat.dantam : c.dt) / 100);
  if (kind === 'kt') return Math.min(1, (c.id === G.seatId ? LT.totalHo(G) : c.ho) / LT.CITY_LEVELS[c.id === G.seatId ? G.seatLvl : c.lvl].cap);
  return Math.min(1, c.gar / Math.max(30, c.ho * .06));
}
function wlayerLegend() {
  const k = UI.wlayer || 'nuoc'; if (k === 'nuoc') return '';
  const lab = { dt: ['loạn / chưa quy thuận', 'yên / quy thuận'], kt: ['thưa dân', 'đông dân (so với trần cấp)'], qs: ['trống quân', 'đồn trú dày'] }[k];
  return '<div class="legend" style="margin-top:4px"><span class="lg"><i style="background:' + layerCol(0) + '"></i>' + lab[0] + '</span><span class="lg"><i style="background:' + layerCol(.5) + '"></i>vừa</span><span class="lg"><i style="background:' + layerCol(1) + '"></i>' + lab[1] + '</span></div>';
}
function wlayerBar() { const k = UI.wlayer || 'nuoc'; return '<div class="radio" style="margin:4px 0">' + WLAYERS.map(l => '<button class="btn2 ' + (k === l[0] ? 'on' : '') + '" data-act="wLayer" data-k="' + l[0] + '">' + l[1] + '</button>').join('') + '</div>'; }
ACT.wLayer = el => { UI.wlayer = el.dataset.k; renderWorld(); };

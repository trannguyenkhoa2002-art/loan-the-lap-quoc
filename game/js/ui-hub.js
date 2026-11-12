'use strict';
// ============================================================================
// GIAI ĐOẠN 5 — BA MÀN HÌNH (Thành trì · Thiên hạ · Triều đình): hàng nút chuyển bảng trong mỗi màn, tóm tắt một dòng,
// gập các phần dài, thu gọn bảng trái, gợi ý ngữ cảnh ngắn (tắt được). Dùng lại các bảng có sẵn, chỉ xếp lại lối vào.
// ============================================================================
const HUBS = {
  city: { n: 'Thành trì', i: '🏯', items: [
    { n: '🗺️ Bản đồ & xây dựng', tip: 'Đóng bảng, về bản đồ thành để xây', go: () => closeModal(), m: () => false },
    { n: '📒 Dòng chảy', go: () => openLedger(null, 'dong'), m: (p, t) => p === 'ledger' && t === 'dong' },
    { n: '📦 Kho & giá', tip: 'Giá và cung cầu từng hàng, tồn kho', go: () => openLedger(null, 'gia'), m: (p, t) => p === 'ledger' && t === 'gia' },
    { n: '🏗️ Công trình', go: () => openLedger(null, 'cong'), m: (p, t) => p === 'ledger' && t === 'cong' },
    { n: '📈 Biểu đồ', tip: 'Lịch sử theo năm: dân, tiền, lương, quân, thế lực', go: () => openCharts(), m: p => p === 'charts' },
  ] },
  world: { n: 'Thiên hạ', i: '🗺️', items: [
    { n: '🏯 Bản đồ thành', go: () => openWorld(null, 'thanh'), m: (p, t) => p === 'world' && t === 'thanh' },
    { n: '🌏 Các nước', go: () => openWorld(null, 'nuoc'), m: (p, t) => p === 'world' && t === 'nuoc' },
    { n: '🕊️ Ngoại giao', go: () => openWorld(null, 'ngg'), m: (p, t) => p === 'world' && t === 'ngg' },
    { n: '🏛️ Thành của bạn', go: () => openWorld(null, 'cua'), m: (p, t) => p === 'world' && t === 'cua' },
    { n: '🏪 Giao thương', go: () => openTrade(), m: p => p === 'trade' },
    { n: '⚔️ Chiến dịch', go: () => openWorld(null, 'chien'), m: (p, t) => p === 'world' && t === 'chien' },
    { n: '🪖 Quân vụ', go: () => openArmy(), m: p => p === 'army' },
  ] },
  court: { n: 'Triều đình', i: '📜', items: [
    { n: '🎖️ Quan lộ', go: () => openCourt('quanlo'), m: (p, t) => p === 'court' && t === 'quanlo' },
    { n: '⚖️ Thế lực', go: () => openCourt('luc'), m: (p, t) => p === 'court' && t === 'luc' },
    { n: '🏛️ Phe phái', go: () => openCourt('phe'), m: (p, t) => p === 'court' && t === 'phe' },
    { n: '👥 Quan viên', go: () => openOfficials('ds'), m: (p, t) => p === 'officials' && t !== 'gv' },
    { n: '🧰 Giao việc', go: () => openOfficials('gv'), m: (p, t) => p === 'officials' && t === 'gv' },
    { n: '💰 Thuế & chính sách', go: () => openCourt('thue'), m: (p, t) => p === 'court' && t === 'thue' },
    { n: '👪 Dân', go: () => openCourt('dan'), m: (p, t) => p === 'court' && t === 'dan' },
    { n: '📜 Bố cáo', go: () => openCourt('bocao'), m: (p, t) => p === 'court' && t === 'bocao' },
    { n: '🏅 Thành tựu', go: () => openCourt('tuu'), m: (p, t) => p === 'court' && t === 'tuu' },
  ] },
};
const PANEL_SCREEN = { ledger: 'city', charts: 'city', world: 'world', trade: 'world', army: 'world', court: 'court', officials: 'court' };
function hubScreen() { return PANEL_SCREEN[UI.panel] || null; }
function hubRow() {
  const s = hubScreen(); if (!s) return '';
  const H = HUBS[s], p = UI.panel, t = UI.tab[p];
  return '<div class="hubrow">' + H.items.map((it, i) => '<button class="hubchip ' + (it.m(p, t) ? 'on' : '') + '" data-act="hubGo" data-s="' + s + '" data-i="' + i + '"' + (it.tip ? ' data-tip="' + esc(it.tip) + '"' : '') + '>' + it.n + '</button>').join('') + '</div>';
}
ACT.hubGo = el => { const it = HUBS[el.dataset.s].items[+el.dataset.i]; if (it) it.go(); };
function hubMark() { const s = hubScreen(); for (const k of ['city', 'world', 'court']) { const b = document.getElementById('m-' + k); if (b) b.classList.toggle('cur', k === s && modalOpen()); } }
// tóm tắt một dòng ở đầu mỗi bảng
function hubSummary() {
  if (!G) return ''; const p = UI.panel; let s = '';
  const st = G.stat;
  if (p === 'ledger' || p === 'charts') s = LT.fmtN(LT.totalHo(G)) + ' hộ · tiền ' + LT.fmtN(G.res.tien) + ' · lương ' + LT.fmtN(G.res.luong) + ' · phồn vinh ' + Math.round(st.phonvinh);
  else if (p === 'world') s = LT.mineCount(G) + ' thành của bạn · ' + LT.countCities(G) + ' thành thiên hạ · ' + LT.fmtN(LT.armyCount(G)) + ' quân' + (G.camp ? ' · đang có chiến dịch' : '');
  else if (p === 'trade') s = 'chợ ' + LT.MARKET_TIERS[LT.marketTier(G)].n + ' · ' + (LT.t2(G).caravans || []).length + ' thương đội đang đi';
  else if (p === 'army') s = LT.fmtN(LT.armyCount(G)) + ' / ' + LT.fmtN(LT.armyCap(G)) + ' quân · thắng ' + (G.wins || 0) + ' trận';
  else if (p === 'court') s = LT.RANKS[G.rank].n + ' · dân tâm ' + Math.round(st.dantam) + ' · nghi kỵ ' + Math.round(G.nghiky) + (G.pw ? ' · Văn trị ' + LT.pwScores(G).van.v : '');
  else if (p === 'officials') { const O = LT.off(G); s = O.list.length + ' quan · ' + O.list.filter(o => !o.post).length + ' chưa có việc · ' + LT.ownedCities(G).filter(c => !c.quan).length + ' thành khuyết quan'; }
  return s ? '<div class="sumline">' + esc(s) + '</div>' : '';
}
// gập các mục h3 dài (mở lại đúng mục đã mở khi vẽ lại bảng)
UI.fold = UI.fold || {};
function foldSections(root) {
  if (!root) return; const key = UI.panel + ':' + (UI.tab[UI.panel] || '');
  root.querySelectorAll('h3').forEach((h, idx) => {
    if (h.dataset.nofold || h.closest('table') || h.closest('.fold')) return; const par = h.parentNode; if (!par) return;
    const sibs = []; let n = h.nextSibling; while (n && !(n.nodeType === 1 && n.tagName === 'H3')) { sibs.push(n); n = n.nextSibling; }
    const len = sibs.reduce((a, x) => a + (x.textContent || '').length, 0); if (idx < 1 || len < 260 || sibs.some(x => x.nodeType === 1 && (x.querySelector && (x.querySelector('svg.mapsvg,canvas') || x.matches('svg.mapsvg'))))) return;
    const id = key + ':' + h.textContent.slice(0, 24), wrap = document.createElement('div'); wrap.className = 'fold'; par.insertBefore(wrap, sibs[0] || null); for (const x of sibs) wrap.appendChild(x);
    const open = !!UI.fold[id]; wrap.style.display = open ? '' : 'none'; h.classList.add('foldh'); h.dataset.open = open ? '1' : '0';
    h.onclick = () => { const o = wrap.style.display === 'none'; wrap.style.display = o ? '' : 'none'; h.dataset.open = o ? '1' : '0'; UI.fold[id] = o; };
  });
}
// bảng trái thu gọn được
let leftMin = false; try { const sv = localStorage.getItem('lt-leftmin'); leftMin = sv === null ? (window.innerWidth <= 700) : sv === '1'; } catch (e) { }
function applyLeft() { const l = document.getElementById('left'); if (!l) return; l.classList.toggle('min', leftMin); const b = document.getElementById('left-toggle'); if (b) b.textContent = leftMin ? '▶ Hiện bảng' : '◀ Thu gọn'; }
function placeHud() { const t = document.getElementById('topbar'); if (t) document.documentElement.style.setProperty('--tb', (t.offsetTop + t.offsetHeight) + 'px'); }
window.addEventListener('resize', placeHud);
function initHub() {
  placeHud(); setTimeout(placeHud, 300); try { new ResizeObserver(placeHud).observe(document.getElementById('topbar')); } catch (e) { }
  const l = document.getElementById('left'); if (!l || document.getElementById('left-toggle')) return;
  const b = document.createElement('button'); b.id = 'left-toggle'; b.className = 'btn2'; b.onclick = () => { leftMin = !leftMin; try { localStorage.setItem('lt-leftmin', leftMin ? '1' : '0'); } catch (e) { } applyLeft(); };
  l.insertBefore(b, l.firstChild); applyLeft();
  const vc = document.getElementById('view-controls');
  if (vc && !document.getElementById('layer-sel')) { const sel = document.createElement('select'); sel.id = 'layer-sel'; sel.className = 'sel'; sel.setAttribute('aria-label', 'Lớp hiển thị trên bản đồ'); sel.innerHTML = CITY_LAYERS.map(x => '<option value="' + x[0] + '">' + (x[0] === 'none' ? '🎨 Lớp: không' : '🎨 ' + x[1]) + '</option>').join(''); sel.onchange = () => { UI.layer = sel.value; LAYERMAP.key = ''; const lg = document.getElementById('layer-legend'); if (lg) lg.style.display = sel.value === 'none' ? 'none' : 'flex'; }; vc.appendChild(sel); const lg = document.createElement('div'); lg.id = 'layer-legend'; lg.className = 'legend'; lg.style.display = 'none'; lg.innerHTML = '<span class="lg"><i style="background:#d6463c"></i>thấp</span><span class="lg"><i style="background:#e8c446"></i>vừa</span><span class="lg"><i style="background:#6ec864"></i>tốt</span>'; vc.parentNode.insertBefore(lg, vc.nextSibling); }
}
// gợi ý ngắn theo ngữ cảnh, tắt được
const HINTS = [
  { id: 'h-build', ok: () => G.rank < 2 && G.bl.length < 6, t: 'Chọn công trình ở thanh dưới rồi bấm lên bản đồ để xây.' },
  { id: 'h-court', ok: () => G.year >= 918 && !G.flags.seenCourt, t: 'Nút 📜 Triều đình: thuế, quan lộ và việc thăng chức.' },
  { id: 'h-world', ok: () => G.rank >= 3 && LT.campTargets(G).length > 0, t: 'Có thành địch giáp biên: 🗺️ Thiên hạ → Bản đồ thành để xuất quân.' },
  { id: 'h-garr', ok: () => G.world.cities.some(c => c.mine && c.qt != null && c.qt < 50), t: 'Thành mới chiếm cần đồn trú: Thiên hạ → Thành của bạn.' },
];
function hintBar() {
  if (!G) return ''; let seen = {}; try { seen = JSON.parse(localStorage.getItem('lt-hints') || '{}'); } catch (e) { }
  const h = HINTS.find(x => !seen[x.id] && !G.flags['hint_' + x.id] && x.ok()); if (!h) return '';
  return '<div class="alert l0 hintline"><span>💡</span><span>' + esc(h.t) + '</span><button class="x2" data-act="hintOff" data-id="' + h.id + '" aria-label="Tắt gợi ý">✕</button></div>';
}
ACT.hintOff = el => { let seen = {}; try { seen = JSON.parse(localStorage.getItem('lt-hints') || '{}'); seen[el.dataset.id] = 1; localStorage.setItem('lt-hints', JSON.stringify(seen)); } catch (e) { } G.flags['hint_' + el.dataset.id] = 1; ui(); };

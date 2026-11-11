// Màn hình Giao thương (phím B): chợ & giá, thương đội, thương lộ nội bộ, thuế & phường thị, lãi lỗ.
UI.car = UI.car || { give: 'tra', qty: 120, destKind: 'nat', dest: 1, back: '', sea: false, escort: false };
UI.trMk = UI.trMk || { k: 'luong', qty: 100 };
UI.trInt = UI.trInt || { from: -1, to: -1, qty: 200 };
function openTrade(tab) { if (!G) return; UI.panel = 'trade'; if (tab) UI.tab.trade = tab; UI.tab.trade = UI.tab.trade || 'cho'; renderTrade(true); }
ACT.trTab = el => { UI.tab.trade = el.dataset.t; renderTrade(); };
const trOpt = (v, cur, txt) => '<option value="' + v + '"' + (String(v) === String(cur) ? ' selected' : '') + '>' + txt + '</option>';
const goodSel = (cur, name, allowNone) => '<select class="sel" data-chg="' + name + '">' + (allowNone ? trOpt('', cur, '— chở bạc về —') : '') + LT.GOOD_IDS.map(k => trOpt(k, cur, LT.GOODS[k].i + ' ' + LT.GOODS[k].n)).join('') + '</select>';
const trStock = k => k === 'luong' ? G.res.luong : (G.res[k] || 0);
function renderTrade(first) {
  const t = UI.tab.trade, T = LT.t2(G); let body = '';
  const tier = LT.marketTier(G), TI = LT.MARKET_TIERS[tier];
  body += '<div class="hint">Phường thị: <b>' + TI.n + '</b> · sức chợ ' + fm(Math.round(LT.marketVolCap(G))) + ' quan/tuần · tiền lưu thông trong dân ' + fm(Math.round(G.wealth)) + ' quan · thương đội ' + T.caravans.length + '/' + (G.rank >= LT.TRADE_RANK ? LT.maxCaravans(G) : 0) + '</div>';
  if (t === 'cho') {
    const nats = LT.NATIONS.filter(n => n.id !== G.nation && n.id < 12);
    body += '<h3>Giá từng mặt hàng — chợ của bạn và các nước</h3><p class="hint">Giá chợ bạn theo cung cầu thật (KT §6). Màu xanh = rẻ (nơi <b>dư</b>), đỏ = đắt (nơi <b>thiếu</b>); chênh lệch này là cơ hội cho thương đội. Giá kẹp 0,4–2,5 lần giá gốc.</p>';
    body += '<div style="overflow-x:auto"><table class="t2" style="font-size:11.5px"><tr><th>Hàng</th><th class="r">Kho</th><th class="r">Chợ bạn: mua / bán</th>' + nats.map(n => '<th class="r" data-tip="' + esc(n.n + ' · kinh đô ' + n.cap + ' · dư: ' + ((LT.REGION[n.id] || { du: [] }).du.map(k => LT.GOODS[k].n).join(', ') || '—') + ' · thiếu: ' + ((LT.REGION[n.id] || { thieu: [] }).thieu.map(k => LT.GOODS[k].n).join(', ') || '—')) + '">' + esc(n.n.replace('Tĩnh Hải quân', 'T.Hải').replace('Hậu Lương', 'H.Lương').replace('Tiền Thục', 'Thục').replace('Kinh Nam', 'K.Nam').replace('Khiết Đan', 'K.Đan')) + '</th>').join('') + '</tr>';
    for (const k of LT.GOOD_IDS) {
      const gd = LT.GOODS[k], b = LT.localBase(G, k), lp = LT.localPrice(G, k);
      const cell = p => { const r = p / gd.p; return '<td class="r ' + (r < .85 ? 'pos' : r > 1.25 ? 'neg' : '') + '">' + f1(p) + '</td>'; };
      body += '<tr><td>' + gd.i + ' ' + gd.n + '</td><td class="r">' + fm(Math.round(trStock(k))) + '</td><td class="r ' + (lp / b < .85 ? 'pos' : lp / b > 1.25 ? 'neg' : '') + '"><b>' + f1(LT.marketQuote(G, k, 'buy')) + ' / ' + f1(LT.marketQuote(G, k, 'sell')) + '</b></td>' + nats.map(n => cell(LT.priceAt(G, 'nat', n.id, k))).join('') + '</tr>';
    }
    body += '</table></div>';
    const m = UI.trMk, q = Math.max(1, Math.floor(+m.qty || 1)), pb = LT.marketQuote(G, m.k, 'buy'), ps = LT.marketQuote(G, m.k, 'sell');
    body += '<h3>Mua bán trực tiếp ở chợ</h3><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">' + goodSel(m.k, 'trMkK') + '<input class="inp" type="number" min="1" value="' + q + '" data-chg="trMkQ" style="width:90px"> <button class="btn" data-act="trBuy">Mua ' + fm(q) + ' · ' + fm(Math.round(pb * q)) + ' quan</button><button class="btn2" data-act="trSell">Bán ' + fm(q) + ' · ' + fm(Math.round(ps * q)) + ' quan</button></div>';
    body += '<div class="hint">Mua cao hơn giá chợ 6%, bán thấp hơn 6%. Mua nhiều thì giá nhích lên, bán nhiều thì giá tụt (độ sâu chợ ' + fm(TI.depth) + ' quan), rồi trở lại sau vài tuần. Khi bán, dân phải đủ tiền lưu thông để trả (tiền hoang chặn việc làm giàu chỉ bằng buôn bán). Mua bán trực tiếp tối đa ' + fm(Math.round(LT.marketVolCap(G))) + ' quan mỗi tuần.</div>';
  } else if (t === 'doi') {
    if (G.rank < LT.TRADE_RANK) body += '<p class="mut">Thương đội của quan phủ mở từ chức <b>Thứ sử</b>. Bây giờ bạn chỉ mua bán trực tiếp ở chợ.</p>';
    else body += trCaravanTab();
  } else if (t === 'noibo') {
    body += trInternalTab();
  } else if (t === 'thue') {
    body += trTaxTab();
  } else {
    body += trLedgerTab();
  }
  const html = shell('🏪 Giao thương', [['cho', 'Chợ & giá'], ['doi', 'Thương đội'], ['noibo', 'Thương lộ nội bộ'], ['thue', 'Thuế & phường thị'], ['lai', 'Lãi lỗ']], t, 'trTab', body);
  if (first || !modalOpen() || UI.panel !== 'trade') openModal(html, 'wide'); else setModal(html);
}
ACT.trMkK = el => { UI.trMk.k = el.value; renderTrade(); };
ACT.trMkQ = el => { UI.trMk.qty = Math.max(1, Math.floor(+el.value || 1)); renderTrade(); };
ACT.trBuy = () => { const m = UI.trMk, r = LT.marketTrade(G, m.k, m.qty, 'buy'); toast(r.ok ? 'Đã mua ' + m.qty + ' ' + LT.GOODS[m.k].n.toLowerCase() + ' (' + Math.round(r.value) + ' quan)' : r.err, r.ok ? 'good' : 'bad'); renderTrade(); ui(); };
ACT.trSell = () => { const m = UI.trMk, r = LT.marketTrade(G, m.k, m.qty, 'sell'); toast(r.ok ? 'Đã bán ' + m.qty + ' ' + LT.GOODS[m.k].n.toLowerCase() + ' (' + Math.round(r.value) + ' quan)' : r.err, r.ok ? 'good' : 'bad'); renderTrade(); ui(); };

function destOptions() {
  const cs = G.world.cities; let o = '';
  o += '<optgroup label="Các nước (kinh đô)">' + LT.NATIONS.filter(n => n.id !== G.nation && n.id < 12 && G.world.ns[n.id].alive).map(n => { const b = LT.routeBlocked(G, n.id); return '<option value="n:' + n.id + '"' + (UI.car.destKind === 'nat' && UI.car.dest === n.id ? ' selected' : '') + '>' + esc(n.n) + ' — ' + esc(n.cap) + (b ? ' (⛔ ' + esc(b) + ')' : '') + '</option>'; }).join('') + '</optgroup>';
  const mine = cs.filter(c => c.mine && c.id !== G.seatId);
  if (mine.length) o += '<optgroup label="Thành của bạn">' + mine.map(c => '<option value="c:' + c.id + '"' + (UI.car.destKind === 'city' && UI.car.dest === c.id ? ' selected' : '') + '>' + esc(c.n) + '</option>').join('') + '</optgroup>';
  return o;
}
function trCaravanTab() {
  const T = LT.t2(G), C = UI.car; let h = '';
  h += '<h3>Tuyến tiêu biểu</h3><div style="display:flex;gap:6px;flex-wrap:wrap">' + LT.ROUTE_PRESETS.map(p => '<button class="btn2" data-act="trPreset" data-id="' + p.id + '" data-tip="' + esc(p.d) + '">' + p.n + (p.sea ? ' ⚓' : '') + '</button>').join('') + '</div>';
  h += '<h3>Lập thương đội mới</h3><div class="grid2" style="align-items:start"><div>';
  h += '<div class="flowrow"><span>Hàng chở đi</span>' + goodSel(C.give, 'trCarGive') + '</div>';
  h += '<div class="flowrow"><span>Số lượng (kho có ' + fm(Math.floor(trStock(C.give))) + ')</span><input class="inp" type="number" min="1" value="' + C.qty + '" data-chg="trCarQty" style="width:90px"></div>';
  h += '<div class="flowrow"><span>Nơi đến</span><select class="sel" data-chg="trCarDest">' + destOptions() + '</select></div>';
  h += '<div class="flowrow"><span>Chiều về chở</span>' + goodSel(C.back, 'trCarBack', true) + '</div>';
  h += '<div class="flowrow"><label><input type="checkbox" data-chg="trCarSea"' + (C.sea ? ' checked' : '') + '> Đi đường biển (cần Bến cảng ⚓' + (LT.count(G, 'port') ? ', có' : ', chưa có') + ')</label></div>';
  h += '<div class="flowrow"><label><input type="checkbox" data-chg="trCarEsc"' + (C.escort ? ' checked' : '') + '> Hộ tống (' + LT.ESCORT_FEE + ' quan/xe, giảm rủi ro)</label></div>';
  h += '</div><div>';
  const q = LT.caravanQuote(G, C);
  if (!q.ok) h += '<div class="box neg">' + esc(q.err) + '</div>';
  else {
    h += '<div class="box"><b>Báo giá</b> · ' + q.carts + ' xe, ' + q.hops + ' chặng, ' + q.W + ' tuần đi + ' + q.W + ' tuần về' + (q.sea ? ' (đường biển)' : '') + '<br>' +
      'Giá mua (chợ bạn) <b>' + f1(q.buyP) + '</b> · giá bán dự kiến <b>' + f1(q.sellEff) + '</b> (đã tính bán nhiều thì tụt) · còn ' + Math.round(q.keep * 100) + '% hàng sau hao đường<br>' +
      'Doanh thu ' + fm(Math.round(q.revenue)) + ' − trú thuế ' + fm(Math.round(q.truthue)) + ' − thuế quá cảnh ' + fm(Math.round(q.toll)) + (q.tollCities.length ? ' (' + q.tollCities.map(x => esc(x.n)).join(', ') + ')' : '') + '<br>' +
      (q.backQty ? 'Đổi chở về <b>' + q.backQty + ' ' + LT.GOODS[C.back].n.toLowerCase() + '</b> (giá ' + f1(q.backP) + ', trị giá ở chợ bạn ' + fm(Math.round(q.backVal)) + ')<br>' : '') +
      'Vốn hàng ' + fm(Math.round(q.cost)) + ' · công phu xe ' + fm(Math.round(q.cong)) + (q.escort ? ' · hộ tống ' + fm(q.escort) : '') + '<br>' +
      '<b>Lãi dự kiến: <span class="' + (q.profit >= 0 ? 'pos' : 'neg') + '">' + (q.profit >= 0 ? '+' : '') + fm(Math.round(q.profit)) + ' quan</span></b> (cần ứng ' + fm(Math.round(q.upfront)) + ' quan)<div class="hint">Rủi ro: ' + esc(q.riskTxt) + '. Chiến tranh hoặc cấm vận giữa đường sẽ cắt tuyến.</div></div>';
    h += '<button class="btn" data-act="trSend" style="margin-top:8px">🐪 Gửi thương đội</button>';
  }
  h += '</div></div>';
  h += '<h3>Đang đi đường (' + T.caravans.length + ')</h3>';
  if (!T.caravans.length) h += '<div class="mut">Chưa có thương đội nào.</div>';
  for (const c of T.caravans) { const tot = c.W * 2, done = c.state === 'go' ? c.W - c.left : c.W + (c.W - c.left); h += '<div class="box" style="margin:4px 0"><b>' + LT.GOODS[c.give].i + ' ' + Math.round(c.qty) + ' ' + LT.GOODS[c.give].n.toLowerCase() + ' → ' + esc(c.destN) + '</b>' + (c.sea ? ' ⚓' : '') + ' · ' + (c.state === 'go' ? 'đang đi' : 'đang về') + ' (còn ' + c.left + ' tuần)' + bar(Math.min(tot, done), tot, 'y') + (c.log.length ? '<div class="hint">' + esc(c.log.slice(-2).join(' · ')) + '</div>' : '') + '</div>'; }
  return h;
}
ACT.trPreset = el => {
  const p = LT.ROUTE_PRESETS.find(x => x.id === el.dataset.id); if (!p) return; UI.car.give = p.give; UI.car.back = p.back || ''; UI.car.sea = !!p.sea;
  const d = p.dests.find(n => n !== G.nation && G.world.ns[n].alive && !LT.routeBlocked(G, n) && (!p.sea || LT.COASTAL[n])) ?? p.dests.find(n => n !== G.nation); UI.car.destKind = 'nat'; UI.car.dest = d != null ? d : 1; UI.car.qty = Math.min(360, Math.max(30, Math.floor(trStock(p.give)))); renderTrade();
};
ACT.trCarGive = el => { UI.car.give = el.value; renderTrade(); };
ACT.trCarQty = el => { UI.car.qty = Math.max(1, Math.floor(+el.value || 1)); renderTrade(); };
ACT.trCarDest = el => { const [a, b] = el.value.split(':'); UI.car.destKind = a === 'n' ? 'nat' : 'city'; UI.car.dest = +b; renderTrade(); };
ACT.trCarBack = el => { UI.car.back = el.value; renderTrade(); };
ACT.trCarSea = el => { UI.car.sea = el.checked; renderTrade(); };
ACT.trCarEsc = el => { UI.car.escort = el.checked; renderTrade(); };
ACT.trSend = () => { const r = LT.sendCaravan(G, UI.car); toast(r.ok ? 'Thương đội đã lên đường' : r.err, r.ok ? 'good' : 'bad'); renderTrade(); ui(); };

function trInternalTab() {
  const T = LT.t2(G), I = UI.trInt; let h = '';
  if (G.rank < 2) return '<p class="mut">Thương lộ nội bộ mở từ chức Thứ sử, khi bạn có thành thuộc quyền.</p>';
  const nodes = [{ id: G.seatId, n: G.world.cities[G.seatId].n + ' (trị sở)', gr: G.res.luong }].concat(LT.ownedCities(G).map(c => ({ id: c.id, n: c.n, gr: c.grain })));
  if (I.from < 0 || !nodes.find(x => x.id === I.from)) I.from = nodes[0].id; if (I.to < 0 || !nodes.find(x => x.id === I.to) || I.to === I.from) I.to = (nodes.find(x => x.id !== I.from) || nodes[0]).id;
  h += '<p class="hint">Điều lương từ thành dư sang thành thiếu: hao ' + Math.round(LT.INT_HAO * 100) + '% mỗi chặng, tốn công phu xe. Thương lộ thường trực tự chạy mỗi tháng khi thành đi dư và thành đến thiếu.</p>';
  h += '<table class="t2"><tr><th>Thành</th><th class="r">Hộ</th><th class="r">Tồn lương</th><th class="r">Đủ (tuần)</th></tr>' + nodes.map(x => { const c = G.world.cities[x.id]; return '<tr><td>' + esc(x.n) + '</td><td class="r">' + fm(c.ho) + '</td><td class="r">' + fm(Math.round(x.gr)) + '</td><td class="r">' + (x.id === G.seatId ? '—' : f1(x.gr / Math.max(1, c.ho * .11))) + '</td></tr>'; }).join('') + '</table>';
  const sel = (cur, act) => '<select class="sel" data-chg="' + act + '">' + nodes.map(x => trOpt(x.id, cur, esc(x.n))).join('') + '</select>';
  h += '<h3>Điều một lần</h3><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">Từ ' + sel(I.from, 'trIntFrom') + ' sang ' + sel(I.to, 'trIntTo') + ' <input class="inp" type="number" min="10" value="' + I.qty + '" data-chg="trIntQty" style="width:90px"> thạch <button class="btn" data-act="trIntGo">Điều lương</button><button class="btn2" data-act="trIntRoute" data-tip="Tự chuyển mỗi tháng khi nơi đi dư lương và nơi đến thiếu">➕ Lập thương lộ thường trực</button></div>';
  h += '<h3>Thương lộ thường trực (' + T.routes.length + '/6)</h3>' + (T.routes.length ? T.routes.map((r, i) => '<div class="flowrow"><span>' + esc(G.world.cities[r.from].n) + ' → ' + esc(G.world.cities[r.to].n) + ' · ' + r.qty + ' thạch mỗi lần</span><button class="btn2" data-act="trIntDel" data-i="' + i + '">Bỏ</button></div>').join('') : '<div class="mut">Chưa có.</div>');
  return h;
}
ACT.trIntFrom = el => { UI.trInt.from = +el.value; renderTrade(); };
ACT.trIntTo = el => { UI.trInt.to = +el.value; renderTrade(); };
ACT.trIntQty = el => { UI.trInt.qty = Math.max(10, Math.floor(+el.value || 10)); renderTrade(); };
ACT.trIntGo = () => { const I = UI.trInt, r = LT.internalShip(G, I.from, I.to, I.qty); toast(r.ok ? 'Đã điều ' + Math.round(r.got) + ' thạch (hao ' + Math.round((1 - r.got / r.qty) * 100) + '%)' : r.err, r.ok ? 'good' : 'bad'); renderTrade(); ui(); };
ACT.trIntRoute = () => { const I = UI.trInt, r = LT.addRoute(G, I.from, I.to, I.qty); if (!r.ok) toast(r.err, 'bad'); renderTrade(); };
ACT.trIntDel = el => { LT.t2(G).routes.splice(+el.dataset.i, 1); renderTrade(); };

function trTaxTab() {
  const T = LT.t2(G), tier = LT.marketTier(G), TI = LT.MARKET_TIERS[tier]; let h = '';
  h += '<h3>Thuế quá cảnh (hàng đi ngang qua thành bạn)</h3><p class="hint">Dòng hàng ngang qua ≈ <b>' + fm(Math.round(LT.transitFlow(G))) + '</b> quan/tuần (tăng theo phường thị, dịch trạm, giao ước thông thương, phồn vinh). Trên 2% thương đội ngoại quốc bắt đầu né sang đường khác.</p>';
  h += '<div class="radio">' + [0, .01, .02, .03, .04, .06, .08].map(v => '<button class="btn2 ' + (Math.abs(T.transit - v) < .0005 ? 'on' : '') + '" data-act="trTransit" data-v="' + v + '" style="flex:0 0 auto;padding:5px 9px">' + Math.round(v * 100) + '%</button>').join('') + '</div>';
  h += '<div class="flowrow"><span>Thu về mỗi tuần với mức hiện tại</span><b class="pos">+' + f1(LT.transitIncome(G)) + ' quan</b></div>';
  h += '<h3>Trú thuế (hàng bán tại chợ)</h3><div class="radio">' + LT.THUE_CHO.map((c, i) => '<button class="btn2 ' + (G.pol.cho === i ? 'on' : '') + '" data-act="trCho" data-v="' + i + '" style="flex:0 0 auto;padding:5px 9px">' + c.n + '</button>').join('') + '</div><div class="hint">Cao thì thu nhiều hơn nhưng phồn vinh tụt, thương nhân bỏ đi (đã có sẵn ở Triều chính, nối vào đây).</div>';
  h += '<h3>Cấp phường thị</h3><div class="box">Hiện là <b>' + TI.n + '</b> (' + LT.count(G, 'market') + ' chợ, ' + LT.count(G, 'inn') + ' dịch trạm). ';
  h += '<ul style="margin:6px 0;padding-left:18px"><li>Chợ phiên: có ≥ 1 Phường thị — sức chợ ' + Math.round(220) + ' quan/tuần</li><li>Chợ thường: ≥ 2 Phường thị — sức chợ ×1,5, dòng hàng ×1,4</li><li>Đại thị: ≥ 4 Phường thị, ≥ 1 Dịch trạm, từ chức Phòng ngự sứ — sức chợ ×2,2, thu hút thương đội ngoại quốc (dòng hàng ×2)</li></ul></div>';
  h += '<h3>Bến cảng và hải thương</h3><div class="hint">' + (LT.count(G, 'port') ? 'Bạn đã có ' + LT.count(G, 'port') + ' bến cảng: mở đường biển ở tab Thương đội (lãi cao, rủi ro bão ~1%/tuần và hải tặc ~1,2%/tuần).' : 'Chưa có Bến cảng: dựng ở nhóm 💰 Thương & kho (từ Thứ sử, đặt trong 3 ô quanh nước) để mở hải thương tới ' + Object.keys(LT.COASTAL).map(i => LT.NATIONS[i].n).join(', ') + '.') + '</div>';
  const blocks = Object.keys(T.block); h += '<h3>Thương lộ đang bị chặn</h3>' + (blocks.length ? blocks.map(n => '<div class="flowrow"><span>' + esc(LT.NATIONS[n].n) + '</span><b class="neg">' + T.block[n] + ' tuần</b></div>').join('') : '<div class="mut">Không có.</div>') + '<div class="hint">Thuế quá cảnh các nước đòi thương đội của bạn: ' + [0, 3, 9, 4, 7].filter(n => n !== G.nation).map(n => esc(LT.NATIONS[n].n) + ' ' + Math.round(LT.natToll(G, n) * 1000) / 10 + '%').join(' · ') + ' (mỗi thành họ đi qua tính một nửa).</div>';
  return h;
}
ACT.trTransit = el => { LT.t2(G).transit = +el.dataset.v; renderTrade(); };
ACT.trCho = el => { G.pol.cho = +el.dataset.v; renderTrade(); };

function trLedgerTab() {
  const T = LT.t2(G), L = T.ledger, row = (n, v) => '<div class="flowrow"><span>' + n + '</span><b class="' + (v >= 0 ? 'pos' : 'neg') + '">' + (v >= 0 ? '+' : '') + fm(Math.round(v)) + '</b></div>';
  let h = '<div class="grid2"><div><h3>Tổng từ đầu ván</h3>' + row('Mua bán trực tiếp ở chợ (ròng)', L.mk) + row('Thương đội đường bộ (lãi/lỗ)', L.car) + row('Hải thương (lãi/lỗ)', L.sea) + row('Thương lộ nội bộ (phí)', L.int) + row('Thuế quá cảnh thu được', L.transit) + '<div class="hint">Chi tiết từng dòng: 📒 Sổ sách → Tiền (có các dòng "Thương đội…", "Bán … ở chợ", "Thuế quá cảnh…").</div></div><div><h3>Giá chợ bạn đang bị dịch chuyển</h3>';
  const sk = Object.keys(T.shift); h += sk.length ? sk.map(k => '<div class="flowrow"><span>' + LT.GOODS[k].i + ' ' + LT.GOODS[k].n + '</span><b class="' + (T.shift[k] > 1 ? 'neg' : 'pos') + '">×' + f1(T.shift[k]) + '</b></div>').join('') : '<div class="mut">Giá chợ đang ở mức tự nhiên.</div>';
  h += '</div></div><h3>Các chuyến gần đây</h3>';
  if (!T.hist.length) return h + '<div class="mut">Chưa có thương đội nào về.</div>';
  h += '<table class="t2"><tr><th>Đi</th><th>Hàng</th><th>Đến</th><th class="r">Số</th><th class="r">Mất</th><th class="r">Lãi / lỗ</th><th>Ghi chú</th></tr>' + T.hist.map(x => '<tr><td>' + x.y + ' T' + x.wk + '</td><td>' + LT.GOODS[x.give].i + (x.back ? '→' + LT.GOODS[x.back].i : '') + '</td><td>' + esc(x.dest) + (x.sea ? ' ⚓' : '') + '</td><td class="r">' + fm(Math.round(x.qty)) + '</td><td class="r">' + (x.lost ? fm(Math.round(x.lost)) : '—') + '</td><td class="r ' + (x.profit >= 0 ? 'pos' : 'neg') + '">' + (x.profit >= 0 ? '+' : '') + fm(Math.round(x.profit)) + '</td><td class="hint">' + esc(x.status === 'ok' ? x.log.join(' · ') : (x.status === 'cut' ? 'Bị cắt tuyến. ' : 'Mất hàng. ') + x.log.join(' · ')) + '</td></tr>').join('') + '</table>';
  return h;
}

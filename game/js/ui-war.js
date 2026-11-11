'use strict';
// ============================================================================
// QUÂN VỤ: đội quân, mộ quân, tướng; BÀY TRẬN 3×3 + dự bị + phục binh, 8 trận hình, lệnh 3 giai đoạn,
// quân lệnh, ước tính tỉ lệ thắng; CHIẾN BÁO từng hiệp.
// ============================================================================
const U_ = LT.UNITS;
function openArmy(tab) { UI.panel = 'army'; UI.tab.army = tab || UI.tab.army || 'quan'; LT.ensureFormation(G); renderArmy(true); }
ACT.armyTab = el => { UI.tab.army = el.dataset.t; renderArmy(); };
function renderArmy(first) {
  const t = UI.tab.army; let body = '';
  if (t === 'quan') body = armyQuan(); else if (t === 'tran') body = lineupHTML(null); else body = armyTuong();
  const html = shell('⚔️ Quân vụ — ' + LT.RANKS[G.rank].n, [['quan', '🪖 Đội quân'], ['tran', '🧩 Bày trận'], ['tuong', '🎖️ Tướng lĩnh']], t, 'armyTab', body);
  if (first || !modalOpen() || UI.panel !== 'army') openModal(html, 'wide'); else setModal(html);
}
function armyQuan() {
  const n = LT.armyCount(G), cap = LT.armyCap(G), barr = LT.count(G, 'barracks');
  let h = '<p class="hint">Quân tối đa ở chức ' + LT.RANKS[G.rank].n + ': <b>' + cap + '</b> (mỗi đơn vị ≤ ' + LT.unitCap(G) + ' lính, ≤ ' + LT.maxUnits(G) + ' đơn vị). Quân doanh: <b>' + barr + '</b> (mỗi doanh luyện 300 lính, huấn luyện +1,5/tuần; không có doanh chỉ lên tới 40). Mỗi lính ăn 0,06 thạch + lĩnh 0,05 quan mỗi tuần' + (G.rank === 1 ? ' (hương binh chỉ phụ cấp 30%)' : '') + '. Hiện nuôi <b>' + fm(LT.armyDemandWeek(G)) + '</b> thạch/tuần.</p>';
  h += '<table class="t2"><tr><th>Đơn vị</th><th class="r">Quân</th><th>Huấn luyện</th><th>Sĩ khí</th><th class="r">Trang bị</th><th class="r">Hành động</th></tr>';
  for (const u of G.units) {
    const d = U_[u.type], ec = LT.equipCost(u);
    h += '<tr><td data-tip="' + esc('<b>' + d.n + '</b> Công ' + d.cong + ' · Thủ ' + d.thu + '<br>' + d.d) + '"><b>' + d.i + ' ' + d.n + '</b>' + (u.tan > 0 ? '<span class="tag y">tân binh · luyện còn ' + Math.ceil(u.tan) + ' tuần</span>' : '') + (u.from != null ? '<div class="hint">từ ' + esc(G.world.cities[u.from].n) + '</div>' : '') + '</td><td class="r">' + Math.round(u.n) + '</td><td style="width:110px">' + bar(u.hl, 100, colorOf(u.hl, 100)) + '<span class="hint">' + Math.round(u.hl) + '</span></td><td style="width:110px">' + bar(u.sk, 100, colorOf(u.sk, 100)) + '<span class="hint">' + Math.round(u.sk) + '</span></td><td class="r">cấp ' + u.tb + '</td><td class="r"><button class="btn2" data-act="reinf" data-id="' + u.id + '" data-tip="Bổ sung tối đa +' + Math.min(LT.unitCap(G) - u.n, 50) + ' lính">➕</button> <button class="btn2" data-act="equip" data-id="' + u.id + '" data-tip="Nâng trang bị lên cấp ' + (u.tb + 1) + ': ' + LT.costTxt(ec) + ' (mỗi cấp +8% Công và Thủ)">⬆ Trang bị</button> <button class="btn2" data-act="disch" data-id="' + u.id + '" data-tip="Giải ngũ: lính về làm lưu dân">✖</button></td></tr>';
  }
  if (!G.units.length) h += '<tr><td colspan="6" class="mut">Chưa có quân. Dựng Quân doanh rồi mộ quân bên dưới.</td></tr>';
  h += '</table><div style="margin-top:6px"><button class="btn2" data-act="mergeU" data-tip="Gộp các đơn vị tàn cùng binh chủng và cùng nguồn dân thành đơn vị đầy hơn (tối đa ' + LT.unitCap(G) + ' lính)">🧩 Gộp đơn vị tàn</button></div><h3>Mộ quân mới — dân → tân binh → quân</h3>';
  const sel = UI.recType || 'truongthuong', cnt = UI.recN || Math.min(50, LT.unitCap(G)), from = UI.recFrom != null && G.world.cities[UI.recFrom] && G.world.cities[UI.recFrom].mine && UI.recFrom !== G.seatId ? UI.recFrom : null, many = UI.recK || 1;
  const m = LT.month(G.week), busy = m <= 2 || m === 9;
  h += '<div class="grid2"><div><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><select class="sel" data-chg="recType">' + LT.UNIT_IDS.map(k => '<option value="' + k + '"' + (k === sel ? ' selected' : '') + '>' + U_[k].i + ' ' + U_[k].n + (U_[k].rank > G.rank ? ' (cần ' + LT.RANKS[U_[k].rank].n + ')' : '') + '</option>').join('') + '</select>';
  h += '<input class="inp" type="number" min="10" step="' + Math.max(10, Math.round(LT.unitCap(G) / 20)) + '" max="' + LT.unitCap(G) + '" value="' + cnt + '" data-inp="recN" style="width:96px"> lính × <input class="inp" type="number" min="1" max="12" value="' + many + '" data-inp="recK" style="width:56px"> đơn vị</div>';
  h += '<div style="margin-top:6px" class="hint">Lấy đinh tráng từ: <select class="sel" data-chg="recFromSel"><option value="">Thành trị sở (' + LT.fmtN(G.H.luu + G.H.nong + G.H.cong) + ' hộ có thể động viên, hộ binh ' + LT.fmtN(G.H.binh) + ')</option>' + LT.ownedCities(G).map(c => '<option value="' + c.id + '"' + (from === c.id ? ' selected' : '') + '>' + esc(c.n) + ' (' + LT.fmtN(c.ho) + ' hộ, đã động viên ' + Math.round(c.binh / Math.max(1, c.ho + c.binh) * 100) + '%)</option>').join('') + '</select></div>';
  const cost = LT.recruitCost(sel, cnt), err = LT.canRecruit(G, sel, cnt, from), need = Math.ceil(cnt / LT.LINH_PER_HO), short = LT.shortfall(G, cost);
  h += '<div class="hint" style="margin-top:6px">Mỗi đơn vị cần <b>' + need + ' hộ</b> (' + LT.LINH_PER_HO + ' lính/hộ, hộ thành hộ binh ngừng làm việc), giá ' + LT.costTxt(cost) + (short > 0 ? ' · thiếu hàng, mua bù giá ×1,5 tốn ' + Math.round(short) + ' quan' : '') + '; luyện ' + LT.trainWeeks(sel) + ' tuần trong quân doanh (tối đa ' + LT.fmtN(LT.count(G, 'barracks') * LT.barracksCap(G)) + ' lính cùng lúc). ' + (busy ? '<span class="neg">Đang mùa bận (cấy, gặt): bắt lính làm dân oán gấp đôi và sản lượng ruộng ×0,8.</span> ' : '') + (err ? '<span class="neg">' + esc(err) + '</span>' : '<span class="pos">Có thể mộ</span>') + '</div><button class="btn sm" style="margin-top:6px" data-act="recruit">Mộ quân</button></div>';
  h += '<div class="box"><b>Dòng chảy dân → quân</b><br>Hộ binh: <b>' + LT.fmtN(G.H.binh) + '</b> (' + Math.round(LT.mobilization(G) * 100) + '% dân trị sở) · tân binh đang luyện: <b>' + LT.fmtN(LT.trainingCount(G)) + '</b> · quân đã luyện: <b>' + LT.fmtN(LT.campArmy(G)) + '</b><div class="hint">Lính chết mất hộ vĩnh viễn; giải ngũ trả hộ về làm dân. Bắt nhiều lính thì ruộng thiếu người, thành thiếu thợ (xem tầng lớp trong 📜 Triều chính). Binh khí do Lò rèn / Xưởng binh khí, ngựa do Mã phường; kỵ binh cần mã phường, trọng kỵ và nỏ cần thêm xưởng binh khí; đơn vị Công thành chỉ từ Phòng ngự sứ.</div></div></div>';
  h += '<h3>Bảng binh chủng (GP §9.2)</h3><table class="t2"><tr><th>Binh chủng</th><th class="r">Công</th><th class="r">Thủ</th><th>Đặc điểm</th><th>Cần</th></tr>';
  for (const k of LT.UNIT_IDS) { const d = U_[k]; h += '<tr><td><b>' + d.i + ' ' + d.n + '</b></td><td class="r">' + d.cong + (d.ranged ? ' (bắn)' : '') + '</td><td class="r">' + d.thu + '</td><td class="mut" style="font-size:11px">' + d.d + '</td><td class="mut" style="font-size:11px">' + (d.need ? d.need.split('+').map(x => B[x].n).join(' + ') : 'Quân doanh') + (d.rank > 1 ? ' · ' + LT.RANKS[d.rank].n : '') + '</td></tr>'; }
  return h + '</table>';
}
ACT.recType = el => { UI.recType = el.value; renderArmy(); };
ACT.recFromSel = el => { UI.recFrom = el.value === '' ? null : +el.value; renderArmy(); };
ACT.recK = el => { UI.recK = Math.max(1, Math.min(12, Math.round(+el.value) || 1)); };
ACT.recN = el => { UI.recN = Math.max(10, Math.min(LT.unitCap(G), Math.round(+el.value / 10) * 10 || 10)); };
ACT.recruit = () => { const from = UI.recFrom != null && G.world.cities[UI.recFrom] && G.world.cities[UI.recFrom].mine && UI.recFrom !== G.seatId ? UI.recFrom : null; let n = 0, err = ''; for (let i = 0; i < (UI.recK || 1); i++) { const r = LT.recruit(G, UI.recType || 'truongthuong', UI.recN || 50, from); if (r.ok) n++; else { err = r.err; break; } } toast(n ? 'Đã mộ ' + n + ' đơn vị tân binh' + (err ? ' (dừng vì: ' + err + ')' : '') : err, n ? 'good' : 'bad'); if (n) G.formation.auto = true; renderArmy(); ui(); };
ACT.reinf = el => { const r = LT.reinforce(G, +el.dataset.id, 50); toast(r.ok ? 'Đã bổ sung quân' : r.err, r.ok ? 'good' : 'bad'); renderArmy(); ui(); };
ACT.equip = el => { const r = LT.upgradeEquip(G, +el.dataset.id); toast(r.ok ? 'Đã nâng trang bị' : r.err, r.ok ? 'good' : 'bad'); renderArmy(); ui(); };
ACT.disch = el => { LT.discharge(G, +el.dataset.id); toast('Đã giải ngũ'); renderArmy(); ui(); };
function armyTuong() {
  let h = '<p class="hint">Tướng lĩnh có 5 thuộc tính: <b>Thống</b> (cầm quân, áp cho toàn quân khi làm chủ tướng), <b>Võ</b>, <b>Trí</b> (trá bại, mưu kế), <b>Chính</b>, <b>Đức</b>. Chức ' + LT.RANKS[G.rank].n + ' được nuôi tối đa ' + LT.maxGens(G) + ' tướng, bổng 12 quan/năm mỗi người.</p>';
  h += '<table class="t2"><tr><th>Tướng</th><th class="r">Thống</th><th class="r">Võ</th><th class="r">Trí</th><th class="r">Chính</th><th class="r">Đức</th><th>Đặc tính</th><th></th></tr>';
  h += '<tr><td><b>' + esc(G.name) + ' (bạn)</b></td><td class="r">' + G.player.tong + '</td><td class="r">' + G.player.vo + '</td><td class="r">' + G.player.tri + '</td><td class="r">' + G.player.chinh + '</td><td class="r">' + G.player.duc + '</td><td class="mut">chủ tướng mặc định</td><td></td></tr>';
  for (const gn of G.gens) h += '<tr><td><b>' + esc(gn.name) + '</b></td><td class="r">' + gn.tong + '</td><td class="r">' + gn.vo + '</td><td class="r">' + gn.tri + '</td><td class="r">' + gn.chinh + '</td><td class="r">' + gn.duc + '</td><td class="mut">' + gn.trait + '</td><td class="r"><button class="btn2" data-act="chief" data-id="' + gn.id + '">' + (G.formation.chiefGen === gn.id ? '✔ Chủ tướng' : 'Làm chủ tướng') + '</button> <button class="btn2" data-act="fireGen" data-id="' + gn.id + '">Cho nghỉ</button></td></tr>';
  h += '</table><div style="margin-top:10px"><button class="btn" data-act="hireGen">Chiêu mộ tướng (40 quan)</button> <span class="hint">Thống của chủ tướng quyết định số quân lệnh: 2 + Thống ÷ 25 = <b>' + (2 + Math.floor(LT.chiefTong(G) / 25)) + '</b>.</span></div>';
  return h;
}
ACT.hireGen = () => { const r = LT.hireGeneral(G); toast(r.ok ? 'Đã chiêu mộ ' + r.gen.name : r.err, r.ok ? 'good' : 'bad'); renderArmy(); ui(); };
ACT.fireGen = el => { const i = G.gens.findIndex(x => x.id === +el.dataset.id); if (i >= 0) G.gens.splice(i, 1); LT.ensureFormation(G); renderArmy(); };
ACT.chief = el => { const id = +el.dataset.id; G.formation.chiefGen = G.formation.chiefGen === id ? null : id; renderArmy(); };

// ============================ BỘ SOẠN TRẬN ===================================================
function warCtx() { return G.pendingBattle ? { pb: G.pendingBattle } : { pb: null }; }
function enemyInfoHTML(pb) {
  const e = pb.enemy, units = LT.sideUnits(e);
  let h = '<div class="sidebox"><b class="neg">' + esc(pb.enemyName) + '</b> — ' + Math.round(units.reduce((a, u) => a + u.n, 0)) + ' quân · trận hình <b>' + LT.FORMATIONS[e.form].n + '</b>' + (e.form === 'yennguyet' ? ' (' + (e.wing === 'left' ? 'cánh trái' : 'cánh phải') + ' mạnh)' : '') + '<div class="hint">' + LT.FORMATIONS[e.form].d + '</div>';
  h += '<div class="lineup" style="margin-top:6px"><div></div>' + LT.COLN.map(c => '<div class="lab">' + c + '</div>').join('');
  for (let r = 0; r < 3; r++) { h += '<div class="lab">' + LT.ROWN[r] + '</div>'; for (let c = 0; c < 3; c++) { const u = e.grid[r][c]; h += '<div class="slot ' + (u ? 'has' : '') + '">' + (u ? '<div class="u">' + U_[u.type].i + ' ' + U_[u.type].n + '</div><div class="hint">' + Math.round(u.n) + ' · HL ' + u.hl + ' · SK ' + u.sk + (u.tb > 1 ? ' · TB' + u.tb : '') + '</div>' : '<span class="mut">trống</span>') + '</div>'; } }
  h += '</div>' + (e.reserve.length ? '<div class="hint">Dự bị: ' + e.reserve.map(u => U_[u.type].n + ' ' + Math.round(u.n)).join(', ') + '</div>' : '') + '<div class="hint">Chủ tướng địch: Thống ' + e.chief.tong + ' · Trí ' + e.chief.tri + ' · Địa hình: <b>' + LT.TERRAINS[pb.terrain].n + '</b> (' + LT.TERRAINS[pb.terrain].d + ')' + (pb.holder === 'B' ? ' — địch giữ cao' : '') + '</div></div>';
  return h;
}
function lineupHTML(pb) {
  const f = LT.ensureFormation(G), avail = G.units, used = new Set([...f.slots, ...f.reserve, f.ambush].filter(Boolean));
  const terrain = pb ? pb.terrain : (UI.pracTerrain || 'dongbang'), canAmb = terrain === 'rung' || terrain === 'doi';
  const unitOpt = (cur, i) => '<option value="">— trống —</option>' + avail.filter(u => u.id === cur || !used.has(u.id)).map(u => '<option value="' + u.id + '"' + (u.id === cur ? ' selected' : '') + '>' + U_[u.type].i + ' ' + U_[u.type].n + ' (' + Math.round(u.n) + ')</option>').join('');
  const genOpt = (uid) => '<option value="">tướng: —</option>' + G.gens.map(gn => '<option value="' + gn.id + '"' + (f.genOf[uid] === gn.id ? ' selected' : '') + '>' + esc(gn.name) + ' (Thống ' + gn.tong + ')</option>').join('');
  const maxC = 2 + Math.floor(LT.chiefTong(G) / 25);
  let h = '';
  if (pb) h += enemyHeader(pb);
  h += '<div class="grid2" style="grid-template-columns:1.15fr 1fr"><div>';
  h += '<h3 style="margin-top:0">Đội hình của bạn <button class="btn2" data-act="autoLine" style="float:right">🪄 Tự xếp trận</button></h3><div class="lineup"><div></div>' + LT.COLN.map(c => '<div class="lab">' + c + '</div>').join('');
  for (let r = 0; r < 3; r++) {
    h += '<div class="lab">' + LT.ROWN[r] + '</div>';
    for (let c = 0; c < 3; c++) {
      const i = r * 3 + c, id = f.slots[i], u = id ? G.units.find(x => x.id === id) : null;
      h += '<div class="slot ' + (u ? 'has' : '') + (i === 4 ? ' center' : '') + '" ' + (i === 4 ? 'data-tip="Trung quân: chủ tướng đứng đây. Nếu trung quân vỡ, toàn quân tan và mất 30 sĩ khí."' : '') + '>' + (u ? '<div class="u">' + U_[u.type].i + ' ' + Math.round(u.n) + '</div><div class="hint">HL ' + Math.round(u.hl) + ' · SK ' + Math.round(u.sk) + ' · TB' + u.tb + '</div>' : '') + '<select class="sel" data-chg="slotSet" data-i="' + i + '">' + unitOpt(id, i) + '</select>' + (u && G.gens.length ? '<select class="sel" data-chg="slotGen" data-u="' + u.id + '">' + genOpt(u.id) + '</select>' : '') + '</div>';
    }
  }
  h += '</div><div class="grid2" style="margin-top:8px;gap:8px"><div class="sidebox">Dự bị (vào trận theo quân lệnh):<br>';
  for (let k = 0; k < 3; k++) { const id = f.reserve[k]; h += '<select class="sel" style="width:100%;margin-top:3px" data-chg="resSet" data-k="' + k + '">' + unitOpt(id, k) + '</select>'; }
  h += '</div><div class="sidebox">Phục binh ' + (canAmb ? '' : '<span class="mut">(chỉ ở rừng, đồi)</span>') + ':<br><select class="sel" style="width:100%;margin-top:3px" data-chg="ambSet" ' + (canAmb ? '' : 'disabled') + '>' + unitOpt(f.ambush, 0) + '</select><div class="hint">Đánh sườn một đòn ×1,4 ở hiệp 3.</div><div style="margin-top:6px">Chủ tướng:<br><select class="sel" style="width:100%" data-chg="chiefSet"><option value="">' + esc(G.name) + ' (Thống ' + G.player.tong + ')</option>' + G.gens.map(gn => '<option value="' + gn.id + '"' + (f.chiefGen === gn.id ? ' selected' : '') + '>' + esc(gn.name) + ' (Thống ' + gn.tong + ', Trí ' + gn.tri + ')</option>').join('') + '</select></div></div></div>';
  h += '</div><div>';
  h += '<h3 style="margin-top:0">Trận hình</h3><select class="sel" style="width:100%" data-chg="formSet">' + LT.FORM_IDS.map(k => '<option value="' + k + '"' + (f.form === k ? ' selected' : '') + '>' + LT.FORMATIONS[k].n + '</option>').join('') + '</select>';
  h += '<div class="hint" style="margin:4px 0">' + LT.FORMATIONS[f.form].d + '</div>';
  if (f.form === 'yennguyet') h += '<div class="radio">' + [['left', 'Cánh trái mạnh'], ['right', 'Cánh phải mạnh']].map(w => '<button class="btn2 ' + (f.wing === w[0] ? 'on' : '') + '" data-act="wingSet" data-v="' + w[0] + '">' + w[1] + '</button>').join('') + '</div>';
  h += '<h3>Lệnh ba giai đoạn</h3>';
  for (const [ph, nm] of [['p1', '1. Tiếp cận (hiệp 1–2)'], ['p2', '2. Giáp chiến (hiệp 3–8)'], ['p3', '3. Quyết định (hiệp 9–12)']]) {
    h += '<div class="hint" style="margin-top:4px"><b>' + nm + '</b></div><div class="radio">' + LT.ORDERS[ph].map(o => '<button class="btn2 ' + (f.orders[ph] === o.id ? 'on' : '') + '" data-act="ordSet" data-ph="' + ph + '" data-v="' + o.id + '" data-tip="' + esc(o.d) + '" style="font-size:11px;padding:5px 6px">' + o.n + '</button>').join('') + '</div>';
  }
  h += '<h3>Quân lệnh "nếu… thì…" (' + f.conds.length + '/' + maxC + ')</h3>';
  for (const c of LT.CONDS) { const on = f.conds.includes(c.id); h += '<label class="hint" style="display:flex;gap:6px;margin:3px 0;cursor:pointer" data-tip="' + esc(c.d) + '"><input type="checkbox" data-chg="condSet" data-id="' + c.id + '" ' + (on ? 'checked' : '') + '><span>' + c.n + '</span></label>'; }
  h += '</div></div>';
  // dự báo
  const cfg = pb ? LT.battleCfg(G, pb) : practiceCfg();
  const est = cfg ? LT.estimateWin(cfg, 60) : null;
  h += '<div class="box" style="margin-top:10px;display:flex;gap:16px;align-items:center;flex-wrap:wrap">';
  if (est) h += '<div style="min-width:170px"><div class="hint">Ước tính (60 lần mô phỏng)</div><div style="font:700 28px var(--serif);color:' + (est.win >= .6 ? 'var(--good)' : est.win >= .4 ? 'var(--warn)' : 'var(--bad)') + '">' + Math.round(est.win * 100) + '% thắng</div><div class="hint">hòa ' + Math.round(est.draw * 100) + '% · thua ' + Math.round(est.lose * 100) + '%</div></div><div style="flex:1;min-width:240px">' + bar(est.win * 100, 100, est.win >= .6 ? 'g' : est.win >= .4 ? 'y' : 'r') + '<div class="hint" style="margin-top:4px">Công thức công khai: <b>Lực = Quân × Công × Khắc × Trận hình × Địa hình × Lệnh × (0,5+HL÷200) × (0,5+SK÷200) × (1+Thống÷200) × (1+0,08×(TB−1))</b>; thương vong = Lực ÷ (Thủ địch × 20). Ô trống là điểm yếu (bị đánh sườn).</div></div>';
  else h += '<div class="mut">Chưa có quân để ước tính.</div>';
  h += '</div>';
  if (!pb) h += practiceBar();
  return h;
}
function enemyHeader(pb) {
  let h = '<p>' + esc(pb.text) + '</p>' + enemyInfoHTML(pb);
  return h;
}
function practiceCfg() {
  const tmp = { rs: (UI.pracSeed = UI.pracSeed || 777), year: G.year, rank: G.rank, week: G.week, nation: G.nation };
  const mine = LT.buildPlayerSide(G, G.formation), my = LT.sideN(mine), sc = UI.pracScale || 1;
  const total = Math.max(60, Math.round(my > 0 ? my * sc : LT.raidSize(G) * .9));
  const chief = { name: 'Thủ lĩnh', tong: 45, tri: 45 };
  const e = total > 1500 ? LT.bigSide(tmp, 'Địch diễn tập', total, null, {}) : LT.aiSide('Giặc cỏ (diễn tập)', LT.makeComp(tmp, total, 'giac'), chief, {});
  e.form = UI.pracForm || 'phuong';
  const terrain = UI.pracTerrain || 'dongbang';
  return { A: mine, B: e, terrain, holder: terrain === 'doi' ? 'B' : null, nameA: G.name, nameB: 'Địch (diễn tập)', _practice: true, enemy: e };
}
function practiceBar() {
  const cfg = practiceCfg();
  let h = '<h3>Diễn tập sa bàn (không ảnh hưởng thành)</h3><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><label class="hint">Địa hình: <select class="sel" data-chg="pracTer">' + Object.keys(LT.TERRAINS).map(k => '<option value="' + k + '"' + ((UI.pracTerrain || 'dongbang') === k ? ' selected' : '') + '>' + LT.TERRAINS[k].n + '</option>').join('') + '</select></label><label class="hint">Quân địch so với quân ta: <select class="sel" data-chg="pracScale">' + [[.5, '0,5×'], [1, '1×'], [1.5, '1,5×']].map(x => '<option value="' + x[0] + '"' + ((UI.pracScale || 1) === x[0] ? ' selected' : '') + '>' + x[1] + '</option>').join('') + '</select></label><label class="hint">Trận hình địch: <select class="sel" data-chg="pracForm">' + LT.FORM_IDS.map(k => '<option value="' + k + '"' + ((UI.pracForm || 'phuong') === k ? ' selected' : '') + '>' + LT.FORMATIONS[k].n + '</option>').join('') + '</select></label><span class="hint">Địch ~' + Math.round(LT.sideTotal(cfg.B)) + ' quân (' + LT.sideUnits(cfg.B).map(u => U_[u.type].n + ' ' + u.n).join(', ') + ')</span><button class="btn" data-act="practiceRun">▶ Diễn tập trận này</button>';
  h += '<button class="btn2" data-act="tieuphi" data-tip="Đi đánh sơn trại thật: thắng có quân công, chiến lợi phẩm; thua tổn hại uy vọng.">🏹 Tiễu phỉ thật' + (G.cdTieuphi > 0 ? ' (chờ ' + G.cdTieuphi + ' tuần)' : '') + '</button></div>';
  return h;
}
ACT.pracScale = el => { UI.pracScale = +el.value; rerenderWar(); };
ACT.mergeU = () => { const n = LT.mergeUnits(G); toast(n ? 'Đã gộp ' + n + ' đơn vị tàn' : 'Không có đơn vị tàn cùng loại để gộp', n ? 'good' : ''); renderArmy(); ui(); };
ACT.pracTer = el => { UI.pracTerrain = el.value; rerenderWar(); };
ACT.pracForm = el => { UI.pracForm = el.value; rerenderWar(); };
ACT.practiceRun = () => { const cfg = practiceCfg(); if (!LT.sideTotal(cfg.A)) { toast('Chưa xếp quân nào vào trận', 'bad'); return; } const rep = LT.runBattle(cfg, Math.floor(Math.random() * 1e9)); rep.title = 'Diễn tập sa bàn'; rep.kind = 'practice'; rep.outcome = { lines: ['Đây chỉ là diễn tập: không có thương vong thật, không cướp phá, không chiến lợi phẩm.'] }; showBattleReport(rep, true); };
ACT.tieuphi = () => { const r = LT.startTieuphi(G); if (!r.ok) { toast(r.err, 'bad'); return; } closeModal(); };

function rerenderWar() { if (G.pendingBattle) showBattlePrep(true); else if (UI.panel === 'army') renderArmy(); }
function fchg(fn) { fn(G.formation); G.formation.auto = false; rerenderWar(); }
ACT.autoLine = () => { G.formation.auto = true; LT.ensureFormation(G); rerenderWar(); };
ACT.slotSet = el => fchg(f => { const i = +el.dataset.i, id = el.value ? +el.value : null; for (let k = 0; k < 9; k++) if (f.slots[k] === id && id) f.slots[k] = null; f.reserve = f.reserve.filter(x => x !== id); if (f.ambush === id) f.ambush = null; f.slots[i] = id; });
ACT.slotGen = el => fchg(f => { const gid = el.value ? +el.value : null, uid = +el.dataset.u; for (const k in f.genOf) if (f.genOf[k] === gid) delete f.genOf[k]; if (gid) f.genOf[uid] = gid; else delete f.genOf[uid]; });
ACT.resSet = el => fchg(f => { const k = +el.dataset.k, id = el.value ? +el.value : null; for (let j = 0; j < 9; j++) if (f.slots[j] === id && id) f.slots[j] = null; f.reserve = f.reserve.filter(x => x !== id); if (f.ambush === id) f.ambush = null; const old = f.reserve.slice(); if (id) old.splice(Math.min(k, old.length), 0, id); f.reserve = old.slice(0, 3); });
ACT.ambSet = el => fchg(f => { const id = el.value ? +el.value : null; for (let j = 0; j < 9; j++) if (f.slots[j] === id && id) f.slots[j] = null; f.reserve = f.reserve.filter(x => x !== id); f.ambush = id; });
ACT.chiefSet = el => fchg(f => { f.chiefGen = el.value ? +el.value : null; });
ACT.formSet = el => fchg(f => { f.form = el.value; });
ACT.wingSet = el => fchg(f => { f.wing = el.dataset.v; });
ACT.ordSet = el => fchg(f => { f.orders[el.dataset.ph] = el.dataset.v; });
ACT.condSet = el => fchg(f => { const id = el.dataset.id, maxC = 2 + Math.floor(LT.chiefTong(G) / 25), i = f.conds.indexOf(id); if (el.checked) { if (f.conds.length >= maxC) { toast('Chỉ soạn được ' + maxC + ' quân lệnh (2 + Thống ÷ 25)', 'bad'); } else f.conds.push(id); } else if (i >= 0) f.conds.splice(i, 1); });

// ============================ TRẬN THẬT ===================================================
function showBattlePrep(keep) {
  const pb = G.pendingBattle; if (!pb) return; G.speed = 0; UI.panel = 'battle';
  let h = '<div class="head"><div><div class="kick" style="margin:0">' + ({ giac: 'GIẶC ĐẾN', tieuphi: 'TIỄU PHỈ', loan: 'DÂN LOẠN', nation: 'NƯỚC LÁNG GIỀNG XÂM LẤN', campaign: 'CHIẾN DỊCH · DÃ CHIẾN', siege: 'CHIẾN DỊCH · CÔNG THÀNH' }[pb.kind]) + '</div><h2>⚔️ ' + esc(pb.title) + '</h2></div></div>';
  h += lineupHTML(pb);
  h += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;align-items:center"><button class="btn btn-red" data-act="fight" style="padding:11px 26px;font-size:14px">⚔ Xuất trận</button>';
  if (pb.canHold) h += '<button class="btn2 ' + (pb.mode === 'thu' ? 'on' : '') + '" data-act="holdMode" data-tip="Thủ thành: quân thủ nhân Thủ với (1 + cấp tường × 0,5). Cấp tường = thành phòng ÷ 25 (hiện ' + pb.wallLevel + ').">🏯 ' + (pb.mode === 'thu' ? 'Đang thủ thành (cấp tường ' + pb.wallLevel + ')' : 'Dã chiến ngoài thành') + ' — đổi</button>';
  if (pb.kind === 'loan') h += '<button class="btn2" data-act="appease" data-tip="Giảm lao dịch, mở kho: dân tâm +15, tốn 100 thạch + 50 quan">🤝 Ban ơn (100 thạch + 50 quan)</button>';
  if (pb.ransom) h += '<button class="btn2" data-act="ransom">💰 Nộp ' + pb.ransom + ' quan chuộc</button>';
  if (pb.canAuto) h += '<button class="btn2" data-act="autoDef" data-tip="Không đem quân dã chiến đi: quân đồn trú và tường thành tự giữ thành">🏯 Để thành tự thủ</button>';
  if (pb.kind === 'campaign' || pb.kind === 'siege') h += '<button class="btn2" data-act="retreatBtn">🏳 Rút quân về</button>';
  if (pb.kind !== 'nation' && pb.kind !== 'campaign' && pb.kind !== 'siege') h += '<button class="btn2" data-act="ignoreFoe">🏳 ' + (pb.kind === 'tieuphi' ? 'Bỏ qua' : 'Mặc kệ') + '</button>';
  h += '</div>';
  if (modalOpen() && UI.panel === 'battle' && keep) setModal(h); else openModal(h, 'wide', false);
}
ACT.autoDef = () => { const rep = LT.autoDefend(G); if (!rep) { toast('Không thể tự thủ ở đây', 'bad'); return; } showBattleReport(rep, false); ui(); };
ACT.retreatBtn = () => { LT.retreatCampaign(G); closeModal(); toast('Đã rút quân'); ui(); };
ACT.holdMode = () => { G.pendingBattle.mode = G.pendingBattle.mode === 'thu' ? 'da' : 'thu'; showBattlePrep(); };
ACT.fight = () => {
  if (!LT.sideTotal(LT.buildPlayerSide(G, LT.ensureFormation(G)))) { toast('Chưa xếp quân nào vào trận! Dùng "Tự xếp trận".', 'bad'); return; }
  const rep = LT.resolveBattle(G); showBattleReport(rep, false); ui();
};
ACT.ransom = () => { const r = LT.payRansom(G); toast(r.ok ? 'Đã nộp tiền chuộc, giặc rút lui' : r.err, r.ok ? '' : 'bad'); if (r.ok) { closeModal(); ui(); } };
ACT.ignoreFoe = () => { const r = LT.ignoreRaid(G); if (r.ok) { toast(r.lines && r.lines[0] ? r.lines[0] : 'Đã bỏ qua', 'bad'); closeModal(); ui(); } else toast(r.err || 'Không được', 'bad'); };
ACT.appease = () => { const r = LT.appease(G); toast(r.ok ? 'Dân loạn tản đi, dân tâm +15' : r.err, r.ok ? 'good' : 'bad'); if (r.ok) { closeModal(); ui(); } };

// ============================ CHIẾN BÁO ==================================================
function formulaTxt(l) {
  const x = l.fx || {}, p = n => f1(n);
  return '<b>' + l.atk + '</b> ' + Math.round(l.atkN) + ' quân × Công ' + p(x.cong) + ' × khắc ' + p(l.khac) + ' × trận hình ' + p(x.form) + ' × địa hình ' + p(x.terrain) + ' × lệnh ' + p(x.ord) + ' × huấn luyện ' + p(x.hl) + ' × sĩ khí ' + p(x.sk) + ' × tướng ' + p(x.tong) + ' × trang bị ' + p(x.tb) + ' × (sườn/xung phong/khác ' + p(x.special) + ') × biến thiên ngẫu nhiên ' + p(x.rv) + ' × mệt mỏi ' + p(x.fatf) + ' = Lực <b>' + Math.round(l.luc) + '</b>; thương vong = Lực ÷ (Thủ ' + p(l.thu) + ' × 20) = <b>' + p(l.cas) + '</b> đánh <b>' + l.tgt + '</b>.';
}
function colSummary(hp) {
  const t = { A: [0, 0, 0], B: [0, 0, 0] };
  for (const l of hp.lines) { const X = l.s === 'A' ? 'B' : 'A'; if (l.tcol != null) t[X][l.tcol] += l.cas; }
  return ['A', 'B'].map(X => (X === 'A' ? 'ta' : 'địch') + ' mất: tả ' + LT.fmtN(t[X][0]) + ' · giữa ' + LT.fmtN(t[X][1]) + ' · hữu ' + LT.fmtN(t[X][2])).join(' | ');
}
function showBattleReport(rep, practice) {
  const R = rep, nm = R.names, S = R.sum, win = R.result === 'A', lose = R.result === 'B';
  const why = { rout: 'một bên tan vỡ', retreat: 'một bên thu quân', hiep12: 'hết 12 hiệp' }[R.why] || '';
  let h = '<div class="head"><div><div class="kick" style="margin:0">CHIẾN BÁO · ' + esc(LT.TERRAINS[R.terrain].n).toUpperCase() + '</div><h2>' + (practice ? '🧪 ' : win ? '🏆 ' : lose ? '💀 ' : '⚖️ ') + esc(R.title || 'Trận đánh') + ' — ' + (win ? 'THẮNG' : lose ? 'THUA' : 'HÒA') + '</h2></div><button class="x" data-act="close">✕</button></div>';
  h += '<p class="hint">Kết thúc ở hiệp ' + R.hieps.length + ' (' + why + ').' + (R.pursuit ? ' Kỵ binh bên ' + (R.pursuit.side === 'A' ? nm.A : nm.B) + ' truy kích, gây thêm ' + Math.round(R.pursuit.pct * 100) + '% thương vong cho bên tan vỡ (≈ ' + Math.round(R.pursuit.cas) + ' người).' : '') + '</p>';
  h += '<table class="t2"><tr><th></th><th class="r">Quân đầu trận</th><th class="r">Còn lại</th><th class="r">Thương vong</th><th class="r">Đơn vị vỡ</th><th class="r">Tướng tử trận</th></tr>';
  for (const X of ['A', 'B']) h += '<tr><td><b class="' + (X === 'A' ? 'pos' : 'neg') + '">' + esc(nm[X]) + '</b></td><td class="r">' + S[X].start + '</td><td class="r">' + S[X].end + '</td><td class="r">' + S[X].lost + ' (' + Math.round(S[X].lost / Math.max(1, S[X].start) * 100) + '%)</td><td class="r">' + (S[X].broken + S[X].dead) + '</td><td class="r">' + S[X].gensDied + '</td></tr>';
  h += '</table>';
  if (R.outcome && R.outcome.lines.length) h += '<div class="box" style="margin:8px 0"><b>Hậu quả:</b><ul style="margin:4px 0;padding-left:18px">' + R.outcome.lines.map(l => '<li>' + esc(l) + '</li>').join('') + '</ul></div>';
  // ví dụ công thức từ dòng đầu tiên có thật
  let ex = null; for (const hp of R.hieps) { ex = hp.lines.find(l => l.s === 'A'); if (ex) break; }
  if (ex) h += '<div class="hint">Ví dụ dòng tính đầu tiên của bạn: ' + formulaTxt(ex) + '</div>';
  const big = Math.max(S.A.start, S.B.start) >= 20000;
  if (big) h += '<p class="hint"><b>Đại chiến ' + LT.fmtN(S.A.start) + ' – ' + LT.fmtN(S.B.start) + ' quân.</b> Mỗi ô là một quân đoàn; mỗi hiệp có dòng tóm tắt thương vong theo cánh, bấm vào hiệp để xem từng dòng tính.</p>';
  h += '<h3>Diễn biến từng hiệp</h3><div class="report">';
  R.hieps.forEach(hp => {
    h += '<details class="hiep" ' + (!big && (hp.n <= 3 || hp.n === R.hieps.length) ? 'open' : '') + '><summary><b>Hiệp ' + hp.n + '</b> · ' + ['', 'tiếp cận', 'giáp chiến', 'quyết định'][hp.phase] + ' — ta mất <b class="neg">' + f1(hp.loss.A) + '</b>, địch mất <b class="pos">' + f1(hp.loss.B) + '</b> · còn ' + hp.after.A.n + ' / ' + hp.after.B.n + '</summary>';
    h += '<div class="ln mut">Tóm tắt theo cánh — ' + colSummary(hp) + '</div>';
    for (const e of hp.ev) h += '<div class="ln ev">' + (e.s === 'A' ? '⭐ ' : '') + esc(e.txt) + '</div>';
    if (!hp.lines.length) h += '<div class="ln mut">Hai bên chưa giao chiến (đang tiếp cận / lùi).</div>';
    for (const l of hp.lines) h += '<div class="ln ' + l.s + '" data-tip="' + esc(formulaTxt(l)) + '">' + (l.s === 'A' ? esc(nm.A) : esc(nm.B)) + ' · ' + l.atk + ' [' + l.atkPos + '] ' + ({ shoot: 'bắn', melee: 'đánh', weak: 'đánh yếu', phuc: 'phục kích' }[l.mode] || 'đánh') + ' ' + l.tgt + ' [' + l.tgtPos + ']: <b>' + f1(l.cas) + '</b> thương vong (Lực ' + Math.round(l.luc) + ' ÷ ' + f1(l.thu * 20) + ')' + (l.khac !== 1 ? ' · khắc ×' + f1(l.khac) : '') + ' · biến thiên ' + (l.fx && l.fx.rv >= 1 ? '+' : '−') + Math.round(Math.abs(((l.fx ? l.fx.rv : 1) - 1)) * 100) + '%' + (l.fx && l.fx.fatf < 1 ? ' · mệt −' + Math.round((1 - l.fx.fatf) * 100) + '%' : '') + (l.flank ? ' · <b>đánh sườn</b>' : '') + (l.charge ? ' · <b>xung phong ×1,8</b>' : '') + '</div>';
    const su = ['A', 'B'].map(X => (hp.units[X] || []).map(u => LT.UNITS[u.type].n + ' ' + u.n + '/SK ' + u.sk + (u.broken ? ' (vỡ)' : '')).join('; '));
    h += '<div class="ln mut">Sau hiệp — ta: ' + esc(su[0] || '—') + '<br>địch: ' + esc(su[1] || '—') + '</div></details>';
  });
  h += '</div><div style="margin-top:12px"><button class="btn" data-act="' + (practice ? 'backArmy' : 'close') + '">' + (practice ? 'Quay lại bày trận' : 'Đã rõ') + '</button></div>';
  openModal(h, 'wide', !practice ? false : true);
}
ACT.backArmy = () => { UI.panel = 'army'; renderArmy(true); };

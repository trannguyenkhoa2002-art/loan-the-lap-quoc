// Phát lại trận đánh theo thời gian: thanh giằng co hai màu, quân/sĩ khí từng hiệp, ba cánh, lưới 3×3, sự kiện.
// Kết quả KHÔNG đổi: trận đã được LT.runBattle tính xong (và áp dụng vào ván) trước khi phát; ở đây chỉ trình diễn lại LT.replayPlan(rep).
const RP_HD = 1.7, RP_FIN = 1.6, RP_SMALL = 3000;
const rpGet = () => { try { return localStorage.getItem('lt-skip-small') === '1'; } catch (e) { return false; } };
const rpSet = v => { try { localStorage.setItem('lt-skip-small', v ? '1' : '0'); } catch (e) { } };
function showBattleReport(rep, practice) {
  const S = rep.sum, small = Math.max(S.A.start, S.B.start) < RP_SMALL;
  if (!rep.hieps || !rep.snap0 || (small && rpGet())) { showBattleReportFull(rep, practice); return; }
  rpStart(rep, practice);
}
function rpStop() { if (UI.rp && UI.rp.timer) clearInterval(UI.rp.timer); UI.rp = null; }
function rpStart(rep, practice) {
  rpStop();
  const plan = LT.replayPlan(rep), nm = rep.names, N = plan.steps.length;
  const total = N * RP_HD + RP_FIN;
  const rp = UI.rp = { rep, plan, practice, t: 0, speed: 1, paused: false, id: Date.now() + Math.random(), total, lastIdx: -1, feedN: 0, finDone: false, finShown: false, last: performance.now() };
  if (G) { G.speed = 0; UI.panel = 'replay'; }
  const wing = ['Tả', 'Trung', 'Hữu'].map((w, i) => '<div class="rpw"><span>' + w + '</span><div class="rpb"><i id="rpW' + i + '"></i></div></div>').join('');
  const h = '<div class="head"><div><div class="kick" style="margin:0">' + (practice ? 'DIỄN TẬP · ' : 'TRẬN ĐÁNH · ') + esc(LT.TERRAINS[rep.terrain].n).toUpperCase() + '</div><h2>' + esc(rep.title || 'Trận đánh') + '</h2></div><div class="rpph" id="rpPh">Chuẩn bị</div></div>' +
    '<div class="rpnames"><div class="ta"><b>' + esc(nm.A) + '</b><span id="rpNA"></span></div><div class="rpmid" id="rpHiep">Hiệp 0 / ' + N + '</div><div class="td"><b>' + esc(nm.B) + '</b><span id="rpNB"></span></div></div>' +
    '<div class="rpbar" data-tip="Ranh giới = sức chiến đấu còn lại của hai bên (quân số × sĩ khí của các đơn vị chưa vỡ). Ranh giới bị đẩy về phía bên yếu hơn."><div class="a" id="rpFA"></div><div class="mk" id="rpMk"></div><div class="pct l" id="rpPA">50%</div><div class="pct r" id="rpPB">50%</div><div class="banner" id="rpBn"></div></div>' +
    '<div class="rpwings">' + wing + '</div>' +
    '<div class="rpmain"><div><div class="hint rpc">Quân ta (hàng đầu ở trên)</div><div class="rpgrid" id="rpGA"></div></div><div class="rpfeed" id="rpFeed"></div><div><div class="hint rpc">Quân địch</div><div class="rpgrid" id="rpGB"></div></div></div>' +
    '<div class="rpctl"><button class="btn2" id="rpPause" data-act="rpPause">⏸ Tạm dừng</button>' + [1, 2, 4].map(v => '<button class="btn2 rps" data-act="rpSpeed" data-v="' + v + '">x' + v + '</button>').join('') + '<button class="btn2" data-act="rpSkip">⏭ Bỏ qua</button><label class="hint"><input type="checkbox" data-chg="rpSmall"' + (rpGet() ? ' checked' : '') + '> Luôn bỏ qua trận nhỏ (dưới ' + LT.fmtN(RP_SMALL) + ' quân)</label><span style="flex:1"></span><button class="btn" id="rpDone" data-act="rpDone" style="display:none">📜 Xem chiến báo</button></div>';
  openModal(h, 'wide', false);
  rpDraw(rp);
  rp.timer = setInterval(() => {
    if (!UI.rp || UI.rp.id !== rp.id || !document.getElementById('rpFA')) { clearInterval(rp.timer); return; }
    const now = performance.now(), dt = Math.min(.25, (now - rp.last) / 1000); rp.last = now;
    if (!rp.paused && !rp.finDone) rp.t = Math.min(rp.total, rp.t + dt * rp.speed);
    rpDraw(rp);
  }, 33);
}
const rpLerp = (a, b, e) => a + (b - a) * e, rpEase = f => f * f * (3 - 2 * f);
function rpState(rp) {
  const P = rp.plan, st = P.steps, N = st.length;
  if (rp.t >= N * RP_HD) { const f = Math.min(1, (rp.t - N * RP_HD) / RP_FIN), last = st[N - 1] || P.start; return { idx: N, f, fin: true, pos: rpLerp(last.pos, P.final.pos, rpEase(f)), cur: last, prev: last, e: 1 }; }
  const idx = Math.min(N - 1, Math.floor(rp.t / RP_HD)), f = (rp.t - idx * RP_HD) / RP_HD, prev = idx ? st[idx - 1] : P.start, cur = st[idx], e = rpEase(Math.min(1, f / .8));
  return { idx, f, fin: false, prev, cur, e, pos: rpLerp(prev.pos, cur.pos, e) };
}
function rpGridHTML(g, cls) {
  let h = '';
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    const u = g[r][c];
    h += u ? '<i class="' + cls + (u.b ? ' br' : '') + '" style="' + (u.b ? '' : 'opacity:' + (.35 + .65 * Math.min(1, u.sk / 100)).toFixed(2)) + '" data-tip="' + esc(LT.UNITS[u.t].n + ': ' + u.n + ' quân, sĩ khí ' + u.sk + (u.b ? ' (đã vỡ)' : '')) + '">' + (u.b ? '✕' : (LT.UNITS[u.t].i || '·')) + '</i>' : '<i class="em"></i>';
  }
  return h;
}
function rpDraw(rp) {
  const $$ = id => document.getElementById(id); if (!$$('rpFA')) return;
  const S = rpState(rp), N = rp.plan.steps.length, cur = S.cur, prev = S.prev, e = S.e;
  const pos = Math.max(0, Math.min(1, S.pos)), lerp = k => rpLerp(prev[k], cur[k], e);
  $$('rpFA').style.width = (pos * 100).toFixed(2) + '%'; $$('rpMk').style.left = (pos * 100).toFixed(2) + '%';
  $$('rpPA').textContent = Math.round(pos * 100) + '%'; $$('rpPB').textContent = Math.round((1 - pos) * 100) + '%';
  $$('rpNA').textContent = LT.fmtN(Math.round(lerp('nA'))) + ' quân · sĩ khí ' + Math.round(lerp('skA')); $$('rpNB').textContent = LT.fmtN(Math.round(lerp('nB'))) + ' quân · sĩ khí ' + Math.round(lerp('skB'));
  for (let i = 0; i < 3; i++) { const w = $$('rpW' + i), has = cur.colsHas[i] || prev.colsHas[i]; w.style.width = (has ? rpLerp(prev.cols[i], cur.cols[i], e) * 100 : 50).toFixed(1) + '%'; w.parentNode.parentNode.classList.toggle('none', !has); }
  const shown = S.fin ? N : S.idx + (S.f >= .35 ? 1 : 0);   // số hiệp đã "xảy ra"
  $$('rpHiep').textContent = rp.t <= 0 ? 'Hiệp 0 / ' + N : 'Hiệp ' + (S.fin ? N : S.idx + 1) + ' / ' + N;
  $$('rpPh').textContent = S.fin ? 'Kết thúc' : ['', 'Tiếp cận', 'Giáp chiến', 'Quyết định'][cur.phase];
  if (shown !== rp.lastIdx) {
    rp.lastIdx = shown; const feed = $$('rpFeed');
    for (let i = rp.feedN; i < shown; i++) {
      const s = rp.plan.steps[i];
      let html = '<div class="rph">Hiệp ' + s.n + ' · ' + ['', 'tiếp cận', 'giáp chiến', 'quyết định'][s.phase] + ' — ta mất ' + LT.fmtN(Math.round(s.lossA)) + ', địch mất ' + LT.fmtN(Math.round(s.lossB)) + '</div>';
      for (const ev of s.ev) html += '<div class="rpe ' + ev.s + '">' + (/VỠ|vỡ|tiêu diệt|tử trận/.test(ev.txt) ? '💥 ' : ev.t === 'cond' ? '📜 ' : '⚔ ') + esc(ev.txt) + '</div>';
      feed.insertAdjacentHTML('beforeend', html);
    }
    rp.feedN = shown; feed.scrollTop = feed.scrollHeight;
    const g = shown ? rp.plan.steps[shown - 1] : rp.plan.start; $$('rpGA').innerHTML = rpGridHTML(g.gridA, 'ua'); $$('rpGB').innerHTML = rpGridHTML(g.gridB, 'ub');
  }
  if (S.fin && !rp.finShown) { rp.finShown = true; for (const ev of rp.plan.final.ev) $$('rpFeed').insertAdjacentHTML('beforeend', '<div class="rpe ' + ev.s + '">🏇 ' + esc(ev.txt) + '</div>'); $$('rpFeed').scrollTop = 1e9; }
  if (S.fin && S.f >= .999) { rp.finDone = true; const R = rp.plan.final.result, bn = $$('rpBn'); bn.textContent = R === 'A' ? '🏆 THẮNG' : R === 'B' ? '💀 THUA' : '⚖️ HÒA'; bn.className = 'banner on ' + (R === 'A' ? 'w' : R === 'B' ? 'l' : 'd'); $$('rpDone').style.display = ''; }
  document.querySelectorAll('.rps').forEach(b => b.classList.toggle('on', +b.dataset.v === rp.speed));
  $$('rpPause').textContent = rp.paused ? '▶ Tiếp tục' : '⏸ Tạm dừng';
}
ACT.rpPause = () => { if (UI.rp) { UI.rp.paused = !UI.rp.paused; rpDraw(UI.rp); } };
ACT.rpSpeed = el => { if (UI.rp) { UI.rp.speed = +el.dataset.v; rpDraw(UI.rp); } };
ACT.rpSmall = el => rpSet(el.checked);
ACT.rpSkip = () => { const rp = UI.rp; if (!rp) return; const rep = rp.rep, pr = rp.practice; rpStop(); showBattleReportFull(rep, pr); };
ACT.rpDone = ACT.rpSkip;

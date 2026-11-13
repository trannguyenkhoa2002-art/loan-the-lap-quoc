'use strict';
// ============================================================================
// HÌNH NGƯỜI, NGỰA, XE — vẽ bằng Canvas 2D (không ảnh ngoài), dựng sẵn thành sprite theo (loại, biến thể, hướng, khung, bậc tỉ lệ).
//  - tỉ lệ 3 phần đầu–thân–chân, tay chân tách rời, bóng mềm dưới chân, viền nhẹ
//  - nông dân, thợ, thương nhân, sĩ nhân, quan, tăng, phu, lính (giáo/cung/cờ), giặc, phụ nữ, trẻ em, kỵ binh, ngựa
//  - đi 6 khung (Thấp: 3 khung), 2 hướng gốc (mặt/lưng) × lật trái-phải, dáng đứng yên
//  - bộ nhớ sprite có trần theo chế độ đồ họa, loại cái dùng lâu nhất; xa thì giản lược
// ============================================================================
const FIGS = (function () {
  const OUTC = '#2b3034', LW = .6, TAU = 6.2832;
  const SK = ['#f1c9a5', '#ebbf98', '#dcab80', '#f5d6b8'], HAIR = ['#2a211c', '#3a2a20', '#4a3626', '#1f1a18'];
  const poly = (g, pts, fill, stroke) => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke !== false) { g.strokeStyle = OUTC; g.lineWidth = LW; g.lineJoin = 'round'; g.stroke(); } };
  const ell = (g, x, y, rx, ry, fill, stroke, rot) => { g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, TAU); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = OUTC; g.lineWidth = LW; g.stroke(); } };
  const seg = (g, x0, y0, x1, y1, w, col) => { g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.strokeStyle = OUTC; g.lineWidth = w + LW * 1.7; g.stroke(); g.strokeStyle = col; g.lineWidth = w; g.stroke(); };
  const seg2 = (g, a, m, b, w, col) => { g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(m[0], m[1]); g.lineTo(b[0], b[1]); g.strokeStyle = OUTC; g.lineWidth = w + LW * 1.7; g.stroke(); g.strokeStyle = col; g.lineWidth = w; g.stroke(); };
  const thin = (g, x0, y0, x1, y1, w, col) => { g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.strokeStyle = col; g.lineWidth = w; g.stroke(); };
  const lgrad = (g, x0, x1, col) => { const gr = g.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, shade(col, -.2)); gr.addColorStop(.55, col); gr.addColorStop(1, shade(col, .12)); return gr; };
  const shadow = (g, r) => { g.save(); g.scale(1, .38); const gr = g.createRadialGradient(0, 0, 0, 0, 0, r); gr.addColorStop(0, 'rgba(24,40,32,.38)'); gr.addColorStop(.6, 'rgba(24,40,32,.2)'); gr.addColorStop(1, 'rgba(24,40,32,0)'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill(); g.restore(); };

  // ---------- bảng loại người: tham số theo biến thể ----------
  const pick = (a, v) => a[v % a.length];
  const KINDS = {
    nong: v => ({ body: pick(['#8a6a4a', '#7d7a52', '#9a7b52'], v), pants: '#5f5240', robe: 0, hat: 'non', hatCol: pick(['#d9c27a', '#cdb46a', '#e0cb8a'], v), item: pick(['hoe', 'pole', 'basket'], v), load: 'lua' }),
    cong: v => ({ body: pick(['#6b7f8f', '#7f8a6b', '#8a7260'], v), pants: '#4e4a42', robe: 0, hat: 'khan', hatCol: pick(['#5a6b7a', '#7a5a4a', '#4f5f4a'], v), item: 'hammer', apron: '#6b4a2e' }),
    thuong: v => ({ body: pick(['#2f7a73', '#7a3f6e', '#c4902f', '#3c4f8a'], v), robe: 1, hat: 'turban', hatCol: pick(['#e8e0c8', '#c9a24a', '#4a3a52', '#d8d0b0'], v), item: v % 4 === 3 ? 'barrow' : 'purse', belt: '#4a3524' }),
    si: v => ({ body: pick(['#e8e4d0', '#9fb7c9', '#b9c9a0'], v), robe: 1, wide: 1, hat: 'futou', wing: 3.4, hatCol: '#1f1b1a', item: 'scroll', belt: '#6a5a8a' }),
    quan: v => ({ body: pick(['#a8242a', '#6a3a8a', '#2f6a4a'], v), robe: 1, wide: 1, hat: 'futou', wing: 8, hatCol: '#1a1616', item: 'hot', belt: '#d4aa4a', collar: '#f0ead6' }),
    tang: v => ({ body: pick(['#d08a2a', '#8a8a78', '#8a3a2a'], v), robe: 1, hat: 'bald', item: pick(['staff', 'beads', 'bowl'], v), flap: pick(['#a8641c', '#6a6a58', '#6a2a1c'], v) }),
    phu: v => ({ body: pick(['#8a7058', '#7a6a4a', '#6a5a48'], v), pants: '#4e4538', robe: 0, hat: 'khan', hatCol: '#b8a67a', item: 'pole', load: pick(['sack', 'basket', 'lua'], v), sleeveless: 1 }),
    binh: v => ({ body: pick(['#7a2f2a', '#6a3a2a', '#7a3a2f'], v), pants: '#3f3a36', robe: 0, armor: 1, hat: 'helm', item: pick(['spear', 'bow', 'flag'], v) }),
    giac: v => ({ body: pick(['#4a2f2a', '#3a3a30', '#5a3a30'], v), pants: '#2f2a26', robe: 0, hat: 'band', hatCol: pick(['#c0392b', '#a02820', '#d04a30'], v), item: 'saber', ragged: 1 }),
    nu: v => ({ body: pick(['#c76f7a', '#5f87b0', '#6f9a5c', '#d0a050'], v), skirt: pick(['#8a5a4a', '#4a5a7a', '#5a6a4a', '#7a5a3a'], v), robe: 2, hat: v % 2 ? 'scarf' : 'bun', hatCol: pick(['#d8c8a8', '#b8d0d8', '#e0b0a0', '#c8d8b0'], v), item: pick(['basket', 'none', 'headbasket', 'none'], v), sc: .97 }),
    be: v => ({ body: pick(['#d6504a', '#4aa0d0', '#e0b030', '#6ab04a'], v), pants: '#6a5a48', robe: 0, hat: 'topknot', item: v % 3 === 1 ? 'toy' : 'none', sc: .66, bigHead: 1.28, bounce: 1.9, skin: 3 }),
    luu: v => ({ body: pick(['#8a7a6a', '#6a7a8a', '#8a6a6a'], v), pants: '#5a5042', robe: 0, hat: v % 2 ? 'khan' : 'bun', hatCol: '#7a6a52', item: 'none' }),
  };

  // ---------- người ----------
  function figure(g, o) {
    const V = KINDS[o.kind](o.v), back = o.back, simple = o.simple, bg = V.bigHead || 1;
    const t = o.moving ? o.fr / o.NF * TAU : 0, st = Math.sin(t), c2 = Math.cos(t), bob = o.moving ? -Math.abs(c2) * (V.bounce || 1) : 0;
    const hipY = -9 + bob, shY = -16.8 + bob, headY = -20.9 + bob, skin = SK[(V.skin != null ? V.skin : (o.v + o.kind.length) % 3)];
    g.save(); const sc = V.sc || 1; g.scale(sc, sc);
    shadow(g, 7.2);
    const hx = back ? -.1 : .55;
    const handA = [-3.3 - st * 1.7, -10.3 + bob - Math.abs(st) * .35], handB = [3.3 + st * 1.7, -10.3 + bob - Math.abs(st) * .35];
    const geo = { st, c2, bob, shY, hipY, headY, hx, back, V, t, simple, handA, handB, skin };
    // vật cầm / đeo phía sau
    if (V.item === 'hoe') itemHoeBack(g, geo);
    if (V.item === 'bow') itemQuiver(g, geo);
    // chân
    const robed = V.robe > 0;
    const leg = (x0, ph, col, dark) => {
      const sw = o.moving ? Math.sin(t + ph) * 3.3 : 0, lift = o.moving ? Math.max(0, Math.cos(t + ph)) * 2 : 0, fxp = x0 + sw, fy = -lift;
      if (robed) { ell(g, fxp + .5, fy - .3, 1.9, 1, dark ? '#3a2f28' : '#2a211c', true); return; }
      const hip = [x0, hipY + 1.2], foot = [fxp, fy - 1], knee = [(hip[0] + foot[0]) / 2 + .8 + (o.moving ? Math.max(0, Math.cos(t + ph)) * .9 : 0), (hip[1] + foot[1]) / 2 - .6];
      seg2(g, hip, knee, foot, 2.5, dark ? shade(col, -.28) : col);
      if (V.armor) { seg(g, knee[0], knee[1], foot[0], foot[1] - .4, 2.7, dark ? '#4a4742' : '#6a6862'); }
      ell(g, fxp + .8, fy - .2, 2, 1.1, dark ? '#2e2620' : '#3a2f28', true);
    };
    const lc = V.pants || shade(V.body, -.3);
    leg(-1.4, Math.PI, lc, true);
    // tay xa
    const sleeveW = V.wide ? 3.3 : (V.sleeveless ? 2.1 : 2.2), sleeveCol = V.sleeveless ? skin : V.body;
    const holdPole = V.item === 'pole' || V.item === 'hot' || V.item === 'barrow' || V.item === 'headbasket';
    const arm = (sx, h, far) => {
      let H = h; if (V.item === 'pole') H = [sx * 1.5 + (sx > 0 ? 3.2 : -3.4), shY + 1.2 + (o.moving ? c2 * .3 : 0)]; if (V.item === 'hot') H = [sx * .35 + .8, shY + 4.2]; if (V.item === 'barrow') H = [sx > 0 ? 8.5 : 6.5, hipY + .2]; if (V.item === 'headbasket') H = [sx * .9 + (sx > 0 ? 2.8 : -2.8), headY - 3.2];
      const el = [sx * 1.15 + (H[0] - sx) * .35 + (far ? -.6 : .8), (shY + 2.6 + H[1]) / 2 + .6];
      seg2(g, [sx, shY + .8], el, H, sleeveW, far ? shade(sleeveCol, -.16) : sleeveCol);
      if (!V.wide) ell(g, H[0], H[1] + .2, 1.15, 1.15, skin, true); else { ell(g, H[0], H[1] + 1.4, 1.1, 1.1, skin, true); }
      return H;
    };
    if (!(V.item === 'bow')) arm(-2.7, handA, true);
    // thân
    torso(g, geo, o, V);
    leg(1.4, 0, lc, false);
    // đầu
    head(g, geo, o, V, bg);
    // tay gần + vật cầm phía trước
    let HB = arm(2.7, handB, false);
    if (V.item === 'bow') { HB = [3.3 + st * .8, -13.8 + bob]; seg2(g, [-2.7, shY + .8], [-.8, shY + 3], [-4.8 - st * .6, -13 + bob], 2.2, shade(V.body, -.16)); ell(g, -4.8 - st * .6, -13 + bob, 1.1, 1.1, skin, true); seg2(g, [2.7, shY + .8], [3.6, shY + 3.4], [5.1, -13.4 + bob], 2.2, V.body); ell(g, 5.1, -13.4 + bob, 1.1, 1.1, skin, true); }
    geo.HB = HB;
    const IT = ITEMS[V.item]; if (IT) IT(g, geo, o, V);
    g.restore();
  }
  function torso(g, geo, o, V) {
    const { shY, hipY, st, back } = geo, sway = o.moving ? st * .9 : 0, body = V.body;
    if (V.robe === 1) { // áo dài tới gót, vạt đung đưa
      const top = shY, hem = -2.4, hw = V.wide ? 4.6 : 4;
      poly(g, [[-3.1, top], [3.1, top], [3.3, hipY], [hw + sway * .5, hem], [-hw + sway * .5, hem]], lgrad(g, -4, 4, body));
      thin(g, -hw * .8 + sway * .4, hem - .5, hw * .8 + sway * .4, hem - .5, .7, shade(body, -.32));
      if (!back) { thin(g, 0, top + .3, .3, hem - .5, .6, shade(body, -.35)); if (V.collar) { poly(g, [[-1.3, top], [0, top + 2.4], [1.3, top]], V.collar, false); } if (!geo.simple && V.item !== 'hot') thin(g, 0, top + .2, 1.1, top + 3.4, .7, shade(body, .25)); }
      if (V.belt) { poly(g, [[-3.2, hipY - .2], [3.4, hipY - .2], [3.4, hipY + 1.4], [-3.2, hipY + 1.4]], V.belt, false); thin(g, -3.2, hipY - .2, 3.4, hipY - .2, .5, OUTC); }
      if (V.flap) { poly(g, [[-3.1, top], [.9, top], [3.3, hipY + 1], [3.3, hipY + 3.5], [1, hipY + 3.5], [-3, top + 4]], V.flap); }
    } else if (V.robe === 2) { // phụ nữ: áo ngắn + váy loe
      poly(g, [[-3, shY + .6], [3, shY + .6], [2.6, hipY - 1.2], [-2.6, hipY - 1.2]], lgrad(g, -3, 3, V.body));
      const sk = V.skirt, hem = -2.2;
      poly(g, [[-2.8, hipY - 1.4], [2.8, hipY - 1.4], [4.6 + sway * .5, hem], [-4.6 + sway * .5, hem]], lgrad(g, -4.6, 4.6, sk));
      thin(g, -3.6 + sway * .4, hem - .5, 3.6 + sway * .4, hem - .5, .6, shade(sk, -.3));
      if (!back && !geo.simple) { thin(g, 0, shY + .8, .4, hipY - 1.4, .5, shade(V.body, -.3)); }
    } else {
      const top = shY, bot = hipY + (V.sleeveless || V.armor ? 1.8 : 3.2);
      poly(g, [[-3, top], [3, top], [2.7, bot], [-2.7, bot]], V.armor ? lgrad(g, -3, 3, body) : lgrad(g, -3, 3, body));
      if (V.sleeveless) { /* ngực trần áo yếm */ poly(g, [[-2.4, top + .3], [2.4, top + .3], [2.2, top + 6], [-2.2, top + 6]], shade(body, .08), false); }
      if (V.armor) { for (let i = 0; i < 4; i++) thin(g, -2.7, top + 1.6 + i * 1.7, 2.7, top + 1.6 + i * 1.7, .45, shade(body, -.4)); poly(g, [[-4.4, top - .3], [-2.4, top - .6], [-2.2, top + 2.3], [-4.5, top + 2.6]], '#8a8f94'); poly(g, [[4.4, top - .3], [2.4, top - .6], [2.2, top + 2.3], [4.5, top + 2.6]], '#9aa0a6'); thin(g, -3, hipY + .6, 3, hipY + .6, 1.1, '#3a2a20'); }
      if (V.apron) { poly(g, [[-2.1, top + 2], [2.1, top + 2], [2.6, hipY + 5], [-2.6, hipY + 5]], V.apron); thin(g, -2.1, top + 2, 2.1, top + 2, .6, shade(V.apron, -.4)); }
      if (V.ragged && !geo.simple) { thin(g, -2.6, bot, -2.2, bot + 1.4, .7, shade(body, -.2)); thin(g, 0, bot, .4, bot + 1.7, .7, shade(body, -.2)); thin(g, 2.5, bot, 2.1, bot + 1.1, .7, shade(body, -.2)); }
      if (!V.armor && !V.sleeveless) { thin(g, -2.8, hipY + .4, 2.8, hipY + .4, .9, shade(body, -.45)); if (!back) thin(g, 0, top + .2, .5, hipY, .5, shade(body, .3)); }
    }
  }
  function head(g, geo, o, V, bg) {
    const { hx, headY, back, simple, skin, st, bob } = geo, r = 3.1 * bg, cy = headY - (bg > 1 ? .5 : 0), hair = HAIR[(o.v + o.kind.length) % 4];
    ell(g, 0, geo.shY - .6, 1.3, 1.4, shade(skin, -.12), false);   // cổ
    ell(g, hx, cy, r, r * 1.04, skin, true);
    const hat = V.hat;
    // tóc
    if (back && hat !== 'bald') { ell(g, hx, cy, r * .98, r, hair, false); g.beginPath(); g.ellipse(hx, cy, r, r * 1.04, 0, 0, TAU); g.strokeStyle = OUTC; g.lineWidth = LW; g.stroke(); }
    else if (hat !== 'bald') { g.beginPath(); g.ellipse(hx, cy, r, r * 1.04, 0, Math.PI * 1.08, Math.PI * 1.98); g.lineTo(hx + r * .6, cy - r * .35); g.closePath(); g.fillStyle = hair; g.fill(); }
    else { g.beginPath(); g.ellipse(hx, cy - r * .35, r * .85, r * .55, 0, Math.PI * 1.1, Math.PI * 1.9); g.strokeStyle = 'rgba(80,60,40,.25)'; g.lineWidth = .8; g.stroke(); }
    if (!back && !simple) { ell(g, hx + 1.0 * bg, cy + .2, .42, .5, '#2a211c'); ell(g, hx + 2.2 * bg, cy + .2, .42, .5, '#2a211c'); thin(g, hx + 1.4 * bg, cy + 1.7 * bg, hx + 2 * bg, cy + 1.7 * bg, .35, 'rgba(120,60,50,.7)'); }
    if (V.hat === 'bun' || V.hat === 'scarf') { /* nón đặc biệt vẽ sau */ }
    HATS[hat] && HATS[hat](g, geo, o, V, r, cy, hair);
  }
  const HATS = {
    non(g, geo, o, V, r, cy) { const hx = geo.hx, col = V.hatCol; poly(g, [[hx - 6.4, cy - r * .25], [hx, cy - r - 4.8], [hx + 6.4, cy - r * .25]], col); ell(g, hx, cy - r * .22, 6.4, 1.6, shade(col, -.1), true); poly(g, [[hx - 5.2, cy - r * .4], [hx, cy - r - 4.8], [hx + 5.2, cy - r * .4]], col, false); if (!geo.simple) { thin(g, hx - 3, cy - r * .9, hx - .5, cy - r - 3.8, .4, shade(col, -.3)); thin(g, hx + 3, cy - r * .9, hx + .5, cy - r - 3.8, .4, shade(col, -.3)); } thin(g, hx - 3.4, cy - r * .1, hx - 2.4, cy + r * .6, .4, '#7a4a30'); },
    khan(g, geo, o, V, r, cy) { const hx = geo.hx, col = V.hatCol; g.beginPath(); g.ellipse(hx, cy - .4, r * 1.05, r * 1.02, 0, Math.PI, TAU); g.closePath(); g.fillStyle = col; g.fill(); g.strokeStyle = OUTC; g.lineWidth = LW; g.stroke(); thin(g, hx - r, cy - .2, hx + r, cy - .2, 1, shade(col, -.2)); ell(g, hx - r * .9, cy - .2, 1.1, 1, col, true); thin(g, hx - r * .9, cy, hx - r * 1.2, cy + 2 + (geo.st || 0) * .3, .8, col); },
    turban(g, geo, o, V, r, cy) { const hx = geo.hx, col = V.hatCol; g.beginPath(); g.ellipse(hx, cy - .7, r * 1.12, r * 1.08, 0, Math.PI, TAU); g.closePath(); g.fillStyle = col; g.fill(); g.strokeStyle = OUTC; g.lineWidth = LW; g.stroke(); if (!geo.simple) for (const k of [-1.6, 0, 1.6]) thin(g, hx - r + .7, cy - 1.4 + k * .6 - 1.2, hx + r - .5, cy - 1.8 + k * .8 - 1.2, .4, shade(col, -.25)); ell(g, hx + (geo.back ? -.5 : 1.8), cy - r - 1.3, 1.3, 1, col, true); },
    futou(g, geo, o, V, r, cy) { const hx = geo.hx; g.beginPath(); g.ellipse(hx, cy - .9, r * 1.02, r * 1.06, 0, Math.PI, TAU); g.closePath(); g.fillStyle = V.hatCol; g.fill(); g.strokeStyle = OUTC; g.lineWidth = LW; g.stroke(); poly(g, [[hx - 1.6, cy - r - .5], [hx + 1.8, cy - r - .5], [hx + 1.8, cy - r - 3.4], [hx - 1.6, cy - r - 3.4]], V.hatCol); const wl = V.wing, wy = cy - r - 1.6; poly(g, [[hx - wl, wy - .55], [hx + wl, wy - .55], [hx + wl, wy + .55], [hx - wl, wy + .55]], V.hatCol); thin(g, hx - wl + .3, wy - .1, hx + wl - .3, wy - .1, .35, 'rgba(255,255,255,.18)'); },
    helm(g, geo, o, V, r, cy) { const hx = geo.hx; g.beginPath(); g.ellipse(hx, cy - .6, r * 1.1, r * 1.1, 0, Math.PI, TAU); g.closePath(); g.fillStyle = lgrad(g, hx - r, hx + r, '#8f959b'); g.fill(); g.strokeStyle = OUTC; g.lineWidth = LW; g.stroke(); poly(g, [[hx - r * 1.05, cy - .5], [hx + r * 1.05, cy - .5], [hx + r * .9, cy + 1.1], [hx - r * .9, cy + 1.1]], '#7a8086'); if (!geo.back && !geo.simple) thin(g, hx + 1.5, cy - .5, hx + 1.6, cy + 1.6, .6, '#6a7076'); thin(g, hx, cy - r - .4, hx, cy - r - 2.6, 1.1, '#6f757b'); ell(g, hx, cy - r - 3, 1.3, 1.3, '#c0392b', true); thin(g, hx - .2, cy - r - 2.2, hx - 1.8, cy - r + .2 + Math.sin(geo.t) * .4, .8, '#c0392b'); },
    band(g, geo, o, V, r, cy) { const hx = geo.hx; g.beginPath(); g.ellipse(hx, cy - .6, r * 1.04, r * 1.04, 0, Math.PI * 1.03, Math.PI * 1.97); g.closePath(); g.fillStyle = HAIR[1]; g.fill(); thin(g, hx - r * .98, cy - 1.1, hx + r * .98, cy - 1.1, 1.5, V.hatCol); const fl = Math.sin(geo.t * 2 + 1) * 1.1; thin(g, hx - r * .9, cy - 1, hx - r - 3.3, cy + .4 + fl, 1.1, V.hatCol); thin(g, hx - r * .9, cy - .7, hx - r - 2.6, cy + 1.9 - fl, 1, shade(V.hatCol, -.15)); },
    bun(g, geo, o, V, r, cy, hair) { const hx = geo.hx; ell(g, hx - (geo.back ? 0 : 1.2), cy - r - .6, 1.9, 1.7, hair, true); if (V.hatCol && V.robe === 2) thin(g, hx - 1.8, cy - r + .1, hx + .2, cy - r - .8, .8, '#d8b86a'); },
    scarf(g, geo, o, V, r, cy) { const hx = geo.hx; g.beginPath(); g.ellipse(hx, cy - .4, r * 1.08, r * 1.08, 0, Math.PI * .98, TAU * 1.01); g.closePath(); g.fillStyle = V.hatCol; g.fill(); g.strokeStyle = OUTC; g.lineWidth = LW; g.stroke(); thin(g, hx - r, cy - .5, hx - r - 1.8, cy + 2.4, 1.5, V.hatCol); },
    topknot(g, geo, o, V, r, cy, hair) { const hx = geo.hx; ell(g, hx - 2.6, cy - r * .85, 1.5, 1.5, hair, true); ell(g, hx + 2.6, cy - r * .85, 1.5, 1.5, hair, true); thin(g, hx - 2.6, cy - r * .85, hx - 2.8, cy - r * .85 + 1.6, .5, '#c0392b'); },
    bald() { },
  };
  // ---------- vật cầm / đồ mang ----------
  const lua = (g, x, y, ph) => { for (const k of [-1.6, 0, 1.6]) poly(g, [[x + k - .2, y], [x + k + 1.6, y], [x + k * 1.4 + .7, y + 6.8]], pick(['#d8b84a', '#e0c258', '#c9a63e'], Math.abs(k) + 1)); thin(g, x - 2, y + 2.6, x + 2.8, y + 2.6, .9, '#7a5a30'); };
  const loadAt = (g, kind, x, y) => {
    if (kind === 'lua') lua(g, x - .6, y, 0);
    else if (kind === 'basket') { poly(g, [[x - 3, y], [x + 3, y], [x + 2.2, y + 5], [x - 2.2, y + 5]], '#b88a4a'); for (const k of [1.7, 3.4]) thin(g, x - 2.6, y + k, x + 2.6, y + k, .4, '#7a5a2a'); ell(g, x, y, 3, .9, '#d0a860', true); }
    else { ell(g, x, y + 3, 3.1, 3.5, '#cbbd96', true); thin(g, x - 2, y + 1.5, x + 2, y + 1.5, .5, '#8a7a56'); thin(g, x, y - .3, x, y + 1.2, .8, '#6a5a3a'); }
  };
  const ITEMS = {
    hoe(g, geo, o, V) { const H = geo.HB, e = [H[0] - 8.6, geo.shY - 5.5]; seg(g, H[0], H[1] - .5, e[0], e[1], 1.1, '#7a5a38'); poly(g, [[e[0] - 2.4, e[1] - 1], [e[0] + 1.2, e[1] - 1.2], [e[0] + 1.4, e[1] + 2.6], [e[0] - 1.4, e[1] + 2.4]], '#8d9399'); ell(g, H[0], H[1] + .1, 1.2, 1.2, geo.skin, true); },
    pole(g, geo, o, V) { const y0 = geo.shY - .6 + geo.bob * .2, sw = o.moving ? Math.sin(geo.t * 2) * 1.1 : 0, L = [-10.5, y0 + sw], R = [10.5, y0 - sw]; thin(g, L[0], L[1] + .2, R[0], R[1] + .2, 2.3, OUTC); thin(g, L[0], L[1], R[0], R[1], 1.5, '#8a6a3c'); for (const [E, sgn] of [[L, 1], [R, -1]]) { thin(g, E[0], E[1], E[0] - sgn * .6, E[1] + 5.2, .5, '#5a4a30'); loadAt(g, V.load, E[0] - sgn * .6, E[1] + 5.2); } },
    basket(g, geo, o, V) { const H = geo.HB; ell(g, H[0] + 1, H[1] + 2.6, 3.1, 2.6, '#b88a4a', true); thin(g, H[0] - 1.8, H[1] + 2.2, H[0] + 3.8, H[1] + 2.2, .4, '#7a5a2a'); thin(g, H[0] - .6, H[1] + .6, H[0] + 2.4, H[1] + .6, .5, '#7a5a2a'); ell(g, H[0] + 1, H[1] + 0.2, 2.6, .8, '#d8a860', true); },
    hammer(g, geo, o, V) { const H = geo.HB, up = o.moving ? Math.sin(geo.t) * 1.4 : 0; seg(g, H[0] - .5, H[1] + .6 - up, H[0] + 2.8, H[1] - 6.4 - up, 1, '#7a5a38'); poly(g, [[H[0] + .6, H[1] - 8 - up], [H[0] + 5.2, H[1] - 6.6 - up], [H[0] + 4.7, H[1] - 4.5 - up], [H[0] + .2, H[1] - 5.9 - up]], '#7e848a'); },
    purse(g, geo, o, V) { const y = geo.hipY + 1.8; thin(g, -3, geo.hipY + .3, 3.4, geo.hipY + 1.4, .7, '#4a3524'); ell(g, 3.4, y + 1.6, 1.6, 1.9, '#9a7a3a', true); thin(g, 3.4, y - .1, 3.4, y - .9, .6, '#e0c060'); },
    barrow(g, geo, o, V) { const rot = o.moving ? geo.t : 0; thin(g, 5.2, geo.hipY + .4, 13, -6.2, 1, '#6a4a28'); thin(g, 6.4, geo.hipY + 1.3, 14, -5.6, 1, '#7a5a38'); poly(g, [[7.5, -8.6], [15.5, -8.2], [14.7, -5.6], [8.2, -5.8]], '#a98458'); ell(g, 10.5, -10.6, 2.6, 2.3, '#c8b890', true); ell(g, 13.6, -10.2, 2.1, 2, '#c47a4a', true); poly(g, [[8.4, -9.4], [10, -12.8], [11.6, -9.4]], '#7a9a5a'); ell(g, 12.4, -3.6, 3.6, 3.6, '#4b4937', true); for (let i = 0; i < 4; i++) { const a = rot * .5 + i * 1.5708; thin(g, 12.4, -3.6, 12.4 + Math.cos(a) * 3.2, -3.6 + Math.sin(a) * 3.2, .5, '#c2a26a'); } },
    scroll(g, geo, o, V) { const H = geo.HB; g.save(); g.translate(H[0] + .6, H[1] + .4); g.rotate(-.5); poly(g, [[-3, -1.2], [3, -1.2], [3, 1.2], [-3, 1.2]], '#efe6c8'); thin(g, -3, -.9, -3, .9, .9, '#c9b98a'); thin(g, 0, -1.2, 0, 1.2, .6, '#a8242a'); g.restore(); },
    hot(g, geo, o, V) { const y = geo.shY + 4, H = [1.4, y]; poly(g, [[-.4, y - 3.4], [3.2, y - 3.4], [3.2, y + 1.2], [-.4, y + 1.2]], '#efe8d0'); thin(g, 1.4, y - 3.4, 1.4, y + 1.2, .3, '#b8aa80'); },
    staff(g, geo, o, V) { const H = geo.HB, top = geo.shY - 8; seg(g, H[0] + 1.2, 0, H[0] + .4, top, 1.1, '#7a5a38'); for (const dy of [0, 1.5, 3]) ell(g, H[0] + .4, top + dy, 1.5, .6, '#c0c4c8', true); ell(g, H[0] + .8, H[1] + .2, 1.2, 1.2, geo.skin, true); },
    beads(g, geo, o, V) { const H = geo.HB; for (let i = 0; i < 7; i++) { const a = i / 6 * 2.4; ell(g, H[0] + Math.sin(a) * 1.8 + .4, H[1] + 1.4 + Math.cos(a) * 2.4, .6, .6, '#6a3a20', true); } },
    bowl(g, geo, o, V) { const H = geo.HB; ell(g, H[0] + .8, H[1] + .8, 2.2, 1.1, '#3a2a20', true); ell(g, H[0] + .8, H[1] + .5, 2.2, 1, '#6a4a2a', false); },
    spear(g, geo, o, V) { const H = geo.HB, x = H[0] + .6; seg(g, x - .2, 1, x + .5, -33, 1, '#6b4a2e'); poly(g, [[x - 1.4, -33], [x + 2.2, -33.2], [x + .4, -39.5]], '#d0d4d8'); thin(g, x + .4, -38.6, x + .4, -34, .4, 'rgba(255,255,255,.55)'); ell(g, x + .4, -31.8, 1.4, 1.2, '#c0392b', true); thin(g, x + .4, -31, x + .1, -28.6 + Math.sin(geo.t) * .4, .8, '#c0392b'); ell(g, H[0] + .6, H[1] + .2, 1.2, 1.2, geo.skin, true); },
    bow(g, geo, o, V) { const x = -5.4, y = -13.6 + geo.bob; g.beginPath(); g.moveTo(x + 1.4, y - 8.5); g.quadraticCurveTo(x - 4.8, y, x + 1.4, y + 8.5); g.strokeStyle = OUTC; g.lineWidth = 2.1; g.stroke(); g.strokeStyle = '#8a5a30'; g.lineWidth = 1.3; g.stroke(); thin(g, x + 1.4, y - 8.5, x + 1.4, y + 8.5, .4, '#e8e0c8'); },
    flag(g, geo, o, V) { const H = geo.HB, x = H[0] + .6, top = -39, w = o.moving ? Math.sin(geo.t * 2) * 1.2 : .4; seg(g, x - .2, 1, x, top, 1, '#6b4a2e'); poly(g, [[x, top + .5], [x + 9, top + 1 + w], [x + 8.2, top + 8 + w], [x, top + 8.5]], '#c0392b'); thin(g, x + 1, top + 4.5, x + 7, top + 4.7 + w * .6, 1.6, '#e8c04a'); ell(g, H[0] + .6, H[1] + .2, 1.2, 1.2, geo.skin, true); },
    saber(g, geo, o, V) { const H = geo.HB, up = o.moving ? Math.sin(geo.t) * 1.2 : 0, x = H[0] + .4, y = H[1] - .4 - up; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 5.6, y - 8, x + 5, y - 16); g.strokeStyle = OUTC; g.lineWidth = 2.2; g.stroke(); g.strokeStyle = '#d0d4d8'; g.lineWidth = 1.2; g.stroke(); ell(g, H[0], H[1], 1.2, 1.2, geo.skin, true); thin(g, x - 1.2, y, x + 1.6, y - .6, 1, '#6a4a20'); },
    toy(g, geo, o, V) { const H = geo.HB; thin(g, H[0], H[1], H[0] + 1.6, H[1] - 7.5, .7, '#7a5a38'); const s = Math.sin(geo.t * 2) * .8; poly(g, [[H[0] + 1.6, H[1] - 7.5], [H[0] + 5.2, H[1] - 8 + s], [H[0] + 5.2, H[1] - 5 + s]], '#e0504a'); },
    headbasket(g, geo, o, V) { const y = geo.headY - 3.6; ell(g, geo.hx, y - .3, 4.6, 1.8, '#b88a4a', true); poly(g, [[geo.hx - 3.6, y - .8], [geo.hx + 3.6, y - .8], [geo.hx + 2.6, y - 4.2], [geo.hx - 2.6, y - 4.2]], '#c79a56'); ell(g, geo.hx, y - 4.2, 2.6, .9, '#8a6a2a', true); },
    itemHoeBack() { },
  };
  function itemHoeBack() { }
  function itemQuiver(g, geo) { const x = geo.back ? 1.8 : -2.9, y = geo.shY + 1; g.save(); g.translate(x, y); g.rotate(.25); poly(g, [[-1.1, -1], [1.1, -1], [1, 8], [-1, 8]], '#6a4a2a'); for (const k of [-.7, 0, .7]) thin(g, k, -1, k * 1.6, -4.4, .4, '#e8e0c8'); g.restore(); }

  // ---------- ngựa và kỵ sĩ ----------
  const COATS = ['#856047', '#9a9a96', '#3a3430', '#a0522d', '#c8c0aa'];
  function horse(g, o, coat, rider) {
    const t = o.moving ? o.fr / o.NF * TAU : 0, bob = o.moving ? -Math.abs(Math.cos(t)) * .7 : 0, dk = shade(coat, -.3);
    g.save(); g.scale(1.18, 1.18); shadow(g, 11);
    const legs = [[5.4, 1.2, 0, true], [4.2, 1.3, Math.PI, false], [-5.2, 1.2, Math.PI * .5, true], [-4, 1.3, Math.PI * 1.5, false]];
    const drawLeg = (L, far) => { const [hx, , ph, front] = L, sw = o.moving ? Math.sin(t + ph) * 3.4 : 0, lift = o.moving ? Math.max(0, Math.cos(t + ph)) * 3.2 : 0, hip = [hx, -10.5 + bob], foot = [hx + sw, -lift - .5], knee = [(hip[0] + foot[0]) / 2 + (front ? .9 : -1.1), (hip[1] + foot[1]) / 2 - .4]; seg2(g, hip, knee, foot, 1.9, far ? shade(coat, -.34) : dk); ell(g, foot[0] + .4, foot[1] + .1, 1.5, 1, '#2e2a24', true); };
    drawLeg(legs[1], true); drawLeg(legs[3], true);
    // đuôi
    const tw = o.moving ? Math.sin(t * 2) * 1.6 : .5; g.beginPath(); g.moveTo(-8.2, -12.6 + bob); g.quadraticCurveTo(-12.5, -10 + tw, -11.5 + tw, -4.6); g.strokeStyle = OUTC; g.lineWidth = 3.4; g.lineCap = 'round'; g.stroke(); g.strokeStyle = shade(coat, -.4); g.lineWidth = 2.2; g.stroke();
    // thân
    ell(g, 0, -11.4 + bob, 8.8, 4.3, lgrad(g, -9, 9, coat), true); poly(g, [[5, -12.5 + bob], [7.6, -19.6 + bob], [11.2, -20.6 + bob], [9.4, -12.4 + bob]], coat);
    // đầu
    g.save(); g.translate(11.2, -20.4 + bob); g.rotate(.5); ell(g, 1.8, 0, 3.6, 2.1, coat, true); ell(g, 4.6, .5, 1.4, 1.5, shade(coat, .15), false); g.restore(); poly(g, [[8.3, -22 + bob], [9.1, -25.2 + bob], [10.1, -22.4 + bob]], coat); ell(g, 11.6, -21.2 + bob, .5, .5, '#161e1b');
    thin(g, 7.4, -19.8 + bob, 5.2, -12.8 + bob, 2.2, shade(coat, -.45));  // bờm
    drawLeg(legs[0], false); drawLeg(legs[2], false);
    // yên
    poly(g, [[-3.6, -15.6 + bob], [3.6, -15.6 + bob], [3.2, -12.3 + bob], [-3.2, -12.3 + bob]], rider ? '#a8242a' : '#714b37');
    if (rider) rider(g, o, bob);
    g.restore();
  }
  function rider(g, o, bob, V, merchant) {
    const back = o.back, skin = SK[1], body = V.body, hy = -29.2 + bob; // ngồi trên yên
    seg2(g, [0, -13.5 + bob], [3.3, -11.8 + bob], [2.4, -6.6 + bob], 2.6, V.pants || '#4a463f'); ell(g, 3, -6.2 + bob, 1.6, .9, '#2e2620', true);
    poly(g, [[-3, -15 + bob], [3, -15 + bob], [3.4, -24.4 + bob], [-3.4, -24.4 + bob]], lgrad(g, -3.4, 3.4, body));
    if (V.armor) { for (let i = 0; i < 3; i++) thin(g, -3, -17 + bob - i * 2.4, 3, -17 + bob - i * 2.4, .45, shade(body, -.4)); poly(g, [[-4.6, -24.4 + bob], [-2.4, -24.8 + bob], [-2.2, -21.8 + bob], [-4.7, -21.4 + bob]], '#8a8f94'); }
    if (merchant) { poly(g, [[-3.4, -24.4 + bob], [3.6, -24.4 + bob], [5.5, -11 + bob], [-5.5, -11 + bob]], shade(body, .0)); thin(g, 0, -24.2 + bob, 0, -11 + bob, .5, shade(body, -.3)); }
    ell(g, back ? -.1 : .5, hy + 1.8, 3, 3.1, skin, true); if (back) ell(g, -.1, hy + 1.8, 2.9, 3, HAIR[1], false);
    else { ell(g, 1.5, hy + 2, .4, .5, '#2a211c'); ell(g, 2.6, hy + 2, .4, .5, '#2a211c'); }
    const geo = { hx: back ? -.1 : .5, t: o.moving ? o.fr / o.NF * TAU : 0, back, simple: o.simple, st: 0 };
    if (merchant) HATS.non(g, geo, o, { hatCol: '#d8c27a' }, 3.1, hy + 1.8); else HATS.helm(g, geo, o, V, 3.1, hy + 1.8);
    seg2(g, [2.8, -23.4 + bob], [5, -21 + bob], [4.4, -18.6 + bob], 2.2, V.body); ell(g, 4.4, -18.4 + bob, 1.1, 1.1, skin, true);
    if (!merchant) { seg(g, 4.4, -12 + bob, 5.4, -41, 1, '#6b4a2e'); poly(g, [[4.2, -41], [6.8, -41.2], [5.4, -46.5]], '#d0d4d8'); const w = o.moving ? Math.sin(o.fr / o.NF * TAU * 2) * .9 : .3; poly(g, [[5.4, -40], [11.5, -39.2 + w], [5.4, -36]], '#c0392b'); }
    else { thin(g, 4.4, -18.6 + bob, 10.5, -17 + bob, .8, '#b9a27a'); }
  }
  const RIDERS = { ky: { body: '#7a2f2a', pants: '#3f3a36', armor: 1 }, kyt: { body: '#536e77', pants: '#4a463f' } };
  const SPRK = { horse: 1, ky: 1, kyt: 1 };

  // ---------- kho sprite ----------
  const S = { cache: new Map(), bytes: 0, sig: '', made: 0, frameNo: -1, hits: 0, miss: 0 };
  const BK = [.5, .8, 1.2, 1.8, 2.6, 3.6], LWID = 40, LHGT = 64, AX = 20, AY = 59;
  function limits() { const m = GFX.mode; return { cap: (m === 'high' ? 14 : m === 'med' ? 8 : 4) * 1048576, NF: m === 'low' ? 3 : 6 }; }
  function reset() { S.cache.clear(); S.bytes = 0; }
  function make(kind, v, back, fr, NF, bi, simple, moving) {
    const k = BK[bi] * DPR, w = Math.ceil(LWID * k), h = Math.ceil(LHGT * k), c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); g.setTransform(k, 0, 0, k, AX * k, AY * k); g.lineJoin = 'round';
    const o = { kind, v, back, fr, NF, simple, moving };
    if (kind === 'horse') horse(g, o, COATS[v % COATS.length], null);
    else if (kind === 'ky') horse(g, o, COATS[(v + 2) % COATS.length], (gg, oo, b) => rider(gg, oo, b, RIDERS.ky, false));
    else if (kind === 'kyt') horse(g, o, COATS[v % COATS.length], (gg, oo, b) => rider(gg, oo, b, RIDERS.kyt, true));
    else figure(g, o);
    return { c, w, h, bytes: w * h * 4 };
  }
  // vẽ một hình: (x,y) ô, (dx,dy) hướng đi (toạ độ ô), phase rad, moving, mở rộng: opt.noCap
  function draw(kind, v, x, y, dx, dy, phase, moving, ctx2) {
    const lim = limits(), sig = GFX.mode + '|' + DPR; if (S.sig !== sig) { reset(); S.sig = sig; }
    const sx = dx - dy, sy = dx + dy, flip = sx < -1e-3, back = sy < -1e-3;
    const lod = s < .55 || GFX.mode === 'low' ? 1 : 0, NF = lim.NF;
    let bi = BK.length - 1; for (let i = 0; i < BK.length; i++) if (BK[i] >= s * .98) { bi = i; break; }
    const fr = moving ? Math.floor((((phase / TAU) % 1) + 1) % 1 * NF) : NF;   // khung NF = đứng yên
    const key = kind + '|' + v + '|' + (back ? 1 : 0) + '|' + fr + '|' + bi + '|' + lod;
    let e = S.cache.get(key);
    if (e) { S.hits++; S.cache.delete(key); S.cache.set(key, e); }
    else {
      S.miss++; e = make(kind, v, back, fr === NF ? 0 : fr, NF, bi, !!lod, moving && fr !== NF); S.cache.set(key, e); S.bytes += e.bytes;
      while (S.bytes > lim.cap && S.cache.size > 1) { const k0 = S.cache.keys().next().value, e0 = S.cache.get(k0); S.cache.delete(k0); S.bytes -= e0.bytes; }
    }
    const p = P(x, y), kx = s / (BK[bi] * DPR);     // sprite pixel -> màn hình logic: s/bucket (đã nhân DPR ở ảnh)
    const dw = e.w / (BK[bi] * DPR) * s, dh = e.h / (BK[bi] * DPR) * s, ax = AX * s, ay = AY * s, c = ctx2 || ctx;
    if (flip) { c.save(); c.translate(p.x, p.y); c.scale(-1, 1); c.drawImage(e.c, -ax, -ay, dw, dh); c.restore(); }
    else c.drawImage(e.c, p.x - ax, p.y - ay, dw, dh);
    return p;
  }
  return { draw, reset, stats: () => ({ n: S.cache.size, mb: S.bytes / 1048576, hits: S.hits, miss: S.miss }), kinds: KINDS };
})();

// phân loại hình vẽ cho dân đi lại (chỉ ảnh hưởng hình, không đụng logic)
function figKindOf(cls, i) {
  const r = rnd(i * 3.17 + ((G && G.seed) || 0) % 97);
  if (cls === 'binh') return 'binh';
  if (cls === 'nong') return r < .2 ? 'nu' : r < .28 ? 'be' : 'nong';
  if (cls === 'luu') return r < .35 ? 'nu' : r < .62 ? 'be' : 'luu';
  if (cls === 'thuong') return r < .16 ? 'nu' : 'thuong';
  if (cls === 'cong') return r < .1 ? 'nu' : r > .86 ? 'phu' : 'cong';
  return KINDS_OK[cls] ? cls : 'luu';
}
const KINDS_OK = { si: 1, tang: 1, quan: 1, nong: 1, cong: 1, thuong: 1, luu: 1 };
function figVarOf(kind, i) { return Math.floor(rnd(i * 7.31 + ((G && G.seed) || 0) % 53) * (kind === 'thuong' || kind === 'nu' ? 4 : 3)); }
// đường tắt cho các chỗ cũ gọi person(): suy ra loại từ mũ
function figPerson(x, y, body, ph, hat, carry, spear) {
  const kind = hat === 'non' ? (carry ? 'phu' : 'nong') : hat === 'bald' ? 'tang' : hat === 'futou' ? 'si' : hat === 'wing' ? 'quan' : hat === 'helm' ? 'binh' : 'luu';
  const v = Math.floor(rnd(Math.round(ph * 10) + x * 5 + y * 3) * 3);
  return FIGS.draw(kind, v, x, y, 1, 0, T * 8.5 + ph, true);
}

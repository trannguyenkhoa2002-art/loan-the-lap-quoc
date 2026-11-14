// Load after starting a game, then await __renderPerfTests(). Uses real canvas
// pixels so a stale clipping region cannot pass merely by resetting transforms.
window.__renderPerfTests = function () {
  const checks = [];
  const ok = (v, msg) => { if (!v) throw new Error(msg); checks.push(msg); };
  const auto0 = GFX.auto, mode0 = GFX.mode;
  const prefs = ['lt-gfx', 'lt-gfx-user'].map(k => [k, lsGet(k)]);
  const modal = document.getElementById('modal'), display0 = modal.style.display;
  modal.style.display = 'none';
  try {
    chunkReset();
    const c = takeCanvas(40, 40), g = c.getContext('2d');
    g.save(); g.beginPath(); g.rect(0, 0, 1, 1); g.clip();
    g.globalAlpha = .1; g.globalCompositeOperation = 'destination-out';
    recycle(c);
    const reused = takeCanvas(40, 40), x = reused.getContext('2d');
    ok(reused === c, 'Canvas pool really reused the cancelled job canvas');
    x.fillStyle = '#ff0000'; x.fillRect(0, 0, 40, 40);
    ok(x.getImageData(30, 30, 1, 1).data[3] === 255, 'Reused canvas has no stale clip/alpha/composite');
    x.restore(); x.fillStyle = '#00ff00'; x.fillRect(0, 0, 40, 40);
    ok(x.getImageData(30, 30, 1, 1).data[1] === 255, 'Cancelled save stack is also cleared');
    recycle(reused);

    for (let i = 0; i < 80; i++) {
      const o = { x: 0, y: 0, e: EXT.tree, f: () => ctx.fillRect(0, 0, 1, 1) };
      objSprite({ s: 1, pr: 1 }, o); freeObjs({ objs: [o] });
    }
    ok(SPQ.size === 0 && SPB === 0, 'Freed object sprites leave no queue entries or bytes');

    GFX.auto = true; setGfxMode('high', false);
    PERF.autoN = 0; PERF.autoSum = 0; PERF.autoAfter = 0;
    let ts = 100000; PERF.last = ts;
    const frames = (n, dt) => { for (let i = 0; i < n; i++) perfFrame(ts += dt, 4, 3); };
    const savedG = G; G = null; frames(240, 16); G = savedG;
    ok(PERF.autoN === 0, 'Title screen does not consume gameplay sampling');
    frames(180, 16); ok(GFX.mode === 'high', 'Fast gameplay retains high quality');
    frames(180, 40); ok(GFX.mode === 'med' && GFX.auto, 'Later slowdown lowers quality and keeps monitoring');
    frames(400, 40); ok(GFX.mode === 'low', 'Persistent slowdown can lower quality again after cooldown');
    setGfxMode('high', true); frames(400, 40);
    ok(GFX.mode === 'high' && !GFX.auto, 'Explicit player quality is respected');
    GFX.auto = true; PERF.autoN = 40; PERF.autoSum = 1600;
    frames(1, 2000); ok(PERF.autoN === 0, 'Resume stall is excluded');
    const save0 = LT.serialize(G), camera0 = JSON.stringify([s, ox, oy]);
    recoverGraphics();
    ok(LT.serialize(G) === save0 && JSON.stringify([s, ox, oy]) === camera0, 'Graphics recovery preserves the save and camera');
    setGfxMode('low', false);
    ok(DPR === Math.min(1, window.devicePixelRatio || 1), 'Low quality also reduces the visible canvas resolution');
    setGfxMode('high', false);
    ok(DPR === Math.min(2, window.devicePixelRatio || 1), 'High quality restores screen resolution');
    return checks;
  } finally {
    modal.style.display = display0;
    setGfxMode(mode0, false); GFX.auto = auto0;
    for (const [k, v] of prefs) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { } }
    PERF.autoN = 0; PERF.autoSum = 0; PERF.autoAfter = 0; PERF.last = 0;
  }
};

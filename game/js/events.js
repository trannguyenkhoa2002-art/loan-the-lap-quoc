'use strict';
// ============================================================================
// BIẾN CỐ (GP §5.6): mỗi biến cố 2–3 cách xử lý, mỗi cách đổi chỉ số này lấy chỉ số kia.
// Dữ liệu thuần; giao diện đọc LT.EVENTS và G.pendingEvent.
// ============================================================================
(function (g) {
const LT = g.LT = g.LT || {};
const clamp = LT.clamp;
const dt = (G, v) => { G.stat.dantam = clamp(G.stat.dantam + v, 0, 100); };
const st = (G, k, v) => { G.stat[k] = clamp(G.stat[k] + v, 0, 100); };
const tien = (G, v, label) => { const b = G.res.tien; G.res.tien = Math.max(0, b + v); LT.flowAdd(G, 'tien', G.res.tien - b, label); };
const lg = (G, v, label) => { const b = G.res.luong; G.res.luong = Math.max(0, b + v); LT.flowAdd(G, 'luong', G.res.luong - b, label); };
const tdanh = (G, v) => { G.player.thanhdanh = clamp(G.player.thanhdanh + v, 0, 100); };
const mm = (G, k, v, w) => G.mods.push({ k, v, w });
const month = G => LT.month(G.week);
const has = (G, k) => LT.count(G, k) > 0;
const need = (G, c) => LT.afford(G, c) ? '' : 'Thiếu ' + LT.costTxt(c);
const spend = (G, c, label) => LT.pay(G, c, 1, label);

LT.EVENTS = [
  { id: 'lu', icon: '🌊', title: 'Nước lũ dâng', weight: G => (month(G) === 7 || month(G) === 8) ? 3 : 0,
    text: G => 'Mưa nguồn đổ về, nước sông dâng cao đe dọa ruộng ven sông. Lúa chưa gặt, phải quyết ngay.',
    opts: [
      { label: 'Gọi lao dịch đắp đê gấp', desc: 'Tốn 30 gỗ, 20 đá; dân tâm −3. Mất mùa nhẹ (sản lượng ×0,9).', can: G => need(G, { go: 30, da: 20 }), apply: G => { spend(G, { go: 30, da: 20 }, 'Đắp đê chống lũ'); dt(G, -3); G.weather = { mul: Math.min(G.weather.mul, .9), kind: 'lũ' }; return 'Đê giữ được phần lớn ruộng. Sản lượng năm nay ×0,9.'; } },
      { label: 'Mở kho cứu dân vùng ngập', desc: 'Tốn 80 thạch kho quan; dân tâm +4, Thanh danh +1. Sản lượng ×0,75.', can: G => G.res.luong >= 80 ? '' : 'Kho quan không đủ 80 thạch', apply: G => { lg(G, -80, 'Cứu dân vùng lũ'); G.dan.luong += 80; dt(G, 4); tdanh(G, 1); G.weather = { mul: Math.min(G.weather.mul, .75), kind: 'lũ' }; return 'Dân biết ơn; ruộng ngập nhiều, sản lượng ×0,75.'; } },
      { label: 'Mặc cho nước lên', desc: 'Không tốn gì; dân tâm −6, vệ sinh −8 (có dịch), sản lượng ×0,5.', apply: G => { dt(G, -6); st(G, 'vesinh', -8); G.plague = Math.max(G.plague, 1); G.weather = { mul: Math.min(G.weather.mul, .5), kind: 'lũ' }; return 'Nước tràn qua ruộng: mất nửa vụ, dân oán, bùn lầy sinh dịch.'; } },
    ] },
  { id: 'han', icon: '☀️', title: 'Hạn hán', weight: G => (month(G) >= 4 && month(G) <= 6) ? 3 : 0,
    text: G => 'Đã nhiều tuần không mưa, mương cạn, lúa héo. Nếu không cứu, vụ này sẽ mất.',
    opts: [
      { label: 'Gọi dân đào mương dẫn nước', desc: 'Tốn 25 gỗ, 25 đá, dân tâm −2. Sản lượng ×0,85.', can: G => need(G, { go: 25, da: 25 }), apply: G => { spend(G, { go: 25, da: 25 }, 'Đào mương chống hạn'); dt(G, -2); G.weather = { mul: Math.min(G.weather.mul, .85), kind: 'hạn' }; return 'Nước về ruộng kịp lúc phần lớn.'; } },
      { label: 'Làm lễ cầu mưa ở chùa', desc: 'Có chùa: miễn phí, dân tâm +2; không có chùa: 20 quan. Sản lượng ×0,7.', can: G => has(G, 'temple') ? '' : need(G, { tien: 20 }), apply: G => { if (!has(G, 'temple')) spend(G, { tien: 20 }, 'Lễ cầu mưa'); dt(G, 2); G.weather = { mul: Math.min(G.weather.mul, .7), kind: 'hạn' }; return 'Dân yên lòng; mưa đến muộn, sản lượng ×0,7.'; } },
      { label: 'Để trời quyết', desc: 'Không tốn gì; dân tâm −5, sản lượng ×0,45.', apply: G => { dt(G, -5); G.weather = { mul: Math.min(G.weather.mul, .45), kind: 'hạn' }; return 'Nắng cháy ruộng: gần như mất cả vụ.'; } },
    ] },
  { id: 'chauchau', icon: '🦗', title: 'Châu chấu phá lúa', weight: G => (G.week >= 20 && G.week <= 26) ? 2 : 0,
    text: G => 'Từng đàn châu chấu bay kín trời, đáp xuống ruộng lúa sắp chín.',
    opts: [
      { label: 'Thuê dân bắt châu chấu (30 quan)', desc: 'Mỗi gánh châu chấu bắt được đổi thóc; sản lượng ×0,85.', can: G => need(G, { tien: 30 }), apply: G => { spend(G, { tien: 30 }, 'Thuê bắt châu chấu'); G.wealth += 20; G.weather = { mul: Math.min(G.weather.mul, .85), kind: 'châu chấu' }; return 'Bắt kịp phần lớn đàn châu chấu.'; } },
      { label: 'Đốt đồng cỏ ven ruộng', desc: 'Miễn phí nhưng cháy lan; vệ sinh −3; sản lượng ×0,7.', apply: G => { st(G, 'vesinh', -3); G.weather = { mul: Math.min(G.weather.mul, .7), kind: 'châu chấu' }; return 'Lửa diệt được nhiều châu chấu nhưng cũng cháy một phần lúa.'; } },
      { label: 'Cầu khấn, mặc kệ', desc: 'Sản lượng ×0,5, dân tâm −3.', apply: G => { dt(G, -3); G.weather = { mul: Math.min(G.weather.mul, .5), kind: 'châu chấu' }; return 'Châu chấu ăn hết nửa vụ.'; } },
    ] },
  { id: 'dich', icon: '🤒', title: 'Dịch bệnh mùa hè', weight: G => (month(G) === 7 || month(G) === 8) ? (G.stat.vesinh < 50 ? 4 : 1) : 0,
    text: G => 'Bệnh thổ tả lan trong khu dân cư. Vệ sinh hiện ' + Math.round(G.stat.vesinh) + ', y quán phủ ' + Math.round(G.city.clinicCover * 100) + '% nhà.',
    opts: [
      { label: 'Lập y quán tạm, phát thuốc (40 quan)', desc: 'Giảm thiệt hại dịch xuống 0,4; dân tâm +2.', can: G => need(G, { tien: 40 }), apply: G => { spend(G, { tien: 40 }, 'Phát thuốc chống dịch'); G.plague = 0.4; dt(G, 2); return 'Dịch được khống chế, thiệt hại nhẹ.'; } },
      { label: 'Cách ly khu phố, đóng chợ', desc: 'Miễn phí; phồn vinh −8 trong 12 tuần; dịch ×0,6.', apply: G => { G.plague = 0.6; mm(G, 'phonvinh', -8, 12); return 'Dịch hạn chế nhưng buôn bán đình trệ.'; } },
      { label: 'Mặc cho dịch tự qua', desc: 'Dịch ×1,5 mỗi tuần mùa hè; Thanh danh −2.', apply: G => { G.plague = 1.5; tdanh(G, -2); return 'Dịch hoành hành, nhiều hộ chết hoặc bỏ đi.'; } },
    ] },
  { id: 'hoahoan', icon: '🔥', title: 'Hỏa hoạn', weight: G => G.stat.trian < 65 ? 2 : 1,
    text: G => 'Cháy bùng ở một dãy nhà dân lúc đêm khuya, gió thổi lan sang nhà bên.',
    opts: [
      { label: 'Huy động dân dập lửa, bồi thường (30 quan)', desc: 'Không mất công trình; dân tâm +2.', can: G => need(G, { tien: 30 }), apply: G => { spend(G, { tien: 30 }, 'Bồi thường hỏa hoạn'); G.wealth += 20; dt(G, 2); return 'Dập tắt kịp, không mất nhà nào.'; } },
      { label: 'Dỡ nhà liền kề cho lửa khỏi lan', desc: 'Mất 1 nhà dân; dân tâm −2.', apply: G => { const h = G.bl.filter(b => b.k === 'house' && !b.building); if (h.length) { const b = h[Math.floor(LT.rand(G) * h.length)]; LT.place(G, 'del', b.x, b.y); G.fireFlash = { x: b.x, y: b.y }; } dt(G, -2); return 'Mất một dãy nhà dân nhưng lửa đã tắt.'; } },
      { label: 'Mặc cháy', desc: 'Mất 2 công trình; Thanh danh −2.', apply: G => { for (let i = 0; i < 2; i++) { const h = G.bl.filter(b => b.k !== 'hall' && b.k !== 'road' && b.k !== 'pave' && b.k !== 'wall' && !b.building); if (h.length) { const b = h[Math.floor(LT.rand(G) * h.length)]; LT.place(G, 'del', b.x, b.y); G.fireFlash = { x: b.x, y: b.y }; } } tdanh(G, -2); return 'Hai công trình bị thiêu rụi.'; } },
    ] },
  { id: 'luudan', icon: '🧳', title: 'Lưu dân tràn về', weight: G => G.year > 917 || G.week > 8 ? 2 : 0,
    text: G => 'Một đoàn khoảng 25 hộ lưu dân chạy loạn từ phương bắc đến gõ cổng huyện xin ăn ở. Còn ' + Math.max(0, G.city.cap - LT.totalHo(G)) + ' chỗ ở trống.',
    opts: [
      { label: 'Thu nhận cả đoàn', desc: 'Tốn 60 thạch kho quan; +25 hộ lưu dân; dân tâm +2; vệ sinh −3.', can: G => G.res.luong >= 60 ? '' : 'Kho quan không đủ 60 thạch', apply: G => { lg(G, -60, 'Cho lưu dân ăn'); LT.addHo(G, 25, 'luu', 'Lưu dân được thu nhận'); dt(G, 2); st(G, 'vesinh', -3); return 'Hộ mới đông đúc, có thêm sức làm nhưng chen chúc.'; } },
      { label: 'Chỉ nhận số có tay nghề (10 hộ)', desc: 'Tốn 20 thạch; +10 hộ; không đổi dân tâm.', can: G => G.res.luong >= 20 ? '' : 'Kho quan không đủ 20 thạch', apply: G => { lg(G, -20, 'Cho lưu dân ăn'); LT.addHo(G, 10, 'luu', 'Lưu dân được thu nhận'); return 'Chọn được một ít thợ khéo.'; } },
      { label: 'Đuổi đi', desc: 'Dân tâm −3, Thanh danh −2, trị an +2.', apply: G => { dt(G, -3); tdanh(G, -2); st(G, 'trian', 2); return 'Dân kêu ca việc bỏ mặc người chạy loạn.'; } },
    ] },
  { id: 'haotoc', icon: '🏛️', title: 'Hào tộc lấn ruộng', weight: G => (G.year > 917 || G.week > 12) ? (G.H.hao > 0 ? 3 : 1) : 0,
    text: G => 'Hào tộc họ Trương lấn 30 mẫu ruộng của năm nông hộ đang nợ thóc; họ Trương là thông gia của thứ sử.',
    opts: [
      { label: 'Trả ruộng cho dân, phạt họ Trương', desc: 'Đúng luật: dân tâm +4, thu phạt 30 quan; trị an −3 (hào tộc oán); nghi kỵ +3.', apply: G => { dt(G, 4); tien(G, 30, 'Phạt hào tộc'); st(G, 'trian', -3); G.nghiky = Math.min(100, G.nghiky + 3); return 'Dân mừng rỡ; họ Trương ghi hận.'; } },
      { label: 'Cho dân chuộc dần bằng thóc vay kho', desc: 'Tốn 100 thạch kho quan; dân tâm +2, Thanh danh +1; không ai mất mặt.', can: G => G.res.luong >= 100 ? '' : 'Kho quan không đủ 100 thạch', apply: G => { lg(G, -100, 'Cho dân vay chuộc ruộng'); G.dan.luong += 100; dt(G, 2); tdanh(G, 1); return 'Năm hộ giữ lại ruộng, họ Trương không mất mặt.'; } },
      { label: 'Xử cho họ Trương', desc: 'Nhận 60 quan; dân tâm −6, Thanh danh −3; năm hộ thành tá điền.', apply: G => { dt(G, -6); tdanh(G, -3); tien(G, 60, 'Quà của hào tộc'); G.prosper.nong = clamp(G.prosper.nong - 8, 0, 100); return 'An toàn cho bạn nhưng dân nông oán trách.'; } },
    ] },
  { id: 'anoan', icon: '⚖️', title: 'Án oan', weight: G => G.tick > 10 ? 2 : 0,
    text: G => 'Một nông hộ bị tố ăn trộm trâu và sắp bị xử đánh trượng. Người trong làng đồn rằng kẻ tố cáo muốn chiếm ruộng của hộ này.',
    opts: [
      { label: 'Xét lại, minh oan cho nông hộ', desc: 'Tốn 10 quan; dân tâm +3, Thanh danh +2; hào tộc bực.', can: G => need(G, { tien: 10 }), apply: G => { spend(G, { tien: 10 }, 'Xét lại án oan'); dt(G, 3); tdanh(G, 2); return 'Dân khen quan thanh liêm sáng suốt.'; } },
      { label: 'Giữ nguyên án', desc: 'Dân tâm −4, Thanh danh −2.', apply: G => { dt(G, -4); tdanh(G, -2); return 'Người dân xì xào bất bình.'; } },
      { label: 'Nhận tiền của kẻ tố cáo', desc: 'Nhận 40 quan; Thanh danh −6, dân tâm −3.', apply: G => { tien(G, 40, 'Hối lộ án oan'); tdanh(G, -6); dt(G, -3); G.nghiky = Math.min(100, G.nghiky + 3); return 'Túi đầy nhưng tiếng xấu đồn xa.'; } },
    ] },
  { id: 'suthanhtra', icon: '📜', title: 'Sứ giả triều đình thanh tra', weight: G => G.nghiky >= 30 ? 3 : (G.tick > 40 ? 1 : 0),
    text: G => 'Sứ giả của tiết độ sứ về huyện xem sổ sách thuế, kho lương và hộ khẩu. Nghi kỵ hiện ' + Math.round(G.nghiky) + '/100.',
    opts: [
      { label: 'Mở sổ sách, đón tiếp thật thà', desc: 'Nếu điểm khảo khóa dự kiến ≥ 60: Thanh danh +3, nghi kỵ −8. Ngược lại: Thanh danh −2, nghi kỵ +5.', apply: G => { const t = LT.khaoScores(G).total; if (t >= 60) { tdanh(G, 3); G.nghiky = Math.max(0, G.nghiky - 8); return 'Điểm dự kiến ' + t + ': sứ giả hài lòng.'; } tdanh(G, -2); G.nghiky = Math.min(100, G.nghiky + 5); return 'Điểm dự kiến ' + t + ': sứ giả ghi lại nhiều chỗ yếu.'; } },
      { label: 'Biếu quà 80 quan', desc: 'Nghi kỵ −10 nhưng Thanh danh −3 (tiếng hối lộ).', can: G => need(G, { tien: 80 }), apply: G => { spend(G, { tien: 80 }, 'Biếu sứ giả'); G.nghiky = Math.max(0, G.nghiky - 10); tdanh(G, -3); return 'Sứ giả về tâu tốt, nhưng việc biếu quà không giấu được.'; } },
      { label: 'Cáo bệnh tránh mặt', desc: 'Miễn phí; nghi kỵ +10.', apply: G => { G.nghiky = Math.min(100, G.nghiky + 10); return 'Sứ giả bỏ đi với vẻ khó chịu.'; } },
    ] },
  { id: 'thuongnhan', icon: '🏮', title: 'Thương nhân xin giảm thuế chợ', weight: G => G.H.thuong >= 4 ? 2 : 0,
    text: G => 'Hội thương nhân dâng đơn xin giảm thuế chợ để đón thương đội từ ngoài về.',
    opts: [
      { label: 'Giảm thuế chợ xuống mức Thấp 1 năm', desc: 'Phồn vinh +6 (36 tuần); thuế chợ giảm còn 3%.', apply: G => { G.pol.cho = 0; mm(G, 'phonvinh', 6, 36); G.choRestore = G.tick + 36; return 'Thương đội kéo đến nhiều, chợ đông hơn.'; } },
      { label: 'Giữ nguyên thuế', desc: 'Không đổi gì.', apply: G => { mm(G, 'phonvinh', -3, 12); return 'Thương nhân hậm hực, buôn bán uể oải một thời gian (phồn vinh −3 trong 12 tuần).'; } },
      { label: 'Tăng thu phí chợ (40 quan ngay)', desc: 'Nhận 40 quan; phồn vinh −6 (24 tuần).', apply: G => { tien(G, 40, 'Thu phí chợ thêm'); mm(G, 'phonvinh', -6, 24); return 'Ngân khố đầy lên, thương nhân tản bớt.'; } },
    ] },
  { id: 'buonlau', icon: '🕵️', title: 'Buôn lậu muối', weight: G => (G.pol.mono.muoi || G.pol.mono.tra || G.pol.mono.ruou) && G.stat.trian < 55 ? 3 : 0,
    text: G => 'Nhà quan chuyên bán, giá cao nên có bọn buôn lậu đem muối trà chui vào chợ, lậu thuế.',
    opts: [
      { label: 'Tăng tuần tra, bắt lậu (25 quan)', desc: 'Trị an +4.', can: G => need(G, { tien: 25 }), apply: G => { spend(G, { tien: 25 }, 'Tuần tra bắt buôn lậu'); st(G, 'trian', 4); return 'Bắt được vài chuyến hàng lậu.'; } },
      { label: 'Làm ngơ, nhận phần', desc: 'Nhận 35 quan; trị an −5, Thanh danh −2.', apply: G => { tien(G, 35, 'Nhận phần buôn lậu'); st(G, 'trian', -5); tdanh(G, -2); return 'Túi nặng thêm, luật lỏng thêm.'; } },
      { label: 'Tịch thu và phạt nặng', desc: 'Thu 20 quan; trị an +2, dân tâm −2.', apply: G => { tien(G, 20, 'Phạt buôn lậu'); st(G, 'trian', 2); dt(G, -2); return 'Lậu thuế giảm, thương nhân sợ.'; } },
    ] },
  { id: 'nhasu', icon: '🛕', title: 'Nhà sư xin lập ruộng chùa', weight: G => G.tick > 20 ? 1.5 : 0,
    text: G => 'Một vị cao tăng xin quan cấp ruộng làm ruộng chùa, miễn thuế, để dân đến lễ bái và chẩn bần.',
    opts: [
      { label: 'Cấp ruộng chùa miễn thuế', desc: 'Dân tâm +4 (36 tuần), thuế thóc −3%/năm; Tăng hộ vui.', apply: G => { dt(G, 4); mm(G, 'dt', 3, 36); G.chua = (G.chua || 0) + 1; G.prosper.tang = clamp(G.prosper.tang + 10, 0, 100); return 'Chùa thêm khói hương, dân bớt oán.'; } },
      { label: 'Từ chối', desc: 'Dân tâm −1; thuế không đổi.', apply: G => { dt(G, -1); return 'Nhà sư lặng lẽ cáo lui.'; } },
      { label: 'Cấp ít ruộng, bắt đóng thuế một nửa', desc: 'Dân tâm +1; nhận 20 quan lễ.', apply: G => { dt(G, 1); tien(G, 20, 'Lễ chùa'); return 'Thỏa thuận ở giữa.'; } },
    ] },
  { id: 'linhdoithuong', icon: '⚔️', title: 'Lính đòi thưởng', weight: G => G.reward ? 100 : 0, once: true,
    text: G => 'Sau trận thắng lớn, các đô trưởng dẫn lính đến xin thưởng. Cần khoảng ' + (G.reward ? G.reward.need : 30) + ' quan.',
    opts: [
      { label: 'Thưởng tiền đủ', desc: 'Tốn ~40% quân số quan; sĩ khí quân +15, Uy vọng +2.', can: G => need(G, { tien: G.reward ? G.reward.need : 30 }), apply: G => { spend(G, { tien: G.reward.need }, 'Thưởng quân'); G.wealth += G.reward.need * .5; for (const u of G.units) u.sk = clamp(u.sk + 15, 0, 100); G.player.uyvong = clamp(G.player.uyvong + 2, 0, 100); G.reward = null; return 'Lính hò reo, hết lòng theo bạn.'; } },
      { label: 'Thưởng nửa, hứa bù sau', desc: 'Tốn nửa; sĩ khí +5.', can: G => need(G, { tien: Math.ceil((G.reward ? G.reward.need : 30) / 2) }), apply: G => { spend(G, { tien: Math.ceil(G.reward.need / 2) }, 'Thưởng quân'); for (const u of G.units) u.sk = clamp(u.sk + 5, 0, 100); G.reward = null; return 'Lính tạm yên, nhưng nhắc lời hứa.'; } },
      { label: 'Khất, nói kho đã cạn', desc: 'Sĩ khí −10, Uy vọng −3; 3% lính đào ngũ.', apply: G => { for (const u of G.units) { u.sk = clamp(u.sk - 10, 0, 100); u.n = Math.max(0, Math.round(u.n * .97)); } G.player.uyvong = clamp(G.player.uyvong - 3, 0, 100); G.reward = null; return 'Lính ra về lầm bầm.'; } },
    ] },
];
LT.EVENT = id => LT.EVENTS.find(e => e.id === id);

LT.eventsWeek = function (G) {
  // thuế chợ trả về mức cũ sau 1 năm giảm
  if (G.choRestore && G.tick >= G.choRestore) { G.pol.cho = 1; G.choRestore = 0; }
  if (G.pendingEvent || G.pendingBattle || G.over) return;
  if (G.reward) { G.pendingEvent = { id: 'linhdoithuong' }; G.speed = 0; return; }
  G.nextEventGap--;
  if (G.nextEventGap > 0 || G.tick < 5) return;
  const cands = [];
  for (const e of LT.EVENTS) {
    if (e.once) continue;
    if ((G.eventCd[e.id] || 0) > G.tick) continue;
    const w = e.weight(G); if (w > 0) cands.push([e, w]);
  }
  if (!cands.length) { G.nextEventGap = 3; return; }
  let tot = cands.reduce((a, c) => a + c[1], 0), r = LT.rand(G) * tot, pick = cands[0][0];
  for (const [e, w] of cands) { r -= w; if (r <= 0) { pick = e; break; } }
  G.pendingEvent = { id: pick.id }; G.eventCd[pick.id] = G.tick + 18; G.nextEventGap = 6 + Math.floor(LT.rand(G) * 6);
  G.speed = 0;
};
LT.eventOptionError = (G, idx) => { const e = LT.EVENT(G.pendingEvent.id), o = e.opts[idx]; return o.can ? o.can(G) : ''; };
LT.chooseEvent = function (G, idx) {
  if (!G.pendingEvent) return null;
  const e = LT.EVENT(G.pendingEvent.id), o = e.opts[idx]; if (!o) return null;
  const err = o.can ? o.can(G) : ''; if (err) return { ok: false, err };
  const res = o.apply(G);
  LT.log(G, e.title + ': ' + o.label + ' — ' + res, '');
  G.pendingEvent = null; LT.recalcCity(G);
  return { ok: true, text: res, title: e.title, label: o.label };
};
})(typeof globalThis !== 'undefined' ? globalThis : window);

'use strict';
// ============================================================================
// DỮ LIỆU GỐC — mỗi khối ghi rõ mục tài liệu thiết kế nó lấy từ đó.
// (GP = THIET-KE-GAMEPLAY.md, KT = THIET-KE-KINH-TE.md, CT = THIET-KE-CHINH-TRI.md)
// Tệp này không đụng DOM, chạy được bằng node.
// ============================================================================
(function (g) {
const LT = g.LT = g.LT || {};

// ---- Thời gian (GP §4) ------------------------------------------------------
LT.WEEKS_YEAR = 36;            // 1 năm = 36 tuần, 1 tháng = 3 tuần
LT.START_YEAR = 917;
LT.WEEK_SECONDS = 20;          // ở tốc độ x1, 1 tuần ≈ 20 giây
LT.month = w => Math.floor((w - 1) / 3) + 1;
LT.TUAN = ['Thượng tuần', 'Trung tuần', 'Hạ tuần'];
LT.fmtDate = G => 'Năm ' + G.year + ' · Tháng ' + LT.month(G.week) + ' · ' + LT.TUAN[(G.week - 1) % 3];

// ---- Hàng hóa và giá gốc (KT §2) ---------------------------------------------
// tien: quan (tiền). Giá tính theo quan trên một đơn vị.
LT.GOODS = {
  luong:   { n: 'Lương', u: 'thạch', i: '🌾', p: 0.4 },
  muoi:    { n: 'Muối', u: 'thạch', i: '🧂', p: 2.0 },
  go:      { n: 'Gỗ', u: 'xe', i: '🪵', p: 0.3 },
  da:      { n: 'Đá', u: 'xe', i: '🪨', p: 0.3 },
  quang:   { n: 'Quặng sắt', u: 'xe', i: '⛏️', p: 1.0 },
  nongcu:  { n: 'Nông cụ', u: 'bộ', i: '🔧', p: 1.5 },
  vai:     { n: 'Vải thô', u: 'thất', i: '🧶', p: 0.8 },
  ken:     { n: 'Kén tằm', u: 'cân', i: '🐛', p: 1.33 },
  lua:     { n: 'Lụa', u: 'thất', i: '🧵', p: 4.0 },
  tra:     { n: 'Trà', u: 'gánh', i: '🍵', p: 3.0 },
  gom:     { n: 'Gốm', u: 'kiện', i: '🏺', p: 2.0 },
  ruou:    { n: 'Rượu', u: 'vò', i: '🍶', p: 1.5 },
  binhkhi: { n: 'Binh khí', u: 'bộ', i: '🗡️', p: 5.0 },
  giap:    { n: 'Giáp', u: 'bộ', i: '🛡️', p: 12.0 },
  ngua:    { n: 'Ngựa', u: 'con', i: '🐴', p: 30.0 },
};
LT.GOOD_IDS = Object.keys(LT.GOODS);
// hàng thương nhân được phép đem bán ra ngoài / nhập về (KT §6-7)
LT.TRADE_OUT = ['luong', 'muoi', 'vai', 'lua', 'tra', 'gom', 'ruou'];
LT.TRADE_IN = ['muoi', 'vai', 'lua', 'tra', 'gom', 'ruou', 'nongcu'];

// ---- Tầng lớp và nhu cầu hằng năm của một hộ (GP §5.2, KT §3) -----------------
LT.CLASSES = {
  luu:    { n: 'Lưu dân', i: '🧳', d: 'Chạy loạn kéo đến, chưa có việc. Làm lao dịch, nguồn mộ lính rẻ.' },
  nong:   { n: 'Nông', i: '🌾', d: 'Làm ruộng, đốn gỗ, đục đá, nấu muối, hái trà, nuôi tằm.' },
  cong:   { n: 'Công', i: '🔨', d: 'Thợ dệt, thợ rèn, thợ gốm, thợ nấu rượu.' },
  thuong: { n: 'Thương', i: '💰', d: 'Buôn bán ở phường thị, dịch trạm. Thuế tiền và giá hàng tốt.' },
  si:     { n: 'Sĩ', i: '🎓', d: 'Người đọc sách ở châu học; nguồn quan viên. Cần trà, rượu.' },
  binh:   { n: 'Binh', i: '⚔️', d: 'Hộ có đinh tráng đang tại ngũ (5 lính một hộ). Không làm việc, nhưng vẫn ăn và ở trong thành.' },
  tang:   { n: 'Tăng', i: '🙏', d: 'Sư sãi ở chùa. Giữ dân tâm, cứu tế. Ruộng chùa miễn thuế.' },
  quan:   { n: 'Quan', i: '👔', d: 'Thuộc lại, hưởng bổng lộc. Cần lụa, trà, gốm.' },
  hao:    { n: 'Hào tộc', i: '🏛️', d: 'Nhà giàu: nộp nhiều thuế, hay lấn ruộng dân. Cần xa xỉ phẩm.' },
};
LT.CLASS_IDS = ['luu', 'nong', 'cong', 'thuong', 'si', 'tang', 'binh', 'quan', 'hao'];
// nhu cầu / hộ / năm (KT §3)
LT.NEEDS = {
  luu:    { luong: 5.4 },
  nong:   { luong: 5.4, muoi: 0.2, vai: 1 },
  cong:   { luong: 5.4, muoi: 0.2, vai: 1, ruou: 1 },
  thuong: { luong: 5.4, muoi: 0.2, vai: 1, ruou: 1, tra: 0.5, gom: 0.5 },
  si:     { luong: 5.4, muoi: 0.2, vai: 1, ruou: 1, tra: 0.5, gom: 0.5 },
  tang:   { luong: 5.4, muoi: 0.2, vai: 1, ruou: 1, tra: 0.5, gom: 0.5 },
  binh:   { luong: 5.4, muoi: 0.2, vai: 1 },
  quan:   { luong: 8, muoi: 0.3, ruou: 3, tra: 1, gom: 1, lua: 2 },
  hao:    { luong: 8, muoi: 0.3, ruou: 3, tra: 1, gom: 1, lua: 2 },
};
LT.HO_AN_TUAN = 0.15;       // 1 hộ ăn 0,15 thạch/tuần (GP §5.3)
LT.LINH_AN = 0.06;          // 1 lính ăn 0,06 thạch + 0,05 quan lương mỗi tuần
LT.LINH_LUONG = 0.05;
LT.NGUA_AN = 0.10;
LT.KHU_RUONG_NAM = 360;     // 1 khu ruộng 20 nông hộ: 360 thạch/năm (GP §5.3)
LT.VU_NAM = 220;            // vùng nam 2 vụ, mỗi vụ 220
LT.HO_PER_NHA = 15;
LT.LINH_PER_HO = 5;         // vòng 2: 5 lính rút từ 1 hộ (hộ đó thành "hộ binh"); lính chết thì hộ mất vĩnh viễn, giải ngũ trả hộ về làm dân
LT.CITY_LEVELS = [null, { n: 'Huyện thành', cap: 3000 }, { n: 'Châu thành', cap: 12000 }, { n: 'Phủ thành', cap: 40000 }, { n: 'Kinh đô', cap: 120000 }]; // GP §3         // một "nhà dân" trong game = một dãy nhà 15 hộ (quyết định riêng, xem README)
LT.KHO_NEN = 18;            // kho lương nên giữ đủ 18 tuần (GP §5.3)
LT.KHO_BAN_KINH = 8;        // bán kính phục vụ của kho: 8 ô theo đường (KT §5)
LT.NGOAI_BAN_KINH = 0.6;    // ngoài bán kính chỉ đạt 60% công suất
LT.HAO_HUT_KHO = 0.02;      // lương hao 2%/quý (KT §5)

// ---- Thuế (GP §5.4, KT §8) ----------------------------------------------------
LT.TAX_LEVELS = [
  { id: 0, n: 'Khoan',   mult: 0.5,  dt: +2, flee: 0,    d: 'Dân tâm +2 mỗi kỳ thuế' },
  { id: 1, n: 'Nhẹ',     mult: 0.75, dt: +1, flee: 0,    d: 'Dân tâm +1 mỗi kỳ thuế' },
  { id: 2, n: 'Thường',  mult: 1.0,  dt: 0,  flee: 0,    d: 'Mức chuẩn' },
  { id: 3, n: 'Nặng',    mult: 1.3,  dt: -2, flee: 0.01, d: 'Dân tâm −2 mỗi kỳ, 1% hộ bỏ trốn' },
  { id: 4, n: 'Tận thu', mult: 1.6,  dt: -5, flee: 0.04, d: 'Dân tâm −5 mỗi kỳ, 4% hộ bỏ trốn, nguy cơ nổi loạn' },
];
LT.HA_THUE = { nong: 0.3, cong: 0.5, thuong: 1.2, hao: 4 };   // định mức hạ thuế / hộ / năm (KT §8.1)
LT.THUE_THOC = 0.10;                                          // 10% sản lượng ruộng
LT.TAX_WEEK_HA = 16;       // tháng 6 — hạ thuế (thu tiền)
LT.TAX_WEEK_THU = 31;      // tháng 11 — thu thuế (thu thóc)
LT.HARVEST_WEEKS = [25, 26, 27];        // tháng 9 gặt
LT.HARVEST_NAM = { 1: [16, 17, 18], 2: [28, 29, 30] }; // vùng nam hai vụ: tháng 6 và 10
LT.KHAO_WEEK = 34;         // tháng 12 — khảo khóa
LT.THUE_CHO = [ { n: 'Thấp', r: 0.03 }, { n: 'Thường (2% + 3%)', r: 0.05 }, { n: 'Cao', r: 0.08 } ];
// chia thuế ba phần (KT §8.4): [thượng cung, lưu sứ, giữ lại]
LT.SPLIT = { 1: [0.40, 0.30, 0.30], 2: [0.40, 0.25, 0.35], 3: [0.40, 0.20, 0.40], 4: [0.30, 0, 0.70], 5: [0, 0, 1], 6: [0, 0, 1] };
LT.CHUYEN_BAN = { muoi: 1.6, tra: 1.5, ruou: 1.5 };   // hệ số giá bán của quan (muối lãi 1,2 trên giá vốn 2,0)
LT.GOODS_MONO_RANK = { muoi: 1, tra: 2, ruou: 2 };

// ---- Hộ khẩu / lao dịch (KT §11) ---------------------------------------------
LT.LAO_DICH_TUAN_HO = 2;    // mỗi hộ nợ 20 ngày công = 2 tuần-hộ mỗi năm
LT.THUE_PHU = 0.03;         // thuê phu: 0,03 quan mỗi hộ mỗi tuần

// ---- Công trình (KT §4: hộ làm, đầu vào, đầu ra) ------------------------------
// cat: 0 dân sinh, 1 nông nghiệp, 2 thủ công, 3 thương – dịch vụ, 4 quân – thành
// job: {c: tầng lớp, n: số hộ}; in/out: mỗi tuần khi đủ nhân công
LT.CATS = ['🏘️ Đường & dân sinh', '🌾 Nông nghiệp', '🔨 Thủ công', '💰 Thương & kho', '⚔️ Quân & thành'];
LT.B = {
  road:   { n: 'Đường đất', i: '🟫', c: { go: 1 }, cat: 0, lab: 0.3, dur: 1.6, d: 'Xương sống của thành. Công trình sát đường sản xuất ×1,2. Nối kho tới công trình để đủ công suất. Giữ và kéo để đắp liền.' },
  pave:   { n: 'Quan đạo', i: '⬜', c: { da: 2 }, cat: 0, lab: 0.6, dur: 2.4, d: 'Đường lát đá: công trình sát đường ×1,35, tăng phồn vinh. Giữ và kéo để lát liền.' },
  house:  { n: 'Nhà dân', i: '🏠', c: { go: 20 }, cat: 0, lab: 4, dur: 14, cap: 15, d: 'Một dãy nhà ở cho 15 hộ. Hộ mới chỉ đến khi còn chỗ ở. Kéo chuột để đặt cả khu.' },
  terrace:{ n: 'Nhà phố', i: '🏘️', c: { go: 45, da: 25, tien: 8 }, cat: 0, lab: 8, dur: 22, cap: 50, rank: 2, d: 'Dãy nhà phố hai tầng cho 50 hộ (từ chức Thứ sử). Thành lớn cần loại này để chứa hàng nghìn hộ.' },
  mansion:{ n: 'Nhà lầu phường', i: '🏙️', c: { go: 90, da: 70, tien: 25 }, cat: 0, lab: 14, dur: 34, cap: 140, rank: 3, d: 'Khu nhà lầu cho 140 hộ (từ chức Phòng ngự sứ). Thành cấp phủ, kinh đô dùng loại này.' },
  bridge: { n: 'Cầu', i: '🌉', c: { go: 8, da: 3 }, cat: 0, lab: 1, dur: 3, d: 'Bắc qua sông để mở rộng thành sang bờ bên kia. Nối với đường. Giữ và kéo để bắc liền.' },
  well:   { n: 'Giếng', i: '⛲', c: { da: 15, go: 5 }, cat: 0, lab: 2, dur: 9, d: 'Giếng nước sạch: vệ sinh +, phục vụ bán kính 6 ô.' },
  watch:  { n: 'Trạm tuần', i: '🚩', c: { go: 25, da: 10, tien: 10 }, cat: 0, lab: 3, dur: 14, job: { c: 'nong', n: 3 }, d: 'Lính tuần đêm: trị an +, phục vụ bán kính 7 ô. Cần 3 hộ làm tuần đinh.' },
  clinic: { n: 'Y quán', i: '⚕️', c: { go: 30, da: 15, tien: 30 }, cat: 0, lab: 4, dur: 16, job: { c: 'si', n: 2 }, d: 'Thầy thuốc chữa bệnh: vệ sinh +, giảm thiệt hại dịch bệnh. Bán kính 9 ô.' },
  temple: { n: 'Chùa', i: '🛕', c: { go: 60, da: 40, tien: 30 }, cat: 0, lab: 8, dur: 28, job: { c: 'tang', n: 4 }, d: 'Dân tâm +3, cứu tế khi đói. Chùa có ruộng miễn thuế (hụt thuế nhẹ).' },
  school: { n: 'Châu học', i: '📚', c: { go: 50, da: 30, tien: 40 }, cat: 0, lab: 8, dur: 24, job: { c: 'si', n: 6 }, d: 'Đào tạo sĩ nhân: nguồn quan viên, tăng Thanh danh theo năm, +1 lượt thi.' },
  farm:   { n: 'Khu ruộng lúa', i: '🌾', c: { go: 15 }, cat: 1, lab: 3, dur: 7, job: { c: 'nong', n: 20 }, d: '20 nông hộ, 360 thạch/năm, gặt tháng 9 (vùng nam 2 vụ). Cần nông cụ, trâu, thủy lợi để tăng sản lượng.' },
  lumber: { n: 'Trại gỗ', i: '🪓', c: { go: 10 }, cat: 1, lab: 2, dur: 8, need: 'f', job: { c: 'nong', n: 10 }, out: { go: 6 }, d: '10 hộ, 6 gỗ/tuần. Phải đặt gần rừng (≤2 ô).' },
  quarry: { n: 'Mỏ đá', i: '⛏️', c: { go: 25 }, cat: 1, lab: 3, dur: 12, need: 'r', job: { c: 'nong', n: 10 }, out: { da: 4 }, d: '10 hộ, 4 đá/tuần. Phải gần núi đá (≤2 ô).' },
  mine:   { n: 'Mỏ sắt', i: '🪨', c: { go: 30, da: 15, tien: 20 }, cat: 2, lab: 4, dur: 16, need: 'm', job: { c: 'nong', n: 15 }, out: { quang: 4 }, d: '15 hộ, 4 quặng/tuần. Phải đặt gần mạch quặng (≤2 ô).' },
  salt:   { n: 'Ruộng muối', i: '🧂', c: { go: 30, tien: 10 }, cat: 1, lab: 3, dur: 8, need: 'w', job: { c: 'nong', n: 12 }, out: { muoi: 3 }, d: '12 hộ, 3 muối/tuần (mùa khô ×1,5, mùa mưa ×0,5). Phải gần nước. Muối là nguồn tiền lớn khi chuyên bán.' },
  mulberry: { n: 'Trại dâu tằm', i: '🌳', c: { go: 15 }, cat: 1, lab: 2, dur: 8, job: { c: 'nong', n: 10 }, out: { ken: 3 }, d: '10 hộ, 3 kén/tuần cho xưởng dệt lụa.' },
  tea:    { n: 'Vườn trà', i: '🍃', c: { go: 20, tien: 10 }, cat: 1, lab: 3, dur: 10, need: 'h', job: { c: 'nong', n: 12 }, out: { tra: 2 }, d: '12 hộ, 2 trà/tuần (hái rộ tháng 3–4 ×1,5). Phải đặt gần đồi (≤1 ô).' },
  stable: { n: 'Mã phường', i: '🐴', c: { go: 60, tien: 60 }, cat: 1, lab: 6, dur: 24, job: { c: 'nong', n: 8 }, d: '8 hộ, tốn 6 lương/tuần, ra 0,2 ngựa/tuần (≈7 con/năm).' },
  canal:  { n: 'Mương thủy lợi', i: '💧', c: { go: 10, da: 10 }, cat: 1, lab: 2, dur: 6, need: 'w3', d: 'Ruộng trong 3 ô được thủy lợi: ×1,3. Phải đặt trong 3 ô quanh nước.' },
  cloth:  { n: 'Xưởng vải', i: '🧶', c: { go: 30, da: 10 }, cat: 2, lab: 4, dur: 14, job: { c: 'cong', n: 10 }, out: { vai: 4 }, d: '10 thợ, 4 vải thô/tuần.' },
  silk:   { n: 'Xưởng dệt lụa', i: '🧵', c: { go: 40, da: 10, tien: 20 }, cat: 2, lab: 5, dur: 16, job: { c: 'cong', n: 15 }, in: { ken: 3 }, out: { lua: 2 }, d: '15 thợ, 3 kén → 2 lụa mỗi tuần.' },
  forge:  { n: 'Lò rèn', i: '🔥', c: { go: 30, da: 30, tien: 30 }, cat: 2, lab: 5, dur: 18, job: { c: 'cong', n: 10 }, in: { quang: 2, go: 2 }, d: '10 thợ: 2 quặng + 2 gỗ → 3 nông cụ HOẶC 1 binh khí (bấm vào lò để đổi).' },
  kiln:   { n: 'Lò gốm', i: '🏺', c: { go: 30, da: 30 }, cat: 2, lab: 5, dur: 16, job: { c: 'cong', n: 12 }, in: { go: 1 }, out: { gom: 2 }, d: '12 thợ, 1 gỗ → 2 gốm mỗi tuần.' },
  winery: { n: 'Lò rượu', i: '🍶', c: { go: 25, da: 10 }, cat: 2, lab: 3, dur: 10, job: { c: 'cong', n: 6 }, in: { luong: 4 }, out: { ruou: 3 }, d: '6 thợ, 4 lương → 3 vò rượu/tuần. Cấm nấu rượu khi đói kém.' },
  armory: { n: 'Xưởng binh khí', i: '⚒️', c: { go: 40, da: 40, tien: 40 }, cat: 2, lab: 6, dur: 22, rank: 2, job: { c: 'cong', n: 15 }, in: { quang: 3, go: 2 }, d: '15 thợ: 3 quặng + 2 gỗ → 2 binh khí HOẶC 1 giáp. Từ chức Thứ sử. Cần cho nỏ và trọng kỵ.' },
  market: { n: 'Phường thị', i: '🏮', c: { go: 40, da: 20, tien: 20 }, cat: 3, lab: 5, dur: 16, job: { c: 'thuong', n: 8 }, d: 'Chợ: thu hút thương hộ, nâng phồn vinh, thu thuế chợ; phục vụ như kho (bán kính 8 ô).' },
  port:   { n: 'Bến cảng', i: '⚓', c: { go: 80, da: 40, tien: 60 }, cat: 3, lab: 6, dur: 30, rank: 2, need: 'w3', job: { c: 'thuong', n: 10 }, d: 'Bến thuyền ở bờ nước: mở hải thương cho thương đội (lãi cao, rủi ro bão và hải tặc). Phải đặt trong 3 ô quanh nước.' },
  inn:    { n: 'Dịch trạm', i: '🐎', c: { go: 40, da: 10, tien: 20 }, cat: 3, lab: 3, dur: 12, need: 'road', job: { c: 'thuong', n: 2 }, d: 'Trạm ngựa trên đường: sức buôn bán +25%, hao hụt thương lộ −1%. Phải đặt sát đường.' },
  granary:{ n: 'Kho lương', i: '🛖', c: { go: 30, da: 10 }, cat: 3, lab: 3, dur: 12, d: 'Kho + thường bình thương. Tăng sức chứa, phục vụ công trình trong 8 ô theo đường, bật được thường bình thương.' },
  wall:   { n: 'Tường thành', i: '🧱', c: { da: 6 }, cat: 4, lab: 1, dur: 6, d: 'Tường gạch có nữ tường: thành phòng +1,5 mỗi đoạn. Giữ và kéo để xây liền.' },
  gate:   { n: 'Cổng thành', i: '⛩️', c: { go: 20, da: 20 }, cat: 4, lab: 3, dur: 22, d: 'Cổng thành lâu nối liền tường: thành phòng +3, đường đi xuyên qua.' },
  tower:  { n: 'Vọng lâu', i: '🏯', c: { go: 20, da: 30 }, cat: 4, lab: 3, dur: 24, d: 'Lầu canh có cung thủ: thành phòng +6.' },
  beacon: { n: 'Phong hỏa đài', i: '🔥', c: { go: 10, da: 25 }, cat: 4, lab: 3, dur: 16, d: 'Đốt lửa báo giặc: biết trước thêm 2 tuần, thành phòng +3.' },
  barracks:{ n: 'Quân doanh', i: '⚔️', c: { go: 50, da: 40, tien: 50 }, cat: 4, lab: 6, dur: 22, job: { c: 'nong', n: 4 }, d: 'Nơi mộ quân và luyện quân: huấn luyện +1,5/tuần (tối đa 100). Mỗi quân doanh luyện được 300 lính.' },
  del:    { n: 'Phá dỡ', i: '🔨', c: {}, cat: 0, d: 'Phá công trình, hoàn lại 50% vật liệu.' },
};
LT.DRAG = { road: 1, pave: 1, wall: 1, canal: 1, bridge: 1 };
LT.AREA = { house: 1, terrace: 1, mansion: 1, farm: 1, mulberry: 1, tea: 1, lumber: 1, quarry: 1, well: 1 }; // kéo chọn hình chữ nhật để đặt hàng loạt
// công trình tính giá trị bảo trì 2%/năm (KT §8.3)
LT.GOOD_PRICE_VAL = { go: 0.3, da: 0.3, tien: 1 };

// ---- Năm chỉ số của thành (GP §5.5) -----------------------------------------
LT.STATS = {
  dantam: { n: 'Dân tâm', i: '❤️', d: 'Tăng nhờ thuế nhẹ, no đủ, chùa, cứu tế. Tụt thì dân bỏ trốn, thấp quá thì nổi loạn.' },
  trian: { n: 'Trị an', i: '🛡️', d: 'Tăng nhờ trạm tuần, lính đồn trú, phường yên. Tụt thì trộm cướp, buôn lậu, cháy lớn.' },
  vesinh: { n: 'Vệ sinh', i: '💧', d: 'Tăng nhờ giếng, y quán, nhà không chen chúc. Tụt thì dịch bệnh mùa hè.' },
  phonvinh: { n: 'Phồn vinh', i: '🏮', d: 'Tăng nhờ chợ, đường tốt, hàng hóa đa dạng. Tụt thì thương nhân bỏ đi.' },
  thanhphong: { n: 'Thành phòng', i: '🏯', d: 'Điểm tường, cổng, vọng lâu, phong hỏa đài. Quyết định thủ thành khi giặc đến.' },
};

// ---- Quan lộ (GP §6) -------------------------------------------------------
LT.RANKS = [
  null,
  { n: 'Tri huyện', army: 300, unit: 100, mil: 'Trấn tướng', d: 'Cai trị 1 huyện thành, 300 hương binh.' },
  { n: 'Thứ sử', army: 2500, unit: 250, mil: 'Chỉ huy sứ', d: '1 châu thành + các huyện thuộc, 2.500 quân.' },
  { n: 'Phòng ngự sứ', army: 6000, unit: 500, mil: 'Đô chỉ huy sứ', d: 'Thêm binh quyền cả châu, 6.000 quân, được xuất quân.' },
  { n: 'Tiết độ sứ', army: 20000, unit: 2500, mil: 'Tiết độ sứ', d: 'Một trấn gồm 3–6 châu, 20.000 quân (đơn vị là quân 2.500), tự bổ quan, giữ phần lớn thuế.' },
  { n: 'Vương', army: 60000, unit: 7000, mil: 'Vương', d: 'Cát cứ tự trị, ngoại giao riêng, đúc tiền, 60.000 quân.' },
  { n: 'Hoàng đế', army: 250000, unit: 15000, mil: 'Hoàng đế', d: 'Lập triều đình, đặt niên hiệu, quân không giới hạn (tối đa 250.000 trong bản này).' },
];
LT.KHAO_MUC = [
  { id: 'hokhau', n: 'Hộ khẩu tăng', d: 'So với đầu năm: tăng 10% được trọn 20 điểm, đứng yên 10 điểm.' },
  { id: 'thue', n: 'Thuế nộp đủ', d: 'Số đã nộp thượng cung và lưu sứ so với định mức năm (đặt từ xuân).' },
  { id: 'kho', n: 'Kho lương', d: 'Kho lương (quan + dân) đủ bao nhiêu tuần; đủ 18 tuần được trọn điểm.' },
  { id: 'trian', n: 'Trị an', d: 'Chỉ số trị an chia 5.' },
  { id: 'congtrinh', n: 'Công trình công', d: 'Đường, tường, giếng, y quán, châu học… so với quy mô dân.' },
];

// ---- Binh chủng (GP §9.2, bảng) ---------------------------------------------
// cong/thu: Công, Thủ; ranged: 'cung' bắn 2 hiệp đầu, 'no' bắn cách hiệp; kind: 'bo','ky','xa'
LT.UNITS = {
  truongthuong: { n: 'Trường thương', i: '🔱', cong: 9,  thu: 10, kind: 'bo', d: 'Rẻ, giữ trận tốt. Khắc kỵ binh ×1,5.',      cost: { binhkhi: 1 }, rank: 1 },
  daothuan:     { n: 'Đao thuẫn',     i: '🛡️', cong: 10, thu: 12, kind: 'bo', d: 'Giảm 30% sát thương tên. Khắc cung thủ ×1,3.', cost: { binhkhi: 1.5 }, rank: 1 },
  cung:         { n: 'Cung thủ',      i: '🏹', cong: 8,  thu: 4,  kind: 'xa', ranged: 'cung', d: 'Bắn 2 hiệp đầu, bắn qua đầu tuyến trước. Khắc trường thương ×1,3.', cost: { go: 2 }, rank: 1 },
  no:           { n: 'Nỏ thủ',        i: '🎯', cong: 11, thu: 5,  kind: 'xa', ranged: 'no', d: 'Xuyên giáp, bắn cách hiệp. Khắc trọng kỵ ×1,4. Cần xưởng binh khí.', cost: { binhkhi: 2 }, rank: 2, need: 'armory' },
  khinhky:      { n: 'Khinh kỵ',      i: '🐎', cong: 11, thu: 7,  kind: 'ky', d: 'Đánh sườn, truy kích ×2. Khắc cung, nỏ ×1,5. Cần mã phường.', cost: { ngua: 1, binhkhi: 0.5 }, rank: 1, need: 'stable' },
  trongky:      { n: 'Trọng kỵ',      i: '🐴', cong: 15, thu: 12, kind: 'ky', d: 'Xung phong ×1,8 ở hiệp giáp chiến đầu. Khắc đao thuẫn ×1,3. Cần mã phường + xưởng binh khí.', cost: { ngua: 1, giap: 1, binhkhi: 1 }, rank: 2, need: 'stable+armory' },
  congthanh:    { n: 'Công thành', i: '🪜', cong: 2, thu: 3, kind: 'bo', siege: true, d: 'Vân thê, xung xa, xe bắn đá: phá Thành phòng khi vây thành. Đánh dã chiến rất yếu.', cost: { go: 6, tien: 3 }, rank: 3 },
  nhabinh:      { n: 'Nha binh',      i: '⚜️', cong: 14, thu: 14, kind: 'bo', d: 'Sĩ khí khó vỡ, hay đòi thưởng. Tốn tiền nhiều.', cost: { tien: 20, binhkhi: 1 }, rank: 3 },
};
LT.UNIT_IDS = Object.keys(LT.UNITS);
// bảng khắc chế (cột "Khắc"): KHAC[a][b] = hệ số khi a đánh b
LT.KHAC = {
  truongthuong: { khinhky: 1.5, trongky: 1.5 },
  daothuan: { cung: 1.3 },
  cung: { truongthuong: 1.3 },
  no: { trongky: 1.4 },
  khinhky: { cung: 1.5, no: 1.5 },
  trongky: { daothuan: 1.3 },
};

// ---- Tám trận hình (GP §10.2) -----------------------------------------------
LT.FORMATIONS = {
  phuong:  { n: 'Phương trận', d: 'Thủ +10% toàn quân. Dùng khi chưa rõ địch, quân đều tay. Không điểm yếu lớn, cũng không điểm mạnh.' },
  vien:    { n: 'Viên trận', d: 'Thủ +25%, Công −15%, miễn đánh sườn. Dùng khi ít quân, chờ viện binh. Sợ bị vây lâu, hết tên, hết lương.' },
  phongthi:{ n: 'Phong thỉ', d: 'Trung quân Công +25%, hai cánh Thủ −15%. Dùng để đột phá, bắt chủ tướng. Sợ Yển nguyệt, phục binh hai bên.' },
  nhanhanh:{ n: 'Nhạn hành', d: 'Bắn +20%, hai cánh Công +10%, trung Thủ −10%. Dùng khi nhiều cung nỏ. Sợ Phong thỉ, trọng kỵ xung phong.' },
  hacduc:  { n: 'Hạc dực', d: 'Nếu quân số ≥ 1,3 lần địch: đánh sườn sớm từ hiệp 3; trung Thủ −15%. Dùng khi đông quân hơn hẳn. Sợ Phong thỉ chọc thủng giữa.' },
  ngulan:  { n: 'Ngư lân', d: 'Hao sĩ khí −20%, tuyến sau lên thay nhanh (không bị phạt khi đổi vị trí). Dùng khi đánh lâu, quân tinh nhuệ. Sợ Hạc dực bọc sườn.' },
  yennguyet:{ n: 'Yển nguyệt', d: 'Chọn 1 cánh Công +30%, cánh kia Công −20%. Dùng khi tướng giỏi, đánh lệch một bên. Sợ địch dồn sức vào cánh yếu.' },
  truongxa:{ n: 'Trường xà', d: 'Giáp chiến −10% Công; bị phục kích chỉ chịu nửa thiệt hại; hợp ải hẹp. Sợ giao chiến trên đồng bằng.' },
};
LT.FORM_IDS = Object.keys(LT.FORMATIONS);
LT.TERRAINS = {
  dongbang: { n: 'Đồng bằng', d: 'Kỵ binh Công ×1,1.' },
  doi:      { n: 'Đồi', d: 'Bên giữ cao Thủ ×1,2.' },
  rung:     { n: 'Rừng', d: 'Kỵ binh Công ×0,7; cho phép phục binh.' },
  damlay:   { n: 'Đầm lầy', d: 'Trọng kỵ Công ×0,5.' },
  vuotsong: { n: 'Vượt sông', d: 'Bên vượt Công ×0,7 trong 3 hiệp đầu.' },
  ai:       { n: 'Ải hẹp', d: 'Chỉ 1 cánh (trung quân) giao chiến.' },
};
// Lệnh ba giai đoạn (GP §10.3)
LT.ORDERS = {
  p1: [
    { id: 'banphu', n: 'Bắn phủ đầu', d: 'Cung nỏ bắn đủ 2 hiệp.' },
    { id: 'tiengap', n: 'Tiến gấp', d: 'Bỏ qua 1 hiệp bắn của cả hai bên, giáp chiến sớm 1 hiệp; quân mệt +10.' },
    { id: 'giutran', n: 'Giữ trận dụ địch', d: 'Thủ +15% trong 4 hiệp đầu, nhường quyền chủ động.' },
  ],
  p2: [
    { id: 'tongcong', n: 'Tổng công', d: 'Công +15%, Thủ −10%.' },
    { id: 'camcu', n: 'Cầm cự', d: 'Thủ +15%, Công −10%, hao sĩ khí chậm (×0,7).' },
    { id: 'trabai', n: 'Trá bại', d: 'Lùi 1 hiệp. Trí tướng ta > Trí tướng địch: địch vỡ đội hình (ta phản công); không thì ta mất sĩ khí.' },
  ],
  p3: [
    { id: 'kybochau', n: 'Kỵ binh bọc hậu', d: 'Kỵ binh hai cánh đánh thẳng hậu quân địch ×1,3.' },
    { id: 'dubi', n: 'Dự bị dồn vào trung quân', d: 'Dự bị vào thay các ô trung quân đã vỡ hoặc trống.' },
    { id: 'thuquan', n: 'Thu quân có trật tự', d: 'Nếu đang thua: thiệt hại hiệp 9–12 ×0,6 và rút ở hiệp cuối.' },
  ],
};
// Quân lệnh điều kiện "nếu… thì…" (GP §10.3). Số quân lệnh = 2 + Thống ÷ 25
LT.CONDS = [
  { id: 'canhtrai', n: 'Nếu cánh trái địch vỡ → khinh kỵ truy kích', d: 'Khinh kỵ ta Công ×1,3 trong 2 hiệp tiếp theo.' },
  { id: 'canhphai', n: 'Nếu cánh phải địch vỡ → khinh kỵ truy kích', d: 'Khinh kỵ ta Công ×1,3 trong 2 hiệp tiếp theo.' },
  { id: 'sikhi40', n: 'Nếu sĩ khí trung quân < 40 → dự bị vào thay', d: 'Một đơn vị dự bị thay trung quân.' },
  { id: 'thuongvong30', n: 'Nếu thương vong > 30% → thu quân', d: 'Rút lui có trật tự, thiệt hại sau đó ×0,6, trận kết thúc.' },
  { id: 'trongky', n: 'Nếu địch dùng trọng kỵ xung phong → tuyến đầu đổi sang trường thương', d: 'Tuyến đầu ta khắc kỵ binh ×1,5 cả trận.' },
  { id: 'sikhi50', n: 'Nếu sĩ khí quân ta < 50 → chuyển sang Cầm cự', d: 'Thủ +15%, hao sĩ khí ×0,7.' },
];
LT.NAME_FIRST = ['Lý', 'Trần', 'Chu', 'Hạ', 'Phùng', 'Cao', 'Đinh', 'Lưu', 'Ngô', 'Mã', 'Tiền', 'Dương', 'Kiều', 'Vương', 'Tạ', 'Phạm'];
LT.NAME_MID = ['Tồn', 'Đức', 'Văn', 'Quang', 'Hồng', 'Thừa', 'Nhân', 'Đạo', 'Cảnh', 'Sư', 'Hiển', 'Bá', 'Trọng', 'Hữu'];
LT.NAME_LAST = ['Thắng', 'Uy', 'Tín', 'Kỳ', 'Hùng', 'Nghĩa', 'Trực', 'Lễ', 'Dũng', 'Vinh', 'Cẩn', 'Bân', 'Chiêu', 'Dực'];

// ---- 12 nước (GP §3) -------------------------------------------------------
// diff: độ khó khi chọn. chr: tính cách máy. mod: hiệu chỉnh khởi đầu (quyết định riêng — xem README)
LT.NATIONS = [
  { id: 0, n: 'Hậu Lương', cap: 'Biện Châu', cities: 22, str: 'Đông dân, nhiều thành, chính thống Trung Nguyên', weak: 'Bốn mặt thụ địch, tướng hay phản', diff: 'Khó', chr: 'hiếu chiến', x: 0.50, y: 0.44, col: '#c9a64e', adj: [1, 2, 4, 7, 9, 10], mod: { ho: 1.2, tien: 0.9, luong: 1, raid: 1.25, yield: 1, wall: 0, ta: 1 } },
  { id: 1, n: 'Tấn', cap: 'Thái Nguyên', cities: 12, str: 'Kỵ binh Sa Đà mạnh nhất', weak: 'Đất nghèo lương', diff: 'Vừa', chr: 'hiếu chiến', x: 0.46, y: 0.25, col: '#8e6bb0', adj: [0, 2, 10], mod: { ho: 1, tien: 1, luong: 0.9, raid: 1.1, yield: 0.92, wall: 0, ngua: 0.7, kyStart: 1 } },
  { id: 2, n: 'Kỳ', cap: 'Phượng Tường', cities: 5, str: 'Thành hiểm, dễ thủ', weak: 'Nhỏ, kiệt quệ', diff: 'Rất khó', chr: 'thủ thành', x: 0.30, y: 0.42, col: '#9a6a52', adj: [0, 1, 3], mod: { ho: 0.9, tien: 0.7, luong: 0.8, raid: 1.5, yield: 1, wall: 12 } },
  { id: 3, n: 'Tiền Thục', cap: 'Thành Đô', cap2: '', cities: 14, str: 'Giàu lụa, trà, muối; núi che chở', weak: 'Triều đình xa hoa, quân yếu', diff: 'Dễ', chr: 'trọng thương', x: 0.22, y: 0.58, col: '#5e9d6e', adj: [2, 9, 7], mod: { ho: 1, tien: 1.4, luong: 1.1, raid: 0.7, yield: 1, wall: 0, price: { tra: 1.15, lua: 1.15, muoi: 1.1 } } },
  { id: 4, n: 'Ngô', cap: 'Dương Châu', cities: 14, str: 'Thương nghiệp, thủy quân', weak: 'Quyền thần lấn vua', diff: 'Vừa', chr: 'trọng thương', x: 0.68, y: 0.52, col: '#4f86a8', adj: [0, 5, 6, 7, 9], mod: { ho: 1, tien: 1.1, luong: 1, raid: 1, yield: 1.05, wall: 0, trade: 1.2 } },
  { id: 5, n: 'Ngô Việt', cap: 'Hàng Châu', cities: 8, str: 'Gốm, lụa, hải thương, Phật giáo', weak: 'Ít đất, ít kỵ binh', diff: 'Dễ', chr: 'trọng thương', x: 0.78, y: 0.60, col: '#6ab0b0', adj: [4, 6], mod: { ho: 1, tien: 1.3, luong: 1, raid: 0.7, yield: 1, wall: 0, price: { gom: 1.15, lua: 1.15 } } },
  { id: 6, n: 'Mân', cap: 'Phúc Châu', cities: 5, str: 'Hải thương, núi hiểm', weak: 'Nhỏ, nội loạn', diff: 'Khó', chr: 'phản trắc', x: 0.74, y: 0.74, col: '#b97d4a', adj: [4, 5, 7, 8], mod: { ho: 0.9, tien: 0.9, luong: 0.9, raid: 1.2, yield: 1, wall: 4, nam: 1 } },
  { id: 7, n: 'Sở', cap: 'Đàm Châu', cities: 9, str: 'Trà, đúc tiền', weak: 'Quân kém', diff: 'Vừa', chr: 'trọng thương', x: 0.50, y: 0.64, col: '#7d9a4a', adj: [0, 3, 4, 6, 8, 9], mod: { ho: 1, tien: 1.1, luong: 1, raid: 1, yield: 1, wall: 0, price: { tra: 1.1 } } },
  { id: 8, n: 'Nam Hán', cap: 'Hưng Vương phủ', cities: 10, str: 'Ngọc trai, hải thương, voi chiến', weak: 'Xa trung tâm, chính sự hà khắc', diff: 'Vừa', chr: 'hiếu chiến', x: 0.52, y: 0.84, col: '#c4604a', adj: [6, 7, 11], mod: { ho: 1, tien: 1, luong: 1, raid: 1, yield: 1, wall: 0, nam: 1 } },
  { id: 9, n: 'Kinh Nam', cap: 'Giang Lăng', cities: 3, str: 'Ngã tư thương lộ, thu thuế quá cảnh', weak: 'Chỉ 3 thành, kẹp giữa các nước lớn', diff: 'Rất khó', chr: 'phản trắc', x: 0.44, y: 0.54, col: '#a38d63', adj: [0, 3, 4, 7], mod: { ho: 0.9, tien: 0.8, luong: 0.9, raid: 1.5, yield: 1, wall: 0, quaCanh: 12 } },
  { id: 10, n: 'Khiết Đan', cap: 'Thượng Kinh', cities: 12, str: 'Kỵ binh du mục đông đảo', weak: 'Công thành kém, kinh tế nông nghiệp yếu', diff: 'Vừa', chr: 'hiếu chiến', x: 0.62, y: 0.12, col: '#4a6aa0', adj: [0, 1], mod: { ho: 1, tien: 1, luong: 0.9, raid: 1.1, yield: 0.85, wall: 0, ngua: 0.7, kyStart: 1 } },
  { id: 11, n: 'Tĩnh Hải quân', cap: 'Đại La', cities: 6, str: 'Lúa nước, dân đồng lòng chống xâm lấn', weak: 'Ít sắt, ít ngựa', diff: 'Khó', chr: 'thủ thành', x: 0.36, y: 0.93, col: '#5aa05a', adj: [8], mod: { ho: 1, tien: 0.85, luong: 1, raid: 1.2, yield: 1, wall: 0, nam: 1, dt: 8, iron: 0.4 } },
];
LT.DIFF_START = { 'Dễ': 1.25, 'Vừa': 1.0, 'Khó': 0.85, 'Rất khó': 0.7 };
LT.NATION_PERKS = {
  0: 'Đông dân hơn (+20% hộ ban đầu), nhưng giặc cỏ mạnh hơn.',
  1: 'Có sẵn 1 đô khinh kỵ; ngựa rẻ 30%; đất nghèo lương (−8% sản lượng).',
  2: 'Thành hiểm: thành phòng +12 ngay từ đầu; vốn liếng ít, giặc dữ.',
  3: 'Lụa, trà, muối bán giá cao hơn; tiền vốn dồi dào; giặc ít.',
  4: 'Thương nghiệp: sức buôn bán +20%; ruộng tốt hơn 5%.',
  5: 'Gốm, lụa bán giá cao hơn; tiền vốn khá; giặc ít.',
  6: 'Núi hiểm (+4 thành phòng), vùng nam hai vụ lúa; nội loạn nhiều.',
  7: 'Trà bán giá cao hơn; quân kém.',
  8: 'Vùng nam hai vụ lúa; thích gây chiến.',
  9: 'Thu thuế quá cảnh mỗi tuần; chỉ 3 thành, kẹp giữa các nước lớn.',
  10: 'Có sẵn 1 đô khinh kỵ; ngựa rẻ 30%; nông nghiệp yếu (−15%).',
  11: 'Hai vụ lúa, dân đồng lòng (+8 dân tâm), nhưng ít quặng sắt.',
};
LT.NATION_CHR = { 'hiếu chiến': 'Hay xuất binh, quan hệ dễ xấu đi', 'thủ thành': 'Chỉ lo giữ đất, ít đánh ra ngoài', 'trọng thương': 'Thích buôn bán, dễ thông thương', 'phản trắc': 'Dễ trở mặt, bội ước' };

// ---- Ngoại giao (CT §7.2) ---------------------------------------------------
// ngưỡng thuyết phục; rank: chức tối thiểu để được làm (CT §7.1, đã giản lược)
LT.TREATIES = {
  thongthuong: { n: 'Thông thương (chợ biên)', th: 30, rank: 1, d: 'Mở thương lộ: sức buôn +15% và thuế quá cảnh mỗi tuần.' },
  batxam: { n: 'Bất xâm phạm 5 năm', th: 45, rank: 2, d: 'Nước đó không đánh bạn trong 5 năm.' },
  muonduong: { n: 'Mượn đường', th: 50, rank: 3, d: 'Cho quân đi qua đất — mở đường tiếp tế.' },
  hoathan: { n: 'Hòa thân', th: 55, rank: 2, d: 'Kết hôn: quan hệ +20 lâu dài, Chính danh +.' },
  lienminh: { n: 'Liên minh phòng thủ', th: 60, rank: 3, d: 'Bị đánh thì được cứu: viện binh ở trận thủ thành.' },
  xungthan: { n: 'Xưng thần – sách phong', th: 40, rank: 3, d: 'Triều cống hằng năm, đổi lấy che chở và danh nghĩa.' },
};

LT.CITY_LEVS_TXT = c => 'trần ' + LT.fmtN(LT.CITY_LEVELS[c.lvl].cap) + ' hộ, hiện ' + LT.fmtN(c.ho) + ' hộ (khởi đầu tối đa ' + LT.fmtN([0, 1500, 4000, 9000, 16000][c.lvl]) + ' hộ)';
LT.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
LT.fmtN = v => { v = Math.round(v); return Math.abs(v) >= 10000 ? (v / 1000).toFixed(1).replace('.', ',') + 'k' : String(v); };
LT.fmt1 = v => (Math.round(v * 10) / 10).toString().replace('.', ',');
LT.costTxt = c => Object.keys(c).map(k => (k === 'tien' ? '🪙' : LT.GOODS[k].i) + c[k]).join(' ') || '—';
})(typeof globalThis !== 'undefined' ? globalThis : window);

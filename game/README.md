# Loạn Thế Lập Quốc — bản chơi được (lát cắt dọc)

Mở `index.html` bằng trình duyệt (chạy được trực tiếp bằng `file://`: không dùng ES module, không fetch, không CDN, không cần build). Hình ảnh vẽ bằng canvas/CSS. Phần xây thành và phong cách hình ảnh sao chép từ `demo-thanh-tri\` (không sửa gì trong thư mục đó).

## Cách chơi nhanh
Bạn là **tri huyện** năm 917. Chọn nước ở màn đầu (cũng là chọn độ khó). Việc đầu tiên: dựng Trại gỗ và Mỏ đá (gần rừng/núi), đắp đường nối về phủ, dựng thêm nhà, kho lương, chợ, giếng, trạm tuần; vào 📜 Triều chính chỉnh thuế. Tháng 12 hằng năm có khảo khóa; đủ 3 lần hạng Thượng (hoặc 2 quân công), Thanh danh ≥ 40 và đỗ Tỉnh thí thì thăng **Thứ sử**; dẹp loạn/thắng trận, thành phòng ≥ 50, uy vọng ≥ 30 thì thăng **Phòng ngự sứ** = mốc chiến thắng của bản này.
Điều khiển: kéo chuột = di chuyển, cuộn = thu phóng, Cách = tạm dừng, 1/2/3 = x1/x2/x4, T Triều chính, Q Quân vụ, W Thiên hạ, S Sổ sách, H về phủ, G lưới, Esc bỏ chọn. Rê chuột lên mọi con số để xem vì sao nó thay đổi; 📒 Sổ sách liệt kê từng khoản thu/chi mỗi tuần và mỗi năm.

## Tệp
- `index.html`, `style.css` — khung giao diện (1280×720 là cỡ thiết kế).
- `js/data.js` — mọi con số gốc, mỗi khối ghi mục tài liệu (GP/KT/CT).
- `js/city.js` (bản đồ 48×48, đặt công trình, nối đường BFS 8 ô, chia nhân công), `js/economy.js` (sản xuất, nhu cầu theo tầng lớp, thương lộ, thuế, hộ khẩu, năm chỉ số), `js/game.js` (khởi tạo, nhịp tuần, lưu/tải), `js/politics.js` (khảo khóa, thăng chức, bố cáo, huyện thuộc quyền, Tỉnh thí), `js/battle.js` (chiến trận), `js/war.js` (quân vụ, giặc, loạn, xâm lấn), `js/events.js` (13 biến cố), `js/world.js` (12 nước, ngoại giao). Các tệp này **không đụng DOM** và chạy được bằng node.
- `js/engine.js`, `render-base.js`, `render-gfx.js`, `render-build.js` — vẽ isometric lấy từ demo (có vá); `render.js` (công trình mới, vòng vẽ, bộ đệm hình); `ui.js`, `ui-panels.js`, `ui-war.js`, `main.js` — giao diện, vòng lặp, điều khiển.
- `tests/battle.test.js`, `tests/sim.test.js` — kiểm thử (`node tests/battle.test.js`, `node tests/sim.test.js`).

## Đã làm tới đâu
1. **Thành trị sở (M1)** — đầy đủ: bản đồ 48×48 có sông, ao, rừng, núi đá, mạch quặng, đồi, độ phì đất; 30 loại công trình (đường đất/quan đạo, nhà, giếng, trạm tuần, y quán, chùa, châu học, ruộng, trại gỗ, mỏ đá, mỏ sắt, ruộng muối, dâu tằm, vườn trà, mã phường, mương thủy lợi, xưởng vải, dệt lụa, lò rèn, lò gốm, lò rượu, xưởng binh khí, chợ, dịch trạm, kho lương, tường, cổng, vọng lâu, phong hỏa đài, quân doanh); thi công theo giai đoạn và tốc độ; công trình ngoài 8 ô đường tới kho/chợ chỉ đạt 60%; 8 tầng lớp theo hộ với nhu cầu hằng năm đúng bảng KT §3, lên/tụt tầng; chuỗi sản xuất (lúa→lương, dâu→kén→lụa, quặng+gỗ→nông cụ/binh khí, lương→rượu, gỗ→gốm, muối, trà, vải); lịch tuần/tháng/năm, tạm dừng/x1/x2/x4 và nút qua 1 tuần; gặt tháng 9 (vùng nam 2 vụ: tháng 6 và 10), hạ thuế tháng 6, thu thuế tháng 11, 5 mức thuế, chia thuế ba phần, chuyên bán muối/trà/rượu, thường bình thương, lao dịch; thương nhân nhập hàng thiếu/bán hàng dư; năm chỉ số tác động thật (dân bỏ trốn/nổi loạn, trộm cướp/cháy, dịch mùa hè, thương nhân bỏ đi, thành phòng cho trận thủ thành); 13 biến cố 2–3 lựa chọn đánh đổi.
2. **Quan lộ (M2)** — khảo khóa tháng 12 (5 mục × 20, bảng điểm, hậu quả, thưởng/phạt/giáng/bãi chức), Thanh danh, Uy vọng, Tín, nghi kỵ; thăng Thứ sử (kèm thi Tỉnh thí bản rút gọn) rồi Phòng ngự sứ; thăng chức đổi số thật (tỉ lệ chia thuế, quân tối đa 300→2.500→6.000, mở xưởng binh khí/nỏ/trọng kỵ/chuyên bán trà rượu, 3 huyện thuộc quyền với phương châm và tỉ lệ nộp về); bố cáo (4 loại, tối đa 2).
3. **Chiến trận (M4)** — 7 binh chủng theo bảng 9.2 (thủy quân, công thành không có vì không có sông-biển/vây thành trong lát cắt này); bày trận lưới 3×3 + 3 dự bị + phục binh; 8 trận hình; lệnh 3 giai đoạn; quân lệnh "nếu… thì…" (số lượng = 2 + Thống ÷ 25); công thức mục 10.4 chạy từng hiệp, chiến báo liệt kê từng dòng tính; ước tính tỉ lệ thắng (60 lần mô phỏng); 6 địa hình; sĩ khí, vỡ trận, trung quân vỡ, truy kích. Lý do để đánh: **giặc cỏ** tới định kỳ (báo trước 3 tuần, phong hỏa đài +2), **loạn dân** khi dân tâm quá thấp, **nước láng giềng xâm lấn**, **tiễu phỉ** chủ động, cộng chế độ **diễn tập sa bàn**. Kết quả trận tác động thật: chiến lợi phẩm, cướp phá, hộ chết, quân công/dẹp loạn tính vào thăng chức, thành thất thủ = thua.
4. **Thiên hạ/ngoại giao (M3/M5, giản lược)** — đúng 12 nước và thông tin bảng mục 3 (120 thành), bản đồ bấm được, quan hệ −100..+100, công thức điểm thuyết phục CT §7.2 hiện từng thành phần; hành động: biếu lễ vật, thông thương, bất xâm phạm, hòa thân, liên minh phòng thủ, xưng thần, tuyệt giao (các hành động ngoài quyền chức hiện lý do khóa); các nước máy đánh nhau, đổi quan hệ, bị diệt; 4 biến cố lịch sử không cố định ngày (Hậu Lương đổi chủ → Hậu Đường, Khiết Đan nam hạ, phương nam xưng đế, một nước nhỏ bị thôn tính).
5. **Khung ván** — chọn nước + độ khó + đặc thù, hướng dẫn ngắn khi bắt đầu và gợi ý việc cần làm, mục tiêu luôn hiện, lưu tay 3 ô + tự lưu (mỗi 6 tuần và cuối năm) bằng localStorage, điều kiện thua (bãi chức, bị triệu về vì nghi kỵ, thành thất thủ, dân bỏ hết), mốc thắng (Phòng ngự sứ; sau đó giữ đến 979).

## Chủ động bỏ ra ngoài
Ngạch võ tướng và các kỳ thi võ; chọn lại ngạch; bè phái, đình nghị, đàn hặc; tiết độ sứ trở lên, xưng vương, làm phản, thánh chỉ; công thành/phòng thủ thành kiểu vây (chỉ có hệ số tường cho thủ thành); thủy quân và công thành; hành quân/tiếp tế trên bản đồ; gián điệp; mưu kế (chỉ có phục binh, trá bại); tiền tệ/đúc tiền/vay nợ; hào tộc lấn ruộng chỉ ở dạng biến cố; thương đội quan; chiến dịch sau chức Phòng ngự sứ. Chữ "không có tính năng sắp ra mắt" nên các thứ này không hiện trong giao diện.

## Quyết định riêng vì tài liệu bỏ ngỏ (hoặc phải giản lược để chơi được)
- **Quy mô:** một "nhà dân" là dãy nhà 15 hộ; ván khởi đầu có 123 hộ, 10 nhà, 4 khu ruộng, 1 đô hương binh. Một khu ruộng 20 hộ như tài liệu. Đơn vị quân ở chức tri huyện là **đô 100 lính** (tối đa 300), thứ sử 250, phòng ngự sứ 500, để lưới 3×3 không trống.
- **Lương hai kho:** *kho quan* (thuế thóc, quân và thuộc lại ăn từ đó) và *kho dân* (thu hoạch đổ vào đây, dân ăn từ đây; thương nhân bán lương dư; thuế thóc rút 10% × sản lượng × mức thuế từ kho dân). Quân thiếu lương thì quan tự mua của dân theo giá chợ.
- **Tiền trong dân** (`wealth`): thương nhân nhập hàng thiếu giá ×1,3 và bán hàng dư giá ×0,85 trong sức buôn (thương hộ × 3 quan/tuần, có chợ mới đủ); tiền hạ thuế rút từ đó (tiền hoang khi thiếu); thuế chợ = 2% + 3% (×phồn vinh) trên mậu dịch.
- **Khảo khóa:** hộ khẩu = 10 + 100×%tăng; thuế nộp đủ = nộp thực tế ÷ định mức năm (70% × thu theo mức Thường, tính từ xuân) × 20; kho = tuần ăn ÷ 18 × 20; trị an ÷ 5; công trình công = điểm quy đổi ÷ (40 + hộ/8). Hạng Thượng được thưởng 50 + hộ/8 quan.
- **Quân:** 10 lính = 1 hộ (lính chết mất hộ); hương binh ở chức tri huyện chỉ lĩnh 30% quân lương tiền (dân binh); trinh sát không có — luôn thấy đội hình địch; cung bắn hiệp 1–2 rồi chỉ còn cận chiến yếu (×0,4), nỏ bắn hiệp lẻ; tiến gấp: giáp chiến từ hiệp 2, chỉ bắn hiệp 1; xung phong ×1,8 ở hiệp giáp chiến đầu; trá bại ở hiệp 4. Giặc đến luôn cỡ vừa phải so với quân bạn đang có (≤ 1,3 × quân + 60).
- **Nước chọn:** hiệu chỉnh khởi đầu nhỏ cho mỗi nước (vốn, lương, hộ, thành phòng, giá hàng đặc sản, ngựa, hai vụ lúa cho nước phương nam, thuế quá cảnh Kinh Nam…), xem màn chọn nước.
- **Thi Tỉnh thí rút gọn:** 6 câu kinh nghĩa (30đ) + 2 án (30đ) + sách luận chọn 3/6 chính sách (40đ), đỗ ≥ 65; chỉ có ngạch văn. Không có hành quyển/hối lộ chủ khảo.
- **Bộ đệm hình (kỹ thuật):** công trình và mặt đất được vẽ vào bộ đệm và chỉ vẽ lại mỗi ~1,4 giây hoặc khi cần để giữ ~45 khung hình/giây; chuyển động nhỏ trong công trình (khói, cờ) vì vậy hơi giật nhịp.

## Kiểm thử đã chạy
`node tests/battle.test.js` (ví dụ 10.4: 600 trường thương → 30,98 ≈ 31 thương vong, xung phong 54,7 ≈ 55, 8 trận hình, 6 địa hình, quân lệnh thu quân) và `node tests/sim.test.js` (một năm kinh tế không NaN, 5 năm bỏ mặc vs chơi hợp lý, 10 năm chơi hợp lý có giặc, khảo khóa 0–100, biến cố, trận, thăng chức, thi, ngoại giao, lưu/tải) đều đạt. Giao diện được kiểm bằng trình duyệt tích hợp qua một máy chủ tĩnh cục bộ (ngăn chặn file:// của khung xem), chưa có thử nghiệm trực tiếp qua `file://` trong môi trường đó.

---

# Vòng 2 — mở rộng 10–20 giờ

## Đã thêm
- **Bản đồ thành 96×96** (gấp 4 diện tích): hai nhánh sông lớn, một nhánh ngang phía bắc, ao, ~40 vùng rừng, núi đá, đồi, mạch quặng rải xa nhau; **Cầu** bắc qua sông; trần dân theo cấp thành (huyện 3.000 · châu 12.000 · phủ 40.000 · kinh đô 120.000 hộ, GP §3). Nhà ở có ba bậc để thành lớn không đòi hàng nghìn lần bấm: Nhà dân 15 hộ, **Nhà phố** 50 hộ (từ Thứ sử), **Nhà lầu** 140 hộ (từ Phòng ngự sứ). **Kéo chọn hình chữ nhật** để đặt hàng loạt nhà, ruộng, dâu, trà, trại gỗ, mỏ đá, giếng; kéo thẳng cho đường, tường, mương, cầu. Bản đồ nhỏ bấm/kéo được; thu phóng xa tới 28%; ở độ xa công trình vẽ giản lược.
- **Quân từ dân** (`war.js`): mộ lính rút đinh tráng — 5 lính/hộ, hộ thành **hộ binh** (không làm việc, vẫn ăn ở); **tân binh** phải luyện 8–14 tuần ở quân doanh (sức chứa mỗi doanh 300 → 6.000 lính theo chức) mới dùng được; binh khí/giáp/ngựa lấy từ kho, thiếu thì mua bù ×1,5; bắt lính mùa cấy gặt dân oán gấp đôi và ruộng ×0,8; lính chết mất hộ vĩnh viễn, giải ngũ trả hộ về dân; mộ được **từ các thành thuộc quyền** (thành mất hộ, dân tâm tụt, có trần 45% mức ban đầu).
- **120 thành thật** (`wcities.js`): mỗi thành có cấp, hộ, quân đồn trú, thành phòng, tồn lương; đồ thị đường đi chỉ nối thành của các nước giáp nhau; tên thành theo vùng. Mỗi nước có **quân thật** (≤ tổng hộ × 1,0 × mức động viên) và đánh nhau bằng quân đó (thành đổi chủ, nước bị diệt, biên niên).
- **Sáu bậc quan lộ** (`politics.js`): Tri huyện → Thứ sử → Phòng ngự sứ → **Tiết độ sứ** (giữ ≥ 3 châu, thanh danh ≥ 60 hoặc quân ≥ 10.000, quân 20.000, giữ 70% thuế) → **Vương** (xin phong: thuận, +25 Chính danh; hoặc tự lập: nghịch, cắt đứt triều đình, bị thảo phạt, Chính danh −15; quân 60.000, đúc tiền) → **Hoàng đế** (≥ 10 thành, niên hiệu, quân 250.000, kinh đô 120.000 hộ, thánh chỉ). Mỗi bậc mở việc mới (xuất quân, cai thành, ngoại giao, đúc tiền, chiếu lệnh…).
- **Cai nhiều thành** (KT §13): phương châm, quan trấn nhậm (Chính, Trung thành), tự chủ → nộp thiếu/ly khai, tham ô, luân chuyển, giám quân, ngự sử thanh tra, điều lương về trị sở, chính lệnh mỗi tuần (từ Tiết độ sứ).
- **Chiến dịch** (`campaign.js`, GP §10.5): từ Phòng ngự sứ chọn thành địch giáp thành mình → hành quân (tuần), tiếp tế (hao 6% mỗi chặng; thiếu lương sĩ khí −15/tuần), dã chiến với quân địch ra đón (tỉ lệ theo quân bạn mang tới, tối đa theo quân dã chiến của nước đó), rồi **vây** (thành hết lương thì hàng), **phá tường bằng khí giới** (đơn vị Công thành), **tổng công thành**, hoặc **dụ hàng**; chiếm thành: 2 năm thuế thấp, dân chưa phục. Nước láng giềng cũng xâm lấn thành của bạn: đem quân cứu viện hoặc để thành tự thủ.
- **Đại chiến 100.000+ quân**: đơn vị thao tác lớn dần theo chức (đô 100 → 250 → 500 → quân 2.500 → 7.000 → 15.000) nên lưới 3×3 + dự bị chứa tới ~150.000 quân mỗi bên; công thức §10.4 giữ nguyên; chiến báo có dòng tóm tắt theo cánh mỗi hiệp, mỗi dòng tính hiện đủ hệ số (kể cả biến thiên ngẫu nhiên và mệt mỏi). Đường tự nhiên tới đại chiến: Hậu Lương dốc ~110.000+ quân khi bạn tiến tới Biện Châu với đạo quân cỡ đó, hoặc xâm lấn khi bạn đã là Vương, hoặc khi bạn tự lập.
- **Kết cục** (GP §12): thống nhất (≥ 90/120 thành + kinh đô Trung Nguyên), bá chủ một phương (đến 979 là Vương/Hoàng đế ≥ 15 thành), thua (bãi chức, bị triệu về, thất thủ, mất hết thành).
- Lưu/tải: khóa lưu mới `v2`; bản lưu vòng 1 bị từ chối với thông báo rõ (không hỏng âm thầm).
- Sửa lỗi vòng 1: đáp án Tỉnh thí được xáo vị trí; bảng Quân vụ không còn ghi "Trấn tướng"; số thập phân thống nhất dấu phẩy; tên thành hợp nước; chiến báo hiện hệ số ngẫu nhiên và mệt mỏi; khảo khóa khó hơn (hộ khẩu +40%/20đ, kho tính 0,5 kho dân, công trình công theo năm), hạng Trung cũng có thưởng nhỏ; thường bình thương chỉ mua đến mức đủ nuôi quân (lỗi rút cạn ngân khố).

## Nhịp độ ước tính (x4 ≈ 5 giây thực mỗi tuần, ~3 phút mỗi năm game; người chơi khá thêm 2–3 lần thời gian đó cho quyết định)
| Bậc | Việc chính | Ước tính |
|---|---|---|
| Tri huyện | xây, thuế, khảo khóa, 3 lần hạng Thượng + Tỉnh thí | 3–4 năm game ≈ 1–1,5 giờ |
| Thứ sử | 3 huyện thuộc quyền, thắng trận/dẹp loạn, thành phòng ≥ 50 | 4–5 năm ≈ 1,5–2 giờ |
| Phòng ngự sứ | xuất quân đánh chiếm thêm châu để đủ 3 châu | 4–6 năm ≈ 2–3 giờ |
| Tiết độ sứ | cai ≥ 6 thành, quân ≥ 15.000, ≥ 3 năm | 5–8 năm ≈ 2–3 giờ |
| Vương | ≥ 10 thành, Chính danh, ≥ 3 năm | 4–6 năm ≈ 1,5–2 giờ |
| Hoàng đế → thống nhất | 90/120 thành trong tối đa ~25 năm | 4–8 giờ |
Đây là **ước lượng thiết kế, chưa được người chơi thật đo**. Độ dài đến từ điều kiện tích lũy (thành, quân, tiền, Chính danh) và chiến dịch, cộng thời gian tối thiểu giữ chức 2–3 năm (phần "chờ" duy nhất).

## Kiểm thử vòng 2
`node tests/war2.test.js` (quân từ dân, thành, 120 thành, đại chiến 117.000 vs 124.000 quân, chiến dịch, sáu bậc, bot tự chơi tới Vương, lưu/tải), `node tests/audit.js` (tĩnh). Bot trong test được phép "bơm" tài nguyên để kiểm tra luồng, nên nó không chứng minh cân bằng kinh tế.

## Còn dở / bỏ ra ngoài (vòng 2)
Dời trị sở sang thành khác với bản đồ mới (trị sở chỉ nâng cấp thành theo bậc); bè phái, đình nghị; gián điệp; mưu kế ngoài phục binh/trá bại; thủy quân; lệnh/thánh chỉ chỉ có 8 loại chọn lọc; kết cục "Danh thần"; cân bằng dài hạn (10–20 giờ) chưa được chơi thử thật; AI các nước đánh nhau ở mức đơn giản (không hành quân từng bước); các nước máy chưa xưng đế/tự lập.

## Vòng 3 — những gì đã thêm

- **Bản đồ 120 thành thu phóng được** (cuộn chuột quanh con trỏ, kéo để di chuyển, nút ＋ − ⌂, hiện thêm tên/cấp/quân đồn trú khi phóng to, bấm chọn đúng thành ở mọi mức thu phóng). Bản đồ "12 nước" dùng chung cơ chế.
- **Đại chiến ≥100.000 quân**: quân ra đón của thành lớn/kinh đô được tính lại (`LT.muster`), AI có thêm quân (`SOLDIER_PER_HO` 1,3, huy động tăng theo năm).
- **Hậu cần**: quân ăn lương các thành dọc đường (hao 8%/chặng); bảng "Hậu cần" và cột "Lương nuôi (tuần)" ở tab Chiến dịch.
- **Hộp thoại khi chiến dịch tan** (đói / bại trận) và dừng thời gian.
- **Diễn tập sa bàn** co giãn theo quân của bạn (0,5× / 1× / 1,5×).
- **Tự xếp trận** đưa đơn vị tàn xuống dự bị; nút "Gộp đơn vị tàn".
- **Dời trị sở** (từ hạng 2): bản đồ xây tay chuyển sang thành lớn hơn, thành cũ thành bảng số liệu.
- **Bot không gian lận** (`node tests/bot.test.js 45`): chơi theo luật, hạng 6 (Hoàng đế) năm 943, 57 thành năm 962, quân ~29k — chưa thống nhất thiên hạ, chưa tới 100k quân.

Kiểm thử: `node tests/battle.test.js`, `sim.test.js`, `war2.test.js`, `round3.test.js`, `audit.js`.

## Vòng 4

- **Trận đánh phát lại theo thời gian** (`js/ui-replay.js`): thanh giằng co hai màu (ta vàng, địch đỏ), ranh giới = sức chiến đấu còn lại (quân số × sĩ khí của đơn vị chưa vỡ) của từng hiệp, ba thanh cánh Tả/Trung/Hữu, lưới 3×3 hai bên, nhật ký sự kiện; tạm dừng, x1/x2/x4, Bỏ qua, tùy chọn "Luôn bỏ qua trận nhỏ" (dưới 3.000 quân, nhớ trong localStorage). Trận đã được tính và áp dụng vào ván trước khi phát nên kết quả và số liệu không đổi; xong bấm "Xem chiến báo" để sang chiến báo chi tiết. Áp dụng cho giặc, dã chiến, công thành, diễn tập.
- **Mỏ sắt**: nguyên nhân thật là lỗi sinh bản đồ (khối tài nguyên dùng bán kính lẻ nên gần như không có rừng/đá/đồi/quặng nào được tạo ra: mỗi bản đồ 0 ô quặng, chỉ ~38 ô rừng). Đã sửa, thêm hai mạch quặng bảo đảm quanh trị sở, ô quặng vẽ đỏ gỉ lấp lánh, nút Mỏ sắt chuyển sang nhóm Thủ công, đặt công trình cần địa hình thì sáng các ô đặt được và có nút "Tới chỗ đặt gần nhất", cảnh báo khi Lò rèn thiếu quặng. Bản lưu phiên bản 5 không còn tương thích (SAVE_VER 6).

## Vòng 5

- **Bản đồ thành 110×110** (rộng thêm ~30%): mọi chỗ theo hằng `LT.N` (sinh địa hình, mạch quặng bảo đảm, bản đồ nhỏ, bản đồ sau khi dời trị sở). Bản lưu phiên bản 8; bản cũ bị từ chối kèm thông báo.
- **WASD / mũi tên** trượt bản đồ (Shift nhanh, đi chéo, tốc độ theo thu phóng; bản đồ 120 thành khi đang mở cũng trượt; không chạy khi gõ chữ). Phím tắt bảng đổi: T Triều chính, Q Quân vụ, E Thiên hạ, L Sổ sách, B Giao thương, V Quan viên.
- **Giao thương** (`js/trade.js`, `js/ui-trade.js`): mua bán trực tiếp ở chợ, thương đội (đường bộ, hải thương, thuế quá cảnh các thành đi qua, hao đường, cướp, cấm vận), đặc sản/thiếu hụt theo vùng, thương lộ nội bộ, thuế quá cảnh chỉnh được, cấp phường thị, Bến cảng.
- **Quan viên tự quản** (`js/officials.js`, `js/ui-off.js`): nhân vật thật (Thống/Võ/Trí/Chính/Đức, trung thành, dã tâm, liêm–tham ẩn, đặc tính, bổng lộc), 6 nguồn tuyển, bổ nhiệm/bãi miễn/luân chuyển, bổ nhiệm nhanh, chức ở trị sở, quan tự phát triển/mộ quân/xử biến cố, nhật ký, khảo khóa, nhiệm kỳ, hồi tỵ, ngự sử thanh tra, ly khai.
- Kiểm thử: `tests/round5.test.js`; bot không gian lận: Vương năm 943, Hoàng đế năm 946.

## Giai đoạn 1 — Tối ưu hiệu năng

- **Vẽ theo vùng (chunk 8×8 ô)** (`js/chunks.js` logic thuần, `js/render-chunk.js`): mỗi vùng có hai ảnh đệm (mặt đất + vật thể tĩnh), chỉ vẽ lại vùng nào đổi (đặt/phá/xong thi công/ngày-đêm/đổi đồ họa), chỉ ghép các vùng giao khung nhìn, vẽ sẵn vòng vùng ngay sát khung. Việc vẽ lại chia nhỏ qua nhiều khung theo ngân sách thời gian. Người, xe, công trình đang xây, phủ vẽ trực tiếp mỗi khung và chỉ trong vùng nhìn thấy.
- **Zoom mượt**: lệnh zoom chỉ đặt mức đích; mỗi khung tiến dần quanh vị trí con trỏ. Đang zoom thì co giãn ảnh đã có; ngừng zoom một nhịp mới vẽ lại sắc nét.
- **Đồ họa Thấp / Trung bình / Cao** (☰ Trình đơn, lưu trong localStorage `lt-gfx`, không nằm trong bản lưu; mặc định theo máy, tự hạ một bậc nếu máy chậm ngay từ đầu). **Bộ đếm hiệu năng**: phím F3 hoặc ☰ Trình đơn.
- Đo: `tests/bench-browser.js` (kịch bản lặp lại được), `tests/round6.test.js` (chọn vùng, chữ ký, bản lưu). Định dạng bản lưu không đổi (phiên bản 8).

## Giai đoạn 2 — Quản lý tự động

- `js/automgmt.js` (logic thuần), thẻ "Giao việc" ở tab Quan viên (`js/ui-off.js`): bốn chức — Quan xây dựng, Quan kinh tế, Quan quân sự, Tổng quản các thành. Mỗi chức: bổ nhiệm/bãi, công tắc bật/tắt tức thì, ngân sách theo quý hoặc năm, chính sách, chỉ tiêu, nhật ký (làm gì, tốn bao nhiêu, vì sao; không làm được vì sao).
- Quan xây dựng đặt qua `LT.place` của người chơi (đúng luật địa hình, nối đường, chi phí; kèm lát đường nối), không bao giờ phá công trình; có vùng cấm. Quan kinh tế chỉnh thuế trong khoảng cho phép, mua lương, bán hàng dư. Quan quân sự mộ quân tới mục tiêu theo cơ cấu binh chủng. Tổng quản điền chức khuyết, luân chuyển, thanh tra.
- Mặc định tắt hết; không bật thì không tiêu bộ ngẫu nhiên (bot vẫn Vương 943, Hoàng đế 946). Bản lưu: vẫn phiên bản 8, trường mới tự điền mặc định tắt; `LT.SAVE_MIGRATE` sẵn cho các lần đổi định dạng sau (bản < 8 vẫn bị từ chối). Test: `tests/round7.test.js`, tệp thử bản lưu v8 thật `tests/fixtures/save-v8.json`.

## Giai đoạn 3 — Ba con đường quyền lực và mục tiêu mở

- `js/power.js` (logic thuần) + `js/ui-power.js`: ba thước đo song song (Văn trị, Chính trị, Quân sự–Cát cứ) kèm lý do cộng trừ; cải cách hành chính có đánh đổi (đo lại ruộng, giảm lao dịch, chỉnh đốn lại trị) và chức triều song song (Tham tri → Thượng thư → Tể tướng); triều đình bốn phe (`LT.newCourt(nước, hạt giống)` dùng lại được cho nước khác) với kết giao, tiến cử, đàn hặc, mua chuộc, liên hôn; thao túng qua đình nghị, làm quyền thần với vua bù nhìn; phản đòn (đàn hặc, giáng chức, thảo phạt). Quân sự–Cát cứ: danh nghĩa trung thần / thần phục / cát cứ, tự chủ với triều, chiêu an, thảo phạt, lệnh điều quân, đổi chủ.
- Tab Triều chính có thêm Thế lực, Phe phái, Thành tựu; bảng "Hướng đang mở" bên trái thay cho đường thẳng lên chức kế tiếp. Thành tựu chỉ ghi sổ và báo, ván không kết thúc (thống nhất thiên hạ và xưng đế thành thành tựu "nhánh").
- Bản lưu phiên bản 9; bước chuyển 8 → 9 trong `LT.SAVE_MIGRATE`. Ván không dùng tính năng mới (`pw.engaged = false`) không có tác động nào, bot cũ vẫn Vương 943, Hoàng đế 946. Test: `tests/round8.test.js`.

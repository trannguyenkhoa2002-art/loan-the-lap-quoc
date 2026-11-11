# LOẠN THẾ LẬP QUỐC — Bản thiết kế gameplay

Game quản trị thành trì chiều sâu, bối cảnh Ngũ Đại Thập Quốc, nền tảng HTML5.
Bản này mô tả game đầy đủ sẽ phát triển từ demo hiện có (`index.html`).

Ghi chú về lịch sử: tên nước, chức quan, chế độ thuế, biên chế quân đều lấy từ thời Đường mạt – Ngũ Đại, nhưng số liệu và luật chơi là do thiết kế đặt ra cho dễ chơi, không phải mô phỏng chính xác.

---

## 1. Tóm tắt một đoạn

Năm 917, thiên hạ chia mười hai nước. Bạn là một **tri huyện** vừa nhậm chức ở một huyện thành nhỏ. Bạn tự tay quy hoạch và xây dựng **đúng một thành — thành bạn đang trị sở**: đắp đường, chia phường, lo lương, thu thuế, giữ trị an. Làm tốt thì được thăng thứ sử, tiết độ sứ; nắm nhiều thành hơn thì các thành khác giao cho thuộc quan cai quản theo chính sách bạn đặt. Thời loạn, không ai cấm bạn nuôi quân: chiến tranh được **giải bằng số liệu**, phần của bạn là **bày trận hình và soạn cách đánh trước khi giao chiến**. Đích cuối cùng: từ một viên quan huyện trở thành vua một nước, rồi thống nhất thiên hạ — hoặc giữ vững một cõi đến năm 979.

## 2. Bốn trụ cột thiết kế

| Trụ cột | Nghĩa là | Không phải là |
|---|---|---|
| **Một thành, xây tận tay** | Chỉ thành trị sở có bản đồ ô lưới để xây dựng chi tiết | Không bắt người chơi xây tay 20 thành |
| **Quan lộ từng bậc** | Mỗi chức quan mở thêm quyền, thêm thành, thêm hệ thống | Không cho làm vua ngay từ đầu |
| **Chiến tranh bằng số liệu** | Kết quả tính từ quân số, trang bị, sĩ khí, trận hình, địa hình; công thức công khai | Không điều khiển từng lính theo thời gian thực |
| **Chơi dài hạn** | Một ván 60–100 giờ, 62 năm game, có lưu nhiều lần | Không phải game chơi 10 phút là xong |

## 3. Thế giới: 12 nước, 120 thành

Mốc bắt đầu: **năm 917**. Mười hai thế lực dưới đây đều tồn tại vào năm đó.

| # | Nước | Kinh đô / trị sở | Số thành | Thế mạnh | Điểm yếu | Độ khó khi chọn |
|---|---|---|---|---|---|---|
| 1 | Hậu Lương | Biện Châu | 22 | Đông dân, nhiều thành, chính thống Trung Nguyên | Bốn mặt thụ địch, tướng hay phản | Khó |
| 2 | Tấn (Hà Đông) | Thái Nguyên | 12 | Kỵ binh Sa Đà mạnh nhất | Đất nghèo lương | Vừa |
| 3 | Kỳ | Phượng Tường | 5 | Thành hiểm, dễ thủ | Nhỏ, kiệt quệ | Rất khó |
| 4 | Tiền Thục | Thành Đô | 14 | Giàu lụa, trà, muối; núi che chở | Triều đình xa hoa, quân yếu | Dễ |
| 5 | Ngô | Dương Châu | 14 | Thương nghiệp, thủy quân | Quyền thần lấn vua | Vừa |
| 6 | Ngô Việt | Hàng Châu | 8 | Gốm, lụa, hải thương, Phật giáo | Ít đất, ít kỵ binh | Dễ |
| 7 | Mân | Phúc Châu | 5 | Hải thương, núi hiểm | Nhỏ, nội loạn | Khó |
| 8 | Sở | Đàm Châu | 9 | Trà, đúc tiền | Quân kém | Vừa |
| 9 | Nam Hán | Hưng Vương phủ | 10 | Ngọc trai, hải thương, voi chiến | Xa trung tâm, chính sự hà khắc | Vừa |
| 10 | Kinh Nam | Giang Lăng | 3 | Ngã tư thương lộ, thu thuế quá cảnh | Chỉ 3 thành, kẹp giữa các nước lớn | Rất khó |
| 11 | Khiết Đan | Thượng Kinh | 12 | Kỵ binh du mục đông đảo | Công thành kém, kinh tế nông nghiệp yếu | Vừa |
| 12 | Tĩnh Hải quân | Đại La | 6 | Lúa nước, dân đồng lòng chống xâm lấn | Ít sắt, ít ngựa | Khó |

- **Thành** có 4 cấp: Huyện thành (tối đa 3.000 hộ), Châu thành (12.000), Phủ thành (40.000), Kinh đô (120.000).
- Mỗi thành trên bản đồ lớn có: dân số, lương, tiền, quân, tường thành, dân tâm, đặc sản, địa hình xung quanh, đường nối tới thành lân cận.
- 11 nước còn lại do máy điều khiển, mỗi nước có tính cách (hiếu chiến, thủ thành, trọng thương, hay phản trắc) quyết định cách họ ngoại giao và đánh trận.
- Người chơi chọn nước lúc đầu ván; chọn nước cũng là chọn độ khó.

## 4. Thời gian và nhịp chơi

- Đơn vị thời gian: **tuần** (thượng tuần, trung tuần, hạ tuần — mỗi tuần 10 ngày). 1 tháng = 3 tuần, 1 năm = 36 tuần.
- Chạy thời gian thực có tạm dừng, tốc độ x1 / x2 / x4. Ở x1, một tuần ≈ 20 giây, một năm ≈ 12 phút.
- Ván kéo dài từ 917 đến 979 (62 năm). Ước tính 60–100 giờ chơi.

**Lịch một năm** (nhịp cố định để người chơi lên kế hoạch):

| Tháng | Việc |
|---|---|
| 1–2 | Xuân canh: cần đủ nông hộ, trâu, nông cụ; định mức thuế năm |
| 3–5 | Mùa xây dựng, mùa hành quân thuận lợi |
| 6 | **Hạ thuế** (thu bằng tiền) |
| 7–8 | Mùa lũ, dịch bệnh; nước lớn — thủy quân lợi thế |
| 9 | Thu hoạch |
| 11 | **Thu thuế** (thu bằng thóc) |
| 12 | **Khảo khóa** — triều đình chấm điểm quan lại; lao dịch mùa đông (đắp thành, sửa đê) |

**Ba vòng lặp lồng nhau:**
1. *Ngắn (mỗi tuần)*: xem cảnh báo → đặt/sửa công trình → điều người, điều kho.
2. *Vừa (mỗi năm)*: xuân định thuế và kế hoạch → hạ thu tiền → thu gặt và nộp thượng cung → đông khảo khóa, thăng giáng.
3. *Dài (mỗi chức quan, 3–15 năm)*: đạt điều kiện thăng chức → nhận thành lớn hơn hoặc thêm thành → mở hệ thống mới.

## 5. Quản trị thành trị sở (phần chơi chính)

### 5.1. Bản đồ thành
- Lưới 48×48 ô, có sông, ruộng, đồi, rừng, mỏ. Người chơi tự đặt đường, nhà, công trình như trong demo.
- **Đường** là xương sống: công trình phải nối đường tới kho hoặc chợ mới hoạt động đủ công suất. Đường đất → quan đạo → đại lộ.
- **Phường**: khu dân cư có tường và cổng; mỗi phường cần giếng, chợ nhỏ, trạm tuần. Phường kín tăng trị an, phường mở tăng buôn bán — người chơi tự chọn.

### 5.2. Dân số theo hộ và tầng lớp
Dân tính theo **hộ** (1 hộ ≈ 5 khẩu). Mỗi hộ thuộc một tầng lớp, sinh ra từ nơi ở và việc làm:

| Tầng lớp | Từ đâu ra | Đóng góp | Nhu cầu phải đáp ứng |
|---|---|---|---|
| Lưu dân | Chạy loạn kéo đến | Lao dịch, mộ lính rẻ | Lương thực |
| Nông | Có ruộng | Thóc, thuế thóc | Lương, muối, nông cụ |
| Công | Có xưởng | Hàng hóa, binh khí | Lương, muối, vải |
| Thương | Có phường thị | Thuế tiền, giá hàng tốt | Thêm trà, rượu, trị an |
| Sĩ | Có châu học | Nguồn quan viên | Thêm sách, chùa/miếu |
| Tăng | Có chùa | Dân tâm, cứu tế | Ruộng chùa (miễn thuế!) |
| Binh | Có quân doanh | Sức chiến đấu | Lương, lương tiền, thưởng |
| Quan | Được bổ nhiệm | Hiệu suất cai trị | Bổng lộc |
| Hào tộc | Thành đủ phồn vinh | Tiền lớn, tư binh | Xa xỉ phẩm; hay lấn ruộng dân |

Thiếu nhu cầu → hộ tụt tầng hoặc bỏ đi. Đủ nhu cầu lâu dài → hộ lên tầng, thuế cao hơn.

### 5.3. Tài nguyên và chuỗi sản xuất
Phần kinh tế được thiết kế chi tiết trong [THIET-KE-KINH-TE.md](THIET-KE-KINH-TE.md); mục 5.3–5.4 dưới đây chỉ là tóm tắt.

Tài nguyên: **tiền** (quan), **lương** (thạch), gỗ, đá, sắt, muối, vải lụa, trà, gốm, rượu, ngựa, binh khí.

```
Lúa ─────────────► Lương ──► Rượu
Dâu ─► Tằm ─► Lụa ─► (bán / may quân phục)
Quặng ─► Lò rèn ─► Nông cụ (ruộng +20%)  hoặc  Binh khí (trang bị quân)
Đất sét ─► Lò gốm ─► Gốm (bán xa)
Nước biển/giếng mặn ─► Ruộng muối ─► Muối (chuyên bán — nguồn tiền lớn)
Đồi ─► Vườn trà ─► Trà (bán, đổi ngựa phương bắc)
Gỗ ─► Xưởng thuyền ─► Thuyền (thủy quân, vận lương)
Cỏ ─► Mã phường ─► Ngựa (kỵ binh)
```

Số liệu gốc mỗi tuần (trước các hệ số):

| Hạng mục | Con số |
|---|---|
| 1 hộ ăn | 0,15 thạch |
| 1 khu ruộng (20 nông hộ) | 360 thạch/năm, gặt 1 lần tháng 9 (vùng nam: 2 vụ) |
| 1 lính ăn | 0,06 thạch + 0,05 quan lương |
| 1 ngựa ăn | 0,10 thạch |
| Kho lương tối thiểu nên giữ | đủ 18 tuần cho cả thành |

### 5.4. Thuế và ngân sách
- **Lưỡng thuế**: hạ thuế thu tiền (tháng 6), thu thuế thu thóc (tháng 11). Người chơi chọn 1 trong 5 mức; mức cao được nhiều nhưng trừ dân tâm và làm hộ bỏ trốn.
- **Chuyên bán** muối, trà, rượu: bật lên thì thêm tiền, nhưng sinh buôn lậu nếu trị an thấp.
- **Lao dịch**: mỗi hộ nợ 20 ngày công/năm, dùng để đắp thành, sửa đê, làm đường. Gọi quá mức → trừ dân tâm, giảm sản lượng.
- **Chia thuế ba phần** (rất quan trọng với quan lộ): *thượng cung* nộp triều đình — *lưu sứ* nộp tiết độ sứ — *lưu châu* giữ lại. Tri huyện giữ được ít; càng lên cao càng giữ được nhiều. Nộp thiếu thì giàu nhanh nhưng mất điểm khảo khóa và bị nghi kỵ.

### 5.5. Năm chỉ số của thành

| Chỉ số | Tăng nhờ | Tụt thì |
|---|---|---|
| **Dân tâm** | Thuế nhẹ, no đủ, chùa, xử án công bằng | Dân bỏ trốn, nổi loạn |
| **Trị an** | Trạm tuần, phường kín, lính đồn trú | Trộm cướp, buôn lậu, cháy lớn |
| **Vệ sinh** | Giếng, cống, y quán | Dịch bệnh mùa hè |
| **Phồn vinh** | Chợ, đường tốt, hàng hóa đa dạng | Thương nhân bỏ đi |
| **Thành phòng** | Tường, hào, vọng lâu, kho tên | Dễ bị hạ khi bị vây |

### 5.6. Biến cố
Lũ, hạn, châu chấu, dịch, hỏa hoạn, lưu dân tràn về, hào tộc lấn ruộng, án oan, lính đòi thưởng, sứ giả triều đình xuống thanh tra. Mỗi biến cố cho 2–3 cách xử lý, mỗi cách đổi chỉ số này lấy chỉ số kia (ví dụ: mở kho cứu đói → +dân tâm, −lương, +thanh danh).

## 6. Quan lộ: từ tri huyện đến vua

Thi cử, hai ngạch văn – võ, bè phái, quản trị nhiều thành, ngoại giao, xưng vương, làm phản và chiếu lệnh được thiết kế chi tiết trong [THIET-KE-CHINH-TRI.md](THIET-KE-CHINH-TRI.md); các mục 6, 8 và 11 của bản này chỉ là tóm tắt.

| Bậc | Chức | Quyền hạn | Quân tối đa | Điều kiện thăng lên bậc này | Thời gian ước tính |
|---|---|---|---|---|---|
| 1 | **Tri huyện** (huyện lệnh) | 1 huyện thành; xây dựng, thu thuế, xử án | 300 hương binh | Bắt đầu | 3–5 năm |
| 2 | **Thứ sử** | 1 châu thành + 2–4 huyện thuộc; bổ nhiệm tri huyện | 2.500 | 3 lần khảo khóa hạng thượng, hoặc quân công, hoặc tiến cử | 5–8 năm |
| 3 | **Phòng ngự sứ** | Thêm binh quyền cả châu, được xuất quân đánh giặc | 6.000 | Dẹp 1 cuộc loạn hoặc thắng 2 trận; thành phòng đủ cấp | 4–6 năm |
| 4 | **Tiết độ sứ** | 1 trấn gồm 3–6 châu; tự bổ quan, giữ phần lớn thuế, nuôi nha quân | 20.000 | Giữ 3 châu trở lên; thanh danh hoặc binh lực đủ để triều đình phải phong | 8–12 năm |
| 5 | **Vương** (cát cứ) | Tự trị, ngoại giao riêng, đúc tiền | 60.000 | Triều đình phong vương, hoặc tự lập khi triều đình suy | 8–15 năm |
| 6 | **Quốc vương / Hoàng đế** | Lập triều đình, đặt niên hiệu, phong quan cả nước | Không giới hạn | Chiếm kinh đô nước mình, hoặc lập nước mới với ≥ 10 thành | Đến hết ván |

**Khảo khóa** (tháng 12 hằng năm) chấm 5 mục, mỗi mục 0–20 điểm: hộ khẩu tăng, thuế nộp đủ, kho lương, trị an, công trình công (đê, đường, thành). ≥ 80 là hạng thượng, < 40 bị giáng hoặc điều đi huyện nghèo.

**Ba con đường thăng tiến** (có thể đổi giữa chừng):
- *Trung thần*: khảo khóa tốt, nộp đủ, đánh giặc theo lệnh → được phong dần, chậm nhưng an toàn.
- *Quyền thần*: kết thân, hối lộ, gả con, nhận làm nghĩa tử của bề trên → lên nhanh, dễ bị thanh trừng khi chủ đổi.
- *Phiên trấn*: giữ thuế, nuôi quân riêng, chờ thời cơ binh biến hoặc ly khai → nhanh nhất, rủi ro nhất.

**Hai thước đo cá nhân**: *Thanh danh* (dân và sĩ nhân nhìn bạn thế nào) và *Uy vọng* (tướng sĩ có theo bạn không). Thanh danh cao dễ chiêu hiền; uy vọng cao thì binh biến mới thành.

## 7. Nhân sự: quan viên và tướng lĩnh

Mỗi nhân vật có 5 thuộc tính (1–100): **Thống** (cầm quân), **Võ** (xông trận), **Trí** (mưu kế), **Chính** (cai trị), **Đức** (lòng dân, lòng lính); cùng **Trung thành**, **Dã tâm**, bổng lộc và 1–2 đặc tính (thanh liêm, tham lam, giỏi thủy chiến, hay nghi kỵ…).

- Văn quan theo bậc: thuộc lại huyện → chưởng thư ký, phán quan, đô ngu hầu → hành quân tư mã, diêm thiết sứ, lục sự tham quân → tể tướng, xu mật sứ, tam ty sứ, hàn lâm học sĩ (như trong demo).
- Nguồn người: châu học đào tạo, chiêu hiền, tiến cử, hàng tướng, và sĩ nhân phương bắc chạy loạn xuống nam.
- Trung thành tụt khi: nợ lương, thưởng phạt bất công, thua trận liên tiếp, kẻ địch ly gián. Tướng dã tâm cao + trung thành thấp + cầm nhiều quân = nguy cơ binh biến chống lại chính bạn.

## 8. Khi có nhiều thành

- Chỉ **thành trị sở** là xây tay. Các thành khác hiển thị dưới dạng **bảng số liệu**: dân, lương, tiền, quân, năm chỉ số, và xu hướng lên/xuống.
- Mỗi thành thuộc quyền cần một **quan trấn nhậm**; năng lực Chính và Đức của người đó quyết định hiệu suất.
- Người chơi đặt cho mỗi thành một **phương châm**: *Khuyến nông* / *Hưng thương* / *Luyện binh* / *Cố thủ* / *Tận thu*, cộng mức thuế và tỉ lệ nộp về trị sở. Quan sẽ tự xây theo phương châm.
- **Dời trị sở**: khi được thăng (hoặc tự chọn), bạn chuyển sang thành lớn hơn và bắt đầu xây tay ở đó; thành cũ chuyển thành bảng số liệu và giữ nguyên những gì đã xây.
- Chống phình to quá dễ: càng nhiều thành, **hao hụt hành chính** càng lớn (mỗi thành xa trị sở mất thêm 3% thuế cho mỗi chặng đường), quan xa dễ tham ô và ly khai.

## 9. Quân đội

### 9.1. Biên chế
`5 lính = 1 ngũ` → `100 lính = 1 đô` → `500 lính = 1 chỉ huy` → `2.500 lính = 1 quân` → `nhiều quân = 1 đạo`.
Đơn vị người chơi thao tác là **chỉ huy (500 lính)**; lên tiết độ sứ trở đi thao tác theo **quân (2.500)**.

### 9.2. Binh chủng

| Binh chủng | Công | Thủ | Đặc điểm | Khắc | Bị khắc bởi | Cần |
|---|---|---|---|---|---|---|
| Trường thương | 9 | 10 | Rẻ, giữ trận tốt | Kỵ binh ×1,5 | Cung, nỏ | Sắt ít |
| Đao thuẫn | 10 | 12 | Giảm 30% sát thương tên | Cung thủ ×1,3 | Trọng kỵ | Sắt vừa |
| Cung thủ | 8 (bắn) | 4 | Bắn 2 hiệp đầu và bắn qua đầu tuyến trước | Trường thương ×1,3 | Kỵ, đao thuẫn | Gỗ |
| Nỏ thủ | 11 (bắn) | 5 | Xuyên giáp, bắn cách hiệp | Trọng kỵ ×1,4 | Khinh kỵ | Xưởng binh khí |
| Khinh kỵ | 11 | 7 | Đánh sườn, truy kích ×2 | Cung, nỏ ×1,5 | Trường thương | Ngựa |
| Trọng kỵ | 15 | 12 | Xung phong ×1,8 ở hiệp giáp chiến đầu | Đao thuẫn ×1,3 | Trường thương, nỏ | Ngựa + sắt nhiều |
| Nha binh | 14 | 14 | Sĩ khí khó vỡ; hay đòi thưởng | — | — | Tiền nhiều |
| Thủy quân | 10 | 9 | Chỉ đánh trên sông hồ; chở quân, cắt đường lương | — | Hỏa công | Xưởng thuyền |
| Công thành | — | 3 | Vân thê, xung xa, xe bắn đá: phá thành phòng | Tường thành | Mọi thứ khi bị áp sát | Gỗ, thợ |

### 9.3. Bốn chỉ số của mỗi đơn vị
- **Quân số**; **Huấn luyện** (0–100, tăng nhờ quân doanh và thời gian); **Trang bị** (cấp 1–5, mỗi cấp +8% Công và Thủ); **Sĩ khí** (0–100).
- **Mệt mỏi** tăng khi hành quân gấp; **Lương thảo** mang theo tính bằng tuần. Hết lương: sĩ khí −15 mỗi tuần và lính đào ngũ.

### 9.4. Hành quân và tiếp tế
- Bộ binh đi 1 chặng đường/tuần, kỵ binh 2, có quan đạo +50%, mùa mưa −50%.
- Lương đi theo đường tiếp tế nối về thành của mình. Bị cắt đường → chỉ còn lương mang theo.
- Trinh sát (khinh kỵ + tướng Trí cao) cho biết trước quân số, binh chủng và **trận hình** của địch.

## 10. Chiến trận: số liệu quyết định, người chơi bày trận

Người chơi **không** điều khiển lính trong trận. Trước trận, bạn làm ba việc: **xếp đội hình**, **chọn trận hình**, **soạn cách đánh**. Sau đó game tính từng hiệp và đưa **chiến báo** ghi rõ con số của mỗi hiệp để bạn hiểu vì sao thắng thua.

### 10.1. Bàn xếp đội hình
Lưới 3 tuyến × 3 cánh, cộng 2 ô đặc biệt:

```
                 TẢ DỰC      TRUNG QUÂN     HỮU DỰC
  Tiền quân     [      ]     [      ]      [      ]     ← chạm địch trước
  Trung quân    [      ]     [ CHỦ TƯỚNG ] [      ]
  Hậu quân      [      ]     [      ]      [      ]     ← cung nỏ, công thành

  [ DỰ BỊ ]  vào trận theo quân lệnh       [ PHỤC BINH ]  chỉ dùng được ở rừng, đồi, lau sậy
```

- Mỗi ô đặt 1 đơn vị và 1 tướng (không bắt buộc). Ô trống là điểm yếu: địch đối diện sẽ tràn sang đánh sườn.
- Cung nỏ ở tuyến sau vẫn bắn được; kỵ binh ở hai cánh mới đánh sườn được.
- Chủ tướng ở trung quân: Thống của ông ta áp cho toàn quân; trung quân vỡ thì toàn quân −30 sĩ khí.

### 10.2. Tám trận hình

| Trận hình | Hiệu ứng | Dùng khi | Sợ nhất |
|---|---|---|---|
| **Phương trận** (vuông) | Thủ +10% toàn quân | Chưa rõ địch, quân đều tay | Không có điểm yếu lớn, cũng không có điểm mạnh |
| **Viên trận** (tròn) | Thủ +25%, Công −15%, miễn đánh sườn | Ít quân, chờ viện binh | Bị vây lâu, hết tên, hết lương |
| **Phong thỉ** (mũi tên) | Trung quân Công +25%, hai cánh Thủ −15% | Đột phá, bắt chủ tướng địch | Yển nguyệt, phục binh hai bên |
| **Nhạn hành** (cánh nhạn) | Bắn +20%, hai cánh Công +10%, trung Thủ −10% | Nhiều cung nỏ | Phong thỉ, trọng kỵ xung phong |
| **Hạc dực** (cánh hạc) | Nếu quân số ≥ 1,3 lần địch: đánh sườn sớm từ hiệp 3; trung Thủ −15% | Đông quân hơn hẳn | Phong thỉ chọc thủng giữa |
| **Ngư lân** (vảy cá) | Hao sĩ khí −20%, tuyến sau lên thay nhanh | Đánh lâu, quân tinh nhuệ | Hạc dực bọc sườn |
| **Yển nguyệt** (trăng khuyết) | Chọn 1 cánh: Công +30%; cánh kia −20% | Tướng giỏi, đánh lệch một bên | Địch dồn sức vào cánh yếu |
| **Trường xà** (rắn dài) | Giáp chiến −10%; bị phục kích chỉ chịu nửa thiệt hại; hợp ải hẹp | Hành quân qua núi, đường hẹp | Giao chiến trên đồng bằng |

Trận hình tốt nhất phụ thuộc vào trận hình địch và địa hình — vì vậy trinh sát có giá trị thật.

### 10.3. Soạn cách đánh
Trận chia 3 giai đoạn; mỗi giai đoạn chọn 1 lệnh:

| Giai đoạn | Lựa chọn |
|---|---|
| **1. Tiếp cận** (hiệp 1–2) | *Bắn phủ đầu* (cung nỏ bắn đủ 2 hiệp) · *Tiến gấp* (bỏ qua 1 hiệp bắn của cả hai bên, mệt +10) · *Giữ trận dụ địch* (Thủ +15%, nhường quyền chủ động) |
| **2. Giáp chiến** (hiệp 3–8) | *Tổng công* (Công +15%, Thủ −10%) · *Cầm cự* (Thủ +15%, Công −10%, hao sĩ khí chậm) · *Trá bại* (lùi 1 hiệp; nếu Trí tướng ta > Trí tướng địch thì địch vỡ đội hình, nếu không thì ta mất sĩ khí) |
| **3. Quyết định** (hiệp 9–12) | *Kỵ binh bọc hậu* · *Dự bị dồn vào trung quân* · *Thu quân có trật tự* (giảm thiệt hại khi thua) |

**Quân lệnh điều kiện** — các câu "nếu… thì…" soạn sẵn. Số quân lệnh được soạn = 2 + Thống của chủ tướng ÷ 25. Ví dụ:
- *Nếu* cánh trái địch vỡ → khinh kỵ truy kích.
- *Nếu* sĩ khí trung quân < 40 → dự bị vào thay.
- *Nếu* thương vong > 30% → thu quân.
- *Nếu* địch dùng trọng kỵ xung phong → tuyến đầu đổi sang trường thương.

**Mưu kế** (cần Trí và điều kiện): phục binh (rừng, đồi), hỏa công (mùa khô, có gió), dạ tập (đêm, sĩ khí ta cao), trá hàng, cắt đường lương, ly gián tướng địch.

### 10.4. Công thức (công khai cho người chơi)

Mỗi hiệp, mỗi đơn vị đánh đơn vị đối diện:

```
Lực = Quân số × Công × Khắc chế × Trận hình × Địa hình × Lệnh giai đoạn
                × (0,5 + Huấn luyện ÷ 200)
                × (0,5 + Sĩ khí ÷ 200)
                × (1 + Thống của tướng ÷ 200)
                × (1 + 0,08 × (Cấp trang bị − 1))

Thương vong gây ra = Lực ÷ (Thủ của địch × 20)
```

**Sĩ khí** mỗi hiệp giảm = (tỉ lệ thương vong hiệp đó × 150) + phạt (bị đánh sườn −8, tướng tử trận −20, đơn vị bên cạnh vỡ −10). Đơn vị **vỡ** khi sĩ khí < 20. **Toàn quân tan** khi trung quân vỡ hoặc quá nửa số đơn vị vỡ; khi đó kỵ binh địch truy kích gây thêm 10–25% thương vong.

**Địa hình**: đồng bằng (kỵ ×1,1) · đồi (bên giữ cao Thủ ×1,2) · rừng (kỵ ×0,7, cho phục binh) · đầm lầy (trọng kỵ ×0,5) · vượt sông (bên vượt Công ×0,7 trong 3 hiệp đầu) · ải (chỉ 1 cánh giao chiến).

**Ví dụ tính một hiệp.** 600 trường thương của ta (Công 9, huấn luyện 60, sĩ khí 70, tướng Thống 70) đối diện 600 trọng kỵ địch (Thủ 12):
- Khắc chế 1,5 × huấn luyện 0,80 × sĩ khí 0,85 × tướng 1,35 = hệ số 1,377
- Lực = 600 × 9 × 1,377 ≈ 7.436 → thương vong địch = 7.436 ÷ (12 × 20) ≈ **31 kỵ binh**
- Chiều ngược lại, trọng kỵ xung phong hiệp đầu (Công 15, ×1,8 xung phong, ×0,67 vì bị khắc, huấn luyện 80, sĩ khí 80, tướng Thống 50) gây ≈ **55 thương binh** vào Thủ 10 của ta; từ hiệp sau mất hệ số xung phong chỉ còn ≈ 31.
- Kết luận người chơi rút ra: trường thương chịu được cú xung phong đầu thì sẽ thắng trọng kỵ đắt gấp nhiều lần — miễn là sĩ khí không vỡ trước.

### 10.5. Công thành và thủ thành
Mỗi thành có **Thành phòng** (điểm tường, hào, vọng lâu), quân thủ và kho lương. Bên công chọn mỗi tuần:

| Cách | Yêu cầu | Kết quả |
|---|---|---|
| **Vây** | Quân ≥ 2 lần quân thủ | Thành không nhận được lương; hết lương thì hàng. Bên vây cũng tốn lương và dễ dịch bệnh |
| **Công thành** | Có vân thê, xung xa, xe bắn đá | Tính như chiến trận, nhưng quân thủ nhân Thủ với (1 + cấp tường × 0,5); khí giới hạ dần Thành phòng |
| **Đào hầm / dẫn nước** | Tướng Trí cao, đất hợp | Mất 3–6 tuần, phá mạnh Thành phòng |
| **Dụ hàng / nội ứng** | Dân tâm hoặc trung thành trong thành thấp | Lấy thành không đổ máu |

Thủ thành dùng đúng thành mà người chơi đã xây tay: tường, cổng, vọng lâu, phong hỏa đài, kho lương đặt ở đâu đều tính vào Thành phòng.

### 10.6. Sau trận
Chiến báo liệt kê từng hiệp, đơn vị nào gây bao nhiêu thương vong, sĩ khí vỡ lúc nào, quân lệnh nào đã kích hoạt. Kết quả kéo theo: tù binh và hàng binh, chiến lợi phẩm, tướng lên kinh nghiệm hoặc tử trận, uy vọng của bạn tăng giảm, và lính đòi thưởng nếu thắng lớn.

## 11. Ngoại giao và mười một nước do máy điều khiển

- Quan hệ từ −100 đến +100 với từng nước. Hành động: triều cống, xin phong, hòa thân, liên minh, mượn đường, thông thương, tuyệt giao, tuyên chiến.
- Gián điệp: dò quân tình, ly gián, mua chuộc tướng giữ thành, phao tin.
- Các nước máy cũng thu thuế, mộ quân, đánh nhau và bị binh biến theo cùng bộ luật số liệu (giản lược), nên bản đồ thay đổi dù người chơi không đụng tới.
- Biến cố lớn có tính lịch sử nhưng không cố định ngày: Khiết Đan nam hạ, triều đình Trung Nguyên đổi chủ, phương nam xưng đế, một nước nhỏ bị thôn tính. Hành động của người chơi có thể làm chúng đến sớm, muộn hoặc không xảy ra.

## 12. Thắng, thua và mục tiêu dài hạn

| Kết cục | Điều kiện |
|---|---|
| **Thống nhất thiên hạ** | Giữ 90 trên 120 thành, gồm cả kinh đô Trung Nguyên |
| **Bá chủ một phương** | Đến năm 979 vẫn là vua một nước ≥ 15 thành |
| **Danh thần** | Không xưng vương nhưng làm tể tướng, giúp chủ thống nhất |
| **Thua** | Bị bãi chức mà không còn thành, bị binh biến giết, hoặc mất thành cuối cùng |

Chấm điểm cuối ván theo: số thành, dân số, số năm thái bình, thanh danh.

## 13. Các màn hình chính

1. **Thành trị sở** — bản đồ ô lưới xây dựng (đã có trong demo).
2. **Triều chính** — tầng lớp xã hội, quan viên, thuế, khảo khóa.
3. **Bản đồ thiên hạ** — 12 nước, 120 thành, đường đi, đạo quân.
4. **Bảng các thành thuộc quyền** — số liệu, phương châm, quan trấn nhậm.
5. **Quân vụ** — biên chế, huấn luyện, trang bị, tướng.
6. **Bày trận** — lưới 3×3, trận hình, cách đánh, quân lệnh; xem trước tỉ lệ thắng ước tính.
7. **Chiến báo** — diễn biến từng hiệp bằng con số.
8. **Ngoại giao** — quan hệ, sứ giả, gián điệp.

## 14. Lộ trình làm tiếp từ demo hiện tại

| Mốc | Nội dung | Chơi được gì sau mốc này |
|---|---|---|
| M1 | Thành trị sở chiều sâu: hộ dân, nhu cầu theo tầng lớp, chuỗi sản xuất, lưỡng thuế, lịch năm, lưu game | Một ván tri huyện 5 năm hoàn chỉnh |
| M2 | Quan lộ: khảo khóa, thanh danh, thượng cấp, thăng thứ sử, dời trị sở | Lên tới thứ sử |
| M3 | Bản đồ thiên hạ 12 nước, các thành dạng số liệu, quan trấn nhậm, phương châm | Cai quản nhiều thành |
| M4 | Quân đội và chiến trận số liệu: binh chủng, bày trận, cách đánh, chiến báo, công thành | Đánh trận và chiếm thành |
| M5 | Ngoại giao, gián điệp, AI các nước, biến cố lớn, binh biến | Lên tiết độ sứ, xưng vương |
| M6 | Cân bằng dài hạn, kết cục, chấm điểm, tối ưu cho điện thoại | Ván đầy đủ 917–979 |

## 15. Những điểm cần bạn quyết định

1. **Thời gian**: chạy thời gian thực có tạm dừng (như demo) hay theo lượt — bấm "qua tuần"? Bản này đang giả định thời gian thực có tạm dừng.
2. **Nước của người chơi**: tự chọn 1 trong 12 nước như bản này, hay cố định một nước (ví dụ Tĩnh Hải quân) để kể chuyện sâu hơn?
3. **Mức lịch sử**: nhân vật thật (Lý Tồn Úc, Tiền Lưu, Khúc Thừa Mỹ…) xuất hiện làm vua và tướng của các nước, hay toàn bộ nhân vật do game tạo ngẫu nhiên?
4. **Thứ tự làm**: theo lộ trình M1 → M6, hay làm sớm phần chiến trận (M4) để thử cảm giác bày trận trước?

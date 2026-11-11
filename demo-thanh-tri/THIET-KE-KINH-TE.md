# LOẠN THẾ LẬP QUỐC — Bản thiết kế kinh tế

Tài liệu này đi kèm [THIET-KE-GAMEPLAY.md](THIET-KE-GAMEPLAY.md) và mở rộng mục 5.3–5.4 của bản đó. Các con số gốc (1 hộ ăn 0,15 thạch/tuần; 1 khu ruộng 20 nông hộ cho 360 thạch/năm; 1 lính ăn 0,06 thạch và lĩnh 0,05 quan mỗi tuần; 1 năm = 36 tuần) được giữ nguyên.

Ghi chú: thuật ngữ (lưỡng thuế, thường bình thương, chuyên bán muối trà, tiền hoang, kiêm tính ruộng đất…) lấy từ thời Đường mạt – Ngũ Đại; con số là giá trị thiết kế, chưa qua chơi thử, sẽ phải cân chỉnh.

---

## 1. Ý tưởng cốt lõi

Kinh tế trong game là **dòng chảy có nguồn và có nơi tiêu**, không phải những con số tự cộng mỗi lượt.

1. **Mọi thứ do hộ dân làm ra và do hộ dân tiêu.** Không có hộ làm thì công trình đứng không; không có người mua thì hàng nằm kho.
2. **Quan phủ không sở hữu nền kinh tế — chỉ thu một phần.** Người chơi làm giàu bằng cách làm dân giàu rồi thu thuế, hoặc vắt kiệt dân và trả giá.
3. **Khoảng cách tốn tiền.** Chở lương đi xa thì hao; vì vậy đường, kho, kênh và vị trí thành đều có giá trị.
4. **Tiền luôn thiếu.** Thời này thiếu tiền đồng thật; game dùng điều đó để buộc người chơi lựa chọn chứ không tích tiền vô hạn.
5. **Quân đội là khoản chi lớn nhất.** Một thành nhỏ không nuôi nổi đạo quân lớn — đây là lý do phải leo quan lộ và mở rộng.

## 2. Hàng hóa và giá gốc

| Hàng | Đơn vị | Giá gốc (quan) | Làm ra ở | Ai tiêu |
|---|---|---|---|---|
| Lương | thạch | 0,4 | Ruộng lúa | Mọi hộ, lính, ngựa, lò rượu |
| Muối | thạch | 2,0 | Ruộng muối, giếng mặn | Mọi hộ |
| Gỗ | xe | 0,3 | Trại gỗ | Xây dựng, lò rèn, lò gốm, xưởng thuyền |
| Đá | xe | 0,3 | Mỏ đá | Xây dựng, tường thành |
| Quặng sắt | xe | 1,0 | Mỏ sắt | Lò rèn |
| Nông cụ | bộ | 1,5 | Lò rèn | Ruộng lúa |
| Vải thô | thất | 0,8 | Xưởng vải | Nông, công, lính |
| Lụa | thất | 4,0 | Dâu tằm → xưởng dệt | Thương, sĩ, quan, hào tộc; xuất khẩu; thưởng quân |
| Trà | gánh | 3,0 | Vườn trà | Thương, sĩ, tăng; đổi ngựa phương bắc |
| Gốm | kiện | 2,0 | Lò gốm | Thương trở lên; xuất khẩu |
| Rượu | vò | 1,5 | Lò rượu | Công, thương, lính (thưởng) |
| Binh khí | bộ | 5,0 | Lò rèn / xưởng binh khí | Quân đội |
| Giáp | bộ | 12,0 | Xưởng binh khí | Trọng kỵ, nha binh |
| Ngựa | con | 30,0 | Mã phường; mua phương bắc | Kỵ binh, dịch trạm |

Giá gốc chỉ là mốc. Giá thật ở mỗi thành lên xuống theo cung cầu (mục 6).

## 3. Kinh tế của một hộ

Mỗi hộ có thu nhập, chi tiêu và **tích lũy**. Tích lũy dương đủ lâu → hộ lên tầng lớp; âm kéo dài → hộ bán ruộng, thành tá điền hoặc lưu dân.

**Nhu cầu mỗi hộ mỗi năm:**

| Tầng lớp | Lương | Muối | Vải thô | Rượu | Trà | Gốm | Lụa |
|---|---|---|---|---|---|---|---|
| Lưu dân | 5,4 thạch | — | — | — | — | — | — |
| Nông | 5,4 | 0,2 thạch | 1 thất | — | — | — | — |
| Công | 5,4 | 0,2 | 1 | 1 vò | — | — | — |
| Thương, Sĩ, Tăng | 5,4 | 0,2 | 1 | 1 | 0,5 gánh | 0,5 kiện | — |
| Quan, Hào tộc | 8 | 0,3 | — | 3 | 1 | 1 | 2 thất |

**Ví dụ một nông hộ trong năm bình thường:**

| Khoản | Lương (thạch) |
|---|---|
| Thu hoạch (360 thạch ÷ 20 hộ) | +18,0 |
| Ăn | −5,4 |
| Thu thuế 10% | −1,8 |
| Giống cho vụ sau | −1,5 |
| **Dư để bán** | **+9,3** (≈ 3,7 quan) |
| Mua muối, vải, nông cụ và nộp hạ thuế | −1,3 quan |
| **Tích lũy** | **≈ +2,4 quan/năm** |

Gặp năm mất mùa (sản lượng ×0,5) thì hộ này âm; hai năm liền là phải bán ruộng. Đây là chỗ cứu tế, miễn thuế và kho thường bình phát huy tác dụng.

## 4. Sản xuất

Số liệu mỗi **tuần**, khi đủ nhân công và nối đường tới kho.

| Công trình | Hộ làm | Đầu vào | Đầu ra | Ghi chú |
|---|---|---|---|---|
| Khu ruộng lúa | 20 nông | (giống) | 360 thạch/năm, gặt tháng 9 | Vùng nam 2 vụ: tháng 6 và 10, mỗi vụ 220 |
| Trại gỗ | 10 nông | — | 6 gỗ | Rừng cạn dần, phải trồng lại |
| Mỏ đá | 10 nông | — | 4 đá | |
| Mỏ sắt | 15 nông | — | 4 quặng | Chỉ có ở một số thành |
| Ruộng muối | 12 nông | — | 3 muối | Mùa khô ×1,5; mùa mưa ×0,5 |
| Trại dâu tằm | 10 nông | — | 3 kén | |
| Vườn trà | 12 nông | — | 2 trà | Phải có đồi; hái rộ tháng 3–4 |
| Xưởng vải | 10 công | — | 4 vải thô | |
| Xưởng dệt lụa | 15 công | 3 kén | 2 lụa | |
| Lò rèn | 10 công | 2 quặng + 2 gỗ | 3 nông cụ **hoặc** 1 binh khí | Người chơi chọn sản phẩm |
| Xưởng binh khí | 15 công | 3 quặng + 2 gỗ | 2 binh khí **hoặc** 1 giáp | Từ Thành trì |
| Lò gốm | 12 công | 1 gỗ | 2 gốm | |
| Lò rượu | 6 công | 4 lương | 3 rượu | Cấm nấu rượu khi đói kém |
| Mã phường | 8 nông | 6 lương | 0,2 ngựa | ≈ 7 con/năm |
| Xưởng thuyền | 20 công | 8 gỗ | 1 thuyền / 6 tuần | Cần bờ sông |

**Hệ số sản lượng** (nhân với nhau):

| Yếu tố | Hệ số |
|---|---|
| Sát đường đất / quan đạo | ×1,2 / ×1,35 |
| Ruộng có thủy lợi (mương, đập) | ×1,3 |
| Ruộng có nông cụ sắt (tốn 1 bộ/khu/năm) | ×1,2 |
| Ruộng có trâu | ×1,15 |
| Độ phì của đất | ×0,7 – ×1,3 |
| Thiếu nhân công | theo tỉ lệ số hộ đang làm |
| Gọi lao dịch quá mức trong mùa cấy gặt | ×0,8 |
| Hạn, lũ, châu chấu | ×0,3 – ×0,7 |
| Quan phụ trách (Chính ÷ 400) | tới ×1,25 |

**So lời lãi vài ngành** (tính theo giá gốc, mỗi hộ mỗi năm):

| Ngành | Giá trị làm ra / hộ / năm | Nhận xét |
|---|---|---|
| Ruộng lúa | 7,2 quan | Thấp nhưng là nền tảng; không có thì chết đói |
| Xưởng vải | 11,5 quan | Thị trường nội địa ổn định |
| Muối | 18 quan | Rất lời — vì thế quan phủ giữ độc quyền |
| Lụa (tính cả hộ dâu tằm) | ≈ 11,5 quan | Giá trị nằm ở xuất khẩu và thưởng quân |
| Trà | 18 quan | Cần đồi; bán ra bắc rất được giá |
| Gốm | 12 quan | Hợp thành ven sông, ven biển |

Bài học thiết kế: lúa nuôi người, nhưng tiền nằm ở muối, trà, lụa, gốm — và những thứ đó chỉ ra tiền khi có đường, có chợ, có thương lộ.

## 5. Kho và vận chuyển

- **Kho lương, kho hàng** có sức chứa và bán kính phục vụ (8 ô theo đường). Công trình ngoài bán kính chỉ đạt 60% công suất.
- **Hao hụt trong kho**: lương mất 2% mỗi quý (mốc, chuột); kho gạch giảm còn 1%.
- **Hao hụt trên đường** (khi chở giữa các thành hoặc tiếp tế cho quân):

| Phương tiện | Hao mỗi chặng | Ghi chú |
|---|---|---|
| Gánh bộ đường đất | 8% | Mùa mưa 15% |
| Xe trên quan đạo | 5% | |
| Thuyền trên sông, kênh | 2% | Chỉ nơi có đường thủy |

Chở lương qua 5 chặng đường bộ mất gần một phần tư. Vì vậy nên trữ lương gần mặt trận, và thành ven sông có lợi thế thật.

- **Dịch trạm** đặt trên quan đạo: tin tức đến nhanh hơn và giảm 1 điểm phần trăm hao hụt cho hàng đi qua.

## 6. Chợ và giá cả

Mỗi thành có một **chợ** ghi tồn kho và giá của từng mặt hàng.

```
Giá tại thành = Giá gốc × √(Cầu trong 12 tuần ÷ Cung trong 12 tuần)
               (kẹp trong khoảng 0,4 đến 2,5 lần giá gốc)
```

- Thóc sau vụ gặt thường còn ≈ 0,7 lần giá gốc; lúc giáp hạt (tháng 4–8) lên ≈ 1,4 lần.
- **Thường bình thương** (kho bình ổn): quan mua thóc lúc rẻ, bán ra lúc đắt. Vừa có lời, vừa ghìm giá, vừa tăng dân tâm. Đây là công cụ kinh tế quan trọng nhất của một tri huyện.
- **Thương nhân** là hộ thương trong phường thị: họ tự mua nơi rẻ, bán nơi đắt. Càng nhiều hộ thương, chênh lệch giá càng nhỏ và thuế chợ càng nhiều.
- **Thuế chợ**: *quá thuế* 2% trên hàng đi ngang qua thành, *trú thuế* 3% trên hàng bán tại chợ. Người chơi chỉnh được; đặt cao thì thương đội né sang thành khác.
- **Phường thị** có 3 cấp: chợ phiên (họp 1 tuần/tháng), chợ thường, đại thị (thu hút thương đội ngoại quốc).

## 7. Thương lộ giữa các thành và các nước

Mỗi thành có **đặc sản** (làm rẻ, dư thừa) và **thiếu hụt** (phải mua). Chênh lệch giá sinh ra thương lộ.

| Vùng | Dư | Thiếu |
|---|---|---|
| Trung Nguyên (Hậu Lương) | Lương, vải, sắt | Trà, muối biển, lụa đẹp |
| Hà Đông (Tấn), Khiết Đan | Ngựa, sắt, da | Trà, lụa, lương |
| Thục | Lụa, trà, muối giếng | Ngựa |
| Giang Hoài (Ngô) | Muối, lương, thuyền | Ngựa, sắt |
| Ngô Việt, Mân | Gốm, lụa, hàng biển | Lương, ngựa |
| Sở | Trà | Muối, ngựa |
| Nam Hán, Tĩnh Hải | Lúa hai vụ, hương liệu, ngọc trai | Sắt, ngựa |
| Kinh Nam | (không có đặc sản) | Thu thuế quá cảnh của mọi tuyến đi qua |

**Thương đội** của quan phủ (từ chức thứ sử):

```
Lãi một chuyến = (Giá bán − Giá mua) × Số hàng
               − Hao hụt đường đi − Thuế quá cảnh các thành đi qua − Công phu xe
```

- Tuyến tiêu biểu: **trà đổi ngựa** (nam lên bắc), **muối và lụa ra, lương vào**, **gốm xuất hải**.
- Chiến tranh, cướp đường, cấm vận sẽ cắt tuyến. Nước nằm giữa (như Kinh Nam) có thể tăng thuế quá cảnh hoặc chặn hẳn.
- Hải thương chỉ mở cho thành có cảng; lãi cao, có rủi ro bão và hải tặc.

## 8. Tài chính của quan phủ

### 8.1. Các nguồn thu

| Nguồn | Cách tính | Từ chức |
|---|---|---|
| **Thu thuế** (thóc, tháng 11) | 10% sản lượng ruộng × mức thuế | Tri huyện |
| **Hạ thuế** (tiền, tháng 6) | Số hộ × định mức tầng lớp × mức thuế | Tri huyện |
| Thuế chợ | 2% hàng qua + 3% hàng bán | Tri huyện |
| Chuyên bán muối | Lượng muối dân mua × (giá bán − giá vốn) | Tri huyện |
| Chuyên bán trà, rượu | Như muối | Thứ sử |
| Thường bình thương | Chênh giá mua – bán thóc | Tri huyện |
| Thương đội quan | Mục 7 | Thứ sử |
| Chiến lợi phẩm, tịch thu | Sau trận, sau án | Phòng ngự sứ |
| Phần nộp từ các thành thuộc quyền | Tỉ lệ người chơi đặt | Thứ sử |
| Đúc tiền | Mục 9 | Vương |

Định mức hạ thuế mỗi hộ mỗi năm: nông 0,3 quan · công 0,5 · thương 1,2 · hào tộc 4. Sĩ, tăng, quan được miễn.

### 8.2. Năm mức thuế

| Mức | Hệ số | Dân tâm mỗi kỳ thuế | Hộ bỏ trốn |
|---|---|---|---|
| Khoan | ×0,5 | +2 | — |
| Nhẹ | ×0,75 | +1 | — |
| Thường | ×1,0 | 0 | — |
| Nặng | ×1,3 | −2 | 1% |
| Tận thu | ×1,6 | −5 | 4%, có nguy cơ nổi loạn |

### 8.3. Các khoản chi
Bổng lộc quan lại · lương và lương thực cho quân · bảo trì công trình (2% giá xây mỗi năm) · xây mới · thượng cung và lưu sứ · cứu tế · thưởng quân · quà biếu, hối lộ (nếu chọn đường quyền thần).

### 8.4. Chia thuế ba phần

| Chức của bạn | Thượng cung (triều đình) | Lưu sứ (tiết độ sứ) | Giữ lại |
|---|---|---|---|
| Tri huyện | 40% | 30% | 30% |
| Thứ sử | 40% | 25% | 35% |
| Tiết độ sứ | 30% (có thể nộp thiếu) | — | 70% |
| Vương trở lên | Tùy ý: triều cống hoặc không | — | 100% |

Nộp thiếu cho bề trên: thêm tiền ngay, nhưng trừ điểm khảo khóa và tăng nghi kỵ; bị nghi kỵ quá thì bị điều đi, bị thanh tra hoặc bị đánh.

### 8.5. Ví dụ ngân sách: một huyện 1.000 hộ, thuế mức Thường

Dân: 700 nông (35 khu ruộng), 120 công, 60 thương, 100 lưu dân, 20 sĩ – tăng – quan.

| Khoản thu trong năm | Tiền (quan) | Lương (thạch) |
|---|---|---|
| Thu thuế 10% của 12.600 thạch | | 1.260 |
| Hạ thuế (700×0,3 + 120×0,5 + 60×1,2) | 342 | |
| Thuế chợ | 150 | |
| Chuyên bán muối (200 thạch × lãi 1,2) | 240 | |
| **Tổng thu** | **732** | **1.260** |
| Thượng cung 40% + lưu sứ 30% | −512 | −882 |
| **Huyện giữ lại** | **≈ 220** | **≈ 378** |

| Khoản chi trong năm | Tiền (quan) |
|---|---|
| Bổng lộc thuộc lại | 60 |
| Bảo trì công trình | 80 |
| **Còn lại để xây mới, cứu tế** | **≈ 80** |

Kết luận từ ví dụ:
- Ngân sách một tri huyện rất eo hẹp; mỗi công trình mới là một lựa chọn phải cân nhắc.
- Hương binh của huyện là dân binh, không lĩnh lương, chỉ ăn lương khi được gọi. Một huyện **không** nuôi nổi quân thường trực.
- Muốn có thêm tiền thì phải tăng hộ thương và hộ công, mở chợ, lập kho thường bình — chứ không phải tăng thuế.

## 9. Tiền tệ

- Mỗi thành có một **lượng tiền đồng đang lưu thông**. Tiền chảy ra khi nộp thượng cung và mua hàng ngoài; chảy vào khi bán hàng ra ngoài và khi quan chi tiêu tại chỗ.
- **Tiền hoang** (thiếu tiền): khi tiền lưu thông dưới mức cần cho số hộ, giá cả tụt, chợ ế, phồn vinh giảm, thuế tiền thu không đủ. Lúc đó có thể cho nộp thuế bằng hiện vật (lụa, thóc) theo giá quy đổi.
- **Đúc tiền** (từ bậc Vương, cần mỏ đồng hoặc đồng mua về):

| Loại tiền | Chi phí | Hệ quả |
|---|---|---|
| Tiền đồng tốt | Cao, cần đồng | Ổn định, được nước khác nhận |
| Tiền sắt, tiền chì | Rẻ | Có tiền ngay, nhưng giá cả tăng 10–30% và chỉ tiêu được trong nước |
| Thu đồng trong dân, trong chùa để đúc | Không tốn nguyên liệu | Mất dân tâm; giới tăng lữ oán |

- **Vay**: vay hào tộc hoặc nhà chùa, lãi 20–30% một năm. Không trả thì họ đòi đặc quyền: miễn thuế, chức quan, ruộng công.
- **Công khố và tư khố**: tiền của huyện và tiền riêng của bạn là hai túi. Chuyển công thành tư là tham ô — dùng để hối lộ, nuôi tư binh, nhưng có nguy cơ bị thanh tra phát hiện.

## 10. Ruộng đất và hào tộc

- Ruộng thuộc về các hộ. Hộ nông mắc nợ sẽ bán ruộng cho **hào tộc** và trở thành **tá điền**: vẫn cày, nhưng nộp tô cho chủ và **biến mất khỏi sổ thuế**.
- Hào tộc mạnh lên thì: phồn vinh tăng, có người cho vay, có tư binh giúp giữ thành — nhưng thuế giảm dần, dân tâm của tá điền thấp, và họ can dự vào việc bổ quan.
- **Ruộng chùa** được miễn thuế. Nhiều chùa thì dân tâm cao mà kho bạc hụt.

Chính sách ruộng đất người chơi có thể ban hành:

| Chính sách | Lợi | Giá phải trả |
|---|---|---|
| Khẩn hoang, miễn thuế 3 năm | Hút lưu dân thành nông hộ | Ba năm đầu không thu được gì |
| Đo lại ruộng, lập lại sổ hộ | Lấy lại hộ ẩn, thuế tăng 10–25% | Hào tộc oán, có thể chống đối |
| Đồn điền quân | Lính tự làm ra lương lúc không đánh nhau | Huấn luyện tăng chậm |
| Hạn chế chùa, thu ruộng chùa | Thêm ruộng chịu thuế, thêm đồng đúc tiền | Mất dân tâm, tăng lữ oán |
| Cho vay giống, vay thóc lãi nhẹ | Hộ nghèo không phải bán ruộng | Tốn kho lương đầu năm |

## 11. Nhân lực và mùa vụ

- Nhân lực là **số hộ**, chia cho ruộng, xưởng, chợ, quân. Người chơi không gán từng hộ, chỉ đặt **mức ưu tiên** cho từng nhóm công trình.
- **Mùa bận**: tháng 1–2 (cấy) và tháng 9 (gặt). Gọi lao dịch hoặc bắt lính trong mùa bận làm giảm thu hoạch.
- **Lao dịch**: mỗi hộ nợ 20 ngày công một năm, tương đương 2 tuần. 1.000 hộ cho 2.000 "tuần-hộ" công, đủ đắp khoảng 40 đoạn tường hoặc 200 ô quan đạo. Dùng quá hạn mức thì trừ dân tâm.
- **Thuê phu**: trả 0,03 quan mỗi hộ mỗi tuần để làm thêm mà không mất dân tâm — lưu dân nhận việc này trước tiên.

## 12. Kinh tế thời chiến

**Chi phí nuôi 1 chỉ huy (500 lính) trong một năm:**

| Khoản | Bộ binh | Kỵ binh |
|---|---|---|
| Lương tiền | 900 quan | 900 quan |
| Lương thực cho lính | 1.080 thạch | 1.080 thạch |
| Lương thực cho ngựa | — | 1.800 thạch |
| Trang bị ban đầu (một lần) | 2.500 quan | 2.500 quan + 500 ngựa (15.000 quan) |

So với ví dụ ở mục 8.5: một huyện 1.000 hộ giữ lại được khoảng 220 quan một năm. Vậy:
- 1 chỉ huy bộ binh thường trực cần phần giữ lại của **khoảng 4 huyện**;
- 1 quân (2.500 lính) cần nguồn thu cỡ **một trấn**;
- kỵ binh là thứ xa xỉ của các thế lực có ngựa hoặc có trà, lụa để đổi ngựa.

Đây là lý do cơ cấu của game: muốn có quân thì phải có nhiều thành, muốn có nhiều thành thì phải lên chức.

**Tác động của chiến tranh lên kinh tế:**
- Bắt lính làm mất hộ lao động; lính chết là mất hộ vĩnh viễn.
- Thành bị vây: không thu hoạch, không buôn bán; hết lương là mất thành.
- Quân đi qua vùng nào thì vùng đó hao lương; quân thiếu lương sẽ **cướp dân** (được lương, mất dân tâm vùng đó trong nhiều năm).
- Thắng trận: chiến lợi phẩm, tù binh làm đồn điền, thành mới chiếm có 2 năm thuế thấp vì dân chưa phục.
- Thưởng quân sau thắng lớn bằng lụa và tiền; không thưởng thì sĩ khí tụt và nha binh có thể làm loạn.

## 13. Kinh tế của các thành không xây tay

Các thành giao cho quan trấn nhậm chạy bằng công thức gọn, cùng đơn vị với thành trị sở:

```
Sản lượng năm = Số hộ từng ngành × Năng suất gốc × Địa lợi của thành
              × Hệ số phương châm × (0,6 + Chính của quan ÷ 250) × Dân tâm ÷ 70

Phần về trị sở = (Thuế thu được − Chi của thành) × Tỉ lệ nộp
               × (1 − 3% × số chặng đường tới trị sở) − Tham ô của quan
```

| Phương châm | Tác dụng |
|---|---|
| Khuyến nông | Lương +25%, dân tăng nhanh |
| Hưng thương | Thuế chợ và hàng hóa +30%, lương −10% |
| Luyện binh | Mộ lính nhanh, huấn luyện +; thuế −15% |
| Cố thủ | Xây thành phòng, trữ lương; không tăng trưởng |
| Tận thu | Thuế +40% trong 2 năm, sau đó dân bỏ đi |

Tham ô của quan = 0–15% tùy đặc tính và khoảng cách; phái ngự sử đi thanh tra thì giảm.

## 14. Bài toán kinh tế theo từng bậc quan

| Bậc | Câu hỏi người chơi phải giải |
|---|---|
| Tri huyện | Làm sao đủ ăn qua mùa giáp hạt, nộp đủ thuế mà vẫn còn tiền xây một cái chợ? |
| Thứ sử | Huyện nào chuyên lúa, huyện nào chuyên muối, lụa, sắt? Nối chúng bằng đường nào? |
| Phòng ngự sứ | Nuôi vài chỉ huy quân thường trực mà không làm kiệt dân? |
| Tiết độ sứ | Giữ lại bao nhiêu thuế, nộp bao nhiêu? Lấy ngựa và sắt ở đâu? |
| Vương | Đúc tiền gì? Mở thương lộ với nước nào, cấm vận nước nào? |
| Quốc vương | Cân bằng giữa quân phí, hào tộc, nhà chùa và dân; chống hao hụt khi lãnh thổ quá rộng |

## 15. Vòng lặp tốt và vòng lặp xấu

**Vòng tốt:** thuế nhẹ → hộ có tích lũy → lên tầng công, thương → hàng hóa và thuế chợ tăng → có tiền làm đường, kho, thủy lợi → sản lượng tăng → nuôi được thêm dân và quân.

**Vòng xấu:** tận thu hoặc mất mùa → hộ nợ, bán ruộng → hào tộc gom ruộng, hộ biến khỏi sổ thuế → thuế hụt → lại tăng thuế → dân bỏ trốn hoặc nổi loạn.

Các van hãm để game không vỡ:
- Giá bị kẹp trong 0,4–2,5 lần giá gốc.
- Hao hụt kho và đường làm cho việc tích trữ vô hạn không có lợi.
- Tiền hoang ghìm tốc độ làm giàu chỉ bằng buôn bán.
- Hao hụt hành chính và tham ô tăng theo số thành, nên bành trướng không tự trả tiền cho chính nó.

## 16. Thứ tự làm phần kinh tế

| Bước | Nội dung | Thuộc mốc |
|---|---|---|
| K1 | Hộ dân theo tầng lớp, nhu cầu, tích lũy; lịch mùa vụ; lưỡng thuế và năm mức thuế | M1 |
| K2 | Chuỗi sản xuất đầy đủ, kho có bán kính, hệ số đường – thủy lợi – nông cụ | M1 |
| K3 | Chợ, giá cung cầu, thường bình thương, chuyên bán muối | M1 |
| K4 | Chia thuế ba phần, khảo khóa, công khố và tư khố | M2 |
| K5 | Kinh tế các thành số liệu, phương châm, thương lộ và thương đội | M3 |
| K6 | Quân phí, tiếp tế, hao hụt đường, chiến lợi phẩm | M4 |
| K7 | Tiền tệ, đúc tiền, vay nợ, ruộng đất và hào tộc | M5 |

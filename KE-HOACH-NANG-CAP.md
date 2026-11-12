# Kế hoạch nâng cấp Loạn Thế Lập Quốc

Game cần nâng cấp theo 5 nhóm chính, ưu tiên tối ưu hiệu năng trước, sau đó mới mở rộng gameplay.

**Nguyên tắc quan trọng nhất:** Loạn Thế Lập Quốc không phải game chạy đua lên Hoàng đế. Đây là game mô phỏng quyền lực trong thời loạn, nơi người chơi có thể dùng kinh tế, chính trị hoặc quân sự để thay đổi thiên hạ.

Giữ nguyên các hệ thống gameplay đang hoạt động tốt, nâng cấp từng phần, kiểm thử rồi mới triển khai phần tiếp theo, tránh sửa quá nhiều cùng lúc gây lỗi hoặc mất bản lưu.

## 1. Tối ưu hiệu năng — ưu tiên cao nhất

- Sửa tình trạng giật, lag khi phóng to và thu nhỏ bản đồ.
- Áp dụng Smooth Zoom, sử dụng hình ảnh có sẵn trong lúc zoom.
- Chỉ vẽ lại chi tiết sau khi người chơi ngừng zoom.
- Chia bản đồ thành từng vùng (Chunk Rendering).
- Chỉ xử lý các đối tượng trong vùng nhìn thấy.
- Tối ưu bộ nhớ đệm hình ảnh công trình và địa hình.
- Thêm chế độ đồ họa Thấp / Trung bình / Cao.
- Đo FPS và thời gian xử lý trước, sau khi tối ưu.

Mục tiêu: zoom mượt, giữ chất lượng hình ảnh và không làm thay đổi gameplay.

## 2. Phát triển ba con đường quyền lực

| Con đường | Nội dung cần bổ sung |
|---|---|
| Văn trị | Phát triển kinh tế, quản lý dân sinh, cải cách hành chính, trở thành trọng thần |
| Chính trị | Phe phái, quan hệ triều đình, bổ nhiệm quan lại, tranh giành và thao túng quyền lực |
| Quân sự – Cát cứ | Chỉ huy quân đội, nắm binh quyền, mở rộng lãnh thổ, thần phục hoặc tự lập |

Ba con đường có thể kết hợp với nhau và người chơi được phép thay đổi chiến lược trong suốt ván chơi.

Không phát triển hệ thống võ công cá nhân.

## 3. Nâng cấp gameplay quản lý và chiến lược

- Quan viên tự động: bổ nhiệm quan phụ trách xây dựng, kinh tế, quân sự và quản lý các thành.
- Ủy quyền: giao ngân sách, chính sách, chỉ tiêu phát triển cho quan viên, vẫn giữ quyền can thiệp.
- AI các nước: có tham vọng, chiến lược, quan hệ và khả năng phản bội riêng.
- Chính trị nội bộ: phe phái, lòng trung thành, tranh quyền, đảo chính, vua bù nhìn.
- Kinh tế liên quốc gia: giao thương, tài nguyên, thương mại, viện trợ và cấm vận.
- Quân sự: hậu cần, chiếm đóng, kiểm soát lãnh thổ và nổi loạn sau chiến tranh.

Không nên bổ sung quá nhiều công trình mới khi các hệ thống hiện tại chưa được hoàn thiện.

## 4. Thay đổi hệ thống mục tiêu và chiến thắng

Không bắt buộc phải trở thành Hoàng đế. Làm vua chỉ là một nhánh phát triển.

Người chơi có thể tự lựa chọn:

- Thao túng toàn bộ triều đình mà không cần xưng đế.
- Chinh phục hoặc kiểm soát tất cả các nước.
- Trở thành bá chủ kinh tế, kiểm soát tài nguyên và thương mại.
- Xây dựng một thế lực quân sự hùng mạnh.
- Làm quan trung thành, xây dựng vùng đất thịnh vượng.
- Cát cứ lâu dài, duy trì thế lực độc lập.

Game ghi nhận thành tựu, nhưng không kết thúc bắt buộc khi đạt mục tiêu.

## 5. Nâng cấp giao diện và trải nghiệm

- Phân chia rõ ba màn hình: Thành trì, Thiên hạ, Triều đình.
- Giảm số lượng thông tin xuất hiện cùng lúc.
- Thêm biểu đồ kinh tế, dân số và quân sự.
- Thêm lớp hiển thị bản đồ về dân tâm, kinh tế, quân sự.
- Cải thiện giao diện quản lý quan viên và giao nhiệm vụ.
- Giữ trải nghiệm khám phá, không hướng dẫn người chơi quá nhiều.
- Tối ưu giao diện trên PC và điện thoại.

## Thứ tự triển khai

1. **Giai đoạn 1 — Hiệu năng:** Smooth Zoom, Chunk Rendering, tối ưu Canvas và FPS.
2. **Giai đoạn 2 — Quản lý tự động:** quan viên phụ trợ, tự xây dựng, giao ngân sách và quản lý thành.
3. **Giai đoạn 3 — Ba con đường phát triển:** văn trị, chính trị và quân sự – cát cứ.
4. **Giai đoạn 4 — AI và thế giới động:** các nước tự phát triển, tranh quyền, liên minh, chiến tranh và thương mại.
5. **Giai đoạn 5 — Giao diện và hoàn thiện:** thiết kế lại UI, cân bằng gameplay, kiểm thử các ván chơi dài.

## Kiến trúc kỹ thuật giữ nguyên

- HTML + CSS + JavaScript.
- Canvas 2D cho bản đồ isometric.
- Không cần backend cho chế độ chơi đơn.
- GitHub Pages để phát hành.
- IndexedDB hoặc localStorage để lưu dữ liệu.
- Có thể dùng Web Workers khi mô phỏng AI trở nên nặng hơn.

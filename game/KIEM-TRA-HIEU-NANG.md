# Kiểm tra đồ họa — 13/11/2026

Đã kiểm tra bản chơi trong `game/` (trang gốc chuyển vào đây).

## Lỗi đã sửa

- Canvas lấy từ pool chỉ được đặt lại transform, trong khi lượt vẽ nền bị hủy có thể còn `save()` và `clip()`. Canvas mới dùng lại nay được reset toàn bộ, kể cả ngăn xếp trạng thái; có đường dự phòng cho trình duyệt không hỗ trợ `reset()`.
- Hàng đợi ảnh vật thể giữ tham chiếu tới vật đã giải phóng sau khi dựng lại vùng. Dùng Set và xóa mục ngay khi giải phóng để tránh tích lũy khi chơi lâu.
- Cơ chế tự giảm đồ họa trước đây tiêu hết 150 mẫu ngay tại màn chọn ván và chỉ giảm một lần nếu khung trung bình vượt 42 ms. Nay đo liên tục trong ván, bỏ qua hộp thoại/tab ẩn/khựng khi trở lại tab, giảm từng bậc khi trung bình vượt 30 ms và nghỉ 8 giây giữa các lần giảm. Tôn trọng lựa chọn đồ họa thủ công.
- Ngân sách dựng lại vùng trước đây có thể tới 19,8 ms khi đứng yên, chưa tính phần vẽ cảnh. Nay tối đa 6 ms cho mỗi khung; không bắt đầu việc mới khi đã hết số bước. Một thao tác vẽ đơn lẻ vẫn có thể vượt ngân sách.
- Bỏ qua nhân vật ngoài màn hình trước khi tính mặt nạ che khuất.

## Phép đo và giới hạn

Chrome headless trên máy hiện tại, khung nhìn 1440×900, DPR 1,5, đồ họa Cao, cảnh 42 người và 10 xe/ngựa. Dùng `bench-crowd.js`, 120 khung/thao tác, tắt làm mới hoạt họa vùng trong cả hai bản. Mỗi khung ép đọc canvas để tính cả raster. Đây là thời gian xử lý của phép đo, **không phải FPS màn hình** và không phải cam kết trên mọi máy.

| Thao tác | Trung bình trước → sau | p95 trước → sau |
|---|---|---|
| Đứng yên | 23,12 → 22,14 ms | 30,6 → 29,0 ms |
| Kéo bản đồ | 21,75 → 22,07 ms | 24,5 → 23,8 ms |
| Zoom | 20,33 → 19,54 ms | 25,8 → 24,4 ms |

Cải thiện trung bình nhỏ; kéo bản đồ gần như không đổi. Đỉnh zoom của lượt đo giảm từ 72,8 xuống 31,7 ms, nhưng đỉnh đơn lẻ có nhiễu và cần chơi thực tế để đánh giá.

Ảnh `Screenshot 2026-11-13 132405.png` có sọc dọc nghiêm trọng. Chưa tái hiện được đúng lỗi sọc này trong Chrome headless, nên chưa thể khẳng định đã xử lý hết nguyên nhân của ảnh đó. Lỗi trạng thái canvas nêu trên đã được tái hiện và kiểm bằng điểm ảnh riêng.

## Kiểm tra

- `node tests/round6.test.js`, `round11.test.js`, `sim.test.js`, `round10.test.js`, `audit.js`: đạt.
- Nạp `tests/render-perf-browser.js` trong ván rồi chạy `__renderPerfTests()`: 10 kiểm tra đạt, gồm điểm ảnh canvas sau hủy lượt vẽ, giải phóng ảnh và điều chỉnh đồ họa qua nhiều giai đoạn.
- `bench-crowd.js` → `__occTest(35, 1.6, 77)`: vẫn còn 2/35 vị trí có sai số che khuất trên ngưỡng 6% (quanh phủ/nhà). Đây là hạn chế hình ảnh còn lại, không chứng minh hình ảnh đã hoàn hảo.
- Không ghi nhận lỗi JavaScript trong các cảnh trình duyệt đã chạy. Cần kiểm tra lại ván đang gặp lag ở trình duyệt người chơi để xác nhận trải nghiệm thực tế.

## Nâng cấp hình ảnh tiếp theo

- Địa hình xanh dịu hơn, mặt nước xanh ngọc với vệt sáng chuyển động giới hạn 48 nét trong khung nhìn; nền rừng có tán bóng và lá rụng, cỏ mọc thành cụm.
- Ruộng có hàng lúa rõ hơn, lúa xanh/vàng/gốc rạ theo tháng. Thay đổi chỉ phục vụ hình ảnh; không đổi sản lượng hoặc lịch thu hoạch trong mô phỏng.
- Mạch sắt dùng đá xanh xám và vân khoáng thay hình phát sáng như dung nham; đồi giảm độ chói, bóng công trình chuyển sắc mềm hơn.
- Người, xe tiếp tục xuất hiện khi zoom; công trình được rê/chọn có viền chân màu vàng.
- Không dựng lại toàn bộ nền chỉ để tạo chuyển động nước. Chế độ Thấp giới hạn DPR ở 1, Trung bình ở 1,5, Cao ở 2.
- Trình đơn có nút **Tự điều chỉnh** và **Khôi phục hình ảnh**; khôi phục cũng chạy khi trình duyệt báo canvas đã phục hồi sau mất context.
- Đã kiểm tra 9 tổ hợp đồ họa/zoom (Thấp/Trung bình/Cao × 0,3/1/2,6), 13 kiểm tra hồi quy trình duyệt và tính toàn vẹn bản lưu/góc nhìn khi khôi phục. Không có lỗi JavaScript được ghi nhận.
- Sửa bộ đo `bench-crowd.js`: chờ vùng vẽ đúng tỉ lệ thực tế, tránh chờ hết 1.200 khung khi zoom không trùng bậc lượng tử.

Ảnh minh họa cảnh kiểm thử: `preview-upgrade.png`. Kết quả đo tuyệt đối giữa các phiên Chrome headless dao động lớn; không dùng chúng để hứa một mức FPS sau nâng cấp. Hai ca sai số che khuất đã nêu vẫn cần tinh chỉnh thêm.

## Bổ sung 14/11/2026 — lag khi zoom vào chỗ đông người

- Nguyên nhân đo được: mỗi người đứng sau công trình được vẽ qua một ảnh tạm riêng mỗi khung (đổi canvas liên tục), và người đứng sau phủ làm phủ bị vẽ lại nguyên bằng nét cho từng người.
- Nay vẽ người thẳng lên màn hình rồi vẽ đè lại phần công trình đứng trước trong khung bao của người; phủ và công trình đang xây dùng một ảnh đệm chung, làm mới tối đa ~0,3 giây một lần; ảnh vật thể che được giữ lại qua các lần làm mới hoạt họa; độ phân giải ảnh che có trần, bộ nhớ đệm 32/16/8 MB.
- Cảnh 42 người + 10 xe/ngựa + 10 giặc, 1280×720, Cao, zoom 2,6 (thời gian xử lý mỗi khung trong khung nhúng, không phải FPS): 140–160 ms → khoảng 25 ms; phần do người gây ra từ khoảng +90 ms xuống khoảng +2 ms.
- Đánh đổi: `__occTest` báo sai số điểm ảnh cao hơn cách cũ (khoảng 2–3,6% so với 1–1,4%) vì bóng và mép mờ của công trình nay phủ lên người thay vì xóa người; nhìn bằng mắt quanh dãy nhà ở zoom 2,6 vẫn che đúng.
- `recoverGraphics` không còn phụ thuộc biến ảnh tạm đã bỏ.

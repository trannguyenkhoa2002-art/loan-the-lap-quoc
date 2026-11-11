# Loạn Thế Lập Quốc — bản demo

Mở `index.html` bằng trình duyệt. Giữ các tệp `graphics.css`, `graphics.js` và `construction.js` cùng thư mục.

- **Khai lập cơ nghiệp:** bắt đầu từ thôn trang.
- **Xem trấn mẫu:** xem ngay khu dân cư có đường, xe ngựa, người cưỡi ngựa và thương đoàn. Có một nhà đang thi công để quan sát các giai đoạn xây dựng.
- Nhà xây qua các bước san nền, dựng khung, xây tường và lợp mái. Thời gian nhà dân là 14 giây mô phỏng. Công trình chỉ hoạt động khi hoàn thành. Nút tốc độ cũng áp dụng cho thi công và giao thông.
- Nối ít nhất **3 ô đường** để xuất hiện kỵ mã, **6 ô** cho xe ngựa, **9 ô** cho thương đoàn. Các ô phải nối thành một tuyến; giao thông không đi qua đất trống.
- Cuộn chuột để thu phóng, kéo bản đồ để di chuyển, nhấn **H** để về phủ. Bản đồ nhỏ có thể bấm để chuyển góc nhìn.

Trang `tests/visual-check.html` kiểm tra tiến độ xây dựng, tạm dừng, sức chứa trước/sau khi hoàn thành và việc xóa bảng tiến độ. Cảnh kiểm tra dùng tài nguyên riêng trong iframe, không thay đổi ván chơi ở tab khác.

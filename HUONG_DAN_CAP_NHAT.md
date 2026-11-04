# HƯỚNG DẪN CẬP NHẬT BẢN CHỐT

1. Sao lưu thư mục dự án đang chạy.
2. Thay toàn bộ thư mục bằng bản V5.34.0 hoặc tối thiểu cập nhật bốn file:
   - `js/app.js`
   - `js/commentbank.js`
   - `js/scores.js`
   - `js/subjectscores.js`
3. Tải lại trang bằng Ctrl + F5 để xóa cache cũ.
4. Vào chức năng nhập điểm, chọn lớp và tải lại file mẫu Excel.
5. Chỉ sử dụng file mẫu có hậu tố `_V56.xlsx`.
6. Không dùng lại mẫu V5.5/V5.27 vì các mẫu đó chưa có ngân hàng nhận xét luân phiên.

Khi nhập Excel:

- Không sửa 3 cột STT, Mã học sinh, Họ và tên.
- Không đổi tên sheet dữ liệu, `NganHangNhanXet`, `HuongDan`.
- Điểm hợp lệ từ 0 đến 10.
- Môn học dùng T/H/C.
- Phẩm chất và năng lực dùng T/Đ/C.
- Có thể sửa trực tiếp câu nhận xét tự động trước khi import.
- Ô trống được bỏ qua và không ghi đè dữ liệu cũ.

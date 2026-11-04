# SMART SCHOOL — BẢN CHỐT V5.34.0

Ngày chốt: 05/08/2026

## Nội dung hoàn tất

- Tích hợp bộ câu nhận xét do người dùng cung cấp vào `js/commentbank.js`.
- Phân loại đúng theo khối 1, khối 2–3 và khối 4–5.
- Ghép đúng môn học, phẩm chất, năng lực chung và năng lực đặc thù.
- Ngân hàng nhận xét tăng từ 994 lên 1.532 câu gợi ý.
- File Excel cuối học kỳ, giữa học kỳ và file giáo viên bộ môn đều có sheet `NganHangNhanXet`.
- Nhận xét trong file Excel tự luân phiên theo học sinh bằng công thức `INDEX` + `MOD`, hạn chế lặp cùng một câu.
- Khi có điểm: 9–10, 7–8, 5–6 và dưới 5 dùng bốn nhóm nhận xét riêng.
- Khi chỉ có mức: T/H/C hoặc T/Đ/C tự chọn đúng nhóm câu.
- Sửa lỗi trùng tên giữa môn Khoa học/Công nghệ/Tin học và năng lực đặc thù cùng tên.
- Bật chế độ tính lại công thức khi mở workbook.
- Cập nhật nhận diện khối để chấp nhận tên lớp như `4A` hoặc `Lớp 4A`.
- Cập nhật cache version trong `js/app.js` để trình duyệt tải bản mới.

## File Excel tạo ra

- Chủ nhiệm cuối kỳ: `FileMau_Diem_HK1_Lop..._V56.xlsx`, `FileMau_Diem_HK2_Lop..._V56.xlsx`.
- Chủ nhiệm giữa kỳ: `FileMau_GiữaHK1_Lop..._V56.xlsx`, `FileMau_GiữaHK2_Lop..._V56.xlsx`.
- Giáo viên bộ môn: `FileMau_<Môn>_<Kỳ>_Lop..._V56.xlsx`.

Mỗi workbook gồm:

1. Sheet nhập dữ liệu.
2. Sheet `NganHangNhanXet` chứa câu nhận xét đúng khối/môn.
3. Sheet `HuongDan`.

Không xóa hoặc đổi tên sheet `NganHangNhanXet` trước khi nhập dữ liệu, vì công thức nhận xét tham chiếu tới sheet này.

## Kiểm thử đã thực hiện

- Kiểm tra cú pháp toàn bộ file JavaScript bằng Node.js: đạt.
- Kiểm thử tạo mẫu cho khối 1–5, cuối kỳ và giữa kỳ.
- Kiểm thử mẫu giáo viên bộ môn cho toàn bộ môn trong cấu hình khối 1–5.
- Tổng cộng 72 trường hợp tạo workbook đã qua kiểm tra.
- Kiểm tra mọi workbook có đủ 3 sheet, có chế độ tính lại công thức và không có tham chiếu `undefined`.
- Kiểm tra độ dài công thức dưới giới hạn Excel.
- Kiểm tra riêng cột môn Khoa học và `NLĐ: Khoa học` tham chiếu hai cột mức khác nhau.

## Các file chính đã thay đổi

- `js/commentbank.js`
- `js/scores.js`
- `js/subjectscores.js`
- `js/app.js`

## Nguồn nhận xét

- `docs/NHAN_XET_MON_HOC_NGUON.docx`
- `docs/ngan-hang-nhan-xet-bo-sung-v5.6.json`

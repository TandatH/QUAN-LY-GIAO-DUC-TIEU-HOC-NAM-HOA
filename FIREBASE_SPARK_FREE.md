# FMA Nam Hòa — chế độ Firebase Spark

Ứng dụng dùng Firebase project `fma-nam-hoa` và được cấu hình để không cần gói Blaze hay phương thức thanh toán.

## Dịch vụ đang dùng

- Firebase Authentication: Email/Password.
- Firebase Realtime Database: dữ liệu học sinh, điểm, học bạ, tài chính, thời khóa biểu, thông báo, tin tức và phân quyền.
- Cloudflare Worker/Pages: lưu trữ web tĩnh, định tuyến và endpoint Resend tùy chọn.

## Dịch vụ đã tắt

- Firebase Cloud Functions: không import SDK và không deploy function.
- Firebase Cloud Storage: `window.FIREBASE_FEATURES.storage = false`; Storage Rules từ chối toàn bộ đọc/ghi.
- Phone Authentication và các sản phẩm có thể phát sinh phí khác không được dùng.

Từ ngày 03/02/2026, Firebase yêu cầu dự án ở Blaze để tiếp tục dùng Cloud Storage. Cloud Functions cũng yêu cầu Blaze. Vì vậy mã Nam Hòa chủ động không gọi hai dịch vụ này.

## Thay đổi chức năng

| Chức năng | Chế độ Spark |
|---|---|
| Đăng nhập và phân quyền | Hoạt động bằng Authentication + Realtime Database |
| Dữ liệu quản lý trường | Hoạt động bằng Realtime Database |
| QR học sinh | QR liên kết nội bộ; người quét phải đăng nhập đúng quyền |
| PDF/Word học sinh | Tạo và tải/in trực tiếp trong trình duyệt |
| Tin tức | Đăng văn bản; đọc ảnh cũ; không upload ảnh mới |
| Gửi email | Tùy chọn qua Cloudflare + Resend, không dùng Firebase Functions |

## Hạn mức cần theo dõi

Theo bảng giá Firebase tại ngày 21/10/2026, Realtime Database Spark có 100 kết nối đồng thời, 1 GB dữ liệu lưu và 10 GB tải xuống mỗi tháng. Hạn mức có thể được Firebase thay đổi; kiểm tra lại trước mỗi lần triển khai lớn:

- https://firebase.google.com/pricing
- https://firebase.google.com/docs/database/usage/limits
- https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024
- https://firebase.google.com/docs/functions/quotas

## Tệp cấu hình quan trọng

- `js/app.js`: cấu hình project, feature flags và admin khởi tạo.
- `firebase-database.rules.json`: phân quyền dữ liệu.
- `firebase-initial-data.json`: dữ liệu khởi tạo dự phòng.
- `firebase-storage.rules`: khóa Storage trong Spark.
- `wrangler.jsonc` và `worker.js`: triển khai Cloudflare.
- `MO-TRANG-WEB.bat` và `local-server.mjs`: mở bản cục bộ với đầy đủ route SPA.

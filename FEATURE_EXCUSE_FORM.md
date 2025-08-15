# Tính năng Biểu mẫu Minh chứng Điểm danh

## Tổng quan
Thay vì gửi ảnh minh chứng, học sinh giờ đây có thể gửi biểu mẫu text để giải thích lý do vắng mặt. Giáo viên sẽ xem xét và duyệt các yêu cầu này.

## Các thay đổi chính

### 1. Backend Changes

#### Model Updates (src/models/user.py)
Thêm các trường mới vào bảng `Attendance`:
- `note`: Ghi chú bổ sung từ học sinh
- `excuse_reason`: Lý do minh chứng chính
- `teacher_approval`: Trạng thái duyệt (pending/approved/rejected)
- `teacher_comment`: Nhận xét của giáo viên
- `approved_by`: ID giáo viên duyệt
- `approved_at`: Thời gian duyệt

#### API Endpoints mới

**Student APIs:**
- `POST /api/student/attendance/excuse`: Gửi biểu mẫu minh chứng
  ```json
  {
    "date": "2025-08-13",
    "excuse_reason": "Lý do chính",
    "note": "Ghi chú bổ sung"
  }
  ```

**Teacher APIs:**
- `GET /api/teacher/attendance-requests`: Lấy danh sách yêu cầu pending
- `POST /api/teacher/attendance-requests/:id/approve`: Duyệt/từ chối yêu cầu
  ```json
  {
    "status": "approved|rejected",
    "comment": "Nhận xét của giáo viên"
  }
  ```

### 2. Frontend Changes

#### AttendanceCalendar.jsx
- Thay đổi giao diện từ upload file thành form text
- Thêm màu vàng cho trạng thái "đang chờ duyệt"
- Form validation cho lý do minh chứng (bắt buộc)

#### TeacherDashboard.jsx
- Hiển thị danh sách yêu cầu minh chứng chi tiết
- Nút duyệt/từ chối với khả năng thêm nhận xét
- Giao diện thân thiện và dễ sử dụng

### 3. Database Migration
Script migration tự động chạy khi khởi động container Docker:
- `migrations/add_excuse_form_fields.py`
- Được gọi trong `start.sh`

## Cách sử dụng

### Học sinh:
1. Truy cập trang điểm danh
2. Click vào ngày vắng mặt (màu đỏ)
3. Điền lý do minh chứng (bắt buộc)
4. Thêm ghi chú bổ sung (tùy chọn)
5. Nhấn "Gửi biểu mẫu minh chứng"
6. Ngày sẽ chuyển sang màu vàng (đang chờ duyệt)

### Giáo viên:
1. Truy cập dashboard giáo viên
2. Xem danh sách yêu cầu ở panel bên phải
3. Đọc lý do và ghi chú của học sinh
4. Nhấn "Duyệt" hoặc "Từ chối"
5. Thêm nhận xét (tùy chọn)
6. Yêu cầu sẽ biến mất khỏi danh sách

## Triển khai với Docker

```bash
# Build và chạy containers
docker-compose up --build

# Hoặc chạy trong nền
docker-compose up --build -d

# Xem logs
docker-compose logs -f backend
```

## Status Colors
- 🟢 **Xanh lá**: Đã điểm danh (hoặc đã được duyệt)
- 🟡 **Vàng**: Đang chờ giáo viên duyệt
- � **Cam**: Yêu cầu bị từ chối (có thể gửi lại)
- �🔴 **Đỏ**: Vắng mặt (chưa có minh chứng)

## Workflow chi tiết

### Khi học sinh gửi yêu cầu:
1. Trạng thái chuyển từ "absent" → "pending"
2. Màu đổi từ đỏ → vàng
3. Yêu cầu xuất hiện trong dashboard giáo viên

### Khi giáo viên duyệt:
1. **Nếu DUYỆT**: Trạng thái → "present", màu → xanh lá
2. **Nếu TỪ CHỐI**: Trạng thái → "rejected", màu → cam
3. Học sinh có thể xem lý do từ chối và gửi lại yêu cầu mới

### Khi yêu cầu bị từ chối:
1. Học sinh thấy thông báo "Yêu cầu bị từ chối" với lý do
2. Có thể điền lại form và gửi yêu cầu mới
3. Nút chuyển thành "Gửi lại yêu cầu" (màu cam)

## API Endpoints mới

**Teacher APIs:**
- `GET /api/teacher/attendance-requests/processed`: Xem yêu cầu đã xử lý

## Lưu ý kỹ thuật
- Database migration tự động chạy khi container khởi động
- Dữ liệu cũ được giữ nguyên, chỉ thêm cột mới
- Các yêu cầu được sắp xếp theo thời gian gửi (mới nhất trước)
- Session-based authentication được duy trì
- `excuse_reason`: Lý do minh chứng của học sinh (TEXT) 
- `teacher_approval`: Trạng thái duyệt (pending/approved/rejected)
- `teacher_comment`: Nhận xét của giáo viên (TEXT)
- `approved_by`: ID giáo viên duyệt (INTEGER)
- `approved_at`: Thời gian duyệt (DATETIME)

### 2. API Changes

#### Student API
- **Mới**: `POST /api/student/attendance/excuse`
  - Gửi biểu mẫu minh chứng với lý do text
  - Thay thế API upload file cũ

#### Teacher API  
- **Mới**: `GET /api/teacher/attendance-requests`
  - Lấy danh sách yêu cầu minh chứng đang chờ duyệt
- **Mới**: `POST /api/teacher/attendance-requests/{id}/approve`
  - Duyệt hoặc từ chối yêu cầu minh chứng

### 3. Frontend Changes

#### Student Dashboard
- Form gửi minh chứng giờ là text area thay vì upload file
- Hiển thị trạng thái: "Có mặt" (xanh), "Chờ duyệt" (vàng), "Vắng mặt" (đỏ)
- Chỉ cho phép gửi minh chứng cho ngày vắng mặt

#### Teacher Dashboard
- Panel mới hiển thị danh sách yêu cầu minh chứng
- Nút duyệt/từ chối với khả năng thêm nhận xét
- Cập nhật real-time sau khi xử lý

## Hướng dẫn sử dụng

### Đối với học sinh:
1. Vào trang "Theo dõi điểm danh"
2. Click vào ngày có màu đỏ (vắng mặt)
3. Điền lý do minh chứng vào ô "Lý do minh chứng" (bắt buộc)
4. Có thể thêm ghi chú bổ sung
5. Click "Gửi biểu mẫu minh chứng"
6. Ngày sẽ chuyển sang màu vàng (chờ duyệt)

### Đối với giáo viên:
1. Vào Teacher Dashboard
2. Xem danh sách yêu cầu ở panel bên phải
3. Đọc lý do minh chứng của học sinh
4. Click "Duyệt" hoặc "Từ chối"
5. Có thể thêm nhận xét khi duyệt

## Cài đặt

### 1. Chạy Migration
```bash
cd backend
python migrate_attendance_schema.py
```

### 2. Khởi động lại Backend
```bash
cd backend
python src/main.py
```

### 3. Frontend (nếu cần)
```bash
cd frontend/app
npm run dev
```

## Màu sắc trạng thái

- 🟢 **Xanh lá**: Đã điểm danh (present)
- 🟡 **Vàng**: Đang chờ duyệt (pending) 
- 🔴 **Đỏ**: Vắng mặt (absent)

## Lưu ý
- Học sinh chỉ có thể gửi minh chứng cho những ngày vắng mặt
- Mỗi ngày chỉ có thể gửi một yêu cầu minh chứng
- Giáo viên chỉ có thể duyệt yêu cầu của học sinh trong lớp mình phụ trách
- Sau khi duyệt, trạng thái điểm danh sẽ được cập nhật tự động

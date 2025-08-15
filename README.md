# Hệ thống Điểm danh Nhận diện Khuôn mặt

## 📋 Mô tả

Hệ thống điểm danh thông minh sử dụng công nghệ nhận diện khuôn mặt để tự động hóa quá trình điểm danh trong môi trường giáo dục. Hệ thống hỗ trợ nhiều vai trò người dùng (Admin, Giáo viên, Học sinh) với giao diện web thân thiện và API RESTful.

## ✨ Tính năng chính

### 🎯 Nhận diện khuôn mặt
- Nhận diện khuôn mặt tự động bằng công nghệ AI
- Hỗ trợ đa thuật toán: HOG, CNN, Haar Cascade
- Độ chính xác cao với điểm tin cậy (confidence score)
- Phát hiện và xử lý nhiều khuôn mặt trong một khung hình

### 👥 Quản lý người dùng
- **Admin**: Quản lý toàn bộ hệ thống, học sinh, giáo viên
- **Giáo viên**: Xem điểm danh, quản lý lớp học, duyệt đơn xin phép
- **Học sinh**: Điểm danh, xem lịch sử, gửi đơn xin phép vắng mặt

### 📊 Báo cáo và thống kê
- Thống kê điểm danh theo ngày, tuần, tháng
- Báo cáo chi tiết cho từng học sinh
- Dashboard trực quan với biểu đồ

### 📝 Hệ thống xin phép vắng mặt
- Học sinh gửi đơn xin phép với lý do cụ thể
- Giáo viên xem xét và phê duyệt đơn
- Theo dõi trạng thái đơn (chờ duyệt, đã duyệt, từ chối)

## 🛠️ Công nghệ sử dụng

### Backend
- **Flask**: Web framework cho Python
- **SQLAlchemy**: ORM cho cơ sở dữ liệu
- **OpenCV**: Xử lý ảnh và computer vision
- **face_recognition**: Thư viện nhận diện khuôn mặt
- **scikit-learn**: Machine learning
- **SQLite**: Cơ sở dữ liệu

### Frontend
- **React 19**: Framework JavaScript
- **Vite**: Build tool hiện đại
- **React Router**: Điều hướng SPA
- **CSS3**: Styling responsive

### DevOps
- **Docker**: Container hóa ứng dụng
- **Docker Compose**: Orchestration
- **Flask-CORS**: Xử lý CORS

## 🚀 Cài đặt và chạy

### Yêu cầu hệ thống
- Python 3.8+
- Node.js 16+
- Docker (tùy chọn)
- Camera/Webcam

### 1. Sử dụng Docker (Khuyến nghị)

```bash
# Clone repository
git clone https://github.com/hoanganhUET/FaceRecognition.git
cd FaceRecognition

# Chạy bằng Docker Compose
docker-compose up --build
```

### 2. Cài đặt thủ công

#### Backend
```bash
cd backend

# Tạo virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# hoặc
venv\Scripts\activate     # Windows

# Cài đặt dependencies
pip install -r requirements.txt

# Chạy server
python src/main.py
```

#### Frontend
```bash
cd frontend/app

# Cài đặt dependencies
npm install

# Chạy development server
npm run dev
```

## 🌐 Truy cập hệ thống

### URLs
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:5001
- **Admin Dashboard**: http://localhost:3001/admin
- **Teacher Dashboard**: http://localhost:3001/teacher
- **Student Dashboard**: http://localhost:3001/student

### Tài khoản mặc định
- **Admin**: `admin` / `123`

## 📚 API Documentation

### Authentication
```http
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/me
```

### Admin APIs
```http
GET /api/admin/students          # Lấy danh sách học sinh
POST /api/admin/students         # Tạo học sinh mới
PUT /api/admin/students/:id      # Cập nhật học sinh
DELETE /api/admin/students/:id   # Xóa học sinh

GET /api/admin/teachers          # Quản lý giáo viên
POST /api/admin/teachers
PUT /api/admin/teachers/:id
DELETE /api/admin/teachers/:id

GET /api/admin/attendance        # Báo cáo điểm danh
GET /api/admin/dashboard/stats   # Thống kê dashboard
```

### Student APIs
```http
GET /api/student/profile         # Thông tin cá nhân
PUT /api/student/profile         # Cập nhật profile
GET /api/student/attendance      # Lịch sử điểm danh
POST /api/student/attendance/excuse  # Gửi đơn xin phép
```

### Teacher APIs
```http
GET /api/teacher/attendance-requests     # Danh sách đơn xin phép
POST /api/teacher/attendance-requests/:id/approve  # Duyệt đơn
GET /api/teacher/students               # Học sinh lớp học
```

### Face Recognition APIs
```http
POST /api/face/recognize         # Nhận diện khuôn mặt
POST /api/face/register          # Đăng ký khuôn mặt
POST /api/face/detect            # Phát hiện khuôn mặt
```

## 📁 Cấu trúc thư mục

```
FaceRecognition/
├── backend/                     # Backend Flask
│   ├── src/
│   │   ├── main.py             # Entry point
│   │   ├── models/             # Database models
│   │   │   └── user.py
│   │   ├── routes/             # API routes
│   │   │   ├── admin.py
│   │   │   ├── auth.py
│   │   │   ├── face.py
│   │   │   ├── student.py
│   │   │   └── teacher.py
│   │   ├── utils/              # Utilities
│   │   │   └── face_recognition.py
│   │   └── database/           # SQLite database
│   ├── uploads/                # File uploads
│   ├── migrations/             # Database migrations
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                   # Frontend React
│   └── app/
│       ├── src/
│       │   ├── App.jsx         # Main component
│       │   ├── components/     # React components
│       │   └── assets/
│       ├── public/
│       ├── package.json
│       └── dockerfile
├── docker-compose.yml          # Docker orchestration
└── README.md
```

## 🔧 Cấu hình

### Environment Variables
```env
# Backend
FLASK_ENV=production
CORS_ORIGINS=http://localhost:3001

# Frontend
NODE_ENV=development
VITE_API_URL=http://localhost:5001
CHOKIDAR_USEPOLLING=true
```

### Database Schema
- **User**: Thông tin người dùng (admin/teacher/student)
- **FaceData**: Dữ liệu khuôn mặt đã mã hóa
- **Attendance**: Bản ghi điểm danh với trạng thái và minh chứng

## 🔄 Quy trình hoạt động

### 1. Điểm danh tự động
1. Học sinh đứng trước camera
2. Hệ thống phát hiện và nhận diện khuôn mặt
3. So sánh với database khuôn mặt đã đăng ký
4. Tự động ghi nhận điểm danh với điểm tin cậy

### 2. Xin phép vắng mặt
1. Học sinh gửi đơn xin phép với lý do
2. Đơn chuyển về trạng thái "chờ duyệt"
3. Giáo viên xem xét và phê duyệt/từ chối
4. Cập nhật trạng thái điểm danh

## 🧪 Testing

```bash
# Backend tests
cd backend
python -m pytest

# Frontend tests
cd frontend/app
npm test
```

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch: `git checkout -b feature/AmazingFeature`
3. Commit changes: `git commit -m 'Add some AmazingFeature'`
4. Push to branch: `git push origin feature/AmazingFeature`
5. Tạo Pull Request

## 📝 Changelog

### v1.2.0 - Tính năng Biểu mẫu Minh chứng
- ✅ Thay thế upload ảnh bằng form text
- ✅ Hệ thống duyệt đơn của giáo viên
- ✅ Trạng thái "chờ duyệt" với màu vàng
- ✅ API endpoints mới cho excuse form

### v1.1.0 - Cải thiện UI/UX
- ✅ Responsive design
- ✅ Dashboard nâng cao
- ✅ Thống kê chi tiết

### v1.0.0 - Phiên bản đầu tiên
- ✅ Nhận diện khuôn mặt cơ bản
- ✅ Quản lý người dùng
- ✅ API RESTful

## 📄 License

MIT License - xem file [LICENSE](LICENSE) để biết thêm chi tiết.

## 📞 Liên hệ

- **Tác giả**: hoanganhUET
- **Email**: [email@example.com]
- **GitHub**: https://github.com/hoanganhUET/FaceRecognition

## 🙏 Acknowledgments

- Face Recognition Library
- OpenCV Community
- React Team
- Flask Community
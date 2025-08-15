from flask import Blueprint, request, jsonify, session
from src.models.user import db, User, FaceData, Attendance
from src.routes.auth import require_auth
from datetime import datetime

student_bp = Blueprint('student', __name__)

@student_bp.route('/student/profile', methods=['GET'])
@require_auth
def get_profile():
    try:
        user_id = session.get('user_id')
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User không tồn tại'}), 404
        
        return jsonify({'profile': user.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@student_bp.route('/student/profile', methods=['PUT'])
@require_auth
def update_profile():
    try:
        user_id = session.get('user_id')
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User không tồn tại'}), 404
        
        data = request.get_json()
        
        # Students can only update certain fields
        allowed_fields = ['full_name', 'class_name', 'school']
        
        for field in allowed_fields:
            if field in data:
                setattr(user, field, data[field])
        
        # Handle password change
        if data.get('password'):
            user.set_password(data['password'])
        
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Cập nhật thông tin thành công',
            'profile': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@student_bp.route('/student/face-data', methods=['GET'])
@require_auth
def get_face_data():
    try:
        user_id = session.get('user_id')
        face_data_list = FaceData.query.filter_by(user_id=user_id).all()
        
        return jsonify({
            'face_data': [face.to_dict() for face in face_data_list]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@student_bp.route('/student/face-data/<int:face_id>', methods=['DELETE'])
@require_auth
def delete_face_data(face_id):
    try:
        user_id = session.get('user_id')
        face_data = FaceData.query.filter_by(id=face_id, user_id=user_id).first()
        
        if not face_data:
            return jsonify({'error': 'Dữ liệu khuôn mặt không tồn tại'}), 404
        
        # Delete the image file if it exists
        import os
        if os.path.exists(face_data.image_path):
            os.remove(face_data.image_path)
        
        db.session.delete(face_data)
        db.session.commit()
        
        return jsonify({'message': 'Xóa dữ liệu khuôn mặt thành công'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@student_bp.route('/student/attendance', methods=['GET'])
@require_auth
def get_student_attendance():
    """Lấy dữ liệu điểm danh của học sinh"""
    try:
        user_id = session.get('user_id')
        student = User.query.get(user_id)
        
        if not student or student.role != 'student':
            return jsonify({'error': 'Không có quyền truy cập'}), 403
        
        year = request.args.get('year', type=int)
        month = request.args.get('month', type=int)
        
        if not year or not month:
            return jsonify({'error': 'Thiếu tham số year hoặc month'}), 400
        
        # Lấy dữ liệu điểm danh trong tháng
        from datetime import datetime
        start_date = datetime(year, month, 1)
        if month == 12:
            end_date = datetime(year + 1, 1, 1)
        else:
            end_date = datetime(year, month + 1, 1)
        
        attendances = Attendance.query.filter(
            Attendance.user_id == user_id,
            Attendance.check_in_time >= start_date,
            Attendance.check_in_time < end_date
        ).all()
        
        # Tổ chức dữ liệu theo ngày
        attendance_by_day = {}
        for att in attendances:
            day = att.check_in_time.day
            key = f"{month}-{day}"
            attendance_by_day[key] = {
                'status': att.status,
                'time': att.check_in_time.strftime('%H:%M'),
                'teacher_approval': att.teacher_approval,
                'teacher_comment': att.teacher_comment,
                'excuse_reason': att.excuse_reason,
                'note': att.note
            }
        
        return jsonify({'attendance': attendance_by_day}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@student_bp.route('/student/attendance', methods=['POST'])
@require_auth
def create_attendance():
    try:
        user_id = session.get('user_id')
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User không tồn tại'}), 404
        
        data = request.get_json()
        
        # Validate required fields
        if 'check_in_time' not in data:
            return jsonify({'error': 'Thiếu thời gian điểm danh'}), 400
        
        attendance_record = Attendance(
            user_id=user_id,
            check_in_time=datetime.fromisoformat(data['check_in_time']),
            status=data.get('status', 'present')  # Default to 'present'
        )
        
        db.session.add(attendance_record)
        db.session.commit()
        
        return jsonify({
            'message': 'Điểm danh thành công',
            'attendance_record': attendance_record.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@student_bp.route('/student/attendance/excuse', methods=['POST'])
@require_auth
def submit_excuse_form():
    """Gửi biểu mẫu minh chứng bằng text thay vì ảnh"""
    try:
        user_id = session.get('user_id')
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User không tồn tại'}), 404
        
        data = request.get_json()
        date_str = data.get('date')
        excuse_reason = data.get('excuse_reason')
        note = data.get('note', '')
        
        if not date_str:
            return jsonify({'error': 'Thiếu ngày điểm danh'}), 400
        
        if not excuse_reason:
            return jsonify({'error': 'Thiếu lý do minh chứng'}), 400
        
        # Parse date
        try:
            attendance_date = datetime.strptime(date_str, '%Y-%m-%d')
        except ValueError:
            return jsonify({'error': 'Ngày không hợp lệ, định dạng: YYYY-MM-DD'}), 400
        
        # Kiểm tra xem bản ghi điểm danh đã tồn tại chưa
        attendance_record = Attendance.query.filter_by(
            user_id=user_id,
            check_in_time=attendance_date
        ).first()
        
        if attendance_record:
            # Cập nhật bản ghi có sẵn
            attendance_record.excuse_reason = excuse_reason
            attendance_record.note = note
            attendance_record.teacher_approval = 'pending'
            attendance_record.status = 'pending'
        else:
            # Tạo bản ghi mới
            attendance_record = Attendance(
                user_id=user_id,
                check_in_time=attendance_date,
                status='pending',
                excuse_reason=excuse_reason,
                note=note,
                teacher_approval='pending'
            )
            db.session.add(attendance_record)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Gửi biểu mẫu minh chứng thành công',
            'attendance_record': attendance_record.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
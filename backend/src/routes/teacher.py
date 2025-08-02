from flask import Blueprint, request, jsonify, session
from src.models.user import db, User, FaceData, Attendance
from src.routes.auth import require_auth
from datetime import datetime

teacher_bp = Blueprint('teacher', __name__)

@teacher_bp.route('/teacher/profile', methods=['GET'])
@require_auth
def get_profile():
    try:
        user_id = session.get('user_id')
        user = User.query.get(user_id)
        
        if not user or user.role != 'teacher':
            return jsonify({'error': 'Teacher không tồn tại'}), 404
        
        return jsonify({'profile': user.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@teacher_bp.route('/teacher/profile', methods=['PUT'])
@require_auth
def update_profile():
    try:
        user_id = session.get('user_id')
        user = User.query.get(user_id)
        
        if not user or user.role != 'teacher':
            return jsonify({'error': 'Teacher không tồn tại'}), 404
        
        data = request.get_json()
        
        # Teachers can update certain fields
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

@teacher_bp.route('/teacher/students', methods=['GET'])
@require_auth
def get_students():
    """Lấy danh sách học sinh của lớp giáo viên phụ trách"""
    try:
        user_id = session.get('user_id')
        teacher = User.query.get(user_id)
        
        if not teacher or teacher.role != 'teacher':
            return jsonify({'error': 'Teacher không tồn tại'}), 404
        
        # Lấy học sinh cùng lớp với giáo viên
        students = User.query.filter_by(
            role='student', 
            class_name=teacher.class_name
        ).all()
        
        return jsonify({
            'students': [student.to_dict() for student in students]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@teacher_bp.route('/teacher/attendance', methods=['GET'])
@require_auth
def get_teacher_attendance():
    """Lấy dữ liệu điểm danh của lớp do giáo viên phụ trách"""
    try:
        user_id = session.get('user_id')
        teacher = User.query.get(user_id)
        
        if not teacher or teacher.role != 'teacher':
            return jsonify({'error': 'Không có quyền truy cập'}), 403
        
        year = request.args.get('year', type=int)
        month = request.args.get('month', type=int)
        
        if not year or not month:
            return jsonify({'error': 'Thiếu tham số year hoặc month'}), 400
        
        # Lấy tất cả học sinh trong lớp của giáo viên
        students = User.query.filter_by(
            role='student', 
            class_name=teacher.class_name
        ).all()
        
        if not students:
            return jsonify({'attendance': {}}), 200
        
        student_ids = [s.id for s in students]
        
        # Lấy dữ liệu điểm danh trong tháng
        from datetime import datetime
        start_date = datetime(year, month, 1)
        if month == 12:
            end_date = datetime(year + 1, 1, 1)
        else:
            end_date = datetime(year, month + 1, 1)
        
        attendances = Attendance.query.filter(
            Attendance.user_id.in_(student_ids),
            Attendance.check_in_time >= start_date,
            Attendance.check_in_time < end_date
        ).all()
        
        # Tổ chức dữ liệu theo ngày
        attendance_by_day = {}
        for att in attendances:
            day = att.check_in_time.day
            key = f"{month}-{day}"
            
            if key not in attendance_by_day:
                attendance_by_day[key] = []
            
            student = next(s for s in students if s.id == att.user_id)
            attendance_by_day[key].append({
                'full_name': student.full_name,
                'student_id': student.student_id,
                'status': att.status,
                'check_in_time': att.check_in_time.strftime('%H:%M')
            })
        
        return jsonify({'attendance': attendance_by_day}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@teacher_bp.route('/teacher/profile', methods=['GET'])
@require_auth
def get_teacher_profile():
    """Lấy thông tin profile của giáo viên"""
    try:
        user_id = session.get('user_id')
        teacher = User.query.get(user_id)
        
        if not teacher:
            return jsonify({'error': 'User không tồn tại'}), 404
        
        return jsonify({
            'profile': {
                'full_name': teacher.full_name,
                'username': teacher.username,
                'class_name': teacher.class_name,
                'school': teacher.school,
                'role': teacher.role
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
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

@teacher_bp.route('/teacher/attendance-requests', methods=['GET'])
@require_auth
def get_attendance_requests():
    """Lấy danh sách yêu cầu minh chứng từ học sinh"""
    try:
        user_id = session.get('user_id')
        teacher = User.query.get(user_id)
        
        if not teacher or teacher.role != 'teacher':
            return jsonify({'error': 'Không có quyền truy cập'}), 403
        
        # Lấy tất cả học sinh trong lớp của giáo viên
        students = User.query.filter_by(
            role='student', 
            class_name=teacher.class_name
        ).all()
        
        if not students:
            return jsonify({'requests': []}), 200
        
        student_ids = [s.id for s in students]
        
        # Lấy các yêu cầu minh chứng đang pending
        pending_requests = Attendance.query.filter(
            Attendance.user_id.in_(student_ids),
            Attendance.teacher_approval == 'pending'
        ).order_by(Attendance.created_at.desc()).all()
        
        requests_data = []
        for req in pending_requests:
            student = next(s for s in students if s.id == req.user_id)
            requests_data.append({
                'id': req.id,
                'student_id': student.student_id,
                'student_name': student.full_name,
                'date': req.check_in_time.strftime('%Y-%m-%d'),
                'excuse_reason': req.excuse_reason,
                'note': req.note,
                'submitted_at': req.created_at.isoformat()
            })
        
        return jsonify({'requests': requests_data}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@teacher_bp.route('/teacher/attendance-requests/processed', methods=['GET'])
@require_auth
def get_processed_attendance_requests():
    """Lấy danh sách yêu cầu minh chứng đã được xử lý"""
    try:
        user_id = session.get('user_id')
        teacher = User.query.get(user_id)
        
        if not teacher or teacher.role != 'teacher':
            return jsonify({'error': 'Không có quyền truy cập'}), 403
        
        # Lấy tất cả học sinh trong lớp của giáo viên
        students = User.query.filter_by(
            role='student', 
            class_name=teacher.class_name
        ).all()
        
        if not students:
            return jsonify({'requests': []}), 200
        
        student_ids = [s.id for s in students]
        
        # Lấy các yêu cầu minh chứng đã được xử lý (approved hoặc rejected)
        processed_requests = Attendance.query.filter(
            Attendance.user_id.in_(student_ids),
            Attendance.teacher_approval.in_(['approved', 'rejected'])
        ).order_by(Attendance.approved_at.desc()).limit(20).all()
        
        requests_data = []
        for req in processed_requests:
            student = next(s for s in students if s.id == req.user_id)
            requests_data.append({
                'id': req.id,
                'student_id': student.student_id,
                'student_name': student.full_name,
                'date': req.check_in_time.strftime('%Y-%m-%d'),
                'excuse_reason': req.excuse_reason,
                'note': req.note,
                'teacher_approval': req.teacher_approval,
                'teacher_comment': req.teacher_comment,
                'submitted_at': req.created_at.isoformat(),
                'processed_at': req.approved_at.isoformat() if req.approved_at else None
            })
        
        return jsonify({'requests': requests_data}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@teacher_bp.route('/teacher/attendance-requests/<int:request_id>/approve', methods=['POST'])
@require_auth
def approve_attendance_request(request_id):
    """Duyệt yêu cầu minh chứng của học sinh"""
    try:
        user_id = session.get('user_id')
        teacher = User.query.get(user_id)
        
        if not teacher or teacher.role != 'teacher':
            return jsonify({'error': 'Không có quyền truy cập'}), 403
        
        data = request.get_json()
        approval_status = data.get('status')  # 'approved' hoặc 'rejected'
        teacher_comment = data.get('comment', '')
        
        if approval_status not in ['approved', 'rejected']:
            return jsonify({'error': 'Trạng thái duyệt không hợp lệ'}), 400
        
        # Tìm yêu cầu minh chứng
        attendance_record = Attendance.query.get(request_id)
        if not attendance_record:
            return jsonify({'error': 'Không tìm thấy yêu cầu'}), 404
        
        # Kiểm tra học sinh có thuộc lớp của giáo viên không
        student = User.query.get(attendance_record.user_id)
        if not student or student.class_name != teacher.class_name:
            return jsonify({'error': 'Không có quyền duyệt yêu cầu này'}), 403
        
        # Cập nhật trạng thái duyệt
        attendance_record.teacher_approval = approval_status
        attendance_record.teacher_comment = teacher_comment
        attendance_record.approved_by = user_id
        attendance_record.approved_at = datetime.utcnow()
        
        # Cập nhật status dựa trên kết quả duyệt
        if approval_status == 'approved':
            attendance_record.status = 'present'  # Xác nhận có mặt
        else:
            attendance_record.status = 'absent'   # Xác nhận vắng mặt
        
        db.session.commit()
        
        return jsonify({
            'message': f'Yêu cầu đã được {approval_status}',
            'attendance_record': attendance_record.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
from flask import Blueprint, request, jsonify, session
from src.models.user import db, User, Attendance
from src.routes.auth import require_admin
from datetime import datetime

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/admin/students', methods=['GET'])
@require_admin
def get_all_students():
    try:
        students = User.query.filter_by(role='student').all()
        return jsonify({
            'students': [student.to_dict() for student in students]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/admin/students', methods=['POST'])
@require_admin
def create_student():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['username', 'password', 'full_name', 'student_id']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} là bắt buộc'}), 400
        
        # Check if username or student_id already exists
        existing_user = User.query.filter(
            (User.username == data['username']) | 
            (User.student_id == data['student_id'])
        ).first()
        
        if existing_user:
            return jsonify({'error': 'Username hoặc mã sinh viên đã tồn tại'}), 400
        
        # Create new student
        student = User(
            username=data['username'],
            role='student',
            full_name=data['full_name'],
            student_id=data['student_id'],
            class_name=data.get('class_name'),
            school=data.get('school')
        )
        student.set_password(data['password'])
        
        db.session.add(student)
        db.session.commit()
        
        return jsonify({
            'message': 'Tạo sinh viên thành công',
            'student': student.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/admin/students/<int:student_id>', methods=['PUT'])
@require_admin
def update_student(student_id):
    try:
        student = User.query.filter_by(id=student_id, role='student').first()
        if not student:
            return jsonify({'error': 'Sinh viên không tồn tại'}), 404
        
        data = request.get_json()
        
        # Check if new username or student_id conflicts with existing users
        if data.get('username') and data['username'] != student.username:
            existing = User.query.filter_by(username=data['username']).first()
            if existing:
                return jsonify({'error': 'Username đã tồn tại'}), 400
            student.username = data['username']
        
        if data.get('student_id') and data['student_id'] != student.student_id:
            existing = User.query.filter_by(student_id=data['student_id']).first()
            if existing:
                return jsonify({'error': 'Mã sinh viên đã tồn tại'}), 400
            student.student_id = data['student_id']
        
        # Update other fields
        if data.get('full_name'):
            student.full_name = data['full_name']
        if data.get('class_name'):
            student.class_name = data['class_name']
        if data.get('school'):
            student.school = data['school']
        if data.get('password'):
            student.set_password(data['password'])
        
        student.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Cập nhật sinh viên thành công',
            'student': student.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/admin/students/<int:student_id>', methods=['DELETE'])
@require_admin
def delete_student(student_id):
    try:
        student = User.query.filter_by(id=student_id, role='student').first()
        if not student:
            return jsonify({'error': 'Sinh viên không tồn tại'}), 404
        
        db.session.delete(student)
        db.session.commit()
        
        return jsonify({'message': 'Xóa sinh viên thành công'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/admin/attendance', methods=['GET'])
@require_admin
def get_attendance_records():
    try:
        # Get query parameters for filtering
        student_id = request.args.get('student_id')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        query = Attendance.query.join(User)
        
        if student_id:
            query = query.filter(User.student_id == student_id)
        
        if date_from:
            try:
                date_from_obj = datetime.fromisoformat(date_from)
                query = query.filter(Attendance.check_in_time >= date_from_obj)
            except ValueError:
                return jsonify({'error': 'Định dạng date_from không hợp lệ'}), 400
        
        if date_to:
            try:
                date_to_obj = datetime.fromisoformat(date_to)
                query = query.filter(Attendance.check_in_time <= date_to_obj)
            except ValueError:
                return jsonify({'error': 'Định dạng date_to không hợp lệ'}), 400
        
        attendance_records = query.order_by(Attendance.check_in_time.desc()).all()
        
        return jsonify({
            'attendance_records': [record.to_dict() for record in attendance_records]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


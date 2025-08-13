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

@admin_bp.route('/admin/teachers', methods=['GET', 'POST'])
@require_admin
def manage_teachers():
    if request.method == 'GET':
        try:
            teachers = User.query.filter_by(role='teacher').all()
            return jsonify({
                'teachers': [teacher.to_dict() for teacher in teachers]
            }), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    elif request.method == 'POST':
        try:
            data = request.get_json()
            
            # Validate required fields
            required_fields = ['username', 'password', 'full_name']
            for field in required_fields:
                if not data.get(field):
                    return jsonify({'error': f'{field} là bắt buộc'}), 400
            
            # Check if username already exists
            existing_user = User.query.filter_by(username=data['username']).first()
            if existing_user:
                return jsonify({'error': 'Username đã tồn tại'}), 400
            
            # Create new teacher
            teacher = User(
                username=data['username'],
                role='teacher',
                full_name=data['full_name'],
                class_name=data.get('class_name'),
                school=data.get('school')
            )
            teacher.set_password(data['password'])
            
            db.session.add(teacher)
            db.session.commit()
            
            return jsonify({
                'message': 'Tạo giáo viên thành công',
                'teacher': teacher.to_dict()
            }), 201
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

@admin_bp.route('/admin/teachers/<int:teacher_id>', methods=['PUT', 'DELETE'])
@require_admin  
def manage_teacher(teacher_id):
    if request.method == 'PUT':
        try:
            teacher = User.query.filter_by(id=teacher_id, role='teacher').first()
            if not teacher:
                return jsonify({'error': 'Giáo viên không tồn tại'}), 404
            
            data = request.get_json()
            
            # Check if new username conflicts with existing users
            if data.get('username') and data['username'] != teacher.username:
                existing = User.query.filter_by(username=data['username']).first()
                if existing:
                    return jsonify({'error': 'Username đã tồn tại'}), 400
                teacher.username = data['username']
            
            # Update other fields
            if data.get('full_name'):
                teacher.full_name = data['full_name']
            if data.get('class_name'):
                teacher.class_name = data['class_name']
            if data.get('school'):
                teacher.school = data['school']
            if data.get('password'):
                teacher.set_password(data['password'])
            
            teacher.updated_at = datetime.utcnow()
            db.session.commit()
            
            return jsonify({
                'message': 'Cập nhật giáo viên thành công',
                'teacher': teacher.to_dict()
            }), 200
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    
    elif request.method == 'DELETE':
        try:
            teacher = User.query.filter_by(id=teacher_id, role='teacher').first()
            if not teacher:
                return jsonify({'error': 'Giáo viên không tồn tại'}), 404
            
            db.session.delete(teacher)
            db.session.commit()
            
            return jsonify({'message': 'Xóa giáo viên thành công'}), 200
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

@admin_bp.route('/admin/admins', methods=['GET', 'POST'])
@require_admin
def manage_admins():
    if request.method == 'GET':
        try:
            admins = User.query.filter_by(role='admin').all()
            return jsonify({
                'admins': [admin.to_dict() for admin in admins]
            }), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    elif request.method == 'POST':
        try:
            data = request.get_json()
            
            # Validate required fields
            required_fields = ['username', 'password', 'full_name']
            for field in required_fields:
                if not data.get(field):
                    return jsonify({'error': f'{field} là bắt buộc'}), 400
            
            # Check if username already exists
            existing_user = User.query.filter_by(username=data['username']).first()
            if existing_user:
                return jsonify({'error': 'Username đã tồn tại'}), 400
            
            # Create new admin
            admin = User(
                username=data['username'],
                role='admin',
                full_name=data['full_name'],
                school=data.get('school')
            )
            admin.set_password(data['password'])
            
            db.session.add(admin)
            db.session.commit()
            
            return jsonify({
                'message': 'Tạo admin thành công',
                'admin': admin.to_dict()
            }), 201
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

@admin_bp.route('/admin/admins/<int:admin_id>', methods=['PUT', 'DELETE'])
@require_admin  
def manage_admin(admin_id):
    if request.method == 'PUT':
        try:
            admin = User.query.filter_by(id=admin_id, role='admin').first()
            if not admin:
                return jsonify({'error': 'Admin không tồn tại'}), 404
            
            data = request.get_json()
            
            # Check if new username conflicts with existing users
            if data.get('username') and data['username'] != admin.username:
                existing = User.query.filter_by(username=data['username']).first()
                if existing:
                    return jsonify({'error': 'Username đã tồn tại'}), 400
                admin.username = data['username']
            
            # Update other fields
            if data.get('full_name'):
                admin.full_name = data['full_name']
            if data.get('school'):
                admin.school = data['school']
            if data.get('password'):
                admin.set_password(data['password'])
            
            admin.updated_at = datetime.utcnow()
            db.session.commit()
            
            return jsonify({
                'message': 'Cập nhật admin thành công',
                'admin': admin.to_dict()
            }), 200
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    
    elif request.method == 'DELETE':
        try:
            admin = User.query.filter_by(id=admin_id, role='admin').first()
            if not admin:
                return jsonify({'error': 'Admin không tồn tại'}), 404
            
            db.session.delete(admin)
            db.session.commit()
            
            return jsonify({'message': 'Xóa admin thành công'}), 200
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

@admin_bp.route('/admin/dashboard/stats', methods=['GET'])
@require_admin
def get_dashboard_stats():
    """Lấy thống kê cho dashboard"""
    try:
        total_students = User.query.filter_by(role='student').count()
        total_teachers = User.query.filter_by(role='teacher').count()
        total_attendance_today = Attendance.query.filter(
            Attendance.check_in_time >= datetime.now().date()
        ).count()
        
        return jsonify({
            'total_students': total_students,
            'total_teachers': total_teachers,
            'total_attendance_today': total_attendance_today,
            'attendance_rate': total_attendance_today / total_students * 100 if total_students > 0 else 0
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/admin/students/<int:student_id>/upload-image', methods=['POST'])
@require_admin
def upload_student_image(student_id):
    """Upload ảnh cho học sinh (dành cho admin)"""
    try:
        student = User.query.filter_by(id=student_id, role='student').first()
        if not student:
            return jsonify({'error': 'Sinh viên không tồn tại'}), 404
        
        data = request.get_json()
        base64_image = data.get('image')
        if not base64_image:
            return jsonify({'error': 'Thiếu dữ liệu ảnh'}), 400
        
        # Import face recognizer
        from src.utils.face_recognition import face_recognizer
        from src.models.user import FaceData
        import os
        import uuid
        import base64
        import pickle
        
        # Use optimized encoding function
        try:
            face_encoding, face_coordinates = face_recognizer.encode_face_for_registration(base64_image)
        except ValueError as e:
            return jsonify({'error': str(e)}), 400
        
        # Decode and save image file
        try:
            # Remove data:image/jpeg;base64, prefix if present
            if ',' in base64_image:
                image_data_clean = base64_image.split(',')[1]
            else:
                image_data_clean = base64_image
            
            image_bytes = base64.b64decode(image_data_clean)
        except Exception as e:
            return jsonify({'error': 'Dữ liệu ảnh không hợp lệ'}), 400
        
        # Create uploads directory if it doesn't exist
        upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'uploads', 'faces')
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate unique filename
        filename = f"{student_id}_{uuid.uuid4().hex}.jpg"
        image_path = os.path.join(upload_dir, filename)
        
        # Save image file
        with open(image_path, 'wb') as f:
            f.write(image_bytes)
        
        # Serialize face encoding
        face_encoding_blob = pickle.dumps(face_encoding)
        
        # Save face data to database
        face_data = FaceData(
            user_id=student_id,
            face_encoding=face_encoding_blob,
            image_path=image_path
        )
        
        db.session.add(face_data)
        db.session.commit()
        
        return jsonify({'message': 'Upload ảnh thành công'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
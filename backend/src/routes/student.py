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
def get_attendance():
    try:
        user_id = session.get('user_id')
        
        # Get query parameters for filtering
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        query = Attendance.query.filter_by(user_id=user_id)
        
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


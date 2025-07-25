from flask import Blueprint, request, jsonify, session
from src.models.user import db, User, FaceData, Attendance
from src.routes.auth import require_auth
from src.utils.face_recognition import face_recognizer
import os
import uuid
from datetime import datetime
import base64

face_bp = Blueprint('face', __name__)

@face_bp.route('/face/upload', methods=['POST'])
@require_auth
def upload_face():
    try:
        user_id = session.get('user_id')
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User không tồn tại'}), 404
        
        # Get image data from request
        data = request.get_json()
        image_data = data.get('image')
        
        if not image_data:
            return jsonify({'error': 'Không có dữ liệu ảnh'}), 400
        
        try:
            # Extract face features using our face recognition service
            face_encoding = face_recognizer.encode_face(image_data)
        except ValueError as e:
            return jsonify({'error': str(e)}), 400
        
        # Decode base64 image for saving
        try:
            # Remove data:image/jpeg;base64, prefix if present
            if ',' in image_data:
                image_data_clean = image_data.split(',')[1]
            else:
                image_data_clean = image_data
            
            image_bytes = base64.b64decode(image_data_clean)
        except Exception as e:
            return jsonify({'error': 'Dữ liệu ảnh không hợp lệ'}), 400
        
        # Create uploads directory if it doesn't exist
        upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'uploads', 'faces')
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate unique filename
        filename = f"{user_id}_{uuid.uuid4().hex}.jpg"
        image_path = os.path.join(upload_dir, filename)
        
        # Save image file
        with open(image_path, 'wb') as f:
            f.write(image_bytes)
        
        # Save face data to database
        face_data = FaceData(
            user_id=user_id,
            face_encoding=face_encoding,
            image_path=image_path
        )
        
        db.session.add(face_data)
        db.session.commit()
        
        return jsonify({
            'message': 'Upload khuôn mặt thành công',
            'face_data': face_data.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@face_bp.route('/face/recognize', methods=['POST'])
@require_auth
def recognize_face():
    try:
        user_id = session.get('user_id')
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User không tồn tại'}), 404
        
        # Get image data from request
        data = request.get_json()
        image_data = data.get('image')
        
        if not image_data:
            return jsonify({'error': 'Không có dữ liệu ảnh'}), 400
        
        # Check if user has face data registered
        user_face_data = FaceData.query.filter_by(user_id=user_id).all()
        
        if len(user_face_data) == 0:
            return jsonify({'error': 'Chưa đăng ký khuôn mặt. Vui lòng đăng ký trước khi điểm danh.'}), 400
        
        try:
            # Get known encodings for this user
            known_encodings = [face.face_encoding for face in user_face_data]
            
            # Perform face recognition
            match_index, confidence_score = face_recognizer.recognize_face(
                image_data, known_encodings, threshold=0.5
            )
            
            if match_index is not None:
                # Face recognized successfully
                attendance = Attendance(
                    user_id=user_id,
                    status='present',
                    confidence_score=confidence_score
                )
                
                db.session.add(attendance)
                db.session.commit()
                
                return jsonify({
                    'message': 'Điểm danh thành công',
                    'attendance': attendance.to_dict(),
                    'confidence_score': confidence_score
                }), 201
            else:
                return jsonify({
                    'error': f'Không nhận diện được khuôn mặt. Độ tin cậy: {confidence_score:.2f}. Vui lòng thử lại.'
                }), 400
                
        except ValueError as e:
            return jsonify({'error': str(e)}), 400
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@face_bp.route('/face/test-recognition', methods=['POST'])
def test_recognition():
    """Test endpoint for face recognition without authentication (for testing purposes)"""
    try:
        data = request.get_json()
        image_data = data.get('image')
        
        if not image_data:
            return jsonify({'error': 'Không có dữ liệu ảnh'}), 400
        
        try:
            # Test face detection
            image = face_recognizer.decode_base64_image(image_data)
            faces = face_recognizer.detect_faces(image)
            
            if len(faces) == 0:
                return jsonify({
                    'message': 'Không phát hiện khuôn mặt nào',
                    'detected_faces': 0,
                    'confidence_score': 0.0
                }), 200
            elif len(faces) > 1:
                return jsonify({
                    'message': f'Phát hiện {len(faces)} khuôn mặt. Vui lòng đảm bảo chỉ có một khuôn mặt.',
                    'detected_faces': len(faces),
                    'confidence_score': 0.0
                }), 200
            else:
                # Try to extract features
                features = face_recognizer.extract_face_features(image)
                
                return jsonify({
                    'message': 'Test nhận diện thành công',
                    'detected_faces': 1,
                    'confidence_score': 0.95
                }), 200
                
        except ValueError as e:
            return jsonify({'error': str(e)}), 400
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


from flask import Blueprint, request, jsonify, session
from src.models.user import db, User, FaceData, Attendance
from src.routes.auth import require_auth
from src.utils.face_recognition import face_recognizer
import os
import uuid
from datetime import datetime
import base64
import pickle

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
def recognize_face():
    try:
        data = request.get_json()
        image_data = data.get('image')
        
        if not image_data:
            return jsonify({'error': 'Không có dữ liệu ảnh'}), 400
        
        # Validate image quality first
        try:
            image = face_recognizer.decode_base64_image(image_data)
            if not face_recognizer._validate_image_quality(image):
                return jsonify({
                    'error': 'Chất lượng ảnh không đủ tốt. Vui lòng chụp ảnh trong điều kiện ánh sáng tốt và giữ camera ổn định.'
                }), 400
        except:
            pass
        
        # Lấy TẤT CẢ dữ liệu khuôn mặt từ database
        all_face_data = FaceData.query.all()
        
        if len(all_face_data) == 0:
            return jsonify({'error': 'Không có dữ liệu khuôn mặt nào trong hệ thống.'}), 400
        
        try:
            # Tạo danh sách tất cả encodings và user_ids tương ứng
            known_encodings = []
            user_ids = []
            
            for face_data in all_face_data:
                known_encodings.append(face_data.face_encoding)
                user_ids.append(face_data.user_id)
            
            # Thực hiện nhận diện với tất cả khuôn mặt
            match_index, confidence_score = face_recognizer.recognize_face_advanced(
                image_data, known_encodings, threshold=0.65
            )
            
            if match_index is not None:
                # Lấy user_id của người được nhận diện
                matched_user_id = user_ids[match_index]
                user = User.query.get(matched_user_id)
                
                if not user:
                    return jsonify({'error': 'User không tồn tại'}), 404
                
                # Kiểm tra điểm danh trùng lặp (cùng ngày)
                today = datetime.now().date()
                existing_attendance = Attendance.query.filter(
                    Attendance.user_id == matched_user_id,
                    Attendance.check_in_time >= today
                ).first()
                
                if existing_attendance:
                    return jsonify({
                        'error': f'{user.full_name} đã điểm danh hôm nay rồi.',
                        'existing_attendance': existing_attendance.to_dict(),
                        'user_name': user.full_name
                    }), 400
                
                # Tạo bản ghi điểm danh thành công
                attendance = Attendance(
                    user_id=matched_user_id,
                    status='present',
                    confidence_score=confidence_score
                )
                
                db.session.add(attendance)
                db.session.commit()
                
                return jsonify({
                    'message': 'Điểm danh thành công',
                    'attendance': attendance.to_dict(),
                    'confidence_score': confidence_score,
                    'user_name': user.full_name,
                    'user_id': matched_user_id
                }), 201
            else:
                return jsonify({
                    'error': f'Không nhận diện được khuôn mặt. Độ tin cậy: {confidence_score:.2f}. Người này có thể chưa đăng ký khuôn mặt.',
                    'suggestion': 'Hãy đảm bảo khuôn mặt được chiếu sáng đều và nhìn thẳng vào camera.'
                }), 400
                
        except ValueError as e:
            return jsonify({'error': str(e)}), 400
            
    except Exception as e:
        return jsonify({'error': f'Lỗi hệ thống: {str(e)}'}), 500

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

@face_bp.route('/face/debug-recognition', methods=['POST'])
@require_auth
def debug_recognition():
    """Debug endpoint for detailed face recognition analysis"""
    try:
        user_id = session.get('user_id')
        data = request.get_json()
        image_data = data.get('image')
        
        if not image_data:
            return jsonify({'error': 'Không có dữ liệu ảnh'}), 400
        
        # Get user's face data
        user_face_data = FaceData.query.filter_by(user_id=user_id).all()
        
        if len(user_face_data) == 0:
            return jsonify({'error': 'Chưa đăng ký khuôn mặt'}), 400
        
        # Debug information
        debug_info = {
            'registered_faces': len(user_face_data),
            'scores': [],
            'best_score': 0.0,
            'threshold_used': 0.4
        }
        
        try:
            # Get known encodings
            known_encodings = [face.face_encoding for face in user_face_data]
            
            # Extract features from test image
            test_encoding = face_recognizer.encode_face_advanced(image_data)
            
            # Compare with each registered face
            for i, known_encoding in enumerate(known_encodings):
                score = face_recognizer.compare_faces_advanced(test_encoding, known_encoding)
                debug_info['scores'].append({
                    'face_index': i,
                    'similarity_score': round(score, 4)
                })
                
                if score > debug_info['best_score']:
                    debug_info['best_score'] = score
            
            # Recognition result
            match_index, confidence = face_recognizer.recognize_face_advanced(
                image_data, known_encodings, threshold=0.4
            )
            
            debug_info['recognition_result'] = {
                'match_found': match_index is not None,
                'match_index': match_index,
                'confidence': round(confidence, 4),
                'above_threshold': confidence >= 0.4
            }
            
            return jsonify(debug_info), 200
            
        except Exception as e:
            debug_info['error'] = str(e)
            return jsonify(debug_info), 400
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@face_bp.route('/face/validate-image', methods=['POST'])
@require_auth
def validate_image():
    """Validate if image contains a detectable face"""
    try:
        data = request.get_json()
        image_data = data.get('image')
        
        if not image_data:
            return jsonify({'error': 'Không có dữ liệu ảnh'}), 400
        
        try:
            # Try to encode face - if successful, face is detected
            face_encoding = face_recognizer.encode_face(image_data)
            
            return jsonify({
                'message': 'Ảnh hợp lệ - Đã phát hiện khuôn mặt',
                'face_detected': True
            }), 200
            
        except ValueError as e:
            return jsonify({
                'error': str(e),
                'face_detected': False
            }), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@face_bp.route('/face/upload-for-registration', methods=['POST'])
@require_auth
def upload_face_for_registration():
    """Fast face upload for student registration"""
    try:
        data = request.get_json()
        base64_image = data.get('image')
        
        if not base64_image:
            return jsonify({'error': 'Thiếu dữ liệu ảnh'}), 400
        
        user_id = session.get('user_id')
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User không tồn tại'}), 404
        
        # Use optimized encoding function
        try:
            face_encoding = face_recognizer.encode_face_for_registration(base64_image)
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
        import uuid
        upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'uploads', 'faces')
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate unique filename
        filename = f"{user_id}_{uuid.uuid4().hex}.jpg"
        image_path = os.path.join(upload_dir, filename)
        
        # Save image file
        with open(image_path, 'wb') as f:
            f.write(image_bytes)
        
        # Serialize encoding
        encoding_bytes = pickle.dumps(face_encoding)
        
        # Save to database with image_path
        face_data = FaceData(
            user_id=user_id,
            face_encoding=encoding_bytes,
            image_path=image_path
        )
        
        db.session.add(face_data)
        db.session.commit()
        
        return jsonify({'message': 'Upload ảnh thành công'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi server: {str(e)}'}), 500


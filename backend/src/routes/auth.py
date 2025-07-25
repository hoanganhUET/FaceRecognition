from flask import Blueprint, request, jsonify, session
from src.models.user import db, User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'error': 'Username và password là bắt buộc'}), 400
        
        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password):
            session['user_id'] = user.id
            session['user_role'] = user.role
            return jsonify({
                'message': 'Đăng nhập thành công',
                'user': user.to_dict()
            }), 200
        else:
            return jsonify({'error': 'Username hoặc password không đúng'}), 401
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/auth/logout', methods=['POST'])
def logout():
    try:
        session.clear()
        return jsonify({'message': 'Đăng xuất thành công'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/auth/me', methods=['GET'])
def get_current_user():
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Chưa đăng nhập'}), 401
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User không tồn tại'}), 404
        
        return jsonify({'user': user.to_dict()}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def require_auth(f):
    """Decorator để yêu cầu authentication"""
    def decorated_function(*args, **kwargs):
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Yêu cầu đăng nhập'}), 401
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

def require_admin(f):
    """Decorator để yêu cầu quyền admin"""
    def decorated_function(*args, **kwargs):
        user_id = session.get('user_id')
        user_role = session.get('user_role')
        if not user_id:
            return jsonify({'error': 'Yêu cầu đăng nhập'}), 401
        if user_role != 'admin':
            return jsonify({'error': 'Yêu cầu quyền admin'}), 403
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function


from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='student')  # admin or student
    full_name = db.Column(db.String(100), nullable=False)
    student_id = db.Column(db.String(20), unique=True, nullable=True)  # Only for students
    class_name = db.Column(db.String(50), nullable=True)  # Only for students
    school = db.Column(db.String(100), nullable=True)  # Only for students
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    face_data = db.relationship('FaceData', backref='user', lazy=True, cascade='all, delete-orphan')
    attendance_records = db.relationship('Attendance', 
                                        foreign_keys='Attendance.user_id',
                                        backref='user', 
                                        lazy=True, 
                                        cascade='all, delete-orphan')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<User {self.username}>'

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'role': self.role,
            'full_name': self.full_name,
            'student_id': self.student_id,
            'class_name': self.class_name,
            'school': self.school,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class FaceData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    face_encoding = db.Column(db.LargeBinary, nullable=False)  # Encoded face features
    image_path = db.Column(db.String(255), nullable=False)  # Path to face image
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<FaceData {self.id} for User {self.user_id}>'

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'image_path': self.image_path,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Attendance(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    check_in_time = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), nullable=False, default='present')  # present, absent, pending
    confidence_score = db.Column(db.Float, nullable=True)  # Face recognition confidence
    note = db.Column(db.Text, nullable=True)  # Student's explanation text
    excuse_reason = db.Column(db.Text, nullable=True)  # Student's excuse reason
    teacher_approval = db.Column(db.String(20), nullable=True)  # approved, rejected, pending
    teacher_comment = db.Column(db.Text, nullable=True)  # Teacher's comment
    approved_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)  # Teacher who approved
    approved_at = db.Column(db.DateTime, nullable=True)  # When approved
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship for approved_by
    approved_by_teacher = db.relationship('User', foreign_keys=[approved_by], remote_side='User.id')

    def __repr__(self):
        return f'<Attendance {self.id} for User {self.user_id}>'

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_name': self.user.full_name if self.user else None,
            'student_id': self.user.student_id if self.user else None,
            'check_in_time': self.check_in_time.isoformat() if self.check_in_time else None,
            'status': self.status,
            'confidence_score': self.confidence_score,
            'note': self.note,
            'excuse_reason': self.excuse_reason,
            'teacher_approval': self.teacher_approval,
            'teacher_comment': self.teacher_comment,
            'approved_by': self.approved_by,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


#!/usr/bin/env python3
"""
Migration script để cập nhật schema của bảng Attendance
Thêm các trường mới cho chức năng biểu mẫu minh chứng
"""

import os
import sys
from sqlalchemy import create_engine, text
from src.models.user import db, User, Attendance

def migrate_attendance_table():
    """Thêm các cột mới vào bảng attendance"""
    
    # Database URL - có thể cần điều chỉnh
    db_path = os.path.join(os.path.dirname(__file__), 'src', 'database', 'app.db')
    database_url = f'sqlite:///{db_path}'
    
    engine = create_engine(database_url)
    
    with engine.connect() as conn:
        try:
            # Kiểm tra xem các cột đã tồn tại chưa
            result = conn.execute(text("PRAGMA table_info(attendance)"))
            columns = [row[1] for row in result.fetchall()]
            
            # Danh sách các cột mới cần thêm
            new_columns = [
                ('note', 'TEXT'),
                ('excuse_reason', 'TEXT'),
                ('teacher_approval', 'VARCHAR(20)'),
                ('teacher_comment', 'TEXT'),
                ('approved_by', 'INTEGER'),
                ('approved_at', 'DATETIME')
            ]
            
            # Thêm từng cột nếu chưa tồn tại
            for column_name, column_type in new_columns:
                if column_name not in columns:
                    sql = f"ALTER TABLE attendance ADD COLUMN {column_name} {column_type}"
                    conn.execute(text(sql))
                    print(f"✓ Đã thêm cột: {column_name}")
                else:
                    print(f"- Cột đã tồn tại: {column_name}")
            
            # Commit changes
            conn.commit()
            print("\n✅ Migration hoàn thành!")
            
        except Exception as e:
            print(f"❌ Lỗi khi migration: {e}")
            conn.rollback()
            raise

if __name__ == "__main__":
    print("🔄 Bắt đầu migration schema cho bảng Attendance...")
    migrate_attendance_table()

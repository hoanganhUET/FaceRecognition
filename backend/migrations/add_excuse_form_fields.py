#!/usr/bin/env python3
"""
Migration script to add excuse form fields to Attendance table
Run this script to update the database schema for the new excuse form feature
"""

import sqlite3
import os
from datetime import datetime

def migrate_database():
    """Add new columns to Attendance table for excuse form functionality"""
    
    # Database path
    db_path = os.path.join(os.path.dirname(__file__), '..', 'src', 'database', 'app.db')
    
    if not os.path.exists(db_path):
        print(f"Database file not found at {db_path}")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("Starting database migration...")
        
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(attendance)")
        columns = [column[1] for column in cursor.fetchall()]
        
        new_columns = [
            ('note', 'TEXT'),
            ('excuse_reason', 'TEXT'),
            ('teacher_approval', 'VARCHAR(20)'),
            ('teacher_comment', 'TEXT'),
            ('approved_by', 'INTEGER'),
            ('approved_at', 'DATETIME')
        ]
        
        for column_name, column_type in new_columns:
            if column_name not in columns:
                print(f"Adding column {column_name}...")
                cursor.execute(f"ALTER TABLE attendance ADD COLUMN {column_name} {column_type}")
            else:
                print(f"Column {column_name} already exists, skipping...")
        
        # Create foreign key constraint for approved_by (if not exists)
        # Note: SQLite doesn't support adding foreign key constraints to existing tables
        # This would need to be handled differently in a production environment
        
        conn.commit()
        print("Migration completed successfully!")
        
        # Verify the migration
        cursor.execute("PRAGMA table_info(attendance)")
        final_columns = [column[1] for column in cursor.fetchall()]
        print(f"Final table columns: {final_columns}")
        
        return True
        
    except Exception as e:
        print(f"Error during migration: {str(e)}")
        if conn:
            conn.rollback()
        return False
        
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    success = migrate_database()
    if success:
        print("Database migration completed successfully!")
    else:
        print("Database migration failed!")
        exit(1)

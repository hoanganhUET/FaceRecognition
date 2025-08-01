import React from 'react';

function AdminNavigation({ onCreateAccount, onManageStudents, onManageTeachers }) {
  return (
    <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
      <button
        style={{
          padding: '10px 20px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
        onClick={onCreateAccount}
      >
        Tạo tài khoản mới
      </button>
      <button
        style={{
          padding: '10px 20px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
        onClick={onManageStudents}
      >
        Quản lý học sinh
      </button>
      <button
        style={{
          padding: '10px 20px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
        onClick={onManageTeachers}
      >
        Quản lý giáo viên
      </button>
    </div>
  );
}

export default AdminNavigation;
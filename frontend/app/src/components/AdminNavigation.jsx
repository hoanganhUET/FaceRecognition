import React from 'react';

function AdminNavigation({ onCreateAccount, onManageStudents, onManageTeachers }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center', // Căn giữa theo chiều ngang
        alignItems: 'center', // Căn giữa theo chiều dọc
        height: '75vh', // Chiều cao toàn màn hình
        maxHeight: '75vh',
        maxWidth:'100%',
        minWidth:'100%',
        gap: '5px', // Khoảng cách giữa các cặp logo-nút
        flexWrap: 'nowrap', // Ngăn cột tràn xuống dòng
        overflow: 'hidden',
      }}
    >
      {/* Cặp 1: Logo và nút Tạo tài khoản */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column', // Sắp xếp logo và nút theo cột
          alignItems: 'center', // Căn giữa trong cột
          gap: '30px', // Khoảng cách giữa logo và nút
        }}
      >
        <img
          src="/add_user.png"
          alt="Logo 1"
          style={{ width: '40%', height: '40%' }}
        />
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
      </div>

      {/* Cặp 2: Logo và nút Quản lý học sinh */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '30px',
        }}
      >
        <img
          src="/student.png"
          alt="Logo 2"
          style={{ width: '40%', height: '40%' }}
        />
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
      </div>

      {/* Cặp 3: Logo và nút Quản lý giáo viên */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '30px',
        }}
      >
        <img
          src="/teacher.png"
          alt="Logo 3"
          style={{ width: '40%', height: '40%' }}
        />
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
    </div>
  );
}

export default AdminNavigation;
import React from 'react';
import { useNavigate } from 'react-router-dom';

function LogoutComponent() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Xóa thông tin người dùng khỏi localStorage nếu có
        localStorage.removeItem('userInfo');
        
        // Chuyển hướng về trang đăng nhập
        navigate('/');
        
        alert('Đăng xuất thành công!');
      } else {
        console.error('Logout failed');
        alert('Đăng xuất thất bại!');
      }
    } catch (error) {
      console.error('Error during logout:', error);
      alert('Lỗi khi đăng xuất!');
    }
  };

  return (
    <button
      onClick={handleLogout}
      style={{
        padding: '10px 20px',
        backgroundColor: '#f44336',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px'
      }}
    >
      Đăng xuất
    </button>
  );
}

export default LogoutComponent;
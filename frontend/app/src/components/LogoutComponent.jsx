import React from 'react';

function LogoutComponent({ onLogout }) {
  const handleLogout = async () => {
    // Hiển thị hộp thoại xác nhận
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      try {
        // Gọi API backend để đăng xuất
        const response = await fetch('/logout', {
          method: 'POST',
          credentials: 'include', // Bao gồm cookie nếu cần
        });
        if (response.ok) {
          onLogout(); // Gọi hàm onLogout từ props sau khi backend xử lý thành công
        } else {
          console.error('Đăng xuất thất bại:', response.statusText);
          alert('Đăng xuất không thành công. Vui lòng thử lại!');
        }
      } catch (error) {
        console.error('Lỗi khi gọi API đăng xuất:', error);
        alert('Có lỗi xảy ra khi đăng xuất. Vui lòng thử lại!');
      }
    }
  };

  return (
    <button
      style={{
        padding: '10px 20px',
        backgroundColor: '#CC0000',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        marginTop: '10px',
      }}
      onClick={handleLogout}
    >
      Đăng xuất
    </button>
  );
}

export default LogoutComponent;
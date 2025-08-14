import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function LoginComponent() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        const role = data.user.role;
        switch (role) {
          case 'admin':
            navigate('/admin');
            break;
          case 'student':
            navigate('/student');
            break;
          case 'teacher':
            navigate('/teacher');
            break;
          default:
            alert('Vai trò không hợp lệ');
        }
      } else {
        alert(`Lỗi: ${data.error}`);
      }
    } catch (error) {
      console.error('Lỗi kết nối:', error);
      alert('Lỗi kết nối server');
    }
  };

  return (
    <div
      id="loginSection"
      style={{
        position: 'absolute',
        top: '20px',
        right: '100px',
      }}
    >
      <div 
        id="loginTitle" 
        style={{ fontSize: '50px', fontWeight: 'bold', color: '#333', marginBottom: '10px', marginLeft: '95px', }}
      >
        Đăng nhập
      </div>
      <input
        type="text"
        id="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{ width: '200px', padding: '10px', marginBottom: '10px', fontSize: '16px', border: '1px solid #ccc',borderRadius: '4px' }}
        placeholder="Tên đăng nhập"
      />
      <input
        type="password"
        id="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: '200px', padding: '10px', fontSize: '16px', border: '1px solid #ccc', marginLeft: '3px', borderRadius: '4px' }}
        placeholder="Mật khẩu"
      />
      <button
        style={{ padding: '8px 10px', fontSize: '16px', marginTop: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', marginLeft: '15px', borderRadius: '4px', cursor: 'pointer' }}
        onClick={handleLogin}
      >
        Đăng nhập
      </button>
    </div>
  );
}

export default LoginComponent;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function LoginComponent() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  // Dữ liệu giả để mô phỏng người dùng
  const mockUsers = [
    { username: 'admin', password: 'admin123', role: 'admin' },
    { username: 'student', password: 'student123', role: 'student' },
    { username: 'teacher', password: 'teacher123', role: 'teacher' },
  ];
/*
  useEffect(() => {
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    if (usernameInput && passwordInput) {
      usernameInput.addEventListener('input', (e) => setUsername(e.target.value));
      passwordInput.addEventListener('input', (e) => setPassword(e.target.value));
    }

    return () => {
      if (usernameInput) usernameInput.removeEventListener('input', (e) => setUsername(e.target.value));
      if (passwordInput) passwordInput.removeEventListener('input', (e) => setPassword(e.target.value));
    };
  }, []);
  const handleLogin = async () => {    //button -> backend
  try {
    const response = await fetch('URL_BACKEND', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await response.json();
    console.log('Phản hồi từ server:', data);
  } catch (error) {
    console.error('Lỗi gửi dữ liệu:', error);
  }
    if (response.ok) {
      const role = data.role; // Giả sử backend trả về { role: 'admin' | 'student' | 'teacher' }
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
      }
};*/
const handleLogin = () => {
    const user = mockUsers.find(
      (u) => u.username === username && u.password === password
    );

    if (user) {
      switch (user.role) {
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
      alert('Tên đăng nhập hoặc mật khẩu không đúng');
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
        style={{ fontSize: '45px', fontWeight: 'bold', color: '#333', marginBottom: '10px', marginLeft: '95px', }}
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
import React, { useState, useEffect } from 'react';

function CreateAccount({ onClose }) {
  const [role, setRole] = useState('');
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    setRole(''); // Reset khi component mount
    setImageFile(null);
  }, []);

  const handleSubmit = () => {
    const name = document.querySelector('input[name="name"]').value;
    const className = document.querySelector('input[name="class"]').value;
    if (!name || (role === 'student' && !className)) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }
    console.log('Dữ liệu tạo tài khoản:', { name, role, class: className, image: imageFile ? imageFile.name : 'No image' });
    alert('Tài khoản đã được tạo (mô phỏng)!');
    onClose(); // Đóng section
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '5px', backgroundColor: '#f9f9f9', maxWidth: '400px' }}>
      <h2>Tạo tài khoản mới</h2>
      <form>
        <div style={{ marginBottom: '10px' }}>
          <label>Họ tên: </label>
          <input type="text" name="name" style={{ padding: '5px', marginLeft: '10px' }} />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Chức vụ: </label>
          <select
            style={{ padding: '5px', marginLeft: '10px' }}
            onChange={(e) => setRole(e.target.value)}
            value={role}
          >
            <option value="">Chọn chức vụ</option>
            <option value="admin">Quản trị viên</option>
            <option value="teacher">Giáo viên</option>
            <option value="student">Học sinh</option>
          </select>
        </div>
        {(role === 'student' || role === 'teacher') && (
          <div style={{ marginBottom: '10px' }}>
            <label>Lớp: </label>
            <input type="text" name="class" style={{ padding: '5px', marginLeft: '10px' }} />
          </div>
        )}
        {role === 'student' && (
          <div style={{ marginBottom: '10px' }}>
            <label>Thêm ảnh: </label>
            <input type="file" style={{ marginLeft: '10px' }} onChange={(e) => setImageFile(e.target.files[0])} />
          </div>
        )}
        <button
          type="button"
          style={{
            padding: '5px 10px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
          onClick={handleSubmit}
        >
          Tạo
        </button>
      </form>
    </div>
  );
}

export default CreateAccount;
import React, { useState, useEffect } from 'react';

function CreateAccount({ onClose }) {
  const [role, setRole] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    class: '',
    studentId: ''
  });

  useEffect(() => {
    setRole('');
    setImageFile(null);
    setFormData({ name: '', class: '', studentId: '' });
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateStudentId = () => {
    // Tạo student ID tự động (có thể thay đổi logic này)
    return 'SV' + Date.now().toString().slice(-6);
  };

  const handleSubmit = async () => {
    const { name, class: className } = formData;
    let { studentId } = formData;
    
    // Validation
    if (!name) {
      alert('Vui lòng nhập họ tên!');
      return;
    }
    
    if (!role) {
      alert('Vui lòng chọn chức vụ!');
      return;
    }
    
    if (role === 'student') {
      if (!className) {
        alert('Vui lòng nhập lớp cho học sinh!');
        return;
      }
      if (!studentId) {
        studentId = generateStudentId();
      }
    }
    
    try {
      const endpoint = role === 'student' 
        ? 'http://localhost:5001/api/admin/students' 
        : 'http://localhost:5001/api/admin/teachers';
      
      const payload = {
        username: name.toLowerCase().replace(/\s+/g, ''),
        password: 'default123',
        full_name: name,
        ...(className && { class_name: className }),
        ...(role === 'student' && { student_id: studentId })
      };
      
      console.log('Sending payload:', payload);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      console.log('Response:', data);
      
      if (response.ok) {
        alert(`Tài khoản ${role} đã được tạo thành công!\nUsername: ${payload.username}\nPassword: default123${role === 'student' ? '\nStudent ID: ' + studentId : ''}`);
        
        // TODO: Xử lý upload ảnh nếu có
        if (imageFile && role === 'student') {
          console.log('File sẽ được upload:', imageFile.name);
          // Có thể thêm logic upload ảnh ở đây sau
        }
        
        onClose();
      } else {
        alert(`Lỗi: ${data.error}`);
      }
    } catch (error) {
      console.error('Network error:', error);
      alert('Lỗi kết nối server. Vui lòng kiểm tra:\n1. Backend có đang chạy?\n2. CORS configuration\n3. Network connection');
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '5px', backgroundColor: '#f9f9f9', maxWidth: '400px' }}>
      <h2>Tạo tài khoản mới</h2>
      <form>
        <div style={{ marginBottom: '10px' }}>
          <label>Họ tên: </label>
          <input 
            type="text" 
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            style={{ padding: '5px', marginLeft: '10px' }} 
          />
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
            <input 
              type="text" 
              value={formData.class}
              onChange={(e) => handleInputChange('class', e.target.value)}
              style={{ padding: '5px', marginLeft: '10px' }} 
            />
          </div>
        )}
        
        {role === 'student' && (
          <>
            <div style={{ marginBottom: '10px' }}>
              <label>Mã sinh viên: </label>
              <input 
                type="text" 
                value={formData.studentId}
                onChange={(e) => handleInputChange('studentId', e.target.value)}
                placeholder="Để trống để tự động tạo"
                style={{ padding: '5px', marginLeft: '10px' }} 
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Thêm ảnh: </label>
              <input 
                type="file" 
                accept="image/*"
                style={{ marginLeft: '10px' }} 
                onChange={(e) => setImageFile(e.target.files[0])} 
              />
            </div>
          </>
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
            marginRight: '10px'
          }}
          onClick={handleSubmit}
        >
          Tạo
        </button>
        
        <button
          type="button"
          style={{
            padding: '5px 10px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
          onClick={onClose}
        >
          Hủy
        </button>
      </form>
    </div>
  );
}

export default CreateAccount;
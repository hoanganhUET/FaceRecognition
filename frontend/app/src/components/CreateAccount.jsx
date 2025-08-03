import React, { useState, useEffect } from 'react';
import CameraCapture from './CameraCapture';

function CreateAccount({ onClose }) {
  const [role, setRole] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isValidatingImage, setIsValidatingImage] = useState(false);
  const [imageValidationResult, setImageValidationResult] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    class: '',
    studentId: '',
    school: ''
  });
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);

  useEffect(() => {
    setRole('');
    setImageFile(null);
    setImagePreview(null);
    setIsValidatingImage(false);
    setImageValidationResult(null);
    setFormData({ name: '', class: '', studentId: '', school: '' });
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateStudentId = () => {
    // Tạo student ID tự động (có thể thay đổi logic này)
    return 'SV' + Date.now().toString().slice(-6);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
    
    // Validate image has face
    await validateImageHasFace(file);
  };

  const validateImageHasFace = async (file, isBase64 = false) => {
    setIsValidatingImage(true);
    setImageValidationResult(null);
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Image = isBase64 ? file : e.target.result;
        
        const response = await fetch('http://localhost:5001/api/face/validate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ image: base64Image })
        });
        
        const result = await response.json();
        
        if (response.ok) {
          setImageValidationResult({
            valid: true,
            message: 'Ảnh hợp lệ - Đã phát hiện khuôn mặt'
          });
        } else {
          setImageValidationResult({
            valid: false,
            message: result.error || 'Ảnh không hợp lệ'
          });
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setImageValidationResult({
        valid: false,
        message: 'Lỗi khi kiểm tra ảnh'
      });
    } finally {
      setIsValidatingImage(false);
    }
  };

  const handleCameraCapture = (imageData) => {
    setCapturedImage(imageData);
    setShowCamera(false);
    // Validate captured image
    validateImageHasFace(imageData, true);
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
      
      // Kiểm tra ảnh cho học sinh
      if (!capturedImage && !imageFile) {
        alert('Vui lòng thêm ảnh cho học sinh!');
        return;
      }
      
      if (imageValidationResult && !imageValidationResult.valid) {
        alert('Ảnh không hợp lệ hoặc không phát hiện được khuôn mặt!');
        return;
      }
    }
    
    try {
      // 1. Tạo tài khoản trước
      const endpoint = role === 'student' 
        ? 'http://localhost:5001/api/admin/students' 
        : 'http://localhost:5001/api/admin/teachers';
      
      const payload = {
        username: name.toLowerCase().replace(/\s+/g, ''),
        password: 'default123',
        full_name: name,
        ...(className && { class_name: className }),
        ...(formData.school && { school: formData.school }),
        ...(role === 'student' && { student_id: studentId })
      };
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // 2. Nếu là học sinh và có ảnh, upload ảnh
        if (role === 'student' && (capturedImage || imageFile)) {
          try {
            // Đăng nhập với tài khoản vừa tạo để upload ảnh
            const loginResponse = await fetch('http://localhost:5001/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                username: payload.username,
                password: payload.password
              })
            });
            
            if (loginResponse.ok) {
              // Upload ảnh
              const imageToUpload = capturedImage || imagePreview;
              const uploadResponse = await fetch('http://localhost:5001/api/face/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ image: imageToUpload })
              });
              
              if (uploadResponse.ok) {
                alert(`Tài khoản ${role} đã được tạo thành công và ảnh đã được upload!\nUsername: ${payload.username}\nPassword: default123${role === 'student' ? '\nStudent ID: ' + studentId : ''}`);
              } else {
                alert(`Tài khoản đã tạo thành công nhưng upload ảnh thất bại.\nUsername: ${payload.username}\nPassword: default123`);
              }
            }
          } catch (uploadError) {
            console.error('Upload error:', uploadError);
            alert(`Tài khoản đã tạo thành công nhưng upload ảnh thất bại.\nUsername: ${payload.username}\nPassword: default123`);
          }
        } else {
          alert(`Tài khoản ${role} đã được tạo thành công!\nUsername: ${payload.username}\nPassword: default123${role === 'student' ? '\nStudent ID: ' + studentId : ''}`);
        }
        
        onClose();
      } else {
        alert(`Lỗi: ${data.error}`);
      }
    } catch (error) {
      console.error('Network error:', error);
      alert('Lỗi kết nối server');
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
          <>
            <div style={{ marginBottom: '10px' }}>
              <label>Lớp: </label>
              <input 
                type="text" 
                value={formData.class}
                onChange={(e) => handleInputChange('class', e.target.value)}
                style={{ padding: '5px', marginLeft: '10px' }} 
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Trường: </label>
              <input 
                type="text" 
                value={formData.school}
                onChange={(e) => handleInputChange('school', e.target.value)}
                style={{ padding: '5px', marginLeft: '10px' }}
                placeholder="Tên trường"
              />
            </div>
          </>
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
              <div>
                <input 
                  type="file" 
                  accept="image/*"
                  style={{ marginLeft: '10px' }} 
                  onChange={handleImageUpload}
                />
                <button
                  type="button"
                  style={{ marginLeft: '10px', padding: '5px' }}
                  onClick={() => setShowCamera(true)}
                >
                  Chụp ảnh
                </button>
              </div>
            </div>
            
            {showCamera && (
              <CameraCapture
                onCapture={handleCameraCapture}
                onClose={() => setShowCamera(false)}
              />
            )}
            
            {capturedImage && (
              <div style={{ marginTop: '10px' }}>
                <img 
                  src={capturedImage} 
                  alt="Captured" 
                  style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                />
              </div>
            )}
            
            {isValidatingImage && (
              <div style={{ color: 'blue', fontSize: '12px' }}>
                Đang kiểm tra ảnh...
              </div>
            )}
            {imageValidationResult && (
              <div style={{ 
                color: imageValidationResult.valid ? 'green' : 'red', 
                fontSize: '12px' 
              }}>
                {imageValidationResult.message}
              </div>
            )}
            {imagePreview && (
              <div style={{ marginTop: '10px' }}>
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                />
              </div>
            )}
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
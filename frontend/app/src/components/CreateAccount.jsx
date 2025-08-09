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
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleCameraCapture = async (imageData) => {
    setCapturedImage(imageData);
    setShowCamera(false);
    
    // Tạo preview cho ảnh chụp
    setImagePreview(imageData);
    
    // Validate captured image với delay nhỏ để đảm bảo state đã update
    setTimeout(() => {
      validateImageHasFace(imageData, true);
    }, 100);
  };

  const validateImageHasFace = async (file, isBase64 = false) => {
    setIsValidatingImage(true);
    setImageValidationResult(null);
    
    try {
      let base64Image;
      
      if (isBase64) {
        base64Image = file;
      } else {
        // Convert file to base64
        const reader = new FileReader();
        const base64Promise = new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(file);
        });
        base64Image = await base64Promise;
      }
      
      // Thêm timeout cho validation
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch('http://localhost:5001/api/face/validate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ image: base64Image }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const result = await response.json();
      
      if (response.ok) {
        setImageValidationResult({
          valid: true,
          message: 'Ảnh hợp lệ - Đã phát hiện khuôn mặt'
        });
      } else {
        setImageValidationResult({
          valid: false,
          message: result.error || 'Ảnh không hợp lệ hoặc không phát hiện được khuôn mặt'
        });
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        setImageValidationResult({
          valid: false,
          message: 'Timeout khi kiểm tra ảnh. Vui lòng thử lại.'
        });
      } else {
        setImageValidationResult({
          valid: false,
          message: 'Lỗi khi kiểm tra ảnh'
        });
      }
    } finally {
      setIsValidatingImage(false);
    }
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
      // Show loading indicator
      setIsSubmitting(true);
      
      // 1. Tạo tài khoản trước
      let endpoint;
      if (role === 'student') {
        endpoint = 'http://localhost:5001/api/admin/students';
      } else if (role === 'teacher') {
        endpoint = 'http://localhost:5001/api/admin/teachers';
      } else if (role === 'admin') {
        endpoint = 'http://localhost:5001/api/admin/admins';
      }
      
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
        // 2. Nếu là học sinh và có ảnh, upload ảnh với endpoint tối ưu
        if (role === 'student' && (capturedImage || imageFile)) {
          try {
            // Đăng nhập với tài khoản vừa tạo
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
              // Upload ảnh với endpoint tối ưu
              const imageToUpload = capturedImage || imagePreview;
              
              // Upload ảnh với timeout protection
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout
              
              const uploadResponse = await fetch('http://localhost:5001/api/face/upload-for-registration', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ image: imageToUpload }),
                signal: controller.signal
              });
              
              clearTimeout(timeoutId);
              
              if (uploadResponse.ok) {
                alert(`Tài khoản học sinh đã được tạo thành công!\nUsername: ${payload.username}\nPassword: default123\nStudent ID: ${studentId}`);
              } else {
                const uploadError = await uploadResponse.json();
                alert(`Tài khoản đã tạo thành công nhưng upload ảnh thất bại: ${uploadError.error}\nUsername: ${payload.username}\nPassword: default123`);
              }
            } else {
              alert(`Tài khoản đã tạo thành công nhưng không thể đăng nhập để upload ảnh.\nUsername: ${payload.username}\nPassword: default123`);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', position: 'fixed', top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)', borderRadius: '5px', backgroundColor: '#f9f9f9', maxWidth: '400px'}}>
      <h2>Tạo tài khoản mới</h2>
      
      {isSubmitting && (
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(255,255,255,0.8)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderRadius: '5px',
          zIndex: 1000
        }}>
          <div style={{ textAlign: 'center' }}>
            <div>Đang tạo tài khoản...</div>
            <div style={{ fontSize: '12px', marginTop: '5px' }}>Vui lòng chờ...</div>
          </div>
        </div>
      )}
      
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
          onClick={handleSubmit}
          disabled={isSubmitting}
          style={{
            padding: '10px 20px',
            backgroundColor: isSubmitting ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            marginRight: '10px'
          }}
        >
          {isSubmitting ? 'Đang tạo...' : 'Tạo tài khoản'}
        </button>
        
        <button
          type="button"
          style={{
            padding: '5px 10px',
            backgroundColor: '#CC0000',
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
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavigation from './AdminNavigation';
import CreateAccount from './CreateAccount';
import ManageStudents from './ManageStudents';
import ManageTeachers from './ManageTeachers';
import LogoutComponent from './LogoutComponent';

function AdminDashboard() {
  const [activeSection, setActiveSection] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/auth/me', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserInfo(data.user);
      } else {
        // Nếu không thể lấy thông tin user, có thể session đã hết hạn
        console.error('Failed to fetch user info');
        if (response.status === 401) {
          navigate('/');
        }
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ marginLeft: '0px', padding: '0px' }}>Đang tải...</div>;
  }

  return (
    <div style={{ marginLeft: '0px', padding: '0px', color: '#333', minWidth:'100vw' }}>
      <div style={{ display: 'flex', alignItems: 'center', minWidth:'100vw',marginBottom: '0px' }}>
        <h1 style={{ fontSize: '40px', paddingLeft: '5%', paddingTop:'3%',flex: 1 }}>
          Admin: {userInfo?.full_name || 'N/A'}
        </h1>
        <h1 style={{ paddingRight: '5%', paddingTop:'3%', marginLeft:'auto' }}>
          <LogoutComponent />
        </h1>
      </div>
      <AdminNavigation
        onCreateAccount={() => setActiveSection('create')}
        onManageStudents={() => setActiveSection('students')}
        onManageTeachers={() => setActiveSection('teachers')}
      />
      {activeSection === 'create' && <CreateAccount onClose={() => setActiveSection(null)} />}
      {activeSection === 'students' && <ManageStudents />}
      {activeSection === 'teachers' && <ManageTeachers />}
    </div>
  );
}

export default AdminDashboard;
import React, { useState, useEffect } from 'react';
import AdminHeader from './AdminHeader';
import AdminNavigation from './AdminNavigation';
import CreateAccount from './CreateAccount';
import ManageStudents from './ManageStudents';
import ManageTeachers from './ManageTeachers';
import LogoutComponent from './LogoutComponent';

function AdminDashboard() {
  const [activeSection, setActiveSection] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

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
        console.error('Failed to fetch user info');
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ marginLeft: '30px', padding: '20px' }}>Đang tải...</div>;
  }

  return (
    <div style={{ marginLeft: '30px', padding: '20px', color: '#333' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
        <h1 style={{ fontSize: '40px', marginRight: '710px' }}>
          Admin: {userInfo?.full_name || 'N/A'}
        </h1>
        <LogoutComponent />
      </div>
      <AdminHeader />
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
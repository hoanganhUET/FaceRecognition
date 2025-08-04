import React, { useState, useEffect } from 'react';
import AttendanceCalendar from './AttendanceCalendar';
import LogoutComponent from './LogoutComponent';

function StudentDashboard() {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/student/profile', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserInfo(data.profile);
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
    return <div style={{ marginTop: '60px', marginLeft: '70px' }}>Đang tải...</div>;
  }

  return (
    <div style={{
      marginLeft: '30px',
      padding: '5px',
      color: '#333',
      height: '100vh'
    }}>
    <div style={{
      position: 'fixed',
      top: '50px',
      right: '70px',
      zIndex: 1000
    }}>
      <LogoutComponent />
    </div>
    <div style={{ position: 'fixed', top: '40px', left: '80px', zIndex: 1000 }}>
      <h1 style={{ marginBottom: '10px', fontSize: '40px' }}>
        Học sinh: {userInfo?.full_name || 'N/A'}
      </h1>
      <p style={{ fontSize: '20px', margin: '0' }}>
        Lớp: {userInfo?.class_name || 'Chưa có'}
      </p>
      <p style={{ fontSize: '20px', margin: '0' }}>
        Mã sinh viên: {userInfo?.student_id || 'N/A'}
      </p>
    </div>
    <div style={{position: 'fixed', top: '130px', left: '450px', zIndex: 1000}}>
      <AttendanceCalendar />
    </div>
  </div>
 );
}

export default StudentDashboard;

import React, { useState, useEffect } from 'react';
import TeacherCalendar from './TeacherCalendar';

function TeacherDashboard() {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/teacher/profile', {
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
    <div style={{ color: '#333', marginTop: '60px', marginLeft: '70px' }}>
      <h1 style={{ marginBottom: '10px', fontSize: '40px' }}>
        Giáo viên: {userInfo?.full_name || 'N/A'}
      </h1>
      <p style={{ marginTop: '10px', fontSize: '20px' }}>
        Lớp phụ trách: {userInfo?.class_name || 'Chưa có'}
      </p>
      <TeacherCalendar />
    </div>
  );
}

export default TeacherDashboard;
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
    return <div style={{ marginLeft: '0px', padding: '0px' }}>Đang tải...</div>;
  } 

  return (
    <div style={{ marginLeft: '0px', padding: '0px', color: '#333', minWidth:'100vw'}}>
    <div style={{ display: 'flex', alignItems: 'center', minWidth:'100vw',marginBottom: '0px' }}>
      <h1 style={{ fontSize: '40px', paddingLeft: '5%', paddingTop:'3%',flex: 1 }}>
        Học sinh: {userInfo?.full_name || 'N/A'}
        <p style={{ fontSize: '25px', marginTop: '15px' }}>
            Lớp: {userInfo?.class_name || 'Chưa có'}
        </p>
        <p style={{ fontSize: '25px', marginTop: '10px' }}>
            Mã sinh viên: {userInfo?.student_id || 'N/A'}
        </p>
      </h1>
    <h1 style={{ paddingRight: '5%', marginLeft:'auto', marginTop: '-0.5%' }}>
      <LogoutComponent />
    </h1>
    </div>
    <div style={{position: 'fixed', top: '20%', left: '32%', }}>
      <AttendanceCalendar />
    </div>
  </div>
 );
}

export default StudentDashboard;

import React, { useState, useEffect } from 'react';
import TeacherCalendar from './TeacherCalendar';
import LogoutComponent from './LogoutComponent';

function TeacherDashboard() {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attendanceRequests, setAttendanceRequests] = useState([]); // danh sách yêu cầu

  useEffect(() => {
    fetchUserInfo();
    fetchAttendanceRequests(); //yeu cau cua hoc sinh
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

  const fetchAttendanceRequests = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/teacher/attendance-requests', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setAttendanceRequests(data.requests || []);
      } else {
        console.error('Failed to fetch attendance requests');
      }
    } catch (error) {
      console.error('Error fetching attendance requests:', error);
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
        Giáo viên: {userInfo?.full_name || 'N/A'}
      </h1>
      <p style={{ marginTop: '10px', fontSize: '20px' }}>
        Lớp phụ trách: {userInfo?.class_name || 'Chưa có'}
      </p>
    </div>
    <div style={{position: 'fixed', top: '130px', left: '300px', zIndex: 1000}}>
      <TeacherCalendar />
    </div>
    {/* Ô bên phải: yêu cầu điểm danh */}
      <div style={{
        position: 'fixed',
        top: '155px',
        right: '70px',
        width: '400px',
        maxHeight: '500px',
        overflowY: 'auto',
        backgroundColor: '#f5f5f5',
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '8px',
        zIndex: 1000
      }}>
        <h3>Yêu cầu điểm danh</h3>
        {attendanceRequests.length === 0 ? (
          <p>Hiện không có yêu cầu từ học sinh.</p>
        ) : (
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {attendanceRequests.map((req, index) => (
              <li key={index} style={{
                marginBottom: '10px',
                padding: '10px',
                backgroundColor: '#fff',
                border: '1px solid #ddd',
                borderRadius: '5px'
              }}>
                <strong>{req.student_name}</strong><br />
                Lý do: {req.reason || 'Không có'}<br />
                Ngày: {req.date || 'N/A'}
              </li>
            ))}
          </ul>
        )}
      </div>
  </div>
  );
}

export default TeacherDashboard;
import React from 'react';
import AttendanceCalendar from './AttendanceCalendar';

function StudentDashboard() {
  return (
    <div style={{ color: '#333', marginTop: '60px', marginLeft: '70px' }}>
      <h1 style={{ marginBottom: '10px', fontSize: '40px' }}>Học sinh: Nguyễn Nhật Anh</h1>
      <p style={{ marginTop: '10px', fontSize: '20px' }}>Lớp: K70I-CS1</p>
      <AttendanceCalendar />
    </div>
  );
}

export default StudentDashboard;
import React from 'react';
import TeacherCalendar from './TeacherCalendar';

function TeacherDashboard() {
  return (
    <div style={{ color: '#333', marginTop: '60px', marginLeft: '70px' }}>
      <h1 style={{ marginBottom: '10px', fontSize: '40px' }}>Giáo viên: ĐVA</h1>
      <p style={{ marginTop: '10px', fontSize: '20px' }}>Lớp phụ trách: K70I-CS1</p>
      <TeacherCalendar />
    </div>
  );
}

export default TeacherDashboard;
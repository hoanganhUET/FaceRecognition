import React from 'react';

function ManageTeachers() {
  const mockTeachers = [
    { id: 1, name: 'Nguyễn Văn A', subject: 'Toán', status: 'Active' },
    { id: 2, name: 'Trần Thị B', subject: 'Tin học', status: 'Active' },
    { id: 3, name: 'Lê Văn C', subject: 'Vật lý', status: 'Inactive' },
  ];

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
      <h2>Quản lý giáo viên</h2>
      <ul>
        {mockTeachers.map((teacher) => (
          <li key={teacher.id} style={{ margin: '5px 0', color: teacher.status === 'Active' ? '#90ee90' : '#ffcccc' }}>
            {teacher.name} (Môn: {teacher.subject}) - {teacher.status}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ManageTeachers;
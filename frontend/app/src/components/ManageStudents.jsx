import React from 'react';

function ManageStudents() {
  const mockStudents = [
    { id: 1, name: 'Nguyễn Nhật Anh', class: 'K70I-CS1', status: 'Active' },
    { id: 2, name: 'Trần Văn B', class: 'K70I-CS2', status: 'Active' },
    { id: 3, name: 'Lê Thị C', class: 'K70I-CS1', status: 'Inactive' },
  ];

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
      <h2>Quản lý học sinh</h2>
      <ul>
        {mockStudents.map((student) => (
          <li key={student.id} style={{ margin: '5px 0', color: student.status === 'Active' ? '#90ee90' : '#ffcccc' }}>
            {student.name} (Lớp: {student.class}) - {student.status}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ManageStudents;
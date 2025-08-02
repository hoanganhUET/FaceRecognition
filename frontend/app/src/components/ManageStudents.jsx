import React, { useState, useEffect } from 'react';

function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/admin/students', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students);
      } else {
        console.error('Failed to fetch students');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Đang tải...</div>;
  }

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
      <h2>Quản lý học sinh</h2>
      <ul>
        {students.map((student) => (
          <li key={student.id} style={{ margin: '5px 0', color: '#333' }}>
            {student.full_name} (Lớp: {student.class_name || 'Chưa có'}) - ID: {student.student_id}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ManageStudents;
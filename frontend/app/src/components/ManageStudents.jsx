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

  const handleDeleteStudent = async (studentId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa học sinh này?')) {
      try {
        const response = await fetch(`http://localhost:5001/api/admin/students/${studentId}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        
        if (response.ok) {
          alert('Xóa học sinh thành công!');
          fetchStudents(); // Refresh danh sách
        } else {
          const data = await response.json();
          alert(`Lỗi: ${data.error}`);
        }
      } catch (error) {
        console.error('Error deleting student:', error);
        alert('Lỗi kết nối server');
      }
    }
  };

  if (loading) {
    return <div>Đang tải...</div>;
  }

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
      <h2>Quản lý học sinh</h2>
      {students.length === 0 ? (
        <p>Chưa có học sinh nào.</p>
      ) : (
        <ul>
          {students.map((student) => (
            <li key={student.id} style={{ margin: '10px 0', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
              <div>
                <strong>{student.full_name}</strong> - Username: {student.username}
              </div>
              <div>
                Lớp: {student.class_name || 'Chưa có'} - ID: {student.student_id}
              </div>
              <div>
                Trường: {student.school || 'Chưa có'}
              </div>
              <button
                style={{
                  padding: '5px 10px',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginTop: '5px'
                }}
                onClick={() => handleDeleteStudent(student.id)}
              >
                Xóa
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ManageStudents;
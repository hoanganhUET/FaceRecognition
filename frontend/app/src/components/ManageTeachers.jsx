import React, { useState, useEffect } from 'react';

function ManageTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/admin/teachers', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setTeachers(data.teachers);
      } else {
        console.error('Failed to fetch teachers');
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeacher = async (teacherId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa giáo viên này?')) {
      try {
        const response = await fetch(`http://localhost:5001/api/admin/teachers/${teacherId}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        
        if (response.ok) {
          alert('Xóa giáo viên thành công!');
          fetchTeachers(); // Refresh danh sách
        } else {
          const data = await response.json();
          alert(`Lỗi: ${data.error}`);
        }
      } catch (error) {
        console.error('Error deleting teacher:', error);
        alert('Lỗi kết nối server');
      }
    }
  };

  if (loading) {
    return <div>Đang tải...</div>;
  }

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
      <h2>Quản lý giáo viên</h2>
      {teachers.length === 0 ? (
        <p>Chưa có giáo viên nào.</p>
      ) : (
        <ul>
          {teachers.map((teacher) => (
            <li key={teacher.id} style={{ margin: '10px 0', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
              <div>
                <strong>{teacher.full_name}</strong> - Username: {teacher.username}
              </div>
              <div>
                Lớp phụ trách: {teacher.class_name || 'Chưa có'}
              </div>
              <div>
                Trường: {teacher.school || 'Chưa có'}
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
                onClick={() => handleDeleteTeacher(teacher.id)}
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

export default ManageTeachers;
// import React, { useState, useEffect } from 'react';

// function ManageStudents() {
//   const [students, setStudents] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [isOpen, setIsOpen] = useState(true);

//   useEffect(() => {
//     fetchStudents();
//   }, []);

//   const fetchStudents = async () => {
//     try {
//       const response = await fetch('http://localhost:5001/api/admin/students', {
//         credentials: 'include'
//       });
      
//       if (response.ok) {
//         const data = await response.json();
//         setStudents(data.students);
//       } else {
//         console.error('Failed to fetch students');
//       }
//     } catch (error) {
//       console.error('Error fetching students:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDeleteStudent = async (studentId) => {
//     if (window.confirm('Bạn có chắc chắn muốn xóa học sinh này?')) {
//       try {
//         const response = await fetch(`http://localhost:5001/api/admin/students/${studentId}`, {
//           method: 'DELETE',
//           credentials: 'include'
//         });
        
//         if (response.ok) {
//           alert('Xóa học sinh thành công!');
//           fetchStudents(); // Refresh danh sách
//         } else {
//           const data = await response.json();
//           alert(`Lỗi: ${data.error}`);
//         }
//       } catch (error) {
//         console.error('Error deleting student:', error);
//         alert('Lỗi kết nối server');
//       }
//     }
//   };

//   if (loading) {
//     return <div>Đang tải...</div>;
//   }
//   if (!isOpen) return null;
//   return (
//     <div style={{ padding: '20px', border: '1px solid #ccc', position: 'fixed',top: '50%',left: '50%',
//     transform: 'translate(-50%, -50%)', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
//        <button
//         onClick={() => setIsOpen(false)}
//         style={{
//           float: 'right',
//           background: '#CC0000',
//           color:'white',
//           padding: '5px 5px',
//           border: 'none',
//           borderRadius: '4px',
//           fontSize: '15px',
//           cursor: 'pointer'
//         }}
//       >
//         Đóng
//       </button>
//       <h2>Quản lý học sinh</h2>
//       {students.length === 0 ? (
//         <p>Chưa có học sinh nào.</p>
//       ) : (
//         <ul>
//           {students.map((student) => (
//             <li key={student.id} style={{ margin: '10px 0', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
//               <div>
//                 <strong>{student.full_name}</strong> - Username: {student.username}
//               </div>
//               <div>
//                 Lớp: {student.class_name || 'Chưa có'} - ID: {student.student_id}
//               </div>
//               <div>
//                 Trường: {student.school || 'Chưa có'}
//               </div>
//               <button
//                 style={{
//                   padding: '5px 10px',
//                   backgroundColor: '#CC0000',
//                   color: 'white',
//                   border: 'none',
//                   borderRadius: '4px',
//                   cursor: 'pointer',
//                   marginTop: '5px'
//                 }}
//                 onClick={() => handleDeleteStudent(student.id)}
//               >
//                 Xóa
//               </button>
//             </li>
//           ))}
//         </ul>
//       )}
//     </div>
//   );
// }

// export default ManageStudents;


import React, { useState, useEffect } from "react";

function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null); // học sinh được click
  const [editData, setEditData] = useState({}); // dữ liệu đang sửa
  const [newImage, setNewImage] = useState(null); // file ảnh mới

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await fetch(
        "http://localhost:5001/api/admin/students",
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStudents(data.students);
      } else {
        console.error("Failed to fetch students");
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa học sinh này?")) {
      try {
        const response = await fetch(
          `http://localhost:5001/api/admin/students/${studentId}`,
          {
            method: "DELETE",
            credentials: "include",
          }
        );

        if (response.ok) {
          alert("Xóa học sinh thành công!");
          fetchStudents(); // Refresh danh sách
        } else {
          const data = await response.json();
          alert(`Lỗi: ${data.error}`);
        }
      } catch (error) {
        console.error("Error deleting student:", error);
        alert("Lỗi kết nối server");
      }
    }
  };

  const handleUpdateStudent = async () => {
    const formData = new FormData();
    for (let key in editData) {
      formData.append(key, editData[key]);
    }
    if (newImage) {
      formData.append("avatar", newImage);
    }

    try {
      const response = await fetch(
        `http://localhost:5001/api/admin/students/${selectedStudent.id}`,
        {
          method: "PUT",
          credentials: "include",
          body: formData,
        }
      );

      if (response.ok) {
        alert("Cập nhật thành công!");
        setSelectedStudent(null);
        fetchStudents();
      } else {
        const data = await response.json();
        alert(`Lỗi: ${data.error}`);
      }
    } catch (error) {
      console.error("Error updating student:", error);
      alert("Lỗi kết nối server");
    }
  };

  const openEditPopup = (student) => {
    setSelectedStudent(student);
    setEditData({
      full_name: student.full_name,
      username: student.username,
      class_name: student.class_name || "",
      student_id: student.student_id,
      school: student.school || "",
    });
    setNewImage(null);
  };

  if (loading) return <div>Đang tải...</div>;
  if (!isOpen) return null;

  return (
    <>
      <div
        style={{
          padding: "20px",
          border: "1px solid #ccc",
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          borderRadius: "5px",
          backgroundColor: "#f9f9f9",
          minWidth: "350px",
        }}
      >
        <button
          onClick={() => setIsOpen(false)}
          style={{
            float: "right",
            background: "#CC0000",
            color: "white",
            padding: "5px 5px",
            border: "none",
            borderRadius: "4px",
            fontSize: "15px",
            cursor: "pointer",
          }}
        >
          Đóng
        </button>
        <h2>Quản lý học sinh</h2>
        {students.length === 0 ? (
          <p>Chưa có học sinh nào.</p>
        ) : (
          <ul>
            {students.map((student) => (
              <li
                key={student.id}
                style={{
                  margin: "10px 0",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
                onClick={() => openEditPopup(student)}
              >
                <div>
                  <strong>{student.full_name}</strong> - Username:{" "}
                  {student.username}
                </div>
                <div>
                  Lớp: {student.class_name || "Chưa có"} - ID:{" "}
                  {student.student_id}
                </div>
                <div>Trường: {student.school || "Chưa có"}</div>
                <button
                  style={{
                    padding: "5px 10px",
                    backgroundColor: "#CC0000",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    marginTop: "5px",
                  }}
                  onClick={(e) => {
                    e.stopPropagation(); // tránh trigger click mở popup
                    handleDeleteStudent(student.id);
                  }}
                >
                  Xóa
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selectedStudent && (
        <div
          style={{
            padding: "20px",
            border: "1px solid #ccc",
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            borderRadius: "5px",
            backgroundColor: "#e1e6cdff",
            minWidth: "350px",
            zIndex: 1000,
          }}
        >
          <button
            onClick={() => setSelectedStudent(null)}
            style={{
              float: "right",
              background: "#CC0000",
              color: "white",
              padding: "5px 5px",
              border: "none",
              borderRadius: "4px",
              fontSize: "15px",
              cursor: "pointer",
            }}
          >
            Đóng
          </button>
          <h3>Chỉnh sửa thông tin học sinh</h3>
          <label>
            Họ tên:{" "}
            <input
              type="text"
              value={editData.full_name}
              onChange={(e) =>
                setEditData({ ...editData, full_name: e.target.value })
              }
            />
          </label>
          <br />
          <label>
            Username:{" "}
            <input
              type="text"
              value={editData.username}
              onChange={(e) =>
                setEditData({ ...editData, username: e.target.value })
              }
            />
          </label>
          <br />
          <label>
            Lớp:{" "}
            <input
              type="text"
              value={editData.class_name}
              onChange={(e) =>
                setEditData({ ...editData, class_name: e.target.value })
              }
            />
          </label>
          <br />
          <label>
            Trường:{" "}
            <input
              type="text"
              value={editData.school}
              onChange={(e) =>
                setEditData({ ...editData, school: e.target.value })
              }
            />
          </label>
          <br />
          <label>
            Thay đổi ảnh học sinh:{" "}
            <input
              type="file"
              onChange={(e) => setNewImage(e.target.files[0])}
            />
          </label>
          <br />
          <button
            onClick={handleUpdateStudent}
            style={{
              marginTop: "10px",
              padding: "5px 10px",
              backgroundColor: "#3c5066ff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Lưu
          </button>
        </div>
      )}
    </>
  );
}

export default ManageStudents;

import React, { useState, useEffect } from "react";

function ManageTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState(null); // giáo viên được chọn
  const [editData, setEditData] = useState({}); // dữ liệu chỉnh sửa

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await fetch("http://localhost:5001/api/admin/teachers", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setTeachers(data.teachers);
      } else {
        console.error("Failed to fetch teachers");
      }
    } catch (error) {
      console.error("Error fetching teachers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeacher = async (teacherId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa giáo viên này?")) {
      try {
        const response = await fetch(
          `http://localhost:5001/api/admin/teachers/${teacherId}`,
          {
            method: "DELETE",
            credentials: "include",
          }
        );

        if (response.ok) {
          alert("Xóa giáo viên thành công!");
          fetchTeachers(); // Refresh danh sách
        } else {
          const data = await response.json();
          alert(`Lỗi: ${data.error}`);
        }
      } catch (error) {
        console.error("Error deleting teacher:", error);
        alert("Lỗi kết nối server");
      }
    }
  };

  const handleUpdateTeacher = async () => {
    try {
      const response = await fetch(
        `http://localhost:5001/api/admin/teachers/${selectedTeacher.id}`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editData),
        }
      );

      if (response.ok) {
        alert("Cập nhật thành công!");
        setSelectedTeacher(null);
        fetchTeachers();
      } else {
        const data = await response.json();
        alert(`Lỗi: ${data.error}`);
      }
    } catch (error) {
      console.error("Error updating teacher:", error);
      alert("Lỗi kết nối server");
    }
  };

  const openEditPopup = (teacher) => {
    setSelectedTeacher(teacher);
    setEditData({
      full_name: teacher.full_name,
      username: teacher.username,
      class_name: teacher.class_name || "",
      school: teacher.school || "",
    });
  };

  if (loading) return <div>Đang tải...</div>;
  if (!isOpen) return null;

  return (
    <>
      <div
        style={{
          padding: "20px",
          border: "1px solid #ccc",
          borderRadius: "5px",
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
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
        <h2>Quản lý giáo viên</h2>
        {teachers.length === 0 ? (
          <p>Chưa có giáo viên nào.</p>
        ) : (
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <ul>
            {teachers.map((teacher) => (
              <li
                key={teacher.id}
                style={{
                  margin: "10px 0",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
                onClick={() => openEditPopup(teacher)}
              >
                <div>
                  <strong>{teacher.full_name}</strong> - Username:{" "}
                  {teacher.username}
                </div>
                <div>
                  Lớp phụ trách: {teacher.class_name || "Chưa có"}
                </div>
                <div>Trường: {teacher.school || "Chưa có"}</div>
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
                    e.stopPropagation(); // tránh mở popup khi bấm Xóa
                    handleDeleteTeacher(teacher.id);
                  }}
                >
                  Xóa
                </button>
              </li>
            ))}
          </ul>
        </div>
        )}
      </div>

      {selectedTeacher && (
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
            onClick={() => setSelectedTeacher(null)}
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
          <h3>Chỉnh sửa giáo viên</h3>
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
            Lớp phụ trách:{" "}
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
          <button
            onClick={handleUpdateTeacher}
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

export default ManageTeachers;

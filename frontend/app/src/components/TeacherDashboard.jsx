import React, { useState, useEffect } from 'react';
import TeacherCalendar from './TeacherCalendar';
import LogoutComponent from './LogoutComponent';

function TeacherDashboard() {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attendanceRequests, setAttendanceRequests] = useState([]); // danh sách yêu cầu pending
  const [processedRequests, setProcessedRequests] = useState([]); // danh sách yêu cầu đã xử lý
  const [showProcessed, setShowProcessed] = useState(false); // toggle hiển thị

  useEffect(() => {
    fetchUserInfo();
    fetchAttendanceRequests(); //yeu cau cua hoc sinh
    fetchProcessedRequests(); // yêu cầu đã xử lý
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

  const fetchProcessedRequests = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/teacher/attendance-requests/processed', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setProcessedRequests(data.requests || []);
      } else {
        console.error('Failed to fetch processed requests');
      }
    } catch (error) {
      console.error('Error fetching processed requests:', error);
    }
  };

  const handleApproval = async (requestId, status, comment = '') => {
    try {
      const response = await fetch(`http://localhost:5001/api/teacher/attendance-requests/${requestId}/approve`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status: status,
          comment: comment 
        })
      });

      if (response.ok) {
        alert(`Yêu cầu đã được ${status === 'approved' ? 'duyệt' : 'từ chối'} thành công!`);
        // Refresh danh sách yêu cầu
        fetchAttendanceRequests();
        fetchProcessedRequests();
      } else {
        const data = await response.json();
        alert(`Lỗi: ${data.error}`);
      }
    } catch (error) {
      console.error('Error processing request:', error);
      alert('Lỗi kết nối server');
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
        <h3>
          Yêu cầu minh chứng điểm danh
          <button
            style={{
              marginLeft: '10px',
              padding: '5px 10px',
              backgroundColor: showProcessed ? '#6c757d' : '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
            onClick={() => setShowProcessed(!showProcessed)}
          >
            {showProcessed ? 'Đang chờ' : 'Đã xử lý'}
          </button>
        </h3>
        
        {!showProcessed ? (
          // Hiển thị yêu cầu đang chờ duyệt
          attendanceRequests.length === 0 ? (
            <p>Hiện không có yêu cầu minh chứng từ học sinh.</p>
          ) : (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {attendanceRequests.map((req) => (
                <div key={req.id} style={{
                  marginBottom: '15px',
                  padding: '15px',
                  backgroundColor: '#fff',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ marginBottom: '10px' }}>
                    <strong style={{ fontSize: '16px', color: '#333' }}>
                      {req.student_name} (ID: {req.student_id})
                    </strong>
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Ngày:</strong> {req.date}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Lý do minh chứng:</strong> 
                    <p style={{ 
                      margin: '5px 0', 
                      padding: '8px', 
                      backgroundColor: '#f8f9fa',
                      borderRadius: '4px',
                      border: '1px solid #e9ecef'
                    }}>
                      {req.excuse_reason}
                    </p>
                  </div>
                  {req.note && (
                    <div style={{ marginBottom: '10px' }}>
                      <strong>Ghi chú thêm:</strong> 
                      <p style={{ 
                        margin: '5px 0', 
                        padding: '8px', 
                        backgroundColor: '#f8f9fa',
                        borderRadius: '4px',
                        border: '1px solid #e9ecef'
                      }}>
                        {req.note}
                      </p>
                    </div>
                  )}
                  <div style={{ marginBottom: '8px', fontSize: '12px', color: '#6c757d' }}>
                    Gửi lúc: {new Date(req.submitted_at).toLocaleString('vi-VN')}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}
                      onClick={() => {
                        const comment = prompt('Nhập ghi chú (tùy chọn):');
                        handleApproval(req.id, 'approved', comment || '');
                      }}
                    >
                      ✓ Duyệt
                    </button>
                    <button
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}
                      onClick={() => {
                        const comment = prompt('Nhập lý do từ chối (tùy chọn):');
                        handleApproval(req.id, 'rejected', comment || '');
                      }}
                    >
                      ✗ Từ chối
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          // Hiển thị yêu cầu đã xử lý
          processedRequests.length === 0 ? (
            <p>Chưa có yêu cầu nào được xử lý.</p>
          ) : (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {processedRequests.map((req) => (
                <div key={req.id} style={{
                  marginBottom: '15px',
                  padding: '15px',
                  backgroundColor: req.teacher_approval === 'approved' ? '#f0f8ff' : '#ffebee',
                  border: `1px solid ${req.teacher_approval === 'approved' ? '#2196f3' : '#f44336'}`,
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ marginBottom: '10px' }}>
                    <strong style={{ fontSize: '16px', color: '#333' }}>
                      {req.student_name} (ID: {req.student_id})
                    </strong>
                    <span style={{
                      marginLeft: '10px',
                      padding: '4px 8px',
                      backgroundColor: req.teacher_approval === 'approved' ? '#4caf50' : '#f44336',
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {req.teacher_approval === 'approved' ? 'ĐÃ DUYỆT' : 'TỪ CHỐI'}
                    </span>
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Ngày:</strong> {req.date}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Lý do minh chứng:</strong> 
                    <p style={{ 
                      margin: '5px 0', 
                      padding: '8px', 
                      backgroundColor: '#f8f9fa',
                      borderRadius: '4px',
                      border: '1px solid #e9ecef'
                    }}>
                      {req.excuse_reason}
                    </p>
                  </div>
                  {req.teacher_comment && (
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Nhận xét của giáo viên:</strong> 
                      <p style={{ 
                        margin: '5px 0', 
                        padding: '8px', 
                        backgroundColor: '#fff3cd',
                        borderRadius: '4px',
                        border: '1px solid #ffeaa7'
                      }}>
                        {req.teacher_comment}
                      </p>
                    </div>
                  )}
                  <div style={{ fontSize: '12px', color: '#6c757d' }}>
                    Xử lý lúc: {new Date(req.processed_at).toLocaleString('vi-VN')}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
  </div>
  );
}

export default TeacherDashboard;
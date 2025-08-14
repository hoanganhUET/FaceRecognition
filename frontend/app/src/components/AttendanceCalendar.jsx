import React, { useState, useEffect } from 'react';

function AttendanceCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [displayMonth, setDisplayMonth] = useState(null);
  const [calendar, setCalendar] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [note, setNote] = useState('');
  const [excuseReason, setExcuseReason] = useState('');
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const updateMonth = () => {
      const now = new Date();
      setCurrentDate(now);
      setDisplayMonth(now.getMonth());
    };

    updateMonth();
    const interval = setInterval(updateMonth, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch attendance data từ API
  useEffect(() => {
    if (displayMonth !== null) {
      fetchAttendanceData();
    }
  }, [displayMonth, currentDate]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = displayMonth + 1; // +1 vì getMonth() trả về 0-11
      
      const response = await fetch(
        `http://localhost:5001/api/student/attendance?year=${year}&month=${month}`,
        { credentials: 'include' }
      );
      
      if (response.ok) {
        const data = await response.json();
        setAttendanceData(data.attendance || {});
      } else {
        console.error('Failed to fetch attendance data');
        setAttendanceData({});
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      setAttendanceData({});
    } finally {
      setLoading(false);
    }
  };

  // Tạo calendar dựa trên dữ liệu thực
  useEffect(() => {
    if (displayMonth !== null) {
      const year = currentDate.getFullYear();
      const month = displayMonth;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const firstDay = new Date(year, month, 1).getDay();

      const calendarDays = [];
      
      // Thêm các ngày trống
      for (let i = 0; i < firstDay; i++) {
        calendarDays.push(null);
      }
      
      // Thêm các ngày trong tháng
      for (let day = 1; day <= daysInMonth; day++) {
        const key = `${month + 1}-${day}`;
        const attendanceInfo = attendanceData[key] || { status: 'absent', time: '' };
        
        // Xác định màu sắc dựa trên trạng thái
        let dayStatus = attendanceInfo.status;
        if (dayStatus === 'pending') {
          dayStatus = 'pending'; // Màu vàng cho đang chờ duyệt
        } else if (attendanceInfo.teacher_approval === 'rejected') {
          dayStatus = 'rejected'; // Màu cam cho bị từ chối
        }
        
        calendarDays.push({
          day,
          month: month + 1,
          status: dayStatus,
          time: attendanceInfo.time,
          teacher_approval: attendanceInfo.teacher_approval,
          teacher_comment: attendanceInfo.teacher_comment,
        });
      }
      
      // Điền đủ 7 cột
      while (calendarDays.length % 7 !== 0) {
        calendarDays.push(null);
      }

      setCalendar(calendarDays);
    }
  }, [displayMonth, currentDate, attendanceData]);

  const goBackMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      if (newDate.getMonth() === 0) {
        // Từ tháng 1 về tháng 12 năm trước
        newDate.setFullYear(newDate.getFullYear() - 1);
        newDate.setMonth(11);
      } else {
        newDate.setMonth(newDate.getMonth() - 1);
      }
      return newDate;
    });
    
    setDisplayMonth((prev) => {
      if (prev === 0) {
        return 11; // Tháng 12
      }
      return prev - 1;
    });
  };

  const goNextMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      if (newDate.getMonth() === 11) {
        // Từ tháng 12 sang tháng 1 năm sau
        newDate.setFullYear(newDate.getFullYear() + 1);
        newDate.setMonth(0);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
    
    setDisplayMonth((prev) => {
      if (prev === 11) {
        return 0; // Tháng 1
      }
      return prev + 1;
    });
  };

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
  ];

  const handleDayClick = (day) => {
    if (day) {
      setSelectedDay(day);
      setNote('');
      setExcuseReason('');
    }
  };

  const handleSubmit = async () => {
    if (selectedDay) {
      try {
        if (!excuseReason.trim()) {
          alert('Vui lòng nhập lý do minh chứng');
          return;
        }

        const requestData = {
          date: `${currentDate.getFullYear()}-${selectedDay.month}-${selectedDay.day}`,
          excuse_reason: excuseReason,
          note: note
        };

        const response = await fetch('http://localhost:5001/api/student/attendance/excuse', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
        });

        if (response.ok) {
          alert('Biểu mẫu minh chứng đã được gửi và đang chờ giáo viên duyệt!');
          // Refresh data để cập nhật trạng thái
          fetchAttendanceData();
        } else {
          const data = await response.json();
          alert(`Lỗi: ${data.error}`);
        }
      } catch (error) {
        console.error('Error submitting excuse form:', error);
        alert('Lỗi kết nối server');
      }
      
      setSelectedDay(null);
    }
  };

  if (loading) {
    return <div style={{ marginLeft: '30px', padding: '20px' }}>Đang tải dữ liệu điểm danh...</div>;
  }

  return (
    <div style={{ marginLeft: '30px', padding: '20px', color: '#333' }}>
      <h1 style={{ fontSize: '30px', marginBottom: '10px',  textAlign: 'center' }}>Theo dõi điểm danh</h1>
      
      <div style={{ marginBottom: '15px' }}>
        {/* <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Chú thích màu sắc:</h3> */}
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center'}}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ 
              width: '20px', 
              height: '20px', 
              backgroundColor: '#90ee90',
              border: '1px solid #ccc'
            }}></div>
            <span style={{ fontSize: '20px' }}>Có mặt</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ 
              width: '20px', 
              height: '20px', 
              backgroundColor: '#ffeb3b',
              border: '1px solid #ccc'
            }}></div>
            <span style={{ fontSize: '20px' }}>Chờ duyệt</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ 
              width: '20px', 
              height: '20px', 
              backgroundColor: '#ffcccc',
              border: '1px solid #ccc'
            }}></div>
            <span style={{ fontSize: '20px' }}>Vắng mặt</span>
          </div>
        </div>
      </div>
      
      <div>
        <h2 style={{ fontSize: '25px', marginBottom: '5px',  textAlign: 'center' }}>
          {monthNames[displayMonth]} {currentDate.getFullYear()}
        </h2>
        <button
          style={{
            padding: '5px 10px',
            marginBottom: '10px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
          onClick={goBackMonth}
          disabled={loading}
        >
          <img
            src="/back.png"
            alt="Trước"
            style={{ width: '40px', height: '40px' }}
          />
        </button>
        <button
          style={{
            padding: '5px 10px',
            marginBottom: '10px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            marginLeft: '480px',
          }}
          onClick={goNextMonth}
          disabled={loading}
        >
          <img
            src="/next.png"
            alt="Sau"
            style={{ width: '40px', height: '40px' }}
          />
        </button>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 80px)', gap: '7px' }}>
          {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day) => (
            <div key={day} style={{ fontWeight: 'bold', textAlign: 'center' }}>
              {day}
            </div>
          ))}
          {calendar.map((day, index) => (
            <div
              key={index}
              style={{
                width: '80px',
                height: '80px',
                textAlign: 'center',
                border: '1px solid #ccc',
                backgroundColor: day === null ? 'transparent' : 
                  day.status === 'present' ? '#90ee90' : 
                  day.status === 'pending' ? '#ffeb3b' :
                  day.status === 'rejected' ? '#ff9800' : '#ffcccc',
                cursor: day ? 'pointer' : 'default',
              }}
              onClick={() => handleDayClick(day)}
            >
              {day ? day.day : ''}
            </div>
          ))}
        </div>
      </div>

      {selectedDay && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            padding: '20px',
            border: '1px solid #ccc',
            borderRadius: '5px',
            boxShadow: '0 0 10px rgba(0,0,0,0.1)',
            zIndex: 1000,
          }}
        >
          <h3>Chi tiết ngày {selectedDay.day}/{selectedDay.month}/{currentDate.getFullYear()}</h3>
          <p>Trạng thái: {
            selectedDay.status === 'present' ? 'Đã điểm danh' : 
            selectedDay.status === 'pending' ? 'Đang chờ duyệt' : 
            selectedDay.status === 'rejected' ? 'Yêu cầu bị từ chối' : 'Vắng mặt'
          }</p>
          <p>Thời gian điểm danh: {selectedDay.time || 'Chưa điểm danh'}</p>
          
          {selectedDay.status === 'rejected' && (
            <div style={{ 
              padding: '10px', 
              backgroundColor: '#ffebee', 
              border: '1px solid #f44336',
              borderRadius: '4px',
              marginBottom: '10px'
            }}>
              <p style={{ margin: 0, color: '#d32f2f', fontWeight: 'bold' }}>
                ❌ Yêu cầu minh chứng đã bị từ chối
              </p>
              {selectedDay.teacher_comment && (
                <p style={{ margin: '8px 0 0 0', color: '#d32f2f' }}>
                  <strong>Lý do từ chối:</strong> {selectedDay.teacher_comment}
                </p>
              )}
              <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '12px' }}>
                Bạn có thể gửi lại yêu cầu minh chứng mới với lý do khác.
              </p>
            </div>
          )}
          
          {(selectedDay.status === 'absent' || selectedDay.status === 'rejected') && (
            <>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Lý do minh chứng: *
                </label>
                <textarea
                  style={{ 
                    width: '100%', 
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    resize: 'vertical',
                    minHeight: '80px'
                  }}
                  rows="3"
                  placeholder="Nhập lý do bạn không thể tham gia điểm danh (bắt buộc)..."
                  value={excuseReason}
                  onChange={(e) => setExcuseReason(e.target.value)}
                />
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Ghi chú thêm:
                </label>
                <textarea
                  style={{ 
                    width: '100%', 
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    resize: 'vertical'
                  }}
                  rows="2"
                  placeholder="Thông tin bổ sung (không bắt buộc)..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </>
          )}
          
          {selectedDay.status === 'pending' && (
            <div style={{ 
              padding: '10px', 
              backgroundColor: '#fff3cd', 
              border: '1px solid #ffeaa7',
              borderRadius: '4px',
              marginBottom: '10px'
            }}>
              <p style={{ margin: 0, color: '#856404' }}>
                ⏳ Biểu mẫu minh chứng đã được gửi và đang chờ giáo viên duyệt.
              </p>
            </div>
          )}
          
          <div>
            {(selectedDay.status === 'absent' || selectedDay.status === 'rejected') && (
              <button
                style={{
                  padding: '8px 15px',
                  backgroundColor: selectedDay.status === 'rejected' ? '#ff9800' : '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginRight: '10px',
                  fontWeight: 'bold'
                }}
                onClick={handleSubmit}
              >
                {selectedDay.status === 'rejected' ? 'Gửi lại yêu cầu' : 'Gửi biểu mẫu minh chứng'}
              </button>
            )}
            <button
              style={{
                padding: '8px 15px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              onClick={() => setSelectedDay(null)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AttendanceCalendar;
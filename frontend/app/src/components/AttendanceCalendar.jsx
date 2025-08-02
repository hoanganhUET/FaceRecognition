import React, { useState, useEffect } from 'react';

function AttendanceCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [displayMonth, setDisplayMonth] = useState(null);
  const [calendar, setCalendar] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [note, setNote] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
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
        calendarDays.push({
          day,
          month: month + 1,
          status: attendanceInfo.status,
          time: attendanceInfo.time,
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
      setSelectedFile(null);
    }
  };

  const handleSubmit = async () => {
    if (selectedDay) {
      try {
        // Gửi ghi chú hoặc file nếu cần thiết
        const formData = new FormData();
        formData.append('date', `${currentDate.getFullYear()}-${selectedDay.month}-${selectedDay.day}`);
        formData.append('note', note);
        
        if (selectedFile) {
          formData.append('file', selectedFile);
        }

        const response = await fetch('http://localhost:5001/api/student/attendance/note', {
          method: 'POST',
          credentials: 'include',
          body: formData
        });

        if (response.ok) {
          alert('Ghi chú đã được lưu!');
        } else {
          const data = await response.json();
          alert(`Lỗi: ${data.error}`);
        }
      } catch (error) {
        console.error('Error submitting note:', error);
        alert('Lỗi kết nối server');
      }
      
      setSelectedDay(null);
    }
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  if (loading) {
    return <div style={{ marginLeft: '30px', padding: '20px' }}>Đang tải dữ liệu điểm danh...</div>;
  }

  return (
    <div style={{ marginLeft: '30px', padding: '20px', color: '#333' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>Theo dõi điểm danh</h1>
      <div>
        <h2 style={{ fontSize: '18px', marginBottom: '5px' }}>
          {monthNames[displayMonth]} {currentDate.getFullYear()}
        </h2>
        <button
          style={{
            padding: '5px 10px',
            marginBottom: '10px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
          onClick={goBackMonth}
          disabled={loading}
        >
          Trước
        </button>
        <button
          style={{
            padding: '5px 10px',
            marginBottom: '10px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginLeft: '10px',
          }}
          onClick={goNextMonth}
          disabled={loading}
        >
          Sau
        </button>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 40px)', gap: '5px' }}>
          {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day) => (
            <div key={day} style={{ fontWeight: 'bold', textAlign: 'center' }}>
              {day}
            </div>
          ))}
          {calendar.map((day, index) => (
            <div
              key={index}
              style={{
                width: '40px',
                height: '40px',
                textAlign: 'center',
                border: '1px solid #ccc',
                backgroundColor: day === null ? 'transparent' : day.status === 'present' ? '#90ee90' : '#ffcccc',
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
          <p>Trạng thái: {selectedDay.status === 'present' ? 'Đã điểm danh' : 'Vắng mặt'}</p>
          <p>Thời gian điểm danh: {selectedDay.time || 'Chưa điểm danh'}</p>
          <textarea
            style={{ width: '100%', margin: '10px 0', padding: '5px' }}
            rows="3"
            placeholder="Nhập ghi chú..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <input
            type="file"
            style={{ margin: '10px 0' }}
            onChange={handleFileChange}
          />
          <div>
            <button
              style={{
                padding: '5px 10px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px',
              }}
              onClick={handleSubmit}
            >
              Gửi
            </button>
            <button
              style={{
                padding: '5px 10px',
                backgroundColor: '#f44336',
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
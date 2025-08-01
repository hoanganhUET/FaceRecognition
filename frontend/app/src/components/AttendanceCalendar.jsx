import React, { useState, useEffect } from 'react';

function AttendanceCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date()); // Ngày hiện tại
  const [displayMonth, setDisplayMonth] = useState(null); // Tháng được hiển thị
  const [calendar, setCalendar] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null); // Ngày được chọn để hiển thị modal
  const [note, setNote] = useState(''); // Ghi chú từ ô nhập văn bản
  const [selectedFile, setSelectedFile] = useState(null); // File đính kèm

  // Dữ liệu giả cho điểm danh (tháng 6, 7, 8/2025)
const mockAttendance = {
    '6-1': { status: 'present', time: '08:00 AM' },
    '6-2': { status: 'absent', time: '' },
    '6-5': { status: 'present', time: '09:15 AM' },
    '6-10': { status: 'absent', time: '' },
    '6-15': { status: 'present', time: '07:45 AM' },
    '6-20': { status: 'absent', time: '' },
    '6-30': { status: 'present', time: '08:30 AM' },
    '7-1': { status: 'present', time: '08:00 AM' },
    '7-2': { status: 'absent', time: '' },
    '7-3': { status: 'present', time: '09:15 AM' },
    '7-5': { status: 'absent', time: '' },
    '7-7': { status: 'present', time: '07:45 AM' },
    '7-10': { status: 'absent', time: '' },
    '7-15': { status: 'present', time: '08:30 AM' },
    '7-20': { status: 'absent', time: '' },
    '7-30': { status: 'present', time: '08:00 AM' },
    '8-1': { status: 'present', time: '09:00 AM' },
    '8-2': { status: 'absent', time: '' },
    '8-5': { status: 'present', time: '07:30 AM' },
  };

  useEffect(() => {
    const updateMonth = () => {
      const now = new Date();
      setCurrentDate(now);
      setDisplayMonth(now.getMonth()); // Cập nhật tháng hiện tại khi thời gian thay đổi
    };

    updateMonth(); // Cập nhật lần đầu
    const interval = setInterval(updateMonth, 60000); // Kiểm tra mỗi phút
    return () => clearInterval(interval); // Dọn dẹp interval
  }, []);

  useEffect(() => {
    if (displayMonth !== null) {
      const year = currentDate.getFullYear();
      const month = displayMonth;
      const daysInMonth = new Date(year, month + 1, 0).getDate(); // Số ngày trong tháng
      const firstDay = new Date(year, month, 1).getDay(); // Ngày đầu tiên là thứ mấy (0-6)

      const calendarDays = [];
      // Thêm các ngày trống trước ngày 1
      for (let i = 0; i < firstDay; i++) {
        calendarDays.push(null);
      }
      // Thêm các ngày trong tháng
      for (let day = 1; day <= daysInMonth; day++) {
        const key = `${month + 1}-${day}`; // Ví dụ: "7-1" cho ngày 1 tháng 7
        const attendanceData = mockAttendance[key] || { status: 'absent', time: '' };
        calendarDays.push({
          day,
          month: month + 1,
          status: attendanceData.status,
          time: attendanceData.time,
        });
      }

      // Điền đủ 7 cột mỗi hàng
      while (calendarDays.length % 7 !== 0) {
        calendarDays.push(null);
      }

      setCalendar(calendarDays);
    }
  }, [displayMonth, currentDate]);

  const goBackMonth = () => {
    setDisplayMonth((prev) => (prev === 0 ? 11 : prev - 1));
  };
  const goNextMonth = () => {
  setDisplayMonth((prev) => (prev === 11 ? 0 : prev + 1));
  };

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
  ];
  const handleDayClick = (day) => {
    if (day) {
      setSelectedDay(day);
      setNote(''); // Reset ghi chú khi mở modal
      setSelectedFile(null); // Reset file khi mở modal
    }
  };

  const handleSubmit = () => {
    if (selectedDay) {
      console.log('Gửi dữ liệu:', {
        day: `${selectedDay.month}-${selectedDay.day}`,
        note,
        file: selectedFile ? selectedFile.name : 'No file',
      });
      alert('Dữ liệu đã được gửi (mô phỏng)!');
      setSelectedDay(null); // Đóng modal
    }
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

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
          disabled={displayMonth === null}
        >
        trước
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
        disabled={displayMonth === null}
        >
        sau
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
                backgroundColor:
                  day === null
                    ? 'transparent'
                    : day.status === 'present'
                    ? '#90ee90' // Màu xanh nhạt cho present
                    : '#ffcccc', // Màu đỏ nhạt cho absent
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
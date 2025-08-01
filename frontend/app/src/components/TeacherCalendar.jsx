import React, { useState, useEffect } from 'react';

function TeacherCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date()); // Ngày hiện tại (31/07/2025)
  const [displayMonth, setDisplayMonth] = useState(null); // Tháng được hiển thị
  const [calendar, setCalendar] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null); // Ngày được chọn
  const [studentList, setStudentList] = useState([]); // Danh sách học sinh dựa trên ngày

  // Dữ liệu giả cho điểm danh học sinh (tháng 7, 8/2025)
  const mockAttendance = {
    '7-1': [
      { name: 'Nguyễn An', status: 'present' },
      { name: 'Trần Bình', status: 'absent' },
      { name: 'Lê Cường', status: 'present' },
    ],
    '7-2': [
      { name: 'Nguyễn An', status: 'absent' },
      { name: 'Trần Bình', status: 'present' },
    ],
    '7-3': [
      { name: 'Lê Cường', status: 'present' },
      { name: 'Nguyễn An', status: 'absent' },
    ],
    '7-5': [
      { name: 'Trần Bình', status: 'absent' },
      { name: 'Lê Cường', status: 'present' },
    ],
    '7-31': [
      { name: 'Nguyễn An', status: 'present' },
      { name: 'Trần Bình', status: 'absent' },
      { name: 'Lê Cường', status: 'present' },
    ], // Thêm ngày hiện tại
    '8-1': [
      { name: 'Nguyễn An', status: 'present' },
      { name: 'Lê Cường', status: 'absent' },
    ],
  };

  useEffect(() => {
    const updateMonth = () => {
      const now = new Date();
      setCurrentDate(now);
      setDisplayMonth(now.getMonth()); // Cập nhật tháng hiện tại (7 cho tháng 7)
    };

    updateMonth();
    const interval = setInterval(updateMonth, 60000); // Kiểm tra mỗi phút
    return () => clearInterval(interval); // Dọn dẹp interval
  }, []);

  useEffect(() => {
    if (displayMonth !== null) {
      const year = currentDate.getFullYear();
      const month = displayMonth;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const firstDay = new Date(year, month, 1).getDay();

      const calendarDays = [];
      for (let i = 0; i < firstDay; i++) {
        calendarDays.push(null);
      }
      for (let day = 1; day <= daysInMonth; day++) {
        const key = `${month + 1}-${day}`;
        calendarDays.push({
          day,
          month: month + 1,
          hasAttendance: !!mockAttendance[key], // Kiểm tra xem ngày có dữ liệu điểm danh không
        });
      }
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
      const key = `${day.month}-${day.day}`;
      setStudentList(mockAttendance[key] || []); // Lấy danh sách học sinh dựa trên ngày
    }
  };

  return (
    <div style={{ marginLeft: '30px', padding: '20px', color: '#333' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>Theo dõi điểm danh học sinh</h1>
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
                backgroundColor: day === null ? 'transparent' : day.hasAttendance ? '#90ee90' : 'transparent',
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
            maxHeight: '70vh',
            overflowY: 'auto',
          }}
        >
          <h3>Danh sách học sinh - Ngày {selectedDay.day}/{selectedDay.month}/{currentDate.getFullYear()}</h3>
          {studentList.length > 0 ? (
            <ul>
              {studentList.map((student, index) => (
                <li key={index} style={{ margin: '5px 0', color: student.status === 'present' ? '#90ee90' : '#ffcccc' }}>
                  {student.name} - {student.status === 'present' ? 'Đã điểm danh' : 'Chưa điểm danh'}
                </li>
              ))}
            </ul>
          ) : (
            <p>Không có dữ liệu điểm danh trong ngày này.</p>
          )}
          <button
            style={{
              padding: '5px 10px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '10px',
            }}
            onClick={() => setSelectedDay(null)}
          >
            Đóng
          </button>
        </div>
      )}
    </div>
  );
}

export default TeacherCalendar;
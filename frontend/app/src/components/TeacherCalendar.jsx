import React, { useState, useEffect } from 'react';

function TeacherCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendar, setCalendar] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [studentList, setStudentList] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch attendance data từ API
  useEffect(() => {
    fetchAttendanceData();
  }, [currentDate]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1; // +1 vì getMonth() trả về 0-11
      
      const response = await fetch(
        `http://localhost:5001/api/teacher/attendance?year=${year}&month=${month}`,
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
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
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
      calendarDays.push({
        day,
        month: month + 1,
        hasAttendance: !!attendanceData[key],
      });
    }
    
    // Điền đủ 7 cột
    while (calendarDays.length % 7 !== 0) {
      calendarDays.push(null);
    }

    setCalendar(calendarDays);
  }, [currentDate, attendanceData]);

  const goBackMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const goNextMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
  ];

  const handleDayClick = (day) => {
    if (day) {
      setSelectedDay(day);
      const key = `${day.month}-${day.day}`;
      setStudentList(attendanceData[key] || []);
    }
  };

  if (loading) {
    return <div style={{ marginLeft: '30px', padding: '20px' }}>Đang tải dữ liệu...</div>;
  }

  return (
    <div style={{ marginLeft: '30px', padding: '20px', color: '#333' }}>
      <h1 style={{ fontSize: '30px', marginBottom: '10px',textAlign: 'center' }}>Theo dõi điểm danh học sinh</h1>
      <div>
        <h2 style={{ fontSize: '25px', marginBottom: '5px',textAlign: 'center' }}>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
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
                  {student.full_name || student.name} - {student.status === 'present' ? 'Đã điểm danh' : 'Vắng mặt'}
                  {student.check_in_time && <span> ({student.check_in_time})</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p>Không có dữ liệu điểm danh trong ngày này.</p>
          )}
          <button
            style={{
              padding: '5px 10px',
              backgroundColor: '#CC0000',
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
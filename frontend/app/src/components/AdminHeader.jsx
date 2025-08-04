import React from 'react';

function AdminHeader() {
  return (
    <div
      style={{
        display: 'flex',
        marginLeft: '300px',
        marginTop: '70px',
        gap: '100px', 
      }}
    >
      <img src="/add_user.png" alt="Logo 1" style={{ width: '150px', height: '150px' }} />
      <img src="/student.png" alt="Logo 2" style={{ width: '150px', height: '150px' }} />
      <img src="teacher.png" alt="Logo 3" style={{ width: '150px', height: '150px' }} />
    </div>
  );
}

export default AdminHeader;
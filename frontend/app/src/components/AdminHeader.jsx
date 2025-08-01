import React from 'react';

function AdminHeader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', maxWidth: '600px' }}>
      <img src="/add_user.png" alt="Logo 1" style={{ width: '100px', height: '100px' }} />
      <img src="/student.png" alt="Logo 2" style={{ width: '100px', height: '100px' }} />
      <img src="teacher.png" alt="Logo 3" style={{ width: '100px', height: '100px' }} />
    </div>
  );
}

export default AdminHeader;
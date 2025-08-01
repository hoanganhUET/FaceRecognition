import React, { useState } from 'react';
import AdminHeader from './AdminHeader';
import AdminNavigation from './AdminNavigation';
import CreateAccount from './CreateAccount';
import ManageStudents from './ManageStudents';
import ManageTeachers from './ManageTeachers';

function AdminDashboard() {
  const [activeSection, setActiveSection] = useState(null);

  return (
    <div style={{ marginLeft: '30px', padding: '20px', color: '#333' }}>
      <h1 style={{ marginBottom: '10px', fontSize: '40px' }}>Admin: ĐVA</h1>
      <AdminHeader />
      <AdminNavigation
        onCreateAccount={() => setActiveSection('create')}
        onManageStudents={() => setActiveSection('students')}
        onManageTeachers={() => setActiveSection('teachers')}
      />
      {activeSection === 'create' && <CreateAccount onClose={() => setActiveSection(null)} />}
      {activeSection === 'students' && <ManageStudents />}
      {activeSection === 'teachers' && <ManageTeachers />}
    </div>
  );
}

export default AdminDashboard;
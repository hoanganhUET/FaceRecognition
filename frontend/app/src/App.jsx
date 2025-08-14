import React from 'react';
import { Routes, Route } from 'react-router-dom';
import CameraComponent from './components/CameraComponent';
import AdminDashboard from './components/AdminDashboard';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';

function App() {
  return (
    <div style={{ width: '100%', minwidth: '100%', height: '100vh', margin: 0, padding: 0 }}>
    <Routes>
      <Route
        path="/"
        element={
          <>
            <CameraComponent />
          </>
        }
      />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/student" element={<StudentDashboard />} />
      <Route path="/teacher" element={<TeacherDashboard />} />
    </Routes>
    </div>
  );
}

export default App;
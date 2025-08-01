import React from 'react';
import { Routes, Route } from 'react-router-dom';
import CameraComponent from './components/CameraComponent';
import LoginComponent from './components/LoginComponent';
import AdminDashboard from './components/AdminDashboard';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <>
            <CameraComponent />
            <LoginComponent />
          </>
        }
      />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/student" element={<StudentDashboard />} />
      <Route path="/teacher" element={<TeacherDashboard />} />
    </Routes>
  );
}

export default App;
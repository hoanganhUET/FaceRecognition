import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import App from './App'; // Tạo file App.jsx mới

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// import CameraComponent from './components/CameraComponent';
// import LoginComponent from './components/LoginComponent';

// function App() {
//   return (
//     <div>
//       <CameraComponent />
//       <LoginComponent />
//     </div>
//   );
// }

// ReactDOM.createRoot(document.getElementById('root')).render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// );
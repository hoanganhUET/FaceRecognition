import React, { useEffect, useRef, useState } from 'react';
import LoginComponent from './LoginComponent';

function CameraComponent() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionResult, setDetectionResult] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [faceDetectionActive, setFaceDetectionActive] = useState(true); // Auto-start face detection
  const [detectedFaces, setDetectedFaces] = useState([]);

  useEffect(() => {
    async function setupCamera() {
      const video = videoRef.current;
      if (video) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 }
            }
          });
          video.srcObject = stream;
          video.play();
          console.log('Camera connected successfully');
          
          // Start face detection after camera is ready
          video.onloadedmetadata = () => {
            setupCanvas();
            // Auto-start face detection
            setTimeout(() => {
              startFaceDetection();
            }, 1000); // Wait 1 second for camera to fully initialize
          };
        } catch (error) {
          console.error('Lỗi khi truy cập camera:', error.name, error.message);
        }
      } else {
        console.error('Không tìm thấy thẻ video');
      }
    }
    setupCamera();

    return () => {
      // Cleanup stream khi component unmount
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      // Clear detection interval
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, []);

  const setupCanvas = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
    }
  };

  const drawFaceRectangles = (faces, videoElement, canvasElement) => {
    const ctx = canvasElement.getContext('2d');
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    console.log('Drawing faces:', faces); // Debug log
    
    faces.forEach((face, index) => {
      // Draw rectangle around face
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 3;
      ctx.strokeRect(
        face.x,
        face.y,
        face.width,
        face.height
      );
      
      // Draw confidence score
      ctx.fillStyle = '#00ff00';
      ctx.font = '16px Arial';
      ctx.fillText(
        `Face ${index + 1}: ${(face.confidence * 100).toFixed(1)}%`,
        face.x,
        face.y - 10
      );
    });
  };

  const detectFaces = async () => {
    if (!videoRef.current || !canvasRef.current || !faceDetectionActive) return;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    // Use video's actual dimensions for canvas
    const videoWidth = videoRef.current.videoWidth;
    const videoHeight = videoRef.current.videoHeight;
    
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    
    context.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight);
    const imageData = canvas.toDataURL('image/jpeg', 0.8); // Better quality

    try {
      const response = await fetch('http://localhost:5001/api/face/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData }),
      });
      
      const result = await response.json();
      console.log('Face detection result:', result); // Debug log
      
      if (response.ok && result.faces && result.faces.length > 0) {
        setDetectedFaces(result.faces);
        drawFaceRectangles(result.faces, videoRef.current, canvasRef.current);
      } else {
        setDetectedFaces([]);
        // Clear canvas if no faces detected
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    } catch (error) {
      console.error('Face detection error:', error);
      // Don't update UI on error, just continue
    }
  };

  const startFaceDetection = () => {
    console.log('Starting face detection...'); // Debug log
    setFaceDetectionActive(true);
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }
    detectionIntervalRef.current = setInterval(() => {
      detectFaces();
    }, 1000); // Faster interval: 1 second for better responsiveness
  };

  const stopFaceDetection = () => {
    setFaceDetectionActive(false);
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    setDetectedFaces([]);
    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  // Thêm function để capture và gửi ảnh để nhận diện
  const captureAndRecognize = async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    // Use higher resolution for better quality
    canvas.width = Math.min(videoRef.current.videoWidth, 640);
    canvas.height = Math.min(videoRef.current.videoHeight, 480);
    
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    // Apply some basic enhancement
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    // You could add client-side image enhancement here
    
    const processedImageData = canvas.toDataURL('image/jpeg', 0.95); // Higher quality

    try {
      setIsDetecting(true);
      
      const response = await fetch('http://localhost:5001/api/face/recognize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image: processedImageData
          // Bỏ user_id - hệ thống sẽ tự nhận diện
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setDetectionResult('success');
        setAttendanceStatus(`Điểm danh thành công! ${result.user_name}\nĐộ tin cậy: ${(result.confidence_score * 100).toFixed(1)}%`);
        
        // Draw recognition result rectangle if coordinates are available
        if (result.face_coordinates && canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          
          // Draw success rectangle in green
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 4;
          ctx.strokeRect(
            result.face_coordinates.x,
            result.face_coordinates.y,
            result.face_coordinates.width,
            result.face_coordinates.height
          );
          
          // Draw success label
          ctx.fillStyle = '#00ff00';
          ctx.font = 'bold 18px Arial';
          ctx.fillText(
            `✓ ${result.user_name}`,
            result.face_coordinates.x,
            result.face_coordinates.y - 10
          );
        }
      } else {
        setDetectionResult('failed');
        setAttendanceStatus(result.error);
        
        // Draw failed recognition rectangle if coordinates are available
        if (result.face_coordinates && canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          
          // Draw failed rectangle in red
          ctx.strokeStyle = '#CC0000';
          ctx.lineWidth = 4;
          ctx.strokeRect(
            result.face_coordinates.x,
            result.face_coordinates.y,
            result.face_coordinates.width,
            result.face_coordinates.height
          );
          
          // Draw failed label
          ctx.fillStyle = '#CC0000';
          ctx.font = 'bold 16px Arial';
          ctx.fillText(
            '✗ Không nhận diện được',
            result.face_coordinates.x,
            result.face_coordinates.y - 10
          );
        }
        
        // Provide helpful suggestions
        if (result.suggestion) {
          setAttendanceStatus(result.error + '\n\n' + result.suggestion);
        }
      }
    } catch (error) {
      setDetectionResult('error');
      setAttendanceStatus('Lỗi kết nối. Vui lòng thử lại.');
      console.error('Connection error:', error);
    } finally {
      setIsDetecting(false);
    }
  };

  // Add debug function
  const debugRecognition = async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    context.drawImage(videoRef.current, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg');

    try {
      const response = await fetch('http://localhost:5001/api/face/debug-recognition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ image: imageData }),
      });

      const result = await response.json();
      setDebugInfo(result);
      console.log('Debug info:', result);
    } catch (error) {
      console.error('Debug error:', error);
    }
  };

  return (
    <div
      id="videoContainer"
      style={{
        display: 'flex',
        flexDirection: 'row',
        boxSizing: 'border-box',
        width: '100%',
        height: '100vh',
        minHeight: '600px',
        maxHeight:'100vh',
        margin:'0px',
      }}
    >
      {/* Camera + Nút bấm */}
      <div style={{ flex: '1 0 50%', minWidth: '50vw', maxWidth: '50vw',paddingRight: '20px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', }}>
        <div style={{
          position: 'relative',
          width: '100%',
          height: 'calc(100% - 60px)', // Dành chỗ cho nút bấm
          minHeight: '300px',
          overflow: 'hidden', // Ngăn co giãn
        }}>
          <video
            ref={videoRef}
            style={{ width: '95%', height: '95%',marginTop: '30px', marginLeft:'30px', borderRadius: '30px', objectFit: 'cover' }}
            autoPlay
            muted
            playsInline
          />
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none'
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '5px', marginTop: '5px', justifyContent: 'center' }}>
          <button onClick={captureAndRecognize} disabled={isDetecting}>
            {isDetecting ? 'Đang nhận diện...' : 'Điểm danh'}
          </button>
          <button 
            onClick={faceDetectionActive ? stopFaceDetection : startFaceDetection}
            style={{ marginLeft: '5px', backgroundColor: faceDetectionActive ? '#CC0000' : '#007bff' }}
          >
            {faceDetectionActive ? 'Tắt phát hiện khuôn mặt' : 'Bật phát hiện khuôn mặt'}
          </button>
          <button onClick={debugRecognition} style={{ marginLeft: '5px' }}>
            Debug Recognition
          </button>
        </div>
      </div>

      {/* Phần đăng nhập và thông báo */}
      <div style={{ flex: '1 0 50%', minWidth: '50vw', maxWidth: '50vw',display: 'flex', flexDirection: 'column',boxSizing: 'border-box', }}>
        <LoginComponent />
        <div style={{ marginTop: '100px', flex: '1', 
            paddingBottom: '80px', 
            paddingRight:'40px',
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            alignItems: 'center', 
            whiteSpace: 'normal', 
            overflowWrap: 'break-word', 
            textAlign: 'center' }}>
          {isDetecting && <p style={{ color: 'red' }}>Đang nhận diện...</p>}
          {detectionResult === 'failed' && <p style={{ color: 'red' }}>{attendanceStatus}</p>}
          {detectionResult === 'success' && <p style={{ color: 'green' }}>{attendanceStatus}</p>}
          {detectionResult === 'error' && <p style={{ color: 'orange' }}>{attendanceStatus}</p>}
          {faceDetectionActive && (
            <p style={{ color: 'blue', marginTop: '10px' }}>
              Phát hiện: {detectedFaces.length} khuôn mặt
            </p>
          )}
          {debugInfo && (
      <div style={{ 
        marginTop: '5px', 
        maxWidth: '90%', 
        boxSizing: 'border-box', 
        color: 'black',
        overflow: 'auto', 
        textAlign: 'left' 
      }}>
        <h4>Debug Information:</h4>
        <p>Registered faces: {debugInfo.registered_faces}</p>
        <p>Best score: {(debugInfo.best_score * 100).toFixed(1)}%</p>
        <p>Recognition result: {debugInfo.recognition_result?.match_found ? 'Success' : 'Failed'}</p>
        {debugInfo.scores && (
          <div>
            <p>Individual scores:</p>
            {debugInfo.scores.map((score, index) => (
              <div key={index}>
                Face {index}: {(score.similarity_score * 100).toFixed(1)}%
              </div>
            ))}
          </div>
        )}
      </div>
    )}
      </div>
      </div>
    </div>
  );
}

export default CameraComponent;
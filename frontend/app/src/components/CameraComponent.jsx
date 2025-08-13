import React, { useEffect, useRef, useState } from 'react';

function CameraComponent() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionResult, setDetectionResult] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [faceDetectionActive, setFaceDetectionActive] = useState(false);
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
            if (faceDetectionActive) {
              startFaceDetection();
            }
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
    
    // Get the scale factors between video dimensions and displayed dimensions
    const videoRect = videoElement.getBoundingClientRect();
    const scaleX = canvasElement.width / videoRect.width;
    const scaleY = canvasElement.height / videoRect.height;
    
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
    
    // Use smaller resolution for real-time detection (better performance)
    const maxWidth = 320; // Reduce resolution for better performance
    const videoWidth = videoRef.current.videoWidth;
    const videoHeight = videoRef.current.videoHeight;
    
    let canvasWidth, canvasHeight;
    if (videoWidth > maxWidth) {
      const scale = maxWidth / videoWidth;
      canvasWidth = maxWidth;
      canvasHeight = videoHeight * scale;
    } else {
      canvasWidth = videoWidth;
      canvasHeight = videoHeight;
    }
    
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    context.drawImage(videoRef.current, 0, 0, canvasWidth, canvasHeight);
    const imageData = canvas.toDataURL('image/jpeg', 0.5); // Lower quality for speed

    try {
      const response = await fetch('http://localhost:5001/api/face/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData }),
      });
      
      const result = await response.json();
      
      if (response.ok && result.faces && result.faces.length > 0) {
        // Scale face coordinates back to original video size if needed
        const scaleX = videoWidth / canvasWidth;
        const scaleY = videoHeight / canvasHeight;
        
        const scaledFaces = result.faces.map(face => ({
          ...face,
          x: face.x * scaleX,
          y: face.y * scaleY,
          width: face.width * scaleX,
          height: face.height * scaleY
        }));
        
        setDetectedFaces(scaledFaces);
        drawFaceRectangles(scaledFaces, videoRef.current, canvasRef.current);
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
    setFaceDetectionActive(true);
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }
    detectionIntervalRef.current = setInterval(() => {
      detectFaces();
    }, 1500); // Slower interval: 1.5 seconds for better performance
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
          ctx.strokeStyle = '#ff0000';
          ctx.lineWidth = 4;
          ctx.strokeRect(
            result.face_coordinates.x,
            result.face_coordinates.y,
            result.face_coordinates.width,
            result.face_coordinates.height
          );
          
          // Draw failed label
          ctx.fillStyle = '#ff0000';
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
        width: '560px',
        height: '560px',
        position: 'absolute',
        top: '40px',
        left: '50px',
      }}
    >
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <video
          ref={videoRef}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
      <div>
        {isDetecting && <p>Đang nhận diện...</p>}
        {detectionResult === 'success' && <p style={{ color: 'green' }}>{attendanceStatus}</p>}
        {detectionResult === 'failed' && <p style={{ color: 'red' }}>{attendanceStatus}</p>}
        {detectionResult === 'error' && <p style={{ color: 'orange' }}>{attendanceStatus}</p>}
        
        {faceDetectionActive && (
          <p style={{ color: 'blue' }}>
            Phát hiện {detectedFaces.length} khuôn mặt
          </p>
        )}
      </div>
      
      <div style={{ marginTop: '10px' }}>
        <button onClick={captureAndRecognize} disabled={isDetecting}>
          {isDetecting ? 'Đang nhận diện...' : 'Điểm danh'}
        </button>
        
        <button 
          onClick={faceDetectionActive ? stopFaceDetection : startFaceDetection}
          style={{ marginLeft: '10px', backgroundColor: faceDetectionActive ? '#dc3545' : '#007bff' }}
        >
          {faceDetectionActive ? 'Tắt phát hiện khuôn mặt' : 'Bật phát hiện khuôn mặt'}
        </button>
        
        <button onClick={debugRecognition} style={{ marginLeft: '10px' }}>
          Debug Recognition
        </button>
      </div>
      
      {/* Debug information display */}
      {debugInfo && (
        <div style={{ marginTop: '10px', padding: '10px', background: '#f0f0f0' }}>
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
  );
}

export default CameraComponent;
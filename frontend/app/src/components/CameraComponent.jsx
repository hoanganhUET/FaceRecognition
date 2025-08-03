import React, { useEffect, useRef, useState } from 'react';

function CameraComponent() {
  const videoRef = useRef(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionResult, setDetectionResult] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    async function setupCamera() {
      const video = videoRef.current;
      if (video) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          video.srcObject = stream;
          video.play();
          console.log('Camera connected successfully');
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
    };
  }, []);

  // Thêm function để capture và gửi ảnh để nhận diện
  const captureAndRecognize = async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    context.drawImage(videoRef.current, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg');

    try {
      setIsDetecting(true);
      const response = await fetch('http://localhost:5001/api/face/recognize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ image: imageData }),
      });

      const result = await response.json();

      if (response.ok) {
        setDetectionResult('success');
        setAttendanceStatus('Điểm danh thành công!');
        
        // Add more detailed feedback
        console.log('Recognition result:', result);
        if (result.confidence_score) {
          setAttendanceStatus(`Điểm danh thành công! Độ tin cậy: ${(result.confidence_score * 100).toFixed(1)}%`);
        }
      } else {
        setDetectionResult('failed');
        setAttendanceStatus(result.error);
        console.log('Recognition failed:', result);
      }
    } catch (error) {
      setDetectionResult('error');
      setAttendanceStatus('Lỗi kết nối');
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
      <video
        ref={videoRef}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        autoPlay
        muted
        playsInline
      />
      <div>
        {isDetecting && <p>Đang nhận diện...</p>}
        {detectionResult === 'success' && <p style={{ color: 'green' }}>{attendanceStatus}</p>}
        {detectionResult === 'failed' && <p style={{ color: 'red' }}>{attendanceStatus}</p>}
        {detectionResult === 'error' && <p style={{ color: 'orange' }}>{attendanceStatus}</p>}
      </div>
      
      <div style={{ marginTop: '10px' }}>
        <button onClick={captureAndRecognize} disabled={isDetecting}>
          {isDetecting ? 'Đang nhận diện...' : 'Điểm danh'}
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
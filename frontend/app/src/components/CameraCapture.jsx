import React, { useState, useRef, useEffect } from 'react';

function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      // Yêu cầu chất lượng camera cao hơn
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: 'user',
          frameRate: { ideal: 30 }
        }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // Đợi video sẵn sàng
        videoRef.current.onloadedmetadata = () => {
          setIsReady(true);
        };
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.');
    }
  };

  const captureImage = () => {
    if (!videoRef.current || !isReady) {
      alert('Camera chưa sẵn sàng. Vui lòng đợi một chút.');
      return;
    }

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    // Sử dụng kích thước thực tế của video
    const videoWidth = videoRef.current.videoWidth;
    const videoHeight = videoRef.current.videoHeight;
    
    if (videoWidth === 0 || videoHeight === 0) {
      alert('Video chưa tải xong. Vui lòng thử lại.');
      return;
    }
    
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    
    // Vẽ ảnh với chất lượng cao
    context.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight);
    
    // Cải thiện chất lượng ảnh
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Tăng độ tương phản và độ sáng nhẹ
    for (let i = 0; i < data.length; i += 4) {
      // Tăng độ tương phản
      data[i] = Math.min(255, Math.max(0, (data[i] - 128) * 1.1 + 128)); // Red
      data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * 1.1 + 128)); // Green
      data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * 1.1 + 128)); // Blue
    }
    
    context.putImageData(imageData, 0, 0);
    
    // Xuất với chất lượng cao (0.95 thay vì mặc định 0.92)
    const processedImageData = canvas.toDataURL('image/jpeg', 0.95);
    
    onCapture(processedImageData);
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100%', 
      height: '100%', 
      backgroundColor: 'rgba(0,0,0,0.8)', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center' }}>
        <h3>Chụp ảnh</h3>
        <div style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>
          Hãy giữ khuôn mặt thẳng và đảm bảo ánh sáng đủ
        </div>
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline
          muted
          style={{ 
            width: '400px', 
            height: '300px', 
            border: '2px solid #ccc',
            borderRadius: '5px',
            backgroundColor: '#000'
          }}
        />
        {!isReady && (
          <div style={{ marginTop: '10px', color: '#999' }}>
            Đang khởi động camera...
          </div>
        )}
        <div style={{ marginTop: '15px' }}>
          <button 
            onClick={captureImage} 
            disabled={!isReady}
            style={{ 
              marginRight: '10px',
              padding: '10px 20px',
              backgroundColor: isReady ? '#007bff' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: isReady ? 'pointer' : 'not-allowed',
              fontSize: '16px'
            }}
          >
            {isReady ? 'Chụp' : 'Đang tải...'}
          </button>
          <button 
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}

export default CameraCapture;
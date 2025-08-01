import React, { useEffect, useRef } from 'react';

function CameraComponent() {
  const videoRef = useRef(null);

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
    </div>
  );
}

export default CameraComponent;
import React, { useRef, useEffect, useState } from 'react';

function ImageWithFaceDetection({ imageData, faceCoordinates, showDetection = true }) {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (imageData && showDetection) {
      drawImageWithFaceDetection();
    }
  }, [imageData, faceCoordinates, showDetection]);

  const drawImageWithFaceDetection = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    
    if (!canvas || !image || !faceCoordinates) return;

    const ctx = canvas.getContext('2d');
    
    // Wait for image to load
    image.onload = () => {
      // Set canvas size to match display size
      const displayWidth = image.offsetWidth;
      const displayHeight = image.offsetHeight;
      
      canvas.width = displayWidth;
      canvas.height = displayHeight;
      
      // Calculate scale factors
      const scaleX = displayWidth / faceCoordinates.image_width;
      const scaleY = displayHeight / faceCoordinates.image_height;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw face rectangle
      const scaledX = faceCoordinates.x * scaleX;
      const scaledY = faceCoordinates.y * scaleY;
      const scaledWidth = faceCoordinates.width * scaleX;
      const scaledHeight = faceCoordinates.height * scaleY;
      
      // Draw green rectangle for detected face    
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 3;
      ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);
      
      // Draw label
      ctx.fillStyle = '#00ff00';
      ctx.font = 'bold 16px Arial';
      ctx.fillText('✓ Khuôn mặt được phát hiện', scaledX, scaledY - 10);
      
      setImageDimensions({ width: displayWidth, height: displayHeight });
    };
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <img
        ref={imageRef}
        src={imageData}
        alt="Preview"
        style={{
          maxWidth: '300px',
          maxHeight: '300px',
          border: '2px solid #ddd',
          borderRadius: '8px'
        }}
      />
      {showDetection && faceCoordinates && (
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
            borderRadius: '8px'
          }}
        />
      )}
    </div>
  );
}

export default ImageWithFaceDetection;

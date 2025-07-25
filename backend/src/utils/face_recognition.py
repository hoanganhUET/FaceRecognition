import cv2
import numpy as np
import base64
import os
from PIL import Image
import io
import pickle

class SimpleFaceRecognition:
    def __init__(self):
        # Load OpenCV's pre-trained face detection model
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
    def decode_base64_image(self, base64_string):
        """Decode base64 image to OpenCV format"""
        try:
            # Remove data:image/jpeg;base64, prefix if present
            if ',' in base64_string:
                base64_string = base64_string.split(',')[1]
            
            # Decode base64
            image_data = base64.b64decode(base64_string)
            
            # Convert to PIL Image
            pil_image = Image.open(io.BytesIO(image_data))
            
            # Convert to RGB if necessary
            if pil_image.mode != 'RGB':
                pil_image = pil_image.convert('RGB')
            
            # Convert to OpenCV format (BGR)
            opencv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
            
            return opencv_image
        except Exception as e:
            raise ValueError(f"Invalid image data: {str(e)}")
    
    def detect_faces(self, image):
        """Detect faces in image and return face regions"""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(gray, 1.1, 4)
        return faces
    
    def extract_face_features(self, image):
        """Extract simple face features for comparison"""
        faces = self.detect_faces(image)
        
        if len(faces) == 0:
            raise ValueError("No face detected in image")
        
        if len(faces) > 1:
            raise ValueError("Multiple faces detected. Please ensure only one face is visible.")
        
        # Get the largest face
        x, y, w, h = faces[0]
        face_roi = image[y:y+h, x:x+w]
        
        # Resize face to standard size for comparison
        face_resized = cv2.resize(face_roi, (100, 100))
        
        # Convert to grayscale for feature extraction
        face_gray = cv2.cvtColor(face_resized, cv2.COLOR_BGR2GRAY)
        
        # Simple feature extraction using histogram
        hist = cv2.calcHist([face_gray], [0], None, [256], [0, 256])
        
        # Normalize histogram
        hist = cv2.normalize(hist, hist).flatten()
        
        return hist
    
    def encode_face(self, base64_image):
        """Encode face from base64 image"""
        image = self.decode_base64_image(base64_image)
        features = self.extract_face_features(image)
        
        # Serialize features to bytes
        return pickle.dumps(features)
    
    def compare_faces(self, encoding1, encoding2, threshold=0.7):
        """Compare two face encodings and return similarity score"""
        try:
            # Deserialize encodings
            features1 = pickle.loads(encoding1)
            features2 = pickle.loads(encoding2)
            
            # Calculate correlation coefficient
            correlation = cv2.compareHist(features1, features2, cv2.HISTCMP_CORREL)
            
            # Return correlation as confidence score
            return correlation
        except Exception as e:
            return 0.0
    
    def recognize_face(self, base64_image, known_encodings, threshold=0.6):
        """Recognize face against known encodings"""
        try:
            # Extract features from input image
            test_encoding = self.encode_face(base64_image)
            
            best_match_score = 0.0
            best_match_index = -1
            
            # Compare against all known encodings
            for i, known_encoding in enumerate(known_encodings):
                score = self.compare_faces(test_encoding, known_encoding)
                
                if score > best_match_score:
                    best_match_score = score
                    best_match_index = i
            
            # Check if best match exceeds threshold
            if best_match_score >= threshold:
                return best_match_index, best_match_score
            else:
                return None, best_match_score
                
        except Exception as e:
            raise ValueError(f"Face recognition failed: {str(e)}")

# Global instance
face_recognizer = SimpleFaceRecognition()


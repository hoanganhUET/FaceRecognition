import cv2
import numpy as np
import base64
import os
from PIL import Image
import io
import pickle
import face_recognition
from sklearn.metrics.pairwise import cosine_similarity

class AdvancedFaceRecognition:
    def __init__(self):
        # Load Haar Cascade detector (backup)
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        # Use face_recognition library (đã bao gồm HOG + CNN detectors)
        try:
            import face_recognition
            self.use_face_recognition = True
            print("Face recognition library loaded successfully")
        except ImportError:
            self.use_face_recognition = False
            print("Warning: face_recognition library not installed. Using basic detection.")
    
    def detect_faces(self, image):
        """Detect faces using Haar Cascade (fallback method)"""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(gray, 1.1, 4)
        return faces
    
    def detect_faces_advanced(self, image):
        """Advanced face detection using face_recognition library"""
        if self.use_face_recognition:
            # Convert BGR to RGB
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Use face_recognition library's face detection (HOG-based, more accurate)
            face_locations = face_recognition.face_locations(rgb_image, model="hog")
            
            # Convert to (x, y, w, h) format
            faces = []
            for (top, right, bottom, left) in face_locations:
                faces.append((left, top, right - left, bottom - top))
            
            return faces
        else:
            # Fallback to Haar Cascade
            return self.detect_faces(image)
    
    def extract_face_features_advanced(self, image):
        """Advanced feature extraction using face_recognition library"""
        if self.use_face_recognition:
            # Convert BGR to RGB
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Get face encodings using face_recognition library
            face_encodings = face_recognition.face_encodings(rgb_image, model="large")
            
            if len(face_encodings) == 0:
                raise ValueError("No face detected in image")
            
            if len(face_encodings) > 1:
                raise ValueError("Multiple faces detected. Please ensure only one face is visible.")
            
            return face_encodings[0]
        else:
            # Fallback to basic methods
            faces = self.detect_faces_advanced(image)
            
            if len(faces) == 0:
                raise ValueError("No face detected in image")
            
            if len(faces) > 1:
                raise ValueError("Multiple faces detected. Please ensure only one face is visible.")
            
            x, y, w, h = faces[0]
            face_roi = image[y:y+h, x:x+w]
            
            # Basic feature extraction
            face_gray = cv2.cvtColor(face_roi, cv2.COLOR_BGR2GRAY)
            face_resized = cv2.resize(face_gray, (100, 100))
            
            # Extract LBP features
            lbp_features = self.extract_lbp_features(face_resized)
            
            # Extract HOG features
            hog_features = self.extract_hog_features(face_resized)
            
            # Combine features
            combined_features = np.concatenate([lbp_features, hog_features])
            
            return combined_features
    
    def extract_lbp_features(self, image):
        """Extract Local Binary Pattern features"""
        lbp = np.zeros_like(image)
        for i in range(1, image.shape[0]-1):
            for j in range(1, image.shape[1]-1):
                center = image[i, j]
                binary_string = ''
                
                # 8 neighbors
                neighbors = [
                    image[i-1, j-1], image[i-1, j], image[i-1, j+1],
                    image[i, j+1], image[i+1, j+1], image[i+1, j],
                    image[i+1, j-1], image[i, j-1]
                ]
                
                for neighbor in neighbors:
                    binary_string += '1' if neighbor >= center else '0'
                
                lbp[i, j] = int(binary_string, 2)
        
        # Calculate histogram
        hist, _ = np.histogram(lbp.ravel(), bins=256, range=(0, 256))
        return hist / hist.sum()  # Normalize
    
    def extract_hog_features(self, image):
        """Extract HOG features"""
        from skimage.feature import hog
        
        features = hog(image, orientations=9, pixels_per_cell=(8, 8),
                      cells_per_block=(2, 2), transform_sqrt=True, block_norm='L2-Hys')
        return features
    
    def compare_faces_advanced(self, encoding1, encoding2):
        """Advanced face comparison with improved algorithm"""
        try:
            features1 = pickle.loads(encoding1) if isinstance(encoding1, bytes) else encoding1
            features2 = pickle.loads(encoding2) if isinstance(encoding2, bytes) else encoding2
            
            if self.use_face_recognition and len(features1) == 128 and len(features2) == 128:
                # Use face_recognition's distance calculation for 128D encodings
                distance = face_recognition.face_distance([features1], features2)[0]
                # Improved distance to similarity conversion
                similarity = max(0.0, 1.0 - distance)
                
                # Apply exponential smoothing for better discrimination
                if similarity > 0.5:
                    similarity = similarity ** 0.7  # Boost higher similarities
                
                return max(0.0, min(1.0, similarity))
            else:
                # Ensure same shape
                if features1.shape != features2.shape:
                    return 0.0
                
                # Normalize features for better comparison
                features1 = features1 / np.linalg.norm(features1)
                features2 = features2 / np.linalg.norm(features2)
                
                # Method 1: Cosine similarity
                cosine_sim = np.dot(features1, features2)
                
                # Method 2: Euclidean distance (converted to similarity)
                euclidean_dist = np.linalg.norm(features1 - features2)
                euclidean_sim = 1 / (1 + euclidean_dist)
                
                # Weighted combination with emphasis on cosine similarity
                final_similarity = (cosine_sim * 0.8 + euclidean_sim * 0.2)
                
                return max(0.0, min(1.0, final_similarity))
            
        except Exception as e:
            print(f"Comparison error: {e}")
            return 0.0
    
    def recognize_face_advanced(self, base64_image, known_encodings, threshold=0.6):
        """Advanced face recognition"""
        try:
            # Extract features from input image
            test_encoding = self.encode_face_advanced(base64_image)
            
            best_match_score = 0.0
            best_match_index = -1
            scores = []
            
            # Compare against all known encodings
            for i, known_encoding in enumerate(known_encodings):
                score = self.compare_faces_advanced(test_encoding, known_encoding)
                scores.append(score)
                
                if score > best_match_score:
                    best_match_score = score
                    best_match_index = i
            
            # Lower threshold for better recognition
            if best_match_score >= 0.4:  # Reduced from 0.6 to 0.4
                return best_match_index, best_match_score
            else:
                return None, best_match_score
                
        except Exception as e:
            raise ValueError(f"Face recognition failed: {str(e)}")
    
    def encode_face_advanced(self, base64_image):
        """Advanced face encoding"""
        image = self.decode_base64_image(base64_image)
        features = self.extract_face_features_advanced(image)
        
        # Serialize features to bytes
        return pickle.dumps(features)
    
    def decode_base64_image(self, base64_string):
        """Decode base64 image to OpenCV format"""
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        image_bytes = base64.b64decode(base64_string)
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to OpenCV format
        opencv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        return opencv_image
    
    # Legacy methods for backward compatibility
    def encode_face(self, base64_image):
        """Legacy method for backward compatibility"""
        return self.encode_face_advanced(base64_image)
    
    def recognize_face(self, base64_image, known_encodings, threshold=0.6):
        """Legacy method for backward compatibility"""
        return self.recognize_face_advanced(base64_image, known_encodings, threshold)

# Global instance
face_recognizer = AdvancedFaceRecognition()


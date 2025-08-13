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
    
    def detect_faces_with_coordinates(self, base64_image):
        """Detect faces and return coordinates for drawing rectangles"""
        try:
            # Decode image
            image = self.decode_base64_image(base64_image)
            
            # Convert BGR to RGB
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Detect face locations
            face_locations = face_recognition.face_locations(rgb_image, model="hog")
            
            # Convert to coordinates format for frontend
            faces = []
            for (top, right, bottom, left) in face_locations:
                faces.append({
                    'x': left,
                    'y': top,
                    'width': right - left,
                    'height': bottom - top,
                    'confidence': 0.9  # HOG model doesn't return confidence, so we use a default
                })
            
            return {
                'faces': faces,
                'image_width': image.shape[1],
                'image_height': image.shape[0]
            }
            
        except Exception as e:
            raise ValueError(f"Lỗi khi phát hiện khuôn mặt: {str(e)}")
    
    def detect_faces_realtime_optimized(self, base64_image):
        """Detect faces optimized for real-time processing"""
        try:
            # Decode image
            image = self.decode_base64_image(base64_image)
            
            # Resize image for faster processing if it's too large
            height, width = image.shape[:2]
            if width > 640:
                scale = 640 / width
                new_width = int(width * scale)
                new_height = int(height * scale)
                image = cv2.resize(image, (new_width, new_height))
                # Update scale factor for coordinates
            else:
                scale = 1.0
            
            # Convert BGR to RGB
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Detect face locations using HOG (fastest method)
            face_locations = face_recognition.face_locations(
                rgb_image, 
                model="hog",
                number_of_times_to_upsample=0  # Don't upsample for speed
            )
            
            # Convert to coordinates format for frontend
            faces = []
            for (top, right, bottom, left) in face_locations:
                # Scale coordinates back to original size if image was resized
                scaled_left = int(left / scale)
                scaled_top = int(top / scale)
                scaled_width = int((right - left) / scale)
                scaled_height = int((bottom - top) / scale)
                
                faces.append({
                    'x': scaled_left,
                    'y': scaled_top,
                    'width': scaled_width,
                    'height': scaled_height,
                    'confidence': 0.9  # HOG model doesn't return confidence, so we use a default
                })
            
            return {
                'faces': faces,
                'image_width': int(width / scale) if scale != 1.0 else image.shape[1],
                'image_height': int(height / scale) if scale != 1.0 else image.shape[0]
            }
            
        except Exception as e:
            raise ValueError(f"Lỗi khi phát hiện khuôn mặt: {str(e)}")
    
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
            # Ensure both encodings are properly deserialized
            if isinstance(encoding1, bytes):
                features1 = pickle.loads(encoding1)
            elif isinstance(encoding1, str):
                # Handle string encoded data
                features1 = pickle.loads(encoding1.encode('latin-1'))
            else:
                features1 = encoding1
                
            if isinstance(encoding2, bytes):
                features2 = pickle.loads(encoding2)
            elif isinstance(encoding2, str):
                # Handle string encoded data
                features2 = pickle.loads(encoding2.encode('latin-1'))
            else:
                features2 = encoding2
            
            # Convert to numpy arrays if they aren't already
            features1 = np.array(features1, dtype=np.float64)
            features2 = np.array(features2, dtype=np.float64)
            
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
        """Advanced face recognition with multiple validation steps"""
        try:
            # Decode image and get face coordinates
            image = self.decode_base64_image(base64_image)
            
            # Validate image quality first
            if not self._validate_image_quality(image):
                raise ValueError("Chất lượng ảnh không đủ tốt để nhận diện")
            
            # Convert BGR to RGB
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Detect faces and get locations
            face_locations = face_recognition.face_locations(rgb_image, model="hog")
            
            if len(face_locations) == 0:
                raise ValueError("Không phát hiện được khuôn mặt trong ảnh")
            elif len(face_locations) > 1:
                # Choose the largest face
                face_locations = [max(face_locations, key=lambda x: (x[2]-x[0])*(x[1]-x[3]))]
            
            # Extract face encoding
            face_encodings = face_recognition.face_encodings(rgb_image, face_locations, num_jitters=3, model="large")
            
            if len(face_encodings) == 0:
                raise ValueError("Không thể tạo encoding từ khuôn mặt")
            
            test_encoding = face_encodings[0]
            
            best_match_score = 0.0
            best_match_index = -1
            scores = []
            
            # Compare against all known encodings with weighted scoring
            for i, known_encoding in enumerate(known_encodings):
                try:
                    # Ensure known_encoding is properly formatted
                    if isinstance(known_encoding, bytes):
                        known_encoding = pickle.loads(known_encoding)
                    elif isinstance(known_encoding, str):
                        known_encoding = pickle.loads(known_encoding.encode('latin-1'))
                    
                    # Convert to numpy array
                    known_encoding = np.array(known_encoding, dtype=np.float64)
                    test_encoding_array = np.array(test_encoding, dtype=np.float64)
                    
                    # Calculate similarity score
                    face_distance = face_recognition.face_distance([known_encoding], test_encoding_array)[0]
                    similarity_score = 1 - face_distance  # Convert distance to similarity
                    
                    # Apply confidence weighting
                    weighted_score = self._apply_confidence_weighting(similarity_score, test_encoding_array, known_encoding)
                    scores.append(weighted_score)
                    
                    if weighted_score > best_match_score:
                        best_match_score = weighted_score
                        best_match_index = i
                        
                except Exception as e:
                    print(f"Error processing encoding {i}: {e}")
                    scores.append(0.0)
                    continue
            
            # Dynamic threshold based on image quality and lighting
            dynamic_threshold = self._calculate_dynamic_threshold(image, threshold)
            
            # Get face coordinates for rectangle drawing
            face_location = face_locations[0]
            face_coordinates = {
                'x': face_location[3],  # left
                'y': face_location[0],  # top
                'width': face_location[1] - face_location[3],  # right - left
                'height': face_location[2] - face_location[0],  # bottom - top
                'image_width': rgb_image.shape[1],
                'image_height': rgb_image.shape[0]
            }
            
            if best_match_score >= dynamic_threshold:
                return best_match_index, best_match_score, face_coordinates
            else:
                return None, best_match_score, face_coordinates
                
        except Exception as e:
            raise ValueError(f"Face recognition failed: {str(e)}")
    
    def _validate_image_quality(self, image):
        """Validate image quality for better recognition"""
        # Check image sharpness (Laplacian variance)
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        variance = cv2.Laplacian(gray, cv2.CV_64F).var()
        
        # Check brightness
        mean_brightness = np.mean(gray)
        
        # Check contrast
        contrast = gray.std()
        
        return (variance > 100 and  # Not too blurry
                20 < mean_brightness < 200 and  # Not too dark/bright
                contrast > 30)  # Sufficient contrast

    def _apply_confidence_weighting(self, similarity_score, test_encoding, known_encoding):
        """Apply confidence weighting based on encoding quality"""
        # Calculate encoding strength (how distinctive the features are)
        encoding_strength = np.std(test_encoding) + np.std(known_encoding)
        weight = min(1.2, max(0.8, encoding_strength / 0.1))
        
        return similarity_score * weight

    def _calculate_dynamic_threshold(self, image, base_threshold):
        """Calculate dynamic threshold based on image conditions"""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Adjust threshold based on lighting conditions
        mean_brightness = np.mean(gray)
        if mean_brightness < 50:  # Dark image
            return base_threshold * 0.85
        elif mean_brightness > 200:  # Bright image
            return base_threshold * 0.9
        else:
            return base_threshold
    
    def preprocess_image(self, image):
        """Enhanced image preprocessing for better recognition"""
        # Convert to RGB if needed
        if len(image.shape) == 3 and image.shape[2] == 3:
            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Histogram equalization for better contrast
        if len(image.shape) == 3:
            # Convert to LAB color space
            lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
            lab[:,:,0] = cv2.equalizeHist(lab[:,:,0])
            image = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)
        
        # Noise reduction
        image = cv2.bilateralFilter(image, 9, 75, 75)
        
        # Sharpening
        kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
        image = cv2.filter2D(image, -1, kernel)
        
        return image

    def encode_face_advanced(self, base64_image):
        """Enhanced face encoding with preprocessing"""
        try:
            # Decode image
            image = self.decode_base64_image(base64_image)
            
            # Preprocess image
            processed_image = self.preprocess_image(image)
            
            # Detect faces with multiple methods
            face_locations = face_recognition.face_locations(processed_image, model="hog")
            
            if len(face_locations) == 0:
                # Try with CNN model as fallback
                face_locations = face_recognition.face_locations(processed_image, model="cnn")
            
            if len(face_locations) == 0:
                raise ValueError("Không phát hiện được khuôn mặt trong ảnh")
            elif len(face_locations) > 1:
                # Choose the largest face
                face_locations = [max(face_locations, key=lambda x: (x[2]-x[0])*(x[1]-x[3]))]
            
            # Generate encoding with higher precision
            face_encodings = face_recognition.face_encodings(
                processed_image, 
                face_locations, 
                num_jitters=5,  # Increased for better accuracy
                model="large"   # Use large model for better features
            )
            
            if len(face_encodings) == 0:
                raise ValueError("Không thể tạo encoding từ khuôn mặt")
            
            # Ensure encoding is returned as numpy array with correct dtype
            encoding = np.array(face_encodings[0], dtype=np.float64)
            
            # Return encoding and face coordinates for rectangle drawing
            face_location = face_locations[0]
            face_coordinates = {
                'x': face_location[3],  # left
                'y': face_location[0],  # top
                'width': face_location[1] - face_location[3],  # right - left
                'height': face_location[2] - face_location[0],  # bottom - top
                'image_width': processed_image.shape[1],
                'image_height': processed_image.shape[0]
            }
            
            return encoding, face_coordinates
        
        except Exception as e:
            raise ValueError(f"Lỗi khi encode khuôn mặt: {str(e)}")
    
    def decode_base64_image(self, base64_string):
        """Decode base64 image to OpenCV format"""
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        image_bytes = base64.b64decode(base64_string)
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to OpenCV format
        opencv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        return opencv_image
    
    def encode_face_for_registration(self, base64_image):
        """Optimized face encoding for account registration - Fast version"""
        try:
            # Decode image
            image = self.decode_base64_image(base64_image)
            
            # Simple validation
            if image is None or image.size == 0:
                raise ValueError("Ảnh không hợp lệ")
            
            # Convert BGR to RGB once
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Use HOG model only (much faster than CNN)
            face_locations = face_recognition.face_locations(rgb_image, model="hog")
            
            if len(face_locations) == 0:
                raise ValueError("Không phát hiện được khuôn mặt trong ảnh")
            elif len(face_locations) > 1:
                # Choose the largest face
                face_locations = [max(face_locations, key=lambda x: (x[2]-x[0])*(x[1]-x[3]))]
            
            # Generate encoding with minimal jitters for speed
            face_encodings = face_recognition.face_encodings(
                rgb_image, 
                face_locations, 
                num_jitters=1,  # Reduced from 5 to 1 for speed
                model="small"   # Use small model for faster processing
            )
            
            if len(face_encodings) == 0:
                raise ValueError("Không thể tạo encoding từ khuôn mặt")
            
            # Return encoding as numpy array and face coordinates
            encoding = np.array(face_encodings[0], dtype=np.float64)
            
            # Get face coordinates for rectangle drawing
            face_location = face_locations[0]
            face_coordinates = {
                'x': face_location[3],  # left
                'y': face_location[0],  # top
                'width': face_location[1] - face_location[3],  # right - left
                'height': face_location[2] - face_location[0],  # bottom - top
                'image_width': rgb_image.shape[1],
                'image_height': rgb_image.shape[0]
            }
            
            return encoding, face_coordinates
            
        except Exception as e:
            raise ValueError(f"Lỗi khi encode khuôn mặt: {str(e)}")
    
    # Legacy methods for backward compatibility
    def encode_face(self, base64_image):
        """Legacy method for backward compatibility"""
        result = self.encode_face_advanced(base64_image)
        if isinstance(result, tuple):
            return result[0]  # Return only encoding for backward compatibility
        return result
    
    def recognize_face(self, base64_image, known_encodings, threshold=0.6):
        """Legacy method for backward compatibility"""
        result = self.recognize_face_advanced(base64_image, known_encodings, threshold)
        if len(result) == 3:
            return result[0], result[1]  # Return only match_index and confidence for backward compatibility
        return result

# Global instance
face_recognizer = AdvancedFaceRecognition()


# train.py
import cv2
import os
import numpy as np

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
recognizer = cv2.face.LBPHFaceRecognizer_create()

faces = []
labels = []

data_dir = 'face_data'
label_id = 0

for filename in os.listdir(data_dir):
    if filename.endswith('.jpg'):
        path = os.path.join(data_dir, filename)
        img = cv2.imread(path)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        detected = face_cascade.detectMultiScale(gray, 1.1, 4)

        for (x, y, w, h) in detected:
            roi = gray[y:y+h, x:x+w]
            faces.append(roi)
            labels.append(label_id)

recognizer.train(faces, np.array(labels))
recognizer.save("trainer/lbph_model.yml")
print("✅ Model trained & saved")

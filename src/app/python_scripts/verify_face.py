import sys
import face_recognition
import numpy as np
import json
import io

def main():
    try:
        input_data = json.loads(sys.stdin.read())

        image_bytes = bytes(input_data['image'])
        db_face = input_data['db_face']  # hanya satu face yang dikirim

        # Load image & detect face
        image = face_recognition.load_image_file(io.BytesIO(image_bytes))
        face_locations = face_recognition.face_locations(image)

        if not face_locations:
            print(json.dumps({ "status": "error", "message": "No face detected" }))
            return

        encodings = face_recognition.face_encodings(image, face_locations)
        if not encodings:
            print(json.dumps({ "status": "error", "message": "Encoding failed" }))
            return

        input_encoding = encodings[0]

        known_encoding = np.array(db_face['face_encoding'])
        user_id = db_face['user_id']

        # Bandingkan wajah input dengan wajah user login
        match = face_recognition.compare_faces([known_encoding], input_encoding, tolerance=0.4)

        if match[0]:
            print(json.dumps({ "status": "success", "match": True, "user_id": user_id }))
        else:
            print(json.dumps({ "status": "success", "match": False }))
    except Exception as e:
        print(json.dumps({ "status": "error", "message": str(e) }))
        sys.exit(1)

if __name__ == "__main__":
    main()

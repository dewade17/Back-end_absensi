import sys
import face_recognition
import numpy as np
import json
import io

def main():
    try:
        input_data = json.loads(sys.stdin.read())

        image_bytes = bytes(input_data['image'])
        db_faces = input_data['db_faces']

        image = face_recognition.load_image_file(io.BytesIO(image_bytes))
        face_locations = face_recognition.face_locations(image)

        if not face_locations:
            print(json.dumps({ "status": "error", "message": "No face detected" }))
            sys.exit(0)

        encodings = face_recognition.face_encodings(image, face_locations)
        if not encodings:
            print(json.dumps({ "status": "error", "message": "Encoding failed" }))
            sys.exit(0)

        input_encoding = encodings[0]

        for face in db_faces:
            known_encoding = np.array(face['face_encoding'])
            result = face_recognition.compare_faces([known_encoding], input_encoding, tolerance=0.4)
            if result[0]:
                print(json.dumps({ "status": "success", "match": True, "user_id": face['user_id'] }))
                sys.exit(0)

        print(json.dumps({ "status": "success", "match": False }))
    except Exception as e:
        print(json.dumps({ "status": "error", "message": str(e) }))
        sys.exit(1)

if __name__ == "__main__":
    main()

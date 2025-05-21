import sys
import face_recognition
import numpy as np
import json
import io

def main():
    try:
        image_bytes = sys.stdin.buffer.read()
        image = face_recognition.load_image_file(io.BytesIO(image_bytes))
        face_locations = face_recognition.face_locations(image)

        if not face_locations:
            print(json.dumps({ "status": "error", "message": "No face detected" }))
            sys.exit(0)

        encodings = face_recognition.face_encodings(image, face_locations)

        if not encodings:
            print(json.dumps({ "status": "error", "message": "Failed to encode face" }))
            sys.exit(0)

        encoding_list = encodings[0].tolist()

        print(json.dumps({ "status": "success", "face_encoding": encoding_list }))
    except Exception as e:
        print(json.dumps({ "status": "error", "message": str(e) }))
        sys.exit(1)

if __name__ == "__main__":
    main()

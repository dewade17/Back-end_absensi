import sys
import json
import numpy as np
from PIL import Image
import face_recognition

print("PYTHON PATH:", sys.executable)
print("face_recognition ready")

def validate_image(path):
    try:
        with Image.open(path) as img:
            img.load()  # ✅ Gunakan load(), jangan verify()
        return True
    except Exception as e:
        print(json.dumps({ "status": "error", "message": f"PIL cannot load image: {str(e)}" }))
        return False

def main(image_path, db_json):
    if not validate_image(image_path):
        return

    try:
        # Load gambar untuk face_recognition
        image = face_recognition.load_image_file(image_path)

        # Simpan gambar untuk debugging manual
        img = Image.fromarray(image)
        img.save("debug_uploaded_image.jpg")

        # Deteksi lokasi wajah
        face_locations = face_recognition.face_locations(image)
        print("Detected face locations:", face_locations)

        # Ekstrak encoding wajah
        encodings = face_recognition.face_encodings(image, known_face_locations=face_locations)

        if not encodings:
            print(json.dumps({ "status": "error", "message": "No face detected" }))
            return

        input_encoding = encodings[0]
        db_faces = json.loads(db_json)

        for face in db_faces:
            try:
                known_encoding = np.array(json.loads(face["face_encoding"]))
            except Exception:
                continue  # Skip jika parsing gagal

            result = face_recognition.compare_faces([known_encoding], input_encoding, tolerance=0.5)

            if result[0]:
                print(json.dumps({
                    "status": "success",
                    "match": True,
                    "user_id": face["user_id"]
                }))
                return

        print(json.dumps({ "status": "success", "match": False }))
    except Exception as e:
        print(json.dumps({ "status": "error", "message": str(e) }))

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print(json.dumps({ "status": "error", "message": "Missing image or DB data" }))
    else:
        main(sys.argv[1], sys.argv[2])

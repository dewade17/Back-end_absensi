import path from 'path';
import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

export async function POST(request) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const pythonScriptPath = path.join(__dirname, '../../python_scripts/verify_face.py');

  const data = await request.formData();
  const image = data.get('image');
  const db_faces_json = data.get('db_faces');

  if (!image || !db_faces_json) {
    return NextResponse.json({ status: 'error', message: 'Missing image or db_faces' }, { status: 400 });
  }

  const buffer = Buffer.from(await image.arrayBuffer());

  // 📍 TAMBAHKAN INI DI SINI!!
  const parsedDbFaces = JSON.parse(db_faces_json).map((face) => ({
    ...face,
    face_encoding: JSON.parse(face.face_encoding),
  }));

  // 🔥 Lalu saat membuat input
  const input = JSON.stringify({
    image: Array.from(buffer),
    db_faces: parsedDbFaces,
  });

  return new Promise((resolve) => {
    const pythonProcess = spawn('python', [pythonScriptPath]); // <<< pakai absolute path!

    let result = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
      console.error('stderr:', data.toString());
    });

    pythonProcess.on('close', (code) => {
      if (error) {
        resolve(NextResponse.json({ status: 'error', message: 'Python error: ' + error }, { status: 500 }));
        return;
      }

      if (!result) {
        resolve(NextResponse.json({ status: 'error', message: 'No output from Python script' }, { status: 500 }));
        return;
      }

      try {
        resolve(NextResponse.json(JSON.parse(result)));
      } catch (e) {
        console.error('JSON parse error:', e);
        resolve(NextResponse.json({ status: 'error', message: 'Invalid JSON output from Python' }, { status: 500 }));
      }
    });

    pythonProcess.stdin.write(input);
    pythonProcess.stdin.end();
  });
}

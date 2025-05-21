import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';

export async function POST(request) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const pythonScriptPath = path.join(__dirname, '../../python_scripts/encode_face.py'); // 🔥 path absolut

  const data = await request.formData();
  const image = data.get('image');

  if (!image) {
    return NextResponse.json({ status: 'error', message: 'No image uploaded' }, { status: 400 });
  }

  const buffer = Buffer.from(await image.arrayBuffer());

  return new Promise((resolve) => {
    const pythonProcess = spawn('python', [pythonScriptPath]); // 🔥 pakai absolute path

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

    // Kirim buffer ke Python stdin
    pythonProcess.stdin.write(buffer);
    pythonProcess.stdin.end();
  });
}

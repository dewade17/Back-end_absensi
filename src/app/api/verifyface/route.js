// app/api/verifyface/route.js
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import prisma from '@/lib/prisma';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('image');

    if (!file) {
      return new Response(JSON.stringify({ status: 'error', message: 'No image provided' }), {
        status: 400,
      });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const tempDir = path.join(process.cwd(), 'tmp');
    await fs.mkdir(tempDir, { recursive: true });
    const tempPath = path.join(tempDir, file.name);
    await fs.writeFile(tempPath, buffer);
    console.log('File saved at:', tempPath, 'Size:', buffer.length);

    const faces = await prisma.userFace.findMany({
      select: { user_id: true, face_encoding: true },
    });

    const dbJson = JSON.stringify(faces);

    return new Promise((resolve) => {
      const pythonPath = 'C:\\Users\\ASUS\\AppData\\Local\\Programs\\Python\\Python310\\python.exe'; // SESUAIKAN PATH
      const python = spawn(pythonPath, ['python/verify_encoding.py', tempPath, dbJson]);

      let output = '';
      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        console.error('Python Error:', data.toString());
      });

      python.on('close', async () => {
        await fs.unlink(tempPath).catch(() => {});
        resolve(
          new Response(output, {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        );
      });
    });
  } catch (err) {
    console.error('Server error:', err);
    return new Response(JSON.stringify({ status: 'error', message: 'Internal Server Error' }), {
      status: 500,
    });
  }
}

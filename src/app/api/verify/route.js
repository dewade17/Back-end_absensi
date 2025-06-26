import path from 'path';
import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pythonScriptPath = path.join(__dirname, '../../python_scripts/verify_face.py');

// Validasi token
async function validateToken(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Token tidak ditemukan', status: 401 };
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    return { decoded };
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return { error: 'Token sudah kedaluwarsa', status: 401 };
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return { error: 'Token tidak valid', status: 401 };
    }
    return { error: 'Gagal memverifikasi token', status: 500 };
  }
}

export async function POST(request) {
  const { decoded, error, status } = await validateToken(request);
  if (error) {
    return NextResponse.json({ status: 'error', message: error }, { status });
  }

  try {
    const data = await request.formData();
    const image = data.get('image');

    if (!image) {
      return NextResponse.json({ status: 'error', message: 'Image tidak ditemukan' }, { status: 400 });
    }

    // Ambil wajah user dari database
    const userFaces = await prisma.userface.findMany({
      where: { user_id: decoded.user_id },
    });

    if (!userFaces.length) {
      return NextResponse.json({ status: 'error', message: 'Wajah belum terdaftar' }, { status: 404 });
    }

    // Hanya satu wajah user yang boleh dikirim
    const parsedDbFace = {
      user_id: userFaces[0].user_id,
      face_encoding: JSON.parse(userFaces[0].face_encoding),
    };

    const buffer = Buffer.from(await image.arrayBuffer());
    const input = JSON.stringify({
      image: Array.from(buffer),
      db_face: parsedDbFace,
    });

    return await new Promise((resolve) => {
      const pythonProcess = spawn('python', [pythonScriptPath]);

      let result = '';
      let error = '';

      pythonProcess.stdout.on('data', (data) => {
        result += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
        console.error('stderr:', data.toString());
      });

      pythonProcess.on('close', () => {
        if (error) {
          return resolve(NextResponse.json({ status: 'error', message: 'Python error: ' + error }, { status: 500 }));
        }

        try {
          return resolve(NextResponse.json(JSON.parse(result)));
        } catch (e) {
          console.error('JSON parse error:', e);
          return resolve(NextResponse.json({ status: 'error', message: 'Invalid JSON from Python' }, { status: 500 }));
        }
      });

      pythonProcess.stdin.write(input);
      pythonProcess.stdin.end();
    });
  } catch (err) {
    console.error('❌ Error verifying face:', err);
    return NextResponse.json({ status: 'error', message: 'Gagal verifikasi wajah', error: err.message }, { status: 500 });
  }
}

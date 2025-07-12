import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import jwt from 'jsonwebtoken';

// Middleware validasi token
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

export async function GET(req) {
  const { decoded, error, status } = await validateToken(req);
  if (error) {
    return NextResponse.json({ message: error }, { status });
  }

  try {
    const faces = await prisma.userface.findMany({
      include: {
        user: {
          select: { nama: true },
        },
      },
    });
    return NextResponse.json({ faces }, { status: 200 });
  } catch (error) {
    console.error('❌ Error ambil semua wajah:', error);
    return NextResponse.json({ message: 'Gagal mengambil data wajah', error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  const { decoded, error, status } = await validateToken(req);
  if (error) {
    return NextResponse.json({ message: error }, { status });
  }

  try {
    const body = await req.json();
    const { user_id, face_encoding } = body;

    if (!user_id || !face_encoding) {
      return NextResponse.json({ message: 'user_id dan face_encoding wajib diisi' }, { status: 400 });
    }

    const face = await prisma.userface.create({
      data: { user_id, face_encoding },
    });

    return NextResponse.json({ message: 'Data wajah berhasil ditambahkan', face }, { status: 201 });
  } catch (error) {
    console.error('❌ Error saat membuat wajah:', error);
    return NextResponse.json({ message: 'Gagal menambahkan wajah', error: error.message }, { status: 500 });
  }
}

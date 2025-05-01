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
  const { error, status } = await validateToken(req);
  if (error) {
    return NextResponse.json({ message: error }, { status });
  }

  try {
    const data = await prisma.attendancearrival.findMany({
      include: { user: true },
    });
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('❌ GET Error:', error);
    return NextResponse.json({ message: 'Gagal mengambil data kehadiran', error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  const { error, status } = await validateToken(req);
  if (error) {
    return NextResponse.json({ message: error }, { status });
  }

  try {
    const body = await req.json();
    const { user_id, tanggal, jam_masuk, latitude, longitude, face_verified } = body;

    if (!user_id || !tanggal || !jam_masuk || typeof latitude !== 'number' || typeof longitude !== 'number' || typeof face_verified !== 'boolean') {
      return NextResponse.json({ message: 'Field tidak lengkap atau bertipe salah' }, { status: 400 });
    }

    const created = await prisma.attendancearrival.create({
      data: {
        user_id,
        tanggal: new Date(tanggal),
        jam_masuk: new Date(jam_masuk),
        latitude,
        longitude,
        face_verified,
      },
    });

    return NextResponse.json({ message: 'Absen berhasil disimpan', created }, { status: 201 });
  } catch (error) {
    console.error('❌ POST Error:', error);
    return NextResponse.json({ message: 'Gagal menambahkan kehadiran', error: error.message }, { status: 500 });
  }
}

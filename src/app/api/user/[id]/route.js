import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function GET(req) {
  const { pathname } = new URL(req.url);
  const userId = pathname.split('/').pop();

  if (!userId) {
    return NextResponse.json({ message: 'ID user tidak valid' }, { status: 400 });
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Token tidak ditemukan' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  let decoded;

  try {
    decoded = verifyToken(token);
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return NextResponse.json({ message: 'Token sudah kedaluwarsa' }, { status: 401 });
    }

    if (err instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ message: 'Token tidak valid' }, { status: 401 });
    }

    return NextResponse.json({ message: 'Gagal memverifikasi token', error: err.message }, { status: 500 });
  }

  if (!decoded || !decoded.user_id) {
    return NextResponse.json({ message: 'Token tidak sah' }, { status: 403 });
  }

  if (decoded.user_id !== userId) {
    return NextResponse.json({ message: 'Kamu tidak diizinkan melihat data user lain' }, { status: 403 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: {
        user_id: true,
        nama: true,
        email: true,
        no_hp: true,
        nip: true,
        foto_profil: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'User tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Data user berhasil diambil', user }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Gagal mengambil data user', error: error.message }, { status: 500 });
  }
}

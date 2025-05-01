import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken'; // pastikan jwt di-install jika verifyToken tidak handle error jwt

export async function GET(req) {
  try {
    const authHeader = req.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Token tidak ditemukan' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let decoded;

    try {
      decoded = verifyToken(token); // Misalnya pakai jwt.verify(token, secret)
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
      return NextResponse.json({ message: 'Payload token tidak sesuai' }, { status: 401 });
    }

    let user;
    try {
      user = await prisma.user.findUnique({
        where: { user_id: decoded.user_id },
        select: {
          user_id: true,
          nama: true,
          email: true,
          role: true, 
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (err) {
      return NextResponse.json({ message: 'Gagal mengambil data user dari database', error: err.message }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ message: 'User tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Data user berhasil diambil', user });
  } catch (error) {
    return NextResponse.json(
      {
        message: 'Terjadi kesalahan tak terduga',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

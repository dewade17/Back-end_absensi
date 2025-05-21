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

// GET /api/attendance/arrival/[user_id]
export async function GET(req) {
  const { error, status, decoded } = await validateToken(req);
  if (error) {
    return NextResponse.json({ message: error }, { status });
  }

  const { pathname } = new URL(req.url);
  const userId = pathname.split('/').pop();

  if (!userId) {
    return NextResponse.json({ message: 'User ID diperlukan' }, { status: 400 });
  }

  // ✅ Hanya validasi kecocokan user_id dengan token, tanpa cek role
  if (!decoded || !decoded.user_id || decoded.user_id !== userId) {
    return NextResponse.json({ message: 'Kamu tidak diizinkan melihat data user lain' }, { status: 403 });
  }

  // Ambil query parameter page & limit
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = parseInt(url.searchParams.get('limit') || '4', 10);
  const skip = (page - 1) * limit;

  try {
    const totalItems = await prisma.attendancearrival.count({
      where: { user_id: userId },
    });

    const attendances = await prisma.attendancearrival.findMany({
      where: { user_id: userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        arrival_id: true,
        user_id: true,
        tanggal: true,
        jam_masuk: true,
        latitude: true,
        longitude: true,
        face_verified: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            nama: true,
            email: true,
            no_hp: true,
            foto_profil: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: 'Data kehadiran berhasil diambil',
        data: attendances,
        meta: {
          totalItems,
          totalPages: Math.ceil(totalItems / limit),
          currentPage: page,
          perPage: limit,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error mengambil kehadiran:', error);
    return NextResponse.json({ message: 'Gagal mengambil data kehadiran', error: error.message }, { status: 500 });
  }
}

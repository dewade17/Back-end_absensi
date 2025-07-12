import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import jwt from 'jsonwebtoken';

// Ambil semua data user dengan role KARYAWAN (akses hanya ADMIN)
export async function GET(req) {
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

  // ⛔ hanya ADMIN yang boleh akses
  if (!decoded || decoded.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Hanya role ADMIN yang dapat mengakses data ini' }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      where: { role: 'KARYAWAN' }, // ✅ hanya user dengan role KARYAWAN
      select: {
        user_id: true,
        nama: true,
        email: true,
        no_hp: true,
        status: true,
        nip: true,
        foto_profil: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ message: 'Data KARYAWAN berhasil diambil', users }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Gagal mengambil data user', error: error.message }, { status: 500 });
  }
}

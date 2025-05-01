import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import jwt from 'jsonwebtoken';

export async function PUT(req) {
  const { pathname } = new URL(req.url);
  const userId = pathname.split('/').pop();

  if (!userId) {
    return NextResponse.json({ message: 'ID user tidak valid' }, { status: 400 });
  }

  // Ambil dan verifikasi token
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

  // Pastikan role admin
  if (!decoded || decoded.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Akses ditolak: hanya admin yang dapat mengubah data user lain' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { nama, email, role, status, no_hp, nip, foto_profil } = body;

    if (!nama || !email || !role) {
      return NextResponse.json({ message: 'Field nama, email, dan role wajib diisi' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: 'Format email tidak valid' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { user_id: userId },
    });

    if (!existingUser) {
      return NextResponse.json({ message: 'User tidak ditemukan' }, { status: 404 });
    }

    const emailExist = await prisma.user.findFirst({
      where: {
        email,
        user_id: { not: userId },
      },
    });

    if (emailExist) {
      return NextResponse.json({ message: 'Email sudah digunakan oleh pengguna lain' }, { status: 409 });
    }

    const updatedUser = await prisma.user.update({
      where: { user_id: userId },
      data: {
        nama,
        email,
        role,
        status,
        no_hp,
        nip,
        foto_profil,
      },
    });

    const { password: _pw, ...safeUser } = updatedUser;

    return NextResponse.json({ message: 'Data user berhasil diperbarui', user: safeUser }, { status: 200 });
  } catch (error) {
    console.error('❌ Error saat update user:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json({ message: 'Error database Prisma', error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Gagal memperbarui user', error: error.message }, { status: 500 });
  }
}

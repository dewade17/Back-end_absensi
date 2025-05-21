import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function PUT(req) {
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
    return NextResponse.json({ message: 'Kamu tidak diizinkan mengubah data user lain' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { nama, email, no_hp, nip, foto_profil } = body;

    if (!nama || !email) {
      return NextResponse.json({ message: 'Field nama dan email wajib diisi' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: 'Format email tidak valid' }, { status: 400 });
    }

    const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

    if (foto_profil) {
      if (!foto_profil.startsWith('data:image/')) {
        return NextResponse.json({ message: 'Format foto_profil tidak valid' }, { status: 400 });
      }

      const base64Data = foto_profil.split(',')[1];
      const byteLength = Math.ceil((base64Data.length * 3) / 4);

      if (byteLength > MAX_IMAGE_SIZE) {
        return NextResponse.json({ message: 'Ukuran foto_profil maksimal 2MB' }, { status: 413 });
      }
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

    const dataUpdate = {
      nama,
      email,
      no_hp,
      nip,
    };

    if (foto_profil) {
      dataUpdate.foto_profil = foto_profil;
    }

    const updatedUser = await prisma.user.update({
      where: { user_id: userId },
      data: dataUpdate,
    });

    const { password: _pw, ...safeUser } = updatedUser;

    return NextResponse.json({ message: 'Data user berhasil diperbarui', user: safeUser }, { status: 200 });
  } catch (error) {
    console.error('PUT /api/user/editprofile error:', error);
    return NextResponse.json({ message: 'Gagal memperbarui user', error: error.message }, { status: 500 });
  }
}

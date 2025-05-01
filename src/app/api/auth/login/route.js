import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { generateToken } from '@/lib/auth';

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // Validasi input dasar
    if (!email || !password) {
      return NextResponse.json({ message: 'Email dan password wajib diisi' }, { status: 400 });
    }

    let user;

    try {
      user = await prisma.user.findUnique({ where: { email } });
    } catch (err) {
      return NextResponse.json({ message: 'Gagal mengakses database', error: err.message }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ message: 'User tidak ditemukan' }, { status: 404 });
    }

    let isValid = false;
    try {
      isValid = await bcrypt.compare(password, user.password);
    } catch (err) {
      return NextResponse.json({ message: 'Gagal memverifikasi password', error: err.message }, { status: 500 });
    }

    if (!isValid) {
      return NextResponse.json({ message: 'Password salah' }, { status: 401 });
    }

    let token;
    try {
      token = generateToken({
        user_id: user.user_id,
        email: user.email,
        role: user.role,
      });
    } catch (err) {
      return NextResponse.json({ message: 'Gagal membuat token', error: err.message }, { status: 500 });
    }

    const { user_id, nama, email: safeEmail, createdAt, updatedAt } = user;

    return NextResponse.json(
      {
        message: 'Login berhasil',
        token,
        user: { user_id, nama, email: safeEmail, createdAt, updatedAt },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: 'Terjadi kesalahan tak terduga saat login',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt'; // atau 'bcryptjs'

export async function POST(req) {
  try {
    const body = await req.json();
    const { nama, email, password, role = 'KARYAWAN', status = 'AKTIF', no_hp, nip, foto_profil } = body;

    // Validasi input dasar
    if (!nama || !email || !password) {
      return NextResponse.json({ message: 'Nama, email, dan password wajib diisi' }, { status: 400 });
    }

    // Cek apakah email sudah digunakan
    let existingUser;
    try {
      existingUser = await prisma.user.findUnique({ where: { email } });
    } catch (err) {
      return NextResponse.json({ message: 'Gagal memeriksa email di database', error: err.message }, { status: 500 });
    }

    if (existingUser) {
      return NextResponse.json({ message: 'Email sudah terdaftar' }, { status: 400 });
    }

    // Hash password
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 10);
    } catch (err) {
      return NextResponse.json({ message: 'Gagal mengenkripsi password', error: err.message }, { status: 500 });
    }

    // Buat user baru
    let user;
    try {
      user = await prisma.user.create({
        data: {
          nama,
          email,
          password: hashedPassword,
          role,
          status,
          no_hp,
          nip,
          foto_profil,  
        },
      });
    } catch (err) {
      return NextResponse.json({ message: 'Gagal membuat user', error: err.message }, { status: 500 });
    }

    // Jangan kirim password ke client
    const { password: _pw, ...safeUser } = user;

    return NextResponse.json({ message: 'Registrasi berhasil', user: safeUser }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Terjadi kesalahan tak terduga saat registrasi', error: error.message }, { status: 500 });
  }
}

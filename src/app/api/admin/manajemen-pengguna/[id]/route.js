import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt'; // Pastikan sudah install: npm install bcrypt

function extractUserIdFromPath(req) {
  const { pathname } = new URL(req.url);
  return pathname.split('/').pop();
}

function getTokenFromHeader(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.split(' ')[1];
}

function handleTokenError(err) {
  if (err instanceof jwt.TokenExpiredError) {
    return NextResponse.json({ message: 'Token sudah kedaluwarsa' }, { status: 401 });
  }
  if (err instanceof jwt.JsonWebTokenError) {
    return NextResponse.json({ message: 'Token tidak valid' }, { status: 401 });
  }
  return NextResponse.json({ message: 'Gagal memverifikasi token', error: err.message }, { status: 500 });
}

// ✅ GET: Ambil data user (ADMIN atau user itu sendiri)
export async function GET(req) {
  const userId = extractUserIdFromPath(req);
  if (!userId) return NextResponse.json({ message: 'ID user tidak valid' }, { status: 400 });

  const token = getTokenFromHeader(req);
  if (!token) return NextResponse.json({ message: 'Token tidak ditemukan' }, { status: 401 });

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    return handleTokenError(err);
  }

  if (!decoded || (!decoded.user_id && decoded.role !== 'ADMIN')) {
    return NextResponse.json({ message: 'Token tidak sah' }, { status: 403 });
  }

  if (decoded.user_id !== userId && decoded.role !== 'ADMIN') {
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
        status: true,
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

// 📝 PUT: Update data user (hanya ADMIN)
export async function PUT(req) {
  const userId = extractUserIdFromPath(req);
  if (!userId) return NextResponse.json({ message: 'ID user tidak valid' }, { status: 400 });

  const token = getTokenFromHeader(req);
  if (!token) return NextResponse.json({ message: 'Token tidak ditemukan' }, { status: 401 });

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    return handleTokenError(err);
  }

  if (decoded.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Hanya ADMIN yang dapat mengedit user' }, { status: 403 });
  }

  const body = await req.json();
  const { nama, email, no_hp, nip, foto_profil, status } = body;

  try {
    const updatedUser = await prisma.user.update({
      where: { user_id: userId },
      data: {
        nama,
        email,
        status,
        no_hp,
        nip,
        foto_profil,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ message: 'Data user berhasil diperbarui', user: updatedUser }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Gagal memperbarui data user', error: error.message }, { status: 500 });
  }
}

// 🗑️ DELETE: Hapus user (hanya ADMIN, verifikasi password admin)
export async function DELETE(req) {
  const userId = extractUserIdFromPath(req);
  if (!userId) return NextResponse.json({ message: 'ID user tidak valid' }, { status: 400 });

  const token = getTokenFromHeader(req);
  if (!token) return NextResponse.json({ message: 'Token tidak ditemukan' }, { status: 401 });

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    return handleTokenError(err);
  }

  if (decoded.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Hanya ADMIN yang dapat menghapus user' }, { status: 403 });
  }

  // Ambil password admin dari body request
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'Permintaan tidak valid. Kirim password admin di body.' }, { status: 400 });
  }
  const { adminPassword } = body || {};
  if (!adminPassword) {
    return NextResponse.json({ message: 'Password admin harus diisi' }, { status: 400 });
  }

  // Ambil data admin dari database
  const adminUser = await prisma.user.findUnique({ where: { user_id: decoded.user_id } });
  if (!adminUser) return NextResponse.json({ message: 'Admin tidak ditemukan' }, { status: 403 });

  // Verifikasi password admin (async)
  const isMatch = await bcrypt.compare(adminPassword, adminUser.password);
  if (!isMatch) {
    return NextResponse.json({ message: 'Password admin salah' }, { status: 403 });
  }

  // Proses hapus user
  try {
    const deletedUser = await prisma.user.delete({
      where: { user_id: userId },
    });

    return NextResponse.json({ message: 'User berhasil dihapus', user: deletedUser }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Gagal menghapus user', error: error.message }, { status: 500 });
  }
}

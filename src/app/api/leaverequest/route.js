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

// POST buat leave request baru
export async function POST(req) {
  const { error, status } = await validateToken(req);
  if (error) {
    return NextResponse.json({ message: error }, { status });
  }

  try {
    const body = await req.json();
    const { user_id, jenis_izin, tanggal_mulai, tanggal_selesai, alasan, bukti_file } = body;

    // Validasi jenis izin
    const validJenisIzin = ['izin', 'cuti', 'sakit'];
    if (!validJenisIzin.includes(jenis_izin)) {
      return NextResponse.json({ message: 'jenis_izin tidak valid' }, { status: 400 });
    }

    // Validasi field wajib
    if (!user_id || !jenis_izin || !tanggal_mulai || !tanggal_selesai || !alasan || !bukti_file) {
      return NextResponse.json({ message: 'Field wajib tidak lengkap' }, { status: 400 });
    }

    // Validasi format bukti_file
    const MAX_FILE_SIZE = 2 * 1024 * 1024;
    const isBase64 = typeof bukti_file === 'string' && bukti_file.includes(',');
    if (!isBase64) {
      return NextResponse.json({ message: 'Format bukti_file tidak valid' }, { status: 400 });
    }

    const [mimeHeader, base64Content] = bukti_file.split(',');
    const allowedMimeTypes = ['data:image/jpeg', 'data:image/png', 'data:image/jpg', 'data:application/pdf'];
    const isValidMime = allowedMimeTypes.some((type) => mimeHeader.startsWith(type));
    if (!isValidMime) {
      return NextResponse.json({ message: 'Tipe file bukti_file tidak diizinkan' }, { status: 400 });
    }

    const byteLength = Math.ceil((base64Content.length * 3) / 4);
    if (byteLength > MAX_FILE_SIZE) {
      return NextResponse.json({ message: 'Ukuran bukti_file maksimal 2MB' }, { status: 413 });
    }

    const created = await prisma.leaverequest.create({
      data: {
        user_id,
        jenis_izin,
        tanggal_mulai: new Date(tanggal_mulai),
        tanggal_selesai: new Date(tanggal_selesai),
        alasan,
        bukti_file,
        status: 'PENDING',
      },
    });

    return NextResponse.json(
      {
        message: 'Izin berhasil ditambahkan',
        leave: created,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('❌ POST /api/leaverequest error:', err);
    if (err.code === 'P1017') {
      console.error('🔍 Prisma P1017 Detail:', err.meta);
    }

    return NextResponse.json(
      {
        message: 'Gagal membuat data izin',
        error: err.message,
      },
      { status: 500 }
    );
  }
}

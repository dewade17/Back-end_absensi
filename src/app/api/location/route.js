import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import jwt from 'jsonwebtoken';

export async function GET() {
  try {
    // HANYA HAPUS "include: { company: true }"
    const locations = await prisma.location.findMany();
    return NextResponse.json({ locations }, { status: 200 });
  } catch (error) {
    console.error('❌ Error fetch lokasi:', error);
    return NextResponse.json({ message: 'Gagal mengambil data lokasi', error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
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
    return NextResponse.json({ message: 'Gagal verifikasi token', error: err.message }, { status: 500 });
  }

  if (decoded.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Hanya admin yang bisa menambah lokasi' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { company_id, nama_lokasi, latitude, longitude, radius } = body;

    if (!nama_lokasi || !latitude || !longitude || !radius) {
      return NextResponse.json({ message: 'Semua field wajib diisi' }, { status: 400 });
    }

    const lokasi = await prisma.location.create({
      data: {
        nama_lokasi,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        radius: parseFloat(radius),
        // company_id, // tambahkan kalau memang perlu dan field ini ada di schema
      },
    });

    return NextResponse.json({ message: 'Lokasi berhasil ditambahkan', lokasi }, { status: 201 });
  } catch (error) {
    console.error('❌ Error saat tambah lokasi:', error);
    return NextResponse.json({ message: 'Gagal menambah lokasi', error: error.message }, { status: 500 });
  }
}

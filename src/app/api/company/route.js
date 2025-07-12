import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import jwt from 'jsonwebtoken';

// Ambil semua data perusahaan TANPA include lokasi
export async function GET() {
  try {
    const companies = await prisma.company.findMany(); // tanpa include locations
    return NextResponse.json({ companies }, { status: 200 });
  } catch (error) {
    console.error('❌ Gagal mengambil data perusahaan:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan server', error: error.message }, { status: 500 });
  }
}

// Tambahkan perusahaan baru (khusus admin)
export async function POST(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Token tidak ditemukan' }, { status: 401 });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Hanya admin yang dapat menambahkan perusahaan' }, { status: 403 });
    }

    const body = await req.json();
    const { nama, alamat, telepon, email, logo_url } = body;

    if (!nama || !alamat || !telepon || !email || !logo_url) {
      return NextResponse.json({ message: 'Semua field wajib diisi' }, { status: 400 });
    }

    const newCompany = await prisma.company.create({
      data: { nama, alamat, telepon, email, logo_url },
    });

    return NextResponse.json({ message: 'Perusahaan berhasil ditambahkan', company: newCompany }, { status: 201 });
  } catch (err) {
    console.error('❌ Error POST company:', err);
    if (err instanceof jwt.TokenExpiredError) {
      return NextResponse.json({ message: 'Token kedaluwarsa' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Gagal menambahkan perusahaan', error: err.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import jwt from 'jsonwebtoken';

export async function PUT(req, { params }) {
  const location_id = params.id;

  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Token tidak ditemukan' }, { status: 401 });
  }

  let decoded;
  try {
    const token = authHeader.split(' ')[1];
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
    return NextResponse.json({ message: 'Hanya admin yang bisa mengubah lokasi' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { nama_lokasi, latitude, longitude, radius } = body;

    const lokasi = await prisma.location.update({
      where: { location_id },
      data: { nama_lokasi, latitude, longitude, radius },
    });

    return NextResponse.json({ message: 'Lokasi berhasil diperbarui', lokasi }, { status: 200 });
  } catch (error) {
    console.error('❌ Error update lokasi:', error);
    return NextResponse.json({ message: 'Gagal memperbarui lokasi', error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const location_id = params.id;

  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Token tidak ditemukan' }, { status: 401 });
  }

  let decoded;
  try {
    const token = authHeader.split(' ')[1];
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
    return NextResponse.json({ message: 'Hanya admin yang bisa menghapus lokasi' }, { status: 403 });
  }

  try {
    await prisma.location.delete({
      where: { location_id },
    });

    return NextResponse.json({ message: 'Lokasi berhasil dihapus' }, { status: 200 });
  } catch (error) {
    console.error('❌ Error delete lokasi:', error);
    return NextResponse.json({ message: 'Gagal menghapus lokasi', error: error.message }, { status: 500 });
  }
}

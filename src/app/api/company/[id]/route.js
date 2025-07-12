import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import jwt from 'jsonwebtoken';

// GET detail perusahaan by ID (tanpa locations)
export async function GET(req, { params }) {
  const { id } = params;

  try {
    const company = await prisma.company.findUnique({
      where: { company_id: id },
      // tanpa include locations
    });

    if (!company) {
      return NextResponse.json({ message: 'Perusahaan tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ company }, { status: 200 });
  } catch (error) {
    console.error('❌ Error ambil data perusahaan:', error);
    return NextResponse.json({ message: 'Gagal mengambil data', error: error.message }, { status: 500 });
  }
}

// UPDATE perusahaan (by ID, khusus ADMIN)
export async function PUT(req, { params }) {
  const { id } = params;

  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Token tidak ditemukan' }, { status: 401 });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Hanya admin yang dapat mengedit perusahaan' }, { status: 403 });
    }

    const body = await req.json();
    const { nama, alamat, telepon, email, logo_url } = body;

    const updatedCompany = await prisma.company.update({
      where: { company_id: id },
      data: { nama, alamat, telepon, email, logo_url },
    });

    return NextResponse.json({ message: 'Perusahaan berhasil diperbarui', company: updatedCompany }, { status: 200 });
  } catch (err) {
    console.error('❌ Error update company:', err);
    if (err instanceof jwt.TokenExpiredError) {
      return NextResponse.json({ message: 'Token kedaluwarsa' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Gagal memperbarui perusahaan', error: err.message }, { status: 500 });
  }
}

// DELETE perusahaan (by ID, khusus ADMIN)
export async function DELETE(req, { params }) {
  const { id } = params;

  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Token tidak ditemukan' }, { status: 401 });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Hanya admin yang dapat menghapus perusahaan' }, { status: 403 });
    }

    await prisma.company.delete({
      where: { company_id: id },
    });

    return NextResponse.json({ message: 'Perusahaan berhasil dihapus' }, { status: 200 });
  } catch (err) {
    console.error('❌ Error delete company:', err);
    if (err instanceof jwt.TokenExpiredError) {
      return NextResponse.json({ message: 'Token kedaluwarsa' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Gagal menghapus perusahaan', error: err.message }, { status: 500 });
  }
}

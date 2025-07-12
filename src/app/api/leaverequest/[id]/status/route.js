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

export async function PUT(req, { params }) {
  const leaveId = params.id; // <--- cukup params.id saja
  if (!leaveId) {
    return NextResponse.json({ message: 'Leave ID tidak valid di URL' }, { status: 400 });
  }
  const { error, status: tokenStatus, decoded } = await validateToken(req);
  if (error) {
    return NextResponse.json({ message: error }, { status: tokenStatus });
  }
  if (decoded.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Hanya admin yang boleh mengubah status izin' }, { status: 403 });
  }
  try {
    const { status } = await req.json();
    const validStatus = ['PENDING', 'DISETUJUI', 'DITOLAK'];
    if (!status || !validStatus.includes(status)) {
      return NextResponse.json({ message: 'Status tidak valid' }, { status: 400 });
    }

    const existing = await prisma.leaverequest.findUnique({ where: { leave_id: leaveId } });
    if (!existing) {
      return NextResponse.json({ message: 'Data izin tidak ditemukan' }, { status: 404 });
    }

    const updatedLeave = await prisma.leaverequest.update({
      where: { leave_id: leaveId },
      data: { status },
    });

    return NextResponse.json({ message: 'Status izin berhasil diupdate', leave: updatedLeave }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ message: 'Gagal update status izin', error: err.message }, { status: 500 });
  }
}

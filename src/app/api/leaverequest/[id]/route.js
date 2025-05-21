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

// ✅ GET: Ambil semua leave request berdasarkan user_id dari pathname
export async function GET(req) {
  const { pathname } = new URL(req.url);
  const userId = pathname.split('/').pop(); // Ambil user_id dari akhir URL

  if (!userId) {
    return NextResponse.json({ message: 'User ID tidak ditemukan di URL' }, { status: 400 });
  }

  try {
    const data = await prisma.leaverequest.findMany({
      where: { user_id: userId },
      orderBy: { tanggal_mulai: 'desc' },
    });

    return NextResponse.json({ message: 'Data berhasil diambil', data }, { status: 200 });
  } catch (err) {
    console.error('❌ GET /api/leaverequest/[user_id] error:', err);
    return NextResponse.json({ message: 'Gagal mengambil data', error: err.message }, { status: 500 });
  }
}

export async function PUT(req) {
  const { pathname } = new URL(req.url);
  const leaveId = pathname.split('/').pop();
  if (!leaveId) {
    return NextResponse.json({ message: 'Leave ID tidak valid di URL' }, { status: 400 });
  }

  const { error, status: tokenStatus, decoded } = await validateToken(req);
  if (error) {
    return NextResponse.json({ message: error }, { status: tokenStatus });
  }
  const userId = decoded.user_id;

  try {
    const body = await req.json();
    const { jenis_izin, tanggal_mulai, tanggal_selesai, alasan, bukti_file, status } = body;

    // kalau client tidak kirim status atau kirim null, default ke 'PENDING'
    const statusLeave = status == null ? 'PENDING' : status;

    if (!jenis_izin || !tanggal_mulai || !tanggal_selesai || !alasan) {
      return NextResponse.json({ message: 'Field wajib tidak lengkap' }, { status: 400 });
    }

    if (bukti_file) {
      if (!bukti_file.startsWith('data:image/')) {
        return NextResponse.json({ message: 'Format bukti_file tidak valid' }, { status: 400 });
      }
      const base64Data = bukti_file.split(',')[1];
      const byteLength = Math.ceil((base64Data.length * 3) / 4);
      if (byteLength > 2 * 1024 * 1024) {
        return NextResponse.json({ message: 'Ukuran bukti_file maksimal 2MB' }, { status: 413 });
      }
    }

    const existingLeave = await prisma.leaverequest.findUnique({ where: { leave_id: leaveId } });
    if (!existingLeave) {
      return NextResponse.json({ message: 'Data izin tidak ditemukan' }, { status: 404 });
    }
    if (existingLeave.user_id !== userId) {
      return NextResponse.json({ message: 'Kamu tidak diizinkan mengubah data user lain' }, { status: 403 });
    }

    const dataUpdate = {
      jenis_izin,
      tanggal_mulai: new Date(tanggal_mulai),
      tanggal_selesai: new Date(tanggal_selesai),
      alasan,
      status: statusLeave,
      ...(bukti_file && { bukti_file }),
    };
    console.log('sebelum DB mulai:', existingLeave.tanggal_mulai, 'selesai:', existingLeave.tanggal_selesai);
    console.log('payload mulai:', tanggal_mulai, 'selesai:', tanggal_selesai);

    const updatedLeave = await prisma.leaverequest.update({
      where: { leave_id: leaveId },
      data: dataUpdate,
    });

    return NextResponse.json({ message: 'Data izin berhasil diperbarui', leave: updatedLeave }, { status: 200 });
  } catch (err) {
    console.error('❌ PUT error:', err);
    return NextResponse.json({ message: 'Gagal memperbarui data izin', error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  const { pathname } = new URL(req.url);
  const leaveId = pathname.split('/').pop();
  if (!leaveId) {
    return NextResponse.json({ message: 'Leave ID tidak valid di URL' }, { status: 400 });
  }

  const { error, status: tokenStatus, decoded } = await validateToken(req);
  if (error) {
    return NextResponse.json({ message: error }, { status: tokenStatus });
  }
  const userId = decoded.user_id;

  try {
    const existingLeave = await prisma.leaverequest.findUnique({
      where: { leave_id: leaveId },
    });

    if (!existingLeave) {
      return NextResponse.json({ message: 'Data izin tidak ditemukan' }, { status: 404 });
    }

    if (existingLeave.user_id !== userId) {
      return NextResponse.json({ message: 'Kamu tidak diizinkan menghapus data user lain' }, { status: 403 });
    }

    await prisma.leaverequest.delete({
      where: { leave_id: leaveId },
    });

    return NextResponse.json({ message: 'Data izin berhasil dihapus' }, { status: 200 });
  } catch (err) {
    console.error('❌ DELETE error:', err);
    return NextResponse.json({ message: 'Gagal menghapus data izin', error: err.message }, { status: 500 });
  }
}

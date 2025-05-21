import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import jwt from 'jsonwebtoken';

// 🔐 Middleware validasi token
async function validateToken(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Token tidak ditemukan', status: 401 };
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    if (!decoded || !decoded.user_id) {
      return { error: 'Payload token tidak valid', status: 401 };
    }
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

// ✅ PUT: Update agenda dan semua itemnya
export async function PUT(req) {
  const { pathname } = new URL(req.url);
  const agendaId = pathname.split('/').pop();

  if (!agendaId) {
    return NextResponse.json({ message: 'Agenda ID tidak valid di URL' }, { status: 400 });
  }

  const { error, status: tokenStatus, decoded } = await validateToken(req);
  if (error) return NextResponse.json({ message: error }, { status: tokenStatus });

  const userId = decoded.user_id;

  try {
    const body = await req.json();
    const { items } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ message: 'Item agenda tidak boleh kosong' }, { status: 400 });
    }

    const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
    const workItems = [];
    const validationErrors = [];

    items.forEach((item, index) => {
      const { tanggal, jam_mulai, jam_selesai, deskripsi_pekerjaan, bukti_foto_url } = item;

      if (!tanggal || !jam_mulai || !jam_selesai || !deskripsi_pekerjaan) {
        validationErrors.push({ index, message: 'Field wajib tidak lengkap' });
        return;
      }

      if (!bukti_foto_url || typeof bukti_foto_url !== 'string' || !bukti_foto_url.startsWith('data:image/')) {
        validationErrors.push({ index, message: 'Format bukti_foto_url tidak valid. Harus berupa base64 image.' });
        return;
      }

      const base64Data = bukti_foto_url.split(',')[1];
      const byteLength = Math.ceil((base64Data.length * 3) / 4);
      if (byteLength > MAX_IMAGE_SIZE) {
        validationErrors.push({ index, message: 'Ukuran bukti_foto_url melebihi 2MB.' });
        return;
      }

      workItems.push({
        tanggal: new Date(tanggal),
        jam_mulai: new Date(jam_mulai),
        jam_selesai: new Date(jam_selesai),
        deskripsi_pekerjaan,
        bukti_foto_url,
      });
    });

    if (validationErrors.length > 0) {
      return NextResponse.json({ message: 'Validasi gagal pada beberapa item.', errors: validationErrors }, { status: 400 });
    }

    const updatedAgenda = await prisma.$transaction(async (tx) => {
      const existing = await tx.workagenda.findUnique({ where: { agenda_id: agendaId } });

      if (!existing) {
        throw new Error('Agenda tidak ditemukan');
      }

      if (existing.user_id !== userId) {
        return NextResponse.json({ message: 'Kamu tidak diizinkan mengubah agenda milik user lain' }, { status: 403 });
      }

      await tx.workagendaitem.deleteMany({ where: { agenda_id: agendaId } });

      const itemsToCreate = workItems.map((item) => ({
        ...item,
        agenda_id: agendaId,
      }));

      await tx.workagendaitem.createMany({ data: itemsToCreate });

      return {
        agenda_id: agendaId,
        updatedItems: itemsToCreate.length,
        items: itemsToCreate,
      };
    });

    return NextResponse.json({ message: 'Agenda dan item berhasil diperbarui', agenda: updatedAgenda }, { status: 200 });
  } catch (err) {
    console.error('❌ PUT error:', err);
    return NextResponse.json({ message: 'Gagal memperbarui agenda', error: err.message }, { status: 500 });
  }
}

// 🗑️ DELETE: Hapus agenda dan semua itemnya
export async function DELETE(req) {
  const { pathname } = new URL(req.url);
  const agendaId = pathname.split('/').pop();

  if (!agendaId) {
    return NextResponse.json({ message: 'Agenda ID tidak valid di URL' }, { status: 400 });
  }

  const { error, status: tokenStatus, decoded } = await validateToken(req);
  if (error) return NextResponse.json({ message: error }, { status: tokenStatus });

  const userId = decoded.user_id;

  try {
    const deleted = await prisma.$transaction(async (tx) => {
      const existing = await tx.workagenda.findUnique({ where: { agenda_id: agendaId } });

      if (!existing) {
        throw new Error('Agenda tidak ditemukan');
      }

      if (existing.user_id !== userId) {
        return NextResponse.json({ message: 'Kamu tidak diizinkan menghapus agenda milik user lain' }, { status: 403 });
      }

      await tx.workagendaitem.deleteMany({ where: { agenda_id: agendaId } });
      await tx.workagenda.delete({ where: { agenda_id: agendaId } });

      return { agenda_id: agendaId };
    });

    return NextResponse.json({ message: 'Agenda dan semua item berhasil dihapus', agenda: deleted }, { status: 200 });
  } catch (err) {
    console.error('❌ DELETE error:', err);
    return NextResponse.json({ message: 'Gagal menghapus agenda', error: err.message }, { status: 500 });
  }
}

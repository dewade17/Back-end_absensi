import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import jwt from 'jsonwebtoken';

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

export async function GET(req) {
  const { error, status } = await validateToken(req);
  if (error) return NextResponse.json({ message: error }, { status });

  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    const totalItems = await prisma.workagenda.count();

    const agendas = await prisma.workagenda.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            user_id: true,
            nama: true,
            email: true,
          },
        },
        workagendaitem: {
          orderBy: { tanggal: 'asc' },
        },
      },
    });

    // ✅ Transform: ubah workagendaitem → items
    const transformedAgendas = agendas.map((agenda) => ({
      ...agenda,
      items: agenda.workagendaitem,
      workagendaitem: undefined, // opsional: hapus original key
    }));

    return NextResponse.json({
      message: 'Data agenda berhasil diambil',
      data: transformedAgendas,
      meta: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        perPage: limit,
      },
    });
  } catch (err) {
    console.error('❌ GET /api/workagenda-with-items error:', err);
    return NextResponse.json({ message: 'Gagal mengambil data' }, { status: 500 });
  }
}

export async function POST(req) {
  const { error, status } = await validateToken(req);
  if (error) return NextResponse.json({ message: error }, { status });

  try {
    const body = await req.json();
    const { user_id, items } = body;

    if (!user_id || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ message: 'Data tidak lengkap' }, { status: 400 });
    }

    const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
    const workItems = [];
    const validationErrors = [];

    // ✅ Validasi setiap item
    items.forEach((item, index) => {
      const { tanggal, jam_mulai, jam_selesai, deskripsi_pekerjaan, bukti_foto_url } = item;

      if (!bukti_foto_url || typeof bukti_foto_url !== 'string' || !bukti_foto_url.startsWith('data:image/')) {
        validationErrors.push({
          index,
          message: 'Format bukti_foto_url tidak valid. Harus berupa base64 image.',
        });
        return;
      }

      const base64Data = bukti_foto_url.split(',')[1];
      const byteLength = Math.ceil((base64Data.length * 3) / 4);

      if (byteLength > MAX_IMAGE_SIZE) {
        validationErrors.push({
          index,
          message: 'Ukuran bukti_foto_url melebihi 2MB.',
        });
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

    // ⛔ Jika ada error validasi, kirim response error
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          message: 'Validasi gagal pada beberapa item.',
          errors: validationErrors,
        },
        { status: 400 }
      );
    }

    // ✅ Transaksi penyimpanan agenda + item
    const agenda = await prisma.$transaction(async (tx) => {
      const createdAgenda = await tx.workagenda.create({
        data: { user_id },
      });

      const itemsToCreate = workItems.map((item) => ({
        ...item,
        agenda_id: createdAgenda.agenda_id,
      }));

      await tx.workagendaitem.createMany({
        data: itemsToCreate,
      });

      return createdAgenda;
    });

    return NextResponse.json(
      {
        message: 'Agenda dan item berhasil dibuat',
        agenda,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('❌ POST /api/workagenda-with-items error:', err);
    return NextResponse.json(
      {
        message: 'Gagal membuat agenda',
        error: err.message,
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req) {
  const { pathname } = new URL(req.url);
  const userId = pathname.split('/').pop(); // Dapatkan user_id dari URL

  if (!userId) {
    return NextResponse.json({ message: 'User ID tidak ditemukan di URL' }, { status: 400 });
  }

  try {
    const face = await prisma.userface.findFirst({
      where: { user_id: userId }, // karena user_id hanya diindex, bukan unik
    });

    if (!face) {
      return NextResponse.json({ message: 'Data wajah tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(
      {
        status: 'success',
        face_encoding: face.face_encoding,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('❌ GET /api/userface/[id] error:', err);
    return NextResponse.json({ message: 'Gagal mengambil data wajah', error: err.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const { id } = params;

  try {
    const body = await req.json();
    const { user_id, face_encoding } = body;

    const updatedFace = await prisma.userFace.update({
      where: { face_id: id },
      data: { user_id, face_encoding },
    });

    return NextResponse.json({ message: 'Data wajah berhasil diperbarui', face: updatedFace }, { status: 200 });
  } catch (error) {
    console.error('❌ Error PUT wajah:', error);
    return NextResponse.json({ message: 'Gagal memperbarui data wajah', error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, context) {
  const { params } = context; // ini sesuai Next.js App Router
  const id = params.id;

  if (!id) {
    return NextResponse.json({ message: 'ID wajah tidak ditemukan' }, { status: 400 });
  }

  try {
    await prisma.userface.delete({
      // harus lowercase!
      where: { face_id: id },
    });

    return NextResponse.json({ message: 'Data wajah berhasil dihapus' }, { status: 200 });
  } catch (error) {
    console.error('❌ Error DELETE wajah:', error);
    return NextResponse.json({ message: 'Gagal menghapus data wajah', error: error.message }, { status: 500 });
  }
}

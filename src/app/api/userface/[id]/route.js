import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req, { params }) {
  const { id } = params;

  try {
    const face = await prisma.userFace.findUnique({
      where: { face_id: id },
      include: { user: true },
    });

    if (!face) {
      return NextResponse.json({ message: 'Data wajah tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ face }, { status: 200 });
  } catch (error) {
    console.error('❌ Error GET wajah:', error);
    return NextResponse.json({ message: 'Gagal mengambil data wajah', error: error.message }, { status: 500 });
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

export async function DELETE(req, { params }) {
  const { id } = params;

  try {
    await prisma.userFace.delete({
      where: { face_id: id },
    });

    return NextResponse.json({ message: 'Data wajah berhasil dihapus' }, { status: 200 });
  } catch (error) {
    console.error('❌ Error DELETE wajah:', error);
    return NextResponse.json({ message: 'Gagal menghapus data wajah', error: error.message }, { status: 500 });
  }
}

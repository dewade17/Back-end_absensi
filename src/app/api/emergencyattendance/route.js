import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function POST(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  let user;
  try {
    user = verifyToken(token);
  } catch {
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
  }

  const body = await req.json();
  const { tanggal, jam_masuk, jenis, alasan } = body;

  if (!tanggal || !jam_masuk || !jenis || !alasan) {
    return NextResponse.json({ message: 'Semua field wajib diisi' }, { status: 400 });
  }

  const emergency = await prisma.emergencyattendance.create({
    data: {
      user_id: user.user_id,
      tanggal: new Date(tanggal),
      jam_masuk: new Date(jam_masuk),
      jenis,
      alasan,
    },
  });

  return NextResponse.json(emergency, { status: 201 });
}

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
  const { tanggal, jam_keluar, latitude, longitude, face_verified } = body;

  if (!tanggal || !jam_keluar || latitude === undefined || longitude === undefined || face_verified === undefined) {
    return NextResponse.json({ message: 'Semua field wajib diisi' }, { status: 400 });
  }

  const result = await prisma.attendancedeparture.create({
    data: {
      user_id: user.user_id,
      tanggal: new Date(tanggal),
      jam_keluar: new Date(jam_keluar),
      latitude,
      longitude,
      face_verified,
    },
  });

  return NextResponse.json(result, { status: 201 });
}

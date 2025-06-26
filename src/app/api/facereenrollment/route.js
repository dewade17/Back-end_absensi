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
  const { alasan } = body;
  if (!alasan) {
    return NextResponse.json({ message: 'Alasan wajib diisi' }, { status: 400 });
  }

  const request = await prisma.facereenrollmentrequest.create({
    data: {
      user_id: user.user_id,
      alasan,
      catatan: 'Catatan akan muncul setelah ditinjau',
    },
  });

  return NextResponse.json(request, { status: 201 });
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req) {
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

  const { pathname, searchParams } = new URL(req.url);
  const userId = pathname.split('/').pop();

  if (!userId) {
    return NextResponse.json({ message: 'User ID tidak valid di URL' }, { status: 400 });
  }

  try {
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    const totalItems = await prisma.attendancedeparture.count({
      where: { user_id: userId },
    });

    const records = await prisma.attendancedeparture.findMany({
      where: { user_id: userId },
      skip,
      take: limit,
      orderBy: { tanggal: 'desc' },
    });

    return NextResponse.json({
      message: 'Data kepulangan berhasil diambil',
      data: records,
      meta: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        perPage: limit,
      },
    });
  } catch (err) {
    console.error('❌ GET /attendance/departure error:', err);
    return NextResponse.json({ message: 'Gagal mengambil data kepulangan' }, { status: 500 });
  }
}

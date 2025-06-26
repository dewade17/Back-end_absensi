import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth'; // pastikan ada fungsi ini

export async function GET(req) {
  // --- Validasi Token ---
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  let user;
  try {
    user = verifyToken(token); // pastikan verifyToken return user (atau throw error jika invalid)
  } catch {
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
  }

  // --- Filter Query ---
  const { searchParams } = new URL(req.url);
  const tanggal = searchParams.get('tanggal'); // yyyy-mm-dd (optional)
  let filter = {};

  if (tanggal) {
    const dateStart = new Date(`${tanggal}T00:00:00.000Z`);
    const dateEnd = new Date(`${tanggal}T23:59:59.999Z`);
    filter = {
      tanggal: { gte: dateStart, lte: dateEnd },
    };
  }

  try {
    // Fetch semua data kedatangan & kepulangan
    const arrivals = await prisma.attendancearrival.findMany({
      where: filter,
      include: { user: true },
    });
    const departures = await prisma.attendancedeparture.findMany({
      where: filter,
      include: { user: true },
    });

    return NextResponse.json({ arrivals, departures });
  } catch (err) {
    console.error('❌ Error fetching attendance:', err);
    return NextResponse.json({ message: 'Gagal mengambil data absensi' }, { status: 500 });
  }
}

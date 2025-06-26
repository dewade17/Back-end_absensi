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
  const userId = pathname.replace(/\/$/, '').split('/').pop();
  if (!userId) {
    return NextResponse.json({ message: 'User ID tidak valid di URL' }, { status: 400 });
  }

  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const skip = (page - 1) * limit;

  const tanggal = searchParams.get('tanggal');
  let dateFilter = {};

  if (tanggal && /^\d{4}-\d{2}$/.test(tanggal)) {
    const start = new Date(`${tanggal}-01T00:00:00.000Z`);
    const end = new Date(new Date(start).setMonth(start.getMonth() + 1) - 1);
    dateFilter = {
      tanggal: {
        gte: start,
        lte: end,
      },
    };
  } else if (tanggal && /^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
    const dateStart = new Date(`${tanggal}T00:00:00.000Z`);
    const dateEnd = new Date(`${tanggal}T23:59:59.999Z`);
    dateFilter = {
      tanggal: {
        gte: dateStart,
        lte: dateEnd,
      },
    };
  } else if (tanggal && tanggal !== 'default') {
    return NextResponse.json({ message: 'Format tanggal tidak valid' }, { status: 400 });
  }

  try {
    // Ambil semua data (tanpa skip/take dulu)
    const rawArrivals = await prisma.attendancearrival.findMany({
      where: { user_id: userId, ...dateFilter },
      orderBy: { tanggal: 'desc' },
    });

    const rawDepartures = await prisma.attendancedeparture.findMany({
      where: { user_id: userId, ...dateFilter },
      orderBy: { tanggal: 'desc' },
    });

    // Gabungkan dan beri tipe
    const combined = [...rawArrivals.map((item) => ({ ...item, type: 'arrival' })), ...rawDepartures.map((item) => ({ ...item, type: 'departure' }))];

    // Sort by tanggal desc
    combined.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

    const totalItems = combined.length;
    const totalPages = Math.ceil(totalItems / limit);
    const paginated = combined.slice(skip, skip + limit);

    const arrivals = paginated.filter((item) => item.type === 'arrival');
    const departures = paginated.filter((item) => item.type === 'departure');

    return NextResponse.json({
      message: 'Rekap absensi berhasil diambil',
      data: { arrivals, departures },
      meta: {
        totalItems,
        totalArrivals: rawArrivals.length,
        totalDepartures: rawDepartures.length,
        totalPages,
        currentPage: page,
        perPage: limit,
      },
    });
  } catch (err) {
    console.error('❌ Error rekap absensi:', err);
    return NextResponse.json({ message: 'Gagal mengambil data rekap absensi' }, { status: 500 });
  }
}

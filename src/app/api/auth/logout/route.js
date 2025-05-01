import { NextResponse } from 'next/server';

export async function POST() {
  // Logout di client: cukup hapus token dari localStorage atau cookies
  return NextResponse.json({ message: 'Logout berhasil (hapus token di client)' }, { status: 200 });
}

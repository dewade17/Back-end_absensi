import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import transporter from '@/lib/mailer';

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: 'Email wajib diisi' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ message: 'User tidak ditemukan' }, { status: 404 });
    }

    // Buat token 4 digit angka
    const token = Math.floor(1000 + Math.random() * 9000).toString(); // 1000–9999
    const expiry = new Date(Date.now() + 1000 * 60 * 10); // Berlaku 10 menit

    // Simpan token & expiry
    await prisma.user.update({
      where: { email },
      data: {
        resetToken: token,
        resetTokenExpiry: expiry,
      },
    });

    // Kirim email berisi token
    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject: 'Kode Reset Password',
      html: `
        <p>Halo ${user.nama},</p>
        <p>Kami menerima permintaan reset password untuk akun Anda.</p>
        <p>Berikut adalah kode verifikasi Anda:</p>
        <h2>${token}</h2>
        <p>Kode ini hanya berlaku selama 10 menit.</p>
        <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
      `,
    });

    return NextResponse.json({ message: 'Kode reset telah dikirim ke email.' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Gagal mengirim token reset', error: error.message }, { status: 500 });
  }
}

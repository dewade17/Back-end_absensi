// helpers/exportToCSV.js

export function exportToCSV(data, filename = 'data_absensi.csv') {
  // Kolom/field CSV, urutan harus sesuai dengan data yang akan di-export
  const header = ['Nama Karyawan', 'Tanggal', 'Kedatangan', 'Kepulangan', 'Lokasi Verified', 'Face Verified Kedatangan', 'Face Verified Kepulangan'];

  // Ekstrak isi teks dari Tag atau ReactNode
  const rows = data.map((row) => [
    row.nama,
    row.tanggal,
    typeof row.jamKedatangan === 'string' ? row.jamKedatangan : row.jamKedatangan?.props?.children ?? '',
    typeof row.jamKepulangan === 'string' ? row.jamKepulangan : row.jamKepulangan?.props?.children ?? '',
    typeof row.lokasiVerified === 'string' ? row.lokasiVerified : row.lokasiVerified?.props?.children ?? '',
    typeof row.faceVerifiedKedatangan === 'string' ? row.faceVerifiedKedatangan : row.faceVerifiedKedatangan?.props?.children ?? '',
    typeof row.faceVerifiedKepulangan === 'string' ? row.faceVerifiedKepulangan : row.faceVerifiedKepulangan?.props?.children ?? '',
  ]);

  // Buat CSV string
  const csvContent = [
    header.join(','), // Header
    ...rows.map((r) => r.map((cell) => `"${(cell ?? '').toString().replace(/"/g, '""')}"`).join(',')),
  ].join('\r\n');

  // Download otomatis
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

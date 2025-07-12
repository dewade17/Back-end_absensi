// utils/imageHelpers.js

// Konversi file ke base64, panggil callback dengan result-nya
export function getBase64(file, cb) {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => cb(reader.result);
}

// Untuk mengubah value (base64, object, array) ke fileList AntD Upload
export function toFileList(foto_profil) {
  if (!foto_profil) return [];
  if (Array.isArray(foto_profil)) return foto_profil;
  if (typeof foto_profil === 'string') {
    return [
      {
        uid: '-1',
        name: 'foto_profil',
        status: 'done',
        url: foto_profil,
      },
    ];
  }
  if (typeof foto_profil === 'object') return [foto_profil];
  return [];
}

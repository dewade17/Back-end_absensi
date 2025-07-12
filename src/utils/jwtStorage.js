// utils/jwtStorage.js

let storage = null;

// Hanya inisialisasi di browser
if (typeof window !== 'undefined') {
  // Pakai require supaya tidak dievaluasi saat SSR
  const { EncryptStorage } = require('encrypt-storage');
  const SECRET_KEY = process.env.NEXT_PUBLIC_SECRET_KEY_STORE || 'dev_secret_key';
  storage = new EncryptStorage(SECRET_KEY, {
    storageType: 'localStorage',
  });
}

const TOKEN_KEY = 'token_auth';
const EXPIRES_KEY = 'token_expiration';

export const jwtStorage = {
  /**
   * Simpan token & waktu kadaluarsa (dalam detik)
   */
  async storeToken(token, expiresInSeconds) {
    if (!storage) return;
    const expirationTime = Date.now() + expiresInSeconds * 1000;
    await storage.setItem(TOKEN_KEY, token);
    await storage.setItem(EXPIRES_KEY, expirationTime);
  },

  /**
   * Ambil token jika belum expired, jika expired, hapus & jalankan onExpired
   * @param {Function} onExpired Fungsi yang dijalankan jika token expired (optional)
   * @returns {string|null}
   */
  async retrieveToken(onExpired = () => (window.location.href = '/login')) {
    if (!storage) return null;
    const token = await storage.getItem(TOKEN_KEY);
    const expiration = await storage.getItem(EXPIRES_KEY);

    if (token && expiration) {
      const now = Date.now();
      if (now > expiration) {
        await this.removeToken();
        if (typeof onExpired === 'function') onExpired();
        return null;
      }
      return token;
    }
    return null;
  },

  /**
   * Hapus semua token & data terkait
   */
  async removeToken() {
    if (!storage) return;
    await storage.removeItem(TOKEN_KEY);
    await storage.removeItem(EXPIRES_KEY);
    await storage.removeItem('token');
    await storage.removeItem('user');
  },
};

Object.freeze(jwtStorage);

// utils/apiAuth.js
import { jwtStorage } from './jwtStorage';

export const apiAuth = {
  async post(url, body) {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Gagal mengirim data');
    return data;
  },

  async getDataPrivate(url, onExpired = () => (window.location.href = '/login')) {
    const token = await jwtStorage.retrieveToken(onExpired);
    if (!token) return { isExpiredJWT: true };

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Gagal fetch data (auth)');
    return data;
  },

  async postDataPrivate(url, body, onExpired = () => (window.location.href = '/login')) {
    const token = await jwtStorage.retrieveToken(onExpired);
    if (!token) return { isExpiredJWT: true };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Gagal mengirim data (auth)');
    return data;
  },

  async putDataPrivate(url, body, onExpired = () => (window.location.href = '/login')) {
    const token = await jwtStorage.retrieveToken(onExpired);
    if (!token) return { isExpiredJWT: true };

    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Gagal mengubah data (auth)');
    return data;
  },

  async deleteDataPrivate(url, onExpired = () => (window.location.href = '/login')) {
    const token = await jwtStorage.retrieveToken(onExpired);
    if (!token) return { isExpiredJWT: true };

    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Gagal menghapus data (auth)');
    return data;
  },

  async deleteWithAdmin(url, adminPassword, onExpired = () => (window.location.href = '/login')) {
    const token = await jwtStorage.retrieveToken(onExpired);
    if (!token) return { isExpiredJWT: true };

    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ adminPassword }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Gagal menghapus data (auth)');
    return data;
  },
};

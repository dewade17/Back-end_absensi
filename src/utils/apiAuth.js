// Fungsi API dengan token Authorization
export const apiAuth = {
  async getDataPrivate(url, token) {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Gagal fetch data (auth)');
    return data;
  },

  async postDataPrivate(url, body, token) {
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

  async putDataPrivate(url, body, token) {
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

  async deleteDataPrivate(url, token) {
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
};

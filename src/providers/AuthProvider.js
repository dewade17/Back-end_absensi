'use client';

import { createContext, useEffect, useState } from 'react';
import { jwtStorage } from '@/utils/jwtStorage';
import { apiAuth } from '@/utils/apiAuth';
import { useRouter } from 'next/navigation';

export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [userProfile, setUserProfile] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadToken = async () => {
      const savedToken = await jwtStorage.retrieveToken(() => setIsLoading(false));
      if (savedToken) {
        setToken(savedToken);
        await fetchUserData();
      } else {
        setIsLoading(false);
      }
    };
    loadToken();
  }, []);

  const fetchUserData = async () => {
    try {
      const data = await apiAuth.getDataPrivate('/api/auth/getdataprivate');

      if (data?.user) {
        if (data.user.role !== 'ADMIN') {
          console.warn('❌ Akses ditolak: bukan ADMIN');
          await logout();
          router.push('/login');
          return;
        }

        setUserProfile(data.user);
        setIsLoggedIn(true);
        router.push('/admin/dashboard'); // ✅ Pindahkan redirect ke sini
      } else {
        await logout();
      }
    } catch (err) {
      console.error('❌ Gagal fetch user:', err);
      await logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (token, expiresIn = 3600) => {
    setToken(token);
    await jwtStorage.storeToken(token, expiresIn);
    setIsLoading(true);
    await fetchUserData(); // ⏳ Redirect akan dilakukan setelah sukses & role valid
  };

  const logout = async () => {
    await jwtStorage.removeToken();
    setToken(null);
    setUserProfile(null);
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        isLoggedIn,
        userProfile,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

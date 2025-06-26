'use client';

import { createContext, useEffect, useState } from 'react';

export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [userProfile, setUserProfile] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // ⏳ loading state

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      fetchUserData(savedToken);
    } else {
      setIsLoading(false); // selesai tanpa token
    }
  }, []);

  const fetchUserData = async (token) => {
    try {
      const res = await fetch('/api/auth/getdataprivate', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok && data.user) {
        setUserProfile(data.user);
        setIsLoggedIn(true);
        localStorage.setItem('user', JSON.stringify(data.user));
      } else {
        setIsLoggedIn(false);
        setUserProfile(null);
      }
    } catch (err) {
      console.error('❌ Gagal fetch user:', err);
      setIsLoggedIn(false);
      setUserProfile(null);
    } finally {
      setIsLoading(false); // selesai fetch
    }
  };

  const login = async (token) => {
    setToken(token);
    localStorage.setItem('token', token);
    setIsLoading(true); // siapkan loading ulang
    await fetchUserData(token);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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

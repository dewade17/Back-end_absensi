// src/app/layout.js
'use client';
import 'antd/dist/reset.css'; // Reset style
import React from 'react';
import AuthProvider from '@/providers/AuthProvider';

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

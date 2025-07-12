import './globals.css';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import AuthProvider from '@/providers/AuthProvider'; // Ganti sesuai provider-mu
// app/layout.tsx
import 'antd/dist/reset.css'; // import global reset style antd

export const metadata = {
  title: 'SIHADIR',
  icons: {
    icon: '/assets/icon/favicon.ico',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <body>
        <AuthProvider>
          <AntdRegistry>{children}</AntdRegistry>
        </AuthProvider>
      </body>
    </html>
  );
}

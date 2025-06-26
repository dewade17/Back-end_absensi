'use client';

import React, { useState, useContext, useEffect } from 'react';
import Link from 'next/link';
import { Layout, Menu, Drawer, Button, Dropdown, Avatar, Modal, Flex, Image, ConfigProvider } from 'antd'; // HAPUS Footer dari sini!
import { HomeOutlined, UserOutlined, ScheduleOutlined, CalendarOutlined, BankOutlined, EnvironmentOutlined, SettingOutlined, ReloadOutlined, MenuOutlined, LogoutOutlined } from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import { AuthContext } from '@/providers/AuthProvider';

const { Sider, Content, Footer } = Layout; // Tambahkan Footer dari Layout!

function getItem(label, key, icon, children) {
  return { key, icon, children, label };
}

// Menu untuk dashboard admin
const items = [
  getItem(<Link href='/dashboard/admin'>Home</Link>, 'home', <HomeOutlined />),
  getItem('Manajemen Absensi', 'absensi', <UserOutlined />, [getItem(<Link href='/dashboard/admin/absensi/guru'>Guru</Link>, 'absensi-guru'), getItem(<Link href='/dashboard/admin/absensi/pegawai'>Pegawai</Link>, 'absensi-pegawai')]),
  getItem(<Link href='/dashboard/admin/verifikasi'>Verifikasi Izin/Sakit/Cuti</Link>, 'verifikasi', <ScheduleOutlined />),
  getItem(<Link href='/dashboard/admin/agenda-kerja'>Agenda Kerja</Link>, 'agenda-kerja', <CalendarOutlined />),
  getItem(<Link href='/dashboard/admin/agenda-mengajar'>Agenda Mengajar</Link>, 'agenda-mengajar', <CalendarOutlined />),
  getItem(<Link href='/dashboard/admin/profile-sekolah'>Profil Sekolah</Link>, 'profil', <BankOutlined />),
  getItem(<Link href='/dashboard/admin/lokasi'>Manajemen Lokasi</Link>, 'lokasi', <EnvironmentOutlined />),
  getItem(<Link href='/dashboard/admin/pengguna'>Manajemen Pengguna</Link>, 'pengguna', <SettingOutlined />),
  getItem(<Link href='/dashboard/admin/reset-face'>Reset Face</Link>, 'reset-face', <ReloadOutlined />),
];

const menuMap = {
  '/dashboard/admin': 'home',
  '/dashboard/admin/absensi/guru': 'absensi-guru',
  '/dashboard/admin/absensi/pegawai': 'absensi-pegawai',
  '/dashboard/admin/verifikasi': 'verifikasi',
  '/dashboard/admin/agenda-kerja': 'agenda-kerja',
  '/dashboard/admin/agenda-mengajar': 'agenda-mengajar',
  '/dashboard/admin/profile-sekolah': 'profil',
  '/dashboard/admin/lokasi': 'lokasi',
  '/dashboard/admin/pengguna': 'pengguna',
  '/dashboard/admin/reset-face': 'reset-face',
};

const AdminDashboardLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const { userProfile, isLoggedIn, isLoading, logout } = useContext(AuthContext);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Autologout jika bukan ADMIN
  useEffect(() => {
    if (!isLoading && (!isLoggedIn || userProfile?.role !== 'ADMIN')) {
      router.push('/login');
    }
  }, [isLoading, isLoggedIn, userProfile, router]);

  // Pastikan sidebar tertutup ketika resize ke desktop
  useEffect(() => {
    if (!isMobile) setDrawerVisible(false);
  }, [isMobile]);

  // Pilih menu aktif
  function getSelectedKeys(pathname) {
    // direct match
    const found = Object.entries(menuMap).find(([k, v]) => pathname.startsWith(k));
    return found ? [found[1]] : [];
  }
  const selectedKeys = getSelectedKeys(pathname);

  // Logout Modal
  const handleConfirmLogout = () => {
    Modal.confirm({
      title: 'Keluar dari akun?',
      okText: 'Logout',
      cancelText: 'Batal',
      onOk: () => {
        logout && logout();
        router.push('/login');
      },
    });
  };

  const menu = (
    <Menu
      items={[
        {
          key: 'logout',
          label: 'Keluar',
          icon: <LogoutOutlined />,
          onClick: handleConfirmLogout,
        },
      ]}
    />
  );

  const primaryColor = '#1677ff';

  return (
    <ConfigProvider
      theme={{
        components: {
          Layout: { siderBg: 'white', triggerBg: primaryColor, triggerColor: 'white', footerBg: 'white' },
          Menu: { colorBgContainer: 'white', colorText: primaryColor },
        },
        token: { colorPrimary: primaryColor },
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        {/* SIDEBAR Desktop */}
        {!isMobile && (
          <Sider
            collapsible
            collapsed={collapsed}
            onCollapse={setCollapsed}
            style={{
              position: 'fixed',
              height: '100vh',
              overflowY: 'auto',
              left: 0,
              zIndex: 1000,
              boxShadow: '8px 0 10px -5px rgba(0,0,0,0.07)',
            }}
            width={200}
          >
            <div style={{ padding: '16px', textAlign: 'center' }}>
              <Image
                src='/assets/images/logo_login.png'
                alt='Logo'
                width={80}
                preview={false}
              />
            </div>
            <Menu
              mode='inline'
              selectedKeys={selectedKeys}
              items={items}
            />
          </Sider>
        )}

        {/* DRAWER Mobile */}
        {isMobile && (
          <Drawer
            title='Menu'
            placement='left'
            closable={true}
            onClose={() => setDrawerVisible(false)}
            open={drawerVisible}
            bodyStyle={{ padding: 0 }}
          >
            <Menu
              mode='inline'
              selectedKeys={selectedKeys}
              items={items}
            />
          </Drawer>
        )}

        {/* MAIN CONTENT + HEADER */}
        <Layout style={{ marginLeft: !isMobile ? (collapsed ? 80 : 200) : 0, marginTop: 50, transition: 'margin-left 0.2s' }}>
          {/* HEADER */}
          <Flex
            align='center'
            justify='space-between'
            style={{
              paddingBlock: '1rem',
              paddingInline: '1rem',
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 998,
              backgroundColor: '#FFFFFF',
              boxShadow: '0px 2px 4px rgba(0,0,0,0.07)',
            }}
          >
            {/* Hamburger Mobile */}
            {isMobile && (
              <Button
                type='text'
                icon={<MenuOutlined />}
                onClick={() => setDrawerVisible(true)}
              />
            )}
            <Flex
              justify='end'
              align='center'
              gap={20}
              style={{ flex: 1 }}
            >
              <Dropdown
                overlay={menu}
                trigger={['click']}
              >
                <a
                  onClick={(e) => e.preventDefault()}
                  style={{ display: 'flex', alignItems: 'center' }}
                >
                  <Flex
                    gap={10}
                    style={{ display: 'flex', alignItems: 'center', marginRight: 10 }}
                  >
                    <Avatar icon={<UserOutlined />} />
                    <div style={{ color: 'black', textAlign: 'right' }}>
                      <div>{userProfile?.nama || userProfile?.username || 'Admin'}</div>
                      <div style={{ fontSize: 'smaller', marginTop: 5 }}>ADMIN</div>
                    </div>
                  </Flex>
                </a>
              </Dropdown>
            </Flex>
          </Flex>

          {/* CONTENT */}
          <Content style={{ margin: '40px 16px', padding: 24, minHeight: '100vh' }}>{children}</Content>
          {/* FOOTER */}
          <Footer style={{ textAlign: 'center', boxShadow: '0px -5px 10px rgba(0,0,0,0.07)' }}>Absensi Panel ©{new Date().getFullYear()}</Footer>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

export default AdminDashboardLayout;

'use client';

import React, { useState, useContext, useEffect } from 'react';
import Link from 'next/link';
import { Layout, Menu, Drawer, Button, Dropdown, Avatar, Modal, Flex, Image, ConfigProvider, Skeleton, notification } from 'antd';
import { HomeOutlined, UserOutlined, ScheduleOutlined, CalendarOutlined, BankOutlined, EnvironmentOutlined, SettingOutlined, ReloadOutlined, MenuOutlined, LogoutOutlined } from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import { AuthContext } from '@/providers/AuthProvider';

const { Sider, Content, Footer } = Layout;

function getItem(label, key, icon, children) {
  return { key, icon, children, label };
}

const items = [
  getItem(<Link href='/admin/dashboard'>Home</Link>, 'home', <HomeOutlined />),
  getItem('Manajemen Absensi', 'absensi', <UserOutlined />, [getItem(<Link href='/admin/absensi-karyawan'>Karyawan</Link>, 'absensi-karyawan')]),
  getItem(<Link href='/admin/verifikasi-karyawan'>Verifikasi Izin/Sakit/Cuti</Link>, 'verifikasi', <ScheduleOutlined />),
  getItem(<Link href='/admin/agenda-kerja'>Agenda Kerja</Link>, 'agenda-kerja', <CalendarOutlined />),
  getItem(<Link href='/admin/manajemen-profil-perusahaan'>Profil perusahaan</Link>, 'profil', <BankOutlined />),
  getItem(<Link href='/admin/manajemen-lokasi'>Manajemen Lokasi</Link>, 'lokasi', <EnvironmentOutlined />),
  getItem(<Link href='/admin/manajemen-pengguna'>Manajemen Pengguna</Link>, 'pengguna', <SettingOutlined />),
  getItem(<Link href='/admin/reset-face'>Reset Face</Link>, 'reset-face', <ReloadOutlined />),
];

const menuMap = {
  '/admin/dashboard': 'home',
  '/admin/absensi-karyawan': 'absensi-karyawan',
  '/admin/verifikasi-karyawan': 'verifikasi',
  '/admin/agenda-kerja': 'agenda-kerja',
  '/admin/manajemen-profil-perusahaan': 'profil',
  '/admin/manajemen-lokasi': 'lokasi',
  '/admin/manajemen-pengguna': 'pengguna',
  '/admin/reset-face': 'reset-face',
};

const AdminDashboardLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { userProfile, isLoggedIn, isLoading, logout } = useContext(AuthContext);
  const router = useRouter();
  const pathname = usePathname();
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isLoading && (!isLoggedIn || userProfile?.role !== 'ADMIN')) {
      router.push('/login');
    }
  }, [isLoading, isLoggedIn, userProfile, router]);

  useEffect(() => {
    if (!isMobile) setDrawerVisible(false);
  }, [isMobile]);

  function getSelectedKeys(pathname) {
    const found = Object.entries(menuMap).find(([k, v]) => pathname.startsWith(k));
    return found ? [found[1]] : [];
  }
  const selectedKeys = getSelectedKeys(pathname);

  const handleConfirmLogout = () => {
    setLogoutModalVisible(true);
  };

  const primaryColor = '#1677ff';

  if (isLoading) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Content style={{ padding: 40 }}>
          <Skeleton
            active
            avatar
            paragraph={{ rows: 6 }}
            title
          />
        </Content>
      </Layout>
    );
  }

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
                src='/assets/images/logo_green.png'
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
                menu={{
                  items: [
                    {
                      key: 'logout',
                      label: 'Keluar',
                      icon: <LogoutOutlined />,
                      onClick: handleConfirmLogout,
                    },
                  ],
                }}
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
          <Footer style={{ textAlign: 'center', boxShadow: '0px -5px 10px rgba(0,0,0,0.07)' }}>Si Hadir ©{new Date().getFullYear()}</Footer>
        </Layout>
      </Layout>
      <Modal
        title='Keluar dari akun?'
        open={logoutModalVisible}
        onOk={() => {
          logout?.();
          notification.success({
            message: 'Logout Berhasil',
            description: 'Anda telah keluar dari akun.',
          });
          router.push('/login');
          setLogoutModalVisible(false);
        }}
        onCancel={() => setLogoutModalVisible(false)}
        okText='Logout'
        cancelText='Batal'
        okType='danger'
        centered
      >
        <p>Anda yakin ingin keluar dari akun?</p>
      </Modal>
    </ConfigProvider>
  );
};

export default AdminDashboardLayout;

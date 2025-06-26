'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Layout, Menu, Drawer, Button } from 'antd';
import { HomeOutlined, UserOutlined, TeamOutlined, ScheduleOutlined, CalendarOutlined, BankOutlined, EnvironmentOutlined, SettingOutlined, ReloadOutlined, MenuOutlined } from '@ant-design/icons';

const { Sider, Content } = Layout;

function getItem(label, key, icon, children) {
  return { key, icon, children, label };
}

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

const AdminDashboardLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Drawer
        placement='left'
        closable={false}
        onClose={() => setDrawerVisible(false)}
        visible={drawerVisible}
        bodyStyle={{ padding: 0 }}
      >
        <Menu
          mode='inline'
          theme='dark'
          items={items}
          style={{ height: '100%' }}
        />
      </Drawer>

      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        breakpoint='lg'
        collapsedWidth='0'
        style={{ background: '#001529' }}
        className='hidden lg:block'
      >
        <div className='p-4 text-white text-xl font-bold'>Admin Panel</div>
        <Menu
          theme='dark'
          mode='inline'
          items={items}
        />
      </Sider>

      <Layout>
        <div className='lg:hidden p-2 bg-white shadow'>
          <Button
            icon={<MenuOutlined />}
            onClick={() => setDrawerVisible(true)}
          />
        </div>
        <Content style={{ margin: '24px 16px 0' }}>
          <div style={{ padding: 24, background: '#fff', minHeight: 360 }}>{children}</div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminDashboardLayout;

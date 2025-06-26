    'use client';

    import React from 'react';
    import { Typography } from 'antd';

    const { Title, Paragraph } = Typography;

    const AdminDashboardPage = () => {
    return (
        <div>
        <Title level={2}>Selamat Datang di Dashboard Admin</Title>
        <Paragraph>Gunakan menu di sebelah kiri untuk mengakses fitur manajemen absensi, agenda kerja, lokasi, pengguna, dan lainnya.</Paragraph>
        </div>
    );
    };

    export default AdminDashboardPage;

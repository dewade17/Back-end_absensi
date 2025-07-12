'use client';

import React, { useEffect, useState } from 'react';
import { Typography, Col, Row, Card, Image, Skeleton, message } from 'antd';
import { UserOutlined, CheckCircleOutlined, BarsOutlined } from '@ant-design/icons';
import { apiAuth } from '@/utils/apiAuth';

const { Title, Text } = Typography;

const AdminDashboardPage = () => {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: 0,
    verifications: 0,
    teachingAgenda: 0, // boleh dihapus jika tidak dipakai
    workAgenda: 0,
  });

  useEffect(() => {
    async function fetchCompany() {
      setLoading(true);
      try {
        const res = await apiAuth.getDataPrivate('/api/company');
        if (res.companies && res.companies.length > 0) {
          setCompany(res.companies[0]);
        } else {
          setCompany(null);
        }

        // Contoh stat dummy, ganti jika sudah ada API statistik
        setStats({
          users: 36,
          verifications: 5,
          teachingAgenda: 15, // boleh dihapus jika tidak dipakai
          workAgenda: 10,
        });
      } catch (err) {
        message.error(err.message);
      }
      setLoading(false);
    }
    fetchCompany();
  }, []);

  return (
    <div>
      {/* Profil Perusahaan */}
      <Card
        title='Profil Perusahaan'
        style={{ marginBottom: 24 }}
      >
        <Row
          align='middle'
          gutter={16}
        >
          <Col flex='120px'>
            {loading ? (
              <Skeleton.Avatar
                size={64}
                active
              />
            ) : (
              <Image
                src={company?.logo_url || '/school_logo.png'}
                alt='Logo Perusahaan'
                width={150}
                height={150}
                style={{
                  objectFit: 'contain',
                  borderRadius: 12,
                  background: '#fff',
                  border: '1px solid #eee',
                  padding: 8,
                }}
                fallback='/company_logo.png'
                preview={false}
              />
            )}
          </Col>
          <Col flex='auto'>
            {loading ? (
              <Skeleton
                paragraph={{ rows: 3 }}
                active
                title={false}
              />
            ) : company ? (
              <>
                <Text strong>{company.nama}</Text>
                <br />
                <Text>
                  Telepon: <a href={`tel:${company.telepon}`}>{company.telepon}</a>
                </Text>
                <br />
                <Text>Alamat: {company.alamat}</Text>
                <br />
                <Text>Email: {company.email}</Text>
                <br />
              </>
            ) : (
              <Text type='danger'>Data Perusahaan tidak ditemukan.</Text>
            )}
          </Col>
        </Row>
      </Card>

      {/* Statistik Dashboard */}
      <Row
        gutter={[16, 16]}
        justify='center'
      >
        <Col
          xs={24}
          sm={12}
          md={6}
        >
          <Card
            style={{ backgroundColor: '#4096ff', color: 'white' }}
            bodyStyle={{ textAlign: 'center' }}
          >
            {loading ? (
              <Skeleton.Input
                active
                size='large'
                style={{ width: 40, marginBottom: 8 }}
              />
            ) : (
              <Title
                level={2}
                style={{ color: 'white', margin: 0 }}
              >
                {stats.users}
              </Title>
            )}
            <UserOutlined style={{ fontSize: 32, color: 'white' }} />
            <div>Karyawan</div>
          </Card>
        </Col>

        <Col
          xs={24}
          sm={12}
          md={6}
        >
          <Card
            style={{ backgroundColor: '#4096ff', color: 'white' }}
            bodyStyle={{ textAlign: 'center' }}
          >
            {loading ? (
              <Skeleton.Input
                active
                size='large'
                style={{ width: 40, marginBottom: 8 }}
              />
            ) : (
              <Title
                level={2}
                style={{ color: 'white', margin: 0 }}
              >
                {stats.verifications}
              </Title>
            )}
            <CheckCircleOutlined style={{ fontSize: 32, color: 'white' }} />
            <div>Verifikasi Izin/Sakit/Cuti</div>
          </Card>
        </Col>

        <Col
          xs={24}
          sm={12}
          md={6}
        >
          <Card
            style={{ backgroundColor: '#4096ff', color: 'white' }}
            bodyStyle={{ textAlign: 'center' }}
          >
            {loading ? (
              <Skeleton.Input
                active
                size='large'
                style={{ width: 40, marginBottom: 8 }}
              />
            ) : (
              <Title
                level={2}
                style={{ color: 'white', margin: 0 }}
              >
                {stats.workAgenda}
              </Title>
            )}
            <BarsOutlined style={{ fontSize: 32, color: 'white' }} />
            <div>Agenda Kerja</div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboardPage;

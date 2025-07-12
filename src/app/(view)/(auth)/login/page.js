'use client';

import React, { useState, useContext } from 'react';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Col, Form, Image, Input, Layout, Row, notification } from 'antd';
import { AuthContext } from '@/providers/AuthProvider';
import { apiAuth } from '@/utils/apiAuth';

const { Content } = Layout;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const [api, contextHolder] = notification.useNotification();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const loginData = await apiAuth.post('/api/auth/login', values);

      // ❌ Jika login gagal (tidak ada token)
      if (!loginData.token) {
        api.error({
          message: 'Login Gagal',
          description: loginData.message || 'Email atau password salah.',
        });
        setLoading(false);
        return;
      }

      // ✅ Simpan token dan mulai login
      await login(loginData.token, loginData.expiresIn || 3600);

      // ✅ Tampilkan notifikasi berhasil
      api.success({
        message: 'Login Berhasil',
        description: 'Selamat datang di dashboard admin.',
      });

      // ⛔ Redirect sudah dilakukan di AuthProvider → tidak perlu push di sini
    } catch (error) {
      console.error('Login error:', error);
      api.error({
        message: 'Terjadi Kesalahan',
        description: 'Gagal login. Silakan coba beberapa saat lagi.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {contextHolder}
      <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Row
          gutter={100}
          justify='center'
          align='middle'
          style={{ width: '100%' }}
        >
          <Col
            md={12}
            style={{ textAlign: 'center' }}
          >
            <Image
              src='/assets/images/Karakter_login.png'
              alt='Logo'
              preview={false}
              width={350}
              height={350}
            />
          </Col>
          <Col md={8}>
            <h1 style={{ textAlign: 'center' }}>Dashboard Admin</h1>
            <p style={{ textAlign: 'center' }}>Silakan login terlebih dahulu</p>
            <Form
              layout='vertical'
              onFinish={onFinish}
            >
              <Form.Item
                name='email'
                rules={[{ required: true, message: 'Masukkan email Anda!' }]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder='Email'
                  size='large'
                />
              </Form.Item>
              <Form.Item
                name='password'
                rules={[{ required: true, message: 'Masukkan password Anda!' }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder='Password'
                  size='large'
                />
              </Form.Item>
              <Form.Item>
                <Button
                  type='primary'
                  htmlType='submit'
                  loading={loading}
                  block
                  size='large'
                >
                  Masuk
                </Button>
              </Form.Item>
            </Form>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}

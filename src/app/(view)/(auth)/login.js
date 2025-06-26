'use client';

import React, { useState } from 'react';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Col, Form, Image, Input, Layout, Row, message } from 'antd';
import { useRouter } from 'next/navigation';

const { Content } = Layout;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        message.success('Login berhasil!');
        router.push('/dashboard/admin');
      } else {
        message.error(data.message || 'Email atau password salah');
      }
    } catch (error) {
      console.error('Login error:', error);
      message.error('Terjadi kesalahan saat login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
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
              src='/assets/images/logo.png'
              alt='Logo'
              preview={false}
              width={240}
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

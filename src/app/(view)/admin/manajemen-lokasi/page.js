'use client';

import React, { useState, useEffect } from 'react';
import { Typography, Button, Card, Col, Row, Space, Input, FloatButton, Modal, Form, Tag, Skeleton, notification, Empty } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { apiAuth } from '@/utils/apiAuth';

const { Title, Paragraph } = Typography;
const SKELETON_COUNT = 4;

const ManajemenLokasiPage = () => {
  // State utama
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  // State modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // State untuk edit/hapus
  const [editingLocation, setEditingLocation] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Form instance
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [api, contextHolder] = notification.useNotification();

  // Custom label required
  const customizeRequiredMark = (label, { required }) => (
    <>
      {required ? <Tag color='error'>Required</Tag> : <Tag color='warning'>Optional</Tag>} {label}
    </>
  );

  // Ambil data lokasi dari API
  const fetchLocations = async () => {
    setLoading(true);
    try {
      const res = await apiAuth.getDataPrivate('/api/location');
      setLocations(res.locations || []);
    } catch (e) {
      api.error({ message: 'Gagal memuat lokasi', description: e.message });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  // Tambah lokasi
  const handleAddLocation = async (values) => {
    try {
      await apiAuth.postDataPrivate('/api/location', values);
      api.success({ message: 'Lokasi ditambah' });
      setAddModalOpen(false);
      form.resetFields();
      fetchLocations();
    } catch (e) {
      api.error({ message: 'Gagal tambah lokasi', description: e.message });
    }
  };

  // Edit lokasi
  const handleEditLocation = async (values) => {
    try {
      await apiAuth.putDataPrivate(`/api/location/${editingLocation.location_id}`, values);
      api.success({ message: 'Lokasi diperbarui' });
      setEditModalOpen(false);
      setEditingLocation(null);
      editForm.resetFields();
      fetchLocations();
    } catch (e) {
      api.error({ message: 'Gagal update lokasi', description: e.message });
    }
  };

  // Hapus lokasi
  const handleDeleteLocation = async () => {
    if (!selectedLocation) return;
    try {
      await apiAuth.deleteDataPrivate(`/api/location/${selectedLocation.location_id}`);
      api.success({ message: 'Lokasi dihapus' });
      setDeleteModalOpen(false);
      setSelectedLocation(null);
      fetchLocations();
    } catch (e) {
      api.error({ message: 'Gagal hapus lokasi', description: e.message });
    }
  };

  return (
    <div>
      {contextHolder}
      <Card>
        <Title level={2}>Manajemen Lokasi</Title>
        <Paragraph>Simpan lokasi Kantor pada halaman ini.</Paragraph>
      </Card>
      <Row
        gutter={{ xs: 8, sm: 16, md: 24, lg: 32 }}
        className='mt-5'
      >
        {loading ? (
          Array.from({ length: SKELETON_COUNT }).map((_, idx) => (
            <Col
              span={6}
              key={`skeleton-${idx}`}
            >
              <Card style={{ width: 300 }}>
                <Skeleton
                  avatar
                  active
                  paragraph={{ rows: 3 }}
                />
              </Card>
            </Col>
          ))
        ) : locations.length === 0 ? (
          <Col
            span={24}
            style={{ textAlign: 'center', marginTop: 48 }}
          >
            <Empty description='Belum ada data lokasi' />
          </Col>
        ) : (
          locations.map((loc) => (
            <Col
              span={6}
              key={loc.location_id}
              className='mb-4'
            >
              <Card
                title={loc.nama_lokasi}
                actions={[
                  <EditOutlined
                    key='edit'
                    onClick={() => {
                      setEditModalOpen(true);
                      setEditingLocation(loc);
                      editForm.setFieldsValue(loc);
                    }}
                  />,
                  <DeleteOutlined
                    key='delete'
                    style={{ color: 'red', cursor: 'pointer' }}
                    onClick={() => {
                      setDeleteModalOpen(true);
                      setSelectedLocation(loc);
                    }}
                  />,
                ]}
                style={{ width: 300 }}
              >
                <p>Latitude : {loc.latitude}</p>
                <p>Longitude : {loc.longitude}</p>
                <p>Radius : {loc.radius}</p>
              </Card>
            </Col>
          ))
        )}
      </Row>

      {/* Modal Tambah */}
      <Modal
        open={addModalOpen}
        title='Tambah Data Lokasi'
        onCancel={() => {
          setAddModalOpen(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout='vertical'
          requiredMark={customizeRequiredMark}
          onFinish={handleAddLocation}
        >
          <Form.Item
            label='Nama Lokasi'
            name='nama_lokasi'
            required
            rules={[{ required: true, message: 'Nama lokasi wajib diisi!' }]}
          >
            <Input placeholder='Input nama lokasi' />
          </Form.Item>
          <Form.Item
            label='Latitude'
            name='latitude'
            required
            rules={[{ required: true, message: 'Latitude wajib diisi!' }]}
          >
            <Input
              placeholder='Contoh: -8.1028273'
              type='number'
            />
          </Form.Item>
          <Form.Item
            label='Longitude'
            name='longitude'
            required
            rules={[{ required: true, message: 'Longitude wajib diisi!' }]}
          >
            <Input
              placeholder='Contoh: 115.0182837'
              type='number'
            />
          </Form.Item>
          <Form.Item
            label='Radius'
            name='radius'
            required
            rules={[{ required: true, message: 'Radius wajib diisi!' }]}
          >
            <Input
              placeholder='Contoh: 100'
              type='number'
            />
          </Form.Item>
          <Form.Item>
            <Button
              type='primary'
              htmlType='submit'
            >
              Simpan
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Edit */}
      <Modal
        open={editModalOpen}
        title='Edit Data Lokasi'
        onCancel={() => {
          setEditModalOpen(false);
          setEditingLocation(null);
          editForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={editForm}
          layout='vertical'
          requiredMark={customizeRequiredMark}
          onFinish={handleEditLocation}
        >
          <Form.Item
            label='Nama Lokasi'
            name='nama_lokasi'
            required
            rules={[{ required: true, message: 'Nama lokasi wajib diisi!' }]}
          >
            <Input placeholder='Input nama lokasi' />
          </Form.Item>
          <Form.Item
            label='Latitude'
            name='latitude'
            required
            rules={[{ required: true, message: 'Latitude wajib diisi!' }]}
          >
            <Input
              placeholder='Contoh: -8.1028273'
              type='number'
            />
          </Form.Item>
          <Form.Item
            label='Longitude'
            name='longitude'
            required
            rules={[{ required: true, message: 'Longitude wajib diisi!' }]}
          >
            <Input
              placeholder='Contoh: 115.0182837'
              type='number'
            />
          </Form.Item>
          <Form.Item
            label='Radius'
            name='radius'
            required
            rules={[{ required: true, message: 'Radius wajib diisi!' }]}
          >
            <Input
              placeholder='Contoh: 100'
              type='number'
            />
          </Form.Item>
          <Form.Item>
            <Button
              type='primary'
              htmlType='submit'
            >
              Simpan
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Konfirmasi Hapus */}
      <Modal
        open={deleteModalOpen}
        title='Konfirmasi Hapus Lokasi'
        onCancel={() => setDeleteModalOpen(false)}
        onOk={handleDeleteLocation}
        okText='Hapus'
        okButtonProps={{ danger: true }}
      >
        <p>Apakah Anda yakin ingin menghapus data lokasi ini?</p>
      </Modal>

      <FloatButton onClick={() => setAddModalOpen(true)} />
    </div>
  );
};

export default ManajemenLokasiPage;

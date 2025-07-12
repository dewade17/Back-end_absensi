'use client';

import React, { useState, useEffect } from 'react';
import { Typography, Button, Flex, Card, Col, Row, Space, Input, FloatButton, Modal, Form, Tag, Select, Upload, notification, Skeleton, Empty } from 'antd';
import { EditOutlined, PlusOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { apiAuth } from '@/utils/apiAuth';
import { getBase64, toFileList } from '@/helpers/imageHelper';

const { Title, Paragraph } = Typography;
const { Search } = Input;

const SKELETON_COUNT = 4;

const ManajemenPenggunaPage = () => {
  const [api, contextHolder] = notification.useNotification();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  // State khusus base64 foto profil (add & edit)
  const [fotoProfilBase64, setFotoProfilBase64] = useState('');
  const [editFotoProfilBase64, setEditFotoProfilBase64] = useState('');

  // Fetch user
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await apiAuth.getDataPrivate('/api/admin/manajemen-pengguna');
      setUsers(data.users || []);
      setFilteredUsers(data.users || []);
    } catch (e) {
      api.error({
        message: 'Gagal Fetch Data',
        description: e.message || 'Gagal mengambil data user.',
      });
    }
    setLoadingUsers(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);
  useEffect(() => {
    setFilteredUsers(users.filter((u) => (u.nama && u.nama.toLowerCase().includes(search.toLowerCase())) || (u.email && u.email.toLowerCase().includes(search.toLowerCase())) || (u.nip || '').toLowerCase().includes(search.toLowerCase())));
  }, [search, users]);

  // Register handler
  const handleRegister = async (values) => {
    try {
      await apiAuth.post('/api/auth/register', {
        ...values,
        foto_profil: fotoProfilBase64,
      });
      api.success({
        message: 'User Ditambahkan',
        description: 'Data user berhasil ditambahkan.',
      });
      setAddModalOpen(false);
      fetchUsers();
      form.resetFields();
      setFotoProfilBase64('');
    } catch (e) {
      api.error({
        message: 'Gagal Tambah User',
        description: e.message || 'Gagal menambah user.',
      });
    }
  };

  // Edit handler
  const handleEdit = (user) => {
    setEditingUser(user);
    setEditModalOpen(true);
    editForm.setFieldsValue({
      email: user.email,
      nama: user.nama,
      nip: user.nip,
      no_hp: user.no_hp,
      status: user.status || 'AKTIF',
      foto_profil: toFileList(user.foto_profil),
    });
    setEditFotoProfilBase64(user.foto_profil || '');
  };

  // Edit submit
  const handleEditSubmit = async (values) => {
    try {
      await apiAuth.putDataPrivate(`/api/admin/manajemen-pengguna/${editingUser.user_id}`, {
        ...values,
        foto_profil: editFotoProfilBase64,
      });
      api.success({
        message: 'User Diupdate',
        description: 'Data user berhasil diupdate.',
      });
      setEditModalOpen(false);
      setEditingUser(null);
      fetchUsers();
      editForm.resetFields();
      setEditFotoProfilBase64('');
    } catch (e) {
      api.error({
        message: 'Gagal Update User',
        description: e.message || 'Gagal mengupdate user.',
      });
    }
  };

  // Delete handler
  const handleDeleteUser = async () => {
    if (!adminPassword) {
      api.warning({
        message: 'Password Admin Kosong',
        description: 'Masukkan password admin terlebih dahulu!',
      });
      return;
    }
    try {
      await apiAuth.deleteWithAdmin(`/api/admin/manajemen-pengguna/${selectedUserId}`, adminPassword);
      api.success({
        message: 'User Dihapus',
        description: 'User berhasil dihapus.',
      });
      setDeleteModalOpen(false);
      setAdminPassword('');
      fetchUsers();
    } catch (e) {
      api.error({
        message: 'Gagal Hapus User',
        description: e.message || 'Gagal menghapus user.',
      });
    }
  };

  const customizeRequiredMark = (label, { required }) => (
    <>
      {required ? <Tag color='error'>Required</Tag> : <Tag color='warning'>Optional</Tag>} {label}
    </>
  );
  const [requiredMark] = useState('customize');

  return (
    <div>
      {contextHolder}
      <Card>
        <Title level={2}>Manajemen Pengguna</Title>
        <Paragraph>
          Data user <b>KARYAWAN</b> dapat dilihat, ditambah, dihapus, dan diedit oleh ADMIN.
        </Paragraph>
      </Card>
      <Flex justify='flex-end'>
        <Col
          className='gutter-row mt-3'
          span={6}
        >
          <Search
            placeholder='Cari nama, email, NIP'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            enterButton
            allowClear
          />
        </Col>
      </Flex>
      <Row
        gutter={{ xs: 8, sm: 16, md: 24, lg: 32 }}
        className='mt-5'
      >
        {loadingUsers ? (
          Array.from({ length: SKELETON_COUNT }).map((_, idx) => (
            <Col
              className='gutter-row'
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
        ) : filteredUsers.length === 0 ? (
          <Col
            span={24}
            style={{ textAlign: 'center', marginTop: 48 }}
          >
            <Empty description='Belum ada data pengguna' />
          </Col>
        ) : (
          filteredUsers.map((user) => (
            <Col
              className='gutter-row mb-4'
              span={6}
              key={user.user_id}
            >
              <Space
                direction='vertical'
                size={16}
              >
                <Card
                  title={user.nama}
                  actions={[
                    <EditOutlined
                      key='edit'
                      onClick={() => handleEdit(user)}
                    />,
                    <DeleteOutlined
                      key='delete'
                      onClick={() => {
                        setSelectedUserId(user.user_id);
                        setDeleteModalOpen(true);
                      }}
                      style={{ color: 'red', cursor: 'pointer' }}
                    />,
                  ]}
                  style={{ width: 300 }}
                >
                  <p>Email : {user.email}</p>
                  <p>NIP : {user.nip}</p>
                  <p>No. Handphone : {user.no_hp}</p>
                  <p>Status Karyawan : {user.status}</p>
                </Card>
              </Space>
            </Col>
          ))
        )}
      </Row>

      {/* Modal Tambah User */}
      <Modal
        open={addModalOpen}
        title='Tambah Data Karyawan'
        onCancel={() => {
          setAddModalOpen(false);
          setFotoProfilBase64('');
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout='vertical'
          requiredMark={requiredMark === 'customize' ? customizeRequiredMark : requiredMark}
          onFinish={handleRegister}
        >
          <Form.Item
            label='Email'
            name='email'
            rules={[{ required: true, message: 'Mohon Email diinputkan!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label='Password'
            required
            name='password'
            rules={[{ required: true, message: 'Mohon Password diinputkan!' }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            label='Nama'
            name='nama'
            required
            rules={[{ required: true, message: 'Mohon Nama diinputkan!' }]}
          >
            <Input placeholder='input nama' />
          </Form.Item>
          <Form.Item
            label='NIP'
            name='nip'
            tooltip={{ title: 'NIP opsional', icon: <InfoCircleOutlined /> }}
          >
            <Input placeholder='input NIP' />
          </Form.Item>
          <Form.Item
            label='No.Handphone'
            name='no_hp'
            tooltip={{ title: 'Nomor HP opsional', icon: <InfoCircleOutlined /> }}
          >
            <Input placeholder='input nomor hp' />
          </Form.Item>
          <Form.Item
            label='Status Karyawan'
            name='status'
          >
            <Select defaultValue='AKTIF'>
              <Select.Option value='AKTIF'>Aktif</Select.Option>
              <Select.Option value='NON-AKTIF'>Non-Aktif</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            label='Foto Profil'
            name='foto_profil'
            valuePropName='fileList'
            getValueFromEvent={(e) => (Array.isArray(e) ? e : e && e.fileList)}
          >
            <Upload
              listType='picture-card'
              maxCount={1}
              beforeUpload={(file) => {
                getBase64(file, (base64) => {
                  setFotoProfilBase64(base64);
                  form.setFieldsValue({
                    foto_profil: [
                      {
                        uid: '-1',
                        name: file.name,
                        status: 'done',
                        url: base64,
                      },
                    ],
                  });
                });
                return false;
              }}
              onRemove={() => setFotoProfilBase64('')}
              fileList={form.getFieldValue('foto_profil') || []}
              onPreview={(file) => window.open(file.url)}
            >
              <button
                type='button'
                style={{ border: 0, background: 'none' }}
              >
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Upload Foto</div>
              </button>
            </Upload>
          </Form.Item>
          <Form.Item>
            <Button
              type='primary'
              htmlType='submit'
            >
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Edit User */}
      <Modal
        open={editModalOpen}
        title='Edit Data Karyawan'
        onCancel={() => {
          setEditModalOpen(false);
          setEditingUser(null);
          editForm.resetFields();
          setEditFotoProfilBase64('');
        }}
        footer={null}
      >
        <Form
          form={editForm}
          layout='vertical'
          requiredMark={requiredMark === 'customize' ? customizeRequiredMark : requiredMark}
          onFinish={handleEditSubmit}
        >
          <Form.Item
            label='Email'
            name='email'
            rules={[{ required: true, message: 'Mohon Email diinputkan!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label='Nama'
            name='nama'
            required
            rules={[{ required: true, message: 'Mohon Nama diinputkan!' }]}
          >
            <Input placeholder='input nama' />
          </Form.Item>
          <Form.Item
            label='NIP'
            name='nip'
            tooltip={{ title: 'NIP opsional', icon: <InfoCircleOutlined /> }}
          >
            <Input placeholder='input NIP' />
          </Form.Item>
          <Form.Item
            label='No.Handphone'
            name='no_hp'
            tooltip={{ title: 'Nomor HP opsional', icon: <InfoCircleOutlined /> }}
          >
            <Input placeholder='input nomor hp' />
          </Form.Item>
          <Form.Item
            label='Status Karyawan'
            name='status'
          >
            <Select defaultValue={users.status}>
              <Select.Option value='AKTIF'>Aktif</Select.Option>
              <Select.Option value='NON-AKTIF'>Non-Aktif</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            label='Foto Profil'
            name='foto_profil'
            valuePropName='fileList'
            getValueFromEvent={(e) => (Array.isArray(e) ? e : e && e.fileList)}
          >
            <Upload
              listType='picture-card'
              maxCount={1}
              beforeUpload={(file) => {
                getBase64(file, (base64) => {
                  setEditFotoProfilBase64(base64);
                  editForm.setFieldsValue({
                    foto_profil: [
                      {
                        uid: '-1',
                        name: file.name,
                        status: 'done',
                        url: base64,
                      },
                    ],
                  });
                });
                return false;
              }}
              onRemove={() => setEditFotoProfilBase64('')}
              fileList={editForm.getFieldValue('foto_profil') || []}
              onPreview={(file) => window.open(file.url)}
            >
              <button
                type='button'
                style={{ border: 0, background: 'none' }}
              >
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Upload Foto</div>
              </button>
            </Upload>
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
        title='Konfirmasi Hapus User'
        onCancel={() => {
          setDeleteModalOpen(false);
          setAdminPassword('');
        }}
        onOk={handleDeleteUser}
        okText='Hapus'
        okButtonProps={{ danger: true }}
      >
        <p>Masukkan password admin untuk konfirmasi hapus user:</p>
        <Input.Password
          placeholder='Password admin'
          value={adminPassword}
          onChange={(e) => setAdminPassword(e.target.value)}
        />
      </Modal>

      <FloatButton onClick={() => setAddModalOpen(true)} />
    </div>
  );
};

export default ManajemenPenggunaPage;

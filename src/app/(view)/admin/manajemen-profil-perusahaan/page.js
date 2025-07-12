'use client';

import React, { useEffect, useState } from 'react';
import { Typography, Button, Card, Col, Row, Input, FloatButton, Modal, Form, Tag, Skeleton, Empty, notification, Upload } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { apiAuth } from '@/utils/apiAuth';
import { getBase64 } from '@/helpers/imageHelper';
import Image from 'next/image';

const { Title, Paragraph } = Typography;
const SKELETON_COUNT = 4;

const customizeRequiredMark = (label, { required }) => (
  <>
    {required ? <Tag color='error'>Required</Tag> : <Tag color='warning'>Optional</Tag>} {label}
  </>
);

// Next.js image loader (allow base64 or URL)
const logoLoader = ({ src }) => src;

export default function ManajemenPerusahaanPage() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [editingCompany, setEditingCompany] = useState(null);

  // Form instance
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // Logo (base64) state
  const [addLogoBase64, setAddLogoBase64] = useState('');
  const [editLogoBase64, setEditLogoBase64] = useState('');

  const [api, contextHolder] = notification.useNotification();

  // Fetch company list
  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const data = await apiAuth.getDataPrivate('/api/company');
      setCompanies(data.companies || []);
    } catch (e) {
      api.error({ message: 'Gagal memuat data perusahaan', description: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  // Create company
  const handleAdd = async (values) => {
    try {
      await apiAuth.postDataPrivate('/api/company', {
        nama: values.nama_perusahaan,
        alamat: values.alamat,
        email: values.email,
        telepon: values.telepon,
        logo_url: addLogoBase64 || '',
      });
      api.success({ message: 'Perusahaan berhasil ditambah' });
      setAddModalOpen(false);
      addForm.resetFields();
      setAddLogoBase64('');
      fetchCompanies();
    } catch (e) {
      api.error({ message: 'Gagal menambah perusahaan', description: e.message });
    }
  };

  // Update company
  const handleEdit = async (values) => {
    try {
      await apiAuth.putDataPrivate(`/api/company/${editingCompany.company_id}`, {
        nama: values.nama_perusahaan,
        alamat: values.alamat,
        email: values.email,
        telepon: values.telepon,
        logo_url: editLogoBase64 || editingCompany.logo_url || '',
      });
      api.success({ message: 'Perusahaan berhasil diupdate' });
      setEditModalOpen(false);
      editForm.resetFields();
      setEditLogoBase64('');
      fetchCompanies();
    } catch (e) {
      api.error({ message: 'Gagal update perusahaan', description: e.message });
    }
  };

  // Delete company
  const handleDelete = async () => {
    try {
      await apiAuth.deleteDataPrivate(`/api/company/${selectedCompany.company_id}`);
      api.success({ message: 'Perusahaan berhasil dihapus' });
      setDeleteModalOpen(false);
      fetchCompanies();
    } catch (e) {
      api.error({ message: 'Gagal hapus perusahaan', description: e.message });
    }
  };

  // Modal open handler for Edit
  const onEditClick = (company) => {
    setEditingCompany(company);

    editForm.setFieldsValue({
      nama_perusahaan: company.nama,
      alamat: company.alamat,
      email: company.email,
      telepon: company.telepon,
      logo_url: company.logo_url
        ? [
            {
              uid: '-1',
              name: 'Logo',
              status: 'done',
              url: company.logo_url,
            },
          ]
        : [],
    });
    setEditLogoBase64('');
    setEditModalOpen(true);
  };

  // Custom upload for Add/Edit Form
  const uploadLogoFormItem = ({ form, base64Setter, fieldName = 'logo_url' }) => (
    <Form.Item
      label='Logo Perusahaan'
      name={fieldName}
      valuePropName='fileList'
      getValueFromEvent={(e) => (Array.isArray(e) ? e : e && e.fileList)}
    >
      <Upload
        accept='image/*'
        listType='picture-card'
        maxCount={1}
        beforeUpload={(file) => {
          getBase64(file, (base64) => {
            base64Setter(base64);
            form.setFieldsValue({
              [fieldName]: [
                {
                  uid: '-1',
                  name: file.name,
                  status: 'done',
                  url: base64,
                },
              ],
            });
          });
          return false; // prevent upload
        }}
        onRemove={() => base64Setter('')}
        fileList={form.getFieldValue(fieldName) || []}
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
  );

  return (
    <div>
      {contextHolder}
      <Card>
        <Title level={2}>Manajemen Perusahaan</Title>
        <Paragraph>Inputkan Profile Perusahaan!</Paragraph>
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
        ) : companies.length === 0 ? (
          <Col
            span={24}
            style={{ textAlign: 'center', marginTop: 48 }}
          >
            <Empty description='Belum ada data perusahaan' />
          </Col>
        ) : (
          companies.map((comp) => {
            const isBase64 = !!comp.logo_url && comp.logo_url.startsWith('data:image');
            return (
              <Col
                span={6}
                key={comp.company_id}
                className='mb-4'
              >
                <Card
                  title={comp.nama}
                  actions={[
                    <EditOutlined
                      key='edit'
                      onClick={() => onEditClick(comp)}
                    />,
                    <DeleteOutlined
                      key='delete'
                      style={{ color: 'red', cursor: 'pointer' }}
                      onClick={() => {
                        setSelectedCompany(comp);
                        setDeleteModalOpen(true);
                      }}
                    />,
                  ]}
                  style={{ width: 300 }}
                  cover={
                    <Image
                      alt='Logo'
                      src={comp.logo_url ? comp.logo_url : 'https://gw.alipayobjects.com/zos/rmsportal/JiqGstEfoWAOHiTxclqi.png'}
                      loader={logoLoader}
                      width={300}
                      height={120}
                      style={{
                        objectFit: 'contain',
                        background: '#fafafa',
                        width: '100%',
                        borderBottom: '1px solid #eee',
                        maxHeight: 120,
                      }}
                      unoptimized={isBase64}
                      priority
                    />
                  }
                >
                  <p>Alamat : {comp.alamat}</p>
                  <p>Email : {comp.email}</p>
                  <p>Telepon : {comp.telepon}</p>
                </Card>
              </Col>
            );
          })
        )}
      </Row>

      {/* Modal Tambah */}
      <Modal
        open={addModalOpen}
        title='Tambah Data Perusahaan'
        onCancel={() => {
          setAddModalOpen(false);
          setAddLogoBase64('');
          addForm.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <Form
          form={addForm}
          layout='vertical'
          requiredMark={customizeRequiredMark}
          onFinish={handleAdd}
        >
          <Form.Item
            label='Nama Perusahaan'
            name='nama_perusahaan'
            required
            rules={[{ required: true, message: 'Nama perusahaan wajib diisi!' }]}
          >
            <Input placeholder='Input nama perusahaan' />
          </Form.Item>
          <Form.Item
            label='Alamat'
            name='alamat'
            required
            rules={[{ required: true, message: 'Alamat wajib diisi!' }]}
          >
            <Input placeholder='Input alamat' />
          </Form.Item>
          <Form.Item
            label='Email'
            name='email'
            rules={[{ type: 'email', message: 'Format email tidak valid!' }]}
          >
            <Input placeholder='Input email perusahaan' />
          </Form.Item>
          <Form.Item
            label='Telepon'
            name='telepon'
          >
            <Input placeholder='Input nomor telepon' />
          </Form.Item>
          {/* Upload Logo */}
          {uploadLogoFormItem({ form: addForm, base64Setter: setAddLogoBase64, fieldName: 'logo_url' })}
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
        title='Edit Data Perusahaan'
        onCancel={() => {
          setEditModalOpen(false);
          setEditLogoBase64('');
          editForm.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <Form
          form={editForm}
          layout='vertical'
          requiredMark={customizeRequiredMark}
          onFinish={handleEdit}
          initialValues={
            editingCompany && {
              nama_perusahaan: editingCompany.nama,
              alamat: editingCompany.alamat,
              email: editingCompany.email,
              telepon: editingCompany.telepon,
              logo_url: editingCompany.logo_url
                ? [
                    {
                      uid: '-1',
                      name: 'Logo',
                      status: 'done',
                      url: editingCompany.logo_url,
                    },
                  ]
                : [],
            }
          }
        >
          <Form.Item
            label='Nama Perusahaan'
            name='nama_perusahaan'
            required
            rules={[{ required: true, message: 'Nama perusahaan wajib diisi!' }]}
          >
            <Input placeholder='Input nama perusahaan' />
          </Form.Item>
          <Form.Item
            label='Alamat'
            name='alamat'
            required
            rules={[{ required: true, message: 'Alamat wajib diisi!' }]}
          >
            <Input placeholder='Input alamat' />
          </Form.Item>
          <Form.Item
            label='Email'
            name='email'
            rules={[{ type: 'email', message: 'Format email tidak valid!' }]}
          >
            <Input placeholder='Input email perusahaan' />
          </Form.Item>
          <Form.Item
            label='Telepon'
            name='telepon'
          >
            <Input placeholder='Input nomor telepon' />
          </Form.Item>
          {/* Upload Logo */}
          {uploadLogoFormItem({ form: editForm, base64Setter: setEditLogoBase64, fieldName: 'logo_url' })}
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
        title='Konfirmasi Hapus Perusahaan'
        onCancel={() => setDeleteModalOpen(false)}
        onOk={handleDelete}
        okText='Hapus'
        okButtonProps={{ danger: true }}
      >
        <p>Apakah Anda yakin ingin menghapus data perusahaan ini?</p>
      </Modal>

      <FloatButton onClick={() => setAddModalOpen(true)} />
    </div>
  );
}

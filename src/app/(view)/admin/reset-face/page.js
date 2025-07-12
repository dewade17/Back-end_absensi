'use client';

import React, { useState, useEffect } from 'react';
import { Typography, Card, Table, Tag, Button, Modal, Flex, Col, Input, Skeleton, notification } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { apiAuth } from '@/utils/apiAuth';
const { Title, Paragraph } = Typography;
const { Search } = Input;

const ResetFacePage = () => {
  // Notification
  const [api, contextHolder] = notification.useNotification();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFaceId, setSelectedFaceId] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [loading, setLoading] = useState(false);
  const [dataTable, setDataTable] = useState([]);
  const [search, setSearch] = useState('');

  // Fetch data dari API
  const fetchFaces = async () => {
    setLoading(true);
    try {
      const res = await apiAuth.getDataPrivate('/api/userface');
      const faces = res.faces || [];
      const mappedData = faces.map((f) => ({
        key: f.face_id,
        face_id: f.face_id,
        nama: f.user?.nama || '-',
        registrasiWajah: !!f.face_encoding,
        tanggalRegistrasi: f.createdAt ? new Date(f.createdAt).toLocaleDateString('id-ID') : '-',
      }));
      setDataTable(mappedData);
    } catch (err) {
      api.error({ message: 'Gagal mengambil data wajah', description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaces();
  }, []);

  const handleResetFace = async () => {
    if (!selectedFaceId) return;
    setLoading(true);
    try {
      await apiAuth.deleteDataPrivate(`/api/userface/${selectedFaceId}`);
      api.success({ message: 'Data wajah berhasil direset' });
      setModalOpen(false);
      fetchFaces();
    } catch (err) {
      api.error({ message: 'Gagal reset data wajah', description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const filteredData = search ? dataTable.filter((d) => d.nama.toLowerCase().includes(search.toLowerCase())) : dataTable;

  const columns = [
    {
      title: 'Nama Karyawan',
      dataIndex: 'nama',
      key: 'nama',
    },
    {
      title: 'Registrasi Wajah',
      dataIndex: 'registrasiWajah',
      key: 'registrasiWajah',
      render: (registrasiWajah) => (registrasiWajah ? <Tag color='green'>Sudah</Tag> : <Tag color='red'>Belum</Tag>),
    },
    {
      title: 'Tanggal Registrasi',
      dataIndex: 'tanggalRegistrasi',
      key: 'tanggalRegistrasi',
    },
    {
      title: 'Aksi',
      key: 'aksi',
      render: (_, record) =>
        record.registrasiWajah ? (
          <Button
            icon={<DeleteOutlined />}
            type='primary'
            danger
            size='small'
            loading={loading && record.face_id === selectedFaceId}
            onClick={() => {
              setSelectedName(record.nama);
              setSelectedFaceId(record.face_id);
              setModalOpen(true);
            }}
          >
            Reset
          </Button>
        ) : (
          <Tag color='default'>-</Tag>
        ),
    },
  ];

  return (
    <div>
      {contextHolder}
      <Card>
        <Title level={2}>Reset Data Wajah</Title>
        <Paragraph>
          Mereset data wajah karyawan yang sudah terdaftar.
          <br />
          Hanya karyawan dengan status <Tag color='green'>Sudah</Tag> registrasi wajah yang dapat di-reset.
        </Paragraph>
      </Card>
      <Flex justify='flex-end'>
        <Col span={6}>
          <Search
            placeholder='Cari nama'
            allowClear
            enterButton
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ marginTop: 16 }}
            disabled={loading}
          />
        </Col>
      </Flex>
      <Table
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        size='middle'
        style={{ marginTop: 20 }}
        pagination={{ pageSize: 8 }}
      />
      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleResetFace}
        okText='Reset Wajah'
        cancelText='Batal'
        title='Konfirmasi Reset'
        centered
        confirmLoading={loading}
      >
        <div>
          Apakah Anda yakin ingin <b>reset data wajah</b> untuk <b>{selectedName}</b>?<br />
          Tindakan ini tidak dapat dibatalkan.
        </div>
      </Modal>
    </div>
  );
};

export default ResetFacePage;

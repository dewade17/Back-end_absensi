'use client';

import React, { useEffect, useState } from 'react';
import { Typography, Card, Table, Tag, Button, Modal, Flex, Col, Spin, Input, Image } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { apiAuth } from '@/utils/apiAuth';
import dayjs from 'dayjs';

const { Title, Paragraph } = Typography;
const { Search } = Input;

const AgendaKerjaPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fotoModalOpen, setFotoModalOpen] = useState(false);
  const [fotoPreview, setFotoPreview] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await apiAuth.getDataPrivate('/api/workagenda-with-items');
        const agendas = res?.data || [];
        const flatData = agendas.flatMap((agenda) =>
          (agenda.items || []).map((item) => ({
            key: item.item_id,
            nama: agenda.user?.nama || '-',
            tanggal: dayjs(item.tanggal).format('DD MMM YYYY'),
            jamMulai: dayjs(item.jam_mulai).format('HH:mm'),
            jamSelesai: dayjs(item.jam_selesai).format('HH:mm'),
            deskripsi: item.deskripsi_pekerjaan,
            buktiFoto: item.bukti_foto_url,
          }))
        );
        setData(flatData);
      } catch (e) {
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredData = data.filter((d) => d.nama.toLowerCase().includes(search.trim().toLowerCase()));

  const columns = [
    {
      title: 'Nama Karyawan',
      dataIndex: 'nama',
      key: 'nama',
    },
    {
      title: 'Tanggal',
      dataIndex: 'tanggal',
      key: 'tanggal',
    },
    {
      title: 'Jam Mulai',
      dataIndex: 'jamMulai',
      key: 'jamMulai',
    },
    {
      title: 'Jam Selesai',
      dataIndex: 'jamSelesai',
      key: 'jamSelesai',
    },
    {
      title: 'Deskripsi Pekerjaan',
      dataIndex: 'deskripsi',
      key: 'deskripsi',
    },
    {
      title: 'Bukti Foto',
      dataIndex: 'buktiFoto',
      key: 'buktiFoto',
      render: (buktiFoto) =>
        buktiFoto && buktiFoto.startsWith('data:image') ? (
          <Button
            icon={<EyeOutlined />}
            type='primary'
            size='small'
            onClick={() => {
              setFotoPreview(buktiFoto);
              setFotoModalOpen(true);
            }}
          >
            Lihat
          </Button>
        ) : (
          <Tag color='red'>Tidak Ada</Tag>
        ),
    },
  ];

  return (
    <div>
      <Card>
        <Title level={2}>Agenda Kerja</Title>
        <Paragraph>Daftar agenda kerja pegawai, termasuk bukti foto dan keterangan pekerjaan.</Paragraph>
      </Card>
      <Flex justify='flex-end'>
        <Col
          className='gutter-row mt-3'
          span={6}
        >
          <Search
            placeholder='Cari nama'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            enterButton
            allowClear
          />
        </Col>
      </Flex>
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={filteredData}
          size='middle'
          style={{ marginTop: 20 }}
          className='mt-4'
          pagination={{ pageSize: 8 }}
        />
      </Spin>
      <Modal
        open={fotoModalOpen}
        onCancel={() => setFotoModalOpen(false)}
        footer={null}
        width={480}
        title='Bukti Foto Agenda'
        centered
        bodyStyle={{
          padding: 0,
          background: '#fff',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 320,
            minWidth: 320,
            background: '#fafcff',
          }}
        >
          {fotoPreview ? (
            <Image
              src={fotoPreview}
              alt='Bukti Foto Agenda'
              style={{
                maxWidth: 400,
                maxHeight: 350,
                objectFit: 'contain',
                borderRadius: 8,
                border: '1px solid #ddd',
                background: '#fff',
              }}
              preview={false}
            />
          ) : (
            <Tag color='red'>Tidak Ada Foto</Tag>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default AgendaKerjaPage;

'use client';

import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Skeleton, Empty, Tag, Tooltip, Table, Modal, Button, Image, notification, Space } from 'antd';
import { CheckCircleTwoTone, CloseCircleTwoTone, FilePdfOutlined, EyeOutlined } from '@ant-design/icons';
import { apiAuth } from '@/utils/apiAuth';

const SKELETON_COUNT = 4;

function isPdf(base64String) {
  return typeof base64String === 'string' && base64String.startsWith('data:application/pdf');
}
function isImage(base64String) {
  return typeof base64String === 'string' && base64String.startsWith('data:image/');
}
function openFile(base64String, namaFile = 'bukti_file') {
  const win = window.open();
  win.document.write(`<iframe src="${base64String}" title="${namaFile}" frameborder="0" style="border:0;top:0;left:0;bottom:0;right:0;width:100vw;height:100vh;" allowfullscreen></iframe>`);
}

const LeaveRequestPage = ({ userId }) => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  // Preview Modal
  const [previewFile, setPreviewFile] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);

  // Antd notification context
  const [api, contextHolder] = notification.useNotification();

  // Fetch leave data
  const fetchData = async () => {
    setLoading(true);
    try {
      let res;
      if (userId) {
        res = await apiAuth.getDataPrivate(`/api/leaverequest/${userId}`);
        setLeaves(res.data || []);
      } else {
        res = await apiAuth.getDataPrivate('/api/leaverequest');
        setLeaves(res.data || []);
      }
    } catch (e) {
      setLeaves([]);
      api.error({ message: 'Gagal memuat data izin', description: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [userId]);

  // PATCH status only
  const patchLeaveStatus = async (leave_id, status) => {
    try {
      await apiAuth.putDataPrivate(`/api/leaverequest/${leave_id}/status`, { status });
      api.success({
        message: 'Berhasil',
        description: `Status izin berhasil diubah ke "${status}"`,
      });
      fetchData();
    } catch (err) {
      api.error({
        message: 'Gagal',
        description: 'Gagal update status di server!',
      });
    }
  };

  // Setujui: selalu boleh
  const handleApprove = (item) => {
    patchLeaveStatus(item.leave_id, 'DISETUJUI');
  };
  // Tolak: selalu boleh
  const handleReject = (item) => {
    patchLeaveStatus(item.leave_id, 'DITOLAK');
  };

  // Table Columns
  const columns = [
    {
      title: 'Nama Karyawan',
      dataIndex: ['user', 'nama'],
      key: 'nama',
      render: (text, record) => record.user?.nama || '-',
    },
    {
      title: 'Jenis Izin',
      dataIndex: 'jenis_izin',
      key: 'jenis_izin',
      render: (text) => text.charAt(0).toUpperCase() + text.slice(1),
    },
    {
      title: 'Tanggal Mulai',
      dataIndex: 'tanggal_mulai',
      key: 'tanggal_mulai',
      render: (text) => new Date(text).toLocaleDateString(),
    },
    {
      title: 'Tanggal Selesai',
      dataIndex: 'tanggal_selesai',
      key: 'tanggal_selesai',
      render: (text) => new Date(text).toLocaleDateString(),
    },
    {
      title: 'Alasan',
      dataIndex: 'alasan',
      key: 'alasan',
    },
    {
      title: 'Bukti File',
      dataIndex: 'bukti_file',
      key: 'bukti_file',
      render: (file, record) =>
        file ? (
          isPdf(file) ? (
            <Tag
              icon={<FilePdfOutlined />}
              color='red'
              style={{ cursor: 'pointer' }}
              onClick={() => openFile(file, `${record.user?.nama}-bukti.pdf`)}
            >
              PDF
            </Tag>
          ) : isImage(file) ? (
            <Button
              icon={<EyeOutlined />}
              type='primary'
              size='small'
              onClick={() => {
                setPreviewFile(file);
                setPreviewOpen(true);
              }}
            >
              Lihat Foto
            </Button>
          ) : (
            <Tag color='warning'>Format Tidak Didukung</Tag>
          )
        ) : (
          <Tag color='red'>Tidak Ada</Tag>
        ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={status === 'PENDING' ? 'orange' : status === 'DISETUJUI' ? 'green' : 'red'}>{status === 'PENDING' ? 'PENDING' : status === 'DISETUJUI' ? 'DISETUJUI' : 'DITOLAK'}</Tag>,
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center',
      render: (_, record) => (
        <Space>
          <Tooltip title='Setujui'>
            <Button
              shape='circle'
              icon={<CheckCircleTwoTone twoToneColor='#52c41a' />}
              onClick={() => handleApprove(record)}
            />
          </Tooltip>
          <Tooltip title='Tolak'>
            <Button
              shape='circle'
              icon={<CloseCircleTwoTone twoToneColor='#ff4d4f' />}
              onClick={() => handleReject(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Pending only for card
  const pendingLeaves = leaves.filter((item) => item.status === 'PENDING');

  return (
    <div>
      {contextHolder}
      {/* Pending cards */}
      <Row
        gutter={[24, 24]}
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
        ) : !pendingLeaves.length ? (
          <Col
            span={24}
            style={{ textAlign: 'center', marginTop: 48 }}
          >
            <Empty description='Tidak ada izin pending' />
          </Col>
        ) : (
          pendingLeaves.map((item) => (
            <Col
              span={6}
              key={item.leave_id}
              className='mb-4'
            >
              <Card
                title={item.user?.nama || '-'}
                actions={[
                  <Tooltip
                    title='Setujui'
                    key='approve'
                  >
                    <CheckCircleTwoTone
                      twoToneColor='#52c41a'
                      style={{ fontSize: 24, cursor: 'pointer' }}
                      onClick={() => handleApprove(item)}
                    />
                  </Tooltip>,
                  <Tooltip
                    title='Tolak'
                    key='reject'
                  >
                    <CloseCircleTwoTone
                      twoToneColor='#ff4d4f'
                      style={{ fontSize: 24, cursor: 'pointer' }}
                      onClick={() => handleReject(item)}
                    />
                  </Tooltip>,
                ]}
                style={{ width: 300 }}
                extra={<Tag color='orange'>{item.status}</Tag>}
              >
                <p>
                  <b>Jenis Izin:</b> {item.jenis_izin}
                </p>
                <p>
                  <b>Periode:</b> {new Date(item.tanggal_mulai).toLocaleDateString()} - {new Date(item.tanggal_selesai).toLocaleDateString()}
                </p>
                <p>
                  <b>Alasan:</b> {item.alasan}
                </p>
                <div style={{ marginTop: 12 }}>
                  {item.bukti_file ? (
                    isPdf(item.bukti_file) ? (
                      <Tag
                        icon={<FilePdfOutlined />}
                        color='red'
                        style={{ cursor: 'pointer' }}
                        onClick={() => openFile(item.bukti_file, `${item.user?.nama}-bukti.pdf`)}
                      >
                        Lihat PDF
                      </Tag>
                    ) : isImage(item.bukti_file) ? (
                      <Button
                        icon={<EyeOutlined />}
                        type='primary'
                        size='small'
                        onClick={() => {
                          setPreviewFile(item.bukti_file);
                          setPreviewOpen(true);
                        }}
                      >
                        Lihat Foto
                      </Button>
                    ) : (
                      <Tag color='warning'>Format tidak didukung</Tag>
                    )
                  ) : (
                    <Tag color='red'>Tidak Ada Bukti</Tag>
                  )}
                </div>
              </Card>
            </Col>
          ))
        )}
      </Row>

      {/* Table history leave request */}
      <div style={{ marginTop: 36 }}>
        <h3>Riwayat Pengajuan Izin</h3>
        <Table
          columns={columns}
          dataSource={leaves}
          rowKey='leave_id'
          size='middle'
          pagination={{ pageSize: 5 }}
          loading={loading}
        />
      </div>
      {/* Modal for Foto Preview */}
      <Modal
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        footer={null}
        width={480}
        title='Bukti Foto Izin'
        centered
        bodyStyle={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 320,
          background: '#fafcff',
        }}
      >
        {previewFile ? (
          <Image
            src={previewFile}
            alt='Bukti Foto'
            style={{
              maxWidth: 400,
              maxHeight: 350,
              objectFit: 'contain',
              borderRadius: 8,
              border: '1px solid #ddd',
              background: '#fff',
            }}
          />
        ) : (
          <Tag color='red'>Tidak Ada Foto</Tag>
        )}
      </Modal>
    </div>
  );
};

export default LeaveRequestPage;

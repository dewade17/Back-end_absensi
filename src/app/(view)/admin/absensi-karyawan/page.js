'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Typography, Card, Table, Tag, Flex, Col, Input, Skeleton, Empty, Button } from 'antd';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { apiAuth } from '@/utils/apiAuth';
import { exportToCSV } from '@/helpers/exportToCSV';

dayjs.extend(utc);
dayjs.extend(timezone);

const { Title, Paragraph } = Typography;
const { Search } = Input;

const WITA = 'Asia/Makassar';
const SKELETON_COUNT = 6;

function mergeAbsensi(arrivals = [], departures = []) {
  const map = new Map();

  arrivals.forEach((item) => {
    const key = `${item.user_id}_${dayjs(item.tanggal).tz(WITA).format('YYYY-MM-DD')}`;
    map.set(key, {
      nama: item.user?.nama || '-',
      tanggal: dayjs(item.tanggal).tz(WITA).format('DD MMM YYYY'),
      jamKedatangan: item.jam_masuk,
      faceVerifiedKedatangan: item.face_verified,
      lokasiVerifiedKedatangan: !!(item.latitude && item.longitude),
      jamKepulangan: null,
      faceVerifiedKepulangan: null,
      lokasiVerifiedKepulangan: null,
    });
  });

  departures.forEach((item) => {
    const key = `${item.user_id}_${dayjs(item.tanggal).tz(WITA).format('YYYY-MM-DD')}`;
    if (map.has(key)) {
      const val = map.get(key);
      val.jamKepulangan = item.jam_keluar;
      val.faceVerifiedKepulangan = item.face_verified;
      val.lokasiVerifiedKepulangan = !!(item.latitude && item.longitude);
      map.set(key, val);
    } else {
      map.set(key, {
        nama: item.user?.nama || '-',
        tanggal: dayjs(item.tanggal).tz(WITA).format('DD MMM YYYY'),
        jamKedatangan: null,
        faceVerifiedKedatangan: null,
        lokasiVerifiedKedatangan: null,
        jamKepulangan: item.jam_keluar,
        faceVerifiedKepulangan: item.face_verified,
        lokasiVerifiedKepulangan: !!(item.latitude && item.longitude),
      });
    }
  });

  return Array.from(map.values());
}

export default function AbsensiKaryawanPage() {
  const [loading, setLoading] = useState(true);
  const [absensiData, setAbsensiData] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    apiAuth
      .getDataPrivate('/api/attendance/rekap')
      .then((data) => {
        if (ignore) return;
        const arrivals = data.arrivals || [];
        const departures = data.departures || [];
        const merged = mergeAbsensi(arrivals, departures);
        setAbsensiData(merged);
      })
      .catch(() => {
        setAbsensiData([]);
      })
      .finally(() => {
        setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  // Filtering by nama karyawan
  const filteredData = useMemo(() => {
    if (!search) return absensiData;
    return absensiData.filter((item) => item.nama.toLowerCase().includes(search.toLowerCase()));
  }, [search, absensiData]);

  // Generate table data
  const tableData = filteredData.map((item) => {
    let jamKedatanganTag = '-';
    if (item.jamKedatangan) {
      const jamKedatangan = dayjs(item.jamKedatangan).tz(WITA);
      const terlambat = jamKedatangan.hour() > 9 || (jamKedatangan.hour() === 9 && jamKedatangan.minute() > 0);
      jamKedatanganTag = (
        <Tag color={terlambat ? 'red' : 'green'}>
          {jamKedatangan.format('HH:mm:ss')} {terlambat ? '(Terlambat)' : ''}
        </Tag>
      );
    }

    let jamKepulanganTag = '-';
    if (item.jamKepulangan) {
      const jamKepulangan = dayjs(item.jamKepulangan).tz(WITA);
      const terlambatPulang = jamKepulangan.hour() > 18 || (jamKepulangan.hour() === 18 && jamKepulangan.minute() > 0);
      jamKepulanganTag = (
        <Tag color={terlambatPulang ? 'red' : 'green'}>
          {jamKepulangan.format('HH:mm:ss')} {terlambatPulang ? '(Pulang Terlambat)' : ''}
        </Tag>
      );
    }

    const lokasiVerified = item.lokasiVerifiedKedatangan || item.lokasiVerifiedKepulangan ? <Tag color='green'>Verified</Tag> : <Tag color='red'>Tidak Ada Lokasi</Tag>;

    const faceVerifiedKedatangan = item.faceVerifiedKedatangan !== null ? item.faceVerifiedKedatangan ? <Tag color='blue'>Verified</Tag> : <Tag color='red'>Tidak Verified</Tag> : '-';

    const faceVerifiedKepulangan = item.faceVerifiedKepulangan !== null ? item.faceVerifiedKepulangan ? <Tag color='blue'>Verified</Tag> : <Tag color='red'>Tidak Verified</Tag> : '-';

    return {
      key: `${item.nama}_${item.tanggal}`,
      nama: item.nama,
      tanggal: item.tanggal,
      jamKedatangan: jamKedatanganTag,
      jamKepulangan: jamKepulanganTag,
      lokasiVerified: lokasiVerified,
      faceVerifiedKedatangan,
      faceVerifiedKepulangan,
    };
  });

  const columns = [
    { title: 'Nama Karyawan', dataIndex: 'nama', key: 'nama' },
    { title: 'Tanggal', dataIndex: 'tanggal', key: 'tanggal' },
    { title: 'Kedatangan', dataIndex: 'jamKedatangan', key: 'jamKedatangan' },
    { title: 'Kepulangan', dataIndex: 'jamKepulangan', key: 'jamKepulangan' },
    { title: 'Lokasi Verified', dataIndex: 'lokasiVerified', key: 'lokasiVerified' },
    { title: 'Face Verified Kedatangan', dataIndex: 'faceVerifiedKedatangan', key: 'faceVerifiedKedatangan' },
    { title: 'Face Verified Kepulangan', dataIndex: 'faceVerifiedKepulangan', key: 'faceVerifiedKepulangan' },
  ];

  return (
    <div>
      <Card>
        <Title level={2}>Absensi Pegawai</Title>
        <Paragraph>Data absensi pegawai per tanggal, termasuk status lokasi dan verifikasi wajah kedatangan/pulang.</Paragraph>
      </Card>

      <Flex
        justify='flex-end'
        align='center'
        style={{ gap: 12 }}
      >
        <Col span={6}>
          <Search
            placeholder='Cari Nama Karyawan'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            enterButton
            allowClear
            className='mt-3'
          />
        </Col>
        <Button
          type='primary'
          onClick={() => exportToCSV(tableData)}
          style={{ marginTop: 12 }}
        >
          Export CSV
        </Button>
      </Flex>

      {loading ? (
        <div style={{ marginTop: 32 }}>
          {[...Array(SKELETON_COUNT)].map((_, idx) => (
            <Card
              key={idx}
              style={{ marginBottom: 12 }}
            >
              <Skeleton
                active
                paragraph={{ rows: 2 }}
              />
            </Card>
          ))}
        </div>
      ) : (
        <Table
          columns={columns}
          dataSource={tableData}
          size='middle'
          style={{ marginTop: 20 }}
          pagination={{ pageSize: 5 }}
          locale={{ emptyText: <Empty description='Tidak ada data absensi' /> }}
        />
      )}
    </div>
  );
}

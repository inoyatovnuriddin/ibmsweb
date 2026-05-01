import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import type { TableProps } from 'antd';
import {
  Input,
  message,
  Progress,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { AdminPageFrame, AdminSectionCard } from './adminUi.tsx';
import {
  getMonitoring,
  type MonitoringRowDto,
  type MonitoringStatus,
} from './monitoringApi.ts';

const { Text } = Typography;

const formatDate = (value?: string) => {
  if (!value) return '-';
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('DD.MM.YYYY HH:mm') : '-';
};

const getStatusColor = (status: MonitoringStatus) => {
  if (status === 'COMPLETED') return 'success';
  if (status === 'FAILED') return 'error';
  if (status === 'IN_PROGRESS') return 'processing';
  if (status === 'LOCKED') return 'default';
  return 'warning';
};

const getStatusLabel = (status: MonitoringStatus) => {
  if (status === 'IN_PROGRESS') return 'Jarayonda';
  if (status === 'COMPLETED') return 'Tugallangan';
  if (status === 'FAILED') return 'Muvaffaqiyatsiz';
  if (status === 'LOCKED') return 'Yopiq';
  return 'Boshlanmagan';
};

export const DashboardCourseMonitoringPage = () => {
  const [rows, setRows] = useState<MonitoringRowDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState<'ALL' | MonitoringStatus>('ALL');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchMonitoring = async (
    nextPage = pagination.current,
    nextPageSize = pagination.pageSize
  ) => {
    setLoading(true);
    try {
      const payload = await getMonitoring({
        start: (nextPage - 1) * nextPageSize,
        limit: nextPageSize,
        searchKey: searchTerm,
        status: status === 'ALL' ? undefined : status,
      });

      setRows(payload.list);
      setPagination({
        current: nextPage,
        pageSize: nextPageSize,
        total: payload.total,
      });
    } catch {
      setRows([]);
      setPagination((current) => ({ ...current, total: 0 }));
      message.error('Monitoring ma’lumotlarini yuklashda xatolik yuz berdi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoring(1, pagination.pageSize);
  }, [status]);

  const columns: TableProps<MonitoringRowDto>['columns'] = [
    {
      title: 'F.I.Sh.',
      dataIndex: 'userFullName',
      key: 'userFullName',
      width: 220,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Text strong>{record.userFullName}</Text>
          <Text type="secondary">{record.email || '-'}</Text>
        </Space>
      ),
    },
    {
      title: 'Telefon',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
      width: 160,
      render: (value) => <Text>{value || '-'}</Text>,
    },
    {
      title: 'Kurs',
      dataIndex: 'courseTitle',
      key: 'courseTitle',
      width: 220,
      render: (value) => <Text strong>{value}</Text>,
    },
    {
      title: 'Holat',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (value: MonitoringStatus) => (
        <Tag color={getStatusColor(value)} style={{ borderRadius: 999 }}>
          {getStatusLabel(value)}
        </Tag>
      ),
    },
    {
      title: 'Progress',
      dataIndex: 'progressPercent',
      key: 'progressPercent',
      width: 180,
      render: (value) => (
        <Progress
          percent={value}
          size="small"
          strokeColor={value >= 100 ? '#16a34a' : '#1d4ed8'}
        />
      ),
    },
    {
      title: 'Joriy modul',
      dataIndex: 'currentModuleTitle',
      key: 'currentModuleTitle',
      width: 220,
      render: (value) => <Text>{value || '-'}</Text>,
    },
    {
      title: 'Joriy dars',
      dataIndex: 'currentLessonTitle',
      key: 'currentLessonTitle',
      width: 220,
      render: (value) => <Text>{value || '-'}</Text>,
    },
    {
      title: 'Darslar',
      key: 'lessons',
      width: 120,
      render: (_, record) => (
        <Text>
          {record.completedLessonCount}/{record.totalLessonCount}
        </Text>
      ),
    },
    {
      title: 'Testlar',
      key: 'tests',
      width: 150,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Text>
            {record.solvedTestCount}/{record.totalTestCount}
          </Text>
          <Text type="secondary">
            Oxirgi ball: {record.lastScore ?? record.averageScore ?? '-'}%
          </Text>
        </Space>
      ),
    },
    {
      title: 'Oxirgi aktivlik',
      dataIndex: 'lastActivityAt',
      key: 'lastActivityAt',
      width: 180,
      render: (value) => <Text>{formatDate(value)}</Text>,
    },
  ];

  return (
    <div>
      <Helmet>
        <title>Monitoring | Admin panel</title>
      </Helmet>

      <AdminPageFrame
        eyebrow="O‘quv jarayoni"
        title="Kurs monitoringi"
        subtitle="O‘quvchilarning kurs bo‘yicha holati, progressi va test natijalarini yagona oynadan kuzating."
      >
        <AdminSectionCard
          title="O‘quvchilar progressi"
          extra={
            <Space wrap>
              <Select
                value={status}
                onChange={setStatus}
                style={{ width: 190 }}
                options={[
                  { label: 'Barcha holatlar', value: 'ALL' },
                  { label: 'Boshlanmagan', value: 'NOT_STARTED' },
                  { label: 'Jarayonda', value: 'IN_PROGRESS' },
                  { label: 'Tugallangan', value: 'COMPLETED' },
                  { label: 'Muvaffaqiyatsiz', value: 'FAILED' },
                  { label: 'Yopiq', value: 'LOCKED' },
                ]}
              />
              <Input.Search
                placeholder="Ism, email, telefon yoki kurs bo‘yicha qidiring"
                allowClear
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                onSearch={() => fetchMonitoring(1, pagination.pageSize)}
                style={{ width: 360, maxWidth: '100%' }}
              />
            </Space>
          }
        >
          <Table
            rowKey="id"
            dataSource={rows}
            columns={columns}
            loading={loading}
            scroll={{ x: 1700 }}
            pagination={pagination}
            onChange={(nextPagination) =>
              fetchMonitoring(
                nextPagination.current || 1,
                nextPagination.pageSize || pagination.pageSize
              )
            }
          />
        </AdminSectionCard>
      </AdminPageFrame>
    </div>
  );
};

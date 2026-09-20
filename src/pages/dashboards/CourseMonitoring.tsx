import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSelector } from 'react-redux';
import type { TableProps } from 'antd';
import {
  Avatar,
  Button,
  Card,
  Col,
  Collapse,
  Descriptions,
  Drawer,
  Empty,
  Grid,
  Input,
  Popconfirm,
  Progress,
  Row,
  Segmented,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  DownloadOutlined,
  FileTextOutlined,
  LockOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  RiseOutlined,
  SafetyCertificateOutlined,
  SyncOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { RootState } from '../../redux/store.ts';
import { AdminPageFrame, AdminSectionCard } from './adminUi.tsx';
import {
  deleteMonitoring,
  getMonitoring,
  getMonitoringDetail,
  type MonitoringDetailDto,
  type MonitoringLessonType,
  type MonitoringRowDto,
  type MonitoringStatus,
  type MonitoringSummaryDto,
} from './monitoringApi.ts';
import { getCourseSuggestions } from '../course/courseApi.ts';

const { Text, Title } = Typography;

const EXPORT_LIMIT = 1000;

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('DD.MM.YYYY HH:mm') : '-';
};

/** Compact Uzbek "time ago" without pulling in a dayjs locale plugin. */
const relativeDate = (value?: string | null) => {
  if (!value) return '';
  const parsed = dayjs(value);
  if (!parsed.isValid()) return '';
  const diffMinutes = dayjs().diff(parsed, 'minute');
  if (diffMinutes < 1) return 'hozirgina';
  if (diffMinutes < 60) return `${diffMinutes} daqiqa oldin`;
  const diffHours = dayjs().diff(parsed, 'hour');
  if (diffHours < 24) return `${diffHours} soat oldin`;
  const diffDays = dayjs().diff(parsed, 'day');
  if (diffDays < 30) return `${diffDays} kun oldin`;
  const diffMonths = dayjs().diff(parsed, 'month');
  if (diffMonths < 12) return `${diffMonths} oy oldin`;
  return `${dayjs().diff(parsed, 'year')} yil oldin`;
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

const getLessonTypeLabel = (type: MonitoringLessonType) => {
  if (type === 'TEST') return 'Test';
  if (type === 'DOCUMENT') return 'Material';
  return 'Video dars';
};

const LessonTypeIcon = ({ type }: { type: MonitoringLessonType }) => {
  if (type === 'TEST') return <SafetyCertificateOutlined />;
  if (type === 'DOCUMENT') return <FileTextOutlined />;
  return <PlayCircleOutlined />;
};

const progressStroke = (value: number) => {
  if (value >= 100) return { from: '#16a34a', to: '#22c55e' };
  if (value >= 50) return { from: '#2563eb', to: '#3b82f6' };
  return { from: '#f59e0b', to: '#fbbf24' };
};

const nameToColor = (name: string) => {
  const palette = ['#1d4ed8', '#0ea5e9', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#0891b2'];
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
};

const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || '?';

interface SummaryTileProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  hint?: string;
  color: string;
  active?: boolean;
  onClick?: () => void;
}

const SummaryTile = ({ icon, label, value, hint, color, active, onClick }: SummaryTileProps) => (
  <Card
    onClick={onClick}
    bodyStyle={{ padding: '16px 18px' }}
    style={{
      borderRadius: 16,
      height: '100%',
      cursor: onClick ? 'pointer' : 'default',
      border: active ? `1.5px solid ${color}` : '1px solid #eef0f4',
      boxShadow: active ? `0 8px 22px -14px ${color}` : 'none',
      transition: 'all .18s ease',
    }}
  >
    <Space size={14} align="start">
      <span
        style={{
          width: 46,
          height: 46,
          borderRadius: 13,
          display: 'grid',
          placeItems: 'center',
          fontSize: 20,
          color: '#fff',
          background: color,
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      <Space direction="vertical" size={0}>
        <Text type="secondary" style={{ fontSize: 12.5 }}>
          {label}
        </Text>
        <Title level={3} style={{ margin: 0, lineHeight: 1.1 }}>
          {value}
        </Title>
        {hint ? (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {hint}
          </Text>
        ) : null}
      </Space>
    </Space>
  </Card>
);

export const DashboardCourseMonitoringPage = () => {
  const screens = Grid.useBreakpoint();
  const currentUser = useSelector((state: RootState) => state.auth.currentUser);
  const canDelete = Boolean(currentUser?.permissions?.monitoring?.includes('DELETE'));

  const [rows, setRows] = useState<MonitoringRowDto[]>([]);
  const [summary, setSummary] = useState<MonitoringSummaryDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState<'ALL' | MonitoringStatus>('ALL');
  const [courseId, setCourseId] = useState<string | undefined>(undefined);
  const [courseOptions, setCourseOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<MonitoringDetailDto | null>(null);

  const searchTimer = useRef<number>();
  const filtersRef = useRef({ searchTerm, status, courseId });
  filtersRef.current = { searchTerm, status, courseId };
  const pageSizeRef = useRef(pagination.pageSize);
  pageSizeRef.current = pagination.pageSize;

  const fetchMonitoring = useCallback(async (nextPage: number, nextPageSize: number) => {
    const filters = filtersRef.current;
    setLoading(true);
    try {
      const payload = await getMonitoring({
        start: (nextPage - 1) * nextPageSize,
        limit: nextPageSize,
        searchKey: filters.searchTerm.trim(),
        status: filters.status === 'ALL' ? undefined : filters.status,
        courseId: filters.courseId,
      });

      setRows(payload.list);
      setSummary(payload.summary);
      setSelectedRowKeys([]);
      setPagination({ current: nextPage, pageSize: nextPageSize, total: payload.total });
    } catch {
      setRows([]);
      setSummary(null);
      setPagination((current) => ({ ...current, total: 0 }));
      message.error('Monitoring ma’lumotlarini yuklashda xatolik yuz berdi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMonitoring(1, pageSizeRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, courseId]);

  useEffect(() => {
    getCourseSuggestions()
      .then((list) => setCourseOptions(list.map((course) => ({ label: course.name, value: course.id }))))
      .catch(() => setCourseOptions([]));
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(() => {
      fetchMonitoring(1, pageSizeRef.current);
    }, 450);
  };

  const openDetail = async (row: MonitoringRowDto) => {
    if (!row.userId || !row.courseId) return;
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const payload = await getMonitoringDetail(row.userId, row.courseId);
      setDetail(payload);
    } catch {
      setDetail(null);
      message.error('Batafsil ma’lumotni yuklashda xatolik yuz berdi.');
    } finally {
      setDetailLoading(false);
    }
  };

  const removeRow = async (row: MonitoringRowDto) => {
    try {
      await deleteMonitoring(row.userId, row.courseId);
      message.success(`${row.userFullName} — progress o‘chirildi.`);
      const isLastOnPage = rows.length === 1 && pagination.current > 1;
      fetchMonitoring(isLastOnPage ? pagination.current - 1 : pagination.current, pagination.pageSize);
    } catch {
      message.error('O‘chirishda xatolik yuz berdi.');
    }
  };

  const removeSelected = async () => {
    const targets = rows.filter((row) => selectedRowKeys.includes(row.id));
    if (!targets.length) return;
    setDeleting(true);
    try {
      const results = await Promise.allSettled(
        targets.map((row) => deleteMonitoring(row.userId, row.courseId))
      );
      const failed = results.filter((r) => r.status === 'rejected').length;
      if (failed) {
        message.warning(`${targets.length - failed} ta o‘chirildi, ${failed} tasida xatolik.`);
      } else {
        message.success(`${targets.length} ta yozuv o‘chirildi.`);
      }
      fetchMonitoring(1, pagination.pageSize);
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const filters = filtersRef.current;
      const payload = await getMonitoring({
        start: 0,
        limit: EXPORT_LIMIT,
        searchKey: filters.searchTerm.trim(),
        status: filters.status === 'ALL' ? undefined : filters.status,
        courseId: filters.courseId,
      });

      const header = [
        'F.I.Sh.',
        'Email',
        'Telefon',
        'Kurs',
        'Holat',
        'Progress (%)',
        'Darslar',
        'Testlar',
        'O‘rtacha ball',
        'Oxirgi ball',
        'Boshlagan sana',
        'Oxirgi aktivlik',
        'Tugatgan sana',
      ];
      const escapeCell = (value: string | number) => `"${String(value ?? '').replace(/"/g, '""')}"`;
      const lines = payload.list.map((row) =>
        [
          row.userFullName,
          row.email,
          row.phoneNumber,
          row.courseTitle,
          getStatusLabel(row.status),
          row.progressPercent,
          `${row.completedLessonCount}/${row.totalLessonCount}`,
          `${row.solvedTestCount}/${row.totalTestCount}`,
          row.averageScore ?? '',
          row.lastScore ?? '',
          formatDate(row.startedAt),
          formatDate(row.lastActivityAt),
          formatDate(row.completedAt),
        ]
          .map(escapeCell)
          .join(';')
      );
      const csv = '﻿' + [header.map(escapeCell).join(';'), ...lines].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kurs-monitoring-${dayjs().format('YYYY-MM-DD_HH-mm')}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      message.success('Hisobot yuklab olindi.');
    } catch {
      message.error('Hisobotni tayyorlashda xatolik yuz berdi.');
    } finally {
      setExporting(false);
    }
  };

  const columns: TableProps<MonitoringRowDto>['columns'] = useMemo(() => {
    const base: TableProps<MonitoringRowDto>['columns'] = [
      {
        title: 'O‘quvchi',
        dataIndex: 'userFullName',
        key: 'userFullName',
        width: 260,
        fixed: screens.lg ? 'left' : undefined,
        render: (_, record) => (
          <Space size={12}>
            <Avatar
              style={{ backgroundColor: nameToColor(record.userFullName), flexShrink: 0 }}
              size={40}
            >
              {initialsOf(record.userFullName)}
            </Avatar>
            <Space direction="vertical" size={0} style={{ minWidth: 0 }}>
              <Text strong ellipsis={{ tooltip: record.userFullName }} style={{ maxWidth: 180 }}>
                {record.userFullName}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.email || record.phoneNumber || '-'}
              </Text>
            </Space>
          </Space>
        ),
      },
      {
        title: 'Kurs',
        dataIndex: 'courseTitle',
        key: 'courseTitle',
        width: 200,
        render: (value) => (
          <Text ellipsis={{ tooltip: value }} style={{ maxWidth: 190 }}>
            {value}
          </Text>
        ),
      },
      {
        title: 'Holat',
        dataIndex: 'status',
        key: 'status',
        width: 140,
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
        width: 170,
        sorter: (a, b) => a.progressPercent - b.progressPercent,
        render: (value: number) => {
          const stroke = progressStroke(value);
          return (
            <Progress
              percent={value}
              size="small"
              strokeColor={{ '0%': stroke.from, '100%': stroke.to }}
            />
          );
        },
      },
      {
        title: 'Darslar / Testlar',
        key: 'lessons',
        width: 150,
        render: (_, record) => (
          <Space direction="vertical" size={2}>
            <Text style={{ fontSize: 13 }}>
              <PlayCircleOutlined style={{ color: '#1d4ed8', marginRight: 6 }} />
              {record.completedLessonCount}/{record.totalLessonCount}
            </Text>
            <Text style={{ fontSize: 13 }}>
              <SafetyCertificateOutlined style={{ color: '#7c3aed', marginRight: 6 }} />
              {record.solvedTestCount}/{record.totalTestCount}
            </Text>
          </Space>
        ),
      },
      {
        title: 'Ballar',
        key: 'scores',
        width: 130,
        render: (_, record) => (
          <Space direction="vertical" size={2}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              O‘rtacha: <Text strong>{record.averageScore ?? '-'}%</Text>
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Oxirgi: <Text strong>{record.lastScore ?? '-'}%</Text>
            </Text>
          </Space>
        ),
      },
      {
        title: 'Joriy bosqich',
        key: 'current',
        width: 230,
        render: (_, record) => (
          <Space direction="vertical" size={2}>
            <Text ellipsis={{ tooltip: record.currentModuleTitle }} style={{ maxWidth: 210 }}>
              {record.currentModuleTitle || '-'}
            </Text>
            <Text
              type="secondary"
              style={{ fontSize: 12, maxWidth: 210 }}
              ellipsis={{ tooltip: record.currentLessonTitle }}
            >
              {record.currentLessonTitle || '-'}
            </Text>
          </Space>
        ),
      },
      {
        title: 'Oxirgi aktivlik',
        dataIndex: 'lastActivityAt',
        key: 'lastActivityAt',
        width: 170,
        render: (value) => (
          <Tooltip title={value ? dayjs(value).format('DD.MM.YYYY HH:mm:ss') : ''}>
            <Space direction="vertical" size={0}>
              <Text style={{ fontSize: 13 }}>{formatDate(value)}</Text>
              {relativeDate(value) ? (
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {relativeDate(value)}
                </Text>
              ) : null}
            </Space>
          </Tooltip>
        ),
      },
      {
        title: 'Amallar',
        key: 'actions',
        width: canDelete ? 150 : 110,
        fixed: screens.lg ? 'right' : undefined,
        render: (_, record) => (
          <Space size={4} onClick={(e) => e.stopPropagation()}>
            <Button size="small" onClick={() => openDetail(record)}>
              Batafsil
            </Button>
            {canDelete ? (
              <Popconfirm
                title="Progressni o‘chirish"
                description="Ushbu o‘quvchining shu kursdagi butun progressi o‘chiriladi."
                okText="O‘chirish"
                okButtonProps={{ danger: true }}
                cancelText="Bekor"
                onConfirm={() => removeRow(record)}
              >
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            ) : null}
          </Space>
        ),
      },
    ];
    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canDelete, screens.lg, rows, pagination.current, pagination.pageSize]);

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
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={12} md={8} xl={4}>
            <SummaryTile
              icon={<TeamOutlined />}
              label="Jami yozilishlar"
              value={summary?.total ?? 0}
              hint="O‘quvchi–kurs juftliklari"
              color="#1d4ed8"
              active={status === 'ALL'}
              onClick={() => setStatus('ALL')}
            />
          </Col>
          <Col xs={12} md={8} xl={4}>
            <SummaryTile
              icon={<ClockCircleOutlined />}
              label="Boshlanmagan"
              value={summary?.notStartedCount ?? 0}
              color="#f59e0b"
              active={status === 'NOT_STARTED'}
              onClick={() => setStatus('NOT_STARTED')}
            />
          </Col>
          <Col xs={12} md={8} xl={4}>
            <SummaryTile
              icon={<SyncOutlined />}
              label="Jarayonda"
              value={summary?.inProgressCount ?? 0}
              color="#0ea5e9"
              active={status === 'IN_PROGRESS'}
              onClick={() => setStatus('IN_PROGRESS')}
            />
          </Col>
          <Col xs={12} md={8} xl={4}>
            <SummaryTile
              icon={<CheckCircleOutlined />}
              label="Tugallangan"
              value={summary?.completedCount ?? 0}
              color="#16a34a"
              active={status === 'COMPLETED'}
              onClick={() => setStatus('COMPLETED')}
            />
          </Col>
          <Col xs={12} md={8} xl={4}>
            <SummaryTile
              icon={<CloseCircleOutlined />}
              label="Muvaffaqiyatsiz"
              value={summary?.failedCount ?? 0}
              color="#dc2626"
              active={status === 'FAILED'}
              onClick={() => setStatus('FAILED')}
            />
          </Col>
          <Col xs={12} md={8} xl={4}>
            <SummaryTile
              icon={<RiseOutlined />}
              label="O‘rtacha progress"
              value={`${summary?.averageProgress ?? 0}%`}
              hint="Joriy filter bo‘yicha"
              color="#7c3aed"
            />
          </Col>
        </Row>

        <AdminSectionCard
          title={
            selectedRowKeys.length > 0 ? (
              <Space>
                <Text strong>{selectedRowKeys.length} ta tanlandi</Text>
                {canDelete ? (
                  <Popconfirm
                    title="Tanlanganlarni o‘chirish"
                    description={`${selectedRowKeys.length} ta o‘quvchining progressi o‘chiriladi.`}
                    okText="O‘chirish"
                    okButtonProps={{ danger: true }}
                    cancelText="Bekor"
                    onConfirm={removeSelected}
                  >
                    <Button danger size="small" icon={<DeleteOutlined />} loading={deleting}>
                      O‘chirish
                    </Button>
                  </Popconfirm>
                ) : null}
                <Button size="small" type="text" onClick={() => setSelectedRowKeys([])}>
                  Bekor qilish
                </Button>
              </Space>
            ) : (
              'O‘quvchilar progressi'
            )
          }
          extra={
            <Space wrap>
              <Select
                allowClear
                showSearch
                placeholder="Kurs bo‘yicha filter"
                value={courseId}
                onChange={(value) => setCourseId(value || undefined)}
                options={courseOptions}
                optionFilterProp="label"
                style={{ width: 220 }}
              />
              <Input.Search
                placeholder="Ism, email yoki telefon"
                allowClear
                value={searchTerm}
                onChange={(event) => handleSearchChange(event.target.value)}
                onSearch={() => fetchMonitoring(1, pagination.pageSize)}
                style={{ width: 260, maxWidth: '100%' }}
              />
              <Tooltip title="Yangilash">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => fetchMonitoring(pagination.current, pagination.pageSize)}
                />
              </Tooltip>
              <Button icon={<DownloadOutlined />} loading={exporting} onClick={handleExport}>
                CSV
              </Button>
            </Space>
          }
        >
          {screens.md ? (
            <Segmented
              value={status}
              onChange={(value) => setStatus(value as 'ALL' | MonitoringStatus)}
              style={{ marginBottom: 16 }}
              options={[
                { label: 'Barchasi', value: 'ALL', icon: <TeamOutlined /> },
                { label: 'Boshlanmagan', value: 'NOT_STARTED', icon: <ClockCircleOutlined /> },
                { label: 'Jarayonda', value: 'IN_PROGRESS', icon: <SyncOutlined /> },
                { label: 'Tugallangan', value: 'COMPLETED', icon: <CheckCircleOutlined /> },
                { label: 'Muvaffaqiyatsiz', value: 'FAILED', icon: <CloseCircleOutlined /> },
                { label: 'Yopiq', value: 'LOCKED', icon: <LockOutlined /> },
              ]}
            />
          ) : null}

          <Table
            rowKey="id"
            dataSource={rows}
            columns={columns}
            loading={loading}
            scroll={{ x: 1500 }}
            rowSelection={
              canDelete
                ? {
                    selectedRowKeys,
                    onChange: setSelectedRowKeys,
                    preserveSelectedRowKeys: false,
                  }
                : undefined
            }
            onRow={(record) => ({
              onClick: () => openDetail(record),
              style: { cursor: 'pointer' },
            })}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50, 100],
              showTotal: (total) => `Jami: ${total} ta yozuv`,
            }}
            onChange={(nextPagination) =>
              fetchMonitoring(
                nextPagination.current || 1,
                nextPagination.pageSize || pagination.pageSize
              )
            }
          />
        </AdminSectionCard>
      </AdminPageFrame>

      <Drawer
        open={detailOpen}
        width="min(640px, 100vw)"
        title={detail ? detail.userFullName : 'O‘quvchi progressi'}
        onClose={() => {
          setDetailOpen(false);
          setDetail(null);
        }}
      >
        {detailLoading ? (
          <div style={{ minHeight: 320, display: 'grid', placeItems: 'center' }}>
            <Spin size="large" />
          </div>
        ) : detail ? (
          <Space direction="vertical" size={20} style={{ width: '100%' }}>
            <Descriptions
              column={1}
              size="small"
              bordered
              items={[
                { key: 'course', label: 'Kurs', children: detail.courseTitle },
                {
                  key: 'status',
                  label: 'Holat',
                  children: (
                    <Tag color={getStatusColor(detail.status)} style={{ borderRadius: 999 }}>
                      {getStatusLabel(detail.status)}
                    </Tag>
                  ),
                },
                {
                  key: 'contact',
                  label: 'Aloqa',
                  children: [detail.email, detail.phoneNumber].filter(Boolean).join(' • ') || '-',
                },
                {
                  key: 'avg',
                  label: 'O‘rtacha ball',
                  children: detail.averageScore != null ? `${detail.averageScore}%` : '-',
                },
                { key: 'started', label: 'Boshlagan', children: formatDate(detail.startedAt) },
                {
                  key: 'activity',
                  label: 'Oxirgi aktivlik',
                  children: formatDate(detail.lastActivityAt),
                },
                { key: 'completed', label: 'Tugatgan', children: formatDate(detail.completedAt) },
              ]}
            />

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text type="secondary">Umumiy progress</Text>
                <Text strong>{detail.progressPercent}%</Text>
              </div>
              <Progress
                percent={detail.progressPercent}
                strokeColor={detail.progressPercent >= 100 ? '#16a34a' : '#1d4ed8'}
                showInfo={false}
              />
            </div>

            {detail.modules.length > 0 ? (
              <Collapse
                defaultActiveKey={detail.modules
                  .filter((module) => module.status === 'IN_PROGRESS')
                  .map((module) => module.moduleId)}
                items={detail.modules.map((module, index) => ({
                  key: module.moduleId,
                  label: (
                    <Space size={10} wrap>
                      <Text strong>
                        {index + 1}. {module.title}
                      </Text>
                      <Tag color={getStatusColor(module.status)} style={{ borderRadius: 999 }}>
                        {getStatusLabel(module.status)}
                      </Tag>
                      <Text type="secondary">{module.progressPercent}%</Text>
                    </Space>
                  ),
                  children: (
                    <Space direction="vertical" size={10} style={{ width: '100%' }}>
                      {module.lessons.length > 0 ? (
                        module.lessons.map((lesson) => (
                          <div
                            key={lesson.lessonItemId}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: 12,
                            }}
                          >
                            <Space size={10} style={{ minWidth: 0 }}>
                              <LessonTypeIcon type={lesson.type} />
                              <Space direction="vertical" size={0} style={{ minWidth: 0 }}>
                                <Text ellipsis={{ tooltip: lesson.title }} style={{ maxWidth: 340 }}>
                                  {lesson.title}
                                </Text>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  {getLessonTypeLabel(lesson.type)}
                                  {lesson.completedAt ? ` • ${formatDate(lesson.completedAt)}` : ''}
                                </Text>
                              </Space>
                            </Space>
                            <Space size={8}>
                              {lesson.type === 'TEST' && lesson.score != null ? (
                                <Text strong>{lesson.score}%</Text>
                              ) : null}
                              <Tag
                                color={getStatusColor(lesson.status)}
                                style={{ borderRadius: 999, margin: 0 }}
                              >
                                {getStatusLabel(lesson.status)}
                              </Tag>
                            </Space>
                          </div>
                        ))
                      ) : (
                        <Text type="secondary">Bu modulda darslar yo‘q</Text>
                      )}
                    </Space>
                  ),
                }))}
              />
            ) : (
              <Empty description="Kurs tarkibi topilmadi" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Space>
        ) : (
          <Empty description="Ma’lumot topilmadi" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Drawer>
    </div>
  );
};

import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Badge,
  Button,
  Card,
  Col,
  DatePicker,
  Drawer,
  Empty,
  Input,
  message,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  theme,
  Typography,
} from 'antd';
import {
  CheckCircleOutlined,
  EyeOutlined,
  InboxOutlined,
  PhoneOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import { useAppTranslation } from '../../hooks/useAppTranslation.ts';
import {
  ADMIN_MODAL_STYLES,
  AdminPageFrame,
  AdminSectionCard,
} from './adminUi.tsx';
import {
  getPublicContactRequestById,
  getPublicContactRequestOverview,
  getPublicContactRequests,
  type PublicContactRequestItem,
  type PublicContactRequestOverview,
  type PublicContactRequestStatus,
  toApiDate,
  updatePublicContactRequestStatus,
} from './publicContactRequestsApi.ts';

const { RangePicker } = DatePicker;
const { Text, Paragraph, Title } = Typography;

type FilterState = {
  searchKey: string;
  status?: PublicContactRequestStatus;
  phoneNumber: string;
  sourcePage: string;
  fromDate: Dayjs | null;
  toDate: Dayjs | null;
};

const initialFilters: FilterState = {
  searchKey: '',
  status: undefined,
  phoneNumber: '',
  sourcePage: '',
  fromDate: null,
  toDate: null,
};

const getErrorMessage = (error: unknown) => {
  const err = error as {
    response?: { data?: { errors?: { message?: string }; message?: string } };
    message?: string;
  };

  return (
    err?.response?.data?.errors?.message ||
    err?.response?.data?.message ||
    err?.message ||
    'Amalni bajarishda xatolik yuz berdi.'
  );
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '-';
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('DD.MM.YYYY HH:mm') : value;
};

// t приходит параметром: хелперы живут вне компонента и хук там вызвать нельзя.
type Translate = ReturnType<typeof useAppTranslation>['t'];

const renderStatusTag = (status: PublicContactRequestStatus, t: Translate) => {
  if (status === 'NEW') {
    return <Badge status="processing" text={t('admin.contacts.statusNew')} />;
  }

  if (status === 'REVIEWED') {
    return <Badge status="warning" text={t('admin.contacts.statusReviewed')} />;
  }

  return <Badge status="success" text={t('admin.contacts.statusClosed')} />;
};

const buildStatusOptions = (t: Translate) => [
  { value: 'NEW', label: t('admin.contacts.statusNew') },
  { value: 'REVIEWED', label: t('admin.contacts.statusReviewed') },
  { value: 'CLOSED', label: t('admin.contacts.statusClosed') },
] as const;

export const DashboardPublicContactRequestsPage = () => {
  const { t } = useAppTranslation();
  const { token } = theme.useToken();
  const [overview, setOverview] = useState<PublicContactRequestOverview | null>(null);
  const [items, setItems] = useState<PublicContactRequestItem[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PublicContactRequestItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  const requestParams = useMemo(
    () => ({
      searchKey: filters.searchKey.trim() || undefined,
      status: filters.status,
      phoneNumber: filters.phoneNumber.trim() || undefined,
      sourcePage: filters.sourcePage.trim() || undefined,
      fromDate: toApiDate(filters.fromDate),
      toDate: toApiDate(filters.toDate),
      start: ((pagination.current || 1) - 1) * (pagination.pageSize || 10),
      limit: pagination.pageSize || 10,
    }),
    [filters, pagination.current, pagination.pageSize]
  );

  const fetchOverview = async () => {
    setOverviewLoading(true);
    try {
      const payload = await getPublicContactRequestOverview();
      setOverview(payload);
    } catch (error) {
      setOverview(null);
      message.error(getErrorMessage(error));
    } finally {
      setOverviewLoading(false);
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const payload = await getPublicContactRequests(requestParams);
      setItems(payload.list || []);
      setCount(payload.count || 0);
    } catch (error) {
      setItems([]);
      setCount(0);
      message.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [requestParams]);

  const refreshAll = async () => {
    await Promise.all([fetchOverview(), fetchRequests()]);
  };

  const handleResetFilters = () => {
    setFilters(initialFilters);
    setPagination((current) => ({
      ...current,
      current: 1,
      pageSize: current.pageSize || 10,
    }));
  };

  const handleTableChange = (nextPagination: TablePaginationConfig) => {
    setPagination((current) => ({
      ...current,
      current: nextPagination.current || 1,
      pageSize: nextPagination.pageSize || 10,
    }));
  };

  const handleOpenDrawer = async (requestId: string) => {
    setDrawerOpen(true);
    setDetailLoading(true);
    try {
      const payload = await getPublicContactRequestById(requestId);
      setSelectedRequest(payload);
    } catch (error) {
      setSelectedRequest(null);
      message.error(getErrorMessage(error));
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusUpdate = async (
    requestId: string,
    status: PublicContactRequestStatus
  ) => {
    setStatusUpdatingId(requestId);

    try {
      const updated = await updatePublicContactRequestStatus(requestId, status);
      message.success(t('admin.contacts.statusUpdated'));

      setItems((current) =>
        current.map((item) => (item.id === requestId ? { ...item, status: updated.status } : item))
      );

      if (selectedRequest?.id === requestId) {
        setSelectedRequest(updated);
      }

      await Promise.all([fetchOverview(), fetchRequests()]);
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const columns: ColumnsType<PublicContactRequestItem> = [
    {
      title: t('admin.common.fullName'),
      key: 'fullName',
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Text strong style={{ color: token.colorText }}>
            {record.fullName}
          </Text>
          <Text style={{ color: token.colorTextSecondary }}>{record.phoneNumber}</Text>
        </Space>
      ),
    },
    {
      title: t('admin.contacts.messagePreview'),
      dataIndex: 'message',
      render: (value: string) => (
        <Paragraph
          ellipsis={{ rows: 2, tooltip: value }}
          style={{ marginBottom: 0, maxWidth: 320, color: token.colorTextSecondary }}
        >
          {value}
        </Paragraph>
      ),
    },
    {
      title: t('admin.contacts.page'),
      dataIndex: 'sourcePage',
      width: 160,
      render: (value: string | null) => (
        <Tag
          style={{
            margin: 0,
            borderRadius: 999,
            paddingInline: 10,
            background: token.colorFillSecondary,
            borderColor: token.colorBorderSecondary,
            color: token.colorTextSecondary,
          }}
        >
          {value || '-'}
        </Tag>
      ),
    },
    {
      title: t('admin.contacts.status'),
      dataIndex: 'status',
      width: 160,
      render: (value: PublicContactRequestStatus) => renderStatusTag(value, t),
    },
    {
      title: t('admin.common.date'),
      dataIndex: 'createdAt',
      width: 170,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: t('admin.common.actions'),
      key: 'actions',
      width: 250,
      render: (_, record) => (
        <Space wrap size={8}>
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleOpenDrawer(record.id)}
            style={{ borderRadius: 12 }}
          >
            {t('admin.common.view')}
          </Button>
          <Button
            onClick={() => handleStatusUpdate(record.id, 'REVIEWED')}
            disabled={record.status === 'REVIEWED'}
            loading={statusUpdatingId === record.id}
            style={{ borderRadius: 12 }}
          >
            REVIEWED
          </Button>
          <Button
            type="primary"
            ghost
            onClick={() => handleStatusUpdate(record.id, 'CLOSED')}
            disabled={record.status === 'CLOSED'}
            loading={statusUpdatingId === record.id}
            style={{ borderRadius: 12 }}
          >
            CLOSED
          </Button>
        </Space>
      ),
    },
  ];

  const stats = [
    {
      key: 'total',
      title: t('admin.common.total'),
      value: overview?.totalCount ?? count,
      icon: <InboxOutlined style={{ color: '#2563eb' }} />,
    },
    {
      key: 'new',
      title: t('admin.contacts.statusNew'),
      value: overview?.newCount ?? 0,
      icon: <Badge status="processing" />,
    },
    {
      key: 'reviewed',
      title: t('admin.contacts.statusReviewed'),
      value: overview?.reviewedCount ?? 0,
      icon: <Badge status="warning" />,
    },
    {
      key: 'closed',
      title: t('admin.contacts.statusClosed'),
      value: overview?.closedCount ?? 0,
      icon: <CheckCircleOutlined style={{ color: '#16a34a' }} />,
    },
    {
      key: 'day',
      title: t('admin.contacts.last24h'),
      value: overview?.last24HoursCount ?? 0,
      icon: <PhoneOutlined style={{ color: '#7c3aed' }} />,
    },
  ];

  return (
    <>
      <Helmet>
        <title>{t('admin.contacts.pageTitle')}</title>
      </Helmet>

      <AdminPageFrame
        eyebrow={t('admin.contacts.eyebrow')}
        title={t('admin.contacts.title')}
        subtitle={t('admin.contacts.subtitle')}
        actions={
          <Button
            icon={<ReloadOutlined />}
            onClick={refreshAll}
            loading={loading || overviewLoading}
            style={{ borderRadius: 14, height: 44 }}
          >
            {t('admin.common.refresh')}
          </Button>
        }
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 14,
          }}
        >
          {stats.map((stat) => (
            <Card
              key={stat.key}
              style={{
                borderRadius: 18,
                border: `1px solid ${token.colorBorderSecondary}`,
                background: token.colorBgContainer,
                boxShadow:
                  token.colorBgBase === '#000'
                    ? '0 16px 32px rgba(0, 0, 0, 0.22)'
                    : '0 12px 28px rgba(15, 23, 42, 0.04)',
              }}
              bodyStyle={{ padding: '14px 16px' }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <Space align="center" size={10}>
                  <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                    {stat.icon}
                  </span>
                  <Text style={{ color: token.colorTextSecondary, fontSize: 15 }}>
                    {stat.title}
                  </Text>
                </Space>
                <Statistic
                  value={stat.value}
                  loading={overviewLoading}
                  valueStyle={{
                    color: token.colorText,
                    fontWeight: 800,
                    fontSize: 30,
                    lineHeight: 1,
                  }}
                />
              </div>
            </Card>
          ))}
        </div>

        <AdminSectionCard
          title={t('admin.contacts.listTitle')}
          extra={
            <Text style={{ color: token.colorTextSecondary }}>
              {t('admin.common.totalColon')} <strong style={{ color: token.colorText }}>{count}</strong>
            </Text>
          }
        >
          <Space direction="vertical" size={18} style={{ width: '100%' }}>
            <Row gutter={[12, 12]}>
              <Col xs={24} md={12} xl={7}>
                <Input
                  allowClear
                  prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
                  placeholder={t('admin.contacts.search')}
                  value={filters.searchKey}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      searchKey: event.target.value,
                    }))
                  }
                  onPressEnter={() =>
                    setPagination((current) => ({ ...current, current: 1 }))
                  }
                  style={{ height: 44, borderRadius: 14 }}
                />
              </Col>
              <Col xs={24} sm={12} xl={4}>
                <Select
                  allowClear
                  placeholder={t('admin.contacts.status')}
                  value={filters.status}
                  onChange={(value) =>
                    setFilters((current) => ({
                      ...current,
                      status: value,
                    }))
                  }
                  options={buildStatusOptions(t).map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                  style={{ width: '100%' }}
                  size="large"
                />
              </Col>
              <Col xs={24} sm={12} xl={4}>
                <Input
                  allowClear
                  placeholder={t('admin.common.phone')}
                  value={filters.phoneNumber}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      phoneNumber: event.target.value,
                    }))
                  }
                  style={{ height: 44, borderRadius: 14 }}
                />
              </Col>
              <Col xs={24} sm={12} xl={4}>
                <Input
                  allowClear
                  placeholder={t('admin.contacts.sourcePage')}
                  value={filters.sourcePage}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      sourcePage: event.target.value,
                    }))
                  }
                  style={{ height: 44, borderRadius: 14 }}
                />
              </Col>
              <Col xs={24} md={12} xl={5}>
                <RangePicker
                  value={
                    filters.fromDate && filters.toDate
                      ? [filters.fromDate, filters.toDate]
                      : null
                  }
                  onChange={(value) =>
                    setFilters((current) => ({
                      ...current,
                      fromDate: value?.[0] || null,
                      toDate: value?.[1] || null,
                    }))
                  }
                  style={{ width: '100%', height: 44 }}
                  format="YYYY-MM-DD"
                />
              </Col>
            </Row>

            <Space wrap>
              <Button
                type="primary"
                onClick={() =>
                  setPagination((current) => ({ ...current, current: 1 }))
                }
                style={{ borderRadius: 14 }}
              >
                {t('admin.common.apply')}
              </Button>
              <Button onClick={handleResetFilters} style={{ borderRadius: 14 }}>
                {t('admin.common.reset')}
              </Button>
            </Space>

            <Table<PublicContactRequestItem>
              rowKey="id"
              columns={columns}
              dataSource={items}
              loading={loading}
              onChange={handleTableChange}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={t('admin.contacts.empty')}
                  />
                ),
              }}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: count,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50', '100'],
              }}
              scroll={{ x: 980 }}
            />
          </Space>
        </AdminSectionCard>
      </AdminPageFrame>

      <Drawer
        title={t('admin.contacts.details')}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedRequest(null);
        }}
        width={560}
        styles={ADMIN_MODAL_STYLES}
      >
        {detailLoading ? (
          <Text>{t('admin.common.loading')}</Text>
        ) : !selectedRequest ? (
          <Empty description={t('admin.contacts.notFound')} />
        ) : (
          <Space direction="vertical" size={18} style={{ width: '100%' }}>
            <AdminSectionCard>
              <Space direction="vertical" size={10} style={{ width: '100%' }}>
                <div>
                  <Text style={{ color: token.colorTextSecondary }}>{t('admin.common.fullName')}</Text>
                  <Title level={4} style={{ margin: '4px 0 0', color: token.colorText }}>
                    {selectedRequest.fullName}
                  </Title>
                </div>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Text style={{ color: token.colorTextSecondary }}>Telefon</Text>
                    <div style={{ marginTop: 4 }}>{selectedRequest.phoneNumber}</div>
                  </Col>
                  <Col span={12}>
                    <Text style={{ color: token.colorTextSecondary }}>Status</Text>
                    <div style={{ marginTop: 4 }}>
                      {renderStatusTag(selectedRequest.status, t)}
                    </div>
                  </Col>
                  <Col span={12}>
                    <Text style={{ color: token.colorTextSecondary }}>Sana</Text>
                    <div style={{ marginTop: 4 }}>
                      {formatDateTime(selectedRequest.createdAt)}
                    </div>
                  </Col>
                  <Col span={12}>
                    <Text style={{ color: token.colorTextSecondary }}>{t('admin.contacts.sourcePage')}</Text>
                    <div style={{ marginTop: 4 }}>{selectedRequest.sourcePage || '-'}</div>
                  </Col>
                </Row>
              </Space>
            </AdminSectionCard>

            <AdminSectionCard title={t('admin.contacts.message')}>
              <Paragraph
                style={{ marginBottom: 0, whiteSpace: 'pre-wrap', color: token.colorText }}
              >
                {selectedRequest.message}
              </Paragraph>
            </AdminSectionCard>

            <AdminSectionCard title={t('admin.contacts.technical')}>
              <Space direction="vertical" size={10} style={{ width: '100%' }}>
                <div>
                  <Text style={{ color: token.colorTextSecondary }}>{t('admin.contacts.formSession')}</Text>
                  <div style={{ marginTop: 4 }}>{selectedRequest.formSessionId || '-'}</div>
                </div>
                <div>
                  <Text style={{ color: token.colorTextSecondary }}>{t('admin.contacts.ip')}</Text>
                  <div style={{ marginTop: 4 }}>{selectedRequest.ipAddress || '-'}</div>
                </div>
                <div>
                  <Text style={{ color: token.colorTextSecondary }}>{t('admin.contacts.userAgent')}</Text>
                  <Paragraph
                    style={{
                      marginBottom: 0,
                      marginTop: 4,
                      color: token.colorText,
                      wordBreak: 'break-word',
                    }}
                  >
                    {selectedRequest.userAgent || '-'}
                  </Paragraph>
                </div>
              </Space>
            </AdminSectionCard>

            <AdminSectionCard title={t('admin.contacts.statusActions')}>
              <Space wrap>
                <Button
                  onClick={() => handleStatusUpdate(selectedRequest.id, 'REVIEWED')}
                  disabled={selectedRequest.status === 'REVIEWED'}
                  loading={statusUpdatingId === selectedRequest.id}
                  style={{ borderRadius: 12 }}
                >
                  {t('admin.contacts.markReviewed')}
                </Button>
                <Button
                  type="primary"
                  ghost
                  onClick={() => handleStatusUpdate(selectedRequest.id, 'CLOSED')}
                  disabled={selectedRequest.status === 'CLOSED'}
                  loading={statusUpdatingId === selectedRequest.id}
                  style={{ borderRadius: 12 }}
                >
                  {t('admin.contacts.markClosed')}
                </Button>
              </Space>
            </AdminSectionCard>
          </Space>
        )}
      </Drawer>
    </>
  );
};

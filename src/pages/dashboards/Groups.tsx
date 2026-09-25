import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Badge,
  Button,
  Col,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Row,
  Segmented,
  Space,
  Switch,
  Table,
  theme,
  Typography,
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import {
  ADMIN_MODAL_STYLES,
  AdminPageFrame,
  AdminSectionCard,
} from './adminUi.tsx';
import {
  createGroup,
  deleteGroup,
  getGroups,
  getGroupsOverview,
  updateGroup,
} from './groupsApi.ts';
import type {
  GroupCreatePayload,
  GroupsOverview,
  GroupUpdatePayload,
  StudentGroupItem,
} from './groupTypes.ts';
import { PATH_DASHBOARD } from '../../constants';
import { useAppTranslation } from '../../hooks/useAppTranslation.ts';

const { Text, Paragraph } = Typography;

type GroupFilterValue = 'all' | 'active' | 'inactive';

type GroupFormValues = {
  name: string;
  description?: string;
  active: boolean;
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

const formatDate = (value: string) => {
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('DD.MM.YYYY HH:mm') : '-';
};

export const DashboardGroupsPage = () => {
  const { t } = useAppTranslation();
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const [form] = Form.useForm<GroupFormValues>();
  const [groups, setGroups] = useState<StudentGroupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKey, setSearchKey] = useState('');
  const [filter, setFilter] = useState<GroupFilterValue>('all');
  const [count, setCount] = useState(0);
  const [overview, setOverview] = useState<GroupsOverview | null>(null);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingGroup, setEditingGroup] = useState<StudentGroupItem | null>(null);

  const fetchGroups = async (
    page = pagination.current || 1,
    pageSize = pagination.pageSize || 10,
    currentSearchKey = searchKey,
    currentFilter = filter
  ) => {
    setLoading(true);
    try {
      const payload = await getGroups({
        searchKey: currentSearchKey,
        start: (page - 1) * pageSize,
        limit: pageSize,
        active:
          currentFilter === 'all'
            ? undefined
            : currentFilter === 'active'
              ? true
              : false,
      });

      setGroups(payload.list || []);
      setCount(payload.count || 0);
      setPagination((current) => ({
        ...current,
        current: page,
        pageSize,
      }));
    } catch (error) {
      message.error(getErrorMessage(error));
      setGroups([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchOverview = async () => {
    try {
      const payload = await getGroupsOverview();
      setOverview(payload);
    } catch {
      setOverview(null);
    }
  };

  useEffect(() => {
    fetchGroups(1, pagination.pageSize || 10, '', filter);
    fetchOverview();
  }, []);

  const openCreateModal = () => {
    setEditingGroup(null);
    form.setFieldsValue({
      name: '',
      description: '',
      active: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (group: StudentGroupItem) => {
    setEditingGroup(group);
    form.setFieldsValue({
      name: group.name,
      description: group.description || '',
      active: group.active,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSubmitting(false);
    setEditingGroup(null);
    form.resetFields();
  };

  const handleSaveGroup = async (values: GroupFormValues) => {
    const payload: GroupCreatePayload | GroupUpdatePayload = {
      name: values.name.trim(),
      description: values.description?.trim() || null,
      active: values.active,
    };

    try {
      setSubmitting(true);
      if (editingGroup) {
        await updateGroup(editingGroup.id, payload);
        message.success(t('admin.groups.updated'));
      } else {
        await createGroup(payload);
        message.success(t('admin.groups.created'));
      }
      closeModal();
      await fetchGroups(
        pagination.current || 1,
        pagination.pageSize || 10,
        searchKey,
        filter
      );
      await fetchOverview();
    } catch (error) {
      message.error(getErrorMessage(error));
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (group: StudentGroupItem) => {
    try {
      await updateGroup(group.id, {
        name: group.name,
        description: group.description,
        active: !group.active,
      });
      message.success(
        !group.active ? 'Guruh faollashtirildi.' : 'Guruh nofaol holatga o‘tkazildi.'
      );
      await fetchGroups(
        pagination.current || 1,
        pagination.pageSize || 10,
        searchKey,
        filter
      );
      await fetchOverview();
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      await deleteGroup(groupId);
      message.success(t('admin.groups.deleted'));
      await fetchGroups(
        pagination.current || 1,
        pagination.pageSize || 10,
        searchKey,
        filter
      );
      await fetchOverview();
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  };

  const columns: ColumnsType<StudentGroupItem> = [
    {
      title: t('admin.groups.colGroup'),
      key: 'group',
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Text strong style={{ color: token.colorText }}>
            {record.name}
          </Text>
          <Text style={{ color: token.colorTextSecondary }}>
            {record.description || t('admin.common.noDesc')}
          </Text>
        </Space>
      ),
    },
    {
      title: t('admin.common.status'),
      dataIndex: 'active',
      width: 140,
      render: (active: boolean) => (
        <Badge
          status={active ? 'success' : 'default'}
          text={active ? t('admin.common.active') : t('admin.common.inactive')}
        />
      ),
    },
    {
      title: t('admin.groups.colStudents'),
      dataIndex: 'studentCount',
      width: 120,
      render: (value: number) => <Text strong>{value}</Text>,
    },
    {
      title: t('admin.groups.colCourses'),
      dataIndex: 'courseCount',
      width: 120,
      render: (value: number) => <Text strong>{value}</Text>,
    },
    {
      title: t('admin.common.createdAt'),
      dataIndex: 'createdAt',
      width: 180,
      render: (value: string) => <Text>{formatDate(value)}</Text>,
    },
    {
      title: t('admin.common.actions'),
      key: 'actions',
      width: 260,
      render: (_, record) => (
        <Space wrap>
          <Button
            icon={<EyeOutlined />}
            onClick={() => navigate(`${PATH_DASHBOARD.groups}/${record.id}`)}
          >
            {t('admin.common.open')}
          </Button>
          <Button icon={<EditOutlined />} onClick={() => openEditModal(record)}>
            {t('admin.common.edit')}
          </Button>
          <Button onClick={() => handleToggleActive(record)}>
            {record.active ? t('admin.groups.deactivate') : t('admin.groups.activate')}
          </Button>
          <Popconfirm
            title={t('admin.groups.deleteTitle')}
            description={t('admin.groups.deleteHint')}
            okText={t('admin.common.delete')}
            cancelText={t('admin.common.cancel')}
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDeleteGroup(record.id)}
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Helmet>
        <title>{t('admin.groups.pageTitle')}</title>
      </Helmet>

      <AdminPageFrame
        eyebrow={t('admin.groups.eyebrow')}
        title={t('admin.groups.title')}
        subtitle={t('admin.groups.subtitle')}
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={openCreateModal}
            style={{ height: 46, borderRadius: 16 }}
          >
            {t('admin.groups.new')}
          </Button>
        }
      >
        <AdminSectionCard
          title={t('admin.groups.listTitle')}
          extra={
            <Space wrap>
              <Input.Search
                allowClear
                placeholder={t('admin.groups.search')}
                style={{ width: 340, maxWidth: '100%' }}
                value={searchKey}
                onChange={(event) => setSearchKey(event.target.value)}
                onSearch={(value) => {
                  setSearchKey(value);
                  fetchGroups(1, pagination.pageSize || 10, value, filter);
                }}
              />
              <Segmented
                value={filter}
                onChange={(value) => {
                  const nextValue = value as GroupFilterValue;
                  setFilter(nextValue);
                  fetchGroups(1, pagination.pageSize || 10, searchKey, nextValue);
                }}
                options={[
                  { label: t('admin.common.all'), value: 'all' },
                  { label: t('admin.common.active'), value: 'active' },
                  { label: t('admin.common.inactive'), value: 'inactive' },
                ]}
              />
            </Space>
          }
        >
          <Row gutter={[14, 14]} style={{ marginBottom: 18 }}>
            {[
              {
                title: t('admin.groups.statTotal'),
                value: overview?.totalGroups ?? count,
              },
              {
                title: t('admin.groups.statActive'),
                value:
                  overview?.activeGroups ??
                  groups.filter((group) => group.active).length,
              },
              {
                title: t('admin.groups.statStudents'),
                value:
                  overview?.totalStudentAssignments ??
                  groups.reduce((sum, group) => sum + group.studentCount, 0),
              },
              {
                title: t('admin.groups.statCourses'),
                value:
                  overview?.totalCourseAssignments ??
                  groups.reduce((sum, group) => sum + group.courseCount, 0),
              },
            ].map((item) => (
              <Col xs={24} sm={12} xl={6} key={item.title}>
                <div
                  style={{
                    borderRadius: 18,
                    border: `1px solid ${token.colorBorderSecondary}`,
                    background: token.colorBgContainer,
                    padding: 16,
                    minHeight: 96,
                    display: 'grid',
                    alignContent: 'space-between',
                  }}
                >
                  <Text style={{ color: token.colorTextSecondary }}>{item.title}</Text>
                  <Text strong style={{ fontSize: 28, color: token.colorText }}>
                    {item.value}
                  </Text>
                </div>
              </Col>
            ))}
          </Row>
          <Table
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={groups}
            pagination={{
              ...pagination,
              total: count,
            }}
            scroll={{ x: 1100 }}
            onChange={(nextPagination) =>
              fetchGroups(
                nextPagination.current || 1,
                nextPagination.pageSize || 10,
                searchKey,
                filter
              )
            }
          />
        </AdminSectionCard>
      </AdminPageFrame>

      <Modal
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText={editingGroup ? t('admin.common.save') : t('admin.common.create')}
        cancelText={t('admin.common.cancel')}
        confirmLoading={submitting}
        title={editingGroup ? t('admin.groups.editTitle') : t('admin.groups.createTitle')}
        styles={ADMIN_MODAL_STYLES}
      >
        <Form<GroupFormValues>
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={handleSaveGroup}
          initialValues={{ active: true }}
        >
          <Form.Item
            name="name"
            label={t('admin.groups.name')}
            rules={[{ required: true, message: t('admin.groups.nameRequired') }]}
          >
            <Input size="large" placeholder={t('admin.groups.namePh')} />
          </Form.Item>

          <Form.Item name="description" label={t('admin.groups.desc')}>
            <Input.TextArea
              rows={4}
              placeholder={t('admin.groups.descPh')}
            />
          </Form.Item>

          <Form.Item
            name="active"
            label={t('admin.groups.activeState')}
            valuePropName="checked"
            extra={
              <Paragraph style={{ margin: '6px 0 0', color: token.colorTextSecondary }}>
                {t('admin.groups.activeHint')}
              </Paragraph>
            }
          >
            <Switch checkedChildren={t('admin.common.active')} unCheckedChildren={t('admin.common.inactive')} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

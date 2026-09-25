import type { TablePaginationConfig } from 'antd';
import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { useEffect, useRef, useState } from 'react';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/api.ts';
import { useAppTranslation } from '../../hooks/useAppTranslation.ts';
import {
  ADMIN_MODAL_STYLES,
  AdminPageFrame,
  AdminSectionCard,
} from './adminUi.tsx';

const { Text } = Typography;

type Course = {
  id: string;
  titleuz: string;
  titleru: string;
  titleeng?: string;
  descriptionuz: string;
  descriptionru: string;
  descriptioneng?: string;
  instructor: string;
};

export const DashboardCoursesPage = () => {
  const { t } = useAppTranslation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [form] = Form.useForm();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = (page = 1, pageSize = 10, search = '') => {
    setLoading(true);
    const start = (page - 1) * pageSize;

    apiClient
      .get('/v1/course/list', {
        params: {
          start,
          limit: pageSize,
          searchKey: search,
        },
      })
      .then((res) => {
        const { list, count } = res?.data?.payload ?? {};
        setCourses(list || []);
        setPagination({
          current: page,
          pageSize,
          total: count || 0,
        });
      })
      .catch(() => {
        message.error(t('admin.courses.loadError'));
      })
      .finally(() => setLoading(false));
  };

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    fetchCourses(
      newPagination.current || 1,
      newPagination.pageSize || pagination.pageSize,
      searchTerm
    );
  };

  const showModal = (course?: Course) => {
    if (course) {
      setEditingCourse(course);
      form.setFieldsValue(course);
    } else {
      form.resetFields();
      setEditingCourse(null);
    }
    setModalVisible(true);
  };

  const handleModalOk = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    setSaving(true);
    try {
      const data = {
        ...values,
        id: editingCourse ? editingCourse.id : null,
      };

      const request = editingCourse
        ? apiClient.put(`/v1/course/update`, data)
        : apiClient.post('/v1/course/create', data);

      await request;
      message.success(
        editingCourse ? t('admin.courses.updated') : t('admin.courses.created')
      );
      setModalVisible(false);
      setEditingCourse(null);
      fetchCourses(pagination.current, pagination.pageSize, searchTerm);
    } catch {
      message.error(t('admin.common.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    apiClient
      .delete(`/v1/course/delete`, { params: { id } })
      .then(() => {
        message.success(t('admin.courses.deleted'));
        fetchCourses(pagination.current, pagination.pageSize, searchTerm);
      })
      .catch(() => {
        message.error(t('admin.common.deleteError'));
      });
  };

  const searchTimer = useRef<number>();

  const searchCourses = (value: string, immediate = false) => {
    setSearchTerm(value);
    window.clearTimeout(searchTimer.current);
    if (immediate) {
      fetchCourses(1, pagination.pageSize, value);
      return;
    }
    searchTimer.current = window.setTimeout(() => {
      fetchCourses(1, pagination.pageSize, value);
    }, 450);
  };

  const columns: ColumnsType<Course> = [
    {
      title: '№',
      render: (_text, _record, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
      width: 70,
      fixed: 'left',
    },
    {
      title: t('admin.courses.colCourse'),
      key: 'course',
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Text strong>{record.titleru}</Text>
          <Text style={{ color: '#64748b' }}>{record.titleuz}</Text>
        </Space>
      ),
      width: 260,
    },
    {
      title: t('admin.courses.colDesc'),
      key: 'description',
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Text ellipsis={{ tooltip: record.descriptionru }} style={{ maxWidth: 400 }}>
            {record.descriptionru}
          </Text>
          <Text
            ellipsis={{ tooltip: record.descriptionuz }}
            style={{ color: '#64748b', maxWidth: 400 }}
          >
            {record.descriptionuz}
          </Text>
        </Space>
      ),
      width: 420,
    },
    {
      title: t('admin.courses.colInstructor'),
      dataIndex: 'instructor',
      key: 'instructor',
      render: (value) => (
        <Tag
          style={{
            margin: 0,
            borderRadius: 999,
            padding: '6px 12px',
            background: '#eff6ff',
            color: '#1d4ed8',
            border: '1px solid rgba(29,78,216,0.12)',
          }}
        >
          {value}
        </Tag>
      ),
      width: 180,
    },
    {
      title: t('admin.common.actions'),
      key: 'actions',
      fixed: 'right',
      width: 220,
      render: (_, record) => (
        <Space wrap>
          <Tooltip title={t('admin.common.edit')}>
            <Button icon={<EditOutlined />} onClick={() => showModal(record)} />
          </Tooltip>
          <Tooltip title={t('admin.courses.topics')}>
            <Button
              icon={<ReadOutlined />}
              onClick={() => navigate(`/dashboards/topics?courseId=${record.id}`)}
            />
          </Tooltip>
          <Popconfirm
            title={t('admin.courses.deleteConfirm')}
            description={t('admin.courses.deleteHint')}
            onConfirm={() => handleDelete(record.id)}
            okText={t('admin.common.yesDelete')}
            cancelText={t('admin.common.no')}
            okButtonProps={{ danger: true }}
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
        <title>{t('admin.courses.pageTitle')}</title>
      </Helmet>

      <AdminPageFrame
        eyebrow={t('admin.courses.eyebrow')}
        title={t('admin.courses.title')}
        subtitle={t('admin.courses.subtitle')}
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => showModal()}
            style={{ borderRadius: 16, height: 46 }}
          >
            {t('admin.courses.new')}
          </Button>
        }
      >
        <AdminSectionCard
          title={t('admin.courses.listTitle')}
          extra={
            <Input.Search
              placeholder={t('admin.courses.search')}
              allowClear
              onSearch={(value) => searchCourses(value, true)}
              onChange={(e) => searchCourses(e.target.value)}
              style={{ width: 340, maxWidth: '100%' }}
            />
          }
        >
          <Table
            dataSource={courses}
            columns={columns}
            rowKey="id"
            scroll={{ x: 1100 }}
            pagination={{
              ...pagination,
              showTotal: (total) => t('admin.courses.total', { count: total }),
            }}
            loading={loading}
            onChange={handleTableChange}
          />
        </AdminSectionCard>

        <Modal
          open={modalVisible}
          centered
          width="min(780px, calc(100vw - 24px))"
          onCancel={() => {
            setModalVisible(false);
            setEditingCourse(null);
          }}
          onOk={handleModalOk}
          confirmLoading={saving}
          title={editingCourse ? t('admin.courses.editTitle') : t('admin.courses.createTitle')}
          okText={editingCourse ? t('admin.common.save') : t('admin.common.add')}
          cancelText={t('admin.common.cancel')}
          destroyOnClose
          styles={ADMIN_MODAL_STYLES}
        >
          <Form form={form} layout="vertical">
            <Form.Item
              label={t('admin.courses.titleRu')}
              name="titleru"
              rules={[{ required: true, message: t('admin.courses.titleRequired') }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label={t('admin.courses.titleUz')}
              name="titleuz"
              rules={[{ required: true, message: t('admin.courses.titleRequired') }]}
            >
              <Input />
            </Form.Item>
            <Form.Item label={t('admin.courses.titleEn')} name="titleeng">
              <Input placeholder={t('admin.courses.titleEnPh')} />
            </Form.Item>
            <Form.Item
              label={t('admin.courses.descRu')}
              name="descriptionru"
              rules={[{ required: true, message: t('admin.courses.descRequired') }]}
            >
              <Input.TextArea rows={3} />
            </Form.Item>
            <Form.Item
              label={t('admin.courses.descUz')}
              name="descriptionuz"
              rules={[{ required: true, message: t('admin.courses.descRequired') }]}
            >
              <Input.TextArea rows={3} />
            </Form.Item>
            <Form.Item label={t('admin.courses.descEn')} name="descriptioneng">
              <Input.TextArea rows={3} />
            </Form.Item>
            <Form.Item
              label={t('admin.courses.colInstructor')}
              name="instructor"
              rules={[{ required: true, message: t('admin.courses.instructorRequired') }]}
            >
              <Input />
            </Form.Item>
          </Form>
        </Modal>
      </AdminPageFrame>
    </div>
  );
};

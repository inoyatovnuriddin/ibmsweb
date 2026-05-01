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
import { useEffect, useState } from 'react';
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
  descriptionuz: string;
  descriptionru: string;
  instructor: string;
};

export const DashboardCoursesPage = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [form] = Form.useForm();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
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
        message.error('Kurslarni yuklashda xatolik yuz berdi');
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
    try {
      const values = await form.validateFields();
      const data = {
        ...values,
        id: editingCourse ? editingCourse.id : null,
      };

      const request = editingCourse
        ? apiClient.put(`/v1/course/update`, data)
        : apiClient.post('/v1/course/create', data);

      await request;
      message.success(
        editingCourse ? 'Kurs yangilandi' : 'Yangi kurs qo‘shildi'
      );
      setModalVisible(false);
      setEditingCourse(null);
      fetchCourses(pagination.current, pagination.pageSize, searchTerm);
    } catch {
      message.error('Saqlashda xatolik yuz berdi');
    }
  };

  const handleDelete = (id: string) => {
    if (
      window.confirm(
        'Kurs o‘chirilsa, unga tegishli mavzular va videolar ham o‘chishi mumkin. Davom etilsinmi?'
      )
    ) {
      apiClient
        .delete(`/v1/course/delete`, { params: { id } })
        .then(() => {
          message.success('Kurs o‘chirildi');
          fetchCourses(pagination.current, pagination.pageSize, searchTerm);
        })
        .catch(() => {
          message.error('O‘chirishda xatolik yuz berdi');
        });
    }
  };

  const searchCourses = (value: string) => {
    setSearchTerm(value);
    fetchCourses(1, pagination.pageSize, value);
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
      title: 'Kurs',
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
      title: 'Tavsif',
      key: 'description',
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Text>{record.descriptionru}</Text>
          <Text style={{ color: '#64748b' }}>{record.descriptionuz}</Text>
        </Space>
      ),
      width: 420,
    },
    {
      title: 'Instruktor',
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
      title: 'Amallar',
      key: 'actions',
      fixed: 'right',
      width: 220,
      render: (_, record) => (
        <Space wrap>
          <Tooltip title="Tahrirlash">
            <Button icon={<EditOutlined />} onClick={() => showModal(record)} />
          </Tooltip>
          <Tooltip title="Mavzular">
            <Button
              icon={<ReadOutlined />}
              onClick={() => navigate(`/dashboards/topics?courseId=${record.id}`)}
            />
          </Tooltip>
          <Popconfirm
            title="Kurs o‘chirilsinmi?"
            onConfirm={() => handleDelete(record.id)}
            okText="Ha"
            cancelText="Yo‘q"
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
        <title>Kurslar | Admin panel</title>
      </Helmet>

      <AdminPageFrame
        eyebrow="Kurslar moduli"
        title="Kurslar boshqaruvi"
        subtitle="Kurslar nomi, tavsifi va instruktor ma'lumotlarini shu bo‘limdan boshqaring."
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => showModal()}
            style={{ borderRadius: 16, height: 46 }}
          >
            Yangi kurs
          </Button>
        }
      >
        <AdminSectionCard
          title="Kurslar ro‘yxati"
          extra={
            <Input.Search
              placeholder="Kurs nomi yoki tavsifi bo‘yicha qidiring"
              allowClear
              onSearch={searchCourses}
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
            pagination={pagination}
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
          title={editingCourse ? 'Kursni tahrirlash' : 'Yangi kurs qo‘shish'}
          okText={editingCourse ? 'Saqlash' : 'Qo‘shish'}
          cancelText="Bekor qilish"
          destroyOnClose
          styles={ADMIN_MODAL_STYLES}
        >
          <Form form={form} layout="vertical">
            <Form.Item
              label="Kurs nomi rus tilida"
              name="titleru"
              rules={[{ required: true, message: 'Kurs nomini kiriting' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Kurs nomi o‘zbek tilida"
              name="titleuz"
              rules={[{ required: true, message: 'Kurs nomini kiriting' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Ruscha tavsif"
              name="descriptionru"
              rules={[{ required: true, message: 'Tavsifni kiriting' }]}
            >
              <Input.TextArea rows={3} />
            </Form.Item>
            <Form.Item
              label="O‘zbekcha tavsif"
              name="descriptionuz"
              rules={[{ required: true, message: 'Tavsifni kiriting' }]}
            >
              <Input.TextArea rows={3} />
            </Form.Item>
            <Form.Item
              label="Instruktor"
              name="instructor"
              rules={[{ required: true, message: 'Instruktorni kiriting' }]}
            >
              <Input />
            </Form.Item>
          </Form>
        </Modal>
      </AdminPageFrame>
    </div>
  );
};

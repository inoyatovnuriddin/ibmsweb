import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  Upload,
} from 'antd';
import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  FileOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  LeftOutlined,
  PlusOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { apiClient } from '../../services/api.ts';
import {
  ADMIN_MODAL_STYLES,
  AdminPageFrame,
  AdminSectionCard,
} from './adminUi.tsx';

const { Text } = Typography;

type Topic = {
  id: string;
  title: string;
  course: Course;
  files: FileItem[];
};

type FileItem = {
  id: string;
  url: string;
  objectName: string;
};

type Course = {
  id: string;
  titleuz: string;
  titleru: string;
  descriptionuz: string;
  descriptionru: string;
  instructor: string;
};

export const Topics = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const courseId = params.get('courseId');
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [form] = Form.useForm();

  useEffect(() => {
    if (courseId) {
      getCourseById(courseId);
      fetchTopicsByCourseId(courseId);
    } else {
      setCourse(null);
      fetchTopicsByCourseId(null);
    }
    fetchCourses('');
  }, [courseId]);

  const getCourseById = async (id: string | null) => {
    setLoading(true);
    try {
      const res = await apiClient.get('/v1/course/one', { params: { id } });
      setCourse(res.data?.payload);
    } catch {
      message.error('Tanlangan kurs topilmadi');
      navigate('/dashboards/courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchTopicsByCourseId = async (id: string | null, search = '') => {
    setLoading(true);
    try {
      const res = await apiClient.get('/v1/topic/list', {
        params: { courseId: id, searchKey: search },
      });
      setTopics(res.data?.payload?.list || []);
    } catch {
      message.error('Mavzularni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const searchTopics = (value: string) => {
    setSearchTerm(value);
    fetchTopicsByCourseId(courseId, value);
  };

  const fetchCourses = async (search: string) => {
    try {
      const res = await apiClient.get('/v1/course/list', {
        params: {
          limit: 10,
          searchKey: search,
        },
      });
      setCourses(res.data?.payload?.list || []);
    } catch {
      message.error('Kurslarni izlashda xatolik yuz berdi');
    }
  };

  const handleAdd = () => {
    form.resetFields();
    if (courseId) {
      form.setFieldValue('courseId', courseId);
    }
    setEditingTopic(null);
    setModalOpen(true);
  };

  const handleEdit = (record: Topic) => {
    form.setFieldsValue({
      title: record.title,
      courseId: record.course?.id,
    });
    setEditingTopic(record);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete('/v1/topic/delete', { params: { id } });
      message.success('Mavzu o‘chirildi');
      fetchTopicsByCourseId(courseId, searchTerm);
    } catch {
      message.error('O‘chirishda xatolik yuz berdi');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const { title, courseId: selectedCourseId, file } = values;

      const formData = new FormData();
      formData.append('title', title);
      formData.append('courseId', selectedCourseId);

      if (file) {
        const fileList = Array.isArray(file) ? file : [file];
        fileList.forEach(({ originFileObj }: { originFileObj?: File }) => {
          if (originFileObj) {
            formData.append('files', originFileObj);
          }
        });
      }

      if (editingTopic) {
        formData.append('id', editingTopic.id);
        await apiClient.put('/v1/topic/update', formData);
        message.success('Mavzu yangilandi');
      } else {
        await apiClient.post('/v1/topic/create', formData);
        message.success('Yangi mavzu yaratildi');
      }

      setModalOpen(false);
      fetchTopicsByCourseId(courseId, searchTerm);
    } catch {
      message.error('Saqlashda xatolik yuz berdi');
    }
  };

  const fileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return <FilePdfOutlined style={{ color: '#dc2626' }} />;
      case 'doc':
      case 'docx':
        return <FileWordOutlined style={{ color: '#2563eb' }} />;
      default:
        return <FileOutlined style={{ color: '#64748b' }} />;
    }
  };

  const columns: ColumnsType<Topic> = [
    {
      title: '№',
      render: (_text, _record, index) => index + 1,
      width: 70,
    },
    {
      title: 'Mavzu',
      key: 'title',
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Text strong style={{ color: '#102a43' }}>
            {record.title}
          </Text>
          <Text style={{ color: '#64748b' }}>
            {record.files?.length || 0} ta material biriktirilgan
          </Text>
        </Space>
      ),
      width: 260,
    },
    {
      title: 'Kurs',
      key: 'courseTitle',
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Text strong>{record.course?.titleru || '-'}</Text>
          <Text style={{ color: '#64748b' }}>{record.course?.titleuz || '-'}</Text>
        </Space>
      ),
      width: 230,
    },
    {
      title: 'Materiallar',
      dataIndex: 'files',
      key: 'files',
      render: (files: FileItem[]) =>
        files?.length ? (
          <Space direction="vertical" size={8}>
            {files.slice(0, 3).map((file) => (
              <Space key={file.id} size={8} align="center">
                {fileIcon(file.objectName)}
                <Tooltip title={file.objectName}>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    style={{
                      color: '#1d4ed8',
                      maxWidth: 240,
                      display: 'inline-block',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {file.objectName}
                  </a>
                </Tooltip>
                <Button
                  type="text"
                  size="small"
                  icon={<DownloadOutlined />}
                  href={file.url}
                  target="_blank"
                />
              </Space>
            ))}
            {files.length > 3 ? (
              <Text style={{ color: '#64748b' }}>
                Yana {files.length - 3} ta fayl mavjud
              </Text>
            ) : null}
          </Space>
        ) : (
          <Text style={{ color: '#94a3b8' }}>Material biriktirilmagan</Text>
        ),
    },
    {
      title: 'Amallar',
      key: 'actions',
      width: 190,
      fixed: 'right',
      render: (_: unknown, record: Topic) => (
        <Space wrap>
          <Tooltip title="Tahrirlash">
            <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Tooltip title="Videolar">
            <Button
              icon={<VideoCameraOutlined />}
              onClick={() => navigate(`/dashboards/videos?topicId=${record.id}`)}
            />
          </Tooltip>
          <Popconfirm
            title="Mavzu o‘chirilsinmi?"
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
        <title>Mavzular | Admin panel</title>
      </Helmet>

      <AdminPageFrame
        eyebrow="Mavzular moduli"
        title={course ? `${course.titleru} kursi mavzulari` : 'Mavzular boshqaruvi'}
        subtitle={
          course
            ? 'Tanlangan kurs uchun mavzular, materiallar va video bosqichlarini shu yerdan tartibga soling.'
            : 'Platformadagi barcha mavzularni kurslar kesimida boshqaring.'
        }
        actions={
          <Space wrap>
            {course ? (
              <>
                <Button
                  icon={<LeftOutlined />}
                  size="large"
                  onClick={() => navigate('/dashboards/courses')}
                  style={{ borderRadius: 16, height: 46 }}
                >
                  Kurslarga qaytish
                </Button>
                <Button
                  size="large"
                  onClick={() => navigate('/dashboards/topics')}
                  style={{ borderRadius: 16, height: 46 }}
                >
                  Barcha mavzular
                </Button>
              </>
            ) : null}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={handleAdd}
              style={{ borderRadius: 16, height: 46 }}
            >
              Yangi mavzu
            </Button>
          </Space>
        }
      >
        {course ? (
          <AdminSectionCard title="Tanlangan kurs">
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Text strong style={{ color: '#102a43' }}>
                {course.titleru}
              </Text>
              <Text style={{ color: '#64748b' }}>{course.descriptionru}</Text>
              <Tag
                style={{
                  width: 'fit-content',
                  margin: 0,
                  borderRadius: 999,
                  padding: '6px 12px',
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  border: '1px solid rgba(29,78,216,0.12)',
                }}
              >
                Instruktor: {course.instructor}
              </Tag>
            </Space>
          </AdminSectionCard>
        ) : null}

        <AdminSectionCard
          title="Mavzular ro‘yxati"
          extra={
            <Input.Search
              placeholder="Mavzu nomi bo‘yicha qidiring"
              allowClear
              value={searchTerm}
              onChange={(e) => searchTopics(e.target.value)}
              style={{ width: 340, maxWidth: '100%' }}
            />
          }
        >
          <Table
            columns={columns}
            dataSource={topics}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1120 }}
          />
        </AdminSectionCard>

        <Modal
          title={editingTopic ? 'Mavzuni tahrirlash' : 'Yangi mavzu qo‘shish'}
          open={modalOpen}
          onOk={handleModalOk}
          onCancel={() => setModalOpen(false)}
          destroyOnClose
          okText="Saqlash"
          cancelText="Bekor qilish"
          centered
          width="min(760px, calc(100vw - 24px))"
          styles={ADMIN_MODAL_STYLES}
        >
          <Form layout="vertical" form={form}>
            <Form.Item
              name="title"
              label="Mavzu nomi"
              rules={[{ required: true, message: 'Mavzu nomini kiriting' }]}
            >
              <Input placeholder="Masalan, 1-modul: Kirish" />
            </Form.Item>
            <Form.Item
              name="courseId"
              label="Kurs"
              rules={[{ required: true, message: 'Kursni tanlang' }]}
            >
              <Select
                showSearch
                placeholder="Kursni tanlang"
                filterOption={false}
                onSearch={fetchCourses}
                notFoundContent={loading ? 'Yuklanmoqda...' : 'Topilmadi'}
              >
                {courses.map((item) => (
                  <Select.Option key={item.id} value={item.id}>
                    {item.titleru}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="file"
              label="Material fayllari"
              valuePropName="fileList"
              getValueFromEvent={(e) => e?.fileList}
              extra="PDF yoki Word fayllarni biriktiring."
            >
              <Upload multiple maxCount={5} beforeUpload={() => false}>
                <Button>Fayl tanlash</Button>
              </Upload>
            </Form.Item>
          </Form>
        </Modal>
      </AdminPageFrame>
    </div>
  );
};

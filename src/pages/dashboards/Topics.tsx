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
  theme,
  Tooltip,
  Typography,
  Upload,
} from 'antd';
import { useSelector } from 'react-redux';
import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  FileOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FolderOpenOutlined,
  LeftOutlined,
  PaperClipOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  UndoOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Empty, Spin } from 'antd';
import { apiClient } from '../../services/api.ts';
import {
  ADMIN_MODAL_STYLES,
  AdminPageFrame,
  AdminSectionCard,
} from './adminUi.tsx';
import type { RootState } from '../../redux/store.ts';
import { useAppTranslation } from '../../hooks/useAppTranslation.ts';
import { VideoPlayerModal, type PlayerVideo } from './VideoPlayerModal.tsx';

const { Text } = Typography;

type Topic = {
  id: string;
  title: string;
  course: Course;
  files: FileItem[];
};

type TopicVideo = { id: string; title: string; link: string };

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
  const {
    token: { colorPrimary, colorText, colorTextSecondary, colorTextTertiary, colorBgElevated, colorBorderSecondary },
  } = theme.useToken();
  const { mytheme } = useSelector((state: RootState) => state.theme);
  const { t } = useAppTranslation();
  const isDark = mytheme === 'dark';
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

  // Existing materials the admin marked for removal while editing a topic.
  const [pendingRemove, setPendingRemove] = useState<string[]>([]);

  // Materials modal (clean, replaces the cramped inline files column).
  const [materialsTopic, setMaterialsTopic] = useState<Topic | null>(null);
  // Topic videos modal + inline player.
  const [videosTopic, setVideosTopic] = useState<Topic | null>(null);
  const [topicVideos, setTopicVideos] = useState<TopicVideo[]>([]);
  const [topicVideosLoading, setTopicVideosLoading] = useState(false);
  const [playing, setPlaying] = useState<PlayerVideo | null>(null);

  const openVideosModal = async (topic: Topic) => {
    setVideosTopic(topic);
    setTopicVideos([]);
    setTopicVideosLoading(true);
    try {
      const res = await apiClient.get('/v1/video', { params: { topicId: topic.id } });
      setTopicVideos(res.data?.payload?.list || []);
    } catch {
      setTopicVideos([]);
    } finally {
      setTopicVideosLoading(false);
    }
  };

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
      message.error(t('common.notFound'));
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
      message.error(t('courses.msg.loadError'));
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
      message.error(t('courses.msg.loadError'));
    }
  };

  const handleAdd = () => {
    form.resetFields();
    if (courseId) {
      form.setFieldValue('courseId', courseId);
    }
    setPendingRemove([]);
    setEditingTopic(null);
    setModalOpen(true);
  };

  const handleEdit = (record: Topic) => {
    form.setFieldsValue({
      title: record.title,
      courseId: record.course?.id,
      file: [],
    });
    setPendingRemove([]);
    setEditingTopic(record);
    setModalOpen(true);
  };

  const toggleRemoveMaterial = (fileId: string) => {
    setPendingRemove((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
    );
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete('/v1/topic/delete', { params: { id } });
      message.success(t('common.delete'));
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
        pendingRemove.forEach((id) => formData.append('removeFileIds', id));
        await apiClient.put('/v1/topic/update', formData);
        message.success(t('common.save'));
      } else {
        await apiClient.post('/v1/topic/create', formData);
        message.success(t('common.create'));
      }

      setPendingRemove([]);
      setModalOpen(false);
      fetchTopicsByCourseId(courseId, searchTerm);
      // Keep the open materials modal in sync if it points at the edited topic.
      setMaterialsTopic((prev) => (prev && prev.id === editingTopic?.id ? null : prev));
    } catch {
      message.error(t('profile.msg.saveError'));
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
        return <FileOutlined style={{ color: colorTextSecondary }} />;
    }
  };

  const columns: ColumnsType<Topic> = [
    {
      title: '№',
      render: (_text, _record, index) => index + 1,
      width: 70,
    },
    {
      title: t('dashboard.topics.column.topic'),
      key: 'title',
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Text strong style={{ color: colorText }}>
            {record.title}
          </Text>
          <Text style={{ color: colorTextSecondary }}>
            {record.files?.length || 0} {t('dashboard.topics.materialsAttached')}
          </Text>
        </Space>
      ),
      width: 260,
    },
    {
      title: t('dashboard.topics.field.course'),
      key: 'courseTitle',
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Text strong>{(record.course as { title?: string } | null)?.title || record.course?.titleru || record.course?.titleuz || '-'}</Text>
          <Text style={{ color: colorTextSecondary }}>{record.course?.titleuz || record.course?.titleru || '-'}</Text>
        </Space>
      ),
      width: 230,
    },
    {
      title: t('dashboard.topics.field.file'),
      dataIndex: 'files',
      key: 'files',
      width: 200,
      render: (files: FileItem[], record) =>
        files?.length ? (
          <Button
            onClick={() => setMaterialsTopic(record)}
            icon={<PaperClipOutlined />}
            style={{ borderRadius: 999, borderColor: colorBorderSecondary }}
          >
            {files.length} {t('dashboard.topics.materialsAttached')}
          </Button>
        ) : (
          <Text style={{ color: colorTextTertiary }}>{t('dashboard.topics.noMaterials')}</Text>
        ),
    },
    {
      title: t('dashboard.videos.column.actions'),
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_: unknown, record: Topic) => (
        <Space wrap>
          <Tooltip title={t('dashboard.topics.edit')}>
            <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Tooltip title={t('dashboard.topics.videos')}>
            <Button icon={<VideoCameraOutlined />} onClick={() => openVideosModal(record)} />
          </Tooltip>
          <Popconfirm
            title={t('dashboard.topics.deleteConfirm')}
            onConfirm={() => handleDelete(record.id)}
            okText={t('common.yes')}
            cancelText={t('common.no')}
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
        <title>{t('dashboard.topics.pageTitle')}</title>
      </Helmet>

      <AdminPageFrame
        eyebrow={t('dashboard.topics.eyebrow')}
        title={course ? `${(course as { title?: string }).title || course.titleru || course.titleuz} ${t('dashboard.topics.list')}` : t('dashboard.topics.title')}
        subtitle={
          course
            ? t('dashboard.topics.subtitleCourse')
            : t('dashboard.topics.subtitle')
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
                  {t('dashboard.topics.backCourses')}
                </Button>
                <Button
                  size="large"
                  onClick={() => navigate('/dashboards/topics')}
                  style={{ borderRadius: 16, height: 46 }}
                >
                  {t('dashboard.topics.all')}
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
              {t('dashboard.topics.add')}
            </Button>
          </Space>
        }
      >
        {course ? (
          <AdminSectionCard title={t('dashboard.topics.selectedCourse')}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Text strong style={{ color: colorText }}>
                {(course as { title?: string }).title || course.titleru || course.titleuz}
              </Text>
              <Text style={{ color: colorTextSecondary }}>{(course as { description?: string }).description || course.descriptionru || course.descriptionuz}</Text>
              <Tag
                style={{
                  width: 'fit-content',
                  margin: 0,
                  borderRadius: 999,
                  padding: '6px 12px',
                  background: isDark ? 'rgba(37,99,235,0.14)' : colorBgElevated,
                  color: colorPrimary,
                  border: `1px solid ${colorBorderSecondary}`,
                }}
              >
                {t('courses.card.instructor')} {course.instructor}
              </Tag>
            </Space>
          </AdminSectionCard>
        ) : null}

        <AdminSectionCard
          title={t('dashboard.topics.list')}
          extra={
            <Input.Search
              placeholder={t('dashboard.topics.search')}
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
          title={editingTopic ? t('dashboard.topics.modalEdit') : t('dashboard.topics.modalCreate')}
          open={modalOpen}
          onOk={handleModalOk}
          onCancel={() => setModalOpen(false)}
          destroyOnClose
          okText={t('common.save')}
          cancelText={t('common.cancel')}
          centered
          width="min(760px, calc(100vw - 24px))"
          styles={ADMIN_MODAL_STYLES}
        >
          <Form layout="vertical" form={form}>
            <Form.Item
              name="title"
              label={t('dashboard.topics.field.title')}
              rules={[{ required: true, message: t('dashboard.topics.field.titleRequired') }]}
            >
              <Input placeholder="Masalan, 1-modul: Kirish" />
            </Form.Item>
            <Form.Item
              name="courseId"
              label={t('dashboard.topics.field.course')}
              rules={[{ required: true, message: t('dashboard.topics.field.courseRequired') }]}
            >
              <Select
                showSearch
                placeholder={t('dashboard.topics.field.courseRequired')}
                filterOption={false}
                onSearch={fetchCourses}
                notFoundContent={loading ? t('common.loading') : t('dashboard.videos.notFound')}
              >
                {courses.map((item) => (
                  <Select.Option key={item.id} value={item.id}>
                    {(item as { title?: string }).title || item.titleru || item.titleuz}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            {editingTopic && (editingTopic.files?.length || 0) > 0 ? (
              <Form.Item label={t('dashboard.topics.currentMaterials')}>
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  {editingTopic.files.map((file) => {
                    const marked = pendingRemove.includes(file.id);
                    return (
                      <div
                        key={file.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '10px 12px',
                          borderRadius: 12,
                          border: `1px solid ${marked ? '#fca5a5' : colorBorderSecondary}`,
                          background: marked
                            ? isDark
                              ? 'rgba(220,38,38,0.12)'
                              : '#fef2f2'
                            : 'transparent',
                        }}
                      >
                        <span style={{ fontSize: 20 }}>{fileIcon(file.objectName)}</span>
                        <Text
                          style={{
                            flex: 1,
                            minWidth: 0,
                            color: marked ? colorTextTertiary : colorText,
                            wordBreak: 'break-all',
                            textDecoration: marked ? 'line-through' : 'none',
                          }}
                        >
                          {file.objectName}
                        </Text>
                        {marked ? (
                          <Button
                            size="small"
                            type="text"
                            icon={<UndoOutlined />}
                            onClick={() => toggleRemoveMaterial(file.id)}
                          >
                            {t('common.cancel')}
                          </Button>
                        ) : (
                          <>
                            <Tooltip title={t('dashboard.topics.download')}>
                              <Button
                                size="small"
                                type="text"
                                icon={<DownloadOutlined />}
                                href={file.url}
                                target="_blank"
                              />
                            </Tooltip>
                            <Tooltip title={t('dashboard.topics.removeMaterial')}>
                              <Button
                                size="small"
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => toggleRemoveMaterial(file.id)}
                              />
                            </Tooltip>
                          </>
                        )}
                      </div>
                    );
                  })}
                </Space>
              </Form.Item>
            ) : null}

            <Form.Item
              name="file"
              label={editingTopic ? t('dashboard.topics.addMaterials') : t('dashboard.topics.field.file')}
              valuePropName="fileList"
              getValueFromEvent={(e) => e?.fileList}
              extra={t('dashboard.topics.fileHelp')}
            >
              <Upload multiple maxCount={5} beforeUpload={() => false}>
                <Button>{t('dashboard.topics.chooseFile')}</Button>
              </Upload>
            </Form.Item>
          </Form>
        </Modal>

        {/* Materials modal — clean list of a topic's attached files */}
        <Modal
          title={
            <Space>
              <FolderOpenOutlined style={{ color: colorPrimary }} />
              {materialsTopic?.title}
            </Space>
          }
          open={!!materialsTopic}
          onCancel={() => setMaterialsTopic(null)}
          footer={null}
          centered
          width="min(620px, calc(100vw - 24px))"
          styles={ADMIN_MODAL_STYLES}
        >
          <Space direction="vertical" size={10} style={{ width: '100%' }}>
            {(materialsTopic?.files || []).map((file) => (
              <div
                key={file.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  borderRadius: 14,
                  border: `1px solid ${colorBorderSecondary}`,
                }}
              >
                <span style={{ fontSize: 22 }}>{fileIcon(file.objectName)}</span>
                <Text
                  style={{ flex: 1, minWidth: 0, color: colorText, wordBreak: 'break-all' }}
                >
                  {file.objectName}
                </Text>
                <Button
                  type="primary"
                  ghost
                  icon={<DownloadOutlined />}
                  href={file.url}
                  target="_blank"
                >
                  Yuklab olish
                </Button>
              </div>
            ))}
          </Space>
        </Modal>

        {/* Topic videos modal — play inline instead of navigating away */}
        <Modal
          title={
            <Space>
              <VideoCameraOutlined style={{ color: colorPrimary }} />
              {videosTopic?.title} — {t('dashboard.topics.videos')}
            </Space>
          }
          open={!!videosTopic}
          onCancel={() => setVideosTopic(null)}
          footer={
            <Button
              icon={<PlusOutlined />}
              onClick={() =>
                videosTopic && navigate(`/dashboards/videos?topicId=${videosTopic.id}`)
              }
            >
              {t('dashboard.videos.add')}
            </Button>
          }
          centered
          width="min(620px, calc(100vw - 24px))"
          styles={ADMIN_MODAL_STYLES}
        >
          {topicVideosLoading ? (
            <div style={{ minHeight: 120, display: 'grid', placeItems: 'center' }}>
              <Spin />
            </div>
          ) : topicVideos.length ? (
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              {topicVideos.map((video) => (
                <div
                  key={video.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    borderRadius: 14,
                    border: `1px solid ${colorBorderSecondary}`,
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setPlaying({
                        title: video.title,
                        link: video.link,
                        topicTitle: videosTopic?.title,
                      })
                    }
                    style={{
                      flex: '0 0 auto',
                      width: 64,
                      height: 40,
                      borderRadius: 10,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'grid',
                      placeItems: 'center',
                      color: '#fff',
                      background: 'linear-gradient(135deg, #1e293b 0%, #2563eb 100%)',
                    }}
                  >
                    <PlayCircleOutlined style={{ fontSize: 20 }} />
                  </button>
                  <Text style={{ flex: 1, minWidth: 0, color: colorText }}>{video.title}</Text>
                  <Button
                    type="primary"
                    ghost
                    icon={<PlayCircleOutlined />}
                    onClick={() =>
                      setPlaying({
                        title: video.title,
                        link: video.link,
                        topicTitle: videosTopic?.title,
                      })
                    }
                  >
                    {t('dashboard.videos.open')}
                  </Button>
                </div>
              ))}
            </Space>
          ) : (
            <Empty description={t('dashboard.topics.noMaterials')} />
          )}
        </Modal>

        <VideoPlayerModal video={playing} open={!!playing} onClose={() => setPlaying(null)} />
      </AdminPageFrame>
    </div>
  );
};

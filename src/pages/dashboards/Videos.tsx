import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  DeleteOutlined,
  EditOutlined,
  PlayCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  theme,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useSelector } from 'react-redux';
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

type TopicOption = { id: string; name: string; code: string };
type TopicObj = { id: string; title: string };
type VideoItem = { id: string; title: string; link: string; topic: TopicObj };

export const DashboardVideosPage = () => {
  const {
    token: { colorPrimary, colorText, colorTextSecondary, colorBgElevated, colorBorderSecondary },
  } = theme.useToken();
  const { mytheme } = useSelector((state: RootState) => state.theme);
  const { t } = useAppTranslation();
  const isDark = mytheme === 'dark';
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [topicOptions, setTopicOptions] = useState<TopicOption[]>([]);
  const [topicLoading, setTopicLoading] = useState(false);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loadingTable, setLoadingTable] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams] = useSearchParams();
  const defaultTopicId = searchParams.get('topicId') || undefined;
  const [playing, setPlaying] = useState<PlayerVideo | null>(null);

  const fetchTopicSuggestions = async (searchKey = '') => {
    setTopicLoading(true);
    try {
      const res = await apiClient.get('/v1/topic/suggestion', {
        params: { searchKey },
      });
      setTopicOptions(res.data?.payload || []);
    } finally {
      setTopicLoading(false);
    }
  };

  const fetchVideos = async () => {
    setLoadingTable(true);
    try {
      const res = await apiClient.get('/v1/video', {
        params: { topicId: defaultTopicId },
      });
      setVideos(res.data?.payload?.list || []);
    } finally {
      setLoadingTable(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [defaultTopicId]);

  useEffect(() => {
    if (open) {
      fetchTopicSuggestions('');
    }
  }, [open]);

  const openCreateModal = () => {
    form.resetFields();
    form.setFieldValue('topicId', defaultTopicId);
    setEditingVideo(null);
    setOpen(true);
  };

  const openEditModal = (video: VideoItem) => {
    setEditingVideo(video);
    form.setFieldsValue({
      title: video.title,
      topicId: video.topic.id,
      link: video.link,
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    await apiClient.delete(`/v1/video/${id}`);
    message.success(t('common.delete'));
    fetchVideos();
  };

  const handleFinish = async (values: {
    title: string;
    topicId: string;
    link: string;
  }) => {
    if (editingVideo) {
      await apiClient.put(`/v1/video/${editingVideo.id}`, {
        title: values.title,
        topicId: values.topicId,
        link: values.link,
      });
      message.success(t('common.save'));
    } else {
      await apiClient.post('/v1/video', {
        title: values.title,
        topicId: values.topicId,
        link: values.link,
      });
      message.success(t('common.add'));
    }
    form.resetFields();
    setEditingVideo(null);
    setOpen(false);
    fetchVideos();
  };

  const filteredVideos = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return videos;
    return videos.filter(
      (video) =>
        video.title.toLowerCase().includes(normalized) ||
        video.topic?.title?.toLowerCase().includes(normalized)
    );
  }, [videos, searchTerm]);

  const play = (record: VideoItem) =>
    setPlaying({ title: record.title, link: record.link, topicTitle: record.topic?.title });

  const columns: ColumnsType<VideoItem> = [
    {
      title: '№',
      render: (_t, _r, i) => i + 1,
      width: 60,
    },
    {
      title: t('dashboard.videos.column.video'),
      dataIndex: 'title',
      render: (value: string, record: VideoItem) => (
        <Space size={14} align="center">
          <button
            type="button"
            onClick={() => play(record)}
            title={t('dashboard.videos.open')}
            style={{
              flex: '0 0 auto',
              width: 88,
              height: 54,
              borderRadius: 12,
              border: 'none',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
              background:
                'linear-gradient(135deg, #1e293b 0%, #2563eb 100%)',
              boxShadow: '0 6px 16px -8px rgba(37,99,235,0.6)',
            }}
          >
            <PlayCircleOutlined style={{ fontSize: 24 }} />
          </button>
          <Space direction="vertical" size={2}>
            <Text strong style={{ color: colorText, cursor: 'pointer' }} onClick={() => play(record)}>
              {value}
            </Text>
            <Text style={{ color: colorTextSecondary, fontSize: 12 }}>{record.topic?.title}</Text>
          </Space>
        </Space>
      ),
    },
    {
      title: t('dashboard.videos.column.topic'),
      dataIndex: ['topic', 'title'],
      width: 220,
      render: (value: string) => (
        <Tag
          style={{
            margin: 0,
            borderRadius: 999,
            padding: '6px 12px',
            background: isDark ? 'rgba(37,99,235,0.14)' : colorBgElevated,
            color: colorPrimary,
            border: `1px solid ${colorBorderSecondary}`,
          }}
        >
          {value}
        </Tag>
      ),
    },
    {
      title: t('dashboard.videos.column.actions'),
      key: 'actions',
      width: 210,
      render: (_: unknown, record: VideoItem) => (
        <Space wrap>
          <Button type="primary" ghost icon={<PlayCircleOutlined />} onClick={() => play(record)}>
            {t('dashboard.videos.open')}
          </Button>
          <Button icon={<EditOutlined />} onClick={() => openEditModal(record)} />
          <Popconfirm
            title={t('dashboard.videos.deleteConfirm')}
            okText={t('common.yes')}
            cancelText={t('common.no')}
            onConfirm={() => handleDelete(record.id)}
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
        <title>{t('dashboard.videos.pageTitle')}</title>
      </Helmet>

      <AdminPageFrame
        eyebrow={t('dashboard.videos.eyebrow')}
        title={t('dashboard.videos.title')}
        subtitle={t('dashboard.videos.subtitle')}
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={openCreateModal}
            style={{ borderRadius: 16, height: 46 }}
          >
            {t('dashboard.videos.add')}
          </Button>
        }
      >
        <AdminSectionCard
          title={t('dashboard.videos.catalog')}
          extra={
            <Input.Search
              placeholder={t('dashboard.videos.search')}
              allowClear
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 340, maxWidth: '100%' }}
            />
          }
        >
          <Table
            columns={columns}
            dataSource={filteredVideos}
            rowKey="id"
            loading={loadingTable}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 980 }}
          />
        </AdminSectionCard>

        <Modal
          title={editingVideo ? t('dashboard.videos.modalEdit') : t('dashboard.videos.modalCreate')}
          open={open}
          onCancel={() => {
            form.resetFields();
            setEditingVideo(null);
            setOpen(false);
          }}
          onOk={() => form.submit()}
          okText={t('common.save')}
          cancelText={t('common.cancel')}
          destroyOnClose
          centered
          width="min(680px, calc(100vw - 24px))"
          styles={ADMIN_MODAL_STYLES}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFinish}
            initialValues={{ topicId: defaultTopicId }}
          >
            <Form.Item
              name="title"
              label={t('dashboard.videos.field.title')}
              rules={[{ required: true, message: t('dashboard.videos.field.titleRequired') }]}
            >
              <Input placeholder="Masalan, 1-dars: Kirish" />
            </Form.Item>

            <Form.Item
              name="topicId"
              label={t('dashboard.videos.column.topic')}
              rules={[{ required: true, message: t('dashboard.videos.field.topicRequired') }]}
            >
              <Select
                showSearch
                placeholder={t('dashboard.videos.field.topicPlaceholder')}
                filterOption={false}
                notFoundContent={topicLoading ? <Spin size="small" /> : t('dashboard.videos.notFound')}
                onSearch={(value) => fetchTopicSuggestions(value)}
                onFocus={() => !topicOptions.length && fetchTopicSuggestions('')}
                optionFilterProp="children"
              >
                {topicOptions.map((topic) => (
                  <Select.Option key={topic.id} value={topic.id}>
                    {topic.name} - {topic.code}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="link"
              label={t('dashboard.videos.field.link')}
              rules={[{ required: true, message: t('dashboard.videos.field.linkRequired') }]}
              extra={t('dashboard.videos.field.linkExtra')}
            >
              <Input placeholder="https://vimeo.com/..." />
            </Form.Item>
          </Form>
        </Modal>

        <VideoPlayerModal
          video={playing}
          open={!!playing}
          onClose={() => setPlaying(null)}
        />
      </AdminPageFrame>
    </div>
  );
};

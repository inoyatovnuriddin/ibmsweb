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
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { apiClient } from '../../services/api.ts';
import {
  ADMIN_MODAL_STYLES,
  AdminPageFrame,
  AdminSectionCard,
} from './adminUi.tsx';

const { Text } = Typography;

type TopicOption = { id: string; name: string; code: string };
type TopicObj = { id: string; title: string };
type VideoItem = { id: string; title: string; link: string; topic: TopicObj };

export const DashboardVideosPage = () => {
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
    message.success('Video o‘chirildi');
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
      message.success('Video yangilandi');
    } else {
      await apiClient.post('/v1/video', {
        title: values.title,
        topicId: values.topicId,
        link: values.link,
      });
      message.success('Video qo‘shildi');
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

  const columns: ColumnsType<VideoItem> = [
    {
      title: '№',
      render: (_t, _r, i) => i + 1,
      width: 70,
    },
    {
      title: 'Video',
      dataIndex: 'title',
      render: (value: string, record: VideoItem) => (
        <Space direction="vertical" size={2}>
          <Text strong style={{ color: '#102a43' }}>
            {value}
          </Text>
          <Text style={{ color: '#64748b' }}>{record.topic?.title}</Text>
        </Space>
      ),
      width: 320,
    },
    {
      title: 'Mavzu',
      dataIndex: ['topic', 'title'],
      render: (value: string) => (
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
      width: 220,
    },
    {
      title: 'Havola',
      dataIndex: 'link',
      render: (url: string) => (
        <a href={url} target="_blank" rel="noopener noreferrer">
          <PlayCircleOutlined /> Videoni ochish
        </a>
      ),
    },
    {
      title: 'Amallar',
      key: 'actions',
      width: 180,
      render: (_: unknown, record: VideoItem) => (
        <Space wrap>
          <Button icon={<EditOutlined />} onClick={() => openEditModal(record)} />
          <Popconfirm
            title="Video o‘chirilsinmi?"
            okText="Ha"
            cancelText="Yo‘q"
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
        <title>Videolar | Admin panel</title>
      </Helmet>

      <AdminPageFrame
        eyebrow="Videolar moduli"
        title="Dars videolari boshqaruvi"
        subtitle="Har bir mavzuga tegishli video darslarni yagona standart asosida boshqaring va tartibga soling."
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={openCreateModal}
            style={{ borderRadius: 16, height: 46 }}
          >
            Yangi video
          </Button>
        }
      >
        <AdminSectionCard
          title="Video katalogi"
          extra={
            <Input.Search
              placeholder="Video yoki mavzu nomi bo‘yicha qidiring"
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
          title={editingVideo ? 'Videoni tahrirlash' : 'Yangi video qo‘shish'}
          open={open}
          onCancel={() => {
            form.resetFields();
            setEditingVideo(null);
            setOpen(false);
          }}
          onOk={() => form.submit()}
          okText="Saqlash"
          cancelText="Bekor qilish"
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
              label="Video nomi"
              rules={[{ required: true, message: 'Video nomini kiriting' }]}
            >
              <Input placeholder="Masalan, 1-dars: Kirish" />
            </Form.Item>

            <Form.Item
              name="topicId"
              label="Mavzu"
              rules={[{ required: true, message: 'Mavzuni tanlang' }]}
            >
              <Select
                showSearch
                placeholder="Mavzuni tanlang"
                filterOption={false}
                notFoundContent={topicLoading ? <Spin size="small" /> : 'Topilmadi'}
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
              label="Video havolasi"
              rules={[{ required: true, message: 'Havolani kiriting' }]}
              extra="Hozircha Vimeo yoki boshqa tashqi video havolalari ishlatiladi."
            >
              <Input placeholder="https://vimeo.com/..." />
            </Form.Item>
          </Form>
        </Modal>
      </AdminPageFrame>
    </div>
  );
};

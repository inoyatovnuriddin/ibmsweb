import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  MinusCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  Button,
  Col,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Row,
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
import { getAdminTest, getTests } from './testsApi.ts';
import type { RootState } from '../../redux/store.ts';
import { useAppTranslation } from '../../hooks/useAppTranslation.ts';

const { Text } = Typography;

type TopicOption = { id: string; name: string; code: string };

interface QuestionItem {
  text: string;
  answers: string[];
  correctIndex: number;
}

interface TestItem {
  id: string;
  title: string;
  topicId: string;
  topicTitle: string;
  questionCount: number;
  passScore?: number;
  questions?: QuestionItem[];
}

const createEmptyQuestion = () => ({
  text: '',
  answers: ['', ''],
  correctIndex: undefined,
});

export const DashboardTestsPage = () => {
  const {
    token: {
      colorPrimary,
      colorSuccess,
      colorText,
      colorTextSecondary,
      colorBgElevated,
      colorFillTertiary,
      colorBorderSecondary,
    },
  } = theme.useToken();
  const { mytheme } = useSelector((state: RootState) => state.theme);
  const { t } = useAppTranslation();
  const isDark = mytheme === 'dark';
  const surfaceMuted = isDark ? 'rgba(148,163,184,0.10)' : colorFillTertiary;
  const surfaceCard = isDark ? 'rgba(255,255,255,0.04)' : colorBgElevated;
  const [tests, setTests] = useState<TestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const size = 10;

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TestItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [form] = Form.useForm();

  const [topicOptions, setTopicOptions] = useState<TopicOption[]>([]);
  const [topicLoading, setTopicLoading] = useState(false);

  const fetchTests = async (p = page) => {
    setLoading(true);
    try {
      const data = await getTests({ page: p, size });
      setTests(data.list || []);
      setTotal(data.count || 0);
      setPage(p);
    } catch {
      message.error(t('courses.msg.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const fetchTopicSuggestions = async (q = '') => {
    setTopicLoading(true);
    try {
      const res = await apiClient.get('/v1/topic/suggestion', {
        params: { searchKey: q },
      });
      setTopicOptions(res.data.payload || []);
    } finally {
      setTopicLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const saveTest = async (values: {
    title: string;
    topicId: string;
    questions?: QuestionItem[];
  }) => {
    const body = {
      title: values.title,
      topicId: values.topicId,
      questions: (values.questions || []).map((question) => ({
        text: question.text,
        answers: question.answers,
        correctIndex: question.correctIndex,
      })),
    };

    if (editing) {
      await apiClient.put(`/v1/test/${editing.id}`, body);
      message.success(t('common.save'));
    } else {
      await apiClient.post('/v1/test', body);
      message.success(t('common.add'));
    }
    setModalOpen(false);
    form.resetFields();
    setEditing(null);
    fetchTests();
  };

  const deleteTest = async (id: string) => {
    await apiClient.delete(`/v1/test/${id}`);
    message.success(t('common.delete'));
    const newPage = tests.length === 1 && page > 0 ? page - 1 : page;
    fetchTests(newPage);
  };

  const fetchQuestionsByTest = async (testId: string): Promise<QuestionItem[]> => {
    try {
      const res = await getAdminTest(testId);
      return res?.questions || [];
    } catch {
      message.error(t('course.learn.msg.questionsError'));
      return [];
    }
  };

  const filteredTests = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return tests;
    return tests.filter(
      (test) =>
        test.title.toLowerCase().includes(normalized) ||
        test.topicTitle.toLowerCase().includes(normalized)
    );
  }, [tests, searchTerm]);

  const columns: ColumnsType<TestItem> = [
    {
      title: '№',
      render: (_t, _r, i) => page * size + i + 1,
      width: 70,
    },
    {
      title: t('dashboard.tests.list'),
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Text strong style={{ color: colorText }}>
            {record.title}
          </Text>
          <Text style={{ color: colorTextSecondary }}>{record.topicTitle}</Text>
        </Space>
      ),
      width: 320,
    },
    {
      title: t('dashboard.tests.field.topic'),
      dataIndex: 'topicTitle',
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
      width: 220,
    },
    {
      title: t('dashboard.tests.questionCount'),
      dataIndex: 'questionCount',
      width: 150,
      render: (value: number) => (
        <Text strong style={{ color: colorSuccess }}>
          {value}
        </Text>
      ),
    },
    {
      title: t('dashboard.tests.passScore'),
      dataIndex: 'passScore',
      width: 130,
      render: (value?: number) => (
        <Text strong style={{ color: colorPrimary }}>
          {typeof value === 'number' ? `${value}%` : '—'}
        </Text>
      ),
    },
    {
      title: t('dashboard.videos.column.actions'),
      width: 160,
      render: (_: unknown, record) => (
        <Space wrap>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={async () => {
              const questions = await fetchQuestionsByTest(record.id);
              setEditing(record);
              form.setFieldsValue({
                title: record.title,
                topicId: record.topicId,
                questions: questions.map((question) => ({
                  text: question.text,
                  answers: question.answers,
                  correctIndex: question.correctIndex,
                })),
              });
              setModalOpen(true);
            }}
          />
          <Popconfirm
            title={t('dashboard.tests.deleteConfirm')}
            onConfirm={() => deleteTest(record.id)}
            okText={t('common.yes')}
            cancelText={t('common.no')}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Helmet>
        <title>{t('dashboard.tests.pageTitle')}</title>
      </Helmet>

      <AdminPageFrame
        eyebrow={t('dashboard.tests.eyebrow')}
        title={t('dashboard.tests.title')}
        subtitle={t('dashboard.tests.subtitle')}
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => {
              form.resetFields();
              form.setFieldsValue({
                questions: [createEmptyQuestion()],
              });
              setEditing(null);
              setModalOpen(true);
            }}
            style={{ borderRadius: 16, height: 46 }}
          >
            {t('dashboard.tests.add')}
          </Button>
        }
      >
        <AdminSectionCard
          title={t('dashboard.tests.list')}
          extra={
            <Input.Search
              placeholder={t('dashboard.tests.search')}
              allowClear
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 340, maxWidth: '100%' }}
            />
          }
        >
          <Table
            columns={columns}
            dataSource={filteredTests}
            rowKey="id"
            loading={loading}
            pagination={{
              current: page + 1,
              pageSize: size,
              total,
              showSizeChanger: false,
              onChange: (nextPage) => fetchTests(nextPage - 1),
            }}
            scroll={{ x: 920 }}
          />
        </AdminSectionCard>

        <Modal
          title={editing ? t('dashboard.tests.modalEdit') : t('dashboard.tests.modalCreate')}
          open={modalOpen}
          onCancel={() => {
            setModalOpen(false);
            form.resetFields();
            setEditing(null);
          }}
          onOk={() => form.submit()}
          okText={t('common.save')}
          cancelText={t('common.cancel')}
          centered
          width="min(920px, calc(100vw - 24px))"
          destroyOnClose
          styles={ADMIN_MODAL_STYLES}
        >
          <Form form={form} layout="vertical" onFinish={saveTest}>
            <div
              style={{
                marginBottom: 20,
                padding: 16,
                borderRadius: 18,
                background: surfaceMuted,
                border: `1px solid ${colorBorderSecondary}`,
              }}
            >
              <Space direction="vertical" size={4}>
                <Text style={{ color: colorTextSecondary }}>{t('dashboard.tests.configTitle')}</Text>
                <Text strong style={{ color: colorText }}>
                  {t('dashboard.tests.configDescription')}
                </Text>
              </Space>
            </div>

            <Row gutter={[16, 0]}>
              <Col xs={24} lg={12}>
                <Form.Item
                  name="title"
                  label={t('dashboard.tests.field.title')}
                  rules={[{ required: true, message: t('dashboard.tests.field.titleRequired') }]}
                >
                  <Input
                    placeholder="Masalan, 1-modul yakuniy testi"
                    size="large"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} lg={12}>
                <Form.Item
                  name="topicId"
                  label={t('dashboard.tests.field.topic')}
                  rules={[{ required: true, message: t('dashboard.tests.field.topicRequired') }]}
                >
                  <Select
                    showSearch
                    size="large"
                    placeholder={t('dashboard.videos.field.topicPlaceholder')}
                    filterOption={false}
                    notFoundContent={topicLoading ? <Spin size="small" /> : t('dashboard.videos.notFound')}
                    onSearch={fetchTopicSuggestions}
                    onFocus={() => !topicOptions.length && fetchTopicSuggestions('')}
                  >
                    {topicOptions.map((topic) => (
                      <Select.Option key={topic.id} value={topic.id}>
                        {topic.name} - {topic.code}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.List name="questions">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => {
                    const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

                    return (
                      <div
                        key={key}
                        style={{
                          border: `1px solid ${colorBorderSecondary}`,
                          borderRadius: 22,
                          padding: 18,
                          marginBottom: 18,
                          background: surfaceMuted,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: 12,
                            alignItems: 'center',
                            marginBottom: 12,
                            flexWrap: 'wrap',
                          }}
                        >
                          <Space direction="vertical" size={2}>
                            <Text style={{ color: colorTextSecondary }}>
                              {t('dashboard.tests.questionBlock')} #{name + 1}
                            </Text>
                            <Text strong style={{ color: colorText }}>
                              {t('dashboard.tests.questionVariantTitle')}
                            </Text>
                          </Space>
                          <Button type="link" danger onClick={() => remove(name)}>
                            {t('dashboard.tests.questionDelete')}
                          </Button>
                        </div>

                        <Form.Item
                          {...restField}
                          name={[name, 'text']}
                          label={t('dashboard.tests.questionText')}
                          rules={[
                            { required: true, message: t('dashboard.tests.questionTextRequired') },
                          ]}
                        >
                          <Input.TextArea
                            rows={3}
                            placeholder="Savol matnini to‘liq va aniq kiriting"
                          />
                        </Form.Item>

                        <Form.List name={[name, 'answers']}>
                          {(answerFields, { add: addAnswer, remove: removeAnswer }) => (
                            <>
                              <Text
                                style={{
                                  display: 'block',
                                  marginBottom: 10,
                                  color: colorTextSecondary,
                                }}
                              >
                                {t('dashboard.tests.answers')}
                              </Text>
                              {answerFields.map(
                                ({
                                  key: answerKey,
                                  name: answerName,
                                  ...answerRestField
                                }) => (
                                  <div
                                    key={answerKey}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 10,
                                      marginBottom: 10,
                                      padding: 12,
                                      borderRadius: 16,
                                      background: surfaceCard,
                                      border: `1px solid ${colorBorderSecondary}`,
                                    }}
                                  >
                                    <div
                                      style={{
                                        minWidth: 32,
                                        height: 32,
                                        borderRadius: 10,
                                        background: surfaceMuted,
                                        color: colorPrimary,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 700,
                                      }}
                                    >
                                      {labels[answerName]}
                                    </div>
                                    <Form.Item
                                      {...answerRestField}
                                      name={answerName}
                                      style={{ flex: 1, marginBottom: 0 }}
                                      rules={[
                                        {
                                          required: true,
                                          message: t('dashboard.tests.answerRequired'),
                                        },
                                      ]}
                                    >
                                      <Input
                                        placeholder={`Variant ${labels[answerName]}`}
                                        size="large"
                                      />
                                    </Form.Item>
                                    {answerFields.length > 2 ? (
                                      <MinusCircleOutlined
                                        onClick={() => removeAnswer(answerName)}
                                        style={{ color: '#dc2626' }}
                                      />
                                    ) : null}
                                  </div>
                                )
                              )}

                              <Form.Item>
                                <Button
                                  type="dashed"
                                  onClick={() => addAnswer()}
                                  icon={<PlusOutlined />}
                                  disabled={answerFields.length >= 5}
                                  style={{ borderRadius: 14, height: 42 }}
                                >
                                  {t('dashboard.tests.answerAdd')}
                                </Button>
                                {answerFields.length >= 5 ? (
                                  <Text style={{ marginLeft: 8, color: colorTextSecondary }}>
                                    {t('dashboard.tests.answerMax')}
                                  </Text>
                                ) : null}
                              </Form.Item>
                            </>
                          )}
                        </Form.List>

                        <Form.Item
                          label={t('dashboard.tests.correctAnswer')}
                          required
                          shouldUpdate={(prev, current) =>
                            prev.questions?.[name]?.answers !==
                            current.questions?.[name]?.answers
                          }
                        >
                          {() => {
                            const answers: string[] =
                              form.getFieldValue(['questions', name, 'answers']) || [];

                            return (
                              <Form.Item
                                {...restField}
                                name={[name, 'correctIndex']}
                                noStyle
                                rules={[
                                  {
                                    required: true,
                                    message: t('dashboard.tests.correctAnswerRequired'),
                                  },
                                ]}
                              >
                                <Select
                                  placeholder="To‘g‘ri javobni tanlang"
                                  disabled={!answers.length}
                                  size="large"
                                  style={{ width: '100%' }}
                                >
                                  {answers.map((answer, idx) => (
                                    <Select.Option key={idx} value={idx}>
                                      <Space>
                                        <CheckCircleOutlined style={{ color: '#16a34a' }} />
                                        {labels[idx]}: {answer || t('common.notProvided')}
                                      </Space>
                                    </Select.Option>
                                  ))}
                                </Select>
                              </Form.Item>
                            );
                          }}
                        </Form.Item>
                      </div>
                    );
                  })}

                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add(createEmptyQuestion())}
                      block
                      icon={<PlusOutlined />}
                      style={{ borderRadius: 16, height: 46 }}
                    >
                      {t('dashboard.tests.questionAdd')}
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Form>
        </Modal>
      </AdminPageFrame>
    </div>
  );
};

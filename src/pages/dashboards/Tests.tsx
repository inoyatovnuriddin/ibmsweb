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
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { apiClient } from '../../services/api.ts';
import {
  ADMIN_MODAL_STYLES,
  AdminPageFrame,
  AdminSectionCard,
} from './adminUi.tsx';
import { getAdminTest, getTests } from './testsApi.ts';

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
      message.error('Testlar ro‘yxatini yuklashda xatolik yuz berdi.');
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
      message.success('Test yangilandi');
    } else {
      await apiClient.post('/v1/test', body);
      message.success('Yangi test qo‘shildi');
    }
    setModalOpen(false);
    form.resetFields();
    setEditing(null);
    fetchTests();
  };

  const deleteTest = async (id: string) => {
    await apiClient.delete(`/v1/test/${id}`);
    message.success('Test o‘chirildi');
    const newPage = tests.length === 1 && page > 0 ? page - 1 : page;
    fetchTests(newPage);
  };

  const fetchQuestionsByTest = async (testId: string): Promise<QuestionItem[]> => {
    try {
      const res = await getAdminTest(testId);
      return res?.questions || [];
    } catch {
      message.error('Savollarni yuklashda xatolik yuz berdi');
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
      title: 'Test',
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Text strong style={{ color: '#102a43' }}>
            {record.title}
          </Text>
          <Text style={{ color: '#64748b' }}>{record.topicTitle}</Text>
        </Space>
      ),
      width: 320,
    },
    {
      title: 'Mavzu',
      dataIndex: 'topicTitle',
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
      title: 'Savollar soni',
      dataIndex: 'questionCount',
      width: 150,
      render: (value: number) => (
        <Text strong style={{ color: '#0f766e' }}>
          {value}
        </Text>
      ),
    },
    {
      title: 'O‘tish bali',
      dataIndex: 'passScore',
      width: 130,
      render: (value?: number) => (
        <Text strong style={{ color: '#1d4ed8' }}>
          {typeof value === 'number' ? `${value}%` : '—'}
        </Text>
      ),
    },
    {
      title: 'Amallar',
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
            title="Test o‘chirilsinmi?"
            onConfirm={() => deleteTest(record.id)}
            okText="Ha"
            cancelText="Yo‘q"
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
        <title>Testlar | Admin panel</title>
      </Helmet>

      <AdminPageFrame
        eyebrow="Testlar moduli"
        title="Testlar va savollar boshqaruvi"
        subtitle="Mavzu yakunidagi testlarni, savollar tuzilmasini va to‘g‘ri javob variantlarini professional tarzda boshqaring."
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
            Yangi test
          </Button>
        }
      >
        <AdminSectionCard
          title="Testlar ro‘yxati"
          extra={
            <Input.Search
              placeholder="Test yoki mavzu nomi bo‘yicha qidiring"
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
          title={editing ? 'Testni tahrirlash' : 'Yangi test qo‘shish'}
          open={modalOpen}
          onCancel={() => {
            setModalOpen(false);
            form.resetFields();
            setEditing(null);
          }}
          onOk={() => form.submit()}
          okText="Saqlash"
          cancelText="Bekor qilish"
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
                background: '#f8fafc',
                border: '1px solid rgba(148,163,184,0.12)',
              }}
            >
              <Space direction="vertical" size={4}>
                <Text style={{ color: '#64748b' }}>Test konfiguratsiyasi</Text>
                <Text strong style={{ color: '#102a43' }}>
                  Avval test nomi va tegishli mavzuni tanlang, keyin savollarni bloklar
                  ko‘rinishida to‘ldiring.
                </Text>
              </Space>
            </div>

            <Row gutter={[16, 0]}>
              <Col xs={24} lg={12}>
                <Form.Item
                  name="title"
                  label="Test nomi"
                  rules={[{ required: true, message: 'Test nomini kiriting' }]}
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
                  label="Mavzu"
                  rules={[{ required: true, message: 'Mavzuni tanlang' }]}
                >
                  <Select
                    showSearch
                    size="large"
                    placeholder="Mavzuni tanlang"
                    filterOption={false}
                    notFoundContent={topicLoading ? <Spin size="small" /> : 'Topilmadi'}
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
                          border: '1px solid rgba(148,163,184,0.16)',
                          borderRadius: 22,
                          padding: 18,
                          marginBottom: 18,
                          background: '#fbfdff',
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
                            <Text style={{ color: '#64748b' }}>
                              Savol bloki #{name + 1}
                            </Text>
                            <Text strong style={{ color: '#102a43' }}>
                              Savol va variantlar
                            </Text>
                          </Space>
                          <Button type="link" danger onClick={() => remove(name)}>
                            Savolni o‘chirish
                          </Button>
                        </div>

                        <Form.Item
                          {...restField}
                          name={[name, 'text']}
                          label="Savol matni"
                          rules={[
                            { required: true, message: 'Savol matnini kiriting' },
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
                                  color: '#64748b',
                                }}
                              >
                                Javob variantlari
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
                                      background: '#fff',
                                      border: '1px solid rgba(148,163,184,0.12)',
                                    }}
                                  >
                                    <div
                                      style={{
                                        minWidth: 32,
                                        height: 32,
                                        borderRadius: 10,
                                        background: '#eff6ff',
                                        color: '#1d4ed8',
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
                                          message: 'Javob variantini kiriting',
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
                                  Javob qo‘shish
                                </Button>
                                {answerFields.length >= 5 ? (
                                  <Text style={{ marginLeft: 8, color: '#64748b' }}>
                                    Eng ko‘pi 5 ta variant
                                  </Text>
                                ) : null}
                              </Form.Item>
                            </>
                          )}
                        </Form.List>

                        <Form.Item
                          label="To‘g‘ri javob"
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
                                    message: 'To‘g‘ri javobni tanlang',
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
                                        {labels[idx]}: {answer || '<bo‘sh>'}
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
                      Yangi savol qo‘shish
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

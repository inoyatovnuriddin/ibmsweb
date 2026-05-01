import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  message,
  Modal,
  Row,
  Select,
  Spin,
  Typography,
} from 'antd';
import { debounce } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode.react';
import { Dayjs } from 'dayjs';
import { apiClient } from '../../../services/api';

const { RangePicker } = DatePicker;
const { Title, Paragraph } = Typography;

interface User {
  id: string;
  phoneNumber?: string;
  firstname: string;
  lastname: string;
  middlename?: string;
}

interface Course {
  id: string;
  titleru?: string;
  titleuz?: string;
}

interface StudyPeriod {
  start: string;
  end: string;
}

interface DiplomaResponse {
  id: string;
  diplomaNumber: string;
  user: User;
  course: Course;
  rank: number;
  protocolNumber: string;
  protocolDate: string;
  issueDate: string;
  master?: string | null;
  director?: string | null;
  studyPeriod: StudyPeriod;
}

interface DiplomaFormValues {
  diplomaNumber: string;
  userId: string;
  studyPeriod: [Dayjs, Dayjs];
  courseId: string;
  rank: number;
  protocolNumber: string;
  protocolDate: Dayjs;
  issueDate: Dayjs;
  master?: string;
  director?: string;
}

interface ListPayload<T> {
  list: T[];
  count: number;
}

interface ApiWrapper<T> {
  payload?: T;
  errors?: { message?: string };
  message?: string;
}

const getErrorMessage = (err: unknown) => {
  const normalized = err as {
    response?: { data?: { errors?: { message?: string }; message?: string } };
    message?: string;
  };

  return (
    normalized?.response?.data?.errors?.message ||
    normalized?.response?.data?.message ||
    normalized?.message ||
    'Хатолик юз берди'
  );
};

const parseFilename = (contentDisposition?: string): string | null => {
  if (!contentDisposition) return null;

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }

  const fallbackMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
  return fallbackMatch?.[1] || null;
};

const sanitizeFilename = (name: string) => name.replace(/[\\/:*?"<>|]/g, '_').trim();

const buildFallbackDocxName = (user?: User) => {
  const raw = `${user?.firstname || ''}${user?.lastname || ''}${user?.middlename || ''}`;
  const safe = sanitizeFilename(raw);
  return safe ? `${safe}.docx` : 'diploma.docx';
};

export default function DiplomaTemplateForm() {
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [userLoading, setUserLoading] = useState(false);
  const [courseLoading, setCourseLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [diplomaData, setDiplomaData] = useState<DiplomaResponse | null>(null);
  const [form] = Form.useForm<DiplomaFormValues>();

  const getCourseLabel = (course: Course) => course.titleru || course.titleuz || course.id;

  const buildPayload = (values: DiplomaFormValues) => ({
    diplomaNumber: values.diplomaNumber.trim(),
    userId: values.userId,
    studyPeriod: {
      start: values.studyPeriod[0].format('YYYY-MM-DD'),
      end: values.studyPeriod[1].format('YYYY-MM-DD'),
    },
    courseId: values.courseId,
    rank: values.rank,
    protocolNumber: values.protocolNumber.trim(),
    protocolDate: values.protocolDate.format('YYYY-MM-DD'),
    issueDate: values.issueDate.format('YYYY-MM-DD'),
    master: values.master?.trim() || null,
    director: values.director?.trim() || null,
  });

  const loadUsers = useCallback(async (searchKey = '') => {
    setUserLoading(true);
    try {
      const res = await apiClient.get<ApiWrapper<ListPayload<User>>>('/v1/users/list', {
        params: { start: 0, limit: 20, searchKey },
      });
      setUsers(res.data?.payload?.list || []);
    } catch (err) {
      message.error(getErrorMessage(err));
    } finally {
      setUserLoading(false);
    }
  }, []);

  const loadCourses = useCallback(async (searchKey = '') => {
    setCourseLoading(true);
    try {
      const res = await apiClient.get<ApiWrapper<ListPayload<Course>>>('/v1/course/list', {
        params: { start: 0, limit: 20, searchKey },
      });
      setCourses(res.data?.payload?.list || []);
    } catch (err) {
      message.error(getErrorMessage(err));
    } finally {
      setCourseLoading(false);
    }
  }, []);

  const debouncedUsers = useMemo(() => debounce((value: string) => loadUsers(value), 350), [loadUsers]);
  const debouncedCourses = useMemo(() => debounce((value: string) => loadCourses(value), 350), [loadCourses]);

  useEffect(() => {
    loadUsers('');
    loadCourses('');
  }, [loadUsers, loadCourses]);

  useEffect(() => {
    return () => {
      debouncedUsers.cancel();
      debouncedCourses.cancel();
    };
  }, [debouncedUsers, debouncedCourses]);

  const fetchDiplomaById = async (id: string) => {
    const res = await apiClient.get<ApiWrapper<DiplomaResponse>>(`/v1/diploma/${id}`);
    return res.data?.payload || null;
  };

  const onSaveOnly = async (values: DiplomaFormValues) => {
    try {
      setSubmitting(true);
      const payload = buildPayload(values);

      const res = await apiClient.post<ApiWrapper<DiplomaResponse>>('/v1/diploma/create', payload);
      const saved = res.data?.payload || null;

      if (saved) {
        setDiplomaData(saved);
        setQrModalVisible(true);
      }

      form.resetFields();
      message.success('Диплом муваффақиятли сақланди');
    } catch (err) {
      message.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const onSaveAndDownload = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const payload = buildPayload(values);
      const selectedUser = users.find((user) => user.id === payload.userId);
      const fallbackFileName = buildFallbackDocxName(selectedUser);

      const res = await apiClient.post('/v1/diploma/create-and-download', payload, {
        responseType: 'blob',
      });

      const contentDispositionHeader = res.headers?.['content-disposition'];
      const contentTypeHeader = res.headers?.['content-type'];
      const filename =
        parseFilename(
          typeof contentDispositionHeader === 'string' ? contentDispositionHeader : undefined
        ) || fallbackFileName;
      const blob = new Blob([res.data], {
        type:
          (typeof contentTypeHeader === 'string' ? contentTypeHeader : undefined) ||
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      const diplomaId = res.headers?.['x-diploma-id'];
      if (diplomaId) {
        const diploma = await fetchDiplomaById(diplomaId);
        if (diploma) {
          setDiplomaData(diploma);
          setQrModalVisible(true);
        }
      }

      form.resetFields();
      message.success('Диплом сақланди ва Word файл юкланди');
    } catch (err) {
      message.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const downloadQR = () => {
    if (!diplomaData) return;

    const canvas = document.getElementById('diploma-qr') as HTMLCanvasElement | null;
    if (!canvas) return;

    const pngUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = pngUrl;
    link.download = `${diplomaData.user.firstname}_${diplomaData.user.lastname}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Card title="Диплом маълумотларини киритинг" className="max-w-4xl mx-auto mt-6">
        <Form<DiplomaFormValues> layout="vertical" form={form} onFinish={onSaveOnly}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Диплом рақами"
                name="diplomaNumber"
                rules={[{ required: true, message: 'Диплом рақамини киритинг!' }]}
              >
                <Input placeholder="Масалан: 5190" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Фойдаланувчи"
                name="userId"
                rules={[{ required: true, message: 'Фойдаланувчини танланг!' }]}
              >
                <Select
                  showSearch
                  placeholder="Фойдаланувчини tanlang"
                  optionFilterProp="label"
                  filterOption={false}
                  onSearch={debouncedUsers}
                  onFocus={() => {
                    if (!users.length) loadUsers('');
                  }}
                  notFoundContent={userLoading ? <Spin size="small" /> : null}
                  options={users.map((user) => ({
                    value: user.id,
                    label: `${user.firstname} ${user.lastname}${user.middlename ? ` ${user.middlename}` : ''}${
                      user.phoneNumber ? ` (${user.phoneNumber})` : ''
                    }`,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Ўқиш даври"
            name="studyPeriod"
            rules={[{ required: true, message: 'Ўқиш даврини танланг!' }]}
          >
            <RangePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="Курс / Мутахассислик"
                name="courseId"
                rules={[{ required: true, message: 'Курсни танланг!' }]}
              >
                <Select
                  showSearch
                  placeholder="Курсни танланг"
                  optionFilterProp="label"
                  filterOption={false}
                  onSearch={debouncedCourses}
                  onFocus={() => {
                    if (!courses.length) loadCourses('');
                  }}
                  notFoundContent={courseLoading ? <Spin size="small" /> : null}
                  options={courses.map((course) => ({
                    value: course.id,
                    label: getCourseLabel(course),
                  }))}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="Разряд" name="rank" rules={[{ required: true, message: 'Разрядни танланг!' }]}>
                <Select
                  placeholder="Разрядни танланг"
                  options={[1, 2, 3, 4, 5, 6].map((rank) => ({
                    value: rank,
                    label: `${rank} разряд`,
                  }))}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Диплом берилган сана"
                name="issueDate"
                rules={[{ required: true, message: 'Санани танланг!' }]}
              >
                <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Протокол рақами"
                name="protocolNumber"
                rules={[{ required: true, message: 'Протокол рақамини киритинг!' }]}
              >
                <Input placeholder="Масалан: 427" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Протокол санаси"
                name="protocolDate"
                rules={[{ required: true, message: 'Протокол санасини танланг!' }]}
              >
                <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Мастер" name="master">
                <Input placeholder="Масалан: Жўраев А." />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="Директор" name="director">
                <Input placeholder="Масалан: Каримов Б." />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Button type="default" htmlType="submit" block loading={submitting}>
                Фақат сақлаш
              </Button>
            </Col>
            <Col span={12}>
              <Button type="primary" block loading={submitting} onClick={onSaveAndDownload}>
                Сақлаш ва Word юклаб олиш
              </Button>
            </Col>
          </Row>
        </Form>
      </Card>

      <Modal
        title="QR-код диплома"
        open={qrModalVisible}
        onCancel={() => setQrModalVisible(false)}
        footer={[
          <Button key="download" type="primary" onClick={downloadQR}>
            Скачать QR
          </Button>,
          <Button key="close" onClick={() => setQrModalVisible(false)}>
            Закрыть
          </Button>,
        ]}
      >
        {diplomaData && (
          <div style={{ textAlign: 'center' }}>
            <QRCode id="diploma-qr" value={`https://ibms.uz/diploma/${diplomaData.id}/qr`} size={200} />
            <Title level={4} style={{ marginTop: 16 }}>
              Диплом №{diplomaData.diplomaNumber}
            </Title>
            <Paragraph>
              {diplomaData.user.firstname} {diplomaData.user.lastname} {diplomaData.user.middlename || ''}
            </Paragraph>
            <Paragraph>{getCourseLabel(diplomaData.course)}</Paragraph>
          </div>
        )}
      </Modal>
    </>
  );
}

import {
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Row,
  Select,
  Spin,
} from 'antd';
import { debounce } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Dayjs } from 'dayjs';
import { apiClient } from '../../../services/api';
import { CertificateRequest, getCertificateErrorMessage } from '../certificatesApi';
import { CertificateActions, useCertificateActions } from './certificateActions';

const { RangePicker } = DatePicker;

// Backend template code = file name without extension: resources/templates/template9.docx.
const TEMPLATE_CODE = 'template9';
// The docx already wraps the value: НОУ «${ORG_NAME}», so pass the bare name.
const ORGANIZATIONS = ['Inter Biznes Mega Servis', 'Buxoro O‘quv'];
const STUDY_FORMS = ['очная', 'заочная'];
const MARKS = ['три', 'четыре', 'пять'];

interface User {
  id: string;
  phoneNumber?: string;
  firstname: string;
  lastname: string;
  middlename?: string;
  userImage?: string | null;
}

interface Course {
  id: string;
  titleru?: string;
  titleuz?: string;
}

interface ListPayload<T> {
  list: T[];
  count: number;
}

interface ApiWrapper<T> {
  payload?: T;
}

interface RazryadFormValues {
  regNo: string;
  userId: string;
  courseId: string;
  organizationName: string;
  studyForm: string;
  grade: number;
  protocolNumber: string;
  commissionDate: Dayjs;
  trainingPeriod: [Dayjs, Dayjs];
  hoursTheory: number;
  hoursPractice: number;
  markTheory: string;
  markPractice: string;
  issueDate: Dayjs;
  chairman: string;
  inspector: string;
  ceo: string;
}

const getUserLabel = (user: User) =>
  `${user.firstname} ${user.lastname}${user.middlename ? ` ${user.middlename}` : ''}${
    user.phoneNumber ? ` (${user.phoneNumber})` : ''
  }`;

const getCourseLabel = (course: Course) => course.titleru || course.titleuz || course.id;

/**
 * "Udostoverenie (razryad)" — тарифно-квалификационный разряд удостоверения (template9.docx).
 * Свидетельство formasiga oʻxshaydi, lekin разряд hamda sanoat xavfsizligi
 * inspektorining imzosi bilan.
 */
export default function RazryadTemplateForm() {
  const [form] = Form.useForm<RazryadFormValues>();
  const { submitting, generateWord, generateQr, qrOpen, qrId, closeQr, downloadQr, photo } = useCertificateActions();
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [userLoading, setUserLoading] = useState(false);
  const [courseLoading, setCourseLoading] = useState(false);

  const loadUsers = useCallback(async (searchKey = '') => {
    setUserLoading(true);
    try {
      const res = await apiClient.get<ApiWrapper<ListPayload<User>>>('/v1/users/list', {
        params: { start: 0, limit: 20, searchKey },
      });
      setUsers(res.data?.payload?.list || []);
    } catch (err) {
      message.error(getCertificateErrorMessage(err));
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
      message.error(getCertificateErrorMessage(err));
    } finally {
      setCourseLoading(false);
    }
  }, []);

  const debouncedUsers = useMemo(() => debounce((v: string) => loadUsers(v), 350), [loadUsers]);
  const debouncedCourses = useMemo(() => debounce((v: string) => loadCourses(v), 350), [loadCourses]);

  useEffect(() => {
    loadUsers('');
    loadCourses('');
  }, [loadUsers, loadCourses]);

  useEffect(() => () => {
    debouncedUsers.cancel();
    debouncedCourses.cancel();
  }, [debouncedUsers, debouncedCourses]);

  const buildPayload = (values: RazryadFormValues): CertificateRequest => ({
    templateCode: TEMPLATE_CODE,
    documentTitle: 'Удостоверение (разряд)',
    regNo: values.regNo.trim(),
    userId: values.userId,
    courseId: values.courseId,
    organizationName: values.organizationName,
    studyForm: values.studyForm,
    grade: String(values.grade),
    protocolNumber: values.protocolNumber.trim(),
    commissionDate: values.commissionDate.format('YYYY-MM-DD'),
    dateFrom: values.trainingPeriod[0].format('YYYY-MM-DD'),
    dateTo: values.trainingPeriod[1].format('YYYY-MM-DD'),
    hoursTheory: String(values.hoursTheory),
    hoursPractice: String(values.hoursPractice),
    markTheory: values.markTheory,
    markPractice: values.markPractice,
    issueDate: values.issueDate.format('YYYY-MM-DD'),
    chairman: values.chairman?.trim(),
    inspector: values.inspector?.trim(),
    ceo: values.ceo?.trim(),
  });

  const onFinish = (values: RazryadFormValues) =>
    generateWord(buildPayload(values), {
      fallbackName: `udostoverenie-razryad-${values.regNo || ''}.docx`,
      onDone: () => form.resetFields(),
    });

  const onQrClick = async () => {
    try {
      const values = await form.validateFields();
      await generateQr(buildPayload(values), { onDone: () => form.resetFields() });
    } catch {
      // validation errors are shown by the form
    }
  };

  return (
    <Card title="Udostoverenie (razryad) maʼlumotlarini kiriting" className="max-w-4xl mx-auto mt-6">
      <Form<RazryadFormValues>
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          organizationName: ORGANIZATIONS[0],
          studyForm: STUDY_FORMS[0],
          markTheory: 'пять',
          markPractice: 'пять',
        }}
      >
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item label="Удостоверение №" name="regNo" rules={[{ required: true, message: 'Raqamni kiriting!' }]}>
              <Input placeholder="Masalan: 101" />
            </Form.Item>
          </Col>

          <Col xs={24} md={16}>
            <Form.Item label="Ф.И.О. (kimga)" name="userId" rules={[{ required: true, message: 'Foydalanuvchini tanlang!' }]}>
              <Select
                showSearch
                onChange={(value) => photo.linkUser(users.find((u) => u.id === value) || null)}
                placeholder="Foydalanuvchini tanlang"
                optionFilterProp="label"
                filterOption={false}
                onSearch={debouncedUsers}
                onFocus={() => { if (!users.length) loadUsers(''); }}
                notFoundContent={userLoading ? <Spin size="small" /> : null}
                options={users.map((u) => ({ value: u.id, label: getUserLabel(u) }))}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={16}>
            <Form.Item label="Профессия (kurs)" name="courseId" rules={[{ required: true, message: 'Kursni tanlang!' }]}>
              <Select
                showSearch
                placeholder="Kursni tanlang"
                optionFilterProp="label"
                filterOption={false}
                onSearch={debouncedCourses}
                onFocus={() => { if (!courses.length) loadCourses(''); }}
                notFoundContent={courseLoading ? <Spin size="small" /> : null}
                options={courses.map((c) => ({ value: c.id, label: getCourseLabel(c) }))}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item label="Разряд (класс, категория)" name="grade" rules={[{ required: true, message: 'Kiriting!' }]}>
              <InputNumber style={{ width: '100%' }} min={1} max={8} placeholder="Masalan: 5" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Наименование предприятия" name="organizationName" rules={[{ required: true, message: 'Tanlang!' }]}>
              <Select options={ORGANIZATIONS.map((o) => ({ value: o, label: `НОУ «${o}»` }))} placeholder="Markazni tanlang" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Форма обучения" name="studyForm" rules={[{ required: true, message: 'Tanlang!' }]}>
              <Select options={STUDY_FORMS.map((s) => ({ value: s, label: s }))} />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Обучался(лась) с / по" name="trainingPeriod" rules={[{ required: true, message: 'Davrni tanlang!' }]}>
              <RangePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          <Col xs={24} md={6}>
            <Form.Item label="Протокол №" name="protocolNumber" rules={[{ required: true, message: 'Kiriting!' }]}>
              <Input placeholder="Masalan: 101" />
            </Form.Item>
          </Col>

          <Col xs={24} md={6}>
            <Form.Item label="Решением комиссии от" name="commissionDate" rules={[{ required: true, message: 'Sanani tanlang!' }]}>
              <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          <Col xs={24} md={6}>
            <Form.Item label="Теорет. обучение (soat)" name="hoursTheory" rules={[{ required: true, message: 'Kiriting!' }]}>
              <InputNumber style={{ width: '100%' }} min={1} placeholder="70" />
            </Form.Item>
          </Col>

          <Col xs={24} md={6}>
            <Form.Item label="Производ. обучение (soat)" name="hoursPractice" rules={[{ required: true, message: 'Kiriting!' }]}>
              <InputNumber style={{ width: '100%' }} min={1} placeholder="80" />
            </Form.Item>
          </Col>

          <Col xs={24} md={6}>
            <Form.Item label="Оценка: теоретическое" name="markTheory" rules={[{ required: true, message: 'Tanlang!' }]}>
              <Select options={MARKS.map((m) => ({ value: m, label: m }))} />
            </Form.Item>
          </Col>

          <Col xs={24} md={6}>
            <Form.Item label="Оценка: пробная работа" name="markPractice" rules={[{ required: true, message: 'Tanlang!' }]}>
              <Select options={MARKS.map((m) => ({ value: m, label: m }))} />
            </Form.Item>
          </Col>

          <Col xs={24} md={6}>
            <Form.Item label="Дата выдачи" name="issueDate" rules={[{ required: true, message: 'Sanani tanlang!' }]}>
              <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          <Col xs={24} md={6}>
            <Form.Item label="Председатель комиссии" name="chairman" rules={[{ required: true, message: 'Kiriting!' }]}>
              <Input placeholder="Иванов И.И." />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Инспектор Госкомитета пром. безопасности"
              name="inspector"
              rules={[{ required: true, message: 'Kiriting!' }]}
            >
              <Input placeholder="Иванов И.И." />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Руководитель организации" name="ceo" rules={[{ required: true, message: 'Kiriting!' }]}>
              <Input placeholder="Нуриддинов З.И." />
            </Form.Item>
          </Col>
        </Row>

        <CertificateActions
          submitting={submitting}
          onQrClick={onQrClick}
          qrOpen={qrOpen}
          qrId={qrId}
          closeQr={closeQr}
          downloadQr={downloadQr}
          photo={photo}
        />
      </Form>
    </Card>
  );
}

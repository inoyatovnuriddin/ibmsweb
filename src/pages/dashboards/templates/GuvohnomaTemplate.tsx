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
import dayjs, { Dayjs } from 'dayjs';
import { apiClient } from '../../../services/api';
import { CertificateRequest, getCertificateErrorMessage } from '../certificatesApi';
import { CertificateActions, useCertificateActions } from './certificateActions';

const { RangePicker } = DatePicker;

// Backend template code = file name without extension: resources/templates/template8.docx.
const TEMPLATE_CODE = 'template8';
// The docx wraps the value: NTM « ${CER_TYPE} », so pass the bare organization name.
const ORGANIZATIONS = ['Buxoro O‘quv', 'Inter Biznes Mega Servis'];

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

interface GuvohnomaValues {
  regNo: string;
  userId: string;
  courseId: string;
  hours: number;
  grade: number;
  organizationName: string;
  protocolNumber: string;
  trainingPeriod: [Dayjs, Dayjs];
  issueDate: Dayjs;
  chairman: string;
  ceo: string;
}

const getUserLabel = (user: User) =>
  `${user.firstname} ${user.lastname}${user.middlename ? ` ${user.middlename}` : ''}${
    user.phoneNumber ? ` (${user.phoneNumber})` : ''
  }`;

const getCourseLabel = (course: Course) => course.titleru || course.titleuz || course.id;

/**
 * "Stropalshik guvohnomasi" — bilingual (UZ + RU) GUVOHNOMA / УДОСТОВЕРЕНИЕ (template8.docx).
 * Every placeholder maps to a standard {@link CertificateRequest} field, so no client-side
 * value overrides or backend changes are needed — names/profession are transliterated by
 * the backend from the selected user and course.
 */
export default function GuvohnomaTemplateForm() {
  const [form] = Form.useForm<GuvohnomaValues>();
  const { submitting, generateWord, generateQr, qrOpen, qrId, closeQr, downloadQr, photo } =
    useCertificateActions();
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

  useEffect(
    () => () => {
      debouncedUsers.cancel();
      debouncedCourses.cancel();
    },
    [debouncedUsers, debouncedCourses]
  );

  const buildPayload = (values: GuvohnomaValues): CertificateRequest => ({
    templateCode: TEMPLATE_CODE,
    documentTitle: 'Guvohnoma',
    regNo: values.regNo.trim(),
    userId: values.userId,
    courseId: values.courseId,
    hours: String(values.hours),
    grade: String(values.grade),
    organizationName: values.organizationName,
    protocolNumber: values.protocolNumber.trim(),
    dateFrom: values.trainingPeriod[0].format('YYYY-MM-DD'),
    dateTo: values.trainingPeriod[1].format('YYYY-MM-DD'),
    issueDate: values.issueDate.format('YYYY-MM-DD'),
    chairman: values.chairman?.trim(),
    ceo: values.ceo?.trim(),
  });

  const onFinish = (values: GuvohnomaValues) =>
    generateWord(buildPayload(values), {
      fallbackName: `guvohnoma-${values.regNo || ''}.docx`,
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
    <Card title="Stropalshik guvohnomasi maʼlumotlarini kiriting" className="max-w-4xl mx-auto mt-6">
      <Form<GuvohnomaValues>
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ issueDate: dayjs(), organizationName: ORGANIZATIONS[0] }}
      >
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item label="Guvohnoma № (GUVOHNOMA №)" name="regNo" rules={[{ required: true, message: 'Raqamni kiriting!' }]}>
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

          <Col xs={24} md={12}>
            <Form.Item label="Mutaxassislik (kurs)" name="courseId" rules={[{ required: true, message: 'Kursni tanlang!' }]}>
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

          <Col xs={24} md={6}>
            <Form.Item label="Razryad" name="grade" rules={[{ required: true, message: 'Kiriting!' }]}>
              <InputNumber style={{ width: '100%' }} min={1} max={8} placeholder="Masalan: 5" />
            </Form.Item>
          </Col>

          <Col xs={24} md={6}>
            <Form.Item label="Oʻquv markazi (NTM)" name="organizationName" rules={[{ required: true, message: 'Tanlang!' }]}>
              <Select options={ORGANIZATIONS.map((o) => ({ value: o, label: `NTM «${o}»` }))} placeholder="Markazni tanlang" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Oʻqish davri (dan / gacha)" name="trainingPeriod" rules={[{ required: true, message: 'Davrni tanlang!' }]}>
              <RangePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          <Col xs={24} md={6}>
            <Form.Item label="Bayonnoma № (Протокол №)" name="protocolNumber" rules={[{ required: true, message: 'Kiriting!' }]}>
              <Input placeholder="Masalan: 101" />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              label="Soat (часовая программа)"
              name="hours"
              rules={[{ required: true, message: 'Soat sonini kiriting!' }]}
            >
              <InputNumber style={{ width: '100%' }} min={1} placeholder="Masalan: 72" />
            </Form.Item>
          </Col>

          <Col xs={24} md={6}>
            <Form.Item label="Bayonnoma / berilgan sana" name="issueDate" rules={[{ required: true, message: 'Sanani tanlang!' }]}>
              <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Rais (Председатель комиссии)" name="chairman" rules={[{ required: true, message: 'Kiriting!' }]}>
              <Input placeholder="Иванов И.И." />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Korxona rahbari (Руководитель)" name="ceo" rules={[{ required: true, message: 'Kiriting!' }]}>
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

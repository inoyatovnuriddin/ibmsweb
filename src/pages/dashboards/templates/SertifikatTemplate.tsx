import { Card, Col, DatePicker, Form, Input, InputNumber, message, Row, Select, Spin } from 'antd';
import { debounce } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { apiClient } from '../../../services/api';
import { CertificateRequest, getCertificateErrorMessage } from '../certificatesApi';
import { CertificateActions, useCertificateActions } from './certificateActions';

const { RangePicker } = DatePicker;

// Backend template code = file name without extension: resources/templates/template2.docx.
const TEMPLATE_CODE = 'template2';

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

interface SertifikatFormValues {
  regNo: string;
  userId: string;
  courseId: string;
  hours: number;
  trainingPeriod: [Dayjs, Dayjs];
  issueDate: Dayjs;
  director: string;
}

const getUserLabel = (user: User) =>
  `${user.firstname} ${user.lastname}${user.middlename ? ` ${user.middlename}` : ''}${
    user.phoneNumber ? ` (${user.phoneNumber})` : ''
  }`;

const getCourseLabel = (course: Course) => course.titleru || course.titleuz || course.id;

/**
 * "SERTIFIKAT" (malaka oshirish — qisqa kurs) — template2.docx.
 * Qabul qiluvchi va kurs backend roʻyxatidan tanlanadi (userId / courseId).
 */
export default function SertifikatTemplateForm() {
  const [form] = Form.useForm<SertifikatFormValues>();
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

  const buildPayload = (values: SertifikatFormValues): CertificateRequest => ({
    templateCode: TEMPLATE_CODE,
    documentTitle: 'Сертификат',
    regNo: values.regNo.trim(),
    userId: values.userId,
    courseId: values.courseId,
    hours: String(values.hours),
    dateFrom: values.trainingPeriod[0].format('YYYY-MM-DD'),
    dateTo: values.trainingPeriod[1].format('YYYY-MM-DD'),
    issueDate: values.issueDate.format('YYYY-MM-DD'),
    director: values.director.trim(),
  });

  const onFinish = (values: SertifikatFormValues) =>
    generateWord(buildPayload(values), {
      fallbackName: `sertifikat-${values.regNo || ''}.docx`,
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
    <Card title="SERTIFIKAT maʼlumotlarini kiriting" className="max-w-4xl mx-auto mt-6">
      <Form<SertifikatFormValues>
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          hours: 72,
          trainingPeriod: [dayjs('2026-02-09'), dayjs('2026-02-18')],
          issueDate: dayjs('2026-02-18'),
          director: 'Нуриддинов З.И.',
        }}
      >
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item label="№ (guvohnoma raqami)" name="regNo" rules={[{ required: true, message: 'Raqamni kiriting!' }]}>
              <Input placeholder="Masalan: 261" />
            </Form.Item>
          </Col>

          <Col xs={24} md={16}>
            <Form.Item label="Kimga berilmoqda (F.I.O.)" name="userId" rules={[{ required: true, message: 'Foydalanuvchini tanlang!' }]}>
              <Select
                showSearch
                onChange={(value) => photo.linkUser(users.find((u) => u.id === value) || null)}
                placeholder="Foydalanuvchini tanlang"
                optionFilterProp="label"
                filterOption={false}
                onSearch={debouncedUsers}
                onFocus={() => { if (!users.length) loadUsers(''); }}
                notFoundContent={userLoading ? <Spin size="small" /> : null}
                options={users.map((user) => ({ value: user.id, label: getUserLabel(user) }))}
              />
            </Form.Item>
          </Col>

          <Col xs={24}>
            <Form.Item label="Kurs nomi (по курсу)" name="courseId" rules={[{ required: true, message: 'Kursni tanlang!' }]}>
              <Select
                showSearch
                placeholder="Kursni tanlang"
                optionFilterProp="label"
                filterOption={false}
                onSearch={debouncedCourses}
                onFocus={() => { if (!courses.length) loadCourses(''); }}
                notFoundContent={courseLoading ? <Spin size="small" /> : null}
                options={courses.map((course) => ({ value: course.id, label: getCourseLabel(course) }))}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item label="Soat (часовая программа)" name="hours" rules={[{ required: true, message: 'Soat sonini kiriting!' }]}>
              <InputNumber style={{ width: '100%' }} min={1} placeholder="Masalan: 72" />
            </Form.Item>
          </Col>

          <Col xs={24} md={16}>
            <Form.Item label="Oʻqish davri (dan / gacha)" name="trainingPeriod" rules={[{ required: true, message: 'Oʻqish davrini tanlang!' }]}>
              <RangePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Sana (Дата)" name="issueDate" rules={[{ required: true, message: 'Berilgan sanani tanlang!' }]}>
              <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Исп. директор" name="director" rules={[{ required: true, message: 'Direktor F.I.O. ni kiriting!' }]}>
              <Input placeholder="Masalan: Нуриддинов З.И." />
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

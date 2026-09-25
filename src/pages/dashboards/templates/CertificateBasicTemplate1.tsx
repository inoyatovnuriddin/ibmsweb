import { Card, Col, DatePicker, Form, Input, InputNumber, message, Row, Select, Spin } from 'antd';
import { debounce } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { apiClient } from '../../../services/api';
import { CertificateRequest, getCertificateErrorMessage } from '../certificatesApi';
import { CertificateActions, useCertificateActions } from './certificateActions';

const { RangePicker } = DatePicker;

// Backend template code = file name without extension: resources/templates/template3.docx.
const TEMPLATE_CODE = 'template3';
const ORGANIZATIONS = ['Inter Biznes Mega Servis', 'BUXORO O‘QUV'];

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
  titleeng?: string;
}

interface ListPayload<T> {
  list: T[];
  count: number;
}

interface ApiWrapper<T> {
  payload?: T;
}

interface DiplomaFormValues {
  regNo: string;
  userId: string;
  courseId: string;
  trainingPeriod: [Dayjs, Dayjs];
  organizationName: string;
  grade: number;
  protocolNumber: string;
  protocolDate: Dayjs;
  issueDate: Dayjs;
}

const getUserLabel = (user: User) =>
  `${user.firstname} ${user.lastname}${user.middlename ? ` ${user.middlename}` : ''}${
    user.phoneNumber ? ` (${user.phoneNumber})` : ''
  }`;

const getCourseLabel = (course: Course) =>
  course.titleru || course.titleeng || course.titleuz || course.id;

/**
 * "DIPLOMA / ДИПЛОМ" (ikki tilli RU + EN) — template3.docx.
 * Qabul qiluvchi va kurs backend roʻyxatidan tanlanadi; F.I.O. va kasb (RU/EN) backend hisoblaydi.
 */
export default function CertificateBasicTemplate1Form() {
  const [form] = Form.useForm<DiplomaFormValues>();
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

  const buildPayload = (values: DiplomaFormValues): CertificateRequest => ({
    templateCode: TEMPLATE_CODE,
    documentTitle: 'Диплом',
    regNo: values.regNo.trim(),
    userId: values.userId,
    courseId: values.courseId,
    dateFrom: values.trainingPeriod[0].format('YYYY-MM-DD'),
    dateTo: values.trainingPeriod[1].format('YYYY-MM-DD'),
    organizationName: values.organizationName.trim(),
    grade: String(values.grade),
    protocolNumber: values.protocolNumber.trim(),
    protocolDate: values.protocolDate.format('YYYY-MM-DD'),
    issueDate: values.issueDate.format('YYYY-MM-DD'),
  });

  const onFinish = (values: DiplomaFormValues) =>
    generateWord(buildPayload(values), {
      fallbackName: `diploma-${values.regNo || ''}.docx`,
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
    <Card title="DIPLOMA (RU + EN) maʼlumotlarini kiriting" className="max-w-4xl mx-auto mt-6">
      <Form<DiplomaFormValues>
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          grade: 5,
          organizationName: ORGANIZATIONS[0],
          trainingPeriod: [dayjs('2025-03-14'), dayjs('2025-05-04')],
          protocolDate: dayjs('2023-04-06'),
          issueDate: dayjs(),
        }}
      >
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item label="№ (diplom raqami)" name="regNo" rules={[{ required: true, message: 'Raqamni kiriting!' }]}>
              <Input placeholder="Masalan: 4677" />
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

          <Col xs={24} md={16}>
            <Form.Item label="Kasb / mutaxassislik (kurs)" name="courseId" rules={[{ required: true, message: 'Kursni tanlang!' }]}>
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
            <Form.Item label="Razryad / Discharge" name="grade" rules={[{ required: true, message: 'Razryadni kiriting!' }]}>
              <InputNumber style={{ width: '100%' }} min={1} max={8} placeholder="Masalan: 5" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Oʻqish davri (boshlanish / tugash)" name="trainingPeriod" rules={[{ required: true, message: 'Oʻqish davrini tanlang!' }]}>
              <RangePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Markaz nomi" name="organizationName" rules={[{ required: true, message: 'Markazni tanlang!' }]}>
              <Select options={ORGANIZATIONS.map((org) => ({ value: org, label: org }))} placeholder="Markazni tanlang" />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item label="Protokol №" name="protocolNumber" rules={[{ required: true, message: 'Protokol raqamini kiriting!' }]}>
              <Input placeholder="Masalan: 142" />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item label="Protokol sanasi" name="protocolDate" rules={[{ required: true, message: 'Protokol sanasini tanlang!' }]}>
              <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item label="Berilgan sana" name="issueDate" rules={[{ required: true, message: 'Berilgan sanani tanlang!' }]}>
              <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
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

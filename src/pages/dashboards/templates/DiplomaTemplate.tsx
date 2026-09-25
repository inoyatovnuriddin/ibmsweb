import { Card, Col, DatePicker, Form, Input, message, Row, Select, Spin } from 'antd';
import { debounce } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { apiClient } from '../../../services/api';
import { CertificateRequest, getCertificateErrorMessage } from '../certificatesApi';
import { CertificateActions, useCertificateActions } from './certificateActions';

const { RangePicker } = DatePicker;

// Backend template code = file name without extension: resources/templates/template1.docx.
const TEMPLATE_CODE = 'template1';
const ORGANIZATIONS = ['BUXORO O‘QUV', 'Inter Biznes Mega Servis'];

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

interface DiplomaFormValues {
  diplomaNumber: string;
  userId: string;
  courseId: string;
  cerType: string;
  rank: number;
  protocolNumber: string;
  master: string;
  director: string;
  studyPeriod: [Dayjs, Dayjs];
  issueDate: Dayjs;
}

const getUserLabel = (user: User) =>
  `${user.firstname} ${user.lastname}${user.middlename ? ` ${user.middlename}` : ''}${
    user.phoneNumber ? ` (${user.phoneNumber})` : ''
  }`;

const getCourseLabel = (course: Course) => course.titleru || course.titleuz || course.id;

/**
 * "GUVOHNOMA" (malaka oshirish, UZ + RU) — template1.docx.
 * Umumiy sertifikat engine orqali ishlaydi (barcha sertifikatlar bitta joyga saqlanadi).
 */
export default function DiplomaTemplateForm() {
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
    documentTitle: 'Гувоҳнома',
    regNo: values.diplomaNumber.trim(),
    userId: values.userId,
    courseId: values.courseId,
    organizationName: values.cerType,
    grade: String(values.rank),
    protocolNumber: values.protocolNumber.trim(),
    chairman: values.master?.trim(),
    ceo: values.director?.trim(),
    dateFrom: values.studyPeriod[0].format('YYYY-MM-DD'),
    dateTo: values.studyPeriod[1].format('YYYY-MM-DD'),
    issueDate: values.issueDate.format('YYYY-MM-DD'),
  });

  const onFinish = (values: DiplomaFormValues) =>
    generateWord(buildPayload(values), {
      fallbackName: `guvohnoma-${values.diplomaNumber || ''}.docx`,
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
    <Card title="Guvohnoma maʼlumotlarini kiriting" className="max-w-4xl mx-auto mt-6">
      <Form<DiplomaFormValues> layout="vertical" form={form} onFinish={onFinish} initialValues={{ issueDate: dayjs() }}>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item label="Guvohnoma raqami" name="diplomaNumber" rules={[{ required: true, message: 'Raqamni kiriting!' }]}>
              <Input placeholder="Masalan: 575" />
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
            <Form.Item label="Kasb / Mutaxassislik (kurs)" name="courseId" rules={[{ required: true, message: 'Kursni tanlang!' }]}>
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
            <Form.Item label="Razryad" name="rank" rules={[{ required: true, message: 'Razryadni tanlang!' }]}>
              <Select
                placeholder="Razryadni tanlang"
                options={[1, 2, 3, 4, 5, 6].map((rank) => ({ value: rank, label: `${rank} razryad` }))}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Oʻquv markazi (CER_TYPE)"
              name="cerType"
              rules={[{ required: true, message: 'Oʻquv markazini tanlang!' }]}
              initialValue={ORGANIZATIONS[0]}
            >
              <Select options={ORGANIZATIONS.map((org) => ({ value: org, label: org }))} placeholder="Oʻquv markazini tanlang" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Oʻqish davri" name="studyPeriod" rules={[{ required: true, message: 'Oʻqish davrini tanlang!' }]}>
              <RangePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item label="Bayonnoma №" name="protocolNumber" rules={[{ required: true, message: 'Bayonnoma raqamini kiriting!' }]}>
              <Input placeholder="Masalan: 48/1" />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item label="Berilgan sana" name="issueDate" rules={[{ required: true, message: 'Sanani tanlang!' }]}>
              <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item label="Komissiya raisi" name="master">
              <Input placeholder="Masalan: Joʻrayev A." />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item label="Korxona rahbari" name="director">
              <Input placeholder="Masalan: Karimov B." />
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

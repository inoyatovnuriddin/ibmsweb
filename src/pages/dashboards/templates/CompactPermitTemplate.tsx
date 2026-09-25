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

// Backend template code = file name without extension: resources/templates/template7.docx.
const TEMPLATE_CODE = 'template7';
const ORGANIZATIONS = ['НОУ «Buxoro O‘quv»', 'НОУ «Inter Biznes Mega Servis»'];

// Russian genitive month names for the issue-date and study-period phrases.
const RU_MONTHS_GEN = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];
const day2 = (d: Dayjs) => String(d.date()).padStart(2, '0');
const ruMonthGen = (d: Dayjs) => RU_MONTHS_GEN[d.month()];

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

interface CompactPermitValues {
  regNo: string;
  userId: string;
  courseId: string;
  hours: number;
  qualification: string;
  equipment: string;
  organizationName: string;
  trainingPeriod: [Dayjs, Dayjs];
  issueDate: Dayjs;
}

const getUserLabel = (user: User) =>
  `${user.firstname} ${user.lastname}${user.middlename ? ` ${user.middlename}` : ''}${
    user.phoneNumber ? ` (${user.phoneNumber})` : ''
  }`;

const getCourseLabel = (course: Course) => course.titleru || course.titleuz || course.id;

/**
 * "Udostoverenie (ixcham)" — compact equipment-permit УДОСТОВЕРЕНИЕ (template7.docx).
 * The template uses a couple of template-specific placeholders (QUALIFICATION, STUDY_PERIOD)
 * and reuses ISD/ISMR/ISY with a different meaning than other templates, so those values are
 * supplied directly via {@code extraValues} — the backend value builder stays untouched.
 */
export default function CompactPermitTemplateForm() {
  const [form] = Form.useForm<CompactPermitValues>();
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

  const buildPayload = (values: CompactPermitValues): CertificateRequest => {
    const [from, to] = values.trainingPeriod;
    const studyPeriod =
      `с «${day2(from)}» ${ruMonthGen(from)} ${from.year()} г. ` +
      `по «${day2(to)}» ${ruMonthGen(to)} ${to.year()} г. обучался(-лась) на курсах`;

    return {
      templateCode: TEMPLATE_CODE,
      documentTitle: 'Удостоверение',
      regNo: values.regNo.trim(),
      userId: values.userId,
      courseId: values.courseId,
      hours: String(values.hours),
      equipment: values.equipment.trim(),
      organizationName: values.organizationName,
      // Template-specific placeholders resolved on the client (see class doc).
      extraValues: {
        QUALIFICATION: values.qualification.trim(),
        STUDY_PERIOD: studyPeriod,
        ISD: day2(values.issueDate),
        ISMR: `${ruMonthGen(values.issueDate)} `,
        ISY: String(values.issueDate.year()),
      },
    };
  };

  const onFinish = (values: CompactPermitValues) =>
    generateWord(buildPayload(values), {
      fallbackName: `udostoverenie-${values.regNo || ''}.docx`,
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
    <Card title="Udostoverenie (ixcham) maʼlumotlarini kiriting" className="max-w-4xl mx-auto mt-6">
      <Form<CompactPermitValues>
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ issueDate: dayjs(), organizationName: ORGANIZATIONS[0] }}
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

          <Col xs={24} md={12}>
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

          <Col xs={24} md={12}>
            <Form.Item
              label="Присвоена квалификация"
              name="qualification"
              rules={[{ required: true, message: 'Kiriting!' }]}
            >
              <Input placeholder="Masalan: 5 разряд / Помощник машиниста" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Оборудование (к обслуживанию допускается)"
              name="equipment"
              rules={[{ required: true, message: 'Jihozni kiriting!' }]}
            >
              <Input.TextArea
                autoSize={{ minRows: 1, maxRows: 3 }}
                placeholder="Masalan: буровые установки, компрессоры…"
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Учебное заведение" name="organizationName" rules={[{ required: true, message: 'Tanlang!' }]}>
              <Select options={ORGANIZATIONS.map((o) => ({ value: o, label: o }))} placeholder="Markazni tanlang" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Обучался(лась) с / по" name="trainingPeriod" rules={[{ required: true, message: 'Davrni tanlang!' }]}>
              <RangePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
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

          <Col xs={24} md={12}>
            <Form.Item label="Дата выдачи" name="issueDate" rules={[{ required: true, message: 'Sanani tanlang!' }]}>
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

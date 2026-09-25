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

// Backend template code = file name without extension: resources/templates/template10.docx.
const TEMPLATE_CODE = 'template10';
// The docx wraps the org itself ("Директор НОУ «${ORG_NAME}»"), so send the bare centre name.
const ORGANIZATIONS = ['Inter Biznes Mega Servis', 'Buxoro O‘quv'];

// Russian genitive month names for the «DD» month YYYY date phrases.
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

interface DgsdPermitValues {
  regNo: string;
  userId: string;
  courseId: string;
  hours: number;
  organizationName: string;
  trainingPeriod: [Dayjs, Dayjs];
  protocolNumber: string;
  protocolDate: Dayjs;
  issueDate: Dayjs;
}

const getUserLabel = (user: User) =>
  `${user.firstname} ${user.lastname}${user.middlename ? ` ${user.middlename}` : ''}${
    user.phoneNumber ? ` (${user.phoneNumber})` : ''
  }`;

const getCourseLabel = (course: Course) => course.titleru || course.titleuz || course.id;

/**
 * "Udostoverenie (ДГСД)" — членов ДГСД / газоспасательное УДОСТОВЕРЕНИЕ (template10.docx).
 * All the «DD» month YYYY date fragments are formatted on the client and passed via
 * {@code extraValues} (DFD/DFMR/DFY, DTD/DTMR/DTY, PRTD/PRTM/PRTY, ISD/ISMR/ISY) so the output
 * matches the printed blank exactly; the backend value builder stays untouched. COURSE_NAME and
 * ORG_NAME come from the selected course and the chosen centre.
 */
export default function DgsdPermitTemplateForm() {
  const [form] = Form.useForm<DgsdPermitValues>();
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

  const buildPayload = (values: DgsdPermitValues): CertificateRequest => {
    const [from, to] = values.trainingPeriod;
    return {
      templateCode: TEMPLATE_CODE,
      documentTitle: 'Удостоверение',
      regNo: values.regNo.trim(),
      userId: values.userId,
      courseId: values.courseId,
      hours: String(values.hours),
      organizationName: values.organizationName,
      protocolNumber: values.protocolNumber.trim(),
      // Date fragments resolved on the client so the printed «DD» month YYYY layout matches.
      extraValues: {
        DFD: day2(from),
        DFMR: ruMonthGen(from),
        DFY: String(from.year()),
        DTD: day2(to),
        DTMR: ruMonthGen(to),
        DTY: String(to.year()),
        PRTD: day2(values.protocolDate),
        PRTM: ruMonthGen(values.protocolDate),
        PRTY: String(values.protocolDate.year()),
        ISD: day2(values.issueDate),
        ISMR: ruMonthGen(values.issueDate),
        ISY: String(values.issueDate.year()),
      },
    };
  };

  const onFinish = (values: DgsdPermitValues) =>
    generateWord(buildPayload(values), {
      fallbackName: `udostoverenie-dgsd-${values.regNo || ''}.docx`,
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
    <Card title="Udostoverenie (ДГСД) maʼlumotlarini kiriting" className="max-w-4xl mx-auto mt-6">
      <Form<DgsdPermitValues>
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ issueDate: dayjs(), organizationName: ORGANIZATIONS[0], hours: 46 }}
      >
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item label="Удостоверение №" name="regNo" rules={[{ required: true, message: 'Raqamni kiriting!' }]}>
              <Input placeholder="Masalan: 3167" />
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
            <Form.Item label="На курсах (kurs)" name="courseId" rules={[{ required: true, message: 'Kursni tanlang!' }]}>
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
            <Form.Item label="Часовая программа (soat)" name="hours" rules={[{ required: true, message: 'Kiriting!' }]}>
              <InputNumber style={{ width: '100%' }} min={1} placeholder="46" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Учебное заведение" name="organizationName" rules={[{ required: true, message: 'Tanlang!' }]}>
              <Select
                options={ORGANIZATIONS.map((o) => ({ value: o, label: `НОУ «${o}»` }))}
                placeholder="Markazni tanlang"
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Обучался(лась) с / по" name="trainingPeriod" rules={[{ required: true, message: 'Davrni tanlang!' }]}>
              <RangePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item label="Протокол №" name="protocolNumber" rules={[{ required: true, message: 'Kiriting!' }]}>
              <Input placeholder="Masalan: 646" />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item label="Протокол сана" name="protocolDate" rules={[{ required: true, message: 'Sanani tanlang!' }]}>
              <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
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

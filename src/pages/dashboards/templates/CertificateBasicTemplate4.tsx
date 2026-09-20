import { Card, Col, DatePicker, Form, Input, message, Row, Select, Spin } from 'antd';
import { debounce } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Dayjs } from 'dayjs';
import { apiClient } from '../../../services/api';
import { CertificateRequest, getCertificateErrorMessage } from '../certificatesApi';
import { CertificateActions, useCertificateActions } from './certificateActions';

const { RangePicker } = DatePicker;

// Backend template code = file name without extension: resources/templates/template5.docx.
const TEMPLATE_CODE = 'template5';
const ORGANIZATIONS = ['Inter Biznes Mega Servis', 'BUXORO O‘QUV'];
const ELEC_GROUPS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

interface User {
  id: string;
  phoneNumber?: string;
  firstname: string;
  lastname: string;
  middlename?: string;
  userImage?: string | null;
}

interface ListPayload<T> {
  list: T[];
  count: number;
}

interface ApiWrapper<T> {
  payload?: T;
}

interface EventFormValues {
  regNo: string;
  userId: string;
  organizationName: string;
  trainingPeriod: [Dayjs, Dayjs];
  protocolNumber: string;
  protocolDate: Dayjs;
  elecGroup: string;
  chairman: string;
  director: string;
  issueDate: Dayjs;
}

const getUserLabel = (user: User) =>
  `${user.firstname} ${user.lastname}${user.middlename ? ` ${user.middlename}` : ''}${
    user.phoneNumber ? ` (${user.phoneNumber})` : ''
  }`;

/**
 * "Event sertifikati" — ПТЭ/ПТБ electroustanovkalar bilim tekshirish udostovereniyesi (template5.docx).
 */
export default function CertificateBasicTemplate4Form() {
  const [form] = Form.useForm<EventFormValues>();
  const { submitting, generateWord, generateQr, qrOpen, qrId, closeQr, downloadQr, photo } = useCertificateActions();
  const [users, setUsers] = useState<User[]>([]);
  const [userLoading, setUserLoading] = useState(false);

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

  const debouncedUsers = useMemo(() => debounce((v: string) => loadUsers(v), 350), [loadUsers]);

  useEffect(() => {
    loadUsers('');
  }, [loadUsers]);

  useEffect(() => () => {
    debouncedUsers.cancel();
  }, [debouncedUsers]);

  const buildPayload = (values: EventFormValues): CertificateRequest => ({
    templateCode: TEMPLATE_CODE,
    documentTitle: 'Удостоверение',
    regNo: values.regNo.trim(),
    userId: values.userId,
    organizationName: values.organizationName.trim(),
    dateFrom: values.trainingPeriod[0].format('YYYY-MM-DD'),
    dateTo: values.trainingPeriod[1].format('YYYY-MM-DD'),
    protocolNumber: values.protocolNumber.trim(),
    protocolDate: values.protocolDate.format('YYYY-MM-DD'),
    elecGroup: values.elecGroup,
    chairman: values.chairman?.trim(),
    director: values.director?.trim(),
    issueDate: values.issueDate.format('YYYY-MM-DD'),
  });

  const onFinish = (values: EventFormValues) =>
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
    <Card title="Event sertifikati (ПТЭ/ПТБ) maʼlumotlarini kiriting" className="max-w-4xl mx-auto mt-6">
      <Form<EventFormValues>
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ organizationName: ORGANIZATIONS[0], elecGroup: 'III' }}
      >
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item label="Udostoverenie №" name="regNo" rules={[{ required: true, message: 'Raqamni kiriting!' }]}>
              <Input placeholder="Masalan: 142" />
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
                options={users.map((user) => ({ value: user.id, label: getUserLabel(user) }))}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Oʻquv markazi" name="organizationName" rules={[{ required: true, message: 'Markazni tanlang!' }]}>
              <Select options={ORGANIZATIONS.map((org) => ({ value: org, label: org }))} placeholder="Markazni tanlang" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Oʻqish davri (с / по)" name="trainingPeriod" rules={[{ required: true, message: 'Oʻqish davrini tanlang!' }]}>
              <RangePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item label="Protokol №" name="protocolNumber" rules={[{ required: true, message: 'Protokol raqamini kiriting!' }]}>
              <Input placeholder="Masalan: 101" />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item label="Protokol sanasi (от)" name="protocolDate" rules={[{ required: true, message: 'Protokol sanasini tanlang!' }]}>
              <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item label="Elektroxavfsizlik guruhi" name="elecGroup" rules={[{ required: true, message: 'Guruhni tanlang!' }]}>
              <Select options={ELEC_GROUPS.map((g) => ({ value: g, label: g }))} placeholder="Guruh" />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item label="Berilgan sana (Дата выдачи)" name="issueDate" rules={[{ required: true, message: 'Berilgan sanani tanlang!' }]}>
              <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item label="Komissiya raisi (Председатель)" name="chairman" rules={[{ required: true, message: 'Rais F.I.O. ni kiriting!' }]}>
              <Input placeholder="Masalan: Иванов И.И." />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item label="Direktor (Директор НОУ)" name="director" rules={[{ required: true, message: 'Direktor F.I.O. ni kiriting!' }]}>
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

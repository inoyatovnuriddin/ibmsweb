import {
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  message,
  Row,
  Typography,
} from 'antd';
import { useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';

const { Title } = Typography;

interface CertificateBasic2Values {
  employeeName: string;
  trainingName: string;
  hours: number;
  certificateDate: Dayjs;
}

export default function CertificateBasicTemplate2Form() {
  const [form] = Form.useForm<CertificateBasic2Values>();
  const [submittedValues, setSubmittedValues] = useState<Record<string, string> | null>(null);

  const handleFinish = (values: CertificateBasic2Values) => {
    setSubmittedValues({
      EMPLOYEE_NAME: values.employeeName.trim(),
      TRAINING_NAME: values.trainingName.trim(),
      HOURS: String(values.hours),
      CERTIFICATE_DATE: values.certificateDate.format('YYYY-MM-DD'),
    });
    message.success('Sertifikat basic 2 maʼlumotlari saqlandi.');
  };

  return (
    <Card title="Sertifikat basic 2 formasi" className="max-w-4xl mx-auto mt-6">
      <Form<CertificateBasic2Values>
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          employeeName: 'Aziza Usmonova',
          trainingName: 'Customer support training',
          hours: 48,
          certificateDate: dayjs('2026-03-18'),
        }}
      >
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item label="Xodim F.I.SH" name="employeeName" rules={[{ required: true, message: 'Xodim ismini kiriting' }]}>
              <Input placeholder="Masalan: Aziza Usmonova" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Trening nomi" name="trainingName" rules={[{ required: true, message: 'Trening nomini kiriting' }]}>
              <Input placeholder="Masalan: Customer support training" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Soatlar soni" name="hours" rules={[{ required: true, message: 'Soat sonini kiriting' }]}>
              <InputNumber style={{ width: '100%' }} placeholder="Masalan: 48" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label="Sertifikat sanasi"
              name="certificateDate"
              rules={[{ required: true, message: 'Sertifikat sanasini tanlang' }]}
            >
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={12}>
          <Col span={12}>
            <Button block onClick={() => form.resetFields()}>
              Tozalash
            </Button>
          </Col>
          <Col span={12}>
            <Button type="primary" htmlType="submit" block>
              Saqlash
            </Button>
          </Col>
        </Row>
      </Form>

      {submittedValues && (
        <>
          <Divider />
          <Title level={5}>Saqlangan qiymatlar</Title>
          <pre
            style={{
              background: '#0f172a',
              color: '#e2e8f0',
              padding: 14,
              borderRadius: 10,
              overflowX: 'auto',
            }}
          >
            {JSON.stringify(submittedValues, null, 2)}
          </pre>
        </>
      )}
    </Card>
  );
}

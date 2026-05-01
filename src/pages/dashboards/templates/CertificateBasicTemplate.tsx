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

interface CertificateBasicValues {
  fullName: string;
  courseName: string;
  score?: number;
  issuedAt: Dayjs;
}

export default function CertificateBasicTemplateForm() {
  const [form] = Form.useForm<CertificateBasicValues>();
  const [submittedValues, setSubmittedValues] = useState<Record<string, string> | null>(null);

  const handleFinish = (values: CertificateBasicValues) => {
    setSubmittedValues({
      FULLNAME: values.fullName.trim(),
      COURSE_NAME: values.courseName.trim(),
      SCORE: String(values.score ?? ''),
      ISSUED_AT: values.issuedAt.format('YYYY-MM-DD'),
    });
    message.success('Sertifikat basic maʼlumotlari saqlandi.');
  };

  return (
    <Card title="Sertifikat basic formasi" className="max-w-4xl mx-auto mt-6">
      <Form<CertificateBasicValues>
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          fullName: 'Nuriddin',
          courseName: 'Frontend Developer',
          score: 95,
          issuedAt: dayjs('2026-03-01'),
        }}
      >
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item label="F.I.SH" name="fullName" rules={[{ required: true, message: 'F.I.SH kiriting' }]}>
              <Input placeholder="Masalan: Nuriddin Aliyev" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Kurs nomi" name="courseName" rules={[{ required: true, message: 'Kurs nomini kiriting' }]}>
              <Input placeholder="Masalan: Frontend Developer" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Natija / Ball" name="score">
              <InputNumber style={{ width: '100%' }} placeholder="Masalan: 95" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Berilgan sana" name="issuedAt" rules={[{ required: true, message: 'Sanani tanlang' }]}>
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

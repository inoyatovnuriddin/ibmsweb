import {
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  message,
  Row,
  Typography,
} from 'antd';
import { useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';

const { Title } = Typography;

interface CertificateBasic1Values {
  studentName: string;
  specialty: string;
  mentorName: string;
  completedAt: Dayjs;
}

export default function CertificateBasicTemplate1Form() {
  const [form] = Form.useForm<CertificateBasic1Values>();
  const [submittedValues, setSubmittedValues] = useState<Record<string, string> | null>(null);

  const handleFinish = (values: CertificateBasic1Values) => {
    setSubmittedValues({
      STUDENT_NAME: values.studentName.trim(),
      SPECIALTY: values.specialty.trim(),
      MENTOR_NAME: values.mentorName.trim(),
      COMPLETED_AT: values.completedAt.format('YYYY-MM-DD'),
    });
    message.success('Sertifikat basic 1 maʼlumotlari saqlandi.');
  };

  return (
    <Card title="Sertifikat basic 1 formasi" className="max-w-4xl mx-auto mt-6">
      <Form<CertificateBasic1Values>
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          studentName: 'Nuriddin Aliyev',
          specialty: 'React.js intensive',
          mentorName: 'Abdulloh Karimov',
          completedAt: dayjs('2026-03-10'),
        }}
      >
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item label="Talaba F.I.SH" name="studentName" rules={[{ required: true, message: 'Talaba ismini kiriting' }]}>
              <Input placeholder="Masalan: Nuriddin Aliyev" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Yo‘nalish" name="specialty" rules={[{ required: true, message: 'Yo‘nalishni kiriting' }]}>
              <Input placeholder="Masalan: React.js intensive" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Mentor" name="mentorName" rules={[{ required: true, message: 'Mentor ismini kiriting' }]}>
              <Input placeholder="Masalan: Abdulloh Karimov" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Tugallangan sana" name="completedAt" rules={[{ required: true, message: 'Sanani tanlang' }]}>
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

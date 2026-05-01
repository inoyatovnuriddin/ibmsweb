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

interface CertificateBasic4Values {
  participantName: string;
  eventName: string;
  organizationName: string;
  eventDate: Dayjs;
}

export default function CertificateBasicTemplate4Form() {
  const [form] = Form.useForm<CertificateBasic4Values>();
  const [submittedValues, setSubmittedValues] = useState<Record<string, string> | null>(null);

  const handleFinish = (values: CertificateBasic4Values) => {
    setSubmittedValues({
      PARTICIPANT_NAME: values.participantName.trim(),
      EVENT_NAME: values.eventName.trim(),
      ORGANIZATION_NAME: values.organizationName.trim(),
      EVENT_DATE: values.eventDate.format('YYYY-MM-DD'),
    });
    message.success('Sertifikat basic 4 maʼlumotlari saqlandi.');
  };

  return (
    <Card title="Sertifikat basic 4 formasi" className="max-w-4xl mx-auto mt-6">
      <Form<CertificateBasic4Values>
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          participantName: 'Sherzod Rahimov',
          eventName: 'Design Conference 2026',
          organizationName: 'Creative Academy',
          eventDate: dayjs('2026-04-01'),
        }}
      >
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Ishtirokchi F.I.SH"
              name="participantName"
              rules={[{ required: true, message: 'Ishtirokchi ismini kiriting' }]}
            >
              <Input placeholder="Masalan: Sherzod Rahimov" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Tadbir nomi" name="eventName" rules={[{ required: true, message: 'Tadbir nomini kiriting' }]}>
              <Input placeholder="Masalan: Design Conference 2026" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label="Tashkilot nomi"
              name="organizationName"
              rules={[{ required: true, message: 'Tashkilot nomini kiriting' }]}
            >
              <Input placeholder="Masalan: Creative Academy" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Tadbir sanasi" name="eventDate" rules={[{ required: true, message: 'Sanani tanlang' }]}>
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

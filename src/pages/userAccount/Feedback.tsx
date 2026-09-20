import { useState } from 'react';
import { Button, Form, Input, message, Rate, Select, Space, theme, Typography } from 'antd';
import { MessageOutlined, SendOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { Card } from '../../components';
import type { RootState } from '../../redux/store.ts';
import { submitPublicContactRequest } from '../../services/publicContact.ts';

const { Text, Title } = Typography;

type FeedbackForm = {
  rating: number;
  category: string;
  message: string;
};

const CATEGORIES = [
  'Platforma qulayligi',
  'Kurs sifati',
  'Texnik muammo',
  'Taklif',
  'Boshqa',
];

export const UserProfileFeedbackPage = () => {
  const {
    token: { colorText, colorTextSecondary },
  } = theme.useToken();
  const currentUser = useSelector((state: RootState) => state.auth.currentUser);
  const [form] = Form.useForm<FeedbackForm>();
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (values: FeedbackForm) => {
    setSubmitting(true);
    try {
      const composed = [
        `Baho: ${values.rating}/5`,
        `Yoʻnalish: ${values.category}`,
        '',
        values.message.trim(),
      ].join('\n');

      await submitPublicContactRequest({
        fullName:
          [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(' ') ||
          'Foydalanuvchi',
        phoneNumber: currentUser?.phoneNumber || '',
        message: composed,
        sourcePage: 'profile-feedback',
        formSessionId: `feedback-${currentUser?.id || 'anon'}-${Date.now()}`,
      });
      message.success('Fikringiz uchun rahmat! Baholaringiz qabul qilindi.');
      form.resetFields();
    } catch {
      message.error('Yuborishda xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card style={{ borderRadius: 24, boxShadow: 'var(--color-shadow-soft)' }} bodyStyle={{ padding: 24 }}>
      <Space align="center" size={12} style={{ marginBottom: 4 }}>
        <MessageOutlined style={{ fontSize: 20, color: '#2563eb' }} />
        <Title level={4} style={{ margin: 0, color: colorText }}>
          Fikr-mulohaza
        </Title>
      </Space>
      <Text style={{ color: colorTextSecondary }}>
        Platformani yaxshilashimizga yordam bering. Har bir fikr biz uchun qimmatli.
      </Text>

      <Form
        form={form}
        layout="vertical"
        onFinish={onSubmit}
        style={{ marginTop: 18, maxWidth: 620 }}
        initialValues={{ rating: 5, category: CATEGORIES[0] }}
      >
        <Form.Item
          name="rating"
          label="Umumiy bahoyingiz"
          rules={[{ required: true, message: 'Baho bering' }]}
        >
          <Rate style={{ fontSize: 28 }} />
        </Form.Item>

        <Form.Item name="category" label="Yoʻnalish">
          <Select options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
        </Form.Item>

        <Form.Item
          name="message"
          label="Fikringiz"
          rules={[
            { required: true, message: 'Fikringizni yozing' },
            { min: 10, message: 'Kamida 10 ta belgi' },
          ]}
        >
          <Input.TextArea rows={5} placeholder="Nima yoqdi, nimani yaxshilash kerak?" />
        </Form.Item>

        <div style={{ textAlign: 'right' }}>
          <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={submitting}>
            Yuborish
          </Button>
        </div>
      </Form>
    </Card>
  );
};

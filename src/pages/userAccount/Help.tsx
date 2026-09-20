import { useState } from 'react';
import { Button, Collapse, Form, Input, message, Space, theme, Typography } from 'antd';
import { CustomerServiceOutlined, QuestionCircleOutlined, SendOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { Card } from '../../components';
import type { RootState } from '../../redux/store.ts';
import { submitPublicContactRequest } from '../../services/publicContact.ts';

const { Text, Title } = Typography;

const FAQ = [
  {
    q: 'Kursni qanday boshlayman?',
    a: 'Profil menyusidagi "Mening oʻqishlarim" boʻlimiga oʻting, kerakli kursni tanlab "Davom ettirish" tugmasini bosing.',
  },
  {
    q: 'Sertifikatimni qayerdan olaman?',
    a: 'Kursni toʻliq yakunlaganingizdan soʻng administrator sertifikat tayyorlaydi. Sertifikatdagi QR-kod orqali uni tekshirish mumkin.',
  },
  {
    q: 'Shaxsiy maʼlumotlarimni oʻzgartira olmayapman.',
    a: 'Xavfsizlik maqsadida shaxsiy maʼlumotlarni faqat administrator oʻzgartiradi. Iltimos, administratorga murojaat qiling.',
  },
  {
    q: 'Parolimni unutdim, nima qilaman?',
    a: '"Harakatlar" boʻlimidan "Parolni tiklash havolasi" tugmasini bosing — emailingizga tiklash havolasi keladi.',
  },
];

export const UserProfileHelpPage = () => {
  const {
    token: { colorText, colorTextSecondary },
  } = theme.useToken();
  const currentUser = useSelector((state: RootState) => state.auth.currentUser);
  const [form] = Form.useForm<{ message: string }>();
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (values: { message: string }) => {
    setSubmitting(true);
    try {
      await submitPublicContactRequest({
        fullName:
          [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(' ') ||
          'Foydalanuvchi',
        phoneNumber: currentUser?.phoneNumber || '',
        message: values.message.trim(),
        sourcePage: 'profile-help',
        formSessionId: `help-${currentUser?.id || 'anon'}-${Date.now()}`,
      });
      message.success('Murojaatingiz yuborildi. Tez orada bogʻlanamiz.');
      form.resetFields();
    } catch {
      message.error('Yuborishda xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Card style={{ borderRadius: 24, boxShadow: 'var(--color-shadow-soft)' }} bodyStyle={{ padding: 24 }}>
        <Space align="center" size={12} style={{ marginBottom: 4 }}>
          <QuestionCircleOutlined style={{ fontSize: 20, color: '#2563eb' }} />
          <Title level={4} style={{ margin: 0, color: colorText }}>
            Koʻp beriladigan savollar
          </Title>
        </Space>
        <Text style={{ color: colorTextSecondary }}>
          Eng koʻp uchraydigan savollarga javoblar.
        </Text>

        <Collapse
          style={{ marginTop: 18, background: 'transparent' }}
          bordered={false}
          items={FAQ.map((item, i) => ({
            key: String(i),
            label: <Text strong>{item.q}</Text>,
            children: <Text style={{ color: colorTextSecondary }}>{item.a}</Text>,
          }))}
        />
      </Card>

      <Card style={{ borderRadius: 24, boxShadow: 'var(--color-shadow-soft)' }} bodyStyle={{ padding: 24 }}>
        <Space align="center" size={12} style={{ marginBottom: 4 }}>
          <CustomerServiceOutlined style={{ fontSize: 20, color: '#2563eb' }} />
          <Title level={4} style={{ margin: 0, color: colorText }}>
            Qoʻllab-quvvatlashga murojaat
          </Title>
        </Space>
        <Text style={{ color: colorTextSecondary }}>
          Savolingizga javob topa olmadingizmi? Bizga yozing — administrator koʻrib chiqadi.
        </Text>

        <Form form={form} layout="vertical" onFinish={onSubmit} style={{ marginTop: 16 }}>
          <Form.Item
            name="message"
            rules={[
              { required: true, message: 'Xabar matnini kiriting' },
              { min: 10, message: 'Kamida 10 ta belgi' },
            ]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Muammoingizni yoki savolingizni batafsil yozing…"
            />
          </Form.Item>
          <div style={{ textAlign: 'right' }}>
            <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={submitting}>
              Yuborish
            </Button>
          </div>
        </Form>
      </Card>
    </Space>
  );
};

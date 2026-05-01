import {
  Alert,
  Button,
  Col,
  Flex,
  Form,
  Input,
  message,
  Row,
  theme,
  Typography,
} from 'antd';
import { Logo } from '../../components';
import { useMediaQuery } from 'react-responsive';
import { PATH_AUTH, PATH_LANDING } from '../../constants';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { requestPasswordReset } from '../../redux/auth/authApi.ts';

const { Title, Text } = Typography;

type FieldType = {
  email: string;
};

const getReadableResetError = (error: unknown) => {
  const err = error as {
    response?: { data?: { errors?: { message?: string; details?: string }; message?: string; detail?: string } };
    message?: string;
  };

  return (
    err?.response?.data?.errors?.message ||
    err?.response?.data?.errors?.details ||
    err?.response?.data?.detail ||
    err?.response?.data?.message ||
    err?.message ||
    'Parolni tiklash so‘rovini yuborib bo‘lmadi'
  );
};

export const PasswordResetPage = () => {
  const {
    token: { colorPrimary },
  } = theme.useToken();
  const isMobile = useMediaQuery({ maxWidth: 769 });
  const navigate = useNavigate();
  const [form] = Form.useForm<FieldType>();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: FieldType) => {
    setLoading(true);

    try {
      const payload = await requestPasswordReset({
        email: values.email.trim(),
      });

      messageApi.success(
        payload?.message ||
          "Agar email tizimda mavjud bo‘lsa, parolni tiklash havolasi yuborildi"
      );

      form.resetFields();

      setTimeout(() => {
        navigate(PATH_AUTH.signin, { replace: true });
      }, 1800);
    } catch (error) {
      messageApi.error(getReadableResetError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #f6f9ff 0%, #ffffff 100%)',
        padding: isMobile ? '20px 12px' : '32px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {contextHolder}
      <div
        style={{
          width: '100%',
          maxWidth: 1120,
          background: '#ffffff',
          borderRadius: 30,
          overflow: 'hidden',
          border: '1px solid rgba(148,163,184,0.14)',
          boxShadow: '0 28px 80px rgba(15,23,42,0.08)',
        }}
      >
        <Row gutter={0}>
          <Col xs={24} lg={10}>
            <Flex
              vertical
              align="center"
              justify="center"
              className="text-center"
              style={{
                background: `linear-gradient(160deg, ${colorPrimary} 0%, #1d4ed8 100%)`,
                height: '100%',
                minHeight: isMobile ? 220 : 620,
                padding: isMobile ? '28px 22px' : '48px 36px',
              }}
            >
              <Logo color="white" href={PATH_LANDING.root} asLink />
              <Title
                level={isMobile ? 2 : 1}
                className="text-white"
                style={{ marginBottom: 12, letterSpacing: '-0.02em' }}
              >
                Parolni tiklash
              </Title>
              <Text
                className="text-white"
                style={{ fontSize: isMobile ? 16 : 18, maxWidth: 360, lineHeight: 1.6 }}
              >
                Hisobingizga qayta kirish uchun email manzilingizga tiklash havolasini yuboramiz.
              </Text>
            </Flex>
          </Col>

          <Col xs={24} lg={14}>
            <Flex
              vertical
              gap={20}
              style={{
                padding: isMobile ? '28px 20px 24px' : '48px 40px',
              }}
            >
              <div>
                <Title
                  style={{
                    margin: 0,
                    fontSize: isMobile ? 28 : 34,
                    letterSpacing: '-0.02em',
                  }}
                >
                  Parolni unutdingizmi?
                </Title>
                <Text style={{ display: 'block', color: '#52606d', fontSize: 16, marginTop: 10, lineHeight: 1.7 }}>
                  Ro‘yxatdan o‘tgan email manzilingizni kiriting. Tiklash havolasi shu manzilga yuboriladi.
                </Text>
              </div>

              <Flex
                align="center"
                justify="space-between"
                gap={12}
                wrap="wrap"
                style={{
                  padding: '12px 16px',
                  borderRadius: 18,
                  border: '1px solid rgba(191, 219, 254, 0.9)',
                  background: '#f8fbff',
                }}
              >
                <Text style={{ color: '#52606d', fontSize: 15 }}>Parol esingizga tushdimi?</Text>
                <Link
                  to={PATH_AUTH.signin}
                  style={{
                    color: '#2563eb',
                    fontWeight: 700,
                    fontSize: 16,
                    padding: '8px 14px',
                    borderRadius: 999,
                    background: '#ffffff',
                    boxShadow: '0 8px 18px rgba(37,99,235,0.08)',
                  }}
                >
                  Tizimga kirish
                </Link>
              </Flex>

              <Alert
                type="info"
                showIcon
                style={{ borderRadius: 16 }}
                message="Email manzilingiz to‘g‘ri kiritilganiga ishonch hosil qiling"
                description="Agar bunday akkaunt mavjud bo‘lsa, tizim sizga parolni tiklash uchun havola yuboradi."
              />

              <Form<FieldType>
                form={form}
                name="password-reset-form"
                layout="vertical"
                onFinish={onFinish}
                autoComplete="off"
                requiredMark={false}
                style={{ width: '100%' }}
              >
                <Form.Item<FieldType>
                  label="Elektron pochta"
                  name="email"
                  rules={[
                    { required: true, message: 'Email manzilini kiriting' },
                    { type: 'email', message: 'Email formatini tekshiring' },
                  ]}
                >
                  <Input
                    size="large"
                    type="email"
                    placeholder="example@gmail.com"
                    autoComplete="email"
                  />
                </Form.Item>

                <Form.Item style={{ marginBottom: 0 }}>
                  <Flex align="center" gap={12} wrap="wrap">
                    <Button
                      type="primary"
                      htmlType="submit"
                      size="large"
                      loading={loading}
                      style={{ minWidth: isMobile ? '100%' : 210 }}
                    >
                      Tiklash havolasini yuborish
                    </Button>
                    <Button
                      size="large"
                      style={{ minWidth: isMobile ? '100%' : 140 }}
                      onClick={() => navigate(PATH_AUTH.signin)}
                    >
                      Bekor qilish
                    </Button>
                  </Flex>
                </Form.Item>
              </Form>
            </Flex>
          </Col>
        </Row>
      </div>
    </div>
  );
};

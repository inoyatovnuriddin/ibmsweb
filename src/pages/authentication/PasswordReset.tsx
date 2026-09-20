import {
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
import { useSelector } from 'react-redux';
import { requestPasswordReset } from '../../redux/auth/authApi.ts';
import type { RootState } from '../../redux/store.ts';
import { useAppTranslation } from '../../hooks/useAppTranslation.ts';

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
    token: {
      colorPrimary,
      colorBgContainer,
      colorBgElevated,
      colorBorderSecondary,
      colorTextSecondary,
      colorFillTertiary,
    },
  } = theme.useToken();
  const { mytheme } = useSelector((state: RootState) => state.theme);
  const { t } = useAppTranslation();
  const isMobile = useMediaQuery({ maxWidth: 769 });
  const isDark = mytheme === 'dark';
  const navigate = useNavigate();
  const [form] = Form.useForm<FieldType>();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const pageBackground = isDark
    ? 'radial-gradient(circle at top, rgba(37,99,235,0.18) 0%, transparent 34%), var(--home-bg)'
    : 'linear-gradient(180deg, #f6f9ff 0%, #ffffff 100%)';

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
        background: pageBackground,
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
          background: colorBgContainer,
          borderRadius: 30,
          overflow: 'hidden',
          border: `1px solid ${colorBorderSecondary}`,
          boxShadow: 'var(--color-shadow-elevated)',
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
                {t('auth.reset.title')}
              </Title>
              <Text
                className="text-white"
                style={{ fontSize: isMobile ? 16 : 18, maxWidth: 360, lineHeight: 1.6 }}
              >
                {t('auth.reset.subtitle')}
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
                  {t('auth.reset.heading')}
                </Title>
                <Text style={{ display: 'block', color: colorTextSecondary, fontSize: 16, marginTop: 10, lineHeight: 1.7 }}>
                  {t('auth.reset.description')}
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
                  border: `1px solid ${colorBorderSecondary}`,
                  background: colorFillTertiary,
                }}
              >
                <Text style={{ color: colorTextSecondary, fontSize: 15 }}>{t('auth.reset.remembered')}</Text>
                <Link
                  to={PATH_AUTH.signin}
                  style={{
                    color: colorPrimary,
                    fontWeight: 700,
                    fontSize: 16,
                    padding: '8px 14px',
                    borderRadius: 999,
                    background: colorBgElevated,
                    boxShadow: 'var(--color-shadow-soft)',
                  }}
                >
                  {t('auth.signIn.submit')}
                </Link>
              </Flex>
              
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
                  label={t('auth.form.email')}
                  name="email"
                  rules={[
                    { required: true, message: t('auth.validation.emailRequired') },
                    { type: 'email', message: t('auth.validation.emailInvalid') },
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
                      {t('auth.reset.send')}
                    </Button>
                    <Button
                      size="large"
                      style={{ minWidth: isMobile ? '100%' : 140 }}
                      onClick={() => navigate(PATH_AUTH.signin)}
                    >
                      {t('auth.reset.cancel')}
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

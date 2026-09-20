import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Col,
  Flex,
  Form,
  Input,
  message,
  Result,
  Row,
  Space,
  Spin,
  theme,
  Typography,
} from 'antd';
import { useMediaQuery } from 'react-responsive';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Logo } from '../../components';
import { PATH_AUTH, PATH_LANDING } from '../../constants';
import {
  confirmPasswordReset,
  validatePasswordResetToken,
} from '../../redux/auth/authApi.ts';
import type { RootState } from '../../redux/store.ts';
import { useAppTranslation } from '../../hooks/useAppTranslation.ts';

const { Title, Text } = Typography;

type ResetPasswordFormValues = {
  password: string;
  confirmPassword: string;
};

const getReadableResetError = (error: unknown, fallback: string) => {
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
    fallback
  );
};

export const ResetPasswordConfirmPage = () => {
  const {
    token: {
      colorPrimary,
      colorBgContainer,
      colorBorderSecondary,
      colorTextSecondary,
    },
  } = theme.useToken();
  const { mytheme } = useSelector((state: RootState) => state.theme);
  const { t } = useAppTranslation();
  const isMobile = useMediaQuery({ maxWidth: 769 });
  const isDark = mytheme === 'dark';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm<ResetPasswordFormValues>();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [validatedEmail, setValidatedEmail] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const token = useMemo(() => searchParams.get('token')?.trim() || '', [searchParams]);
  const pageBackground = isDark
    ? 'radial-gradient(circle at top, rgba(37,99,235,0.18) 0%, transparent 34%), var(--home-bg)'
    : 'linear-gradient(180deg, #f6f9ff 0%, #ffffff 100%)';

  useEffect(() => {
    let mounted = true;

    const runValidation = async () => {
      if (!token) {
        setValidationError(t('auth.resetConfirm.invalidTitle'));
        setValidating(false);
        setIsValid(false);
        return;
      }

      setValidating(true);
      setValidationError(null);

      try {
        const payload = await validatePasswordResetToken(token);
        if (!mounted) return;
        setIsValid(Boolean(payload?.valid));
        setValidatedEmail(payload?.email || null);
      } catch (error) {
        if (!mounted) return;
        setIsValid(false);
        setValidationError(getReadableResetError(error, t('auth.resetConfirm.invalidTitle')));
      } finally {
        if (mounted) setValidating(false);
      }
    };

    void runValidation();

    return () => {
      mounted = false;
    };
  }, [token]);

  const handleSubmit = async (values: ResetPasswordFormValues) => {
    setLoading(true);

    try {
      const payload = await confirmPasswordReset({
        token,
        password: values.password,
        confirmPassword: values.confirmPassword,
      });

      messageApi.success(
        payload?.message ||
          t('auth.resetConfirm.success')
      );

      setTimeout(() => {
        navigate(PATH_AUTH.signin, { replace: true });
      }, 1600);
    } catch (error) {
      messageApi.error(getReadableResetError(error, t('auth.resetConfirm.invalidTitle')));
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
                {t('auth.resetConfirm.heroTitle')}
              </Title>
              <Text
                className="text-white"
                style={{ fontSize: isMobile ? 16 : 18, maxWidth: 360, lineHeight: 1.6 }}
              >
                {t('auth.resetConfirm.heroSubtitle')}
              </Text>
            </Flex>
          </Col>

          <Col xs={24} lg={14}>
            <Flex
              vertical
              gap={20}
              style={{
                padding: isMobile ? '28px 20px 24px' : '48px 40px',
                minHeight: '100%',
              }}
            >
              {validating ? (
                <Flex align="center" justify="center" style={{ minHeight: 320 }}>
                  <Spin size="large" />
                </Flex>
              ) : !isValid ? (
                <Result
                  status="error"
                  title={t('auth.resetConfirm.invalidTitle')}
                  subTitle={validationError || t('auth.resetConfirm.invalidSubtitle')}
                  extra={
                    <Space wrap>
                      <Link to={PATH_AUTH.passwordReset}>
                        <Button type="primary" size="large">
                          {t('auth.resetConfirm.resend')}
                        </Button>
                      </Link>
                      <Link to={PATH_AUTH.signin}>
                        <Button size="large">{t('auth.signIn.submit')}</Button>
                      </Link>
                    </Space>
                  }
                />
              ) : (
                <>
                  <div>
                    <Title
                      style={{
                        margin: 0,
                        fontSize: isMobile ? 28 : 34,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {t('auth.resetConfirm.heading')}
                    </Title>
                    <Text style={{ display: 'block', color: colorTextSecondary, fontSize: 16, marginTop: 10, lineHeight: 1.7 }}>
                      {validatedEmail
                        ? `${validatedEmail} ${t('auth.resetConfirm.headingWithEmail')}`
                        : t('auth.resetConfirm.description')}
                    </Text>
                  </div>

                  <Alert
                    type="info"
                    showIcon
                    style={{ borderRadius: 16 }}
                    message={t('auth.resetConfirm.passwordHintTitle')}
                    description={t('auth.resetConfirm.passwordHintText')}
                  />

                  <Form<ResetPasswordFormValues>
                    form={form}
                    name="reset-password-confirm-form"
                    layout="vertical"
                    onFinish={handleSubmit}
                    autoComplete="off"
                    requiredMark={false}
                    style={{ width: '100%' }}
                  >
                    <Form.Item
                      label={t('auth.form.password')}
                      name="password"
                      rules={[{ required: true, message: t('auth.validation.passwordRequired') }]}
                    >
                      <Input.Password size="large" autoComplete="new-password" />
                    </Form.Item>

                    <Form.Item
                      label={t('auth.form.confirmPassword')}
                      name="confirmPassword"
                      dependencies={['password']}
                      rules={[
                        { required: true, message: t('auth.validation.confirmPasswordRequired') },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue('password') === value) {
                              return Promise.resolve();
                            }

                            return Promise.reject(new Error(t('auth.validation.confirmPasswordMismatch')));
                          },
                        }),
                      ]}
                    >
                      <Input.Password size="large" autoComplete="new-password" />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0 }}>
                      <Flex align="center" gap={12} wrap="wrap">
                        <Button
                          type="primary"
                          htmlType="submit"
                          size="large"
                          loading={loading}
                          style={{ minWidth: isMobile ? '100%' : 200 }}
                        >
                          {t('auth.resetConfirm.submit')}
                        </Button>
                        <Link to={PATH_AUTH.signin} style={{ width: isMobile ? '100%' : 'auto' }}>
                          <Button size="large" style={{ minWidth: isMobile ? '100%' : 140 }}>
                            {t('auth.reset.cancel')}
                          </Button>
                        </Link>
                      </Flex>
                    </Form.Item>
                  </Form>
                </>
              )}
            </Flex>
          </Col>
        </Row>
      </div>
    </div>
  );
};

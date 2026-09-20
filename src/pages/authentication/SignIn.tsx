import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Col,
  Divider,
  Flex,
  Form,
  Input,
  message,
  Row,
  theme,
  Typography,
} from 'antd';
import { useMediaQuery } from 'react-responsive';
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Logo } from '../../components';
import { TelegramAuthWidget } from '../../components/TelegramAuthWidget.tsx';
import { PATH_AUTH, PATH_COURSE } from '../../constants';
import {
  type CurrentUser,
  fetchCurrentUser,
  loginWithIdentifier,
  loginWithTelegram,
  type TelegramWidgetUser,
} from '../../redux/auth/authApi.ts';
import {
  buildGoogleOauthUrl,
  saveOauthIntent,
  TELEGRAM_BOT_USERNAME,
} from '../../redux/auth/authSession.ts';
import type { RootState } from '../../redux/store.ts';
import { setCurrentUser, setSession } from '../../redux/auth/authSlice.ts';
import { AuthProviderButtons } from './AuthProviderButtons.tsx';
import { useAppTranslation } from '../../hooks/useAppTranslation.ts';

const { Title, Text } = Typography;

type SignInFormValues = {
  identifier: string;
  password: string;
};

const getReadableLoginError = (error: unknown, t: (key: string) => string) => {
  const err = error as {
    response?: { status?: number; data?: { message?: string; detail?: string; errors?: { message?: string } } };
    message?: string;
  };

  const rawMessage =
    err?.response?.data?.errors?.message ||
    err?.response?.data?.detail ||
    err?.response?.data?.message ||
    err?.message ||
    '';

  if (err?.response?.status === 401) {
    if (/password login/i.test(rawMessage) || /google orqali kiring/i.test(rawMessage)) {
      return t('auth.errors.googleOnly');
    }

    return t('auth.errors.invalidCredentials');
  }

  return rawMessage || t('auth.errors.loginFailed');
};

const getReadableTelegramError = (error: unknown, t: (key: string) => string) => {
  const err = error as {
    response?: { status?: number; data?: { message?: string; detail?: string; errors?: { message?: string } } };
    message?: string;
  };

  return (
    err?.response?.data?.errors?.message ||
    err?.response?.data?.detail ||
    err?.response?.data?.message ||
    err?.message ||
    t('auth.errors.telegramFailed')
  );
};

const resolvePostLoginPath = (user: CurrentUser, fallbackPath?: string) => {
  if (user.roles.includes('ROLE_ADMIN')) {
    return '/dashboards/users';
  }

  return fallbackPath || PATH_COURSE.catalog;
};

export const SignInPage = () => {
  const {
    token: {
      colorPrimary,
      colorBgContainer,
      colorBgElevated,
      colorBorderSecondary,
      colorText,
      colorTextSecondary,
      colorFillTertiary,
    },
  } = theme.useToken();
  const { mytheme } = useSelector((state: RootState) => state.theme);
  const { t } = useAppTranslation();
  const isMobile = useMediaQuery({ maxWidth: 769 });
  const isDark = mytheme === 'dark';
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm<SignInFormValues>();
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(false);

  const oauthError = useMemo(() => searchParams.get('oauth2Error'), [searchParams]);
  const telegramBotUsername = TELEGRAM_BOT_USERNAME;
  const redirectAfterLogin =
    (location.state as { from?: string } | null)?.from || PATH_COURSE.catalog;
  const pageBackground = isDark
    ? 'radial-gradient(circle at top, rgba(37,99,235,0.18) 0%, transparent 34%), var(--home-bg)'
    : 'linear-gradient(180deg, #f6f9ff 0%, #ffffff 100%)';

  useEffect(() => {
    if (!oauthError) return;
    messageApi.error(decodeURIComponent(oauthError));
  }, [messageApi, oauthError]);

  const handleSubmit = async (values: SignInFormValues) => {
    setLoading(true);

    try {
      const tokenPayload = await loginWithIdentifier({
        identifier: values.identifier.trim(),
        password: values.password,
      });

      if (!tokenPayload?.id_token) {
        throw new Error(t('auth.errors.tokenMissing'));
      }

      dispatch(setSession(tokenPayload.id_token));
      const currentUser = await fetchCurrentUser();
      dispatch(setCurrentUser(currentUser));

      navigate(resolvePostLoginPath(currentUser, redirectAfterLogin), { replace: true });
    } catch (error) {
      form.setFieldsValue({ password: '' });
      messageApi.error(getReadableLoginError(error, t));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    if (oauthLoading) return;
    setOauthLoading(true);
    saveOauthIntent('signin');
    window.location.href = buildGoogleOauthUrl();
  };

  const handleTelegramLogin = async (user: TelegramWidgetUser) => {
    setTelegramLoading(true);

    try {
      const payload = await loginWithTelegram(user);

      if (!payload?.id_token) {
        throw new Error(t('auth.errors.tokenMissing'));
      }

      dispatch(setSession(payload.id_token));
      const currentUser = await fetchCurrentUser();
      dispatch(setCurrentUser(currentUser));

      if (payload.needs_profile_completion) {
        navigate(PATH_AUTH.completeProfile, { replace: true });
        return;
      }

      navigate(resolvePostLoginPath(currentUser, redirectAfterLogin), { replace: true });
    } catch (error) {
      messageApi.error(getReadableTelegramError(error, t));
    } finally {
      setTelegramLoading(false);
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
          maxWidth: 1140,
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
                minHeight: isMobile ? 220 : 700,
                padding: isMobile ? '28px 22px' : '48px 36px',
              }}
            >
              <Logo href="/" asLink color="white" />
              <Title
                level={isMobile ? 2 : 1}
                className="text-white"
                style={{ marginBottom: 12, letterSpacing: '-0.02em' }}
              >
                {t('auth.signIn.title')}
              </Title>
              <Text
                className="text-white"
                style={{ fontSize: isMobile ? 16 : 18, maxWidth: 360, lineHeight: 1.6 }}
              >
                {t('auth.signIn.subtitle')}
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
              {oauthError ? (
                <Alert
                  type="error"
                  showIcon
                  style={{ width: '100%' }}
                  message={t('auth.errors.oauthGoogle')}
                  description={decodeURIComponent(oauthError)}
                />
              ) : null}

              <div>
                <Title
                  style={{
                    margin: 0,
                    fontSize: isMobile ? 28 : 34,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {t('auth.signIn.title')}
                </Title>
                <Flex
                  align="center"
                  justify="space-between"
                  gap={12}
                  wrap="wrap"
                  style={{
                    marginTop: 14,
                    padding: '12px 16px',
                    borderRadius: 18,
                    border: `1px solid ${colorBorderSecondary}`,
                    background: colorFillTertiary,
                  }}
                >
                  <Text style={{ color: colorTextSecondary, fontSize: 15 }}>{t('auth.signIn.noAccount')}</Text>
                  <Link
                    to={PATH_AUTH.signup}
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
                    {t('auth.signIn.signUp')}
                  </Link>
                </Flex>
              </div>

              <AuthProviderButtons
                googleLabel={t('auth.signIn.google')}
                googleLoading={oauthLoading}
                onGoogleClick={handleGoogleLogin}
                telegramContent={
                  <div
                    style={{
                      borderRadius: 24,
                      border: `1px solid ${colorBorderSecondary}`,
                      background: colorFillTertiary,
                      padding: '14px 16px',
                    }}
                  >
                    <Flex
                      align="center"
                      justify="space-between"
                      gap={12}
                      wrap="wrap"
                      style={{ marginBottom: 12 }}
                    >
                      <div>
                        <Text
                          style={{
                            display: 'block',
                            color: colorText,
                            fontWeight: 700,
                            fontSize: 16,
                          }}
                        >
                          {t('auth.signIn.telegram')}
                        </Text>
                        <Text style={{ color: colorTextSecondary, fontSize: 14 }}>
                          {t('auth.signIn.telegramHint')}
                        </Text>
                      </div>
                      {telegramLoading ? <Text style={{ color: colorPrimary }}>Tekshirilmoqda...</Text> : null}
                    </Flex>

                    <TelegramAuthWidget
                      callbackName="onTelegramAuth"
                      botUsername={telegramBotUsername}
                      onAuth={handleTelegramLogin}
                    />
                  </div>
                }
              />

              <Divider className="m-0">{t('auth.common.or')}</Divider>

              <Form<SignInFormValues>
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                autoComplete="off"
                requiredMark={false}
                initialValues={{ identifier: '', password: '' }}
                style={{ width: '100%' }}
              >
                <Form.Item
                  label={t('auth.signIn.identifier')}
                  name="identifier"
                  rules={[
                    { required: true, message: `${t('auth.signIn.identifier')} kiriting` },
                  ]}
                >
                  <Input
                    size="large"
                    placeholder={`${t('auth.signIn.identifier')} kiriting`}
                    autoComplete="username"
                  />
                </Form.Item>

                <Form.Item
                  label={t('auth.signIn.password')}
                  name="password"
                  rules={[{ required: true, message: `${t('auth.signIn.password')} kiriting` }]}
                >
                  <Input.Password size="large" autoComplete="current-password" />
                </Form.Item>

                <Form.Item style={{ marginBottom: 0 }}>
                  <Flex align="center" justify="space-between" gap={12} wrap="wrap">
                    <Button
                      type="primary"
                      htmlType="submit"
                      size="large"
                      loading={loading}
                      style={{ minWidth: isMobile ? '100%' : 172 }}
                    >
                      {t('auth.signIn.submit')}
                    </Button>
                    <Link to={PATH_AUTH.passwordReset} style={{ color: colorPrimary }}>
                      {t('auth.signIn.forgotPassword')}
                    </Link>
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

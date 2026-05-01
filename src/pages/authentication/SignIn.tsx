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
import { useDispatch } from 'react-redux';
import { Logo } from '../../components';
import { PATH_AUTH, PATH_COURSE } from '../../constants';
import {
  type CurrentUser,
  fetchCurrentUser,
  loginWithIdentifier,
} from '../../redux/auth/authApi.ts';
import {
  buildGoogleOauthUrl,
  saveOauthIntent,
} from '../../redux/auth/authSession.ts';
import { setCurrentUser, setSession } from '../../redux/auth/authSlice.ts';
import { AuthProviderButtons } from './AuthProviderButtons.tsx';

const { Title, Text } = Typography;

type SignInFormValues = {
  identifier: string;
  password: string;
};

const getReadableLoginError = (error: unknown) => {
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
      return "Bu akkaunt uchun hozircha parol orqali kirish yoqilmagan. Google orqali kiring yoki profilingizni to‘ldiring.";
    }

    return 'Telefon/email yoki parol noto‘g‘ri';
  }

  return rawMessage || 'Kirishda xatolik yuz berdi';
};

const resolvePostLoginPath = (user: CurrentUser, fallbackPath?: string) => {
  if (user.roles.includes('ROLE_ADMIN')) {
    return '/dashboards/users';
  }

  return fallbackPath || PATH_COURSE.catalog;
};

export const SignInPage = () => {
  const {
    token: { colorPrimary },
  } = theme.useToken();
  const isMobile = useMediaQuery({ maxWidth: 769 });
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm<SignInFormValues>();
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  const oauthError = useMemo(() => searchParams.get('oauth2Error'), [searchParams]);
  const redirectAfterLogin =
    (location.state as { from?: string } | null)?.from || PATH_COURSE.catalog;

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
        throw new Error('Token topilmadi');
      }

      dispatch(setSession(tokenPayload.id_token));
      const currentUser = await fetchCurrentUser();
      dispatch(setCurrentUser(currentUser));

      messageApi.success('Kirish muvaffaqiyatli amalga oshirildi');
      navigate(resolvePostLoginPath(currentUser, redirectAfterLogin), { replace: true });
    } catch (error) {
      form.setFieldsValue({ password: '' });
      messageApi.error(getReadableLoginError(error));
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
          maxWidth: 1140,
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
                Tizimga kirish
              </Title>
              <Text
                className="text-white"
                style={{ fontSize: isMobile ? 16 : 18, maxWidth: 360, lineHeight: 1.6 }}
              >
                Kurslar va shaxsiy kabinetga qulay tarzda kiring.
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
                  message="Google akkaunt orqali kirishda xatolik yuz berdi"
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
                  Kirish
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
                    border: '1px solid rgba(191, 219, 254, 0.9)',
                    background: '#f8fbff',
                  }}
                >
                  <Text style={{ color: '#52606d', fontSize: 15 }}>Akkauntingiz yo‘qmi?</Text>
                  <Link
                    to={PATH_AUTH.signup}
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
                    Ro‘yxatdan o‘tish
                  </Link>
                </Flex>
              </div>

              <AuthProviderButtons
                googleLabel="Google orqali kirish"
                googleLoading={oauthLoading}
                onGoogleClick={handleGoogleLogin}
              />

              <Divider className="m-0">yoki</Divider>

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
                  label="Telefon raqam yoki email"
                  name="identifier"
                  rules={[
                    { required: true, message: 'Telefon raqam yoki email kiriting' },
                  ]}
                >
                  <Input
                    size="large"
                    placeholder="Telefon raqam yoki email kiriting"
                    autoComplete="username"
                  />
                </Form.Item>

                <Form.Item
                  label="Parol"
                  name="password"
                  rules={[{ required: true, message: 'Parolni kiriting' }]}
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
                      Tizimga kirish
                    </Button>
                    <Link to={PATH_AUTH.passwordReset}>Parolni unutdingizmi?</Link>
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

import { useState } from 'react';
import {
  Button,
  Col,
  DatePicker,
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
import { Link, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useDispatch } from 'react-redux';
import { Logo } from '../../components';
import { PATH_AUTH, PATH_COURSE } from '../../constants';
import {
  fetchCurrentUser,
  signupWithLocalAccount,
} from '../../redux/auth/authApi.ts';
import {
  buildGoogleOauthUrl,
  saveOauthIntent,
} from '../../redux/auth/authSession.ts';
import { setCurrentUser, setSession } from '../../redux/auth/authSlice.ts';
import { AuthProviderButtons } from './AuthProviderButtons.tsx';

const { Title, Text } = Typography;

type SignUpFormValues = {
  firstname: string;
  lastname: string;
  middlename?: string;
  email: string;
  phoneNumber: string;
  birthday: dayjs.Dayjs;
  passportId: string;
  password: string;
  confirmPassword: string;
};

const getReadableSignupError = (error: unknown) => {
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

  if (/email/i.test(rawMessage) && /exists|mavjud|registered/i.test(rawMessage)) {
    return 'Bu email bilan akkaunt allaqachon mavjud';
  }

  if (/phone|telefon/i.test(rawMessage) && /exists|mavjud|registered/i.test(rawMessage)) {
    return "Bu telefon raqam allaqachon ro‘yxatdan o‘tgan";
  }

  if (/confirm/i.test(rawMessage) || /match/i.test(rawMessage)) {
    return 'Parol va parol tasdig‘i mos emas';
  }

  return rawMessage || "Ro‘yxatdan o‘tishda xatolik yuz berdi";
};

export const SignUpPage = () => {
  const {
    token: { colorPrimary },
  } = theme.useToken();
  const isMobile = useMediaQuery({ maxWidth: 769 });
  const [form] = Form.useForm<SignUpFormValues>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  const handleGoogleAuth = () => {
    if (oauthLoading) return;
    setOauthLoading(true);
    saveOauthIntent('signup');
    window.location.href = buildGoogleOauthUrl();
  };

  const handleSubmit = async (values: SignUpFormValues) => {
    setLoading(true);

    try {
      const tokenPayload = await signupWithLocalAccount({
        firstname: values.firstname.trim(),
        lastname: values.lastname.trim(),
        middlename: values.middlename?.trim() || '',
        email: values.email.trim(),
        phoneNumber: values.phoneNumber.trim(),
        password: values.password,
        confirmPassword: values.confirmPassword,
        birthday: values.birthday.format('YYYY-MM-DD'),
        passportId: values.passportId.trim(),
      });

      if (!tokenPayload?.id_token) {
        throw new Error('Token topilmadi');
      }

      dispatch(setSession(tokenPayload.id_token));
      const currentUser = await fetchCurrentUser();
      dispatch(setCurrentUser(currentUser));

      messageApi.success("Ro‘yxatdan o‘tish muvaffaqiyatli yakunlandi");
      navigate(
        currentUser.profileCompleted ? PATH_COURSE.catalog : PATH_AUTH.completeProfile,
        { replace: true }
      );
    } catch (error) {
      messageApi.error(getReadableSignupError(error));
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
          maxWidth: 1240,
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
                minHeight: isMobile ? 220 : 780,
                padding: isMobile ? '28px 22px' : '48px 36px',
              }}
            >
              <Logo color="white" href="/" asLink />
              <Title
                level={isMobile ? 2 : 1}
                className="text-white"
                style={{ marginBottom: 12, letterSpacing: '-0.02em' }}
              >
                Yangi akkaunt yarating
              </Title>
              <Text
                className="text-white"
                style={{ fontSize: isMobile ? 16 : 18, maxWidth: 380, lineHeight: 1.6 }}
              >
                Ro‘yxatdan o‘ting va o‘qishni boshlang.
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
                  Ro‘yxatdan o‘tish
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
                  <Text style={{ color: '#52606d', fontSize: 15 }}>Allaqachon akkauntingiz bormi?</Text>
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
              </div>

              <AuthProviderButtons
                googleLabel="Google orqali ro‘yxatdan o‘tish"
                googleLoading={oauthLoading}
                onGoogleClick={handleGoogleAuth}
              />

              <Divider className="m-0">yoki</Divider>

              <Form<SignUpFormValues>
                form={form}
                name="sign-up-form"
                layout="vertical"
                onFinish={handleSubmit}
                autoComplete="off"
                requiredMark={false}
                style={{ width: '100%' }}
              >
                <Row gutter={[12, 0]}>
                  <Col xs={24} md={8}>
                    <Form.Item
                      label="Ism"
                      name="firstname"
                      rules={[{ required: true, message: 'Ismni kiriting' }]}
                    >
                      <Input size="large" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      label="Familiya"
                      name="lastname"
                      rules={[{ required: true, message: 'Familiyani kiriting' }]}
                    >
                      <Input size="large" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item label="Sharif" name="middlename">
                      <Input size="large" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Email"
                      name="email"
                      rules={[
                        { required: true, message: 'Email kiriting' },
                        { type: 'email', message: 'Email formatini tekshiring' },
                      ]}
                    >
                      <Input size="large" autoComplete="email" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Telefon raqam"
                      name="phoneNumber"
                      rules={[{ required: true, message: 'Telefon raqam kiriting' }]}
                    >
                      <Input size="large" placeholder="+998901234567" autoComplete="tel" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Tug‘ilgan sana"
                      name="birthday"
                      rules={[{ required: true, message: "Tug‘ilgan sanani tanlang" }]}
                    >
                      <DatePicker size="large" style={{ width: '100%' }} format="YYYY-MM-DD" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Passport seriya va raqami"
                      name="passportId"
                      rules={[{ required: true, message: 'Passport ma’lumotini kiriting' }]}
                    >
                      <Input size="large" placeholder="AA1234567" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Parol"
                      name="password"
                      rules={[{ required: true, message: 'Parolni kiriting' }]}
                    >
                      <Input.Password size="large" autoComplete="new-password" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Parolni tasdiqlang"
                      name="confirmPassword"
                      dependencies={['password']}
                      rules={[
                        { required: true, message: 'Parolni tasdiqlang' },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue('password') === value) {
                              return Promise.resolve();
                            }

                            return Promise.reject(new Error('Parollar mos emas'));
                          },
                        }),
                      ]}
                    >
                      <Input.Password size="large" autoComplete="new-password" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item style={{ marginBottom: 0 }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    loading={loading}
                    style={{ minWidth: isMobile ? '100%' : 180 }}
                  >
                    Ro‘yxatdan o‘tish
                  </Button>
                </Form.Item>
              </Form>
            </Flex>
          </Col>
        </Row>
      </div>
    </div>
  );
};

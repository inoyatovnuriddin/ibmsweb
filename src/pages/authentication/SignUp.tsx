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
import { useDispatch, useSelector } from 'react-redux';
import { PhoneInput } from 'react-international-phone';
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
import type { RootState } from '../../redux/store.ts';
import { setCurrentUser, setSession } from '../../redux/auth/authSlice.ts';
import { AuthProviderButtons } from './AuthProviderButtons.tsx';
import { useAppTranslation } from '../../hooks/useAppTranslation.ts';
import 'react-international-phone/style.css';

const { Title, Text } = Typography;

const NAME_MAX_LENGTH = 32;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 16;

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

const getReadableSignupError = (error: unknown, t: (key: string) => string) => {
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
    return t('auth.errors.emailExists');
  }

  if (/phone|telefon/i.test(rawMessage) && /exists|mavjud|registered/i.test(rawMessage)) {
    return t('auth.errors.phoneExists');
  }

  if (/confirm/i.test(rawMessage) || /match/i.test(rawMessage)) {
    return t('auth.errors.passwordMismatch');
  }

  return rawMessage || t('auth.errors.signupFailed');
};

export const SignUpPage = () => {
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
  const [form] = Form.useForm<SignUpFormValues>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const phoneNumberValue = Form.useWatch('phoneNumber', form) || '';
  const pageBackground = isDark
    ? 'radial-gradient(circle at top, rgba(37,99,235,0.18) 0%, transparent 34%), var(--home-bg)'
    : 'linear-gradient(180deg, #f6f9ff 0%, #ffffff 100%)';

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
        passportId: values.passportId.trim().toUpperCase(),
      });

      if (!tokenPayload?.id_token) {
        throw new Error(t('auth.errors.tokenMissing'));
      }

      dispatch(setSession(tokenPayload.id_token));
      const currentUser = await fetchCurrentUser();
      dispatch(setCurrentUser(currentUser));

      navigate(
        currentUser.profileCompleted ? PATH_COURSE.catalog : PATH_AUTH.completeProfile,
        { replace: true }
      );
    } catch (error) {
      messageApi.error(getReadableSignupError(error, t));
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
          maxWidth: 1240,
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
                {t('auth.signUp.title')}
              </Title>
              <Text
                className="text-white"
                style={{ fontSize: isMobile ? 16 : 18, maxWidth: 380, lineHeight: 1.6 }}
              >
                {t('auth.signUp.subtitle')}
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
                  {t('auth.signUp.title')}
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
                  <Text style={{ color: colorTextSecondary, fontSize: 15 }}>{t('auth.signUp.hasAccount')}</Text>
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
                    {t('auth.signUp.signIn')}
                  </Link>
                </Flex>
              </div>

              <AuthProviderButtons
                googleLabel={t('auth.signUp.google')}
                googleLoading={oauthLoading}
                onGoogleClick={handleGoogleAuth}
              />

              <Divider className="m-0">{t('auth.common.or')}</Divider>

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
                      label={t('auth.form.firstName')}
                      name="firstname"
                      rules={[
                        { required: true, message: t('auth.validation.firstNameRequired') },
                        {
                          max: NAME_MAX_LENGTH,
                          message: t('auth.validation.firstNameMax'),
                        },
                      ]}
                    >
                      <Input size="large" maxLength={NAME_MAX_LENGTH} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      label={t('auth.form.lastName')}
                      name="lastname"
                      rules={[
                        { required: true, message: t('auth.validation.lastNameRequired') },
                        {
                          max: NAME_MAX_LENGTH,
                          message: t('auth.validation.lastNameMax'),
                        },
                      ]}
                    >
                      <Input size="large" maxLength={NAME_MAX_LENGTH} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      label={t('auth.form.middleName')}
                      name="middlename"
                      rules={[
                        {
                          max: NAME_MAX_LENGTH,
                          message: t('auth.validation.middleNameMax'),
                        },
                      ]}
                    >
                      <Input size="large" maxLength={NAME_MAX_LENGTH} />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label={t('auth.form.email')}
                      name="email"
                      rules={[
                        { required: true, message: t('auth.validation.emailRequired') },
                        { type: 'email', message: t('auth.validation.emailInvalid') },
                      ]}
                    >
                      <Input size="large" autoComplete="email" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label={t('auth.form.phone')}
                      name="phoneNumber"
                      validateTrigger={['onBlur', 'onSubmit']}
                      rules={[
                        { required: true, message: t('auth.validation.phoneRequired') },
                        {
                          validator: (_, value: string) => {
                            const normalizedPhone = String(value || '').replace(/[^\d+]/g, '');
                            const digitCount = normalizedPhone.replace(/\D/g, '').length;

                            if (
                              normalizedPhone.startsWith('+') &&
                              digitCount >= 11 &&
                              digitCount <= 15
                            ) {
                              return Promise.resolve();
                            }

                            return Promise.reject(
                              new Error(t('auth.validation.phoneInvalid'))
                            );
                          },
                        },
                      ]}
                      getValueFromEvent={(value: string) => value}
                    >
                      <PhoneInput
                        defaultCountry="uz"
                        preferredCountries={['uz', 'ru']}
                        value={phoneNumberValue}
                        onChange={(value) => form.setFieldValue('phoneNumber', value)}
                        disableDialCodePrefill={false}
                        forceDialCode
                        inputProps={{
                          name: 'phoneNumber',
                          required: true,
                          autoComplete: 'tel',
                        }}
                        style={{
                          width: '100%',
                          height: 40,
                          display: 'flex',
                          alignItems: 'stretch',
                        }}
                        inputStyle={{
                          width: '100%',
                          height: '100%',
                          borderRadius: '0 12px 12px 0',
                          borderColor: colorBorderSecondary,
                          color: colorText,
                          fontSize: 15,
                          background: colorBgElevated,
                          boxSizing: 'border-box',
                        }}
                        countrySelectorStyleProps={{
                          buttonStyle: {
                            height: '100%',
                            minHeight: 40,
                            borderRadius: '12px 0 0 12px',
                            borderColor: colorBorderSecondary,
                            background: colorFillTertiary,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingInline: 12,
                          },
                          dropdownStyleProps: {
                            style: {
                              borderRadius: 18,
                              background: colorBgElevated,
                              boxShadow: 'var(--color-shadow-elevated)',
                              border: `1px solid ${colorBorderSecondary}`,
                              color: colorText,
                            },
                          },
                        }}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label={t('auth.form.birthDate')}
                      name="birthday"
                      rules={[{ required: true, message: t('auth.validation.birthDateRequired') }]}
                    >
                      <DatePicker size="large" style={{ width: '100%' }} format="YYYY-MM-DD" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label={t('auth.form.passport')}
                      name="passportId"
                      // Формат не проверяем: кроме AA1234567 встречаются и другие документы.
                      rules={[{ required: true, message: t('auth.validation.passportRequired') }]}
                      getValueFromEvent={(event) =>
                        event?.target?.value?.toUpperCase().replace(/\s+/g, '') || ''
                      }
                    >
                      <Input size="large" placeholder="AA1234567" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label={t('auth.form.password')}
                      name="password"
                      rules={[
                        { required: true, message: t('auth.validation.passwordRequired') },
                        {
                          min: PASSWORD_MIN_LENGTH,
                          message: t('auth.validation.passwordLength'),
                        },
                        {
                          max: PASSWORD_MAX_LENGTH,
                          message: t('auth.validation.passwordLength'),
                        },
                      ]}
                    >
                      <Input.Password
                        size="large"
                        autoComplete="new-password"
                        maxLength={PASSWORD_MAX_LENGTH}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label={t('auth.form.confirmPassword')}
                      name="confirmPassword"
                      dependencies={['password']}
                      rules={[
                        { required: true, message: t('auth.validation.confirmPasswordRequired') },
                        {
                          min: PASSWORD_MIN_LENGTH,
                          message: t('auth.validation.confirmPasswordLength'),
                        },
                        {
                          max: PASSWORD_MAX_LENGTH,
                          message: t('auth.validation.confirmPasswordLength'),
                        },
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
                      <Input.Password
                        size="large"
                        autoComplete="new-password"
                        maxLength={PASSWORD_MAX_LENGTH}
                      />
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
                    {t('auth.signUp.submit')}
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

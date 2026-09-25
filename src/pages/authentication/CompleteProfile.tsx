import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  message,
  Row,
  Space,
  theme,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../../redux/store.ts';
import { completeProfile, fetchCurrentUser } from '../../redux/auth/authApi.ts';
import { setCurrentUser } from '../../redux/auth/authSlice.ts';
import { PATH_COURSE } from '../../constants';
import { readAccessToken } from '../../redux/auth/authSession.ts';
import { useAppTranslation } from '../../hooks/useAppTranslation.ts';

const { Title, Paragraph, Text } = Typography;

type CompleteProfileValues = {
  phoneNumber: string;
  birthday: dayjs.Dayjs;
  passportId: string;
  password?: string;
  confirmPassword?: string;
};

const getReadableError = (error: unknown, fallback: string) => {
  const err = error as {
    response?: { data?: { message?: string; detail?: string; errors?: { message?: string } } };
    message?: string;
  };

  return (
    err?.response?.data?.errors?.message ||
    err?.response?.data?.detail ||
    err?.response?.data?.message ||
    err?.message ||
    fallback
  );
};

export const CompleteProfilePage = () => {
  const {
    token: {
      colorBgContainer,
      colorBorderSecondary,
      colorPrimary,
      colorTextSecondary,
    },
  } = theme.useToken();
  const [form] = Form.useForm<CompleteProfileValues>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const currentUser = useSelector((state: RootState) => state.auth.currentUser);
  const { mytheme } = useSelector((state: RootState) => state.theme);
  const { t } = useAppTranslation();
  const isDark = mytheme === 'dark';

  useEffect(() => {
    if (!readAccessToken()) {
      navigate('/auth/signin', { replace: true });
      return;
    }

    if (currentUser?.profileCompleted) {
      navigate(PATH_COURSE.catalog, { replace: true });
      return;
    }

    form.setFieldsValue({
      phoneNumber: currentUser?.phoneNumber || '',
      birthday: currentUser?.birthDate ? dayjs(currentUser.birthDate) : undefined,
      passportId: currentUser?.passportId || '',
    });
  }, [currentUser?.birthDate, currentUser?.passportId, currentUser?.phoneNumber, currentUser?.profileCompleted, form, navigate]);

  const helperText = useMemo(
    () =>
      currentUser?.passwordLoginEnabled
        ? t('auth.completeProfile.helperEnabled')
        : t('auth.completeProfile.helperSetup'),
    [currentUser?.passwordLoginEnabled, t]
  );

  const handleSubmit = async (values: CompleteProfileValues) => {
    setLoading(true);

    try {
      await completeProfile({
        phoneNumber: values.phoneNumber.trim(),
        birthday: values.birthday.format('YYYY-MM-DD'),
        passportId: values.passportId.trim(),
        password: values.password?.trim() || undefined,
        confirmPassword: values.confirmPassword?.trim() || undefined,
      });

      const syncedUser = await fetchCurrentUser();
      dispatch(setCurrentUser(syncedUser));
      messageApi.success(t('auth.completeProfile.success'));
      navigate(PATH_COURSE.catalog, { replace: true });
    } catch (error) {
      messageApi.error(getReadableError(error, t('profile.msg.saveError')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {contextHolder}
      <div
        style={{
          minHeight: '100vh',
          background: isDark
            ? 'radial-gradient(circle at top, rgba(37,99,235,0.18) 0%, transparent 34%), var(--home-bg)'
            : '#f8fafc',
          padding: '40px 20px',
        }}
      >
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <Card
            style={{
              borderRadius: 28,
              background: colorBgContainer,
              border: `1px solid ${colorBorderSecondary}`,
              boxShadow: 'var(--color-shadow-soft)',
            }}
          >
            <Space direction="vertical" size={18} style={{ width: '100%' }}>
              <div>
                <Text style={{ color: colorPrimary }}>{t('auth.completeProfile.eyebrow')}</Text>
                <Title style={{ margin: '8px 0 10px' }}>{t('auth.completeProfile.title')}</Title>
                <Paragraph style={{ marginBottom: 0, color: colorTextSecondary }}>
                  {helperText}
                </Paragraph>
              </div>
              
              <Form<CompleteProfileValues>
                form={form}
                layout="vertical"
                requiredMark={false}
                onFinish={handleSubmit}
              >
                <Row gutter={[16, 0]}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label={t('auth.form.phone')}
                      name="phoneNumber"
                      rules={[{ required: true, message: t('auth.completeProfile.phoneRequired') }]}
                    >
                      <Input size="large" placeholder="+998901234567" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label={t('auth.form.birthDate')}
                      name="birthday"
                      rules={[{ required: true, message: t('auth.completeProfile.birthDateRequired') }]}
                    >
                      <DatePicker size="large" style={{ width: '100%' }} placeholder={t('auth.completeProfile.birthDatePlaceholder')} format="YYYY-MM-DD" />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item
                      label={t('auth.form.passport')}
                      name="passportId"
                      rules={[{ required: true, message: t('auth.completeProfile.passportRequired') }]}
                    >
                      <Input size="large" placeholder="AA1234567" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label={t('auth.completeProfile.passwordSet')} name="password">
                      <Input.Password size="large" autoComplete="new-password" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label={t('auth.completeProfile.confirmPassword')}
                      name="confirmPassword"
                      dependencies={['password']}
                      rules={[
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            const password = getFieldValue('password');

                            if (!password && !value) {
                              return Promise.resolve();
                            }

                            if (password && !value) {
                              return Promise.reject(new Error(t('auth.completeProfile.confirmPasswordRequired')));
                            }

                            if (password === value) {
                              return Promise.resolve();
                            }

                            return Promise.reject(new Error(t('auth.completeProfile.confirmPasswordMismatch')));
                          },
                        }),
                      ]}
                    >
                      <Input.Password size="large" autoComplete="new-password" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item style={{ marginBottom: 0 }}>
                  <Space wrap>
                    <Button type="primary" htmlType="submit" size="large" loading={loading}>
                      {t('auth.completeProfile.save')}
                    </Button>
                    <Button size="large" onClick={() => navigate(PATH_COURSE.catalog)}>
                      Hozircha o‘tkazib turish
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Space>
          </Card>
        </div>
      </div>
    </>
  );
};

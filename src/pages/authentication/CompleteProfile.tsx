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

const { Title, Paragraph, Text } = Typography;

type CompleteProfileValues = {
  phoneNumber: string;
  birthday: dayjs.Dayjs;
  passportId: string;
  password?: string;
  confirmPassword?: string;
};

const getReadableError = (error: unknown) => {
  const err = error as {
    response?: { data?: { message?: string; detail?: string; errors?: { message?: string } } };
    message?: string;
  };

  return (
    err?.response?.data?.errors?.message ||
    err?.response?.data?.detail ||
    err?.response?.data?.message ||
    err?.message ||
    'Profilni saqlashda xatolik yuz berdi'
  );
};

export const CompleteProfilePage = () => {
  const [form] = Form.useForm<CompleteProfileValues>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const currentUser = useSelector((state: RootState) => state.auth.currentUser);

  useEffect(() => {
    if (!readAccessToken()) {
      navigate('/login', { replace: true });
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
        ? 'Parol orqali kirish allaqachon yoqilgan. Quyidagi maydonlar bilan profilingizni yakunlang.'
        : 'Agar xohlasangiz, shu yerning o‘zida parol o‘rnatib, keyinchalik telefon yoki email orqali ham kirishingiz mumkin.',
    [currentUser?.passwordLoginEnabled]
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
      messageApi.success('Profil muvaffaqiyatli yangilandi');
      navigate(PATH_COURSE.catalog, { replace: true });
    } catch (error) {
      messageApi.error(getReadableError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {contextHolder}
      <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 20px' }}>
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <Card
            style={{
              borderRadius: 28,
              border: '1px solid rgba(148,163,184,0.14)',
              boxShadow: '0 18px 48px rgba(15,23,42,0.06)',
            }}
          >
            <Space direction="vertical" size={18} style={{ width: '100%' }}>
              <div>
                <Text style={{ color: '#2563eb' }}>Profilni yakunlash</Text>
                <Title style={{ margin: '8px 0 10px' }}>Profilingizni to‘ldiring</Title>
                <Paragraph style={{ marginBottom: 0, color: '#64748b' }}>
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
                      label="Telefon raqam"
                      name="phoneNumber"
                      rules={[{ required: true, message: 'Telefon raqam kiriting' }]}
                    >
                      <Input size="large" placeholder="+998901234567" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Tug'ilgan sana"
                      name="birthday"
                      rules={[{ required: true, message: "Tug'ilgan sanani tanlang" }]}
                    >
                      <DatePicker size="large" style={{ width: '100%' }} placeholder="Tug'ilgan sana" format="YYYY-MM-DD" />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item
                      label="Passport seriya va raqami"
                      name="passportId"
                      rules={[{ required: true, message: 'Passport ma’lumotini kiriting' }]}
                    >
                      <Input size="large" placeholder="AA1234567" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Parol o‘rnatish" name="password">
                      <Input.Password size="large" autoComplete="new-password" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Parolni tasdiqlash"
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
                              return Promise.reject(new Error('Parolni tasdiqlang'));
                            }

                            if (password === value) {
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
                  <Space wrap>
                    <Button type="primary" htmlType="submit" size="large" loading={loading}>
                      Profilni saqlash
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

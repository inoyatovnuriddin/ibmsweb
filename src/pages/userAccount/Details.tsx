import dayjs, { Dayjs } from 'dayjs';
import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  message,
  Row,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import { Card } from '../../components';
import {
  CalendarOutlined,
  MailOutlined,
  PhoneOutlined,
  SaveOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useEffect, useState } from 'react';
import {
  type CurrentUser,
  fetchCurrentUser,
  updateCurrentProfile,
} from '../../redux/auth/authApi.ts';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../redux/store.ts';
import { setCurrentUser } from '../../redux/auth/authSlice.ts';

type ProfileFormValues = {
  firstname: string;
  lastname: string;
  middlename?: string;
  passportId?: string;
  email: string;
  phoneNumber?: string;
  birthDate?: Dayjs | null;
};

const DATE_FORMAT = 'YYYY-MM-DD';

export const UserProfileDetailsPage = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.auth.currentUser);
  const [form] = Form.useForm<ProfileFormValues>();
  const [user, setUser] = useState<CurrentUser | null>(currentUser);
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
      form.setFieldsValue(toFormValues(currentUser));
      setProfileLoading(false);
    }
  }, [currentUser, form]);

  useEffect(() => {
    void loadProfile();
  }, []);

  const loadProfile = async () => {
    setProfileLoading(true);
    try {
      const userData = await fetchCurrentUser();
      dispatch(setCurrentUser(userData));
      setUser(userData);
      form.setFieldsValue(toFormValues(userData));
    } catch {
      message.error("Profil ma’lumotlarini yuklashda xatolik yuz berdi.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSave = async (values: ProfileFormValues) => {
    if (!user?.id) {
      message.error("Foydalanuvchi ma’lumoti topilmadi.");
      return;
    }

    try {
      setSaving(true);
      const refreshedUser = await updateCurrentProfile(user.id, {
        firstname: values.firstname.trim(),
        lastname: values.lastname.trim(),
        middlename: values.middlename?.trim() || null,
        email: values.email.trim(),
        phoneNumber: values.phoneNumber?.trim() || null,
        passportId: values.passportId?.trim() || null,
        birthDate: values.birthDate ? values.birthDate.format(DATE_FORMAT) : null,
        roles: user.roles,
        status: user.status,
      });

      dispatch(setCurrentUser(refreshedUser));
      setUser(refreshedUser);
      form.setFieldsValue(toFormValues(refreshedUser));
      message.success("Profil ma’lumotlari saqlandi.");
    } catch {
      message.error("Profilni saqlashda xatolik yuz berdi.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!user) return;
    form.setFieldsValue(toFormValues(user));
  };

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card
        style={{
          borderRadius: 24,
          boxShadow: '0 18px 42px rgba(15,23,42,0.05)',
        }}
        bodyStyle={{ padding: 24 }}
      >
        {profileLoading ? (
          <div style={{ minHeight: 260, display: 'grid', placeItems: 'center' }}>
            <Spin />
          </div>
        ) : (
          <Space direction="vertical" size={22} style={{ width: '100%' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 16,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <Typography.Text style={{ color: '#64748b' }}>
                  Profil ma’lumotlari
                </Typography.Text>
                <Typography.Title level={3} style={{ margin: '6px 0 8px', color: '#102a43' }}>
                  Ma’lumotlarni o‘zgartirish
                </Typography.Title>
                <Typography.Text style={{ color: '#52606d' }}>
                  Ism, aloqa va shaxsiy ma’lumotlarni shu yerning o‘zida yangilang.
                </Typography.Text>
              </div>

              <Space wrap size={8}>
                {user?.status ? (
                  <Tag color={user.status === 'Active' ? 'success' : 'default'} style={{ borderRadius: 999 }}>
                    {user.status === 'Active' ? 'Faol' : user.status}
                  </Tag>
                ) : null}
                {user?.authProvider ? (
                  <Tag style={{ borderRadius: 999 }}>{user.authProvider}</Tag>
                ) : null}
              </Space>
            </div>

            <Form<ProfileFormValues>
              form={form}
              layout="vertical"
              onFinish={handleSave}
              autoComplete="off"
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Ism"
                    name="firstname"
                    rules={[{ required: true, message: 'Ismni kiriting' }]}
                  >
                    <Input
                      size="large"
                      prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
                      placeholder="Ismingizni kiriting"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Familiya"
                    name="lastname"
                    rules={[{ required: true, message: 'Familiyani kiriting' }]}
                  >
                    <Input
                      size="large"
                      prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
                      placeholder="Familiyangizni kiriting"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Sharif" name="middlename">
                    <Input
                      size="large"
                      prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
                      placeholder="Sharifingizni kiriting"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Passport seriya va raqami" name="passportId">
                    <Input
                      size="large"
                      placeholder="AA1234567"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Elektron pochta"
                    name="email"
                    rules={[
                      { required: true, message: 'Emailni kiriting' },
                      { type: 'email', message: 'Email formatini tekshiring' },
                    ]}
                  >
                    <Input
                      size="large"
                      prefix={<MailOutlined style={{ color: '#94a3b8' }} />}
                      placeholder="example@mail.com"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Telefon raqam" name="phoneNumber">
                    <Input
                      size="large"
                      prefix={<PhoneOutlined style={{ color: '#94a3b8' }} />}
                      placeholder="+998901234567"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Tug‘ilgan sana" name="birthDate">
                    <DatePicker
                      size="large"
                      style={{ width: '100%' }}
                      format={DATE_FORMAT}
                      placeholder="YYYY-MM-DD"
                      suffixIcon={<CalendarOutlined style={{ color: '#94a3b8' }} />}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 10,
                  flexWrap: 'wrap',
                  marginTop: 8,
                }}
              >
                <Button size="large" onClick={handleReset} style={{ borderRadius: 14 }}>
                  Bekor qilish
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={saving}
                  icon={<SaveOutlined />}
                  style={{ borderRadius: 14 }}
                >
                  Saqlash
                </Button>
              </div>
            </Form>
          </Space>
        )}
      </Card>
    </Space>
  );
};

const toFormValues = (user: CurrentUser): ProfileFormValues => ({
  firstname: user.firstName || '',
  lastname: user.lastName || '',
  middlename: user.middleName || '',
  passportId: user.passportId || '',
  email: user.email || '',
  phoneNumber: user.phoneNumber || '',
  birthDate: user.birthDate ? dayjs(user.birthDate) : null,
});

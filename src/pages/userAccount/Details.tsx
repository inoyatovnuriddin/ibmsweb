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
  theme,
  Typography,
} from 'antd';
import {
  CalendarOutlined,
  MailOutlined,
  PhoneOutlined,
  SaveOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Card } from '../../components';
import { useEffect, useState } from 'react';
import {
  type CurrentUser,
  fetchCurrentUser,
  updateCurrentProfile,
} from '../../redux/auth/authApi.ts';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../redux/store.ts';
import { setCurrentUser } from '../../redux/auth/authSlice.ts';
import { useAppTranslation } from '../../hooks/useAppTranslation.ts';

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
  const {
    token: { colorText, colorTextSecondary, colorTextTertiary },
  } = theme.useToken();
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.auth.currentUser);
  const { t } = useAppTranslation();
  const [form] = Form.useForm<ProfileFormValues>();
  const [user, setUser] = useState<CurrentUser | null>(currentUser);
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Only administrators may edit profile data; regular users see it read-only.
  const canEdit = Boolean(
    currentUser?.roles?.some(
      (role) => role === 'ROLE_ADMIN' || role === 'ROLE_SUPER_ADMIN'
    )
  );

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
      message.error(t('profile.msg.loadError'));
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSave = async (values: ProfileFormValues) => {
    if (!user?.id) {
      message.error(t('profile.msg.notFound'));
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
      message.success(t('profile.msg.saveSuccess'));
    } catch {
      message.error(t('profile.msg.saveError'));
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
          boxShadow: 'var(--color-shadow-soft)',
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
                <Typography.Text style={{ color: colorTextSecondary }}>
                  {t('profile.details.subtitle')}
                </Typography.Text>
                <Typography.Title level={3} style={{ margin: '6px 0 8px', color: colorText }}>
                  {t('profile.details.title')}
                </Typography.Title>
                <Typography.Text style={{ color: colorTextSecondary }}>
                  {t('profile.details.description')}
                </Typography.Text>
              </div>

              <Space wrap size={8}>
                {user?.status ? (
                  <Tag color={user.status === 'Active' ? 'success' : 'default'} style={{ borderRadius: 999 }}>
                    {user.status === 'Active' ? t('profile.details.statusActive') : user.status}
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
              disabled={!canEdit}
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={t('profile.form.firstname.label')}
                    name="firstname"
                    rules={[{ required: true, message: t('profile.form.firstname.required') }]}
                  >
                    <Input
                      size="large"
                      prefix={<UserOutlined style={{ color: colorTextTertiary }} />}
                      placeholder={t('profile.form.firstname.placeholder')}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={t('profile.form.lastname.label')}
                    name="lastname"
                    rules={[{ required: true, message: t('profile.form.lastname.required') }]}
                  >
                    <Input
                      size="large"
                      prefix={<UserOutlined style={{ color: colorTextTertiary }} />}
                      placeholder={t('profile.form.lastname.placeholder')}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label={t('profile.form.middlename.label')} name="middlename">
                    <Input
                      size="large"
                      prefix={<UserOutlined style={{ color: colorTextTertiary }} />}
                      placeholder={t('profile.form.middlename.placeholder')}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label={t('profile.form.passportId.label')} name="passportId">
                    <Input
                      size="large"
                      placeholder="AA1234567"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={t('profile.form.email.label')}
                    name="email"
                    rules={[
                      { required: true, message: t('profile.form.email.required') },
                      { type: 'email', message: t('profile.form.email.invalid') },
                    ]}
                  >
                    <Input
                      size="large"
                      prefix={<MailOutlined style={{ color: colorTextTertiary }} />}
                      placeholder="example@mail.com"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label={t('profile.form.phone.label')} name="phoneNumber">
                    <Input
                      size="large"
                      prefix={<PhoneOutlined style={{ color: colorTextTertiary }} />}
                      placeholder="+998901234567"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label={t('profile.form.birthDate.label')} name="birthDate">
                    <DatePicker
                      size="large"
                      style={{ width: '100%' }}
                      format={DATE_FORMAT}
                      placeholder="YYYY-MM-DD"
                      suffixIcon={<CalendarOutlined style={{ color: colorTextTertiary }} />}
                    />
                  </Form.Item>
                </Col>
              </Row>

              {canEdit ? (
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
                    {t('profile.form.cancel')}
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    loading={saving}
                    icon={<SaveOutlined />}
                    style={{ borderRadius: 14 }}
                  >
                    {t('profile.form.save')}
                  </Button>
                </div>
              ) : null}
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

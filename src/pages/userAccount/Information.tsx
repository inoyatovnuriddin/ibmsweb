import { type ReactNode, useEffect, useState } from 'react';
import { Empty, Space, Spin, Tag, theme, Typography } from 'antd';
import {
  CalendarOutlined,
  IdcardOutlined,
  MailOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
  SendOutlined,
  SolutionOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { Card } from '../../components';
import type { RootState } from '../../redux/store.ts';
import { fetchCurrentUser } from '../../redux/auth/authApi.ts';
import { setCurrentUser } from '../../redux/auth/authSlice.ts';

const { Text, Title } = Typography;

const ROLE_LABELS: Record<string, string> = {
  ROLE_SUPER_ADMIN: 'Super admin',
  ROLE_ADMIN: 'Administrator',
  ROLE_INSTRUCTOR: 'Oʻqituvchi',
  ROLE_USER: 'Foydalanuvchi',
};

export const UserProfileInformationPage = () => {
  const {
    token: { colorText, colorTextSecondary, colorBorderSecondary, colorFillTertiary },
  } = theme.useToken();
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.auth.currentUser);
  const [loading, setLoading] = useState(!currentUser);

  useEffect(() => {
    (async () => {
      try {
        const fresh = await fetchCurrentUser();
        dispatch(setCurrentUser(fresh));
      } catch {
        /* keep whatever is in the store */
      } finally {
        setLoading(false);
      }
    })();
  }, [dispatch]);

  if (loading && !currentUser) {
    return (
      <Card style={{ borderRadius: 24 }} bodyStyle={{ minHeight: 240, display: 'grid', placeItems: 'center' }}>
        <Spin />
      </Card>
    );
  }

  if (!currentUser) {
    return (
      <Card style={{ borderRadius: 24 }}>
        <Empty description="Maʼlumot topilmadi" />
      </Card>
    );
  }

  const fullName =
    [currentUser.lastName, currentUser.firstName, currentUser.middleName]
      .filter(Boolean)
      .join(' ') || '—';

  const rows: Array<{ icon: ReactNode; label: string; value: ReactNode }> = [
    { icon: <UserOutlined />, label: 'F.I.Sh.', value: fullName },
    { icon: <MailOutlined />, label: 'Elektron pochta', value: currentUser.email || '—' },
    { icon: <PhoneOutlined />, label: 'Telefon', value: currentUser.phoneNumber || '—' },
    { icon: <IdcardOutlined />, label: 'Passport', value: currentUser.passportId || '—' },
    { icon: <CalendarOutlined />, label: 'Tugʻilgan sana', value: currentUser.birthDate || '—' },
    {
      icon: <SolutionOutlined />,
      label: 'Kirish usuli',
      value: currentUser.authProvider || 'LOCAL',
    },
    {
      icon: <SendOutlined />,
      label: 'Telegram',
      value: currentUser.telegramLinked ? (
        <Tag color="processing">
          Ulangan{currentUser.telegramUsername ? ` · @${currentUser.telegramUsername}` : ''}
        </Tag>
      ) : (
        <Tag>Ulanmagan</Tag>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Card style={{ borderRadius: 24, boxShadow: 'var(--color-shadow-soft)' }} bodyStyle={{ padding: 24 }}>
        <Space align="center" size={12} style={{ marginBottom: 4 }}>
          <SafetyCertificateOutlined style={{ fontSize: 20, color: '#2563eb' }} />
          <Title level={4} style={{ margin: 0, color: colorText }}>
            Shaxsiy maʼlumot
          </Title>
        </Space>
        <Text style={{ color: colorTextSecondary }}>
          Hisobingizga tegishli asosiy maʼlumotlar. Oʻzgartirish uchun administratorga murojaat qiling.
        </Text>

        <div
          style={{
            marginTop: 20,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 12,
          }}
        >
          {rows.map((row) => (
            <div
              key={row.label}
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'center',
                padding: '14px 16px',
                borderRadius: 16,
                background: colorFillTertiary,
                border: `1px solid ${colorBorderSecondary}`,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  display: 'grid',
                  placeItems: 'center',
                  background: 'rgba(37,99,235,0.1)',
                  color: '#2563eb',
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                {row.icon}
              </div>
              <div style={{ minWidth: 0 }}>
                <Text style={{ color: colorTextSecondary, fontSize: 12, display: 'block' }}>
                  {row.label}
                </Text>
                <Text strong style={{ color: colorText, wordBreak: 'break-word' }}>
                  {row.value}
                </Text>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ borderRadius: 24, boxShadow: 'var(--color-shadow-soft)' }} bodyStyle={{ padding: 24 }}>
        <Title level={5} style={{ margin: '0 0 4px', color: colorText }}>
          Rollar va ruxsatlar
        </Title>
        <Text style={{ color: colorTextSecondary }}>Sizga tizimda berilgan rollar.</Text>
        <div style={{ marginTop: 14 }}>
          <Space wrap size={8}>
            {(currentUser.roles || []).map((role) => (
              <Tag
                key={role}
                color={role === 'ROLE_SUPER_ADMIN' ? 'gold' : 'blue'}
                style={{ borderRadius: 999, padding: '4px 12px' }}
              >
                {ROLE_LABELS[role] || role.replace(/^ROLE_/, '')}
              </Tag>
            ))}
          </Space>
        </div>
      </Card>
    </Space>
  );
};

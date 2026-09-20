import { useState } from 'react';
import { Button, Divider, message, Modal, Space, theme, Typography } from 'antd';
import {
  ExclamationCircleOutlined,
  KeyOutlined,
  LogoutOutlined,
  MailOutlined,
  ReloadOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Card } from '../../components';
import type { RootState } from '../../redux/store.ts';
import { requestPasswordReset } from '../../redux/auth/authApi.ts';
import { PATH_AUTH, PATH_USER_PROFILE } from '../../constants';

const { Text, Title } = Typography;

type ActionRowProps = {
  icon: React.ReactNode;
  title: string;
  desc: string;
  action: React.ReactNode;
  danger?: boolean;
};

const ActionRow = ({ icon, title, desc, action, danger }: ActionRowProps) => {
  const {
    token: { colorText, colorTextSecondary },
  } = theme.useToken();
  return (
    <div
      style={{
        display: 'flex',
        gap: 16,
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        padding: '14px 0',
      }}
    >
      <Space align="start" size={12}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            display: 'grid',
            placeItems: 'center',
            background: danger ? 'rgba(220,38,38,0.1)' : 'rgba(37,99,235,0.1)',
            color: danger ? '#dc2626' : '#2563eb',
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <Space direction="vertical" size={0}>
          <Text strong style={{ color: colorText }}>
            {title}
          </Text>
          <Text style={{ color: colorTextSecondary, fontSize: 13 }}>{desc}</Text>
        </Space>
      </Space>
      {action}
    </div>
  );
};

export const UserProfileActionsPage = () => {
  const {
    token: { colorText, colorTextSecondary },
  } = theme.useToken();
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => state.auth.currentUser);
  const [resetLoading, setResetLoading] = useState(false);

  const handlePasswordReset = async () => {
    if (!currentUser?.email) {
      message.error('Emailingiz topilmadi');
      return;
    }
    setResetLoading(true);
    try {
      await requestPasswordReset({ email: currentUser.email });
      message.success('Parolni tiklash havolasi emailingizga yuborildi');
    } catch {
      message.error('Xatolik yuz berdi');
    } finally {
      setResetLoading(false);
    }
  };

  const handleLogout = () => {
    Modal.confirm({
      title: 'Hisobdan chiqish',
      icon: <ExclamationCircleOutlined />,
      content: 'Rostdan ham tizimdan chiqmoqchimisiz?',
      okText: 'Ha, chiqish',
      cancelText: 'Bekor qilish',
      okButtonProps: { danger: true },
      onOk: () => {
        localStorage.clear();
        navigate(PATH_AUTH.signin);
      },
    });
  };

  const handleClearCache = () => {
    // Clear cached UI preferences (keeps auth tokens) and reload.
    ['ibms_notification_prefs'].forEach((k) => localStorage.removeItem(k));
    message.success('Keshlangan sozlamalar tozalandi');
    setTimeout(() => window.location.reload(), 600);
  };

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Card style={{ borderRadius: 24, boxShadow: 'var(--color-shadow-soft)' }} bodyStyle={{ padding: '8px 24px 16px' }}>
        <div style={{ padding: '16px 0 4px' }}>
          <Space align="center" size={12}>
            <SafetyOutlined style={{ fontSize: 20, color: '#2563eb' }} />
            <Title level={4} style={{ margin: 0, color: colorText }}>
              Xavfsizlik amallari
            </Title>
          </Space>
          <Text style={{ color: colorTextSecondary }}>
            Hisobingiz xavfsizligini boshqarish uchun amallar.
          </Text>
        </div>
        <Divider style={{ margin: '8px 0' }} />

        <ActionRow
          icon={<KeyOutlined />}
          title="Parolni oʻzgartirish"
          desc="Joriy parolni bilgan holda yangi parol oʻrnating"
          action={
            <Button onClick={() => navigate(PATH_USER_PROFILE.security)}>Oʻzgartirish</Button>
          }
        />
        <Divider style={{ margin: 0 }} />
        <ActionRow
          icon={<MailOutlined />}
          title="Parolni tiklash havolasi"
          desc="Parolni unutgan boʻlsangiz, emailingizga tiklash havolasi yuboriladi"
          action={
            <Button onClick={handlePasswordReset} loading={resetLoading}>
              Havola yuborish
            </Button>
          }
        />
        <Divider style={{ margin: 0 }} />
        <ActionRow
          icon={<ReloadOutlined />}
          title="Keshni tozalash"
          desc="Saqlangan interfeys sozlamalarini tozalab, sahifani yangilash"
          action={<Button onClick={handleClearCache}>Tozalash</Button>}
        />
      </Card>

      <Card style={{ borderRadius: 24, border: '1px solid rgba(220,38,38,0.25)' }} bodyStyle={{ padding: '8px 24px 16px' }}>
        <div style={{ padding: '16px 0 4px' }}>
          <Title level={5} style={{ margin: 0, color: '#dc2626' }}>
            Xavfli hudud
          </Title>
          <Text style={{ color: colorTextSecondary }}>
            Bu amallar hisobingizga taʼsir qiladi.
          </Text>
        </div>
        <Divider style={{ margin: '8px 0' }} />
        <ActionRow
          danger
          icon={<LogoutOutlined />}
          title="Tizimdan chiqish"
          desc="Ushbu qurilmadagi seansni yakunlash"
          action={
            <Button danger onClick={handleLogout}>
              Chiqish
            </Button>
          }
        />
      </Card>
    </Space>
  );
};

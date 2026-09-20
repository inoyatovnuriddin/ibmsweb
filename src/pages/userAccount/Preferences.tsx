import { useState } from 'react';
import { Divider, Flex, Segmented, Space, Switch, theme, Typography } from 'antd';
import {
  BellOutlined,
  BgColorsOutlined,
  GlobalOutlined,
  MoonOutlined,
  SunOutlined,
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { Card } from '../../components';
import type { RootState } from '../../redux/store.ts';
import { toggleTheme } from '../../redux/theme/themeSlice.ts';
import { setLanguage } from '../../redux/language/languageSlice.ts';
import { LANGUAGE_OPTIONS, saveAppLanguage, type AppLanguage } from '../../i18n';
import { useAppTranslation } from '../../hooks/useAppTranslation.ts';

const { Text, Title } = Typography;

const NOTIF_STORAGE_KEY = 'ibms_notification_prefs';

type NotificationPrefs = {
  courseUpdates: boolean;
  testResults: boolean;
  certificates: boolean;
  email: boolean;
};

const DEFAULT_PREFS: NotificationPrefs = {
  courseUpdates: true,
  testResults: true,
  certificates: true,
  email: false,
};

const readPrefs = (): NotificationPrefs => {
  try {
    const raw = localStorage.getItem(NOTIF_STORAGE_KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
};

export const UserProfilePreferencesPage = () => {
  const {
    token: { colorText, colorTextSecondary, colorBorderSecondary },
  } = theme.useToken();
  const dispatch = useDispatch();
  const { mytheme } = useSelector((state: RootState) => state.theme);
  const { language } = useAppTranslation();
  const [prefs, setPrefs] = useState<NotificationPrefs>(readPrefs);

  const isDark = mytheme === 'dark';

  const changeLanguage = (value: AppLanguage) => {
    dispatch(setLanguage(value));
    saveAppLanguage(value);
  };

  const updatePref = (key: keyof NotificationPrefs, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(next));
  };

  const notificationRows: Array<{
    key: keyof NotificationPrefs;
    title: string;
    desc: string;
  }> = [
    { key: 'courseUpdates', title: 'Kurs yangiliklari', desc: 'Yangi darslar va materiallar qoʻshilganda xabar berish' },
    { key: 'testResults', title: 'Test natijalari', desc: 'Test yakunlangach natija haqida bildirishnoma' },
    { key: 'certificates', title: 'Sertifikatlar', desc: 'Sertifikat tayyor boʻlganda ogohlantirish' },
    { key: 'email', title: 'Email orqali xabar', desc: 'Muhim xabarlarni elektron pochtaga yuborish' },
  ];

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Card style={{ borderRadius: 24, boxShadow: 'var(--color-shadow-soft)' }} bodyStyle={{ padding: 24 }}>
        <Space align="center" size={12} style={{ marginBottom: 4 }}>
          <BgColorsOutlined style={{ fontSize: 20, color: '#2563eb' }} />
          <Title level={4} style={{ margin: 0, color: colorText }}>
            Koʻrinish
          </Title>
        </Space>
        <Text style={{ color: colorTextSecondary }}>
          Interfeys mavzusi va tilini oʻzingizga qulay tarzda sozlang.
        </Text>

        <Divider />

        <Flex align="center" justify="space-between" gap={16} wrap="wrap">
          <Space direction="vertical" size={0}>
            <Text strong style={{ color: colorText }}>
              Mavzu
            </Text>
            <Text style={{ color: colorTextSecondary }}>Yorugʻ yoki tungi rejim</Text>
          </Space>
          <Segmented
            value={isDark ? 'dark' : 'light'}
            onChange={(v) => {
              if ((v === 'dark') !== isDark) dispatch(toggleTheme());
            }}
            options={[
              { label: 'Yorugʻ', value: 'light', icon: <SunOutlined /> },
              { label: 'Tungi', value: 'dark', icon: <MoonOutlined /> },
            ]}
          />
        </Flex>

        <Divider style={{ borderColor: colorBorderSecondary }} />

        <Flex align="center" justify="space-between" gap={16} wrap="wrap">
          <Space direction="vertical" size={0}>
            <Text strong style={{ color: colorText }}>
              <GlobalOutlined /> Til
            </Text>
            <Text style={{ color: colorTextSecondary }}>Interfeys tili</Text>
          </Space>
          <Segmented
            value={language}
            onChange={(v) => changeLanguage(v as AppLanguage)}
            options={LANGUAGE_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
          />
        </Flex>
      </Card>

      <Card style={{ borderRadius: 24, boxShadow: 'var(--color-shadow-soft)' }} bodyStyle={{ padding: 24 }}>
        <Space align="center" size={12} style={{ marginBottom: 4 }}>
          <BellOutlined style={{ fontSize: 20, color: '#2563eb' }} />
          <Title level={4} style={{ margin: 0, color: colorText }}>
            Bildirishnomalar
          </Title>
        </Space>
        <Text style={{ color: colorTextSecondary }}>
          Qaysi hodisalar haqida xabardor boʻlishni xohlaysiz.
        </Text>

        <Divider />

        <Space direction="vertical" size={18} style={{ width: '100%' }}>
          {notificationRows.map((row) => (
            <Flex key={row.key} align="center" justify="space-between" gap={16}>
              <Space direction="vertical" size={0} style={{ minWidth: 0 }}>
                <Text strong style={{ color: colorText }}>
                  {row.title}
                </Text>
                <Text style={{ color: colorTextSecondary, fontSize: 13 }}>{row.desc}</Text>
              </Space>
              <Switch
                checked={prefs[row.key]}
                onChange={(checked) => updatePref(row.key, checked)}
              />
            </Flex>
          ))}
        </Space>
      </Card>
    </Space>
  );
};

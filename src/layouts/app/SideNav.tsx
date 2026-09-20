import React, { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  ConfigProvider,
  Layout,
  Menu,
  MenuProps,
  SiderProps,
  Space,
  Tag,
  theme,
} from 'antd';
import {
  BarChartOutlined,
  CrownOutlined,
  FolderOpenOutlined,
  GroupOutlined,
  HomeOutlined,
  MessageOutlined,
  QrcodeOutlined as QrCodeOutlined,
  QuestionCircleOutlined,
  ReadOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  UserOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Logo } from '../../components';
import { PATH_DASHBOARD, PATH_LANDING } from '../../constants';
import { apiClient } from '../../services/api.ts';
import type { RootState } from '../../redux/store.ts';
import { useAppTranslation } from '../../hooks/useAppTranslation.ts';
import { hasPagePermission } from '../../routes/ProtectedRoute.tsx';

const { Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

interface User {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  userImage?: string | null;
  roles: string[];
}

type SideNavProps = SiderProps;

type SideNavContentProps = {
  collapsed?: boolean;
};

const createItem = (
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode
): MenuItem => ({
  key,
  icon,
  label,
});

export const AdminSideNavContent = ({ collapsed = false }: SideNavContentProps) => {
  const { pathname } = useLocation();
  const [current, setCurrent] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const { token } = theme.useToken();
  const { mytheme } = useSelector((state: RootState) => state.theme);
  const { language, t } = useAppTranslation();

  useEffect(() => {
    if (pathname.includes('/groups')) {
      setCurrent('groups');
      return;
    }

    const parts = pathname.split('/');
    setCurrent(parts[parts.length - 1]);
  }, [pathname]);

  useEffect(() => {
    apiClient
      .get('/v1/users/account')
      .then((res) => setUser(res.data))
      .catch(() => setUser(null));
  }, [language]);

  const currentUser = useSelector((state: RootState) => state.auth.currentUser);
  const isSuperAdmin = Boolean(currentUser?.roles?.includes('ROLE_SUPER_ADMIN'));
  const avatarUrl = user?.userImage || currentUser?.userImage || null;

  const items: MenuProps['items'] = useMemo(() => {
    // Each menu item is tied to an admin page key; the super admin grants page access per role.
    const pageItems: { page: string; item: MenuItem }[] = [
      {
        page: 'users',
        item: createItem(
          <Link to={PATH_DASHBOARD.users}>{t('dashboard.users')}</Link>,
          'users',
          <TeamOutlined />
        ),
      },
      {
        page: 'courses',
        item: createItem(
          <Link to={PATH_DASHBOARD.courses}>{t('dashboard.courses')}</Link>,
          'courses',
          <FolderOpenOutlined />
        ),
      },
      {
        page: 'topics',
        item: createItem(
          <Link to={PATH_DASHBOARD.topics}>{t('dashboard.topics')}</Link>,
          'topics',
          <ReadOutlined />
        ),
      },
      {
        page: 'videos',
        item: createItem(
          <Link to={PATH_DASHBOARD.videos}>{t('dashboard.videos')}</Link>,
          'videos',
          <VideoCameraOutlined />
        ),
      },
      {
        page: 'tests',
        item: createItem(
          <Link to={PATH_DASHBOARD.tests}>{t('dashboard.tests')}</Link>,
          'tests',
          <QuestionCircleOutlined />
        ),
      },
      {
        page: 'monitoring',
        item: createItem(
          <Link to={PATH_DASHBOARD.monitoring}>{t('dashboard.monitoring')}</Link>,
          'monitoring',
          <BarChartOutlined />
        ),
      },
      {
        page: 'groups',
        item: createItem(
          <Link to={PATH_DASHBOARD.groups}>{t('dashboard.groups')}</Link>,
          'groups',
          <GroupOutlined />
        ),
      },
      {
        page: 'qrCode',
        item: createItem(
          <Link to={PATH_DASHBOARD.qrCode}>{t('dashboard.qrCode')}</Link>,
          'qrCode',
          <QrCodeOutlined />
        ),
      },
      {
        page: 'certificates',
        item: createItem(
          <Link to={PATH_DASHBOARD.certificates}>{t('dashboard.certificates')}</Link>,
          'certificates',
          <SafetyCertificateOutlined />
        ),
      },
      {
        page: 'contactRequests',
        item: createItem(
          <Link to={PATH_DASHBOARD.publicContactRequests}>
            {t('dashboard.contactRequests')}
          </Link>,
          'contact-requests',
          <MessageOutlined />
        ),
      },
    ];

    const visible = pageItems
      .filter(({ page }) => hasPagePermission(currentUser, page))
      .map(({ item }) => item);

    // Role management is visible to the super admin only.
    if (isSuperAdmin) {
      visible.push(
        createItem(
          <Link to={PATH_DASHBOARD.roles}>{t('dashboard.roles')}</Link>,
          'roles',
          <CrownOutlined />
        )
      );
    }

    visible.push(
      createItem(
        <Link to={PATH_LANDING.root}>{t('dashboard.backToSite')}</Link>,
        'landing',
        <HomeOutlined />
      )
    );

    return visible;
  }, [t, currentUser, isSuperAdmin]);

  return (
    <div
      style={{
        height: '100%',
        borderRadius: 24,
        background: token.colorBgContainer,
        border: `1px solid ${token.colorBorderSecondary}`,
        boxShadow: '0 12px 32px rgba(15,23,42,0.04)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: collapsed ? '18px 14px' : '20px 18px 18px',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <Logo
          color="blue"
          asLink
          href={PATH_LANDING.root}
          justify={collapsed ? 'center' : 'flex-start'}
          gap="small"
          imgSize={{ h: collapsed ? 34 : 40 }}
        />
        {!collapsed ? (
          <Space align="center" size={12} style={{ marginTop: 14, width: '100%' }}>
            <Space direction="vertical" size={2} style={{ minWidth: 0 }}>
              <Tag
                style={{
                  width: 'fit-content',
                  margin: 0,
                  borderRadius: 999,
                  padding: '2px 10px',
                  fontSize: 11,
                  background: mytheme === 'dark' ? 'rgba(255,255,255,0.06)' : '#f8fafc',
                  color: token.colorTextSecondary,
                  border: `1px solid ${token.colorBorderSecondary}`,
                }}
              >
                {t('dashboard.panel')}
              </Tag>
            </Space>
          </Space>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
            <Avatar
              size={40}
              src={avatarUrl || undefined}
              icon={<UserOutlined />}
              style={{ background: 'rgba(37,99,235,0.12)', color: '#1d4ed8' }}
            />
          </div>
        )}
      </div>

      <ConfigProvider
        theme={{
          components: {
            Menu: {
              itemBg: 'transparent',
              itemSelectedBg: mytheme === 'dark' ? 'rgba(37,99,235,0.18)' : '#eef4ff',
              itemHoverBg: mytheme === 'dark' ? 'rgba(255,255,255,0.06)' : '#f8fafc',
              itemSelectedColor: mytheme === 'dark' ? '#93c5fd' : '#1d4ed8',
              itemColor: mytheme === 'dark' ? 'rgba(255,255,255,0.72)' : '#334155',
              borderRadiusLG: 14,
              itemMarginBlock: 4,
            },
          },
        }}
      >
        <Menu
          mode="inline"
          items={items}
          selectedKeys={[current]}
          style={{
            border: 'none',
            background: 'transparent',
            padding: '14px 12px 10px',
            flex: 1,
          }}
        />
      </ConfigProvider>
    </div>
  );
};

const SideNav = ({ collapsed, ...others }: SideNavProps) => {
  const { mytheme } = useSelector((state: RootState) => state.theme);

  return (
    <Sider breakpoint="lg" theme={mytheme === 'dark' ? 'dark' : 'light'} {...others}>
      <AdminSideNavContent collapsed={collapsed} />
    </Sider>
  );
};

export default SideNav;

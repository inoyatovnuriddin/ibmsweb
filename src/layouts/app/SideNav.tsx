import React, { useEffect, useMemo, useState } from 'react';
import {
  ConfigProvider,
  Layout,
  Menu,
  MenuProps,
  SiderProps,
  Space,
  Tag,
  Typography,
} from 'antd';
import {
  BarChartOutlined,
  FolderOpenOutlined,
  GroupOutlined,
  HomeOutlined,
  QuestionCircleOutlined,
  ReadOutlined,
  TeamOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from '../../components';
import { PATH_DASHBOARD, PATH_LANDING } from '../../constants';
import { apiClient } from '../../services/api.ts';

const { Sider } = Layout;
const { Text, Title } = Typography;

type MenuItem = Required<MenuProps>['items'][number];

interface User {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
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
  }, []);

  const items: MenuProps['items'] = useMemo(
    () => [
      createItem(
        <Link to={PATH_DASHBOARD.users}>Foydalanuvchilar</Link>,
        'users',
        <TeamOutlined />
      ),
      createItem(
        <Link to={PATH_DASHBOARD.courses}>Kurslar</Link>,
        'courses',
        <FolderOpenOutlined />
      ),
      createItem(
        <Link to={PATH_DASHBOARD.topics}>Mavzular</Link>,
        'topics',
        <ReadOutlined />
      ),
      createItem(
        <Link to={PATH_DASHBOARD.videos}>Videolar</Link>,
        'videos',
        <VideoCameraOutlined />
      ),
      createItem(
        <Link to={PATH_DASHBOARD.tests}>Testlar</Link>,
        'tests',
        <QuestionCircleOutlined />
      ),
      createItem(
        <Link to={PATH_DASHBOARD.monitoring}>Monitoring</Link>,
        'monitoring',
        <BarChartOutlined />
      ),
      createItem(
        <Link to={PATH_DASHBOARD.groups}>Guruhlar</Link>,
        'groups',
        <GroupOutlined />
      ),
      // createItem(
      //   <Link to={PATH_DASHBOARD.qrCode}>QR-kod</Link>,
      //   'qrCode',
      //   <QrcodeOutlined />
      // ),
      createItem(
        <Link to={PATH_LANDING.root}>Saytga qaytish</Link>,
        'landing',
        <HomeOutlined />
      ),
    ],
    []
  );

  return (
    <div
      style={{
        height: '100%',
        borderRadius: 24,
        background: '#ffffff',
        border: '1px solid rgba(148,163,184,0.12)',
        boxShadow: '0 12px 32px rgba(15,23,42,0.04)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: collapsed ? '18px 14px' : '20px 18px 18px',
          borderBottom: '1px solid rgba(148,163,184,0.12)',
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
          <Space direction="vertical" size={6} style={{ marginTop: 14 }}>
            <Tag
              style={{
                width: 'fit-content',
                margin: 0,
                borderRadius: 999,
                padding: '4px 10px',
                background: '#f8fafc',
                color: '#475569',
                border: '1px solid rgba(148,163,184,0.12)',
              }}
            >
              Admin panel
            </Tag>
            <Title level={5} style={{ margin: 0, color: '#102a43' }}>
              {user ? `${user.firstname} ${user.lastname}` : 'Administrator'}
            </Title>
            <Text style={{ color: '#64748b' }}>LMS boshqaruv markazi</Text>
          </Space>
        ) : null}
      </div>

      <ConfigProvider
        theme={{
          components: {
            Menu: {
              itemBg: 'transparent',
              itemSelectedBg: '#eef4ff',
              itemHoverBg: '#f8fafc',
              itemSelectedColor: '#1d4ed8',
              itemColor: '#334155',
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

      {!collapsed ? (
        <div
          style={{
            margin: 14,
            padding: 14,
            borderRadius: 18,
            background: '#f8fafc',
            border: '1px solid rgba(148,163,184,0.12)',
          }}
        >
          <Text style={{ color: '#64748b' }}>Holat</Text>
          <Title level={5} style={{ margin: '4px 0', color: '#102a43' }}>
            Barcha modullar tayyor
          </Title>
          <Text style={{ color: '#64748b' }}>
            Kurslar, testlar va foydalanuvchilar shu yerdan boshqariladi.
          </Text>
        </div>
      ) : null}
    </div>
  );
};

const SideNav = ({ collapsed, ...others }: SideNavProps) => {
  return (
    <Sider breakpoint="lg" theme="light" {...others}>
      <AdminSideNavContent collapsed={collapsed} />
    </Sider>
  );
};

export default SideNav;

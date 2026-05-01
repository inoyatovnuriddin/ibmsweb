import {
  Avatar,
  Button,
  Descriptions,
  DescriptionsProps,
  Drawer,
  Dropdown,
  Grid,
  Layout,
  message,
  Space,
  Tag,
  Tooltip,
  Typography,
  Upload,
} from 'antd';
import { Card, Logo } from '../../components';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  PATH_AUTH,
  PATH_DASHBOARD,
  PATH_LANDING,
  USER_PROFILE_ITEMS,
} from '../../constants';
import './styles.css';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { apiClient } from '../../services/api.ts';
import { useSelector } from 'react-redux';
import {
  AppstoreOutlined,
  EditOutlined,
  FileSearchOutlined,
  GlobalOutlined,
  HomeOutlined,
  InfoCircleOutlined,
  LockOutlined,
  LogoutOutlined,
  MenuOutlined,
  MessageOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  UploadOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { RcFile, UploadChangeParam } from 'antd/es/upload';
import type { RootState } from '../../redux/store.ts';
import type { CurrentUser } from '../../redux/auth/authApi.ts';

const { Header, Content } = Layout;
const { Text, Title } = Typography;
const { useBreakpoint } = Grid;

interface User {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phoneNumber: string;
  status: 'Active' | 'Confirm' | 'Block';
  roles: string[];
}

const profileIcons: Record<string, ReactNode> = {
  details: <InfoCircleOutlined />,
  security: <LockOutlined />,
  preferences: <SettingOutlined />,
  information: <SafetyCertificateOutlined />,
  activity: <GlobalOutlined />,
  actions: <EditOutlined />,
  help: <FileSearchOutlined />,
  feedback: <MessageOutlined />,
};

export const UserAccountLayout = () => {
  const screens = useBreakpoint();
  const isDesktop = !!screens.xl;
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useSelector((state: RootState) => state.auth.currentUser);
  const [user, setUser] = useState<User>();
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleImageChange = (info: UploadChangeParam) => {
    const file = info.file.originFileObj as RcFile;
    const reader = new FileReader();
    reader.onload = () => {
      setProfileImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    getMe();
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!currentUser) return;

    setUser(mapCurrentUserToLayoutUser(currentUser));
  }, [currentUser]);

  const getMe = async () => {
    const res = await apiClient.get('/v1/users/account');
    setUser(res.data);
  };

  const descriptionItems: DescriptionsProps['items'] = useMemo(
    () => [
      {
        key: 'full-name',
        label: 'F.I.Sh.',
        children: <span>{`${user?.firstname || ''} ${user?.lastname || ''}`}</span>,
      },
      {
        key: 'email',
        label: 'Email',
        children: user?.email ? (
          <Typography.Link href={`mailto:${user.email}`}>{user.email}</Typography.Link>
        ) : (
          '-'
        ),
      },
      {
        key: 'telephone',
        label: 'Telefon',
        children: user?.phoneNumber ? (
          <Typography.Link href={`tel:${user.phoneNumber}`}>
            {user.phoneNumber}
          </Typography.Link>
        ) : (
          '-'
        ),
      },
      {
        key: 'status',
        label: 'Holat',
        children: user?.status || '-',
      },
    ],
    [user]
  );

  const isAdmin = user?.roles?.includes('ROLE_ADMIN');

  const activeItem =
    USER_PROFILE_ITEMS.find((item) => location.pathname.includes(item.title)) ||
    USER_PROFILE_ITEMS[0];

  const profileDropdownItems = [
    {
      key: 'profile-details',
      icon: <UserOutlined />,
      label: 'Profil',
      onClick: () => navigate('/user-profile/details'),
    },
    {
      key: 'profile-security',
      icon: <LockOutlined />,
      label: 'Xavfsizlik',
      onClick: () => navigate('/user-profile/security'),
    },
    ...(isAdmin
      ? [
          {
            key: 'profile-dashboard',
            icon: <AppstoreOutlined />,
            label: 'Dashboard',
            onClick: () => navigate(PATH_DASHBOARD.users),
          },
        ]
      : []),
    {
      type: 'divider' as const,
    },
    {
      key: 'profile-logout',
      icon: <LogoutOutlined />,
      danger: true,
      label: 'Chiqish',
      onClick: () => {
        localStorage.clear();
        message.success('Hisobdan chiqildi');
        navigate(PATH_AUTH.signin);
      },
    },
  ];

  const renderSidebar = () => (
    <Card
      style={{
        borderRadius: 24,
        boxShadow: '0 18px 42px rgba(15,23,42,0.05)',
        position: isDesktop ? 'sticky' : 'static',
        top: 108,
      }}
      bodyStyle={{ padding: 20 }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 12,
          paddingBottom: 18,
          borderBottom: '1px solid rgba(148,163,184,0.12)',
        }}
      >
        {profileImageUrl ? (
          <Avatar src={profileImageUrl} size={112} />
        ) : (
          <Avatar
            icon={<UserOutlined />}
            size={112}
            style={{ background: '#eff6ff', color: '#1d4ed8' }}
          />
        )}

        <div>
          <Title level={4} style={{ margin: 0, color: '#102a43' }}>
            {user ? `${user.firstname} ${user.lastname}` : 'Foydalanuvchi'}
          </Title>
          <Text style={{ color: '#64748b' }}>{user?.email || 'Email mavjud emas'}</Text>
        </div>

        <Space wrap size={8} style={{ justifyContent: 'center' }}>
          <Tag
            style={{
              margin: 0,
              borderRadius: 999,
              padding: '6px 12px',
              background: '#eff6ff',
              color: '#1d4ed8',
              border: '1px solid rgba(29,78,216,0.12)',
            }}
          >
            {user?.status || 'Status'}
          </Tag>
          {isAdmin ? <Tag color="gold">Admin</Tag> : null}
        </Space>

        <Upload
          showUploadList={false}
          beforeUpload={() => false}
          onChange={handleImageChange}
        >
          <Button icon={<UploadOutlined />} style={{ borderRadius: 12 }}>
            Rasmni yangilash
          </Button>
        </Upload>
      </div>

      <div style={{ paddingTop: 18 }}>
        <Text
          style={{
            display: 'block',
            marginBottom: 12,
            color: '#64748b',
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          Profil bo‘limlari
        </Text>

        <div className="user-profile-menu-list">
          {USER_PROFILE_ITEMS.map((item) => {
            const selected = activeItem.title === item.title;
            const content = (
              <div
                className={`user-profile-menu-item${selected ? ' is-active' : ''}${
                  item.disabled ? ' is-disabled' : ''
                }`}
              >
                <span className="user-profile-menu-icon">
                  {profileIcons[item.title] || <InfoCircleOutlined />}
                </span>
                <span>{item.label}</span>
              </div>
            );

            if (item.disabled) {
              return (
                <Tooltip
                  key={item.title}
                  title="Bu bo‘lim keyinroq faollashtiriladi"
                  placement={isDesktop ? 'right' : 'top'}
                >
                  <div>{content}</div>
                </Tooltip>
              );
            }

            return (
              <Link
                key={item.title}
                to={item.path}
                style={{ textDecoration: 'none' }}
                onClick={() => setMobileSidebarOpen(false)}
              >
                {content}
              </Link>
            );
          })}
        </div>
      </div>
    </Card>
  );

  return (
    <Layout
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top left, rgba(59,130,246,0.06), transparent 20%), linear-gradient(180deg, #fffdf8 0%, #f8fafc 100%)',
      }}
    >
      <Header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          height: 'auto',
          lineHeight: 'normal',
          padding: isDesktop ? '18px 22px' : '16px',
          background: 'rgba(255,255,255,0.92)',
          borderBottom: '1px solid rgba(148,163,184,0.12)',
          backdropFilter: 'blur(14px)',
        }}
      >
        <div className="profile-topbar">
          <div className="profile-topbar-main">
            {!isDesktop ? (
              <Button
                icon={<MenuOutlined />}
                onClick={() => setMobileSidebarOpen(true)}
                className="profile-topbar-menu-btn"
              />
            ) : null}
            <Logo color="blue" asLink href={PATH_LANDING.root} imgSize={{ h: isDesktop ? 54 : 44 }} />
            <div className="profile-topbar-title">
              <Text style={{ color: '#64748b', fontSize: isDesktop ? 15 : 13 }}>Shaxsiy kabinet</Text>
              <Title
                level={4}
                style={{
                  margin: '2px 0 0',
                  color: '#102a43',
                  whiteSpace: isDesktop ? 'nowrap' : 'normal',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontSize: isDesktop ? undefined : 18,
                }}
              >
                {activeItem.label}
              </Title>
            </div>
          </div>

          <Space size={10} wrap className="profile-topbar-actions">
            <Link to={PATH_LANDING.root}>
              <Button icon={<HomeOutlined />} className="profile-topbar-action-btn">
                Bosh sahifa
              </Button>
            </Link>

            <Dropdown menu={{ items: profileDropdownItems }} trigger={['click']}>
              <Button
                type="text"
                className="profile-topbar-profile-btn"
              >
                <Space size={10}>
                  <Avatar
                    src={profileImageUrl || undefined}
                    icon={<UserOutlined />}
                    size={isDesktop ? 38 : 34}
                  />
                  <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
                    <Text style={{ display: 'block', color: '#102a43', fontSize: isDesktop ? 14 : 13 }}>
                      {user ? `${user.firstname} ${user.lastname}` : 'Profil'}
                    </Text>
                    <Text style={{ color: '#64748b', fontSize: 12 }}>
                      {isDesktop ? 'Menyu' : 'Profil menyusi'}
                    </Text>
                  </div>
                </Space>
              </Button>
            </Dropdown>
          </Space>
        </div>
      </Header>

      {!isDesktop ? (
        <Drawer
          placement="left"
          open={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          width={340}
          closable={false}
          bodyStyle={{ padding: 16, background: '#f8fafc' }}
        >
          {renderSidebar()}
        </Drawer>
      ) : null}

      <Content style={{ padding: isDesktop ? '28px 22px 40px' : '18px 16px 24px' }}>
        <div className="user-account-shell">
          {isDesktop ? <aside className="user-account-sidebar">{renderSidebar()}</aside> : null}

          <main className="user-account-main">
            <Card
              className="user-profile-summary"
              style={{
                borderRadius: 24,
                boxShadow: '0 18px 42px rgba(15,23,42,0.05)',
              }}
            >
              <div className="user-profile-summary-grid">
                <div>
                  <Text style={{ color: '#64748b' }}>Aktiv bo‘lim</Text>
                  <Title level={3} style={{ margin: '6px 0 0', color: '#102a43' }}>
                    {activeItem.label}
                  </Title>
                </div>
                <div>
                  <Descriptions
                    items={descriptionItems}
                    column={{ xs: 1, sm: 2, md: 2 }}
                  />
                </div>
              </div>
            </Card>

            <div style={{ marginTop: 24 }}>
              <Outlet />
            </div>
          </main>
        </div>
      </Content>
    </Layout>
  );
};

const mapCurrentUserToLayoutUser = (user: CurrentUser): User => ({
  id: user.id,
  firstname: user.firstName || '',
  lastname: user.lastName || '',
  email: user.email || '',
  phoneNumber: user.phoneNumber || '',
  status:
    user.status === 'Confirm' || user.status === 'Block'
      ? user.status
      : 'Active',
  roles: user.roles || [],
});

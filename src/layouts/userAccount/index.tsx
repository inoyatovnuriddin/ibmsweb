import {
  Avatar,
  Button,
  Drawer,
  Dropdown,
  Grid,
  Layout,
  message,
  Space,
  Switch,
  theme,
  Tooltip,
  Typography,
  Upload,
} from 'antd';
import ImgCrop from 'antd-img-crop';
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
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme } from '../../redux/theme/themeSlice.ts';
import {
  AppstoreOutlined,
  EditOutlined,
  FileSearchOutlined,
  GlobalOutlined,
  InfoCircleOutlined,
  LockOutlined,
  LogoutOutlined,
  MenuOutlined,
  MessageOutlined,
  MoonOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  SunOutlined,
  UploadOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { RootState } from '../../redux/store.ts';
import type { CurrentUser } from '../../redux/auth/authApi.ts';
import { FiMail, FiPhone, FiShield, FiUser } from 'react-icons/fi';
import { useAppTranslation } from '../../hooks/useAppTranslation.ts';

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
  userImage?: string | null;
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

const profileLabelKeyByTitle: Record<string, string> = {
  details: 'user.details',
  security: 'user.security',
  'my-learning': 'user.myLearning',
  preferences: 'user.preferences',
  information: 'user.personalInformation',
  activity: 'user.activity',
  actions: 'user.actions',
  help: 'user.help',
  feedback: 'user.feedback',
};

const translateStatusLabel = (status: User['status'] | undefined, t: (key: string) => string) => {
  if (status === 'Active') return t('user.statusActive');
  if (status === 'Confirm') return t('user.statusConfirm');
  if (status === 'Block') return t('user.statusBlocked');
  return t('common.unknown');
};

export const UserAccountLayout = () => {
  const screens = useBreakpoint();
  const isDesktop = !!screens.xl;
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { mytheme } = useSelector((state: RootState) => state.theme);
  const currentUser = useSelector((state: RootState) => state.auth.currentUser);
  const { token } = theme.useToken();
  const { language, t } = useAppTranslation();
  const [user, setUser] = useState<User>();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const profileImageUrl = user?.userImage || currentUser?.userImage || null;

  useEffect(() => {
    getMe();
    setMobileSidebarOpen(false);
  }, [language, location.pathname]);

  useEffect(() => {
    if (!currentUser) return;

    // Merge redux user without dropping the richer /v1/users/account data (esp. userImage,
    // which is populated even before the backend /auth/me change is deployed).
    setUser((prev) => {
      const mapped = mapCurrentUserToLayoutUser(currentUser);
      return { ...mapped, userImage: currentUser.userImage || prev?.userImage || null };
    });
  }, [currentUser]);

  const getMe = async () => {
    const res = await apiClient.get('/v1/users/account');
    setUser(res.data);
  };

  /** Uploads the cropped photo as the current user's profile image, then refreshes. */
  const uploadProfilePhoto = async (file: File) => {
    setPhotoUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file, file.name || 'avatar.png');
      await apiClient.post('/v1/attachment/update/profile-image', formData);
      message.success(t('user.updatePhoto'));
      await getMe();
    } catch {
      message.error(t('common.unknown'));
    } finally {
      setPhotoUploading(false);
    }
  };

  const isAdmin = user?.roles?.includes('ROLE_ADMIN');
  // Only admins/super admins may change a profile photo (self or others).
  const canEditPhoto = Boolean(
    (currentUser?.roles || user?.roles || []).some(
      (role) => role === 'ROLE_ADMIN' || role === 'ROLE_SUPER_ADMIN'
    )
  );

  const activeItem =
    USER_PROFILE_ITEMS.find((item) => location.pathname.includes(item.title)) ||
    USER_PROFILE_ITEMS[0];

  const getProfileItemLabel = (title: string) =>
    t(profileLabelKeyByTitle[title] || 'user.details');

  const summaryDetails = useMemo(
    () => [
      {
        key: 'full-name',
        label: t('user.fullName'),
        value: `${user?.firstname || ''} ${user?.lastname || ''}`.trim() || t('common.notProvided'),
        icon: <FiUser />,
        wide: true,
      },
      {
        key: 'email',
        label: t('user.email'),
        value: user?.email || t('common.notProvided'),
        icon: <FiMail />,
      },
      {
        key: 'telephone',
        label: t('user.phone'),
        value: user?.phoneNumber || t('common.notProvided'),
        icon: <FiPhone />,
      },
      {
        key: 'status',
        label: t('user.status'),
        value: translateStatusLabel(user?.status, t),
        icon: <FiShield />,
      },
    ],
    [t, user]
  );

  const profileDropdownItems = [
    {
      key: 'profile-details',
      icon: <UserOutlined />,
      label: t('dashboard.profile'),
      onClick: () => navigate('/user-profile/details'),
    },
    {
      key: 'profile-security',
      icon: <LockOutlined />,
      label: t('user.security'),
      onClick: () => navigate('/user-profile/security'),
    },
    ...(isAdmin
      ? [
          {
            key: 'profile-dashboard',
            icon: <AppstoreOutlined />,
            label: t('user.dashboard'),
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
      label: t('dashboard.logout'),
      onClick: () => {
        localStorage.clear();
        message.success(t('dashboard.logoutSuccess'));
        navigate(PATH_AUTH.signin);
      },
    },
  ];

  const renderSidebar = () => (
    <Card
      style={{
        borderRadius: 24,
        boxShadow: 'var(--color-shadow-soft)',
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
            style={{ background: 'var(--color-fill-soft)', color: '#1d4ed8' }}
          />
        )}

        <div>
          <Title level={4} style={{ margin: 0, color: token.colorText }}>
            {user ? `${user.firstname} ${user.lastname}` : t('dashboard.profile')}
          </Title>
          <Text style={{ color: token.colorTextSecondary }}>{user?.email || t('common.notProvided')}</Text>
        </div>

        {canEditPhoto ? (
          <ImgCrop
            rotationSlider
            showGrid
            aspect={1}
            modalTitle={t('user.updatePhoto')}
          >
            <Upload
              accept="image/*"
              maxCount={1}
              showUploadList={false}
              beforeUpload={(file) => {
                if (!file.type.startsWith('image/')) {
                  message.error(t('user.updatePhoto'));
                  return Upload.LIST_IGNORE;
                }
                if (file.size / 1024 / 1024 >= 5) {
                  message.error('≤ 5MB');
                  return Upload.LIST_IGNORE;
                }
                void uploadProfilePhoto(file);
                return false;
              }}
            >
              <Button
                icon={<UploadOutlined />}
                loading={photoUploading}
                style={{ borderRadius: 12 }}
              >
                {t('user.updatePhoto')}
              </Button>
            </Upload>
          </ImgCrop>
        ) : null}
      </div>

      <div style={{ paddingTop: 18 }}>
        <Text
          style={{
            display: 'block',
            marginBottom: 12,
            color: token.colorTextSecondary,
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {t('user.sectionTitle')}
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
                <span>{getProfileItemLabel(item.title)}</span>
              </div>
            );

            if (item.disabled) {
              return (
                <Tooltip
                  key={item.title}
                  title={t('user.pendingSection')}
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
        background: token.colorBgLayout,
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
          background: mytheme === 'dark'
            ? 'var(--header-shell-bg)'
            : 'var(--header-shell-bg)',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          backdropFilter: 'blur(14px)',
        }}
      >
        <div className="profile-topbar">
          <div className="profile-topbar-main">
            {!isDesktop ? (
              <Button
                type="primary"
                ghost
                icon={<MenuOutlined />}
                onClick={() => setMobileSidebarOpen(true)}
                className="profile-topbar-menu-btn"
                aria-label={t('user.menu')}
              >
                {t('user.menu')}
              </Button>
            ) : null}
            <Logo color="blue" asLink href={PATH_LANDING.root} imgSize={{ h: isDesktop ? 54 : 44 }} />
            <div className="profile-topbar-title">
              <Text style={{ color: token.colorTextSecondary, fontSize: isDesktop ? 15 : 13 }}>{t('user.personalCabinet')}</Text>
              <Title
                level={4}
                style={{
                  margin: '2px 0 0',
                  color: token.colorText,
                  whiteSpace: isDesktop ? 'nowrap' : 'normal',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontSize: isDesktop ? undefined : 18,
                }}
              >
                {getProfileItemLabel(activeItem.title)}
              </Title>
            </div>
          </div>

          <Space size={10} wrap className="profile-topbar-actions">
            {/* Тема переключается только на широком экране: на телефоне тот же
                переключатель уже есть в разделе «Настройки». */}
            {isDesktop ? (
              <Switch
                checkedChildren={<SunOutlined />}
                unCheckedChildren={<MoonOutlined />}
                checked={mytheme === 'dark'}
                onClick={() => dispatch(toggleTheme())}
                style={{ flexShrink: 0 }}
              />
            ) : null}

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
                  {/* На телефоне имя не помещается рядом с кнопкой меню — оставляем аватар. */}
                  {isDesktop ? (
                    <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
                      <Text style={{ display: 'block', color: token.colorText, fontSize: 14 }}>
                        {user ? `${user.firstname} ${user.lastname}` : t('dashboard.profile')}
                      </Text>
                      <Text style={{ color: token.colorTextSecondary, fontSize: 12 }}>
                        {t('user.menu')}
                      </Text>
                    </div>
                  ) : null}
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
          bodyStyle={{ padding: 16, background: token.colorBgLayout }}
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
                boxShadow: 'var(--color-shadow-soft)',
              }}
            >
              <div className="user-profile-summary-grid">
                <div className="user-profile-summary-main">
                  <Text className="user-profile-summary-eyebrow">{t('user.activeSection')}</Text>
                  <Title level={3} style={{ margin: '4px 0 6px', color: token.colorText }}>
                    {getProfileItemLabel(activeItem.title)}
                  </Title>
                  <Text className="user-profile-summary-description">
                    {t('user.summaryDescription')}
                  </Text>

                  <div className="user-profile-summary-pills">
                    <span className="user-profile-summary-pill is-primary">
                      <InfoCircleOutlined />
                      {getProfileItemLabel(activeItem.title)}
                    </span>
                    <span
                      className={`user-profile-summary-pill ${
                        user?.status === 'Active' ? 'is-success' : 'is-neutral'
                      }`}
                    >
                      <SafetyCertificateOutlined />
                      {user?.status === 'Active' ? t('user.activeProfile') : user?.status || t('user.statusUnknown')}
                    </span>
                    {isAdmin ? (
                      <span className="user-profile-summary-pill is-warning">
                        <AppstoreOutlined />
                        {t('dashboard.admin')}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="user-profile-summary-details">
                  {summaryDetails.map((item) => (
                    <div
                      key={item.key}
                      className={`user-profile-summary-detail-item${
                        item.wide ? ' is-wide' : ''
                      }`}
                    >
                      <div className="user-profile-summary-detail-icon">{item.icon}</div>
                      <div className="user-profile-summary-detail-copy">
                        <Text className="user-profile-summary-detail-label">{item.label}</Text>
                        <Text className="user-profile-summary-detail-value">{item.value}</Text>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <div style={{ marginTop: 24 }}>
              <div key={`${location.pathname}-${language}`}>
                <Outlet />
              </div>
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
  userImage: user.userImage || null,
  roles: user.roles || [],
});

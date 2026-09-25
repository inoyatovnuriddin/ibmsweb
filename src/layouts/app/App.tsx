import {
  Avatar,
  Button,
  Drawer,
  Dropdown,
  FloatButton,
  Grid,
  Layout,
  MenuProps,
  message,
  Space,
  Switch,
  theme,
  Typography,
} from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import {
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  SettingOutlined,
  SunOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  CSSTransition,
  SwitchTransition,
  TransitionGroup,
} from 'react-transition-group';
import { useDispatch, useSelector } from 'react-redux';
import SideNav, { AdminSideNavContent } from './SideNav.tsx';
import FooterNav from './FooterNav.tsx';
import { LanguageSelect, NProgress } from '../../components';
import { PATH_LANDING } from '../../constants';
import { toggleTheme } from '../../redux/theme/themeSlice.ts';
import { RootState } from '../../redux/store.ts';
import { useAppTranslation } from '../../hooks/useAppTranslation.ts';

const { Content, Header } = Layout;
const { Text, Title } = Typography;
const { useBreakpoint } = Grid;

type AppLayoutProps = {
  children: ReactNode;
};

export const AppLayout = ({ children }: AppLayoutProps) => {
  const screens = useBreakpoint();
  const isDesktop = !!screens.lg;
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const nodeRef = useRef(null);
  const dispatch = useDispatch();
  const { mytheme } = useSelector((state: RootState) => state.theme);
  const currentUser = useSelector((state: RootState) => state.auth.currentUser);
  const { language, t } = useAppTranslation();
  const { token } = theme.useToken();
  const asideWidth = isDesktop ? (collapsed ? 92 : 248) : 0;
  const currentSection = useMemo(
    () => {
      if (location.pathname.includes('/dashboards/courses')) return t('dashboard.courses');
      if (location.pathname.includes('/dashboards/topics')) return t('dashboard.topics');
      if (location.pathname.includes('/dashboards/videos')) return t('dashboard.videos');
      if (location.pathname.includes('/dashboards/tests')) return t('dashboard.tests');
      if (location.pathname.includes('/dashboards/users')) return t('dashboard.users');
      if (location.pathname.includes('/dashboards/qrCode')) return t('dashboard.qrCode');
      if (location.pathname.includes('/dashboards/contact-requests')) return t('dashboard.contactRequests');
      if (location.pathname.includes('/groups')) return t('dashboard.groups');
      return t('dashboard.panel');
    },
    [location.pathname, t]
  );

  const items: MenuProps['items'] = [
    {
      key: 'user-profile-link',
      label: t('dashboard.profile'),
      icon: <UserOutlined />,
      onClick: () => navigate('/user-profile/details'),
    },
    {
      key: 'user-settings-link',
      label: t('dashboard.settings'),
      icon: <SettingOutlined />,
      onClick: () => navigate('/user-profile/security'),
    },
    {
      type: 'divider',
    },
    {
      key: 'user-logout-link',
      label: t('dashboard.logout'),
      icon: <LogoutOutlined />,
      danger: true,
      onClick: () => {
        message.open({
          type: 'loading',
          content: t('app.logout.loading'),
        });
        localStorage.clear();
        setTimeout(() => {
          navigate(PATH_LANDING.root);
        }, 700);
      },
    },
  ];

  useEffect(() => {
    const syncCollapsed = () => {
      if (window.innerWidth >= 1280) {
        setCollapsed(false);
      } else if (window.innerWidth >= 992) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };

    syncCollapsed();
    window.addEventListener('resize', syncCollapsed);
    return () => window.removeEventListener('resize', syncCollapsed);
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  return (
    <>
      <NProgress isAnimating={isLoading} key={location.key} />
      <Layout
        style={{
          minHeight: '100vh',
          background: token.colorBgLayout,
        }}
      >
        {isDesktop ? (
          <SideNav
            trigger={null}
            collapsible
            collapsed={collapsed}
            width={248}
            collapsedWidth={92}
            onCollapse={(value) => setCollapsed(value)}
            style={{
              overflow: 'auto',
              position: 'fixed',
              left: 0,
              top: 0,
              bottom: 0,
              background: 'transparent',
              border: 'none',
              padding: 18,
            }}
          />
        ) : null}

        {!isDesktop ? (
          <Drawer
            placement="left"
            open={mobileNavOpen}
            onClose={() => setMobileNavOpen(false)}
            width={320}
            closable={false}
            bodyStyle={{ padding: 16, background: token.colorBgContainer }}
          >
            <AdminSideNavContent />
          </Drawer>
        ) : null}

        <Layout
          style={{
            marginLeft: asideWidth,
            transition: 'margin-left .24s ease',
            background: 'transparent',
          }}
        >
          <Header
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 60,
              background: 'transparent',
              padding: isDesktop ? '18px 24px 0' : '16px 16px 0',
              height: 'auto',
              lineHeight: 'normal',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 18,
                padding: isDesktop ? '14px 18px' : '14px 14px',
                borderRadius: 20,
                background: 'var(--header-shell-bg)',
                border: `1px solid ${token.colorBorderSecondary}`,
                boxShadow: 'var(--color-shadow-soft)',
                backdropFilter: 'blur(10px)',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                <Button
                  type="text"
                  icon={
                    isDesktop
                      ? collapsed
                        ? <MenuUnfoldOutlined />
                        : <MenuFoldOutlined />
                      : <MenuUnfoldOutlined />
                  }
                  onClick={() =>
                    isDesktop ? setCollapsed(!collapsed) : setMobileNavOpen(true)
                  }
                  style={{
                    fontSize: 18,
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: token.colorBgContainer,
                    border: `1px solid ${token.colorBorderSecondary}`,
                    flexShrink: 0,
                  }}
                />
                <div style={{ minWidth: 0 }}>
                  <Text style={{ color: token.colorTextSecondary, fontSize: 13 }}>
                    {t('dashboard.panel')}
                  </Text>
                  <Title
                    level={4}
                    style={{
                      margin: '2px 0 0',
                      color: token.colorText,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {currentSection}
                  </Title>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  flexWrap: 'wrap',
                  justifyContent: 'flex-end',
                  width: isDesktop ? 'auto' : '100%',
                }}
              >
                {/* Тот же переключатель языка, что и на главной. */}
                <LanguageSelect compact size="middle" width={isDesktop ? 160 : 140} />
                <Switch
                  checkedChildren={<SunOutlined />}
                  unCheckedChildren={<MoonOutlined />}
                  checked={mytheme === 'dark'}
                  onClick={() => dispatch(toggleTheme())}
                />
                <Dropdown menu={{ items }} trigger={['click']}>
                  <Button
                    type="text"
                    style={{
                      height: 44,
                      padding: '0 8px',
                      borderRadius: 999,
                    }}
                  >
                    <Space size={10}>
                      <Avatar
                        src={currentUser?.userImage || undefined}
                        size={38}
                        icon={<UserOutlined />}
                      />
                      <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
                        <Text style={{ display: 'block', color: token.colorText }}>
                          {currentUser
                            ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() ||
                              t('dashboard.admin')
                            : t('dashboard.admin')}
                        </Text>
                        <Text style={{ color: token.colorTextSecondary, fontSize: 12 }}>
                          {t('dashboard.panel')}
                        </Text>
                      </div>
                    </Space>
                  </Button>
                </Dropdown>
              </div>
            </div>
          </Header>

          <Content
            style={{
              padding: isDesktop ? '22px 24px 28px' : '18px 16px 24px',
              minHeight: 360,
            }}
          >
            <TransitionGroup>
              <SwitchTransition>
                <CSSTransition
                  key={`css-transition-${location.key}-${language}`}
                  nodeRef={nodeRef}
                  onEnter={() => setIsLoading(true)}
                  onEntered={() => setIsLoading(false)}
                  timeout={260}
                  classNames="bottom-to-top"
                  unmountOnExit
                >
                  {() => (
                    <div ref={nodeRef} style={{ background: 'none' }}>
                      {children}
                    </div>
                  )}
                </CSSTransition>
              </SwitchTransition>
            </TransitionGroup>
            <FloatButton.BackTop />
          </Content>

          <FooterNav
            style={{
              marginLeft: 0,
              background: 'transparent',
              padding: isDesktop ? '0 24px 22px' : '0 16px 18px',
            }}
          />
        </Layout>
      </Layout>
    </>
  );
};

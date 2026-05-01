import {
  Avatar,
  Button,
  Drawer,
  Dropdown,
  FloatButton,
  Grid,
  Input,
  Layout,
  MenuProps,
  message,
  Space,
  Switch,
  Tag,
  Typography,
} from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import {
  BellOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  SearchOutlined,
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
import { NProgress } from '../../components';
import { PATH_LANDING } from '../../constants';
import { toggleTheme } from '../../redux/theme/themeSlice.ts';
import { RootState } from '../../redux/store.ts';

const { Content, Header } = Layout;
const { Text, Title } = Typography;
const { useBreakpoint } = Grid;

type AppLayoutProps = {
  children: ReactNode;
};

const resolveSectionLabel = (pathname: string) => {
  if (pathname.includes('/dashboards/courses')) return 'Kurslar';
  if (pathname.includes('/dashboards/topics')) return 'Mavzular';
  if (pathname.includes('/dashboards/videos')) return 'Videolar';
  if (pathname.includes('/dashboards/tests')) return 'Testlar';
  if (pathname.includes('/dashboards/users')) return 'Foydalanuvchilar';
  if (pathname.includes('/groups')) return 'Guruhlar';
  if (pathname.includes('/dashboards/qrCode')) return 'QR-kod';
  return 'Admin panel';
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
  const asideWidth = isDesktop ? (collapsed ? 92 : 248) : 0;
  const currentSection = useMemo(
    () => resolveSectionLabel(location.pathname),
    [location.pathname]
  );

  const items: MenuProps['items'] = [
    {
      key: 'user-profile-link',
      label: 'Profil',
      icon: <UserOutlined />,
      onClick: () => navigate('/user-profile/details'),
    },
    {
      key: 'user-settings-link',
      label: 'Sozlamalar',
      icon: <SettingOutlined />,
      onClick: () => navigate('/user-profile/security'),
    },
    {
      type: 'divider',
    },
    {
      key: 'user-logout-link',
      label: 'Chiqish',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: () => {
        message.open({
          type: 'loading',
          content: 'Hisobdan chiqilmoqda',
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
          background:
            'radial-gradient(circle at top left, rgba(59,130,246,0.06), transparent 18%), linear-gradient(180deg, #fffdf8 0%, #f8fafc 100%)',
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
            bodyStyle={{ padding: 16, background: '#f8fafc' }}
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
                background: 'rgba(255,255,255,0.88)',
                border: '1px solid rgba(148,163,184,0.12)',
                boxShadow: '0 10px 30px rgba(15,23,42,0.05)',
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
                    background: '#f8fafc',
                    border: '1px solid rgba(148,163,184,0.14)',
                    flexShrink: 0,
                  }}
                />
                <div style={{ minWidth: 0 }}>
                  <Text style={{ color: '#64748b', fontSize: 13 }}>
                    Boshqaruv paneli
                  </Text>
                  <Title
                    level={4}
                    style={{
                      margin: '2px 0 0',
                      color: '#102a43',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {currentSection}
                  </Title>
                </div>
                {isDesktop ? (
                  <Tag
                    style={{
                      margin: 0,
                      borderRadius: 999,
                      padding: '6px 12px',
                      background: '#eef4ff',
                      color: '#1d4ed8',
                      border: '1px solid rgba(29,78,216,0.12)',
                    }}
                  >
                    Admin
                  </Tag>
                ) : null}
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
                <Input
                  prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                  placeholder="Qidiruv"
                  style={{
                    width: isDesktop ? 240 : '100%',
                    maxWidth: '100%',
                    borderRadius: 12,
                    flex: isDesktop ? '0 0 auto' : '1 1 100%',
                  }}
                />
                <Button
                  icon={<BellOutlined />}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    flexShrink: 0,
                  }}
                />
                <Switch
                  checkedChildren={<MoonOutlined />}
                  unCheckedChildren={<SunOutlined />}
                  checked={mytheme === 'light'}
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
                      <Avatar src="/me.jpg" size={38} icon={<UserOutlined />} />
                      <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
                        <Text style={{ display: 'block', color: '#102a43' }}>
                          Administrator
                        </Text>
                        <Text style={{ color: '#64748b', fontSize: 12 }}>
                          Boshqaruv paneli
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
                  key={`css-transition-${location.key}`}
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

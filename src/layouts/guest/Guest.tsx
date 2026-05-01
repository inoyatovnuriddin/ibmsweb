import {
  Button,
  Drawer,
  FloatButton,
  Layout,
  Select,
  Space,
  Typography,
} from 'antd';
import {
  CSSTransition,
  SwitchTransition,
  TransitionGroup,
} from 'react-transition-group';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  LoginOutlined,
  MenuOutlined,
  PhoneOutlined,
  ProductOutlined,
  ReadOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useMediaQuery } from 'react-responsive';
import { motion } from 'framer-motion';
import { Logo, NProgress } from '../../components';
import { PATH_AUTH, PATH_COURSE, PATH_LANDING } from '../../constants';

const { Header, Content, Footer } = Layout;
const { Text, Title } = Typography;

const NAV_ITEMS = [
  {
    label: 'Bosh sahifa',
    href: '/',
    icon: <ProductOutlined />,
  },
  {
    label: 'Kurslar',
    href: PATH_COURSE.catalog,
    icon: <ReadOutlined />,
  },
  {
    label: 'Aloqa',
    href: '/#contact',
    icon: <PhoneOutlined />,
  },
];

const LANGUAGE_OPTIONS = [
  { value: 'uz-latn', label: "O'zbek" },
  { value: 'ru', label: 'Русский' },
  { value: 'uz-cyrl', label: 'Ўзбекча' },
];

export const GuestLayout = () => {
  const isMobile = useMediaQuery({ maxWidth: 992 });
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const nodeRef = useRef(null);
  const [navFill, setNavFill] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setNavFill(window.scrollY > 12);
    };

    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const authButton = useMemo(() => {
    if (localStorage.getItem('access_token')) {
      return (
        <Link to="/user-profile/details">
          <Button
            icon={<UserOutlined />}
            type="primary"
            size="large"
            style={{ height: 48, borderRadius: 16, paddingInline: 20 }}
          >
            Profil
          </Button>
        </Link>
      );
    }

    return (
      <Link to={PATH_AUTH.signin}>
        <Button
          icon={<LoginOutlined />}
          type="primary"
          size="large"
          style={{ height: 48, borderRadius: 16, paddingInline: 20 }}
        >
          Kirish
        </Button>
      </Link>
    );
  }, []);

  return (
    <>
      <NProgress isAnimating={isLoading} key={location.key} />
      <Layout style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <Header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            height: 'auto',
            lineHeight: 'normal',
            padding: '16px 20px',
            background: navFill ? 'rgba(255, 251, 245, 0.9)' : 'rgba(255, 255, 255, 0.72)',
            backdropFilter: 'blur(18px)',
            borderBottom: navFill
              ? '1px solid rgba(148,163,184,0.14)'
              : '1px solid transparent',
            transition: 'all .25s ease',
            boxShadow: navFill ? '0 14px 40px rgba(15,23,42,0.06)' : 'none',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            style={{
              maxWidth: 1320,
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            <Logo
              color="white"
              asLink
              href={PATH_LANDING.root}
              imgSize={{ h: 62 }}
            />

            {!isMobile ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  flex: 1,
                  justifyContent: 'flex-end',
                }}
              >
                <nav
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: 8,
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.84)',
                    border: '1px solid rgba(148,163,184,0.14)',
                  }}
                >
                  {NAV_ITEMS.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      style={{ textDecoration: 'none' }}
                    >
                      <Button
                        type="text"
                        icon={item.icon}
                        style={{
                          color: '#102a43',
                          height: 42,
                          borderRadius: 999,
                          paddingInline: 16,
                        }}
                      >
                        {item.label}
                      </Button>
                    </a>
                  ))}
                </nav>
                <Select
                  defaultValue="uz-latn"
                  options={LANGUAGE_OPTIONS}
                  size="large"
                  style={{ width: 148 }}
                  dropdownStyle={{ borderRadius: 16 }}
                />
                {authButton}
              </div>
            ) : (
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={() => setOpen(true)}
                style={{
                  color: '#102a43',
                  width: 46,
                  height: 46,
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.92)',
                  border: '1px solid rgba(148,163,184,0.14)',
                }}
              />
            )}
          </motion.div>
        </Header>

        <Content style={{ transition: 'all .25s ease' }}>
          <TransitionGroup>
            <SwitchTransition>
              <CSSTransition
                key={`css-transition-${location.key}`}
                nodeRef={nodeRef}
                onEnter={() => setIsLoading(true)}
                onEntered={() => setIsLoading(false)}
                timeout={300}
                classNames="page"
                unmountOnExit
              >
                {() => (
                  <div ref={nodeRef} className="site-layout-content">
                    <Outlet />
                  </div>
                )}
              </CSSTransition>
            </SwitchTransition>
          </TransitionGroup>
          <FloatButton.BackTop />
        </Content>

        <Footer
          style={{
            background: '#fffaf4',
            padding: '28px 20px 36px',
            borderTop: '1px solid rgba(148,163,184,0.12)',
          }}
        >
          <div
            style={{
              maxWidth: 1320,
              margin: '0 auto',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <Title level={4} style={{ color: '#102a43', margin: 0 }}>
                IBMS masofaviy taʼlim platformasi
              </Title>
              <Text style={{ color: '#486581' }}>
                Kasbiy rivojlanish uchun kurslar, mavzular va testlar yagona tizimda.
              </Text>
            </div>
            <Space wrap size="middle">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  style={{ color: '#102a43', textDecoration: 'none' }}
                >
                  {item.label}
                </a>
              ))}
            </Space>
          </div>
        </Footer>
      </Layout>

      <Drawer
        title="Navigatsiya"
        placement="right"
        onClose={() => setOpen(false)}
        open={open}
        styles={{
          body: {
            padding: 20,
            background:
              'linear-gradient(180deg, #fffaf4 0%, #eef7ff 100%)',
          },
          header: {
            background:
              'linear-gradient(180deg, #fffaf4 0%, #eef7ff 100%)',
            color: '#102a43',
            borderBottom: '1px solid rgba(148,163,184,0.12)',
          },
        }}
      >
        <Space direction="vertical" size={14} style={{ width: '100%' }}>
          <Select
            defaultValue="uz-latn"
            options={LANGUAGE_OPTIONS}
            size="large"
            style={{ width: '100%' }}
            dropdownStyle={{ borderRadius: 16 }}
          />
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              style={{ textDecoration: 'none' }}
              onClick={() => setOpen(false)}
            >
              <Button
                block
                icon={item.icon}
                style={{
                  height: 48,
                  borderRadius: 16,
                  justifyContent: 'flex-start',
                  color: '#102a43',
                  background: 'rgba(255,255,255,0.92)',
                  borderColor: 'rgba(148,163,184,0.14)',
                }}
              >
                {item.label}
              </Button>
            </a>
          ))}
          <div style={{ paddingTop: 6 }}>{authButton}</div>
        </Space>
      </Drawer>
    </>
  );
};

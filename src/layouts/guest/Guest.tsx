import {
  Button,
  Drawer,
  FloatButton,
  Layout,
  Select,
  Space,
  Switch,
  theme,
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
  MoonOutlined,
  PhoneOutlined,
  ProductOutlined,
  ReadOutlined,
  SunOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { useMediaQuery } from 'react-responsive';
import { motion } from 'framer-motion';
import { Logo, NProgress } from '../../components';
import { PATH_AUTH, PATH_COURSE, PATH_LANDING } from '../../constants';
import { toggleTheme } from '../../redux/theme/themeSlice.ts';
import { setLanguage } from '../../redux/language/languageSlice.ts';
import type { RootState } from '../../redux/store.ts';
import { LANGUAGE_OPTIONS } from '../../i18n';
import { useAppTranslation } from '../../hooks/useAppTranslation.ts';
import uzbekistanFlag from '../../assets/flags/uzbekistan.svg';
import russiaFlag from '../../assets/flags/russia.svg';

const { Header, Content, Footer } = Layout;
const { Text, Title } = Typography;

const LANGUAGE_FLAG_MAP = {
  uz: uzbekistanFlag,
  ru: russiaFlag,
  'uz-Cyrl': uzbekistanFlag,
} as const;

const renderLanguageOption = (option: (typeof LANGUAGE_OPTIONS)[number]) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
    <img
      src={LANGUAGE_FLAG_MAP[option.value]}
      alt={option.label}
      style={{
        width: 22,
        height: 16,
        objectFit: 'cover',
        borderRadius: 999,
        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.12)',
        flexShrink: 0,
      }}
    />
    <span
      style={{
        color: 'var(--color-text)',
        fontWeight: 600,
        fontSize: 16,
        lineHeight: 1.2,
        flex: 1,
        minWidth: 0,
      }}
    >
      {option.label}
    </span>
  </div>
);

const LANGUAGE_SELECT_OPTIONS = LANGUAGE_OPTIONS.map((option) => ({
  value: option.value,
  label: renderLanguageOption(option),
}));

export const GuestLayout = () => {
  const isMobile = useMediaQuery({ maxWidth: 992 });
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const nodeRef = useRef(null);
  const [navFill, setNavFill] = useState(false);
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();
  const { mytheme } = useSelector((state: RootState) => state.theme);
  const { token } = theme.useToken();
  const { language, t } = useAppTranslation();

  const navItems = useMemo(
    () => [
      { label: t('nav.home'), href: '/', icon: <ProductOutlined /> },
      { label: t('nav.courses'), href: PATH_COURSE.catalog, icon: <ReadOutlined /> },
      { label: t('nav.contact'), href: '/#contact', icon: <PhoneOutlined /> },
    ],
    [t]
  );

  useEffect(() => {
    const onScroll = () => setNavFill(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [location.pathname]);

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
            {t('nav.profile')}
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
          {t('nav.signIn')}
        </Button>
      </Link>
    );
  }, [t]);

  return (
    <>
      <NProgress isAnimating={isLoading} key={location.key} />
      <Layout style={{ minHeight: '100vh', background: token.colorBgLayout }}>
        <Header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            height: 'auto',
            lineHeight: 'normal',
            padding: '16px 20px',
            background: navFill
              ? (mytheme === 'dark' ? 'var(--header-bg-fill)' : 'rgba(255, 251, 245, 0.9)')
              : (mytheme === 'dark' ? 'var(--header-bg-empty)' : 'rgba(255, 255, 255, 0.72)'),
            backdropFilter: 'blur(18px)',
            borderBottom: navFill
              ? `1px solid ${token.colorBorderSecondary}`
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
            <Logo color="white" asLink href={PATH_LANDING.root} imgSize={{ h: 62 }} />

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
                    background: 'var(--nav-pill-bg)',
                    border: `1px solid ${token.colorBorderSecondary}`,
                  }}
                >
                  {navItems.map((item) => (
                    <a key={item.label} href={item.href} style={{ textDecoration: 'none' }}>
                      <Button
                        type="text"
                        icon={item.icon}
                        style={{
                          color: token.colorText,
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
                  value={language}
                  options={LANGUAGE_SELECT_OPTIONS}
                  size="large"
                  className="theme-language-select"
                  popupClassName="theme-language-dropdown"
                  dropdownStyle={{ borderRadius: 18, padding: 6 }}
                  style={{ width: 176 }}
                  onChange={(value) => dispatch(setLanguage(value))}
                />
                <Switch
                  checkedChildren={<SunOutlined />}
                  unCheckedChildren={<MoonOutlined />}
                  checked={mytheme === 'dark'}
                  onClick={() => dispatch(toggleTheme())}
                />
                {authButton}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Switch
                  checkedChildren={<SunOutlined />}
                  unCheckedChildren={<MoonOutlined />}
                  checked={mytheme === 'dark'}
                  onClick={() => dispatch(toggleTheme())}
                  size="small"
                />
                <Button
                  type="text"
                  icon={<MenuOutlined />}
                  onClick={() => setOpen(true)}
                  style={{
                    color: token.colorText,
                    width: 46,
                    height: 46,
                    borderRadius: 14,
                    background: token.colorBgContainer,
                    border: `1px solid ${token.colorBorderSecondary}`,
                  }}
                />
              </div>
            )}
          </motion.div>
        </Header>

        <Content style={{ transition: 'all .25s ease' }}>
          <TransitionGroup>
            <SwitchTransition>
              <CSSTransition
                key={`css-transition-${location.key}-${language}`}
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
            background: 'var(--footer-bg)',
            padding: '28px 20px 36px',
            borderTop: `1px solid ${token.colorBorderSecondary}`,
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
              <Title level={4} style={{ color: token.colorText, margin: 0 }}>
                {t('footer.platformTitle')}
              </Title>
              <Text style={{ color: token.colorTextSecondary }}>
                {t('footer.platformSubtitle')}
              </Text>
            </div>
            <Space wrap size="middle">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  style={{ color: token.colorText, textDecoration: 'none' }}
                >
                  {item.label}
                </a>
              ))}
            </Space>
          </div>
        </Footer>
      </Layout>

      <Drawer
        title={t('nav.navigation')}
        placement="right"
        onClose={() => setOpen(false)}
        open={open}
        styles={{
          body: {
            padding: 20,
            background: token.colorBgLayout,
          },
          header: {
            background: token.colorBgLayout,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
          },
        }}
      >
        <Space direction="vertical" size={14} style={{ width: '100%' }}>
          <Select
            value={language}
            options={LANGUAGE_SELECT_OPTIONS}
            size="large"
            className="theme-language-select"
            popupClassName="theme-language-dropdown"
            style={{ width: '100%' }}
            dropdownStyle={{ borderRadius: 18, padding: 6 }}
            onChange={(value) => dispatch(setLanguage(value))}
          />
          {navItems.map((item) => (
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
                  color: token.colorText,
                  background: token.colorBgContainer,
                  borderColor: token.colorBorderSecondary,
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

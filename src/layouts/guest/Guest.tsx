import {
  Button,
  Drawer,
  Flex,
  FloatButton,
  Layout,
  theme,
  Tooltip,
} from 'antd';
import {
  CSSTransition,
  SwitchTransition,
  TransitionGroup,
} from 'react-transition-group';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import {
  AppstoreAddOutlined,
  GithubOutlined,
  LoginOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PhoneOutlined,
  ProductOutlined,
  ReadOutlined,
  SolutionOutlined,
} from '@ant-design/icons';
import { useMediaQuery } from 'react-responsive';
import { Logo, NProgress } from '../../components';
import {
  PATH_AUTH,
  PATH_DASHBOARD,
  PATH_DOCS,
  PATH_GITHUB,
  PATH_LANDING,
} from '../../constants';

const { Header, Content, Footer } = Layout;

export const GuestLayout = () => {
  const {
    token: { borderRadius },
  } = theme.useToken();
  const isMobile = useMediaQuery({ maxWidth: 769 });
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const nodeRef = useRef(null);
  const [navFill, setNavFill] = useState(false);
  const [open, setOpen] = useState(false);

  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

  useEffect(() => {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        setNavFill(true);
      } else {
        setNavFill(false);
      }
    });
  }, []);

  return (
    <>
      <NProgress isAnimating={isLoading} key={location.key} />
      <Layout
        className="layout"
        style={{
          minHeight: '100vh',
          // backgroundColor: 'white',
        }}
      >
        <Header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            // background: navFill ? 'rgba(255, 255, 255, .5)' : 'none',
            backdropFilter: navFill ? 'blur(8px)' : 'none',
            boxShadow: navFill ? '0 0 8px 2px rgba(0, 0, 0, 0.05)' : 'none',
            gap: 12,
            position: 'sticky',
            top: 0,
            padding: isMobile ? '0 1rem' : '0 2rem',
            zIndex: 1,
            color: 'white',
          }}
        >
          <Logo color="blue" asLink href={PATH_LANDING.root} />
          {!isMobile ? (
            <>
              <Flex gap="small">
                <Link to={'#'}>
                  <Button icon={<ProductOutlined />} type="link">
                    Бош саҳифа
                  </Button>
                </Link>
                <Link to={'/courses'}>
                  <Button icon={<SolutionOutlined />} type="link">
                    Курслaр
                  </Button>
                </Link>
                <Link to={'#news'}>
                  <Button icon={<ReadOutlined />} type="link">
                    Янгиликлар
                  </Button>
                </Link>{' '}
                <Link to={'#contact'}>
                  <Button icon={<PhoneOutlined />} type="link">
                    Алоқа
                  </Button>
                </Link>
                <Link to={PATH_AUTH.signin}>
                  <Button icon={<LoginOutlined />} type="primary">
                    Kirish
                  </Button>
                </Link>
              </Flex>
            </>
          ) : (
            <Tooltip title={`Менюни ${!open ? 'очиш' : 'ёпиш'}`}>
              <Button
                type="text"
                icon={open ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={showDrawer}
                style={{
                  fontSize: '16px',
                  width: 48,
                  height: 48,
                  color: 'white',
                }}
              />
            </Tooltip>
          )}
        </Header>
        <Content
          style={{
            // background: 'rgba(255, 255, 255, 1)',
            borderRadius,
            transition: 'all .25s',
            paddingBottom: '10rem',
          }}
        >
          <TransitionGroup>
            <SwitchTransition>
              <CSSTransition
                key={`css-transition-${location.key}`}
                nodeRef={nodeRef}
                onEnter={() => {
                  setIsLoading(true);
                }}
                onEntered={() => {
                  setIsLoading(false);
                }}
                timeout={300}
                classNames="page"
                unmountOnExit
              >
                {() => (
                  <div
                    ref={nodeRef}
                    className="site-layout-content"
                    style={{ background: 'none' }}
                  >
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
            textAlign: 'center',
            backgroundColor: 'rgba(52, 152, 219, 0.2)',
          }}
        >
          IBMS &copy; {new Date().getFullYear()} Барча ҳуқуқлар ҳимояланган
        </Footer>
      </Layout>
      <Drawer title="Меню" placement="left" onClose={onClose} open={open}>
        <>
          <Flex gap="small" vertical>
            <Link to={'#'}>
              <Button icon={<ProductOutlined />} type="link">
                Бош саҳифа
              </Button>
            </Link>
            <Link to={'/courses'}>
              <Button icon={<SolutionOutlined />} type="link">
                Курслaр
              </Button>
            </Link>
            <Link to={'#news'}>
              <Button icon={<ReadOutlined />} type="link">
                Янгиликлар
              </Button>
            </Link>
            <Link to={'#contact'}>
              <Button icon={<PhoneOutlined />} type="link">
                Алоқа
              </Button>
            </Link>
            <Link to={PATH_AUTH.signin}>
              <Button icon={<LoginOutlined />} type="primary">
                Kirish
              </Button>
            </Link>
          </Flex>
        </>
      </Drawer>
    </>
  );
};

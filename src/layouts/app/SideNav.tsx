import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ConfigProvider, Layout, Menu, MenuProps, SiderProps } from 'antd';
import {
  BranchesOutlined,
  BugOutlined,
  FolderOpenOutlined,
  IdcardOutlined,
  InfoCircleOutlined,
  PieChartOutlined,
  ReadOutlined,
  SecurityScanOutlined,
  UserOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import { Logo } from '../../components';
import { Link, useLocation } from 'react-router-dom';
import {
  PATH_ABOUT,
  PATH_AUTH,
  PATH_CORPORATE,
  PATH_DASHBOARD,
  PATH_ERROR,
  PATH_LANDING,
  PATH_SITEMAP,
  PATH_USER_PROFILE,
} from '../../constants';
import { COLOR } from '../../App.tsx';

const { Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

const getItem = (
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
  type?: 'group'
): MenuItem => {
  return {
    key,
    icon,
    children,
    label,
    type,
  } as MenuItem;
};

const rootSubmenuKeys = ['dashboards', 'corporate', 'user-profile'];

type SideNavProps = SiderProps;

const SideNav = ({ ...others }: SideNavProps) => {
  const nodeRef = useRef(null);
  const { pathname } = useLocation();
  const [openKeys, setOpenKeys] = useState(['']);
  const [current, setCurrent] = useState('');

  const onClick: MenuProps['onClick'] = (e) => {
    console.log('click ', e);
  };

  const onOpenChange: MenuProps['onOpenChange'] = (keys) => {
    const latestOpenKey = keys.find((key) => openKeys.indexOf(key) === -1);
    if (latestOpenKey && rootSubmenuKeys.indexOf(latestOpenKey!) === -1) {
      setOpenKeys(keys);
    } else {
      setOpenKeys(latestOpenKey ? [latestOpenKey] : []);
    }
  };

  useEffect(() => {
    const paths = pathname.split('/');
    setOpenKeys(paths);
    setCurrent(paths[paths.length - 1]);
  }, [pathname]);

  const location = useLocation();

  const isDashboardPage = location.pathname.startsWith('/dashboard');
  const isUserProfilePage = location.pathname.startsWith('/user-profile');

  const items: MenuProps['items'] = useMemo(() => {
    return [
      !isUserProfilePage &&
        getItem('Dashboards', 'dashboards', <PieChartOutlined />, [
          getItem(
            <Link to={PATH_DASHBOARD.users}>Фойдаланувчилар</Link>,
            'users',
            <IdcardOutlined />
          ),
          getItem(
            <Link to={PATH_DASHBOARD.courses}>Курслар</Link>,
            'courses',
            <FolderOpenOutlined />
          ),
          getItem(
            <Link to={PATH_DASHBOARD.topics}>Мавзулар</Link>,
            'topics',
            <ReadOutlined />
          ),
          getItem(
            <Link to={PATH_DASHBOARD.videos}>Видеолар</Link>,
            'videos',
            <VideoCameraOutlined />
          ),
          getItem('Бошқалар', 'others', null, [
            getItem(
              <Link to={PATH_DASHBOARD.default}>Default</Link>,
              'default',
              null
            ),
            getItem(
              <Link to={PATH_DASHBOARD.projects}>Projects</Link>,
              'projects',
              null
            ),
            getItem(
              <Link to={PATH_DASHBOARD.ecommerce}>eCommerce</Link>,
              'ecommerce',
              null
            ),
            getItem(
              <Link to={PATH_DASHBOARD.marketing}>Marketing</Link>,
              'marketing',
              null
            ),
            getItem(
              <Link to={PATH_DASHBOARD.social}>Social</Link>,
              'social',
              null
            ),
            getItem(
              <Link to={PATH_DASHBOARD.bidding}>Bidding</Link>,
              'bidding',
              null
            ),
            getItem(
              <Link to={PATH_DASHBOARD.learning}>Learning</Link>,
              'learning',
              null
            ),
            getItem(
              <Link to={PATH_DASHBOARD.logistics}>Logistics</Link>,
              'logistics',
              null
            ),
          ]),
        ]),
      !isUserProfilePage &&
        getItem(
          <Link to={PATH_ABOUT.root}>About</Link>,
          'about',
          <InfoCircleOutlined />
        ),
      !isUserProfilePage &&
        getItem(
          <Link to={PATH_SITEMAP.root}>Sitemap</Link>,
          'sitemap',
          <BranchesOutlined />
        ),

      getItem('Pages', 'pages', null, [], 'group'),

      getItem('Corporate', 'corporate', <IdcardOutlined />, [
        getItem(<Link to={PATH_CORPORATE.about}>About</Link>, 'about', null),
        getItem(<Link to={PATH_CORPORATE.team}>Team</Link>, 'team', null),
        getItem(<Link to={PATH_CORPORATE.faqs}>FAQ</Link>, 'faqs', null),
        getItem(
          <Link to={PATH_CORPORATE.contact}>Contact us</Link>,
          'contact us',
          null
        ),
        getItem(
          <Link to={PATH_CORPORATE.pricing}>Pricing</Link>,
          'pricing',
          null
        ),
        getItem(
          <Link to={PATH_CORPORATE.license}>License</Link>,
          'license',
          null
        ),
      ]),

      !isDashboardPage &&
        getItem('Профил', 'user-profile', <UserOutlined />, [
          getItem(
            <Link to={PATH_USER_PROFILE.details}>Деталлар</Link>,
            'details',
            null
          ),
          getItem(
            <Link to={PATH_USER_PROFILE.preferences}>Афзалликлар</Link>,
            'preferences',
            null
          ),
          getItem(
            <Link to={PATH_USER_PROFILE.personalInformation}>Маълумот</Link>,
            'personal-information',
            null
          ),
          getItem(
            <Link to={PATH_USER_PROFILE.security}>Хавфсизлик</Link>,
            'security',
            null
          ),
          getItem(
            <Link to={PATH_USER_PROFILE.activity}>Фаолият</Link>,
            'activity',
            null
          ),
          getItem(
            <Link to={PATH_USER_PROFILE.action}>Ҳаракатлар</Link>,
            'actions',
            null
          ),
          getItem(<Link to={PATH_USER_PROFILE.help}>Ёрдам</Link>, 'help', null),
          getItem(
            <Link to={PATH_USER_PROFILE.feedback}>Фикр-мулоҳаза</Link>,
            'feedback',
            null
          ),
        ]),

      getItem('Аутентификация', 'authentication', <SecurityScanOutlined />, [
        getItem(<Link to={PATH_AUTH.signin}>Кириш</Link>, 'auth-signin', null),
        getItem(
          <Link to={PATH_AUTH.signup}>Рўйхатдан ўтиш</Link>,
          'auth-signup',
          null
        ),
        getItem(
          <Link to={PATH_AUTH.welcome}>Welcome</Link>,
          'auth-welcome',
          null
        ),
        getItem(
          <Link to={PATH_AUTH.verifyEmail}>Verify email</Link>,
          'auth-verify',
          null
        ),
        getItem(
          <Link to={PATH_AUTH.passwordReset}>Паролни тиклаш</Link>,
          'auth-password-reset',
          null
        ),
        getItem(
          <Link to={PATH_AUTH.accountDelete}>Аккаунтни ўчириш</Link>,
          'auth-account-deactivation',
          null
        ),
      ]),

      !isUserProfilePage &&
        getItem('Хатоликлар', 'errors', <BugOutlined />, [
          getItem(<Link to={PATH_ERROR.error400}>400</Link>, '400', null),
          getItem(<Link to={PATH_ERROR.error403}>403</Link>, '403', null),
          getItem(<Link to={PATH_ERROR.error404}>404</Link>, '404', null),
          getItem(<Link to={PATH_ERROR.error500}>500</Link>, '500', null),
          getItem(<Link to={PATH_ERROR.error503}>503</Link>, '503', null),
        ]),
    ].filter(Boolean);
  }, [isDashboardPage, isUserProfilePage]);

  return (
    <Sider ref={nodeRef} breakpoint="lg" collapsedWidth="0" {...others}>
      <Logo
        color="blue"
        asLink
        href={PATH_LANDING.root}
        justify="center"
        gap="small"
        imgSize={{ h: 28, w: 28 }}
        style={{ padding: '1rem 0' }}
      />
      <ConfigProvider
        theme={{
          components: {
            Menu: {
              itemBg: 'none',
              itemSelectedBg: COLOR['100'],
              itemHoverBg: COLOR['50'],
              itemSelectedColor: COLOR['600'],
            },
          },
        }}
      >
        <Menu
          mode="inline"
          items={items}
          onClick={onClick}
          openKeys={openKeys}
          onOpenChange={onOpenChange}
          selectedKeys={[current]}
          style={{ border: 'none' }}
        />
      </ConfigProvider>
    </Sider>
  );
};

export default SideNav;

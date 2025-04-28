import { Button, Col, Flex, Image, Row, theme, Typography } from 'antd';
import { useMediaQuery } from 'react-responsive';
import {
  PATH_AUTH,
  PATH_CORPORATE,
  PATH_DASHBOARD,
  PATH_ERROR,
  PATH_GITHUB,
  PATH_USER_PROFILE,
} from '../constants';
import { Link } from 'react-router-dom';
import {
  AntDesignOutlined,
  AppstoreOutlined,
  BorderOutlined,
  CalendarOutlined,
  DatabaseOutlined,
  EditOutlined,
  FileOutlined,
  FormatPainterOutlined,
  LoginOutlined,
  MergeCellsOutlined,
  PieChartOutlined,
  RocketFilled,
  TableOutlined,
} from '@ant-design/icons';
import { Card, Container } from '../components';
import { createElement, CSSProperties } from 'react';
import { CorporateContactPage } from './corporate';

const { Title, Text } = Typography;

const DASHBOARDS = [
  {
    title: '1. Автомобильный электрик',
    link: PATH_DASHBOARD.bidding,
    image: '/showcase/dashboard/image1.png',
  },
  {
    title: '2. Аппаратчик химводоочиски',
    link: PATH_DASHBOARD.default,
    image: '/showcase/dashboard/image2.png',
  },
  {
    title: '3. Аттестация сварщиков',
    link: PATH_DASHBOARD.ecommerce,
    image: '/showcase/dashboard/image3.png',
  },
  {
    title: '4. Безопасное ведение работ...',
    link: PATH_DASHBOARD.learning,
    image: '/showcase/dashboard/image4.png',
  },
  {
    title: '5. Безопасное ведение работ...',
    link: PATH_DASHBOARD.logistics,
    image: '/showcase/dashboard/image5.png',
  },
  {
    title: '6. Безопасное ведение работ...',
    link: PATH_DASHBOARD.marketing,
    image: '/showcase/dashboard/image6.png',
  },
  {
    title: '7. Бурильщик ЭРБС',
    link: PATH_DASHBOARD.projects,
    image: '/showcase/dashboard/image7.png',
  },
  {
    title: '8. Водители автокары',
    link: PATH_DASHBOARD.social,
    image: '/showcase/dashboard/image8.png',
  },
];

const APPS = [
  {
    title: 'Корпоратив',
    link: PATH_CORPORATE.team,
    image: '/showcase/corporate/team.png',
  },
  {
    title: 'Фойдаланувчи профили',
    link: PATH_USER_PROFILE.details,
    image: '/showcase/profile/details.png',
  },
  {
    title: 'Аутентификация',
    link: PATH_AUTH.signin,
    image: '/showcase/auth/login.png',
  },
  // {
  //   title: 'errors',
  //   link: PATH_ERROR.error400,
  //   image: '/showcase/errors/400.png',
  // },
];

const FEATURES = [
  {
    title: 'customizable theme',
    description:
      'We have included a configurable theme provider to customize your elegant admin.',
    icon: FormatPainterOutlined,
  },
  {
    title: '50+ Page Templates',
    description: 'We have 50+ pages to make your development easier.',
    icon: FileOutlined,
  },
  {
    title: '60+ UI components',
    description: 'Almost 60+ UI Components being given with Antd Admin Pack.',
    icon: AppstoreOutlined,
  },
  {
    title: 'Ant Design',
    description: 'Its been made with Ant Design and full responsive layout.',
    icon: AntDesignOutlined,
  },
  {
    title: '500+ font icons',
    description:
      'Lots of Icon Fonts are included here in the package of Antd Admin.',
    icon: BorderOutlined,
  },
  {
    title: 'Slick Carousel',
    description: 'The Last React Carousel You will Ever Need!.',
    icon: MergeCellsOutlined,
  },
  {
    title: 'Easy to Customize',
    description: 'Customization will be easy as we understand your pain.',
    icon: EditOutlined,
  },
  {
    title: 'Lots of Chart Options',
    description:
      'You name it and we have it, Yes lots of variations for Charts.',
    icon: PieChartOutlined,
  },
  {
    title: 'Lots of Table Examples',
    description: 'Data Tables are initial requirement and we added them.',
    icon: TableOutlined,
  },
  {
    title: 'Calendar Design',
    description: 'Calendar is available with our package & in nice design.',
    icon: CalendarOutlined,
  },
];

export const HomePage = () => {
  const {
    token: { colorPrimary },
  } = theme.useToken();
  const isMobile = useMediaQuery({ maxWidth: 769 });
  const isTablet = useMediaQuery({ maxWidth: 992 });

  const sectionStyles: CSSProperties = {
    paddingTop: isMobile ? 40 : 80,
    paddingBottom: isMobile ? 40 : 80,
    paddingRight: isMobile ? '1rem' : 0,
    paddingLeft: isMobile ? '1rem' : 0,
  };

  return (
    <div
      style={{
        // backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.35) 40%, rgba(255, 255, 255, 1) 40%), url('/grid-3d.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh',
      }}
    >
      <Flex
        vertical
        align="center"
        justify="center"
        style={{
          height: isTablet ? 600 : 800,
          width: '100%',
          padding: isMobile ? '2rem 1rem' : '5rem 0',
          // backgroundColor: 'rgba(255, 255, 255, 0.85)',
        }}
      >
        <Container>
          <Row style={{ alignItems: 'center' }}>
            <Col lg={12}>
              <Text
                style={{
                  color: colorPrimary,
                  fontSize: 16,
                  fontWeight: 700,
                }}
              >
                <RocketFilled /> Масофавий таьлим портали
              </Text>
              <Title
                style={{
                  fontSize: isMobile ? 36 : 40,
                  fontWeight: 900,
                  margin: '1.5rem 0',
                }}
              >
                Кадрлар малакасини ошириш ва қайта тайёрлаш бўйича{' '}
                <span className="text-highlight">интерактив</span> ва{' '}
                <span className="text-highlight">замонавий</span> платформа.
              </Title>
              <Text style={{ fontSize: 20, marginBottom: '1.5rem' }}>
                <span className="text-highlight fw-bolder">100+</span> касбий
                курслар
                {/*<br />*/}
                {/*📌 Интерактив курслар <br />*/}
                {/*📌 Сертификатлашган дастурлар <br />*/}
                {/*📌 Мутасадди ташкилотлар тасдиғи билан*/}
              </Text>
              <Flex
                gap="middle"
                vertical={isMobile}
                style={{ marginTop: '1.5rem' }}
              >
                <Link to={'/courses'}>
                  <Button
                    icon={<DatabaseOutlined />}
                    type="primary"
                    size="large"
                    block={isMobile}
                  >
                    Курслар рўйхати
                  </Button>
                </Link>
                <Link to={PATH_AUTH.signin}>
                  <Button
                    icon={<LoginOutlined />}
                    type="default"
                    size="large"
                    block={isMobile}
                  >
                    Рўйхатдан ўтиш
                  </Button>
                </Link>
              </Flex>
            </Col>
            {!isTablet && (
              <Col lg={12}>
                <Image src="/landing-image.png" alt="dashboard image snippet" />
              </Col>
            )}
          </Row>
        </Container>
      </Flex>
      <iframe
        src="https://player.vimeo.com/video/1077477578?h=0f6c40966d"
        width="800"
        height="600"
        frameBorder="0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        title="Vimeo Video"
      ></iframe>
      <Container style={sectionStyles}>
        <Title
          level={2}
          className="text-center"
          style={{ marginBottom: '2rem' }}
        >
          Курслар рўйхати
        </Title>
        <Row
          gutter={[
            { xs: 8, sm: 16, md: 24, lg: 32 },
            { xs: 8, sm: 16, md: 24, lg: 32 },
          ]}
          justify="center"
        >
          {DASHBOARDS.map((dashboard) => (
            <Col
              key={dashboard.title}
              xs={24}
              lg={8}
              xl={6}
              style={{ display: 'flex' }}
            >
              <Link to={dashboard.link} style={{ width: '100%' }}>
                <Card
                  hoverable
                  cover={
                    <img
                      src={dashboard.image}
                      alt={dashboard.title}
                      style={{ height: '200px', objectFit: 'fill' }}
                    />
                  }
                  style={{
                    flex: '1',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text className="m-0">{dashboard.title}</Text>
                </Card>
              </Link>
            </Col>
          ))}
        </Row>
      </Container>
      <Container style={sectionStyles}>
        <Title
          level={2}
          className="text-center"
          style={{ marginBottom: '2rem' }}
        >
          3+ саҳифа мавжуд
        </Title>
        <Row
          gutter={[
            { xs: 8, sm: 16, md: 24, lg: 32 },
            { xs: 8, sm: 16, md: 24, lg: 32 },
          ]}
          justify="center"
          align="middle"
        >
          {APPS.map((app) => (
            <Col key={app.title} xs={24} sm={12} lg={8} xl={6} style={{ display: "flex" }}>
              <Link to={app.link}>
                <Card hoverable cover={<img src={app.image} alt={app.title} />}>
                  <Text className="m-0 text-capitalize">{app.title}</Text>
                </Card>
              </Link>
            </Col>
          ))}
        </Row>
      </Container>
      <Container style={sectionStyles}>
        <Title
          level={2}
          className="text-center"
          style={{ marginBottom: '2rem' }}
        >
          Other Amazing Features & Flexibility Provided
        </Title>
        <Row
          gutter={[
            { xs: 8, sm: 16, md: 24, lg: 32 },
            { xs: 8, sm: 16, md: 24, lg: 32 },
          ]}
        >
          {FEATURES.map((feature) => (
            <Col key={feature.title} xs={24} md={12} lg={8}>
              <Card style={{ height: '100%' }}>
                <Flex vertical>
                  {createElement(feature.icon, {
                    style: { fontSize: 32, color: colorPrimary },
                  })}
                  <Title level={5} className="text-capitalize">
                    {feature.title}
                  </Title>
                  <Text>{feature.description}</Text>
                </Flex>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>

      <Container style={sectionStyles} id={"#contact"}>
        <CorporateContactPage />
      </Container>
      <Card
        style={{
          width: isMobile ? '95%' : 500,
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        <Title level={4} style={{ marginTop: 0 }}>
          Саволингизга жавоб топа олмадингизми?
        </Title>
        <Text style={{ marginTop: '1rem' }}>
          Биз билан қўнғироқ орқали боғланинг ёки электрон почтага ёзинг.
        </Text>
        <Flex gap="middle" justify="center" style={{ marginTop: '1rem' }}>
          <Button href="mailto:ibms-bux@mail.ru" type="primary">
            Электрон почта
          </Button>
          <Button target="_blank" href={`/issues`}>
            Муаммони юбориш
          </Button>
        </Flex>
      </Card>
    </div>
  );
};

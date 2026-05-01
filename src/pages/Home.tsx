import { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Button,
  Card,
  Col,
  Form,
  Input,
  message,
  Row,
  Space,
  Tag,
  Typography,
} from 'antd';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { IoClose } from 'react-icons/io5';
import {
  ArrowRightOutlined,
  BookOutlined,
  CheckCircleOutlined,
  DatabaseOutlined,
  FileDoneOutlined,
  HomeOutlined,
  LaptopOutlined,
  LoginOutlined,
  PhoneOutlined,
  PlayCircleOutlined,
  ReadOutlined,
  RocketFilled,
  SafetyCertificateOutlined,
  SolutionOutlined,
  TeamOutlined,
  ToolOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons';
import { PATH_AUTH, PATH_COURSE } from '../constants';
import { Container } from '../components';
import {
  buildGoogleOauthUrl,
  readAccessToken,
  saveOauthIntent,
} from '../redux/auth/authSession.ts';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const FEATURES = [
  {
    title: 'Litsenziyaga asoslangan taʼlim',
    description:
      'Taʼlim dasturlari rasmiy talablar va malaka standartlariga mos ishlab chiqilgan.',
    icon: SafetyCertificateOutlined,
  },
  {
    title: 'Amaliyotga yaqin darslar',
    description:
      'Nazariya real ish jarayonlari, keyslar va topshiriqlar bilan boyitilgan.',
    icon: ToolOutlined,
  },
  {
    title: 'Malakali ustozlar',
    description:
      'Soha tajribasiga ega mutaxassislar mavzularni tushunarli va natijaga yo‘naltirilgan tarzda olib boradi.',
    icon: TeamOutlined,
  },
  {
    title: 'Sertifikatlash bosqichi',
    description:
      'Kurslar mavzular va yakuniy testlar orqali baholanadi, natijada tinglovchi tayyorgarligi aniq ko‘rinadi.',
    icon: FileDoneOutlined,
  },
  {
    title: 'Zamonaviy o‘qitish formati',
    description:
      'Video darslar, materiallar, testlar va intuitiv boshqariladigan platforma bir joyda jamlangan.',
    icon: LaptopOutlined,
  },
  {
    title: 'Ishga yaqin kompetensiyalar',
    description:
      'Bitiruvchi real ish joyida kerak bo‘ladigan ko‘nikmalarni modul-modul o‘zlashtiradi.',
    icon: SolutionOutlined,
  },
  {
    title: 'Individual kuzatuv',
    description:
      "Tinglovchi progressi mavzu kesimida ko'rinadi, bu esa o‘qishni nazorat qilishni osonlashtiradi.",
    icon: UserSwitchOutlined,
  },
  {
    title: 'Qulay taʼlim muhiti',
    description:
      'Desktop va mobil qurilmalarda birdek qulay, tez va ravshan ishlaydigan interfeys.',
    icon: HomeOutlined,
  },
];

const STATS = [
  { value: '100+', label: 'Kasbiy kurslar' },
  { value: 'Interaktiv', label: 'Kurslar' },
  { value: 'Sertifikatli', label: 'Dasturlar' },
  { value: 'Tasdiqlangan', label: 'Tashkiliy yondashuv' },
];

const HERO_BULLETS = [
  'Interaktiv kurslar',
  'Sertifikatlashtirilgan dasturlar',
  'Mutasaddi tashkilotlar tasdig‘i bilan',
];

const heroReveal = (delay = 0) => ({
  initial: { opacity: 0, y: 36 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.65, ease: 'easeOut' as const, delay },
});

const sectionReveal = (delay = 0, amount = 0.16) => ({
  initial: { opacity: 0, y: 36 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount },
  transition: { duration: 0.65, ease: 'easeOut' as const, delay },
});

export const HomePage = () => {
  const [form] = Form.useForm();
  const [sending, setSending] = useState(false);
  const [showGooglePrompt, setShowGooglePrompt] = useState(false);

  useEffect(() => {
    if (readAccessToken()) return;
    const dismissed = sessionStorage.getItem('ibms_google_prompt_dismissed');
    if (!dismissed) {
      setShowGooglePrompt(true);
    }
  }, []);

  const featureCards = useMemo(
    () =>
      FEATURES.map((feature, index) => ({
        ...feature,
        accent:
          index % 4 === 0
            ? '#1d4ed8'
            : index % 4 === 1
              ? '#0f766e'
              : index % 4 === 2
                ? '#c2410c'
                : '#6d28d9',
      })),
    []
  );

  const onSubmit = async (values: Record<string, string>) => {
    setSending(true);
    await new Promise((resolve) => setTimeout(resolve, 900));
    setSending(false);
    form.resetFields();
    message.success(`${values.fullName}, murojaatingiz qabul qilindi.`);
  };

  const closePrompt = () => {
    sessionStorage.setItem('ibms_google_prompt_dismissed', '1');
    setShowGooglePrompt(false);
  };

  const handlePromptGoogle = () => {
    saveOauthIntent('signin');
    window.location.href = buildGoogleOauthUrl();
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(180deg, #fff9f1 0%, #fffdf8 20%, #eef7ff 52%, #f9fbfd 100%)',
      }}
    >
      {showGooglePrompt ? (
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            top: 92,
            right: 20,
            zIndex: 120,
            width: 'min(380px, calc(100vw - 24px))',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 22,
              border: '1px solid rgba(148,163,184,0.18)',
              boxShadow: '0 24px 60px rgba(15,23,42,0.18)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '16px 18px',
                borderBottom: '1px solid rgba(148,163,184,0.14)',
              }}
            >
              <Space size={12}>
                <FcGoogle size={24} />
                <Text strong style={{ color: '#102a43' }}>
                  Google bilan davom etish
                </Text>
              </Space>
              <Button
                type="text"
                onClick={closePrompt}
                icon={<IoClose size={20} />}
                style={{ color: '#64748b' }}
              />
            </div>

            <div style={{ padding: 18 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 14,
                  borderRadius: 18,
                  background: '#f8fafc',
                  border: '1px solid rgba(148,163,184,0.14)',
                  marginBottom: 16,
                }}
              >
                <Avatar
                  size={44}
                  style={{
                    background: 'linear-gradient(135deg, #dbeafe 0%, #eef2ff 100%)',
                    color: '#2563eb',
                    fontWeight: 700,
                  }}
                >
                  G
                </Avatar>
                <div>
                  <Text strong style={{ color: '#102a43', display: 'block' }}>
                    Google akkauntingiz bilan davom eting
                  </Text>
                  <Text style={{ color: '#64748b', fontSize: 13 }}>
                    Tez kirish va xavfsiz tasdiqlash
                  </Text>
                </div>
              </div>
              <Paragraph style={{ marginTop: 0, marginBottom: 16, color: '#52606d' }}>
                Saytdan foydalanishni tez boshlash uchun Google akkauntingiz orqali kiring.
              </Paragraph>
              <Button
                type="primary"
                block
                size="large"
                onClick={handlePromptGoogle}
                style={{
                  height: 50,
                  borderRadius: 16,
                  fontWeight: 700,
                }}
              >
                Google bilan kirish
              </Button>
              <Text
                style={{
                  display: 'block',
                  marginTop: 12,
                  color: '#829ab1',
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                Davom etish orqali email va asosiy profilingizdan foydalanishga rozilik bildirasiz.
              </Text>
            </div>
          </div>
        </motion.div>
      ) : null}

      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '132px 0 96px',
          background:
            'radial-gradient(circle at 8% 18%, rgba(56, 189, 248, 0.22), transparent 28%), radial-gradient(circle at 88% 12%, rgba(251, 191, 36, 0.18), transparent 22%), linear-gradient(135deg, #fffaf4 0%, #f6fbff 52%, #eef7ff 100%)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
            maskImage:
              'linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0.18))',
            pointerEvents: 'none',
          }}
        />
        <Container
          style={{ position: 'relative', zIndex: 1, padding: '0 20px' }}
        >
          <Row gutter={[40, 40]} align="middle">
            <Col xs={24} xl={13}>
              <motion.div {...heroReveal(0)}>
                <Tag
                  style={{
                    marginBottom: 18,
                    padding: '8px 14px',
                    borderRadius: 999,
                    color: '#0f4c81',
                    border: '1px solid rgba(37,99,235,0.12)',
                    background: 'rgba(255,255,255,0.86)',
                    backdropFilter: 'blur(14px)',
                  }}
                >
                  <RocketFilled /> Masofaviy ta’lim portali
                </Tag>
              </motion.div>
              <motion.div {...heroReveal(0.08)}>
                <Title
                  style={{
                    marginTop: 0,
                    marginBottom: 24,
                    color: '#102a43',
                    fontSize: 'clamp(30px, 4.9vw, 56px)',
                    lineHeight: 1.08,
                    fontWeight: 850,
                    letterSpacing: '-0.03em',
                  }}
                >
                  <span style={{ display: 'block' }}>
                    Kadrlar malakasini oshirish va qayta tayyorlash bo‘yicha
                  </span>
                  <span style={{ display: 'block' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        background:
                          'linear-gradient(135deg, #6d28d9 0%, #2563eb 52%, #38bdf8 100%)',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        color: 'transparent',
                        textShadow: '0 12px 28px rgba(37, 99, 235, 0.14)',
                      }}
                    >
                      interaktiv
                    </span>{' '}
                    <span style={{ color: '#102a43' }}>va</span>{' '}
                    <span
                      style={{
                        display: 'inline-block',
                        background:
                          'linear-gradient(135deg, #7c3aed 0%, #3b82f6 50%, #60a5fa 100%)',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        color: 'transparent',
                        textShadow: '0 12px 28px rgba(124, 58, 237, 0.14)',
                      }}
                    >
                      zamonaviy
                    </span>
                  </span>
                  <span style={{ display: 'block' }}>platforma</span>
                </Title>
              </motion.div>

              <motion.div {...heroReveal(0.24)}>
                <Space wrap size="middle" style={{ marginBottom: 28 }}>
                  <Link to={PATH_COURSE.catalog}>
                    <Button
                      type="primary"
                      size="large"
                      icon={<DatabaseOutlined />}
                      style={{
                        height: 54,
                        paddingInline: 22,
                        borderRadius: 16,
                        boxShadow: '0 18px 40px rgba(59,130,246,0.28)',
                      }}
                    >
                      Kurslarni ko‘rish
                    </Button>
                  </Link>
                  <Link to={PATH_AUTH.signup}>
                    <Button
                      size="large"
                      icon={<LoginOutlined />}
                      style={{
                        height: 54,
                        paddingInline: 22,
                        borderRadius: 16,
                        color: '#0f4c81',
                        borderColor: 'rgba(37,99,235,0.16)',
                        background: '#ffffff',
                      }}
                    >
                      Ro‘yxatdan o‘tish
                    </Button>
                  </Link>
                </Space>
              </motion.div>
              <motion.div {...heroReveal(0.32)}>
                <Space direction="vertical" size={12}>
                  {HERO_BULLETS.map((bullet) => (
                    <div
                      key={bullet}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        color: '#335c67',
                      }}
                    >
                      <CheckCircleOutlined style={{ color: '#2f80ed' }} />
                      <Text style={{ color: '#335c67', fontSize: 16 }}>
                        {bullet}
                      </Text>
                    </div>
                  ))}
                </Space>
              </motion.div>
            </Col>

            <Col xs={24} xl={11}>
              <motion.div {...heroReveal(0.18)}>
                <Card
                  style={{
                    borderRadius: 34,
                    overflow: 'hidden',
                    background: 'rgba(255,255,255,0.76)',
                    border: '1px solid rgba(37,99,235,0.12)',
                    boxShadow: '0 30px 80px rgba(15,23,42,0.12)',
                    backdropFilter: 'blur(16px)',
                  }}
                  bodyStyle={{ padding: 20 }}
                >
                  <div
                    style={{
                      borderRadius: 28,
                      overflow: 'hidden',
                      border: '1px solid rgba(37,99,235,0.08)',
                      marginBottom: 18,
                    }}
                  >
                    <img
                      src="/landing-image.png"
                      alt="Masofaviy taʼlim platformasi"
                      style={{ width: '100%', display: 'block' }}
                    />
                  </div>
                  <Row gutter={[14, 14]}>
                    {STATS.map((item) => (
                      <Col xs={24} sm={12} key={item.label}>
                        <div
                          style={{
                            borderRadius: 24,
                            padding: 'clamp(16px, 4vw, 18px)',
                            background: '#ffffff',
                            minHeight: 104,
                            display: 'grid',
                            alignContent: 'start',
                            gap: 6,
                          }}
                        >
                          <Title
                            level={2}
                            style={{
                              color: '#102a43',
                              margin: 0,
                              fontSize: 'clamp(18px, 5vw, 24px)',
                              lineHeight: 1.18,
                              wordBreak: 'normal',
                              overflowWrap: 'anywhere',
                            }}
                          >
                            {item.value}
                          </Title>
                          <Text
                            style={{
                              color: '#486581',
                              fontSize: 15,
                              lineHeight: 1.45,
                              display: 'block',
                            }}
                          >
                            {item.label}
                          </Text>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </Card>
              </motion.div>
            </Col>
          </Row>
        </Container>
      </section>

      <section style={{ marginTop: -36, position: 'relative', zIndex: 2 }}>
        <Container style={{ padding: '0 20px 84px' }}>
          <motion.div {...sectionReveal(0, 0.2)}>
            <Card
              style={{
                borderRadius: 32,
                border: '1px solid rgba(148,163,184,0.12)',
                boxShadow: '0 24px 70px rgba(15,23,42,0.06)',
                background: 'rgba(255,255,255,0.9)',
              }}
              bodyStyle={{ padding: 28 }}
            >
              <Row gutter={[20, 20]}>
                {[
                  {
                    icon: <BookOutlined />,
                    title: 'Tartibli kurslar katalogi',
                    text: 'Har bir kurs mazmuni, davomiyligi va o‘quv tartibi bilan ravshan ko‘rsatiladi.',
                  },
                  {
                    icon: <ReadOutlined />,
                    title: 'Mavzular bo‘yicha o‘qish',
                    text: 'Kurs tarkibi mavzular bo‘yicha ketma-ket tuzilgan va foydalanuvchi uchun tushunarli.',
                  },
                  {
                    icon: <PlayCircleOutlined />,
                    title: 'Material va video darslar',
                    text: 'Video darslar, hujjatlar va amaliy materiallar yagona sahifada qulay joylashtirilgan.',
                  },
                  {
                    icon: <FileDoneOutlined />,
                    title: 'Test va natija',
                    text: 'Yakuniy test topshirilgach natija saqlanadi va umumiy o‘quv holatiga qo‘shiladi.',
                  },
                ].map((item) => (
                  <Col xs={24} md={12} xl={6} key={item.title}>
                    <div
                      style={{
                        height: '100%',
                        padding: 18,
                        borderRadius: 24,
                        background: '#fffaf5',
                        border: '1px solid rgba(148,163,184,0.12)',
                      }}
                    >
                      <Avatar
                        size={52}
                        icon={item.icon}
                        style={{
                          background: '#dbeafe',
                          color: '#1d4ed8',
                          marginBottom: 14,
                        }}
                      />
                      <Title
                        level={4}
                        style={{ marginTop: 0, marginBottom: 8 }}
                      >
                        {item.title}
                      </Title>
                      <Text style={{ color: '#64748b' }}>{item.text}</Text>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card>
          </motion.div>
        </Container>
      </section>

      <section>
        <Container style={{ padding: '0 20px 92px' }}>
          <motion.div {...sectionReveal(0, 0.16)}>
            <div style={{ marginBottom: 28, textAlign: 'center' }}>
              <Text style={{ color: '#2563eb', fontWeight: 700 }}>
                Nega aynan biz
              </Text>
              <Title level={2} style={{ margin: '10px 0 8px' }}>
                Professional taʼlim uchun mustahkam asos
              </Title>
            </div>
          </motion.div>
          <Row gutter={[22, 22]}>
            {featureCards.map((feature, index) => (
              <Col xs={24} md={12} xl={6} key={feature.title}>
                <motion.div {...sectionReveal(index * 0.04, 0.16)}>
                  <Card
                    style={{
                      height: '100%',
                      borderRadius: 28,
                      border: '1px solid rgba(148,163,184,0.14)',
                      boxShadow: '0 18px 48px rgba(15,23,42,0.06)',
                    }}
                  >
                    <Avatar
                      size={58}
                      style={{
                        background: `${feature.accent}15`,
                        color: feature.accent,
                        marginBottom: 18,
                      }}
                      icon={createFeatureIcon(feature.icon)}
                    />
                    <Title level={4} style={{ marginTop: 0 }}>
                      {feature.title}
                    </Title>
                    <Text style={{ color: '#64748b' }}>
                      {feature.description}
                    </Text>
                  </Card>
                </motion.div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      <section
        id="contact"
        style={{
          background:
            'linear-gradient(180deg, rgba(255,249,241,0.4) 0%, rgba(238,247,255,0.82) 100%)',
          paddingBottom: 96,
        }}
      >
        <Container style={{ padding: '0 20px' }}>
          <motion.div {...sectionReveal(0, 0.14)}>
            <Card
              style={{
                borderRadius: 36,
                overflow: 'hidden',
                border: '1px solid rgba(148,163,184,0.14)',
                boxShadow: '0 26px 80px rgba(15,23,42,0.08)',
              }}
              bodyStyle={{ padding: 0 }}
            >
              <Row gutter={[0, 0]}>
                <Col xs={24} xl={10}>
                  <div
                    style={{
                      height: '100%',
                      padding: 32,
                      color: '#102a43',
                      background:
                        'linear-gradient(160deg, #fffaf4 0%, #f2f9ff 58%, #e9f4ff 100%)',
                    }}
                  >
                    <Tag
                      style={{
                        marginBottom: 18,
                        borderRadius: 999,
                        padding: '8px 14px',
                        color: '#0f4c81',
                        border: '1px solid rgba(37,99,235,0.12)',
                        background: 'rgba(255,255,255,0.92)',
                      }}
                    >
                      Aloqa
                    </Tag>
                    <Title style={{ color: '#102a43', marginTop: 0 }}>
                      Murojaat qoldiring
                    </Title>
                    <Paragraph style={{ color: '#486581' }}>
                      Kurslar va ro‘yxatdan o‘tish bo‘yicha murojaatlarni qabul
                      qilamiz.
                    </Paragraph>
                    <Space
                      direction="vertical"
                      size={18}
                      style={{ width: '100%', marginTop: 24 }}
                    >
                      {[
                        {
                          title: 'Telefon',
                          value: '+998 98 774 20 17',
                          icon: <PhoneOutlined />,
                        },
                        {
                          title: 'Email',
                          value: 'ibms_bux@mail.ru',
                          icon: <LoginOutlined />,
                        },
                        {
                          title: 'Manzil',
                          value:
                            'Buxoro shahri, Sobir Rakhimov ko‘chasi, 20-uy',
                          icon: <HomeOutlined />,
                        },
                      ].map((item) => (
                        <div
                          key={item.title}
                          style={{
                            padding: 18,
                            borderRadius: 22,
                            background: '#ffffff',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 14,
                          }}
                        >
                          <Avatar
                            size={44}
                            icon={item.icon}
                            style={{
                              background: '#e9f4ff',
                              color: '#0f4c81',
                              flexShrink: 0,
                            }}
                          />
                          <div>
                            <Text style={{ color: '#486581' }}>
                              {item.title}
                            </Text>
                            <div style={{ color: '#102a43', marginTop: 4 }}>
                              {item.value}
                            </div>
                          </div>
                        </div>
                      ))}
                    </Space>
                  </div>
                </Col>
                <Col xs={24} xl={14}>
                  <div
                    style={{
                      padding: 32,
                      background: '#fff',
                    }}
                  >
                    <Row gutter={[24, 24]}>
                      <Col xs={24} lg={12}>
                        <Title level={3} style={{ marginTop: 0 }}>
                          Murojaat formasi
                        </Title>
                        <Paragraph style={{ color: '#64748b' }}>
                          Qisqa ma’lumot qoldiring. Mutaxassislarimiz siz bilan
                          bog‘lanadi.
                        </Paragraph>
                        <Form
                          form={form}
                          layout="vertical"
                          onFinish={onSubmit}
                          requiredMark={false}
                        >
                          <Form.Item
                            label="F.I.Sh."
                            name="fullName"
                            rules={[
                              {
                                required: true,
                                message: 'Ismingizni kiriting',
                              },
                            ]}
                          >
                            <Input
                              size="large"
                              placeholder="Masalan, Ali Valiyev"
                            />
                          </Form.Item>
                          <Form.Item
                            label="Telefon raqam"
                            name="phone"
                            rules={[
                              {
                                required: true,
                                message: 'Telefon raqamingizni kiriting',
                              },
                            ]}
                          >
                            <Input
                              size="large"
                              placeholder="+998 90 123 45 67"
                            />
                          </Form.Item>
                          <Form.Item label="Murojaat matni" name="message">
                            <TextArea rows={5} placeholder="Qisqacha yozing" />
                          </Form.Item>
                          <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            loading={sending}
                            icon={<ArrowRightOutlined />}
                            style={{ height: 50, borderRadius: 16 }}
                          >
                            Murojaat yuborish
                          </Button>
                        </Form>
                      </Col>
                      <Col xs={24} lg={12}>
                        <div
                          style={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 16,
                          }}
                        >
                          <div>
                            <Title level={4} style={{ marginTop: 0 }}>
                              Yandex xarita
                            </Title>
                            <Paragraph
                              style={{ color: '#64748b', marginBottom: 0 }}
                            >
                              Manzilni Yandex xarita orqali ko‘rish va yo‘nalish
                              olish mumkin.
                            </Paragraph>
                          </div>
                          <a
                            href="https://yandex.uz/maps/-/CPv7zYow"
                            target="_blank"
                            rel="noreferrer"
                            style={{ textDecoration: 'none' }}
                          >
                            <Button
                              icon={<ArrowRightOutlined />}
                              size="large"
                              style={{ borderRadius: 16, height: 46 }}
                            >
                              Yandex xaritada ochish
                            </Button>
                          </a>
                          <div
                            style={{
                              overflow: 'hidden',
                              borderRadius: 24,
                              border: '1px solid rgba(148,163,184,0.14)',
                              minHeight: 360,
                              boxShadow: '0 18px 48px rgba(15,23,42,0.06)',
                            }}
                          >
                            <iframe
                              title="IBMS location map"
                              src="https://yandex.com/map-widget/v1/?ll=64.428611%2C39.774722&mode=search&ol=geo&ouri=ymapsbm1%3A%2F%2Fgeo%3Fdata%3DCgozNTM2NzA0NTUwEjBPyrt6YmVraXN0b24sIEJ1eGhvcm8sIEJ1eGhvcm8iCg1I3jVCFWljQEI%2C&z=13"
                              width="100%"
                              height="100%"
                              style={{ border: 0, minHeight: 360 }}
                              loading="lazy"
                            />
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </Col>
              </Row>
            </Card>
          </motion.div>
        </Container>
      </section>
    </div>
  );
};

function createFeatureIcon(Icon: typeof SafetyCertificateOutlined) {
  return <Icon />;
}

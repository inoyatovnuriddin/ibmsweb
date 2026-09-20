import { useEffect, useMemo, useRef, useState } from 'react';
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
  theme,
  Typography,
} from 'antd';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { IoClose } from 'react-icons/io5';
import { PhoneInput } from 'react-international-phone';
import { useSelector } from 'react-redux';
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
import type { RootState } from '../redux/store.ts';
import typingSound from '../assets/typingsound.mp3';
import { submitPublicContactRequest } from '../services/publicContact.ts';
import { useAppTranslation } from '../hooks/useAppTranslation.ts';
import 'react-international-phone/style.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const CONTACT_FORM_NAME_MAX_LENGTH = 64;
const CONTACT_FORM_MESSAGE_MAX_LENGTH = 256;
const CONTACT_FORM_COOLDOWN_MS = 90 * 1000;
const CONTACT_FORM_MIN_FILL_MS = 4000;
const CONTACT_FORM_COOLDOWN_KEY = 'ibms_contact_form_cooldown_until';
const CONTACT_FORM_SESSION_KEY = 'ibms_contact_form_session_id';

const FEATURE_ICONS = [
  SafetyCertificateOutlined,
  ToolOutlined,
  TeamOutlined,
  FileDoneOutlined,
  LaptopOutlined,
  SolutionOutlined,
  UserSwitchOutlined,
  HomeOutlined,
] as const;

const HERO_TYPING_DURATION_MS = 9000;

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
  const { token } = theme.useToken();
  const { mytheme } = useSelector((state: RootState) => state.theme);
  const isDark = mytheme === 'dark';
  const { t, language } = useAppTranslation();
  const [form] = Form.useForm();
  const [sending, setSending] = useState(false);
  const [showGooglePrompt, setShowGooglePrompt] = useState(false);
  const [typedHeroCount, setTypedHeroCount] = useState(0);
  const [contactCooldownUntil, setContactCooldownUntil] = useState(0);
  const typingAudioRef = useRef<HTMLAudioElement | null>(null);
  const heroTypingStartedRef = useRef(false);
  const typedHeroCountRef = useRef(0);
  const contactStartedAtRef = useRef(Date.now());
  const phoneNumberValue = Form.useWatch('phoneNumber', form) || '';
  const messageValue = Form.useWatch('message', form) || '';

  const HERO_TITLE_PARTS = useMemo(() => ({
    line1: t('home.hero.title.line1'),
    accent1: t('home.hero.title.accent1'),
    connector: t('home.hero.title.connector'),
    accent2: t('home.hero.title.accent2'),
    line3: t('home.hero.title.line3'),
  }), [t]);

  const HERO_TYPING_SEQUENCE = useMemo(() => [
    HERO_TITLE_PARTS.line1,
    HERO_TITLE_PARTS.accent1,
    HERO_TITLE_PARTS.connector,
    HERO_TITLE_PARTS.accent2,
    HERO_TITLE_PARTS.line3,
  ], [HERO_TITLE_PARTS]);

  const FEATURES = useMemo(() => [
    { title: t('home.features.0.title'), description: t('home.features.0.description'), icon: FEATURE_ICONS[0] },
    { title: t('home.features.1.title'), description: t('home.features.1.description'), icon: FEATURE_ICONS[1] },
    { title: t('home.features.2.title'), description: t('home.features.2.description'), icon: FEATURE_ICONS[2] },
    { title: t('home.features.3.title'), description: t('home.features.3.description'), icon: FEATURE_ICONS[3] },
    { title: t('home.features.4.title'), description: t('home.features.4.description'), icon: FEATURE_ICONS[4] },
    { title: t('home.features.5.title'), description: t('home.features.5.description'), icon: FEATURE_ICONS[5] },
    { title: t('home.features.6.title'), description: t('home.features.6.description'), icon: FEATURE_ICONS[6] },
    { title: t('home.features.7.title'), description: t('home.features.7.description'), icon: FEATURE_ICONS[7] },
  ], [t]);

  const STATS = useMemo(() => [
    { value: t('home.stats.0.value'), label: t('home.stats.0.label'), icon: <BookOutlined /> },
    { value: t('home.stats.1.value'), label: t('home.stats.1.label'), icon: <PlayCircleOutlined /> },
    { value: t('home.stats.2.value'), label: t('home.stats.2.label'), icon: <SafetyCertificateOutlined /> },
    { value: t('home.stats.3.value'), label: t('home.stats.3.label'), icon: <CheckCircleOutlined /> },
  ], [t]);

  const HERO_BULLETS = useMemo(() => [
    t('home.hero.bullets.interactive'),
    t('home.hero.bullets.certified'),
    t('home.hero.bullets.approved'),
  ], [t]);

  const HIGHLIGHTS = useMemo(() => [
    { icon: <BookOutlined />, title: t('home.highlights.0.title'), text: t('home.highlights.0.text') },
    { icon: <ReadOutlined />, title: t('home.highlights.1.title'), text: t('home.highlights.1.text') },
    { icon: <PlayCircleOutlined />, title: t('home.highlights.2.title'), text: t('home.highlights.2.text') },
    { icon: <FileDoneOutlined />, title: t('home.highlights.3.title'), text: t('home.highlights.3.text') },
  ], [t]);

  const contactCooldownRemainingMs = Math.max(contactCooldownUntil - Date.now(), 0);
  const contactCooldownRemainingSeconds = Math.ceil(contactCooldownRemainingMs / 1000);

  useEffect(() => {
    if (readAccessToken()) return;
    const dismissed = sessionStorage.getItem('ibms_google_prompt_dismissed');
    if (!dismissed) {
      setShowGooglePrompt(true);
    }
  }, []);

  useEffect(() => {
    const savedCooldown = Number(localStorage.getItem(CONTACT_FORM_COOLDOWN_KEY) || 0);
    if (savedCooldown > Date.now()) {
      setContactCooldownUntil(savedCooldown);
    }
  }, []);

  useEffect(() => {
    if (!contactCooldownUntil) return;

    const timerId = window.setInterval(() => {
      if (Date.now() >= contactCooldownUntil) {
        setContactCooldownUntil(0);
        localStorage.removeItem(CONTACT_FORM_COOLDOWN_KEY);
      }
    }, 1000);

    return () => { window.clearInterval(timerId); };
  }, [contactCooldownUntil]);

  const featureCards = useMemo(
    () =>
      FEATURES.map((feature, index) => ({
        ...feature,
        accent:
          index % 4 === 0 ? '#1d4ed8'
          : index % 4 === 1 ? '#0f766e'
          : index % 4 === 2 ? '#c2410c'
          : '#6d28d9',
      })),
    [FEATURES]
  );

  const totalHeroCharacters = useMemo(
    () => HERO_TYPING_SEQUENCE.join('').length,
    [HERO_TYPING_SEQUENCE]
  );

  const typedHeroTitle = useMemo(() => {
    // When language changes, show full title immediately (no animation restart)
    if (typedHeroCount >= totalHeroCharacters) {
      return HERO_TITLE_PARTS;
    }

    let remaining = typedHeroCount;
    const take = (value: string) => {
      const nextValue = value.slice(0, Math.max(remaining, 0));
      remaining -= nextValue.length;
      return nextValue;
    };

    return {
      line1: take(HERO_TITLE_PARTS.line1),
      accent1: take(HERO_TITLE_PARTS.accent1),
      connector: take(HERO_TITLE_PARTS.connector),
      accent2: take(HERO_TITLE_PARTS.accent2),
      line3: take(HERO_TITLE_PARTS.line3),
    };
  }, [typedHeroCount, totalHeroCharacters, HERO_TITLE_PARTS]);

  // Reset hero to full text when language changes (after initial animation)
  useEffect(() => {
    if (heroTypingStartedRef.current) {
      setTypedHeroCount(totalHeroCharacters);
    }
  }, [language, totalHeroCharacters]);

  useEffect(() => {
    typedHeroCountRef.current = typedHeroCount;
  }, [typedHeroCount]);

  useEffect(() => {
    const audio = new Audio(typingSound);
    audio.preload = 'auto';
    typingAudioRef.current = audio;

    return () => {
      audio.pause();
      audio.currentTime = 0;
      typingAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    let frameId = 0;

    const cleanupAudio = () => {
      const audio = typingAudioRef.current;
      if (!audio) return;
      audio.pause();
      audio.currentTime = 0;
    };

    const startFallbackTyping = (total: number) => {
      const startedAt = performance.now();

      const animateFallback = (now: number) => {
        const progress = Math.min((now - startedAt) / HERO_TYPING_DURATION_MS, 1);
        setTypedHeroCount(Math.round(progress * total));

        if (progress < 1) {
          frameId = window.requestAnimationFrame(animateFallback);
        }
      };

      frameId = window.requestAnimationFrame(animateFallback);
    };

    const syncTypingWithAudio = (total: number) => {
      const audio = typingAudioRef.current;
      if (!audio) {
        startFallbackTyping(total);
        return;
      }

      const durationMs =
        Number.isFinite(audio.duration) && audio.duration > 0
          ? audio.duration * 1000
          : HERO_TYPING_DURATION_MS;

      const animateFromAudio = () => {
        const progress = Math.min((audio.currentTime * 1000) / durationMs, 1);
        setTypedHeroCount(Math.round(progress * total));

        if (!audio.paused && !audio.ended && progress < 1) {
          frameId = window.requestAnimationFrame(animateFromAudio);
          return;
        }

        if (audio.ended || progress >= 1) {
          setTypedHeroCount(total);
        }
      };

      frameId = window.requestAnimationFrame(animateFromAudio);
    };

    const startTyping = () => {
      if (heroTypingStartedRef.current) return;

      heroTypingStartedRef.current = true;
      setTypedHeroCount(0);

      const total = HERO_TYPING_SEQUENCE.join('').length;
      const audio = typingAudioRef.current;
      if (!audio) {
        startFallbackTyping(total);
        return;
      }

      audio.currentTime = 0;
      const playPromise = audio.play();

      if (playPromise && typeof playPromise.then === 'function') {
        playPromise
          .then(() => { syncTypingWithAudio(total); })
          .catch(() => { startFallbackTyping(total); });
        return;
      }

      syncTypingWithAudio(total);
    };

    startTyping();

    return () => {
      window.cancelAnimationFrame(frameId);
      cleanupAudio();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const tryResumeAudio = () => {
      const audio = typingAudioRef.current;
      if (!audio || !audio.paused) return;

      const currentTyped = typedHeroCountRef.current;
      if (currentTyped <= 0 || currentTyped >= totalHeroCharacters) return;

      const progress = currentTyped / totalHeroCharacters;
      const durationSeconds =
        Number.isFinite(audio.duration) && audio.duration > 0
          ? audio.duration
          : HERO_TYPING_DURATION_MS / 1000;

      audio.currentTime = Math.min(progress * durationSeconds, durationSeconds);
      void audio.play().catch(() => undefined);
    };

    window.addEventListener('pointerdown', tryResumeAudio);
    window.addEventListener('keydown', tryResumeAudio);
    window.addEventListener('touchstart', tryResumeAudio);

    return () => {
      window.removeEventListener('pointerdown', tryResumeAudio);
      window.removeEventListener('keydown', tryResumeAudio);
      window.removeEventListener('touchstart', tryResumeAudio);
    };
  }, [totalHeroCharacters]);

  const onSubmit = async (values: Record<string, string>) => {
    const fullName = values.fullName?.trim();
    const phoneNumber = values.phoneNumber?.trim();
    const contactMessage = values.message?.trim();
    const website = values.website?.trim();

    if (website) {
      form.resetFields(['website']);
      message.success(t('home.contact.msg.botDetected'));
      return;
    }

    if (Date.now() < contactCooldownUntil) {
      message.warning(
        `${t('home.contact.form.resend')} ${contactCooldownRemainingSeconds}s`
      );
      return;
    }

    if (Date.now() - contactStartedAtRef.current < CONTACT_FORM_MIN_FILL_MS) {
      message.warning(t('home.contact.msg.tooFast'));
      return;
    }

    setSending(true);

    try {
      const formSessionId =
        localStorage.getItem(CONTACT_FORM_SESSION_KEY) ||
        globalThis.crypto?.randomUUID?.() ||
        `contact-${Date.now()}`;

      localStorage.setItem(CONTACT_FORM_SESSION_KEY, formSessionId);

      const response = await submitPublicContactRequest({
        fullName,
        phoneNumber,
        message: contactMessage,
        website,
        sourcePage: '/#contact',
        formSessionId,
      });

      const nextCooldown = Date.now() + CONTACT_FORM_COOLDOWN_MS;
      localStorage.setItem(CONTACT_FORM_COOLDOWN_KEY, String(nextCooldown));
      setContactCooldownUntil(nextCooldown);
      form.resetFields();
      contactStartedAtRef.current = Date.now();
      message.success(response.message || t('home.contact.msg.botDetected'));
    } catch (error) {
      const err = error as {
        response?: { data?: { errors?: { message?: string }; message?: string } };
        message?: string;
      };

      message.error(
        err?.response?.data?.errors?.message ||
          err?.response?.data?.message ||
          err?.message ||
          t('home.contact.msg.error')
      );
    } finally {
      setSending(false);
    }
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
    <div style={{ minHeight: '100vh', background: 'var(--home-bg)' }}>
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
              background: token.colorBgContainer,
              borderRadius: 22,
              border: `1px solid ${token.colorBorderSecondary}`,
              boxShadow: 'var(--color-shadow-elevated)',
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
                borderBottom: `1px solid ${token.colorBorderSecondary}`,
              }}
            >
              <Space size={12}>
                <FcGoogle size={24} />
                <Text strong style={{ color: token.colorText }}>
                  {t('home.googlePrompt.header')}
                </Text>
              </Space>
              <Button
                type="text"
                onClick={closePrompt}
                icon={<IoClose size={20} />}
                style={{ color: token.colorTextSecondary }}
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
                  background: token.colorFillSecondary,
                  border: `1px solid ${token.colorBorderSecondary}`,
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
                  <Text strong style={{ color: token.colorText, display: 'block' }}>
                    {t('home.googlePrompt.accountTitle')}
                  </Text>
                  <Text style={{ color: token.colorTextSecondary, fontSize: 13 }}>
                    {t('home.googlePrompt.accountSubtitle')}
                  </Text>
                </div>
              </div>
              <Paragraph style={{ marginTop: 0, marginBottom: 16, color: token.colorTextSecondary }}>
                {t('home.googlePrompt.description')}
              </Paragraph>
              <Button
                type="primary"
                block
                size="large"
                onClick={handlePromptGoogle}
                style={{ height: 50, borderRadius: 16, fontWeight: 700 }}
              >
                {t('home.googlePrompt.button')}
              </Button>
              <Text
                style={{
                  display: 'block',
                  marginTop: 12,
                  color: token.colorTextTertiary,
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                {t('home.googlePrompt.consent')}
              </Text>
            </div>
          </div>
        </motion.div>
      ) : null}

      {/* Hero section */}
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '132px 0 96px',
          background: 'var(--hero-bg)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0.18))',
            pointerEvents: 'none',
          }}
        />
        <Container style={{ position: 'relative', zIndex: 1, padding: '0 20px' }}>
          <Row gutter={[40, 40]} align="middle">
            <Col xs={24} xl={13}>
              <motion.div {...heroReveal(0)}>
                <Tag
                  style={{
                    marginBottom: 18,
                    padding: '8px 14px',
                    borderRadius: 999,
                    color: isDark ? '#93c5fd' : '#0f4c81',
                    border: '1px solid rgba(37,99,235,0.12)',
                    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.86)',
                    backdropFilter: 'blur(14px)',
                  }}
                >
                  <RocketFilled /> {t('home.hero.tag')}
                </Tag>
              </motion.div>
              <motion.div {...heroReveal(0.08)}>
                <Title
                  style={{
                    marginTop: 0,
                    marginBottom: 24,
                    color: token.colorText,
                    fontSize: 'clamp(30px, 4.9vw, 56px)',
                    lineHeight: 1.08,
                    fontWeight: 850,
                    letterSpacing: '-0.03em',
                  }}
                >
                  <span style={{ display: 'block' }}>{typedHeroTitle.line1}</span>
                  <span style={{ display: 'block' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        background: 'linear-gradient(135deg, #6d28d9 0%, #2563eb 52%, #38bdf8 100%)',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        color: 'transparent',
                        textShadow: '0 12px 28px rgba(37, 99, 235, 0.14)',
                      }}
                    >
                      {typedHeroTitle.accent1}
                    </span>{' '}
                    <span style={{ color: token.colorText }}>{typedHeroTitle.connector}</span>
                    <span
                      style={{
                        display: 'inline-block',
                        background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 50%, #60a5fa 100%)',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        color: 'transparent',
                        textShadow: '0 12px 28px rgba(124, 58, 237, 0.14)',
                      }}
                    >
                      {typedHeroTitle.accent2}
                    </span>
                  </span>
                  <span style={{ display: 'block' }}>{typedHeroTitle.line3}</span>
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
                      {t('home.hero.browseCourses')}
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
                        color: isDark ? '#93c5fd' : '#0f4c81',
                        borderColor: 'rgba(37,99,235,0.16)',
                        background: token.colorBgContainer,
                      }}
                    >
                      {t('home.hero.register')}
                    </Button>
                  </Link>
                </Space>
              </motion.div>
              <motion.div {...heroReveal(0.32)}>
                <Space direction="vertical" size={12}>
                  {HERO_BULLETS.map((bullet) => (
                    <div
                      key={bullet}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, color: token.colorTextSecondary }}
                    >
                      <CheckCircleOutlined style={{ color: '#2f80ed' }} />
                      <Text style={{ color: token.colorTextSecondary, fontSize: 16 }}>{bullet}</Text>
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
                    background: isDark ? 'rgba(21,25,34,0.86)' : 'rgba(255,255,255,0.76)',
                    border: '1px solid rgba(37,99,235,0.12)',
                    boxShadow: 'var(--color-shadow-elevated)',
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
                      src="/landing-image.webp"
                      alt="Masofaviy taʼlim platformasi"
                      style={{ width: '100%', display: 'block' }}
                    />
                  </div>
                  <Row gutter={[14, 14]}>
                    {STATS.map((item) => (
                      <Col xs={12} sm={12} key={item.label} style={{ display: 'flex' }}>
                        <div
                          style={{
                            borderRadius: 24,
                            padding: 'clamp(14px, 3.8vw, 18px)',
                            background: token.colorBgContainer,
                            minHeight: 98,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 10,
                            width: '100%',
                            height: '100%',
                          }}
                        >
                          <Avatar
                            size={isDark ? 38 : 36}
                            style={{
                              background: isDark ? 'rgba(37,99,235,0.18)' : '#e9f4ff',
                              color: '#2563eb',
                              flexShrink: 0,
                            }}
                          >
                            {item.icon}
                          </Avatar>
                          <div style={{ display: 'grid', gap: 4 }}>
                            <Title
                              level={4}
                              style={{
                                color: token.colorText,
                                margin: 0,
                                fontSize: 'clamp(16px, 4.6vw, 24px)',
                                lineHeight: 1.12,
                                wordBreak: 'break-word',
                              }}
                            >
                              {item.value}
                            </Title>
                            <Text
                              style={{
                                color: token.colorTextSecondary,
                                fontSize: 'clamp(12px, 3.2vw, 14px)',
                                lineHeight: 1.35,
                                display: 'block',
                              }}
                            >
                              {item.label}
                            </Text>
                          </div>
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

      {/* Highlights section */}
      <section style={{ marginTop: -36, position: 'relative', zIndex: 2 }}>
        <Container style={{ padding: '0 20px 84px' }}>
          <motion.div {...sectionReveal(0, 0.2)}>
            <Card
              style={{
                borderRadius: 32,
                border: `1px solid ${token.colorBorderSecondary}`,
                boxShadow: 'var(--color-shadow-soft)',
                background: isDark ? 'rgba(21,25,34,0.92)' : 'rgba(255,255,255,0.9)',
              }}
              bodyStyle={{ padding: 28 }}
            >
              <Row gutter={[20, 20]}>
                {HIGHLIGHTS.map((item) => (
                  <Col xs={24} md={12} xl={6} key={item.title}>
                    <div
                      style={{
                        height: '100%',
                        padding: 18,
                        borderRadius: 24,
                        background: isDark ? token.colorFillSecondary : '#fffaf5',
                        border: `1px solid ${token.colorBorderSecondary}`,
                      }}
                    >
                      <Avatar
                        size={52}
                        icon={item.icon}
                        style={{ background: '#dbeafe', color: '#1d4ed8', marginBottom: 14 }}
                      />
                      <Title level={4} style={{ marginTop: 0, marginBottom: 8 }}>
                        {item.title}
                      </Title>
                      <Text style={{ color: token.colorTextSecondary }}>{item.text}</Text>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card>
          </motion.div>
        </Container>
      </section>

      {/* Features section */}
      <section>
        <Container style={{ padding: '0 20px 92px' }}>
          <motion.div {...sectionReveal(0, 0.16)}>
            <div style={{ marginBottom: 28, textAlign: 'center' }}>
              <Text style={{ color: '#2563eb', fontWeight: 700 }}>{t('home.whyUs.tag')}</Text>
              <Title level={2} style={{ margin: '10px 0 8px' }}>{t('home.whyUs.title')}</Title>
            </div>
          </motion.div>
          <Row gutter={[22, 22]} align="stretch">
            {featureCards.map((feature, index) => (
              <Col xs={24} md={12} xl={6} key={feature.title} style={{ display: 'flex' }}>
                <motion.div
                  {...sectionReveal(index * 0.04, 0.16)}
                  style={{ width: '100%', height: '100%' }}
                >
                  <Card
                    style={{
                      height: '100%',
                      borderRadius: 28,
                      border: '1px solid rgba(148,163,184,0.14)',
                      boxShadow: '0 18px 48px rgba(15,23,42,0.06)',
                    }}
                    bodyStyle={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                  >
                    <Avatar
                      size={58}
                      style={{ background: `${feature.accent}15`, color: feature.accent, marginBottom: 18 }}
                      icon={createFeatureIcon(feature.icon)}
                    />
                    <Title level={4} style={{ marginTop: 0 }}>{feature.title}</Title>
                    <Text style={{ color: token.colorTextSecondary, display: 'block' }}>
                      {feature.description}
                    </Text>
                  </Card>
                </motion.div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Contact section */}
      <section id="contact" style={{ background: 'var(--contact-section-bg)', paddingBottom: 96 }}>
        <Container style={{ padding: '0 20px' }}>
          <motion.div {...sectionReveal(0, 0.14)}>
            <Card
              style={{
                borderRadius: 36,
                overflow: 'hidden',
                border: `1px solid ${token.colorBorderSecondary}`,
                boxShadow: 'var(--color-shadow-soft)',
              }}
              bodyStyle={{ padding: 0 }}
            >
              <Row gutter={[0, 0]}>
                <Col xs={24} xl={10}>
                  <div
                    style={{
                      height: '100%',
                      padding: 32,
                      color: token.colorText,
                      background: 'var(--contact-left-bg)',
                    }}
                  >
                    <Tag
                      style={{
                        marginBottom: 18,
                        borderRadius: 999,
                        padding: '8px 14px',
                        color: isDark ? '#93c5fd' : '#0f4c81',
                        border: '1px solid rgba(37,99,235,0.12)',
                        background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.92)',
                      }}
                    >
                      {t('home.contact.tag')}
                    </Tag>
                    <Title style={{ color: token.colorText, marginTop: 0 }}>
                      {t('home.contact.title')}
                    </Title>
                    <Paragraph style={{ color: token.colorTextSecondary }}>
                      {t('home.contact.subtitle')}
                    </Paragraph>
                    <Space direction="vertical" size={18} style={{ width: '100%', marginTop: 24 }}>
                      {[
                        { label: t('home.contact.phone.label'), value: '+998 98 774 20 17', icon: <PhoneOutlined /> },
                        { label: t('home.contact.email.label'), value: 'ibms_bux@mail.ru', icon: <LoginOutlined /> },
                        { label: t('home.contact.address.label'), value: t('home.contact.address.value'), icon: <HomeOutlined /> },
                      ].map((item) => (
                        <div
                          key={item.label}
                          style={{
                            padding: 18,
                            borderRadius: 22,
                            background: token.colorBgContainer,
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
                              color: isDark ? '#93c5fd' : '#0f4c81',
                              flexShrink: 0,
                            }}
                          />
                          <div>
                            <Text style={{ color: token.colorTextSecondary }}>{item.label}</Text>
                            <div style={{ color: token.colorText, marginTop: 4 }}>{item.value}</div>
                          </div>
                        </div>
                      ))}
                    </Space>
                  </div>
                </Col>
                <Col xs={24} xl={14}>
                  <div style={{ padding: 32, background: token.colorBgContainer }}>
                    <Row gutter={[24, 24]}>
                      <Col xs={24} lg={12}>
                        <Title level={3} style={{ marginTop: 0 }}>
                          {t('home.contact.form.title')}
                        </Title>
                        <Paragraph style={{ color: token.colorTextSecondary }}>
                          {t('home.contact.form.subtitle')}
                        </Paragraph>
                        <Form
                          form={form}
                          layout="vertical"
                          onFinish={onSubmit}
                          requiredMark={false}
                          onValuesChange={() => {
                            if (!contactStartedAtRef.current) {
                              contactStartedAtRef.current = Date.now();
                            }
                          }}
                        >
                          <Form.Item
                            label={t('home.contact.form.fullName.label')}
                            name="fullName"
                            rules={[
                              { required: true, message: t('home.contact.form.fullName.required') },
                              {
                                max: CONTACT_FORM_NAME_MAX_LENGTH,
                                message: t('home.contact.form.fullName.max'),
                              },
                            ]}
                          >
                            <Input
                              size="large"
                              placeholder={t('home.contact.form.fullName.placeholder')}
                              maxLength={CONTACT_FORM_NAME_MAX_LENGTH}
                              showCount
                              style={{ height: 54, borderRadius: 16 }}
                            />
                          </Form.Item>
                          <Form.Item
                            label={t('home.contact.form.phone.label')}
                            name="phoneNumber"
                            validateTrigger={['onBlur', 'onSubmit']}
                            rules={[
                              { required: true, message: t('home.contact.form.phone.required') },
                              {
                                validator: (_, value: string) => {
                                  const normalizedPhone = String(value || '').replace(/[^\d+]/g, '');
                                  const digitCount = normalizedPhone.replace(/\D/g, '').length;

                                  if (normalizedPhone.startsWith('+') && digitCount >= 11 && digitCount <= 15) {
                                    return Promise.resolve();
                                  }

                                  return Promise.reject(new Error(t('home.contact.form.phone.invalid')));
                                },
                              },
                            ]}
                            getValueFromEvent={(value: string) => value}
                          >
                            <PhoneInput
                              defaultCountry="uz"
                              preferredCountries={['uz', 'ru']}
                              value={phoneNumberValue}
                              onChange={(value) => form.setFieldValue('phoneNumber', value)}
                              disableDialCodePrefill={false}
                              forceDialCode
                              inputProps={{ name: 'phoneNumber', required: true, autoComplete: 'tel' }}
                              style={{ width: '100%', height: 54, display: 'flex', alignItems: 'stretch' }}
                              inputStyle={{
                                width: '100%',
                                height: '100%',
                                borderRadius: '0 16px 16px 0',
                                borderColor: token.colorBorderSecondary,
                                color: token.colorText,
                                fontSize: 16,
                                background: token.colorBgContainer,
                                boxSizing: 'border-box',
                              }}
                              countrySelectorStyleProps={{
                                buttonStyle: {
                                  height: '100%',
                                  minHeight: 54,
                                  borderRadius: '16px 0 0 16px',
                                  borderColor: token.colorBorderSecondary,
                                  background: token.colorFillSecondary,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  paddingInline: 12,
                                },
                                dropdownStyleProps: {
                                  style: {
                                    borderRadius: 18,
                                    boxShadow: '0 22px 56px rgba(15,23,42,0.14)',
                                    border: '1px solid rgba(148,163,184,0.14)',
                                  },
                                },
                              }}
                            />
                          </Form.Item>
                          <Form.Item
                            label={t('home.contact.form.message.label')}
                            name="message"
                            rules={[
                              { required: true, message: t('home.contact.form.message.required') },
                              {
                                max: CONTACT_FORM_MESSAGE_MAX_LENGTH,
                                message: t('home.contact.form.message.max'),
                              },
                            ]}
                          >
                            <TextArea
                              rows={5}
                              placeholder={t('home.contact.form.message.placeholder')}
                              maxLength={CONTACT_FORM_MESSAGE_MAX_LENGTH}
                              style={{
                                borderRadius: 18,
                                paddingTop: 14,
                                paddingBottom: 14,
                                borderColor: token.colorBorderSecondary,
                                boxSizing: 'border-box',
                                resize: 'vertical',
                              }}
                            />
                          </Form.Item>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'flex-end',
                              marginTop: -18,
                              marginBottom: 18,
                            }}
                          >
                            <Text style={{ color: token.colorTextSecondary, fontSize: 13 }}>
                              {String(messageValue).length}/{CONTACT_FORM_MESSAGE_MAX_LENGTH}
                            </Text>
                          </div>
                          <Form.Item name="website" hidden>
                            <Input tabIndex={-1} autoComplete="off" />
                          </Form.Item>
                          <Space direction="vertical" size={10} style={{ width: '100%' }}>
                            <Button
                              type="primary"
                              htmlType="submit"
                              size="large"
                              loading={sending}
                              disabled={contactCooldownRemainingMs > 0}
                              icon={<ArrowRightOutlined />}
                              style={{ height: 52, borderRadius: 16 }}
                            >
                              {contactCooldownRemainingMs > 0
                                ? `${t('home.contact.form.resend')} ${contactCooldownRemainingSeconds}s`
                                : t('home.contact.form.submit')}
                            </Button>
                          </Space>
                        </Form>
                      </Col>
                      <Col xs={24} lg={12}>
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
                          <div>
                            <Title level={4} style={{ marginTop: 0 }}>
                              {t('home.contact.maps.title')}
                            </Title>
                            <Paragraph style={{ color: token.colorTextSecondary, marginBottom: 0 }}>
                              {t('home.contact.maps.description')}
                            </Paragraph>
                          </div>
                          <a
                            href="https://maps.app.goo.gl/iVybd2JhpikY8YyMA"
                            target="_blank"
                            rel="noreferrer"
                            style={{ textDecoration: 'none' }}
                          >
                            <Button icon={<ArrowRightOutlined />} size="large" style={{ borderRadius: 16, height: 46 }}>
                              {t('home.contact.maps.button')}
                            </Button>
                          </a>
                          <div
                            style={{
                              overflow: 'hidden',
                              borderRadius: 24,
                              border: `1px solid ${token.colorBorderSecondary}`,
                              minHeight: 360,
                              boxShadow: 'var(--color-shadow-soft)',
                            }}
                          >
                            <iframe
                              title="IBMS location map"
                              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2272.350105148409!2d64.4232973655926!3d39.78644334605565!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3f50096437724a41%3A0x991a294ef67f75c1!2sBuxoro%20O%27quv%20NTM(kombinat)!5e1!3m2!1sru!2s!4v1777993385024!5m2!1sru!2s"
                              width="100%"
                              height="100%"
                              style={{ border: 0, minHeight: 360 }}
                              allowFullScreen
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
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

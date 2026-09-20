import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Button,
  Drawer,
  Empty,
  message,
  Modal,
  Progress,
  Radio,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleFilled,
  DownloadOutlined,
  FileTextOutlined,
  LeftOutlined,
  LockOutlined,
  MenuOutlined,
  PlayCircleOutlined,
  RightOutlined,
  SafetyCertificateOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMediaQuery } from 'react-responsive';
import { PATH_AUTH, PATH_COURSE, PATH_USER_PROFILE } from '../../constants';
import { useAppTranslation } from '../../hooks/useAppTranslation.ts';
import {
  completeLessonProgress,
  getCourseAssets,
  getCourseById,
  getCourseProgress,
  getLearnerTest,
  getTopicsByCourse,
  isAuthenticated,
  openLessonProgress,
  startCourseProgress,
  submitTestProgress,
} from './courseApi.ts';
import {
  buildCourseOutline,
  getFilePreviewKind,
  localizeCourseText,
  pickCourseDescription,
  pickCourseTitle,
} from './courseUtils.ts';
import type {
  CourseOutlineItem,
  CourseOutlineTopic,
} from './courseUtils.ts';
import type {
  CourseAssetBundle,
  CourseQuestionRecord,
  CourseRecord,
  CourseTopicRecord,
  ProgressSnapshot,
  ProgressStatus,
} from './types.ts';
import './styles.css';

const { Text, Title, Paragraph } = Typography;

const DEFAULT_PASS_SCORE = 70;

type QuestionState = {
  loaded: boolean;
  loading: boolean;
  questions: CourseQuestionRecord[];
  passScore: number;
};

type FlatItem = CourseOutlineItem & {
  topicIndex: number;
  topicTitle: string;
  index: number;
};

export const CourseLearningPage = () => {
  const { courseId = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery({ maxWidth: 992 });
  const { t, language } = useAppTranslation();
  const [messageApi, contextHolder] = message.useMessage();

  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [course, setCourse] = useState<CourseRecord | null>(null);
  const [topicsRaw, setTopicsRaw] = useState<CourseTopicRecord[]>([]);
  const [assetMap, setAssetMap] = useState<Record<string, CourseAssetBundle>>({});
  const [snapshot, setSnapshot] = useState<ProgressSnapshot | null>(null);
  const [currentKey, setCurrentKey] = useState('');
  const [openTopics, setOpenTopics] = useState<Record<string, boolean>>({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [questionMap, setQuestionMap] = useState<Record<string, QuestionState>>({});
  const [answers, setAnswers] = useState<Record<string, Record<string, number>>>({});
  const [finishModalOpen, setFinishModalOpen] = useState(false);

  const formatText = (key: string, values: Record<string, string | number>) =>
    Object.entries(values).reduce(
      (result, [token, value]) => result.split(`{${token}}`).join(String(value)),
      t(key)
    );

  const isAccessDeniedError = (error: unknown) =>
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    ((error as { response?: { status?: number } }).response?.status === 403 ||
      (error as { response?: { status?: number } }).response?.status === 404);

  // ---------- Yuklash ----------

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      if (!isAuthenticated()) {
        messageApi.warning(t('course.learn.msg.notAuth'));
        navigate(PATH_AUTH.signin, {
          state: { from: `${location.pathname}${location.search}` },
          replace: true,
        });
        return;
      }

      setLoading(true);
      try {
        const courseData = await getCourseById(courseId);
        if (!isMounted) return;
        setCourse(courseData);

        let topicsData: CourseTopicRecord[] = [];
        let progressData: ProgressSnapshot | null = null;

        try {
          [topicsData, progressData] = await Promise.all([
            getTopicsByCourse(courseId),
            getCourseProgress(courseId),
          ]);
        } catch (error) {
          if (isAccessDeniedError(error)) {
            if (!isMounted) return;
            setAccessDenied(true);
            return;
          }
          throw error;
        }

        // Barcha mavzular tarkibini birdaniga yuklaymiz — to'liq playlist ko'rinadi
        const bundles = await Promise.all(
          topicsData.map((topic) =>
            getCourseAssets(topic.id).catch(
              () => ({ videos: [], tests: [] }) as CourseAssetBundle
            )
          )
        );
        if (!isMounted) return;

        const nextAssetMap: Record<string, CourseAssetBundle> = {};
        topicsData.forEach((topic, index) => {
          nextAssetMap[topic.id] = bundles[index];
        });

        setTopicsRaw(topicsData);
        setAssetMap(nextAssetMap);
        setSnapshot(progressData);
        setAccessDenied(false);
      } catch (error) {
        if (!isMounted) return;
        if (isAccessDeniedError(error)) {
          setAccessDenied(true);
          return;
        }
        messageApi.error(t('course.learn.msg.courseLoadError'));
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    bootstrap();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  // ---------- Hosila holatlar ----------

  const outline = useMemo<CourseOutlineTopic[]>(
    () => buildCourseOutline(topicsRaw, assetMap, language),
    [assetMap, language, topicsRaw]
  );

  const items = useMemo<FlatItem[]>(() => {
    let counter = 0;
    return outline.flatMap((topic, topicIndex) =>
      topic.items.map((item) => ({
        ...item,
        topicIndex,
        topicTitle: topic.title,
        index: counter++,
      }))
    );
  }, [outline]);

  const statusMap = useMemo(() => {
    const map = new Map<string, ProgressStatus>();
    (snapshot?.lessons || []).forEach((lesson) => {
      map.set(lesson.lessonItemId, lesson.status);
    });
    return map;
  }, [snapshot]);

  const statusOf = (key: string): ProgressStatus => {
    const known = statusMap.get(key);
    if (known) return known;
    // Snapshot to'liq bo'lsa, unda yo'q element yopiq hisoblanadi
    return statusMap.size > 0 ? 'LOCKED' : 'NOT_STARTED';
  };

  const scoreOf = (key: string) =>
    snapshot?.lessons.find((lesson) => lesson.lessonItemId === key)?.score ?? null;

  const currentItem = items.find((item) => item.key === currentKey) || null;
  const prevItem = currentItem ? items[currentItem.index - 1] || null : null;
  const nextItem = currentItem ? items[currentItem.index + 1] || null : null;
  const nextAllowed = Boolean(nextItem && statusOf(nextItem.key) !== 'LOCKED');

  const courseStarted =
    snapshot?.course.status !== 'NOT_STARTED' || Boolean(snapshot?.course.startedAt);
  const courseCompleted = snapshot?.course.status === 'COMPLETED';
  const progressPercent = snapshot?.course.progressPercent || 0;

  const courseTitleText =
    pickCourseTitle(
      course || undefined,
      language,
      localizeCourseText(snapshot?.course.courseTitle, language) ||
        t('courses.fallback.title')
    ) || t('courses.fallback.title');
  const courseDescriptionText = pickCourseDescription(
    course || undefined,
    language,
    t('courses.fallback.description')
  );

  const resumeItem = useMemo(() => {
    if (items.length === 0) return null;
    return (
      items.find((item) => {
        const status = statusOf(item.key);
        return status === 'IN_PROGRESS' || status === 'FAILED';
      }) ||
      items.find((item) => statusOf(item.key) === 'NOT_STARTED') ||
      items[items.length - 1]
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, statusMap]);

  // Sahifa ochilganda davom etish nuqtasini tanlaymiz (API chaqirmasdan)
  useEffect(() => {
    if (loading || currentKey || !courseStarted || !resumeItem) return;
    setCurrentKey(resumeItem.key);
    setOpenTopics((current) => ({ ...current, [resumeItem.topicId]: true }));
    if (resumeItem.type === 'TEST') {
      void ensureQuestions(resumeItem);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, courseStarted, resumeItem, currentKey]);

  // ---------- Amallar ----------

  const ensureQuestions = async (item: CourseOutlineItem) => {
    if (!item.testId) return;
    const existing = questionMap[item.testId];
    if (existing?.loaded || existing?.loading) return;

    setQuestionMap((current) => ({
      ...current,
      [item.testId!]: {
        loaded: false,
        loading: true,
        questions: [],
        passScore: DEFAULT_PASS_SCORE,
      },
    }));

    try {
      const payload = await getLearnerTest(item.topicId);
      setQuestionMap((current) => ({
        ...current,
        [item.testId!]: {
          loaded: true,
          loading: false,
          questions: payload?.questions || [],
          passScore: payload?.passScore || DEFAULT_PASS_SCORE,
        },
      }));
    } catch {
      messageApi.error(t('course.learn.msg.questionsError'));
      setQuestionMap((current) => ({
        ...current,
        [item.testId!]: {
          loaded: true,
          loading: false,
          questions: [],
          passScore: DEFAULT_PASS_SCORE,
        },
      }));
    }
  };

  const openItem = async (item: FlatItem, options?: { skipApi?: boolean }) => {
    if (statusOf(item.key) === 'LOCKED') {
      messageApi.info(t('course.learn.msg.sequentialLock'));
      return;
    }

    // Kurs hali boshlanmagan bo'lsa, birinchi bosishning o'zi kursni boshlaydi
    if (!courseStarted) {
      await handleStart();
      return;
    }

    setCurrentKey(item.key);
    setOpenTopics((current) => ({ ...current, [item.topicId]: true }));
    setDrawerOpen(false);

    if (item.type === 'TEST') {
      void ensureQuestions(item);
    }

    if (!options?.skipApi && courseStarted) {
      try {
        const nextSnapshot = await openLessonProgress({
          courseId,
          moduleId: item.topicId,
          lessonItemId: item.key,
        });
        setSnapshot(nextSnapshot);
      } catch {
        messageApi.error(t('course.learn.msg.openError'));
      }
    }
  };

  const handleStart = async () => {
    const first = items[0];
    if (!first) {
      messageApi.info(t('course.learn.msg.noLessons'));
      return;
    }

    setStarting(true);
    try {
      let nextSnapshot = await startCourseProgress({
        courseId,
        firstModuleId: first.topicId,
        firstLessonItemId: first.key,
      });
      try {
        nextSnapshot = await openLessonProgress({
          courseId,
          moduleId: first.topicId,
          lessonItemId: first.key,
        });
      } catch {
        // startCourse muvaffaqiyatli — ochish xatosi jarayonni to'xtatmaydi
      }
      setSnapshot(nextSnapshot);
      setCurrentKey(first.key);
      setOpenTopics((current) => ({ ...current, [first.topicId]: true }));
      if (first.type === 'TEST') {
        void ensureQuestions(first);
      }
    } catch {
      messageApi.error(t('course.learn.msg.startError'));
    } finally {
      setStarting(false);
    }
  };

  const goTo = async (item: FlatItem | null) => {
    if (!item) return;
    await openItem(item);
  };

  const celebrateIfJustCompleted = (nextSnapshot: ProgressSnapshot) => {
    if (
      snapshot?.course.status !== 'COMPLETED' &&
      nextSnapshot.course.status === 'COMPLETED'
    ) {
      setFinishModalOpen(true);
    }
  };

  const handleCompleteCurrent = async () => {
    if (!currentItem || currentItem.type === 'TEST') return;

    setActionLoading(true);
    try {
      const nextSnapshot = await completeLessonProgress({
        courseId,
        moduleId: currentItem.topicId,
        lessonItemId: currentItem.key,
        lessonType: currentItem.type,
      });
      setSnapshot(nextSnapshot);
      celebrateIfJustCompleted(nextSnapshot);
      messageApi.success(t('course.learn.msg.lessonDone'));
    } catch {
      messageApi.error(t('course.learn.msg.lessonError'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinishCourse = () => {
    if (courseCompleted) {
      setFinishModalOpen(true);
      return;
    }

    // Hali tugallanmagan majburiy dars/test bor — foydalanuvchini o'sha yerga olib boramiz
    const pending = items.find(
      (item) => item.type !== 'DOCUMENT' && statusOf(item.key) !== 'COMPLETED'
    );
    messageApi.info(t('course.learn.finish.pending'));
    if (pending) {
      void openItem(pending);
    }
  };

  const handleSubmitTest = async () => {
    if (!currentItem?.testId) return;
    const testAnswers = answers[currentItem.key] || {};

    setActionLoading(true);
    try {
      const nextSnapshot = await submitTestProgress({
        courseId,
        moduleId: currentItem.topicId,
        lessonItemId: currentItem.key,
        testId: currentItem.testId,
        answers: testAnswers,
      });
      setSnapshot(nextSnapshot);
      const status = nextSnapshot.lessons.find(
        (lesson) => lesson.lessonItemId === currentItem.key
      )?.status;
      if (status === 'COMPLETED') {
        messageApi.success(t('course.learn.msg.testSuccess'));
        celebrateIfJustCompleted(nextSnapshot);
      } else {
        messageApi.warning(t('course.learn.msg.testSaved'));
      }
    } catch {
      messageApi.error(t('course.learn.msg.testError'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetryTest = () => {
    if (!currentItem) return;
    setAnswers((current) => ({ ...current, [currentItem.key]: {} }));
  };

  // ---------- Yordamchi render bo'laklari ----------

  const itemTypeLabel = (item: CourseOutlineItem) => {
    if (item.type === 'VIDEO') return t('course.learn.lesson.video');
    if (item.type === 'DOCUMENT') return t('course.learn.lesson.material');
    return item.questionCount
      ? formatText('course.learn.lesson.testWithCount', { count: item.questionCount })
      : t('course.learn.lesson.test');
  };

  const ItemIcon = ({ type }: { type: CourseOutlineItem['type'] }) => {
    if (type === 'VIDEO') return <PlayCircleOutlined />;
    if (type === 'DOCUMENT') return <FileTextOutlined />;
    return <SafetyCertificateOutlined />;
  };

  // Oxirgi elementda "Keyingi" o'rniga "Kursni yakunlash" ko'rsatiladi
  const nextOrFinishButton = nextItem ? (
    <Button
      type="primary"
      size="large"
      onClick={() => goTo(nextItem)}
      disabled={!nextAllowed}
    >
      {t('course.learn.btn.next')} <RightOutlined />
    </Button>
  ) : (
    <Button
      type="primary"
      size="large"
      icon={<TrophyOutlined />}
      onClick={handleFinishCourse}
    >
      {t('course.learn.btn.finishCourse')}
    </Button>
  );

  const sidebar = (
    <aside className="learn-sidebar">
      <div className="learn-sidebar-head">
        <Text className="learn-sidebar-label">{t('course.learn.content.title')}</Text>
        <div className="learn-sidebar-progress">
          <Progress
            percent={progressPercent}
            size="small"
            strokeColor={progressPercent >= 100 ? '#16a34a' : '#2563eb'}
          />
        </div>
      </div>

      <div className="learn-sidebar-scroll">
        {outline.map((topic, topicIndex) => {
          const isOpen = openTopics[topic.id] ?? topicIndex === 0;
          const doneCount = topic.items.filter(
            (item) => statusOf(item.key) === 'COMPLETED'
          ).length;

          return (
            <section className="learn-topic" key={topic.id}>
              <button
                type="button"
                className={`learn-topic-head ${isOpen ? 'is-open' : ''}`}
                onClick={() =>
                  setOpenTopics((current) => ({ ...current, [topic.id]: !isOpen }))
                }
              >
                <span className="learn-topic-index">{topicIndex + 1}</span>
                <span className="learn-topic-copy">
                  <span className="learn-topic-title">{topic.title}</span>
                  <span className="learn-topic-meta">
                    {doneCount}/{topic.items.length} {t('course.learn.overview.lesson')}
                  </span>
                </span>
                <RightOutlined className={`learn-topic-chevron ${isOpen ? 'is-open' : ''}`} />
              </button>

              {isOpen ? (
                <div className="learn-topic-items">
                  {topic.items.length === 0 ? (
                    <div className="learn-topic-empty">
                      {t('course.learn.lesson.empty')}
                    </div>
                  ) : (
                    topic.items.map((item) => {
                      const status = statusOf(item.key);
                      const isActive = currentKey === item.key;
                      const isLocked = status === 'LOCKED';

                      return (
                        <button
                          key={item.key}
                          type="button"
                          className={[
                            'learn-item',
                            isActive ? 'is-active' : '',
                            status === 'COMPLETED' ? 'is-completed' : '',
                            status === 'FAILED' ? 'is-failed' : '',
                            isLocked ? 'is-locked' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          onClick={() => {
                            const flat = items.find((entry) => entry.key === item.key);
                            if (flat) void openItem(flat);
                          }}
                        >
                          <span className="learn-item-icon">
                            <ItemIcon type={item.type} />
                          </span>
                          <span className="learn-item-copy">
                            <Text
                              className="learn-item-title"
                              ellipsis={{ tooltip: item.title }}
                            >
                              {item.title}
                            </Text>
                            <span className="learn-item-subtitle">
                              {itemTypeLabel(item)}
                            </span>
                          </span>
                          <span className="learn-item-state">
                            {status === 'COMPLETED' ? (
                              <CheckCircleFilled className="learn-state-done" />
                            ) : status === 'FAILED' ? (
                              <Tag color="error" className="learn-state-tag">
                                {t('course.learn.state.retry')}
                              </Tag>
                            ) : isLocked ? (
                              <LockOutlined className="learn-state-lock" />
                            ) : isActive ? (
                              <span className="learn-state-current" />
                            ) : null}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </aside>
  );

  // ---------- Sahifa holatlari ----------

  if (loading) {
    return (
      <div className="learn-page">
        {contextHolder}
        <div className="learn-loading">
          <Spin size="large" />
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="learn-page">
        {contextHolder}
        <div className="learn-center-card">
          <LockOutlined className="learn-center-icon" />
          <Title level={3}>{t('course.learn.accessDenied.title')}</Title>
          <Paragraph type="secondary">
            {t('course.learn.accessDenied.description')}
          </Paragraph>
          <Button
            type="primary"
            size="large"
            onClick={() => navigate(PATH_COURSE.catalog)}
          >
            {t('course.learn.accessDenied.btn')}
          </Button>
        </div>
      </div>
    );
  }

  const currentStatus = currentItem ? statusOf(currentItem.key) : 'NOT_STARTED';
  const currentQuestionState = currentItem?.testId
    ? questionMap[currentItem.testId]
    : undefined;
  const currentAnswers = currentItem ? answers[currentItem.key] || {} : {};
  const answeredCount = Object.keys(currentAnswers).length;
  const totalQuestions = currentQuestionState?.questions.length || 0;
  const allAnswered = totalQuestions > 0 && answeredCount >= totalQuestions;
  const currentScore = currentItem ? scoreOf(currentItem.key) : null;

  return (
    <div className="learn-page">
      {contextHolder}
      <Helmet>
        <title>
          {courseTitleText} | {t('courses.card.tag')}
        </title>
      </Helmet>

      {/* Yuqori panel */}
      <header className="learn-topbar">
        <div className="learn-topbar-inner">
          <button
            type="button"
            className="learn-back"
            onClick={() => navigate(PATH_COURSE.catalog)}
          >
            <ArrowLeftOutlined />
            <span>{t('course.learn.breadcrumb.courses')}</span>
          </button>

          <span className="learn-topbar-divider" />

          <div className="learn-topbar-title">
            <Text ellipsis={{ tooltip: courseTitleText }} strong>
              {courseTitleText}
            </Text>
          </div>

          <div className="learn-topbar-right">
            {courseStarted ? (
              <div className="learn-topbar-progress">
                <Progress
                  type="circle"
                  percent={progressPercent}
                  size={38}
                  strokeColor={progressPercent >= 100 ? '#4ade80' : '#60a5fa'}
                  trailColor="rgba(255,255,255,0.2)"
                />
                {!isMobile ? (
                  <span className="learn-topbar-progress-label">
                    {t('course.learn.overview.progress')}
                  </span>
                ) : null}
              </div>
            ) : null}
            {isMobile ? (
              <Button ghost icon={<MenuOutlined />} onClick={() => setDrawerOpen(true)}>
                {t('course.learn.mobile.plan')}
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      <div className="learn-body">
        <div className="learn-shell">
          {!isMobile ? sidebar : null}

          <main className="learn-main">
            {courseCompleted ? (
              <div className="learn-done-banner">
                <TrophyOutlined />
                <div>
                  <Text strong>{t('course.learn.done.title')}</Text>
                  <br />
                  <Text type="secondary">{t('course.learn.done.description')}</Text>
                </div>
              </div>
            ) : null}

            {!courseStarted ? (
              /* --------- Kirish (kurs boshlanmagan) --------- */
              <div className="learn-intro">
                <Tag className="learn-intro-tag">{t('courses.card.tag')}</Tag>
                <Title level={2} style={{ margin: '10px 0 8px' }}>
                  {courseTitleText}
                </Title>
                <Paragraph type="secondary" style={{ maxWidth: 560, margin: '0 auto' }}>
                  {courseDescriptionText}
                </Paragraph>
                <div className="learn-intro-meta">
                  <span>
                    <strong>{outline.length}</strong> {t('course.learn.overview.topic')}
                  </span>
                  <span className="learn-intro-dot" />
                  <span>
                    <strong>{items.length}</strong> {t('course.learn.overview.lesson')}
                  </span>
                </div>
                <Button
                  type="primary"
                  size="large"
                  loading={starting}
                  onClick={handleStart}
                  className="learn-intro-start"
                >
                  {t('course.learn.overview.start')}
                </Button>
                <Paragraph type="secondary" style={{ fontSize: 13, marginTop: 14 }}>
                  {t('course.learn.sidebar.subtitle')}
                </Paragraph>
              </div>
            ) : currentItem ? (
              /* --------- Joriy dars paneli --------- */
              <div className="learn-panel">
                {currentItem.type === 'VIDEO' ? (
                  <div className="learn-stage">
                    <div className="learn-video">
                      <iframe
                        src={currentItem.embedUrl}
                        title={currentItem.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                ) : null}

                <div className="learn-panel-body">
                  <div className="learn-panel-head">
                    <div className="learn-panel-copy">
                      <Text className="learn-panel-crumb" type="secondary">
                        {currentItem.topicIndex + 1}-{t('course.learn.overview.topic')} ·{' '}
                        {currentItem.topicTitle}
                      </Text>
                      <Title level={3} className="learn-panel-title">
                        {currentItem.title}
                      </Title>
                    </div>
                    <div className="learn-panel-nav">
                      <Button
                        icon={<LeftOutlined />}
                        disabled={!prevItem}
                        onClick={() => goTo(prevItem)}
                        title={t('course.learn.btn.prev')}
                      />
                      <Button
                        icon={<RightOutlined />}
                        disabled={!nextAllowed}
                        onClick={() => goTo(nextItem)}
                        title={t('course.learn.btn.next')}
                      />
                    </div>
                  </div>

                  {currentItem.type === 'VIDEO' ? (
                    <div className="learn-actionbar">
                      {currentStatus === 'COMPLETED' ? (
                        <>
                          <span className="learn-completed-chip">
                            <CheckCircleFilled /> {t('course.learn.status.completed')}
                          </span>
                          {nextOrFinishButton}
                        </>
                      ) : (
                        <Button
                          type="primary"
                          size="large"
                          icon={<CheckCircleFilled />}
                          loading={actionLoading}
                          onClick={handleCompleteCurrent}
                        >
                          {t('course.learn.btn.complete')}
                        </Button>
                      )}
                    </div>
                  ) : currentItem.type === 'DOCUMENT' ? (
                    <>
                      {getFilePreviewKind(currentItem.fileName) === 'pdf' ? (
                        <div className="learn-doc">
                          <iframe src={currentItem.fileUrl} title={currentItem.title} />
                        </div>
                      ) : getFilePreviewKind(currentItem.fileName) === 'image' ? (
                        <div className="learn-doc learn-doc-image">
                          <img src={currentItem.fileUrl} alt={currentItem.title} />
                        </div>
                      ) : (
                        /* Office fayllar brauzerda ochilmaydi — yuklab olish kartasi */
                        <div className="learn-file-card">
                          <span className="learn-file-icon">
                            <FileTextOutlined />
                          </span>
                          <Text strong className="learn-file-name">
                            {currentItem.fileName}
                          </Text>
                          <Text type="secondary" className="learn-file-note">
                            {t('course.learn.material.noPreview')}
                          </Text>
                          <Button
                            type="primary"
                            size="large"
                            href={currentItem.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            icon={<DownloadOutlined />}
                          >
                            {t('course.learn.material.download')}
                          </Button>
                        </div>
                      )}
                      <div className="learn-actionbar">
                        <Space size={10} wrap>
                          <span className="learn-completed-chip">
                            <CheckCircleFilled /> {t('course.learn.material.read')}
                          </span>
                          {getFilePreviewKind(currentItem.fileName) !== 'other' ? (
                            <Button
                              href={currentItem.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              icon={<DownloadOutlined />}
                            >
                              {t('course.learn.material.download')}
                            </Button>
                          ) : null}
                        </Space>
                        {nextOrFinishButton}
                      </div>
                    </>
                  ) : (
                  /* --------- Test --------- */
                  <div className="learn-test">
                    {currentQuestionState?.loading ? (
                      <div className="learn-test-loading">
                        <Spin />
                      </div>
                    ) : currentStatus === 'COMPLETED' ? (
                      <div className="learn-test-result is-pass">
                        <CheckCircleFilled className="learn-test-result-icon" />
                        <Title level={3} style={{ margin: '10px 0 4px' }}>
                          {currentScore != null ? `${currentScore}%` : ''}
                        </Title>
                        <Text strong>{t('course.learn.test.result.pass')}</Text>
                        <Paragraph type="secondary" style={{ margin: '8px 0 20px' }}>
                          {t('course.learn.test.resultSuccessDescription')}
                        </Paragraph>
                        {nextOrFinishButton}
                      </div>
                    ) : (
                      <>
                        {currentStatus === 'FAILED' ? (
                          <div className="learn-test-result is-fail">
                            <Text strong>
                              {t('course.learn.test.result.title')}:{' '}
                              {currentScore != null ? `${currentScore}%` : '-'}
                            </Text>
                            <Text type="secondary">
                              {formatText('course.learn.test.minimumScore', {
                                score: currentQuestionState?.passScore || DEFAULT_PASS_SCORE,
                              })}
                            </Text>
                            <Button size="small" onClick={handleRetryTest}>
                              {t('course.learn.btn.retryTest')}
                            </Button>
                          </div>
                        ) : (
                          <Text type="secondary" className="learn-test-hint">
                            {formatText('course.learn.test.minimumScore', {
                              score: currentQuestionState?.passScore || DEFAULT_PASS_SCORE,
                            })}
                          </Text>
                        )}

                        {currentQuestionState?.questions.length ? (
                          <div className="learn-test-questions">
                            {currentQuestionState.questions.map((question, questionIndex) => {
                              const answerKey = question.id || String(questionIndex);
                              return (
                                <div className="learn-question" key={answerKey}>
                                  <div className="learn-question-head">
                                    <span className="learn-question-number">
                                      {questionIndex + 1}
                                    </span>
                                    <Text strong className="learn-question-text">
                                      {question.text}
                                    </Text>
                                  </div>
                                  <Radio.Group
                                    value={currentAnswers[answerKey]}
                                    onChange={(event) =>
                                      setAnswers((current) => ({
                                        ...current,
                                        [currentItem.key]: {
                                          ...(current[currentItem.key] || {}),
                                          [answerKey]: event.target.value,
                                        },
                                      }))
                                    }
                                    style={{ width: '100%' }}
                                  >
                                    <Space
                                      direction="vertical"
                                      size={10}
                                      style={{ width: '100%' }}
                                    >
                                      {question.answers.map((answer, answerIndex) => (
                                        <label
                                          key={`${answerKey}-${answerIndex}`}
                                          className={`course-test-option ${
                                            currentAnswers[answerKey] === answerIndex
                                              ? 'is-selected'
                                              : ''
                                          }`}
                                        >
                                          <Radio value={answerIndex}>{answer}</Radio>
                                        </label>
                                      ))}
                                    </Space>
                                  </Radio.Group>
                                </div>
                              );
                            })}

                            <div className="learn-test-submit">
                              <Text type="secondary">
                                {formatText('course.learn.test.answeredCount', {
                                  answered: answeredCount,
                                  total: totalQuestions,
                                })}
                                {!allAnswered
                                  ? ` · ${t('course.learn.test.answerAll')}`
                                  : ''}
                              </Text>
                              <Button
                                type="primary"
                                size="large"
                                loading={actionLoading}
                                disabled={!allAnswered}
                                onClick={handleSubmitTest}
                              >
                                {t('course.learn.btn.submitTest')}
                              </Button>
                            </div>
                          </div>
                        ) : currentQuestionState?.loaded ? (
                          <Empty
                            description={t('course.learn.test.empty')}
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                          />
                        ) : null}
                      </>
                    )}
                  </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="learn-panel">
                <div className="learn-panel-body">
                  <Empty
                    description={t('course.learn.empty.selectSection')}
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      <Drawer
        open={drawerOpen}
        placement="left"
        width="min(380px, calc(100vw - 24px))"
        title={t('course.learn.content.title')}
        onClose={() => setDrawerOpen(false)}
        styles={{ body: { padding: 0 } }}
      >
        {sidebar}
      </Drawer>

      {/* Kurs yakunlanganda tabrik oynasi */}
      <Modal
        open={finishModalOpen}
        footer={null}
        centered
        width={440}
        onCancel={() => setFinishModalOpen(false)}
      >
        <div className="learn-finish-modal">
          <span className="learn-finish-trophy">
            <TrophyOutlined />
          </span>
          <Title level={3} style={{ margin: '14px 0 6px' }}>
            {t('course.learn.done.title')}
          </Title>
          <Paragraph type="secondary" style={{ marginBottom: 22 }}>
            {t('course.learn.done.description')}
          </Paragraph>
          <Space wrap style={{ justifyContent: 'center' }}>
            <Button
              type="primary"
              size="large"
              onClick={() => navigate(PATH_USER_PROFILE.myLearning)}
            >
              {t('course.learn.finish.myLearning')}
            </Button>
            <Button size="large" onClick={() => navigate(PATH_COURSE.catalog)}>
              {t('course.learn.accessDenied.btn')}
            </Button>
          </Space>
        </div>
      </Modal>
    </div>
  );
};

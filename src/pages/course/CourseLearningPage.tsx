import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Alert,
  Button,
  Card,
  Drawer,
  Empty,
  message,
  Progress,
  Radio,
  Space,
  Spin,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import {
  BookOutlined,
  CheckCircleFilled,
  DownloadOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  LeftOutlined,
  LockOutlined,
  MenuOutlined,
  PlayCircleOutlined,
  ProfileOutlined,
  RightOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMediaQuery } from 'react-responsive';
import { Container } from '../../components';
import { PATH_AUTH, PATH_COURSE } from '../../constants';
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
  buildLearningTopics,
  createEmptyProgressSnapshot,
  findFirstTopicEntry,
  getLessonItemId,
  getLessonProgress,
  getTopicCompletion,
  normalizeStatus,
  pickCourseDescription,
  pickCourseTitle,
  resolveVideoEmbedUrl,
} from './courseUtils.ts';
import type {
  CourseAssetBundle,
  CourseQuestionRecord,
  CourseRecord,
  CourseTopicRecord,
  LearningMaterial,
  LearningTopic,
  ProgressSnapshot,
} from './types.ts';
import './styles.css';

const { Title, Text, Paragraph } = Typography;

const DEFAULT_PASS_SCORE = 70;

type TopicAssetState = CourseAssetBundle & {
  loaded: boolean;
  loading: boolean;
};

type QuestionState = {
  loaded: boolean;
  loading: boolean;
  questions: CourseQuestionRecord[];
  passScore: number;
};

type TestResultState = {
  scorePercent: number;
  solvedCount: number;
  totalQuestions: number;
  status: string;
};

type OrderedTopicLesson = {
  topicId: string;
  topicTitle: string;
  lesson: NonNullable<LearningTopic['lessons'][number]>;
  index: number;
};

export const CourseLearningPage = () => {
  const { courseId = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery({ maxWidth: 992 });
  const [messageApi, contextHolder] = message.useMessage();
  const [course, setCourse] = useState<CourseRecord | null>(null);
  const [topicsRaw, setTopicsRaw] = useState<CourseTopicRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [starting, setStarting] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');
  const [openedTopicId, setOpenedTopicId] = useState<string | null>(null);
  const [progressSnapshot, setProgressSnapshot] = useState<ProgressSnapshot | null>(
    null
  );
  const [assetMap, setAssetMap] = useState<Record<string, TopicAssetState>>({});
  const [questionMap, setQuestionMap] = useState<Record<string, QuestionState>>({});
  const [testAnswers, setTestAnswers] = useState<Record<string, Record<string, number>>>(
    {}
  );
  const [testResults, setTestResults] = useState<Record<string, TestResultState>>({});
  const [actionLoading, setActionLoading] = useState(false);
  const [previewTab, setPreviewTab] = useState<'video' | 'materials'>('video');
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<
    Record<string, string>
  >({});

  const isAccessDeniedError = (error: unknown) =>
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    ((error as { response?: { status?: number } }).response?.status === 403 ||
      (error as { response?: { status?: number } }).response?.status === 404);

  const ensureTopicAssets = async (topicId: string) => {
    const existing = assetMap[topicId];
    if (existing?.loaded || existing?.loading) {
      return existing ?? { videos: [], tests: [], loaded: false, loading: true };
    }

    setAssetMap((current) => ({
      ...current,
      [topicId]: {
        videos: current[topicId]?.videos || [],
        tests: current[topicId]?.tests || [],
        loaded: false,
        loading: true,
      },
    }));

    try {
      const bundle = await getCourseAssets(topicId);
      const nextState = {
        ...bundle,
        loaded: true,
        loading: false,
      };
      setAssetMap((current) => ({
        ...current,
        [topicId]: nextState,
      }));
      return nextState;
    } catch {
      messageApi.error('Mavzu materiallarini yuklashda xatolik yuz berdi.');
      const emptyState = {
        videos: [],
        tests: [],
        loaded: true,
        loading: false,
      };
      setAssetMap((current) => ({
        ...current,
        [topicId]: emptyState,
      }));
      return emptyState;
    }
  };

  const loadQuestions = async (topicId: string, testId: string) => {
    const existing = questionMap[testId];
    if (existing?.loaded || existing?.loading) return existing?.questions || [];

    setQuestionMap((current) => ({
      ...current,
      [testId]: {
        loaded: false,
        loading: true,
        questions: [],
        passScore: DEFAULT_PASS_SCORE,
      },
    }));

    try {
      const payload = await getLearnerTest(topicId);
      const questions = payload?.questions || [];
      setQuestionMap((current) => ({
        ...current,
        [testId]: {
          loaded: true,
          loading: false,
          questions,
          passScore: payload?.passScore || DEFAULT_PASS_SCORE,
        },
      }));
      return questions;
    } catch {
      messageApi.error('Test savollarini yuklashda xatolik yuz berdi.');
      setQuestionMap((current) => ({
        ...current,
        [testId]: {
          loaded: true,
          loading: false,
          questions: [],
          passScore: DEFAULT_PASS_SCORE,
        },
      }));
      return [];
    }
  };

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      if (!isAuthenticated()) {
        messageApi.warning('Kurslarni ko‘rish uchun avval tizimga kiring.');
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
        setAccessDenied(false);

        let topicsData: CourseTopicRecord[] = [];
        let progressData: ProgressSnapshot;

        try {
          [topicsData, progressData] = await Promise.all([
            getTopicsByCourse(courseId),
            getCourseProgress(courseId),
          ]);
        } catch (error) {
          if (isAccessDeniedError(error)) {
            if (!isMounted) return;
            setAccessDenied(true);
            setTopicsRaw([]);
            setProgressSnapshot(createEmptyProgressSnapshot(courseId));
            setSelectedTopicId('');
            setSelectedLessonId('');
            return;
          }

          throw error;
        }

        if (!isMounted) return;

        setTopicsRaw(topicsData);
        setProgressSnapshot(progressData);

        if (topicsData.length > 0) {
          const firstTopicId = topicsData[0].id;
          setSelectedTopicId(firstTopicId);
          setOpenedTopicId(firstTopicId);
          const assets = await ensureTopicAssets(firstTopicId);
          if (!isMounted) return;
          const firstTopic = buildLearningTopics([topicsData[0]], {
            [firstTopicId]: assets,
          })[0];
          const firstEntry = findFirstTopicEntry(firstTopic ? [firstTopic] : []);
          setSelectedLessonId(firstEntry?.lesson?.id || '');
          if (!firstEntry?.lesson && firstEntry?.material) {
            setSelectedMaterialIds((current) => ({
              ...current,
              [firstTopicId]: firstEntry.material.id,
            }));
            setPreviewTab('materials');
          }
        }
      } catch (error) {
        if (!isMounted) return;
        if (isAccessDeniedError(error)) {
          messageApi.error('Bu kurs sizga hali biriktirilmagan.');
          setAccessDenied(true);
          return;
        }
        messageApi.error('Kurs ma’lumotlarini yuklashda xatolik yuz berdi.');
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
  }, [courseId, location.pathname, location.search, navigate]);

  const learningTopics = useMemo(
    () =>
      buildLearningTopics(
        topicsRaw,
        Object.fromEntries(
          Object.entries(assetMap).map(([topicId, state]) => [
            topicId,
            {
              videos: state.videos,
              tests: state.tests,
            },
          ])
        )
      ),
    [assetMap, topicsRaw]
  );

  const orderedLessons = useMemo<OrderedTopicLesson[]>(
    () => {
      let counter = 0;
      return learningTopics.flatMap((topic) =>
        topic.lessons.map((lesson) => ({
          topicId: topic.id,
          topicTitle: topic.title,
          lesson,
          index: counter++,
        }))
      );
    },
    [learningTopics]
  );

  const firstPendingLessonIndex = useMemo(
    () =>
      orderedLessons.findIndex(({ lesson }) => {
        const progress = getLessonProgress(progressSnapshot, getLessonItemId(lesson));
        return progress?.status !== 'COMPLETED';
      }),
    [orderedLessons, progressSnapshot]
  );

  const selectedTopic = useMemo(
    () => learningTopics.find((topic) => topic.id === selectedTopicId) || null,
    [learningTopics, selectedTopicId]
  );

  const selectedLesson = useMemo(() => {
    if (!selectedTopic) return null;
    return (
      selectedTopic.lessons.find((lesson) => lesson.id === selectedLessonId) || null
    );
  }, [selectedLessonId, selectedTopic]);

  const selectedLessonProgress = selectedLesson
    ? getLessonProgress(progressSnapshot, getLessonItemId(selectedLesson))
    : null;

  const selectedMaterials = selectedTopic?.materials || [];
  const selectedMaterial =
    selectedMaterials.find(
      (material) => material.id === selectedMaterialIds[selectedTopicId]
    ) || selectedMaterials[0] || null;
  const courseStarted =
    progressSnapshot?.course.status !== 'NOT_STARTED' ||
    Boolean(progressSnapshot?.course.startedAt);

  const currentQuestions = selectedLesson?.testId
    ? questionMap[selectedLesson.testId]?.questions || []
    : [];
  const currentPassScore = selectedLesson?.testId
    ? questionMap[selectedLesson.testId]?.passScore || DEFAULT_PASS_SCORE
    : DEFAULT_PASS_SCORE;

  const currentTestAnswers = selectedLesson
    ? testAnswers[selectedLesson.id] || {}
    : {};

  const currentTestResult = selectedLesson ? testResults[selectedLesson.id] : null;

  const getOrderedEntry = (lessonId?: string | null) =>
    orderedLessons.find((entry) => entry.lesson.id === lessonId) || null;

  const isLessonLocked = (lessonId: string) => {
    const entry = getOrderedEntry(lessonId);
    if (!entry) return false;

    const progress = getLessonProgress(progressSnapshot, getLessonItemId(entry.lesson));
    if (progress?.status === 'COMPLETED' || progress?.status === 'IN_PROGRESS') {
      return false;
    }

    return firstPendingLessonIndex !== -1 && entry.index !== firstPendingLessonIndex;
  };

  const getSequentialLessonState = (lesson: LearningTopic['lessons'][number]) => {
    const lessonProgress = getLessonProgress(progressSnapshot, getLessonItemId(lesson));

    if (lessonProgress?.status === 'COMPLETED') return 'completed';
    if (lessonProgress?.status === 'FAILED') return 'failed';
    if (lessonProgress?.status === 'IN_PROGRESS') return 'active';
    if (isLessonLocked(lesson.id)) return 'locked';

    const topicEntry = getOrderedEntry(lesson.id);
    const isCurrentPending =
      topicEntry && firstPendingLessonIndex !== -1 && topicEntry.index === firstPendingLessonIndex;

    if (selectedLessonId === lesson.id || isCurrentPending) return 'active';

    return 'available';
  };

  const currentOrderedEntry = getOrderedEntry(selectedLessonId);
  const previousLessonEntry =
    currentOrderedEntry && currentOrderedEntry.index > 0
      ? orderedLessons[currentOrderedEntry.index - 1]
      : null;
  const nextLessonEntry =
    currentOrderedEntry &&
    currentOrderedEntry.index < orderedLessons.length - 1
      ? orderedLessons[currentOrderedEntry.index + 1]
      : null;

  const canAdvanceToNext =
    !!selectedLesson &&
    ((selectedLesson.type === 'TEST'
      ? selectedLessonProgress?.status === 'COMPLETED'
      : selectedLessonProgress?.status === 'COMPLETED') ||
      false);

  useEffect(() => {
    if (!selectedTopic || selectedTopic.materials.length === 0) {
      return;
    }

    setSelectedMaterialIds((current) => {
      if (current[selectedTopic.id]) {
        return current;
      }

      return {
        ...current,
        [selectedTopic.id]: selectedTopic.materials[0].id,
      };
    });
  }, [selectedTopic]);

  useEffect(() => {
    if (selectedLesson?.type === 'VIDEO') {
      setPreviewTab('video');
      return;
    }

    if (!selectedLesson && selectedMaterials.length > 0) {
      setPreviewTab('materials');
    }
  }, [selectedLesson, selectedMaterials.length]);

  const requireAuth = () => {
    if (isAuthenticated()) return true;

    messageApi.warning('Davom etish uchun avval tizimga kiring.');
    navigate(PATH_AUTH.signin, {
      state: { from: `${location.pathname}${location.search}` },
    });
    return false;
  };

  const getRecommendedLesson = () => {
    for (const entry of orderedLessons) {
      const progress = getLessonProgress(
        progressSnapshot,
        getLessonItemId(entry.lesson)
      );
      if (progress?.status !== 'COMPLETED') {
        return { topicId: entry.topicId, lesson: entry.lesson, material: null };
      }
    }

    return findFirstTopicEntry(learningTopics);
  };

  const focusLesson = async (
    topicId: string,
    lessonId?: string,
    options?: { triggerProgress?: boolean }
  ) => {
    const triggerProgress = options?.triggerProgress ?? false;
    const topic = topicsRaw.find((item) => item.id === topicId);
    if (!topic) return;

    const assets = await ensureTopicAssets(topicId);
    const builtTopic = buildLearningTopics([topic], {
      [topicId]: assets,
    })[0];
    const targetLesson =
      builtTopic.lessons.find((lesson) => lesson.id === lessonId) ||
      builtTopic.lessons[0] ||
      null;

    if (!targetLesson) {
      setSelectedTopicId(topicId);
      setSelectedLessonId('');
      return;
    }

    setSelectedTopicId(topicId);
    setSelectedLessonId(targetLesson.id);
    setOpenedTopicId(topicId);
    setDrawerOpen(false);
    if (targetLesson.type === 'VIDEO') {
      setPreviewTab('video');
    }

    if (targetLesson.type === 'TEST' && targetLesson.testId) {
      await loadQuestions(topicId, targetLesson.testId);
    }

    if (triggerProgress && isAuthenticated() && courseStarted) {
      try {
        const snapshot = await openLessonProgress({
          courseId,
          moduleId: topicId,
          lessonItemId: getLessonItemId(targetLesson),
        });
        setProgressSnapshot(snapshot);
      } catch {
        messageApi.error('Darsni ochishda xatolik yuz berdi.');
      }
    }
  };

  const focusMaterial = async (
    topicId: string,
    materialId?: string,
    options?: { triggerProgress?: boolean }
  ) => {
    const triggerProgress = options?.triggerProgress ?? false;
    const topic = topicsRaw.find((item) => item.id === topicId);
    if (!topic) return;

    const assets = await ensureTopicAssets(topicId);
    const builtTopic = buildLearningTopics([topic], {
      [topicId]: assets,
    })[0];
    const targetMaterial =
      builtTopic.materials.find((item) => item.id === materialId) ||
      builtTopic.materials[0] ||
      null;

    setSelectedTopicId(topicId);
    setSelectedLessonId('');
    setOpenedTopicId(topicId);
    setDrawerOpen(false);
    setPreviewTab('materials');

    if (!targetMaterial) {
      return;
    }

    setSelectedMaterialIds((current) => ({
      ...current,
      [topicId]: targetMaterial.id,
    }));

    if (triggerProgress && isAuthenticated() && courseStarted) {
      try {
        const snapshot = await openLessonProgress({
          courseId,
          moduleId: topicId,
          lessonItemId: targetMaterial.id,
        });
        setProgressSnapshot(snapshot);
      } catch {
        messageApi.error('Materialni ochishda xatolik yuz berdi.');
      }
    }
  };

  const handleStartCourse = async () => {
    if (!requireAuth()) return;

    const recommended = getRecommendedLesson();
    if (!recommended) {
      messageApi.info('Bu kursda hali ko‘rsatiladigan dars mavjud emas.');
      return;
    }

    try {
      setStarting(true);

      if (!courseStarted) {
        const snapshot = await startCourseProgress({
          courseId,
          firstModuleId: recommended.topicId,
          firstLessonItemId:
            recommended.lesson?.id ||
            recommended.material?.id ||
            '',
        });
        setProgressSnapshot(snapshot);
      }

      if (recommended.lesson) {
        await focusLesson(recommended.topicId, recommended.lesson.id, {
          triggerProgress: true,
        });
      } else if (recommended.material) {
        await focusMaterial(recommended.topicId, recommended.material.id, {
          triggerProgress: true,
        });
      }
    } catch {
      messageApi.error('Kursni boshlashda xatolik yuz berdi.');
    } finally {
      setStarting(false);
    }
  };

  const handleCompleteLesson = async () => {
    if (!selectedLesson || selectedLesson.type === 'TEST') return;
    if (!requireAuth()) return;
    if (!courseStarted) {
      messageApi.info('Avval kursni boshlang, keyin darsni yakunlang.');
      return;
    }

    try {
      setActionLoading(true);
      const snapshot = await completeLessonProgress({
        courseId,
        moduleId: selectedTopicId,
        lessonItemId: getLessonItemId(selectedLesson),
        lessonType: selectedLesson.type,
      });
      setProgressSnapshot(snapshot);
      messageApi.success('Dars bajarildi deb belgilandi.');
    } catch {
      messageApi.error('Darsni yakunlashda xatolik yuz berdi.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitTest = async () => {
    if (!selectedLesson?.testId) return;
    if (!requireAuth()) return;
    if (!courseStarted) {
      messageApi.info('Testni yuborishdan oldin kursni boshlang.');
      return;
    }

    try {
      setActionLoading(true);
      const snapshot = await submitTestProgress({
        courseId,
        moduleId: selectedTopicId,
        lessonItemId: getLessonItemId(selectedLesson),
        testId: selectedLesson.testId,
        answers: currentTestAnswers,
      });
      setProgressSnapshot(snapshot);
      const submittedLesson = snapshot.lessons.find(
        (lesson) => lesson.lessonItemId === getLessonItemId(selectedLesson)
      );
      const nextResult = {
        scorePercent: submittedLesson?.score ?? 0,
        solvedCount: Object.keys(currentTestAnswers).length,
        totalQuestions: currentQuestions.length,
        status: submittedLesson?.status || 'NOT_STARTED',
      };
      setTestResults((current) => ({
        ...current,
        [selectedLesson.id]: nextResult,
      }));
      if (submittedLesson?.status === 'COMPLETED') {
        messageApi.success('Test muvaffaqiyatli topshirildi.');
      } else {
        messageApi.warning('Natija saqlandi. Testni qayta ishlashingiz mumkin.');
      }
    } catch {
      messageApi.error('Testni yuborishda xatolik yuz berdi.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTopicToggle = async (topicId: string) => {
    if (openedTopicId === topicId) {
      setOpenedTopicId(null);
      return;
    }

    setOpenedTopicId(topicId);
    await ensureTopicAssets(topicId);

    if (selectedTopicId !== topicId) {
      const topic = learningTopics.find((item) => item.id === topicId);
      const firstEntry = findFirstTopicEntry(topic ? [topic] : []);
      if (firstEntry?.lesson) {
        if (isLessonLocked(firstEntry.lesson.id)) {
          setSelectedTopicId(topicId);
          setSelectedLessonId('');
          return;
        }
        await focusLesson(topicId, firstEntry.lesson.id);
      } else if (firstEntry?.material) {
        await focusMaterial(topicId, firstEntry.material.id);
      } else {
        await focusLesson(topicId);
      }
    }
  };

  const handleOpenLesson = async (topicId: string, lessonId: string) => {
    if (isLessonLocked(lessonId)) {
      messageApi.info(
        "Keyingi bosqichni ochish uchun avval oldingi dars yoki mavzu testini yakunlang."
      );
      return;
    }

    await focusLesson(topicId, lessonId, {
      triggerProgress: true,
    });
  };

  const jumpToOrderedLesson = async (entry?: OrderedTopicLesson | null) => {
    if (!entry) return;
    await focusLesson(entry.topicId, entry.lesson.id, {
      triggerProgress: courseStarted,
    });
  };

  const handleRetrySelectedTest = () => {
    if (!selectedLesson) return;

    setTestAnswers((current) => ({
      ...current,
      [selectedLesson.id]: {},
    }));
    setTestResults((current) => {
      const next = { ...current };
      delete next[selectedLesson.id];
      return next;
    });
  };

  const sidebarContent = (
    <div className="course-learning-sidebar">
      <div className="course-learning-sidebar-header">
        <div className="course-syllabus-header">
          <Text className="course-syllabus-eyebrow">Kurs yo‘li</Text>
          <Title level={4} style={{ margin: 0, color: '#102a43' }}>
            Mavzular va bosqichlar
          </Title>
          <Text style={{ color: '#52606d' }}>
            Darslar ketma-ket ochiladi. Mavzu testi bo‘lsa, keyingi mavzuga o‘tishdan oldin uni topshirish majburiy.
          </Text>
        </div>
      </div>

      <div className="course-tree-scroll">
        {learningTopics.map((topic, index) => {
          const isOpen = openedTopicId === topic.id;
          const completion = getTopicCompletion(progressSnapshot, topic);
          const moduleStatus = normalizeStatus(
            progressSnapshot?.modules.find((module) => module.moduleId === topic.id)?.status
          );

          return (
            <div className="course-topic-card" key={topic.id}>
              <button
                type="button"
                className={`course-topic-trigger ${isOpen ? 'is-open' : ''}`}
                onClick={() => handleTopicToggle(topic.id)}
              >
                <div className="course-topic-trigger-copy">
                  <Text className="course-topic-title">
                    {index + 1}. {topic.title}
                  </Text>
                  <div className="course-topic-meta">
                    <Tag className={`course-topic-status course-topic-status-${moduleStatus.toLowerCase()}`}>
                      {completion.percent}% tayyor
                    </Tag>
                    <span className="course-topic-meta-item">
                      <BookOutlined /> {topic.lessons.filter((lesson) => lesson.type === 'VIDEO').length} dars
                    </span>
                    {topic.lessons.some((lesson) => lesson.type === 'TEST') ? (
                      <span className="course-topic-meta-item">
                        <SafetyCertificateOutlined /> {topic.lessons.filter((lesson) => lesson.type === 'TEST').length} test
                      </span>
                    ) : null}
                  </div>
                </div>
                <RightOutlined
                  className={`course-topic-chevron ${isOpen ? 'is-open' : ''}`}
                />
              </button>

              {isOpen ? (
                <div className="course-topic-lessons">
                  {topic.lessons.length > 0 ? (
                    topic.lessons.map((lesson) => {
                      const lessonState = getSequentialLessonState(lesson);
                      const isActive = selectedLessonId === lesson.id;
                      return (
                        <button
                          key={lesson.id}
                          type="button"
                          className={[
                            'course-lesson-button',
                            isActive ? 'is-active' : '',
                            lessonState === 'completed' ? 'is-completed' : '',
                            lessonState === 'failed' ? 'is-failed' : '',
                            lessonState === 'locked' ? 'is-locked' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          onClick={() => handleOpenLesson(topic.id, lesson.id)}
                        >
                          <Space align="center" size={12} style={{ minWidth: 0 }}>
                            <span className="course-lesson-icon">
                              {lesson.type === 'VIDEO' ? (
                                <PlayCircleOutlined />
                              ) : (
                                <SafetyCertificateOutlined />
                              )}
                            </span>
                            <div className="course-lesson-copy">
                              <Text className="course-lesson-title" ellipsis={{ tooltip: lesson.title }}>
                                {lesson.title}
                              </Text>
                              <Text className="course-lesson-subtitle">
                                {lesson.type === 'VIDEO'
                                  ? 'Video dars'
                                  : lesson.questionCount
                                    ? `${lesson.questionCount} savolli mavzu testi`
                                    : 'Mavzu testi'}
                              </Text>
                            </div>
                          </Space>
                          <LessonStateTag state={lessonState} />
                        </button>
                      );
                    })
                  ) : (
                    <div className="course-topic-empty">
                      {assetMap[topic.id]?.loading ? (
                        <div
                          style={{
                            minHeight: 120,
                            display: 'grid',
                            placeItems: 'center',
                          }}
                        >
                          <Spin />
                        </div>
                      ) : (
                        <Empty
                          description="Bu mavzu uchun hozircha video yoki test topilmadi"
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="course-learning-page">
        {contextHolder}
        <Container style={{ padding: '44px 20px 72px' }}>
          <Card className="course-preview-card">
            <div style={{ minHeight: 480, display: 'grid', placeItems: 'center' }}>
              <Spin size="large" />
            </div>
          </Card>
        </Container>
      </div>
    );
  }

  return (
    <div className="course-learning-page">
      {contextHolder}
      <Helmet>
        <title>
          {(progressSnapshot?.course.courseTitle || pickCourseTitle(course || undefined))} | Kurs
        </title>
      </Helmet>

      <Container style={{ padding: '34px 20px 72px' }}>
        <Space direction="vertical" size={20} style={{ width: '100%' }}>
          <Space
            wrap
            style={{
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <Space wrap size={10}>
              <Link to="/">
                <Text style={{ color: '#64748b' }}>Bosh sahifa</Text>
              </Link>
              <Text style={{ color: '#94a3b8' }}>/</Text>
              <Link to="/courses">
                <Text style={{ color: '#64748b' }}>Kurslar</Text>
              </Link>
              <Text style={{ color: '#94a3b8' }}>/</Text>
              <Text strong style={{ color: '#102a43' }}>
                {progressSnapshot?.course.courseTitle || pickCourseTitle(course || undefined)}
              </Text>
            </Space>

            {isMobile ? (
              <Button
                className="course-mobile-tree-button"
                icon={<MenuOutlined />}
                size="large"
                onClick={() => setDrawerOpen(true)}
                style={{ height: 46, borderRadius: 16 }}
              >
                Kurs rejasi
              </Button>
            ) : null}
          </Space>

          <div className="course-learning-shell">
            {!isMobile ? sidebarContent : null}

            <div className="course-preview-shell">
              <Card className="course-preview-card">
                <div className="course-learning-overview">
                  <div className="course-learning-overview-main">
                    <Space wrap size={8}>
                      <Tag className="course-catalog-card-tag">{topicsRaw.length} mavzu</Tag>
                      <Tag className="course-catalog-card-tag">
                        {learningTopics.reduce(
                          (count, topic) => count + topic.lessons.length,
                          0
                        )}{' '}
                        dars
                      </Tag>
                    </Space>

                    <div>
                      <Title style={{ margin: 0, color: '#102a43' }}>
                        {progressSnapshot?.course.courseTitle || pickCourseTitle(course || undefined)}
                      </Title>
                      <Paragraph
                        style={{
                          margin: '10px 0 0',
                          color: '#52606d',
                          fontSize: 15,
                          maxWidth: 760,
                        }}
                      >
                        {pickCourseDescription(course || undefined)}
                      </Paragraph>
                    </div>

                    <Space wrap size={16}>
                      {(progressSnapshot?.course.instructor || course?.instructor) ? (
                        <Text style={{ color: '#64748b' }}>
                          <ProfileOutlined /> O‘qituvchi:{' '}
                          {progressSnapshot?.course.instructor || course?.instructor}
                        </Text>
                      ) : null}
                      <Text style={{ color: '#64748b' }}>
                        <FolderOpenOutlined /> {topicsRaw.length} modul
                      </Text>
                      <Text style={{ color: '#64748b' }}>
                        <BookOutlined />{' '}
                        {learningTopics.reduce(
                          (count, topic) => count + topic.lessons.length,
                          0
                        )}{' '}
                        dars
                      </Text>
                    </Space>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gap: 14,
                      width: '100%',
                    }}
                  >
                    <div>
                      <Text style={{ color: '#64748b' }}>Bajarilgan qism</Text>
                      <Progress
                        percent={progressSnapshot?.course.progressPercent || 0}
                        strokeColor="#2563eb"
                        showInfo
                      />
                    </div>
                    {accessDenied ? (
                      <Alert
                        type="warning"
                        showIcon
                        message="Bu kurs sizga hali biriktirilmagan"
                        description="Kurs ichidagi mavzularni ochish uchun administrator bilan bog‘laning yoki kurslar ro‘yxatiga qayting."
                      />
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                        <Button
                          type="primary"
                          size="large"
                          loading={starting}
                          onClick={handleStartCourse}
                          style={{ height: 48, borderRadius: 16, minWidth: 220 }}
                        >
                          {courseStarted ? 'Davom ettirish' : 'Boshlash'}
                        </Button>
                      </div>
                    )}
                    {!isAuthenticated() ? (
                      <Text style={{ color: '#64748b' }}>
                        Davom etish va natijani saqlash uchun tizimga kirish kerak.
                      </Text>
                    ) : null}
                    {accessDenied ? (
                      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                        <Button
                          size="large"
                          onClick={() => navigate(PATH_COURSE.catalog)}
                          style={{ height: 46, borderRadius: 16 }}
                        >
                          Kurslar ro‘yxatiga qaytish
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </Card>

              {accessDenied ? (
                <Card className="course-preview-card">
                  <Empty
                    description="Bu kursning ichki mavzulari siz uchun hozircha yopiq"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                </Card>
              ) : selectedTopic ? (
                <>
                  <Card className="course-preview-card">
                    <div className="course-stage-nav">
                      <Button
                        icon={<LeftOutlined />}
                        onClick={() => jumpToOrderedLesson(previousLessonEntry)}
                        disabled={!previousLessonEntry}
                      >
                        Oldingi
                      </Button>
                      <div className="course-stage-nav-center">
                        <Text style={{ color: '#64748b' }}>{selectedTopic.title}</Text>
                        <Text strong style={{ color: '#102a43' }}>
                          {selectedLesson?.title || 'Mavzu bo‘limi'}
                        </Text>
                      </div>
                      <Button
                        type="primary"
                        icon={<RightOutlined />}
                        onClick={() => jumpToOrderedLesson(nextLessonEntry)}
                        disabled={!nextLessonEntry || !canAdvanceToNext}
                      >
                        Keyingi
                      </Button>
                    </div>
                  </Card>

                  <Card className="course-preview-card course-stage-card">
                    <div className="course-stage-header">
                      <div className="course-stage-copy">
                        <Space wrap size={8}>
                          <Tag className="course-stage-pill">
                            {selectedLesson?.type === 'TEST' ? (
                              <>
                                <SafetyCertificateOutlined /> Mavzu testi
                              </>
                            ) : (
                              <>
                                <PlayCircleOutlined /> Video dars
                              </>
                            )}
                          </Tag>
                          <Tag className="course-stage-pill course-stage-pill-muted">
                            {normalizeLabel(selectedLessonProgress?.status || 'NOT_STARTED')}
                          </Tag>
                          {selectedLesson?.type === 'TEST' ? (
                            <Tag className="course-stage-pill course-stage-pill-muted">
                              {currentQuestions.length} savol
                            </Tag>
                          ) : null}
                        </Space>

                        <Title level={2} style={{ margin: 0, color: '#102a43' }}>
                          {selectedLesson?.title || selectedTopic.title}
                        </Title>

                        <Paragraph className="course-stage-description">
                          {selectedLesson?.type === 'TEST'
                            ? 'Barcha savollarga javob berib, yakunda natijani bir martada yuboring. Testdan o‘tish keyingi mavzuni ochadi.'
                            : 'Darsni ko‘rib chiqing. Kerak bo‘lsa pastdagi materiallar orqali qo‘shimcha fayllarni ham ko‘rishingiz mumkin.'}
                        </Paragraph>
                      </div>

                      {selectedLesson?.type === 'VIDEO' ? (
                        <div className="course-stage-actions">
                          <Button
                            type="primary"
                            icon={<CheckCircleFilled />}
                            loading={actionLoading}
                            onClick={handleCompleteLesson}
                            style={{ borderRadius: 14 }}
                          >
                            Dars yakunlandi
                          </Button>
                          {canAdvanceToNext && nextLessonEntry ? (
                            <Button
                              icon={<RightOutlined />}
                              onClick={() => jumpToOrderedLesson(nextLessonEntry)}
                              style={{ borderRadius: 14 }}
                            >
                              Keyingi bosqich
                            </Button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    {selectedLesson?.type === 'TEST' ? (
                      <Space direction="vertical" size={18} style={{ width: '100%' }}>
                        <Alert
                          type="info"
                          showIcon
                          message={`Testni yakunlash uchun kamida ${currentPassScore}% natija talab qilinadi.`}
                          description="Barcha savollarga javob bering va yakunda bitta tugma orqali natijani yuboring."
                        />

                        {questionMap[selectedLesson.testId || '']?.loading ? (
                          <div
                            style={{
                              minHeight: 240,
                              display: 'grid',
                              placeItems: 'center',
                            }}
                          >
                            <Spin />
                          </div>
                        ) : currentQuestions.length > 0 ? (
                          <div className="course-test-grid">
                            {currentQuestions.map((question, questionIndex) => (
                              <Card
                                key={`${selectedLesson.id}-${questionIndex}`}
                                className="course-test-question-card"
                              >
                                <Space
                                  direction="vertical"
                                  size={16}
                                  style={{ width: '100%' }}
                                >
                                  <div>
                                    <Text className="course-test-question-label">
                                      Savol {questionIndex + 1}
                                    </Text>
                                    <Title level={4} className="course-test-question-title">
                                      {question.text}
                                    </Title>
                                  </div>
                                  <Radio.Group
                                    value={
                                      currentTestAnswers[question.id || String(questionIndex)]
                                    }
                                    onChange={(event) =>
                                      setTestAnswers((current) => ({
                                        ...current,
                                        [selectedLesson.id]: {
                                          ...(current[selectedLesson.id] || {}),
                                          [question.id || String(questionIndex)]:
                                            event.target.value,
                                        },
                                      }))
                                    }
                                    style={{ width: '100%' }}
                                  >
                                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                                      {question.answers.map((answer, answerIndex) => (
                                        <label
                                          key={`${selectedLesson.id}-${questionIndex}-${answerIndex}`}
                                          className="course-test-option"
                                        >
                                          <Radio value={answerIndex}>{answer}</Radio>
                                        </label>
                                      ))}
                                    </Space>
                                  </Radio.Group>
                                </Space>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <Empty
                            description="Bu test uchun savollar topilmadi"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                          />
                        )}

                        <div className="course-test-submitbar">
                          <div className="course-test-submitbar-copy">
                            <Text strong style={{ color: '#102a43' }}>
                              {Object.keys(currentTestAnswers).length}/{currentQuestions.length} savolga javob berildi
                            </Text>
                            <Text style={{ color: '#64748b' }}>
                              Natijani ko‘rish uchun testni yakunda yuboring.
                            </Text>
                          </div>
                          <Space wrap>
                            {currentTestResult?.status === 'FAILED' ? (
                              <Button onClick={handleRetrySelectedTest} style={{ borderRadius: 14 }}>
                                Qayta ishlash
                              </Button>
                            ) : null}
                            <Button
                              type="primary"
                              size="large"
                              icon={<SafetyCertificateOutlined />}
                              loading={actionLoading}
                              onClick={handleSubmitTest}
                              style={{ borderRadius: 16, height: 48 }}
                            >
                              Testni yakunlash
                            </Button>
                            {currentTestResult?.status === 'COMPLETED' && nextLessonEntry ? (
                              <Button
                                icon={<RightOutlined />}
                                onClick={() => jumpToOrderedLesson(nextLessonEntry)}
                                style={{ borderRadius: 14 }}
                              >
                                Keyingi mavzu
                              </Button>
                            ) : null}
                          </Space>
                        </div>

                        {currentTestResult ? (
                          <Alert
                            type={
                              currentTestResult.status === 'COMPLETED'
                                ? 'success'
                                : 'warning'
                            }
                            showIcon
                            message={`Natija: ${currentTestResult.scorePercent}%`}
                            description={
                              currentTestResult.status === 'COMPLETED'
                                ? 'Testdan muvaffaqiyatli o‘tdingiz. Endi keyingi bosqichni ochishingiz mumkin.'
                                : 'Test natijasi saqlandi. Istasangiz testni qaytadan ishlab ko‘rishingiz mumkin.'
                            }
                          />
                        ) : null}
                      </Space>
                    ) : (
                      <Space direction="vertical" size={18} style={{ width: '100%' }}>
                        <Tabs
                          activeKey={previewTab}
                          onChange={(activeKey) =>
                            setPreviewTab(activeKey as 'video' | 'materials')
                          }
                          className="course-content-tabs"
                          items={[
                            {
                              key: 'video',
                              disabled: !selectedLesson || selectedLesson.type !== 'VIDEO',
                              label: (
                                <span className="course-tab-label">
                                  <PlayCircleOutlined />
                                  Dars
                                </span>
                              ),
                              children: selectedLesson?.type === 'VIDEO' ? (
                                <div className="course-video-panel">
                                  <iframe
                                    className="course-video-frame"
                                    src={resolveVideoEmbedUrl(selectedLesson.externalUrl)}
                                    title={selectedLesson.title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  />
                                </div>
                              ) : (
                                <Empty
                                  description="Video ko‘rish uchun dars tanlang"
                                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                                />
                              ),
                            },
                            {
                              key: 'materials',
                              disabled: selectedMaterials.length === 0,
                              label: (
                                <span className="course-tab-label">
                                  <FileTextOutlined />
                                  Materiallar
                                </span>
                              ),
                              children: selectedMaterials.length > 0 ? (
                                <MaterialPreviewPanel
                                  materials={selectedMaterials}
                                  selectedMaterialId={selectedMaterial?.id}
                                  onSelect={(materialId) =>
                                    focusMaterial(selectedTopic.id, materialId, {
                                      triggerProgress: true,
                                    })
                                  }
                                />
                              ) : (
                                <Empty
                                  description="Bu mavzu uchun materiallar topilmadi"
                                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                                />
                              ),
                            },
                          ]}
                        />

                        {selectedMaterials.length > 0 ? (
                          <div className="course-material-helper">
                            <FileTextOutlined />
                            <span>
                              Qo‘shimcha fayllar shu mavzu ichida yordamchi material sifatida berilgan. Ularni xohlagan payt ko‘rib chiqishingiz mumkin.
                            </span>
                          </div>
                        ) : null}
                      </Space>
                    )}
                  </Card>
                </>
              ) : (
                <Card className="course-preview-card">
                  <Empty
                    description="Ko‘rish uchun mavzu ichidan bo‘lim tanlang"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                </Card>
              )}

            </div>
          </div>
        </Space>
      </Container>

      <Drawer
        open={drawerOpen}
        placement="left"
        width="min(400px, calc(100vw - 18px))"
        title="Kurs rejasi"
        onClose={() => setDrawerOpen(false)}
        styles={{ body: { padding: 0, background: '#f8fbff' } }}
      >
        {sidebarContent}
      </Drawer>
    </div>
  );
};

const LessonStateTag = ({
  state,
}: {
  state: 'available' | 'active' | 'completed' | 'failed' | 'locked';
}) => {
  if (state === 'completed') {
    return <CheckCircleFilled style={{ color: '#86efac' }} />;
  }

  if (state === 'locked') {
    return <LockOutlined style={{ color: 'rgba(255,255,255,0.55)' }} />;
  }

  if (state === 'failed') {
    return (
      <Tag color="error" style={{ margin: 0, borderRadius: 999 }}>
        Qayta
      </Tag>
    );
  }

  if (state === 'active') {
    return (
      <Tag color="processing" style={{ margin: 0, borderRadius: 999 }}>
        Hozir
      </Tag>
    );
  }

  return (
    <Tag
      style={{
        margin: 0,
        borderRadius: 999,
        background: '#f8fafc',
        color: '#475569',
        border: '1px solid rgba(148,163,184,0.16)',
      }}
    >
      Ko‘rish
    </Tag>
  );
};

const MaterialPreviewPanel = ({
  materials,
  selectedMaterialId,
  onSelect,
}: {
  materials: LearningMaterial[];
  selectedMaterialId?: string | null;
  onSelect: (materialId: string) => void;
}) => {
  const activeMaterial =
    materials.find((material) => material.id === selectedMaterialId) || materials[0];

  return (
    <div className="course-material-layout">
      <div className="course-material-list">
        {materials.map((material) => {
          const isActive = material.id === activeMaterial?.id;
          return (
            <button
              key={material.id}
              type="button"
              className={`course-material-item ${isActive ? 'is-active' : ''}`}
              onClick={() => onSelect(material.id)}
            >
              <div className="course-material-item-icon">
                <FileTextOutlined />
              </div>
              <div className="course-material-item-copy">
                <Text strong style={{ color: '#102a43' }}>
                  {material.title}
                </Text>
                <Text style={{ color: '#64748b' }} ellipsis={{ tooltip: material.fileName }}>
                  {material.fileName}
                </Text>
              </div>
            </button>
          );
        })}
      </div>

      <div className="course-material-preview">
        <div className="course-material-preview-header">
          <div>
            <Text style={{ color: '#64748b' }}>Materialni ko‘rish</Text>
            <Title level={4} style={{ margin: '4px 0 0', color: '#102a43' }}>
              {activeMaterial?.title || 'Material'}
            </Title>
          </div>
          {activeMaterial ? (
            <Button
              href={activeMaterial.url}
              target="_blank"
              rel="noopener noreferrer"
              icon={<DownloadOutlined />}
              style={{ borderRadius: 14 }}
            >
              Yuklab olish
            </Button>
          ) : null}
        </div>

        {activeMaterial ? (
          <iframe
            className="course-document-frame"
            src={activeMaterial.previewUrl}
            title={activeMaterial.title}
          />
        ) : (
          <Empty
            description="Material tanlang"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </div>
    </div>
  );
};

const normalizeLabel = (status: string) => {
  if (status === 'IN_PROGRESS') return 'Jarayonda';
  if (status === 'COMPLETED') return 'Yakunlangan';
  if (status === 'FAILED') return 'Qayta topshirish';
  if (status === 'LOCKED') return 'Yopiq';
  return 'Boshlanmagan';
};

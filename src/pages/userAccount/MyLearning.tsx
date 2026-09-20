import { type ReactNode, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Empty,
  Input,
  Progress,
  Select,
  Space,
  Spin,
  Tag,
  theme,
  Typography,
} from 'antd';
import {
  ArrowRightOutlined,
  BookOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  HistoryOutlined,
  ReadOutlined,
  RiseOutlined,
  SearchOutlined,
  SyncOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import { Card } from '../../components';
import { PATH_COURSE } from '../../constants';
import { getCourses, getMyCoursesProgress } from '../course/courseApi.ts';
import { normalizeStatus, pickCourseTitle } from '../course/courseUtils.ts';
import type { CourseProgressDto, CourseRecord } from '../course/types.ts';
import type { RootState } from '../../redux/store.ts';
import { useAppTranslation } from '../../hooks/useAppTranslation.ts';

const { Text, Title, Paragraph } = Typography;

type LearningTabKey = 'overview' | 'active' | 'history' | 'certificates';

const formatDate = (value?: string | null) => {
  if (!value) return null;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('DD.MM.YYYY') : null;
};

const activityStamp = (progress: CourseProgressDto) => {
  const source = progress.lastActivityAt || progress.startedAt;
  if (!source) return 0;
  const parsed = dayjs(source);
  return parsed.isValid() ? parsed.valueOf() : 0;
};

export const UserProfileMyLearningPage = () => {
  const {
    token: {
      colorPrimary,
      colorText,
      colorTextSecondary,
      colorTextTertiary,
      colorBgElevated,
      colorFillTertiary,
      colorBorderSecondary,
    },
  } = theme.useToken();
  const { mytheme } = useSelector((state: RootState) => state.theme);
  const { t, language } = useAppTranslation();
  const isDark = mytheme === 'dark';
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<'recent' | 'progress'>('recent');
  const [tab, setTab] = useState<LearningTabKey>('overview');
  const [myCourses, setMyCourses] = useState<CourseProgressDto[]>([]);
  const [courseCatalog, setCourseCatalog] = useState<CourseRecord[]>([]);

  useEffect(() => {
    void loadCourses();
  }, []);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const [progressPayload, coursesPayload] = await Promise.all([
        getMyCoursesProgress(),
        getCourses({ start: 0, limit: 200, searchKey: '' }),
      ]);
      setMyCourses(progressPayload.list || []);
      setCourseCatalog(coursesPayload.list || []);
    } finally {
      setLoading(false);
    }
  };

  const mergedCourses = useMemo(() => {
    const byId = new Map(courseCatalog.map((course) => [course.id, course]));
    return myCourses.map((progress) => ({
      progress,
      course: byId.get(progress.courseId),
      title:
        progress.courseTitle ||
        pickCourseTitle(byId.get(progress.courseId), language),
      instructor: progress.instructor || byId.get(progress.courseId)?.instructor || t('myLearning.instructor.default'),
      status: normalizeStatus(progress.status),
    }));
  }, [courseCatalog, language, myCourses, t]);

  const activeCourses = mergedCourses.filter(
    (item) => item.status === 'IN_PROGRESS' || item.status === 'NOT_STARTED'
  );
  const historyCourses = mergedCourses.filter(
    (item) => item.status === 'COMPLETED' || item.status === 'FAILED'
  );
  const completedCourses = mergedCourses.filter(
    (item) => item.status === 'COMPLETED'
  );

  const averageProgress = mergedCourses.length
    ? Math.round(
        mergedCourses.reduce(
          (sum, item) => sum + (item.progress.progressPercent || 0),
          0
        ) / mergedCourses.length
      )
    : 0;

  const visibleCourses = useMemo(() => {
    const source =
      tab === 'active'
        ? activeCourses
        : tab === 'history'
          ? historyCourses
          : mergedCourses;

    const normalizedSearch = search.trim().toLowerCase();
    const filtered = normalizedSearch
      ? source.filter(
          (item) =>
            item.title.toLowerCase().includes(normalizedSearch) ||
            item.instructor.toLowerCase().includes(normalizedSearch)
        )
      : source;

    return [...filtered].sort((a, b) => {
      if (sortKey === 'progress') {
        return (b.progress.progressPercent || 0) - (a.progress.progressPercent || 0);
      }

      return activityStamp(b.progress) - activityStamp(a.progress);
    });
  }, [activeCourses, historyCourses, mergedCourses, search, sortKey, tab]);

  const tabOptions: Array<{
    key: LearningTabKey;
    label: string;
    icon: ReactNode;
    helper: string;
  }> = [
    {
      key: 'overview',
      label: t('myLearning.tab.overview'),
      icon: <BookOutlined />,
      helper: t('myLearning.tab.overview'),
    },
    {
      key: 'active',
      label: t('myLearning.tab.active'),
      icon: <ClockCircleOutlined />,
      helper: t('myLearning.tab.active'),
    },
    {
      key: 'history',
      label: t('myLearning.tab.history'),
      icon: <HistoryOutlined />,
      helper: t('myLearning.tab.history'),
    },
    {
      key: 'certificates',
      label: t('myLearning.tab.certificates'),
      icon: <TrophyOutlined />,
      helper: t('myLearning.tab.certificates'),
    },
  ];

  const surfaceMuted = isDark ? 'rgba(148,163,184,0.10)' : colorFillTertiary;
  const surfaceCard = isDark ? 'rgba(255,255,255,0.04)' : colorBgElevated;

  const statItems: Array<{
    key: string;
    label: string;
    value: ReactNode;
    icon: ReactNode;
    color: string;
  }> = [
    {
      key: 'total',
      label: t('myLearning.stats.total'),
      value: mergedCourses.length,
      icon: <ReadOutlined />,
      color: '#2563eb',
    },
    {
      key: 'active',
      label: t('myLearning.stats.active'),
      value: activeCourses.length,
      icon: <SyncOutlined />,
      color: '#0ea5e9',
    },
    {
      key: 'completed',
      label: t('myLearning.stats.completed'),
      value: completedCourses.length,
      icon: <CheckCircleOutlined />,
      color: '#16a34a',
    },
    {
      key: 'progress',
      label: t('myLearning.stats.avgProgress'),
      value: `${averageProgress}%`,
      icon: <RiseOutlined />,
      color: '#7c3aed',
    },
  ];

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card
        style={{
          borderRadius: 24,
          boxShadow: 'var(--color-shadow-soft)',
        }}
        bodyStyle={{ padding: 24 }}
      >
        <Space direction="vertical" size={20} style={{ width: '100%' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <Text style={{ color: colorTextSecondary }}>{t('myLearning.sectionLabel')}</Text>
              <Title level={3} style={{ margin: '6px 0 8px', color: colorText }}>
                {t('myLearning.sectionTitle')}
              </Title>
              <Paragraph style={{ margin: 0, color: colorTextSecondary }}>
                {t('myLearning.sectionDescription')}
              </Paragraph>
            </div>
          </div>

          {!loading && mergedCourses.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 12,
              }}
            >
              {statItems.map((item) => (
                <div
                  key={item.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 16px',
                    borderRadius: 18,
                    background: surfaceCard,
                    border: `1px solid ${colorBorderSecondary}`,
                  }}
                >
                  <span
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 18,
                      color: '#fff',
                      background: item.color,
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </span>
                  <div style={{ display: 'grid' }}>
                    <Text style={{ color: colorTextSecondary, fontSize: 13 }}>
                      {item.label}
                    </Text>
                    <Text strong style={{ color: colorText, fontSize: 20, lineHeight: 1.2 }}>
                      {item.value}
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <div
            style={{
              width: '100%',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              gap: 12,
              padding: 12,
              borderRadius: 24,
              background: surfaceMuted,
              border: `1px solid ${colorBorderSecondary}`,
            }}
          >
            {tabOptions.map((item) => {
              const active = tab === item.key;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTab(item.key)}
                  style={{
                    width: '100%',
                    border: active ? `1px solid ${colorBorderSecondary}` : '1px solid transparent',
                    background: active ? surfaceCard : 'transparent',
                    borderRadius: 18,
                    padding: '16px 18px',
                    display: 'grid',
                    gap: 8,
                    textAlign: 'left',
                    cursor: 'pointer',
                    boxShadow: active ? '0 12px 24px rgba(37,99,235,0.08)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Space size={10} align="center">
                    <span
                      style={{
                        width: 36,
                        height: 36,
                        display: 'grid',
                        placeItems: 'center',
                        borderRadius: 12,
                        background: active ? surfaceMuted : surfaceCard,
                        color: active ? colorPrimary : colorTextSecondary,
                        fontSize: 16,
                        flexShrink: 0,
                      }}
                    >
                      {item.icon}
                    </span>
                    <span
                      style={{
                        fontSize: 17,
                        lineHeight: 1.2,
                        fontWeight: 700,
                        color: active ? colorText : colorTextSecondary,
                      }}
                    >
                      {item.label}
                    </span>
                  </Space>

                  <span
                    style={{
                      fontSize: 13,
                      lineHeight: 1.4,
                      color: active ? colorTextSecondary : colorTextTertiary,
                      paddingLeft: 46,
                    }}
                  >
                    {item.helper}
                  </span>
                </button>
              );
            })}
          </div>
          {tab === 'certificates' ? (
              <Card
                style={{
                  borderRadius: 20,
                  background: surfaceMuted,
                  border: `1px dashed ${colorBorderSecondary}`,
                  boxShadow: 'none',
                }}
              >
              <Empty
                description={t('myLearning.certificatesComing')}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </Card>
          ) : (
            <>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <Input
                  allowClear
                  size="large"
                  prefix={<SearchOutlined style={{ color: colorTextTertiary }} />}
                  placeholder={t('myLearning.search.courseOrTeacher')}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  style={{ maxWidth: 360 }}
                />
                <Select
                  size="large"
                  value={sortKey}
                  onChange={(value) => setSortKey(value)}
                  options={[
                    { label: t('myLearning.sort.recent'), value: 'recent' },
                    { label: t('myLearning.sort.progress'), value: 'progress' },
                  ]}
                  style={{ minWidth: 220 }}
                />
              </div>

              {loading ? (
                <div style={{ minHeight: 220, display: 'grid', placeItems: 'center' }}>
                  <Spin />
                </div>
              ) : visibleCourses.length === 0 ? (
                <Empty
                  description={t('myLearning.empty.filtered')}
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                  {visibleCourses.map(({ progress, title, instructor, status }) => {
                    const lastActivity = formatDate(progress.lastActivityAt);
                    const startedDate = formatDate(progress.startedAt);
                    const completedDate = formatDate(progress.completedAt);
                    const hasLessonCounts =
                      typeof progress.totalLessonCount === 'number' &&
                      progress.totalLessonCount > 0;

                    return (
                      <Card
                        key={progress.courseId}
                        style={{
                          borderRadius: 20,
                          border: `1px solid ${colorBorderSecondary}`,
                          boxShadow: 'none',
                        }}
                        bodyStyle={{ padding: 20 }}
                      >
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'minmax(0, 1fr) auto',
                            gap: 18,
                            alignItems: 'center',
                          }}
                        >
                          <Space direction="vertical" size={12} style={{ width: '100%' }}>
                            <Space wrap>
                              <Tag
                                color={
                                  status === 'COMPLETED'
                                    ? 'success'
                                    : status === 'FAILED'
                                      ? 'error'
                                      : 'processing'
                                }
                                style={{ borderRadius: 999 }}
                              >
                                {status === 'COMPLETED'
                                  ? t('myLearning.status.completed')
                                  : status === 'FAILED'
                                    ? t('myLearning.status.failed')
                                    : t('myLearning.status.active')}
                              </Tag>
                              <Text style={{ color: colorTextSecondary }}>
                                <ClockCircleOutlined /> {progress.progressPercent || 0}% {t('myLearning.progress.completed')}
                              </Text>
                              {hasLessonCounts ? (
                                <Text style={{ color: colorTextSecondary }}>
                                  <BookOutlined /> {progress.completedLessonCount || 0}/
                                  {progress.totalLessonCount} {t('myLearning.card.lessons')}
                                </Text>
                              ) : null}
                            </Space>

                            <div>
                              <Title level={4} style={{ margin: 0, color: colorText }}>
                                {title}
                              </Title>
                              <Text style={{ color: colorTextSecondary }}>{t('courses.card.instructor')} {instructor}</Text>
                            </div>

                            <Progress percent={progress.progressPercent || 0} strokeColor={colorPrimary} />

                            <Space wrap size={16}>
                              {startedDate ? (
                                <Text style={{ color: colorTextTertiary, fontSize: 13 }}>
                                  <CalendarOutlined /> {t('myLearning.card.startedAt')} {startedDate}
                                </Text>
                              ) : null}
                              {status === 'COMPLETED' && completedDate ? (
                                <Text style={{ color: colorTextTertiary, fontSize: 13 }}>
                                  <CheckCircleOutlined /> {t('myLearning.card.completedAt')} {completedDate}
                                </Text>
                              ) : lastActivity ? (
                                <Text style={{ color: colorTextTertiary, fontSize: 13 }}>
                                  <HistoryOutlined /> {t('myLearning.card.lastActivity')} {lastActivity}
                                </Text>
                              ) : null}
                            </Space>
                          </Space>

                          <Link to={PATH_COURSE.details(progress.courseId)}>
                            <Button
                              type="primary"
                              size="large"
                              icon={<ArrowRightOutlined />}
                              style={{ height: 46, borderRadius: 14 }}
                            >
                              {status === 'COMPLETED' ? t('myLearning.card.view') : t('myLearning.card.continue')}
                            </Button>
                          </Link>
                        </div>
                      </Card>
                    );
                  })}
                </Space>
              )}
            </>
          )}
        </Space>
      </Card>
    </Space>
  );
};

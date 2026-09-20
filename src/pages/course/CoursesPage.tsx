import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Button,
  Card,
  Empty,
  Input,
  message,
  Pagination,
  Select,
  Space,
  Spin,
  theme,
  Typography,
} from 'antd';
import {
  BookOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  LockOutlined,
  LoginOutlined,
  PlayCircleOutlined,
  ProfileOutlined,
  ReadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Container } from '../../components';
import { PATH_AUTH, PATH_COURSE } from '../../constants';
import {
  getCourses,
  getMyEffectiveCourseAccess,
  isAuthenticated,
} from './courseApi.ts';
import { buildCourseCatalogItems } from './courseUtils.ts';
import type {
  CourseCatalogItem,
  CourseRecord,
  MyEffectiveCourseAccessResponse,
} from './types.ts';
import './styles.css';
import { TbCaretRightFilled } from 'react-icons/tb';
import { useAppTranslation } from '../../hooks/useAppTranslation.ts';

const { Title, Paragraph, Text } = Typography;

const PAGE_SIZE = 8;

type SortValue = 'popular' | 'alphabetical';

export const CoursesPage = () => {
  const {
    token: { colorText, colorTextSecondary },
  } = theme.useToken();
  const navigate = useNavigate();
  const { t, language } = useAppTranslation();
  const [messageApi, contextHolder] = message.useMessage();
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [accessLoading, setAccessLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortValue>('popular');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCourses, setTotalCourses] = useState(0);
  const [effectiveAccess, setEffectiveAccess] =
    useState<MyEffectiveCourseAccessResponse | null>(null);
  const searchInitialized = useRef(false);

  const isAccessDeniedError = (error: unknown) =>
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    ((error as { response?: { status?: number } }).response?.status === 403 ||
      (error as { response?: { status?: number } }).response?.status === 404 ||
      (error as { response?: { status?: number } }).response?.status === 401);

  const fetchCatalogPage = async (page = 1, query = '') => {
    setPageLoading(true);
    try {
      const response = await getCourses({
        start: (page - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
        searchKey: query,
      });
      setCourses(response.list || []);
      setTotalCourses(response.count || 0);
      setCurrentPage(page);
    } catch (error) {
      if (isAccessDeniedError(error)) {
        setCourses([]);
        setTotalCourses(0);
        messageApi.error(t('courses.msg.loadDenied'));
        return;
      }
      messageApi.error(t('courses.msg.loadError'));
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const bootstrapCatalog = async () => {
      setLoading(true);
      try {
        const coursePage = await getCourses({
          start: 0,
          limit: PAGE_SIZE,
          searchKey: searchTerm.trim(),
        });

        if (!isMounted) return;

        setCourses(coursePage.list || []);
        setTotalCourses(coursePage.count || 0);
        setCurrentPage(1);
      } catch (error) {
        if (!isMounted) return;
        if (isAccessDeniedError(error)) {
          setCourses([]);
          setTotalCourses(0);
          messageApi.error(t('courses.msg.loadDenied'));
          return;
        }
        messageApi.error(t('courses.msg.bootstrapError'));
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    bootstrapCatalog();

    return () => {
      isMounted = false;
    };
  // Refetch when language changes so backend returns localized titles/descriptions
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  useEffect(() => {
    let isMounted = true;

    const bootstrapEffectiveAccess = async () => {
      if (!isAuthenticated()) {
        if (isMounted) {
          setEffectiveAccess(null);
          setAccessLoading(false);
        }
        return;
      }

      setAccessLoading(true);
      try {
        const payload = await getMyEffectiveCourseAccess();
        if (!isMounted) return;
        setEffectiveAccess(payload);
      } catch {
        if (!isMounted) return;
        setEffectiveAccess(null);
        messageApi.error(t('courses.msg.accessError'));
      } finally {
        if (isMounted) {
          setAccessLoading(false);
        }
      }
    };

    bootstrapEffectiveAccess();

    return () => {
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageApi]);

  useEffect(() => {
    if (!searchInitialized.current) {
      searchInitialized.current = true;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      fetchCatalogPage(1, searchTerm.trim());
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [searchTerm]);

  const catalogItems = useMemo(() => {
    const normalized = buildCourseCatalogItems(courses, [], [], [], language);

    if (sortBy === 'alphabetical') {
      return [...normalized].sort((a, b) => a.title.localeCompare(b.title));
    }

    return [...normalized].sort(
      (a, b) =>
        b.metrics.lessonCount +
        b.metrics.moduleCount -
        (a.metrics.lessonCount + a.metrics.moduleCount)
    );
  }, [courses, language, sortBy]);

  const accessibleCourseIds = useMemo(
    () =>
      new Set(
        (effectiveAccess?.effectiveCourses || []).map((course) => course.courseId)
      ),
    [effectiveAccess]
  );

  const handleOpenCourse = (courseId: string) => {
    if (!isAuthenticated()) {
      navigate(PATH_AUTH.signin, {
        state: { from: PATH_COURSE.details(courseId) },
      });
      return;
    }

    if (!accessibleCourseIds.has(courseId)) {
      messageApi.warning(t('courses.msg.noAccess'));
      return;
    }

    navigate(PATH_COURSE.details(courseId));
  };

  return (
    <div className="course-catalog-page">
      {contextHolder}
      <Helmet>
        <title>{t('courses.page.title')}</title>
      </Helmet>

      <Container style={{ padding: '36px 20px 72px' }}>
        <Space direction="vertical" size={20} style={{ width: '100%' }}>
          <div className="course-catalog-header">
            <div className="course-catalog-header-copy">
              <Title level={2} style={{ margin: '0 0 8px', color: colorText }}>
                {t('courses.toolbar.title')}
              </Title>
              <Paragraph style={{ margin: 0, color: colorTextSecondary, maxWidth: 640 }}>
                {t('courses.toolbar.subtitle')}
              </Paragraph>
            </div>

            <div className="course-catalog-header-controls">
              <Input
                allowClear
                size="large"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={t('courses.toolbar.searchPlaceholder')}
                prefix={<SearchOutlined />}
              />
              <Select
                size="large"
                value={sortBy}
                onChange={setSortBy}
                options={[
                  { label: t('courses.toolbar.sort.recommended'), value: 'popular' },
                  { label: t('courses.toolbar.sort.alphabetical'), value: 'alphabetical' },
                ]}
              />
            </div>
          </div>

          {loading ? (
            <Card className="course-preview-card">
              <div style={{ minHeight: 320, display: 'grid', placeItems: 'center' }}>
                <Spin size="large" />
              </div>
            </Card>
          ) : pageLoading ? (
            <Card className="course-preview-card">
              <div style={{ minHeight: 220, display: 'grid', placeItems: 'center' }}>
                <Spin />
              </div>
            </Card>
          ) : catalogItems.length === 0 ? (
            <Card className="course-preview-card">
              <Empty
                description={t('courses.empty.noResults')}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </Card>
          ) : (
            <>
              <div className="course-catalog-list">
                {catalogItems.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onOpenCourse={handleOpenCourse}
                    isGuest={!isAuthenticated()}
                    hasAccess={accessibleCourseIds.has(course.id)}
                    accessLoading={accessLoading}
                  />
                ))}
              </div>

              <div className="course-catalog-pagination">
                <Pagination
                  current={currentPage}
                  pageSize={PAGE_SIZE}
                  total={totalCourses}
                  onChange={(page) => fetchCatalogPage(page, searchTerm.trim())}
                  showSizeChanger={false}
                />
              </div>
            </>
          )}
        </Space>
      </Container>
    </div>
  );
};

const HERO_VARIANT_COUNT = 5;

const heroVariantOf = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % HERO_VARIANT_COUNT;
};

const initialsOf = (title: string) => {
  const words = title
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (words.length === 0) return 'K';
  return words.map((word) => word[0]?.toUpperCase() || '').join('');
};

const CourseCard = ({
  course,
  onOpenCourse,
  isGuest,
  hasAccess,
  accessLoading,
}: {
  course: CourseCatalogItem;
  onOpenCourse: (courseId: string) => void;
  isGuest: boolean;
  hasAccess: boolean;
  accessLoading: boolean;
}) => {
  const {
    token: { colorText, colorTextSecondary },
  } = theme.useToken();
  const { t } = useAppTranslation();

  const hasKnownStructure =
    course.metrics.moduleCount +
      course.metrics.videoCount +
      course.metrics.materialCount +
      course.metrics.testCount >
    0;

  // Tavsif sarlavhaning aynan o'zi bo'lsa, umumiy tavsif ko'rsatiladi
  const descriptionText =
    course.description.trim() &&
    course.description.trim().toLowerCase() !== course.title.trim().toLowerCase()
      ? course.description
      : t('courses.fallback.description');

  const ctaLabel = isGuest
    ? t('courses.card.cta.signin')
    : hasAccess
      ? t('courses.card.cta.start')
      : t('courses.card.cta.noAccess');

  const ctaIcon = isGuest ? <LoginOutlined /> : hasAccess ? <TbCaretRightFilled /> : <LockOutlined />;

  const metricItems: Array<{ icon: ReactNode; value: number; label: string }> = [
    {
      icon: <FolderOpenOutlined />,
      value: course.metrics.moduleCount,
      label: t('courses.metrics.module'),
    },
    {
      icon: <PlayCircleOutlined />,
      value: course.metrics.videoCount,
      label: t('courses.metrics.video'),
    },
    {
      icon: <FileTextOutlined />,
      value: course.metrics.materialCount,
      label: t('courses.metrics.material'),
    },
    {
      icon: <ReadOutlined />,
      value: course.metrics.testCount,
      label: t('courses.metrics.test'),
    },
  ].filter((item) => item.value > 0);

  return (
    <Card
      hoverable
      className="course-preview-card course-catalog-card"
      bodyStyle={{ padding: 0, height: '100%' }}
      onClick={() => onOpenCourse(course.id)}
    >
      <div className={`course-card-hero course-card-hero--v${heroVariantOf(course.id)}`}>
        <div className="course-card-hero-initials">{initialsOf(course.title)}</div>
        <div className="course-card-hero-icon">
          <BookOutlined />
        </div>
        {!isGuest && (
          <div className={`course-card-access-badge ${hasAccess ? 'is-granted' : 'is-locked'}`}>
            {hasAccess ? t('courses.card.badge.open') : t('courses.card.badge.locked')}
          </div>
        )}
      </div>
      <div className="course-catalog-card-body">
        <div className="course-catalog-card-head">
          <Space direction="vertical" size={6} style={{ width: '100%' }}>
            <Title
              level={4}
              style={{ margin: 0, color: colorText }}
              ellipsis={{ rows: 2, tooltip: course.title }}
            >
              {course.title}
            </Title>
            <Text style={{ color: colorTextSecondary, fontSize: 13 }}>
              <ProfileOutlined /> {t('courses.card.instructor')} {course.instructor}
            </Text>
          </Space>
        </div>

        <div className="course-catalog-card-content">
          <Paragraph
            ellipsis={{ rows: 2 }}
            className="course-catalog-card-description"
            style={{ color: colorTextSecondary, marginBottom: 14 }}
          >
            {descriptionText}
          </Paragraph>

          {hasKnownStructure ? (
            <div className="course-catalog-card-metrics">
              {metricItems.map((item) => (
                <div className="course-metric-chip" key={item.label}>
                  <span className="course-metric-chip-icon">{item.icon}</span>
                  <span className="course-metric-chip-value">{item.value}</span>
                  <span className="course-metric-chip-label">{item.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="course-catalog-card-note">
              <Text style={{ color: colorTextSecondary, fontSize: 13 }}>
                {t('courses.card.lessonsHidden')}
              </Text>
            </div>
          )}

          <div className="course-catalog-card-footer">
            <Button
              type={hasAccess || isGuest ? 'primary' : 'default'}
              block
              size="large"
              icon={ctaIcon}
              style={{ height: 46, borderRadius: 14 }}
              onClick={(event) => {
                event.stopPropagation();
                onOpenCourse(course.id);
              }}
              loading={accessLoading && !isGuest}
            >
              {ctaLabel}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

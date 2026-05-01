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
  Tag,
  Typography,
} from 'antd';
import {
  BookOutlined,
  FolderOpenOutlined,
  PlayCircleOutlined,
  ProfileOutlined,
  ReadOutlined,
  RightOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Container } from '../../components';
import { PATH_AUTH } from '../../constants';
import { getCourses, isAuthenticated } from './courseApi.ts';
import { buildCourseCatalogItems } from './courseUtils.ts';
import type { CourseCatalogItem, CourseRecord } from './types.ts';
import './styles.css';

const { Title, Paragraph, Text } = Typography;

const PAGE_SIZE = 8;

type SortValue = 'popular' | 'alphabetical';

export const CoursesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [messageApi, contextHolder] = message.useMessage();
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortValue>('popular');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCourses, setTotalCourses] = useState(0);
  const searchInitialized = useRef(false);

  const isAccessDeniedError = (error: unknown) =>
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    ((error as { response?: { status?: number } }).response?.status === 403 ||
      (error as { response?: { status?: number } }).response?.status === 404);

  const fetchCatalogPage = async (page = 1, query = '') => {
    if (!isAuthenticated()) return;
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
        messageApi.error("Kurslar katalogini ko‘rish uchun avval tizimga kiring.");
        navigate(PATH_AUTH.signin, { replace: true });
        return;
      }
      messageApi.error('Kurslarni yuklashda xatolik yuz berdi.');
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const bootstrapCatalog = async () => {
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
        const coursePage = await getCourses({
          start: 0,
          limit: PAGE_SIZE,
          searchKey: '',
        });

        if (!isMounted) return;

        setCourses(coursePage.list || []);
        setTotalCourses(coursePage.count || 0);
      } catch (error) {
        if (!isMounted) return;
        if (isAccessDeniedError(error)) {
          messageApi.error("Kurslar katalogini ko‘rish uchun avval tizimga kiring.");
          navigate(PATH_AUTH.signin, { replace: true });
          return;
        }
        messageApi.error('Kurslar katalogini tayyorlashda xatolik yuz berdi.');
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
  }, [location.pathname, location.search, navigate]);

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
    const normalized = buildCourseCatalogItems(courses, [], [], []);

    if (sortBy === 'alphabetical') {
      return [...normalized].sort((a, b) => a.title.localeCompare(b.title));
    }

    return [...normalized].sort(
      (a, b) =>
        b.metrics.lessonCount +
        b.metrics.moduleCount -
        (a.metrics.lessonCount + a.metrics.moduleCount)
    );
  }, [courses, sortBy]);

  return (
    <div className="course-catalog-page">
      {contextHolder}
      <Helmet>
        <title>Kurslar | IBMS</title>
      </Helmet>

      <Container style={{ padding: '36px 20px 72px' }}>
        <Space direction="vertical" size={20} style={{ width: '100%' }}>
          <Card className="course-catalog-toolbar-card" bodyStyle={{ padding: 24 }}>
            <div className="course-catalog-toolbar">
              <div className="course-catalog-toolbar-copy">
                <Tag className="course-catalog-toolbar-tag">Kurslar</Tag>
                <Title level={2} style={{ margin: '14px 0 10px', color: '#102a43' }}>
                  O‘zingizga mos kursni tanlang
                </Title>
                <Paragraph style={{ margin: 0, color: '#52606d', maxWidth: 680 }}>
                  Kurslar sodda tartibda joylashtirilgan: kursni tanlaysiz, keyin
                  mavzular bo‘yicha video, material va testlarni bosqichma-bosqich
                  o‘tasiz.
                </Paragraph>
              </div>

              <div className="course-catalog-toolbar-actions">
                <Input
                  allowClear
                  size="large"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Kurs nomi bo‘yicha qidiring"
                  prefix={<SearchOutlined />}
                />
                <Select
                  size="large"
                  value={sortBy}
                  onChange={setSortBy}
                  options={[
                    { label: 'Tavsiya etilgan', value: 'popular' },
                    { label: 'Alifbo bo‘yicha', value: 'alphabetical' },
                  ]}
                />
              </div>
            </div>
          </Card>

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
                description="Qidiruv bo‘yicha kurs topilmadi"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </Card>
          ) : (
            <>
              <div className="course-catalog-list">
                {catalogItems.map((course) => (
                  <CourseCard key={course.id} course={course} />
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

const CourseCard = ({ course }: { course: CourseCatalogItem }) => {
  const hasKnownStructure =
    course.metrics.moduleCount +
      course.metrics.videoCount +
      course.metrics.materialCount +
      course.metrics.testCount >
    0;

  return (
    <Card
      hoverable
      className="course-preview-card course-catalog-card"
      bodyStyle={{ padding: 0, height: '100%' }}
    >
      <div className="course-catalog-card-body">
        <div className="course-catalog-card-head">
          <div className="course-catalog-card-icon">
            <BookOutlined />
          </div>
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Space wrap size={8}>
              <Tag className="course-catalog-card-tag">Kurs</Tag>
              {hasKnownStructure ? (
                <Tag className="course-catalog-card-tag">
                  {course.metrics.moduleCount} modul
                </Tag>
              ) : null}
            </Space>
            <Title level={4} style={{ margin: 0, color: '#102a43' }}>
              {course.title}
            </Title>
            <Text style={{ color: '#64748b' }}>
              <ProfileOutlined /> O‘qituvchi: {course.instructor}
            </Text>
          </Space>
        </div>

        <div className="course-catalog-card-content">
          <Paragraph
            ellipsis={{ rows: 3 }}
            className="course-catalog-card-description"
            style={{ color: '#52606d', marginBottom: 18 }}
          >
            {course.description}
          </Paragraph>

          <div className="course-catalog-card-metrics">
            <MetricChip icon={<FolderOpenOutlined />} label={`${course.metrics.moduleCount} modul`} />
            <MetricChip icon={<PlayCircleOutlined />} label={`${course.metrics.videoCount} video`} />
            <MetricChip icon={<ProfileOutlined />} label={`${course.metrics.materialCount} material`} />
            <MetricChip icon={<ReadOutlined />} label={`${course.metrics.testCount} test`} />
          </div>

          <div className="course-catalog-card-note">
            <Text style={{ color: '#52606d' }}>
              {hasKnownStructure
                ? 'Kurs ichidagi darslar bosqichma-bosqich ochiladi.'
                : 'Kurs tarkibi ochilganda ko‘rinadi.'}
            </Text>
          </div>

          <div className="course-catalog-card-footer">
            <Link to={`/course/${course.id}`}>
              <Button
                type="primary"
                block
                size="large"
                icon={<RightOutlined />}
                style={{ height: 48, borderRadius: 16 }}
              >
                Kursga kirish
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
};

const MetricChip = ({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) => (
  <div className="course-metric-chip">
    <span className="course-metric-chip-icon">{icon}</span>
    <Text style={{ color: '#102a43' }}>{label}</Text>
  </div>
);

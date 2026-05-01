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
  Typography,
} from 'antd';
import {
  ArrowRightOutlined,
  BookOutlined,
  ClockCircleOutlined,
  HistoryOutlined,
  SearchOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { Card } from '../../components';
import { PATH_COURSE } from '../../constants';
import { getCourses, getMyCoursesProgress } from '../course/courseApi.ts';
import { normalizeStatus, pickCourseTitle } from '../course/courseUtils.ts';
import type { CourseProgressDto, CourseRecord } from '../course/types.ts';

const { Text, Title, Paragraph } = Typography;

type LearningTabKey = 'overview' | 'active' | 'history' | 'certificates';

export const UserProfileMyLearningPage = () => {
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
      title: progress.courseTitle || pickCourseTitle(byId.get(progress.courseId)),
      instructor: progress.instructor || byId.get(progress.courseId)?.instructor || 'IBMS mutaxassisi',
      status: normalizeStatus(progress.status),
    }));
  }, [courseCatalog, myCourses]);

  const activeCourses = mergedCourses.filter(
    (item) => item.status === 'IN_PROGRESS' || item.status === 'NOT_STARTED'
  );
  const historyCourses = mergedCourses.filter(
    (item) => item.status === 'COMPLETED' || item.status === 'FAILED'
  );

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

      return Number(Boolean(b.progress.startedAt)) - Number(Boolean(a.progress.startedAt));
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
      label: 'Umumiy',
      icon: <BookOutlined />,
      helper: 'Barcha kurslar',
    },
    {
      key: 'active',
      label: 'Faol o‘qish',
      icon: <ClockCircleOutlined />,
      helper: 'Davom etayotganlar',
    },
    {
      key: 'history',
      label: 'Tarix',
      icon: <HistoryOutlined />,
      helper: 'Yakunlanganlar',
    },
    {
      key: 'certificates',
      label: 'Sertifikatlar',
      icon: <TrophyOutlined />,
      helper: 'Keyingi bosqich',
    },
  ];

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card
        style={{
          borderRadius: 24,
          boxShadow: '0 18px 42px rgba(15,23,42,0.05)',
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
              <Text style={{ color: '#64748b' }}>Mening kurslarim</Text>
              <Title level={3} style={{ margin: '6px 0 8px', color: '#102a43' }}>
                O‘qish markazi
              </Title>
              <Paragraph style={{ margin: 0, color: '#52606d' }}>
                Boshlangan kurslaringiz, tugallangan o‘qishlaringiz va keyingi davom ettirish bosqichlari shu yerda jamlangan.
              </Paragraph>
            </div>
          </div>

          <div
            style={{
              width: '100%',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              gap: 12,
              padding: 12,
              borderRadius: 24,
              background: 'linear-gradient(180deg, #f8fbff 0%, #f1f6ff 100%)',
              border: '1px solid rgba(148,163,184,0.14)',
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
                    border: active ? '1px solid rgba(37,99,235,0.18)' : '1px solid transparent',
                    background: active ? '#ffffff' : 'rgba(255,255,255,0.6)',
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
                        background: active ? 'rgba(37,99,235,0.12)' : '#eef2ff',
                        color: active ? '#2563eb' : '#64748b',
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
                        color: active ? '#102a43' : '#334e68',
                      }}
                    >
                      {item.label}
                    </span>
                  </Space>

                  <span
                    style={{
                      fontSize: 13,
                      lineHeight: 1.4,
                      color: active ? '#52606d' : '#829ab1',
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
                background: '#f8fbff',
                border: '1px dashed rgba(148,163,184,0.26)',
                boxShadow: 'none',
              }}
            >
              <Empty
                description="Sertifikatlar bo‘limi keyingi bosqichda qo‘shiladi"
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
                  prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                  placeholder="Kurs yoki o‘qituvchi bo‘yicha qidiring"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  style={{ maxWidth: 360 }}
                />
                <Select
                  size="large"
                  value={sortKey}
                  onChange={(value) => setSortKey(value)}
                  options={[
                    { label: 'So‘nggi faoliyat bo‘yicha', value: 'recent' },
                    { label: 'Progress bo‘yicha', value: 'progress' },
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
                  description="Tanlangan bo‘lim uchun kurslar topilmadi"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                  {visibleCourses.map(({ progress, title, instructor, status }) => (
                    <Card
                      key={progress.courseId}
                      style={{
                        borderRadius: 20,
                        border: '1px solid rgba(148,163,184,0.14)',
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
                                ? 'Yakunlangan'
                                : status === 'FAILED'
                                  ? 'Yakunlanmagan'
                                  : 'Faol o‘qish'}
                            </Tag>
                            <Text style={{ color: '#64748b' }}>
                              <ClockCircleOutlined /> {progress.progressPercent || 0}% bajarilgan
                            </Text>
                          </Space>

                          <div>
                            <Title level={4} style={{ margin: 0, color: '#102a43' }}>
                              {title}
                            </Title>
                            <Text style={{ color: '#64748b' }}>O‘qituvchi: {instructor}</Text>
                          </div>

                          <Progress percent={progress.progressPercent || 0} strokeColor="#2563eb" />
                        </Space>

                        <Link to={PATH_COURSE.details(progress.courseId)}>
                          <Button
                            type="primary"
                            size="large"
                            icon={<ArrowRightOutlined />}
                            style={{ height: 46, borderRadius: 14 }}
                          >
                            {status === 'COMPLETED' ? 'Ko‘rish' : 'Davom ettirish'}
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  ))}
                </Space>
              )}
            </>
          )}
        </Space>
      </Card>
    </Space>
  );
};

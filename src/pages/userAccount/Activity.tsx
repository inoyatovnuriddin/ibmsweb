import { useEffect, useMemo, useState } from 'react';
import { Empty, Progress, Space, Spin, Tag, Timeline, theme, Typography } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  PlayCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { Card } from '../../components';
import { getMyCoursesProgress } from '../course/courseApi.ts';
import type { CourseProgressDto } from '../course/types.ts';

const { Text, Title } = Typography;

const formatDate = (value?: string | null) =>
  value && dayjs(value).isValid() ? dayjs(value).format('DD.MM.YYYY HH:mm') : '—';

const statusMeta = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return { color: 'green', label: 'Tugallangan', icon: <CheckCircleOutlined /> };
    case 'FAILED':
      return { color: 'red', label: 'Muvaffaqiyatsiz', icon: <CloseCircleOutlined /> };
    case 'IN_PROGRESS':
      return { color: 'blue', label: 'Jarayonda', icon: <PlayCircleOutlined /> };
    default:
      return { color: 'default', label: 'Boshlanmagan', icon: <ClockCircleOutlined /> };
  }
};

export const UserProfileActivityPage = () => {
  const {
    token: { colorText, colorTextSecondary },
  } = theme.useToken();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<CourseProgressDto[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await getMyCoursesProgress();
        setCourses(res.list || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Build a reverse-chronological activity feed from the user's course events.
  const timeline = useMemo(() => {
    const events: Array<{ at: string; node: React.ReactNode }> = [];
    courses.forEach((c) => {
      const title = c.courseTitle || 'Kurs';
      if (c.startedAt) {
        events.push({
          at: c.startedAt,
          node: (
            <>
              <Text strong style={{ color: colorText }}>{title}</Text> kursini boshladingiz
            </>
          ),
        });
      }
      if (c.completedAt) {
        events.push({
          at: c.completedAt,
          node: (
            <>
              <Text strong style={{ color: colorText }}>{title}</Text> kursini yakunladingiz 🎉
            </>
          ),
        });
      }
    });
    return events.sort((a, b) => dayjs(b.at).valueOf() - dayjs(a.at).valueOf());
  }, [courses, colorText]);

  if (loading) {
    return (
      <Card style={{ borderRadius: 24 }} bodyStyle={{ minHeight: 240, display: 'grid', placeItems: 'center' }}>
        <Spin />
      </Card>
    );
  }

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Card style={{ borderRadius: 24, boxShadow: 'var(--color-shadow-soft)' }} bodyStyle={{ padding: 24 }}>
        <Space align="center" size={12} style={{ marginBottom: 4 }}>
          <ThunderboltOutlined style={{ fontSize: 20, color: '#2563eb' }} />
          <Title level={4} style={{ margin: 0, color: colorText }}>
            Oʻquv faoliyati
          </Title>
        </Space>
        <Text style={{ color: colorTextSecondary }}>
          Kurslaringiz boʻyicha holat va progress.
        </Text>

        {courses.length === 0 ? (
          <Empty style={{ marginTop: 24 }} description="Hozircha faoliyat yoʻq" />
        ) : (
          <div
            style={{
              marginTop: 20,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 12,
            }}
          >
            {courses.map((c) => {
              const meta = statusMeta(c.status);
              return (
                <div
                  key={c.courseId}
                  style={{
                    padding: 16,
                    borderRadius: 16,
                    border: '1px solid rgba(148,163,184,0.2)',
                  }}
                >
                  <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                    <Text strong style={{ color: colorText }}>
                      {c.courseTitle || 'Kurs'}
                    </Text>
                    <Tag color={meta.color} icon={meta.icon} style={{ borderRadius: 999, margin: 0 }}>
                      {meta.label}
                    </Tag>
                  </Space>
                  <Progress
                    percent={c.progressPercent || 0}
                    size="small"
                    strokeColor={c.status === 'COMPLETED' ? '#16a34a' : '#2563eb'}
                    style={{ marginTop: 8 }}
                  />
                  <Space size={16} wrap style={{ marginTop: 4 }}>
                    <Text style={{ color: colorTextSecondary, fontSize: 12 }}>
                      Oxirgi faollik: {formatDate(c.lastActivityAt)}
                    </Text>
                    {typeof c.completedLessonCount === 'number' &&
                    typeof c.totalLessonCount === 'number' ? (
                      <Text style={{ color: colorTextSecondary, fontSize: 12 }}>
                        Darslar: {c.completedLessonCount}/{c.totalLessonCount}
                      </Text>
                    ) : null}
                  </Space>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {timeline.length > 0 ? (
        <Card style={{ borderRadius: 24, boxShadow: 'var(--color-shadow-soft)' }} bodyStyle={{ padding: 24 }}>
          <Title level={5} style={{ margin: '0 0 16px', color: colorText }}>
            Soʻnggi harakatlar
          </Title>
          <Timeline
            items={timeline.map((e) => ({
              children: (
                <Space direction="vertical" size={0}>
                  <span>{e.node}</span>
                  <Text style={{ color: colorTextSecondary, fontSize: 12 }}>{formatDate(e.at)}</Text>
                </Space>
              ),
            }))}
          />
        </Card>
      ) : null}
    </Space>
  );
};

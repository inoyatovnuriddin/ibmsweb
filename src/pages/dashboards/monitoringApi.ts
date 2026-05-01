import { apiClient } from '../../services/api.ts';
import type { Response } from '../../types/response.ts';

export type MonitoringStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FAILED'
  | 'LOCKED';

export interface MonitoringRowDto {
  id: string;
  userId: string;
  userFullName: string;
  email: string;
  phoneNumber: string;
  courseId: string;
  courseTitle: string;
  status: MonitoringStatus;
  progressPercent: number;
  currentModuleTitle: string;
  currentLessonTitle: string;
  completedLessonCount: number;
  totalLessonCount: number;
  solvedTestCount: number;
  totalTestCount: number;
  averageScore?: number;
  lastScore?: number;
  startedAt?: string;
  lastActivityAt?: string;
  completedAt?: string;
}

export interface MonitoringListPayload {
  list: MonitoringRowDto[];
  total: number;
}

const normalizeStatus = (value?: unknown): MonitoringStatus => {
  const normalized = String(value ?? '')
    .trim()
    .toUpperCase();

  if (
    normalized === 'NOT_STARTED' ||
    normalized === 'IN_PROGRESS' ||
    normalized === 'COMPLETED' ||
    normalized === 'FAILED' ||
    normalized === 'LOCKED'
  ) {
    return normalized;
  }

  return 'NOT_STARTED';
};

const pickString = (...values: unknown[]) => {
  const found = values.find(
    (value) => typeof value === 'string' && value.trim().length > 0
  );
  return typeof found === 'string' ? found.trim() : '';
};

const pickNumber = (...values: unknown[]) => {
  const found = values.find(
    (value) => typeof value === 'number' && Number.isFinite(value)
  );
  return typeof found === 'number' ? found : 0;
};

const normalizeMonitoringRow = (
  raw: Record<string, any>,
  index: number
): MonitoringRowDto => {
  const user = raw.user || raw.account || {};
  const course = raw.course || {};
  const firstName = pickString(user.firstname, user.firstName, raw.firstname, raw.firstName);
  const lastName = pickString(user.lastname, user.lastName, raw.lastname, raw.lastName);
  const fullName = pickString(
    raw.userFullName,
    raw.fullName,
    `${firstName} ${lastName}`.trim(),
    raw.email,
    `O‘quvchi ${index + 1}`
  );

  return {
    id: String(raw.id ?? `${raw.userId ?? user.id ?? index}-${raw.courseId ?? course.id ?? index}`),
    userId: String(raw.userId ?? user.id ?? ''),
    userFullName: fullName,
    email: pickString(raw.email, user.email),
    phoneNumber: pickString(raw.phoneNumber, user.phoneNumber, user.phone),
    courseId: String(raw.courseId ?? course.id ?? ''),
    courseTitle: pickString(raw.courseTitle, course.title, course.titleuz, course.titleru, 'Kurs'),
    status: normalizeStatus(raw.status),
    progressPercent: Math.max(
      0,
      Math.min(100, pickNumber(raw.progressPercent, raw.percentage, raw.progress))
    ),
    currentModuleTitle: pickString(raw.currentModuleTitle, raw.moduleTitle, '-'),
    currentLessonTitle: pickString(raw.currentLessonTitle, raw.lessonTitle, '-'),
    completedLessonCount: pickNumber(raw.completedLessonCount, raw.completedLessons),
    totalLessonCount: pickNumber(raw.totalLessonCount, raw.lessonCount),
    solvedTestCount: pickNumber(raw.solvedTestCount, raw.completedTestCount),
    totalTestCount: pickNumber(raw.totalTestCount, raw.testCount),
    averageScore:
      typeof raw.averageScore === 'number' ? raw.averageScore : raw.avgScore,
    lastScore: typeof raw.lastScore === 'number' ? raw.lastScore : raw.score,
    startedAt: raw.startedAt,
    lastActivityAt: raw.lastActivityAt ?? raw.updatedAt,
    completedAt: raw.completedAt,
  };
};

export const getMonitoring = async (params: {
  start?: number;
  limit?: number;
  searchKey?: string;
  status?: string;
}) => {
  const response = await apiClient.get<Response<any>>('/v1/lms/progress/admin/monitoring', {
    params,
  });

  const payload = response.data?.payload ?? {};
  const list = Array.isArray(payload.list)
    ? payload.list
    : Array.isArray(payload.content)
      ? payload.content
      : Array.isArray(payload)
        ? payload
        : [];

  return {
    list: list.map((item: Record<string, any>, index: number) =>
      normalizeMonitoringRow(item, index)
    ),
    total: pickNumber(payload.total, payload.totalElements, list.length),
  } satisfies MonitoringListPayload;
};


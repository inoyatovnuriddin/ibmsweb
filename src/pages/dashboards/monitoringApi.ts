import { apiClient } from '../../services/api.ts';
import type { Response } from '../../types/response.ts';

export type MonitoringStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FAILED'
  | 'LOCKED';

export type MonitoringLessonType = 'VIDEO' | 'DOCUMENT' | 'TEST';

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

export interface MonitoringSummaryDto {
  total: number;
  notStartedCount: number;
  inProgressCount: number;
  completedCount: number;
  failedCount: number;
  averageProgress: number;
}

export interface MonitoringListPayload {
  list: MonitoringRowDto[];
  total: number;
  summary: MonitoringSummaryDto;
}

export interface MonitoringLessonDetailDto {
  lessonItemId: string;
  title: string;
  type: MonitoringLessonType;
  status: MonitoringStatus;
  score?: number | null;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface MonitoringModuleDetailDto {
  moduleId: string;
  title: string;
  status: MonitoringStatus;
  progressPercent: number;
  lessons: MonitoringLessonDetailDto[];
}

export interface MonitoringDetailDto {
  userId: string;
  userFullName: string;
  email: string;
  phoneNumber: string;
  courseId: string;
  courseTitle: string;
  status: MonitoringStatus;
  progressPercent: number;
  averageScore?: number | null;
  startedAt?: string | null;
  lastActivityAt?: string | null;
  completedAt?: string | null;
  modules: MonitoringModuleDetailDto[];
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

const normalizeLessonType = (value?: unknown): MonitoringLessonType => {
  const normalized = String(value ?? '')
    .trim()
    .toUpperCase();

  if (normalized === 'DOCUMENT' || normalized === 'TEST') {
    return normalized;
  }

  return 'VIDEO';
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

const normalizeSummary = (
  raw: Record<string, any> | undefined,
  rows: MonitoringRowDto[],
  total: number
): MonitoringSummaryDto => {
  if (raw && typeof raw === 'object') {
    return {
      total: pickNumber(raw.total, total),
      notStartedCount: pickNumber(raw.notStartedCount),
      inProgressCount: pickNumber(raw.inProgressCount),
      completedCount: pickNumber(raw.completedCount),
      failedCount: pickNumber(raw.failedCount),
      averageProgress: pickNumber(raw.averageProgress),
    };
  }

  const countBy = (status: MonitoringStatus) =>
    rows.filter((row) => row.status === status).length;

  return {
    total,
    notStartedCount: countBy('NOT_STARTED') + countBy('LOCKED'),
    inProgressCount: countBy('IN_PROGRESS'),
    completedCount: countBy('COMPLETED'),
    failedCount: countBy('FAILED'),
    averageProgress: rows.length
      ? Math.round(
          rows.reduce((sum, row) => sum + row.progressPercent, 0) / rows.length
        )
      : 0,
  };
};

export const getMonitoring = async (params: {
  start?: number;
  limit?: number;
  searchKey?: string;
  status?: string;
  courseId?: string;
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

  const rows: MonitoringRowDto[] = list.map(
    (item: Record<string, any>, index: number) => normalizeMonitoringRow(item, index)
  );
  const total = pickNumber(payload.total, payload.totalElements, list.length);

  return {
    list: rows,
    total,
    summary: normalizeSummary(payload.summary, rows, total),
  } satisfies MonitoringListPayload;
};

/** Remove one student's progress for one course (resets the monitoring row). */
export const deleteMonitoring = async (userId: string, courseId: string) => {
  await apiClient.delete('/v1/lms/progress/admin/monitoring', {
    params: { userId, courseId },
  });
};

export const getMonitoringDetail = async (userId: string, courseId: string) => {
  const response = await apiClient.get<Response<any>>(
    '/v1/lms/progress/admin/monitoring/detail',
    {
      params: { userId, courseId },
    }
  );

  const payload = response.data?.payload ?? {};
  const modules: MonitoringModuleDetailDto[] = Array.isArray(payload.modules)
    ? payload.modules.map((module: Record<string, any>) => ({
        moduleId: String(module.moduleId ?? ''),
        title: pickString(module.title, 'Modul'),
        status: normalizeStatus(module.status),
        progressPercent: Math.max(0, Math.min(100, pickNumber(module.progressPercent))),
        lessons: Array.isArray(module.lessons)
          ? module.lessons.map((lesson: Record<string, any>) => ({
              lessonItemId: String(lesson.lessonItemId ?? ''),
              title: pickString(lesson.title, 'Dars'),
              type: normalizeLessonType(lesson.type),
              status: normalizeStatus(lesson.status),
              score: typeof lesson.score === 'number' ? lesson.score : null,
              startedAt: lesson.startedAt ?? null,
              completedAt: lesson.completedAt ?? null,
            }))
          : [],
      }))
    : [];

  return {
    userId: String(payload.userId ?? userId),
    userFullName: pickString(payload.userFullName, 'O‘quvchi'),
    email: pickString(payload.email),
    phoneNumber: pickString(payload.phoneNumber),
    courseId: String(payload.courseId ?? courseId),
    courseTitle: pickString(payload.courseTitle, 'Kurs'),
    status: normalizeStatus(payload.status),
    progressPercent: Math.max(0, Math.min(100, pickNumber(payload.progressPercent))),
    averageScore: typeof payload.averageScore === 'number' ? payload.averageScore : null,
    startedAt: payload.startedAt ?? null,
    lastActivityAt: payload.lastActivityAt ?? null,
    completedAt: payload.completedAt ?? null,
    modules,
  } satisfies MonitoringDetailDto;
};

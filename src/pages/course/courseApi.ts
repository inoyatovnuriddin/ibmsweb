import { apiClient } from '../../services/api.ts';
import type { ListResult, Response } from '../../types/response.ts';
import {
  CompleteLessonPayload,
  CourseAssetBundle,
  CourseQuestionRecord,
  CourseRecord,
  CourseTestRecord,
  CourseTopicRecord,
  CourseVideoRecord,
  MyCoursesProgressResponse,
  OpenLessonPayload,
  StartCoursePayload,
  SubmitTestPayload,
} from './types.ts';
import {
  createEmptyProgressSnapshot,
  normalizeProgressSnapshot,
} from './courseUtils.ts';

const unwrapPayload = <T>(response: { data?: Response<T> | T }) => {
  const data = response.data as Response<T> | T;

  if (data && typeof data === 'object' && 'payload' in data) {
    return (data as Response<T>).payload;
  }

  return data as T;
};

const hasToken = () => Boolean(localStorage.getItem('access_token'));

export const getCourses = async (params: {
  start?: number;
  limit?: number;
  searchKey?: string;
}) => {
  const response = await apiClient.get<Response<ListResult<CourseRecord>>>(
    '/v1/course/list',
    {
      params,
    }
  );

  return unwrapPayload<ListResult<CourseRecord>>(response);
};

export const getCourseById = async (id: string) => {
  const response = await apiClient.get<Response<CourseRecord>>('/v1/course/one', {
    params: { id },
  });

  return unwrapPayload<CourseRecord>(response);
};

export const getTopicsByCourse = async (courseId?: string | null) => {
  const response = await apiClient.get<Response<ListResult<CourseTopicRecord>>>(
    '/v1/topic/list',
    {
      params: {
        courseId: courseId || undefined,
      },
    }
  );

  return unwrapPayload<ListResult<CourseTopicRecord>>(response).list || [];
};

export const getVideosByTopic = async (topicId?: string | null) => {
  const response = await apiClient.get('/v1/video', {
    params: {
      topicId: topicId || undefined,
    },
  });
  const payload = unwrapPayload<ListResult<CourseVideoRecord> | CourseVideoRecord[]>(
    response
  );

  if (Array.isArray(payload)) {
    return payload;
  }

  return payload?.list || [];
};

export const getTests = async (topicId?: string | null) => {
  const response = await apiClient.get('/v1/test', {
    params: {
      page: 0,
      size: 200,
      topicId: topicId || undefined,
    },
  });
  const payload = unwrapPayload<ListResult<CourseTestRecord>>(response);
  const list = payload?.list || [];
  return topicId ? list.filter((item) => item.topicId === topicId) : list;
};

export const getQuestionsByTest = async (testId: string) => {
  const response = await apiClient.get<Response<CourseQuestionRecord[]>>(
    '/v1/question',
    {
      params: { testId },
    }
  );

  return unwrapPayload<CourseQuestionRecord[]>(response) || [];
};

export const getLearnerTest = async (topicId: string) => {
  const response = await apiClient.get<
    Response<{
      id: string;
      title: string;
      questionCount: number;
      passScore?: number;
      questions: CourseQuestionRecord[];
    }>
  >('/v1/test/one', {
    params: { topicId },
  });

  return unwrapPayload(response);
};

export const getCourseAssets = async (topicId: string): Promise<CourseAssetBundle> => {
  const [videos, tests] = await Promise.all([
    getVideosByTopic(topicId),
    getTests(topicId),
  ]);

  return { videos, tests };
};

export const getCourseProgress = async (courseId: string) => {
  if (!hasToken()) {
    return createEmptyProgressSnapshot(courseId);
  }

  const response = await apiClient.get('/v1/lms/progress/course/' + courseId);
  return normalizeProgressSnapshot(unwrapPayload<any>(response), courseId);
};

export const getMyCoursesProgress = async () => {
  if (!hasToken()) {
    return { list: [] } as MyCoursesProgressResponse;
  }

  const response = await apiClient.get('/v1/lms/progress/my/courses');
  return unwrapPayload<MyCoursesProgressResponse>(response) || { list: [] };
};

export const startCourseProgress = async (payload: StartCoursePayload) => {
  const response = await apiClient.post('/v1/lms/progress/course/start', payload);
  return normalizeProgressSnapshot(unwrapPayload<any>(response), payload.courseId);
};

export const openLessonProgress = async (payload: OpenLessonPayload) => {
  const response = await apiClient.post('/v1/lms/progress/lesson/open', payload);
  return normalizeProgressSnapshot(unwrapPayload<any>(response), payload.courseId);
};

export const completeLessonProgress = async (payload: CompleteLessonPayload) => {
  const response = await apiClient.post(
    '/v1/lms/progress/lesson/complete',
    payload
  );
  return normalizeProgressSnapshot(unwrapPayload<any>(response), payload.courseId);
};

export const submitTestProgress = async (payload: SubmitTestPayload) => {
  const response = await apiClient.post('/v1/lms/progress/test/submit', payload);
  return normalizeProgressSnapshot(unwrapPayload<any>(response), payload.courseId);
};

export const isAuthenticated = hasToken;

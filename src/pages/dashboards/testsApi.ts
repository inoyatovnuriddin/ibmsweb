import { apiClient } from '../../services/api.ts';
import type { ListResult, Response } from '../../types/response.ts';

export interface AdminQuestionItem {
  id?: string;
  text: string;
  answers: string[];
  correctIndex: number;
}

export interface LearnerQuestionItem {
  id: string;
  text: string;
  answers: string[];
}

export interface TestListItem {
  id: string;
  title: string;
  topicId: string;
  topicTitle: string;
  questionCount: number;
  passScore?: number;
}

export interface AdminTestDetail extends TestListItem {
  questions: AdminQuestionItem[];
}

const unwrapPayload = <T>(response: { data?: Response<T> | T }) => {
  const data = response.data as Response<T> | T;

  if (data && typeof data === 'object' && 'payload' in data) {
    return (data as Response<T>).payload;
  }

  return data as T;
};

export const getTests = async (params?: { page?: number; size?: number; topicId?: string }) => {
  const response = await apiClient.get<Response<ListResult<TestListItem>>>('/v1/test', {
    params: {
      page: params?.page ?? 0,
      size: params?.size ?? 10,
      topicId: params?.topicId,
    },
  });

  const payload = unwrapPayload<ListResult<TestListItem>>(response);
  return {
    list: payload?.list || [],
    count: payload?.count || 0,
  };
};

export const getLearnerTest = async (topicId: string) => {
  const response = await apiClient.get<Response<{
    id: string;
    title: string;
    questionCount: number;
    passScore?: number;
    questions: LearnerQuestionItem[];
  }>>('/v1/test/one', {
    params: { topicId },
  });

  return unwrapPayload(response);
};

export const getAdminTest = async (testId: string) => {
  const response = await apiClient.get<Response<AdminTestDetail>>(`/v1/test/${testId}`);
  return unwrapPayload<AdminTestDetail>(response);
};

export const getLearnerQuestions = async (testId: string) => {
  const response = await apiClient.get<Response<LearnerQuestionItem[]>>('/v1/question', {
    params: { testId },
  });
  return unwrapPayload<LearnerQuestionItem[]>(response) || [];
};

export const getAdminQuestions = async (testId: string) => {
  const response = await apiClient.get<Response<AdminQuestionItem[]>>('/v1/question/admin', {
    params: { testId },
  });
  return unwrapPayload<AdminQuestionItem[]>(response) || [];
};

export const submitTest = async (payload: {
  courseId: string;
  moduleId: string;
  lessonItemId: string;
  testId: string;
  answers: Record<string, number>;
}) => {
  const response = await apiClient.post('/v1/lms/progress/test/submit', payload);
  return unwrapPayload<any>(response);
};

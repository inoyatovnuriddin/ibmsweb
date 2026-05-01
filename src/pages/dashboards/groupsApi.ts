import { apiClient } from '../../services/api.ts';
import type { ListResult, Response } from '../../types/response.ts';
import type {
  CourseSearchItem,
  GroupAssignmentsSyncPayload,
  GroupCreatePayload,
  GroupsOverview,
  GroupUpdatePayload,
  StudentGroupDetails,
  StudentGroupItem,
  UserListItem,
} from './groupTypes.ts';
import {
  normalizeCourseSearchItem,
  normalizeGroupDetails,
  normalizeGroupItem,
  normalizeUserListItem,
} from './groupMappers.ts';

const unwrapPayload = <T>(response: { data?: Response<T> | T }) => {
  const data = response.data as Response<T> | T;

  if (data && typeof data === 'object' && 'payload' in data) {
    return (data as Response<T>).payload;
  }

  return data as T;
};

const pickNumber = (value: unknown, fallback = 0) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

export const getGroupsOverview = async () => {
  const response = await apiClient.get<Response<GroupsOverview>>('/v1/groups/overview');
  const payload = unwrapPayload<GroupsOverview>(response);

  return {
    totalGroups: pickNumber(payload.totalGroups),
    activeGroups: pickNumber(payload.activeGroups),
    totalStudentAssignments: pickNumber(payload.totalStudentAssignments),
    totalCourseAssignments: pickNumber(payload.totalCourseAssignments),
  };
};

export const getGroups = async (params: {
  searchKey?: string;
  start?: number;
  limit?: number;
  active?: boolean;
}) => {
  const response = await apiClient.get<Response<ListResult<StudentGroupItem>>>(
    '/v1/groups/list',
    { params }
  );

  const payload = unwrapPayload<ListResult<StudentGroupItem>>(response);

  return {
    list: (payload.list || []).map(normalizeGroupItem),
    count: payload.count || 0,
  };
};

export const getGroup = async (groupId: string) => {
  const response = await apiClient.get<Response<StudentGroupDetails>>(
    `/v1/groups/${groupId}`
  );
  return normalizeGroupDetails(unwrapPayload<StudentGroupDetails>(response));
};

export const createGroup = async (payload: GroupCreatePayload) => {
  const response = await apiClient.post<Response<StudentGroupItem>>(
    '/v1/groups/create',
    payload
  );
  return normalizeGroupItem(unwrapPayload<StudentGroupItem>(response));
};

export const updateGroup = async (groupId: string, payload: GroupUpdatePayload) => {
  const response = await apiClient.put<Response<StudentGroupItem>>(
    `/v1/groups/${groupId}`,
    payload
  );
  return normalizeGroupItem(unwrapPayload<StudentGroupItem>(response));
};

export const deleteGroup = async (groupId: string) => {
  await apiClient.delete(`/v1/groups/${groupId}`);
};

export const syncGroupAssignments = async (
  groupId: string,
  payload: GroupAssignmentsSyncPayload
) => {
  const response = await apiClient.put<Response<StudentGroupDetails>>(
    `/v1/groups/${groupId}/assignments`,
    payload
  );
  return normalizeGroupDetails(unwrapPayload<StudentGroupDetails>(response));
};

export const addStudent = async (groupId: string, userId: string) => {
  await apiClient.post(`/v1/groups/${groupId}/students/${userId}`);
};

export const removeStudent = async (groupId: string, userId: string) => {
  await apiClient.delete(`/v1/groups/${groupId}/students/${userId}`);
};

export const attachCourse = async (groupId: string, courseId: string) => {
  await apiClient.post(`/v1/groups/${groupId}/courses/${courseId}`);
};

export const detachCourse = async (groupId: string, courseId: string) => {
  await apiClient.delete(`/v1/groups/${groupId}/courses/${courseId}`);
};

export const searchStudents = async (searchKey = '') => {
  const response = await apiClient.get<Response<ListResult<UserListItem>>>('/v1/users/list', {
    params: {
      searchKey,
      start: 0,
      limit: 20,
    },
  });

  return (unwrapPayload<ListResult<UserListItem>>(response).list || [])
    .map(normalizeUserListItem)
    .filter((user) =>
    Array.isArray(user.roles) ? user.roles.includes('ROLE_USER') : false
    );
};

export const searchCourses = async (searchKey = '') => {
  const response = await apiClient.get<Response<ListResult<CourseSearchItem>>>(
    '/v1/course/list',
    {
      params: {
        searchKey,
        start: 0,
        limit: 20,
      },
    }
  );

  return (unwrapPayload<ListResult<CourseSearchItem>>(response).list || []).map(
    normalizeCourseSearchItem
  );
};

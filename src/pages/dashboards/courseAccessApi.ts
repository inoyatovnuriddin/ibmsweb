import { apiClient } from '../../services/api.ts';
import type { Response } from '../../types/response.ts';
import type {
  SaveUserOverridePayload,
  UserCourseAccessOverride,
  UserEffectiveCourseAccess,
} from './groupTypes.ts';
import { normalizeEffectiveAccess, normalizeOverride } from './groupMappers.ts';

const unwrapPayload = <T>(response: { data?: Response<T> | T }) => {
  const data = response.data as Response<T> | T;

  if (data && typeof data === 'object' && 'payload' in data) {
    return (data as Response<T>).payload;
  }

  return data as T;
};

export const getUserOverrides = async (userId: string) => {
  const response = await apiClient.get<Response<UserCourseAccessOverride[]>>(
    `/v1/course-access/users/${userId}`
  );
  return (unwrapPayload<UserCourseAccessOverride[]>(response) || []).map(normalizeOverride);
};

export const saveUserOverride = async (
  userId: string,
  payload: SaveUserOverridePayload
) => {
  const response = await apiClient.post<Response<UserCourseAccessOverride>>(
    `/v1/course-access/users/${userId}`,
    payload
  );
  return normalizeOverride(unwrapPayload<UserCourseAccessOverride>(response));
};

export const deleteUserOverride = async (userId: string, courseId: string) => {
  await apiClient.delete(`/v1/course-access/users/${userId}/${courseId}`);
};

export const getUserEffectiveAccess = async (userId: string) => {
  const response = await apiClient.get<Response<UserEffectiveCourseAccess>>(
    `/v1/course-access/users/${userId}/effective`
  );
  return normalizeEffectiveAccess(unwrapPayload<UserEffectiveCourseAccess>(response));
};

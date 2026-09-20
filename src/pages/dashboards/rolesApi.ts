import { apiClient } from '../../services/api.ts';
import type { RoleInfo } from './usersApi.ts';

export type { RoleInfo } from './usersApi.ts';
export { listRoles } from './usersApi.ts';

interface ApiWrapper<T> {
  payload?: T;
}

export interface RolePayload {
  name: string;
  description?: string | null;
  /** page key -> granted actions (VIEW/CREATE/UPDATE/DELETE). */
  permissions: Record<string, string[]>;
}

/** The grantable page registry: page key -> available actions. */
export const getPageRegistry = async (): Promise<Record<string, string[]>> => {
  const res = await apiClient.get<ApiWrapper<Record<string, string[]>>>('/v1/role/pages');
  return res.data?.payload || {};
};

export const createRole = async (payload: RolePayload): Promise<RoleInfo | undefined> => {
  const res = await apiClient.post<ApiWrapper<RoleInfo>>('/v1/role', payload);
  return res.data?.payload;
};

export const updateRole = async (
  code: string,
  payload: RolePayload
): Promise<RoleInfo | undefined> => {
  const res = await apiClient.put<ApiWrapper<RoleInfo>>(`/v1/role/${code}`, payload);
  return res.data?.payload;
};

export const deleteRole = async (code: string) => {
  await apiClient.delete(`/v1/role/${code}`);
};

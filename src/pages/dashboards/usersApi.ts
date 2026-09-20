import { apiClient } from '../../services/api.ts';

export interface UpdateUserPayload {
  firstname: string;
  lastname: string;
  middlename: string;
  phoneNumber?: string | null;
  passportId?: string | null;
  birthDate?: string | null;
  roles: string[];
  email?: string;
  status?: 'Confirm' | 'Active' | 'Block';
  changePassword: boolean;
  password?: string;
  /** Attachment id from POST /v1/attachment/upload (optional profile photo). */
  userImageId?: string | null;
  /** Detach the current profile photo. */
  removeUserImage?: boolean;
}

interface ApiWrapper<T> {
  payload?: T;
}

export interface RoleInfo {
  code: string;
  name: string;
  description?: string | null;
  system: boolean;
  permissions: Record<string, string[]>;
  userCount: number;
}

export const updateUser = async (userId: string, payload: UpdateUserPayload) => {
  await apiClient.put(`/v1/users/${userId}`, payload);
};

export const deleteUser = async (userId: string) => {
  await apiClient.delete(`/v1/users/${userId}`);
};

/** Uploads a (cropped) profile photo and returns the attachment id for userImageId. */
export const uploadUserImage = async (file: File | Blob, filename = 'avatar.png') => {
  const formData = new FormData();
  formData.append('file', file, filename);
  const res = await apiClient.post<ApiWrapper<string>>('/v1/attachment/upload', formData);
  const id = res.data?.payload;
  if (!id) throw new Error('Rasm yuklanmadi');
  return id;
};

/** All roles (codes + names) for the role select and the roles page. */
export const listRoles = async (): Promise<RoleInfo[]> => {
  const res = await apiClient.get<ApiWrapper<RoleInfo[]>>('/v1/role/all');
  return res.data?.payload || [];
};

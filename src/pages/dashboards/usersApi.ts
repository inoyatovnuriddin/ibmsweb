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
}

export const updateUser = async (userId: string, payload: UpdateUserPayload) => {
  await apiClient.put(`/v1/users/${userId}`, payload);
};

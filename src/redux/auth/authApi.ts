import { apiClient } from '../../services/api.ts';

export interface JwtTokenPayload {
  id_token: string;
}

export interface CurrentUser {
  id: string;
  email: string;
  phoneNumber: string | null;
  birthDate: string | null;
  passportId: string | null;
  firstName: string | null;
  lastName: string | null;
  middleName: string | null;
  authProvider: 'LOCAL' | 'GOOGLE' | 'FACEBOOK' | 'ONE_ID' | null;
  status: 'Active' | 'Confirm' | 'Block' | null;
  passwordLoginEnabled: boolean;
  profileCompleted: boolean;
  roles: string[];
}

export interface UpdateCurrentProfilePayload {
  firstname: string;
  lastname: string;
  middlename?: string | null;
  email: string;
  phoneNumber?: string | null;
  passportId?: string | null;
  birthDate?: string | null;
  roles?: string[];
  status?: 'Active' | 'Confirm' | 'Block' | null;
}

export interface PasswordResetRequestResponse {
  message: string;
}

export interface PasswordResetValidateResponse {
  valid: boolean;
  expiresAt: string;
  email: string;
}

type ApiResponse<T> = {
  status?: string;
  statusCode?: number;
  payload?: T;
};

const unwrapPayload = <T>(data: ApiResponse<T> | T) => {
  if (data && typeof data === 'object' && 'payload' in (data as ApiResponse<T>)) {
    return (data as ApiResponse<T>).payload as T;
  }

  return data as T;
};

const toStringValue = (value: unknown) =>
  typeof value === 'string' ? value.trim() : null;

const toBooleanValue = (value: unknown, fallback = false) =>
  typeof value === 'boolean' ? value : fallback;

export const normalizeCurrentUser = (raw: unknown): CurrentUser => {
  const record = (raw || {}) as Record<string, unknown>;
  const roles = Array.isArray(record.roles)
    ? record.roles.filter((item): item is string => typeof item === 'string')
    : [];

  return {
    id: toStringValue(record.id) || '',
    email: toStringValue(record.email) || '',
    phoneNumber: toStringValue(record.phoneNumber),
    birthDate: toStringValue(record.birthDate) || toStringValue(record.birthday),
    passportId: toStringValue(record.passportId),
    firstName: toStringValue(record.firstName) || toStringValue(record.firstname),
    lastName: toStringValue(record.lastName) || toStringValue(record.lastname),
    middleName: toStringValue(record.middleName) || toStringValue(record.middlename),
    authProvider:
      (toStringValue(record.authProvider)?.toUpperCase() as CurrentUser['authProvider']) ||
      null,
    status: (toStringValue(record.status) as CurrentUser['status']) || null,
    passwordLoginEnabled: toBooleanValue(record.passwordLoginEnabled),
    profileCompleted: toBooleanValue(record.profileCompleted),
    roles,
  };
};

export const loginWithIdentifier = async (payload: {
  identifier?: string;
  email?: string;
  password: string;
}) => {
  const response = await apiClient.post<ApiResponse<JwtTokenPayload>>(
    '/authenticate',
    payload
  );

  return unwrapPayload<JwtTokenPayload>(response.data);
};

export const signupWithLocalAccount = async (payload: {
  firstname: string;
  lastname: string;
  middlename?: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  birthday: string;
  passportId: string;
}) => {
  const response = await apiClient.post<ApiResponse<JwtTokenPayload>>('/signup', payload);
  return unwrapPayload<JwtTokenPayload>(response.data);
};

export const fetchCurrentUser = async () => {
  const response = await apiClient.get<ApiResponse<CurrentUser> | CurrentUser>('/auth/me');
  return normalizeCurrentUser(unwrapPayload<CurrentUser>(response.data));
};

export const completeProfile = async (payload: {
  phoneNumber: string;
  birthday: string;
  passportId: string;
  password?: string;
  confirmPassword?: string;
}) => {
  const response = await apiClient.post<ApiResponse<CurrentUser> | CurrentUser>(
    '/auth/complete-profile',
    payload
  );

  return normalizeCurrentUser(unwrapPayload<CurrentUser>(response.data));
};

export const updateCurrentProfile = async (
  userId: string,
  payload: UpdateCurrentProfilePayload
) => {
  await apiClient.put(`/v1/users/${userId}`, {
    ...payload,
    middlename: payload.middlename || null,
    phoneNumber: payload.phoneNumber || null,
    passportId: payload.passportId || null,
    birthDate: payload.birthDate || null,
    roles: payload.roles || ['ROLE_USER'],
    status: payload.status || 'Active',
    changePassword: false,
  });

  return fetchCurrentUser();
};

export const requestPasswordReset = async (payload: { email: string }) => {
  const response = await apiClient.post<ApiResponse<PasswordResetRequestResponse>>(
    '/auth/password-reset/request',
    payload
  );

  return unwrapPayload<PasswordResetRequestResponse>(response.data);
};

export const validatePasswordResetToken = async (token: string) => {
  const response = await apiClient.get<ApiResponse<PasswordResetValidateResponse>>(
    '/auth/password-reset/validate',
    {
      params: { token },
    }
  );

  return unwrapPayload<PasswordResetValidateResponse>(response.data);
};

export const confirmPasswordReset = async (payload: {
  token: string;
  password: string;
  confirmPassword: string;
}) => {
  const response = await apiClient.post<ApiResponse<PasswordResetRequestResponse>>(
    '/auth/password-reset/confirm',
    payload
  );

  return unwrapPayload<PasswordResetRequestResponse>(response.data);
};

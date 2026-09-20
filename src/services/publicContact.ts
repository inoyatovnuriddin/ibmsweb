import { apiClient } from './api.ts';

export type PublicContactRequestPayload = {
  fullName: string;
  phoneNumber: string;
  message: string;
  sourcePage: string;
  formSessionId: string;
  website?: string;
};

export type PublicContactRequestResponse = {
  message: string;
};

type ApiResponse<T> = {
  status?: string;
  statusCode?: number;
  payload?: T;
  errors?: {
    message?: string;
    details?: unknown;
  };
};

const unwrapPayload = <T>(data: ApiResponse<T> | T) => {
  if (data && typeof data === 'object' && 'payload' in (data as ApiResponse<T>)) {
    return (data as ApiResponse<T>).payload as T;
  }

  return data as T;
};

export const submitPublicContactRequest = async (
  payload: PublicContactRequestPayload
) => {
  const response = await apiClient.post<ApiResponse<PublicContactRequestResponse>>(
    '/public/contact-requests',
    payload
  );

  return unwrapPayload<PublicContactRequestResponse>(response.data);
};

import dayjs from 'dayjs';
import { apiClient } from '../../services/api.ts';
import type { ListResult, Response } from '../../types/response.ts';

export type PublicContactRequestStatus = 'NEW' | 'REVIEWED' | 'CLOSED';

export interface PublicContactRequestOverview {
  totalCount: number;
  newCount: number;
  reviewedCount: number;
  closedCount: number;
  last24HoursCount: number;
}

export interface PublicContactRequestItem {
  id: string;
  fullName: string;
  phoneNumber: string;
  message: string;
  sourcePage: string | null;
  formSessionId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  status: PublicContactRequestStatus;
  createdAt: string;
}

export type PublicContactRequestListParams = {
  searchKey?: string;
  status?: PublicContactRequestStatus;
  phoneNumber?: string;
  sourcePage?: string;
  fromDate?: string;
  toDate?: string;
  start?: number;
  limit?: number;
};

const unwrapPayload = <T>(response: { data?: Response<T> | T }) => {
  const data = response.data as Response<T> | T;

  if (data && typeof data === 'object' && 'payload' in data) {
    return (data as Response<T>).payload;
  }

  return data as T;
};

const toText = (value: unknown) =>
  typeof value === 'string' ? value.trim() : '';

const toNullableText = (value: unknown) => {
  const normalized = toText(value);
  return normalized || null;
};

const toNumber = (value: unknown, fallback = 0) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const normalizeStatus = (value: unknown): PublicContactRequestStatus => {
  if (value === 'REVIEWED' || value === 'CLOSED') {
    return value;
  }

  return 'NEW';
};

const normalizeItem = (item: unknown): PublicContactRequestItem => {
  const record = (item || {}) as Record<string, unknown>;

  return {
    id: toText(record.id),
    fullName: toText(record.fullName),
    phoneNumber: toText(record.phoneNumber),
    message: toText(record.message),
    sourcePage: toNullableText(record.sourcePage),
    formSessionId: toNullableText(record.formSessionId),
    ipAddress: toNullableText(record.ipAddress),
    userAgent: toNullableText(record.userAgent),
    status: normalizeStatus(record.status),
    createdAt: toText(record.createdAt),
  };
};

export const getPublicContactRequestOverview = async () => {
  const response = await apiClient.get<Response<PublicContactRequestOverview>>(
    '/v1/public-contact-requests/overview'
  );
  const payload = unwrapPayload<PublicContactRequestOverview>(response);

  return {
    totalCount: toNumber(payload.totalCount),
    newCount: toNumber(payload.newCount),
    reviewedCount: toNumber(payload.reviewedCount),
    closedCount: toNumber(payload.closedCount),
    last24HoursCount: toNumber(payload.last24HoursCount),
  };
};

export const getPublicContactRequests = async (
  params: PublicContactRequestListParams
) => {
  const response = await apiClient.get<Response<ListResult<PublicContactRequestItem>>>(
    '/v1/public-contact-requests/list',
    { params }
  );
  const payload = unwrapPayload<ListResult<PublicContactRequestItem>>(response);

  return {
    list: (payload.list || []).map(normalizeItem),
    count: toNumber(payload.count),
  };
};

export const getPublicContactRequestById = async (requestId: string) => {
  const response = await apiClient.get<Response<PublicContactRequestItem>>(
    `/v1/public-contact-requests/${requestId}`
  );

  return normalizeItem(unwrapPayload<PublicContactRequestItem>(response));
};

export const updatePublicContactRequestStatus = async (
  requestId: string,
  status: PublicContactRequestStatus
) => {
  const response = await apiClient.put<Response<PublicContactRequestItem>>(
    `/v1/public-contact-requests/${requestId}/status`,
    { status }
  );

  return normalizeItem(unwrapPayload<PublicContactRequestItem>(response));
};

export const toApiDate = (value?: dayjs.Dayjs | null) =>
  value ? value.format('YYYY-MM-DD') : undefined;

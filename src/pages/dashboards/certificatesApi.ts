import { apiClient, publicApiClient } from '../../services/api.ts';

/**
 * Shared client for the generic certificate engine (backend: /api/v1/certificates).
 * Every certificate template reuses this — the only thing that changes per template is
 * which fields a form fills in {@link CertificateRequest}.
 */

// Common payload accepted by POST /v1/certificates/generate. All fields are optional except
// templateCode; each template fills only the subset it needs.
export interface CertificateRequest {
  templateCode: string;

  // Human readable certificate type (Cyrillic) — used for the list and the download file name.
  documentTitle?: string;

  // Optional domain references resolved server-side (recipient + course), like the diploma flow.
  userId?: string;
  courseId?: string;

  organizationName?: string;
  organizationCity?: string;

  regNo?: string;
  docTitle?: string;

  // Public MinIO URL of the recipient photo (from POST /certificates/photo). Shown on the
  // verification page only — not rendered into the document.
  photoUrl?: string;

  // Send a single fullName (backend transliterates) or override per language.
  fullName?: string;
  fullNameUz?: string;
  fullNameRu?: string;
  fullNameEn?: string;

  professionUz?: string;
  professionRu?: string;
  professionEn?: string;

  grade?: string;
  protocolNumber?: string;
  protocolDate?: string; // YYYY-MM-DD
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string; // YYYY-MM-DD
  issueDate?: string; // YYYY-MM-DD
  commissionDate?: string; // YYYY-MM-DD

  studyForm?: string;
  hours?: string;
  hoursTheory?: string;
  hoursPractice?: string;
  markTheory?: string;
  markPractice?: string;
  courseName?: string;
  equipment?: string;
  voltage?: string;
  elecGroup?: string;
  role?: string;

  director?: string;
  chairman?: string;
  ceo?: string;
  // Инспектор Госкомитета промышленной безопасности (template9).
  inspector?: string;

  extraValues?: Record<string, string>;
}

export interface CertificateTemplate {
  code: string;
  name: string;
  fields: string[];
}

export interface CertificateVerification {
  id: string;
  templateCode: string;
  templateName?: string;
  serialNumber?: string;
  userId?: string;
  courseId?: string;
  photoUrl?: string;
  issuedAt?: string;
  values: Record<string, string>;
}

export interface GeneratedCertificate {
  blob: Blob;
  filename: string;
  contentType: string;
  certificateId?: string;
  /** Recipient "firstNameRu_lastNameRu" (Cyrillic), for the QR file name. */
  recipient?: string;
}

interface ApiWrapper<T> {
  payload?: T;
  errors?: { message?: string };
  message?: string;
}

const DOCX_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export const getCertificateErrorMessage = (err: unknown): string => {
  const normalized = err as {
    response?: { data?: { errors?: { message?: string }; message?: string } };
    message?: string;
  };
  return (
    normalized?.response?.data?.errors?.message ||
    normalized?.response?.data?.message ||
    normalized?.message ||
    'Хатолик юз берди'
  );
};

const parseFilename = (contentDisposition?: string): string | null => {
  if (!contentDisposition) return null;
  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }
  const fallbackMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
  return fallbackMatch?.[1] || null;
};

/** All issued certificates (every type) from the single unified store, newest first. */
export const listIssuedCertificates = async (): Promise<CertificateVerification[]> => {
  const res = await apiClient.get<ApiWrapper<CertificateVerification[]>>('/v1/certificates');
  return res.data?.payload || [];
};

/** Available templates (code, name, and the fields each one needs). */
export const listCertificateTemplates = async (): Promise<CertificateTemplate[]> => {
  const res = await apiClient.get<ApiWrapper<CertificateTemplate[]>>(
    '/v1/certificates/templates'
  );
  return res.data?.payload || [];
};

export const getCertificateTemplate = async (
  code: string
): Promise<CertificateTemplate | null> => {
  const res = await apiClient.get<ApiWrapper<CertificateTemplate>>(
    `/v1/certificates/templates/${code}`
  );
  return res.data?.payload || null;
};

/** Generate a certificate and return the .docx blob plus the stored certificate id. */
export const generateCertificate = async (
  payload: CertificateRequest,
  fallbackFilename = 'certificate.docx'
): Promise<GeneratedCertificate> => {
  const res = await apiClient.post('/v1/certificates/generate', payload, {
    responseType: 'blob',
  });

  const contentDisposition = res.headers?.['content-disposition'];
  const contentType =
    (typeof res.headers?.['content-type'] === 'string'
      ? res.headers['content-type']
      : undefined) || DOCX_CONTENT_TYPE;

  const filename =
    parseFilename(
      typeof contentDisposition === 'string' ? contentDisposition : undefined
    ) || fallbackFilename;

  const certificateId = res.headers?.['x-certificate-id'] as string | undefined;
  const recipientHeader = res.headers?.['x-certificate-recipient'] as string | undefined;
  let recipient: string | undefined;
  if (recipientHeader) {
    try {
      recipient = decodeURIComponent(recipientHeader);
    } catch {
      recipient = recipientHeader;
    }
  }

  return {
    blob: new Blob([res.data], { type: contentType }),
    filename,
    contentType,
    certificateId,
    recipient,
  };
};

/**
 * Upload a recipient photo to MinIO and return its public URL. The URL is then passed back
 * as {@link CertificateRequest.photoUrl} when generating the certificate.
 * When {@code userId} is given, the backend also saves the photo as that user's profile
 * image, so future certificates for the same person pick it up automatically.
 */
export const uploadCertificatePhoto = async (
  file: File,
  userId?: string
): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  // Let axios set multipart/form-data with the correct boundary automatically.
  const res = await apiClient.post<ApiWrapper<string>>('/v1/certificates/photo', formData, {
    params: userId ? { userId } : undefined,
  });
  const url = res.data?.payload;
  if (!url) throw new Error('Rasm yuklanmadi');
  return url;
};

/**
 * Public verification data shown after scanning a certificate QR code.
 * Uses {@link publicApiClient} so no auth token is attached and a stale token can't
 * redirect the public page to the login screen.
 */
export const verifyCertificate = async (
  id: string
): Promise<CertificateVerification | null> => {
  const res = await publicApiClient.get<ApiWrapper<CertificateVerification>>(
    `/v1/certificates/verify/${id}`
  );
  return res.data?.payload || null;
};

export interface CertificateUpdatePayload {
  documentTitle?: string;
  serialNumber?: string;
  photoUrl?: string | null;
  values?: Record<string, string>;
}

/** Edit an issued certificate (type name, number, photo, values). */
export const updateCertificate = async (
  id: string,
  payload: CertificateUpdatePayload
): Promise<CertificateVerification | null> => {
  const res = await apiClient.put<ApiWrapper<CertificateVerification>>(
    `/v1/certificates/${id}`,
    payload
  );
  return res.data?.payload || null;
};

/** Soft-delete an issued certificate. */
export const deleteCertificate = async (id: string): Promise<void> => {
  await apiClient.delete(`/v1/certificates/${id}`);
};

/** Re-render the stored certificate and download it as a .docx. */
export const downloadCertificateDocx = async (
  id: string,
  fallbackName = 'certificate.docx'
): Promise<void> => {
  const res = await apiClient.get(`/v1/certificates/${id}/download`, {
    responseType: 'blob',
  });
  const contentDisposition = res.headers?.['content-disposition'];
  const filename =
    parseFilename(
      typeof contentDisposition === 'string' ? contentDisposition : undefined
    ) || fallbackName;
  const blob = new Blob([res.data], { type: DOCX_CONTENT_TYPE });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

/** Trigger a browser download for a generated certificate blob. */
export const downloadCertificate = (generated: GeneratedCertificate): void => {
  const url = window.URL.createObjectURL(generated.blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = generated.filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

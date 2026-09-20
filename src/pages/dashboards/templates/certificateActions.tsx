import { useState } from 'react';
import { Button, Col, message, Modal, Row, Tag, Upload } from 'antd';
import ImgCrop from 'antd-img-crop';
import {
  DeleteOutlined,
  LoadingOutlined,
  UploadOutlined,
  UserOutlined,
} from '@ant-design/icons';
import QRCode from 'qrcode.react';
import {
  CertificateRequest,
  downloadCertificate,
  generateCertificate,
  getCertificateErrorMessage,
  uploadCertificatePhoto,
} from '../certificatesApi';

const QR_CANVAS_ID = 'cert-qr-canvas';

interface GenerateOpts {
  fallbackName?: string;
  onDone?: () => void;
}

export interface CertificateRecipient {
  id: string;
  userImage?: string | null;
}

export interface CertificatePhotoState {
  url?: string;
  uploading: boolean;
  /** The selected recipient — uploads update this user's profile photo. */
  linkedUser: CertificateRecipient | null;
  /** True when the current photo came from the selected user's profile. */
  fromProfile: boolean;
  upload: (file: File) => Promise<void>;
  /** Call from the user select: picks up the user's profile photo automatically. */
  linkUser: (user: CertificateRecipient | null) => void;
  clear: () => void;
}

/**
 * Shared generate/QR logic reused by every certificate form.
 *  - generateWord(): create the certificate and download the Word file.
 *  - generateQr(): create the certificate and open a modal with its QR (no Word download).
 * The recipient photo (optional) is uploaded to MinIO here and merged into every payload as
 * {@code photoUrl}, so individual forms don't need to manage it.
 */
export function useCertificateActions() {
  const [submitting, setSubmitting] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrId, setQrId] = useState<string | null>(null);
  const [qrFileBase, setQrFileBase] = useState('certificate');

  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [linkedUser, setLinkedUser] = useState<CertificateRecipient | null>(null);
  const [fromProfile, setFromProfile] = useState(false);

  const uploadPhoto = async (file: File) => {
    try {
      setPhotoUploading(true);
      // Linked to a user -> the backend also saves this photo to the user's profile.
      const url = await uploadCertificatePhoto(file, linkedUser?.id);
      setPhotoUrl(url);
      setFromProfile(false);
      message.success(
        linkedUser
          ? 'Rasm yuklandi va foydalanuvchi profiliga saqlandi'
          : 'Rasm yuklandi'
      );
    } catch (err) {
      message.error(getCertificateErrorMessage(err));
    } finally {
      setPhotoUploading(false);
    }
  };

  const linkUser = (user: CertificateRecipient | null) => {
    setLinkedUser(user);
    if (user?.userImage) {
      // The selected user already has a photo — use it for the certificate.
      setPhotoUrl(user.userImage);
      setFromProfile(true);
    } else {
      setPhotoUrl(undefined);
      setFromProfile(false);
    }
  };

  const photo: CertificatePhotoState = {
    url: photoUrl,
    uploading: photoUploading,
    linkedUser,
    fromProfile,
    upload: uploadPhoto,
    linkUser,
    clear: () => {
      setPhotoUrl(undefined);
      setFromProfile(false);
    },
  };

  const withPhoto = (payload: CertificateRequest): CertificateRequest => ({
    ...payload,
    photoUrl: photoUrl || undefined,
  });

  const generateWord = async (payload: CertificateRequest, opts?: GenerateOpts) => {
    try {
      setSubmitting(true);
      const generated = await generateCertificate(
        withPhoto(payload),
        opts?.fallbackName ?? `${payload.templateCode}.docx`
      );
      downloadCertificate(generated);
      opts?.onDone?.();
      setPhotoUrl(undefined);
      setLinkedUser(null);
      setFromProfile(false);
      message.success('Sertifikat saqlandi va Word fayl yuklab olindi');
    } catch (err) {
      message.error(getCertificateErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const generateQr = async (payload: CertificateRequest, opts?: GenerateOpts) => {
    try {
      setSubmitting(true);
      const generated = await generateCertificate(
        withPhoto(payload),
        opts?.fallbackName ?? `${payload.templateCode}.docx`
      );
      if (!generated.certificateId) {
        message.error('QR yaratib boʻlmadi');
        return;
      }
      setQrId(generated.certificateId);
      setQrFileBase(generated.recipient || payload.regNo || generated.certificateId);
      setQrOpen(true);
      opts?.onDone?.();
      setPhotoUrl(undefined);
      setLinkedUser(null);
      setFromProfile(false);
    } catch (err) {
      message.error(getCertificateErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const closeQr = () => setQrOpen(false);

  const downloadQr = () => {
    const canvas = document.getElementById(QR_CANVAS_ID) as HTMLCanvasElement | null;
    if (!canvas) return;
    const pngUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = pngUrl;
    link.download = `QR_${qrFileBase}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return {
    submitting,
    generateWord,
    generateQr,
    qrOpen,
    qrId,
    qrFileBase,
    closeQr,
    downloadQr,
    photo,
  };
}

/** Recipient photo picker with a live preview. Shown on the verification page after a QR scan. */
export function CertificatePhotoUpload({ photo }: { photo: CertificatePhotoState }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: 16,
        marginBottom: 20,
        borderRadius: 14,
        border: '1px dashed rgba(148,163,184,0.5)',
        background: 'rgba(148,163,184,0.06)',
      }}
    >
      <div
        style={{
          width: 76,
          height: 76,
          borderRadius: 14,
          overflow: 'hidden',
          flex: '0 0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(148,163,184,0.16)',
          border: '1px solid rgba(148,163,184,0.35)',
          color: 'rgba(100,116,139,0.9)',
          fontSize: 28,
        }}
      >
        {photo.uploading ? (
          <LoadingOutlined />
        ) : photo.url ? (
          <img
            src={photo.url}
            alt="Qabul qiluvchi rasmi"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <UserOutlined />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, marginBottom: 2 }}>
          Qabul qiluvchi rasmi
          {photo.fromProfile && (
            <Tag color="blue" style={{ marginLeft: 8, borderRadius: 999 }}>
              Profildan olindi
            </Tag>
          )}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(100,116,139,0.95)' }}>
          {photo.fromProfile
            ? 'Tanlangan foydalanuvchining profil rasmi ishlatiladi. Xohlasangiz almashtirishingiz mumkin.'
            : photo.linkedUser
              ? 'Tanlangan foydalanuvchida rasm yoʻq — yuklangan rasm uning profiliga ham saqlanadi.'
              : 'QR-kod skaner qilinganda sertifikat sahifasida koʻrinadi (JPG/PNG, ≤ 5MB).'}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flex: '0 0 auto' }}>
        <ImgCrop
          rotationSlider
          showGrid
          aspect={3 / 4}
          modalTitle="Rasmni kesish"
          modalOk="Kesish"
          modalCancel="Bekor qilish"
        >
          <Upload
            accept="image/*"
            maxCount={1}
            showUploadList={false}
            beforeUpload={(file) => {
              const isImage = file.type.startsWith('image/');
              const isSmall = file.size / 1024 / 1024 < 5;
              if (!isImage) {
                message.error('Faqat rasm yuklash mumkin');
                return Upload.LIST_IGNORE;
              }
              if (!isSmall) {
                message.error('Rasm hajmi 5MB dan kichik boʻlishi kerak');
                return Upload.LIST_IGNORE;
              }
              photo.upload(file);
              return false;
            }}
          >
            <Button icon={<UploadOutlined />} loading={photo.uploading}>
              {photo.url ? 'Almashtirish' : 'Rasm yuklash'}
            </Button>
          </Upload>
        </ImgCrop>
        {photo.url && !photo.uploading && (
          <Button icon={<DeleteOutlined />} danger onClick={photo.clear} aria-label="Rasmni oʻchirish" />
        )}
      </div>
    </div>
  );
}

/**
 * Footer with the recipient photo picker plus two buttons — "QR kod yuklab olish" (opens the QR
 * modal) and "Saqlash va Word yuklab olish" (submits the form) — plus the QR modal itself.
 * Place inside the <Form>.
 */
export function CertificateActions({
  submitting,
  onQrClick,
  qrOpen,
  qrId,
  closeQr,
  downloadQr,
  photo,
}: {
  submitting: boolean;
  onQrClick: () => void;
  qrOpen: boolean;
  qrId: string | null;
  closeQr: () => void;
  downloadQr: () => void;
  photo: CertificatePhotoState;
}) {
  return (
    <>
      <CertificatePhotoUpload photo={photo} />

      <Row gutter={12}>
        <Col span={12}>
          <Button block loading={submitting} onClick={onQrClick}>
            QR kod yuklab olish
          </Button>
        </Col>
        <Col span={12}>
          <Button type="primary" block htmlType="submit" loading={submitting}>
            Saqlash va Word yuklab olish
          </Button>
        </Col>
      </Row>

      <Modal
        title="Sertifikat QR-kodi"
        open={qrOpen}
        onCancel={closeQr}
        footer={[
          <Button key="download" type="primary" onClick={downloadQr}>
            Yuklab olish
          </Button>,
          <Button key="close" onClick={closeQr}>
            Yopish
          </Button>,
        ]}
      >
        {qrId && (
          <div style={{ textAlign: 'center', padding: 12 }}>
            <QRCode id={QR_CANVAS_ID} value={`https://ibms.uz/cert/${qrId}`} size={220} />
          </div>
        )}
      </Modal>
    </>
  );
}

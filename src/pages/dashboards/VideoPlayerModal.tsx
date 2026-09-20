import { Modal, Typography } from 'antd';
import { resolveVideoEmbedUrl } from '../course/courseUtils.ts';

const { Text } = Typography;

export type PlayerVideo = {
  title: string;
  link: string;
  topicTitle?: string;
};

/**
 * A lightweight, responsive video player rendered in a modal. Reuses the same embed-URL
 * resolver as the course learning page so YouTube/Vimeo/Boomstream links all play inline
 * instead of opening a new tab.
 */
export const VideoPlayerModal = ({
  video,
  open,
  onClose,
}: {
  video: PlayerVideo | null;
  open: boolean;
  onClose: () => void;
}) => {
  const embedUrl = video ? resolveVideoEmbedUrl(video.link) : undefined;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      destroyOnClose
      width="min(920px, calc(100vw - 32px))"
      title={
        video ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Text strong>{video.title}</Text>
            {video.topicTitle ? (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {video.topicTitle}
              </Text>
            ) : null}
          </div>
        ) : null
      }
      styles={{ body: { padding: 0 } }}
    >
      {embedUrl ? (
        <div
          style={{
            position: 'relative',
            width: '100%',
            paddingTop: '56.25%',
            background: '#000',
            borderRadius: '0 0 8px 8px',
            overflow: 'hidden',
          }}
        >
          <iframe
            src={embedUrl}
            title={video?.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
          />
        </div>
      ) : (
        <div style={{ padding: 32, textAlign: 'center' }}>
          <Text type="secondary">Videoni koʻrsatib boʻlmadi</Text>
        </div>
      )}
    </Modal>
  );
};

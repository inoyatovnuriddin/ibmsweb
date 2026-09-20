import { ReactNode } from 'react';
import { Card, Col, Row, Space, Tag, theme, Typography } from 'antd';
import { useSelector } from 'react-redux';
import type { RootState } from '../../redux/store.ts';

const { Title, Paragraph } = Typography;

type AdminPageFrameProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

type AdminSectionCardProps = {
  title?: ReactNode;
  extra?: ReactNode;
  children: ReactNode;
};

export const ADMIN_MODAL_STYLES = {
  content: {
    borderRadius: 24,
    overflow: 'hidden',
    boxShadow: 'var(--color-shadow-elevated)',
    background: 'var(--color-bg-elevated)',
    border: '1px solid var(--color-border)',
  },
  header: {
    padding: '20px 24px 14px',
    borderBottom: '1px solid var(--color-border)',
    background: 'var(--admin-modal-header-bg)',
  },
  body: {
    padding: '22px 24px 24px',
    maxHeight: 'calc(100vh - 220px)',
    overflowY: 'auto' as const,
    background: 'var(--color-bg-elevated)',
  },
  footer: {
    padding: '14px 24px 24px',
    borderTop: '1px solid var(--color-border)',
    background: 'var(--color-bg-elevated)',
  },
};

export const AdminPageFrame = ({
  eyebrow,
  title,
  subtitle,
  actions,
  children,
}: AdminPageFrameProps) => {
  const { token } = theme.useToken();
  const { mytheme } = useSelector((state: RootState) => state.theme);

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card
        style={{
          borderRadius: 24,
          border: `1px solid ${token.colorBorderSecondary}`,
          overflow: 'hidden',
          boxShadow: 'var(--color-shadow-soft)',
          background:
            mytheme === 'dark'
              ? token.colorBgElevated
              : 'linear-gradient(135deg, rgba(255,252,247,0.98) 0%, rgba(246,250,255,0.98) 100%)',
        }}
        bodyStyle={{ padding: 22 }}
      >
        <Row gutter={[24, 24]} justify="space-between" align="middle">
          <Col xs={24} xl={16}>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              {eyebrow ? (
                <Tag
                  style={{
                    width: 'fit-content',
                    margin: 0,
                    borderRadius: 999,
                    padding: '6px 12px',
                    background: mytheme === 'dark' ? 'rgba(37,99,235,0.18)' : '#ffffff',
                    border: '1px solid rgba(29, 78, 216, 0.18)',
                    color: mytheme === 'dark' ? '#93c5fd' : '#1d4ed8',
                  }}
                >
                  {eyebrow}
                </Tag>
              ) : null}
              <div>
                <Title
                  level={2}
                  style={{
                    margin: 0,
                    color: token.colorText,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {title}
                </Title>
                {subtitle ? (
                  <Paragraph
                    style={{
                      margin: '8px 0 0',
                      color: token.colorTextSecondary,
                      maxWidth: 760,
                    }}
                  >
                    {subtitle}
                  </Paragraph>
                ) : null}
              </div>
            </Space>
          </Col>
          {actions ? (
            <Col xs={24} xl={8}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                {actions}
              </div>
            </Col>
          ) : null}
        </Row>
      </Card>

      {children}
    </Space>
  );
};

export const AdminSectionCard = ({
  title,
  extra,
  children,
}: AdminSectionCardProps) => {
  const { token } = theme.useToken();

  return (
    <Card
      style={{
        borderRadius: 24,
        border: `1px solid ${token.colorBorderSecondary}`,
        boxShadow: 'var(--color-shadow-soft)',
      }}
      bodyStyle={{ padding: 20 }}
    >
      {title || extra ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            marginBottom: 16,
            flexWrap: 'wrap',
          }}
        >
          {title ? (
            <div>
              <Title level={4} style={{ margin: 0, color: token.colorText }}>
                {title}
              </Title>
            </div>
          ) : (
            <div />
          )}
          {extra}
        </div>
      ) : null}
      {children}
    </Card>
  );
};

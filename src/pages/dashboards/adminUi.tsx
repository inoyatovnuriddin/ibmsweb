import { ReactNode } from 'react';
import { Card, Col, Row, Space, Tag, Typography } from 'antd';

const { Title, Paragraph } = Typography;

type AdminPageFrameProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

type AdminSectionCardProps = {
  title?: string;
  extra?: ReactNode;
  children: ReactNode;
};

export const ADMIN_MODAL_STYLES = {
  content: {
    borderRadius: 24,
    overflow: 'hidden',
    boxShadow: '0 28px 60px rgba(15, 23, 42, 0.16)',
  },
  header: {
    padding: '20px 24px 14px',
    borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
    background:
      'linear-gradient(135deg, rgba(255,252,247,0.98) 0%, rgba(246,250,255,0.98) 100%)',
  },
  body: {
    padding: '22px 24px 24px',
    maxHeight: 'calc(100vh - 220px)',
    overflowY: 'auto' as const,
  },
  footer: {
    padding: '14px 24px 24px',
    borderTop: '1px solid rgba(148, 163, 184, 0.12)',
  },
};

export const AdminPageFrame = ({
  eyebrow,
  title,
  subtitle,
  actions,
  children,
}: AdminPageFrameProps) => {
  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card
        style={{
          borderRadius: 24,
          border: '1px solid rgba(148, 163, 184, 0.14)',
          overflow: 'hidden',
          boxShadow: '0 18px 40px rgba(15, 23, 42, 0.05)',
          background:
            'linear-gradient(135deg, rgba(255,252,247,0.98) 0%, rgba(246,250,255,0.98) 100%)',
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
                    background: '#ffffff',
                    border: '1px solid rgba(29, 78, 216, 0.12)',
                    color: '#1d4ed8',
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
                    color: '#102a43',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {title}
                </Title>
                {subtitle ? (
                  <Paragraph
                    style={{
                      margin: '8px 0 0',
                      color: '#486581',
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
  return (
    <Card
      style={{
        borderRadius: 24,
        border: '1px solid rgba(148, 163, 184, 0.14)',
        boxShadow: '0 16px 36px rgba(15, 23, 42, 0.05)',
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
              <Title level={4} style={{ margin: 0 }}>
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

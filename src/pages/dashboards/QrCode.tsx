import { Helmet } from 'react-helmet-async';
import {
  Button,
  Card,
  Col,
  Empty,
  Modal,
  Row,
  Tag,
  theme,
  Typography,
} from 'antd';
import { EyeOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useRef, useState } from 'react';
import { qrTemplates, TemplateDefinition } from './templates';
import { AdminPageFrame, AdminSectionCard } from './adminUi.tsx';
import { useAppTranslation } from '../../hooks/useAppTranslation.ts';
import './QrCode.css';

const { Title, Paragraph, Text } = Typography;

export function DashboardQrCodePage() {
  const { token } = theme.useToken();
  const { t } = useAppTranslation();
  const templateSliderRef = useRef<HTMLDivElement | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<TemplateDefinition | null>(
    null
  );
  const [previewTemplate, setPreviewTemplate] = useState<TemplateDefinition | null>(null);

  // Fall back to the registry title/description when a template has no i18n entry,
  // so newly added templates don't render their raw translation key.
  const getTemplateTitle = (template: TemplateDefinition) => {
    const key = `dashboard.qrCode.templates.${template.id}.title`;
    const translated = t(key);
    return translated === key ? template.title : translated;
  };

  const getTemplateDescription = (template: TemplateDefinition) => {
    // const key = `dashboard.qrCode.templates.${template.id}.description`;
    // const translated = t(key);
    // return translated === key ? template.description : translated;
    console.log(template);
    return null;
  };

  const handleTemplateSelect = (template: TemplateDefinition) => {
    setActiveTemplate(template);
    setPreviewTemplate(null);
  };

  const scrollTemplateSlider = (direction: 'left' | 'right') => {
    const slider = templateSliderRef.current;
    if (!slider) return;

    slider.scrollBy({
      left: direction === 'left' ? -320 : 320,
      behavior: 'smooth',
    });
  };

  return (
    <div>
      <Helmet>
        <title>{t('dashboard.qrCode.pageTitle')}</title>
      </Helmet>

      <AdminPageFrame
        eyebrow={t('dashboard.qrCode.eyebrow')}
        title={t('dashboard.qrCode.title')}
        subtitle={t('dashboard.qrCode.subtitle')}
        actions={
          <Row gutter={8} wrap={false}>
            <Col>
              <Button
                icon={<LeftOutlined />}
                aria-label={t('dashboard.qrCode.scrollLeft')}
                onClick={() => scrollTemplateSlider('left')}
              />
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<RightOutlined />}
                aria-label={t('dashboard.qrCode.scrollRight')}
                onClick={() => scrollTemplateSlider('right')}
              />
            </Col>
          </Row>
        }
      >
        <AdminSectionCard
          title={t('dashboard.qrCode.libraryTitle')}
          extra={
            <Text style={{ color: token.colorTextSecondary }}>
              {t('dashboard.qrCode.libraryHint')}
            </Text>
          }
        >
          <div
            ref={templateSliderRef}
            className="qr-template-grid"
            style={{
              display: 'flex',
              gap: 16,
              overflowX: 'auto',
              scrollBehavior: 'smooth',
              paddingBottom: 8,
            }}
          >
            {qrTemplates.map((template) => (
              <Card
                key={template.id}
                hoverable
                onClick={() => setPreviewTemplate(template)}
                className={`qr-template-card${
                  activeTemplate?.id === template.id ? ' is-selected' : ''
                }`}
                style={{
                  flex: '0 0 260px',
                  borderRadius: 22,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderStyle: 'solid',
                  background:
                    activeTemplate?.id === template.id
                      ? `linear-gradient(180deg, ${token.colorBgContainer} 0%, ${token.colorFillAlter} 100%)`
                      : token.colorBgContainer,
                  borderColor:
                    activeTemplate?.id === template.id
                      ? 'rgba(29,78,216,0.34)'
                      : token.colorBorderSecondary,
                  boxShadow:
                    activeTemplate?.id === template.id
                      ? '0 18px 40px rgba(29,78,216,0.10)'
                      : token.colorBgBase === '#000'
                        ? '0 16px 34px rgba(0,0,0,0.18)'
                        : '0 10px 26px rgba(15,23,42,0.04)',
                }}
                bodyStyle={{ display: 'none' }}
                cover={
                  <div
                    className="qr-template-card__media"
                    style={{
                      height: 188,
                      overflow: 'hidden',
                      position: 'relative',
                      background: token.colorFillAlter,
                    }}
                  >
                    <img
                      src={template.image}
                      alt={getTemplateTitle(template)}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div
                      className="qr-template-card__overlay"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.6)',
                      }}
                    />
                    <div
                      className="qr-template-card__content"
                      style={{
                        position: 'absolute',
                        left: 16,
                        right: 16,
                        top: 16,
                        bottom: 16,
                        display: 'grid',
                        alignContent: 'end',
                        gap: 12,
                      }}
                    >
                      <div className="qr-template-card__top">
                        <Tag
                          style={{
                            margin: 0,
                            borderRadius: 999,
                            paddingInline: 10,
                            background: 'rgba(255,255,255,0.9)',
                            color: '#102a43',
                            border: 'none',
                            fontWeight: 700,
                          }}
                        >
                          {template.isSystem
                            ? t('dashboard.qrCode.systemBadge')
                            : t('dashboard.qrCode.customBadge')}
                        </Tag>
                        {activeTemplate?.id === template.id ? (
                          <Tag color="processing" style={{ margin: 0, borderRadius: 999 }}>
                            {t('dashboard.qrCode.selected')}
                          </Tag>
                        ) : null}
                      </div>

                      <div className="qr-template-card__bottom">
                        <Title
                          level={5}
                          style={{ margin: 0, color: '#fff', fontSize: 20, lineHeight: 1.3 }}
                        >
                          {getTemplateTitle(template)}
                        </Title>
                        <Paragraph
                          style={{
                            margin: 0,
                            color: 'rgba(255,255,255,0.84)',
                            fontSize: 14,
                          }}
                        >
                          {getTemplateDescription(template)}
                        </Paragraph>
                        <Text style={{ color: '#fff', fontWeight: 600 }}>
                          {activeTemplate?.id === template.id
                            ? t('dashboard.qrCode.previewSelected')
                            : t('dashboard.qrCode.previewAction')}
                        </Text>
                      </div>
                    </div>
                  </div>
                }
              />
            ))}
          </div>
        </AdminSectionCard>

        {activeTemplate ? (
          <activeTemplate.FormComponent />
        ) : (
          <AdminSectionCard title={t('dashboard.qrCode.formTitle')}>
            <Empty description={t('dashboard.qrCode.selectFirst')} />
          </AdminSectionCard>
        )}

        <Modal
          open={!!previewTemplate}
          onCancel={() => setPreviewTemplate(null)}
          footer={null}
          width={960}
          centered
          destroyOnClose
          title={previewTemplate ? getTemplateTitle(previewTemplate) : undefined}
          styles={{
            content: {
              background: token.colorBgElevated,
              border: `1px solid ${token.colorBorderSecondary}`,
              borderRadius: 24,
            },
            header: {
              background: 'transparent',
              borderBottom: `1px solid ${token.colorBorderSecondary}`,
            },
            body: {
              paddingTop: 20,
            },
          }}
        >
          {previewTemplate ? (
            <div
              style={{
                display: 'grid',
                gap: 18,
              }}
            >
              <div
                style={{
                  borderRadius: 22,
                  overflow: 'hidden',
                  border: `1px solid ${token.colorBorderSecondary}`,
                  background: token.colorFillAlter,
                }}
              >
                <img
                  src={previewTemplate.image}
                  alt={getTemplateTitle(previewTemplate)}
                  style={{
                    width: '100%',
                    maxHeight: 520,
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                }}
              >
                <div style={{ maxWidth: 620 }}>
                  <Paragraph
                    style={{
                      marginBottom: 10,
                      color: token.colorTextSecondary,
                      fontSize: 15,
                    }}
                  >
                    {getTemplateDescription(previewTemplate)}
                  </Paragraph>
                  <Tag style={{ borderRadius: 999, margin: 0 }}>
                    {previewTemplate.isSystem
                      ? t('dashboard.qrCode.systemBadge')
                      : t('dashboard.qrCode.customBadge')}
                  </Tag>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: 12,
                    flexWrap: 'wrap',
                    justifyContent: 'flex-end',
                  }}
                >
                  <Button
                    size="large"
                    style={{ borderRadius: 14 }}
                    onClick={() => setPreviewTemplate(null)}
                  >
                    {t('dashboard.qrCode.closePreview')}
                  </Button>
                  <Button
                    type="primary"
                    size="large"
                    icon={<EyeOutlined />}
                    style={{ borderRadius: 14 }}
                    onClick={() => handleTemplateSelect(previewTemplate)}
                  >
                    {t('dashboard.qrCode.useTemplate')}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </Modal>
      </AdminPageFrame>
    </div>
  );
}

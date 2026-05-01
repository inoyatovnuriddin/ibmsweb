import { Helmet } from 'react-helmet-async';
import { Button, Card, Col, Empty, Row, Tag, Typography } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useRef, useState } from 'react';
import { qrTemplates, TemplateDefinition } from './templates';
import { AdminPageFrame, AdminSectionCard } from './adminUi.tsx';

const { Title, Paragraph, Text } = Typography;

export function DashboardQrCodePage() {
  const templateSliderRef = useRef<HTMLDivElement | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<TemplateDefinition | null>(
    null
  );

  const handleTemplateSelect = (template: TemplateDefinition) => {
    setActiveTemplate(template);
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
        <title>QR-kod | Admin panel</title>
      </Helmet>

      <AdminPageFrame
        eyebrow="QR moduli"
        title="QR shablonlar boshqaruvi"
        subtitle="Sertifikat, yo‘llanma va boshqa hujjatlar uchun QR shablonlarni tanlang va keyingi bosqichda to‘ldiring."
        actions={
          <Row gutter={8} wrap={false}>
            <Col>
              <Button icon={<LeftOutlined />} onClick={() => scrollTemplateSlider('left')} />
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<RightOutlined />}
                onClick={() => scrollTemplateSlider('right')}
              />
            </Col>
          </Row>
        }
      >
        <AdminSectionCard title="Shablon kutubxonasi">
          <div
            ref={templateSliderRef}
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
                onClick={() => handleTemplateSelect(template)}
                style={{
                  flex: '0 0 300px',
                  borderRadius: 22,
                  borderColor:
                    activeTemplate?.id === template.id
                      ? 'rgba(29,78,216,0.34)'
                      : 'rgba(148,163,184,0.14)',
                  boxShadow:
                    activeTemplate?.id === template.id
                      ? '0 18px 40px rgba(29,78,216,0.10)'
                      : '0 10px 26px rgba(15,23,42,0.04)',
                }}
                cover={
                  <div style={{ height: 176, overflow: 'hidden', background: '#f8fafc' }}>
                    <img
                      src={template.image}
                      alt={template.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                }
              >
                <Row justify="space-between" align="top" gutter={8}>
                  <Col flex="auto">
                    <Title level={5} style={{ marginBottom: 6 }}>
                      {template.title}
                    </Title>
                  </Col>
                  <Col>
                    {template.isSystem ? <Tag color="blue">System</Tag> : null}
                  </Col>
                </Row>

                <Paragraph ellipsis={{ rows: 2 }} style={{ minHeight: 44, color: '#64748b' }}>
                  {template.description || 'Shablon tavsifi mavjud emas'}
                </Paragraph>

                {activeTemplate?.id === template.id ? (
                  <Tag color="processing">Tanlangan</Tag>
                ) : (
                  <Text style={{ color: '#64748b' }}>Tanlash uchun bosing</Text>
                )}
              </Card>
            ))}
          </div>
        </AdminSectionCard>

        {activeTemplate ? (
          <>
            <AdminSectionCard title="Tanlangan shablon">
              <Paragraph style={{ marginBottom: 0 }}>
                <Tag color="processing">{activeTemplate.title}</Tag> asosida forma
                ochildi. Kerakli ma'lumotlarni quyida to‘ldiring.
              </Paragraph>
            </AdminSectionCard>
            <activeTemplate.FormComponent />
          </>
        ) : (
          <AdminSectionCard title="Forma">
            <Empty description="Avval yuqoridan shablon tanlang" />
          </AdminSectionCard>
        )}
      </AdminPageFrame>
    </div>
  );
}

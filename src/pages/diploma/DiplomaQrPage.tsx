import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Avatar, Button, Card, Col, Row, Space, Spin, Typography } from 'antd';
import QRCode from 'qrcode.react';
import { apiClient } from '../../services/api';

const { Title, Paragraph, Text } = Typography;

interface User {
  id: string;
  firstname: string;
  lastname: string;
  userImage?: string | null;
}

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
}

interface StudyPeriod {
  start: string;
  end: string;
}

interface Diploma {
  id: string;
  diplomaNumber: string;
  user: User;
  course: Course;
  rank: number;
  protocolNumber: string;
  protocolDate: string;
  issueDate: string;
  master?: string;
  director?: string;
  studyPeriod: StudyPeriod;
}

export function DiplomaQrPage() {
  const { diplomaId } = useParams<{ diplomaId: string }>();
  const [diploma, setDiploma] = useState<Diploma | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDiploma() {
      try {
        const res = await apiClient.get(`/v1/diploma/${diplomaId}`);
        setDiploma(res.data.payload);
      } catch (err) {
        console.error("Не удалось загрузить диплом:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDiploma();
  }, [diplomaId]);

  if (loading) return <Spin tip="Загрузка..." size="large" />;
  if (!diploma) return <div>Диплом не найден!</div>;

  const fullName = `${diploma.user.firstname} ${diploma.user.lastname}`;

  return (
    <Row justify="center" style={{ marginTop: 40 }}>
      <Col xs={22} sm={20} md={16} lg={12}>
        <Card
          style={{
            borderRadius: 16,
            boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
            padding: 24,
          }}
        >
          <Row justify="space-between" align="middle">
            <Col>
              {diploma.user.userImage ? (
                <Avatar
                  src={diploma.user.userImage}
                  size={96}
                  style={{ marginRight: 16 }}
                />
              ) : (
                <Avatar size={96} style={{ marginRight: 16 }}>
                  {fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </Avatar>
              )}
            </Col>
            <Col>
              <QRCode
                value={`https://ibms.uz/diploma/${diploma.id}/qr`}
                size={120}
              />
            </Col>
          </Row>

          <Title level={3} style={{ marginTop: 24 }}>
            Диплом №{diploma.diplomaNumber}
          </Title>

          <Paragraph>
            <Text strong>Пользователь:</Text> {fullName}
          </Paragraph>
          <Paragraph>
            <Text strong>Курс:</Text> {diploma.course.title}
          </Paragraph>
          <Paragraph>
            <Text strong>Преподаватель:</Text> {diploma.course.instructor}
          </Paragraph>
          <Paragraph>
            <Text strong>Разряд:</Text> {diploma.rank} разряд
          </Paragraph>
          <Paragraph>
            <Text strong>Номер протокола:</Text> {diploma.protocolNumber} |{" "}
            {diploma.protocolDate}
          </Paragraph>
          <Paragraph>
            <Text strong>Дата выдачи:</Text> {diploma.issueDate}
          </Paragraph>
          <Paragraph>
            <Text strong>Период обучения:</Text> {diploma.studyPeriod.start} /{" "}
            {diploma.studyPeriod.end}
          </Paragraph>
          {diploma.master && (
            <Paragraph>
              <Text strong>Мастер:</Text> {diploma.master}
            </Paragraph>
          )}
          {diploma.director && (
            <Paragraph>
              <Text strong>Директор:</Text> {diploma.director}
            </Paragraph>
          )}

          {/* Buttons */}
          <Space style={{ marginTop: 24 }}>
            <Button type="primary">Лицензия</Button>
            <Button type="default">Свидетельство</Button>
          </Space>
        </Card>
      </Col>
    </Row>
  );
}

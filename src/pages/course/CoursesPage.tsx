import { useState } from 'react';
import { Table, Input, Button, Card, Row, Col, Grid, Typography, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import { BookOutlined, UserOutlined } from '@ant-design/icons';

const { Search } = Input;
const { useBreakpoint } = Grid;
const { Title, Paragraph } = Typography;

type Course = {
  key: string;
  title: string;
  description: string;
  instructor: string;
};

export const CoursesPage = () => {
  const screens = useBreakpoint();
  const [searchText, setSearchText] = useState<string>('');
  const [courses] = useState<Course[]>([
    {
      key: '1',
      title: 'Курс 1',
      description: 'Бу курс Java Spring Boot асосларини ўрганиш учун мўлжалланган.',
      instructor: 'Устоз Алиев',
    },
    {
      key: '2',
      title: 'Курс 2',
      description: 'ReactJS фреймворки билан front-end дастурлашни ўрганинг.',
      instructor: 'Устоз Иброҳимов',
    },
    {
      key: '3',
      title: 'Курс 3',
      description: 'Тўлиқ Stack Web Developer бўлиш учун йўл харитаси.',
      instructor: 'Устоз Раҳматов',
    },
  ]);

  const navigate = useNavigate();
  const isMobile = !screens.md;

  const onSearch = (value: string) => setSearchText(value);

  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'Тартиб рақами',
      dataIndex: 'key',
      key: 'key',
      render: (_: string, __: Course, index: number) => index + 1,
    },
    {
      title: 'Курс номи',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Тавсиф',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Инструктор',
      dataIndex: 'instructor',
      key: 'instructor',
    },
    {
      title: 'Алоҳида кўриш',
      key: 'action',
      render: (_: any, record: Course) => (
        <Button type="primary" onClick={() => navigate(`/course/${record.key}`)}>
          Кўриш
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <Title level={2}>Курслар</Title>
      <Search
        placeholder="Курс номи бўйича қидириш"
        onSearch={onSearch}
        allowClear
        style={{ marginBottom: '20px', maxWidth: '320px' }}
      />

      {isMobile ? (
        <Row gutter={[16, 16]}>
          {filteredCourses.map((course) => (
            <Col xs={24} sm={12} key={course.key}>
              <Card
                hoverable
                style={{
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
                bodyStyle={{ padding: '20px' }}
              >
                <div>
                  <Title level={4} style={{ marginBottom: '10px' }}>
                    <BookOutlined style={{ marginRight: 8, color: '#1677ff' }} />
                    {course.title}
                  </Title>
                  <Paragraph ellipsis={{ rows: 2 }}>{course.description}</Paragraph>
                </div>

                <div style={{ marginTop: '20px' }}>
                  <Tag icon={<UserOutlined />} color="blue">
                    {course.instructor}
                  </Tag>

                  <Button
                    type="primary"
                    block
                    style={{ marginTop: '10px' }}
                    onClick={() => navigate(`/course/${course.key}`)}
                  >
                    Кўриш
                  </Button>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Table
          columns={columns}
          dataSource={filteredCourses}
          rowKey="key"
          pagination={false}
        />
      )}
    </div>
  );
};

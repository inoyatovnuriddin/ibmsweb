import { useState } from 'react';
import {
  Row,
  Col,
  Layout,
  Menu,
  Tabs,
  Button,
  Typography,
  Space,
  Grid,
} from 'antd';
import {
  FolderOpenOutlined,
  PlayCircleOutlined,
  CheckCircleTwoTone,
  MenuOutlined,
  SnippetsOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useParams } from 'react-router-dom';
import { useMediaQuery } from 'react-responsive';

const { Title } = Typography;
const { Sider, Content, Header } = Layout;
const { TabPane } = Tabs;
const { useBreakpoint } = Grid;

export const ViewCourse = () => {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [watchedVideos, setWatchedVideos] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState<boolean>(true); // Sidebar collapsed state
  const isMobile = useMediaQuery({ maxWidth: 769 });

  const screens = useBreakpoint(); // Detect screen size for responsiveness
  const navigate = useNavigate();
  const { courseId } = useParams();
  const responsivePadding = screens.xs ? '0px' : screens.sm ? '10px' : '20px';
  const topics = [
    {
      title: 'Mавзу 1',
      videos: ['Видео 1', 'Видео 2', 'Видео 3'],
    },
    {
      title: 'Mавзу 2',
      videos: ['Видео 4', 'Видео 5', 'Видео 6'],
    },
    {
      title: 'Mавзу 3',
      videos: ['Видео 7', 'Видео 8', 'Видео 9'],
    },
  ];

  const handleVideoSelect = (video: string) => {
    setSelectedVideo(video);
    if (!watchedVideos.includes(video)) {
      setWatchedVideos([...watchedVideos, video]);
    }
  };

  const handleNavigateToTest = () => {
    navigate(`/course/${courseId}/test`); // Navigate to the test page
  };

  const isTestPage = location.pathname.includes(`/course/${courseId}/test`);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sider
        width={250}
        style={{
          backgroundColor: '#f4f4f4',
          height: '100vh',
          position: screens.lg ? 'fixed' : 'absolute',
          left: collapsed && !screens.lg ? '-250px' : '0',
          top: '65px',
          zIndex: 1000,
          transition: 'left 0.3s ease', // Smooth sliding transition
          boxShadow: '2px 0 8px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Close Button (Visible only on mobile) */}
        {!screens.lg && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              padding: '8px',
            }}
          >
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={() => setCollapsed(true)} // Close the sidebar
            />
          </div>
        )}
        <Menu mode="inline" defaultSelectedKeys={['1']}>
          {topics.map((topic, index) => (
            <Menu.SubMenu
              key={index}
              icon={<FolderOpenOutlined />}
              title={topic.title}
            >
              {topic.videos.map((video, videoIndex) => (
                <Menu.Item
                  key={`video-${index}-${videoIndex}`}
                  onClick={() => handleVideoSelect(video)}
                  icon={
                    watchedVideos.includes(video) ? (
                      <CheckCircleTwoTone twoToneColor="#52c41a" />
                    ) : (
                      <PlayCircleOutlined />
                    )
                  }
                >
                  {video}
                </Menu.Item>
              ))}
              <Menu.Item
                onClick={handleNavigateToTest} // Navigate to "test"
                icon={<SnippetsOutlined />}
                style={{ fontStyle: 'italic', fontWeight: 'bold' }}
              >
                Тестни ечиш
              </Menu.Item>
            </Menu.SubMenu>
          ))}
        </Menu>
      </Sider>

      {/* Overlay for Mobile */}
      {!screens.lg && !collapsed && (
        <div
          onClick={() => setCollapsed(true)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            zIndex: 999,
          }}
        />
      )}

      {/* Main Content */}
      <Layout
        style={{
          marginLeft: screens.lg ? 250 : 0, // Adjust margin for desktop
          transition: 'margin-left 0.3s ease', // Smooth transition for margin
          padding: '16px',
        }}
      >
        <Header style={{ background: 'none', padding: 0 }}>
          {!screens.lg && (
            <Button
              icon={<MenuOutlined />}
              onClick={() => setCollapsed(false)} // Open sidebar
              style={{ marginBottom: '16px' }}
            >
              Меню
            </Button>
          )}
        </Header>

        <Content
          style={{
            padding: responsivePadding,
            margin: 0,
            minHeight: 280,
            background: '#fff',
            borderRadius: '8px',
          }}
        >
          {!isTestPage && <Title level={2}>Курсни ўрганиш</Title>}
          {!isTestPage && (
            <Row gutter={[24, 24]}>
              <Col xs={24} lg={16}>
                {selectedVideo ? (
                  <div>
                    <Title level={4}>Танланган видео: {selectedVideo}</Title>
                    <div
                      style={{
                        height: '400px',
                        backgroundColor: '#000',
                        color: '#fff',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderRadius: '8px',
                      }}
                    >
                      <span style={{ fontSize: '24px' }}>
                        Видеонинг мазмуни
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Space direction="vertical" size="large">
                      <Title level={4}>Курс видеоларини танланг</Title>
                      <Button type="primary">Курсни бошлаш</Button>
                    </Space>
                  </div>
                )}
              </Col>
              {isMobile && (
                <Col xs={24} lg={8}>
                  <Tabs defaultActiveKey="1">
                    {topics.map((topic, index) => (
                      <TabPane tab={topic.title} key={index}>
                        <div style={{ marginBottom: '16px' }}>
                          {topic.videos.map((video, videoIndex) => (
                            <Button
                              key={videoIndex}
                              block
                              icon={
                                watchedVideos.includes(video) ? (
                                  <CheckCircleTwoTone twoToneColor="#52c41a" />
                                ) : (
                                  <PlayCircleOutlined />
                                )
                              }
                              onClick={() => handleVideoSelect(video)}
                              style={{ textAlign: 'left' }}
                            >
                              {video}
                            </Button>
                          ))}
                          <Button
                            block
                            type="dashed"
                            style={{ marginTop: 12 }}
                            onClick={handleNavigateToTest}
                          >
                            Тестни ечиш
                          </Button>
                        </div>
                      </TabPane>
                    ))}
                  </Tabs>
                </Col>
              )}
            </Row>
          )}
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

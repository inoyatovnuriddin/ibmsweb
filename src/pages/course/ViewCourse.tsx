import React, { useState } from 'react';
import { Row, Col, Layout, Menu, Tabs, Button, Typography, Space } from 'antd';
import { FolderOpenOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Sider, Content } = Layout;
const { TabPane } = Tabs;

const CoursePage = () => {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  const topics = [
    {
      title: 'Mavzu 1',
      videos: ['Video 1', 'Video 2', 'Video 3'],
    },
    {
      title: 'Mavzu 2',
      videos: ['Video 4', 'Video 5', 'Video 6'],
    },
    {
      title: 'Mavzu 3',
      videos: ['Video 7', 'Video 8', 'Video 9'],
    },
  ];

  const handleVideoSelect = (video: string) => {
    setSelectedVideo(video);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={250} style={{ backgroundColor: '#f4f4f4' }}>
        <Menu mode="inline" defaultSelectedKeys={['1']}>
          {topics.map((topic, index) => (
            <Menu.SubMenu key={index} icon={<FolderOpenOutlined />} title={topic.title}>
              {topic.videos.map((video, videoIndex) => (
                <Menu.Item
                  key={`video-${index}-${videoIndex}`}
                  onClick={() => handleVideoSelect(video)}
                >
                  {video}
                </Menu.Item>
              ))}
            </Menu.SubMenu>
          ))}
        </Menu>
      </Sider>

      <Layout style={{ padding: '0 24px 24px' }}>
        <Content
          style={{
            padding: 24,
            margin: 0,
            minHeight: 280,
            background: '#fff',
            borderRadius: '8px',
          }}
        >
          <Title level={2}>Курсни ўрганиш</Title>
          <Row gutter={[24, 24]}>
            <Col span={18}>
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
                    }}
                  >
                    <span style={{ fontSize: '24px' }}>Видеонинг мазмуни</span>
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
            <Col span={6}>
              <Tabs defaultActiveKey="1">
                {topics.map((topic, index) => (
                  <TabPane tab={topic.title} key={index}>
                    <div style={{ marginBottom: '16px' }}>
                      {topic.videos.map((video, videoIndex) => (
                        <Button
                          key={videoIndex}
                          block
                          onClick={() => handleVideoSelect(video)}
                        >
                          {video}
                        </Button>
                      ))}
                    </div>
                  </TabPane>
                ))}
              </Tabs>
            </Col>
          </Row>
        </Content>
      </Layout>
    </Layout>
  );
};

export default CoursePage;

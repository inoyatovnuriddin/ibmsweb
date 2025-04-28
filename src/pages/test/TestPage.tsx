import React, { useState } from 'react';
import {
  Layout,
  Card,
  Typography,
  Radio,
  Space,
  Button,
  Progress,
  message,
  Grid,
  Row,
  Col,
} from 'antd';

const { Header, Content, Footer } = Layout;
const { Title, Paragraph } = Typography;
const { useBreakpoint } = Grid;

export const TestPage = () => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState<boolean>(false);
  const screens = useBreakpoint();

  const questions = [
    {
      id: 1,
      question: 'Котибларнинг қандай вазифаси бор?',
      options: [
        { id: 'a', text: 'Машиналарни таъмирлаш' },
        { id: 'b', text: 'Ҳужжатларни расмийлаштириш' },
        { id: 'c', text: 'Соғликни сақлаш' },
      ],
      correctAnswer: 'b',
    },
    {
      id: 2,
      question: 'JavaScriptнинг асосий функцияси нима?',
      options: [
        { id: 'a', text: 'Веб саҳифаларни тартибга солиш ' },
        { id: 'b', text: 'Кўргазмали тасвирлар чизиш' },
        { id: 'c', text: 'Интерактивликни таъминлаш' },
      ],
      correctAnswer: 'c',
    },
    {
      id: 3,
      question: 'React компонентларининг асосий вазифаси нима?',
      options: [
        { id: 'a', text: 'HTML код ёзиш' },
        { id: 'b', text: 'UI ни йиғиш ва бошқариш' },
        { id: 'c', text: 'Маълумотларни сақлаш' },
      ],
      correctAnswer: 'b',
    },
  ];

  const handleAnswerSelect = (questionId: number, answerId: string) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: answerId }));
  };

  const handleSubmit = () => {
    if (Object.keys(selectedAnswers).length < questions.length) {
      message.warning('Iltimos, barcha savollarga javob bering!');
      return;
    }
    setSubmitted(true);
    let score = 0;
    questions.forEach(q => {
      if (selectedAnswers[q.id] === q.correctAnswer) score++;
    });
    message.success(`Siz ${score} / ${questions.length} savolni to'g'ri yechdingiz!`);
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setSubmitted(false);
  };

  const progressPercent =
    questions.length > 0
      ? Math.round((Object.keys(selectedAnswers).length / questions.length) * 100)
      : 0;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          background: 'linear-gradient(135deg, #4b6cb7, #182848)',
          padding: screens.xs ? '12px 16px' : '24px 48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Title level={screens.xs ? 4 : 2} style={{ color: '#fff', margin: 0 }}>
          Тестни ечиш
        </Title>
      </Header>

      <Content style={{ padding: screens.xs ? '10px 8px' : '10px 24px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ maxWidth: 900, width: '100%' }}>
          <Card bordered={false} style={{ marginBottom: '24px', borderRadius: '12px' }}>
            <Paragraph style={{ fontSize: '16px' }}>
              Quyidagi savollarga javob bering va testni topshiring. Savollarga to'liq javob berish shart!
            </Paragraph>
            <Progress
              percent={progressPercent}
              status="active"
              strokeColor={{ from: '#4b6cb7', to: '#182848' }}
              style={{ width: '100%' }}
            />
          </Card>

          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {questions.map((question, index) => (
              <Card
                key={question.id}
                style={{
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  transition: 'transform 0.3s',
                }}
                hoverable={!submitted}
                onMouseEnter={e => {
                  if (!submitted) (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.02)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
                }}
              >
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Title level={screens.xs ? 5 : 4} style={{ marginBottom: '8px' }}>
                      {index + 1}. {question.question}
                    </Title>
                  </Col>
                  <Col span={24}>
                    <Radio.Group
                      onChange={(e) => handleAnswerSelect(question.id, e.target.value)}
                      value={selectedAnswers[question.id]}
                      disabled={submitted}
                      style={{ width: '100%' }}
                    >
                      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                        {question.options.map(option => (
                          <Radio
                            key={option.id}
                            value={option.id}
                            style={{
                              fontSize: screens.xs ? '14px' : '16px',
                              lineHeight: '32px',
                              display: 'block',
                              padding: '8px 16px',
                              borderRadius: '6px',
                              border: '1px solid #f0f0f0',
                              width: '100%',
                              hyphens: 'auto',       
                              overflowWrap: 'break-word', 
                              wordBreak: 'break-word',    
                              whiteSpace: 'normal',
                            }}
                          >
                            {option.text}
                          </Radio>
                        ))}
                      </Space>
                    </Radio.Group>
                  </Col>
                  {submitted && (
                    <Col span={24}>
                      <Paragraph
                        style={{
                          marginTop: '16px',
                          fontWeight: 'bold',
                          color:
                            selectedAnswers[question.id] === question.correctAnswer
                              ? 'green'
                              : 'red',
                          backgroundColor:
                            selectedAnswers[question.id] === question.correctAnswer
                              ? '#e6fffb'
                              : '#fff1f0',
                          padding: '8px 16px',
                          borderRadius: '6px',
                        }}
                      >
                        {selectedAnswers[question.id] === question.correctAnswer
                          ? 'Тўғри жавоб'
                          : `Нотўғри жавоб. Тўғри жавоб: ${
                            question.options.find(o => o.id === question.correctAnswer)?.text
                          }`}
                      </Paragraph>
                    </Col>
                  )}
                </Row>
              </Card>
            ))}
          </Space>

          <Row justify="center" style={{ marginTop: '24px' }} gutter={[16, 16]}>
            <Col xs={24} sm="auto">
              <Button type="primary" size="large" block={screens.xs} onClick={handleSubmit} disabled={submitted}>
                Тестни топшириш
              </Button>
            </Col>
            <Col xs={24} sm="auto">
              <Button size="large" block={screens.xs} onClick={handleReset} disabled={!submitted}>
                Янгилаш
              </Button>
            </Col>
          </Row>
        </div>
      </Content>

      <Footer style={{ textAlign: 'center', padding: '12px 0', background: '#f0f2f5' }}>
        © 2025 Мening Kurslar Имтиҳон. Barcha huquqlar himoyalangan.
      </Footer>
    </Layout>
  );
};

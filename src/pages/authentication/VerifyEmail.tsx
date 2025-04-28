import { Button, Flex, Typography } from 'antd';
import { Logo } from '../../components';
import { Link, useSearchParams } from 'react-router-dom';
import { PATH_DASHBOARD } from '../../constants';

export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || 'sizning email manzilingiz';

  return (
    <Flex
      vertical
      align="center"
      justify="center"
      style={{ height: '100vh', background: '#f0f4f8', padding: '0 16px' }}
    >
      <Flex
        vertical
        align="center"
        style={{
          background: '#fff',
          padding: '40px 24px',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          maxWidth: 500,
          width: '100%',
          textAlign: 'center',
        }}
        gap="middle"
      >
        <Logo color="blue" />

        <Typography.Title level={3} style={{ marginBottom: 0 }}>
          Электрон почтани тасдиқланг
        </Typography.Title>

        <Typography.Text style={{ fontSize: 16 }}>
          Биз <Typography.Text strong>{email}</Typography.Text> манзилига
          тасдиқлаш хати юбордик. Илтимос, хатдаги ҳаволани босиб электрон
          почтангизни тасдиқланг.
        </Typography.Text>

        <Button type="primary" size="large" block>
          <Link to={PATH_DASHBOARD.default}>Тасдиқлашни кейинроқ қилиш</Link>
        </Button>

        <Flex justify="center" align="center" gap={4}>
          <Typography.Text>Хат келмадими?</Typography.Text>
          <Typography.Link onClick={() => alert('Resend link!')}>
            Қайта юбориш
          </Typography.Link>
        </Flex>
      </Flex>
    </Flex>
  );
};

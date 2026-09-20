import { Button, Flex, Typography } from 'antd';
import { Logo } from '../../components';
import { Link, useSearchParams } from 'react-router-dom';
import { PATH_LANDING } from '../../constants';
import { useAppTranslation } from '../../hooks/useAppTranslation.ts';

export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const { t } = useAppTranslation();
  const email = searchParams.get('email') || t('auth.form.email');

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
          {t('auth.verifyEmail.title')}
        </Typography.Title>

        <Typography.Text style={{ fontSize: 16 }}>
          {t('auth.verifyEmail.description').replace('{email}', email)}
        </Typography.Text>

        <Button type="primary" size="large" block>
          <Link to={PATH_LANDING.root}>{t('auth.verifyEmail.later')}</Link>
        </Button>

        <Flex justify="center" align="center" gap={4}>
          <Typography.Text>{t('auth.verifyEmail.notReceived')}</Typography.Text>
          <Typography.Link onClick={() => alert('Resend link!')}>
            {t('auth.verifyEmail.resend')}
          </Typography.Link>
        </Flex>
      </Flex>
    </Flex>
  );
};

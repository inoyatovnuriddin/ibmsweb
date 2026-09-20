import { useEffect } from 'react';
import { Button, Flex, Typography } from 'antd';
import { Logo } from '../../components';
import { Link, useNavigate } from 'react-router-dom';
import { PATH_LANDING } from '../../constants';
import { useAppTranslation } from '../../hooks/useAppTranslation.ts';

export const WelcomePage = () => {
  const navigate = useNavigate();
  const { t } = useAppTranslation();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/');
    }, 10000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <Flex
      vertical
      gap="large"
      align="center"
      justify="center"
      style={{ height: '80vh', textAlign: 'center', padding: '0 16px' }}
    >
      {/* Logo */}
      <Logo color="blue" />

      {/* Title */}
      <Typography.Title className="m-0" level={2}>
        {t('auth.welcome.title')}
      </Typography.Title>

      {/* Description */}
      <Typography.Text style={{ fontSize: 18 }}>
        {t('auth.welcome.description')}
      </Typography.Text>

      {/* Manual link */}
      <Link to={PATH_LANDING.root}>
        <Button type="primary" size="middle">
          {t('auth.welcome.home')}
        </Button>
      </Link>
    </Flex>
  );
};

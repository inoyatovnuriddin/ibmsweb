import { useEffect } from 'react';
import { Button, Flex, Typography } from 'antd';
import { Logo } from '../../components';
import { Link, useNavigate } from 'react-router-dom';
import { PATH_LANDING } from '../../constants';

export const WelcomePage = () => {
  const navigate = useNavigate();

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
        Рўйхатдан ўтганингиз учун раҳмат!
      </Typography.Title>

      {/* Description */}
      <Typography.Text style={{ fontSize: 18 }}>
        Сизнинг аккаунтингиз муваффақиятли яратилди. Илтимос, админлар
        тасдиқлашини кутинг. Бир неча сониядан сўнг бош саҳифага йўналтирасиз.
      </Typography.Text>

      {/* Manual link */}
      <Link to={PATH_LANDING.root}>
        <Button type="primary" size="middle">
          Бош саҳифага ўтиш
        </Button>
      </Link>
    </Flex>
  );
};

import { Button, Typography } from 'antd';
import { Link } from 'react-router-dom';

export const ForbiddenPage = () => {
  return (
    <div style={{ textAlign: 'center', paddingTop: '50px' }}>
      <Typography.Title level={2}>403 - Рухсат йўқ</Typography.Title>
      <Typography.Text>
        Сизда бу саҳифага кириш ҳуқуқи йўқ. Илтимос, админ билан боғланинг.
      </Typography.Text>
      <br />
      <Link to="/">
        <Button type="primary" style={{ marginTop: 20 }}>
          Бош саҳифага қайтиш
        </Button>
      </Link>
    </div>
  );
};



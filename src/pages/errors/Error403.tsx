import { Result, theme } from 'antd';
import { BackBtn } from '../../components';

export const Error403Page = () => {
  const {
    token: { colorBgLayout, colorTextSecondary },
  } = theme.useToken();

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: colorBgLayout,
        padding: '24px 16px',
      }}
    >
      <Result
        status="403"
        title="403"
        subTitle={
          <span style={{ color: colorTextSecondary }}>
            Сизда бу саҳифага кириш ҳуқуқи йўқ. Илтимос, админ билан боғланинг.
          </span>
        }
        extra={<BackBtn type="primary" />}
      />
    </div>
  );
};

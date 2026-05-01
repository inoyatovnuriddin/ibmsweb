import { Result } from 'antd';
import { BackBtn } from '../../components';

export const Error403Page = () => {
  return (
    <Result
      status="403"
      title="403"
      subTitle="Сизда бу саҳифага кириш ҳуқуқи йўқ. Илтимос, админ билан боғланинг."
      extra={<BackBtn type="primary" />}
    />
  );
};

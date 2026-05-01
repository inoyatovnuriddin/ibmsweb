import { Result } from 'antd';
import { BackBtn } from '../../components';

export const Error404Page = () => {
  return (
    <Result
      status="404"
      title="404"
      subTitle="Kechirasiz, siz tashrif buyurgan sahifa mavjud emas."
      extra={<BackBtn type="primary" />}
    />
  );
};

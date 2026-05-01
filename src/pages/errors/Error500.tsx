import { Result } from 'antd';
import { BackBtn, RefreshBtn } from '../../components';

export const Error500Page = () => {
  return (
    <Result
      status="500"
      title="500"
      subTitle="Kechirasiz, nimadir xato ketdi."
      extra={[<BackBtn type="primary" />, <RefreshBtn />]}
    />
  );
};

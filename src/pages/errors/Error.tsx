import { useRouteError } from 'react-router-dom';
import { Result, Typography } from 'antd';
import { BackBtn, RefreshBtn } from '../../components';

const { Paragraph, Text } = Typography;

type Error = unknown | any;

export const ErrorPage = () => {
  const error: Error = useRouteError();
  console.error(error);
  const rawMessage = error?.statusText || error?.message || 'Noma’lum xatolik';
  const normalizedMessage =
    rawMessage === 'Not Found'
      ? 'Sahifa topilmadi'
      : rawMessage === 'Unexpected Application Error!'
        ? 'Kutilmagan dasturiy xatolik yuz berdi'
        : rawMessage;

  return (
    <Result
      status="error"
      title="Xatolik yuz berdi"
      subTitle="Sahifani ochishda kutilmagan muammo yuz berdi."
      extra={[<BackBtn type="primary" />, <RefreshBtn />]}
    >
      <div className="desc">
        <Paragraph>
          <Text
            strong
            style={{
              fontSize: 16,
            }}
          >
            Ochmoqchi bo‘lgan sahifangizda quyidagi xatolik aniqlandi:
          </Text>
        </Paragraph>
        <Paragraph copyable>{normalizedMessage}</Paragraph>
      </div>
    </Result>
  );
};

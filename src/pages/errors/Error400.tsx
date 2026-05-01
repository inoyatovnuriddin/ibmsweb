import { Result, Typography } from 'antd';
import { CloseCircleOutlined } from '@ant-design/icons';
import { red } from '@ant-design/colors';
import { BackBtn, RefreshBtn } from '../../components';

const { Paragraph, Text } = Typography;

export const Error400Page = () => {
  return (
    <Result
      status="error"
      title="400"
      subTitle="Yomon so'rov. Server noto'g'ri sintaksis tufayli so'rovni tushuna olmadi. Mijoz so'rovni o'zgartirmasdan qayta yubormasligi kerak."
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
            Siz yuborgan kontentda quyidagi xatolik bor:
          </Text>
        </Paragraph>
        <Paragraph>
          <CloseCircleOutlined style={{ color: red[5] }} />
          &nbsp;Yomon so'rov - Noto'g'ri URL &nbsp;<a>Xatoni yuborish &gt;</a>
        </Paragraph>
        <Paragraph>
          <CloseCircleOutlined style={{ color: red[5] }} />
          &nbsp;Yomon so'rov. Brauzeringiz server tushuna olmaydigan so'rov yubordi &nbsp;
          <a>Konsolga o'tish &gt;</a>
        </Paragraph>
      </div>
    </Result>
  );
};

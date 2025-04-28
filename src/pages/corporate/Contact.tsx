import { Col, Row, RowProps, Space, Typography } from 'antd';
import { Card, ContactForm } from '../../components';
import { MailFilled, PhoneFilled } from '@ant-design/icons';

const { Link, Text, Paragraph } = Typography;

const ROW_PROPS: RowProps = {
  gutter: [
    { xs: 8, sm: 16, md: 24, lg: 32 },
    { xs: 8, sm: 16, md: 24, lg: 32 },
  ],
};

const textStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
};

const cardStyles: React.CSSProperties = {
  height: '100%',
};

export const CorporateContactPage = () => {
  return (
    <div>
      <Row {...ROW_PROPS}>
        <Col sm={24} lg={12}>
          <Card title="Телефон" extra={<PhoneFilled />} style={cardStyles}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text style={textStyles}>
                <Link strong>(98) 774-2017</Link>
              </Text>
              <Text style={textStyles}>
                <Link strong>(255) 000-0000</Link>
              </Text>
             
            </Space>
           
          </Card>
        </Col>
        <Col sm={24} lg={12}>
          <Card title="Электрон почта" extra={<MailFilled />} style={cardStyles}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text style={textStyles}>
                Ёрдам: <Link strong>ibms-bux@mail.ru</Link>
              </Text>
             
            </Space>
            {/*<Paragraph style={{ textAlign: 'center', margin: '1rem 0 0 0' }}>*/}
            {/*  We are available everyday, feel free to write to us.*/}
            {/*</Paragraph>*/}
          </Card>
        </Col>
        <Col span={24}>
          <Card title="Боғланиш учун">
            <ContactForm />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

import {
  Button,
  Checkbox,
  Col,
  Divider,
  Flex,
  Form,
  Input,
  message,
  Row,
  theme,
  Typography,
} from 'antd';
import {
  FacebookFilled,
  GoogleOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Logo } from '../../components';
import { useMediaQuery } from 'react-responsive';
import { PATH_AUTH } from '../../constants';
import { useState } from 'react';
import axios from 'axios';

const { Title, Text, Link } = Typography;

type FieldType = {
  email?: string;
  password?: string;
  remember?: boolean;
};

export const SignInPage = () => {
  const {
    token: { colorPrimary },
  } = theme.useToken();
  const isMobile = useMediaQuery({ maxWidth: 769 });
  // const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = (values: any) => {
    console.log('Success:', values);
    setLoading(true);

    message.open({
      type: 'success',
      content: 'Kirish muvaffaqiyatli amalga oshirildi!',
    });
    delete values.remember;

    axios
      .post('http://localhost:8080/api/authenticate', values)
      .then((res) => {
        console.log(res);
      })
      .catch((error) => {
        console.error('Authentication failed:', error);
        message.open({
          type: 'error',
          content: 'Xatolik yuz berdi, qayta urinib ko‘ring!',
        });
      });
  };

  const onFinishFailed = (errorInfo: any) => {
    console.log('Failed:', errorInfo);
  };

  function googleLogin() {
    console.log('logging in with google');
    window.location.href = 'http://localhost:8080/api/oauth2/authorize/google';
  }

  return (
    <Row style={{ minHeight: isMobile ? 'auto' : '100vh', overflow: 'hidden' }}>
      <Col xs={24} lg={12}>
        <Flex
          vertical
          align="center"
          justify="center"
          className="text-center"
          style={{ background: colorPrimary, height: '100%', padding: '1rem' }}
        >
          <Logo href={'/'} asLink color="white" />
          <Title level={2} className="text-white">
            IBMS га хуш келибсиз!
          </Title>
          <Text className="text-white" style={{ fontSize: 18 }}>
            «INTER BIZNES MEGA SERVIS» НОДАВЛАТ ТАЪЛИМ МУАССАСАСИ
          </Text>
        </Flex>
      </Col>
      <Col xs={24} lg={12}>
        <Flex
          vertical
          align={isMobile ? 'center' : 'flex-start'}
          justify="center"
          gap="middle"
          style={{ height: '100%', padding: '2rem' }}
        >
          <Title className="m-0">Кириш</Title>
          <Flex gap={4}>
            <Text>Рўйхатдан ўтмаганмисиз?</Text>
            <Link href={PATH_AUTH.signup}>Рўйхатдан ўтиш</Link>
          </Flex>
          <Form
            name="sign-up-form"
            layout="vertical"
            labelCol={{ span: 24 }}
            wrapperCol={{ span: 24 }}
            initialValues={{
              email: '',
              password: '',
              remember: true,
            }}
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            autoComplete="off"
            requiredMark={false}
          >
            <Row gutter={[8, 0]}>
              <Col xs={24}>
                <Form.Item<FieldType>
                  label="Электрон почта"
                  name="email"
                  rules={[
                    {
                      required: true,
                      message: 'Электрон почтангизни киритинг!',
                    },
                  ]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item<FieldType>
                  label="Парол"
                  name="password"
                  rules={[{ required: true, message: 'Паролни киритинг!' }]}
                >
                  <Input.Password />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item<FieldType> name="remember" valuePropName="checked">
                  <Checkbox>Мени эслаб қолиш</Checkbox>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item>
              <Flex align="center" justify="space-between">
                <Button
                  type="primary"
                  htmlType="submit"
                  size="middle"
                  loading={loading}
                >
                  Давом этиш
                </Button>
                <Link href={PATH_AUTH.passwordReset}>
                  Паролни унутдингизми?
                </Link>
              </Flex>
            </Form.Item>
          </Form>
          <Divider className="m-0">ёки</Divider>
          <Flex
            vertical={isMobile}
            gap="small"
            wrap="wrap"
            style={{ width: '100%' }}
          >
            <Button icon={<GoogleOutlined />} onClick={() => googleLogin()}>
              Google билан кириш
            </Button>
            <Button
              icon={<FacebookFilled />}
              onClick={() =>
                message.info(
                  'Ҳозирча бу сервисимиз ишламаяпти. Илтимос, кейинроқ қайта уриниб кўринг.'
                )
              }
            >
              Facebook билан кириш
            </Button>
            <Button
              icon={<UserOutlined />}
              onClick={() =>
                message.info(
                  'Ҳозирча бу сервисимиз ишламаяпти. Илтимос, кейинроқ қайта уриниб кўринг.'
                )
              }
            >
              One ID билан кириш
            </Button>
          </Flex>
        </Flex>
      </Col>
    </Row>
  );
};

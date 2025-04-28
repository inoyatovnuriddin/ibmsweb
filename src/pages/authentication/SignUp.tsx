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
  Select,
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
import moment from 'moment';
import axios from 'axios';

const { Title, Text, Link } = Typography;
const { Option } = Select;

type FieldType = {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: boolean;
  day?: string;
  month?: string;
  year?: string;
};

export const SignUpPage = () => {
  const {
    token: { colorPrimary },
  } = theme.useToken();
  const isMobile = useMediaQuery({ maxWidth: 769 });
  // const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FieldType>({});
  const [isTermsChecked, setIsTermsChecked] = useState(false);

  const onFinish = (values: any) => {
    const { day, month, year } = formData;
    if (!day || !month || !year) {
      message.error('Илтимос, тўлиқ туғилган кунингизни киритинг.');
      return;
    }

    const birthday = `${year}-${month}-${day}`;

    const payload = {
      firstname: values.firstName,
      lastname: values.lastName,
      email: values.email,
      password: values.password,
      confirmPassword: values.confirmPassword,
      birthday,
    };

    console.log('Yuborilayotgan maʼlumot:', payload);

    setLoading(true);

    axios.post('http://localhost:8080/api/signup', payload).then((res) => {
      console.log(res);
      setLoading(false);
    });
  };

  const onFinishFailed = (errorInfo: unknown) => {
    console.log('Failed:', errorInfo);
    message.error('Xatolik yuz berdi!');
  };

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = [
    'Январь',
    'Февраль',
    'Март',
    'Апрель',
    'Май',
    'Июнь',
    'Июль',
    'Август',
    'Сентябрь',
    'Октябрь',
    'Ноябрь',
    'Декабрь',
  ];
  const monthsValue = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = Array.from({ length: 100 }, (_, i) => moment().year() - i);

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
          <Logo color="white" href={'/'} asLink />
          <Title
            level={2}
            className="text-white text-lg sm:text-xl md:text-2xl lg:text-3xl"
          >
            IBMS га хуш келибсиз!
          </Title>
          <Text
            className="text-white text-sm sm:text-base md:text-lg lg:text-xl"
            style={{ fontSize: 18 }}
          >
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
          <Title className="m-0 text-lg sm:text-xl md:text-2xl lg:text-3xl ">
            Рўйхатдан&nbsp;ўтиш
          </Title>
          <div>
            <Text>Аллақачон рўйхатдан ўтганмисиз?</Text>&nbsp;
            <Link href={PATH_AUTH.signin}>Тизимга киринг</Link>
          </div>
          <Flex
            vertical={isMobile}
            gap="small"
            wrap="wrap"
            style={{ width: '100%' }}
          >
            <Button
              icon={<GoogleOutlined />}
              onClick={() =>
                message.info(
                  'Ҳозирча бу сервисимиз ишламаяпти. Илтимос, кейинроқ қайта уриниб кўринг.'
                )
              }
            >
              Google билан рўйхатдан ўтиш
            </Button>
            <Button
              icon={<FacebookFilled />}
              onClick={() =>
                message.info(
                  'Ҳозирча бу сервисимиз ишламаяпти. Илтимос, кейинроқ қайта уриниб кўринг.'
                )
              }
            >
              Facebook билан рўйхатдан ўтиш
            </Button>
            <Button
              icon={<UserOutlined />}
              onClick={() =>
                message.info(
                  'Ҳозирча бу сервисимиз ишламаяпти. Илтимос, кейинроқ қайта уриниб кўринг.'
                )
              }
            >
              One ID орқали
            </Button>
          </Flex>
          <Divider className="m-0">ёки</Divider>
          <Form
            name="sign-up-form"
            layout="vertical"
            labelCol={{ span: 8 }}
            wrapperCol={{ span: 24 }}
            initialValues={{ remember: true }}
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            autoComplete="off"
            requiredMark={false}
          >
            <Row gutter={[8, 0]}>
              <Col xs={24} lg={12}>
                <Form.Item<FieldType>
                  label="Исм"
                  name="firstName"
                  rules={[
                    {
                      required: true,
                      message: 'Исмингизни киритинг!',
                    },
                  ]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} lg={12}>
                <Form.Item<FieldType>
                  label="Фамилия"
                  name="lastName"
                  rules={[
                    { required: true, message: 'Фамилиянгизни киритинг!' },
                  ]}
                >
                  <Input />
                </Form.Item>
              </Col>

              <Col xs={8} lg={8}>
                <Form.Item<FieldType>
                  label="Туғилган&nbsp;кун"
                  name="day"
                  rules={[
                    {
                      required: true,
                      message: 'Туғилган кунингизни киритинг!',
                    },
                  ]}
                  labelCol={{ span: 24 }}
                >
                  <Select
                    style={{ width: '100%' }}
                    value={formData.day}
                    onChange={(value) =>
                      setFormData({ ...formData, day: value })
                    }
                  >
                    {days.map((day) => (
                      <Option key={day} value={day < 10 ? `0${day}` : `${day}`}>
                        {day < 10 ? `0${day}` : `${day}`}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={9} lg={8}>
                <Form.Item<FieldType>
                  label="Ой"
                  name="month"
                  rules={[{ required: true, message: 'Ойни киритинг!' }]}
                  labelCol={{ span: 24 }}
                >
                  <Select
                    style={{ width: '100%' }}
                    value={formData.month}
                    onChange={(value) =>
                      setFormData({ ...formData, month: value })
                    }
                  >
                    {months.map((month, index) => (
                      <Option
                        key={index}
                        value={String(monthsValue[index]).padStart(2, '0')}
                      >
                        {month}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={7} lg={8}>
                <Form.Item<FieldType>
                  label="Йил"
                  name="year"
                  rules={[{ required: true, message: 'Йилни киритинг!' }]}
                  labelCol={{ span: 24 }}
                >
                  <Select
                    style={{ width: '100%' }}
                    value={formData.year}
                    onChange={(value) =>
                      setFormData({ ...formData, year: value })
                    }
                  >
                    {years.map((year) => (
                      <Option key={year} value={year}>
                        {year}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

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
                  <Input type={'email'} />
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
                <Form.Item<FieldType>
                  label="Паролни тасдиқланг"
                  name="confirmPassword"
                  rules={[
                    {
                      required: true,
                      message: 'Пароллар бир хил бўлиши керак!',
                    },
                  ]}
                >
                  <Input.Password />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item<FieldType> name="terms" valuePropName="checked">
                  <Checkbox
                    onChange={(e) => setIsTermsChecked(e.target.checked)}
                  >
                    Мен&nbsp;сайтдан&nbsp;фойдаланиш&nbsp;ва&nbsp;
                    <Link>шартлари ва қоидаларига</Link>
                    &nbsp;&nbsp;розиман
                  </Checkbox>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="middle"
                loading={loading}
                disabled={!isTermsChecked}
              >
                Тасдиқлаш
              </Button>
            </Form.Item>
          </Form>
        </Flex>
      </Col>
    </Row>
  );
};

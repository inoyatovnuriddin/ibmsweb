import { Button, Col, Form, Input, message, Row } from 'antd';
import { useStylesContext } from '../../context';
import { Card } from '../../components';
import { SaveOutlined } from '@ant-design/icons';
import { apiClient } from '../../services/api.ts';

type FieldType = {
  currentPassword?: string;
  newPassword?: string;
  reEnterPassword?: string;
};

export const UserProfileSecurityPage = () => {
  const stylesContext = useStylesContext();

  const [form] = Form.useForm();

  const onFinish = (values: FieldType) => {
    console.log('Муваффақиятли:', values);

    const data = {
      currentPassword: values?.currentPassword?.trim(),
      newPassword: values?.newPassword?.trim(),
      reEnterPassword: values?.reEnterPassword?.trim(),
    };

    if (data.newPassword !== data.reEnterPassword) {
      message.error('Янги пароллар мос эмас!');
      return;
    }

    apiClient
      .post('/v1/users/change_password', data)
      .then((res) => {
        message.success(res.data?.payload?.message);
        form.resetFields();
      })
      .catch((e) => {
        console.log(e.response);
      });
  };

  return (
    <Row {...stylesContext?.rowProps}>
      {/*kerak bolishi mumkin, кейин қўшаман o'chirilmasin */}
      
      {/*<Col span={24}>*/}
      {/*  <Row {...stylesContext?.rowProps}>*/}
      {/*    <Col xs={24} sm={12}>*/}
      {/*      <Card*/}
      {/*        title="Қўшимча хавфсизлик"*/}
      {/*        extra={<Button type="default">Батафсил</Button>}*/}
      {/*        actions={[<Button>Ёқиш</Button>]}*/}
      {/*        style={{ height: '100%' }}*/}
      {/*      >*/}
      {/*        <Flex flexDirection="column">*/}
      {/*          <Text>Паролсиз аккаунт</Text>*/}
      {/*          <Badge status="error" text="ЎЧИРИЛГАН" />*/}
      {/*        </Flex>*/}
      {/*      </Card>*/}
      {/*    </Col>*/}
      {/*    /!*<Col xs={24} sm={12}>*!/*/}
      {/*    /!*  <Card*!/*/}
      {/*    /!*    title="Қўшимча хавфсизлик"*!/*/}
      {/*    /!*    extra={<Button type="default">Батафсил</Button>}*!/*/}
      {/*    /!*    actions={[<Button>Ўчириш</Button>]}*!/*/}
      {/*    /!*    style={{ height: '100%' }}*!/*/}
      {/*    /!*  >*!/*/}
      {/*    /!*    <Flex flexDirection="column">*!/*/}
      {/*    /!*      <Text>Икки босқичли тасдиқлаш</Text>*!/*/}
      {/*    /!*      <Badge status="success" text="ЁҚИЛГАН" />*!/*/}
      {/*    /!*    </Flex>*!/*/}
      {/*    /!*  </Card>*!/*/}
      {/*    /!*</Col>*!/*/}
      {/*    <Col xs={24} sm={12}>*/}
      {/*      <Card*/}
      {/*        title="Ҳамма жойдан чиқиш"*/}
      {/*        actions={[<Button>Чиқиш</Button>]}*/}
      {/*        style={{ height: '100%' }}*/}
      {/*      >*/}
      {/*        <Flex flexDirection="column">*/}
      {/*          <Text>*/}
      {/*            Браузерлар, иловалар ва аккаунтингиздан фойдаланилаётган бошқа*/}
      {/*            жойлардан чиқариб юборамиз.*/}
      {/*          </Text>*/}
      {/*        </Flex>*/}
      {/*      </Card>*/}
      {/*    </Col>*/}
      {/*    <Col xs={24} sm={12}>*/}
      {/*      <Card*/}
      {/*        title="Қайта тиклаш коди"*/}
      {/*        actions={[<Button>Янги код яратиш</Button>]}*/}
      {/*        style={{ height: '100%' }}*/}
      {/*      >*/}
      {/*        <Flex flexDirection="column">*/}
      {/*          <Text>*/}
      {/*            Агар аккаунтингизга кириш имкони бўлмаса, ушбу код орқали*/}
      {/*            фойдаланишингиз мумкин. Уни чиқариб олинг ва хавфсиз жойда*/}
      {/*            сақланг.*/}
      {/*          </Text>*/}
      {/*        </Flex>*/}
      {/*      </Card>*/}
      {/*    </Col>*/}
      {/*  </Row>*/}
      {/*</Col>*/}

      <Col span={24}>
        <Card title="Паролни ўзгартириш">
          <Form
            form={form}
            name="form-change-password"
            layout="vertical"
            labelCol={{ span: 8 }}
            initialValues={{ remember: true }}
            onFinish={onFinish}
            autoComplete="off"
            requiredMark={false}
          >
            <Form.Item<FieldType>
              label="Жорий парол"
              name="currentPassword"
              rules={[
                {
                  required: true,
                  message: 'Илтимос, жорий паролингизни киритинг!',
                },
              ]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item<FieldType>
              label="Янги парол"
              name="newPassword"
              rules={[
                {
                  required: true,
                  message: 'Илтимос, янги паролингизни киритинг!',
                  max: 16,
                  min: 8,
                },
              ]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item<FieldType>
              label="Паролни қайта киритинг"
              name="reEnterPassword"
              rules={[
                {
                  required: true,
                  message: 'Илтимос, янги паролни қайта киритинг!',
                  max: 16,
                  min: 8,
                },
              ]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                Ўзгартиришни сақлаш
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Col>

      {/*<Col span={24}>*/}
      {/*  <Card*/}
      {/*    title="Сўнгги фаоллик"*/}
      {/*    extra={<Button>Барча фаолликни кўриш</Button>}*/}
      {/*  >*/}
      {/*    {sessionActivityDataError ? (*/}
      {/*      <Alert*/}
      {/*        message="Хатолик"*/}
      {/*        description={sessionActivityDataError.toString()}*/}
      {/*        type="error"*/}
      {/*        showIcon*/}
      {/*      />*/}
      {/*    ) : sessionActivityDataLoading ? (*/}
      {/*      <Loader />*/}
      {/*    ) : (*/}
      {/*      <Collapse*/}
      {/*        bordered*/}
      {/*        expandIconPosition="start"*/}
      {/*        items={sessionActivityData.slice(0, 5).map((s: Session) => ({*/}
      {/*          key: s.id,*/}
      {/*          label: (*/}
      {/*            <Flex>*/}
      {/*              <span>{s.login_time}</span>*/}
      {/*            </Flex>*/}
      {/*          ),*/}
      {/*          children: (*/}
      {/*            <Descriptions*/}
      {/*              bordered*/}
      {/*              column={{ xs: 1, sm: 2, md: 2, lg: 3, xl: 3, xxl: 4 }}*/}
      {/*              items={[*/}
      {/*                {*/}
      {/*                  key: 'session_device',*/}
      {/*                  label: 'Ускуна',*/}
      {/*                  children: s.device_type,*/}
      {/*                },*/}
      {/*                {*/}
      {/*                  key: 'session_browser',*/}
      {/*                  label: 'Браузер',*/}
      {/*                  children: s.browser,*/}
      {/*                },*/}
      {/*                {*/}
      {/*                  key: 'session_ip',*/}
      {/*                  label: 'IP манзил',*/}
      {/*                  children: s.ip_address,*/}
      {/*                },*/}
      {/*                {*/}
      {/*                  key: 'session_status',*/}
      {/*                  label: 'Ҳолат',*/}
      {/*                  children: <Badge status="processing" text={s.status} />,*/}
      {/*                },*/}
      {/*                {*/}
      {/*                  key: 'session_location',*/}
      {/*                  label: 'Жойлашув',*/}
      {/*                  children: s.login_location,*/}
      {/*                },*/}
      {/*                {*/}
      {/*                  key: 'session_duration',*/}
      {/*                  label: 'Сессия давомийлиги (дақиқада)',*/}
      {/*                  children: s.login_duration,*/}
      {/*                },*/}
      {/*                {*/}
      {/*                  key: 'session_login_attempts',*/}
      {/*                  label: 'Кириш уринишлари',*/}
      {/*                  children: s.login_attempts,*/}
      {/*                },*/}
      {/*              ]}*/}
      {/*            />*/}
      {/*          ),*/}
      {/*          extra:*/}
      {/*            s.device_type === 'desktop' ? (*/}
      {/*              <LaptopOutlined />*/}
      {/*            ) : s.device_type === 'tablet' ? (*/}
      {/*              <TabletOutlined />*/}
      {/*            ) : (*/}
      {/*              <MobileOutlined />*/}
      {/*            ),*/}
      {/*        }))}*/}
      {/*      />*/}
      {/*    )}*/}
      {/*  </Card>*/}
      {/*</Col>*/}
    </Row>
  );
};

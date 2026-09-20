import {
  Button,
  Col,
  Form,
  Input,
  message,
  Row,
  Space,
  Tag,
  Typography,
} from 'antd';
import { useStylesContext } from '../../context';
import { Card } from '../../components';
import { SaveOutlined } from '@ant-design/icons';
import { apiClient } from '../../services/api.ts';
import { TelegramAuthWidget } from '../../components/TelegramAuthWidget.tsx';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../redux/store.ts';
import {
  fetchCurrentUser,
  linkTelegramAccount,
  type TelegramLinkPayload,
  type TelegramWidgetUser,
  unlinkTelegramAccount,
} from '../../redux/auth/authApi.ts';
import { setCurrentUser } from '../../redux/auth/authSlice.ts';
import { TELEGRAM_BOT_USERNAME } from '../../redux/auth/authSession.ts';
import { useAppTranslation } from '../../hooks/useAppTranslation.ts';

type FieldType = {
  currentPassword?: string;
  newPassword?: string;
  reEnterPassword?: string;
};

const { Text, Title } = Typography;

const getReadableTelegramError = (error: unknown) => {
  const err = error as {
    response?: { data?: { errors?: { message?: string }; detail?: string; message?: string } };
    message?: string;
  };

  return (
    err?.response?.data?.errors?.message ||
    err?.response?.data?.detail ||
    err?.response?.data?.message ||
    err?.message ||
    'Telegram amali bajarilmadi'
  );
};

export const UserProfileSecurityPage = () => {
  const stylesContext = useStylesContext();
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.auth.currentUser);
  const telegramBotUsername = TELEGRAM_BOT_USERNAME;
  const { t } = useAppTranslation();

  const [form] = Form.useForm();
  const [telegramState, setTelegramState] = useState<TelegramLinkPayload | null>(null);
  const [telegramLoading, setTelegramLoading] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    setTelegramState((prev) => {
      const nextTelegramLinked = currentUser.telegramLinked || false;
      const shouldPreserveLinkedState =
        prev?.telegramLinked &&
        !nextTelegramLinked &&
        !currentUser.telegramUsername &&
        !currentUser.telegramId &&
        !currentUser.telegramPhotoUrl;

      return {
        id: currentUser.id,
        email: currentUser.email,
        telegramLinked: shouldPreserveLinkedState
          ? true
          : nextTelegramLinked,
        telegramId:
          currentUser.telegramId || (shouldPreserveLinkedState ? prev?.telegramId || null : null),
        telegramUsername:
          currentUser.telegramUsername ||
          (shouldPreserveLinkedState ? prev?.telegramUsername || null : null),
        telegramPhotoUrl:
          currentUser.telegramPhotoUrl ||
          (shouldPreserveLinkedState ? prev?.telegramPhotoUrl || null : null),
        passwordLoginEnabled: currentUser.passwordLoginEnabled,
        profileCompleted: currentUser.profileCompleted,
      };
    });
  }, [currentUser]);

  const onFinish = (values: FieldType) => {
    const data = {
      currentPassword: values?.currentPassword?.trim(),
      newPassword: values?.newPassword?.trim(),
      reEnterPassword: values?.reEnterPassword?.trim(),
    };

    if (data.newPassword !== data.reEnterPassword) {
      message.error(t('security.msg.mismatch'));
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

  const refreshCurrentUserState = async (
    optimisticTelegramState?: Partial<TelegramLinkPayload>
  ) => {
    try {
      const refreshedUser = await fetchCurrentUser();
      const shouldPreserveLinkedState =
        optimisticTelegramState?.telegramLinked &&
        !refreshedUser.telegramLinked &&
        !refreshedUser.telegramUsername &&
        !refreshedUser.telegramId &&
        !refreshedUser.telegramPhotoUrl;

      dispatch(
        setCurrentUser(
          shouldPreserveLinkedState
            ? {
                ...refreshedUser,
                telegramLinked: true,
                telegramId: optimisticTelegramState?.telegramId || null,
                telegramUsername: optimisticTelegramState?.telegramUsername || null,
                telegramPhotoUrl: optimisticTelegramState?.telegramPhotoUrl || null,
              }
            : refreshedUser
        )
      );
    } catch {
      // silently ignore; local telegram state is still updated from endpoint response
    }
  };

  const handleTelegramLink = async (user: TelegramWidgetUser) => {
    setTelegramLoading(true);

    try {
      const payload = await linkTelegramAccount(user);
      setTelegramState(payload);
      await refreshCurrentUserState(payload);
      message.success(t('security.msg.telegramLinked'));
    } catch (error) {
      message.error(getReadableTelegramError(error));
    } finally {
      setTelegramLoading(false);
    }
  };

  const handleTelegramUnlink = async () => {
    setTelegramLoading(true);

    try {
      await unlinkTelegramAccount();
      setTelegramState((prev) =>
        prev
          ? {
              ...prev,
              telegramLinked: false,
              telegramId: null,
              telegramUsername: null,
              telegramPhotoUrl: null,
            }
          : null
      );
      await refreshCurrentUserState();
      message.success(t('security.msg.telegramUnlinked'));
    } catch (error) {
      message.error(getReadableTelegramError(error));
    } finally {
      setTelegramLoading(false);
    }
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
        <Card title={t('security.passwordChange.title')}>
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
              label={t('security.form.currentPassword.label')}
              name="currentPassword"
              rules={[
                {
                  required: true,
                  message: t('security.form.currentPassword.required'),
                },
              ]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item<FieldType>
              label={t('security.form.newPassword.label')}
              name="newPassword"
              rules={[
                {
                  required: true,
                  message: t('security.form.newPassword.required'),
                  max: 16,
                  min: 8,
                },
              ]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item<FieldType>
              label={t('security.form.confirmPassword.label')}
              name="reEnterPassword"
              rules={[
                {
                  required: true,
                  message: t('security.form.confirmPassword.required'),
                  max: 16,
                  min: 8,
                },
              ]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                {t('security.form.submit')}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Col>

      <Col span={24}>
        <Card>
          <Space direction="vertical" size={18} style={{ width: '100%' }}>
            <div>
              <Title level={4} style={{ margin: 0 }}>Telegram</Title>
              <Text style={{ color: '#64748b' }}>
                {t('auth.signIn.telegramHint')}
              </Text>
            </div>

            <Space wrap size={10}>
              <Tag color={telegramState?.telegramLinked ? 'success' : 'default'}>
                {telegramState?.telegramLinked ? t('security.telegram.connected') : t('security.telegram.disconnected')}
              </Tag>
              {telegramState?.telegramUsername ? (
                <Tag color="blue">@{telegramState.telegramUsername}</Tag>
              ) : null}
            </Space>

            {!telegramState?.telegramLinked ? (
              <TelegramAuthWidget
                callbackName="onTelegramLink"
                botUsername={telegramBotUsername}
                onAuth={handleTelegramLink}
              />
            ) : (
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Text style={{ color: '#52606d' }}>
                  {t('security.telegram.linkedHint')}
                </Text>
                <Button
                  danger
                  onClick={handleTelegramUnlink}
                  loading={telegramLoading}
                  style={{ width: 'fit-content' }}
                >
                  Telegramni uzish
                </Button>
              </Space>
            )}
          </Space>
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

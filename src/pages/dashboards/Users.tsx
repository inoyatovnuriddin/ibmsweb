import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  DatePicker,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  theme,
  Tooltip,
  Typography,
  Upload,
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  UploadOutlined,
  UserOutlined,
} from '@ant-design/icons';
import ImgCrop from 'antd-img-crop';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { useSelector } from 'react-redux';
import dayjs, { Dayjs } from 'dayjs';
import { apiClient } from '../../services/api.ts';
import type { RootState } from '../../redux/store.ts';
import { useAppTranslation } from '../../hooks/useAppTranslation.ts';
import {
  ADMIN_MODAL_STYLES,
  AdminPageFrame,
  AdminSectionCard,
} from './adminUi.tsx';
import {
  deleteUser,
  listRoles,
  RoleInfo,
  updateUser,
  uploadUserImage,
} from './usersApi.ts';

const { Text } = Typography;
const DATE_FORMAT = 'YYYY-MM-DD';

type UserStatus = 'Confirm' | 'Active' | 'Block';

interface UserResponse {
  id: string;
  phoneNumber?: string | null;
  passportId?: string | null;
  birthDate?: string | null;
  email: string;
  firstname: string;
  lastname: string;
  middlename: string;
  status: UserStatus;
  userImage?: string | null;
  roles: string[];
}

interface UserFormValues {
  firstname: string;
  lastname: string;
  middlename: string;
  phoneNumber?: string;
  passportId?: string;
  birthDate?: Dayjs | null;
  roles: string[];
  email?: string;
  changePassword?: boolean;
  password?: string;
  confirmPassword?: string;
  status?: UserStatus;
}

interface ListPayload<T> {
  list: T[];
  count: number;
}

interface ApiWrapper<T> {
  payload?: T;
  errors?: {
    message?: string;
  };
  message?: string;
}

// Опции собираем функцией: подписи зависят от языка, а хук на верхнем уровне не вызвать.
type Translate = ReturnType<typeof useAppTranslation>['t'];

const buildFallbackRoleOptions = (t: Translate) => [
  { value: 'ROLE_ADMIN', label: t('admin.users.roleAdmin') },
  { value: 'ROLE_INSTRUCTOR', label: t('admin.users.roleTeacher') },
  { value: 'ROLE_USER', label: t('admin.users.roleUser') },
];

const buildStatusOptions = (t: Translate) => [
  { value: 'Active', label: t('admin.common.active') },
  { value: 'Block', label: t('admin.users.stBlocked') },
  { value: 'Confirm', label: t('admin.users.stUnconfirmed') },
];

const toDayjs = (value?: string | null): Dayjs | null => {
  if (!value) return null;
  const parsed = dayjs(value, DATE_FORMAT, true);
  return parsed.isValid() ? parsed : null;
};

export const DashboardUsersPage = () => {
  const { t } = useAppTranslation();
  const {
    token: { colorText, colorTextSecondary },
  } = theme.useToken();
  const currentUser = useSelector((state: RootState) => state.auth.currentUser);
  const isSuperAdmin = Boolean(currentUser?.roles?.includes('ROLE_SUPER_ADMIN'));

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm<UserFormValues>();
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [roles, setRoles] = useState<RoleInfo[]>([]);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
  });

  // Profile photo state inside the modal: a freshly cropped file, or a removal request.
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  useEffect(() => {
    fetchUsers(1, pagination.pageSize || 10, '');
    listRoles()
      .then(setRoles)
      .catch(() => setRoles([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const extractErrorMessage = (error: unknown): string => {
    const anyError = error as {
      response?: { data?: { errors?: { message?: string }; message?: string } };
      message?: string;
    };
    return (
      anyError?.response?.data?.errors?.message ||
      anyError?.response?.data?.message ||
      anyError?.message ||
      t('admin.common.saveError')
    );
  };

  const fetchUsers = async (page = 1, pageSize = 10, searchKey = '') => {
    setLoading(true);
    try {
      const start = (page - 1) * pageSize;
      const res = await apiClient.get<ApiWrapper<ListPayload<UserResponse>>>(
        '/v1/users/list',
        {
          params: {
            start,
            limit: pageSize,
            searchKey,
          },
        }
      );

      const payload = res.data?.payload;
      setUsers(payload?.list || []);
      setCount(payload?.count || 0);
    } catch (error) {
      message.error(extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = useMemo(() => {
    const source = roles.length
      ? roles.map((r) => ({ value: r.code, label: r.name || r.code }))
      : buildFallbackRoleOptions(t);
    // Only a super admin may grant the super admin role.
    return isSuperAdmin
      ? source
      : source.filter((o) => o.value !== 'ROLE_SUPER_ADMIN');
  }, [roles, isSuperAdmin, t]);

  const roleText = (role: string) => {
    const found = roleOptions.find((item) => item.value === role);
    return found?.label || role.replace(/^ROLE_/, '');
  };

  const resetImageState = () => {
    if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setPendingImage(null);
    setImagePreview(null);
    setRemoveImage(false);
  };

  const showCreateModal = () => {
    setIsEditing(false);
    setEditingUser(null);
    form.resetFields();
    resetImageState();
    setIsModalOpen(true);
  };

  const showEditModal = (record: UserResponse) => {
    setIsEditing(true);
    setEditingUser(record);
    form.setFieldsValue({
      firstname: record.firstname,
      lastname: record.lastname,
      middlename: record.middlename,
      phoneNumber: record.phoneNumber || undefined,
      passportId: record.passportId || undefined,
      birthDate: toDayjs(record.birthDate),
      roles: record.roles,
      email: record.email,
      status: record.status,
      changePassword: false,
      password: undefined,
      confirmPassword: undefined,
    });
    resetImageState();
    setImagePreview(record.userImage || null);
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
    resetImageState();
  };

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    const current = newPagination.current || 1;
    const pageSize = newPagination.pageSize || 10;

    setPagination({ current, pageSize });
    fetchUsers(current, pageSize, search);
  };

  const onSearch = (value: string) => {
    const nextSearch = value || '';
    setSearch(nextSearch);
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchUsers(1, pagination.pageSize || 10, nextSearch);
  };

  const statusBadge = (status: UserStatus) => {
    if (status === 'Active') return <Badge status="success" text={t('admin.common.active')} />;
    if (status === 'Block') return <Badge status="error" text={t('admin.users.stBlocked')} />;
    if (status === 'Confirm') {
      return <Badge status="processing" text={t('admin.users.stUnconfirmed')} />;
    }
    return status;
  };

  const handleDelete = async (record: UserResponse) => {
    try {
      await deleteUser(record.id);
      message.success(t('admin.users.deleted'));
      const isLastRowOnPage = users.length === 1 && (pagination.current || 1) > 1;
      const nextPage = isLastRowOnPage
        ? (pagination.current || 2) - 1
        : pagination.current || 1;
      setPagination((prev) => ({ ...prev, current: nextPage }));
      fetchUsers(nextPage, pagination.pageSize || 10, search);
    } catch (error) {
      message.error(extractErrorMessage(error));
    }
  };

  const submitForm = async (values: UserFormValues) => {
    setSaving(true);
    try {
      // Upload the cropped photo first (if a new one was picked) to get its attachment id.
      let userImageId: string | undefined;
      if (pendingImage) {
        userImageId = await uploadUserImage(pendingImage, pendingImage.name || 'avatar.png');
      }

      if (isEditing) {
        if (!editingUser) return;

        const updatePayload = {
          firstname: values.firstname?.trim(),
          lastname: values.lastname?.trim(),
          middlename: values.middlename?.trim(),
          phoneNumber: values.phoneNumber?.trim() || null,
          passportId: values.passportId?.trim() || null,
          birthDate: values.birthDate ? values.birthDate.format(DATE_FORMAT) : null,
          roles: values.roles,
          email: values.email?.trim(),
          status: values.status,
          changePassword: Boolean(values.changePassword),
          password: values.changePassword ? values.password : undefined,
          userImageId,
          removeUserImage: removeImage && !pendingImage,
        };

        await updateUser(editingUser.id, updatePayload);
        message.success(t('admin.users.updated'));
      } else {
        const createPayload = {
          firstname: values.firstname?.trim(),
          lastname: values.lastname?.trim(),
          middlename: values.middlename?.trim(),
          phoneNumber: values.phoneNumber?.trim() || null,
          passportId: values.passportId?.trim() || null,
          birthDate: values.birthDate ? values.birthDate.format(DATE_FORMAT) : null,
          roles: values.roles,
          userImageId,
        };

        await apiClient.post('/v1/users/create', createPayload);
        message.success(t('admin.users.created'));
      }

      setIsModalOpen(false);
      form.resetFields();
      resetImageState();
      fetchUsers(pagination.current || 1, pagination.pageSize || 10, search);
    } catch (error) {
      message.error(extractErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<UserResponse> = [
    {
      title: '№',
      render: (_text, _record, index) => {
        const current = pagination.current || 1;
        const pageSize = pagination.pageSize || 10;
        return (current - 1) * pageSize + index + 1;
      },
      width: 70,
    },
    {
      title: 'F.I.Sh.',
      key: 'fullname',
      render: (_, record) => (
        <Space>
          <Avatar
            size={44}
            src={record.userImage || undefined}
            icon={<UserOutlined />}
            style={{ flex: '0 0 auto' }}
          />
          <Space direction="vertical" size={2}>
            <Text strong style={{ color: colorText }}>
              {record.firstname} {record.lastname}
            </Text>
            <Text style={{ color: colorTextSecondary }}>{record.middlename}</Text>
          </Space>
        </Space>
      ),
      width: 260,
    },
    {
      title: t('admin.users.contact'),
      key: 'contact',
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Text>{record.phoneNumber || '-'}</Text>
          <Text style={{ color: colorTextSecondary }}>{record.email || '-'}</Text>
        </Space>
      ),
      width: 250,
    },
    {
      title: t('admin.users.passportShort'),
      dataIndex: 'passportId',
      render: (value?: string | null) => value || '-',
      width: 130,
    },
    {
      title: t('admin.users.birthDate'),
      dataIndex: 'birthDate',
      render: (value?: string | null) => value || '-',
      width: 140,
    },
    {
      title: t('admin.common.status'),
      dataIndex: 'status',
      render: (status: UserStatus) => statusBadge(status),
      width: 140,
    },
    {
      title: t('admin.users.roles'),
      dataIndex: 'roles',
      render: (userRoles: string[]) => (
        <Space wrap>
          {userRoles.map((role, index) => (
            <Tag
              color={
                role === 'ROLE_SUPER_ADMIN'
                  ? 'gold'
                  : ['blue', 'green', 'orange', 'purple'][index % 4]
              }
              key={`${role}-${index}`}
              style={{ borderRadius: 999, paddingInline: 10 }}
            >
              {roleText(role)}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: t('admin.common.actions'),
      key: 'actions',
      width: 140,
      render: (_value, record) => {
        const isSelf = record.id === currentUser?.id;
        const targetIsSuperAdmin = record.roles.includes('ROLE_SUPER_ADMIN');
        const deletable = !isSelf && (isSuperAdmin || !targetIsSuperAdmin);
        return (
          <Space>
            <Tooltip title={t('admin.common.edit')}>
              <Button icon={<EditOutlined />} onClick={() => showEditModal(record)} />
            </Tooltip>
            <Popconfirm
              title={t('admin.users.deleteTitle')}
              description={t('admin.users.deleteHint', { name: `${record.firstname} ${record.lastname}` })}
              okText={t('admin.common.yesDeleteShort')}
              cancelText={t('admin.common.cancel')}
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(record)}
              disabled={!deletable}
            >
              <Tooltip
                title={
                  isSelf
                    ? 'O‘zingizni o‘chira olmaysiz'
                    : !deletable
                      ? 'Super adminni faqat super admin o‘chira oladi'
                      : 'O‘chirish'
                }
              >
                <Button danger icon={<DeleteOutlined />} disabled={!deletable} />
              </Tooltip>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <Helmet>
        <title>{t('admin.users.pageTitle')}</title>
      </Helmet>

      <AdminPageFrame
        eyebrow={t('admin.users.eyebrow')}
        title={t('admin.users.title')}
        subtitle={t('admin.users.subtitle')}
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={showCreateModal}
            style={{ borderRadius: 16, height: 46 }}
          >
            {t('admin.users.new')}
          </Button>
        }
      >
        <AdminSectionCard
          title={t('admin.users.listTitle')}
          extra={
            <Input.Search
              placeholder={t('admin.users.search')}
              allowClear
              style={{ width: 340, maxWidth: '100%' }}
              onSearch={onSearch}
              onChange={(e) => onSearch(e.target.value)}
            />
          }
        >
          <Table<UserResponse>
            rowKey="id"
            columns={columns}
            dataSource={users}
            loading={loading}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: count,
              showTotal: (total) => t('admin.users.total', { count: total }),
            }}
            onChange={handleTableChange}
            scroll={{ x: 1180 }}
          />
        </AdminSectionCard>

        <Modal
          title={isEditing ? 'Foydalanuvchini tahrirlash' : 'Yangi foydalanuvchi qo‘shish'}
          open={isModalOpen}
          onCancel={handleCancel}
          onOk={() => form.submit()}
          okText={t('admin.common.save')}
          cancelText={t('admin.common.cancel')}
          okButtonProps={{ loading: saving }}
          destroyOnClose
          centered
          width="min(760px, calc(100vw - 24px))"
          styles={ADMIN_MODAL_STYLES}
        >
          <Form<UserFormValues> form={form} layout="vertical" onFinish={submitForm}>
            {/* Profile photo (optional) with interactive crop */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: 14,
                marginBottom: 18,
                borderRadius: 14,
                border: '1px dashed rgba(148,163,184,0.5)',
              }}
            >
              <Avatar
                size={72}
                src={!removeImage ? imagePreview || undefined : undefined}
                icon={<UserOutlined />}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{t('admin.users.photo')}</div>
                <div style={{ fontSize: 12, color: 'rgba(100,116,139,0.95)' }}>
                  Ixtiyoriy. Rasm tanlangach kerakli qismini kesib olishingiz mumkin
                  (JPG/PNG, ≤ 5MB).
                </div>
              </div>
              <Space>
                <ImgCrop
                  rotationSlider
                  showGrid
                  aspect={1}
                  modalTitle="Rasmni kesish"
                  modalOk="Kesish"
                  modalCancel={t('admin.common.cancel')}
                >
                  <Upload
                    accept="image/*"
                    maxCount={1}
                    showUploadList={false}
                    beforeUpload={(file) => {
                      const isImage = file.type.startsWith('image/');
                      const isSmall = file.size / 1024 / 1024 < 5;
                      if (!isImage) {
                        message.error(t('admin.users.imageOnly'));
                        return Upload.LIST_IGNORE;
                      }
                      if (!isSmall) {
                        message.error(t('admin.users.imageTooBig'));
                        return Upload.LIST_IGNORE;
                      }
                      if (imagePreview?.startsWith('blob:')) {
                        URL.revokeObjectURL(imagePreview);
                      }
                      setPendingImage(file);
                      setImagePreview(URL.createObjectURL(file));
                      setRemoveImage(false);
                      return false;
                    }}
                  >
                    <Button icon={<UploadOutlined />}>
                      {imagePreview && !removeImage ? 'Almashtirish' : 'Rasm tanlash'}
                    </Button>
                  </Upload>
                </ImgCrop>
                {imagePreview && !removeImage && (
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    aria-label={t('admin.users.removePhoto')}
                    onClick={() => {
                      if (imagePreview?.startsWith('blob:')) {
                        URL.revokeObjectURL(imagePreview);
                      }
                      setPendingImage(null);
                      setImagePreview(null);
                      setRemoveImage(true);
                    }}
                  />
                )}
              </Space>
            </div>

            <Form.Item
              label={t('admin.users.firstName')}
              name="firstname"
              rules={[{ required: true, message: t('admin.users.reqFirstName') }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label={t('admin.users.lastName')}
              name="lastname"
              rules={[{ required: true, message: t('admin.users.reqLastName') }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label={t('admin.users.middleName')}
              name="middlename"
              rules={[{ required: true, message: t('admin.users.reqMiddleName') }]}
            >
              <Input />
            </Form.Item>

            <Form.Item label={t('admin.users.phone')} name="phoneNumber">
              <Input />
            </Form.Item>

            <Form.Item label={t('admin.users.passport')} name="passportId">
              <Input />
            </Form.Item>

            <Form.Item label={t('admin.users.birthDate')} name="birthDate">
              <DatePicker style={{ width: '100%' }} format={DATE_FORMAT} />
            </Form.Item>

            {isEditing ? (
              <>
                <Alert
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                  message="Parolni o‘zgartirish alohida boshqariladi"
                  description={t('admin.users.passwordHint')}
                />
                <Form.Item
                  label={t('admin.common.email')}
                  name="email"
                  rules={[{ required: true, message: t('admin.users.reqEmail') }]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  label={t('admin.users.updatePassword')}
                  name="changePassword"
                  valuePropName="checked"
                  extra={t('admin.users.updatePasswordQ')}
                >
                  <Switch checkedChildren="Ha" unCheckedChildren="Yo‘q" />
                </Form.Item>

                <Form.Item shouldUpdate={(prev, current) => prev.changePassword !== current.changePassword} noStyle>
                  {({ getFieldValue }) =>
                    getFieldValue('changePassword') ? (
                      <>
                        <Form.Item
                          label={t('admin.users.newPassword')}
                          name="password"
                          rules={[{ required: true, message: t('admin.users.reqNewPassword') }]}
                        >
                          <Input.Password />
                        </Form.Item>

                        <Form.Item
                          label={t('admin.users.confirmPassword')}
                          name="confirmPassword"
                          dependencies={['password']}
                          rules={[
                            { required: true, message: t('admin.users.reqConfirm') },
                            ({ getFieldValue }) => ({
                              validator(_, value) {
                                if (!value || getFieldValue('password') === value) {
                                  return Promise.resolve();
                                }
                                return Promise.reject(
                                  new Error(t('admin.users.passwordsMismatch'))
                                );
                              },
                            }),
                          ]}
                        >
                          <Input.Password />
                        </Form.Item>
                      </>
                    ) : null
                  }
                </Form.Item>

                <Form.Item
                  label={t('admin.common.status')}
                  name="status"
                  rules={[{ required: true, message: t('admin.users.reqStatus') }]}
                >
                  <Select options={buildStatusOptions(t)} placeholder={t('admin.users.statusPh')} />
                </Form.Item>
              </>
            ) : null}

            <Form.Item
              label={t('admin.users.roles')}
              name="roles"
              rules={[{ required: true, message: t('admin.users.reqRoles') }]}
            >
              <Select
                mode="multiple"
                options={roleOptions}
                placeholder={t('admin.users.rolesPh')}
                optionFilterProp="label"
                showSearch
              />
            </Form.Item>
          </Form>
        </Modal>
      </AdminPageFrame>
    </div>
  );
};

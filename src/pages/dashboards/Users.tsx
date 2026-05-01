import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Alert,
  Badge,
  Button,
  DatePicker,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import { apiClient } from '../../services/api.ts';
import {
  ADMIN_MODAL_STYLES,
  AdminPageFrame,
  AdminSectionCard,
} from './adminUi.tsx';
import { updateUser } from './usersApi.ts';

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

const roleOptions = [
  { value: 'ROLE_ADMIN', label: 'Admin' },
  { value: 'ROLE_INSTRUCTOR', label: 'O‘qituvchi' },
  { value: 'ROLE_USER', label: 'Foydalanuvchi' },
];

const statusOptions = [
  { value: 'Active', label: 'Faol' },
  { value: 'Block', label: 'Bloklangan' },
  { value: 'Confirm', label: 'Tasdiqlanmagan' },
];

const toDayjs = (value?: string | null): Dayjs | null => {
  if (!value) return null;
  const parsed = dayjs(value, DATE_FORMAT, true);
  return parsed.isValid() ? parsed : null;
};

export const DashboardUsersPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm<UserFormValues>();
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
  });

  useEffect(() => {
    fetchUsers(1, pagination.pageSize || 10, '');
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
      'Saqlashda xatolik yuz berdi'
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

  const showCreateModal = () => {
    setIsEditing(false);
    setEditingUserId(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const showEditModal = (record: UserResponse) => {
    setIsEditing(true);
    setEditingUserId(record.id);
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
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
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

  const roleText = (role: string) => {
    const found = roleOptions.find((item) => item.value === role);
    return found?.label || role;
  };

  const statusBadge = (status: UserStatus) => {
    if (status === 'Active') return <Badge status="success" text="Faol" />;
    if (status === 'Block') return <Badge status="error" text="Bloklangan" />;
    if (status === 'Confirm') {
      return <Badge status="processing" text="Tasdiqlanmagan" />;
    }
    return status;
  };

  const submitForm = async (values: UserFormValues) => {
    try {
      if (isEditing) {
        if (!editingUserId) return;

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
        };

        await updateUser(editingUserId, updatePayload);
        message.success('Foydalanuvchi yangilandi');
      } else {
        const createPayload = {
          firstname: values.firstname?.trim(),
          lastname: values.lastname?.trim(),
          middlename: values.middlename?.trim(),
          phoneNumber: values.phoneNumber?.trim() || null,
          passportId: values.passportId?.trim() || null,
          birthDate: values.birthDate ? values.birthDate.format(DATE_FORMAT) : null,
          roles: values.roles,
        };

        await apiClient.post('/v1/users/create', createPayload);
        message.success('Yangi foydalanuvchi qo‘shildi');
      }

      setIsModalOpen(false);
      form.resetFields();
      fetchUsers(pagination.current || 1, pagination.pageSize || 10, search);
    } catch (error) {
      message.error(extractErrorMessage(error));
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
        <Space direction="vertical" size={2}>
          <Text strong style={{ color: '#102a43' }}>
            {record.firstname} {record.lastname}
          </Text>
          <Text style={{ color: '#64748b' }}>{record.middlename}</Text>
        </Space>
      ),
      width: 240,
    },
    {
      title: 'Aloqa',
      key: 'contact',
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Text>{record.phoneNumber || '-'}</Text>
          <Text style={{ color: '#64748b' }}>{record.email || '-'}</Text>
        </Space>
      ),
      width: 250,
    },
    {
      title: 'Passport',
      dataIndex: 'passportId',
      render: (value?: string | null) => value || '-',
      width: 150,
    },
    {
      title: 'Tug‘ilgan sana',
      dataIndex: 'birthDate',
      render: (value?: string | null) => value || '-',
      width: 150,
    },
    {
      title: 'Holat',
      dataIndex: 'status',
      render: (status: UserStatus) => statusBadge(status),
      width: 150,
    },
    {
      title: 'Rollar',
      dataIndex: 'roles',
      render: (roles: string[]) => (
        <Space wrap>
          {roles.map((role, index) => (
            <Tag
              color={['blue', 'green', 'orange', 'purple'][index % 4]}
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
      title: 'Amallar',
      key: 'actions',
      width: 140,
      render: (_value, record) => (
        <Space>
          <Tooltip title="Tahrirlash">
            <Button icon={<EditOutlined />} onClick={() => showEditModal(record)} />
          </Tooltip>
          <Tooltip title="O‘chirish keyin qo‘shiladi">
            <Button danger icon={<DeleteOutlined />} disabled />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Helmet>
        <title>Foydalanuvchilar | Admin panel</title>
      </Helmet>

      <AdminPageFrame
        eyebrow="Foydalanuvchilar moduli"
        title="Foydalanuvchilar boshqaruvi"
        subtitle="Administratorlar, o‘qituvchilar va o‘quvchilar ma'lumotlarini yagona standart asosida boshqaring."
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={showCreateModal}
            style={{ borderRadius: 16, height: 46 }}
          >
            Foydalanuvchi qo‘shish
          </Button>
        }
      >
        <AdminSectionCard
          title="Foydalanuvchilar ro‘yxati"
          extra={
            <Input.Search
              placeholder="Ism, telefon yoki email bo‘yicha qidiring"
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
          okText="Saqlash"
          cancelText="Bekor qilish"
          destroyOnClose
          centered
          width="min(760px, calc(100vw - 24px))"
          styles={ADMIN_MODAL_STYLES}
        >
          <Form<UserFormValues> form={form} layout="vertical" onFinish={submitForm}>
            <Form.Item
              label="Ism"
              name="firstname"
              rules={[{ required: true, message: 'Ism majburiy' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Familiya"
              name="lastname"
              rules={[{ required: true, message: 'Familiya majburiy' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Sharif"
              name="middlename"
              rules={[{ required: true, message: 'Sharif majburiy' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item label="Telefon raqami" name="phoneNumber">
              <Input />
            </Form.Item>

            <Form.Item label="Passport seriya va raqami" name="passportId">
              <Input />
            </Form.Item>

            <Form.Item label="Tug‘ilgan sana" name="birthDate">
              <DatePicker style={{ width: '100%' }} format={DATE_FORMAT} />
            </Form.Item>

            {isEditing ? (
              <>
                <Alert
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                  message="Parolni o‘zgartirish alohida boshqariladi"
                  description="Agar parol yangilanmasa, mavjud kirish ma’lumotlari o‘zgarishsiz qoladi."
                />
                <Form.Item
                  label="Email"
                  name="email"
                  rules={[{ required: true, message: 'Email majburiy' }]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  label="Parolni yangilash"
                  name="changePassword"
                  valuePropName="checked"
                  extra="Faqat yoqilganda yangi parol backendga yuboriladi."
                >
                  <Switch checkedChildren="Ha" unCheckedChildren="Yo‘q" />
                </Form.Item>

                <Form.Item shouldUpdate={(prev, current) => prev.changePassword !== current.changePassword} noStyle>
                  {({ getFieldValue }) =>
                    getFieldValue('changePassword') ? (
                      <>
                        <Form.Item
                          label="Yangi parol"
                          name="password"
                          rules={[{ required: true, message: 'Yangi parolni kiriting' }]}
                        >
                          <Input.Password />
                        </Form.Item>

                        <Form.Item
                          label="Yangi parolni tasdiqlang"
                          name="confirmPassword"
                          dependencies={['password']}
                          rules={[
                            { required: true, message: 'Parolni tasdiqlang' },
                            ({ getFieldValue }) => ({
                              validator(_, value) {
                                if (!value || getFieldValue('password') === value) {
                                  return Promise.resolve();
                                }
                                return Promise.reject(
                                  new Error('Parollar bir xil bo‘lishi kerak')
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
                  label="Holat"
                  name="status"
                  rules={[{ required: true, message: 'Holat majburiy' }]}
                >
                  <Select options={statusOptions} placeholder="Holatni tanlang" />
                </Form.Item>
              </>
            ) : null}

            <Form.Item
              label="Rollar"
              name="roles"
              rules={[{ required: true, message: 'Kamida bitta rol tanlang' }]}
            >
              <Select
                mode="multiple"
                options={roleOptions}
                placeholder="Rollarni tanlang"
              />
            </Form.Item>
          </Form>
        </Modal>
      </AdminPageFrame>
    </div>
  );
};

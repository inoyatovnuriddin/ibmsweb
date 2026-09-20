import { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Badge,
  Button,
  Checkbox,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import {
  CrownOutlined,
  DeleteOutlined,
  EditOutlined,
  LockOutlined,
  PlusOutlined,
  SafetyOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  ADMIN_MODAL_STYLES,
  AdminPageFrame,
  AdminSectionCard,
} from './adminUi.tsx';
import {
  createRole,
  deleteRole,
  getPageRegistry,
  listRoles,
  RoleInfo,
  updateRole,
} from './rolesApi.ts';

const { Text } = Typography;

const PAGE_LABELS: Record<string, string> = {
  users: 'Foydalanuvchilar',
  courses: 'Kurslar',
  topics: 'Mavzular',
  videos: 'Videolar',
  tests: 'Testlar',
  monitoring: 'Monitoring',
  groups: 'Guruhlar',
  qrCode: 'QR sertifikat yaratish',
  certificates: 'Sertifikatlar roʻyxati',
  contactRequests: 'Murojaatlar',
};

const ACTION_LABELS: Record<string, string> = {
  VIEW: 'Koʻrish',
  CREATE: 'Qoʻshish',
  UPDATE: 'Tahrirlash',
  DELETE: 'Oʻchirish',
};

const ACTIONS = ['VIEW', 'CREATE', 'UPDATE', 'DELETE'];

interface RoleFormValues {
  name: string;
  description?: string;
}

const extractErrorMessage = (error: unknown): string => {
  const anyError = error as {
    response?: { data?: { errors?: { message?: string }; message?: string } };
    message?: string;
  };
  return (
    anyError?.response?.data?.errors?.message ||
    anyError?.response?.data?.message ||
    anyError?.message ||
    'Xatolik yuz berdi'
  );
};

export const DashboardRolesPage = () => {
  const [roles, setRoles] = useState<RoleInfo[]>([]);
  const [pages, setPages] = useState<string[]>(Object.keys(PAGE_LABELS));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleInfo | null>(null);
  const [form] = Form.useForm<RoleFormValues>();
  // The permission matrix being edited: page -> granted actions.
  const [matrix, setMatrix] = useState<Record<string, string[]>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRoles(await listRoles());
    } catch (err) {
      message.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    getPageRegistry()
      .then((registry) => {
        const keys = Object.keys(registry);
        if (keys.length) setPages(keys);
      })
      .catch(() => {
        // Fall back to the static page list.
      });
  }, [load]);

  const openCreate = () => {
    setEditingRole(null);
    form.resetFields();
    setMatrix({});
    setIsModalOpen(true);
  };

  const openEdit = (role: RoleInfo) => {
    setEditingRole(role);
    form.setFieldsValue({
      name: role.name,
      description: role.description || undefined,
    });
    setMatrix(
      Object.fromEntries(
        Object.entries(role.permissions || {}).map(([page, actions]) => [
          page,
          [...actions],
        ])
      )
    );
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    form.resetFields();
    setMatrix({});
    setEditingRole(null);
  };

  const toggleCell = (page: string, action: string, checked: boolean) => {
    setMatrix((prev) => {
      const current = new Set(prev[page] || []);
      if (checked) {
        current.add(action);
        // Any granted action implies VIEW.
        current.add('VIEW');
      } else if (action === 'VIEW') {
        // Removing VIEW removes everything on the page.
        current.clear();
      } else {
        current.delete(action);
      }
      const next = { ...prev };
      if (current.size) {
        next[page] = ACTIONS.filter((a) => current.has(a));
      } else {
        delete next[page];
      }
      return next;
    });
  };

  const toggleRow = (page: string, checked: boolean) => {
    setMatrix((prev) => {
      const next = { ...prev };
      if (checked) {
        next[page] = [...ACTIONS];
      } else {
        delete next[page];
      }
      return next;
    });
  };

  const submit = async (values: RoleFormValues) => {
    if (!Object.keys(matrix).length) {
      message.warning('Kamida bitta sahifaga ruxsat belgilang');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: values.name.trim(),
        description: values.description?.trim() || null,
        permissions: matrix,
      };
      if (editingRole) {
        await updateRole(editingRole.code, payload);
        message.success('Rol yangilandi');
      } else {
        await createRole(payload);
        message.success('Yangi rol yaratildi');
      }
      closeModal();
      load();
    } catch (err) {
      message.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (role: RoleInfo) => {
    try {
      await deleteRole(role.code);
      message.success('Rol oʻchirildi');
      load();
    } catch (err) {
      message.error(extractErrorMessage(err));
    }
  };

  const permissionSummary = (role: RoleInfo) => {
    if (role.code === 'ROLE_SUPER_ADMIN') {
      return <Tag color="gold" icon={<CrownOutlined />}>Toʻliq ruxsat</Tag>;
    }
    const pageCount = Object.keys(role.permissions || {}).length;
    if (!pageCount) {
      return <Text type="secondary">Ruxsat berilmagan</Text>;
    }
    const preview = Object.keys(role.permissions)
      .slice(0, 3)
      .map((p) => PAGE_LABELS[p] || p)
      .join(', ');
    return (
      <Tooltip
        title={Object.entries(role.permissions)
          .map(
            ([page, actions]) =>
              `${PAGE_LABELS[page] || page}: ${actions
                .map((a) => ACTION_LABELS[a] || a)
                .join(', ')}`
          )
          .join(' • ')}
      >
        <Space direction="vertical" size={0}>
          <Text>{pageCount} ta sahifa</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {preview}
            {pageCount > 3 ? '…' : ''}
          </Text>
        </Space>
      </Tooltip>
    );
  };

  const columns: ColumnsType<RoleInfo> = [
    {
      title: 'Rol',
      key: 'role',
      width: 260,
      render: (_, role) => (
        <Space>
          {role.code === 'ROLE_SUPER_ADMIN' ? (
            <CrownOutlined style={{ color: '#d4a017', fontSize: 20 }} />
          ) : (
            <SafetyOutlined style={{ color: '#2563eb', fontSize: 20 }} />
          )}
          <Space direction="vertical" size={0}>
            <Text strong>{role.name}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {role.code}
            </Text>
          </Space>
        </Space>
      ),
    },
    {
      title: 'Izoh',
      dataIndex: 'description',
      render: (value?: string | null) => value || <Text type="secondary">—</Text>,
    },
    {
      title: 'Turi',
      key: 'type',
      width: 130,
      render: (_, role) =>
        role.system ? (
          <Tag icon={<LockOutlined />} color="default">
            Tizim roli
          </Tag>
        ) : (
          <Tag color="blue">Maxsus rol</Tag>
        ),
    },
    {
      title: 'Foydalanuvchilar',
      dataIndex: 'userCount',
      width: 150,
      render: (count: number) => (
        <Badge
          count={count}
          showZero
          overflowCount={9999}
          color={count ? '#2563eb' : '#94a3b8'}
        />
      ),
    },
    {
      title: 'Ruxsatlar',
      key: 'permissions',
      render: (_, role) => permissionSummary(role),
    },
    {
      title: 'Amallar',
      key: 'actions',
      width: 130,
      render: (_, role) => {
        const isSuperAdmin = role.code === 'ROLE_SUPER_ADMIN';
        return (
          <Space>
            <Tooltip title={isSuperAdmin ? 'Super admin roli oʻzgarmas' : 'Tahrirlash'}>
              <Button
                icon={<EditOutlined />}
                disabled={isSuperAdmin}
                onClick={() => openEdit(role)}
              />
            </Tooltip>
            <Popconfirm
              title="Rolni oʻchirish"
              description={
                role.userCount
                  ? `Bu rol ${role.userCount} ta foydalanuvchidan olib tashlanadi. Davom etilsinmi?`
                  : `${role.name} roli oʻchirilsinmi?`
              }
              okText="Ha, oʻchirish"
              cancelText="Bekor qilish"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(role)}
              disabled={role.system}
            >
              <Tooltip title={role.system ? 'Tizim rolini oʻchirib boʻlmaydi' : 'Oʻchirish'}>
                <Button danger icon={<DeleteOutlined />} disabled={role.system} />
              </Tooltip>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  // Permission matrix rows for the modal.
  const matrixColumns: ColumnsType<{ page: string }> = useMemo(
    () => [
      {
        title: 'Sahifa',
        key: 'page',
        render: (_, { page }) => (
          <Checkbox
            checked={(matrix[page] || []).length === ACTIONS.length}
            indeterminate={
              (matrix[page] || []).length > 0 &&
              (matrix[page] || []).length < ACTIONS.length
            }
            onChange={(e) => toggleRow(page, e.target.checked)}
          >
            <Text strong>{PAGE_LABELS[page] || page}</Text>
          </Checkbox>
        ),
      },
      ...ACTIONS.map((action) => ({
        title: ACTION_LABELS[action],
        key: action,
        width: 110,
        align: 'center' as const,
        render: (_: unknown, { page }: { page: string }) => (
          <Checkbox
            checked={(matrix[page] || []).includes(action)}
            onChange={(e) => toggleCell(page, action, e.target.checked)}
          />
        ),
      })),
    ],
    [matrix]
  );

  return (
    <div>
      <Helmet>
        <title>Rollar | Admin panel</title>
      </Helmet>

      <AdminPageFrame
        eyebrow="Xavfsizlik moduli"
        title="Rollar va ruxsatlar"
        subtitle="Har bir rol uchun sahifalar va amallar (koʻrish, qoʻshish, tahrirlash, oʻchirish) boʻyicha ruxsatlarni boshqaring."
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={openCreate}
            style={{ borderRadius: 16, height: 46 }}
          >
            Yangi rol
          </Button>
        }
      >
        <AdminSectionCard
          title="Rollar roʻyxati"
          extra={
            <Space>
              <TeamOutlined />
              <Text type="secondary">{roles.length} ta rol</Text>
            </Space>
          }
        >
          <Table<RoleInfo>
            rowKey="code"
            columns={columns}
            dataSource={roles}
            loading={loading}
            pagination={false}
            scroll={{ x: 980 }}
          />
        </AdminSectionCard>

        <Modal
          title={editingRole ? `Rolni tahrirlash — ${editingRole.name}` : 'Yangi rol yaratish'}
          open={isModalOpen}
          onCancel={closeModal}
          onOk={() => form.submit()}
          okText="Saqlash"
          cancelText="Bekor qilish"
          okButtonProps={{ loading: saving }}
          destroyOnClose
          centered
          width="min(860px, calc(100vw - 24px))"
          styles={ADMIN_MODAL_STYLES}
        >
          <Form<RoleFormValues> form={form} layout="vertical" onFinish={submit}>
            <Form.Item
              label="Rol nomi"
              name="name"
              rules={[
                { required: true, message: 'Rol nomini kiriting' },
                { max: 100, message: '100 belgidan oshmasligi kerak' },
              ]}
            >
              <Input placeholder="Masalan: Kadrlar boʻlimi" />
            </Form.Item>

            <Form.Item
              label="Izoh"
              name="description"
              rules={[{ max: 500, message: '500 belgidan oshmasligi kerak' }]}
            >
              <Input.TextArea
                rows={2}
                placeholder="Bu rol nima uchun moʻljallangan? (ixtiyoriy)"
              />
            </Form.Item>

            <Form.Item label="Sahifa ruxsatlari" required>
              <Table<{ page: string }>
                rowKey="page"
                size="small"
                columns={matrixColumns}
                dataSource={pages.map((page) => ({ page }))}
                pagination={false}
                scroll={{ x: 640 }}
              />
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
                Qoʻshish/Tahrirlash/Oʻchirish belgilansa, Koʻrish avtomatik yoqiladi.
                Sahifa nomidagi belgi butun qatorni tanlaydi.
              </Text>
            </Form.Item>
          </Form>
        </Modal>
      </AdminPageFrame>
    </div>
  );
};

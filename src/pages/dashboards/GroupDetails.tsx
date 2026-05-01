import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Alert,
  Badge,
  Button,
  Col,
  Drawer,
  Empty,
  Form,
  Input,
  message,
  Popconfirm,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  EyeOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Link, useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { AdminPageFrame, AdminSectionCard } from './adminUi.tsx';
import {
  deleteGroup,
  getGroup,
  searchCourses,
  searchStudents,
  syncGroupAssignments,
  updateGroup,
} from './groupsApi.ts';
import {
  deleteUserOverride,
  getUserEffectiveAccess,
  saveUserOverride,
} from './courseAccessApi.ts';
import type {
  CourseAccessMode,
  CourseSearchItem,
  GroupUpdatePayload,
  SaveUserOverridePayload,
  StudentGroupCourse,
  StudentGroupDetails,
  StudentGroupStudent,
  UserEffectiveCourseAccess,
  UserListItem,
} from './groupTypes.ts';
import {
  getAccessModeLabel,
  getRoleLabel,
  getUserStatusLabel,
} from './groupMappers.ts';
import { PATH_DASHBOARD } from '../../constants';

const { Title, Text, Paragraph } = Typography;

type GroupSettingsForm = {
  name: string;
  description?: string;
  active: boolean;
};

const getErrorMessage = (error: unknown) => {
  const err = error as {
    response?: { data?: { errors?: { message?: string }; message?: string } };
    message?: string;
  };

  return (
    err?.response?.data?.errors?.message ||
    err?.response?.data?.message ||
    err?.message ||
    'Amalni bajarishda xatolik yuz berdi.'
  );
};

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('DD.MM.YYYY HH:mm') : '-';
};

const getFullName = (user: UserListItem) =>
  [user.firstname, user.lastname].filter(Boolean).join(' ').trim() || user.email || 'Student';

const getCourseLabel = (course: CourseSearchItem | StudentGroupCourse) => {
  if ('courseTitle' in course) {
    return course.courseTitle || 'Kurs nomi topilmadi';
  }

  return course.titleuz || course.titleru || 'Kurs nomi topilmadi';
};

const isStudentRole = (roles: string[]) => roles.includes('ROLE_USER');

const getStudentIdentifier = (user: StudentGroupStudent | null) => user?.id?.trim() || '';

const StudentAccessDrawer = ({
  open,
  onClose,
  user,
}: {
  open: boolean;
  onClose: () => void;
  user: StudentGroupStudent | null;
}) => {
  const [accessLoading, setAccessLoading] = useState(false);
  const [effectiveAccess, setEffectiveAccess] = useState<UserEffectiveCourseAccess | null>(null);
  const [courseOptions, setCourseOptions] = useState<CourseSearchItem[]>([]);
  const [courseSearchLoading, setCourseSearchLoading] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string>();
  const [selectedMode, setSelectedMode] = useState<CourseAccessMode>('ALLOW');
  const [savingOverride, setSavingOverride] = useState(false);

  const loadEffectiveAccess = async (userId: string) => {
    if (!userId) {
      setEffectiveAccess(null);
      message.warning('Talaba identifikatori topilmadi. Ro‘yxat ma’lumotlarini yangilab ko‘ring.');
      return;
    }

    setAccessLoading(true);
    try {
      const payload = await getUserEffectiveAccess(userId);
      setEffectiveAccess(payload);
    } catch (error) {
      message.error(getErrorMessage(error));
      setEffectiveAccess(null);
    } finally {
      setAccessLoading(false);
    }
  };

  useEffect(() => {
    if (!open || !user) return;
    loadEffectiveAccess(getStudentIdentifier(user));
  }, [open, user?.id]);

  const handleSearchCourses = async (value: string) => {
    setCourseSearchLoading(true);
    try {
      const payload = await searchCourses(value);
      setCourseOptions(payload);
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setCourseSearchLoading(false);
    }
  };

  const handleSaveOverride = async () => {
    const userId = getStudentIdentifier(user);

    if (!userId) {
      message.warning('Talaba identifikatori topilmadi.');
      return;
    }

    if (!selectedCourseId) {
      message.warning('Avval kursni tanlang.');
      return;
    }

    try {
      setSavingOverride(true);
      const payload: SaveUserOverridePayload = {
        courseId: selectedCourseId,
        accessMode: selectedMode,
      };
      await saveUserOverride(userId, payload);
      message.success("Qo'lda berilgan istisno saqlandi.");
      setSelectedCourseId(undefined);
      await loadEffectiveAccess(userId);
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setSavingOverride(false);
    }
  };

  const handleDeleteOverride = async (courseId: string) => {
    const userId = getStudentIdentifier(user);
    if (!userId) return;
    try {
      await deleteUserOverride(userId, courseId);
      message.success("Qo'lda berilgan istisno olib tashlandi.");
      await loadEffectiveAccess(userId);
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  };

  return (
    <Drawer
      title={user ? `${user.fullName} uchun ruxsatlar` : 'Kurs ruxsatlari'}
      placement="right"
      width={580}
      open={open}
      onClose={onClose}
      destroyOnClose
    >
      {!user ? null : !isStudentRole(user.roles) ? (
        <Alert
          type="warning"
          showIcon
          message="Qo‘lda berilgan istisnolar faqat talabalar uchun ishlaydi."
          description="Administrator va o‘qituvchi rollari barcha kurslarni ko‘ra oladi, ularga alohida ruxsat yozuvi kiritilmaydi."
        />
      ) : accessLoading ? (
        <div style={{ minHeight: 260, display: 'grid', placeItems: 'center' }}>
          <Spin />
        </div>
      ) : effectiveAccess ? (
        <Space direction="vertical" size={18} style={{ width: '100%' }}>
          <Alert
            type="info"
            showIcon
            message="Bu yerda talabaning guruhlari, alohida berilgan ruxsatlari va yakuniy ochiq kurslari ko‘rinadi."
            description="Agar kurs uchun “ruxsatni olib tashlash” tanlansa, u guruh orqali berilgan ruxsatdan ham ustun turadi."
          />

          <AdminSectionCard title="A'zo bo‘lgan guruhlar">
            {effectiveAccess.groups.length === 0 ? (
              <Empty
                description="Bu student hozircha hech bir guruhga biriktirilmagan"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <Space direction="vertical" size={10} style={{ width: '100%' }}>
                {effectiveAccess.groups.map((group) => (
                  <div
                    key={group.id}
                    style={{
                      borderRadius: 16,
                      border: '1px solid rgba(148,163,184,0.14)',
                      padding: 14,
                      background: '#f8fafc',
                    }}
                  >
                    <Space direction="vertical" size={4}>
                      <Text strong>{group.name}</Text>
                      <Text style={{ color: '#64748b' }}>
                        {group.description || 'Tavsif kiritilmagan'}
                      </Text>
                    </Space>
                  </div>
                ))}
              </Space>
            )}
          </AdminSectionCard>

          <AdminSectionCard title="Alohida berilgan ruxsatlar">
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Space wrap style={{ width: '100%' }}>
                <Select
                  showSearch
                  value={selectedCourseId}
                  placeholder="Kurs tanlang"
                  style={{ minWidth: 260, flex: 1 }}
                  filterOption={false}
                  onSearch={handleSearchCourses}
                  onChange={setSelectedCourseId}
                  notFoundContent={courseSearchLoading ? <Spin size="small" /> : null}
                  options={courseOptions.map((course) => ({
                    value: course.id,
                    label: getCourseLabel(course),
                  }))}
                />
                <Select<CourseAccessMode>
                  value={selectedMode}
                  style={{ width: 180 }}
                  onChange={setSelectedMode}
                  options={[
                    { label: 'Ruxsat berish', value: 'ALLOW' },
                    { label: 'Ruxsatni olib tashlash', value: 'DENY' },
                  ]}
                />
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  loading={savingOverride}
                  onClick={handleSaveOverride}
                >
                  Saqlash
                </Button>
              </Space>

              {effectiveAccess.overrides.length === 0 ? (
                <Empty
                  description="Alohida berilgan ruxsat yozuvlari hozircha yo‘q"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                <Space direction="vertical" size={10} style={{ width: '100%' }}>
                  {effectiveAccess.overrides.map((override) => (
                    <div
                      key={override.id}
                      style={{
                        borderRadius: 16,
                        border: '1px solid rgba(148,163,184,0.14)',
                        padding: 14,
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 16,
                        alignItems: 'center',
                        flexWrap: 'wrap',
                      }}
                    >
                      <Space direction="vertical" size={3}>
                        <Text strong>{override.courseTitle || 'Kurs'}</Text>
                        <Text style={{ color: '#64748b' }}>
                          {override.instructor || 'O‘qituvchi ko‘rsatilmagan'}
                        </Text>
                      </Space>
                      <Space>
                        <Tag color={override.accessMode === 'DENY' ? 'error' : 'success'}>
                          {getAccessModeLabel(override.accessMode)}
                        </Tag>
                        <Button
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleDeleteOverride(override.courseId)}
                        />
                      </Space>
                    </div>
                  ))}
                </Space>
              )}
            </Space>
          </AdminSectionCard>

          <AdminSectionCard title="Ochiq kurslar">
            {effectiveAccess.effectiveCourses.length === 0 ? (
              <Empty
                description="Talaba uchun hozircha ochiq kurs topilmadi"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <Space direction="vertical" size={10} style={{ width: '100%' }}>
                {effectiveAccess.effectiveCourses.map((course) => (
                  <div
                    key={course.courseId}
                    style={{
                      borderRadius: 16,
                      border: '1px solid rgba(29,78,216,0.12)',
                      padding: 14,
                      background: '#eff6ff',
                    }}
                  >
                    <Text strong>{course.courseTitle || 'Kurs'}</Text>
                    <Text style={{ display: 'block', color: '#64748b' }}>
                      {course.instructor || 'O‘qituvchi ko‘rsatilmagan'}
                    </Text>
                  </div>
                ))}
              </Space>
            )}
          </AdminSectionCard>
        </Space>
      ) : (
        <Empty description="Yakuniy kurs ruxsatlari ma’lumoti topilmadi" />
      )}
    </Drawer>
  );
};

export const DashboardGroupDetailsPage = () => {
  const { groupId = '' } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm<GroupSettingsForm>();
  const [details, setDetails] = useState<StudentGroupDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [studentOptions, setStudentOptions] = useState<UserListItem[]>([]);
  const [courseOptions, setCourseOptions] = useState<CourseSearchItem[]>([]);
  const [studentSearchLoading, setStudentSearchLoading] = useState(false);
  const [courseSearchLoading, setCourseSearchLoading] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>();
  const [selectedCourseId, setSelectedCourseId] = useState<string>();
  const [draftStudentIds, setDraftStudentIds] = useState<string[]>([]);
  const [draftCourseIds, setDraftCourseIds] = useState<string[]>([]);
  const [drawerUser, setDrawerUser] = useState<StudentGroupStudent | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const loadDetails = async () => {
    setLoading(true);
    try {
      const payload = await getGroup(groupId);
      setDetails(payload);
      form.setFieldsValue({
        name: payload.group.name,
        description: payload.group.description || '',
        active: payload.group.active,
      });
      setDraftStudentIds(payload.students.map((student) => student.id).filter(Boolean));
      setDraftCourseIds(payload.courses.map((course) => course.courseId).filter(Boolean));
    } catch (error) {
      message.error(getErrorMessage(error));
      setDetails(null);
      setDraftStudentIds([]);
      setDraftCourseIds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [groupId]);

  const handleSearchStudents = async (value: string) => {
    setStudentSearchLoading(true);
    try {
      const payload = await searchStudents(value);
      setStudentOptions(payload);
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setStudentSearchLoading(false);
    }
  };

  const handleSearchCourses = async (value: string) => {
    setCourseSearchLoading(true);
    try {
      const payload = await searchCourses(value);
      setCourseOptions(payload);
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setCourseSearchLoading(false);
    }
  };

  const selectedStudents = useMemo(() => {
    const current = details?.students || [];
    const known = new Map<string, StudentGroupStudent>(
      current.map((student) => [student.id, student])
    );

    studentOptions.forEach((user) => {
      if (!user.id || known.has(user.id)) return;
      known.set(user.id, {
        id: user.id,
        fullName: getFullName(user),
        email: user.email || 'Email ko‘rsatilmagan',
        status: user.status || null,
        roles: user.roles || [],
      });
    });

    return draftStudentIds
      .map((id) => known.get(id))
      .filter((item): item is StudentGroupStudent => Boolean(item));
  }, [details?.students, draftStudentIds, studentOptions]);

  const selectedCourses = useMemo(() => {
    const current = details?.courses || [];
    const known = new Map<string, StudentGroupCourse>(
      current.map((course) => [course.courseId, course])
    );

    courseOptions.forEach((course) => {
      if (!course.id || known.has(course.id)) return;
      known.set(course.id, {
        courseId: course.id,
        courseTitle: getCourseLabel(course),
        instructor: course.instructor || null,
      });
    });

    return draftCourseIds
      .map((id) => known.get(id))
      .filter((item): item is StudentGroupCourse => Boolean(item));
  }, [courseOptions, details?.courses, draftCourseIds]);

  const assignmentsDirty = useMemo(() => {
    if (!details) return false;

    const currentStudentIds = details.students.map((student) => student.id).filter(Boolean);
    const currentCourseIds = details.courses.map((course) => course.courseId).filter(Boolean);

    return (
      [...currentStudentIds].sort().join('|') !== [...draftStudentIds].sort().join('|') ||
      [...currentCourseIds].sort().join('|') !== [...draftCourseIds].sort().join('|')
    );
  }, [details, draftCourseIds, draftStudentIds]);

  const handleAddStudent = async () => {
    if (!selectedStudentId) {
      message.warning('Avval student tanlang.');
      return;
    }

    if (draftStudentIds.includes(selectedStudentId)) {
      message.info('Bu talaba allaqachon guruh ro‘yxatida bor.');
      return;
    }

    setDraftStudentIds((current) => [...current, selectedStudentId]);
    setSelectedStudentId(undefined);
    message.success('Talaba ro‘yxatga qo‘shildi. Endi saqlash tugmasini bosing.');
  };

  const handleRemoveStudent = async (userId: string) => {
    setDraftStudentIds((current) => current.filter((id) => id !== userId));
    if (drawerUser?.id === userId) {
      setDrawerOpen(false);
      setDrawerUser(null);
    }
    message.success('Talaba ro‘yxatdan chiqarildi. Endi saqlash tugmasini bosing.');
  };

  const handleAttachCourse = async () => {
    if (!selectedCourseId) {
      message.warning('Avval kurs tanlang.');
      return;
    }

    if (draftCourseIds.includes(selectedCourseId)) {
      message.info('Bu kurs allaqachon guruh ro‘yxatiga qo‘shilgan.');
      return;
    }

    setDraftCourseIds((current) => [...current, selectedCourseId]);
    setSelectedCourseId(undefined);
    message.success('Kurs ro‘yxatga qo‘shildi. Endi saqlash tugmasini bosing.');
  };

  const handleDetachCourse = async (courseId: string) => {
    setDraftCourseIds((current) => current.filter((id) => id !== courseId));
    message.success('Kurs ro‘yxatdan olib tashlandi. Endi saqlash tugmasini bosing.');
  };

  const handleSaveAssignments = async () => {
    try {
      setSaving(true);
      const payload = await syncGroupAssignments(groupId, {
        studentIds: draftStudentIds,
        courseIds: draftCourseIds,
        replaceStudents: true,
        replaceCourses: true,
      });
      setDetails(payload);
      setDraftStudentIds(payload.students.map((student) => student.id).filter(Boolean));
      setDraftCourseIds(payload.courses.map((course) => course.courseId).filter(Boolean));
      message.success('Guruh birikmalari saqlandi.');
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async (values: GroupSettingsForm) => {
    try {
      setSaving(true);
      const payload: GroupUpdatePayload = {
        name: values.name.trim(),
        description: values.description?.trim() || null,
        active: values.active,
      };
      await updateGroup(groupId, payload);
      message.success('Guruh sozlamalari saqlandi.');
      await loadDetails();
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGroup = async () => {
    try {
      await deleteGroup(groupId);
      message.success('Guruh o‘chirildi.');
      navigate(PATH_DASHBOARD.groups);
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  };

  const studentColumns: ColumnsType<StudentGroupStudent> = [
    {
      title: 'Student',
      key: 'student',
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Text strong>{record.fullName}</Text>
          <Text style={{ color: '#64748b' }}>{record.email}</Text>
        </Space>
      ),
    },
    {
      title: 'Holat',
      dataIndex: 'status',
      width: 130,
      render: (value: string | null) => (
        <Badge
          status={value === 'ACTIVE' ? 'success' : 'default'}
          text={getUserStatusLabel(value)}
        />
      ),
    },
    {
      title: 'Rollar',
      dataIndex: 'roles',
      width: 180,
      render: (roles: string[]) => (
        <Space wrap>
          {roles.map((role) => (
            <Tag key={role} style={{ borderRadius: 999 }}>
              {getRoleLabel(role)}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Amallar',
      key: 'actions',
      width: 260,
      render: (_, record) => (
        <Space wrap>
          <Button
            icon={<EyeOutlined />}
            disabled={!record.id}
            onClick={() => {
              setDrawerUser(record);
              setDrawerOpen(true);
            }}
          >
            Ruxsatlar
          </Button>
          <Popconfirm
            title="Studentni guruhdan chiqarish"
            description="Talaba ushbu guruh orqali berilgan kurs ruxsatidan mahrum bo‘ladi."
            okText="Chiqarish"
            cancelText="Bekor qilish"
            onConfirm={() => handleRemoveStudent(record.id)}
          >
            <Button danger icon={<MinusCircleOutlined />}>
              Guruhdan chiqarish
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const courseColumns: ColumnsType<StudentGroupCourse> = [
    {
      title: 'Kurs',
      key: 'course',
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Text strong>{record.courseTitle || 'Kurs'}</Text>
          <Text style={{ color: '#64748b' }}>
            {record.instructor || 'O‘qituvchi ko‘rsatilmagan'}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Amallar',
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <Popconfirm
          title="Kursni guruhdan olib tashlash"
          description="Bu kurs endi guruh orqali studentlarga berilmaydi."
          okText="Olib tashlash"
          cancelText="Bekor qilish"
          onConfirm={() => handleDetachCourse(record.courseId)}
        >
          <Button danger icon={<DeleteOutlined />}>
            Olib tashlash
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <Helmet>
        <title>Guruh tafsilotlari | Admin panel</title>
      </Helmet>

      {loading ? (
        <div style={{ minHeight: 400, display: 'grid', placeItems: 'center' }}>
          <Spin size="large" />
        </div>
      ) : !details ? (
        <AdminSectionCard>
          <Empty description="Guruh ma’lumotlari topilmadi" />
        </AdminSectionCard>
      ) : (
        <AdminPageFrame
          eyebrow="Guruh tafsilotlari"
          title={details.group.name}
          subtitle={details.group.description || 'Guruh tavsifi kiritilmagan.'}
          actions={
            <Space wrap>
              <Link to={PATH_DASHBOARD.groups}>
                <Button icon={<ArrowLeftOutlined />} size="large" style={{ borderRadius: 16 }}>
                  Guruhlar ro‘yxati
                </Button>
              </Link>
              <Tag color={details.group.active ? 'success' : 'default'} style={{ borderRadius: 999, paddingInline: 12 }}>
                {details.group.active ? 'Faol guruh' : 'Nofaol guruh'}
              </Tag>
            </Space>
          }
        >
          <AdminSectionCard>
            <Space wrap size={[10, 10]}>
              <Tag style={{ margin: 0, borderRadius: 999, paddingInline: 12 }}>
                Studentlar: {draftStudentIds.length}
              </Tag>
              <Tag color="blue" style={{ margin: 0, borderRadius: 999, paddingInline: 12 }}>
                Kurslar: {draftCourseIds.length}
              </Tag>
              <Tag color={details.group.active ? 'success' : 'default'} style={{ margin: 0, borderRadius: 999, paddingInline: 12 }}>
                {details.group.active ? 'Faol guruh' : 'Nofaol guruh'}
              </Tag>
              <Tag color="default" style={{ margin: 0, borderRadius: 999, paddingInline: 12 }}>
                Yaratilgan: {formatDate(details.group.createdAt)}
              </Tag>
            </Space>
          </AdminSectionCard>

          <Tabs
            defaultActiveKey="students"
            items={[
              {
                key: 'students',
                label: (
                  <span>
                    <TeamOutlined /> Talabalar
                  </span>
                ),
                children: (
                  <AdminSectionCard
                    title="Talabalar"
                    extra={
                      <Space wrap style={{ width: '100%', justifyContent: 'flex-end' }}>
                        <Select
                          showSearch
                          filterOption={false}
                          value={selectedStudentId}
                          placeholder="Student qidiring va tanlang"
                          style={{ minWidth: 280, maxWidth: '100%' }}
                          onSearch={handleSearchStudents}
                          onChange={setSelectedStudentId}
                          notFoundContent={
                            studentSearchLoading ? <Spin size="small" /> : null
                          }
                          options={studentOptions.map((user) => ({
                            value: user.id,
                            label: `${getFullName(user)}${user.email ? ` — ${user.email}` : ''}`,
                          }))}
                        />
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={handleAddStudent}
                        >
                          Ro‘yxatga qo‘shish
                        </Button>
                        <Button
                          loading={saving}
                          type={assignmentsDirty ? 'primary' : 'default'}
                          onClick={handleSaveAssignments}
                        >
                          Saqlash
                        </Button>
                      </Space>
                    }
                  >
                    <Paragraph style={{ color: '#64748b', marginBottom: 12 }}>
                      Talabani qidiring, ro‘yxatga qo‘shing va tayyor bo‘lgach saqlang.
                    </Paragraph>
                    {assignmentsDirty ? (
                      <Alert
                        type="info"
                        showIcon
                        message="Studentlar ro‘yxatida saqlanmagan o‘zgarishlar bor"
                        style={{ marginBottom: 16 }}
                      />
                    ) : null}
                    <Table
                      rowKey="id"
                      columns={studentColumns}
                      dataSource={selectedStudents}
                      pagination={false}
                      locale={{
                        emptyText: (
                          <Empty
                            description="Guruhga hali student qo‘shilmagan"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                          />
                        ),
                      }}
                    />
                  </AdminSectionCard>
                ),
              },
              {
                key: 'courses',
                label: (
                  <span>
                    <SafetyCertificateOutlined /> Kurslar
                  </span>
                ),
                children: (
                  <AdminSectionCard
                    title="Guruh kurslari"
                    extra={
                      <Space wrap style={{ width: '100%', justifyContent: 'flex-end' }}>
                        <Select
                          showSearch
                          filterOption={false}
                          value={selectedCourseId}
                          placeholder="Kurs qidiring va tanlang"
                          style={{ minWidth: 280, maxWidth: '100%' }}
                          onSearch={handleSearchCourses}
                          onChange={setSelectedCourseId}
                          notFoundContent={
                            courseSearchLoading ? <Spin size="small" /> : null
                          }
                          options={courseOptions.map((course) => ({
                            value: course.id,
                            label: getCourseLabel(course),
                          }))}
                        />
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={handleAttachCourse}
                        >
                          Ro‘yxatga qo‘shish
                        </Button>
                        <Button
                          loading={saving}
                          type={assignmentsDirty ? 'primary' : 'default'}
                          onClick={handleSaveAssignments}
                        >
                          Saqlash
                        </Button>
                      </Space>
                    }
                  >
                    <Paragraph style={{ color: '#64748b', marginBottom: 12 }}>
                      Kursni tanlang, ro‘yxatga qo‘shing va tayyor bo‘lgach saqlang.
                    </Paragraph>
                    {assignmentsDirty ? (
                      <Alert
                        type="info"
                        showIcon
                        message="Kurslar ro‘yxatida saqlanmagan o‘zgarishlar bor"
                        style={{ marginBottom: 16 }}
                      />
                    ) : null}
                    <Table
                      rowKey="courseId"
                      columns={courseColumns}
                      dataSource={selectedCourses}
                      pagination={false}
                      locale={{
                        emptyText: (
                          <Empty
                            description="Guruhga hali kurs biriktirilmagan"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                          />
                        ),
                      }}
                    />
                  </AdminSectionCard>
                ),
              },
              {
                key: 'settings',
                label: 'Sozlamalar',
                children: (
                  <AdminSectionCard title="Guruh sozlamalari">
                    <Row gutter={[20, 20]}>
                      <Col xs={24} xl={16}>
                        <Form<GroupSettingsForm>
                          form={form}
                          layout="vertical"
                          requiredMark={false}
                          onFinish={handleSaveSettings}
                        >
                          <Form.Item
                            name="name"
                            label="Guruh nomi"
                            rules={[{ required: true, message: 'Guruh nomini kiriting.' }]}
                          >
                            <Input size="large" placeholder="Masalan: Elektrik-2026-1" />
                          </Form.Item>
                          <Form.Item name="description" label="Tavsif">
                            <Input.TextArea rows={4} placeholder="Guruh tavsifi" />
                          </Form.Item>
                          <Form.Item
                            name="active"
                            valuePropName="checked"
                            label="Faollik holati"
                            extra="Nofaol guruh talabalarga kurs ruxsati bermaydi."
                          >
                            <Switch checkedChildren="Faol" unCheckedChildren="Nofaol" />
                          </Form.Item>
                          <Space wrap>
                            <Button
                              type="primary"
                              htmlType="submit"
                              loading={saving}
                            >
                              Saqlash
                            </Button>
                            <Popconfirm
                              title="Guruhni o‘chirish"
                              description="Bu amalni ortga qaytarib bo‘lmaydi."
                              okText="O‘chirish"
                              cancelText="Bekor qilish"
                              okButtonProps={{ danger: true }}
                              onConfirm={handleDeleteGroup}
                            >
                              <Button danger icon={<DeleteOutlined />}>
                                Guruhni o‘chirish
                              </Button>
                            </Popconfirm>
                          </Space>
                        </Form>
                      </Col>
                      <Col xs={24} xl={8}>
                        <div
                          style={{
                            borderRadius: 20,
                            border: '1px solid rgba(148,163,184,0.14)',
                            background: '#f8fafc',
                            padding: 18,
                          }}
                        >
                          <Title level={5} style={{ marginTop: 0 }}>
                            Eslatma
                          </Title>
                          <Paragraph style={{ color: '#64748b', marginBottom: 12 }}>
                            Guruh nofaol bo‘lsa, shu guruh orqali kurs ruxsati ishlamaydi.
                          </Paragraph>
                          <Paragraph style={{ color: '#64748b', marginBottom: 12 }}>
                            Talabaning yakuniy kurs ruxsatini kerak bo‘lsa, “Ruxsatlar” oynasidan tekshirasiz.
                          </Paragraph>
                        </div>
                      </Col>
                    </Row>
                  </AdminSectionCard>
                ),
              },
            ]}
          />
        </AdminPageFrame>
      )}

      <StudentAccessDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setDrawerUser(null);
        }}
        user={drawerUser}
      />
    </div>
  );
};

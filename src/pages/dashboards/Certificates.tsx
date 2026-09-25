import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Avatar,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tooltip,
  Typography,
  Upload,
} from 'antd';
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  FileProtectOutlined,
  FileWordOutlined,
  QrcodeOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  UploadOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Link } from 'react-router-dom';
import ImgCrop from 'antd-img-crop';
import { QRCodeCanvas } from 'qrcode.react';
import { debounce } from 'lodash';
import dayjs, { Dayjs } from 'dayjs';
import { apiClient } from '../../services/api';
import { applyDate, buildDateGroups } from './certificateDates';
import { useAppTranslation } from '../../hooks/useAppTranslation.ts';
import {
  CertificateVerification,
  deleteCertificate,
  downloadCertificateDocx,
  getCertificateErrorMessage,
  listIssuedCertificates,
  updateCertificate,
  uploadCertificatePhoto,
} from './certificatesApi';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface User {
  id: string;
  phoneNumber?: string;
  firstname: string;
  lastname: string;
  middlename?: string;
}

interface Course {
  id: string;
  titleru?: string;
  titleuz?: string;
}

interface ListPayload<T> {
  list: T[];
  count: number;
}

interface ApiWrapper<T> {
  payload?: T;
}

// Friendly labels for editable placeholder values (raw docx keys shown otherwise).
const FIELD_LABELS: Record<string, string> = {
  REG_NO: 'Рег. номер',
  FULLNAME_RU: 'Ф.И.О. (RU)',
  FULLNAME_UZ: 'Ф.И.О. (UZ)',
  FULLNAME_EN: 'Ф.И.О. (EN)',
  PROFESSION_RU: 'Специальность (RU)',
  PROFESSION_UZ: 'Специальность (UZ)',
  PROFESSION_EN: 'Специальность (EN)',
  COURSE_NAME: 'Курс',
  ORG_NAME: 'Учебный центр',
  ORG_CITY: 'Город / регион',
  CER_TYPE: 'Учебный центр',
  GRADE: 'Разряд',
  HOURS: 'Часы',
  HOURS_THEORY: 'Часы теории',
  HOURS_PRACTICE: 'Часы практики',
  HT: 'Часы теории',
  HP: 'Часы практики',
  MT: 'Оценка теории',
  MP: 'Оценка практики',
  STUDY_FORM: 'Форма обучения',
  EQUIPMENT: 'Оборудование',
  QUALIFICATION: 'Квалификация',
  STUDY_PERIOD: 'Период (текст)',
  PRT: 'Протокол №',
  DIRECTOR: 'Директор',
  CHAIRMANRU: 'Председатель (RU)',
  CHAIRMANUZ: 'Председатель (UZ)',
  CEORU: 'Руководитель (RU)',
  CEOUZ: 'Руководитель (UZ)',
  INSPECTOR: 'Инспектор',
  ELEC_GROUP: 'Группа эл.безопасности',
  DFD: 'Начало: день',
  DFMR: 'Начало: месяц (RU)',
  DFMU: 'Начало: месяц (UZ)',
  DFY: 'Начало: год',
  DTD: 'Конец: день',
  DTMR: 'Конец: месяц (RU)',
  DTMU: 'Конец: месяц (UZ)',
  DTY: 'Конец: год',
  ISDAY: 'Выдача: день',
  ISMON: 'Выдача: месяц',
  ISMR: 'Выдача: месяц (RU)',
  ISMU: 'Выдача: месяц (UZ)',
  ISY: 'Выдача: год',
  COMD: 'Комиссия: день',
  COMM: 'Комиссия: месяц',
  COMY: 'Комиссия: год',
  DATE_FROM: 'Начало',
  DATE_TO: 'Конец',
  ISSUE_DATE: 'Дата выдачи',
};

// Internal keys never shown for editing.
const HIDDEN_KEYS = new Set(['QR_DATA']);

/**
 * Объём программы в часах. У старых сертификатов этого ключа просто нет,
 * поэтому поле показываем всегда — а не только когда он уже заполнен.
 */
const HOURS_KEY = 'HOURS';

const recipientOf = (c: CertificateVerification) =>
  c.values?.FULLNAME_RU || c.values?.FULLNAME_UZ || c.values?.FULLNAME_EN || '—';

const courseOf = (c: CertificateVerification) =>
  c.values?.COURSE_NAME || c.values?.PROFESSION_RU || c.values?.PROFESSION_UZ || '—';

const formatDate = (value?: string) => (value ? value.replace('T', ' ').slice(0, 16) : '—');

const getUserLabel = (u: User) =>
  `${u.firstname} ${u.lastname}${u.middlename ? ` ${u.middlename}` : ''}${
    u.phoneNumber ? ` (${u.phoneNumber})` : ''
  }`;

const getCourseLabel = (c: Course) => c.titleru || c.titleuz || c.id;

export const DashboardCertificatesPage = () => {
  const { t } = useAppTranslation();
  const [items, setItems] = useState<CertificateVerification[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [userId, setUserId] = useState<string | undefined>();
  const [courseId, setCourseId] = useState<string | undefined>();
  const [templateName, setTemplateName] = useState<string | undefined>();
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [userLoading, setUserLoading] = useState(false);
  const [courseLoading, setCourseLoading] = useState(false);

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Edit modal
  const [editing, setEditing] = useState<CertificateVerification | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSerial, setEditSerial] = useState('');
  const [editPhoto, setEditPhoto] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [photoUploading, setPhotoUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // QR modal
  const [qrCert, setQrCert] = useState<CertificateVerification | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listIssuedCertificates());
    } catch (err) {
      message.error(getCertificateErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async (searchKey = '') => {
    setUserLoading(true);
    try {
      const res = await apiClient.get<ApiWrapper<ListPayload<User>>>('/v1/users/list', {
        params: { start: 0, limit: 20, searchKey },
      });
      setUsers(res.data?.payload?.list || []);
    } catch (err) {
      message.error(getCertificateErrorMessage(err));
    } finally {
      setUserLoading(false);
    }
  }, []);

  const loadCourses = useCallback(async (searchKey = '') => {
    setCourseLoading(true);
    try {
      const res = await apiClient.get<ApiWrapper<ListPayload<Course>>>('/v1/course/list', {
        params: { start: 0, limit: 20, searchKey },
      });
      setCourses(res.data?.payload?.list || []);
    } catch (err) {
      message.error(getCertificateErrorMessage(err));
    } finally {
      setCourseLoading(false);
    }
  }, []);

  const debouncedUsers = useMemo(() => debounce((v: string) => loadUsers(v), 350), [loadUsers]);
  const debouncedCourses = useMemo(
    () => debounce((v: string) => loadCourses(v), 350),
    [loadCourses]
  );

  useEffect(() => {
    load();
    loadUsers('');
    loadCourses('');
  }, [load, loadUsers, loadCourses]);

  useEffect(
    () => () => {
      debouncedUsers.cancel();
      debouncedCourses.cancel();
    },
    [debouncedUsers, debouncedCourses]
  );

  const typeOptions = useMemo(() => {
    const map = new Map<string, string>();
    items.forEach((c) => {
      const label = c.templateName || c.templateCode;
      if (label) map.set(label, label);
    });
    return Array.from(map.values()).map((v) => ({ value: v, label: v }));
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((c) => {
      if (userId && c.userId !== userId) return false;
      if (courseId && c.courseId !== courseId) return false;
      if (templateName && (c.templateName || c.templateCode) !== templateName) return false;
      if (range && c.issuedAt) {
        const d = dayjs(c.issuedAt);
        if (d.isBefore(range[0].startOf('day')) || d.isAfter(range[1].endOf('day'))) return false;
      }
      if (q) {
        const haystack = [c.serialNumber, c.templateName, c.templateCode, recipientOf(c), courseOf(c)]
          .filter(Boolean)
          .some((v) => v!.toLowerCase().includes(q));
        if (!haystack) return false;
      }
      return true;
    });
  }, [items, search, userId, courseId, templateName, range]);

  const hasFilters = !!(search || userId || courseId || templateName || range);

  const resetFilters = () => {
    setSearch('');
    setUserId(undefined);
    setCourseId(undefined);
    setTemplateName(undefined);
    setRange(null);
  };

  const stats = useMemo(() => {
    const now = dayjs();
    const withPhoto = items.filter((c) => c.photoUrl).length;
    const thisMonth = items.filter(
      (c) => c.issuedAt && dayjs(c.issuedAt).isSame(now, 'month')
    ).length;
    return { total: items.length, thisMonth, types: typeOptions.length, withPhoto };
  }, [items, typeOptions]);

  const copyLink = (id: string) => {
    const url = `${window.location.origin}/cert/${id}`;
    navigator.clipboard?.writeText(url).then(
      () => message.success(t('admin.certs.linkCopied')),
      () => message.error(t('admin.certs.copyFailed'))
    );
  };

  const handleDownloadDocx = async (record: CertificateVerification) => {
    setDownloadingId(record.id);
    try {
      const base = record.serialNumber || record.templateName || 'certificate';
      await downloadCertificateDocx(record.id, `${base}.docx`);
    } catch (err) {
      message.error(getCertificateErrorMessage(err));
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (record: CertificateVerification) => {
    try {
      await deleteCertificate(record.id);
      message.success(t('admin.certs.deleted'));
      setItems((prev) => prev.filter((c) => c.id !== record.id));
    } catch (err) {
      message.error(getCertificateErrorMessage(err));
    }
  };

  // ---- edit ----
  const openEdit = (record: CertificateVerification) => {
    setEditing(record);
    setEditTitle(record.templateName || '');
    setEditSerial(record.serialNumber || '');
    setEditPhoto(record.photoUrl || null);
    const vals: Record<string, string> = {};
    Object.entries(record.values || {}).forEach(([k, v]) => {
      if (!HIDDEN_KEYS.has(k)) vals[k] = v;
    });
    setEditValues(vals);
  };

  const closeEdit = () => {
    setEditing(null);
    setEditValues({});
  };

  const handleEditPhoto = async (file: File) => {
    setPhotoUploading(true);
    try {
      const url = await uploadCertificatePhoto(file);
      setEditPhoto(url);
    } catch (err) {
      message.error(getCertificateErrorMessage(err));
    } finally {
      setPhotoUploading(false);
    }
  };

  // Даты бланка (день / месяц / год лежат в разных ключах) редактируются одним
  // календарём на группу: см. ./certificateDates.
  const dateGroups = useMemo(() => buildDateGroups(editValues), [editValues]);

  const plainKeys = useMemo(
    () =>
      Object.keys(editValues).filter(
        (k) => !dateGroups.handledKeys.has(k) && k !== HOURS_KEY
      ),
    [editValues, dateGroups]
  );

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      // Пустые часы не сохраняем — иначе у сертификата появится пустой ключ HOURS.
      const valuesToSave = { ...editValues };
      if (!valuesToSave[HOURS_KEY]?.trim() && editing.values?.[HOURS_KEY] == null) {
        delete valuesToSave[HOURS_KEY];
      }

      const updated = await updateCertificate(editing.id, {
        documentTitle: editTitle.trim(),
        serialNumber: editSerial.trim(),
        photoUrl: editPhoto,
        values: valuesToSave,
      });
      if (updated) {
        setItems((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      } else {
        await load();
      }
      message.success(t('admin.certs.updated'));
      closeEdit();
    } catch (err) {
      message.error(getCertificateErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // ---- QR download ----
  const downloadQrPng = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `QR_${qrCert?.serialNumber || qrCert?.id}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const columns: ColumnsType<CertificateVerification> = [
    {
      title: t('admin.certs.colRecipient'),
      key: 'recipient',
      render: (_, record) => (
        <Space>
          <Avatar
            src={record.photoUrl || undefined}
            icon={<UserOutlined />}
            shape="square"
            size={40}
            style={{ borderRadius: 10, flex: '0 0 auto' }}
          />
          <Space direction="vertical" size={0}>
            <Text strong>{recipientOf(record)}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {courseOf(record)}
            </Text>
          </Space>
        </Space>
      ),
    },
    {
      title: '№',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 100,
      render: (value: string) => value || '—',
    },
    {
      title: t('admin.certs.colType'),
      dataIndex: 'templateName',
      key: 'templateName',
      width: 190,
      render: (value: string, record) => (
        <Space direction="vertical" size={0}>
          <Text>{value || record.templateCode}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.templateCode}
          </Text>
        </Space>
      ),
    },
    {
      title: t('admin.certs.colIssued'),
      dataIndex: 'issuedAt',
      key: 'issuedAt',
      width: 160,
      sorter: (a, b) => dayjs(a.issuedAt).valueOf() - dayjs(b.issuedAt).valueOf(),
      defaultSortOrder: 'descend',
      render: (value: string) => formatDate(value),
    },
    {
      title: t('admin.certs.colAction'),
      key: 'action',
      width: 250,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4} wrap>
          <Tooltip title={t('admin.certs.tip.verify')}>
            <Link to={`/cert/${record.id}`} target="_blank">
              <Button size="small" type="text" icon={<SafetyCertificateOutlined />} />
            </Link>
          </Tooltip>
          <Tooltip title={t('admin.certs.tip.docx')}>
            <Button
              size="small"
              type="text"
              icon={<FileWordOutlined />}
              loading={downloadingId === record.id}
              onClick={() => handleDownloadDocx(record)}
            />
          </Tooltip>
          <Tooltip title={t('admin.certs.tip.qr')}>
            <Button size="small" type="text" icon={<QrcodeOutlined />} onClick={() => setQrCert(record)} />
          </Tooltip>
          <Tooltip title={t('admin.certs.tip.copy')}>
            <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => copyLink(record.id)} />
          </Tooltip>
          <Tooltip title={t('admin.common.edit')}>
            <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          </Tooltip>
          <Popconfirm
            title={t('admin.certs.deleteTitle')}
            description={t('admin.certs.deleteHint')}
            okText={t('admin.certs.yesDelete')}
            cancelText={t('admin.common.cancel')}
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record)}
          >
            <Tooltip title={t('admin.certs.tip.delete')}>
              <Button size="small" type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }} className="mt-4">
      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic title={t('admin.certs.statTotal')} value={stats.total} prefix={<FileProtectOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic title={t('admin.certs.statMonth')} value={stats.thisMonth} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic title={t('admin.certs.statTypes')} value={stats.types} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic title={t('admin.certs.statPhoto')} value={stats.withPhoto} />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Title level={4} style={{ margin: 0 }}>
            {t('admin.certs.listTitle')}
          </Title>
        }
        extra={
          <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
            {t('admin.common.refresh')}
          </Button>
        }
      >
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={24} md={8} lg={6}>
            <Input.Search
              allowClear
              value={search}
              placeholder={t('admin.certs.searchPh')}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Col>
          <Col xs={24} md={8} lg={6}>
            <Select
              allowClear
              showSearch
              style={{ width: '100%' }}
              placeholder={t('admin.certs.byUser')}
              value={userId}
              optionFilterProp="label"
              filterOption={false}
              onSearch={debouncedUsers}
              onChange={setUserId}
              onFocus={() => { if (!users.length) loadUsers(''); }}
              notFoundContent={userLoading ? <Spin size="small" /> : null}
              options={users.map((u) => ({ value: u.id, label: getUserLabel(u) }))}
            />
          </Col>
          <Col xs={24} md={8} lg={6}>
            <Select
              allowClear
              showSearch
              style={{ width: '100%' }}
              placeholder={t('admin.certs.byCourse')}
              value={courseId}
              optionFilterProp="label"
              filterOption={false}
              onSearch={debouncedCourses}
              onChange={setCourseId}
              onFocus={() => { if (!courses.length) loadCourses(''); }}
              notFoundContent={courseLoading ? <Spin size="small" /> : null}
              options={courses.map((c) => ({ value: c.id, label: getCourseLabel(c) }))}
            />
          </Col>
          <Col xs={12} md={8} lg={3}>
            <Select
              allowClear
              style={{ width: '100%' }}
              placeholder={t('admin.certs.byType')}
              value={templateName}
              onChange={setTemplateName}
              options={typeOptions}
            />
          </Col>
          <Col xs={12} md={8} lg={3}>
            <RangePicker
              style={{ width: '100%' }}
              format="DD.MM.YYYY"
              value={range as never}
              onChange={(v) => setRange(v as [Dayjs, Dayjs] | null)}
            />
          </Col>
          {hasFilters && (
            <Col xs={24} lg={24}>
              <Space>
                <Text type="secondary">
                  {filtered.length} / {items.length} ta natija
                </Text>
                <Button type="link" size="small" onClick={resetFilters}>
                  {t('admin.common.clearFilters')}
                </Button>
              </Space>
            </Col>
          )}
        </Row>

        <Table<CertificateVerification>
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={filtered}
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (count) => t('admin.certs.total', { count }) }}
          scroll={{ x: 980 }}
        />
      </Card>

      {/* ---- Edit modal ---- */}
      <Modal
        title={t('admin.certs.editTitle')}
        open={!!editing}
        onCancel={closeEdit}
        onOk={saveEdit}
        okText={t('admin.common.save')}
        cancelText={t('admin.common.cancel')}
        okButtonProps={{ loading: saving }}
        width="min(760px, calc(100vw - 24px))"
        centered
        destroyOnClose
      >
        <Form layout="vertical">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: 12,
              marginBottom: 12,
              borderRadius: 12,
              border: '1px dashed rgba(148,163,184,0.5)',
            }}
          >
            <Avatar shape="square" size={64} src={editPhoto || undefined} icon={<UserOutlined />} style={{ borderRadius: 12 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{t('admin.certs.photo')}</div>
              <Text type="secondary" style={{ fontSize: 12 }}>{t('admin.certs.photoHint')}</Text>
            </div>
            <Space>
              <ImgCrop rotationSlider aspect={3 / 4} modalTitle="Rasmni kesish">
                <Upload
                  accept="image/*"
                  maxCount={1}
                  showUploadList={false}
                  beforeUpload={(file) => {
                    if (!file.type.startsWith('image/')) {
                      message.error(t('admin.common.imageOnly'));
                      return Upload.LIST_IGNORE;
                    }
                    if (file.size / 1024 / 1024 >= 5) {
                      message.error('≤ 5MB');
                      return Upload.LIST_IGNORE;
                    }
                    handleEditPhoto(file);
                    return false;
                  }}
                >
                  <Button icon={<UploadOutlined />} loading={photoUploading}>
                    {editPhoto ? t('admin.common.replace') : t('admin.common.upload')}
                  </Button>
                </Upload>
              </ImgCrop>
              {editPhoto && (
                <Button danger icon={<DeleteOutlined />} onClick={() => setEditPhoto(null)} />
              )}
            </Space>
          </div>

          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Form.Item label={t('admin.certs.docType')}>
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder={t('admin.certs.docType')} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label={t('admin.certs.serialPh')}>
                <Input value={editSerial} onChange={(e) => setEditSerial(e.target.value)} placeholder="2456" />
              </Form.Item>
            </Col>
          </Row>

          {dateGroups.groups.length > 0 && (
            <>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {t('admin.certs.datesHint')}
              </Text>
              <Row gutter={12} style={{ marginTop: 8 }}>
                {dateGroups.groups.map((group) => (
                  <Col xs={24} md={12} key={group.label}>
                    <Form.Item
                      label={
                        <span>
                          {group.label}{' '}
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            ({group.keys.join(', ')})
                          </Text>
                        </span>
                      }
                      style={{ marginBottom: 12 }}
                    >
                      <DatePicker
                        value={group.value}
                        format="DD.MM.YYYY"
                        allowClear={false}
                        style={{ width: '100%' }}
                        onChange={(date) =>
                          date && setEditValues((prev) => applyDate(prev, group.keys, date))
                        }
                      />
                    </Form.Item>
                  </Col>
                ))}
              </Row>
            </>
          )}

          <Row gutter={12} style={{ marginTop: 8 }}>
            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <span>
                    {t('admin.certs.hoursLabel')}{' '}
                    <Text type="secondary" style={{ fontSize: 11 }}>({HOURS_KEY})</Text>
                  </span>
                }
                extra={t('admin.certs.hoursExtra')}
                style={{ marginBottom: 12 }}
              >
                <Input
                  value={editValues[HOURS_KEY] ?? ''}
                  onChange={(e) =>
                    setEditValues((prev) => ({ ...prev, [HOURS_KEY]: e.target.value }))
                  }
                  placeholder={t('admin.certs.hoursPh')}
                  suffix={<Text type="secondary">{t('admin.certs.hoursUnit')}</Text>}
                />
              </Form.Item>
            </Col>
          </Row>

          <Text type="secondary" style={{ fontSize: 12 }}>
            {t('admin.certs.fieldsHint')}
          </Text>
          <Row gutter={12} style={{ marginTop: 8 }}>
            {plainKeys.map((key) => (
              <Col xs={24} md={12} key={key}>
                <Form.Item
                  label={
                    <span>
                      {FIELD_LABELS[key] || key}{' '}
                      <Text type="secondary" style={{ fontSize: 11 }}>({key})</Text>
                    </span>
                  }
                  style={{ marginBottom: 12 }}
                >
                  <Input
                    value={editValues[key]}
                    onChange={(e) =>
                      setEditValues((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                  />
                </Form.Item>
              </Col>
            ))}
          </Row>
        </Form>
      </Modal>

      {/* ---- QR download modal ---- */}
      <Modal
        title={t('admin.certs.qrTitle')}
        open={!!qrCert}
        onCancel={() => setQrCert(null)}
        footer={[
          <Button key="close" onClick={() => setQrCert(null)}>
            {t('admin.common.close')}
          </Button>,
          <Button key="dl" type="primary" icon={<QrcodeOutlined />} onClick={downloadQrPng}>
            {t('admin.certs.qrDownload')}
          </Button>,
        ]}
        centered
      >
        {qrCert && (
          <div ref={qrRef} style={{ textAlign: 'center', padding: 16 }}>
            <QRCodeCanvas
              value={`${window.location.origin}/cert/${qrCert.id}`}
              size={240}
              level="M"
              includeMargin
            />
            <div style={{ marginTop: 12 }}>
              <Text type="secondary" style={{ wordBreak: 'break-all' }}>
                {window.location.origin}/cert/{qrCert.id}
              </Text>
            </div>
          </div>
        )}
      </Modal>
    </Space>
  );
};

import { Helmet } from 'react-helmet-async';
import { PageHeader } from '../../components';
import {
  DeleteOutlined,
  EditOutlined,
  HomeOutlined,
  PieChartOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  Badge,
  Button,
  Col,
  Form,
  Input,
  Modal,
  Radio,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
} from 'antd';
import { useEffect, useState } from 'react';
import { DASHBOARD_ITEMS } from '../../constants';
import { Link } from 'react-router-dom';
import axios from 'axios';

const { Option } = Select;

export const DashboardUsersPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();
  const [updatePassword, setUpdatePassword] = useState(false);

  const showModal = () => {
    setIsModalOpen(true);
    setIsEditing(false);
    setUpdatePassword(false);
    form.resetFields();
  };

  useEffect(() => {
    axios.get('http://localhost:8080/api/v1/users/list').then((res) => {
      console.log(res);
    });
  }, []);

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const handleEdit = (record: any) => {
    setIsModalOpen(true);
    setIsEditing(true);
    form.setFieldsValue(record);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'Фаол':
        return <Badge status="success" text="Фаол" />;
      case 'Нофаол':
        return <Badge status="error" text="Нофаол" />;
      case 'Тасдиқланган':
        return <Badge status="processing" text="Тасдиқланган" />;
      default:
        return status;
    }
  };

  const columns = [
    {
      title: 'Т/р',
      dataIndex: 'tr',
      key: 'tr',
    },
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Исм',
      dataIndex: 'firstname',
      key: 'firstname',
    },
    {
      title: 'Фамилия',
      dataIndex: 'lastname',
      key: 'lastname',
    },
    {
      title: 'Телефон рақами',
      dataIndex: 'phonenumber',
      key: 'phonenumber',
    },
    {
      title: 'Электрон почта',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Ҳолати',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => statusBadge(status),
    },
    {
      title: 'Роллар',
      dataIndex: 'roles',
      key: 'roles',
      render: (roles: string[]) => (
        <Space>
          {roles.map((role, index) => (
            <Tag
              color={['blue', 'green', 'orange', 'purple'][index % 4]}
              key={role}
            >
              {role}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Амаллар',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Tooltip title="Таҳрирлаш">
            <Button
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Ўчириш">
            <Button danger icon={<DeleteOutlined />} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Helmet>
        <title>Фойдаланувчилар | Dashboard</title>
      </Helmet>
      <PageHeader
        title="Фойдаланувчилар"
        breadcrumbs={[
          {
            title: (
              <>
                <HomeOutlined />
                <span>home</span>
              </>
            ),
            path: '/',
          },
          {
            title: (
              <>
                <PieChartOutlined />
                <span>dashboards</span>
              </>
            ),
            menu: {
              items: DASHBOARD_ITEMS.map((d) => ({
                key: d.title,
                title: <Link to={d.path}>{d.title}</Link>,
              })),
            },
          },
          {
            title: 'Фойдаланувчилар',
          },
        ]}
      />

      <Row justify="space-between" className="mb-4">
        <Col span={12}>
          <Input.Search
            placeholder="Қидириш..."
            allowClear
            style={{ maxWidth: 300 }}
          />
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>
            Фойдаланувчи қўшиш
          </Button>
        </Col>
      </Row>

      <Table rowKey="id" columns={columns} dataSource={[]} />

      <Modal
        title={isEditing ? 'Фойдаланувчини таҳрирлаш' : 'Фойдаланувчи қўшиш'}
        open={isModalOpen}
        onCancel={handleCancel}
        onOk={() => form.submit()}
        okText="Сақлаш"
        cancelText="Бекор қилиш"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => console.log(values)}
        >
          {isEditing && (
            <Form.Item label="Паролни янгилайсизми?" name="updatePassword">
              <Radio.Group onChange={(e) => setUpdatePassword(e.target.value)}>
                <Radio value={true}>Ҳа</Radio>
                <Radio value={false}>Йўқ</Radio>
              </Radio.Group>
            </Form.Item>
          )}

          <Form.Item
            label="Исм"
            name="firstname"
            rules={[{ required: true, message: 'Илтимос, исмни киритинг' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Фамилия"
            name="lastname"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Телефон рақами"
            name="phonenumber"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Электрон почта"
            name="email"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          {(!isEditing || updatePassword) && (
            <>
              <Form.Item
                label="Парол"
                name="password"
                rules={[{ required: true }]}
              >
                <Input.Password />
              </Form.Item>
              <Form.Item
                label="Паролни тасдиқланг"
                name="confirmpassword"
                rules={[{ required: true }]}
              >
                <Input.Password />
              </Form.Item>
            </>
          )}

          <Form.Item label="Ҳолати" name="status" rules={[{ required: true }]}>
            <Select placeholder="Ҳолатни танланг">
              <Option value="Фаол">Фаол</Option>
              <Option value="Нофаол">Нофаол</Option>
              <Option value="Тасдиқланган">Тасдиқланган</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Роллар" name="roles" rules={[{ required: true }]}>
            <Select mode="multiple" placeholder="Ролларни танланг">
              <Option value="Админ">Админ</Option>
              <Option value="Ўқитувчи">Ўқитувчи</Option>
              <Option value="Талаба">Талаба</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
} from 'antd';
import { useEffect, useState } from 'react';
import {
  DeleteOutlined,
  EditOutlined,
  HomeOutlined,
  PieChartOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { v4 as uuidv4 } from 'uuid';
import { DASHBOARD_ITEMS } from '../../constants';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components';
import { Helmet } from 'react-helmet-async';
import requestAPI from '../../services/api.ts';
import axios from 'axios';

type Course = {
  id: string;
  title: string;
  description: string;
  instructor: string;
  ppvCode: string;
};

const generateCode = () => {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 8 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('');
};

const instructors = ['Abdulla Qodiriy', 'Gulsara Karimova', 'Jamshid Ismoilov'];

export const DashboardCoursesPage = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [form] = Form.useForm();
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = () => {
    axios.get('http://localhost:8080/api/v1/course/list').then((res) => {
      console.log(res);
    });

  };

  const showModal = (course?: Course) => {
    if (course) {
      setEditingCourse(course);
      form.setFieldsValue(course);
    } else {
      form.resetFields();
      
    }
    setModalVisible(true);
  };

  const handleModalOk = () => {
    form
      .validateFields()
      .then((values) => {
        if (editingCourse) {
          // Update the course
          requestAPI
            .put('/course/update', values)
            .then((response) => {
              console.log(response);
              setCourses((prev) =>
                prev.map((c) =>
                  c.id === editingCourse.id
                    ? { ...editingCourse, ...values }
                    : c
                )
              );
              message.success('Курс муваффақиятли янгиланди');
            })
            .catch((error) => {
              message.error('Курсни янгилашда хато');
              console.error(error);
            });
        } else {
          // Create a new course
          const newCourse = {
            ...values,
            id: uuidv4(),
            ppvCode: generateCode(),
          };
          
        }
        setModalVisible(false);
        setEditingCourse(null);
      })
      .catch(() => {});
  };

  const handleDelete = (id: string) => {
    // requestAPI('DELETE', `/course/delete?id=${id}`)
    //   .then(() => {
    //     setCourses((prev) => prev.filter((c) => c.id !== id));
    //     message.success('Курс ўчирилди');
    //   })
    //   .catch((error) => {
    //     message.error('Курсни ўчиришда хато');
    //     console.error(error);
    //   });
  };

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: ColumnsType<Course> = [
    {
      title: '№',
      render: (_text, _record, index) => index + 1,
      width: 60,
      fixed: 'left',
    },
    {
      title: 'Номи',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Тавсифи',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Инструктор',
      dataIndex: 'instructor',
      key: 'instructor',
    },
    {
      title: 'PPV КОДИ',
      dataIndex: 'ppvCode',
      key: 'ppvCode',
    },
    {
      title: 'Амаллар',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
          />
          <Popconfirm
            title="Ҳақиқатан ҳам ўчирмоқчимисиз?"
            onConfirm={() => handleDelete(record.id)}
            okText="Ҳа"
            cancelText="Йўқ"
          >
            <Button danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
          <Button
            size="small"
            icon={<PieChartOutlined />}
            onClick={() => navigate(`/dashboards/topics?courseId=${record.id}`)}
          >
            Мавзулар
          </Button>
        </Space>
      ),
      fixed: 'right',
      width: 150,
    },
  ];

  return (
    <div className="p-4 w-100">
      <Helmet>
        <title>Курслар | Dashboard</title>
      </Helmet>
      <PageHeader
        title="Курслар"
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
            title: 'Курслар',
          },
        ]}
      />

      <div className="w-100 flex justify-between items-center mb-4 gap-2 flex-wrap">
        <Input.Search
          placeholder="Курс номи ёки тавсифи бўйича қидиринг..."
          allowClear
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ maxWidth: 400 }}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => showModal()}
          style={{
            float: 'right',
          }}
        >
          Янги курс
        </Button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <Table
          dataSource={filteredCourses}
          columns={columns}
          rowKey="id"
          scroll={{ x: 'max-content' }}
          pagination={{ pageSize: 5 }}
        />
      </div>

      <Modal
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingCourse(null);
        }}
        onOk={handleModalOk}
        title={editingCourse ? 'Курсни таҳрирлаш' : 'Янги курс қўшиш'}
        okText={editingCourse ? 'Сақлаш' : 'Қўшиш'}
        cancelText="Бекор қилиш"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Курс номи"
            name="title"
            rules={[
              { required: true, message: 'Илтимос, курс номини киритинг' },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Тавсифи"
            name="description"
            rules={[{ required: true, message: 'Илтимос, тавсифни киритинг' }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item
            label="Инструктор"
            name="instructor"
            rules={[{ required: true, message: 'Инструкторни танланг' }]}
          >
            <Select
              showSearch
              placeholder="Инструкторни танланг"
              options={instructors.map((i) => ({ label: i, value: i }))}
              filterOption={(input, option) =>
                (option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

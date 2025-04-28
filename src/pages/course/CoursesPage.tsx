import React, { useState } from 'react';
import { Input, Table } from 'antd';

type Course = {
  key: string;
  title: string;
  description: string;
  ppvCode: string;
  instructor: string;
  createdBy: string;
  modifiedBy: string;
  deleted: boolean;
};

export const CoursesPage = () => {
  const [searchText, setSearchText] = useState<string>('');
  const [courses, setCourses] = useState<Course[]>([
    {
      key: '1',
      title: 'Kurs 1',
      description: 'Kursning birinchi tavsifi.',
      ppvCode: 'C1',
      instructor: 'Instructor 1',
      createdBy: 'Admin',
      modifiedBy: 'Admin',
      deleted: false,
    },
    {
      key: '2',
      title: 'Kurs 2',
      description: 'Kursning ikkinchi tavsifi.',
      ppvCode: 'C2',
      instructor: 'Instructor 2',
      createdBy: 'Admin',
      modifiedBy: 'Admin',
      deleted: false,
    },
    {
      key: '3',
      title: 'Kurs 3',
      description: 'Kursning uchinchi tavsifi.',
      ppvCode: 'C3',
      instructor: 'Instructor 3',
      createdBy: 'Admin',
      modifiedBy: 'Admin',
      deleted: true,
    },
    // Boshqa kurslar
  ]);

  const columns = [
    {
      title: 'Курс номи',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Тавсиф',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Код',
      dataIndex: 'ppvCode',
      key: 'ppvCode',
    },
    {
      title: 'Инструктор',
      dataIndex: 'instructor',
      key: 'instructor',
    },
    {
      title: 'Яратган',
      dataIndex: 'createdBy',
      key: 'createdBy',
    },
    {
      title: 'Ўзгартирган',
      dataIndex: 'modifiedBy',
      key: 'modifiedBy',
    },
    {
      title: 'Очилган',
      dataIndex: 'deleted',
      key: 'deleted',
      render: (deleted: boolean) => (deleted ? 'Ҳа' : 'Йўқ'),
    },
  ];

  // Search functionality
  const onSearch = (value: string) => {
    setSearchText(value);
  };

  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div style={{ padding: '20px' }}>
      <h2>Kurslar</h2>
      <Input.Search
        placeholder="Kurs nomi bo‘yicha qidirish"
        onSearch={onSearch}
        style={{ marginBottom: '20px', width: '300px' }}
      />
      <Table
        columns={columns}
        dataSource={filteredCourses}
        rowKey="key"
        pagination={false} // Sahifalashni faollashtirish uchun `pagination={true}` qilib qo‘yish mumkin
      />
    </div>
  );
};

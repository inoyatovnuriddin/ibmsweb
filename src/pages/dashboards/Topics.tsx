import { Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { PageHeader } from '../../components';
import { HomeOutlined, PieChartOutlined } from '@ant-design/icons';
import { DASHBOARD_ITEMS } from '../../constants';

export const Topics = () => {
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const courseId = params.get('courseId');

  console.log(courseId);

  
  return (
    <div>
      <Helmet>
        <title>Мавзулар | Dashboard</title>
      </Helmet>
      <PageHeader
        title="Мавзулар"
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
            title: 'Мавзулар',
          },
        ]}
      />
    </div>
  );
};



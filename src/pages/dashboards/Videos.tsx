import { Helmet } from 'react-helmet-async';
import { PageHeader } from '../../components';
import { HomeOutlined, PieChartOutlined } from '@ant-design/icons';
import { DASHBOARD_ITEMS } from '../../constants';
import { Link } from 'react-router-dom';

export const DashboardVideosPage = () => {
  return (
    <div>
      <Helmet>
        <title>Видеолар | Dashboard</title>
      </Helmet>
      <PageHeader
        title="Видеолар"
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
            title: 'Видеолар',
          },
        ]}
      />
    </div>
  );
};

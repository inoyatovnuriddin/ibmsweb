import { useLocation } from 'react-router-dom';

export const DashboardTopicPage = () => {
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const courseId = params.get('courseId');

  
  return (
    <div>
      <h1>Topics for Course ID: {courseId}</h1>
    </div>
  );
};



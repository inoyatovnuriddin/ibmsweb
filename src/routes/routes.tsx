import { createBrowserRouter, useLocation } from 'react-router-dom';
import {
  AccountDeactivePage,
  CompleteProfilePage,
  CourseLearningPage,
  CoursesPage,
  DashboardCourseMonitoringPage,
  DashboardCoursesPage,
  DashboardGroupDetailsPage,
  DashboardGroupsPage,
  DashboardQrCodePage,
  DashboardTestsPage,
  DashboardUsersPage,
  DashboardVideosPage,
  Error400Page,
  Error403Page,
  Error404Page,
  Error500Page,
  Error503Page,
  ErrorPage,
  GoogleCallbackPage,
  HomePage,
  PasswordResetPage,
  ResetPasswordConfirmPage,
  SignInPage,
  SignUpPage,
  Topics,
  UserProfileActionsPage,
  UserProfileActivityPage,
  UserProfileDetailsPage,
  UserProfileFeedbackPage,
  UserProfileHelpPage,
  UserProfileInformationPage,
  UserProfileMyLearningPage,
  UserProfilePreferencesPage,
  UserProfileSecurityPage,
  VerifyEmailPage,
  WelcomePage,
} from '../pages';
import { DashboardLayout, GuestLayout, UserAccountLayout } from '../layouts';
import React, { ReactNode, useEffect } from 'react';
import { ProtectedRoute } from './ProtectedRoute.tsx';
import { DiplomaQrPage } from '../pages/diploma';

export const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  }, [pathname]);

  return null;
};

type PageProps = {
  children: ReactNode;
};

const PageWrapper = ({ children }: PageProps) => {
  return (
    <>
      <ScrollToTop />
      {children}
    </>
  );
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <PageWrapper children={<GuestLayout />} />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        path: '',
        element: <HomePage />,
      },
    ],
  },
  {
    path: '/courses',
    element: <PageWrapper children={<GuestLayout />} />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        path: '',
        element: <CoursesPage />,
      },
    ],
  },
  {
    path: '/course/:courseId',
    element: <PageWrapper children={<GuestLayout />} />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <CourseLearningPage />,
      },
    ],
  },
  {
    path: '/diploma/:diplomaId/qr',
    element: <DiplomaQrPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
        <PageWrapper>
          <DashboardLayout />
        </PageWrapper>
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        path: 'groups',
        element: <DashboardGroupsPage />,
      },
      {
        path: 'groups/:groupId',
        element: <DashboardGroupDetailsPage />,
      },
    ],
  },
  {
    path: '/dashboards',
    element: (
      <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
        <PageWrapper>
          <DashboardLayout />
        </PageWrapper>
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        path: 'courses',
        element: <DashboardCoursesPage />,
      },
      {
        path: 'topics',
        element: <Topics />,
      },
      {
        path: 'videos',
        element: <DashboardVideosPage />,
      },
      {
        path: 'users',
        element: <DashboardUsersPage />,
      },
      {
        path: 'qrCode',
        element: <DashboardQrCodePage />,
      },
      {
        path: 'tests',
        element: <DashboardTestsPage />,
      },
      {
        path: 'monitoring',
        element: <DashboardCourseMonitoringPage />,
      },
    ],
  },
  {
    path: '/user-profile',
    element: (
      <ProtectedRoute
        allowedRoles={['ROLE_ADMIN', 'ROLE_USER', 'ROLE_INSTRUCTOR']}
      >
        <PageWrapper children={<UserAccountLayout />} />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        path: 'details',
        element: <UserProfileDetailsPage />,
      },
      {
        path: 'my-learning',
        element: <UserProfileMyLearningPage />,
      },
      {
        path: 'preferences',
        element: <UserProfilePreferencesPage />,
      },
      {
        path: 'information',
        element: <UserProfileInformationPage />,
      },
      {
        path: 'security',
        element: <UserProfileSecurityPage />,
      },
      {
        path: 'activity',
        element: <UserProfileActivityPage />,
      },
      {
        path: 'actions',
        element: <UserProfileActionsPage />,
      },
      {
        path: 'help',
        element: <UserProfileHelpPage />,
      },
      {
        path: 'feedback',
        element: <UserProfileFeedbackPage />,
      },
    ],
  },
  {
    path: '/reset-password',
    element: <ResetPasswordConfirmPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: '/signup',
    element: <SignUpPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: '/login',
    element: <SignInPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: '/auth',
    errorElement: <ErrorPage />,
    children: [
      {
        path: 'signup',
        element: <SignUpPage />,
      },
      {
        path: 'signin',
        element: <SignInPage />,
      },
      {
        path: 'google/callback',
        element: <GoogleCallbackPage />,
      },
      {
        path: 'complete-profile',
        element: <CompleteProfilePage />,
      },
      {
        path: 'welcome',
        element: <WelcomePage />,
      },
      {
        path: 'verify-email',
        element: <VerifyEmailPage />,
      },
      {
        path: 'password-reset',
        element: <PasswordResetPage />,
      },
      {
        path: 'account-delete',
        element: <AccountDeactivePage />,
      },
    ],
  },
  {
    path: 'errors',
    errorElement: <ErrorPage />,
    children: [
      {
        path: '400',
        element: <Error400Page />,
      },
      {
        path: '403',
        element: <Error403Page />,
      },
      {
        path: '404',
        element: <Error404Page />,
      },
      {
        path: '500',
        element: <Error500Page />,
      },
      {
        path: '503',
        element: <Error503Page />,
      },
    ],
  }
]);

export default router;

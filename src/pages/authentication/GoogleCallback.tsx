import { message, Spin, Typography } from 'antd';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { fetchCurrentUser } from '../../redux/auth/authApi.ts';
import {
  clearAccessToken,
  clearOauthIntent,
  readOauthIntent,
} from '../../redux/auth/authSession.ts';
import {
  logout,
  setCurrentUser,
  setSession,
} from '../../redux/auth/authSlice.ts';
import { PATH_AUTH, PATH_COURSE } from '../../constants';

const { Text } = Typography;

const readHashParams = () => new URLSearchParams(window.location.hash.replace(/^#/, ''));

export const GoogleCallbackPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const finishGoogleAuth = async () => {
      const hash = readHashParams();
      const token = hash.get('id_token');
      const provider = hash.get('provider');
      const isNewUser = hash.get('is_new_user') === 'true';
      const needsProfileCompletion = hash.get('needs_profile_completion') === 'true';
      const oauthIntent = readOauthIntent();

      if (!token) {
        clearOauthIntent();
        navigate('/login?oauth2Error=Google token topilmadi', { replace: true });
        return;
      }

      if (provider !== 'google') {
        clearOauthIntent();
        navigate('/login?oauth2Error=Login provider noto‘g‘ri', { replace: true });
        return;
      }

      try {
        dispatch(setSession(token));
        const currentUser = await fetchCurrentUser();
        dispatch(setCurrentUser(currentUser));
        clearOauthIntent();

        messageApi.success('Google orqali muvaffaqiyatli kirildi');

        if (oauthIntent === 'signup' && (needsProfileCompletion || isNewUser)) {
          navigate(PATH_AUTH.completeProfile, { replace: true });
          return;
        }

        if (currentUser.roles.includes('ROLE_ADMIN')) {
          navigate('/dashboards/users', { replace: true });
          return;
        }

        navigate(PATH_COURSE.catalog, { replace: true });
      } catch {
        clearOauthIntent();
        clearAccessToken();
        dispatch(logout());
        navigate('/login?oauth2Error=Google orqali kirishda xatolik yuz berdi', {
          replace: true,
        });
      }
    };

    finishGoogleAuth();
  }, [dispatch, messageApi, navigate]);

  return (
    <>
      {contextHolder}
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: 24,
        }}
      >
        <Spin size="large" />
        <Text style={{ fontSize: 16 }}>Google akkaunti tekshirilmoqda...</Text>
      </div>
    </>
  );
};

import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { apiClient } from '../services/api.ts';
import type { RootState } from '../redux/store.ts';
import { normalizeCurrentUser } from '../redux/auth/authApi.ts';
import { logout, setCurrentUser } from '../redux/auth/authSlice.ts';
import { PATH_AUTH } from '../constants';

export const ProtectedRoute = ({
  children,
  allowedRoles,
}: {
  children: JSX.Element;
  allowedRoles: string[];
}) => {
  const dispatch = useDispatch();
  const hasToken = Boolean(localStorage.getItem('access_token'));
  const currentUser = useSelector((state: RootState) => state.auth.currentUser);
  const [loading, setLoading] = useState(hasToken && !currentUser);

  useEffect(() => {
    if (!hasToken || currentUser) {
      setLoading(false);
      return;
    }

    const syncCurrentUser = async () => {
      try {
        const res = await apiClient.get('/auth/me');
        dispatch(
          setCurrentUser(normalizeCurrentUser(res.data?.payload || res.data))
        );
      } catch {
        dispatch(logout());
      } finally {
        setLoading(false);
      }
    };

    syncCurrentUser();
  }, [currentUser, dispatch, hasToken]);

  if (loading) return <div>Yuklanmoqda...</div>;

  if (!hasToken) {
    return <Navigate to={PATH_AUTH.signin} replace />;
  }

  if (!currentUser) {
    return <Navigate to={PATH_AUTH.signin} replace />;
  }

  const hasRole = currentUser.roles.some((role) => allowedRoles.includes(role));
  if (!hasRole) {
    return <Navigate to="/errors/403" replace />;
  }

  return children;
};

import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { apiClient } from '../services/api.ts';
import type { RootState } from '../redux/store.ts';
import { CurrentUser, normalizeCurrentUser } from '../redux/auth/authApi.ts';
import { logout, setCurrentUser } from '../redux/auth/authSlice.ts';
import { PATH_AUTH } from '../constants';

/** True when the user may open the given admin page (any action implies VIEW). */
export const hasPagePermission = (
  user: Pick<CurrentUser, 'roles' | 'permissions'> | null | undefined,
  page: string
): boolean => {
  if (!user) return false;
  if (user.roles.includes('ROLE_SUPER_ADMIN')) return true;
  const actions = user.permissions?.[page];
  return Array.isArray(actions) && actions.length > 0;
};

/** True when the user can open at least one admin page (i.e. the dashboard shell itself). */
export const hasAnyDashboardAccess = (
  user: Pick<CurrentUser, 'roles' | 'permissions'> | null | undefined
): boolean => {
  if (!user) return false;
  if (user.roles.includes('ROLE_SUPER_ADMIN') || user.roles.includes('ROLE_ADMIN')) {
    return true;
  }
  return Object.values(user.permissions || {}).some(
    (actions) => Array.isArray(actions) && actions.length > 0
  );
};

export const ProtectedRoute = ({
  children,
  allowedRoles,
  page,
  requireAnyPermission,
}: {
  children: JSX.Element;
  /** Static role check (legacy). Passes when the user holds any of these roles. */
  allowedRoles?: string[];
  /** Dynamic RBAC check: requires VIEW access to this admin page. */
  page?: string;
  /** Dynamic RBAC check: requires access to at least one admin page (dashboard shell). */
  requireAnyPermission?: boolean;
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

  // When no restriction is declared, being authenticated is enough (e.g. the personal
  // cabinet, which every user — including custom roles — must be able to open).
  const hasRestriction =
    !!allowedRoles?.length || !!page || !!requireAnyPermission;
  if (!hasRestriction) {
    return children;
  }

  const roleAllowed =
    !!allowedRoles && currentUser.roles.some((role) => allowedRoles.includes(role));
  const pageAllowed = !!page && hasPagePermission(currentUser, page);
  const anyAllowed = !!requireAnyPermission && hasAnyDashboardAccess(currentUser);

  if (!roleAllowed && !pageAllowed && !anyAllowed) {
    return <Navigate to="/errors/403" replace />;
  }

  return children;
};

/**
 * Per-page guard used inside the dashboard layout: the parent ProtectedRoute has already
 * authenticated the user, this only checks page-level access managed by the super admin.
 */
export const RequirePage = ({
  page,
  children,
}: {
  page: string;
  children: JSX.Element;
}) => {
  const currentUser = useSelector((state: RootState) => state.auth.currentUser);
  if (!hasPagePermission(currentUser, page)) {
    return <Navigate to="/errors/403" replace />;
  }
  return children;
};

/** Guard for super-admin-only pages (role management). */
export const RequireSuperAdmin = ({ children }: { children: JSX.Element }) => {
  const currentUser = useSelector((state: RootState) => state.auth.currentUser);
  if (!currentUser?.roles.includes('ROLE_SUPER_ADMIN')) {
    return <Navigate to="/errors/403" replace />;
  }
  return children;
};

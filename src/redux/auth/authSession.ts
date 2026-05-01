import { parseJwt } from '../../utils/jwt.ts';
import type { CurrentUser } from './authApi.ts';

export const readAccessToken = () => localStorage.getItem('access_token');
const OAUTH_INTENT_KEY = 'oauth_intent';

export type OauthIntent = 'signin' | 'signup';

export const saveAccessToken = (token: string) => {
  localStorage.setItem('access_token', token);
  localStorage.setItem('id_token', token);

  const payload = parseJwt(token);
  const roles = payload?.auth || [];

  if (roles.includes('ROLE_ADMIN')) {
    localStorage.setItem('role', 'ROLE_ADMIN');
  } else if (roles.length > 0) {
    localStorage.setItem('role', roles[0]);
  } else {
    localStorage.removeItem('role');
  }
};

export const syncStoredRole = (roles: CurrentUser['roles'] | undefined) => {
  if (!roles || roles.length === 0) {
    localStorage.removeItem('role');
    return;
  }

  if (roles.includes('ROLE_ADMIN')) {
    localStorage.setItem('role', 'ROLE_ADMIN');
    return;
  }

  localStorage.setItem('role', roles[0]);
};

export const clearAccessToken = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('id_token');
  localStorage.removeItem('role');
};

export const saveOauthIntent = (intent: OauthIntent) => {
  sessionStorage.setItem(OAUTH_INTENT_KEY, intent);
};

export const readOauthIntent = () =>
  sessionStorage.getItem(OAUTH_INTENT_KEY) as OauthIntent | null;

export const clearOauthIntent = () => {
  sessionStorage.removeItem(OAUTH_INTENT_KEY);
};

export const buildGoogleOauthUrl = () => {
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
  const normalizedBase = apiBase.replace(/\/api\/?$/, '');
  return `${normalizedBase}/api/oauth2/authorize/google`;
};

// src/utils/jwt.ts
import { jwtDecode } from 'jwt-decode';

export interface JwtPayload {
  sub: string;
  auth: string[];
  exp: number;
}

export const parseJwt = (token: string): JwtPayload | null => {
  try {
    return jwtDecode<JwtPayload>(token);
  } catch (error) {
    console.error('Invalid token:', error);
    return null;
  }
};

export const isTokenExpired = (token: string): boolean => {
  const decoded = parseJwt(token);
  if (!decoded) return true;

  const currentTime = Date.now() / 1000;
  return decoded.exp < currentTime;
};

export const hasRole = (token: string, role: string): boolean => {
  const decoded = parseJwt(token);
  if (!decoded) return false;
  

  return decoded.auth.includes(role);
};

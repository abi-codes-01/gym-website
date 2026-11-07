import axios, { InternalAxiosRequestConfig } from 'axios';

export const TOKEN_STORAGE_KEY = 'token';
export const ROLE_STORAGE_KEY = 'user_role';

export type UserRole = 'ROLE_USER' | 'ROLE_ADMIN';

export function extractRoleFromToken(token: string | null): UserRole | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payloadJson = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson) as { role?: string };
    if (!payload.role) return null;
    const normalized = payload.role.startsWith('ROLE_')
      ? payload.role
      : `ROLE_${payload.role}`;
    return normalized === 'ROLE_ADMIN' ? 'ROLE_ADMIN' : 'ROLE_USER';
  } catch {
    return null;
  }
}

export function getAuthenticatedRole(): UserRole | null {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  const jwtRole = extractRoleFromToken(token);
  if (jwtRole) return jwtRole;

  const savedRole = localStorage.getItem(ROLE_STORAGE_KEY);
  if (savedRole === 'ROLE_ADMIN' || savedRole === 'ROLE_USER') {
    return savedRole;
  }
  return token ? 'ROLE_USER' : null;
}

export const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error)
);

export default apiClient;

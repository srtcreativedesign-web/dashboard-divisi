import { api } from './client';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  divisionCode: string | null;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export const authApi = {
  login: (email: string, password: string) => api.post<LoginResponse>('/auth/login', { email, password }),
  me: () => api.get<AuthUser>('/auth/me'),
  logout: () => api.post<{ message: string }>('/auth/logout'),
  reset: (oldPassword: string, newPassword: string) => api.post<{ message: string }>('/auth/reset', { oldPassword, newPassword }),
};

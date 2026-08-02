import api from './api';

export interface User {
  id: string;
  _id?: string;
  name: string;
  phone: string;
  educationalLevel: string | { _id: string; nameAr?: string; name?: string; year?: number; level?: string };
  role: 'student' | 'teacher' | 'admin' | 'assistant';
  guardianPhone?: string;
  gender?: 'male' | 'female';
}
export interface AuthResponse { status: string; token: string; data: { user: User } }
export interface LoginRequest { phone: string; password: string }
export interface RegisterRequest extends LoginRequest { name: string; educationalLevel: string; guardianPhone?: string; gender?: 'male' | 'female'; }

const normalizeUser = (user: User): User => user?.educationalLevel && typeof user.educationalLevel === 'object' ? { ...user, educationalLevel: user.educationalLevel._id } : user;

export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/login', data);
  return { ...response.data, data: { user: normalizeUser(response.data.data.user) } };
};
export const register = async (data: RegisterRequest): Promise<AuthResponse> => { const response = await api.post<AuthResponse>('/auth/register', data); return { ...response.data, data: { user: normalizeUser(response.data.data.user) } }; };
export const getCurrentUser = async (): Promise<User> => { const response = await api.get<{ data: { user: User } }>('/auth/me'); return normalizeUser(response.data.data.user); };
export const logout = async (): Promise<void> => { try { await api.post('/auth/logout'); } finally { localStorage.removeItem('token'); localStorage.removeItem('user'); } };
export const setAuthToken = (token: string) => localStorage.setItem('token', token);
export const getAuthToken = () => localStorage.getItem('token');
export const setAuthUser = (user: User) => localStorage.setItem('user', JSON.stringify(user));
export const getAuthUser = (): User | null => { const value = localStorage.getItem('user'); return value ? normalizeUser(JSON.parse(value)) : null; };
export const isAuthenticated = () => Boolean(getAuthToken());

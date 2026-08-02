import api from './api';

export interface AccessLesson { id: string; title: string; order: number; duration: number; accessOverride: boolean | null; accessEnabled: boolean; }
export interface AccessCourse { _id: string; id: string; title: string; term: 'first' | 'second'; accessEnabled: boolean; lessons: AccessLesson[]; }
export interface StudentAccess { user: any; courses: AccessCourse[]; }
export const getStudents = async (params: { search?: string; educationalLevel?: string } = {}) => { const response = await api.get<{ data: { users: any[] } }>('/admin/users', { params }); return response.data.data.users; };
export const getStudentAccess = async (userId: string): Promise<StudentAccess> => { const response = await api.get<{ data: StudentAccess }>(`/admin/users/${userId}/access`); return response.data.data; };
export const setCourseAccess = async (userId: string, courseId: string, enabled: boolean) => api.put(`/admin/users/${userId}/courses/${courseId}/access`, { enabled });
export const setLessonAccess = async (userId: string, lessonId: string, enabled: boolean) => api.put(`/admin/users/${userId}/lessons/${lessonId}/access`, { enabled });

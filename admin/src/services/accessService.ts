import api from './api';

export interface AccessLesson { id: string; title: string; order: number; duration: number; accessOverride: boolean | null; accessEnabled: boolean; }
export interface AccessCourse { _id: string; id: string; title: string; term: 'first' | 'second'; accessEnabled: boolean; lessons: AccessLesson[]; }
export interface StudentAccess { user: any; courses: AccessCourse[]; }
export interface Pagination { currentPage: number; totalPages: number; totalItems: number; itemsPerPage: number; hasNextPage: boolean; hasPrevPage: boolean; }
export interface StudentList { users: any[]; pagination: Pagination; }
export interface StudentOverview { user: any; stats: { openCourses: number; openLessons: number; examAttempts: number; videoLessons: number; watchedSeconds: number; completedVideos: number }; latestAttempts: any[]; }
export const getStudents = async (params: { search?: string; educationalLevel?: string; page?: number; limit?: number } = {}): Promise<StudentList> => { const response = await api.get<{ data: { users: any[] }; pagination: Pagination }>('/admin/users', { params }); return { users: response.data.data.users, pagination: response.data.pagination }; };
export const getStudentAccess = async (userId: string): Promise<StudentAccess> => { const response = await api.get<{ data: StudentAccess }>(`/admin/users/${userId}/access`); return response.data.data; };
export const getStudentOverview = async (userId: string): Promise<StudentOverview> => { const response = await api.get<{ data: StudentOverview }>(`/admin/users/${userId}/overview`); return response.data.data; };
export const getStudentExamAttempts = async (userId: string, params: { page?: number; limit?: number; examId?: string; submittedReason?: string } = {}) => { const response = await api.get<{ data: any[]; pagination: Pagination }>(`/admin/users/${userId}/exam-attempts`, { params }); return { attempts: response.data.data, pagination: response.data.pagination }; };
export const getStudentVideoActivity = async (userId: string, params: { page?: number; limit?: number; courseId?: string; lessonId?: string; completion?: 'completed' | 'incomplete' } = {}) => { const response = await api.get<{ data: any[]; pagination: Pagination }>(`/admin/users/${userId}/video-activity`, { params }); return { activity: response.data.data, pagination: response.data.pagination }; };
export const setCourseAccess = async (userId: string, courseId: string, enabled: boolean) => api.put(`/admin/users/${userId}/courses/${courseId}/access`, { enabled });
export const setLessonAccess = async (userId: string, lessonId: string, enabled: boolean) => api.put(`/admin/users/${userId}/lessons/${lessonId}/access`, { enabled });

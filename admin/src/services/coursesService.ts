import api from './api';

export type Term = 'first' | 'second';
export interface Course { _id: string; id?: string; title: string; educationalLevel: { _id: string; name: string; nameAr: string; level: 'primary' | 'prep'; year: number }; term: Term; description?: string; order: number; isActive: boolean; lessonCount?: number; examCount?: number; access?: string; shortDescription: string; fullDescription: string; price: number; image: string; vodafoneNumber: string; month: number; createdAt: string; updatedAt: string; }
export interface Lesson { _id: string; id?: string; courseId: string; title: string; duration: number; description?: string; order: number; videoProvider?: 'youtube' | 'vimeo' | null; videoId?: string | null; videoUrl?: string | null; access?: string; isLocked?: boolean; }

export const getCourses = async (params: { term?: Term; educationalLevel?: string; isActive?: boolean } = {}): Promise<Course[]> => { const response = await api.get<{ data: Course[] }>('/courses', { params }); return response.data.data; };
export const getCourseById = async (id: string): Promise<Course> => { const response = await api.get<{ data: { course: Course } }>(`/courses/${id}`); return response.data.data.course; };
export const getCourseLessons = async (id: string): Promise<Lesson[]> => { const response = await api.get<{ data: Lesson[] }>(`/courses/${id}/lessons`); return response.data.data; };
export const createCourse = async (data: Pick<Course, 'title' | 'term' | 'description' | 'order' | 'isActive'> & { educationalLevel: string }) => { const response = await api.post<{ data: { course: Course } }>('/admin/courses', data); return response.data.data.course; };
export const updateCourse = async (id: string, data: Partial<Pick<Course, 'title' | 'term' | 'description' | 'order' | 'isActive'>> & { educationalLevel?: string }) => { const response = await api.put<{ data: { course: Course } }>(`/admin/courses/${id}`, data); return response.data.data.course; };
export const deleteCourse = async (id: string) => api.delete(`/admin/courses/${id}`);
export const createLesson = async (data: { courseId: string; title: string; duration: number; description?: string; order: number; videoUrl: string }) => { const response = await api.post<{ data: { lesson: Lesson } }>('/admin/lessons', data); return response.data.data.lesson; };
export const updateLesson = async (id: string, data: Partial<Omit<Lesson, '_id' | 'courseId'>> & { videoUrl?: string }) => { const response = await api.put<{ data: { lesson: Lesson } }>(`/admin/lessons/${id}`, data); return response.data.data.lesson; };
export const deleteLesson = async (id: string) => api.delete(`/admin/lessons/${id}`);
export const getCourseExams = async (courseId: string) => { const response = await api.get<{ data: any[] }>('/exams', { params: { courseId, type: 'course' } }); return response.data.data; };

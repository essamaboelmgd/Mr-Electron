import api from './api';
import type { Exam } from './examsService';

export type Term = 'first' | 'second';

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface Course {
  _id: string;
  id?: string;
  title: string;
  term: Term;
  description?: string;
  order: number;
  isActive: boolean;
  access: 'active' | 'locked';
  accessEnabled?: boolean;
  lessonCount?: number;
  examCount?: number;
  educationalLevel: {
    _id: string;
    name: string;
    nameAr: string;
    level: 'primary' | 'prep';
    year: number;
  };
}

export interface Lesson {
  _id: string;
  id?: string;
  courseId: string;
  title: string;
  duration: number;
  access: 'active' | 'locked';
  isLocked: boolean;
  videoProvider?: 'youtube' | 'vimeo' | 'bunny' | null;
  videoId?: string | null;
  videoUrl?: string | null;
  videoStatus?: 'ready' | 'processing' | 'failed';
  description?: string;
  order: number;
}

export interface LessonVideoData {
  videoUrl: string;
  provider: 'youtube' | 'vimeo' | 'bunny';
  videoId: string;
  videoStatus?: string;
  progress?: {
    watchedSeconds: number;
    lastPositionSeconds: number;
    durationSeconds: number;
    completionPercent: number;
    sessionCount: number;
  } | null;
}

export const getCourses = async (params: { term?: Term; page?: number; limit?: number } = {}): Promise<{ courses: Course[]; pagination: Pagination }> => {
  const response = await api.get<{ data: Course[]; pagination: Pagination }>('/courses', { params });
  return { courses: response.data.data, pagination: response.data.pagination };
};

export const getCourseById = async (id: string): Promise<Course> => {
  const response = await api.get<{ data: { course: Course } }>(`/courses/${id}`);
  return response.data.data.course;
};

export const getCourseLessons = async (courseId: string, params: { page?: number; limit?: number } = {}): Promise<{ lessons: Lesson[]; pagination: Pagination }> => {
  const response = await api.get<{ data: Lesson[]; pagination: Pagination }>(`/courses/${courseId}/lessons`, { params });
  return { lessons: response.data.data, pagination: response.data.pagination };
};

export const getLessonVideoUrl = async (lessonId: string): Promise<LessonVideoData> => {
  const response = await api.get<{ data: LessonVideoData }>(`/courses/${lessonId}/video-url`);
  return response.data.data;
};

export const recordVideoEvent = async (lessonId: string, data: {
  sessionId: string;
  event: 'play' | 'pause' | 'timeupdate' | 'ended' | 'seeked';
  positionSeconds: number;
  durationSeconds: number;
  watchedDeltaSeconds: number;
  sequence: number;
}) => api.post(`/courses/${lessonId}/video-events`, data);

export const getCourseExams = async (courseId: string): Promise<Exam[]> => {
  const response = await api.get<{ data: Exam[] }>('/exams/user', { params: { type: 'course', courseId, limit: 100 } });
  return response.data.data;
};

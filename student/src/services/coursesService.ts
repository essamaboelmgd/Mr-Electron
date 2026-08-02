import api from './api';
import type { Exam } from './examsService';

export type Term = 'first' | 'second';

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

export const getCourses = async (term?: Term): Promise<Course[]> => {
  const response = await api.get<{ data: Course[] }>(`/courses${term ? `?term=${term}` : ''}`);
  return response.data.data;
};

export const getCourseById = async (id: string): Promise<Course> => {
  const response = await api.get<{ data: { course: Course } }>(`/courses/${id}`);
  return response.data.data.course;
};

export const getCourseLessons = async (courseId: string): Promise<Lesson[]> => {
  const response = await api.get<{ data: Lesson[] }>(`/courses/${courseId}/lessons`);
  return response.data.data;
};

export const getLessonVideoUrl = async (lessonId: string): Promise<{ videoUrl: string; provider: 'youtube' | 'vimeo' | 'bunny'; videoId: string; videoStatus?: string }> => {
  const response = await api.get<{ data: { videoUrl: string; provider: 'youtube' | 'vimeo' | 'bunny'; videoId: string; videoStatus?: string } }>(`/courses/${lessonId}/video-url`);
  return response.data.data;
};

export const recordVideoEvent = async (lessonId: string, data: {
  sessionId: string;
  event: 'play' | 'pause' | 'timeupdate' | 'ended' | 'seeked';
  positionSeconds: number;
  durationSeconds: number;
  watchedDeltaSeconds: number;
}) => api.post(`/courses/${lessonId}/video-events`, data);

export const getCourseExams = async (courseId: string): Promise<Exam[]> => {
  const response = await api.get<{ data: Exam[] }>('/exams/user?type=course');
  return response.data.data.filter((exam) => {
    const linkedCourse = typeof exam.courseId === 'object' ? exam.courseId?._id : exam.courseId;
    return linkedCourse === courseId;
  });
};

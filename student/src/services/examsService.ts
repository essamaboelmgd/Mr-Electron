import api from './api';

export interface LinkedCourse {
  _id: string;
  title: string;
  term: 'first' | 'second';
}

export interface Exam {
  _id: string;
  courseId: string | null | LinkedCourse;
  educationalLevel?: string | { _id: string; nameAr?: string } | null;
  title: string;
  timeLimitMin: number;
  totalMarks: number;
  type: 'course' | 'general';
  isActive: boolean;
  createdAt?: string;
}

export interface Question {
  _id: string;
  examId: string;
  onModel: 'Exam' | 'Assignment';
  type: 'text' | 'image';
  content: string;
  options: { id: string; text: string }[];
  correct?: string;
  explanation?: string;
  order: number;
  marks: number;
}

export interface Answer {
  questionId: string;
  selectedOption: string;
}

export interface Submission {
  _id: string;
  userId: string;
  examId: string;
  answers: Answer[];
  score: number;
  totalMarks: number;
  submittedAt: string;
}

export interface ExamResult {
  submission: Submission;
  percentage: number;
  isPassed: boolean;
}

export const getExams = async (): Promise<Exam[]> => {
  const response = await api.get<{ data: Exam[] }>('/exams');
  return response.data.data;
};

export const getUserExams = async (type?: 'course' | 'general'): Promise<Exam[]> => {
  const response = await api.get<{ data: Exam[] }>(`/exams/user${type ? `?type=${type}` : ''}`);
  return response.data.data;
};

export const getExamById = async (id: string): Promise<Exam> => {
  const response = await api.get<{ data: { exam: Exam } }>(`/exams/${id}`);
  return response.data.data.exam;
};

export const getExamQuestions = async (id: string, review = false): Promise<Question[]> => {
  const response = await api.get<{ data: { questions: Question[] } }>(`/exams/${id}/questions${review ? '?review=true' : ''}`);
  return response.data.data.questions;
};

export const submitExamAnswers = async (id: string, answers: Answer[]) => {
  const response = await api.post<{ data: { submission: Submission; score: number; totalMarks: number } }>(`/exams/${id}/submissions`, { answers });
  return response.data.data;
};

export const getExamResults = async (id: string): Promise<ExamResult> => {
  const response = await api.get<{ data: ExamResult }>(`/exams/${id}/results`);
  return response.data.data;
};

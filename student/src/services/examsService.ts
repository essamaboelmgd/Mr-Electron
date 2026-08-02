import api from './api';

export interface LinkedCourse {
  _id: string;
  title: string;
  term: 'first' | 'second';
}

export interface StudentExamState {
  attemptsCount: number;
  latestAttempt?: {
    id: string;
    attemptNumber: number;
    score: number;
    totalMarks: number;
    percentage: number;
    submittedAt: string;
    reviewedAt?: string | null;
  };
  reviewAttemptId?: string;
  reviewed: boolean;
  reviewAvailable: boolean;
  canReview: boolean;
  canRetake: boolean;
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
  maxAttempts: number;
  reviewMode: 'closed' | 'open' | 'scheduled';
  reviewReleaseAt?: string | null;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  createdAt?: string;
  studentState?: StudentExamState;
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
  reviewedAt?: string | null;
  attemptId?: string;
  attemptNumber?: number;
  submittedReason?: 'manual' | 'auto' | 'timeout' | 'legacy';
}

export interface ExamPolicy {
  maxAttempts: number;
  reviewMode: 'closed' | 'open' | 'scheduled';
  reviewReleaseAt?: string | null;
  reviewAvailable: boolean;
}

export interface ExamAttempt {
  _id: string;
  attemptNumber: number;
  status: 'in_progress' | 'submitted' | 'expired';
  answers: Answer[];
  currentQuestion: number;
  startedAt: string;
  expiresAt?: string | null;
  remainingSeconds?: number | null;
  questionOrder?: string[];
  optionOrder?: Array<{ questionId: string; optionIds: string[] }>;
}

export interface ExamResult {
  submission: Submission;
  percentage: number;
  isPassed: boolean;
  attempts?: Array<Submission & { percentage: number; isPassed: boolean }>;
  reviewed?: boolean;
  reviewedAt?: string | null;
  reviewAttemptId?: string;
  policy?: ExamPolicy;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export const getExams = async (): Promise<Exam[]> => {
  const response = await api.get<{ data: Exam[] }>('/exams', { params: { limit: 100 } });
  return response.data.data;
};

export const getUserExams = async (params: { type?: 'course' | 'general'; courseId?: string; page?: number; limit?: number } = {}): Promise<{ exams: Exam[]; pagination: Pagination }> => {
  const response = await api.get<{ data: Exam[]; pagination: Pagination }>('/exams/user', { params });
  return { exams: response.data.data, pagination: response.data.pagination };
};

export const getExamById = async (id: string): Promise<Exam> => {
  const response = await api.get<{ data: { exam: Exam } }>(`/exams/${id}`);
  return response.data.data.exam;
};

export const getExamQuestions = async (id: string, review = false, attemptId?: string): Promise<Question[]> => {
  const params = new URLSearchParams();
  if (review) params.set('review', 'true');
  if (attemptId) params.set('attemptId', attemptId);
  const query = params.toString();
  const response = await api.get<{ data: { questions: Question[] } }>(`/exams/${id}/questions${query ? `?${query}` : ''}`);
  return response.data.data.questions;
};

export const submitExamAnswers = async (id: string, answers: Answer[]) => {
  const response = await api.post<{ data: { submission: Submission; score: number; totalMarks: number } }>(`/exams/${id}/submissions`, { answers });
  return response.data.data;
};

export const startExamAttempt = async (id: string): Promise<{ attempt: ExamAttempt; policy: ExamPolicy }> => {
  const response = await api.post<{ data: { attempt: ExamAttempt; policy: ExamPolicy } }>(`/exams/${id}/attempts`);
  return response.data.data;
};

export const saveExamAttempt = async (id: string, attemptId: string, answers: Answer[], currentQuestion: number) => {
  const response = await api.patch<{ data: { attempt: ExamAttempt } }>(`/exams/${id}/attempts/${attemptId}`, { answers, currentQuestion });
  return response.data.data.attempt;
};

export const submitExamAttempt = async (id: string, attemptId: string, answers: Answer[]) => {
  const response = await api.post<{ data: { submission: Submission; score: number; totalMarks: number } }>(`/exams/${id}/attempts/${attemptId}/submit`, { answers });
  return response.data.data;
};

export const getExamAttempts = async (id: string): Promise<{ attempts: Array<Submission & { percentage: number; isPassed: boolean }>; policy: ExamPolicy }> => {
  const response = await api.get<{ data: { attempts: Array<Submission & { percentage: number; isPassed: boolean }>; policy: ExamPolicy } }>(`/exams/${id}/attempts`);
  return response.data.data;
};

export const getExamResults = async (id: string, attemptId?: string): Promise<ExamResult> => {
  const response = await api.get<{ data: ExamResult }>(`/exams/${id}/results`, { params: attemptId ? { attemptId } : undefined });
  return response.data.data;
};

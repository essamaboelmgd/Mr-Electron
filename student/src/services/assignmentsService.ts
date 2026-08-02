import api from './api';

export interface Assignment {
  _id: string;
  courseId: string | null;
  lessonId: string | null;
  title: string;
  date: string;
  timeLimitMin: number;
  totalMarks: number;
  type: 'course' | 'general';
  isActive: boolean;
  mandatoryAttendance: boolean; // New field
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  _id: string;
  examId: string;
  onModel: 'Exam' | 'Assignment';
  type: 'text' | 'image';
  content: string;
  options: { id: string; text: string }[];
  correct: string;
  explanation: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Answer {
  questionId: string;
  selectedOption: string;
}

export interface Submission {
  _id: string;
  userId: string;
  examId: string;
  onModel: 'Exam' | 'Assignment';
  answers: Answer[];
  score: number;
  totalMarks: number;
  submittedAt: string;
  isGraded: boolean;
  gradedAt: string;
  gradedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentResult {
  submission: Submission;
  percentage: number;
  isPassed: boolean;
}

// Get all assignments
export const getAssignments = async (): Promise<Assignment[]> => {
  const response = await api.get('/assignments');
  return response.data.data;
};

// Get assignment by ID
export const getAssignmentById = async (id: string): Promise<Assignment> => {
  const response = await api.get(`/assignments/${id}`);
  return response.data.data.assignment;
};

// Get questions for an assignment
export const getAssignmentQuestions = async (id: string): Promise<Question[]> => {
  const response = await api.get(`/assignments/${id}/questions`);
  return response.data.data.questions;
};

// Submit assignment answers
export const submitAssignmentAnswers = async (id: string, answers: Answer[]): Promise<{ submission: Submission; score: number; totalMarks: number }> => {
  const response = await api.post(`/assignments/${id}/submissions`, { answers });
  return response.data.data;
};

// Get assignment results
export const getAssignmentResults = async (id: string): Promise<AssignmentResult> => {
  const response = await api.get(`/assignments/${id}/results`);
  return response.data.data;
};
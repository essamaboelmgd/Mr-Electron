import api from './api';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
}

export interface Assignment {
  _id: string;
  courseId: string | null;
  lessonId: string | null;
  title: string;
  date: string;
  timeLimitMin: number;
  totalMarks: number; // Added back since it's needed for display
  type: 'course' | 'general';
  isActive: boolean;
  mandatoryAttendance: boolean;
  hasTimeLimit: boolean; // Added this field
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
  marks: number; // Added marks field
  createdAt: string;
  updatedAt: string;
}

export interface Answer {
  questionId: string;
  selectedOption: string;
}

export interface Submission {
  _id: string;
  userId: User;
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

// Get all assignments
export const getAssignments = async (): Promise<Assignment[]> => {
  const response = await api.get('/assignments');
  return response.data.data;
};

// Get all assignments with pagination (admin only)
export const getAllAssignments = async (page: number = 1, limit: number = 10): Promise<{ assignments: Assignment[], pagination: any }> => {
  const response = await api.get('/admin/assignments', {
    params: { page, limit }
  });
  return {
    assignments: response.data.data,
    pagination: response.data.pagination || { currentPage: page, totalPages: 1, totalResults: response.data.data.length }
  };
};

// Get assignment by ID
export const getAssignmentById = async (id: string): Promise<Assignment> => {
  const response = await api.get(`/assignments/${id}`);
  return response.data.data.assignment;
};

// Create assignment
export const createAssignment = async (assignmentData: Partial<Assignment>): Promise<Assignment> => {
  const response = await api.post('/admin/assignments', assignmentData);
  return response.data.data.assignment;
};

// Update assignment
export const updateAssignment = async (id: string, assignmentData: Partial<Assignment>): Promise<Assignment> => {
  const response = await api.put(`/admin/assignments/${id}`, assignmentData);
  return response.data.data.assignment;
};

// Delete assignment
export const deleteAssignment = async (id: string): Promise<void> => {
  await api.delete(`/admin/assignments/${id}`);
};

// Get questions for an assignment
export const getAssignmentQuestions = async (id: string): Promise<Question[]> => {
  const response = await api.get(`/assignments/${id}/questions`);
  return response.data.data.questions || response.data.data || [];
};

// Get assignment results
export const getAssignmentResults = async (id: string): Promise<Submission> => {
  const response = await api.get(`/assignments/${id}/results`);
  return response.data.data.submission;
};

// Get all submissions for an assignment (admin only)
export const getAssignmentSubmissions = async (assignmentId: string, page: number = 1, limit: number = 10): Promise<{ submissions: Submission[], pagination: any }> => {
  const response = await api.get(`/admin/assignments/${assignmentId}/submissions`, {
    params: { page, limit }
  });
  return {
    submissions: response.data.data,
    pagination: response.data.pagination
  };
};

// Create question
export const createQuestion = async (questionData: Partial<Question> | FormData): Promise<Question> => {
  const config = questionData instanceof FormData ? {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  } : {};
  
  const response = await api.post('/admin/questions', questionData, config);
  return response.data.data.question;
};

// Update question
export const updateQuestion = async (id: string, questionData: Partial<Question> | FormData): Promise<Question> => {
  const config = questionData instanceof FormData ? {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  } : {};
  
  const response = await api.put(`/admin/questions/${id}`, questionData, config);
  return response.data.data.question;
};

// Delete question
export const deleteQuestion = async (id: string): Promise<void> => {
  await api.delete(`/admin/questions/${id}`);
};

// Submit assignment answers
export const submitAssignmentAnswers = async (id: string, answers: Answer[]): Promise<{ submission: Submission; score: number; totalMarks: number }> => {
  const response = await api.post(`/assignments/${id}/submissions`, { answers });
  return response.data.data;
};
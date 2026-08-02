import api from './api';

export interface Exam { _id: string; courseId: string | null | { _id: string; title: string }; educationalLevel?: string | { _id: string; nameAr: string }; title: string; timeLimitMin: number; totalMarks: number; type: 'course' | 'general'; isActive: boolean; lessonId: string | null; date: string; mandatoryAttendance: boolean; createdAt: string; updatedAt: string; }
export interface Question { _id: string; examId: string; onModel: 'Exam' | 'Assignment'; type: 'text' | 'image'; content: string; options: { id: string; text: string }[]; correct: string; explanation?: string; order: number; marks: number; }
export interface Answer { questionId: string; selectedOption: string; }
export interface Submission { _id: string; userId: { _id: string; name: string; phone: string } | string; examId: string; score: number; totalMarks: number; submittedAt: string; }

export const getAllExams = async (paramsOrPage: { type?: 'course' | 'general'; courseId?: string; educationalLevel?: string } | number = {}, legacyLimit = 10) => { const params = typeof paramsOrPage === 'number' ? { page: paramsOrPage, limit: legacyLimit } : paramsOrPage; const response = await api.get<{ data: Exam[]; pagination: any }>('/admin/exams', { params }); return { exams: response.data.data, pagination: response.data.pagination }; };
export const getExams = async () => (await getAllExams()).exams;
export const getExamById = async (id: string): Promise<Exam> => { const response = await api.get<{ data: { exam: Exam } }>(`/exams/${id}`); return response.data.data.exam; };
export const createExam = async (data: { title: string; type: 'course' | 'general'; courseId?: string; educationalLevel?: string; timeLimitMin: number; isActive: boolean }) => { const response = await api.post<{ data: { exam: Exam } }>('/admin/exams', data); return response.data.data.exam; };
export const updateExam = async (id: string, data: Partial<{ title: string; type: 'course' | 'general'; courseId: string | null; educationalLevel: string | null; timeLimitMin: number; isActive: boolean }>) => { const response = await api.put<{ data: { exam: Exam } }>(`/admin/exams/${id}`, data); return response.data.data.exam; };
export const deleteExam = async (id: string) => api.delete(`/admin/exams/${id}`);
export const getExamQuestions = async (id: string): Promise<Question[]> => { const response = await api.get<{ data: { questions: Question[] } }>(`/exams/${id}/questions`); return response.data.data.questions as Question[]; };
export const createQuestion = async (data: Omit<Question, '_id' | 'onModel'> & { examId: string; onModel?: 'Exam' }) => { const response = await api.post<{ data: { question: Question } }>('/admin/questions', { ...data, onModel: 'Exam', type: 'text' }); return response.data.data.question; };
export const updateQuestion = async (id: string, data: Partial<Question>) => { const response = await api.put<{ data: { question: Question } }>(`/admin/questions/${id}`, data); return response.data.data.question; };
export const deleteQuestion = async (id: string) => api.delete(`/admin/questions/${id}`);
export const getExamSubmissions = async (id: string): Promise<Submission[]> => { const response = await api.get<{ data: Submission[] }>(`/admin/exams/${id}/submissions`); return response.data.data; };

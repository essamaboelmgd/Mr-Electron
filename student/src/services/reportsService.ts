import api from './api';

export const downloadStudentExamReport = async (examId: string, attemptId?: string) => {
  const response = await api.get<Blob>(`/exams/${examId}/results.pdf`, { responseType: 'blob', params: attemptId ? { attemptId } : undefined });
  const objectUrl = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = `mr-electron-exam-${examId}-result.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
};

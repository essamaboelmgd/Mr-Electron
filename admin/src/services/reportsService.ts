import api from './api';

const downloadResponse = async (url: string, filename: string) => {
  const response = await api.get<Blob>(url, { responseType: 'blob' });
  const objectUrl = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
};

export const downloadStudentReport = (userId: string) => downloadResponse(`/admin/users/${userId}/report.pdf`, `mr-electron-student-${userId}.pdf`);
export const downloadExamResultsReport = (examId: string) => downloadResponse(`/admin/exams/${examId}/results.pdf`, `mr-electron-exam-${examId}-results.pdf`);

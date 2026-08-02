import api from './api';

export type Term = 'first' | 'second';
export interface Course { _id: string; id?: string; title: string; educationalLevel: { _id: string; name: string; nameAr: string; level: 'primary' | 'prep'; year: number }; term: Term; description?: string; order: number; isActive: boolean; lessonCount?: number; examCount?: number; access?: string; shortDescription: string; fullDescription: string; price: number; image: string; vodafoneNumber: string; month: number; createdAt: string; updatedAt: string; }
export interface Lesson { _id: string; id?: string; courseId: string; title: string; duration: number; description?: string; order: number; videoProvider?: 'youtube' | 'vimeo' | 'bunny' | null; videoId?: string | null; videoUrl?: string | null; videoStatus?: 'ready' | 'processing' | 'failed'; access?: string; isLocked?: boolean; }
export interface CourseExam { _id: string; title: string; timeLimitMin: number; totalMarks: number; }
export interface Pagination { currentPage: number; totalPages: number; totalItems: number; itemsPerPage: number; hasNextPage: boolean; hasPrevPage: boolean; }

export const getCourses = async (params: { term?: Term; educationalLevel?: string; isActive?: boolean; search?: string; page?: number; limit?: number } = {}): Promise<{ courses: Course[]; pagination: Pagination }> => { const response = await api.get<{ data: Course[]; pagination: Pagination }>('/courses', { params }); return { courses: response.data.data, pagination: response.data.pagination }; };
export const getCourseById = async (id: string): Promise<Course> => { const response = await api.get<{ data: { course: Course } }>(`/courses/${id}`); return response.data.data.course; };
export const getCourseLessons = async (id: string, params: { page?: number; limit?: number } = {}): Promise<{ lessons: Lesson[]; pagination: Pagination }> => { const response = await api.get<{ data: Lesson[]; pagination: Pagination }>(`/courses/${id}/lessons`, { params }); return { lessons: response.data.data, pagination: response.data.pagination }; };
export const createCourse = async (data: Pick<Course, 'title' | 'term' | 'description' | 'order' | 'isActive'> & { educationalLevel: string }) => { const response = await api.post<{ data: { course: Course } }>('/admin/courses', data); return response.data.data.course; };
export const updateCourse = async (id: string, data: Partial<Pick<Course, 'title' | 'term' | 'description' | 'order' | 'isActive'>> & { educationalLevel?: string }) => { const response = await api.put<{ data: { course: Course } }>(`/admin/courses/${id}`, data); return response.data.data.course; };
export const deleteCourse = async (id: string) => api.delete(`/admin/courses/${id}`);
export const createLesson = async (data: { courseId: string; title: string; duration: number; description?: string; order: number; videoUrl?: string; videoProvider?: 'youtube' | 'vimeo' | 'bunny'; videoId?: string }) => { const response = await api.post<{ data: { lesson: Lesson } }>('/admin/lessons', data); return response.data.data.lesson; };
export const updateLesson = async (id: string, data: Partial<Omit<Lesson, '_id' | 'courseId'>> & { videoUrl?: string; videoProvider?: 'youtube' | 'vimeo' | 'bunny'; videoId?: string }) => { const response = await api.put<{ data: { lesson: Lesson } }>(`/admin/lessons/${id}`, data); return response.data.data.lesson; };
export interface BunnyUpload { videoId: string; libraryId: string; endpoint: string; signature: string; expiresAt: number; embedUrl: string; }
export const createBunnyUploadSession = async (title: string): Promise<BunnyUpload> => { const response = await api.post<{ data: { upload: BunnyUpload } }>('/admin/videos/bunny/upload-session', { title }); return response.data.data.upload; };
export const completeBunnyUpload = async (lessonId: string, videoId: string): Promise<Lesson> => { const response = await api.post<{ data: { lesson: Lesson } }>(`/admin/lessons/${lessonId}/bunny-upload/complete`, { videoId }); return response.data.data.lesson; };
const encodeTusMetadata = (value: string) => {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
};

export const uploadFileToBunny = (upload: BunnyUpload, file: File, onProgress?: (value: number) => void): Promise<void> => new Promise((resolve, reject) => {
  const chunkSize = 8 * 1024 * 1024;
  const createRequest = new XMLHttpRequest();
  createRequest.open('POST', upload.endpoint);
  createRequest.setRequestHeader('Tus-Resumable', '1.0.0');
  createRequest.setRequestHeader('Upload-Length', String(file.size));
  createRequest.setRequestHeader('Upload-Metadata', `filename ${encodeTusMetadata(file.name)},filetype ${encodeTusMetadata(file.type || 'video/mp4')}`);
  createRequest.setRequestHeader('AuthorizationSignature', upload.signature);
  createRequest.setRequestHeader('AuthorizationExpire', String(upload.expiresAt));
  createRequest.setRequestHeader('VideoId', upload.videoId);
  createRequest.setRequestHeader('LibraryId', upload.libraryId);
  createRequest.onerror = () => reject(new Error('تعذر الاتصال بخدمة Bunny أثناء بدء الرفع.'));
  createRequest.onload = () => {
    if (createRequest.status < 200 || createRequest.status >= 300) {
      reject(new Error(`فشل بدء رفع الفيديو (${createRequest.status}).`));
      return;
    }
    const location = createRequest.getResponseHeader('Location');
    if (!location) {
      reject(new Error('لم تُرجع Bunny مسار رفع صالحًا.'));
      return;
    }

    const uploadUrl = new URL(location, upload.endpoint).toString();
    const sendChunk = (offset: number) => {
      if (offset >= file.size) {
        onProgress?.(100);
        resolve();
        return;
      }
      const chunk = file.slice(offset, Math.min(offset + chunkSize, file.size));
      const patchRequest = new XMLHttpRequest();
      patchRequest.open('PATCH', uploadUrl);
      patchRequest.setRequestHeader('Tus-Resumable', '1.0.0');
      patchRequest.setRequestHeader('Upload-Offset', String(offset));
      patchRequest.setRequestHeader('Content-Type', 'application/offset+octet-stream');
      patchRequest.upload.onprogress = (event) => {
        if (event.lengthComputable) onProgress?.(Math.round(((offset + event.loaded) / file.size) * 100));
      };
      patchRequest.onerror = () => reject(new Error('انقطع رفع الفيديو. حاول مرة أخرى.'));
      patchRequest.onload = () => {
        if (patchRequest.status < 200 || patchRequest.status >= 300) {
          reject(new Error(`فشل رفع جزء من الفيديو (${patchRequest.status}).`));
          return;
        }
        const returnedOffset = Number(patchRequest.getResponseHeader('Upload-Offset'));
        sendChunk(Number.isFinite(returnedOffset) && returnedOffset > offset ? returnedOffset : offset + chunk.size);
      };
      patchRequest.send(chunk);
    };
    sendChunk(0);
  };
  createRequest.send();
});
export const deleteLesson = async (id: string) => api.delete(`/admin/lessons/${id}`);
export const getCourseExams = async (courseId: string): Promise<CourseExam[]> => { const response = await api.get<{ data: CourseExam[] }>('/exams', { params: { courseId, type: 'course', limit: 100 } }); return response.data.data; };

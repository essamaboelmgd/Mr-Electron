import { ChevronLeft, Edit3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Course } from '@/services/coursesService';

export default function CourseCard({ course }: { course: Course }) {
  const navigate = useNavigate();
  return <button type="button" className="admin-course-row" onClick={() => navigate(`/admin/courses/${course._id}`)}><span className="admin-course-title"><span className="course-number">{String(course.order || 0).padStart(2, '0')}</span><span><strong>{course.title}</strong><small>{course.educationalLevel?.nameAr} · {course.lessonCount || 0} دروس</small></span></span><span className="row-actions"><Edit3 size={15} /><ChevronLeft size={15} /></span></button>;
}

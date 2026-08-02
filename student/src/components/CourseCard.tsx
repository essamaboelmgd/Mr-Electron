import { ChevronLeft, LockKeyhole, PlayCircle } from 'lucide-react';
import { useNavigate } from '@/lib/router';
import type { Course } from '@/services/coursesService';

export default function CourseCard({ course }: { course: Course }) {
  const navigate = useNavigate();
  const open = course.access === 'active';
  return <button type="button" className="chapter-mini" onClick={() => navigate(`/courses/${course._id}`)}><span className={open ? 'chapter-status open' : 'chapter-status'}>{open ? <PlayCircle size={15} /> : <LockKeyhole size={15} />}</span><span><strong>{course.title}</strong><small>{course.lessonCount || 0} درس · {open ? 'متاح الآن' : 'محتوى مقفول'}</small></span><ChevronLeft size={17} /></button>;
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { getAllExams } from '@/services/examsService';
import { Eye } from 'lucide-react';

interface Exam {
  _id: string;
  courseId: string | null | { _id: string; title: string };
  lessonId: string | null;
  title: string;
  date: string;
  timeLimitMin: number;
  totalMarks: number;
  type: 'course' | 'general';
  isActive: boolean;
  mandatoryAttendance: boolean;
  createdAt: string;
  updatedAt: string;
  // Added fields for course and lesson names
  courseTitle?: string;
  lessonTitle?: string;
}

export default function ExamGradesPage() {
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    loadExams();
  }, [currentPage, limit]);

  const loadExams = async () => {
    try {
      setLoading(true);
      const { exams: examList, pagination } = await getAllExams(currentPage, limit);
      
      // Enhance exams with course and lesson titles
      const enhancedExams = examList.map(exam => ({
        ...exam,
        courseTitle: exam.courseId ? 'Course Title' : 'N/A',
        lessonTitle: exam.lessonId ? 'Lesson Title' : 'N/A'
      }));
      
      setExams(enhancedExams);
      setTotalPages(pagination.totalPages);
    } catch (error) {
      console.error('Error loading exams:', error);
      toast.error('حدث خطأ أثناء تحميل الامتحانات');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    
    // Sort the exams
    const sortedExams = [...exams].sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (field) {
        case 'title':
          aValue = a.title;
          bValue = b.title;
          break;
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case 'course':
          aValue = a.courseTitle || '';
          bValue = b.courseTitle || '';
          break;
        default:
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    setExams(sortedExams);
  };

  const filteredExams = exams.filter(exam => {
    if (!searchTerm) return true;
    return exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (exam.courseTitle && exam.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-screen">
          <div>جاري التحميل...</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">درجات الامتحانات</h1>
            <p className="text-muted-foreground mt-2">عرض جميع الامتحانات ودرجات الطلاب</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-1/3">
            <Input
              placeholder="بحث عن امتحان..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full md:w-48">
            <Select value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="عدد النتائج" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 نتائج</SelectItem>
                <SelectItem value="25">25 نتيجة</SelectItem>
                <SelectItem value="50">50 نتيجة</SelectItem>
                <SelectItem value="100">100 نتيجة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredExams.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            لا توجد امتحانات متاحة
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('title')}>
                    عنوان الامتحان {sortField === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead>الكورس</TableHead>
                  <TableHead>الدرس</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('date')}>
                    التاريخ {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExams.map((exam) => (
                  <TableRow key={exam._id}>
                    <TableCell className="font-medium">
                      {exam.title}
                    </TableCell>
                    <TableCell>{exam.courseTitle || 'عام'}</TableCell>
                    <TableCell>{exam.lessonTitle || 'N/A'}</TableCell>
                    <TableCell>{formatDate(exam.date)}</TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => navigate(`/admin/exams/${exam._id}/results`)}
                      >
                        <Eye className="w-4 h-4 ml-2" />
                        عرض الدرجات
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              الصفحة {currentPage} من {totalPages}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                السابق
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                التالي
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

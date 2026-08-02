import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { getAllAssignments } from '@/services/assignmentsService';
import { Eye } from 'lucide-react';

interface Assignment {
  _id: string;
  courseId: string | null;
  lessonId: string | null;
  title: string;
  date: string;
  timeLimitMin: number;
  totalMarks: number;
  type: 'course' | 'general';
  isActive: boolean;
  mandatoryAttendance: boolean;
  hasTimeLimit: boolean;
  createdAt: string;
  updatedAt: string;
  // Added fields for course and lesson names
  courseTitle?: string;
  lessonTitle?: string;
}

export default function AssignmentGradesPage() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    loadAssignments();
  }, [currentPage, limit]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const { assignments: assignmentList, pagination } = await getAllAssignments(currentPage, limit);
      
      // Enhance assignments with course and lesson titles
      const enhancedAssignments = assignmentList.map(assignment => ({
        ...assignment,
        courseTitle: assignment.courseId ? 'Course Title' : 'N/A',
        lessonTitle: assignment.lessonId ? 'Lesson Title' : 'N/A'
      }));
      
      setAssignments(enhancedAssignments);
      setTotalPages(pagination.totalPages);
    } catch (error) {
      console.error('Error loading assignments:', error);
      toast.error('حدث خطأ أثناء تحميل الواجبات');
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
    
    // Sort the assignments
    const sortedAssignments = [...assignments].sort((a, b) => {
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
    
    setAssignments(sortedAssignments);
  };

  const filteredAssignments = assignments.filter(assignment => {
    if (!searchTerm) return true;
    return assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (assignment.courseTitle && assignment.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()));
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
            <h1 className="text-3xl font-bold text-foreground">درجات الواجبات</h1>
            <p className="text-muted-foreground mt-2">عرض جميع الواجبات ودرجات الطلاب</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-1/3">
            <Input
              placeholder="بحث عن واجب..."
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

        {filteredAssignments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            لا توجد واجبات متاحة
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('title')}>
                    عنوان الواجب {sortField === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
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
                {filteredAssignments.map((assignment) => (
                  <TableRow key={assignment._id}>
                    <TableCell className="font-medium">
                      {assignment.title}
                    </TableCell>
                    <TableCell>{assignment.courseTitle || 'عام'}</TableCell>
                    <TableCell>{assignment.lessonTitle || 'N/A'}</TableCell>
                    <TableCell>{formatDate(assignment.date)}</TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => navigate(`/admin/assignments/${assignment._id}/results`)}
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
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from '@/lib/router';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { getAssignmentById, getAssignmentSubmissions } from '@/services/assignmentsService';
import { Eye } from 'lucide-react';

interface Submission {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  examId: string;
  onModel: 'Exam' | 'Assignment';
  answers: { questionId: string; selectedOption: string }[];
  score: number;
  totalMarks: number;
  submittedAt: string;
  isGraded: boolean;
  gradedAt: string;
  gradedBy: string;
  createdAt: string;
  updatedAt: string;
}

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
}

export default function AssignmentResultsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('submittedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    if (id) {
      loadAssignment();
      loadSubmissions();
    }
  }, [id, currentPage, limit]);

  const loadAssignment = async () => {
    try {
      const assignmentData = await getAssignmentById(id!);
      setAssignment(assignmentData);
    } catch (error) {
      console.error('Error loading assignment:', error);
      toast.error('حدث خطأ أثناء تحميل بيانات الواجب');
    }
  };

  const loadSubmissions = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const { submissions: subs, pagination } = await getAssignmentSubmissions(id, currentPage, limit);
      setSubmissions(subs);
      setTotalPages(pagination.totalPages);
    } catch (error) {
      console.error('Error loading submissions:', error);
      toast.error('حدث خطأ أثناء تحميل نتائج الواجب');
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
    
    // Sort the submissions
    const sortedSubmissions = [...submissions].sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (field) {
        case 'student':
          aValue = a.userId?.name || '';
          bValue = b.userId?.name || '';
          break;
        case 'score':
          aValue = a.score;
          bValue = b.score;
          break;
        case 'date':
          aValue = new Date(a.submittedAt).getTime();
          bValue = new Date(b.submittedAt).getTime();
          break;
        default:
          aValue = new Date(a.submittedAt).getTime();
          bValue = new Date(b.submittedAt).getTime();
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    setSubmissions(sortedSubmissions);
  };

  const filteredSubmissions = submissions.filter(submission => {
    if (!searchTerm) return true;
    return submission.userId?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           submission.userId?.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getGradeBadge = (score: number, totalMarks: number) => {
    const percentage = (score / totalMarks) * 100;
    
    if (percentage >= 85) {
      return <Badge className="bg-green-500">ممتاز</Badge>;
    } else if (percentage >= 75) {
      return <Badge className="bg-blue-500">جيد جداً</Badge>;
    } else if (percentage >= 65) {
      return <Badge className="bg-yellow-500">جيد</Badge>;
    } else if (percentage >= 50) {
      return <Badge className="bg-orange-500">مقبول</Badge>;
    } else {
      return <Badge className="bg-red-500">ضعيف</Badge>;
    }
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
            <h1 className="text-3xl font-bold text-foreground">نتائج الواجب</h1>
            {assignment && (
              <p className="text-muted-foreground mt-2">{assignment.title}</p>
            )}
          </div>
          <Button onClick={() => navigate(-1)}>العودة</Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-1/3">
            <Input
              placeholder="بحث عن طالب..."
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

        {filteredSubmissions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            لا توجد نتائج متاحة
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('student')}>
                    الطالب {sortField === 'student' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>رقم الهاتف</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('score')}>
                    الدرجة {sortField === 'score' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead>النسبة المئوية</TableHead>
                  <TableHead>التقدير</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('date')}>
                    تاريخ التقديم {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.map((submission) => (
                  <TableRow key={submission._id}>
                    <TableCell className="font-medium">
                      {submission.userId?.name || 'غير متوفر'}
                    </TableCell>
                    <TableCell>{submission.userId?.email || 'غير متوفر'}</TableCell>
                    <TableCell>{submission.userId?.phone || 'غير متوفر'}</TableCell>
                    <TableCell>{submission.score} / {submission.totalMarks}</TableCell>
                    <TableCell>
                      {submission.totalMarks > 0 
                        ? `${Math.round((submission.score / submission.totalMarks) * 100)}%` 
                        : '0%'}
                    </TableCell>
                    <TableCell>{getGradeBadge(submission.score, submission.totalMarks)}</TableCell>
                    <TableCell>{formatDate(submission.submittedAt)}</TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => navigate(`/admin/assignments/${submission.examId}/result`, { 
                          state: { 
                            answers: submission.answers.reduce((acc, ans) => {
                              acc[ans.questionId] = ans.selectedOption;
                              return acc;
                            }, {} as Record<string, string>),
                            score: submission.score,
                            totalMarks: submission.totalMarks,
                            isAssignmentMode: true
                          } 
                        })}
                      >
                        <Eye className="w-4 h-4 ml-2" />
                        عرض التفاصيل
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

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import api from '@/services/api';
import { getCourses } from '@/services/coursesService';
import { getAssignments, createAssignment, updateAssignment } from '@/services/assignmentsService';

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

interface Course {
  _id: string;
  title: string;
  educationalLevel: {
    _id: string;
    name: string;
    nameAr: string;
    level: 'primary' | 'prep' | 'secondary';
    year: number;
  };
  shortDescription: string;
  fullDescription: string;
  price: number;
  image: string;
  vodafoneNumber: string;
  month: number;
  createdAt: string;
  updatedAt: string;
}

interface Lesson {
  _id: string;
  courseId: string;
  title: string;
  duration: number;
  isLocked: boolean;
  videoUrl?: string;
  description?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export default function ManageAssignmentsPage() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    timeLimitMin: 0,
    type: 'course' as 'course' | 'general',
    isActive: true,
    mandatoryAttendance: false,
    courseId: '',
    lessonId: '',
    hasTimeLimit: false
  });
  const [courseLessons, setCourseLessons] = useState<Lesson[]>([]);

  useEffect(() => {
    loadAssignments();
    loadCourses();
  }, []);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const assignmentsData = await getAssignments();
      setAssignments(assignmentsData);
    } catch (error) {
      console.error('Error loading assignments:', error);
      toast.error('حدث خطأ أثناء تحميل الواجبات');
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const coursesData = await getCourses();
      setCourses(coursesData);
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error('حدث خطأ أثناء تحميل الكورسات');
    }
  };

  const loadLessons = async (courseId: string) => {
    try {
      const response = await api.get(`/courses/${courseId}/lessons`);
      setLessons(response.data.data);
      setCourseLessons(response.data.data);
    } catch (error) {
      console.error('Error loading lessons:', error);
      toast.error('حدث خطأ أثناء تحميل الدروس');
    }
  };

  const handleCourseChange = (courseId: string) => {
    setFormData({ ...formData, courseId, lessonId: '' });
    if (courseId) {
      loadLessons(courseId);
    } else {
      setCourseLessons([]);
    }
  };

  const handleCreate = async () => {
    try {
      // Validate required fields
      if (!formData.title) {
        toast.error('يرجى إدخال عنوان الواجب');
        return;
      }
      
      if (formData.type === 'course' && !formData.courseId) {
        toast.error('يرجى اختيار كورس للواجب');
        return;
      }
      
      // Prepare data for submission
      const assignmentData = { 
        ...formData,
        timeLimitMin: formData.hasTimeLimit ? formData.timeLimitMin : 0
      };
      
      // If no date is provided, use today's date
      if (!assignmentData.date) {
        assignmentData.date = new Date().toISOString();
      }
      
      const response = await createAssignment(assignmentData);
      setAssignments([...assignments, response]);
      toast.success('تم إنشاء الواجب بنجاح');
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast.error('حدث خطأ أثناء إنشاء الواجب');
    }
  };

  const handleUpdate = async () => {
    if (!currentAssignment) return;
    
    try {
      // Validate required fields
      if (!formData.title) {
        toast.error('يرجى إدخال عنوان الواجب');
        return;
      }
      
      if (formData.type === 'course' && !formData.courseId) {
        toast.error('يرجى اختيار كورس للواجب');
        return;
      }
      
      // Prepare data for submission
      const assignmentData = { 
        ...formData,
        timeLimitMin: formData.hasTimeLimit ? formData.timeLimitMin : 0
      };
      
      // If no date is provided, keep the existing date or use today's date
      if (!assignmentData.date) {
        assignmentData.date = currentAssignment.date || new Date().toISOString();
      }
      
      const response = await updateAssignment(currentAssignment._id, assignmentData);
      setAssignments(assignments.map(assignment => assignment._id === currentAssignment._id ? response : assignment));
      toast.success('تم تحديث الواجب بنجاح');
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error updating assignment:', error);
      toast.error('حدث خطأ أثناء تحديث الواجب');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد أنك تريد حذف هذا الواجب؟')) return;
    
    try {
      await api.delete(`/admin/assignments/${id}`);
      setAssignments(assignments.filter(assignment => assignment._id !== id));
      toast.success('تم حذف الواجب بنجاح');
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast.error('حدث خطأ أثناء حذف الواجب');
    }
  };

  const openCreateDialog = () => {
    setCurrentAssignment(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (assignment: Assignment) => {
    setCurrentAssignment(assignment);
    setFormData({
      title: assignment.title,
      date: assignment.date ? (assignment.date.split ? assignment.date.split('T')[0] : '') : '',
      timeLimitMin: assignment.timeLimitMin || 0,
      type: assignment.type,
      isActive: assignment.isActive,
      mandatoryAttendance: assignment.mandatoryAttendance,
      courseId: assignment.courseId || '',
      lessonId: assignment.lessonId || '',
      hasTimeLimit: assignment.timeLimitMin > 0
    });
    
    // Load lessons for the course if it's a course assignment
    if (assignment.courseId) {
      loadLessons(assignment.courseId);
    }
    
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      date: '',
      timeLimitMin: 0,
      type: 'course',
      isActive: true,
      mandatoryAttendance: false,
      courseId: '',
      lessonId: '',
      hasTimeLimit: false
    });
    setCourseLessons([]);
  };

  const handleSubmit = () => {
    if (currentAssignment) {
      handleUpdate();
    } else {
      handleCreate();
    }
  };

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || assignment.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && assignment.isActive) || 
      (statusFilter === 'inactive' && !assignment.isActive);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return 'غير محدد';
    return new Date(dateString).toLocaleDateString('ar-EG');
  };

  const getTypeBadge = (type: string) => {
    if (type === 'course') {
      return <Badge className="bg-blue-500">كورس</Badge>;
    }
    return <Badge className="bg-purple-500">عام</Badge>;
  };

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return <Badge className="bg-green-500">مفعل</Badge>;
    }
    return <Badge className="bg-red-500">غير مفعل</Badge>;
  };

  const getCourseName = (courseId: string | null) => {
    if (!courseId) return 'غير محدد';
    const course = courses.find(c => c._id === courseId);
    return course ? course.title : 'كورس غير موجود';
  };

  const getLessonName = (lessonId: string | null) => {
    if (!lessonId) return 'غير محدد';
    const lesson = lessons.find(l => l._id === lessonId);
    return lesson ? lesson.title : 'درس غير موجود';
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
          <h1 className="text-3xl font-bold text-foreground">إدارة الواجبات</h1>
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 ml-2" />
            إنشاء واجب جديد
          </Button>
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
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="نوع الواجب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="course">كورس</SelectItem>
                <SelectItem value="general">عام</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="active">مفعل</SelectItem>
                <SelectItem value="inactive">غير مفعل</SelectItem>
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
                  <TableHead>العنوان</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>الكورس</TableHead>
                  <TableHead>الدرس</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>المدة (دقائق)</TableHead>
                  <TableHead>الدرجة الكلية</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.map((assignment) => (
                  <TableRow key={assignment._id}>
                    <TableCell className="font-medium">{assignment.title}</TableCell>
                    <TableCell>{getTypeBadge(assignment.type)}</TableCell>
                    <TableCell>{getCourseName(assignment.courseId)}</TableCell>
                    <TableCell>{getLessonName(assignment.lessonId)}</TableCell>
                    <TableCell>{formatDate(assignment.date)}</TableCell>
                    <TableCell>{assignment.timeLimitMin > 0 ? assignment.timeLimitMin : 'غير محدود'}</TableCell>
                    <TableCell>{assignment.totalMarks || 0}</TableCell>
                    <TableCell>{getStatusBadge(assignment.isActive)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => navigate(`/admin/assignments/${assignment._id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openEditDialog(assignment)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDelete(assignment._id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Assignment Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {currentAssignment ? 'تعديل الواجب' : 'إنشاء واجب جديد'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">عنوان الواجب *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="أدخل عنوان الواجب"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">تاريخ الواجب (اختياري)</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>
              
              <div className="space-y-2 flex items-end">
                <div className="flex-1">
                  <Label htmlFor="timeLimitMin">مدة الواجب (بالدقائق)</Label>
                  <Input
                    id="timeLimitMin"
                    type="number"
                    min="0"
                    value={formData.timeLimitMin}
                    onChange={(e) => setFormData({...formData, timeLimitMin: parseInt(e.target.value) || 0})}
                    disabled={!formData.hasTimeLimit}
                  />
                </div>
                <div className="pb-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="hasTimeLimit"
                      checked={formData.hasTimeLimit}
                      onCheckedChange={(checked) => setFormData({...formData, hasTimeLimit: checked})}
                    />
                    <Label htmlFor="hasTimeLimit">وقت محدد</Label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">نوع الواجب</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value as 'course' | 'general'})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="course">واجب كورس</SelectItem>
                    <SelectItem value="general">واجب عام</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {formData.type === 'course' && (
                <div className="space-y-2">
                  <Label htmlFor="courseId">الكورس *</Label>
                  <Select value={formData.courseId} onValueChange={handleCourseChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر كورس" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map(course => (
                        <SelectItem key={course._id} value={course._id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            {formData.type === 'course' && formData.courseId && (
              <div className="space-y-2">
                <Label htmlFor="lessonId">الدرس (اختياري)</Label>
                <Select 
                  value={formData.lessonId || "none"} 
                  onValueChange={(value) => setFormData({...formData, lessonId: value === "none" ? "" : value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر درس" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون درس محدد</SelectItem>
                    {courseLessons.map(lesson => (
                      <SelectItem key={lesson._id} value={lesson._id}>
                        {lesson.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">تفعيل الواجب</Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="mandatoryAttendance">حضور إجباري</Label>
                <Switch
                  id="mandatoryAttendance"
                  checked={formData.mandatoryAttendance}
                  onCheckedChange={(checked) => setFormData({...formData, mandatoryAttendance: checked})}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSubmit}>
              {currentAssignment ? 'تحديث' : 'إنشاء'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
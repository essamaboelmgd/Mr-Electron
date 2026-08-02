import { useEffect, useState } from 'react';
import { useNavigate } from '@/lib/router';
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
import { getAllNotes, createNote, updateNote, deleteNote } from '@/services/notesService';
import { getEducationalLevels } from '@/services/educationalLevelService';
import { getCourses } from '@/services/coursesService';

interface Note {
  _id: string;
  title: string;
  educationalLevel: string;
  courseId: string; // Added courseId field
  description: string;
  price: number;
  image: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EducationalLevel {
  _id: string;
  name: string;
  nameAr: string;
  level: 'primary' | 'prep' | 'secondary';
  year: number;
  isActive: boolean;
  order: number;
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

export default function ManageNotesPage() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [educationalLevels, setEducationalLevels] = useState<EducationalLevel[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    educationalLevelId: '',
    courseId: '',
    description: '',
    price: 0,
    image: '',
    isActive: true
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    loadNotes();
    loadEducationalLevels();
    loadCourses(); // Added loadCourses
  }, []);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const { notes: notesData } = await getAllNotes(1, 100); // Load all notes
      setNotes(notesData);
    } catch (error) {
      console.error('Error loading notes:', error);
      toast.error('حدث خطأ أثناء تحميل المذكرات');
    } finally {
      setLoading(false);
    }
  };

  const loadEducationalLevels = async () => {
    try {
      const response = await getEducationalLevels();
      setEducationalLevels(response.data);
    } catch (error) {
      console.error('Error loading educational levels:', error);
      toast.error('حدث خطأ أثناء تحميل المراحل الدراسية');
    }
  };

  const loadCourses = async () => {
    try {
      const response = await getCourses();
      setCourses(response.courses);
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error('حدث خطأ أثناء تحميل الكورسات');
    }
  };

  const handleCreate = async () => {
    try {
      // Validate required fields
      if (!formData.title || !formData.educationalLevelId || !formData.description) {
        toast.error('يرجى ملء جميع الحقول المطلوبة');
        return;
      }
      
      if (formData.price < 0) {
        toast.error('السعر يجب أن يكون رقمًا موجبًا');
        return;
      }
      
      // Find the selected educational level
      const selectedLevel = educationalLevels.find(level => level._id === formData.educationalLevelId);
      if (!selectedLevel) {
        toast.error('الرجاء اختيار مرحلة دراسية صحيحة');
        return;
      }
      
      const submitData = new FormData();
      
      // Append all form data
      Object.keys(formData).forEach(key => {
        submitData.append(key, (formData as any)[key]);
      });
      
      // Append educationalLevel ID
      submitData.set('educationalLevel', selectedLevel._id);
      
      // Append image file if selected
      if (imageFile) {
        submitData.append('image', imageFile);
      }
      
      const response = await createNote(submitData as any);
      setNotes([...notes, response]);
      toast.success('تم إنشاء المذكرة بنجاح');
      setIsDialogOpen(false);
      resetForm();
      setImageFile(null);
    } catch (error) {
      console.error('Error creating note:', error);
      toast.error('حدث خطأ أثناء إنشاء المذكرة');
    }
  };

  const handleUpdate = async () => {
    if (!currentNote) return;
    
    try {
      // Validate required fields
      if (!formData.title || !formData.educationalLevelId || !formData.description) {
        toast.error('يرجى ملء جميع الحقول المطلوبة');
        return;
      }
      
      if (formData.price < 0) {
        toast.error('السعر يجب أن يكون رقمًا موجبًا');
        return;
      }
      
      // Find the selected educational level
      const selectedLevel = educationalLevels.find(level => level._id === formData.educationalLevelId);
      if (!selectedLevel) {
        toast.error('الرجاء اختيار مرحلة دراسية صحيحة');
        return;
      }
      
      const submitData = new FormData();
      
      // Append all form data
      Object.keys(formData).forEach(key => {
        submitData.append(key, (formData as any)[key]);
      });
      
      // Append educationalLevel ID
      submitData.set('educationalLevel', selectedLevel._id);
      
      // Append image file if selected
      if (imageFile) {
        submitData.append('image', imageFile);
      }
      
      const response = await updateNote(currentNote._id, submitData as any);
      setNotes(notes.map(note => note._id === currentNote._id ? response : note));
      toast.success('تم تحديث المذكرة بنجاح');
      setIsDialogOpen(false);
      resetForm();
      setImageFile(null);
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error('حدث خطأ أثناء تحديث المذكرة');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد أنك تريد حذف هذه المذكرة؟')) return;
    
    try {
      await deleteNote(id);
      setNotes(notes.filter(note => note._id !== id));
      toast.success('تم حذف المذكرة بنجاح');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('حدث خطأ أثناء حذف المذكرة');
    }
  };

  const openCreateDialog = () => {
    setCurrentNote(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (note: Note) => {
    // Find the educational level ID from the note's educationalLevel field
    const educationalLevel = educationalLevels.find(level => level._id === note.educationalLevel);
    
    setCurrentNote(note);
    setFormData({
      title: note.title,
      educationalLevelId: educationalLevel ? educationalLevel._id : '',
      courseId: note.courseId || '', // Added courseId field
      description: note.description,
      price: note.price,
      image: note.image || '',
      isActive: note.isActive
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      educationalLevelId: '',
      courseId: '',
      description: '',
      price: 0,
      image: '',
      isActive: true
    });
    setImageFile(null);
  };

  const handleSubmit = () => {
    if (currentNote) {
      handleUpdate();
    } else {
      handleCreate();
    }
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.educationalLevel.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && note.isActive) || 
      (statusFilter === 'inactive' && !note.isActive);
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return <Badge className="bg-green-500">مفعل</Badge>;
    }
    return <Badge className="bg-red-500">غير مفعل</Badge>;
  };

  const getEducationalLevelName = (educationalLevelId: string) => {
    const level = educationalLevels.find(l => l._id === educationalLevelId);
    return level ? `${level.nameAr} - ${level.year}` : 'غير محدد';
  };

  const getCourseName = (courseId: string) => {
    const course = courses.find(c => c._id === courseId);
    return course ? course.title : 'غير محدد';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG');
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
          <h1 className="text-3xl font-bold text-foreground">إدارة المذكرات</h1>
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 ml-2" />
            إنشاء مذكرة جديدة
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-1/3">
            <Input
              placeholder="بحث عن مذكرة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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

        {filteredNotes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            لا توجد مذكرات متاحة
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>العنوان</TableHead>
                  <TableHead>المرحلة الدراسية</TableHead>
                  <TableHead>الكورس</TableHead> {/* Added course column */}
                  <TableHead>الوصف</TableHead>
                  <TableHead>السعر (ج.م)</TableHead>
                  <TableHead>تاريخ الإنشاء</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNotes.map((note) => (
                  <TableRow key={note._id}>
                    <TableCell className="font-medium">{note.title}</TableCell>
                    <TableCell>{getEducationalLevelName(note.educationalLevel)}</TableCell>
                    <TableCell>{getCourseName(note.courseId)}</TableCell> {/* Added course cell */}
                    <TableCell>{note.description.substring(0, 50)}...</TableCell>
                    <TableCell>{note.price}</TableCell>
                    <TableCell>{formatDate(note.createdAt)}</TableCell>
                    <TableCell>{getStatusBadge(note.isActive)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openEditDialog(note)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => navigate(`/notes/detail/${note._id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDelete(note._id)}
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

      {/* Note Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {currentNote ? 'تعديل المذكرة' : 'إنشاء مذكرة جديدة'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">عنوان المذكرة *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="أدخل عنوان المذكرة"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="educationalLevelId">المرحلة الدراسية *</Label>
                <Select 
                  value={formData.educationalLevelId} 
                  onValueChange={(value) => setFormData({...formData, educationalLevelId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المرحلة الدراسية" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {educationalLevels
                      .filter(level => level.isActive)
                      .map(level => (
                        <SelectItem key={level._id} value={level._id}>
                          {level.nameAr} - {level.year}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="courseId">الكورس (اختياري)</Label>
                <Select 
                  value={formData.courseId} 
                  onValueChange={(value) => setFormData({...formData, courseId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الكورس" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {courses
                      .filter(course => course.educationalLevel._id === formData.educationalLevelId || !formData.educationalLevelId)
                      .map(course => (
                        <SelectItem key={course._id} value={course._id}>
                          {course.title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="price">السعر (ج.م) *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: parseInt(e.target.value) || 0})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">الوصف *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="أدخل وصف المذكرة"
                rows={4}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="image">الصورة</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  setFormData({...formData, image: e.target.files && e.target.files[0] ? URL.createObjectURL(e.target.files[0]) : ''});
                  if (e.target.files && e.target.files[0]) {
                    setImageFile(e.target.files[0]);
                  }
                }}
              />
              {formData.image && (
                <div className="mt-2">
                  <img 
                    src={formData.image} 
                    alt="Current note" 
                    className="w-32 h-32 object-cover rounded-md"
                  />
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">تفعيل المذكرة</Label>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSubmit}>
              {currentNote ? 'تحديث' : 'إنشاء'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

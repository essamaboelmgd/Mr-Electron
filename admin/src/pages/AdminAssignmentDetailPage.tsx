import { useEffect, useState } from 'react';
import { useParams, useNavigate } from '@/lib/router';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, MoveUp, MoveDown, Eye } from 'lucide-react';
import { getAssignmentById, getAssignmentQuestions, createQuestion, updateQuestion, deleteQuestion } from '@/services/assignmentsService';
import { type Assignment, type Question } from '@/services/assignmentsService';

export default function AdminAssignmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionImageFile, setQuestionImageFile] = useState<File | null>(null);
  
  const [questionFormData, setQuestionFormData] = useState({
    type: 'text' as 'text' | 'image',
    content: '',
    options: [
      { id: '1', text: '' },
      { id: '2', text: '' },
      { id: '3', text: '' },
      { id: '4', text: '' }
    ],
    correct: '1',
    explanation: '',
    order: 1,
    marks: 1
  });

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      // Load assignment
      const assignmentData = await getAssignmentById(id);
      setAssignment(assignmentData);
      
      // Load questions
      const questionsData = await getAssignmentQuestions(id);
      // Ensure questionsData is an array
      setQuestions(Array.isArray(questionsData) ? questionsData : []);
    } catch (error) {
      console.error('Error loading assignment data:', error);
      toast.error('حدث خطأ أثناء تحميل بيانات الواجب');
      // Set questions to empty array in case of error
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    setEditingQuestion(null);
    setQuestionFormData({
      type: 'text',
      content: '',
      options: [
        { id: '1', text: '' },
        { id: '2', text: '' },
        { id: '3', text: '' },
        { id: '4', text: '' }
      ],
      correct: '1',
      explanation: '',
      order: questions.length + 1,
      marks: 1
    });
    setQuestionImageFile(null);
    setIsQuestionModalOpen(true);
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setQuestionFormData({
      type: question.type,
      content: question.content,
      options: question.options,
      correct: question.correct,
      explanation: question.explanation || '',
      order: question.order,
      marks: question.marks || 1
    });
    setQuestionImageFile(null);
    setIsQuestionModalOpen(true);
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا السؤال؟')) {
      return;
    }

    try {
      await deleteQuestion(questionId);
      toast.success('تم حذف السؤال بنجاح');
      loadData();
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('حدث خطأ أثناء حذف السؤال');
    }
  };

  const handleQuestionFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const submitData = new FormData();
      
      // Append individual form fields
      submitData.append('type', questionFormData.type);
      submitData.append('content', questionFormData.content);
      submitData.append('correct', questionFormData.correct);
      submitData.append('explanation', questionFormData.explanation);
      submitData.append('order', questionFormData.order.toString());
      submitData.append('marks', questionFormData.marks.toString());
      submitData.append('examId', id || '');
      submitData.append('onModel', 'Assignment');
      
      // Append options as individual fields
      questionFormData.options.forEach((option, index) => {
        submitData.append(`options[${index}][id]`, option.id);
        submitData.append(`options[${index}][text]`, option.text);
      });
      
      // Append image file if selected and question type is image
      if (questionFormData.type === 'image' && questionImageFile) {
        submitData.append('image', questionImageFile);
      }
      
      if (editingQuestion) {
        // Update existing question
        await updateQuestion(editingQuestion._id, submitData as any);
        toast.success('تم تحديث السؤال بنجاح');
      } else {
        // Create new question
        await createQuestion(submitData as any);
        toast.success('تم إنشاء السؤال بنجاح');
      }
      
      setIsQuestionModalOpen(false);
      setQuestionImageFile(null);
      loadData();
    } catch (error: any) {
      console.error('Error saving question:', error);
      toast.error(error.response?.data?.message || 'حدث خطأ أثناء حفظ السؤال');
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...questionFormData.options];
    newOptions[index].text = value;
    setQuestionFormData({ ...questionFormData, options: newOptions });
  };

  const handleMoveQuestion = async (questionId: string, direction: 'up' | 'down') => {
    try {
      const questionIndex = questions.findIndex(q => q._id === questionId);
      if (questionIndex === -1) return;
      
      let targetIndex;
      if (direction === 'up' && questionIndex > 0) {
        targetIndex = questionIndex - 1;
      } else if (direction === 'down' && questionIndex < questions.length - 1) {
        targetIndex = questionIndex + 1;
      } else {
        return;
      }
      
      // Swap order values
      const currentQuestion = questions[questionIndex];
      const targetQuestion = questions[targetIndex];
      
      // Update both questions' order
      await updateQuestion(currentQuestion._id, { 
        order: targetQuestion.order,
        onModel: 'Assignment' as 'Assignment'
      });
      await updateQuestion(targetQuestion._id, { 
        order: currentQuestion.order,
        onModel: 'Assignment' as 'Assignment'
      });
      
      loadData();
    } catch (error) {
      console.error('Error moving question:', error);
      toast.error('حدث خطأ أثناء تحريك السؤال');
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

  if (!assignment) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-screen">
          <div>الواجب غير موجود</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">{assignment.title}</h1>
          <div className="flex gap-2">
            <Button onClick={() => navigate(`/admin/assignments/${id}/results`)} className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              عرض نتائج الواجب
            </Button>
            <Button onClick={() => navigate(-1)}>العودة</Button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-foreground mb-2">نوع الواجب</h3>
              <p className="text-muted-foreground">{assignment.type === 'course' ? 'واجب كورس' : 'واجب عام'}</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">مدة الواجب</h3>
              <p className="text-muted-foreground">{assignment.timeLimitMin} دقيقة</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">الدرجة الكلية</h3>
              <p className="text-muted-foreground">{assignment.totalMarks} درجة</p>
            </div>
          </div>
          
          <div className="mt-6 flex items-center space-x-4">
            <div>
              <h3 className="font-semibold text-foreground mb-2">الحضور إجباري</h3>
              <p className="text-muted-foreground">{assignment.mandatoryAttendance ? 'نعم' : 'لا'}</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">الحالة</h3>
              <p className="text-muted-foreground">{assignment.isActive ? 'مفعل' : 'غير مفعل'}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-foreground">الأسئلة</h2>
          <Button onClick={handleAddQuestion} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            إضافة سؤال
          </Button>
        </div>

        {(!questions || questions.length === 0) ? (
          <div className="text-center py-12 text-muted-foreground">
            لا توجد أسئلة متاحة
          </div>
        ) : (
          <div className="space-y-3">
            {questions
              .sort((a, b) => a.order - b.order)
              .map((question, index) => (
                <div key={question._id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-primary text-primary-foreground px-2 py-1 rounded text-sm">
                          {question.order}
                        </span>
                        {question.type === 'image' ? (
                          <img 
                            src={question.content} 
                            alt="Question" 
                            className="max-w-full h-auto rounded-md"
                            style={{ maxHeight: '300px' }}
                          />
                        ) : (
                          <h3 className="font-semibold text-foreground">{question.content}</h3>
                        )}
                        {/* Display question marks */}
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                          {question.marks} درجة
                        </span>
                      </div>
                      
                      <div className="space-y-2 mt-3">
                        {question.options.map((option) => (
                          <div 
                            key={option.id} 
                            className={`p-2 rounded ${question.correct === option.id ? 'bg-green-100 border border-green-300' : 'bg-muted'}`}
                          >
                            <span className="font-medium">{String.fromCharCode(65 + question.options.findIndex(o => o.id === option.id))}. </span>
                            {option.text}
                            {question.correct === option.id && (
                              <span className="ml-2 text-green-600 font-medium">(الإجابة الصحيحة)</span>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {question.explanation && (
                        <div className="mt-3 p-2 bg-blue-50 rounded">
                          <p className="text-sm text-blue-800">
                            <span className="font-semibold">التفسير: </span>
                            {question.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEditQuestion(question)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDeleteQuestion(question._id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleMoveQuestion(question._id, 'up')}
                        disabled={index === 0}
                      >
                        <MoveUp className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleMoveQuestion(question._id, 'down')}
                        disabled={index === questions.length - 1}
                      >
                        <MoveDown className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Question Form Modal */}
      <Dialog open={isQuestionModalOpen} onOpenChange={setIsQuestionModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? 'تعديل السؤال' : 'إضافة سؤال جديد'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleQuestionFormSubmit} className="space-y-4">
            <div>
              <Label htmlFor="questionType">نوع السؤال</Label>
              <Select 
                value={questionFormData.type} 
                onValueChange={(value: 'text' | 'image') => setQuestionFormData({...questionFormData, type: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع السؤال" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">نص</SelectItem>
                  <SelectItem value="image">صورة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="questionContent">
                {questionFormData.type === 'text' ? 'نص السؤال' : 'صورة السؤال'}
              </Label>
              {questionFormData.type === 'text' ? (
                <Textarea
                  id="questionContent"
                  value={questionFormData.content}
                  onChange={(e) => setQuestionFormData({...questionFormData, content: e.target.value})}
                  rows={3}
                  required
                />
              ) : (
                <div className="space-y-2">
                  <Input
                    id="questionContent"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        setQuestionImageFile(file);
                        // Set a temporary indicator that a file is selected
                        setQuestionFormData({...questionFormData, content: `FILE:${file.name}`});
                      }
                    }}
                  />
                  {questionFormData.content && questionFormData.content.startsWith('FILE:') && (
                    <p className="text-sm text-muted-foreground">
                      ملف محدد: {questionFormData.content.substring(5)}
                    </p>
                  )}
                  {questionFormData.content && !questionFormData.content.startsWith('FILE:') && (
                    <div className="mt-2">
                      <img 
                        src={questionFormData.content} 
                        alt="Current question" 
                        className="max-w-full h-auto rounded-md"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Added marks field */}
            <div>
              <Label htmlFor="questionMarks">الدرجة</Label>
              <Input
                id="questionMarks"
                type="number"
                value={questionFormData.marks}
                onChange={(e) => setQuestionFormData({...questionFormData, marks: Number(e.target.value)})}
                min="1"
                required
              />
            </div>

            <div>
              <Label>الخيارات</Label>
              <div className="space-y-2">
                {questionFormData.options.map((option, index) => (
                  <div key={option.id} className="flex items-center gap-2">
                    <Input
                      value={option.text}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`الخيار ${String.fromCharCode(65 + index)}`}
                      required
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="correctOption">الإجابة الصحيحة</Label>
              <Select 
                value={questionFormData.correct} 
                onValueChange={(value) => setQuestionFormData({...questionFormData, correct: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الإجابة الصحيحة" />
                </SelectTrigger>
                <SelectContent>
                  {questionFormData.options.map((option, index) => (
                    <SelectItem key={option.id} value={option.id}>
                      {String.fromCharCode(65 + index)} - {option.text || `الخيار ${String.fromCharCode(65 + index)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="explanation">التفسير (اختياري)</Label>
              <Textarea
                id="explanation"
                value={questionFormData.explanation}
                onChange={(e) => setQuestionFormData({...questionFormData, explanation: e.target.value})}
                rows={2}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsQuestionModalOpen(false)} className="flex-1">
                إلغاء
              </Button>
              <Button type="submit" className="flex-1">
                {editingQuestion ? 'تحديث' : 'إنشاء'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

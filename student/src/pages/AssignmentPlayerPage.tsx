import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Clock, ChevronRight, ChevronLeft } from 'lucide-react';
import { getAssignmentById, getAssignmentQuestions, submitAssignmentAnswers, getAssignmentResults } from '@/services/assignmentsService';
import { type Assignment, type Question, type Answer, type AssignmentResult } from '@/services/assignmentsService';

export default function AssignmentPlayerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [assignmentResult, setAssignmentResult] = useState<AssignmentResult | null>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    if (timeLeft <= 0 || !assignment?.timeLimitMin) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, assignment]);

  const loadData = async () => {
    if (!id) return;

    try {
      const assignmentData = await getAssignmentById(id);
      setAssignment(assignmentData);

      if (assignmentData) {
        // Check if user has already submitted this assignment
        try {
          const result = await getAssignmentResults(id);
          if (result) {
            setAlreadySubmitted(true);
            setAssignmentResult(result);
          }
        } catch (error) {
          // If no submission found, that's fine
        }
        
        const questionsData = await getAssignmentQuestions(id);
        setQuestions(questionsData);
        setTimeLeft(assignmentData.timeLimitMin * 60);
      }
    } catch (error) {
      console.error('Error loading assignment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answerId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answerId }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!id || !assignment) return;
    
    // Convert answers to the format expected by the API
    const answersArray: Answer[] = Object.entries(answers).map(([questionId, selectedOption]) => ({
      questionId,
      selectedOption
    }));

    try {
      const result = await submitAssignmentAnswers(id, answersArray);
      
      // Navigate to results with state
      navigate(`/assignments/${id}/result`, {
        state: { 
          answers, 
          score: result.score, 
          totalMarks: result.totalMarks, 
          questions 
        }
      });
    } catch (error) {
      console.error('Error submitting assignment:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <AppShell>
        <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
      </AppShell>
    );
  }

  if (!assignment || questions.length === 0) {
    return (
      <AppShell>
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">الواجب غير موجود</p>
          <Button onClick={() => navigate('/assignments')}>العودة للواجبات</Button>
        </div>
      </AppShell>
    );
  }

  // If user has already submitted this assignment, redirect to results
  if (alreadySubmitted && assignmentResult) {
    // Check if student passed (50% or higher)
    const isPassed = assignmentResult.isPassed;
    
    return (
      <AppShell>
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 text-yellow-600 mb-4 mx-auto">
            <Clock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">لقد قمت بحل هذا الواجب بالفعل</h2>
          <p className="text-muted-foreground mb-6">
            {isPassed 
              ? 'لقد نجحت في هذا الواجب! النتيجة: ' + Math.round(assignmentResult.percentage) + '%' 
              : 'النتيجة: ' + Math.round(assignmentResult.percentage) + '% (أقل من 50%)'}
          </p>
          <div className="flex gap-4 justify-center">
            {isPassed ? (
              // If passed, don't allow retake - only allow review or return
              <>
                <Button onClick={() => navigate('/assignments')}>
                  العودة للواجبات
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate(`/assignments/${id}/result`)}
                >
                  مراجعة النتيجة
                </Button>
              </>
            ) : (
              // If failed, allow retake
              <>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setAlreadySubmitted(false);
                    setAssignmentResult(null);
                    // Reset answers and time
                    setAnswers({});
                    if (assignment) {
                      setTimeLeft(assignment.timeLimitMin * 60);
                    }
                  }}
                >
                  إعادة المحاولة
                </Button>
                <Button onClick={() => navigate('/assignments')}>
                  العودة للواجبات
                </Button>
              </>
            )}
          </div>
        </div>
      </AppShell>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{assignment.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                السؤال {currentQuestionIndex + 1} من {questions.length}
              </p>
            </div>
            {assignment.timeLimitMin > 0 && (
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Clock className="w-5 h-5 text-accent" />
                <span className={timeLeft < 300 ? 'text-destructive' : 'text-foreground'}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Question */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
          <div className="space-y-4">
            {currentQuestion.type === 'image' ? (
              <div className="bg-muted rounded-lg p-4 max-w-md">
                <img
                  src={currentQuestion.content}
                  alt="صورة السؤال"
                  className="max-w-full h-auto rounded-md mx-auto"
                  style={{ maxHeight: '400px' }}
                />
              </div>
            ) : (
              <h2 className="text-xl font-semibold text-foreground">
                {currentQuestion.content}
              </h2>
            )}
          </div>

          <RadioGroup
            value={answers[currentQuestion._id] || ''}
            onValueChange={(value) => handleAnswerChange(currentQuestion._id, value)}
            className="space-y-3"
          >
            {currentQuestion.options.map((option) => (
              <div
                key={option.id}
                className="flex items-center space-x-2 space-x-reverse border border-border rounded-lg p-4 hover:bg-muted/50 transition-smooth cursor-pointer"
              >
                <RadioGroupItem value={option.id} id={option.id} />
                <Label
                  htmlFor={option.id}
                  className="flex-1 cursor-pointer text-base"
                >
                  {option.text}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4 sticky bottom-4 bg-card border border-border rounded-xl p-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={isFirstQuestion}
            className="gap-2"
          >
            <ChevronRight className="w-4 h-4" />
            السابق
          </Button>

          <div className="text-sm text-muted-foreground">
            تم الإجابة: {Object.keys(answers).length} / {questions.length}
          </div>

          {isLastQuestion ? (
            <Button
              onClick={handleSubmit}
              className="bg-accent hover:bg-accent/90"
            >
              تصحيح الواجب
            </Button>
          ) : (
            <Button onClick={handleNext} className="gap-2">
              التالي
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </AppShell>
  );
}
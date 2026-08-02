import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Award, RotateCcw } from 'lucide-react';
import { getAssignmentResults, getAssignmentQuestions } from '@/services/assignmentsService';
import { useEffect, useState } from 'react';
import { type AssignmentResult } from '@/services/assignmentsService';

export default function AssignmentResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const locationState = location.state || {};
  const [loading, setLoading] = useState(false);
  const [resultData, setResultData] = useState<AssignmentResult | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isPassed, setIsPassed] = useState<boolean | null>(null);

  useEffect(() => {
    if (id) {
      loadResults();
      // If we don't have questions in location state, fetch them
      if (!locationState.questions) {
        loadQuestions();
      }
    }
  }, [id]);

  const loadResults = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const result = await getAssignmentResults(id);
      setResultData(result);
      setIsPassed(result.isPassed);
      
      // Set answers from submission data
      const submissionAnswers: Record<string, string> = {};
      if (result.submission.answers) {
        result.submission.answers.forEach((answer: any) => {
          submissionAnswers[answer.questionId] = answer.selectedOption;
        });
      }
      setAnswers(submissionAnswers);
    } catch (error) {
      console.error('Error loading results:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadQuestions = async () => {
    if (!id) return;
    
    try {
      const questionsData = await getAssignmentQuestions(id);
      setQuestions(questionsData);
    } catch (error) {
      console.error('Error loading questions:', error);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="text-center py-12">
          <p className="text-muted-foreground">جاري تحميل النتائج...</p>
        </div>
      </AppShell>
    );
  }

  // Use location state data if available, otherwise use fetched data
  const currentAnswers = locationState.answers || answers || {};
  const currentQuestions = locationState.questions || questions || [];
  const currentScore = locationState.score || (resultData?.submission?.score || 0);
  const currentTotalMarks = locationState.totalMarks || (resultData?.submission?.totalMarks || 0);

  // If student didn't pass (less than 50%), show a message and options
  if (isPassed !== null && !isPassed) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto text-center py-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10 text-destructive mb-6 mx-auto">
            <XCircle className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">
            الواجب غير مكتمل
          </h1>
          <p className="text-muted-foreground mb-2 text-lg">
            عذراً، لم تحقق النسبة المطلوبة (50%) لعرض نتائج التفاصيل.
          </p>
          <div className="bg-card border border-border rounded-xl p-6 mb-8">
            <div className="text-4xl font-bold text-destructive mb-2">
              {currentScore} / {currentTotalMarks}
            </div>
            <p className="text-muted-foreground">
              درجتك الحالية: {Math.round((currentScore / (currentTotalMarks || 1)) * 100)}%
            </p>
          </div>
          <p className="text-muted-foreground mb-8 text-lg">
            يرجى إعادة المحاولة للوصول إلى النتيجة المطلوبة.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate(`/assignments/${id}/take`)}
              className="gap-2 bg-accent hover:bg-accent/90"
            >
              <RotateCcw className="w-4 h-4" />
              إعادة المحاولة
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/assignments')}
            >
              العودة إلى القائمة
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  // Check if we have the necessary data to display results
  const hasResultsData = (locationState.answers && locationState.questions) || 
                        (Object.keys(answers).length > 0 && questions.length > 0) ||
                        (resultData && currentQuestions.length > 0);

  if (!hasResultsData) {
    return (
      <AppShell>
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">لا توجد نتائج متاحة</p>
          <Button onClick={() => navigate('/assignments')}>العودة للواجبات</Button>
        </div>
      </AppShell>
    );
  }

  const percentage = Math.round((currentScore / currentTotalMarks) * 100);
  const correctCount = currentQuestions.filter(
    (q: any) => currentAnswers[q._id || q.id] === q.correct
  ).length;

  // Determine if user passed (50% or higher)
  const hasPassed = isPassed !== null ? isPassed : percentage >= 50;

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Score Header */}
        <div className="bg-gradient-to-l from-accent/10 to-background border border-border rounded-2xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent/20 mb-4">
            <Award className="w-10 h-10 text-accent" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">نتيجة الواجب</h1>
          <div className="text-5xl font-bold text-accent mb-2">
            {currentScore} / {currentTotalMarks}
          </div>
          <p className={`text-xl ${hasPassed ? 'text-success' : 'text-destructive'}`}>
            نسبة النجاح: {percentage}% {hasPassed ? '(ناجح)' : '(راسب)'}
          </p>
          <div className="flex items-center justify-center gap-6 mt-6 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success" />
              <span>إجابات صحيحة: {correctCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-destructive" />
              <span>إجابات خاطئة: {currentQuestions.length - correctCount}</span>
            </div>
          </div>
          {!hasPassed && (
            <p className="text-destructive mt-4">
              يجب الحصول على 50% أو أكثر لفتح الدروس التالية
            </p>
          )}
        </div>

        {/* Questions Review */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">مراجعة الواجب</h2>
          
          {currentQuestions.map((question: any, index: number) => {
            const userAnswer = currentAnswers[question._id || question.id];
            const isCorrect = userAnswer === question.correct;
            const userOption = question.options.find((o: any) => o.id === userAnswer);
            const correctOption = question.options.find((o: any) => o.id === question.correct);

            return (
              <article
                key={question._id || question.id}
                className="bg-card border border-border rounded-xl p-6 space-y-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    {question.type === 'image' ? (
                      <img
                        src={question.content}
                        alt="صورة السؤال"
                        className="max-w-full h-auto rounded-md mb-3"
                        style={{ maxHeight: '300px' }}
                      />
                    ) : (
                      <h3 className="text-lg font-semibold text-foreground mb-3">
                        {question.content}
                      </h3>
                    )}

                    {/* User Answer */}
                    {userAnswer && (
                      <div className={`p-3 rounded-lg mb-2 ${
                        isCorrect 
                          ? 'bg-success/10 border border-success/20' 
                          : 'bg-destructive/10 border border-destructive/20'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          {isCorrect ? (
                            <CheckCircle className="w-4 h-4 text-success" />
                          ) : (
                            <XCircle className="w-4 h-4 text-destructive" />
                          )}
                          <span className="font-medium text-sm">إجابتك:</span>
                        </div>
                        <p className={isCorrect ? 'text-success' : 'text-destructive'}>
                          {userOption?.text || 'لم يتم الإجابة'}
                        </p>
                      </div>
                    )}

                    {/* Correct Answer */}
                    {!isCorrect && (
                      <div className="p-3 rounded-lg bg-success/10 border border-success/20 mb-2">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle className="w-4 h-4 text-success" />
                          <span className="font-medium text-sm">الإجابة الصحيحة:</span>
                        </div>
                        <p className="text-success">{correctOption?.text}</p>
                      </div>
                    )}

                    {/* Explanation */}
                    {question.explanation && (
                      <div className="p-3 rounded-lg bg-muted border border-border">
                        <p className="font-medium text-sm mb-1">الشرح:</p>
                        <p className="text-sm text-muted-foreground">{question.explanation}</p>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center pb-8">
          <Button variant="outline" onClick={() => navigate('/assignments')}>
            العودة للواجبات
          </Button>
          <Button onClick={() => navigate('/assignments')}>
            العودة للواجبات
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
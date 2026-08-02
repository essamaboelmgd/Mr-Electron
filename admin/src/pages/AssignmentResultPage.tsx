import { useLocation, useNavigate, useParams } from '@/lib/router';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Award } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getAssignmentById, getAssignmentQuestions } from '@/services/assignmentsService';

export default function AssignmentResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { answers, score, totalMarks, isAssignmentMode } = location.state || {};
  const [loading, setLoading] = useState(false);
  const [assignmentData, setAssignmentData] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      loadAssignmentData();
    }
  }, [id]);

  const loadAssignmentData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      // Load assignment details
      const assignment = await getAssignmentById(id);
      setAssignmentData(assignment);
      
      // Load questions
      const assignmentQuestions = await getAssignmentQuestions(id);
      setQuestions(assignmentQuestions);
    } catch (error) {
      console.error('Error loading assignment data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!answers || !questions || questions.length === 0) {
    return (
      <AppShell>
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">لا توجد نتائج متاحة</p>
          <Button onClick={() => navigate('/assignments/grades')}>
            العودة إلى درجات الواجبات
          </Button>
        </div>
      </AppShell>
    );
  }

  const percentage = Math.round((score / totalMarks) * 100);
  const correctCount = questions.filter(
    (q: any) => answers[q._id || q.id] === q.correct
  ).length;

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Score Header */}
        <div className="bg-gradient-to-l from-accent/10 to-background border border-border rounded-2xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent/20 mb-4">
            <Award className="w-10 h-10 text-accent" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            نتيجة الواجب
          </h1>
          <div className="text-5xl font-bold text-accent mb-2">
            {score} / {totalMarks}
          </div>
          <p className="text-xl text-muted-foreground">
            نسبة النجاح: {percentage}%
          </p>
          <div className="flex items-center justify-center gap-6 mt-6 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success" />
              <span>إجابات صحيحة: {correctCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-destructive" />
              <span>إجابات خاطئة: {questions.length - correctCount}</span>
            </div>
          </div>
        </div>

        {/* Questions Review */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">
            مراجعة الإجابات
          </h2>
          
          {questions.map((question: any, index: number) => {
            const userAnswer = answers[question._id || question.id];
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
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
          >
            العودة
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

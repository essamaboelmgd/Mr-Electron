import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { ClipboardList, Clock, UserCheck, CheckCircle, XCircle, RotateCcw, Eye } from 'lucide-react';
import { getAssignments, getAssignmentResults } from '@/services/assignmentsService';
import { getCourseById } from '@/services/coursesService';
import { type Assignment, type AssignmentResult } from '@/services/assignmentsService';
import { type Course } from '@/services/coursesService';

export default function AssignmentsPage() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignmentResults, setAssignmentResults] = useState<Record<string, AssignmentResult>>({});
  const [courses, setCourses] = useState<Record<string, Course>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      const assignmentsData = await getAssignments();
      setAssignments(assignmentsData);
      
      // Load course data for course assignments
      const courseData: Record<string, Course> = {};
      for (const assignment of assignmentsData) {
        if (assignment.courseId && assignment.type === 'course') {
          try {
            // Only fetch if we haven't already fetched this course
            if (!courseData[assignment.courseId]) {
              const course = await getCourseById(assignment.courseId);
              courseData[assignment.courseId] = course;
            }
          } catch (error) {
            console.error(`Error loading course ${assignment.courseId}:`, error);
          }
        }
      }
      setCourses(courseData);
      
      // Load assignment results for all assignments
      const results: Record<string, AssignmentResult> = {};
      for (const assignment of assignmentsData) {
        try {
          const result = await getAssignmentResults(assignment._id);
          results[assignment._id] = result;
        } catch (error) {
          // If there's no result, that's fine - the assignment hasn't been taken yet
          console.log(`No results for assignment ${assignment._id}`);
        }
      }
      setAssignmentResults(results);
    } catch (error) {
      console.error('Failed to load assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCourseName = (courseId: string | null) => {
    if (!courseId) return 'واجب عام';
    // Check if we have the course data
    if (courses[courseId]) {
      return courses[courseId].title;
    }
    // In a real implementation, you would fetch the course name from the API
    return 'كورس غير معروف';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (minutes: number) => {
    // If time is 0, show "بدون وقت محدد"
    if (minutes === 0) {
      return 'بدون وقت محدد';
    }
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours} ساعة ${mins > 0 ? `و${mins} دقيقة` : ''}`;
    }
    return `${minutes} دقيقة`;
  };

  const getScoreColorClass = (percentage: number) => {
    if (percentage >= 85) return 'bg-success/20 text-success border-success/30';
    if (percentage >= 70) return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
    if (percentage >= 50) return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
    return 'bg-destructive/20 text-destructive border-destructive/30';
  };

  const getAssignmentStatus = (assignment: Assignment) => {
    const result = assignmentResults[assignment._id];
    
    // If no result, assignment hasn't been taken
    if (!result) {
      return {
        status: 'not-taken',
        label: 'دخول الواجب',
        icon: <ClipboardList className="w-4 h-4" />,
        action: 'take'
      };
    }
    
    // If result exists, assignment has been taken
    const { submission, percentage, isPassed } = result;
    
    if (isPassed) {
      // Passed - show review button
      return {
        status: 'passed',
        label: 'مراجعة الواجب',
        score: `${submission.score}/${submission.totalMarks}`,
        percentage: `${percentage.toFixed(1)}%`,
        icon: <Eye className="w-4 h-4" />,
        action: 'review'
      };
    } else {
      // Failed - show retake button
      return {
        status: 'failed',
        label: 'إعادة الواجب',
        score: `${submission.score}/${submission.totalMarks}`,
        percentage: `${percentage.toFixed(1)}%`,
        icon: <RotateCcw className="w-4 h-4" />,
        action: 'retake'
      };
    }
  };

  const handleAssignmentAction = (assignment: Assignment) => {
    const status = getAssignmentStatus(assignment);
    
    switch (status.action) {
      case 'take':
        // Navigate to take assignment
        navigate(`/assignments/${assignment._id}/take`);
        break;
      case 'review':
        // Navigate to review assignment
        navigate(`/assignments/${assignment._id}/result`);
        break;
      case 'retake':
        // Navigate to retake assignment
        navigate(`/assignments/${assignment._id}/take`);
        break;
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">جاري التحميل...</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">الواجبات</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <ClipboardList className="w-5 h-5" />
            <span>{assignments.length} واجب</span>
          </div>
        </div>

        {assignments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            لا توجد واجبات متاحة
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignments.map(assignment => {
              const status = getAssignmentStatus(assignment);
              
              return (
                <article
                  key={assignment._id}
                  className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 flex flex-col h-full"
                >
                  {/* Header with color coding based on assignment type */}
                  <div className={`h-1.5 ${assignment.type === 'course' ? 'bg-gradient-to-r from-accent/80 to-accent/60' : 'bg-gradient-to-r from-purple-500/80 to-purple-500/60'}`}></div>
                  
                  <div className="p-5 flex flex-col flex-grow">
                    {/* Header with icon and title */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`p-2.5 rounded-lg flex-shrink-0 ${
                        assignment.type === 'course' ? 'bg-accent/10' : 'bg-purple-500/10'
                      }`}>
                        <ClipboardList className={`w-5 h-5 ${assignment.type === 'course' ? 'text-accent' : 'text-purple-500'}`} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-foreground line-clamp-2 leading-tight">
                          {assignment.title}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                            assignment.type === 'course' ? 'bg-accent' : 'bg-purple-500'
                          }`}></span>
                          <p className="text-xs text-muted-foreground">
                            {assignment.type === 'course' ? getCourseName(assignment.courseId) : 'واجب عام'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Assignment details */}
                    <div className="space-y-2.5 flex-grow">
                      <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                        <Clock className="w-4 h-4 flex-shrink-0 text-accent" />
                        <span>{formatTime(assignment.timeLimitMin)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                        <ClipboardList className="w-4 h-4 flex-shrink-0 text-accent" />
                        <span>الدرجة: {assignment.totalMarks}</span>
                      </div>
                      
                      <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                        <Clock className="w-4 h-4 flex-shrink-0 text-accent" />
                        <span>{formatDate(assignment.date)}</span>
                      </div>
                      
                      {assignment.mandatoryAttendance && (
                        <div className="flex items-center gap-2.5 text-xs text-accent">
                          <UserCheck className="w-4 h-4 flex-shrink-0" />
                          <span>حضور إجباري</span>
                        </div>
                      )}
                      
                      {/* Show score if assignment has been taken */}
                      {status.status !== 'not-taken' && (
                        <div className="flex items-center gap-2 pt-2.5 mt-2.5 border-t border-border">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full border ${getScoreColorClass(parseFloat(status.percentage))}`}>
                            {status.icon}
                            {status.percentage}
                          </span>
                          <span className="text-xs font-medium text-foreground">
                            {status.score}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Status and action button */}
                    <div className="flex items-center justify-between pt-3.5 mt-3.5 border-t border-border">
                      <div className="flex items-center gap-1.5">
                        {status.status === 'not-taken' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-50 text-yellow-700 text-xs rounded-full border border-yellow-200">
                            <XCircle className="w-3 h-3" />
                            لم يتم الحل
                          </span>
                        ) : status.status === 'passed' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-success/10 text-success text-xs rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            نجح
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-destructive/10 text-destructive text-xs rounded-full">
                            <XCircle className="w-3 h-3" />
                            لم ينجح
                          </span>
                        )}
                      </div>
                      
                      <Button 
                        size="sm"
                        className="rounded-md text-xs font-medium px-3 py-1.5 h-auto"
                        onClick={() => handleAssignmentAction(assignment)}
                      >
                        {status.label}
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
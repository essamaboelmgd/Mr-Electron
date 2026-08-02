import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from '@/lib/router';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CoursesPage from './pages/CoursesPage';
import CourseDetailPage from './pages/CourseDetailPage';
import ExamsPage from './pages/ExamsPage';
import ExamPlayerPage from './pages/ExamPlayerPage';
import ExamResultPage from './pages/ExamResultPage';
import ExamReviewPage from './pages/ExamReviewPage';
import SettingsPage from './pages/SettingsPage';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } }
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/courses" element={<ProtectedRoute><CoursesPage /></ProtectedRoute>} />
            <Route path="/courses/:id" element={<ProtectedRoute><CourseDetailPage /></ProtectedRoute>} />
            <Route path="/exams" element={<ProtectedRoute><ExamsPage /></ProtectedRoute>} />
            <Route path="/exams/general" element={<ProtectedRoute><ExamsPage /></ProtectedRoute>} />
            <Route path="/exams/course" element={<ProtectedRoute><ExamsPage /></ProtectedRoute>} />
            <Route path="/exams/:id/take" element={<ProtectedRoute><ExamPlayerPage /></ProtectedRoute>} />
            <Route path="/exams/:id/result" element={<ProtectedRoute><ExamResultPage /></ProtectedRoute>} />
            <Route path="/exams/:id/review" element={<ProtectedRoute><ExamReviewPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

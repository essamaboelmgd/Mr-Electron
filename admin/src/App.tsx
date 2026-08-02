import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ManageCoursesPage from './pages/ManageCoursesPage';
import AdminCourseDetailPage from './pages/AdminCourseDetailPage';
import ManageExamsPage from './pages/ManageExamsPage';
import AdminExamDetailPage from './pages/AdminExamDetailPage';
import ExamResultsPage from './pages/ExamResultsPage';
import StudentsAccessPage from './pages/StudentsAccessPage';
import SettingsPage from './pages/SettingsPage';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } } });

export default function App() {
  return <QueryClientProvider client={queryClient}><AuthProvider><TooltipProvider><Toaster /><Sonner /><BrowserRouter><Routes><Route path="/" element={<Navigate to="/dashboard" replace />} /><Route path="/login" element={<Login />} /><Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} /><Route path="/curriculum" element={<ProtectedRoute><ManageCoursesPage /></ProtectedRoute>} /><Route path="/admin/courses/:id" element={<ProtectedRoute><AdminCourseDetailPage /></ProtectedRoute>} /><Route path="/exams/manage" element={<ProtectedRoute><ManageExamsPage /></ProtectedRoute>} /><Route path="/admin/exams/:id" element={<ProtectedRoute><AdminExamDetailPage /></ProtectedRoute>} /><Route path="/admin/exams/:id/results" element={<ProtectedRoute><ExamResultsPage /></ProtectedRoute>} /><Route path="/students" element={<ProtectedRoute><StudentsAccessPage /></ProtectedRoute>} /><Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} /><Route path="*" element={<NotFound />} /></Routes></BrowserRouter></TooltipProvider></AuthProvider></QueryClientProvider>;
}

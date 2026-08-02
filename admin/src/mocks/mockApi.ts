// Mock API Layer - Simulates API calls with latency
// Replace these with real API calls to your backend

import usersData from './users.json';
import coursesData from './courses.json';
import subscriptionsData from './subscriptions.json';
import examsData from './exams.json';
import assignmentsData from './assignments.json';
import questionsData from './questions.json';
import notificationsData from './notifications.json';

// Simulate network latency
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Types
export interface User {
  id: string;
  name: string;
  gender: 'male' | 'female';
  phone: string;
  guardianPhone: string;
  year: string;
  password?: string;
}

export interface Course {
  id: string;
  title: string;
  year: string;
  shortDescription: string;
  fullDescription: string;
  price: number;
  image: string;
  vodafoneNumber: string;
  month: number;
}

export interface Subscription {
  id: string;
  userId: string;
  courseId: string;
  status: 'active' | 'pending' | 'rejected';
  subscribedAt: string;
  paymentMethod: 'center' | 'vodafone' | 'code';
  vodafoneReceipt?: string;
}

export interface Exam {
  id: string;
  courseId: string | null;
  lessonId: string | null;
  title: string;
  date: string;
  timeLimitMin: number;
  totalMarks: number;
  type: 'course' | 'general';
}

export interface Assignment {
  id: string;
  courseId: string | null;
  lessonId: string | null;
  title: string;
  date: string;
  timeLimitMin: number;
  totalMarks: number;
  type: 'course' | 'general';
}

export interface Question {
  id: string;
  examId: string;
  type: 'text' | 'image';
  content: string;
  options: { id: string; text: string }[];
  correct: string;
  explanation?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'subscription' | 'exam' | 'assignment' | 'general';
}

// Local storage helpers
const getFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

// Initialize storage with mock data
const initStorage = () => {
  if (!localStorage.getItem('electron_users')) {
    saveToStorage('electron_users', usersData);
  }
  if (!localStorage.getItem('electron_courses')) {
    saveToStorage('electron_courses', coursesData);
  }
  if (!localStorage.getItem('electron_subscriptions')) {
    saveToStorage('electron_subscriptions', subscriptionsData);
  }
  if (!localStorage.getItem('electron_exams')) {
    saveToStorage('electron_exams', examsData);
  }
  // Always initialize assignments to ensure they're loaded
  saveToStorage('electron_assignments', assignmentsData);
  if (!localStorage.getItem('electron_questions')) {
    saveToStorage('electron_questions', questionsData);
  }
  if (!localStorage.getItem('electron_notifications')) {
    saveToStorage('electron_notifications', notificationsData);
  }
};

// Function to reset storage (for testing purposes)
export const resetStorage = () => {
  saveToStorage('electron_users', usersData);
  saveToStorage('electron_courses', coursesData);
  saveToStorage('electron_subscriptions', subscriptionsData);
  saveToStorage('electron_exams', examsData);
  saveToStorage('electron_assignments', assignmentsData);
  saveToStorage('electron_questions', questionsData);
  saveToStorage('electron_notifications', notificationsData);
};

// Always initialize assignments to ensure they're loaded
saveToStorage('electron_assignments', assignmentsData);
initStorage();

// Auth API
export const mockApi = {
  resetStorage, // Add resetStorage to the export
  auth: {
    login: async (phone: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
      await delay(500);
      const users: User[] = getFromStorage('electron_users', []);
      const user = users.find(u => u.phone === phone && u.password === password);

      if (user) {
        const { password: _, ...userWithoutPassword } = user;
        saveToStorage('electron_currentUser', userWithoutPassword);
        return { success: true, user: userWithoutPassword };
      }
      return { success: false, error: 'رقم الموبايل أو كلمة المرور غير صحيحة' };
    },

    register: async (userData: Omit<User, 'id'>): Promise<{ success: boolean; user?: User; error?: string }> => {
      await delay(600);
      const users: User[] = getFromStorage('electron_users', []);

      if (users.some(u => u.phone === userData.phone)) {
        return { success: false, error: 'رقم الموبايل مسجل بالفعل' };
      }

      const newUser: User = { ...userData, id: `u${Date.now()}` };
      users.push(newUser);
      saveToStorage('electron_users', users);

      const { password: _, ...userWithoutPassword } = newUser;
      saveToStorage('electron_currentUser', userWithoutPassword);
      return { success: true, user: userWithoutPassword };
    },

    getCurrentUser: (): User | null => {
      return getFromStorage('electron_currentUser', null);
    },

    logout: () => {
      localStorage.removeItem('electron_currentUser');
    },
  },

  courses: {
    getAll: async (): Promise<Course[]> => {
      await delay(400);
      return getFromStorage('electron_courses', []);
    },

    getById: async (id: string): Promise<Course | null> => {
      await delay(300);
      const courses: Course[] = getFromStorage('electron_courses', []);
      return courses.find(c => c.id === id) || null;
    },
  },

  subscriptions: {
    getByUserId: async (userId: string): Promise<Subscription[]> => {
      await delay(400);
      const subscriptions: Subscription[] = getFromStorage('electron_subscriptions', []);
      return subscriptions.filter(s => s.userId === userId);
    },

    create: async (subscription: Omit<Subscription, 'id'>): Promise<Subscription> => {
      await delay(600);
      const subscriptions: Subscription[] = getFromStorage('electron_subscriptions', []);
      const newSub: Subscription = { ...subscription, id: `s${Date.now()}` };
      subscriptions.push(newSub);
      saveToStorage('electron_subscriptions', subscriptions);
      return newSub;
    },
  },

  exams: {
    getAll: async (): Promise<Exam[]> => {
      await delay(400);
      return getFromStorage('electron_exams', []);
    },

    getQuestions: async (examId: string): Promise<Question[]> => {
      await delay(500);
      const questions: Question[] = getFromStorage('electron_questions', []);
      return questions.filter(q => q.examId === examId);
    },
  },

  assignments: {
    getAll: async (): Promise<Assignment[]> => {
      await delay(400);
      return getFromStorage('electron_assignments', []);
    },

    getQuestions: async (assignmentId: string): Promise<Question[]> => {
      await delay(500);
      const questions: Question[] = getFromStorage('electron_questions', []);
      // For now, we'll use the same questions as exams but this could be different in the future
      return questions.filter(q => q.examId === assignmentId);
    },
  },

  notifications: {
    getByUserId: async (userId: string): Promise<Notification[]> => {
      await delay(300);
      const notifications: Notification[] = getFromStorage('electron_notifications', []);
      return notifications.filter(n => n.userId === userId).sort((a, b) =>
        new Date(b.time).getTime() - new Date(a.time).getTime()
      );
    },

    markAsRead: async (notificationId: string): Promise<void> => {
      await delay(200);
      const notifications: Notification[] = getFromStorage('electron_notifications', []);
      const notification = notifications.find(n => n.id === notificationId);
      if (notification) {
        notification.read = true;
        saveToStorage('electron_notifications', notifications);
      }
    },
  },
};

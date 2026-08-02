# electron - Student Web Platform

A modern Arabic (RTL) student web platform for math teacher Mohamed El-Hawary built with React, TypeScript, Tailwind CSS, and Vite.

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

The app will be available at `http://localhost:8080`

### Default Login Credentials

For testing, use these credentials:
- **Phone**: 01012345678
- **Password**: 12345678

## 📁 Project Structure

```
src/
├── components/           # Reusable components
│   ├── Avatar.tsx       # Static SVG avatars (male/female)
│   ├── Header.tsx       # Top navigation with notifications
│   ├── Sidebar.tsx      # Right-side navigation menu (RTL)
│   ├── AppShell.tsx     # Main layout wrapper
│   └── CourseCard.tsx   # Course display card
├── pages/               # Main application pages
│   ├── Login.tsx        # Authentication - Login
│   ├── Register.tsx     # Authentication - Registration
│   ├── Dashboard.tsx    # Main dashboard with stats
│   ├── CoursesPage.tsx  # Course browsing and subscription
│   ├── ExamsPage.tsx    # Exams listing and access
│   └── SettingsPage.tsx # User profile settings
├── mocks/               # Mock data layer (REPLACE WITH REAL API)
│   ├── users.json       # User data
│   ├── courses.json     # Course catalog
│   ├── subscriptions.json
│   ├── exams.json
│   ├── questions.json
│   ├── notifications.json
│   └── mockApi.ts       # Client-side mock API layer
├── index.css            # Design system & Tailwind config
└── App.tsx              # Main routing
```

## 🎨 Design System

The app uses a neutral navy palette with semantic tokens defined in `src/index.css`:

### Colors
- **Primary**: Near-black navy (#0F1724) for text and key elements
- **Success**: Green (#16A34A) for positive actions
- **Danger**: Red (#DC2626) for errors
- **Accent**: Navy blue (#1E3A8A) for interactive elements
- **Muted**: Soft grays for backgrounds and borders

### Typography
- Font: Noto Kufi Arabic (loaded from Google Fonts)
- Arabic-first design with full RTL support

### Animations
- Smooth micro-transitions (150ms)
- Card hover elevations
- Modal transitions (200ms)

## 🔄 Replacing Mock Data with Real APIs

The current implementation uses a client-side mock layer (`src/mocks/mockApi.ts`) that stores data in `localStorage`. To connect to a real backend:

### 1. Authentication

Replace `mockApi.auth` methods in `src/mocks/mockApi.ts`:

```typescript
// Current (mock):
login: async (phone, password) => { /* localStorage logic */ }

// Replace with real API:
login: async (phone, password) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password })
  });
  return response.json();
}
```

### 2. Courses

Replace course fetching:

```typescript
// Current (mock):
getAll: async () => getFromStorage('electron_courses', [])

// Replace with:
getAll: async () => {
  const response = await fetch('/api/courses');
  return response.json();
}
```

### 3. Subscriptions

For the Vodafone Cash manual payment flow:

```typescript
create: async (subscription) => {
  const formData = new FormData();
  formData.append('courseId', subscription.courseId);
  formData.append('paymentMethod', subscription.paymentMethod);
  if (subscription.vodafoneReceipt) {
    formData.append('receipt', subscription.vodafoneReceipt);
  }
  
  const response = await fetch('/api/subscriptions', {
    method: 'POST',
    body: formData
  });
  return response.json();
}
```

### 4. Exams & Questions

Replace with paginated API calls:

```typescript
getQuestions: async (examId) => {
  const response = await fetch(`/api/exams/${examId}/questions`);
  return response.json();
}
```

### 5. File Uploads

For Vodafone Cash receipts, implement server-side file handling:

```typescript
// Client: Already implemented in CoursesPage.tsx
// Server: Accept multipart/form-data, validate file type/size, store securely
```

## 📱 Features Implemented

### ✅ Authentication
- Login with phone number and password
- Registration with full validation
- Client-side phone validation (11 digits)
- Password validation (min 8 characters)

### ✅ Dashboard
- Welcome banner with personalized greeting
- Statistics cards (subscriptions, exams, courses)
- Subscribed courses list with "Enter Course" action

### ✅ Courses
- Three categories: New, Subscribed, Free
- Search by course name
- Filter by month
- Subscription modal with three payment options:
  1. **Pay at Center**: Manual process, sends request
  2. **Vodafone Cash**: Upload receipt, pending verification
  3. **Activation Code**: Enter code for instant activation

### ✅ Exams
- List all exams (course-specific and general)
- Display exam metadata (duration, marks, date)
- Status indicators (completed/pending)

### ✅ Settings
- Profile editing (name, phone, guardian phone, year, gender)
- Password change
- Client-side validation with live error feedback

### ✅ Responsive Design
- Mobile: Sidebar collapses to bottom fixed menu
- Tablet: 2-column grid layouts
- Desktop: Full sidebar, 3-column course grid

### ✅ Accessibility
- Full keyboard navigation
- ARIA labels and roles
- Focus management for modals
- Screen reader friendly

## 🔒 Validation Rules

### Phone Numbers
- Exactly 11 digits
- Numeric only
- Validated on blur with inline error messages

### Passwords
- Minimum 8 characters
- Match confirmation on registration
- Old password verification on change

### File Uploads (Vodafone Cash)
- Accept: jpg, png, pdf
- Max size: 5MB
- Show preview for images
- Filename display for PDFs

## 🌐 RTL Support

The entire app is RTL (Right-to-Left) by default:
- `<html dir="rtl" lang="ar">` in index.html
- Tailwind configured for RTL
- Sidebar on the right
- Text alignment and padding reversed
- Icon directions adjusted

## 🛠️ Technologies

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Utility-first styling
- **React Router** - Client-side routing
- **Radix UI** - Accessible component primitives
- **Sonner** - Toast notifications

## 📦 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## 🚧 TODO: Features Not Implemented (Frontend Only)

The following features are **not implemented** as this is a frontend-only project:

- ❌ Real backend API integration
- ❌ Server-side payment processing
- ❌ Database persistence
- ❌ Email notifications
- ❌ File storage (images, PDFs)
- ❌ Exam timer backend logic
- ❌ Grading system
- ❌ Video player for lessons
- ❌ Notes (المذكرات) checkout flow
- ❌ Assignments (الواجبات) upload/grading

These are **UI mockups only** and need backend implementation.

## 🎯 Next Steps for Production

1. **Set up backend API** (Node.js, Python, etc.)
2. **Configure database** (PostgreSQL, MySQL, MongoDB)
3. **Implement authentication** (JWT, sessions, OAuth)
4. **Add file storage** (AWS S3, Cloudflare R2, local storage)
5. **Payment gateway integration** (Vodafone Cash API, Fawry, etc.)
6. **Email service** (SendGrid, AWS SES)
7. **Deploy backend** (Vercel, Railway, AWS, DigitalOcean)
8. **Deploy frontend** (Vercel, Netlify, Cloudflare Pages)
9. **Set up CI/CD** (GitHub Actions, GitLab CI)
10. **Add monitoring** (Sentry, LogRocket)

## 📄 License

This project is provided as-is for demonstration purposes.

## 🤝 Support

For questions or issues, contact Essam Abo Elmgd.

---

Built by Essam Abo Elmgd

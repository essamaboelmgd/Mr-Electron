# Genius - Student Web Platform (Arabic / RTL)

An Arabic-first educational platform for math teacher Mohamed El-Hawary built with React, TypeScript, and Tailwind CSS.

**URL**: https://genius-platform.com

## Quick Start

```sh
# Install dependencies
npm install

# Start development server
npm run dev
```

## Default Login
- Phone: 01012345678
- Password: 12345678

## Documentation

See [README_DEV.md](./README_DEV.md) for:
- Complete project structure
- Design system documentation
- API integration guide
- Features & validation rules
- Accessibility guidelines

## Tech Stack
- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router
- Radix UI Components

## Features
- ✅ Arabic RTL interface
- ✅ Authentication (Login/Register)
- ✅ Course browsing & subscription with payment flows
- ✅ Course detail pages with lessons/exams/assignments tabs
- ✅ Exam player with timer and instant results
- ✅ Assignments with file upload
- ✅ Notes/materials purchase with checkout
- ✅ User settings
- ✅ Responsive design
- ✅ Accessible (ARIA, keyboard navigation)

## New Routes (Fixed)
- `/courses/:id` - Course detail page
- `/exams/:id/take` - Exam player
- `/exams/:id/result` - Exam results
- `/assignments` - Assignments page
- `/notes` - Notes/materials page

See [FIXED-ISSUES.md](./FIXED-ISSUES.md) for complete list of bug fixes and new features.

---

Built by Essam Abo Elmgd

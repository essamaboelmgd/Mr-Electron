# Genius Educational Platform - Backend API

This is the backend API for the Genius educational platform, built with Node.js, Express, and MongoDB.

## Features Implemented

1. **User Management**
   - Student registration and authentication
   - Role-based access control (student, teacher, admin, assistant)
   - Profile management

2. **Course Management**
   - Course creation and management
   - Lesson organization with YouTube video links
   - Course subscriptions

3. **Assessment System**
   - Exams with text and image questions
   - Assignments (question/answer format)
   - Automatic grading
   - Submission tracking

4. **Media Handling**
   - YouTube video integration (no full video storage)
   - Image storage using Cloudinary
   - Secure file uploads

5. **Notifications**
   - Real-time notification system
   - Notification types (subscription, exam, assignment, general)

6. **Security**
   - JWT-based authentication
   - Password encryption with bcrypt
   - Helmet for security headers
   - CORS configuration

7. **Performance**
   - Database indexing for optimized queries
   - Pagination for large datasets
   - Request filtering

## Project Structure

```
src/
├── config/          # Configuration files (database, cloudinary)
├── controllers/     # Request handlers
├── middleware/      # Custom middleware (auth, error handling)
├── models/          # Mongoose models
├── routes/          # API routes
├── services/        # Business logic and external services
├── utils/           # Utility functions
└── validators/      # Input validation
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/genius_edu

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=7d

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# CORS Configuration
CLIENT_URL=http://localhost:8080
```

## Available Scripts

- `npm run dev` - Start development server with nodemon
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server

## Models

1. **User** - Student, teacher, admin, or assistant accounts
2. **Course** - Educational courses with metadata
3. **Lesson** - Course lessons with YouTube video links
4. **Exam** - Timed assessments with questions
5. **Assignment** - Homework assignments with questions
6. **Question** - Questions for exams/assignments (text or image)
7. **Submission** - Student answers and grades
8. **Notification** - User notifications
9. **Subscription** - Course enrollment records

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new student
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Courses
- `GET /api/courses` - List all courses
- `GET /api/courses/:id` - Get specific course
- `GET /api/courses/:id/lessons` - Get course lessons

### Exams
- `GET /api/exams` - List all exams
- `GET /api/exams/:id` - Get specific exam
- `GET /api/exams/:id/questions` - Get exam questions
- `POST /api/exams/:id/submissions` - Submit exam answers
- `GET /api/exams/:id/results` - Get exam results

### Assignments
- `GET /api/assignments` - List all assignments
- `GET /api/assignments/:id` - Get specific assignment
- `GET /api/assignments/:id/questions` - Get assignment questions
- `POST /api/assignments/:id/submissions` - Submit assignment answers
- `GET /api/assignments/:id/results` - Get assignment results

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read

## Security Features

- Passwords hashed with bcrypt
- JWT tokens for authentication
- Role-based access control
- Input validation and sanitization
- Rate limiting (to be implemented)
- Helmet for security headers
- CORS configuration

## Performance Optimizations

- Database indexes on frequently queried fields
- Pagination for large datasets
- Efficient query design
- Caching strategies (to be implemented)
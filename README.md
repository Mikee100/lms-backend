# LMS Backend Documentation

## Overview
This backend powers a multi-role Learning Management System (LMS) for students, tutors, and enterprise learning workflows.

The service is built with Express and MongoDB and exposes REST APIs for:

- Authentication (email/password and Google sign-in)
- Tutor and student registration
- Course creation and structured course editing
- Enrollment and payment processing with Stripe
- Learning progress tracking
- Notifications and messaging
- Gamification and leaderboards
- Social learning (study groups, mentorship, forums)
- Enterprise learning path and analytics features
- AI-assisted assignment generation from uploaded course materials

## Tech Stack
- Runtime: Node.js
- Web framework: Express 5
- Database: MongoDB with Mongoose
- Authentication: JWT + Google OAuth token verification
- File uploads: Multer with local disk storage
- Payments: Stripe Payment Intents + Stripe webhooks
- Utilities: CORS, dotenv, express-validator, bcrypt

## High-Level Architecture

### Entry Point
- Main server file: server.js
- Responsibilities:
	- Load environment variables
	- Configure CORS and JSON parsing
	- Serve static uploaded files from /uploads
	- Mount route modules under /api/*
	- Connect to MongoDB
	- Start HTTP server

### Main Layers
- Routes: HTTP endpoints grouped by domain
- Controllers: business flow handlers (used in selected route modules)
- Services: reusable domain logic (gamification, enterprise, recommendations, content management)
- Models: Mongoose schemas for core entities
- Middleware: authentication, validation, and shared guards
- Utils: shared helpers (error wrappers, auth utilities)

## Core Domain Areas

### 1) Identity and Access
- JWT token issuance for student/tutor users
- Google login and Google registration paths
- Token verification endpoint for frontend session restoration
- Role-aware login using role submitted at login time

### 2) Course Management
- Tutor course creation with thumbnail/material uploads
- Structured course editing with nested sections and lectures
- Tutor ownership checks before course updates
- Material file download endpoint for authorized tutor flows

### 3) Enrollment and Student Access
- Student enrollment creation
- Enrollment status lookup by course
- Enrollment-backed course participation behavior

### 4) Payments
- Stripe Payment Intent creation
- Enrollment payment status synchronization
- Webhook handling for successful and failed payment intents
- Tutor payment reporting endpoint

### 5) Progress and Gamification
- Lecture completion tracking per student/course
- Progress persistence and retrieval
- Points awarding and course-completion bonuses
- Leaderboards, achievements, ranks, streaks, and preferences

### 6) Social Learning
- Study groups
- Mentorship requests and mentorship tracking
- Discussion features

### 7) AI Assignment Generation
- Endpoint invokes Assignment.py via child_process
- Parses generated questions from Python output
- Stores generated assignment records in MongoDB

## Route Map (By Module)
Mounted in server.js under these base paths:

- /api/auth
	- login, token verification, google-login
- /api/students
	- registration, google registration, student course retrieval, profile-related operations
- /api/tutors
	- tutor registration, tutor dashboard, student lists for tutor, tutor admin status operations
- /api/courses
	- create/update/list tutor courses, structured updates, course material serving
- /api/enroll/students
	- create enrollment, enrollment status
- /api/schedule
	- scheduling operations
- /api/notifications
	- notification operations
- /api/messages
	- tutor/student messaging operations
- /api/progress
	- get progress, complete lecture
- /api/activity
	- activity feed operations
- /api/payments
	- create intent, webhook, tutor payment reporting, enrollment payment updates
- /api/gamification
	- profile, leaderboard, rank, achievements, streaks, preferences
- /api/recommendations
	- recommendation APIs
- /api/social
	- study groups, mentorship, social learning flows
- /api/enterprise
	- enterprise learning and analytics operations
- /api/content
	- content management operations
- /api/upload
	- upload endpoints

Additional endpoint mounted directly in server.js:

- POST /api/assignments/generate
- GET /api/assignments

## Data Model Coverage
The models folder includes entities for:

- Users and profiles: Student, Tutor, StudentProfile
- Learning content: Course, CourseVersion, CourseTemplate, ContentScheduler, Assignment
- Learning operations: Enrollment, Progress, ScheduledClass, Activity
- Collaboration: StudyGroup, Mentorship, DiscussionForum, Message, Notifications
- Gamification: StudentGamification, Achievement, Leaderboard
- Enterprise: Organization, EnterpriseAnalytics, LearningPath
- Payments and commerce: Payment
- Recommendations: Recommendation

## Authentication and Authorization

### Token Model
- JWT token generated after login/registration flows
- Token includes identity and role claims
- Frontend sends token as Authorization: Bearer <token>

### Middleware
- Middleware/authMiddleware.js: generic JWT verification for protected APIs
- Middleware/auth.js: tutor-specific guard for tutor-only route branches

## Environment Variables
Create a .env file in lms-backend with at least:

- MONGO_URI
- JWT_SECRET
- GOOGLE_CLIENT_ID
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- PORT (optional, defaults to 5000)
- NODE_ENV (optional)

Example:

PORT=5000
MONGO_URI=mongodb://localhost:27017/lms
JWT_SECRET=replace_with_secure_secret
GOOGLE_CLIENT_ID=your_google_oauth_client_id
STRIPE_SECRET_KEY=sk_test_or_live_key
STRIPE_WEBHOOK_SECRET=whsec_xxx
NODE_ENV=development

## Local Setup

### 1) Install dependencies
npm install

### 2) Add environment file
Create .env in lms-backend as shown above.

### 3) Start development server
npm run dev

### 4) Start production server
npm start

Server default URL:
- http://localhost:5000

## Seed Scripts
Available seed scripts in scripts folder include:

- seedAchievements.js
- seedEnterprise.js
- seedTemplates.js

Run by invoking Node with the script path, for example:

node scripts/seedAchievements.js

## File and Media Handling
- Uploaded files are stored on local disk in uploads/
- Static file serving enabled at /uploads
- Course materials and thumbnails use stored metadata in database records

## CORS Configuration
Allowed origins currently include localhost dev ports and deployed frontend domains.

If you change frontend deployment URL, update allowedOrigins in server.js.

## Operational Notes
- server.js currently mounts /api/auth routes twice (harmless but redundant)
- config/db.js exists but is empty; current DB connection is managed directly in server.js
- Login flow in authRoutes.js enforces role as tutor or student

## Troubleshooting

### MongoDB connection failure
- Verify MONGO_URI in .env
- Confirm MongoDB service is running and reachable

### Invalid token or 401 errors
- Ensure frontend sends Authorization header with Bearer token
- Confirm JWT_SECRET is consistent across token creation and verification

### Stripe webhook verification failure
- Validate STRIPE_WEBHOOK_SECRET and raw-body webhook setup

### CORS blocked request
- Add frontend origin to allowedOrigins in server.js

### Assignment generation fails
- Confirm Python is installed and available in PATH
- Confirm Assignment.py and target upload file path exist

## Suggested Future Improvements
- Move Google client ID in frontend to environment variable and align auth docs
- Consolidate duplicate route mounting and remove dead/legacy route modules
- Add OpenAPI/Swagger documentation
- Add centralized error middleware for uniform error envelopes
- Add automated integration tests for auth, payment, and enrollment critical paths


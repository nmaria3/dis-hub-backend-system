# 📚 Dis-Hub Backend System

A comprehensive backend API for **Dis-Hub** - a dissertation management system designed for university students and administrators to manage, share, and access academic dissertations.

---

## 🎯 Overview

Dis-Hub Backend is a RESTful API built with **Node.js** and **Express.js**, integrated with **Clerk** for authentication and **MySQL** for data persistence. It provides endpoints for user authentication, profile management, and dissertation cataloging.

---

## ✨ Features

### 🔐 Authentication & Authorization
- **Clerk Integration**: Secure authentication using Clerk
- **Role-Based Access Control**: Separate flows for Admin and Student users
- **Email Domain Validation**: Only `@stud.umu.ac.ug` emails allowed for students; specific admin email for administrators

### 👤 User Management
- **Sign Up**: New users are registered with automatic role detection
- **Sign In**: Existing users authenticated with role verification
- **Profile Completion**: Students must complete their profile with registration number, campus, course, and phone number
- **User Deletion**: Admin can delete users from Clerk

### 📊 Profile Data
- **Hierarchical Data Structure**: Campuses → Faculties → Courses
- **Dynamic Data Retrieval**: API returns structured university data

### 🗄️ Database
- **MySQL Database**: Persistent storage using Aiven MySQL
- **Tables**: Users, Campuses, Faculties, Courses, Dissertations, Bookmarks, Downloads

### 📝 Logging
- **Request Logging**: All API requests are logged with method, URL, status, duration, IP, and user status
- **Log Persistence**: Logs saved to `logs/logs.json`

---

## 🛠️ Technologies Used

| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime environment |
| **Express.js** | Web framework |
| **@clerk/express** | Authentication & user management |
| **MySQL2** | Database driver with promise support |
| **CORS** | Cross-origin resource sharing |
| **dotenv** | Environment variable management |
| **nodemon** | Development auto-reload |

---

## 📁 Project Structure

```
dis-hub-backend-system/
├── config/
│   └── db.js                      # MySQL connection pool
├── controllers/
│   ├── auth.controller.js         # Sign up, Sign in, Check profile
│   ├── completeprofile.controller.js  # Profile completion logic
│   └── getprofile.controller.js    # Fetch campuses, faculties, courses
├── middleware/
│   └── logger.middleware.js        # Request/response logging
├── routes/
│   └── auth.routes.js              # Authentication route definitions
├── utils/
│   └── logHelper.js                # Log file operations
├── logs/
│   └── logs.json                   # Application logs
├── tables.sql                      # Database schema
├── server.js                       # Main entry point
├── package.json                    # Dependencies
└── README.md                       # This file
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
AIVEN_SERVICE_URL=mysql://user:password@host:port/database
CLERK_SIGN_IN_URL=/sign-in
CLERK_FRONTEND_API=http://localhost:3000
```

### Required Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 5000) | No |
| `AIVEN_SERVICE_URL` | MySQL connection string | Yes |
| `CLERK_SIGN_IN_URL` | Clerk sign-in redirect URL | No |
| `CLERK_FRONTEND_API` | Frontend API URL for Clerk | No |

---

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dis-hub-backend-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Create .env file with required variables
   ```

4. **Set up the database**
   ```bash
   # Run tables.sql in your MySQL database (Aiven)
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

---

## 🌐 API Endpoints

### Base URL
```
http://localhost:5000
```

### Public Routes

#### Health Check
```
GET /
```
**Response:**
```json
"Server is running 🚀"
```

#### API Info
```
GET /api
```
**Response:**
```json
{
  "message": "Welcome to your backend API"
}
```

---

### Authentication Routes (`/auth`)

#### 1. Sign Up
```
POST /auth/sign-up
```
**Request Body:**
```json
{
  "clerkId": "user_123456",
  "email": "student@stud.umu.ac.ug"
}
```
**Response (201 - New User):**
```json
{
  "message": "Signup successful. Please complete your profile",
  "role": "student",
  "redirect": "/complete-profile"
}
```
**Response (200 - Existing User):**
```json
{
  "message": "Profile complete",
  "redirect": "/students/dashboard"
}
```
**Response (403 - Unauthorized Email):**
```json
{
  "message": "Unauthorized email"
}
```

---

#### 2. Sign In
```
POST /auth/sign-in
```
**Request Body:**
```json
{
  "clerkId": "user_123456",
  "email": "student@stud.umu.ac.ug"
}
```
**Response (200 - Success):**
```json
{
  "message": "Login successful",
  "role": "student",
  "profileCompleted": true,
  "redirect": "/students/dashboard"
}
```
**Response (200 - Profile Incomplete):**
```json
{
  "message": "Please complete your profile",
  "role": "student",
  "profileCompleted": false,
  "redirect": "/complete-profile"
}
```
**Response (404 - User Not Found):**
```json
{
  "message": "User not found. Please sign up first.",
  "redirect": "/auth/sign-up"
}
```

---

#### 3. Check Profile Status
```
POST /auth/check-profile
```
**Request Body:**
```json
{
  "clerkId": "user_123456"
}
```
**Response (200 - Complete):**
```json
{
  "message": "Profile complete",
  "complete": true,
  "redirect": "/student/dashboard"
}
```
**Response (200 - Incomplete):**
```json
{
  "message": "Profile incomplete",
  "complete": false,
  "redirect": "/complete-profile"
}
```

---

#### 4. Get Profile Data (Campuses, Faculties, Courses)
```
GET /auth/complete-profile-data
```
**Response (200):**
```json
{
  "message": "Profile data fetched successfully",
  "data": [
    {
      "id": 1,
      "name": "Main Campus",
      "faculties": [
        {
          "id": 1,
          "name": "Faculty of Science",
          "courses": [
            { "id": 1, "name": "Computer Science" },
            { "id": 2, "name": "Information Technology" }
          ]
        }
      ]
    }
  ]
}
```

---

#### 5. Complete Profile
```
POST /auth/complete-profile
```
**Request Body:**
```json
{
  "clerkId": "user_123456",
  "registration_number": "2021/BCS/001",
  "campus_id": 1,
  "course_id": 3,
  "phone_number": "+256700123456"
}
```
**Response (200):**
```json
{
  "message": "Profile completed successfully",
  "role": "student",
  "profileCompleted": true,
  "redirect": "/students/dashboard"
}
```
**Response (400 - Missing Fields):**
```json
{
  "message": "All fields are required"
}
```
**Response (403 - Admin):**
```json
{
  "message": "Admins do not complete profile"
}
```

---

### User Management

#### Delete User (Admin Only)
```
POST /delete-user
```
**Headers:**
```
Authorization: Bearer <clerk-session-token>
```
**Request Body:**
```json
{
  "userId": "user_123456"
}
```
**Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

## 🗄️ Database Schema

### Tables Overview

| Table | Description |
|-------|-------------|
| `users` | User accounts with Clerk ID, role, and profile info |
| `campuses` | University campuses |
| `faculties` | Academic faculties within campuses |
| `courses` | Academic programs within faculties |
| `dissertations` | Uploaded dissertation records |
| `bookmarks` | User dissertation bookmarks |
| `downloads` | User download history |

### Users Table Schema
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clerkid VARCHAR(255) UNIQUE,
    role VARCHAR(100),
    registration_number VARCHAR(255),
    campus_id INT,
    course_id INT,
    phone_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔐 Role-Based Access

### Admin
- **Email**: `maria.admin.umu@gmail.com`
- **Access**: `/admin/dashboard`
- **Capabilities**: User management, dissertation oversight

### Student
- **Email Domain**: `@stud.umu.ac.ug`
- **Access**: Must complete profile before accessing `/students/dashboard`
- **Required Fields**: Registration number, campus, course, phone number

---

## 📈 Logging

All HTTP requests are logged with:
- **Timestamp**: ISO 8601 format
- **Method**: GET, POST, PUT, DELETE
- **URL**: Request path
- **Status**: HTTP status code
- **Duration**: Request processing time (ms)
- **IP**: Client IP address
- **User Status**: Signed-in user ID or "GUEST"

**Log Location**: `logs/logs.json`

---

## 🧪 Testing

```bash
# Run development server with auto-reload
npm run dev

# Run production server
npm start

# Test health endpoint
curl http://localhost:5000/

# Test API endpoint
curl http://localhost:5000/api
```

---

## 👩‍💻 Author

**Nankinga Maria**  
Student | IT Developer  
Makerere University

---

## 📜 License

This project is open-source and available for learning purposes.

---

## 🔗 Related Projects

- **Frontend**: Dis-Hub Frontend System (React/Next.js with Clerk)
- **Database**: Aiven MySQL (Cloud-hosted)

---

## 📝 Notes

- CORS is configured to allow requests from `http://localhost:3000` only
- All database operations use connection pooling for performance
- Profile completion is mandatory for students before accessing the dashboard

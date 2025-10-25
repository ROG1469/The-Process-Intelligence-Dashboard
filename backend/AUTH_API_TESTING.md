# Authentication API Testing Guide

## 🚀 Stage 2.1.3 Complete - User Authentication Endpoints

### Base URL
```
http://localhost:5000/api/auth
```

---

## 📋 Endpoints

### 1. **POST /api/auth/signup** - Create New User

**Request:**
```json
POST http://localhost:5000/api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "session": {
    "access_token": "eyJhbGc...",
    "refresh_token": "...",
    "expires_at": 1234567890
  }
}
```

**Error Responses:**
- `400` - Missing fields or password too short
- `409` - Email already exists
- `500` - Server error

---

### 2. **POST /api/auth/login** - User Login

**Request:**
```json
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "session": {
    "access_token": "eyJhbGc...",
    "refresh_token": "...",
    "expires_at": 1234567890
  }
}
```

**Error Responses:**
- `400` - Missing email or password
- `401` - Invalid credentials
- `500` - Server error

---

### 3. **POST /api/auth/logout** - User Logout

**Request:**
```http
POST http://localhost:5000/api/auth/logout
Authorization: Bearer eyJhbGc...
Content-Type: application/json
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Error Responses:**
- `401` - No token provided
- `400` - Logout failed
- `500` - Server error

---

### 4. **GET /api/auth/user** - Get Current User (Bonus)

**Request:**
```http
GET http://localhost:5000/api/auth/user
Authorization: Bearer eyJhbGc...
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "name": "John Doe",
    "created_at": "2025-10-25T..."
  }
}
```

**Error Responses:**
- `401` - No token or invalid token
- `500` - Server error

---

## 🧪 Testing with Postman

### Step-by-Step Testing:

#### 1. Start the Backend Server
```bash
cd C:\coding\aiprocessbottleneckdetector1\backend
npm run dev
```

Server should start on `http://localhost:5000`

#### 2. Test Signup
- **Method:** POST
- **URL:** `http://localhost:5000/api/auth/signup`
- **Headers:** 
  - `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "email": "testuser@example.com",
  "password": "securepass123",
  "name": "Test User"
}
```
- **Expected:** 201 status, user object with session tokens

#### 3. Test Login
- **Method:** POST
- **URL:** `http://localhost:5000/api/auth/login`
- **Headers:** 
  - `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "email": "testuser@example.com",
  "password": "securepass123"
}
```
- **Expected:** 200 status, user object with session tokens
- **Save the `access_token` for next steps**

#### 4. Test Get User
- **Method:** GET
- **URL:** `http://localhost:5000/api/auth/user`
- **Headers:** 
  - `Authorization: Bearer YOUR_ACCESS_TOKEN_HERE`
- **Expected:** 200 status, user information

#### 5. Test Logout
- **Method:** POST
- **URL:** `http://localhost:5000/api/auth/logout`
- **Headers:** 
  - `Authorization: Bearer YOUR_ACCESS_TOKEN_HERE`
  - `Content-Type: application/json`
- **Expected:** 200 status, logout confirmation

---

## 🧪 Testing with cURL (Alternative)

### Signup:
```bash
curl -X POST http://localhost:5000/api/auth/signup ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"password\":\"pass123\",\"name\":\"Test User\"}"
```

### Login:
```bash
curl -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"password\":\"pass123\"}"
```

### Logout:
```bash
curl -X POST http://localhost:5000/api/auth/logout ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE" ^
  -H "Content-Type: application/json"
```

---

## ✅ Verification Checklist

- [ ] Server starts without errors
- [ ] POST /signup creates new user (check Supabase dashboard)
- [ ] POST /signup returns 409 for duplicate email
- [ ] POST /signup returns 400 for missing fields
- [ ] POST /login succeeds with correct credentials
- [ ] POST /login returns 401 for wrong password
- [ ] POST /logout requires Authorization header
- [ ] GET /user returns user info with valid token
- [ ] New users appear in Supabase Auth dashboard

---

## 🔍 Checking Supabase Dashboard

1. Go to your Supabase project dashboard
2. Click **Authentication** in the left sidebar
3. Click **Users** tab
4. You should see newly created users listed there
5. Each user will have:
   - Email
   - Created timestamp
   - User metadata (name)

---

## 🛠️ Error Handling

The API includes comprehensive error handling for:
- ✅ Missing required fields
- ✅ Password validation (min 6 characters)
- ✅ Duplicate email addresses
- ✅ Invalid login credentials
- ✅ Missing or invalid tokens
- ✅ Server errors with proper logging

---

## 📝 Notes

- All passwords must be at least 6 characters
- Access tokens expire after the time set in Supabase (default: 1 hour)
- Refresh tokens can be used to get new access tokens
- User metadata (like name) is stored in `user_metadata` field
- Sessions are managed by Supabase Auth

---

**Stage 2.1.3 Status:** ✅ COMPLETE

Next steps: Create database schema for warehouse process data (Stage 2.1.4)

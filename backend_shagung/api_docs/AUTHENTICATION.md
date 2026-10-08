# Authentication Documentation

> Complete guide to the authentication system in Shagung E-commerce API

---

## Table of Contents

1. [Overview](#overview)
2. [Registration Flow](#registration-flow)
3. [Email Verification](#email-verification)
4. [Login Flow](#login-flow)
5. [Password Reset Flow](#password-reset-flow)
6. [Token Management](#token-management)
7. [Role-Based Access Control](#role-based-access-control)
8. [Security Best Practices](#security-best-practices)

---

## Overview

The authentication system uses **JWT (JSON Web Tokens)** for stateless authentication. Tokens are issued upon successful login and must be included in the `Authorization` header for protected routes.

### Authentication Flow Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOWS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  REGISTRATION                    LOGIN                          │
│  ────────────                    ─────                          │
│  1. Submit credentials           1. Submit credentials          │
│  2. Validate input               2. Find user by email          │
│  3. Hash password                3. Compare password            │
│  4. Create user                  4. Generate JWT                │
│  5. Send verification email      5. Return token + user         │
│  6. Return success               6. Client stores token         │
│                                                                  │
│  PASSWORD RESET                  EMAIL VERIFICATION            │
│  ──────────────                  ──────────────────            │
│  1. Request reset (email)        1. Click email link            │
│  2. Generate OTP                 2. Verify token                │
│  3. Send OTP via email           3. Mark user verified          │
│  4. User enters OTP              4. Return success              │
│  5. Verify OTP                                                  │
│  6. Set new password                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Registration Flow

### Endpoint

```
POST /api/auth/register
Content-Type: application/json
```

### Request Body

```json
{
  "username": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

### Validation Rules

| Field | Rules |
|-------|-------|
| `username` | Required, min 2 characters |
| `email` | Required, valid email format, unique |
| `password` | Required, min 6 characters |

### Flow Diagram

```
Client                    Server                    Database                  Email
  │                         │                         │                         │
  │  POST /register         │                         │                         │
  │  {username,email,pass}  │                         │                         │
  │────────────────────────>│                         │                         │
  │                         │                         │                         │
  │                         │  Check email exists     │                         │
  │                         │────────────────────────>│                         │
  │                         │  Not found              │                         │
  │                         │<────────────────────────│                         │
  │                         │                         │                         │
  │                         │  Hash password          │                         │
  │                         │  (bcrypt, 10 rounds)    │                         │
  │                         │                         │                         │
  │                         │  Create user            │                         │
  │                         │────────────────────────>│                         │
  │                         │  User created (id=1)    │                         │
  │                         │<────────────────────────│                         │
  │                         │                         │                         │
  │                         │  Generate verify token  │                         │
  │                         │  Store in DB            │                         │
  │                         │────────────────────────>│                         │
  │                         │                         │                         │
  │                         │  Send verification      │                         │
  │                         │  email                  │                         │
  │                         │─────────────────────────────────────────────────>│
  │                         │                         │                         │
  │  { success: true,       │                         │                         │
  │    message: "Check      │                         │                         │
  │    email to verify" }   │                         │                         │
  │<────────────────────────│                         │                         │
```

### Response

```json
{
  "success": true,
  "message": "Registration successful. Please check your email to verify your account."
}
```

### Code Implementation

```javascript
// controller/auth.js - UserRegisterController

export const UserRegisterController = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // 1. Check if user exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create user
    const result = await pool.query(
      `INSERT INTO users (username, email, password, is_verified, role)
       VALUES ($1, $2, $3, false, 'customer')
       RETURNING id, username, email`,
      [username, email.toLowerCase(), hashedPassword]
    );

    const user = result.rows[0];

    // 4. Generate verification token
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(verifyToken, 10);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await pool.query(
      `INSERT INTO email_verifications (user_id, token_hash, expires_at, purpose)
       VALUES ($1, $2, $3, 'verify')`,
      [user.id, tokenHash, expiresAt]
    );

    // 5. Send verification email
    await sendVerificationEmail(user.email, verifyToken, user.id);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Check email to verify.'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
};
```

---

## Email Verification

### Endpoint

```
GET /api/auth/verify?token=xxx&user_id=1
```

### Flow

```
User clicks email link
        │
        ▼
┌───────────────────┐
│ GET /api/auth/    │
│ verify?token=xxx  │
│ &user_id=1        │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ Find verification │
│ record by user_id │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ Check if expired  │
│ (24 hour limit)   │
└────────┬──────────┘
         │
    ┌────┴────┐
    │         │
 Expired    Valid
    │         │
    ▼         ▼
 Error    bcrypt.compare(token, stored_hash)
Response       │
          ┌────┴────┐
          │         │
       Mismatch   Match
          │         │
          ▼         ▼
       Error    Update user.is_verified = true
      Response  Delete verification record
                     │
                     ▼
              Return success
```

### Response

```json
{
  "success": true,
  "message": "Email verified successfully. You can now login."
}
```

---

## Login Flow

### Endpoint

```
POST /api/auth/login
Content-Type: application/json
```

### Request Body

```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

### Flow Diagram

```
Client                    Server                    Database
  │                         │                         │
  │  POST /login            │                         │
  │  {email, password}      │                         │
  │────────────────────────>│                         │
  │                         │                         │
  │                         │  Find user by email     │
  │                         │────────────────────────>│
  │                         │  User data              │
  │                         │<────────────────────────│
  │                         │                         │
  │                         │  bcrypt.compare         │
  │                         │  (password, hash)       │
  │                         │                         │
  │                         │        ┌────────────────┤
  │                         │        │                │
  │                         │     Mismatch          Match
  │                         │        │                │
  │                         │        ▼                ▼
  │                         │   401 Error      Generate JWT
  │                         │                        │
  │                         │                        ▼
  │                         │                   Sign token
  │                         │                   {id, email,
  │                         │                    role, iat, exp}
  │                         │                        │
  │  { token, user }        │<───────────────────────┘
  │<────────────────────────│
  │                         │
  │  Store token locally    │
  │  (cookie/localStorage)  │
```

### Response

```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "John Doe",
    "email": "john@example.com",
    "role": "customer",
    "is_verified": true,
    "avatar_url": null
  }
}
```

### Code Implementation

```javascript
// controller/auth.js - UserLoginController

export const UserLoginController = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Find user
    const result = await pool.query(
      `SELECT id, username, email, password, role, is_verified, avatar_url
       FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = result.rows[0];

    // 2. Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // 3. Check if verified (optional)
    // if (!user.is_verified) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Please verify your email first'
    //   });
    // }

    // 4. Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 5. Return response (exclude password)
    delete user.password;

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
};
```

---

## Password Reset Flow

### Step 1: Request Reset

```
POST /api/auth/forget-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "If email exists, OTP has been sent"
}
```

### Step 2: Verify OTP

```
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully"
}
```

### Step 3: Reset Password

```
POST /api/auth/reset-password
Content-Type: application/json

{
  "email": "john@example.com",
  "otp": "123456",
  "newPassword": "newsecurepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

### Complete Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                    PASSWORD RESET FLOW                                │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  User                 Server                 DB              Email   │
│   │                     │                    │                 │     │
│   │  forget-password    │                    │                 │     │
│   │  {email}            │                    │                 │     │
│   │────────────────────>│                    │                 │     │
│   │                     │                    │                 │     │
│   │                     │  Find user         │                 │     │
│   │                     │───────────────────>│                 │     │
│   │                     │                    │                 │     │
│   │                     │  Generate 6-digit  │                 │     │
│   │                     │  OTP               │                 │     │
│   │                     │                    │                 │     │
│   │                     │  Store OTP hash    │                 │     │
│   │                     │  (15 min expiry)   │                 │     │
│   │                     │───────────────────>│                 │     │
│   │                     │                    │                 │     │
│   │                     │  Send OTP email    │                 │     │
│   │                     │────────────────────────────────────>│     │
│   │                     │                    │                 │     │
│   │  {success: true}    │                    │                 │     │
│   │<────────────────────│                    │                 │     │
│   │                     │                    │                 │     │
│   │                     │                    │    Email with   │     │
│   │<──────────────────────────────────────────────"Your OTP:   │     │
│   │                     │                    │     123456"     │     │
│   │                     │                    │                 │     │
│   │  verify-otp         │                    │                 │     │
│   │  {email, otp}       │                    │                 │     │
│   │────────────────────>│                    │                 │     │
│   │                     │                    │                 │     │
│   │                     │  Verify OTP        │                 │     │
│   │                     │───────────────────>│                 │     │
│   │                     │                    │                 │     │
│   │  {success: true}    │                    │                 │     │
│   │<────────────────────│                    │                 │     │
│   │                     │                    │                 │     │
│   │  reset-password     │                    │                 │     │
│   │  {email, otp,       │                    │                 │     │
│   │   newPassword}      │                    │                 │     │
│   │────────────────────>│                    │                 │     │
│   │                     │                    │                 │     │
│   │                     │  Verify OTP again  │                 │     │
│   │                     │  Hash new password │                 │     │
│   │                     │  Update user       │                 │     │
│   │                     │───────────────────>│                 │     │
│   │                     │                    │                 │     │
│   │                     │  Delete OTP record │                 │     │
│   │                     │───────────────────>│                 │     │
│   │                     │                    │                 │     │
│   │  {success: true,    │                    │                 │     │
│   │   message: "Reset   │                    │                 │     │
│   │   successful"}      │                    │                 │     │
│   │<────────────────────│                    │                 │     │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Token Management

### JWT Structure

```javascript
// Token Payload
{
  "id": 1,                      // User ID
  "email": "user@example.com",  // User email
  "role": "customer",           // User role
  "iat": 1703577600,            // Issued at (Unix timestamp)
  "exp": 1704182400             // Expires at (7 days from iat)
}

// Token Generation
const token = jwt.sign(
  { id, email, role },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);
```

### Using Token in Requests

```bash
# All protected endpoints require:
Authorization: Bearer <jwt_token>

# Example
curl -X GET http://localhost:5000/api/orders \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Token Validation Middleware

```javascript
// middleware/auth.js

export const RequireAuth = async (req, res, next) => {
  try {
    // 1. Extract token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const token = authHeader.split(' ')[1];

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Attach user to request
    req.user = decoded;

    // 4. Continue to route handler
    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};
```

---

## Role-Based Access Control

### User Roles

| Role | Access Level |
|------|--------------|
| `customer` | Default role for registered users |
| `admin` | Full access to admin endpoints |

### Middleware Implementation

```javascript
// middleware/auth.js

export const PermissionAdmin = async (req, res, next) => {
  // First verify the token
  await RequireAuth(req, res, async () => {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    next();
  });
};
```

### Route Protection Examples

```javascript
// routes/productRoutes.js

// Public - anyone can access
router.get('/products', getAllProducts);

// Authenticated - any logged-in user
router.post('/products/:id/review', RequireAuth, createReview);

// Admin only - requires admin role
router.post('/products', PermissionAdmin, createProduct);
router.put('/products/:id', PermissionAdmin, updateProduct);
router.delete('/products/:id', PermissionAdmin, deleteProduct);
```

---

## Security Best Practices

### 1. Password Hashing

```javascript
// Always use bcrypt with sufficient rounds
const SALT_ROUNDS = 10;

// Hashing (registration)
const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

// Verification (login)
const isValid = await bcrypt.compare(password, hashedPassword);
```

### 2. Secure Token Storage

```javascript
// Frontend - Store in httpOnly cookie (most secure)
// OR localStorage (less secure, but convenient)

// Cookie example (set by server or client)
document.cookie = `token=${token}; HttpOnly; Secure; SameSite=Strict`;

// localStorage example
cookieStorage.setItem('token', token);  // Custom secure storage
```

### 3. Token Expiration

```javascript
// Reasonable expiration times
const tokenConfig = {
  accessToken: '7d',    // 7 days for regular use
  refreshToken: '30d',  // 30 days (if implementing refresh)
  verifyToken: '24h',   // 24 hours for email verification
  resetToken: '15m'     // 15 minutes for password reset OTP
};
```

### 4. Rate Limiting on Auth Endpoints

```javascript
// Apply stricter limits to auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                     // 5 attempts
  message: 'Too many login attempts. Try again later.'
});

router.post('/login', authLimiter, loginController);
router.post('/forget-password', authLimiter, forgetPasswordController);
```

### 5. Input Sanitization

```javascript
// Always sanitize and validate input
const { email, password } = req.body;

// Email normalization
const normalizedEmail = email.toLowerCase().trim();

// Password requirements
if (password.length < 6) {
  return res.status(400).json({
    success: false,
    message: 'Password must be at least 6 characters'
  });
}
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Token expired | Re-login to get new token |
| Invalid token | Check token format, ensure Bearer prefix |
| 403 Forbidden | User doesn't have required role |
| Email not verified | Check spam folder, resend verification |
| OTP expired | Request new password reset |

---

## API Endpoints Summary

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/api/auth/register` | POST | No | User registration |
| `/api/auth/login` | POST | No | User login |
| `/api/auth/verify` | GET | No | Email verification |
| `/api/auth/forget-password` | POST | No | Request reset OTP |
| `/api/auth/verify-otp` | POST | No | Verify OTP |
| `/api/auth/reset-password` | POST | No | Reset password |
| `/api/auth/admin/create` | POST | Admin | Create admin user |
| `/api/auth/delete/user` | DELETE | Admin | Delete user |

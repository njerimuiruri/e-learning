# Google OAuth Setup Guide

This guide explains how to set up Google OAuth ("Continue with Google") functionality for both frontend and backend.

## Overview

The implementation allows users to:

- Sign in with Google on the login page
- Sign up with Google on the registration page
- Automatically create/link their account with their Google email

## Prerequisites

1. A Google Cloud Console project
2. Google OAuth 2.0 credentials (Web Application type)
3. Both frontend and backend properly configured

---

## Backend Setup (NestJS)

### 1. Verify Dependencies

The backend already has the required packages:

```bash
npm install google-auth-library
```

### 2. Environment Variables

Update your `.env` file with Google OAuth credentials:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here (optional for web-only flow)
```

### 3. Backend Implementation (Already Complete)

The backend has the following implementations:

**File:** `src/auth/auth.service.ts`

- `googleLogin()` method handles Google token verification
- Auto-creates user if email doesn't exist
- Auto-links existing users with their Google account
- Generates JWT token for authentication

**File:** `src/auth/auth.controller.ts`

- `POST /api/auth/google` endpoint
- Accepts `idToken` and `role` (student/instructor)

**File:** `src/schemas/user.schema.ts`

- `googleId` field stores Google user ID
- `provider` field indicates auth method

---

## Frontend Setup (Next.js)

### 1. Install Google Sign-In Library

This is already configured via script tag in the layout.

### 2. Environment Variables

Add to `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### 3. Frontend Implementation (Already Complete)

**File:** `src/app/layout.js`

- Added Google Sign-In script from CDN

**File:** `src/app/(auth)/login/page.jsx`

- "Continue with Google" button with Google SDK integration
- Calls `authService.googleLogin()` with idToken

**File:** `src/app/(auth)/register/page.jsx`

- Same Google OAuth integration for registration
- User can choose student/instructor role before Google login

**File:** `src/lib/api/authService.js`

- `googleLogin()` method sends idToken to backend

---

## How to Get Google OAuth Credentials

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a Project" → "New Project"
3. Enter project name: `E-Learning Platform`
4. Click "Create"

### Step 2: Enable Google+ API

1. In the search bar, search for "Google+ API"
2. Click on "Google+ API" from results
3. Click "Enable"

### Step 3: Create OAuth 2.0 Credentials

1. Go to "Credentials" in the left menu
2. Click "Create Credentials" → "OAuth client ID"
3. Choose "Web application"
4. Fill in the form:
   - **Name:** `E-Learning Platform Web Client`
   - **Authorized origins:**
     - `http://localhost:3000` (development)
     - `https://yourfrontenddomain.com` (production)
   - **Authorized redirect URIs:**
     - `http://localhost:3000` (development)
     - `https://yourfrontenddomain.com` (production)
5. Click "Create"
6. Copy the "Client ID" - this is your `GOOGLE_CLIENT_ID`

### Step 4: (Optional) Create Backend Credentials

If you want to verify tokens on the backend (additional security):

1. Create another OAuth 2.0 credential for "Web application"
2. Name it `E-Learning Backend`
3. Add your backend domain to authorized origins
4. Copy the "Client Secret" - this is your `GOOGLE_CLIENT_SECRET`

---

## Configuration Files

### Frontend (.env.local)

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
```

### Backend (.env)

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/elearning

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# Email
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_email
SMTP_PASS=your_password

# Google OAuth
GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_secret_here (optional)
```

---

## Testing the Integration

### Local Testing

1. **Start Backend:**

   ```bash
   cd elearning-backend
   npm run start:dev
   ```

2. **Start Frontend:**

   ```bash
   cd elearning
   npm run dev
   ```

3. **Test Login with Google:**

   - Navigate to `http://localhost:3000/login`
   - Click "Continue with Google"
   - Select your Google account
   - You should be redirected to the student dashboard

4. **Test Registration with Google:**
   - Navigate to `http://localhost:3000/register`
   - Select "Learn" (student) or "Teach" (instructor)
   - Click "Continue with Google"
   - You should be redirected based on your role

### Troubleshooting

**Issue:** "Google client ID not configured"

- **Solution:** Ensure `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set in `.env.local`

**Issue:** "Invalid Google token"

- **Solution:**
  - Verify the Client ID matches between frontend and backend
  - Check the token hasn't expired
  - Ensure `http://localhost:3000` is in authorized origins

**Issue:** "User already exists"

- **Solution:** The system auto-links Google accounts with existing emails

**Issue:** Google button not appearing

- **Solution:** Check browser console for errors; verify script loaded from CDN

---

## User Flow

### Login Flow

1. User clicks "Continue with Google"
2. Google Sign-In dialog opens
3. User selects their Google account
4. Frontend receives `idToken` from Google
5. Frontend sends `idToken` to backend: `POST /api/auth/google`
6. Backend verifies token with Google
7. Backend finds/creates user record
8. Backend returns JWT token
9. Frontend stores token and user data
10. User redirected to dashboard

### Registration Flow

Same as login, but:

- User selects student or instructor role first
- Instructor accounts start in pending status
- Student accounts get immediate access

---

## Security Considerations

✅ **Implemented:**

- Token verification with Google API
- JWT token generation for session management
- User data stored securely in MongoDB
- Email verification from Google
- Password field is optional for OAuth users

🔒 **Best Practices:**

- Never expose `GOOGLE_CLIENT_SECRET` in frontend
- Use HTTPS in production (not HTTP)
- Keep `JWT_SECRET` strong and private
- Regularly rotate credentials

---

## Deployment to Production

### Update Google Console

1. Add production domain to authorized origins
2. Update authorized redirect URIs with production URLs

### Environment Variables on Render/Hosting Platform

1. Add environment variables:

   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_ID` (backend)
   - `GOOGLE_CLIENT_SECRET` (backend)
   - Other required vars

2. Redeploy both frontend and backend

### SSL/TLS Certificate

Ensure your production domain has valid HTTPS certificate (required for OAuth).

---

## References

- [Google Cloud Console](https://console.cloud.google.com/)
- [Google Sign-In for Web Documentation](https://developers.google.com/identity/gsi/web)
- [OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [google-auth-library-nodejs](https://github.com/googleapis/google-auth-library-nodejs)

---

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review browser console for errors
3. Check backend logs for API errors
4. Verify all environment variables are set correctly

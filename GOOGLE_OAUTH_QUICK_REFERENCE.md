# Google OAuth Quick Reference

## Environment Setup

### Frontend (.env.local)

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

### Backend (.env)

```bash
GOOGLE_CLIENT_ID=your_google_client_id
```

## Google Cloud Console Setup

### Get Your Client ID

1. https://console.cloud.google.com/
2. Create Project → "E-Learning Platform"
3. APIs & Services → Enable "Google+ API"
4. Credentials → Create OAuth 2.0 Web Application
5. Add authorized origins: `http://localhost:3000`
6. Copy your Client ID

## Testing Commands

### Start Backend

```bash
cd elearning-backend
npm install
npm run start:dev
```

### Start Frontend

```bash
cd elearning
npm install
npm run dev
```

### Test URLs

- **Login:** http://localhost:3000/login
- **Register:** http://localhost:3000/register
- **Click:** "Continue with Google" button

## Files to Update

### .env.local (Create if missing)

```
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
```

### .env (Backend)

```
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
```

## Troubleshooting

| Issue                     | Solution                                         |
| ------------------------- | ------------------------------------------------ |
| Google button not showing | Check NEXT_PUBLIC_GOOGLE_CLIENT_ID is set        |
| "Invalid token" error     | Verify Client ID matches in frontend and backend |
| "User already exists"     | System auto-links Google with existing emails    |
| Script not loading        | Check browser console for CDN errors             |

## Implementation Files

### Frontend

- ✅ `src/app/layout.js` - Google Sign-In script
- ✅ `src/app/(auth)/login/page.jsx` - Google login
- ✅ `src/app/(auth)/register/page.jsx` - Google register
- ✅ `src/lib/api/authService.js` - googleLogin() method

### Backend (Already Done)

- ✅ `src/auth/auth.service.ts` - googleLogin() service
- ✅ `src/auth/auth.controller.ts` - /api/auth/google endpoint

## API Endpoint

### POST /api/auth/google

```json
{
  "idToken": "google_id_token_from_frontend",
  "role": "student" | "instructor"
}
```

Response:

```json
{
  "user": {
    "_id": "...",
    "email": "user@gmail.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "student",
    "profilePhotoUrl": "..."
  },
  "token": "jwt_token_here",
  "message": "Google login successful"
}
```

## Production Deployment

1. Update Google Console with production domain
2. Set environment variables on hosting platform (Render, Vercel, etc.)
3. Use HTTPS URLs only
4. Ensure SSL certificate is valid

## Useful Links

- [Google Cloud Console](https://console.cloud.google.com/)
- [Google Sign-In Documentation](https://developers.google.com/identity/gsi/web)
- [OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)

---

**Status:** ✅ Implementation Complete  
**Testing:** Ready for local testing  
**Production:** Ready for deployment

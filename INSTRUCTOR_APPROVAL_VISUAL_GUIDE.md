# Instructor Approval & Login Flow - Visual Guide

## Complete User Journey

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    INSTRUCTOR APPROVAL FLOW                             │
└─────────────────────────────────────────────────────────────────────────┘

STEP 1: INSTRUCTOR REGISTRATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    Instructor                          Frontend                    Backend
         │                                  │                           │
         │─── Opens /register ─────────────>│                           │
         │                                  │                           │
         │<─ Shows registration form ──────│                           │
         │                                  │                           │
         │─── Fills form & submits ───────>│─ POST /auth/register ───>│
         │                                  │     (instructor role)     │
         │                                  │<──── User created ────────│
         │                                  │  (status: pending)        │
         │<─ "Pending approval" message ───│<────────────────────────│
         │                                  │                           │
         └─────────────────────────────────────────────────────────────┘


STEP 2: ADMIN REVIEWS & APPROVES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    Admin                              Dashboard                   Backend
       │                                  │                           │
       │─── Logs in ───────────────────>│                           │
       │                                  │                           │
       │<─ Shows admin dashboard ──────│                           │
       │                                  │                           │
       │─── Navigates to Instructors ──>│                           │
       │                                  │                           │
       │<─ Lists pending instructors ──│                           │
       │                                  │                           │
       │─── Clicks "Approve" ──────────>│─ PUT /admin/approve ────>│
       │                                  │     (instructor_id)      │
       │                                  │<─── Status: approved ─────│
       │                                  │                           │
       │<─ Confirmation message ───────│<──────────────────────────│
       │                                  │                           │
       └─────────────────────────────────────────────────────────────┘


STEP 3: APPROVAL EMAIL SENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    Backend                         Email Service                Instructor
       │                                  │                           │
       │─ sendInstructorApprovalEmail ──>│                           │
       │    (instructor_email)            │                           │
       │                                  │─ Build email HTML ──────>│
       │                                  │  ┌──────────────────────┐ │
       │                                  │  │ Approval Email       │ │
       │                                  │  │                      │ │
       │                                  │  │ Dear John,           │ │
       │                                  │  │ Your application     │ │
       │                                  │  │ has been APPROVED!   │ │
       │                                  │  │                      │ │
       │                                  │  │ [Click here to login]│<─┐
       │                                  │  │  (green button)      │  │
       │                                  │  │                      │  │
       │                                  │  │ Login: john@ex.com   │  │
       │                                  │  │ Pass: (created one)  │  │
       │                                  │  │                      │  │
       │                                  │  │ You'll be taken to   │  │
       │                                  │  │ your dashboard!      │  │
       │                                  │  └──────────────────────┘  │
       │                                  │─ Send via SMTP ───────────>│
       │                                  │                           │ Clicks link
       │<──── Email sent ────────────────│                           │ (redirects to
       │                                  │                           │  /login page)
       └─────────────────────────────────────────────────────────────┘


STEP 4: INSTRUCTOR CLICKS LOGIN LINK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    Email                        Browser                       Frontend
       │                             │                              │
       │─ [Click here to login] ───>│                              │
       │                             │                              │
       │                             │─ Navigate to ───────────────>│
       │                             │ http://localhost:3000/login  │
       │                             │                              │
       │                             │<─ Login page rendered ──────│
       │                             │  ┌─────────────────────────┐│
       │                             │  │ Email: [input]          ││
       │                             │  │ Password: [input]       ││
       │                             │  │ [Sign In button]        ││
       │                             │  └─────────────────────────┘│
       │                             │                              │
       └─────────────────────────────────────────────────────────────┘


STEP 5: INSTRUCTOR LOGS IN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    Instructor                   Frontend                      Backend
         │                           │                            │
         │─ Enters email & password >│                            │
         │                           │                            │
         │─ Clicks Sign In ─────────>│─ POST /auth/login ───────>│
         │                           │  {email, password}        │
         │                           │<─ Login Response ──────────│
         │                           │  {                         │
         │                           │    user: {                 │
         │                           │      firstName: "John"     │
         │                           │      lastName: "Doe"       │
         │                           │      email: "john@ex.com"  │
         │                           │      role: "instructor"    │
         │                           │ ★★ instructorStatus:      │
         │                           │      "approved" ★★        │
         │                           │    },                      │
         │                           │    token: "eyJ..."        │
         │                           │  }                         │
         │                           │                            │
         │<── Token saved ──────────│                            │
         │<── User data saved ──────│                            │
         │                           │                            │
         │<── Success toast! ───────│                            │
         │                           │                            │
         │               [REDIRECT CHECK]                         │
         │               Check instructorStatus                   │
         │                                                         │
         │               if status === "approved" ✓              │
         │                   → Redirect to /instructor            │
         │                                                         │
         │               Wait 500ms... then redirect              │
         │                                                         │
         └─────────────────────────────────────────────────────────┘


STEP 6: INSTRUCTOR DASHBOARD ACCESSED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    Browser                    Frontend                      Backend
       │                           │                            │
       │ Navigate to               │                            │
       │ /instructor ─────────────>│                            │
       │                           │                            │
       │                           │─ Check localStorage        │
       │                           │  (has token?) ✓           │
       │                           │                            │
       │                           │─ ProtectedInstructorRoute  │
       │                           │  calls handleInstructorRedirect
       │                           │                            │
       │                           │─ GET /users/profile ──────>│
       │                           │     (with token)           │
       │                           │<─ instructorStatus: ────────│
       │                           │     "approved" ✓           │
       │                           │                            │
       │                           │ AUTHORIZED ✓               │
       │                           │                            │
       │<─ Dashboard renders ─────│                            │
       │   ┌──────────────────────────────────────────┐        │
       │   │  INSTRUCTOR DASHBOARD                    │        │
       │   │                                          │        │
       │   │  [Sidebar Menu]      [Main Content]      │        │
       │   │  ┌──────────────┐   ┌────────────────┐   │        │
       │   │  │ • Dashboard  │   │ Welcome, John! │   │        │
       │   │  │ • Courses    │   │                │   │        │
       │   │  │ • Students   │   │ Stats:         │   │        │
       │   │  │ • Messages   │   │ • Courses: 0   │   │        │
       │   │  │ • Profile    │   │ • Students: 0  │   │        │
       │   │  └──────────────┘   │ • Rating: 0.0  │   │        │
       │   │                     │                │   │        │
       │   │                     └────────────────┘   │        │
       │   │                                          │        │
       │   └──────────────────────────────────────────┘        │
       │                                                        │
       └────────────────────────────────────────────────────────┘
```

## Status-Based Redirection Flow

```
                          LOGIN
                            │
                ┌───────────┴────────────┐
                │                        │
         Check Response.user             │
         .instructorStatus               │
                │                        │
        ┌───────┼───────┐                │
        │       │       │                │
        │       │       │                │
    "approved" │   "rejected"            │
       │       │       │                │
       │   "pending"   │                │
       │       │       │                │
       ▼       ▼       ▼                │
    ┌─────┬──────┬──────┐               │
    │     │      │      │               │
    │     │      │      │               │
    │     │      │      │               │
    ▼     ▼      ▼      ▼               │
    /     /     /      ❌              │
 instr  instr  instr  Error             │
  uctor  uctor  uctor                   │
    │    pending application            │
 dashbd approval  rejected              │
    │     │        │                    │
    │     │        │                    │
    ✓     ⏳       ↻                     │
(access (see (show                     │
 allowed) msg) options)                │
```

## Database State Changes

```
Initial State (After Registration)
┌──────────────────────────────────┐
│ User Document                    │
│ ┌────────────────────────────────┤
│ │ name: "John Doe"               │
│ │ email: "john@example.com"      │
│ │ role: "instructor"             │
│ │ instructorStatus: "pending" ◄──┤─ Awaiting approval
│ │ isActive: true                 │
│ └────────────────────────────────┤
└──────────────────────────────────┘
            │
            │ Admin clicks APPROVE
            │
            ▼
After Admin Approval
┌──────────────────────────────────┐
│ User Document                    │
│ ┌────────────────────────────────┤
│ │ name: "John Doe"               │
│ │ email: "john@example.com"      │
│ │ role: "instructor"             │
│ │ instructorStatus: "approved" ◄─┤─ Can now access dashboard
│ │ isActive: true                 │
│ │ updatedAt: 2024-12-08...       │
│ └────────────────────────────────┤
└──────────────────────────────────┘
```

## Security Flow

```
                    REQUEST LOGIN
                         │
                         ▼
                  ┌──────────────┐
                  │ Authenticate │
                  │ Credentials  │
                  └──────────────┘
                         │
                    ✓ Valid
                         │
                         ▼
                  ┌──────────────┐
                  │ Generate JWT │
                  │ Token        │
                  └──────────────┘
                         │
                         ▼
                  ┌──────────────┐
                  │ Return User  │
                  │ + Status     │
                  │ + Token      │
                  └──────────────┘
                         │
                         ▼
                  Save Token in
                  localStorage
                         │
                         ▼
                  Save User data
                  (instructorStatus)
                         │
                         ▼
            Check instructorStatus
                         │
            ┌────────────┼────────────┐
            │            │            │
            ▼            ▼            ▼
          "approved"  "pending"   "rejected"
            │            │            │
    Redirect to    Redirect to   Redirect to
     /instructor   /pending      /rejected
            │            │            │
            ▼            ▼            ▼
    Protected     Polling page   Info page
    Route Guard   (auto-refresh) (can reapply)
```

## Key Components & Their Roles

```
┌─────────────────────────────────────────────────────────────────┐
│                     COMPONENT INTERACTION                        │
└─────────────────────────────────────────────────────────────────┘

1. LOGIN PAGE (Frontend)
   ├─ Validates email & password
   ├─ Sends credentials to backend
   ├─ Receives user data with instructorStatus
   └─ Redirects based on status ← KEY CHANGE

2. AUTH SERVICE (Backend)
   ├─ OLD: Blocked non-approved instructors ❌
   ├─ NEW: Allows all instructors to login ✓
   ├─ Returns full user object with:
   │  └─ instructorStatus: "pending|approved|rejected"
   └─ Generates JWT token

3. INSTRUCTOR LAYOUT (Frontend)
   ├─ Wraps all /instructor routes
   ├─ Checks if instructorStatus === "approved"
   ├─ Shows pending message if not approved
   └─ Shows logout option

4. PROTECTED INSTRUCTOR ROUTE (Frontend)
   ├─ Guards the actual dashboard
   ├─ Calls handleInstructorRedirect()
   ├─ Fetches approval status from API
   └─ Only renders dashboard if approved

5. EMAIL SERVICE (Backend)
   ├─ Triggered when admin approves
   ├─ Reads FRONTEND_URL from config
   ├─ Creates HTML email with login button
   └─ Sends to instructor email

6. ADMIN SERVICE (Backend)
   ├─ Updates instructorStatus from pending → approved
   ├─ Calls email service to send notification
   └─ Returns success response
```

## Data Flow: From Approval to Dashboard Access

```
Admin clicks                Email sends to               Instructor clicks
"Approve"                   instructor                   login link
     │                           │                             │
     ▼                           ▼                             ▼
instructorStatus:          Green button with          Redirected to
pending → approved          login link                /login page
     │                           │                             │
     ├─ DB updated              └─ Email via SMTP             │
     │                                │                       │
     │                                │                       │
     └──────────────────────────────┬─────────────────────────┘
                                    │
                                    ▼
                            Instructor enters
                            email & password
                                    │
                                    ▼
                            Backend validates &
                            returns user object
                            with instructorStatus:
                            "approved"
                                    │
                                    ▼
                            Frontend checks status
                                    │
                            status === "approved"?
                                    │
                                    ▼ YES
                            Redirect to /instructor
                                    │
                                    ▼
                            Layout component
                            checks instructorStatus
                                    │
                            approved === true?
                                    │
                                    ▼ YES
                            Render sidebar & dashboard
                                    │
                                    ▼
                            DASHBOARD ACCESSIBLE ✅
```

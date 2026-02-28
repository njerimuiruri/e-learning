# Recent Activities Section - Visual Guide & User Manual

## Overview

The Recent Activities feature provides a comprehensive audit trail of all system activities including user registrations, instructor approvals/rejections, course actions, and login events.

## Accessing Recent Activities

### Method 1: Admin Dashboard

1. Log in as Admin
2. Go to Dashboard (`/admin`)
3. Scroll down to the **"Recent Activities"** section (below "Pending Instructor Approvals")

### Method 2: System Settings Page

1. Log in as Admin
2. Click **"System Settings"** in the main sidebar (at the bottom)
3. View all activities in the **"All System Activities"** section

### Method 3: User Dropdown

1. Click your profile icon in the top-right corner
2. Click **"Settings"** → Opens System Settings page

## Understanding the Dashboard Recent Activities Section

### Location & Layout

```
┌─ Admin Dashboard
│
├─ Dashboard Header
├─ Quick Links
├─ Statistics Cards
├─ Quick Actions
├─ Pending Instructor Approvals [Alert Section]
│
└─► RECENT ACTIVITIES SECTION ◄─ NEW!
    ├─ Section Header with Icon
    ├─ Filter Buttons
    ├─ Activity Cards List
    └─ Pagination Controls
```

### Activity Section Header

```
[Activity Icon] Recent Activities
Track instructor logins, course approvals, rejections, and user registrations
```

### Filter Buttons Available

| Button         | Color   | Shows Activities                |
| -------------- | ------- | ------------------------------- |
| All Activities | Blue    | All activity types              |
| Registrations  | Green   | User & instructor registrations |
| Approved       | Emerald | Course & instructor approvals   |
| Rejected       | Red     | Course & instructor rejections  |

### Sample Activity Card

```
┌─────────────────────────────────────────────────┐
│ [Icon] │ Admin approved John Doe as instructor │ 2 hours ago │
│        │ Performed by: Faith Muiruri (Admin)    │             │
└─────────────────────────────────────────────────┘
```

### Activity Card Components

**Icon** - Visual indicator of activity type

- 👤 for user registration
- ✅ for approval
- ❌ for rejection
- 📚 for course actions

**Message** - Description of what happened

- "Student John registered"
- "Admin approved Jane as instructor"
- "Course approved: Advanced Python"

**Metadata** - Additional context

- Performed by: Shows admin who performed action
- Affected user: Shows impacted user
- Rejection reason: If applicable

**Timestamp** - Exact date and time

- Format: MM/DD/YYYY, HH:MM:SS AM/PM

## System Settings Page Layout

### Top Section - System Information

```
┌──────────────────┬──────────────────┬──────────────────┐
│ System Status    │ Last Activity    │ Total Activities │
│ ● Active         │ 3:45 PM          │ 247              │
│ All operational  │ Today            │ Recorded         │
└──────────────────┴──────────────────┴──────────────────┘
```

### Quick Actions Section

```
┌─────────────┬─────────────┬──────────────┬──────────────┐
│ Dashboard   │ Instructors │ All Users    │ Pending      │
│ [Icon]      │ [Icon]      │ [Icon]       │ Courses      │
│             │             │              │ [Icon]       │
└─────────────┴─────────────┴──────────────┴──────────────┘
```

### Activities Section

```
┌─ All System Activities ─────────────────────────────┐
│ Complete log of all system events                   │ [Refresh ↻]
│
│ Filters:
│ [All] [Registrations] [Approved] [Rejected] [Courses]
│
│ Activity List:
│ ├─ Activity 1 [Color coded background]
│ ├─ Activity 2 [Color coded background]
│ └─ Activity 3 [Color coded background]
│
│ Pagination:
│ Showing 1-10 of 247 activities [< Prev | Next >]
└────────────────────────────────────────────────────┘
```

## Activity Types & Colors

### Registration Activities

🟢 **Green Background** - User or Instructor registration

- "John Doe registered as student"
- "Jane Smith registered as instructor (pending approval)"

### Approval Activities

🟢 **Emerald Background** - Someone was approved

- "Jane Smith approved as instructor"
- "Advanced Python course approved"

### Rejection Activities

🔴 **Red Background** - Someone or something was rejected

- "Jane Smith rejected as instructor"
- "Advanced Python course rejected"

### Course Activities

🔵 **Blue Background** - Course-related actions

- "Advanced Python course created"
- "Advanced Python course updated"

### Other Activities

⚫ **Gray Background** - User management, deletions, etc.

- "John Doe account activated"
- "Course deleted: Old Python 101"

## Using Filters

### Step 1: Click a Filter Button

```
Activities Dashboard
│
├─ [All Activities]  ← Click here to see all
├─ [Registrations]   ← Or click here to filter
├─ [Approved]
├─ [Rejected]
└─ [Courses]
```

### Step 2: View Filtered Results

- List updates to show only selected activity type
- Page counter resets to 1
- All pagination controls updated

### Step 3: Navigate Through Results

- Use **< Previous** button to go back
- Use **Next >** button to go forward
- Shows current page range (e.g., "Showing 1-10 of 150")

## Understanding Activity Details

### User Registration

```
Example: "John Doe registered as student"
Details shown:
- User: John Doe
- Role: Student
- Time: Today, 10:30 AM
```

### Instructor Approval

```
Example: "Admin approved Jane as instructor"
Details shown:
- Action: Approved
- Instructor: Jane Smith
- Performed by: Faith Muiruri (Admin)
- Time: Today, 2:45 PM
```

### Course Rejection

```
Example: "Admin rejected course: Advanced Python"
Details shown:
- Action: Rejected
- Course: Advanced Python
- Reason: Missing prerequisites information
- Performed by: Faith Muiruri (Admin)
- Time: Today, 1:20 PM
```

## Pagination Guide

### Example Pagination Controls

```
Showing 1-10 of 247 activities    [< Previous] [Next >]
```

- **"1-10 of 247"** = Showing 10 results out of 247 total
- **"< Previous"** = Disabled on page 1 (gray), enabled after
- **"Next >"** = Enabled when more pages exist, disabled on last page

### Navigation Example

```
Page 1: Activities 1-10   (< disabled | Next enabled)
Page 2: Activities 11-20  (< enabled | Next enabled)
Page 3: Activities 21-30  (< enabled | Next enabled)
...
Page 25: Activities 241-247  (< enabled | Next disabled)
```

## Common Use Cases

### Use Case 1: Find Instructor Approval Actions

1. Click **"Approved"** filter button
2. Look for entries with "instructor" in message
3. Check the "Performed by" field to see which admin approved

### Use Case 2: Check Recent Registrations

1. Click **"Registrations"** filter button
2. Scroll through list (newest first)
3. View timestamps and new user details

### Use Case 3: Review Rejected Applications

1. Click **"Rejected"** filter button
2. Check rejection reasons in the metadata section
3. See which admin performed the rejection

### Use Case 4: Monitor Course Actions

1. Click **"Courses"** filter button
2. Review course approvals and rejections
3. Check feedback or reasons provided

### Use Case 5: Track Admin Logins

1. Keep **"All Activities"** filter active
2. Look for "logged in" entries
3. Note timestamps for audit purposes

## Tips & Tricks

### 💡 Tip 1: Filter Combinations

- Combine filtering with timestamp viewing
- Earlier activities show first (newest at top)

### 💡 Tip 2: Metadata Details

- Hover over rejection reasons to see full text
- Check "Performed by" to track admin actions

### 💡 Tip 3: Refresh Data

- On Settings page, click the **Refresh** button (↻)
- Dashboard auto-fetches on page load

### 💡 Tip 4: Activity Search

- Filter buttons help narrow down
- Future: Text search feature coming soon

### 💡 Tip 5: Export Activities

- Future: CSV export feature planned
- Current: Screenshot or document as needed

## Troubleshooting

### No Activities Showing

**Problem:** Activity list is empty
**Solution:**

- Check if filters are too restrictive
- Click "All Activities" to reset filters
- Verify you have appropriate admin permissions

### Pagination Not Working

**Problem:** Navigation buttons are disabled
**Solution:**

- Refresh the page (Ctrl+R or Cmd+R)
- Check browser console for errors
- Verify internet connection is stable

### Missing Activity

**Problem:** Expected action doesn't appear in list
**Solution:**

- Activity logging delay might be 1-2 seconds
- Refresh the page to reload activities
- Check if specific action type is filtered out

### Timestamps Incorrect

**Problem:** Activity times don't match server time
**Solution:**

- Check your system clock
- Browser should sync with server automatically
- Clear browser cache if persistently wrong

## Security Notes

🔒 **Activity logs are audit trails**

- Do not share with unauthorized users
- Activities show sensitive actions (approvals, rejections)
- Admin actions are tracked for compliance

🔒 **Privacy**

- User details are only shown to admins
- Student information is protected
- Only necessary metadata is displayed

## Future Features (Planned)

🔜 **Advanced Filtering**

- Date range filters
- Search by user name or course
- Multiple filter combinations

🔜 **Export Functionality**

- Download activities as CSV
- Generate PDF reports
- Email activity summaries

🔜 **Analytics**

- Activity trends over time
- Most active admins
- Approval/rejection rates

🔜 **Notifications**

- Real-time activity alerts
- Custom notification rules
- Email digests

🔜 **Performance**

- Server-side pagination
- Activity caching
- Search indexing

## FAQ

**Q: How far back do activity logs go?**
A: Activity logs are retained indefinitely (system default). Archiving policy may be implemented later.

**Q: Can I edit or delete activities?**
A: No. Activity logs are immutable audit trails and cannot be modified or deleted.

**Q: Who can see activities?**
A: Currently, only admins can view the Recent Activities section.

**Q: How often are activities updated?**
A: Activities appear almost instantly (within 1-2 seconds). Refresh to see latest.

**Q: Can instructors see their approval status?**
A: Instructors receive email notifications. Future feature will add instructor dashboard.

**Q: What activities are tracked?**
A: User registrations, instructor approvals/rejections, course actions, user logins, and more.

**Q: Is there a limit to how many activities are displayed?**
A: Dashboard shows 50 activities with pagination. System Settings shows more with filtering.

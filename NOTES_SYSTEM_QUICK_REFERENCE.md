# 🚀 Notes System - Quick Reference

## Files to Know

### Backend

| File                            | Purpose                   |
| ------------------------------- | ------------------------- |
| `src/notes/notes.schema.ts`     | MongoDB schema definition |
| `src/notes/notes.service.ts`    | 10 business logic methods |
| `src/notes/notes.controller.ts` | 10 API endpoints          |
| `src/notes/notes.module.ts`     | Module registration       |

### Frontend

| File                                        | Purpose                    |
| ------------------------------------------- | -------------------------- |
| `lib/api/noteService.ts`                    | API client with 10 methods |
| `src/app/(dashboard)/notes/page.jsx`        | Full notes dashboard       |
| `src/app/courses/[id]/learn/.../page.jsx`   | Learning page (updated)    |
| `src/components/student/StudentSidebar.jsx` | Navigation (updated)       |

---

## API Endpoints

```
POST   /notes                      Create note
GET    /notes                      Get all notes
GET    /notes/grouped              Get notes by course
GET    /notes/course/:courseId     Get course notes
GET    /notes/:noteId              Get note details
GET    /notes/search/:keyword      Search notes
GET    /notes/bookmarked           Get bookmarked notes
PUT    /notes/:noteId              Update note
PUT    /notes/:noteId/toggle-bookmark  Bookmark toggle
DELETE /notes/:noteId              Delete note
```

---

## Key Features

### While Learning

- Click **"Add Note"** button in header
- Modal shows course/lesson info
- Type note → Save
- ✓ Saved to database automatically

### Notes Dashboard

- Access from sidebar: **"My Notes"**
- View all notes grouped by course
- **Search** across all notes
- Click note → **View/Edit/Delete**
- Star important notes with bookmark

---

## Data Flow

```
Student writes note
    ↓
Click Save
    ↓
POST /notes (noteService.createNote)
    ↓
Database saves
    ↓
"Note saved!" message
    ↓
Fetch notes → Display in dashboard
```

---

## Note Structure

```javascript
{
  _id: "...",
  studentId: "...",
  courseId: "...",
  courseName: "Architecture",
  moduleIndex: 0,
  moduleName: "Module 1: ...",
  lessonIndex: 2,
  lessonName: "trial",
  content: "Note text here...",
  category: "personal",
  isBookmarked: false,
  tags: [],
  createdAt: "2025-12-13T10:30:00Z",
  updatedAt: "2025-12-13T10:30:00Z"
}
```

---

## Testing the System

### 1. Add a Note

```
1. Go to any lesson
2. Click "Add Note" button
3. Type note content
4. Click "Save Note"
5. Check: Should see "Note saved!" message
```

### 2. View Notes Dashboard

```
1. Click "My Notes" in sidebar
2. Check: Should see courses with note counts
3. Click course → See notes for that course
```

### 3. Search Notes

```
1. In Notes dashboard
2. Type keyword in search box
3. Check: Results should filter in real-time
```

### 4. Edit/Delete

```
1. Click a note to view
2. Click "Edit Note" → modify → "Save Changes"
3. Click "Delete" → confirm → note removed
```

---

## Database Query Examples

### Find all notes for a student

```javascript
db.notes.find({ studentId: ObjectId("...") }).sort({ createdAt: -1 });
```

### Find notes for a course

```javascript
db.notes
  .find({
    studentId: ObjectId("..."),
    courseId: ObjectId("..."),
  })
  .sort({ createdAt: -1 });
```

### Search notes

```javascript
db.notes.find({
  studentId: ObjectId("..."),
  $or: [
    { content: { $regex: "keyword", $options: "i" } },
    { lessonName: { $regex: "keyword", $options: "i" } },
  ],
});
```

---

## Troubleshooting

### Notes not saving?

- Check: Backend server running
- Check: JWT token in localStorage
- Check: Course/Lesson IDs passed correctly

### Notes not showing in dashboard?

- Refresh page (Ctrl+F5)
- Check browser console for errors
- Verify API endpoint is working

### Search not working?

- Check: Keyword is typed correctly
- Check: Notes have been saved (check DB)
- Try: Refresh page and search again

---

## Performance Notes

### Database Indices

Optimized for:

- Finding notes by student + course
- Sorting by creation date
- Finding bookmarked notes
- Full-text search

### Frontend Optimization

- Grouped fetch reduces API calls
- Client-side search filtering
- Lazy loading on scroll (optional)

---

## API Response Format

### Success

```json
{
  "success": true,
  "message": "Note created successfully",
  "data": { ...note object... }
}
```

### Error

```json
{
  "statusCode": 400,
  "message": "Failed to create note: ...",
  "error": "Bad Request"
}
```

---

## Browser Storage

Notes are **NOT cached locally** - they're always fetched from the server.
This ensures:

- ✓ Real-time sync across devices
- ✓ No stale data
- ✓ Always up-to-date

---

## Next Development Ideas

1. **Rich Text Editor** - Format notes with bold, lists, etc.
2. **Attachments** - Add images to notes
3. **Shared Notes** - Collaborate with classmates
4. **Note Templates** - Pre-filled note formats
5. **AI Summaries** - Auto-summarize long notes
6. **Export** - Download as PDF or Word
7. **Voice Notes** - Record and transcribe
8. **Sync** - Desktop app sync

---

## Support

For issues or questions:

1. Check browser console (F12)
2. Check backend logs
3. Verify API responses
4. Check database directly

All notes are in the `notes` collection in MongoDB!

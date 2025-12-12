# Quick Reference: Adding Questions to Courses

## For Testing

### Step 1: Create or Open a Course

- Go to instructor dashboard
- Create a new course OR open an existing one
- Click the course title to view details

### Step 2: Access Assessment Management

- Look for the blue **"Manage Assessments"** button
- Click it to open the assessment editor

### Step 3: Add a Question

1. Go to the **"Final Assessment"** tab
2. Scroll to **"Add Question"** section
3. Enter question text
4. Choose question type:
   - **Multiple Choice** - adds option input fields
   - **True/False** - select True or False as correct answer
   - **Essay** - free text question
5. Enter options (for multiple choice) or select correct answer
6. Optionally add an explanation
7. Click **"Add Question"** button

### Step 4: Save

- Click **"Save Assessment"** button at the bottom
- You'll see a success message
- Questions are now in the database!

### Step 5: Verify

- Go back to course detail page
- Questions should now appear in the course view
- Check admin dashboard - questions will show there too

---

## Expected Database Structure

After adding questions, your database record should look like:

```json
{
  "_id": "693aafaf03d3e8fb3bb373fe",
  "title": "information communication",
  "modules": [
    {
      "title": "module 1",
      "lessons": [
        {
          "title": "lesson 1",
          "questions": [
            {
              "text": "Sample question?",
              "type": "multiple-choice",
              "points": 1,
              "options": ["A", "B", "C"],
              "correctAnswer": "A",
              "explanation": "Explanation text"
            }
          ]
        }
      ],
      "moduleAssessment": {
        "title": "Module 1 Assessment",
        "questions": [...]
      }
    }
  ],
  "finalAssessment": {
    "title": "Final Assessment",
    "passingScore": 70,
    "questions": [
      {
        "text": "Final exam question?",
        "type": "true-false",
        "points": 2,
        "correctAnswer": "True",
        "explanation": "Why this is correct"
      }
    ]
  }
}
```

**Key Change:** `questions` array is NO LONGER EMPTY - it contains question objects!

---

## Troubleshooting

### Questions not saving?

- Check browser console for errors
- Ensure all required fields are filled
- Verify course is not in "published" status (may need to reject and redraft)

### Questions not showing in admin dashboard?

- Refresh the admin dashboard page
- Re-fetch course data by clicking "View Details" again
- Check if questions were actually saved (reload course detail page)

### Can't find the assessments button?

- Make sure you're on a course detail page (not course list)
- Look for the blue button in the top-right area
- Should be next to "Edit Course" button

---

## Features Available Now

✅ Add final assessment questions  
✅ Add module assessment questions  
✅ Multiple choice questions with options  
✅ True/False questions  
✅ Essay questions  
✅ Explanations for answers  
✅ Custom passing score  
✅ Delete questions  
✅ Save to database  
✅ View all questions before saving

---

## Features Coming Soon

🔜 Edit existing questions  
🔜 Reorder questions  
🔜 Lesson-level questions UI  
🔜 Import questions from CSV  
🔜 Question difficulty levels  
🔜 Question categories/tags

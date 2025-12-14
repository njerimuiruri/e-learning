# WYSIWYG Data Attributes Fix

## Problem

The WYSIWYG editor is adding `data-start` and `data-end` attributes to HTML elements, making the saved content messy and hard to read.

## Solution

Add a cleaning function that removes these attributes before saving content.

## Code Changes Needed

In `elearning/src/app/(dashboard)/instructor/courses/upload/page.jsx`:

### 1. Add the cleaning function (after stripHtml function, around line 209):

```javascript
const stripHtml = (html) => (html || "").replace(/<[^>]+>/g, "").trim();

// Add this new function:
const cleanHtmlContent = (html) => {
  if (!html) return "";
  // Remove data-start and data-end attributes added by browser
  return html
    .replace(/\s*data-start="[^"]*"/g, "")
    .replace(/\s*data-end="[^"]*"/g, "")
    .trim();
};
```

### 2. Update syncEditorContent function (around line 138):

```javascript
// BEFORE:
const syncEditorContent = () => {
  setCurrentLesson((prev) => ({
    ...prev,
    content: editorRef.current?.innerHTML || "",
  }));
};

// AFTER:
const syncEditorContent = () => {
  const rawContent = editorRef.current?.innerHTML || "";
  const cleanedContent = cleanHtmlContent(rawContent);
  setCurrentLesson((prev) => ({ ...prev, content: cleanedContent }));
};
```

### 3. Update addLesson function (around line 223):

```javascript
// BEFORE:
const addLesson = () => {
    const hasRichContent = stripHtml(currentLesson.content).length > 0;
    if (currentLesson.title && (currentLesson.videoUrl || currentLesson.videoFile || hasRichContent)) {
        setCurrentModule({
            ...currentModule,
            lessons: [...currentModule.lessons, { ...currentLesson, id: Date.now() }]
        });

// AFTER:
const addLesson = () => {
    const hasRichContent = stripHtml(currentLesson.content).length > 0;
    if (currentLesson.title && (currentLesson.videoUrl || currentLesson.videoFile || hasRichContent)) {
        // Clean the content before saving
        const cleanedLesson = {
            ...currentLesson,
            content: cleanHtmlContent(currentLesson.content)
        };
        setCurrentModule({
            ...currentModule,
            lessons: [...currentModule.lessons, { ...cleanedLesson, id: Date.now() }]
        });
```

## Result

After these changes, the HTML saved from the WYSIWYG editor will be clean without the `data-start` and `data-end` attributes:

### Before:

```html
<div>
  <h1 data-start="132" data-end="178"><b>Lesson 1</b></h1>
</div>
```

### After:

```html
<div>
  <h1><b>Lesson 1</b></h1>
</div>
```

## Implementation Steps

1. Open the upload page.jsx file
2. Add the `cleanHtmlContent` function
3. Update the `syncEditorContent` function
4. Update the `addLesson` function
5. Test by creating a new lesson with formatted content

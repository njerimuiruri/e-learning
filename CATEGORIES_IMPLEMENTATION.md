# Dynamic Course Categories - Implementation Complete

## Overview

You now have a fully functional dynamic category management system that allows admins to create, edit, and delete course categories. These categories are displayed as filterable pills on the home page and selectable options when instructors create courses.

## What Was Implemented

### Backend (NestJS)

#### 1. **New Files Created**

- `src/schemas/category.schema.ts` - MongoDB schema for categories
- `src/categories/categories.module.ts` - NestJS module
- `src/categories/categories.service.ts` - Service with CRUD operations
- `src/categories/categories.controller.ts` - Controller with API endpoints
- `src/categories/dto/category.dto.ts` - Data transfer objects for validation
- `src/seeds/categories.seed.ts` - Database seeding script with default categories

#### 2. **API Endpoints Created**

- `GET /api/categories` - Get all active categories (public)
- `GET /api/categories/:id` - Get specific category by ID (public)
- `POST /api/categories` - Create new category (admin only)
- `PUT /api/categories/:id` - Update category (admin only)
- `DELETE /api/categories/:id` - Soft delete category (admin only)

#### 3. **Security**

- Write operations (POST, PUT, DELETE) are protected with JWT authentication and admin role verification
- Read operations (GET) are public to support filtering on the home page

#### 4. **Database Seeding**

Run the following command to seed initial categories:

```bash
npm run seed:admin
# Then run:
ts-node -r tsconfig-paths/register src/seeds/categories.seed.ts
```

This will create the following default categories:

- Arin Publishing Academy
- AI for Climate Resilience
- Just Energy Transition Summer School
- Climate Adaptation Finance Professional Training

### Frontend (Next.js/React)

#### 1. **New Files Created**

- `src/lib/api/categoryService.ts` - API service for category operations
- `src/app/(dashboard)/admin/categories/page.jsx` - Admin category management page

#### 2. **Files Modified**

- `src/app/coursessection/page.jsx` - Home page now uses dynamic categories

  - Fetches categories from API on mount
  - Displays categories as filterable pills
  - Falls back to deriving categories from courses if none are configured

- `src/app/(dashboard)/instructor/courses/upload/page.jsx` - Instructor course creation

  - Category dropdown now loads from API
  - Shows loading state while fetching categories
  - Maps category objects to their names for display

- `src/components/Admin/AdminSidebar.jsx` - Admin navigation
  - Added "Categories" menu item linking to the category management page

## Features

### Admin Category Management (`/admin/categories`)

- **View all categories** with creation date and descriptions
- **Create new categories** with name and optional description
- **Edit existing categories** to update name and description
- **Delete categories** with confirmation (soft delete - marks as inactive)
- **Real-time updates** - categories update immediately after any action
- **Error handling** with user-friendly messages
- **Loading states** for better UX

### Home Page (`/coursessection`)

- **Dynamic category pills** that display all available categories
- **Filter functionality** - click any pill to filter courses by that category
- **Fallback behavior** - if no categories exist, derives from course data
- **Responsive design** with horizontal scrolling on mobile

### Instructor Course Upload (`/instructor/courses/upload`)

- **Dynamic category selection** in course creation form
- **Loading indicator** while fetching categories from API
- **Proper error handling** if categories fail to load

## Usage Instructions

### For Admins

1. **Access Category Management**

   - Navigate to Admin Dashboard
   - Click "Categories" in the sidebar
   - URL: `/admin/categories`

2. **Add a New Category**

   - Click "Add Category" button
   - Enter category name (required)
   - Enter optional description
   - Click "Create Category"

3. **Edit a Category**

   - Click the edit icon next to the category
   - Modify the name or description
   - Click "Update Category"

4. **Delete a Category**
   - Click the delete icon next to the category
   - Confirm deletion in the dialog
   - Category is soft-deleted (marked inactive)

### For Instructors

1. **Create Course with Category**
   - Navigate to Instructor Dashboard → Courses → Upload New Course
   - Fill in course details
   - Select a category from the dropdown (loaded dynamically)
   - Complete the rest of the course creation process

### For Students/Users

1. **Filter Courses on Home Page**
   - View the course section on home page
   - Click any category pill to filter courses
   - Click "All" to view all courses
   - Browse filtered courses

## API Response Examples

### Get All Categories (Public)

```
GET /api/categories
Response:
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Arin Publishing Academy",
      "description": "Comprehensive publishing and academic courses",
      "isActive": true,
      "createdAt": "2025-12-15T10:30:00Z",
      "updatedAt": "2025-12-15T10:30:00Z"
    },
    ...
  ]
}
```

### Create Category (Admin Only)

```
POST /api/categories
Headers: Authorization: Bearer {token}
Body:
{
  "name": "New Category",
  "description": "Optional description"
}
```

## Database Schema

### Category Schema

```typescript
{
  name: string (unique, required)
  description?: string
  isActive: boolean (default: true)
  createdAt: Date
  updatedAt: Date
}
```

## Environment Variables

No new environment variables needed. Ensure your backend is properly configured with:

- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - For JWT authentication

## Important Notes

1. **Soft Delete**: Categories are soft-deleted by setting `isActive: false`. They remain in the database but won't appear in listings.

2. **API Base URL**: The frontend uses `process.env.NEXT_PUBLIC_API_URL` (defaults to `http://localhost:5000`)

3. **Authentication**: Admin operations require valid JWT token with admin role

4. **Caching**: Frontend fetches categories on component mount. For real-time updates across browsers, consider implementing WebSocket or polling.

5. **Validation**: Backend validates category names are unique to prevent duplicates

## Testing the Implementation

1. **Seed Initial Data**

   ```bash
   ts-node -r tsconfig-paths/register src/seeds/categories.seed.ts
   ```

2. **Start Backend**

   ```bash
   npm run start:dev
   ```

3. **Start Frontend**

   ```bash
   npm run dev
   ```

4. **Test Flow**
   - Login as admin
   - Navigate to Categories page
   - Create/edit/delete a category
   - Login as instructor
   - Create a course and verify new category appears in dropdown
   - Logout and view home page
   - Verify category pills display and filtering works

## File Structure Summary

```
Backend:
src/
  schemas/
    category.schema.ts (NEW)
  categories/ (NEW)
    categories.controller.ts
    categories.module.ts
    categories.service.ts
    dto/
      category.dto.ts
  seeds/
    categories.seed.ts (NEW)
  app.module.ts (MODIFIED - added CategoriesModule)

Frontend:
src/
  lib/api/
    categoryService.ts (NEW)
  app/
    coursessection/
      page.jsx (MODIFIED)
    (dashboard)/
      instructor/courses/upload/
        page.jsx (MODIFIED)
      admin/
        categories/
          page.jsx (NEW)
        layout.jsx
  components/
    Admin/
      AdminSidebar.jsx (MODIFIED - added Categories link)
```

## Next Steps (Optional Enhancements)

1. **Bulk Operations**: Add bulk delete/import functionality
2. **Category Subcategories**: Implement nested categories
3. **Category Analytics**: Show course count per category
4. **Category Icons**: Allow uploading category icons/images
5. **Sorting**: Let admins reorder categories
6. **Webhooks**: Notify external systems when categories change

## Troubleshooting

### Categories not loading on home page

- Check that API is running on correct port
- Verify `NEXT_PUBLIC_API_URL` environment variable
- Check browser console for CORS errors

### Admin can't create categories

- Verify admin user has proper role in database
- Check JWT token is valid and includes admin role
- Ensure backend is running

### Instructor sees empty category dropdown

- Categories might not be seeded yet
- Run seed script
- Check that categories have `isActive: true`

## Support

For issues or questions, check the API response for detailed error messages.

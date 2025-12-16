# Quick Setup Guide - Dynamic Categories Feature

## Prerequisites

- Node.js and npm installed
- MongoDB running locally or connection string configured
- Backend running on port 5000
- Frontend running on port 3000

## Backend Setup

### 1. Install Dependencies (if not already done)

```bash
cd elearning-backend
npm install
```

### 2. Ensure Environment Variables

Check `.env` or `.env.local` has:

```
MONGODB_URI=mongodb://localhost:27017/elearning
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development
```

### 3. Start Backend

```bash
npm run start:dev
```

### 4. Seed Categories (Run AFTER backend is running)

In a new terminal:

```bash
cd elearning-backend
ts-node -r tsconfig-paths/register src/seeds/categories.seed.ts
```

You should see:

```
✓ Categories seeded successfully: 4
```

## Frontend Setup

### 1. Install Dependencies (if not already done)

```bash
cd elearning
npm install
```

### 2. Ensure Environment Variables

Create/update `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 3. Start Frontend

```bash
npm run dev
```

Navigate to `http://localhost:3000`

## Testing the Feature

### Test 1: View Categories on Home Page

1. Go to `http://localhost:3000` (home page)
2. Scroll to "Explore Our Research Programs" section
3. You should see category pills (e.g., "All", "Arin Publishing Academy", "AI for Climate Resilience", etc.)
4. Click any category pill - courses should filter
5. Click "All" - all courses should show

**Expected Result**: Category pills display and filtering works

### Test 2: Instructor Creates Course with Dynamic Category

1. Login as instructor (or use test instructor account)
2. Navigate to Dashboard → Courses → Upload New Course
3. In the form, look for the "Category" dropdown
4. Click the Category dropdown
5. You should see the dynamically loaded categories
6. Select a category and create the course

**Expected Result**: Category dropdown populated from database

### Test 3: Admin Manages Categories

1. Login as admin account (email: `admin@elearning.com` if using default seed)
2. Navigate to Admin Dashboard
3. Click "Categories" in the sidebar (or go to `/admin/categories`)
4. You should see the 4 seeded categories

#### Sub-test 3a: Create New Category

1. Click "Add Category"
2. Enter name: "Test Category"
3. Enter description: "This is a test category"
4. Click "Create Category"
5. New category should appear in the list immediately

**Expected Result**: New category created and displayed

#### Sub-test 3b: Edit Category

1. Click edit icon next to a category
2. Change the name or description
3. Click "Update Category"
4. Changes should be reflected immediately

**Expected Result**: Category updated successfully

#### Sub-test 3c: Delete Category

1. Click delete icon next to a category
2. Confirm deletion
3. Category should disappear from the list

**Expected Result**: Category soft-deleted (inactive)

#### Sub-test 3d: Verify Changes Propagate

1. Create a new category in admin panel
2. Navigate to instructor course upload page
3. Refresh the page
4. New category should appear in instructor's dropdown

**Expected Result**: Changes immediately visible to other users

## Troubleshooting

### "Cannot GET /api/categories"

- Backend not running on port 5000
- Check `NEXT_PUBLIC_API_URL` in frontend .env.local
- Ensure API routes are correctly mounted

### Categories showing as empty in dropdown

- Run seed script: `ts-node -r tsconfig-paths/register src/seeds/categories.seed.ts`
- Verify MongoDB is running and connected
- Check backend console for errors

### Admin cannot create/edit/delete categories

- Verify logged-in user has role: "admin"
- Check JWT token in browser localStorage
- Ensure user has admin role in database

### "Loading categories..." stuck indefinitely

- Check browser Network tab for failed API calls
- Check CORS settings in backend
- Verify backend is running

### Database errors when seeding

- Ensure MongoDB is running
- Check MONGODB_URI connection string
- Verify database name in connection is "elearning"

## Database Inspection

### Check Categories in MongoDB

```bash
# Using mongosh
mongosh

# In mongosh shell:
use elearning
db.categories.find()

# Should show:
# {
#   "_id": ObjectId(...),
#   "name": "Arin Publishing Academy",
#   "description": "...",
#   "isActive": true,
#   "createdAt": ISODate(...),
#   "updatedAt": ISODate(...)
# }
```

## API Testing (curl/Postman)

### Get all categories (public)

```bash
curl http://localhost:5000/api/categories
```

### Create category (admin only)

```bash
curl -X POST http://localhost:5000/api/categories \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Category",
    "description": "Description here"
  }'
```

### Update category (admin only)

```bash
curl -X PUT http://localhost:5000/api/categories/CATEGORY_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "description": "Updated description"
  }'
```

### Delete category (admin only)

```bash
curl -X DELETE http://localhost:5000/api/categories/CATEGORY_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Common Issues & Solutions

| Issue                          | Solution                                                 |
| ------------------------------ | -------------------------------------------------------- |
| 404 on /admin/categories       | Ensure you're logged in as admin                         |
| Empty dropdown for instructors | Run seed script or create categories via admin panel     |
| CORS errors                    | Check backend CORS configuration                         |
| JWT errors                     | Verify token is valid and not expired                    |
| Categories not showing on home | Check API is responding, try hard refresh (Ctrl+Shift+R) |

## Performance Notes

- Categories are fetched on component mount
- Consider caching if you have many categories
- Soft delete keeps database clean while maintaining referential integrity
- API response is cached in component state

## Next Steps

1. ✅ Test all features
2. Consider adding:
   - Category images/icons
   - Category search/filter in admin
   - Bulk operations
   - Category sorting
3. Deploy to production
4. Monitor category usage in analytics

---

For detailed implementation information, see `CATEGORIES_IMPLEMENTATION.md`

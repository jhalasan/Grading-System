# Role-Based Access Control Guide

## Overview
The system now has role-based access control with two roles:
- **Admin**: Can only view Activity Logs
- **Teacher**: Can manage grades (create, update, delete) and view Activity Logs

## Frontend Implementation
The UI automatically restricts navigation based on user role:
- **Admin users**: See only the "Activity Logs" tab
- **Teacher users**: See "Dashboard", "Grades", and "Activity Logs" tabs

## Backend API Rules (PocketBase)

### For `grades` Collection

Go to Collections → **grades** → **API Rules** tab and configure:

| Rule | Setting |
|------|---------|
| **List records** | `@request.auth.id != null && @request.auth.role = "teacher"` |
| **View records** | `@request.auth.id != null && @request.auth.role = "teacher"` |
| **Create records** | `@request.auth.id != null && @request.auth.role = "teacher"` |
| **Update records** | `@request.auth.id != null && @request.auth.role = "teacher"` |
| **Delete records** | `@request.auth.id != null && @request.auth.role = "teacher"` |

### For `activity_logs` Collection

Go to Collections → **activity_logs** → **API Rules** tab and configure:

| Rule | Setting |
|------|---------|
| **List records** | `@request.auth.id != null` (all authenticated users) |
| **View records** | `@request.auth.id != null` (all authenticated users) |
| **Create records** | `@request.auth.id != null` (all authenticated users) |
| **Update records** | `false` (logs are immutable) |
| **Delete records** | `false` (logs cannot be deleted) |

### For `students` Collection

Go to Collections → **students** → **API Rules** tab and configure:

| Rule | Setting |
|------|---------|
| **List records** | `@request.auth.id != null && @request.auth.role = "teacher"` |
| **View records** | `@request.auth.id != null && @request.auth.role = "teacher"` |
| **Create records** | `@request.auth.id != null && @request.auth.role = "teacher"` |
| **Update records** | `@request.auth.id != null && @request.auth.role = "teacher"` |
| **Delete records** | `false` (prevent accidental student record deletion) |

## User Accounts

### Admin Account
- **Email**: admin@email.com
- **Password**: admin123
- **Role**: admin

### Teacher Accounts
Create teacher accounts with:
- **Role**: teacher
- Can add, update, delete grades
- Can view activity logs

## Testing the Setup

1. **Login as Admin** (admin@email.com / admin123):
   - Only sees "Activity Logs" tab
   - Can view all grade operations
   - Cannot access or modify grades

2. **Login as Teacher**:
   - Sees "Dashboard", "Grades", and "Activity Logs" tabs
   - Can create, update, delete grades
   - Can view activity logs showing their changes

## Security Notes

- API rules are enforced at the database level
- Frontend UI is also restricted for better UX
- All grade operations are logged in activity_logs
- Admin users cannot modify grades (only view logs)
- Logs are immutable (cannot be updated or deleted)

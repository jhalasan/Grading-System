# PocketBase Users Collection Setup Guide

## Overview
This guide provides step-by-step instructions for setting up the `users` collection in PocketBase with proper authentication, roles, and user management for the Academic Grading System.

---

## Table of Contents
1. [Collection Schema](#collection-schema)
2. [Creating the Users Collection](#creating-the-users-collection)
3. [Setting Up Authentication](#setting-up-authentication)
4. [Creating Test Users](#creating-test-users)
5. [User Roles and Permissions](#user-roles-and-permissions)
6. [Security Best Practices](#security-best-practices)

---

## Collection Schema

### Collection Name: `users`

| Field | Type | Required | Special Properties | Notes |
|-------|------|----------|-------------------|-------|
| **id** | ID | Yes | Auto-generated | PocketBase primary key |
| **email** | Email | Yes | Unique, Indexed | User login email address |
| **password** | Password | Yes | Auto-hashed | User password (auto-managed by PocketBase) |
| **name** | Text | Yes | - | Full name of the teacher |
| **role** | Select | Yes | Options: `teacher`, `admin` | User role/position |
| **created** | Created | Auto | - | Timestamp when user was created |
| **updated** | Updated | Auto | - | Last update timestamp |

---

## Creating the Users Collection

### Step 1: Access PocketBase Admin Panel
1. Open your browser and navigate to: `http://127.0.0.1:8090/_/`
2. Log in with your admin credentials

### Step 2: Create New Collection
1. Click **Collections** in the left sidebar
2. Click the **+ Create Collection** button
3. Name the collection: `users` (lowercase)
4. Keep **Authentication collection** toggle **OFF** initially (we'll enable it after adding fields)
5. Click **Create**

### Step 3: Add Fields to Users Collection

**Field 1: Email**
- Click **+ Add Field**
- Field Name: `email`
- Field Type: **Email**
- Check: ✅ Required
- Check: ✅ Add unique index (for email uniqueness)
- Click **Save**

**Field 2: Password**
- Click **+ Add Field**
- Field Name: `password`
- Field Type: **Password**
- Check: ✅ Required
- Click **Save**

**Field 3: Name**
- Click **+ Add Field**
- Field Name: `name`
- Field Type: **Text**
- Check: ✅ Required
- Click **Save**

**Field 4: Role**
- Click **+ Add Field**
- Field Name: `role`
- Field Type: **Select**
- Check: ✅ Required
- **Options:** (add these values)
  - `teacher`
  - `admin`
- Click **Save**

### Step 4: Enable Authentication
1. Find the **Authentication** section at the top of your collection
2. Toggle ✅ **Enable authentication for this collection**
3. Configure the following:
   - **Require email address**: ✅ YES
   - **Email confirmation**: ⚪ NO (optional, for development)
   - Click **Save**

### Step 5: Set Collection Rules (Authorization)

**List/View Records Rule:**
- Click **API Rules**
- Under **List records**, set:
  ```
  @request.auth.id != ''
  ```
  (Only authenticated users can list users)

**View Record Rule:**
- Under **View record**, set:
  ```
  @request.auth.id != ''
  ```

**Create Record Rule:**
- Under **Create records**, set:
  ```
  @request.auth.role = "admin"
  ```
  (Only admins can create new users)

**Update Record Rule:**
- Under **Update records**, set:
  ```
  @request.auth.id = id || @request.auth.role = "admin"
  ```
  (Users can update their own record, or admins can update any)

**Delete Record Rule:**
- Under **Delete records**, set:
  ```
  @request.auth.role = "admin"
  ```
  (Only admins can delete users)

---

## Setting Up Authentication

### Configure Auth in App
The application already has authentication configured in the auth service. The key endpoint is:

```typescript
pb.collection('users').authWithPassword(email, password)
```

This will:
1. Authenticate the user with their email and password
2. Return the user record
3. Store the auth token in `pb.authStore`

---

## Creating Test Users

### Method 1: Via PocketBase Admin Panel

1. Go to your users collection
2. Click **+ New Record**
3. Fill in the following test users:

#### Test User 1: Teacher
- **Email:** `teacher1@email.com`
- **Password:** `password123` (or any password you prefer)
- **Name:** `Mary Ann`
- **Role:** `teacher`

#### Test User 2: Teacher
- **Email:** `teacher2@email.com`
- **Password:** `password123`
- **Name:** `John Smith`
- **Role:** `teacher`

#### Test User 3: Admin
- **Email:** `admin@email.com`
- **Password:** `admin123`
- **Name:** `Administrator`
- **Role:** `admin`

### Method 2: Via API (cURL)

```bash
# Create a teacher user
curl -X POST http://127.0.0.1:8090/api/collections/users/records \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher1@email.com",
    "password": "password123",
    "passwordConfirm": "password123",
    "name": "Mary Ann",
    "role": "teacher"
  }'

# Create an admin user
curl -X POST http://127.0.0.1:8090/api/collections/users/records \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@email.com",
    "password": "admin123",
    "passwordConfirm": "admin123",
    "name": "Administrator",
    "role": "admin"
  }'
```

---

## User Roles and Permissions

### Teacher Role
- Can **view** their own profile
- Can **create** grades
- Can **modify** grades they created or are assigned to
- Can **view** activity logs
- Cannot **create** or **delete** other users

### Admin Role
- Can **view** all user profiles
- Can **create** new users
- Can **update** any user information
- Can **delete** users
- Have full access to all grade operations
- Can **modify** all activity logs if needed

---

## Login Flow in Application

### When User Opens App

1. **App.tsx** checks if user is authenticated (`isAuthenticated()`)
2. If **not authenticated**, shows **LoginModal** component
3. User enters email and password
4. **authService.ts** calls `pb.collection('users').authWithPassword(email, password)`
5. On success:
   - Auth token stored in `pb.authStore`
   - User record returned
   - App displays main dashboard
6. On error:
   - Error message shown in login modal
   - User can retry

### After Login

- User info displayed in navbar (👤 Name (role))
- User info shown in dashboard and grades pages
- All grade operations tracked with user ID
- Logout button available to clear session

---

## Security Best Practices

### 1. Password Policy
- Use strong passwords (minimum 8 characters recommended)
- Avoid sharing login credentials
- Regular password updates recommended

### 2. Database Rules
- ✅ Email uniqueness enforced at database level
- ✅ Only admins can create/delete users
- ✅ Users can only modify their own profiles (except admins)
- ✅ Authentication required for all user operations

### 3. Production Considerations
- 🔒 Enable **Email Confirmation** in production
- 🔒 Enable **HTTPS** for all communications
- 🔒 Use environment variables for sensitive configuration
- 🔒 Implement email verification for new registrations
- 🔒 Add session timeout for security
- 🔒 Regularly audit activity logs for suspicious activity

### 4. Data Protection
- All grade modifications tracked with user ID
- Activity logs maintain audit trail
- User session tokens auto-managed by PocketBase

---

## Troubleshooting

### Issue: Login Failed - User Not Found
**Solution:** Ensure the user exists in the `users` collection with the correct email address.

### Issue: Login Failed - Invalid Password
**Solution:** Verify the password is correct. Passwords are case-sensitive.

### Issue: New Grade Creation Fails
**Solution:** Ensure:
- You are logged in (authenticated)
- Your user record exists and has an ID
- Your role is either `teacher` or `admin`

### Issue: Cannot See User Info in Dashboard
**Solution:** 
- Refresh the page
- Check browser console for errors
- Verify user record exists in database

---

## Next Steps

1. ✅ Create the users collection following this guide
2. ✅ Create at least one teacher user for testing
3. ✅ Create one admin user for administrative tasks
4. ✅ Update [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) if needed
5. ✅ Start the application and test login flow

---

## References

- PocketBase Docs: https://pocketbase.io/docs/
- Authentication Guide: https://pocketbase.io/docs/authentication/
- API Rules: https://pocketbase.io/docs/api/rules/
- Database Schema Guide: [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)

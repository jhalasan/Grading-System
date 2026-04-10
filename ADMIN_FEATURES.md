# Admin Features & Grade Backup System

## Overview
The admin panel provides comprehensive user management and grade restoration capabilities:
- 🔒 **Force Logout**: Immediately logout users upon unauthorized access detection
- 🔑 **Password Reset**: Reset user passwords with secure temporary credentials
- 🛡️ **Account Control**: Enable/disable user accounts
- 📊 **Grade Backup & Restore**: Restore grades to their original values if changed prematurely
- 📋 **Audit Trail**: Track all admin actions

---

## Features

### 1. User Management

#### Force Logout User
Forces a user to logout immediately, useful for security incidents.

**Service**: `adminService.forceLogoutUser(userId, reason)`

```typescript
await forceLogoutUser(userId, 'Unauthorized access detected');
```

**Action Logged**: `FORCED_LOGOUT` in activity_logs

#### Password Reset
Resets a user's password with a temporary credential. User must change on next login.

**Service**: `adminService.resetUserPassword(userId, temporaryPassword)`

```typescript
const tempPassword = generateTemporaryPassword();
await resetUserPassword(userId, tempPassword);
```

**Action Logged**: `PASSWORD_RESET` in activity_logs

#### Generate Temporary Password
Generates a secure 12-character temporary password with uppercase, lowercase, numbers, and symbols.

**Service**: `adminService.generateTemporaryPassword()`

#### Disable/Enable Account
Locks or unlocks a user account.

**Services**: 
- `adminService.disableUserAccount(userId, reason)`
- `adminService.enableUserAccount(userId)`

```typescript
await disableUserAccount(userId, 'Account compromised');
await enableUserAccount(userId);
```

**Actions Logged**: `ACCOUNT_DISABLED`, `ACCOUNT_ENABLED`

#### View All Users
Fetches list of all users with their status.

**Service**: `adminService.getAllUsers()`

---

### 2. Grade Backup & Restoration

#### Restore Grade from Backup
Restores a grade to its original value if it was changed prematurely.

**Service**: `adminService.restoreGradeFromBackup(gradeId, reason)`

```typescript
await restoreGradeFromBackup(gradeId, 'Grade changed prematurely');
```

**Action Logged**: `GRADE_RESTORED` in activity_logs

#### Get Grade Changes
Checks if a grade has been modified from its original value.

**Service**: `adminService.getGradeChanges(gradeId)`

```typescript
const changes = await getGradeChanges(gradeId);
// Returns: { modified: true, originalValue: 95, currentValue: 85, modifiedBy: 'John Doe' }
```

#### View Grades with Backup
Shows all grades with their backup/original values.

**Service**: `adminService.getGradesWithBackup()`

---

### 3. Audit Trail

#### Get Admin Audit Log
Retrieves all admin actions within a date range.

**Service**: `adminService.getAdminAuditLog(startDate?, endDate?)`

```typescript
const logs = await getAdminAuditLog(new Date('2026-04-01'), new Date('2026-04-10'));
```

---

## PocketBase Schema Updates

### Update 1: Add `disabled_at` Field to `users` Collection

1. Go to **PocketBase Admin Panel** → Collections → **users**
2. Click **+ Add Field**
3. Create field:
   - **Field Name**: `disabled_at`
   - **Field Type**: **Date/time**
   - **Required**: ❌ NO (optional)
   - Click **Save**

**Purpose**: Tracks when a user account was disabled. `null` = enabled, timestamp = disabled.

---

### Update 2: Add `original_grade_value` Field to `grades` Collection

1. Go to **PocketBase Admin Panel** → Collections → **grades**
2. Click **+ Add Field**
3. Create field:
   - **Field Name**: `original_grade_value`
   - **Field Type**: **Number**
   - **Required**: ❌ NO (optional)
   - **Min**: 0
   - **Max**: 100
   - Click **Save**

**Purpose**: Stores the original grade value for backup/restoration purposes.

---

### Update 3: Update `activity_logs` Collection Action Types

1. Go to **PocketBase Admin Panel** → Collections → **activity_logs**
2. Click on the **action_type** field (Select field)
3. Add the following new options:
   - `FORCED_LOGOUT`
   - `PASSWORD_RESET`
   - `ACCOUNT_DISABLED`
   - `ACCOUNT_ENABLED`
   - `GRADE_RESTORED`

4. Click **Save**

**Updated Options**: `LOGIN`, `LOGOUT`, `CREATE_GRADE`, `UPDATE_GRADE`, `DELETE_GRADE`, `FORCED_LOGOUT`, `PASSWORD_RESET`, `ACCOUNT_DISABLED`, `ACCOUNT_ENABLED`, `GRADE_RESTORED`

---

## Access Control

### API Rules - Users Collection

**Allow admins to view and manage users**

| Rule | Setting |
|------|---------|
| **List records** | `@request.auth.id != null && @request.auth.role = "admin"` |
| **View records** | `@request.auth.id != null && @request.auth.role = "admin"` |
| **Update records** | `@request.auth.id != null && @request.auth.role = "admin"` |
| **Create records** | `false` (prevent new user creation via API) |
| **Delete records** | `false` (prevent user deletion) |

---

## Usage Guide

### 1. Access Admin Panel
- Login as admin user
- Click **Admin Panel** in navigation menu

### 2. User Management Tab

**To Force Logout a User:**
1. Find the user in the table
2. Click **Force Logout** button
3. User will be logged out immediately
4. Action is logged in activity_logs

**To Reset Password:**
1. Find the user in the table
2. Click **Reset Password** button
3. Enter or generate a temporary password
4. Click **Reset Password**
5. Share the temporary password with the user securely
6. User must change it on next login

**To Disable/Enable Account:**
1. Click the **Disable** or **Enable** button next to user
2. Confirm the action
3. User's access will be blocked/restored

### 3. Grade Backup & Restore Tab

**To View Modified Grades:**
- Grades highlighted in **yellow** have been modified
- **Modified** badge shows which grades changed from original

**To Restore a Grade:**
1. Find the grade in the table
2. Verify current grade vs original grade
3. Click **Restore** button
4. Enter reason (optional)
5. Confirm restoration
6. Grade is restored and logged

---

## Security Best Practices

1. **Force Logout**: Use when unauthorized access is detected
2. **Temporary Passwords**: Always communicate temporarily passwords through secure channels
3. **Account Disabling**: Better than deletion for maintaining audit trail
4. **Grade Restoration**: Always document the reason for restoration
5. **Audit Trail**: Regularly review admin action logs
6. **Admin Accounts**: Limit number of admin accounts in production

---

## Activity Log Examples

### Forced Logout Log Entry
```json
{
  "user_id": "user123",
  "action_type": "FORCED_LOGOUT",
  "timestamp": "2026-04-10T14:32:00Z",
  "data": {
    "reason": "Unauthorized access",
    "forcedBy": "admin456",
    "forcedByEmail": "admin@example.com"
  }
}
```

### Password Reset Log Entry
```json
{
  "user_id": "user123",
  "action_type": "PASSWORD_RESET",
  "timestamp": "2026-04-10T14:32:00Z",
  "data": {
    "resetBy": "admin456",
    "resetByEmail": "admin@example.com",
    "note": "User should change password on next login"
  }
}
```

### Grade Restoration Log Entry
```json
{
  "user_id": "admin456",
  "action_type": "GRADE_RESTORED",
  "record_id": "grade789",
  "timestamp": "2026-04-10T14:32:00Z",
  "data": {
    "gradeId": "grade789",
    "studentId": "student123",
    "oldValue": 75,
    "restoredValue": 95,
    "reason": "Grade changed prematurely"
  }
}
```

---

## Files Updated

- ✅ `src/assets/services/adminService.ts` - All admin functions
- ✅ `src/assets/components/AdminDashboard.tsx` - Admin UI component
- ✅ `src/assets/pages/Admin.tsx` - Admin page
- ✅ `src/assets/types/User.ts` - Added `disabled_at` field
- ✅ `src/assets/types/Grade.ts` - Added `original_grade_value` field
- ✅ `src/App.tsx` - Added admin routing

---

## Next Steps

1. ✅ Update PocketBase schema with new fields
2. ✅ Update activity_logs action types
3. Update API rules for users collection
4. Test all admin functions
5. Train admin users on new features
6. Monitor audit trail for suspicious activities

# Users Collection API Rules Fix

## Issue
The password reset feature fails with error: `ClientResponseError 404: The requested resource wasn't found`

This occurs because the **users** collection has overly restrictive API rules that prevent admin password updates.

## Root Cause
The current API rules for the **users** collection are set to:
- **Update records**: `false` ← This blocks password resets!

When an admin tries to reset a user's password, the `pb.collection('users').update()` call is rejected.

## Solution: Update Users Collection API Rules

### Step-by-Step Instructions

1. **Open PocketBase Admin Panel**
   - Navigate to `http://127.0.0.1:8090/_/`

2. **Go to Collections → users**
   - Click on the **users** collection

3. **Click the "API Rules" tab**

4. **Update each rule as follows:**

| Rule Type | New Rule Content |
|-----------|------------------|
| **List records** | `@request.auth.id != null` |
| **View records** | `@request.auth.id != null` |
| **Create records** | LEAVE EMPTY or use `@request.auth.id = null` |
| **Update records** | `@request.auth.id != null && @request.auth.role = "admin"` |
| **Delete records** | LEAVE EMPTY or use `@request.auth.id = null` |

5. **Save the collection**
   - Click the "Save collection" button at the top right

### Rule Explanations

- **List/View**: Only authenticated users can list/view the users collection
- **Create**: Explicitly denied (users cannot self-register via API)
  - If you can't set to `false`: Leave the field **completely empty** or use `@request.auth.id = null`
- **Update**: ✅ **Allows authenticated admins to update users** (including password resets)
  - `@request.auth.id != null` - User must be authenticated
  - `@request.auth.role = "admin"` - User must have admin role
- **Delete**: Explicitly denied (prevent accidental user deletions)
  - If you can't set to `false`: Leave the field **completely empty** or use `@request.auth.id = null`

### Important: Password Requirements

⚠️ **PocketBase auth collections require passwords to be at least 8 characters long**

If you're still getting a 400 error:
1. Check that your temporary password is **at least 8 characters**
2. After updating API rules, **restart PocketBase** for changes to take effect
3. Verify the admin user is logged in (check console for `admin role`)

## Verification

After updating the rules:

1. Log in as an **admin user**
2. Go to **Admin Dashboard**
3. Select a user from the users list
4. Click **"Reset Password"** button
5. Generate a temporary password
6. Click **"Reset Password"** button in the modal
7. ✅ Should see success message: *"Password reset for [User Name]. Temporary password: [password]"*

## What Gets Updated

When you reset a password, these fields are updated in the users collection:
- `password`: New encrypted password
- `passwordConfirm`: Confirmation of the new password

PocketBase handles the password encryption automatically when these fields are updated.

## Security Notes

- Only admin users can reset passwords (checked by rule `@request.auth.role = "admin"`)
- Regular teachers cannot modify user records (they lack admin role)
- Password reset actions are logged in activity_logs with action type "PASSWORD_RESET"
- Failed password reset attempts are logged as errors

## Rollback (If Needed)

If you need to revert to the restrictive rules for security reasons:
```
Update records: false
```

However, this will disable the password reset feature.

## Related Issues

See [EMAIL_VISIBILITY_FIX.md](EMAIL_VISIBILITY_FIX.md) - The original rules were set conservatively for security but need to be relaxed for admin password management functionality.

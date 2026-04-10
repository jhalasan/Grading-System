# Device Tracking for Activity Logs - Setup Guide

## Overview

This update adds device tracking to the activity logs, capturing information about the device, OS, and browser used for every grade operation (create, update, delete) and authentication event (login, logout).

## What Changed

### 1. **TypeScript Updates**

- **Log.ts**: Added optional `device` field to `ActivityLog` interface
- **ipService.ts**: Added `getDeviceInfo()` function to detect device information
- **logService.ts**: Updated `logGradeOperation()` and `logAuthEvent()` to capture device info

### 2. **Device Information Captured**

The device field stores information in the following format:
```
[Device Type] - [Operating System] - [Browser]
```

**Examples:**
- `Desktop - Windows - Chrome`
- `Mobile - iOS - Safari`
- `Tablet - Android - Chrome`
- `Desktop - macOS - Firefox`

### 3. **Database Updates Required**

You need to add the `device` field to the **activity_logs** collection in PocketBase.

## Step-by-Step Instructions

### Step 1: Open PocketBase Admin Panel
- Navigate to `http://127.0.0.1:8090/_/`

### Step 2: Go to Collections → activity_logs
- Click on the **activity_logs** collection

### Step 3: Add the Device Field
1. Scroll down to the fields section
2. Click **"Add Field"** button
3. Configure the field:
   - **Field name**: `device`
   - **Field type**: `Text`
   - **Required**: Leave unchecked (optional field)
   - **Max length**: 255 (optional, but recommended)

### Step 4: Save the Collection
- Click the **"Save collection"** button at the top right

## Verification

After updating the schema:

1. Create a new grade, update a grade, or delete a grade
2. Check the admin panel or application logs
3. Look for entries in the activity_logs collection
4. Verify that the `device` field contains device information (e.g., "Desktop - Windows - Chrome")

## Device Detection Details

The `getDeviceInfo()` function detects:

### Device Type
- **Desktop**: Standard computers (Windows, macOS, Linux)
- **Tablet**: iPad or Android tablets
- **Mobile**: iPhones, Android phones, or other mobile devices

### Operating System
- Windows
- macOS
- Linux
- iOS
- Android
- Unknown (if detection fails)

### Browser
- Chrome
- Firefox
- Safari
- Edge
- Opera
- Unknown (if detection fails)

## Example Log Entry

After updating a grade from a desktop using Chrome:

```json
{
  "id": "abc123...",
  "user_id": "teacher_id",
  "action_type": "UPDATE_GRADE",
  "record_id": "grade_id",
  "old_value": "{...}",
  "new_value": "{...}",
  "timestamp": "2026-04-10T10:30:00.000Z",
  "ip_address": "192.168.1.100",
  "device": "Desktop - Windows - Chrome",
  "created": "2026-04-10T10:30:00.000Z"
}
```

## Security & Privacy Considerations

- Device information is logged automatically for all grade operations and authentication events
- This data helps identify unusual access patterns or unauthorized access attempts
- Device information is based on the browser's User-Agent string
- User-Agent may not always be accurate but provides useful contextual information

## Rollback (If Needed)

If you need to remove device tracking:

1. Delete the `device` field from the activity_logs collection in PocketBase
2. Remove the `device: getDeviceInfo()` line from `logGradeOperation()` and `logAuthEvent()` in logService.ts
3. Remove the `getDeviceInfo` import from logService.ts

However, this is not recommended as device tracking enhances security auditing capabilities.

## Related Documentation

- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) - Updated schema documentation
- [POCKETBASE_SETUP.md](POCKETBASE_SETUP.md) - PocketBase collection setup guide
- [USERS_COLLECTION_RULES_FIX.md](USERS_COLLECTION_RULES_FIX.md) - API rules for activity_logs

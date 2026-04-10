# PocketBase Setup Guide

## Prerequisites
- PocketBase downloaded and running on `http://127.0.0.1:8090`
- Access to PocketBase Admin Panel
- Basic understanding of relational databases

## Step-by-Step Setup

### Step 1: Create the `users` Collection

1. Go to PocketBase Admin Panel → Collections
2. Click **"Create Collection"**
3. Name: `users`
4. Skip initial fields
5. Add fields:
   - **name** (Text, Required)
   - **email** (Email, Required, add unique constraint)
   - **role** (Select, Required)
     - Options: `teacher`, `admin`

**Schema Summary:**
```
ID (auto)
name: text (required)
email: email (required, unique)
role: select (required) - teacher | admin
created: date (auto)
updated: date (auto)
```

### Step 2: Create the `students` Collection

1. Click **"Create Collection"**
2. Name: `students`
3. Add fields:
   - **student_name** (Text, Required)
   - **course** (Text, Required)
   - **section** (Text, Required)

**Schema Summary:**
```
ID (auto)
student_name: text (required)
course: text (required)
section: text (required)
created: date (auto)
updated: date (auto)
```

### Step 3: Create the `grades` Collection

1. Click **"Create Collection"**
2. Name: `grades`
3. Add fields:
   - **student_id** (Relation, Required)
     - Collection: `students`
     - Max select: 1
   - **subject** (Text, Required)
   - **grade_value** (Number, Required)
     - Min: 0
     - Max: 100
   - **last_modified_by** (Relation, Required)
     - Collection: `users`
     - Max select: 1

**Schema Summary:**
```
ID (auto)
student_id: relation (required) → students
subject: text (required)
grade_value: number (required, min: 0, max: 100)
last_modified_by: relation (required) → users
created: date (auto)
updated_at: date (auto)
```

**Important Note:** Make sure the field is named `updated_at` (with underscore), not `updated`. This matches the TypeScript types.

### Step 4: Create the `activity_logs` Collection

1. Click **"Create Collection"**
2. Name: `activity_logs`
3. Add fields:
   - **user_id** (Relation, Required)
     - Collection: `users`
     - Max select: 1
   - **action_type** (Select, Required)
     - Options: `CREATE_GRADE`, `UPDATE_GRADE`, `DELETE_GRADE`
   - **record_id** (Text, Required) - Grade ID
   - **old_value** (Text, Required) - JSON string
   - **new_value** (Text, Required) - JSON string
   - **timestamp** (Date, Required)
   - **ip_address** (Text, Optional)

**Schema Summary:**
```
ID (auto)
user_id: relation (required) → users
action_type: select (required) - CREATE_GRADE | UPDATE_GRADE | DELETE_GRADE
record_id: text (required)
old_value: text (required)
new_value: text (required)
timestamp: date (required)
ip_address: text (optional)
created: date (auto)
```

### Step 5: Set Up Access Rules

#### For `grades` collection:

**List & View Rules:**
```
@request.auth.id != null
```

**Create Rules:**
```
@request.auth.id != null && 
(@request.auth.role = "teacher" || @request.auth.role = "admin")
```

**Update Rules:**
```
@request.auth.id != null && 
(@request.auth.role = "teacher" || @request.auth.role = "admin")
```

**Delete Rules:**
```
@request.auth.id != null && @request.auth.role = "admin"
```

#### For `activity_logs` collection:

**List & View Rules:**
```
@request.auth.id != null
```

**Create Rules:**
```
@request.auth.id != null
```

**Update Rules:**
```
false
```
*(Prevent all updates - logs are immutable)*

**Delete Rules:**
```
false
```
*(Prevent all deletions - logs are immutable)*

### Step 6: Create Sample Data (for testing)

#### Add a Teacher User:
Navigate to **users** → **New Record**
```
name: John Smith
email: john@school.com
role: teacher
```

#### Add Students:
Navigate to **students** → **New Record**
```
1. 
student_name: Alice Johnson
course: Math 101
section: A

2.
student_name: Bob Wilson
course: Math 101
section: A

3.
student_name: Carol Davis
course: Math 101
section: B
```

#### Add Sample Grades:
Navigate to **grades** → **New Record**
```
1.
student_id: Alice Johnson
subject: Midterm Exam
grade_value: 85
last_modified_by: John Smith

2.
student_id: Bob Wilson
subject: Midterm Exam
grade_value: 92
last_modified_by: John Smith

3.
student_id: Carol Davis
subject: Midterm Exam
grade_value: 78
last_modified_by: John Smith
```

## Testing the Setup

### Test 1: View Grades Dashboard
1. Start your React app: `npm run dev`
2. Navigate to Grades page
3. You should see all grades displayed with student and teacher info

### Test 2: Edit a Grade
1. Click Edit button on any grade
2. Change the grade value
3. Click Save
4. Check Activity Logs page
5. You should see a new entry with the change details

### Test 3: Check Activity Logs
1. Go to Activity Logs page
2. Filter by action type
3. Verify that:
   - User name is displayed correctly (from expanded user_id)
   - Old and new values are shown
   - Timestamp is accurate

## Troubleshooting

### Issue: "Collection not found" error
- **Solution**: Verify collection names match exactly (case-sensitive)
- Check: `grades`, `users`, `students`, `activity_logs`

### Issue: Relation fields showing IDs instead of names
- **Solution**: Use expand query parameter in services
- Example: `expand=student_id,last_modified_by`

### Issue: Timestamps not matching
- **Solution**: Ensure both `timestamp` (in activity_logs) and `updated_at` (in grades) are date fields
- Check timezone settings in PocketBase admin

### Issue: Can't edit grades (permission denied)
- **Solution**: Check access rules in Update Rules
- Ensure role is set to 'teacher' or 'admin'
- Verify `@request.auth.profile` exists

## Next Steps

1. **Authentication**: Implement proper user authentication
2. **Advanced Filtering**: Add filters by date, user, action type
3. **Exports**: Add CSV export functionality
4. **Notifications**: Alert administrators of suspicious grade changes
5. **Backups**: Set up automated backups of the database

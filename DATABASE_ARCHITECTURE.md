# Database Architecture & Relationships

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        GRADING SYSTEM                        │
│                    Database Architecture                     │
└─────────────────────────────────────────────────────────────┘

                            ┌──────────────┐
                            │    users     │
                            │──────────────│
                            │ id (PK)      │
                            │ name ────┐   │
                            │ email    │   │
                            │ role     │   │
                            │ created  │   │
                            │ updated  │   │
                            └──────────┼───┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    │                                     │
                    │ (last_modified_by)      (user_id)  │
                    │                                     │
        ┌───────────▼────────────┐          ┌────────────▼──────────┐
        │      grades            │          │  activity_logs        │
        │────────────────────────│          │───────────────────────│
        │ id (PK)                │          │ id (PK)               │
        │ student_id (FK) ──┐    │          │ user_id (FK)          │
        │ subject           │    │          │ action_type           │
        │ grade_value (0-100)    │          │ record_id             │
        │ last_modified_by (FK)  │          │ old_value (JSON)      │
        │ created           │    │          │ new_value (JSON)      │
        │ updated_at        │    │          │ timestamp             │
        └───────────┬───────┘    │          │ ip_address            │
                    │            │          │ created               │
                    │            │          └──────────────────────┘
                    │ (student_id)
                    │
        ┌───────────▼────────────┐
        │     students           │
        │────────────────────────│
        │ id (PK)                │
        │ student_name           │
        │ course                 │
        │ section                │
        │ created                │
        │ updated                │
        └────────────────────────┘
```

## Data Flow for Grade Update

```
┌─────────────────────────────────────────────────────────────────────┐
│ SCENARIO: Teacher Updates a Grade from 85 to 92                    │
└─────────────────────────────────────────────────────────────────────┘

Step 1: User Opens Grade
════════════════════════
    GET /api/collections/grades/record_id
    expand=student_id,last_modified_by
    
    Returns:
    {
      id: "grade_123",
      student_id: "student_456",      ← ID reference
      subject: "Midterm Exam",
      grade_value: 85,                ← Current value
      last_modified_by: "user_789",   ← ID reference
      expand: {
        student_id: {
          id: "student_456",
          student_name: "Alice Johnson",
          course: "Math 101",
          section: "A"
        },
        last_modified_by: {
          id: "user_789",
          name: "John Smith",
          role: "teacher"
        }
      }
    }

Step 2: User Edits Grade
════════════════════════
    Modal shows: Midterm Exam - Current Value: 85
    User changes to: 92
    User clicks Save

Step 3: Backend Updates Grade
═════════════════════════════
    PATCH /api/collections/grades/grade_123
    {
      grade_value: 92,
      last_modified_by: "current_user_id"
    }
    
    Result: Grade record updated

Step 4: Backend Creates Activity Log
════════════════════════════════════
    POST /api/collections/activity_logs
    {
      user_id: "current_user_id",
      action_type: "UPDATE_GRADE",
      record_id: "grade_123",
      old_value: {
        "id": "grade_123",
        "grade_value": 85,
        ...
      },
      new_value: {
        "id": "grade_123",
        "grade_value": 92,
        ...
      },
      timestamp: "2026-04-09T14:30:00Z",
      ip_address: "192.168.1.100"
    }
    
    Result: Audit log entry created (IMMUTABLE)

Step 5: Frontend Shows Results
═══════════════════════════════
    Grade Table updates:
    ├─ Shows new grade_value: 92
    ├─ Shows last_modified_by: John Smith (from expand)
    └─ Shows updated time
    
    Activity Logs shows new entry:
    ├─ User: John Smith
    ├─ Action: UPDATE_GRADE (yellow badge)
    ├─ Old Value: 85
    ├─ New Value: 92
    ├─ Timestamp: 2026-04-09 14:30:00
    └─ IP Address: 192.168.1.100
```

## Query Patterns

### Pattern 1: Fetch Grades with Details
```typescript
// Query
GET /api/collections/grades
?expand=student_id,last_modified_by
&sort=-updated_at

// Result includes:
grades[] {
  id,
  student_id,
  subject,
  grade_value,
  last_modified_by,
  expand: {
    student_id: { student_name, course, section },
    last_modified_by: { name, email, role }
  }
}
// No extra queries needed - all data included!
```

### Pattern 2: Activity Audit Trail
```typescript
// Query by grade
GET /api/collections/activity_logs
?filter=record_id="grade_123"
&expand=user_id
&sort=-timestamp

// Shows complete history:
logs[] {
  timestamp,
  action_type,
  user (expanded): { name, email },
  old_value,
  new_value,
  ip_address
}
```

### Pattern 3: User Activity
```typescript
// Query by user
GET /api/collections/activity_logs
?filter=user_id="user_789"
&expand=user_id
&sort=-timestamp

// Shows all changes made by teacher:
logs[] {
  action_type,        // What they did
  record_id,          // Which grade
  timestamp,          // When
  ip_address          // From where
}
```

### Pattern 4: Date Range Query
```typescript
// Query logs in date range
GET /api/collections/activity_logs
?filter=timestamp>="2026-04-01"&&timestamp<"2026-04-30"
&expand=user_id
&sort=-timestamp

// Monthly audit report generated
```

## Access Control Matrix

```
┌────────────┬────────────┬────────────┬──────────────────┐
│ Role       │ View       │ Create     │ Update  │ Delete │
├────────────┼────────────┼────────────┼─────────┼────────┤
│ Teacher    │ ✅ All     │ ✅ Grades  │ ✅ Own  │ ❌     │
│ Admin      │ ✅ All     │ ✅ All     │ ✅ All  │ ✅ Own │
│ Student    │ ❌         │ ❌         │ ❌      │ ❌     │
│ Anonymous  │ ❌         │ ❌         │ ❌      │ ❌     │
└────────────┴────────────┴────────────┴─────────┴────────┘

Notes:
- Teachers: Can view all grades, create/edit their own
- Admins: Full access to everything
- Activity logs: Immutable (no one can edit/delete)
- All operations require authentication
```

## Data Integrity Rules

### Referential Integrity
```
grades.student_id → students.id
  • Cannot create grade without valid student
  • Deleting student cascades to grades

grades.last_modified_by → users.id
  • Cannot assign grade to non-existent user
  • User record must have teacher/admin role

activity_logs.user_id → users.id
  • Cannot create log without user
  • Permanently records who made change
```

### Business Rules
```
1. Grade Value: 0 ≤ grade_value ≤ 100
2. Action Types: CREATE_GRADE | UPDATE_GRADE | DELETE_GRADE
3. Timestamps: ISO 8601 format (UTC)
4. Activity Logs: Never modified or deleted (immutable)
5. Last Modified: Updated on every grade change
6. Course/Section: Cannot be empty for students
```

## Performance Considerations

### Indexes Recommended
```sql
-- grades
CREATE INDEX idx_student_id ON grades(student_id);
CREATE INDEX idx_last_modified_by ON grades(last_modified_by);
CREATE INDEX idx_updated_at ON grades(updated_at DESC);

-- activity_logs
CREATE INDEX idx_user_id ON activity_logs(user_id);
CREATE INDEX idx_record_id ON activity_logs(record_id);
CREATE INDEX idx_action_type ON activity_logs(action_type);
CREATE INDEX idx_timestamp ON activity_logs(timestamp DESC);

-- students
CREATE INDEX idx_course ON students(course);
CREATE INDEX idx_section ON students(section);

-- users
CREATE INDEX idx_email ON users(email UNIQUE);
CREATE INDEX idx_role ON users(role);
```

### Query Optimization
```
✅ DO: Use expand parameter
   GET /grades?expand=student_id,last_modified_by
   (Fetches related data in one query)

❌ DON'T: Make separate queries
   GET /grades → then GET /students → then GET /users
   (Multiple round trips)

✅ DO: Use filters efficiently
   filter=student_id="123"
   (Database filters before returning)

❌ DON'T: Fetch all then filter in code
   (Unnecessary data transfer)
```

## Disaster Simulation Scenario

```
┌─────────────────────────────────────────────────────────┐
│ SCENARIO: Grade Change Detection & Investigation        │
└─────────────────────────────────────────────────────────┘

T=0:00
  Grade A: 85
  Grade B: 78
  Grade C: 92
  (All logged)

T=0:15
  Unknown user modifies Grade A: 85 → 95
  (Logged with: WHO, WHEN, OLD, NEW, IP)

T=0:30
  Administrator runs audit report:
  
  SELECT * FROM activity_logs 
  WHERE action_type = "UPDATE_GRADE"
  ORDER BY timestamp DESC
  
  Results:
  ┌─────────────────────────────────────────┐
  │ User ID  │ Grade ID │ Old │ New │ Time │
  ├──────────┼──────────┼─────┼─────┼──────┤
  │ user_456 │ grade_A  │ 85  │ 95  │ 0:15 │
  │ user_123 │ grade_B  │ 78  │ 78  │ 0:00 │
  │ user_789 │ grade_C  │ 92  │ 92  │ 0:00 │
  └─────────────────────────────────────────┘
  
  Conclusion: user_456 modified Grade A

T=0:45
  Investigation: Who is user_456?
  
  SELECT * FROM users WHERE id = "user_456"
  → Result: Jane Doe, student, IP: 192.168.1.50
  
  IP correlation with access logs: ✓ Confirmed

Outcome: 
  ✅ Change detected immediately
  ✅ Perpetrator identified
  ✅ Original value recovered
  ✅ Timestamp verified
  ✅ Source location traced

Learning: 
  Why audit trails matter in security!
```

## Collection Relationships Summary

```
users (1) ──►── (M) grades
  │                  │
  │                  │
  └─ last_modified_by
  
users (1) ──►── (M) activity_logs
  │
  └─ user_id

students (1) ──►── (M) grades
  │                  │
  └─ student_id      └─ record_id ──► activity_logs (indirect)

One user           →  Many grade modifications
           ├─ log entry 1
           ├─ log entry 2
           └─ log entry 3

One student        →  Multiple grades
           ├─ Math grade
           ├─ Science grade
           └─ English grade

One grade          →  History of changes
           ├─ Initial: 85 (by teacher 1)
           ├─ Update: 90 (by teacher 2)
           └─ Update: 92 (by teacher 1)
```

---

This architecture ensures:
1. **Traceability** - Every change attributed to a user
2. **Auditability** - Complete change history with timestamps
3. **Accountability** - IP addresses and user IDs recorded
4. **Integrity** - Relations prevent orphaned records
5. **Security** - Role-based access control
6. **Recovery** - Old values stored for comparison
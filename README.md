# Grading System - Activity Log & Audit Trail

A comprehensive student grading management system designed for detecting and tracking unauthorized grade modifications through detailed activity logging.

## 🎯 Purpose

This system was built for a **Tabletop Disaster Simulation** class activity where students simulate a security incident where grades are mysteriously modified. The activity log feature makes it impossible to secretly change a grade—every modification is tracked with:
- **Who** made the change (User name & ID)
- **What** was changed (Old and new values)
- **When** it happened (Exact timestamp)
- **Where** it came from (IP address)

## 📋 Features

### Core Features
✅ **View All Grades** - Display all student grades in a clean table with student info  
✅ **Edit Grades** - Modal dialog for modifying student grades  
✅ **Automatic Logging** - Every grade change is logged automatically  
✅ **Activity Audit Trail** - Complete history of all modifications  
✅ **Dashboard** - Overview with statistics and recent activity  
✅ **Responsive UI** - Works on desktop and tablet devices  

### Advanced Features
✅ **Relation Expansion** - See student and user details without extra queries  
✅ **Date Range Filtering** - Query logs by date range  
✅ **Action Type Filtering** - Filter logs by CREATE/UPDATE/DELETE operations  
✅ **IP Address Tracking** - Track where changes originated  
✅ **Immutable Logs** - Activity logs cannot be edited or deleted  

## 🏗️ Project Structure

### Database (PocketBase)
Four collections with relationships:
- **users** - Teachers and admins who make changes
- **students** - Student records with course/section
- **grades** - Student grades with relations to students and users
- **activity_logs** - Immutable audit trail of all modifications

### Frontend Architecture
```
src/
├── assets/
│   ├── components/          # Reusable UI components
│   │   ├── ActivityLogTable  # Display audit logs
│   │   ├── EditGradeModal    # Grade editing dialog
│   │   └── GradeTable        # Grades display
│   ├── pages/               # Full page views
│   │   ├── Dashboard         # Stats overview
│   │   ├── Grades            # Grade management
│   │   └── Logs              # Activity log viewer
│   ├── services/            # Business logic
│   │   ├── gradeServices     # Grade CRUD
│   │   ├── logService        # Log queries
│   │   ├── studentService    # Student queries
│   │   └── pocketbase        # API client
│   └── types/               # TypeScript interfaces
├── App.tsx                  # Navigation & routing
├── App.css                  # Global styles
└── main.tsx                 # Entry point
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm/yarn
- PocketBase (running on `http://127.0.0.1:8090`)

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Database Setup
Follow the detailed setup in [POCKETBASE_SETUP.md](./POCKETBASE_SETUP.md):
1. Create 4 collections (users, students, grades, activity_logs)
2. Set up relations between collections
3. Configure access rules
4. Add sample data

## 📊 Key Features Explained

### Automatic Audit Logging
When a grade is updated:
1. Grade record is modified in the database
2. Activity log entry is created automatically
3. Old and new values stored for comparison
4. Timestamp and user recorded

### Activity Log Schema
```
{
  user_id: "teacher_123",
  action_type: "UPDATE_GRADE",
  record_id: "grade_456",
  old_value: "{\"grade_value\": 85}",
  new_value: "{\"grade_value\": 92}",
  timestamp: "2026-04-09T14:30:00Z",
  ip_address: "192.168.1.100"
}
```

### Relation Expansion
All queries use expanded relations to show human-readable data:
- Grade shows student name, course, section
- Activity log shows teacher/admin name
- No duplicate queries needed

## 🔐 Security

- **Role-Based Access**: Only teachers/admins can modify grades
- **Immutable Logs**: Activity logs cannot be edited or deleted
- **Timestamps**: Both creation and modification times tracked
- **IP Logging**: Source of changes recorded
- **Audit Trail**: Complete history of all modifications

## 📖 Usage

### Dashboard
- View total number of grades
- See recent activity at a glance
- Quick access to latest changes

### Grades Page
- View all student grades
- See who last modified each grade
- Click Edit to change a grade
- Automatic logging on save

### Activity Logs Page
- Complete history of all changes
- Filter by action type (CREATE/UPDATE/DELETE)
- See old and new values
- Track who made changes and when

## 🎓 Class Activity: "Who Changed the Grade?"

### Scenario
1. Grades are loaded into the system
2. One participant secretly modifies a grade
3. Others must investigate using the activity log
4. Identify the perpetrator from the logs

### Questions to Investigate
- Who modified the grade?
- When did it happen?
- What was the original value?
- Where did the change come from?
- How would you prevent unauthorized changes?

## 🛠️ Service Functions

### Grade Services
```typescript
getAllGrades()                    // Fetch all grades with relations
getGradeById(gradeId)            // Get specific grade
createGrade(...)                 // Create new grade + log
updateGrade(gradeId, value)      // Update grade + log
deleteGrade(gradeId)             // Delete grade + log
getGradesByStudentId(studentId)  // Get student's grades
```

### Log Services
```typescript
getActivityLogs()                       // All logs
getLogsByGradeId(gradeId)              // Logs for specific grade
getLogsByUserId(userId)                // Logs by user
getLogsByActionType(actionType)        // Filter by action
getLogsInDateRange(start, end)         // Date range query
```

### Student Services
```typescript
getAllStudents()                       // All students
getStudentById(studentId)              // Get student
getStudentsByCourse(course)            // Filter by course
getStudentsBySection(section)          // Filter by section
```

## 🎨 UI Components

### GradeTable
- Displays all grades in a responsive table
- Shows student info (name, course, section)
- Subject, grade value, and last modifier
- Edit button for each row

### EditGradeModal
- Modal dialog for grade editing
- Input validation (0-100)
- Shows student and grade details
- Save/Cancel buttons

### ActivityLogTable
- Complete audit trail in table format
- Shows user name (expanded from relation)
- Color-coded action badges (CREATE/UPDATE/DELETE)
- Old/new values for comparison
- Timestamp and IP address

### Dashboard
- Statistics cards (total grades, recent changes)
- Recent activity log preview
- Responsive grid layout

## 📚 Documentation

- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Complete database schema
- [POCKETBASE_SETUP.md](./POCKETBASE_SETUP.md) - Step-by-step setup guide

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Grades not loading | Verify PocketBase running on `http://127.0.0.1:8090` |
| User names showing as IDs | Check expand relations in queries |
| Edit button not working | Verify user has teacher/admin role |
| Timestamps wrong | Check PocketBase timezone settings |

## 💡 Key Learning Points

This system demonstrates:
1. **Importance of audit trails** in security
2. **Traceability** of who did what and when
3. **Data integrity** through relations
4. **Role-based access control** (RBAC)
5. **Immutable logs** for compliance
6. **Disaster recovery** from unauthorized changes

---

**Built for**: Tabletop Disaster Simulation Class Activity (2026)  
**Stack**: React 19 + TypeScript + Vite + PocketBase  
**Purpose**: Learn security through simulated incidents
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

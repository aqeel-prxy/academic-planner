# API Endpoint Specifications - Updated

## Modules Endpoints

### Create Module (POST /api/modules)

**Request Body:**
```json
{
  "moduleCode": "CS101",
  "moduleName": "Data Structures",
  "credits": 4,
  "semester": 1,
  "year": 1,
  "targetGrade": 75,
  "midExamWeight": 20,
  "numberOfQuizzes": 3,
  "quizWeight": 20,
  "numberOfAssignments": 2,
  "assignmentWeight": 20,
  "finalExamWeight": 40
}
```

**Response (201 Created):**
```json
{
  "id": "uuid-here",
  "moduleCode": "CS101",
  "moduleName": "Data Structures",
  "credits": 4,
  "semester": 1,
  "year": 1,
  "targetGrade": 75,
  "midExamWeight": 20,
  "numberOfQuizzes": 3,
  "quizWeight": 20,
  "numberOfAssignments": 2,
  "assignmentWeight": 20,
  "finalExamWeight": 40,
  "status": "active",
  "createdAt": "2026-03-27T10:00:00Z",
  "updatedAt": "2026-03-27T10:00:00Z"
}
```

**Validation:**
- moduleCode: required, must be unique string
- moduleName: required, string
- credits: positive integer (min 1)
- semester: required, integer 1-8
- year: required, integer 1-4
- targetGrade: 0-100 percentage
- Weights must sum to exactly 100%
- numberOfQuizzes: non-negative integer
- numberOfAssignments: non-negative integer

---

### Get Module (GET /api/modules/:id)

**Response (200 OK):**
```json
{
  "id": "uuid-here",
  "moduleCode": "CS101",
  "moduleName": "Data Structures",
  "credits": 4,
  "semester": 1,
  "year": 1,
  "targetGrade": 75,
  "midExamWeight": 20,
  "numberOfQuizzes": 3,
  "quizWeight": 20,
  "numberOfAssignments": 2,
  "assignmentWeight": 20,
  "finalExamWeight": 40,
  "status": "active",
  "createdAt": "2026-03-27T10:00:00Z",
  "updatedAt": "2026-03-27T10:00:00Z"
}
```

---

## Grades Endpoints

### Create Grade (POST /api/grades)

**Request Body (NEW FORMAT):**
```json
{
  "moduleId": "module-uuid-here",
  "midExamMarks": 85,
  "quizMarksArray": [80, 90, 75],
  "assignmentMarksArray": [88, 92],
  "finalExamMarks": 87,
  "semester": 1,
  "week": 1
}
```

**Response (201 Created):**
```json
{
  "message": "Grade record created successfully",
  "grade": {
    "id": "grade-uuid-here",
    "moduleId": "module-uuid-here",
    "midExamMarks": 85,
    "quizMarksArray": [80, 90, 75],
    "quizMarksAverage": 81.67,
    "assignmentMarksArray": [88, 92],
    "assignmentMarksAverage": 90,
    "finalExamMarks": 87,
    "currentGPA": 3.8,
    "letterGrade": "A",
    "semester": 1,
    "week": 1,
    "riskLevel": "low",
    "createdAt": "2026-03-27T10:00:00Z",
    "updatedAt": "2026-03-27T10:00:00Z"
  },
  "currentGrade": 86.13,
  "currentGPA": 3.8,
  "letterGrade": "A",
  "riskLevel": "low"
}
```

**Validation:**
- moduleId: required, must exist in database
- Marks (if provided): 0-100 range
- At least one mark must be provided
- quizMarksArray: array of numbers or nulls
- assignmentMarksArray: array of numbers or nulls
- Arrays length must match module configuration

---

### Get Grades (GET /api/grades)

**Response (200 OK):**
```json
[
  {
    "id": "grade-uuid-here",
    "moduleId": "module-uuid-here",
    "midExamMarks": 85,
    "quizMarksArray": [80, 90, 75],
    "quizMarksAverage": 81.67,
    "assignmentMarksArray": [88, 92],
    "assignmentMarksAverage": 90,
    "finalExamMarks": 87,
    "currentGPA": 3.8,
    "letterGrade": "A",
    "semester": 1,
    "week": 1,
    "riskLevel": "low",
    "Module": {
      "id": "module-uuid-here",
      "moduleCode": "CS101",
      "moduleName": "Data Structures",
      "targetGrade": 75
    },
    "createdAt": "2026-03-27T10:00:00Z",
    "updatedAt": "2026-03-27T10:00:00Z"
  }
]
```

---

### Get Grade by Module (GET /api/grades/module/:moduleId)

**Response (200 OK):**
```json
[
  {
    "id": "grade-uuid-here",
    "moduleId": "module-uuid-here",
    "midExamMarks": 85,
    "quizMarksArray": [80, 90, 75],
    "quizMarksAverage": 81.67,
    "assignmentMarksArray": [88, 92],
    "assignmentMarksAverage": 90,
    "finalExamMarks": 87,
    "currentGPA": 3.8,
    "letterGrade": "A",
    "semester": 1,
    "week": 1,
    "riskLevel": "low",
    "createdAt": "2026-03-27T10:00:00Z",
    "updatedAt": "2026-03-27T10:00:00Z"
  }
]
```

---

## Data Structure Examples

### Example 1: Module with 3 Quizzes, 2 Assignments

**Module:**
```json
{
  "moduleCode": "CS101",
  "moduleName": "Data Structures",
  "numberOfQuizzes": 3,
  "numberOfAssignments": 2,
  "midExamWeight": 20,
  "quizWeight": 20,
  "assignmentWeight": 20,
  "finalExamWeight": 40
}
```

**Grade Entry:**
```json
{
  "moduleId": "uuid",
  "midExamMarks": 85,
  "quizMarksArray": [80, 90, 75],      // 3 items for 3 quizzes
  "assignmentMarksArray": [88, 92],    // 2 items for 2 assignments
  "finalExamMarks": 87
}
```

**Calculation:**
- Quiz Average: (80+90+75)/3 = 81.67
- Assignment Average: (88+92)/2 = 90
- Final Grade = (85×0.20) + (81.67×0.20) + (90×0.20) + (87×0.40) = 86.13%
- GPA: 3.8 (for 86.13%)

---

### Example 2: Module with 5 Quizzes, No Assignments

**Module:**
```json
{
  "moduleCode": "MATH201",
  "moduleName": "Calculus II",
  "numberOfQuizzes": 5,
  "numberOfAssignments": 0,
  "midExamWeight": 30,
  "quizWeight": 30,
  "assignmentWeight": 0,
  "finalExamWeight": 40
}
```

**Grade Entry:**
```json
{
  "moduleId": "uuid",
  "midExamMarks": 88,
  "quizMarksArray": [85, 90, 88, 92, 86],  // 5 quizzes
  "assignmentMarksArray": [],               // No assignments
  "finalExamMarks": 91
}
```

**Calculation:**
- Quiz Average: (85+90+88+92+86)/5 = 88.2
- Final Grade = (88×0.30) + (88.2×0.30) + (91×0.40) = 89.26%

---

### Example 3: Partial Grade Entry

When only some marks are entered, calculations adapt:

**Grade Entry (Partial):**
```json
{
  "moduleId": "uuid",
  "midExamMarks": null,
  "quizMarksArray": [80, null, 85],    // Only 2 of 3 quizzes
  "assignmentMarksArray": [88, 92],    // Full assignments
  "finalExamMarks": null
}
```

**Calculation:**
- Quiz Average (only 2 entered): (80+85)/2 = 82.5
- Assignment Average: (88+92)/2 = 90
- Active Weights: Quiz 20% + Assignment 20% = 40% (normalized to 100%)
- Final Grade = (82.5×0.50) + (90×0.50) = 86.25%

---

## GPA Scale

| Percentage | GPA | Letter |
|-----------|-----|--------|
| >= 90     | 4.0 | A      |
| >= 85     | 3.9 | A      |
| >= 80     | 3.8 | B      |
| >= 75     | 3.7 | B      |
| >= 70     | 3.5 | C      |
| >= 65     | 3.0 | C      |
| >= 60     | 2.5 | D      |
| >= 55     | 2.0 | D      |
| >= 50     | 1.5 | E      |
| < 50      | 0   | F      |

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid request",
  "message": "Weights must sum to 100%"
}
```

### 404 Not Found
```json
{
  "error": "Module not found"
}
```

### 409 Conflict
```json
{
  "error": "Module code already exists"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to create grade",
  "message": "Database connection error"
}
```

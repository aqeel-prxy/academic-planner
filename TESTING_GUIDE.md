# GPA Tracker - Testing Guide

## Setup & Prerequisites

1. **Node.js is installed** (v22.6.0+)
2. **Both backend and frontend servers are running**
   - Backend: http://localhost:5000
   - Frontend: http://localhost:3000

## Test Scenarios

### Test 1: Create a New Module with Custom Assessment Configuration

**Steps:**
1. Navigate to GPA Tracker → "Add Data" tab
2. In "Add New Module" form, enter:
   - Module Code: `CS101`
   - Module Name: `Data Structures`
   - Credits: `4`
   - Semester: `1`
   - Year: `1`
   - Target Grade: `75`

3. Configure Assessment:
   - Mid Exam Weight: `20%`
   - Number of Quizzes: `3`
   - Quiz Weight: `20%`
   - Number of Assignments: `2`
   - Assignment Weight: `20%`
   - Final Exam Weight: `40%`

4. Verify Total Weight displays: `100%`
5. Click "Insert Module" button
6. **Expected Result:** Module is created successfully with all assessment configuration saved

---

### Test 2: Update Module Progress with Individual Marks

**Prerequisites:** Module created in Test 1

**Steps:**
1. Click the "Add Data" tab (if not already there)
2. In "Update Module Progress" form:
   - Select Module: `CS101 - Data Structures`
   - **Verify form updates to show:**
     - Mid Exam Marks field (Weight: 20%)
     - 3 Quiz input fields (Quiz 1, Quiz 2, Quiz 3) (Weight: 20%)
     - 2 Assignment input fields (Assignment 1, Assignment 2) (Weight: 20%)
     - Final Exam Marks field (Weight: 40%)

3. Enter marks:
   - Mid Exam: `85`
   - Quiz 1: `80`
   - Quiz 2: `90`
   - Quiz 3: `75`
   - Assignment 1: `88`
   - Assignment 2: `92`
   - Final Exam: `87`

4. **Verify GPA calculations update in real-time:**
   - Percentage should update as you enter each mark
   - GPA (0-4.0 scale) should update
   - Letter Grade should update (A, B, C, D, E, F)

5. Calculated Expected:
   - Avg Quiz: (80+90+75)/3 = 81.67
   - Avg Assignment: (88+92)/2 = 90
   - Weighted: (85×0.20) + (81.67×0.20) + (90×0.20) + (87×0.40)
   - Weighted: 17 + 16.33 + 18 + 34.8 = 86.13%
   - GPA: 3.8

6. Click "Update GPA"
7. **Expected Result:** Grade is saved and displayed in the Grade Tracker

---

### Test 3: Module with Different Assessment Configurations

**Steps:**
1. Create another module with different configuration:
   - Module Code: `MATH201`
   - Module Name: `Calculus II`
   - Credits: `3`
   - Mid Exam Weight: `30%`
   - Number of Quizzes: `5`
   - Quiz Weight: `30%`
   - Number of Assignments: `0` (no assignments)
   - Assignment Weight: `0%`
   - Final Exam Weight: `40%`

2. Verify Total Weight = `100%`
3. Create another with:
   - Module Code: `ENG101`
   - Module Name: `English Literature`
   - Credits: `3`
   - Mid Exam Weight: `0%`
   - Number of Quizzes: `2`
   - Quiz Weight: `25%`
   - Number of Assignments: `4`
   - Assignment Weight: `25%`
   - Final Exam Weight: `50%`

4. **Expected Result:** Each module can have completely different assessment structures

---

### Test 4: Update Progress for Modules with Varying Assessments

**Steps:**
1. Update MATH201 (with 5 quizzes, no assignments):
   - Select MATH201 from dropdown
   - Verify only Mid Exam, 5 Quiz fields, and Final Exam appear
   - No Assignment fields shown
   - Enter marks and verify GPA calculation

2. Update ENG101 (with 4 assignments, 2 quizzes):
   - Select ENG101 from dropdown
   - Verify 2 Quiz fields and 4 Assignment fields appear
   - No Mid Exam field shown
   - Enter marks and verify calculation is correct with weighted average

3. **Expected Result:** Form correctly displays only the assessments configured for each module

---

### Test 5: UI Layout Verification

**Steps:**
1. In "Insert Module" form:
   - Verify all labels are positioned on the left side of input fields
   - Check that form is well-organized into sections:
     - "Module Information" section
     - "Assessment Configuration" section
   - Verify weight summary displays correctly

2. In "Update Module Progress" form:
   - Verify "Select Module" label is on the left of dropdown
   - Check assessment sections are grouped logically:
     - Quizzes grouped together with "Quizzes (Weight: X%)" header
     - Assignments grouped together with "Assignments (Weight: X%)" header
   - Verify GPA preview box shows:
     - Percentage, GPA, and Letter Grade clearly

3. **Expected Result:** All labels positioned on left, consistent layout

---

### Test 6: Weight Validation

**Steps:**
1. Try to create a module with invalid weights:
   - Mid Exam: `30%`
   - Quiz: `30%`
   - Assignment: `30%`
   - Final Exam: `20%`
   - Total: `110%`

2. Click "Insert Module"
3. **Expected Result:** Error message: "Weights must sum to 100%"

---

### Test 7: GPA Auto-calculation Accuracy

**Steps:**
1. Create a module with known weights
2. Enter specific marks
3. Manually calculate expected GPA
4. Verify displayed GPA matches calculations
5. **Test multiple partial entries:**
   - Enter only Mid Exam mark (others blank)
   - Verify GPA calculated only from Mid Exam with adjusted weight
   - Add Quiz marks
   - Verify GPA recalculates with both Mid and Quiz

6. **Expected Result:** GPA calculations are accurate with dynamic weights

---

### Test 8: Complete Module Progress Flow

**Steps:**
1. Create Module: `CS201 - OOP`
   - Mid: 25%, Quizzes (2): 25%, Assignments (1): 25%, Final: 25%

2. Update progress (Week 1):
   - Quiz 1: 75, Quiz 2: 80
   - Assignment 1: 85
   - Other marks blank

3. Verify GPA preview shows calculation based on partial data
4. Click "Update GPA"
5. Navigate to "Overview & Analytics" tab
6. Verify CS201 appears in module breakdown
7. Return to "Add Data" and select CS201 again
8. Add Mid Exam: 88, Final: 90
9. Click "Update GPA" again
10. **Expected Result:** All data persists and updates correctly

---

## Component Verification Checklist

- [ ] ModuleForm shows new assessment fields
- [ ] ModuleForm button says "Insert Module"
- [ ] UpdateModuleProgress component loads when "Add Data" tab is active
- [ ] Module dropdown shows all available modules
- [ ] Selecting module dynamically updates form fields
- [ ] Quiz count matches configured number
- [ ] Assignment count matches configured number
- [ ] GPA preview updates in real-time
- [ ] GPA calculations are correct
- [ ] "Update GPA" button saves data
- [ ] CSS styling properly applied (labels on left)
- [ ] Weight summary displays sum correctly
- [ ] Error messages appear for invalid data

---

## Troubleshooting

### Issue: UpdateModuleProgress not showing
- Check that import statement is correct in GradeTracker.js
- Verify UpdateModuleProgress.js file exists
- Check browser console for errors

### Issue: Form fields not updating when module selected
- Verify useEffect hook is properly set up
- Check that module data is being fetched correctly
- Confirm module has numberOfQuizzes and numberOfAssignments fields

### Issue: GPA not calculating
- Check that selectedModule is set when module is selected
- Verify weights are loading from module object
- Check browser console for calculation errors

### Issue: Weights sum error always appears
- Verify weight fields are properly parsed as floats
- Check that sum calculation includes all weight fields
- Ensure weight validation logic is correct

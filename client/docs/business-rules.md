# Business Rules - Visual Timetable Builder

## Access Control Rules
- Only authenticated students can view/edit their timetable
- Each student can only see their own timetable (no access to others)

## Validation Rules
- Start date/time must be in the future (cannot add past classes)
- End time must be after start time
- All fields marked with * are mandatory
- Course code must follow format: XX0000 (2 letters + 4 digits)

## Capacity/Limits Rules
- No overlapping classes allowed (conflict detection)
- Maximum 8 classes per day
- Classes must be within semester dates (Feb 1 - June 30)

## Process/Workflow Rules
- Classes can be edited anytime before they occur
- Past classes become read-only (cannot edit)
- Drag-and-drop only allowed for future classes

## Data Consistency Rules
- Each class must have a unique ID
- Cannot delete a course that has existing classes (must delete classes first)
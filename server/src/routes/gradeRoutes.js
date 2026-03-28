const express = require('express');
const router = express.Router();
const gradeController = require('../controller/gradeController');
const { validateGrade } = require('../middleware/validation');

// GET all grades
router.get('/', gradeController.getAllGrades);

// GET grades by semester
router.get('/semester/:semester', gradeController.getGradesBySemester);

// GET grades by module
router.get('/module/:moduleId', gradeController.getGradesByModule);

// GET GPA statistics
router.get('/stats/gpa', gradeController.getGPAStatistics);

// GET GPA trend
router.get('/stats/trend', gradeController.getGPATrend);

// GET risk analysis
router.get('/stats/risk', gradeController.getRiskAnalysis);

// POST create new grade
router.post('/', validateGrade, gradeController.createGrade);

// PUT update grade
router.put('/:id', gradeController.updateGrade);

// DELETE grade
router.delete('/:id', gradeController.deleteGrade);

console.log('✅ Grade routes loaded successfully');

module.exports = router;

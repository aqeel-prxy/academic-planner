const Grade = require('../models/Grade');
const Module = require('../models/Module');
const { calculateWeightedGrade, calculateWeightedGradeWithIndividualWeights, getRiskLevel, getLetterGrade, percentageToGPA, calculateSemesterGPA, generateGPATrend } = require('../utils/gpaCalculator');

// GET all grades
exports.getAllGrades = async (req, res) => {
  try {
    const grades = await Grade.findAll({
      include: [{ model: Module, attributes: ['moduleCode', 'moduleName', 'targetGrade'] }],
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json(grades);
  } catch (error) {
    console.error('Error fetching grades:', error);
    res.status(500).json({ error: 'Failed to fetch grades', message: error.message });
  }
};

// GET grades by module
exports.getGradesByModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const grades = await Grade.findAll({
      where: { moduleId },
      include: [{ model: Module }],
      order: [['semester', 'ASC'], ['week', 'ASC']]
    });
    res.status(200).json(grades);
  } catch (error) {
    console.error('Error fetching grades:', error);
    res.status(500).json({ error: 'Failed to fetch grades', message: error.message });
  }
};

// GET grades by semester
exports.getGradesBySemester = async (req, res) => {
  try {
    const { semester } = req.params;
    const grades = await Grade.findAll({
      where: { semester },
      include: [{ model: Module }],
      order: [['week', 'ASC']]
    });
    res.status(200).json(grades);
  } catch (error) {
    console.error('Error fetching grades:', error);
    res.status(500).json({ error: 'Failed to fetch grades', message: error.message });
  }
};

// CREATE new grade record
exports.createGrade = async (req, res) => {
  try {
    const { moduleId, midExamMarks, quizMarksArray, assignmentMarksArray, finalExamMarks, semester, week } = req.body;

    // Verify module exists
    const module = await Module.findByPk(moduleId);
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    // Calculate weighted grade using individual weights
    const currentGrade = calculateWeightedGradeWithIndividualWeights({
      midExamMarks: midExamMarks || null,
      midExamWeight: module.midExamWeight || 20,
      quizMarksArray: quizMarksArray || [],
      quizWeights: module.quizWeights || [],
      assignmentMarksArray: assignmentMarksArray || [],
      assignmentWeights: module.assignmentWeights || [],
      finalExamMarks: finalExamMarks || null,
      finalExamWeight: module.finalExamWeight || 40
    });

    // Calculate averages from arrays for storage
    const quizMarksAverage = quizMarksArray && quizMarksArray.filter(m => m !== null).length > 0
      ? quizMarksArray.filter(m => m !== null).reduce((a, b) => a + b, 0) / quizMarksArray.filter(m => m !== null).length
      : null;

    const assignmentMarksAverage = assignmentMarksArray && assignmentMarksArray.filter(m => m !== null).length > 0
      ? assignmentMarksArray.filter(m => m !== null).reduce((a, b) => a + b, 0) / assignmentMarksArray.filter(m => m !== null).length
      : null;

    const currentGPA = percentageToGPA(currentGrade);
    const letterGrade = getLetterGrade(currentGrade);
    const riskLevel = getRiskLevel(currentGrade, module.targetGrade);

    const grade = await Grade.create({
      moduleId,
      midExamMarks: midExamMarks || null,
      quizMarksArray: quizMarksArray || [],
      quizMarksAverage: quizMarksAverage || null,
      assignmentMarksArray: assignmentMarksArray || [],
      assignmentMarksAverage: assignmentMarksAverage || null,
      finalExamMarks: finalExamMarks || null,
      currentGPA,
      letterGrade,
      semester: semester || module.semester,
      week: week || 1,
      riskLevel
    });

    res.status(201).json({
      message: 'Grade record created successfully',
      grade,
      currentGrade,
      currentGPA,
      letterGrade,
      riskLevel
    });
  } catch (error) {
    console.error('Error creating grade:', error);
    res.status(500).json({ error: 'Failed to create grade', message: error.message });
  }
};

// UPDATE grade record
exports.updateGrade = async (req, res) => {
  try {
    const grade = await Grade.findByPk(req.params.id, {
      include: [{ model: Module }]
    });

    if (!grade) {
      return res.status(404).json({ error: 'Grade record not found' });
    }

    // Update the grade
    const { midExamMarks, quizMarks, assignmentMarks, finalExamMarks } = req.body;

    // Recalculate if marks are provided
    let updateData = { ...req.body };
    
    if (midExamMarks !== undefined || quizMarks !== undefined || assignmentMarks !== undefined || finalExamMarks !== undefined) {
      const module = grade.Module || await Module.findByPk(grade.moduleId);
      if (!module) {
        return res.status(404).json({ error: 'Module not found' });
      }

      const currentGrade = calculateWeightedGrade({
        midExamMarks: midExamMarks !== undefined ? midExamMarks : grade.midExamMarks,
        quizMarks: quizMarks !== undefined ? quizMarks : grade.quizMarks,
        assignmentMarks: assignmentMarks !== undefined ? assignmentMarks : grade.assignmentMarks,
        finalExamMarks: finalExamMarks !== undefined ? finalExamMarks : grade.finalExamMarks,
        midExamWeight: 30,
        quizWeight: 20,
        assignmentWeight: 20,
        finalExamWeight: 30
      });

      updateData.currentGPA = percentageToGPA(currentGrade);
      updateData.letterGrade = getLetterGrade(currentGrade);
      updateData.riskLevel = getRiskLevel(currentGrade, module.targetGrade);
    }

    await grade.update(updateData);

    res.status(200).json({
      message: 'Grade updated successfully',
      grade
    });
  } catch (error) {
    console.error('Error updating grade:', error);
    res.status(500).json({ error: 'Failed to update grade', message: error.message });
  }
};

// DELETE grade record
exports.deleteGrade = async (req, res) => {
  try {
    const grade = await Grade.findByPk(req.params.id);
    if (!grade) {
      return res.status(404).json({ error: 'Grade record not found' });
    }

    await grade.destroy();
    res.status(200).json({ message: 'Grade record deleted successfully' });
  } catch (error) {
    console.error('Error deleting grade:', error);
    res.status(500).json({ error: 'Failed to delete grade', message: error.message });
  }
};

// GET GPA statistics
exports.getGPAStatistics = async (req, res) => {
  try {
    const { semester } = req.query;
    const where = {};
    if (semester) where.semester = semester;

    const grades = await Grade.findAll({
      where,
      include: [{ model: Module }]
    });

    if (grades.length === 0) {
      return res.status(200).json({
        semesterGPA: 0,
        averageGrade: 0,
        highestGrade: null,
        lowestGrade: null,
        totalModules: 0
      });
    }

    const semesterGPA = calculateSemesterGPA(grades);
    const gpaValues = grades.map(g => g.currentGPA);
    const highestGrade = Math.max(...gpaValues);
    const lowestGrade = Math.min(...gpaValues);
    const averageGrade = Math.round((gpaValues.reduce((a, b) => a + b, 0) / gpaValues.length) * 100) / 100;

    res.status(200).json({
      semesterGPA,
      averageGrade,
      highestGrade,
      lowestGrade,
      totalModules: grades.length,
      details: grades
    });
  } catch (error) {
    console.error('Error fetching GPA statistics:', error);
    res.status(500).json({ error: 'Failed to fetch GPA statistics', message: error.message });
  }
};

// GET GPA trend data
exports.getGPATrend = async (req, res) => {
  try {
    const grades = await Grade.findAll({
      include: [{ model: Module }],
      order: [['semester', 'ASC'], ['week', 'ASC']]
    });

    const trendData = generateGPATrend(grades);

    res.status(200).json({
      message: 'GPA trend data retrieved successfully',
      trend: trendData
    });
  } catch (error) {
    console.error('Error fetching GPA trend:', error);
    res.status(500).json({ error: 'Failed to fetch GPA trend', message: error.message });
  }
};

// GET risk analysis
exports.getRiskAnalysis = async (req, res) => {
  try {
    const { semester } = req.query;
    const where = {};
    if (semester) where.semester = semester;

    const grades = await Grade.findAll({
      where,
      include: [{ model: Module }]
    });

    const riskByModule = grades.map(grade => {
      const currentPercent = calculateWeightedGrade({
        midExamMarks: grade.midExamMarks,
        quizMarks: grade.quizMarks,
        assignmentMarks: grade.assignmentMarks,
        finalExamMarks: grade.finalExamMarks,
        midExamWeight: grade.midExamWeight ?? 30,
        quizWeight: grade.quizWeight ?? 20,
        assignmentWeight: grade.assignmentWeight ?? 20,
        finalExamWeight: grade.finalExamWeight ?? 30
      });

      const currentGPA = percentageToGPA(currentPercent);
      const letterGrade = getLetterGrade(currentPercent);
      const targetPercent = grade.Module.targetGrade;
      const riskLevel = getRiskLevel(currentPercent, targetPercent);

      return {
        moduleCode: grade.Module.moduleCode,
        moduleName: grade.Module.moduleName,
        currentPercent,
        targetPercent,
        currentGPA,
        riskLevel,
        letterGrade
      };
    });

    const riskSummary = {
      high: riskByModule.filter(r => r.riskLevel === 'high').length,
      medium: riskByModule.filter(r => r.riskLevel === 'medium').length,
      low: riskByModule.filter(r => r.riskLevel === 'low').length
    };

    res.status(200).json({
      riskSummary,
      details: riskByModule
    });
  } catch (error) {
    console.error('Error fetching risk analysis:', error);
    res.status(500).json({ error: 'Failed to fetch risk analysis', message: error.message });
  }
};

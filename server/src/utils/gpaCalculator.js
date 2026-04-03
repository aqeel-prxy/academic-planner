// GPA Calculation utilities

/**
 * Convert percentage to GPA (0-4.0 scale)
 */
function percentageToGPA(percentage) {
  if (percentage >= 90) return 4.0;
  if (percentage >= 85) return 3.9;
  if (percentage >= 80) return 3.8;
  if (percentage >= 75) return 3.7;
  if (percentage >= 70) return 3.5;
  if (percentage >= 65) return 3.0;
  if (percentage >= 60) return 2.5;
  if (percentage >= 55) return 2.0;
  if (percentage >= 50) return 1.5;
  return 0;
}

/**
 * Convert percentage to letter grade
 */
function getLetterGrade(percentage) {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  if (percentage >= 50) return 'E';
  return 'F';
}

/**
 * Calculate weighted grade with individual assessment weights
 */
function calculateWeightedGradeWithIndividualWeights(marks) {
  const { 
    midExamMarks, 
    midExamWeight, 
    quizMarksArray, 
    quizWeights,
    assignmentMarksArray, 
    assignmentWeights,
    finalExamMarks, 
    finalExamWeight 
  } = marks;
  
  let totalMarks = 0;
  let totalWeight = 0;

  // Mid Exam
  if (midExamMarks !== null && midExamMarks !== undefined) {
    totalMarks += midExamMarks * (midExamWeight / 100);
    totalWeight += midExamWeight;
  }

  // Quizzes with individual weights
  if (quizMarksArray && quizMarksArray.length > 0 && quizWeights && quizWeights.length > 0) {
    let quizTotalMarks = 0;
    let quizTotalWeight = 0;
    
    quizMarksArray.forEach((mark, idx) => {
      if (mark !== null && mark !== undefined) {
        const weight = parseFloat(quizWeights[idx] || 0);
        quizTotalMarks += mark * (weight / 100);
        quizTotalWeight += weight;
      }
    });

    if (quizTotalWeight > 0) {
      const avgQuizMarks = (quizTotalMarks * 100) / quizTotalWeight;
      totalMarks += avgQuizMarks * (quizTotalWeight / 100);
      totalWeight += quizTotalWeight;
    }
  }

  // Assignments with individual weights
  if (assignmentMarksArray && assignmentMarksArray.length > 0 && assignmentWeights && assignmentWeights.length > 0) {
    let assignmentTotalMarks = 0;
    let assignmentTotalWeight = 0;
    
    assignmentMarksArray.forEach((mark, idx) => {
      if (mark !== null && mark !== undefined) {
        const weight = parseFloat(assignmentWeights[idx] || 0);
        assignmentTotalMarks += mark * (weight / 100);
        assignmentTotalWeight += weight;
      }
    });

    if (assignmentTotalWeight > 0) {
      const avgAssignmentMarks = (assignmentTotalMarks * 100) / assignmentTotalWeight;
      totalMarks += avgAssignmentMarks * (assignmentTotalWeight / 100);
      totalWeight += assignmentTotalWeight;
    }
  }

  // Final Exam
  if (finalExamMarks !== null && finalExamMarks !== undefined) {
    totalMarks += finalExamMarks * (finalExamWeight / 100);
    totalWeight += finalExamWeight;
  }

  if (totalWeight === 0) return 0;

  const weightedPercent = (totalMarks * 100) / totalWeight;
  return Math.round(weightedPercent * 100) / 100;
}

/**
 * Calculate weighted grade
 */
function calculateWeightedGrade(marks) {
  const { midExamMarks, midExamWeight, quizMarks, quizWeight, assignmentMarks, assignmentWeight, finalExamMarks, finalExamWeight } = marks;
  
  let totalMarks = 0;
  let totalWeight = 0;

  if (midExamMarks !== null && midExamMarks !== undefined) {
    totalMarks += midExamMarks * (midExamWeight / 100);
    totalWeight += midExamWeight;
  }

  if (quizMarks !== null && quizMarks !== undefined) {
    totalMarks += quizMarks * (quizWeight / 100);
    totalWeight += quizWeight;
  }

  if (assignmentMarks !== null && assignmentMarks !== undefined) {
    totalMarks += assignmentMarks * (assignmentWeight / 100);
    totalWeight += assignmentWeight;
  }

  if (finalExamMarks !== null && finalExamMarks !== undefined) {
    totalMarks += finalExamMarks * (finalExamWeight / 100);
    totalWeight += finalExamWeight;
  }

  if (totalWeight === 0) return 0;

  // `totalMarks` is already in percentage-units because each component is scaled by (weight / 100).
  // Normalize by the sum of included weights to support partial mark entries.
  const weightedPercent = (totalMarks * 100) / totalWeight;
  return Math.round(weightedPercent * 100) / 100;
}

/**
 * Determine risk level based on current vs target grade
 */
function getRiskLevel(currentGrade, targetGrade) {
  const difference = targetGrade - currentGrade;
  
  if (difference <= 0) return 'low'; // Current >= Target
  if (difference <= 10) return 'medium'; // Current 10% below target
  return 'high'; // Current >10% below target
}

/**
 * Calculate semester GPA from multiple modules
 */
function calculateSemesterGPA(grades) {
  if (!grades || grades.length === 0) return 0;
  
  const totalGPA = grades.reduce((sum, grade) => sum + grade.currentGPA, 0);
  return Math.round((totalGPA / grades.length) * 100) / 100;
}

/**
 * Generate GPA trend data
 */
function generateGPATrend(gradesHistory) {
  if (!gradesHistory || gradesHistory.length === 0) return [];
  
  // Group by semester and week
  const trendData = {};
  
  gradesHistory.forEach(record => {
    const key = `Sem ${record.semester}-W${record.week}`;
    if (!trendData[key]) {
      trendData[key] = [];
    }
    trendData[key].push(record.currentGPA);
  });

  // Calculate average GPA for each period
  return Object.entries(trendData).map(([period, gpas]) => ({
    period,
    gpa: Math.round((gpas.reduce((a, b) => a + b, 0) / gpas.length) * 100) / 100
  }));
}

module.exports = {
  percentageToGPA,
  getLetterGrade,
  calculateWeightedGrade,
  calculateWeightedGradeWithIndividualWeights,
  getRiskLevel,
  calculateSemesterGPA,
  generateGPATrend
};

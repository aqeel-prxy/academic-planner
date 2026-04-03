import React, { useState, useEffect, useCallback } from 'react';
import './grades.css';

function UpdateModuleProgress({ modules, onSubmit, loading, initialModuleId }) {
  const [formData, setFormData] = useState({
    moduleId: '',
    midExamMarks: '',
    quizMarksArray: [],
    assignmentMarksArray: [],
    finalExamMarks: '',
    semester: '',
    week: 1
  });

  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);

  // Get the selected module details
  useEffect(() => {
    if (formData.moduleId) {
      const module = modules.find(m => m.id === formData.moduleId);
      setSelectedModule(module);
      
      // Initialize quiz and assignment arrays
      if (module) {
        setFormData(prev => ({
          ...prev,
          quizMarksArray: new Array(module.numberOfQuizzes || 0).fill(''),
          assignmentMarksArray: new Array(module.numberOfAssignments || 0).fill('')
        }));
      }
    }
  }, [formData.moduleId, modules]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.moduleId) newErrors.moduleId = 'Module is required';
    
    // Check if at least one mark is entered
    const hasMarks = 
      formData.midExamMarks !== '' ||
      formData.quizMarksArray.some(m => m !== '') ||
      formData.assignmentMarksArray.some(m => m !== '') ||
      formData.finalExamMarks !== '';
    
    if (!hasMarks) {
      newErrors.marks = 'At least one mark must be entered';
    }
    
    // Validate marks ranges
    if (formData.midExamMarks !== '' && (isNaN(formData.midExamMarks) || formData.midExamMarks < 0 || formData.midExamMarks > 100)) {
      newErrors.midExamMarks = 'Mid Exam marks must be between 0 and 100';
    }

    formData.quizMarksArray.forEach((mark, idx) => {
      if (mark !== '' && (isNaN(mark) || mark < 0 || mark > 100)) {
        newErrors[`quiz_${idx}`] = 'Quiz marks must be between 0 and 100';
      }
    });

    formData.assignmentMarksArray.forEach((mark, idx) => {
      if (mark !== '' && (isNaN(mark) || mark < 0 || mark > 100)) {
        newErrors[`assignment_${idx}`] = 'Assignment marks must be between 0 and 100';
      }
    });

    if (formData.finalExamMarks !== '' && (isNaN(formData.finalExamMarks) || formData.finalExamMarks < 0 || formData.finalExamMarks > 100)) {
      newErrors.finalExamMarks = 'Final Exam marks must be between 0 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'week' ? parseInt(value) : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleModuleChange = (e) => {
    const moduleId = e.target.value;
    const module = modules.find(m => m.id === moduleId);
    setFormData(prev => ({
      ...prev,
      moduleId,
      semester: module ? module.semester : '',
      quizMarksArray: new Array(module?.numberOfQuizzes || 0).fill(''),
      assignmentMarksArray: new Array(module?.numberOfAssignments || 0).fill('')
    }));
    if (errors.moduleId) {
      setErrors(prev => ({ ...prev, moduleId: '' }));
    }
  };

  const handleQuizChange = (index, value) => {
    const newArray = [...formData.quizMarksArray];
    newArray[index] = value;
    setFormData(prev => ({
      ...prev,
      quizMarksArray: newArray
    }));
    if (errors[`quiz_${index}`]) {
      const newErrors = { ...errors };
      delete newErrors[`quiz_${index}`];
      setErrors(newErrors);
    }
  };

  const handleAssignmentChange = (index, value) => {
    const newArray = [...formData.assignmentMarksArray];
    newArray[index] = value;
    setFormData(prev => ({
      ...prev,
      assignmentMarksArray: newArray
    }));
    if (errors[`assignment_${index}`]) {
      const newErrors = { ...errors };
      delete newErrors[`assignment_${index}`];
      setErrors(newErrors);
    }
  };

  const calculateGPA = useCallback(() => {
    if (!selectedModule) return null;

    let totalMarks = 0;
    let totalWeight = 0;

    // Mid Exam
    if (formData.midExamMarks !== '') {
      const midMarks = parseFloat(formData.midExamMarks);
      const midWeight = selectedModule.midExamWeight || 0;
      totalMarks += midMarks * (midWeight / 100);
      totalWeight += midWeight;
    }

    // Quizzes - use individual quiz weights
    if (selectedModule.numberOfQuizzes > 0 && formData.quizMarksArray && formData.quizMarksArray.length > 0) {
      const quizWeights = selectedModule.quizWeights || [];
      let totalQuizMarks = 0;
      let totalQuizWeight = 0;

      formData.quizMarksArray.forEach((mark, idx) => {
        if (mark !== '') {
          const quizMark = parseFloat(mark);
          const quizWeight = parseFloat(quizWeights[idx] || 0);
          totalQuizMarks += quizMark * (quizWeight / 100);
          totalQuizWeight += quizWeight;
        }
      });

      if (totalQuizWeight > 0) {
        const avgQuizMarks = (totalQuizMarks * 100) / totalQuizWeight;
        totalMarks += avgQuizMarks * (totalQuizWeight / 100);
        totalWeight += totalQuizWeight;
      }
    }

    // Assignments - use individual assignment weights
    if (selectedModule.numberOfAssignments > 0 && formData.assignmentMarksArray && formData.assignmentMarksArray.length > 0) {
      const assignmentWeights = selectedModule.assignmentWeights || [];
      let totalAssignmentMarks = 0;
      let totalAssignmentWeight = 0;

      formData.assignmentMarksArray.forEach((mark, idx) => {
        if (mark !== '') {
          const assignmentMark = parseFloat(mark);
          const assignmentWeight = parseFloat(assignmentWeights[idx] || 0);
          totalAssignmentMarks += assignmentMark * (assignmentWeight / 100);
          totalAssignmentWeight += assignmentWeight;
        }
      });

      if (totalAssignmentWeight > 0) {
        const avgAssignmentMarks = (totalAssignmentMarks * 100) / totalAssignmentWeight;
        totalMarks += avgAssignmentMarks * (totalAssignmentWeight / 100);
        totalWeight += totalAssignmentWeight;
      }
    }

    // Final Exam
    if (formData.finalExamMarks !== '') {
      const finalMarks = parseFloat(formData.finalExamMarks);
      const finalWeight = selectedModule.finalExamWeight || 0;
      totalMarks += finalMarks * (finalWeight / 100);
      totalWeight += finalWeight;
    }

    if (totalWeight === 0) return null;

    const weightedPercent = (totalMarks * 100) / totalWeight;
    let gpa = 0;
    if (weightedPercent >= 90) gpa = 4.0;
    else if (weightedPercent >= 85) gpa = 3.9;
    else if (weightedPercent >= 80) gpa = 3.8;
    else if (weightedPercent >= 75) gpa = 3.7;
    else if (weightedPercent >= 70) gpa = 3.5;
    else if (weightedPercent >= 65) gpa = 3.0;
    else if (weightedPercent >= 60) gpa = 2.5;
    else if (weightedPercent >= 55) gpa = 2.0;
    else if (weightedPercent >= 50) gpa = 1.5;

    return {
      grade: Math.round(weightedPercent * 100) / 100,
      gpa: gpa,
      letterGrade: weightedPercent >= 90 ? 'A' : weightedPercent >= 80 ? 'B' : weightedPercent >= 70 ? 'C' : weightedPercent >= 60 ? 'D' : weightedPercent >= 50 ? 'E' : 'F'
    };
  }, [formData, selectedModule]);

  useEffect(() => {
    setPreview(calculateGPA());
  }, [calculateGPA]);

  useEffect(() => {
    if (initialModuleId === undefined) return;
    const mod = modules.find(m => m.id === initialModuleId);
    setFormData(prev => ({
      ...prev,
      moduleId: initialModuleId || '',
      semester: mod ? mod.semester : '',
      midExamMarks: '',
      quizMarksArray: new Array(mod?.numberOfQuizzes || 0).fill(''),
      assignmentMarksArray: new Array(mod?.numberOfAssignments || 0).fill(''),
      finalExamMarks: '',
      week: 1
    }));
    setErrors({});
  }, [initialModuleId, modules]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const submitData = {
        moduleId: formData.moduleId,
        midExamMarks: formData.midExamMarks === '' ? null : parseFloat(formData.midExamMarks),
        quizMarksArray: formData.quizMarksArray.map(m => m === '' ? null : parseFloat(m)),
        assignmentMarksArray: formData.assignmentMarksArray.map(m => m === '' ? null : parseFloat(m)),
        finalExamMarks: formData.finalExamMarks === '' ? null : parseFloat(formData.finalExamMarks),
        semester: formData.semester ? parseInt(formData.semester) : undefined,
        week: formData.week
      };
      onSubmit(submitData);
      setFormData({
        moduleId: '',
        midExamMarks: '',
        quizMarksArray: [],
        assignmentMarksArray: [],
        finalExamMarks: '',
        semester: '',
        week: 1
      });
    }
  };

  return (
    <div className="module-form-card">
      <h3>Update Module Progress</h3>
      <form onSubmit={handleSubmit}>
        {/* Module Selection */}
        <div className="form-group-vertical">
          <label>Select Module *</label>
          <select value={formData.moduleId} onChange={handleModuleChange} className={errors.moduleId ? 'error' : ''}>
            <option value="">-- Please select a module --</option>
            {modules.map(module => (
              <option key={module.id} value={module.id}>
                {module.moduleCode} - {module.moduleName}
              </option>
            ))}
          </select>
          {errors.moduleId && <span className="error-msg">{errors.moduleId}</span>}
        </div>

        {/* Week Selection - For GPA Trend Chart Weekly Updates */}
        <div className="form-group-vertical">
          <label>Week *</label>
          <input
            type="number"
            name="week"
            value={formData.week}
            onChange={handleChange}
            min="1"
            max="52"
            placeholder="Enter week number (1-52)"
            className="form-control"
          />
        </div>

        {/* Show errors if any */}
        {errors.marks && <span className="error-msg" style={{ marginBottom: '10px', display: 'block' }}>{errors.marks}</span>}

        {/* Module Assessment Fields - Only show if module is selected */}
        {selectedModule && (
          <>
            <div className="form-section">
              <h4>Enter Assessment Marks</h4>

              {/* Mid Exam */}
              {selectedModule.midExamWeight > 0 && (
                <div className="form-group-vertical">
                  <label>Mid Exam Marks (Weight: {selectedModule.midExamWeight}%)</label>
                  <input
                    type="number"
                    value={formData.midExamMarks}
                    onChange={(e) => setFormData(prev => ({ ...prev, midExamMarks: e.target.value }))}
                    min="0"
                    max="100"
                    step="0.5"
                    placeholder="0 - 100"
                    className={errors.midExamMarks ? 'error' : ''}
                  />
                  {errors.midExamMarks && <span className="error-msg">{errors.midExamMarks}</span>}
                </div>
              )}

              {/* Quizzes */}
              {selectedModule.numberOfQuizzes > 0 && (
                <div className="assessment-group">
                  <h5>Quizzes</h5>
                  {formData.quizMarksArray.map((mark, idx) => {
                    const quizWeight = (selectedModule.quizWeights && selectedModule.quizWeights[idx]) || 0;
                    return (
                      <div key={`quiz-${idx}`} className="form-group-vertical">
                        <label>
                          {selectedModule.numberOfQuizzes === 1 
                            ? `Quiz Marks (Weight: ${quizWeight}%)` 
                            : `Quiz ${idx + 1} Marks (Weight: ${quizWeight}%)`}
                        </label>
                        <input
                          type="number"
                          value={mark}
                          onChange={(e) => handleQuizChange(idx, e.target.value)}
                          min="0"
                          max="100"
                          step="0.5"
                          placeholder="0 - 100"
                          className={errors[`quiz_${idx}`] ? 'error' : ''}
                        />
                        {errors[`quiz_${idx}`] && <span className="error-msg">{errors[`quiz_${idx}`]}</span>}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Assignments */}
              {selectedModule.numberOfAssignments > 0 && (
                <div className="assessment-group">
                  <h5>Assignments</h5>
                  {formData.assignmentMarksArray.map((mark, idx) => {
                    const assignmentWeight = (selectedModule.assignmentWeights && selectedModule.assignmentWeights[idx]) || 0;
                    return (
                      <div key={`assignment-${idx}`} className="form-group-vertical">
                        <label>
                          {selectedModule.numberOfAssignments === 1 
                            ? `Assignment Marks (Weight: ${assignmentWeight}%)` 
                            : `Assignment ${idx + 1} Marks (Weight: ${assignmentWeight}%)`}
                        </label>
                        <input
                          type="number"
                          value={mark}
                          onChange={(e) => handleAssignmentChange(idx, e.target.value)}
                          min="0"
                          max="100"
                          step="0.5"
                          placeholder="0 - 100"
                          className={errors[`assignment_${idx}`] ? 'error' : ''}
                        />
                        {errors[`assignment_${idx}`] && <span className="error-msg">{errors[`assignment_${idx}`]}</span>}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Final Exam */}
              {selectedModule.finalExamWeight > 0 && (
                <div className="form-group-vertical">
                  <label>Final Exam Marks (Weight: {selectedModule.finalExamWeight}%)</label>
                  <input
                    type="number"
                    value={formData.finalExamMarks}
                    onChange={(e) => setFormData(prev => ({ ...prev, finalExamMarks: e.target.value }))}
                    min="0"
                    max="100"
                    step="0.5"
                    placeholder="0 - 100"
                    className={errors.finalExamMarks ? 'error' : ''}
                  />
                  {errors.finalExamMarks && <span className="error-msg">{errors.finalExamMarks}</span>}
                </div>
              )}
            </div>

            {/* GPA Preview */}
            {preview && (
              <div className="gpa-preview">
                <h4>Calculated GPA</h4>
                <div className="preview-row">
                  <div className="preview-item">
                    <span className="label">Percentage:</span>
                    <span className="value">{preview.grade}%</span>
                  </div>
                  <div className="preview-item">
                    <span className="label">GPA:</span>
                    <span className="value">{preview.gpa.toFixed(2)}</span>
                  </div>
                  <div className="preview-item">
                    <span className="label">Grade:</span>
                    <span className="value grade-letter">{preview.letterGrade}</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <button type="submit" className="btn btn-primary" disabled={loading || !selectedModule}>
          {loading ? 'Updating GPA...' : 'Update GPA'}
        </button>
      </form>
    </div>
  );
}

export default UpdateModuleProgress;

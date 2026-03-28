import React, { useState, useEffect, useCallback } from 'react';
import './grades.css';

function GradeForm({ modules, onSubmit, loading, initialModuleId }) {
  const [formData, setFormData] = useState({
    moduleId: '',
    midExamMarks: '',
    quizMarks: '',
    assignmentMarks: '',
    finalExamMarks: '',
    semester: '',
    week: 1
  });

  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState(null);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.moduleId) newErrors.moduleId = 'Module is required';
    
    const marks = [formData.midExamMarks, formData.quizMarks, formData.assignmentMarks, formData.finalExamMarks];
    if (marks.every(m => m === '')) {
      newErrors.marks = 'At least one mark must be entered';
    }
    
    marks.forEach((mark, idx) => {
      if (mark !== '' && (isNaN(mark) || mark < 0 || mark > 100)) {
        const names = ['midExamMarks', 'quizMarks', 'assignmentMarks', 'finalExamMarks'];
        newErrors[names[idx]] = 'Marks must be between 0 and 100';
      }
    });

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
      semester: module ? module.semester : ''
    }));
    if (errors.moduleId) {
      setErrors(prev => ({ ...prev, moduleId: '' }));
    }
  };

  const calculatePreview = useCallback(() => {
    const marks = {
      midExamMarks: parseFloat(formData.midExamMarks) || 0,
      quizMarks: parseFloat(formData.quizMarks) || 0,
      assignmentMarks: parseFloat(formData.assignmentMarks) || 0,
      finalExamMarks: parseFloat(formData.finalExamMarks) || 0,
      midExamWeight: 30,
      quizWeight: 20,
      assignmentWeight: 20,
      finalExamWeight: 30
    };

    let totalMarks = 0;
    let totalWeight = 0;

    if (formData.midExamMarks !== '') {
      totalMarks += marks.midExamMarks * 0.3;
      totalWeight += 30;
    }
    if (formData.quizMarks !== '') {
      totalMarks += marks.quizMarks * 0.2;
      totalWeight += 20;
    }
    if (formData.assignmentMarks !== '') {
      totalMarks += marks.assignmentMarks * 0.2;
      totalWeight += 20;
    }
    if (formData.finalExamMarks !== '') {
      totalMarks += marks.finalExamMarks * 0.3;
      totalWeight += 30;
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
  }, [formData.midExamMarks, formData.quizMarks, formData.assignmentMarks, formData.finalExamMarks]);

  useEffect(() => {
    setPreview(calculatePreview());
  }, [calculatePreview]);

  useEffect(() => {
    if (initialModuleId === undefined) return;
    const mod = modules.find(m => m.id === initialModuleId);

    setFormData(prev => ({
      ...prev,
      moduleId: initialModuleId || '',
      semester: mod ? mod.semester : '',
      midExamMarks: '',
      quizMarks: '',
      assignmentMarks: '',
      finalExamMarks: '',
      week: 1
    }));
    setErrors({});
  }, [initialModuleId, modules]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const submitData = {
        ...formData,
        moduleId: formData.moduleId,
        semester: formData.semester ? parseInt(formData.semester) : undefined
      };
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === '') submitData[key] = null;
      });
      onSubmit(submitData);
      setFormData({
        moduleId: '',
        midExamMarks: '',
        quizMarks: '',
        assignmentMarks: '',
        finalExamMarks: '',
        semester: '',
        week: 1
      });
    }
  };

  return (
    <div className="grade-form-card">
      <h3>Add Grades</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group full-width">
            <label>Select Module *</label>
            <select
              name="moduleId"
              value={formData.moduleId}
              onChange={handleModuleChange}
              className={errors.moduleId ? 'error' : ''}
            >
              <option value="">-- Select Module --</option>
              {modules.map(module => (
                <option key={module.id} value={module.id}>
                  {module.moduleCode} - {module.moduleName}
                </option>
              ))}
            </select>
            {errors.moduleId && <span className="error-msg">{errors.moduleId}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Mid Exam Marks (30%)</label>
            <input
              type="number"
              name="midExamMarks"
              value={formData.midExamMarks}
              onChange={handleChange}
              placeholder="0-100"
              min="0"
              max="100"
              step="0.5"
              className={errors.midExamMarks ? 'error' : ''}
            />
            {errors.midExamMarks && <span className="error-msg">{errors.midExamMarks}</span>}
          </div>

          <div className="form-group">
            <label>Quiz Marks (20%)</label>
            <input
              type="number"
              name="quizMarks"
              value={formData.quizMarks}
              onChange={handleChange}
              placeholder="0-100"
              min="0"
              max="100"
              step="0.5"
              className={errors.quizMarks ? 'error' : ''}
            />
            {errors.quizMarks && <span className="error-msg">{errors.quizMarks}</span>}
          </div>

          <div className="form-group">
            <label>Assignment Marks (20%)</label>
            <input
              type="number"
              name="assignmentMarks"
              value={formData.assignmentMarks}
              onChange={handleChange}
              placeholder="0-100"
              min="0"
              max="100"
              step="0.5"
              className={errors.assignmentMarks ? 'error' : ''}
            />
            {errors.assignmentMarks && <span className="error-msg">{errors.assignmentMarks}</span>}
          </div>

          <div className="form-group">
            <label>Final Exam Marks (30%)</label>
            <input
              type="number"
              name="finalExamMarks"
              value={formData.finalExamMarks}
              onChange={handleChange}
              placeholder="0-100"
              min="0"
              max="100"
              step="0.5"
              className={errors.finalExamMarks ? 'error' : ''}
            />
            {errors.finalExamMarks && <span className="error-msg">{errors.finalExamMarks}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Week</label>
            <input
              type="number"
              name="week"
              value={formData.week}
              onChange={handleChange}
              min="1"
              max="52"
            />
          </div>
        </div>

        {errors.marks && <span className="error-msg">{errors.marks}</span>}

        {preview && (
          <div className="grade-preview">
            <h4>Calculated Grade Preview</h4>
            <div className="preview-grid">
              <div>
                <span className="preview-label">Weighted Grade:</span>
                <span className="preview-value">{preview.grade.toFixed(2)}%</span>
              </div>
              <div>
                <span className="preview-label">GPA:</span>
                <span className="preview-value">{preview.gpa.toFixed(2)}</span>
              </div>
              <div>
                <span className="preview-label">Letter Grade:</span>
                <span className="preview-value">{preview.letterGrade}</span>
              </div>
            </div>
          </div>
        )}

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Adding Grades...' : 'Add Grades'}
        </button>
      </form>
    </div>
  );
}

export default GradeForm;

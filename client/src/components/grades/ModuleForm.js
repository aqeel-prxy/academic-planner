import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../services/api';
import './grades.css';

const LOOKUP_DEBOUNCE_MS = 450;

function getInitialFormState() {
  return {
    moduleCode: '',
    moduleName: '',
    credits: 3,
    semester: 1,
    year: 1,
    targetGrade: 70,
    midExamWeight: 20,
    numberOfQuizzes: 0,
    quizWeights: [],
    numberOfAssignments: 0,
    assignmentWeights: [],
    finalExamWeight: 40
  };
}

/** Prefer match by non-empty module code, then by module name (case-insensitive). */
function findMatchingModule(modules, moduleCodeRaw, moduleNameRaw) {
  if (!modules || !modules.length) return null;
  const code = moduleCodeRaw.trim();
  const name = moduleNameRaw.trim();
  if (code) {
    const byCode = modules.find(
      (m) => m.moduleCode && m.moduleCode.toLowerCase() === code.toLowerCase()
    );
    if (byCode) return byCode;
  }
  if (name) {
    const byName = modules.find(
      (m) => m.moduleName && m.moduleName.toLowerCase() === name.toLowerCase()
    );
    if (byName) return byName;
  }
  return null;
}

function buildFormFromModule(m) {
  return {
    moduleCode: m.moduleCode || '',
    moduleName: m.moduleName || '',
    credits: m.credits ?? 3,
    semester: m.semester ?? 1,
    year: m.year ?? 1,
    targetGrade: m.targetGrade ?? 70,
    midExamWeight: m.midExamWeight ?? 20,
    numberOfQuizzes: m.numberOfQuizzes ?? 0,
    quizWeights: Array.isArray(m.quizWeights) ? m.quizWeights : [],
    numberOfAssignments: m.numberOfAssignments ?? 0,
    assignmentWeights: Array.isArray(m.assignmentWeights) ? m.assignmentWeights : [],
    finalExamWeight: m.finalExamWeight ?? 40
  };
}

/** Shape sent to API so every field is persisted with correct types (DB / validation). */
function buildModulePayload(fd) {
  const nq = Math.max(0, parseInt(fd.numberOfQuizzes, 10) || 0);
  const na = Math.max(0, parseInt(fd.numberOfAssignments, 10) || 0);
  const quizWeights = (Array.isArray(fd.quizWeights) ? fd.quizWeights : [])
    .slice(0, nq)
    .map((w) => parseFloat(w) || 0);
  const assignmentWeights = (Array.isArray(fd.assignmentWeights) ? fd.assignmentWeights : [])
    .slice(0, na)
    .map((w) => parseFloat(w) || 0);
  const tg = parseFloat(fd.targetGrade);
  return {
    moduleCode: String(fd.moduleCode || '').trim(),
    moduleName: String(fd.moduleName || '').trim(),
    credits: Math.max(1, parseInt(fd.credits, 10) || 3),
    semester: parseInt(fd.semester, 10) || 1,
    year: Math.max(1, parseInt(fd.year, 10) || 1),
    targetGrade: Number.isFinite(tg) ? tg : 70,
    midExamWeight: parseFloat(fd.midExamWeight) || 0,
    numberOfQuizzes: nq,
    quizWeights,
    numberOfAssignments: na,
    assignmentWeights,
    finalExamWeight: parseFloat(fd.finalExamWeight) || 0
  };
}

function ModuleForm({ onSubmit, loading, onUpdateModule, modules: modulesFromParent }) {
  const [formData, setFormData] = useState(() => getInitialFormState());
  const [errors, setErrors] = useState({});
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState(null);
  const [allModules, setAllModules] = useState([]);
  const lookupTimerRef = useRef(null);

  const moduleList =
    Array.isArray(modulesFromParent) && modulesFromParent.length > 0
      ? modulesFromParent
      : allModules;

  useEffect(() => {
    if (Array.isArray(modulesFromParent) && modulesFromParent.length > 0) return;
    let cancelled = false;
    (async () => {
      try {
        const modules = await api.getModules();
        if (!cancelled) setAllModules(Array.isArray(modules) ? modules : []);
      } catch (error) {
        console.error('Error fetching modules:', error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [modulesFromParent]);

  const clearLookupTimer = useCallback(() => {
    if (lookupTimerRef.current) {
      clearTimeout(lookupTimerRef.current);
      lookupTimerRef.current = null;
    }
  }, []);

  /** When not editing, debounce: if code or name matches an existing module, load it for full edit. */
  useEffect(() => {
    if (editingModuleId) return;

    clearLookupTimer();
    lookupTimerRef.current = setTimeout(() => {
      const code = formData.moduleCode.trim();
      const name = formData.moduleName.trim();
      if (!code && !name) return;

      const match = findMatchingModule(moduleList, formData.moduleCode, formData.moduleName);
      if (match) {
        setFormData(buildFormFromModule(match));
        setEditingModuleId(match.id);
        setIsUpdateMode(true);
      }
    }, LOOKUP_DEBOUNCE_MS);

    return clearLookupTimer;
  }, [
    formData.moduleCode,
    formData.moduleName,
    moduleList,
    editingModuleId,
    clearLookupTimer
  ]);

  /** Immediate match when leaving code or name (debounce alone can feel delayed). */
  const handleModuleIdentifierBlur = useCallback(() => {
    if (editingModuleId) return;
    clearLookupTimer();
    const code = formData.moduleCode.trim();
    const name = formData.moduleName.trim();
    if (!code && !name) return;
    const match = findMatchingModule(moduleList, formData.moduleCode, formData.moduleName);
    if (!match) return;
    setFormData(buildFormFromModule(match));
    setEditingModuleId(match.id);
    setIsUpdateMode(true);
  }, [
    editingModuleId,
    moduleList,
    formData.moduleCode,
    formData.moduleName,
    clearLookupTimer
  ]);

  /** Clear both identifiers after loading a module → exit edit mode and reset form. Does not reset while adding a new module (editingModuleId null). */
  useEffect(() => {
    const code = formData.moduleCode.trim();
    const name = formData.moduleName.trim();
    if (code || name) return;
    clearLookupTimer();
    if (!editingModuleId) return;
    setEditingModuleId(null);
    setIsUpdateMode(false);
    setFormData(getInitialFormState());
  }, [formData.moduleCode, formData.moduleName, editingModuleId, clearLookupTimer]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.moduleCode.trim()) newErrors.moduleCode = 'Module code is required';
    if (!formData.moduleName.trim()) newErrors.moduleName = 'Module name is required';
    if (formData.credits < 1) newErrors.credits = 'Credits must be at least 1';
    if (formData.targetGrade < 0 || formData.targetGrade > 100)
      newErrors.targetGrade = 'Target grade must be between 0 and 100';

    const midExamWeight = parseFloat(formData.midExamWeight) || 0;
    const quizWeightsSum = formData.quizWeights.reduce((a, b) => a + parseFloat(b || 0), 0);
    const assignmentWeightsSum = formData.assignmentWeights.reduce(
      (a, b) => a + parseFloat(b || 0),
      0
    );
    const finalExamWeight = parseFloat(formData.finalExamWeight) || 0;
    const totalWeight = midExamWeight + quizWeightsSum + assignmentWeightsSum + finalExamWeight;

    if (Math.abs(totalWeight - 100) > 0.01) {
      newErrors.weights = `Weights must sum to 100%. Current total: ${totalWeight.toFixed(2)}%`;
    }

    if (formData.numberOfQuizzes < 0) newErrors.numberOfQuizzes = 'Number of quizzes cannot be negative';
    if (formData.numberOfAssignments < 0)
      newErrors.numberOfAssignments = 'Number of assignments cannot be negative';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ['credits', 'year', 'numberOfQuizzes', 'numberOfAssignments', 'semester'].includes(name)
        ? parseInt(value, 10)
        : ['targetGrade', 'midExamWeight', 'finalExamWeight'].includes(name)
          ? parseFloat(value)
          : value
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleNumberOfQuizzesChange = (e) => {
    const num = parseInt(e.target.value, 10);
    const newWeights = new Array(num).fill('');
    setFormData((prev) => ({
      ...prev,
      numberOfQuizzes: num,
      quizWeights: newWeights
    }));
    if (errors.numberOfQuizzes) {
      setErrors((prev) => ({ ...prev, numberOfQuizzes: '' }));
    }
  };

  const handleNumberOfAssignmentsChange = (e) => {
    const num = parseInt(e.target.value, 10);
    const newWeights = new Array(num).fill('');
    setFormData((prev) => ({
      ...prev,
      numberOfAssignments: num,
      assignmentWeights: newWeights
    }));
    if (errors.numberOfAssignments) {
      setErrors((prev) => ({ ...prev, numberOfAssignments: '' }));
    }
  };

  const handleQuizWeightChange = (index, value) => {
    const newWeights = [...formData.quizWeights];
    newWeights[index] = value;
    setFormData((prev) => ({
      ...prev,
      quizWeights: newWeights
    }));
  };

  const handleAssignmentWeightChange = (index, value) => {
    const newWeights = [...formData.assignmentWeights];
    newWeights[index] = value;
    setFormData((prev) => ({
      ...prev,
      assignmentWeights: newWeights
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = buildModulePayload(formData);
    if (isUpdateMode && editingModuleId) {
      onUpdateModule({ id: editingModuleId, ...payload });
    } else {
      onSubmit(payload);
    }

    clearLookupTimer();
    setFormData(getInitialFormState());
    setIsUpdateMode(false);
    setEditingModuleId(null);
  };

  return (
    <div className="module-form-card">
      <h3>{isUpdateMode ? 'Edit Module' : 'Add New Module'}</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <div className="form-group-vertical">
            <label>Module Code *</label>
            <input
              type="text"
              name="moduleCode"
              value={formData.moduleCode}
              onChange={handleChange}
              onBlur={handleModuleIdentifierBlur}
              placeholder="e.g., CS101"
              className={errors.moduleCode ? 'error' : ''}
            />
            {errors.moduleCode && <span className="error-msg">{errors.moduleCode}</span>}
          </div>

          <div className="form-group-vertical">
            <label>Module Name *</label>
            <input
              type="text"
              name="moduleName"
              value={formData.moduleName}
              onChange={handleChange}
              onBlur={handleModuleIdentifierBlur}
              placeholder="e.g., Data Structures"
              className={errors.moduleName ? 'error' : ''}
            />
            {errors.moduleName && <span className="error-msg">{errors.moduleName}</span>}
          </div>

          <div className="form-row">
            <div className="form-group-vertical">
              <label>Credits</label>
              <input
                type="number"
                name="credits"
                value={formData.credits}
                onChange={handleChange}
                min="1"
                className={errors.credits ? 'error' : ''}
              />
              {errors.credits && <span className="error-msg">{errors.credits}</span>}
            </div>

            <div className="form-group-vertical">
              <label>Semester</label>
              <select name="semester" value={formData.semester} onChange={handleChange}>
                <option value={1}>Semester 1</option>
                <option value={2}>Semester 2</option>
              </select>
            </div>

            <div className="form-group-vertical">
              <label>Year</label>
              <select name="year" value={formData.year} onChange={handleChange}>
                {[1, 2, 3, 4].map((yr) => (
                  <option key={yr} value={yr}>
                    Year {yr}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4>Continuous Assessment Configuration</h4>
          {errors.weights && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#7f1d1d',
                padding: '12px 15px',
                borderRadius: '6px',
                marginBottom: '15px',
                border: '2px solid rgba(239, 68, 68, 0.3)',
                fontWeight: '600',
                fontSize: '1rem'
              }}
            >
              ❌ {errors.weights}
            </div>
          )}

          <div className="form-row">
            <div className="form-group-vertical">
              <label>Mid Exam Weight (%)</label>
              <input
                type="number"
                name="midExamWeight"
                value={formData.midExamWeight}
                onChange={handleChange}
                min="0"
                max="100"
                step="5"
              />
            </div>

            <div className="form-group-vertical">
              <label>Number of Quizzes</label>
              <input
                type="number"
                value={formData.numberOfQuizzes}
                onChange={handleNumberOfQuizzesChange}
                min="0"
                className={errors.numberOfQuizzes ? 'error' : ''}
              />
              {errors.numberOfQuizzes && <span className="error-msg">{errors.numberOfQuizzes}</span>}
            </div>

            <div className="form-group-vertical">
              <label>Final Exam Weight (%)</label>
              <input
                type="number"
                name="finalExamWeight"
                value={formData.finalExamWeight}
                onChange={handleChange}
                min="0"
                max="100"
                step="5"
              />
            </div>
          </div>

          {formData.numberOfQuizzes > 0 && (
            <div className="assessment-group">
              <h5>Quiz Weights</h5>
              <div className="form-row">
                {formData.quizWeights.map((weight, idx) => (
                  <div key={`quiz-weight-${idx}`} className="form-group-vertical">
                    <label>
                      {formData.numberOfQuizzes === 1
                        ? 'Quiz Weight (%)'
                        : `${idx + 1}${getOrdinalSuffix(idx + 1)} Quiz Weight (%)`}
                    </label>
                    <input
                      type="number"
                      value={weight}
                      onChange={(e) => handleQuizWeightChange(idx, e.target.value)}
                      min="0"
                      max="100"
                      step="5"
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="form-group-vertical">
              <label>Number of Assignments</label>
              <input
                type="number"
                value={formData.numberOfAssignments}
                onChange={handleNumberOfAssignmentsChange}
                min="0"
                className={errors.numberOfAssignments ? 'error' : ''}
              />
              {errors.numberOfAssignments && (
                <span className="error-msg">{errors.numberOfAssignments}</span>
              )}
            </div>
          </div>

          {formData.numberOfAssignments > 0 && (
            <div className="assessment-group">
              <h5>Assignment Weights</h5>
              <div className="form-row">
                {formData.assignmentWeights.map((weight, idx) => (
                  <div key={`assignment-weight-${idx}`} className="form-group-vertical">
                    <label>
                      {formData.numberOfAssignments === 1
                        ? 'Assignment Weight (%)'
                        : `${idx + 1}${getOrdinalSuffix(idx + 1)} Assignment Weight (%)`}
                    </label>
                    <input
                      type="number"
                      value={weight}
                      onChange={(e) => handleAssignmentWeightChange(idx, e.target.value)}
                      min="0"
                      max="100"
                      step="5"
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading
            ? isUpdateMode
              ? 'Updating Module...'
              : 'Inserting Module...'
            : isUpdateMode
              ? 'Update Module'
              : 'Insert Module'}
        </button>
      </form>
    </div>
  );
}

function getOrdinalSuffix(num) {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}

export default ModuleForm;

import React, { useMemo, useState, useEffect } from 'react';
import api from '../../services/api';
import ModuleForm from './ModuleForm';
import UpdateModuleProgress from './UpdateModuleProgress';
import GPATrendChart from './GPATrendChart';
import GradesVsTarget from './GradesVsTarget';
import RiskHeatmap from './RiskHeatmap';
import './grades.css';

function calculateWeightedPercent(grade) {
  const entries = [
    { mark: grade?.midExamMarks, weight: grade?.midExamWeight ?? 30 },
    { mark: grade?.quizMarks, weight: grade?.quizWeight ?? 20 },
    { mark: grade?.assignmentMarks, weight: grade?.assignmentWeight ?? 20 },
    { mark: grade?.finalExamMarks, weight: grade?.finalExamWeight ?? 30 }
  ];

  let total = 0;
  let weight = 0;
  for (const e of entries) {
    if (e.mark === null || e.mark === undefined) continue;
    total += Number(e.mark) * (Number(e.weight) / 100);
    weight += Number(e.weight);
  }
  if (weight === 0) return 0;
  return Math.round(((total / weight) * 100) * 10) / 10;
}

function GradeTracker() {
  const [modules, setModules] = useState([]);
  const [grades, setGrades] = useState([]);
  const [gpaStats, setGpaStats] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [riskAnalysis, setRiskAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedModuleId, setSelectedModuleId] = useState('');

  // Fetch all data
  const fetchAllData = async (semester = null) => {
    setLoading(true);
    setError('');
    try {
      const [modulesRes, gradesRes, statsRes, trendRes, riskRes] = await Promise.all([
        api.getModules(),
        api.getGrades(),
        api.getGPAStatistics(semester),
        api.getGPATrend(),
        api.getRiskAnalysis(semester)
      ]);

      setModules(modulesRes);
      setGrades(gradesRes);
      setGpaStats(statsRes);
      if (trendRes.trend) setTrendData(trendRes.trend);
      setRiskAnalysis(riskRes);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load grades data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchAllData();
  }, []);

  // Auto-hide success message after 4 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Handle module update
  const handleUpdateModule = async (moduleData) => {
    setLoading(true);
    try {
      const { id, ...payload } = moduleData;
      await api.updateModule(id, payload);
      setError('');
      setSuccessMessage('Module updated successfully');
      await fetchAllData();
    } catch (err) {
      setError('Failed to update module: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Handle module creation
  const handleCreateModule = async (moduleData) => {
    setLoading(true);
    setError('');
    try {
      console.log('handleCreateModule called with:', moduleData);
      const response = await api.createModule(moduleData);
      console.log('Module creation response:', response);
      setSuccessMessage('Module added successfully');
      console.log('Calling fetchAllData after module creation...');
      await fetchAllData();
      console.log('fetchAllData completed');
    } catch (err) {
      console.error('Module creation failed:', err);
      setError('Failed to create module: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Handle grade creation
  const handleCreateGrade = async (gradeData) => {
    setLoading(true);
    try {
      await api.createGrade(gradeData);
      setError('');
      await fetchAllData();
    } catch (err) {
      setError('Failed to add grade: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Get unique semesters
  // Calculate current year, semester, week
  const calculateAcademicInfo = () => {
    if (modules.length === 0) {
      return { year: '-', semester: '-', week: 1 };
    }
    const maxYear = Math.max(...modules.map(m => m.year || 1));
    const currentSemModules = modules.filter(m => m.year === maxYear).map(m => m.semester || 1);
    const maxSemester = currentSemModules.length > 0 ? Math.max(...currentSemModules) : 1;
    const currentWeek = Math.ceil((new Date().getDate()) / 7);
    return { year: maxYear, semester: maxSemester, week: currentWeek };
  };

  const academicInfo = calculateAcademicInfo();

  const moduleSummaries = useMemo(() => {
    const latestGradeByModule = new Map();
    for (const g of grades) {
      if (!g?.moduleId) continue;
      const existing = latestGradeByModule.get(g.moduleId);
      if (!existing) {
        latestGradeByModule.set(g.moduleId, g);
        continue;
      }
      const existingDate = new Date(existing.createdAt || 0).getTime();
      const nextDate = new Date(g.createdAt || 0).getTime();
      if (nextDate >= existingDate) latestGradeByModule.set(g.moduleId, g);
    }

    const summaries = modules.map(m => {
      const g = latestGradeByModule.get(m.id);
      const currentPercent = g ? calculateWeightedPercent(g) : 0;
      const targetPercent = Number(m.targetGrade ?? 70);

      const diff = targetPercent - currentPercent;
      const status = !g
        ? 'no-data'
        : diff <= 0
          ? 'on-track'
          : diff <= 10
            ? 'warning'
            : 'at-risk';

      return {
        module: m,
        latestGrade: g || null,
        currentPercent,
        targetPercent,
        status
      };
    });

    return summaries.sort((a, b) => {
      const order = { 'at-risk': 0, warning: 1, 'on-track': 2, 'no-data': 3 };
      return order[a.status] - order[b.status];
    });
  }, [modules, grades]);

  const statusCounts = useMemo(() => {
    const counts = { onTrack: 0, warning: 0, atRisk: 0 };
    for (const s of moduleSummaries) {
      if (s.status === 'on-track') counts.onTrack += 1;
      if (s.status === 'warning') counts.warning += 1;
      if (s.status === 'at-risk') counts.atRisk += 1;
    }
    return counts;
  }, [moduleSummaries]);

  const avgPercent = useMemo(() => {
    const withGrades = moduleSummaries.filter(s => s.latestGrade);
    if (withGrades.length === 0) return 0;
    const sum = withGrades.reduce((acc, s) => acc + (s.currentPercent ?? 0), 0);
    return Math.round((sum / withGrades.length) * 10) / 10;
  }, [moduleSummaries]);

  return (
    <div className="grade-tracker-container">
      <div className="gpa-dashboard-hero">
        <div className="gpa-dashboard-hero-left">
          <div className="gpa-dashboard-kicker">
            <span>Semester {academicInfo.semester}</span>
            <span className="dot">•</span>
            <span>Week {academicInfo.week}</span>
          </div>
          <div className="gpa-dashboard-title">GPA Tracker</div>
          <div className="gpa-dashboard-subtitle">
            Current GPA <strong>{(gpaStats?.semesterGPA ?? 0).toFixed(2)}</strong> ·{' '}
            <strong>{statusCounts.warning + statusCounts.atRisk}</strong> modules need attention
          </div>
        </div>
        <div className="gpa-dashboard-hero-right">
          <div className="status-pill good">
            <div className="pill-count">{statusCounts.onTrack}</div>
            <div className="pill-label">On Track</div>
          </div>
          <div className="status-pill warn">
            <div className="pill-count">{statusCounts.warning}</div>
            <div className="pill-label">Warning</div>
          </div>
          <div className="status-pill risk">
            <div className="pill-count">{statusCounts.atRisk}</div>
            <div className="pill-label">At Risk</div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      <div className="gpa-dashboard-stats">
        <div className="gpa-stat-card">
          <div className="stat-top">
            <div className="stat-title">Current GPA</div>
          </div>
          <div className="stat-main">{(gpaStats?.semesterGPA ?? 0).toFixed(2)}</div>
        </div>
        <div className="gpa-stat-card">
          <div className="stat-top">
            <div className="stat-title">At Risk</div>
          </div>
          <div className="stat-main">{statusCounts.atRisk}</div>
        </div>
        <div className="gpa-stat-card">
          <div className="stat-top">
            <div className="stat-title">Modules Tracked</div>
          </div>
          <div className="stat-main">{modules.length}</div>
        </div>
        <div className="gpa-stat-card">
          <div className="stat-top">
            <div className="stat-title">Avg Grade</div>
          </div>
          <div className="stat-main">{avgPercent.toFixed(1)}%</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'input' ? 'active' : ''}`}
          onClick={() => setActiveTab('input')}
        >
          Add Data
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' ? (
        <section className="overview-analytics-shell" aria-label="Overview and analytics">
          <div className="overview-bento">
            <div className="overview-panel overview-panel--trend">
              <GPATrendChart trendData={trendData} />
            </div>

            <div className="overview-panel overview-panel--grades">
              <GradesVsTarget grades={grades} modules={modules} />
            </div>

            <div className="overview-panel overview-panel--risk">
              <RiskHeatmap riskAnalysis={riskAnalysis} modules={modules} />
            </div>

            <div className="overview-panel overview-panel--modules">
              <div className="module-breakdown-card module-breakdown-card--in-overview">
                <div className="module-breakdown-header">
                  <h3>Module breakdown</h3>
                  <div className="module-breakdown-sub">
                    Select a row to jump to Add Data and enter marks.
                  </div>
                </div>

                <div className="module-breakdown-list">
                  {moduleSummaries.map((s) => {
                    const pct = s.currentPercent ?? 0;
                    const target = s.targetPercent ?? 0;
                    const progress = Math.min((pct / Math.max(target, 1)) * 100, 100);
                    return (
                      <div
                        key={s.module.id}
                        className={`module-row status-${s.status}`}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setSelectedModuleId(s.module.id);
                          setActiveTab('input');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            setSelectedModuleId(s.module.id);
                            setActiveTab('input');
                          }
                        }}
                        aria-label={`Add marks for ${s.module.moduleCode}`}
                      >
                        <div className="module-row-left">
                          <div className="module-row-title">
                            <span className="module-row-code">{s.module.moduleCode}</span>
                            <span className="module-row-badge">
                              {s.status === 'on-track'
                                ? 'On Track'
                                : s.status === 'warning'
                                  ? 'Warning'
                                  : s.status === 'at-risk'
                                    ? 'At Risk'
                                    : 'No Data'}
                            </span>
                          </div>
                          <div className="module-row-subtitle">
                            {s.module.moduleName} · {s.module.credits} credits
                          </div>
                        </div>

                        <div className="module-row-right">
                          <div className="module-row-metrics">
                            <span className="metric">{pct.toFixed(1)}%</span>
                            <span className="metric-muted">Target {target.toFixed(0)}%</span>
                          </div>
                          <div className="module-row-bar">
                            <div className="fill" style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {moduleSummaries.length === 0 && (
                    <div className="no-data">Add modules to start tracking GPA.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <div className="input-section">
          <div className="input-grid">
            <div className="input-col">
              <ModuleForm
                onSubmit={handleCreateModule}
                onUpdateModule={handleUpdateModule}
                loading={loading}
                modules={modules}
              />
            </div>
            <div className="input-col">
              <UpdateModuleProgress
                modules={modules}
                initialModuleId={selectedModuleId}
                onSubmit={handleCreateGrade}
                loading={loading}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GradeTracker;

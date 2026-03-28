import React from 'react';
import './grades.css';

function GPATracker({ semesterGPA, averageGrade, highestGrade, lowestGrade, totalModules, currentYear, currentSemester, currentWeek }) {
  return (
    <div className="gpa-tracker-card">
      {/* Year, Semester, Week Info */}
      <div className="academic-info-row">
        <div className="info-badge">Year {currentYear || '-'}</div>
        <div className="info-badge">Semester {currentSemester || '-'}</div>
        <div className="info-badge">Week {currentWeek || 1}</div>
      </div>

      <div className="gpa-stats-grid">
        <div className="stat-box">
          <div className="stat-value">{(semesterGPA || 0).toFixed(2)}</div>
          <div className="stat-label">Semester GPA</div>
        </div>
        
        <div className="stat-box">
          <div className="stat-value">{(averageGrade || 0).toFixed(2)}</div>
          <div className="stat-label">Average Grade</div>
        </div>
        
        <div className="stat-box highlight-good">
          <div className="stat-value">{(highestGrade || 0).toFixed(2)}</div>
          <div className="stat-label">Highest Grade</div>
        </div>
        
        <div className="stat-box highlight-warning">
          <div className="stat-value">{(lowestGrade || 0).toFixed(2)}</div>
          <div className="stat-label">Lowest Grade</div>
        </div>
        
        <div className="stat-box">
          <div className="stat-value">{totalModules || 0}</div>
          <div className="stat-label">Total Modules</div>
        </div>
      </div>

      {/* GPA Scale indicator */}
      <div className="gpa-scale">
        <div className="scale-item">
          <span className="scale-color" style={{backgroundColor: '#27ae60'}}></span>
          <span>4.0 - Excellent</span>
        </div>
        <div className="scale-item">
          <span className="scale-color" style={{backgroundColor: '#f39c12'}}></span>
          <span>3.0-3.9 - Good</span>
        </div>
        <div className="scale-item">
          <span className="scale-color" style={{backgroundColor: '#e74c3c'}}></span>
          <span>&lt;3.0 - Needs Improvement</span>
        </div>
      </div>
    </div>
  );
}

export default GPATracker;

import React, { useState, useEffect } from 'react';
import './grades.css';

function AcademicStatus({ modules }) {
  const [currentYear, setCurrentYear] = useState(null);
  const [currentSemester, setCurrentSemester] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(1);

  useEffect(() => {
    if (modules && modules.length > 0) {
      const activeModules = modules.filter(m => m.status === 'active');
      
      if (activeModules.length > 0) {
        const maxYear = Math.max(...activeModules.map(m => m.year));
        const maxSemester = Math.max(...activeModules.map(m => m.semester));
        
        setCurrentYear(maxYear);
        setCurrentSemester(maxSemester);
      }
    }

    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const weekNumber = Math.ceil((((today - startOfYear) / 86400000) + startOfYear.getDay() + 1) / 7);
    setCurrentWeek(Math.min(weekNumber, 16));
  }, [modules]);

  return (
    <div className="academic-status-compact">
      <div className="status-badge">Year {currentYear || '-'}</div>
      <div className="status-badge">Semester {currentSemester || '-'}</div>
      <div className="status-badge">Week {currentWeek}</div>
    </div>
  );
}

export default AcademicStatus;

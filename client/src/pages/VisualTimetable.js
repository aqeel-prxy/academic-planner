import React from 'react';
import { Link } from 'react-router-dom';
import TimetableCalendar from '../components/timetable/TimetableCalendar';
import './VisualTimetable.css';

const VisualTimetable = () => {
  return (
    <div className="visual-timetable-page">
      <header className="timetable-page-header">
        <h1>Visual Timetable</h1>
        <p>Switch or create a timetable below. Click a slot to add a class; drag classes to move them, or drag the bottom edge to change duration.</p>
        <div className="timetable-page-links">
          <Link to="/exam-preparation">Open Exam Preparation</Link>
          <Link to="/attendance-risk">Open Attendance Risk</Link>
        </div>
      </header>
      <div className="timetable-wrapper">
        <TimetableCalendar />
      </div>
    </div>
  );
};

export default VisualTimetable;

import React from 'react';
import { FiCalendar, FiLayers, FiMousePointer, FiMove } from 'react-icons/fi';
import TimetableCalendar from '../components/timetable/TimetableCalendar';
import './VisualTimetable.css';

const VisualTimetable = () => {
  return (
    <div className="visual-timetable-page">
      <header className="timetable-page-header">
        <div className="timetable-page-header-top">
          <div>
            <p className="timetable-page-kicker">Academic planner</p>
            <h1>Visual Timetable</h1>
          </div>
          <div className="timetable-page-badge" aria-hidden>
            <FiCalendar />
            <span>Week view</span>
          </div>
        </div>
        <p className="timetable-page-lead">
          One place for every class: pick your timetable, tap a time slot to add a session, then drag to move or stretch
          the bottom edge to adjust how long it runs.
        </p>
        <ul className="timetable-quick-tips" aria-label="Quick tips">
          <li>
            <FiMousePointer className="timetable-tip-icon" aria-hidden />
            <span>
              <strong>Click</strong> an empty slot to create an event.
            </span>
          </li>
          <li>
            <FiMove className="timetable-tip-icon" aria-hidden />
            <span>
              <strong>Drag</strong> an event to another time or day.
            </span>
          </li>
          <li>
            <FiLayers className="timetable-tip-icon" aria-hidden />
            <span>
              <strong>Resize</strong> by dragging the bottom of the block.
            </span>
          </li>
        </ul>
      </header>
      <div className="timetable-wrapper">
        <TimetableCalendar />
      </div>
    </div>
  );
};

export default VisualTimetable;

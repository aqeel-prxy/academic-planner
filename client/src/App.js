import React, { useState } from 'react';
import TimetableCalendar from './components/timetable/TimetableCalendar';
import GradeTracker from './components/grades/GradeTracker';
import ModuleOrganizer from './components/organizer/ModuleOrganizer';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  const [activeView, setActiveView] = useState('timetable');

  return (
    <div className="App">
      <nav className="navbar navbar-dark bg-primary">
        <div className="container-fluid">
          <span className="navbar-brand mb-0 h1">Nexora</span>
          <div className="nav-links">
            <button
              className={`nav-btn ${activeView === 'timetable' ? 'active' : ''}`}
              onClick={() => setActiveView('timetable')}
            >
              📅 Timetable
            </button>
            <button
              className={`nav-btn ${activeView === 'grades' ? 'active' : ''}`}
              onClick={() => setActiveView('grades')}
            >
              📊 GPA Tracker
            </button>
            <button
              className={`nav-btn ${activeView === 'organizer' ? 'active' : ''}`}
              onClick={() => setActiveView('organizer')}
            >
              📚 Module Organizer
            </button>
          </div>
        </div>
      </nav>
      <div className="container-fluid mt-0">
        {activeView === 'timetable' && <TimetableCalendar />}
        {activeView === 'grades' && <GradeTracker />}
        {activeView === 'organizer' && <ModuleOrganizer />}
      </div>
    </div>
  );
}

export default App;
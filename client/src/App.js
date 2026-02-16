import React from 'react';
import TimetableCalendar from './components/timetable/TimetableCalendar';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  return (
    <div className="App">
      <nav className="navbar navbar-dark bg-primary">
        <div className="container">
          <span className="navbar-brand mb-0 h1">Academic Planner</span>
        </div>
      </nav>
      <div className="container mt-4">
        <TimetableCalendar />
      </div>
    </div>
  );
}

export default App;
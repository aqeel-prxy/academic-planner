import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import AssignmentDashboard from './pages/AssignmentDashboard';
import VisualTimetable from './pages/VisualTimetable';
import ExamPreparation from './pages/examPreparation';
import AttendanceRisk from './pages/AttendanceRisk';
import GradeTracker from './components/grades/GradeTracker';
import ModuleOrganizer from './components/organizer/ModuleOrganizer';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import './components/Navbar.css';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Navbar />
        <main className="App-main">
          <Routes>
            <Route path="/" element={<Navigate to="/timetable" replace />} />
            <Route path="/assignments" element={<AssignmentDashboard />} />
            <Route path="/timetable" element={<VisualTimetable />} />
            <Route path="/exam-preparation" element={<ExamPreparation />} />
            <Route path="/attendance-risk" element={<AttendanceRisk />} />
            <Route path="/grades" element={<GradeTracker />} />
            <Route path="/module-organizer" element={<ModuleOrganizer />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import AssignmentDashboard from './pages/AssignmentDashboard';
import VisualTimetable from './pages/VisualTimetable';
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
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;

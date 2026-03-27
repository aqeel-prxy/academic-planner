import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './AssignmentDashboard.css';

const normalizeExamList = (response) => {
  if (Array.isArray(response)) return response;
  if (response && Array.isArray(response.data)) return response.data;
  return [];
};

const AssignmentDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    classesThisWeek: 0,
    examsPlanned: 0,
    attendanceModules: 0,
    highRiskModules: 0
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [events, examsRes, attendance] = await Promise.all([
          api.getEvents('default').catch(() => []),
          api.getExamPreparations().catch(() => []),
          api.getAttendance('default').catch(() => [])
        ]);

        const exams = normalizeExamList(examsRes);
        const attendanceRows = Array.isArray(attendance) ? attendance : [];
        const highRiskModules = attendanceRows.filter((x) => {
          const req = Number(x.requiredLectures || 0);
          const att = Number(x.attendedLectures || 0);
          if (req <= 0) return false;
          return (att / req) < 0.75;
        }).length;

        setStats({
          classesThisWeek: Array.isArray(events) ? events.length : 0,
          examsPlanned: exams.length,
          attendanceModules: attendanceRows.length,
          highRiskModules
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const statCards = useMemo(() => ([
    { title: 'Classes', value: stats.classesThisWeek, hint: 'Scheduled in current timetable' },
    { title: 'Exams', value: stats.examsPlanned, hint: 'Tracked in Exam Preparation' },
    { title: 'Attendance Modules', value: stats.attendanceModules, hint: 'Modules in Attendance Risk' },
    { title: 'High Attendance Risk', value: stats.highRiskModules, hint: 'Modules currently in red' }
  ]), [stats]);

  return (
    <div className="assignment-dashboard-page">
      <div className="dashboard-header">
        <h1>Academic Hub</h1>
        <p className="dashboard-subtitle">Manage timetable, exams, and attendance risk from one connected workspace.</p>
      </div>

      <section className="dashboard-stats-grid">
        {statCards.map((card) => (
          <article key={card.title} className="dashboard-stat-card">
            <div className="dashboard-stat-title">{card.title}</div>
            <div className="dashboard-stat-value">{loading ? '...' : card.value}</div>
            <div className="dashboard-stat-hint">{card.hint}</div>
          </article>
        ))}
      </section>

      <section className="dashboard-feature-grid">
        <Link to="/timetable" className="dashboard-feature-card">
          <h2>Visual Timetable</h2>
          <p>Plan class sessions, split timetables, and edit schedule with drag-and-drop.</p>
          <span>Open timetable →</span>
        </Link>

        <Link to="/exam-preparation" className="dashboard-feature-card">
          <h2>Exam Preparation</h2>
          <p>Track exams, dates, venues, progress, and receive notifications in navbar.</p>
          <span>Manage exams →</span>
        </Link>

        <Link to="/attendance-risk" className="dashboard-feature-card">
          <h2>Attendance Risk</h2>
          <p>Add modules per timetable and predict red/yellow/green attendance risk.</p>
          <span>Check risk →</span>
        </Link>
      </section>

      <div className="dashboard-tips-card">
        <h3>Recommended flow</h3>
        <p>1) Set your timetable. 2) Add exam plans. 3) Track attendance by module. 4) Use risk colors to decide what to prioritize this week.</p>
      </div>
    </div>
  );
};

export default AssignmentDashboard;

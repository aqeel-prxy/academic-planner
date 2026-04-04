import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Navbar.css';

const READ_EXAM_ALERTS_KEY = 'academicPlanner_readExamAlerts_v1';

const getReadAlertIds = () => {
  try {
    const raw = localStorage.getItem(READ_EXAM_ALERTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const setReadAlertIds = (ids) => {
  localStorage.setItem(READ_EXAM_ALERTS_KEY, JSON.stringify(ids));
};

const parseExamStart = (exam) => {
  if (!exam?.examDate) return null;
  const time = exam.startTime || '09:00';
  const dt = new Date(`${exam.examDate}T${time}`);
  return Number.isNaN(dt.getTime()) ? null : dt;
};

const Navbar = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [readIds, setReadIds] = useState(getReadAlertIds);

  const loadAlerts = async () => {
    try {
      const res = await api.getExamPreparations();
      const list = Array.isArray(res) ? res : res && Array.isArray(res.data) ? res.data : [];

      const now = new Date();
      const upcoming = list
        .map((exam) => ({
          exam,
          start: parseExamStart(exam)
        }))
        .filter((x) => x.start && x.start.getTime() >= now.getTime())
        .sort((a, b) => a.start.getTime() - b.start.getTime())
        .slice(0, 3);

      setAlerts(upcoming);
    } catch {
      setAlerts([]);
    }
  };

  useEffect(() => {
    loadAlerts();
    const id = window.setInterval(loadAlerts, 60 * 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!open) return;
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const unreadCount = alerts.filter(({ exam }) => !readIds.includes(String(exam.id))).length;

  const alertLabel = useMemo(() => {
    if (unreadCount === 0) return 'No unread exam notifications';
    return `${unreadCount} unread exam notification${unreadCount === 1 ? '' : 's'}`;
  }, [unreadCount]);

  const goToExam = (exam) => {
    setOpen(false);
    if (!exam?.id) {
      navigate('/exam-preparation');
      return;
    }

    const id = String(exam.id);
    if (!readIds.includes(id)) {
      const next = [...readIds, id];
      setReadIds(next);
      setReadAlertIds(next);
    }

    navigate(`/exam-preparation?edit=${encodeURIComponent(exam.id)}`);
  };

  return (
    <nav className="app-navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="navbar-brand" end>
          <span className="navbar-logo-icon">⬢</span>
          <span className="navbar-brand-stack">
            <span className="navbar-logo-text">Nexora</span>
            <span className="navbar-logo-sub">Academic Planner</span>
          </span>
        </NavLink>

        <div className="navbar-links">
          <NavLink
            to="/assignments"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            Assignment Dashboard
          </NavLink>

          <NavLink
            to="/grades"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            GPA Tracker
          </NavLink>

          <NavLink
            to="/module-organizer"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            Module Organizer
          </NavLink>

          <NavLink
            to="/timetable"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            Visual Timetable
          </NavLink>

          <NavLink
            to="/attendance-risk"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            Attendance Risk
          </NavLink>

          <div className="nav-exam-group" ref={dropdownRef}>
            <NavLink
              to="/exam-preparation"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              Exam Preparation
            </NavLink>
            <button
              type="button"
              className="nav-bell"
              aria-label={alertLabel}
              title={alertLabel}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpen((v) => !v);
              }}
            >
              <span className="nav-bell-icon" aria-hidden>
                🔔
              </span>
              {unreadCount > 0 && <span className="nav-bell-badge">{unreadCount}</span>}
            </button>

            {open && (
              <div className="nav-bell-dropdown" role="menu">
                <div className="nav-bell-dropdown-title">Upcoming exams</div>
                {alerts.length === 0 ? (
                  <div className="nav-bell-empty">No upcoming exams in the next sessions.</div>
                ) : (
                  <div className="nav-bell-list">
                    {alerts.map(({ exam, start }) => {
                      const isRead = readIds.includes(String(exam.id));
                      const timeLabel = start ? start.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : exam.examDate;
                      return (
                        <button
                          key={exam.id}
                          type="button"
                          className={`nav-bell-item ${isRead ? 'is-read' : ''}`}
                          onClick={() => goToExam(exam)}
                        >
                          <div className="nav-bell-item-top">
                            <span className="nav-bell-pill">Exam</span>
                            <span className="nav-bell-item-title">
                              {exam.subject || 'Exam'}
                              {exam.examTitle ? ` • ${exam.examTitle}` : ''}
                            </span>
                          </div>
                          <div className="nav-bell-item-sub">
                            {timeLabel}
                            {exam.venue ? ` • ${exam.venue}` : ''}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

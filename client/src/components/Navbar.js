import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  const [attendanceRisk, setAttendanceRisk] = useState(null);

  const loadAlerts = async () => {
    try {
      const res = await api.getExamPreparations();
      const list = Array.isArray(res) ? res : (res && Array.isArray(res.data) ? res.data : []);

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

  const computeRisk = useCallback((rows) => {
    const toInt = (v) => {
      const n = Number(v);
      if (!Number.isFinite(n)) return 0;
      return Math.max(0, Math.floor(n));
    };
    const riskLevel = (r) => {
      const req = toInt(r.requiredLectures);
      const att = toInt(r.attendedLectures);
      if (req <= 0) return 'unknown';
      const ratio = att / req;
      if (ratio >= 1) return 'green';
      if (ratio >= 0.75) return 'yellow';
      return 'red';
    };
    const levels = (Array.isArray(rows) ? rows : []).map(riskLevel);
    if (levels.length === 0) return null;
    if (levels.includes('red')) return 'red';
    if (levels.includes('yellow')) return 'yellow';
    if (levels.includes('green')) return 'green';
    return 'unknown';
  }, []);

  const loadAttendanceRisk = useCallback(async () => {
    try {
      const rows = await api.getAttendance('default');
      setAttendanceRisk(computeRisk(rows));
    } catch {
      setAttendanceRisk(null);
    }
  }, [computeRisk]);

  useEffect(() => {
    loadAttendanceRisk();
    const id = window.setInterval(loadAttendanceRisk, 60 * 1000);
    return () => window.clearInterval(id);
  }, [loadAttendanceRisk]);

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

  const goToExamInTimetable = (exam) => {
    setOpen(false);
    if (!exam?.id) {
      navigate('/timetable');
      return;
    }

    const id = String(exam.id);
    if (!readIds.includes(id)) {
      const next = [...readIds, id];
      setReadIds(next);
      setReadAlertIds(next);
    }

    navigate(`/timetable?focusExam=${encodeURIComponent(exam.id)}`);
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
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
          >
            Academic Hub
          </NavLink>

          <NavLink
            to="/timetable"
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
          >
            Visual Timetable
          </NavLink>

          <NavLink
            to="/attendance-risk"
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="nav-attendance-wrap">
              <span>Attendance Risk</span>
              {attendanceRisk && (
                <span
                  className={`nav-risk-dot nav-risk-dot--${attendanceRisk}`}
                  aria-label={`Attendance risk: ${attendanceRisk}`}
                  title={`Attendance risk: ${attendanceRisk}`}
                />
              )}
            </span>
          </NavLink>

          <NavLink
            to="/exam-preparation"
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="nav-exam-wrap" ref={dropdownRef}>
              <span>Exam Preparation</span>
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
                <span className="nav-bell-icon">🔔</span>
                {unreadCount > 0 && <span className="nav-bell-badge">{unreadCount}</span>}
              </button>

              {open && (
                <div className="nav-bell-dropdown" role="menu">
                  <div className="nav-bell-dropdown-title">Nearest Exams</div>
                  {alerts.length === 0 ? (
                    <div className="nav-bell-empty">No upcoming exams found.</div>
                  ) : (
                    <div className="nav-bell-list">
                      {alerts.map(({ exam, start }) => {
                        const isRead = readIds.includes(String(exam.id));
                        const timeLabel = start ? start.toLocaleString() : exam.examDate;
                        return (
                        <button
                          key={exam.id}
                          type="button"
                          className={`nav-bell-item ${isRead ? 'is-read' : ''}`}
                          onClick={() => goToExamInTimetable(exam)}
                        >
                          <div className="nav-bell-item-top">
                            <span className="nav-bell-pill">EXAM</span>
                            <span className="nav-bell-item-title">
                              {exam.subject || 'Exam'}{exam.examTitle ? ` • ${exam.examTitle}` : ''}
                            </span>
                          </div>
                          <div className="nav-bell-item-sub">
                            {timeLabel}{exam.venue ? ` • ${exam.venue}` : ''}
                          </div>
                        </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </span>
          </NavLink>


        </div>
      </div>
    </nav>
  );
};

export default Navbar;
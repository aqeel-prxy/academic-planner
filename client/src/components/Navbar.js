import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
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
            to="/grades"
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
          >
            GPA Tracker
          </NavLink>

          <NavLink
            to="/module-organizer"
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
          >
            Module Organizer
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
            Attendance Risk
          </NavLink>

          <NavLink
            to="/exam-preparation"
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
          >
            Exam Preparation
          </NavLink>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

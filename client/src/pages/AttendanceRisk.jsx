import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './AttendanceRisk.css';

const TIMETABLE_NAMES_KEY = 'academicPlanner_timetableNames';

const getStoredTimetableNames = () => {
  try {
    const raw = localStorage.getItem(TIMETABLE_NAMES_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const toInt = (v, fallback = 0) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.floor(n));
};

const getRisk = ({ requiredLectures, attendedLectures }) => {
  const req = toInt(requiredLectures, 0);
  const att = toInt(attendedLectures, 0);
  if (req <= 0) return { level: 'unknown', label: 'Set required lectures' };
  const ratio = att / req;
  if (ratio >= 1) return { level: 'green', label: 'Safe' };
  if (ratio >= 0.75) return { level: 'yellow', label: 'Warning' };
  return { level: 'red', label: 'High risk' };
};

const AttendanceRisk = () => {
  const [timetableKey, setTimetableKey] = useState('default');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newModuleName, setNewModuleName] = useState('');
  const [newRequired, setNewRequired] = useState('');
  const [newAttended, setNewAttended] = useState('');

  const timetables = useMemo(() => {
    const names = getStoredTimetableNames();
    const list = [{ key: 'default', name: 'My Week' }];
    Object.entries(names).forEach(([key, name]) => {
      if (!key || key === 'default') return;
      list.push({ key, name: String(name || key) });
    });
    return list;
  }, []);

  const load = async (key = timetableKey) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getAttendance(key);
      setRows(Array.isArray(res) ? res : []);
    } catch (e) {
      setRows([]);
      setError(e?.response?.data?.error || e?.message || 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(timetableKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timetableKey]);

  const onAdd = async (e) => {
    e.preventDefault();
    const moduleName = newModuleName.trim();
    if (!moduleName) return;
    try {
      await api.upsertAttendance({
        timetableKey,
        moduleName,
        requiredLectures: toInt(newRequired, 0),
        attendedLectures: toInt(newAttended, 0)
      });
      setNewModuleName('');
      setNewRequired('');
      setNewAttended('');
      await load(timetableKey);
    } catch (e2) {
      setError(e2?.response?.data?.error || e2?.message || 'Failed to save module');
    }
  };

  const onUpdateField = async (id, patch) => {
    try {
      await api.updateAttendance(id, patch);
      await load(timetableKey);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Failed to update module');
    }
  };

  const onDelete = async (id) => {
    try {
      await api.deleteAttendance(id);
      await load(timetableKey);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Failed to delete module');
    }
  };

  const overall = useMemo(() => {
    if (!rows.length) return null;
    const levels = rows.map((r) => getRisk(r).level);
    if (levels.includes('red')) return 'red';
    if (levels.includes('yellow')) return 'yellow';
    if (levels.includes('green')) return 'green';
    return 'unknown';
  }, [rows]);

  return (
    <div className="attendance-risk-page">
      <header className="attendance-risk-header">
        <h1>Attendance Risk</h1>
        <p>Add your modules for a timetable, then enter required lectures and attended lectures to see your risk (red/yellow/green).</p>
        <div className="attendance-risk-links">
          <Link to="/timetable">Open Timetable</Link>
          <Link to="/exam-preparation">Open Exam Preparation</Link>
        </div>
      </header>

      <div className="attendance-risk-toolbar">
        <div className="attendance-risk-toolbar-left">
          <label className="attendance-risk-label" htmlFor="attendance-timetable">
            Timetable
          </label>
          <select
            id="attendance-timetable"
            className="attendance-risk-select"
            value={timetableKey}
            onChange={(e) => setTimetableKey(e.target.value)}
          >
            {timetables.map((t) => (
              <option key={t.key} value={t.key}>{t.name}</option>
            ))}
          </select>
        </div>

        {overall && (
          <div className={`attendance-risk-overall attendance-risk-overall--${overall}`}>
            Overall: {overall.toUpperCase()}
          </div>
        )}
      </div>

      <section className="attendance-risk-card">
        <h2>Add module</h2>
        <form className="attendance-risk-form" onSubmit={onAdd}>
          <input
            className="attendance-risk-input"
            placeholder="Module name (e.g. CS2010)"
            value={newModuleName}
            onChange={(e) => setNewModuleName(e.target.value)}
          />
          <input
            className="attendance-risk-input"
            type="number"
            min="0"
            placeholder="Required lectures"
            value={newRequired}
            onChange={(e) => setNewRequired(e.target.value)}
          />
          <input
            className="attendance-risk-input"
            type="number"
            min="0"
            placeholder="Attended lectures"
            value={newAttended}
            onChange={(e) => setNewAttended(e.target.value)}
          />
          <button className="attendance-risk-btn" type="submit">Add</button>
        </form>
        {error && <div className="attendance-risk-error">{error}</div>}
      </section>

      <section className="attendance-risk-list">
        {loading ? (
          <div className="attendance-risk-muted">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="attendance-risk-muted">No modules yet for this timetable.</div>
        ) : (
          rows.map((r) => {
            const risk = getRisk(r);
            return (
              <div key={r.id} className="attendance-risk-row">
                <div className="attendance-risk-row-main">
                  <div className="attendance-risk-module">{r.moduleName}</div>
                  <div className={`attendance-risk-pill attendance-risk-pill--${risk.level}`}>
                    {risk.label}
                  </div>
                </div>

                <div className="attendance-risk-row-fields">
                  <label className="attendance-risk-field">
                    <span>Required</span>
                    <input
                      type="number"
                      min="0"
                      value={toInt(r.requiredLectures, 0)}
                      onChange={(e) => {
                        const v = toInt(e.target.value, 0);
                        setRows((prev) => prev.map((x) => x.id === r.id ? { ...x, requiredLectures: v } : x));
                      }}
                      onBlur={(e) => onUpdateField(r.id, { requiredLectures: toInt(e.target.value, 0) })}
                    />
                  </label>

                  <label className="attendance-risk-field">
                    <span>Attended</span>
                    <input
                      type="number"
                      min="0"
                      value={toInt(r.attendedLectures, 0)}
                      onChange={(e) => {
                        const v = toInt(e.target.value, 0);
                        setRows((prev) => prev.map((x) => x.id === r.id ? { ...x, attendedLectures: v } : x));
                      }}
                      onBlur={(e) => onUpdateField(r.id, { attendedLectures: toInt(e.target.value, 0) })}
                    />
                  </label>

                  <button className="attendance-risk-btn attendance-risk-btn--danger" type="button" onClick={() => onDelete(r.id)}>
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
};

export default AttendanceRisk;


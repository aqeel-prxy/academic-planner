import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Toast, ToastContainer } from 'react-bootstrap';
import { FiBell, FiInfo } from 'react-icons/fi';
import api from '../services/api';
import { playBellChime } from '../utils/playBellChime';
import './AttendanceRisk.css';

const TIMETABLE_NAMES_KEY = 'academicPlanner_timetableNames';
const MODULE_NAME_MAX = 120;
const LECTURES_MAX = 9999;

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

const parseOptionalInt = (v) => {
  if (v === '' || v == null) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return NaN;
  return Math.max(0, Math.floor(n));
};

const getRisk = ({ requiredLectures, attendedLectures }) => {
  const req = toInt(requiredLectures, 0);
  const att = toInt(attendedLectures, 0);
  if (req <= 0) {
    return {
      level: 'unknown',
      label: 'Set required',
      pct: null,
      ratio: null,
      detail: 'Enter required lectures to calculate risk.'
    };
  }
  const ratio = att / req;
  const pct = Math.min(100, Math.round(ratio * 100));
  if (ratio >= 1) {
    return {
      level: 'green',
      label: 'On track',
      pct,
      ratio,
      detail: 'Attendance meets or exceeds the requirement.'
    };
  }
  if (ratio >= 0.75) {
    return {
      level: 'yellow',
      label: 'Watch',
      pct,
      ratio,
      detail: 'Below full requirement — monitor remaining sessions.'
    };
  }
  return {
    level: 'red',
    label: 'At risk',
    pct,
    ratio,
    detail: 'Attendance is well below requirement — prioritize showing up.'
  };
};

const validateAddForm = (moduleName, newRequired, newAttended) => {
  const errors = {};
  const name = moduleName.trim();
  if (!name) errors.moduleName = 'Module name is required.';
  else if (name.length > MODULE_NAME_MAX) {
    errors.moduleName = `Use at most ${MODULE_NAME_MAX} characters.`;
  }

  const req = parseOptionalInt(newRequired);
  if (req === null) errors.required = 'Required lectures is required.';
  else if (Number.isNaN(req)) errors.required = 'Enter a valid whole number.';
  else if (req < 1) errors.required = 'Required lectures must be at least 1.';
  else if (req > LECTURES_MAX) errors.required = `Must be at most ${LECTURES_MAX}.`;

  const att = parseOptionalInt(newAttended);
  if (att === null) {
    errors.attended = 'Attended lectures is required.';
  } else if (Number.isNaN(att)) {
    errors.attended = 'Enter a valid whole number.';
  } else if (att > LECTURES_MAX) {
    errors.attended = `Must be at most ${LECTURES_MAX}.`;
  } else if (req != null && !Number.isNaN(req) && att > req) {
    errors.attended = 'Attended cannot exceed required (unless you adjust required upward).';
  }

  return errors;
};

const AttendanceRisk = () => {
  const [timetableKey, setTimetableKey] = useState('default');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newModuleName, setNewModuleName] = useState('');
  const [newRequired, setNewRequired] = useState('');
  const [newAttended, setNewAttended] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const [toast, setToast] = useState(null);
  const prevRedIdsRef = useRef(new Set());

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
    prevRedIdsRef.current = new Set();
  }, [timetableKey]);

  useEffect(() => {
    load(timetableKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timetableKey]);

  const stats = useMemo(() => {
    let safe = 0;
    let watch = 0;
    let risk = 0;
    let unknown = 0;
    for (const r of rows) {
      const { level } = getRisk(r);
      if (level === 'green') safe += 1;
      else if (level === 'yellow') watch += 1;
      else if (level === 'red') risk += 1;
      else unknown += 1;
    }
    return { safe, watch, risk, unknown, total: rows.length };
  }, [rows]);

  const overall = useMemo(() => {
    if (!rows.length) return null;
    const levels = rows.map((r) => getRisk(r).level);
    if (levels.includes('red')) return 'red';
    if (levels.includes('yellow')) return 'yellow';
    if (levels.includes('green')) return 'green';
    return 'unknown';
  }, [rows]);

  useEffect(() => {
    if (loading) return;
    const redIds = new Set(
      rows.filter((r) => getRisk(r).level === 'red').map((r) => r.id)
    );
    const prev = prevRedIdsRef.current;
    let newRed = false;
    for (const id of redIds) {
      if (!prev.has(id)) newRed = true;
    }
    prevRedIdsRef.current = redIds;
    if (newRed && redIds.size > 0) {
      playBellChime();
      setToast({
        message: 'Attendance alert: one or more modules are at high risk.',
        tone: 'danger'
      });
    }
  }, [rows, loading]);

  const onAdd = async (e) => {
    e.preventDefault();
    const errs = validateAddForm(newModuleName, newRequired, newAttended);
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    const moduleName = newModuleName.trim();
    try {
      await api.upsertAttendance({
        timetableKey,
        moduleName,
        requiredLectures: parseOptionalInt(newRequired),
        attendedLectures: parseOptionalInt(newAttended)
      });
      setNewModuleName('');
      setNewRequired('');
      setNewAttended('');
      setFieldErrors({});
      setToast({ message: 'Module saved.', tone: 'success' });
      await load(timetableKey);
    } catch (e2) {
      setError(e2?.response?.data?.error || e2?.message || 'Failed to save module');
    }
  };

  const onUpdateField = async (id, patch) => {
    const row = rows.find((x) => x.id === id);
    if (!row) return;
    const nextReq = patch.requiredLectures !== undefined ? patch.requiredLectures : toInt(row.requiredLectures, 0);
    const nextAtt = patch.attendedLectures !== undefined ? patch.attendedLectures : toInt(row.attendedLectures, 0);
    if (nextReq > LECTURES_MAX || nextAtt > LECTURES_MAX) {
      setError(`Values must be at most ${LECTURES_MAX}.`);
      return;
    }
    if (nextReq >= 1 && nextAtt > nextReq) {
      setError('Attended cannot exceed required. Increase required or lower attended.');
      await load(timetableKey);
      return;
    }
    try {
      setError('');
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
      setToast({ message: 'Module removed.', tone: 'success' });
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Failed to delete module');
    }
  };

  const overallLabel = overall === 'red' ? 'High risk' : overall === 'yellow' ? 'Needs attention' : overall === 'green' ? 'Healthy' : 'Incomplete data';

  return (
    <div className="attendance-risk-page">
      <ToastContainer position="bottom-end" className="attendance-risk-toast-stack">
        {toast && (
          <Toast
            onClose={() => setToast(null)}
            bg={toast.tone === 'error' || toast.tone === 'danger' ? 'danger' : 'success'}
            delay={3200}
            autohide
          >
            <Toast.Body className="attendance-risk-toast-body">{toast.message}</Toast.Body>
          </Toast>
        )}
      </ToastContainer>

      <header className="attendance-risk-header">
        <div className="attendance-header-copy">
          <p className="attendance-header-kicker">Academic planner</p>
          <h1>Attendance risk</h1>
          <p>
            See how each module is doing against your required lecture count. Update numbers anytime — we save when you
            leave a field. A chime plays if something moves into the red zone.
          </p>
          <div className="attendance-risk-links">
            <Link to="/timetable">Visual Timetable</Link>
            <Link to="/exam-preparation">Exam Preparation</Link>
          </div>
        </div>
        <div className="attendance-header-stats">
          <div className="attendance-header-stat">
            <span className="attendance-header-stat-label">Modules</span>
            <strong>{stats.total}</strong>
          </div>
          <div className="attendance-header-stat attendance-header-stat--safe">
            <span className="attendance-header-stat-label">On track</span>
            <strong>{stats.safe}</strong>
          </div>
          <div className="attendance-header-stat attendance-header-stat--watch">
            <span className="attendance-header-stat-label">Watch</span>
            <strong>{stats.watch}</strong>
          </div>
          <div className="attendance-header-stat attendance-header-stat--risk">
            <span className="attendance-header-stat-label">At risk</span>
            <strong>{stats.risk}</strong>
          </div>
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
              <option key={t.key} value={t.key}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {overall && (
          <div className={`attendance-risk-overall attendance-risk-overall--${overall}`}>
            <span className="attendance-overall-icon" aria-hidden>
              <FiBell />
            </span>
            <div className="attendance-overall-text">
              <span className="attendance-overall-title">Portfolio</span>
              <span className="attendance-overall-value">{overallLabel}</span>
            </div>
          </div>
        )}
      </div>

      <div className="attendance-risk-legend" role="region" aria-label="Risk level guide">
        <div className="attendance-legend-title">
          <FiInfo aria-hidden />
          <span>How we color-code risk</span>
        </div>
        <div className="attendance-legend-chips">
          <span className="attendance-legend-chip attendance-legend-chip--green">
            <strong>On track</strong> — attended ≥ required
          </span>
          <span className="attendance-legend-chip attendance-legend-chip--yellow">
            <strong>Watch</strong> — 75–99% of required
          </span>
          <span className="attendance-legend-chip attendance-legend-chip--red">
            <strong>At risk</strong> — under 75% of required
          </span>
          <span className="attendance-legend-chip attendance-legend-chip--unknown">
            <strong>Set required</strong> — add a required count first
          </span>
        </div>
      </div>

      <section className="attendance-risk-card">
        <h2>Add module</h2>
        <form className="attendance-risk-form" onSubmit={onAdd} noValidate>
          <div className="attendance-field-wrap">
            <input
              className={`attendance-risk-input ${fieldErrors.moduleName ? 'is-invalid' : ''}`}
              placeholder="Module name (e.g. CS2010)"
              value={newModuleName}
              maxLength={MODULE_NAME_MAX}
              onChange={(e) => {
                setNewModuleName(e.target.value);
                setFieldErrors((p) => ({ ...p, moduleName: undefined }));
              }}
              aria-invalid={Boolean(fieldErrors.moduleName)}
              aria-describedby={fieldErrors.moduleName ? 'err-module' : undefined}
            />
            {fieldErrors.moduleName && (
              <div id="err-module" className="attendance-field-error" role="alert">
                {fieldErrors.moduleName}
              </div>
            )}
          </div>
          <div className="attendance-field-wrap">
            <input
              className={`attendance-risk-input ${fieldErrors.required ? 'is-invalid' : ''}`}
              type="number"
              min="1"
              max={LECTURES_MAX}
              placeholder="Required lectures"
              value={newRequired}
              onChange={(e) => {
                setNewRequired(e.target.value);
                setFieldErrors((p) => ({ ...p, required: undefined }));
              }}
            />
            {fieldErrors.required && <div className="attendance-field-error">{fieldErrors.required}</div>}
          </div>
          <div className="attendance-field-wrap">
            <input
              className={`attendance-risk-input ${fieldErrors.attended ? 'is-invalid' : ''}`}
              type="number"
              min="0"
              max={LECTURES_MAX}
              placeholder="Attended lectures"
              value={newAttended}
              onChange={(e) => {
                setNewAttended(e.target.value);
                setFieldErrors((p) => ({ ...p, attended: undefined }));
              }}
            />
            {fieldErrors.attended && <div className="attendance-field-error">{fieldErrors.attended}</div>}
          </div>
          <button className="attendance-risk-btn" type="submit">
            Add module
          </button>
        </form>
        {error && <div className="attendance-risk-error">{error}</div>}
      </section>

      <section className="attendance-risk-list" aria-busy={loading}>
        {loading ? (
          <div className="attendance-risk-muted">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="attendance-risk-muted">No modules yet for this timetable.</div>
        ) : (
          rows.map((r) => {
            const risk = getRisk(r);
            const req = toInt(r.requiredLectures, 0);
            const att = toInt(r.attendedLectures, 0);
            const pct = risk.pct != null ? risk.pct : 0;
            const ringStyle = {
              background: `conic-gradient(var(--ar-ring-accent) ${pct * 3.6}deg, var(--ar-ring-track) 0)`
            };
            return (
              <div
                key={r.id}
                className={`attendance-risk-row attendance-risk-row--${risk.level}`}
              >
                <div className="attendance-risk-row-top">
                  <div className="attendance-risk-ring-wrap" aria-hidden>
                    <div className="attendance-risk-ring" style={ringStyle}>
                      <div className="attendance-risk-ring-inner">
                        <span className="attendance-risk-ring-pct">{risk.pct != null ? `${pct}%` : '—'}</span>
                        <span className="attendance-risk-ring-sub">of required</span>
                      </div>
                    </div>
                  </div>
                  <div className="attendance-risk-row-main">
                    <div className="attendance-risk-module">{r.moduleName}</div>
                    <p className="attendance-risk-detail">{risk.detail}</p>
                    <div className="attendance-risk-row-badges">
                      <div className={`attendance-risk-pill attendance-risk-pill--${risk.level}`}>{risk.label}</div>
                      {req > 0 && (
                        <div className="attendance-risk-mini">
                          {att} / {req} lectures
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="attendance-risk-row-fields">
                  <label className="attendance-risk-field">
                    <span>Required</span>
                    <input
                      type="number"
                      min="0"
                      max={LECTURES_MAX}
                      value={req}
                      onChange={(e) => {
                        const v = toInt(e.target.value, 0);
                        setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, requiredLectures: v } : x)));
                      }}
                      onBlur={(e) => onUpdateField(r.id, { requiredLectures: toInt(e.target.value, 0) })}
                    />
                  </label>

                  <label className="attendance-risk-field">
                    <span>Attended</span>
                    <input
                      type="number"
                      min="0"
                      max={LECTURES_MAX}
                      value={att}
                      onChange={(e) => {
                        const v = toInt(e.target.value, 0);
                        setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, attendedLectures: v } : x)));
                      }}
                      onBlur={(e) => onUpdateField(r.id, { attendedLectures: toInt(e.target.value, 0) })}
                    />
                  </label>

                  <button
                    className="attendance-risk-btn attendance-risk-btn--danger"
                    type="button"
                    onClick={() => onDelete(r.id)}
                  >
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

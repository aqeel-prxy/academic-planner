import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import EventModal from './EventModal';
import ExamDetailsModal from './ExamDetailsModal';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import api from '../../services/api';
import './timetable.css';

// Monday of the week containing date (fixed week for split students)
const getStartOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const slugify = (name) => name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

const TIMETABLE_NAMES_KEY = 'academicPlanner_timetableNames';

const getStoredTimetableNames = () => {
  try {
    const raw = localStorage.getItem(TIMETABLE_NAMES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const setStoredTimetableName = (key, name) => {
  const names = getStoredTimetableNames();
  names[key] = name;
  localStorage.setItem(TIMETABLE_NAMES_KEY, JSON.stringify(names));
};

const TimetableCalendar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const weekStart = getStartOfWeek(new Date());

  const [events, setEvents] = useState([]);
  const [initialDate, setInitialDate] = useState(weekStart);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showExamModal, setShowExamModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [currentTimetableKey, setCurrentTimetableKey] = useState('default');
  const [timetableList, setTimetableList] = useState([]);
  const [userCreatedTimetables, setUserCreatedTimetables] = useState([]);
  const [customNames, setCustomNames] = useState(getStoredTimetableNames);

  const toCalendarEvent = (e) => ({
    ...e,
    extendedProps: {
      courseCode: e.courseCode,
      location: e.location
    }
  });

  const displayName = (key, fallbackName) => customNames[key] || fallbackName || key;

  const allTimetables = () => {
    const byKey = {};
    [...timetableList, ...userCreatedTimetables].forEach(t => {
      byKey[t.key] = displayName(t.key, t.name);
    });
    return Object.entries(byKey).map(([key, name]) => ({ key, name }));
  };

  useEffect(() => {
    setCustomNames(getStoredTimetableNames());
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const list = await api.getTimetables();
        setTimetableList(list.length > 0 ? list : [{ key: 'default', name: 'My Week' }]);
        if (list.length > 0 && !list.find(t => t.key === currentTimetableKey) && !userCreatedTimetables.find(t => t.key === currentTimetableKey)) {
          setCurrentTimetableKey(list[0].key);
        }
      } catch (err) {
        console.error('Failed to load timetables:', err);
        setTimetableList([{ key: 'default', name: 'My Week' }]);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const [classEventsRes, examsRes] = await Promise.all([
          api.getEvents(currentTimetableKey),
          api.getExamPreparations()
        ]);

        const classEvents = (Array.isArray(classEventsRes) ? classEventsRes : []).map(toCalendarEvent);

        const examsRaw = Array.isArray(examsRes) ? examsRes : [];

        const examEvents = examsRaw
          .filter((x) => x && x.examDate)
          .map((x) => {
            const startTime = x.startTime || '09:00';
            const endTime = x.endTime || '10:00';
            const start = new Date(`${x.examDate}T${startTime}`);
            const end = new Date(`${x.examDate}T${endTime}`);
            return {
              id: `exam-${x.id}`,
              title: `EXAM • ${x.subject || ''}${x.subject && x.examTitle ? ' • ' : ''}${x.examTitle || ''}`.trim(),
              start,
              end,
              backgroundColor: '#dc2626',
              borderColor: '#b91c1c',
              editable: false,
              extendedProps: {
                isExam: true,
                examData: x,
                courseCode: x.subject || 'EXAM',
                location: x.venue || ''
              }
            };
          });

        setEvents([...classEvents, ...examEvents]);

        const params = new URLSearchParams(location.search);
        const focusExamId = params.get('focusExam');
        if (focusExamId) {
          try {
            const fetched = await api.getExamPreparationById(focusExamId);
            const target = fetched && fetched.examDate ? fetched : examsRaw.find((x) => String(x.id) === String(focusExamId));
            if (target?.examDate) {
              const startTime = target.startTime || '09:00';
              const focusDate = new Date(`${target.examDate}T${startTime}`);
              setInitialDate(focusDate);
              setSelectedExam(target);
              setShowExamModal(true);
            }
          } catch {
            // ignore; fallback is not opening modal
          }
        }
      } catch (error) {
        console.error('Failed to load events:', error);
      }
    };
    loadEvents();
  }, [currentTimetableKey, location.search]);

  // ✅ Conflict Detection Business Rule
  const checkForConflicts = (newStart, newEnd, excludeId = null) => {
    return events.some(event => {
      if (excludeId && event.id === excludeId) return false;

      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      const start = new Date(newStart);
      const end = new Date(newEnd);

      return (start < eventEnd && end > eventStart);
    });
  };

  const handleDateClick = (info) => {
    setSelectedEvent(null);
    // 30-min default slot so you can add 9–9:30 and 9:30–10 separately
    const slotMinutes = 30;
    setSelectedSlot({
      start: info.date,
      end: new Date(info.date.getTime() + slotMinutes * 60 * 1000)
    });
    setShowModal(true);
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const h = d.getHours();
    const m = d.getMinutes();
    return m === 0 ? `${h}` : `${h}:${String(m).padStart(2, '0')}`;
  };

  const formatTimeRange = (start, end) => `${formatTime(start)} – ${formatTime(end)}`;

  // Event content: time, title, course code, location – spacious and readable
  const renderEventContent = (arg) => {
    const loc = arg.event.extendedProps?.location || arg.event.location || '';
    const code = arg.event.extendedProps?.courseCode || arg.event.courseCode || '';
    const timeStr = formatTimeRange(arg.event.start, arg.event.end);
    return (
      <div className="fc-event-main-wrap">
        <div className="fc-event-time">{timeStr}</div>
        <div className="fc-event-title">{arg.event.title}</div>
        {code && <div className="fc-event-code">{code}</div>}
        {loc && <div className="fc-event-location">{loc}</div>}
      </div>
    );
  };

  const handleEventClick = (info) => {
    const isExam = Boolean(info.event.extendedProps?.isExam);
    if (isExam) {
      setSelectedEvent(null);
      setSelectedSlot(null);
      setShowModal(false);

      setSelectedExam(info.event.extendedProps?.examData || null);
      setShowExamModal(true);
      return;
    }

    setSelectedEvent(info.event);
    setSelectedSlot(null);
    setShowModal(true);
  };

  // ✅ Drag & Drop Update (Backend Integrated)
  const handleEventDrop = async (info) => {
    if (checkForConflicts(info.event.start, info.event.end, info.event.id)) {
      alert("Time conflict detected!");
      info.revert();
      return;
    }

    try {
      await api.updateEvent(info.event.id, {
        start: info.event.start,
        end: info.event.end
      });
    } catch (error) {
      console.error("Update failed:", error);
      info.revert();
    }
  };

  // ✅ Resize Update (Backend Integrated)
  const handleEventResize = async (info) => {
    if (checkForConflicts(info.event.start, info.event.end, info.event.id)) {
      alert("Time conflict detected!");
      info.revert();
      return;
    }

    try {
      await api.updateEvent(info.event.id, {
        start: info.event.start,
        end: info.event.end
      });
    } catch (error) {
      console.error("Resize failed:", error);
      info.revert();
    }
  };

  // Normalize datetime-local "YYYY-MM-DDTHH:mm" to ISO with seconds for backend
  const normalizePayload = (data) => {
    const toIso = (v) => {
      if (!v) return v;
      if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return v + ':00';
      return v;
    };
    const payload = { ...data };
    if (payload.start) payload.start = toIso(payload.start);
    if (payload.end) payload.end = toIso(payload.end);
    if (payload.backgroundColor && !payload.borderColor) payload.borderColor = payload.backgroundColor;
    return payload;
  };

  // Save event – template week: any day/time allowed (no past block)
  const handleSaveEvent = async (eventData) => {
    if (checkForConflicts(eventData.start, eventData.end, eventData.id)) {
      alert("This time slot conflicts with an existing class!");
      return;
    }

    const payload = normalizePayload(eventData);
    payload.timetableKey = currentTimetableKey;

    try {
      if (selectedEvent) {
        const updated = await api.updateEvent(selectedEvent.id, payload);
        setEvents(prev => prev.map(e => e.id === updated.id ? toCalendarEvent(updated) : e));
      } else {
        const created = await api.createEvent(payload);
        setEvents(prev => [...prev, toCalendarEvent(created)]);
      }

      setShowModal(false);

    } catch (error) {
      console.error('Failed to save event:', error);
      const msg = error.response?.data?.errors
        ? error.response.data.errors.map(e => e.msg).join(', ')
        : error.response?.data?.error || error.message || 'Please try again.';
      alert('Error saving event: ' + msg);
    }
  };

  const handleNewTimetable = () => {
    const name = window.prompt('Name this timetable (e.g. Weekend 5.2, Batch 5.1):');
    if (!name || !name.trim()) return;
    const key = slugify(name) || 'timetable-' + Date.now();
    const trimmed = name.trim();
    setUserCreatedTimetables(prev => [...prev, { key, name: trimmed }]);
    setStoredTimetableName(key, trimmed);
    setCustomNames(prev => ({ ...prev, [key]: trimmed }));
    setCurrentTimetableKey(key);
  };

  const handleRenameTimetable = () => {
    const list = allTimetables();
    const current = list.find(t => t.key === currentTimetableKey);
    const currentName = current ? current.name : currentTimetableKey;
    const name = window.prompt('Rename this timetable:', currentName);
    if (!name || !name.trim()) return;
    setStoredTimetableName(currentTimetableKey, name.trim());
    setCustomNames(prev => ({ ...prev, [currentTimetableKey]: name.trim() }));
    setUserCreatedTimetables(prev => prev.map(t => t.key === currentTimetableKey ? { ...t, name: name.trim() } : t));
    setTimetableList(prev => prev.map(t => t.key === currentTimetableKey ? { ...t, name: name.trim() } : t));
  };

  return (
    <>
      <div className="timetable-toolbar">
        <div className="timetable-toolbar-label">Timetable</div>
        <select
          className="timetable-select"
          value={currentTimetableKey}
          onChange={(e) => setCurrentTimetableKey(e.target.value)}
          aria-label="Select timetable"
        >
          {allTimetables().map(t => (
            <option key={t.key} value={t.key}>{t.name}</option>
          ))}
        </select>
        <button type="button" className="timetable-btn timetable-btn-rename" onClick={handleRenameTimetable} title="Rename this timetable">
          Rename
        </button>
        <button type="button" className="timetable-btn timetable-btn-new" onClick={handleNewTimetable}>
          + New timetable
        </button>
      </div>
      <div className="timetable-container timetable-scrollable-week">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          initialDate={initialDate}
          firstDay={1}
          dayHeaderFormat={{ weekday: 'short' }}
          editable={true}
          selectable={true}
          events={events}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          eventContent={renderEventContent}
          headerToolbar={{ left: '', center: 'title', right: '' }}
          slotMinTime="08:00:00"
          slotMaxTime="22:00:00"
          slotDuration="00:30:00"
          slotLabelInterval="01:00:00"
          allDaySlot={false}
          height="calc(100vh - 200px)"
          contentHeight="auto"
        />
      </div>

      <EventModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onSave={handleSaveEvent}
        eventData={selectedEvent}
        selectedSlot={selectedSlot}
      />

      <ExamDetailsModal
        show={showExamModal}
        onHide={() => setShowExamModal(false)}
        exam={selectedExam}
        onEdit={(exam) => {
          setShowExamModal(false);
          if (exam?.id) {
            navigate(`/exam-preparation?edit=${encodeURIComponent(exam.id)}`);
          }
        }}
      />
    </>
  );
};

export default TimetableCalendar;

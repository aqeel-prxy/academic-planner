import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import EventModal from './EventModal';
import api from '../../services/api';   // ✅ ADDED
import './timetable.css';

const TimetableCalendar = () => {
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Map API event to FullCalendar shape (extendedProps for modal)
  const toCalendarEvent = (e) => ({
    ...e,
    extendedProps: {
      courseCode: e.courseCode,
      location: e.location
    }
  });

  // ✅ Load events from database
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const data = await api.getEvents();
        setEvents(data.map(toCalendarEvent));
      } catch (error) {
        console.error('Failed to load events:', error);
      }
    };

    loadEvents();
  }, []);

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
    setSelectedSlot({
      start: info.date,
      end: new Date(info.date.getTime() + 60 * 60 * 1000)
    });
    setShowModal(true);
  };

  const handleEventClick = (info) => {
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

  // ✅ Updated handleSaveEvent (Backend Connected)
  const handleSaveEvent = async (eventData) => {

    // ❌ No past scheduling
    if (new Date(eventData.start) < new Date()) {
      alert("Cannot schedule classes in the past!");
      return;
    }

    // ❌ No overlapping classes
    if (checkForConflicts(eventData.start, eventData.end, eventData.id)) {
      alert("This time slot conflicts with an existing class!");
      return;
    }

    const payload = normalizePayload(eventData);

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

  return (
    <>
      <div className="timetable-container">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          editable={true}
          selectable={true}
          events={events}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          slotMinTime="08:00:00"
          slotMaxTime="22:00:00"
          allDaySlot={false}
          height="auto"
        />
      </div>

      <EventModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onSave={handleSaveEvent}
        eventData={selectedEvent}
        selectedSlot={selectedSlot}
      />
    </>
  );
};

export default TimetableCalendar;

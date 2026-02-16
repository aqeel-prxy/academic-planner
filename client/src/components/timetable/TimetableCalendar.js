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

  // ✅ Load events from database
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const data = await api.getEvents();
        setEvents(data);
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

    try {
      if (selectedEvent) {
        const updated = await api.updateEvent(selectedEvent.id, eventData);
        setEvents(events.map(e => e.id === updated.id ? updated : e));
      } else {
        const created = await api.createEvent(eventData);
        setEvents([...events, created]);
      }

      setShowModal(false);

    } catch (error) {
      console.error('Failed to save event:', error);
      alert('Error saving event. Please try again.');
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

import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import EventModal from './EventModal';
import './timetable.css';

const TimetableCalendar = () => {
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => {
    const mockEvents = [
      {
        id: '1',
        title: 'IT3040 - Lecture',
        start: '2026-02-17T09:00:00',
        end: '2026-02-17T11:00:00',
        backgroundColor: '#3788d8',
        borderColor: '#3788d8',
        extendedProps: {
          courseCode: 'IT3040',
          location: 'Room 3.02'
        }
      }
    ];
    setEvents(mockEvents);
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

  const handleEventDrop = (info) => {
    if (checkForConflicts(info.event.start, info.event.end, info.event.id)) {
      alert("Time conflict detected!");
      info.revert();
      return;
    }

    const updatedEvents = events.map(e =>
      e.id === info.event.id
        ? { ...e, start: info.event.start, end: info.event.end }
        : e
    );

    setEvents(updatedEvents);
  };

  const handleEventResize = (info) => {
    if (checkForConflicts(info.event.start, info.event.end, info.event.id)) {
      alert("Time conflict detected!");
      info.revert();
      return;
    }

    const updatedEvents = events.map(e =>
      e.id === info.event.id
        ? { ...e, start: info.event.start, end: info.event.end }
        : e
    );

    setEvents(updatedEvents);
  };

  const handleSaveEvent = (eventData) => {

    // ✅ Business Rule: No past scheduling
    if (new Date(eventData.start) < new Date()) {
      alert("Cannot schedule classes in the past!");
      return;
    }

    // ✅ Business Rule: No overlapping classes
    if (checkForConflicts(eventData.start, eventData.end, eventData.id)) {
      alert("This time slot conflicts with an existing class!");
      return;
    }

    const newEvent = {
      id: eventData.id || Date.now().toString(),
      title: eventData.title,
      start: eventData.start,
      end: eventData.end,
      backgroundColor: eventData.backgroundColor,
      borderColor: eventData.backgroundColor,
      extendedProps: {
        courseCode: eventData.courseCode,
        location: eventData.location
      }
    };

    if (selectedEvent) {
      setEvents(events.map(e => e.id === newEvent.id ? newEvent : e));
    } else {
      setEvents([...events, newEvent]);
    }

    setShowModal(false);
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

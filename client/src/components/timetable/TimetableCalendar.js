import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import moment from 'moment';
import EventModal from './EventModal';
import './timetable.css';

const TimetableCalendar = () => {
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Load mock data
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
      },
      {
        id: '2',
        title: 'IT3050 - Tutorial',
        start: '2026-02-18T14:00:00',
        end: '2026-02-18T15:30:00',
        backgroundColor: '#41b883',
        borderColor: '#41b883',
        extendedProps: {
          courseCode: 'IT3050',
          location: 'Lab 2.01'
        }
      }
    ];
    setEvents(mockEvents);
  }, []);

  // When user clicks empty time slot
  const handleDateClick = (info) => {
    setSelectedEvent(null);
    setSelectedSlot({
      start: info.date,
      end: new Date(info.date.getTime() + 60 * 60 * 1000) // +1 hour
    });
    setShowModal(true);
  };

  // When user clicks existing event
  const handleEventClick = (info) => {
    setSelectedEvent(info.event);
    setSelectedSlot(null);
    setShowModal(true);
  };

  // When user drags event
  const handleEventDrop = (info) => {
    const updatedEvents = events.map(e =>
      e.id === info.event.id
        ? { ...e, start: info.event.start, end: info.event.end }
        : e
    );
    setEvents(updatedEvents);
  };

  // When user resizes event
  const handleEventResize = (info) => {
    const updatedEvents = events.map(e =>
      e.id === info.event.id
        ? { ...e, start: info.event.start, end: info.event.end }
        : e
    );
    setEvents(updatedEvents);
  };

  // Save event from modal
  const handleSaveEvent = (eventData) => {
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
      // Update existing
      setEvents(events.map(e => e.id === newEvent.id ? newEvent : e));
    } else {
      // Add new
      setEvents([...events, newEvent]);
    }

    setShowModal(false);
  };

  return (
    <>
      <div className="timetable-container">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          initialView="timeGridWeek"
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
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

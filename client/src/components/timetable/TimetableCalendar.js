import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import moment from 'moment';
import './timetable.css';

const TimetableCalendar = () => {
  const [events, setEvents] = useState([]);
  const [courses, setCourses] = useState([]);

  // Load saved events from database (mock for now)
  useEffect(() => {
    // TODO: Replace with API call
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

  // Handle date click (for adding new events)
  const handleDateClick = (info) => {
    alert(`Would you like to add a class on ${moment(info.date).format('MMMM Do YYYY, h:mm a')}?`);
    // TODO: Open modal for adding event
  };

  // Handle event click (for editing)
  const handleEventClick = (info) => {
    alert(`Edit: ${info.event.title}`);
    // TODO: Open modal with event details
  };

  // Handle event drop (drag to move)
  const handleEventDrop = (info) => {
    console.log('Event moved:', info.event);
    // TODO: Update database
  };

  // Handle event resize
  const handleEventResize = (info) => {
    console.log('Event resized:', info.event);
    // TODO: Update database
  };

  return (
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
  );
};

export default TimetableCalendar;
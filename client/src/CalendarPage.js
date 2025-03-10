import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import axios from 'axios';
import './calendar.css';

const API_URL = 'http://54.242.151.32/api/marshal-calendar';

function CalendarPage({ userRole = 'walker', walkerId }) {
  const [timeSlots, setTimeSlots] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  // Fetch time slots
  const fetchTimeSlots = async () => {
    try {
      const response = await axios.get(`${API_URL}/time-slots`);
      const formattedSlots = response.data.map(slot => ({
        id: slot.id,
        title: slot.walker_name ? `Booked by ${slot.walker_name}` : 'Available',
        start: slot.start_time,
        end: slot.end_time,
        backgroundColor: slot.walker_id ? '#ff9f89' : '#90EE90',
        extendedProps: {
          status: slot.status,
          walkerId: slot.walker_id
        }
      }));
      setTimeSlots(formattedSlots);
    } catch (error) {
      console.error('Error fetching time slots:', error);
    }
  };

  useEffect(() => {
    fetchTimeSlots();
  }, []);

  // Marshal: Create new time slot
  const handleDateSelect = (selectInfo) => {
    if (userRole === 'marshal') {
      setSelectedDate({
        start: selectInfo.start,
        end: selectInfo.end
      });
      setShowModal(true);
    }
  };

  // Marshal: Submit new time slot
  const handleCreateTimeSlot = async () => {
    if (!selectedDate) return;

    try {
      await axios.post(`${API_URL}/time-slots`, {
        start_time: selectedDate.start,
        end_time: selectedDate.end,
        created_by: 'marshal' // In a real app, this would be the marshal's ID
      });
      setShowModal(false);
      setSelectedDate(null);
      fetchTimeSlots();
    } catch (error) {
      console.error('Error creating time slot:', error);
    }
  };

  // Walker: Book a time slot
  const handleEventClick = async (clickInfo) => {
    if (userRole === 'walker' && !clickInfo.event.extendedProps.walkerId) {
      const confirmed = window.confirm('Would you like to book this time slot?');
      if (confirmed) {
        try {
          await axios.put(`${API_URL}/time-slots/${clickInfo.event.id}/book`, {
            walker_id: walkerId
          });
          fetchTimeSlots();
        } catch (error) {
          console.error('Error booking time slot:', error);
        }
      }
    }
  };

  // Cancel booking
  const handleCancelBooking = async (eventId) => {
    try {
      await axios.put(`${API_URL}/time-slots/${eventId}/cancel`);
      fetchTimeSlots();
    } catch (error) {
      console.error('Error cancelling booking:', error);
    }
  };

  // Get initial view based on screen size
  const getInitialView = () => {
    return window.innerWidth < 768 ? 'timeGridDay' : 'timeGridWeek';
  };

  const [currentView, setCurrentView] = useState(getInitialView());

  // Update view on window resize
  useEffect(() => {
    const handleResize = () => {
      const newView = getInitialView();
      if (newView !== currentView) {
        setCurrentView(newView);
        if (calendarRef.current) {
          calendarRef.current.getApi().changeView(newView);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentView]);

  // Custom toolbar component
  const CustomToolbar = ({ calendarRef }) => {
    const handlePrev = () => {
      calendarRef.current.getApi().prev();
    };
    const handleNext = () => {
      calendarRef.current.getApi().next();
    };
    const handleToday = () => {
      calendarRef.current.getApi().today();
    };
    const handleViewChange = (view) => {
      setCurrentView(view);
      calendarRef.current.getApi().changeView(view);
    };

    const isMobile = window.innerWidth < 768;

    return (
      <div className="custom-toolbar">
        <div className="toolbar-title">
          {calendarRef.current?.getApi().view.title}
        </div>
        <div className="toolbar-group">
          <button onClick={handlePrev}>&lt;</button>
          <button onClick={handleToday}>Today</button>
          <button onClick={handleNext}>&gt;</button>
        </div>
        {!isMobile && (
          <div className="toolbar-group">
            <button 
              onClick={() => handleViewChange('timeGridDay')}
              className={currentView === 'timeGridDay' ? 'active' : ''}
            >
              Day
            </button>
            <button 
              onClick={() => handleViewChange('timeGridWeek')}
              className={currentView === 'timeGridWeek' ? 'active' : ''}
            >
              Week
            </button>
            <button 
              onClick={() => handleViewChange('dayGridMonth')}
              className={currentView === 'dayGridMonth' ? 'active' : ''}
            >
              Month
            </button>
          </div>
        )}
      </div>
    );
  };

  const calendarRef = useRef(null);

  return (
    <div className="calendar-container">
      <h2>{userRole === 'marshal' ? 'Marshal Calendar' : 'Walker Calendar'}</h2>
      <CustomToolbar calendarRef={calendarRef} />
      <div className="calendar-wrapper">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={currentView}
          headerToolbar={false}
          editable={false}
          selectable={userRole === 'marshal'}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          events={timeSlots}
          select={handleDateSelect}
          eventClick={handleEventClick}
          height="auto"
          expandRows={true}
          stickyHeaderDates={true}
          handleWindowResize={true}
          windowResizeDelay={100}
          timeZone="local"
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          allDaySlot={false}
          slotDuration="00:30:00"
          snapDuration="00:30:00"
          nowIndicator={true}
          eventDisplay="block"
          eventOverlap={false}
          slotEventOverlap={false}
          views={{
            timeGridWeek: {
              titleFormat: { month: 'short', day: 'numeric' },
              dayHeaderFormat: { weekday: 'short', day: 'numeric' },
              slotLabelFormat: {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              }
            },
            timeGridDay: {
              titleFormat: { month: 'long', day: 'numeric' },
              slotLabelFormat: {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              }
            },
            dayGridMonth: {
              titleFormat: { month: 'long', year: 'numeric' },
              dayHeaderFormat: { weekday: 'short' }
            }
          }}
        />
      </div>

      {/* Modal for creating time slots (Marshal only) */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Create Time Slot</h3>
            <p>
              Start: {selectedDate?.start.toLocaleString()}
              <br />
              End: {selectedDate?.end.toLocaleString()}
            </p>
            <div className="modal-buttons">
              <button onClick={handleCreateTimeSlot}>Create</button>
              <button onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarPage; 
import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import axios from 'axios';
import './calendar.css';

const API_URL = 'http://localhost:8000';

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

  return (
    <div className="calendar-container">
      <h2>{userRole === 'marshal' ? 'Marshal Calendar' : 'Walker Calendar'}</h2>
      <div className="calendar-wrapper">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          editable={false}
          selectable={userRole === 'marshal'}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          events={timeSlots}
          select={handleDateSelect}
          eventClick={handleEventClick}
          height="auto"
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
import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import axios from 'axios';
import './calendar.css';

const API_URL = 'http://localhost:5000';

function CalendarPage() {
  const walker = JSON.parse(localStorage.getItem('walker')) || {};
  const userRole = walker.role || 'Walker';
  const walkerId = walker.id || null;

  const [timeSlots, setTimeSlots] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  // Fetch time slots from backend
  const fetchTimeSlots = async () => {
    try {
      const response = await axios.get(`${API_URL}/time-slots`);
      const formattedSlots = response.data.map(slot => ({
        id: slot.id,
        title: Array.isArray(slot.booked_walkers) && slot.booked_walkers.length > 0
          ? `Booked by ${slot.booked_walkers.map(w => w.walker_name).join(", ")}`
          : 'Available',
        start: slot.start_time,
        end: slot.end_time,
        backgroundColor: Array.isArray(slot.booked_walkers) && slot.booked_walkers.length > 0 ? '#ff9f89' : '#90EE90',
        extendedProps: { 
          status: slot.status, 
          bookedWalkers: Array.isArray(slot.booked_walkers) ? slot.booked_walkers : [] // ✅ Ensure always an array
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

  // Marshal: Select Date to Create Time Slot
  const handleDateSelect = (selectInfo) => {
    if (userRole === 'Marshal') {
      setSelectedDate({
        start: selectInfo.start,
        end: selectInfo.end
      });
      setShowModal(true);
    }
  };

  // Marshal: Delete an Event
  const handleDeleteEvent = async (eventId) => {
    if (userRole === 'Marshal') {
      const confirmed = window.confirm('Are you sure you want to delete this time slot?');
      if (confirmed) {
        try {
          await axios.delete(`${API_URL}/time-slots/${eventId}/delete`);
          fetchTimeSlots();
        } catch (error) {
          console.error('Error deleting time slot:', error);
        }
      }
    }
  };

  // Marshal: Create Time Slot (Fixing Date Format for MySQL)
  const handleCreateTimeSlot = async () => {
    if (!selectedDate) return;

    const formattedStart = new Date(selectedDate.start).toISOString().slice(0, 19).replace('T', ' ');
    const formattedEnd = new Date(selectedDate.end).toISOString().slice(0, 19).replace('T', ' ');

    try {
      await axios.post(`${API_URL}/time-slots`, {
        start_time: formattedStart,
        end_time: formattedEnd,
        created_by: 'marshal' // Can be set to `walker.name` if needed
      });
      setShowModal(false);
      setSelectedDate(null);
      fetchTimeSlots();
    } catch (error) {
      console.error('Error creating time slot:', error);
    }
  };

  // Walker: Book a Time Slot
  const handleEventClick = async (clickInfo) => {
    if (userRole === 'Walker') {
      const bookedWalkers = clickInfo.event.extendedProps.bookedWalkers;
      const alreadyBooked = bookedWalkers.some(w => w.walker_id === walkerId);

      if (alreadyBooked) {
        alert("You have already booked this time slot.");
        return;
      }

      const confirmed = window.confirm('Would you like to book this time slot?');
      if (confirmed) {
        try {
          await axios.put(`${API_URL}/time-slots/${clickInfo.event.id}/book`, {
            walker_id: walkerId,
            walker_name: walker.name
          });
          fetchTimeSlots();
        } catch (error) {
          console.error('Error booking time slot:', error);
        }
      }
    }
  };

  // Walker: Cancel Booking
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
      <h2>{userRole === 'Marshal' ? 'Marshal Calendar' : 'Walker Calendar'}</h2>
      <p>{userRole === 'Marshal' ? 'Schedule new walks' : 'Book available walks'}</p>

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
          selectable={userRole === 'Marshal'}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          events={timeSlots}
          select={handleDateSelect}
          eventClick={handleEventClick}
          height="auto"
        />
      </div>

{/* List of Time Slots with Cancel/Delete Buttons */}
<div className="event-list">
  <h3>Upcoming Walks</h3>
  <ul>
    {timeSlots.map((slot) => (
      <li key={slot.id} className="event-item">
        <div className="event-details">
          <strong>{new Date(slot.start).toLocaleString()}</strong> - {new Date(slot.end).toLocaleString()}
          <br />
          {Array.isArray(slot.bookedWalkers) && slot.bookedWalkers.length > 0 
            ? `Booked by ${slot.bookedWalkers.map(w => w.walker_name).join(", ")}`
            : "Available"}
        </div>

        <div className="event-actions">
          {/* Cancel button for Walkers */}
          {userRole === "Walker" && Array.isArray(slot.bookedWalkers) && slot.bookedWalkers.length > 0 && slot.bookedWalkers.some(w => w.walker_id === walkerId) && (
            <button className="cancel-btn" onClick={() => handleCancelBooking(slot.id)}>Cancel</button>
          )}

          {/* Delete button for Marshals */}
          {userRole === "Marshal" && (
            <button className="delete-btn" onClick={() => handleDeleteEvent(slot.id)}>Delete</button>
          )}
        </div>
      </li>
    ))}
  </ul>
</div>


      {/* Modal for Creating Time Slots (Marshal Only) */}
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

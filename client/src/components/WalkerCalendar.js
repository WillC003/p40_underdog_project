import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import axios from 'axios';
import { auth } from '../firebase';
import './WalkerCalendar.css';

function WalkerCalendar() {
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slotBookings, setSlotBookings] = useState([]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getAuthHeader = async () => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken(true); // <--- force refresh
      return {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
    }
    throw new Error('No user logged in');
  };

  const fetchTimeSlots = async () => {
    try {
      setLoading(true);
      const authHeader = await getAuthHeader();
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/time-slots`, authHeader);
      const formattedSlots = response.data
        .filter(slot => slot.status === 'available' || slot.status === 'booked')
        .map(slot => ({
          id: slot.id,
          title: slot.status === 'booked' ? 'Booked' : 'Available',
          start: new Date(slot.start_time),
          end: new Date(slot.end_time),
          color: slot.status === 'booked' ? '#FFA500' : '#800020',
          extendedProps: { status: slot.status }
        }));
      setTimeSlots(formattedSlots);
      setError('');
    } catch (err) {
      console.error('Error fetching time slots:', err);
      setError('Failed to fetch time slots. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTimeSlots(); }, []);

  const fetchSlotBookingInfo = async (slotId) => {
    try {
      const authHeader = await getAuthHeader();
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/time-slots/${slotId}/bookings`, authHeader);
      return response.data;
    } catch (error) {
      console.error('Error fetching slot booking info:', error);
      return [];
    }
  };

  const handleEventClick = async (info) => {
    const slotId = info.event.id;
    const bookings = await fetchSlotBookingInfo(slotId);
    setSelectedSlot(info.event);
    setSlotBookings(bookings);
    setShowModal(true);
  };

  const handleConfirmBooking = async () => {
    try {
      setLoading(true);
      const authHeader = await getAuthHeader();
      await axios.put(`${process.env.REACT_APP_API_URL}/time-slots/${selectedSlot.id}/book`, {}, authHeader);
      setSuccess('Time slot booked successfully!');
      setShowModal(false);
      await fetchTimeSlots();
    } catch (err) {
      console.error('Error booking time slot:', err.response?.data || err);
      setError(err.response?.data?.error || 'Failed to book time slot. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="walker-calendar-container">
      <h2>Available Time Slots</h2>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      {loading && <div className="loading-message">Loading...</div>}

      {isMobile ? (
        <div className="time-slots-list">
          {timeSlots.length === 0 ? (
            <div className="no-slots-message">No available time slots</div>
          ) : (
            timeSlots.map(slot => (
              <div key={slot.id} className="time-slot-item">
                <div className="time-slot-info">
                  <div className="time-slot-date">{formatDateTime(slot.start)}</div>
                  <div className="time-slot-duration">
                    {new Date(slot.end).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </div>
                </div>
                <button className="book-slot-button" onClick={() => handleEventClick({ event: slot })}>View</button>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="calendar-section">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            selectable={false}
            eventClick={handleEventClick}
            dayMaxEvents={true}
            weekends={true}
            events={timeSlots}
            headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
            timeZone="local"
            slotMinTime="06:00:00"
            slotMaxTime="22:00:00"
            allDaySlot={false}
            slotDuration="00:30:00"
            snapDuration="00:30:00"
          />
        </div>
      )}

      {showModal && selectedSlot && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Confirm Booking</h2>
            <p><strong>Date:</strong> {formatDateTime(selectedSlot.start)}</p>
            <p><strong>Time:</strong> {new Date(selectedSlot.start).toLocaleTimeString()} - {new Date(selectedSlot.end).toLocaleTimeString()}</p>
            <p><strong>Booked:</strong> {slotBookings.length}/4 spots</p>
            <h4>Already Booked:</h4>
            <ul>
              {slotBookings.length > 0 ? slotBookings.map((b, idx) => (
                <li key={idx}>{b.email}</li>
              )) : <li>No one booked yet.</li>}
            </ul>
            <div className="modal-buttons">
              <button className="confirm-btn" onClick={handleConfirmBooking}>Confirm</button>
              <button className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WalkerCalendar;
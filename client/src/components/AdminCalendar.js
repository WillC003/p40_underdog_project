import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import axios from 'axios';
import { auth } from '../firebase';
import './AdminCalendar.css';

function AdminCalendar() {
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [showBlockDayModal, setShowBlockDayModal] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const getAuthHeader = async () => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      return { headers: { Authorization: `Bearer ${token}` } };
    }
    throw new Error('No user logged in');
  };

  const fetchTimeSlots = async () => {
    try {
      const authHeader = await getAuthHeader();
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/time-slots`, authHeader);
      setTimeSlots(response.data.map(slot => ({
        id: slot.id,
        title: slot.type === 'blocked' ? 'BLOCKED' : (slot.status === 'available' ? 'Available' : slot.status),
        start: slot.start_time,
        end: slot.end_time,
        color: slot.type === 'blocked' ? '#808080' : (slot.status === 'available' ? '#800020' : '#FFA500'),
        extendedProps: { type: slot.type, status: slot.status }
      })));
    } catch (err) {
      console.error('Error fetching time slots:', err);
    }
  };

  useEffect(() => {
    fetchTimeSlots();
  }, []);

  const handleBlockDay = async () => {
    try {
      const authHeader = await getAuthHeader();
      await axios.post(`${process.env.REACT_APP_API_URL}/block-day`, { date: selectedDate }, authHeader);
      setShowBlockDayModal(false);
      setSelectedDate('');
      setSuccess('Day blocked successfully!');
      fetchTimeSlots();
    } catch (err) {
      console.error('Error blocking day:', err);
      setError('Failed to block day.');
    }
  };

  return (
    <div className="admin-calendar-container">
      <h2>Admin Calendar</h2>
      <button className="block-day-button" onClick={() => setShowBlockDayModal(true)}>Block a Day</button>
      {success && <div className="success-message">{success}</div>}
      {error && <div className="error-message">{error}</div>}

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        events={timeSlots}
        selectable={false}
        dayMaxEvents={true}
        weekends={true}
        headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
        timeZone="local"
        slotMinTime="06:00:00"
        slotMaxTime="22:00:00"
        allDaySlot={false}
      />

      {showBlockDayModal && (
        <div className="form-modal">
          <div className="modal-content">
            <span className="close-icon" onClick={() => setShowBlockDayModal(false)}>&times;</span>
            <h3>Block a Day</h3>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            <button className="submit-button" onClick={handleBlockDay} disabled={!selectedDate}>Confirm Block</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCalendar;
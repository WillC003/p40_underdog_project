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
      const token = await user.getIdToken();
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
        color: slot.status === 'booked' ? '#FFA500' : '#800020', // orange for booked, maroon for available
        extendedProps: {
          status: slot.status,
          isBooked: slot.status === 'booked'
        }
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

  useEffect(() => {
    fetchTimeSlots();
  }, []);

  const handleBookSlot = async (slotId) => {
    try {
      setLoading(true);
      setError('');
      const authHeader = await getAuthHeader();
      
      await axios.put(
        `${process.env.REACT_APP_API_URL}/time-slots/${slotId}/book`,
        {},
        authHeader
      );
      
      setSuccess('Time slot booked successfully!');
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
                    {new Date(slot.end).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </div>
                </div>
                <button 
                  className="book-slot-button"
                  onClick={() => {
                    if (window.confirm('Would you like to book this time slot?')) {
                      handleBookSlot(slot.id);
                    }
                  }}
                >
                  Book
                </button>
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
            eventClick={(info) => {
              const isBooked = info.event.extendedProps.status === 'booked';
              if (isBooked) {
                alert('This time slot is already booked.');
                return;
              }
            
              if (window.confirm('Would you like to book this time slot?')) {
                handleBookSlot(info.event.id);
              }
            }}
            dayMaxEvents={true}
            weekends={true}
            events={timeSlots}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            timeZone="local"
            slotMinTime="06:00:00"
            slotMaxTime="22:00:00"
            allDaySlot={false}
            slotDuration="00:30:00"
            snapDuration="00:30:00"
          />
        </div>
      )}
    </div>
  );
}

export default WalkerCalendar; 
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'react-calendar/dist/Calendar.css';
import './schedule.css';

function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [walks, setWalks] = useState([]);
  const [eventTime, setEventTime] = useState('');
  const [location, setLocation] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [walker, setWalker] = useState(JSON.parse(localStorage.getItem('walker')) || null);

  const API_URL = 'http://localhost:5000';

  // Fetch walks for the selected date
  const fetchWalksByDate = async (date) => {
    try {
      const formattedDate = date.toISOString().split('T')[0]; // Convert to YYYY-MM-DD
      const response = await axios.get(`${API_URL}/walk-events?date=${formattedDate}`);
      setWalks(response.data);
    } catch (error) {
      console.error('Error fetching walks:', error);
    }
  };

  // Handle date selection to view or schedule walks
  const handleDateClick = (event) => {
    const selected = new Date(event.target.value);
    setSelectedDate(selected);
    fetchWalksByDate(selected);
    if (walker?.role === "Marshal") {
      setShowForm(true);
    }
  };

  // Submit new event (Only Marshals can do this)
  const handleScheduleWalk = async () => {
    if (!eventTime || !location) {
      alert('Please enter event time and location.');
      return;
    }

    const newEvent = {
      eventDate: selectedDate.toISOString().split('T')[0],
      eventTime,
      location,
    };

    try {
      await axios.post(`${API_URL}/walk-events`, newEvent);
      setShowForm(false);
      setEventTime('');
      setLocation('');
      fetchWalksByDate(selectedDate);
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  // Booking a walk (Walkers & Marshals)
  const bookWalk = async (eventId) => {
    if (!walker) {
      alert("You must be logged in to book a walk.");
      return;
    }

    try {
      await axios.post(`${API_URL}/event-bookings`, {
        eventId,
        walkerName: walker.name,
        walkerPhone: walker.phoneNumber || '000-000-0000',
      });
      alert('Walk booked successfully!');
      fetchWalksByDate(selectedDate);
    } catch (error) {
      alert(error.response?.data?.message || 'Error booking walk.');
    }
  };

  return (
    <div className="schedule-container">
      <h2>Schedule & Book Walks</h2>

      {/* Calendar Selection */}
      <div className="calendar">
        <p>Select a date to view or schedule walks:</p>
        <input type="date" onChange={handleDateClick} />
      </div>

      {/* Walk Scheduling Form (Only for Marshals) */}
      {showForm && walker?.role === "Marshal" && (
        <div className="walk-form">
          <h3>Schedule Walk for {selectedDate?.toDateString()}</h3>
          <input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} required />
          <input type="text" placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} required />
          <button onClick={handleScheduleWalk}>Create Walk Event</button>
        </div>
      )}

      {/* Walks for Selected Date */}
      <h3>Walks on {selectedDate ? selectedDate.toDateString() : "Select a Date"}</h3>
      <ul>
        {walks.length > 0 ? (
          walks.map((walk) => (
            <li key={walk.id}>
              <strong>{walk.eventTime}</strong> at {walk.location}
              <span> ({walk.bookedWalkers}/4 slots filled)</span>
              {walk.bookedWalkers < 4 && <button onClick={() => bookWalk(walk.id)}>Book Walk</button>}
            </li>
          ))
        ) : (
          <p>No walks scheduled for this day.</p>
        )}
      </ul>
    </div>
  );
}

export default SchedulePage;

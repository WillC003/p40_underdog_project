import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import axios from 'axios';
import { auth } from '../firebase';
import './MarshalScheduler.css';

function MarshalScheduler() {
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showAddDogForm, setShowAddDogForm] = useState(false);
  const [showLogWalkForm, setShowLogWalkForm] = useState(false);
  const [dogs, setDogs] = useState([]);
  const [walkers, setWalkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // New state for dog form
  const [newDog, setNewDog] = useState({
    name: '',
    breed: '',
    description: '',
    imageUrl: ''
  });

  // New state for walk logging
  const [walkLog, setWalkLog] = useState({
    dogId: '',
    walkerId: '',
    timeSlotId: '',
    notes: ''
  });

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedStartTime, setSelectedStartTime] = useState('');
  const [selectedEndTime, setSelectedEndTime] = useState('');

  useEffect(() => {
    fetchTimeSlots();
    fetchDogs();
    fetchWalkers();
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
      const authHeader = await getAuthHeader();
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/time-slots`, authHeader);
      setTimeSlots(response.data.map(slot => ({
        id: slot.id,
        title: getSlotTitle(slot),
        start: slot.start_time,
        end: slot.end_time,
        color: getSlotColor(slot),
        extendedProps: {
          status: slot.status,
          walkerId: slot.walker_id
        }
      })));
    } catch (err) {
      console.error('Error fetching time slots:', err);
      setError('Failed to fetch time slots');
    }
  };

  const getSlotTitle = (slot) => {
    switch (slot.status) {
      case 'available':
        return 'Available';
      case 'booked':
        return 'Booked';
      case 'completed':
        return 'Completed';
      default:
        return slot.status;
    }
  };

  const getSlotColor = (slot) => {
    switch (slot.status) {
      case 'available':
        return '#800020';
      case 'booked':
        return '#FFA500';
      case 'completed':
        return '#4CAF50';
      default:
        return '#ccc';
    }
  };

  const fetchDogs = async () => {
    try {
      const authHeader = await getAuthHeader();
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/dogs`, authHeader);
      setDogs(response.data);
    } catch (err) {
      console.error('Error fetching dogs:', err);
      setError('Failed to fetch dogs');
    }
  };

  const fetchWalkers = async () => {
    try {
      console.log('Fetching walkers...');
      const authHeader = await getAuthHeader();
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/walkers`, authHeader);
      console.log('Walkers fetched successfully:', response.data);
      setWalkers(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching walkers:', err.response?.data || err);
      setError(err.response?.data?.error || 'Failed to fetch walkers. Please try again.');
      setWalkers([]);
    }
  };

  const handleDateSelect = (selectInfo) => {
    setSelectedSlot({
      start: selectInfo.startStr,
      end: selectInfo.endStr
    });
  };

  const handleMobileTimeSlotSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDate || !selectedStartTime || !selectedEndTime) {
      setError('Please select all date and time fields');
      return;
    }

    const startDateTime = new Date(`${selectedDate}T${selectedStartTime}`);
    const endDateTime = new Date(`${selectedDate}T${selectedEndTime}`);

    if (endDateTime <= startDateTime) {
      setError('End time must be after start time');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const authHeader = await getAuthHeader();
      await axios.post(
        `${process.env.REACT_APP_API_URL}/time-slots`,
        {
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString()
        },
        authHeader
      );
      setSuccess('Time slot added successfully!');
      setSelectedDate('');
      setSelectedStartTime('');
      setSelectedEndTime('');
      fetchTimeSlots();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add time slot');
    } finally {
      setLoading(false);
    }
  };


  const formatDateTimeForMySQL = (dateInput) => {
    const date = new Date(dateInput); // Ensure it's a Date object
    const pad = (n) => n.toString().padStart(2, '0');
    const yyyy = date.getFullYear();
    const MM = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const HH = pad(date.getHours());
    const mm = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
    return `${yyyy}-${MM}-${dd} ${HH}:${mm}:${ss}`;
  };
  const handleCalendarSlotSubmit = async () => {
    if (!selectedSlot?.start || !selectedSlot?.end) {
      setError('Start and end time are required');
      return;
    }
  
    setLoading(true);
    setError('');
    setSuccess('');
  
    try {
      const authHeader = await getAuthHeader();
      await axios.post(
        `${process.env.REACT_APP_API_URL}/time-slots`,
        {
          start_time: formatDateTimeForMySQL(selectedSlot.start),
          end_time: formatDateTimeForMySQL(selectedSlot.end)
        },
        authHeader
      );
  
      setSuccess('Time slot added successfully!');
      setSelectedSlot(null);
      fetchTimeSlots();
    } catch (err) {
      console.error('Error adding slot from calendar:', err.response?.data || err);
      setError(err.response?.data?.error || 'Failed to add time slot');
    } finally {
      setLoading(false);
    }
  };
  const handleAddDog = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const authHeader = await getAuthHeader();
      await axios.post(
        `${process.env.REACT_APP_API_URL}/dogs`, 
        newDog,
        authHeader
      );
      setSuccess('Dog profile added successfully!');
      setNewDog({ name: '', breed: '', description: '', imageUrl: '' });
      setShowAddDogForm(false);
      fetchDogs();
    } catch (err) {
      console.error('Error adding dog:', err);
      setError(err.response?.data?.error || 'Failed to add dog profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogWalk = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Logging walk data:', walkLog);
      const authHeader = await getAuthHeader();
      const walkData = {
        dogId: parseInt(walkLog.dogId),
        walkerId: walkLog.walkerId,
        timeSlotId: parseInt(walkLog.timeSlotId),
        notes: walkLog.notes
      };
      console.log('Formatted walk data:', walkData);
      
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/walks`, 
        walkData,
        authHeader
      );
      console.log('Walk logged successfully:', response.data);
      setSuccess('Walk logged successfully!');
      setWalkLog({ dogId: '', walkerId: '', timeSlotId: '', notes: '' });
      setShowLogWalkForm(false);
      // Refresh time slots to show updated status
      await fetchTimeSlots();
    } catch (err) {
      console.error('Error logging walk:', err.response?.data || err);
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.details ||
                          'Failed to log walk. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Function to generate time options (6 AM to 10 PM in 30-minute intervals)
  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 6; hour <= 22; hour++) {
      for (let minute of ['00', '30']) {
        const time = `${hour.toString().padStart(2, '0')}:${minute}`;
        times.push(time);
      }
    }
    return times;
  };

  return (
    <div className="scheduler-container">
      <div className="scheduler-header">
        <h2>Marshal Dashboard</h2>
        <div className="action-buttons">
          <button onClick={() => setShowAddDogForm(true)} className="action-button">
            Add New Dog
          </button>
          <button onClick={() => setShowLogWalkForm(true)} className="action-button">
            Log Walk
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="calendar-section">
        <h3>Add Available Time Slots</h3>
        
        {isMobile ? (
          <form onSubmit={handleMobileTimeSlotSubmit} className="mobile-time-form">
            <div className="form-group">
              <label>Select Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Start Time:</label>
              <select
                value={selectedStartTime}
                onChange={(e) => setSelectedStartTime(e.target.value)}
                required
              >
                <option value="">Select start time</option>
                {generateTimeOptions().map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>End Time:</label>
              <select
                value={selectedEndTime}
                onChange={(e) => setSelectedEndTime(e.target.value)}
                required
              >
                <option value="">Select end time</option>
                {generateTimeOptions().map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
            
            <button 
              type="submit" 
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Time Slot'}
            </button>
          </form>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            weekends={true}
            events={timeSlots}
            select={handleDateSelect}
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
        )}
      </div>

      {selectedSlot && (
  <div className="form-modal">
    <div className="modal-content">
      <h3>Add Time Slot</h3>
      <p>
        Start: {selectedSlot.start}
        <br />
        End: {selectedSlot.end}
      </p>
      <div className="modal-buttons">
        <button onClick={() => setSelectedSlot(null)} className="cancel-button">
          Cancel
        </button>
        <button onClick={handleCalendarSlotSubmit} disabled={loading} className="submit-button">
          {loading ? 'Adding...' : 'Add Time Slot'}
        </button>
      </div>
    </div>
  </div>
)}

      {showAddDogForm && (
        <div className="form-modal">
          <div className="modal-content">
            <h3>Add New Dog</h3>
            <form onSubmit={handleAddDog}>
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  value={newDog.name}
                  onChange={(e) => setNewDog({ ...newDog, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Breed:</label>
                <input
                  type="text"
                  value={newDog.breed}
                  onChange={(e) => setNewDog({ ...newDog, breed: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description:</label>
                <textarea
                  value={newDog.description}
                  onChange={(e) => setNewDog({ ...newDog, description: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Image URL:</label>
                <input
                  type="url"
                  value={newDog.imageUrl}
                  onChange={(e) => setNewDog({ ...newDog, imageUrl: e.target.value })}
                />
              </div>
              <div className="modal-buttons">
                <button type="button" onClick={() => setShowAddDogForm(false)} className="cancel-button">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="submit-button">
                  {loading ? 'Adding...' : 'Add Dog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLogWalkForm && (
        <div className="form-modal">
          <div className="modal-content">
            <h3>Log Completed Walk</h3>
            <form onSubmit={handleLogWalk}>
              <div className="form-group">
                <label>Dog:</label>
                <select
                  value={walkLog.dogId}
                  onChange={(e) => setWalkLog({ ...walkLog, dogId: e.target.value })}
                  required
                >
                  <option value="">Select a dog</option>
                  {dogs.map(dog => (
                    <option key={dog.id} value={dog.id}>{dog.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Walker:</label>
                <select
                  value={walkLog.walkerId}
                  onChange={(e) => setWalkLog({ ...walkLog, walkerId: e.target.value })}
                  required
                >
                  <option value="">Select a walker</option>
                  {walkers.map(walker => (
                    <option key={walker.id} value={walker.id}>{walker.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Booked Time Slot:</label>
                <select
                  value={walkLog.timeSlotId}
                  onChange={(e) => setWalkLog({ ...walkLog, timeSlotId: e.target.value })}
                  required
                >
                  <option value="">Select a time slot</option>
                  {timeSlots
                    .filter(slot => slot.extendedProps.status === 'booked')
                    .map(slot => (
                      <option key={slot.id} value={slot.id}>
                        {new Date(slot.start).toLocaleString()} - {new Date(slot.end).toLocaleString()}
                      </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Notes:</label>
                <textarea
                  value={walkLog.notes}
                  onChange={(e) => setWalkLog({ ...walkLog, notes: e.target.value })}
                  placeholder="Enter any notes about the walk"
                />
              </div>
              <div className="modal-buttons">
                <button type="button" onClick={() => setShowLogWalkForm(false)} className="cancel-button">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="submit-button">
                  {loading ? 'Logging...' : 'Log Walk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MarshalScheduler; 
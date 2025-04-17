import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { auth } from '../firebase';
import './AdminReports.css';

function AdminReports() {
  const [walks, setWalks] = useState([]);
  const [reportType, setReportType] = useState('upcoming'); // 'upcoming', 'completed', 'dog-stats'
  const [timeRange, setTimeRange] = useState('day');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedWalk, setSelectedWalk] = useState(null);
  const [showWalkModal, setShowWalkModal] = useState(false);
  const [assigningSlot, setAssigningSlot] = useState(null);
  const [availableDogs, setAvailableDogs] = useState([]);
  const [selectedDogIds, setSelectedDogIds] = useState([]);
  const [dogStats, setDogStats] = useState([]);

  const getAuthHeader = async () => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      return {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
    }
    throw new Error('No user logged in');
  };

  const fetchWalks = async () => {
    if (reportType === 'dog-stats') return;
    setLoading(true);
    setError('');
    try {
      const authHeader = await getAuthHeader();
      const response = reportType === 'upcoming'
        ? await axios.get(`${process.env.REACT_APP_API_URL}/upcoming-walks`, authHeader)
        : await axios.get(`${process.env.REACT_APP_API_URL}/walks`, {
            ...authHeader,
            params: { type: reportType, range: timeRange }
          });
      setWalks(response.data);
    } catch (err) {
      console.error('Error fetching walks:', err.response?.data || err);
      setError(err.response?.data?.error || 'Failed to fetch walk data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDogStats = async () => {
    setLoading(true);
    setError('');
    try {
      const authHeader = await getAuthHeader();
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/dog-walk-stats`, authHeader);
      setDogStats(res.data);
    } catch (err) {
      console.error('Error fetching dog walk stats:', err);
      setError('Failed to fetch dog walk stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (reportType === 'dog-stats') {
      fetchDogStats();
    } else {
      fetchWalks();
    }
  }, [reportType, timeRange]);

  return (
    <div className="reports-container">
      <h2>Walk Reports</h2>

      <div className="report-controls">
        <div className="control-group">
          <label>Report Type:</label>
          <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
            <option value="upcoming">Upcoming Walks</option>
            <option value="completed">Completed Walks</option>
            <option value="dog-stats">Dog Walk Stats</option>
          </select>
        </div>

        {reportType === 'completed' && (
          <div className="control-group">
            <label>Time Range:</label>
            <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="total">All Time</option>
            </select>
          </div>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading reports...</div>
      ) : reportType === 'dog-stats' ? (
        <div className="reports-table-container">
          <h3>Dog Walk Stats</h3>
          <table className="reports-table">
            <thead>
              <tr>
                <th>Dog Name</th>
                <th>Breed</th>
                <th>Walks This Week</th>
                <th>Walks This Month</th>
                <th>Last Walked</th>
              </tr>
            </thead>
            <tbody>
              {dogStats.map((dog) => (
                <tr key={dog.id}>
                  <td>{dog.name}</td>
                  <td>{dog.breed}</td>
                  <td>{dog.walks_this_week}</td>
                  <td>{dog.walks_this_month}</td>
                  <td>{dog.last_walked ? new Date(dog.last_walked).toLocaleString() : 'Never'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="reports-table-container">
          <table className="reports-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Dog</th>
                <th>Walker</th>
                <th>Marshal</th>
                <th>Status</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {walks.length === 0 ? (
                <tr>
                  <td colSpan="7">No {reportType} walks found for the selected time range.</td>
                </tr>
              ) : (
                walks.map((walk) => (
                  <tr key={walk.id}>
                    {reportType === 'upcoming' ? (
                      <>
                        <td colSpan="6">
                          <strong>{new Date(walk.start_time).toLocaleString()}</strong><br />
                          Marshal: {walk.marshal_name || 'Unknown'}
                        </td>
                        <td>
                          <button
                            className="assign-button"
                            onClick={async () => {
                              try {
                                const authHeader = await getAuthHeader();
                                setAssigningSlot(walk);
                                const dogRes = await axios.get(`${process.env.REACT_APP_API_URL}/dogs`, authHeader);
                                setAvailableDogs(dogRes.data);
                                setSelectedDogIds([]);
                              } catch (err) {
                                console.error('Failed to load dogs', err);
                              }
                            }}
                          >
                            Assign Dogs
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>
                          <strong>{new Date(walk.start_time).toLocaleString()}</strong><br />
                          {new Date(walk.end_time).toLocaleTimeString()}
                        </td>
                        <td>{walk.dog_name} ({walk.dog_breed})</td>
                        <td>{walk.walker_name || 'Unknown'}</td>
                        <td>{walk.marshal_name || 'Unknown'}</td>
                        <td>{walk.status}</td>
                        <td>{walk.notes || '—'}</td>
                        <td>
                          <button
                            className="view-button"
                            onClick={() => {
                              setSelectedWalk(walk);
                              setShowWalkModal(true);
                            }}
                          >
                            View
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* View Walk Modal */}
      {showWalkModal && selectedWalk && (
        <div className="form-modal">
          <div className="modal-content">
            <span
              className="close-icon"
              onClick={() => {
                setShowWalkModal(false);
                setSelectedWalk(null);
              }}
            >
              &times;
            </span>
            <h3>Walk Details</h3>
            <p><strong>Date:</strong> {new Date(selectedWalk.start_time).toLocaleString()}</p>
            <p><strong>Time:</strong> {new Date(selectedWalk.start_time).toLocaleTimeString()} – {new Date(selectedWalk.end_time).toLocaleTimeString()}</p>
            <p><strong>Marshal:</strong> {selectedWalk.marshal_name || 'Unknown'}</p>
            <p><strong>Walker:</strong> {selectedWalk.walker_name || 'Unknown'}</p>
            <p><strong>Dog:</strong> {selectedWalk.dog_name} ({selectedWalk.dog_breed})</p>
            {selectedWalk.notes && (
              <p><strong>Notes:</strong><br />{selectedWalk.notes}</p>
            )}
          </div>
        </div>
      )}

      {/* Assign Dogs Modal */}
      {assigningSlot && (
        <div className="form-modal">
          <div className="modal-content">
            <span className="close-icon" onClick={() => setAssigningSlot(null)}>&times;</span>
            <h3>Assign Dogs to Walk</h3>
            <p>
              <strong>Time:</strong><br />
              {new Date(assigningSlot.start_time).toLocaleString()} – {new Date(assigningSlot.end_time).toLocaleTimeString()}
            </p>

            <div className="form-group">
              {availableDogs.map((dog) => (
                <label key={dog.id} className="checkbox-label">
                  <input
                    type="checkbox"
                    value={dog.id}
                    checked={selectedDogIds.includes(dog.id)}
                    onChange={(e) => {
                      const updated = e.target.checked
                        ? [...selectedDogIds, dog.id]
                        : selectedDogIds.filter(id => id !== dog.id);
                      setSelectedDogIds(updated);
                    }}
                  />
                  {dog.name} ({dog.breed})
                </label>
              ))}
            </div>

            <div className="modal-buttons">
              <button
                className="submit-button"
                onClick={async () => {
                  try {
                    const authHeader = await getAuthHeader();
                    await axios.post(
                      `${process.env.REACT_APP_API_URL}/time-slots/${assigningSlot.id}/assign-dogs`,
                      { dogIds: selectedDogIds },
                      authHeader
                    );
                    setAssigningSlot(null);
                    setSelectedDogIds([]);
                    alert('Dogs assigned to time slot.');
                  } catch (err) {
                    console.error('Error assigning dogs:', err);
                    alert('Failed to assign dogs.');
                  }
                }}
              >
                Assign Selected Dogs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminReports;
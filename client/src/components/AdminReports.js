import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { auth } from '../firebase';
import './AdminReports.css';

function AdminReports() {
  const [walks, setWalks] = useState([]);
  const [reportType, setReportType] = useState('upcoming'); // upcoming or completed
  const [timeRange, setTimeRange] = useState('day'); // day, week, total
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const fetchWalks = async () => {
    setLoading(true);
    setError('');
    try {
      const authHeader = await getAuthHeader();
      console.log('Fetching walks with params:', { type: reportType, range: timeRange });
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/walks`, {
        ...authHeader,
        params: { type: reportType, range: timeRange }
      });
      console.log('Walks data received:', response.data);
      setWalks(response.data);
    } catch (err) {
      console.error('Error fetching walks:', err.response?.data || err);
      setError(err.response?.data?.error || 'Failed to fetch walk data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalks();
  }, [reportType, timeRange]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'scheduled':
        return 'status-badge scheduled';
      case 'completed':
        return 'status-badge completed';
      case 'cancelled':
        return 'status-badge cancelled';
      default:
        return 'status-badge';
    }
  };

  return (
    <div className="reports-container">
      <h2>Walk Reports</h2>
      
      <div className="report-controls">
        <div className="control-group">
          <label>Report Type:</label>
          <select 
            value={reportType} 
            onChange={(e) => setReportType(e.target.value)}
          >
            <option value="upcoming">Upcoming Walks</option>
            <option value="completed">Completed Walks</option>
          </select>
        </div>

        {reportType === 'completed' && (
          <div className="control-group">
            <label>Time Range:</label>
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
            >
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
              </tr>
            </thead>
            <tbody>
              {walks.map((walk) => (
                <tr key={walk.id}>
                  <td>{formatDate(walk.start_time)}</td>
                  <td>{walk.dog_name} ({walk.dog_breed})</td>
                  <td>{walk.walker_name}</td>
                  <td>{walk.marshal_name}</td>
                  <td>
                    <span className={getStatusBadgeClass(walk.status)}>
                      {walk.status}
                    </span>
                  </td>
                  <td>{walk.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {walks.length === 0 && (
            <div className="no-data">
              No {reportType} walks found for the selected time range.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminReports; 
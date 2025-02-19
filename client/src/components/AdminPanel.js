import React, { useState } from 'react';
import { createMarshalAccount } from '../firebase';
import './Auth.css';

function AdminPanel() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateMarshal = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const { user, error } = await createMarshalAccount(email, password, name, phoneNumber);
      
      if (error) {
        setError(error);
        return;
      }

      if (user) {
        setSuccess('Marshal account created successfully!');
        // Clear form
        setName('');
        setEmail('');
        setPassword('');
        setPhoneNumber('');
      } else {
        setError('Failed to create marshal account');
      }
    } catch (err) {
      setError('Failed to create marshal account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-section">
        <h2>Create Marshal Account</h2>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        <form onSubmit={handleCreateMarshal}>
          <div className="form-group">
            <label>Marshal Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Creating Account...' : 'Create Marshal Account'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminPanel; 
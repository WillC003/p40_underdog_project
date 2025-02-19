import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../firebase';
import './Auth.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { user, role, error } = await login(email, password);
      
      if (error) {
        setError(error);
        setLoading(false);
        return;
      }

      if (user) {
        // Redirect based on role
        switch (role) {
          case 'walker':
            navigate('/walker-calendar');
            break;
          case 'marshal':
            navigate('/marshal-calendar');
            break;
          case 'admin':
            navigate('/admin-panel');
            break;
          default:
            setError('Invalid user role');
            break;
        }
      } else {
        setError('Failed to log in');
      }
    } catch (err) {
      setError('Failed to log in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Login</h2>
        <p className="auth-subtitle">For Walkers and Marshals</p>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>
          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="auth-links">
          <p>New Walker? <Link to="/signup">Sign up here</Link></p>
          <p>Admin? <Link to="/admin-login">Admin Login</Link></p>
        </div>
      </div>
    </div>
  );
}

export default Login; 
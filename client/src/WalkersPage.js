import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './walkers.css';

function WalkersPage() {
  const [walker, setWalker] = useState(JSON.parse(localStorage.getItem('walker')) || null);
  const [walks, setWalks] = useState([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState('Walker'); // Default role is Walker

  const API_URL = 'http://localhost:5000';

  useEffect(() => {
    if (walker) fetchWalks();
  }, [walker]);

  const fetchWalks = async () => {
    try {
      const response = await axios.get(`${API_URL}/walk-events`);
      setWalks(response.data);
    } catch (error) {
      console.error('Error fetching walks:', error);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    const url = isSignup ? `${API_URL}/signup` : `${API_URL}/login`;
    const payload = isSignup ? { name, phoneNumber, email, password, role } : { email, password };

    try {
      const { data } = await axios.post(url, payload);
      if (!isSignup) {
        localStorage.setItem('walker', JSON.stringify(data.walker));
        setWalker(data.walker);
      }
      alert(isSignup ? 'Signup successful! Please log in.' : 'Login successful!');
    } catch (error) {
      alert(error.response?.data?.message || 'Something went wrong!');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('walker');
    setWalker(null);
  };

  return (
    <div className="walkers-container">
      {!walker ? (
        <div className="auth-form">
          <h2>{isSignup ? 'Walker Signup' : 'Walker Login'}</h2>
          <form onSubmit={handleAuth}>
            {isSignup && (
              <>
                <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
                <input type="text" placeholder="Phone Number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="Walker">Walker</option>
                  <option value="Marshal">Marshal</option>
                </select>
              </>
            )}
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit">{isSignup ? 'Sign Up' : 'Login'}</button>
          </form>
          <p onClick={() => setIsSignup(!isSignup)} className="switch-link">
            {isSignup ? 'Already have an account? Login' : "Don't have an account? Sign up"}
          </p>
        </div>
      ) : (
        <div className="walker-dashboard">
          <h2>Welcome, {walker.name}! 👟</h2>
          <p>Role: {walker.role}</p>
          <button onClick={handleLogout} className="logout-button">Logout</button>
        </div>
      )}
    </div>
  );
}

export default WalkersPage;

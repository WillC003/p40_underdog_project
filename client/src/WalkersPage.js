import React, { useState } from 'react';
import axios from 'axios';
import './walkers.css';

function WalkersPage() {
  const [walker, setWalker] = useState(JSON.parse(localStorage.getItem('walker')) || null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState('Walker'); // Default to Walker

  const API_URL = 'http://localhost:5000';

  const handleAuth = async (e) => {
    e.preventDefault();
    const url = isSignup ? `${API_URL}/signup` : `${API_URL}/login`;
    const payload = isSignup ? { name, phoneNumber, email, password, role } : { email, password };
  
    console.log("Sending Data:", payload); // Debugging Log
  
    try {
      const { data } = await axios.post(url, payload);
      console.log("Signup/Login Response:", data); // Debugging Log
  
      if (!isSignup) {
        localStorage.setItem('walker', JSON.stringify(data.walker));
        setWalker(data.walker);
      }
      alert(isSignup ? 'Signup successful! Please log in.' : 'Login successful!');
    } catch (error) {
      console.error("Signup/Login Error:", error.response?.data);
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
          <h2>{isSignup ? 'Walker/Marshal Signup' : 'Walker/Marshal Login'}</h2>
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

import React, { useState } from 'react';
import axios from 'axios';

function WalkerAuth({ onLogin }) {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const API_URL = 'http://localhost:5000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const url = isSignup ? `${API_URL}/signup` : `${API_URL}/login`;
    const payload = isSignup ? { name, phoneNumber, email, password } : { email, password };

    try {
      const { data } = await axios.post(url, payload);
      if (!isSignup) onLogin(data.token, data.walker);
      alert(isSignup ? "Signup successful! Please log in." : "Login successful!");
    } catch (error) {
      alert(error.response?.data?.message || "Something went wrong!");
    }
  };

  return (
    <div className="auth-container">
      <h2>{isSignup ? "Walker Signup" : "Walker Login"}</h2>
      <form onSubmit={handleSubmit}>
        {isSignup && (
          <>
            <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <input type="text" placeholder="Phone Number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
          </>
        )}
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">{isSignup ? "Sign Up" : "Login"}</button>
      </form>
      <p onClick={() => setIsSignup(!isSignup)} style={{ cursor: "pointer", color: "blue" }}>
        {isSignup ? "Already have an account? Login" : "Don't have an account? Sign up"}
      </p>
    </div>
  );
}

export default WalkerAuth;

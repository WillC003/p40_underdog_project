import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import WalkersPage from './WalkersPage';
import DogsPage from './DogsPage';
import SchedulePage from './SchedulePage';
import LandingPage from './LandingPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <nav className="app-nav">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/schedule" className="nav-link">Schedule</Link>
          <Link to="/dogs" className="nav-link">Dogs</Link>
          <Link to="/walkers" className="nav-link">Walkers</Link>
        </nav>

        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/dogs" element={<DogsPage />} />
          <Route path="/walkers" element={<WalkersPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

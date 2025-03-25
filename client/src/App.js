import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import WalkersPage from './WalkersPage';
import DogsPage from './DogsPage';
import LandingPage from './Landing';
import './App.css'; // Import the CSS file

function App() {
  return (
    <Router>
      <div className="app-container">
        <h2 className="app-title">P40 Underdogs Management</h2>

        {/* Navigation */}
        <nav className="app-nav">
          <Link to="/walker" className="nav-link">Walkers</Link>
          <Link to="/" className="nav-link">Landing</Link>
          <Link to="/dogs" className="nav-link">Dogs</Link>
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/walker" element={<WalkersPage />} />
          <Route path="/dogs" element={<DogsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink } from 'react-router-dom';
import WalkersPage from './WalkersPage';
import DogsPage from './DogsPage';
import CalendarPage from './CalendarPage';
import HomePage from './HomePage';
import './App.css'; // Import the CSS file

function App() {
  return (
    <Router>
      <div className="app-container">
        {/* Navigation */}
        <nav className="navbar">
          <div className="nav-brand">
            <Link to="/" className="brand-link">P40 Underdogs</Link>
          </div>
          <div className="nav-links">
            <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} end>
              Home
            </NavLink>
            <NavLink to="/dogs" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              Dogs
            </NavLink>
            <NavLink to="/marshal-calendar" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              Calendar
            </NavLink>
            <NavLink to="/walkers" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              Login
            </NavLink>
          </div>
        </nav>

        {/* Routes */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/walkers" element={<WalkersPage />} />
            <Route path="/dogs" element={<DogsPage />} />
            <Route 
              path="/marshal-calendar" 
              element={<CalendarPage userRole="marshal" />} 
            />
            <Route 
              path="/walker-calendar" 
              element={<CalendarPage userRole="walker" walkerId={1} />} 
            />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-content">
            <div className="footer-section">
              <h3>Contact Us</h3>
              <p>Email: info@p40underdogs.com</p>
              <p>Phone: (555) 123-4567</p>
            </div>
            <div className="footer-section">
              <h3>Quick Links</h3>
              <Link to="/walkers" className="footer-link">Our Walkers</Link>
              <Link to="/dogs" className="footer-link">Dogs</Link>
            </div>
            <div className="footer-section">
              <h3>Follow Us</h3>
              <div className="social-links">
                <a href="#" className="social-link">Facebook</a>
                <a href="#" className="social-link">Instagram</a>
                <a href="#" className="social-link">Twitter</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 P40 Underdogs. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;

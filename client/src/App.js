import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { onAuthStateChange, logOut } from './firebase';
import WalkersPage from './WalkersPage';
import DogsPage from './DogsPage';
import CalendarPage from './CalendarPage';
import HomePage from './HomePage';
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';
import AdminReports from './components/AdminReports';
import MarshalScheduler from './components/MarshalScheduler';
import WalkerCalendar from './components/WalkerCalendar';
import Login from './components/Login';
import Signup from './components/Signup';
import './App.css'; // Import the CSS file

function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(({ user, role }) => {
      setUser(user);
      setUserRole(role);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logOut();
      // Clear local states
      setUser(null);
      setUserRole(null);
      // Force a complete page reload and clear cache
      window.location.replace('/');
      // As a fallback, also clear session storage and local storage
      sessionStorage.clear();
      localStorage.clear();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Protected Route component
  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (loading) {
      return <div className="loading-screen">Loading...</div>;
    }

    // Check if user is authenticated
    if (!user || !user.uid) {
      console.log('No authenticated user found, redirecting to login');
      return <Navigate to="/login" replace />;
    }

    // Check if user has the required role
    if (!userRole || !allowedRoles.includes(userRole)) {
      console.log('User does not have required role, redirecting to home');
      return <Navigate to="/" replace />;
    }

    return children;
  };

  // Check if route should be accessible
  const shouldShowRoute = (requiredRole) => {
    if (!user || !userRole) return false;
    return userRole === requiredRole;
  };

  return (
    <Router>
      <div className="app-container">
        {/* Navigation */}
        <nav className="navbar">
          <div className="nav-brand">
            <Link to="/" className="brand-link">P40 Underdogs</Link>
          </div>
          <button className="mobile-menu-button" onClick={toggleMobileMenu} aria-label="Toggle menu">
            <i className="fas fa-bars"></i>
          </button>
          <div className={`nav-links ${isMobileMenuOpen ? 'show' : ''}`}>
            {user ? (
              <>
                {userRole === 'walker' && (
                  <NavLink to="/walker-calendar" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={closeMobileMenu}>
                    My Calendar
                  </NavLink>
                )}
                {userRole === 'marshal' && (
                  <>
                    <NavLink to="/marshal-calendar" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={closeMobileMenu}>
                      Schedule Walks
                    </NavLink>
                    <NavLink to="/dogs" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={closeMobileMenu}>
                      Dogs
                    </NavLink>
                  </>
                )}
                {userRole === 'admin' && (
                  <>
                    <NavLink to="/admin-panel" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={closeMobileMenu}>
                      Admin Panel
                    </NavLink>
                    <NavLink to="/admin-reports" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={closeMobileMenu}>
                      Reports
                    </NavLink>
                    <NavLink to="/dogs" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={closeMobileMenu}>
                      Dogs
                    </NavLink>
                  </>
                )}
                <button onClick={() => { handleLogout(); closeMobileMenu(); }} className="logout-button">
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={closeMobileMenu} end>
                  Home
                </NavLink>
                <NavLink to="/login" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={closeMobileMenu}>
                  Login
                </NavLink>
                <NavLink to="/signup" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={closeMobileMenu}>
                  Sign Up
                </NavLink>
                <NavLink to="/admin-login" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={closeMobileMenu}>
                  Admin Login
                </NavLink>
              </>
            )}
          </div>
        </nav>

        {/* Routes */}
        <main className="main-content">
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            
            {/* Protected Routes */}
            <Route 
              path="/dogs" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'marshal']}>
                  <DogsPage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/marshal-calendar" 
              element={
                <ProtectedRoute allowedRoles={['marshal']}>
                  <MarshalScheduler />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/walker-calendar" 
              element={
                <ProtectedRoute allowedRoles={['walker']}>
                  <WalkerCalendar />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin-panel" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminPanel />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/admin-reports" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminReports />
                </ProtectedRoute>
              } 
            />

            {/* Catch all route - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
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
              <Link to="/dogs" className="footer-link">Our Dogs</Link>
              {userRole === 'walker' && (
                <Link to="/walker-calendar" className="footer-link">My Calendar</Link>
              )}
            </div>
            <div className="footer-section">
              <h3>Follow Us</h3>
              <div className="social-links">
                <a href="https://www.facebook.com/people/ULM-P-40-Underdogs/61569583151092/#" className="social-link">Facebook</a>
                <a href="https://www.instagram.com/ulm_p40underdogs/" className="social-link">Instagram</a>
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

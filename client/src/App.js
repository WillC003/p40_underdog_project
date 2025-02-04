import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import WalkersPage from './WalkersPage';
import DogsPage from './DogsPage';

function App() {
  return (
    <Router>
      <div style={{ padding: '20px' }}>
        <h1>P40 Underdogs Management</h1>

        {/* Navigation */}
        <nav style={{ marginBottom: '20px' }}>
          <Link to="/" style={{ marginRight: '10px' }}>Walkers</Link>
          <Link to="/dogs">Dogs</Link>
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<WalkersPage />} />
          <Route path="/dogs" element={<DogsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

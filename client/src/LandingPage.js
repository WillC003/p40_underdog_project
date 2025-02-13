import React from 'react';
import './landing.css';

function LandingPage() {
  return (
    <div className="landing-container">
      {/* Header Section with Logo */}
      <header className="landing-header">
        <img src={`${process.env.PUBLIC_URL}/p40_logo.png`} alt="P40 Logo" className="logo" />
        <h1>Welcome to P40 Underdogs</h1>
        <p>Helping shelter dogs find love, walks, and forever homes.</p>
        <a href="/schedule" className="cta-button">Schedule a Walk</a>
      </header>

      {/* Feature Section */}
      <section className="features">
        <div className="feature-box">
          <img src={`${process.env.PUBLIC_URL}/p40_dog.png`} alt="Dog Icon" className="feature-icon" />
          <h2>🐕 View Adoptable Dogs</h2>
          <p>Meet our lovely shelter dogs waiting for a walk or adoption.</p>
          <a href="/dogs" className="feature-link">Explore Dogs</a>
        </div>

        <div className="feature-box">
          <img src={`${process.env.PUBLIC_URL}/p40_paw.png`} alt="Paw Print" className="feature-icon" />
          <h2>👟 Become a Dog Walker</h2>
          <p>Sign up to walk dogs and give them the love they deserve.</p>
          <a href="/walkers" className="feature-link">Join Walkers</a>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;

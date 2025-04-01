import React from 'react';
import './AboutUs.css';

function AboutUs() {
  return (
    <div className="about-container">
      <section className="about-hero">
        <h1>About P40 Underdogs</h1>
        <p>Dedicated to providing professional and caring dog walking services</p>
      </section>

      <section className="about-content">
        <div className="about-section">
          <h2>Our Mission</h2>
          <p>At P40 Underdogs, we believe every dog deserves quality care and exercise. Our mission is to provide professional, reliable, and loving dog walking services to our community.</p>
        </div>

        <div className="about-section">
          <h2>Our Team</h2>
          <p>Our team consists of passionate, experienced dog walkers who are dedicated to providing the best care for your furry friends. All our walkers are thoroughly vetted and trained.</p>
        </div>

        <div className="about-section">
          <h2>Why Choose Us</h2>
          <ul>
            <li>Professional and experienced dog walkers</li>
            <li>Flexible scheduling options</li>
            <li>Real-time updates on your dog's walk</li>
            <li>Insured and bonded services</li>
            <li>Personalized care for each dog</li>
          </ul>
        </div>
      </section>
    </div>
  );
}

export default AboutUs; 
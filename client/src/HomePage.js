import React from 'react';
import './HomePage.css';

function HomePage() {
  // Sample gallery images - replace with your actual dog images
  const galleryImages = [
    { url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb', description: 'Happy Dog Walking' },
    { url: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1', description: 'Professional Care' },
    { url: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b', description: 'Friendly Companions' },
    { url: 'https://images.unsplash.com/photo-1552053831-71594a27632d', description: 'Daily Exercise' },
    { url: 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2', description: 'Group Walks' },
    { url: 'https://images.unsplash.com/photo-1558947530-cbcf6e9aeeae', description: 'Professional Training' }
  ];

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Welcome to P40 Underdogs</h1>
          <p>Professional Dog Walking & Care Services</p>
          <div className="hero-buttons">
            <button className="primary-button">Book a Walk</button>
            <button className="secondary-button">Learn More</button>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="services">
        <h2>Our Services</h2>
        <div className="services-grid">
          <div className="service-card">
            <i className="fas fa-paw"></i>
            <h3>Dog Walking</h3>
            <p>Professional and caring dog walking services</p>
          </div>
          <div className="service-card">
            <i className="fas fa-home"></i>
            <h3>Pet Sitting</h3>
            <p>In-home pet care when you're away</p>
          </div>
          <div className="service-card">
            <i className="fas fa-heart"></i>
            <h3>Special Care</h3>
            <p>Customized care for your pet's needs</p>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="gallery-section">
        <h2>Gallery</h2>
        <div className="gallery-grid">
          {galleryImages.map((image, index) => (
            <div key={index} className="gallery-item">
              <img src={image.url} alt={image.description} />
              <div className="gallery-overlay">
                <p>{image.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="cta-section">
        <h2>Ready to Get Started?</h2>
        <p>Join our community of happy dogs and their owners</p>
        <button className="primary-button">Contact Us Today</button>
      </section>
    </div>
  );
}

export default HomePage; 
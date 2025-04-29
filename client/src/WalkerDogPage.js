import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { auth } from './firebase';
import './WalkerDogPage.css';

function WalkerDogsPage() {
  const [dogs, setDogs] = useState([]);
  const [selectedDog, setSelectedDog] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getAuthHeader = async () => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      return {
        headers: { Authorization: `Bearer ${token}` }
      };
    }
    throw new Error('No user logged in');
  };

  const fetchDogs = async () => {
    try {
      setLoading(true);
      const authHeader = await getAuthHeader();
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/dogs`, authHeader);
      setDogs(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching dogs:', err);
      setError('Failed to load dogs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDogs();
  }, []);

  const handleDogClick = (dog) => {
    setSelectedDog(dog);
    setShowModal(true);
  };

  return (
    <div className="walker-dogs-page">
      <h2>Meet Our Dogs</h2>
      {error && <div className="error-message">{error}</div>}
      {loading ? (
        <div className="loading-message">Loading...</div>
      ) : (
        <div className="dogs-gallery">
          {dogs.map(dog => (
            <div key={dog.id} className="dog-card" onClick={() => handleDogClick(dog)}>
              <img src={dog.imageUrl} alt={dog.name} className="dog-image" />
              <h3 className="dog-name">{dog.name}</h3>
              <p className="dog-breed">{dog.breed}</p>
            </div>
          ))}
        </div>
      )}

      {showModal && selectedDog && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <img src={selectedDog.imageUrl} alt={selectedDog.name} className="modal-dog-image" />
            <h2>{selectedDog.name}</h2>
            <p><strong>Breed:</strong> {selectedDog.breed}</p>
            <p><strong>Description:</strong> {selectedDog.description}</p>
            <p><strong>Grade:</strong> {selectedDog.grade}</p>
            <button className="close-btn" onClick={() => setShowModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default WalkerDogsPage;
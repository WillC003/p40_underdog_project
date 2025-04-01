import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { auth } from './firebase';
import './dogs.css'; // Import the CSS file from the styles folder

const API_URL = 'http://localhost:8000/dogs';

// Get auth header function
const getAuthHeader = async () => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    return {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
  }
  throw new Error('No user logged in');
};

// Modal for adding and editing a dog
function DogModal({ isOpen, onClose, onSubmit, initialData, mode }) {
  const [name, setName] = useState(initialData ? initialData.name : '');
  const [breed, setBreed] = useState(initialData ? initialData.breed : '');
  const [description, setDescription] = useState(initialData ? initialData.description : '');
  const [imageUrl, setImageUrl] = useState(initialData ? initialData.imageUrl : '');

  // Update form fields when modal opens or when initialData changes
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setBreed(initialData.breed);
      setDescription(initialData.description);
      setImageUrl(initialData.imageUrl);
    } else {
      setName('');
      setBreed('');
      setDescription('');
      setImageUrl('');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !breed || !description || !imageUrl) {
      alert('Please fill in all fields');
      return;
    }
    onSubmit({ name, breed, description, imageUrl });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{mode === 'edit' ? 'Edit Dog' : 'Add New Dog'}</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Breed"
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
          />
          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <input
            type="text"
            placeholder="Image URL"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
          <div className="modal-buttons">
            <button type="submit" className="modal-submit">
              {mode === 'edit' ? 'Update Dog' : 'Add Dog'}
            </button>
            <button type="button" onClick={onClose} className="modal-cancel">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal for confirming deletion
function DeleteModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Confirm Delete</h2>
        <p>Are you sure you want to delete this dog?</p>
        <div className="modal-buttons">
          <button onClick={onConfirm} className="modal-delete">
            Delete
          </button>
          <button onClick={onClose} className="modal-cancel">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function DogsPage() {
  const [dogs, setDogs] = useState([]);
  const [isDogModalOpen, setIsDogModalOpen] = useState(false);
  const [dogModalMode, setDogModalMode] = useState('add'); // 'add' or 'edit'
  const [editingDog, setEditingDog] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [dogToDelete, setDogToDelete] = useState(null);

  const fetchDogs = async () => {
    try {
      const authHeader = await getAuthHeader();
      const response = await axios.get(API_URL, authHeader);
      setDogs(response.data);
    } catch (error) {
      console.error('Error fetching dogs:', error);
    }
  };

  useEffect(() => {
    fetchDogs();
  }, []);

  const openAddModal = () => {
    setDogModalMode('add');
    setEditingDog(null);
    setIsDogModalOpen(true);
  };

  const openEditModal = (dog) => {
    setDogModalMode('edit');
    setEditingDog(dog);
    setIsDogModalOpen(true);
  };

  const closeDogModal = () => {
    setIsDogModalOpen(false);
  };

  const handleDogModalSubmit = async (dogData) => {
    try {
      const authHeader = await getAuthHeader();
      if (dogModalMode === 'add') {
        await axios.post(API_URL, dogData, authHeader);
      } else if (dogModalMode === 'edit' && editingDog) {
        await axios.put(`${API_URL}/${editingDog.id}`, dogData, authHeader);
      }
      closeDogModal();
      fetchDogs();
    } catch (error) {
      console.error('Error submitting dog data:', error);
    }
  };

  const openDeleteModal = (dog) => {
    setDogToDelete(dog);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!dogToDelete) return;
    try {
      const authHeader = await getAuthHeader();
      await axios.delete(`${API_URL}/${dogToDelete.id}`, authHeader);
      closeDeleteModal();
      fetchDogs();
    } catch (error) {
      console.error('Error deleting dog:', error);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Dogs Management</h1>
      
      <section className="section">
        <h2>Add New Dog</h2>
        <form onSubmit={handleDogModalSubmit}>
          <div className="form-group">
            <label className="form-label">Name:</label>
            <input
              type="text"
              className="form-input"
              value={editingDog?.name}
              onChange={(e) => setEditingDog({ ...editingDog, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Breed:</label>
            <input
              type="text"
              className="form-input"
              value={editingDog?.breed}
              onChange={(e) => setEditingDog({ ...editingDog, breed: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Age:</label>
            <input
              type="number"
              className="form-input"
              value={editingDog?.age}
              onChange={(e) => setEditingDog({ ...editingDog, age: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">Add Dog</button>
        </form>
      </section>

      <section className="section">
        <h2>Dogs List</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Breed</th>
                <th>Age</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {dogs.map((dog) => (
                <tr key={dog.id}>
                  <td>{dog.name}</td>
                  <td>{dog.breed}</td>
                  <td>{dog.age}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-edit"
                        onClick={() => openEditModal(dog)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => openDeleteModal(dog)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {editingDog && (
        <div className="modal">
          <div className="modal-content section">
            <h2>Edit Dog</h2>
            <form onSubmit={handleDogModalSubmit}>
              <div className="form-group">
                <label className="form-label">Name:</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingDog.name}
                  onChange={(e) => setEditingDog({ ...editingDog, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Breed:</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingDog.breed}
                  onChange={(e) => setEditingDog({ ...editingDog, breed: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Age:</label>
                <input
                  type="number"
                  className="form-input"
                  value={editingDog.age}
                  onChange={(e) => setEditingDog({ ...editingDog, age: e.target.value })}
                  required
                />
              </div>
              <div className="action-buttons">
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingDog(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DogModal
        isOpen={isDogModalOpen}
        onClose={closeDogModal}
        onSubmit={handleDogModalSubmit}
        initialData={editingDog}
        mode={dogModalMode}
      />
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

export default DogsPage;

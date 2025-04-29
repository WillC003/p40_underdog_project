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
  const [grade, setGrade] = useState('grey');
  const [imageFile, setImageFile] = useState(null);

  // Update form fields when modal opens or when initialData changes
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setBreed(initialData.breed);
      setDescription(initialData.description);
      setImageUrl(initialData.imageUrl);
      setGrade(initialData.grade || 'grey')
    } else {
      setName('');
      setBreed('');
      setDescription('');
      setImageUrl('');
      setGrade('grey');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !breed || !description || !imageFile) {
      alert('Please fill in all fields');
      return;
    }
  
    const formData = new FormData();
    formData.append('name', name);
    formData.append('breed', breed);
    formData.append('description', description);
    formData.append('grade', grade);
    formData.append('image', imageFile);
  
    onSubmit(formData); // Send the FormData to parent component
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
  type="file"
  onChange={(e) => setImageFile(e.target.files[0])}
/>
          <div className="modal-buttons">
            <button type="submit" className="modal-submit">
              {mode === 'edit' ? 'Update Dog' : 'Add Dog'}
            </button>
            <button type="button" onClick={onClose} className="modal-cancel">
              Cancel
            </button>
          </div>
          <div className="form-group">
            <label>Grade</label>
            <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            required
           >
              <option value="grey">Grey (Needs training)</option>
              <option value="maroon">Maroon (Medium)</option>
              <option value="gold">Gold (Excellent walker)</option>
            </select>
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

  const handleDogModalSubmit = async (formData) => {
    try {
      const authHeader = await getAuthHeader();
      const config = {
        ...authHeader,
        headers: {
          ...authHeader.headers,
          'Content-Type': 'multipart/form-data'
        }
      };
  
      if (dogModalMode === 'add') {
        await axios.post(API_URL, formData, config);
      } else if (dogModalMode === 'edit' && editingDog) {
        await axios.put(`${API_URL}/${editingDog.id}`, formData, config);
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
    <div className="dogs-page">
      <header className="header">
        <h1>Gallery</h1>
        <button onClick={openAddModal} className="btn add-btn">
          Add New Dog
        </button>
      </header>
      <div className="gallery">
        {dogs.map((dog) => (
          <div key={dog.id} className={`dog-card ${dog.grade}`}>
            <img 
  src={`data:image/jpeg;base64,${dog.image}`} 
  alt={dog.name} 
  className="dog-image" 
/>
            <h3 className="dog-name">{dog.name}</h3>
            <p className="dog-breed">{dog.breed}</p>
            <div className="card-buttons">
              <button onClick={() => openEditModal(dog)} className="btn edit-btn">
                Edit
              </button>
              <button onClick={() => openDeleteModal(dog)} className="btn delete-btn">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
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

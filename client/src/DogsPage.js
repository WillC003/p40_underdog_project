import React, { useState, useEffect } from 'react';
import axios from 'axios';

function DogsPage() {
  const [dogs, setDogs] = useState([]);
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [editingDog, setEditingDog] = useState(null);

  const API_URL = 'http://localhost:5000/dogs';

  const fetchDogs = async () => {
    const response = await axios.get(API_URL);
    setDogs(response.data);
  };

  useEffect(() => {
    fetchDogs();
  }, []);

  const createDog = async () => {
    if (!name || !breed || !description || !imageUrl) return alert('Please fill in all fields');
    await axios.post(API_URL, { name, breed, description, imageUrl });
    setName('');
    setBreed('');
    setDescription('');
    setImageUrl('');
    fetchDogs();
  };

  const updateDog = async () => {
    if (!name || !breed || !description || !imageUrl) return alert('Please fill in all fields');
    await axios.put(`${API_URL}/${editingDog.id}`, { name, breed, description, imageUrl });
    setEditingDog(null);
    setName('');
    setBreed('');
    setDescription('');
    setImageUrl('');
    fetchDogs();
  };

  const deleteDog = async (id) => {
    await axios.delete(`${API_URL}/${id}`);
    fetchDogs();
  };

  const handleEdit = (dog) => {
    setEditingDog(dog);
    setName(dog.name);
    setBreed(dog.breed);
    setDescription(dog.description);
    setImageUrl(dog.imageUrl);
  };

  return (
    <div>
      <h2>Dog Management</h2>
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ marginRight: '10px' }}
      />
      <input
        type="text"
        placeholder="Breed"
        value={breed}
        onChange={(e) => setBreed(e.target.value)}
        style={{ marginRight: '10px' }}
      />
      <input
        type="text"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        style={{ marginRight: '10px' }}
      />
      <input
        type="text"
        placeholder="Image URL"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
        style={{ marginRight: '10px' }}
      />
      {editingDog ? (
        <button onClick={updateDog}>Update Dog</button>
      ) : (
        <button onClick={createDog}>Add Dog</button>
      )}

      <div style={{ marginTop: '20px' }}>
        {dogs.map((dog) => (
          <div key={dog.id} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
            <img src={dog.imageUrl} alt={dog.name} style={{ width: '100px', height: '100px', objectFit: 'cover' }} />
            <h3>{dog.name}</h3>
            <p><strong>Breed:</strong> {dog.breed}</p>
            <p><strong>Description:</strong> {dog.description}</p>
            <button onClick={() => handleEdit(dog)} style={{ marginRight: '5px' }}>Edit</button>
            <button onClick={() => deleteDog(dog.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DogsPage;

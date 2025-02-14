import React, { useState, useEffect } from 'react';
import axios from 'axios';

function WalkersPage() {
  const [walkers, setWalkers] = useState([]);
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [editingWalker, setEditingWalker] = useState(null);

  const API_URL = 'http://localhost:8000/walkers';

  const fetchWalkers = async () => {
    const response = await axios.get(API_URL);
    setWalkers(response.data);
  };

  useEffect(() => {
    fetchWalkers();
  }, []);

  const createWalker = async () => {
    if (!name || !phoneNumber) return alert('Please fill in all fields');
    await axios.post(API_URL, { name, phoneNumber });
    setName('');
    setPhoneNumber('');
    fetchWalkers();
  };

  const updateWalker = async () => {
    if (!name || !phoneNumber) return alert('Please fill in all fields');
    await axios.put(`${API_URL}/${editingWalker.id}`, { name, phoneNumber });
    setEditingWalker(null);
    setName('');
    setPhoneNumber('');
    fetchWalkers();
  };

  const deleteWalker = async (id) => {
    await axios.delete(`${API_URL}/${id}`);
    fetchWalkers();
  };

  const handleEdit = (walker) => {
    setEditingWalker(walker);
    setName(walker.name);
    setPhoneNumber(walker.phoneNumber);
  };

  return (
    <div>
      <h2>Walker Management</h2>
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ marginRight: '10px' }}
      />
      <input
        type="number"
        placeholder="Phone Number"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        style={{ marginRight: '10px' }}
      />
      {editingWalker ? (
        <button onClick={updateWalker}>Update Walker</button>
      ) : (
        <button onClick={createWalker}>Add Walker</button>
      )}

      <ul style={{ marginTop: '20px' }}>
        {walkers.map((walker) => (
          <li key={walker.id} style={{ marginBottom: '10px' }}>
            <strong>{walker.name}</strong> - {walker.phoneNumber}
            <button onClick={() => handleEdit(walker)} style={{ marginLeft: '10px' }}>Edit</button>
            <button onClick={() => deleteWalker(walker.id)} style={{ marginLeft: '5px' }}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default WalkersPage;
